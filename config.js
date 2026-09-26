/*
 * Autoflow — réglages de la landing page.
 * C'est le seul fichier à modifier pour changer le lien du formulaire ou les packs.
 */

// Lien du formulaire Google d'audit gratuit. Tous les boutons « Réserver mon audit gratuit »
// et « Choisir … » ouvrent ce lien dans un nouvel onglet. À remplacer par le formulaire adapté aux coachs.
const AUDIT_FORM_URL = 'https://forms.gle/VtS7yDsHmgn86Yu2A';

window.AUTOFLOW_CONFIG = {
  AUDIT_FORM_URL,

  contactEmail: 'contact.autoflow1@gmail.com',

  // Lignes comparées dans chaque pack, dans l'ordre d'affichage.
  rows: [
    { key: 'dm', label: 'Réponse en quelques secondes aux messages privés, 24h/24' },
    { key: 'comments', label: 'Réponse aux commentaires qui mènent en message privé' },
    { key: 'conversations', label: 'Conversations par mois' },
    { key: 'booking', label: 'Qualification et réservation directe dans ton agenda' },
    { key: 'followup', label: 'Relance des prospects hésitants' },
    { key: 'setter', label: 'Setter humain pour les conversations délicates' },
    { key: 'report', label: 'Rapport mensuel appels et objections' },
    { key: 'contact', label: 'Interlocuteur dédié' },
    { key: 'launch', label: 'Mise en place' },
    { key: 'guarantee', label: "Garantie « objectif d'appels atteint ou on continue gratuitement »" },
  ],

  // Les packs s'affichent dans cet ordre (Scale en premier : c'est l'ancre de prix).
  //   conversations : nombre par mois, ou null si illimitées (sert au coût par conversation)
  //   reframe       : phrase de recadrage affichée sous le prix (absent = pas de phrase)
  //   compareTo     : pack de référence pour les comparaisons de la carte recommandée
  //   values        : true = Oui, false = Non (croix et texte grisé), texte = affiché tel quel
  packs: [
    {
      name: 'Scale',
      price: 1780,
      conversations: null,
      forWho: 'Coachs à forte audience ou avec une équipe',
      reframe: "Moins qu'un setter à temps plein, sans jamais dormir.",
      guaranteeUnderButton: true,
      values: {
        dm: true, comments: true, conversations: 'Illimitées', booking: true, followup: true,
        setter: true, report: 'Oui, hebdomadaire', contact: 'Oui, réponse sous 24 h',
        launch: '5 jours', guarantee: true,
      },
    },
    {
      name: 'Croissance',
      price: 480,
      conversations: 1500,
      recommended: true,
      forWho: 'Remplir ton agenda chaque semaine',
      reframe: 'Un seul client signé à 1 500 € rembourse plus de 3 mois.',
      compareTo: 'Essentiel',
      pitchExtras: 'les commentaires, la relance des hésitants et la garantie',
      guaranteeUnderButton: true,
      values: {
        dm: true, comments: true, conversations: "Jusqu'à 1 500", booking: true, followup: true,
        setter: false, report: 'Oui', contact: false,
        launch: '7 jours', guarantee: true,
      },
    },
    {
      name: 'Essentiel',
      price: 280,
      conversations: 300,
      forWho: 'Tester le système sur tes messages privés',
      values: {
        dm: true, comments: false, conversations: "Jusqu'à 300", booking: true, followup: false,
        setter: false, report: 'Rapport simple', contact: false,
        launch: '7 jours', guarantee: false,
      },
    },
  ],

  guaranteeLine: "Objectif d'appels atteint ou on continue gratuitement",

  pricingNotes: [
    'Option : script de vente pour tes appels, construit à partir des objections de tes prospects, 290 €.',
  ],
};
