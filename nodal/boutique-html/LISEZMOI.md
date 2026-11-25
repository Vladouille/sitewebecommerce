# NODAL — boutique en HTML (aperçu)

Version HTML statique de la boutique : 21 pages, même design que le thème Shopify, sans serveur.

## L'ouvrir
- Double-clic sur `index.html`, ou en local : `python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000
- Pour la mettre en ligne : envoyer **le contenu de ce dossier** (sans `_build/`) sur n'importe quel hébergement statique.

## Ce qui marche
- Accueil, configurateur (longueur, finition, modules, prix en direct), 5 fiches produit, liste des modules
- Panier : gardé dans le navigateur, quantités, suppression, compositions regroupées, date de livraison estimée
- Pages d'aide et pages légales (générées depuis `../contenus/`)

## Ce qui ne marche pas (et ne peut pas marcher en HTML seul)
- **Le paiement** : le bouton mène à une page qui explique que c'est un aperçu. Pour encaisser : Shopify (thème déjà prêt dans `../theme/`) ou des liens de paiement Stripe.
- La newsletter : il faut un outil d'emailing.
- Les pages sont en `noindex` : prix d'exemple, à ne pas faire indexer par Google.

## Modifier les prix, les produits, les délais
Tout est dans `_build/build.py` (bloc CATALOGUE en haut), puis :
```
pip install markdown
python3 nodal/boutique-html/_build/build.py
```
Ne modifie pas les fichiers `.html` à la main : ils sont écrasés à chaque génération.
