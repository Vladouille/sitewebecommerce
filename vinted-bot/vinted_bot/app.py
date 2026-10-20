"""Appli web locale : scanne Vinted uniquement tant que la page est ouverte."""
from __future__ import annotations

import argparse
import hmac
import json
import logging
import os
import random
import secrets
import threading
import time
import webbrowser
from dataclasses import dataclass, fields
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests
import yaml

from .pricing import Rules, Verdict, evaluate
from .resale import AIConfig, write_listing
from .storage import Storage
from .vinted import Item, VintedBlocked, VintedClient, search_url_to_params

log = logging.getLogger("vinted_bot")
WEB_DIR = Path(__file__).parent / "web"
IDLE_AFTER_SECONDS = 45   # plus de page ouverte depuis 45 s : le scan se met en pause
MIN_POLL_SECONDS = 30     # rythme minimum imposé pour rester raisonnable avec Vinted
MAX_DEALS = 300


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


class Scanner:
    def __init__(self, cfg: dict, searches: list[Search]):
        self.domain = cfg.get("domain", "www.vinted.fr")
        self.poll_seconds = max(MIN_POLL_SECONDS, float(cfg.get("poll_seconds", 60)))
        self.refresh_minutes = max(15.0, float(cfg.get("market_refresh_minutes", 60)))
        self.searches = searches
        self.client = VintedClient(self.domain)
        self.store = Storage(cfg.get("database", "data/vinted.db"))
        self.last_refresh: dict[str, float] = {}
        self.deals: dict[int, tuple[Item, Verdict, str, float]] = {}
        self.last_seen_page = 0.0
        self.status = "En attente de la page"
        self.lock = threading.Lock()
        ai_keys = {f.name for f in fields(AIConfig)}
        self.ai = AIConfig(**{k: v for k, v in (cfg.get("ai") or {}).items() if k in ai_keys})

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
                    if len(self.deals) > MAX_DEALS:
                        oldest = min(self.deals, key=lambda k: self.deals[k][3])
                        del self.deals[oldest]
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
                self.status = "Erreur réseau, nouvel essai au prochain cycle"
                log.warning("Erreur réseau : %s", exc)
            except Exception:                       # le scan ne doit jamais s'arrêter seul
                self.status = "Erreur inattendue, nouvel essai au prochain cycle"
                log.exception("Erreur inattendue pendant le scan")
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




def safe_url(url: str | None, domain: str, fallback: str) -> str:
    """N'affiche que des liens https vers Vinted (jamais de javascript: ou de site tiers)."""
    host = urlparse(url or "").hostname or ""
    ok = (url or "").startswith("https://") and (host == domain or host.endswith(".vinted.fr")
                                                 or host.endswith(".vinted.net"))
    return url if ok else fallback


def deal_json(item: Item, verdict: Verdict, search: str, found_at: float, domain: str) -> dict:
    return {
        "id": item.id, "search": search, "title": item.title, "price": item.price,
        "total_price": item.total_price, "currency": item.currency, "brand": item.brand,
        "size": item.size, "status": item.status, "seller": item.seller,
        "photo": safe_url(item.photo_url, domain, ""),
        "url": safe_url(item.url, domain, f"https://{domain}/items/{item.id}"),
        "buy_url": item.buy_url(domain), "kind": verdict.kind,
        "median": round(verdict.median, 2), "discount": round(verdict.discount, 3),
        "samples": verdict.samples, "basis": verdict.basis, "found_at": found_at,
    }


SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "img-src 'self' https://*.vinted.net data:; connect-src 'self'; "
        "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    ),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
}
STATIC = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript")}


def make_handler(scanner: Scanner, access_code: str | None = None, port: int = 8000):
    local_hosts = {f"localhost:{port}", f"127.0.0.1:{port}"}

    class Handler(BaseHTTPRequestHandler):
        server_version = "VintedBot"
        sys_version = ""

        def log_message(self, fmt, *args):
            pass

        def send(self, code: int, body: bytes, ctype: str, extra: dict | None = None) -> None:
            self.send_response(code)
            self.send_header("Content-Type", f"{ctype}; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            for k, v in {**SECURITY_HEADERS, **(extra or {})}.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def send_json(self, data: dict, code: int = 200) -> None:
            self.send(code, json.dumps(data).encode(), "application/json")

        def allowed(self) -> bool:
            """Bloque les autres sites web et les autres appareils sans code d'accès."""
            host = self.headers.get("Host", "")
            origin = self.headers.get("Origin")
            if origin and urlparse(origin).netloc != host:
                return False
            if access_code is None:
                return host in local_hosts        # protège aussi du « DNS rebinding »
            cookie = self.headers.get("Cookie", "")
            given = dict(p.strip().split("=", 1) for p in cookie.split(";") if "=" in p).get("code", "")
            return hmac.compare_digest(given, access_code)

        def do_GET(self):
            url = urlparse(self.path)
            code = parse_qs(url.query).get("code", [""])[0]
            if access_code and url.path == "/" and hmac.compare_digest(code, access_code):
                # Échange le code de l'URL contre un cookie, puis retire le code de l'adresse.
                return self.send(303, b"", "text/plain", {
                    "Location": "/",
                    "Set-Cookie": f"code={access_code}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000",
                })
            if not self.allowed():
                return self.send(403, "Accès refusé : utilise le lien affiché au lancement du bot.".encode(),
                                 "text/plain")
            if url.path == "/api/state":
                return self.send_json(scanner.state())
            if url.path in STATIC:
                name, ctype = STATIC[url.path]
                return self.send(200, (WEB_DIR / name).read_bytes(), ctype)
            self.send_json({"error": "introuvable"}, 404)

        def do_POST(self):
            if not self.allowed():
                return self.send_json({"error": "Accès refusé"}, 403)
            if self.path != "/api/resale":
                return self.send_json({"error": "introuvable"}, 404)
            try:
                length = min(int(self.headers.get("Content-Length", 0)), 1024)
                deal_id = int(json.loads(self.rfile.read(length) or b"{}")["id"])
            except (ValueError, KeyError, TypeError):
                return self.send_json({"error": "Requête invalide"}, 400)
            with scanner.lock:
                deal = scanner.deals.get(deal_id)
            if not deal:
                return self.send_json({"error": "Annonce inconnue"}, 404)
            return self.send_json(write_listing(deal[0], deal[1], scanner.ai))

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description="Détecteur d'erreurs de prix Vinted")
    parser.add_argument("-c", "--config", default=os.getenv("VINTED_BOT_CONFIG", "config.yaml"))
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--lan", action="store_true",
                        help="accessible depuis ton téléphone sur le même wifi (avec code d'accès)")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cfg, searches = load_config(args.config)

    scanner = Scanner(cfg, searches)
    threading.Thread(target=scanner.run_forever, daemon=True).start()
    access_code = secrets.token_urlsafe(12) if args.lan else None
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    server = ThreadingHTTPServer((host, args.port), make_handler(scanner, access_code, args.port))
    suffix = f"/?code={access_code}" if access_code else ""
    url = f"http://localhost:{args.port}{suffix}"
    print(f"\n  Bot Vinted prêt : ouvre {url}")
    if args.lan:
        print(f"  Sur ton téléphone (même wifi) : http://<adresse-IP-de-ton-PC>:{args.port}{suffix}")
        print("  Garde ce lien pour toi : le code change à chaque lancement.")
    print("  Le scan tourne seulement quand la page est ouverte. Ctrl+C pour quitter.\n")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
