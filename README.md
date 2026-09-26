# Nexa Agents — Site vitrine

Site web pour vendre à des e-commerçants des **clients et des résultats générés par des agents IA**
(prospection, relance de paniers abandonnés, vendeur/SAV, publicité, fidélisation, avis).

## Contenu
- Hero avec tableau de bord animé (flux de ventes en temps réel simulé)
- Chiffres clés animés
- Présentation des 6 agents IA
- Fonctionnement en 4 étapes
- Simulateur de gains interactif
- Études de cas / témoignages
- Tarifs orientés résultats (commission, abonnement, prix par client)
- FAQ et formulaire de demande d'audit gratuit

## Lancer en local
Aucune dépendance : ouvrez `index.html` dans un navigateur, ou :
```bash
python3 -m http.server 8000
```

## Personnaliser
- **Nom / textes** : `index.html` (marque « Nexa Agents » à remplacer par la vôtre)
- **Couleurs** : variables CSS en haut de `styles.css`
- **Hypothèses du simulateur** : constantes `UPLIFT_CONVERSION`, `PROSPECTION_BONUS`, `COMMISSION`, `FIXED_FEE` dans `script.js`
- **Formulaire** : à brancher sur Formspree, HubSpot, Calendly, etc. (voir le `TODO` dans `script.js`)

> Les chiffres, témoignages et études de cas sont des exemples à remplacer par vos données réelles.

## Déploiement
Site 100 % statique : GitHub Pages, Netlify ou Vercel fonctionnent directement.
