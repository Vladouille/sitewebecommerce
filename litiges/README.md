# Plateforme de défense des litiges Stripe

Service pour les vendeurs de formations et coachings en ligne : on monte et on défend leurs
dossiers de litiges (rétrofacturations) dans Stripe. Rémunération : 20 % du montant récupéré,
plafonné à 300 € par litige gagné, 0 € de commission si on perd.

> Ce dossier est **isolé** de la landing Autoflow (dossier parent). Il a vocation à devenir
> son propre dépôt Git. Il ne doit jamais être servi par l'hébergement Hostinger (un `.htaccess`
> l'interdit par sécurité).

## Où en est-on ?

| Étape | Contenu | État |
|---|---|---|
| 1.1 | Socle technique : Next.js, TypeScript strict, tests, en-têtes de sécurité | ✅ Fait |
| 1.2 | Lecture du CSV Stripe + calculs (réseaux, motifs, contestabilité, commissions, échéances) | ✅ Fait |
| 1.3 | Pages publiques (accueil, FAQ, guide d'export) | À faire |
| 1.4 | Formulaire d'audit gratuit (anti-spam, consentement) | À faire |
| 1.5 | Base de données UE + règles d'accès (RLS) | À faire |
| 1.6 | Back-office admin (lien magique + 2FA) | À faire |
| 1.7 | Rapport PDF relu avant envoi | À faire |
| 1.8 | Durée de conservation + pages légales | À faire |

## Lancer le projet sur ton ordinateur

1. Installe **Node.js 22** (https://nodejs.org, version « LTS »).
2. Ouvre un terminal dans ce dossier `litiges/`.
3. Installe les dépendances : `npm install`
4. Copie `.env.example` en `.env.local` (rien à remplir pour l'instant).
5. Lance le site : `npm run dev`, puis ouvre http://localhost:3000

## Vérifier que tout fonctionne

- `npm test` : lance les tests automatiques (calculs de commission, lecture CSV, échéances…).
- `npm run check` : tests + vérification du typage + linter. **Doit être vert avant chaque mise en ligne.**

## Les règles métier (où les modifier)

Tout est dans `src/lib/audit/config.ts` :

- `commissionRate` : 20 %
- `commissionCapCents` : plafond de 300 € (en centimes : 30000)
- `minDefendableAmountCents` : en dessous de 30 €, on ne conteste pas (les frais Stripe
  de contestation, perdus en cas d'échec, dépassent le gain). **À ajuster** quand le montant
  exact des frais en France sera confirmé.
- `nonDefendableReasons` : motifs bancaires qu'on ne conteste jamais.

Règles fixes (non modifiables, imposées par Stripe ou par principe) :

- **Litiges Cartes Bancaires (CB) : jamais contestables** (règle du réseau CB, documentée par Stripe).
- **Aucun taux de gain par défaut** : l'estimation « récupérable » exige un taux saisi par
  l'admin à chaque rapport. On ne présente jamais un chiffre inventé au client.
- Le rapport sépare **l'argent perdu dans le passé** (argument commercial, non récupérable)
  des **litiges encore ouverts** (seul argent réellement récupérable).

## Protection des données (RGPD)

L'analyseur CSV fonctionne en **liste blanche** : il ne lit que 8 colonnes (identifiant,
montant, devise, date, motif, statut, échéance, réseau). Les noms, emails, adresses et IP des
élèves présents dans l'export Stripe sont **ignorés et jamais stockés**. Un test automatique
le vérifie (`tests/parse.test.ts`).

## Points en attente de ta part

- [ ] **Un vrai export CSV de litiges Stripe** (même anonymisé). Les noms de colonnes reconnus
      sont dans `src/lib/audit/parse.ts` (`COLUMN_ALIASES`) : ils ont été déduits, pas vérifiés
      sur un vrai fichier. Si l'export ne contient pas la marque de carte, la détection CB
      sera impossible avec ce seul fichier.
- [ ] Nom de marque, domaine, entité juridique (pour les mentions légales).
- [ ] Montant exact des frais de contestation Stripe en France.
