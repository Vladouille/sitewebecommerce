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
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
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
3. Envoie le **contenu** du dossier du site (pas le dossier lui-même) : `index.html`, les 4 pages légales,
   `config.js`, `script.js`, `styles.css`, le dossier `assets/` et le fichier `.htaccess`
   (fichier caché : active l'affichage des fichiers cachés si tu ne le vois pas).
   Tu peux aussi envoyer le .zip puis cliquer sur « Extraire » dans le gestionnaire de fichiers.
4. hPanel → **Sécurité → SSL** : vérifie que le certificat SSL gratuit est actif.
5. Ouvre ton domaine, puis `/mentions-legales`, `/confidentialite`, `/cookies` et `/cgv`, et clique sur chaque bouton.
