import json
import threading
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

import pytest
import requests

from vinted_bot import resale
from vinted_bot.app import Scanner, Search, make_handler, safe_url
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
    scanner = Scanner({"database": str(tmp_path / "b.db")}, [Search("dunk", {}, Rules())])
    scanner.client, scanner.pause = FakeClient(), lambda: None

    assert scanner.poll(scanner.searches[0]) == 0      # échantillon initial, aucune affaire
    scanner.client.items.insert(0, make_item(500, 15))
    assert scanner.poll(scanner.searches[0]) == 1
    assert scanner.poll(scanner.searches[0]) == 0      # jamais deux fois la même annonce

    state = scanner.state()
    assert [(d["id"], d["kind"]) for d in state["deals"]] == [(500, "error")]
    assert state["deals"][0]["buy_url"].endswith("item_id%5D=500")


def test_scan_only_while_page_is_open(tmp_path):
    scanner = Scanner({"database": str(tmp_path / "b.db")}, [Search("dunk", {}, Rules())])
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


@pytest.fixture
def server(tmp_path):
    def start(access_code=None):
        scanner = Scanner({"database": str(tmp_path / "s.db")}, [Search("dunk", {}, Rules())])
        srv = ThreadingHTTPServer(("127.0.0.1", 0), None)
        port = srv.server_address[1]
        srv.RequestHandlerClass = make_handler(scanner, access_code, port)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        started.append(srv)
        return port

    started = []
    yield start
    for srv in started:
        srv.shutdown()


def request(port, method="GET", path="/api/state", headers=None, body=None):
    conn = HTTPConnection("127.0.0.1", port)
    conn.request(method, path, body=body, headers={"Host": f"localhost:{port}", **(headers or {})})
    r = conn.getresponse()
    r.read()
    return r


def test_local_mode_blocks_other_sites_and_dns_rebinding(server):
    port = server()
    assert request(port).status == 200
    assert request(port, headers={"Host": f"evil.example:{port}"}).status == 403
    assert request(port, "POST", "/api/resale", {"Origin": "https://evil.example"}, b'{"id": 1}').status == 403
    page = request(port, path="/")
    assert page.status == 200 and "script-src 'self'" in page.getheader("Content-Security-Policy")


def test_lan_mode_requires_access_code(server):
    port = server(access_code="secret123")
    assert request(port).status == 403
    assert request(port, path="/?code=mauvais").status == 403
    login = request(port, path="/?code=secret123")
    assert login.status == 303 and "HttpOnly" in login.getheader("Set-Cookie")
    assert request(port, headers={"Cookie": "code=secret123"}).status == 200
