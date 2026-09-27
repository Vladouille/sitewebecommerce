/* La Lanterne d'Ilia
 * Jeu d'énigmes de lumière : fais pivoter les cristaux pour guider le rayon jusqu'aux graines.
 * 14 énigmes faites à la main, en 5 chapitres. Chaque énigme a été vérifiée par un solveur :
 * elle a une solution, et `par` est le nombre minimal de gestes pour la trouver.
 *
 * Légende des niveaux :
 *   #  roche            .  sol
 *   /  \  cristal orientable            1  2  cristal enraciné (fixe, / ou \)
 *   x  X  cristal double orientable (laisse passer ET renvoie la lumière)
 *   R L U D  lanterne ambrée (vers droite, gauche, haut, bas)      r l u d  lanterne-lune (bleue)
 *   a  graine ambrée    b  graine de lune    h  Cœur-Graine (les deux lumières)
 *   o  cloche de cristal (ouvre les portes)   g  porte de racines */
(() => {
  'use strict';

  const LEVELS = [
    { par: 1, rows: ["#######", "#R.../#", "#.....#", "#.....#", "#....a#", "#######"] },
    { par: 2, rows: ["#######", "#D...a#", "#.....#", "#.....#", "#/...\\#", "#######"] },
    { par: 3, rows: ["#######", "#..#..#", "##....#", "#..##.#", "#....##", "#..\\./#", "#.....#", "#.a..\\#", "###U###"] },
    { par: 3, rows: ["#######", "R./a/.#", "#....##", "#.x.1.#", "#.....#", "##a#..#", "##....#", "#.....#", "#######"] },
    { par: 3, rows: ["#######", "#.#.#.#", "#.\\.xa#", "##./..#", "#.....#", "R.1...#", "#.#./a#", "#.....#", "#######"] },
    { par: 5, rows: ["##D####", "#/.a###", "#./../#", "##./.X#", "#.a.\\a#", "#.....#", "#.\\.1.#", "#.....#", "##U####"] },
    { par: 3, rows: ["####D##", "###...#", "#./.\\.#", "#.....#", "#./a..#", "#..1.b#", "##..#.#", "r..\\..#", "#######"] },
    { par: 3, rows: ["#######", "#/#...#", "#.#...#", "#a.\\..#", "#.1...l", "#...#a#", "#\\.X.\\#", "#.b...#", "#U#####"] },
    { par: 4, rows: ["#######", "#.\\b\\.l", "#a.\\..#", "#./.X.#", "##....#", "##..2b#", "#/..#.#", "#.....#", "###U###"] },
    { par: 4, rows: ["#######", "#..\\###", "#..#..#", "#o./..#", "#....##", "#....a#", "#\\.Xg\\#", "#.....#", "#U#####"] },
    { par: 4, rows: ["##D####", "R...2o#", "#./..\\#", "#\\.gX##", "#..#..#", "#a..a.#", "#.#...#", "#....\\#", "#######"] },
    { par: 4, rows: ["###d###", "#.a...#", "#o....#", "#/.\\..#", "#.2.X.L", "#.#\\..#", "#.#..##", "#.ag\\.#", "#######"] },
    { par: 4, rows: ["#######", "#.1x.h#", "#.....#", "#a.\\..#", "R.\\...#", "##/...#", "##\\../#", "#...#.#", "##u####"] },
    { par: 5, rows: ["#####D#", "#..#..#", "r./...#", "#\\.g.x#", "#a....#", "#/.\\o.#", "#./.h\\#", "#.#2..l", "#######"] },
  ];

  const CHAPTERS = [
    { name: 'Le Terreau', start: 0, rock: '#3d2718', floor: '#23170f', bg: '#120b08', mote: '200,160,110', deco: 'root',
      story: null },
    { name: 'La Grotte des lunes', start: 3, rock: '#1c3336', floor: '#0e1c1e', bg: '#081113', mote: '140,230,210', deco: 'mushroom',
      story: "Sous la terre, des champignons brillent comme des lunes pâles. Ici, les cristaux poussent autrement : certains sont enracinés et ne bougent plus, d'autres sont doubles. Ils laissent passer la lumière et la renvoient en même temps." },
    { name: 'Le Lac muet', start: 6, rock: '#1a2744', floor: '#0b1428', bg: '#060b18', mote: '170,200,255', deco: 'drip',
      story: "Un lac immobile, noir comme l'encre. Sur la rive, Ilia trouve une lanterne-lune, à la lumière bleue. Certaines graines du lac ne se réveillent qu'avec elle." },
    { name: 'La Galerie chantante', start: 9, rock: '#2c1d47', floor: '#150e24', bg: '#0b0714', mote: '215,190,255', deco: 'shard',
      story: "Les cristaux chantent quand la lumière les touche. Au milieu de la galerie pend une cloche de cristal. Oda l'avait dit : « Fais-la chanter, et les racines s'écarteront. »" },
    { name: 'Les Veines de braise', start: 12, rock: '#3d150c', floor: '#1c0a07', bg: '#0f0504', mote: '255,150,80', deco: 'ember',
      story: "Il fait chaud. Les racines du Chêne battent comme un cœur. Au fond, le Cœur-Graine attend deux lumières à la fois : celle du soleil et celle de la lune." },
  ];

  const NAMES = ['Premier reflet', 'Le coude', 'Racines tordues', 'Le cristal double', 'Deux lunes pâles', 'Deux lanternes',
    'Lumière de lune', 'Le reflet du lac', 'Eaux croisées', 'La cloche', 'La porte de racines', 'Le chant bleu',
    'Le Cœur-Graine', 'Le réveil'];

  const TIPS = {
    0: 'Touche le cristal cerclé pour le faire pivoter. Guide la lumière jusqu\'à la graine.',
    1: 'Un rayon peut tourner plusieurs fois avant d\'arriver.',
    2: 'Les rochers arrêtent la lumière. Cherche le bon chemin.',
    3: 'Le cristal double laisse passer la lumière et la renvoie aussi. Les cristaux sans cercle sont enracinés.',
    6: 'La lanterne-lune donne une lumière bleue. Anneau plein : graine du soleil. Anneau pointillé : graine de lune.',
    9: 'Éclaire la cloche : elle chante, et la porte de racines s\'ouvre.',
    12: 'Le Cœur-Graine a besoin des deux lumières en même temps.',
  };
  const DEFAULT_TIP = 'Touche un cristal cerclé pour le faire pivoter.';

  const STORY = {
    intro: [
      { kicker: 'Prologue', title: 'Le Grand Chêne',
        text: "À Brume-sous-Chêne, tout le monde vit à l'ombre du Grand Chêne. Cet hiver, ses feuilles sont tombées en une nuit. Au printemps, aucune n'a repoussé." },
      { kicker: 'Prologue', title: 'Ce que dit Oda',
        text: "Grand-mère Oda connaît les vieilles histoires. « Sous ses racines, les graines du Chêne se sont endormies dans le noir. Réveille-les avec la lumière, et il se réveillera aussi. »" },
      { kicker: 'Prologue', title: 'La lanterne',
        text: "Ilia prend la lanterne de sa mère et descend dans le vieux puits. Dans les grottes, des cristaux renvoient la lumière. Fais-les pivoter pour guider le rayon jusqu'aux graines." },
    ],
    ending: { kicker: 'Épilogue', title: 'Le printemps revient',
      text: "Le Cœur-Graine s'éveille, et toutes les racines s'illuminent d'un coup. Au matin, le village se réveille sous une pluie de feuilles neuves. Oda pleure un peu, et rit beaucoup. Ilia garde la lanterne près de son lit, au cas où." },
  };
  const ODA = [
    '« Doucement, ma grande. La lumière va tout droit, sauf si un cristal la détourne. »',
    '« Ta mère disait que les champignons-lunes éclairent le chemin de ceux qui cherchent. »',
    '« La lanterne-lune ? Je la croyais perdue depuis trente ans. »',
    '« Tu entends ce chant ? C\'est le Chêne qui t\'appelle. »',
    '« Le Cœur-Graine est tout près. Tiens bon, Ilia. »',
  ];
  const ODA_END = '« Le Chêne respire à nouveau. Tu peux rejouer les énigmes pour les réussir en un minimum de gestes. »';

  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Moteur de lumière ----------
  const DIRS = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  function parseLevel(rows) {
    const cells = [], movable = [];
    rows.forEach((row, y) => {
      cells.push([...row].map((ch, x) => {
        const c = { ch, x, y };
        if (ch === '#') c.t = 'rock';
        else if (ch === '/' || ch === '\\') { c.t = 'mirror'; c.o = ch === '/' ? 0 : 1; c.rot = true; }
        else if (ch === '1' || ch === '2') { c.t = 'mirror'; c.o = ch === '1' ? 0 : 1; c.rot = false; }
        else if (ch === 'x' || ch === 'X') { c.t = 'split'; c.o = ch === 'x' ? 0 : 1; c.rot = true; }
        else if ('RLUD'.includes(ch)) { c.t = 'lantern'; c.color = 'amber'; c.dir = DIRS[ch]; }
        else if ('rlud'.includes(ch)) { c.t = 'lantern'; c.color = 'blue'; c.dir = DIRS[ch.toUpperCase()]; }
        else if (ch === 'a') { c.t = 'seed'; c.need = 'amber'; }
        else if (ch === 'b') { c.t = 'seed'; c.need = 'blue'; }
        else if (ch === 'h') c.t = 'heart';
        else if (ch === 'o') c.t = 'bell';
        else if (ch === 'g') c.t = 'gate';
        else c.t = 'empty';
        if (c.rot) movable.push(c);
        if (c.o !== undefined) c.ang = c.o ? Math.PI / 4 : -Math.PI / 4;
        c.glow = 0; c.open = 0;
        return c;
      }));
    });
    return { cells, movable, w: rows[0].length, h: rows.length };
  }
  function simulate(lv) {
    let open = false, res;
    for (let pass = 0; pass < 3; pass++) {
      res = trace(lv, open);
      const nowOpen = res.bells > 0;
      if (nowOpen === open) break;
      open = nowOpen;
    }
    res.open = open;
    let win = true;
    for (const row of lv.cells) for (const c of row) {
      if (c.t === 'seed' && !res.hits.has(`${c.x},${c.y},${c.need}`)) win = false;
      if (c.t === 'heart' && !(res.hits.has(`${c.x},${c.y},amber`) && res.hits.has(`${c.x},${c.y},blue`))) win = false;
    }
    res.win = win;
    return res;
  }
  function trace(lv, open) {
    const segs = [], hits = new Set(), seen = new Set();
    let bells = 0;
    const queue = [];
    for (const row of lv.cells) for (const c of row) if (c.t === 'lantern') queue.push([c.x, c.y, c.dir[0], c.dir[1], c.color]);
    while (queue.length) {
      let [x, y, dx, dy, color] = queue.pop();
      for (let guard = 0; guard < 200; guard++) {
        const nx = x + dx, ny = y + dy;
        const key = `${nx},${ny},${dx},${dy},${color}`;
        if (seen.has(key)) break;
        seen.add(key);
        const c = lv.cells[ny] && lv.cells[ny][nx];
        if (!c || c.t === 'rock' || c.t === 'lantern' || (c.t === 'gate' && !open)) {
          segs.push([x, y, nx - dx * 0.5, ny - dy * 0.5, color]); break;
        }
        segs.push([x, y, nx, ny, color]);
        if (c.t === 'seed' || c.t === 'heart' || c.t === 'bell') {
          hits.add(`${nx},${ny},${color}`);
          if (c.t === 'bell' && !hits.has(`${nx},${ny},bell`)) { hits.add(`${nx},${ny},bell`); bells++; }
          break;
        }
        x = nx; y = ny;
        if (c.t === 'mirror' || c.t === 'split') {
          const [rx, ry] = c.o === 0 ? [-dy, -dx] : [dy, dx];
          if (c.t === 'split') queue.push([x, y, dx, dy, color]);
          dx = rx; dy = ry;
        }
      }
    }
    return { segs, hits, bells };
  }
  function solutions(lv) {
    const n = lv.movable.length, init = lv.movable.map((c) => c.o), sols = [];
    for (let m = 0; m < 1 << n; m++) {
      lv.movable.forEach((c, i) => { c.o = (m >> i) & 1; });
      if (simulate(lv).win) sols.push(m);
    }
    lv.movable.forEach((c, i) => { c.o = init[i]; });
    return sols;
  }

  // ---------- Sauvegarde ----------
  const SAVE_KEY = 'lanterne-ilia-enigmes-v1';
  const fresh = () => ({ best: {}, perfect: {}, chapters: [], intro: false, ending: false });
  let save = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible : partie non sauvegardée */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  const solvedCount = () => Object.keys(save.best).length;
  const isSolved = (i) => save.best[i] !== undefined;
  const isOpen = (i) => i === 0 || isSolved(i - 1) || isSolved(i);
  const chapterOf = (i) => { let c = 0; CHAPTERS.forEach((ch, k) => { if (i >= ch.start) c = k; }); return c; };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  const dctx = dark.getContext('2d');
  const ui = {
    topbar: $('topbar'), bottombar: $('bottombar'), menu: $('menu'), story: $('story'), win: $('win'),
    chapterLbl: $('lvl-chapter'), nameLbl: $('lvl-name'), moves: $('moves'), tip: $('tip'),
    oda: $('oda'), progress: $('progress'), chapters: $('chapters'), journal: $('journal'),
  };

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    for (const c of [canvas, dark]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (lv) layoutBoard();
  }
  window.addEventListener('resize', resize);

  // ---------- Outils de dessin ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; circle(x, y, r);
  }
  const BEAM = { amber: [255, 190, 90], blue: [140, 205, 255] };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ---------- État ----------
  let mode = 'village'; // village | board
  let lv = null, lvIndex = 0, sim = null, moves = 0, hints = 0, won = false, wonAt = 0;
  let cell = 40, ox = 0, oy = 0, time = 0;
  let hintCell = null, hintUntil = 0, cursor = -1;
  const motes = Array.from({ length: 34 }, (_, i) => ({ x: rnd(i), y: rnd(i + 40), s: rnd(i + 80) }));
  const skyStars = Array.from({ length: 50 }, (_, i) => ({ x: rnd(i), y: rnd(i + 99), t: rnd(i + 7) * 6 }));

  function layoutBoard() {
    const top = ui.topbar.offsetHeight + 4;
    const bottom = H - ui.bottombar.offsetHeight - 4;
    const avail = bottom - top;
    cell = Math.floor(Math.min((W - 12) / lv.w, avail / lv.h));
    ox = Math.round((W - cell * lv.w) / 2);
    oy = Math.round(top + (avail - cell * lv.h) / 2);
  }
  const cx = (x) => ox + (x + 0.5) * cell;
  const cy = (y) => oy + (y + 0.5) * cell;

  function loadLevel(i) {
    lvIndex = i;
    lv = parseLevel(LEVELS[i].rows);
    moves = 0; hints = 0; won = false; hintCell = null; cursor = -1;
    sim = simulate(lv);
    applySim(true);
    mode = 'board';
    ui.menu.hidden = true; ui.win.hidden = true; ui.story.hidden = true;
    ui.topbar.hidden = false; ui.bottombar.hidden = false;
    const ch = chapterOf(i);
    ui.chapterLbl.textContent = `Ch. ${ch + 1} · ${CHAPTERS[ch].name}`;
    ui.nameLbl.textContent = `${i + 1}. ${NAMES[i]}`;
    ui.tip.textContent = TIPS[i] || DEFAULT_TIP;
    updateMoves();
    layoutBoard();
  }

  function updateMoves() {
    ui.moves.textContent = moves;
    $('btn-hint').disabled = won;
  }

  function applySim(instant) {
    for (const row of lv.cells) for (const c of row) {
      if (c.t === 'seed') c.lit = sim.hits.has(`${c.x},${c.y},${c.need}`);
      if (c.t === 'heart') { c.litA = sim.hits.has(`${c.x},${c.y},amber`); c.litB = sim.hits.has(`${c.x},${c.y},blue`); c.lit = c.litA && c.litB; }
      if (c.t === 'bell') c.lit = sim.hits.has(`${c.x},${c.y},bell`);
      if (c.t === 'gate') c.target = sim.open ? 1 : 0;
      if (instant) { c.glow = c.lit ? 1 : 0; c.open = c.target || 0; }
    }
  }

  function rotate(c) {
    if (won || !c || !c.rot) return;
    c.o ^= 1;
    moves++;
    if (hintCell === c) hintCell = null;
    sim = simulate(lv);
    applySim(false);
    updateMoves();
    if (sim.win) {
      won = true; wonAt = time;
      ui.tip.textContent = lvIndex === LEVELS.length - 1 ? 'Le Cœur-Graine s\'éveille…' : 'Les graines se réveillent !';
      updateMoves();
      const prevBest = save.best[lvIndex];
      save.best[lvIndex] = prevBest === undefined ? moves : Math.min(prevBest, moves);
      const perfect = moves <= LEVELS[lvIndex].par && hints === 0;
      if (perfect) save.perfect[lvIndex] = true;
      persist();
      setTimeout(() => showWin(perfect, prevBest), reduced ? 500 : 1300);
    }
  }

  function giveHint() {
    if (won) return;
    const sols = solutions(lv);
    const cur = lv.movable.reduce((a, c, i) => a | (c.o << i), 0);
    const pop = (v) => { let k = 0; while (v) { k += v & 1; v >>= 1; } return k; };
    let best = sols[0];
    for (const s of sols) if (pop(s ^ cur) < pop(best ^ cur)) best = s;
    const wrong = lv.movable.filter((c, i) => ((best >> i) & 1) !== c.o);
    if (!wrong.length) return;
    hintCell = wrong[0];
    hintUntil = time + 3;
    hints++;
    ui.tip.textContent = `Essaie de faire pivoter le cristal qui clignote. (${wrong.length} cristal${wrong.length > 1 ? 'aux' : ''} à tourner)`;
  }

  function showWin(perfect, prevBest) {
    const last = lvIndex === LEVELS.length - 1;
    const par = LEVELS[lvIndex].par;
    $('win-kicker').textContent = `Énigme ${lvIndex + 1} sur ${LEVELS.length}`;
    $('win-title').textContent = last ? 'Le Cœur-Graine s\'éveille' : 'Les graines se réveillent';
    let stats = `Réussie en <strong>${moves}</strong> geste${moves > 1 ? 's' : ''}. Le minimum possible est ${par}.`;
    if (perfect) stats += ' <strong>Parfait !</strong> Une feuille pousse sur cette énigme.';
    else if (hints) stats += ' Sans indice et en ' + par + ' gestes, tu gagnes une feuille.';
    else stats += ` Refais-la en ${par} gestes pour gagner une feuille.`;
    if (prevBest !== undefined && moves < prevBest) stats += ' Nouveau record.';
    $('win-stats').innerHTML = stats;
    $('win-next').textContent = last ? 'Lire la fin' : 'Énigme suivante';
    ui.win.hidden = false;
    $('win-next').focus();
  }

  function nextLevel() {
    ui.win.hidden = true;
    if (lvIndex === LEVELS.length - 1) {
      const first = !save.ending;
      save.ending = true; persist();
      playStory([STORY.ending], () => showVillage(first));
      return;
    }
    startLevel(lvIndex + 1);
  }

  function startLevel(i) {
    const ch = chapterOf(i);
    if (CHAPTERS[ch].story && CHAPTERS[ch].start === i && !save.chapters.includes(ch)) {
      save.chapters.push(ch); persist();
      loadLevel(i);
      playStory([{ kicker: `Chapitre ${ch + 1}`, title: CHAPTERS[ch].name, text: CHAPTERS[ch].story }], () => { ui.story.hidden = true; });
      return;
    }
    loadLevel(i);
  }

  // ---------- Histoire ----------
  let storyQueue = [], storyDone = null;
  function playStory(cards, done) {
    storyQueue = cards.slice(); storyDone = done;
    ui.story.hidden = false;
    nextStory();
  }
  function nextStory() {
    const c = storyQueue.shift();
    if (!c) { ui.story.hidden = true; const d = storyDone; storyDone = null; if (d) d(); return; }
    $('story-kicker').textContent = c.kicker;
    $('story-title').textContent = c.title;
    $('story-text').textContent = c.text;
    $('story-next').textContent = storyQueue.length ? 'Continuer' : c.kicker === 'Prologue' ? 'Prendre la lanterne' : c.kicker === 'Épilogue' ? 'Retour au village' : 'Entrer';
    const card = ui.story.firstElementChild;
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    $('story-next').focus();
  }

  // ---------- Village ----------
  function showVillage() {
    mode = 'village';
    lv = null;
    ui.topbar.hidden = true; ui.bottombar.hidden = true; ui.win.hidden = true;
    ui.menu.hidden = false;
    renderMenu();
  }

  function nextToPlay() {
    for (let i = 0; i < LEVELS.length; i++) if (!isSolved(i)) return i;
    return -1;
  }

  function renderMenu() {
    const n = solvedCount();
    const next = nextToPlay();
    ui.oda.textContent = save.ending ? ODA_END : ODA[chapterOf(Math.max(0, next))];
    const leaves = Object.keys(save.perfect).length;
    ui.progress.innerHTML = `Graines réveillées : <strong>${n}</strong> sur ${LEVELS.length} · Feuilles parfaites : <strong>${leaves}</strong>`;
    const play = $('btn-play');
    play.textContent = next === -1 ? 'Rejouer la première énigme' : n === 0 ? 'Commencer' : `Continuer : énigme ${next + 1}`;
    play.onclick = () => startLevel(next === -1 ? 0 : next);

    ui.chapters.innerHTML = '';
    CHAPTERS.forEach((ch, k) => {
      const end = k + 1 < CHAPTERS.length ? CHAPTERS[k + 1].start : LEVELS.length;
      const block = document.createElement('div');
      block.className = 'chapter-block';
      const done = Array.from({ length: end - ch.start }, (_, j) => isSolved(ch.start + j)).filter(Boolean).length;
      block.innerHTML = `<h2>${ch.name}<small>${done}/${end - ch.start}</small></h2><div class="levels"></div>`;
      const row = block.querySelector('.levels');
      for (let i = ch.start; i < end; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lvl' + (isSolved(i) ? ' done' : '') + (save.perfect[i] ? ' perfect' : '');
        b.textContent = i + 1;
        b.disabled = !isOpen(i);
        b.setAttribute('aria-label', `Énigme ${i + 1}, ${NAMES[i]}${isSolved(i) ? ', réussie' : ''}${save.perfect[i] ? ' parfaitement' : ''}${b.disabled ? ', pas encore ouverte' : ''}`);
        b.addEventListener('click', () => startLevel(i));
        row.appendChild(b);
      }
      ui.chapters.appendChild(block);
    });
    const legend = document.createElement('p');
    legend.className = 'legend';
    legend.textContent = 'Une feuille verte : énigme réussie en un minimum de gestes, sans indice.';
    ui.chapters.appendChild(legend);

    ui.journal.innerHTML = '';
    const pages = [...STORY.intro];
    CHAPTERS.forEach((ch, k) => { if (ch.story && save.chapters.includes(k)) pages.push({ title: ch.name, text: ch.story }); });
    if (save.ending) pages.push(STORY.ending);
    for (const p of pages) {
      const d = document.createElement('div');
      d.className = 'chapter';
      d.innerHTML = '<h3></h3><p></p>';
      d.querySelector('h3').textContent = p.title;
      d.querySelector('p').textContent = p.text;
      ui.journal.appendChild(d);
    }
  }

  // ---------- Dessin : village ----------
  function drawTree(x, y, h, leafP, bloom) {
    let n = 0;
    const tips = [];
    ctx.strokeStyle = '#1a110d';
    ctx.lineCap = 'round';
    (function br(x0, y0, len, ang, d) {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      ctx.lineWidth = Math.max(1, d * d * 0.42 + 1);
      ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + Math.cos(ang + 0.3) * len * 0.5, y0 + Math.sin(ang + 0.3) * len * 0.5, x1, y1);
      ctx.stroke();
      if (d === 0) { tips.push([x1, y1]); return; }
      br(x1, y1, len * (0.7 + 0.12 * rnd(n++)), ang - 0.38 - 0.25 * rnd(n++), d - 1);
      br(x1, y1, len * (0.68 + 0.12 * rnd(n++)), ang + 0.34 + 0.25 * rnd(n++), d - 1);
    })(x, y, h * 0.32, -Math.PI / 2 - 0.05, 6);
    const count = Math.round(tips.length * leafP);
    for (let i = 0; i < count; i++) {
      const [lx, ly] = tips[(i * 37) % tips.length];
      const sway = reduced ? 0 : Math.sin(time * 1.5 + i) * 1.5;
      ctx.fillStyle = `hsla(${95 + rnd(i) * 40},${45 + rnd(i + 5) * 20}%,${32 + rnd(i + 9) * 18}%,0.92)`;
      circle(lx + sway, ly, 5 + rnd(i + 3) * 5);
      circle(lx + sway + 5, ly + 3, 3 + rnd(i + 4) * 4);
      circle(lx + sway - 4, ly + 4, 3 + rnd(i + 6) * 3);
    }
    if (bloom) for (let i = 0; i < tips.length; i += 3) { const [lx, ly] = tips[i]; ctx.fillStyle = '#ffd98a'; circle(lx + 4, ly - 3, 2.2); }
  }

  function drawPerson(x, y, cloak, scarf, hair, s) {
    ctx.fillStyle = cloak;
    ctx.beginPath(); ctx.moveTo(x - 9 * s, y); ctx.quadraticCurveTo(x, y - 30 * s, x + 9 * s, y); ctx.fill();
    ctx.fillRect(x - 5 * s, y - 24 * s, 10 * s, 12 * s);
    ctx.fillStyle = scarf; ctx.fillRect(x - 6 * s, y - 25 * s, 12 * s, 4 * s);
    ctx.fillStyle = '#e8c39e'; circle(x, y - 30 * s, 5.5 * s);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x, y - 31 * s, 6 * s, Math.PI, 0); ctx.fill();
  }

  function drawVillage() {
    const gy = Math.round(H * 0.4);
    const dawn = save.ending;
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, dawn ? '#355a8c' : '#101230');
    sky.addColorStop(0.6, dawn ? '#9a88b8' : '#35264d');
    sky.addColorStop(1, dawn ? '#f6c98a' : '#a55a6c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy);
    if (!dawn) {
      for (const s of skyStars) {
        ctx.fillStyle = `rgba(255,245,220,${reduced ? 0.6 : 0.35 + 0.35 * Math.sin(time * 1.5 + s.t)})`;
        ctx.fillRect(s.x * W, s.y * gy * 0.7, 1.6, 1.6);
      }
      glow(W * 0.2, gy * 0.3, 40, 'rgba(255,240,210,0.25)');
      ctx.fillStyle = '#f4ead2'; circle(W * 0.2, gy * 0.3, 13);
      ctx.fillStyle = '#35264d'; circle(W * 0.2 + 6, gy * 0.3 - 3, 11);
    } else glow(W * 0.25, gy - 20, 120, 'rgba(255,220,150,0.5)');

    ctx.fillStyle = dawn ? '#6b6488' : '#24193a';
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, gy - 40 - 18 * Math.sin(x * 0.012 + 1) - 10 * Math.sin(x * 0.031));
    ctx.lineTo(W, gy); ctx.fill();

    for (const [hx, hw, hh] of [[0.04, 30, 26], [0.15, 36, 34], [0.27, 26, 22]]) {
      const x = hx * W;
      ctx.fillStyle = dawn ? '#3b2c3a' : '#1a1222';
      ctx.fillRect(x, gy - hh, hw, hh);
      ctx.beginPath(); ctx.moveTo(x - 4, gy - hh); ctx.lineTo(x + hw / 2, gy - hh - 18); ctx.lineTo(x + hw + 4, gy - hh); ctx.fill();
      glow(x + hw / 2, gy - hh / 2, 16, 'rgba(242,166,59,0.35)');
      ctx.fillStyle = '#f2c46b'; ctx.fillRect(x + hw / 2 - 4, gy - hh / 2 - 4, 8, 8);
    }

    // Le Grand Chêne reverdit à chaque graine réveillée
    drawTree(W * 0.76, gy, Math.min(230, H * 0.33), dawn ? 1 : (solvedCount() / LEVELS.length) * 0.85, dawn);

    // Sous terre : les racines, et une lueur par graine réveillée
    const soil = ctx.createLinearGradient(0, gy, 0, H);
    soil.addColorStop(0, '#24170f'); soil.addColorStop(1, '#0d0806');
    ctx.fillStyle = soil; ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = '#3a2618'; ctx.lineCap = 'round';
    for (let i = 0; i < LEVELS.length; i++) {
      const a = (i / (LEVELS.length - 1)) * Math.PI;
      const ex = W * 0.76 + Math.cos(Math.PI - a) * W * 0.55, ey = gy + 30 + Math.sin(a) * H * 0.35 + rnd(i) * 30;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * 0.76, gy); ctx.quadraticCurveTo(W * 0.76 + (ex - W * 0.76) * 0.3, ey, ex, ey); ctx.stroke();
      if (isSolved(i)) { glow(ex, ey, 18, 'rgba(242,190,90,0.55)'); ctx.fillStyle = '#ffd98a'; circle(ex, ey, 3); }
    }

    ctx.fillStyle = dawn ? '#4f6a34' : '#233021';
    ctx.fillRect(0, gy - 4, W, 8);
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 3; x < W; x += 7) { ctx.moveTo(x, gy - 3); ctx.lineTo(x + 2, gy - 8 - rnd(x) * 5); }
    ctx.stroke();

    const ow = W * 0.2, c = W / 2;
    for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
      if (row && i === 6) continue;
      const bw = (ow + 34) / 7;
      ctx.fillStyle = rnd(i + row * 9) < 0.5 ? '#5d5049' : '#4a3f3b';
      ctx.fillRect(c - (ow + 34) / 2 + i * bw + (row ? bw / 2 : 0) + 1, gy - 22 + row * 10, bw - 2, 9);
    }
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(c - ow / 2 - 12, gy - 82, 6, 62);
    ctx.fillRect(c + ow / 2 + 6, gy - 82, 6, 62);
    ctx.fillStyle = '#3b271a';
    ctx.beginPath(); ctx.moveTo(c - ow / 2 - 24, gy - 80); ctx.lineTo(c, gy - 106); ctx.lineTo(c + ow / 2 + 24, gy - 80); ctx.fill();
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(c - ow / 2 - 6, gy - 64, ow + 12, 6);
    const ix = c - ow / 2 - 34;
    drawPerson(ix, gy - 3, '#2f5d50', '#c8452f', '#3a2418', 1);
    glow(ix + 11, gy - 16, 22, 'rgba(242,166,59,0.5)');
    ctx.fillStyle = '#f2c46b'; ctx.fillRect(ix + 8, gy - 20, 6, 8);
    drawPerson(ix - 30, gy - 3, '#4a3b52', '#bda98a', '#d9d2c5', 0.92);
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(ix - 20, gy - 30, 2, 28);
  }

  // ---------- Dessin : plateau ----------
  const isFloor = (x, y) => { const c = lv.cells[y] && lv.cells[y][x]; return c && c.t !== 'rock' && c.t !== 'lantern'; };

  function drawBoard(ch, lights) {
    const r = cell * 0.32;
    // Roche partout, puis le sol creusé
    ctx.fillStyle = ch.rock;
    ctx.fillRect(ox, oy, cell * lv.w, cell * lv.h);
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      const x0 = ox + x * cell, y0 = oy + y * cell;
      if (isFloor(x, y)) {
        ctx.fillStyle = ch.floor; ctx.fillRect(x0, y0, cell + 0.5, cell + 0.5);
        // cailloux
        for (let k = 0; k < 3; k++) {
          const s = rnd(x * 31 + y * 17 + k * 7 + lvIndex * 101);
          ctx.fillStyle = 'rgba(255,255,255,0.035)';
          ctx.beginPath(); ctx.ellipse(x0 + rnd(s * 50) * cell, y0 + rnd(s * 70) * cell, 1.5 + s * 2.5, 1 + s * 1.5, 0, 0, TAU); ctx.fill();
        }
      } else {
        for (let k = 0; k < 4; k++) {
          const s = rnd(x * 13 + y * 29 + k * 5 + lvIndex * 7);
          ctx.fillStyle = s < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.18)';
          circle(x0 + rnd(s * 90) * cell, y0 + rnd(s * 40) * cell, 1 + s * 3);
        }
      }
    }
    // Coins arrondis : la roche entre dans le sol, et le sol dans la roche
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      const floor = isFloor(x, y);
      const x0 = ox + x * cell, y0 = oy + y * cell;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const a = isFloor(x + sx, y), b = isFloor(x, y + sy);
        if (floor ? (a || b) : (!a || !b)) continue;
        const px = sx < 0 ? x0 : x0 + cell, py = sy < 0 ? y0 : y0 + cell;
        const qx = px - sx * r, qy = py - sy * r;
        ctx.fillStyle = floor ? ch.rock : ch.floor;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, py);
        const a0 = Math.atan2(py - qy, 0), a1 = Math.atan2(0, px - qx);
        ctx.arc(qx, qy, r, a0, a1, ((a1 - a0) % TAU + TAU) % TAU > Math.PI);
        ctx.closePath(); ctx.fill();
      }
    }
    // Ombre portée des parois
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      if (!isFloor(x, y)) continue;
      const x0 = ox + x * cell, y0 = oy + y * cell, sh = cell * 0.18;
      if (!isFloor(x, y - 1)) { const g = ctx.createLinearGradient(0, y0, 0, y0 + sh); g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x0, y0, cell, sh); }
      if (!isFloor(x - 1, y)) { const g = ctx.createLinearGradient(x0, 0, x0 + sh, 0); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x0, y0, sh, cell); }
    }
    // Décor du chapitre, sur les parois qui bordent le sol
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      const c = lv.cells[y][x];
      if (c.t !== 'rock' || rnd(x * 7 + y * 11 + lvIndex) > 0.35) continue;
      const side = [[0, 1], [1, 0], [-1, 0], [0, -1]].find(([dx, dy]) => isFloor(x + dx, y + dy));
      if (!side) continue;
      drawDeco(ch.deco, cx(x) + side[0] * cell * 0.45, cy(y) + side[1] * cell * 0.45, side, rnd(x + y * 3), lights);
    }
  }

  function drawDeco(kind, x, y, [dx, dy], s, lights) {
    const k = cell / 50;
    if (kind === 'root') {
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 3 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - dx * 6 * k, y - dy * 6 * k);
      ctx.quadraticCurveTo(x + dx * 8 * k + dy * 8 * k, y + dy * 8 * k + dx * 8 * k, x + dx * 4 * k + dy * 14 * k * (s - 0.5), y + dy * 4 * k + dx * 14 * k * (s - 0.5));
      ctx.stroke();
    } else if (kind === 'mushroom') {
      for (let i = 0; i < 2; i++) {
        const mx = x + dy * (i * 9 - 4) * k, my = y + dx * (i * 9 - 4) * k;
        ctx.fillStyle = '#cfe3da'; ctx.fillRect(mx - 1, my - 1, 2, 5 * k);
        ctx.fillStyle = '#5fd3c0'; ctx.beginPath(); ctx.ellipse(mx, my, 5 * k, 3.5 * k, 0, Math.PI, 0); ctx.fill();
      }
      lights.push({ x, y, r: cell * 0.8, a: 0.45 });
    } else if (kind === 'drip') {
      ctx.fillStyle = 'rgba(120,160,230,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y, 8 * k, 3 * k, 0, 0, TAU); ctx.fill();
      if (!reduced) { ctx.fillStyle = 'rgba(170,200,255,0.7)'; circle(x + dx * ((time * 20 + s * 40) % 14) * k, y + dy * ((time * 20 + s * 40) % 14) * k, 1.4 * k); }
    } else if (kind === 'shard') {
      ctx.fillStyle = '#8e6fd0';
      ctx.beginPath(); ctx.moveTo(x - dy * 4 * k, y - dx * 4 * k); ctx.lineTo(x + dx * 12 * k, y + dy * 12 * k); ctx.lineTo(x + dy * 4 * k, y + dx * 4 * k); ctx.fill();
      lights.push({ x, y, r: cell * 0.6, a: 0.35 });
    } else {
      const f = reduced ? 0.8 : 0.6 + 0.4 * Math.sin(time * 3 + s * 9);
      ctx.strokeStyle = `rgba(255,${110 + f * 60},50,${f})`; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * 8 * k + dy * 5 * k, y - dy * 8 * k + dx * 5 * k); ctx.lineTo(x - dx * 14 * k - dy * 3 * k, y - dy * 14 * k - dx * 3 * k); ctx.stroke();
      lights.push({ x, y, r: cell * 0.7, a: 0.4 * f });
    }
  }

  function drawCrystal(c, x, y) {
    const s = cell;
    if (c.rot) {
      // socle : cercle doré = cristal qu'on peut tourner
      ctx.strokeStyle = 'rgba(242,166,59,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, s * 0.38, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(242,166,59,0.08)'; circle(x, y, s * 0.38);
    } else {
      ctx.fillStyle = '#4a2f1c'; circle(x, y, s * 0.16);
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.ang);
    const L = s * 0.86, t = c.t === 'split' ? s * 0.15 : s * 0.12;
    const g = ctx.createLinearGradient(0, -t / 2, 0, t / 2);
    if (c.t === 'split') {
      g.addColorStop(0, 'rgba(255,220,255,0.75)'); g.addColorStop(0.5, 'rgba(200,170,255,0.35)'); g.addColorStop(1, 'rgba(160,230,255,0.75)');
    } else {
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#bfe9ff'); g.addColorStop(1, '#6fa7c9');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0); ctx.lineTo(-L / 2 + t * 0.7, -t / 2); ctx.lineTo(L / 2 - t * 0.7, -t / 2);
    ctx.lineTo(L / 2, 0); ctx.lineTo(L / 2 - t * 0.7, t / 2); ctx.lineTo(-L / 2 + t * 0.7, t / 2); ctx.closePath();
    ctx.fill();
    if (c.t === 'split') { ctx.strokeStyle = 'rgba(255,240,255,0.9)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
    if (!c.rot) {
      // racines qui tiennent le cristal
      ctx.strokeStyle = '#6b4526'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.lineCap = 'round';
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sgn * s * 0.2, y + s * 0.05, x + sgn * s * 0.12, y + s * 0.3);
        ctx.stroke();
      }
    }
  }

  function drawLanternCell(c, x, y, lights) {
    const blue = c.color === 'blue';
    const col = BEAM[c.color];
    const k = cell / 42;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; circle(x, y, cell * 0.42);
    glow(x + c.dir[0] * cell * 0.3, y + c.dir[1] * cell * 0.3, cell * 0.8, rgba(col, 0.35));
    lights.push({ x, y, r: cell * 1.3, a: 1 });
    const flick = reduced ? 1 : 0.9 + 0.1 * Math.sin(time * 13 + x) * Math.sin(time * 7.3);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.strokeStyle = '#b8894a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -15, 4.5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = blue ? '#4b5d7a' : '#8a5a2b';
    ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, -9); ctx.lineTo(5, -14); ctx.lineTo(-5, -14); ctx.fill();
    ctx.fillStyle = blue ? 'rgba(160,210,255,0.45)' : 'rgba(255,214,140,0.45)'; ctx.fillRect(-7, -9, 14, 16);
    ctx.fillStyle = blue ? '#e6f5ff' : '#fff1c2';
    ctx.beginPath(); ctx.ellipse(0, 0, 2.8 * flick, 5.5 * flick, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = blue ? '#7fc8ff' : '#f2a63b';
    ctx.beginPath(); ctx.ellipse(0, 2, 2, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = blue ? '#4b5d7a' : '#8a5a2b'; ctx.fillRect(-9, 7, 18, 4);
    ctx.restore();
  }

  function drawRing(x, y, r, color, dashed) {
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, cell * 0.05);
    if (dashed) ctx.setLineDash([cell * 0.07, cell * 0.07]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSeed(c, x, y, lights) {
    const s = cell, blue = c.need === 'blue';
    const col = BEAM[c.need];
    c.glow += ((c.lit ? 1 : 0) - c.glow) * 0.08;
    const g = c.glow;
    if (g > 0.02) { glow(x, y, s * (0.5 + 0.4 * g), rgba(col, 0.5 * g)); lights.push({ x, y, r: s * 1.1 * g, a: g }); }
    drawRing(x, y, s * 0.36, rgba(col, 0.45 + 0.5 * g), blue);
    // petit signe : soleil ou lune
    ctx.fillStyle = rgba(col, 0.9);
    if (blue) { circle(x + s * 0.26, y - s * 0.26, s * 0.07); ctx.fillStyle = cellFloor(); circle(x + s * 0.29, y - s * 0.28, s * 0.06); }
    else circle(x + s * 0.26, y - s * 0.26, s * 0.06);
    // la graine
    const husk = ctx.createLinearGradient(x - s * 0.15, y - s * 0.2, x + s * 0.15, y + s * 0.2);
    husk.addColorStop(0, blue ? '#8fa3c7' : '#c08a4e'); husk.addColorStop(1, blue ? '#3e4d6b' : '#5b3a1e');
    ctx.fillStyle = husk;
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.2);
    ctx.bezierCurveTo(x + s * 0.2, y - s * 0.06, x + s * 0.16, y + s * 0.18, x, y + s * 0.18);
    ctx.bezierCurveTo(x - s * 0.16, y + s * 0.18, x - s * 0.2, y - s * 0.06, x, y - s * 0.2); ctx.fill();
    if (g > 0.05) {
      // la pousse
      const h = s * 0.3 * g;
      ctx.strokeStyle = '#8fd46b'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.16); ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.16 - h * 0.6, x, y - s * 0.16 - h); ctx.stroke();
      ctx.fillStyle = '#a6e27f';
      ctx.beginPath(); ctx.ellipse(x - s * 0.08 * g, y - s * 0.16 - h * 0.8, s * 0.09 * g, s * 0.04 * g, -0.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + s * 0.08 * g, y - s * 0.16 - h, s * 0.09 * g, s * 0.04 * g, 0.6, 0, TAU); ctx.fill();
    }
  }
  const cellFloor = () => CHAPTERS[chapterOf(lvIndex)].floor;

  function drawHeart(c, x, y, lights) {
    const s = cell;
    c.glow += ((c.lit ? 1 : 0) - c.glow) * 0.05;
    const g = c.glow, p = reduced ? 1 : 1 + 0.06 * Math.sin(time * 2.5);
    glow(x, y, s * (0.7 + g), `rgba(255,200,90,${0.25 + 0.4 * g})`);
    lights.push({ x, y, r: s * (0.9 + 1.6 * g), a: 0.6 + 0.4 * g });
    ctx.lineWidth = Math.max(3, s * 0.07);
    ctx.strokeStyle = rgba(BEAM.amber, c.litA ? 1 : 0.4);
    ctx.beginPath(); ctx.arc(x, y, s * 0.42, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = rgba(BEAM.blue, c.litB ? 1 : 0.4); ctx.setLineDash([s * 0.07, s * 0.07]);
    ctx.beginPath(); ctx.arc(x, y, s * 0.42, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.setLineDash([]);
    if (g > 0.05) {
      ctx.strokeStyle = `rgba(255,220,140,${0.5 * g})`; ctx.lineWidth = 2;
      for (let k = 0; k < 10; k++) {
        const a = time * 0.4 + (k / 10) * TAU;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5); ctx.lineTo(x + Math.cos(a) * s * (0.5 + 0.35 * g), y + Math.sin(a) * s * (0.5 + 0.35 * g)); ctx.stroke();
      }
    }
    const gr = ctx.createLinearGradient(x - s * 0.2, y - s * 0.3, x + s * 0.2, y + s * 0.3);
    gr.addColorStop(0, '#fff0b8'); gr.addColorStop(0.5, '#f2b441'); gr.addColorStop(1, '#a8651c');
    ctx.fillStyle = gr;
    const k = s * p;
    ctx.beginPath(); ctx.moveTo(x, y - k * 0.3); ctx.bezierCurveTo(x + k * 0.26, y - k * 0.1, x + k * 0.22, y + k * 0.26, x, y + k * 0.26);
    ctx.bezierCurveTo(x - k * 0.22, y + k * 0.26, x - k * 0.26, y - k * 0.1, x, y - k * 0.3); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,10,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - k * 0.24); ctx.quadraticCurveTo(x + k * 0.06, y, x, y + k * 0.22); ctx.stroke();
  }

  function drawBell(c, x, y, lights) {
    const s = cell;
    c.glow += ((c.lit ? 1 : 0) - c.glow) * 0.1;
    const g = c.glow;
    ctx.strokeStyle = '#6b4526'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x, y - s * 0.24); ctx.stroke();
    if (g > 0.02) {
      glow(x, y, s * 0.8, `rgba(210,180,255,${0.45 * g})`);
      lights.push({ x, y, r: s * 1.2 * g, a: 0.8 * g });
      if (!reduced) for (let k = 0; k < 2; k++) {
        const ph = (time * 0.8 + k * 0.5) % 1;
        ctx.strokeStyle = `rgba(220,200,255,${(1 - ph) * 0.6 * g})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y + s * 0.05, s * (0.3 + ph * 0.35), 0, TAU); ctx.stroke();
      }
    }
    const swing = reduced ? 0 : Math.sin(time * 6) * 0.15 * g;
    ctx.save(); ctx.translate(x, y - s * 0.24); ctx.rotate(swing);
    const gr = ctx.createLinearGradient(-s * 0.2, 0, s * 0.2, 0);
    gr.addColorStop(0, '#7b5fc0'); gr.addColorStop(0.5, '#efe6ff'); gr.addColorStop(1, '#8e6fd0');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(-s * 0.08, 0); ctx.lineTo(s * 0.08, 0);
    ctx.quadraticCurveTo(s * 0.12, s * 0.28, s * 0.22, s * 0.42); ctx.lineTo(-s * 0.22, s * 0.42);
    ctx.quadraticCurveTo(-s * 0.12, s * 0.28, -s * 0.08, 0); ctx.fill();
    ctx.fillStyle = '#efe6ff'; circle(0, s * 0.46, s * 0.05);
    ctx.restore();
  }

  function drawGate(c, x, y) {
    const s = cell;
    c.open += ((c.target || 0) - c.open) * 0.08;
    const o = c.open, reach = s * 0.5 * (1 - o) + s * 0.08 * o;
    ctx.strokeStyle = '#6b4526'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, s * 0.09);
    for (let k = -1; k <= 1; k++) {
      // racines horizontales venant des deux côtés
      ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + k * s * 0.25);
      ctx.quadraticCurveTo(x - s * 0.5 + reach * 0.5, y + k * s * 0.25 - s * 0.08, x - s * 0.5 + reach, y + k * s * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.5, y + k * s * 0.25 + s * 0.06);
      ctx.quadraticCurveTo(x + s * 0.5 - reach * 0.5, y + k * s * 0.25 + s * 0.14, x + s * 0.5 - reach, y + k * s * 0.25 + s * 0.06); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,150,100,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.27); ctx.lineTo(x - s * 0.5 + reach, y - s * 0.27); ctx.stroke();
  }

  function drawBeams() {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const pass of [[cell * 0.34, 0.12], [cell * 0.14, 0.3], [Math.max(2, cell * 0.045), 0.95]]) {
      ctx.lineWidth = pass[0];
      for (const [x0, y0, x1, y1, col] of sim.segs) {
        ctx.strokeStyle = rgba(BEAM[col], pass[1]);
        ctx.beginPath(); ctx.moveTo(cx(x0), cy(y0)); ctx.lineTo(cx(x1), cy(y1)); ctx.stroke();
      }
    }
    // étincelles qui suivent le rayon
    if (!reduced) {
      ctx.setLineDash([2, cell * 0.45]);
      ctx.lineDashOffset = -time * cell * 2;
      ctx.lineWidth = Math.max(3, cell * 0.08);
      for (const [x0, y0, x1, y1, col] of sim.segs) {
        ctx.strokeStyle = 'rgba(255,255,240,0.8)';
        ctx.beginPath(); ctx.moveTo(cx(x0), cy(y0)); ctx.lineTo(cx(x1), cy(y1)); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawDarkness(alpha, lights) {
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = `rgba(4,2,5,${alpha})`;
    dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const g = dctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${l.a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath(); dctx.arc(l.x, l.y, l.r, 0, TAU); dctx.fill();
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
  }

  function drawBoardScene() {
    const ch = CHAPTERS[chapterOf(lvIndex)];
    ctx.fillStyle = ch.bg; ctx.fillRect(0, 0, W, H);
    const lights = [];
    drawBoard(ch, lights);
    for (const row of lv.cells) for (const c of row) {
      if (c.o !== undefined) { const target = c.o ? Math.PI / 4 : -Math.PI / 4; c.ang += (target - c.ang) * (reduced ? 1 : 0.25); }
      const x = cx(c.x), y = cy(c.y);
      if (c.t === 'seed') drawSeed(c, x, y, lights);
      else if (c.t === 'heart') drawHeart(c, x, y, lights);
      else if (c.t === 'bell') drawBell(c, x, y, lights);
      else if (c.t === 'gate') drawGate(c, x, y);
      else if (c.t === 'mirror' || c.t === 'split') drawCrystal(c, x, y);
      else if (c.t === 'lantern') drawLanternCell(c, x, y, lights);
    }
    drawBeams();
    for (const [x0, y0, x1, y1] of sim.segs) {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let k = 0; k <= n; k++) lights.push({ x: cx(x0 + (x1 - x0) * k / n), y: cy(y0 + (y1 - y0) * k / n), r: cell * 0.9, a: 0.55 });
    }
    drawDarkness(0.5, lights);

    // Par-dessus l'ombre : repères pour jouer
    if (hintCell && time < hintUntil) {
      const a = 0.5 + 0.5 * Math.sin(time * 8);
      ctx.strokeStyle = `rgba(143,212,107,${a})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx(hintCell.x), cy(hintCell.y), cell * 0.46, 0, TAU); ctx.stroke();
    }
    if (cursor >= 0 && lv.movable[cursor]) {
      const c = lv.movable[cursor];
      ctx.strokeStyle = '#7fd6c4'; ctx.lineWidth = 3;
      ctx.strokeRect(cx(c.x) - cell * 0.48, cy(c.y) - cell * 0.48, cell * 0.96, cell * 0.96);
    }
    for (const m of motes) {
      const y = ((m.y * H - time * (8 + m.s * 10)) % H + H) % H;
      ctx.fillStyle = `rgba(${ch.mote},${reduced ? 0.35 : 0.2 + 0.25 * Math.sin(time * 2 + m.s * 30)})`;
      circle(m.x * W + Math.sin(time * 0.5 + m.s * 9) * 6, y, 1 + m.s * 1.4);
    }
    if (won) {
      const f = clamp((time - wonAt) / 0.8, 0, 1);
      ctx.fillStyle = `rgba(255,220,150,${0.18 * Math.sin(f * Math.PI)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    if (mode === 'board' && lv) drawBoardScene();
    else drawVillage();
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  let last = performance.now();
  function frame(now) {
    time += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Contrôles ----------
  canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'board' || !ui.story.hidden || !ui.win.hidden) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - ox) / cell), y = Math.floor((e.clientY - rect.top - oy) / cell);
    const c = lv.cells[y] && lv.cells[y][x];
    cursor = -1;
    if (c) rotate(c);
  });
  window.addEventListener('keydown', (e) => {
    if (mode !== 'board' || !ui.story.hidden || !ui.win.hidden) return;
    if (document.activeElement && document.activeElement.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const list = lv.movable;
    if (!list.length) return;
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      if (cursor < 0) { cursor = 0; return; }
      const cur = list[cursor];
      const [dx, dy] = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      let best = -1, bestD = Infinity;
      list.forEach((c, i) => {
        const vx = c.x - cur.x, vy = c.y - cur.y;
        const along = vx * dx + vy * dy;
        if (along <= 0) return;
        const d = along + Math.abs(vx * dy - vy * dx) * 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) cursor = best;
    } else if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0) {
      e.preventDefault(); rotate(list[cursor]);
    }
  });

  $('btn-map').addEventListener('click', showVillage);
  $('btn-restart').addEventListener('click', () => loadLevel(lvIndex));
  $('btn-hint').addEventListener('click', giveHint);
  $('story-next').addEventListener('click', nextStory);
  $('win-next').addEventListener('click', nextLevel);
  $('win-replay').addEventListener('click', () => loadLevel(lvIndex));

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
    ui.menu.hidden = true;
    playStory(STORY.intro, () => { save.intro = true; persist(); showVillage(); });
  });

  resize();
  if (save.intro) showVillage();
  else {
    ui.menu.hidden = true;
    playStory(STORY.intro, () => { save.intro = true; persist(); showVillage(); $('btn-play').focus(); });
  }
  requestAnimationFrame(frame);
})();
