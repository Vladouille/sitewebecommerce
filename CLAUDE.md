# Autoflow — brief de la landing page (version coachs)

Ce fichier donne à Claude Code tout le contexte du projet. Lis-le entièrement avant de coder. Il **remplace entièrement** l'ancienne version destinée aux e-commerçants : reprends la même base technique et le même style, mais tous les textes, l'offre et les packs changent.

## 1. Le projet

Autoflow remplit l'agenda des coachs en ligne d'**appels de vente qualifiés**. Un agent IA répond à chaque message privé et à chaque commentaire Instagram en quelques secondes, 24h/24, qualifie le prospect (objectif, motivation, budget) et réserve l'appel dans l'agenda du coach. Des setters humains relancent les prospects hésitants.

- **Cible (avatar précis)** : coachs en ligne en transformation physique (perte de poids, prise de muscle, nutrition) qui vendent un accompagnement entre 1 500 et 5 000 € via un appel de vente, font déjà entre 10 000 et 50 000 € par mois, publient du contenu, mais n'ont pas assez d'appels qualifiés dans leur agenda.
- **Désir profond du client** : signer plus de clients chaque mois, avoir des revenus prévisibles, et ne plus perdre de prospects faute de réponse rapide.
- **On ne vend pas de l'IA, on vend des appels qualifiés et des clients signés.** Le mot « IA » n'est jamais l'argument principal.
- **Objectif unique de la page** : faire remplir le formulaire de demande d'audit gratuit (lien Google Forms, section 5). Pas de paiement en ligne : le paiement se fait après l'audit.
- **Email de l'entreprise** : contact.autoflow1@gmail.com

## 2. L'offre (à reprendre fidèlement)

| Brique | Contenu |
|---|---|
| Promesse | On remplit ton agenda d'appels de vente avec des prospects qualifiés, prêts à investir dans ton accompagnement. |
| Délai | Système en place en 7 jours, premiers appels réservés dans les 14 jours. |
| Garantie | Si l'objectif d'appels qualifiés fixé ensemble lors de l'audit n'est pas atteint le premier mois, on continue gratuitement jusqu'à l'atteindre. Si le système n'est pas en ligne au jour 7, le premier mois n'est pas facturé. |
| Bénéfices | Plus aucun message laissé sans réponse, même la nuit. Un agenda rempli et prévisible. Tu ne fais plus que tes appels de vente et ton accompagnement. Chaque mois, tu sais combien d'appels et de clients le système t'a apportés. |

**Ce qu'on ne garantit pas** (à dire clairement dans la FAQ) : un chiffre de revenu ou un nombre de clients signés, car la signature dépend aussi de l'offre et de l'appel de vente du coach. On garantit des appels qualifiés, qu'on mesure et qu'on contrôle.

## 3. Identité visuelle (inchangée)

- **Logo** : fichier `AUTOFLOW.png` (dans `public/` ou `assets/`). « AUTOFLOW » en capitales à empattements, noir sur blanc, suivi d'un petit triangle noir plein (symbole de croissance). Logo validé : ne pas le redessiner.
- **Direction** : dériver le design du logo. Monochrome noir et blanc, sobre, premium, éditorial. Serif pour les titres (proche du logo), sans-serif lisible pour le texte courant.
- **Un seul élément marquant** : le hero montre une vraie conversation Instagram entre un prospect et l'assistant Autoflow du coach, qui se termine par un appel réservé (voir section 4). C'est lui qui « montre au lieu de dire ».
- Le triangle du logo peut servir de motif discret (puces, indicateur de croissance).
- **À éviter** : fond crème + accent terracotta, fond noir + accent vert acide, cartes arrondies identiques avec ombres grises, dégradés décoratifs, labels en capitales au-dessus de chaque titre, animations d'entrée sur chaque section, flèches « → » ajoutées aux boutons, photos de corps avant/après.
- Suivre le skill frontend-design s'il est disponible : plan de design (palette en 4 à 6 hex, typographies, wireframe) avant de coder.

## 4. Structure et textes de la page

L'ordre suit les questions que se pose le prospect. Tutoiement partout. Les textes sont des brouillons : on peut les resserrer, sans changer les promesses.

### Hero
- **Titre** : Tes prospects t'écrivent. Autoflow les transforme en appels de vente.
- **Sous-titre** : Chaque message privé et chaque commentaire reçoit une réponse en quelques secondes, 24h/24. Les prospects sont qualifiés, l'appel est réservé dans ton agenda. Système en place en 7 jours.
- **Bouton principal** : Réserver mon audit gratuit (ouvre le formulaire Google)
- **Visuel** : maquette d'une conversation Instagram, par exemple :
  - Prospect (23 h 41) : « Salut ! C'est combien ton coaching ? »
  - Assistant : « Hello ! Avant de te parler du prix, dis-moi ton objectif : perdre du poids, prendre du muscle, ou les deux ? »
  - Prospect : « Perdre 10 kilos avant l'été, j'ai déjà tout essayé. »
  - Assistant : « Tu es exactement le type de profil que [Prénom du coach] accompagne. Le plus simple, c'est un appel de 20 minutes avec lui pour voir si c'est fait pour toi. Demain 18 h ou jeudi 12 h ? »
  - Prospect : « Demain 18 h 👍 »
  - Bandeau : « Appel réservé »
  (conversation d'exemple, à présenter comme telle)

### Le problème
Tu passes des heures à créer du contenu. Les messages arrivent, mais tu réponds entre deux séances, parfois le lendemain. Pendant ce temps, le prospect refroidit, scrolle, et finit chez un autre coach. Ce n'est pas un problème d'audience : c'est un problème de réponse.

### Avant / avec Autoflow
- **Avant** : des messages qui attendent des heures, des « c'est combien ? » qui ne mènent nulle part, des relances oubliées, un setter payé à la commission qui répond quand il peut, un agenda vide certaines semaines.
- **Avec Autoflow** : chaque prospect reçoit une réponse en quelques secondes, les curieux sont filtrés, les prospects motivés réservent directement leur appel, les hésitants sont relancés, et tu sais chaque mois combien d'appels le système t'a apportés.

### Comment ça marche (vraie séquence, la numérotation est justifiée)
1. **Audit (jours 1-2)** : on analyse ton compte, tes messages et ton offre, et on fixe ensemble ton objectif d'appels.
2. **Configuration (jours 3-5)** : on entraîne l'assistant sur ton offre, ta façon de parler et tes critères de qualification.
3. **Mise en ligne (jour 7)** : l'assistant répond à tes messages et commentaires, qualifie et réserve les appels dans ton agenda.
4. **Chaque mois** : rapport des conversations, des appels réservés et des objections de tes prospects, puis optimisation.

### Ce que tu reçois
Assistant qui répond aux messages privés et aux commentaires Instagram, qualification selon tes critères, réservation directe dans ton agenda, relance des prospects hésitants, rapport mensuel chiffré (conversations, appels réservés, objections).

### Garantie
Reprendre les deux garanties de la section 2, formulées simplement et mises en valeur.

### Packs et prix (section `#packs`, juste avant le bloc audit)
Titre : Choisis ton système. Sous-titre : Mise en place en 7 jours, sans engagement de durée.

| | Essentiel | Croissance (badge « Recommandé ») | Scale |
|---|---|---|---|
| Prix | 280 €/mois | 480 €/mois | 1 780 €/mois |
| Pour qui | Tester le système sur tes messages privés | Remplir ton agenda chaque semaine | Coachs à forte audience ou avec une équipe |
| Réponse en quelques secondes aux messages privés, 24h/24 | Oui | Oui | Oui |
| Réponse aux commentaires qui mènent en message privé | Non | Oui | Oui |
| Conversations par mois | Jusqu'à 300 | Jusqu'à 1 500 | Illimitées |
| Qualification et réservation directe dans ton agenda | Oui | Oui | Oui |
| Relance des prospects hésitants | Non | Oui | Oui |
| Setter humain pour les conversations délicates | Non | Non | Oui |
| Rapport mensuel appels et objections | Rapport simple | Oui | Oui, hebdomadaire |
| Interlocuteur dédié | Non | Non | Oui, réponse sous 24 h |
| Mise en place | 7 jours | 7 jours | 5 jours |
| Garantie « objectif d'appels atteint ou on continue gratuitement » | Non | Oui | Oui |

Sous le tableau, une option : « Script de vente pour tes appels, construit à partir des objections de tes prospects : 290 € ».

Règles d'affichage : pricing « pop-corn » renforcé (sans changer les prix) :
- **Aucune promotion** : pas de réduction, pas de prix barré, pas de « X mois offerts », pas de frais « offerts », pas de bascule mensuel/annuel. Uniquement les prix mensuels fixes : 280 €, 480 €, 1 780 €. Les garanties restent : ce sont des garanties, pas des promotions.
- **Ordre des cartes** : Scale à gauche, Croissance au centre, Essentiel à droite (sur mobile, empilées dans cet ordre). Le visiteur voit d'abord 1 780 € : c'est l'ancre.
- **Croissance est la vedette** : au centre, légèrement plus grande, bordure marquée, badge « Recommandé ». Ne jamais écrire « le plus choisi » ni « le plus populaire » tant qu'il n'y a pas de clients.
- **Effet pop-corn par le prix unitaire** : sous chaque prix, le coût par conversation. Essentiel : 0,93 € par conversation (280 € / 300). Croissance : 0,32 € par conversation (480 € / 1 500), avec « 3 fois moins cher par conversation qu'Essentiel ». Scale : « conversations illimitées ».
- **Rendre l'écart minuscule** : sur la carte Croissance : « Seulement 200 € de plus qu'Essentiel : 5 fois plus de conversations, les commentaires, la relance des hésitants et la garantie. »
- **Recadrage en résultat** : sous Croissance : « Un seul client signé à 1 500 € rembourse plus de 3 mois. » Sous Scale : « Moins qu'un setter à temps plein, sans jamais dormir. »
- **Aversion à la perte sur Essentiel** : lister toutes les lignes, y compris celles qu'Essentiel n'a pas, avec une croix visible et un texte grisé.
- **Garantie répétée** sous les boutons de Croissance et de Scale.
- Chaque carte a un bouton « Choisir Essentiel », « Choisir Croissance », « Choisir Scale » qui ouvre le formulaire Google.
- Prix et contenus des packs stockés dans une seule source de données, faciles à modifier.

### Bloc « audit gratuit » (ancre `#audit`)
Titre : Découvre combien d'appels ton compte laisse passer chaque mois.
Texte : Remplis ce formulaire en 1 minute. On analyse ton compte gratuitement et on te montre combien de prospects tu perds, et pourquoi.
Bouton : Réserver mon audit gratuit (ouvre le formulaire Google).

### À propos / pourquoi Autoflow
Court paragraphe crédible (pas encore de clients) : une agence spécialisée dans les agents comportementaux, qui fait pour les coachs ce qu'un excellent setter ferait, mais en quelques secondes et à toute heure. Emplacement prévu pour de futurs témoignages et études de cas, masqué tant qu'il n'y en a pas.

### FAQ
- L'assistant va-t-il parler à ma place n'importe comment ? Non : il est entraîné sur ton offre et ta façon de parler, et respecte tes critères. Pour une question délicate, il te passe la main.
- Mes prospects sauront-ils que c'est un assistant IA ? Oui, c'est indiqué clairement : c'est une obligation légale, et ça n'empêche pas de réserver des appels.
- Est-ce que mon compte Instagram risque quelque chose ? On passe uniquement par les outils officiels de Meta pour la messagerie, jamais par des robots non autorisés.
- Je dois changer ma façon de faire du contenu ? Non. Tu continues à publier, on transforme simplement tes messages en appels.
- Combien de temps ça me prend ? Un appel d'une heure pour l'audit, puis quelques validations pendant la semaine de configuration.
- Je peux changer de pack ? Oui, à tout moment, sans engagement de durée.
- Pouvez-vous garantir un nombre de clients ou un revenu ? Non, et personne d'honnête ne le peut. On garantit ton objectif d'appels qualifiés, sinon on continue gratuitement.

### Appel final
Titre : Combien de prospects attendent ta réponse en ce moment ? Bouton : Réserver mon audit gratuit (ouvre le formulaire Google).

### Pied de page
Logo, email de contact contact.autoflow1@gmail.com, liens vers les trois pages légales : Mentions légales, Politique de confidentialité, Conditions générales de vente (section 7).

## 5. Contraintes techniques

- Reprendre la base technique existante : page unique, statique, très rapide (HTML/CSS/JS simple ou Astro).
- **Mobile d'abord** : les coachs vivent sur leur téléphone. Tester à 375 px de large.
- **Formulaire d'audit gratuit : lien Google Forms** : https://forms.gle/VtS7yDsHmgn86Yu2A
  - Stocker ce lien dans une seule variable de configuration (`AUDIT_FORM_URL`) : le fondateur pourra le remplacer par un nouveau formulaire adapté aux coachs.
  - **Tous** les boutons « Réserver mon audit gratuit » et les boutons des packs ouvrent ce lien dans un nouvel onglet (`target="_blank"` et `rel="noopener"`).
  - Pas d'intégration en iframe.
  - Après la mise en ligne, cliquer sur chaque bouton pour vérifier qu'il ouvre bien le formulaire.
- SEO de base : balise title, meta description, Open Graph (image avec le logo), balises Hn propres, favicon (triangle ou « A▲ »).
- Accessibilité : contrastes suffisants, focus clavier visible, respect de prefers-reduced-motion, textes alternatifs.
- Analytics respectueux du RGPD (Plausible ou équivalent), sans bandeau cookies si possible.
- Déploiement sur Vercel ou Netlify, avec le domaine d'Autoflow.

## 6. Règles de contenu à ne jamais enfreindre

- Ne jamais inventer de clients, témoignages, captures de résultats, nombres d'appels ou chiffres de revenus. Tout élément de preuve absent reste un emplacement vide clairement marqué.
- Pas de fausse urgence ni de fausse rareté.
- Pas de promesse de revenu (« fais 20 k€ par mois ») : on promet des appels qualifiés.
- Pas de photos avant/après de corps.
- Pas de liens sortants inutiles : un seul objectif, le formulaire d'audit, avec le même bouton répété.
- Tutoiement partout, phrases courtes, voix active.

## 7. Pages légales

Créer trois pages séparées, dans le même style que la landing (même en-tête, même pied de page), lisibles sur mobile, avec la date de dernière mise à jour en haut : `/mentions-legales`, `/confidentialite`, `/cgv`.

Règles impératives :
- **Ne jamais inventer** d'informations d'identification (nom, adresse, SIRET, téléphone, hébergeur). Toute information inconnue reste sous la forme `[À COMPLÉTER : ...]`, bien visible.
- En bas de chaque page, en commentaire HTML (non visible) : « Modèle à faire valider par un professionnel du droit ».

### 7.1 Mentions légales

**Éditeur du site**
- Nom commercial : Autoflow
- Exploitant : [À COMPLÉTER : prénom et nom], entrepreneur individuel (micro-entreprise)
- Adresse : [À COMPLÉTER : adresse postale ou adresse de domiciliation]
- SIRET : [À COMPLÉTER]
- Email : contact.autoflow1@gmail.com
- Téléphone : [À COMPLÉTER]
- TVA : TVA non applicable, article 293 B du Code général des impôts [à retirer si l'entreprise devient assujettie à la TVA]
- Directeur de la publication : [À COMPLÉTER : prénom et nom]

**Hébergement** : [À COMPLÉTER selon l'hébergeur retenu : raison sociale, adresse et téléphone, par exemple Vercel Inc. ou Netlify Inc.]

**Propriété intellectuelle** : le nom Autoflow, le logo, les textes et les visuels du site sont la propriété de l'éditeur. Toute reproduction sans autorisation écrite est interdite.

**Responsabilité** : l'éditeur s'efforce de fournir des informations exactes mais ne peut garantir l'absence d'erreurs. Les liens vers des sites tiers (dont le formulaire Google) n'engagent pas sa responsabilité quant à leur contenu.

**Données personnelles** : voir la page Politique de confidentialité.

### 7.2 Politique de confidentialité

**Responsable du traitement** : Autoflow, [À COMPLÉTER : prénom, nom et adresse], contact.autoflow1@gmail.com.

**Données collectées** : via le formulaire de demande d'audit (hébergé par Google Forms) : les informations saisies par le coach (prénom, email, compte Instagram, informations sur son activité, pack qui l'intéresse, message facultatif, consentement). Le site lui-même ne collecte aucune autre donnée personnelle.

**Finalités** : répondre à la demande d'audit, recontacter le coach au sujet de l'offre Autoflow et suivre la relation commerciale.

**Base légale** : le consentement donné dans le formulaire, puis l'intérêt légitime d'Autoflow à assurer le suivi commercial de la demande.

**Destinataires** : uniquement Autoflow. Les réponses sont stockées sur les services de Google (Google Forms et Google Sheets), qui agit comme sous-traitant ; ces données peuvent être transférées hors de l'Union européenne, avec les garanties prévues par Google (clauses contractuelles types). Aucune donnée n'est vendue ni cédée.

**Durée de conservation** : 3 ans à compter du dernier contact, puis suppression. Pour les clients, pendant la durée du contrat puis selon les obligations légales (notamment comptables).

**Tes droits** : accès, rectification, effacement, opposition, limitation et portabilité, ainsi que le retrait de ton consentement à tout moment, en écrivant à contact.autoflow1@gmail.com (réponse sous un mois). Tu peux aussi saisir la CNIL (cnil.fr).

**Cookies** : le site n'utilise pas de cookies publicitaires. [Si un outil de mesure d'audience est installé : préciser lequel ; si c'est un outil sans cookie comme Plausible, l'indiquer ; sinon, ajouter un bandeau de consentement.]

### 7.3 Conditions générales de vente (clients professionnels)

**1. Objet** : fourniture par Autoflow d'un service d'assistant conversationnel de qualification et de prise de rendez-vous pour coachs, à destination exclusivement de clients professionnels.

**2. Offres** : trois formules mensuelles, Essentiel, Croissance et Scale, dont le contenu est décrit sur le site au jour de la souscription. Toute prestation complémentaire (par exemple le script de vente) fait l'objet d'un devis.

**3. Prix** : 280 €, 480 € et 1 780 € par mois selon la formule, [HT / TVA non applicable, art. 293 B du CGI]. Autoflow peut modifier ses prix en prévenant le client au moins 30 jours avant l'échéance suivante.

**4. Commande** : la souscription intervient après l'audit, par acceptation écrite (email ou signature) d'une proposition commerciale reprenant la formule choisie et l'objectif d'appels qualifiés.

**5. Durée et résiliation** : abonnement mensuel sans engagement de durée, renouvelé automatiquement. Résiliation à tout moment par email, avec effet à la fin du mois en cours.

**6. Paiement** : mensuel, d'avance, [À COMPLÉTER : moyen de paiement]. En cas de retard : pénalités au taux légal et indemnité forfaitaire de 40 € pour frais de recouvrement ; le service peut être suspendu après relance restée sans effet.

**7. Mise en ligne et garanties** :
- Mise en ligne en 7 jours ouvrés (5 pour Scale) à compter de la réception des accès et informations nécessaires. En cas de retard imputable à Autoflow, le premier mois n'est pas facturé.
- Garantie « objectif d'appels » (formules Croissance et Scale) : si l'objectif d'appels qualifiés défini par écrit lors de l'audit n'est pas atteint au terme du premier mois, Autoflow poursuit le service sans facturation jusqu'à ce qu'il soit atteint. La garantie suppose que le client maintienne son activité de publication habituelle, laisse l'assistant actif et honore les appels réservés.
- Autoflow ne garantit ni un nombre de clients signés ni un chiffre d'affaires.

**8. Obligations du client** : fournir les accès nécessaires (compte professionnel Instagram, agenda), des informations exactes sur son offre et ses critères de qualification, et informer Autoflow de tout changement. Le client reste seul responsable de son offre, de ses prix, de ses promesses commerciales et de son accompagnement.

**9. Conformité des plateformes** : Autoflow utilise uniquement les outils de messagerie officiels et autorisés par Meta. Le client s'engage à respecter les conditions d'utilisation d'Instagram. Autoflow n'est pas responsable des décisions de Meta (restrictions, suspensions) ni des interruptions des services tiers.

**10. Responsabilité** : obligation de moyens. Responsabilité limitée aux montants payés par le client au cours des 3 derniers mois.

**11. Données personnelles** : pour les données des prospects du coach, Autoflow agit comme sous-traitant du client au sens du RGPD. Un accord de traitement des données est annexé à la proposition commerciale. L'assistant indique clairement aux prospects qu'ils échangent avec une IA.

**12. Propriété** : les contenus et la marque du coach restent sa propriété. La technologie, les méthodes et les modèles de l'assistant restent la propriété d'Autoflow.

**13. Droit applicable** : droit français. En cas de litige, après tentative de résolution amiable, compétence des tribunaux du ressort du siège d'Autoflow.
