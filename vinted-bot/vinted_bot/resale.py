"""Annonce de revente gratuite : IA locale (Ollama) ou modèle intégré en secours.

Les prix sont toujours calculés ici à partir du marché observé, jamais par l'IA :
ils restent fiables même avec un petit modèle local.
"""
from __future__ import annotations

import base64
import json
import logging
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import requests

from .pricing import Verdict
from .vinted import Item

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
