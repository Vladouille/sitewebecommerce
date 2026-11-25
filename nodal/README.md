# NODAL — boutique Shopify (thème Dawn personnalisé)

Tout ce qui concerne NODAL est dans ce dossier. Il n'a **aucun lien** avec le site Autoflow à la racine du dépôt. Le dossier est bloqué (erreur 404) si ce dépôt est déployé sur Hostinger. À terme, déplace-le dans son propre dépôt.

| Fichier | Rôle |
|---|---|
| `ARBORESCENCE.md` | Arborescence validée, rôle de chaque page, décisions |
| `maquette-accueil-mobile.html` | Maquette validée de l'accueil |
| `theme/` | Thème Shopify (Dawn 16.2.0 + couche NODAL) |
| `nodal-theme.zip` | Le même thème, prêt à importer dans Shopify |
| `contenus/` | Textes des pages d'aide et des pages légales, à coller dans Shopify |

## Ce que la couche NODAL ajoute à Dawn

- `assets/nodal.css` : direction artistique (noir `#0B0D10`, crème `#E8E4DA`, vert `#C6FF00` uniquement pour les boutons, prix et détails), polices Space Grotesk + Inter hébergées dans le thème (aucun appel à Google Fonts).
- `assets/nodal.js` : avant/après, barre « Composer mon rail » collante, mini configurateur, date de livraison estimée.
- `assets/nodal-configurator.js` : le configurateur.
- Sections (toutes modifiables dans l'éditeur) : `nodal-hero`, `nodal-trust`, `nodal-before-after`, `nodal-steps`, `nodal-modules`, `nodal-proof`, `nodal-atelier`, `nodal-config-teaser`, `nodal-configurator`, `nodal-faq`, `nodal-newsletter`.
- Fiche produit : blocs « NODAL · Charge max » (sous le titre) et « NODAL · Délai, retours, garantie » (sous le bouton d'achat), plus la section « Oui, ça tient. » avec la vidéo du test de charge du produit.
- Panier et tiroir panier : délai de livraison estimé, retours et garantie sous le bouton de paiement.
- En-tête : le logo n'est plus un H1 sur l'accueil (un seul H1 par page).
- Modifications de fichiers Dawn d'origine, à reporter lors d'une mise à jour de Dawn : `layout/theme.liquid`, `sections/header.liquid`, `sections/main-product.liquid`, `sections/main-cart-footer.liquid`, `snippets/cart-drawer.liquid`, `config/settings_schema.json`, `config/settings_data.json`, `templates/index.json`, `templates/product.json`.

## Mise en place dans Shopify, dans cet ordre

### 1. Importer le thème
Boutique en ligne > Thèmes > Ajouter un thème > Importer un fichier zip > `nodal-theme.zip`. **Ne le publie pas tout de suite.**

### 2. Définir les métachamps (Paramètres > Données personnalisées > Produits)
| Nom | Espace de noms et clé | Type | Exemple |
|---|---|---|---|
| Charge maximale (kg) | `nodal.charge_kg` | Texte sur une ligne | `8` ou `2×5` |
| Usage | `nodal.usage` | Texte sur une ligne | `Vélo, moto, ski` |
| Emplacements occupés | `nodal.slots` | Nombre entier | `1` (2 pour un module large) |
| Vidéo du test de charge | `nodal.test_video` | Fichier (vidéo) | — |
| Facteur de test | `nodal.test_factor` | Nombre entier | `3` |

**Une charge non testée n'est jamais saisie.** Sans valeur, rien ne s'affiche.

### 3. Créer les produits
- **Rail** : un seul produit, deux options **Longueur** (`60 cm`, `80 cm`, `120 cm`) et **Finition** (ex. `Naturel`, `Fumé`). Une variante par combinaison, avec son prix. Pour la pastille de couleur des finitions : Options > Finition > nuancier.
- **Modules** : un produit par module, avec les métachamps ci-dessus et des photos en main (format carré, WebP de préférence).
- Collections : `Modules` (tous les modules) et `Rails`.

### 4. Créer les pages (Boutique en ligne > Pages)
| Page | Adresse | Modèle | Texte |
|---|---|---|---|
| Configurateur | `/pages/configurateur` | `configurateur` | (géré par la section) |
| Guide de pose | `/pages/guide-de-pose` | par défaut | `contenus/04-guide-de-pose.md` |
| Livraison | `/pages/livraison` | par défaut | `contenus/01-livraison.md` |
| Retours | `/pages/retours` | par défaut | `contenus/02-retours.md` |
| Garantie | `/pages/garantie` | par défaut | `contenus/03-garantie.md` |
| À propos | `/pages/a-propos` | par défaut | `contenus/05-a-propos.md` |
| Contact | `/pages/contact` | `contact` | `contenus/06-contact.md` |
| Mentions légales | `/pages/mentions-legales` | par défaut | `contenus/10-mentions-legales.md` |
| Cookies | `/pages/cookies` | par défaut | `contenus/13-cookies.md` |
| Médiateur | `/pages/mediateur` | par défaut | `contenus/14-mediateur.md` |

CGV et confidentialité vont dans **Paramètres > Politiques** (`contenus/11-cgv.md`, `contenus/12-confidentialite.md`).
Redirection courte conseillée (Navigation > Redirections d'URL) : `/configurateur` vers `/pages/configurateur`.

### 5. Régler le thème (Personnaliser)
- **Paramètres du thème > NODAL — engagements** : délai de fabrication, délais de transport, retours, garantie, ville de l'atelier, largeur d'un emplacement (en mm), liens Retours, Garantie et Configurateur. Ces valeurs alimentent l'accueil, les fiches, le configurateur et le panier.
- **Accueil** : choisir le produit rail dans « Hero » et « Mini config », et la collection Modules dans « Modules ». Déposer les photos et vidéos. Les emplacements vides restent signalés tant qu'il n'y a rien.
- **Page Configurateur** : produit rail, collection Modules, kit suggéré.
- **En-tête** : logo NODAL. Menu principal : Configurateur, Modules, Rails, Guide de pose, À propos.
- **Pied de page** : menus Boutique, Aide, Légal (voir la maquette), avec le lien « Préférences cookies ».

### 6. Obligations avant la première vente
- [ ] Adhérer à un médiateur de la consommation et compléter `/pages/mediateur` (obligatoire).
- [ ] Activer la bannière de cookies de Shopify pour l'UE (Paramètres > Confidentialité des clients).
- [ ] Compléter tous les `[À COMPLÉTER]` des pages légales, puis les faire relire par un professionnel du droit.
- [ ] Reproduire mot pour mot l'encadré officiel de la garantie légale de conformité (décret n° 2022-424).
- [ ] Avis : installer une application d'avis vérifiés (ex. Judge.me, offre gratuite) et ajouter son bloc d'application sur la fiche produit. **Aucun avis importé ou inventé.** Un bloc vide reste masqué.
- [ ] Commande test complète sur téléphone : configurateur, panier, paiement, email de confirmation, puis remboursement.
- [ ] Lighthouse mobile sur l'accueil, une fiche et le configurateur : objectif supérieur à 90. Le poids des photos est la cause n°1 d'un mauvais score : WebP, 1 600 px de large au maximum pour le hero.

## Comment le configurateur fonctionne
- Longueurs et prix lus dans les variantes du rail. Nombre d'emplacements = longueur ÷ largeur d'un emplacement (réglage du thème).
- Mobile : un tap sur un module le place dans le premier emplacement libre. Un tap sur un emplacement vide le cible, et le module suivant y va. Un tap sur un module posé le retire. Le rail défile horizontalement s'il est trop long pour l'écran.
- Ordinateur : glisser-déposer en plus.
- Ajout au panier : rail et modules en un seul envoi, reliés par une propriété cachée `_Composition` (visible dans la commande dans l'admin, pas par le client).
- La composition est gardée si le client recharge la page ou revient en arrière.
- Une combinaison épuisée bloque le bouton avec un message clair. Un module épuisé est grisé.

## Ce qui a été vérifié
- `theme-check` (outil officiel de Shopify) : aucune erreur. Les avertissements restants viennent de Dawn d'origine.
- Configurateur et mini configurateur testés dans Chromium à 375 px avec des données d'exemple : placement, modules sur deux emplacements, changement de longueur, finition épuisée, kit suggéré, sauvegarde, envoi au panier.
- **Pas encore testé sur une vraie boutique Shopify** : c'est l'étape suivante.
