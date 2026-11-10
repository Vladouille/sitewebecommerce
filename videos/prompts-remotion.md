# Série Autoflow : 10 prompts Remotion (12 s, 1080×1920, 30 fps)

À coller dans Claude Code, dans l'ordre : **le prompt 0 une seule fois** (il installe le socle commun), puis un prompt par vidéo.
Chaque vidéo dure 360 frames. Rien n'est filmé, tout est dessiné.

Rotation sur dix (règle du compte) : 4 audits, 3 démontages de croyance, 2 calculs, 1 offre. L'offre passe en dernier, une fois la croyance installée.
Les prompts marqués ◆ (J04, J07, J10) testent la grammaire billes / alvéoles / laiton, toujours après la bascule 3D.

| Vidéo | Angle | Hook (objet) | Familles | Bascule | Mot-clé |
|---|---|---|---|---|---|
| J01 | Audit | Bulle + horodatage 23:41 | Bulle, Compteur | Carte Y | DELAI |
| J02 | Croyance | Liste de DM, 240 demandes | Liste, Remplissage | Poussée Z | DEMANDES |
| J03 | Audit | Bulle « C'est combien ? » | Bulle, Biffure | Carte Y | PRIX |
| J04 ◆ | Calcul | Boîte de réception, compteur | Compteur, Billes | Carte Y | CALCUL |
| J05 | Croyance | Agenda vide | Compteur, Remplissage | Carte Y | SEMAINE |
| J06 | Audit | Créneau d'agenda 18:00 | Remplissage, Biffure | Poussée Z | RAPPEL |
| J07 ◆ | Calcul | Bulle à 02:14 | Bulle, Billes | Carte Y | NUIT |
| J08 | Croyance | Liste de DM « programme gratuit » | Liste, Biffure | Poussée Z | LISTE |
| J09 | Audit | Bulle « Vu », jours qui passent | Bulle, Compteur | Carte Y | RELANCE |
| J10 ◆ | Offre | Bulle 23:41, conversation complète | Bulle, Billes | Carte Y | AGENDA |

---

## Prompt 0 — Socle commun (à coller une seule fois)

```
Crée (ou complète) un projet Remotion en TypeScript dans le dossier videos/remotion.
Il servira à une série de vidéos verticales pour Autoflow, un service qui transforme
les messages Instagram des coachs en appels de vente. Chaque vidéo : 1080×1920, 30 fps,
360 frames (12 s). Tout est dessiné, aucune vidéo ni photo.

1. COMPOSITIONS
- Une composition par vidéo, id "J01" à "J10", enregistrées dans src/Root.tsx.
- Un dossier src/videos/ avec un fichier par vidéo (J01.tsx…).
- Un fichier src/timeline.ts avec les repères communs :
  HOOK = [0, 89], CORPS = [90, 239] avec un changement à 90, 150 et 210,
  BASCULE = [240, 253] (14 frames), CORRECTION = [254, 299], CTA = [300, 359].

2. IDENTITÉ (dérivée du logo AUTOFLOW, monochrome, sobre, éditorial)
- Couleurs dans src/theme.ts :
  encre #0A0A0A, blanc #FFFFFF, fond UI #F4F4F2, gris texte #8A8A8A,
  lignes #DADAD6, laiton #B08D57.
  Le laiton est réservé aux séquences billes (vidéos ◆), après la bascule. Jamais ailleurs.
- Typographies via @remotion/google-fonts : "Libre Caslon Text" (serif, titres et
  mot-clé du CTA) et "Inter" (texte d'interface, bulles, horodatages).
- Motif : le petit triangle plein du logo (▲ dessiné en SVG), utilisé comme puce ou
  coche discrète. Pas de dégradé décoratif, pas d'ombre grise sous des cartes
  arrondies identiques, pas de photo de corps, pas de flèche.

3. ZONES DE SÉCURITÉ
- Rien d'important dans les 12 % du haut (y < 231) ni les 20 % du bas (y > 1536).
- Marges latérales de 64 px. Crée un composant <SafeArea> qui contraint le contenu
  à x 64→1016, y 231→1536, et un overlay de debug (prop showSafeZones) qui hachure
  les zones interdites.

4. COMPOSANTS D'ÉCRAN (interfaces de téléphone dessinées, sans marque Instagram)
- <DMList rows> : liste de conversations. Chaque rangée = disque d'avatar gris,
  une ligne d'aperçu (texte ou barre grise), un horodatage à droite, point noir si non lu.
- <Bubble side="prospect|coach" text time> : prospect à gauche (fond #EFEFEC, texte encre),
  coach/assistant à droite (fond encre, texte blanc). Rayon 36 px, Inter 44 px.
- <Skeleton> : barre grise arrondie sans texte. Une bulle ancienne devient un Skeleton
  (fondu du texte en 6 frames) : c'est ce qui permet de rester sous six mots.
- <Typing> : trois points dans une bulle prospect ou coach.
- <Timestamp value> : horodatage Inter 30 px, gris.
- <Agenda days slots> : grille de semaine (5 colonnes), créneaux vides = contour #DADAD6,
  créneaux pleins = encre.
- <DemoLabel> : le mot « démonstration », Inter 24 px, #8A8A8A, aligné à droite,
  x = 1016, y = 1500. Affiché dès qu'un écran montre des données (chiffres, horaires,
  prix, conversations). Il ne compte pas dans la limite de six mots.
- <CTAFrame keyword> : plan fixe. Un champ « commentaire » dessiné (disque d'avatar +
  rectangle arrondi #F4F4F2), dedans le mot-clé en Libre Caslon Text capitales 140 px,
  encre, suivi du ▲. Aucun autre texte. Centré verticalement autour de y = 880.

5. TRANSITIONS 3D (une seule par vidéo, à la frame 240, jamais pendant le hook ni le CTA)
- <CardFlipY front back> : perspective 1200 px, rotateY 0→180° de la frame 240 à 253,
  Easing.inOut(Easing.cubic), backfaceVisibility hidden. Face avant = le problème,
  face arrière = la correction.
- <DepthPushZ from to> : perspective 1200 px, l'ancien calque recule (translateZ 0→-800,
  opacité 1→0), le nouveau arrive (translateZ 400→0, opacité 0→1), frames 240 à 253.

6. FAMILLES D'ANIMATION (chaque vidéo en utilise deux au maximum, hors transition 3D)
- BULLE : entrée d'une bulle ou d'une rangée (spring damping 200, translateY 24→0,
  opacité 0→1, 8 frames), indicateur <Typing>, passage d'une bulle en Skeleton.
- COMPTEUR : nombre ou horodatage qui défile (interpolate + Math.round), clampé.
- BIFFURE : trait encre de 6 px qui se dessine (scaleX 0→1 depuis la gauche, 10 frames)
  sur un élément, puis l'élément passe à 40 % d'opacité.
- LISTE : défilement vertical d'une <DMList> (translateY avec Easing.out(Easing.quad)),
  arrêt net sur une rangée, réordonnancement de rangées.
- REMPLISSAGE : un créneau ou une case passe du contour au plein (fond 0→100 %,
  de bas en haut, 8 frames).
- BILLES (◆ seulement) : un plateau en laiton (#B08D57, rainures #8C6E40) percé
  d'alvéoles circulaires ; des billes blanches (dégradé radial #FFFFFF→#BDBDBD, c'est le
  seul dégradé autorisé, il donne le volume) tombent dans les alvéoles avec un spring
  (damping 12, petit rebond), une bille toutes les 3 à 4 frames.
- Toutes les animations respectent un flag global reducedMotion (props) qui remplace
  les mouvements par des coupes franches, pour les exports accessibles.

7. RÈGLES À FAIRE RESPECTER PAR CONSTRUCTION
- Six mots maximum visibles en même temps (bulles, horodatages et mots-clés compris,
  DemoLabel exclu). Écris une fonction utilitaire countVisibleWords(frame) par vidéo
  et un test qui vérifie la règle frame par frame.
- Pas de sous-titres : le texte écrit ne reprend jamais la voix off.
- Le CTA (frames 300 à 359) est une coupe franche vers <CTAFrame>, sans aucun mouvement,
  ni fondu, ni pulsation.
- La voix off est un fichier audio séparé (public/voix/JXX.mp3). Ajoute un <Audio>
  optionnel : si le fichier n'existe pas, la vidéo se rend sans son.

8. Ajoute un script npm "render:all" qui rend J01 à J10 en MP4 (H.264, CRF 18) dans
   videos/out/. Ne rends rien maintenant : construis le socle, vérifie qu'il compile
   (npx tsc --noEmit) et montre-moi un still de chaque composant à la frame 0 avec
   showSafeZones activé.
```

---

## J01 — Le délai (audit)

```
Avec le socle Remotion déjà en place, crée la composition J01 (360 frames).
Sujet : le prospect écrit tard le soir, le coach répond au réveil, le prospect est parti.
Familles d'animation : BULLE et COMPTEUR uniquement. Transition : CardFlipY à 240.
DemoLabel visible de la frame 0 à 299.

HOOK (0–89)
- Fond blanc. Bulle prospect « C'est combien ton coaching ? », horodatage « 23:41 »
  au-dessus. Elle entre à la frame 0 (BULLE), puis <Typing> côté coach de 40 à 89.

CORPS (90–239)
- 90 : <Typing> disparaît. L'horodatage défile de 23:41 à 05:41 (COMPTEUR, heures
  puis minutes) jusqu'à 145.
- 150 : la bulle prospect devient Skeleton. Bulle coach « Hello ! C'est 1 200 €. »,
  horodatage « 05:41 ».
- 210 : la bulle coach devient Skeleton. Bulle prospect « C'est bon, j'ai trouvé. »,
  horodatage « 05:52 ».

BASCULE (240–253) : CardFlipY. Face avant = l'écran à 239.
CORRECTION (254–299), face arrière :
- Skeleton prospect (la question d'origine), horodatage « 23:41 », bulle coach
  « Ton objectif, d'abord ? » déjà posée.
- 270 : la bulle coach devient Skeleton, bulle prospect « Perdre 10 kilos. »,
  horodatage « 23:42 ».

CTA (300–359) : CTAFrame keyword="DELAI".

Voix off (public/voix/J01.mp3, environ 30 mots, ne pas l'afficher) :
« Il t'écrit tard le soir. Tu lui réponds au réveil, entre deux séances. Il ne t'a pas
ghosté : il a attendu, puis il a signé ailleurs. Commente le mot à l'écran, je t'envoie
mon message d'ouverture en privé. »

Vérifie avec countVisibleWords que la règle des six mots tient sur les 360 frames,
puis rends trois stills : frames 45, 220, 280.
```

---

## J02 — Ce n'est pas un problème d'audience (croyance)

```
Avec le socle Remotion déjà en place, crée la composition J02 (360 frames).
Sujet : le coach croit manquer d'abonnés alors que sa boîte déborde de demandes.
Familles d'animation : LISTE et REMPLISSAGE uniquement. Transition : DepthPushZ à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- <DMList> plein écran, en-tête « 240 demandes en attente ». Les rangées sont des
  Skeletons avec point noir non lu. La liste défile lentement vers le haut (LISTE).

CORPS (90–239)
- 90 : le défilement accélère puis s'arrête net sur une rangée (LISTE).
- 150 : cette rangée seule devient lisible : « Je veux commencer lundi », horodatage « 3 j ».
  L'en-tête disparaît pour rester sous six mots.
- 210 : la rangée redevient Skeleton, la liste avance d'un cran (LISTE) et s'arrête sur
  « Dispo pour un appel ? », horodatage « 5 j ».

BASCULE (240–253) : DepthPushZ. La boîte de réception recule, un <Agenda> de semaine arrive.
CORRECTION (254–299)
- Agenda vide, puis trois créneaux se remplissent l'un après l'autre (REMPLISSAGE,
  à 256, 268, 280). Chaque créneau plein porte « Appel ». En-tête : aucun.

CTA (300–359) : CTAFrame keyword="DEMANDES".

Voix off (environ 32 mots) :
« Tu penses qu'il te faut plus d'abonnés. Ouvre ta boîte : des gens prêts à démarrer
attendent depuis des jours. Ton prochain client t'a déjà écrit. Commente le mot à
l'écran, je t'envoie comment les trier en privé. »

Vérifie la règle des six mots, puis rends trois stills : frames 45, 170, 290.
```

---

## J03 — La réponse au prix (audit)

```
Avec le socle Remotion déjà en place, crée la composition J03 (360 frames).
Sujet : répondre le prix seul, sans connaître l'objectif, tue la conversation.
Familles d'animation : BULLE et BIFFURE uniquement. Transition : CardFlipY à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- Bulle prospect « C'est combien ? » en grand (Inter 64 px pour celle-ci),
  horodatage « 14:02 ». Entrée BULLE à 0, <Typing> côté coach de 50 à 89.

CORPS (90–239)
- 90 : bulle coach « 1 200 €. », horodatage « 14:07 ».
- 150 : la bulle prospect devient Skeleton, l'horodatage disparaît. Une BIFFURE
  traverse la bulle coach. Sous elle, en Libre Caslon Text italique 48 px :
  « Prix sans repère ».
- 210 : la bulle coach et la phrase deviennent Skeleton. Bulle prospect « Ok, merci. »,
  horodatage « 14:09 ».

BASCULE (240–253) : CardFlipY.
CORRECTION (254–299), face arrière :
- Skeleton prospect, puis bulle coach « Ton objectif, d'abord ? » (déjà posée).
- 272 : la bulle coach devient Skeleton, bulle prospect « Perdre 10 kilos avant l'été. »

CTA (300–359) : CTAFrame keyword="PRIX".

Voix off (environ 32 mots) :
« Il demande le prix. Tu donnes un chiffre. Sans repère, il le compare au programme à
trente euros vu hier. Demande son objectif avant. Commente le mot à l'écran, je t'envoie
la phrase exacte en privé. »

Vérifie la règle des six mots, puis rends trois stills : frames 60, 170, 285.
```

---

## J04 ◆ — Ce que coûtent les messages sans réponse (calcul)

```
Avec le socle Remotion déjà en place, crée la composition J04 (360 frames).
Sujet : poser en ordre de grandeur les appels perdus par les messages jamais traités.
Les chiffres sont un exemple construit, pas un résultat client : DemoLabel visible
de 0 à 299, et le mot « estimation » apparaît à l'écran à partir de 210.
Familles d'animation : COMPTEUR et BILLES uniquement. Transition : CardFlipY à 240.

HOOK (0–89)
- Haut d'une boîte de réception dessinée : trois rangées Skeleton non lues, et au-dessus
  un compteur en Libre Caslon Text 220 px qui monte de 0 à 300 (COMPTEUR, 0→75).
  Sous le compteur : « messages ce mois ».

CORPS (90–239)
- 90 : le compteur se transforme en « 40 % » (COMPTEUR 0→40), légende « sans réponse ».
- 150 : le compteur passe à « 120 » (COMPTEUR), légende « sans réponse ».
- 210 : le compteur passe à « ≈ 12 » (COMPTEUR 120→12), légende « appels, estimation ».

BASCULE (240–253) : CardFlipY.
CORRECTION (254–299), face arrière, récompense ◆ :
- Plateau en laiton avec 12 alvéoles (3 rangées de 4), centré dans la SafeArea.
- 12 billes tombent une à une dans les alvéoles (BILLES, une toutes les 3 frames à partir
  de 256, dernière posée vers 292).
- Au-dessus du plateau, Inter 40 px : « Ce qu'une réponse rattrape ».

CTA (300–359) : CTAFrame keyword="CALCUL" (pas de laiton dans le CTA).

Voix off (environ 34 mots, ne lit jamais les chiffres affichés) :
« Prends ta boîte du mois. Compte ceux à qui tu n'as jamais répondu. Suppose qu'un sur
dix voulait vraiment un appel. Ce n'est pas une promesse, c'est un ordre de grandeur.
Commente le mot à l'écran, je t'envoie la grille. »

Vérifie la règle des six mots, puis rends trois stills : frames 70, 220, 295.
```

---

## J05 — Publier plus ne remplit pas l'agenda (croyance)

```
Avec le socle Remotion déjà en place, crée la composition J05 (360 frames).
Sujet : le contenu génère des messages, mais la semaine reste vide.
Familles d'animation : COMPTEUR et REMPLISSAGE uniquement. Transition : CardFlipY à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- <Agenda> de semaine, cinq colonnes, tous les créneaux vides (contours).
  En-tête au-dessus : « 0 appel cette semaine ».
  Le chiffre « 0 » reste fixe ; seule l'aiguille d'une petite horloge dessinée
  (sans chiffres) tourne pendant le hook (COMPTEUR, rotation continue).

CORPS (90–239)
- 90 : une pastille de notification noire apparaît à côté de l'en-tête :
  « +38 messages » (COMPTEUR 0→38).
- 150 : la pastille passe à « +112 messages » (COMPTEUR).
- 210 : la pastille passe à « +204 messages » (COMPTEUR). L'agenda reste vide.

BASCULE (240–253) : CardFlipY.
CORRECTION (254–299), face arrière :
- Le même agenda. Quatre créneaux se remplissent (REMPLISSAGE à 256, 266, 276, 286).
  En-tête : « 4 appels ». Pas de pastille.

CTA (300–359) : CTAFrame keyword="SEMAINE".

Voix off (environ 33 mots) :
« Tu publies tous les jours. Les vues montent, ta boîte se remplit, et ta semaine reste
vide. Ton contenu fait son travail. C'est après le premier échange que ça casse.
Commente le mot à l'écran, je t'envoie les trois questions à poser. »

Vérifie la règle des six mots, puis rends trois stills : frames 45, 220, 295.
```

---

## J06 — Le rendez-vous oublié (audit)

```
Avec le socle Remotion déjà en place, crée la composition J06 (360 frames).
Sujet : un appel réservé, personne ne relance, le prospect ne vient pas.
Familles d'animation : REMPLISSAGE et BIFFURE uniquement. Transition : DepthPushZ à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- Gros plan sur un créneau d'agenda dessiné (carte pleine largeur de la SafeArea) :
  « Appel · Julien · 18:00 ». Une barre de progression fine sous la carte se remplit
  de gauche à droite pendant tout le hook (REMPLISSAGE), comme le temps qui approche.

CORPS (90–239)
- 90 : sur la carte, une ligne grise s'ajoute : « En attente ».
- 150 : « En attente » disparaît. BIFFURE sur « Appel · Julien · 18:00 ».
- 210 : la carte passe en gris 40 %, une étiquette encre « Absent » apparaît à droite.

BASCULE (240–253) : DepthPushZ. La carte barrée recule, une nouvelle carte arrive.
CORRECTION (254–299)
- Nouvelle carte « Appel 18:00 » avec deux lignes dessous : « Rappel J-1 » et « Rappel H-2 ».
- 258 et 272 : chaque ligne reçoit un ▲ plein qui se remplit (REMPLISSAGE).
- 286 : la carte passe en encre pleine (REMPLISSAGE).

CTA (300–359) : CTAFrame keyword="RAPPEL".

Voix off (environ 33 mots) :
« Il a réservé lundi. Jeudi, il avait oublié. Personne ne lui a écrit entre les deux.
Un message la veille, un autre deux heures avant, et il a une raison de venir, ou de
prévenir. Commente le mot à l'écran, je t'envoie les deux messages. »

Vérifie la règle des six mots, puis rends trois stills : frames 45, 220, 295.
```

---

## J07 ◆ — Tes prospects écrivent la nuit (calcul)

```
Avec le socle Remotion déjà en place, crée la composition J07 (360 frames).
Sujet : une part des messages arrive quand personne ne répond ; le coach peut la compter.
Familles d'animation : BULLE et BILLES uniquement. Transition : CardFlipY à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- Fond encre (écran de nuit), bulles inversées pour cette vidéo : prospect en #2A2A2A
  texte blanc. Bulle prospect « Tu prends encore des clients ? », horodatage « 02:14 ».
  Entrée BULLE à 0.

CORPS (90–239)
- 90 : la bulle devient Skeleton, bulle prospect « Je suis motivé. », horodatage « 02:16 ».
- 150 : la bulle devient Skeleton. Bulle coach « Hello, désolé du retard ! »,
  horodatage « 09:32 ».
- 210 : tout passe en Skeleton. Trois rangées de <DMList> entrent (BULLE, décalées de
  4 frames), sans texte, avec seulement leurs horodatages : « 23:12 », « 01:40 », « 06:05 ».

BASCULE (240–253) : CardFlipY. Le fond devient blanc sur la face arrière.
CORRECTION (254–299), récompense ◆ :
- Plateau en laiton à 24 alvéoles en arc de cercle (une par heure), sans repère écrit ;
  les alvéoles des heures de nuit (21 h à 7 h) ont une rainure plus sombre.
- Une bille tombe dans chaque alvéole, de minuit à minuit, une toutes les 1,5 frame
  environ (BILLES), y compris dans les heures de nuit.
- Au-dessus, Inter 40 px : « Réponse à toute heure ».

CTA (300–359) : CTAFrame keyword="NUIT", fond blanc.

Voix off (environ 34 mots) :
« Ton setter s'arrête à dix-neuf heures. Tes prospects, eux, scrollent après minuit.
Le matin, il répond à des gens passés à autre chose. Compte tes messages arrivés de nuit
ce mois-ci. Commente le mot à l'écran, je t'envoie la méthode. »

Vérifie la règle des six mots, puis rends trois stills : frames 45, 225, 295.
```

---

## J08 — Les conseils gratuits (croyance)

```
Avec le socle Remotion déjà en place, crée la composition J08 (360 frames).
Sujet : le coach répond aux demandes de programme gratuit pendant que le vrai prospect attend.
Familles d'animation : LISTE et BIFFURE uniquement. Transition : DepthPushZ à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- <DMList> qui monte depuis le bas (LISTE). Première rangée lisible, en gras non lu :
  « Tu me fais un programme ? ». Les autres rangées sont des Skeletons.

CORPS (90–239)
- 90 : la liste défile (LISTE), la première rangée redevient Skeleton, arrêt sur
  « Quel cardio pour sécher ? ».
- 150 : défilement jusqu'à la neuvième rangée : « Je peux t'appeler demain ? ».
  Les autres sont des Skeletons.
- 210 : BIFFURE sur les deux rangées « gratuites » (désormais Skeletons, rayées).
  La neuvième rangée reste lisible.

BASCULE (240–253) : DepthPushZ. L'ancienne liste recule, une liste réordonnée arrive.
CORRECTION (254–299)
- La rangée « Je peux t'appeler demain ? » monte en première position (LISTE,
  réordonnancement), puis devient « Appel demain 12 h » à 280.

CTA (300–359) : CTAFrame keyword="LISTE".

Voix off (environ 33 mots) :
« Tu passes ta soirée à écrire des programmes gratuits en message. Pendant ce temps,
celui qui voulait payer est neuvième dans la liste. Aider tout le monde, c'est ne
répondre à personne à temps. Commente le mot à l'écran. »

Vérifie la règle des six mots, puis rends trois stills : frames 45, 225, 290.
```

---

## J09 — La relance jamais envoyée (audit)

```
Avec le socle Remotion déjà en place, crée la composition J09 (360 frames).
Sujet : le prospect a lu sans répondre, le coach conclut qu'il n'est pas intéressé
et ne relance jamais.
Familles d'animation : BULLE et COMPTEUR uniquement. Transition : CardFlipY à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- Bulle coach « Je t'envoie le lien ? », sous elle « Vu » en gris.
  Au-dessus, compteur de jours « J+1 » qui défile jusqu'à « J+4 »
  (COMPTEUR, 20→89).

CORPS (90–239)
- 90 : le compteur passe à « J+9 ».
- 150 : le compteur passe à « J+16 ».
- 210 : la bulle devient Skeleton, le compteur disparaît, ligne grise centrée
  « Aucune relance » (coupe franche, pas d'animation).

BASCULE (240–253) : CardFlipY.
CORRECTION (254–299), face arrière :
- Skeleton coach (« Je t'envoie le lien ? »), puis bulle coach de relance
  « Toujours partant pour lundi ? », horodatage « J+2 » (BULLE à 256).
- 276 : la relance devient Skeleton, bulle prospect « Oui ! Désolé. » (BULLE).

CTA (300–359) : CTAFrame keyword="RELANCE".

Voix off (environ 32 mots) :
« Il a lu ton message. Il n'a pas répondu. Tu en conclus qu'il n'est pas intéressé.
Il était peut-être juste occupé. Une relance courte, deux jours après, rouvre la porte.
Commente le mot à l'écran, je t'envoie la mienne. »

Vérifie la règle des six mots, puis rends trois stills : frames 60, 220, 290.
```

---

## J10 ◆ — Ce que fait le système (offre)

```
Avec le socle Remotion déjà en place, crée la composition J10 (360 frames).
Sujet : une conversation complète, de la question du prix à l'appel posé dans l'agenda.
C'est la seule vidéo de la série qui nomme l'assistant (dans la voix uniquement).
Familles d'animation : BULLE et BILLES uniquement. Transition : CardFlipY à 240.
DemoLabel visible de 0 à 299.

HOOK (0–89)
- Bulle prospect « C'est combien ton coaching ? », horodatage « 23:41 ».
  Entrée BULLE à 0, <Typing> côté coach de 20 à 40 (la réponse arrive vite, c'est le sujet).
- 45 : la bulle prospect devient Skeleton, bulle coach « Ton objectif, d'abord ? ».

CORPS (90–239)
- 90 : la bulle coach devient Skeleton, bulle prospect « Perdre 10 kilos. »,
  horodatage « 23:42 ».
- 150 : la bulle prospect devient Skeleton, bulle coach « Demain 18 h ou jeudi ? ».
- 210 : la bulle coach devient Skeleton, bulle prospect « Demain 18 h ».

BASCULE (240–253) : CardFlipY.
CORRECTION (254–299), récompense ◆ :
- Plateau en laiton dessiné comme une semaine : 5 colonnes de 4 alvéoles.
- 256 : une première bille tombe dans l'alvéole « demain 18 h » (BILLES), étiquette
  Inter 40 px au-dessus du plateau : « Appel réservé ».
- 266 → 296 : quatre autres billes tombent dans d'autres jours (BILLES), sans texte.

CTA (300–359) : CTAFrame keyword="AGENDA" (pas de laiton dans le CTA).

Voix off (environ 35 mots) :
« Pendant que tu dors, un assistant entraîné sur ta façon de parler répond. Il demande
l'objectif avant le prix, propose deux créneaux, et pose l'appel dans ton agenda.
En place en sept jours. Commente le mot à l'écran. »

Vérifie la règle des six mots, puis rends trois stills : frames 60, 220, 295.
```

---

## Contrôle avant publication (pour chaque vidéo)

1. Le hook tient seul, sans le son et sans le reste de la vidéo.
2. Jamais plus de six mots visibles ensemble (le test countVisibleWords passe).
3. Rien d'important hors de la zone y 231 → 1536 (still avec showSafeZones).
4. Deux familles d'animation au maximum, une seule transition 3D, à la frame 240.
5. Le CTA est immobile de 300 à 359 et ne montre que le mot-clé.
6. « démonstration » est visible sur tout écran qui affiche des chiffres, des horaires ou une conversation.
7. Aucun client, témoignage ou résultat inventé ; les chiffres de J04 sont annoncés comme estimation.
