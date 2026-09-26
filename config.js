/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour brancher le formulaire, changer l'email ou modifier les packs.
 */

// Lien du formulaire Google d'audit gratuit. Tous les boutons « Réserver mon audit gratuit »
// et « Choisir … » ouvrent ce lien dans un nouvel onglet.
const AUDIT_FORM_URL = 'https://forms.gle/VtS7yDsHmgn86Yu2A';

window.AUTOFLOW_CONFIG = {
  AUDIT_FORM_URL,

  contactEmail: 'contact.autoflow1@gmail.com',

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
    { key: 'guarantee', label: 'Garantie « rentabilisé en 30 jours ou mois offert »' },
  ],

  // Les packs s'affichent dans cet ordre (Scale en premier : c'est l'ancre de prix).
  //   conversations : nombre par mois, ou null si illimitées (sert au coût par conversation)
  //   dailyNote     : fin de la phrase « soit X € par jour, … » (absent = pas de phrase)
  //   compareTo     : pack de référence pour les comparaisons de la carte recommandée
  //   values        : true = Oui, false = Non (croix et texte grisé), texte = affiché tel quel
  packs: [
    {
      name: 'Scale',
      price: 1780,
      conversations: null,
      forWho: 'Boutiques à fort trafic ou multi-boutiques',
      dailyNote: "moins qu'un salarié à temps plein pour répondre à tes clients",
      guaranteeUnderButton: true,
      values: {
        agent: true, conversations: 'Illimitées', proactive: true, recovery: true,
        report: 'Oui, hebdomadaire', objections: true, audit: true, multi: true, contact: 'Oui, réponse sous 24 h',
        launch: '5 jours', guarantee: true,
      },
    },
    {
      name: 'Croissance',
      price: 480,
      conversations: 3000,
      recommended: true,
      forWho: 'Récupérer un maximum de ventes perdues',
      dailyNote: "moins qu'une vente perdue",
      compareTo: 'Essentiel',
      pitchExtras: 'la relance des paniers et la garantie',
      guaranteeUnderButton: true,
      values: {
        agent: true, conversations: "Jusqu'à 3 000", proactive: true, recovery: true,
        report: 'Oui, mensuel', objections: true, audit: false, multi: false, contact: false,
        launch: '7 jours', guarantee: true,
      },
    },
    {
      name: 'Essentiel',
      price: 280,
      conversations: 500,
      forWho: 'Tester un vendeur IA sur ton site',
      values: {
        agent: true, conversations: "Jusqu'à 500", proactive: false, recovery: false,
        report: 'Rapport simple', objections: false, audit: false, multi: false, contact: false,
        launch: '7 jours', guarantee: false,
      },
    },
  ],

  guaranteeLine: 'Rentabilisé en 30 jours ou mois offert',

  pricingNotes: [
    'Option : refonte de 10 fiches produits à partir des objections de tes clients, 290 €.',
  ],
};
