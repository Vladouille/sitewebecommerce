/* Les Bâtisseurs de Clairval
 * Récolte à la main (arbres, rochers, buissons, rivière), construis, donne un métier à chaque habitant,
 * et veille à ce que tout le monde mange, boive et reste au chaud l'hiver.
 * Réglages du jeu : constantes ci-dessous (métiers, bâtiments, objectifs, événements). */
(() => {
  'use strict';

  // ---------- Réglages ----------
  const DAY = 30;            // secondes réelles par jour, à vitesse x1
  const SEASON_DAYS = 5;     // jours par saison
  const BASE_STORE = 60, STORE_PER_GRENIER = 80;
  const SAVE_KEY = 'clairval-v1';
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SEASONS = [
    { id: 'printemps', name: 'Printemps', grass: '#4f8a3a', leaf: ['#6fae4a', '#8cc45a'], sky: '#8fc7e8' },
    { id: 'ete', name: 'Été', grass: '#5d8f2e', leaf: ['#3f8a34', '#56a03f'], sky: '#7ec0ea' },
    { id: 'automne', name: 'Automne', grass: '#7d7a34', leaf: ['#d08a3a', '#b8552f'], sky: '#a9bfd0' },
    { id: 'hiver', name: 'Hiver', grass: '#e4ecf1', leaf: null, sky: '#b9cddd' },
  ];
  const seasonIndex = (d) => Math.floor((d - 1) / SEASON_DAYS) % 4;
  const seasonOf = (d) => SEASONS[seasonIndex(d)];
  const yearOf = (d) => Math.floor((d - 1) / (SEASON_DAYS * 4)) + 1;

  const RES = {
    food: { name: 'Nourriture', color: '#e0a35a' },
    water: { name: 'Eau', color: '#7fc8ff' },
    wood: { name: 'Bois', color: '#c08a55' },
    stone: { name: 'Pierre', color: '#b5b6c4' },
  };
  const RKEYS = Object.keys(RES);

  const JOBS = {
    cueilleur: { name: 'Cueilleur', res: 'food', rate: 2, base: 3, per: 0, bld: null, season: { ete: 1.2, automne: 1.3, hiver: 0.25 }, color: '#c0503a', where: [200, 270, 14] },
    porteur: { name: "Porteur d'eau", res: 'water', rate: 3, base: 2, per: 3, bld: 'puits', color: '#3f7fb0', where: [462, 522, 24] },
    bucheron: { name: 'Bûcheron', res: 'wood', rate: 3, base: 0, per: 2, bld: 'bucheron', color: '#7a5230', where: [20, 185, 12] },
    carrier: { name: 'Tailleur de pierre', res: 'stone', rate: 2, base: 0, per: 2, bld: 'carriere', color: '#7c7d8c', where: [1112, 1212, 12] },
    fermier: { name: 'Fermier', res: 'food', rate: 4, base: 0, per: 3, bld: 'champ', season: { ete: 1.3, automne: 1.5, hiver: 0 }, color: '#c9a33a', where: [985, 1135, -16] },
    pecheur: { name: 'Pêcheur', res: 'food', rate: 2.5, base: 0, per: 2, bld: 'pecheur', season: { hiver: 0.6 }, color: '#2f7a86', where: [946, 972, 26] },
  };
  const JKEYS = Object.keys(JOBS);

  const BUILDINGS = [
    { id: 'maison', name: 'Maison', max: 8, cost: { wood: 15, stone: 4 }, grow: 1.3, desc: '+4 places pour dormir' },
    { id: 'bucheron', name: 'Cabane du bûcheron', max: 3, cost: { wood: 10 }, grow: 1.7, desc: '+2 postes de bûcheron' },
    { id: 'carriere', name: 'Carrière', max: 3, cost: { wood: 18 }, grow: 1.7, desc: '+2 postes de tailleur de pierre' },
    { id: 'puits', name: 'Puits', max: 2, cost: { wood: 12, stone: 12 }, grow: 1.8, desc: "+3 postes de porteur d'eau" },
    { id: 'pecheur', name: 'Cabane du pêcheur', max: 2, cost: { wood: 16, stone: 4 }, grow: 1.7, desc: '+2 postes de pêcheur, qui pêchent même en hiver', need: 4 },
    { id: 'champ', name: 'Champs', max: 3, cost: { wood: 20, stone: 6 }, grow: 1.5, desc: '+3 postes de fermier. Belles récoltes en automne, rien en hiver', need: 5 },
    { id: 'grenier', name: 'Grenier', max: 3, cost: { wood: 30, stone: 20 }, grow: 1.5, desc: `+${STORE_PER_GRENIER} de place pour chaque ressource` },
    { id: 'place', name: 'Place du village', max: 2, cost: { wood: 20, stone: 25 }, grow: 1.8, desc: '+8 de bonheur', need: 5 },
    { id: 'guerisseuse', name: 'Maison de la guérisseuse', max: 1, cost: { wood: 30, stone: 35, food: 10 }, desc: '+6 de bonheur, et plus de fièvres au village', need: 7 },
    { id: 'taverne', name: 'Taverne', max: 1, cost: { wood: 45, stone: 30 }, desc: '+12 de bonheur, mais consomme 2 de nourriture par jour', need: 8 },
    { id: 'atelier', name: 'Atelier', max: 2, cost: { wood: 50, stone: 45 }, grow: 1.6, desc: '+20 % de production pour tous les métiers', need: 10 },
    { id: 'beffroi', name: 'Beffroi', max: 1, cost: { wood: 150, stone: 180, food: 80 }, desc: 'Le cœur de Clairval : +15 de bonheur et une grande fête', need: 18 },
  ];
  const BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

  const GOALS = [
    { id: 'g1', text: 'Construire une maison', goal: 1, get: () => save.build.maison, reward: { wood: 10 } },
    { id: 'g2', text: 'Construire la cabane du bûcheron', goal: 1, get: () => save.build.bucheron, reward: { food: 12 } },
    { id: 'g3', text: 'Construire un puits', goal: 1, get: () => save.build.puits, reward: { wood: 20 } },
    { id: 'g4', text: 'Accueillir 6 habitants', goal: 6, get: () => save.people.length, reward: { stone: 15 } },
    { id: 'g5', text: 'Construire la carrière', goal: 1, get: () => save.build.carriere, reward: { food: 15 } },
    { id: 'g6', text: 'Traverser un hiver', goal: 1, get: () => save.stats.winters, reward: { food: 30, wood: 20 } },
    { id: 'g7', text: 'Atteindre 70 % de bonheur', goal: 70, get: () => Math.round(save.happy), reward: { stone: 30 } },
    { id: 'g8', text: 'Accueillir 12 habitants', goal: 12, get: () => save.people.length, reward: { wood: 40 } },
    { id: 'g9', text: "Construire l'atelier", goal: 1, get: () => save.build.atelier, reward: { food: 40, stone: 20 } },
    { id: 'g10', text: 'Accueillir 20 habitants', goal: 20, get: () => save.people.length, reward: { wood: 60, stone: 40 } },
    { id: 'g11', text: 'Élever le beffroi', goal: 1, get: () => save.build.beffroi, reward: { food: 50 } },
  ];

  const NAMES = ['Lou', 'Mila', 'Jules', 'Anouk', 'Tom', 'Rose', 'Hugo', 'Léna', 'Basile', 'Iris', 'Noé', 'Zoé', 'Émile', 'Nina', 'Arthur', 'Lise', 'Gabin', 'Maëlle', 'Sacha', 'Alba', 'Oscar', 'Jade', 'Côme', 'Inès', 'Paul', 'Clara', 'Marius', 'Louna', 'Victor', 'Elsa', 'Robin', 'Capucine', 'Timéo', 'Olga', 'Félix', 'Suzon', 'Aimé', 'Romy', 'Léon', 'Ninon'];

  // ---------- Sauvegarde ----------
  const fresh = () => ({
    v: 1, day: 1, t: 0.3, speed: 1, intro: false, won: false,
    res: { food: 18, water: 18, wood: 8, stone: 0 },
    people: [{ n: 'Lou', job: 'cueilleur' }, { n: 'Mila', job: 'cueilleur' }, { n: 'Jules', job: 'porteur' }],
    build: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
    happy: 55, hunger: 0, thirst: 0, cold: 0, mods: [],
    claimed: {}, notified: {}, log: [],
    stats: { winters: 0, gathered: 0, maxPop: 3 },
    trees: Array(8).fill(0).map(() => ({ hp: 5, stump: 0 })),
    berries: [4, 5, 3],
    updatedAt: 0, lastTs: Date.now(),
  });
  let save = fresh();
  function mergeSave(s) {
    const f = fresh();
    return Object.assign(f, s, {
      res: Object.assign(f.res, s.res), build: Object.assign(f.build, s.build),
      stats: Object.assign(f.stats, s.stats),
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
        syncPeople(); renderAll(); toast('Village récupéré depuis ton compte.');
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
  const cap = () => BASE_STORE + STORE_PER_GRENIER * save.build.grenier;
  const housing = () => 4 + 4 * save.build.maison;
  const season = () => seasonOf(save.day);
  const winter = () => season().id === 'hiver';
  const countJob = (j) => save.people.filter((p) => p.job === j).length;
  const idleCount = () => save.people.filter((p) => p.job === 'idle').length;
  const slots = (j) => JOBS[j].base + JOBS[j].per * (JOBS[j].bld ? save.build[JOBS[j].bld] : 0);
  const costOf = (b) => Object.fromEntries(Object.entries(b.cost).map(([k, v]) => [k, Math.round(v * Math.pow(b.grow || 1, save.build[b.id]))]));
  const canPay = (c) => Object.entries(c).every(([k, v]) => save.res[k] >= v);
  const fmt = (v) => (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('fr-FR');

  function productionMul() {
    let m = 1 + 0.2 * save.build.atelier;
    if (save.happy < 30) m *= 0.75; else if (save.happy >= 75) m *= 1.1;
    return m;
  }
  function jobRate(j) {
    const J = JOBS[j];
    const sm = J.season && J.season[season().id] !== undefined ? J.season[season().id] : 1;
    return J.rate * sm * productionMul();
  }
  function rates() {
    const prod = { food: 0, water: 0, wood: 0, stone: 0 }, cons = { food: 0, water: 0, wood: 0, stone: 0 };
    for (const j of JKEYS) prod[JOBS[j].res] += countJob(j) * jobRate(j);
    const n = save.people.length;
    cons.food = n + (save.build.taverne ? 2 : 0);
    cons.water = n;
    cons.wood = winter() ? 0.5 * n + 0.5 * save.build.maison : 0;
    return { prod, cons };
  }
  let short = { food: false, water: false, wood: false };
  function happinessFactors() {
    const b = save.build, f = [['Vie au village', 50]];
    if (b.place) f.push(['Place du village', 8 * b.place]);
    if (b.taverne) f.push(['Taverne', 12]);
    if (b.guerisseuse) f.push(['Guérisseuse', 6]);
    if (b.beffroi) f.push(['Beffroi', 15]);
    const sources = ['cueilleur', 'fermier', 'pecheur'].filter((j) => countJob(j) > 0).length;
    if (sources >= 2) f.push(['Repas variés', 6]);
    if (save.people.length > housing()) f.push(['Pas assez de lits', -15]);
    if (short.food) f.push(['Faim', -25]);
    if (short.water) f.push(['Soif', -30]);
    if (short.wood && winter()) f.push(['Froid', -20]);
    const idle = idleCount();
    if (idle >= 3 && idle > save.people.length / 3) f.push(['Personnes sans métier', -6]);
    for (const m of save.mods) f.push([m.l, m.v]);
    return f;
  }
  const happyTarget = () => clamp(happinessFactors().reduce((a, x) => a + x[1], 0), 0, 100);

  // ---------- Habitants ----------
  function newName() {
    const used = new Set(save.people.map((p) => p.n));
    const free = NAMES.filter((n) => !used.has(n));
    return free.length ? free[Math.floor(Math.random() * free.length)] : NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (save.people.length + 1);
  }
  function addVillager(reason) {
    const n = newName();
    save.people.push({ n, job: 'idle' });
    save.stats.maxPop = Math.max(save.stats.maxPop, save.people.length);
    log(`${n} s'installe à Clairval${reason ? ' ' + reason : ''}.`);
    return n;
  }
  function removeVillager(reason) {
    if (!save.people.length) return;
    let i = save.people.findIndex((p) => p.job === 'idle');
    if (i < 0) i = save.people.length - 1;
    const [p] = save.people.splice(i, 1);
    log(`${p.n} quitte le village : ${reason}.`);
    toast(`${p.n} quitte le village : ${reason}.`);
  }
  function assign(job, delta) {
    if (delta > 0) {
      if (countJob(job) >= slots(job)) return;
      const p = save.people.find((q) => q.job === 'idle');
      if (p) p.job = job;
    } else {
      const list = save.people.filter((q) => q.job === job);
      if (list.length) list[list.length - 1].job = 'idle';
    }
    persist(); renderAll();
  }

  // ---------- Journal ----------
  function log(text) {
    save.log.unshift({ d: save.day, text });
    save.log = save.log.slice(0, 40);
  }

  // ---------- Simulation ----------
  let hudDirty = true;
  function step(dtGame) {
    const days = dtGame / DAY;
    const { prod, cons } = rates();
    const c = cap();
    for (const k of RKEYS) {
      const net = prod[k] - cons[k];
      save.res[k] = clamp(save.res[k] + net * days, 0, c);
      if (k !== 'stone') short[k] = save.res[k] <= 0.001 && net < 0;
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
      const msg = {
        printemps: 'Printemps : les buissons refleurissent.',
        ete: 'Été : la cueillette et les champs donnent davantage.',
        automne: "Automne : grosses récoltes. Fais des réserves pour l'hiver !",
        hiver: "L'hiver arrive : plus de cueillette ni de champs, et il faut du bois pour se chauffer.",
      }[now.id];
      log(msg); toast(msg);
    }
    // Besoins non satisfaits
    save.hunger = short.food ? save.hunger + 1 : 0;
    save.thirst = short.water ? save.thirst + 1 : 0;
    save.cold = short.wood && winter() ? save.cold + 1 : 0;
    if (save.thirst >= 1) removeVillager("il n'y a plus d'eau");
    else if (save.hunger >= 2) removeVillager('la faim dure depuis deux jours');
    else if (save.cold >= 2) removeVillager('il fait trop froid');
    else if (save.happy < 25 && Math.random() < 0.5) removeVillager('la vie ici est trop dure');
    else if (save.happy >= 45 && save.people.length < housing() && save.res.food >= save.people.length && save.res.water >= save.people.length) {
      const n = addVillager();
      let msg = `${n} s'installe à Clairval.`;
      if (save.happy >= 80 && save.people.length < housing()) msg = `${n} et ${addVillager()} s'installent à Clairval.`;
      toast(msg + ' Donne-leur un métier (onglet Habitants).');
    }
    save.mods = save.mods.map((m) => ({ ...m, d: m.d - 1 })).filter((m) => m.d > 0);
    // Nature
    for (const t of save.trees) if (t.hp <= 0 && --t.stump <= 0) t.hp = 5;
    save.berries = save.berries.map((b) => (winter() ? 0 : Math.min(6, b + 3)));
    if (save.day > 3 && Math.random() < 0.3) setTimeout(randomEvent, 400);
    persist();
    renderAll();
  }

  // ---------- Événements ----------
  const EVENTS = [
    { w: 3, ok: () => true, run() {
      const offers = [
        { give: { wood: 20 }, get: { stone: 12 } },
        { give: { food: 15 }, get: { wood: 20 } },
        { give: { stone: 15 }, get: { food: 20 } },
        { give: { wood: 15 }, get: { water: 20 } },
      ].sort(() => Math.random() - 0.5).slice(0, 2);
      const lbl = (o) => Object.entries(o).map(([k, v]) => `${v} ${RES[k].name.toLowerCase()}`).join(', ');
      showCard('Événement', 'Un marchand ambulant', 'Il pose sa charrette sur la place et propose des échanges.',
        [...offers.map((o) => ({ label: `Donner ${lbl(o.give)} contre ${lbl(o.get)}`, ok: canPay(o.give), fn() {
          for (const [k, v] of Object.entries(o.give)) save.res[k] -= v;
          for (const [k, v] of Object.entries(o.get)) save.res[k] = Math.min(cap(), save.res[k] + v);
          log(`Échange avec le marchand : ${lbl(o.give)} contre ${lbl(o.get)}.`);
        } })), { label: 'Non merci' }]);
    } },
    { w: 2, ok: () => save.res.wood > 10, run() {
      const lost = Math.round(save.res.wood * 0.15);
      save.res.wood -= lost;
      log(`Une tempête a abîmé la réserve de bois (−${lost} bois).`); toast(`Tempête ! −${lost} bois.`);
    } },
    { w: 2, ok: () => !winter(), run() {
      save.res.food = Math.min(cap(), save.res.food + 20);
      log('Belle trouvaille en forêt : +20 nourriture.'); toast('Belle trouvaille en forêt : +20 nourriture.');
    } },
    { w: 2, ok: () => save.people.length < housing() && save.happy >= 40, run() {
      const a = addVillager('avec des voyageurs');
      const extra = save.people.length < housing() ? addVillager('avec des voyageurs') : null;
      toast(`Des voyageurs arrivent : ${a}${extra ? ' et ' + extra : ''} restent à Clairval.`);
    } },
    { w: 2, ok: () => save.people.length >= 5, run() {
      if (save.build.guerisseuse) { log('Une fièvre a touché le village, la guérisseuse l\'a vite soignée.'); toast('La guérisseuse a soigné une fièvre.'); }
      else { save.mods.push({ l: 'Fièvre au village', v: -12, d: 3 }); log('Une fièvre touche le village (−12 bonheur pendant 3 jours).'); toast('Fièvre au village : −12 bonheur pendant 3 jours. Une guérisseuse aiderait.'); }
    } },
    { w: 2, ok: () => winter() && save.res.food > 10, run() {
      const lost = Math.round(save.res.food * 0.1);
      save.res.food -= lost;
      log(`Des loups ont rôdé près du grenier (−${lost} nourriture).`); toast(`Des loups ont volé ${lost} de nourriture.`);
    } },
    { w: 1, ok: () => save.happy >= 70, run() {
      save.mods.push({ l: 'Souvenir de la fête', v: 8, d: 3 });
      log('Les habitants organisent une fête sous les étoiles (+8 bonheur pendant 3 jours).'); toast('Une fête spontanée ! +8 bonheur.');
    } },
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
  const ui = { card: $('card'), toast: $('toast'), sheet: $('sheet') };
  let W = 0, H = 0, dpr = 1, z = 1, gy = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    for (const c of [canvas, dark]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    z = clamp((H * 0.5) / 250, 1, 1.7);
    gy = H * 0.5 - 64 * z;
    camTarget = camX = clampCam(camX);
  }
  window.addEventListener('resize', resize);

  let toastTimer = 0;
  function toast(text) {
    const t = ui.toast;
    t.textContent = text; t.hidden = true; void t.offsetWidth; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
  }

  let cardIsIntro = false, speedBeforeCard = 1;
  function showCard(kicker, title, text, actions, intro) {
    cardIsIntro = !!intro;
    speedBeforeCard = save.speed || speedBeforeCard;
    save.speed = 0; renderSpeed();
    $('card-kicker').textContent = kicker; $('card-title').textContent = title; $('card-text').textContent = text;
    const box = $('card-actions'); box.innerHTML = '';
    for (const a of actions) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = a.label; b.disabled = a.ok === false;
      b.addEventListener('click', () => { if (a.fn) a.fn(); closeCard(); persist(); renderAll(); });
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
    if (!row.children.length) {
      for (const k of RKEYS) {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'res'; el.dataset.k = k;
        el.setAttribute('aria-label', `${RES[k].name} : aller à la source`);
        el.innerHTML = `<span class="lbl"><i style="background:${RES[k].color}"></i>${RES[k].name}</span><strong></strong><span class="rate"></span>`;
        row.appendChild(el);
      }
    }
    for (const el of row.children) {
      const k = el.dataset.k, net = prod[k] - cons[k];
      el.classList.toggle('alert', !!(short[k] || (net < 0 && save.res[k] < -net)));
      el.querySelector('strong').innerHTML = `${Math.floor(save.res[k])}<small>/${c}</small>`;
      const r = el.querySelector('.rate');
      r.className = 'rate ' + (net > 0.05 ? 'up' : net < -0.05 ? 'down' : '');
      r.textContent = `${net > 0 ? '+' : ''}${fmt(net)}/jour`;
    }
    $('pop-chip').innerHTML = `Habitants <strong>${save.people.length}/${housing()}</strong>`;
    const h = Math.round(save.happy);
    $('happy-chip').innerHTML = `Bonheur <strong style="color:${h >= 60 ? '#9fd46b' : h >= 35 ? '#e0a35a' : '#ef6b52'}">${h} %</strong>`;
    const hour = Math.floor(save.t * 24);
    $('time-chip').innerHTML = `Jour ${save.day} · <strong>${season().name}</strong> · ${String(hour).padStart(2, '0')} h`;
  }
  function renderSpeed() {
    for (const b of document.querySelectorAll('.speed button')) b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === save.speed));
  }

  function costHtml(c) {
    return Object.entries(c).map(([k, v]) => `<span class="${save.res[k] < v ? 'miss' : ''}"><i style="background:${RES[k].color}"></i>${v} ${RES[k].name.toLowerCase()}</span>`).join('');
  }

  function renderBuild() {
    const box = $('tab-build');
    const focusId = document.activeElement && document.activeElement.id;
    box.innerHTML = '<p class="help">Chaque construction apparaît dans le village. Récolte à la main au début, puis donne des métiers à tes habitants.</p>';
    for (const b of BUILDINGS) {
      const l = save.build[b.id], maxed = l >= b.max, c = costOf(b);
      const locked = b.need && save.people.length < b.need;
      const d = document.createElement('div');
      d.className = 'bld' + (locked ? ' locked' : '');
      d.innerHTML = `<h3>${b.name} <small>${l}/${b.max}</small></h3>
        <p>${b.desc}</p>
        <div class="cost">${maxed ? '<span>Complet</span>' : locked ? `<span>Il faut ${b.need} habitants</span>` : costHtml(c)}</div>
        <button type="button" id="b-${b.id}" ${maxed || locked || !canPay(c) ? 'disabled' : ''}>${maxed ? 'Fini' : l ? 'Agrandir' : 'Construire'}</button>`;
      d.querySelector('button').addEventListener('click', () => build(b.id));
      box.appendChild(d);
    }
    if (focusId && $(focusId)) $(focusId).focus();
  }

  function renderPeople() {
    const box = $('tab-people');
    const focusId = document.activeElement && document.activeElement.id;
    const { prod, cons } = rates();
    const n = save.people.length;
    let html = `<p class="help"><strong>${n}</strong> habitants pour <strong>${housing()}</strong> lits · <strong>${idleCount()}</strong> sans métier. Chaque habitant mange 1 et boit 1 par jour${winter() ? ", et l'hiver chaque habitant brûle 0,5 bois" : ''}.</p><div class="needs">`;
    const rows = [['food', 'Nourriture'], ['water', 'Eau'], ['wood', 'Chauffage']];
    for (const [k, label] of rows) {
      if (k === 'wood' && !winter()) { html += `<div class="need"><span>${label}</span><span class="help">Seulement en hiver</span><span></span></div>`; continue; }
      const net = prod[k] - cons[k];
      const days = net < 0 ? save.res[k] / -net : Infinity;
      const pct = Math.min(100, (prod[k] / Math.max(0.01, cons[k])) * 100);
      html += `<div class="need"><span>${label}</span><span class="bar"><i style="width:${pct}%;background:${pct >= 100 ? '#9fd46b' : pct >= 70 ? '#e0a35a' : '#ef6b52'}"></i></span>
        <span class="${net >= 0 ? 'ok' : 'ko'}">${net >= 0 ? 'Assez' : days < 1 ? 'Manque !' : `${Math.floor(days)} j de réserve`}</span></div>`;
    }
    html += '</div><h3>Bonheur</h3><ul class="happy-list">';
    for (const [l, v] of happinessFactors()) html += `<li><span>${l}</span><span class="${v >= 0 ? 'p' : 'm'}">${v > 0 ? '+' : ''}${v}</span></li>`;
    html += `</ul><p class="help">Au-dessus de 50 %, de nouveaux habitants arrivent s'il reste des lits et des réserves. Sous 25 %, des habitants partent.</p><h3>Métiers</h3>`;
    box.innerHTML = html;
    for (const j of JKEYS) {
      const J = JOBS[j], s = slots(j), c = countJob(j);
      const d = document.createElement('div');
      d.className = 'job';
      const locked = s === 0;
      d.innerHTML = `<span class="name">${J.name}<small>${locked ? `Il faut : ${BY_ID[J.bld].name}` : `+${fmt(jobRate(j))} ${RES[J.res].name.toLowerCase()}/jour chacun`}</small></span>
        <button type="button" id="j-${j}-m" aria-label="Retirer un ${J.name.toLowerCase()}" ${c ? '' : 'disabled'}>−</button>
        <span class="count">${c}/${s}</span>
        <button type="button" id="j-${j}-p" aria-label="Ajouter un ${J.name.toLowerCase()}" ${c < s && idleCount() ? '' : 'disabled'}>+</button>`;
      d.querySelector(`#j-${j}-m`).addEventListener('click', () => assign(j, -1));
      d.querySelector(`#j-${j}-p`).addEventListener('click', () => assign(j, 1));
      box.appendChild(d);
    }
    if (focusId && $(focusId)) $(focusId).focus();
  }

  function goalState(g) { const v = Math.min(g.goal, g.get()); return { v, done: v >= g.goal, claimed: !!save.claimed[g.id] }; }
  function renderGoals() {
    const box = $('tab-goals');
    box.innerHTML = '<p class="help">Les objectifs guident la croissance de Clairval. Réclame la récompense quand un objectif est atteint.</p>';
    for (const g of GOALS) {
      const s = goalState(g);
      const rw = Object.entries(g.reward).map(([k, v]) => `+${v} ${RES[k].name.toLowerCase()}`).join(', ');
      const d = document.createElement('div');
      d.className = 'goal' + (s.claimed ? ' done' : '');
      d.innerHTML = `<h3>${g.text}</h3><p>${s.v}/${g.goal} · Récompense : ${rw}</p><div class="bar"><i style="width:${(s.v / g.goal) * 100}%"></i></div>
        <button type="button" id="g-${g.id}" ${s.done && !s.claimed ? '' : 'disabled'}>${s.claimed ? 'Reçu' : 'Réclamer'}</button>`;
      d.querySelector('button').addEventListener('click', () => {
        if (!goalState(g).done || save.claimed[g.id]) return;
        save.claimed[g.id] = true;
        for (const [k, v] of Object.entries(g.reward)) save.res[k] = Math.min(cap(), save.res[k] + v);
        log(`Objectif atteint : ${g.text} (${rw}).`);
        toast(`Récompense reçue : ${rw}.`);
        persist(); renderAll();
      });
      box.appendChild(d);
    }
  }
  function renderLog() {
    $('log').innerHTML = save.log.map((e) => `<li><small>Jour ${e.d}</small>${e.text.replace(/</g, '&lt;')}</li>`).join('') || '<li>Rien pour l\'instant.</li>';
  }
  function renderBadges() {
    const idle = idleCount();
    const ib = $('idle-badge'); ib.hidden = !idle; ib.textContent = idle;
    const g = GOALS.filter((x) => { const s = goalState(x); return s.done && !s.claimed; }).length;
    const gb = $('goal-badge'); gb.hidden = !g; gb.textContent = g;
    for (const x of GOALS) {
      if (goalState(x).done && !save.notified[x.id] && !save.claimed[x.id]) { save.notified[x.id] = true; toast(`Objectif atteint : ${x.text}. Réclame ta récompense.`); }
    }
  }
  function renderTab() {
    for (const b of document.querySelectorAll('.tabs button')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', String(on));
      $('tab-' + b.dataset.tab).hidden = !on;
    }
    ({ build: renderBuild, people: renderPeople, goals: renderGoals, log: renderLog })[tab]();
  }
  function renderAll() { renderHud(); renderTab(); renderBadges(); }

  function build(id) {
    const b = BY_ID[id], c = costOf(b);
    if (save.build[id] >= b.max || !canPay(c) || (b.need && save.people.length < b.need)) return;
    for (const [k, v] of Object.entries(c)) save.res[k] -= v;
    save.build[id]++;
    log(`${b.name} ${save.build[id] > 1 ? `agrandie (niveau ${save.build[id]})` : 'construite'}.`);
    celebrate(id);
    if (id === 'beffroi' && !save.won) {
      save.won = true;
      setTimeout(() => showCard('Victoire', 'Clairval est né', `Le beffroi sonne pour la première fois. ${save.people.length} habitants dansent sur la place : chacun mange à sa faim, boit, et passe l'hiver au chaud.\n\nTu peux continuer à faire grandir le village.`, [{ label: 'Continuer' }]), 900);
    } else {
      const job = JKEYS.find((j) => JOBS[j].bld === id);
      toast(job ? `${b.name} : +${JOBS[job].per} postes de ${JOBS[job].name.toLowerCase()}. Onglet Habitants pour les pourvoir.` : `${b.name} ${save.build[id] > 1 ? 'agrandie' : 'construite'} !`);
    }
    persist(); renderAll();
  }

  // ---------- Monde : géométrie ----------
  const VW = 1240;
  const TREE_X = [16, 40, 66, 90, 116, 140, 164, 188];
  const BUSH_X = [214, 238, 262];
  const ROCK_X = [1118, 1150, 1184, 1216];
  const FRONT = { bucheron: 308, grenier: 402, puits: 494, place: 584, taverne: 676, guerisseuse: 768, atelier: 862, pecheur: 958, carriere: 1058 };
  const HOUSES = [362, 414, 466, 518, 744, 796, 848, 900];
  const BACK_Y = -22;
  let camX = 584, camTarget = 584;
  const clampCam = (c) => { const half = W / 2 / z; return VW <= 2 * half ? VW / 2 : clamp(c, half, VW - half); };
  const toScreen = (wx, wy) => [W / 2 + (wx - camX) * z, gy + wy * z];

  // ---------- Effets ----------
  let floats = [], sparks = [], bounce = { id: null, t0: -9 }, time = 0;
  function floatText(wx, wy, text, color) { floats.push({ x: wx, y: wy, text, color, life: 1.2 }); }
  function celebrate(id) {
    const x = id === 'maison' ? HOUSES[Math.max(0, save.build.maison - 1)] : id === 'champ' ? 1040 : id === 'beffroi' ? 632 : FRONT[id];
    camTarget = clampCam(x);
    bounce = { id, t0: time };
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * TAU, v = 30 + Math.random() * 90;
      sparks.push({ x, y: -30, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 1 + Math.random() * 0.7 });
    }
  }

  // ---------- Récolte à la main ----------
  function gatherAt(wx, wy) {
    const c = cap();
    const add = (k, x, y) => {
      if (save.res[k] >= c) { floatText(x, y, 'Réserve pleine', '#ef6b52'); return; }
      save.res[k] = Math.min(c, save.res[k] + 1);
      save.stats.gathered++;
      floatText(x, y, `+1 ${RES[k].name.toLowerCase()}`, RES[k].color);
      hudDirty = true;
      hideHint();
    };
    // rivière
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
        save.berries[i]--;
        add('food', BUSH_X[i], -24);
        return true;
      }
    }
    for (const rx of ROCK_X) {
      if (Math.abs(wx - rx) < 16 && wy < 4 && wy > -28) {
        add('stone', rx, -28);
        for (let k = 0; k < 5; k++) sparks.push({ x: rx, y: -14, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0.6, grey: true });
        return true;
      }
    }
    return false;
  }
  function splash(wx) { for (let k = 0; k < 6; k++) sparks.push({ x: wx, y: 36, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 40, life: 0.5, water: true }); }
  let hintHidden = false;
  function hideHint() { if (!hintHidden && save.stats.gathered > 5) { hintHidden = true; $('gather-hint').hidden = true; } }

  // ---------- Habitants animés ----------
  let walkers = [];
  function syncPeople() {
    while (walkers.length < save.people.length) walkers.push({ x: 560 + Math.random() * 60, tx: 580, y: 16, pause: 0, face: 1, seed: Math.random() });
    walkers.length = save.people.length;
  }
  function homeX(i) {
    const houses = HOUSES.slice(0, save.build.maison);
    if (!houses.length) return 612 + (i % 2) * 34;
    return houses[i % houses.length];
  }
  function updateWalkers(dt, night) {
    save.people.forEach((p, i) => {
      const w = walkers[i];
      if (!w) return;
      let range;
      if (night) range = [homeX(i) - 2, homeX(i) + 2, 8];
      else if (p.job === 'idle') range = [548, 622, 16];
      else range = JOBS[p.job].where;
      w.ty = range[2];
      if (!night && w.pause > 100) w.pause = 0;
      if (w.pause > 0) { w.pause -= dt; }
      else if (Math.abs(w.x - w.tx) < 1.5 || w.tx < range[0] - 1 || w.tx > range[1] + 1) {
        if (Math.abs(w.x - w.tx) < 1.5) w.pause = night ? 999 : 1 + Math.random() * 2.5;
        w.tx = range[0] + Math.random() * (range[1] - range[0]);
      } else {
        const sp = 26 * dt;
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
  function mix(a, b, t) {
    const pa = parseCol(a), pb = parseCol(b);
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  }
  let lights = [];
  function light(wx, wy, r, a) { const [sx, sy] = toScreen(wx, wy); lights.push({ x: sx, y: sy, r: r * z, a }); }

  function dayLight(t) {
    if (t < 0.18 || t > 0.86) return 0;
    if (t < 0.28) return (t - 0.18) / 0.1;
    if (t > 0.76) return (0.86 - t) / 0.1;
    return 1;
  }

  function house(x, y, w, h, wall, roof, lvl) {
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - h); ctx.lineTo(x, y - h - h * 0.75); ctx.lineTo(x + w / 2 + 5, y - h); ctx.fill();
    ctx.fillStyle = '#3a2618'; ctx.fillRect(x - 4, y - 12, 8, 12);
    ctx.fillStyle = '#f2c46b'; ctx.fillRect(x + w / 4 - 3, y - h + 7, 6, 6);
    light(x + w / 4, y - h + 10, 16, 0.9);
    if (winter()) { ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - h); ctx.lineTo(x, y - h - h * 0.75); ctx.lineTo(x + w / 2 + 5, y - h); ctx.lineTo(x + w / 2, y - h - 3); ctx.lineTo(x, y - h - h * 0.75 + 4); ctx.lineTo(x - w / 2, y - h - 3); ctx.fill(); }
  }
  function smoke(x, y, n) {
    if (reduced) return;
    for (let k = 0; k < n; k++) { const ph = (time * 0.3 + k / n) % 1; ctx.fillStyle = `rgba(220,220,225,${0.3 * (1 - ph)})`; circle(x + Math.sin(ph * 6 + k) * 3, y - ph * 34, 2.5 + ph * 5); }
  }

  function drawBuilding(id, lvl) {
    if (!lvl) return;
    const x = FRONT[id];
    const s = bounce.id === id && time - bounce.t0 < 1.2 ? 1 + 0.2 * Math.sin((time - bounce.t0) * 12) * Math.exp(-(time - bounce.t0) * 3) : 1;
    ctx.save(); ctx.translate(x, 0); ctx.scale(s, s); ctx.translate(-x, 0);
    switch (id) {
      case 'bucheron':
        house(x, 0, 40, 26, '#6b4a2e', '#4a3020');
        for (let i = 0; i < lvl * 3; i++) { ctx.fillStyle = i % 2 ? '#a0703f' : '#8a5a2b'; circle(x + 26 + (i % 3) * 6, -3 - Math.floor(i / 3) * 6, 3); }
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 26, 0); ctx.lineTo(x - 30, -12); ctx.stroke();
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
        // mâts à fanions
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
      case 'atelier':
        house(x, 0, 50, 30, '#5a5048', '#3a3430');
        ctx.fillStyle = '#20171c'; ctx.fillRect(x + 12, -54, 8, 22); smoke(x + 16, -56, 3);
        const f = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 9);
        glow(x - 12, -8, 14 * f, 'rgba(255,130,50,0.6)'); light(x - 12, -8, 20, 0.9);
        if (lvl >= 2) { ctx.fillStyle = '#9aa3ad'; ctx.save(); ctx.translate(x - 32, -26); ctx.rotate(reduced ? 0 : time); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-1.5, 0, 3, 10); } ctx.restore(); }
        break;
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
    }
    ctx.restore();
  }

  function drawBack() {
    // champs
    for (let i = 0; i < 3; i++) {
      const x = 990 + i * 52;
      if (i >= save.build.champ) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; continue; }
      const sid = season().id;
      ctx.fillStyle = sid === 'hiver' ? '#e8eef2' : '#5a3e24'; ctx.fillRect(x - 24, BACK_Y - 8, 48, 10);
      const col = { printemps: '#7cc05a', ete: '#b9c24a', automne: '#e0b64a', hiver: null }[sid];
      if (col) for (let k = 0; k < 8; k++) { ctx.fillStyle = col; ctx.fillRect(x - 22 + k * 6, BACK_Y - 8 - (sid === 'printemps' ? 4 : 9), 2, sid === 'printemps' ? 4 : 9); }
    }
    // tentes du campement, puis beffroi
    if (!save.build.beffroi) {
      for (const [tx, c] of [[612, '#c9a36b'], [650, '#b0806a']]) {
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(tx - 16, BACK_Y); ctx.lineTo(tx, BACK_Y - 22); ctx.lineTo(tx + 16, BACK_Y); ctx.fill();
        ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.moveTo(tx - 4, BACK_Y); ctx.lineTo(tx, BACK_Y - 10); ctx.lineTo(tx + 4, BACK_Y); ctx.fill();
      }
    } else {
      const x = 632, s = bounce.id === 'beffroi' && time - bounce.t0 < 1.2 ? 1 + 0.15 * Math.sin((time - bounce.t0) * 12) * Math.exp(-(time - bounce.t0) * 3) : 1;
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s, s); ctx.translate(-x, -BACK_Y);
      ctx.fillStyle = '#8a8378'; ctx.fillRect(x - 16, BACK_Y - 96, 32, 96);
      ctx.fillStyle = '#5e2a20'; ctx.beginPath(); ctx.moveTo(x - 22, BACK_Y - 96); ctx.lineTo(x, BACK_Y - 132); ctx.lineTo(x + 22, BACK_Y - 96); ctx.fill();
      ctx.fillStyle = '#efe3c8'; circle(x, BACK_Y - 76, 8); ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, BACK_Y - 76); ctx.lineTo(x + Math.cos(time * 0.2) * 6, BACK_Y - 76 + Math.sin(time * 0.2) * 6); ctx.moveTo(x, BACK_Y - 76); ctx.lineTo(x, BACK_Y - 81); ctx.stroke();
      ctx.fillStyle = '#c9a33a'; ctx.fillRect(x - 5, BACK_Y - 108, 10, 8); light(x, BACK_Y - 104, 22, 1);
      ctx.fillStyle = '#e0a35a'; ctx.fillRect(x + 1, BACK_Y - 150, 2, 18); ctx.beginPath(); ctx.moveTo(x + 3, BACK_Y - 150); ctx.lineTo(x + 16, BACK_Y - 145); ctx.lineTo(x + 3, BACK_Y - 140); ctx.fill();
      ctx.restore();
    }
    // maisons
    for (let i = 0; i < save.build.maison; i++) {
      const x = HOUSES[i];
      const s = bounce.id === 'maison' && i === save.build.maison - 1 && time - bounce.t0 < 1.2 ? 1 + 0.2 * Math.sin((time - bounce.t0) * 12) * Math.exp(-(time - bounce.t0) * 3) : 1;
      ctx.save(); ctx.translate(x, BACK_Y); ctx.scale(s * 0.9, s * 0.9); ctx.translate(-x, -BACK_Y);
      house(x, BACK_Y, 38, 26, ['#8a6a4a', '#7a5a4a', '#9a7a5a', '#6a5a4a'][i % 4], ['#5e2a20', '#3a3430', '#6b3a2a', '#4a3020'][i % 4]);
      ctx.fillStyle = '#2c1f1a'; ctx.fillRect(x + 8, BACK_Y - 48, 6, 12);
      if (dayLight(save.t) < 0.6 || winter()) smoke(x + 11, BACK_Y - 50, 2);
      ctx.restore();
    }
  }

  function drawTree(i) {
    const x = TREE_X[i], t = save.trees[i], se = season();
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
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = se.leaf[k % 2];
      circle(x + sh + [-7, 7, 0, -2][k], -h * [0.55, 0.58, 0.78, 0.66][k], 11 - k);
    }
    if (se.id === 'printemps') { ctx.fillStyle = '#ffd6e6'; for (let k = 0; k < 4; k++) circle(x + sh - 8 + k * 5, -h * 0.6 - (k % 2) * 8, 1.6); }
    // points de vie restants
    if (t.hp < 5) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 10, 4, 20, 3); ctx.fillStyle = '#e0a35a'; ctx.fillRect(x - 10, 4, 4 * t.hp, 3); }
  }
  function drawBush(i) {
    const x = BUSH_X[i];
    ctx.fillStyle = winter() ? '#dfe8ee' : '#3f7a34'; circle(x - 5, -7, 8); circle(x + 5, -7, 8); circle(x, -12, 8);
    ctx.fillStyle = '#d43a4a';
    for (let k = 0; k < save.berries[i]; k++) circle(x - 7 + (k % 3) * 7, -14 + Math.floor(k / 3) * 6, 1.8);
  }
  function drawRock(x, i) {
    ctx.fillStyle = ['#8a8a96', '#7a7a86', '#9696a2', '#82828e'][i];
    ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x - 12, -16 - i * 2); ctx.lineTo(x, -24 + (i % 2) * 4); ctx.lineTo(x + 12, -14); ctx.lineTo(x + 16, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x - 10, -14); ctx.lineTo(x, -22 + (i % 2) * 4); ctx.lineTo(x + 2, -10); ctx.fill();
    if (winter()) { ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.ellipse(x - 2, -20 + (i % 2) * 3, 8, 3, 0, 0, TAU); ctx.fill(); }
  }
  function drawPerson(w, p) {
    const x = w.x, y = w.y;
    const moving = w.pause <= 0;
    const bob = moving && !reduced ? Math.abs(Math.sin(time * 10 + w.seed * 10)) * 1.2 : 0;
    const col = p.job === 'idle' ? '#9a8f7a' : JOBS[p.job].color;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 4, 1.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.4;
    const leg = moving && !reduced ? Math.sin(time * 10 + w.seed * 10) * 2 : 0;
    ctx.beginPath(); ctx.moveTo(x - 1, y - 4); ctx.lineTo(x - 1 + leg, y); ctx.moveTo(x + 1, y - 4); ctx.lineTo(x + 1 - leg, y); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(x - 3, y - 11 - bob, 6, 7);
    ctx.fillStyle = '#e8c39e'; circle(x, y - 13.5 - bob, 2.6);
    // outil ou charge selon le métier, en action quand il travaille
    const working = !moving && p.job !== 'idle';
    const sw = working && !reduced ? Math.sin(time * 8 + w.seed * 6) : 0;
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 1.2;
    if (p.job === 'bucheron' || p.job === 'carrier') { ctx.beginPath(); ctx.moveTo(x + 3 * w.face, y - 9 - bob); ctx.lineTo(x + (6 + sw * 2) * w.face, y - 14 - sw * 3 - bob); ctx.stroke(); }
    else if (p.job === 'porteur') { ctx.fillStyle = '#6b8fb0'; ctx.fillRect(x + 3 * w.face - 1.5, y - 8 - bob, 3, 4); }
    else if (p.job === 'pecheur') { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 12 * w.face, y - 20); ctx.stroke(); }
    else if (p.job === 'fermier' || p.job === 'cueilleur') { ctx.fillStyle = '#c9a36b'; ctx.fillRect(x - 3 * w.face - 2, y - 8 - bob, 4, 3); }
  }

  function draw() {
    const t = save.t, L = dayLight(t), se = season();
    lights = [];
    // Ciel
    const skyDay = se.sky, skyNight = '#0d1430';
    const dusk = t > 0.7 && t < 0.9 ? Math.max(0, 1 - Math.abs(t - 0.8) / 0.08) : t > 0.14 && t < 0.3 ? Math.max(0, 1 - Math.abs(t - 0.22) / 0.08) : 0;
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, mix(skyNight, skyDay, L));
    g.addColorStop(1, mix(mix('#1c2240', mix('#cfe6f2', skyDay, 0.4), L), '#e8946a', dusk * 0.8));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 80 * z);
    if (L < 0.9) for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,250,230,${(1 - L) * (0.4 + 0.4 * Math.sin(time + i))})`; ctx.fillRect(rnd(i) * W, rnd(i + 50) * gy * 0.7, 1.5, 1.5); }
    // Soleil ou lune sur un arc
    const a = ((t - 0.2) / 0.66) * Math.PI;
    if (t > 0.18 && t < 0.88) { const sx = W * 0.1 + (W * 0.8) * ((t - 0.18) / 0.7), sy = gy * 0.75 - Math.sin(a) * gy * 0.5; glow(sx, sy, 40, 'rgba(255,230,160,0.5)'); ctx.fillStyle = '#ffe6a0'; circle(sx, sy, 11); }
    else { const tt = t > 0.5 ? t - 0.86 : t + 0.14, sx = W * 0.15 + W * 0.7 * (tt / 0.32), sy = gy * 0.3; ctx.fillStyle = '#f4ead2'; circle(sx, sy, 9); }
    // Collines et forêt lointaine (parallaxe)
    ctx.fillStyle = mix('#1a2233', se.id === 'hiver' ? '#9fb0bf' : '#5a7a6a', L);
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let sx = 0; sx <= W; sx += 10) { const wx = sx / z * 0.3 + camX * 0.3; ctx.lineTo(sx, gy - (46 + 22 * Math.sin(wx * 0.02) + 12 * Math.sin(wx * 0.05)) * z * 0.7); }
    ctx.lineTo(W, gy); ctx.fill();
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
    // chemin
    ctx.fillStyle = mix('#2a2218', se.id === 'hiver' ? '#cfd8de' : '#9a8460', 0.3 + 0.7 * L); ctx.fillRect(-50, 10, VW + 100, 10);
    for (let i = 0; i < TREE_X.length; i++) drawTree(i);
    for (let i = 0; i < BUSH_X.length; i++) drawBush(i);
    ROCK_X.forEach(drawRock);
    for (const b of BUILDINGS) if (FRONT[b.id] && b.id !== 'pecheur') drawBuilding(b.id, save.build[b.id]);
    // feu de camp au centre
    if (!save.build.place || save.build.place < 2) {
      const fx = 584, f = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 11) * Math.sin(time * 7);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(fx - 8, -3, 16, 3);
      glow(fx, -6, 14 * f, 'rgba(255,150,60,0.7)'); ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(fx - 5, -2); ctx.quadraticCurveTo(fx, -16 * f, fx + 5, -2); ctx.fill();
      light(fx, -6, 40, 1);
    }
    // habitants (la nuit, ils rentrent chez eux)
    const night = L < 0.25;
    save.people.forEach((p, i) => {
      const w = walkers[i]; if (!w) return;
      if (night && w.pause > 100) return;
      drawPerson(w, p);
    });
    // rivière
    const rg = ctx.createLinearGradient(0, 30, 0, 60);
    const ice = se.id === 'hiver';
    rg.addColorStop(0, mix('#0e1a2a', ice ? '#b7d6e8' : '#4f8fbf', 0.35 + 0.65 * L)); rg.addColorStop(1, mix('#0a1422', ice ? '#9fc3d8' : '#2f6f9a', 0.35 + 0.65 * L));
    ctx.fillStyle = rg; ctx.fillRect(-50, 30, VW + 100, 30);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.2 * L})`; ctx.lineWidth = 1;
    for (let k = 0; k < 24; k++) { const wx = ((k * 67 + time * 12) % (VW + 100)) - 50, wy = 36 + (k % 4) * 5; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 12, wy); ctx.stroke(); }
    if (save.build.pecheur) drawBuilding('pecheur', save.build.pecheur);
    ctx.fillStyle = mix('#101810', '#3a5a2a', 0.3 + 0.7 * L); ctx.fillRect(-50, 60, VW + 100, 200);
    // effets
    const dt = 1 / 60;
    sparks = sparks.filter((p) => (p.life -= dt) > 0);
    for (const p of sparks) {
      p.vy += 140 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.grey) { ctx.fillStyle = '#b5b6c4'; ctx.fillRect(p.x, p.y, 2, 2); }
      else if (p.water) { ctx.fillStyle = 'rgba(160,210,255,0.9)'; circle(p.x, p.y, 1.5); }
      else glow(p.x, p.y, 5, `rgba(255,210,120,${Math.min(1, p.life)})`);
    }
    floats = floats.filter((f) => (f.life -= dt) > 0);
    ctx.font = '700 8px "Nunito Sans", system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const f of floats) { f.y -= 18 * dt; ctx.globalAlpha = Math.min(1, f.life * 1.5); ctx.fillStyle = '#10180f'; ctx.fillText(f.text, f.x + 0.6, f.y + 0.6); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
    ctx.restore();

    // Nuit : obscurité percée par les fenêtres et le feu
    const darkness = (1 - L) * 0.62;
    if (darkness > 0.02) {
      dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
      dctx.fillStyle = `rgba(5,8,20,${darkness})`; dctx.fillRect(0, 0, W, H);
      dctx.globalCompositeOperation = 'destination-out';
      for (const l of lights) { const gr = dctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = gr; dctx.beginPath(); dctx.arc(l.x, l.y, l.r, 0, TAU); dctx.fill(); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) glow(l.x, l.y, l.r * 0.5, `rgba(255,170,80,${0.25 * (1 - L)})`);
      ctx.globalCompositeOperation = 'source-over';
    }
    // Neige, feuilles, pétales
    if (!reduced && se.id !== 'ete') {
      for (let i = 0; i < 40; i++) {
        const sp = se.id === 'hiver' ? 18 : 12;
        const px = (rnd(i) * W + Math.sin(time * 0.8 + i) * 20 + time * (se.id === 'hiver' ? 4 : 14)) % W;
        const py = (rnd(i + 9) * H * 0.5 + time * sp * (0.6 + rnd(i + 3))) % (H * 0.5);
        ctx.fillStyle = se.id === 'hiver' ? 'rgba(255,255,255,0.85)' : se.id === 'automne' ? 'rgba(208,138,58,0.8)' : 'rgba(255,214,230,0.8)';
        if (se.id === 'hiver') circle(px, py, 1.6); else { ctx.fillRect(px, py, 3, 2); }
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
    if (gameDt > 0 && save.intro) { step(gameDt); updateWalkers(gameDt, dayLight(save.t) < 0.25); }
    camX += (camTarget - camX) * Math.min(1, dt * 5);
    draw();
    hudTimer += dt; autosave += dt;
    if (hudTimer > 0.25 || hudDirty) {
      hudTimer = 0; hudDirty = false; renderHud();
      const sig = tab + BUILDINGS.map((b) => canPay(costOf(b)) ? 1 : 0).join('') + idleCount() + save.people.length;
      if (sig !== lastSig) { lastSig = sig; renderTab(); renderBadges(); }
    }
    if (autosave > 20) { autosave = 0; persist(); if (tab !== 'log') renderTab(); renderBadges(); }
    requestAnimationFrame(frame);
  }

  // ---------- Contrôles ----------
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (!ui.card.hidden) return;
    drag = { x: e.clientX, y: e.clientY, cam: camTarget, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x) > 8) drag.moved = true;
    if (drag.moved) { camTarget = camX = clampCam(drag.cam - (e.clientX - drag.x) / z); }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved) {
      const r = canvas.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      const wx = (sx - W / 2) / z + camX, wy = (sy - gy) / z;
      gatherAt(wx, wy);
    }
    drag = null;
  });
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') camTarget = clampCam(camTarget - 80);
    if (e.key === 'ArrowRight') camTarget = clampCam(camTarget + 80);
  });
  // Toucher une ressource du bandeau : la caméra va à sa source
  $('res-row').addEventListener('click', (e) => {
    const i = [...$('res-row').children].indexOf(e.target.closest('.res'));
    if (i >= 0) camTarget = clampCam([236, 494, 100, 1160][i]);
  });
  for (const b of document.querySelectorAll('.speed button')) b.addEventListener('click', () => { save.speed = Number(b.dataset.speed); renderSpeed(); persist(); });
  for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => { tab = b.dataset.tab; renderTab(); });

  // Sauvegarde : boutons
  $('btn-save').addEventListener('click', async () => {
    persist();
    if (cloudRef) { clearTimeout(cloudTimer); await pushCloud(); }
    toast(cloudRef ? 'Village sauvegardé sur ton compte.' : 'Village sauvegardé sur cet appareil.');
  });
  $('btn-export').addEventListener('click', async () => {
    persist();
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
    const box = $('save-code'); box.value = code;
    try { await navigator.clipboard.writeText(code); toast('Code copié. Garde-le précieusement.'); }
    catch (e) { box.focus(); box.select(); toast('Sélectionne le code et copie-le.'); }
  });
  let armed = { imp: false, reset: false };
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
        save = mergeSave(s); box.value = ''; persist(); syncPeople(); renderAll(); renderSpeed(); toast('Village chargé depuis le code.');
      } catch (err) { toast("Ce code ne fonctionne pas. Vérifie qu'il est complet."); }
    });
  });
  $('btn-reset').addEventListener('click', (e) => {
    twoStep('reset', e.currentTarget, 'Recommencer un village', 'Toucher encore pour tout effacer', () => {
      save = fresh(); walkers = []; syncPeople(); persist(); renderAll(); renderSpeed(); intro();
    });
  });

  // ---------- Démarrage ----------
  function intro() {
    showCard('Prologue', 'La clairière de Clairval', 'Tu arrives avec Lou, Mila et Jules dans une clairière au bord d\'une rivière. Il y a du bois, de la pierre, des baies et de l\'eau claire.\n\nConstruis un village où chacun mange à sa faim, boit, et reste au chaud l\'hiver. Touche les arbres, les rochers, les buissons et la rivière pour récolter.',
      [{ label: 'Fonder le village', fn() { save.intro = true; save.lastTs = Date.now(); } }], true);
    speedBeforeCard = 1;
  }
  function offlineReport() {
    const secs = (Date.now() - (save.lastTs || Date.now())) / 1000;
    if (!save.intro || secs < 90) return;
    const days = Math.min(2, secs / DAY);
    const { prod } = rates();
    const gains = {};
    for (const k of RKEYS) {
      const g = Math.min(cap() - save.res[k], prod[k] * days * 0.5);
      if (g >= 1) { save.res[k] += g; gains[k] = Math.floor(g); }
    }
    const list = Object.entries(gains).map(([k, v]) => `+${v} ${RES[k].name.toLowerCase()}`).join(', ');
    const h = secs / 3600;
    const away = h >= 1 ? `${Math.floor(h)} h ${Math.floor((h % 1) * 60)} min` : `${Math.floor(secs / 60)} min`;
    if (list) showCard('Retour au village', 'Pendant ton absence', `Tu es parti ${away}. Tes habitants ont continué à travailler (à moitié de leur rythme) :\n${list}.`, [{ label: 'Reprendre' }]);
  }

  resize();
  syncPeople();
  if (save.stats.gathered > 5 || save.day > 2) { hintHidden = true; $('gather-hint').hidden = true; }
  setSaveStatus('local');
  renderAll(); renderSpeed();
  if (!save.intro) intro(); else offlineReport();
  initCloud();
  requestAnimationFrame(frame);
})();
