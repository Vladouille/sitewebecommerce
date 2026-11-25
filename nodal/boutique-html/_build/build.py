#!/usr/bin/env python3
"""NODAL — génère la version HTML statique de la boutique.

Usage : python3 nodal/boutique-html/_build/build.py
Source unique des produits et des prix : CATALOGUE ci-dessous (valeurs d'EXEMPLE).
Les textes des pages d'aide et légales viennent de nodal/contenus/*.md.
Les styles et scripts NODAL sont repris du thème Shopify (nodal/theme/assets).
"""
import html
import json
import re
import shutil
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parents[1]          # nodal/boutique-html
NODAL = ROOT.parent                                  # nodal/
THEME_ASSETS = NODAL / "theme" / "assets"
CONTENUS = NODAL / "contenus"
OUT_ASSETS = ROOT / "assets"

# --------------------------------------------------------------------------
# Catalogue (valeurs d'EXEMPLE à remplacer)
# --------------------------------------------------------------------------
SETTINGS = {
    "fab_days": 5, "ship_min": 2, "ship_max": 3,
    "returns_days": 30, "warranty_years": 3,
    "slot_pitch_mm": 130, "workshop_city": "[ville]",
}
RAIL = {
    "slug": "rail-chene", "title": "Rail chêne massif",
    "lengths": ["60 cm", "80 cm", "120 cm"],
    "finishes": [{"name": "Naturel", "color": "#C9A877"}, {"name": "Fumé", "color": "#6B4F33"}],
    "prices": {"60 cm": 7900, "80 cm": 8900, "120 cm": 11900},   # en centimes
    "finish_extra": {"Naturel": 0, "Fumé": 1000},
    "unavailable": [],                                             # ex. [("120 cm", "Fumé")]
    "desc": [
        "Chêne massif français, coupé, poncé et huilé à la main.",
        "Profondeur 30 mm, hauteur 40 mm. Fixation par 2 vis, chevilles béton, brique et placo fournies.",
        "Gabarit de perçage dans la boîte. Pose en 10 minutes environ.",
    ],
}
MODULES = [
    {"slug": "casque", "title": "Module casque", "short": "Casque", "price": 2400, "kg": "8", "usage": "Vélo, moto, ski", "slots": 1,
     "desc": ["Forme enveloppante qui garde la mousse intérieure intacte.", "Convient aux casques de vélo, de moto et de ski."]},
    {"slug": "double-crochet", "title": "Double crochet", "short": "Double crochet", "price": 1900, "kg": "2×5", "usage": "Sac, veste, corde", "slots": 1,
     "desc": ["Deux crochets indépendants, 5 kg chacun.", "Bouts arrondis : rien ne s'accroche ni ne se déchire."]},
    {"slug": "chaussures", "title": "Module chaussures", "short": "Chaussures", "price": 2200, "kg": "3", "usage": "Running, vélo", "slots": 2,
     "desc": ["Une paire, posée à plat, semelles ventilées.", "Occupe 2 emplacements sur le rail."]},
    {"slug": "vide-poche", "title": "Vide-poche", "short": "Vide-poche", "price": 1800, "kg": "1", "usage": "Clés, cardio, gants", "slots": 1,
     "desc": ["Bac à rebord pour les clés, la montre, les gants.", "Fond antidérapant."]},
]
SUGGESTED = ["casque", "chaussures", "double-crochet"]

NAV = [("configurateur.html", "Configurateur"), ("modules.html", "Modules"), ("produit-rail-chene.html", "Rail"),
       ("guide-de-pose.html", "Guide de pose"), ("a-propos.html", "À propos")]
FOOTER = [
    ("Boutique", [("configurateur.html", "Configurateur"), ("modules.html", "Modules"), ("produit-rail-chene.html", "Rail")]),
    ("Aide", [("guide-de-pose.html", "Guide de pose"), ("livraison.html", "Livraison"), ("retours.html", "Retours"),
              ("garantie.html", "Garantie"), ("contact.html", "Contact")]),
    ("NODAL", [("a-propos.html", "À propos")]),
    ("Légal", [("mentions-legales.html", "Mentions légales"), ("cgv.html", "CGV"), ("confidentialite.html", "Confidentialité"),
               ("cookies.html", "Cookies"), ("mediateur.html", "Médiateur")]),
]
PAGES_MD = {
    "livraison.html": "01-livraison.md", "retours.html": "02-retours.md", "garantie.html": "03-garantie.md",
    "guide-de-pose.html": "04-guide-de-pose.md", "a-propos.html": "05-a-propos.md", "contact.html": "06-contact.md",
    "mentions-legales.html": "10-mentions-legales.md", "cgv.html": "11-cgv.md", "confidentialite.html": "12-confidentialite.md",
    "cookies.html": "13-cookies.md", "mediateur.html": "14-mediateur.md",
}

# --------------------------------------------------------------------------
e = lambda s: html.escape(str(s), quote=True)


def euros(c):
    v = c / 100
    s = f"{v:,.2f}".replace(",", " ").replace(".", ",") if c % 100 else f"{int(v):,}".replace(",", " ")
    return f"{s} €"


# Identifiants de variantes : rail 1xx, modules 2xx
rail_variants = []
vid = 100
for L in RAIL["lengths"]:
    for f in RAIL["finishes"]:
        vid += 1
        rail_variants.append({"id": vid, "price": RAIL["prices"][L] + RAIL["finish_extra"][f["name"]],
                              "available": (L, f["name"]) not in RAIL["unavailable"], "options": [L, f["name"]]})
for i, m in enumerate(MODULES):
    m["id"] = 201 + i
mod_by_slug = {m["slug"]: m for m in MODULES}

CATALOG = {"variants": {}}
for v in rail_variants:
    CATALOG["variants"][v["id"]] = {"title": RAIL["title"], "sub": " · ".join(v["options"]), "price": v["price"], "available": v["available"]}
for m in MODULES:
    CATALOG["variants"][m["id"]] = {"title": m["title"], "sub": f"Charge max {m['kg']} kg", "price": m["price"], "available": True}

rail_min = min(v["price"] for v in rail_variants)


def icon(name):
    paths = {
        "truck": '<path d="M1 5h10v8H1zM11 8h4l2 3v2h-6"/><circle cx="4.5" cy="14" r="1.5"/><circle cx="13.5" cy="14" r="1.5"/>',
        "return": '<path d="M3 9a6 6 0 1 0 2-4.5M3 2v3h3"/>',
        "made": '<path d="M2 16h14M4 16V8l5-4 5 4v8M7 16v-4h4v4"/>',
        "shield": '<path d="M9 1l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V4z"/><path d="M6 9l2 2 4-4"/>',
        "clock": '<circle cx="9" cy="9" r="7.5"/><path d="M9 4.5V9l3 2"/>',
    }
    return f'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">{paths[name]}</svg>'


def buybox():
    s = SETTINGS
    return f"""<div class="nd-buybox" role="list">
  <div class="nd-buybox__row" role="listitem">{icon('clock')}<span><b>Livré <span data-nd-eta data-fab="{s['fab_days']}" data-min="{s['ship_min']}" data-max="{s['ship_max']}">sous {s['fab_days'] + s['ship_max']} jours ouvrés</span></b><small>Fabriqué à la commande en {s['fab_days']} jours ouvrés, puis {s['ship_min']} à {s['ship_max']} jours de transport. Livraison offerte.</small></span></div>
  <div class="nd-buybox__row" role="listitem">{icon('return')}<span><b>Retours {s['returns_days']} jours</b><small>Même monté au mur. <a class="nd-link" href="retours.html">Comment ça marche</a></small></span></div>
  <div class="nd-buybox__row" role="listitem">{icon('shield')}<span><b>Garantie {s['warranty_years']} ans</b><small>Rail et modules, en plus de la garantie légale de conformité. <a class="nd-link" href="garantie.html">Détails</a></small></span></div>
</div>"""


def ph(label, cls=""):
    return f'<div class="nd-media nd-ph {cls}"><span>{e(label)}</span></div>'


def layout(fname, title, desc, body, scripts=("nodal.js",), sticky=""):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == fname else ""}>{e(t)}</a>' for h, t in NAV)
    menu = "".join(f'<a href="{h}">{e(t)}</a>' for h, t in NAV)
    cols = "".join(f'<div><h2>{e(t)}</h2><ul>' + "".join(f'<li><a href="{h}">{e(x)}</a></li>' for h, x in links) + "</ul></div>" for t, links in FOOTER)
    js = "".join(f'<script src="assets/{s}" defer></script>' for s in scripts)
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<!-- Aperçu avec des prix d'exemple : ne pas indexer avant les vrais chiffres -->
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0B0D10">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/nodal-space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/nodal.css">
<link rel="stylesheet" href="assets/boutique.css">
<script src="assets/catalogue.js" defer></script>
<script src="assets/boutique.js" defer></script>
{js}
</head>
<body class="nd">
<a class="nd-skip" href="#contenu">Aller au contenu</a>
<p class="nd-preview" role="note">Aperçu de la boutique : prix et délais d'exemple, paiement désactivé.</p>
<header class="nd-hdr">
  <div class="nd-hdr__in">
    <details class="nd-menu">
      <summary class="nd-icon" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7h16M3 15h16"/></svg></summary>
      <nav class="nd-menu__panel" aria-label="Menu principal">{menu}<a class="nd-btn" href="configurateur.html">Composer mon rail</a></nav>
    </details>
    <a class="nd-logo" href="index.html" aria-label="NODAL, accueil">NODAL<i aria-hidden="true"></i></a>
    <nav class="nd-nav" aria-label="Navigation principale">{nav}</nav>
    <a class="nd-icon" href="panier.html" data-cart-label aria-label="Panier">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h14l-1 12H5L4 7Z"/><path d="M8 7V5a3 3 0 0 1 6 0v2"/></svg>
      <span class="nd-count" data-cart-count hidden>0</span>
    </a>
  </div>
</header>
<main id="contenu">
{body}
</main>
<footer class="nd-ftr" data-nd-hide-sticky>
  <div class="nd-wrap">
    <a class="nd-logo" href="index.html">NODAL<i aria-hidden="true"></i></a>
    <div class="nd-ftr__cols">{cols}</div>
    <p class="nd-ftr__legal">© 2026 NODAL · [À COMPLÉTER : raison sociale, SIRET]</p>
  </div>
</footer>
{sticky}
</body>
</html>
"""


# --------------------------------------------------------------------------
# Accueil
# --------------------------------------------------------------------------
def page_index():
    s = SETTINGS
    mods = "".join(f"""<a class="nd-mod" href="module-{m['slug']}.html">{ph('Photo du module en main')}
      <p class="nd-mod__kg">{e(m['kg'])}<small>KG</small></p><p class="nd-mono">charge max</p>
      <h3>{e(m['short'])}</h3><p class="nd-mod__row"><b class="nd-price">{euros(m['price'])}</b><span>{e(m['usage'])}</span></p></a>""" for m in MODULES)
    lens = "".join(f'<button type="button" data-len="{e(L)}" data-price="{RAIL["prices"][L]}" aria-pressed="{"true" if i == 1 else "false"}">{e(L)}</button>' for i, L in enumerate(RAIL["lengths"]))
    faq = [
        ("Ça tient vraiment un casque de moto ?", "Chaque module affiche sa charge maximale et il est testé à 3 fois cette valeur. Un casque de moto pèse 1,3 à 1,8 kg."),
        ("J'ai des murs en placo, c'est possible ?", "Oui. La boîte contient des chevilles pour placo, en plus des chevilles béton et brique. Le <a class=\"nd-link\" href=\"guide-de-pose.html\">guide de pose</a> précise la charge totale par type de mur."),
        ("Ça va abîmer mon mur ?", "Deux trous de 6 mm, rebouchables en 2 minutes si tu déménages. Rien d'autre ne touche le mur."),
        ("Je le reçois quand ?", f"Fabrication sous {s['fab_days']} jours ouvrés, puis {s['ship_min']} à {s['ship_max']} jours de livraison. La date estimée est affichée sur chaque fiche et dans ton panier."),
        ("Et si ça ne me plaît pas une fois posé ?", f"Tu as {s['returns_days']} jours pour le renvoyer, même monté. <a class=\"nd-link\" href=\"retours.html\">Comment ça marche</a>."),
        ("Comment j'entretiens le chêne ?", "Un chiffon sec. Une fois par an, un peu d'huile si tu veux raviver la teinte."),
    ]
    faq_html = "".join(f'<details><summary>{e(q)}</summary><div class="nd-faq__a"><p>{a}</p></div></details>' for q, a in faq)
    body = f"""
<section class="nd-hero" aria-labelledby="t-hero">
  <div class="nd-hero__media nd-media nd-grid-bg"></div>
  <svg class="nd-hero__schema" viewBox="0 0 335 150" aria-hidden="true" focusable="false">
    <g stroke="#9A968C" stroke-width=".8" fill="none"><path d="M12 18v-8M323 18v-8M12 14h311"/></g>
    <text x="150" y="9" fill="#9A968C" font-family="NODAL Grotesk, sans-serif" font-size="8" letter-spacing="1">800 MM</text>
    <rect x="12" y="22" width="311" height="16" fill="#C9A877"/><rect x="12" y="36" width="311" height="2" fill="#8E7350"/>
    <g fill="#E8E4DA"><rect x="44" y="38" width="22" height="26"/><path d="M38 64h34v6H38z"/><rect x="124" y="38" width="10" height="34"/><rect x="152" y="38" width="10" height="34"/><rect x="208" y="38" width="44" height="22"/><rect x="282" y="38" width="8" height="18"/><circle cx="286" cy="62" r="5" fill="none" stroke="#E8E4DA" stroke-width="2"/></g>
    <g fill="#C6FF00" font-family="NODAL Grotesk, sans-serif" font-size="8" font-weight="700"><text x="40" y="84">8 KG</text><text x="130" y="86">2×5 KG</text><text x="214" y="74">3 KG</text><text x="276" y="80">1 KG</text></g>
  </svg>
  <div class="nd-hero__shade"></div>
  <div class="nd-wrap nd-hero__content">
    <h1 class="nd-h1" id="t-hero">Ton sport,<br>au mur.</h1>
    <p class="nd-lead">Un rail en chêne massif. Des modules imprimés en 3D à la main en France. Ton casque, tes chaussures, tes clés&nbsp;: chacun sa place.</p>
    <a class="nd-btn" href="configurateur.html">Composer mon rail</a>
    <div class="nd-hero__sub"><span>Dès <span class="nd-price">{euros(rail_min)}</span> le rail</span><a class="nd-link" href="#modules">Voir les modules</a></div>
  </div>
</section>

<ul class="nd-trust" aria-label="Nos engagements">
  <li>{icon('truck')}<span><b>Livraison offerte</b><small>Expédié sous {s['fab_days']} j ouvrés</small></span></li>
  <li>{icon('return')}<span><b>Retours {s['returns_days']} jours</b><small>Même monté au mur</small></span></li>
  <li>{icon('made')}<span><b>Fait main en France</b><small>Atelier à {e(s['workshop_city'])}</small></span></li>
  <li>{icon('shield')}<span><b>Garantie {s['warranty_years']} ans</b><small>Rail et modules</small></span></li>
</ul>

<section class="nd-section" aria-labelledby="t-ba">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-ba">Même entrée.<br>10 minutes plus tard.</h2>
    <p class="nd-lead">Glisse pour voir la différence.</p>
    <div class="nd-ba" style="--pos:50%">
      {ph("Photo AVANT : entrée encombrée")}
      <div class="nd-media nd-ph nd-ba__after" style="background:#1A1D22"><span style="margin-left:auto">Photo APRÈS : même cadrage, rail posé</span></div>
      <span class="nd-ba__tag nd-ba__tag--l">Avant</span><span class="nd-ba__tag nd-ba__tag--r">Après</span>
      <input type="range" min="0" max="100" value="50" aria-label="Comparer avant et après">
      <div class="nd-ba__handle"></div>
    </div>
  </div>
</section>

<section class="nd-section nd-rule" aria-labelledby="t-how">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-how">Comment ça marche</h2>
    <p class="nd-lead">Pas de perceuse à percussion, pas de chantier.</p>
    <ol class="nd-steps">
      <li class="nd-step"><span class="nd-step__n" aria-hidden="true">01</span><div><h3>Fixe le rail</h3><p>Deux vis, chevilles fournies pour béton, brique ou placo. Gabarit de perçage dans la boîte.</p><p class="nd-mono">≈ 10 min · 2 trous Ø 6 mm</p></div></li>
      <li class="nd-step"><span class="nd-step__n" aria-hidden="true">02</span><div><h3>Accroche les modules</h3><p>Ils se glissent sur le rail et se bloquent. Sans outil, déplaçables à tout moment.</p><p class="nd-mono">0 outil · repositionnable</p></div></li>
      <li class="nd-step"><span class="nd-step__n" aria-hidden="true">03</span><div><h3>Ajoute-en quand tu veux</h3><p>Nouveau vélo, nouveau sport&nbsp;: tu complètes ton rail, sans rien démonter.</p><p class="nd-mono">100 % compatible</p></div></li>
    </ol>
  </div>
</section>

<section class="nd-section nd-rule" id="modules" aria-labelledby="t-mods">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-mods">Les modules</h2>
    <p class="nd-lead">Chaque module affiche sa charge maximale. Testée à 3 fois cette valeur.</p>
    <div class="nd-mods">{mods}</div>
    <p style="margin-top:20px"><a class="nd-link" href="modules.html">Voir tous les modules</a></p>
  </div>
</section>

<section class="nd-section nd-rule nd-proof" aria-labelledby="t-proof">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-proof">Oui, ça tient.</h2>
    <p class="nd-lead">On charge chaque modèle à 3 fois sa charge maximale avant de le vendre. Regarde.</p>
    {ph("Vidéo du test de charge : plan fixe, poids visible, sans coupe")}
    <div class="nd-specs"><div><b>×3</b><span>marge de test</span></div><div><b>[matière]</b><span>matière modules</span></div><div><b>Chêne</b><span>massif, France</span></div></div>
  </div>
</section>

<section class="nd-section nd-rule" aria-labelledby="t-made">
  <div class="nd-wrap nd-atelier__grid">
    <div>
      <h2 class="nd-h2" id="t-made">Fabriqué ici.</h2>
      <p class="nd-lead">Le chêne est coupé, poncé et huilé dans notre atelier. Les modules sortent de nos imprimantes, un par un.</p>
      <div class="nd-founder"><div class="nd-media"></div><p>« [À COMPLÉTER : pourquoi tu as créé NODAL, en une phrase vraie.] »<br><small>[Prénom], fondateur</small></p></div>
    </div>
    <div>
      {ph("Vidéo atelier : imprimante en cours et ponçage du chêne", "nd-atelier__main")}
      <div class="nd-atelier__pair">{ph("Chant du chêne, macro")}{ph("Module à la sortie de l'imprimante")}</div>
    </div>
  </div>
</section>

<section class="nd-section nd-teaser" id="configurateur" data-nd-hide-sticky aria-labelledby="t-cfg">
  <div class="nd-wrap nd-teaser__inner" data-nd-teaser data-pitch="{s['slot_pitch_mm']}">
    <h2 class="nd-h2" id="t-cfg">Compose ton rail</h2>
    <p class="nd-lead">Choisis la longueur. Tu ajoutes les modules à l'étape suivante.</p>
    <div class="nd-seg" role="group" aria-label="Longueur du rail" style="--n:{len(RAIL['lengths'])}">{lens}</div>
    <div class="nd-rail">
      <svg viewBox="0 0 335 60" aria-hidden="true" focusable="false"><g stroke="#9A968C" stroke-width=".8" fill="none"><path d="M0 10v-8"/><path data-dim-r d="M335 10v-8"/><path data-dim-h d="M0 6h335"/></g><rect data-rail x="0" y="16" width="335" height="14" fill="#C9A877"/><g data-slots fill="none" stroke="#C6FF00" stroke-dasharray="2 3"></g></svg>
      <p class="nd-mono nd-rail__meta"><span data-len-txt></span><span data-slot-txt></span></p>
    </div>
    <div class="nd-total"><span>Rail chêne naturel</span><span class="nd-price" data-price-txt>{euros(RAIL['prices'][RAIL['lengths'][1]])}</span></div>
    <a class="nd-btn" data-cta data-base="configurateur.html" href="configurateur.html">Ajouter mes modules</a>
    <p class="nd-mono nd-assure">Livraison offerte · retours {s['returns_days']} jours · garantie {s['warranty_years']} ans</p>
  </div>
</section>

<section class="nd-section nd-rule" aria-labelledby="t-faq">
  <div class="nd-wrap"><h2 class="nd-h2" id="t-faq">Questions</h2><div class="nd-faq">{faq_html}</div></div>
</section>

<section class="nd-section nd-rule nd-nl" data-nd-hide-sticky aria-labelledby="t-nl">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-nl">Nouveaux modules,<br>une fois par mois.</h2>
    <p class="nd-lead">Pas de promo tous les trois jours. Juste ce qui sort de l'atelier.</p>
    <form onsubmit="this.querySelector('[data-ok]').hidden=false;return false">
      <label for="nl-mail" class="nd-mono">Ton email</label>
      <input id="nl-mail" type="email" placeholder="toi@exemple.fr" autocomplete="email" required>
      <button class="nd-btn nd-btn--ghost" type="submit">M'inscrire</button>
      <p class="nd-nl__ok" data-ok hidden role="status">Aperçu : l'inscription sera branchée sur l'outil d'emailing au lancement.</p>
      <p class="nd-nl__legal">Désinscription en un clic dans chaque email. Voir notre <a class="nd-link" href="confidentialite.html">politique de confidentialité</a>.</p>
    </form>
  </div>
</section>
"""
    sticky = f"""<div class="nd-sticky" data-nd-sticky aria-hidden="true"><small>Rail dès<b>{euros(rail_min)}</b></small><a class="nd-btn" href="configurateur.html" tabindex="-1">Composer mon rail</a></div>"""
    return layout("index.html", "NODAL · Ton sport, au mur.",
                  "Rail en chêne massif et modules imprimés en 3D à la main en France pour ranger ton équipement de sport au mur.",
                  body, sticky=sticky)


# --------------------------------------------------------------------------
# Configurateur
# --------------------------------------------------------------------------
def page_configurator():
    data = {
        "pitch": SETTINGS["slot_pitch_mm"], "lenIndex": 0, "finIndex": 1,
        "cartAddUrl": "", "cartUrl": "panier.html", "railTitle": RAIL["title"],
        "finishes": [{"name": f["name"], "color": f["color"], "image": None} for f in RAIL["finishes"]],
        "lengths": RAIL["lengths"], "railVariants": rail_variants,
        "modules": [{"id": m["id"], "title": m["short"], "url": f"module-{m['slug']}.html", "price": m["price"], "available": True,
                     "image": None, "kg": m["kg"], "slots": m["slots"]} for m in MODULES],
        "suggested": [mod_by_slug[s]["id"] for s in SUGGESTED],
    }
    body = f"""
<div class="nd-cfg" data-nd-configurator>
  <div class="nd-wrap">
    <h1 class="nd-h2" style="margin-bottom:6px">Compose ton rail</h1>
    <p class="nd-lead">Choisis ta longueur et ta finition, puis place tes modules. Le prix se met à jour en direct.</p>
    <noscript><p class="nd-cfg__err">Le configurateur a besoin de JavaScript. Tu peux aussi acheter le <a class="nd-link" href="produit-rail-chene.html">rail</a> et les <a class="nd-link" href="modules.html">modules</a> séparément.</p></noscript>
    <div class="nd-cfg__steps" style="margin-top:28px">
      <div class="nd-cfg__board-col">
        <div><div class="nd-cfg__label"><h2>1 · Longueur</h2><span class="nd-mono" data-len-out></span></div><div class="nd-seg" role="group" aria-label="Longueur du rail" data-len-group></div></div>
        <div data-fin-wrap hidden><div class="nd-cfg__label"><h2>2 · Finition</h2><span class="nd-mono" data-fin-out></span></div><div class="nd-finish" role="group" aria-label="Finition du bois" data-fin-group></div></div>
        <div class="nd-board">
          <div class="nd-board__dim nd-mono"><span>0</span><span data-dim-out></span></div>
          <div class="nd-board__scroll" data-board-scroll><div class="nd-board__inner" data-board-inner>
            <div class="nd-board__rail" data-rail-bar></div>
            <div class="nd-slots" data-slots role="group" aria-label="Emplacements du rail"></div>
          </div></div>
          <p class="nd-mono" data-scroll-hint hidden style="margin-top:8px">Fais glisser le rail pour voir la suite</p>
          <p class="nd-hint" data-hint aria-live="polite"></p>
        </div>
      </div>
      <div>
        <div class="nd-cfg__label"><h2><span data-mod-step>3</span> · Modules</h2><span class="nd-mono" data-count-out></span></div>
        <div class="nd-picker" data-picker></div>
        <div class="nd-suggest"><button type="button" data-suggest>Kit suggéré</button><button type="button" data-clear>Vider le rail</button></div>
        <div class="nd-recap" style="margin-top:28px"><div class="nd-cfg__label" style="margin-top:18px"><h2>Récapitulatif</h2></div><ul data-recap></ul></div>
        {buybox()}
      </div>
    </div>
    <div class="nd-cfg__bar"><div class="nd-cfg__bar-in">
      <div><small>Total</small><span class="nd-price" data-total>—</span></div>
      <div><button class="nd-btn" type="button" data-add>Ajouter au panier</button><p class="nd-cfg__err" data-err role="alert" hidden></p></div>
    </div></div>
    <script type="application/json" data-cfg-data>{json.dumps(data, ensure_ascii=False)}</script>
  </div>
</div>"""
    return layout("configurateur.html", "Configurateur · NODAL", "Compose ton rail NODAL : longueur, finition, modules. Prix en direct.",
                  body, scripts=("nodal.js", "nodal-configurator.js"))


# --------------------------------------------------------------------------
# Fiches produit
# --------------------------------------------------------------------------
def product_jsonld(name, desc, price, url):
    return json.dumps({"@context": "https://schema.org", "@type": "Product", "name": name, "description": desc, "brand": {"@type": "Brand", "name": "NODAL"},
                       "offers": {"@type": "Offer", "priceCurrency": "EUR", "price": f"{price / 100:.2f}", "availability": "https://schema.org/InStock", "url": url}},
                      ensure_ascii=False)


def page_module(m):
    variants = [{"id": m["id"], "price": m["price"], "available": True, "options": []}]
    others = "".join(f"""<a class="nd-mod" href="module-{o['slug']}.html">{ph('Photo du module')}<p class="nd-mod__kg">{e(o['kg'])}<small>KG</small></p><p class="nd-mono">charge max</p><h3>{e(o['short'])}</h3><p class="nd-mod__row"><b class="nd-price">{euros(o['price'])}</b><span>{e(o['usage'])}</span></p></a>""" for o in MODULES if o is not m)
    desc_txt = " ".join(m["desc"])
    body = f"""
<div class="nd-pdp"><div class="nd-wrap nd-pdp__grid">
  <div class="nd-pdp__gallery">
    {ph(f"{m['short']} : en situation sur le rail")}
    {ph("Dans la main, pour l'échelle")}{ph("Gros plan matière")}
    {ph("Pose : glisser sur le rail")}{ph("Avec l'objet rangé")}
  </div>
  <div class="nd-pdp__info">
    <h1>{e(m['title'])}</h1>
    <div class="nd-charge"><span class="nd-charge__v">{e(m['kg'])}<small>KG</small></span><span class="nd-charge__l">charge maximale<br>testée à 3 fois cette valeur</span></div>
    <form data-product-form data-variants='{e(json.dumps(variants))}'>
      <span class="nd-price nd-pdp__price" data-price>{euros(m['price'])}</span>
      <p class="nd-mono" style="margin:0 0 6px">Quantité</p>
      <div class="nd-pdp__buy">
        <div class="nd-qty" role="group" aria-label="Quantité"><button type="button" data-q="-1" aria-label="Moins">−</button><span data-qty aria-live="polite">1</span><button type="button" data-q="1" aria-label="Plus">+</button></div>
        <button class="nd-btn" type="submit" data-add>Ajouter au panier</button>
      </div>
      <p class="nd-msg" data-msg role="status" hidden></p>
    </form>
    {buybox()}
    <p style="margin:0"><a class="nd-link" href="configurateur.html">Ou compose ton rail complet</a></p>
    <div class="nd-desc"><ul>{''.join(f'<li>{e(d)}</li>' for d in m['desc'])}<li>Usage : {e(m['usage'])}.</li><li>Occupe {m['slots']} emplacement{'s' if m['slots'] > 1 else ''} sur le rail.</li></ul></div>
    <p class="nd-mono" style="margin-top:24px">Avis clients : affichés uniquement quand ils seront réels et vérifiés.</p>
  </div>
</div></div>
<section class="nd-section nd-rule nd-proof" aria-labelledby="t-proof">
  <div class="nd-wrap">
    <h2 class="nd-h2" id="t-proof">Oui, ça tient.</h2>
    <p class="nd-lead">Ce module est chargé à 3 fois sa charge maximale avant d'être mis en vente. Plan fixe, sans coupe.</p>
    {ph(f"Vidéo du test de charge : {m['short'].lower()} chargé à 3 × {m['kg']} kg")}
  </div>
</section>
<section class="nd-section nd-rule" aria-labelledby="t-more"><div class="nd-wrap"><h2 class="nd-h2" id="t-more">Les autres modules</h2><div class="nd-mods">{others}</div></div></section>
<script type="application/ld+json">{product_jsonld(m['title'], desc_txt, m['price'], f"module-{m['slug']}.html")}</script>
"""
    return layout(f"module-{m['slug']}.html", f"{m['title']} · charge max {m['kg']} kg · NODAL", f"{m['title']} NODAL : {desc_txt}", body)


def page_rail():
    variants = rail_variants
    lens = "".join(f'<button type="button" data-val="{e(L)}" aria-pressed="{"true" if i == 1 else "false"}">{e(L)}</button>' for i, L in enumerate(RAIL["lengths"]))
    fins = "".join(f'<button type="button" data-val="{e(f["name"])}" aria-pressed="{"true" if i == 0 else "false"}">{e(f["name"])}</button>' for i, f in enumerate(RAIL["finishes"]))
    desc_txt = " ".join(RAIL["desc"])
    body = f"""
<div class="nd-pdp"><div class="nd-wrap nd-pdp__grid">
  <div class="nd-pdp__gallery">
    {ph("Rail posé dans une entrée, lumière du jour")}{ph("Chant du chêne")}{ph("Fixation et gabarit")}{ph("Finition Naturel")}{ph("Finition Fumé")}
  </div>
  <div class="nd-pdp__info">
    <h1>{e(RAIL['title'])}</h1>
    <p class="nd-lead" style="margin-top:8px">La base de ton rangement. Tu y accroches les modules que tu veux, quand tu veux.</p>
    <form data-product-form data-variants='{e(json.dumps(variants))}'>
      <span class="nd-price nd-pdp__price" data-price></span>
      <fieldset class="nd-opt"><legend class="nd-mono">Longueur</legend><div class="nd-opt__row" data-opt>{lens}</div></fieldset>
      <fieldset class="nd-opt"><legend class="nd-mono">Finition</legend><div class="nd-opt__row" data-opt>{fins}</div></fieldset>
      <div class="nd-pdp__buy">
        <div class="nd-qty" role="group" aria-label="Quantité"><button type="button" data-q="-1" aria-label="Moins">−</button><span data-qty aria-live="polite">1</span><button type="button" data-q="1" aria-label="Plus">+</button></div>
        <button class="nd-btn" type="submit" data-add>Ajouter au panier</button>
      </div>
      <p class="nd-msg" data-msg role="status" hidden></p>
    </form>
    {buybox()}
    <p style="margin:0"><a class="nd-link" href="configurateur.html">Composer le rail avec ses modules</a></p>
    <div class="nd-desc"><ul>{''.join(f'<li>{e(d)}</li>' for d in RAIL['desc'])}<li>Emplacements : {', '.join(f"{L} = {int(int(L.split()[0]) * 10 // SETTINGS['slot_pitch_mm'])}" for L in RAIL['lengths'])}.</li></ul></div>
  </div>
</div></div>
<script type="application/ld+json">{product_jsonld(RAIL['title'], desc_txt, rail_min, "produit-rail-chene.html")}</script>
"""
    return layout("produit-rail-chene.html", "Rail chêne massif 60, 80, 120 cm · NODAL", f"Rail NODAL en chêne massif : {desc_txt}", body)


def page_modules():
    mods = "".join(f"""<a class="nd-mod" href="module-{m['slug']}.html">{ph('Photo du module en main')}<p class="nd-mod__kg">{e(m['kg'])}<small>KG</small></p><p class="nd-mono">charge max</p><h3>{e(m['short'])}</h3><p class="nd-mod__row"><b class="nd-price">{euros(m['price'])}</b><span>{e(m['usage'])}</span></p></a>""" for m in MODULES)
    body = f"""<div class="nd-list"><div class="nd-wrap"><h1>Les modules</h1><p class="nd-lead">Chaque module affiche sa charge maximale, testée à 3 fois cette valeur. Ils s'accrochent sur tous les rails NODAL.</p><div class="nd-mods">{mods}</div>
<p style="margin-top:24px"><a class="nd-btn" href="configurateur.html" style="max-width:360px">Composer mon rail</a></p></div></div>"""
    return layout("modules.html", "Modules · NODAL", "Tous les modules NODAL avec leur charge maximale : casque, double crochet, chaussures, vide-poche.", body)


def page_cart():
    body = f"""
<div class="nd-wrap"><div class="nd-cart" data-cart-page>
  <h1>Panier</h1>
  <div data-empty hidden><p class="nd-lead">Ton panier est vide.</p><p style="margin-top:20px"><a class="nd-btn" href="configurateur.html" style="max-width:360px">Composer mon rail</a></p></div>
  <div data-full hidden>
    <ul data-lines></ul>
    <div class="nd-cart__sum"><span>Total TTC<br><small class="nd-mono">Livraison offerte</small></span><span class="nd-price" data-total></span></div>
    <a class="nd-btn" href="paiement.html">Passer au paiement</a>
    {buybox()}
  </div>
</div></div>"""
    return layout("panier.html", "Panier · NODAL", "Ton panier NODAL.", body)


def page_payment():
    body = """<div class="nd-wrap"><div class="nd-doc"><h1>Paiement</h1>
<p>Cette version de la boutique est un <strong>aperçu</strong> : le paiement n'est pas encore branché et aucune commande n'est passée.</p>
<p>Au lancement, ce bouton ouvrira le paiement sécurisé (Shopify ou Stripe), en une page, sans création de compte obligatoire.</p>
<p><a class="nd-btn" href="panier.html" style="max-width:360px">Retour au panier</a></p></div></div>"""
    return layout("paiement.html", "Paiement · NODAL", "Paiement NODAL.", body)


def md_page(fname, src):
    text = (CONTENUS / src).read_text(encoding="utf-8")
    lines = text.splitlines()
    title = lines[0].lstrip("# ").strip()
    rest = []
    for ln in lines[1:]:
        s = ln.strip()
        if s.startswith("*Adresse") or s.startswith("*À coller"):
            rest.append("*Dernière mise à jour : [À COMPLÉTER : date]*")
            continue
        if s.startswith(("**Avant la mise en ligne**", "**À faire avant", "**Règle interne**", "**Ne publie aucune")):
            continue
        if s.startswith("[BOUTON") or s.startswith("[VIDÉO") or s.startswith("[PHOTO"):
            rest.append(f"<div class=\"nd-media nd-ph\" style=\"aspect-ratio:16/9;margin:16px 0\"><span>{e(s.strip('[]'))}</span></div>")
            continue
        rest.append(ln)
    body_md = "\n".join(rest)
    if fname == "mentions-legales.html":
        body_md = re.sub(r"\*\*Hébergement\*\*\n.*?\n\n", "**Hébergement**\n[À COMPLÉTER : hébergeur retenu, raison sociale, adresse, téléphone]\n\n", body_md, flags=re.S)
    if fname == "cookies.html":
        body_md = ("Cette version du site ne dépose **aucun cookie**. Le panier est gardé dans ton navigateur (stockage local), "
                   "uniquement pour que ton panier fonctionne : aucune donnée n'est envoyée ailleurs.\n\n" + body_md)
    h = markdown.markdown(body_md, extensions=["tables"])
    h = re.sub(r"\[(À COMPLÉTER[^\]]*|\d[^\]]{0,12})\]", lambda mm: f"<mark>[{mm.group(1)}]</mark>", h)
    body = f'<div class="nd-wrap"><article class="nd-doc"><h1>{e(title)}</h1>{h}</article></div>'
    return layout(fname, f"{title} · NODAL", f"{title} : NODAL, rangements muraux pour l'équipement de sport.", body)


def favicon():
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0B0D10"/>'
            '<rect x="5" y="11" width="22" height="5" fill="#C9A877"/><circle cx="24" cy="23" r="3" fill="#C6FF00"/></svg>')


def main():
    OUT_ASSETS.mkdir(exist_ok=True)
    for f in ["nodal.css", "nodal.js", "nodal-configurator.js", "nodal-space-grotesk-500.woff2", "nodal-space-grotesk-700.woff2",
              "nodal-inter-400.woff2", "nodal-inter-500.woff2", "nodal-inter-600.woff2"]:
        shutil.copy(THEME_ASSETS / f, OUT_ASSETS / f)
    shutil.copy(ROOT / "_build" / "boutique.css", OUT_ASSETS / "boutique.css")
    shutil.copy(ROOT / "_build" / "boutique.js", OUT_ASSETS / "boutique.js")
    (OUT_ASSETS / "catalogue.js").write_text("window.NODAL_CATALOG = " + json.dumps(CATALOG, ensure_ascii=False) + ";\n", encoding="utf-8")
    (OUT_ASSETS / "favicon.svg").write_text(favicon(), encoding="utf-8")

    pages = {"index.html": page_index(), "configurateur.html": page_configurator(), "modules.html": page_modules(),
             "produit-rail-chene.html": page_rail(), "panier.html": page_cart(), "paiement.html": page_payment()}
    for m in MODULES:
        pages[f"module-{m['slug']}.html"] = page_module(m)
    for fname, src in PAGES_MD.items():
        pages[fname] = md_page(fname, src)
    for fname, content in pages.items():
        (ROOT / fname).write_text(content, encoding="utf-8")
    print(f"{len(pages)} pages générées dans {ROOT}")


if __name__ == "__main__":
    main()
