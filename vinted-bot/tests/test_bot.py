from vinted_bot.main import Bot, Search
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


class Recorder:
    def __init__(self):
        self.alerts = []

    def send_text(self, text):
        pass

    def send_alert(self, search, item, verdict):
        self.alerts.append((item.id, verdict.kind))


def test_first_pass_learns_market_then_alerts_on_new_cheap_item(tmp_path):
    bot = Bot({"database": str(tmp_path / "b.db")}, [Search("dunk", {}, Rules())])
    bot.client, bot.notifier, bot.pause = FakeClient(), Recorder(), lambda: None

    assert bot.poll(bot.searches[0]) == 0          # échantillon initial, aucune alerte
    bot.client.items.insert(0, make_item(500, 15))
    assert bot.poll(bot.searches[0]) == 1
    assert bot.notifier.alerts == [(500, "error")]
    assert bot.poll(bot.searches[0]) == 0          # jamais deux fois la même annonce
