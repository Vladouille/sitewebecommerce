# NETT SERVICES : nouveau site (refonte 2026)

Site statique : HTML, CSS et JS, sans compilation. Toutes les pages s'ouvrent par double-clic.
Les animations (GSAP, ScrollTrigger, Lenis) se chargent depuis un CDN. Si le CDN ne répond pas, le site reste complet et lisible.

```
index.html, bureaux.html, …       15 pages, mêmes noms que les anciennes URL
assets/css/style.css              styles : couleurs, tailles et durées dans :root
assets/css/fonts.css              Space Grotesk + Inter intégrées (fonctionnent en double-clic)
assets/js/main.js                 menu, header, formulaire, rideau, curseur, animations
assets/img/                       images WebP (800/1600) + JPG de repli, logo détouré, OG 1200×630
.htaccess                         Apache : /bureaux sert bureaux.html (URL identiques à l'ancien site)
vercel.json                       même chose sur Vercel ; sur Netlify c'est automatique
robots.txt, sitemap.xml           référencement
CONTENT.md, IMAGES.md             relevé du contenu et des images de l'ancien site
outils/generer_pages.py           OPTIONNEL : régénère toutes les pages (écrase les modifications manuelles)
```

## Mise en ligne

1. Déposer le contenu du dossier à la racine de l'hébergement.
2. Apache : le `.htaccess` sert `/bureaux` sans redirection. Activer ensuite le bloc HTTPS/www (TODO dans le fichier).
3. Vérifier chaque ancienne URL : `/`, `/a-propos`, `/menage-industriel`, `/bureaux`, `/magasin`, `/centres-medicaux`, `/copropriete`, `/sols-et-surfaces`, `/vitres`, `/local-poubelle`, `/gardiennage`, `/contact`, `/page-avis`, `/saint-ouen-sur-seine`, `/mentions-legales`.
4. Soumettre `sitemap.xml` dans Google Search Console.

## À faire remplir ou valider par le client

| # | Élément | Où |
|---|---|---|
| 1 | **Identifiant Formspree** (sans lui, le formulaire ouvre la messagerie du visiteur) | `outils/generer_pages.py` (FORMSPREE) ou chaque page avec formulaire : `VOTRE_ID_FORMSPREE` |
| 2 | Pièce jointe du formulaire : uniquement avec une offre Formspree payante | décision client |
| 3 | **Avis** : vérifier qu'il existe bien sur la fiche Pages Jaunes + lien exact de la fiche | accueil, `page-avis.html` |
| 4 | Autres avis vérifiés, avec leur source | `page-avis.html` |
| 5 | **Gardiennage** : confirmer que l'activité ne relève pas de la sécurité privée (CNAPS) | `gardiennage.html`, accueil |
| 6 | « Depuis 1969 » (mention reprise du logo) : confirmer la date | accueil |
| 7 | **Licence des photos Adobe Stock** (achetées par l'ancien prestataire ?) | voir IMAGES.md |
| 8 | Nouvel hébergeur (raison sociale, adresse, téléphone) | `mentions-legales.html` |
| 9 | Médiateur de la consommation (si clients particuliers) | `mentions-legales.html` |
| 10 | Logo vectoriel (SVG, AI ou PDF) : le logo actuel est un JPG Facebook de 659 px, détouré automatiquement | `assets/img/` |
| 11 | Activer la redirection HTTPS + www | `.htaccess` |
