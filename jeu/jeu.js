/* La Lanterne d'Ilia
 * Jeu d'énigmes de lumière : fais pivoter les cristaux pour guider le rayon jusqu'aux graines.
 * - Campagne : 30 énigmes en 5 chapitres, chacune vérifiée par un solveur (`par` = gestes minimum).
 * - Village : des éclats de lumière pour restaurer 5 bâtiments, chacun avec un bonus.
 * - Missions des villageois, énigme du jour et défis libres générés à la volée.
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
    { par: 3, rows: ["#######", "R./.a.#", "#.....#", "#./.\\.#", "#..#..#", "###...#", "#.....#", "#....##", "#######"] },
    { par: 3, rows: ["#######", "#..#..#", "##....#", "#..##.#", "#....##", "#..\\./#", "#.....#", "#.a..\\#", "###U###"] },
    { par: 4, rows: ["#######", "#.....#", "#...\\.L", "#.\\a..#", "#.....#", "#./.\\##", "#...###", "##....#", "#######"] },
    { par: 5, rows: ["#####D#", "##a/..#", "#.#...#", "R.//.\\#", "#..#..#", "#.....#", "#.....#", "#./a..#", "#######"] },
    { par: 3, rows: ["#######", "R./a/.#", "#....##", "#.x.1.#", "#.....#", "##a#..#", "##....#", "#.....#", "#######"] },
    { par: 3, rows: ["#######", "#.....#", "#....##", "#./a.##", "#..#\\a#", "#..#.##", "#.X.\\.#", "R.1...#", "#######"] },
    { par: 3, rows: ["#######", "#.#.#.#", "#.\\.xa#", "##./..#", "#.....#", "R.1...#", "#.#./a#", "#.....#", "#######"] },
    { par: 4, rows: ["#######", "#.1a..#", "#a../.#", "#\\.a.##", "R.X.\\.#", "#.....#", "#.#..##", "#./...#", "#U#####"] },
    { par: 5, rows: ["##D####", "#/.a###", "#./../#", "##./.X#", "#.a.\\a#", "#.....#", "#.\\.1.#", "#.....#", "##U####"] },
    { par: 5, rows: ["#######", "#.1...L", "#..#..#", "#.x./a#", "##x..\\#", "#.....#", "#./aa.#", "##....#", "#######"] },
    { par: 3, rows: ["####D##", "###...#", "#./.\\.#", "#.....#", "#./a..#", "#..1.b#", "##..#.#", "r..\\..#", "#######"] },
    { par: 3, rows: ["#######", "#/#...#", "#.#...#", "#a.\\..#", "#.1...l", "#...#a#", "#\\.X.\\#", "#.b...#", "#U#####"] },
    { par: 4, rows: ["###D###", "#.#.#.#", "#b/...#", "#\\.1..#", "#....b#", "#a.\\.\\#", "#.....#", "#.....#", "##uu###"] },
    { par: 4, rows: ["#######", "#.\\b\\.l", "#a.\\..#", "#./.X.#", "##....#", "##..2b#", "#/..#.#", "#.....#", "###U###"] },
    { par: 4, rows: ["####d##", "#..\\..L", "#b...a#", "#2..x.#", "#..x.\\#", "#..a.##", "##.b\\.#", "#...#.#", "#######"] },
    { par: 5, rows: ["#######", "#.\\/..L", "r./..##", "#\\.\\..#", "#././.#", "#a....#", "#..#2b#", "#..#..#", "#######"] },
    { par: 4, rows: ["#######", "#..\\###", "#..#..#", "#o./..#", "#....##", "#....a#", "#\\.Xg\\#", "#.....#", "#U#####"] },
    { par: 3, rows: ["#######", "#...#.#", "#....a#", "#..\\g\\#", "#o....#", "#....##", "#2.x..#", "#...#.#", "###U###"] },
    { par: 4, rows: ["##D####", "R...2o#", "#./..\\#", "#\\.gX##", "#..#..#", "#a..a.#", "#.#...#", "#....\\#", "#######"] },
    { par: 4, rows: ["#####d#", "#...#.#", "#\\...\\#", "#o\\...#", "#.#...#", "#a..1.L", "#.#.g.#", "#/..\\.#", "#######"] },
    { par: 4, rows: ["###d###", "#.a...#", "#o....#", "#/.\\..#", "#.2.X.L", "#.#\\..#", "#.#..##", "#.ag\\.#", "#######"] },
    { par: 4, rows: ["#d#####", "#.#b..#", "#x..\\.#", "#...b.#", "#/g1..#", "##.\\.o#", "#.....#", "#../..L", "#######"] },
    { par: 4, rows: ["#######", "#.1x.h#", "#.....#", "#a.\\..#", "R.\\...#", "##/...#", "##\\../#", "#...#.#", "##u####"] },
    { par: 4, rows: ["##d##D#", "##....#", "#.....#", "#..\\.1#", "#./.\\.#", "#h./..#", "#.#...#", "#/..\\##", "#######"] },
    { par: 4, rows: ["#######", "#.1x.h#", "#.....#", "#a.\\..#", "R.\\...#", "#./...#", "##\\../#", "#...#.#", "##u####"] },
    { par: 5, rows: ["#######", "#....\\l", "#.h./.#", "##....#", "#./../#", "#...2.L", "#\\.../#", "#...#b#", "#u#####"] },
    { par: 4, rows: ["#######", "#....##", "#o/...#", "#h.\\..#", "#/..X.L", "#..\\.2#", "#a..\\.#", "#..#.g#", "##u##u#"] },
    { par: 5, rows: ["#####D#", "#..#..#", "r./...#", "#\\.g.x#", "#a....#", "#/.\\o.#", "#./.h\\#", "#.#2..l", "#######"] },
  ];

  const CHAPTERS = [
    { name: 'Le Terreau', start: 0, rock: '#3d2718', floor: '#23170f', bg: '#120b08', mote: '200,160,110', deco: 'root',
      story: null },
    { name: 'La Grotte des lunes', start: 6, rock: '#1c3336', floor: '#0e1c1e', bg: '#081113', mote: '140,230,210', deco: 'mushroom',
      story: "Sous la terre, des champignons brillent comme des lunes pâles. Ici, les cristaux poussent autrement : certains sont enracinés et ne bougent plus, d'autres sont doubles. Ils laissent passer la lumière et la renvoient en même temps." },
    { name: 'Le Lac muet', start: 12, rock: '#1a2744', floor: '#0b1428', bg: '#060b18', mote: '170,200,255', deco: 'drip',
      story: "Un lac immobile, noir comme l'encre. Sur la rive, Ilia trouve une lanterne-lune, à la lumière bleue. Certaines graines du lac ne se réveillent qu'avec elle." },
    { name: 'La Galerie chantante', start: 18, rock: '#2c1d47', floor: '#150e24', bg: '#0b0714', mote: '215,190,255', deco: 'shard',
      story: "Les cristaux chantent quand la lumière les touche. Au milieu de la galerie pend une cloche de cristal. Oda l'avait dit : « Fais-la chanter, et les racines s'écarteront. »" },
    { name: 'Les Veines de braise', start: 24, rock: '#3d150c', floor: '#1c0a07', bg: '#0f0504', mote: '255,150,80', deco: 'ember',
      story: "Il fait chaud. Les racines du Chêne battent comme un cœur. Au fond, le Cœur-Graine attend deux lumières à la fois : celle du soleil et celle de la lune." },
  ];
  const DEFI_CHAPTER = { name: 'Défi', rock: '#2a2330', floor: '#141018', bg: '#0a080c', mote: '230,210,180', deco: 'shard' };

  const NAMES = [
    'Premier reflet', 'Le coude', 'Le détour', 'Racines tordues', 'Le long chemin', 'Deux lanternes',
    'Le cristal double', 'Racines nouées', 'Deux lunes pâles', "L'écho", 'La fourche', 'Le double détour',
    'Lumière de lune', 'Le reflet du lac', 'Trois lanternes', 'Eaux croisées', 'Le gué', 'Brume bleue',
    'La cloche', 'Le carillon', 'La porte de racines', 'Le chant des pierres', 'Le chant bleu', 'La galerie',
    'Le Cœur-Graine', 'Le souffle chaud', 'Les braises', 'Soleil et lune', "L'avant-dernière porte", 'Le réveil',
  ];

  const TIPS = {
    0: 'Touche le cristal cerclé pour le faire pivoter. Guide la lumière jusqu\'à la graine.',
    1: 'Un rayon peut tourner plusieurs fois avant d\'arriver.',
    3: 'Les rochers arrêtent la lumière. Cherche le bon chemin.',
    5: 'Deux lanternes, deux rayons : chaque graine a besoin de lumière.',
    6: 'Le cristal double laisse passer la lumière et la renvoie aussi. Les cristaux sans cercle sont enracinés.',
    12: 'La lanterne-lune donne une lumière bleue. Anneau plein : graine du soleil. Anneau pointillé : graine de lune.',
    18: 'Éclaire la cloche : elle chante, et la porte de racines s\'ouvre.',
    24: 'Le Cœur-Graine a besoin des deux lumières en même temps.',
  };
  const DEFAULT_TIP = 'Touche un cristal cerclé pour le faire pivoter.';

  const STORY = {
    intro: [
      { kicker: 'Prologue', title: 'Le Grand Chêne',
        text: "À Brume-sous-Chêne, tout le monde vit à l'ombre du Grand Chêne. Cet hiver, ses feuilles sont tombées en une nuit. Depuis, le village s'éteint : la forge est froide, le four de la boulangerie aussi." },
      { kicker: 'Prologue', title: 'Ce que dit Oda',
        text: "Grand-mère Oda connaît les vieilles histoires. « Sous ses racines, les graines du Chêne se sont endormies dans le noir. Réveille-les avec la lumière, et il se réveillera aussi. »" },
      { kicker: 'Prologue', title: 'La lanterne',
        text: "Ilia prend la lanterne de sa mère et descend dans le vieux puits. Les cristaux des grottes renvoient la lumière : fais-les pivoter pour guider le rayon. Chaque graine réveillée libère des éclats de lumière, de quoi rallumer le village." },
    ],
    ending: { kicker: 'Épilogue', title: 'Le printemps revient',
      text: "Le Cœur-Graine s'éveille, et toutes les racines s'illuminent d'un coup. Au matin, le village se réveille sous une pluie de feuilles neuves. Oda pleure un peu, et rit beaucoup. Mais les cristaux, eux, continuent de bouger la nuit : l'Observatoire en signale de nouveaux chaque jour." },
  };
  const ODA = [
    '« Doucement, ma grande. La lumière va tout droit, sauf si un cristal la détourne. »',
    '« Ta mère disait que les champignons-lunes éclairent le chemin de ceux qui cherchent. »',
    '« La lanterne-lune ? Je la croyais perdue depuis trente ans. »',
    '« Tu entends ce chant ? C\'est le Chêne qui t\'appelle. »',
    '« Le Cœur-Graine est tout près. Tiens bon, Ilia. »',
  ];
  const ODA_END = '« Le Chêne respire à nouveau. Va voir l\'Observatoire : il y a toujours des cristaux à remettre en ordre. »';

  // ---------- Village : bâtiments ----------
  const BUILDINGS = [
    { id: 'forge', name: 'La Forge', who: 'Bram le forgeron', costs: [30, 80, 160],
      perk: (l) => `Réserve d'indices : ${3 + l} au maximum` },
    { id: 'four', name: 'La Boulangerie', who: 'Lise la boulangère', costs: [40, 100, 200],
      perk: (l) => (l ? `+${l * 2} éclats par énigme réussie` : 'Aucun bonus pour l\'instant') },
    { id: 'verre', name: "L'Atelier du verrier", who: 'Maître Anselme', costs: [50, 120, 220],
      perk: (l) => (l ? `${l + 1} styles de lanterne sur 4` : 'Un seul style de lanterne') },
    { id: 'jardin', name: "Le Jardin d'Oda", who: 'Grand-mère Oda', costs: [40, 90, 180],
      perk: (l) => (l ? `+${l * 5} éclats pour chaque première feuille parfaite` : 'Aucun bonus pour l\'instant') },
    { id: 'obs', name: "L'Observatoire", who: 'Tobi, le petit-fils du meunier', costs: [60, 150, 260],
      perk: (l) => ['Fermé', 'Ouvre l\'énigme du jour', 'Ouvre les défis difficiles', 'Énigme du jour : récompense doublée'][l] },
  ];

  const STYLES = {
    laiton: { name: 'Laiton', frame: '#8a5a2b', spark: 'rgba(255,255,240,0.8)', need: 0 },
    argent: { name: 'Argent', frame: '#9aa3ad', spark: 'rgba(230,245,255,0.9)', need: 1 },
    rose: { name: 'Or rose', frame: '#b0677a', spark: 'rgba(255,200,220,0.9)', need: 2 },
    aurore: { name: 'Aurore', frame: '#3f6b5a', spark: null, need: 3 },
  };
  const sparkColor = (col) => STYLES[save.style].spark || `hsla(${(time * 90) % 360},90%,75%,0.9)`;

  // ---------- Missions des villageois ----------
  const MISSIONS = [
    { id: 'm1', who: 'Oda', text: 'Réveille tes 3 premières graines', goal: 3, get: () => solvedCount(), reward: 15 },
    { id: 'm2', who: 'Bram', text: 'Restaure un bâtiment du village', goal: 1, get: () => buildLevels(), reward: 10 },
    { id: 'm3', who: 'Oda', text: 'Termine le chapitre « Le Terreau »', goal: 1, get: () => chaptersDone(), reward: 20 },
    { id: 'm4', who: 'Lise', text: 'Obtiens 3 feuilles parfaites', goal: 3, get: () => perfectCount(), reward: 20 },
    { id: 'm5', who: 'Tobi', text: 'Résous une énigme en moins de 15 secondes', goal: 1, get: () => save.stats.fast, reward: 20 },
    { id: 'm6', who: 'Bram', text: 'Réussis 5 énigmes sans utiliser d\'indice', goal: 5, get: () => save.stats.noHint, reward: 25 },
    { id: 'm7', who: 'Anselme', text: 'Réveille 5 graines de lune', goal: 5, get: () => save.stats.blue, reward: 30 },
    { id: 'm8', who: 'Tobi', text: 'Fais chanter 3 cloches de cristal', goal: 3, get: () => save.stats.bells, reward: 30 },
    { id: 'm9', who: 'Oda', text: 'Termine 3 chapitres', goal: 3, get: () => chaptersDone(), reward: 40 },
    { id: 'm10', who: 'Tobi', text: 'Réussis une énigme du jour', goal: 1, get: () => save.stats.daily, reward: 25 },
    { id: 'm11', who: 'Anselme', text: 'Résous 5 défis libres', goal: 5, get: () => save.stats.free, reward: 40 },
    { id: 'm12', who: 'Lise', text: 'Obtiens 10 feuilles parfaites', goal: 10, get: () => perfectCount(), reward: 50 },
    { id: 'm13', who: 'Bram', text: 'Monte 8 niveaux de bâtiments', goal: 8, get: () => buildLevels(), reward: 60 },
    { id: 'm14', who: 'Oda', text: 'Réveille le Cœur-Graine', goal: 1, get: () => (save.ending ? 1 : 0), reward: 80 },
    { id: 'm15', who: 'Tobi', text: 'Réussis un défi difficile sans indice', goal: 1, get: () => save.stats.hardNoHint, reward: 50 },
    { id: 'm16', who: 'Anselme', text: 'Débloque le style de lanterne Aurore', goal: 3, get: () => save.build.verre, reward: 40 },
    { id: 'm17', who: 'Oda', text: 'Restaure tout le village', goal: 15, get: () => buildLevels(), reward: 120 },
    { id: 'm18', who: 'Lise', text: 'Obtiens les 30 feuilles de l\'histoire', goal: 30, get: () => perfectCount(), reward: 200 },
  ];

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


  // ---------- Générateur de défis (même méthode que pour la campagne) ----------
  const popcount = (v) => { let k = 0; while (v) { k += v & 1; v >>= 1; } return k; };
  function solveFull(lv) {
    const sols = solutions(lv);
    const initMask = lv.movable.reduce((a, c, i) => a | (c.o << i), 0);
    const par = sols.length ? Math.min(...sols.map((s) => popcount(s ^ initMask))) : -1;
    return { sols, par };
  }

  const GW = 7, GH = 9;
  const inside = (x, y) => x > 0 && y > 0 && x < GW - 1 && y < GH - 1;
  const DCH = (dx, dy) => (dx === 1 ? 'R' : dx === -1 ? 'L' : dy === 1 ? 'D' : 'U');
  const orientFor = (dx, dy, ex, ey) => (ex === -dy && ey === -dx ? 0 : 1);

  // On trace d'abord les rayons de la solution, puis on mélange les cristaux.
  function attempt(spec, rand) {
    const g = Array.from({ length: GH }, (_, y) => Array.from({ length: GW }, (_, x) => (inside(x, y) ? '.' : '#')));
    const path = new Map();
    const turnCells = [];
    const mark = (x, y) => path.set(x + ',' + y, (path.get(x + ',' + y) || 0) + 1);
    const free = (x, y) => inside(x, y) && g[y][x] === '.' && !path.has(x + ',' + y);
    const splitTargets = [...(spec.splitT || [])];

    function walk(x, y, dx, dy, len, target, splits) {
      let since = 0;
      for (let step = 0; step < 40; step++) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny) || g[ny][nx] !== '.') return false;
        if (step >= len && free(nx, ny)) { g[ny][nx] = target; return true; }
        if (splits > 0 && step >= 1 && free(nx, ny) && rand() < 0.3) {
          const [ex, ey] = rand() < 0.5 ? [dy, dx] : [-dy, -dx];
          g[ny][nx] = orientFor(dx, dy, ex, ey) ? 'X' : 'x';
          turnCells.push([nx, ny]);
          const sub = splitTargets.shift();
          if (!sub || !walk(nx, ny, ex, ey, 2 + Math.floor(rand() * 3), sub, 0)) return false;
          splits--; x = nx; y = ny; since = 0; continue;
        }
        if (since >= 1 && free(nx, ny) && rand() < 0.42) {
          const [ex, ey] = rand() < 0.5 ? [dy, dx] : [-dy, -dx];
          if (!inside(nx + ex, ny + ey)) { mark(nx, ny); x = nx; y = ny; since++; continue; }
          g[ny][nx] = orientFor(dx, dy, ex, ey) ? '\\' : '/';
          turnCells.push([nx, ny]);
          x = nx; y = ny; dx = ex; dy = ey; since = 0; continue;
        }
        mark(nx, ny); x = nx; y = ny; since++;
      }
      return false;
    }
    function lanternSpot() {
      for (let t = 0; t < 50; t++) {
        const side = Math.floor(rand() * 4);
        let x, y, dx = 0, dy = 0;
        if (side === 0) { x = 1 + Math.floor(rand() * (GW - 2)); y = 0; dy = 1; }
        if (side === 1) { x = 1 + Math.floor(rand() * (GW - 2)); y = GH - 1; dy = -1; }
        if (side === 2) { y = 1 + Math.floor(rand() * (GH - 2)); x = 0; dx = 1; }
        if (side === 3) { y = 1 + Math.floor(rand() * (GH - 2)); x = GW - 1; dx = -1; }
        if (g[y][x] === '#' && free(x + dx, y + dy)) return [x, y, dx, dy];
      }
      return null;
    }
    for (const beam of spec.beams) {
      const s = lanternSpot(); if (!s) return null;
      const [x, y, dx, dy] = s;
      g[y][x] = beam.color === 'blue' ? DCH(dx, dy).toLowerCase() : DCH(dx, dy);
      if (!walk(x, y, dx, dy, beam.len, beam.target, beam.splits || 0)) return null;
    }
    if (splitTargets.length) return null;
    if (spec.heart) {
      let hx, hy;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] === 'h') { hx = x; hy = y; }
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => rand() - 0.5);
      let ok = false;
      for (const [sdx, sdy] of dirs) {
        let x = hx, y = hy, dx = sdx, dy = sdy, since = 0, good = false;
        const placed = [];
        for (let step = 0; step < 30; step++) {
          const nx = x + dx, ny = y + dy;
          if (!inside(nx, ny)) { if (g[ny][nx] === '#' && step >= 3) { g[ny][nx] = DCH(-dx, -dy).toLowerCase(); good = true; } break; }
          if (g[ny][nx] !== '.') break;
          if (since >= 1 && free(nx, ny) && rand() < 0.4) {
            const [ex, ey] = rand() < 0.5 ? [dy, dx] : [-dy, -dx];
            g[ny][nx] = orientFor(dx, dy, ex, ey) ? '\\' : '/';
            placed.push([nx, ny]);
            x = nx; y = ny; dx = ex; dy = ey; since = 0; continue;
          }
          mark(nx, ny); x = nx; y = ny; since++;
        }
        if (good) { ok = true; turnCells.push(...placed); break; }
        for (const [px, py] of placed) g[py][px] = '.';
      }
      if (!ok) return null;
    }
    if (spec.gate) {
      const cands = [...path.entries()].filter(([, n]) => n === 1).map(([k]) => k.split(',').map(Number));
      if (!cands.length) return null;
      const [gx, gy] = cands[Math.floor(rand() * cands.length)];
      g[gy][gx] = 'g';
    }
    const turns = turnCells.filter(([x, y]) => '/\\'.includes(g[y][x])).sort(() => rand() - 0.5);
    for (let i = 0; i < (spec.f || 0) && i < turns.length; i++) { const [x, y] = turns[i]; g[y][x] = g[y][x] === '/' ? '1' : '2'; }
    const empties = [];
    for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) if (free(x, y)) empties.push([x, y]);
    empties.sort(() => rand() - 0.5);
    let k = 0;
    for (let i = 0; i < (spec.decoys || 0) && k < empties.length; i++) { const [x, y] = empties[k++]; g[y][x] = rand() < 0.5 ? '/' : '\\'; }
    for (let i = 0; i < (spec.rocks || 0) && k < empties.length; i++) { const [x, y] = empties[k++]; g[y][x] = '#'; }
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (rand() < 0.65) g[y][x] = { '/': '\\', '\\': '/', x: 'X', X: 'x' }[g[y][x]] || g[y][x];
    }
    return g.map((r) => r.join(''));
  }

  function evaluate(rows, spec) {
    const lv0 = parseLevel(rows);
    if (lv0.movable.length > 10) return null;
    const s = solveFull(lv0);
    if (!s.sols.length || s.sols.length > (spec.maxSols || 2) || s.par < spec.minPar) return null;
    if (spec.gate) {
      const lv2 = parseLevel(rows);
      lv2.movable.forEach((c, i) => { c.o = (s.sols[0] >> i) & 1; });
      if (!simulate(lv2).open) return null;
      for (const row of lv2.cells) for (const c of row) if (c.t === 'bell') c.t = 'rock';
      if (simulate(lv2).win) return null;
    }
    const lv3 = parseLevel(rows);
    lv3.movable.forEach((c, i) => { c.o = (s.sols[0] >> i) & 1; });
    const len = simulate(lv3).segs.length;
    return { rows, par: s.par, score: s.par * 4 + len - s.sols.length * 3 };
  }

  const DEFI_SPECS = {
    facile: [
      { beams: [{ color: 'amber', len: 7, target: 'a' }], rocks: 4, minPar: 2, maxSols: 1 },
      { beams: [{ color: 'amber', len: 5, target: 'a' }, { color: 'amber', len: 5, target: 'a' }], rocks: 4, minPar: 3, maxSols: 2 },
      { beams: [{ color: 'amber', len: 5, target: 'a', splits: 1 }], splitT: ['a'], rocks: 4, minPar: 2, maxSols: 2 },
    ],
    moyen: [
      { beams: [{ color: 'amber', len: 6, target: 'a', splits: 1 }], splitT: ['a'], f: 1, decoys: 1, rocks: 3, minPar: 3, maxSols: 2 },
      { beams: [{ color: 'amber', len: 6, target: 'a' }, { color: 'blue', len: 6, target: 'b' }], f: 1, rocks: 3, minPar: 3, maxSols: 2 },
      { beams: [{ color: 'amber', len: 6, target: 'a', splits: 1 }], splitT: ['o'], gate: 1, rocks: 4, minPar: 3, maxSols: 2 },
    ],
    difficile: [
      { beams: [{ color: 'blue', len: 6, target: 'b', splits: 1 }, { color: 'amber', len: 7, target: 'a' }], splitT: ['b'], f: 1, decoys: 1, rocks: 3, minPar: 4, maxSols: 4 },
      { beams: [{ color: 'amber', len: 7, target: 'h', splits: 1 }], splitT: ['a'], heart: 1, f: 1, rocks: 3, decoys: 1, minPar: 4, maxSols: 4 },
      { beams: [{ color: 'blue', len: 5, target: 'o' }, { color: 'amber', len: 6, target: 'a', splits: 1 }], splitT: ['a'], gate: 1, f: 1, rocks: 3, decoys: 1, minPar: 4, maxSols: 4 },
    ],
  };

  function seededRand(seed) {
    let s = seed >>> 0 || 1;
    return () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  function generatePuzzle(difficulty, seed) {
    const rand = seededRand(seed);
    const specs = DEFI_SPECS[difficulty];
    const spec = specs[Math.floor(rand() * specs.length)];
    let best = null, valid = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 6000) {
      const rows = attempt(spec, rand);
      if (!rows) continue;
      const e = evaluate(rows, spec);
      if (!e) continue;
      valid++;
      if (!best || e.score > best.score) best = e;
      if (valid >= 12 || (best && performance.now() - t0 > 1500)) break;
    }
    if (best) return best;
    // Filet de sécurité : une énigme de la campagne
    return LEVELS[Math.floor(rand() * LEVELS.length)];
  }

  // ---------- Sauvegarde ----------
  const SAVE_KEY = 'lanterne-ilia-v3';
  const fresh = () => ({
    best: {}, perfect: {}, chapters: [], intro: false, ending: false,
    eclats: 0, hints: 3, build: { forge: 0, four: 0, verre: 0, jardin: 0, obs: 0 }, style: 'laiton',
    stats: { solves: 0, noHint: 0, fast: 0, blue: 0, bells: 0, daily: 0, free: 0, hardNoHint: 0 },
    claimed: {}, notified: {}, dailyDone: '', freeSeed: 1,
  });
  let save = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw), f = fresh();
      save = Object.assign(f, s, { build: Object.assign(f.build, s.build), stats: Object.assign(f.stats, s.stats) });
    }
  } catch (e) { /* stockage indisponible : partie non sauvegardée */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };

  const solvedCount = () => Object.keys(save.best).length;
  const perfectCount = () => Object.keys(save.perfect).length;
  const buildLevels = () => Object.values(save.build).reduce((a, b) => a + b, 0);
  const isSolved = (i) => save.best[i] !== undefined;
  const isOpen = (i) => i === 0 || isSolved(i - 1) || isSolved(i);
  const chapterOf = (i) => { let c = 0; CHAPTERS.forEach((ch, k) => { if (i >= ch.start) c = k; }); return c; };
  const chapterEnd = (k) => (k + 1 < CHAPTERS.length ? CHAPTERS[k + 1].start : LEVELS.length);
  const chaptersDone = () => CHAPTERS.filter((ch, k) => { for (let i = ch.start; i < chapterEnd(k); i++) if (!isSolved(i)) return false; return true; }).length;
  const maxHints = () => 3 + save.build.forge;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dailySeed = () => Number(today().replace(/-/g, ''));

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  const dctx = dark.getContext('2d');
  const ui = {
    topbar: $('topbar'), bottombar: $('bottombar'), menu: $('menu'), story: $('story'), win: $('win'), loading: $('loading'),
    chapterLbl: $('lvl-chapter'), nameLbl: $('lvl-name'), moves: $('moves'), tip: $('tip'), toast: $('toast'),
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
  let lv = null, lvIndex = 0, sim = null, moves = 0, hintsUsed = 0, won = false, wonAt = 0, startedAt = 0;
  let puzzle = null; // { kind: 'story' | 'daily' | 'free', index, difficulty, rows, par }
  let cell = 40, ox = 0, oy = 0, time = 0;
  let hintCell = null, hintUntil = 0, cursor = -1, tab = 'enigmes';
  const motes = Array.from({ length: 34 }, (_, i) => ({ x: rnd(i), y: rnd(i + 40), s: rnd(i + 80) }));
  const skyStars = Array.from({ length: 50 }, (_, i) => ({ x: rnd(i), y: rnd(i + 99), t: rnd(i + 7) * 6 }));
  const curChapter = () => (puzzle && puzzle.kind === 'story' ? CHAPTERS[chapterOf(puzzle.index)] : DEFI_CHAPTER);

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

  function openPuzzle(p) {
    puzzle = p;
    lvIndex = p.kind === 'story' ? p.index : 100 + (p.seed % 997);
    lv = parseLevel(p.rows);
    moves = 0; hintsUsed = 0; won = false; hintCell = null; cursor = -1; startedAt = time;
    sim = simulate(lv);
    applySim(true);
    mode = 'board';
    ui.menu.hidden = true; ui.win.hidden = true; ui.loading.hidden = true;
    ui.topbar.hidden = false; ui.bottombar.hidden = false;
    if (p.kind === 'story') {
      const ch = chapterOf(p.index);
      ui.chapterLbl.textContent = `Ch. ${ch + 1} · ${CHAPTERS[ch].name}`;
      ui.nameLbl.textContent = `${p.index + 1}. ${NAMES[p.index]}`;
      ui.tip.textContent = TIPS[p.index] || DEFAULT_TIP;
    } else if (p.kind === 'daily') {
      ui.chapterLbl.textContent = 'Observatoire';
      ui.nameLbl.textContent = 'Énigme du jour';
      ui.tip.textContent = 'Une nouvelle énigme chaque jour, la même pour tout le monde.';
    } else {
      ui.chapterLbl.textContent = 'Défi libre';
      ui.nameLbl.textContent = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' }[p.difficulty];
      ui.tip.textContent = 'Énigme inventée pour toi à l\'instant. Minimum possible : ' + p.par + ' gestes.';
    }
    updateBars();
    layoutBoard();
  }

  function startStoryLevel(i) {
    const ch = chapterOf(i);
    openPuzzle({ kind: 'story', index: i, rows: LEVELS[i].rows, par: LEVELS[i].par });
    if (CHAPTERS[ch].story && CHAPTERS[ch].start === i && !save.chapters.includes(ch)) {
      save.chapters.push(ch); persist();
      playStory([{ kicker: `Chapitre ${ch + 1}`, title: CHAPTERS[ch].name, text: CHAPTERS[ch].story }], null);
    }
  }

  function startGenerated(kind, difficulty, seed) {
    ui.loading.hidden = false;
    // Laisse le message s'afficher avant le calcul
    setTimeout(() => {
      const g = generatePuzzle(difficulty, seed);
      openPuzzle({ kind, difficulty, seed, rows: g.rows, par: g.par });
    }, 60);
  }

  function updateBars() {
    ui.moves.textContent = moves;
    const hb = $('btn-hint');
    hb.textContent = `Indice (${save.hints})`;
    hb.disabled = won || save.hints <= 0;
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
    updateBars();
    if (sim.win) onWin();
  }

  function giveHint() {
    if (won || save.hints <= 0) return;
    const sols = solutions(lv);
    const cur = lv.movable.reduce((a, c, i) => a | (c.o << i), 0);
    let best = sols[0];
    for (const s of sols) if (popcount(s ^ cur) < popcount(best ^ cur)) best = s;
    const wrong = lv.movable.filter((c, i) => ((best >> i) & 1) !== c.o);
    if (!wrong.length) return;
    hintCell = wrong[0];
    hintUntil = time + 3;
    hintsUsed++;
    save.hints--; persist();
    updateBars();
    ui.tip.textContent = `Fais pivoter le cristal qui clignote. Encore ${wrong.length} cristal${wrong.length > 1 ? 'aux' : ''} à tourner.`;
  }

  // ---------- Victoire et récompenses ----------
  let lastRewards = [];
  function onWin() {
    won = true; wonAt = time;
    const secs = time - startedAt;
    const par = puzzle.par;
    const perfect = moves <= par && hintsUsed === 0;
    const rewards = [];
    const bakery = save.build.four * 2;
    const s = save.stats;
    s.solves++;
    if (!hintsUsed) s.noHint++;
    if (secs < 15) s.fast++;
    for (const row of lv.cells) for (const c of row) {
      if (c.t === 'seed' && c.need === 'blue') s.blue++;
      if (c.t === 'bell' && c.lit) s.bells++;
    }
    let firstPerfect = false;
    if (puzzle.kind === 'story') {
      const i = puzzle.index, first = !isSolved(i);
      const prev = save.best[i];
      save.best[i] = prev === undefined ? moves : Math.min(prev, moves);
      if (first) {
        rewards.push(['Graine réveillée', 8 + chapterOf(i) * 2]);
        if (bakery) rewards.push(['Pain de Lise', bakery]);
        const k = chapterOf(i);
        if (i === chapterEnd(k) - 1) rewards.push([`Chapitre « ${CHAPTERS[k].name} » terminé`, 25]);
      }
      if (perfect && !save.perfect[i]) {
        save.perfect[i] = true; firstPerfect = true;
        rewards.push(['Feuille parfaite', 5 + save.build.jardin * 5]);
      }
    } else if (puzzle.kind === 'daily') {
      if (save.dailyDone !== today()) {
        save.dailyDone = today(); s.daily++;
        rewards.push(['Énigme du jour', save.build.obs >= 3 ? 40 : 20]);
        if (bakery) rewards.push(['Pain de Lise', bakery]);
      }
    } else {
      s.free++;
      const base = { facile: 3, moyen: 5, difficile: 8 }[puzzle.difficulty];
      rewards.push([`Défi ${puzzle.difficulty}`, base]);
      if (bakery) rewards.push(['Pain de Lise', bakery]);
      if (puzzle.difficulty === 'difficile' && !hintsUsed) s.hardNoHint++;
      save.freeSeed++;
    }
    const gain = rewards.reduce((a, r) => a + r[1], 0);
    save.eclats += gain;
    const hintBefore = save.hints;
    save.hints = Math.min(maxHints(), save.hints + 1);
    lastRewards = rewards.slice();
    if (save.hints > hintBefore) lastRewards.push(['Indice rechargé', null]);
    persist();
    ui.tip.textContent = puzzle.kind === 'story' && puzzle.index === LEVELS.length - 1 ? 'Le Cœur-Graine s\'éveille…' : 'Les graines se réveillent !';
    updateBars();
    checkMissions();
    setTimeout(() => showWin(perfect, firstPerfect, secs), reduced ? 500 : 1300);
  }

  function showWin(perfect, firstPerfect, secs) {
    const par = puzzle.par;
    const last = puzzle.kind === 'story' && puzzle.index === LEVELS.length - 1;
    $('win-kicker').textContent = puzzle.kind === 'story' ? `Énigme ${puzzle.index + 1} sur ${LEVELS.length}` : ui.chapterLbl.textContent;
    $('win-title').textContent = last ? 'Le Cœur-Graine s\'éveille' : 'Les graines se réveillent';
    let stats = `<strong>${moves}</strong> geste${moves > 1 ? 's' : ''} (minimum ${par}), en ${Math.round(secs)} s.`;
    if (perfect) stats += ' <strong>Parfait !</strong>';
    else if (hintsUsed) stats += ` Sans indice et en ${par} gestes, c'est parfait.`;
    else stats += ` Refais-la en ${par} gestes pour la perfection.`;
    $('win-stats').innerHTML = stats;
    const list = $('win-rewards');
    list.innerHTML = '';
    for (const [label, n] of lastRewards) {
      const li = document.createElement('li');
      li.innerHTML = `<span></span><span>${n === null ? '+1' : `+${n} éclats`}</span>`;
      li.firstChild.textContent = label;
      list.appendChild(li);
    }
    if (!lastRewards.length) list.innerHTML = '<li><span>Déjà réussie : pas de nouvelle récompense.</span><span></span></li>';
    const next = $('win-next'), replay = $('win-replay');
    replay.hidden = false;
    if (puzzle.kind === 'story') { next.textContent = last ? 'Lire la fin' : 'Énigme suivante'; replay.textContent = 'Rejouer cette énigme'; }
    else if (puzzle.kind === 'daily') { next.textContent = 'Retour au village'; replay.hidden = true; }
    else { next.textContent = 'Nouveau défi'; replay.textContent = 'Retour au village'; }
    ui.win.hidden = false;
    next.focus();
  }

  function winNext() {
    ui.win.hidden = true;
    if (puzzle.kind === 'story') {
      if (puzzle.index === LEVELS.length - 1) {
        save.ending = true; persist(); checkMissions();
        playStory([STORY.ending], () => showVillage());
        return;
      }
      startStoryLevel(puzzle.index + 1);
    } else if (puzzle.kind === 'daily') showVillage('defis');
    else startGenerated('free', puzzle.difficulty, Date.now() % 1e9);
  }
  function winReplay() {
    ui.win.hidden = true;
    if (puzzle.kind === 'free') showVillage('defis');
    else openPuzzle(puzzle);
  }

  // ---------- Missions ----------
  function missionState(m) {
    const v = Math.min(m.goal, m.get());
    return { v, done: v >= m.goal, claimed: !!save.claimed[m.id] };
  }
  function checkMissions() {
    const newly = MISSIONS.filter((m) => missionState(m).done && !save.notified[m.id]);
    for (const m of newly) save.notified[m.id] = true;
    if (newly.length) {
      persist();
      showToast(newly.length === 1 ? `Mission accomplie : ${newly[0].text}. Va voir ${newly[0].who} dans l'onglet Missions.` : `${newly.length} missions accomplies ! Réclame tes récompenses dans l'onglet Missions.`);
    }
    updateBadge();
  }
  function updateBadge() {
    const n = MISSIONS.filter((m) => { const s = missionState(m); return s.done && !s.claimed; }).length;
    const b = $('mission-badge');
    b.hidden = !n; b.textContent = n;
  }
  let toastTimer = 0;
  function showToast(text) {
    const t = ui.toast;
    t.textContent = text;
    t.hidden = true; void t.offsetWidth; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
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

  // ---------- Village (menu) ----------
  function showVillage(toTab) {
    mode = 'village';
    lv = null;
    ui.topbar.hidden = true; ui.bottombar.hidden = true; ui.win.hidden = true; ui.loading.hidden = true;
    ui.menu.hidden = false;
    if (toTab) tab = toTab;
    renderMenu();
    checkMissions();
  }
  function nextToPlay() { for (let i = 0; i < LEVELS.length; i++) if (!isSolved(i)) return i; return -1; }

  function renderMenu() {
    $('eclats').textContent = save.eclats;
    $('hints').textContent = `${save.hints}/${maxHints()}`;
    for (const b of document.querySelectorAll('.tabs button')) {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on);
      $('tab-' + b.dataset.tab).hidden = !on;
    }
    ({ enigmes: renderEnigmes, village: renderBuildings, missions: renderMissions, defis: renderDefis })[tab]();
    updateBadge();
  }

  function renderEnigmes() {
    const n = solvedCount(), next = nextToPlay();
    ui.oda.textContent = save.ending ? ODA_END : ODA[chapterOf(Math.max(0, next))];
    ui.progress.innerHTML = `Graines réveillées : <strong>${n}</strong> sur ${LEVELS.length} · Feuilles parfaites : <strong>${perfectCount()}</strong>`;
    const play = $('btn-play');
    play.textContent = next === -1 ? 'Rejouer la première énigme' : n === 0 ? 'Commencer' : `Continuer : énigme ${next + 1}`;
    play.onclick = () => startStoryLevel(next === -1 ? 0 : next);
    ui.chapters.innerHTML = '';
    CHAPTERS.forEach((ch, k) => {
      const end = chapterEnd(k);
      const block = document.createElement('div');
      block.className = 'chapter-block';
      let done = 0;
      for (let i = ch.start; i < end; i++) if (isSolved(i)) done++;
      block.innerHTML = `<h2>${ch.name}<small>${done}/${end - ch.start}</small></h2><div class="levels"></div>`;
      const row = block.querySelector('.levels');
      for (let i = ch.start; i < end; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lvl' + (isSolved(i) ? ' done' : '') + (save.perfect[i] ? ' perfect' : '');
        b.textContent = i + 1;
        b.disabled = !isOpen(i);
        b.setAttribute('aria-label', `Énigme ${i + 1}, ${NAMES[i]}${isSolved(i) ? ', réussie' : ''}${save.perfect[i] ? ' parfaitement' : ''}${b.disabled ? ', pas encore ouverte' : ''}`);
        b.addEventListener('click', () => startStoryLevel(i));
        row.appendChild(b);
      }
      ui.chapters.appendChild(block);
    });
    const legend = document.createElement('p');
    legend.className = 'legend';
    legend.textContent = 'Feuille verte : énigme réussie en un minimum de gestes, sans indice.';
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

  function renderBuildings() {
    const box = $('buildings');
    box.innerHTML = '';
    for (const b of BUILDINGS) {
      const l = save.build[b.id], maxed = l >= b.costs.length, cost = maxed ? 0 : b.costs[l];
      const d = document.createElement('div');
      d.className = 'building';
      d.innerHTML = `<h3>${b.name} <small>· ${b.who}</small></h3>
        <p>${b.perk(l)}${maxed ? '' : `<br>Ensuite : ${b.perk(l + 1)}`}</p>
        <div class="pips">${b.costs.map((_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>
        <button type="button" id="build-${b.id}" ${maxed || save.eclats < cost ? 'disabled' : ''}>${maxed ? 'Restauré' : `${l ? 'Améliorer' : 'Restaurer'} · ${cost}`}</button>`;
      d.querySelector('button').addEventListener('click', () => {
        if (maxed || save.eclats < cost) return;
        save.eclats -= cost;
        save.build[b.id]++;
        if (b.id === 'forge') save.hints = Math.min(maxHints(), save.hints + 1);
        persist();
        showToast(`${b.name} : ${b.perk(save.build[b.id])}.`);
        checkMissions();
        renderMenu();
        const again = $(`build-${b.id}`);
        (again.disabled ? $('tabbtn-village') : again).focus();
      });
      box.appendChild(d);
    }
    const st = $('styles');
    st.innerHTML = '';
    for (const [id, s] of Object.entries(STYLES)) {
      const ok = save.build.verre >= s.need;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.disabled = !ok;
      btn.setAttribute('aria-pressed', save.style === id);
      btn.innerHTML = `<i style="background:${id === 'aurore' ? 'linear-gradient(90deg,#7fd6c4,#b48cff,#ffb36b)' : s.frame}"></i>${s.name}${ok ? '' : ` · verrier niv. ${s.need}`}`;
      btn.addEventListener('click', () => { save.style = id; persist(); renderMenu(); });
      st.appendChild(btn);
    }
  }

  function renderMissions() {
    const box = $('missions');
    box.innerHTML = '';
    const order = MISSIONS.map((m) => ({ m, s: missionState(m) }))
      .sort((a, b) => (a.s.claimed - b.s.claimed) || (b.s.done - a.s.done));
    for (const { m, s } of order) {
      const li = document.createElement('li');
      li.className = 'mission' + (s.done && !s.claimed ? ' ready' : '') + (s.claimed ? ' claimed' : '');
      li.innerHTML = `<span class="who">${m.who}</span><span class="what"></span>
        <div class="bar"><i style="width:${(s.v / m.goal) * 100}%"></i></div>
        <button type="button" ${s.done && !s.claimed ? '' : 'disabled'}>${s.claimed ? 'Reçue' : `${s.v}/${m.goal} · +${m.reward}`}</button>`;
      li.querySelector('.what').textContent = m.text;
      li.querySelector('button').addEventListener('click', () => {
        if (!missionState(m).done || save.claimed[m.id]) return;
        save.claimed[m.id] = true;
        save.eclats += m.reward;
        persist();
        showToast(`${m.who} te remercie : +${m.reward} éclats.`);
        renderMenu();
        $('tabbtn-missions').focus();
      });
      box.appendChild(li);
    }
  }

  function renderDefis() {
    const daily = $('daily'), free = $('free');
    const obs = save.build.obs;
    const doneToday = save.dailyDone === today();
    daily.innerHTML = `<h2>Énigme du jour</h2><p></p>`;
    const dp = daily.querySelector('p');
    if (!obs) dp.textContent = "Restaure l'Observatoire (onglet Village) pour recevoir une nouvelle énigme chaque jour.";
    else {
      dp.textContent = doneToday ? 'Réussie aujourd\'hui. Reviens demain pour une nouvelle énigme.' : `Une énigme moyenne ou difficile, nouvelle chaque jour. Récompense : ${obs >= 3 ? 40 : 20} éclats.`;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-main';
      b.textContent = doneToday ? 'Rejouer l\'énigme du jour' : 'Jouer l\'énigme du jour';
      b.addEventListener('click', () => startGenerated('daily', dailySeed() % 2 ? 'difficile' : 'moyen', dailySeed()));
      daily.appendChild(b);
    }
    free.innerHTML = `<h2>Défis libres</h2><p>Des énigmes inventées à l'instant, à l'infini. Facile : 3 éclats, moyen : 5, difficile : 8.</p><div class="row"></div>`;
    const row = free.querySelector('.row');
    const openFree = chaptersDone() >= 1;
    for (const [d, label] of [['facile', 'Facile'], ['moyen', 'Moyen'], ['difficile', 'Difficile']]) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      const locked = !openFree || (d === 'difficile' && obs < 2);
      b.disabled = locked;
      b.textContent = label;
      b.addEventListener('click', () => startGenerated('free', d, (save.freeSeed * 7919 + Date.now()) % 1e9));
      row.appendChild(b);
    }
    if (!openFree) free.querySelector('p').textContent = 'Termine le chapitre « Le Terreau » pour débloquer les défis libres.';
    else if (obs < 2) free.querySelector('p').textContent += ' Les défis difficiles s\'ouvrent avec l\'Observatoire niveau 2.';
    $('defi-stats').innerHTML = `Défis libres réussis : <strong>${save.stats.free}</strong> · Énigmes du jour : <strong>${save.stats.daily}</strong>`;
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
    const frameCol = blue ? '#4b5d7a' : STYLES[save.style].frame;
    ctx.fillStyle = frameCol;
    ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, -9); ctx.lineTo(5, -14); ctx.lineTo(-5, -14); ctx.fill();
    ctx.fillStyle = blue ? 'rgba(160,210,255,0.45)' : 'rgba(255,214,140,0.45)'; ctx.fillRect(-7, -9, 14, 16);
    ctx.fillStyle = blue ? '#e6f5ff' : '#fff1c2';
    ctx.beginPath(); ctx.ellipse(0, 0, 2.8 * flick, 5.5 * flick, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = blue ? '#7fc8ff' : '#f2a63b';
    ctx.beginPath(); ctx.ellipse(0, 2, 2, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = frameCol; ctx.fillRect(-9, 7, 18, 4);
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
  const cellFloor = () => curChapter().floor;

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
        ctx.strokeStyle = sparkColor(col);
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
    const ch = curChapter();
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


  // Bâtiment : en ruine au niveau 0, puis de plus en plus vivant
  function drawBuilding(kind, x, w, h, gy, level, dawn) {
    const body = level ? (dawn ? '#3b2c3a' : '#1f1628') : '#141017';
    const roof = level ? (dawn ? '#5a3a3a' : '#2c1c26') : '#1a1318';
    const lightCol = { forge: 'rgba(255,120,50,', four: 'rgba(242,166,59,', verre: 'rgba(127,214,196,', obs: 'rgba(180,160,255,' }[kind];
    if (kind === 'obs') {
      // tour de l'observatoire
      ctx.fillStyle = body; ctx.fillRect(x, gy - h, w, h);
      if (level) {
        ctx.fillStyle = roof; ctx.beginPath(); ctx.arc(x + w / 2, gy - h, w / 2 + 3, Math.PI, 0); ctx.fill();
        if (level >= 2) { ctx.strokeStyle = '#8a7a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, gy - h - 6); ctx.lineTo(x + w / 2 + 14, gy - h - 16); ctx.stroke(); }
        if (level >= 3 && !reduced) {
          ctx.strokeStyle = `rgba(200,190,255,${0.25 + 0.15 * Math.sin(time * 2)})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + w / 2 + 14, gy - h - 16); ctx.lineTo(x + w / 2 + 60, gy - h - 90); ctx.stroke();
        }
      } else {
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 2, gy - h); ctx.lineTo(x + w * 0.4, gy - h - 8); ctx.lineTo(x + w * 0.5, gy - h); ctx.fill();
      }
    } else {
      ctx.fillStyle = body; ctx.fillRect(x, gy - h, w, h);
      ctx.fillStyle = roof;
      if (level) {
        ctx.beginPath(); ctx.moveTo(x - 4, gy - h); ctx.lineTo(x + w / 2, gy - h - 18); ctx.lineTo(x + w + 4, gy - h); ctx.fill();
      } else {
        // toit effondré
        ctx.beginPath(); ctx.moveTo(x - 3, gy - h); ctx.lineTo(x + w * 0.35, gy - h - 12); ctx.lineTo(x + w * 0.45, gy - h + 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w * 0.6, gy - h + 3); ctx.lineTo(x + w * 0.8, gy - h - 6); ctx.lineTo(x + w + 3, gy - h + 2); ctx.fill();
      }
      if (level >= 2 && !reduced) {
        // fumée de cheminée
        ctx.fillStyle = roof; ctx.fillRect(x + w * 0.7, gy - h - 16, 5, 10);
        for (let k = 0; k < 3; k++) {
          const ph = (time * 0.3 + k / 3) % 1;
          ctx.fillStyle = `rgba(200,190,190,${0.25 * (1 - ph)})`;
          circle(x + w * 0.72 + 2 + Math.sin(ph * 6 + k) * 4, gy - h - 18 - ph * 30, 3 + ph * 5);
        }
      }
    }
    const wx = x + w / 2 - 4, wy = kind === 'obs' ? gy - h * 0.6 : gy - h / 2 - 4;
    if (level && lightCol) {
      glow(wx + 4, wy + 4, 16 + level * 4, lightCol + (0.25 + level * 0.08) + ')');
      ctx.fillStyle = lightCol + '1)'; ctx.fillRect(wx, wy, 8, 8);
      if (level >= 3) { glow(x + w + 2, gy - h * 0.8, 10, lightCol + '0.6)'); ctx.fillStyle = lightCol + '1)'; circle(x + w + 2, gy - h * 0.8, 2.5); }
    } else {
      // fenêtre condamnée
      ctx.strokeStyle = '#4a3322'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 8, wy + 8); ctx.moveTo(wx + 8, wy); ctx.lineTo(wx, wy + 8); ctx.stroke();
    }
  }

  function drawVillage() {
    const gy = Math.round(H * 0.38);
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

    const B = save.build;
    drawBuilding('obs', W * 0.9, 20, 66, gy, B.obs, dawn);
    drawTree(W * 0.78, gy, Math.min(220, H * 0.3), dawn ? 1 : (solvedCount() / LEVELS.length) * 0.85, dawn);
    drawBuilding('forge', W * 0.02, 32, 28, gy, B.forge, dawn);
    drawBuilding('four', W * 0.13, 36, 34, gy, B.four, dawn);
    drawBuilding('verre', W * 0.245, 28, 24, gy, B.verre, dawn);

    // Sous terre : les racines, et une lueur par graine réveillée
    const soil = ctx.createLinearGradient(0, gy, 0, H);
    soil.addColorStop(0, '#24170f'); soil.addColorStop(1, '#0d0806');
    ctx.fillStyle = soil; ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = '#3a2618'; ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
    for (let i = 0; i < LEVELS.length; i++) {
      const a = (i / (LEVELS.length - 1)) * Math.PI;
      const ex = W * 0.78 + Math.cos(Math.PI - a) * W * 0.6, ey = gy + 24 + Math.sin(a) * H * 0.3 + rnd(i) * 26;
      ctx.beginPath(); ctx.moveTo(W * 0.78, gy); ctx.quadraticCurveTo(W * 0.78 + (ex - W * 0.78) * 0.3, ey, ex, ey); ctx.stroke();
      if (isSolved(i)) { glow(ex, ey, 14, 'rgba(242,190,90,0.5)'); ctx.fillStyle = save.perfect[i] ? '#b6f08f' : '#ffd98a'; circle(ex, ey, 2.6); }
    }

    // Herbe et fleurs du jardin d'Oda
    ctx.fillStyle = dawn ? '#4f6a34' : '#233021';
    ctx.fillRect(0, gy - 4, W, 8);
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 3; x < W; x += 7) { ctx.moveTo(x, gy - 3); ctx.lineTo(x + 2, gy - 8 - rnd(x) * 5); }
    ctx.stroke();
    const flowers = B.jardin * 9;
    for (let i = 0; i < flowers; i++) {
      const fx = rnd(i * 3 + 1) * W, fy = gy - 5 - rnd(i * 5) * 4;
      ctx.fillStyle = ['#ff9fcb', '#ffd98a', '#b48cff', '#ffffff'][i % 4];
      circle(fx, fy, 2.2);
    }
    if (B.jardin >= 3 && !reduced) {
      for (let i = 0; i < 8; i++) {
        const fx = (rnd(i + 30) * W + Math.sin(time * 0.7 + i) * 20), fy = gy - 20 - rnd(i + 60) * 40 + Math.sin(time + i * 2) * 8;
        glow(fx, fy, 8, `rgba(216,255,122,${0.4 + 0.3 * Math.sin(time * 4 + i)})`);
      }
    }

    // Le puits
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

    // Ilia, sa lanterne, et Oda
    const ix = c + ow / 2 + 28;
    drawPerson(ix, gy - 3, '#2f5d50', '#c8452f', '#3a2418', 1);
    glow(ix + 11, gy - 16, 22, 'rgba(242,166,59,0.5)');
    ctx.fillStyle = STYLES[save.style].frame; ctx.fillRect(ix + 7, gy - 22, 8, 2); ctx.fillRect(ix + 7, gy - 12, 8, 2);
    ctx.fillStyle = '#f2c46b'; ctx.fillRect(ix + 8, gy - 20, 6, 8);
    drawPerson(ix + 26, gy - 3, '#4a3b52', '#bda98a', '#d9d2c5', 0.92);
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(ix + 36, gy - 30, 2, 28);
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
  const busy = () => !ui.story.hidden || !ui.win.hidden || !ui.loading.hidden;
  canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'board' || busy()) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - ox) / cell), y = Math.floor((e.clientY - rect.top - oy) / cell);
    const c = lv.cells[y] && lv.cells[y][x];
    cursor = -1;
    if (c) rotate(c);
  });
  window.addEventListener('keydown', (e) => {
    if (mode !== 'board' || busy()) return;
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
        const vx = c.x - cur.x, vy = c.y - cur.y, along = vx * dx + vy * dy;
        if (along <= 0) return;
        const d = along + Math.abs(vx * dy - vy * dx) * 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) cursor = best;
    } else if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0) {
      e.preventDefault(); rotate(list[cursor]);
    }
  });

  for (const b of document.querySelectorAll('.tabs button')) {
    b.addEventListener('click', () => { tab = b.dataset.tab; renderMenu(); });
  }
  $('btn-map').addEventListener('click', () => showVillage());
  $('btn-restart').addEventListener('click', () => openPuzzle(puzzle));
  $('btn-hint').addEventListener('click', giveHint);
  $('story-next').addEventListener('click', nextStory);
  $('win-next').addEventListener('click', winNext);
  $('win-replay').addEventListener('click', winReplay);

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
    tab = 'enigmes';
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
