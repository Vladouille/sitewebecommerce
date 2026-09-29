/* Les Bâtisseurs de Clairval
 * Vue isométrique. Récolte, construis, améliore chaque bâtiment (niveaux visibles) et fais grandir Clairval
 * du village à la cité galactique, en passant par la Lune et Mars. Chaque habitant doit manger, boire et avoir chaud.
 * Réglages : constantes ci-dessous (ères, sites, ressources, métiers, bâtiments, améliorations, outils, objectifs). */
(() => {
  'use strict';

  // ---------- Réglages ----------
  const DAY = 30;            // secondes réelles par jour, à vitesse x1
  const SEASON_DAYS = 5;     // jours par saison
  const SAVE_KEY = 'clairval-v1';
  const TAU = Math.PI * 2;
  const HAS_DOM = typeof document !== 'undefined';
  const reduced = HAS_DOM && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SEASONS = [
    { id: 'printemps', name: 'Printemps', grass: '#5f9a45', grass2: '#679f4a', leaf: ['#6fae4a', '#8cc45a'], sky: ['#8fc7e8', '#d7ecf5'] },
    { id: 'ete', name: 'Été', grass: '#6a9a36', grass2: '#72a03b', leaf: ['#3f8a34', '#56a03f'], sky: ['#6fb6e6', '#cfe9f7'] },
    { id: 'automne', name: 'Automne', grass: '#8a8a3e', grass2: '#939042', leaf: ['#d08a3a', '#b8552f'], sky: ['#a9bfd0', '#e9dccb'] },
    { id: 'hiver', name: 'Hiver', grass: '#e6edf1', grass2: '#dde6ec', leaf: null, sky: ['#b8c8d8', '#eef3f7'] },
  ];
  const seasonOf = (d) => SEASONS[Math.floor((d - 1) / SEASON_DAYS) % 4];

  // Sites : Clairval sur Terre, puis de nouvelles cartes (océan, orbite, Lune, Mars…)
  // ground : couleurs du sol, road : couleur des allées, space : ciel étoilé, deco : décor du fond
  const SITES = {
    terre: { name: 'Clairval', n: 21, deco: 'terre' },
    ocean: { name: 'Clairval-sur-Mer', n: 13, ground: ['#d9d3c2', '#cfc8b5'], road: '#8a8f96', edge: '#1f6f8b', deco: 'ocean' },
    orbite: { name: 'Station Clairval', n: 13, ground: ['#c9d1da', '#bcc5cf'], road: '#5a6472', edge: '#3a4250', space: true, deco: 'orbite' },
    lune: { name: 'Base de la Mer du Calme', n: 13, ground: ['#a9a9ad', '#9d9da2'], road: '#6b6b72', edge: '#5a5a60', space: true, deco: 'lune' },
    mars: { name: 'Nouvelle-Clairval', n: 13, ground: ['#c0673e', '#b35f3a'], road: '#7a4a36', edge: '#7a3a22', deco: 'mars' },
    asteroides: { name: 'Ceinture de Vesta', n: 13, ground: ['#8a8190', '#807787'], road: '#3e3844', edge: '#2e2833', space: true, deco: 'asteroides' },
    soleil: { name: "Essaim d'Hélios", n: 13, ground: ['#c9a44a', '#bd9a44'], road: '#6a5528', edge: '#6a4a18', space: true, deco: 'soleil' },
    anneau: { name: "Monde-anneau d'Aurore", n: 13, ground: ['#6aa060', '#62975a'], road: '#c8c2b0', edge: '#8a8f96', space: true, deco: 'anneau' },
    galaxie: { name: 'Nexus de Clairval', n: 13, ground: ['#5e5192', '#564a88'], road: '#8ad8ff', edge: '#2a2250', space: true, deco: 'galaxie' },
  };

  // Ères : r = rayon constructible sur Terre ; gate = conditions pour y accéder
  const ERAS = [
    { n: 1, name: 'Village', site: 'terre', r: 5 },
    { n: 2, name: 'Ville', site: 'terre', r: 6, gate: { pop: 20, bld: ['beffroi'], cost: { wood: 200, stone: 250, food: 100 } },
      story: "Les chemins deviennent des rues pavées, des réverbères s'allument le soir et de nouveaux terrains s'ouvrent. Le fer, les outils, les briques et l'or arrivent à Clairval." },
    { n: 3, name: 'Mégacité', site: 'terre', r: 7, gate: { pop: 90, bld: ['ecole', 'theatre'], cost: { gold: 400, brick: 400, tools: 150, iron: 200 } },
      story: "Les rues sont goudronnées, les premières voitures circulent et les tours montent vers le ciel. L'acier remplace le bois. Chaque habitant a maintenant besoin d'électricité." },
    { n: 4, name: 'Écocité', site: 'terre', r: 8, gate: { pop: 250, bld: ['tourclairval'], cost: { steel: 300, energy: 400, gold: 600 } },
      story: "Clairval se couvre de verdure : éoliennes, toits solaires, fermes verticales. Les premières usines d'électronique s'ouvrent." },
    { n: 5, name: 'Cité numérique', site: 'terre', r: 9, gate: { pop: 600, bld: ['arbre'], cost: { chips: 300, steel: 800, gold: 2000 } },
      story: "Des voitures volantes glissent entre les gratte-ciel connectés. Les centres de données produisent une nouvelle richesse : les données." },
    { n: 6, name: 'Arcologie', site: 'terre', r: 10, gate: { pop: 1500, bld: ['coeur'], cost: { data: 1500, chips: 1000, gold: 5000 } },
      story: "D'immenses pyramides vivantes abritent des milliers d'habitants, avec leurs jardins et leurs rivières intérieures. Les biomatériaux remplacent le béton." },
    { n: 7, name: 'Cité flottante', site: 'ocean', gate: { pop: 3000, bld: ['arcomere'], cost: { bio: 1500, data: 3000, steel: 5000 } },
      story: "La Terre ferme ne suffit plus : Clairval construit une ville sur la mer. L'hydrogène tiré de l'eau alimente les navettes." },
    { n: 8, name: 'Cité orbitale', site: 'orbite', gate: { pop: 6000, bld: ['ascenseur'], cost: { hydro: 3000, bio: 3000, chips: 5000 } },
      story: "L'ascenseur spatial monte jusqu'à l'orbite. Une station tourne au-dessus de la Terre et y fond un alliage impossible à fabriquer au sol." },
    { n: 9, name: 'Colonie lunaire', site: 'lune', gate: { pop: 12000, bld: ['anneauorb'], cost: { alloy: 2000, hydro: 8000 } },
      story: "Les premiers dômes se posent sur la Lune. Sous la poussière grise dort l'hélium-3, le carburant de la fusion." },
    { n: 10, name: 'Colonie martienne', site: 'mars', gate: { pop: 25000, bld: ['fusion'], cost: { helium: 4000, alloy: 15000 } },
      story: "Mars rouge et froide accueille Nouvelle-Clairval. Il faut fabriquer l'oxygène… et, un jour, rendre la planète verte." },
    { n: 11, name: "Ceinture d'astéroïdes", site: 'asteroides', gate: { pop: 50000, bld: ['terraformeur'], cost: { oxy: 12000, helium: 12000 } },
      story: 'Des cités creusées dans les astéroïdes récoltent des cristaux rares que la Terre n\'a jamais connus.' },
    { n: 12, name: 'Essaim de Dyson', site: 'soleil', gate: { pop: 100000, bld: ['foreuse'], cost: { crystal: 12000, alloy: 80000 } },
      story: "Des milliers de collecteurs entourent le Soleil. L'énergie devient presque infinie, assez pour fabriquer de l'antimatière." },
    { n: 13, name: 'Monde-anneau', site: 'anneau', gate: { pop: 200000, bld: ['dyson'], cost: { antimatter: 15000, crystal: 40000 } },
      story: "Un anneau large comme un continent tourne autour d'une étoile lointaine : prairies infinies, mers intérieures, soleil artificiel." },
    { n: 14, name: 'Cité galactique', site: 'galaxie', gate: { pop: 400000, bld: ['coeuranneau'], cost: { exotic: 5000, antimatter: 20000 } },
      story: "Clairval relie les étoiles. Il reste une dernière merveille : le Portail galactique, et un million d'habitants à accueillir." },
  ];

  const RES = {
    food: { name: 'Nourriture', color: '#e0a35a', era: 1, val: 1 },
    water: { name: 'Eau', color: '#7fc8ff', era: 1, val: 0.5 },
    wood: { name: 'Bois', color: '#c08a55', era: 1, val: 1 },
    stone: { name: 'Pierre', color: '#b5b6c4', era: 1, val: 1.5 },
    iron: { name: 'Fer', color: '#8f9bb0', era: 2, val: 3 },
    tools: { name: 'Outils', color: '#d9c08a', era: 2, val: 6 },
    brick: { name: 'Briques', color: '#c8643e', era: 2, val: 2 },
    gold: { name: 'Or', color: '#f2c94c', era: 2, val: 1 },
    steel: { name: 'Acier', color: '#a9c4d6', era: 3, val: 10 },
    energy: { name: 'Énergie', color: '#ffe066', era: 3, val: 2 },
    chips: { name: 'Électronique', color: '#6fdc8c', era: 4, val: 25 },
    data: { name: 'Données', color: '#5ad1ff', era: 5, val: 15 },
    bio: { name: 'Biomatériaux', color: '#9fd46b', era: 6, val: 30 },
    hydro: { name: 'Hydrogène', color: '#9ad8ff', era: 7, val: 40 },
    alloy: { name: 'Alliage orbital', color: '#d0d8ff', era: 8, val: 120 },
    helium: { name: 'Hélium-3', color: '#ffd29a', era: 9, val: 300 },
    oxy: { name: 'Oxygène', color: '#b8f0ff', era: 10, val: 200 },
    crystal: { name: 'Cristaux', color: '#d08aff', era: 11, val: 800 },
    antimatter: { name: 'Antimatière', color: '#ff7ad1', era: 12, val: 2500 },
    exotic: { name: 'Matière exotique', color: '#7affd8', era: 13, val: 8000 },
    quantum: { name: 'Quanta', color: '#ffffff', era: 14, val: 25000 },
  };
  const RKEYS = Object.keys(RES);

  // Métiers : chaque habitant employé produit rate par jour ; inputs = matières consommées par unité produite
  const JOBS = {
    cueilleur: { name: 'Cueilleur', res: 'food', rate: 2, base: 3, season: { ete: 1.2, automne: 1.3, hiver: 0.25 }, color: '#c0503a' },
    porteur: { name: "Porteur d'eau", res: 'water', rate: 3, base: 2, color: '#3f7fb0' },
    bucheron: { name: 'Bûcheron', res: 'wood', rate: 3, color: '#7a5230' },
    carrier: { name: 'Tailleur de pierre', res: 'stone', rate: 2, color: '#7c7d8c' },
    fermier: { name: 'Fermier', res: 'food', rate: 4, season: { ete: 1.3, automne: 1.5, hiver: 0 }, color: '#c9a33a' },
    pecheur: { name: 'Pêcheur', res: 'food', rate: 2.5, season: { hiver: 0.6 }, color: '#2f7a86' },
    mineur: { name: 'Mineur', res: 'iron', rate: 2.5, color: '#555a66' },
    forgeron: { name: 'Forgeron', res: 'tools', rate: 1.5, inputs: { iron: 1, wood: 0.5 }, color: '#8a3a2a' },
    briquetier: { name: 'Briquetier', res: 'brick', rate: 3, inputs: { stone: 0.6, wood: 0.3 }, color: '#b0583a' },
    marchand: { name: 'Marchand', res: 'gold', rate: 3, color: '#b8902a' },
    eleveur: { name: 'Éleveur', res: 'food', rate: 5, season: { hiver: 0.8 }, color: '#6a7a3a' },
    ingenieur: { name: 'Ingénieur', res: 'energy', rate: 12, color: '#e0c030' },
    metallo: { name: 'Métallurgiste', res: 'steel', rate: 2, inputs: { iron: 2, energy: 1 }, color: '#4a6a80' },
    agronome: { name: 'Agronome', res: 'food', rate: 12, color: '#3a9a5a' },
    technicien: { name: 'Technicien', res: 'water', rate: 15, color: '#2a6aa0' },
    employe: { name: 'Employé de bureau', res: 'gold', rate: 2, color: '#5a6a8a' },
    jardinier: { name: 'Fermier urbain', res: 'food', rate: 25, color: '#4aaa4a' },
    electronicien: { name: 'Électronicien', res: 'chips', rate: 1.5, inputs: { gold: 2, energy: 3 }, color: '#3aba6a' },
    recycleur: { name: 'Recycleur', res: 'steel', rate: 4, color: '#6a8a6a' },
    analyste: { name: 'Analyste', res: 'data', rate: 2, inputs: { energy: 4 }, color: '#2a9ad0' },
    roboticien: { name: 'Roboticien', res: 'chips', rate: 3, inputs: { steel: 1, energy: 3 }, color: '#8a9aaa' },
    biologiste: { name: 'Biologiste', res: 'bio', rate: 1.5, inputs: { food: 4, data: 1 }, color: '#6aba3a' },
    aquaculteur: { name: 'Aquaculteur', res: 'food', rate: 50, color: '#2a8a9a' },
    chimiste: { name: 'Chimiste', res: 'hydro', rate: 4, inputs: { water: 10, energy: 5 }, color: '#7ab8e0' },
    marin: { name: 'Marin', res: 'food', rate: 70, color: '#1a5a8a' },
    guide: { name: 'Guide de croisière', res: 'gold', rate: 60, color: '#e0a060' },
    forgeorb: { name: 'Fondeur orbital', res: 'alloy', rate: 2, inputs: { steel: 5, hydro: 0.5 }, color: '#b0b8e0' },
    guidespatial: { name: 'Guide spatial', res: 'gold', rate: 200, color: '#d0b060' },
    mineurlune: { name: 'Mineur lunaire', res: 'helium', rate: 1, inputs: { energy: 30 }, color: '#c0c0c8' },
    pilote: { name: 'Pilote', res: 'gold', rate: 400, color: '#e0d0a0' },
    technoxy: { name: "Technicien de l'oxygène", res: 'oxy', rate: 3, inputs: { water: 20, energy: 40 }, color: '#8ad0e0' },
    colon: { name: 'Colon agriculteur', res: 'food', rate: 150, color: '#c0703a' },
    prospecteur: { name: 'Prospecteur', res: 'crystal', rate: 1.5, inputs: { hydro: 2 }, color: '#a060d0' },
    croupier: { name: 'Croupier', res: 'gold', rate: 2000, color: '#e0c040' },
    physicien: { name: 'Physicien', res: 'antimatter', rate: 1, inputs: { energy: 5000 }, color: '#e060b0' },
    trader: { name: 'Courtier', res: 'gold', rate: 6000, color: '#f0d060' },
    architecte: { name: 'Architecte stellaire', res: 'exotic', rate: 1, inputs: { antimatter: 1, crystal: 1 }, color: '#40e0b0' },
    navigateur: { name: 'Navigateur', res: 'gold', rate: 15000, color: '#e0e0a0' },
    tisseur: { name: 'Tisseur quantique', res: 'quantum', rate: 0.6, inputs: { exotic: 0.5, energy: 50000 }, color: '#f0f0ff' },
    ambassadeur: { name: 'Ambassadeur', res: 'gold', rate: 40000, color: '#c0a0ff' },
  };
  const JKEYS = Object.keys(JOBS);

  // Bâtiments. Chaque exemplaire se place sur la carte et s'améliore jusqu'au niveau 5.
  // Les effets (lits, postes, production automatique, stockage, bonheur) sont donnés par niveau.
  // max = nombre d'exemplaires ; lv = niveau maximum ; size 2 = merveille sur 2×2 cases.
  const bd = (id, era, name, shape, cost, o) => Object.assign({ id, era, name, shape, cost, max: 1, grow: 1.25 }, o);
  const BUILDINGS = [
    // 1. Village
    bd('maison', 1, 'Maison', 'house', { wood: 15, stone: 4 }, { max: 6, grow: 1.3, beds: 4, cat: 'Logement' }),
    bd('bucheron', 1, 'Cabane du bûcheron', 'workshop', { wood: 10 }, { max: 3, grow: 1.6, jobs: { bucheron: 2 }, cat: 'Production', pile: 'logs' }),
    bd('carriere', 1, 'Carrière', 'quarry', { wood: 18 }, { max: 3, grow: 1.6, jobs: { carrier: 2 }, cat: 'Production' }),
    bd('puits', 1, 'Puits', 'well', { wood: 12, stone: 12 }, { max: 2, grow: 1.7, jobs: { porteur: 3 }, cat: 'Production' }),
    bd('pecheur', 1, 'Cabane du pêcheur', 'fishing', { wood: 16, stone: 4 }, { max: 2, grow: 1.6, jobs: { pecheur: 2 }, need: 4, cat: 'Production' }),
    bd('champ', 1, 'Champs', 'farm', { wood: 20, stone: 6 }, { max: 3, grow: 1.45, jobs: { fermier: 3 }, need: 5, cat: 'Production', crop: '#d8b84a' }),
    bd('grenier', 1, 'Grenier', 'barn', { wood: 30, stone: 20 }, { max: 3, grow: 1.4, store: 80, cat: 'Stockage' }),
    bd('place', 1, 'Place du village', 'plaza', { wood: 20, stone: 25 }, { max: 2, grow: 1.7, happy: 5, need: 5, cat: 'Bonheur' }),
    bd('guerisseuse', 1, 'Maison de la guérisseuse', 'herbal', { wood: 30, stone: 35, food: 10 }, { happy: 5, need: 7, health: true, cat: 'Bonheur' }),
    bd('taverne', 1, 'Taverne', 'tavern', { wood: 45, stone: 30 }, { happy: 7, use: { food: 1 }, need: 8, cat: 'Bonheur' }),
    bd('atelier', 1, 'Atelier', 'atelier', { wood: 50, stone: 45 }, { max: 2, grow: 1.5, prod: 0.08, need: 10, cat: 'Production' }),
    bd('beffroi', 1, 'Beffroi', 'belfry', { wood: 150, stone: 180, food: 80 }, { happy: 8, need: 18, cat: 'Merveille' }),
    // 2. Ville
    bd('immeuble', 2, 'Immeuble en briques', 'block', { brick: 30, wood: 15, stone: 10 }, { max: 8, grow: 1.2, beds: 10, cat: 'Logement', wall: '#b5654a' }),
    bd('mine', 2, 'Mine de fer', 'mine', { wood: 60, stone: 40 }, { max: 3, grow: 1.5, jobs: { mineur: 3 }, cat: 'Production' }),
    bd('forge', 2, 'Forge', 'factory', { stone: 50, iron: 20 }, { max: 3, grow: 1.5, jobs: { forgeron: 2 }, cat: 'Production', wall: '#6a5a50', fire: '#ff8a3a' }),
    bd('briqueterie', 2, 'Briqueterie', 'factory', { wood: 50, stone: 50 }, { max: 3, grow: 1.5, jobs: { briquetier: 3 }, cat: 'Production', wall: '#a0583e', fire: '#ffb060' }),
    bd('marche', 2, 'Marché', 'market', { brick: 60, wood: 40 }, { max: 2, grow: 1.7, jobs: { marchand: 2 }, happy: 3, market: true, cat: 'Commerce' }),
    bd('elevage', 2, "Ferme d'élevage", 'ranch', { wood: 60, brick: 20 }, { max: 3, grow: 1.45, jobs: { eleveur: 4 }, cat: 'Production' }),
    bd('caserne', 2, 'Caserne des pompiers', 'civic', { brick: 50, tools: 10 }, { happy: 3, firemen: true, cat: 'Bonheur', wall: '#c0453a', variant: 'fire' }),
    bd('ecole', 2, 'École', 'civic', { brick: 80, tools: 20, gold: 30 }, { happy: 5, prod: 0.05, need: 35, cat: 'Bonheur', wall: '#d8c8a0', variant: 'school' }),
    bd('theatre', 2, 'Théâtre', 'civic', { brick: 100, gold: 50, tools: 15 }, { happy: 6, need: 45, cat: 'Bonheur', wall: '#e8dcc0', variant: 'theatre' }),
    bd('entrepot', 2, 'Grand entrepôt', 'warehouse', { brick: 60, iron: 20 }, { max: 3, grow: 1.4, store: 200, cat: 'Stockage' }),
    // 3. Mégacité
    bd('tour', 3, "Tour d'habitation", 'tower', { steel: 30, brick: 50, gold: 30 }, { max: 8, grow: 1.15, beds: 30, cat: 'Logement', wall: '#8a96a6' }),
    bd('centrale', 3, 'Centrale électrique', 'plant', { iron: 100, brick: 100, gold: 50 }, { max: 3, grow: 1.4, jobs: { ingenieur: 5 }, cat: 'Production' }),
    bd('acierie', 3, 'Aciérie', 'factory', { brick: 120, iron: 80, tools: 20 }, { max: 3, grow: 1.4, jobs: { metallo: 4 }, cat: 'Production', wall: '#4a5260', fire: '#ff7a30' }),
    bd('serres', 3, 'Serres verticales', 'greenhouse', { steel: 30, brick: 40, energy: 20 }, { max: 4, grow: 1.35, jobs: { agronome: 8 }, cat: 'Production' }),
    bd('pompage', 3, 'Station de pompage', 'tanks', { steel: 30, iron: 40 }, { max: 3, grow: 1.4, jobs: { technicien: 8 }, cat: 'Production' }),
    bd('hopital', 3, 'Hôpital', 'civic', { steel: 80, gold: 100 }, { happy: 6, health: true, cat: 'Bonheur', wall: '#e8eef2', variant: 'hospital' }),
    bd('parc', 3, 'Parc central', 'park', { gold: 150, wood: 200 }, { max: 2, grow: 1.6, happy: 6, cat: 'Bonheur' }),
    bd('metro', 3, 'Métro', 'metro', { steel: 150, gold: 200, energy: 60 }, { happy: 8, cat: 'Bonheur' }),
    bd('megaentrepot', 3, 'Méga-entrepôt', 'warehouse', { steel: 60, brick: 80 }, { max: 3, grow: 1.4, store: 600, cat: 'Stockage', wall: '#5a6068' }),
    bd('bureaux', 3, "Quartier d'affaires", 'office', { steel: 40, brick: 80, gold: 60 }, { max: 4, grow: 1.3, jobs: { employe: 16 }, cat: 'Production' }),
    bd('tourclairval', 3, 'Tour de Clairval', 'w_tower', { steel: 500, gold: 800, energy: 300, brick: 300 }, { happy: 15, need: 200, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 4. Écocité
    bd('ecotour', 4, 'Tour végétale', 'greentower', { steel: 60, chips: 5, gold: 80 }, { max: 8, grow: 1.15, beds: 60, cat: 'Logement' }),
    bd('eolienne', 4, 'Parc éolien', 'turbine', { steel: 40, gold: 40 }, { max: 6, grow: 1.25, auto: { energy: 80 }, cat: 'Production' }),
    bd('solaire', 4, 'Toits solaires', 'solar', { chips: 4, steel: 20 }, { max: 6, grow: 1.25, auto: { energy: 60 }, cat: 'Production' }),
    bd('fermevert', 4, 'Ferme verticale', 'vfarm', { steel: 50, chips: 5, energy: 30 }, { max: 4, grow: 1.3, jobs: { jardinier: 10 }, cat: 'Production' }),
    bd('usinepuces', 4, "Usine d'électronique", 'fab', { steel: 80, gold: 100, energy: 50 }, { max: 3, grow: 1.35, jobs: { electronicien: 6 }, cat: 'Production' }),
    bd('recyclage', 4, 'Centre de recyclage', 'recycle', { steel: 60, brick: 100 }, { max: 3, grow: 1.35, jobs: { recycleur: 8 }, happy: 2, cat: 'Production' }),
    bd('tram', 4, 'Gare du tramway', 'station', { steel: 100, chips: 10, gold: 150 }, { happy: 6, cat: 'Bonheur' }),
    bd('depot', 4, 'Dépôt automatisé', 'warehouse', { steel: 80, chips: 10 }, { max: 3, grow: 1.35, store: 2000, cat: 'Stockage', wall: '#d8dcd0' }),
    bd('arbre', 4, 'Arbre-Monde', 'w_tree', { chips: 200, steel: 800, energy: 1000, gold: 1500 }, { happy: 15, need: 500, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 5. Cité numérique
    bd('gratteciel', 5, 'Gratte-ciel connecté', 'skyscraper', { steel: 150, chips: 20, gold: 200 }, { max: 8, grow: 1.15, beds: 120, cat: 'Logement' }),
    bd('datacenter', 5, 'Centre de données', 'datacenter', { chips: 60, steel: 100, energy: 100 }, { max: 4, grow: 1.3, jobs: { analyste: 8 }, cat: 'Production' }),
    bd('robotique', 5, 'Usine robotique', 'fab', { chips: 50, steel: 150 }, { max: 3, grow: 1.35, jobs: { roboticien: 6 }, cat: 'Production', wall: '#c8ccd4' }),
    bd('fermeauto', 5, 'Ferme automatisée', 'autofarm', { chips: 40, steel: 100, data: 20 }, { max: 4, grow: 1.3, auto: { food: 400 }, use: { energy: 40 }, cat: 'Production' }),
    bd('usineeaux', 5, 'Usine des eaux', 'tanks', { chips: 30, steel: 120 }, { max: 4, grow: 1.3, auto: { water: 500 }, use: { energy: 30 }, cat: 'Production', wall: '#d0e0ea' }),
    bd('geothermie', 5, 'Centrale géothermique', 'plant', { steel: 200, chips: 40 }, { max: 4, grow: 1.3, auto: { energy: 600 }, cat: 'Production', variant: 'geo' }),
    bd('antennes', 5, 'Antennes relais', 'antenna', { chips: 30, steel: 50 }, { max: 3, grow: 1.4, happy: 3, prod: 0.03, cat: 'Bonheur' }),
    bd('universite', 5, 'Université', 'civic', { chips: 80, gold: 400, data: 30 }, { happy: 6, prod: 0.05, cat: 'Bonheur', wall: '#e8e0d0', variant: 'university' }),
    bd('coffre', 5, 'Coffre de données', 'vault', { chips: 60, steel: 150 }, { max: 3, grow: 1.35, store: 6000, cat: 'Stockage' }),
    bd('coeur', 5, 'Cœur numérique', 'w_core', { data: 800, chips: 800, energy: 3000, gold: 4000 }, { happy: 15, need: 1200, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 6. Arcologie
    bd('arco', 6, 'Arcologie', 'arco', { steel: 300, data: 60, gold: 400 }, { max: 8, grow: 1.15, beds: 250, cat: 'Logement' }),
    bd('labobio', 6, 'Laboratoire de biomatériaux', 'lab', { data: 100, chips: 80, steel: 200 }, { max: 4, grow: 1.3, jobs: { biologiste: 10 }, cat: 'Production' }),
    bd('aquaponie', 6, 'Ferme aquaponique', 'aqua', { bio: 20, steel: 150 }, { max: 4, grow: 1.3, jobs: { aquaculteur: 20 }, cat: 'Production' }),
    bd('purif', 6, 'Purificateur d\'eau', 'tanks', { bio: 30, chips: 60 }, { max: 4, grow: 1.3, auto: { water: 1000 }, use: { energy: 80 }, happy: 2, cat: 'Production', wall: '#c8e8d0' }),
    bd('toursolaire', 6, 'Tour solaire', 'solartower', { bio: 20, steel: 300, chips: 60 }, { max: 4, grow: 1.3, auto: { energy: 1500 }, cat: 'Production' }),
    bd('jardins', 6, 'Jardins suspendus', 'gardens', { bio: 40, gold: 600 }, { max: 3, grow: 1.4, happy: 6, cat: 'Bonheur' }),
    bd('silo', 6, 'Silo géant', 'vault', { steel: 300, bio: 20 }, { max: 3, grow: 1.35, store: 15000, cat: 'Stockage', wall: '#d8c8a0' }),
    bd('arcomere', 6, 'Arcologie-mère', 'w_arco', { bio: 1000, data: 2000, steel: 4000, gold: 8000 }, { happy: 15, need: 2500, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 7. Cité flottante (océan)
    bd('plateforme', 7, 'Plateforme habitée', 'platform', { steel: 600, bio: 60, hydro: 20 }, { max: 8, grow: 1.15, beds: 500, cat: 'Logement' }),
    bd('electrolyse', 7, 'Usine à hydrogène', 'factory', { steel: 500, chips: 200, bio: 40 }, { max: 4, grow: 1.3, jobs: { chimiste: 20 }, cat: 'Production', wall: '#e0e8f0', fire: '#9ad8ff' }),
    bd('fermemarine', 7, 'Ferme marine', 'seafarm', { bio: 60, steel: 300 }, { max: 4, grow: 1.3, jobs: { marin: 30 }, cat: 'Production' }),
    bd('dessalement', 7, 'Usine de dessalement', 'tanks', { steel: 400, chips: 100 }, { max: 4, grow: 1.3, auto: { water: 3000 }, use: { energy: 150 }, cat: 'Production', wall: '#e8f0f4' }),
    bd('hydrolienne', 7, 'Hydroliennes', 'turbine', { steel: 500, hydro: 30 }, { max: 5, grow: 1.3, auto: { energy: 3000 }, cat: 'Production', variant: 'tidal' }),
    bd('port', 7, 'Port de croisière', 'port', { steel: 400, bio: 80 }, { max: 3, grow: 1.35, jobs: { guide: 20 }, happy: 3, cat: 'Commerce' }),
    bd('phare', 7, 'Phare', 'lighthouse', { steel: 300, hydro: 50 }, { happy: 8, cat: 'Bonheur' }),
    bd('reservoir', 7, 'Réservoirs flottants', 'vault', { steel: 600, hydro: 30 }, { max: 3, grow: 1.35, store: 40000, cat: 'Stockage', wall: '#e0e8ee' }),
    bd('ascenseur', 7, 'Ascenseur spatial', 'w_elevator', { hydro: 2000, steel: 10000, chips: 5000, gold: 15000 }, { happy: 15, need: 5000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 8. Cité orbitale
    bd('modulehab', 8, "Module d'habitation", 'module', { alloy: 10, steel: 1000, hydro: 100 }, { max: 8, grow: 1.15, beds: 1000, cat: 'Logement' }),
    bd('fonderie', 8, 'Fonderie orbitale', 'factory', { steel: 1500, hydro: 200, chips: 500 }, { max: 4, grow: 1.3, jobs: { forgeorb: 20 }, cat: 'Production', wall: '#c8ccd8', fire: '#c0c8ff' }),
    bd('panneauorb', 8, 'Centrale solaire orbitale', 'solar', { alloy: 20, chips: 400 }, { max: 5, grow: 1.3, auto: { energy: 8000 }, cat: 'Production', variant: 'wing' }),
    bd('serreorb', 8, 'Serre en apesanteur', 'dome', { alloy: 20, bio: 200 }, { max: 5, grow: 1.3, auto: { food: 5000 }, use: { energy: 300, water: 1000 }, cat: 'Production', glass: '#9fe0a0' }),
    bd('recycleau', 8, "Recycleur d'eau", 'tanks', { alloy: 15, bio: 100 }, { max: 5, grow: 1.3, auto: { water: 6000 }, use: { energy: 200 }, cat: 'Production', wall: '#d8e0ea' }),
    bd('hotelorb', 8, 'Hôtel orbital', 'module', { alloy: 30, gold: 5000 }, { max: 3, grow: 1.35, jobs: { guidespatial: 20 }, happy: 5, cat: 'Commerce', variant: 'hotel' }),
    bd('observatoire', 8, 'Observatoire', 'antenna', { alloy: 40, data: 2000 }, { happy: 8, prod: 0.05, cat: 'Bonheur', variant: 'dish' }),
    bd('soute', 8, 'Soute orbitale', 'vault', { alloy: 30, steel: 2000 }, { max: 3, grow: 1.35, store: 100000, cat: 'Stockage', wall: '#b8c0cc' }),
    bd('anneauorb', 8, 'Anneau orbital', 'w_ring', { alloy: 3000, hydro: 5000, chips: 10000, gold: 30000 }, { happy: 15, need: 10000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 9. Lune
    bd('domelune', 9, 'Dôme lunaire', 'dome', { alloy: 60, bio: 500, hydro: 200 }, { max: 8, grow: 1.15, beds: 2000, cat: 'Logement', glass: '#cfe6ff', variant: 'hab' }),
    bd('minehelium', 9, "Mine d'hélium-3", 'mine', { alloy: 100, energy: 2000 }, { max: 4, grow: 1.3, jobs: { mineurlune: 20 }, cat: 'Production', variant: 'space' }),
    bd('regolithe', 9, 'Four à régolithe', 'factory', { alloy: 80 }, { max: 4, grow: 1.3, auto: { steel: 2000 }, use: { energy: 500 }, cat: 'Production', wall: '#8a8a90', fire: '#ffb070' }),
    bd('serrelune', 9, 'Serres lunaires', 'dome', { alloy: 60, bio: 400 }, { max: 5, grow: 1.3, auto: { food: 10000 }, use: { energy: 600, water: 2000 }, cat: 'Production', glass: '#9fe0a0' }),
    bd('glace', 9, 'Extracteur de glace', 'tanks', { alloy: 60 }, { max: 5, grow: 1.3, auto: { water: 12000 }, use: { energy: 400 }, cat: 'Production', wall: '#e0f0ff' }),
    bd('telescope', 9, 'Grand télescope', 'antenna', { alloy: 200, chips: 3000 }, { happy: 8, auto: { data: 500 }, cat: 'Bonheur', variant: 'dish' }),
    bd('spatioport', 9, 'Spatioport', 'pad', { alloy: 150, hydro: 2000 }, { max: 3, grow: 1.35, jobs: { pilote: 30 }, happy: 4, cat: 'Commerce' }),
    bd('cryo', 9, 'Entrepôt cryogénique', 'vault', { alloy: 150, helium: 20 }, { max: 3, grow: 1.35, store: 250000, cat: 'Stockage', wall: '#c8d8e8' }),
    bd('fusion', 9, 'Réacteur à fusion', 'w_fusion', { helium: 4000, alloy: 20000, chips: 40000, gold: 150000 }, { happy: 12, auto: { energy: 100000 }, use: { helium: 20 }, need: 20000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 10. Mars
    bd('habmars', 10, 'Habitat martien', 'dome', { alloy: 150, oxy: 20, bio: 800 }, { max: 8, grow: 1.15, beds: 4000, cat: 'Logement', glass: '#ffe0c8', variant: 'hab' }),
    bd('oxygene', 10, "Usine à oxygène", 'factory', { alloy: 200, helium: 50 }, { max: 4, grow: 1.3, jobs: { technoxy: 30 }, cat: 'Production', wall: '#e8e0d8', fire: '#b8f0ff' }),
    bd('fermemars', 10, 'Fermes martiennes', 'farm', { oxy: 30, alloy: 150 }, { max: 4, grow: 1.3, jobs: { colon: 60 }, cat: 'Production', crop: '#7ad05a', variant: 'glass' }),
    bd('minemars', 10, 'Mine martienne', 'mine', { alloy: 200, oxy: 20 }, { max: 4, grow: 1.3, auto: { steel: 6000 }, use: { energy: 1000 }, cat: 'Production', variant: 'space' }),
    bd('aquifere', 10, 'Aquifère martien', 'tanks', { alloy: 150, oxy: 10 }, { max: 5, grow: 1.3, auto: { water: 30000 }, use: { energy: 800 }, cat: 'Production', wall: '#e8d0c0' }),
    bd('centralemars', 10, 'Centrale à hélium', 'plant', { alloy: 300, helium: 100 }, { max: 4, grow: 1.3, auto: { energy: 40000 }, use: { helium: 4 }, cat: 'Production', variant: 'fusion' }),
    bd('olympe', 10, 'Station Olympus', 'civic', { oxy: 200, gold: 100000 }, { happy: 10, cat: 'Bonheur', wall: '#f0e8e0', variant: 'dome' }),
    bd('bunker', 10, 'Silos martiens', 'vault', { alloy: 300, oxy: 30 }, { max: 3, grow: 1.35, store: 600000, cat: 'Stockage', wall: '#d8b8a0' }),
    bd('terraformeur', 10, 'Terraformeur', 'w_terra', { oxy: 8000, alloy: 50000, helium: 8000, gold: 400000 }, { happy: 6, need: 40000, size: 2, lv: 5, wonder: true, cat: 'Merveille' }),
    // 11. Astéroïdes
    bd('habast', 11, 'Astéroïde habité', 'rockhab', { alloy: 400, oxy: 100, crystal: 10 }, { max: 8, grow: 1.15, beds: 8000, cat: 'Logement' }),
    bd('prospect', 11, 'Station de prospection', 'crystals', { alloy: 500, hydro: 5000 }, { max: 4, grow: 1.3, jobs: { prospecteur: 30 }, cat: 'Production' }),
    bd('raffinerie', 11, 'Raffinerie spatiale', 'factory', { crystal: 50, alloy: 600 }, { max: 4, grow: 1.3, auto: { steel: 30000, alloy: 500, crystal: 60 }, use: { energy: 20000 }, cat: 'Production', wall: '#5a5068', fire: '#d08aff' }),
    bd('biodome', 11, 'Bio-dômes', 'dome', { crystal: 30, bio: 5000 }, { max: 5, grow: 1.3, auto: { food: 40000 }, use: { energy: 5000, water: 20000 }, cat: 'Production', glass: '#a0f0b0' }),
    bd('comete', 11, 'Comètes captives', 'tanks', { crystal: 30, alloy: 400 }, { max: 5, grow: 1.3, auto: { water: 60000 }, cat: 'Production', wall: '#d0e8ff' }),
    bd('voile', 11, 'Voiles solaires', 'solar', { crystal: 60, alloy: 800 }, { max: 4, grow: 1.3, auto: { energy: 150000 }, cat: 'Production', variant: 'sail' }),
    bd('casino', 11, 'Casino des étoiles', 'civic', { crystal: 100, gold: 300000 }, { max: 2, grow: 1.4, jobs: { croupier: 40 }, happy: 6, cat: 'Commerce', wall: '#3a2a4a', variant: 'casino' }),
    bd('chambre', 11, 'Chambres fortes', 'vault', { crystal: 80, alloy: 1000 }, { max: 3, grow: 1.35, store: 1500000, cat: 'Stockage', wall: '#5a5068' }),
    bd('foreuse', 11, 'Foreuse stellaire', 'w_drill', { crystal: 8000, alloy: 150000, oxy: 20000, gold: 1500000 }, { happy: 15, need: 80000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 12. Dyson
    bd('habdyson', 12, 'Cité-collecteur', 'skyscraper', { crystal: 200, antimatter: 5, alloy: 3000 }, { max: 8, grow: 1.15, beds: 16000, cat: 'Logement', variant: 'gold' }),
    bd('collecteur', 12, 'Collecteurs de Dyson', 'solar', { crystal: 150, alloy: 2000 }, { max: 6, grow: 1.3, auto: { energy: 800000 }, cat: 'Production', variant: 'mirror' }),
    bd('accel', 12, "Accélérateur d'antimatière", 'ringlab', { crystal: 300, alloy: 5000 }, { max: 4, grow: 1.3, jobs: { physicien: 40 }, cat: 'Production' }),
    bd('synthe', 12, 'Synthétiseur de matière', 'fab', { antimatter: 10, crystal: 200 }, { max: 5, grow: 1.3, auto: { food: 100000, water: 100000 }, use: { energy: 200000 }, cat: 'Production', wall: '#e8d8a0' }),
    bd('forgesol', 12, 'Forge solaire', 'factory', { antimatter: 10, crystal: 300 }, { max: 4, grow: 1.3, auto: { alloy: 3000, steel: 80000 }, use: { energy: 300000 }, cat: 'Production', wall: '#8a6a3a', fire: '#fff0a0' }),
    bd('temple', 12, 'Temple du Soleil', 'civic', { antimatter: 50, gold: 1000000 }, { happy: 12, cat: 'Bonheur', wall: '#f0d890', variant: 'temple' }),
    bd('bourse', 12, 'Bourse interstellaire', 'office', { antimatter: 20, crystal: 500 }, { max: 3, grow: 1.35, jobs: { trader: 50 }, cat: 'Commerce', variant: 'gold' }),
    bd('plasma', 12, 'Réservoirs de plasma', 'vault', { antimatter: 20, alloy: 5000 }, { max: 3, grow: 1.35, store: 4000000, cat: 'Stockage', wall: '#c8a050' }),
    bd('dyson', 12, 'Sphère de Dyson', 'w_dyson', { antimatter: 10000, crystal: 40000, alloy: 300000, gold: 5000000 }, { happy: 15, need: 160000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 13. Monde-anneau
    bd('vallee', 13, "Vallée de l'anneau", 'arco', { exotic: 5, antimatter: 100, crystal: 1000 }, { max: 8, grow: 1.15, beds: 32000, cat: 'Logement', variant: 'green' }),
    bd('forgeexo', 13, 'Forge exotique', 'crystals', { antimatter: 200, crystal: 2000 }, { max: 4, grow: 1.3, jobs: { architecte: 40 }, cat: 'Production', variant: 'exo' }),
    bd('prairie', 13, 'Prairies infinies', 'farm', { exotic: 10, bio: 50000 }, { max: 5, grow: 1.3, auto: { food: 300000 }, cat: 'Production', crop: '#9ae070' }),
    bd('mers', 13, 'Mers intérieures', 'lake', { exotic: 10, hydro: 100000 }, { max: 5, grow: 1.3, auto: { water: 300000 }, happy: 1, cat: 'Production' }),
    bd('soleilart', 13, 'Soleil artificiel', 'sun', { exotic: 20, antimatter: 300 }, { max: 4, grow: 1.3, auto: { energy: 3000000 }, cat: 'Production' }),
    bd('archive', 13, 'Archive galactique', 'civic', { exotic: 50, data: 500000 }, { max: 2, grow: 1.4, auto: { data: 50000, gold: 50000 }, happy: 8, cat: 'Bonheur', wall: '#e8f0f8', variant: 'archive' }),
    bd('quais', 13, 'Quais stellaires', 'pad', { exotic: 30, alloy: 20000 }, { max: 3, grow: 1.35, jobs: { navigateur: 60 }, cat: 'Commerce' }),
    bd('hangar', 13, "Hangars de l'anneau", 'vault', { exotic: 30, alloy: 30000 }, { max: 3, grow: 1.35, store: 10000000, cat: 'Stockage', wall: '#d8d8c8' }),
    bd('coeuranneau', 13, "Cœur de l'anneau", 'w_ringcore', { exotic: 4000, antimatter: 20000, crystal: 40000, gold: 5000000 }, { happy: 15, need: 320000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
    // 14. Cité galactique
    bd('habgal', 14, 'Sphère-habitat', 'sphere', { quantum: 5, exotic: 200, antimatter: 2000 }, { max: 8, grow: 1.15, beds: 80000, cat: 'Logement' }),
    bd('tisserand', 14, 'Métier quantique', 'crystals', { exotic: 300, antimatter: 3000 }, { max: 4, grow: 1.3, jobs: { tisseur: 50 }, cat: 'Production', variant: 'quantum' }),
    bd('nebuleuse', 14, 'Ferme de nébuleuse', 'lake', { quantum: 10, exotic: 100 }, { max: 5, grow: 1.3, auto: { food: 800000, water: 800000 }, cat: 'Production', variant: 'nebula' }),
    bd('trounoir', 14, 'Trou noir domestiqué', 'sun', { quantum: 20, exotic: 500 }, { max: 4, grow: 1.3, auto: { energy: 20000000 }, cat: 'Production', variant: 'black' }),
    bd('conseil', 14, 'Conseil galactique', 'civic', { quantum: 100, gold: 20000000 }, { happy: 15, cat: 'Bonheur', wall: '#e0d8ff', variant: 'council' }),
    bd('ambassade', 14, 'Ambassades', 'office', { quantum: 30, exotic: 1000 }, { max: 3, grow: 1.35, jobs: { ambassadeur: 60 }, happy: 3, cat: 'Commerce', variant: 'glass' }),
    bd('replicateur', 14, 'Réplicateurs', 'fab', { quantum: 40, exotic: 500 }, { max: 4, grow: 1.3, auto: { alloy: 5000, crystal: 2000, antimatter: 200 }, use: { energy: 5000000 }, cat: 'Production', wall: '#d8d0ff' }),
    bd('poche', 14, 'Poche dimensionnelle', 'vault', { quantum: 20, exotic: 400 }, { max: 3, grow: 1.35, store: 30000000, cat: 'Stockage', wall: '#6a5aa0' }),
    bd('portail', 14, 'Portail galactique', 'w_portal', { quantum: 3000, exotic: 50000, antimatter: 200000, gold: 50000000 }, { happy: 20, need: 1000000, size: 2, lv: 1, wonder: true, cat: 'Merveille' }),
  ];
  const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
  for (const b of BUILDINGS) b.site = ERAS[b.era - 1].site;
  // postes : quel bâtiment fournit quel métier
  const JOB_BLD = {};
  for (const b of BUILDINGS) if (b.jobs) for (const j of Object.keys(b.jobs)) JOB_BLD[j] = b.id;
  for (const j of JKEYS) JOBS[j].era = JOB_BLD[j] ? BY_ID[JOB_BLD[j]].era : 1;

  // Améliorations : achetées une fois, effet permanent
  // jobs = bonus d'un métier, bld = bonus de production automatique d'un bâtiment, prod = bonus global
  const TECHS = [
    { id: 't_main1', era: 1, name: 'Outils de récolte', desc: 'Récolte à la main : +2 par toucher', cost: { wood: 15, stone: 15 }, hand: 2 },
    { id: 't_haches', era: 1, name: 'Haches affûtées', desc: 'Bûcherons +30 %', cost: { wood: 30, stone: 20 }, jobs: { bucheron: 0.3 } },
    { id: 't_paniers', era: 1, name: 'Paniers tressés', desc: 'Cueilleurs +30 %', cost: { wood: 25 }, jobs: { cueilleur: 0.3 } },
    { id: 't_seaux', era: 1, name: 'Seaux cerclés', desc: "Porteurs d'eau +30 %", cost: { wood: 25, stone: 10 }, jobs: { porteur: 0.3 } },
    { id: 't_burins', era: 1, name: 'Burins', desc: 'Tailleurs de pierre +30 %', cost: { wood: 20, stone: 25 }, jobs: { carrier: 0.3 } },
    { id: 't_filets', era: 1, name: 'Filets de pêche', desc: 'Pêcheurs +30 %', cost: { wood: 30, food: 10 }, jobs: { pecheur: 0.3 } },
    { id: 't_rotation', era: 1, name: 'Rotation des cultures', desc: 'Fermiers +30 %', cost: { wood: 40, stone: 20, food: 20 }, jobs: { fermier: 0.3 } },
    { id: 't_cheminees', era: 1, name: 'Cheminées', desc: "Chauffage de l'hiver −30 %", cost: { stone: 50 }, heat: 0.3 },
    { id: 't_veillees', era: 1, name: 'Veillées et chansons', desc: '+5 de bonheur', cost: { food: 30, wood: 20 }, happy: 5 },
    { id: 't_main2', era: 2, name: 'Brouettes', desc: 'Récolte à la main : +3 par toucher', cost: { tools: 15, wood: 40 }, hand: 3 },
    { id: 't_pioches', era: 2, name: 'Pioches en fer', desc: 'Mineurs et tailleurs +30 %', cost: { tools: 20, iron: 20 }, jobs: { mineur: 0.3, carrier: 0.3 } },
    { id: 't_soufflets', era: 2, name: 'Grands soufflets', desc: 'Forgerons et briquetiers +30 %', cost: { tools: 25, brick: 30 }, jobs: { forgeron: 0.3, briquetier: 0.3 } },
    { id: 't_charrues', era: 2, name: 'Charrues en fer', desc: 'Fermiers et éleveurs +40 %', cost: { tools: 30, iron: 30 }, jobs: { fermier: 0.4, eleveur: 0.4 } },
    { id: 't_aqueduc', era: 2, name: 'Aqueduc', desc: "Porteurs d'eau +60 %", cost: { brick: 80, stone: 60 }, jobs: { porteur: 0.6 } },
    { id: 't_paves', era: 2, name: 'Rues pavées', desc: '+5 de bonheur', cost: { stone: 120, brick: 40 }, happy: 5 },
    { id: 't_banque', era: 2, name: 'Banque', desc: 'Marchands +40 %, meilleurs prix au marché', cost: { gold: 80, brick: 60 }, jobs: { marchand: 0.4 } },
    { id: 't_main3', era: 3, name: 'Robots de récolte', desc: 'Récolte à la main : +5 par toucher', cost: { steel: 30, energy: 40 }, hand: 5 },
    { id: 't_reseau', era: 3, name: 'Réseau intelligent', desc: 'Ingénieurs +40 %', cost: { steel: 40, gold: 80 }, jobs: { ingenieur: 0.4 } },
    { id: 't_fourneaux', era: 3, name: 'Hauts-fourneaux', desc: 'Métallurgistes +40 %', cost: { steel: 50, brick: 80 }, jobs: { metallo: 0.4 } },
    { id: 't_recyclage', era: 3, name: "Recyclage de l'eau", desc: "Consommation d'eau −30 %", cost: { steel: 40, energy: 50 }, water: 0.3 },
    { id: 't_isolation', era: 3, name: 'Isolation des tours', desc: "Chauffage de l'hiver −30 %", cost: { steel: 40, brick: 100 }, heat: 0.3 },
    { id: 't_eolien', era: 4, name: 'Pales géantes', desc: 'Éoliennes et toits solaires +40 %', cost: { steel: 150, chips: 20 }, bld: { eolienne: 0.4, solaire: 0.4 } },
    { id: 't_vert', era: 4, name: 'Toits végétalisés', desc: '+5 de bonheur', cost: { steel: 100, gold: 300 }, happy: 5 },
    { id: 't_circuit', era: 4, name: 'Circuits imprimés', desc: 'Électroniciens et recycleurs +40 %', cost: { chips: 40, gold: 400 }, jobs: { electronicien: 0.4, recycleur: 0.4 } },
    { id: 't_ia', era: 5, name: 'Assistants IA', desc: 'Toute la production +10 %', cost: { data: 100, chips: 150 }, prod: 0.1 },
    { id: 't_algo', era: 5, name: 'Algorithmes', desc: 'Analystes +50 %, roboticiens +40 %', cost: { data: 80, gold: 1500 }, jobs: { analyste: 0.5, roboticien: 0.4 } },
    { id: 't_autofarm', era: 5, name: 'Capteurs agricoles', desc: 'Fermes automatisées et usines des eaux +40 %', cost: { chips: 120, data: 60 }, bld: { fermeauto: 0.4, usineeaux: 0.4 } },
    { id: 't_genie', era: 6, name: 'Génie biologique', desc: 'Biologistes +50 %, aquaculteurs +40 %', cost: { bio: 100, data: 300 }, jobs: { biologiste: 0.5, aquaculteur: 0.4 } },
    { id: 't_climat', era: 6, name: 'Climat maîtrisé', desc: '+6 de bonheur, chauffage −30 %', cost: { bio: 150, gold: 3000 }, happy: 6, heat: 0.3 },
    { id: 't_solaire2', era: 6, name: 'Miroirs courbes', desc: 'Tours solaires +50 %', cost: { bio: 80, chips: 500 }, bld: { toursolaire: 0.5 } },
    { id: 't_electro', era: 7, name: 'Électrolyse rapide', desc: 'Chimistes +50 %, marins +40 %', cost: { hydro: 200, chips: 1000 }, jobs: { chimiste: 0.5, marin: 0.4 } },
    { id: 't_courants', era: 7, name: 'Courants marins', desc: 'Hydroliennes +50 %, dessalement +40 %', cost: { hydro: 300, steel: 3000 }, bld: { hydrolienne: 0.5, dessalement: 0.4 } },
    { id: 't_croisiere', era: 7, name: 'Croisières de luxe', desc: 'Guides +50 %, +5 de bonheur', cost: { bio: 500, gold: 8000 }, jobs: { guide: 0.5 }, happy: 5 },
    { id: 't_apesanteur', era: 8, name: 'Fonte en apesanteur', desc: 'Fondeurs +50 %, guides spatiaux +40 %', cost: { alloy: 100, hydro: 1000 }, jobs: { forgeorb: 0.5, guidespatial: 0.4 } },
    { id: 't_orbites', era: 8, name: 'Orbites optimisées', desc: 'Centrales solaires et serres orbitales +50 %', cost: { alloy: 150, chips: 3000 }, bld: { panneauorb: 0.5, serreorb: 0.5 } },
    { id: 't_microg', era: 8, name: 'Médecine spatiale', desc: 'Toute la production +10 %', cost: { alloy: 200, bio: 2000 }, prod: 0.1 },
    { id: 't_helium', era: 9, name: 'Tamis à hélium', desc: 'Mineurs lunaires +50 %', cost: { alloy: 500, helium: 50 }, jobs: { mineurlune: 0.5 } },
    { id: 't_regolithe', era: 9, name: 'Impression 3D lunaire', desc: 'Fours, serres et glace lunaires +40 %', cost: { alloy: 600, helium: 80 }, bld: { regolithe: 0.4, serrelune: 0.4, glace: 0.4 } },
    { id: 't_plasma', era: 9, name: 'Confinement du plasma', desc: 'Réacteur à fusion +50 %', cost: { helium: 300, chips: 8000 }, bld: { fusion: 0.5 } },
    { id: 't_oxy', era: 10, name: 'Électrolyse du CO₂', desc: "Techniciens de l'oxygène +50 %, colons +40 %", cost: { oxy: 200, alloy: 2000 }, jobs: { technoxy: 0.5, colon: 0.4 } },
    { id: 't_aqui', era: 10, name: 'Forages profonds', desc: 'Aquifères +40 %, centrales à hélium +50 %', cost: { oxy: 300, helium: 500 }, bld: { aquifere: 0.4, centralemars: 0.5 } },
    { id: 't_marsfete', era: 10, name: 'Fête des deux lunes', desc: '+8 de bonheur', cost: { oxy: 500, gold: 60000 }, happy: 8 },
    { id: 't_prospect', era: 11, name: 'Sondes autonomes', desc: 'Prospecteurs +50 %', cost: { crystal: 300, alloy: 10000 }, jobs: { prospecteur: 0.5 } },
    { id: 't_voiles', era: 11, name: 'Voiles ultrafines', desc: 'Voiles solaires +50 %, raffineries +40 %', cost: { crystal: 500, hydro: 30000 }, bld: { voile: 0.5, raffinerie: 0.4 } },
    { id: 't_casino', era: 11, name: 'Jackpot cosmique', desc: 'Croupiers +50 %', cost: { crystal: 400, gold: 200000 }, jobs: { croupier: 0.5 } },
    { id: 't_antimat', era: 12, name: 'Pièges magnétiques', desc: 'Physiciens +50 %', cost: { antimatter: 100, crystal: 2000 }, jobs: { physicien: 0.5 } },
    { id: 't_collect', era: 12, name: 'Collecteurs en essaim', desc: 'Collecteurs de Dyson +50 %', cost: { antimatter: 150, alloy: 30000 }, bld: { collecteur: 0.5 } },
    { id: 't_synth', era: 12, name: 'Synthèse moléculaire', desc: 'Synthétiseurs et forges solaires +50 %', cost: { antimatter: 200, crystal: 5000 }, bld: { synthe: 0.5, forgesol: 0.5 } },
    { id: 't_exo', era: 13, name: 'Géométries exotiques', desc: 'Architectes stellaires +50 %', cost: { exotic: 200, antimatter: 5000 }, jobs: { architecte: 0.5 } },
    { id: 't_soleil', era: 13, name: 'Jour éternel', desc: "Soleils, prairies et mers de l'anneau +40 %", cost: { exotic: 300, crystal: 30000 }, bld: { soleilart: 0.4, prairie: 0.4, mers: 0.4 } },
    { id: 't_paix', era: 13, name: 'Paix des étoiles', desc: '+10 de bonheur', cost: { exotic: 500, gold: 3000000 }, happy: 10 },
    { id: 't_quanta', era: 14, name: 'Intrication', desc: 'Tisseurs quantiques +50 %', cost: { quantum: 100, exotic: 5000 }, jobs: { tisseur: 0.5 } },
    { id: 't_horizon', era: 14, name: "Horizon des événements", desc: 'Trous noirs +50 %, réplicateurs +40 %', cost: { quantum: 150, antimatter: 50000 }, bld: { trounoir: 0.5, replicateur: 0.4 } },
    { id: 't_unite', era: 14, name: 'Unité galactique', desc: 'Toute la production +20 %', cost: { quantum: 300, gold: 20000000 }, prod: 0.2 },
  ];

  // Outils : aides achetées une fois, qu'on peut activer ou couper
  const TOOLS = [
    { id: 'emploi', era: 2, name: "Bureau de l'emploi", desc: 'Chaque matin, donne un métier à chaque habitant sans travail, là où il en manque le plus.', cost: { gold: 40, brick: 30 } },
    { id: 'file', era: 2, name: 'Carnet du maître d\'œuvre', desc: "File de constructions : ajoute des bâtiments ou des améliorations, ils se font dès que tu as de quoi payer.", cost: { gold: 60, tools: 15 } },
    { id: 'drones', era: 3, name: 'Drones de récolte', desc: 'Récoltent chaque jour nourriture, eau, bois et pierre pour toi (plus à chaque ère).', cost: { steel: 40, energy: 80 } },
    { id: 'contremaitre', era: 4, name: 'Contremaître', desc: "Chaque jour, améliore le bâtiment le moins cher si tes réserves dépassent la moitié de leur place.", cost: { chips: 40, gold: 500 } },
    { id: 'courtier', era: 5, name: 'Courtier automatique', desc: "Chaque jour, vend contre de l'or ce qui déborde (plus de 90 % de la place).", cost: { data: 80, gold: 1500 } },
    { id: 'urbaniste', era: 6, name: 'IA urbaniste', desc: 'Chaque jour, si un besoin vital manque (eau, nourriture, énergie, lits), construit ou améliore ce qu\'il faut.', cost: { data: 800, bio: 100 } },
  ];

  // Objectifs : ceux des trois premières ères, puis trois par ère générés plus bas
  const GOALS = [
    { id: 'g1', era: 1, text: 'Construire une maison', goal: 1, get: () => CNT.maison, reward: { wood: 10 } },
    { id: 'g2', era: 1, text: 'Construire la cabane du bûcheron', goal: 1, get: () => CNT.bucheron, reward: { food: 12 } },
    { id: 'g3', era: 1, text: 'Construire un puits', goal: 1, get: () => CNT.puits, reward: { wood: 20 } },
    { id: 'g4', era: 1, text: 'Accueillir 6 habitants', goal: 6, get: () => save.pop, reward: { stone: 15 } },
    { id: 'g5', era: 1, text: 'Améliorer un bâtiment au niveau 2', goal: 2, get: () => maxLevel(), reward: { food: 15 } },
    { id: 'g6', era: 1, text: 'Traverser un hiver', goal: 1, get: () => save.stats.winters, reward: { food: 30, wood: 20 } },
    { id: 'g7', era: 1, text: 'Atteindre 70 % de bonheur', goal: 70, get: () => Math.round(save.happy), reward: { stone: 30 } },
    { id: 'g8', era: 1, text: 'Accueillir 12 habitants', goal: 12, get: () => save.pop, reward: { wood: 40 } },
    { id: 'g9', era: 1, text: "Construire l'atelier", goal: 1, get: () => CNT.atelier, reward: { food: 40, stone: 20 } },
    { id: 'g10', era: 1, text: 'Élever le beffroi', goal: 1, get: () => CNT.beffroi, reward: { food: 50 } },
    { id: 'g12', era: 2, text: 'Construire la mine de fer', goal: 1, get: () => CNT.mine, reward: { iron: 20 } },
    { id: 'g13', era: 2, text: 'Fabriquer 50 outils', goal: 50, get: () => Math.floor(save.stats.made.tools || 0), reward: { gold: 40 } },
    { id: 'g14', era: 2, text: 'Construire 3 immeubles', goal: 3, get: () => CNT.immeuble, reward: { brick: 60 } },
    { id: 'g15', era: 2, text: 'Accueillir 50 habitants', goal: 50, get: () => save.pop, reward: { gold: 60 } },
    { id: 'g16', era: 2, text: 'Construire le théâtre', goal: 1, get: () => CNT.theatre, reward: { tools: 30 } },
    { id: 'g18', era: 3, text: 'Construire une centrale', goal: 1, get: () => CNT.centrale, reward: { energy: 60 } },
    { id: 'g19', era: 3, text: "Produire 100 d'acier", goal: 100, get: () => Math.floor(save.stats.made.steel || 0), reward: { gold: 150 } },
    { id: 'g20', era: 3, text: 'Améliorer un bâtiment au niveau 4', goal: 4, get: () => maxLevel(), reward: { steel: 60 } },
    { id: 'g22', era: 3, text: 'Élever la Tour de Clairval', goal: 1, get: () => CNT.tourclairval, reward: { gold: 500 } },
  ];
  // pour chaque ère : passer à l'ère suivante, puis un objectif de production et de population
  // récompense = valeur en or selon l'ère, convertie dans la ressource donnée
  const geq = (e) => 100 * Math.pow(2.8, e - 1);
  const reward = (k, e, f) => ({ [k]: Math.max(1, Math.round((geq(e) * (f || 1)) / RES[k].val)) });
  const lastRes = (e) => RKEYS.filter((k) => RES[k].era <= e).slice(-1)[0];
  for (let e = 2; e <= ERAS.length; e++) {
    const E = ERAS[e - 1];
    GOALS.push({ id: 'ge' + e, era: e - 1, text: `Passer à l'ère ${E.name}`, goal: e, get: () => save.era, reward: reward(lastRes(e - 1), e, 2) });
    if (e >= 4) {
      const main = lastRes(e);
      const amount = Math.max(10, Math.round((geq(e) * 1.5) / RES[main].val / 10) * 10);
      GOALS.push({ id: 'gp' + e, era: e, text: `Produire ${amount.toLocaleString('fr-FR')} ${RES[main].name.toLowerCase()}`, goal: amount, get: () => Math.floor(save.stats.made[main] || 0), reward: reward('gold', e, 3) });
      const pop = E.n < ERAS.length ? ERAS[e].gate.pop : 1000000;
      GOALS.push({ id: 'gh' + e, era: e, text: `Accueillir ${pop.toLocaleString('fr-FR')} habitants`, goal: pop, get: () => save.pop, reward: reward(main, e, 2) });
    }
  }
  GOALS.push({ id: 'gfin', era: 14, text: 'Ouvrir le Portail galactique', goal: 1, get: () => CNT.portail, reward: { quantum: 500 } });

  const NAMES = ['Lou', 'Mila', 'Jules', 'Anouk', 'Tom', 'Rose', 'Hugo', 'Léna', 'Basile', 'Iris', 'Noé', 'Zoé', 'Émile', 'Nina', 'Arthur', 'Lise', 'Gabin', 'Maëlle', 'Sacha', 'Alba', 'Oscar', 'Jade', 'Côme', 'Inès', 'Paul', 'Clara', 'Marius', 'Louna', 'Victor', 'Elsa', 'Robin', 'Capucine', 'Timéo', 'Olga', 'Félix', 'Suzon', 'Aimé', 'Romy', 'Léon', 'Ninon'];

  // ---------- Liens avec l'interface (remplis plus bas quand il y a une page) ----------
  const H = { toast() {}, card() {}, render() {}, persist() {}, fx() {} };

  // ---------- Terrain ----------
  const hash = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + (s || 0) * 74.7) * 43758.5453; return v - Math.floor(v); };
  const mid = (site) => (SITES[site].n - 1) / 2;
  const isRoad = (site, x, y) => (x - mid(site)) % 4 === 0 || (y - mid(site)) % 4 === 0;
  const RIVER_Y = 13;
  const HUB = { terre: [11, 11] };
  const hubOf = (site) => HUB[site] || [mid(site) + 1, mid(site) + 1];
  // terrains réservés aux merveilles (2×2) : un par merveille, visibles sur la carte
  const WONDER_LOT = { tourclairval: [7, 7], arbre: [11, 15], coeur: [15, 7], arcomere: [3, 15] };
  const lotOf = (b) => WONDER_LOT[b.id] || [3, 3];
  const LOTS = {};
  for (const b of BUILDINGS) {
    if (!b.wonder || (b.size || 1) < 2) continue;
    const [lx, ly] = lotOf(b);
    LOTS[b.site] = LOTS[b.site] || new Map();
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) LOTS[b.site].set(lx + dx + ',' + (ly + dy), b);
  }
  const reservedBy = (site, x, y) => (LOTS[site] && LOTS[site].get(x + ',' + y)) || null;
  const tileCache = {};
  function tileKind(site, x, y) {
    const key = site + x + ',' + y;
    if (tileCache[key]) return tileCache[key];
    let k;
    if (site === 'terre' && y === RIVER_Y) k = isRoad(site, x, y) ? 'bridge' : 'water';
    else if (isRoad(site, x, y)) k = 'road';
    else if (site !== 'terre') k = 'ground';
    else if (Math.abs(x - 10) <= 2 && Math.abs(y - 10) <= 2) k = 'grass';
    else {
      const h = hash(x, y, 1);
      k = h < 0.3 ? 'tree' : h < 0.37 ? 'rock' : h < 0.43 ? 'bush' : h < 0.46 ? 'ore' : 'grass';
    }
    return (tileCache[key] = k);
  }
  const NAT_HP = { tree: 5, rock: 8, bush: 4, ore: 6 };
  function natAt(x, y) {
    const k = tileKind('terre', x, y);
    if (!NAT_HP[k]) return null;
    const st = save.nat[x + ',' + y];
    if (st && st.gone) return null;
    return { kind: k, hp: st ? st.hp : NAT_HP[k] };
  }
  const siteR = (site) => (site === 'terre' ? ERAS[Math.min(save.era, 6) - 1].r : 6);
  const inZone = (site, x, y) => { const m = mid(site), r = siteR(site); return Math.abs(x - m) <= r && Math.abs(y - m) <= r; };
  const sitesOpen = () => [...new Set(ERAS.filter((E) => E.n <= save.era).map((E) => E.site))];

  // ---------- Sauvegarde ----------
  const fresh = () => ({
    v: 3, era: 1, day: 1, t: 0.3, speed: 1, intro: false,
    res: Object.fromEntries(RKEYS.map((k) => [k, { food: 18, water: 18, wood: 8 }[k] || 0])),
    pop: 3, jobs: { cueilleur: 2, porteur: 1 },
    map: Object.fromEntries(Object.keys(SITES).map((s) => [s, []])),
    nat: {}, techs: {}, tools: {}, toolsOn: {}, queue: [],
    happy: 55, hunger: 0, thirst: 0, cold: 0, mods: [],
    claimed: {}, notified: {}, log: [], hist: [], rh: {}, won: {},
    stats: { winters: 0, gathered: 0, maxPop: 3, made: {} },
    view: { site: 'terre', rot: 0, badges: false }, seenV3: true,
    updatedAt: 0, lastTs: Date.now(),
  });
  let save = fresh();
  let CNT = {}, LV = {}, OCC = {};
  function recount() {
    CNT = {}; LV = {}; OCC = {}; spotCache = {};
    for (const b of BUILDINGS) { CNT[b.id] = 0; LV[b.id] = 0; }
    for (const site of Object.keys(SITES)) OCC[site] = new Map();
    for (const [site, list] of Object.entries(save.map)) {
      if (!OCC[site]) continue;
      for (const it of list) {
        const b = BY_ID[it.id];
        if (!b) continue;
        CNT[it.id]++; LV[it.id] += it.l;
        const s = b.size || 1;
        for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) OCC[site].set(it.x + dx + ',' + (it.y + dy), it);
      }
    }
  }
  function mergeSave(s) {
    const f = fresh();
    if (!s || typeof s !== 'object') return f;
    if ((s.v || 1) < 3) return migrate(s, f);
    if (s.map) for (const k of Object.keys(s.map)) if (Array.isArray(s.map[k])) s.map[k] = s.map[k].filter((it) => it && BY_ID[it.id] && BY_ID[it.id].site === k);
    const out = Object.assign(f, s, {
      res: Object.assign(f.res, s.res), map: Object.assign(f.map, s.map), jobs: Object.assign({}, s.jobs),
      stats: Object.assign(f.stats, s.stats, { made: Object.assign({}, s.stats && s.stats.made) }),
      view: Object.assign(f.view, s.view), techs: Object.assign({}, s.techs), tools: Object.assign({}, s.tools),
      toolsOn: Object.assign({}, s.toolsOn), queue: s.queue || [], won: Object.assign({}, s.won), nat: Object.assign({}, s.nat), rh: Object.assign({}, s.rh),
    });
    return out;
  }
  // Anciennes sauvegardes (vue de côté) : chaque niveau devient un bâtiment placé sur la carte
  function migrate(s, f) {
    save = f;
    f.seenV3 = false;
    f.era = s.era || 1; f.day = s.day || 1; f.t = typeof s.t === 'number' ? s.t : 0.3; f.speed = s.speed === undefined ? 1 : s.speed;
    f.intro = !!s.intro; f.happy = typeof s.happy === 'number' ? s.happy : 55;
    Object.assign(f.res, s.res);
    const people = Array.isArray(s.people) ? s.people : [];
    f.pop = people.length || 3; f.jobs = {};
    for (const p of people) if (p.job && JOBS[p.job]) f.jobs[p.job] = (f.jobs[p.job] || 0) + 1;
    f.techs = Object.assign({}, s.techs); f.claimed = Object.assign({}, s.claimed); f.notified = Object.assign({}, s.notified);
    f.log = s.log || []; f.hist = s.hist || []; f.mods = s.mods || [];
    f.stats = Object.assign(f.stats, s.stats, { made: Object.assign({}, s.stats && s.stats.made) });
    f.updatedAt = s.updatedAt || 0; f.lastTs = s.lastTs || Date.now();
    recount();
    for (const [id, n] of Object.entries(s.build || {})) {
      const b = BY_ID[id];
      if (!b || !n || b.era > f.era) continue;
      for (let i = 0; i < n; i++) {
        const spot = CNT[id] < b.max ? findSpot(b) : null;
        if (spot) place(b, spot[0], spot[1]);
        else {
          const it = f.map[b.site].filter((x) => x.id === id && x.l < levelCap(b)).sort((a, c) => a.l - c.l)[0];
          if (it) it.l++;
        }
        recount();
      }
    }
    if (s.won) f.won.beffroi = true;
    if (s.wonMega) f.won.tourclairval = true;
    log('Clairval passe en vue isométrique : tes bâtiments ont été placés sur la carte.');
    return f;
  }

  // ---------- Calculs ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const era = () => ERAS[save.era - 1];
  const zero = () => Object.fromEntries(RKEYS.map((k) => [k, 0]));
  const sumLv = (key) => BUILDINGS.reduce((a, b) => a + (b[key] ? b[key] * LV[b.id] : 0), 0);
  const cap = () => 60 + sumLv('store');
  const housing = () => 4 + sumLv('beds');
  const season = () => seasonOf(save.day);
  const winter = () => season().id === 'hiver';
  const employed = () => JKEYS.reduce((a, j) => a + (save.jobs[j] || 0), 0);
  const idleCount = () => Math.max(0, save.pop - employed());
  const slots = (j) => (JOBS[j].base || 0) + (JOB_BLD[j] ? BY_ID[JOB_BLD[j]].jobs[j] * LV[JOB_BLD[j]] : 0);
  const jobUnlocked = (j) => JOBS[j].era <= save.era;
  const unlockedRes = () => RKEYS.filter((k) => RES[k].era <= save.era);
  const levelCap = (b) => Math.min(b.lv || 5, 3 + save.era - b.era);
  const maxLevel = () => Object.values(save.map).flat().reduce((a, it) => Math.max(a, it.l), 0);
  const scaleCost = (c, m) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.max(1, Math.round(v * m))]));
  const instances = (id) => save.map[BY_ID[id].site].filter((x) => x.id === id);
  const newCost = (b) => scaleCost(b.cost, Math.pow(b.grow, CNT[b.id]));
  const upCost = (b, it) => scaleCost(b.cost, Math.pow(b.grow, Math.max(0, instances(b.id).indexOf(it))) * (0.6 + 0.4 * it.l));
  const canPay = (c) => Object.entries(c).every(([k, v]) => save.res[k] >= v);
  const pay = (c) => { for (const [k, v] of Object.entries(c)) save.res[k] -= v; };
  const give = (g) => { const c = cap(); for (const [k, v] of Object.entries(g)) save.res[k] = Math.min(c, save.res[k] + v); };
  const value = (c) => Object.entries(c).reduce((a, [k, v]) => a + v * RES[k].val, 0);
  const hasTech = (id) => !!save.techs[id];
  const techSum = (key) => TECHS.filter((t) => hasTech(t.id) && t[key]).reduce((a, t) => a + t[key], 0);
  const techJob = (j) => TECHS.filter((t) => hasTech(t.id) && t.jobs && t.jobs[j]).reduce((a, t) => a + t.jobs[j], 0);
  const techBld = (id) => TECHS.filter((t) => hasTech(t.id) && t.bld && t.bld[id]).reduce((a, t) => a + t.bld[id], 0);
  const handAmount = () => 1 + Math.max(0, ...TECHS.filter((t) => hasTech(t.id) && t.hand).map((t) => t.hand));
  const toolOn = (id) => !!save.tools[id] && save.toolsOn[id] !== false;
  function fmt(v) {
    const a = Math.abs(v);
    if (a >= 1e9) return (Math.round(v / 1e8) / 10).toLocaleString('fr-FR') + ' Md';
    if (a >= 1e6) return (Math.round(v / 1e5) / 10).toLocaleString('fr-FR') + ' M';
    if (a >= 1e4) return (Math.round(v / 100) / 10).toLocaleString('fr-FR') + ' k';
    return (a >= 10 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('fr-FR');
  }
  const costText = (c) => Object.entries(c).map(([k, v]) => `${fmt(v)} ${RES[k].name.toLowerCase()}`).join(', ');

  function productionMul() {
    let m = 1 + sumLv('prod') + techSum('prod');
    if (save.happy < 30) m *= 0.75; else if (save.happy >= 75) m *= 1.1;
    return m;
  }
  function jobRate(j) {
    const J = JOBS[j];
    const sm = J.season && J.season[season().id] !== undefined ? J.season[season().id] : 1;
    return J.rate * sm * productionMul() * (1 + techJob(j));
  }
  const autoMul = (b) => productionMul() * (1 + techBld(b.id));
  function heatingNeed() {
    if (!winter()) return { res: null, amt: 0 };
    const n = save.pop, cut = 1 - Math.min(0.6, techSum('heat'));
    if (save.era >= 3) return { res: 'energy', amt: 0.3 * n * cut };
    if (save.era === 2) return { res: 'wood', amt: 0.3 * n * cut };
    return { res: 'wood', amt: (0.5 * n + 0.5 * CNT.maison) * cut };
  }
  // Tout ce qui produit : les métiers (habitants) et les bâtiments automatiques
  function processes() {
    const list = [];
    for (const j of JKEYS) {
      const n = save.jobs[j] || 0;
      if (!n) continue;
      const r = n * jobRate(j), inp = {};
      if (JOBS[j].inputs) for (const [k, v] of Object.entries(JOBS[j].inputs)) inp[k] = r * v;
      list.push({ out: { [JOBS[j].res]: r }, inp, src: j });
    }
    for (const b of BUILDINGS) {
      const l = LV[b.id];
      if (!l || !(b.auto || b.use)) continue;
      const m = autoMul(b), out = {}, inp = {};
      if (b.auto) for (const [k, v] of Object.entries(b.auto)) out[k] = v * l * m;
      if (b.use) for (const [k, v] of Object.entries(b.use)) inp[k] = v * l;
      list.push({ out, inp, src: b.id });
    }
    return list;
  }
  function needs() {
    const n = save.pop, c = { food: n, water: n * (1 - Math.min(0.6, techSum('water'))) };
    if (save.era >= 3) c.energy = 0.2 * n;
    const h = heatingNeed();
    if (h.res) c[h.res] = (c[h.res] || 0) + h.amt;
    return c;
  }
  function rates() {
    const prod = zero(), cons = zero();
    for (const p of processes()) {
      for (const [k, v] of Object.entries(p.out)) prod[k] += v;
      for (const [k, v] of Object.entries(p.inp)) cons[k] += v;
    }
    for (const [k, v] of Object.entries(needs())) cons[k] += v;
    return { prod, cons };
  }
  // détail par source, pour l'outil Statistiques
  function breakdown(k) {
    const rows = [];
    for (const p of processes()) {
      const name = JOBS[p.src] ? `${JOBS[p.src].name}s (${save.jobs[p.src]})` : BY_ID[p.src].name;
      if (p.out[k]) rows.push([name, p.out[k]]);
      if (p.inp[k]) rows.push([name, -p.inp[k]]);
    }
    const nd = needs();
    if (nd[k]) rows.push([k === 'energy' || k === 'wood' ? 'Habitants (dont chauffage)' : 'Habitants', -nd[k]]);
    return rows.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }

  let short = {};
  function happinessFactors() {
    const f = [['Vie à Clairval', 50]];
    for (const b of BUILDINGS) if (b.happy && LV[b.id]) f.push([b.name, b.happy * LV[b.id]]);
    const t = techSum('happy');
    if (t) f.push(['Améliorations', t]);
    const sources = ['cueilleur', 'fermier', 'pecheur', 'eleveur', 'agronome', 'jardinier', 'aquaculteur', 'marin', 'colon'].filter((j) => save.jobs[j] > 0).length
      + BUILDINGS.filter((b) => b.auto && b.auto.food && LV[b.id]).length;
    if (sources >= 2) f.push(['Repas variés', 6]);
    const n = save.pop;
    if (n > 20) f.push(['Grande ville, besoin de services', -Math.min(60, Math.round(14 * Math.log10(n / 20)))]);
    if (n > housing()) f.push(['Pas assez de lits', -15]);
    if (short.food) f.push(['Faim', -25]);
    if (short.water) f.push(['Soif', -30]);
    const h = heatingNeed();
    if (h.res && short[h.res]) f.push(['Froid', -20]);
    if (save.era >= 3 && short.energy) f.push(['Coupures de courant', -20]);
    const idle = idleCount();
    if (save.era <= 3 && idle >= 3 && idle > n / 3) f.push(['Personnes sans métier', -6]);
    for (const m of save.mods) f.push([m.l, m.v]);
    return f;
  }
  const happyTarget = () => clamp(happinessFactors().reduce((a, x) => a + x[1], 0), 0, 100);

  // ---------- Journal ----------
  function log(text) { save.log.unshift({ d: save.day, text }); save.log = save.log.slice(0, 60); }

  // ---------- Habitants ----------
  const pickName = () => NAMES[Math.floor(Math.random() * NAMES.length)];
  function addPeople(k) {
    save.pop += k;
    save.stats.maxPop = Math.max(save.stats.maxPop, save.pop);
  }
  function removePeople(k, reason) {
    k = Math.min(k, save.pop - 1);
    if (k <= 0) return;
    save.pop -= k;
    let over = employed() - save.pop;
    while (over > 0) {
      const j = JKEYS.reduce((a, b) => ((save.jobs[b] || 0) > (save.jobs[a] || 0) ? b : a));
      const t = Math.min(over, save.jobs[j]);
      save.jobs[j] -= t; over -= t;
    }
    const who = k === 1 ? `${pickName()} quitte` : `${fmt(k)} habitants quittent`;
    log(`${who} Clairval : ${reason}.`); H.toast(`${who} Clairval : ${reason}.`);
  }
  function assign(j, delta) {
    if (delta > 0) save.jobs[j] = (save.jobs[j] || 0) + Math.max(0, Math.min(delta, slots(j) - (save.jobs[j] || 0), idleCount()));
    else save.jobs[j] = Math.max(0, (save.jobs[j] || 0) + delta);
    H.persist(); H.render();
  }
  // Répartition : d'abord ce qui manque, puis ce qui est le plus bas en réserve (par paquets pour les grandes villes)
  function autoAssign(silent) {
    let n = 0;
    for (let guard = 0; guard < 300; guard++) {
      const idle = idleCount();
      if (!idle) break;
      const { prod, cons } = rates();
      const c = cap();
      const free = JKEYS.filter((j) => jobUnlocked(j) && (save.jobs[j] || 0) < slots(j) && jobRate(j) > 0);
      if (!free.length) break;
      const score = (j) => {
        const J = JOBS[j], r = J.res, net = prod[r] - cons[r];
        let s = (net < 0 ? 100 + Math.min(100, (-net / Math.max(1, cons[r])) * 100) : 0) + (1 - save.res[r] / c) * 20;
        if (J.inputs) for (const k of Object.keys(J.inputs)) if (save.res[k] < 1 && prod[k] - cons[k] <= 0) s -= 60;
        if (save.res[r] >= c * 0.98 && net >= 0) s -= 40;
        return s + RES[r].val * 0.001;
      };
      free.sort((a, b) => score(b) - score(a));
      const j = free[0];
      const room = slots(j) - (save.jobs[j] || 0);
      const chunk = Math.max(1, Math.min(idle, room, Math.ceil(Math.max(idle, 10) / 12)));
      save.jobs[j] = (save.jobs[j] || 0) + chunk; n += chunk;
    }
    if (!silent) {
      H.toast(n ? `${fmt(n)} habitant${n > 1 ? 's ont' : ' a'} reçu un métier.` : 'Aucun poste libre : construis de quoi employer tes habitants.');
      H.persist(); H.render();
    }
    return n;
  }

  // ---------- Construire et améliorer ----------
  function canPlace(b, site, x, y) {
    const s = b.size || 1, n = SITES[site].n, hub = hubOf(site);
    for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= n || Y >= n || !inZone(site, X, Y)) return false;
      const k = tileKind(site, X, Y);
      if (k === 'road' || k === 'water' || k === 'bridge') return false;
      if (OCC[site].has(X + ',' + Y) || (hub[0] === X && hub[1] === Y)) return false;
      const r = reservedBy(site, X, Y);
      if (r && r !== b) return false;
    }
    return true;
  }
  // emplacement proposé : services au centre, logements autour, production en périphérie
  let spotCache = {};
  function findSpot(b) {
    const key = b.id + ':' + save.era;
    if (key in spotCache) return spotCache[key];
    return (spotCache[key] = findSpotRaw(b));
  }
  function findSpotRaw(b) {
    const site = b.site, m = mid(site), n = SITES[site].n, s = b.size || 1;
    if (s === 2) { const [lx, ly] = lotOf(b); return canPlace(b, site, lx, ly) ? [lx, ly] : null; }
    const pref = { Bonheur: 1.5, Merveille: 1.5, Logement: 3, Commerce: 3, Production: 5, Stockage: 5 }[b.cat] || 3;
    let best = null, bs = 1e9;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!canPlace(b, site, x, y)) continue;
      const d = Math.hypot(x + (s - 1) / 2 - m, y + (s - 1) / 2 - m);
      let sc = Math.abs(d - pref) + hash(x, y, 5) * 0.8;
      if (site === 'terre' && natAt(x, y)) sc += 0.7;
      if (sc < bs) { bs = sc; best = [x, y]; }
    }
    return best;
  }
  function place(b, x, y) {
    const it = { id: b.id, x, y, l: 1 };
    const s = b.size || 1;
    if (b.site === 'terre') for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) {
      const key = x + dx + ',' + (y + dy), nat = natAt(x + dx, y + dy);
      if (nat) { if (nat.kind === 'tree') give({ wood: 4 }); if (nat.kind === 'rock') give({ stone: 5 }); }
      save.nat[key] = { gone: true };
    }
    save.map[b.site].push(it);
    return it;
  }
  function buildBlock(b) {
    if (b.era > save.era) return `Ère ${ERAS[b.era - 1].name}`;
    if (CNT[b.id] >= b.max) return 'Nombre maximum atteint';
    if (b.need && save.pop < b.need) return `Il faut ${fmt(b.need)} habitants`;
    return '';
  }
  function build(id, x, y, quiet) {
    const b = BY_ID[id], c = newCost(b);
    if (buildBlock(b) || !canPay(c)) return null;
    let spot = x === undefined ? findSpot(b) : [x, y];
    if (!spot || !canPlace(b, b.site, spot[0], spot[1])) spot = findSpot(b);
    if (!spot) { if (!quiet) H.toast("Plus de place : passe à l'ère suivante pour agrandir le terrain."); return null; }
    pay(c);
    const it = place(b, spot[0], spot[1]);
    recount();
    log(`${b.name} : construction terminée.`);
    H.fx('build', { site: b.site, it });
    afterBuild(b, it, quiet);
    return it;
  }
  function upgrade(it, quiet) {
    const b = BY_ID[it.id];
    if (!b || it.l >= levelCap(b)) return false;
    const c = upCost(b, it);
    if (!canPay(c)) return false;
    pay(c); it.l++; recount();
    log(`${b.name} passe au niveau ${it.l}.`);
    H.fx('up', { site: b.site, it });
    afterBuild(b, it, quiet);
    return true;
  }
  function bestUpgrade(id) {
    const b = BY_ID[id];
    let best = null, bv = Infinity;
    for (const it of instances(id)) {
      if (it.l >= levelCap(b)) continue;
      const v = value(upCost(b, it));
      if (v < bv) { bv = v; best = it; }
    }
    return best;
  }
  const WONDER_TEXT = {
    beffroi: ['Grande étape', 'Le beffroi sonne', "Tout Clairval danse sur la place. Clairval peut maintenant devenir une ville : ouvre l'onglet Progrès."],
    tourclairval: ['Merveille', 'La Tour de Clairval', "Du haut de la tour, on voit toute la mégacité. Une nouvelle ère t'attend : l'Écocité."],
    arbre: ['Merveille', "L'Arbre-Monde", 'Un arbre géant pousse au cœur de la ville. Ses racines filtrent l\'eau, ses feuilles brillent la nuit.'],
    coeur: ['Merveille', 'Le Cœur numérique', "Une intelligence bienveillante veille sur Clairval : feux, trafic, énergie, tout est coordonné."],
    arcomere: ['Merveille', "L'Arcologie-mère", 'Une montagne vivante de verre et de jardins. La Terre ferme est pleine : cap sur la mer.'],
    ascenseur: ['Merveille', "L'Ascenseur spatial", "Un câble relie la mer aux étoiles. Les premières cabines montent vers l'orbite."],
    anneauorb: ['Merveille', "L'Anneau orbital", 'Un anneau de lumière entoure la Terre. Prochaine étape : la Lune.'],
    fusion: ['Merveille', 'Le Réacteur à fusion', "Une petite étoile brûle sous le dôme lunaire. L'énergie ne manquera plus."],
    terraformeur: ['Merveille', 'Le Terraformeur', "L'air de Mars s'épaissit. Améliore le Terraformeur pour voir la planète verdir."],
    foreuse: ['Merveille', 'La Foreuse stellaire', 'Elle perce les astéroïdes comme du beurre. Les cristaux affluent.'],
    dyson: ['Merveille', 'La Sphère de Dyson', 'Le Soleil est entouré. Clairval dispose de plus d\'énergie que toute l\'humanité passée.'],
    coeuranneau: ['Merveille', "Le Cœur de l'anneau", "L'anneau tourne, stable pour des millions d'années. Les étoiles voisines t'appellent."],
    portail: ['Victoire', 'Le Portail galactique', "Le portail s'ouvre. D'une clairière au bord d'une rivière, tu as fait une civilisation galactique.\n\nMerci d'avoir bâti Clairval. Tu peux continuer à jouer."],
  };
  function afterBuild(b, it, quiet) {
    if (WONDER_TEXT[b.id] && !save.won[b.id]) {
      save.won[b.id] = true;
      const [k, t, txt] = WONDER_TEXT[b.id];
      H.card(k, t, txt, [{ label: 'Continuer' }], 900);
    } else if (!quiet) {
      H.toast(`${b.name}${it.l > 1 ? ` niveau ${it.l}` : ''} : ${effectText(b)} par niveau.`);
    }
    H.persist(); H.render();
  }
  function effectText(b) {
    const p = [];
    if (b.beds) p.push(`+${fmt(b.beds)} lits`);
    if (b.jobs) for (const [j, v] of Object.entries(b.jobs)) p.push(`+${fmt(v)} ${JOBS[j].name.toLowerCase()}${v > 1 ? 's' : ''} (${RES[JOBS[j].res].name.toLowerCase()})`);
    if (b.auto) p.push('produit ' + Object.entries(b.auto).map(([k, v]) => `${fmt(v)} ${RES[k].name.toLowerCase()}`).join(' et ') + '/jour');
    if (b.use) p.push('consomme ' + Object.entries(b.use).map(([k, v]) => `${fmt(v)} ${RES[k].name.toLowerCase()}`).join(' et '));
    if (b.store) p.push(`+${fmt(b.store)} de place`);
    if (b.happy) p.push(`+${b.happy} bonheur`);
    if (b.prod) p.push(`+${Math.round(b.prod * 100)} % de production`);
    return p.join(', ');
  }
  function eraReady() {
    const next = ERAS[save.era];
    return !!next && gateChecks(next).every((c) => c.ok) && canPay(next.gate.cost);
  }
  function gateChecks(E) {
    const g = E.gate;
    return [{ l: 'Habitants', v: save.pop, g: g.pop, ok: save.pop >= g.pop }, ...g.bld.map((id) => ({ l: BY_ID[id].name, v: CNT[id], g: 1, ok: CNT[id] >= 1 }))];
  }
  function eraUp() {
    const next = ERAS[save.era];
    if (!eraReady()) return false;
    pay(next.gate.cost);
    save.era = next.n;
    log(`Clairval entre dans l'ère ${next.name} !`);
    H.fx('era', { site: next.site });
    H.card('Nouvelle ère', `Ère ${next.name}`, next.story + (next.site !== ERAS[next.n - 2].site ? `\n\nUn nouveau site s'ouvre : ${SITES[next.site].name}.` : "\n\nDe nouveaux terrains s'ouvrent autour de la ville, et tes anciens bâtiments peuvent monter d'un niveau."), [{ label: 'Découvrir' }]);
    H.persist(); H.render();
    return true;
  }

  // ---------- Conseiller et outils ----------
  // meilleure option pour obtenir une ressource, des lits, du bonheur ou de la place
  function optionsFor(key) {
    const ok = (b) => b.era <= save.era && (
      key === 'beds' ? b.beds : key === 'happy' ? b.happy : key === 'store' ? b.store
        : (b.auto && b.auto[key]) || (b.jobs && Object.keys(b.jobs).some((j) => JOBS[j].res === key && jobRate(j) > 0)));
    const opts = [];
    for (const b of BUILDINGS.filter(ok)) {
      if (!buildBlock(b) && findSpot(b)) opts.push({ b, kind: 'new', cost: newCost(b) });
      const it = bestUpgrade(b.id);
      if (it) opts.push({ b, kind: 'up', it, cost: upCost(b, it) });
    }
    const gain = (o) => {
      const b = o.b;
      if (key === 'beds') return b.beds; if (key === 'happy') return b.happy; if (key === 'store') return b.store;
      if (b.auto && b.auto[key]) return b.auto[key];
      const j = Object.keys(b.jobs).find((x) => JOBS[x].res === key);
      return b.jobs[j] * JOBS[j].rate * 0.6;
    };
    opts.sort((a, b) => (canPay(b.cost) - canPay(a.cost)) || (value(a.cost) / gain(a) - value(b.cost) / gain(b)));
    return opts;
  }
  function doOption(o, quiet) {
    if (!o || !canPay(o.cost)) return false;
    return o.kind === 'new' ? !!build(o.b.id, undefined, undefined, quiet) : upgrade(o.it, quiet);
  }
  const optLabel = (o) => `${o.kind === 'new' ? 'Construire' : `Améliorer (niv. ${o.it.l + 1})`} : ${o.b.name}`;
  function advice() {
    const tips = [];
    const { prod, cons } = rates();
    const idle = idleCount();
    const freeSlots = JKEYS.filter((j) => jobUnlocked(j) && (save.jobs[j] || 0) < slots(j) && jobRate(j) > 0).reduce((a, j) => a + slots(j) - (save.jobs[j] || 0), 0);
    const need = (k, why) => {
      const opts = optionsFor(k), o = opts[0];
      const jobFree = JKEYS.some((j) => JOBS[j].res === k && jobUnlocked(j) && (save.jobs[j] || 0) < slots(j) && jobRate(j) > 0);
      if (idle > 0 && jobFree) tips.push({ text: why, label: 'Donner un métier aux habitants', fn: () => autoAssign() });
      else if (o) tips.push({ text: why, label: optLabel(o), cost: o.cost, fn: () => doOption(o) });
    };
    const vital = [['water', "Il manque de l'eau"], ['food', 'Il manque de la nourriture']];
    if (save.era >= 3) vital.push(['energy', "Il manque de l'énergie"]);
    for (const [k, t] of vital) {
      const net = prod[k] - cons[k];
      if (net < 0) need(k, `${t} (${fmt(net)} par jour, ${save.res[k] > 0 ? `réserve pour ${fmt(save.res[k] / -net)} jours` : 'réserve vide'}).`);
    }
    // ateliers à l'arrêt faute de matière première
    for (const j of JKEYS) {
      const J = JOBS[j];
      if (!J.inputs || !save.jobs[j]) continue;
      for (const k of Object.keys(J.inputs)) if (save.res[k] < 1 && prod[k] - cons[k] < 0) { need(k, `Les ${J.name.toLowerCase()}s manquent de ${RES[k].name.toLowerCase()} : leur production ralentit.`); break; }
    }
    const hk = save.era >= 3 ? 'energy' : 'wood';
    if (season().id === 'automne' && save.res[hk] < save.pop * 0.3 * SEASON_DAYS && prod[hk] - cons[hk] < save.pop * 0.3) need(hk, `L'hiver approche : il faudra ${hk === 'wood' ? 'du bois' : "de l'énergie"} pour chauffer.`);
    if (idle > 0 && freeSlots > 0) tips.push({ text: `${fmt(idle)} habitant${idle > 1 ? 's' : ''} sans métier et ${fmt(freeSlots)} poste${freeSlots > 1 ? 's' : ''} libre${freeSlots > 1 ? 's' : ''}.`, label: 'Répartir automatiquement', fn: () => autoAssign() });
    if (save.pop >= housing() - 1) { const o = optionsFor('beds')[0]; if (o) tips.push({ text: 'Tous les lits sont pris : personne ne peut plus arriver.', label: optLabel(o), cost: o.cost, fn: () => doOption(o) }); }
    if (save.happy < 45) { const o = optionsFor('happy')[0]; if (o) tips.push({ text: `Bonheur bas (${Math.round(save.happy)} %) : sous 45 %, plus personne n'arrive.`, label: optLabel(o), cost: o.cost, fn: () => doOption(o) }); }
    const full = unlockedRes().filter((k) => save.res[k] >= cap() * 0.95);
    if (full.length) { const o = optionsFor('store')[0]; if (o) tips.push({ text: `Réserves pleines (${full.map((k) => RES[k].name.toLowerCase()).join(', ')}).`, label: optLabel(o), cost: o.cost, fn: () => doOption(o) }); }
    const next = ERAS[save.era];
    if (next) {
      if (eraReady()) tips.push({ text: `Tout est prêt pour l'ère ${next.name} !`, label: `Passer à l'ère ${next.name}`, fn: eraUp });
      else for (const id of next.gate.bld) if (!CNT[id] && BY_ID[id].era <= save.era) { const b = BY_ID[id]; tips.push({ text: `Pour l'ère ${next.name}, il faut : ${b.name}${b.need && save.pop < b.need ? ` (dès ${fmt(b.need)} habitants)` : ''}.`, label: `Construire : ${b.name}`, cost: newCost(b), fn: () => build(id) }); }
    }
    const tech = TECHS.find((t) => t.era <= save.era && !hasTech(t.id) && canPay(t.cost));
    if (tech) tips.push({ text: `Amélioration abordable : ${tech.name} (${tech.desc.toLowerCase()}).`, label: `Acheter : ${tech.name}`, cost: tech.cost, fn: () => buyTech(tech.id) });
    const g = GOALS.find((x) => x.era <= save.era && goalDone(x) && !save.claimed[x.id]);
    if (g) tips.push({ text: `Objectif atteint : ${g.text}.`, label: 'Réclamer la récompense', fn: () => claimGoal(g.id) });
    if (!tips.length) tips.push({ text: 'Tout va bien. Améliore tes bâtiments : chaque niveau les rend plus beaux et plus efficaces.' });
    return tips.slice(0, 5);
  }
  function buyTech(id) {
    const t = TECHS.find((x) => x.id === id);
    if (!t || hasTech(id) || t.era > save.era || !canPay(t.cost)) return false;
    pay(t.cost); save.techs[id] = true;
    log(`Amélioration : ${t.name} (${t.desc.toLowerCase()}).`); H.toast(`${t.name} : ${t.desc}.`);
    H.persist(); H.render();
    return true;
  }
  function buyTool(id) {
    const t = TOOLS.find((x) => x.id === id);
    if (!t || save.tools[id] || t.era > save.era || !canPay(t.cost)) return false;
    pay(t.cost); save.tools[id] = true; save.toolsOn[id] = true;
    log(`Nouvel outil : ${t.name}.`); H.toast(`${t.name} est prêt.`);
    H.persist(); H.render();
    return true;
  }
  const goalDone = (g) => g.get() >= g.goal;
  function claimGoal(id) {
    const g = GOALS.find((x) => x.id === id);
    if (!g || !goalDone(g) || save.claimed[id]) return;
    save.claimed[id] = true; give(g.reward);
    const rw = costText(g.reward);
    log(`Objectif atteint : ${g.text} (+${rw}).`); H.toast(`Récompense : +${rw}.`);
    H.persist(); H.render();
  }
  // File de constructions (outil « Carnet ») : { kind: 'new' | 'up', id }
  function queueAdd(kind, id) { if (save.queue.length < 12) save.queue.push({ kind, id }); H.persist(); H.render(); }
  function processQueue() {
    if (!save.tools.file || !save.queue.length) return;
    for (let i = 0; i < save.queue.length; i++) {
      const q = save.queue[i], b = BY_ID[q.id];
      if (q.kind === 'new') {
        if (buildBlock(b) === 'Nombre maximum atteint' || !findSpot(b)) { save.queue.splice(i, 1); return; }
        if (!buildBlock(b) && canPay(newCost(b))) { save.queue.splice(i, 1); build(b.id, undefined, undefined, true); return; }
      } else {
        const it = bestUpgrade(q.id);
        if (!it) { save.queue.splice(i, 1); return; }
        if (canPay(upCost(b, it))) { save.queue.splice(i, 1); upgrade(it, true); return; }
      }
    }
  }
  function dailyTools() {
    const done = [];
    if (toolOn('drones')) { const a = 20 * save.era * save.era; give({ food: a, water: a, wood: a, stone: a }); }
    if (toolOn('emploi')) { const n = autoAssign(true); if (n) done.push(`${fmt(n)} embauches`); }
    if (toolOn('urbaniste')) {
      const { prod, cons } = rates();
      const keys = ['water', 'food']; if (save.era >= 3) keys.push('energy');
      let acts = 0;
      for (const k of keys) if (acts < 2 && prod[k] - cons[k] < 0) { const o = optionsFor(k).find((x) => canPay(x.cost)); if (o && doOption(o, true)) { acts++; done.push(`${o.b.name} (${RES[k].name.toLowerCase()})`); } }
      if (acts < 2 && save.pop >= housing() - 1) { const o = optionsFor('beds').find((x) => canPay(x.cost)); if (o && doOption(o, true)) done.push(`${o.b.name} (lits)`); }
      autoAssign(true);
    }
    if (toolOn('contremaitre')) {
      const c = cap();
      for (let k = 0; k < 3; k++) {
        let best = null, bv = Infinity;
        for (const b of BUILDINGS) {
          if (b.era > save.era || b.wonder) continue;
          const it = bestUpgrade(b.id);
          if (!it) continue;
          const cost = upCost(b, it);
          if (!Object.entries(cost).every(([r, v]) => save.res[r] - v >= c * 0.5)) continue;
          const v = value(cost);
          if (v < bv) { bv = v; best = it; }
        }
        if (!best || !upgrade(best, true)) break;
        done.push(`${BY_ID[best.id].name} niv. ${best.l}`);
      }
    }
    if (toolOn('courtier') && CNT.marche) {
      const c = cap();
      let gold = 0;
      for (const k of unlockedRes()) {
        if (k === 'gold' || save.res[k] < c * 0.9) continue;
        const q = save.res[k] - c * 0.8;
        save.res[k] -= q; gold += q * RES[k].val * 0.8;
      }
      if (gold >= 1) { give({ gold }); done.push(`+${fmt(gold)} or de ventes`); }
    }
    if (done.length) log(`Outils : ${done.join(', ')}.`);
  }

  // ---------- Marché ----------
  function tradeQuote(g, r, q) {
    if (g === r) return null;
    const m = CNT.marche, bank = hasTech('t_banque');
    if (g === 'gold' || r === 'gold') {
      if (!m) return { err: "Il faut un marché pour utiliser l'or." };
      if (r === 'gold') return { cost: q, gain: Math.max(1, Math.floor(q * RES[g].val * (bank ? 0.95 : 0.8))) };
      return { cost: Math.ceil(q * RES[r].val * (bank ? 1.1 : 1.3)), gain: q };
    }
    const rate = LV.marche >= 3 ? 1.25 : m ? 1.5 : 2;
    return { cost: q, gain: Math.max(1, Math.floor((q / rate) * (RES[g].val / RES[r].val))) };
  }
  function trade(g, r, q) {
    const t = tradeQuote(g, r, q);
    if (!t || t.err || save.res[g] < t.cost) return false;
    if (save.res[r] + t.gain > cap()) { H.toast('Pas assez de place dans les réserves.'); return false; }
    save.res[g] -= t.cost; save.res[r] += t.gain;
    log(`Marché : ${fmt(t.cost)} ${RES[g].name.toLowerCase()} contre ${fmt(t.gain)} ${RES[r].name.toLowerCase()}.`);
    H.toast(`Échange fait : +${fmt(t.gain)} ${RES[r].name.toLowerCase()}.`);
    H.persist(); H.render();
    return true;
  }

  // ---------- Simulation ----------
  let hudDirty = true;
  function step(dtGame) {
    const days = dtGame / DAY, c = cap();
    const procs = processes();
    const want = zero(), gain = zero(), made = zero();
    for (const p of procs) for (const [k, v] of Object.entries(p.inp)) want[k] += v * days;
    const avail = {};
    for (const k of RKEYS) avail[k] = want[k] > 0 ? Math.min(1, save.res[k] / want[k]) : 1;
    for (const p of procs) {
      let ratio = 1;
      for (const k of Object.keys(p.inp)) ratio = Math.min(ratio, avail[k]);
      for (const [k, v] of Object.entries(p.inp)) gain[k] -= v * days * ratio;
      for (const [k, v] of Object.entries(p.out)) { gain[k] += v * days * ratio; made[k] += v * days * ratio; }
    }
    const nd = needs();
    for (const k of RKEYS) {
      const delta = gain[k] - (nd[k] || 0) * days;
      save.res[k] = clamp(save.res[k] + delta, 0, c);
      if (made[k] > 0) save.stats.made[k] = (save.stats.made[k] || 0) + made[k];
      short[k] = save.res[k] <= 0.001 && delta < 0;
    }
    save.happy += (happyTarget() - save.happy) * Math.min(1, days * 1.2);
    save.t += days;
    if (save.t >= 1) { save.t -= 1; endOfDay(); }
  }

  function endOfDay() {
    const before = season().id;
    save.day++;
    const now = season();
    if (now.id !== before) {
      if (now.id === 'printemps') { save.stats.winters++; log(`Le printemps revient. Clairval a traversé son hiver n°${save.stats.winters}.`); }
      const h = save.era >= 3 ? "il faut de l'énergie pour chauffer" : 'il faut du bois pour se chauffer';
      const msg = { printemps: 'Printemps : les buissons refleurissent.', ete: 'Été : la cueillette et les champs donnent davantage.', automne: "Automne : grosses récoltes. Fais des réserves pour l'hiver !", hiver: `L'hiver arrive : plus de cueillette ni de champs, et ${h}.` }[now.id];
      log(msg); H.toast(msg);
    }
    const n = save.pop;
    save.hunger = short.food ? save.hunger + 1 : 0;
    save.thirst = short.water ? save.thirst + 1 : 0;
    const h = heatingNeed();
    save.cold = h.res && short[h.res] ? save.cold + 1 : 0;
    const k = Math.max(1, Math.ceil(n * 0.05));
    if (save.thirst >= 1) removePeople(k, "il n'y a plus d'eau");
    else if (save.hunger >= 2) removePeople(k, 'la faim dure depuis deux jours');
    else if (save.cold >= 2) removePeople(k, 'il fait trop froid');
    else if (save.happy < 25 && Math.random() < 0.5) removePeople(k, 'la vie ici est trop dure');
    else if (save.happy >= 45 && n < housing() && save.res.food >= n * 0.5 && save.res.water >= n * 0.5) {
      let arrivals = Math.max(1, Math.ceil(n * (0.08 + 0.004 * save.era) * (save.happy >= 80 ? 1.5 : 1)));
      arrivals = Math.min(arrivals, housing() - n);
      addPeople(arrivals);
      const msg = arrivals === 1 ? `${pickName()} s'installe à Clairval.` : arrivals === 2 ? `${pickName()} et ${pickName()} s'installent à Clairval.` : `${fmt(arrivals)} nouveaux habitants s'installent à Clairval.`;
      log(msg);
      if (!toolOn('emploi')) H.toast(msg + ' Donne-leur un métier (onglet Habitants).');
    }
    save.mods = save.mods.map((m) => ({ ...m, d: m.d - 1 })).filter((m) => m.d > 0);
    for (const [key, st] of Object.entries(save.nat)) {
      if (st.gone) continue;
      const [x, y] = key.split(',').map(Number), kind = tileKind('terre', x, y);
      if (kind === 'bush') st.hp = winter() ? 0 : Math.min(NAT_HP.bush, st.hp + 2);
      else if (st.hp > 0) st.hp++;
      else if (--st.t <= 0) st.hp = NAT_HP[kind];
      if (st.hp >= NAT_HP[kind]) delete save.nat[key];
    }
    save.hist.push(save.pop); save.hist = save.hist.slice(-60);
    for (const k of unlockedRes()) { const a = save.rh[k] || (save.rh[k] = []); a.push(Math.round(save.res[k])); if (a.length > 40) a.shift(); }
    dailyTools();
    if (save.day > 3 && Math.random() < 0.3) H.fx('event');
    H.persist(); H.render();
  }

  // ---------- Événements ----------
  const EVENTS = [
    { w: 3, ok: () => true, run() {
      const e = save.era, pool = [];
      const keys = unlockedRes().filter((k) => k !== 'gold');
      for (let i = 0; i < 6; i++) {
        const a = keys[Math.floor(Math.random() * keys.length)], b = keys[Math.floor(Math.random() * keys.length)];
        if (a === b) continue;
        const gv = 30 * Math.pow(2.8, e - 1);
        pool.push({ give: { [a]: Math.max(1, Math.round(gv / RES[a].val)) }, get: { [b]: Math.max(1, Math.round((gv * 1.4) / RES[b].val)) } });
      }
      const offers = pool.slice(0, 2);
      H.card('Événement', 'Un marchand ambulant', 'Il pose sa charrette sur la place et propose des échanges.',
        [...offers.map((o) => ({ label: `Donner ${costText(o.give)} contre ${costText(o.get)}`, ok: canPay(o.give), fn() { pay(o.give); give(o.get); log(`Échange avec le marchand : ${costText(o.give)} contre ${costText(o.get)}.`); } })), { label: 'Non merci' }]);
    } },
    { w: 2, ok: () => save.era <= 2 && save.res.wood > 10, run() { const lost = Math.round(save.res.wood * 0.15); save.res.wood -= lost; log(`Une tempête a abîmé la réserve de bois (−${lost} bois).`); H.toast(`Tempête ! −${lost} bois.`); } },
    { w: 2, ok: () => !winter(), run() { const a = Math.round(20 * Math.pow(2.5, save.era - 1)); give({ food: a }); log(`Belle récolte surprise : +${fmt(a)} nourriture.`); H.toast(`Récolte surprise : +${fmt(a)} nourriture.`); } },
    { w: 2, ok: () => save.pop < housing() && save.happy >= 40, run() {
      const k = Math.min(housing() - save.pop, Math.max(2, Math.ceil(save.pop * 0.05)));
      addPeople(k);
      log(`Des voyageurs arrivent : ${fmt(k)} restent à Clairval.`); H.toast(`Des voyageurs arrivent : ${fmt(k)} restent à Clairval.`);
    } },
    { w: 2, ok: () => save.pop >= 5, run() {
      if (CNT.guerisseuse || CNT.hopital) { log('Une fièvre a touché la ville, vite soignée.'); H.toast('Une fièvre a vite été soignée.'); }
      else { save.mods.push({ l: 'Fièvre', v: -12, d: 3 }); log('Une fièvre touche Clairval (−12 bonheur pendant 3 jours).'); H.toast('Fièvre : −12 bonheur pendant 3 jours. Une guérisseuse aiderait.'); }
    } },
    { w: 2, ok: () => winter() && save.res.food > 10 && save.era < 3, run() { const lost = Math.round(save.res.food * 0.1); save.res.food -= lost; log(`Des loups ont rôdé près du grenier (−${lost} nourriture).`); H.toast(`Des loups ont volé ${lost} de nourriture.`); } },
    { w: 1, ok: () => save.happy >= 70, run() { save.mods.push({ l: 'Souvenir de la fête', v: 8, d: 3 }); log('Les habitants font la fête (+8 bonheur pendant 3 jours).'); H.toast('Une fête spontanée ! +8 bonheur.'); } },
    { w: 2, ok: () => save.era >= 2 && save.era <= 4, run() {
      if (CNT.caserne) { log('Un départ de feu, éteint par les pompiers.'); H.toast('Les pompiers ont éteint un incendie.'); }
      else { const w = Math.round(save.res.wood * 0.2), b = Math.round(save.res.brick * 0.2); save.res.wood -= w; save.res.brick -= b; log(`Incendie ! −${w} bois, −${b} briques. Une caserne l'aurait évité.`); H.toast(`Incendie ! −${w} bois, −${b} briques.`); }
    } },
    { w: 1, ok: () => save.era >= 2, run() { const a = Math.round(30 * Math.pow(2.8, save.era - 2)); give({ gold: a }); log(`Foire annuelle : +${fmt(a)} or.`); H.toast(`Foire annuelle : +${fmt(a)} or.`); } },
    { w: 2, ok: () => save.era >= 3 && save.res.energy > 10, run() { const lost = Math.round(save.res.energy * 0.25); save.res.energy -= lost; log(`Panne sur le réseau (−${fmt(lost)} énergie).`); H.toast(`Panne de courant : −${fmt(lost)} énergie.`); } },
    { w: 2, ok: () => save.era >= 5, run() { const k = unlockedRes().slice(-1)[0], a = Math.max(1, Math.round((50 * Math.pow(2.8, save.era - 1)) / RES[k].val)); give({ [k]: a }); log(`Découverte des chercheurs : +${fmt(a)} ${RES[k].name.toLowerCase()}.`); H.toast(`Découverte ! +${fmt(a)} ${RES[k].name.toLowerCase()}.`); } },
    { w: 1, ok: () => save.era >= 8, run() { const k = 'alloy', lost = Math.round(save.res[k] * 0.15); save.res[k] -= lost; log(`Pluie de micrométéorites : −${fmt(lost)} alliage pour réparer les coques.`); H.toast(`Micrométéorites ! −${fmt(lost)} alliage.`); } },
    { w: 1, ok: () => save.era >= 9, run() { save.mods.push({ l: 'Aurores spatiales', v: 10, d: 3 }); log('Des aurores illuminent le ciel (+10 bonheur pendant 3 jours).'); H.toast('Aurores spatiales : +10 bonheur.'); } },
  ];
  function randomEvent() {
    const list = EVENTS.filter((e) => e.ok());
    let r = Math.random() * list.reduce((a, e) => a + e.w, 0);
    for (const e of list) { r -= e.w; if (r <= 0) { e.run(); break; } }
    H.persist(); H.render();
  }
  function offlineGains(secs) {
    const days = Math.min(2, secs / DAY);
    const gains = {};
    const prod = zero();
    for (const p of processes()) if (!Object.keys(p.inp).length) for (const [k, v] of Object.entries(p.out)) prod[k] += v;
    for (const k of unlockedRes()) {
      const g = Math.min(cap() - save.res[k], prod[k] * days * 0.5);
      if (g >= 1) { save.res[k] += g; gains[k] = Math.floor(g); }
    }
    return gains;
  }

  // ---------- Export pour les tests hors navigateur ----------
  if (!HAS_DOM) {
    module.exports = {
      ERAS, SITES, RES, RKEYS, JOBS, JKEYS, BUILDINGS, BY_ID, TECHS, TOOLS, GOALS, H,
      get save() { return save; }, set save(v) { save = v; recount(); }, get CNT() { return CNT; }, get LV() { return LV; },
      fresh, mergeSave, recount, step, endOfDay, rates, processes, cap, housing, slots, idleCount, build, upgrade, bestUpgrade,
      newCost, upCost, canPay, buyTech, buyTool, eraUp, eraReady, gateChecks, autoAssign, optionsFor, doOption, advice,
      happyTarget, happinessFactors, levelCap, tileKind, findSpot, claimGoal, goalDone, trade, tradeQuote, processQueue, queueAdd,
      randomEvent, dailyTools, value, fmt, effectText, breakdown, sitesOpen,
    };
    return;
  }

  // =====================================================================
  // Interface
  // =====================================================================
  // Sauvegardes automatiques de secours : une photo de la partie toutes les 5 minutes de jeu,
  // à chaque nouvelle ère et avant tout chargement. Les 8 dernières sont gardées sur l'appareil.
  const BACKUP_KEY = 'clairval-backups', BACKUP_MAX = 8;
  function readBackups() {
    try { const l = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function writeBackups(list) {
    while (list.length) {
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify(list)); return true; } catch (e) { list.pop(); }
    }
    try { localStorage.removeItem(BACKUP_KEY); } catch (e) { /* ignore */ }
    return false;
  }
  function makeBackup(reason) {
    if (!save.intro) return;
    const list = readBackups();
    list.unshift({ ts: Date.now(), day: save.day, era: save.era, pop: save.pop, reason, data: JSON.stringify(save) });
    writeBackups(list.slice(0, BACKUP_MAX));
  }
  // chargement : la sauvegarde principale, sinon la plus récente sauvegarde de secours encore lisible
  let restoredFromBackup = false;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = mergeSave(JSON.parse(raw));
  } catch (e) {
    for (const b of readBackups()) {
      try { save = mergeSave(JSON.parse(b.data)); restoredFromBackup = true; break; } catch (err) { /* suivante */ }
    }
  }
  recount();

  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  const dctx = dark.getContext('2d');
  const ui = { card: $('card'), toast: $('toast'), info: $('info'), placeBar: $('place-bar'), sheet: $('sheet') };

  // ---------- Sauvegarde : appareil, compte claude.ai, code ----------
  let cloudRef = null, cloudBusy = false, cloudPending = false, cloudTimer = 0, lastSaved = 0, localOk = true;
  function persist(now) {
    save.updatedAt = Date.now();
    save.lastTs = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); localOk = true; }
    catch (e) {
      // réserve pleine : on libère la place des sauvegardes de secours les plus anciennes, puis on réessaie
      const list = readBackups();
      localOk = false;
      while (list.length && !localOk) { list.pop(); writeBackups(list); try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); localOk = true; } catch (err) { /* encore */ } }
    }
    lastSaved = Date.now();
    if (cloudRef) { clearTimeout(cloudTimer); if (now) pushCloud(); else cloudTimer = setTimeout(pushCloud, 1500); setSaveStatus('saving'); }
    else setSaveStatus(localOk ? 'local' : 'error');
  }
  async function pushCloud() {
    if (!cloudRef) return;
    if (cloudBusy) { cloudPending = true; return; }
    cloudBusy = true;
    try { await cloudRef.set(JSON.parse(JSON.stringify(save))); setSaveStatus('cloud'); }
    catch (e) {
      if (e && ['invalid_argument', 'revoked', 'not_granted'].includes(e.code)) { cloudRef = null; setSaveStatus('local'); }
      else setSaveStatus('error');
    }
    cloudBusy = false;
    if (cloudPending) { cloudPending = false; pushCloud(); }
  }
  async function initCloud() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      const ref = db.doc(`data/users/${uid}/clairval`);
      const snap = await ref.get();
      cloudRef = ref;
      const remote = snap.exists ? snap.data() : null;
      if (remote && (remote.updatedAt || 0) > (save.updatedAt || 0)) {
        makeBackup('avant récupération du compte');
        loadSave(mergeSave(remote));
        if (!ui.card.hidden && cardIsIntro) closeCard();
        toast('Clairval récupéré depuis ton compte.');
        setSaveStatus('cloud');
      } else if (save.intro) await pushCloud();
      else setSaveStatus('cloud');
    } catch (e) { cloudRef = null; setSaveStatus('local'); }
  }
  const SAVE_TEXT = { cloud: 'Sauvegardé sur ton compte', saving: 'Sauvegarde…', local: 'Sauvegardé sur cet appareil', error: 'Sauvegarde en attente' };
  function setSaveStatus(st) {
    const el = $('save-status');
    el.textContent = SAVE_TEXT[st];
    el.dataset.state = st;
    // petit témoin dans le bandeau du haut
    const dot = $('save-dot');
    if (dot) {
      dot.dataset.state = st;
      dot.setAttribute('aria-label', SAVE_TEXT[st]);
      dot.title = SAVE_TEXT[st];
      dot.classList.remove('pulse'); void dot.offsetWidth; dot.classList.add('pulse');
    }
  }
  function agoText(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 10) return "à l'instant";
    if (s < 60) return `il y a ${s} s`;
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
    return `il y a ${Math.floor(s / 86400)} j`;
  }
  // sauvegarde immédiate quand on quitte la page ou qu'on passe à une autre application
  function saveOnLeave() { if (save.intro) persist(true); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveOnLeave(); });
  window.addEventListener('pagehide', saveOnLeave);
  window.addEventListener('beforeunload', saveOnLeave);
  function loadSave(s) {
    save = s; recount();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
    if (!sitesOpen().includes(save.view.site)) save.view.site = 'terre';
    walkers = []; hudBuilt = ''; closeInfo(); stopPlacing();
    centerOnSite(save.view.site, true);
    renderAll(); renderSpeed();
  }

  // ---------- Petites aides ----------
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function costHtml(c) {
    return Object.entries(c).map(([k, v]) => `<span class="${save.res[k] < v ? 'miss' : ''}"><i style="background:${RES[k].color}"></i>${fmt(v)} ${RES[k].name.toLowerCase()}</span>`).join('');
  }
  // temps estimé avant de pouvoir payer, d'après la production actuelle
  function eta(c) {
    const { prod, cons } = rates();
    let d = 0;
    for (const [k, v] of Object.entries(c)) {
      if (save.res[k] >= v) continue;
      if (v > cap()) return 'plus grand que tes réserves';
      const net = prod[k] - cons[k];
      if (net <= 0) return `il faut produire ${RES[k].name.toLowerCase()}`;
      d = Math.max(d, (v - save.res[k]) / net);
    }
    if (!d) return '';
    return d < 1 ? "dans moins d'un jour" : `dans ≈ ${fmt(Math.ceil(d))} jour${d >= 2 ? 's' : ''}`;
  }
  function keepFocus(fn) {
    const id = document.activeElement && document.activeElement.id;
    const sc = {};
    for (const t of document.querySelectorAll('.tab')) sc[t.id] = t.scrollTop;
    fn();
    for (const t of document.querySelectorAll('.tab')) if (sc[t.id] !== undefined) t.scrollTop = sc[t.id];
    if (id && $(id)) $(id).focus();
  }

  let toastTimer = 0;
  function toast(text) {
    const t = ui.toast;
    t.textContent = text; t.hidden = true; void t.offsetWidth;
    t.style.top = (document.querySelector('.hud').offsetHeight + 4) + 'px';
    t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
  }

  let cardIsIntro = false, speedBeforeCard = 1;
  function showCard(kicker, title, text, actions, intro) {
    cardIsIntro = !!intro;
    if (ui.card.hidden) speedBeforeCard = save.speed || speedBeforeCard || 1;
    save.speed = 0; renderSpeed();
    $('card-kicker').textContent = kicker; $('card-title').textContent = title; $('card-text').textContent = text;
    const box = $('card-actions'); box.innerHTML = '';
    for (const a of actions) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = a.label; b.disabled = a.ok === false;
      b.addEventListener('click', () => { closeCard(); if (a.fn) a.fn(); persist(); renderAll(); });
      box.appendChild(b);
    }
    ui.card.hidden = false;
    box.firstChild.focus();
  }
  function closeCard() { ui.card.hidden = true; save.speed = speedBeforeCard || 1; renderSpeed(); }

  // ---------- Liens avec la simulation ----------
  H.toast = toast;
  H.card = (k, t, txt, actions, delay) => { if (delay) setTimeout(() => showCard(k, t, txt, actions), delay); else showCard(k, t, txt, actions); };
  H.render = () => { needRender = true; };
  H.persist = persist;
  H.fx = (type, d) => {
    if (type === 'event') { if (ui.card.hidden && !placing) randomEvent(); return; }
    if (type === 'era') { save.view.site = d.site; centerOnSite(d.site); hudBuilt = ''; return; }
    if (type === 'build' || type === 'up') { anims.push({ it: d.it, site: d.site, t0: time, kind: type }); if (d.site === save.view.site && !quietFx) focusTile(d.site, d.it); }
  };
  let needRender = true, quietFx = false;

  // ---------- Bandeau du haut ----------
  let hudBuilt = '';
  function hudOrder() {
    const keys = unlockedRes();
    const first = ['food', 'water'];
    if (save.era >= 3) first.push('energy');
    const rest = keys.filter((k) => !first.includes(k)).sort((a, b) => RES[b].era - RES[a].era);
    return [...first, ...rest];
  }
  function renderHud() {
    const { prod, cons } = rates();
    const c = cap();
    const row = $('res-row');
    const keys = hudOrder();
    if (hudBuilt !== keys.join()) {
      hudBuilt = keys.join();
      row.innerHTML = '';
      for (const k of keys) {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'res'; el.dataset.k = k;
        el.setAttribute('aria-label', `${RES[k].name} : voir le détail`);
        el.innerHTML = `<span class="lbl"><i style="background:${RES[k].color}"></i>${RES[k].name}</span><strong></strong><span class="rate"></span>`;
        row.appendChild(el);
      }
    }
    for (const el of row.children) {
      const k = el.dataset.k, net = prod[k] - cons[k];
      el.classList.toggle('alert', !!(short[k] || (net < 0 && save.res[k] < -net)));
      el.classList.toggle('full', save.res[k] >= c * 0.99);
      el.querySelector('strong').textContent = fmt(Math.floor(save.res[k]));
      const r = el.querySelector('.rate');
      r.className = 'rate ' + (net > 0.05 ? 'up' : net < -0.05 ? 'down' : '');
      r.textContent = `${net > 0 ? '+' : ''}${fmt(net)}/j`;
    }
    $('cap-chip').innerHTML = `Réserves <strong>${fmt(c)}</strong>`;
    $('pop-chip').innerHTML = `${esc(era().name)} · <strong>${fmt(save.pop)}/${fmt(housing())}</strong> hab.`;
    const h = Math.round(save.happy);
    $('happy-chip').innerHTML = `Bonheur <strong style="color:${h >= 60 ? '#9fd46b' : h >= 35 ? '#e0a35a' : '#ef6b52'}">${h} %</strong>`;
    $('time-chip').innerHTML = `Jour ${save.day} · <strong>${season().name}</strong> · ${String(Math.floor(save.t * 24)).padStart(2, '0')} h`;
    renderSites();
  }
  function renderSpeed() { for (const b of document.querySelectorAll('.speed button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === save.speed)); }
  let sitesBuilt = '';
  function renderSites() {
    const open = sitesOpen();
    const sig = open.join() + save.view.site;
    if (sig === sitesBuilt) return;
    sitesBuilt = sig;
    const box = $('sites');
    box.hidden = open.length < 2;
    $('gather-hint').hidden = hintHidden || save.view.site !== 'terre';
    box.innerHTML = open.map((s) => `<button type="button" class="chip" data-site="${s}" aria-pressed="${s === save.view.site}">${esc(SITES[s].name)}</button>`).join('');
  }

  // ---------- Onglet Construire ----------
  let tab = 'build', buildFilter = 'all';
  const openEras = new Set();
  let lastOpenEra = 0;
  const CATS = ['Logement', 'Production', 'Stockage', 'Bonheur', 'Commerce', 'Merveille'];
  function renderBuild() {
    keepFocus(() => {
      const box = $('tab-build');
      box.innerHTML = `<p class="help">Touche « Construire », puis choisis une case sur la carte. Chaque bâtiment monte jusqu'au niveau 3 dans son ère, puis un niveau de plus à chaque ère suivante (5 au maximum) : il grandit et change d'allure.</p>
        <div class="row filters" role="group" aria-label="Filtrer">${['all', 'afford', ...CATS].map((f) => `<button type="button" class="chip" data-filter="${f}" aria-pressed="${buildFilter === f}">${{ all: 'Tout', afford: 'Abordables' }[f] || f}</button>`).join('')}</div>`;
      if (lastOpenEra !== save.era) { lastOpenEra = save.era; openEras.add(save.era); }
      for (const E of ERAS.filter((x) => x.n <= save.era + 1)) {
        const open = E.n <= save.era;
        const list = BUILDINGS.filter((b) => b.era === E.n && passes(b));
        if (!list.length) continue;
        const sec = document.createElement('details');
        sec.className = 'era-block';
        sec.open = openEras.has(E.n) || buildFilter !== 'all';
        sec.innerHTML = `<summary>${esc(E.name)}${E.site !== 'terre' ? ` <small>· ${esc(SITES[E.site].name)}</small>` : ''}${open ? '' : ' <small>· ère suivante</small>'}</summary>`;
        sec.addEventListener('toggle', () => { if (sec.open) { openEras.add(E.n); if (!sec.dataset.filled) fill(); } else openEras.delete(E.n); });
        const fill = () => { sec.dataset.filled = '1'; for (const b of list) sec.appendChild(buildCard(b)); };
        if (sec.open) fill();
        box.appendChild(sec);
      }
      for (const c of box.querySelectorAll('[data-filter]')) c.addEventListener('click', () => { buildFilter = c.dataset.filter; box.scrollTop = 0; renderBuild(); });
      if (buildFilter === 'afford' && !box.querySelector('.bld')) box.insertAdjacentHTML('beforeend', '<p class="help">Rien d\'abordable pour le moment. Regarde le Conseiller dans l\'onglet Outils.</p>');
    });
  }
  function passes(b) {
    if (buildFilter === 'all') return true;
    if (buildFilter === 'afford') { const it = bestUpgrade(b.id); return b.era <= save.era && ((!buildBlock(b) && canPay(newCost(b))) || (it && canPay(upCost(b, it)))); }
    return b.cat === buildFilter;
  }
  function buildCard(b) {
    const d = document.createElement('div');
    const block = buildBlock(b), c = newCost(b), up = bestUpgrade(b.id), uc = up ? upCost(b, up) : null;
    const locked = b.era > save.era;
    d.className = 'bld' + (locked ? ' locked' : '');
    const lv = instances(b.id).map((x) => x.l);
    const lvText = lv.length ? ` · niv. ${lv.join(', ')}` : '';
    const newTxt = block ? `<span>${esc(block)}</span>` : costHtml(c);
    const e1 = !block && !canPay(c) ? eta(c) : '';
    d.innerHTML = `<h3>${esc(b.name)} <small>${CNT[b.id]}/${b.max}${lvText}</small></h3>
      <p>${esc(effectText(b))}${b.lv === 1 ? '' : ' (par niveau)'}</p>
      <div class="cost">${newTxt}</div>${e1 ? `<p class="eta">${esc(e1)}</p>` : ''}
      ${up ? `<div class="cost up">Niveau ${up.l + 1} : ${costHtml(uc)}</div>` : ''}
      <div class="acts">
        <button type="button" id="b-${b.id}" ${block || !canPay(c) ? 'disabled' : ''}>${b.wonder ? 'Bâtir' : 'Construire'}</button>
        ${up ? `<button type="button" class="alt" id="u-${b.id}" ${canPay(uc) ? '' : 'disabled'}>Améliorer</button>` : ''}
        ${save.tools.file && !locked ? `<button type="button" class="ghost" id="q-${b.id}" aria-label="Ajouter ${esc(b.name)} à la file">+ File</button>` : ''}
      </div>`;
    d.querySelector(`#b-${b.id}`).addEventListener('click', () => startPlacing(b.id));
    if (up) d.querySelector(`#u-${b.id}`).addEventListener('click', () => { const it = bestUpgrade(b.id); if (it) { quietFx = false; upgrade(it); } });
    const q = d.querySelector(`#q-${b.id}`);
    if (q) q.addEventListener('click', () => {
      const kind = CNT[b.id] < b.max && findSpot(b) ? 'new' : 'up';
      if (kind === 'up' && !CNT[b.id]) { toast(`Plus de place pour ${b.name}.`); return; }
      queueAdd(kind, b.id); toast(`${b.name} : ${kind === 'new' ? 'construction' : 'amélioration'} ajoutée à la file (onglet Outils).`);
    });
    return d;
  }

  // ---------- Onglet Habitants ----------
  function renderPeople() {
    keepFocus(() => {
      const box = $('tab-people');
      const { prod, cons } = rates();
      const n = save.pop, idle = idleCount();
      const h = heatingNeed();
      let html = `<p class="help"><strong>${fmt(n)}</strong> habitants pour <strong>${fmt(housing())}</strong> lits · <strong>${fmt(idle)}</strong> sans métier. Chacun mange 1 et boit 1 par jour${save.era >= 3 ? ', et consomme 0,2 énergie' : ''}. En hiver il faut ${save.era >= 3 ? "de l'énergie" : 'du bois'} pour se chauffer.</p>
        <canvas class="spark" id="spark" aria-label="Population des 60 derniers jours"></canvas><div class="needs">`;
      const rows = [['food', 'Nourriture'], ['water', 'Eau'], [h.res || (save.era >= 3 ? 'energy' : 'wood'), 'Chauffage']];
      if (save.era >= 3) rows.push(['energy', 'Électricité']);
      for (const [k, label] of rows) {
        if (label === 'Chauffage' && !h.res) { html += `<div class="need"><span>${label}</span><span class="help">Seulement en hiver</span><span></span></div>`; continue; }
        const net = prod[k] - cons[k];
        const days = net < 0 ? save.res[k] / -net : Infinity;
        const pct = Math.min(100, (prod[k] / Math.max(0.01, cons[k])) * 100);
        html += `<div class="need"><span>${label}</span><span class="bar"><i style="width:${pct}%;background:${pct >= 100 ? '#9fd46b' : pct >= 70 ? '#e0a35a' : '#ef6b52'}"></i></span>
          <span class="${net >= 0 ? 'ok' : 'ko'}">${net >= 0 ? 'Assez' : days < 1 ? 'Manque !' : `${fmt(Math.floor(days))} j de réserve`}</span></div>`;
      }
      html += '</div><h3>Bonheur</h3><ul class="happy-list">';
      for (const [l, v] of happinessFactors()) html += `<li><span>${esc(l)}</span><span class="${v >= 0 ? 'p' : 'm'}">${v > 0 ? '+' : ''}${v}</span></li>`;
      html += `</ul><p class="help">Au-dessus de 45 %, de nouveaux habitants arrivent s'il reste des lits et des réserves. Sous 25 %, des habitants partent.</p>
        <div class="row between"><h3>Métiers</h3><button class="chip" type="button" id="auto-assign">Répartir automatiquement</button></div>`;
      box.innerHTML = html;
      $('auto-assign').addEventListener('click', () => autoAssign());
      const big = n >= 1000 ? 100 : n >= 100 ? 10 : n >= 20 ? 5 : 0;
      for (const j of JKEYS) {
        const J = JOBS[j], s = slots(j), cj = save.jobs[j] || 0;
        if (!jobUnlocked(j) || (!s && !cj)) continue;
        const d = document.createElement('div');
        d.className = 'job' + (big ? ' big' : '');
        const inputs = J.inputs ? ` (utilise ${Object.entries(J.inputs).map(([k, v]) => `${fmt(v)} ${RES[k].name.toLowerCase()}`).join(' + ')})` : '';
        d.innerHTML = `<span class="name">${esc(J.name)}<small>+${fmt(jobRate(j))} ${RES[J.res].name.toLowerCase()}/jour chacun${esc(inputs)}</small></span>
          ${big ? `<button type="button" id="j-${j}-mm" aria-label="Retirer ${big} ${esc(J.name.toLowerCase())}s" ${cj ? '' : 'disabled'}>−${big}</button>` : ''}
          <button type="button" id="j-${j}-m" aria-label="Retirer un ${esc(J.name.toLowerCase())}" ${cj ? '' : 'disabled'}>−</button>
          <span class="count">${fmt(cj)}/${fmt(s)}</span>
          <button type="button" id="j-${j}-p" aria-label="Ajouter un ${esc(J.name.toLowerCase())}" ${cj < s && idle ? '' : 'disabled'}>+</button>
          ${big ? `<button type="button" id="j-${j}-pp" aria-label="Ajouter ${big} ${esc(J.name.toLowerCase())}s" ${cj < s && idle ? '' : 'disabled'}>+${big}</button>` : ''}`;
        d.querySelector(`#j-${j}-m`).addEventListener('click', () => assign(j, -1));
        d.querySelector(`#j-${j}-p`).addEventListener('click', () => assign(j, 1));
        if (big) { d.querySelector(`#j-${j}-mm`).addEventListener('click', () => assign(j, -big)); d.querySelector(`#j-${j}-pp`).addEventListener('click', () => assign(j, big)); }
        box.appendChild(d);
      }
      drawSpark($('spark'), save.hist.length ? [...save.hist, save.pop] : [save.pop, save.pop], `Population · record ${fmt(save.stats.maxPop)}`, '#e0a35a');
    });
  }
  function drawSpark(cv, data, label, col) {
    if (!cv) return;
    const r = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 300, h = cv.clientHeight || 56;
    cv.width = w * r; cv.height = h * r;
    const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0);
    if (data.length < 2) data = [data[0] || 0, data[0] || 0];
    const max = Math.max(...data, 5);
    c.strokeStyle = col; c.lineWidth = 2; c.fillStyle = col + '2e';
    c.beginPath();
    data.forEach((v, i) => { const x = 4 + (i / (data.length - 1)) * (w - 8), y = h - 6 - (v / max) * (h - 20); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    c.lineTo(w - 4, h - 4); c.lineTo(4, h - 4); c.closePath(); c.fill();
    c.fillStyle = '#b9b59a'; c.font = '11px "Nunito Sans", system-ui, sans-serif';
    c.fillText(label, 6, 12);
  }

  // ---------- Onglet Progrès ----------
  function renderProgress() {
    keepFocus(() => {
      const box = $('tab-progress');
      box.innerHTML = '';
      const next = ERAS[save.era];
      const card = document.createElement('div');
      card.className = 'era-card';
      if (next) {
        const checks = gateChecks(next).map((c) => `<li class="${c.ok ? 'ok' : ''}">${esc(c.l)} : ${fmt(Math.min(c.v, c.g))}/${fmt(c.g)}</li>`).join('');
        card.innerHTML = `<p class="kicker">Ère actuelle : ${esc(era().name)}</p><h3>Prochaine ère : ${esc(next.name)}</h3>
          <ul class="checklist">${checks}</ul><div class="cost">${costHtml(next.gate.cost)}</div>
          <button type="button" id="era-up" ${eraReady() ? '' : 'disabled'}>Passer à l'ère ${esc(next.name)}</button>`;
        card.querySelector('button').addEventListener('click', eraUp);
      } else {
        card.innerHTML = `<p class="kicker">Ère actuelle</p><h3>${esc(era().name)}</h3><p class="help">${CNT.portail ? 'Le Portail galactique est ouvert. Clairval est une civilisation des étoiles.' : 'Dernière étape : bâtir le Portail galactique (un million d\'habitants).'}</p>`;
      }
      box.appendChild(card);
      const tl = document.createElement('ol');
      tl.className = 'timeline';
      tl.setAttribute('aria-label', 'Les 14 ères de Clairval');
      tl.innerHTML = ERAS.map((E) => `<li class="${E.n < save.era ? 'done' : E.n === save.era ? 'now' : ''}"><span>${E.n}</span>${esc(E.name)}</li>`).join('');
      box.appendChild(tl);
      const h = document.createElement('h3'); h.textContent = 'Améliorations'; box.appendChild(h);
      const techs = TECHS.filter((x) => x.era <= save.era).sort((a, b) => hasTech(a.id) - hasTech(b.id) || b.era - a.era);
      for (const t of techs) {
        const owned = hasTech(t.id);
        const d = document.createElement('div');
        d.className = 'bld' + (owned ? ' owned' : '');
        d.innerHTML = `<h3>${esc(t.name)} <small>${esc(ERAS[t.era - 1].name)}</small></h3><p>${esc(t.desc)}</p><div class="cost">${owned ? '<span>Acquise</span>' : costHtml(t.cost)}</div>
          <div class="acts"><button type="button" id="t-${t.id}" ${owned || !canPay(t.cost) ? 'disabled' : ''}>${owned ? 'Acquise' : 'Acheter'}</button></div>`;
        d.querySelector('button').addEventListener('click', () => buyTech(t.id));
        box.appendChild(d);
      }
      const locked = TECHS.filter((t) => t.era > save.era).length;
      if (locked) box.insertAdjacentHTML('beforeend', `<p class="help">${locked} améliorations se débloquent aux ères suivantes.</p>`);
      const h2 = document.createElement('h3'); h2.textContent = 'Objectifs'; box.appendChild(h2);
      const goals = GOALS.filter((x) => x.era <= save.era).sort((a, b) => !!save.claimed[a.id] - !!save.claimed[b.id]);
      for (const g of goals) {
        const v = Math.min(g.goal, g.get()), done = v >= g.goal, claimed = !!save.claimed[g.id];
        const d = document.createElement('div');
        d.className = 'goal' + (claimed ? ' done' : '');
        d.innerHTML = `<h3>${esc(g.text)}</h3><p>${fmt(v)}/${fmt(g.goal)} · Récompense : ${esc(costText(g.reward))}</p><div class="bar"><i style="width:${(v / g.goal) * 100}%"></i></div>
          <button type="button" id="g-${g.id}" ${done && !claimed ? '' : 'disabled'}>${claimed ? 'Reçu' : 'Réclamer'}</button>`;
        d.querySelector('button').addEventListener('click', () => claimGoal(g.id));
        box.appendChild(d);
      }
    });
  }

  // ---------- Onglet Outils ----------
  const mkt = { give: 'wood', get: 'stone', qty: 10 };
  let statRes = 'food';
  const openTools = new Set(['conseil']);
  function toolSection(id, title, html) {
    return `<details class="era-block" data-sec="${id}" ${openTools.has(id) ? 'open' : ''}><summary>${title}</summary>${html}</details>`;
  }
  function renderTools() {
    keepFocus(() => {
      const box = $('tab-tools');
      // Conseiller
      const tips = advice();
      let html = toolSection('conseil', 'Conseiller', `<p class="help">Ce qu'il faudrait faire maintenant. Un bouton le fait pour toi.</p>` + tips.map((t, i) => `<div class="tip"><p>${esc(t.text)}</p>${t.cost ? `<div class="cost">${costHtml(t.cost)}</div>` : ''}${t.label ? `<button type="button" id="tip-${i}" ${t.cost && !canPay(t.cost) ? 'disabled' : ''}>${esc(t.label)}</button>` : ''}</div>`).join(''));
      // Automatisations
      html += toolSection('auto', 'Automatisations', TOOLS.map((t) => {
        const owned = !!save.tools[t.id], lockedE = t.era > save.era;
        return `<div class="bld${owned ? ' owned' : ''}${lockedE ? ' locked' : ''}"><h3>${esc(t.name)} <small>${esc(ERAS[t.era - 1].name)}</small></h3><p>${esc(t.desc)}</p>
          <div class="cost">${owned ? '<span>Acquis</span>' : lockedE ? `<span>Ère ${esc(ERAS[t.era - 1].name)}</span>` : costHtml(t.cost)}</div>
          <div class="acts">${owned ? `<button type="button" class="alt" id="tt-${t.id}" aria-pressed="${save.toolsOn[t.id] !== false}">${save.toolsOn[t.id] !== false ? 'Activé' : 'Coupé'}</button>` : `<button type="button" id="tb-${t.id}" ${lockedE || !canPay(t.cost) ? 'disabled' : ''}>Acheter</button>`}</div></div>`;
      }).join(''));
      // File
      if (save.tools.file) {
        html += toolSection('file', `File de constructions (${save.queue.length})`, save.queue.length
          ? '<ol class="queue">' + save.queue.map((q, i) => { const b = BY_ID[q.id]; const it = q.kind === 'up' ? bestUpgrade(q.id) : null; const c = q.kind === 'new' ? newCost(b) : it ? upCost(b, it) : {}; return `<li><span>${q.kind === 'new' ? 'Construire' : 'Améliorer'} : ${esc(b.name)}<small>${esc(eta(c) || 'dès maintenant')}</small></span><button type="button" class="chip" id="qd-${i}" aria-label="Retirer de la file">Retirer</button></li>`; }).join('') + '</ol>'
          : '<p class="help">La file est vide. Dans l\'onglet Construire, touche « + File » sur un bâtiment.</p>');
      }
      // Statistiques
      const keys = hudOrder();
      if (!keys.includes(statRes)) statRes = 'food';
      const { prod, cons } = rates();
      const net = prod[statRes] - cons[statRes], c = cap(), v = save.res[statRes];
      const when = net > 0 ? (v >= c ? 'Réserve pleine' : `Pleine dans ${fmt(Math.ceil((c - v) / net))} j`) : net < 0 ? `Vide dans ${fmt(Math.floor(v / -net))} j` : 'Stable';
      html += toolSection('stats', 'Statistiques', `<label class="help" for="st-res">Ressource</label><select id="st-res">${keys.map((k) => `<option value="${k}" ${k === statRes ? 'selected' : ''}>${esc(RES[k].name)}</option>`).join('')}</select>
        <div class="stat-row"><span>Réserve<strong>${fmt(v)}/${fmt(c)}</strong></span><span>Production<strong class="p">+${fmt(prod[statRes])}</strong></span><span>Consommation<strong class="m">−${fmt(cons[statRes])}</strong></span><span>${esc(when)}<strong class="${net >= 0 ? 'p' : 'm'}">${net >= 0 ? '+' : ''}${fmt(net)}/j</strong></span></div>
        <canvas class="spark" id="st-chart" aria-label="Réserve des 40 derniers jours"></canvas>
        <ul class="happy-list">${breakdown(statRes).map(([l, x]) => `<li><span>${esc(l)}</span><span class="${x >= 0 ? 'p' : 'm'}">${x > 0 ? '+' : ''}${fmt(x)}</span></li>`).join('') || '<li><span>Rien ne produit ni ne consomme cette ressource.</span></li>'}</ul>`);
      // Marché
      const rk = unlockedRes();
      if (!rk.includes(mkt.give)) mkt.give = 'wood';
      if (!rk.includes(mkt.get)) mkt.get = 'stone';
      const opts = (sel) => rk.map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(RES[k].name)} (${fmt(Math.floor(save.res[k]))})</option>`).join('');
      const qt = tradeQuote(mkt.give, mkt.get, mkt.qty);
      const qs = [10, 100, 1000, 10000, 100000].filter((q, i) => i < 2 || q <= cap() / 2);
      html += toolSection('market', 'Marché', `<p class="help">${CNT.marche ? `Le marché donne de meilleurs taux et permet de vendre ou d'acheter contre de l'or.` : "Sans marché, les colporteurs troquent à 2 pour 1. Construis un marché (ère Ville) pour de meilleurs taux et pour l'or."}</p>
        <div class="trade"><label for="m-give">Je donne</label><select id="m-give">${opts(mkt.give)}</select><label for="m-get">Je reçois</label><select id="m-get">${opts(mkt.get)}</select></div>
        <div class="row" role="group" aria-label="Quantité">${qs.map((q) => `<button type="button" class="chip" id="m-q${q}" aria-pressed="${mkt.qty === q}">${fmt(q)}</button>`).join('')}</div>
        <p class="quote">${!qt ? 'Choisis deux ressources différentes.' : qt.err ? esc(qt.err) : `Tu donnes <strong>${fmt(qt.cost)} ${esc(RES[mkt.give].name.toLowerCase())}</strong>, tu reçois <strong>${fmt(qt.gain)} ${esc(RES[mkt.get].name.toLowerCase())}</strong>.`}</p>
        <button type="button" class="big-btn" id="m-go" ${qt && !qt.err && save.res[mkt.give] >= qt.cost ? '' : 'disabled'}>Échanger</button>`);
      // Vue
      html += toolSection('view', 'Vue', `<div class="row">
        <button type="button" class="chip" id="v-badges" aria-pressed="${!!save.view.badges}">Afficher les niveaux</button>
        <button type="button" class="chip" id="v-rot">Tourner la vue</button>
        <button type="button" class="chip" id="v-center">Recentrer</button></div>
        <p class="help">Sur la carte : fais glisser pour te déplacer, pince ou utilise + et − pour zoomer. Une flèche dorée signale un bâtiment que tu peux améliorer tout de suite.</p>`);
      box.innerHTML = html;
      for (const d of box.querySelectorAll('details[data-sec]')) d.addEventListener('toggle', () => { if (d.open) openTools.add(d.dataset.sec); else openTools.delete(d.dataset.sec); });
      tips.forEach((t, i) => { const b = $('tip-' + i); if (b) b.addEventListener('click', () => { quietFx = false; t.fn(); persist(); renderAll(); }); });
      for (const t of TOOLS) {
        const bb = $('tb-' + t.id); if (bb) bb.addEventListener('click', () => buyTool(t.id));
        const tt = $('tt-' + t.id); if (tt) tt.addEventListener('click', () => { save.toolsOn[t.id] = save.toolsOn[t.id] === false; persist(); renderTools(); });
      }
      save.queue.forEach((q, i) => { const b = $('qd-' + i); if (b) b.addEventListener('click', () => { save.queue.splice(i, 1); persist(); renderTools(); }); });
      $('st-res').addEventListener('change', (e) => { statRes = e.target.value; renderTools(); $('st-res').focus(); });
      drawSpark($('st-chart'), [...(save.rh[statRes] || []), Math.round(v)], `${RES[statRes].name} · 40 derniers jours`, RES[statRes].color);
      $('m-give').addEventListener('change', (e) => { mkt.give = e.target.value; renderTools(); $('m-give').focus(); });
      $('m-get').addEventListener('change', (e) => { mkt.get = e.target.value; renderTools(); $('m-get').focus(); });
      for (const q of qs) $(`m-q${q}`).addEventListener('click', () => { mkt.qty = q; renderTools(); });
      $('m-go').addEventListener('click', () => trade(mkt.give, mkt.get, mkt.qty));
      $('v-badges').addEventListener('click', () => { save.view.badges = !save.view.badges; persist(); renderTools(); });
      $('v-rot').addEventListener('click', rotateView);
      $('v-center').addEventListener('click', () => centerOnSite(save.view.site));
    });
  }
  function renderLog() {
    $('log').innerHTML = save.log.map((e) => `<li><small>Jour ${e.d}</small>${esc(e.text)}</li>`).join('') || "<li>Rien pour l'instant.</li>";
    $('last-save').textContent = lastSaved ? `Dernière sauvegarde automatique : ${agoText(lastSaved)}. Clairval se sauvegarde toutes les 10 secondes, après chaque action et quand tu quittes la page.` : 'Clairval se sauvegarde toutes les 10 secondes, après chaque action et quand tu quittes la page.';
    const list = readBackups();
    const box = $('backups');
    box.innerHTML = list.length
      ? list.map((b, i) => `<li><span>Jour ${b.day} · ${esc(ERAS[(b.era || 1) - 1].name)} · ${fmt(b.pop || 0)} hab.<small>${esc(agoText(b.ts))} · ${esc(b.reason || 'automatique')}</small></span><button type="button" class="chip" id="bk-${i}">Restaurer</button></li>`).join('')
      : '<li><span>Aucune pour l\'instant. La première sera faite après 5 minutes de jeu.</span></li>';
    list.forEach((b, i) => {
      const btn = $('bk-' + i);
      if (btn) btn.addEventListener('click', (e) => twoStep('bk' + i, e.currentTarget, 'Restaurer', 'Toucher encore pour revenir à ce moment', () => {
        try {
          const s = mergeSave(JSON.parse(b.data));
          makeBackup('avant restauration');
          loadSave(s); persist(true);
          toast(`Clairval est revenu au jour ${s.day}.`);
        } catch (err) { toast('Cette sauvegarde est illisible.'); }
      }));
    });
  }
  function renderBadges() {
    const idle = idleCount();
    const ib = $('idle-badge'); ib.hidden = !idle; ib.textContent = idle > 999 ? '999+' : idle;
    const g = GOALS.filter((x) => x.era <= save.era && goalDone(x) && !save.claimed[x.id]).length + (eraReady() ? 1 : 0);
    const gb = $('goal-badge'); gb.hidden = !g; gb.textContent = g;
    const tips = advice().filter((t) => t.label).length;
    const tb = $('tool-badge'); tb.hidden = !tips; tb.textContent = tips;
    for (const x of GOALS) {
      if (x.era <= save.era && goalDone(x) && !save.notified[x.id] && !save.claimed[x.id]) { save.notified[x.id] = true; toast(`Objectif atteint : ${x.text}. Réclame ta récompense (onglet Progrès).`); }
    }
  }
  function renderTab() {
    for (const b of document.querySelectorAll('.tabs button')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(on));
      $('tab-' + b.dataset.tab).hidden = !on;
    }
    ({ build: renderBuild, people: renderPeople, progress: renderProgress, tools: renderTools, log: renderLog })[tab]();
  }
  function renderAll() { needRender = false; renderHud(); renderTab(); renderBadges(); if (selected) renderInfo(); }

  // ---------- Placement d'un bâtiment ----------
  let placing = null;
  function startPlacing(id) {
    const b = BY_ID[id];
    if (buildBlock(b) || !canPay(newCost(b))) return;
    const spot = findSpot(b);
    if (!spot) { toast("Plus de place : passe à l'ère suivante pour agrandir le terrain."); return; }
    closeInfo();
    if (save.view.site !== b.site) { save.view.site = b.site; centerOnSite(b.site, true); }
    placing = { b, x: spot[0], y: spot[1] };
    setSheetMin(true);
    ui.placeBar.hidden = false;
    $('place-text').textContent = b.size === 2 ? `${b.name} : son terrain est réservé. Valide pour bâtir.` : `${b.name} : touche une case libre pour le déplacer, puis valide.`;
    $('place-cost').innerHTML = costHtml(newCost(b));
    focusTile(b.site, { x: spot[0], y: spot[1], id });
    $('place-ok').focus();
  }
  function stopPlacing() { placing = null; ui.placeBar.hidden = true; }
  function confirmPlacing() {
    if (!placing) return;
    const p = placing;
    stopPlacing();
    quietFx = false;
    const it = build(p.b.id, p.x, p.y);
    if (it) setSheetMin(false);
    else { toast(`Impossible de construire ${p.b.name} : ${buildBlock(p.b) || "il manque des ressources"}.`); setSheetMin(false); }
  }

  // ---------- Fiche d'un bâtiment ----------
  let selected = null;
  function openInfo(it) { selected = it; renderInfo(); ui.info.hidden = false; $('info-close').focus(); }
  function closeInfo() { selected = null; ui.info.hidden = true; }
  function renderInfo() {
    const it = selected;
    if (!it) return;
    const box = $('info-body');
    if (it.hub) {
      box.innerHTML = `<p class="kicker">${esc(SITES[it.site].name)}</p><h2>${esc(hubName(it.site))}</h2>
        <p class="help">${fmt(save.pop)} habitants · ${fmt(housing())} lits · bonheur ${Math.round(save.happy)} % · ère ${esc(era().name)}.</p>`;
      return;
    }
    const b = BY_ID[it.id], capL = levelCap(b), c = it.l < capL ? upCost(b, it) : null;
    box.innerHTML = `<p class="kicker">${esc(b.cat)} · ${esc(ERAS[b.era - 1].name)}</p><h2>${esc(b.name)}</h2>
      <p class="lv">${Array.from({ length: b.lv || 5 }, (_, i) => `<i class="${i < it.l ? 'on' : i < capL ? '' : 'lock'}"></i>`).join('')} <span>Niveau ${it.l}/${capL}${capL < (b.lv || 5) ? ` (${b.lv || 5} aux ères suivantes)` : ''}</span></p>
      <p class="help">Par niveau : ${esc(effectText(b))}.</p>
      ${c ? `<div class="cost">${costHtml(c)}</div>${canPay(c) ? '' : `<p class="eta">${esc(eta(c))}</p>`}` : `<p class="help">${it.l >= (b.lv || 5) ? 'Niveau maximum atteint.' : "Niveau maximum pour cette ère : la prochaine ère en débloque un de plus."}</p>`}
      <div class="acts">${c ? `<button type="button" id="i-up" ${canPay(c) ? '' : 'disabled'}>Améliorer au niveau ${it.l + 1}</button>` : ''}
      ${c && save.tools.file ? '<button type="button" class="ghost" id="i-q">+ File</button>' : ''}</div>`;
    if (c) $('i-up').addEventListener('click', () => { quietFx = true; upgrade(it); quietFx = false; renderInfo(); });
    const q = $('i-q');
    if (q) q.addEventListener('click', () => { queueAdd('up', it.id); toast(`Amélioration de ${b.name} ajoutée à la file.`); });
  }
  function hubName(site) {
    if (site !== 'terre') return { ocean: 'Port central', orbite: "Anneau d'amarrage", lune: 'Module de descente', mars: 'Base Ares', asteroides: 'Cœur de Vesta', soleil: "Flèche d'Hélios", anneau: "Place de l'Aurore", galaxie: 'Nexus' }[site];
    return save.era === 1 ? 'Feu de camp' : save.era === 2 ? 'Hôtel de ville' : save.era === 3 ? 'Hôtel de ville' : 'Capitole de Clairval';
  }

  // ---------- Panneau du bas ----------
  let sheetMin = false;
  function setSheetMin(v) {
    sheetMin = v;
    ui.sheet.classList.toggle('min', v);
    $('sheet-toggle').setAttribute('aria-expanded', String(!v));
    $('sheet-toggle').textContent = v ? 'Ouvrir le panneau' : 'Réduire le panneau';
    setTimeout(resize, 260);
  }

  // =====================================================================
  // Monde isométrique
  // =====================================================================
  const TW = 64, TH = 32;
  let SW = 0, SH = 0, dpr = 1, zoom = 0.8, zoomT = 0.8, camX = 0, camY = 0, camTX = 0, camTY = 0, viewCY = 200;
  let time = 0, L = 1, lights = [], hitboxes = [], anims = [], sparks = [], floats = [];
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    SW = r.width; SH = r.height;
    for (const c of [canvas, dark]) { c.width = Math.round(SW * dpr); c.height = Math.round(SH * dpr); }
    const top = document.querySelector('.hud').offsetHeight;
    const sheetTop = ui.sheet.getBoundingClientRect().top - r.top;
    viewCY = (top + Math.min(SH, sheetTop)) / 2 + 10;
  }
  window.addEventListener('resize', resize);

  const rot = () => save.view.rot || 0;
  function rotC(site, x, y) { const n = SITES[site].n; switch (rot()) { case 1: return [n - y, x]; case 2: return [n - x, n - y]; case 3: return [y, n - x]; default: return [x, y]; } }
  function unrotC(site, X, Y) { const n = SITES[site].n; switch (rot()) { case 1: return [Y, n - X]; case 2: return [n - X, n - Y]; case 3: return [n - Y, X]; default: return [X, Y]; } }
  function isoXY(site, x, y) { const [X, Y] = rotC(site, x, y); return [(X - Y) * TW / 2, (X + Y) * TH / 2]; }
  const depthOf = (site, x, y) => { const [X, Y] = rotC(site, x, y); return X + Y + X * 0.001; };
  const toScreen = (wx, wy) => [SW / 2 + (wx - camX) * zoom, viewCY + (wy - camY) * zoom];
  function screenToGrid(site, sx, sy) {
    const wx = (sx - SW / 2) / zoom + camX, wy = (sy - viewCY) / zoom + camY;
    const X = (wx / (TW / 2) + wy / (TH / 2)) / 2, Y = (wy / (TH / 2) - wx / (TW / 2)) / 2;
    return unrotC(site, X, Y);
  }
  function fitZoom(site) {
    const n = site === 'terre' ? 2 * siteR(site) + 3 : SITES[site].n + 1;
    return clamp((SW / (n * TW)) * 1.45, 0.4, 1.6);
  }
  function centerOnSite(site, instant) {
    const n = SITES[site].n;
    const [wx, wy] = isoXY(site, n / 2, n / 2);
    camTX = wx; camTY = wy - 16; zoomT = fitZoom(site);
    if (instant) { camX = camTX; camY = camTY; zoom = zoomT; }
  }
  function focusTile(site, it) {
    const b = BY_ID[it.id], s = b ? b.size || 1 : 1;
    const [wx, wy] = isoXY(site, it.x + s / 2, it.y + s / 2);
    camTX = wx; camTY = wy - 24 * s; zoomT = Math.max(zoomT, 0.95);
  }
  function clampCam() {
    const n = SITES[save.view.site].n;
    camTX = clamp(camTX, (-n * TW) / 2, (n * TW) / 2);
    camTY = clamp(camTY, -60, n * TH + 20);
  }
  function rotateView() {
    const site = save.view.site;
    const [gx, gy] = screenToGrid(site, SW / 2, viewCY);
    save.view.rot = (rot() + 1) % 4;
    const [wx, wy] = isoXY(site, gx, gy);
    camTX = camX = wx; camTY = camY = wy;
    persist();
  }

  // ---------- Couleurs ----------
  const colCache = new Map();
  const parseCol = (c) => (c[0] === '#' ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number));
  function mix(a, b, t) {
    const key = a + b + Math.round(t * 50);
    let v = colCache.get(key);
    if (!v) { const pa = parseCol(a), pb = parseCol(b); v = `rgb(${pa.map((x, i) => Math.round(x + (pb[i] - x) * t)).join(',')})`; if (colCache.size > 4000) colCache.clear(); colCache.set(key, v); }
    return v;
  }
  const shade = (c, f) => (f >= 0 ? mix(c, '#ffffff', f) : mix(c, '#000000', -f));
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------- Primitives isométriques ----------
  // P : point au-dessus du sol, u le long de l'axe x de la grille, v de l'axe y, h la hauteur
  let bbTop = 0;
  function P(cx, cy, u, v, h) { const y = cy + ((u + v) * TH) / 2 - h; if (y < bbTop) bbTop = y; return [cx + ((u - v) * TW) / 2, y]; }
  function poly(pts, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); }
  function glow(x, y, r, color) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circle(x, y, r); }
  function light(wx, wy, r, a) { const [sx, sy] = toScreen(wx, wy); const rr = r * zoom; if (sx > -rr && sx < SW + rr && sy > -rr && sy < SH + rr) lights.push({ x: sx, y: sy, r: rr, a }); }
  function box(cx, cy, a, b, h0, h1, col, top) {
    poly([P(cx, cy, -a, b, h0), P(cx, cy, a, b, h0), P(cx, cy, a, b, h1), P(cx, cy, -a, b, h1)], col);
    poly([P(cx, cy, a, b, h0), P(cx, cy, a, -b, h0), P(cx, cy, a, -b, h1), P(cx, cy, a, b, h1)], shade(col, -0.22));
    poly([P(cx, cy, -a, -b, h1), P(cx, cy, a, -b, h1), P(cx, cy, a, b, h1), P(cx, cy, -a, b, h1)], top || shade(col, 0.14));
  }
  function flat(cx, cy, a, b, h, col) { poly([P(cx, cy, -a, -b, h), P(cx, cy, a, -b, h), P(cx, cy, a, b, h), P(cx, cy, -a, b, h)], col); }
  function gable(cx, cy, a, b, h, rh, col, wall) {
    const o = 0.04;
    poly([P(cx, cy, -a - o, -b - o, h), P(cx, cy, a + o, -b - o, h), P(cx, cy, a + o, 0, h + rh), P(cx, cy, -a - o, 0, h + rh)], shade(col, -0.12));
    poly([P(cx, cy, a, b, h), P(cx, cy, a, -b, h), P(cx, cy, a, 0, h + rh)], shade(wall || col, -0.22));
    poly([P(cx, cy, -a - o, b + o, h), P(cx, cy, a + o, b + o, h), P(cx, cy, a + o, 0, h + rh), P(cx, cy, -a - o, 0, h + rh)], col);
    if (winter() && save.view.site === 'terre') {
      ctx.globalAlpha = 0.85;
      poly([P(cx, cy, -a - o, b * 0.4, h + rh * 0.6), P(cx, cy, a + o, b * 0.4, h + rh * 0.6), P(cx, cy, a + o, 0, h + rh), P(cx, cy, -a - o, 0, h + rh)], '#f4f8fb');
      ctx.globalAlpha = 1;
    }
  }
  function pyr(cx, cy, a, b, h, rh, col) {
    const t = P(cx, cy, 0, 0, h + rh);
    poly([P(cx, cy, -a, b, h), P(cx, cy, a, b, h), t], col);
    poly([P(cx, cy, a, b, h), P(cx, cy, a, -b, h), t], shade(col, -0.25));
  }
  function cyl(cx, cy, r, h0, h1, col, top) {
    const rx = (r * TW) / Math.SQRT2, ry = (r * TH) / Math.SQRT2;
    const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    g.addColorStop(0, shade(col, 0.08)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.3));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.ellipse(cx, cy - h0, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, cy - h1);
    ctx.ellipse(cx, cy - h1, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = top || shade(col, 0.18); ctx.beginPath(); ctx.ellipse(cx, cy - h1, rx, ry, 0, 0, TAU); ctx.fill();
    bbTop = Math.min(bbTop, cy - h1 - ry);
  }
  function dome(cx, cy, r, h, col, alpha) {
    const rx = (r * TW) / Math.SQRT2, ry = (r * TH) / Math.SQRT2;
    ctx.globalAlpha = alpha || 1;
    const g = ctx.createRadialGradient(cx - rx * 0.35, cy - h - rx * 0.6, 1, cx, cy - h, rx * 1.1);
    g.addColorStop(0, shade(col, 0.5)); g.addColorStop(1, shade(col, -0.2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - h, rx, rx * 0.95, 0, Math.PI, 0); ctx.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI); ctx.fill();
    ctx.globalAlpha = 1;
    bbTop = Math.min(bbTop, cy - h - rx);
  }
  // fenêtres sur la face avant gauche (v = b) ou avant droite (u = a)
  function wins(cx, cy, side, a, b, h0, h1, cols, rows, seed, dayCol, nightCol) {
    const len = side === 'L' ? a : b;
    const du = (2 * len) / cols, dh = (h1 - h0) / rows;
    const night = L < 0.5;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = night && rnd(seed * 97 + r * 13 + c) < 0.62;
      const s0 = -len + c * du + du * 0.22, s1 = s0 + du * 0.56, z0 = h0 + r * dh + dh * 0.28, z1 = z0 + dh * 0.5;
      const pts = side === 'L'
        ? [P(cx, cy, s0, b, z0), P(cx, cy, s1, b, z0), P(cx, cy, s1, b, z1), P(cx, cy, s0, b, z1)]
        : [P(cx, cy, a, -s0, z0), P(cx, cy, a, -s1, z0), P(cx, cy, a, -s1, z1), P(cx, cy, a, -s0, z1)];
      poly(pts, on ? nightCol || '#ffd27a' : night ? 'rgba(20,24,36,0.85)' : dayCol || '#2a3140');
    }
  }
  function door(cx, cy, a, b, col) { const w = 0.07; poly([P(cx, cy, a * 0.1 - w, b, 0), P(cx, cy, a * 0.1 + w, b, 0), P(cx, cy, a * 0.1 + w, b, 8), P(cx, cy, a * 0.1 - w, b, 8)], col || '#3a2618'); }
  function smoke(x, y, n, col) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const ph = (time * 0.3 + k / n) % 1;
      ctx.globalAlpha = 0.45 * (1 - ph);
      ctx.fillStyle = col || '#e8e8ee';
      circle(x + Math.sin(ph * 6 + k) * 3, y - ph * 30, 2.2 + ph * 5);
    }
    ctx.globalAlpha = 1;
  }
  function flag(x, y, h, col) {
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    const w = reduced ? 0 : Math.sin(time * 5 + x) * 1.5;
    poly([[x, y - h], [x + 9, y - h + 2 + w], [x, y - h + 5]], col);
    bbTop = Math.min(bbTop, y - h);
  }
  function star(x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  // petits habitants (dessinés à plat, avec une ombre)
  function person(x, y, col, t) {
    const bob = reduced ? 0 : Math.abs(Math.sin(t * 8)) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, 3, 1.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(x - 1.8, y - 7 - bob, 3.6, 5.5);
    ctx.fillStyle = '#f0c8a0'; circle(x, y - 8.6 - bob, 1.9);
  }

  // ---------- Décor de fond ----------
  function dayLight(t) {
    if (t < 0.18 || t > 0.86) return 0;
    if (t < 0.28) return (t - 0.18) / 0.1;
    if (t > 0.76) return (0.86 - t) / 0.1;
    return 1;
  }
  const isSpace = (site) => !!SITES[site].space;
  const terraLevel = () => { const it = save.map.mars.find((x) => x.id === 'terraformeur'); return it ? it.l : 0; };
  function skyStars(n, alpha) {
    for (let i = 0; i < n; i++) {
      const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(time * 2 + i);
      ctx.globalAlpha = alpha * tw;
      ctx.fillStyle = i % 7 ? '#ffffff' : '#ffe8c0';
      ctx.fillRect(rnd(i) * SW, rnd(i + 99) * SH * 0.9, i % 5 ? 1.2 : 2, i % 5 ? 1.2 : 2);
    }
    ctx.globalAlpha = 1;
  }
  function drawBackground(site) {
    const se = season();
    let g;
    if (site === 'terre' || site === 'ocean' || site === 'mars') {
      let top, bot;
      if (site === 'mars') { const t = terraLevel() / 5; top = mix('#b86a4a', '#5a9ad8', t); bot = mix('#e8b890', '#cfe6f2', t); }
      else { top = se.sky[0]; bot = se.sky[1]; }
      const dusk = L > 0 && L < 1 ? 1 - Math.abs(L - 0.5) * 2 : 0;
      g = ctx.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, mix('#0a1024', top, L));
      g.addColorStop(0.7, mix(mix('#1a2040', bot, L), '#f0a060', dusk * 0.5));
      g.addColorStop(1, mix('#101828', bot, L));
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
      if (L < 0.7) skyStars(80, 1 - L / 0.7);
      // soleil ou lune
      const ang = save.t * TAU - Math.PI / 2;
      const sx = SW / 2 + Math.cos(ang) * SW * 0.45, sy = SH * 0.55 + Math.sin(ang) * SH * 0.45;
      if (L > 0.05) glow(sx, sy, 60, 'rgba(255,240,190,0.9)');
      else { ctx.fillStyle = '#f0ecd8'; circle(SW - sx, SH * 0.25, 9); }
      if (site === 'mars' && !reduced) { ctx.fillStyle = '#c8b8a8'; circle(SW * 0.2, SH * 0.18, 4); }
      // relief lointain
      ctx.fillStyle = site === 'mars' ? mix('#3a1a10', mix('#8a4a30', '#4a7a4a', terraLevel() / 5), L) : site === 'ocean' ? mix('#0a1a2a', '#2a6a8a', L) : mix('#16221a', '#6a8aa0', L * 0.8);
      ctx.beginPath(); ctx.moveTo(0, SH);
      for (let x = 0; x <= SW; x += 20) ctx.lineTo(x, SH * 0.42 - (site === 'ocean' ? 0 : Math.sin(x * 0.013) * 22 + Math.sin(x * 0.041) * 9 + 18));
      ctx.lineTo(SW, SH); ctx.fill();
      if (site === 'ocean') {
        ctx.fillStyle = mix('#0a1830', '#2f7fa8', L); ctx.fillRect(0, SH * 0.42, SW, SH);
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.2 * L})`; ctx.lineWidth = 1;
        for (let i = 0; i < 40; i++) { const x = (rnd(i) * SW + time * 8 * (1 + rnd(i + 3))) % SW, y = SH * 0.45 + rnd(i + 7) * SH * 0.55; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y); ctx.stroke(); }
      }
      if (site === 'terre' && L > 0.3 && !reduced) {
        ctx.fillStyle = `rgba(255,255,255,${0.55 * L})`;
        for (let i = 0; i < 5; i++) {
          const x = ((rnd(i) * SW + time * (4 + i)) % (SW + 160)) - 80, y = 40 + rnd(i + 5) * SH * 0.25;
          circle(x, y, 16); circle(x + 16, y - 6, 18); circle(x + 34, y, 14);
        }
      }
      return;
    }
    // espace
    const palettes = {
      orbite: ['#02040c', '#0a1430'], lune: ['#040406', '#101018'], asteroides: ['#06040c', '#1a1026'],
      soleil: ['#1a0a02', '#401a04'], anneau: ['#020818', '#0a2040'], galaxie: ['#0a0418', '#2a0a40'],
    }[site];
    g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, palettes[0]); g.addColorStop(1, palettes[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    skyStars(140, 0.9);
    if (site === 'orbite') {
      const r = SW * 1.3;
      const eg = ctx.createRadialGradient(SW / 2, SH + r * 0.72, r * 0.8, SW / 2, SH + r * 0.72, r * 1.05);
      eg.addColorStop(0, '#1a5a9a'); eg.addColorStop(0.92, '#3a8ad0'); eg.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = eg; circle(SW / 2, SH + r * 0.72, r * 1.05);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 6; i++) { const x = ((rnd(i) * SW + time * 3) % (SW + 200)) - 100; circle(x, SH - 40 + rnd(i + 2) * 30, 20 + rnd(i) * 20); }
    } else if (site === 'lune') {
      ctx.fillStyle = '#3a7ad0'; circle(SW * 0.78, SH * 0.2, 18); ctx.fillStyle = 'rgba(255,255,255,0.5)'; circle(SW * 0.775, SH * 0.195, 7);
      glow(SW * 0.78, SH * 0.2, 34, 'rgba(90,160,255,0.35)');
    } else if (site === 'asteroides') {
      for (let i = 0; i < 12; i++) { const x = ((rnd(i) * SW + time * (2 + rnd(i) * 4)) % (SW + 60)) - 30, y = rnd(i + 20) * SH * 0.7; ctx.fillStyle = '#4a4050'; circle(x, y, 3 + rnd(i + 4) * 8); }
    } else if (site === 'soleil') {
      glow(SW * 0.2, SH * 0.12, SW * 0.7, 'rgba(255,200,80,0.8)'); ctx.fillStyle = '#fff4c0'; circle(SW * 0.2, SH * 0.12, 40);
      for (let i = 0; i < 40; i++) { const a = time * 0.1 + i * 0.4, rr = 70 + (i % 5) * 18; ctx.fillStyle = '#ffd070'; ctx.fillRect(SW * 0.2 + Math.cos(a) * rr * 1.6, SH * 0.12 + Math.sin(a) * rr * 0.5, 2, 2); }
    } else if (site === 'anneau') {
      ctx.strokeStyle = 'rgba(160,220,160,0.7)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(SW / 2, SH * 0.1, SW * 0.9, SH * 0.35, -0.15, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,180,255,0.4)'; ctx.lineWidth = 3; ctx.stroke();
      glow(SW * 0.85, SH * 0.08, 50, 'rgba(255,250,220,0.9)');
    } else if (site === 'galaxie') {
      for (let i = 0; i < 300; i++) { const a = i * 0.21 + time * 0.02, rr = i * 0.9; ctx.fillStyle = i % 3 ? 'rgba(200,160,255,0.6)' : 'rgba(120,220,255,0.7)'; ctx.fillRect(SW * 0.5 + Math.cos(a) * rr * 1.4, SH * 0.2 + Math.sin(a) * rr * 0.4, 1.5, 1.5); }
      glow(SW * 0.5, SH * 0.2, 60, 'rgba(255,220,255,0.6)');
    }
  }

  // ---------- Sol ----------
  function groundColors(site) {
    if (site === 'terre') { const se = season(); return [se.grass, se.grass2]; }
    if (site === 'mars') { const t = terraLevel() / 5; return [mix(SITES.mars.ground[0], '#6a9a4a', t), mix(SITES.mars.ground[1], '#629248', t)]; }
    return SITES[site].ground;
  }
  function roadColor(site) {
    if (site !== 'terre') return SITES[site].road;
    return ['#a8895a', '#8f8a82', '#4d5058', '#50565e', '#3e4452', '#3e4452'][Math.min(save.era, 6) - 1];
  }
  function tilePoly(site, x, y, inset) {
    const i = inset || 0;
    const a = isoXY(site, x + i, y + i), b = isoXY(site, x + 1 - i, y + i), c = isoXY(site, x + 1 - i, y + 1 - i), d = isoXY(site, x + i, y + 1 - i);
    return [a, b, c, d];
  }
  function drawSlab(site) {
    const n = SITES[site].n, D = site === 'ocean' ? 10 : 46;
    // les deux bords visibles après rotation : coins avant gauche, bas et droite
    const corners = [[0, 0], [n, 0], [n, n], [0, n]].map(([x, y]) => isoXY(site, x, y));
    const byY = corners.map((p, i) => ({ p, i })).sort((a, b) => b.p[1] - a.p[1]);
    const bottom = byY[0].p;
    const left = corners.reduce((a, p) => (p[0] < a[0] ? p : a));
    const right = corners.reduce((a, p) => (p[0] > a[0] ? p : a));
    let top, mid2, deep;
    if (site === 'terre') { top = season().id === 'hiver' ? '#e6edf1' : '#5a8a3a'; mid2 = '#7a5a3a'; deep = '#4a3626'; }
    else if (site === 'ocean') { top = '#b8b2a0'; mid2 = '#8a8a8a'; deep = '#5a5f66'; }
    else if (site === 'mars') { top = '#a85a36'; mid2 = '#8a4a2e'; deep = '#5a2e1c'; }
    else { top = shade(SITES[site].edge, 0.2); mid2 = SITES[site].edge; deep = shade(SITES[site].edge, -0.35); }
    const face = (p1, p2, dk) => {
      const g = ctx.createLinearGradient(0, p1[1], 0, p1[1] + D);
      g.addColorStop(0, top); g.addColorStop(0.15, dk ? shade(mid2, -0.15) : mid2); g.addColorStop(1, dk ? shade(deep, -0.2) : deep);
      poly([p1, p2, [p2[0], p2[1] + D], [p1[0], p1[1] + D]], g);
    };
    face(left, bottom, false); face(bottom, right, true);
    if (site === 'terre') {
      ctx.strokeStyle = 'rgba(40,28,18,0.35)'; ctx.lineWidth = 1;
      for (const k of [0.45, 0.72]) { ctx.beginPath(); ctx.moveTo(left[0], left[1] + D * k); ctx.lineTo(bottom[0], bottom[1] + D * k); ctx.lineTo(right[0], right[1] + D * k); ctx.stroke(); }
    }
    if (isSpace(site)) {
      for (let i = 1; i < 8; i++) {
        const t = i / 8, on = !reduced && Math.sin(time * 3 + i) > 0.3;
        ctx.fillStyle = on ? '#9ad8ff' : '#2a3a4a';
        const p = [left[0] + (bottom[0] - left[0]) * t, left[1] + (bottom[1] - left[1]) * t + D * 0.5];
        circle(p[0], p[1], 1.6);
      }
    }
  }
  function drawTiles(site) {
    const n = SITES[site].n, [g1, g2] = groundColors(site), road = roadColor(site);
    const E = save.era;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = tileKind(site, x, y), inside = inZone(site, x, y);
      const [cxw, cyw] = isoXY(site, x + 0.5, y + 0.5);
      const [sx, sy] = toScreen(cxw, cyw);
      if (sx < -TW * zoom || sx > SW + TW * zoom || sy < -TH * zoom * 2 || sy > SH + TH * zoom * 2) continue;
      const pts = tilePoly(site, x, y);
      let col;
      if (k === 'water' || k === 'bridge') col = mix('#0f2a3e', '#3a8ab8', 0.3 + 0.7 * L);
      else if (k === 'road') col = road;
      else col = (x + y) % 2 ? g1 : g2;
      if (!inside && k !== 'water' && k !== 'bridge') col = mix(col, '#1a2418', 0.35);
      poly(pts, col);
      if (k === 'water' && !reduced) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        const ph = (time * 0.4 + x * 0.3) % 1;
        ctx.beginPath(); ctx.moveTo(cxw - 10 + ph * 8, cyw - 2); ctx.lineTo(cxw - 2 + ph * 8, cyw - 2); ctx.stroke();
      }
      if (k === 'bridge') {
        const plank = site === 'terre' && E <= 2 ? '#8a6038' : E <= 4 ? '#9a9a96' : '#6a7686';
        poly(tilePoly(site, x, y, 0.08), plank);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
        const [ax, ay] = isoXY(site, x + 0.08, y + 0.5), [bx, by] = isoXY(site, x + 0.92, y + 0.5);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      if (k === 'road' && inside) {
        const h = (x - mid(site)) % 4 === 0, v = (y - mid(site)) % 4 === 0;
        if (site === 'terre' && E === 2) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 4; i++) circle(cxw + (rnd(x * 7 + y + i) - 0.5) * 30, cyw + (rnd(x + y * 7 + i) - 0.5) * 12, 1.4); }
        if ((site === 'terre' && E >= 3) || isSpace(site)) {
          ctx.strokeStyle = site === 'terre' && E >= 5 ? `rgba(120,220,255,${0.5 + 0.4 * (1 - L)})` : site === 'terre' ? 'rgba(240,230,200,0.6)' : 'rgba(150,210,255,0.5)';
          ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]); ctx.beginPath();
          if (h && !v) { const [ax, ay] = isoXY(site, x + 0.5, y), [bx, by] = isoXY(site, x + 0.5, y + 1); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
          if (v && !h) { const [ax, ay] = isoXY(site, x, y + 0.5), [bx, by] = isoXY(site, x + 1, y + 0.5); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
          ctx.stroke(); ctx.setLineDash([]);
        }
      }
    }
    // limite du terrain constructible
    if (site === 'terre') {
      const m = mid(site), r = siteR(site);
      const c = [[m - r, m - r], [m + r + 1, m - r], [m + r + 1, m + r + 1], [m - r, m + r + 1]].map(([x, y]) => isoXY(site, x, y));
      ctx.strokeStyle = 'rgba(243,234,211,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
      ctx.beginPath(); c.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // ---------- Nature (arbres, rochers, buissons, minerai) ----------
  function drawNature(x, y, nat, cx, cy, dim) {
    const se = season(), k = nat.kind, h = hash(x, y, 3);
    if (dim) ctx.globalAlpha = 0.75;
    if (k === 'tree') {
      const shake = nat.shake && time - nat.shake < 0.3 ? Math.sin(time * 60) * 1.5 : 0;
      if (nat.hp <= 0) { box(cx, cy, 0.07, 0.07, 0, 4, '#6a4a2e'); ctx.globalAlpha = 1; return; }
      const conifer = h < 0.35, s = 0.8 + h * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 12 * s, 5 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(cx - 1.8 + shake, cy - 10 * s, 3.6, 10 * s);
      if (conifer) {
        const c1 = se.id === 'hiver' ? '#2e5a3e' : '#2f6a3a';
        for (let i = 0; i < 3; i++) poly([[cx - (12 - i * 3) * s + shake, cy - (8 + i * 9) * s], [cx + (12 - i * 3) * s + shake, cy - (8 + i * 9) * s], [cx + shake, cy - (24 + i * 9) * s]], i % 2 ? shade(c1, 0.1) : c1);
        if (se.id === 'hiver') { ctx.fillStyle = '#f4f8fb'; circle(cx + shake, cy - 40 * s, 3); }
        bbTop = Math.min(bbTop, cy - 44 * s);
      } else if (se.leaf) {
        ctx.fillStyle = se.leaf[0]; circle(cx - 5 * s + shake, cy - 16 * s, 8 * s); circle(cx + 5 * s + shake, cy - 17 * s, 8 * s);
        ctx.fillStyle = se.leaf[1]; circle(cx + shake, cy - 24 * s, 9 * s);
        if (se.id === 'printemps') { ctx.fillStyle = '#ffd6e6'; for (let i = 0; i < 4; i++) circle(cx - 6 + rnd(x + i) * 12 + shake, cy - 28 * s + rnd(y + i) * 14, 1.4); }
        bbTop = Math.min(bbTop, cy - 34 * s);
      } else {
        ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(cx, cy - 10 * s); ctx.lineTo(cx - 7, cy - 22 * s); ctx.moveTo(cx, cy - 12 * s); ctx.lineTo(cx + 6, cy - 24 * s); ctx.moveTo(cx, cy - 10 * s); ctx.lineTo(cx, cy - 26 * s); ctx.stroke();
        ctx.fillStyle = '#f4f8fb'; circle(cx - 6, cy - 22 * s, 1.6); circle(cx + 6, cy - 24 * s, 1.6);
        bbTop = Math.min(bbTop, cy - 28 * s);
      }
    } else if (k === 'rock' || k === 'ore') {
      const s = nat.hp <= 0 ? 0.45 : 0.7 + (nat.hp / NAT_HP[k]) * 0.4;
      const col = k === 'ore' ? '#7a6a62' : '#9a9aa6';
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 13 * s, 5 * s, 0, 0, TAU); ctx.fill();
      poly([[cx - 12 * s, cy + 1], [cx - 8 * s, cy - 9 * s], [cx + 1, cy - 13 * s], [cx + 10 * s, cy - 6 * s], [cx + 12 * s, cy + 1]], col);
      poly([[cx + 1, cy - 13 * s], [cx + 10 * s, cy - 6 * s], [cx + 12 * s, cy + 1], [cx + 2, cy + 2]], shade(col, -0.2));
      if (k === 'ore') { ctx.fillStyle = save.era >= 2 ? '#e08a4a' : '#8a6a5a'; for (let i = 0; i < 4; i++) circle(cx - 6 * s + rnd(x + i) * 12 * s, cy - 8 * s + rnd(y + i) * 7 * s, 1.5); }
      if (winter()) { ctx.fillStyle = 'rgba(244,248,251,0.9)'; poly([[cx - 8 * s, cy - 9 * s], [cx + 1, cy - 13 * s], [cx + 10 * s, cy - 6 * s], [cx, cy - 8 * s]], '#f4f8fb'); }
      bbTop = Math.min(bbTop, cy - 14 * s);
    } else if (k === 'bush') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 10, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = se.id === 'hiver' ? '#8a9a8a' : se.id === 'automne' ? '#8a7a3a' : '#3f7a34';
      circle(cx - 5, cy - 5, 6); circle(cx + 5, cy - 5, 6); circle(cx, cy - 9, 6);
      ctx.fillStyle = '#d8364a';
      for (let i = 0; i < nat.hp; i++) circle(cx - 6 + rnd(i * 3 + x) * 12, cy - 11 + rnd(i * 5 + y) * 9, 1.6);
      bbTop = Math.min(bbTop, cy - 15);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Bâtiments : une fonction de dessin par forme, qui évolue avec le niveau ----------
  const ERA_WALL = [null, '#d8c09a', '#b5654a', '#8a96a6', '#e8ece4', '#5a7a9a', '#d8c8a0', '#eef2f4', '#d8dde6', '#c8c8cc', '#e8d8c8', '#5a5068', '#e0c070', '#e8f0e0', '#c8c0f0'];
  const ERA_ACC = [null, '#8a4a2e', '#6a3a2a', '#4a4f58', '#4a9a4a', '#2ac0ff', '#9fd46b', '#2a8aaa', '#6a9aff', '#ffd29a', '#c0673e', '#d08aff', '#ffb030', '#7affd8', '#b08aff'];
  const wallOf = (b) => b.wall || ERA_WALL[b.era];
  const accOf = (b) => ERA_ACC[b.era];
  const NIGHT = () => L < 0.5;
  function lamp(x, y, h) {
    ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    ctx.fillStyle = NIGHT() ? '#ffe0a0' : '#8a8a80'; circle(x, y - h, 1.8);
    if (NIGHT()) light(x, y - h, 20, 0.8);
  }
  function tree(x, y, s, col) {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 1, y - 6 * s, 2, 6 * s);
    const se = season();
    ctx.fillStyle = col || (se.leaf ? se.leaf[0] : '#8a9a8a'); circle(x, y - 9 * s, 5 * s);
    bbTop = Math.min(bbTop, y - 14 * s);
  }
  function crates(cx, cy, n, cols) {
    for (let i = 0; i < n; i++) {
      const u = -0.38 + (i % 3) * 0.13, v = 0.36, h = Math.floor(i / 3) * 5;
      box(cx, cy, 0.05, 0.05, h, h + 5, cols[i % cols.length]);
      void u;
    }
  }
  const R = {};
  R.house = (b, it, cx, cy, l) => {
    const wall = l >= 4 ? '#e8d8b8' : '#d8c09a', roof = l >= 3 ? '#9a4a36' : '#8a5a36';
    const a = 0.26 + l * 0.03, bb = 0.22 + l * 0.02, h = l >= 3 ? 22 : 12 + l * 2;
    if (l >= 2) { ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1; const p1 = P(cx, cy, -0.45, 0.45, 0), p2 = P(cx, cy, 0.45, 0.45, 0), p3 = P(cx, cy, 0.45, -0.45, 0); for (const k of [2, 4]) { ctx.beginPath(); ctx.moveTo(p1[0], p1[1] - k); ctx.lineTo(p2[0], p2[1] - k); ctx.lineTo(p3[0], p3[1] - k); ctx.stroke(); } }
    if (l >= 3) { box(cx, cy, 0.1, 0.12, 0, 12, wall); const q = P(cx, cy, 0.3, -0.05, 0); box(q[0], q[1] - 0, 0.12, 0.14, 0, 11, shade(wall, -0.05)); gable(q[0], q[1], 0.12, 0.14, 11, 6, roof, wall); }
    box(cx, cy, a, bb, 0, h, wall);
    wins(cx, cy, 'L', a, bb, 2, h, 2, l >= 3 ? 2 : 1, it.x * 7 + it.y, '#4a5a6a');
    door(cx, cy, a, bb);
    gable(cx, cy, a, bb, h, 10 + l, roof, wall);
    const ch = P(cx, cy, 0.12, -0.08, h + 8);
    box(ch[0], ch[1] + 8, 0.04, 0.04, 0, 8 + l, '#7a6a5a');
    if (NIGHT() || winter()) smoke(ch[0], ch[1] - l, 3);
    if (l >= 4) { ctx.fillStyle = '#e05a7a'; for (let i = 0; i < 6; i++) { const p = P(cx, cy, -0.4 + i * 0.12, 0.42, 1); circle(p[0], p[1], 1.6); } }
    if (l >= 5) { const t = P(cx, cy, -a + 0.05, bb - 0.05, 0); box(t[0], t[1], 0.08, 0.08, 0, h + 12, '#e8e0c8'); pyr(t[0], t[1], 0.1, 0.1, h + 12, 10, '#6a3a4a'); flag(t[0], t[1] - h - 22, 8, '#e0a35a'); }
    if (NIGHT()) light(cx, cy - h / 2, 22, 0.7);
  };
  R.workshop = (b, it, cx, cy, l) => {
    const wall = '#9a7048';
    box(cx - 6, cy - 2, 0.24, 0.2, 0, 12 + l, wall);
    gable(cx - 6, cy - 2, 0.24, 0.2, 12 + l, 8, '#6a4a2e', wall);
    door(cx - 6, cy - 2, 0.24, 0.2);
    for (let i = 0; i < l + 1; i++) { const p = P(cx, cy, 0.25, 0.3 - i * 0.12, 0); ctx.fillStyle = '#8a5a30'; for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#a06a3a' : '#7a4a26'; circle(p[0] - 5 + k * 5, p[1] - 3, 2.6); } }
    if (l >= 3) { const p = P(cx, cy, 0.3, -0.3, 0); box(p[0], p[1], 0.08, 0.14, 0, 8, '#7a5a3a'); }
    if (l >= 4) { const p = P(cx, cy, -0.35, 0.35, 0); ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 26); ctx.lineTo(p[0] + 14, p[1] - 20); ctx.stroke(); bbTop = Math.min(bbTop, p[1] - 26); }
    if (l >= 5) { const p = P(cx, cy, -0.2, 0.42, 10); ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 8, 0, TAU); ctx.stroke(); const a = reduced ? 0 : time * 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a + k * 1.57) * 8, p[1] + Math.sin(a + k * 1.57) * 8); ctx.stroke(); } }
  };
  R.quarry = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.4, -0.4, -2), P(cx, cy, 0.4, -0.4, -2), P(cx, cy, 0.4, 0.4, -2), P(cx, cy, -0.4, 0.4, -2)], '#6a6a72');
    poly([P(cx, cy, -0.3, -0.3, -8), P(cx, cy, 0.3, -0.3, -8), P(cx, cy, 0.3, 0.3, -8), P(cx, cy, -0.3, 0.3, -8)], '#4a4a52');
    for (let i = 0; i < l + 1; i++) { const p = P(cx, cy, -0.35 + (i % 3) * 0.28, 0.32 - Math.floor(i / 3) * 0.2, 0); box(p[0], p[1], 0.06, 0.06, 0, 6, '#b5b6c4'); }
    if (l >= 2) { const p = P(cx, cy, 0.3, -0.3, 0); ctx.strokeStyle = '#6a4a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0] - 6, p[1]); ctx.lineTo(p[0], p[1] - 22 - l * 3); ctx.lineTo(p[0] + 6, p[1]); ctx.moveTo(p[0], p[1] - 22 - l * 3); ctx.lineTo(p[0] - 16, p[1] - 12); ctx.stroke(); bbTop = Math.min(bbTop, p[1] - 22 - l * 3); }
    if (l >= 4) { const p = P(cx, cy, -0.3, 0.1, 0); box(p[0], p[1], 0.1, 0.07, 2, 7, '#7a5a3a'); ctx.fillStyle = '#333'; circle(p[0] - 4, p[1], 2); circle(p[0] + 4, p[1], 2); }
  };
  R.well = (b, it, cx, cy, l) => {
    const n = Math.min(l, 2);
    for (let i = 0; i < n; i++) {
      const p = P(cx, cy, i ? 0.2 : -0.15, i ? -0.2 : 0.12, 0);
      cyl(p[0], p[1], 0.14, 0, 7, '#9a9aa6', '#2a5a8a');
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] - 6); ctx.lineTo(p[0] - 8, p[1] - 18); ctx.moveTo(p[0] + 8, p[1] - 6); ctx.lineTo(p[0] + 8, p[1] - 18); ctx.stroke();
      poly([[p[0] - 11, p[1] - 17], [p[0], p[1] - 24], [p[0] + 11, p[1] - 17]], '#8a4a2e');
      bbTop = Math.min(bbTop, p[1] - 24);
    }
    if (l >= 3) { const p = P(cx, cy, 0.25, 0.25, 0); ctx.strokeStyle = '#6a4a2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0] - 6, p[1]); ctx.lineTo(p[0] - 3, p[1] - 26); ctx.moveTo(p[0] + 6, p[1]); ctx.lineTo(p[0] + 3, p[1] - 26); ctx.stroke(); cyl(p[0], p[1], 0.12, 26, 36, '#8a6a4a', '#6a4a2e'); }
    if (l >= 5) { const p = P(cx, cy, -0.3, -0.3, 0); ctx.fillStyle = '#9ad8ff'; for (let k = 0; k < 5; k++) circle(p[0] + Math.sin(time * 3 + k) * 4, p[1] - 6 - ((time * 20 + k * 5) % 12), 1.2); }
  };
  R.fishing = (b, it, cx, cy, l) => {
    const wood = '#8a6038';
    for (let i = 0; i < 4; i++) { const p = P(cx, cy, i % 2 ? 0.2 : -0.2, i < 2 ? 0.2 : -0.2, 0); ctx.fillStyle = '#5a3a22'; ctx.fillRect(p[0] - 1, p[1] - 5, 2, 5); }
    box(cx, cy, 0.22, 0.2, 5, 15 + l, '#a07a50');
    gable(cx, cy, 0.22, 0.2, 15 + l, 7, '#5a6a7a', '#a07a50');
    for (let i = 0; i < Math.min(3, l); i++) { const p = P(cx, cy, 0.42 - i * 0.2, 0.44, 0); poly([[p[0] - 8, p[1] - 2], [p[0] + 8, p[1] - 2], [p[0] + 5, p[1] + 2], [p[0] - 5, p[1] + 2]], i % 2 ? '#c0503a' : wood); }
    if (l >= 3) { ctx.strokeStyle = 'rgba(200,200,180,0.7)'; ctx.lineWidth = 0.8; const p = P(cx, cy, -0.35, 0.1, 0); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p[0] - 6 + k * 4, p[1] - 12); ctx.lineTo(p[0] - 6 + k * 4, p[1]); ctx.stroke(); } }
    if (NIGHT()) light(cx, cy - 10, 18, 0.6);
    void wood;
  };
  function crops(cx, cy, a, bb, col, glass) {
    const se = season(), c = glass ? col : se.id === 'hiver' ? '#e8eef2' : se.id === 'printemps' ? '#7ab84a' : se.id === 'ete' ? mix(col, '#7ab84a', 0.4) : col;
    poly([P(cx, cy, -a, -bb, 0), P(cx, cy, a, -bb, 0), P(cx, cy, a, bb, 0), P(cx, cy, -a, bb, 0)], glass ? '#7a4a36' : '#6a4a2e');
    ctx.strokeStyle = c; ctx.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) { const u = -a + ((i + 0.5) * 2 * a) / 6; const p1 = P(cx, cy, u, -bb + 0.04, 1), p2 = P(cx, cy, u, bb - 0.04, 1); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
    if (glass) { ctx.globalAlpha = 0.35; box(cx, cy, a, bb, 0, 9, '#cfe6ff'); ctx.globalAlpha = 1; }
  }
  R.farm = (b, it, cx, cy, l) => {
    const glass = b.variant === 'glass';
    crops(cx + 4, cy + 2, 0.34, 0.3, b.crop || '#d8b84a', glass);
    if (l >= 2) { const p = P(cx, cy, -0.3, -0.3, 0); box(p[0], p[1], 0.14, 0.12, 0, 12, glass ? '#e8e0d8' : '#a8402e'); gable(p[0], p[1], 0.14, 0.12, 12, 6, glass ? '#c0673e' : '#5a3a2a', '#a8402e'); }
    if (l >= 3) { const p = P(cx, cy, 0.05, -0.38, 0); cyl(p[0], p[1], 0.08, 0, 16 + l * 2, glass ? '#e8e0d8' : '#c8c0b0'); dome(p[0], p[1], 0.08, 16 + l * 2, '#8a8a90'); }
    if (l >= 4) { const p = P(cx, cy, 0.22, -0.38, 0); cyl(p[0], p[1], 0.07, 0, 14, '#c8c0b0'); }
    if (l >= 5 && !glass) { const p = P(cx, cy, -0.38, 0.1, 0); box(p[0], p[1], 0.06, 0.06, 0, 22, '#e8dcc0'); const a = reduced ? 0.4 : time * 1.5; ctx.strokeStyle = '#6a4a2e'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p[0], p[1] - 22); ctx.lineTo(p[0] + Math.cos(a + k * 1.57) * 12, p[1] - 22 + Math.sin(a + k * 1.57) * 12); ctx.stroke(); } bbTop = Math.min(bbTop, p[1] - 34); }
  };
  R.barn = (b, it, cx, cy, l) => {
    const s = 0.22 + l * 0.04, h = 12 + l * 3;
    box(cx, cy, s, s * 0.8, 0, h, '#b0603e');
    poly([P(cx, cy, -0.06, s * 0.8, 0), P(cx, cy, 0.06, s * 0.8, 0), P(cx, cy, 0.06, s * 0.8, h * 0.7), P(cx, cy, -0.06, s * 0.8, h * 0.7)], '#6a3a26');
    gable(cx, cy, s, s * 0.8, h, 12, '#6a4a3a', '#b0603e');
    for (let i = 0; i < l; i++) { const p = P(cx, cy, s + 0.08, s * 0.8 - i * 0.12, 0); ctx.fillStyle = '#d8c090'; circle(p[0], p[1] - 3, 3); }
    if (l >= 5) flag(cx, cy - h - 12, 10, '#e0a35a');
  };
  R.plaza = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.46, -0.46, 0.5), P(cx, cy, 0.46, -0.46, 0.5), P(cx, cy, 0.46, 0.46, 0.5), P(cx, cy, -0.46, 0.46, 0.5)], l >= 3 ? '#c8bca0' : '#b8a888');
    cyl(cx, cy, 0.12 + l * 0.02, 0, 3, '#9a9aa6', '#5aa0d0');
    if (!reduced) { ctx.fillStyle = 'rgba(160,210,255,0.8)'; for (let k = 0; k < 2 + l; k++) circle(cx + Math.sin(time * 2 + k) * 3, cy - 4 - Math.abs(Math.sin(time * 3 + k)) * (4 + l), 1.2); }
    if (l >= 2) for (const [u, v] of [[-0.35, 0.35], [0.35, -0.35]]) { const p = P(cx, cy, u, v, 0); box(p[0], p[1], 0.08, 0.03, 0, 3, '#7a5a3a'); }
    if (l >= 3) for (const [u, v] of [[-0.36, -0.36], [0.36, 0.36]]) { const p = P(cx, cy, u, v, 0); tree(p[0], p[1], 1.2); }
    if (l >= 4) { const p = P(cx, cy, 0, -0.3, 0); box(p[0], p[1], 0.06, 0.06, 0, 8, '#c8c8c8'); ctx.fillStyle = '#a8a8a8'; circle(p[0], p[1] - 13, 3.5); }
    if (l >= 5) { for (const [u, v] of [[-0.42, 0], [0.42, 0], [0, 0.42]]) { const p = P(cx, cy, u, v, 0); lamp(p[0], p[1], 12); } ctx.fillStyle = '#e05a7a'; for (let i = 0; i < 8; i++) { const p = P(cx, cy, -0.4 + i * 0.1, 0.4, 1); circle(p[0], p[1], 1.4); } }
  };
  R.herbal = (b, it, cx, cy, l) => {
    R.house(b, it, cx - 6, cy - 3, Math.min(l, 2));
    const p = P(cx, cy, 0.28, 0.25, 0);
    ctx.globalAlpha = 0.6; box(p[0], p[1], 0.12, 0.1, 0, 8, '#cfe6ff'); ctx.globalAlpha = 1;
    ctx.fillStyle = '#6aba4a'; for (let i = 0; i < 3 + l; i++) circle(p[0] - 6 + i * 3, p[1] - 3, 1.8);
    if (l >= 3) { ctx.fillStyle = '#b08ad0'; for (let i = 0; i < 6; i++) { const q = P(cx, cy, -0.4 + i * 0.13, 0.42, 1); circle(q[0], q[1], 1.5); } }
  };
  R.tavern = (b, it, cx, cy, l) => {
    const h = 16 + l * 3, wall = '#c8a070';
    box(cx, cy, 0.34, 0.26, 0, h, wall);
    wins(cx, cy, 'L', 0.34, 0.26, 2, h, 3, 2, 5, '#5a4a3a', '#ffb050');
    door(cx, cy, 0.34, 0.26);
    gable(cx, cy, 0.34, 0.26, h, 12, '#7a3a2a', wall);
    const s = P(cx, cy, -0.36, 0.26, h - 4); ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0] - 8, s[1]); ctx.stroke(); box(s[0] - 8, s[1] + 8, 0.05, 0.02, 0, 6, '#e0a35a');
    if (l >= 2) for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.35 + i * 0.2, 0.44, 0); box(p[0], p[1], 0.05, 0.05, 0, 3, '#7a5a3a'); }
    if (l >= 3 && NIGHT()) { ctx.fillStyle = '#ffd070'; for (let i = 0; i < 7; i++) { const p = P(cx, cy, -0.4 + i * 0.13, 0.46, 12 + Math.sin(i) * 2); circle(p[0], p[1], 1.3); } }
    light(cx, cy - 6, 28, NIGHT() ? 0.9 : 0);
    if (l >= 5) flag(cx, cy - h - 12, 10, '#e0a35a');
  };
  R.atelier = (b, it, cx, cy, l) => {
    const h = 14 + l * 4;
    box(cx, cy, 0.34, 0.3, 0, h, '#a08060');
    poly([P(cx, cy, -0.12, 0.3, 0), P(cx, cy, 0.12, 0.3, 0), P(cx, cy, 0.12, 0.3, h * 0.6), P(cx, cy, -0.12, 0.3, h * 0.6)], '#4a3020');
    gable(cx, cy, 0.34, 0.3, h, 10, '#5a4a40', '#a08060');
    const ch = P(cx, cy, 0.2, -0.1, h + 4); box(ch[0], ch[1] + 4, 0.05, 0.05, 0, 10 + l * 2, '#6a5a50'); smoke(ch[0], ch[1] - 8 - l * 2, 3);
    if (l >= 4) wins(cx, cy, 'R', 0.34, 0.3, 4, h - 2, 2, 1, 3, '#5a4a3a', '#ffb050');
  };
  R.belfry = (b, it, cx, cy, l) => {
    const h = 34 + l * 8, s = 0.2 + l * 0.02;
    box(cx, cy, 0.4, 0.4, 0, 3, '#b8a888');
    box(cx, cy, s, s, 3, h, '#d8c8a8');
    wins(cx, cy, 'L', s, s, 6, h - 12, 1, 2 + Math.floor(l / 2), 11, '#4a5a6a');
    const bell = P(cx, cy, 0, s, h - 8);
    ctx.fillStyle = '#2a2018'; ctx.fillRect(bell[0] - 4, bell[1] - 6, 8, 8);
    ctx.fillStyle = l >= 5 ? '#ffd24a' : '#c8a040'; circle(bell[0], bell[1] - 2, 3);
    if (l >= 3) { const c = P(cx, cy, s, 0, h - 18); ctx.fillStyle = '#f3ead3'; circle(c[0], c[1], 4); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], c[1] - 3); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + 2, c[1]); ctx.stroke(); }
    pyr(cx, cy, s + 0.03, s + 0.03, h, 18 + l * 2, '#5a3a4a');
    flag(cx, cy - h - 18 - l * 2, 10, '#e0a35a');
    if (l >= 4) for (const u of [-0.36, 0.36]) { const p = P(cx, cy, u, 0.36, 0); lamp(p[0], p[1], 12); }
    light(cx, cy - h + 6, 26, NIGHT() ? 0.8 : 0);
  };
  R.block = (b, it, cx, cy, l) => {
    const wall = wallOf(b), floors = 2 + l, h = floors * 9;
    box(cx, cy, 0.34, 0.3, 0, h, wall);
    wins(cx, cy, 'L', 0.34, 0.3, 2, h, 3, floors, it.x * 13 + it.y, '#3a4a5a');
    wins(cx, cy, 'R', 0.34, 0.3, 2, h, 3, floors, it.x * 7 + it.y * 3, '#3a4a5a');
    door(cx, cy, 0.34, 0.3, '#3a2a2a');
    flat(cx, cy, 0.36, 0.32, h + 1, shade(wall, -0.3));
    if (l >= 3) for (let f = 1; f < floors; f++) { const p = [P(cx, cy, -0.3, 0.33, f * 9), P(cx, cy, 0.3, 0.33, f * 9)]; ctx.strokeStyle = shade(wall, -0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.stroke(); }
    if (l >= 4) { const p = P(cx, cy, 0.15, -0.1, h); cyl(p[0], p[1] + 0, 0.07, 0, 8, '#7a6a5a'); }
    if (l >= 5) { ctx.fillStyle = '#6aaa4a'; for (let i = 0; i < 5; i++) { const p = P(cx, cy, -0.25 + i * 0.1, 0.2, h + 2); circle(p[0], p[1], 2.6); } }
  };
  R.mine = (b, it, cx, cy, l) => {
    const space = b.variant === 'space';
    const col = space ? '#8a8a96' : '#7a6a5a';
    poly([P(cx, cy, -0.45, 0.4, 0), P(cx, cy, 0.3, 0.4, 0), P(cx, cy, 0.1, -0.1, 18), P(cx, cy, -0.3, -0.2, 14)], col);
    poly([P(cx, cy, 0.3, 0.4, 0), P(cx, cy, 0.4, -0.3, 0), P(cx, cy, 0.1, -0.1, 18)], shade(col, -0.25));
    const e = P(cx, cy, -0.1, 0.4, 0); ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(e[0], e[1], 6, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1; const r1 = P(cx, cy, -0.1, 0.4, 0), r2 = P(cx, cy, -0.1, 0.5, 0); ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.stroke();
    if (l >= 2) { const p = P(cx, cy, 0.3, -0.3, 0); ctx.strokeStyle = space ? '#c8ccd8' : '#4a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0] - 7, p[1]); ctx.lineTo(p[0], p[1] - 28 - l * 3); ctx.lineTo(p[0] + 7, p[1]); ctx.stroke(); ctx.fillStyle = '#2a2a2a'; circle(p[0], p[1] - 28 - l * 3, 4); bbTop = Math.min(bbTop, p[1] - 34 - l * 3); }
    if (l >= 3) { const p = P(cx, cy, -0.3, 0.1, 0); box(p[0], p[1], 0.1, 0.07, 2, 7, '#7a5a3a'); ctx.fillStyle = space ? '#ffd29a' : '#8f9bb0'; circle(p[0], p[1] - 9, 3); }
    if (l >= 4 && space) { const p = P(cx, cy, 0.3, -0.3, 30 + l * 3); light(p[0], p[1] + 30, 20, 0.8); }
    if (l >= 5) flag(cx, cy - 20, 10, '#e0a35a');
  };
  R.factory = (b, it, cx, cy, l) => {
    const wall = wallOf(b), fire = b.fire || '#ff8a3a', h = 12 + l * 3;
    box(cx, cy, 0.38, 0.32, 0, h, wall);
    for (let i = 0; i < 3; i++) { const u0 = -0.38 + i * 0.253; poly([P(cx, cy, u0, -0.32, h), P(cx, cy, u0, 0.32, h), P(cx, cy, u0 + 0.253, 0.32, h + 7), P(cx, cy, u0 + 0.253, -0.32, h + 7)], shade(wall, i % 2 ? -0.1 : 0.05)); }
    const glowA = 0.6 + (reduced ? 0 : 0.3 * Math.sin(time * 6 + it.x));
    poly([P(cx, cy, -0.15, 0.32, 0), P(cx, cy, 0.05, 0.32, 0), P(cx, cy, 0.05, 0.32, 9), P(cx, cy, -0.15, 0.32, 9)], fire);
    const gp = P(cx, cy, -0.05, 0.32, 4); glow(gp[0], gp[1], 12 * glowA, fire + '99'); light(gp[0], gp[1], 22, glowA);
    for (let i = 0; i < Math.min(4, l); i++) { const p = P(cx, cy, 0.25 - i * 0.18, -0.22, h); cyl(p[0], p[1], 0.05, 0, 12 + l * 3, shade(wall, -0.25)); smoke(p[0], p[1] - 14 - l * 3, 3, b.era >= 7 ? '#dfefff' : undefined); }
    wins(cx, cy, 'R', 0.38, 0.32, 3, h - 2, 3, 1, it.y, '#3a4a5a', '#ffb050');
    if (l >= 5) { const p = P(cx, cy, 0.4, 0.4, 0); box(p[0], p[1], 0.12, 0.04, 2, 4, '#4a4a50'); }
  };
  R.market = (b, it, cx, cy, l) => {
    const cols = ['#c0503a', '#e0a35a', '#3f7fb0', '#6aba4a', '#b08ad0'];
    if (l >= 4) { box(cx, cy, 0.42, 0.42, 0, 2, '#9a8a70'); for (const [u, v] of [[-0.4, 0.4], [0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) { const p = P(cx, cy, u, v, 0); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(p[0] - 1, p[1] - 22, 2, 22); } pyr(cx, cy, 0.46, 0.46, 22, 12, '#8a5a3a'); }
    for (let i = 0; i < 1 + Math.min(l, 4); i++) {
      const u = -0.25 + (i % 2) * 0.5, v = 0.25 - Math.floor(i / 2) * 0.5;
      const p = P(cx, cy, u, v, 0);
      box(p[0], p[1], 0.12, 0.1, 0, 6, '#8a6a4a');
      poly([P(p[0], p[1], -0.15, 0.14, 10), P(p[0], p[1], 0.15, 0.14, 10), P(p[0], p[1], 0.15, -0.1, 13), P(p[0], p[1], -0.15, -0.1, 13)], cols[i % 5]);
      ctx.fillStyle = cols[(i + 2) % 5]; circle(p[0] - 3, p[1] - 7, 1.6); circle(p[0] + 2, p[1] - 7, 1.6);
    }
    if (l >= 3 && NIGHT()) light(cx, cy - 10, 26, 0.7);
  };
  R.ranch = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.46, -0.46, 0.5), P(cx, cy, 0.46, -0.46, 0.5), P(cx, cy, 0.46, 0.46, 0.5), P(cx, cy, -0.46, 0.46, 0.5)], winter() ? '#dde6ec' : '#7aa84a');
    ctx.strokeStyle = '#f0e6d0'; ctx.lineWidth = 1; const c = [P(cx, cy, -0.44, 0.44, 4), P(cx, cy, 0.44, 0.44, 4), P(cx, cy, 0.44, -0.44, 4)]; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); ctx.lineTo(c[1][0], c[1][1]); ctx.lineTo(c[2][0], c[2][1]); ctx.stroke();
    const p = P(cx, cy, -0.25, -0.25, 0); box(p[0], p[1], 0.16, 0.14, 0, 12 + l * 2, '#a8402e'); gable(p[0], p[1], 0.16, 0.14, 12 + l * 2, 8, '#5a3a2a', '#a8402e');
    for (let i = 0; i < 2 + l; i++) {
      const u = -0.1 + rnd(i + it.x) * 0.45, v = 0.35 - rnd(i * 3 + it.y) * 0.4, mv = reduced ? 0 : Math.sin(time * 0.5 + i) * 0.03;
      const q = P(cx, cy, u + mv, v, 0);
      ctx.fillStyle = i % 3 ? '#f4f0e8' : '#6a4a2e'; ctx.fillRect(q[0] - 3.5, q[1] - 5, 7, 3.6); ctx.fillStyle = '#2a2018'; ctx.fillRect(q[0] + 3, q[1] - 5.5, 2, 2);
    }
  };
  R.civic = (b, it, cx, cy, l) => {
    const wall = wallOf(b), v = b.variant, h = 16 + l * 4;
    const acc = { fire: '#8a2a22', school: '#3f7fb0', theatre: '#8a2a4a', hospital: '#d83a4a', university: '#5a3a2a', dome: '#c0673e', casino: '#ff5ad0', temple: '#ffb030', archive: '#5ad1ff', council: '#b08aff' }[v] || accOf(b);
    if (v === 'temple') {
      for (let k = 0; k < 2 + l; k++) { const s = 0.44 - k * 0.07; box(cx, cy, s, s, k * 6, k * 6 + 6, shade(wall, -k * 0.04)); }
      const top = (2 + l) * 6; const p = [cx, cy - top - 14]; glow(p[0], p[1], 22, 'rgba(255,210,100,0.8)'); ctx.fillStyle = '#fff0b0'; circle(p[0], p[1], 7); light(p[0], p[1], 40, 1); bbTop = Math.min(bbTop, p[1] - 10);
      return;
    }
    if (v === 'dome' || v === 'council') {
      box(cx, cy, 0.4, 0.4, 0, 6, wall);
      dome(cx, cy + 2, 0.34, 6, v === 'council' ? '#c0b8ff' : '#e8f0f8', 0.85);
      if (l >= 3) { ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy - 44 - l * 4); ctx.stroke(); glow(cx, cy - 44 - l * 4, 10, acc + 'cc'); bbTop = Math.min(bbTop, cy - 50 - l * 4); }
      light(cx, cy - 12, 34, 0.9);
      return;
    }
    box(cx, cy, 0.38, 0.32, 0, h, wall);
    wins(cx, cy, 'L', 0.38, 0.32, 3, h, 4, 1 + Math.floor(l / 2), it.x + 3, v === 'casino' ? '#ff5ad0' : '#4a5a6a', v === 'casino' ? '#ff9af0' : undefined);
    wins(cx, cy, 'R', 0.38, 0.32, 3, h, 3, 1 + Math.floor(l / 2), it.y + 5, '#4a5a6a');
    if (v === 'theatre' || v === 'university' || v === 'archive') {
      for (let i = 0; i < 5; i++) { const p = P(cx, cy, -0.32 + i * 0.16, 0.36, 0); ctx.fillStyle = '#f4f0e6'; ctx.fillRect(p[0] - 1.5, p[1] - h + 2, 3, h - 2); }
      poly([P(cx, cy, -0.4, 0.36, h), P(cx, cy, 0.4, 0.36, h), P(cx, cy, 0, 0.36, h + 9)], shade(wall, 0.1));
    }
    if (v === 'fire') { for (let i = 0; i < 2; i++) poly([P(cx, cy, -0.3 + i * 0.3, 0.32, 0), P(cx, cy, -0.06 + i * 0.3, 0.32, 0), P(cx, cy, -0.06 + i * 0.3, 0.32, 9), P(cx, cy, -0.3 + i * 0.3, 0.32, 9)], '#e8e0d8'); const t = P(cx, cy, 0.28, -0.2, 0); box(t[0], t[1], 0.08, 0.08, h, h + 10 + l * 2, wall); }
    if (v === 'school') { const t = P(cx, cy, 0, 0, h); box(t[0], t[1], 0.08, 0.08, 0, 8, wall); pyr(t[0], t[1], 0.1, 0.1, 8, 7, acc); flag(t[0], t[1] - 15, 9, '#e0a35a'); }
    if (v === 'hospital') { const c = P(cx, cy, 0, 0.32, h - 8); ctx.fillStyle = acc; ctx.fillRect(c[0] - 2, c[1] - 6, 4, 12); ctx.fillRect(c[0] - 6, c[1] - 2, 12, 4); if (l >= 3) { flat(cx, cy, 0.2, 0.18, h + 1, '#5a5a60'); const hp = P(cx, cy, 0, 0, h + 1); ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(hp[0], hp[1], 8, 4, 0, 0, TAU); ctx.stroke(); } }
    if (v === 'casino') { if (!reduced) { const k = Math.floor(time * 4) % 3; ctx.fillStyle = ['#ff5ad0', '#5ad1ff', '#ffe066'][k]; } else ctx.fillStyle = '#ff5ad0'; const s = P(cx, cy, 0, 0.33, h + 2); ctx.fillRect(s[0] - 12, s[1] - 6, 24, 5); light(cx, cy - h, 40, 1); }
    if (v === 'university' || v === 'archive') { dome(cx, cy - 2, 0.16, h + 2, v === 'archive' ? '#cfe6ff' : '#6a8a9a'); }
    if (v === 'archive' && !reduced) { ctx.strokeStyle = 'rgba(90,209,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy - h - 16, 18, 5, 0, 0, TAU); ctx.stroke(); }
    if (v !== 'hospital' && v !== 'fire' && v !== 'school') flat(cx, cy, 0.4, 0.34, h + 0.5, shade(wall, -0.15));
    if (v === 'fire' || v === 'hospital' || v === 'casino') {} else if (l >= 4) flag(cx, cy - h - 14, 10, acc);
    if (NIGHT()) light(cx, cy - h / 2, 28, 0.7);
  };
  R.warehouse = (b, it, cx, cy, l) => {
    const wall = wallOf(b) || '#8a7a6a', s = 0.3 + l * 0.03, h = 12 + l * 3;
    box(cx, cy, s, s * 0.85, 0, h, wall);
    const w = s * 0.85;
    ctx.fillStyle = shade(wall, -0.35);
    poly([P(cx, cy, -s, -w, h), P(cx, cy, s, -w, h), P(cx, cy, s, 0, h + 8), P(cx, cy, -s, 0, h + 8)], shade(wall, -0.2));
    poly([P(cx, cy, -s, w, h), P(cx, cy, s, w, h), P(cx, cy, s, 0, h + 8), P(cx, cy, -s, 0, h + 8)], shade(wall, -0.05));
    poly([P(cx, cy, s, w, h), P(cx, cy, s, -w, h), P(cx, cy, s, 0, h + 8)], shade(wall, -0.25));
    for (let i = 0; i < 2; i++) poly([P(cx, cy, -0.2 + i * 0.25, w, 0), P(cx, cy, -0.05 + i * 0.25, w, 0), P(cx, cy, -0.05 + i * 0.25, w, 8), P(cx, cy, -0.2 + i * 0.25, w, 8)], shade(wall, -0.35));
    for (let i = 0; i < l; i++) { const p = P(cx, cy, s + 0.08, w - i * 0.13, 0); box(p[0], p[1], 0.05, 0.05, 0, 5, ['#c8643e', '#d9c08a', '#8f9bb0', '#6fdc8c', '#5ad1ff'][i % 5]); }
  };
  R.tower = (b, it, cx, cy, l) => {
    const wall = wallOf(b), h = 34 + l * 14, twin = l >= 4;
    const draw1 = (x, y, hh) => { box(x, y, 0.2, 0.2, 0, hh, wall); wins(x, y, 'L', 0.2, 0.2, 3, hh - 2, 2, Math.round(hh / 8), it.x + x, '#6a8aa8'); wins(x, y, 'R', 0.2, 0.2, 3, hh - 2, 2, Math.round(hh / 8), it.y + x, '#5a7a98'); flat(x, y, 0.21, 0.21, hh + 0.5, shade(wall, -0.25)); };
    if (twin) { const p = P(cx, cy, -0.22, 0.2, 0); draw1(p[0], p[1], h * 0.75); }
    const q = twin ? P(cx, cy, 0.18, -0.15, 0) : [cx, cy];
    draw1(q[0], q[1], h);
    if (twin) { const a1 = P(cx, cy, -0.05, 0.05, h * 0.55); ctx.fillStyle = shade(wall, -0.2); ctx.fillRect(a1[0] - 8, a1[1] - 3, 16, 4); }
    if (l >= 3) { ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(q[0], q[1] - h); ctx.lineTo(q[0], q[1] - h - 12); ctx.stroke(); ctx.fillStyle = Math.sin(time * 4) > 0 || reduced ? '#ff4a4a' : '#6a2a2a'; circle(q[0], q[1] - h - 12, 1.8); if (NIGHT()) light(q[0], q[1] - h - 12, 10, 1); bbTop = Math.min(bbTop, q[1] - h - 14); }
    if (l >= 5) { glow(q[0], q[1] - h, 16, 'rgba(255,220,120,0.5)'); }
  };
  R.plant = (b, it, cx, cy, l) => {
    const v = b.variant;
    if (v === 'geo') {
      box(cx, cy, 0.3, 0.26, 0, 12 + l * 2, '#8a8a90');
      for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.35 + i * 0.18, 0.4, 0); cyl(p[0], p[1], 0.05, 0, 8, '#c0c0c8'); smoke(p[0], p[1] - 10, 3, '#ffffff'); }
      ctx.strokeStyle = '#c0703a'; ctx.lineWidth = 3; const a = P(cx, cy, -0.4, 0.2, 4), c = P(cx, cy, 0.4, 0.2, 4); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      return;
    }
    if (v === 'fusion') {
      box(cx, cy, 0.36, 0.32, 0, 10, '#e8e0d8');
      ctx.strokeStyle = '#ffd29a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(cx, cy - 18, 16 + l, 7, 0, 0, TAU); ctx.stroke();
      glow(cx, cy - 18, 24, 'rgba(255,200,120,0.8)'); light(cx, cy - 18, 40, 1); bbTop = Math.min(bbTop, cy - 30);
      return;
    }
    const n = 1 + Math.floor(l / 2);
    for (let i = 0; i < n; i++) {
      const p = P(cx, cy, -0.18 + (i % 2) * 0.32, i < 2 ? -0.15 + i * 0.1 : 0.25, 0);
      const hh = 26 + l * 3;
      ctx.fillStyle = '#b8bcc4'; ctx.beginPath();
      ctx.moveTo(p[0] - 11, p[1]); ctx.quadraticCurveTo(p[0] - 6, p[1] - hh * 0.55, p[0] - 8, p[1] - hh); ctx.lineTo(p[0] + 8, p[1] - hh); ctx.quadraticCurveTo(p[0] + 6, p[1] - hh * 0.55, p[0] + 11, p[1]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(p[0] + 2, p[1] - hh, 6, hh);
      ctx.fillStyle = '#8a8e96'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - hh, 8, 3, 0, 0, TAU); ctx.fill();
      smoke(p[0], p[1] - hh - 2, 4, '#f4f4f8');
      bbTop = Math.min(bbTop, p[1] - hh - 20);
    }
    const q = P(cx, cy, 0.25, 0.25, 0); box(q[0], q[1], 0.14, 0.12, 0, 12, '#5a6070');
    for (let k = 0; k < l; k++) { const s = P(q[0], q[1], -0.1 + k * 0.05, 0.12, 6); ctx.fillStyle = '#ffe066'; ctx.fillRect(s[0] - 1, s[1] - 3, 2, 4); }
    light(q[0], q[1] - 6, 22, 0.8);
  };
  R.greenhouse = (b, it, cx, cy, l) => {
    const floors = 1 + l;
    for (let f = 0; f < floors; f++) {
      ctx.globalAlpha = 0.75; box(cx, cy, 0.3, 0.26, f * 11, f * 11 + 10, '#a8d8c8', 'rgba(200,240,230,0.6)'); ctx.globalAlpha = 1;
      ctx.fillStyle = '#4aaa5a'; for (let k = 0; k < 6; k++) { const p = P(cx, cy, -0.25 + k * 0.1, 0.27, f * 11 + 3); circle(p[0], p[1], 2); }
      light(cx, cy - f * 11 - 5, 14, 0.5);
    }
    if (NIGHT()) glow(cx, cy - floors * 5, 18, 'rgba(200,140,255,0.35)');
  };
  R.tanks = (b, it, cx, cy, l) => {
    const col = wallOf(b) || '#c8d0d8';
    const n = Math.min(l, 4);
    const pos = [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]];
    for (let i = 0; i < n; i++) { const p = P(cx, cy, pos[i][0], pos[i][1], 0); cyl(p[0], p[1], 0.15, 0, 14 + l * 2, col); ctx.fillStyle = '#7fc8ff'; const s = P(p[0], p[1], 0, 0.15, 7); ctx.fillRect(s[0] - 3, s[1] - 1, 6, 2); }
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = 2; const a = P(cx, cy, -0.2, 0, 4), c2 = P(cx, cy, 0.2, 0, 4); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke();
    if (l >= 5) glow(cx, cy - 20, 14, 'rgba(127,200,255,0.5)');
  };
  R.park = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.46, -0.46, 0.5), P(cx, cy, 0.46, -0.46, 0.5), P(cx, cy, 0.46, 0.46, 0.5), P(cx, cy, -0.46, 0.46, 0.5)], winter() ? '#e8eef2' : '#6aaa4a');
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; const a = P(cx, cy, -0.46, 0, 1), c = P(cx, cy, 0.46, 0, 1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    if (l >= 2) { const p = P(cx, cy, 0.2, 0.22, 0); ctx.fillStyle = '#5aa0d0'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 10, 5, 0, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 2 + l * 2; i++) { const u = -0.4 + rnd(i + it.x * 3) * 0.8, v = -0.4 + rnd(i * 7 + it.y) * 0.3; const p = P(cx, cy, u, v, 0); tree(p[0], p[1], 1 + rnd(i) * 0.4); }
    if (l >= 4) { const p = P(cx, cy, -0.25, 0.25, 0); box(p[0], p[1], 0.1, 0.1, 0, 8, '#f0e8d8'); pyr(p[0], p[1], 0.12, 0.12, 8, 6, '#7a4a3a'); }
    if (l >= 5) for (const [u, v] of [[-0.44, 0.1], [0.44, 0.1]]) { const p = P(cx, cy, u, v, 0); lamp(p[0], p[1], 12); }
  };
  R.metro = (b, it, cx, cy, l) => {
    box(cx, cy, 0.3, 0.2, 0, 10, '#3a3a44');
    poly([P(cx, cy, -0.15, 0.2, 0), P(cx, cy, 0.15, 0.2, 0), P(cx, cy, 0.15, 0.2, 7), P(cx, cy, -0.15, 0.2, 7)], '#12121a');
    const s = P(cx, cy, 0, 0.2, 13); ctx.fillStyle = '#3f7fb0'; ctx.fillRect(s[0] - 10, s[1] - 4, 20, 7); ctx.fillStyle = '#f3ead3'; ctx.font = '700 6px "Nunito Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M', s[0], s[1] + 2); ctx.textAlign = 'start';
    if (l >= 2) { ctx.globalAlpha = 0.45; box(cx, cy, 0.34, 0.26, 10, 12, '#cfe6ff'); ctx.globalAlpha = 1; }
    light(cx, cy - 10, 20, 0.9);
  };
  R.office = (b, it, cx, cy, l) => {
    const v = b.variant, col = v === 'gold' ? '#c8a040' : v === 'glass' ? '#8a8ad8' : '#4a6a8a';
    const n = 1 + Math.floor((l + 1) / 2);
    for (let i = 0; i < n; i++) {
      const p = P(cx, cy, i === 1 ? 0.2 : i === 2 ? -0.2 : -0.05, i === 1 ? -0.2 : i === 2 ? 0.2 : 0.05, 0);
      const hh = 30 + l * 10 - i * 10;
      box(p[0], p[1], 0.14, 0.14, 0, hh, col);
      wins(p[0], p[1], 'L', 0.14, 0.14, 2, hh - 2, 2, Math.round(hh / 6), i + it.x, shade(col, 0.35), '#cfe6ff');
      wins(p[0], p[1], 'R', 0.14, 0.14, 2, hh - 2, 2, Math.round(hh / 6), i + it.y, shade(col, 0.2), '#cfe6ff');
      if (l >= 5 && i === 0) { pyr(p[0], p[1], 0.14, 0.14, hh, 12, shade(col, 0.2)); glow(p[0], p[1] - hh - 12, 8, 'rgba(255,255,255,0.8)'); }
    }
  };
  R.greentower = (b, it, cx, cy, l) => {
    const h = 30 + l * 14, floors = Math.round(h / 10);
    box(cx, cy, 0.22, 0.22, 0, h, '#eef0ea');
    for (let f = 1; f <= floors; f++) { const z = f * 10; flat(cx, cy, 0.26, 0.26, z, '#5aaa4a'); ctx.fillStyle = f % 2 ? '#4a9a3a' : '#6aba4a'; const p = P(cx, cy, -0.24, 0.24, z + 1); circle(p[0], p[1] - 1, 2.8); const q = P(cx, cy, 0.24, 0.24, z + 1); circle(q[0], q[1] - 1, 2.4); }
    wins(cx, cy, 'L', 0.22, 0.22, 2, h, 2, floors, it.x, '#7aa0b8');
    if (l >= 4) { const t = P(cx, cy, 0, 0, h); tree(t[0], t[1], 1.6, '#3a8a3a'); }
    if (l >= 5) glow(cx, cy - h, 18, 'rgba(160,255,160,0.4)');
  };
  R.turbine = (b, it, cx, cy, l) => {
    if (b.variant === 'tidal') {
      poly([P(cx, cy, -0.46, -0.46, 0.2), P(cx, cy, 0.46, -0.46, 0.2), P(cx, cy, 0.46, 0.46, 0.2), P(cx, cy, -0.46, 0.46, 0.2)], '#2f7fa8');
      for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.3 + (i % 3) * 0.3, -0.2 + Math.floor(i / 3) * 0.4, 0); ctx.fillStyle = '#e8e8e8'; circle(p[0], p[1] - 2, 3); ctx.fillStyle = '#e05a3a'; ctx.fillRect(p[0] - 1, p[1] - 8, 2, 5); const a = reduced ? 0 : time * 3; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], 6, a, a + 2); ctx.stroke(); }
      return;
    }
    const n = Math.min(l, 4), pos = [[0, 0], [-0.25, 0.25], [0.25, -0.25], [0.25, 0.25]];
    for (let i = 0; i < n; i++) {
      const p = P(cx, cy, pos[i][0], pos[i][1], 0), hh = 34 + l * 3;
      ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.moveTo(p[0] - 2, p[1]); ctx.lineTo(p[0] - 1, p[1] - hh); ctx.lineTo(p[0] + 1, p[1] - hh); ctx.lineTo(p[0] + 2, p[1]); ctx.fill();
      const a = reduced ? 0.3 : time * 2.5 + i;
      ctx.strokeStyle = '#f4f6f8'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(p[0], p[1] - hh); ctx.lineTo(p[0] + Math.cos(a + (k * TAU) / 3) * 14, p[1] - hh + Math.sin(a + (k * TAU) / 3) * 14); ctx.stroke(); }
      ctx.fillStyle = '#c8ccd0'; circle(p[0], p[1] - hh, 2);
      if (NIGHT()) { ctx.fillStyle = '#ff4a4a'; circle(p[0], p[1] - hh - 2, 1.2); }
      bbTop = Math.min(bbTop, p[1] - hh - 14);
    }
  };
  R.solar = (b, it, cx, cy, l) => {
    const v = b.variant;
    const col = v === 'mirror' ? '#ffd070' : v === 'sail' ? '#e8d8ff' : '#2a4a8a';
    if (v === 'wing' || v === 'sail' || v === 'mirror') {
      const p = [cx, cy - 10];
      box(cx, cy, 0.06, 0.06, 0, 14, '#c8ccd8');
      for (let i = 0; i < 1 + Math.min(l, 4); i++) {
        const u = (i % 2 ? 1 : -1) * (0.18 + Math.floor(i / 2) * 0.16);
        poly([P(cx, cy, u - 0.07, -0.3, 12), P(cx, cy, u + 0.07, -0.3, 12), P(cx, cy, u + 0.07, 0.3, 16), P(cx, cy, u - 0.07, 0.3, 16)], v === 'wing' ? '#2a4a9a' : col);
      }
      if (v === 'mirror') glow(p[0], p[1], 14, 'rgba(255,210,100,0.5)');
      return;
    }
    const n = Math.min(l + 1, 6);
    for (let i = 0; i < n; i++) {
      const u = -0.3 + (i % 3) * 0.3, vv = -0.2 + Math.floor(i / 3) * 0.4;
      const q = P(cx, cy, u, vv, 0);
      ctx.fillStyle = '#5a5a60'; ctx.fillRect(q[0] - 1, q[1] - 5, 2, 5);
      poly([P(cx, cy, u - 0.12, vv - 0.1, 5), P(cx, cy, u + 0.12, vv - 0.1, 5), P(cx, cy, u + 0.12, vv + 0.1, 9), P(cx, cy, u - 0.12, vv + 0.1, 9)], L > 0.5 ? '#3a5aa0' : col);
      ctx.strokeStyle = 'rgba(200,220,255,0.35)'; ctx.lineWidth = 0.5; const a = P(cx, cy, u, vv - 0.1, 5), c = P(cx, cy, u, vv + 0.1, 9); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    }
  };
  R.vfarm = (b, it, cx, cy, l) => {
    const h = 26 + l * 10, floors = Math.round(h / 8);
    ctx.globalAlpha = 0.85; box(cx, cy, 0.24, 0.24, 0, h, '#c8e8d8'); ctx.globalAlpha = 1;
    for (let f = 0; f < floors; f++) { ctx.fillStyle = f % 2 ? '#5aba5a' : '#4aa04a'; for (let k = 0; k < 4; k++) { const p = P(cx, cy, -0.18 + k * 0.12, 0.25, f * 8 + 3); circle(p[0], p[1], 2); } }
    glow(cx, cy - h / 2, 22, NIGHT() ? 'rgba(210,120,255,0.5)' : 'rgba(210,120,255,0.15)');
    flat(cx, cy, 0.25, 0.25, h, '#e8f0ec');
    light(cx, cy - h / 2, 24, 0.7);
  };
  R.fab = (b, it, cx, cy, l) => {
    const wall = wallOf(b) || '#e8ecf0', h = 12 + l * 3;
    box(cx, cy, 0.38, 0.3, 0, h, wall);
    const stripe = accOf(b);
    poly([P(cx, cy, -0.38, 0.3, h - 5), P(cx, cy, 0.38, 0.3, h - 5), P(cx, cy, 0.38, 0.3, h - 3), P(cx, cy, -0.38, 0.3, h - 3)], stripe);
    for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.25 + i * 0.13, -0.1, h); box(p[0], p[1], 0.05, 0.05, 0, 4, '#b8bcc4'); }
    if (l >= 3) { const p = P(cx, cy, 0.3, -0.25, 0); box(p[0], p[1], 0.1, 0.08, 0, h + 10, shade(wall, -0.05)); }
    wins(cx, cy, 'R', 0.38, 0.3, 3, h - 6, 3, 1, it.x, '#8ab0d0', '#cfe6ff');
    if (l >= 5) glow(cx, cy - h, 16, stripe + '66');
    if (NIGHT()) light(cx, cy - h / 2, 22, 0.6);
  };
  R.recycle = (b, it, cx, cy, l) => {
    R.warehouse({ wall: '#6a8a6a' }, it, cx - 3, cy - 2, Math.min(l, 3));
    for (let i = 0; i < 2 + l; i++) { const p = P(cx, cy, -0.4 + i * 0.12, 0.44, 0); box(p[0], p[1], 0.04, 0.04, 0, 5, ['#3f7fb0', '#e0c030', '#6aba4a', '#c0503a'][i % 4]); }
    const s = P(cx, cy, 0, 0.3, 20); ctx.strokeStyle = '#9fd46b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s[0], s[1] - 4, 5, 0, 4.8); ctx.stroke();
  };
  R.station = (b, it, cx, cy, l) => {
    box(cx, cy, 0.42, 0.18, 0, 3, '#b8b8b0');
    for (const u of [-0.35, 0.35]) { const p = P(cx, cy, u, 0, 3); ctx.fillStyle = '#5a5a60'; ctx.fillRect(p[0] - 1, p[1] - 12, 2, 12); }
    poly([P(cx, cy, -0.44, -0.2, 15), P(cx, cy, 0.44, -0.2, 15), P(cx, cy, 0.44, 0.2, 17), P(cx, cy, -0.44, 0.2, 17)], 'rgba(200,240,210,0.8)');
    const t = reduced ? 0 : ((time * 0.2) % 2) - 1;
    const p = P(cx, cy, t * 0.2, 0.32, 0); box(p[0], p[1], 0.3, 0.07, 1, 9, '#4aaa6a'); wins(p[0], p[1], 'L', 0.3, 0.07, 3, 8, 5, 1, 1, '#cfe6ff', '#ffe8a0');
  };
  R.skyscraper = (b, it, cx, cy, l) => {
    const gold = b.variant === 'gold', col = gold ? '#c8a050' : '#3a5a7a', h = 50 + l * 18;
    box(cx, cy, 0.3, 0.3, 0, h * 0.45, col);
    box(cx, cy, 0.22, 0.22, h * 0.45, h * 0.8, shade(col, 0.05));
    box(cx, cy, 0.14, 0.14, h * 0.8, h, shade(col, 0.1));
    for (const [a, z0, z1] of [[0.3, 0, h * 0.45], [0.22, h * 0.45, h * 0.8], [0.14, h * 0.8, h]]) { wins(cx, cy, 'L', a, a, z0 + 2, z1 - 1, 3, Math.round((z1 - z0) / 7), it.x + z0, gold ? '#fff0b0' : '#7ab0e0', gold ? '#fff4c0' : '#9ae6ff'); wins(cx, cy, 'R', a, a, z0 + 2, z1 - 1, 2, Math.round((z1 - z0) / 7), it.y + z0, gold ? '#e8d090' : '#5a90c0', '#9ae6ff'); }
    const neon = gold ? '#ffd070' : '#5ad1ff';
    ctx.strokeStyle = neon; ctx.lineWidth = 1.5; const e1 = P(cx, cy, -0.14, 0.14, h), e2 = P(cx, cy, 0.14, 0.14, h), e3 = P(cx, cy, 0.14, -0.14, h); ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.lineTo(e3[0], e3[1]); ctx.stroke();
    if (l >= 3) { ctx.beginPath(); ctx.moveTo(cx, cy - h); ctx.lineTo(cx, cy - h - 16); ctx.stroke(); bbTop = Math.min(bbTop, cy - h - 16); }
    if (l >= 5) glow(cx, cy - h - 16, 12, neon + 'cc');
    light(cx, cy - h, 30, NIGHT() ? 0.9 : 0);
  };
  R.datacenter = (b, it, cx, cy, l) => {
    box(cx, cy, 0.38, 0.3, 0, 10 + l * 2, '#2a3038');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const on = !reduced && Math.sin(time * 5 + c * 1.7 + r * 3 + it.x) > 0.2; const p = P(cx, cy, -0.32 + c * 0.12, 0.3, 3 + r * 4); ctx.fillStyle = on ? (c % 3 ? '#5ad1ff' : '#6fdc8c') : '#1a3040'; ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2); }
    for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.25 + (i % 3) * 0.25, -0.1 + Math.floor(i / 3) * 0.2, 10 + l * 2); cyl(p[0], p[1], 0.07, 0, 3, '#8a9aa8', '#5a6a78'); }
    light(cx, cy - 6, 20, 0.6);
  };
  R.autofarm = (b, it, cx, cy, l) => {
    crops(cx, cy, 0.42, 0.42, '#7ad05a', false);
    for (let i = 0; i < l; i++) { const a = reduced ? i : time * 0.8 + i * 2; const p = P(cx, cy, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 14); ctx.fillStyle = 'rgba(0,0,0,0.2)'; const g = P(cx, cy, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); ctx.beginPath(); ctx.ellipse(g[0], g[1], 4, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8ecf0'; ctx.fillRect(p[0] - 4, p[1] - 1, 8, 2); ctx.fillStyle = '#5ad1ff'; circle(p[0], p[1], 1.4); }
    const q = P(cx, cy, -0.35, -0.35, 0); box(q[0], q[1], 0.1, 0.1, 0, 10, '#e8ecf0');
  };
  R.antenna = (b, it, cx, cy, l) => {
    if (b.variant === 'dish') {
      box(cx, cy, 0.3, 0.3, 0, 6, '#c8ccd4');
      ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.ellipse(cx, cy - 24, 20 + l, 10, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b8bcc4'; ctx.beginPath(); ctx.ellipse(cx + 2, cy - 23, 14, 6, -0.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8a8e96'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy - 20); ctx.stroke();
      bbTop = Math.min(bbTop, cy - 36); return;
    }
    const h = 34 + l * 8;
    ctx.strokeStyle = '#8a8e96'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - h); ctx.lineTo(cx + 8, cy); ctx.stroke();
    for (let k = 1; k < 6; k++) { const y = cy - (h * k) / 6, w = 8 * (1 - k / 6); ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); ctx.stroke(); }
    for (let i = 0; i < l; i++) { ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.ellipse(cx + (i % 2 ? 5 : -5), cy - h * (0.4 + i * 0.12), 4, 2.5, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = Math.sin(time * 4) > 0 || reduced ? '#ff4a4a' : '#6a2a2a'; circle(cx, cy - h, 1.8);
    if (NIGHT()) light(cx, cy - h, 12, 1);
    bbTop = Math.min(bbTop, cy - h - 3);
  };
  R.vault = (b, it, cx, cy, l) => {
    const col = wallOf(b) || '#8a8e96';
    cyl(cx, cy, 0.3 + l * 0.02, 0, 10 + l * 4, col);
    dome(cx, cy, 0.3 + l * 0.02, 10 + l * 4, shade(col, 0.1));
    const d = P(cx, cy, 0, 0.3, 6); ctx.fillStyle = shade(col, -0.4); ctx.beginPath(); ctx.ellipse(d[0], d[1], 5, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e0c060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(d[0], d[1], 3, 3, 0, 0, TAU); ctx.stroke();
    if (l >= 4) glow(cx, cy - 16 - l * 4, 10, 'rgba(255,220,120,0.5)');
  };
  R.arco = (b, it, cx, cy, l) => {
    const green = b.variant === 'green';
    const steps = 2 + l;
    for (let k = 0; k < steps; k++) {
      const s = 0.44 - k * 0.07, z0 = k * 9, z1 = z0 + 9;
      box(cx, cy, s, s, z0, z1, green ? mix('#e8f0e0', '#9ad08a', k / steps) : '#d8c8a0');
      wins(cx, cy, 'L', s, s, z0 + 1, z1, Math.max(2, Math.round(s * 10)), 1, k + it.x, '#6a8aa8', '#ffe0a0');
      ctx.fillStyle = k % 2 ? '#5aaa4a' : '#6aba4a';
      for (let i = 0; i < 4; i++) { const p = P(cx, cy, -s + 0.05 + i * ((2 * s - 0.1) / 3), s, z1 + 1); circle(p[0], p[1], 2.2); }
    }
    const top = steps * 9;
    if (l >= 4) { glow(cx, cy - top - 4, 16, green ? 'rgba(120,255,200,0.6)' : 'rgba(255,220,140,0.6)'); }
    light(cx, cy - top / 2, 34, NIGHT() ? 0.8 : 0);
  };
  R.lab = (b, it, cx, cy, l) => {
    box(cx, cy, 0.36, 0.3, 0, 12 + l * 2, '#eef2f0');
    for (let i = 0; i < Math.min(3, l); i++) { const p = P(cx, cy, -0.2 + i * 0.2, -0.05, 12 + l * 2); dome(p[0], p[1], 0.08, 0, '#9fd46b', 0.8); }
    wins(cx, cy, 'L', 0.36, 0.3, 3, 10 + l * 2, 4, 1, it.x, '#8ad0a0', '#c8ffc8');
    glow(cx, cy - 10, 16, 'rgba(159,212,107,0.35)');
    light(cx, cy - 8, 20, 0.6);
  };
  R.aqua = (b, it, cx, cy, l) => {
    for (let i = 0; i < Math.min(l + 1, 4); i++) {
      const p = P(cx, cy, i % 2 ? 0.2 : -0.2, i < 2 ? -0.2 : 0.2, 0);
      box(p[0], p[1], 0.17, 0.17, 0, 4, '#c8d0d8', '#2a8aaa');
      if (!reduced) { ctx.fillStyle = '#e0a35a'; const f = P(p[0], p[1], Math.sin(time + i) * 0.1, Math.cos(time + i) * 0.1, 4); circle(f[0], f[1], 1.3); }
    }
    ctx.globalAlpha = 0.5; box(cx, cy, 0.44, 0.44, 0, 14 + l * 2, '#cfe6ff', 'rgba(220,240,255,0.4)'); ctx.globalAlpha = 1;
  };
  R.solartower = (b, it, cx, cy, l) => {
    for (let i = 0; i < 6 + l * 2; i++) { const a = (i / (6 + l * 2)) * TAU; const p = P(cx, cy, Math.cos(a) * 0.4, Math.sin(a) * 0.4, 2); ctx.fillStyle = L > 0.5 ? '#bcd4ff' : '#5a6a8a'; ctx.fillRect(p[0] - 3, p[1] - 2, 6, 2); }
    const h = 44 + l * 8;
    cyl(cx, cy, 0.08, 0, h, '#d8d0c0');
    glow(cx, cy - h - 4, 14 + (L > 0.5 ? 8 : 0), 'rgba(255,230,140,0.9)'); ctx.fillStyle = '#fff4c0'; circle(cx, cy - h - 4, 5);
    light(cx, cy - h - 4, 30, 1);
  };
  R.gardens = (b, it, cx, cy, l) => {
    for (let k = 0; k < 2 + l; k++) {
      const s = 0.42 - k * 0.07, z0 = k * 8;
      box(cx, cy, s, s, z0, z0 + 8, '#d8c8a0', winter() ? '#e8eef2' : '#6aba4a');
      ctx.fillStyle = '#4a9a3a'; for (let i = 0; i < 3; i++) { const p = P(cx, cy, -s + 0.08 + i * (s * 0.8), s, z0 + 9); circle(p[0], p[1] - 2, 3); }
      if (!reduced && k === 1) { ctx.fillStyle = 'rgba(160,210,255,0.8)'; const p = P(cx, cy, s, 0, z0 + 8); for (let j = 0; j < 4; j++) ctx.fillRect(p[0], p[1] + ((time * 30 + j * 4) % 12), 1.5, 3); }
    }
  };
  R.platform = (b, it, cx, cy, l) => {
    box(cx, cy, 0.46, 0.46, -3, 1, '#9a9aa0', '#c8c2b0');
    const n = 1 + Math.floor(l / 2);
    for (let i = 0; i < n; i++) {
      const p = P(cx, cy, i === 1 ? 0.2 : i === 2 ? -0.22 : -0.08, i === 1 ? -0.2 : i === 2 ? 0.18 : 0.06, 1);
      const hh = 24 + l * 8 - i * 8;
      box(p[0], p[1], 0.14, 0.14, 0, hh, '#f4f6f8');
      wins(p[0], p[1], 'L', 0.14, 0.14, 2, hh - 2, 2, Math.round(hh / 7), i + it.x, '#8ab8d8', '#ffe8b0');
      flat(p[0], p[1], 0.16, 0.16, hh, '#2a8aaa');
    }
    if (l >= 4) { const p = P(cx, cy, 0.3, 0.3, 1); tree(p[0], p[1], 1.2); }
  };
  R.seafarm = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.46, -0.46, 0.2), P(cx, cy, 0.46, -0.46, 0.2), P(cx, cy, 0.46, 0.46, 0.2), P(cx, cy, -0.46, 0.46, 0.2)], '#2f7fa8');
    for (let i = 0; i < Math.min(l + 1, 4); i++) { const p = P(cx, cy, i % 2 ? 0.2 : -0.2, i < 2 ? -0.2 : 0.2, 0); ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p[0], p[1], 11, 5.5, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#e05a3a'; circle(p[0] + 11, p[1], 1.6); if (!reduced) { ctx.fillStyle = '#e0a35a'; circle(p[0] + Math.sin(time * 2 + i) * 5, p[1] + Math.cos(time * 2 + i) * 2, 1.2); } }
  };
  R.port = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.46, -0.46, 0.2), P(cx, cy, 0.46, -0.46, 0.2), P(cx, cy, 0.46, 0.46, 0.2), P(cx, cy, -0.46, 0.46, 0.2)], '#2f7fa8');
    box(cx - 10, cy - 5, 0.4, 0.08, 0, 3, '#8a6038');
    const s = 0.25 + l * 0.03, p = P(cx, cy, 0.05, 0.22, 0);
    poly([P(p[0], p[1], -s, -0.1, 1), P(p[0], p[1], s + 0.05, -0.1, 1), P(p[0], p[1], s + 0.12, 0, 5), P(p[0], p[1], s + 0.05, 0.1, 1), P(p[0], p[1], -s, 0.1, 1)], '#f4f6f8');
    box(p[0], p[1], s * 0.7, 0.07, 5, 10 + l * 2, '#f4f6f8');
    wins(p[0], p[1], 'L', s * 0.7, 0.07, 5, 10 + l * 2, 6, 1 + Math.floor(l / 2), 3, '#3a6a8a', '#ffe0a0');
    const f = P(p[0], p[1], 0, 0, 12 + l * 2); cyl(f[0], f[1], 0.04, 0, 6, '#c0503a');
    light(p[0], p[1] - 8, 26, NIGHT() ? 0.8 : 0);
  };
  R.lighthouse = (b, it, cx, cy, l) => {
    const h = 44 + l * 6;
    for (let k = 0; k < 5; k++) cyl(cx, cy, 0.12 - k * 0.01, (h * k) / 5, (h * (k + 1)) / 5, k % 2 ? '#c0503a' : '#f4f6f8');
    cyl(cx, cy, 0.1, h, h + 7, '#fff4c0'); pyr(cx, cy, 0.1, 0.1, h + 7, 7, '#2a2a30');
    const a = reduced ? 0.5 : time * 1.5;
    ctx.globalAlpha = NIGHT() ? 0.35 : 0.12; ctx.fillStyle = '#fff4c0';
    ctx.beginPath(); ctx.moveTo(cx, cy - h - 3); ctx.lineTo(cx + Math.cos(a) * 90, cy - h - 3 + Math.sin(a) * 30 - 8); ctx.lineTo(cx + Math.cos(a) * 90, cy - h - 3 + Math.sin(a) * 30 + 8); ctx.fill(); ctx.globalAlpha = 1;
    light(cx, cy - h - 3, 30, 1);
  };
  R.module = (b, it, cx, cy, l) => {
    const hotel = b.variant === 'hotel';
    for (let i = 0; i < Math.min(l + 1, 4); i++) {
      const p = P(cx, cy, i % 2 ? 0.2 : -0.2, i < 2 ? -0.18 : 0.18, 0);
      cyl(p[0], p[1], 0.13, 0, 14 + (i % 2) * 6, '#e8ecf2');
      wins(p[0], p[1], 'L', 0.09, 0.13, 3, 12, 2, 2, i + it.x, '#6a8ab0', '#cfe6ff');
    }
    if (hotel) { ctx.strokeStyle = '#e0c060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy - 24, 24, 9, 0, 0, TAU); ctx.stroke(); bbTop = Math.min(bbTop, cy - 34); }
    const a = P(cx, cy, -0.2, 0, 8), c = P(cx, cy, 0.2, 0, 8); ctx.strokeStyle = '#a8b0bc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    light(cx, cy - 10, 24, 0.8);
  };
  R.dome = (b, it, cx, cy, l) => {
    const glass = b.glass || '#cfe6ff', hab = b.variant === 'hab';
    box(cx, cy, 0.44, 0.44, 0, 2, '#9a9aa2');
    const n = hab ? 1 : 1 + Math.floor((l - 1) / 2);
    for (let i = 0; i < n; i++) {
      const p = i === 0 ? [cx, cy] : P(cx, cy, i === 1 ? 0.25 : -0.25, i === 1 ? -0.25 : 0.25, 0);
      const r = hab ? 0.3 + l * 0.03 : i === 0 ? 0.26 : 0.16;
      if (hab) { for (let k = 0; k < l + 1; k++) { const q = P(p[0], p[1], -0.15 + (k % 3) * 0.15, -0.1 + Math.floor(k / 3) * 0.2, 2); box(q[0], q[1], 0.05, 0.05, 0, 5 + (k % 2) * 4, '#f0f0f0'); } }
      else { ctx.fillStyle = '#5aba5a'; for (let k = 0; k < 5; k++) circle(p[0] - 8 + k * 4, p[1] - 4, 2.4); }
      dome(p[0], p[1], r, 2, glass, 0.55);
      light(p[0], p[1] - 8, 26, 0.9);
    }
  };
  R.pad = (b, it, cx, cy, l) => {
    poly([P(cx, cy, -0.44, -0.44, 1), P(cx, cy, 0.44, -0.44, 1), P(cx, cy, 0.44, 0.44, 1), P(cx, cy, -0.44, 0.44, 1)], '#4a4a52');
    ctx.strokeStyle = '#e0c040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 20, 10, 0, 0, TAU); ctx.stroke();
    const cyc = reduced ? 0 : (time * 0.15 + it.x * 0.3) % 1;
    const lift = cyc > 0.8 ? (cyc - 0.8) * 5 * 200 : 0;
    const h = 22 + l * 5;
    ctx.fillStyle = '#f0f0f4'; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 2 - lift); ctx.lineTo(cx - 4, cy - h - lift); ctx.lineTo(cx, cy - h - 8 - lift); ctx.lineTo(cx + 4, cy - h - lift); ctx.lineTo(cx + 4, cy - 2 - lift); ctx.fill();
    ctx.fillStyle = '#c0503a'; poly([[cx - 4, cy - 2 - lift], [cx - 8, cy + 2 - lift], [cx - 4, cy - 10 - lift]], '#c0503a'); poly([[cx + 4, cy - 2 - lift], [cx + 8, cy + 2 - lift], [cx + 4, cy - 10 - lift]], '#c0503a');
    if (lift > 0) { glow(cx, cy - lift + 4, 12, 'rgba(255,180,80,0.9)'); light(cx, cy - lift, 30, 1); }
    bbTop = Math.min(bbTop, cy - h - 10);
  };
  R.rockhab = (b, it, cx, cy, l) => {
    const s = 0.3 + l * 0.03;
    ctx.fillStyle = '#6a6070'; ctx.beginPath(); ctx.ellipse(cx, cy - 12 - l * 2, s * 60, s * 40, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a5060'; ctx.beginPath(); ctx.ellipse(cx + 6, cy - 8 - l * 2, s * 44, s * 26, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4 + l * 2; i++) { ctx.fillStyle = NIGHT() || true ? '#ffd27a' : '#2a3140'; ctx.fillRect(cx - 12 + rnd(i + it.x) * 24, cy - 24 - l * 2 + rnd(i * 3) * 20, 2, 2); }
    bbTop = Math.min(bbTop, cy - 12 - l * 2 - s * 40);
    light(cx, cy - 14, 26, 0.8);
  };
  R.crystals = (b, it, cx, cy, l) => {
    const col = b.variant === 'exo' ? '#7affd8' : b.variant === 'quantum' ? '#f0f0ff' : '#d08aff';
    box(cx, cy, 0.36, 0.3, 0, 6, '#4a4458');
    for (let i = 0; i < 2 + l; i++) {
      const p = P(cx, cy, -0.25 + rnd(i + it.x) * 0.5, -0.2 + rnd(i * 5 + it.y) * 0.4, 6);
      const h = 10 + rnd(i * 3) * 14 + l * 2;
      poly([[p[0] - 3, p[1]], [p[0], p[1] - h], [p[0] + 3, p[1]]], col);
      poly([[p[0], p[1] - h], [p[0] + 3, p[1]], [p[0] + 1, p[1]]], shade(col, -0.3));
      bbTop = Math.min(bbTop, p[1] - h);
    }
    glow(cx, cy - 16, 20, col + '66'); light(cx, cy - 12, 30, 0.9);
  };
  R.ringlab = (b, it, cx, cy, l) => {
    ctx.strokeStyle = '#8a8e9a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 24 + l * 1.5, 11 + l * 0.7, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ff7ad1'; ctx.lineWidth = 1.5; ctx.stroke();
    if (!reduced) { const a = time * 4; glow(cx + Math.cos(a) * (24 + l * 1.5), cy - 4 + Math.sin(a) * (11 + l * 0.7), 6, 'rgba(255,122,209,0.9)'); }
    box(cx, cy, 0.1, 0.1, 0, 12, '#c8ccd8');
    light(cx, cy - 6, 30, 0.9);
  };
  R.lake = (b, it, cx, cy, l) => {
    const neb = b.variant === 'nebula';
    ctx.fillStyle = neb ? 'rgba(180,120,255,0.5)' : '#3a8ab8';
    ctx.beginPath(); ctx.ellipse(cx, cy, 24 + l * 1.5, 12 + l * 0.8, 0, 0, TAU); ctx.fill();
    if (neb) { glow(cx, cy - 10, 30, 'rgba(120,220,255,0.5)'); glow(cx + 8, cy - 16, 20, 'rgba(255,120,220,0.4)'); light(cx, cy - 10, 36, 1); bbTop = Math.min(bbTop, cy - 36); return; }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, 8 + k * 6 + ((time * 4) % 6), 4 + k * 3, 0, 0, 1.2); ctx.stroke(); }
    for (let i = 0; i < l; i++) { const p = P(cx, cy, -0.4 + i * 0.2, -0.4, 0); tree(p[0], p[1], 1.2); }
  };
  R.sun = (b, it, cx, cy, l) => {
    const black = b.variant === 'black', y = cy - 26 - l * 3, r = 7 + l;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy, 14, 6, 0, 0, TAU); ctx.fill();
    if (black) {
      ctx.strokeStyle = '#ffb060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, y, r * 2.2, r * 0.7, -0.2, 0, TAU); ctx.stroke();
      glow(cx, y, r * 2.4, 'rgba(255,160,80,0.5)'); ctx.fillStyle = '#000'; circle(cx, y, r);
    } else { glow(cx, y, r * 3, 'rgba(255,230,140,0.9)'); ctx.fillStyle = '#fff8d8'; circle(cx, y, r); }
    light(cx, y, 60, 1);
    bbTop = Math.min(bbTop, y - r * 2);
  };
  R.sphere = (b, it, cx, cy, l) => {
    const y = cy - 22 - l * 3, r = 14 + l * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.4, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(cx - r * 0.3, y - r * 0.3, 2, cx, y, r);
    g.addColorStop(0, '#e8e0ff'); g.addColorStop(1, '#6a5aa0');
    ctx.fillStyle = g; circle(cx, y, r);
    ctx.fillStyle = '#ffe8a0'; for (let i = 0; i < 6 + l * 2; i++) { const a = i * 2.4, rr = r * 0.7 * rnd(i + it.x); ctx.fillRect(cx + Math.cos(a) * rr - 1, y + Math.sin(a) * rr - 1, 2, 2); }
    ctx.strokeStyle = '#8ad8ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, y, r * 1.4, r * 0.35, 0.3, 0, TAU); ctx.stroke();
    light(cx, y, 34, 0.9);
    bbTop = Math.min(bbTop, y - r);
  };

  // ---------- Merveilles (2×2) ----------
  const W = {};
  W.w_tower = (b, it, cx, cy) => {
    box(cx, cy, 0.9, 0.9, 0, 4, '#b8b8b0');
    box(cx, cy, 0.42, 0.42, 4, 70, '#8a96a6'); wins(cx, cy, 'L', 0.42, 0.42, 6, 68, 4, 9, 3, '#7ab0e0', '#ffe0a0'); wins(cx, cy, 'R', 0.42, 0.42, 6, 68, 4, 9, 4, '#5a90c0', '#ffe0a0');
    box(cx, cy, 0.3, 0.3, 70, 120, '#9aa6b6'); wins(cx, cy, 'L', 0.3, 0.3, 72, 118, 3, 7, 5, '#7ab0e0', '#ffe0a0');
    box(cx, cy, 0.18, 0.18, 120, 150, '#aab6c6');
    ctx.strokeStyle = '#d8dce4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy - 190); ctx.stroke();
    glow(cx, cy - 190, 12, 'rgba(255,220,120,0.9)'); light(cx, cy - 190, 30, 1); light(cx, cy - 100, 60, NIGHT() ? 0.8 : 0);
    flag(cx, cy - 150, 16, '#e0a35a');
  };
  W.w_tree = (b, it, cx, cy) => {
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.quadraticCurveTo(cx - 6, cy - 50, cx - 8, cy - 90); ctx.lineTo(cx + 8, cy - 90); ctx.quadraticCurveTo(cx + 6, cy - 50, cx + 16, cy); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4; const a = -0.5 + i * 0.25; ctx.beginPath(); ctx.moveTo(cx, cy - 80); ctx.lineTo(cx + Math.sin(a) * 60, cy - 110 - Math.cos(a) * 10); ctx.stroke(); }
    const pulse = reduced ? 0.8 : 0.7 + 0.3 * Math.sin(time * 1.5);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; ctx.fillStyle = i % 2 ? '#3a9a4a' : '#4aba5a'; circle(cx + Math.cos(a) * 44, cy - 120 + Math.sin(a) * 18, 26); }
    ctx.fillStyle = '#5aca6a'; circle(cx, cy - 135, 30);
    glow(cx, cy - 120, 70, `rgba(160,255,200,${0.35 * pulse})`); light(cx, cy - 120, 80, 1);
    ctx.fillStyle = '#c8ffe0'; for (let i = 0; i < 20; i++) circle(cx + (rnd(i) - 0.5) * 100, cy - 100 - rnd(i + 5) * 60 - (reduced ? 0 : Math.sin(time + i) * 3), 1.4);
    bbTop = Math.min(bbTop, cy - 170);
  };
  W.w_core = (b, it, cx, cy) => {
    for (let k = 0; k < 4; k++) box(cx, cy, 0.85 - k * 0.18, 0.85 - k * 0.18, k * 10, k * 10 + 10, shade('#3a5a7a', k * 0.08));
    const y = cy - 80 - (reduced ? 0 : Math.sin(time) * 4);
    glow(cx, y, 40, 'rgba(90,209,255,0.7)');
    const s = 16; poly([[cx, y - s * 1.4], [cx + s, y], [cx, y + s * 1.4], [cx - s, y]], '#bff0ff');
    for (let r = 0; r < 3; r++) { ctx.strokeStyle = `rgba(90,209,255,${0.7 - r * 0.2})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, y, 30 + r * 10, 9 + r * 3, (reduced ? 0 : time * 0.5) + r, 0, TAU); ctx.stroke(); }
    light(cx, y, 80, 1); bbTop = Math.min(bbTop, y - 30);
  };
  W.w_arco = (b, it, cx, cy) => {
    for (let k = 0; k < 9; k++) { const s = 0.92 - k * 0.1; box(cx, cy, s, s, k * 14, k * 14 + 14, mix('#d8c8a0', '#e8f4ff', k / 9)); wins(cx, cy, 'L', s, s, k * 14 + 2, k * 14 + 13, Math.max(2, Math.round(s * 8)), 1, k, '#6a8aa8', '#ffe0a0'); ctx.fillStyle = '#5aaa4a'; for (let i = 0; i < 6; i++) { const p = P(cx, cy, -s + 0.05 + (i * (2 * s - 0.1)) / 5, s, k * 14 + 15); circle(p[0], p[1], 3); } }
    glow(cx, cy - 130, 30, 'rgba(255,240,200,0.8)'); light(cx, cy - 70, 90, NIGHT() ? 0.9 : 0);
  };
  W.w_elevator = (b, it, cx, cy) => {
    box(cx, cy, 0.8, 0.8, -3, 12, '#e8ecf0'); box(cx, cy, 0.4, 0.4, 12, 40, '#d8dce4');
    ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy - 2000); ctx.stroke();
    const c = reduced ? 0 : (time * 60) % 600; ctx.fillStyle = '#ffe066'; ctx.fillRect(cx - 4, cy - 60 - c, 8, 10); light(cx, cy - 60 - c, 16, 1);
    glow(cx, cy - 40, 20, 'rgba(160,220,255,0.7)'); bbTop = Math.min(bbTop, cy - 200);
  };
  W.w_ring = (b, it, cx, cy) => {
    box(cx, cy, 0.7, 0.7, 0, 16, '#d8dde6');
    const a = reduced ? 0 : time * 0.3;
    ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, cy - 70, 70, 22, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#6a9aff'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 12; i++) { const t = a + (i * TAU) / 12; ctx.fillStyle = '#ffe0a0'; ctx.fillRect(cx + Math.cos(t) * 70 - 1.5, cy - 70 + Math.sin(t) * 22 - 1.5, 3, 3); }
    ctx.strokeStyle = '#a8b0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy - 48); ctx.stroke();
    light(cx, cy - 70, 80, 0.9); bbTop = Math.min(bbTop, cy - 96);
  };
  W.w_fusion = (b, it, cx, cy) => {
    dome(cx, cy, 0.85, 0, '#cfe6ff', 0.4);
    ctx.strokeStyle = '#8a8e9a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(cx, cy - 20, 34, 14, 0, 0, TAU); ctx.stroke();
    const p = reduced ? 1 : 0.75 + 0.25 * Math.sin(time * 5);
    ctx.strokeStyle = `rgba(255,200,120,${p})`; ctx.lineWidth = 4; ctx.stroke();
    glow(cx, cy - 20, 50 * p, 'rgba(255,190,110,0.6)'); light(cx, cy - 20, 90, 1);
  };
  W.w_terra = (b, it, cx, cy, l) => {
    for (let i = 0; i < 1 + l; i++) {
      const p = P(cx, cy, -0.5 + (i % 3) * 0.5, i < 3 ? -0.4 : 0.4, 0);
      cyl(p[0], p[1], 0.14, 0, 60 + i * 6, '#e8e0d8');
      smoke(p[0], p[1] - 62 - i * 6, 5, mix('#c89078', '#e8f4ff', l / 5));
    }
    glow(cx, cy - 40, 40, `rgba(120,220,160,${0.1 * l})`); light(cx, cy - 30, 60, 0.7);
  };
  W.w_drill = (b, it, cx, cy) => {
    box(cx, cy, 0.8, 0.8, 0, 10, '#5a5068');
    ctx.strokeStyle = '#c8b8d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 30, cy - 10); ctx.lineTo(cx, cy - 130); ctx.lineTo(cx + 30, cy - 10); ctx.stroke();
    for (let k = 1; k < 8; k++) { const y = cy - 10 - k * 15, w = 30 * (1 - k / 8.6); ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); ctx.stroke(); }
    const a = reduced ? 0 : time * 6; ctx.fillStyle = '#d08aff'; for (let k = 0; k < 3; k++) { poly([[cx - 8, cy - 16], [cx + 8, cy - 16], [cx + Math.sin(a + k) * 2, cy + 10]], '#d08aff'); }
    glow(cx, cy, 30, 'rgba(208,138,255,0.6)'); light(cx, cy - 60, 60, 0.8); bbTop = Math.min(bbTop, cy - 132);
  };
  W.w_dyson = (b, it, cx, cy) => {
    const y = cy - 70;
    glow(cx, y, 60, 'rgba(255,220,120,0.9)'); ctx.fillStyle = '#fff8d8'; circle(cx, y, 20);
    ctx.strokeStyle = 'rgba(200,160,60,0.9)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx, y, 44, 44 * Math.abs(Math.cos((k * Math.PI) / 6 + (reduced ? 0 : time * 0.2))), 0, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(cx, y, 44, 44, 0, 0, TAU); ctx.stroke();
    box(cx, cy, 0.5, 0.5, 0, 10, '#8a6a3a'); light(cx, y, 100, 1); bbTop = Math.min(bbTop, y - 46);
  };
  W.w_ringcore = (b, it, cx, cy) => {
    box(cx, cy, 0.8, 0.8, 0, 6, '#d8d8c8');
    ctx.strokeStyle = '#e8f0e0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, cy - 60, 30, 56, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#7affd8'; ctx.lineWidth = 2; ctx.stroke();
    glow(cx, cy - 60, 40, 'rgba(122,255,216,0.5)'); light(cx, cy - 60, 80, 1); bbTop = Math.min(bbTop, cy - 120);
  };
  W.w_portal = (b, it, cx, cy) => {
    box(cx, cy, 0.85, 0.85, 0, 8, '#4b3f78');
    for (const u of [-0.6, 0.6]) { const p = P(cx, cy, u, 0, 8); box(p[0], p[1], 0.1, 0.1, 0, 90, '#c8c0f0'); }
    const y = cy - 60;
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = `hsla(${(time * 60 + k * 50) % 360},90%,70%,0.8)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, y, 36 - k * 6, 44 - k * 7, reduced ? 0 : time * (k % 2 ? 1 : -1), 0, TAU); ctx.stroke(); }
    glow(cx, y, 50, 'rgba(200,160,255,0.7)'); light(cx, y, 100, 1); bbTop = Math.min(bbTop, y - 50);
  };
  Object.assign(R, W);

  // ---------- Centre de chaque site ----------
  function drawHub(site, cx, cy) {
    const E = save.era;
    if (site === 'terre') {
      if (E === 1) {
        for (const [u, v] of [[-0.3, -0.25], [0.28, -0.3]]) { const p = P(cx, cy, u, v, 0); poly([[p[0] - 9, p[1]], [p[0], p[1] - 14], [p[0] + 9, p[1]]], '#d8b878'); poly([[p[0], p[1] - 14], [p[0] + 9, p[1]], [p[0] + 2, p[1]]], '#b89858'); }
        ctx.fillStyle = '#6a4a2e'; ctx.fillRect(cx - 7, cy - 2, 14, 3);
        const f = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 9);
        poly([[cx - 5, cy - 1], [cx, cy - 12 * f], [cx + 5, cy - 1]], '#ff9a3a'); poly([[cx - 2.5, cy - 1], [cx, cy - 7 * f], [cx + 2.5, cy - 1]], '#ffe066');
        glow(cx, cy - 4, 24, 'rgba(255,170,80,0.45)'); light(cx, cy - 4, 60, 1); smoke(cx, cy - 12, 3);
        bbTop = Math.min(bbTop, cy - 20);
        return;
      }
      if (E <= 3) {
        const wall = E === 2 ? '#d8c8a8' : '#c8ccd4';
        box(cx, cy, 0.4, 0.34, 0, 18 + E * 3, wall);
        wins(cx, cy, 'L', 0.4, 0.34, 3, 16 + E * 3, 4, 2, 9, '#4a5a6a');
        wins(cx, cy, 'R', 0.4, 0.34, 3, 16 + E * 3, 3, 2, 8, '#4a5a6a');
        const h = 18 + E * 3;
        box(cx, cy, 0.12, 0.12, h, h + 18, wall);
        const c = P(cx, cy, 0, 0.12, h + 11); ctx.fillStyle = '#f3ead3'; circle(c[0], c[1], 4);
        pyr(cx, cy, 0.14, 0.14, h + 18, 12, '#3f5a7a'); flag(cx, cy - h - 30, 10, '#e0a35a');
        light(cx, cy - h / 2, 40, NIGHT() ? 0.8 : 0);
        return;
      }
      const s = Math.min(1, 0.7 + (E - 4) * 0.1);
      box(cx, cy, 0.44, 0.4, 0, 16 * s + 6, '#eef0ec');
      for (let i = 0; i < 6; i++) { const p = P(cx, cy, -0.38 + i * 0.15, 0.42, 0); ctx.fillStyle = '#f8f8f4'; ctx.fillRect(p[0] - 1.5, p[1] - 16 * s - 6, 3, 16 * s + 6); }
      dome(cx, cy - 2, 0.26, 16 * s + 6, E >= 5 ? '#9ad8ff' : '#e8e0c8');
      flag(cx - 10, cy - 50 * s - 8, 10, '#e0a35a'); flag(cx + 10, cy - 50 * s - 8, 10, '#3f7fb0');
      light(cx, cy - 20, 50, NIGHT() ? 0.9 : 0.3);
      return;
    }
    if (site === 'ocean') { cyl(cx, cy, 0.4, -2, 3, '#b8b2a0'); box(cx, cy, 0.14, 0.14, 3, 30, '#f4f6f8'); cyl(cx, cy, 0.1, 30, 36, '#ffe066'); light(cx, cy - 34, 40, 1); return; }
    if (site === 'orbite') { cyl(cx, cy, 0.16, 0, 30, '#e8ecf2'); ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy - 20, 30, 10, reduced ? 0 : Math.sin(time * 0.3) * 0.1, 0, TAU); ctx.stroke(); light(cx, cy - 20, 40, 1); bbTop = Math.min(bbTop, cy - 36); return; }
    if (site === 'lune') { for (const d of [-8, 8]) { ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + d, cy); ctx.lineTo(cx + d / 2, cy - 10); ctx.stroke(); } box(cx, cy, 0.14, 0.14, 8, 20, '#e0c060'); pyr(cx, cy, 0.14, 0.14, 20, 8, '#e8e8ec'); flag(cx + 14, cy, 18, '#e0a35a'); light(cx, cy - 14, 30, 0.9); return; }
    if (site === 'mars') { dome(cx, cy, 0.34, 0, '#f0e0d0', 0.8); flag(cx + 16, cy, 22, '#e0a35a'); light(cx, cy - 10, 40, 1); return; }
    if (site === 'asteroides') { R.rockhab({}, { x: 3, y: 3 }, cx, cy, 3); return; }
    if (site === 'soleil') { cyl(cx, cy, 0.08, 0, 50, '#c8a050'); glow(cx, cy - 54, 18, 'rgba(255,220,120,0.9)'); light(cx, cy - 54, 40, 1); return; }
    if (site === 'anneau') { R.plaza({}, { x: 1, y: 1 }, cx, cy, 5); return; }
    if (site === 'galaxie') { poly([[cx - 8, cy], [cx, cy - 60], [cx + 8, cy]], '#c8f0ff'); poly([[cx, cy - 60], [cx + 8, cy], [cx + 2, cy]], '#8ab8e0'); glow(cx, cy - 40, 30, 'rgba(160,220,255,0.6)'); light(cx, cy - 40, 50, 1); bbTop = Math.min(bbTop, cy - 62); }
  }
  // terrain réservé à une merveille pas encore bâtie
  function drawLot(site, b) {
    const [lx, ly] = lotOf(b);
    const [cx, cy] = isoXY(site, lx + 1, ly + 1);
    const open = b.era <= save.era;
    poly([P(cx, cy, -0.95, -0.95, 0.4), P(cx, cy, 0.95, -0.95, 0.4), P(cx, cy, 0.95, 0.95, 0.4), P(cx, cy, -0.95, 0.95, 0.4)], open ? 'rgba(168,137,90,0.55)' : 'rgba(80,80,80,0.25)');
    ctx.strokeStyle = open ? '#e0a35a' : 'rgba(243,234,211,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    const c = [P(cx, cy, -0.95, -0.95, 3), P(cx, cy, 0.95, -0.95, 3), P(cx, cy, 0.95, 0.95, 3), P(cx, cy, -0.95, 0.95, 3)];
    ctx.beginPath(); c.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    const s = P(cx, cy, 0.6, 0.9, 0);
    ctx.fillStyle = '#6a4a2e'; ctx.fillRect(s[0] - 0.8, s[1] - 12, 1.6, 12);
    ctx.fillStyle = open ? '#f3ead3' : '#8a8a80'; ctx.fillRect(s[0] - 7, s[1] - 17, 14, 7);
    if (open) star(s[0], s[1] - 13.5, 2.6, '#e0a35a');
  }

  // ---------- Habitants, véhicules, drones ----------
  let walkers = [], walkersSite = '';
  const roadCache = {};
  function roadsOf(site) {
    const key = site + save.era;
    if (roadCache[key]) return roadCache[key];
    const n = SITES[site].n, list = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = tileKind(site, x, y); if ((k === 'road' || k === 'bridge') && inZone(site, x, y)) list.push([x, y]); }
    return (roadCache[key] = list);
  }
  function roadNext(site, x, y, px, py) {
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => {
      if (a === px && b === py) return false;
      const k = tileKind(site, a, b);
      return (k === 'road' || k === 'bridge') && inZone(site, a, b) && a >= 0 && b >= 0 && a < SITES[site].n && b < SITES[site].n;
    });
    if (!opts.length) return [px, py];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function syncWalkers() {
    const site = save.view.site;
    const roads = roadsOf(site);
    if (walkersSite !== site + save.era) { walkers = []; walkersSite = site + save.era; }
    if (!roads.length) return;
    const people = Math.min(34, 3 + Math.floor(Math.sqrt(save.pop) * 1.2));
    const vehicles = site === 'terre' ? (save.era >= 3 ? Math.min(16, save.era * 2) : 0) : 10;
    const want = people + vehicles;
    while (walkers.length < want) {
      const [x, y] = roads[Math.floor(Math.random() * roads.length)];
      const i = walkers.length, veh = i >= people;
      const [nx, ny] = roadNext(site, x, y, -1, -1);
      const cols = ['#c0503a', '#3f7fb0', '#6aba4a', '#e0a35a', '#b08ad0', '#e8e0d0', '#2a8aaa'];
      walkers.push({ px: x, py: y, nx, ny, t: Math.random(), veh, col: cols[i % cols.length], sp: veh ? 0.9 + Math.random() * 0.5 : 0.25 + Math.random() * 0.15, seed: Math.random() });
    }
    walkers.length = want;
  }
  function updateWalkers(dt) {
    const site = save.view.site;
    for (const w of walkers) {
      w.t += dt * w.sp;
      if (w.t >= 1) { w.t = 0; const [a, b] = roadNext(site, w.nx, w.ny, w.px, w.py); w.px = w.nx; w.py = w.ny; w.nx = a; w.ny = b; }
    }
  }
  function drawWalker(site, w) {
    const x = w.px + (w.nx - w.px) * w.t + 0.5, y = w.py + (w.ny - w.py) * w.t + 0.5;
    const dx = w.nx - w.px, dy = w.ny - w.py;
    const lane = w.veh ? 0.18 : 0.32 * (w.seed > 0.5 ? 1 : -1);
    const [cx, cy] = isoXY(site, x + dy * lane, y - dx * lane);
    const space = isSpace(site), E = save.era;
    if (!w.veh) { if (site === 'terre' && L < 0.3 && w.seed < 0.7) return; person(cx, cy, w.col, time + w.seed * 10); return; }
    if (space || (site === 'terre' && E >= 5) || site === 'ocean') {
      const hover = space ? 14 : 10 + w.seed * 8;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, cy, 5, 2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = space ? '#e8ecf2' : w.col; ctx.beginPath(); ctx.ellipse(cx, cy - hover, 6, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = space ? '#5ad1ff' : '#cfe6ff'; circle(cx, cy - hover - 1.5, 2);
      if (NIGHT() || space) light(cx, cy - hover, 12, 0.8);
      return;
    }
    const [sx, sy] = isoXY(site, 0, 0), [ex, ey] = isoXY(site, dx, dy);
    const ang = Math.atan2(ey - sy, ex - sx);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(1, 0.6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-7, -3, 14, 8);
    ctx.fillStyle = w.col; ctx.fillRect(-7, -5, 14, 8); ctx.fillStyle = 'rgba(200,230,255,0.8)'; ctx.fillRect(-1, -4, 4, 6);
    ctx.restore();
    ctx.fillStyle = w.col; ctx.fillRect(cx - 4, cy - 7, 8, 4);
    if (NIGHT()) { light(cx, cy - 4, 14, 0.8); ctx.fillStyle = '#fff4c0'; circle(cx + Math.cos(ang) * 6, cy - 4 + Math.sin(ang) * 3, 1.3); }
  }

  // ---------- Effets ----------
  const shakes = {};
  let upReady = new Set();
  function refreshUpReady() {
    upReady = new Set();
    for (const it of save.map[save.view.site]) { const b = BY_ID[it.id]; if (b && it.l < levelCap(b) && canPay(upCost(b, it))) upReady.add(it); }
  }
  function burst(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 90; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.8 + Math.random() * 0.7, col: col || (i % 3 ? '#ffd24a' : '#fff4c0') }); }
  }
  function floatAt(wx, wy, text, color) { floats.push({ x: wx, y: wy, text, color, life: 1.3 }); }
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function scaffold(cx, cy, top) {
    ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.2;
    for (const u of [-0.42, 0.42]) { const a = P(cx, cy, u, 0.42, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0], top); ctx.stroke(); }
    for (let y = cy - 6; y > top; y -= 8) { const a = P(cx, cy, -0.42, 0.42, cy - y), b2 = P(cx, cy, 0.42, 0.42, cy - y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); }
  }
  function drawBuilding(site, b, it, cx, cy, ghost) {
    const s = b.size || 1;
    const an = ghost ? null : anims.find((a) => a.it === it);
    bbTop = cy;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 26 * s, 11 * s, 0, 0, TAU); ctx.fill();
    ctx.save();
    if (an) {
      const t = time - an.t0;
      if (an.kind === 'build' && t < 0.9) { const k = Math.max(0.05, easeOutBack(t / 0.9)); ctx.translate(cx, cy); ctx.scale(1, k); ctx.translate(-cx, -cy); }
      else if (an.kind === 'up' && t > 0.6 && t < 1.5) { const k = 1 + 0.12 * Math.sin((t - 0.6) * 14) * Math.exp(-(t - 0.6) * 4); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); }
    }
    (R[b.shape] || R.house)(b, it, cx, cy, it.l);
    ctx.restore();
    if (ghost) return;
    if (an) {
      const t = time - an.t0;
      if (an.kind === 'up' && t < 0.6) scaffold(cx, cy, bbTop);
      if (an.kind === 'build' && t < 0.9 && !reduced) { ctx.fillStyle = 'rgba(200,180,150,0.5)'; for (let k = 0; k < 5; k++) circle(cx - 20 + k * 10, cy - (t * 20) % 10, 4 + t * 6); }
      if (!an.burst && t > (an.kind === 'up' ? 0.6 : 0.85)) { an.burst = true; burst(cx, bbTop + 6, an.kind === 'up' ? 36 : 24); floatAt(cx, bbTop - 4, an.kind === 'up' ? `Niveau ${it.l} !` : b.name, '#ffd24a'); }
    }
    if (it.l >= 5 && !b.wonder && !reduced) { const a = time * 2 + it.x; star(cx + Math.cos(a) * 14 * s, bbTop + 4 + Math.sin(a * 1.3) * 4, 2.5 + Math.sin(time * 5 + it.y), '#ffe27a'); }
    const top = bbTop;
    hitboxes.push({ it, x0: cx - (s * TW) / 2, x1: cx + (s * TW) / 2, y0: top - 4, y1: cy + (s * TH) / 2 });
    if (upReady.has(it)) { const y = top - 8 + (reduced ? 0 : Math.sin(time * 4) * 1.5); poly([[cx - 4, y + 3], [cx, y - 3], [cx + 4, y + 3]], '#ffd24a'); ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 0.8; ctx.stroke(); }
    if (save.view.badges) { ctx.fillStyle = 'rgba(28,42,31,0.9)'; circle(cx + 12 * s, top + 2, 6); ctx.fillStyle = '#f3ead3'; ctx.font = '800 8px "Nunito Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(it.l, cx + 12 * s, top + 5); ctx.textAlign = 'start'; }
  }

  // ---------- Dessin d'une image ----------
  function draw() {
    lights = []; hitboxes = [];
    const site = save.view.site, n = SITES[site].n;
    L = isSpace(site) ? 0.35 : dayLight(save.t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SW, SH);
    drawBackground(site);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (SW / 2 - camX * zoom), dpr * (viewCY - camY * zoom));
    drawSlab(site);
    drawTiles(site);
    const objs = [];
    const vis = (wx, wy, m) => { const [sx, sy] = toScreen(wx, wy); return sx > -m * zoom && sx < SW + m * zoom && sy > -m * zoom * 2 && sy < SH + m * zoom; };
    if (site === 'terre') {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (OCC.terre.has(x + ',' + y)) continue;
        const nat = natAt(x, y);
        if (!nat) continue;
        const [cx, cy] = isoXY(site, x + 0.5, y + 0.5);
        if (!vis(cx, cy, 60)) continue;
        nat.shake = shakes[x + ',' + y];
        objs.push({ d: depthOf(site, x + 0.5, y + 0.5), f: () => { bbTop = cy; drawNature(x, y, nat, cx, cy, !inZone(site, x, y)); hitboxes.push({ nat: [x, y], x0: cx - 16, x1: cx + 16, y0: bbTop - 2, y1: cy + 8 }); } });
      }
    }
    if (site !== 'terre' || save.era >= 2) {
      const m = mid(site), r = siteR(site);
      for (let gx = m - r; gx <= m + r; gx += 4) for (let gy = m - r; gy <= m + r; gy += 4) {
        if (!isRoad(site, gx, gy) || tileKind(site, gx, gy) === 'bridge') continue;
        const [cx, cy] = isoXY(site, gx + 0.15, gy + 0.15);
        if (vis(cx, cy, 30)) objs.push({ d: depthOf(site, gx + 0.15, gy + 0.15), f: () => lamp(cx, cy, 16) });
      }
    }
    const [hx, hy] = hubOf(site);
    { const [cx, cy] = isoXY(site, hx + 0.5, hy + 0.5); objs.push({ d: depthOf(site, hx + 0.5, hy + 0.5), f: () => { bbTop = cy; drawHub(site, cx, cy); hitboxes.push({ it: { hub: true, site }, x0: cx - 32, x1: cx + 32, y0: bbTop - 4, y1: cy + 16 }); } }); }
    for (const b of BUILDINGS) if (b.site === site && b.wonder && (b.size || 1) === 2 && !CNT[b.id]) { const [lx, ly] = lotOf(b); objs.push({ d: depthOf(site, lx + 1, ly + 1) - 1.5, f: () => drawLot(site, b) }); }
    for (const it of save.map[site]) {
      const b = BY_ID[it.id];
      if (!b) continue;
      const s = b.size || 1;
      const [cx, cy] = isoXY(site, it.x + s / 2, it.y + s / 2);
      if (!vis(cx, cy, 120 * s)) continue;
      objs.push({ d: depthOf(site, it.x + s / 2, it.y + s / 2), f: () => drawBuilding(site, b, it, cx, cy) });
    }
    for (const w of walkers) { const x = w.px + (w.nx - w.px) * w.t + 0.5, y = w.py + (w.ny - w.py) * w.t + 0.5; objs.push({ d: depthOf(site, x, y) + 0.01, f: () => drawWalker(site, w) }); }
    objs.sort((a, b) => a.d - b.d);
    for (const o of objs) o.f();
    // fantôme du bâtiment en cours de placement
    if (placing && placing.b.site === site) {
      const b = placing.b, s = b.size || 1, ok = canPlace(b, site, placing.x, placing.y);
      for (let dx = 0; dx < s; dx++) for (let dy = 0; dy < s; dy++) poly(tilePoly(site, placing.x + dx, placing.y + dy, 0.04), ok ? 'rgba(159,212,107,0.55)' : 'rgba(239,107,82,0.55)');
      const [cx, cy] = isoXY(site, placing.x + s / 2, placing.y + s / 2);
      ctx.globalAlpha = 0.6 + 0.2 * Math.sin(time * 4);
      drawBuilding(site, b, { id: b.id, x: placing.x, y: placing.y, l: 1 }, cx, cy, true);
      ctx.globalAlpha = 1;
    }
    for (const p of sparks) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.col; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    ctx.globalAlpha = 1;
    // nuit et lumières
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const darkness = isSpace(site) ? 0.22 : (1 - L) * 0.6;
    if (darkness > 0.02) {
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, SW, SH);
      dctx.fillStyle = `rgba(5,8,22,${darkness})`; dctx.fillRect(0, 0, SW, SH);
      dctx.globalCompositeOperation = 'destination-out';
      for (const l of lights.slice(0, 220)) { const gr = dctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = gr; dctx.beginPath(); dctx.arc(l.x, l.y, l.r, 0, TAU); dctx.fill(); }
      ctx.drawImage(dark, 0, 0, SW, SH);
    }
    // saisons
    const se = season();
    if (site === 'terre' && !reduced && se.id !== 'ete') {
      for (let i = 0; i < 40; i++) {
        const px = (rnd(i) * SW + Math.sin(time * 0.8 + i) * 20 + time * (se.id === 'hiver' ? 4 : 14)) % SW;
        const py = (rnd(i + 9) * SH + time * (se.id === 'hiver' ? 18 : 12) * (0.6 + rnd(i + 3))) % SH;
        ctx.fillStyle = se.id === 'hiver' ? 'rgba(255,255,255,0.85)' : se.id === 'automne' ? 'rgba(208,138,58,0.8)' : 'rgba(255,214,230,0.8)';
        if (se.id === 'hiver') circle(px, py, 1.6); else ctx.fillRect(px, py, 3, 2);
      }
    }
    ctx.textAlign = 'center';
    for (const f of floats) { const [sx, sy] = toScreen(f.x, f.y); ctx.globalAlpha = Math.min(1, f.life); ctx.font = '800 13px "Nunito Sans", system-ui, sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(f.text, sx + 1, sy + 1); ctx.fillStyle = f.color; ctx.fillText(f.text, sx, sy); }
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
  }

  // ---------- Récolte à la main ----------
  let hintHidden = false;
  function hideHint() { if (!hintHidden && save.stats.gathered > 5) { hintHidden = true; $('gather-hint').hidden = true; } }
  function gather(k, wx, wy) {
    const c = cap(), amt = handAmount();
    if (save.res[k] >= c) { floatAt(wx, wy, 'Réserve pleine', '#ef6b52'); return false; }
    save.res[k] = Math.min(c, save.res[k] + amt);
    save.stats.gathered++;
    floatAt(wx, wy, `+${amt} ${RES[k].name.toLowerCase()}`, RES[k].color);
    hideHint(); renderHud();
    return true;
  }
  function gatherNat(x, y) {
    const nat = natAt(x, y);
    if (!nat) return;
    const key = x + ',' + y, [cx, cy] = isoXY('terre', x + 0.5, y + 0.5);
    const st = save.nat[key] || (save.nat[key] = { hp: NAT_HP[nat.kind], t: 0 });
    if (st.hp <= 0) { floatAt(cx, cy - 20, nat.kind === 'bush' ? (winter() ? 'Rien en hiver' : 'Plus de baies') : 'Repousse bientôt', '#b9b59a'); return; }
    if (nat.kind === 'bush' && winter()) { floatAt(cx, cy - 20, 'Rien en hiver', '#b9b59a'); return; }
    const k = { tree: 'wood', rock: 'stone', bush: 'food', ore: save.era >= 2 ? 'iron' : 'stone' }[nat.kind];
    if (!gather(k, cx, cy - 30)) return;
    st.hp--;
    if (st.hp <= 0) { st.t = nat.kind === 'tree' ? 3 : 5; if (nat.kind === 'tree') floatAt(cx, cy - 46, 'Timber !', '#e0a35a'); }
    shakes[key] = time;
    for (let i = 0; i < 5; i++) sparks.push({ x: cx, y: cy - 10, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0.6, col: { wood: '#c08a55', stone: '#b5b6c4', food: '#d8364a', iron: '#e08a4a' }[k] });
  }

  // ---------- Boucle ----------
  let last = performance.now(), hudTimer = 0, autosave = 0, lastSig = '', qTimer = 0;
  function signature() {
    let s = tab + save.era + '|' + save.pop + '|' + idleCount() + '|' + save.queue.length + '|' + Object.keys(save.tools).length + '|' + (placing ? 1 : 0);
    for (const b of BUILDINGS) { if (b.era > save.era) continue; const it = bestUpgrade(b.id); s += (!buildBlock(b) && canPay(newCost(b)) ? 1 : 0) + (it && canPay(upCost(b, it)) ? 1 : 0); }
    for (const t of TECHS) if (t.era <= save.era && !hasTech(t.id)) s += canPay(t.cost) ? 1 : 0;
    for (const t of TOOLS) if (t.era <= save.era && !save.tools[t.id]) s += canPay(t.cost) ? 1 : 0;
    s += GOALS.filter((g) => g.era <= save.era && goalDone(g) && !save.claimed[g.id]).length;
    if (tab === 'tools') s += '|' + Math.floor(time / 3);
    if (tab === 'people') s += '|' + Math.round(save.happy) + save.day;
    if (tab === 'log') s += '|' + Math.floor(time / 10) + save.log.length;
    return s;
  }
  let backupTimer = 0, lastEraSaved = save.era;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    time += dt;
    const gameDt = dt * (save.speed || 0);
    if (gameDt > 0 && save.intro) step(gameDt);
    qTimer += dt;
    if (qTimer > 0.5) { qTimer = 0; quietFx = true; processQueue(); quietFx = false; }
    syncWalkers();
    updateWalkers(dt * Math.max(1, Math.min(3, save.speed || 1)));
    zoom += (zoomT - zoom) * Math.min(1, dt * 8);
    camX += (camTX - camX) * Math.min(1, dt * 6);
    camY += (camTY - camY) * Math.min(1, dt * 6);
    anims = anims.filter((a) => time - a.t0 < 2);
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; p.life -= dt; }
    sparks = sparks.filter((p) => p.life > 0);
    for (const f of floats) { f.y -= 26 * dt; f.life -= dt; }
    floats = floats.filter((f) => f.life > 0);
    draw();
    hudTimer += dt; autosave += dt;
    if (hudTimer > 0.25 || needRender) {
      hudTimer = 0; renderHud(); refreshUpReady();
      const sig = signature();
      const busy = (document.activeElement && document.activeElement.tagName === 'SELECT') || performance.now() < uiHold;
      if ((sig !== lastSig || needRender) && !busy) { lastSig = sig; needRender = false; renderTab(); renderBadges(); if (selected) renderInfo(); }
    }
    // sauvegarde automatique toutes les 10 s, et une sauvegarde de secours toutes les 5 minutes de jeu
    if (autosave > 10 && save.intro) { autosave = 0; persist(); }
    if (save.intro) backupTimer += dt;
    if (backupTimer > 300) { backupTimer = 0; makeBackup('automatique'); if (tab === 'log') needRender = true; }
    if (save.era !== lastEraSaved) { lastEraSaved = save.era; backupTimer = 0; makeBackup(`début de l'ère ${era().name}`); }
    requestAnimationFrame(frame);
  }

  // ---------- Contrôles ----------
  // pendant qu'un doigt est posé sur le panneau (et juste après), on ne le redessine pas : le bouton touché reste en place
  let uiHold = 0;
  for (const el of [ui.sheet, ui.info, ui.placeBar]) el.addEventListener('pointerdown', () => { uiHold = Infinity; });
  window.addEventListener('pointerup', () => { if (uiHold === Infinity) uiHold = performance.now() + 400; });
  window.addEventListener('pointercancel', () => { if (uiHold === Infinity) uiHold = performance.now() + 400; });
  const pointers = new Map();
  let gesture = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (!ui.card.hidden) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) gesture = { x: e.clientX, y: e.clientY, cx: camTX, cy: camTY, moved: false };
    else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; gesture = { pinch: Math.hypot(a.x - b.x, a.y - b.y), z: zoomT, moved: true }; }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      zoomT = zoom = clamp((gesture.z * Math.hypot(a.x - b.x, a.y - b.y)) / gesture.pinch, 0.3, 2.4);
      return;
    }
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) gesture.moved = true;
    if (gesture.moved && !gesture.pinch) { camTX = gesture.cx - dx / zoom; camTY = gesture.cy - dy / zoom; clampCam(); camX = camTX; camY = camTY; }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (gesture && !gesture.moved && !gesture.pinch && e.type === 'pointerup') { const r = canvas.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); }
    if (pointers.size === 1) { const [p] = [...pointers.values()]; gesture = { x: p.x, y: p.y, cx: camTX, cy: camTY, moved: true }; }
    if (!pointers.size) gesture = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomT = clamp(zoomT * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.3, 2.4); }, { passive: false });
  function tap(sx, sy) {
    if (!ui.card.hidden) return;
    const site = save.view.site;
    const [gx, gy] = screenToGrid(site, sx, sy).map(Math.floor);
    if (placing) {
      const b = placing.b;
      if ((b.size || 1) === 2) { toast('Le terrain de cette merveille est réservé : touche « Valider ».'); return; }
      if (canPlace(b, site, gx, gy)) { placing.x = gx; placing.y = gy; }
      else toast('Case occupée : choisis une case libre (pas sur une route ni sur la rivière).');
      return;
    }
    const wx = (sx - SW / 2) / zoom + camX, wy = (sy - viewCY) / zoom + camY;
    for (let i = hitboxes.length - 1; i >= 0; i--) {
      const h = hitboxes[i];
      if (wx < h.x0 || wx > h.x1 || wy < h.y0 || wy > h.y1) continue;
      if (h.nat) { gatherNat(h.nat[0], h.nat[1]); return; }
      if (h.it) { openInfo(h.it); return; }
    }
    if (site === 'terre' && gy === RIVER_Y && gx >= 0 && gx < SITES.terre.n && tileKind('terre', gx, gy) === 'water') {
      const [cx, cy] = isoXY('terre', gx + 0.5, gy + 0.5);
      if (gather('water', cx, cy - 16)) for (let k = 0; k < 6; k++) sparks.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 40, life: 0.5, col: '#9ad8ff' });
      return;
    }
    closeInfo();
  }
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;
    const step = 60 / zoom;
    if (e.key === 'ArrowLeft') camTX -= step; else if (e.key === 'ArrowRight') camTX += step;
    else if (e.key === 'ArrowUp') camTY -= step; else if (e.key === 'ArrowDown') camTY += step;
    else if (e.key === '+' || e.key === '=') zoomT = clamp(zoomT * 1.2, 0.3, 2.4);
    else if (e.key === '-') zoomT = clamp(zoomT / 1.2, 0.3, 2.4);
    else if (e.key === 'Escape') { closeInfo(); stopPlacing(); }
    else return;
    clampCam();
  });
  $('res-row').addEventListener('click', (e) => { const el = e.target.closest('.res'); if (!el) return; statRes = el.dataset.k; openTools.add('stats'); tab = 'tools'; setSheetMin(false); renderTab(); const d = document.querySelector('[data-sec="stats"]'); if (d) $('tab-tools').scrollTop = d.offsetTop - 8; });
  for (const b of document.querySelectorAll('.speed button')) b.addEventListener('click', () => { save.speed = Number(b.dataset.speed); renderSpeed(); persist(); });
  for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => { tab = b.dataset.tab; if (sheetMin) setSheetMin(false); renderTab(); });
  $('sites').addEventListener('click', (e) => { const b = e.target.closest('[data-site]'); if (!b) return; save.view.site = b.dataset.site; closeInfo(); stopPlacing(); centerOnSite(save.view.site); sitesBuilt = ''; renderSites(); persist(); });
  $('zoom-in').addEventListener('click', () => { zoomT = clamp(zoomT * 1.25, 0.3, 2.4); });
  $('zoom-out').addEventListener('click', () => { zoomT = clamp(zoomT / 1.25, 0.3, 2.4); });
  $('rotate').addEventListener('click', rotateView);
  $('sheet-toggle').addEventListener('click', () => setSheetMin(!sheetMin));
  $('place-ok').addEventListener('click', confirmPlacing);
  $('place-cancel').addEventListener('click', () => { stopPlacing(); setSheetMin(false); });
  $('info-close').addEventListener('click', closeInfo);
  $('save-dot').addEventListener('click', () => { tab = 'log'; if (sheetMin) setSheetMin(false); renderTab(); });

  $('btn-save').addEventListener('click', async () => {
    persist();
    if (cloudRef) { clearTimeout(cloudTimer); await pushCloud(); }
    toast(cloudRef ? 'Clairval sauvegardé sur ton compte.' : 'Clairval sauvegardé sur cet appareil.');
  });
  $('btn-export').addEventListener('click', async () => {
    persist();
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
    const box = $('save-code'); box.value = code;
    try { await navigator.clipboard.writeText(code); toast('Code copié. Garde-le précieusement.'); }
    catch (e) { box.focus(); box.select(); toast('Sélectionne le code et copie-le.'); }
  });
  const armed = { imp: false, reset: false };
  function twoStep(key, btn, label, confirmLabel, fn) {
    if (!armed[key]) { armed[key] = true; btn.textContent = confirmLabel; setTimeout(() => { armed[key] = false; btn.textContent = label; }, 3500); return; }
    armed[key] = false; btn.textContent = label; fn();
  }
  $('btn-import').addEventListener('click', (e) => {
    const box = $('save-code');
    if (!box.value.trim()) { toast("Colle d'abord un code de sauvegarde."); box.focus(); return; }
    twoStep('imp', e.currentTarget, 'Charger ce code', 'Toucher encore pour remplacer mon village', () => {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob(box.value.trim()))));
        if (!s || !s.res || !(s.people || s.map)) throw new Error('bad');
        const loaded = mergeSave(s);
        makeBackup('avant chargement d\'un code');
        box.value = ''; loadSave(loaded); persist(true); toast('Clairval chargé depuis le code. Ton ancien village est gardé dans les sauvegardes automatiques.');
      } catch (err) { toast("Ce code ne fonctionne pas. Vérifie qu'il est complet."); }
    });
  });
  $('btn-reset').addEventListener('click', (e) => {
    twoStep('reset', e.currentTarget, 'Recommencer un village', 'Toucher encore pour tout effacer', () => { makeBackup('avant de recommencer'); loadSave(fresh()); persist(); intro(); });
  });

  // ---------- Démarrage ----------
  function intro() {
    speedBeforeCard = 1;
    showCard('Prologue', 'La clairière de Clairval', "Tu arrives avec Lou, Mila et Jules dans une clairière au bord d'une rivière. Il y a du bois, de la pierre, des baies et de l'eau claire.\n\nConstruis un village où chacun mange à sa faim, boit et reste au chaud l'hiver. Un jour, Clairval sera peut-être une ville, une mégacité… et bien plus : 14 ères t'attendent, jusqu'aux étoiles.",
      [{ label: 'Fonder le village', fn() { save.intro = true; save.seenV3 = true; save.lastTs = Date.now(); } }], true);
  }
  function offlineReport() {
    const secs = (Date.now() - (save.lastTs || Date.now())) / 1000;
    if (!save.seenV3) {
      save.seenV3 = true;
      showCard('Nouveauté', 'Clairval change de point de vue', "La ville se voit maintenant d'en haut, en 3D. Chaque bâtiment se place sur la carte et s'améliore jusqu'au niveau 5 : il grandit et change d'allure.\n\nAprès la Mégacité, 11 nouvelles ères t'attendent : Écocité, Cité numérique, Arcologie, Cité flottante, puis l'orbite, la Lune, Mars, les astéroïdes, le Soleil, un monde-anneau et la galaxie.\n\nL'onglet Outils regroupe le Conseiller, les automatisations, les statistiques et le marché.", [{ label: 'Découvrir' }]);
      return;
    }
    if (!save.intro || secs < 90) return;
    const gains = offlineGains(secs);
    const list = Object.entries(gains).map(([k, v]) => `+${fmt(v)} ${RES[k].name.toLowerCase()}`).join(', ');
    const h = secs / 3600;
    const away = h >= 1 ? `${Math.floor(h)} h ${Math.floor((h % 1) * 60)} min` : `${Math.floor(secs / 60)} min`;
    if (list) showCard('Retour à Clairval', 'Pendant ton absence', `Tu es parti ${away}. Tes habitants ont continué à travailler (à moitié de leur rythme) :\n${list}.`, [{ label: 'Reprendre' }]);
  }

  resize();
  if (!sitesOpen().includes(save.view.site)) save.view.site = 'terre';
  centerOnSite(save.view.site, true);
  if (save.stats.gathered > 5 || save.day > 2) { hintHidden = true; $('gather-hint').hidden = true; }
  setSaveStatus('local');
  renderAll(); renderSpeed();
  if (!save.intro) intro(); else offlineReport();
  if (restoredFromBackup) persist();
  if (restoredFromBackup) toast('La sauvegarde principale était abîmée : Clairval a été récupéré depuis la dernière sauvegarde automatique.');
  initCloud();
  requestAnimationFrame(frame);
})();
