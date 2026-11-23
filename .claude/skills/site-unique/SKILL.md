---
name: site-unique
description: >
  Garde-fou anti-« site fait par l'IA » et contrôle de finition au détail près. À utiliser
  pour TOUT site, landing page, page de vente, section ou maquette web qu'on crée, refond
  ou relit, même si l'utilisateur ne parle pas d'originalité : il veut toujours un résultat
  qui ne ressemble pas aux pages générées habituelles et dont chaque détail est soigné.
  Contient le catalogue des clichés à remplacer, la méthode pour trouver une identité
  propre au sujet, la liste des détails de finition (typographie française, états,
  mobile, accessibilité) et un script qui détecte clichés et défauts sur n'importe quelle page.
---

# Site unique, soigné au détail près

## Pourquoi les sites IA se ressemblent tous

À chaque décision (couleur, police, mise en page, phrase), un modèle choisit l'option la
plus probable. Cent décisions « probables » donnent la page moyenne d'Internet : hero
centré, dégradé violet, trois cartes à icônes, « Révolutionnez votre business ». Se dire
« sois original » ne suffit pas, parce que le réflexe revient à chaque petite décision.
La méthode : **à chaque choix, nommer le réflexe par défaut, puis décider en connaissance
de cause** à partir du sujet. Et vérifier ensuite avec le script, parce que les réflexes
reviennent aussi pendant le codage.

Ordre de priorité : la charte du client (ex. `autoflow-brand`) et le `CLAUDE.md` du projet
passent avant ce skill. Ce skill complète `frontend-design` (principes de direction
artistique) : il ajoute le catalogue précis, les détails et la vérification.

## 1. Trouver l'identité dans le sujet, pas dans les tendances

Avant de dessiner, réponds par écrit en 5 lignes :
1. **L'objet du métier** : quel artefact n'existe que dans l'univers de ce client ?
   (Autoflow : une conversation Instagram qui finit par un appel réservé. Un cabinet
   d'avocats : la page de code annotée. Un torréfacteur : la fiche de torréfaction.)
   Il devient l'élément marquant de la page.
2. **Le vocabulaire du client final** : ses mots, pas ceux du prestataire.
3. **La matière** : quelles textures, formes, typos existent déjà dans ce métier
   (étiquettes, carnets, écrans, enseignes, documents officiels) ?
4. **L'émotion visée** en un mot (sérieux, appétit, calme, défi…) : elle tranche les doutes.
5. **Ce que feraient 9 agences sur 10**, pour ne pas le faire.

**Test du remplacement** (à faire sur le plan, puis sur la page finie) : remplace le nom
et le logo par ceux d'un concurrent. Si la page fonctionne encore telle quelle, elle est
générique. Recommence à partir de l'objet du métier.

## 2. Catalogue des clichés à remplacer

Un cliché n'est pas interdit dans l'absolu : il est interdit **par défaut**. Tu peux le
garder si tu sais expliquer pourquoi ce sujet précis le demande.

| Domaine | Cliché | À faire à la place |
|---|---|---|
| Couleur | Indigo/violet `#6366F1`/`#8B5CF6`, dégradé violet-rose | Palette tirée de la matière du métier, 4 à 6 hex nommés |
| Couleur | Crème `#F4F1EA` + terracotta `#D97757` ; noir + vert acide | Idem, et une seule couleur d'accent au maximum |
| Couleur | Dégradés décoratifs, texte en dégradé, « blobs » flous | Aplats ; un dégradé seulement s'il représente quelque chose |
| Typo | Inter/Poppins/Montserrat en titre | Une police d'affichage choisie pour le sujet ; Inter reste valable pour le texte courant |
| Typo | Un mot du titre en couleur, italique ou dégradé | Le titre entier porte l'idée ; la force vient de la phrase |
| Typo | Petits sur-titres en CAPITALES ESPACÉES au-dessus de chaque titre | Pas de sur-titre, sauf s'il porte une info (date, étape réelle) |
| Mise en page | Hero centré : titre, sous-titre, deux boutons, capture d'écran | Ouvrir sur l'objet du métier, en action |
| Mise en page | Grille de 3 cartes identiques icône + titre + texte | Liste éditoriale, tableau, comparaison, exemple concret |
| Mise en page | Tout dans des cartes arrondies avec la même ombre grise | Hiérarchie : filets, espace, une seule forme mise en avant |
| Mise en page | Numéros 01/02/03 sur des contenus qui ne sont pas une suite | Numéroter seulement une vraie séquence |
| Mouvement | Fondu + glissement sur chaque section au défilement | Un seul moment animé, au service du message |
| Composants | Flèche « → » au bout des boutons | Un libellé qui dit l'action : « Réserver mon audit » |
| Composants | Verre flouté (glassmorphism), bandeau de logos « Ils nous font confiance » | Rien, ou de vrais logos de vrais clients |
| Composants | Emoji dans les titres, icônes génériques de bibliothèque partout | Icônes rares, dessinées pour le sujet, ou pas d'icône |
| Preuve | « 10k+ clients », ★★★★★, avatars de stock, témoignages vagues | Uniquement des preuves réelles et vérifiables, sinon rien |
| Texte | Révolutionnez, boostez, propulsez, libérez votre potentiel | Dire ce que le produit fait, avec un chiffre ou un exemple |
| Texte | En quelques clics, tout-en-un, simple rapide et efficace | Le détail concret qui le prouve |
| Texte | « Pourquoi nous choisir ? », « Nos services », « Prêt à vous lancer ? » | Un titre qui répond à la vraie question du visiteur |
| Texte | « En savoir plus », « Découvrir », « Envoyer » | L'action exacte et son résultat |

## 3. Les détails qui font la différence

Ce sont eux qui séparent « correct » de « haut de gamme ». Le script en vérifie la
plupart ; le reste se vérifie à l'œil, sur capture.

**Typographie française**
- Espace insécable avant `? ! : ;` et à l'intérieur de `« »` (`&nbsp;` ou l'espace fine
  U+202F) : sinon la ponctuation passe seule à la ligne sur mobile.
- Guillemets `« »`, apostrophe `’`, points de suspension `…`, tiret `–` pour les intervalles.
- Montants : `1 780 €` avec espaces insécables (séparateur de milliers et avant `€`).
- Titres : `text-wrap: balance` (h1, h2) et `text-wrap: pretty` (paragraphes) pour éviter
  les mots orphelins ; `hyphens: auto` avec `lang="fr"` sur les colonnes étroites.
- Longueur de ligne : 45 à 75 caractères pour le texte courant.

**Rythme et cohérence**
- Une échelle d'espacements (ex. 4/8/12/16/24/32/48/64/96) et une échelle typographique ;
  aucune valeur « au jugé ».
- Alignements : tout ce qui est à gauche s'aligne sur la même ligne verticale.
- Une même action porte le même nom partout (bouton, lien, confirmation).

**États et cas limites**
- Chaque élément interactif a ses états : survol, focus clavier visible, actif, désactivé.
- Formulaires : libellés visibles, messages d'erreur qui disent quoi corriger, état
  « envoi en cours », confirmation.
- Contenus extrêmes : titre très long, prénom très court, prix à 5 chiffres, liste vide.
- Lien qui ouvre un nouvel onglet : le dire (texte masqué pour lecteur d'écran).

**Mobile d'abord**
- Tester à 320, 375, 768 et 1280 px. Aucun défilement horizontal.
- Zones cliquables d'au moins 24 px (44 px pour les boutons principaux).
- Le message et l'action principale sont visibles sans défiler sur un téléphone.

**Accessibilité et technique**
- Contraste AA (4,5:1 texte courant, 3:1 grands titres), `prefers-reduced-motion` respecté.
- Un seul `h1`, niveaux de titres sans saut, `lang` sur `<html>`, `alt` sur chaque image.
- Images avec `width`/`height` (pas de saut de page), formats modernes, chargement différé
  hors écran. Polices auto-hébergées avec `font-display: swap`.
- `title`, meta description, Open Graph, favicon sur chaque page ; page 404 soignée.
- Aucune erreur console, aucun fichier manquant.

## 4. Vérifier avant de livrer

```bash
node .claude/skills/site-unique/scripts/detecter-cliches.mjs index.html autre-page.html
```

Il accepte des fichiers locaux ou une URL en ligne (`https://…`), teste en 320, 375 et
1280 px, et classe chaque résultat :
- **ÉCHEC** : défaut objectif (contraste, lien mort, typo, débordement, image cassée,
  focus invisible). À corriger avant de livrer ; le script sort en erreur.
- **CLICHÉ** : marqueur de page générée. À remplacer, ou à justifier explicitement.
- **ALERTE** : détail de finition. À corriger, ou à signaler à l'utilisateur.

Puis, à l'œil, sur captures Playwright à 375 et 1280 px :
1. Le test du remplacement passe-t-il ?
2. L'élément marquant est-il visible sans défiler sur mobile ?
3. Y a-t-il **un** endroit audacieux et tout le reste discipliné ? Retire un accessoire.

Le script ne juge ni la direction artistique ni la qualité des textes : dis honnêtement
dans le rapport final ce qui a été vérifié par le script, ce qui l'a été à l'œil, et ce
qui ne l'a pas été.

Quand un projet révèle un nouveau cliché, ajoute-le au tableau ci-dessus et, s'il est
détectable, aux listes en tête du script (`COPY_CLICHES`, `TELL_COLORS`…).
