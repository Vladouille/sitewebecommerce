import json

import pytest
import requests

from vinted_bot import resale
from vinted_bot.scanner import Scanner, Search, safe_url
from vinted_bot.server import create_app
from vinted_bot.resale import AIConfig, write_listing
from vinted_bot.pricing import Rules, evaluate
from vinted_bot.storage import Storage
from vinted_bot.vinted import Item, parse_item, search_url_to_params


def make_item(id, price, title="Nike Dunk Low", brand="Nike", status="Très bon état"):
    return Item(id=id, title=title, price=price, total_price=price + 1, currency="EUR",
                brand=brand, size="42", status=status, url=f"https://www.vinted.fr/items/{id}",
                photo_url=None, seller="vendeur")


def market(tmp_path, prices, **kw):
    store = Storage(tmp_path / "t.db")
    for i, p in enumerate(prices, start=1):
        store.record("dunk", make_item(i, p, **kw))
    return store


def test_search_url_to_params():
    url = ("https://www.vinted.fr/catalog?search_text=nike%20dunk&brand_ids[]=53"
           "&status_ids[]=6&status_ids[]=1&price_to=150&order=newest_first")
    assert search_url_to_params(url) == {
        "search_text": "nike dunk", "brand_ids": "53", "status_ids": "6,1", "price_to": "150",
    }


def test_parse_item_api_shape():
    raw = {"id": 42, "title": "Dunk", "price": {"amount": "25.0", "currency_code": "EUR"},
           "total_item_price": {"amount": "27.45"}, "brand_title": "Nike", "size_title": "42",
           "status": "Neuf", "url": "https://www.vinted.fr/items/42-dunk",
           "photo": {"url": "https://img/1.jpg"}, "user": {"login": "bob"}}
    item = parse_item(raw, "www.vinted.fr")
    assert (item.price, item.total_price, item.seller) == (25.0, 27.45, "bob")
    assert item.buy_url("www.vinted.fr").endswith("transaction%5Bitem_id%5D=42")


def test_detects_error_and_deal(tmp_path):
    store = market(tmp_path, [100] * 20)
    rules = Rules()
    assert evaluate(store, "dunk", make_item(999, 20), rules).kind == "error"
    assert evaluate(store, "dunk", make_item(998, 55), rules).kind == "deal"
    assert evaluate(store, "dunk", make_item(997, 80), rules) is None


def test_needs_enough_samples(tmp_path):
    store = market(tmp_path, [100] * 5)
    assert evaluate(store, "dunk", make_item(999, 10), Rules()) is None


def test_excluded_keywords_use_whole_words(tmp_path):
    store = market(tmp_path, [100] * 20)
    rules = Rules(exclude_keywords=("boîte vide", "hs"))
    assert evaluate(store, "dunk", make_item(999, 10, title="Boîte vide Dunk"), rules) is None
    assert evaluate(store, "dunk", make_item(998, 10, title="Dunk highs"), rules) is not None


def test_falls_back_to_whole_search_when_brand_is_rare(tmp_path):
    store = market(tmp_path, [100] * 20, brand="Nike")
    verdict = evaluate(store, "dunk", make_item(999, 10, brand="Adidas"), Rules())
    assert verdict.basis == "toute la recherche"


class FakeClient:
    def __init__(self):
        self.items = [make_item(i, 100) for i in range(1, 31)]

    def search(self, params, order="newest_first", page=1, per_page=96):
        return list(self.items) if page == 1 else []


def test_first_pass_learns_market_then_finds_new_cheap_item(tmp_path):
    scanner = Scanner(Storage(tmp_path / "b.db"))
    scanner.client, scanner.pause = FakeClient(), lambda: None
    search = Search("dunk", {}, Rules())

    assert scanner.poll(search) == 0                   # échantillon initial, aucune affaire
    scanner.client.items.insert(0, make_item(500, 15))
    assert scanner.poll(search) == 1
    assert scanner.poll(search) == 0                   # jamais deux fois la même annonce

    state = scanner.state()
    assert [(d["id"], d["kind"]) for d in state["deals"]] == [(500, "error")]
    assert state["deals"][0]["buy_url"].endswith("item_id%5D=500")


def test_scan_only_while_page_is_open(tmp_path):
    scanner = Scanner(Storage(tmp_path / "b.db"))
    assert not scanner.active
    scanner.state()                                    # la page interroge le bot
    assert scanner.active


def cheap_deal(tmp_path):
    store = market(tmp_path, [100] * 20)
    item = make_item(999, 20)
    item.photo_url = "https://images1.vinted.net/1.jpg"
    return item, evaluate(store, "dunk", item, Rules())


def test_template_listing_is_free_and_prices_come_from_market(tmp_path):
    item, verdict = cheap_deal(tmp_path)
    listing = write_listing(item, verdict, AIConfig(provider="template"))
    assert listing["source"] == "modèle intégré"
    assert (listing["suggested_price"], listing["quick_sale_price"]) == (94.0, 79.0)
    assert listing["estimated_profit"] == 73.0           # 94 - 21 payés
    assert "Nike" in listing["title"] and len(listing["title"]) <= 60
    assert "[À COMPLÉTER" in listing["description"]


def test_local_ai_is_used_when_ollama_answers(tmp_path, monkeypatch):
    item, verdict = cheap_deal(tmp_path)
    sent = {}

    class Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return {"message": {"content": json.dumps({
                "title": "Nike Dunk Low Panda T42", "description": "Très bon état.",
                "hashtags": ["#nike"], "photo_tips": ["Lumière du jour"]})}}

    def fake_post(url, json=None, timeout=None):
        sent.update(url=url, body=json)
        return Resp()

    monkeypatch.setattr(resale.requests, "post", fake_post)
    monkeypatch.setattr(resale, "_photo_base64", lambda url: "QUJD")
    listing = write_listing(item, verdict, AIConfig())
    assert listing["source"] == "IA locale (gemma3:4b)"
    assert listing["title"] == "Nike Dunk Low Panda T42"
    assert listing["suggested_price"] == 94.0             # le prix ne vient jamais de l'IA
    assert sent["url"] == "http://localhost:11434/api/chat"
    assert sent["body"]["messages"][1]["images"] == ["QUJD"]


def test_falls_back_to_template_when_local_ai_is_off(tmp_path, monkeypatch):
    item, verdict = cheap_deal(tmp_path)

    def down(*a, **k):
        raise requests.ConnectionError("refusée")

    monkeypatch.setattr(resale.requests, "post", down)
    monkeypatch.setattr(resale, "_photo_base64", lambda url: None)
    assert write_listing(item, verdict, AIConfig())["source"] == "modèle intégré"


def test_photos_only_downloaded_from_vinted(monkeypatch):
    monkeypatch.setattr(resale.requests, "get", lambda *a, **k: pytest.fail("téléchargement interdit"))
    assert resale._photo_base64("http://images1.vinted.net/1.jpg") is None
    assert resale._photo_base64("https://evil.example/1.jpg") is None
    assert resale._photo_base64("https://vinted.net.evil.example/1.jpg") is None


def test_links_are_restricted_to_vinted():
    d = "www.vinted.fr"
    assert safe_url("https://www.vinted.fr/items/1", d, "x") == "https://www.vinted.fr/items/1"
    assert safe_url("javascript:alert(1)", d, "x") == "x"
    assert safe_url("https://evil.example/items/1", d, "x") == "x"


def test_searches_and_settings_come_from_the_site(tmp_path):
    store = Storage(tmp_path / "b.db")
    store.add_search("Dunk", "https://www.vinted.fr/catalog?search_text=dunk&brand_ids[]=53", 150)
    store.set_settings({"deal_discount": 0.3, "error_discount": 0.6, "exclude_keywords": ["copie"]})
    [search] = Scanner(store).searches()
    assert search.params == {"search_text": "dunk", "brand_ids": "53"}
    assert (search.rules.deal_discount, search.rules.max_price) == (0.3, 150)
    assert search.rules.exclude_keywords == ("copie",)


PASSWORD = "un-mot-de-passe-solide"
SAME_ORIGIN = {"Origin": "http://localhost"}


@pytest.fixture
def site(tmp_path):
    scanner = Scanner(Storage(tmp_path / "s.db"))
    app = create_app(scanner, PASSWORD, "cle-de-test", secure_cookies=False)
    return app.test_client(), scanner


def login(client, password=PASSWORD, headers=SAME_ORIGIN):
    return client.post("/login", data={"password": password}, headers=headers)


def test_everything_requires_login(site):
    client, _ = site
    assert client.get("/").headers["Location"] == "/login"
    assert client.get("/api/state").status_code == 401
    assert client.get("/healthz").status_code == 200
    assert login(client, "mauvais").headers["Location"] == "/login?erreur=1"
    assert client.get("/api/state").status_code == 401
    assert login(client).headers["Location"] == "/"
    assert client.get("/api/state").status_code == 200


def test_login_is_locked_after_five_failures(site, monkeypatch):
    client, _ = site
    monkeypatch.setattr("vinted_bot.server.time.sleep", lambda s: None)
    for _ in range(5):
        login(client, "mauvais")
    assert login(client).headers["Location"] == "/login?erreur=bloque"   # même le bon mot de passe


def test_session_cookie_is_protected(tmp_path):
    app = create_app(Scanner(Storage(tmp_path / "s.db")), PASSWORD, "cle", secure_cookies=True)
    cookie = login(app.test_client()).headers["Set-Cookie"]
    assert "HttpOnly" in cookie and "SameSite=Strict" in cookie and "Secure" in cookie


def test_other_sites_cannot_post(site):
    client, _ = site
    login(client)
    body = {"name": "Dunk", "url": "https://www.vinted.fr/catalog?search_text=dunk"}
    assert client.post("/api/searches", json=body).status_code == 403            # pas d'origine
    assert client.post("/api/searches", json=body,
                       headers={"Origin": "https://evil.example"}).status_code == 403
    assert login(client.application.test_client(), headers={"Origin": "https://evil.example"}).status_code == 403


def test_search_management_validates_urls(site):
    client, scanner = site
    login(client)
    bad = client.post("/api/searches", headers=SAME_ORIGIN,
                      json={"name": "x", "url": "https://evil.example/catalog?search_text=a"})
    assert bad.status_code == 400
    ok = client.post("/api/searches", headers=SAME_ORIGIN, json={
        "name": "Dunk", "url": "https://www.vinted.fr/catalog?search_text=dunk", "max_price": "120"})
    assert ok.status_code == 201
    [search] = ok.get_json()["searches"]
    assert search["max_price"] == 120
    gone = client.delete(f"/api/searches/{search['id']}", headers=SAME_ORIGIN)
    assert gone.get_json()["searches"] == []


def test_settings_are_validated(site):
    client, _ = site
    login(client)
    bad = client.put("/api/settings", headers=SAME_ORIGIN,
                     json={"deal_discount": 0.8, "error_discount": 0.5, "exclude_keywords": []})
    assert bad.status_code == 400
    ok = client.put("/api/settings", headers=SAME_ORIGIN,
                    json={"deal_discount": 0.3, "error_discount": 0.6, "exclude_keywords": ["copie"]})
    assert ok.get_json()["deal_discount"] == 0.3


def test_security_headers(site):
    client, _ = site
    r = client.get("/login")
    assert "script-src 'self'" in r.headers["Content-Security-Policy"]
    assert r.headers["X-Frame-Options"] == "DENY"


def test_short_password_is_refused(tmp_path):
    with pytest.raises(SystemExit):
        create_app(Scanner(Storage(tmp_path / "s.db")), "court", "cle")


def test_single_file_version_is_up_to_date(tmp_path, monkeypatch):
    import build_single_file
    committed = build_single_file.OUTPUT.read_text(encoding="utf-8")
    monkeypatch.setattr(build_single_file, "OUTPUT", tmp_path / "vinted_deals.py")
    build_single_file.main()
    assert (tmp_path / "vinted_deals.py").read_text(encoding="utf-8") == committed, \
        "Relance : python build_single_file.py"
