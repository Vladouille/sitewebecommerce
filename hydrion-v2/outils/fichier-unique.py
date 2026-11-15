"""Génère hydrion-fichier-unique.html : index.html avec toutes les images intégrées (base64).

Usage, depuis le dossier hydrion-v2 :  python3 outils/fichier-unique.py
Une seule version WebP par image (pas de variantes ni de JPEG de secours : chaque image
encodée en base64 pèse un tiers de plus, les doubler alourdirait le fichier pour rien).
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'hydrion-fichier-unique.html')
html = open(SRC, encoding='utf-8').read()

def data_uri(name):
    path = os.path.join(ROOT, 'images', name + '.webp')
    return 'data:image/webp;base64,' + base64.b64encode(open(path, 'rb').read()).decode('ascii')

def replace(m):
    block = m.group(0)
    img = re.search(r'<img\b([^>]*)>', block).group(1)
    name = re.search(r'\ssrc="images/([^"]+)\.jpg"', img).group(1)
    attrs = re.sub(r'\s(src|srcset|sizes)="[^"]*"', '', img)
    attrs = attrs.replace(' loading="lazy"', '')  # inutile : l'image est déjà dans le document
    return f'<img src="{data_uri(name)}"{attrs}>'

out, n = re.subn(r'<picture>.*?</picture>', replace, html, flags=re.S)
out = out.replace('<!-- Démo portfolio : non indexée.', '<!-- Version fichier unique : images intégrées en base64. Générée par outils/fichier-unique.py.\n     Démo portfolio : non indexée.', 1)
if 'images/' in re.sub(r'<!--.*?-->', '', out, flags=re.S):
    sys.exit('ERREUR : une référence à images/ subsiste')
open(OUT, 'w', encoding='utf-8').write(out)
print(f'{n} images intégrées → {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} Ko)')
