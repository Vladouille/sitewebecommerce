# BRAND.md : identité visuelle actuelle de cdunett.fr

Relevé du 17/11/2026 sur https://cdunett.fr/ (WordPress, thème **Flatsome 3.11.3**, site créé par AB-MEDIA en 2016).
Sources analysées : le HTML de l'accueil, les 13 blocs `<style>` inline, `flatsome.css`, `style.css` (thème enfant, vide), `block-library/style.min.css`, `contact-form-7/styles.css`, ainsi que les pixels du logo et de l'icône.
Aucune couleur n'a été inventée : chaque valeur provient soit du CSS, soit d'une mesure sur les images.

---

## 1. Couleurs de la charte (CSS personnalisé du thème)

Ces couleurs viennent du bloc `<style>` généré par les réglages Flatsome du client. C'est ce que le visiteur voit réellement.
Comptage : nombre d'occurrences dans ce bloc (36 couleurs au total).

| # | Couleur | Occ. | Rôle sur le site actuel | Contraste sur blanc |
|---|---|---|---|---|
| 1 | `#4B6368` gris-bleu ardoise | **12** | **Couleur principale** (`--primary-color`). Fond de la barre de menu (`.header-bottom`), liens, boutons primaires, bordures actives, puces du slider | 6,40:1 ✅ AA |
| 2 | `#FFFFFF` blanc | 11 | Fond de la barre de contact du haut (`.header-top`), menus déroulants, texte du menu sur la barre ardoise, fond du blog | n/a |
| 3 | `#D26E4B` orange terracotta | 5 | **Boutons d'appel à l'action du hero** : « par mail via le formulaire de contact » et « ou par téléphone au 01 43 89 39 97 » (`.button.secondary`). Également le bouton de recherche | 3,46:1 ⚠️ |
| 4 | `#111111` quasi-noir | 3 | Couleur des liens au survol, tags au survol | 18,9:1 ✅ |
| 5 | `#ECECEC` gris clair | 2 | Filets et séparateurs | (décoratif) |
| 6 | `rgba(255,255,255,0.9)` | 1 | Fond du header principal (blanc à 90 %) | n/a |
| 7 | `#777777` gris moyen | 1 | **Texte courant** (`body`) | 4,48:1 ❌ (AA demande 4,5) |
| 8 | `#555555` gris foncé | 1 | **Titres H1 à H6** | 7,46:1 ✅ |

### Couleurs du thème par défaut, réellement visibles sur la page

Le client n'a jamais personnalisé ces valeurs Flatsome, mais elles sont bien affichées :

| Couleur | Origine | Rôle | Contraste |
|---|---|---|---|
| `#B20000` rouge | `.alert` (Flatsome) | Bouton « Désinfection COVID-19 » du header (style `is-shade`) | 7,26:1 ✅ |
| `#777777` | `.footer-2` (Flatsome) | **Fond du footer** (widgets « Mots clés », « Nous contacter ») | blanc dessus : 4,48:1 ❌ |
| `#5B5B5B` | `.absolute-footer, html` (Flatsome) | **Fond de la bande copyright** tout en bas | blanc dessus : 6,79:1 ✅ |
| `rgba(255,255,255,0.5)` | `.absolute-footer.dark` | Texte du copyright | faible |

### Couleurs présentes dans les CSS mais NON utilisées sur la page

Couleurs par défaut de Flatsome (`#446084` ×43, `#7A9C59` ×11, etc.), de WordPress (`#0693E3`, `#CF2E2E`, `#FCB900`…) et de Contact Form 7 (`#FF0000`, `#398F14`, `#FFA500`). Ces valeurs sont écrasées par la charte ou concernent des blocs absents. **Elles sont écartées.**

---

## 2. Couleurs du logo (mesurées, absentes du CSS)

Mesures par quantification médiane sur `icone-site-192.png` (PNG sans perte) et `logo.jpg`. Les valeurs sont exactes à quelques unités près, à cause de la compression JPG et de l'anticrénelage.

| Couleur mesurée | Part des pixels | Rôle dans le logo | Contraste sur blanc |
|---|---|---|---|
| `#528368` vert moyen | 25,6 % | Facettes principales du diamant | 4,37:1 (fond ou texte large uniquement) |
| `#233842` ardoise très foncé | 23,2 % | Contours du diamant | 12,24:1 ✅ |
| `#76B37C` vert clair | 13,9 % | Facettes éclairées | 2,47:1 ❌ (décoratif uniquement) |
| `#C2DBC4` / `#DDE6DF` vert très pâle | 26,6 % | Reflets | (décoratif) |
| `#42413E` anthracite | (texte) | Texte « C' DU NETT / MULTISERVICES / La propreté en toute sérénité » | 10,2:1 ✅ |

**Constat important** : le logo est vert et ardoise, alors que le site est en ardoise et orange. Le vert du diamant n'apparaît nulle part ailleurs sur le site actuel. Voir la décision n° 1 plus bas.

---

## 3. Polices

| Police | Graisses chargées | Usage réel |
|---|---|---|
| **Lato** (Google Fonts) | 400, 700 | Tout le site : texte courant (400, taille 100 %), menu (700), titres H1 à H6 (700) |
| Dancing Script (Google Fonts) | 400 | Classe `.alt-font` définie, mais **utilisée nulle part** dans la page : c'est une requête réseau inutile, à supprimer |
| Police du logo | n/a | C'est une image, donc la police n'est pas identifiable de façon fiable (une sans-serif humaniste). Je ne la nommerai pas sans le fichier source |

Icônes : **Font Awesome 4.3 et 4.7** (chargées deux fois, depuis deux CDN) et **fl-icons** (police d'icônes Flatsome). Icônes visibles : horloge, téléphone, enveloppe, loupe, réseaux sociaux. Dans la refonte, elles seront remplacées par des SVG inline, comme demandé.

---

## 4. Style général

- **Angles** : droits partout. `border-radius: 0` sur tous les boutons. Seuls les icônes sociales et le bouton « retour en haut » sont ronds (`circle`).
- **Boutons** : texte en MAJUSCULES, gras (`bolder`), `letter-spacing: .03em`, hauteur 2,4em, bordure de 1 px. Le bouton COVID a un effet `is-shade` (reflet interne : `inset 0 2em 15px rgba(255,255,255,.2)`), donc déjà un clin d'œil au « brillant ».
- **Ombres** : quasi absentes. Les cartes n'en ont pas.
- **Titres de section** (`section-title-center`) : H3 centré en MAJUSCULES, encadré de deux filets horizontaux de 2 px (`currentColor`, opacité 0,1). C'est un marqueur fort de l'identité, à conserver sous une forme modernisée.
- **Séparateurs** : `is-divider`, un petit trait court sous les titres.
- **Header** sur 3 étages : barre blanche (horaires, téléphone, email), header blanc avec le logo et le bouton rouge COVID, puis **barre de menu ardoise `#4B6368` avec des liens blancs en gras**. C'est l'élément le plus reconnaissable du site.
- **Hero** : bannière en parallaxe avec une photo désaturée en gris-bleu (`presentation_societe_accueil_v2-1.jpg`), texte blanc par-dessus, boutons orange.
- **Footer** : 3 colonnes sur fond gris `#777`, puis une bande copyright `#5B5B5B`.
- **Ton visuel** : sobre et corporate, palette froide (ardoise, gris) relevée par un seul accent chaud (orange).

---

## 5. Problèmes relevés sur le site actuel (à corriger dans la refonte)

1. `<meta name='robots' content='noindex, nofollow'>` : **le site est invisible sur Google aujourd'hui.** C'est le problème le plus coûteux pour le client, et un argument de vente fort.
2. **Aucune balise H1** sur l'accueil (seulement des H2 et H3).
3. Texte courant `#777` sous le seuil AA (4,48:1).
4. Font Awesome chargée deux fois, Dancing Script chargée pour rien.
5. Footer « Mots clés » : 22 liens de bourrage de mots-clés.
6. Liens sociaux vides (Facebook, Instagram, Twitter, Pinterest).
7. Fautes visibles : « Nos qualitées », « Acceuil », « Tout nos techniciens sont formé », « propriétés privée ». Elles seront corrigées.
8. Services en double dans la grille (« Nettoyage de commerces » et « cabinets médicaux » apparaissent deux fois).

---

## 6. Images téléchargées (`assets/img/`)

| Fichier | Taille | Constat |
|---|---|---|
| `logo_203x70-1.jpg` | 203×70 | JPG sur **fond blanc opaque** (coins `#FFFFFF`). Trop petit pour les écrans Retina |
| `logo.jpg` | 271×71 | Idem. Il sera la source principale, posé sur un header **blanc** (pas de détourage) |
| `icone-site-192/180/32.png` | PNG transparent | Le diamant seul, propre, il servira pour le favicon |
| `BUREAU.jpg` | 600×480 | ⚠️ **Floue au-delà d'environ 600 px.** Photo de banque d'images (murs rouges, texte allemand « Leitungskonzepte »). Elle détonne avec la palette |
| `particulier.jpg` | 600×480 | ⚠️ Floue au-delà d'environ 600 px. Équipe en tenue verte : cohérente avec le vert du logo |
| `presentation-1.jpg` | 1050×399 | Infographie « Projet / Planning / Intervention / Résultat » avec du **texte en bleu intégré à l'image** (hors charte, illisible sur mobile). À éviter ou à recréer en HTML |
| `presentation_societe_accueil_v2-1.jpg` | 2186×450 | Fond actuel du hero. Assez large, mais déjà **flou et sombre** à la source. Utilisable seulement en fond assombri |

Non téléchargées : `header61.jpg` (dégradé gris à motif floral, décoratif, sans intérêt) et `menu-1.jpg` (visuel du menu déroulant).

**Pièce à demander au client** : le logo en vectoriel (SVG, AI ou PDF). Sans lui, le logo restera net seulement jusqu'à environ 270 px de large.

---

## 7. Décisions à valider avant de coder

**D1. Place du vert du logo.**
Ma recommandation : garder **`#4B6368` comme couleur dominante** (barre de menu, titres de section, footer) et **`#D26E4B` pour tous les CTA**. C'est le duo que le client reconnaît. Le vert `#528368` serait limité à des touches (icône du favicon, coches de la section « Nos qualités ») pour faire le lien avec le logo, sans devenir une troisième couleur principale.
Alternative stricte : 100 % palette CSS, sans aucun vert.

**D2. Contraste de l'orange `#D26E4B` (3,46:1 avec du texte blanc).**
Je garde la couleur exacte pour le fond des boutons, avec un texte blanc **en gras et d'au moins 19 px** : il est alors considéré comme « texte large » au sens WCAG (seuil de 3:1), donc conforme. Je ne l'utilise jamais pour un texte courant sur fond blanc.

**D3. Texte courant `#777777` (4,48:1, non conforme).**
Je passe le texte courant en `#555555`, la couleur des titres actuels, qui est déjà dans la charte. Je garde `#777777` pour les textes secondaires de grande taille.

**D4. Rouge `#B20000`.**
Il ne servait qu'au bouton COVID, qui disparaît. Je propose de **ne pas le reprendre** (deux couleurs chaudes concurrentes brouilleraient les CTA). Il resterait uniquement en couleur d'erreur du formulaire.

**D5. Footer gris `#777` / `#5B5B5B`.**
Je propose un footer **`#4B6368` assombri vers l'ardoise du logo `#233842`**. Les deux couleurs existent déjà dans l'identité, et le footer actuel en gris est la partie qui fait le plus « 2016 ».
Alternative stricte : garder `#5B5B5B`.

**D6. Typographie.** Lato 400/700 reste la police unique, avec un fallback système. Dancing Script est supprimée.

**D7. `BUREAU.jpg`** (murs rouges, texte allemand) pour la carte « Professionnels » : elle est hors palette et datée. Soit je la garde en la recadrant et en la désaturant légèrement, soit le client fournit une vraie photo de chantier. Je la garde par défaut, avec un TODO.

### Palette proposée pour `:root` (toutes les valeurs proviennent du site ou du logo)

```css
--c-primary:       #4B6368; /* ardoise : menu, titres de section, liens */
--c-primary-dark:  #233842; /* ardoise du logo : footer, survols */
--c-accent:        #D26E4B; /* orange : CTA (texte blanc en gras ≥ 19 px) */
--c-brand-green:   #528368; /* vert du logo : touches seulement (si D1 validée) */
--c-heading:       #555555; /* titres */
--c-text:          #555555; /* texte courant (au lieu de #777, cf. D3) */
--c-text-muted:    #777777; /* textes secondaires de grande taille */
--c-hover:         #111111; /* survol des liens */
--c-border:        #ECECEC; /* filets */
--c-bg:            #FFFFFF;
--c-error:         #B20000; /* erreurs du formulaire uniquement (cf. D4) */
```
