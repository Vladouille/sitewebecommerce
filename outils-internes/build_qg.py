"""Construit qg/index.html (version Hostinger + Supabase) à partir de la version artifact.

Usage : python3 outils-internes/build_qg.py
Relancer après chaque modification de qg-associes.html ou qg-adapter.js.
L'adresse de la fonction déjà saisie dans qg/index.html est conservée.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'outils-internes' / 'qg-associes.html'
ADAPTER = ROOT / 'outils-internes' / 'qg-adapter.js'
OUT = ROOT / 'qg' / 'index.html'
PLACEHOLDER = 'https://VOTRE-PROJET.supabase.co/functions/v1/qg'

app = SRC.read_text(encoding='utf-8')
adapter = ADAPTER.read_text(encoding='utf-8')

url = PLACEHOLDER
if OUT.exists():
    m = re.search(r"FUNCTION_URL:\s*'([^']+)'", OUT.read_text(encoding='utf-8'))
    if m:
        url = m.group(1)


def rep(old, new):
    global app
    assert app.count(old) == 1, (old[:70], app.count(old))
    app = app.replace(old, new)


# Textes propres à la version Claude
rep("Enregistrement impossible (' + esc(err && err.code || 'erreur') + '). Vérifie ta connexion et que ton compte a le niveau Éditeur.",
    "Enregistrement impossible (' + esc(err && err.code || 'erreur') + '). Vérifie ta connexion puis réessaie.")
rep("  rate_limited: 'Limite d’utilisation de Claude atteinte sur ton compte. Réessaie plus tard, ou demande à un associé de lancer l’analyse.',",
    "  rate_limited: 'Trop d’analyses d’affilée : attends une minute puis relance.',\n"
    "  api_key: 'Clé API Anthropic invalide : vérifie le secret ANTHROPIC_API_KEY dans Supabase.',\n"
    "  no_credit: 'Crédit API Anthropic épuisé : recharge-le sur console.anthropic.com.',\n"
    "  not_configured: 'Le serveur n’est pas encore configuré (secret QG_CODE).',")

title = re.search(r'<title>.*?</title>\n', app).group(0)
app = app.replace(title, '', 1)
app = app.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)

ICON = ('data:image/svg+xml,' +
        "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%233B5BDB'/%3E"
        "%3Ctext x='32' y='42' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3EQG%3C/text%3E%3C/svg%3E")

html = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#3B5BDB">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="QG">
<link rel="icon" href="{ICON}">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
{title.strip()}
<style>
:root {{ padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }}
body {{ margin: 0; }}
img {{ max-width: 100%; }}
[hidden] {{ display: none !important; }}
</style>
<script>
/* Seule ligne à modifier : l'adresse de ta fonction Supabase "qg". */
window.QG_CONFIG = {{ FUNCTION_URL: '{url}' }};
</script>
<script>
{adapter}
</script>
</head>
<body>
{app}
</body>
</html>
"""
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(html, encoding='utf-8')
print('écrit', OUT, '· FUNCTION_URL =', url)
