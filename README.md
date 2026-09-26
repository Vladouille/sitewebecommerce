# Autoflow — landing page

Landing page d'Autoflow, l'agence qui installe un vendeur IA sur les boutiques Shopify.
Le brief complet (offre, textes, identité, règles de contenu) est dans [`CLAUDE.md`](CLAUDE.md).

Site statique : HTML, CSS et JavaScript, sans dépendance ni étape de build.
Objectif unique de la page : faire remplir le formulaire d'audit gratuit (section `#audit`), idéalement avec un pack choisi.
Les packs et prix (section `#packs`) viennent de `config.js` : c'est le seul endroit à modifier.

## Voir le site en local
Ouvre `index.html` dans ton navigateur, ou lance :
```bash
python3 -m http.server 8000
```
puis va sur http://localhost:8000.

## Brancher le formulaire (Web3Forms, gratuit)
1. Connecte-toi sur https://app.web3forms.com avec **contact.autoflow1@gmail.com** et crée un formulaire.
   La clé d'accès s'affiche et arrive aussi par email sur cette adresse.
2. Colle-la dans `WEB3FORMS_ACCESS_KEY`, en haut de `config.js`.
3. Envoie une vraie demande depuis le site en ligne. Vérifie qu'elle arrive dans la boîte de réception et pas dans les spams.
   Le sujet reçu est : « Nouvelle demande d'audit : [pack] – [lien de la boutique] ».
   La réponse de Web3Forms s'affiche dans la console du navigateur pour faciliter le débogage.

Tant que la clé est vide, le formulaire affiche le message d'échec avec l'adresse email de secours.

## À faire avant la mise en ligne
- [ ] Renseigner la clé Web3Forms (voir ci-dessus) et tester un envoi réel.
- [ ] Déposer le logo dans `assets/AUTOFLOW.png`. Il remplace automatiquement le logo texte provisoire.
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
- [ ] Compléter `mentions-legales.html` et `confidentialite.html` (repères `[À COMPLÉTER]`).
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) avec le bon domaine.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Déploiement
Vercel ou Netlify : importe le dépôt, sans commande de build, dossier de publication = racine.
