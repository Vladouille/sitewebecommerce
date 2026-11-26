# Site MC Home — livraison

Site statique : HTML + `styles.css` + `script.js`. Aucun framework, aucune dépendance externe, aucun cookie.
Pour le mettre en ligne, déposer **tout le dossier** (sauf `_audit/` et ce fichier) à la racine de n'importe quel hébergeur. Les liens sont relatifs : le site fonctionne aussi en ouvrant `index.html` sur un ordinateur.

## Pages
| Fichier | Requête visée |
|---|---|
| `index.html` | aide à domicile Cagnes-sur-Mer / Nice |
| `services/menage-repassage.html` | ménage Cagnes-sur-Mer, femme de ménage |
| `services/garde-enfants.html` | garde d'enfants Nice / Cagnes |
| `services/aide-personnes-agees-handicap.html` | aide à domicile personnes âgées Cagnes-sur-Mer |
| `tarifs-et-aides.html` | tarif aide à domicile, crédit d'impôt |
| `qui-sommes-nous.html` | MC Home, entreprise familiale |
| `faq.html` | questions fréquentes (balisage FAQPage) |
| `contact.html` | contact, téléphones (balisage LocalBusiness) |
| `mentions-legales.html` | obligations légales |

## Vérifications faites (26/11/2026)
- Captures en 375 px et 1440 px de chaque page : aucun débordement horizontal, aucun texte sous 16 px (corps à 18 px).
- 0 lien interne cassé ; tous les `tel:` au format +33.
- HTML valide (html-validate, règles standard) sur les 9 pages.
- Lighthouse (accueil, page seniors, contact) : performance 99–100, accessibilité 100, SEO 100, bonnes pratiques 96 (favicon manquant, à faire avec le logo).
- Contrastes : 6,8:1 minimum (AA demande 4,5:1).
- Calculateur testé : plafond de 12 000 €/an appliqué, alerte affichée au-delà.

## Avant la mise en ligne (bloquant)
1. **Couleurs** : les 3 variables en haut de `styles.css` sont **provisoires**. À remplacer par celles du logo / du site actuel.
2. **Logo** : remplacer le texte « MC Home » dans l'en-tête (commentaire `LOGO` dans chaque page) par `assets/logo-mc-home.png`. Ajouter ensuite un favicon et une image Open Graph à partir du logo.
3. **Formulaire** : créer un compte Formspree (gratuit) et remplacer `VOTRE_ID` dans `contact.html`. Sinon, le formulaire n'envoie rien.
4. **Mentions légales** : compléter l'hébergeur, le n° de TVA intracommunautaire et le prestataire du formulaire (repérés en jaune `[À COMPLÉTER]`).
5. **Domaine** : le certificat HTTPS actuel est celui d'e-monsite. Il faut l'accès au registrar de mc-home.fr pour pointer le domaine vers le nouvel hébergeur et activer un certificat (Let's Encrypt).

## Questions à poser au client (repérées en commentaires HTML)
- `À CONFIRMER CLIENT` — tarif 31 €/h (l'ancienne FAQ disait 23 €).
- `À CONFIRMER CLIENT` — le 31 €/h vaut-il aussi pour la garde des moins de 3 ans ?
- `STATUT AUTORISATION À CONFIRMER` — statut actuel pour l'aide aux personnes âgées (autorisation du département depuis 2016). Le site écrit seulement « agréée qualité depuis 2014 ».
- `QUESTION CLIENT` — proposez-vous l'avance immédiate du crédit d'impôt (Urssaf) ? Rien n'est affiché tant que ce n'est pas confirmé.
- Hors site : la fiche maboussoleaidants.fr indique « 7 rue du Chevalier Martin » au lieu du 9. À faire corriger (référencement local).

## Photos à fournir (emplacements marqués `PHOTO RÉELLE À FOURNIR`)
- Marion Grand et Caroline Broard (accueil, qui sommes-nous).
- Façade ou entrée des bureaux.
- Une intervenante en situation : ménage, garde d'enfants (sans visage d'enfant identifiable), aide à une personne âgée (avec accord écrit).
Format conseillé : JPEG ou WebP, 1600 px de large maximum, moins de 300 Ko chacune.

## Incohérences de l'ancien site corrigées
- « S.A.S., Présidente, Directrice générale » → « SARL, co-gérantes ».
- « Réduction fiscale » → « crédit d'impôt ». « Conseil Général » → « Conseil départemental ».
- « Non imposable **et toujours en activité** » → condition supprimée depuis 2017 : retraités non imposables remboursés aussi.
- FAQ « tarifs variables pour le reste de nos services » → supprimé (contredisait le tarif fixe de 27 €).
- Widgets « Agenda » vide et « Newsletter » → supprimés. Trois pages index vides → supprimées.
- Fautes (« vigilence », « réhausseurs », « agées »…) corrigées.
