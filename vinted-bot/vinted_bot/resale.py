"""Rédaction par IA d'une meilleure annonce pour revendre un article acheté."""
from __future__ import annotations

import json

import anthropic

from .pricing import Verdict
from .vinted import Item

MODEL = "claude-opus-5-5"

SYSTEM = (
    "Tu es un expert de la revente sur Vinted. Tu rédiges des annonces en français qui "
    "se vendent vite : titre clair avec marque, modèle, taille et état ; description "
    "honnête et structurée (état réel, défauts éventuels, mesures ou taille, conseils "
    "d'entretien si utile, envoi rapide). Tu n'inventes jamais une caractéristique que "
    "tu ne vois pas sur la photo ou dans les informations fournies : si une information "
    "manque (mesures, numéro de série, défauts), indique-la entre crochets à compléter. "
    "Le prix conseillé reste cohérent avec la médiane du marché fournie."
)

SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "Titre Vinted, 60 caractères max"},
        "description": {"type": "string"},
        "suggested_price": {"type": "number", "description": "Prix de revente conseillé en euros"},
        "quick_sale_price": {"type": "number", "description": "Prix pour vendre en quelques jours"},
        "hashtags": {"type": "array", "items": {"type": "string"}},
        "photo_tips": {"type": "array", "items": {"type": "string"},
                       "description": "Conseils pour refaire de meilleures photos"},
    },
    "required": ["title", "description", "suggested_price", "quick_sale_price",
                 "hashtags", "photo_tips"],
    "additionalProperties": False,
}


class ResaleError(Exception):
    pass


def _prompt(item: Item, verdict: Verdict) -> str:
    return (
        "Voici une annonce Vinted que je viens d'acheter pour la revendre. "
        "Rédige une meilleure annonce.\n\n"
        f"Titre d'origine : {item.title}\n"
        f"Marque : {item.brand or 'inconnue'}\n"
        f"Taille : {item.size or 'non précisée'}\n"
        f"État : {item.status or 'non précisé'}\n"
        f"Prix d'achat : {item.price:.2f} € (total payé ≈ {item.total_price:.2f} €)\n"
        f"Médiane des annonces comparables sur Vinted : {verdict.median:.2f} € "
        f"(sur {verdict.samples} annonces : {verdict.basis})"
    )


def write_listing(item: Item, verdict: Verdict, client: anthropic.Anthropic | None = None) -> dict:
    client = client or anthropic.Anthropic()
    content: list[dict] = [{"type": "text", "text": _prompt(item, verdict)}]
    if item.photo_url:
        content.insert(0, {"type": "image", "source": {"type": "url", "url": item.photo_url}})
    try:
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            system=SYSTEM,
            messages=[{"role": "user", "content": content}],
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.AuthenticationError as exc:
        raise ResaleError("Clé API Anthropic invalide ou absente (ANTHROPIC_API_KEY).") from exc
    except anthropic.RateLimitError as exc:
        raise ResaleError("Trop de demandes à l'IA, réessaie dans une minute.") from exc
    except anthropic.APIStatusError as exc:
        raise ResaleError(f"Erreur de l'IA ({exc.status_code}) : {exc.message}") from exc
    except anthropic.APIConnectionError as exc:
        raise ResaleError("Impossible de joindre l'IA, vérifie ta connexion.") from exc

    if response.stop_reason == "refusal":
        raise ResaleError("L'IA a refusé de rédiger cette annonce.")
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        listing = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ResaleError("Réponse de l'IA illisible, réessaie.") from exc
    listing["estimated_profit"] = round(listing["suggested_price"] - item.total_price, 2)
    return listing
