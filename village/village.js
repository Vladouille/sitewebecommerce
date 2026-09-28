/* Les Bâtisseurs de Clairval
 * Récolte à la main, construis, donne un métier à chaque habitant et veille à ce que tout le monde
 * mange, boive et reste au chaud. Fais grandir Clairval : Village, puis Ville, puis Mégacité.
 * Réglages : constantes ci-dessous (ères, ressources, métiers, bâtiments, améliorations, objectifs). */
(() => {
  'use strict';

  // ---------- Réglages ----------
  const DAY = 30;            // secondes réelles par jour, à vitesse x1
  const SEASON_DAYS = 5;     // jours par saison
  const SAVE_KEY = 'clairval-v1';
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ERAS = [
    { n: 1, name: 'Village', vw: 1240, zoom: 1 },
    { n: 2, name: 'Ville', vw: 2160, zoom: 0.95, cost: { wood: 200, stone: 250, food: 100 },
      needs: [['Habitants', () => save.people.length, 20], ['Beffroi', () => save.build.beffroi, 1]],
      story: "Les routes sont pavées, des réverbères s'allument le soir et un nouveau quartier s'ouvre derrière les rochers. Le fer, les outils, les briques et l'or arrivent à Clairval." },
    { n: 3, name: 'Mégacité', vw: 3160, zoom: 0.86, cost: { gold: 400, brick: 400, tools: 150, iron: 200 },
      needs: [['Habitants', () => save.people.length, 90], ['École', () => save.build.ecole, 1], ['Théâtre', () => save.build.theatre, 1]],
      story: "Le premier tramway traverse Clairval. Les tours montent vers le ciel, la centrale ronronne et l'acier remplace le bois. Chaque habitant a maintenant besoin d'électricité." },
  ];

  const SEASONS = [
    { id: 'printemps', name: 'Printemps', grass: '#4f8a3a', leaf: ['#6fae4a', '#8cc45a'], sky: '#8fc7e8' },
    { id: 'ete', name: 'Été', grass: '#5d8f2e', leaf: ['#3f8a34', '#56a03f'], sky: '#7ec0ea' },
    { id: 'automne', name: 'Automne', grass: '#7d7a34', leaf: ['#d08a3a', '#b8552f'], sky: '#a9bfd0' },
    { id: 'hiver', name: 'Hiver', grass: '#e4ecf1', leaf: null, sky: '#b9cddd' },
  ];
  const seasonOf = (d) => SEASONS[Math.floor((d - 1) / SEASON_DAYS) % 4];

  const RES = {
    food: { name: 'Nourriture', short: 'Nourriture', color: '#e0a35a', era: 1, val: 1 },
    water: { name: 'Eau', short: 'Eau', color: '#7fc8ff', era: 1, val: 0.5 },
    wood: { name: 'Bois', short: 'Bois', color: '#c08a55', era: 1, val: 1 },
    stone: { name: 'Pierre', short: 'Pierre', color: '#b5b6c4', era: 1, val: 1.5 },
    iron: { name: 'Fer', short: 'Fer', color: '#8f9bb0', era: 2, val: 3 },
    tools: { name: 'Outils', short: 'Outils', color: '#d9c08a', era: 2, val: 6 },
    brick: { name: 'Briques', short: 'Briques', color: '#c8643e', era: 2, val: 2 },
    gold: { name: 'Or', short: 'Or', color: '#f2c94c', era: 2, val: 1 },
    steel: { name: 'Acier', short: 'Acier', color: '#a9c4d6', era: 3, val: 10 },
    energy: { name: 'Énergie', short: 'Énergie', color: '#ffe066', era: 3, val: 2 },
  };
  const RKEYS = Object.keys(RES);
  const unlockedRes = () => RKEYS.filter((k) => RES[k].era <= save.era);

  // where : [x min, x max, y] où l'habitant travaille dans le monde
  const JOBS = {
    cueilleur: { name: 'Cueilleur', res: 'food', rate: 2, base: 3, per: 0, bld: null, season: { ete: 1.2, automne: 1.3, hiver: 0.25 }, color: '#c0503a', where: [200, 270, 14] },
    porteur: { name: "Porteur d'eau", res: 'water', rate: 3, base: 2, per: 3, bld: 'puits', color: '#3f7fb0', where: [462, 522, 24] },
    bucheron: { name: 'Bûcheron', res: 'wood', rate: 3, base: 0, per: 2, bld: 'bucheron', color: '#7a5230', where: [20, 185, 12] },
    carrier: { name: 'Tailleur de pierre', res: 'stone', rate: 2, base: 0, per: 2, bld: 'carriere', color: '#7c7d8c', where: [1112, 1212, 12] },
    fermier: { name: 'Fermier', res: 'food', rate: 4, base: 0, per: 3, bld: 'champ', season: { ete: 1.3, automne: 1.5, hiver: 0 }, color: '#c9a33a', where: [985, 1135, -16] },
    pecheur: { name: 'Pêcheur', res: 'food', rate: 2.5, base: 0, per: 2, bld: 'pecheur', season: { hiver: 0.6 }, color: '#2f7a86', where: [946, 972, 26] },
    mineur: { name: 'Mineur', res: 'iron', rate: 2.5, base: 0, per: 4, bld: 'mine', color: '#555a66', where: [1236, 1300, 12] },
    forgeron: { name: 'Forgeron', res: 'tools', rate: 1.5, inputs: { iron: 1, wood: 0.5 }, base: 0, per: 2, bld: 'forge', color: '#8a3a2a', where: [1400, 1445, 14] },
    briquetier: { name: 'Briquetier', res: 'brick', rate: 3, inputs: { stone: 0.6, wood: 0.3 }, base: 0, per: 3, bld: 'briqueterie', color: '#b0583a', where: [1488, 1535, 14] },
    marchand: { name: 'Marchand', res: 'gold', rate: 3, base: 0, per: 2, bld: 'marche', color: '#b8902a', where: [1668, 1712, 14] },
    eleveur: { name: 'Éleveur', res: 'food', rate: 5, base: 0, per: 5, bld: 'elevage', season: { hiver: 0.8 }, color: '#6a7a3a', where: [1765, 1818, 14] },
    ingenieur: { name: 'Ingénieur', res: 'energy', rate: 12, base: 0, per: 6, bld: 'centrale', color: '#e0c030', where: [2218, 2262, 14] },
    metallo: { name: 'Métallurgiste', res: 'steel', rate: 2, inputs: { iron: 2, energy: 1 }, base: 0, per: 5, bld: 'acierie', color: '#4a6a80', where: [2328, 2372, 14] },
    agronome: { name: 'Agronome', res: 'food', rate: 12, base: 0, per: 10, bld: 'serres', color: '#3a9a5a', where: [2438, 2482, 14] },
    technicien: { name: 'Technicien', res: 'water', rate: 15, base: 0, per: 10, bld: 'pompage', color: '#2a6aa0', where: [2548, 2592, 24] },
    employe: { name: 'Employé de bureau', res: 'gold', rate: 1.5, base: 0, per: 20, bld: 'bureaux', color: '#5a6a8a', where: [3030, 3110, 14] },
  };
  const JKEYS = Object.keys(JOBS);

  const BUILDINGS = [
    // Village
    { id: 'maison', era: 1, name: 'Maison', max: 8, cost: { wood: 15, stone: 4 }, grow: 1.3, desc: '+4 lits', cat: 'Logement' },
    { id: 'bucheron', era: 1, name: 'Cabane du bûcheron', max: 3, cost: { wood: 10 }, grow: 1.7, desc: '+2 postes de bûcheron', cat: 'Production' },
    { id: 'carriere', era: 1, name: 'Carrière', max: 3, cost: { wood: 18 }, grow: 1.7, desc: '+2 postes de tailleur de pierre', cat: 'Production' },
    { id: 'puits', era: 1, name: 'Puits', max: 2, cost: { wood: 12, stone: 12 }, grow: 1.8, desc: "+3 postes de porteur d'eau", cat: 'Production' },
    { id: 'pecheur', era: 1, name: 'Cabane du pêcheur', max: 2, cost: { wood: 16, stone: 4 }, grow: 1.7, desc: '+2 postes de pêcheur, qui pêchent même en hiver', need: 4, cat: 'Production' },
    { id: 'champ', era: 1, name: 'Champs', max: 3, cost: { wood: 20, stone: 6 }, grow: 1.5, desc: '+3 postes de fermier. Belles récoltes en automne, rien en hiver', need: 5, cat: 'Production' },
    { id: 'grenier', era: 1, name: 'Grenier', max: 3, cost: { wood: 30, stone: 20 }, grow: 1.5, desc: '+80 de place pour chaque ressource', cat: 'Stockage' },
    { id: 'place', era: 1, name: 'Place du village', max: 2, cost: { wood: 20, stone: 25 }, grow: 1.8, desc: '+8 de bonheur', need: 5, cat: 'Bonheur' },
    { id: 'guerisseuse', era: 1, name: 'Maison de la guérisseuse', max: 1, cost: { wood: 30, stone: 35, food: 10 }, desc: '+6 de bonheur, et plus de fièvres', need: 7, cat: 'Bonheur' },
    { id: 'taverne', era: 1, name: 'Taverne', max: 1, cost: { wood: 45, stone: 30 }, desc: '+12 de bonheur, consomme 2 de nourriture par jour', need: 8, cat: 'Bonheur' },
    { id: 'atelier', era: 1, name: 'Atelier', max: 2, cost: { wood: 50, stone: 45 }, grow: 1.6, desc: '+20 % de production pour tous les métiers', need: 10, cat: 'Production' },
    { id: 'beffroi', era: 1, name: 'Beffroi', max: 1, cost: { wood: 150, stone: 180, food: 80 }, desc: '+15 de bonheur. Nécessaire pour devenir une ville', need: 18, cat: 'Bonheur' },
    // Ville
    { id: 'immeuble', era: 2, name: 'Immeuble en briques', max: 10, cost: { brick: 30, wood: 15, stone: 10 }, grow: 1.2, desc: '+12 lits', cat: 'Logement' },
    { id: 'mine', era: 2, name: 'Mine de fer', max: 3, cost: { wood: 60, stone: 40 }, grow: 1.6, desc: '+4 postes de mineur', cat: 'Production' },
    { id: 'forge', era: 2, name: 'Forge', max: 3, cost: { stone: 50, iron: 20 }, grow: 1.6, desc: '+2 forgerons : 1 fer + 0,5 bois → 1 outil', cat: 'Production' },
    { id: 'briqueterie', era: 2, name: 'Briqueterie', max: 3, cost: { wood: 50, stone: 50 }, grow: 1.6, desc: '+3 briquetiers : 0,6 pierre + 0,3 bois → 1 brique', cat: 'Production' },
    { id: 'marche', era: 2, name: 'Marché', max: 2, cost: { brick: 60, wood: 40 }, grow: 1.8, desc: "+2 marchands (or), +5 de bonheur, meilleurs échanges et vente contre de l'or", cat: 'Commerce' },
    { id: 'elevage', era: 2, name: "Ferme d'élevage", max: 3, cost: { wood: 60, brick: 20 }, grow: 1.5, desc: "+5 éleveurs (5 nourriture chacun, même l'hiver)", cat: 'Production' },
    { id: 'caserne', era: 2, name: 'Caserne des pompiers', max: 1, cost: { brick: 50, tools: 10 }, desc: '+4 de bonheur, protège des incendies', cat: 'Bonheur' },
    { id: 'ecole', era: 2, name: 'École', max: 1, cost: { brick: 80, tools: 20, gold: 30 }, desc: '+8 de bonheur, +10 % de production', need: 35, cat: 'Bonheur' },
    { id: 'theatre', era: 2, name: 'Théâtre', max: 1, cost: { brick: 100, gold: 50, tools: 15 }, desc: '+10 de bonheur', need: 45, cat: 'Bonheur' },
    { id: 'entrepot', era: 2, name: 'Grand entrepôt', max: 3, cost: { brick: 60, iron: 20 }, grow: 1.5, desc: '+200 de place pour chaque ressource', cat: 'Stockage' },
    // Mégacité
    { id: 'tour', era: 3, name: "Tour d'habitation", max: 12, cost: { steel: 30, brick: 50, gold: 30 }, grow: 1.12, desc: '+40 lits', cat: 'Logement' },
    { id: 'centrale', era: 3, name: 'Centrale électrique', max: 4, cost: { iron: 100, brick: 100, gold: 50 }, grow: 1.5, desc: '+6 ingénieurs (12 énergie chacun)', cat: 'Production' },
    { id: 'acierie', era: 3, name: 'Aciérie', max: 3, cost: { brick: 120, iron: 80, tools: 20 }, grow: 1.5, desc: '+5 métallurgistes : 2 fer + 1 énergie → 1 acier', cat: 'Production' },
    { id: 'serres', era: 3, name: 'Serres verticales', max: 4, cost: { steel: 30, brick: 40, energy: 20 }, grow: 1.4, desc: "+10 agronomes (12 nourriture chacun, toute l'année)", cat: 'Production' },
    { id: 'pompage', era: 3, name: 'Station de pompage', max: 3, cost: { steel: 30, iron: 40 }, grow: 1.5, desc: '+10 techniciens (15 eau chacun)', cat: 'Production' },
    { id: 'hopital', era: 3, name: 'Hôpital', max: 1, cost: { steel: 80, gold: 100 }, desc: '+8 de bonheur, plus aucune épidémie', cat: 'Bonheur' },
    { id: 'parc', era: 3, name: 'Parc central', max: 2, cost: { gold: 150, wood: 200 }, grow: 1.6, desc: '+10 de bonheur', cat: 'Bonheur' },
    { id: 'metro', era: 3, name: 'Métro', max: 1, cost: { steel: 150, gold: 200, energy: 60 }, desc: '+12 de bonheur', cat: 'Bonheur' },
    { id: 'megaentrepot', era: 3, name: 'Méga-entrepôt', max: 3, cost: { steel: 60, brick: 80 }, grow: 1.5, desc: '+600 de place pour chaque ressource', cat: 'Stockage' },
    { id: 'bureaux', era: 3, name: "Quartier d'affaires", max: 5, cost: { steel: 40, brick: 80, gold: 60 }, grow: 1.3, desc: "+20 postes d'employé de bureau (or)", cat: 'Production' },
    { id: 'tourclairval', era: 3, name: 'Tour de Clairval', max: 1, cost: { steel: 500, gold: 800, energy: 300, brick: 300 }, desc: '+20 de bonheur. Le monument final', need: 300, cat: 'Bonheur' },
  ];
  const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

  // Améliorations : achetées une fois, effet permanent
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
  ];

  const GOALS = [
    { id: 'g1', era: 1, text: 'Construire une maison', goal: 1, get: () => save.build.maison, reward: { wood: 10 } },
    { id: 'g2', era: 1, text: 'Construire la cabane du bûcheron', goal: 1, get: () => save.build.bucheron, reward: { food: 12 } },
    { id: 'g3', era: 1, text: 'Construire un puits', goal: 1, get: () => save.build.puits, reward: { wood: 20 } },
    { id: 'g4', era: 1, text: 'Accueillir 6 habitants', goal: 6, get: () => save.people.length, reward: { stone: 15 } },
    { id: 'g5', era: 1, text: 'Acheter une amélioration', goal: 1, get: () => Object.keys(save.techs).length, reward: { food: 15 } },
    { id: 'g6', era: 1, text: 'Traverser un hiver', goal: 1, get: () => save.stats.winters, reward: { food: 30, wood: 20 } },
    { id: 'g7', era: 1, text: 'Atteindre 70 % de bonheur', goal: 70, get: () => Math.round(save.happy), reward: { stone: 30 } },
    { id: 'g8', era: 1, text: 'Accueillir 12 habitants', goal: 12, get: () => save.people.length, reward: { wood: 40 } },
    { id: 'g9', era: 1, text: "Construire l'atelier", goal: 1, get: () => save.build.atelier, reward: { food: 40, stone: 20 } },
    { id: 'g10', era: 1, text: 'Élever le beffroi', goal: 1, get: () => save.build.beffroi, reward: { food: 50 } },
    { id: 'g11', era: 1, text: 'Devenir une ville', goal: 2, get: () => save.era, reward: { wood: 80, stone: 80 } },
    { id: 'g12', era: 2, text: 'Construire la mine de fer', goal: 1, get: () => save.build.mine, reward: { iron: 20 } },
    { id: 'g13', era: 2, text: 'Fabriquer 50 outils', goal: 50, get: () => Math.floor(save.stats.made.tools || 0), reward: { gold: 40 } },
    { id: 'g14', era: 2, text: 'Construire 3 immeubles', goal: 3, get: () => save.build.immeuble, reward: { brick: 60 } },
    { id: 'g15', era: 2, text: 'Accueillir 50 habitants', goal: 50, get: () => save.people.length, reward: { gold: 60 } },
    { id: 'g16', era: 2, text: 'Construire le théâtre', goal: 1, get: () => save.build.theatre, reward: { tools: 30 } },
    { id: 'g17', era: 2, text: 'Devenir une mégacité', goal: 3, get: () => save.era, reward: { gold: 150, brick: 100 } },
    { id: 'g18', era: 3, text: 'Construire une centrale', goal: 1, get: () => save.build.centrale, reward: { energy: 60 } },
    { id: 'g19', era: 3, text: "Produire 100 d'acier", goal: 100, get: () => Math.floor(save.stats.made.steel || 0), reward: { gold: 150 } },
    { id: 'g20', era: 3, text: 'Accueillir 200 habitants', goal: 200, get: () => save.people.length, reward: { steel: 60 } },
    { id: 'g21', era: 3, text: 'Accueillir 400 habitants', goal: 400, get: () => save.people.length, reward: { gold: 300 } },
    { id: 'g22', era: 3, text: 'Élever la Tour de Clairval', goal: 1, get: () => save.build.tourclairval, reward: { gold: 500 } },
  ];

  const NAMES = ['Lou', 'Mila', 'Jules', 'Anouk', 'Tom', 'Rose', 'Hugo', 'Léna', 'Basile', 'Iris', 'Noé', 'Zoé', 'Émile', 'Nina', 'Arthur', 'Lise', 'Gabin', 'Maëlle', 'Sacha', 'Alba', 'Oscar', 'Jade', 'Côme', 'Inès', 'Paul', 'Clara', 'Marius', 'Louna', 'Victor', 'Elsa', 'Robin', 'Capucine', 'Timéo', 'Olga', 'Félix', 'Suzon', 'Aimé', 'Romy', 'Léon', 'Ninon'];
  const FAMILIES = ['Durand', 'Morel', 'Faure', 'Lemoine', 'Garnier', 'Roux', 'Blanc', 'Chevalier', 'Perrin', 'Marchand', 'Colin', 'Leclerc', 'Rivière', 'Fontaine', 'Meunier', 'Boyer', 'Girard', 'Aubert', 'Barbier', 'Picard'];

  // ---------- Sauvegarde ----------
  const fresh = () => ({
    v: 2, era: 1, day: 1, t: 0.3, speed: 1, intro: false, won: false, wonMega: false,
    res: Object.fromEntries(RKEYS.map((k) => [k, { food: 18, water: 18, wood: 8 }[k] || 0])),
    people: [{ n: 'Lou', job: 'cueilleur' }, { n: 'Mila', job: 'cueilleur' }, { n: 'Jules', job: 'porteur' }],
    build: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
    techs: {},
    happy: 55, hunger: 0, thirst: 0, cold: 0, mods: [],
    claimed: {}, notified: {}, log: [], hist: [],
    stats: { winters: 0, gathered: 0, maxPop: 3, made: {} },
    trees: Array(8).fill(0).map(() => ({ hp: 5, stump: 0 })),
    berries: [4, 5, 3],
    updatedAt: 0, lastTs: Date.now(),
  });
  let save = fresh();
  function mergeSave(s) {
    const f = fresh();
    return Object.assign(f, s, {
      res: Object.assign(f.res, s.res), build: Object.assign(f.build, s.build),
      stats: Object.assign(f.stats, s.stats, { made: Object.assign({}, s.stats && s.stats.made) }),
      techs: Object.assign({}, s.techs), era: s.era || 1, hist: s.hist || [],
    });
  }
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) save = mergeSave(JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }

  // Trois niveaux : ce navigateur, le compte claude.ai (capacité db, document privé), et un code à copier.
  let cloudRef = null, cloudBusy = false, cloudPending = false, cloudTimer = 0;
  function persist() {
    save.updatedAt = Date.now();
    save.lastTs = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
    if (cloudRef) { clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 1500); setSaveStatus('saving'); } else setSaveStatus('local');
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
        save = mergeSave(remote);
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
        if (!ui.card.hidden && cardIsIntro) closeCard();
        syncPeople(); applyEra(); renderAll(); toast('Clairval récupéré depuis ton compte.');
        setSaveStatus('cloud');
      } else if (save.intro) await pushCloud();
      else setSaveStatus('cloud');
    } catch (e) { cloudRef = null; setSaveStatus('local'); }
  }
  function setSaveStatus(st) {
    const el = document.getElementById('save-status');
    el.textContent = { cloud: 'Sauvegardé sur ton compte', saving: 'Sauvegarde…', local: 'Sauvegardé sur cet appareil', error: 'Sauvegarde en attente' }[st];
    el.dataset.state = st;
  }

  // ---------- Calculs ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const era = () => ERAS[save.era - 1];
  const cap = () => 60 + 80 * save.build.grenier + 200 * save.build.entrepot + 600 * save.build.megaentrepot;
  const housing = () => 4 + 4 * save.build.maison + 12 * save.build.immeuble + 40 * save.build.tour;
  const season = () => seasonOf(save.day);
  const winter = () => season().id === 'hiver';
  const jobCounts = () => { const c = { idle: 0 }; for (const j of JKEYS) c[j] = 0; for (const p of save.people) c[p.job] = (c[p.job] || 0) + 1; return c; };
  const countJob = (j) => jobCounts()[j];
  const idleCount = () => jobCounts().idle;
  const slots = (j) => JOBS[j].base + JOBS[j].per * (JOBS[j].bld ? save.build[JOBS[j].bld] : 0);
  const jobUnlocked = (j) => !JOBS[j].bld || BY_ID[JOBS[j].bld].era <= save.era;
  const costOf = (b) => Object.fromEntries(Object.entries(b.cost).map(([k, v]) => [k, Math.round(v * Math.pow(b.grow || 1, save.build[b.id]))]));
  const canPay = (c) => Object.entries(c).every(([k, v]) => save.res[k] >= v);
  const pay = (c) => { for (const [k, v] of Object.entries(c)) save.res[k] -= v; };
  const give = (g) => { for (const [k, v] of Object.entries(g)) save.res[k] = Math.min(cap(), save.res[k] + v); };
  const fmt = (v) => (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('fr-FR');
  const hasTech = (id) => !!save.techs[id];
  const techSum = (key) => TECHS.filter((t) => hasTech(t.id) && t[key]).reduce((a, t) => a + t[key], 0);
  const handAmount = () => 1 + Math.max(0, ...TECHS.filter((t) => hasTech(t.id) && t.hand).map((t) => t.hand));

  function productionMul() {
    let m = 1 + 0.2 * save.build.atelier + 0.1 * save.build.ecole;
    if (save.happy < 30) m *= 0.75; else if (save.happy >= 75) m *= 1.1;
    return m;
  }
  function jobRate(j) {
    const J = JOBS[j];
    const sm = J.season && J.season[season().id] !== undefined ? J.season[season().id] : 1;
    const tech = TECHS.filter((t) => hasTech(t.id) && t.jobs && t.jobs[j]).reduce((a, t) => a + t.jobs[j], 0);
    return J.rate * sm * productionMul() * (1 + tech);
  }
  function heatingNeed() {
    if (!winter()) return { res: null, amt: 0 };
    const n = save.people.length, cut = 1 - Math.min(0.6, techSum('heat'));
    if (save.era >= 3) return { res: 'energy', amt: 0.3 * n * cut };
    if (save.era === 2) return { res: 'wood', amt: 0.3 * n * cut };
    return { res: 'wood', amt: (0.5 * n + 0.5 * save.build.maison) * cut };
  }
  function rates() {
    const prod = Object.fromEntries(RKEYS.map((k) => [k, 0])), cons = Object.fromEntries(RKEYS.map((k) => [k, 0]));
    const c = jobCounts();
    for (const j of JKEYS) {
      const out = c[j] * jobRate(j);
      prod[JOBS[j].res] += out;
      if (JOBS[j].inputs) for (const [k, v] of Object.entries(JOBS[j].inputs)) cons[k] += out * v;
    }
    const n = save.people.length;
    cons.food += n + (save.build.taverne ? 2 : 0);
    cons.water += n * (1 - techSum('water'));
    if (save.era >= 3) cons.energy += 0.2 * n;
    const h = heatingNeed();
    if (h.res) cons[h.res] += h.amt;
    return { prod, cons };
  }
  let short = {};
  function happinessFactors() {
    const b = save.build, f = [['Vie au village', 50]];
    const add = (l, v) => { if (v) f.push([l, v]); };
    add('Place du village', 8 * b.place); add('Taverne', 12 * b.taverne); add('Guérisseuse', 6 * b.guerisseuse); add('Beffroi', 15 * b.beffroi);
    add('Marché', 5 * b.marche); add('Caserne', 4 * b.caserne); add('École', 8 * b.ecole); add('Théâtre', 10 * b.theatre);
    add('Hôpital', 8 * b.hopital); add('Parc central', 10 * b.parc); add('Métro', 12 * b.metro); add('Tour de Clairval', 20 * b.tourclairval);
    add('Améliorations', techSum('happy'));
    const c = jobCounts();
    const sources = ['cueilleur', 'fermier', 'pecheur', 'eleveur', 'agronome'].filter((j) => c[j] > 0).length;
    if (sources >= 2) f.push(['Repas variés', 6]);
    const n = save.people.length;
    if (n > 20) f.push(['Grande ville, besoin de services', -Math.min(45, Math.floor((n - 20) / 10) * 2)]);
    if (n > housing()) f.push(['Pas assez de lits', -15]);
    if (short.food) f.push(['Faim', -25]);
    if (short.water) f.push(['Soif', -30]);
    const h = heatingNeed();
    if (h.res && short[h.res]) f.push(['Froid', -20]);
    if (save.era >= 3 && short.energy) f.push(['Coupures de courant', -20]);
    if (c.idle >= 3 && c.idle > n / 3) f.push(['Personnes sans métier', -6]);
    for (const m of save.mods) f.push([m.l, m.v]);
    return f;
  }
  const happyTarget = () => clamp(happinessFactors().reduce((a, x) => a + x[1], 0), 0, 100);

  // ---------- Habitants ----------
  function newName() {
    const used = new Set(save.people.map((p) => p.n));
    for (let k = 0; k < 30; k++) {
      const n = NAMES[Math.floor(Math.random() * NAMES.length)] + (save.people.length > 30 ? ' ' + FAMILIES[Math.floor(Math.random() * FAMILIES.length)] : '');
      if (!used.has(n)) return n;
    }
    return NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (save.people.length + 1);
  }
  function addVillager() {
    const n = newName();
    save.people.push({ n, job: 'idle' });
    save.stats.maxPop = Math.max(save.stats.maxPop, save.people.length);
    return n;
  }
  function removeVillagers(k, reason) {
    const gone = [];
    for (let i = 0; i < k && save.people.length; i++) {
      let idx = save.people.findIndex((p) => p.job === 'idle');
      if (idx < 0) idx = save.people.length - 1;
      gone.push(save.people.splice(idx, 1)[0].n);
    }
    if (!gone.length) return;
    const who = gone.length === 1 ? `${gone[0]} quitte` : `${gone.length} habitants quittent`;
    log(`${who} Clairval : ${reason}.`); toast(`${who} Clairval : ${reason}.`);
  }
  function assign(job, delta) {
    for (let i = 0; i < Math.abs(delta); i++) {
      if (delta > 0) {
        if (countJob(job) >= slots(job)) break;
        const p = save.people.find((q) => q.job === 'idle');
        if (!p) break;
        p.job = job;
      } else {
        let idx = -1;
        for (let k = save.people.length - 1; k >= 0; k--) if (save.people[k].job === job) { idx = k; break; }
        if (idx < 0) break;
        save.people[idx].job = 'idle';
      }
    }
    persist(); renderAll();
  }
  // Répartition automatique : d'abord ce qui manque, puis ce qui est le plus bas en réserve
  function autoAssign() {
    let n = 0;
    for (let guard = 0; guard < 600; guard++) {
      const c = jobCounts();
      if (!c.idle) break;
      const { prod, cons } = rates();
      const free = JKEYS.filter((j) => jobUnlocked(j) && c[j] < slots(j) && !(JOBS[j].season && JOBS[j].season[season().id] === 0));
      if (!free.length) break;
      const score = (j) => {
        const r = JOBS[j].res, net = prod[r] - cons[r];
        const deficit = net < 0 ? 100 + -net * 10 : 0;
        return deficit + (1 - save.res[r] / cap()) * 10 + jobRate(j) * 0.01;
      };
      free.sort((a, b) => score(b) - score(a));
      const p = save.people.find((q) => q.job === 'idle');
      p.job = free[0]; n++;
    }
    toast(n ? `${n} habitant${n > 1 ? 's ont' : ' a'} reçu un métier.` : 'Aucun poste libre : construis de quoi employer tes habitants.');
    persist(); renderAll();
  }

  // ---------- Journal ----------
  function log(text) { save.log.unshift({ d: save.day, text }); save.log = save.log.slice(0, 50); }

  // ---------- Simulation ----------
  let hudDirty = true;
  function step(dtGame) {
    const days = dtGame / DAY;
    const { prod, cons } = rates();
    const c = cap();
    const counts = jobCounts();
    // Les ateliers de transformation consomment leurs matières : s'il en manque, ils tournent au ralenti
    const convOut = {}, convCons = {}, convProd = {};
    for (const j of JKEYS) {
      const J = JOBS[j];
      if (!J.inputs || !counts[j]) continue;
      const full = counts[j] * jobRate(j);
      convProd[J.res] = (convProd[J.res] || 0) + full;
      for (const [k, v] of Object.entries(J.inputs)) convCons[k] = (convCons[k] || 0) + full * v;
      const want = full * days;
      let ratio = 1;
      for (const [k, v] of Object.entries(J.inputs)) ratio = Math.min(ratio, want * v > 0 ? save.res[k] / (want * v) : 1);
      ratio = clamp(ratio, 0, 1);
      for (const [k, v] of Object.entries(J.inputs)) save.res[k] = Math.max(0, save.res[k] - want * v * ratio);
      convOut[J.res] = (convOut[J.res] || 0) + want * ratio;
    }
    for (const k of RKEYS) {
      const directProd = prod[k] - (convProd[k] || 0);
      const directCons = cons[k] - (convCons[k] || 0);
      const gain = directProd * days + (convOut[k] || 0);
      save.res[k] = clamp(save.res[k] + gain - directCons * days, 0, c);
      if (gain > 0) save.stats.made[k] = (save.stats.made[k] || 0) + gain;
      short[k] = save.res[k] <= 0.001 && (prod[k] - cons[k]) < 0;
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
      const h = save.era >= 3 ? "il faut de l'énergie pour chauffer les tours" : 'il faut du bois pour se chauffer';
      const msg = { printemps: 'Printemps : les buissons refleurissent.', ete: 'Été : la cueillette et les champs donnent davantage.', automne: "Automne : grosses récoltes. Fais des réserves pour l'hiver !", hiver: `L'hiver arrive : plus de cueillette ni de champs, et ${h}.` }[now.id];
      log(msg); toast(msg);
    }
    const n = save.people.length;
    save.hunger = short.food ? save.hunger + 1 : 0;
    save.thirst = short.water ? save.thirst + 1 : 0;
    const h = heatingNeed();
    save.cold = h.res && short[h.res] ? save.cold + 1 : 0;
    const k = Math.max(1, Math.ceil(n * 0.05));
    if (save.thirst >= 1) removeVillagers(k, "il n'y a plus d'eau");
    else if (save.hunger >= 2) removeVillagers(k, 'la faim dure depuis deux jours');
    else if (save.cold >= 2) removeVillagers(k, 'il fait trop froid');
    else if (save.happy < 25 && Math.random() < 0.5) removeVillagers(k, 'la vie ici est trop dure');
    else if (save.happy >= 45 && n < housing() && save.res.food >= n && save.res.water >= n) {
      let arrivals = Math.max(1, Math.ceil(n * 0.08 * (save.happy >= 80 ? 1.5 : 1)));
      arrivals = Math.min(arrivals, housing() - n);
      const names = [];
      for (let i = 0; i < arrivals; i++) names.push(addVillager());
      const msg = names.length === 1 ? `${names[0]} s'installe à Clairval.` : names.length === 2 ? `${names[0]} et ${names[1]} s'installent à Clairval.` : `${names.length} nouveaux habitants s'installent à Clairval.`;
      log(msg); toast(msg + ' Donne-leur un métier (onglet Habitants).');
    }
    save.mods = save.mods.map((m) => ({ ...m, d: m.d - 1 })).filter((m) => m.d > 0);
    for (const t of save.trees) if (t.hp <= 0 && --t.stump <= 0) t.hp = 5;
    save.berries = save.berries.map((b) => (winter() ? 0 : Math.min(6, b + 3)));
    save.hist.push(save.people.length); save.hist = save.hist.slice(-60);
    if (save.day > 3 && Math.random() < 0.3) setTimeout(randomEvent, 400);
    persist(); renderAll();
  }

  // ---------- Événements ----------
  const lbl = (o) => Object.entries(o).map(([k, v]) => `${v} ${RES[k].name.toLowerCase()}`).join(', ');
  const EVENTS = [
    { w: 3, ok: () => true, run() {
      const pool = [
        { give: { wood: 20 }, get: { stone: 12 } }, { give: { food: 15 }, get: { wood: 20 } },
        { give: { stone: 15 }, get: { food: 20 } }, { give: { wood: 15 }, get: { water: 20 } },
      ];
      if (save.era >= 2) pool.push({ give: { gold: 30 }, get: { tools: 8 } }, { give: { brick: 30 }, get: { iron: 20 } }, { give: { food: 40 }, get: { gold: 35 } });
      if (save.era >= 3) pool.push({ give: { gold: 80 }, get: { steel: 10 } }, { give: { brick: 60 }, get: { energy: 50 } });
      const offers = pool.sort(() => Math.random() - 0.5).slice(0, 2);
      showCard('Événement', 'Un marchand ambulant', 'Il pose sa charrette sur la place et propose des échanges.',
        [...offers.map((o) => ({ label: `Donner ${lbl(o.give)} contre ${lbl(o.get)}`, ok: canPay(o.give), fn() { pay(o.give); give(o.get); log(`Échange avec le marchand : ${lbl(o.give)} contre ${lbl(o.get)}.`); } })), { label: 'Non merci' }]);
    } },
    { w: 2, ok: () => save.res.wood > 10, run() { const lost = Math.round(save.res.wood * 0.15); save.res.wood -= lost; log(`Une tempête a abîmé la réserve de bois (−${lost} bois).`); toast(`Tempête ! −${lost} bois.`); } },
    { w: 2, ok: () => !winter(), run() { give({ food: 20 * save.era }); log(`Belle trouvaille en forêt : +${20 * save.era} nourriture.`); toast(`Belle trouvaille : +${20 * save.era} nourriture.`); } },
    { w: 2, ok: () => save.people.length < housing() && save.happy >= 40, run() {
      const k = Math.min(housing() - save.people.length, Math.max(2, Math.ceil(save.people.length * 0.05)));
      for (let i = 0; i < k; i++) addVillager();
      log(`Des voyageurs arrivent : ${k} restent à Clairval.`); toast(`Des voyageurs arrivent : ${k} restent à Clairval.`);
    } },
    { w: 2, ok: () => save.people.length >= 5, run() {
      if (save.build.guerisseuse || save.build.hopital) { log('Une fièvre a touché la ville, vite soignée.'); toast('Une fièvre a vite été soignée.'); }
      else { save.mods.push({ l: 'Fièvre', v: -12, d: 3 }); log('Une fièvre touche Clairval (−12 bonheur pendant 3 jours).'); toast('Fièvre : −12 bonheur pendant 3 jours. Une guérisseuse aiderait.'); }
    } },
    { w: 2, ok: () => winter() && save.res.food > 10 && save.era < 3, run() { const lost = Math.round(save.res.food * 0.1); save.res.food -= lost; log(`Des loups ont rôdé près du grenier (−${lost} nourriture).`); toast(`Des loups ont volé ${lost} de nourriture.`); } },
    { w: 1, ok: () => save.happy >= 70, run() { save.mods.push({ l: 'Souvenir de la fête', v: 8, d: 3 }); log('Les habitants font la fête (+8 bonheur pendant 3 jours).'); toast('Une fête spontanée ! +8 bonheur.'); } },
    { w: 2, ok: () => save.era >= 2, run() {
      if (save.build.caserne) { log('Un départ de feu, éteint par les pompiers.'); toast('Les pompiers ont éteint un incendie.'); }
      else { const w = Math.round(save.res.wood * 0.2), b = Math.round(save.res.brick * 0.2); save.res.wood -= w; save.res.brick -= b; log(`Incendie ! −${w} bois, −${b} briques. Une caserne l'aurait évité.`); toast(`Incendie ! −${w} bois, −${b} briques.`); }
    } },
    { w: 1, ok: () => save.era >= 2, run() { give({ gold: 30 * save.era }); log(`Foire annuelle : +${30 * save.era} or.`); toast(`Foire annuelle : +${30 * save.era} or.`); } },
    { w: 2, ok: () => save.era >= 3 && save.res.energy > 10, run() { const lost = Math.round(save.res.energy * 0.3); save.res.energy -= lost; log(`Panne sur le réseau (−${lost} énergie).`); toast(`Panne de courant : −${lost} énergie.`); } },
  ];
  function randomEvent() {
    if (!ui.card.hidden) return;
    const list = EVENTS.filter((e) => e.ok());
    let r = Math.random() * list.reduce((a, e) => a + e.w, 0);
    for (const e of list) { r -= e.w; if (r <= 0) { e.run(); break; } }
    persist(); renderAll();
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  const dctx = dark.getContext('2d');
  const ui = { card: $('card'), toast: $('toast') };
  let W = 0, H = 0, dpr = 1, z = 1, gy = 0, VW = 1240;
  function applyEra() { VW = era().vw; resize(); }
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    for (const c of [canvas, dark]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    z = clamp((H * 0.5) / 250, 1, 1.7) * era().zoom;
    gy = H * 0.5 - 64 * z;
    camTarget = camX = clampCam(camX);
  }
  window.addEventListener('resize', resize);

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

  // ---------- Interface ----------
  let tab = 'build';
  function renderHud() {
    const { prod, cons } = rates();
    const c = cap();
    const row = $('res-row');
    const keys = unlockedRes();
    if (row.children.length !== keys.length) {
      row.innerHTML = '';
      row.dataset.n = keys.length; row.classList.toggle('compact', keys.length > 4);
      for (const k of keys) {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'res'; el.dataset.k = k;
        el.setAttribute('aria-label', `${RES[k].name} : aller à la source`);
        el.innerHTML = `<span class="lbl"><i style="background:${RES[k].color}"></i>${RES[k].short}</span><strong></strong><span class="rate"></span>`;
        row.appendChild(el);
      }
    }
    for (const el of row.children) {
      const k = el.dataset.k, net = prod[k] - cons[k];
      el.classList.toggle('alert', !!(short[k] || (net < 0 && save.res[k] < -net)));
      el.querySelector('strong').innerHTML = `${Math.floor(save.res[k])}<small>/${c}</small>`;
      const r = el.querySelector('.rate');
      r.className = 'rate ' + (net > 0.05 ? 'up' : net < -0.05 ? 'down' : '');
      r.textContent = `${net > 0 ? '+' : ''}${fmt(net)}/j`;
    }
    $('pop-chip').innerHTML = `${era().name} · <strong>${save.people.length}/${housing()}</strong> hab.`;
    const h = Math.round(save.happy);
    $('happy-chip').innerHTML = `Bonheur <strong style="color:${h >= 60 ? '#9fd46b' : h >= 35 ? '#e0a35a' : '#ef6b52'}">${h} %</strong>`;
    $('time-chip').innerHTML = `Jour ${save.day} · <strong>${season().name}</strong> · ${String(Math.floor(save.t * 24)).padStart(2, '0')} h`;
  }
  function renderSpeed() { for (const b of document.querySelectorAll('.speed button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === save.speed)); }

  function costHtml(c) {
    return Object.entries(c).map(([k, v]) => `<span class="${save.res[k] < v ? 'miss' : ''}"><i style="background:${RES[k].color}"></i>${v} ${RES[k].name.toLowerCase()}</span>`).join('');
  }
  const keepFocus = (fn) => { const id = document.activeElement && document.activeElement.id; fn(); if (id && $(id)) $(id).focus(); };
  const openEras = new Set([1]);

  function renderBuild() {
    keepFocus(() => {
      const box = $('tab-build');
      box.innerHTML = '<p class="help">Chaque construction apparaît dans le monde. Récolte à la main au début, puis donne des métiers à tes habitants.</p>';
      openEras.add(save.era);
      for (const E of ERAS) {
        const open = E.n <= save.era;
        const sec = document.createElement('details');
        sec.className = 'era-block';
        sec.open = openEras.has(E.n);
        sec.addEventListener('toggle', () => { if (sec.open) openEras.add(E.n); else openEras.delete(E.n); });
        sec.innerHTML = `<summary>${E.name}${open ? '' : ' <small>· pas encore débloqué</small>'}</summary>`;
        for (const b of BUILDINGS.filter((x) => x.era === E.n)) {
          const l = save.build[b.id], maxed = l >= b.max, c = costOf(b);
          const lockedPop = b.need && save.people.length < b.need;
          const d = document.createElement('div');
          d.className = 'bld' + (!open || lockedPop ? ' locked' : '');
          d.innerHTML = `<h3>${b.name} <small>${l}/${b.max} · ${b.cat}</small></h3><p>${b.desc}</p>
            <div class="cost">${maxed ? '<span>Complet</span>' : !open ? `<span>Ère ${E.name}</span>` : lockedPop ? `<span>Il faut ${b.need} habitants</span>` : costHtml(c)}</div>
            <button type="button" id="b-${b.id}" ${maxed || !open || lockedPop || !canPay(c) ? 'disabled' : ''}>${maxed ? 'Fini' : l ? 'Agrandir' : 'Construire'}</button>`;
          d.querySelector('button').addEventListener('click', () => build(b.id));
          sec.appendChild(d);
        }
        box.appendChild(sec);
      }
    });
  }

  function renderPeople() {
    keepFocus(() => {
      const box = $('tab-people');
      const { prod, cons } = rates();
      const n = save.people.length, c = jobCounts();
      const h = heatingNeed();
      let html = `<p class="help"><strong>${n}</strong> habitants pour <strong>${housing()}</strong> lits · <strong>${c.idle}</strong> sans métier. Chacun mange 1 et boit 1 par jour${save.era >= 3 ? ', et consomme 0,2 énergie' : ''}. En hiver il faut ${save.era >= 3 ? "de l'énergie" : 'du bois'} pour se chauffer.</p>
        <canvas class="spark" id="spark" aria-label="Population des 60 derniers jours"></canvas><div class="needs">`;
      const rows = [['food', 'Nourriture'], ['water', 'Eau'], [h.res || (save.era >= 3 ? 'energy' : 'wood'), 'Chauffage']];
      if (save.era >= 3) rows.push(['energy', 'Électricité']);
      for (const [k, label] of rows) {
        if (label === 'Chauffage' && !h.res) { html += `<div class="need"><span>${label}</span><span class="help">Seulement en hiver</span><span></span></div>`; continue; }
        const net = prod[k] - cons[k];
        const days = net < 0 ? save.res[k] / -net : Infinity;
        const pct = Math.min(100, (prod[k] / Math.max(0.01, cons[k])) * 100);
        html += `<div class="need"><span>${label}</span><span class="bar"><i style="width:${pct}%;background:${pct >= 100 ? '#9fd46b' : pct >= 70 ? '#e0a35a' : '#ef6b52'}"></i></span>
          <span class="${net >= 0 ? 'ok' : 'ko'}">${net >= 0 ? 'Assez' : days < 1 ? 'Manque !' : `${Math.floor(days)} j de réserve`}</span></div>`;
      }
      html += '</div><h3>Bonheur</h3><ul class="happy-list">';
      for (const [l, v] of happinessFactors()) html += `<li><span>${l}</span><span class="${v >= 0 ? 'p' : 'm'}">${v > 0 ? '+' : ''}${v}</span></li>`;
      html += `</ul><p class="help">Au-dessus de 45 %, de nouveaux habitants arrivent s'il reste des lits et des réserves. Sous 25 %, des habitants partent.</p>
        <div class="row between"><h3>Métiers</h3><button class="chip" type="button" id="auto-assign">Répartir automatiquement</button></div>`;
      box.innerHTML = html;
      $('auto-assign').addEventListener('click', autoAssign);
      const big = n >= 20;
      for (const j of JKEYS) {
        const J = JOBS[j], s = slots(j), cj = c[j];
        if (!jobUnlocked(j) && !cj) continue;
        const d = document.createElement('div');
        d.className = 'job' + (big ? ' big' : '');
        const lock = s === 0;
        const inputs = J.inputs ? ` (utilise ${Object.entries(J.inputs).map(([k, v]) => `${fmt(v)} ${RES[k].name.toLowerCase()}`).join(' + ')})` : '';
        d.innerHTML = `<span class="name">${J.name}<small>${lock ? `Il faut : ${BY_ID[J.bld].name}` : `+${fmt(jobRate(j))} ${RES[J.res].name.toLowerCase()}/jour chacun${inputs}`}</small></span>
          ${big ? `<button type="button" id="j-${j}-mm" aria-label="Retirer 10 ${J.name.toLowerCase()}s" ${cj ? '' : 'disabled'}>−10</button>` : ''}
          <button type="button" id="j-${j}-m" aria-label="Retirer un ${J.name.toLowerCase()}" ${cj ? '' : 'disabled'}>−</button>
          <span class="count">${cj}/${s}</span>
          <button type="button" id="j-${j}-p" aria-label="Ajouter un ${J.name.toLowerCase()}" ${cj < s && c.idle ? '' : 'disabled'}>+</button>
          ${big ? `<button type="button" id="j-${j}-pp" aria-label="Ajouter 10 ${J.name.toLowerCase()}s" ${cj < s && c.idle ? '' : 'disabled'}>+10</button>` : ''}`;
        d.querySelector(`#j-${j}-m`).addEventListener('click', () => assign(j, -1));
        d.querySelector(`#j-${j}-p`).addEventListener('click', () => assign(j, 1));
        if (big) { d.querySelector(`#j-${j}-mm`).addEventListener('click', () => assign(j, -10)); d.querySelector(`#j-${j}-pp`).addEventListener('click', () => assign(j, 10)); }
        box.appendChild(d);
      }
      drawSpark();
    });
  }
  function drawSpark() {
    const cv = $('spark'); if (!cv) return;
    const r = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 300, h = cv.clientHeight || 56;
    cv.width = w * r; cv.height = h * r;
    const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0);
    const data = save.hist.length ? [...save.hist, save.people.length] : [save.people.length, save.people.length];
    const max = Math.max(...data, 5);
    c.fillStyle = 'rgba(224,163,90,0.18)'; c.strokeStyle = '#e0a35a'; c.lineWidth = 2;
    c.beginPath();
    data.forEach((v, i) => { const x = 4 + (i / (data.length - 1)) * (w - 8), y = h - 6 - (v / max) * (h - 20); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    c.lineTo(w - 4, h - 4); c.lineTo(4, h - 4); c.closePath(); c.fill();
    c.fillStyle = '#b9b59a'; c.font = '11px "Nunito Sans", system-ui, sans-serif';
    c.fillText(`Population · record ${save.stats.maxPop}`, 6, 12);
  }

  function goalState(g) { const v = Math.min(g.goal, g.get()); return { v, done: v >= g.goal, claimed: !!save.claimed[g.id] }; }
  function renderProgress() {
    keepFocus(() => {
      const box = $('tab-progress');
      box.innerHTML = '';
      const next = ERAS[save.era];
      const card = document.createElement('div');
      card.className = 'era-card';
      if (next) {
        const needs = next.needs.map(([l, get, g]) => { const v = get(); return `<li class="${v >= g ? 'ok' : ''}">${l} : ${Math.min(v, g)}/${g}</li>`; }).join('');
        const ready = next.needs.every(([, get, g]) => get() >= g) && canPay(next.cost);
        card.innerHTML = `<p class="kicker">Ère actuelle : ${era().name}</p><h3>Devenir une ${next.name.toLowerCase()}</h3>
          <ul class="checklist">${needs}</ul><div class="cost">${costHtml(next.cost)}</div>
          <button type="button" id="era-up" ${ready ? '' : 'disabled'}>Passer à l'ère ${next.name}</button>`;
        card.querySelector('button').addEventListener('click', eraUp);
      } else {
        card.innerHTML = `<p class="kicker">Ère actuelle</p><h3>Mégacité</h3><p class="help">Clairval est au sommet. Continue à la faire grandir jusqu'à la Tour de Clairval et au-delà.</p>`;
      }
      box.appendChild(card);
      const h = document.createElement('h3'); h.textContent = 'Améliorations'; box.appendChild(h);
      for (const t of TECHS.filter((x) => x.era <= save.era)) {
        const owned = hasTech(t.id);
        const d = document.createElement('div');
        d.className = 'bld' + (owned ? ' owned' : '');
        d.innerHTML = `<h3>${t.name} <small>${ERAS[t.era - 1].name}</small></h3><p>${t.desc}</p><div class="cost">${owned ? '<span>Acquise</span>' : costHtml(t.cost)}</div>
          <button type="button" id="t-${t.id}" ${owned || !canPay(t.cost) ? 'disabled' : ''}>${owned ? 'Acquise' : 'Acheter'}</button>`;
        d.querySelector('button').addEventListener('click', () => {
          if (hasTech(t.id) || !canPay(t.cost)) return;
          pay(t.cost); save.techs[t.id] = true;
          log(`Amélioration : ${t.name} (${t.desc.toLowerCase()}).`); toast(`${t.name} : ${t.desc}.`);
          persist(); renderAll();
        });
        box.appendChild(d);
      }
      const locked = TECHS.filter((t) => t.era > save.era).length;
      if (locked) { const p = document.createElement('p'); p.className = 'help'; p.textContent = `${locked} améliorations se débloquent aux ères suivantes.`; box.appendChild(p); }
      const h2 = document.createElement('h3'); h2.textContent = 'Objectifs'; box.appendChild(h2);
      for (const g of GOALS.filter((x) => x.era <= save.era)) {
        const s = goalState(g);
        const rw = Object.entries(g.reward).map(([k, v]) => `+${v} ${RES[k].name.toLowerCase()}`).join(', ');
        const d = document.createElement('div');
        d.className = 'goal' + (s.claimed ? ' done' : '');
        d.innerHTML = `<h3>${g.text}</h3><p>${s.v}/${g.goal} · Récompense : ${rw}</p><div class="bar"><i style="width:${(s.v / g.goal) * 100}%"></i></div>
          <button type="button" id="g-${g.id}" ${s.done && !s.claimed ? '' : 'disabled'}>${s.claimed ? 'Reçu' : 'Réclamer'}</button>`;
        d.querySelector('button').addEventListener('click', () => {
          if (!goalState(g).done || save.claimed[g.id]) return;
          save.claimed[g.id] = true; give(g.reward);
          log(`Objectif atteint : ${g.text} (${rw}).`); toast(`Récompense reçue : ${rw}.`);
          persist(); renderAll();
        });
        box.appendChild(d);
      }
    });
  }

  // Marché : troc au début, puis vente et achat contre de l'or
  const market = { give: 'wood', get: 'stone', qty: 10 };
  function tradeQuote() {
    const g = market.give, r = market.get, q = market.qty;
    if (g === r) return null;
    const m = save.build.marche, bank = hasTech('t_banque');
    if (g === 'gold' || r === 'gold') {
      if (!m) return { err: "Il faut un marché pour utiliser l'or." };
      if (r === 'gold') return { cost: q, gain: Math.max(1, Math.floor(q * RES[g].val * (bank ? 0.95 : 0.8))) };
      return { cost: Math.ceil(q * RES[r].val * (bank ? 1.1 : 1.3)), gain: q };
    }
    const rate = m >= 2 ? 1.33 : m >= 1 ? 1.5 : 2;
    return { cost: q, gain: Math.max(1, Math.floor((q / rate) * (RES[g].val / RES[r].val))) };
  }
  function renderMarket() {
    keepFocus(() => {
      const box = $('tab-market');
      const keys = unlockedRes();
      if (!keys.includes(market.give)) market.give = 'wood';
      if (!keys.includes(market.get)) market.get = 'stone';
      const opts = (sel) => keys.map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${RES[k].name} (${Math.floor(save.res[k])})</option>`).join('');
      const qt = tradeQuote();
      const m = save.build.marche;
      box.innerHTML = `<p class="help">${m ? `Le marché (niveau ${m}) donne de meilleurs taux et permet de vendre ou d'acheter contre de l'or.` : "Sans marché, les colporteurs troquent à 2 pour 1. Construis un marché (ère Ville) pour de meilleurs taux et pour l'or."}</p>
        <div class="trade">
          <label for="m-give">Je donne</label><select id="m-give">${opts(market.give)}</select>
          <label for="m-get">Je reçois</label><select id="m-get">${opts(market.get)}</select>
        </div>
        <div class="row" role="group" aria-label="Quantité">${[10, 50, 100].map((q) => `<button type="button" class="chip" id="m-q${q}" aria-pressed="${market.qty === q}">${q}</button>`).join('')}</div>
        <p class="quote">${!qt ? 'Choisis deux ressources différentes.' : qt.err ? qt.err : `Tu donnes <strong>${qt.cost} ${RES[market.give].name.toLowerCase()}</strong>, tu reçois <strong>${qt.gain} ${RES[market.get].name.toLowerCase()}</strong>.`}</p>
        <button type="button" class="big-btn" id="m-go" ${qt && !qt.err && save.res[market.give] >= qt.cost ? '' : 'disabled'}>Échanger</button>
        <h3>Valeur des ressources</h3>
        <ul class="happy-list">${keys.map((k) => `<li><span>${RES[k].name}</span><span>${RES[k].val} or</span></li>`).join('')}</ul>`;
      $('m-give').addEventListener('change', (e) => { market.give = e.target.value; renderMarket(); $('m-give').focus(); });
      $('m-get').addEventListener('change', (e) => { market.get = e.target.value; renderMarket(); $('m-get').focus(); });
      for (const q of [10, 50, 100]) $(`m-q${q}`).addEventListener('click', () => { market.qty = q; renderMarket(); });
      $('m-go').addEventListener('click', () => {
        const t = tradeQuote();
        if (!t || t.err || save.res[market.give] < t.cost) return;
        if (save.res[market.get] + t.gain > cap()) { toast('Pas assez de place dans les réserves.'); return; }
        save.res[market.give] -= t.cost; save.res[market.get] += t.gain;
        log(`Marché : ${t.cost} ${RES[market.give].name.toLowerCase()} contre ${t.gain} ${RES[market.get].name.toLowerCase()}.`);
        toast(`Échange fait : +${t.gain} ${RES[market.get].name.toLowerCase()}.`);
        persist(); renderAll();
      });
    });
  }
  function renderLog() { $('log').innerHTML = save.log.map((e) => `<li><small>Jour ${e.d}</small>${e.text.replace(/</g, '&lt;')}</li>`).join('') || "<li>Rien pour l'instant.</li>"; }
  function renderBadges() {
    const idle = idleCount();
    const ib = $('idle-badge'); ib.hidden = !idle; ib.textContent = idle;
    const g = GOALS.filter((x) => x.era <= save.era && goalState(x).done && !save.claimed[x.id]).length;
    const next = ERAS[save.era];
    const eraReady = next && next.needs.every(([, get, gg]) => get() >= gg) && canPay(next.cost) ? 1 : 0;
    const gb = $('goal-badge'); gb.hidden = !(g + eraReady); gb.textContent = g + eraReady;
    for (const x of GOALS) {
      if (x.era <= save.era && goalState(x).done && !save.notified[x.id] && !save.claimed[x.id]) { save.notified[x.id] = true; toast(`Objectif atteint : ${x.text}. Réclame ta récompense (onglet Progrès).`); }
    }
  }
  function renderTab() {
    for (const b of document.querySelectorAll('.tabs button')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(on));
      $('tab-' + b.dataset.tab).hidden = !on;
    }
    ({ build: renderBuild, people: renderPeople, progress: renderProgress, market: renderMarket, log: renderLog })[tab]();
  }
  function renderAll() { renderHud(); renderTab(); renderBadges(); }

  function build(id) {
    const b = BY_ID[id], c = costOf(b);
    if (b.era > save.era || save.build[id] >= b.max || !canPay(c) || (b.need && save.people.length < b.need)) return;
    pay(c);
    save.build[id]++;
    log(`${b.name} : ${save.build[id] > 1 ? `niveau ${save.build[id]}` : 'construction terminée'}.`);
    celebrate(id);
    if (id === 'beffroi' && !save.won) {
      save.won = true;
      setTimeout(() => showCard('Grande étape', 'Le beffroi sonne', `${save.people.length} habitants dansent sur la place. Clairval peut maintenant devenir une ville : ouvre l'onglet Progrès.`, [{ label: 'Continuer' }]), 900);
    } else if (id === 'tourclairval' && !save.wonMega) {
      save.wonMega = true;
      setTimeout(() => showCard('Victoire', 'La Tour de Clairval', `Du haut de la tour, on voit toute la mégacité : ${save.people.length} habitants, et chacun mange, boit, a chaud et de la lumière le soir. Tu as fait d'une clairière une mégacité.\n\nTu peux continuer à la faire grandir.`, [{ label: 'Continuer' }]), 900);
    } else {
      const job = JKEYS.find((j) => JOBS[j].bld === id);
      toast(job ? `${b.name} : +${JOBS[job].per} postes de ${JOBS[job].name.toLowerCase()}. Onglet Habitants pour les pourvoir.` : `${b.name} : ${b.desc}.`);
    }
    persist(); renderAll();
  }
  function eraUp() {
    const next = ERAS[save.era];
    if (!next || !next.needs.every(([, get, g]) => get() >= g) || !canPay(next.cost)) return;
    pay(next.cost);
    save.era = next.n;
    log(`Clairval devient une ${next.name.toLowerCase()} !`);
    applyEra();
    camTarget = clampCam(next.n === 2 ? 1570 : 2600);
    bounce = { id: 'era', t0: time };
    showCard('Nouvelle ère', `Clairval devient une ${next.name.toLowerCase()}`, next.story, [{ label: 'Découvrir' }]);
    persist(); renderAll();
  }

  // ---------- Monde : géométrie ----------
  const TREE_X = [16, 40, 66, 90, 116, 140, 164, 188];
  const BUSH_X = [214, 238, 262];
  const ROCK_X = [1118, 1150, 1184, 1216];
  const IRON_X = [1240, 1264, 1290];
  const SOLAR_X = [2180, 2202];
  const FRONT = {
    bucheron: 308, grenier: 402, puits: 494, place: 584, taverne: 676, guerisseuse: 768, atelier: 862, pecheur: 958, carriere: 1058,
    mine: 1335, forge: 1422, briqueterie: 1512, caserne: 1602, marche: 1692, elevage: 1792, ecole: 1892, theatre: 1988, entrepot: 2082,
    centrale: 2245, acierie: 2352, serres: 2460, pompage: 2568, hopital: 2668, parc: 2768, metro: 2868, megaentrepot: 2968, bureaux: 3070,
  };
  const HOUSES = [362, 414, 466, 518, 744, 796, 848, 900];
  const IMMEUBLES = [1300, 1368, 1436, 1504, 1640, 1708, 1776, 1844, 1912, 1980];
  const TOURS = [2200, 2262, 2324, 2386, 2448, 2510, 2690, 2752, 2814, 2876, 2938, 3000];
  const BACK_Y = -22;
  let camX = 584, camTarget = 584;
  const clampCam = (c) => { const half = W / 2 / z; return VW <= 2 * half ? VW / 2 : clamp(c, half, VW - half); };
  const toScreen = (wx, wy) => [W / 2 + (wx - camX) * z, gy + wy * z];
  const onScreen = (x, m) => Math.abs(x - camX) * z < W / 2 + (m || 80) * z;

  // ---------- Effets ----------
  let floats = [], sparks = [], bounce = { id: null, t0: -9 }, time = 0;
  function floatText(wx, wy, text, color) { floats.push({ x: wx, y: wy, text, color, life: 1.2 }); }
  function spotOf(id) {
    if (id === 'maison') return HOUSES[Math.max(0, save.build.maison - 1)];
    if (id === 'immeuble') return IMMEUBLES[Math.max(0, save.build.immeuble - 1)];
    if (id === 'tour') return TOURS[Math.max(0, save.build.tour - 1)];
    if (id === 'champ') return 1040;
    if (id === 'beffroi') return 632;
    if (id === 'tourclairval') return 2600;
    return FRONT[id];
  }
  function celebrate(id) {
    const x = spotOf(id);
    camTarget = clampCam(x);
    bounce = { id, t0: time };
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * TAU, v = 30 + Math.random() * 90;
      sparks.push({ x, y: -30, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 1 + Math.random() * 0.7 });
    }
  }
  const bounceScale = (id) => (bounce.id === id && time - bounce.t0 < 1.2 ? 1 + 0.2 * Math.sin((time - bounce.t0) * 12) * Math.exp(-(time - bounce.t0) * 3) : 1);

  // ---------- Récolte à la main ----------
  function gatherAt(wx, wy) {
    const c = cap(), amt = handAmount();
    const add = (k, x, y) => {
      if (save.res[k] >= c) { floatText(x, y, 'Réserve pleine', '#ef6b52'); return; }
      save.res[k] = Math.min(c, save.res[k] + amt);
      save.stats.gathered++;
      floatText(x, y, `+${amt} ${RES[k].name.toLowerCase()}`, RES[k].color);
      hudDirty = true; hideHint();
    };
    if (wy > 30 && wy < 60) { add('water', wx, 30); splash(wx); return true; }
    for (let i = 0; i < TREE_X.length; i++) {
      const t = save.trees[i];
      if (Math.abs(wx - TREE_X[i]) < 13 && wy < 4 && wy > -62) {
        if (t.hp <= 0) { floatText(TREE_X[i], -20, 'Repousse demain', '#b9b59a'); return true; }
        t.hp--; t.shake = time;
        add('wood', TREE_X[i], -50);
        if (t.hp <= 0) { t.stump = 1; floatText(TREE_X[i], -30, 'Timber !', '#e0a35a'); }
        return true;
      }
    }
    for (let i = 0; i < BUSH_X.length; i++) {
      if (Math.abs(wx - BUSH_X[i]) < 12 && wy < 4 && wy > -22) {
        if (save.berries[i] <= 0) { floatText(BUSH_X[i], -24, winter() ? 'Rien en hiver' : 'Plus de baies', '#b9b59a'); return true; }
        save.berries[i]--; add('food', BUSH_X[i], -24); return true;
      }
    }
    const chips = (x, col) => { for (let k = 0; k < 5; k++) sparks.push({ x, y: -14, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0.6, grey: col }); };
    for (const rx of ROCK_X) if (Math.abs(wx - rx) < 16 && wy < 4 && wy > -28) { add('stone', rx, -28); chips(rx, '#b5b6c4'); return true; }
    if (save.era >= 2) for (const rx of IRON_X) if (Math.abs(wx - rx) < 12 && wy < 4 && wy > -26) { add('iron', rx, -26); chips(rx, '#c07a50'); return true; }
    if (save.era >= 3) for (const sx of SOLAR_X) if (Math.abs(wx - sx) < 11 && wy < 4 && wy > -26) { add('energy', sx, -28); return true; }
    return false;
  }
  function splash(wx) { for (let k = 0; k < 6; k++) sparks.push({ x: wx, y: 36, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 40, life: 0.5, water: true }); }
  let hintHidden = false;
  function hideHint() { if (!hintHidden && save.stats.gathered > 5) { hintHidden = true; $('gather-hint').hidden = true; } }

  // ---------- Habitants animés (au plus 70 dessinés) ----------
  const MAX_WALKERS = 70;
  let walkers = [];
  function syncPeople() {
    const n = Math.min(MAX_WALKERS, save.people.length);
    while (walkers.length < n) walkers.push({ x: 560 + Math.random() * 60, tx: 580, y: 16, pause: 0, face: 1, seed: Math.random(), job: 'idle' });
    walkers.length = n;
  }
  function homeX(i) {
    const homes = [...HOUSES.slice(0, save.build.maison), ...IMMEUBLES.slice(0, save.build.immeuble), ...TOURS.slice(0, save.build.tour)];
    if (!homes.length) return 612 + (i % 2) * 34;
    return homes[i % homes.length];
  }
  function updateWalkers(dt, night) {
    // une part représentative de chaque métier
    const c = jobCounts(), total = save.people.length;
    const shown = [];
    if (total <= MAX_WALKERS) save.people.forEach((p) => shown.push(p.job));
    else for (const j of ['idle', ...JKEYS]) { const k = Math.round((c[j] / total) * MAX_WALKERS); for (let i = 0; i < k; i++) shown.push(j); }
    walkers.forEach((w, i) => {
      w.job = shown[i] || 'idle';
      let range;
      if (night) range = [homeX(i) - 2, homeX(i) + 2, 8];
      else if (w.job === 'idle') range = save.era >= 2 && i % 2 ? [1660, 1730, 16] : [548, 622, 16];
      else range = JOBS[w.job].where;
      w.ty = range[2];
      if (!night && w.pause > 100) w.pause = 0;
      if (w.pause > 0) w.pause -= dt;
      else if (Math.abs(w.x - w.tx) < 1.5 || w.tx < range[0] - 1 || w.tx > range[1] + 1) {
        if (Math.abs(w.x - w.tx) < 1.5) w.pause = night ? 999 : 1 + Math.random() * 2.5;
        w.tx = range[0] + Math.random() * (range[1] - range[0]);
      } else {
        const sp = (Math.abs(w.x - w.tx) > 300 ? 90 : 26) * dt;
        w.face = w.tx > w.x ? 1 : -1;
        w.x += clamp(w.tx - w.x, -sp, sp);
      }
      if (night && Math.abs(w.x - w.tx) > 2) w.pause = 0;
      w.y += ((w.ty || 16) - w.y) * Math.min(1, dt * 2);
    });
  }

  // ---------- Dessin ----------
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function glow(x, y, r, color) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circle(x, y, r); }
  const parseCol = (c) => (c[0] === '#' ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).slice(0, 3).map(Number));
  function mix(a, b, t) { const pa = parseCol(a), pb = parseCol(b); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`; }
  let lights = [];
  function light(wx, wy, r, a) { const [sx, sy] = toScreen(wx, wy); if (sx > -r * z && sx < W + r * z) lights.push({ x: sx, y: sy, r: r * z, a }); }
  function dayLight(t) {
    if (t < 0.18 || t > 0.86) return 0;
    if (t < 0.28) return (t - 0.18) / 0.1;
    if (t > 0.76) return (0.86 - t) / 0.1;
    return 1;
  }
  let L = 1;
  function house(x, y, w, h, wall, roof) {
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - h); ctx.lineTo(x, y - h - h * 0.75); ctx.lineTo(x + w / 2 + 5, y - h); ctx.fill();
    ctx.fillStyle = '#3a2618'; ctx.fillRect(x - 4, y - 12, 8, 12);
    ctx.fillStyle = '#f2c46b'; ctx.fillRect(x + w / 4 - 3, y - h + 7, 6, 6);
    light(x + w / 4, y - h + 10, 16, 0.9);
    if (winter()) { ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - h); ctx.lineTo(x, y - h - h * 0.75); ctx.lineTo(x + w / 2 + 5, y - h); ctx.lineTo(x + w / 2, y - h - 3); ctx.lineTo(x, y - h - h * 0.75 + 4); ctx.lineTo(x - w / 2, y - h - 3); ctx.fill(); }
  }
  // bâtiment à fenêtres (immeuble, tour) : les fenêtres s'allument au hasard le soir
  function block(x, y, w, h, wall, cols, rows, seed, winCol) {
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
    const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = rnd(seed * 97 + r * 13 + c) < (L < 0.5 ? 0.65 : 0.25);
      ctx.fillStyle = on ? (winCol || '#f2c46b') : 'rgba(20,24,34,0.75)';
      const wx = x - w / 2 + c * cw + cw * 0.25, wy = y - h + r * rh + rh * 0.25;
      ctx.fillRect(wx, wy, cw * 0.5, rh * 0.5);
      if (on && L < 0.5 && (r + c) % 3 === 0) light(wx + cw * 0.25, wy + rh * 0.25, 10, 0.7);
    }
  }
  function smoke(x, y, n, col) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const ph = (time * 0.3 + k / n) % 1;
      ctx.fillStyle = col || `rgba(220,220,225,${0.3 * (1 - ph)})`;
      if (col) ctx.globalAlpha = 1 - ph;
      circle(x + Math.sin(ph * 6 + k) * 3, y - ph * 34, 2.5 + ph * 5);
      ctx.globalAlpha = 1;
    }
  }

  function drawBuilding(id, lvl) {
    if (!lvl) return;
    const x = FRONT[id];
    if (!onScreen(x)) return;
    const s = bounceScale(id);
    ctx.save(); ctx.translate(x, 0); ctx.scale(s, s); ctx.translate(-x, 0);
    switch (id) {
      case 'bucheron':
        house(x, 0, 40, 26, '#6b4a2e', '#4a3020');
        for (let i = 0; i < lvl * 3; i++) { ctx.fillStyle = i % 2 ? '#a0703f' : '#8a5a2b'; circle(x + 26 + (i % 3) * 6, -3 - Math.floor(i / 3) * 6, 3); }
        break;
      case 'grenier':
        ctx.fillStyle = '#8a3b2a'; ctx.fillRect(x - 24, -34 - lvl * 6, 48, 34 + lvl * 6);
        ctx.fillStyle = '#5e2a20'; ctx.beginPath(); ctx.moveTo(x - 28, -34 - lvl * 6); ctx.quadraticCurveTo(x, -60 - lvl * 8, x + 28, -34 - lvl * 6); ctx.fill();
        ctx.strokeStyle = '#efe3c8'; ctx.lineWidth = 2; ctx.strokeRect(x - 9, -22, 18, 22); ctx.beginPath(); ctx.moveTo(x - 9, -22); ctx.lineTo(x + 9, 0); ctx.moveTo(x + 9, -22); ctx.lineTo(x - 9, 0); ctx.stroke();
        for (let i = 0; i < lvl; i++) { ctx.fillStyle = '#d9b36a'; ctx.fillRect(x + 26, -8 - i * 7, 10, 6); }
        break;
      case 'puits':
        ctx.fillStyle = '#7a6e66'; ctx.fillRect(x - 14, -12, 28, 12);
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 14, -34, 3, 22); ctx.fillRect(x + 11, -34, 3, 22);
        ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.moveTo(x - 20, -32); ctx.lineTo(x, -44); ctx.lineTo(x + 20, -32); ctx.fill();
        ctx.fillStyle = '#3f7fb0'; ctx.fillRect(x - 3, -24, 6, 6);
        if (lvl >= 2) { ctx.fillStyle = '#6b8fb0'; ctx.fillRect(x + 20, -8, 14, 8); ctx.fillStyle = '#7fc8ff'; ctx.fillRect(x + 21, -7, 12, 3); }
        break;
      case 'place':
        ctx.fillStyle = '#8a8378'; ctx.beginPath(); ctx.ellipse(x, -1, 34, 5, 0, 0, TAU); ctx.fill();
        if (lvl >= 2) {
          ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 10, -14, 20, 13); ctx.fillStyle = '#7fc8ff'; ctx.fillRect(x - 8, -12, 16, 3);
          if (!reduced) { ctx.fillStyle = 'rgba(160,210,255,0.8)'; for (let k = 0; k < 4; k++) circle(x - 6 + k * 4, -16 - Math.abs(Math.sin(time * 4 + k)) * 6, 1.5); }
        }
        ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x - 30, -36); ctx.moveTo(x + 30, 0); ctx.lineTo(x + 30, -36); ctx.stroke();
        ctx.strokeStyle = 'rgba(243,234,211,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 30, -34); ctx.quadraticCurveTo(x, -24, x + 30, -34); ctx.stroke();
        ['#e0a35a', '#c0503a', '#7fc8ff', '#9fd46b', '#b48cff'].forEach((c, k) => { const fx = x - 22 + k * 11, fy = -31 + Math.sin((k + 0.5) / 5 * Math.PI) * 6; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx - 3, fy); ctx.lineTo(fx + 3, fy); ctx.lineTo(fx, fy + 6); ctx.fill(); });
        break;
      case 'taverne':
        house(x, 0, 54, 34, '#7a5a3e', '#5e2a20');
        ctx.fillStyle = '#f2c46b'; ctx.fillRect(x - 20, -24, 8, 8); light(x - 16, -20, 18, 1);
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x + 27, -30, 14, 2); ctx.fillStyle = '#c9a33a'; ctx.fillRect(x + 32, -28, 8, 10);
        smoke(x - 16, -60, 3);
        break;
      case 'guerisseuse':
        house(x, 0, 40, 28, '#5a6b5a', '#3a4a3a');
        ctx.fillStyle = '#9fd46b'; for (let k = 0; k < 5; k++) circle(x - 26 + k * 3, -4 - (k % 2) * 3, 3);
        ctx.fillStyle = '#efe3c8'; ctx.fillRect(x - 2, -44, 4, 10); ctx.fillRect(x - 5, -41, 10, 4);
        break;
      case 'atelier': {
        house(x, 0, 50, 30, '#5a5048', '#3a3430');
        ctx.fillStyle = '#20171c'; ctx.fillRect(x + 12, -54, 8, 22); smoke(x + 16, -56, 3);
        const f = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 9);
        glow(x - 12, -8, 14 * f, 'rgba(255,130,50,0.6)'); light(x - 12, -8, 20, 0.9);
        if (lvl >= 2) { ctx.fillStyle = '#9aa3ad'; ctx.save(); ctx.translate(x - 32, -26); ctx.rotate(reduced ? 0 : time); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-1.5, 0, 3, 10); } ctx.restore(); }
        break;
      }
      case 'pecheur':
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 24, 28, 48, 4); for (const px of [-20, 0, 20]) ctx.fillRect(x + px, 28, 3, 22);
        house(x, 26, 30, 20, '#5a7078', '#3a4a52');
        if (lvl >= 2) { ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.ellipse(x + 34, 42, 12, 4, 0, 0, Math.PI); ctx.fill(); }
        ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 22, 28); ctx.lineTo(x + 40, 10); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 40, 10); ctx.lineTo(x + 42, 40); ctx.stroke();
        break;
      case 'carriere':
        ctx.fillStyle = '#6a6a74'; ctx.beginPath(); ctx.moveTo(x - 34, 0); ctx.lineTo(x - 20, -26); ctx.lineTo(x + 6, -32); ctx.lineTo(x + 30, -18); ctx.lineTo(x + 36, 0); ctx.fill();
        ctx.fillStyle = '#8a8a96'; ctx.fillRect(x - 12, -18, 10, 8); ctx.fillRect(x + 4, -14, 12, 8);
        for (let i = 0; i < lvl * 2; i++) { ctx.fillStyle = '#b5b6c4'; ctx.fillRect(x - 34 - (i % 2) * 8, -5 - Math.floor(i / 2) * 5, 7, 5); }
        ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 20, 0); ctx.lineTo(x + 26, -40); ctx.lineTo(x + 40, -30); ctx.stroke();
        break;
      // --- Ville ---
      case 'mine':
        ctx.fillStyle = '#4a4550'; ctx.beginPath(); ctx.moveTo(x - 36, 0); ctx.lineTo(x - 26, -30); ctx.lineTo(x + 20, -36); ctx.lineTo(x + 36, 0); ctx.fill();
        ctx.fillStyle = '#1a1418'; ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x - 10, -14); ctx.arc(x, -14, 10, Math.PI, 0); ctx.lineTo(x + 10, 0); ctx.fill();
        ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 12, 0); ctx.lineTo(x - 12, -16); ctx.arc(x, -16, 12, Math.PI, 0); ctx.lineTo(x + 12, 0); ctx.stroke();
        for (let i = 0; i < lvl; i++) { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + 16 + i * 12, -7, 10, 6); ctx.fillStyle = '#8f9bb0'; circle(x + 19 + i * 12, -8, 2.5); circle(x + 23 + i * 12, -8, 2); ctx.fillStyle = '#222'; circle(x + 18 + i * 12, -1, 1.5); circle(x + 24 + i * 12, -1, 1.5); }
        glow(x, -8, 12, 'rgba(255,190,90,0.5)'); light(x, -8, 16, 0.8);
        break;
      case 'forge': {
        house(x, 0, 48, 32, '#4a3f46', '#2a2026');
        ctx.fillStyle = '#20171c'; ctx.fillRect(x - 18, -58, 9, 26); smoke(x - 14, -60, 4);
        const f = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 10) * Math.sin(time * 6);
        glow(x + 12, -10, 18 * f, 'rgba(255,110,40,0.7)'); light(x + 12, -10, 24, 1);
        ctx.fillStyle = '#5b5e66'; ctx.fillRect(x + 26, -10, 14, 4); ctx.fillRect(x + 30, -6, 6, 6);
        for (let i = 0; i < lvl; i++) { ctx.fillStyle = '#d9c08a'; ctx.fillRect(x - 36 - i * 7, -12, 2, 12); ctx.fillStyle = '#8f9bb0'; ctx.fillRect(x - 38 - i * 7, -14, 6, 3); }
        break;
      }
      case 'briqueterie':
        ctx.fillStyle = '#8a4a32'; ctx.fillRect(x - 26, -30, 52, 30);
        ctx.fillStyle = '#5e2a20'; ctx.fillRect(x - 30, -34, 60, 5);
        ctx.fillStyle = '#6a3a2a'; ctx.beginPath(); ctx.moveTo(x + 6, -34); ctx.lineTo(x + 10, -64 - lvl * 4); ctx.lineTo(x + 18, -64 - lvl * 4); ctx.lineTo(x + 22, -34); ctx.fill();
        smoke(x + 14, -66 - lvl * 4, 4);
        for (let i = 0; i < lvl * 4; i++) { ctx.fillStyle = i % 2 ? '#c8643e' : '#b0583a'; ctx.fillRect(x - 44 + (i % 4) * 6, -4 - Math.floor(i / 4) * 4, 5, 3); }
        glow(x - 8, -12, 12, 'rgba(255,130,60,0.5)'); ctx.fillStyle = '#ffb060'; ctx.fillRect(x - 12, -16, 8, 8); light(x - 8, -12, 16, 0.8);
        break;
      case 'caserne':
        ctx.fillStyle = '#9a3a2a'; ctx.fillRect(x - 28, -38, 56, 38);
        ctx.fillStyle = '#6a2a20'; ctx.fillRect(x - 30, -42, 60, 5);
        ctx.fillStyle = '#efe3c8'; ctx.fillRect(x - 20, -24, 18, 24); ctx.fillRect(x + 2, -24, 18, 24);
        ctx.strokeStyle = '#9a3a2a'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 20, -24 + k * 6); ctx.lineTo(x + 20, -24 + k * 6); ctx.stroke(); }
        ctx.fillStyle = '#c9a33a'; ctx.fillRect(x - 6, -58, 12, 16); ctx.fillStyle = '#efe3c8'; circle(x, -50, 4);
        break;
      case 'marche':
        for (let i = 0; i < 1 + lvl; i++) {
          const sx = x - 30 + i * 30;
          ctx.fillStyle = '#6b4a2e'; ctx.fillRect(sx - 12, -14, 24, 4); ctx.fillRect(sx - 11, -24, 2, 24); ctx.fillRect(sx + 9, -24, 2, 24);
          for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#efe3c8' : ['#c0503a', '#3f7fb0', '#6a9a3a'][i % 3]; ctx.fillRect(sx - 14 + k * 7, -30, 7, 6); }
          ['#e0a35a', '#9fd46b', '#c0503a'].forEach((c, k) => { ctx.fillStyle = c; circle(sx - 6 + k * 6, -17, 2.5); });
        }
        ctx.fillStyle = '#f2c94c'; circle(x, -40, 5); ctx.fillStyle = '#b8902a'; ctx.fillRect(x - 1, -43, 2, 6);
        break;
      case 'elevage':
        ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 40, -30, 30, 30); ctx.fillStyle = '#5e2a20'; ctx.beginPath(); ctx.moveTo(x - 44, -30); ctx.lineTo(x - 25, -46); ctx.lineTo(x - 6, -30); ctx.fill();
        ctx.strokeStyle = '#efe3c8'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 32, -20, 14, 20);
        ctx.fillStyle = '#8a6a4a'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 6 + k * 11, -10, 2, 10); ctx.fillRect(x - 6, -8, 46, 2);
        for (let i = 0; i < lvl + 1; i++) { const cx = x + 6 + i * 11 + (reduced ? 0 : Math.sin(time * 0.5 + i) * 2); ctx.fillStyle = i % 2 ? '#efe3c8' : '#6a4a3a'; ctx.fillRect(cx - 4, -7, 8, 4); ctx.fillRect(cx + 3, -8, 3, 3); ctx.fillStyle = '#222'; ctx.fillRect(cx - 3, -3, 1, 3); ctx.fillRect(cx + 2, -3, 1, 3); }
        break;
      case 'ecole':
        ctx.fillStyle = '#b8704a'; ctx.fillRect(x - 34, -40, 68, 40);
        ctx.fillStyle = '#5e2a20'; ctx.beginPath(); ctx.moveTo(x - 38, -40); ctx.lineTo(x, -58); ctx.lineTo(x + 38, -40); ctx.fill();
        for (let k = 0; k < 4; k++) { ctx.fillStyle = '#f2c46b'; ctx.fillRect(x - 28 + k * 16, -32, 8, 10); }
        light(x, -28, 30, 0.8);
        ctx.fillStyle = '#efe3c8'; circle(x, -48, 5); ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x + 30, -70, 2, 30); ctx.fillStyle = '#3f7fb0'; ctx.fillRect(x + 32, -70, 12, 8);
        break;
      case 'theatre':
        ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x - 36, -48, 72, 48);
        ctx.fillStyle = '#b0a080'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 32 + k * 15, -44, 5, 44);
        ctx.fillStyle = '#8a3a4a'; ctx.beginPath(); ctx.moveTo(x - 40, -48); ctx.lineTo(x, -66); ctx.lineTo(x + 40, -48); ctx.fill();
        ctx.fillStyle = '#6a1a2a'; ctx.fillRect(x - 10, -22, 20, 22); ctx.fillStyle = '#f2c46b'; for (let k = 0; k < 6; k++) circle(x - 30 + k * 12, -52, 1.6);
        light(x, -20, 30, 1);
        break;
      case 'entrepot':
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x - 36, -34 - lvl * 5, 72, 34 + lvl * 5);
        ctx.fillStyle = '#4a3a2e'; ctx.beginPath(); ctx.moveTo(x - 40, -34 - lvl * 5); ctx.quadraticCurveTo(x, -54 - lvl * 7, x + 40, -34 - lvl * 5); ctx.fill();
        ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - 12, -24, 24, 24);
        for (let i = 0; i < lvl * 2; i++) { ctx.fillStyle = ['#c8643e', '#d9c08a', '#8f9bb0'][i % 3]; ctx.fillRect(x + 20 + (i % 2) * 9, -7 - Math.floor(i / 2) * 7, 8, 6); }
        break;
      // --- Mégacité ---
      case 'centrale':
        ctx.fillStyle = '#9aa0aa'; ctx.beginPath(); ctx.moveTo(x - 34, 0); ctx.quadraticCurveTo(x - 22, -40, x - 30, -80); ctx.lineTo(x + 2, -80); ctx.quadraticCurveTo(x - 6, -40, x + 6, 0); ctx.fill();
        smoke(x - 14, -84, 5, 'rgba(235,235,240,0.5)');
        ctx.fillStyle = '#5a6070'; ctx.fillRect(x + 8, -34, 34, 34);
        for (let k = 0; k < lvl; k++) { ctx.fillStyle = '#ffe066'; ctx.fillRect(x + 12 + k * 7, -26, 4, 8); }
        glow(x + 25, -22, 18, 'rgba(255,224,102,0.35)'); light(x + 25, -22, 22, 0.8);
        ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 42, -30); ctx.lineTo(x + 60, -50); ctx.lineTo(x + 78, -30); ctx.stroke();
        break;
      case 'acierie': {
        ctx.fillStyle = '#4a5260'; ctx.fillRect(x - 38, -40, 76, 40);
        for (let k = 0; k < 1 + lvl; k++) { ctx.fillStyle = '#2a3038'; ctx.fillRect(x - 30 + k * 18, -76, 8, 36); ctx.fillStyle = '#c0503a'; ctx.fillRect(x - 30 + k * 18, -72, 8, 3); smoke(x - 26 + k * 18, -78, 3, 'rgba(120,120,130,0.5)'); }
        const f2 = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 8);
        glow(x + 16, -14, 20 * f2, 'rgba(255,120,40,0.7)'); ctx.fillStyle = '#ff9a40'; ctx.fillRect(x + 8, -22, 16, 14); light(x + 16, -14, 26, 1);
        break;
      }
      case 'serres':
        for (let k = 0; k < 2 + lvl; k++) {
          const sy = -18 - k * 18;
          ctx.fillStyle = 'rgba(170,220,200,0.45)'; ctx.fillRect(x - 26, sy, 52, 16);
          ctx.strokeStyle = '#6a8a80'; ctx.lineWidth = 1; ctx.strokeRect(x - 26, sy, 52, 16);
          ctx.fillStyle = '#5aba6a'; for (let p = 0; p < 8; p++) circle(x - 22 + p * 6, sy + 11, 2.2);
          light(x, sy + 8, 14, 0.5);
        }
        ctx.fillStyle = 'rgba(180,140,255,0.25)'; ctx.fillRect(x - 26, -18 - (1 + lvl) * 18, 52, (2 + lvl) * 18);
        break;
      case 'pompage':
        ctx.fillStyle = '#5a7080'; ctx.fillRect(x - 24, -30, 48, 30);
        ctx.fillStyle = '#7fc8ff'; for (let k = 0; k < lvl; k++) { ctx.beginPath(); ctx.ellipse(x - 12 + k * 14, -40, 7, 10, 0, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#3a4a58'; ctx.fillRect(x - 3, 0, 6, 30);
        if (!reduced) { ctx.fillStyle = 'rgba(160,210,255,0.8)'; circle(x, 12 + ((time * 30) % 18), 2); }
        break;
      case 'hopital':
        block(x, 0, 64, 60, '#e8eef2', 5, 5, 7, '#cfe6ff');
        ctx.fillStyle = '#d83a4a'; ctx.fillRect(x - 3, -76, 6, 16); ctx.fillRect(x - 8, -71, 16, 6);
        light(x, -68, 18, 1);
        break;
      case 'parc':
        ctx.fillStyle = mix('#1c2a1c', '#5aa04a', 0.4 + 0.6 * L); ctx.fillRect(x - 44, -4, 88, 4);
        for (let k = 0; k < 3 + lvl * 2; k++) { const tx = x - 38 + k * (76 / (2 + lvl * 2)); ctx.fillStyle = '#5a3a22'; ctx.fillRect(tx - 1.5, -16, 3, 12); ctx.fillStyle = season().leaf ? season().leaf[k % 2] : '#dfe8ee'; circle(tx, -20, 7); }
        ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 8, -8, 16, 6);
        if (!reduced) { ctx.fillStyle = 'rgba(160,210,255,0.8)'; for (let k = 0; k < 3; k++) circle(x - 4 + k * 4, -10 - Math.abs(Math.sin(time * 4 + k)) * 6, 1.5); }
        break;
      case 'metro':
        ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 22, -24, 44, 24);
        ctx.fillStyle = '#1a1a20'; ctx.fillRect(x - 14, -18, 28, 18);
        ctx.fillStyle = '#3f7fb0'; ctx.fillRect(x - 22, -32, 44, 8);
        ctx.fillStyle = '#efe3c8'; ctx.font = '700 7px "Nunito Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MÉTRO', x, -26); ctx.textAlign = 'start';
        light(x, -28, 18, 0.9);
        break;
      case 'megaentrepot':
        ctx.fillStyle = '#5a6068'; ctx.fillRect(x - 40, -44 - lvl * 6, 80, 44 + lvl * 6);
        for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#c0503a', '#3f7fb0', '#c9a33a', '#6a9a3a'][k]; ctx.fillRect(x - 36 + k * 19, -18, 16, 18); }
        ctx.fillStyle = '#ffe066'; ctx.fillRect(x - 40, -46 - lvl * 6, 80, 3);
        break;
      case 'bureaux':
        for (let k = 0; k < lvl; k++) block(x - 30 + k * 15, 0, 26, 50 + k * 16 + (k % 2) * 10, ['#5a6a80', '#6a7a90', '#4a5a70'][k % 3], 3, 5 + k * 2, k + 7, '#cfe6ff');
        ctx.fillStyle = '#2a3038'; ctx.fillRect(x - 44, -6, 88, 6);
        break;
    }
    ctx.restore();
  }

  function drawBack() {
    for (let i = 0; i < 3; i++) {
      const x = 990 + i * 52;
      if (i >= save.build.champ || !onScreen(x)) continue;
      const sid = season().id;
      ctx.fillStyle = sid === 'hiver' ? '#e8eef2' : '#5a3e24'; ctx.fillRect(x - 24, BACK_Y - 8, 48, 10);
      const col = { printemps: '#7cc05a', ete: '#b9c24a', automne: '#e0b64a', hiver: null }[sid];
      if (col) for (let k = 0; k < 8; k++) { ctx.fillStyle = col; ctx.fillRect(x - 22 + k * 6, BACK_Y - 8 - (sid === 'printemps' ? 4 : 9), 2, sid === 'printemps' ? 4 : 9); }
    }
    if (!save.build.beffroi) {
      for (const [tx, c] of [[612, '#c9a36b'], [650, '#b0806a']]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(tx - 16, BACK_Y); ctx.lineTo(tx, BACK_Y - 22); ctx.lineTo(tx + 16, BACK_Y); ctx.fill();
        ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.moveTo(tx - 4, BACK_Y); ctx.lineTo(tx, BACK_Y - 10); ctx.lineTo(tx + 4, BACK_Y); ctx.fill();
      }
    } else if (onScreen(632)) {
      const x = 632, s = bounceScale('beffroi');
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      ctx.fillStyle = '#8a8378'; ctx.fillRect(x - 16, BACK_Y - 96, 32, 96);
      ctx.fillStyle = '#5e2a20'; ctx.beginPath(); ctx.moveTo(x - 22, BACK_Y - 96); ctx.lineTo(x, BACK_Y - 132); ctx.lineTo(x + 22, BACK_Y - 96); ctx.fill();
      ctx.fillStyle = '#efe3c8'; circle(x, BACK_Y - 76, 8); ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, BACK_Y - 76); ctx.lineTo(x + Math.cos(time * 0.2) * 6, BACK_Y - 76 + Math.sin(time * 0.2) * 6); ctx.moveTo(x, BACK_Y - 76); ctx.lineTo(x, BACK_Y - 81); ctx.stroke();
      ctx.fillStyle = '#c9a33a'; ctx.fillRect(x - 5, BACK_Y - 108, 10, 8); light(x, BACK_Y - 104, 22, 1);
      ctx.fillStyle = '#e0a35a'; ctx.fillRect(x + 1, BACK_Y - 150, 2, 18); ctx.beginPath(); ctx.moveTo(x + 3, BACK_Y - 150); ctx.lineTo(x + 16, BACK_Y - 145); ctx.lineTo(x + 3, BACK_Y - 140); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < save.build.maison; i++) {
      const x = HOUSES[i];
      if (!onScreen(x)) continue;
      const s = bounce.id === 'maison' && i === save.build.maison - 1 ? bounceScale('maison') : 1;
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s * 0.9, s * 0.9); ctx.translate(-x, -BACK_Y);
      if (save.era >= 2) house(x, BACK_Y, 38, 30, ['#9a7a6a', '#8a6a5a', '#a88a6a', '#7a6a5a'][i % 4], ['#6b3a2a', '#4a3a3a', '#7a4a3a', '#5a3a2a'][i % 4]);
      else house(x, BACK_Y, 38, 26, ['#8a6a4a', '#7a5a4a', '#9a7a5a', '#6a5a4a'][i % 4], ['#5e2a20', '#3a3430', '#6b3a2a', '#4a3020'][i % 4]);
      ctx.fillStyle = '#2c1f1a'; ctx.fillRect(x + 8, BACK_Y - 48, 6, 12);
      if (dayLight(save.t) < 0.6 || winter()) smoke(x + 11, BACK_Y - 50, 2);
      ctx.restore();
    }
    if (save.era < 2) return;
    if (onScreen(1570, 120)) {
      const x = 1570, s = bounceScale('era');
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      ctx.fillStyle = save.era >= 3 ? '#c8d0d8' : '#d8c8a8'; ctx.fillRect(x - 46, BACK_Y - 70, 92, 70);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f2c46b'; ctx.fillRect(x - 40 + k * 15, BACK_Y - 56, 7, 12); ctx.fillRect(x - 40 + k * 15, BACK_Y - 30, 7, 12); }
      ctx.fillStyle = '#6b3a2a'; ctx.beginPath(); ctx.moveTo(x - 50, BACK_Y - 70); ctx.lineTo(x, BACK_Y - 94); ctx.lineTo(x + 50, BACK_Y - 70); ctx.fill();
      ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x - 10, BACK_Y - 124, 20, 34); ctx.fillStyle = '#efe3c8'; circle(x, BACK_Y - 110, 7);
      ctx.fillStyle = '#3f7fb0'; ctx.fillRect(x + 1, BACK_Y - 146, 2, 22); ctx.fillRect(x + 3, BACK_Y - 146, 14, 8);
      if (save.era >= 3) { ctx.fillStyle = 'rgba(170,220,255,0.5)'; ctx.fillRect(x + 46, BACK_Y - 60, 30, 60); ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, BACK_Y - 146); ctx.lineTo(x, BACK_Y - 176); ctx.stroke(); ctx.fillStyle = '#ef6b52'; circle(x, BACK_Y - 176, 2.5); light(x, BACK_Y - 176, 10, 1); }
      light(x, BACK_Y - 40, 40, 0.9);
      ctx.restore();
    }
    for (let i = 0; i < save.build.immeuble; i++) {
      const x = IMMEUBLES[i];
      if (!onScreen(x)) continue;
      const s = bounce.id === 'immeuble' && i === save.build.immeuble - 1 ? bounceScale('immeuble') : 1;
      const h = 60 + (i % 3) * 10;
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      block(x, BACK_Y, 46, h, ['#a8583a', '#9a4e34', '#b0664a'][i % 3], 3, 4 + (i % 3), 20 + i);
      ctx.fillStyle = '#5e2a20'; ctx.fillRect(x - 26, BACK_Y - h - 5, 52, 5);
      if (winter()) { ctx.fillStyle = '#f4f8fb'; ctx.fillRect(x - 26, BACK_Y - h - 7, 52, 3); }
      ctx.restore();
    }
    if (save.era < 3) return;
    for (let i = 0; i < save.build.tour; i++) {
      const x = TOURS[i];
      if (!onScreen(x)) continue;
      const s = bounce.id === 'tour' && i === save.build.tour - 1 ? bounceScale('tour') : 1;
      const h = 120 + (i % 4) * 22;
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      block(x, BACK_Y, 48, h, ['#5a6878', '#4a5868', '#6a7888', '#556575'][i % 4], 4, Math.floor(h / 14), 60 + i, i % 2 ? '#cfe6ff' : '#f2c46b');
      ctx.fillStyle = '#3a4450'; ctx.fillRect(x - 2, BACK_Y - h - 16, 4, 16); ctx.fillStyle = '#ef6b52'; circle(x, BACK_Y - h - 16, 2); light(x, BACK_Y - h - 16, 8, 1);
      ctx.restore();
    }
    if (save.build.tourclairval && onScreen(2600, 120)) {
      const x = 2600, s = bounceScale('tourclairval');
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      ctx.fillStyle = '#8fa4b8';
      ctx.beginPath(); ctx.moveTo(x - 30, BACK_Y); ctx.lineTo(x - 14, BACK_Y - 230); ctx.lineTo(x + 14, BACK_Y - 230); ctx.lineTo(x + 30, BACK_Y); ctx.fill();
      ctx.fillStyle = 'rgba(207,230,255,0.6)'; for (let k = 0; k < 20; k++) ctx.fillRect(x - 10 + (k % 2) * 12, BACK_Y - 20 - k * 10, 8, 5);
      ctx.fillStyle = '#e0a35a'; ctx.beginPath(); ctx.moveTo(x - 16, BACK_Y - 230); ctx.lineTo(x, BACK_Y - 290); ctx.lineTo(x + 16, BACK_Y - 230); ctx.fill();
      glow(x, BACK_Y - 292, 26 + (reduced ? 0 : Math.sin(time * 2) * 6), 'rgba(255,224,102,0.7)'); light(x, BACK_Y - 292, 40, 1);
      ctx.restore();
    }
  }

  function drawTree(i) {
    const x = TREE_X[i], t = save.trees[i], se = season();
    if (!onScreen(x)) return;
    const h = 46 + rnd(i) * 16;
    const sh = t.shake && time - t.shake < 0.3 ? Math.sin((time - t.shake) * 60) * 2 : 0;
    if (t.hp <= 0) { ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 5, -7, 10, 7); ctx.fillStyle = '#c08a55'; ctx.beginPath(); ctx.ellipse(x, -7, 5, 2, 0, 0, TAU); ctx.fill(); return; }
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 3 + sh, -h * 0.45, 6, h * 0.45);
    if (!se.leaf) {
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + sh, -h * 0.4 - k * 6); ctx.lineTo(x + sh + (k % 2 ? 10 : -10), -h * 0.6 - k * 7); ctx.stroke(); }
      ctx.fillStyle = '#f4f8fb'; circle(x + sh, -h * 0.72, 5);
      return;
    }
    for (let k = 0; k < 4; k++) { ctx.fillStyle = se.leaf[k % 2]; circle(x + sh + [-7, 7, 0, -2][k], -h * [0.55, 0.58, 0.78, 0.66][k], 11 - k); }
    if (se.id === 'printemps') { ctx.fillStyle = '#ffd6e6'; for (let k = 0; k < 4; k++) circle(x + sh - 8 + k * 5, -h * 0.6 - (k % 2) * 8, 1.6); }
    if (t.hp < 5) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 10, 4, 20, 3); ctx.fillStyle = '#e0a35a'; ctx.fillRect(x - 10, 4, 4 * t.hp, 3); }
  }
  function drawBush(i) {
    const x = BUSH_X[i];
    if (!onScreen(x)) return;
    ctx.fillStyle = winter() ? '#dfe8ee' : '#3f7a34'; circle(x - 5, -7, 8); circle(x + 5, -7, 8); circle(x, -12, 8);
    ctx.fillStyle = '#d43a4a';
    for (let k = 0; k < save.berries[i]; k++) circle(x - 7 + (k % 3) * 7, -14 + Math.floor(k / 3) * 6, 1.8);
  }
  function drawRock(x, i, iron) {
    if (!onScreen(x)) return;
    ctx.fillStyle = iron ? ['#4a4046', '#524850', '#463c42'][i % 3] : ['#8a8a96', '#7a7a86', '#9696a2', '#82828e'][i];
    ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x - 12, -16 - i * 2); ctx.lineTo(x, -24 + (i % 2) * 4); ctx.lineTo(x + 12, -14); ctx.lineTo(x + 16, 0); ctx.fill();
    if (iron) { ctx.fillStyle = '#c07a50'; circle(x - 5, -10, 2); circle(x + 4, -14, 1.6); circle(x + 1, -6, 1.8); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x - 10, -14); ctx.lineTo(x, -22 + (i % 2) * 4); ctx.lineTo(x + 2, -10); ctx.fill(); }
    if (winter()) { ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.ellipse(x - 2, -20 + (i % 2) * 3, 8, 3, 0, 0, TAU); ctx.fill(); }
  }
  function drawSolar(x) {
    if (!onScreen(x)) return;
    ctx.fillStyle = '#6a7080'; ctx.fillRect(x - 1, -12, 2, 12);
    ctx.save(); ctx.translate(x, -14); ctx.rotate(-0.3);
    ctx.fillStyle = '#2a4a7a'; ctx.fillRect(-10, -6, 20, 10); ctx.strokeStyle = '#9fb8d8'; ctx.lineWidth = 0.6;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-10 + k * 5, -6); ctx.lineTo(-10 + k * 5, 4); ctx.stroke(); }
    ctx.restore();
  }
  function drawPerson(w) {
    const x = w.x, y = w.y;
    if (!onScreen(x, 20)) return;
    const moving = w.pause <= 0;
    const bob = moving && !reduced ? Math.abs(Math.sin(time * 10 + w.seed * 10)) * 1.2 : 0;
    const col = w.job === 'idle' ? '#9a8f7a' : JOBS[w.job].color;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 4, 1.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.4;
    const leg = moving && !reduced ? Math.sin(time * 10 + w.seed * 10) * 2 : 0;
    ctx.beginPath(); ctx.moveTo(x - 1, y - 4); ctx.lineTo(x - 1 + leg, y); ctx.moveTo(x + 1, y - 4); ctx.lineTo(x + 1 - leg, y); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(x - 3, y - 11 - bob, 6, 7);
    ctx.fillStyle = '#e8c39e'; circle(x, y - 13.5 - bob, 2.6);
    const working = !moving && w.job !== 'idle';
    const sw = working && !reduced ? Math.sin(time * 8 + w.seed * 6) : 0;
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 1.2;
    if (['bucheron', 'carrier', 'mineur', 'forgeron'].includes(w.job)) { ctx.beginPath(); ctx.moveTo(x + 3 * w.face, y - 9 - bob); ctx.lineTo(x + (6 + sw * 2) * w.face, y - 14 - sw * 3 - bob); ctx.stroke(); }
    else if (w.job === 'porteur' || w.job === 'technicien') { ctx.fillStyle = '#6b8fb0'; ctx.fillRect(x + 3 * w.face - 1.5, y - 8 - bob, 3, 4); }
    else if (w.job === 'pecheur') { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 12 * w.face, y - 20); ctx.stroke(); }
    else if (['fermier', 'cueilleur', 'eleveur', 'agronome'].includes(w.job)) { ctx.fillStyle = '#c9a36b'; ctx.fillRect(x - 3 * w.face - 2, y - 8 - bob, 4, 3); }
    else if (w.job === 'ingenieur' || w.job === 'metallo') { ctx.fillStyle = '#ffe066'; ctx.fillRect(x - 3, y - 16.5 - bob, 6, 2); }
    else if (w.job === 'marchand') { ctx.fillStyle = '#f2c94c'; circle(x + 3 * w.face, y - 7 - bob, 1.6); }
  }

  function draw() {
    const t = save.t, se = season();
    L = dayLight(t);
    lights = [];
    const E = save.era;
    const dusk = t > 0.7 && t < 0.9 ? Math.max(0, 1 - Math.abs(t - 0.8) / 0.08) : t > 0.14 && t < 0.3 ? Math.max(0, 1 - Math.abs(t - 0.22) / 0.08) : 0;
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, mix('#0d1430', se.sky, L));
    g.addColorStop(1, mix(mix('#1c2240', mix('#cfe6f2', se.sky, 0.4), L), '#e8946a', dusk * 0.8));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 80 * z);
    if (L < 0.9) for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,250,230,${(1 - L) * (0.4 + 0.4 * Math.sin(time + i))})`; ctx.fillRect(rnd(i) * W, rnd(i + 50) * gy * 0.7, 1.5, 1.5); }
    const a = ((t - 0.2) / 0.66) * Math.PI;
    if (t > 0.18 && t < 0.88) { const sx = W * 0.1 + (W * 0.8) * ((t - 0.18) / 0.7), sy = gy * 0.75 - Math.sin(a) * gy * 0.5; glow(sx, sy, 40, 'rgba(255,230,160,0.5)'); ctx.fillStyle = '#ffe6a0'; circle(sx, sy, 11); }
    else { const tt = t > 0.5 ? t - 0.86 : t + 0.14, sx = W * 0.15 + W * 0.7 * (tt / 0.32); ctx.fillStyle = '#f4ead2'; circle(sx, gy * 0.3, 9); }
    ctx.fillStyle = mix('#1a2233', se.id === 'hiver' ? '#9fb0bf' : '#5a7a6a', L);
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let sx = 0; sx <= W; sx += 10) { const wx = sx / z * 0.3 + camX * 0.3; ctx.lineTo(sx, gy - (46 + 22 * Math.sin(wx * 0.02) + 12 * Math.sin(wx * 0.05)) * z * 0.7); }
    ctx.lineTo(W, gy); ctx.fill();
    // silhouette de la ville au loin
    if (E >= 2) {
      const k0 = 0.6 * z;
      for (let k = 0; k < 50; k++) {
        if (E === 2 && k % 3) continue;
        const sx = (k * 48 - camX * 0.25) * k0 + W / 2 - 300 * k0;
        const px = ((sx % (50 * 48 * k0)) + 50 * 48 * k0) % (50 * 48 * k0) - 40;
        if (px < -40 || px > W + 40) continue;
        const bh = (E >= 3 ? 50 + rnd(k) * 90 : 18 + rnd(k) * 20) * k0, bw = (18 + rnd(k + 3) * 14) * k0;
        ctx.fillStyle = mix('#141a2a', '#6a7a8a', L * 0.8); ctx.fillRect(px, gy - bh - 14 * k0, bw, bh + 20);
        if (L < 0.6) { ctx.fillStyle = 'rgba(242,196,107,0.7)'; for (let r = 0; r < bh / 8; r++) if (rnd(k * 31 + r) < 0.5) ctx.fillRect(px + 3, gy - bh - 10 * k0 + r * 8, 2, 2); }
      }
    }
    ctx.fillStyle = mix('#0f1a14', se.id === 'hiver' ? '#7a8a90' : '#2f5a3a', L);
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let sx = 0; sx <= W; sx += 6) { const wx = sx / z * 0.6 + camX * 0.6; ctx.lineTo(sx, gy - (26 + 10 * Math.abs(Math.sin(wx * 0.09)) + 6 * Math.sin(wx * 0.021)) * z * 0.8); }
    ctx.lineTo(W, gy); ctx.fill();

    // Monde
    ctx.save(); ctx.translate(W / 2, gy); ctx.scale(z, z); ctx.translate(-camX, 0);
    const grass = se.grass;
    ctx.fillStyle = mix('#18241a', grass, 0.35 + 0.65 * L); ctx.fillRect(-50, BACK_Y - 4, VW + 100, 40);
    drawBack();
    ctx.fillStyle = mix('#1c2a1c', grass, 0.4 + 0.6 * L); ctx.fillRect(-50, -2, VW + 100, 34);
    // Route : terre, puis pavés, puis bitume
    const roadCol = E >= 3 ? '#44464c' : E === 2 ? '#8a8580' : (se.id === 'hiver' ? '#cfd8de' : '#9a8460');
    ctx.fillStyle = mix('#2a2218', roadCol, 0.3 + 0.7 * L); ctx.fillRect(-50, 10, VW + 100, 10);
    const x0 = camX - W / 2 / z - 10, x1 = camX + W / 2 / z + 10;
    if (E === 2) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let x = Math.floor(x0 / 6) * 6; x < x1; x += 6) ctx.fillRect(x, 12 + (Math.floor(x / 6) % 2) * 4, 4, 2); }
    if (E >= 3) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = Math.floor(x0 / 20) * 20; x < x1; x += 20) ctx.fillRect(x, 14.5, 10, 1); }
    for (let i = 0; i < TREE_X.length; i++) drawTree(i);
    for (let i = 0; i < BUSH_X.length; i++) drawBush(i);
    ROCK_X.forEach((x, i) => drawRock(x, i, false));
    if (E >= 2) IRON_X.forEach((x, i) => drawRock(x, i, true));
    if (E >= 3) SOLAR_X.forEach(drawSolar);
    for (const b of BUILDINGS) if (FRONT[b.id] !== undefined && b.id !== 'pecheur') drawBuilding(b.id, save.build[b.id]);
    if ((!save.build.place || save.build.place < 2) && onScreen(584)) {
      const fx = 584, f = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 11) * Math.sin(time * 7);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(fx - 8, -3, 16, 3);
      glow(fx, -6, 14 * f, 'rgba(255,150,60,0.7)'); ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(fx - 5, -2); ctx.quadraticCurveTo(fx, -16 * f, fx + 5, -2); ctx.fill();
      light(fx, -6, 40, 1);
    }
    // réverbères
    if (E >= 2) for (let x = 340; x < VW; x += 110) {
      if (!onScreen(x)) continue;
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(x - 1, -30, 2, 30); ctx.fillRect(x - 1, -30, 7, 2);
      ctx.fillStyle = L < 0.5 ? '#ffe6a0' : '#8a8a90'; ctx.fillRect(x + 4, -29, 4, 4);
      if (L < 0.5) light(x + 6, -26, E >= 3 ? 34 : 26, 1);
    }
    // tramway
    if (E >= 3) {
      const tx = ((time * 40) % (VW + 300)) - 150;
      if (onScreen(tx, 60)) {
        ctx.fillStyle = '#c0503a'; ctx.fillRect(tx - 36, 4, 72, 12); ctx.fillStyle = '#efe3c8'; ctx.fillRect(tx - 36, 4, 72, 3);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = L < 0.5 ? '#ffe6a0' : '#cfe6ff'; ctx.fillRect(tx - 32 + k * 11, 8, 7, 4); }
        ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, 4); ctx.lineTo(tx + 6, -20); ctx.stroke();
        if (L < 0.5) light(tx, 10, 40, 0.9);
      }
    }
    const night = L < 0.25;
    for (const w of walkers) { if (night && w.pause > 100) continue; drawPerson(w); }
    // rivière et ponts
    const rg = ctx.createLinearGradient(0, 30, 0, 60);
    const ice = se.id === 'hiver';
    rg.addColorStop(0, mix('#0e1a2a', ice ? '#b7d6e8' : '#4f8fbf', 0.35 + 0.65 * L)); rg.addColorStop(1, mix('#0a1422', ice ? '#9fc3d8' : '#2f6f9a', 0.35 + 0.65 * L));
    ctx.fillStyle = rg; ctx.fillRect(-50, 30, VW + 100, 30);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.2 * L})`; ctx.lineWidth = 1;
    for (let k = 0; k < 50; k++) { const wx = ((k * 67 + time * 12) % (VW + 100)) - 50, wy = 36 + (k % 4) * 5; if (!onScreen(wx)) continue; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 12, wy); ctx.stroke(); }
    if (save.build.pecheur) drawBuilding('pecheur', save.build.pecheur);
    if (E >= 2) for (const bx of [1400, 2300]) if (onScreen(bx)) {
      ctx.fillStyle = '#8a8378'; ctx.fillRect(bx - 40, 28, 80, 5);
      ctx.beginPath(); ctx.moveTo(bx - 30, 33); ctx.lineTo(bx - 30, 60); ctx.lineTo(bx - 22, 60); ctx.quadraticCurveTo(bx, 38, bx + 22, 60); ctx.lineTo(bx + 30, 60); ctx.lineTo(bx + 30, 33); ctx.fill();
    }
    ctx.fillStyle = mix('#101810', '#3a5a2a', 0.3 + 0.7 * L); ctx.fillRect(-50, 60, VW + 100, 200);
    // effets
    const dt = 1 / 60;
    sparks = sparks.filter((p) => (p.life -= dt) > 0);
    for (const p of sparks) {
      p.vy += 140 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.grey) { ctx.fillStyle = p.grey; ctx.fillRect(p.x, p.y, 2, 2); }
      else if (p.water) { ctx.fillStyle = 'rgba(160,210,255,0.9)'; circle(p.x, p.y, 1.5); }
      else glow(p.x, p.y, 5, `rgba(255,210,120,${Math.min(1, p.life)})`);
    }
    floats = floats.filter((f) => (f.life -= dt) > 0);
    ctx.font = '700 8px "Nunito Sans", system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const f of floats) { f.y -= 18 * dt; ctx.globalAlpha = Math.min(1, f.life * 1.5); ctx.fillStyle = '#10180f'; ctx.fillText(f.text, f.x + 0.6, f.y + 0.6); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
    ctx.restore();

    // Nuit : obscurité percée par les lumières
    const darkness = (1 - L) * 0.62;
    if (darkness > 0.02) {
      dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
      dctx.fillStyle = `rgba(5,8,20,${darkness})`; dctx.fillRect(0, 0, W, H);
      dctx.globalCompositeOperation = 'destination-out';
      for (const l of lights) { const gr = dctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = gr; dctx.beginPath(); dctx.arc(l.x, l.y, l.r, 0, TAU); dctx.fill(); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) glow(l.x, l.y, l.r * 0.5, `rgba(255,170,80,${0.22 * (1 - L)})`);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (!reduced && se.id !== 'ete') {
      for (let i = 0; i < 40; i++) {
        const px = (rnd(i) * W + Math.sin(time * 0.8 + i) * 20 + time * (se.id === 'hiver' ? 4 : 14)) % W;
        const py = (rnd(i + 9) * H * 0.5 + time * (se.id === 'hiver' ? 18 : 12) * (0.6 + rnd(i + 3))) % (H * 0.5);
        ctx.fillStyle = se.id === 'hiver' ? 'rgba(255,255,255,0.85)' : se.id === 'automne' ? 'rgba(208,138,58,0.8)' : 'rgba(255,214,230,0.8)';
        if (se.id === 'hiver') circle(px, py, 1.6); else ctx.fillRect(px, py, 3, 2);
      }
    }
  }

  // ---------- Boucle ----------
  let last = performance.now(), hudTimer = 0, autosave = 0, lastSig = '';
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    time += dt;
    const gameDt = dt * (save.speed || 0);
    if (gameDt > 0 && save.intro) step(gameDt);
    syncPeople();
    updateWalkers(dt * Math.max(1, save.speed || 1), dayLight(save.t) < 0.25);
    camX += (camTarget - camX) * Math.min(1, dt * 5);
    draw();
    hudTimer += dt; autosave += dt;
    if (hudTimer > 0.25 || hudDirty) {
      hudTimer = 0; hudDirty = false; renderHud();
      const sig = tab + save.era + BUILDINGS.map((b) => (canPay(costOf(b)) ? 1 : 0)).join('') + TECHS.map((x) => (canPay(x.cost) ? 1 : 0)).join('') + idleCount() + save.people.length + (tab === 'market' ? Math.floor(save.res[market.give] / 10) : '');
      if (sig !== lastSig) { lastSig = sig; if (!document.activeElement || document.activeElement.tagName !== 'SELECT') renderTab(); renderBadges(); }
    }
    if (autosave > 20) { autosave = 0; persist(); }
    requestAnimationFrame(frame);
  }

  // ---------- Contrôles ----------
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { if (!ui.card.hidden) return; drag = { x: e.clientX, y: e.clientY, cam: camTarget, moved: false }; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x) > 8) drag.moved = true;
    if (drag.moved) camTarget = camX = clampCam(drag.cam - (e.clientX - drag.x) / z);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved) {
      const r = canvas.getBoundingClientRect();
      const wx = (e.clientX - r.left - W / 2) / z + camX, wy = (e.clientY - r.top - gy) / z;
      gatherAt(wx, wy);
    }
    drag = null;
  });
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') camTarget = clampCam(camTarget - 80);
    if (e.key === 'ArrowRight') camTarget = clampCam(camTarget + 80);
  });
  const SOURCE = { food: 236, water: 494, wood: 100, stone: 1160, iron: 1265, tools: 1422, brick: 1512, gold: 1692, steel: 2352, energy: 2245 };
  $('res-row').addEventListener('click', (e) => { const el = e.target.closest('.res'); if (el) camTarget = clampCam(SOURCE[el.dataset.k]); });
  for (const b of document.querySelectorAll('.speed button')) b.addEventListener('click', () => { save.speed = Number(b.dataset.speed); renderSpeed(); persist(); });
  for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => { tab = b.dataset.tab; renderTab(); });

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
        if (!s || !s.people || !s.build) throw new Error('bad');
        save = mergeSave(s); box.value = ''; persist(); applyEra(); syncPeople(); renderAll(); renderSpeed(); toast('Clairval chargé depuis le code.');
      } catch (err) { toast("Ce code ne fonctionne pas. Vérifie qu'il est complet."); }
    });
  });
  $('btn-reset').addEventListener('click', (e) => {
    twoStep('reset', e.currentTarget, 'Recommencer un village', 'Toucher encore pour tout effacer', () => {
      save = fresh(); walkers = []; camTarget = camX = 584; applyEra(); syncPeople(); persist(); renderAll(); renderSpeed(); intro();
    });
  });

  // ---------- Démarrage ----------
  function intro() {
    speedBeforeCard = 1;
    showCard('Prologue', 'La clairière de Clairval', "Tu arrives avec Lou, Mila et Jules dans une clairière au bord d'une rivière. Il y a du bois, de la pierre, des baies et de l'eau claire.\n\nConstruis un village où chacun mange à sa faim, boit et reste au chaud l'hiver. Un jour, Clairval sera peut-être une ville… ou une mégacité.",
      [{ label: 'Fonder le village', fn() { save.intro = true; save.lastTs = Date.now(); } }], true);
  }
  function offlineReport() {
    const secs = (Date.now() - (save.lastTs || Date.now())) / 1000;
    if (!save.intro || secs < 90) return;
    const days = Math.min(2, secs / DAY);
    const { prod } = rates();
    const gains = {};
    for (const k of unlockedRes()) {
      if (JKEYS.some((j) => JOBS[j].res === k && JOBS[j].inputs)) continue; // pas de transformation hors ligne
      const g = Math.min(cap() - save.res[k], prod[k] * days * 0.5);
      if (g >= 1) { save.res[k] += g; gains[k] = Math.floor(g); }
    }
    const list = Object.entries(gains).map(([k, v]) => `+${v} ${RES[k].name.toLowerCase()}`).join(', ');
    const h = secs / 3600;
    const away = h >= 1 ? `${Math.floor(h)} h ${Math.floor((h % 1) * 60)} min` : `${Math.floor(secs / 60)} min`;
    if (list) showCard('Retour à Clairval', 'Pendant ton absence', `Tu es parti ${away}. Tes habitants ont continué à travailler (à moitié de leur rythme) :\n${list}.`, [{ label: 'Reprendre' }]);
  }

  applyEra();
  syncPeople();
  if (save.stats.gathered > 5 || save.day > 2) { hintHidden = true; $('gather-hint').hidden = true; }
  setSaveStatus('local');
  renderAll(); renderSpeed();
  if (!save.intro) intro(); else offlineReport();
  initCloud();
  requestAnimationFrame(frame);
})();
