# HYDRION — plan et suivi

## Décisions prises (et pourquoi)
| Décision | Raison |
|---|---|
| Projet isolé dans `hydrion/` | La racine est le site Autoflow en production, avec des règles de design contraires. |
| React 18.3 + R3F 8 + drei 9 + three 0.170 (versions figées) | R3F 9 exige React 19 ; three ≥ 0.18x casse des API de drei 9. |
| Tailwind 3.4 | Le brief demande des tokens dans `tailwind.config` (supprimé en Tailwind 4). |
| HTML pré-rendu au build + hydratation | Texte et CTA visibles avant le JS (LCP mobile) et même si le JS plante (piège n°4). |
| `base: './'` | `dist/` fonctionne à la racine d'un domaine ou dans un sous-dossier de portfolio. |
| Header masqué **seulement** si le dock d'appel est visible | Résout la contradiction « header caché au scroll » contre « numéro visible à tout moment ». |
| Pastille d'appel flottante ≥ 768 px | Même règle sur desktop/tablette (la barre sticky est réservée au mobile). |
| Texte des CTA cuivre en bleu nuit | Blanc sur #FF7A1A ≈ 2,5:1 (échec AA) ; nuit ≈ 7,5:1. |
| `seo.indexable: false` pour la démo (noindex) | Un faux plombier indexé = vrais clients en urgence sur un faux numéro + risque de pénalité Google sur ton domaine. Lighthouse SEO sera mesuré avec `indexable: true` (le noindex coûte à lui seul ~15 points). |
| Pas de note `aggregateRating` dans le JSON-LD tant que les avis sont fictifs | Données structurées trompeuses = action manuelle Google possible. |
| Badge « X plombiers disponibles » désactivable | Chiffre figé chez un vrai client = pratique commerciale trompeuse. |
| H1 en 3 lignes « Une fuite ? / Un plombier chez vous / en 30 minutes. » | Largeurs mesurées : tient sur 3 lignes de 320 à 768 px. |

## Phases
- [x] **1. Fondations** : Vite, Tailwind + tokens, polices auto-hébergées (latin, 6 fichiers, preload Sora 700), Lenis + GSAP synchronisés, header, menu mobile, dock d'appel, footer, page mentions légales, analytics `dataLayer`, pré-rendu.
- [ ] 2. Contenu statique complet (toutes les sections, sans animation)
- [ ] 3. Motion 2D (+ loader goutte)
- [ ] 4. 3D hero + fallback 2D (le fallback doit aussi remplir la moitié droite du hero desktop)
- [ ] 5. Tunnel scroll-story + carte de zone
- [ ] 6. Simulateur de devis + tracking des étapes
- [ ] 7. Optimisation (Lighthouse, bundle, a11y, SEO, JSON-LD, OG image, sitemap, favicon PNG)
- [ ] 8. Livraison (build, `npx serve dist`, README complet, rapport)

## Points de vigilance ouverts
- **JS initial = 143 Ko gzip** (React + Framer Motion + GSAP) sans 3D. Cible phase 7 : `LazyMotion` (−30 Ko), GSAP chargé après le premier rendu.
- Crédit footer `[VOTRE NOM / AGENCE]` et URL : à fournir (`content.ts > footer.credit`).
- Domaine final inconnu : `seo.siteUrl` vaut `https://hydrion.example` (canonical, OG, sitemap).
