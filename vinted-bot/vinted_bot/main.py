"""Boucle principale : surveille les recherches Vinted 24h/24 et envoie les alertes."""
from __future__ import annotations

import argparse
import logging
import os
import random
import time
from dataclasses import dataclass, fields

import requests
import yaml

from .notify import ConsoleNotifier, Telegram
from .pricing import Rules, evaluate
from .storage import Storage
from .vinted import VintedBlocked, VintedClient, search_url_to_params

log = logging.getLogger("vinted_bot")


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


class Bot:
    def __init__(self, cfg: dict, searches: list[Search]):
        self.domain = cfg.get("domain", "www.vinted.fr")
        self.poll_seconds = float(cfg.get("poll_seconds", 60))
        self.refresh_minutes = float(cfg.get("market_refresh_minutes", 60))
        self.searches = searches
        self.client = VintedClient(self.domain)
        self.store = Storage(cfg.get("database", "data/vinted.db"))
        token, chat = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
        self.notifier = Telegram(token, chat, self.domain) if token and chat else ConsoleNotifier(self.domain)
        self.last_refresh: dict[str, float] = {}
        self.failures = 0

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
            self.refresh_market(search, pages=3 if first else 1)
        alerts = 0
        for item in self.client.search(search.params, order="newest_first"):
            if self.store.is_known(item.id):
                continue
            verdict = evaluate(self.store, search.name, item, search.rules)
            self.store.record(search.name, item, notified=verdict is not None)
            if verdict:
                log.info("Alerte %s : %s à %.2f (médiane %.2f)", verdict.kind, item.title,
                         item.price, verdict.median)
                self.notifier.send_alert(search.name, item, verdict)
                alerts += 1
        return alerts

    def run_forever(self) -> None:
        names = ", ".join(s.name for s in self.searches)
        self.notifier.send_text(f"✅ Bot Vinted démarré — {len(self.searches)} recherche(s) : {names}")
        backoff = 60.0
        while True:
            started = time.time()
            try:
                for search in self.searches:
                    self.poll(search)
                    self.pause()
                self.failures, backoff = 0, 60.0
                self.store.purge(max(s.rules.max_age_days for s in self.searches))
            except VintedBlocked as exc:
                self.on_failure(f"Vinted limite les requêtes ({exc}), pause de {backoff:.0f} s")
                time.sleep(backoff)
                backoff = min(backoff * 2, 900)
                self.client.session.cookies.clear()
                continue
            except (requests.RequestException, ValueError) as exc:
                self.on_failure(f"Erreur réseau : {exc}")
            time.sleep(max(5.0, self.poll_seconds - (time.time() - started)))

    def on_failure(self, message: str) -> None:
        self.failures += 1
        log.warning(message)
        if self.failures == 10:
            self.notifier.send_text(f"⚠️ Le bot échoue depuis 10 cycles : {message}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Détecteur d'erreurs de prix Vinted")
    parser.add_argument("-c", "--config", default=os.getenv("VINTED_BOT_CONFIG", "config.yaml"))
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cfg, searches = load_config(args.config)
    Bot(cfg, searches).run_forever()


if __name__ == "__main__":
    main()
