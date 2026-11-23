# QG des associés : installation (page HTML + base Supabase gratuite)

Résultat : une page `index.html` autonome, sans IA et sans compte Claude. Vos 3 téléphones partagent les mêmes données. Le code commun est demandé une seule fois par téléphone et vérifié par la base à chaque lecture et à chaque écriture.

Pourquoi une base en ligne : sans elle, chaque téléphone garderait ses propres données et vous ne verriez jamais ce que les autres écrivent.

Temps : 20 à 30 minutes. Coût : 0 €.

## 1. Créer la base (Supabase, 10 min)
1. Crée un compte sur supabase.com, puis **New project**. Région : **West EU (Paris)**.
2. Ouvre `schema.sql` et remplace `CHANGE-MOI-par-votre-code` (ligne 22, une seule fois) par votre code commun. **12 caractères minimum**, par exemple trois mots séparés par des tirets. Tant que tu ne l'as pas changé, la base refuse tout.
3. Menu **SQL Editor** → **New query** → colle tout le fichier → **Run**. Tu dois voir « Success. No rows returned ».

## 2. Brancher la page (5 min)
1. Dans Supabase : **Project Settings** → **API** (ou **API Keys**). Copie :
   - l'**URL du projet**, qui ressemble à `https://abcdefgh.supabase.co` ;
   - la clé **publishable** (`sb_publishable_...`) ou, à défaut, la clé **anon public** (`eyJ...`).
   **Jamais la clé `service_role` ni la clé `secret`** : elles donnent tous les droits.
2. Ouvre `index.html` avec un éditeur de texte. En haut du fichier, remplace `https://VOTRE-PROJET.supabase.co` et `VOTRE-CLE-PUBLIQUE` par ces deux valeurs. (Ou envoie-les-moi et je te renvoie le fichier prêt.)

La clé publique peut être visible dans la page : seule, elle ne permet rien. Toutes les portes de la base exigent le code commun.

## 3. Mettre en ligne (5 min)
Hostinger → Gestionnaire de fichiers → `public_html` → crée le dossier `qg` → envoie dedans `index.html` et `.htaccess`. L'adresse sera `https://ton-domaine/qg/`.

N'importe quel hébergement web fonctionne aussi. L'adresse doit commencer par `https://`.

## 4. Tester avant de donner le lien (5 min)
1. Ouvre l'adresse sur ton téléphone. Entre un faux code : il doit être refusé. Entre le bon : l'écran des prénoms apparaît.
2. Crée une tâche. Sur un 2e téléphone, ouvre le lien et entre le code : la tâche doit y être (au plus 8 secondes plus tard, ou tout de suite après rafraîchissement).
3. Ajoute l'app à l'écran d'accueil : Safari → Partager → « Sur l'écran d'accueil », ou Chrome → ⋮ → « Ajouter à l'écran d'accueil ».

## Messages d'erreur possibles
- « App pas encore branchée » : l'URL ou la clé n'est pas renseignée en haut d'`index.html`.
- « La base n'est pas prête » : le script `schema.sql` n'a pas été exécuté.
- « Clé Supabase refusée » : la clé copiée est incomplète ou ce n'est pas la bonne.
- « Code incorrect » : le code ne correspond pas à celui du script, ou tu as laissé `CHANGE-MOI-par-votre-code`.

## Pièges connus
- **Pause Supabase** : l'offre gratuite met le projet en pause après 7 jours sans aucune utilisation. Les données sont gardées, mais l'app ne répond plus tant que tu n'as pas cliqué sur **Restore** dans Supabase. Si vous utilisez l'app chaque semaine, ça n'arrive pas.
- **Changer le code** : dans SQL Editor, lance `update qg_private.settings set code = 'nouveau-code' where id = 1;`. Chaque téléphone redemande alors le code.
- **Le code est la seule protection.** Un code court peut être deviné à force d'essais. Prends-en un long et donne-le de vive voix, jamais dans un groupe.
- **Sauvegarde** : une fois par mois, Réglages → « Exporter une sauvegarde (JSON) ».
