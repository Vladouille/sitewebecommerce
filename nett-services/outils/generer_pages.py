"""
Générateur des pages HTML de NETT SERVICES (OPTIONNEL).

Le site livré est 100 % statique : chaque page .html se modifie directement.
Ce script sert seulement à refaire toutes les pages d'un coup après un changement
commun (téléphone, horaires, menu...). Attention : relancer le script ÉCRASE les
modifications faites à la main dans les fichiers .html.

Usage : python3 outils/generer_pages.py   (depuis le dossier nett-services/)
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = json.loads((ROOT / "outils" / "images.json").read_text(encoding="utf-8"))

# ---------------------------------------------------------------- Données de l'entreprise
SITE = "https://www.nett-services-nettoyage-paris.fr"
DOMAINE = "nett-services-nettoyage-paris.fr"
NOM = "NETT SERVICES"
TEL = "01 43 66 18 32"
TEL_LIEN = "+33143661832"
EMAIL = "nettservices@wanadoo.fr"
ADRESSE = "17 Rue Pixerécourt, 75020 Paris"
HORAIRES = "Lun–Ven · 09h30–17h00"
FACEBOOK = "https://www.facebook.com/people/Nett-Services/100089408245888/"
INSTAGRAM = "https://www.instagram.com/nett_services/"
# TODO FORMSPREE : créer le formulaire sur formspree.io avec l'adresse de l'entreprise et remplacer VOTRE_ID_FORMSPREE.
# Attention : l'envoi de pièces jointes n'est possible que sur une offre Formspree payante.
FORMSPREE = "https://formspree.io/f/VOTRE_ID_FORMSPREE"
CDN = [
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
    "https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js",
]

PAGES_NOMS = {
    "index": "Accueil", "a-propos": "À propos", "menage-industriel": "Nettoyage industriel", "bureaux": "Nettoyage de bureaux",
    "magasin": "Nettoyage de magasin", "centres-medicaux": "Centres médicaux", "copropriete": "Copropriété",
    "sols-et-surfaces": "Sols et surfaces", "vitres": "Vitres", "local-poubelle": "Local poubelle",
    "gardiennage": "Gardiennage", "contact": "Contact", "page-avis": "Avis clients",
    "saint-ouen-sur-seine": "Saint-Ouen-sur-Seine", "mentions-legales": "Mentions légales",
}


def url(page):
    return "index.html" if page == "index" else f"{page}.html"


def canon(page):
    return SITE + "/" if page == "index" else f"{SITE}/{page}"


def e(s):
    return html.escape(s, quote=True)


# ---------------------------------------------------------------- Images
def pic(slug, alt, sizes="(min-width: 960px) 50vw, 100vw", eager=False, cls="", parallax=True):
    m = IMG[slug]
    w, h = 1200, round(1200 * m["h"] / m["w"])
    if m["w"] < 1200:
        w, h = m["w"], m["h"]
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    return (f'<picture><source type="image/webp" srcset="assets/img/{slug}-800.webp 800w, assets/img/{slug}-1600.webp 1600w" sizes="{sizes}">'
            f'<img src="assets/img/{slug}-1200.jpg" alt="{e(alt)}" width="{w}" height="{h}" {load}></picture>')


def masque(slug, alt, forme="", reveal=False, eager=False, sizes="(min-width: 960px) 45vw, 100vw"):
    attrs = ' data-reveal-mask' if reveal else ' data-parallax'
    volets = '<span class="masque__volet masque__volet--g"></span><span class="masque__volet masque__volet--d"></span>' if reveal else ''
    return f'<div class="masque {forme}"{attrs}>{volets}{pic(slug, alt, sizes=sizes, eager=eager)}</div>'


# ---------------------------------------------------------------- Icônes (sprite)
SPRITE = """<svg class="sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
<symbol id="i-tel" viewBox="0 0 24 24"><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19.2 19.2 0 0 1-6-6 19.5 19.5 0 0 1-3-8.5A2 2 0 0 1 3.3 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L7.3 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.5 1.6z"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></symbol>
<symbol id="i-horloge" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.4"/></symbol>
<symbol id="i-fleche" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/></symbol>
<symbol id="i-eclat" viewBox="0 0 24 24"><path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="currentColor" stroke="none"/></symbol>
<symbol id="i-etoile" viewBox="0 0 24 24"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></symbol>
<symbol id="i-facebook" viewBox="0 0 24 24"><path d="M13.5 21v-7.5h2.6l.4-3.1h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.9v3.1h2.6V21z"/></symbol>
<symbol id="i-instagram" viewBox="0 0 24 24"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21 8.1c-.1-1.5-.4-2.8-1.5-3.9S17.1 2.8 15.6 2.7c-1.5-.1-6-.1-7.5 0-1.5.1-2.8.4-3.9 1.5S2.8 6.6 2.7 8.1c-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.5.1-6 0-7.5zm-2 9.2a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4A3 3 0 0 1 5 17.3c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 6.7 5c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4A3 3 0 0 1 19 6.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3z"/></symbol>
</defs></svg>"""


def ico(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true"><use href="#i-{name}"/></svg>'


# ---------------------------------------------------------------- JSON-LD
def jsonld(page, crumbs):
    biz = {
        "@type": "LocalBusiness", "@id": SITE + "/#entreprise", "name": NOM,
        "legalName": "SAS NETT SERVICES",
        "description": "Entreprise de nettoyage à Paris 20e : nettoyage industriel (bureaux, magasins, centres médicaux), copropriétés et gardiennage d'immeuble.",
        "url": SITE + "/", "telephone": TEL_LIEN, "email": EMAIL,
        "image": SITE + "/assets/img/og-image.jpg", "logo": SITE + "/assets/img/logo-nett-services.png",
        "address": {"@type": "PostalAddress", "streetAddress": "17 Rue Pixerécourt", "postalCode": "75020",
                    "addressLocality": "Paris", "addressRegion": "Île-de-France", "addressCountry": "FR"},
        "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",
                                       "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                                       "opens": "09:30", "closes": "17:00"}],
        "areaServed": [{"@type": "City", "name": "Paris"}, {"@type": "City", "name": "Saint-Ouen-sur-Seine"}],
        "sameAs": [FACEBOOK, INSTAGRAM],
    }
    graph = [biz]
    if crumbs:
        items = [{"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/"}]
        for i, (nom, p) in enumerate(crumbs, start=2):
            items.append({"@type": "ListItem", "position": i, "name": nom, "item": canon(p)})
        graph.append({"@type": "BreadcrumbList", "itemListElement": items})
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>"


# ---------------------------------------------------------------- Gabarit commun
def head(page, title, desc, crumbs=None, preload=None):
    pre = ""
    if preload:
        pre = (f'<link rel="preload" as="image" type="image/webp" imagesrcset="assets/img/{preload}-800.webp 800w, '
               f'assets/img/{preload}-1600.webp 1600w" imagesizes="(min-width: 960px) 50vw, 100vw" fetchpriority="high">')
    return f"""<!doctype html>
<html lang="fr" data-domaine="{DOMAINE}" data-page="{page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon(page)}">
<meta name="theme-color" content="#F7FBFA">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="{NOM}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canon(page)}">
<meta property="og:image" content="{SITE}/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<script>
/* Avant tout affichage : rideau de transition et attente des animations (2,5 s maximum). */
(function (d) {{
  var r = d.documentElement, rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Site ouvert dans un sous-dossier sans « / » final (ex. /nett-services) : sans ce correctif, les liens
     relatifs partiraient vers la racine du serveur, donc vers un AUTRE site. On ajoute le « / ». */
  if (location.protocol.indexOf('http') === 0 && r.getAttribute('data-page') === 'index' && !/(\\/|\\.html)$/.test(location.pathname)) {{
    location.replace(location.pathname + '/' + location.search + location.hash);
  }}
  r.classList.add('js');
  if (rm) return;
  r.classList.add('anim-attente');
  setTimeout(function () {{ r.classList.remove('anim-attente'); }}, 2500);
  try {{ if (sessionStorage.getItem('ns-rideau')) {{ sessionStorage.removeItem('ns-rideau'); r.classList.add('rideau-entree'); }} }} catch (e) {{}}
}})(document);
</script>
{pre}
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/fonts.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="assets/css/fonts.css"></noscript>
<script src="assets/js/main.js" defer></script>
{''.join(f'<script src="{u}" defer></script>' for u in CDN)}
{jsonld(page, crumbs)}
</head>
<body>
{SPRITE}
<a class="skip-link" href="#contenu">Aller au contenu</a>
<div class="rideau" aria-hidden="true"></div>
"""


def header(page):
    def cur(p):
        return ' aria-current="page"' if p == page else ""
    main = [("index", "Accueil"), ("menage-industriel", "Nettoyage industriel"), ("copropriete", "Copropriété"),
            ("gardiennage", "Gardiennage"), ("a-propos", "À propos"), ("contact", "Contact")]
    items = "".join(f'<li><a href="{url(p)}"{cur(p)} style="--i:{i}"><small>0{i + 1}</small>{n}</a></li>' for i, (p, n) in enumerate(main))
    return f"""<header class="header">
  <div class="container header__inner">
    <a class="header__logo" href="index.html" aria-label="{NOM}, retour à l'accueil">
      <picture><source srcset="assets/img/logo-nett-services.webp" type="image/webp"><img src="assets/img/logo-nett-services.png" alt="{NOM}" width="543" height="159"></picture>
    </a>
    <a class="btn btn--citron btn--petit magnetic" href="{'#devis' if page == 'index' else 'contact.html#devis'}">Devis gratuit</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Ouvrir le menu"><span class="burger__label">Menu</span><span class="burger__lines" aria-hidden="true"><span></span><span></span></span></button>
  </div>
</header>
<nav class="menu" id="menu" aria-label="Menu principal" aria-hidden="true">
  <div class="menu__grid">
    <ul class="menu__main">{items}</ul>
    <div class="menu__sub">
      <div><h2>Nettoyage industriel</h2><ul><li><a href="bureaux.html"{cur('bureaux')}>Bureaux</a></li><li><a href="magasin.html"{cur('magasin')}>Magasins</a></li><li><a href="centres-medicaux.html"{cur('centres-medicaux')}>Centres médicaux</a></li></ul></div>
      <div><h2>Copropriété</h2><ul><li><a href="sols-et-surfaces.html"{cur('sols-et-surfaces')}>Sols et surfaces</a></li><li><a href="vitres.html"{cur('vitres')}>Vitres</a></li><li><a href="local-poubelle.html"{cur('local-poubelle')}>Local poubelle</a></li></ul></div>
      <div class="menu__contact"><h2>Nous joindre</h2><a href="tel:{TEL_LIEN}">{TEL}</a><span>{ADRESSE}</span><span>{HORAIRES}</span></div>
    </div>
  </div>
</nav>
<main id="contenu">
"""


def footer():
    return f"""</main>
<footer class="footer on-dark">
  <div class="container">
    <div class="footer__cta">
      <h2>Des locaux impeccables, <em>sans y penser.</em></h2>
      <div class="btn-row"><a class="btn btn--aqua magnetic" href="contact.html#devis">Demander un devis</a><a class="btn btn--contour-clair magnetic" href="tel:{TEL_LIEN}">{ico('tel')} {TEL}</a></div>
    </div>
    <div class="footer__grid">
      <div>
        <p class="footer__logo"><img src="assets/img/logo-nett-services-blanc.png" alt="{NOM}" width="543" height="159" loading="lazy"></p>
        <address>{ADRESSE}<br><a href="mailto:{EMAIL}">{EMAIL}</a></address>
        <div class="social">
          <a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="NETT SERVICES sur Facebook (nouvel onglet)"><svg aria-hidden="true"><use href="#i-facebook"/></svg></a>
          <a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="NETT SERVICES sur Instagram (nouvel onglet)"><svg aria-hidden="true"><use href="#i-instagram"/></svg></a>
        </div>
      </div>
      <div>
        <h3>Horaires</h3>
        <ul><li>Lundi – vendredi : 09h30 – 17h00</li><li>Samedi – dimanche : fermé</li></ul>
        <h3 style="margin-top:24px">Téléphone</h3>
        <a class="footer__tel" href="tel:{TEL_LIEN}">{TEL}</a>
      </div>
      <div>
        <h3>Services</h3>
        <ul><li><a href="menage-industriel.html">Nettoyage industriel</a></li><li><a href="bureaux.html">Bureaux</a></li><li><a href="magasin.html">Magasins</a></li><li><a href="centres-medicaux.html">Centres médicaux</a></li><li><a href="copropriete.html">Copropriété</a></li><li><a href="sols-et-surfaces.html">Sols et surfaces</a></li><li><a href="vitres.html">Vitres</a></li><li><a href="local-poubelle.html">Local poubelle</a></li><li><a href="gardiennage.html">Gardiennage</a></li></ul>
      </div>
      <div>
        <h3>L'entreprise</h3>
        <ul><li><a href="a-propos.html">À propos</a></li><li><a href="page-avis.html">Avis clients</a></li><li><a href="contact.html">Contact</a></li><li><a href="saint-ouen-sur-seine.html">Saint-Ouen-sur-Seine</a></li></ul>
      </div>
    </div>
    <div class="footer__legal">
      <span>© 2026 SAS NETT SERVICES</span>
      <a href="mentions-legales.html">Mentions légales</a>
      <a href="mentions-legales.html#donnees">Données personnelles</a>
      <a href="mentions-legales.html#cookies">Cookies</a>
      <!-- TODO actualités : l'ancien lien « Voir toutes les actualités » pointait vers # (aucun blog). Supprimé. -->
    </div>
  </div>
  <p class="footer__geant" aria-hidden="true">NETT SERVICES<span>.</span></p>
</footer>
<!-- Site refait en 2026. Contenus repris de l'ancien site, sans ajout de faits. -->
</body>
</html>
"""


# ---------------------------------------------------------------- Blocs réutilisables
def cta_band(titre="Un devis adapté à vos locaux.", texte="Décrivez votre besoin : nous vous répondons avec une proposition sur mesure."):
    return f"""<section class="section" style="padding-top:0"><div class="container"><div class="cta-band on-dark" data-reveal>
  <div><h2>{titre}</h2><p>{texte}</p></div>
  <div class="btn-row"><a class="btn btn--aqua magnetic" href="contact.html#devis">Demander un devis</a><a class="btn btn--contour-clair magnetic" href="tel:{TEL_LIEN}">{ico('tel')} Appeler</a></div>
</div></div></section>"""


VOISINS_IMG = {
    "menage-industriel": ("immeuble-paris-20", "Immeuble du 20e arrondissement"),
    "bureaux": ("agents-bureaux", "Agents de nettoyage dans des bureaux"),
    "magasin": ("galerie-commerciale-sol", "Nettoyage du sol d'une galerie commerciale"),
    "centres-medicaux": ("salle-examen-medical", "Nettoyage d'une salle d'examen médical"),
    "copropriete": ("entree-immeuble", "Entrée d'immeuble"),
    "sols-et-surfaces": ("surfaceuse-lustrage", "Surfaceuse pour le lustrage d'un sol"),
    "vitres": ("facade-vitree", "Nettoyage d'une façade vitrée"),
    "local-poubelle": ("local-poubelle-exterieur", "Local poubelle extérieur d'une résidence"),
    "gardiennage": ("gardien-immeuble", "Gardien d'immeuble dans un couloir"),
}


def voisins(liste, titre="Nos autres services"):
    cards = ""
    for p in liste:
        slug, alt = VOISINS_IMG[p]
        cards += (f'<a class="voisin" href="{url(p)}"><div class="masque">{pic(slug, alt, sizes="(min-width: 1100px) 22vw, (min-width: 640px) 45vw, 100vw")}</div>'
                  f'<strong>{PAGES_NOMS[p]}</strong><span>Découvrir {ico("fleche")}</span></a>')
    return f"""<section class="section" style="padding-top:0"><div class="container">
  <p class="eyebrow">Services voisins</p><h2 class="h2" data-reveal>{titre}</h2>
  <div class="voisins" data-stagger>{cards}</div>
</div></section>"""


def ariane(crumbs):
    li = '<li><a href="index.html">Accueil</a></li>'
    for i, (nom, p) in enumerate(crumbs):
        li += f'<li aria-current="page">{nom}</li>' if i == len(crumbs) - 1 else f'<li><a href="{url(p)}">{nom}</a></li>'
    return f'<nav aria-label="Fil d\'Ariane"><ol class="ariane">{li}</ol></nav>'


def devis_form(email_fallback=True):
    types = ["Bureaux", "Magasin / commerce", "Centre médical / cabinet", "Copropriété / immeuble", "Gardiennage", "Autre"]
    freqs = ["Ponctuelle", "Quotidienne", "Plusieurs fois par semaine", "Hebdomadaire", "Mensuelle", "Trimestrielle ou annuelle"]
    t = "".join(f'<label class="choice"><input type="radio" name="type_locaux" value="{e(x)}" required><span>{x}</span></label>' for x in types)
    f = "".join(f'<label class="choice"><input type="radio" name="frequence" value="{e(x)}" required><span>{x}</span></label>' for x in freqs)
    return f"""<!-- FORMULAIRE : envoi via Formspree.
     TODO FORMSPREE : remplacer VOTRE_ID_FORMSPREE par l'identifiant du formulaire créé sur formspree.io.
     Tant que ce n'est pas fait, le bouton d'envoi ouvre la messagerie du visiteur (email pré-rempli).
     Pièce jointe : uniquement avec une offre Formspree payante. -->
<form class="form" action="{FORMSPREE}" method="POST" enctype="multipart/form-data" data-devis data-email="{EMAIL}" novalidate>
  <input type="hidden" name="_subject" value="Demande de devis – site NETT SERVICES">
  <p class="form__hp" aria-hidden="true"><label>Ne pas remplir <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label></p>
  <div class="progress" aria-hidden="true">
    <div class="progress__labels"><span class="is-active">1. Locaux</span><span>2. Fréquence</span><span>3. Coordonnées</span></div>
    <div class="progress__bar"><div class="progress__fill"></div></div>
  </div>
  <fieldset class="step">
    <legend>Quel type de locaux ?</legend>
    <div class="step-choices"><div class="choices">{t}</div></div>
  </fieldset>
  <fieldset class="step">
    <legend>À quelle fréquence ?</legend>
    <div class="step-choices"><div class="choices">{f}</div></div>
  </fieldset>
  <fieldset class="step">
    <legend>Vos coordonnées</legend>
    <div class="fields">
      <div class="field"><label for="f-nom">Nom *</label><input id="f-nom" name="nom" autocomplete="family-name" required></div>
      <div class="field"><label for="f-prenom">Prénom *</label><input id="f-prenom" name="prenom" autocomplete="given-name" required></div>
      <div class="field"><label for="f-email">Email *</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="f-tel">Téléphone *</label><input id="f-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel" required></div>
      <div class="field field--full"><label for="f-adresse">Adresse d'intervention</label><input id="f-adresse" name="adresse" autocomplete="street-address"></div>
      <div class="field field--full"><label for="f-message">Message</label><textarea id="f-message" name="message" placeholder="Surface, nombre de pièces, contraintes horaires…"></textarea></div>
      <div class="field field--full"><label for="f-fichier">Pièce jointe (cahier des charges, photos…)</label><input id="f-fichier" name="fichier" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"><span class="field__hint">PDF, image ou document Word, 10 Mo maximum.</span></div>
    </div>
    <label class="consent"><input type="checkbox" name="consentement" value="oui" required><span>J'accepte que mes données soient utilisées par NETT SERVICES pour répondre à ma demande. <a class="lien" href="mentions-legales.html#donnees">En savoir plus</a></span></label>
  </fieldset>
  <div class="form__nav">
    <button class="btn btn--contour" type="button" data-prev hidden>Retour</button>
    <button class="btn btn--encre magnetic" type="button" data-next hidden>Continuer {ico('fleche')}</button>
    <button class="btn btn--encre magnetic" type="submit">Envoyer ma demande</button>
  </div>
  <p class="form__status" role="status" aria-live="polite"></p>
</form>"""


def devis_section(titre_tag="h2"):
    return f"""<section class="section" id="devis" aria-labelledby="devis-titre"><div class="container devis">
  <div class="devis__aside" data-reveal>
    <p class="eyebrow">Devis gratuit</p>
    <{titre_tag} class="h2" id="devis-titre">Votre devis en trois étapes.</{titre_tag}>
    <p class="lead">Un devis modulable, construit sur vos locaux et votre rythme. Plus rapide encore : appelez-nous.</p>
    <div class="devis__contact">
      <a href="tel:{TEL_LIEN}">{ico('tel')} {TEL}</a>
      <a href="mailto:{EMAIL}">{ico('mail')} {EMAIL}</a>
      <p>{ico('horloge')} Du lundi au vendredi, 09h30 – 17h00</p>
      <p>{ico('pin')} {ADRESSE}</p>
    </div>
  </div>
  <div data-reveal>{devis_form()}</div>
</div></section>"""


AVIS = ("Très satisfait des prestations de Nett Services. Les bureaux sont toujours impeccables, les équipes sont ponctuelles, "
        "professionnelles et réactives. La qualité du nettoyage est constante et le suivi client est irréprochable. "
        "Je recommande vivement cette entreprise de nettoyage à Paris.")


def avis_block(lien_tous=True):
    stars = "".join('<svg aria-hidden="true"><use href="#i-etoile"/></svg>' for _ in range(5))
    tous = '<a class="lien" href="page-avis.html">Tous les avis</a>' if lien_tous else ''
    return f"""<div class="avis" data-reveal>
  <div><p class="eyebrow">Avis client</p><h2 class="h2">Ils parlent de nous.</h2></div>
  <div>
    <div class="etoiles" role="img" aria-label="Note : 5 étoiles sur 5">{stars}</div>
    <!-- Avis repris TEL QUEL de l'ancien site (page d'accueil), où il était présenté comme un avis Pages Jaunes.
         TODO avis : vérifier qu'il figure bien sur la fiche Pages Jaunes de NETT SERVICES et remplacer le lien
         générique ci-dessous par l'adresse exacte de la fiche. Ne jamais ajouter d'avis non vérifié. -->
    <blockquote class="avis__quote"><p>{AVIS}</p></blockquote>
    <p class="avis__source">Avis publié sur Pages Jaunes
      <a class="lien" href="https://www.pagesjaunes.fr/" target="_blank" rel="noopener">Voir la source</a>
      <span class="todo">[À COMPLÉTER : lien exact de la fiche Pages Jaunes]</span> {tous}</p>
  </div>
</div>"""


CARTE = """<figure class="carte" data-reveal>
<svg viewBox="60 0 580 420" role="img" aria-labelledby="carte-titre carte-desc">
  <title id="carte-titre">Zone d'intervention de NETT SERVICES</title>
  <desc id="carte-desc">Carte schématique de l'est parisien : le 20e arrondissement avec Belleville, Ménilmontant et Gambetta, les arrondissements voisins (19e, 11e, 12e) et Saint-Ouen-sur-Seine au nord de Paris.</desc>
  <path class="carte__paris" d="M86 250C78 172 150 108 250 94c92-12 180-6 252 26 58 26 84 76 76 128-9 58-56 98-138 114-90 18-200 16-280-14-50-19-76-52-80-98z"/>
  <path class="carte__arr" d="M250 94c30 60 40 120 30 168M380 92c-10 60 0 120 40 170M120 200c80 20 200 30 330 4M140 320c90-30 200-40 300-10"/>
  <path class="carte__seine" d="M60 262c86-18 148 38 220 20 60-16 82-46 140-20 50 23 102 56 184 68"/>
  <g data-zone><path class="carte__zone carte__zone--voisin" d="M430 106l72 12 48 46-60-14-18-10z"/><path class="carte__zone carte__zone--voisin" d="M428 200l50 4 8 58-46 6-14-36z"/><path class="carte__zone carte__zone--voisin" d="M440 268l46-6 26 34 48-8-14 42-74 16-32-36z"/>
    <text class="carte__label" x="452" y="132">19e</text><text class="carte__label" x="436" y="256">11e</text><text class="carte__label" x="470" y="330">12e</text></g>
  <g data-zone><path class="carte__zone" d="M490 150l60 15 24 57-12 66-48 8-26-34-10-57z"/><text class="carte__label carte__label--grand" x="534" y="282" text-anchor="middle">20e</text></g>
  <g data-zone><circle class="carte__pin" cx="498" cy="176" r="5"/><text class="carte__label carte__label--q" x="486" y="170" text-anchor="end">Belleville</text></g>
  <g data-zone><circle class="carte__pin" cx="506" cy="222" r="5"/><text class="carte__label carte__label--q" x="494" y="216" text-anchor="end">Ménilmontant</text></g>
  <g data-zone><circle class="carte__pin" cx="540" cy="244" r="5"/><text class="carte__label carte__label--q" x="528" y="250" text-anchor="end">Gambetta</text></g>
  <g data-zone><circle class="carte__pulse" cx="526" cy="194" r="9"/><circle class="carte__pin" cx="526" cy="194" r="6"/><text class="carte__label carte__label--q" x="538" y="188">Siège</text></g>
  <g data-zone><ellipse class="carte__zone carte__zone--voisin" cx="272" cy="52" rx="74" ry="28"/><circle class="carte__pin" cx="272" cy="52" r="5"/><text class="carte__label" x="272" y="22" text-anchor="middle">Saint-Ouen-sur-Seine</text></g>
  <text class="carte__label carte__label--grand" x="230" y="236" style="opacity:.25">PARIS</text>
</svg>
<figcaption class="carte__caption">Carte schématique, non à l'échelle.</figcaption>
</figure>
<button class="btn btn--contour btn--petit carte__gmaps" type="button" data-gmaps>Afficher la carte Google Maps</button>
<p class="carte__note">La carte Google ne se charge qu'au clic (Google peut alors déposer des cookies).</p>"""


def zone_section():
    return f"""<section class="section section--menthe" id="zone" aria-labelledby="zone-titre"><div class="container zone__grid">
  <div data-reveal>
    <p class="eyebrow">Zone d'intervention</p>
    <h2 class="h2" id="zone-titre">Le 20e, c'est notre quartier.</h2>
    <p class="lead" style="margin-top:20px">Installés rue Pixerécourt, nous intervenons dans tout le 20e, dans les arrondissements voisins et en proche banlieue, jusqu'à Saint-Ouen-sur-Seine.</p>
    <ul class="zone__list"><li class="is-main">Paris 20e</li><li>Gambetta</li><li>Belleville</li><li>Ménilmontant</li><li>Arrondissements voisins</li><li><a class="lien" href="saint-ouen-sur-seine.html">Saint-Ouen-sur-Seine</a></li></ul>
  </div>
  <div>{CARTE}</div>
</div></section>"""


def prestations(liste, cols2=True):
    li = "".join(f"<li>{ico('check')}<span>{x}</span></li>" for x in liste)
    return f'<ul class="prestations{" prestations--2" if cols2 else ""}" data-stagger>{li}</ul>'


# ---------------------------------------------------------------- Page service (gabarit unique)
def page_service(page, d):
    crumbs = d["crumbs"]
    out = head(page, d["title"], d["desc"], crumbs=crumbs, preload=d["hero"]) + header(page)
    out += f"""<section class="page-hero"><div class="container">
  {ariane(crumbs)}
  <div class="page-hero__grid">
    <div class="hero__text">
      <p class="eyebrow">{d['eyebrow']}</p>
      <h1>{d['h1']}</h1>
      <p class="lead">{d['lead']}</p>
      <div class="btn-row"><a class="btn btn--encre magnetic" href="contact.html#devis">Demander un devis</a><a class="btn btn--contour magnetic" href="tel:{TEL_LIEN}">{ico('tel')} {TEL}</a></div>
    </div>
    {masque(d['hero'], d['hero_alt'], 'masque--arche', reveal=True, eager=True, sizes='(min-width: 960px) 40vw, 100vw')}
  </div>
</div></section>
"""
    for i, b in enumerate(d["blocs"]):
        if i == 0:
            out += '<section class="section" style="padding-top:clamp(24px,4vw,48px)"><div class="container">'
        paras = "".join(f"<p>{p}</p>" for p in b["p"])
        extra = b.get("extra", "")
        out += f"""<div class="bloc{' bloc--inverse' if b.get('inverse') else ''}">
  <div data-reveal><h2>{b['h2']}</h2>{paras}{extra}</div>
  {masque(b['img'], b['alt'], 'masque--doux' if i % 2 else 'masque--pilule')}
</div>"""
    out += "</div></section>"
    out += f"""<section class="section section--menthe"><div class="container">
  <p class="eyebrow">Nos prestations</p>
  <h2 class="h2" data-reveal>{d['presta_titre']}</h2>
  {prestations(d['presta'])}
  {d.get('apres_presta', '')}
</div></section>
"""
    out += cta_band(d.get("cta_titre", "Un devis adapté à vos locaux."))
    out += voisins(d["voisins"])
    out += footer()
    return out


def formules(items):
    return '<div class="formules" data-stagger>' + "".join(f'<div class="formule"><h3>{t}</h3><p>{p}</p></div>' for t, p in items) + "</div>"


SERVICES = {
    "menage-industriel": dict(
        title="Nettoyage industriel à Paris 20e | NETT SERVICES",
        desc="Entreprise de nettoyage industriel à Paris 20e : bureaux, commerces, cabinets, immeubles. Entretien, désinfection et vitrerie. Devis personnalisé.",
        crumbs=[("Nettoyage industriel", "menage-industriel")], eyebrow="Pôle nettoyage industriel",
        h1='Nettoyage industriel <span class="accent">à Paris 20e</span>',
        lead="Bureaux, commerces, cabinets, immeubles : nous entretenons et désinfectons vos locaux professionnels, à Paris et en proche banlieue.",
        hero="immeuble-paris-20", hero_alt="Immeuble du 20e arrondissement de Paris",
        blocs=[
            dict(h2="Immeubles et copropriétés", img="exterieurs-copropriete", alt="Nettoyage des extérieurs d'une copropriété", p=[
                "Halls, escaliers, ascenseurs, sols, points de contact, locaux poubelles : nous gardons les parties communes propres toute l'année, pour les syndics et les gestionnaires.",
                "Nous intervenons à Paris, Saint-Ouen, Suresnes, Rueil-Malmaison et Arcueil, en formule hebdomadaire, trimestrielle, annuelle ou sur mesure."]),
            dict(h2="Bureaux et professions libérales", img="bureaux-partages", alt="Nettoyage de bureaux partagés", inverse=True, p=[
                "Nettoyage quotidien ou périodique des bureaux, postes de travail, salles de réunion, espaces communs et sanitaires, selon vos horaires.",
                "Nous entretenons aussi les cabinets médicaux dans le respect des protocoles d'hygiène, et les cabinets d'avocats avec une prestation discrète."]),
            dict(h2="Vitrerie et interventions spécifiques", img="nettoyage-vitre-eponge", alt="Nettoyage d'une vitre", p=[
                "Vitres intérieures et extérieures, vitrerie toutes hauteurs, vitrines commerciales.",
                "Shampoing de moquette, remise en état après travaux, nettoyage approfondi : nous prenons aussi en charge les interventions exceptionnelles."]),
        ],
        presta_titre="Tout l'entretien de vos locaux, un seul interlocuteur.",
        presta=["Halls, escaliers et ascenseurs", "Lavage des sols et dépoussiérage", "Désinfection des points de contact", "Entretien des locaux poubelles",
                "Bureaux, salles de réunion et sanitaires", "Cabinets médicaux et cabinets d'avocats", "Vitres intérieures, extérieures et vitrines",
                "Shampoing de moquette", "Remise en état après travaux"],
        voisins=["bureaux", "magasin", "centres-medicaux", "vitres"]),
    "bureaux": dict(
        title="Nettoyage de bureaux à Paris 20e | NETT SERVICES",
        desc="Nettoyage de bureaux à Paris 20e, Gambetta, Belleville, Ménilmontant : entretien régulier ou ponctuel, désinfection, sols. Devis personnalisé.",
        crumbs=[("Nettoyage industriel", "menage-industriel"), ("Bureaux", "bureaux")], eyebrow="Nettoyage industriel · Bureaux",
        h1='Nettoyage de bureaux <span class="accent">à Paris 20e</span>',
        lead="Des espaces de travail nets pour vos équipes et vos visiteurs, entretenus au rythme qui vous convient.",
        hero="agents-bureaux", hero_alt="Agents de nettoyage dans des bureaux",
        blocs=[
            dict(h2="Des bureaux sains, sans gêner votre activité", img="cloison-vitree", alt="Nettoyage d'une cloison vitrée", p=[
                "Bureaux, salles de réunion, accueil, sanitaires, open spaces : nos équipes interviennent en régulier ou en ponctuel, en respectant votre activité.",
                "Nous adaptons la prestation à la configuration de vos locaux, au nombre d'occupants et à la fréquence souhaitée. Nous sommes installés dans le 20e et intervenons notamment à Gambetta, Belleville et Ménilmontant."]),
            dict(h2="Un nettoyage à la carte", img="moquette-bureaux-vapeur", alt="Nettoyage de moquette dans des bureaux", inverse=True, p=[
                "Chaque bureau a ses contraintes. Nous construisons un devis personnalisé selon votre activité, vos horaires d'occupation et vos exigences.",
                "Des contrôles réguliers garantissent un niveau de propreté constant, passage après passage : entretien quotidien, hebdomadaire ou ponctuel."]),
        ],
        presta_titre="Ce que nous faisons dans vos bureaux.",
        presta=["Dépoussiérage des postes de travail", "Nettoyage du mobilier", "Entretien des sols", "Désinfection des points de contact",
                "Nettoyage des sanitaires", "Salles de réunion et espaces d'accueil", "Open spaces et zones communes", "Entretien régulier ou ponctuel"],
        voisins=["magasin", "centres-medicaux", "menage-industriel", "vitres"]),
    "magasin": dict(
        title="Nettoyage de magasin à Paris 20e | NETT SERVICES",
        desc="Nettoyage de magasins et commerces à Paris 20e : surfaces de vente, vitrines, caisses, réserves. Interventions adaptées à vos horaires d'ouverture.",
        crumbs=[("Nettoyage industriel", "menage-industriel"), ("Magasin", "magasin")], eyebrow="Nettoyage industriel · Magasins",
        h1='Nettoyage de magasin <span class="accent">à Paris 20e</span>',
        lead="Un commerce propre inspire confiance. Nous entretenons vos espaces de vente en suivant vos horaires d'ouverture.",
        hero="galerie-commerciale-sol", hero_alt="Nett Services intervient dans les galeries commerciales",
        blocs=[
            dict(h2="Une image irréprochable pour vos clients", img="desinfection-galerie", alt="Désinfection d'une galerie commerciale", p=[
                "Un magasin propre améliore l'expérience client et valorise votre enseigne. Nous intervenons dans tout l'arrondissement pour l'entretien des magasins et commerces.",
                "Nous adaptons nos passages à la fréquentation de votre commerce et à vos contraintes horaires, avec un devis personnalisé."]),
            dict(h2="Chaque commerce a ses contraintes", img="chariot-galerie", alt="Chariot de nettoyage dans une galerie commerciale", inverse=True, p=[
                "Boutique de proximité, enseigne spécialisée ou commerce très fréquenté : nous construisons une prestation sur mesure.",
                "Nous entretenons aussi vos bureaux administratifs, réserves et locaux techniques, et vos surfaces vitrées pour plus de lumière."]),
        ],
        presta_titre="Du sol aux vitrines.",
        presta=["Sols des espaces de vente", "Vitrines et surfaces vitrées", "Caisses et rayonnages", "Espaces de circulation",
                "Réserves et locaux techniques", "Bureaux administratifs", "Sanitaires et espaces recevant du public", "Passages adaptés à vos horaires"],
        voisins=["bureaux", "centres-medicaux", "vitres", "menage-industriel"]),
    "centres-medicaux": dict(
        title="Nettoyage de centres médicaux à Paris 20e | NETT SERVICES",
        desc="Nettoyage de cabinets médicaux, cabinets dentaires, centres de santé, EHPAD et laboratoires à Paris 20e. Désinfection et protocoles d'hygiène.",
        crumbs=[("Nettoyage industriel", "menage-industriel"), ("Centres médicaux", "centres-medicaux")], eyebrow="Nettoyage industriel · Santé",
        h1='Nettoyage de centres médicaux <span class="accent">à Paris 20e</span>',
        lead="Cabinets, centres de santé, EHPAD, laboratoires : une hygiène rigoureuse, à des horaires qui respectent vos consultations.",
        hero="salle-examen-medical", hero_alt="Nettoyage d'une salle d'examen médical",
        blocs=[
            dict(h2="Cabinets médicaux et professions libérales", img="cabinet-dentaire", alt="Nettoyage d'un cabinet dentaire", p=[
                "Médecins, spécialistes, cabinets dentaires et infirmiers : nous nettoyons salles d'attente, accueil, bureaux médicaux, sanitaires, salles de soins et espaces du personnel.",
                "Produits professionnels, matériel adapté, protocoles stricts : chaque devis tient compte de la fréquence, de la surface et de vos contraintes."]),
            dict(h2="EHPAD et centres de santé", img="lit-medical", alt="Nettoyage d'un lit médical", inverse=True, p=[
                "Chambres, salles d'attente, espaces communs, salles de repos, zones de circulation : chaque prestation suit un protocole défini pour limiter les risques de contamination.",
                "Nous intervenons à Paris et en Seine-Saint-Denis, avec un contrat personnalisé et un suivi qualité."]),
            dict(h2="Laboratoires et zones techniques", img="chambre-medicale-sol", alt="Nettoyage du sol d'une chambre médicale", p=[
                "Laboratoires d'analyses, salles de prélèvement, cabinets dentaires : désinfection des surfaces, entretien des sols, dépoussiérage du matériel non sensible.",
                "Nous définissons avec vous une organisation, des horaires et une fréquence qui préservent la continuité de votre activité."]),
        ],
        presta_titre="Une hygiène pensée pour le soin.",
        presta=["Désinfection des surfaces de contact", "Entretien des sols", "Dépoussiérage du mobilier", "Nettoyage des sanitaires",
                "Salles d'attente et d'accueil", "Salles de soins et de consultation", "Protocole défini pour chaque établissement", "Produits adaptés au milieu médical"],
        voisins=["bureaux", "magasin", "menage-industriel", "sols-et-surfaces"]),
    "copropriete": dict(
        title="Nettoyage de copropriété à Paris 20e | NETT SERVICES",
        desc="Nettoyage de copropriétés et parties communes à Paris 20e : halls, escaliers, ascenseurs, vitres, locaux poubelles. Devis pour syndics.",
        crumbs=[("Copropriété", "copropriete")], eyebrow="Pôle copropriété",
        h1='Nettoyage de copropriété <span class="accent">à Paris 20e</span>',
        lead="Halls, escaliers, ascenseurs, vitres : des parties communes propres toute l'année, pour les résidents comme pour le syndic.",
        hero="entree-immeuble", hero_alt="Entrée d'un immeuble en copropriété",
        blocs=[
            dict(h2="L'entretien complet des parties communes", img="tapis-entree-immeuble", alt="Passage d'aspirateur sur le tapis d'entrée d'un immeuble", p=[
                "Nous intervenons à Paris 20e, Gambetta, Belleville et dans les arrondissements voisins. Chaque passage est planifié avec le syndic ou le gestionnaire.",
                "Nos agents nettoient aussi les vitres et assurent un contrôle qualité régulier, avec un devis adapté à la taille de l'immeuble et à la fréquence."]),
            dict(h2="Un partenaire fiable pour les syndics", img="exterieurs-copropriete", alt="Nettoyage des extérieurs de la copropriété", inverse=True, p=[
                "Des prestations sur mesure, des interventions réactives et une communication régulière : nous garantissons des communs accueillants et propres.",
                "L'entretien des parties communes préserve la valeur du patrimoine et l'image de la copropriété."]),
        ],
        presta_titre="Des communs nets, du hall au dernier étage.",
        presta=["Sols et halls d'entrée", "Escaliers et paliers", "Ascenseurs", "Accès extérieurs et circulations",
                "Vitres des parties communes", "Locaux poubelles", "Sortie et rentrée des conteneurs", "Contrôle qualité régulier"],
        voisins=["sols-et-surfaces", "vitres", "local-poubelle", "gardiennage"]),
    "sols-et-surfaces": dict(
        title="Nettoyage de sols à Paris 20e | NETT SERVICES",
        desc="Nettoyage et entretien de sols à Paris 20e : carrelage, revêtements souples, stratifiés. Contrats hebdomadaires, trimestriels ou annuels.",
        crumbs=[("Copropriété", "copropriete"), ("Sols et surfaces", "sols-et-surfaces")], eyebrow="Copropriété · Sols et surfaces",
        h1='Nettoyage de sols <span class="accent">à Paris 20e</span>',
        lead="Carrelage, revêtements souples, stratifiés : un entretien régulier qui prolonge la vie de vos sols.",
        hero="surfaceuse-lustrage", hero_alt="Surfaceuse pour le lustrage d'un sol",
        blocs=[
            dict(h2="Tous types de sols, tous types d'immeubles", img="lavage-sol-serpilliere", alt="Lavage d'un sol à la serpillière", p=[
                "Nous accompagnons les syndics, gestionnaires et bailleurs dans l'entretien des immeubles à Paris et en proche banlieue.",
                "Contrat hebdomadaire, mensuel ou entièrement personnalisé : nous mettons en place une organisation rigoureuse, avec des équipements professionnels."]),
            dict(h2="Une intervention régulière et méthodique", img="agent-proprete", alt="Agent de propreté et d'hygiène", inverse=True, p=[
                "Chaque intervention suit un cahier des charges défini avec le syndic ou le gestionnaire.",
                "Nous travaillons avec les syndics de copropriété, administrateurs de biens, gestionnaires d'immeubles, bailleurs sociaux et résidences privées."]),
        ],
        presta_titre="Ce que comprend l'entretien.",
        presta=["Nettoyage des halls d'entrée", "Entretien des escaliers", "Nettoyage des ascenseurs", "Lavage des sols", "Dépoussiérage des surfaces",
                "Désinfection des points de contact", "Entretien des locaux poubelles", "Sortie et rentrée des conteneurs",
                "Vitres des parties communes", "Remise en propreté ponctuelle"],
        apres_presta='<h3 class="h3" style="margin-top:56px">Trois formules d\'entretien</h3>' + formules([
            ("Hebdomadaire", "Un niveau de propreté constant pour les immeubles à faible ou moyenne fréquentation."),
            ("Trimestrielle", "Des opérations plus approfondies de nettoyage et de remise en état des parties communes."),
            ("Contrat annuel personnalisé", "Un programme sur mesure selon la taille du bâtiment, le nombre de résidents et vos besoins.")]),
        voisins=["copropriete", "vitres", "local-poubelle", "gardiennage"]),
    "vitres": dict(
        title="Nettoyage de vitres à Paris 20e | NETT SERVICES",
        desc="Nettoyage de vitres à Paris 20e et proche banlieue : vitres intérieures et extérieures, vitrines, baies et façades vitrées. Ponctuel ou contrat.",
        crumbs=[("Copropriété", "copropriete"), ("Vitres", "vitres")], eyebrow="Copropriété · Vitres",
        h1='Nettoyage de vitres <span class="accent">à Paris 20e</span>',
        lead="Vitres, vitrines, façades : des surfaces nettes, sans traces, et plus de lumière dans vos locaux.",
        hero="facade-vitree", hero_alt="Nettoyage d'une façade vitrée",
        blocs=[
            dict(h2="Bureaux, commerces et immeubles", img="vitres-raclette", alt="Nettoyage de vitres à la raclette", p=[
                "Nous intervenons à Paris 20e, Gambetta, Belleville, Ménilmontant, ainsi qu'à Saint-Ouen, Suresnes, Rueil-Malmaison et Arcueil.",
                "Des professionnels expérimentés, du matériel adapté, un résultat sans traces : en ponctuel ou en contrat d'entretien régulier."]),
            dict(h2="Vitrines et façades vitrées", img="vitre-raclette-gant", alt="Raclette et gant sur une vitre", inverse=True, p=[
                "Une vitrine propre améliore la visibilité de votre commerce. Nous intervenons aux horaires les mieux adaptés à votre activité.",
                "Façades vitrées, verrières, vitrages en hauteur : techniques professionnelles et eau déminéralisée lorsque c'est nécessaire. Chaque devis tient compte du nombre de vitres et de leur accessibilité."]),
        ],
        presta_titre="Toutes les surfaces vitrées.",
        presta=["Vitres intérieures et extérieures", "Baies vitrées", "Vitrines commerciales", "Façades vitrées et verrières",
                "Vitrages en hauteur", "Eau déminéralisée si nécessaire", "Interventions ponctuelles", "Contrats d'entretien réguliers"],
        voisins=["copropriete", "sols-et-surfaces", "magasin", "bureaux"]),
    "local-poubelle": dict(
        title="Nettoyage de local poubelle à Paris 20e | NETT SERVICES",
        desc="Nettoyage et désinfection de locaux poubelles à Paris 20e : lavage, désinfection, prévention des nuisibles pour copropriétés et immeubles.",
        crumbs=[("Copropriété", "copropriete"), ("Local poubelle", "local-poubelle")], eyebrow="Copropriété · Local poubelle",
        h1='Désinfection de locaux poubelles <span class="accent">à Paris 20e</span>',
        lead="Odeurs, bactéries, nuisibles : un local poubelle désinfecté régulièrement, c'est tout l'immeuble qui respire.",
        hero="local-poubelle-exterieur", hero_alt="Local poubelle extérieur d'une résidence",
        blocs=[
            dict(h2="Contre les risques sanitaires", img="alignement-poubelles", alt="Alignement de poubelles", p=[
                "Les locaux poubelles demandent un entretien rigoureux pour éviter les bactéries, les mauvaises odeurs et l'insalubrité.",
                "Lavage des sols, nettoyage des parois, désinfection des surfaces de contact : nous assainissons complètement les zones de stockage des déchets, en copropriété comme en immeuble professionnel."]),
            dict(h2="Une action préventive contre les nuisibles", img="sacs-poubelles", alt="Sacs poubelles accumulés", inverse=True, p=[
                "Déchets, humidité, résidus : un local mal entretenu attire cafards, mouches et rongeurs.",
                "Un nettoyage adapté et une désinfection régulière limitent ces conditions et évitent les situations problématiques dans la copropriété."]),
        ],
        presta_titre="Un local sain, toute l'année.",
        presta=["Lavage des sols", "Nettoyage des parois", "Désinfection des surfaces de contact", "Assainissement complet",
                "Prévention des nuisibles par l'entretien", "Sortie et rentrée des conteneurs"],
        voisins=["copropriete", "sols-et-surfaces", "vitres", "gardiennage"]),
    "gardiennage": dict(
        title="Gardiennage d'immeuble à Paris 20e | NETT SERVICES",
        desc="Gardiennage d'immeuble et conciergerie à Paris 20e : remplacement de gardien ou gardienne, courrier, colis, entretien des parties communes.",
        crumbs=[("Gardiennage", "gardiennage")], eyebrow="Pôle gardiennage",
        h1='Gardiennage d\'immeuble <span class="accent">à Paris 20e</span>',
        lead="Remplacement de gardien ou gardienne, conciergerie, entretien des communs : une présence de confiance pour votre résidence.",
        hero="gardien-immeuble", hero_alt="Gardien d'immeuble prêt à effectuer une petite réparation",
        # TODO CNAPS : vocabulaire volontairement limité à l'accueil, au contrôle des accès et au signalement.
        # Vérifier avec le client que l'activité ne relève pas de la sécurité privée (réglementée par le CNAPS).
        blocs=[
            dict(h2="Remplacement de gardien ou gardienne", img="communs-immeuble-depoussierage", alt="Entretien des communs d'un immeuble", p=[
                "Congés, arrêt maladie, absence temporaire, poste vacant : nous assurons la continuité du service dans l'immeuble, pour les syndics et les copropriétés.",
                "Accueil des intervenants, suivi des demandes des occupants, contrôle des accès, coordination des besoins courants : les résidents gardent un interlocuteur présent."]),
            dict(h2="Conciergerie", img="chariot-menage", alt="Chariot de ménage", inverse=True, p=[
                "Réception et distribution du courrier, gestion des colis, accueil des intervenants.",
                "Nous suivons les demandes des occupants et transmettons les informations utiles au syndic ou au gestionnaire."]),
            dict(h2="Déchets, communs et petits travaux", img="local-materiel", alt="Local de matériel d'entretien", p=[
                "Sortie et rentrée des conteneurs, entretien des locaux poubelles et des parties communes, contrôle visuel des espaces collectifs.",
                "Petits travaux courants (ampoules, tapis d'immeuble) et signalement des anomalies au syndic."]),
        ],
        presta_titre="Une présence utile, au quotidien.",
        presta=["Remplacement de gardien ou gardienne", "Accueil des intervenants et des visiteurs", "Contrôle des accès", "Courrier et colis",
                "Suivi des demandes des occupants", "Signalement des anomalies au syndic", "Sortie et rentrée des conteneurs", "Petits travaux d'entretien courants"],
        voisins=["copropriete", "local-poubelle", "sols-et-surfaces", "vitres"]),
}


# ---------------------------------------------------------------- Accueil
def page_index():
    out = head("index", "Entreprise de nettoyage à Paris 20e | NETT SERVICES",
               "NETT SERVICES, entreprise de nettoyage à Paris 20e : bureaux, magasins, centres médicaux, copropriétés et gardiennage. Devis personnalisé et gratuit.",
               preload="escalier-parties-communes") + header("index")
    out += f"""<section class="hero" aria-labelledby="hero-titre"><div class="container">
  <h1 class="hero__title" id="hero-titre">
    <span class="hero__kicker">Entreprise de nettoyage à Paris 20e</span>
    <span class="visually-hidden">Paris 20e, impeccable.</span>
    <span class="hero__display" aria-hidden="true"><span class="hero__line" data-split>Paris 20e,</span><span class="hero__line hero__line--2" data-split>impeccable.</span></span>
  </h1>
  <div class="hero__grid">
    <div class="hero__text">
      <p class="lead">Bureaux, magasins, centres médicaux, copropriétés : nous nettoyons et entretenons vos locaux, avec un devis sur mesure et des agents qualifiés.</p>
      <div class="btn-row"><a class="btn btn--encre magnetic" href="#devis">Demander un devis</a><a class="btn btn--contour magnetic" href="tel:{TEL_LIEN}">{ico('tel')} {TEL}</a></div>
      <div class="hero__chips"><span class="chip">{ico('pin')} 17 rue Pixerécourt</span><span class="chip">{ico('horloge')} Lun–Ven 09h30–17h</span></div>
    </div>
    <div class="hero__media">
      {masque('escalier-parties-communes', "Équipements de nettoyage dans les marches d'un escalier d'immeuble", reveal=True, eager=True, sizes='(min-width: 900px) 55vw, 100vw')}
      <!-- « Depuis 1969 » : mention reprise du logo du client. TODO : faire confirmer la date. -->
      <p class="hero__sticker"><span>Depuis<strong>1969</strong></span></p>
    </div>
  </div>
</div></section>
"""
    items = ["Bureaux", "Magasins", "Centres médicaux", "Copropriétés", "Vitres", "Gardiennage"]
    grp = "".join(f'<span class="marquee__item">{x}<svg class="marquee__star" aria-hidden="true"><use href="#i-eclat"/></svg></span>' for x in items)
    out += f"""<div class="marquee" aria-label="Nos domaines : {', '.join(items)}" role="region"><div class="marquee__track" aria-hidden="true"><div class="marquee__group">{grp}</div><div class="marquee__group">{grp}</div></div></div>
"""

    def sub(lst):
        return "".join(f'<li><a href="{url(p)}">{n}{ico("fleche")}</a></li>' if p else f'<li><span>{n}</span></li>' for n, p in lst)
    out += f"""<section class="section poles" id="poles" aria-labelledby="poles-titre"><div class="container">
  <div class="poles__head">
    <div><p class="eyebrow">Nos activités</p><h2 class="h2" id="poles-titre" data-reveal>Trois pôles, un seul partenaire.</h2></div>
    <p class="lead" data-reveal>Professionnels, copropriétés, gestionnaires d'immeubles : des services d'entretien réguliers et des interventions personnalisées.</p>
  </div>
  <div class="poles__list poles--stack">
    <article class="pole pole--menthe" style="--i:0"><span class="pole__voile" aria-hidden="true"></span>
      <div><span class="pole__num">01 / 03</span><h3 class="pole__title">Nettoyage industriel</h3>
        <p class="pole__text">Bureaux, magasins, centres médicaux : des locaux propres pour une activité qui tourne, à Paris 20e, Gambetta, Belleville et Ménilmontant.</p>
        <ul class="pole__subs">{sub([("Nettoyage de bureaux", "bureaux"), ("Nettoyage de magasin", "magasin"), ("Centres médicaux", "centres-medicaux")])}</ul>
        <a class="btn btn--encre magnetic" href="menage-industriel.html">Le nettoyage industriel</a></div>
      <div class="pole__media">{masque('agents-bureaux', 'Agents de nettoyage dans des bureaux', 'masque--arche')}</div>
    </article>
    <article class="pole" style="--i:1"><span class="pole__voile" aria-hidden="true"></span>
      <div><span class="pole__num">02 / 03</span><h3 class="pole__title">Copropriété</h3>
        <p class="pole__text">Halls, escaliers, vitres, locaux poubelles : des parties communes nettes toute l'année, pour les syndics, bailleurs et résidents.</p>
        <ul class="pole__subs">{sub([("Sols et surfaces", "sols-et-surfaces"), ("Vitres", "vitres"), ("Local poubelle", "local-poubelle")])}</ul>
        <a class="btn btn--encre magnetic" href="copropriete.html">Nos services copropriété</a></div>
      <div class="pole__media">{masque('immeuble-haussmannien', 'Immeuble de Paris 20e', 'masque--arche')}</div>
    </article>
    <article class="pole pole--encre on-dark" style="--i:2"><span class="pole__voile" aria-hidden="true"></span>
      <div><span class="pole__num">03 / 03</span><h3 class="pole__title">Gardiennage</h3>
        <p class="pole__text">Remplacement de gardien ou gardienne, accueil, contrôle des accès, signalement des anomalies : une présence de confiance dans l'immeuble.</p>
        <!-- TODO CNAPS : vocabulaire limité à l'accueil, au contrôle des accès et au signalement. À valider avec le client. -->
        <ul class="pole__subs">{sub([("Remplacement de gardien·ne", None), ("Courrier, colis, accueil", None), ("Gestion des conteneurs", None)])}</ul>
        <a class="btn btn--aqua magnetic" href="gardiennage.html">Le gardiennage</a></div>
      <div class="pole__media">{masque('accueil-conciergerie', "Bureau d'accueil d'une conciergerie", 'masque--arche')}</div>
    </article>
  </div>
</div></section>
"""
    icone_devis = '<svg class="bento__icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="6" width="34" height="46" rx="4"/><line x1="20" y1="18" x2="38" y2="18"/><line x1="20" y1="26" x2="38" y2="26"/><line x1="20" y1="34" x2="30" y2="34"/><path d="M40 54l14-14 4 4-14 14h-4z"/></svg>'
    icone_agenda = '<svg class="bento__icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="12" width="48" height="44" rx="5"/><line x1="8" y1="24" x2="56" y2="24"/><line x1="20" y1="6" x2="20" y2="16"/><line x1="44" y1="6" x2="44" y2="16"/><polyline points="22,40 29,47 43,33"/></svg>'
    icone_agent = '<svg class="bento__icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="20" r="10"/><path d="M12 56c2-12 10-18 20-18s18 6 20 18"/><path d="M26 44l6 6 6-6"/></svg>'
    icone_qualite = '<svg class="bento__icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="27" cy="27" r="17"/><line x1="40" y1="40" x2="56" y2="56"/><polyline points="19,27 25,33 36,22"/></svg>'
    out += f"""<section class="section section--menthe" id="atouts" aria-labelledby="atouts-titre"><div class="container">
  <p class="eyebrow">Nos atouts</p>
  <h2 class="h2" id="atouts-titre" data-reveal>Ce qui change <span class="surligne">vraiment</span>.</h2>
  <div class="bento" data-stagger>
    <div class="bento__item bento__item--a" style="background:var(--ecume)">{icone_devis}<div><h3>Devis modulable et personnalisé</h3><p>Un devis construit sur vos locaux, votre fréquence et vos contraintes. Rien de standard.</p></div></div>
    <div class="bento__item bento__item--b on-dark">{icone_agenda}<div><h3>Selon votre agenda</h3><p>Nous planifions chaque passage selon vos horaires, pour ne pas gêner votre activité.</p></div></div>
    <div class="bento__item">{icone_agent}<div><h3>Agents qualifiés</h3><p>Des professionnels formés, avec des méthodes et des produits adaptés à chaque surface.</p></div></div>
    <div class="bento__item">{icone_qualite}<div><h3>Contrôle qualité</h3><p>Des contrôles réguliers pour un niveau de propreté constant, passage après passage.</p></div></div>
  </div>
</div></section>
"""
    phrase = "Un lieu propre, personne ne le remarque. Un lieu sale, tout le monde le voit. Notre métier : que vous n'ayez jamais à y penser."
    mots = " ".join(f'<span class="mot"><span class="mot__sale" aria-hidden="true">{e(m)}</span><span class="mot__propre">{e(m)}</span></span>' for m in phrase.split())
    out += f"""<section class="manifeste" aria-label="Notre manifeste"><div class="container">
  <p class="eyebrow">Notre manifeste</p>
  <p class="manifeste__text"><span class="visually-hidden">{e(phrase)}</span><span aria-hidden="true">{mots}</span></p>
  <p class="manifeste__sign">NETT SERVICES, Paris 20e</p>
</div></section>
"""
    out += zone_section()
    out += f'<section class="section" id="avis" aria-label="Avis client"><div class="container">{avis_block()}</div></section>'
    out += devis_section()
    out += footer()
    return out


# ---------------------------------------------------------------- Autres pages
def simple_hero(page, crumbs, eyebrow, h1, lead, img=None, alt=""):
    media = masque(img, alt, 'masque--arche', reveal=True, eager=True, sizes='(min-width: 960px) 40vw, 100vw') if img else ""
    grid = f'<div class="page-hero__grid"><div class="hero__text"><p class="eyebrow">{eyebrow}</p><h1>{h1}</h1><p class="lead">{lead}</p>' \
           f'<div class="btn-row"><a class="btn btn--encre magnetic" href="contact.html#devis">Demander un devis</a><a class="btn btn--contour magnetic" href="tel:{TEL_LIEN}">{ico("tel")} {TEL}</a></div></div>{media}</div>'
    return f'<section class="page-hero"><div class="container">{ariane(crumbs)}{grid}</div></section>'


def page_a_propos():
    crumbs = [("À propos", "a-propos")]
    out = head("a-propos", "Société de nettoyage à Paris 20e | À propos de NETT SERVICES",
               "NETT SERVICES, société de nettoyage du 20e arrondissement de Paris : bureaux, magasins, établissements de santé. Prestations d'entretien sur mesure.",
               crumbs, preload="bureaux-administratifs") + header("a-propos")
    out += simple_hero("a-propos", crumbs, "À propos", 'Société de nettoyage <span class="accent">à Paris 20e</span>',
                       "NETT SERVICES accompagne les professionnels et les copropriétés du 20e avec des prestations d'entretien sur mesure, pour des bureaux, locaux et immeubles toujours nets.",
                       "bureaux-administratifs", "Nettoyage de bureaux administratifs")
    blocs = [
        ("Des bureaux propres pour travailler sereinement", "chariot-couloir", "Chariot de nettoyage dans un couloir de bureaux", False, [
            "Postes de travail, salles de réunion, accueil, sanitaires, circulations : chaque intervention est planifiée selon vos contraintes, pour limiter l'impact sur votre activité.",
            "Une organisation rigoureuse et des contrôles qualité réguliers garantissent un excellent niveau de propreté. Présents à Gambetta, Belleville et Ménilmontant, nous proposons des devis personnalisés."]),
        ("Magasins et enseignes", "galerie-commerciale", "Galerie commerciale", True, [
            "L'apparence d'un commerce compte dans l'expérience client. Surfaces de vente, vitrines, réserves, caisses, sanitaires : nous adaptons la fréquence et les méthodes à vos horaires d'ouverture.",
            "Nous intervenons aussi pour le nettoyage industriel à Saint-Ouen-sur-Seine."]),
        ("Établissements de santé", "couloir-ehpad", "Couloir d'un EHPAD", False, [
            "Cabinets médicaux, centres de santé, établissements accueillant des patients : salles d'attente, bureaux, espaces de consultation, sanitaires. Nous mettons l'accent sur la désinfection des surfaces sensibles et le respect des procédures.",
            "Nous réalisons également le nettoyage de copropriétés et un service de gardiennage d'immeuble."]),
    ]
    out += '<section class="section" style="padding-top:clamp(24px,4vw,48px)"><div class="container">'
    for i, (h2, img, alt, inv, ps) in enumerate(blocs):
        out += f'<div class="bloc{" bloc--inverse" if inv else ""}"><div data-reveal><h2>{h2}</h2>' + "".join(f"<p>{p}</p>" for p in ps) + f'</div>{masque(img, alt, "masque--doux" if i % 2 else "masque--pilule")}</div>'
    out += "</div></section>"
    out += f"""<section class="section section--menthe"><div class="container">
  <p class="eyebrow">L'entreprise</p><h2 class="h2" data-reveal>NETT SERVICES en bref.</h2>
  {prestations(["SAS NETT SERVICES, au 17 rue Pixerécourt, Paris 20e", "Nettoyage industriel, copropriété et gardiennage", "Devis modulable et personnalisé", "Intervention selon votre agenda", "Agents qualifiés", "Contrôle qualité des prestations"])}
</div></section>"""
    out += cta_band("Parlons de vos besoins.", "Demandez votre devis personnalisé : nous vous répondons rapidement.")
    out += footer()
    return out


def page_contact():
    crumbs = [("Contact", "contact")]
    out = head("contact", "Contact et devis | Entreprise de nettoyage Paris 20e | NETT SERVICES",
               "Contactez NETT SERVICES, entreprise de nettoyage à Paris 20e : devis gratuit en ligne, téléphone 01 43 66 18 32, 17 rue Pixerécourt.",
               crumbs) + header("contact")
    out += f"""<section class="page-hero" style="padding-bottom:0"><div class="container">{ariane(crumbs)}
  <p class="eyebrow">Contact</p><h1>Parlons de <span class="accent">vos locaux.</span></h1>
  <p class="lead" style="color:var(--encre)">Un devis personnalisé, un renseignement : écrivez-nous ou appelez-nous, du lundi au vendredi de 09h30 à 17h00.</p>
</div></section>"""
    out += devis_section().replace('class="section" id="devis"', 'class="section" id="devis" style="padding-top:clamp(40px,6vw,72px)"')
    out += zone_section()
    out += footer()
    return out


def page_avis():
    crumbs = [("Avis clients", "page-avis")]
    out = head("page-avis", "Avis clients | NETT SERVICES, entreprise de nettoyage Paris 20e",
               "Les avis clients de NETT SERVICES, entreprise de nettoyage à Paris 20e.", crumbs) + header("page-avis")
    out += f"""<section class="page-hero" style="padding-bottom:0"><div class="container">{ariane(crumbs)}
  <p class="eyebrow">Avis</p><h1>Ce que disent <span class="accent">nos clients.</span></h1>
  <p class="lead" style="color:var(--encre)">Nous publions uniquement des avis vérifiables, avec leur source.</p>
</div></section>
<section class="section"><div class="container">{avis_block(lien_tous=False)}
  <p style="margin-top:28px"><span class="todo">[À COMPLÉTER : autres avis clients vérifiés, avec leur source (Pages Jaunes, Google)]</span></p>
</div></section>"""
    out += cta_band()
    out += footer()
    return out


def page_saint_ouen():
    d = dict(
        title="Entreprise de nettoyage à Saint-Ouen-sur-Seine | NETT SERVICES",
        desc="NETT SERVICES intervient à Saint-Ouen-sur-Seine : nettoyage industriel de bureaux et commerces, copropriétés, gardiennage et conciergerie. Devis personnalisé.",
        crumbs=[("Saint-Ouen-sur-Seine", "saint-ouen-sur-seine")], eyebrow="Zone d'intervention",
        h1='Entreprise de nettoyage <span class="accent">à Saint-Ouen-sur-Seine</span>',
        lead="Bureaux, commerces, copropriétés : NETT SERVICES intervient aussi à Saint-Ouen-sur-Seine et dans le secteur de la Seine-Saint-Denis.",
        hero="agent-communs-immeuble", hero_alt="Agent de propreté dans les communs d'un immeuble",
        blocs=[
            dict(h2="Nettoyage industriel à Saint-Ouen-sur-Seine", img="agents-bureaux", alt="Agents de nettoyage dans des bureaux", p=[
                "Bureaux, locaux professionnels, commerces, espaces recevant du public : entretien des bureaux et des espaces communs, désinfection des sanitaires, entretien des sols.",
                "Devis personnalisés et contrats d'entretien sur mesure pour chaque structure de Saint-Ouen-sur-Seine."]),
            dict(h2="Gardiennage et conciergerie", img="couloir-chariot", alt="Couloir avec chariot de nettoyage", inverse=True, p=[
                "Remplacement de gardien ou gardienne pendant les congés, arrêts maladie ou postes vacants ; courrier, colis, entretien des parties communes.",
                "Un interlocuteur unique pour la propreté et le bon entretien des espaces collectifs."]),
        ],
        presta_titre="Pourquoi nous choisir.",
        presta=["Devis rapide et personnalisé", "Intervention flexible selon vos besoins", "Professionnels qualifiés", "Contrôle qualité des prestations",
                "Bureaux, commerces et copropriétés", "Gardiennage et conciergerie"],
        voisins=["menage-industriel", "copropriete", "gardiennage", "bureaux"],
        cta_titre="Votre partenaire à Saint-Ouen-sur-Seine.")
    return page_service("saint-ouen-sur-seine", d)


def page_mentions():
    crumbs = [("Mentions légales", "mentions-legales")]
    out = head("mentions-legales", "Mentions légales | NETT SERVICES", "Mentions légales, données personnelles et cookies du site de NETT SERVICES, entreprise de nettoyage à Paris 20e.", crumbs) + header("mentions-legales")
    out += f"""<section class="page-hero" style="padding-bottom:0"><div class="container">{ariane(crumbs)}
  <h1>Mentions légales</h1><p class="lead">Dernière mise à jour : 17 novembre 2026</p></div></section>
<section class="section" style="padding-top:clamp(32px,5vw,56px)"><div class="container texte-legal">
  <h2>Éditeur du site</h2>
  <dl>
    <dt>Raison sociale</dt><dd>SAS NETT SERVICES</dd>
    <dt>Forme juridique</dt><dd>SAS, au capital social de 51 000,00 €</dd>
    <dt>RCS</dt><dd>R.C.S. Paris 692 016 918</dd>
    <dt>SIREN</dt><dd>692 016 918</dd>
    <dt>SIRET</dt><dd>692 016 918 00025</dd>
    <dt>TVA intracommunautaire</dt><dd>FR21692016918</dd>
    <dt>Siège</dt><dd>17 rue Pixerécourt, 75020 Paris, France</dd>
    <dt>Téléphone</dt><dd><a class="lien" href="tel:{TEL_LIEN}">{TEL}</a></dd>
    <dt>Email</dt><dd><a class="lien" href="mailto:{EMAIL}">{EMAIL}</a></dd>
    <dt>Directrice de la publication</dt><dd>Madame DANSART Cyrille</dd>
    <dt>Médiateur de la consommation</dt><dd><span class="todo">[À COMPLÉTER : nom et coordonnées du médiateur, si l'entreprise travaille avec des particuliers]</span></dd>
  </dl>
  <!-- Informations reprises de l'ancienne page « Mentions légales ». Les 4 lignes « règles professionnelles / titre professionnel »
       contenaient un texte provisoire oublié : supprimées (sans objet pour une entreprise de nettoyage). -->
  <h2>Hébergement</h2>
  <p><span class="todo">[À COMPLÉTER : raison sociale, adresse et téléphone du nouvel hébergeur]</span></p>
  <h2>Propriété intellectuelle</h2>
  <p>Les textes, le logo et la marque NETT SERVICES sont la propriété de SAS NETT SERVICES. Toute reproduction sans autorisation écrite est interdite.</p>
  <p>Crédits photos : Adobe Stock. <span class="todo">[À COMPLÉTER : confirmer la licence d'utilisation des photos]</span></p>
  <h2 id="donnees">Données personnelles</h2>
  <p>Les données saisies dans le formulaire de devis (nom, prénom, email, téléphone, adresse d'intervention, type de locaux, fréquence, message, pièce jointe) sont utilisées par NETT SERVICES aux seules fins de répondre à votre demande et d'assurer le suivi commercial. La base légale est votre consentement.</p>
  <p>Le formulaire est transmis par le service Formspree (Formspree Inc., États-Unis), sous-traitant, avec les garanties prévues par ce prestataire pour les transferts hors de l'Union européenne. Aucune donnée n'est vendue ni cédée. Les données sont conservées 3 ans après le dernier contact.</p>
  <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité, ainsi que du retrait de votre consentement, en écrivant à <a class="lien" href="mailto:{EMAIL}">{EMAIL}</a>. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
  <h2 id="cookies">Cookies</h2>
  <p>Ce site ne dépose aucun cookie et n'utilise aucun outil de mesure d'audience. Les polices sont hébergées sur le site. Les bibliothèques d'animation sont chargées depuis cdnjs et jsDelivr, sans cookie.</p>
  <p>La carte Google Maps n'est chargée que si vous cliquez sur « Afficher la carte Google Maps » ; Google peut alors déposer ses propres cookies.</p>
</div></section>
<!-- Modèle à faire valider par un professionnel du droit -->"""
    out += footer()
    return out


# ---------------------------------------------------------------- Écriture
PAGES = {"index": page_index(), "a-propos": page_a_propos(), "contact": page_contact(), "page-avis": page_avis(),
         "saint-ouen-sur-seine": page_saint_ouen(), "mentions-legales": page_mentions()}
for p, d in SERVICES.items():
    PAGES[p] = page_service(p, d)
for p, h in PAGES.items():
    (ROOT / url(p)).write_text(h, encoding="utf-8")
print(len(PAGES), "pages générées")
