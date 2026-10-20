# Bot Vinted : erreurs de prix, bonnes affaires et annonces de revente

Une petite appli qui s'ouvre dans ton navigateur (ordinateur ou téléphone). Tant que la page
est ouverte, elle surveille tes recherches Vinted et affiche les annonces nettement moins
chères que le marché. Quand tu fermes la page, le scan se met en pause tout seul.

Pour chaque affaire :

- **🛒 Acheter** : ouvre directement l'écran de paiement Vinted ;
- **👀 Voir l'annonce** : ouvre la fiche (dans l'app Vinted sur téléphone) ;
- **✨ Créer une annonce de revente** : l'IA regarde la photo et le prix du marché, puis
  propose un titre, une description, des hashtags, un prix conseillé, un prix « vente
  rapide », ton bénéfice estimé et des conseils photos. Chaque bloc a un bouton « Copier ».

Comment le bot repère une affaire : il compare le prix de chaque nouvelle annonce à la
**médiane des annonces comparables** (même marque et même état si possible, sinon même
marque, sinon toute la recherche).

| Badge | Par défaut |
|---|---|
| 🔥 Bonne affaire | prix au moins 40 % sous la médiane |
| 🚨 Erreur de prix | prix au moins 70 % sous la médiane |

Le bot n'achète jamais tout seul : c'est toi qui valides le paiement.

## 1. Installer (une seule fois)

1. Installe Python 3.11 ou plus récent (python.org, coche « Add to PATH » sur Windows).
2. Dans un terminal, dans ce dossier `vinted-bot` :
   ```bash
   pip install -r requirements.txt
   cp config.example.yaml config.yaml
   cp .env.example .env
   ```
3. Pour l'annonce de revente par IA : crée une clé API sur console.anthropic.com et
   colle-la dans `.env` (`ANTHROPIC_API_KEY=...`). Sans clé, tout le reste fonctionne.
   Chaque annonce générée coûte quelques centimes.

## 2. Choisir tes recherches

Ouvre `config.yaml`. Le plus simple : fais ta recherche sur vinted.fr avec tes filtres
(marque, taille, état, prix max), copie l'URL de la page de résultats et colle-la dans `url:`.

Pour limiter les fausses alertes :
- une recherche **précise** donne une médiane fiable (« airpods pro 2 » plutôt que « écouteurs ») ;
- complète `exclude_keywords` (boîte vide, copie, pour pièces...) : ce sont les pièges habituels ;
- au premier lancement, le bot étudie d'abord le marché (1 à 2 minutes par recherche)
  et n'affiche rien tant qu'il n'a pas vu assez d'annonces comparables (`min_samples`).

## 3. Lancer

```bash
python -m vinted_bot
```

La page s'ouvre toute seule sur http://localhost:8000. Laisse-la ouverte (même en arrière-plan) :
- clique sur **🔔 Activer les alertes** pour recevoir une notification et un bip à chaque affaire ;
- ferme la page ou fais `Ctrl+C` dans le terminal pour arrêter.

**Sur ton téléphone** : lance `python -m vinted_bot --lan` sur ton ordinateur, puis ouvre
`http://<adresse-IP-de-ton-ordinateur>:8000` sur le téléphone, connecté au même wifi.
L'ordinateur doit rester allumé pendant ce temps.

## Limites à connaître

- **Médiane des prix affichés, pas des prix vendus** : Vinted ne publie pas les prix de
  vente. Pour un article cher, vérifie aussi ailleurs avant d'acheter.
- **Pas une API officielle** : le bot utilise la même API que le site vinted.fr. Si Vinted
  change son site, il faudra adapter `vinted_bot/vinted.py`. Si le bouton « Acheter » cesse
  de marcher, « Voir l'annonce » mène toujours au bouton d'achat.
- **Conditions d'utilisation** : l'automatisation n'est pas autorisée par les CGU de Vinted.
  Le bot reste discret (une requête toutes les quelques secondes, pause automatique s'il est
  limité). Garde `poll_seconds` à 30 ou plus.
- **Annonce IA** : relis-la et complète ce qui est entre crochets une fois l'article reçu.
  Décris l'état réel : une annonce trompeuse peut te valoir un litige.
- Une erreur de prix « trop belle » peut être une arnaque : regarde les avis du vendeur et
  paie toujours via Vinted (protection acheteur).

## Tests

```bash
pip install pytest && python -m pytest -q
```
