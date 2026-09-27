/* La Lanterne d'Ilia
 * Descente : ne rien toucher. Remontée : tout attraper. Revendre au village pour s'équiper,
 * jusqu'à rapporter le Cœur-Graine qui rendra la vie au Grand Chêne.
 * Tout le réglage (zones, objets, améliorations, textes de l'histoire) est dans les constantes ci-dessous. */
(() => {
  'use strict';

  const PX = 10;               // pixels par mètre
  const DESCENT = 190;         // px/s
  const ASCENT = 270;          // px/s
  const HEART_DEPTH = 1050;    // profondeur du Cœur-Graine (m)
  const SAVE_KEY = 'lanterne-ilia-v1';
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Monde ----------
  const BIOMES = [
    { name: 'Le Terreau', from: 0, bg: '#2a1a12', rock: '#3d2718', edge: '#7a5433', mote: '200,160,110' },
    { name: 'La Grotte des lunes', from: 120, bg: '#0f2427', rock: '#1b3336', edge: '#4f8c84', mote: '140,230,210' },
    { name: 'Le Lac muet', from: 320, bg: '#0c1630', rock: '#16233f', edge: '#4a6aa6', mote: '170,200,255' },
    { name: 'La Galerie chantante', from: 560, bg: '#1d1233', rock: '#2a1b45', edge: '#9a7ad6', mote: '215,190,255' },
    { name: 'Les Veines de braise', from: 800, bg: '#2c0e09', rock: '#3a140c', edge: '#d0582f', mote: '255,150,80' },
  ];

  // light : rayon du halo que l'objet projette dans l'obscurité
  const TYPES = {
    luciole: { name: 'Luciole', value: 2, minD: 0, maxD: 330, r: 10, vx: 0.07, weight: 10, light: 46 },
    graine:  { name: 'Graine dormante', value: 5, minD: 15, r: 11, vx: 0.03, weight: 8 },
    champi:  { name: 'Champignon-lune', value: 14, minD: 120, r: 14, vx: 0.02, weight: 9, light: 60 },
    perle:   { name: 'Perle du lac', value: 38, minD: 320, r: 13, vx: 0.05, weight: 8, light: 34 },
    cristal: { name: 'Cristal chantant', value: 85, minD: 560, r: 16, vx: 0.04, weight: 7, light: 58 },
    braise:  { name: 'Braise vive', value: 190, minD: 800, r: 14, vx: 0.08, weight: 6, light: 60 },
    coeur:   { name: 'Cœur-Graine', value: 5000, minD: HEART_DEPTH, r: 30, vx: 0.03, weight: 0, light: 150 },
    araignee: { name: 'Araignée des racines', hazard: true, minD: 30, r: 13, vx: 0 },
    chauve:  { name: 'Chauve-souris', hazard: true, minD: 90, r: 15, vx: 0.32 },
  };
  const CATCH = Object.keys(TYPES).filter((k) => !TYPES[k].hazard);

  const UPGRADES = [
    { id: 'corde', name: 'Corde', desc: 'Profondeur maximale', fmt: (v) => `${v} m`,
      values: [60, 120, 200, 320, 440, 560, 700, 850, 1000, 1100],
      costs: [0, 40, 110, 260, 520, 950, 1700, 2900, 4600, 7000] },
    { id: 'lanterne', name: 'Lanterne', desc: 'Rayon de lumière', fmt: (v) => `${v} pas`,
      values: [120, 150, 185, 225, 270, 320],
      costs: [0, 60, 180, 450, 1000, 2000] },
    { id: 'panier', name: 'Panier', desc: 'Trouvailles par descente', fmt: (v) => `${v}`,
      values: [3, 5, 8, 12, 17, 23, 30, 40],
      costs: [0, 30, 90, 220, 480, 950, 1900, 3600] },
    { id: 'ecorce', name: "Charme d'écorce", desc: 'Chocs encaissés à la descente', fmt: (v) => `${v}`,
      values: [0, 1, 2, 3, 4, 5],
      costs: [0, 80, 240, 650, 1500, 3200] },
    { id: 'poulie', name: 'Poulie', desc: 'Vitesse de la lanterne', fmt: (v) => `×${v}`,
      values: [1, 1.3, 1.6, 1.95, 2.35, 2.8],
      costs: [0, 50, 150, 420, 950, 2100] },
  ];

  // ---------- Histoire ----------
  const STORY = {
    intro: [
      { kicker: 'Prologue', title: 'Le Grand Chêne',
        text: "À Brume-sous-Chêne, tout le monde vit à l'ombre du Grand Chêne. Cet hiver, ses feuilles sont tombées en une nuit. Au printemps, aucune n'a repoussé." },
      { kicker: 'Prologue', title: 'Ce que dit Oda',
        text: "Grand-mère Oda connaît les vieilles histoires. « La vie du Chêne vient d'en bas, dit-elle. De son Cœur-Graine, tout au fond, sous les racines. Le vieux puits y descend. »" },
      { kicker: 'Prologue', title: 'La lanterne',
        text: "Ilia prend la lanterne de sa mère, une corde et un panier. Descends sans rien toucher : au moindre choc, la corde te remonte. En remontant, attrape tout ce que tu frôles. Le village t'achètera tes trouvailles." },
    ],
    chapters: [
      null,
      { title: 'La Grotte des lunes',
        text: "Sous la terre, des champignons brillent comme des lunes pâles. Oda sourit en les voyant : « Ta mère en rapportait aussi, à ton âge. »" },
      { title: 'Le Lac muet',
        text: "Un lac immobile, noir comme l'encre. Des perles dorment dans des coquillages ouverts. Et plus bas, quelque chose respire lentement." },
      { title: 'La Galerie chantante',
        text: "Les cristaux vibrent quand la lanterne passe. Ils chantent un air que personne au village ne connaît. Personne, sauf Oda, qui le fredonne en secret." },
      { title: 'Les Veines de braise',
        text: "Il fait chaud. Les racines du Chêne plongent dans la braise, et elles battent comme un cœur. Le Cœur-Graine est tout près, à 1 050 mètres." },
    ],
    ending: { kicker: 'Épilogue', title: 'Le printemps revient',
      text: "Ilia pose le Cœur-Graine au pied du Grand Chêne. Au matin, le village se réveille sous une pluie de feuilles neuves. Oda pleure un peu, et rit beaucoup. Le puits, lui, garde encore des trésors." },
  };
  const ODA = [
    '« La corde est courte, ma grande. Le forgeron peut t\'en tresser une plus longue. »',
    '« Plus bas, il paraît qu\'il y a un lac. Il te faudra une lanterne plus vive. »',
    '« Les perles du lac valent cher au marché. Prends un plus grand panier. »',
    '« Tu entends ce chant ? C\'est le Chêne qui t\'appelle. »',
    '« Le Cœur-Graine est tout près. Tiens bon, Ilia. »',
  ];
  const ODA_END = '« Le Chêne respire à nouveau. Le puits garde encore des trésors, si le cœur t\'en dit. »';

  // ---------- Sauvegarde ----------
  const fresh = () => ({ sous: 0, lvl: { corde: 0, lanterne: 0, panier: 0, ecorce: 0, poulie: 0 },
    seen: {}, best: 0, dives: 0, maxBiome: 0, heart: false, intro: false });
  let save = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      save = Object.assign(fresh(), s, { lvl: Object.assign(fresh().lvl, s.lvl) });
    }
  } catch (e) { /* stockage indisponible : partie non sauvegardée */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  const stat = (id) => UPGRADES.find((u) => u.id === id).values[save.lvl[id]];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  const dctx = dark.getContext('2d');
  const ui = {
    menu: $('menu'), result: $('result'), hud: $('hud'), hint: $('hint'), story: $('story'),
    toast: $('toast'), toastSub: $('toast-sub'), toastName: $('toast-name'),
    oda: $('oda'), purse: $('purse'), shop: $('shop'), journal: $('journal'),
    codex: $('codex'), codexCount: $('codex-count'), records: $('records'),
    depth: $('hud-depth'), max: $('hud-max'), hold: $('hud-hold'), shield: $('hud-shield'),
    haul: $('haul'), haulTotal: $('haul-total'), resultTitle: $('result-title'), resultSub: $('result-sub'),
  };

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    for (const c of [canvas, dark]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);

  // ---------- Outils ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const biomeIndex = (m) => { let i = 0; BIOMES.forEach((b, k) => { if (m >= b.from) i = k; }); return i; };
  function biomeColor(m, key) {
    const i = biomeIndex(m), next = BIOMES[i + 1];
    if (next && m > next.from - 30) return mix(BIOMES[i][key], next[key], (m - (next.from - 30)) / 30);
    return BIOMES[i][key];
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; circle(x, y, r);
  }

  // Distance entre le bord de l'écran et la paroi, à la profondeur y (px). Étroit dans le puits, large en grotte.
  function inset(y, side) {
    const s = side ? 2.1 : 0;
    const cave = W * (0.045 + 0.04 * (0.5 + 0.5 * Math.sin(y * 0.0035 + s)) + 0.022 * Math.sin(y * 0.011 + s * 3) + 0.01 * Math.sin(y * 0.037 + s * 5));
    if (y < 60) return W * 0.4;
    if (y < 260) { const t = (y - 60) / 200, e = t * t * (3 - 2 * t); return W * 0.4 * (1 - e) + cave * e; }
    return cave;
  }

  // ---------- État ----------
  let state = 'menu'; // menu | descent | ascent | result | story
  let probe, items = [], decos = [], camY = 0, time = 0, hintTimer = 0, keyDir = 0;
  const motes = Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), y: 0, s: rnd(i + 3), vy: 0 }));
  const skyStars = Array.from({ length: 50 }, (_, i) => ({ x: rnd(i), y: rnd(i + 99), t: rnd(i + 7) * 6 }));

  function resetProbe() {
    probe = { x: 0.5, target: 0.5, y: 30, max: 0, shield: 0, hold: 0, speed: 1, caught: [], lost: [],
      deepest: 0, reason: '', tilt: 0, biome: 0 };
  }

  function pickType(m) {
    const pool = CATCH.filter((k) => TYPES[k].weight && TYPES[k].minD <= m && (!TYPES[k].maxD || m < TYPES[k].maxD));
    const w = pool.map((k, i) => TYPES[k].weight * (i === pool.length - 1 ? 2.2 : i === pool.length - 2 ? 1 : 0.35));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  function makeItem(type, m) {
    const t = TYPES[type];
    return { type, x: 0.15 + Math.random() * 0.7, y: m * PX, cy: m * PX,
      vx: (Math.random() < 0.5 ? -1 : 1) * t.vx * (0.5 + Math.random() * 0.5),
      rot: Math.random() * TAU, seed: Math.random(), caught: false, cool: 0 };
  }

  function buildDecos(maxM) {
    decos = [];
    for (let y = 280, i = 0; y < (maxM + 40) * PX; y += 26 + rnd(i) * 40, i++) {
      decos.push({ y, side: rnd(i + 50) < 0.5 ? 0 : 1, b: biomeIndex(y / PX), s: rnd(i + 90) });
    }
  }

  function startDive() {
    const maxM = stat('corde');
    items = [];
    for (let m = 22; m < maxM + 25; m += 5 + Math.random() * 5) {
      items.push(makeItem(pickType(m), m));
      if (m > 30 && Math.random() < Math.min(0.34, m / 1600)) {
        items.push(makeItem(m >= 90 && Math.random() < 0.6 ? 'chauve' : 'araignee', m + 2 + Math.random() * 2));
      }
    }
    if (maxM >= HEART_DEPTH) items.push(Object.assign(makeItem('coeur', HEART_DEPTH), { x: 0.5 }));
    buildDecos(maxM);
    resetProbe();
    Object.assign(probe, { max: maxM * PX, shield: stat('ecorce'), hold: stat('panier'), speed: stat('poulie') });
    for (const mo of motes) mo.y = camY + Math.random() * H;
    save.dives++;
    setState('descent');
    showHint('Ne touche à rien…', 1.6);
  }

  function setState(s) {
    state = s;
    ui.menu.hidden = s !== 'menu';
    ui.result.hidden = s !== 'result';
    ui.story.hidden = s !== 'story';
    ui.hud.hidden = !(s === 'descent' || s === 'ascent');
    if (s !== 'descent' && s !== 'ascent') { ui.hint.hidden = true; ui.toast.hidden = true; }
    if (s === 'menu') renderMenu();
  }

  function showHint(text, dur) { ui.hint.textContent = text; ui.hint.hidden = false; hintTimer = dur; }
  function showToast(sub, name) {
    ui.toastSub.textContent = sub; ui.toastName.textContent = name;
    ui.toast.hidden = true; void ui.toast.offsetWidth; ui.toast.hidden = false;
  }

  function beginAscent(reason) {
    probe.reason = reason;
    state = 'ascent';
    showHint('Remonte, et attrape tout !', 1.5);
  }

  // ---------- Histoire ----------
  let storyQueue = [], storyDone = null;
  function playStory(cards, done) {
    storyQueue = cards.slice(); storyDone = done;
    setState('story');
    nextStory();
  }
  function nextStory() {
    const c = storyQueue.shift();
    if (!c) { const d = storyDone; storyDone = null; d(); return; }
    $('story-kicker').textContent = c.kicker;
    $('story-title').textContent = c.title;
    $('story-text').textContent = c.text;
    $('story-next').textContent = storyQueue.length ? 'Continuer' : (state === 'story' && c.kicker === 'Prologue' ? 'Prendre la lanterne' : 'Retour au village');
    const card = ui.story.firstElementChild;
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    $('story-next').focus();
  }

  // ---------- Boucle ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (state === 'descent' || state === 'ascent') update(dt);
    else camY += (-H * 0.4 - camY) * Math.min(1, dt * 3);
    updateMotes(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    if (hintTimer > 0 && (hintTimer -= dt) <= 0) ui.hint.hidden = true;

    // Déplacement latéral, limité par les parois
    const lo = inset(probe.y, 0) / W + 0.035, hi = 1 - inset(probe.y, 1) / W - 0.035;
    const step = 0.9 * probe.speed * dt;
    if (keyDir) probe.target = probe.x + keyDir * step * 2;
    probe.target = clamp(probe.target, lo, hi);
    const prevX = probe.x;
    probe.x = clamp(probe.x + clamp(probe.target - probe.x, -step, step), lo, hi);
    probe.tilt += (clamp(-(probe.x - prevX) / dt * 0.5, -0.5, 0.5) - probe.tilt) * Math.min(1, dt * 6);

    if (state === 'descent') {
      probe.y += DESCENT * dt;
      if (probe.y >= probe.max) { probe.y = probe.max; beginAscent('Tu es arrivée au bout de la corde.'); }
      const b = biomeIndex(probe.y / PX);
      if (b > probe.biome) { probe.biome = b; showToast(`${BIOMES[b].from} mètres`, BIOMES[b].name); }
    } else {
      const full = probe.caught.length >= probe.hold;
      probe.y -= ASCENT * (full ? 1.6 : 1) * dt;
      if (probe.y <= 30) { probe.y = 30; finishDive(); return; }
    }
    probe.deepest = Math.max(probe.deepest, probe.y);

    const px = probe.x * W;
    for (const it of items) {
      if (it.caught) continue;
      const t = TYPES[it.type];
      it.x += it.vx * dt;
      if (it.x < 0.14 || it.x > 0.86) { it.vx *= -1; it.x = clamp(it.x, 0.14, 0.86); }
      it.rot += dt * 0.6;
      it.cy = it.y;
      if (it.type === 'luciole') it.cy += Math.sin(time * 2 + it.seed * 10) * 12;
      if (it.type === 'araignee') it.cy += Math.sin(time * 1.3 + it.seed * 6) * 34;
      if (it.cool > 0) { it.cool -= dt; continue; }
      if (Math.abs(it.cy - probe.y) > 60) continue;
      if (Math.hypot(it.x * W - px, it.cy - probe.y) > t.r + 11) continue;

      if (state === 'descent') {
        if (probe.shield > 0) {
          probe.shield--; it.cool = 1.2;
          showHint("Le charme d'écorce te protège", 1);
        } else {
          beginAscent(t.hazard ? `${t.name} t'a surprise.` : `Tu as effleuré : ${t.name.toLowerCase()}.`);
        }
        break;
      }
      if (t.hazard) {
        it.caught = true;
        const lost = probe.caught.pop();
        if (lost) { probe.lost.push(lost); showHint(`${t.name} ! Tu perds : ${TYPES[lost.type].name.toLowerCase()}`, 1.3); }
      } else if (probe.caught.length < probe.hold) {
        it.caught = true;
        probe.caught.push(it);
        if (probe.caught.length === probe.hold) showHint('Panier plein !', 1.2);
      }
    }

    const target = probe.y - H * (state === 'descent' ? 0.32 : 0.68);
    camY += (target - camY) * Math.min(1, dt * 4);

    ui.depth.textContent = Math.round(probe.y / PX);
    ui.max.textContent = Math.round(probe.max / PX);
    ui.hold.textContent = `${probe.caught.length}/${probe.hold}`;
    ui.shield.textContent = probe.shield;
  }

  function updateMotes(dt) {
    const b = biomeIndex(Math.max(0, camY + H / 2) / PX);
    for (const m of motes) {
      m.vy = b === 4 ? -30 - m.s * 30 : b === 2 ? -12 - m.s * 10 : 6 + m.s * 10;
      m.y += m.vy * dt;
      m.x += Math.sin(time * 0.8 + m.s * 20) * 0.01 * dt;
      if (m.y < camY - 20) { m.y = camY + H + 10; m.x = Math.random(); }
      if (m.y > camY + H + 20) { m.y = camY - 10; m.x = Math.random(); }
    }
  }

  function finishDive() {
    const counts = {};
    let total = 0;
    for (const it of probe.caught) {
      counts[it.type] = (counts[it.type] || 0) + 1;
      total += TYPES[it.type].value;
      save.seen[it.type] = (save.seen[it.type] || 0) + 1;
    }
    const deepest = Math.round(probe.deepest / PX);
    const record = deepest > save.best;
    save.best = Math.max(save.best, deepest);
    save.sous += total;

    // Chapitres débloqués par les nouvelles zones, et fin de l'histoire
    const pending = [];
    const reached = biomeIndex(deepest);
    for (let b = save.maxBiome + 1; b <= reached; b++) {
      pending.push(Object.assign({ kicker: `Chapitre ${b + 1}` }, STORY.chapters[b]));
    }
    save.maxBiome = Math.max(save.maxBiome, reached);
    const gotHeart = !!counts.coeur;
    if (gotHeart && !save.heart) pending.push(STORY.ending);
    if (gotHeart) save.heart = true;
    persist();
    pendingStory = pending;

    ui.resultTitle.textContent = gotHeart ? 'Tu rapportes le Cœur-Graine !' : 'De retour au village';
    ui.resultSub.textContent = `${probe.reason} Profondeur atteinte : ${deepest} m${record ? ', ton record' : ''}.`;
    ui.haul.innerHTML = '';
    const rows = CATCH.filter((k) => counts[k]).sort((a, b) => TYPES[b].value - TYPES[a].value);
    if (!rows.length) ui.haul.innerHTML = '<li>Panier vide. Frôle tout ce qui brille en remontant !</li>';
    for (const k of rows) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${counts[k]} × ${TYPES[k].name}</span><span>${counts[k] * TYPES[k].value} sous</span>`;
      ui.haul.appendChild(li);
    }
    if (probe.lost.length) {
      const li = document.createElement('li');
      li.className = 'lost';
      li.innerHTML = `<span>Perdu en chemin</span><span>${probe.lost.length} trouvaille${probe.lost.length > 1 ? 's' : ''}</span>`;
      ui.haul.appendChild(li);
    }
    ui.haulTotal.textContent = total;
    setState('result');
    $('btn-back').focus();
  }
  let pendingStory = [];

  // ---------- Village (menu) ----------
  function renderMenu() {
    ui.oda.textContent = save.heart ? ODA_END : ODA[save.maxBiome];
    ui.purse.textContent = save.sous;
    ui.shop.innerHTML = '';
    UPGRADES.forEach((u, idx) => {
      const lvl = save.lvl[u.id];
      const maxed = lvl >= u.values.length - 1;
      const cost = maxed ? 0 : u.costs[lvl + 1];
      const card = document.createElement('div');
      card.className = 'upgrade';
      card.innerHTML = `
        <h3>${u.name}</h3>
        <p>${u.desc} : ${u.fmt(u.values[lvl])}${maxed ? '' : ` → ${u.fmt(u.values[lvl + 1])}`}</p>
        <div class="lvl">${u.values.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</div>
        <button type="button" id="buy-${u.id}" ${maxed || save.sous < cost ? 'disabled' : ''}>${maxed ? 'Au maximum' : `${cost} sous`}</button>`;
      card.querySelector('button').addEventListener('click', () => {
        if (maxed || save.sous < cost) return;
        save.sous -= cost;
        save.lvl[u.id]++;
        persist();
        renderMenu();
        const b = $(`buy-${u.id}`);
        (b.disabled ? $('btn-dive') : b).focus();
      });
      ui.shop.appendChild(card);
    });

    ui.journal.innerHTML = '';
    const pages = [...STORY.intro.slice(0, 1), ...STORY.chapters.slice(1, save.maxBiome + 1)];
    if (save.heart) pages.push(STORY.ending);
    for (const p of pages) {
      const d = document.createElement('div');
      d.className = 'chapter';
      d.innerHTML = `<h3></h3><p></p>`;
      d.querySelector('h3').textContent = p.title;
      d.querySelector('p').textContent = p.text;
      ui.journal.appendChild(d);
    }

    ui.codex.innerHTML = '';
    let found = 0;
    for (const k of CATCH) {
      const n = save.seen[k] || 0;
      if (n) found++;
      const li = document.createElement('li');
      if (n) li.innerHTML = `<span>${TYPES[k].name} <small>× ${n}</small></span><span>${TYPES[k].value} sous</span>`;
      else { li.className = 'unknown'; li.innerHTML = `<span>??? <small>(vers ${TYPES[k].minD} m)</small></span><span>?</span>`; }
      ui.codex.appendChild(li);
    }
    ui.codexCount.textContent = `(${found}/${CATCH.length})`;
    ui.records.textContent = save.dives ? `Descentes : ${save.dives} · Record : ${save.best} m` : '';
  }

  // ---------- Dessin : surface ----------
  function drawTree(x, y, h, leafP, bloom) {
    let n = 0;
    const tips = [];
    ctx.strokeStyle = '#1a110d';
    ctx.lineCap = 'round';
    (function br(x0, y0, len, ang, d) {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      ctx.lineWidth = Math.max(1, d * d * 0.45 + 1);
      ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + Math.cos(ang + 0.3) * len * 0.5, y0 + Math.sin(ang + 0.3) * len * 0.5, x1, y1);
      ctx.stroke();
      if (d === 0) { tips.push([x1, y1]); return; }
      br(x1, y1, len * (0.7 + 0.12 * rnd(n++)), ang - 0.38 - 0.25 * rnd(n++), d - 1);
      br(x1, y1, len * (0.68 + 0.12 * rnd(n++)), ang + 0.34 + 0.25 * rnd(n++), d - 1);
    })(x, y, h * 0.32, -Math.PI / 2 - 0.05, 6);
    // Racines visibles au pied de l'arbre
    ctx.lineWidth = 5;
    for (const a of [-0.5, 0.4, 2.8, 3.5]) {
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.quadraticCurveTo(x + Math.cos(a) * 16, y + 2, x + Math.cos(a) * 30, y + 4); ctx.stroke();
    }
    const count = Math.round(tips.length * leafP);
    for (let i = 0; i < count; i++) {
      const [lx, ly] = tips[(i * 37) % tips.length];
      const sway = reduced ? 0 : Math.sin(time * 1.5 + i) * 1.5;
      ctx.fillStyle = `hsla(${95 + rnd(i) * 40},${45 + rnd(i + 5) * 20}%,${32 + rnd(i + 9) * 18}%,0.92)`;
      circle(lx + sway, ly, 5 + rnd(i + 3) * 5);
      circle(lx + sway + 5, ly + 3, 3 + rnd(i + 4) * 4);
      circle(lx + sway - 4, ly + 4, 3 + rnd(i + 6) * 3);
    }
    if (bloom) {
      for (let i = 0; i < tips.length; i += 3) {
        const [lx, ly] = tips[i];
        ctx.fillStyle = '#ffd98a'; circle(lx + 4, ly - 3, 2.2);
      }
    }
  }

  function drawSurface(gy) {
    if (gy <= 0) return;
    const dawn = save.heart;
    const sky = ctx.createLinearGradient(0, gy - H, 0, gy);
    sky.addColorStop(0, dawn ? '#355a8c' : '#101230');
    sky.addColorStop(0.6, dawn ? '#9a88b8' : '#35264d');
    sky.addColorStop(1, dawn ? '#f6c98a' : '#a55a6c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy);

    if (!dawn) {
      for (const s of skyStars) {
        const sy = s.y * gy * 0.7;
        ctx.fillStyle = `rgba(255,245,220,${reduced ? 0.6 : 0.35 + 0.35 * Math.sin(time * 1.5 + s.t)})`;
        ctx.fillRect(s.x * W, sy, 1.6, 1.6);
      }
      glow(W * 0.2, gy - H * 0.3, 40, 'rgba(255,240,210,0.25)');
      ctx.fillStyle = '#f4ead2'; circle(W * 0.2, gy - H * 0.3, 13);
      ctx.fillStyle = '#35264d'; circle(W * 0.2 + 6, gy - H * 0.3 - 3, 11);
    } else {
      glow(W * 0.25, gy - 20, 120, 'rgba(255,220,150,0.5)');
    }

    // Collines lointaines
    ctx.fillStyle = dawn ? '#6b6488' : '#24193a';
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, gy - 40 - 18 * Math.sin(x * 0.012 + 1) - 10 * Math.sin(x * 0.031));
    ctx.lineTo(W, gy); ctx.fill();

    // Maisons du village
    const houses = [[0.04, 30, 26], [0.15, 36, 34], [0.27, 26, 22]];
    for (const [hx, hw, hh] of houses) {
      const x = hx * W;
      ctx.fillStyle = dawn ? '#3b2c3a' : '#1a1222';
      ctx.fillRect(x, gy - hh, hw, hh);
      ctx.beginPath(); ctx.moveTo(x - 4, gy - hh); ctx.lineTo(x + hw / 2, gy - hh - 18); ctx.lineTo(x + hw + 4, gy - hh); ctx.fill();
      glow(x + hw / 2, gy - hh / 2, 16, 'rgba(242,166,59,0.35)');
      ctx.fillStyle = '#f2c46b'; ctx.fillRect(x + hw / 2 - 4, gy - hh / 2 - 4, 8, 8);
    }

    // Le Grand Chêne : il reverdit à mesure que l'histoire avance
    const leafP = save.heart ? 1 : (save.maxBiome / 5) * 0.8;
    drawTree(W * 0.76, gy, Math.min(230, H * 0.33), leafP, save.heart);

    // Herbe
    ctx.fillStyle = dawn ? '#4f6a34' : '#233021';
    ctx.fillRect(0, gy - 4, W, 8);
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 3; x < W; x += 7) { ctx.moveTo(x, gy - 3); ctx.lineTo(x + 2, gy - 8 - rnd(x) * 5); }
    ctx.stroke();

    // Le puits
    const ow = W * 0.2, cx = W / 2;
    ctx.fillStyle = '#5a4c47';
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 7; i++) {
        const bw = (ow + 34) / 7;
        const bx = cx - (ow + 34) / 2 + i * bw + (row ? bw / 2 : 0);
        if (row && i === 6) continue;
        ctx.fillStyle = rnd(i + row * 9) < 0.5 ? '#5d5049' : '#4a3f3b';
        ctx.fillRect(bx + 1, gy - 22 + row * 10, bw - 2, 9);
      }
    }
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(cx - ow / 2 - 12, gy - 82, 6, 62);
    ctx.fillRect(cx + ow / 2 + 6, gy - 82, 6, 62);
    ctx.fillStyle = '#3b271a';
    ctx.beginPath(); ctx.moveTo(cx - ow / 2 - 24, gy - 80); ctx.lineTo(cx, gy - 106); ctx.lineTo(cx + ow / 2 + 24, gy - 80); ctx.fill();
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(cx - ow / 2 - 6, gy - 64, ow + 12, 6);
    // Manivelle
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3;
    const a = state === 'descent' || state === 'ascent' ? time * 6 : 0;
    ctx.beginPath(); ctx.moveTo(cx + ow / 2 + 12, gy - 61); ctx.lineTo(cx + ow / 2 + 12 + Math.cos(a) * 10, gy - 61 + Math.sin(a) * 10); ctx.stroke();

    // Ilia, et sa grand-mère Oda
    const ix = cx - ow / 2 - 34;
    drawPerson(ix, gy - 3, '#2f5d50', '#c8452f', '#3a2418', 1);
    drawPerson(ix - 30, gy - 3, '#4a3b52', '#bda98a', '#d9d2c5', 0.92);
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(ix - 20, gy - 30, 2, 28); // canne d'Oda
  }

  function drawPerson(x, y, cloak, scarf, hair, s) {
    ctx.fillStyle = cloak;
    ctx.beginPath(); ctx.moveTo(x - 9 * s, y); ctx.quadraticCurveTo(x, y - 30 * s, x + 9 * s, y); ctx.fill();
    ctx.fillRect(x - 5 * s, y - 24 * s, 10 * s, 12 * s);
    ctx.fillStyle = scarf; ctx.fillRect(x - 6 * s, y - 25 * s, 12 * s, 4 * s);
    ctx.fillStyle = '#e8c39e'; circle(x, y - 30 * s, 5.5 * s);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x, y - 31 * s, 6 * s, Math.PI, 0); ctx.fill();
  }

  // ---------- Dessin : grotte ----------
  function drawWalls(far) {
    const y0 = Math.max(0, camY - 10), y1 = camY + H + 10;
    if (y1 <= 0) return;
    const mid = Math.max(0, camY + H / 2) / PX;
    for (const side of [0, 1]) {
      const edgeX = side ? W : 0;
      const pts = [];
      for (let y = y0; y <= y1 + 10; y += 10) {
        let d = inset(far ? y * 0.7 + 400 : y, side) * (far ? 1.9 : 1);
        if (far && y < 260) d = Math.max(d, inset(y, side));
        pts.push([side ? W - d : d, y - camY]);
      }
      ctx.beginPath(); ctx.moveTo(edgeX, y0 - camY);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(edgeX, y1 + 10 - camY); ctx.closePath();
      if (far) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); continue; }
      const g = ctx.createLinearGradient(edgeX, 0, side ? W - W * 0.14 : W * 0.14, 0);
      g.addColorStop(0, '#0a0707'); g.addColorStop(1, biomeColor(mid, 'rock'));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = biomeColor(mid, 'edge'); ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawDecos(lights) {
    for (const d of decos) {
      const sy = d.y - camY;
      if (sy < -40 || sy > H + 40) continue;
      const wx = d.side ? W - inset(d.y, 1) : inset(d.y, 0);
      const dir = d.side ? -1 : 1;
      if (d.b === 0) { // racines
        ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 3 + d.s * 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(wx - dir * 4, sy);
        ctx.bezierCurveTo(wx + dir * 20, sy + 10, wx + dir * 16, sy + 26, wx + dir * (26 + d.s * 20), sy + 34);
        ctx.stroke();
      } else if (d.b === 1) { // champignons muraux
        for (let k = 0; k < 3; k++) {
          const mx = wx + dir * (3 + k * 5), my = sy + k * 7;
          ctx.fillStyle = '#cfe3da'; ctx.fillRect(mx - 1, my, 2, 6);
          ctx.fillStyle = '#5fd3c0'; ctx.beginPath(); ctx.ellipse(mx, my, 5 - k, 3.5, 0, Math.PI, 0); ctx.fill();
        }
        lights.push({ x: wx + dir * 8, y: sy + 6, r: 38, a: 0.5 });
      } else if (d.b === 2) { // stalactites humides
        ctx.fillStyle = '#243659';
        ctx.beginPath(); ctx.moveTo(wx - dir * 2, sy - 8); ctx.lineTo(wx + dir * (16 + d.s * 14), sy); ctx.lineTo(wx - dir * 2, sy + 6); ctx.fill();
        if (!reduced) { ctx.fillStyle = 'rgba(170,200,255,0.7)'; circle(wx + dir * (16 + d.s * 14), sy + 4 + ((time * 40 + d.s * 100) % 50), 1.5); }
      } else if (d.b === 3) { // éclats de cristal
        ctx.fillStyle = '#8e6fd0';
        for (let k = 0; k < 2; k++) {
          ctx.beginPath(); ctx.moveTo(wx - dir * 2, sy - 6 + k * 9); ctx.lineTo(wx + dir * (14 + k * 8 + d.s * 8), sy - 2 + k * 11); ctx.lineTo(wx - dir * 2, sy + 2 + k * 9); ctx.fill();
        }
        lights.push({ x: wx + dir * 10, y: sy + 2, r: 34, a: 0.45 });
      } else { // veines de braise
        const f = reduced ? 0.8 : 0.6 + 0.4 * Math.sin(time * 3 + d.s * 9);
        ctx.strokeStyle = `rgba(255,${110 + f * 60},50,${f})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx - dir * 2, sy);
        ctx.lineTo(wx - dir * 10, sy + 8); ctx.lineTo(wx - dir * 6, sy + 16); ctx.lineTo(wx - dir * 14, sy + 26);
        ctx.stroke();
        lights.push({ x: wx - dir * 6, y: sy + 12, r: 40, a: 0.5 * f });
      }
    }
  }

  function drawItem(it, x, y, lights) {
    const t = TYPES[it.type];
    const f = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 5 + it.seed * 20);
    if (t.light && lights) lights.push({ x, y, r: t.light * f, a: it.type === 'coeur' ? 1 : 0.75 });
    switch (it.type) {
      case 'luciole': {
        const blink = reduced ? 1 : 0.5 + 0.5 * Math.sin(time * 8 + it.seed * 30);
        glow(x, y, 18, `rgba(216,255,122,${0.25 + 0.4 * blink})`);
        ctx.fillStyle = 'rgba(235,245,255,0.55)';
        const flap = reduced ? 0 : Math.sin(time * 30 + it.seed) * 0.4;
        ctx.beginPath(); ctx.ellipse(x - 4, y - 3, 4.5, 2.2, -0.5 + flap, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 4, y - 3, 4.5, 2.2, 0.5 - flap, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2d1a'; ctx.beginPath(); ctx.ellipse(x, y - 1, 2.2, 3.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#efffb0'; circle(x, y + 3, 2.8);
        break;
      }
      case 'graine': {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time + it.seed * 6) * 0.3);
        const g = ctx.createLinearGradient(-8, -10, 8, 10);
        g.addColorStop(0, '#c08a4e'); g.addColorStop(1, '#5b3a1e');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.bezierCurveTo(10, -3, 8, 10, 0, 10); ctx.bezierCurveTo(-8, 10, -10, -3, 0, -11); ctx.fill();
        ctx.strokeStyle = 'rgba(40,20,8,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(3, 0, 0, 9); ctx.stroke();
        ctx.strokeStyle = '#8fd46b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(2, -17, 7, -17); ctx.stroke();
        ctx.fillStyle = '#8fd46b'; ctx.beginPath(); ctx.ellipse(8, -16, 4, 2, -0.4, 0, TAU); ctx.fill();
        ctx.restore();
        break;
      }
      case 'champi': {
        glow(x, y - 4, 28 * f, 'rgba(110,220,200,0.4)');
        ctx.fillStyle = '#d9e8df'; ctx.fillRect(x - 3, y - 2, 6, 13);
        const cap = ctx.createLinearGradient(0, y - 14, 0, y);
        cap.addColorStop(0, '#9ff5e3'); cap.addColorStop(1, '#2f9d8e');
        ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, y - 1, 14, 12, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(230,255,250,0.85)'; circle(x - 5, y - 7, 2); circle(x + 4, y - 9, 1.6); circle(x + 7, y - 4, 1.3);
        break;
      }
      case 'perle': {
        ctx.fillStyle = '#6f7ea3';
        ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.quadraticCurveTo(x, y + 18, x + 14, y + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8c9bc0';
        ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.quadraticCurveTo(x - 4, y - 20, x + 12, y - 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(40,50,80,0.5)'; ctx.lineWidth = 1;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + k * 6, y + 12 - Math.abs(k) * 2); ctx.stroke(); }
        const pg = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
        pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#a9c4f5');
        ctx.fillStyle = pg; circle(x, y + 1, 6.5);
        break;
      }
      case 'cristal': {
        glow(x, y, 30 * f, 'rgba(180,140,255,0.4)');
        for (const [dx, h, ang] of [[-6, 18, -0.35], [6, 16, 0.4], [0, 25, 0]]) {
          ctx.save(); ctx.translate(x + dx, y + 9); ctx.rotate(ang);
          const g = ctx.createLinearGradient(-4, 0, 4, 0);
          g.addColorStop(0, '#6b4bb8'); g.addColorStop(0.5, '#d9c7ff'); g.addColorStop(1, '#8e6fd0');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-4, -h + 5); ctx.lineTo(0, -h); ctx.lineTo(4, -h + 5); ctx.lineTo(4, 0); ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'braise': {
        glow(x, y, 30 * f, 'rgba(255,120,40,0.45)');
        ctx.fillStyle = '#2a1410';
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = it.rot + (k / 8) * TAU, r = 12 * (0.8 + 0.3 * rnd(it.seed * 100 + k));
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.fill();
        ctx.strokeStyle = `rgba(255,${120 + 80 * f},60,1)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x - 1, y + 1); ctx.lineTo(x + 3, y - 5); ctx.moveTo(x - 1, y + 1); ctx.lineTo(x + 2, y + 7); ctx.stroke();
        break;
      }
      case 'coeur': {
        const p = reduced ? 1 : 1 + 0.07 * Math.sin(time * 2.5);
        glow(x, y, 80 * p, 'rgba(255,200,90,0.5)');
        ctx.strokeStyle = 'rgba(255,220,140,0.35)'; ctx.lineWidth = 2;
        for (let k = 0; k < 10; k++) {
          const a = time * 0.3 + (k / 10) * TAU;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34); ctx.lineTo(x + Math.cos(a) * 52 * p, y + Math.sin(a) * 52 * p); ctx.stroke();
        }
        const g = ctx.createLinearGradient(x - 20, y - 26, x + 20, y + 26);
        g.addColorStop(0, '#fff0b8'); g.addColorStop(0.5, '#f2b441'); g.addColorStop(1, '#a8651c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x, y - 28 * p); ctx.bezierCurveTo(x + 24 * p, y - 10, x + 20 * p, y + 24 * p, x, y + 24 * p);
        ctx.bezierCurveTo(x - 20 * p, y + 24 * p, x - 24 * p, y - 10, x, y - 28 * p); ctx.fill();
        ctx.strokeStyle = 'rgba(120,60,10,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.quadraticCurveTo(x + 6, y, x, y + 20); ctx.moveTo(x, y - 6); ctx.lineTo(x - 9, y + 6); ctx.moveTo(x + 3, y + 4); ctx.lineTo(x + 11, y + 12); ctx.stroke();
        break;
      }
      case 'araignee': {
        ctx.strokeStyle = 'rgba(220,220,230,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y - 260); ctx.lineTo(x, y - 6); ctx.stroke();
        ctx.strokeStyle = '#1b1414'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 4; k++) {
          const wig = reduced ? 0 : Math.sin(time * 6 + k) * 2;
          for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + s * 10, y - 8 + k * 4, x + s * (15 + wig), y - 2 + k * 5); ctx.stroke();
          }
        }
        ctx.fillStyle = '#2a1e1e'; circle(x, y + 5, 8); ctx.fillStyle = '#1b1414'; circle(x, y - 3, 5.5);
        break;
      }
      case 'chauve': {
        const flap = reduced ? 0.5 : Math.sin(time * 16 + it.seed * 10);
        const dir = it.vx >= 0 ? 1 : -1;
        ctx.fillStyle = '#16101a';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(x, y - 2);
          ctx.quadraticCurveTo(x + s * 12, y - 12 * flap - 4, x + s * 22, y - 8 * flap);
          ctx.quadraticCurveTo(x + s * 16, y + 2, x + s * 12, y + 1);
          ctx.quadraticCurveTo(x + s * 8, y + 6, x, y + 3); ctx.fill();
        }
        ctx.beginPath(); ctx.ellipse(x, y, 5, 7, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + dir * 2 - 3, y - 5); ctx.lineTo(x + dir * 2 - 4, y - 11); ctx.lineTo(x + dir * 2, y - 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + dir * 2 + 3, y - 5); ctx.lineTo(x + dir * 2 + 4, y - 11); ctx.lineTo(x + dir * 2, y - 6); ctx.fill();
        break;
      }
    }
  }

  // Yeux rouges, dessinés par-dessus l'obscurité : on devine les créatures dans le noir
  function drawEyes(it, x, y) {
    const dir = it.vx >= 0 ? 1 : -1;
    ctx.fillStyle = '#ff4a3d';
    if (it.type === 'chauve') { circle(x + dir * 2 - 2, y - 2, 1.4); circle(x + dir * 2 + 2, y - 2, 1.4); }
    else { circle(x - 2, y - 4, 1.2); circle(x + 2, y - 4, 1.2); }
  }

  function drawLantern(x, y, tilt, lights) {
    const flick = reduced ? 1 : 0.9 + 0.1 * Math.sin(time * 13) * Math.sin(time * 7.3);
    lights.push({ x, y, r: stat('lanterne') * flick, a: 1 });
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    glow(0, -3, 26, 'rgba(255,190,90,0.55)');
    ctx.strokeStyle = '#b8894a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -17, 4.5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(9, -11); ctx.lineTo(5, -16); ctx.lineTo(-5, -16); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,140,0.4)'; ctx.fillRect(-7, -11, 14, 16);
    ctx.fillStyle = '#fff1c2';
    ctx.beginPath(); ctx.ellipse(0, -1, 2.8 * flick, 5.5 * flick, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2a63b';
    ctx.beginPath(); ctx.ellipse(0, 1, 2, 3, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-7, -11); ctx.lineTo(-7, 5); ctx.moveTo(7, -11); ctx.lineTo(7, 5); ctx.stroke();
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-9, 5, 18, 4);
    ctx.restore();
    if (probe.shield > 0 && state === 'descent') {
      ctx.strokeStyle = 'rgba(143,212,107,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(x, y - 3, 22, time, time + TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawDarkness(alpha, lights) {
    if (alpha <= 0.01) return;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = `rgba(5,3,6,${alpha})`;
    dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (l.y < -l.r || l.y > H + l.r) continue;
      const g = dctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${l.a})`);
      g.addColorStop(0.5, `rgba(0,0,0,${l.a * 0.7})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath(); dctx.arc(l.x, l.y, l.r, 0, TAU); dctx.fill();
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
  }

  function draw() {
    const lights = [];
    const mid = Math.max(0, camY + H / 2) / PX;
    ctx.fillStyle = biomeColor(mid, 'bg');
    ctx.fillRect(0, 0, W, H);

    drawWalls(true);
    drawSurface(-camY);
    drawWalls(false);
    drawDecos(lights);

    const playing = state === 'descent' || state === 'ascent';
    const visible = [];
    for (const it of items) {
      if (it.caught || !playing) continue;
      const y = it.cy - camY;
      if (y < -60 || y > H + 60) continue;
      drawItem(it, it.x * W, y, lights);
      if (TYPES[it.type].hazard) visible.push([it, it.x * W, y]);
    }

    // Poussières, spores, bulles ou braises selon la zone
    const mc = BIOMES[biomeIndex(mid)].mote;
    for (const m of motes) {
      if (m.y < 60) continue;
      const a = reduced ? 0.4 : 0.25 + 0.3 * Math.sin(time * 2 + m.s * 30);
      ctx.fillStyle = `rgba(${mc},${a})`;
      circle(m.x * W, m.y - camY, 1 + m.s * 1.6);
    }

    // Corde, lanterne et trouvailles accrochées
    const px = probe.x * W, py = probe.y - camY;
    ctx.strokeStyle = '#c9a36b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2, -camY - 61); ctx.quadraticCurveTo(W / 2, (py - camY - 61) / 2, px, py - 20); ctx.stroke();
    probe.caught.forEach((it, i) => {
      const a = i * 2.4, d = 10 + Math.sqrt(i) * 9;
      ctx.save();
      const ix = px + Math.cos(a) * d * 0.9, iy = py + 26 + Math.abs(Math.sin(a)) * d;
      ctx.translate(ix, iy); ctx.scale(0.75, 0.75); ctx.translate(-ix, -iy);
      drawItem(it, ix, iy, null);
      ctx.restore();
    });
    drawLantern(px, py, probe.tilt, lights);

    const depthM = probe.y / PX;
    drawDarkness(clamp((depthM - 4) / 40, 0, 1) * 0.86, lights);
    for (const [it, x, y] of visible) drawEyes(it, x, y);

    // Halo chaud de la lanterne et vignette
    ctx.globalCompositeOperation = 'lighter';
    glow(px, py - 3, stat('lanterne') * 0.6, 'rgba(242,140,40,0.12)');
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---------- Contrôles ----------
  function pointer(e) {
    if (state !== 'descent' && state !== 'ascent') return;
    const rect = canvas.getBoundingClientRect();
    probe.target = (e.clientX - rect.left) / rect.width;
  }
  canvas.addEventListener('pointerdown', pointer);
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) pointer(e); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') keyDir = -1;
    else if (e.key === 'ArrowRight' || e.key === 'd') keyDir = 1;
  });
  window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'q', 'd'].includes(e.key)) keyDir = 0;
  });

  $('btn-dive').addEventListener('click', startDive);
  $('story-next').addEventListener('click', nextStory);
  $('btn-back').addEventListener('click', () => {
    resetProbe();
    const back = () => { setState('menu'); $('btn-dive').focus(); };
    if (pendingStory.length) { const p = pendingStory; pendingStory = []; playStory(p, back); } else back();
  });

  // Confirmation en deux clics, dans la page (pas de boîte de dialogue du navigateur)
  const resetBtn = $('btn-reset');
  let resetArmed = false;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = 'Toucher encore pour tout effacer';
      setTimeout(() => { resetArmed = false; resetBtn.textContent = "Recommencer l'histoire"; }, 3000);
      return;
    }
    resetArmed = false;
    resetBtn.textContent = "Recommencer l'histoire";
    save = fresh(); persist();
    playStory(STORY.intro, () => { save.intro = true; persist(); setState('menu'); });
  });

  resize();
  resetProbe();
  buildDecos(60);
  camY = -H * 0.4;
  if (save.intro) setState('menu');
  else playStory(STORY.intro, () => { save.intro = true; persist(); setState('menu'); $('btn-dive').focus(); });
  requestAnimationFrame(frame);
})();
