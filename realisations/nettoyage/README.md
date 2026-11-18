# Démo « nettoyage » — mode d'emploi
1. Ouvrir `index.html` en double-clic (ou déposer le dossier tel quel chez n'importe quel hébergeur).
2. Pour un prospect : dupliquer le dossier, puis modifier **uniquement** `assets/js/config.js`.
3. Nom, slogan, téléphone, email, zone, horaires, services, chiffres et avis : section par section dans `config.js`.
4. Couleurs : `paletteParDefaut` (aqua, eucalyptus, nuit, sable) ou une nouvelle palette (6 couleurs, garder un contraste AA).
5. Vos coordonnées de créateur : bloc `createur` (nom, email, téléphone, site en `https://…`).
6. Photos : remplacer les fichiers de `assets/img/` en gardant les noms (grande version + version `-700`/`-800`/`-600`/`-500`).
7. Téléphone de démo : rester dans une plage ARCEP de fiction (01 99 00 xx xx).
8. En rendez-vous : bouton « Personnaliser » en bas à gauche (palettes + mode sombre).
9. Animations : GSAP + Lenis par CDN ; sans réseau, le site reste complet, sans animation.
10. Un seul fichier à envoyer : `python3 outils/fichier-unique.py` → `nettoyage-fichier-unique.html` (tout intégré, hors ligne). Crédits : `CREDITS.md`.
