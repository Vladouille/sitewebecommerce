# Autoflow — landing page

Landing page d'Autoflow, l'agence qui installe un vendeur IA sur les boutiques Shopify.
Le brief complet (offre, textes, identité, règles de contenu) est dans [`CLAUDE.md`](CLAUDE.md).

Site statique : HTML, CSS et JavaScript, sans dépendance ni étape de build.
Objectif unique de la page : faire remplir le formulaire d'audit gratuit (Google Forms), idéalement avec un pack choisi.
Les packs et prix (section `#packs`) viennent de `config.js` : c'est le seul endroit à modifier.

## Voir le site en local
Ouvre `index.html` dans ton navigateur, ou lance :
```bash
python3 -m http.server 8000
```
puis va sur http://localhost:8000.

## Formulaire d'audit (Google Forms)
Le lien du formulaire est dans `AUDIT_FORM_URL`, en haut de `config.js`.
Tous les boutons « Réserver mon audit gratuit » (en-tête, hero, bloc `#audit`, appel final)
et « Choisir … » (packs) ouvrent ce lien dans un nouvel onglet. Le pack se choisit dans le formulaire.

## À faire avant la mise en ligne
- [ ] Après la mise en ligne : cliquer sur chaque bouton pour vérifier qu'il ouvre le formulaire, puis faire un envoi test.
- [ ] Déposer le logo dans `assets/AUTOFLOW.png`. Il remplace automatiquement le logo texte provisoire.
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
- [ ] Compléter `mentions-legales.html` et `confidentialite.html` (repères `[À COMPLÉTER]`).
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) avec le bon domaine.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Déploiement
Vercel ou Netlify : importe le dépôt, sans commande de build, dossier de publication = racine.
