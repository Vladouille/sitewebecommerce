/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour brancher le formulaire, changer l'email ou modifier les packs.
 */

// Identifiant du formulaire Tally (créé sur tally.so avec contact.autoflow1@gmail.com).
// C'est la fin du lien de partage : https://tally.so/r/w4ABcD  ->  'w4ABcD'.
// Tant qu'il est vide, la section #audit propose d'écrire à contactEmail.
const TALLY_FORM_ID = '';

window.AUTOFLOW_CONFIG = {
  TALLY_FORM_ID,

  contactEmail: 'contact.autoflow1@gmail.com',

  // Paiement annuel : nombre de mois offerts sur 12. Le prix annuel affiché est calculé à partir de ce réglage.
  annualFreeMonths: 2,

  // Lignes comparées dans chaque pack, dans l'ordre d'affichage.
  rows: [
    { key: 'agent', label: 'Vendeur IA 24h/24 sur ton catalogue (tailles, délais, retours)' },
    { key: 'conversations', label: 'Conversations par mois' },
    { key: 'proactive', label: 'Déclenchement au bon moment (fiche produit, sortie de page, panier)' },
    { key: 'recovery', label: 'Relance des paniers abandonnés par WhatsApp et email' },
    { key: 'report', label: 'A/B test et rapport des ventes récupérées' },
    { key: 'objections', label: 'Rapport des objections de tes clients' },
    { key: 'audit', label: 'Audit conversion mensuel et recommandations sur tes fiches produits' },
    { key: 'multi', label: 'Plusieurs langues ou plusieurs boutiques' },
    { key: 'contact', label: 'Interlocuteur dédié' },
    { key: 'launch', label: 'Mise en ligne' },
    { key: 'setup', label: 'Frais de mise en place' },
    { key: 'guarantee', label: 'Garantie « rentabilisé en 30 jours ou mois offert »' },
  ],

  // Les packs s'affichent dans cet ordre (Scale en premier : c'est l'ancre de prix).
  //   conversations : nombre par mois, ou null si illimitées (sert au coût par conversation)
  //   setupFee      : frais de mise en place réellement payés (sert à l'écart du premier mois)
  //   dailyNote     : fin de la phrase « soit X € par jour, … » (absent = pas de phrase)
  //   compareTo     : pack de référence pour les comparaisons de la carte recommandée
  //   values        : true = Oui, false = Non (croix et texte grisé), texte = affiché tel quel
  // `name` doit correspondre à l'option « pack » du formulaire Tally.
  packs: [
    {
      name: 'Scale',
      price: 1780,
      conversations: null,
      setupFee: 0,
      forWho: 'Boutiques à fort trafic ou multi-boutiques',
      dailyNote: "moins qu'un salarié à temps plein pour répondre à tes clients",
      guaranteeUnderButton: true,
      values: {
        agent: true, conversations: 'Illimitées', proactive: true, recovery: true,
        report: 'Oui, hebdomadaire', objections: true, audit: true, multi: true, contact: 'Oui, réponse sous 24 h',
        launch: '5 jours', setup: 'Offerts (valeur 190 €)', guarantee: true,
      },
    },
    {
      name: 'Croissance',
      price: 480,
      conversations: 3000,
      setupFee: 0,
      recommended: true,
      forWho: 'Récupérer un maximum de ventes perdues',
      dailyNote: "moins qu'une vente perdue",
      compareTo: 'Essentiel',
      pitchExtras: 'la relance des paniers, la garantie et la mise en place offerte',
      guaranteeUnderButton: true,
      values: {
        agent: true, conversations: "Jusqu'à 3 000", proactive: true, recovery: true,
        report: 'Oui, mensuel', objections: true, audit: false, multi: false, contact: false,
        launch: '7 jours', setup: 'Offerts (valeur 190 €)', guarantee: true,
      },
    },
    {
      name: 'Essentiel',
      price: 280,
      conversations: 500,
      setupFee: 190,
      forWho: 'Tester un vendeur IA sur ton site',
      values: {
        agent: true, conversations: "Jusqu'à 500", proactive: false, recovery: false,
        report: 'Rapport simple', objections: false, audit: false, multi: false, contact: false,
        launch: '7 jours', setup: '190 €', guarantee: false,
      },
    },
  ],

  guaranteeLine: 'Rentabilisé en 30 jours ou mois offert',

  pricingNotes: [
    'Paiement annuel : 2 mois offerts sur tous les packs.',
    'Option : refonte de 10 fiches produits à partir des objections de tes clients, 290 €.',
  ],
};
