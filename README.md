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

## Mini-jeu « Pêcheur d'étoiles » (`jeu/`)
Jeu de pêche en descente/remontée, sur le thème de l'espace, indépendant de la landing (aucun lien depuis la page).
Ouvre http://localhost:8000/jeu/. Descends la sonde sans rien toucher, puis attrape étoiles, cristaux, comètes…
en remontant (attention aux débris de satellite). Revends ta pêche pour améliorer câble, soute, bouclier et propulseurs,
jusqu'à rapporter le Cœur de la nébuleuse (1 050 m). Progression sauvegardée dans le navigateur.
Réglages (prix, objets, vitesses) : constantes en haut de `jeu/jeu.js`.
