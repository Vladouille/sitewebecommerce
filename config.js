/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour brancher le formulaire, changer l'email ou modifier les packs.
 */

// Clé d'accès Web3Forms : à générer sur https://app.web3forms.com/forms avec l'adresse
// contact.autoflow1@gmail.com (elle est aussi envoyée par email à cette adresse).
// Tant qu'elle est vide, le formulaire affiche le message d'échec avec l'email de secours.
const WEB3FORMS_ACCESS_KEY = '';

window.AUTOFLOW_CONFIG = {
  WEB3FORMS_ACCESS_KEY,

  // Adresse affichée sur le site et proposée en secours si l'envoi du formulaire échoue.
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
    { key: 'setup', label: 'Frais de mise en place' },
    { key: 'guarantee', label: 'Garantie « rentabilisé en 30 jours ou mois offert »' },
  ],

  // true = Oui, false = Non, texte = affiché tel quel.
  // `name` doit correspondre à une option de la liste « Pack qui t'intéresse » du formulaire.
  packs: [
    {
      name: 'Essentiel',
      price: 280,
      forWho: 'Tester un vendeur IA sur ton site',
      values: {
        agent: true, conversations: "Jusqu'à 500", proactive: false, recovery: false,
        report: 'Rapport simple', objections: false, audit: false, multi: false, contact: false,
        launch: '7 jours', setup: '190 €', guarantee: false,
      },
    },
    {
      name: 'Croissance',
      price: 480,
      recommended: true,
      reframe: "Soit 16 € par jour, moins qu'une vente perdue.",
      forWho: 'Récupérer un maximum de ventes perdues',
      values: {
        agent: true, conversations: "Jusqu'à 3 000", proactive: true, recovery: true,
        report: 'Oui, mensuel', objections: true, audit: false, multi: false, contact: false,
        launch: '7 jours', setup: 'Offerts (valeur 190 €)', guarantee: true,
      },
    },
    {
      name: 'Scale',
      price: 1780,
      forWho: 'Boutiques à fort trafic ou multi-boutiques',
      values: {
        agent: true, conversations: 'Illimitées', proactive: true, recovery: true,
        report: 'Oui, hebdomadaire', objections: true, audit: true, multi: true, contact: 'Oui, réponse sous 24 h',
        launch: '5 jours', setup: 'Offerts (valeur 190 €)', guarantee: true,
      },
    },
  ],

  pricingNotes: [
    'Paiement annuel : 2 mois offerts sur tous les packs.',
    'Option : refonte de 10 fiches produits à partir des objections de tes clients, 290 €.',
  ],
};
