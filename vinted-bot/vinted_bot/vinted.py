"""Client minimal pour l'API catalogue publique utilisée par le site Vinted."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

import requests

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
