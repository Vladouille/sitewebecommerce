# PRINVLA : prompts pour faire générer le site par l'IA de Shopify

**Mode d'emploi**
1. Dans Shopify : **Contenu → Fichiers → Importer** les 3 images fournies : `pince-hero.webp` (la pince, fond transparent), `camp-kaki.webp` et `camp-bordeaux.webp`.
2. Ouvre **Personnaliser** le thème (de préférence un thème récent comme **Horizon**, qui sait générer des sections avec l'IA), page **Accueil**.
3. Envoie d'abord le **prompt 0**, puis **un prompt par section**, dans l'ordre. Après chaque génération, vérifie le rendu sur mobile avant de passer au suivant.
4. Si l'IA modifie un texte, renvoie-lui : « Remets les textes exactement comme dans ma demande, mot pour mot. »

> L'IA ne peut pas reproduire la pince 3D qui se ferme au scroll : elle sera remplacée par l'image `pince-hero.webp`, qui flotte doucement. Pour avoir la 3D exacte, il faut installer le fichier `prinvla-landing.liquid` (voir `INSTRUCTIONS-IA-SHOPIFY.md`).

---

## Prompt 0 — La charte (à envoyer en premier)

```
Je vais te demander de créer plusieurs sections pour la page d'accueil de ma boutique PRINVLA (pince à boules de neige imprimée en 3D en France). Applique cette charte à TOUTES les sections que je te demanderai, sans exception :

AMBIANCE : « laboratoire du froid », sombre, futuriste, épurée.
COULEURS : fond de page #05070B (presque noir bleuté) ; cartes #0A0F17 ; bordures fines rgba(159,232,255,0.14) ; texte principal #EEF2F5 ; texte secondaire #A6B2BF ; couleur d'accent bleu glacier #9FE8FF ; kaki #5B6B3F (texte kaki clair #B9C893) ; bordeaux #7A1F2B (texte bordeaux clair #F2949F). Aucune autre couleur.
TYPOGRAPHIE : titres en Space Grotesk gras (700), interlettrage -0,02em, interligne 1,0 ; texte en Inter normal 16 px, interligne 1,6. Petits sur-titres en Space Grotesk 12 px, capitales, interlettrage 0,16em, couleur #9FE8FF.
BOUTONS : forme pilule (coins entièrement arrondis), hauteur 56 px, texte Space Grotesk gras. Bouton principal : fond #9FE8FF, texte #05070B, légère lueur bleu glacier autour. Bouton secondaire : fond transparent, contour blanc à 30 % d'opacité, texte #EEF2F5 ; au survol, contour et texte en #9FE8FF.
MISE EN PAGE : largeur de contenu maximale 1180 px, marges latérales de 16 px sur mobile à 48 px sur ordinateur, beaucoup d'espace vertical entre les sections (64 px sur mobile, 130 px sur ordinateur). Coins des cartes arrondis à 18–22 px.
MOBILE D'ABORD : la majorité des visiteurs arrivent de TikTok sur téléphone. Tout doit être parfait à 390 px de large, sans défilement horizontal.
ANIMATIONS : légères, à l'apparition au défilement uniquement, et désactivées si le visiteur a activé « réduire les animations ».
INTERDITS : aucun avis client inventé, aucune note, aucun nombre de clients, aucun prix barré ni pourcentage de réduction, aucun compte à rebours, aucune image d'enfant, aucune promesse de remplacement gratuit si la pince casse. Les textes que je te donne entre guillemets doivent être repris mot pour mot.

Réponds seulement « Charte enregistrée » ; je t'envoie ensuite les sections une par une.
```

---

## Prompt 1 — Hero

```
Crée la section « Hero » en appliquant la charte PRINVLA.

Disposition : sur ordinateur, deux colonnes (texte à gauche, image à droite, centrées verticalement, hauteur d'écran). Sur mobile, le texte puis l'image en dessous.

Colonne texte, dans cet ordre :
- Sur-titre : « PRINVLA — LA PINCE À BOULES DE NEIGE »
- Titre H1, très grand (environ 70 px sur ordinateur, 38 px sur mobile), sur 4 lignes : « Des boules parfaites en 2 secondes. » en blanc, puis « Zéro main gelée. » en #9FE8FF.
- Sous-titre en #A6B2BF, 17 px : « Imprimée en France, en PETG qui ne casse pas au froid. Tu plonges, tu serres, tu lances. »
- Bouton principal : « Je prends le Duo — 19,90 € ». Au clic, il fait défiler la page en douceur jusqu'à la section des prix. Pleine largeur sur mobile.

Colonne image : l'image « pince-hero.webp » (fond transparent), posée sur un halo circulaire bleu glacier très diffus (dégradé radial de rgba(159,232,255,0.22) vers transparent). L'image flotte doucement de haut en bas (10 px, cycle de 5 secondes).

Fond de section : #05070B avec de petits flocons blancs (points de 1 à 3 px, opacité 20 à 70 %) qui tombent lentement en continu sur toute la section. Les flocons s'écartent légèrement du curseur de la souris. Au maximum 200 flocons sur mobile.
```

---

## Prompt 2 — Zéro bullshit

```
Crée la section « Zéro bullshit » en appliquant la charte PRINVLA.

Titre H2 (environ 56 px ordinateur, 32 px mobile) : « Zéro bullshit. »

En dessous, une liste de 6 lignes séparées par des filets horizontaux fins (rgba(159,232,255,0.14)). Chaque ligne contient deux textes :
- à gauche (au-dessus sur mobile), le texte NÉGATIF en #A6B2BF, 20 px, BARRÉ par un trait rouge #FF6B7A de 2 px ;
- à droite (en dessous sur mobile), le texte POSITIF en #9FE8FF, Space Grotesk gras, environ 40 px sur ordinateur et 24 px sur mobile.

Les 6 lignes, dans l'ordre (négatif → positif) :
1. « Mains gelées » → « Gants au sec »
2. « Boules qui s'effritent » → « Sphères compactes de 6 cm »
3. « Plastique qui casse au premier gel » → « PETG résistant au froid »
4. « Fabriquée à l'autre bout du monde » → « Imprimée en France, pièce par pièce »
5. « Livrée quand la neige a fondu » → « Expédiée sous 48 h »
6. « Pince qui reste coincée » → « Se rouvre toute seule »

Animation, ligne par ligne quand elle apparaît à l'écran : le texte négatif apparaît, puis le trait rouge se dessine de gauche à droite pour le barrer (0,45 s), puis le texte positif glisse vers le haut en apparaissant (0,6 s). Sans animation, les textes sont affichés directement barrés.
```

---

## Prompt 3 — Comment ça marche

```
Crée la section « Comment ça marche » en appliquant la charte PRINVLA.

Titre H2 : « Comment ça marche »

Trois cartes (fond #0A0F17, bordure fine, coins arrondis 18 px), côte à côte sur ordinateur et empilées sur mobile. Chaque carte contient une petite icône animée simple, un numéro dans un petit cercle bordé de #9FE8FF, un titre en Space Grotesk gras 28 px et une phrase en #A6B2BF :
1. Icône : une pince kaki qui plonge dans un tas de neige blanc et remonte en boucle. Titre « Plonge. » — Texte « Ouvre la pince dans la neige. »
2. Icône : deux demi-cercles, un kaki en haut et un bordeaux en bas, qui se referment sur une boule blanche en boucle. Titre « Serre. » — Texte « Une pression : la boule est compactée. »
3. Icône : une boule blanche lancée qui suit une trajectoire en arc, en pointillés #9FE8FF, en boucle. Titre « Lance. » — Texte « Elle sort toute seule. Recommence. »
```

---

## Prompt 4 — Deux camps

```
Crée la section « Deux camps » en appliquant la charte PRINVLA. Tout est centré.

Titre H2 : « Kaki contre Bordeaux. Choisis ton camp. »
Texte en #A6B2BF, 18 px : « Le Duo, c'est une pince par équipe. La bataille commence à armes égales. »

En dessous, sur une seule ligne même sur mobile (largeur maximale 880 px) : deux cartes carrées de même taille, séparées par un petit cercle central bordé de #9FE8FF contenant « VS » en Space Grotesk gras #9FE8FF.
- Carte gauche : bordure kaki, fond en dégradé kaki très sombre (kaki à 45 % d'opacité en haut, presque transparent en bas). Image « camp-kaki.webp ». Légende en capitales « KAKI », couleur #B9C893.
- Carte droite : bordure bordeaux, fond en dégradé bordeaux très sombre. Image « camp-bordeaux.webp ». Légende « BORDEAUX », couleur #F2949F.

Animation à l'apparition : la carte kaki glisse depuis la gauche, la carte bordeaux depuis la droite, puis le cercle « VS » apparaît en tournant. Au survol, l'image grossit légèrement. Aucun débordement horizontal sur mobile.
```

---

## Prompt 5 — Prix

```
Crée la section « Prix » en appliquant la charte PRINVLA. C'est la section qui vend : soigne-la. Elle doit pouvoir être la cible du bouton « Je prends le Duo » du hero.

Titre H2 centré : « Choisis ton pack »
Sous le titre, centré, en #A6B2BF : « Il reste [STOCK] pinces sur 25 dans le Drop #1 », où [STOCK] est le stock réel du produit « Pince » (somme des stocks de ses variantes), en gras blanc. Le chiffre défile de 0 à sa valeur quand il apparaît à l'écran. En dessous, une fine barre de progression #9FE8FF qui représente [STOCK] / 25.

Trois cartes de prix (sur ordinateur : Solo à gauche, Duo au centre, Clan à droite ; sur mobile : Duo en premier). Chaque carte a un fond sombre semi-transparent avec effet de verre givré (flou d'arrière-plan), une bordure fine bleu glacier et des coins arrondis à 22 px. Les prix viennent des produits Shopify choisis dans les réglages de la section (un sélecteur de produit par carte).
- SOLO : nom « SOLO », description « 1 pince », prix du produit Pince (12,90 €). Deux boutons-pastilles pour choisir la couleur, « Kaki » et « Bordeaux » (les variantes du produit). Bouton secondaire « Je prends le Solo ».
- DUO, mise en avant : légèrement plus haute que les autres, bordure #9FE8FF pleine avec une lueur bleu glacier. Badge en haut à gauche, fond #9FE8FF, texte #05070B, capitales : « Recommandé ». Nom « DUO « BATAILLE » », description « 2 pinces, kaki + bordeaux », prix 19,90 €, sous le prix « soit 9,95 € la pince ». Bouton principal « Je prends le Duo ».
- CLAN : badge sombre bordé de bleu glacier « Livraison offerte ». Nom « CLAN », description « 4 pinces (2 de chaque couleur) », prix 34,90 €, sous le prix « soit 8,73 € la pince ». Bouton secondaire « Je prends le Clan ».
Prix en Space Grotesk gras, environ 42 px.

Chaque bouton ajoute le produit (ou la variante de couleur choisie) au panier et envoie directement au paiement. Si un produit est épuisé, son bouton devient « Rejoindre la liste du Drop #2 » et renvoie vers un lien réglable dans la section.

Sous les cartes, centré, en #A6B2BF : « Livraison en point relais : 3,90 € · Retour sous 14 jours · Paiement sécurisé »
```

---

## Prompt 6 — Cadeau

```
Crée la section « Cadeau » en appliquant la charte PRINVLA.

Un seul bloc horizontal pleine largeur (1180 px maximum), coins arrondis à 24 px, bordure bordeaux #7A1F2B, fond en dégradé diagonal du bordeaux (35 % d'opacité) vers le kaki (18 % d'opacité). À gauche, une icône de paquet cadeau dessinée au trait #F2949F. À droite, le texte en 22 px : « Le cadeau à moins de 20 € qu'on utilise vraiment. » en gras Space Grotesk, suivi de « À glisser sous le sapin ou dans la valise du ski. » en normal.
```

---

## Prompt 7 — FAQ

```
Crée la section « FAQ » en appliquant la charte PRINVLA.

Titre H2 : « Questions »

Un accordéon accessible au clavier : questions séparées par des filets fins, en Space Grotesk 20 px ; à droite de chaque question, un « + » en #9FE8FF qui tourne en « × » à l'ouverture. Réponses en #A6B2BF. Une seule ligne par question, dans cet ordre :
1. « Quelle taille font les boules ? » → « 6 cm de diamètre. »
2. « Ça marche avec toute la neige ? » → « Avec la neige humide et collante, parfaitement. La poudreuse très sèche ne tient pas, même à la main. »
3. « À partir de quel âge ? » → « Conçue pour les 14 ans et plus. »
4. « Quand est-ce que je la reçois ? » → « Expédiée sous 48 h en point relais, généralement reçue en 2 à 4 jours. »
5. « Pourquoi l'impression 3D ? » → « Chaque pince est fabriquée en France, à la demande, dans un plastique choisi pour le froid. Pas de stock qui dort, pas de bateau. »
```

---

## Prompt 8 — Appel final

```
Crée la section « Appel final » en appliquant la charte PRINVLA. Tout est centré, avec beaucoup d'espace au-dessus et en dessous.

Titre H2 géant (environ 96 px sur ordinateur, 40 px sur mobile, sur 2 ou 3 lignes) : « La prochaine neige n'attend pas. »
En dessous, un grand bouton principal (hauteur 64 px) : « Je prends le Duo — 19,90 € », qui fait défiler la page jusqu'à la section des prix.
En dessous, en petit (13 px) et en #A6B2BF : « Usage à partir de 14 ans. Ne vise pas le visage. Ne compacte ni glace ni cailloux. Fabricant : [NOM], [ADRESSE]. » (je remplacerai [NOM] et [ADRESSE]).
```

---

## Prompt 9 — Barre d'achat mobile (optionnel, fortement conseillé)

```
Ajoute, uniquement sur mobile, une barre d'achat flottante en bas de l'écran, en appliquant la charte PRINVLA : forme pilule, fond #0A0F17 à 88 % d'opacité avec flou d'arrière-plan, bordure fine bleu glacier, à 10 px des bords. Elle contient un bouton principal pleine largeur « Je prends le Duo — 19,90 € » qui fait défiler jusqu'aux prix. Elle n'apparaît que lorsque le bouton du hero n'est plus visible, et disparaît quand la section des prix ou l'appel final sont à l'écran.
```

---

## Réglages à faire à la main ensuite

- **Thème → Couleurs** : en-tête et pied de page sur fond **#05070B**, texte **#EEF2F5**.
- **Barre d'annonce** : la désactiver.
- **Logo** : texte « PRINVLA ».
- Masque les autres sections de la page d'accueil.
- Les étapes produits, packs, livraison et pages légales sont dans `INSTRUCTIONS-IA-SHOPIFY.md` (étapes 1, 2, 3 et 6).
