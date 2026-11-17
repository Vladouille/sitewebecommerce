# AutoflowSite — brief logo (provenance)

- Sujet : logo d'une agence qui vend des sites web, nom « AutoflowSite » (autoflowsite.com). Simple, professionnel, inspire confiance.
- Style : vectoriel plat, monochrome, dérivé de la marque Autoflow (serif Libre Caslon + triangle de croissance).
- Palette : #0a0a0a (encre), #ffffff (papier), #6b6b6b / #a3a3a3 (gris secondaire clair / sombre).
- Typos : Libre Caslon Text (OFL) et Inter (OFL), lettrage converti en tracés : aucune police requise pour afficher le logo.
- Sortie : SVG, version claire et sombre, + symbole carré 64×64 pour favicon / photo de profil.
- Pistes : A (famille Autoflow + SITE), B (fenêtre + triangle, sans-serif), C (monogramme A-triangle + Caslon).
- Générateur : `build_logos.py` (tracés), `montage.js` (planche de comparaison, Playwright).
- Note : dessiné à la main en SVG, l'outil de génération Recraft n'était pas disponible dans cette session.

## V2 — pistes détaillées (demande : plus de détails « vente de sites web », 3 couleurs max)

- Palette : #0a0a0a (noir), #ffffff (blanc), #2B47F5 (bleu cobalt) ; en fond sombre le bleu passe à #6F86FF pour rester lisible.
- D. Fenêtre-A : carré noir = fenêtre de navigateur (barre + 3 pastilles, la 3e en bleu), monogramme A-triangle, curseur bleu.
- E. Balise : `<▲/>` chevrons bleus autour du A-triangle (le code du site).
- F. Bouton-A : la barre du A est un bouton bleu arrondi, cliqué par un curseur (le site qui fait passer à l'action).
- Wordmark : « Autoflow » Libre Caslon + « Site » Libre Caslon italique en bleu, slogan « CRÉATION DE SITES WEB » en Inter.
- Déclinaisons : version complète (avec slogan), `-compact` (sans slogan, pour les en-têtes), `-symbole` (64×64), `-favicon` (sans détails, pour 16/32 px).
- Générateurs : `build_logos_v2.py`, `montage_v2.js` → `planche-v2.png`.
