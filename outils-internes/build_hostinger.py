"""Construit la version Hostinger du QG (page + api.php, aucun compte, aucun service externe).

Usage : python3 outils-internes/build_hostinger.py
Produit le dossier qg/ (à déposer dans public_html/qg sur Hostinger).
config.php (la clé secrète) n'est jamais créé ici ni versionné : il est généré au moment de la livraison.
"""
import base64
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from sans_ia import sans_ia  # noqa: E402

OUT = ROOT / 'qg'
app = sans_ia((HERE / 'qg-associes.html').read_text(encoding='utf-8'))
adapter = (HERE / 'qg-php-adapter.js').read_text(encoding='utf-8')
DEFAULT_NAMES = ['Vladimir', 'Alexandre', 'Associé 3']


def rep(old, new, count=1):
    global app
    assert app.count(old) == count, (old[:70], app.count(old))
    app = app.replace(old, new)


app = app.replace('window.claude', 'window.QG_RT')

# Aucun écran au démarrage : prénoms par défaut (modifiables dans Réglages), téléphone attribué par le lien.
rep("const DEFAULT_NAMES = ['Moi', 'Associé 1', 'Associé 2'];", "const DEFAULT_NAMES = " + repr(DEFAULT_NAMES).replace("'", "'") + ";")
rep("""  if (!hasNames) return S.canWrite === false ? noAccess() : setupScreen();
  if (!PEOPLE.includes(S.me)) return whoScreen();""",
    """  if (!PEOPLE.includes(S.me)) { S.me = '0'; }""")

# Pas de notifications : seuls les vrais problèmes s'affichent.
for msg in ["toast('Objectif atteint. Bravo à vous trois.');", "toast('Supprimé.');", "toast('Numéro copié.');",
            "toast('Sauvegarde enregistrée.'); ", "toast('Sauvegarde copiée.');"]:
    rep(msg, '')
rep("toast('Ce téléphone est maintenant celui de ' + name(S.me) + '.');", '')
rep("    if (next === 'atteint') \n", "")
css_hide = ".save[data-state=\"ok\"], .save[data-state=\"saving\"] { display: none; }\n"
rep("pre.json {", css_hide + "pre.json {")

assert 'window.claude' not in app
title = re.search(r'<title>.*?</title>\n', app).group(0)
body = app.replace(title, '', 1).replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)
icon_svg = ('data:image/svg+xml,' +
            "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%233B5BDB'/%3E"
            "%3Ctext x='32' y='42' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3EQG%3C/text%3E%3C/svg%3E")
apple = 'data:image/png;base64,' + base64.b64encode((HERE / 'icon-180.png').read_bytes()).decode()
html = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#3B5BDB">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="QG">
<link rel="icon" href="{icon_svg}">
<link rel="apple-touch-icon" href="{apple}">
{title.strip()}
<style>
:root {{ padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }}
body {{ margin: 0; }}
[hidden] {{ display: none !important; }}
</style>
<script>
{adapter}
</script>
</head>
<body>
{body}
</body>
</html>
"""
if OUT.exists():
    for f in OUT.iterdir():
        if f.name in ('index.html', 'api.php', '.htaccess'):
            f.unlink()
OUT.mkdir(exist_ok=True)
(OUT / 'index.html').write_text(html, encoding='utf-8')
shutil.copy(HERE / 'hostinger' / 'api.php', OUT / 'api.php')
(OUT / '.htaccess').write_text(
    "# QG des associés\n"
    "Options -Indexes\n"
    "<IfModule mod_headers.c>\n  Header set X-Robots-Tag \"noindex, nofollow\"\n  Header set Cache-Control \"no-cache\"\n</IfModule>\n"
    "<FilesMatch \"^(config\\.php|.*\\.json|.*\\.lock|.*\\.tmp)$\">\n  Require all denied\n</FilesMatch>\n",
    encoding='utf-8')
print('ok : qg/index.html, qg/api.php, qg/.htaccess')
