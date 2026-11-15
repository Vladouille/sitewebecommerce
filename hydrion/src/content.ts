/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CONTENU DU SITE — fichier unique à modifier pour décliner le site
 *  pour un vrai client (nom, téléphone, ville, prix, textes).
 * ─────────────────────────────────────────────────────────────────────────────
 *  Couleurs : tailwind.config.ts  ·  Tracking : src/lib/analytics.ts
 */

export const brand = {
  name: 'HYDRION',
  tagline: 'Plomberie & Chauffage',
  city: 'Lyon',
  area: 'Lyon et 25 km autour',
  /** Promesse principale, reprise dans le hero, le titre SEO et le CTA final. */
  promise: 'Une fuite ? Un plombier chez vous en 30 minutes. Prix annoncé avant toute intervention.',
} as const;

export const contact = {
  /** Affichage humain. */
  phoneDisplay: '04 00 00 00 00',
  /** Toujours au format international pour les liens tel: (aucun espace). */
  phoneE164: '+33400000000',
  email: 'contact@hydrion-plomberie.example',
  hoursShort: '7j/7 · 24h/24',
  hoursLong: 'Urgences 7 jours sur 7, 24 heures sur 24',
  /** Adresse FICTIVE (portfolio). À remplacer par la vraie adresse du client. */
  address: {
    street: '00 rue de l’Exemple',
    postalCode: '69003',
    city: 'Lyon',
  },
} as const;

export const telHref = `tel:${contact.phoneE164}`;

/**
 * Badge « disponibles maintenant ».
 * ⚠️ VRAI CLIENT : ne garder ce badge que s'il est branché sur une donnée réelle
 * (planning, API). Un chiffre figé = pratique commerciale trompeuse (Code conso. L121-2).
 * Mettre `enabled: false` pour le masquer partout.
 */
export const availability = {
  enabled: true,
  count: 3,
  label: (n: number) => `${n} plombier${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''} maintenant`,
  shortLabel: (n: number) => `${n} dispo.`,
} as const;

export const nav = [
  { id: 'services', label: 'Services' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'zone', label: 'Zone' },
  { id: 'avis', label: 'Avis' },
  { id: 'faq', label: 'FAQ' },
] as const;

export const hero = {
  eyebrow: 'URGENCE 24/7 — LYON & ALENTOURS',
  /** H1 en 3 lignes à 390 px : accroche / promesse / délai (largeurs mesurées). */
  titleHook: 'Une fuite ?',
  titleStart: 'Un plombier chez vous',
  titleHighlight: 'en 30 minutes.',
  subtitle:
    'Prix annoncé avant intervention. Aucune surprise sur la facture. Garantie 2 ans sur la main d’œuvre.',
  ctaCall: 'Appeler maintenant',
  ctaQuote: 'Devis gratuit en 60 secondes',
  trust: [
    { value: '★ 4,9/5', label: '312 avis (exemple)' },
    { value: '27 min', label: 'intervention moyenne' },
    { value: '+4 800', label: 'dépannages' },
  ],
} as const;

export const mobileBar = {
  call: 'Appeler',
  quote: 'Devis 60 s',
} as const;

export const footer = {
  pitch:
    'Plombier et chauffagiste à Lyon. Intervention en 30 minutes, prix annoncé avant de commencer, garantie 2 ans.',
  zones: ['Lyon 1er → 9e', 'Villeurbanne', 'Vénissieux', 'Caluire-et-Cuire', 'Bron', 'Écully'],
  legal: [{ label: 'Mentions légales', href: './mentions-legales.html' }],
  /** Mention obligatoire : le site est une démonstration. */
  demoNotice: 'Site de démonstration — entreprise fictive',
  /**
   * ⚠️ À PERSONNALISER : ton nom / ton agence et l'URL de ton portfolio.
   * Tant que `url` vaut '#', le lien n'est pas rendu (évite un lien mort).
   */
  credit: {
    name: '[VOTRE NOM / AGENCE]',
    url: '#',
  },
} as const;

export const seo = {
  title: 'Plombier Lyon 24h/24 — Intervention en 30 min | HYDRION',
  description:
    'Fuite, WC bouché, plus d’eau chaude ? Plombier à Lyon en 30 min, 7j/7. Prix annoncé avant intervention, garantie 2 ans. Devis gratuit en 60 s.',
  /** ⚠️ À remplacer par le domaine final (sert aux URLs absolues OG / canonical / sitemap). */
  siteUrl: 'https://hydrion.example',
  /**
   * DÉMO PORTFOLIO : false → balise noindex (le site n'apparaît pas dans Google).
   * Pourquoi : un faux plombier indexé sur « plombier Lyon » = de vraies personnes en urgence
   * qui appellent un faux numéro, et un risque de pénalité Google sur TON domaine.
   * VRAI CLIENT : passer à true.
   */
  indexable: false,
} as const;

/** Page mentions légales (version démo). Pour un vrai client : remplir chaque [À COMPLÉTER]. */
export const legal = {
  updatedAt: '15 novembre 2026',
  sections: [
    {
      title: 'Site de démonstration',
      body: [
        'HYDRION est une entreprise fictive. Ce site est une démonstration réalisée pour un portfolio : aucune prestation n’est vendue, le numéro de téléphone n’est pas attribué et les avis affichés sont des exemples de mise en page.',
      ],
    },
    {
      title: 'Éditeur du site',
      body: [
        'Conception et édition : [À COMPLÉTER : nom ou raison sociale du concepteur].',
        'Contact : [À COMPLÉTER : email].',
        'Directeur de la publication : [À COMPLÉTER : prénom et nom].',
      ],
    },
    {
      title: 'Hébergement',
      body: ['[À COMPLÉTER : raison sociale, adresse et téléphone de l’hébergeur].'],
    },
    {
      title: 'Données personnelles',
      body: [
        'Le simulateur de devis de cette démonstration n’envoie aucune donnée : les informations saisies restent dans votre navigateur et sont effacées à la fermeture de la page.',
      ],
    },
    {
      title: 'Cookies',
      body: ['Ce site ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience tiers.'],
    },
    {
      title: 'Propriété intellectuelle',
      body: [
        'Les textes, illustrations et le code de ce site sont la propriété de leur auteur. Toute reproduction sans autorisation écrite est interdite.',
      ],
    },
  ],
} as const;
