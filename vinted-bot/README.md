# Vinted Deals : ton site de détection d'erreurs de prix, hébergé chez toi

Un site web privé, protégé par mot de passe, que tu ouvres depuis ton téléphone ou ton
ordinateur. Tant qu'une page du site est ouverte, il surveille tes recherches Vinted et
affiche les annonces nettement moins chères que le marché. Quand personne n'est connecté,
le scan se met en pause tout seul.

Pour chaque affaire :

- **🛒 Acheter** : ouvre directement l'écran de paiement Vinted ;
- **👀 Voir l'annonce** : ouvre la fiche (dans l'app Vinted sur téléphone) ;
- **✨ Créer une annonce de revente** : titre, description, hashtags, prix conseillé, prix
  « vente rapide », bénéfice estimé et conseils photos, avec un bouton « Copier » par bloc.

Tout se règle depuis le site : **🔎 Mes recherches** (colle l'adresse d'une recherche
vinted.fr) et **⚙️ Réglages** (seuils d'alerte, mots exclus).

| Badge | Par défaut |
|---|---|
| 🔥 Bonne affaire | prix au moins 40 % sous la médiane des annonces comparables |
| 🚨 Erreur de prix | prix au moins 70 % sous la médiane |

**100 % gratuit** : logiciels libres, HTTPS gratuit, IA locale gratuite. Seule ta machine
tourne.

## 1. Choisir la machine

N'importe quel ordinateur allumé en permanence fait l'affaire : un vieux PC, un Raspberry Pi 4
ou 5, un mini-PC. **Chez toi, c'est le meilleur choix** : gratuit, et Vinted bloque beaucoup
plus souvent les serveurs de datacenter que les connexions de particuliers.

Installe Docker : https://docs.docker.com/engine/install/ (Linux) ou Docker Desktop
(Windows, Mac).

## 2. Configurer

Dans le dossier `vinted-bot` :

```bash
cp .env.example .env
```

Ouvre `.env` et choisis un **mot de passe long et unique** (`BOT_PASSWORD`, 10 caractères
minimum, idéalement une phrase).

## 3. Rendre le site accessible depuis ton téléphone

Deux options gratuites. **L'option A est la plus sûre** : le site n'est visible que par
tes propres appareils.

### Option A (recommandée) : Tailscale, privé et sans rien ouvrir

1. Crée un compte gratuit sur tailscale.com, installe Tailscale sur la machine et sur ton
   téléphone, connecte-les au même compte.
2. Sur la machine :
   ```bash
   docker compose up -d --build
   sudo tailscale serve --bg 8000
   ```
3. La commande affiche une adresse `https://<nom-de-ta-machine>.<ton-réseau>.ts.net` :
   ouvre-la sur ton téléphone (avec Tailscale activé) et connecte-toi.

Personne d'autre sur Internet ne peut même voir la page de connexion.

### Option B : un vrai site public avec ton adresse

1. Crée une adresse gratuite sur duckdns.org (par exemple `monbot.duckdns.org`) qui pointe
   vers l'adresse IP de ta box.
2. Dans ta box, redirige les ports 80 et 443 vers la machine.
3. Mets cette adresse dans `.env` (`DOMAIN=monbot.duckdns.org`), puis :
   ```bash
   docker compose --profile public up -d --build
   ```
4. Le certificat HTTPS est créé automatiquement (Caddy + Let's Encrypt). Ouvre
   `https://monbot.duckdns.org`.

## 4. Optionnel : l'IA locale gratuite pour de plus belles annonces

Sans IA, l'annonce de revente est rédigée par un modèle intégré (instantané). Avec l'IA
locale, elle est rédigée à partir de la **photo** de l'article. Il faut environ 8 Go de RAM.

```bash
docker compose --profile ia up -d          # ajoute --profile public si tu as choisi l'option B
docker compose exec ollama ollama pull gemma3:4b
```

Les prix (conseillé, vente rapide, bénéfice) sont toujours calculés à partir du marché,
jamais inventés par l'IA. Si l'IA ne répond pas, le site repasse sur le modèle intégré.

## Utilisation au quotidien

- Ajoute tes recherches dans **🔎 Mes recherches** : une recherche **précise** (marque,
  modèle, taille, état) donne une médiane fiable et moins de fausses alertes.
- Au premier passage, le bot étudie le marché (1 à 2 minutes par recherche) et n'affiche
  rien tant qu'il n'a pas vu au moins 15 annonces comparables.
- Garde un onglet ouvert pendant que tu veux chasser ; active **🔔 les alertes** pour
  recevoir une notification et un bip à chaque affaire.
- Mise à jour : `git pull` puis `docker compose up -d --build`.
- Données : tout est dans `data/` (à sauvegarder si tu veux garder l'historique des prix).

## Sécurité

- **Mot de passe obligatoire** sur tout le site, stocké uniquement sous forme de hachage
  (scrypt). Après 5 essais faux, l'adresse IP est bloquée 15 minutes.
- **Session sécurisée** : cookie signé, `HttpOnly`, `Secure`, `SameSite=Strict`, valable
  30 jours ; changer `BOT_PASSWORD` déconnecte toutes les sessions.
- **HTTPS** obligatoire (Tailscale ou Caddy), avec HSTS.
- **Protection contre les autres sites** : toute action est refusée si elle ne vient pas du
  site lui-même (CSRF), et le site ne peut pas être intégré dans une autre page.
- **CSP stricte** : aucun script extérieur ; seuls les liens https vers Vinted s'affichent.
- **Entrées vérifiées** : seules les adresses de recherche vinted.fr sont acceptées
  (15 recherches maximum) ; les photos pour l'IA ne sont téléchargées que depuis Vinted.
- **Conteneur sans droits administrateur** ; le site n'écoute que sur la machine elle-même
  (port `127.0.0.1:8000`), seul Caddy ou Tailscale l'expose.
- **Aucun compte Vinted** : le bot ne se connecte jamais à ton compte et n'achète rien seul.
- Le site n'est pas indexé par les moteurs de recherche (`noindex`).

## Respect de Vinted

Au moins 30 secondes entre deux cycles (imposé), des pauses de 2 à 4 secondes entre les
requêtes, 15 recherches maximum, scan seulement quand tu es connecté, ralentissement
automatique si Vinted le demande. Aucun contournement de captcha ou de blocage.

L'automatisation n'est pas autorisée par les conditions d'utilisation de Vinted : ces
précautions limitent le risque de blocage de ton adresse IP, sans le supprimer.

## Limites à connaître

- **Médiane des prix affichés, pas des prix vendus** : Vinted ne publie pas les prix de
  vente. Pour un article cher, vérifie aussi ailleurs avant d'acheter.
- **Pas une API officielle** : si Vinted change son site, il faudra adapter
  `vinted_bot/vinted.py`. Si le bouton « Acheter » cesse de marcher, « Voir l'annonce » mène
  toujours au bouton d'achat.
- **Annonce générée** : relis-la et complète ce qui est entre crochets une fois l'article
  reçu. Décris l'état réel : une annonce trompeuse peut te valoir un litige.
- Une erreur de prix « trop belle » peut être une arnaque : regarde les avis du vendeur et
  paie toujours via Vinted (protection acheteur).

## Lancer sans Docker (développement)

```bash
pip install -r requirements.txt
BOT_PASSWORD="ton-mot-de-passe" SECURE_COOKIES=0 python -m vinted_bot
```

Puis ouvre http://localhost:8000. Tests : `pip install pytest && python -m pytest -q`.
