# Bot Vinted : erreurs de prix et bonnes affaires

Le bot surveille tes recherches Vinted en continu. Pour chaque nouvelle annonce, il compare
le prix à la **médiane des annonces comparables** (même marque et même état si possible,
sinon même marque, sinon toute la recherche). Si l'annonce est nettement moins chère, tu
reçois une alerte Telegram avec deux boutons :

- **🛒 Acheter maintenant** : ouvre directement l'écran de paiement Vinted de l'annonce ;
- **👀 Voir l'annonce** : ouvre la fiche (dans l'app Vinted sur téléphone).

Deux niveaux d'alerte (réglables) :

| Alerte | Par défaut |
|---|---|
| 🔥 Bonne affaire | prix au moins 40 % sous la médiane |
| 🚨 Erreur de prix probable | prix au moins 70 % sous la médiane |

Le bot n'achète jamais tout seul : c'est toi qui valides le paiement.

## 1. Créer le bot Telegram (5 minutes)

1. Sur Telegram, ouvre **@BotFather**, envoie `/newbot` et suis les étapes. Il te donne un
   **token** (`123456789:ABC...`).
2. Envoie un message quelconque à ton nouveau bot.
3. Ouvre `https://api.telegram.org/bot<TON_TOKEN>/getUpdates` dans un navigateur et repère
   `"chat":{"id": ...}` : c'est ton **chat id**.
4. Copie `.env.example` en `.env` et remplis les deux valeurs.

## 2. Configurer tes recherches

```bash
cp config.example.yaml config.yaml
```

Le plus simple : fais ta recherche sur vinted.fr avec les filtres voulus (marque, taille,
état, prix max), copie l'URL de la page de résultats et colle-la dans `url:`.

Conseils pour limiter les fausses alertes :
- une recherche **précise** donne une médiane fiable (« airpods pro 2 » plutôt que « écouteurs ») ;
- complète `exclude_keywords` (boîte vide, copie, pour pièces...) : ce sont les pièges habituels ;
- `min_samples` empêche toute alerte tant que le bot n'a pas vu assez d'annonces comparables.
  Au premier lancement, il apprend le marché sans t'alerter.

## 3. Lancer en local (test)

```bash
pip install -r requirements.txt
python -m vinted_bot.main -c config.yaml
```

Sans `.env` chargé, les alertes s'affichent dans le terminal. Pour charger Telegram :
`export $(cat .env | xargs)` avant la commande.

## 4. Faire tourner 24h/24

Ton ordinateur ne peut pas rester allumé en permanence : il faut un petit serveur.
Un VPS à 4-5 €/mois suffit (Hetzner, OVH, Scaleway...). Sur le serveur :

```bash
git clone <ce dépôt> && cd <dépôt>/vinted-bot
cp config.example.yaml config.yaml   # puis édite
cp .env.example .env                 # puis édite
docker compose up -d --build
docker compose logs -f               # pour voir ce qu'il fait
```

`restart: unless-stopped` relance le bot automatiquement après un crash ou un redémarrage
du serveur. Tu reçois un message « ✅ Bot Vinted démarré » à chaque lancement, et une
alerte si le bot échoue plusieurs cycles de suite.

Modifier une recherche : édite `config.yaml` puis `docker compose restart`.

## Limites à connaître

- **Médiane des prix affichés, pas des prix vendus** : Vinted ne publie pas les prix de
  vente. La référence est le marché Vinted actuel ; pour un article très cher, vérifie
  aussi le prix ailleurs avant d'acheter.
- **Pas une API officielle** : le bot utilise la même API que le site vinted.fr. Si Vinted
  change son site, il faudra adapter `vinted_bot/vinted.py`. Le lien « Acheter » utilise
  l'URL de paiement actuelle de Vinted ; s'il cesse de marcher, « Voir l'annonce » mène
  toujours au bouton d'achat.
- **Conditions d'utilisation** : l'automatisation n'est pas autorisée par les CGU de Vinted.
  Le bot reste discret (une requête toutes les quelques secondes, pause automatique s'il est
  limité), mais garde un intervalle raisonnable (`poll_seconds` ≥ 30) : un rythme trop
  agressif peut faire bloquer l'adresse IP du serveur.
- Une erreur de prix « trop belle » peut aussi être une arnaque : regarde les avis du
  vendeur et paie toujours via Vinted (protection acheteur).

## Tests

```bash
pip install pytest && python -m pytest -q
```
