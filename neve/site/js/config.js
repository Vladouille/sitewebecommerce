// ─────────────────────────────────────────────────────────────
//  NÉVÉ — RÉGLAGES DU SITE. C'est le SEUL fichier à modifier
//  au quotidien (stock, liens Stripe, formulaire, email).
// ─────────────────────────────────────────────────────────────

// Stock réel restant dans le Drop en cours. Mets-le à jour à la main
// après chaque vente. Un stock affiché faux = pratique commerciale trompeuse.
// À 0, tous les boutons d'achat deviennent « Rejoindre la liste du Drop #2 ».
export const STOCK = 25;
export const STOCK_TOTAL = 25;
export const DROP_NAME = 'Drop #1';

// Un Payment Link Stripe par pack (Dashboard Stripe → Payment Links → Créer).
// Tant qu'un lien contient « XXXX », le bouton affiche une alerte au lieu de payer.
export const STRIPE_LINKS = {
  solo: 'https://buy.stripe.com/XXXX_SOLO',
  duo: 'https://buy.stripe.com/XXXX_DUO',
  clan: 'https://buy.stripe.com/XXXX_CLAN',
};

// Formulaire d'inscription au Drop #2 (Google Forms, Tally…), utilisé quand STOCK = 0.
export const DROP2_FORM_URL = 'https://tally.so/r/XXXX';

// Badge de la carte Duo. « Le plus choisi » est une affirmation chiffrée :
// ne l'active que quand le Duo est RÉELLEMENT ton pack le plus vendu.
export const DUO_BADGE = 'Recommandé'; // → 'Le plus choisi' une fois prouvé

// Email de contact affiché dans le pied de page.
export const CONTACT_EMAIL = 'contact@TON-DOMAINE.fr';

// Section « Ils l'ont testée » : reste masquée tant que c'est false.
// N'y mets QUE de vraies vidéos de vrais clients, avec leur accord écrit.
export const SHOW_REVIEWS = false;
export const REVIEWS = [
  // { video: 'assets/reviews/lea.mp4', poster: 'assets/reviews/lea.webp', name: 'Léa', caption: 'Première bataille à La Plagne' },
];

// Mesure d'audience sans cookie (Plausible). Vide = désactivée.
// Exemple : 'neve.fr'. Si tu l'actives, mets à jour confidentialite.html.
export const PLAUSIBLE_DOMAIN = '';
