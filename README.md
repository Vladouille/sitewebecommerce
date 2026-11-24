# Autoflow — landing page (version coachs)

Landing page d'Autoflow : un assistant qui répond aux messages privés et aux commentaires Instagram
des coachs en ligne, qualifie les prospects et réserve les appels de vente dans leur agenda.
Le brief complet (offre, textes, identité, règles de contenu, pages légales) est dans [`CLAUDE.md`](CLAUDE.md).

Site statique : HTML, CSS et JavaScript, sans dépendance ni étape de build.
Objectif unique de la page : faire remplir le formulaire d'audit gratuit (Google Forms).

## Fichiers
- `index.html` : la landing page
- `mentions-legales.html`, `confidentialite.html`, `cookies.html`, `cgv.html` : pages légales
- `dist/prompt-mise-a-jour-legale.md` : prompt prêt à coller dans l'IA d'Hostinger pour publier la partie légale
- `dist/documents-legaux/` : accord de traitement des données (à annexer à chaque proposition commerciale), registre des traitements (interne, article 30 du RGPD), textes à mettre dans le formulaire Google
- `config.js` : lien du formulaire et packs (prix, lignes du comparatif, textes des cartes)
- `styles.css`, `script.js`
- `404.html` : page introuvable
- `robots.txt`, `sitemap.xml` : pour Google (domaine à remplacer, voir plus bas)
- `assets/og-image.png` (aperçu de partage), `assets/favicon.svg`, `favicon-48.png`, `apple-touch-icon.png`
- `assets/fonts/` : polices Inter et Libre Caslon Text hébergées sur le site (licence SIL OFL), pour ne pas transmettre l'IP des visiteurs à Google Fonts
- `.htaccess` : configuration Hostinger (HTTPS forcé, adresses propres `/mentions-legales`, `/confidentialite`, `/cgv`, cache)

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
- [ ] Une fois le domaine connu : remplacer `https://autoflow.fr` dans `robots.txt` et `sitemap.xml`,
      et mettre une URL absolue dans `og:image` (`index.html`).
- [ ] Régénérer `assets/og-image.png` avec le vrai logo quand `AUTOFLOW.png` sera déposé.
- [ ] Vérifier le téléphone de Hostinger dans les mentions légales, puis faire valider les pages légales par un professionnel du droit.
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) et mettre à jour le paragraphe « Cookies ».
- [ ] Après la mise en ligne : cliquer sur chaque bouton pour vérifier qu'il ouvre le formulaire, puis faire un envoi test.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Version en un seul fichier
`dist/autoflow-site-complet.html` contient tout le site dans un seul fichier HTML (landing, style, conversation animée,
packs écrits en dur, et les quatre pages légales accessibles par `#mentions-legales`, `#confidentialite`, `#cookies`, `#cgv`).
Il ne charge aucune ressource externe : les polices du site sont remplacées par Georgia et la police système.
À régénérer si tu modifies les fichiers sources (prix, textes, pages légales).

## Déploiement sur Hostinger
1. hPanel → Sites web → ton domaine → **Gestionnaire de fichiers** → dossier `public_html`.
2. Supprime le fichier `default.php` s'il existe.
3. Envoie le **contenu** du dossier du site (pas le dossier lui-même) : `index.html`, les 4 pages légales, `404.html`, `robots.txt`, `sitemap.xml`,
   `config.js`, `script.js`, `styles.css`, le dossier `assets/` et le fichier `.htaccess`
   (fichier caché : active l'affichage des fichiers cachés si tu ne le vois pas).
   Tu peux aussi envoyer le .zip puis cliquer sur « Extraire » dans le gestionnaire de fichiers.
4. hPanel → **Sécurité → SSL** : vérifie que le certificat SSL gratuit est actif.
5. Ouvre ton domaine, puis `/mentions-legales`, `/confidentialite`, `/cookies` et `/cgv`, et clique sur chaque bouton.

## Apparaître sur Google
1. Mettre le site en ligne sur Hostinger (voir plus haut), avec le domaine d'Autoflow.
2. Remplacer `https://autoflow.fr` dans `robots.txt` et `sitemap.xml` si le domaine est différent, puis renvoyer ces deux fichiers.
3. Ouvrir Google Search Console, ajouter le domaine, valider la propriété (enregistrement DNS dans hPanel → Domaines → DNS).
4. Dans Search Console : « Sitemaps », déclarer `sitemap.xml`, puis « Inspection de l'URL » sur la page d'accueil, « Demander l'indexation ».
Compte de quelques jours à quelques semaines avant l'apparition dans les résultats.
Les pages légales sont en `noindex` : elles restent accessibles mais ne sortent pas dans Google.

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
