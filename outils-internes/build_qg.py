"""Construit qg/index.html : version autonome (sans IA, sans Claude), en un seul fichier HTML.

Usage : python3 outils-internes/build_qg.py
Relancer après chaque modification de qg-associes.html ou qg-adapter.js.
Les valeurs SUPABASE_URL et SUPABASE_KEY déjà saisies dans qg/index.html sont conservées.
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'outils-internes' / 'qg-associes.html'
ADAPTER = ROOT / 'outils-internes' / 'qg-adapter.js'
ICON_PNG = ROOT / 'outils-internes' / 'icon-180.png'
OUT = ROOT / 'qg' / 'index.html'

app = SRC.read_text(encoding='utf-8')
adapter = ADAPTER.read_text(encoding='utf-8')

cfg = {'SUPABASE_URL': 'https://VOTRE-PROJET.supabase.co', 'SUPABASE_KEY': 'VOTRE-CLE-PUBLIQUE'}
if OUT.exists():
    old = OUT.read_text(encoding='utf-8')
    for k in cfg:
        m = re.search(k + r":\s*'([^']*)'", old)
        if m:
            cfg[k] = m.group(1)


import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sans_ia import sans_ia  # noqa: E402
app = sans_ia(app)

title = re.search(r'<title>.*?</title>\n', app).group(0)
app = app.replace(title, '', 1)
app = app.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)

ICON_SVG = ('data:image/svg+xml,' +
            "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%233B5BDB'/%3E"
            "%3Ctext x='32' y='42' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3EQG%3C/text%3E%3C/svg%3E")
apple = 'data:image/png;base64,' + base64.b64encode(ICON_PNG.read_bytes()).decode()

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
<link rel="icon" href="{ICON_SVG}">
<link rel="apple-touch-icon" href="{apple}">
{title.strip()}
<style>
:root {{ padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }}
body {{ margin: 0; }}
[hidden] {{ display: none !important; }}
</style>
<script>
/* ===== Les 2 seules lignes à remplir (Supabase > Project Settings > API) ===== */
window.QG_CONFIG = {{
  SUPABASE_URL: '{cfg['SUPABASE_URL']}',
  SUPABASE_KEY: '{cfg['SUPABASE_KEY']}',
}};
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
print('écrit', OUT, '·', len(html) // 1024, 'Ko ·', cfg['SUPABASE_URL'])
