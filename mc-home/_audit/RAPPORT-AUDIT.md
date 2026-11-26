# Audit du site actuel mc-home.fr — étape 1

Date : 26/11/2026. Contenu brut des pages : `contenu-site-actuel.md`.

## 0. Blocage : palette et logo non récupérés

- **HTTPS** : le serveur présente un certificat émis pour `www.e-monsith.com` (plateforme e-monsite), pas pour mc-home.fr. Tout client correct le refuse.
- **HTTP** : le proxy réseau de l'environnement ne transmet que le HTTPS.
- **Résultat** : texte des 13 pages récupéré (par lecture distante), mais **ni HTML, ni CSS, ni images, ni logo**. Je ne peux donc pas extraire la palette. Conformément à la consigne, je m'arrête ici et je demande des fichiers (section 6).

Conséquence business à noter pour le client : aujourd'hui, toute personne qui tape `https://mc-home.fr` voit l'alerte « Votre connexion n'est pas privée ». Le nouveau site devra avoir son propre certificat (Let's Encrypt, gratuit chez presque tous les hébergeurs) **et** il faudra sortir le domaine d'e-monsite (DNS). C'est souvent le point qui bloque une mise en ligne : qui détient l'accès au registrar du domaine ? À demander au client dès maintenant.

## 1. Pages existantes (13)

| Rubrique | Page | État |
|---|---|---|
| Accueil | `/` | 3 phrases + widget Agenda vide |
| MC Home | `/pages/mc-home/` | **vide** |
| | Qui sommes-nous ? | statut juridique faux |
| | Nos atouts | contient 4 des 9 points forts, enterrés |
| Services | `/pages/services/` | **vide** |
| | Ménage-repassage (`menage.html`) | 2 phrases, aucun détail |
| | Garde d'enfants + de 3 ans | correct |
| | Garde d'enfants - de 3 ans | correct |
| | Assistance personnes âgées / handicap | correct |
| Tarifs | `/pages/tarifs/` | **vide** (+ widget Newsletter) |
| | Tarifs des prestations | 31 / 31 / 27 € TTC |
| | Vos avantages fiscaux | règle fiscale périmée |
| FAQ | Foire aux questions | 4 questions, prix contradictoire |
| Contact | `/contact/` | email, 2 téléphones, formulaire |

Correspondance avec le nouveau plan : les deux pages de garde d'enfants fusionnent dans `services/garde-enfants.html` (deux sections : moins de 3 ans / plus de 3 ans). « Tarifs » et « Vos avantages fiscaux » fusionnent dans `tarifs-et-aides.html`. « Nos atouts » est éclaté sur l'accueil et `qui-sommes-nous.html`. Les 3 pages index vides disparaissent.

## 2. Images réutilisables

Inconnu : je n'ai pas pu lister les images. Seule certitude : le logo existe à `/medias/site/logos/logo-mc-home.png`. Les sites e-monsite de 2014 utilisent en général des photos de banque d'images ou du thème : il y a de fortes chances qu'aucune ne soit réutilisable (droits, qualité). Prévoir des emplacements « PHOTO RÉELLE À FOURNIR ».

## 3. Incohérences et erreurs relevées

Celles du brief, toutes confirmées sur le site :
1. FAQ « 23 € de l'heure » contre 31 € sur la page tarifs.
2. « Réduction fiscale » au lieu de « crédit d'impôt ».
3. « Conseil Général » au lieu de « Conseil départemental ».
4. « Jeune S.A.S., Présidente, Directrice Générale » au lieu de « SARL, co-gérantes ».
5. Widget « Agenda — Aucun élément à afficher » sur toutes les pages.

Celles que j'ai trouvées en plus :
6. **Règle fiscale périmée** : « Si vous n'êtes pas imposable **et toujours en activité**, les impôts vous remboursent ». La condition d'activité a été supprimée en 2017 : un retraité non imposable est remboursé lui aussi. Or c'est précisément le public senior. On corrige.
7. **FAQ « tarifs variables pour le reste de nos services »** : contredit le tarif fixe de 27 € pour l'aide aux personnes âgées. À supprimer, ou à faire confirmer.
8. **Tarif de la garde des moins de 3 ans non précisé** : la page tarifs dit « Garde d'enfants : 31 € » sans distinguer. → `<!-- À CONFIRMER CLIENT -->`.
9. **Adresse incohérente en ligne** : maboussoleaidants.fr indique « 7 rue du Chevalier Martin » (le site et l'annuaire officiel : 9). Ça nuit au référencement local (NAP). Le client doit la faire corriger.
10. **Zone** : « Nice et ses environs » sur Qui sommes-nous, alors que l'entreprise est à Cagnes. Le nouveau site dira « Cagnes-sur-Mer, Nice et environs ».
11. **Widget Newsletter** sans contenu derrière : à supprimer.
12. Fautes : « vigilence », « agées », « réhausseurs », « chacun de nos client ».
13. **Statut actuel** : l'annuaire officiel classe MC Home en « Service autonomie à domicile (aide) », gestionnaire « SARL MC Home ». C'est un indice d'autorisation départementale, pas une preuve. On garde « agréée qualité depuis 2014 » + `<!-- STATUT AUTORISATION À CONFIRMER -->`.

## 4. Deux risques sur le prix affiché et le calculateur (à trancher avant de coder)

- **Plafond du crédit d'impôt** : 12 000 € de dépenses par an (+1 500 € par enfant à charge ou par membre du foyer de plus de 65 ans, maximum 15 000 € ; 20 000 € en cas d'invalidité). Exemple : 10 h/semaine d'aide à 27 € font environ 14 000 € par an. Au-delà du plafond, le « 13,50 €/h » devient faux. **Je propose que le calculateur applique le plafond de base de 12 000 €** et affiche une phrase sur les majorations. Sinon, une famille découvre l'écart sur son avis d'imposition et c'est MC Home qu'elle accuse.
- **Aides déduites** : l'APA et la PCH se déduisent avant le crédit d'impôt. Le « 13,50 € » ne vaut que sans aide. Une mention courte sous le prix suffit (« hors APA/PCH, qui réduisent encore le reste à charge »).

## 5. Repère concurrentiel (public, non repris sur le site)

Tarifs trouvés en ligne pour l'aide à domicile dans le secteur : 26,44 € à 33,50 € TTC/h (Home Services Nice, Harmonie Compagnie, AMAPA, ADSH06). Avec 27 €, MC Home est dans le bas de la fourchette pour l'aide aux seniors. Ça justifie d'afficher le prix en gros dès l'accueil. En revanche, on n'écrit pas « le moins cher » : ce n'est pas vérifiable.

## 6. Ce dont j'ai besoin pour continuer

1. **Le logo** : enregistre l'image depuis http://www.mc-home.fr/medias/site/logos/logo-mc-home.png (clic droit → Enregistrer l'image) et dépose-la dans le chat.
2. **Une capture d'écran de l'accueil sur ordinateur**, en entier, pour relever les couleurs du thème. Avec le logo, j'ai deux sources pour la palette.
3. Optionnel : les photos qui appartiennent vraiment à MC Home (équipe, bureaux).

Alternative pour débloquer sans fichiers : le client fait réparer le certificat (ou désactive la redirection HTTPS) dans l'administration e-monsite, et je relance le téléchargement complet.
