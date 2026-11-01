"""Scan des recherches Vinted, uniquement tant que quelqu'un a le site ouvert."""
from __future__ import annotations

import logging
import random
import threading
import time
from dataclasses import dataclass
from urllib.parse import urlparse

import requests

from .pricing import Rules, Verdict, evaluate
from .resale import AIConfig
from .storage import Storage
from .vinted import Item, VintedBlocked, VintedClient, search_url_to_params

log = logging.getLogger("vinted_bot")

IDLE_AFTER_SECONDS = 45   # plus de page ouverte depuis 45 s : le scan se met en pause
MIN_POLL_SECONDS = 30     # rythme minimum imposé pour rester raisonnable avec Vinted
MAX_DEALS = 300

DEFAULT_SETTINGS = {
    "deal_discount": 0.40,
    "error_discount": 0.70,
    "exclude_keywords": ["boîte vide", "boite vide", "faux", "replica", "réplique", "copie",
                         "recherche", "échange", "cassé", "hs", "pour pièces", "sticker", "housse"],
}


@dataclass
class Search:
    name: str
    params: dict[str, str]
    rules: Rules


class Scanner:
    def __init__(self, store: Storage, domain: str = "www.vinted.fr", poll_seconds: float = 60,
                 ai: AIConfig | None = None):
        self.store = store
        self.domain = domain
        self.poll_seconds = max(MIN_POLL_SECONDS, poll_seconds)
        self.refresh_minutes = 60.0
        self.ai = ai or AIConfig()
        self.client = VintedClient(domain)
        self.last_refresh: dict[str, float] = {}
        self.deals: dict[int, tuple[Item, Verdict, str, float]] = {}
        self.last_seen_page = 0.0
        self.status = "En attente"
        self.lock = threading.Lock()

    # --- Réglages et recherches ------------------------------------------------------

    def settings(self) -> dict:
        return {**DEFAULT_SETTINGS, **self.store.get_settings()}

    def searches(self) -> list[Search]:
        s = self.settings()
        return [
            Search(name=row["name"], params=search_url_to_params(row["url"]), rules=Rules(
                deal_discount=s["deal_discount"], error_discount=s["error_discount"],
                exclude_keywords=tuple(s["exclude_keywords"]), max_price=row["max_price"]))
            for row in self.store.list_searches()
        ]

    # --- Scan -----------------------------------------------------------------------

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
                self.status = "En pause (personne sur le site)"
                time.sleep(2)
                continue
            started = time.time()
            try:
                searches = self.searches()
                if not searches:
                    self.status = "Ajoute une recherche pour commencer"
                for search in searches:
                    if not self.active:
                        break
                    self.status = f"Scan : {search.name}"
                    self.poll(search)
                    self.pause()
                if searches:
                    self.status = "Scan en cours"
                backoff = 60.0
                self.store.purge(30)
            except VintedBlocked as exc:
                self.status = f"Vinted limite les requêtes, reprise dans {backoff:.0f} s"
                log.warning("Vinted limite les requêtes (%s)", exc)
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

    # --- Données pour le site --------------------------------------------------------

    def state(self) -> dict:
        self.last_seen_page = time.time()
        with self.lock:
            deals = sorted(self.deals.values(), key=lambda d: d[3], reverse=True)
        return {
            "status": self.status,
            "deals": [deal_json(item, verdict, search, found_at, self.domain)
                      for item, verdict, search, found_at in deals],
        }

    def get_deal(self, deal_id: int) -> tuple[Item, Verdict] | None:
        with self.lock:
            deal = self.deals.get(deal_id)
        return (deal[0], deal[1]) if deal else None


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
