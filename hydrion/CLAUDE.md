# HYDRION — site vitrine plombier (pièce de portfolio)

Ce dossier est un projet **indépendant** du site Autoflow situé à la racine du dépôt.
Les règles du `CLAUDE.md` racine (Autoflow : monochrome, pas de dégradés, tutoiement, Google Forms…)
**ne s'appliquent pas ici**. Le brief de référence est dans `PLAN.md` (décisions) et le prompt d'origine.

Règles du projet :
- Tout le contenu (nom, téléphone, textes, prix) vit dans `src/content.ts`. Aucun texte en dur ailleurs.
- Cuivre (`copper`) = uniquement les actions d'appel / devis / urgence. Texte des CTA cuivre en `text-night` (contraste).
- Un numéro cliquable doit être visible à tout moment : le header ne se cache que si le dock d'appel est visible (`src/lib/dock.ts`).
- Liens tel: toujours via `telHref` (format +33). Chaque appel passe par `trackCall(location)`.
- Le HTML est pré-rendu au build (`scripts/prerender.mjs`) : tout composant doit pouvoir s'exécuter côté serveur
  (pas d'accès à `window` pendant le rendu ; uniquement dans `useEffect`). La 3D se charge en lazy, côté client.
- Animations GSAP : toujours dans `gsap.context()` + `ctx.revert()` au démontage (StrictMode).
- Vérifier à chaque phase : `npm run build` OK, 0 erreur/warning console, captures 390 px et 1440 px.
