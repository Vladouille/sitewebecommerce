# Boutique Pilates — mode d'emploi

Ce dossier contient tout ce qu'il faut pour lancer la boutique sur Shopify :

| Fichier | À quoi il sert |
|---|---|
| `theme.zip` | Le thème, à téléverser tel quel dans Shopify |
| `theme/` | Le même thème, en fichiers (utile seulement pour un développeur) |
| `products.csv` | Les 10 produits, à importer dans Shopify (en brouillon, prix à vérifier) |

L'ancienne page `site-vitrine.html` (fond nuit, Google Fonts) a été supprimée : tout son contenu utile est maintenant dans le thème.
| `LISEZMOI.md` | Ce guide |

> **Suis les étapes dans l'ordre.** L'ordre compte : par exemple, les collections doivent exister avant que la page d'accueil affiche des produits, et les définitions de metafields doivent exister avant de les remplir.

Partout dans ce guide, « Admin » veut dire l'administration Shopify (la page `admin.shopify.com`).

---

## Étape 1 — Importer le thème

1. Admin → **Boutique en ligne** → **Thèmes**.
2. En bas, dans « Bibliothèque de thèmes », clique sur **Ajouter un thème** → **Téléverser un fichier zip**.
3. Choisis `theme.zip`. Attends la fin du téléversement.
4. Ne clique **pas** encore sur « Publier ». Clique sur **Personnaliser** pour le voir.

Le thème est en français et ne charge aucun script ni police depuis un site extérieur (les polices viennent de la bibliothèque Shopify, sans Google Fonts).

La page d'accueil contient, dans l'ordre (chaque section se déplace, se masque ou se modifie dans l'éditeur) : bannière, bandeau d'arguments, packs studio, machines, **calculateur de studio**, comment ça marche, comparatif, garantie, avis clients (invisible tant qu'il n'y en a pas), FAQ, contact.

Le **calculateur de studio** lit les produits de la collection Machines : prix Shopify, paliers de remise (`custom.paliers_quantite`) et délai (`custom.delai_livraison`) de chaque machine. Son bouton ajoute réellement la machine et la quantité au panier.

## Étape 2 — Régler le thème (5 minutes)

Dans **Personnaliser**, clique sur l'icône **engrenage** (Paramètres du thème) en bas à gauche :

- **Marque et contact** : nom de la marque (déjà réglé sur « Ressaline »), logo, favicon, **téléphone**, horaires, **email**. Le téléphone et l'email sont **vides** : tant qu'ils le restent, ils sont masqués partout sur le site, et un rappel s'affiche dans l'éditeur.
- **Promesses** : c'est ici que se règlent les promesses affichées sur tout le site :
  - **Durée de la garantie** (2 ans par défaut). Elle doit correspondre exactement à ta page de conditions de garantie.
  - **Stock de pièces en France : oui/non** (non par défaut). Tant que la case n'est pas cochée, le site affiche « Pièces de rechange disponibles et garanties ». Coche-la seulement quand le stock existe réellement en France.
  - **Promesse d'économie** (« jusqu'à 30 % moins cher ») et sa **mention** (« Par rapport aux prix publics constatés des marques de studio, [DATE À COMPLÉTER] »). Elle n'apparaît qu'une fois, dans la bannière d'accueil. Complète la date et garde une preuve écrite de la comparaison ; laisse le champ vide pour ne rien afficher.
  - Dans les textes des sections, les marqueurs `[GARANTIE]`, `[PIECES]`, `[ECONOMIE]` et `[NOM DE MARQUE]` sont remplacés automatiquement par ces réglages. Garde-les quand tu modifies un texte : un seul changement de réglage met alors tout le site à jour.
- **Couleurs** : fond blanc cassé, beige, bois clair, texte presque noir, **couleur d'accent** (vert sauge) et **couleur des boutons d'achat** (terre cuite). La couleur d'achat est réservée à « Ajouter au panier » et « Passer commande » : ne l'utilise nulle part ailleurs, pour qu'elle reste repérable.
- **Typographie** : police des titres (Cormorant) et du texte (DM Sans), modifiables.
- **Prix et TVA** : taux de TVA (20 % par défaut) et prix mis en avant (TTC ou HT).

Chaque section de chaque page (textes, images, boutons, ordre) se modifie en cliquant dessus dans l'éditeur. Les sections de la page d'accueil se réordonnent par glisser-déposer.

## Étape 3 — Créer les définitions de metafields (avant d'importer les produits)

Les metafields sont des champs en plus sur chaque produit : délai, remises par quantité, caractéristiques. Le thème les lit automatiquement. **Si un champ est vide, le bloc correspondant est simplement masqué.**

Admin → **Paramètres** → **Données personnalisées** (ou « Metafields et métaobjets ») → **Produits** → **Ajouter une définition**. Crée-les une par une, en respectant **exactement** l'espace de noms et la clé (`custom.xxx`) :

| Nom affiché | Espace de noms et clé | Type à choisir | Exemple de valeur | Où ça s'affiche |
|---|---|---|---|---|
| Délai de livraison | `custom.delai_livraison` | Texte sur une seule ligne | `Expédié sous 6 à 8 semaines` ou `En stock — livré en 3 à 5 jours` | Badge sur la fiche, les cartes produit et le panier |
| Paliers de quantité | `custom.paliers_quantite` | JSON | `[{"min":1,"remise":0},{"min":4,"remise":8},{"min":8,"remise":15}]` | Tableau des remises sur la fiche |
| Dimensions | `custom.dimensions` | Texte sur une seule ligne | `240 × 68 × 40 cm` | Caractéristiques techniques |
| Poids | `custom.poids` | Texte sur une seule ligne | `85 kg` | Caractéristiques techniques |
| Charge maximale | `custom.charge_max` | Texte sur une seule ligne | `150 kg` | Caractéristiques techniques |
| Matériaux | `custom.materiaux` | Texte sur une seule ligne | `Bois` | Caractéristiques + filtre « Matériau » |
| Ressorts | `custom.ressorts` | Texte sur une seule ligne | `5 ressorts, 3 tensions` | Caractéristiques techniques |
| Usage | `custom.usage` | Texte sur une seule ligne | `Commercial` | Caractéristiques + filtre « Usage » |
| Garantie | `custom.garantie` | Texte sur une seule ligne | `2 ans` | Caractéristiques techniques |
| Idéal pour | `custom.ideal_pour` | Texte sur une seule ligne → coche **Liste de valeurs** | `Studio`, `Salle de sport`, `Kiné`, `Domicile` | Pastilles « Idéal pour » |
| Promesse (facultatif) | `custom.promesse` | Texte sur une seule ligne | `Le reformer des studios exigeants.` | Phrase sous le titre (sinon texte par défaut du thème) |
| Nombre de postes (packs, facultatif) | `custom.nombre_postes` | Nombre entier | `4` | « soit 1 873 € HT par poste » sur la carte du pack |

Pour **Matériaux** et **Usage**, active aussi l'option **« Filtrage des produits »** / « Filtres de la boutique » si elle est proposée dans la définition (elle sert aux filtres de collection, étape 7).

**Règles pour éviter les erreurs :**
- **Paliers (JSON)** : les crochets, guillemets et virgules doivent être exacts. Les paliers vont du plus petit au plus grand. `remise` est un pourcentage. Ne mets **pas** ce champ sur les packs (déjà au prix de lot).
- **Matériaux et Usage** : utilise toujours la même valeur courte (`Bois`, `Aluminium`, `Acier` ; `Commercial`, `Domicile`). Sinon le filtre affichera « Bois », « bois » et « Chêne » comme trois choix différents.

## Étape 4 — Importer les produits

1. Admin → **Produits** → **Importer**.
2. Choisis `products.csv` → **Aperçu** → **Importer les produits**.
3. Les 10 produits arrivent en **brouillon** (invisibles sur le site) avec : titre, description, type, tags, SKU, prix TTC, poids.

À savoir :
- Le fichier utilise le format CSV historique de Shopify (colonnes `Handle`, `Title`, `Body (HTML)`, `Variant SKU`…), que l'import accepte toujours. Si Shopify affiche un avertissement sur le format, télécharge son modèle CSV depuis la fenêtre d'import et recopie les valeurs colonne par colonne : les noms correspondent un à un.
- **Prix** : ce sont les prix TTC que tu as indiqués. Vérifie-les un par un.
- **Poids** : ce sont des **estimations** (reformer 75 à 110 kg, Cadillac 150 kg, packs 400 et 900 kg…). Remplace-les par les poids réels donnés par l'usine.
- **Stock** : suivi activé, quantité 0, et « Continuer à vendre en cas de rupture » activé. Cela permet la vente sur commande. Pour les pièces réellement stockées en France, saisis la vraie quantité et désactive « Continuer à vendre ».
- **Descriptions** : elles contiennent des mentions `[À PRÉCISER : …]` (contenu des packs, compatibilité des pièces). Complète-les avant de passer les produits en « Actif ».
- **Images** : ajoute au moins 3 photos par produit (vue d'ensemble, détail, en situation dans un studio) et, si possible, une **vidéo** : téléverse le fichier vidéo directement dans les médias du produit. Une vidéo YouTube fonctionne aussi, mais YouTube dépose des cookies : il faut alors le bandeau de consentement (étape 12).

## Étape 5 — Créer les collections automatiques

Admin → **Produits** → **Collections** → **Créer une collection**. Pour chacune : type **Automatisée**, condition **« Tag du produit » est égal à** :

| Titre exact de la collection | Condition (tag) | Adresse obtenue |
|---|---|---|
| Machines | `Machines` | `/collections/machines` |
| Packs studio | `Packs studio` | `/collections/packs-studio` |
| Accessoires et pièces | `Accessoires et pièces` | `/collections/accessoires-et-pieces` |

**Vérifie l'adresse** (en bas de la page de la collection, « Référencement / SEO ») : elle doit être exactement `machines`, `packs-studio`, `accessoires-et-pieces`. La page d'accueil, le menu par défaut et les produits complémentaires utilisent ces adresses. Si l'une diffère, corrige-la ou choisis la collection directement dans la section concernée de l'éditeur.

## Étape 6 — Créer les pages et leur appliquer le bon modèle

Admin → **Boutique en ligne** → **Pages** → **Ajouter une page**. Pour chaque page : saisis le titre exact, **laisse le contenu vide**, et à droite, dans **Modèle de thème**, choisis le modèle indiqué. Le texte de départ est déjà dans le modèle : tu le modifies ensuite dans **Personnaliser** (sélecteur de page en haut de l'éditeur).

| Titre exact | Modèle | Adresse obtenue |
|---|---|---|
| Professionnels | `professionnels` | `/pages/professionnels` |
| Livraison et montage | `livraison` | `/pages/livraison-et-montage` (texte marqué `[À FAIRE VALIDER PAR UN JURISTE]`) |
| Retours | `retours` | `/pages/retours` |
| Garantie et pièces de rechange | `garantie` | `/pages/garantie-et-pieces-de-rechange` |
| FAQ | `faq` | `/pages/faq` |
| Contact | `contact` | `/pages/contact` |
| CGV | `cgv` | `/pages/cgv` |
| Mentions légales | `mentions-legales` | `/pages/mentions-legales` |

Si tu écris un texte dans le contenu de la page Shopify, il s'affiche **en plus** du texte du modèle.

## Étape 7 — Menus et filtres

**Menu principal** : Admin → **Boutique en ligne** → **Navigation** → **Menu principal**. Supprime « Accueil » et « Catalogue », puis ajoute dans cet ordre : Machines, Packs studio, Accessoires et pièces (les 3 collections), Professionnels, FAQ, Contact (les pages). Tant que ce menu est **vide**, le thème affiche ces 6 liens par défaut ; mais le menu créé par Shopify n'est pas vide (il contient « Accueil » et « Catalogue »), donc il faut le modifier.

**Menu du pied de page** : même endroit, menu **Pied de page**. Mets : Livraison et montage, Retours, Garantie et pièces de rechange, CGV, Mentions légales, Contact. Ajoute aussi la **Politique de confidentialité** (lien vers les politiques de la boutique).

**Filtres des collections** : installe l'application gratuite **Search & Discovery** de Shopify → **Filtres** → ajoute : **Type de produit** (type de machine), **Matériaux** (metafield `custom.materiaux`), **Usage** (metafield `custom.usage`), et éventuellement **Prix**. Les filtres apparaissent ensuite automatiquement en haut de chaque collection.

## Étape 8 — Remplir les metafields de chaque produit

Ouvre chaque produit → tout en bas, bloc **Metafields** → remplis les champs. Plus rapide : sélectionne plusieurs produits → **Modifier les produits** (éditeur en masse) → **Colonnes** → ajoute les metafields, et remplis-les comme un tableur.

Exemple pour le Reformer Studio Bois :
- Délai de livraison : `Expédié sous 6 à 8 semaines`
- Paliers : `[{"min":1,"remise":0},{"min":4,"remise":8},{"min":8,"remise":15}]`
- Idéal pour : `Studio`, `Salle de sport`, `Kiné`, `Domicile`
- Les caractéristiques : **uniquement des valeurs vérifiées** sur la fiche technique de l'usine. N'invente aucune charge maximale ou dimension : en cas d'accident, c'est ta responsabilité.

## Étape 9 — Taxes (prix TTC, TVA 20 %)

Admin → **Paramètres** → **Taxes et droits** :
1. Région **France** : vérifie que la TVA est à **20 %**.
2. Coche **« Tous les prix incluent les taxes »**. Les prix saisis (2 390 € etc.) sont alors des prix TTC, et Shopify en déduit la TVA sur la facture.
3. **Numéro de TVA intracommunautaire** : dans la partie **Union européenne** de cette page, active l'option **« Collecter les numéros de TVA »** au paiement si elle s'affiche pour ta boutique. Un client professionnel d'un **autre pays de l'UE** avec un numéro valide paiera alors hors TVA (autoliquidation).
   - Attention : un studio **français** paie toujours la TVA française (il la récupère ensuite). Seuls les achats depuis un autre pays de l'UE peuvent être exonérés.
   - **Si l'option n'apparaît pas** : demande le numéro de TVA dans le champ « Informations pour la facture » du panier (déjà présent), active le champ **Entreprise** au paiement (étape 11), et traite les ventes intra-UE à la main : crée la commande depuis **Commandes → Créer une commande** (commande provisoire), décoche « Facturer les taxes », puis envoie la facture de paiement au client.
4. Pour des factures conformes (numérotation, mentions obligatoires), installe une application de facturation française (recherche « facture » dans l'App Store Shopify) : Shopify ne produit pas de facture conforme tout seul.

Le thème calcule le prix HT affiché ainsi : prix TTC ÷ 1,20. **Il ne change jamais le prix facturé.** Si tu modifies le taux dans Shopify, modifie aussi « Taux de TVA » dans les paramètres du thème.

## Étape 10 — Remises par quantité (réductions automatiques)

Le tableau des paliers sur la fiche produit est **une simple information**. Le client ne paiera le prix remisé **que si tu crées les réductions correspondantes**. Sinon, il verra « −8 % » sur la fiche et ne l'aura pas au panier : risque de litige et de pratique commerciale trompeuse.

Admin → **Réductions** → **Créer une réduction** → **Montant de réduction sur des produits** → méthode **Automatique**.

**Option A (recommandée, la plus simple) : mêmes paliers pour toutes les machines, modèles combinables**
- Réduction 1 : titre `Remise 4 machines`, valeur **8 %**, s'applique à la **collection Machines**, condition minimale **Quantité minimale d'articles : 4**.
- Réduction 2 : titre `Remise 8 machines`, valeur **15 %**, collection **Machines**, quantité minimale **8**.
- Dans « Combinaisons », **ne coche rien** : Shopify applique alors automatiquement la meilleure des deux.
- Avec cette option, 2 reformers bois + 2 reformers aluminium = 4 machines → −8 %. Dans le thème (Personnaliser → fiche produit → bloc « Remises par quantité »), change la mention en : `Remise appliquée automatiquement dans le panier, modèles combinables.`

**Option B : paliers différents selon le produit**
- Une réduction par produit et par palier (ex. « Cadillac 4+ »), en choisissant **Produits spécifiques** au lieu de la collection. Shopify limite le nombre de réductions automatiques actives : vérifie la limite affichée.

**Dans tous les cas** :
- Les packs ne doivent **pas** avoir le tag `Machines` (sinon la remise s'ajouterait au prix de lot).
- Le titre de la réduction s'affiche dans le panier (« Remise 4 machines −764,80 € ») : choisis un titre clair.
- **Teste** : mets 4 machines au panier et vérifie que le montant correspond au tableau de la fiche.

## Étape 11 — Paiement, page de paiement et comptes clients

**Moyens de paiement** : Admin → **Paramètres** → **Paiements**.
1. Active **Shopify Payments** (cartes bancaires, Apple Pay, Google Pay). Les logos s'affichent automatiquement dans le pied de page.
2. Ajoute **Virement bancaire** : « Méthodes de paiement manuelles » → **Virement bancaire**. Dans les instructions, mets ton IBAN, et : « Votre commande est lancée en fabrication à réception du virement. Indiquez votre numéro de commande en référence. »
3. **Paiement en plusieurs fois pour les professionnels** : c'est un texte affiché sur le site, donc **une promesse**. Avant d'ouvrir, choisis une solution réelle :
   - selon ton pays et ton compte, Shopify Payments peut proposer un paiement fractionné directement dans **Paramètres → Paiements** ;
   - pour les entreprises, cherche une application de paiement B2B ou de financement (« B2B », « paiement à terme », « leasing ») dans l'App Store Shopify, ou passe un accord avec un organisme de **location financière** (leasing). Les studios apprécient souvent cette formule, mais vérifie ses conditions avant de la proposer ;
   - à défaut : propose un échéancier par virement (acompte + solde) via une commande provisoire.
   Tant qu'aucune solution n'est en place, retire la ligne 4 de la réassurance (fiche produit) et adapte l'accordéon « Financement » et la FAQ.

**Page de paiement** : Admin → **Paramètres** → **Paiement** (Checkout) :
- La page de paiement en **une seule page** est le modèle actuel de Shopify : choisis-la si on te propose « Une page / Trois pages ».
- **Comptes clients** : choisis **les nouveaux comptes clients** et rends le compte **facultatif** (le client peut commander sans créer de compte).
- **Nom de l'entreprise** : mets ce champ en **Facultatif** (les pros pourront saisir leur raison sociale).
- **Téléphone** : mets-le en **Obligatoire** ou facultatif. Pour organiser la livraison et le montage, mieux vaut l'avoir.

## Étape 12 — Livraison (produits lourds, livraison et montage inclus)

Admin → **Paramètres** → **Expédition et livraison** :
1. **Créer un profil personnalisé** nommé `Machines – livraison et montage`. Ajoute-y toutes les machines et les packs.
2. Zone d'expédition **France**. Ajoute un tarif **gratuit** (0 €) nommé : `Livraison et montage inclus (délai indiqué sur la fiche produit)`.
3. N'ajoute **aucune autre zone** : hors de la France, la commande sera impossible en ligne, ce qui oblige à te contacter (ce que disent les textes du site).
   - Attention : dans Shopify, la zone « France » inclut la **Corse**. L'outre-mer (Guadeloupe, Réunion…) est compté comme des pays séparés, donc exclu. Si tu ne veux pas livrer gratuitement en Corse, décide-le maintenant : soit tu l'acceptes, soit tu le précises dans les CGV et la page Livraison.
4. Profil **général** (pièces et accessoires) : zone France, avec le tarif de ton choix (gratuit ou payant). Si c'est payant, corrige le texte « Livraison et montage : Inclus » du panier (Personnaliser → Panier) pour les commandes d'accessoires seuls.

Le délai affiché vient du metafield `delai_livraison` de chaque produit. Garde ces délais **réalistes** : un délai dépassé permet au client particulier d'annuler la commande.

## Étape 13 — Cookies, pages légales et politiques

1. **Bandeau cookies (obligatoire en France)** : Admin → **Paramètres** → **Confidentialité des clients** → active le **bandeau de cookies** pour l'Union européenne. Shopify dépose des cookies techniques et statistiques : sans bandeau, tu n'es pas en règle (CNIL).
2. **Politiques Shopify** : Admin → **Paramètres** → **Politiques**. Remplis la politique de remboursement, la politique de confidentialité (le générateur de Shopify est une bonne base), les conditions d'utilisation (copie le texte de tes CGV), la politique d'expédition et les **mentions légales**. Ces textes sont liés automatiquement depuis la page de paiement.
3. **CGV, Mentions légales, Retours, Garantie** : les modèles du thème contiennent un avertissement rouge `[À FAIRE VALIDER PAR UN JURISTE]` et des champs `[À COMPLÉTER]`. Fais tout valider par un juriste, puis **vide le champ « Avertissement »** de chaque section dans l'éditeur.
   Points qu'un juriste doit absolument vérifier :
   - la **reproduction intégrale des articles de loi** sur les garanties légales dans les CGV (obligatoire en vente aux particuliers) ;
   - l'**adhésion à un médiateur de la consommation** (obligatoire dès que tu vends à des particuliers ; son nom doit figurer dans les CGV) ;
   - le **coût estimé du retour** d'une machine (obligatoire quand un produit ne peut pas être renvoyé par la poste) ;
   - l'exclusion du droit de rétractation pour les professionnels ;
   - le contenu exact de ta **garantie commerciale de 2 ans** (ce qui est couvert, ce qui ne l'est pas).

## Étape 14 — Référencement (Google)

- **Page d'accueil** : Admin → Boutique en ligne → **Préférences** → titre et méta-description de la page d'accueil.
- **Chaque produit, collection et page** : en bas de sa fiche, bloc **« Référencement sur les moteurs de recherche »** → Modifier : titre et description. Le CSV remplit déjà ceux des produits.
- **Photos** : sur chaque image, clique sur « … » → **Ajouter un texte alternatif** (ex. « Reformer en chêne installé dans un studio lumineux »). Sans texte, le thème utilise le nom du produit.
- Les données structurées des produits (prix, disponibilité) sont générées automatiquement par le thème pour Google.

## Étape 15 — Contrôles avant d'ouvrir la boutique

- [ ] Publier le thème : **Boutique en ligne → Thèmes → … → Publier**.
- [ ] Passer chaque produit complété en **Actif**.
- [ ] Ouvrir le site sur **ton téléphone** : accueil, une fiche produit, une collection, le panier.
- [ ] Vérifier chaque lien du menu et du pied de page (aucune page « introuvable »).
- [ ] Passer une **commande test** : Admin → Paramètres → Paiements → **mode test** de Shopify Payments, puis une commande avec 4 machines pour vérifier la remise, la TVA et la livraison gratuite.
- [ ] Passer une commande test par **virement** et vérifier l'email de confirmation.
- [ ] Envoyer un message via la page **Contact** et vérifier sa réception (il arrive sur l'email de la boutique : Paramètres → Général).
- [ ] Retirer le mot de passe de la boutique (Boutique en ligne → Préférences) seulement à la fin.

---

## Ce que tu dois remplacer toi-même (liste complète)

| Quoi | Où |
|---|---|
| Nom de marque « Ressaline » (seulement si tu changes de nom) | Paramètres du thème → Marque et contact ; **Vendor** et titres SEO des produits ; textes juridiques et page d'accueil (section « Avant / Avec ») ; nom de la boutique (Paramètres → Général) |
| Téléphone et email (vides au départ) | Paramètres du thème → Marque et contact |
| Date de la comparaison de prix `[DATE À COMPLÉTER]` | Paramètres du thème → Promesses |
| Case « Stock de pièces en France » (à cocher seulement si c'est vrai) | Paramètres du thème → Promesses |
| Texte alternatif de la photo d'accueil | Personnaliser → Accueil → Bannière principale |
| Logo, favicon | Paramètres du thème → Marque et contact |
| Photo de la bannière d'accueil (et image facultative de la section garantie) | Personnaliser → Accueil |
| Photos et vidéos des 10 produits | Fiche de chaque produit |
| Prix TTC des 10 produits | Fiche de chaque produit (vérifier ceux du CSV) |
| Poids réels | Fiche de chaque produit (ceux du CSV sont estimés) |
| Contenu des packs, compatibilité des pièces (`[À PRÉCISER]`) | Description des produits concernés |
| Metafields (délai, paliers, caractéristiques, idéal pour) | Fiche de chaque produit ou éditeur en masse |
| Textes juridiques (`[À COMPLÉTER]`, `[À FAIRE VALIDER PAR UN JURISTE]`, `[DATE]`) | Personnaliser → pages CGV, Mentions légales, Retours, Garantie ; Paramètres → Politiques |
| Emballages repris ou laissés sur place (`[À COMPLÉTER]`) | Personnaliser → page Livraison et montage |
| Solution de paiement en plusieurs fois | Paramètres → Paiements (ou retirer la promesse du site) |
| IBAN et instructions de virement | Paramètres → Paiements → Virement bancaire |
| Avis clients (uniquement de vrais avis, avec accord écrit) | Personnaliser → Accueil → section « Avis clients » → Ajouter un bloc |
| Réseaux sociaux (facultatif) | Paramètres du thème → Réseaux sociaux |

---

## Les erreurs que tu vas probablement rencontrer, et la solution

| Ce que tu vois | Cause | Solution |
|---|---|---|
| Le menu affiche « Accueil » et « Catalogue » | Menu créé par défaut par Shopify | Étape 7 : modifie le menu principal |
| Une section de l'accueil est vide (dans l'éditeur : « choisis une collection… ») | Collection absente, vide, ou adresse différente | Étape 5 : vérifie l'adresse de la collection et que les produits sont **actifs** |
| La boutique en ligne ne montre aucun produit | Les produits sont en brouillon | Passe-les en **Actif** |
| Le tableau des remises n'apparaît pas | Metafield vide, ou JSON mal écrit, ou un seul palier | Recopie exactement l'exemple JSON ; il faut au moins 2 paliers |
| La remise s'affiche sur la fiche mais pas au panier | Réduction automatique non créée, ou paliers différents | Étape 10 |
| Les filtres « Matériau » ou « Usage » n'apparaissent pas | Filtres non ajoutés dans Search & Discovery, ou option de filtrage non activée sur le metafield | Étapes 3 et 7 |
| Un filtre propose « Bois » et « bois » | Valeurs saisies différemment | Harmonise les valeurs (étape 3) |
| Le prix HT a 1 centime d'écart avec la facture | Arrondi du calcul TTC ÷ 1,20 | Normal : la facture fait foi. La mention sous le récapitulatif du panier le précise |
| Shopify Payments bloque ou retient le paiement d'une grosse commande | Contrôle anti-fraude normal pour une boutique récente et des montants élevés | Garde le virement bancaire actif ; pour un pack, propose le virement au téléphone |
| Le compte client affiche une page vide | Anciens comptes clients sélectionnés | Étape 11 : choisis les nouveaux comptes clients |
| L'import CSV signale une erreur de colonne | Format de colonnes modifié par Shopify | Télécharge le modèle CSV de Shopify depuis la fenêtre d'import et recopie les valeurs |

---

## Ce que le thème fait, et ce qu'il ne fait pas

**Fait** : prix TTC et HT partout (fiche, cartes, panier) ; tableau des remises par quantité avec prix unitaire HT ; badge de délai ; caractéristiques techniques masquées si vides ; filtres et tri des collections ; panier avec récapitulatif HT / TVA / TTC, remises visibles, rappel du délai et de la garantie, une seule suggestion d'accessoire (à choisir dans Personnaliser → Panier) ; formulaire de contact Shopify ; FAQ avec données structurées pour Google ; page d'accueil entièrement modifiable et réordonnable ; mobile d'abord ; navigation au clavier et respect du réglage « réduire les animations ».

**Ne fait pas, volontairement** :
- aucun faux avis, aucune fausse note, aucun logo client inventé : la section « Avis clients » reste invisible tant que tu n'ajoutes pas de vrais avis ;
- aucun compteur de stock, aucun minuteur, aucune fausse urgence ;
- **aucun prix barré** : en France, un prix barré doit être le prix le plus bas pratiqué dans les 30 jours précédents. Le thème ne l'affiche donc jamais, même si tu remplis « Prix avant réduction » ;
- aucun lien vers un autre site sur la fiche produit.

---

## Avant d'ouvrir : 4 points business à ne pas négliger

1. **« Jusqu'à 30 % moins cher »** : c'est une publicité comparative. Garde une preuve écrite (tarifs publics datés des marques comparables, modèle par modèle) et complète la date de la mention. Sans preuve, vide le champ « Promesse d'économie » : la phrase disparaît du site.
2. **Livraison et montage inclus** : fais chiffrer par un transporteur spécialisé (livraison avec montage) le coût réel d'un reformer, d'un Cadillac et d'un pack de 900 kg, y compris en étage et en Corse, **avant** de fixer tes prix définitifs. C'est le poste qui peut faire disparaître ta marge.
3. **Pièces en stock en France** : ne coche la case qu'une fois le stock réellement en France. En attendant, le site dit « Pièces de rechange disponibles et garanties », ce qui t'engage quand même à pouvoir fournir les pièces.
4. **Délais usine** : un délai annoncé de 6 à 8 semaines et non tenu, c'est un client particulier qui peut annuler, et un studio qui ne peut pas ouvrir à la date prévue. Annonce le délai le plus long réaliste.
