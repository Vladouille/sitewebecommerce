# HYDRION — site de démonstration (plombier, Lyon)

Livraison : **ce dossier entier** (`index.html`, `images/`, `CREDITS.md`). Aucun build, aucun serveur.
Ouvrir `index.html` en double-cliquant, ou déposer le dossier sur n'importe quel hébergeur statique.

- Les seules ressources externes sont les polices Google Fonts. Sans Internet, le site s'affiche avec les polices système.
- Images : WebP avec un JPEG de secours dans des balises `<picture>`. Origine et licences dans `CREDITS.md`.
- Pour un vrai client : remplacer les photos signalées par `<!-- PHOTO CLIENT … -->` et le comparateur (`<!-- REMPLACER PAR LES VRAIES PHOTOS DU CLIENT … -->`), passer la balise `robots` en `index, follow`, et retirer le bandeau ainsi que l'encadré de démonstration.

## Version en un seul fichier
`hydrion-fichier-unique.html` contient tout le site, images comprises (encodées en base64, environ 1 Mo).
Il s'envoie par e-mail ou se dépose tel quel. Après une modification de `index.html` ou des images, le régénérer avec :

```bash
python3 outils/fichier-unique.py
```
