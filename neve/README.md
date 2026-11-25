# NÉVÉ — site de vente de la pince à boules de neige

Site one-page statique (HTML, CSS, JS vanilla), sans backend. Paiement par Stripe Payment Links.

```
neve/
├── site/                 ← LE SITE : c'est ce dossier qu'on déploie
│   ├── index.html
│   ├── merci.html        ← page de retour après paiement Stripe
│   ├── mentions-legales.html · cgv.html · confidentialite.html
│   ├── css/style.css
│   ├── js/config.js      ← LE SEUL fichier à modifier au quotidien
│   ├── js/main.js · js/scene3d.js
│   ├── assets/model/     ← neve.glb (Draco, version web allégée)
│   ├── assets/img/       ← image du hero, camps, Open Graph, favicon (générés depuis la 3D)
│   ├── assets/vendor/    ← three 0.160.0, gsap 3.12.5, lenis 1.1.13, décodeur Draco
│   ├── assets/fonts/     ← Space Grotesk + Inter, auto-hébergées
│   └── netlify.toml · .htaccess · robots.txt · sitemap.xml
├── source/               ← neve_web_demi-pince.stl : le fichier d'impression. JAMAIS dans site/
└── tools/                ← outillage (conversion STL → GLB, rendus, serveur local). Ne pas déployer.
```

> ⚠️ **Le STL actuel est PROVISOIRE.** Ton fichier `neve_web_demi-pince.stl` n'était pas fourni : j'ai généré une demi-pince de remplacement qui respecte exactement ton repère (boule Ø60 à l'origine, joint z = 0, pivot x = −120). L'image du hero, l'image Open Graph et les visuels des camps montrent donc **ce modèle provisoire, pas ton produit**. Mettre en ligne sans le remplacer, c'est montrer un produit qui n'est pas celui que tu vends. Voir « Remplacer le modèle 3D » ci-dessous.

---

## Déployer en 5 étapes (Netlify)

1. **Remplis les réglages** : `site/js/config.js` (liens Stripe, stock, email) et les `[PLACEHOLDERS]` surlignés en jaune dans les 3 pages légales.
2. **Remplace `TON-DOMAINE.fr`** partout dans `site/` (recherche et remplacement dans ton éditeur : `index.html`, `robots.txt`, `sitemap.xml`, `merci.html`). Sans ça, l'aperçu TikTok/Instagram/WhatsApp de ton lien n'aura pas d'image.
3. Sur [app.netlify.com](https://app.netlify.com) : **Add new site → Deploy manually**, puis glisse le dossier **`neve/site`** (pas `neve/`).
4. **Domain management → Add a domain** : branche ton domaine, Netlify active le HTTPS tout seul.
5. **Teste un achat réel** avec un vrai lien Stripe (puis rembourse-toi depuis Stripe), et vérifie que tu arrives bien sur `merci.html`.

**Hostinger à la place** : Gestionnaire de fichiers → `public_html` → envoie le *contenu* de `neve/site` (le `.htaccess` est déjà prêt : HTTPS, compression, cache).

---

## Les réglages du quotidien (`site/js/config.js`)

| Constante | Rôle |
|---|---|
| `STOCK` | Pinces restantes. **Mets-le à jour à chaque vente.** À `0`, tous les boutons deviennent « Rejoindre la liste du Drop #2 » et Google voit le produit comme épuisé. |
| `STRIPE_LINKS` | Un Payment Link par pack. Tant qu'un lien contient `XXXX`, le clic affiche une alerte au lieu d'envoyer vers une page cassée. |
| `DROP2_FORM_URL` | Formulaire d'inscription au Drop suivant (Tally, Google Forms…). |
| `DUO_BADGE` | `Recommandé` par défaut. Passe à `Le plus choisi` **seulement quand c'est vrai** (voir « Pièges »). |
| `CONTACT_EMAIL` | Email affiché dans le pied de page de toutes les pages. |
| `SHOW_REVIEWS` / `REVIEWS` | Section « Ils l'ont testée », masquée par défaut. Uniquement de vraies vidéos de vrais clients, avec leur accord écrit. |
| `PLAUSIBLE_DOMAIN` | Mesure d'audience sans cookie, vide = désactivée. Si tu l'actives, complète le paragraphe prévu dans `confidentialite.html`. |

Après une modification : redéploie (glisser-déposer à nouveau). Le cache est réglé pour que `config.js` soit revérifié à chaque visite : ton stock est à jour immédiatement.

## Créer les liens Stripe (une fois par pack)

Dashboard Stripe → **Payment Links → Nouveau** :
1. Produit : « NÉVÉ Duo Bataille », 19,90 € (idem Solo 12,90 € et Clan 34,90 €).
2. **Collecter l'adresse de livraison** : France uniquement. **Ajouter un tarif d'expédition** : « Point relais » 3,90 € (0 € pour le Clan).
3. **Champ personnalisé** (texte) : « Code du point relais (Mondial Relay) ». Stripe ne sait pas choisir un point relais tout seul, voir « Pièges ».
4. **Limiter le nombre de paiements** sur chaque lien, pour ne jamais vendre plus de pinces que le Drop n'en contient.
5. **Après le paiement → Rediriger vers** `https://TON-DOMAINE.fr/merci.html`.
6. Copie le lien `https://buy.stripe.com/...` dans `STRIPE_LINKS`.

## Remplacer le modèle 3D (le vrai STL)

```bash
cd neve/tools
npm install
```

Copie ton fichier dans `neve/source/neve_web_demi-pince.stl` (même nom ; **jamais dans `site/`**, sinon n'importe qui peut télécharger ton produit et l'imprimer), puis :

```bash
npm run model
```

Le script convertit en GLB Draco, garde les arêtes vives et **réduit automatiquement le maillage** si le fichier dépasse 580 Ko. Il affiche la boîte englobante : vérifie que x va d'environ −130 à +35 et que la boule est bien centrée sur 0 ; sinon ton export n'est pas dans le bon repère ou pas en mm.

Régénère ensuite les images (hero, camps, Open Graph) depuis la nouvelle 3D, dans deux terminaux :

```bash
npm run serve
```

```bash
npm i -D playwright && npx playwright install chromium && npm run render
```

Si le cadrage ne convient pas : `fitW`/`fitH` dans `site/js/scene3d.js` (taille dans le cadre) et `model.position.x = 46` (centrage).

## Pages légales

Chaque `[PLACEHOLDER]` est surligné en jaune sur la page, impossible à rater. Les CGV contiennent déjà la rétractation de 14 jours, la garantie légale de conformité (texte de l'encadré obligatoire), les vices cachés, la garantie commerciale « Casse à vie » et le formulaire de rétractation. **Fais-les relire par un professionnel avant la première vente.**

## Performance mesurée (Lighthouse 12, serveur local gzip)

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP |
|---|---|---|---|---|---|
| Accueil, mobile 4G simulée | 99 | 100 | 100 | 100 | 2,0 s |
| Accueil, desktop | 100 | 100 | 100 | 100 | 0,4 s |

Stratégie : la page s'affiche avec une image statique de la pince (16 Ko). Three.js, le GLB et Lenis ne se chargent qu'au premier geste de l'utilisateur (scroll, toucher, souris) ou après 4,5 s. Sans WebGL : image statique flottante. Avec `prefers-reduced-motion` : ni Lenis, ni neige, ni 3D, ni animation au scroll, et tout le contenu reste lisible.

Les librairies sont hébergées dans `site/assets/vendor` (mêmes versions épinglées que sur un CDN) : aucune connexion à un domaine tiers, et le site ne dépend pas de la disponibilité d'un CDN.

---

## Pièges : les erreurs que tu vas rencontrer

1. **Le point relais et Stripe.** Les Payment Links ne savent pas proposer une carte de points relais. Sans le champ « Code du point relais », tu recevras des adresses à domicile et devras choisir toi-même un relais, ou écrire à chaque client. Mets le champ, et ajoute dans sa description le lien vers la carte Mondial Relay.
2. **3,90 € de livraison ne couvrent pas forcément ton coût réel.** Le tarif d'un petit colis en point relais dépasse souvent 3,90 € selon le transporteur, le format et ton volume. Sur un Solo à 12,90 €, chaque euro compte : vérifie ton tarif réel avant de lancer. Le Clan à livraison offerte se finance avec la marge de 4 pinces.
3. **La garantie « Casse à vie » a un coût par réclamation**, surtout l'envoi : qui coûte bien plus que le filament de la pièce. « Quelle que soit la raison » invite aussi les petits malins. Décide avant le lancement d'une limite raisonnable (par exemple une réimpression par pince et par hiver) et écris-la dans la ligne prévue de l'article 8 des CGV.
4. **Le médiateur de la consommation est obligatoire** dès ta première vente à un particulier (adhésion payante, compare les organismes agréés sur le site de la CECMC). Sans lui, l'amende administrative peut atteindre 3 000 € pour un entrepreneur individuel (15 000 € pour une société). C'est l'oubli classique des petites boutiques.
5. **Sécurité produit (GPSR).** Depuis décembre 2024, chaque produit vendu en ligne doit indiquer le nom et l'adresse du fabricant et ses avertissements. C'est prévu dans le pied de page, les mentions légales et les CGV : remplis `[NOM]` et `[ADRESSE]`, et mets les mêmes avertissements sur une étiquette dans le colis.
6. **14 ans et plus, c'est un vrai choix juridique** : en dessous, le produit serait un jouet, avec marquage CE et tests obligatoires. Garde ce positionnement partout : pas d'enfants dans tes vidéos TikTok, pas de « pour les petits ».
7. **« Le plus choisi » sans ventes = affirmation fausse.** Elle relève de la même règle que les faux avis, que tu as toi-même exclus. Le badge affiche « Recommandé » tant que les chiffres ne prouvent pas le contraire.
8. **Le stock manuel peut te faire survendre** si tu oublies de le mettre à jour pendant un pic TikTok. Les limites de paiement sur chaque Payment Link sont ton filet de sécurité : règle-les.
9. **L'aperçu de lien vide.** Si tu oublies de remplacer `TON-DOMAINE.fr`, tes liens partagés sur Instagram et WhatsApp n'auront ni image ni titre propre. Après le déploiement, teste avec le Sharing Debugger de Facebook.
10. **Avant le premier post TikTok**, fais un achat complet sur mobile, en 4G, avec un vrai lien. C'est le parcours de 80 % de tes visiteurs ; s'il casse, chaque vue est perdue.
11. **Ton design est copiable.** Le STL source reste dans `neve/source/`, hors du site. Mais tout modèle 3D affiché sur le web peut être extrait du navigateur : le GLB publié est une version allégée (simplifiée et quantifiée), pas ton fichier d'impression. Ta vraie protection, c'est la marque, la vitesse d'exécution et la garantie à vie, pas le secret du fichier. Si le design est vraiment original, un dépôt de dessin et modèle à l'INPI coûte peu.
