# Autoflow — landing page

Landing page d'Autoflow, l'agence qui installe un vendeur IA sur les boutiques Shopify.
Le brief complet (offre, textes, identité, règles de contenu) est dans [`CLAUDE.md`](CLAUDE.md).

Site statique : HTML, CSS et JavaScript, sans dépendance ni étape de build.

## Voir le site en local
Ouvre `index.html` dans ton navigateur, ou lance :
```bash
python3 -m http.server 8000
```
puis va sur http://localhost:8000.

## Réglages (`config.js`)
C'est le seul fichier à modifier pour :
- **`bookingUrl`** : le lien Cal.com ou Calendly. Tant qu'il est vide, les boutons ouvrent un email.
- **`contactEmail`** : l'adresse affichée dans le pied de page.
- **`plans` / `features` / `pricingNotes`** : la grille de prix.

## À faire avant la mise en ligne
- [ ] Déposer le logo dans `assets/AUTOFLOW.png`. Il remplace automatiquement le logo texte provisoire.
- [ ] Créer `assets/og-image.png` (1200 × 630, avec le logo) pour les aperçus de partage,
      puis mettre une URL absolue dans `og:image` une fois le domaine connu.
- [ ] Renseigner `bookingUrl` et vérifier `contactEmail` dans `config.js`.
- [ ] Compléter `mentions-legales.html` et `confidentialite.html` (repères `[À COMPLÉTER]`).
- [ ] Activer Plausible (balise commentée dans le `<head>` de `index.html`) avec le bon domaine.
- [ ] Quand il y aura de vrais clients : remplir la section `#temoignages` et retirer son attribut `hidden`.

## Déploiement
Vercel ou Netlify : importe le dépôt, sans commande de build, dossier de publication = racine.
