/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour changer le lien de réservation, l'email ou les prix.
 */
window.AUTOFLOW_CONFIG = {
  // Lien Cal.com ou Calendly. Tant qu'il est vide, les boutons ouvrent un email vers contactEmail.
  bookingUrl: '',

  // [À CONFIRMER] Adresse de contact affichée dans le pied de page.
  contactEmail: 'contact@autoflow.fr',

  // Lignes du tableau de prix, dans l'ordre d'affichage.
  features: [
    { key: 'agent', label: 'Vendeur IA sur le site' },
    { key: 'proactive', label: 'Déclenchement proactif' },
    { key: 'recovery', label: 'Relance paniers WhatsApp + email' },
    { key: 'report', label: 'Rapport mensuel ventes et objections' },
    { key: 'abtest', label: 'A/B test et optimisation' },
    { key: 'product', label: 'Recommandations fiches produits' },
  ],

  // true = Oui, false = Non, texte = affiché tel quel.
  plans: [
    {
      name: 'Essentiel',
      price: 490,
      values: { agent: true, proactive: false, recovery: false, report: true, abtest: false, product: false },
    },
    {
      name: 'Croissance',
      price: 790,
      recommended: true,
      values: { agent: true, proactive: true, recovery: true, report: true, abtest: 'Mensuelle', product: false },
    },
    {
      name: 'Premium',
      price: 2490,
      values: { agent: true, proactive: true, recovery: true, report: true, abtest: 'Hebdomadaire', product: 'Oui, suivi dédié' },
    },
  ],

  pricingNotes: [
    'Frais de mise en place offerts aux premiers clients.',
    '2 mois offerts en paiement annuel.',
  ],
};
