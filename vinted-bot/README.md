# Bot Vinted : erreurs de prix, bonnes affaires et annonces de revente

Une petite appli qui s'ouvre dans ton navigateur (ordinateur ou téléphone). Tant que la page
est ouverte, elle surveille tes recherches Vinted et affiche les annonces nettement moins
chères que le marché. Quand tu fermes la page, le scan se met en pause tout seul.

Pour chaque affaire :

- **🛒 Acheter** : ouvre directement l'écran de paiement Vinted ;
- **👀 Voir l'annonce** : ouvre la fiche (dans l'app Vinted sur téléphone) ;
- **✨ Créer une annonce de revente** : titre, description, hashtags, prix conseillé, prix
  « vente rapide », bénéfice estimé et conseils photos, avec un bouton « Copier » par bloc.
  Les prix viennent toujours du marché observé ; le texte est rédigé par une IA gratuite qui
  tourne sur ton ordinateur (si tu l'installes) ou par un modèle intégré.

**Tout est gratuit** : pas d'abonnement, pas de clé API, pas de serveur à louer.

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
   ```

C'est tout : le bot et les annonces de revente (modèle intégré) fonctionnent déjà.

### Optionnel : l'IA locale gratuite pour de plus belles annonces

Avec l'IA locale, l'annonce est rédigée à partir de la **photo** de l'article (couleur,
modèle, détails visibles). Elle tourne sur ton ordinateur : gratuit, illimité, et rien
n'est envoyé à un service extérieur.

1. Installe Ollama depuis ollama.com (Windows, Mac ou Linux).
2. Dans un terminal : `ollama pull gemma3:4b` (environ 3 Go, une seule fois).
3. C'est tout : le bot l'utilise automatiquement quand Ollama est lancé.

Il faut environ 8 Go de RAM. Sur un ordinateur plus modeste, mets `model: gemma3:1b`
dans `config.yaml` (sans lecture de photo) ou garde le modèle intégré. Si Ollama ne
répond pas, le bot repasse tout seul sur le modèle intégré.

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

**Sur ton téléphone** : lance `python -m vinted_bot --lan` sur ton ordinateur. Le terminal
affiche un lien avec un **code d'accès** : ouvre-le sur le téléphone, connecté au même wifi
(remplace `<adresse-IP-de-ton-PC>` par l'adresse de l'ordinateur, visible dans les
paramètres wifi). L'ordinateur doit rester allumé pendant ce temps.

## Sécurité

- **Aucun compte, aucun mot de passe** : le bot ne se connecte jamais à ton compte Vinted
  et n'achète rien tout seul. Il ne stocke aucune donnée personnelle (seulement les prix vus).
- **Page privée** : par défaut, seul ton ordinateur peut ouvrir la page. En mode `--lan`,
  un code d'accès aléatoire (nouveau à chaque lancement) protège la page sur ton wifi.
- **Les autres sites web ne peuvent pas piloter le bot** (contrôle de l'origine des
  requêtes et protection contre le « DNS rebinding »).
- **Liens sûrs** : la page n'affiche que des liens https vers Vinted, et une politique de
  sécurité stricte (CSP) bloque tout script extérieur.
- **IA locale** : les photos ne sont téléchargées que depuis les serveurs d'images de Vinted
  et restent sur ton ordinateur.
- **Respect de Vinted** : au moins 30 secondes entre deux cycles (imposé), des pauses entre
  les requêtes, arrêt automatique dès que tu fermes la page et ralentissement si Vinted le
  demande. Aucun contournement de captcha ni de blocage.

## Limites à connaître

- **Médiane des prix affichés, pas des prix vendus** : Vinted ne publie pas les prix de
  vente. Pour un article cher, vérifie aussi ailleurs avant d'acheter.
- **Pas une API officielle** : le bot utilise la même API que le site vinted.fr. Si Vinted
  change son site, il faudra adapter `vinted_bot/vinted.py`. Si le bouton « Acheter » cesse
  de marcher, « Voir l'annonce » mène toujours au bouton d'achat.
- **Conditions d'utilisation** : l'automatisation n'est pas autorisée par les CGU de Vinted.
  Le bot reste discret et ne tourne que quand tu le regardes, mais le risque n'est pas nul :
  ne réduis pas les pauses.
- **Annonce générée** : relis-la et complète ce qui est entre crochets une fois l'article reçu.
  Décris l'état réel : une annonce trompeuse peut te valoir un litige.
- Une erreur de prix « trop belle » peut être une arnaque : regarde les avis du vendeur et
  paie toujours via Vinted (protection acheteur).

## Tests

```bash
pip install pytest && python -m pytest -q
```
