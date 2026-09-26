# Autoflow — brief de la landing page

Ce fichier donne à Claude Code tout le contexte du projet. Lis-le entièrement avant de coder.

## 1. Le projet

Autoflow est une agence qui installe un **vendeur IA** sur les boutiques Shopify. L'agent répond aux questions des visiteurs (tailles, délais, retours, compatibilité), les rassure, les guide vers le panier, et relance les paniers abandonnés par WhatsApp et email.

- **Cible** : e-commerçants Shopify qui font entre 30 000 et 300 000 € de chiffre d'affaires par mois, qui paient de la publicité mais convertissent mal.
- **Désir profond du client** : gagner plus avec le même budget pub (baisser son coût d'acquisition).
- **On ne vend pas de l'IA, on vend des ventes récupérées.** Le mot « IA » n'est jamais l'argument principal.
- **Objectif unique de la page** : faire remplir le formulaire de demande d'audit gratuit (voir section 5), idéalement avec un pack déjà choisi. Les prix sont affichés (section « Packs et prix ») mais il n'y a pas de paiement en ligne : le paiement se fait après l'audit.
- **Email de l'entreprise** : contact.autoflow1@gmail.com (reçoit les demandes du formulaire).

## 2. L'offre (à reprendre fidèlement)

| Brique | Contenu |
|---|---|
| Promesse | On récupère les ventes que ta boutique Shopify perd chaque jour, grâce à un vendeur IA qui répond, rassure et relance tes visiteurs 24h/24. |
| Délai | En ligne en 7 jours, puis optimisé chaque mois à partir des vraies conversations. |
| Garantie | Si l'agent n'est pas en ligne au jour 7, le premier mois est offert. Si après 30 jours les ventes attribuées à l'agent (mesurées en A/B test) ne couvrent pas son coût, le mois est offert. |
| Bénéfices | Même budget pub, plus de ventes. Plus aucune question sans réponse la nuit ou le week-end. Des paniers récupérés sans brader la marge avec des codes promo. Un rapport mensuel qui chiffre les ventes récupérées et révèle les objections à corriger sur les fiches produits. |

**Ce qu'on ne garantit pas** (à dire clairement dans la FAQ) : un taux de conversion précis, car il dépend aussi du trafic, des prix et des fiches produits.

## 3. Identité visuelle

- **Logo** : fichier `AUTOFLOW.png` (à placer dans `public/` ou `assets/`). « AUTOFLOW » en capitales à empattements, noir sur blanc, suivi d'un petit triangle noir plein (symbole de croissance). Le logo est validé : ne pas le redessiner.
- **Direction** : dériver le design du logo. Monochrome noir et blanc, sobre, premium, éditorial. Une typographie serif pour les titres (proche du logo) et une sans-serif lisible pour le texte courant.
- **Un seul élément marquant** : le hero montre une vraie conversation entre un visiteur et le vendeur Autoflow (voir section 4). C'est lui qui « montre au lieu de dire ».
- Le triangle du logo peut servir de motif discret (puces, indicateur de croissance), pas de décoration partout.
- **À éviter** : fond crème + accent terracotta, fond noir + accent vert acide, cartes arrondies identiques avec ombres grises, dégradés décoratifs, labels en capitales au-dessus de chaque titre, animations d'entrée sur chaque section, flèches « → » ajoutées aux boutons.
- Suivre le skill frontend-design s'il est disponible : plan de design (palette en 4 à 6 hex, typographies, wireframe) avant de coder.

## 4. Structure et textes de la page

L'ordre suit les questions que se pose le prospect. Les textes sont des brouillons : on peut les resserrer, mais sans changer les promesses.

### Hero
- **Titre** : Tes visiteurs repartent avec des questions. Autoflow les transforme en ventes.
- **Sous-titre** : Un vendeur IA sur ta boutique Shopify qui répond, rassure et relance tes paniers, 24h/24. En ligne en 7 jours. Tu ne paies que s'il rapporte plus qu'il ne coûte.
- **Bouton principal** : Réserver mon audit gratuit (ouvre le formulaire Google)
- **Visuel** : maquette de conversation, par exemple :
  - Visiteur (23h14) : « Je fais du 38, je prends quelle taille sur ce jean ? »
  - Autoflow : « Ce modèle taille petit : on te conseille le 40. 92 % des clientes en 38 l'ont pris en 40 et l'ont gardé. Livraison en 48 h et retours gratuits sous 30 jours. Je l'ajoute à ton panier ? »
  - (le chiffre de la maquette est fictif et doit être présenté comme un exemple de conversation, pas comme une statistique Autoflow)

### Le problème
Tu paies chaque visiteur en pub. La plupart repartent sans acheter, souvent pour une question restée sans réponse : la taille, le délai, les retours. Et un code promo ne règle pas un doute.

### Avant / avec Autoflow
- **Avant** : des questions sans réponse le soir et le week-end, des paniers abandonnés relancés avec un code promo qui mange la marge, un SAV qui répète les mêmes réponses, aucune idée de ce qui bloque les clients.
- **Avec Autoflow** : chaque visiteur a une réponse en quelques secondes, les paniers sont relancés par une vraie conversation, les ventes récupérées sont chiffrées chaque mois, les objections de tes clients remontent noir sur blanc.

### Comment ça marche (vraie séquence, la numérotation est justifiée)
1. **Audit (jours 1-2)** : on analyse ta boutique et on repère où tu perds des ventes.
2. **Configuration (jours 3-5)** : on connecte l'agent à ton catalogue, tes délais et ta politique de retour, et on l'aligne sur le ton de ta marque.
3. **Mise en ligne (jour 7)** : l'agent est actif sur une partie de ton trafic, en A/B test, pour mesurer son vrai impact.
4. **Chaque mois** : rapport des ventes récupérées, objections repérées, optimisations.

### Ce que tu reçois
Vendeur IA sur ton site, déclenchement au bon moment (fiche produit, sortie de page, panier), relance des paniers par WhatsApp et email (clients ayant donné leur accord), rapport mensuel chiffré, recommandations pour tes fiches produits.

### Garantie
Reprendre les deux garanties de la section 2, formulées simplement et mises en valeur.

### Bloc « audit gratuit » (ancre `#audit`)
Titre : Découvre combien de ventes ta boutique perd chaque mois.
Texte : Remplis ce formulaire en 1 minute, on analyse ta boutique gratuitement et on te montre où partent tes ventes.
Bouton : Réserver mon audit gratuit (ouvre le formulaire Google, voir section 5).

### Packs et prix (section `#packs`, placée juste avant le formulaire)
Titre : Choisis ton vendeur. Sous-titre : Mise en ligne en 7 jours, sans engagement de durée.

| | Essentiel | Croissance (badge « Recommandé ») | Scale |
|---|---|---|---|
| Prix | 280 €/mois | 480 €/mois | 1 780 €/mois |
| Pour qui | Tester un vendeur IA sur ton site | Récupérer un maximum de ventes perdues | Boutiques à fort trafic ou multi-boutiques |
| Vendeur IA 24h/24 sur ton catalogue (tailles, délais, retours) | Oui | Oui | Oui |
| Conversations par mois | Jusqu'à 500 | Jusqu'à 3 000 | Illimitées |
| Déclenchement au bon moment (fiche produit, sortie de page, panier) | Non | Oui | Oui |
| Relance des paniers abandonnés par WhatsApp et email | Non | Oui | Oui |
| A/B test et rapport des ventes récupérées | Rapport simple | Oui, mensuel | Oui, hebdomadaire |
| Rapport des objections de tes clients | Non | Oui | Oui |
| Audit conversion mensuel et recommandations sur tes fiches produits | Non | Non | Oui |
| Plusieurs langues ou plusieurs boutiques | Non | Non | Oui |
| Interlocuteur dédié | Non | Non | Oui, réponse sous 24 h |
| Mise en ligne | 7 jours | 7 jours | 5 jours |
| Garantie « rentabilisé en 30 jours ou mois offert » | Non | Oui | Oui |

Sous le tableau, une option complémentaire : « Refonte de 10 fiches produits à partir des objections de tes clients : 290 € ».

Règles d'affichage : pricing « pop-corn » renforcé (à respecter, sans changer les prix) :
- **Aucune promotion** : pas de réduction, pas de prix barré, pas de « X mois offerts », pas de frais « offerts », pas de bascule mensuel/annuel. Uniquement les prix mensuels fixes : 280 €, 480 €, 1 780 €. Les garanties (« mois offert » si non rentabilisé ou si retard de mise en ligne) restent : ce sont des garanties, pas des promotions.
- **Ordre des cartes** : Scale à gauche, Croissance au centre, Essentiel à droite, sur ordinateur comme sur mobile (sur mobile, empilées dans cet ordre). Le visiteur voit d'abord 1 780 € : c'est l'ancre, et 480 € paraît petit juste après.
- **Croissance est la vedette** : au centre, légèrement plus grande, bordure marquée, badge « Recommandé ». Ne jamais écrire « le plus choisi » ni « le plus populaire » tant qu'il n'y a pas de clients.
- **Effet pop-corn par le prix unitaire** : afficher sous chaque prix le coût par conversation. Essentiel : 0,56 € par conversation (280 € / 500). Croissance : 0,16 € par conversation (480 € / 3 000), avec la mention « 3,5 fois moins cher par conversation qu'Essentiel ». Scale : « conversations illimitées ». Comme au cinéma, le grand format paraît être la vraie bonne affaire.
- **Rendre l'écart minuscule** : sur la carte Croissance, écrire « Seulement 200 € de plus qu'Essentiel : 6 fois plus de conversations, la relance des paniers et la garantie. »
- **Aversion à la perte sur Essentiel** : lister toutes les lignes du comparatif, y compris celles qu'Essentiel n'a pas, avec une croix visible et un texte grisé (« Relance des paniers abandonnés », « Garantie rentabilisé ou mois offert »). Le visiteur doit voir ce qu'il perd.
- **Recadrage quotidien** : Croissance « soit 16 € par jour, moins qu'une vente perdue ». Scale « soit 59 € par jour, moins qu'un salarié à temps plein pour répondre à tes clients ».
- **Garantie répétée** juste sous le bouton de Croissance et de Scale : « Rentabilisé en 30 jours ou mois offert ».
- Chaque carte a un bouton « Choisir Essentiel », « Choisir Croissance », « Choisir Scale » qui ouvre le formulaire Google.
- Les prix et contenus des packs sont stockés dans une seule source de données, faciles à modifier.

### À propos / pourquoi Autoflow
Court paragraphe crédible (pas encore de clients) : une agence spécialisée dans les agents comportementaux, qui applique aux boutiques en ligne ce qu'un bon vendeur fait en magasin. Emplacement prévu pour de futurs témoignages et études de cas, masqué tant qu'il n'y en a pas.

### FAQ
- L'agent peut-il dire n'importe quoi ? Non : il ne répond qu'avec les données de ta boutique. S'il ne sait pas, il passe la main à un humain.
- Mes clients sauront-ils que c'est une IA ? Oui, c'est indiqué clairement, c'est une obligation légale et ça n'empêche pas de vendre.
- Ça marche avec mon thème Shopify ? L'agent s'installe sur tous les thèmes Shopify.
- Et les données de mes clients (RGPD) ? Données hébergées et traitées conformément au RGPD ; les relances WhatsApp et SMS ne concernent que les clients qui ont donné leur accord.
- Combien de temps ça me prend ? Un appel d'une heure pour l'audit, puis quelques validations pendant la semaine de configuration.
- Et si ça ne rapporte rien ? Voir la garantie.
- Je peux changer de pack ? Oui, à tout moment, sans engagement de durée.
- Pouvez-vous garantir un taux de conversion ? Non, et personne d'honnête ne le peut. On garantit que l'agent rapporte plus qu'il ne coûte, sinon le mois est offert.

### Appel final
Titre : Combien de ventes ta boutique perd-elle cette nuit ? Bouton : Réserver mon audit gratuit (ouvre le formulaire Google).

### Pied de page
Logo, email de contact contact.autoflow1@gmail.com, mentions légales, politique de confidentialité.

## 5. Contraintes techniques

- Page unique, statique, très rapide. HTML/CSS/JS simple ou Astro ; pas de framework lourd sans raison.
- **Mobile d'abord** : la majorité des e-commerçants la verront sur téléphone. Tester à 375 px de large.
- **Formulaire d'audit gratuit : lien Google Forms** : https://forms.gle/VtS7yDsHmgn86Yu2A
  - Stocker ce lien dans une seule variable de configuration (`AUDIT_FORM_URL`).
  - **Tous** les boutons « Réserver mon audit gratuit » (hero, bloc `#audit`, appel final) ouvrent ce lien dans un nouvel onglet (`target="_blank"` et `rel="noopener"`).
  - Les boutons des packs (« Choisir Essentiel », « Choisir Croissance », « Choisir Scale ») ouvrent aussi ce même lien. Pas de pré-sélection du pack pour l'instant : le prospect choisit son pack dans le formulaire.
  - Ne pas intégrer le formulaire en iframe : un lien court forms.gle ne s'intègre pas de façon fiable, et le lien direct est plus simple à maintenir.
  - Après la mise en ligne, cliquer sur chaque bouton pour vérifier qu'il ouvre bien le formulaire, puis faire un envoi test.
- SEO de base : balise title, meta description, Open Graph (image avec le logo), balises Hn propres, favicon (triangle ou « A▲ »).
- Accessibilité : contrastes suffisants, focus clavier visible, respect de prefers-reduced-motion, textes alternatifs.
- Analytics respectueux du RGPD (Plausible ou équivalent), sans bandeau cookies si possible.
- Déploiement sur Vercel ou Netlify, avec le domaine d'Autoflow (disponibilité à vérifier).

## 6. Règles de contenu à ne jamais enfreindre

- Ne jamais inventer de clients, témoignages, logos de marques, chiffres de résultats ou statistiques. Tout élément de preuve absent reste un emplacement vide clairement marqué.
- Pas de fausse urgence ni de fausse rareté (« plus que 2 places ») : ça fait arnaque sur ce marché.
- Pas de liens sortants inutiles : un seul objectif, le formulaire d'audit, avec le même bouton répété.
- Tutoiement partout, phrases courtes, voix active.
