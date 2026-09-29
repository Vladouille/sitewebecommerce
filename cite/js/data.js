// =====================================================================
// Aurore : toutes les données du jeu (réglages faciles à modifier ici)
// =====================================================================

export const N = 48;              // taille de la carte (cases)
export const TICKS_PER_MONTH = 30; // un tick = un jour de jeu
export const TICK_MS = 650;        // durée d'un jour à la vitesse x1
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const SEASON_OF_MONTH = [3, 3, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3]; // 0 printemps, 1 été, 2 automne, 3 hiver
export const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'];

export const DIFFICULTY = {
  facile: { name: 'Détendu', money: 60000, cost: 0.8, demand: 0.15, upkeep: 0.8 },
  normal: { name: 'Équilibré', money: 35000, cost: 1, demand: 0, upkeep: 1 },
  difficile: { name: 'Exigeant', money: 18000, cost: 1.2, demand: -0.1, upkeep: 1.15 },
};

export const MAPS = {
  vallee: { name: 'Vallée fluviale', text: 'Une rivière sinueuse traverse une vallée boisée.' },
  cote: { name: 'Côte', text: 'La mer borde la carte à l\'est, avec une plage et une petite baie.' },
  lacs: { name: 'Pays des lacs', text: 'Trois lacs et de nombreuses forêts. Plus de place pour les pompes, moins pour bâtir.' },
};

// ---------------------------------------------------------------------
// Zones : habitants ou emplois par niveau (indice 0 inutilisé)
// ---------------------------------------------------------------------
export const ZONES = {
  1: { key: 'R', name: 'Résidentiel', color: '#5fbf6a', people: [0, 6, 18, 48, 130], power: [0, 2, 5, 12, 28], water: [0, 2, 5, 12, 26] },
  2: { key: 'C', name: 'Commercial', color: '#4f9dde', people: [0, 4, 12, 30, 72], power: [0, 3, 7, 16, 36], water: [0, 1, 3, 7, 15] },
  3: { key: 'I', name: 'Industriel', color: '#e2b340', people: [0, 10, 22, 40, 60], power: [0, 6, 12, 20, 30], water: [0, 3, 6, 10, 14], pollution: [0, 0.45, 0.6, 0.75, 0.35] },
  4: { key: 'O', name: 'Bureaux', color: '#a67be0', people: [0, 8, 24, 60, 150], power: [0, 4, 10, 22, 48], water: [0, 1, 3, 8, 16], tech: 'tertiaire' },
};
// valeur foncière nécessaire pour atteindre chaque niveau
export const LEVEL_LAND = [0, 0, 32, 52, 72];
// palier de population nécessaire pour chaque niveau
export const LEVEL_MILESTONE = [0, 0, 1, 3, 5];

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------
export const ROADS = {
  1: { name: 'Route', cost: 12, upkeep: 0.4, capacity: 60 },
  2: { name: 'Avenue', cost: 35, upkeep: 1, capacity: 160, tech: 'avenues' },
};

// ---------------------------------------------------------------------
// Services, énergie, merveilles
// dept : poste du budget. size : côté de l'emprise. r : rayon d'action.
// ms : palier de population nécessaire. tech : recherche nécessaire.
// up : niveaux d'amélioration (coût, bonus). Le niveau se voit sur le bâtiment.
// ---------------------------------------------------------------------
export const DEPTS = {
  energie: 'Énergie', eau: 'Eau', dechets: 'Déchets', securite: 'Sécurité', sante: 'Santé',
  education: 'Éducation', loisirs: 'Loisirs', transports: 'Transports', merveilles: 'Merveilles',
};

export const BUILDINGS = {
  // Hôtel de ville : posé au départ, grandit avec les paliers, ne se démolit pas
  mairie: { name: 'Hôtel de ville', dept: null, size: 2, cost: 0, upkeep: 0, r: 6, cover: 'leisure', research: 1, fixed: true, text: 'Le cœur d\'Aurore. Il s\'agrandit à chaque palier de population.' },
  // Énergie
  eolienne: { name: 'Éolienne', dept: 'energie', size: 1, cost: 1400, upkeep: 25, power: 70, ms: 0, noise: 0.25, text: 'Propre, mais modeste. Ses pales tournent vraiment.' },
  charbon: { name: 'Centrale à charbon', dept: 'energie', size: 2, cost: 5500, upkeep: 130, power: 450, ms: 0, pollution: 1, polR: 8, text: 'Beaucoup d\'électricité, beaucoup de fumée.' },
  solaire: { name: 'Centrale solaire', dept: 'energie', size: 2, cost: 7000, upkeep: 50, power: 260, tech: 'solaire', text: 'Aucune pollution.' },
  gaz: { name: 'Centrale à gaz', dept: 'energie', size: 2, cost: 11000, upkeep: 240, power: 900, ms: 3, pollution: 0.45, polR: 6, text: 'Moins polluante que le charbon.' },
  nucleaire: { name: 'Centrale nucléaire', dept: 'energie', size: 3, cost: 42000, upkeep: 850, power: 4200, tech: 'nucleaire', text: 'Énorme production, aucune fumée.' },
  // Eau
  pompe: { name: 'Pompe à eau', dept: 'eau', size: 1, cost: 1300, upkeep: 30, water: 320, ms: 0, nearWater: true, text: 'À placer au bord de l\'eau.' },
  chateau: { name: 'Château d\'eau', dept: 'eau', size: 1, cost: 2600, upkeep: 60, water: 380, ms: 2, text: 'Se place n\'importe où.' },
  epuration: { name: 'Station d\'épuration', dept: 'eau', size: 2, cost: 8500, upkeep: 180, sewage: 2200, ms: 3, text: 'Traite les eaux usées. Indispensable à partir de 3 000 habitants.' },
  // Déchets
  decharge: { name: 'Décharge', dept: 'dechets', size: 2, cost: 2800, upkeep: 50, garbage: 220, ms: 1, pollution: 0.35, polR: 5, text: 'Simple et bon marché, mais sale.' },
  incinerateur: { name: 'Incinérateur', dept: 'dechets', size: 2, cost: 10000, upkeep: 220, garbage: 700, power: 120, tech: 'incinerateur', pollution: 0.5, polR: 6, text: 'Brûle les déchets et produit un peu d\'électricité.' },
  recyclage: { name: 'Centre de recyclage', dept: 'dechets', size: 2, cost: 12500, upkeep: 260, garbage: 650, research: 3, tech: 'recyclage', text: 'Aucune pollution, et un peu de recherche.' },
  // Sécurité
  police: { name: 'Poste de police', dept: 'securite', size: 1, cost: 2400, upkeep: 70, r: 8, cover: 'police', ms: 1, up: [{ cost: 3500, r: 11 }, { cost: 7000, r: 14 }], text: 'Fait baisser la criminalité.' },
  pompiers: { name: 'Caserne de pompiers', dept: 'securite', size: 1, cost: 2400, upkeep: 70, r: 8, cover: 'fire', ms: 1, up: [{ cost: 3500, r: 11 }, { cost: 7000, r: 14 }], text: 'Éteint les incendies avant qu\'ils se propagent.' },
  // Santé
  clinique: { name: 'Clinique', dept: 'sante', size: 1, cost: 3000, upkeep: 90, r: 7, cover: 'health', cap: 600, ms: 1, up: [{ cost: 4000, r: 9, cap: 1000 }, { cost: 8000, r: 11, cap: 1500 }], text: 'Soigne jusqu\'à 600 habitants.' },
  hopital: { name: 'Hôpital', dept: 'sante', size: 2, cost: 14000, upkeep: 380, r: 14, cover: 'health', cap: 3500, ms: 3, up: [{ cost: 12000, r: 17, cap: 5500 }, { cost: 22000, r: 20, cap: 8000 }], text: 'Soigne jusqu\'à 3 500 habitants.' },
  // Éducation
  ecole: { name: 'École', dept: 'education', size: 1, cost: 3200, upkeep: 100, r: 7, cover: 'edu', cap: 700, research: 1, ms: 1, up: [{ cost: 4000, r: 9, cap: 1100 }, { cost: 8000, r: 11, cap: 1600 }], text: 'Instruit les enfants et produit un peu de recherche.' },
  lycee: { name: 'Lycée', dept: 'education', size: 2, cost: 9500, upkeep: 250, r: 11, cover: 'edu', cap: 2200, research: 3, ms: 2, up: [{ cost: 9000, r: 13, cap: 3200 }, { cost: 16000, r: 15, cap: 4500 }], text: 'Plus de places et plus de recherche.' },
  universite: { name: 'Université', dept: 'education', size: 3, cost: 26000, upkeep: 600, r: 16, cover: 'edu', cap: 6000, research: 9, ms: 4, up: [{ cost: 24000, r: 19, cap: 9000 }, { cost: 40000, r: 22, cap: 13000 }], text: 'Grande source de recherche. Attire les bureaux.' },
  bibliotheque: { name: 'Bibliothèque', dept: 'education', size: 1, cost: 4200, upkeep: 90, r: 6, cover: 'leisure', research: 2, ms: 2, text: 'Un lieu calme : bonheur et recherche.' },
  // Loisirs
  parc: { name: 'Petit parc', dept: 'loisirs', size: 1, cost: 450, upkeep: 8, r: 4, cover: 'leisure', ms: 0, text: 'Des arbres, des bancs, un peu de bonheur.' },
  place: { name: 'Place à fontaine', dept: 'loisirs', size: 1, cost: 1300, upkeep: 18, r: 5, cover: 'leisure', land: 8, ms: 1, text: 'Fait monter la valeur des terrains autour.' },
  grandparc: { name: 'Grand parc', dept: 'loisirs', size: 2, cost: 4500, upkeep: 55, r: 8, cover: 'leisure', land: 10, ms: 2, text: 'Un étang, des pelouses, du calme.' },
  stade: { name: 'Stade', dept: 'loisirs', size: 3, cost: 32000, upkeep: 480, r: 18, cover: 'leisure', tourism: 900, ms: 4, text: 'Bonheur dans toute la ville et revenus touristiques.' },
  musee: { name: 'Musée', dept: 'loisirs', size: 2, cost: 16000, upkeep: 260, r: 12, cover: 'leisure', land: 12, tourism: 500, tech: 'culture', text: 'Culture, touristes et beaux quartiers.' },
  // Transports
  bus: { name: 'Dépôt de bus', dept: 'transports', size: 1, cost: 2800, upkeep: 120, r: 9, cover: 'transit', ms: 2, text: 'Réduit la circulation autour.' },
  metro: { name: 'Station de métro', dept: 'transports', size: 1, cost: 8500, upkeep: 240, r: 11, cover: 'transit', power: -8, tech: 'metro', text: 'Réduit fortement la circulation autour.' },
  gare: { name: 'Gare de marchandises', dept: 'transports', size: 2, cost: 18000, upkeep: 320, ms: 3, text: 'Les usines et les commerces se développent plus vite.' },
  // Merveilles (une seule de chaque)
  tour: { name: 'Tour d\'Aurore', dept: 'merveilles', size: 2, cost: 85000, upkeep: 300, r: 20, land: 25, tourism: 1500, ms: 5, wonder: true, text: 'Le symbole de la ville : valeur foncière et touristes.' },
  opera: { name: 'Opéra', dept: 'merveilles', size: 3, cost: 120000, upkeep: 500, happy: 8, tourism: 2200, ms: 5, wonder: true, text: '+8 de bonheur dans toute la ville.' },
  arcologie: { name: 'Arcologie', dept: 'merveilles', size: 3, cost: 200000, upkeep: 900, homes: 4000, ms: 6, wonder: true, text: 'Une ville dans la ville : 4 000 habitants, aucune pollution.' },
  fusion: { name: 'Centrale à fusion', dept: 'merveilles', size: 3, cost: 250000, upkeep: 1200, power: 25000, tech: 'fusion', wonder: true, text: 'Assez d\'énergie pour une mégalopole.' },
  spatioport: { name: 'Spatioport', dept: 'merveilles', size: 4, cost: 450000, upkeep: 2000, tourism: 8000, tech: 'spatial', wonder: true, text: 'Le couronnement d\'Aurore.' },
};

// ---------------------------------------------------------------------
// Paliers de population
// ---------------------------------------------------------------------
export const MILESTONES = [
  { pop: 0, name: 'Campement', reward: 0 },
  { pop: 120, name: 'Hameau', reward: 2500 },
  { pop: 450, name: 'Village', reward: 5000 },
  { pop: 1300, name: 'Bourg', reward: 10000 },
  { pop: 3200, name: 'Ville', reward: 20000 },
  { pop: 7500, name: 'Grande ville', reward: 40000 },
  { pop: 15000, name: 'Métropole', reward: 80000 },
  { pop: 28000, name: 'Mégalopole', reward: 150000 },
];

// ---------------------------------------------------------------------
// Recherche (points gagnés chaque mois par l'éducation)
// ---------------------------------------------------------------------
export const TECHS = {
  avenues: { name: 'Avenues', cost: 20, req: [], text: 'Routes larges et arborées, deux fois et demie plus de trafic.' },
  solaire: { name: 'Énergie solaire', cost: 30, req: [], text: 'Débloque la centrale solaire.' },
  tertiaire: { name: 'Économie tertiaire', cost: 45, req: [], text: 'Débloque les zones de bureaux, propres et rentables.' },
  recyclage: { name: 'Recyclage', cost: 40, req: ['solaire'], text: 'Débloque le centre de recyclage.' },
  incinerateur: { name: 'Valorisation des déchets', cost: 35, req: [], text: 'Débloque l\'incinérateur.' },
  busElec: { name: 'Bus électriques', cost: 50, req: ['avenues'], text: 'La circulation pollue 30 % de moins.' },
  medecine: { name: 'Médecine moderne', cost: 60, req: [], text: 'Cliniques et hôpitaux soignent 50 % de patients en plus.' },
  culture: { name: 'Politique culturelle', cost: 60, req: ['tertiaire'], text: 'Débloque le musée.' },
  metro: { name: 'Métro', cost: 90, req: ['busElec'], text: 'Débloque la station de métro.' },
  smartgrid: { name: 'Réseau intelligent', cost: 80, req: ['solaire'], text: 'Les bâtiments consomment 15 % d\'électricité en moins, les tempêtes ne coupent plus le courant.' },
  ecoconstruction: { name: 'Écoconstruction', cost: 100, req: ['recyclage'], text: 'Eau et déchets : 20 % de moins.' },
  gratteciel: { name: 'Gratte-ciel', cost: 130, req: ['tertiaire'], text: 'Débloque le niveau 4 : tours et gratte-ciel (avec le palier Grande ville).' },
  domotique: { name: 'Maisons connectées', cost: 110, req: ['smartgrid'], text: '+4 de bonheur pour tous les habitants.' },
  nucleaire: { name: 'Énergie nucléaire', cost: 160, req: ['smartgrid'], text: 'Débloque la centrale nucléaire.' },
  fusion: { name: 'Fusion nucléaire', cost: 420, req: ['nucleaire', 'gratteciel'], text: 'Débloque la centrale à fusion.' },
  spatial: { name: 'Programme spatial', cost: 650, req: ['fusion'], text: 'Débloque le spatioport.' },
};

// ---------------------------------------------------------------------
// Décrets : coût mensuel par habitant (perRes) ou fixe
// ---------------------------------------------------------------------
export const POLICIES = {
  transports: { name: 'Transports gratuits', perRes: 0.12, ms: 2, text: 'Circulation −35 %, bonheur +3.' },
  vert: { name: 'Quartiers verts', perRes: 0.04, ms: 1, text: 'Pollution −20 %, demande industrielle −15 %.' },
  tri: { name: 'Tri sélectif', perRes: 0.06, ms: 1, text: 'Déchets −30 %.' },
  eau: { name: 'Économies d\'eau', perRes: 0, ms: 1, text: 'Eau −25 %, bonheur −2.' },
  couvrefeu: { name: 'Couvre-feu', perRes: 0, ms: 2, text: 'Police 50 % plus efficace, bonheur −5.' },
  commerce: { name: 'Soutien aux petits commerces', perRes: 0.05, ms: 1, text: 'Demande commerciale +20 %.' },
  ecole: { name: 'Éducation gratuite', perRes: 0.15, ms: 3, text: 'Éducation 30 % plus efficace, bonheur +2.' },
  tourisme: { name: 'Promotion du tourisme', perRes: 0.08, ms: 3, text: 'Revenus touristiques +40 %, circulation +10 %.' },
  energieVerte: { name: 'Énergie verte', perRes: 0.05, ms: 2, text: 'Les centrales polluent 40 % de moins, leur entretien coûte 30 % de plus.' },
  pme: { name: 'Allègement fiscal des PME', perRes: 0, ms: 2, text: 'Demande commerciale et industrielle +15 %, leurs impôts −20 %.' },
};

// ---------------------------------------------------------------------
// Objectifs (dans l'ordre). test(s, m) reçoit l'état et les mesures.
// ---------------------------------------------------------------------
export const QUESTS = [
  { id: 'road', text: 'Trace 12 cases de route', reward: 600, test: (s, m) => m.roads >= 12 },
  { id: 'resid', text: 'Trace 10 cases de zone résidentielle', reward: 600, test: (s, m) => m.zoned[1] >= 10 },
  { id: 'power', text: 'Produis de l\'électricité (éolienne ou centrale)', reward: 800, test: (s, m) => m.powerCap > 0 },
  { id: 'water', text: 'Pose une pompe à eau au bord de l\'eau', reward: 800, test: (s, m) => m.waterCap > 0 },
  { id: 'pop50', text: 'Atteins 50 habitants', reward: 1000, test: (s, m) => m.pop >= 50 },
  { id: 'jobs', text: 'Trace des zones commerciales et industrielles (6 de chaque)', reward: 1000, test: (s, m) => m.zoned[2] >= 6 && m.zoned[3] >= 6 },
  { id: 'park', text: 'Construis un parc', reward: 500, test: (s, m) => m.count.parc + m.count.place + m.count.grandparc > 0 },
  { id: 'pop200', text: 'Atteins 200 habitants', reward: 1500, test: (s, m) => m.pop >= 200 },
  { id: 'safety', text: 'Construis un poste de police et une caserne de pompiers', reward: 1500, test: (s, m) => m.count.police > 0 && m.count.pompiers > 0 },
  { id: 'school', text: 'Construis une école', reward: 1500, test: (s, m) => m.count.ecole > 0 },
  { id: 'clinic', text: 'Construis une clinique', reward: 1500, test: (s, m) => m.count.clinique + m.count.hopital > 0 },
  { id: 'research', text: 'Termine une recherche', reward: 2000, test: (s) => Object.keys(s.techs).length >= 1 },
  { id: 'garbage', text: 'Construis une décharge', reward: 1500, test: (s, m) => m.garbageCap > 0 },
  { id: 'pop600', text: 'Atteins 600 habitants', reward: 3000, test: (s, m) => m.pop >= 600 },
  { id: 'lvl2', text: 'Fais monter 10 bâtiments au niveau 2', reward: 3000, test: (s, m) => m.lvlCount[2] + m.lvlCount[3] + m.lvlCount[4] >= 10 },
  { id: 'happy70', text: 'Atteins 70 % de bonheur avec au moins 400 habitants', reward: 4000, test: (s, m) => m.pop >= 400 && m.happy >= 70 },
  { id: 'profit', text: 'Termine 3 mois de suite avec un budget positif', reward: 4000, test: (s) => s.profitStreak >= 3 },
  { id: 'policy', text: 'Active un décret', reward: 2000, test: (s) => Object.keys(s.policies).length > 0 },
  { id: 'pop1500', text: 'Atteins 1 500 habitants', reward: 6000, test: (s, m) => m.pop >= 1500 },
  { id: 'offices', text: 'Trace 10 cases de bureaux', reward: 5000, test: (s, m) => m.zoned[4] >= 10 },
  { id: 'lvl3', text: 'Fais monter 20 bâtiments au niveau 3', reward: 8000, test: (s, m) => m.lvlCount[3] + m.lvlCount[4] >= 20 },
  { id: 'transit', text: 'Construis un dépôt de bus ou une station de métro', reward: 5000, test: (s, m) => m.count.bus + m.count.metro > 0 },
  { id: 'pop4000', text: 'Atteins 4 000 habitants', reward: 12000, test: (s, m) => m.pop >= 4000 },
  { id: 'upgrade', text: 'Améliore un service jusqu\'au niveau 3', reward: 8000, test: (s) => s.buildings.some((b) => b.lvl >= 3 && BUILDINGS[b.type] && BUILDINGS[b.type].up) },
  { id: 'wonder', text: 'Bâtis une merveille', reward: 25000, test: (s) => s.buildings.some((b) => BUILDINGS[b.type] && BUILDINGS[b.type].wonder) },
  { id: 'pop10000', text: 'Atteins 10 000 habitants', reward: 30000, test: (s, m) => m.pop >= 10000 },
  { id: 'tower', text: 'Fais pousser 10 gratte-ciel (niveau 4)', reward: 30000, test: (s, m) => m.lvlCount[4] >= 10 },
  { id: 'pop20000', text: 'Atteins 20 000 habitants', reward: 60000, test: (s, m) => m.pop >= 20000 },
  { id: 'space', text: 'Bâtis le spatioport', reward: 200000, test: (s) => s.buildings.some((b) => b.type === 'spatioport') },
];

// ---------------------------------------------------------------------
// Petites nouvelles du journal (ambiance), choisies selon l'état de la ville
// ---------------------------------------------------------------------
export const NEWS = {
  noPower: ['Les habitants s\'éclairent à la bougie : il manque de l\'électricité.', 'Coupures de courant en série dans plusieurs quartiers.'],
  noWater: ['Robinets à sec : la ville manque d\'eau.', 'Files d\'attente devant les fontaines publiques.'],
  pollution: ['Un épais brouillard jaune recouvre les quartiers industriels.', 'Les médecins s\'inquiètent de la qualité de l\'air.'],
  traffic: ['Bouchons monstres à l\'heure de pointe.', 'Les klaxons résonnent jusqu\'au soir.'],
  taxes: ['Les habitants trouvent les impôts trop élevés.', 'Pétition en ligne contre la hausse des impôts.'],
  jobs: ['Le chômage grimpe : il manque d\'emplois.', 'Longues files à l\'agence pour l\'emploi.'],
  happy: ['Les habitants adorent leur ville.', 'Aurore élue ville la plus agréable de la région.', 'Pique-niques bondés dans les parcs ce week-end.'],
  generic: ['Une boulangerie remporte le prix de la meilleure baguette.', 'Record d\'affluence au marché du dimanche.', 'Un chat coincé dans un arbre sauvé par un passant.', 'La mairie cherche des idées pour un nouveau jardin partagé.', 'Concert improvisé sur la place ce soir.', 'Nouveau record de cyclistes ce mois-ci.', 'Les écoliers plantent des tulipes le long des rues.'],
};
