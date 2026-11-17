# C'DU NETT MULTISERVICES : nouveau site (refonte 2026)

Site statique : aucun framework, aucune compilation, aucun npm. Ouvrir `index.html` par double-clic suffit pour le consulter.

```
index.html               page unique (hero, pour qui, services, qualités, agences, contact)
mentions-legales.html    mentions légales + données personnelles + cookies
assets/css/style.css     styles ; toutes les couleurs sont dans :root, en haut du fichier
assets/css/fonts.css     police Lato intégrée (fonctionne aussi en double-clic)
assets/js/main.js        animations, menu, filtres, formulaire
assets/img/              images WebP + JPG de secours ; originaux/ = fichiers de l'ancien site
assets/fonts/            Lato en .woff2 (fichiers sources)
robots.txt, sitemap.xml  référencement
.htaccess                compression, cache et redirections 301 (hébergement Apache)
BRAND.md                 relevé de la charte de l'ancien site
```

## À faire remplir par le client avant la mise en ligne

| # | Élément | Où |
|---|---|---|
| 1 | Identifiant Formspree (créer un compte gratuit avec cdunettmultiservices@gmail.com) | `index.html`, `VOTRE_ID_FORMSPREE` |
| 2 | Délai de réponse réel pour le devis (« sous 24h ? ») | `index.html`, bande orange |
| 3 | Adresse de l'agence de Paris | `index.html` (Agences) + JSON-LD |
| 4 | Adresse de l'agence de Valenton | `index.html` (Agences) + JSON-LD |
| 5 | Forme juridique et capital, adresse du siège, SIRET, RCS, n° de TVA | `mentions-legales.html` |
| 6 | Nom du directeur de la publication | `mentions-legales.html` |
| 7 | Hébergeur (raison sociale, adresse, téléphone) | `mentions-legales.html` |
| 8 | Prestataire du formulaire à confirmer (Formspree ou autre) | `mentions-legales.html`, section Données personnelles |
| 9 | Logo vectoriel (SVG, AI ou PDF) : le JPG actuel fait 271 px de large | `assets/img/` |
| 10 | Vraies photos (la photo « Professionnels » est une image de banque d'images de 2017) | `assets/img/` |
| 11 | Liens vers les réseaux sociaux, s'ils existent | `index.html`, `<!-- TODO réseaux -->` |
| 12 | Domaine final (le site suppose https://cdunett.fr/) | `index.html` (canonical, Open Graph, JSON-LD), `sitemap.xml`, `robots.txt` |
| 13 | Activer la redirection HTTPS une fois le certificat SSL en place | `.htaccess` |

Tous les emplacements à remplir apparaissent sur la page dans un cadre pointillé orange.

## Modifier les couleurs

Toutes les couleurs sont regroupées en haut de `assets/css/style.css` (bloc `:root`). Les teintes claires en sont dérivées automatiquement.

## Images trop petites pour un affichage en grand

- `professionnels.jpg` et `particuliers.jpg` : 600×480. Elles sont affichées au plus à environ 560 px de large et seront floues sur les écrans Retina.
- `hero-bg.jpg` : déjà floue à la source. Elle sert uniquement de texture assombrie derrière le hero.
- `presentation-1.jpg` (dans `originaux/`) n'est pas utilisée : son texte bleu est intégré à l'image, hors charte et illisible sur mobile.
