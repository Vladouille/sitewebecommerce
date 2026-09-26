# Autoflow — brief de la landing page

Ce fichier donne à Claude Code tout le contexte du projet. Lis-le entièrement avant de coder.

## 1. Le projet

Autoflow est une agence qui installe un **vendeur IA** sur les boutiques Shopify. L'agent répond aux questions des visiteurs (tailles, délais, retours, compatibilité), les rassure, les guide vers le panier, et relance les paniers abandonnés par WhatsApp et email.

- **Cible** : e-commerçants Shopify qui font entre 30 000 et 300 000 € de chiffre d'affaires par mois, qui paient de la publicité mais convertissent mal.
- **Désir profond du client** : gagner plus avec le même budget pub (baisser son coût d'acquisition).
- **On ne vend pas de l'IA, on vend des ventes récupérées.** Le mot « IA » n'est jamais l'argument principal.
- **Objectif unique de la page** : faire réserver un appel (audit offert). Pas de paiement en ligne pour l'instant.

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
- **Bouton principal** : Réserver mon audit offert
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

### Prix
| | Essentiel | Croissance (recommandé) | Premium |
|---|---|---|---|
| Prix | 490 €/mois | 790 €/mois | 2 490 €/mois |
| Vendeur IA sur le site | Oui | Oui | Oui |
| Déclenchement proactif | Non | Oui | Oui |
| Relance paniers WhatsApp + email | Non | Oui | Oui |
| Rapport mensuel ventes et objections | Oui | Oui | Oui |
| A/B test et optimisation | Non | Mensuelle | Hebdomadaire |
| Recommandations fiches produits | Non | Non | Oui, suivi dédié |

Mentions : frais de mise en place offerts aux premiers clients. 2 mois offerts en paiement annuel. Les prix sont encore en test : les rendre faciles à modifier (une seule source de données).

### À propos / pourquoi Autoflow
Court paragraphe crédible (pas encore de clients) : une agence spécialisée dans les agents comportementaux, qui applique aux boutiques en ligne ce qu'un bon vendeur fait en magasin. Emplacement prévu pour de futurs témoignages et études de cas, masqué tant qu'il n'y en a pas.

### FAQ
- L'agent peut-il dire n'importe quoi ? Non : il ne répond qu'avec les données de ta boutique. S'il ne sait pas, il passe la main à un humain.
- Mes clients sauront-ils que c'est une IA ? Oui, c'est indiqué clairement, c'est une obligation légale et ça n'empêche pas de vendre.
- Ça marche avec mon thème Shopify ? L'agent s'installe sur tous les thèmes Shopify.
- Et les données de mes clients (RGPD) ? Données hébergées et traitées conformément au RGPD ; les relances WhatsApp et SMS ne concernent que les clients qui ont donné leur accord.
- Combien de temps ça me prend ? Un appel d'une heure pour l'audit, puis quelques validations pendant la semaine de configuration.
- Et si ça ne rapporte rien ? Voir la garantie.
- Pouvez-vous garantir un taux de conversion ? Non, et personne d'honnête ne le peut. On garantit que l'agent rapporte plus qu'il ne coûte, sinon le mois est offert.

### Appel final
Titre : Combien de ventes ta boutique perd-elle cette nuit ? Bouton : Réserver mon audit offert.

### Pied de page
Logo, email de contact, mentions légales, politique de confidentialité.

## 5. Contraintes techniques

- Page unique, statique, très rapide. HTML/CSS/JS simple ou Astro ; pas de framework lourd sans raison.
- **Mobile d'abord** : la majorité des e-commerçants la verront sur téléphone. Tester à 375 px de large.
- Le bouton de réservation ouvre un calendrier (Cal.com ou Calendly, lien à fournir). Prévoir une variable pour ce lien.
- SEO de base : balise title, meta description, Open Graph (image avec le logo), balises Hn propres, favicon (triangle ou « A▲ »).
- Accessibilité : contrastes suffisants, focus clavier visible, respect de prefers-reduced-motion, textes alternatifs.
- Analytics respectueux du RGPD (Plausible ou équivalent), sans bandeau cookies si possible.
- Déploiement sur Vercel ou Netlify, avec le domaine d'Autoflow (disponibilité à vérifier).

## 6. Règles de contenu à ne jamais enfreindre

- Ne jamais inventer de clients, témoignages, logos de marques, chiffres de résultats ou statistiques. Tout élément de preuve absent reste un emplacement vide clairement marqué.
- Pas de fausse urgence ni de fausse rareté (« plus que 2 places ») : ça fait arnaque sur ce marché.
- Pas de liens sortants inutiles : un seul objectif, la réservation d'appel, avec le même bouton répété.
- Tutoiement partout, phrases courtes, voix active.
