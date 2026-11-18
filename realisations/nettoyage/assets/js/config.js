/* ════════════════════════════════════════════════════════════════════
   CONFIG — le SEUL fichier à modifier pour adapter la démo à un prospect.
   Nom, coordonnées, couleurs, services, avis, chiffres, textes : tout est ici.
   (Fichier JavaScript classique : il fonctionne aussi en ouvrant index.html en double-clic.)
   ════════════════════════════════════════════════════════════════════ */
window.SITE = {

  /* ── L'entreprise (fictive) ─────────────────────────────────────── */
  entreprise: {
    nom: "Lucidea",
    metier: "Nettoyage professionnel",
    slogan: "Des lieux nets. Des équipes fiables.",
    description: "Entretien de bureaux, de copropriétés et de commerces, nettoyage de vitres et de fin de chantier.",
    zone: "Paris & Île-de-France",
    horaires: "Lun. – sam. · 7 h – 20 h",
    // Plage ARCEP réservée à la fiction (décision n° 2018-0881) : ce numéro ne peut ni appeler ni être appelé.
    telephone: "01 99 00 12 34",
    telephoneLien: "+33199001234",
    email: "contact@exemple.com",
    siret: "000 000 000 00000 (démo)"
  },

  /* ── Hero ───────────────────────────────────────────────────────── */
  hero: {
    titre: ["Des lieux", "impeccables."],          // 2 lignes, affichées en très grand
    texte: "Bureaux, parties communes, vitrines : une équipe formée passe aux heures qui vous arrangent, avec des produits écolabellisés. Vous ne pensez plus au ménage.",
    ctaPrincipal: "Demander un devis",
    ctaSecondaire: "Voir nos services",
    badges: ["Devis sous 24 h", "Équipes formées", "Produits écolabellisés"],
    image: "assets/img/hero-gants",               // sans extension : -800.webp et .webp sont utilisés
    imageAlt: "Mains en gants bleus nettoyant une surface blanche avec un spray et un chiffon."
  },

  /* ── Bandeau défilant ───────────────────────────────────────────── */
  marquee: ["Bureaux", "Copropriétés", "Commerces", "Vitres", "Fin de chantier", "Remise en état", "Désinfection", "Sols & moquettes"],

  /* ── Services (4 pôles, affichés en cartes empilées) ───────────── */
  services: [
    { titre: "Bureaux", texte: "Postes de travail, sanitaires, cuisine et salles de réunion entretenus avant l'arrivée de vos équipes, ou après leur départ.",
      points: ["Passage quotidien ou hebdomadaire", "Consommables réapprovisionnés", "Même équipe, mêmes habitudes"],
      image: "assets/img/service-bureaux", alt: "Open space lumineux avec grandes baies vitrées et bureaux rangés." },
    { titre: "Copropriétés", texte: "Halls, cages d'escalier, ascenseurs et local poubelles : des parties communes propres que les résidents remarquent.",
      points: ["Planning affiché dans le hall", "Sortie des conteneurs", "Rapport mensuel au syndic"],
      image: "assets/img/service-coproprietes", alt: "Cage d'escalier en granit aux murs blancs et rampe noire." },
    { titre: "Commerces", texte: "Sols, vitrines et cabines d'essayage nettoyés en dehors des heures d'ouverture, pour accueillir vos clients dans un lieu net.",
      points: ["Intervention avant ouverture", "Sols lavés et lustrés", "Vitrines sans traces"],
      image: "assets/img/service-commerces", alt: "Galerie marchande au sol brillant, vide et lumineuse." },
    { titre: "Vitres & fin de chantier", texte: "Vitres hautes, façades vitrées et remise en état après travaux : poussière fine, traces de peinture, étiquettes.",
      points: ["Perche à eau pure jusqu'à 12 m", "Dépoussiérage complet", "Lieu prêt à être livré"],
      image: "assets/img/service-vitres", alt: "Laveur de vitres nettoyant une façade vitrée avec une raclette." }
  ],

  /* ── Avant / après ──────────────────────────────────────────────── */
  avantApres: {
    titre: "Faites glisser. Constatez.",
    texte: "Un sol de couloir avant et après notre passage. La différence se voit, et surtout elle dure.",
    image: "assets/img/avant-apres-couloir",
    alt: "Couloir de bureaux au sol carrelé réfléchissant."
  },

  /* ── Méthode en 4 étapes ────────────────────────────────────────── */
  etapes: [
    { titre: "Visite et devis", texte: "On visite vos locaux, on mesure, on vous envoie un devis détaillé sous 24 h." },
    { titre: "Cahier des charges", texte: "Fréquence, horaires, zones sensibles : tout est écrit et validé avec vous." },
    { titre: "Une équipe dédiée", texte: "Les mêmes agents à chaque passage, formés à vos locaux et à vos consignes." },
    { titre: "Contrôle qualité", texte: "Un responsable vérifie chaque mois avec une grille de contrôle partagée." }
  ],
  methodeImage: "assets/img/methode-materiel",
  methodeImageAlt: "Seau orange, raclette et chiffon bleu posés contre un mur aqua.",

  /* ── Manifeste (se « nettoie » mot par mot au scroll) ─────────── */
  manifeste: "Un lieu propre ne se remarque pas. Il se ressent. C'est un hall qui accueille, un bureau où l'on respire, une vitrine qui donne envie d'entrer. Notre travail, c'est que vous n'y pensiez plus.",

  /* ── Chiffres (fictifs : démo) ──────────────────────────────────── */
  chiffres: [
    { valeur: 98, suffixe: " %", label: "de clients fidèles" },
    { valeur: 24, suffixe: " h", label: "pour recevoir votre devis" },
    { valeur: 350, suffixe: "", label: "sites entretenus chaque semaine" },
    { valeur: 12, suffixe: " ans", label: "de métier" }
  ],
  chiffresImage: "assets/img/chiffres-gants",
  chiffresImageAlt: "Mains en gants jaunes nettoyant un mur blanc avec une éponge et un spray.",

  /* ── Avis (3 maximum, exemples) ─────────────────────────────────── */
  avis: [
    { nom: "Sophie L.", contexte: "Gestionnaire de copropriété, Paris 15e", texte: "Les résidents ont remarqué la différence dès la deuxième semaine. Le planning est affiché, l'équipe est la même, et je n'ai plus d'appels pour le local poubelles." },
    { nom: "Karim B.", contexte: "Directeur d'agence, Boulogne-Billancourt", texte: "Devis reçu le lendemain de la visite, au prix annoncé. Les bureaux sont prêts avant 8 h, sans que personne ne croise l'équipe." },
    { nom: "Claire M.", contexte: "Gérante de boutique, Vincennes", texte: "Vitrine et sol faits avant l'ouverture, deux fois par semaine. Mes clientes me demandent si j'ai refait la boutique." }
  ],

  /* ── Formulaire de devis (n'envoie rien : démo) ─────────────────── */
  devis: {
    lieux: ["Bureaux", "Copropriété", "Commerce", "Fin de chantier"],
    surfaces: ["Moins de 100 m²", "100 à 500 m²", "500 à 2 000 m²", "Plus de 2 000 m²"],
    frequences: ["Ponctuel", "Hebdomadaire", "Quotidien"],
    messageSucces: "Démo : dans votre futur site, cette demande arrive directement dans votre boîte mail."
  },

  /* ── Couleurs : 4 palettes (testées WCAG AA). L'accent ne sert jamais de texte sur fond clair. ── */
  palettes: {
    aqua:       { label: "Aqua frais",          encre: "#0B2A3C", accent: "#19C3B5", doux: "#CFF5EC", fond: "#F7FBFA", vif: "#F2E35C", gris: "#5B6B73" },
    eucalyptus: { label: "Vert eucalyptus",     encre: "#14291F", accent: "#5DBB8E", doux: "#DCEFE3", fond: "#F6FAF7", vif: "#E9D872", gris: "#55665C" },
    nuit:       { label: "Bleu nuit premium",   encre: "#0E1A33", accent: "#8DB0FF", doux: "#E1E8FA", fond: "#F7F8FC", vif: "#F3CD6E", gris: "#56627A" },
    sable:      { label: "Sable & noir",        encre: "#161514", accent: "#D7B68A", doux: "#F0E7DA", fond: "#FAF7F2", vif: "#E9C46A", gris: "#665F57" }
  },
  paletteParDefaut: "aqua",
  modeParDefaut: "clair",               // "clair" ou "sombre"

  /* ── Vous (le créateur du site) : le vrai appel à l'action de la démo ── */
  createur: {
    nom: "[MON NOM / MON AGENCE]",
    email: "[MON EMAIL]",
    telephone: "[MON TÉLÉPHONE]",
    site: "[MON SITE]"                  // ex. https://monagence.fr
  }
};
