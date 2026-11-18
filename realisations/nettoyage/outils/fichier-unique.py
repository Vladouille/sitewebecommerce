"""Génère nettoyage-fichier-unique.html : tout le site dans UN seul fichier HTML.

Usage (depuis le dossier realisations/nettoyage) :  python3 outils/fichier-unique.py
- styles, scripts, config, polices et photos intégrés (base64) ; GSAP + Lenis intégrés (outils/vendor/)
- fonctionne en double-clic et hors ligne ; mentions légales dans une fenêtre (#mentions)
- config.js reste lisible tout en haut du fichier : on peut le modifier directement dedans
"""
import base64, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'nettoyage-fichier-unique.html')
read = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
b64 = lambda p, mime: f'data:{mime};base64,' + base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode('ascii')
safe = lambda js: js.replace('</script', '<\\/script')

html = read('index.html')
css = read('assets/css/style.css')
css = css.replace('url("../fonts/space-grotesk-var.woff2")', f'url("{b64("assets/fonts/space-grotesk-var.woff2", "font/woff2")}")')
css = css.replace('url("../fonts/manrope-var.woff2")', f'url("{b64("assets/fonts/manrope-var.woff2", "font/woff2")}")')

# 1. config lisible en tête + images intégrées (grande version de chaque image)
config = read('assets/js/config.js')
imgs = sorted({m for m in re.findall(r'"(assets/img/[a-z0-9-]+)"', config)})
img_map = ',\n'.join(f'  "{m}": "{b64(m + ".webp", "image/webp")}"' for m in imgs)
html = html.replace('<script src="assets/js/config.js"></script>',
    '<!-- ═══ CONFIG : modifiez ici le nom, les coordonnées, les couleurs, les textes ═══ -->\n<script>\n' + safe(config) + '\n</script>', 1)

# 2. styles intégrés, préchargement de polices inutile
html = re.sub(r'<script>\s*/\* Préchargement des polices.*?</script>\n', '', html, flags=re.S)
html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n' + css + '\n</style>', 1)

# 3. mentions légales : fenêtre dans la page
legal = read('mentions-legales.html')
legal_body = re.search(r'<main id="main" class="legal">\s*<div class="wrap">(.*?)</div>\s*</main>', legal, re.S).group(1)
dialog = ('<dialog class="legal-dialog" id="mentions" aria-labelledby="mentions-title">'
          '<button class="round legal-close" type="button" aria-label="Fermer les mentions légales">✕</button>'
          + legal_body.replace('<h1>Mentions légales</h1>', '<h2 id="mentions-title" class="legal-h">Mentions légales</h2>')
                      .replace('<h2>', '<h3>').replace('</h2>', '</h3>').replace('<h3 id="mentions-title" class="legal-h">', '<h2 id="mentions-title" class="legal-h">')
          + '</dialog>')
# corrige la seule balise de titre principale transformée trop tôt
dialog = dialog.replace('<h2 id="mentions-title" class="legal-h">Mentions légales</h3>', '<h2 id="mentions-title" class="legal-h">Mentions légales</h2>')
html = html.replace('<a href="mentions-legales.html">Mentions légales</a>', '<a href="#mentions" data-open-legal>Mentions légales</a>')
legal_css = """
.legal-dialog { width: min(760px, calc(100vw - 32px)); max-height: calc(100dvh - 80px); border: 1px solid var(--line); border-radius: var(--r); padding: clamp(22px, 4vw, 44px); background: var(--bg); color: var(--tx); }
.legal-dialog::backdrop { background: rgba(5, 12, 18, .55); }
.legal-dialog .legal-h { font-size: clamp(2rem, 5vw, 3rem); margin-top: 10px; }
.legal-dialog section { margin-top: 26px; display: grid; gap: 8px; }
.legal-dialog h3 { font-size: 1.25rem; }
.legal-dialog p { color: var(--mut); }
.legal-close { float: right; }
"""
html = html.replace('</style>', legal_css + '</style>', 1)

# 4. scripts : app (avec images intégrées), GSAP + Lenis intégrés, motion
vendor = lambda f: open(os.path.join(ROOT, 'outils', 'vendor', f), encoding='utf-8').read()
scripts = ('<script>\nwindow.__IMAGES = {\n' + img_map + '\n};\n</script>\n'
           '<script>\n' + safe(read('assets/js/app.js')) + '\n</script>\n'
           '<script>\n/* Mentions légales (fenêtre) */\n(function () { var d = document.getElementById("mentions"); if (!d) return;'
           ' document.querySelectorAll("[data-open-legal]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }); });'
           ' d.querySelector(".legal-close").addEventListener("click", function () { d.close(); }); })();\n</script>\n'
           '<script>\n' + safe(vendor('gsap.min.js')) + '\n</script>\n'
           '<script>\n' + safe(vendor('ScrollTrigger.min.js')) + '\n</script>\n'
           '<script>\n' + safe(vendor('lenis.min.js')) + '\n</script>\n'
           '<script>\n' + safe(read('assets/js/motion.js')) + '\n</script>\n')
start = html.index('<script src="assets/js/app.js" defer></script>')
end = html.index('<script src="assets/js/motion.js" defer></script>') + len('<script src="assets/js/motion.js" defer></script>')
html = html[:start] + dialog + '\n' + scripts + html[end:]
html = html.replace('<!doctype html>', '<!doctype html>\n<!-- Version « fichier unique » générée par outils/fichier-unique.py. Source : index.html + assets/. -->', 1)

leftover = [m for m in re.findall(r'(?:src|href)="(assets/[^"]+|mentions-legales\.html)"', html)]
if leftover: sys.exit('Références externes restantes : ' + ', '.join(leftover))
open(OUT, 'w', encoding='utf-8').write(html)
print(f'{len(imgs)} images, 2 polices, GSAP + Lenis intégrés → {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} Ko)')
