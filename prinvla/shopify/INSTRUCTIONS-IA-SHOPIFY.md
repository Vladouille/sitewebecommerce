# PRINVLA : intégrer la page de vente dans Shopify

> **À donner à l'assistant IA de Shopify (Sidekick), avec le fichier `prinvla-landing.liquid`.**
> Ce fichier `.liquid` est le site complet, déjà converti en section de thème Shopify : design, textes, animations, pince 3D, prix et stock reliés aux produits. **Il ne faut pas le réécrire ni le « recréer » : il faut l'installer tel quel.** Toutes les étapes ci-dessous peuvent aussi être faites à la main en suivant le même ordre.

---

## Règles à respecter (non négociables)

- Garder les textes **mot pour mot**. Ne rien ajouter : pas d'avis clients inventés, pas de note, pas de nombre de clients, pas de prix barré, pas de « −50 % », pas de compte à rebours.
- Ne jamais présenter le produit comme un jouet pour enfants : il est conçu pour les **14 ans et plus**.
- Ne pas promettre de remplacement gratuit en cas de casse : cette promesse a été retirée volontairement. Seules les garanties légales s'appliquent.
- Ne pas installer d'application qui dépose des cookies de suivi sans mettre à jour la politique de confidentialité et afficher un bandeau de consentement.

---

## Étape 1 — Le produit « Pince »

Créer un produit :
- **Titre** : Pince à boules de neige PRINVLA
- **Description** : Imprimée en France, en PETG qui ne casse pas au froid. Des boules compactes de 6 cm en 2 secondes. Tu plonges, tu serres, tu lances. Conçue pour les 14 ans et plus.
- **Option « Couleur »** avec deux variantes : **Kaki** et **Bordeaux**.
- **Prix** : 12,90 € pour chaque variante.
- **Inventaire** : cocher « Suivre la quantité » et **décocher** « Continuer à vendre en cas de rupture de stock ». Répartir le stock du Drop #1 entre Kaki et Bordeaux, **25 pinces au total** (par exemple 13 et 12).
- **Expédition** : produit physique ; renseigner le poids réel du colis.

## Étape 2 — Les packs Duo et Clan

Installer l'application gratuite **Shopify Bundles** (éditée par Shopify), puis créer deux lots à partir des variantes de la Pince, pour que chaque vente retire les bonnes pinces du stock :
- **Duo « Bataille »** : 1 Kaki + 1 Bordeaux, **19,90 €**.
- **Clan** : 2 Kaki + 2 Bordeaux, **34,90 €**.

Si Shopify Bundles n'est pas disponible sur le forfait, me le signaler au lieu de créer des produits séparés : avec des produits séparés, le stock ne serait plus partagé et on pourrait vendre plus de 25 pinces.

## Étape 3 — La livraison

Dans **Paramètres → Expédition et livraison**, zone **France** :
- tarif **« Point relais » : 3,90 €** pour les commandes de 0 € à 34,89 € ;
- tarif **« Point relais offert » : 0 €** à partir de 34,90 € (c'est ce qui rend la livraison offerte pour le Clan).

Pour que le client choisisse son point relais pendant le paiement, installer une application de transporteur qui ajoute la carte des points relais (par exemple Mondial Relay, Boxtal ou Sendcloud), compatible avec le forfait de la boutique.

## Étape 4 — Installer la section (le site)

Si l'assistant ne peut pas créer de fichier de code, le faire à la main (2 minutes) :
1. **Boutique en ligne → Thèmes** → sur le thème actif : **⋯ → Modifier le code**.
2. Dossier **sections** → **Ajouter une nouvelle section** → nom : `prinvla-landing` → **Liquid**.
3. Effacer le contenu proposé, **coller tout le contenu** de `prinvla-landing.liquid`, **Enregistrer**.

Puis **Personnaliser** le thème, page **Accueil** :
1. **Ajouter une section → « PRINVLA — Page de vente »** et la placer en premier.
2. Masquer les autres sections de la page d'accueil (icône œil).
3. Dans les réglages de la section :
   - **Pince** : le produit de l'étape 1 ;
   - **Pack Duo** et **Pack Clan** : les lots de l'étape 2 ;
   - **Lien de la liste d'attente du prochain drop** : l'adresse du formulaire d'inscription au Drop #2 ;
   - **Fabricant** : nom et adresse réels du fabricant (obligation légale de sécurité des produits) ;
   - **Badge du Duo** : laisser « Recommandé » (n'écrire « Le plus choisi » que lorsque les ventes le prouvent).
4. **Enregistrer**.

## Étape 5 — L'habillage du thème

- **Paramètres du thème → Couleurs** : fond **#05070B**, texte **#EEF2F5**, accent **#9FE8FF** pour l'en-tête et le pied de page, afin qu'ils se fondent dans la section.
- **Barre d'annonce** : la désactiver.
- **En-tête** : logo texte **PRINVLA**.
- **Typographie** : si elles sont proposées, **Space Grotesk** pour les titres et **Inter** pour le texte. La section embarque déjà sa police de titres : ce réglage ne sert qu'à l'en-tête et au pied de page.

## Étape 6 — Paiement et pages légales

- **Paramètres → Paiements** : activer **Shopify Payments** (SIRET, IBAN et pièce d'identité nécessaires ; la vérification peut prendre plusieurs jours).
- **Paramètres → Politiques** : reprendre les textes des fichiers `cgv.html` et `confidentialite.html` fournis avec le site, en remplaçant **« Stripe » par « Shopify Payments »**. Créer une page **Mentions légales** avec le texte de `mentions-legales.html`. Remplacer tous les `[PLACEHOLDERS]` par les vraies informations, et ajouter le **médiateur de la consommation** (obligatoire pour vendre à des particuliers).

## Étape 7 — Vérifications avant de publier

- [ ] Sur téléphone : la pince 3D s'affiche puis se referme quand on fait défiler la page.
- [ ] « Il reste X pinces sur 25 » correspond au stock réel de la Pince.
- [ ] Chacun des 3 boutons (Solo avec choix de couleur, Duo, Clan) ajoute le bon produit et mène au paiement.
- [ ] Une commande test complète passe, avec le choix du point relais.
- [ ] Après une commande, le stock affiché a baissé.
- [ ] Quand le stock tombe à 0, les boutons deviennent « Rejoindre la liste du Drop #2 ».

---

## Bon à savoir

- **Remplacer le modèle 3D provisoire** par le vrai : **Contenu → Fichiers → Importer** le fichier `.glb` (compressé Draco), copier son lien, puis le coller dans le réglage **« URL du modèle 3D »** de la section. Ajouter aussi une image fixe de la pince dans **« Image fixe avant chargement de la 3D »**.
- La 3D se charge depuis jsDelivr (Three.js 0.160.0) et le décodeur depuis Google (gstatic), **seulement après le premier geste du visiteur**. Le premier affichage reste rapide.
- Avec « réduire les animations » activé sur l'appareil du visiteur, la section reste lisible : pas de neige, pas de 3D, pas d'animation.
