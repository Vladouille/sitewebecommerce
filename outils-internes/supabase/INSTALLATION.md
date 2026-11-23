# QG des associés : installation hors Claude (Hostinger + Supabase)

Résultat : l'app s'ouvre sur `https://ton-domaine/qg/` sans compte Claude. Le code commun est demandé une seule fois par téléphone et vérifié par le serveur à chaque action. Sans le bon code, personne ne lit ni n'écrit quoi que ce soit, même avec le lien.

Temps : 45 minutes à 1 h 30 la première fois. Coût : 0 € pour Supabase (offre gratuite) et environ 0,10 $ par analyse IA (crédit API Anthropic à acheter, 5 $ minimum).

## 1. Créer la base (Supabase, 10 min)
1. Crée un compte sur supabase.com, puis **New project**. Région : **West EU (Paris)**. Garde le mot de passe de la base dans un endroit sûr.
2. Menu **SQL Editor** → **New query** → colle tout le fichier `schema.sql` → **Run**. Tu dois voir « Success. No rows returned ».

## 2. Créer la clé API Claude (Anthropic, 10 min)
1. Va sur console.anthropic.com, crée un compte, puis **Billing** → ajoute un crédit (5 $ suffisent pour une cinquantaine d'analyses).
2. **API Keys** → **Create Key** → copie la clé (elle commence par `sk-ant-`). Ne la colle jamais dans la page web ni dans un message.

## 3. Créer la fonction serveur (Supabase, 15 min)
1. Menu **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nom de la fonction : `qg` (exactement). Remplace tout le code par le contenu de `functions/qg/index.ts` → **Deploy function**.
3. Dans les réglages de la fonction `qg` (**Details** ou **Settings**) : **désactive « Enforce JWT verification »**, puis enregistre. Sinon la page reçoit une erreur 401 à chaque action. La sécurité est assurée par le code commun.
4. Menu **Edge Functions** → **Secrets** → ajoute :
   - `QG_CODE` : votre code commun. **12 caractères minimum** conseillés, par exemple 3 mots séparés par des tirets. Pas de date de naissance ni de prénom.
   - `ANTHROPIC_API_KEY` : la clé `sk-ant-...` de l'étape 2.
   - `QG_ALLOWED_ORIGIN` (conseillé) : l'adresse de ton site, par exemple `https://autoflow.fr` (sans `/` à la fin).
5. Copie l'adresse de la fonction affichée par Supabase. Elle ressemble à `https://abcdefgh.supabase.co/functions/v1/qg`.

## 4. Brancher la page (2 min)
Ouvre `qg/index.html` et remplace `https://VOTRE-PROJET.supabase.co/functions/v1/qg` par l'adresse copiée. C'est la seule ligne à modifier. (Ou envoie-moi l'adresse et je le fais.)

## 5. Mettre en ligne sur Hostinger (10 min)
Gestionnaire de fichiers → `public_html` → crée le dossier `qg` → envoie dedans tout le contenu du dossier `qg/` du projet : `index.html`, `manifest.webmanifest`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `.htaccess`.

## 6. Tester avant de donner le lien (5 min)
1. Ouvre `https://ton-domaine/qg/` sur ton téléphone. Entre un faux code : il doit être refusé. Entre le bon : l'écran des prénoms apparaît.
2. Crée une tâche. Sur un 2e téléphone, ouvre le lien, entre le code : la tâche doit y être.
3. Crée une idée de test et lance l'analyse : compte 30 s à 2 min.

En cas d'erreur, regarde **Edge Functions → qg → Logs** dans Supabase : l'erreur exacte y est écrite.

## Pièges connus
- **Pause Supabase** : l'offre gratuite met le projet en pause après 7 jours sans aucune utilisation. Les données sont gardées, mais l'app ne répond plus tant que tu n'as pas cliqué sur **Restore** dans Supabase. Si vous utilisez l'app chaque semaine, ça n'arrive pas.
- **Crédit épuisé** : l'analyse affiche « Crédit API Anthropic épuisé ». Recharge sur console.anthropic.com. Le reste de l'app continue de marcher.
- **Changer le code** : modifie le secret `QG_CODE` dans Supabase. Chaque téléphone redemande alors le code au prochain chargement.
- **Durée maximale** : une analyse qui dépasse 150 secondes est coupée par l'offre gratuite de Supabase. L'app affiche un message et l'idée reste enregistrée. Relance l'analyse.
- **Ne partage jamais** la clé `sk-ant-...` ni le code par écrit dans un groupe. Le code se donne de vive voix.
- **Sauvegarde** : une fois par mois, Réglages → « Exporter une sauvegarde (JSON) ».
