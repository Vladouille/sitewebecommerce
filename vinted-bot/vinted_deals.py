#!/usr/bin/env python3
"""Vinted Deals : site de détection d'erreurs de prix Vinted, en un seul fichier.

Installation :  pip install requests flask waitress
Lancement :     BOT_PASSWORD="ton-mot-de-passe" SECURE_COOKIES=0 python vinted_deals.py
Puis ouvre http://localhost:8000 (voir le README pour l'hébergement en HTTPS).

Fichier généré par build_single_file.py à partir du dossier vinted_bot/ : ne pas modifier à la main.
"""
from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import timedelta
import hashlib
import hmac
import json
import logging
import os
from pathlib import Path
import random
import re
import secrets
import sqlite3
import statistics
import threading
import time
from urllib.parse import parse_qs, urlparse

from flask import abort, Flask, jsonify, redirect, request, Response, session
import requests
from werkzeug.middleware.proxy_fix import ProxyFix


# ============================================================================
# vinted.py : Client minimal pour l'API catalogue publique utilisée par le site Vinted.
# ============================================================================

log = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0 Safari/537.36"
)

# Paramètres d'une URL de recherche vinted.fr -> paramètres de l'API catalogue.
URL_PARAM_MAP = {
    "search_text": "search_text",
    "catalog[]": "catalog_ids",
    "catalog_ids[]": "catalog_ids",
    "brand_ids[]": "brand_ids",
    "size_ids[]": "size_ids",
    "status_ids[]": "status_ids",
    "color_ids[]": "color_ids",
    "material_ids[]": "material_ids",
    "price_from": "price_from",
    "price_to": "price_to",
    "currency": "currency",
}


class VintedBlocked(Exception):
    """Vinted refuse temporairement les requêtes (429 / 403)."""


@dataclass
class Item:
    id: int
    title: str
    price: float
    total_price: float
    currency: str
    brand: str
    size: str
    status: str
    url: str
    photo_url: str | None
    seller: str

    def buy_url(self, domain: str) -> str:
        # Page de paiement Vinted : ouvre directement l'écran « Acheter ».
        return (
            f"https://{domain}/transaction/buy/new"
            f"?source_screen=item&transaction%5Bitem_id%5D={self.id}"
        )


def search_url_to_params(url: str) -> dict[str, str]:
    """Convertit une URL de recherche copiée depuis vinted.fr en paramètres API."""
    query = parse_qs(urlparse(url).query)
    params: dict[str, list[str]] = {}
    for key, values in query.items():
        api_key = URL_PARAM_MAP.get(key)
        if api_key:
            params.setdefault(api_key, []).extend(values)
    return {k: ",".join(v) for k, v in params.items()}


def _amount(value) -> float:
    if isinstance(value, dict):
        value = value.get("amount")
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def parse_item(raw: dict, domain: str) -> Item:
    price_field = raw.get("price")
    currency = (
        price_field.get("currency_code") if isinstance(price_field, dict) else raw.get("currency")
    ) or "EUR"
    price = _amount(price_field)
    total = _amount(raw.get("total_item_price")) or price
    photo = raw.get("photo") or {}
    return Item(
        id=int(raw["id"]),
        title=raw.get("title") or "",
        price=price,
        total_price=total,
        currency=currency,
        brand=(raw.get("brand_title") or "").strip(),
        size=(raw.get("size_title") or "").strip(),
        status=(raw.get("status") or "").strip(),
        url=raw.get("url") or f"https://{domain}/items/{raw['id']}",
        photo_url=photo.get("url"),
        seller=(raw.get("user") or {}).get("login", ""),
    )


class VintedClient:
    def __init__(self, domain: str = "www.vinted.fr", timeout: float = 15):
        self.domain = domain
        self.timeout = timeout
        self.session = self._new_session()

    def _new_session(self) -> requests.Session:
        s = requests.Session()
        s.headers.update({
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "fr-FR,fr;q=0.9",
        })
        return s

    def refresh_cookies(self) -> None:
        """La page d'accueil dépose le cookie de session nécessaire à l'API."""
        self.session = self._new_session()
        r = self.session.get(f"https://{self.domain}/", timeout=self.timeout)
        r.raise_for_status()
        log.info("Cookies Vinted rafraîchis")

    def search(self, params: dict[str, str], order: str = "newest_first",
               page: int = 1, per_page: int = 96) -> list[Item]:
        query = {**params, "order": order, "page": page, "per_page": per_page,
                 "time": int(time.time())}
        url = f"https://{self.domain}/api/v2/catalog/items"
        for attempt in range(2):
            if not self.session.cookies:
                self.refresh_cookies()
            r = self.session.get(url, params=query, timeout=self.timeout)
            if r.status_code == 401 and attempt == 0:
                self.session.cookies.clear()
                continue
            if r.status_code in (403, 429):
                raise VintedBlocked(f"HTTP {r.status_code}")
            r.raise_for_status()
            return [parse_item(raw, self.domain) for raw in r.json().get("items", [])]
        raise VintedBlocked("Session refusée après rafraîchissement des cookies")


# ============================================================================
# pricing.py : Détection des prix anormalement bas par rapport au marché observé.
# ============================================================================

@dataclass
class Rules:
    deal_discount: float = 0.40      # 40 % sous la médiane = bonne affaire
    error_discount: float = 0.70     # 70 % sous la médiane = probable erreur de prix
    min_samples: int = 15            # nombre minimum d'annonces comparables
    max_age_days: float = 30
    min_price: float = 1.0           # ignore les annonces à 0 € (souvent des pièges)
    max_price: float | None = None
    exclude_keywords: tuple[str, ...] = ()


@dataclass
class Verdict:
    kind: str            # "error" ou "deal"
    median: float
    discount: float      # 0.55 = 55 % moins cher que la médiane
    samples: int
    basis: str           # comparables utilisés : marque + état, marque, ou recherche


def reference_prices(store: Storage, search: str, item: Item, rules: Rules) -> tuple[list[float], str]:
    """Du plus précis au plus large : même marque et même état, même marque, toute la recherche."""
    candidates = []
    if item.brand:
        candidates.append(({"brand": item.brand, "status": item.status}, f"{item.brand} · {item.status}"))
        candidates.append(({"brand": item.brand}, item.brand))
    candidates.append(({}, "toute la recherche"))
    for filters, basis in candidates:
        prices = store.market_prices(search, rules.max_age_days, exclude_id=item.id, **filters)
        if len(prices) >= rules.min_samples:
            return prices, basis
    return [], ""


def evaluate(store: Storage, search: str, item: Item, rules: Rules) -> Verdict | None:
    if any(re.search(rf"\b{re.escape(k)}\b", item.title, re.IGNORECASE)
           for k in rules.exclude_keywords):
        return None
    if item.price < rules.min_price:
        return None
    if rules.max_price is not None and item.price > rules.max_price:
        return None

    prices, basis = reference_prices(store, search, item, rules)
    if not prices:
        return None
    median = statistics.median(prices)
    if median <= 0:
        return None
    discount = 1 - item.price / median
    if discount >= rules.error_discount:
        kind = "error"
    elif discount >= rules.deal_discount:
        kind = "deal"
    else:
        return None
    return Verdict(kind=kind, median=median, discount=discount, samples=len(prices), basis=basis)


# ============================================================================
# storage.py : Base SQLite : recherches, réglages, annonces déjà vues et prix observés sur le marché.
# ============================================================================

DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS prices (
    item_id   INTEGER PRIMARY KEY,
    search    TEXT NOT NULL,
    brand     TEXT NOT NULL,
    status    TEXT NOT NULL,
    price     REAL NOT NULL,
    seen_at   REAL NOT NULL,
    notified  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS prices_lookup ON prices (search, brand, status, seen_at);
CREATE TABLE IF NOT EXISTS searches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    url        TEXT NOT NULL,
    max_price  REAL,
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Storage:
    """Partagée entre le scan et le site web : chaque accès passe par un verrou."""

    def __init__(self, path: str | Path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.lock = threading.Lock()
        with self.lock:
            self.db.executescript(DB_SCHEMA)

    def _query(self, sql: str, args=()) -> list[tuple]:
        with self.lock:
            rows = self.db.execute(sql, args).fetchall()
            self.db.commit()
            return rows

    # --- Prix observés -------------------------------------------------------------

    def is_known(self, item_id: int) -> bool:
        return bool(self._query("SELECT 1 FROM prices WHERE item_id = ?", (item_id,)))

    def record(self, search: str, item: Item, notified: bool = False) -> None:
        self._query(
            "INSERT OR IGNORE INTO prices (item_id, search, brand, status, price, seen_at, notified)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item.id, search, item.brand.lower(), item.status.lower(), item.price,
             time.time(), int(notified)),
        )

    def market_prices(self, search: str, max_age_days: float, brand: str | None = None,
                      status: str | None = None, exclude_id: int | None = None) -> list[float]:
        sql = "SELECT price FROM prices WHERE search = ? AND seen_at >= ? AND price > 0"
        args: list = [search, time.time() - max_age_days * 86400]
        if brand is not None:
            sql += " AND brand = ?"
            args.append(brand.lower())
        if status is not None:
            sql += " AND status = ?"
            args.append(status.lower())
        if exclude_id is not None:
            sql += " AND item_id != ?"
            args.append(exclude_id)
        return [row[0] for row in self._query(sql, args)]

    def purge(self, max_age_days: float) -> None:
        self._query("DELETE FROM prices WHERE seen_at < ?", (time.time() - max_age_days * 86400,))

    # --- Recherches ----------------------------------------------------------------

    def list_searches(self) -> list[dict]:
        rows = self._query("SELECT id, name, url, max_price FROM searches ORDER BY created_at")
        return [{"id": r[0], "name": r[1], "url": r[2], "max_price": r[3]} for r in rows]

    def add_search(self, name: str, url: str, max_price: float | None) -> None:
        self._query("INSERT INTO searches (name, url, max_price, created_at) VALUES (?, ?, ?, ?)",
                    (name, url, max_price, time.time()))

    def delete_search(self, search_id: int) -> None:
        self._query("DELETE FROM searches WHERE id = ?", (search_id,))

    # --- Réglages ------------------------------------------------------------------

    def get_settings(self) -> dict:
        return {k: json.loads(v) for k, v in self._query("SELECT key, value FROM settings")}

    def set_settings(self, values: dict) -> None:
        for key, value in values.items():
            self._query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                        (key, json.dumps(value)))


# ============================================================================
# resale.py : Annonce de revente gratuite : IA locale (Ollama) ou modèle intégré en secours.
# ============================================================================

log = logging.getLogger(__name__)

MAX_PHOTO_BYTES = 5 * 1024 * 1024
PHOTO_HOST_SUFFIXES = (".vinted.net", ".vinted.com")

SYSTEM = (
    "Tu es un expert de la revente sur Vinted. Tu rédiges en français des annonces qui "
    "se vendent vite : titre clair (marque, modèle, taille, état, 60 caractères max), "
    "description honnête et aérée (état réel, taille ou mesures, points forts, envoi "
    "rapide). N'invente jamais une caractéristique absente de la photo ou des "
    "informations : écris [À COMPLÉTER : ...] à la place. Pas d'emoji en excès."
)

LISTING_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "hashtags": {"type": "array", "items": {"type": "string"}},
        "photo_tips": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "description", "hashtags", "photo_tips"],
}

PHOTO_TIPS = [
    "Photographie à la lumière du jour, près d'une fenêtre, sans flash.",
    "Fond neutre et uni (mur blanc, drap clair) pour que l'article ressorte.",
    "Première photo : l'article entier, bien centré. Ensuite les détails (étiquette, logo, coutures).",
    "Montre honnêtement les défauts éventuels : ça évite les litiges et rassure l'acheteur.",
    "Pour les vêtements : une photo portée ou à plat bien repassée se vend mieux.",
]


@dataclass
class AIConfig:
    provider: str = "auto"            # auto (IA locale si dispo) ou template
    model: str = "gemma3:4b"
    host: str = "http://localhost:11434"
    timeout: float = 120


def _nice_price(value: float) -> float:
    """Arrondit à un prix « vendeur » : 18, 24, 39, 85..."""
    if value < 10:
        return max(1.0, round(value))
    return float(int(value) - 1 if int(value) % 5 == 0 else int(value))


def suggest_prices(item: Item, verdict: Verdict) -> dict:
    suggested = _nice_price(verdict.median * 0.95)
    quick = _nice_price(verdict.median * 0.80)
    return {
        "suggested_price": suggested,
        "quick_sale_price": quick,
        "estimated_profit": round(suggested - item.total_price, 2),
    }


def _clean_title(item: Item) -> str:
    title = re.sub(r"\s+", " ", item.title).strip(" -–|")
    parts = [title]
    if item.brand and item.brand.lower() not in title.lower():
        parts.insert(0, item.brand)
    if item.size and item.size.lower() not in title.lower():
        parts.append(f"T{item.size}" if item.size[:1].isdigit() else item.size)
    if item.status:
        parts.append(item.status)
    return " – ".join(parts)[:60].rstrip(" –")


def _hashtags(item: Item) -> list[str]:
    words = [item.brand] + re.findall(r"[A-Za-zÀ-ÿ0-9]{3,}", item.title)
    tags, seen = [], set()
    for w in words:
        tag = "#" + re.sub(r"[^a-z0-9à-ÿ]", "", (w or "").lower())
        if len(tag) > 3 and tag not in seen:
            seen.add(tag)
            tags.append(tag)
    return tags[:6]


def template_listing(item: Item, verdict: Verdict) -> dict:
    lines = [
        _clean_title(item),
        "",
        f"✔️ État : {item.status or '[À COMPLÉTER : état]'}",
        f"✔️ Taille : {item.size or '[À COMPLÉTER : taille ou mesures]'}",
    ]
    if item.brand:
        lines.append(f"✔️ Marque : {item.brand}")
    lines += [
        "✔️ Défauts : [À COMPLÉTER : aucun / décris-les honnêtement]",
        "",
        "📦 Envoi soigné sous 24-48 h.",
        "💬 N'hésite pas à me poser tes questions ou à faire une offre raisonnable.",
        "🛍️ Pense à regarder mes autres articles pour un lot !",
    ]
    return {
        "title": _clean_title(item),
        "description": "\n".join(lines),
        "hashtags": _hashtags(item),
        "photo_tips": PHOTO_TIPS[:4],
    }


def _photo_base64(url: str | None) -> str | None:
    """Télécharge la photo de l'annonce, uniquement depuis les serveurs d'images Vinted."""
    if not url:
        return None
    parsed = urlparse(url)
    if parsed.scheme != "https" or not (parsed.hostname or "").endswith(PHOTO_HOST_SUFFIXES):
        return None
    try:
        r = requests.get(url, timeout=15, stream=True)
        r.raise_for_status()
        data = r.raw.read(MAX_PHOTO_BYTES + 1, decode_content=True)
    except requests.RequestException:
        return None
    if len(data) > MAX_PHOTO_BYTES:
        return None
    return base64.b64encode(data).decode()


def _valid(listing: dict) -> bool:
    return (isinstance(listing.get("title"), str) and listing["title"].strip()
            and isinstance(listing.get("description"), str) and listing["description"].strip()
            and isinstance(listing.get("hashtags"), list)
            and isinstance(listing.get("photo_tips"), list))


def ollama_listing(item: Item, verdict: Verdict, cfg: AIConfig) -> dict:
    prompt = (
        "Rédige une meilleure annonce Vinted pour revendre cet article.\n"
        f"Titre d'origine : {item.title}\nMarque : {item.brand or 'inconnue'}\n"
        f"Taille : {item.size or 'non précisée'}\nÉtat : {item.status or 'non précisé'}\n"
        f"Prix de revente visé : {suggest_prices(item, verdict)['suggested_price']:.0f} €\n"
        "Réponds en JSON avec title, description, hashtags (5 max) et photo_tips (3 à 5)."
    )
    message: dict = {"role": "user", "content": prompt}
    photo = _photo_base64(item.photo_url)
    if photo:
        message["images"] = [photo]
    r = requests.post(f"{cfg.host}/api/chat", timeout=cfg.timeout, json={
        "model": cfg.model,
        "messages": [{"role": "system", "content": SYSTEM}, message],
        "format": LISTING_SCHEMA,
        "stream": False,
        "options": {"temperature": 0.4},
    })
    r.raise_for_status()
    listing = json.loads(r.json()["message"]["content"])
    if not _valid(listing):
        raise ValueError("réponse incomplète")
    listing["title"] = listing["title"].strip()[:60]
    listing["hashtags"] = [str(h) for h in listing["hashtags"]][:6]
    listing["photo_tips"] = [str(t) for t in listing["photo_tips"]][:5]
    return listing


def write_listing(item: Item, verdict: Verdict, cfg: AIConfig | None = None) -> dict:
    cfg = cfg or AIConfig()
    listing, source = None, "modèle intégré"
    if cfg.provider != "template":
        try:
            listing, source = ollama_listing(item, verdict, cfg), f"IA locale ({cfg.model})"
        except (requests.RequestException, ValueError, KeyError) as exc:
            log.info("IA locale indisponible (%s), modèle intégré utilisé", exc)
    listing = listing or template_listing(item, verdict)
    return {**listing, **suggest_prices(item, verdict), "source": source}


# ============================================================================
# scanner.py : Scan des recherches Vinted, uniquement tant que quelqu'un a le site ouvert.
# ============================================================================

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


# ============================================================================
# server.py : Site web du bot : connexion par mot de passe, recherches, affaires et annonces de revente.
# ============================================================================

log = logging.getLogger("vinted_bot")
WEB_DIR = Path(__file__).parent / "web"
# Pages du site intégrées au code (version en un seul fichier) ; sinon lues dans WEB_DIR.
ASSETS: dict[str, str] = {
    "app.js": r'''const $ = (sel) => document.querySelector(sel);
let deals = [], filter = "all", known = new Set(), firstLoad = true;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

async function api(path, method = "GET", body) {
  const r = await fetch(path, {
    method, headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) { location.href = "/login"; throw new Error("Connexion requise"); }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Erreur");
  return data;
}

const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
function ago(ts) {
  const m = Math.round((Date.now() / 1000 - ts) / 60);
  return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.round(m / 60)} h`;
}

function card(d) {
  const meta = [d.brand, d.size, d.status].filter(Boolean).join(" · ");
  return el("article", { class: "card" + (known.has(d.id) ? "" : " new") },
    el("div", { class: "photo" },
      d.photo ? el("img", { src: d.photo, alt: d.title, loading: "lazy" }) : null,
      el("span", { class: "badge " + d.kind },
        (d.kind === "error" ? "🚨 " : "🔥 ") + "-" + Math.round(d.discount * 100) + " %")),
    el("div", { class: "body" },
      el("p", { class: "title" }, d.title),
      el("div", { class: "meta" }, meta),
      el("div", { class: "price" }, euro(d.price), el("s", {}, euro(d.median))),
      el("div", { class: "meta" },
        `Médiane sur ${d.samples} annonces (${d.basis}) · ${d.search} · ${ago(d.found_at)}`)),
    el("div", { class: "actions" },
      el("a", { class: "btn buy", href: d.buy_url, target: "_blank", rel: "noopener" }, "🛒 Acheter"),
      el("a", { class: "btn", href: d.url, target: "_blank", rel: "noopener" }, "👀 Voir l'annonce"),
      el("button", { class: "btn ai", onclick: () => openResale(d) }, "✨ Créer une annonce de revente")));
}

function render() {
  const list = $("#list");
  const shown = deals.filter((d) => filter === "all" || d.kind === filter);
  list.replaceChildren(...(shown.length ? shown.map(card)
    : [el("p", { class: "empty" }, "Aucune affaire pour l'instant. Laisse la page ouverte, le bot cherche.")]));
  deals.forEach((d) => known.add(d.id));
}

function alertNew(fresh) {
  if (!fresh.length) return;
  document.title = `(${fresh.length}) Vinted Deals`;
  try {
    const ctx = new AudioContext(), o = ctx.createOscillator();
    o.frequency.value = 880; o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
  if ("Notification" in window && Notification.permission === "granted") {
    for (const d of fresh.slice(0, 3)) {
      const n = new Notification(`${d.kind === "error" ? "🚨 Erreur de prix" : "🔥 Bonne affaire"} : ${euro(d.price)}`,
        { body: `${d.title} (médiane ${euro(d.median)})`, icon: d.photo || undefined });
      n.onclick = () => window.open(d.url, "_blank");
    }
  }
}

async function refresh() {
  try {
    const s = await api("/api/state");
    const pill = $("#status");
    pill.textContent = s.status;
    pill.classList.toggle("on", /^(Scan|Analyse)/.test(s.status));
    const fresh = s.deals.filter((d) => !known.has(d.id));
    deals = s.deals;
    if (fresh.length || firstLoad) render();
    if (!firstLoad) alertNew(fresh);
    firstLoad = false;
  } catch {
    $("#status").textContent = "Site injoignable, nouvel essai…";
    $("#status").classList.remove("on");
  }
}

function show(view) {
  $("#list").hidden = view !== "deals";
  $("#searches").hidden = view !== "searches";
  $("#settings").hidden = view !== "settings";
  if (view === "searches") loadSearches();
  if (view === "settings") loadSettings();
}

document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  if (b.dataset.filter) { filter = b.dataset.filter; render(); }
  show(b.dataset.view);
}));
$("#notif")?.addEventListener("click", async () => {
  if (!("Notification" in window)) return alert("Ton navigateur ne gère pas les notifications.");
  const p = await Notification.requestPermission();
  $("#notif").setAttribute("aria-pressed", p === "granted");
  $("#notif").textContent = p === "granted" ? "🔔 Alertes activées" : "🔕 Alertes refusées";
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) document.title = "Vinted Deals"; });

function field(label, text) {
  const copy = el("button", { class: "copy", onclick: async () => {
    await navigator.clipboard.writeText(text); copy.textContent = "Copié ✓";
  } }, "Copier");
  return el("div", { class: "field" }, el("label", {}, label, copy), el("div", { class: "box" }, text));
}

async function openResale(d) {
  const body = $("#resale-body"), dlg = $("#resale");
  const close = el("button", { class: "btn", onclick: () => dlg.close() }, "Fermer");
  body.replaceChildren(el("h2", {}, "✨ Annonce de revente"), el("p", { class: "meta" },
    "Rédaction de l'annonce à partir de la photo et du prix du marché… (jusqu'à une minute avec l'IA locale)"), close);
  dlg.showModal();
  try {
    const x = await api("/api/resale", "POST", { id: d.id });
    body.replaceChildren(
      el("h2", {}, "✨ Annonce de revente"),
      el("div", { class: "stats" },
        el("div", { class: "stat" }, el("b", {}, euro(x.suggested_price)), el("span", {}, "Prix conseillé")),
        el("div", { class: "stat" }, el("b", {}, euro(x.quick_sale_price)), el("span", {}, "Vente rapide")),
        el("div", { class: "stat" }, el("b", {}, euro(x.estimated_profit)), el("span", {}, "Bénéfice estimé"))),
      field("Titre", x.title),
      field("Description", x.description + (x.hashtags.length ? "\n\n" + x.hashtags.join(" ") : "")),
      field("Conseils photos", x.photo_tips.map((t) => "• " + t).join("\n")),
      el("p", { class: "meta" }, `Rédigé par : ${x.source}. Vérifie l'article reçu et complète ce qui est entre crochets avant de publier.`),
      close);
  } catch (e) {
    body.replaceChildren(el("h2", {}, "✨ Annonce de revente"),
      el("p", { class: "error-msg" }, e.message), close);
  }
}

function renderSearches(data) {
  $("#search-count").textContent = `Mes recherches (${data.searches.length}/${data.max ?? 15})`;
  $("#search-list").replaceChildren(...(data.searches.length ? data.searches.map((s) =>
    el("div", { class: "row" },
      el("div", {}, el("p", { class: "title" }, s.name + (s.max_price ? ` · max ${euro(s.max_price)}` : "")),
        el("p", { class: "meta" }, s.url)),
      el("button", { class: "btn danger", onclick: async () => {
        if (confirm(`Supprimer la recherche « ${s.name} » ?`)) renderSearches({ ...(await api(`/api/searches/${s.id}`, "DELETE")), max: data.max });
      } }, "Supprimer")))
    : [el("p", { class: "hint" }, "Aucune recherche : ajoutes-en une pour lancer le bot.")]));
}

async function loadSearches() {
  try { renderSearches(await api("/api/searches")); } catch {}
}

async function loadSettings() {
  try {
    const s = await api("/api/settings"), f = $("#settings-form");
    f.deal.value = Math.round(s.deal_discount * 100);
    f.error.value = Math.round(s.error_discount * 100);
    f.keywords.value = s.exclude_keywords.join("\n");
  } catch {}
}

function initApp() {
  $("#search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, err = $("#search-error");
    try {
      const data = await api("/api/searches", "POST",
        { name: f.name.value, url: f.url.value, max_price: f.max_price.value || null });
      renderSearches({ ...data, max: 15 });
      f.reset(); err.hidden = true;
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  $("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, msg = $("#settings-msg");
    try {
      await api("/api/settings", "PUT", {
        deal_discount: f.deal.value / 100, error_discount: f.error.value / 100,
        exclude_keywords: f.keywords.value.split("\n").map((k) => k.trim()).filter(Boolean),
      });
      msg.textContent = "Réglages enregistrés ✓"; msg.className = "hint ok-msg";
    } catch (ex) { msg.textContent = ex.message; msg.className = "hint error-msg"; }
  });
  refresh();
  setInterval(refresh, 5000);
  setInterval(() => { if (deals.length) render(); }, 60000);
}

function initLogin() {
  const code = new URLSearchParams(location.search).get("erreur");
  if (code) {
    $("#erreur").textContent = code === "bloque"
      ? "Trop d'essais. Réessaie dans 15 minutes."
      : "Mot de passe incorrect.";
    $("#erreur").hidden = false;
  }
}

if ($("#list")) initApp(); else initLogin();
''',
    "index.html": r'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Vinted Deals</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
  <div class="top">
    <h1>Vinted Deals</h1>
    <div class="top-actions">
      <span class="pill" id="status">Connexion…</span>
      <form method="post" action="/logout"><button class="link" type="submit">Déconnexion</button></form>
    </div>
  </div>
  <div class="tabs" role="group" aria-label="Navigation">
    <button data-view="deals" data-filter="all" aria-pressed="true">Tout</button>
    <button data-view="deals" data-filter="error" aria-pressed="false">🚨 Erreurs de prix</button>
    <button data-view="deals" data-filter="deal" aria-pressed="false">🔥 Bonnes affaires</button>
    <button data-view="searches" aria-pressed="false">🔎 Mes recherches</button>
    <button data-view="settings" aria-pressed="false">⚙️ Réglages</button>
    <button id="notif" aria-pressed="false">🔔 Activer les alertes</button>
  </div>
</header>

<main id="list"><p class="empty">Le scan démarre… les premières affaires apparaîtront ici.</p></main>

<section class="panel" id="searches" hidden>
  <form class="box-card" id="search-form">
    <h2>Ajouter une recherche</h2>
    <p class="hint">Fais ta recherche sur vinted.fr avec tes filtres (marque, taille, état…), puis copie
      l'adresse de la page de résultats.</p>
    <label class="input">Nom
      <input name="name" maxlength="60" required placeholder="Nike Dunk Low">
    </label>
    <label class="input">Adresse de la recherche Vinted
      <input name="url" type="url" required placeholder="https://www.vinted.fr/catalog?search_text=...">
    </label>
    <label class="input">Prix maximum (facultatif)
      <input name="max_price" type="number" min="1" max="100000" step="1" placeholder="150">
    </label>
    <p class="error-msg" id="search-error" hidden></p>
    <button class="btn buy" type="submit">Ajouter</button>
  </form>
  <div class="box-card">
    <h2 id="search-count">Mes recherches</h2>
    <div id="search-list"></div>
  </div>
</section>

<section class="panel" id="settings" hidden>
  <form class="box-card" id="settings-form">
    <h2>Réglages de détection</h2>
    <label class="input">🔥 Bonne affaire à partir de (% sous la médiane)
      <input name="deal" type="number" min="10" max="90" step="1" required>
    </label>
    <label class="input">🚨 Erreur de prix à partir de (% sous la médiane)
      <input name="error" type="number" min="11" max="95" step="1" required>
    </label>
    <label class="input">Mots exclus des titres (un par ligne : boîte vide, copie…)
      <textarea name="keywords" rows="8"></textarea>
    </label>
    <p class="hint" id="settings-msg"></p>
    <button class="btn buy" type="submit">Enregistrer</button>
  </form>
</section>

<dialog id="resale">
  <div class="modal" id="resale-body"></div>
</dialog>

<script src="/app.js"></script>
</body>
</html>
''',
    "login.html": r'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Connexion · Vinted Deals</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="login">
  <form class="box-card" method="post" action="/login">
    <h1>Vinted Deals</h1>
    <label class="input">Mot de passe
      <input type="password" name="password" autocomplete="current-password" required autofocus>
    </label>
    <p class="error-msg" id="erreur" hidden></p>
    <button class="btn buy" type="submit">Se connecter</button>
  </form>
</main>
<script src="/app.js"></script>
</body>
</html>
''',
    "style.css": r'''  :root {
    --bg: #f6f6f4; --card: #ffffff; --ink: #16181d; --muted: #6b7280; --line: #e5e7eb;
    --teal: #0b7d74; --red: #c62828; --orange: #d9730d;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #111317; --card: #1b1e24; --ink: #f1f2f4; --muted: #9aa1ad; --line: #2c313a; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink);
         font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  header { position: sticky; top: 0; z-index: 2; background: var(--bg);
           border-bottom: 1px solid var(--line); padding: 12px 16px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h1 { font-size: 18px; margin: 0; }
  .pill { font-size: 12px; padding: 4px 10px; border-radius: 99px; background: var(--line);
          color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
  .pill.on { background: color-mix(in srgb, var(--teal) 15%, transparent); color: var(--teal); }
  .tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .tabs button { border: 1px solid var(--line); background: var(--card); color: var(--ink);
                 padding: 6px 12px; border-radius: 99px; font: inherit; font-size: 13px; cursor: pointer;
                 white-space: nowrap; flex-shrink: 0; }
  .tabs button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  main { padding: 16px; display: grid; gap: 14px;
         grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); max-width: 1200px; margin: 0 auto; }
  .empty { grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 48px 16px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
          display: flex; flex-direction: column; }
  .photo { position: relative; aspect-ratio: 4 / 3; background: var(--line); }
  .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .badge { position: absolute; top: 8px; left: 8px; color: #fff; font-weight: 700; font-size: 13px;
           padding: 4px 8px; border-radius: 6px; background: var(--orange); }
  .badge.error { background: var(--red); }
  .body { padding: 12px; display: grid; gap: 6px; flex: 1; }
  .title { font-weight: 600; margin: 0; }
  .meta { color: var(--muted); font-size: 13px; }
  .price { font-size: 22px; font-weight: 700; }
  .price s { font-size: 14px; color: var(--muted); font-weight: 400; margin-left: 6px; }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 12px 12px; }
  .btn { display: block; text-align: center; text-decoration: none; padding: 11px 10px; border-radius: 8px;
         font: inherit; font-weight: 600; border: 1px solid var(--line); background: var(--card);
         color: var(--ink); cursor: pointer; }
  .btn.buy { background: var(--teal); border-color: var(--teal); color: #fff; }
  .btn.ai { grid-column: 1 / -1; }
  .btn:focus-visible, .tabs button:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
  dialog { border: none; border-radius: 14px; padding: 0; width: min(640px, calc(100vw - 32px));
           background: var(--card); color: var(--ink); }
  dialog::backdrop { background: rgb(0 0 0 / .5); }
  .modal { padding: 18px; display: grid; gap: 14px; max-height: 85vh; overflow-y: auto; }
  .modal h2 { margin: 0; font-size: 17px; }
  .field label { display: flex; justify-content: space-between; align-items: center;
                 font-size: 13px; color: var(--muted); margin-bottom: 4px; }
  .field .box { white-space: pre-wrap; background: var(--bg); border: 1px solid var(--line);
                border-radius: 8px; padding: 10px; }
  .copy { font: inherit; font-size: 12px; border: 1px solid var(--line); background: var(--card);
          color: var(--ink); border-radius: 6px; padding: 3px 8px; cursor: pointer; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat { background: var(--bg); border-radius: 8px; padding: 8px; text-align: center; }
  .stat b { display: block; font-size: 18px; }
  .stat span { font-size: 12px; color: var(--muted); }
  .error-msg { color: var(--red); }
  @media (prefers-reduced-motion: no-preference) { .card.new { animation: pop .6s ease-out; } }
  @keyframes pop { from { transform: scale(.97); box-shadow: 0 0 0 3px var(--teal); } }
  .top-actions { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .link { background: none; border: none; color: var(--muted); font: inherit; font-size: 13px;
          cursor: pointer; text-decoration: underline; padding: 4px; }
  .panel { max-width: 720px; margin: 0 auto; padding: 16px; display: grid; gap: 14px; }
  .panel h2 { font-size: 16px; margin: 0; }
  .box-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px;
              display: grid; gap: 10px; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .row .meta { overflow-wrap: anywhere; }
  label.input { display: grid; gap: 4px; font-size: 13px; color: var(--muted); }
  input, textarea { font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line);
                    border-radius: 8px; padding: 10px; width: 100%; }
  input:focus-visible, textarea:focus-visible, .link:focus-visible { outline: 3px solid var(--teal); outline-offset: 1px; }
  .hint { font-size: 13px; color: var(--muted); margin: 0; }
  .ok-msg { color: var(--teal); }
  .btn.danger { color: var(--red); }
  [hidden] { display: none !important; }
  .login { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
  .login form { width: min(360px, 100%); }
''',
}
MIMETYPES = {".html": "text/html", ".css": "text/css", ".js": "text/javascript"}

MAX_SEARCHES = 15          # au-delà, le scan devient trop lent et trop insistant pour Vinted
MAX_LOGIN_FAILURES = 5
LOCK_SECONDS = 15 * 60

CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' https://*.vinted.net data:; connect-src 'self'; "
       "frame-ancestors 'none'; base-uri 'none'; form-action 'self'")


def hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)


def load_secret_key(data_dir: Path) -> str:
    """Clé de signature des sessions : variable SECRET_KEY, sinon fichier privé généré une fois."""
    if os.getenv("SECRET_KEY"):
        return os.environ["SECRET_KEY"]
    path = data_dir / "secret_key"
    if not path.exists():
        data_dir.mkdir(parents=True, exist_ok=True)
        path.write_text(secrets.token_hex(32))
        path.chmod(0o600)
    return path.read_text().strip()


class LoginGuard:
    """Bloque une adresse IP 15 minutes après 5 mots de passe faux."""

    def __init__(self):
        self.failures: dict[str, tuple[int, float]] = {}
        self.lock = threading.Lock()

    def locked(self, ip: str) -> bool:
        with self.lock:
            count, until = self.failures.get(ip, (0, 0.0))
            return count >= MAX_LOGIN_FAILURES and time.time() < until

    def fail(self, ip: str) -> None:
        with self.lock:
            count, until = self.failures.get(ip, (0, 0.0))
            if time.time() >= until:
                count = 0
            self.failures[ip] = (count + 1, time.time() + LOCK_SECONDS)

    def success(self, ip: str) -> None:
        with self.lock:
            self.failures.pop(ip, None)


def validate_search(data: dict, domain: str) -> tuple[str, str, float | None]:
    name = str(data.get("name", "")).strip()
    url = str(data.get("url", "")).strip()
    if not 1 <= len(name) <= 60:
        raise ValueError("Donne un nom de 1 à 60 caractères.")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in (domain, domain.removeprefix("www.")) \
            or not parsed.path.startswith("/catalog"):
        raise ValueError(f"Colle l'adresse d'une page de résultats {domain} (https://{domain}/catalog?...).")
    if not search_url_to_params(url):
        raise ValueError("Cette adresse ne contient aucun filtre : fais d'abord une recherche sur Vinted.")
    max_price = data.get("max_price")
    if max_price in (None, ""):
        return name, url, None
    max_price = float(max_price)
    if not 1 <= max_price <= 100_000:
        raise ValueError("Le prix maximum doit être entre 1 et 100 000 €.")
    return name, url, max_price


def validate_settings(data: dict) -> dict:
    deal, error = float(data["deal_discount"]), float(data["error_discount"])
    keywords = [str(k).strip()[:40] for k in data.get("exclude_keywords", []) if str(k).strip()]
    if not 0.1 <= deal <= 0.9 or not deal < error <= 0.95:
        raise ValueError("Seuils invalides : bonne affaire entre 10 et 90 %, erreur de prix au-dessus.")
    if len(keywords) > 60:
        raise ValueError("60 mots exclus au maximum.")
    return {"deal_discount": deal, "error_discount": error, "exclude_keywords": keywords}


def create_app(scanner: Scanner, password: str, secret_key: str, secure_cookies: bool = True,
               trust_proxy: bool = False) -> Flask:
    if len(password) < 10:
        raise SystemExit("BOT_PASSWORD doit faire au moins 10 caractères.")
    salt = secrets.token_bytes(16)
    password_hash = hash_password(password, salt)
    # Change dès que le mot de passe change : les anciennes sessions deviennent invalides.
    session_tag = hashlib.sha256(password_hash).hexdigest()[:16]
    guard = LoginGuard()
    assets = ASSETS or {p.name: p.read_text(encoding="utf-8") for p in WEB_DIR.iterdir() if p.is_file()}

    def page(name: str) -> Response:
        return Response(assets[name], mimetype=MIMETYPES[Path(name).suffix])

    app = Flask(__name__, static_folder=None)
    app.config.update(
        SECRET_KEY=secret_key,
        SESSION_COOKIE_NAME="vinted_bot",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Strict",
        SESSION_COOKIE_SECURE=secure_cookies,
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
        MAX_CONTENT_LENGTH=16 * 1024,
    )
    if trust_proxy:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    def logged_in() -> bool:
        return session.get("auth") == session_tag

    @app.before_request
    def protect():
        if request.method not in ("GET", "HEAD"):
            # Refuse les requêtes envoyées par un autre site (CSRF).
            origin = request.headers.get("Origin")
            same_site = request.headers.get("Sec-Fetch-Site") == "same-origin"
            if not same_site and (not origin or urlparse(origin).netloc != request.host):
                abort(403)
        if request.endpoint in ("login_page", "login", "healthz", "static_file"):
            return None
        if not logged_in():
            if request.path.startswith("/api/"):
                return jsonify(error="Connexion requise"), 401
            return redirect("/login")
        return None

    @app.after_request
    def headers(resp):
        resp.headers["Content-Security-Policy"] = CSP
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        resp.headers["Cache-Control"] = "no-store"
        if secure_cookies:
            resp.headers["Strict-Transport-Security"] = "max-age=31536000"
        return resp

    @app.get("/healthz")
    def healthz():
        return "ok"

    @app.get("/login")
    def login_page():
        if logged_in():
            return redirect("/")
        return page("login.html")

    @app.post("/login")
    def login():
        ip = request.remote_addr or "?"
        if guard.locked(ip):
            return redirect("/login?erreur=bloque")
        given = request.form.get("password", "")[:200]
        if not hmac.compare_digest(hash_password(given, salt), password_hash):
            guard.fail(ip)
            log.warning("Mot de passe incorrect depuis %s", ip)
            time.sleep(1)
            return redirect("/login?erreur=1")
        guard.success(ip)
        session.clear()                       # nouvelle session : évite la fixation de session
        session.permanent = True
        session["auth"] = session_tag
        return redirect("/")

    @app.post("/logout")
    def logout():
        session.clear()
        return redirect("/login")

    @app.get("/")
    def index():
        return page("index.html")

    @app.get("/<any('app.js', 'style.css'):name>")
    def static_file(name):
        return page(name)

    @app.get("/api/state")
    def state():
        return jsonify(scanner.state())

    @app.get("/api/searches")
    def list_searches():
        return jsonify(searches=scanner.store.list_searches(), max=MAX_SEARCHES)

    @app.post("/api/searches")
    def add_search():
        if len(scanner.store.list_searches()) >= MAX_SEARCHES:
            return jsonify(error=f"{MAX_SEARCHES} recherches au maximum."), 400
        try:
            name, url, max_price = validate_search(request.get_json(force=True) or {}, scanner.domain)
            scanner.store.add_search(name, url, max_price)
        except (ValueError, TypeError) as exc:
            return jsonify(error=str(exc)), 400
        except sqlite3.IntegrityError:
            return jsonify(error="Une recherche porte déjà ce nom."), 400
        return jsonify(searches=scanner.store.list_searches()), 201

    @app.delete("/api/searches/<int:search_id>")
    def delete_search(search_id):
        scanner.store.delete_search(search_id)
        return jsonify(searches=scanner.store.list_searches())

    @app.get("/api/settings")
    def get_settings():
        return jsonify(scanner.settings())

    @app.put("/api/settings")
    def put_settings():
        try:
            values = validate_settings(request.get_json(force=True) or {})
        except (ValueError, TypeError, KeyError):
            return jsonify(error="Réglages invalides : bonne affaire entre 10 et 90 %, "
                                 "erreur de prix au-dessus (95 % max)."), 400
        scanner.store.set_settings(values)
        return jsonify(scanner.settings())

    @app.post("/api/resale")
    def resale():
        try:
            deal_id = int((request.get_json(force=True) or {})["id"])
        except (ValueError, KeyError, TypeError):
            return jsonify(error="Requête invalide"), 400
        deal = scanner.get_deal(deal_id)
        if not deal:
            return jsonify(error="Annonce inconnue"), 404
        return jsonify(write_listing(deal[0], deal[1], scanner.ai))

    return app


def env_flag(name: str, default: bool) -> bool:
    return os.getenv(name, "1" if default else "0").lower() in ("1", "true", "yes", "oui")


def main() -> None:
    from waitress import serve

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    password = os.getenv("BOT_PASSWORD", "")
    if not password:
        raise SystemExit("Définis le mot de passe du site : variable BOT_PASSWORD (10 caractères minimum).")
    data_dir = Path(os.getenv("DATA_DIR", "data"))
    store = Storage(data_dir / "vinted.db")
    scanner = Scanner(
        store,
        domain=os.getenv("VINTED_DOMAIN", "www.vinted.fr"),
        poll_seconds=float(os.getenv("POLL_SECONDS", "60")),
        ai=AIConfig(provider=os.getenv("AI_PROVIDER", "auto"),
                    model=os.getenv("AI_MODEL", "gemma3:4b"),
                    host=os.getenv("OLLAMA_HOST", "http://localhost:11434")),
    )
    app = create_app(scanner, password, load_secret_key(data_dir),
                     secure_cookies=env_flag("SECURE_COOKIES", True),
                     trust_proxy=env_flag("TRUST_PROXY", False))
    threading.Thread(target=scanner.run_forever, daemon=True).start()
    host, port = os.getenv("HOST", "127.0.0.1"), int(os.getenv("PORT", "8000"))
    log.info("Site du bot Vinted sur http://%s:%s", host, port)
    serve(app, host=host, port=port, threads=8, ident="")


if __name__ == "__main__":
    main()
