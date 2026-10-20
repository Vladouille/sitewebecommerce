"""Appli web locale : scanne Vinted uniquement tant que la page est ouverte."""
from __future__ import annotations

import argparse
import json
import logging
import os
import random
import threading
import time
import webbrowser
from dataclasses import dataclass, fields
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import requests
import yaml

from .pricing import Rules, Verdict, evaluate
from .resale import ResaleError, write_listing
from .storage import Storage
from .vinted import Item, VintedBlocked, VintedClient, search_url_to_params

log = logging.getLogger("vinted_bot")
WEB_DIR = Path(__file__).parent / "web"
IDLE_AFTER_SECONDS = 45   # plus de page ouverte depuis 45 s : le scan se met en pause


@dataclass
class Search:
    name: str
    params: dict[str, str]
    rules: Rules


def load_config(path: str) -> tuple[dict, list[Search]]:
    with open(path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    rule_keys = {f.name for f in fields(Rules)}
    defaults = {k: v for k, v in (cfg.get("rules") or {}).items() if k in rule_keys}
    searches = []
    for s in cfg.get("searches") or []:
        params = search_url_to_params(s["url"]) if s.get("url") else {}
        params.update({k: str(v) for k, v in (s.get("params") or {}).items()})
        merged = {**defaults, **{k: v for k, v in (s.get("rules") or {}).items() if k in rule_keys}}
        if "exclude_keywords" in merged:
            merged["exclude_keywords"] = tuple(merged["exclude_keywords"])
        searches.append(Search(name=s["name"], params=params, rules=Rules(**merged)))
    if not searches:
        raise SystemExit("Aucune recherche dans la configuration (clé « searches »).")
    return cfg, searches


def load_dotenv(path: Path) -> None:
    """Lit un fichier .env simple (CLE=valeur) sans dépendance supplémentaire."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        key, sep, value = line.strip().partition("=")
        if sep and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip().strip('"'))


class Scanner:
    def __init__(self, cfg: dict, searches: list[Search]):
        self.domain = cfg.get("domain", "www.vinted.fr")
        self.poll_seconds = float(cfg.get("poll_seconds", 60))
        self.refresh_minutes = float(cfg.get("market_refresh_minutes", 60))
        self.searches = searches
        self.client = VintedClient(self.domain)
        self.store = Storage(cfg.get("database", "data/vinted.db"))
        self.last_refresh: dict[str, float] = {}
        self.deals: dict[int, tuple[Item, Verdict, str, float]] = {}
        self.last_seen_page = 0.0
        self.status = "En attente de la page"
        self.lock = threading.Lock()

    @property
    def active(self) -> bool:
        return time.time() - self.last_seen_page < IDLE_AFTER_SECONDS

    def pause(self) -> None:
        # Petite pause entre deux requêtes pour rester raisonnable avec Vinted.
        time.sleep(random.uniform(2, 4))

    def refresh_market(self, search: Search, pages: int) -> None:
        """Échantillon de prix du marché : annonces récentes + annonces les plus pertinentes."""
        for order in ("newest_first", "relevance"):
            for page in range(1, pages + 1):
                for item in self.client.search(search.params, order=order, page=page):
                    self.store.record(search.name, item)
                self.pause()
        self.last_refresh[search.name] = time.time()

    def poll(self, search: Search) -> int:
        if time.time() - self.last_refresh.get(search.name, 0) > self.refresh_minutes * 60:
            first = not self.store.market_prices(search.name, search.rules.max_age_days)
            self.status = f"Analyse du marché : {search.name}"
            self.refresh_market(search, pages=3 if first else 1)
        found = 0
        for item in self.client.search(search.params, order="newest_first"):
            if self.store.is_known(item.id):
                continue
            verdict = evaluate(self.store, search.name, item, search.rules)
            self.store.record(search.name, item, notified=verdict is not None)
            if verdict:
                log.info("Affaire %s : %s à %.2f (médiane %.2f)", verdict.kind, item.title,
                         item.price, verdict.median)
                with self.lock:
                    self.deals[item.id] = (item, verdict, search.name, time.time())
                found += 1
        return found

    def run_forever(self) -> None:
        backoff = 60.0
        while True:
            if not self.active:
                self.status = "En pause (aucune page ouverte)"
                time.sleep(2)
                continue
            started = time.time()
            try:
                for search in self.searches:
                    if not self.active:
                        break
                    self.status = f"Scan : {search.name}"
                    self.poll(search)
                    self.pause()
                backoff = 60.0
                self.status = "Scan en cours"
                self.store.purge(max(s.rules.max_age_days for s in self.searches))
            except VintedBlocked as exc:
                self.status = f"Vinted limite les requêtes ({exc}), reprise dans {backoff:.0f} s"
                log.warning(self.status)
                time.sleep(backoff)
                backoff = min(backoff * 2, 900)
                self.client.session.cookies.clear()
                continue
            except (requests.RequestException, ValueError) as exc:
                self.status = f"Erreur réseau : {exc}"
                log.warning(self.status)
            wait_until = started + self.poll_seconds
            while time.time() < wait_until and self.active:
                time.sleep(1)

    def state(self) -> dict:
        self.last_seen_page = time.time()
        with self.lock:
            deals = sorted(self.deals.values(), key=lambda d: d[3], reverse=True)[:200]
        return {
            "status": self.status,
            "searches": [s.name for s in self.searches],
            "deals": [deal_json(item, verdict, search, found_at, self.domain)
                      for item, verdict, search, found_at in deals],
        }


def deal_json(item: Item, verdict: Verdict, search: str, found_at: float, domain: str) -> dict:
    return {
        "id": item.id, "search": search, "title": item.title, "price": item.price,
        "total_price": item.total_price, "currency": item.currency, "brand": item.brand,
        "size": item.size, "status": item.status, "photo": item.photo_url, "url": item.url,
        "buy_url": item.buy_url(domain), "seller": item.seller, "kind": verdict.kind,
        "median": round(verdict.median, 2), "discount": round(verdict.discount, 3),
        "samples": verdict.samples, "basis": verdict.basis, "found_at": found_at,
    }


def make_handler(scanner: Scanner):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            pass

        def send_json(self, data: dict, code: int = 200) -> None:
            body = json.dumps(data).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path == "/api/state":
                return self.send_json(scanner.state())
            if self.path in ("/", "/index.html"):
                body = (WEB_DIR / "index.html").read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                return self.wfile.write(body)
            self.send_json({"error": "introuvable"}, 404)

        def do_POST(self):
            if self.path != "/api/resale":
                return self.send_json({"error": "introuvable"}, 404)
            try:
                length = int(self.headers.get("Content-Length", 0))
                deal_id = int(json.loads(self.rfile.read(length) or b"{}")["id"])
            except (ValueError, KeyError, TypeError):
                return self.send_json({"error": "Requête invalide"}, 400)
            with scanner.lock:
                deal = scanner.deals.get(deal_id)
            if not deal:
                return self.send_json({"error": "Annonce inconnue"}, 404)
            try:
                return self.send_json(write_listing(deal[0], deal[1]))
            except ResaleError as exc:
                return self.send_json({"error": str(exc)}, 502)

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description="Détecteur d'erreurs de prix Vinted")
    parser.add_argument("-c", "--config", default=os.getenv("VINTED_BOT_CONFIG", "config.yaml"))
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--lan", action="store_true",
                        help="accessible depuis ton téléphone sur le même wifi")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_dotenv(Path(".env"))
    cfg, searches = load_config(args.config)

    scanner = Scanner(cfg, searches)
    threading.Thread(target=scanner.run_forever, daemon=True).start()
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    server = ThreadingHTTPServer((host, args.port), make_handler(scanner))
    url = f"http://localhost:{args.port}"
    print(f"\n  Bot Vinted prêt : ouvre {url}")
    if args.lan:
        print(f"  Sur ton téléphone (même wifi) : http://<adresse-IP-de-ton-PC>:{args.port}")
    print("  Le scan tourne seulement quand la page est ouverte. Ctrl+C pour quitter.\n")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
