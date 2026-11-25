# NODAL — arborescence du site (v0, à valider)

Maquette mobile de l'accueil : `nodal/maquette-accueil-mobile.html` (bouton « Notes DA » en haut pour afficher les justifications).
Les prix, les charges et les délais de la maquette sont des **exemples** : ils sont à remplacer par tes vrais chiffres.

## 1. Choix de plateforme : Shopify (thème Dawn personnalisé)

Pour une marque qui se lance avec un seul fondateur, Shopify plutôt que Next.js en headless :
- le paiement, la TVA, les emails de commande, les retours et le RGPD du checkout sont gérés pour toi ;
- tu modifies les textes et les photos toi-même dans l'éditeur, sans développeur ;
- le headless (Next.js + Storefront API) double le coût de maintenance et n'apporte rien avant environ 50 000 € de CA par mois.

**Contrainte à accepter** : Shopify impose ses préfixes d'URL (`/products/`, `/collections/`, `/pages/`, `/policies/`). « URLs courtes » veut donc dire `/products/module-casque`, pas `/casque`. Des redirections propres sont possibles (`/configurateur` vers `/pages/configurateur`).

## 2. Arborescence

```
/                                   Accueil
├── /pages/configurateur            Configurateur  ← page clé (alias /configurateur)
├── /collections/modules            Tous les modules
│   ├── /products/module-casque
│   ├── /products/double-crochet
│   ├── /products/module-chaussures
│   └── /products/vide-poche
├── /collections/rails              Rails 60 / 80 / 120 cm × finitions (1 produit, variantes)
│   └── /products/rail-chene
├── /cart                           Panier (tiroir latéral + page de secours)
├── /checkout                       Paiement Shopify, 1 page, commande sans compte
│
├── Aide
│   ├── /pages/guide-de-pose        Vidéo + PDF téléchargeable + charge par type de mur
│   ├── /pages/livraison            Délais de fabrication + transport, zones, suivi
│   ├── /pages/retours              30 jours, procédure, qui paie le retour
│   ├── /pages/garantie             Garantie commerciale 3 ans + garantie légale de conformité
│   └── /pages/contact              Formulaire + email
├── /pages/a-propos                 Atelier, fondateur, fabrication
│
└── Légal
    ├── /pages/mentions-legales
    ├── /policies/terms-of-service  CGV
    ├── /policies/privacy-policy    Confidentialité
    ├── /pages/cookies              + bandeau de consentement (Shopify Customer Privacy)
    └── /pages/mediateur            Médiateur de la consommation
```

**Navigation mobile** (menu burger) : Configurateur · Modules · Rails · Guide de pose · À propos. Le panier est toujours visible en haut à droite.
**Pied de page** : Boutique / Aide / NODAL / Légal (voir la maquette).

## 3. Rôle de chaque page clé

| Page | Seul objectif | Frein traité |
|---|---|---|
| Accueil | Envoyer vers le configurateur | Tous, en résumé |
| Configurateur | Ajouter un rail + des modules au panier | « Combien ça coûte au total ? » |
| Fiche module | Ajouter au panier ou au rail | Ça tient ? Quelle taille ? Quelle matière ? |
| Panier | Passer au paiement | Délai de réception, garantie, retours |
| Guide de pose | Rassurer avant l'achat, aider après | Mon mur, le placo |

## 4. Ordre de l'accueil (maquette)

1. Hero : photo, H1 « Ton sport, au mur. », bouton « Composer mon rail », prix d'entrée
2. Réassurance en 2×2 : livraison offerte, retours 30 jours, fait main en France, garantie 3 ans
3. **Avant / après** (curseur glissant) ← remonté
4. Comment ça marche, en 3 étapes avec les cotes
5. Les modules, avec la charge en grand
6. **« Oui, ça tient. »** : vidéo du test à 3 fois la charge ← ajouté
7. Fabriqué ici : atelier et fondateur
8. **Mini configurateur** : choix de la longueur, puis envoi vers le configurateur pré-rempli ← ajouté
9. FAQ
10. Newsletter
11. Pied de page, plus une barre « Composer mon rail » qui reste en bas d'écran après le hero

## 5. Décisions que je te recommande (à valider)

1. **Configurateur : toucher pour placer, pas glisser-déposer sur mobile.** ✅ Implémenté : un tap sur un module le place dans le premier emplacement libre (ou dans l'emplacement ciblé par un tap) ; glisser-déposer en plus sur ordinateur.
2. **Rail = 1 produit avec variantes** (longueur × finition), **modules = produits séparés**. Le configurateur ajoute tout d'un coup (`/cart/add.js`, plusieurs articles) avec un identifiant de composition commun. Pas d'application de « bundle » payante.
3. **Garantie 3 ans = garantie commerciale.** Elle s'ajoute à la garantie légale de conformité de 2 ans, qui doit apparaître dans les CGV et sur la page garantie (art. L217-21 du Code de la consommation).
4. **Médiateur de la consommation** : obligatoire avant la première vente (CM2C, Medicys…, environ 50 à 150 € par an). À souscrire **avant** la mise en ligne.
5. **Avis réels uniquement** : au lancement, il y en a zéro. Prévois l'emplacement, masqué tant qu'il est vide, et un email de demande d'avis à J+14 après la livraison.

## 6. Ce qu'il me faut de toi avant de coder

- [ ] Prix réels : rail par longueur et par finition, chaque module
- [ ] Charge maximale réelle de chaque module, et la vidéo du test à ×3 (ou la date à laquelle tu la tournes)
- [ ] Matière des modules (PETG, ASA, PA ? **pas de PLA** avec une garantie de 3 ans sous charge)
- [ ] Pas d'accroche sur le rail, pour savoir combien de modules tiennent sur 60, 80 et 120 cm
- [ ] Finitions du bois proposées (naturel, huilé foncé… combien ?)
- [ ] Délai réel de fabrication et transporteur
- [ ] Qui paie les frais de retour ?
- [ ] Photos : est-ce qu'un shooting dans de vrais appartements est prévu ? Sinon, le schéma coté de la maquette sert de solution de secours
- [ ] Shopify : boutique déjà créée ? Plan choisi ?
- [ ] Raison sociale, SIRET, adresse pour les mentions légales
