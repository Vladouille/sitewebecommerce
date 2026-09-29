# Autoflow — landing page (version coachs)

Landing page d'Autoflow : un assistant qui répond aux messages privés et aux commentaires Instagram
des coachs en ligne, qualifie les prospects et réserve les appels de vente dans leur agenda.
Le brief complet (offre, textes, identité, règles de contenu, pages légales) est dans [`CLAUDE.md`](CLAUDE.md).

Site statique : HTML, CSS et JavaScript, sans dépendance ni étape de build.
Objectif unique de la page : faire remplir le formulaire d'audit gratuit (Google Forms).

## Fichiers
- `index.html` : la landing page
- `mentions-legales.html`, `confidentialite.html`, `cgv.html` : pages légales
- `config.js` : lien du formulaire et packs (prix, lignes du comparatif, textes des cartes)
- `styles.css`, `script.js`
- `vercel.json` : sur Vercel, les pages légales sont servies à `/mentions-legales`, `/confidentialite` et `/cgv`
  (Netlify le fait par défaut).

## Voir le site en local
Ouvre `index.html` dans ton navigateur, ou lance :
```bash
python3 -m http.server 8000
```
puis va sur http://localhost:8000.

## Formulaire d'audit (Google Forms)
Le lien du formulaire est dans `AUDIT_FORM_URL`, en haut de `config.js`.
Tous les boutons « Réserver mon audit gratuit » (en-tête, hero, bloc `#audit`, appel final, pages légales)
et « Choisir … » (packs) ouvrent ce lien dans un nouvel onglet. Le pack se choisit dans le formulaire.

## Packs
Prix, lignes du comparatif et phrases des cartes sont dans `config.js`.
Le coût par conversation, la comparaison « X fois moins cher » et l'écart « Seulement X € de plus »
sont calculés automatiquement à partir des prix et des volumes de conversations.

## À faire avant la mise en ligne
- [ ] Remplacer `AUDIT_FORM_URL` par le formulaire adapté aux coachs (compte Instagram, activité, pack, message, consentement).
- [ ] Déposer le logo dans `assets/AUTOFLOW.png`. Il remplace automatiquement le logo texte provisoire.
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
- [ ] Compléter les pages légales (repères `[À COMPLÉTER : …]`) et les faire valider par un professionnel du droit.
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) et mettre à jour le paragraphe « Cookies ».
- [ ] Après la mise en ligne : cliquer sur chaque bouton pour vérifier qu'il ouvre le formulaire, puis faire un envoi test.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Déploiement
Vercel ou Netlify : importe le dépôt, sans commande de build, dossier de publication = racine.

## Mini-jeu « La Lanterne d'Ilia » (`jeu/`)
Jeu d'énigmes de lumière avec progression, indépendant de la landing (aucun lien depuis la page). Ouvre http://localhost:8000/jeu/.
- **Histoire** : le Grand Chêne a perdu ses feuilles. Ilia réveille les graines endormies sous ses racines avec la lumière de sa lanterne.
- **Campagne** : 30 énigmes en 5 chapitres, chacun avec une nouvelle mécanique (cristaux, cristaux doubles, lumière de lune,
  cloches et portes de racines, Cœur-Graine). Chaque niveau a été vérifié par un solveur ; `par` = nombre minimal de gestes.
- **Éclats de lumière** : gagnés en réussissant les énigmes (une seule fois par énigme), les feuilles parfaites, les missions et les défis.
- **Village à restaurer** : Forge (réserve d'indices), Boulangerie (bonus d'éclats), Atelier du verrier (styles de lanterne),
  Jardin d'Oda (bonus des feuilles parfaites), Observatoire (énigme du jour, défis difficiles). Chaque niveau se voit dans le décor.
- **18 missions** données par les villageois, avec récompenses.
- **Défis** : énigme du jour (la même pour tout le monde) et défis libres infinis (facile, moyen, difficile), générés dans le navigateur
  et vérifiés par le même solveur.
- **Village panoramique** : chaque bâtiment a 4 apparences (ruine → magnifique), un aperçu « maintenant → après » sur sa carte,
  et une animation de construction. On fait glisser le village pour le visiter.
- **Sauvegarde** : automatique après chaque action, dans le navigateur ; sur le compte claude.ai quand la page est publiée
  comme Artifact (capacités `db` + `user`, document privé `data/users/<id>/save`) ; et code de sauvegarde à copier-coller.
Niveaux, bâtiments, missions et textes : constantes en haut de `jeu/jeu.js`.

## Jeu « Les Bâtisseurs de Clairval » (`village/`)
Jeu de gestion indépendant de la landing. Ouvre http://localhost:8000/village/.
- **Vue isométrique** : la ville est une maquette vue d'en haut, qu'on fait glisser, zoome (pincer, +/−) et tourne d'un quart de tour.
  On récolte en touchant les arbres, rochers, buissons et la rivière ; on place chaque bâtiment sur la case de son choix.
- **Améliorations visibles** : chaque bâtiment monte jusqu'au niveau 5 (3 dans son ère, +1 à chaque ère suivante).
  Il grandit et change d'allure à chaque niveau (étages, annexes, cheminées, jardins, antennes, finition dorée au niveau 5), avec une animation d'échafaudage.
- **14 ères** : Village, Ville, Mégacité, puis Écocité, Cité numérique, Arcologie, Cité flottante (sur la mer), Cité orbitale,
  Colonie lunaire, Colonie martienne (le Terraformeur la fait verdir), Ceinture d'astéroïdes, Essaim de Dyson, Monde-anneau et Cité galactique.
  Chaque ère a sa merveille (Tour de Clairval, Arbre-Monde, Cœur numérique… jusqu'au Portail galactique) sur un terrain réservé.
  À partir de l'ère 7, de nouveaux sites s'ouvrent avec leur propre décor (mer, orbite, Lune, Mars, astéroïdes, Soleil, anneau, galaxie).
- **21 ressources, 40 métiers, 132 bâtiments, 54 améliorations, 55 objectifs.**
- **Outils** : Conseiller (ce qu'il faut faire, avec un bouton qui le fait), automatisations à acheter (Bureau de l'emploi, file de constructions,
  drones de récolte, Contremaître, Courtier, IA urbaniste), statistiques par ressource (détail et courbe), marché, flèche dorée sur les bâtiments améliorables.
- **Besoins** : nourriture, eau, chauffage l'hiver, électricité à partir de la Mégacité ; le bonheur fait venir ou partir des habitants.
- **Sauvegarde automatique** : toutes les 10 secondes, après chaque action et quand on quitte la page, sur l'appareil et sur le compte claude.ai
  (capacité `db`, document privé `data/users/<id>/clairval`). Un témoin vert dans le bandeau montre l'état de la sauvegarde.
  Sauvegardes de secours : une copie toutes les 5 minutes de jeu, au début de chaque ère et avant tout chargement (8 gardées),
  à restaurer depuis le Journal ; si la sauvegarde principale est abîmée, le jeu repart de la plus récente.
  Code à copier pour changer d'appareil ; gains hors ligne. Les anciennes sauvegardes (vue de côté) sont converties automatiquement.
- **Équilibrage** : un robot joue la partie entière hors navigateur (toutes les ères, Portail galactique vers le jour 830).
Réglages : constantes en haut de `village/village.js` (ères, sites, ressources, métiers, bâtiments, améliorations, outils, objectifs).

## Jeu « Aurore, la cité » (`cite/`)
Jeu de gestion de ville en vraie 3D (three.js, fourni dans `cite/vendor/`, aucune étape de build), indépendant de la landing.
Ouvre http://localhost:8000/cite/.
- **Graphismes 3D** : terrain avec rivières, lacs ou côte, collines et forêts autour de la carte, eau animée qui reflète le ciel,
  ombres portées, cycle jour/nuit (fenêtres, lampadaires et phares allumés la nuit, étoiles et lune), éclat lumineux en qualité haute,
  4 saisons (herbe, feuillage d'automne, neige sur les toits et les routes), météo (pluie, orage avec éclairs, neige, brume, nuages),
  voitures et bateaux qui circulent, fumée des usines, vapeur des centrales, incendies, grues et échafaudages sur les chantiers,
  éoliennes qui tournent, étincelles quand un chantier se termine. Qualité automatique (haut, moyen, bas) selon l'appareil.
- **Ville** : routes et avenues (ponts sur l'eau), 4 zones (résidentiel, commercial, industriel, bureaux) où les habitants construisent
  eux-mêmes selon la demande ; chaque bâtiment grandit sur 4 niveaux (maison → immeuble → tour), avec 48 modèles différents.
- **Services** : 34 bâtiments (énergie, eau, épuration, déchets, police, pompiers, santé, éducation, loisirs, transports)
  dont 5 merveilles (Tour d'Aurore, Opéra, Arcologie, Centrale à fusion, Spatioport). Les services s'améliorent (3 niveaux visibles).
- **Axes de gestion** : budget (impôts par zone, budget de chaque service, emprunts), 16 recherches, 10 décrets, 8 paliers de population,
  29 objectifs récompensés, bonheur détaillé par bâtiment, valeur foncière, pollution, bruit, circulation, chômage,
  incendies qui se propagent, événements (tempête, canicule, vague de froid, festival, épidémie, subvention, investisseur, touristes),
  13 calques de carte, conseils en direct, statistiques avec courbes, journal de la ville, mode photo.
- **Sauvegarde automatique** : toutes les 15 secondes, après chaque action et quand on quitte la page ; 3 villes avec miniature ;
  6 copies de secours par ville (toutes les 3 minutes, à chaque palier et à chaque chargement) ; sur le compte claude.ai quand la page
  est publiée comme Artifact (capacités `db` + `user`) ; code de sauvegarde compressé pour changer d'appareil ; progrès pendant l'absence (3 mois au plus).
- Commandes : glisser pour se déplacer, pincer ou molette pour zoomer, ⟲ ⟳ pour tourner ; avec un outil, un doigt dessine et deux doigts déplacent.
  Clavier : espace, 1 2 3, Q E, flèches ou ZQSD, + −, Échap, P.
Réglages : `cite/js/data.js` (zones, bâtiments, recherches, décrets, paliers, objectifs). Simulation testable sans navigateur : `cite/js/sim.js`.
