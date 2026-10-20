"""Alertes Telegram avec boutons « Acheter » et « Voir l'annonce » (un seul clic)."""
from __future__ import annotations

import html
import logging

import requests

from .pricing import Verdict
from .vinted import Item

log = logging.getLogger(__name__)


def format_alert(search: str, item: Item, verdict: Verdict) -> str:
    head = "🚨 ERREUR DE PRIX PROBABLE" if verdict.kind == "error" else "🔥 Bonne affaire"
    details = " · ".join(x for x in (item.brand, item.size, item.status) if x)
    e = html.escape
    return (
        f"<b>{head}</b> — {e(search)}\n"
        f"<b>{e(item.title)}</b>\n"
        f"{e(details)}\n\n"
        f"💶 <b>{item.price:.2f} {e(item.currency)}</b> "
        f"(total avec frais ≈ {item.total_price:.2f})\n"
        f"📊 Médiane du marché : {verdict.median:.2f} {e(item.currency)} "
        f"→ <b>-{verdict.discount:.0%}</b>\n"
        f"🔎 Basé sur {verdict.samples} annonces ({e(verdict.basis)})\n"
        f"👤 {e(item.seller)}"
    )


class Telegram:
    def __init__(self, token: str, chat_id: str, domain: str):
        self.base = f"https://api.telegram.org/bot{token}"
        self.chat_id = chat_id
        self.domain = domain

    def _post(self, method: str, payload: dict) -> bool:
        try:
            r = requests.post(f"{self.base}/{method}", json=payload, timeout=15)
            if r.ok:
                return True
            log.warning("Telegram %s a échoué : %s", method, r.text[:200])
        except requests.RequestException as exc:
            log.warning("Telegram injoignable : %s", exc)
        return False

    def send_text(self, text: str) -> None:
        self._post("sendMessage", {"chat_id": self.chat_id, "text": text,
                                   "parse_mode": "HTML", "disable_web_page_preview": True})

    def send_alert(self, search: str, item: Item, verdict: Verdict) -> None:
        caption = format_alert(search, item, verdict)
        keyboard = {"inline_keyboard": [
            [{"text": "🛒 Acheter maintenant", "url": item.buy_url(self.domain)}],
            [{"text": "👀 Voir l'annonce", "url": item.url}],
        ]}
        if item.photo_url and self._post("sendPhoto", {
            "chat_id": self.chat_id, "photo": item.photo_url, "caption": caption,
            "parse_mode": "HTML", "reply_markup": keyboard,
        }):
            return
        self._post("sendMessage", {"chat_id": self.chat_id, "text": caption,
                                   "parse_mode": "HTML", "reply_markup": keyboard})


class ConsoleNotifier:
    """Utilisé quand Telegram n'est pas configuré (tests, premier essai)."""

    def __init__(self, domain: str):
        self.domain = domain

    def send_text(self, text: str) -> None:
        print(text, flush=True)

    def send_alert(self, search: str, item: Item, verdict: Verdict) -> None:
        print(format_alert(search, item, verdict), flush=True)
        print(f"  Acheter : {item.buy_url(self.domain)}\n  Annonce : {item.url}\n", flush=True)
