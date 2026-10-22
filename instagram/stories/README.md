# Stories Instagram à la une

Quatre visuels 1080 x 1920 : `story-1.png` (le problème), `story-2.png` (ce qu'on fait),
`story-3.png` (le résultat), `story-4.png` (l'appel).

Chaque visuel est une page HTML dans `src/` (volumes en CSS 3D, métal brossé en SVG),
avec les réglages communs dans `src/common.js` : accent `#2d5bff`, lumière haute à 35°,
remplissage froid, Inter 500 et 800. Zones sûres respectées : rien d'important dans les
230 px du haut ni les 384 px du bas.

Pour régénérer les PNG (Playwright et Chromium déjà installés) :
```bash
NODE_PATH="$(npm root -g)" node render.cjs        # les quatre
NODE_PATH="$(npm root -g)" node render.cjs 2 3    # seulement certaines
```
