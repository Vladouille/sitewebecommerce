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

## Brancher le formulaire (Tally, gratuit)
1. Sur https://tally.so, connecté avec **contact.autoflow1@gmail.com**, crée le formulaire avec ces champs :
   prénom (obligatoire), email (obligatoire), téléphone (facultatif), lien de la boutique (obligatoire),
   chiffre d'affaires mensuel (obligatoire : moins de 30 k€, 30 à 100 k€, 100 à 300 k€, plus de 300 k€),
   pack qui t'intéresse (Essentiel, Croissance, Scale, Je ne sais pas encore),
   principal problème constaté (facultatif), consentement RGPD obligatoire
   (« J'accepte qu'Autoflow utilise ces informations pour me recontacter au sujet de mon audit »).
2. Pour que les boutons « Choisir … » pré-remplissent le pack : ajoute un champ caché (Hidden field) nommé `pack`,
   ou active le pré-remplissage de la question « pack » avec le paramètre d'URL `pack`.
3. Message de fin : « Demande envoyée. On revient vers toi sous 48 h ouvrées avec ton audit. »
4. Active la notification email à chaque nouvelle réponse (Intégrations → Email notifications).
5. Publie le formulaire et copie son identifiant (la fin du lien `https://tally.so/r/XXXXXX`)
   dans `TALLY_FORM_ID`, en haut de `config.js`.
6. Après la mise en ligne, fais un envoi test : il doit apparaître dans Tally et dans la boîte mail, pas dans les spams.

Tant que `TALLY_FORM_ID` est vide, la section `#audit` propose d'écrire à l'adresse de contact.

## À faire avant la mise en ligne
- [ ] Créer le formulaire Tally, renseigner `TALLY_FORM_ID` et tester un envoi réel (voir ci-dessus).
- [ ] Déposer le logo dans `assets/AUTOFLOW.png`. Il remplace automatiquement le logo texte provisoire.
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
- [ ] Compléter `mentions-legales.html` et `confidentialite.html` (repères `[À COMPLÉTER]`).
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) avec le bon domaine.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Déploiement
Vercel ou Netlify : importe le dépôt, sans commande de build, dossier de publication = racine.
