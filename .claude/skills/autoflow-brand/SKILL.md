---
name: autoflow-brand
description: >
  Identité visuelle et ton de marque d'Autoflow (agence qui remplit l'agenda des coachs
  en ligne d'appels de vente qualifiés). À utiliser dès qu'on produit ou modifie quoi que
  ce soit qui porte la marque Autoflow : landing page, pages légales, page de vente,
  post ou visuel Instagram, carrousel, deck, proposition commerciale, email, PDF, favicon,
  image Open Graph, signature, même si l'utilisateur ne dit pas « charte » ou « marque ».
  Prime sur le skill brand-guidelines (charte Anthropic), qui ne s'applique jamais à Autoflow.
---

# Autoflow : identité de marque

Autoflow vend des **appels de vente qualifiés** à des coachs en transformation physique.
La marque doit inspirer ce qu'un coach à 10-50 k€/mois attend d'un prestataire :
sérieux, précision, résultats mesurés. Pas une startup IA bariolée, pas un gourou du
marketing. D'où un style monochrome, éditorial, sobre, dérivé du logo.

Source de vérité technique : `styles.css` (tokens `:root`) et `config.js` (offre, prix,
lien du formulaire). Si ce fichier et le code divergent, le code fait foi : signale l'écart.

## Logo

- Fichier : `assets/AUTOFLOW.png`. « AUTOFLOW » en capitales à empattements, noir sur
  blanc, suivi d'un petit triangle noir plein (croissance). Logo validé : **ne jamais le
  redessiner, recolorer, déformer ni ajouter d'effet**.
- Si le PNG est absent, le site affiche un repli texte (`.logo__text` + `.tri`). Ce repli
  n'est pas le logo officiel : signale l'absence du fichier plutôt que de la masquer.
- Sur fond noir : version blanche uniquement si elle a été fournie ; sinon, poser le logo
  sur une zone blanche.

## Couleurs

| Token | Hex | Rôle |
|---|---|---|
| `--ink` | `#0A0A0A` | Texte, boutons, fonds sombres |
| `--paper` | `#FFFFFF` | Fond principal, texte sur fond sombre |
| `--soft` | `#F4F4F4` | Fonds de section discrets, pack recommandé |
| `--line` | `#D4D4D4` | Filets, bordures |
| `--muted` | `#5C5C5C` | Texte secondaire (contraste 6,7:1 sur blanc, conforme AA) |

Aucune couleur d'accent. La hiérarchie se fait par la taille, la graisse, le contraste
noir/blanc et l'espace. Une couleur ajoutée « pour donner du peps » affaiblit la marque.
Exception tolérée : les éléments qui imitent une vraie interface (bulle Instagram) peuvent
reprendre les codes de cette interface, à l'intérieur de la maquette seulement.

Ne pas descendre sous `#5C5C5C` pour du texte sur blanc (ni sous `#767676` en aucun cas) :
les coachs lisent sur téléphone, souvent en plein jour.

## Typographies

- **Titres** : Libre Caslon Text (serif proche du logo), graisse 400, interlignage 1,15,
  approche -0,01em. L'italique sert à une nuance de sens, jamais à « accentuer un mot ».
- **Texte courant** : Inter 400/500/600, 17px (1,0625rem), interlignage 1,6.
- Polices **auto-hébergées** dans `assets/fonts` (licence SIL OFL), aucun appel à Google
  Fonts : c'est ce qui permet de ne pas avoir de bandeau cookies. Ne pas réintroduire de
  CDN de polices.
- Hors web (Canva, PowerPoint) : mêmes familles ; à défaut, Georgia pour les titres et
  Arial/Helvetica pour le texte.

## Formes et motifs

- Boutons : fond `--ink`, texte blanc, bordure 2px, rayon 2px, inversion au survol.
  Libellé = l'action exacte (« Réserver mon audit gratuit », « Choisir Croissance »).
- Le **triangle du logo** est le seul motif graphique : puces, indicateur de croissance,
  favicon. Un seul usage discret par bloc.
- Rayon de bordure : 2px partout. Pas d'ombres portées grises : la mise en valeur se fait
  par une bordure noire (ex. `box-shadow: 0 0 0 2px var(--ink)` sur le pack recommandé).
- **Une seule animation** sur la landing : la conversation Instagram du hero. Respecter
  `prefers-reduced-motion`.

## Interdits (et pourquoi)

| Interdit | Raison |
|---|---|
| Fond crème + accent terracotta (`#D97757`, charte Anthropic) | Signature des pages générées par IA, et charte d'une autre marque |
| Fond noir + accent vert acide | Même raison |
| Cartes arrondies identiques avec ombres grises, dégradés décoratifs | « Kit SaaS » générique |
| Labels en capitales au-dessus de chaque titre | Tic de template |
| Animations d'entrée sur chaque section | Bruit, ralentit la lecture mobile |
| Flèche « → » ajoutée aux boutons | Tic de template |
| Photos de corps avant/après | Interdit par la marque et à risque sur Meta |
| Prix barrés, « X mois offerts », « le plus populaire » | Fausse promo, fausse preuve sociale |

## Ton et vocabulaire

- **Tutoiement** partout, phrases courtes, voix active.
- On vend des **appels qualifiés et des clients signés**, pas de l'IA. Le mot « IA »
  n'est jamais l'argument principal (il apparaît là où c'est utile ou obligatoire :
  transparence envers les prospects, FAQ).
- On ne promet **jamais** un revenu ou un nombre de clients signés. On promet un objectif
  d'appels qualifiés, mesuré et garanti.
- Aucun client, témoignage, chiffre ou capture inventé : un emplacement de preuve vide
  reste vide et clairement marqué.
- Pas de fausse urgence ni de fausse rareté.
- Vocabulaire du coach : « prospect », « appel de vente », « setter », « agenda »,
  « accompagnement », « signer un client ». Éviter le jargon technique (« workflow »,
  « webhook », « LLM », « automation »).

## Contrôle rapide avant livraison

1. Le logo est le fichier officiel, non modifié.
2. Uniquement les 5 couleurs ci-dessus (hors maquette d'interface).
3. Caslon pour les titres, Inter pour le texte.
4. Aucun élément de la liste des interdits.
5. Tutoiement, aucune promesse de revenu, aucune preuve inventée.

Pour le site, lance aussi le script de vérification :

```bash
node .claude/skills/autoflow-brand/scripts/verifier-site.mjs
```

Il contrôle les liens du formulaire, l'ordre et les prix des packs, le débordement à
375 px, les textes alternatifs, les pages légales et les interdits de marque. Un échec
(`ÉCHEC`) bloque la livraison ; une alerte (`ALERTE`) doit être signalée à l'utilisateur.
