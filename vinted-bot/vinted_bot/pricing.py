"""Détection des prix anormalement bas par rapport au marché observé."""
from __future__ import annotations

import re
import statistics
from dataclasses import dataclass

from .storage import Storage
from .vinted import Item


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
