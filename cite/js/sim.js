// =====================================================================
// Aurore : simulation de la ville (sans affichage, testable avec Node)
// =====================================================================
import {
  N, TICKS_PER_MONTH, MONTHS, SEASON_OF_MONTH, DIFFICULTY, ZONES, LEVEL_LAND, LEVEL_MILESTONE,
  ROADS, BUILDINGS, MILESTONES, TECHS, POLICIES, QUESTS, NEWS,
} from './data.js';

export const START_YEAR = 2030;
export const START_MONTH = 2; // les parties commencent en mars
const T = N * N;
const idx = (x, y) => y * N + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------------
// Hasard reproductible
// ---------------------------------------------------------------------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash01 = (n) => (((n * 2654435761) >>> 0) % 100000) / 100000;

function noise2(seed) {
  const r = rng(seed);
  const G = 16, g = [];
  for (let i = 0; i < (G + 1) * (G + 1); i++) g.push(r());
  const at = (i, j) => g[(j % (G + 1)) * (G + 1) + (i % (G + 1))];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// ---------------------------------------------------------------------
// Nouvelle partie : terrain, forêts, route d'accès, hôtel de ville
// terrain : 0 herbe, 1 eau, 2 sable
// ---------------------------------------------------------------------
export function createState({ name = 'Aurore', seed = Date.now() % 1e9, map = 'vallee', difficulty = 'normal' } = {}) {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const s = {
    v: 1, name, seed, map, difficulty, money: d.money, tick: 0,
    terrain: new Uint8Array(T), trees: new Uint8Array(T), road: new Uint8Array(T), zone: new Uint8Array(T),
    buildings: [], nextId: 1,
    taxes: { 1: 9, 2: 9, 3: 9, 4: 9 },
    funding: { energie: 100, eau: 100, dechets: 100, securite: 100, sante: 100, education: 100, loisirs: 100, transports: 100, merveilles: 100 },
    policies: {}, techs: {}, research: { cur: null, pts: 0 },
    loans: [], milestone: 0, quests: {}, profitStreak: 0,
    history: [], mods: [], log: [], demand: { 1: 0.5, 2: 0.4, 3: 0.4, 4: 0 },
    lastMonth: null, stats: { fires: 0, built: 0 }, createdAt: Date.now(),
  };
  generateTerrain(s);
  prepare(s);
  // route d'accès depuis le bord ouest et hôtel de ville
  const y = findStartRow(s);
  for (let x = 0; x < 20; x++) { const i = idx(x, y); if (s.terrain[i] !== 1) { s.road[i] = 1; s.trees[i] = 0; } }
  for (let dy = -3; dy <= 4; dy++) for (let dx = 9; dx <= 16; dx++) if (inMap(dx, y + dy)) s.trees[idx(dx, y + dy)] = 0;
  addBuilding(s, 'mairie', 11, y + 1, 1);
  log(s, `Bienvenue à ${name} ! Trace des routes et des zones pour accueillir tes premiers habitants.`, 'story');
  prepare(s);
  return s;
}

function findStartRow(s) {
  // une ligne sans eau sur les 20 premières colonnes, proche du centre
  for (let k = 0; k < N / 2; k++) {
    for (const y of [N / 2 + k, N / 2 - k]) {
      if (y < 4 || y > N - 6) continue;
      let ok = true;
      for (let x = 0; x < 20 && ok; x++) for (let dy = 0; dy <= 3; dy++) if (s.terrain[idx(x, y + dy)] === 1) ok = false;
      if (ok) return y;
    }
  }
  return N / 2;
}

function generateTerrain(s) {
  const n1 = noise2(s.seed), n2 = noise2(s.seed + 7), r = rng(s.seed + 3);
  const { terrain, trees } = s;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y);
    let water = false;
    if (s.map === 'vallee') {
      const cx = N * 0.66 + Math.sin(y * 0.12 + s.seed % 10) * 6 + (n1(x / 6, y / 6) - 0.5) * 6;
      const w = 1.6 + n2(y / 5, 3) * 1.4;
      water = Math.abs(x - cx) < w;
    } else if (s.map === 'cote') {
      const shore = N - 9 - n1(1, y / 5) * 5 - Math.max(0, 6 - Math.abs(y - N * 0.35) * 0.6);
      water = x > shore;
    } else {
      const lakes = [[N * 0.62, N * 0.25, 5.5], [N * 0.78, N * 0.7, 6.5], [N * 0.38, N * 0.82, 4.5]];
      for (const [lx, ly, lr] of lakes) {
        const dd = Math.hypot(x - lx, y - ly) + (n1(x / 4, y / 4) - 0.5) * 4;
        if (dd < lr) water = true;
      }
    }
    terrain[i] = water ? 1 : 0;
  }
  // sable au bord de l'eau (côte et lacs)
  if (s.map !== 'vallee') {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y);
      if (terrain[i] !== 0) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (inMap(x + dx, y + dy) && terrain[idx(x + dx, y + dy)] === 1 && (s.map === 'cote' || r() < 0.6)) terrain[i] = 2;
      }
    }
  }
  // forêts
  const forest = s.map === 'lacs' ? 0.52 : 0.58;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = idx(x, y);
    if (terrain[i] === 1) continue;
    const f = n2(x / 5 + 20, y / 5 + 20);
    if (f > forest && r() < 0.85) trees[i] = 1 + Math.floor(r() * 3);
    else if (r() < 0.02) trees[i] = 1 + Math.floor(r() * 3);
  }
}

// ---------------------------------------------------------------------
// Index et champs calculés (non sauvegardés)
// ---------------------------------------------------------------------
export function prepare(s) {
  s.bld = new Int32Array(T);
  s.byId = new Map();
  for (const b of s.buildings) {
    s.byId.set(b.id, b);
    const sz = sizeOf(b);
    for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) s.bld[idx(b.x + dx, b.y + dy)] = b.id;
  }
  s.f = s.f || {
    police: new Float32Array(T), fire: new Float32Array(T), health: new Float32Array(T), edu: new Float32Array(T),
    leisure: new Float32Array(T), transit: new Float32Array(T), landBonus: new Float32Array(T), pollution: new Float32Array(T),
    noise: new Float32Array(T), land: new Float32Array(T), traffic: new Float32Array(T), happy: new Float32Array(T),
    waterDist: new Uint8Array(T), roadDist: new Uint8Array(T), treeNear: new Uint8Array(T),
  };
  s.dirty = { buildings: true, terrain: true, fields: true };
  computeWaterDist(s);
  computeRoadDist(s);
  computeTrees(s);
  measure(s);
  computeFields(s);
  measure(s);
}

export const sizeOf = (b) => (b.type === 'Z' ? 1 : BUILDINGS[b.type].size);

function computeWaterDist(s) {
  const d = s.f.waterDist;
  d.fill(9);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (s.terrain[idx(x, y)] !== 1) continue;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      if (!inMap(x + dx, y + dy)) continue;
      const i = idx(x + dx, y + dy), dist = Math.max(Math.abs(dx), Math.abs(dy));
      if (dist < d[i]) d[i] = dist;
    }
  }
}
export function computeRoadDist(s) {
  // distance (pas orthogonaux) jusqu'à la route la plus proche, plafonnée à 9
  const d = s.f.roadDist;
  d.fill(9);
  const q = [];
  for (let i = 0; i < T; i++) if (s.road[i]) { d[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % N, y = (i / N) | 0, nd = d[i] + 1;
    if (nd > 4) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inMap(x + dx, y + dy)) continue;
      const j = idx(x + dx, y + dy);
      if (s.terrain[j] === 1 || d[j] <= nd) continue;
      d[j] = nd; q.push(j);
    }
  }
}
function computeTrees(s) {
  const t = s.f.treeNear;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let c = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(x + dx, y + dy) && s.trees[idx(x + dx, y + dy)]) c++;
    t[idx(x, y)] = c;
  }
}

// ---------------------------------------------------------------------
// Petits utilitaires d'état
// ---------------------------------------------------------------------
export function dateOf(tick) {
  const m = Math.floor(tick / TICKS_PER_MONTH) + START_MONTH;
  return { day: (tick % TICKS_PER_MONTH) + 1, month: m % 12, year: START_YEAR + Math.floor(m / 12), season: SEASON_OF_MONTH[m % 12] };
}
export function dateText(tick) { const d = dateOf(tick); return `${d.day} ${MONTHS[d.month]} ${d.year}`; }
export function log(s, text, kind = 'info') {
  s.log.unshift({ t: s.tick, text, kind });
  if (s.log.length > 80) s.log.length = 80;
  (s.events || (s.events = [])).push({ type: 'log', text, kind });
}
const emit = (s, e) => (s.events || (s.events = [])).push(e);
const has = (s, key) => !!s.techs[key];
const pol = (s, key) => !!s.policies[key];
const diff = (s) => DIFFICULTY[s.difficulty] || DIFFICULTY.normal;
export const fundOf = (s, dept) => (dept ? s.funding[dept] / 100 : 1);
const modActive = (s, k) => s.mods.some((m) => m.k === k && m.until > s.tick);

export function isUnlocked(s, key) {
  const d = BUILDINGS[key];
  if (!d || d.fixed) return false;
  if (d.tech && !has(s, d.tech)) return false;
  if (d.ms && s.milestone < d.ms) return false;
  if (d.wonder && s.buildings.some((b) => b.type === key)) return false;
  return true;
}
export function zoneUnlocked(s, z) { return !ZONES[z].tech || has(s, ZONES[z].tech); }
export function roadUnlocked(s, k) { return !ROADS[k].tech || has(s, ROADS[k].tech); }
export const costOf = (s, base) => Math.round(base * diff(s).cost);
export function maxLevel(s) {
  let m = 1;
  for (let l = 2; l <= 4; l++) if (s.milestone >= LEVEL_MILESTONE[l]) m = l;
  if (m === 4 && !has(s, 'gratteciel')) m = 3;
  return m;
}

function addBuilding(s, type, x, y, lvl, extra) {
  const b = { id: s.nextId++, type, x, y, lvl, v: Math.floor(Math.random() * 3), cons: 0, ...extra };
  s.buildings.push(b);
  s.byId.set(b.id, b);
  const sz = sizeOf(b);
  for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
    const i = idx(x + dx, y + dy);
    s.bld[i] = b.id; s.trees[i] = 0;
  }
  s.dirty.buildings = true; s.dirty.terrain = true; s.fieldsStale = true;
  return b;
}
function removeBuilding(s, b, why) {
  const sz = sizeOf(b);
  for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
    const i = idx(b.x + dx, b.y + dy);
    if (s.bld[i] === b.id) s.bld[i] = 0;
  }
  s.buildings.splice(s.buildings.indexOf(b), 1);
  s.byId.delete(b.id);
  s.dirty.buildings = true; s.fieldsStale = true;
  emit(s, { type: 'removed', b, why });
}

// ---------------------------------------------------------------------
// Actions du joueur. Chacune renvoie { ok, cost, msg }
// ---------------------------------------------------------------------
export function linePath(x0, y0, x1, y1) {
  // chemin en L : d'abord la plus grande direction
  const pts = [];
  const horizFirst = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
  let x = x0, y = y0;
  pts.push([x, y]);
  const stepX = () => { while (x !== x1) { x += Math.sign(x1 - x); pts.push([x, y]); } };
  const stepY = () => { while (y !== y1) { y += Math.sign(y1 - y); pts.push([x, y]); } };
  if (horizFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
  return pts;
}
export function rectTiles(x0, y0, x1, y1) {
  const out = [];
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (inMap(x, y)) out.push([x, y]);
  return out;
}

export function planRoad(s, pts, kind) {
  let cost = 0, n = 0;
  const unit = costOf(s, ROADS[kind].cost);
  for (const [x, y] of pts) {
    const i = idx(x, y);
    if (s.terrain[i] === 1) { cost += unit * 4; n++; continue; } // pont
    if (s.bld[i] || s.road[i] === kind) continue;
    cost += unit + (s.trees[i] ? 3 : 0); n++;
  }
  return { cost, n };
}
export function buildRoad(s, pts, kind) {
  if (!roadUnlocked(s, kind)) return { ok: false, msg: 'Pas encore débloqué.' };
  const { cost, n } = planRoad(s, pts, kind);
  if (!n) return { ok: false, msg: 'Rien à construire ici.' };
  if (cost > s.money) return { ok: false, msg: 'Pas assez d\'argent.' };
  for (const [x, y] of pts) {
    const i = idx(x, y);
    if (s.bld[i]) continue;
    s.road[i] = kind; s.trees[i] = 0; s.zone[i] = 0;
  }
  s.money -= cost;
  afterMapChange(s);
  return { ok: true, cost };
}
export function planZone(s, tiles, z) {
  let n = 0;
  for (const [x, y] of tiles) { const i = idx(x, y); if (s.terrain[i] !== 1 && !s.road[i] && (!s.bld[i] || s.byId.get(s.bld[i]).type === 'Z') && s.zone[i] !== z) n++; }
  return { n, cost: n * costOf(s, z ? 2 : 0) };
}
export function applyZone(s, tiles, z) {
  if (z && !zoneUnlocked(s, z)) return { ok: false, msg: 'Pas encore débloqué.' };
  const { n, cost } = planZone(s, tiles, z);
  if (!n) return { ok: false, msg: 'Rien à changer ici.' };
  if (cost > s.money) return { ok: false, msg: 'Pas assez d\'argent.' };
  for (const [x, y] of tiles) {
    const i = idx(x, y);
    if (s.terrain[i] === 1 || s.road[i]) continue;
    const b = s.bld[i] && s.byId.get(s.bld[i]);
    if (b && b.type !== 'Z') continue;
    if (s.zone[i] === z) continue;
    if (b) removeBuilding(s, b, 'zone');
    s.zone[i] = z;
  }
  s.money -= cost;
  afterMapChange(s);
  return { ok: true, cost };
}
export function planBulldoze(s, tiles) {
  let cost = 0, n = 0;
  const seen = new Set();
  for (const [x, y] of tiles) {
    const i = idx(x, y);
    if (s.bld[i]) {
      const b = s.byId.get(s.bld[i]);
      if (seen.has(b.id) || (BUILDINGS[b.type] && BUILDINGS[b.type].fixed)) continue;
      seen.add(b.id); n++;
      cost += b.type === 'Z' ? 10 * b.lvl : 50;
    } else if (s.road[i]) { n++; cost += 5; } else if (s.trees[i]) { n++; cost += 3; } else if (s.zone[i]) n++;
  }
  return { cost: costOf(s, cost), n };
}
export function bulldoze(s, tiles) {
  const { cost, n } = planBulldoze(s, tiles);
  if (!n) return { ok: false, msg: 'Rien à démolir ici.' };
  if (cost > s.money) return { ok: false, msg: 'Pas assez d\'argent.' };
  for (const [x, y] of tiles) {
    const i = idx(x, y);
    if (s.bld[i]) {
      const b = s.byId.get(s.bld[i]);
      if (BUILDINGS[b.type] && BUILDINGS[b.type].fixed) continue;
      removeBuilding(s, b, 'bulldoze');
      if (b.type === 'Z') s.zone[i] = 0;
    } else if (s.road[i]) s.road[i] = 0;
    else if (s.trees[i]) s.trees[i] = 0;
    else s.zone[i] = 0;
  }
  s.money -= cost;
  afterMapChange(s);
  return { ok: true, cost };
}
export function planTrees(s, tiles) {
  let n = 0;
  for (const [x, y] of tiles) { const i = idx(x, y); if (s.terrain[i] !== 1 && !s.road[i] && !s.bld[i] && !s.trees[i]) n++; }
  return { n, cost: n * costOf(s, 8) };
}
export function plantTrees(s, tiles) {
  const { n, cost } = planTrees(s, tiles);
  if (!n) return { ok: false, msg: 'Pas de place libre ici.' };
  if (cost > s.money) return { ok: false, msg: 'Pas assez d\'argent.' };
  for (const [x, y] of tiles) { const i = idx(x, y); if (s.terrain[i] !== 1 && !s.road[i] && !s.bld[i] && !s.trees[i]) s.trees[i] = 1 + Math.floor(Math.random() * 3); }
  s.money -= cost;
  afterMapChange(s);
  return { ok: true, cost };
}
function afterMapChange(s) {
  computeRoadDist(s); computeTrees(s);
  s.dirty.terrain = true; s.dirty.buildings = true; s.dirty.zoneList = true; s.fieldsStale = true;
  measure(s);
}

export function canPlace(s, type, x, y) {
  const d = BUILDINGS[type];
  if (!isUnlocked(s, type)) return { ok: false, msg: 'Pas encore débloqué.' };
  const sz = d.size;
  let nearWater = false, nearRoad = false;
  for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
    const tx = x + dx, ty = y + dy;
    if (!inMap(tx, ty)) return { ok: false, msg: 'En dehors de la carte.' };
    const i = idx(tx, ty);
    if (s.terrain[i] === 1) return { ok: false, msg: 'Impossible sur l\'eau.' };
    if (s.road[i]) return { ok: false, msg: 'Il y a une route.' };
    if (s.bld[i]) {
      const b = s.byId.get(s.bld[i]);
      if (b.type !== 'Z') return { ok: false, msg: 'La place est prise.' };
    }
    if (s.f.waterDist[i] <= 1) nearWater = true;
    if (s.f.roadDist[i] <= 1) nearRoad = true;
  }
  if (d.nearWater && !nearWater) return { ok: false, msg: 'Doit toucher l\'eau.' };
  if (!nearRoad && !['eolienne', 'parc', 'pompe'].includes(type)) return { ok: false, msg: 'Doit toucher une route.' };
  const cost = costOf(s, d.cost);
  if (cost > s.money) return { ok: false, msg: 'Pas assez d\'argent.', cost };
  return { ok: true, cost };
}
export function placeBuilding(s, type, x, y) {
  const c = canPlace(s, type, x, y);
  if (!c.ok) return c;
  const d = BUILDINGS[type];
  for (let dy = 0; dy < d.size; dy++) for (let dx = 0; dx < d.size; dx++) {
    const i = idx(x + dx, y + dy);
    if (s.bld[i]) removeBuilding(s, s.byId.get(s.bld[i]), 'replace');
    s.zone[i] = 0;
  }
  s.money -= c.cost;
  const b = addBuilding(s, type, x, y, 1, { cons: d.wonder ? 20 : 6 });
  s.stats.built++;
  afterMapChange(s);
  computeFields(s);
  return { ok: true, cost: c.cost, b };
}
export function upgradeCost(s, b) {
  const d = BUILDINGS[b.type];
  if (!d || !d.up || b.lvl > d.up.length) return null;
  return costOf(s, d.up[b.lvl - 1].cost);
}
export function upgradeBuilding(s, b) {
  const c = upgradeCost(s, b);
  if (c == null) return { ok: false, msg: 'Déjà au niveau maximum.' };
  if (c > s.money) return { ok: false, msg: 'Pas assez d\'argent.' };
  s.money -= c; b.lvl++; b.cons = 5;
  s.dirty.buildings = true; s.fieldsStale = true;
  computeFields(s);
  return { ok: true, cost: c };
}
export function svc(b) {
  // caractéristiques d'un service à son niveau actuel
  const d = BUILDINGS[b.type];
  const u = d.up && b.lvl > 1 ? d.up[b.lvl - 2] : null;
  return { r: (u && u.r) || d.r || 0, cap: (u && u.cap) || d.cap || 0 };
}

export function setTax(s, z, v) { s.taxes[z] = clamp(Math.round(v), 0, 20); }
export function setFunding(s, dept, v) { s.funding[dept] = clamp(Math.round(v / 5) * 5, 50, 150); }
export function togglePolicy(s, key) {
  const p = POLICIES[key];
  if (!s.policies[key] && s.milestone < (p.ms || 0)) return { ok: false, msg: 'Pas encore débloqué.' };
  if (s.policies[key]) delete s.policies[key]; else s.policies[key] = s.tick;
  s.fieldsStale = true;
  return { ok: true };
}
export function techAvailable(s, key) { return !s.techs[key] && TECHS[key].req.every((r) => s.techs[r]); }
export function setResearch(s, key) {
  if (!techAvailable(s, key)) return { ok: false, msg: 'Indisponible.' };
  s.research.cur = key;
  return { ok: true };
}
export const LOANS = [10000, 30000, 80000];
export function takeLoan(s, amount) {
  if (s.loans.length >= 3) return { ok: false, msg: 'Trois emprunts au maximum.' };
  const total = Math.round(amount * 1.24);
  s.loans.push({ amount, left: total, monthly: Math.ceil(total / 48) });
  s.money += amount;
  log(s, `Emprunt de ${fmt(amount)} € accordé. Remboursement : ${fmt(Math.ceil(total / 48))} € par mois pendant 4 ans.`, 'money');
  return { ok: true };
}
export function repayLoan(s, i) {
  const l = s.loans[i];
  if (!l) return { ok: false };
  if (s.money < l.left) return { ok: false, msg: 'Pas assez d\'argent pour tout rembourser.' };
  s.money -= l.left; s.loans.splice(i, 1);
  return { ok: true };
}
export const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

// ---------------------------------------------------------------------
// Mesures globales (population, emplois, réseaux, budget prévu)
// ---------------------------------------------------------------------
export function peopleOf(s, b) {
  if (b.type !== 'Z') return BUILDINGS[b.type].homes && !b.cons ? BUILDINGS[b.type].homes : 0;
  if (b.cons || b.ab || b.fire) return 0;
  return ZONES[b.z].people[b.lvl];
}
export function measure(s) {
  const m = {
    pop: 0, jobs: { 1: 0, 2: 0, 3: 0, 4: 0 }, serviceJobs: 0, powerCap: 0, powerUse: 0, waterCap: 0, waterUse: 0,
    sewageCap: 0, garbageCap: 0, garbage: 0, research: 0, tourism: 0, upkeep: 0, count: {}, lvlCount: [0, 0, 0, 0, 0],
    zoned: { 1: 0, 2: 0, 3: 0, 4: 0 }, roads: 0, avenues: 0, happy: 0, healthCap: 0, eduCap: 0, abandoned: 0, burning: 0,
    upkeepBy: {}, happyWonder: 0, gare: false, univ: false,
  };
  for (const k in BUILDINGS) m.count[k] = 0;
  const d = diff(s), grid = has(s, 'smartgrid') ? 0.85 : 1, eco = has(s, 'ecoconstruction') ? 0.8 : 1, waterSave = pol(s, 'eau') ? 0.75 : 1;
  const coldSnap = modActive(s, 'froid') ? 1.25 : 1, heat = modActive(s, 'canicule') ? 1.3 : 1;
  let happySum = 0, happyW = 0;
  for (const b of s.buildings) {
    if (b.type === 'Z') {
      const Z = ZONES[b.z];
      m.zonedBuilt = (m.zonedBuilt || 0) + 1;
      if (b.ab) { m.abandoned++; continue; }
      if (b.fire) m.burning++;
      if (b.cons) continue;
      m.lvlCount[b.lvl]++;
      const p = peopleOf(s, b);
      if (b.z === 1) { m.pop += p; happySum += (b.happy ?? 60) * p; happyW += p; } else m.jobs[b.z] += p;
      m.powerUse += Z.power[b.lvl] * grid * coldSnap;
      m.waterUse += Z.water[b.lvl] * eco * waterSave * heat;
    } else {
      const D = BUILDINGS[b.type];
      m.count[b.type]++;
      if (b.cons) continue;
      const fund = fundOf(s, D.dept), eff = Math.min(fund, 1.25);
      const up = D.upkeep * (1 + 0.5 * (b.lvl - 1)) * fund * d.upkeep * (D.dept === 'energie' && pol(s, 'energieVerte') ? 1.3 : 1);
      m.upkeep += up;
      m.upkeepBy[D.dept || 'autre'] = (m.upkeepBy[D.dept || 'autre'] || 0) + up;
      if (D.power > 0) m.powerCap += D.power * eff;
      if (D.power < 0) m.powerUse += -D.power;
      if (D.water) m.waterCap += D.water * eff;
      if (D.sewage) m.sewageCap += D.sewage * eff;
      if (D.garbage) m.garbageCap += D.garbage * eff;
      if (D.research) m.research += D.research * (1 + 0.5 * (b.lvl - 1)) * (D.dept === 'education' ? eff * (pol(s, 'ecole') ? 1.3 : 1) : 1);
      if (D.tourism) m.tourism += D.tourism;
      if (D.cover === 'health') m.healthCap += svc(b).cap * eff * (has(s, 'medecine') ? 1.5 : 1);
      if (D.cover === 'edu') m.eduCap += svc(b).cap * eff * (pol(s, 'ecole') ? 1.3 : 1);
      if (D.happy) m.happyWonder += D.happy;
      if (D.homes) { m.pop += D.homes; happySum += 75 * D.homes; happyW += D.homes; }
      if (b.type === 'gare') m.gare = true;
      if (b.type === 'universite') m.univ = true;
      if (D.power >= 0 && !D.water && !D.sewage) m.powerUse += 2 * D.size * D.size * grid;
      m.waterUse += D.size * D.size * eco * waterSave;
      m.serviceJobs += D.size * D.size * 5;
    }
  }
  for (let i = 0; i < T; i++) {
    if (s.zone[i]) m.zoned[s.zone[i]]++;
    if (s.road[i]) { m.roads++; if (s.road[i] === 2) m.avenues++; }
  }
  if (modActive(s, 'tempete') && !has(s, 'smartgrid')) m.powerCap *= 0.6;
  m.happy = happyW ? happySum / happyW : 60;
  const allJobs = m.jobs[2] + m.jobs[3] + m.jobs[4];
  m.garbage = (m.pop * 0.1 + allJobs * 0.06) * (pol(s, 'tri') ? 0.7 : 1) * eco;
  m.sewageUse = m.waterUse * 0.8;
  m.powerRatio = m.powerUse ? Math.min(1, m.powerCap / m.powerUse) : 1;
  m.waterRatio = m.waterUse ? Math.min(1, m.waterCap / m.waterUse) : 1;
  m.garbageOver = m.pop > 300 && m.garbage > m.garbageCap ? Math.min(1, (m.garbage - m.garbageCap) / m.garbage) : 0;
  m.sewageOver = m.pop > 3000 && m.sewageUse > m.sewageCap ? Math.min(1, (m.sewageUse - m.sewageCap) / m.sewageUse) : 0;
  m.healthRatio = m.pop ? Math.min(1, m.healthCap / m.pop) : 1;
  m.eduRatio = m.pop ? Math.min(1, m.eduCap / m.pop) : 1;
  m.workers = m.pop * 0.52;
  m.totalJobs = allJobs + m.serviceJobs;
  m.unemployment = m.workers > 0 ? clamp((m.workers - m.totalJobs) / m.workers, 0, 1) : 0;
  // budget prévu pour le mois
  const pme = pol(s, 'pme') ? 0.8 : 1, t = s.taxes;
  const inc = {
    R: m.pop * t[1] / 100 * 8,
    C: m.jobs[2] * t[2] / 100 * 9 * pme,
    I: m.jobs[3] * t[3] / 100 * 8 * pme,
    O: m.jobs[4] * t[4] / 100 * 11,
    tourisme: m.tourism * clamp(m.happy / 70, 0.3, 1.3) * (pol(s, 'tourisme') ? 1.4 : 1) * (modActive(s, 'touristes') ? 2 : 1) * fundOf(s, 'loisirs'),
  };
  let roadUp = 0;
  for (let i = 0; i < T; i++) if (s.road[i]) roadUp += ROADS[s.road[i]].upkeep;
  let policyCost = 0;
  for (const k in s.policies) policyCost += POLICIES[k].perRes * m.pop;
  const loanCost = s.loans.reduce((a, l) => a + Math.min(l.monthly, l.left), 0);
  const exp = { services: m.upkeep, routes: roadUp * d.upkeep, decrets: policyCost, emprunts: loanCost };
  m.income = inc; m.expense = exp;
  m.incomeTotal = Object.values(inc).reduce((a, b) => a + b, 0);
  m.expenseTotal = Object.values(exp).reduce((a, b) => a + b, 0);
  m.net = m.incomeTotal - m.expenseTotal;
  s.m = m;
  return m;
}

// ---------------------------------------------------------------------
// Champs : couvertures, pollution, bruit, trafic, valeur foncière
// ---------------------------------------------------------------------
function spread(field, cx, cy, r, amount, falloff = 1) {
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(N - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(N - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    field[y * N + x] += amount * (1 - falloff * Math.sqrt(d2) / r);
  }
}
export function computeFields(s) {
  const f = s.f, m = s.m;
  for (const k of ['police', 'fire', 'health', 'edu', 'leisure', 'transit', 'landBonus', 'pollution', 'noise', 'traffic']) f[k].fill(0);
  const green = pol(s, 'vert') ? 0.8 : 1, cleanPlants = pol(s, 'energieVerte') ? 0.6 : 1;
  const policeBoost = pol(s, 'couvrefeu') ? 1.5 : 1;
  for (const b of s.buildings) {
    const sz = sizeOf(b), cx = b.x + sz / 2, cy = b.y + sz / 2;
    if (b.type === 'Z') {
      if (b.ab || b.cons) continue;
      if (b.z === 3) spread(f.pollution, cx, cy, 4.5, ZONES[3].pollution[b.lvl] * green);
      // trafic créé par les habitants et les emplois
      const gen = ZONES[b.z].people[b.lvl] * 0.35;
      spread(f.traffic, cx, cy, 3.2, gen, 0.5);
      continue;
    }
    const D = BUILDINGS[b.type];
    if (b.cons) continue;
    const fund = Math.min(fundOf(s, D.dept), 1.25);
    const { r } = svc(b);
    if (D.cover && r) {
      let amt = 1.15 * fund;
      if (D.cover === 'health') amt *= m.healthRatio;
      if (D.cover === 'edu') amt *= m.eduRatio * (pol(s, 'ecole') ? 1.3 : 1);
      if (D.cover === 'police') amt *= policeBoost;
      if (b.type === 'parc' || b.type === 'bibliotheque') amt *= 0.7;
      spread(f[D.cover], cx, cy, r * (0.85 + 0.15 * fund), amt, 0.8);
    }
    if (D.land) spread(f.landBonus, cx, cy, r || 6, D.land);
    if (D.pollution) spread(f.pollution, cx, cy, D.polR, D.pollution * green * (D.dept === 'energie' ? cleanPlants : 1));
    if (D.noise) spread(f.noise, cx, cy, 3, D.noise);
    if (D.homes) spread(f.traffic, cx, cy, 4, D.homes * 0.1, 0.5);
  }
  // trafic sur les routes
  const transitPolicy = pol(s, 'transports') ? 0.65 : 1, tour = pol(s, 'tourisme') ? 1.1 : 1, bus = has(s, 'busElec') ? 0.7 : 1;
  const load = new Float32Array(T);
  for (let i = 0; i < T; i++) {
    if (!s.road[i]) continue;
    const l = f.traffic[i] * (1 - 0.55 * Math.min(1, f.transit[i])) * transitPolicy * tour / ROADS[s.road[i]].capacity;
    load[i] = l;
    const x = i % N, y = (i / N) | 0;
    spread(f.noise, x + 0.5, y + 0.5, 2, Math.min(1.5, l) * 0.12);
    spread(f.pollution, x + 0.5, y + 0.5, 1.5, Math.min(1.5, l) * 0.05 * bus * green);
  }
  f.traffic.set(load);
  // les arbres filtrent l'air
  for (let i = 0; i < T; i++) {
    f.pollution[i] = Math.max(0, f.pollution[i] * (1 - Math.min(0.5, f.treeNear[i] * 0.03)) + m.garbageOver * 0.2);
    for (const k of ['police', 'fire', 'health', 'edu', 'leisure', 'transit']) if (f[k][i] > 1) f[k][i] = 1;
  }
  // valeur foncière
  for (let i = 0; i < T; i++) {
    const wd = f.waterDist[i];
    let v = 30 + 24 * f.leisure[i] + 7 * f.police[i] + 7 * f.health[i] + 7 * f.edu[i] + 4 * f.fire[i] + f.landBonus[i]
      + (wd <= 3 ? 12 - 3 * wd : 0) + Math.min(10, f.treeNear[i] * 1.2) - 45 * Math.min(1.2, f.pollution[i]) - 14 * Math.min(1, f.noise[i]);
    f.land[i] = clamp(v, 0, 100);
  }
  s.fieldsStale = false;
  s.dirty.fields = true;
}

// ---------------------------------------------------------------------
// Bonheur d'un bâtiment (et détail des raisons pour la fiche)
// ---------------------------------------------------------------------
export function happinessOf(s, b, withReasons = false) {
  const f = s.f, m = s.m, i = idx(b.x, b.y), reasons = [];
  const add = (v, why) => { if (withReasons && Math.abs(v) >= 1) reasons.push([Math.round(v), why]); return v; };
  let h = 56;
  const need = clamp((m.pop - 300) / 3000, 0, 1);
  if (b.z === 1) {
    h += add(10 * f.leisure[i], 'Parcs et loisirs');
    h += add(5 * f.police[i] + 4 * f.fire[i] + 5 * f.health[i] + 4 * f.edu[i], 'Services proches');
    h += add(-(need * (9 * (1 - f.health[i]) + 7 * (1 - f.edu[i]) + 7 * (1 - f.police[i]) + 4 * (1 - f.fire[i]))), 'Services manquants');
    h += add(-(28 * Math.min(1.2, f.pollution[i])), 'Pollution');
    h += add(-(10 * Math.min(1, f.noise[i])), 'Bruit');
    h += add(-((s.taxes[1] - 9) * 2.2), 'Impôts');
    h += add(-(m.unemployment * 26), 'Chômage');
    h += add((f.land[i] - 40) / 8, 'Quartier');
  } else {
    h += add(-((s.taxes[b.z] - 9) * 2.2), 'Impôts');
    if (b.z !== 3) h += add(-(12 * Math.min(1.2, f.pollution[i])), 'Pollution');
    h += add((f.land[i] - 40) / 10, 'Quartier');
    if (b.z === 4) h += add(8 * f.edu[i] - 4, 'Éducation');
    if (b.z === 3 && m.gare) h += add(6, 'Gare de marchandises');
  }
  if (!b.pow) h += add(-30, 'Pas d\'électricité');
  if (!b.wat && m.pop > 40) h += add(-22, 'Pas d\'eau');
  if (m.garbageOver) h += add(-(12 * m.garbageOver), 'Déchets non ramassés');
  if (m.sewageOver) h += add(-(10 * m.sewageOver), 'Eaux usées non traitées');
  const tr = nearbyTraffic(s, b.x, b.y);
  if (tr > 0.8) h += add(-(Math.min(10, (tr - 0.8) * 12)), 'Embouteillages');
  if (m.happyWonder) h += add(m.happyWonder, 'Merveilles');
  if (has(s, 'domotique')) h += add(4, 'Maisons connectées');
  if (pol(s, 'transports')) h += add(3, 'Transports gratuits');
  if (pol(s, 'ecole')) h += add(2, 'Éducation gratuite');
  if (pol(s, 'eau')) h += add(-2, 'Économies d\'eau');
  if (pol(s, 'couvrefeu')) h += add(-(5), 'Couvre-feu');
  if (modActive(s, 'festival')) h += add(6, 'Festival');
  if (modActive(s, 'epidemie')) h += add(-(10), 'Épidémie');
  h = clamp(h, 0, 100);
  return withReasons ? { h, reasons: reasons.sort((a, b2) => Math.abs(b2[0]) - Math.abs(a[0])) } : h;
}
function nearbyTraffic(s, x, y) {
  let mx = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!inMap(x + dx, y + dy)) continue;
    const t = s.f.traffic[idx(x + dx, y + dy)];
    if (t > mx) mx = t;
  }
  return mx;
}

// ---------------------------------------------------------------------
// Demande résidentielle, commerciale, industrielle, bureaux
// ---------------------------------------------------------------------
function computeDemand(s) {
  const m = s.m, d = diff(s), t = s.taxes;
  const tax = (z) => (t[z] - 9) * 0.05;
  const r = 0.45 + clamp((m.totalJobs - m.workers) / Math.max(40, m.workers), -1, 1) * 0.9 + (m.happy - 55) / 80 - tax(1) + d.demand;
  const cTarget = m.pop * 0.16 + m.tourism * 0.01 + 12;
  let c = clamp((cTarget - m.jobs[2]) / Math.max(20, m.pop * 0.16), -1, 1) - tax(2) + d.demand;
  const indFactor = (has(s, 'tertiaire') ? 0.78 : 1) * (m.pop > 7500 ? 0.8 : 1) * (pol(s, 'vert') ? 0.85 : 1);
  let i = clamp((m.pop * 0.22 * indFactor + 20 - m.jobs[3]) / Math.max(25, m.pop * 0.22), -1, 1) - tax(3) + d.demand + (m.gare ? 0.12 : 0);
  let o = -1;
  if (has(s, 'tertiaire')) {
    const eduAvg = m.eduRatio;
    o = clamp((m.pop * 0.12 * (0.4 + 0.6 * eduAvg) + 12 - m.jobs[4]) / Math.max(20, m.pop * 0.12), -1, 1) - tax(4) + d.demand + (m.univ ? 0.1 : 0);
  }
  if (pol(s, 'commerce')) c += 0.2;
  if (pol(s, 'pme')) { c += 0.15; i += 0.15; }
  if (m.gare) c += 0.06;
  if (modActive(s, 'investisseur')) { c += 0.3; o += 0.3; }
  const target = { 1: clamp(r, -1, 1), 2: clamp(c, -1, 1), 3: clamp(i, -1, 1), 4: clamp(o, -1, 1) };
  for (const z of [1, 2, 3, 4]) s.demand[z] += (target[z] - s.demand[z]) * 0.15;
}

// ---------------------------------------------------------------------
// Un jour de simulation
// ---------------------------------------------------------------------
let zoneList = null, zoneListFor = null;
function zonedTiles(s) {
  if (zoneListFor !== s || s.dirty.zoneList !== false) {
    zoneList = [];
    for (let i = 0; i < T; i++) if (s.zone[i]) zoneList.push(i);
    zoneListFor = s; s.dirty.zoneList = false;
  }
  return zoneList;
}

export function tick(s) {
  s.events = s.events || [];
  s.tick++;
  const m = measure(s);
  if (s.fieldsStale || s.tick % 5 === 0) computeFields(s);
  computeDemand(s);

  // alimentation : les mêmes bâtiments sont privés en premier (toujours dans le même ordre)
  for (const b of s.buildings) {
    b.pow = hash01(b.id) < m.powerRatio - 1e-6 || m.powerRatio >= 1;
    b.wat = hash01(b.id * 7 + 3) < m.waterRatio - 1e-6 || m.waterRatio >= 1;
    if (b.cons) { b.cons--; if (!b.cons) { s.dirty.buildings = true; emit(s, { type: 'done', b }); } }
  }

  // bonheur, montée en niveau, abandon, incendies
  const maxL = maxLevel(s);
  const list = s.buildings.slice();
  for (const b of list) {
    if (b.type !== 'Z') continue;
    if (b.cons) continue;
    b.happy = happinessOf(s, b);
    s.f.happy[idx(b.x, b.y)] = b.happy;
    if (b.fire) { burn(s, b); continue; }
    if (!b.pow) b.unp = (b.unp || 0) + 1; else b.unp = 0;
    const dem = s.demand[b.z];
    if (b.ab) {
      b.ab++;
      if (b.pow && b.happy > 38 && dem > 0 && Math.random() < 0.05) { b.ab = 0; s.dirty.buildings = true; emit(s, { type: 'reoccupied', b }); }
      else if (b.ab > 110) { removeBuilding(s, b, 'decay'); }
      continue;
    }
    if (b.unp > 45 || (b.happy < 16 && Math.random() < 0.015) || (dem < -0.55 && Math.random() < 0.004)) {
      b.ab = 1; s.dirty.buildings = true; emit(s, { type: 'abandoned', b }); continue;
    }
    if (b.lvl < maxL && b.pow && b.wat && Math.random() < 0.045) {
      const next = b.lvl + 1, land = s.f.land[idx(b.x, b.y)];
      const landNeed = LEVEL_LAND[next] * (b.z === 3 ? 0.55 : 1);
      const eduOk = next < 3 || b.z === 1 || b.z === 3 || s.f.edu[idx(b.x, b.y)] > 0.25;
      const techOk = !(b.z === 3 && next === 4 && !has(s, 'tertiaire'));
      if (land >= landNeed && b.happy >= 38 + 5 * next && dem > -0.15 && eduOk && techOk) {
        b.lvl = next; b.cons = 4 + next * 2; b.v = Math.floor(Math.random() * 3);
        s.dirty.buildings = true; emit(s, { type: 'levelup', b });
      }
    }
  }
  // naissance de nouveaux bâtiments
  const zl = zonedTiles(s);
  if (zl.length && m.powerCap > 0) {
    const samples = Math.min(zl.length, 18 + Math.floor(zl.length * 0.04));
    for (let k = 0; k < samples; k++) {
      const i = zl[Math.floor(Math.random() * zl.length)];
      const z = s.zone[i];
      if (!z || s.bld[i] || s.road[i] || s.f.roadDist[i] > 2) continue;
      const dem = s.demand[z];
      if (dem <= 0 || Math.random() > dem * 0.3) continue;
      if (z === 4 && !has(s, 'tertiaire')) continue;
      const b = addBuilding(s, 'Z', i % N, (i / N) | 0, 1, { z, cons: 5, happy: 60 });
      emit(s, { type: 'born', b });
    }
  }
  fireRisk(s);

  // fin du mois
  if (s.tick % TICKS_PER_MONTH === 0) monthEnd(s);
  if (s.tick % 10 === 0) checkQuests(s);
  s.mods = s.mods.filter((x) => x.until > s.tick);
  const ev = s.events; s.events = [];
  return ev;
}

function fireRisk(s) {
  const m = s.m;
  const n = m.zonedBuilt || 0;
  if (!n || m.pop < 80) return;
  if (Math.random() > n * 0.00012) return;
  const zs = s.buildings.filter((b) => b.type === 'Z' && !b.cons && !b.fire && !b.ab);
  if (!zs.length) return;
  const b = zs[Math.floor(Math.random() * zs.length)];
  const cov = s.f.fire[idx(b.x, b.y)];
  if (Math.random() < cov * 0.8) return; // les pompiers l'ont évité
  b.fire = 1; b.burn = 0;
  s.stats.fires++;
  s.dirty.buildings = true;
  emit(s, { type: 'fire', b });
  log(s, `Incendie ! Un bâtiment brûle près de la case ${b.x}, ${b.y}.`, 'alert');
}
function burn(s, b) {
  b.burn = (b.burn || 0) + 1;
  const cov = s.f.fire[idx(b.x, b.y)] * fundOf(s, 'securite');
  if (cov > 0.2 && Math.random() < cov * 0.25) {
    b.fire = 0; s.dirty.buildings = true; emit(s, { type: 'extinguished', b });
    return;
  }
  // propagation aux voisins
  if (cov < 0.3 && Math.random() < 0.035) {
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
    const x = b.x + nb[0], y = b.y + nb[1];
    if (inMap(x, y) && s.bld[idx(x, y)]) {
      const o = s.byId.get(s.bld[idx(x, y)]);
      if (o.type === 'Z' && !o.fire && !o.cons) { o.fire = 1; o.burn = 0; s.dirty.buildings = true; emit(s, { type: 'fire', b: o }); }
    }
  }
  if (b.burn > 28) {
    removeBuilding(s, b, 'fire');
    log(s, 'Un bâtiment a brûlé entièrement. Une caserne de pompiers proche l\'aurait sauvé.', 'alert');
  }
}

function monthEnd(s) {
  const m = measure(s);
  // budget
  s.money += m.net;
  for (const l of s.loans) l.left -= Math.min(l.monthly, l.left);
  s.loans = s.loans.filter((l) => l.left > 0);
  s.profitStreak = m.net >= 0 ? s.profitStreak + 1 : 0;
  s.lastMonth = { income: m.income, expense: m.expense, net: m.net };
  // recherche
  if (s.research.cur) {
    s.research.pts += m.research;
    const t = TECHS[s.research.cur];
    if (s.research.pts >= t.cost) {
      s.research.pts -= t.cost;
      s.techs[s.research.cur] = s.tick;
      log(s, `Recherche terminée : ${t.name}. ${t.text}`, 'tech');
      emit(s, { type: 'tech', key: s.research.cur });
      s.research.cur = Object.keys(TECHS).find((k) => techAvailable(s, k)) || null;
      s.research.pts = s.research.cur ? s.research.pts : 0;
    }
  } else {
    s.research.cur = Object.keys(TECHS).find((k) => techAvailable(s, k)) || null;
  }
  // paliers
  while (s.milestone < MILESTONES.length - 1 && m.pop >= MILESTONES[s.milestone + 1].pop) {
    s.milestone++;
    const ms = MILESTONES[s.milestone];
    s.money += ms.reward;
    const mairie = s.buildings.find((b) => b.type === 'mairie');
    if (mairie) { mairie.lvl = Math.min(4, 1 + Math.floor(s.milestone / 2)); mairie.cons = 6; s.dirty.buildings = true; }
    log(s, `${s.name} devient : ${ms.name} ! Prime de ${fmt(ms.reward)} €, et de nouveaux bâtiments sont disponibles.`, 'milestone');
    emit(s, { type: 'milestone', i: s.milestone });
  }
  // événements
  randomEvent(s);
  // historique
  s.history.push({
    t: s.tick, pop: Math.round(m.pop), money: Math.round(s.money), happy: Math.round(m.happy), inc: Math.round(m.incomeTotal), exp: Math.round(m.expenseTotal),
    pw: Math.round(m.powerUse), pc: Math.round(m.powerCap), wu: Math.round(m.waterUse), wc: Math.round(m.waterCap),
    dR: +s.demand[1].toFixed(2), dC: +s.demand[2].toFixed(2), dI: +s.demand[3].toFixed(2), dO: +s.demand[4].toFixed(2),
    jobs: Math.round(m.totalJobs), un: +(m.unemployment * 100).toFixed(1),
  });
  if (s.history.length > 360) s.history.shift();
  // une petite nouvelle
  news(s);
  if (s.money < 0 && s.loans.length < 3) log(s, 'Les caisses sont vides ! Monte un peu les impôts, baisse les budgets ou contracte un emprunt.', 'alert');
  emit(s, { type: 'month' });
}

function randomEvent(s) {
  const m = s.m, d = dateOf(s.tick);
  if (m.pop < 150 || Math.random() > 0.3) return;
  const opts = [];
  if (!has(s, 'smartgrid')) opts.push('tempete');
  if (d.season === 1) opts.push('canicule');
  if (d.season === 3) opts.push('froid');
  if (m.pop > 300) opts.push('festival', 'subvention');
  if (m.pop > 1500 && m.healthRatio < 0.7) opts.push('epidemie', 'epidemie');
  if (m.pop > 800) opts.push('investisseur');
  if (m.tourism > 0) opts.push('touristes');
  const k = opts[Math.floor(Math.random() * opts.length)];
  const dur = { tempete: 20, canicule: 30, froid: 30, festival: 30, epidemie: 45, investisseur: 60, touristes: 30 }[k] || 0;
  if (dur) s.mods.push({ k, until: s.tick + dur });
  const txt = {
    tempete: 'Tempête ! Des lignes électriques sont tombées : la production d\'électricité baisse pendant quelques semaines.',
    canicule: 'Canicule : les habitants consomment beaucoup plus d\'eau ce mois-ci.',
    froid: 'Vague de froid : le chauffage fait grimper la consommation d\'électricité.',
    festival: 'Grand festival en ville ! Les habitants sont ravis.',
    subvention: '',
    epidemie: 'Épidémie de grippe : les hôpitaux sont débordés. Construis des cliniques ou un hôpital.',
    investisseur: 'Un grand investisseur s\'intéresse à la ville : les commerces et les bureaux ont le vent en poupe.',
    touristes: 'Boom touristique : les visiteurs affluent et dépensent sans compter.',
  }[k];
  if (k === 'subvention') {
    const g = Math.round(1000 + m.pop * 0.8);
    s.money += g;
    log(s, `La région verse une subvention de ${fmt(g)} € pour saluer le développement de la ville.`, 'money');
  } else if (k === 'festival') {
    const g = Math.round(m.pop * 0.5);
    s.money += g;
    log(s, `${txt} Recettes : ${fmt(g)} €.`, 'event');
  } else log(s, txt, k === 'tempete' || k === 'epidemie' ? 'alert' : 'event');
  emit(s, { type: 'event', k });
}

function news(s) {
  const m = s.m;
  const pools = [];
  if (m.powerRatio < 0.95) pools.push('noPower');
  if (m.waterRatio < 0.95) pools.push('noWater');
  if (m.unemployment > 0.15) pools.push('jobs');
  if ((s.taxes[1] + s.taxes[2] + s.taxes[3]) / 3 > 12) pools.push('taxes');
  if (m.happy > 75) pools.push('happy');
  let maxPol = 0, maxTr = 0;
  for (let i = 0; i < T; i++) { if (s.f.pollution[i] > maxPol) maxPol = s.f.pollution[i]; if (s.f.traffic[i] > maxTr) maxTr = s.f.traffic[i]; }
  if (maxPol > 0.8) pools.push('pollution');
  if (maxTr > 1.2) pools.push('traffic');
  if (Math.random() < 0.4 || !pools.length) pools.push('generic');
  const p = NEWS[pools[Math.floor(Math.random() * pools.length)]];
  s.newsLine = p[Math.floor(Math.random() * p.length)];
  emit(s, { type: 'news', text: s.newsLine });
}

export function checkQuests(s) {
  const m = s.m;
  for (const q of QUESTS) {
    if (s.quests[q.id]) continue;
    if (q.test(s, m)) {
      s.quests[q.id] = s.tick;
      s.money += q.reward;
      log(s, `Objectif atteint : ${q.text}. Récompense : ${fmt(q.reward)} €.`, 'quest');
      emit(s, { type: 'quest', q });
    }
  }
}
export function activeQuests(s, n = 3) { return QUESTS.filter((q) => !s.quests[q.id]).slice(0, n); }

// Conseils du jour : ce qui bloque la ville en ce moment
export function advice(s) {
  const m = s.m, out = [];
  if (m.roads < 5) out.push('Trace des routes depuis la route d\'accès, à l\'ouest.');
  if (m.zoned[1] < 6) out.push('Trace des zones résidentielles le long des routes.');
  if (m.powerCap === 0) out.push('Rien ne pousse sans électricité : pose une éolienne ou une centrale.');
  else if (m.powerRatio < 1) out.push(`Il manque ${fmt(m.powerUse - m.powerCap)} MW d'électricité.`);
  if (m.pop > 40 && m.waterCap === 0) out.push('Pose une pompe à eau au bord de l\'eau.');
  else if (m.waterRatio < 1) out.push('Il manque de l\'eau : pose une autre pompe ou un château d\'eau.');
  if (s.demand[2] > 0.4 && m.zoned[2] - countZ(s, 2) < 3) out.push('Les habitants veulent des commerces : trace des zones commerciales.');
  if (s.demand[3] > 0.4 && m.zoned[3] - countZ(s, 3) < 3) out.push('Il manque d\'emplois : trace des zones industrielles, loin des maisons.');
  if (s.demand[1] > 0.4 && m.zoned[1] - countZ(s, 1) < 3) out.push('Des familles veulent s\'installer : trace des zones résidentielles.');
  if (has(s, 'tertiaire') && s.demand[4] > 0.4 && m.zoned[4] - countZ(s, 4) < 3) out.push('Les entreprises cherchent des bureaux : trace des zones de bureaux.');
  if (m.garbageOver > 0) out.push('Les déchets s\'entassent : construis une décharge ou un centre de recyclage.');
  if (m.sewageOver > 0) out.push('Les eaux usées débordent : construis une station d\'épuration.');
  if (m.pop > 600 && m.healthRatio < 0.8) out.push('Les soins manquent : construis une clinique ou un hôpital.');
  if (m.pop > 600 && m.eduRatio < 0.8) out.push('Les écoles sont pleines : construis-en d\'autres.');
  if (m.unemployment > 0.15) out.push('Beaucoup de chômeurs : trace des zones d\'emplois.');
  if (m.net < 0 && s.money < 5000) out.push('Le budget est dans le rouge : monte un peu les impôts ou baisse les budgets.');
  if (!s.research.cur && Object.keys(TECHS).some((k) => techAvailable(s, k))) out.push('Choisis une recherche dans l\'onglet Recherche.');
  return out;
}
function countZ(s, z) { let c = 0; for (const b of s.buildings) if (b.type === 'Z' && b.z === z) c++; return c; }

// ---------------------------------------------------------------------
// Sauvegarde compacte (tableaux codés en plages)
// ---------------------------------------------------------------------
function rle(arr) {
  const out = [];
  let prev = arr[0], n = 1;
  for (let i = 1; i <= arr.length; i++) {
    if (i < arr.length && arr[i] === prev) { n++; continue; }
    out.push(n > 1 ? `${prev.toString(36)}*${n.toString(36)}` : prev.toString(36));
    prev = arr[i]; n = 1;
  }
  return out.join(',');
}
function unrle(str, len) {
  const a = new Uint8Array(len);
  let p = 0;
  for (const part of str.split(',')) {
    const [v, n] = part.split('*');
    const val = parseInt(v, 36), cnt = n ? parseInt(n, 36) : 1;
    for (let k = 0; k < cnt && p < len; k++) a[p++] = val;
  }
  return a;
}
const B_KEYS = ['id', 'type', 'x', 'y', 'lvl', 'v', 'cons', 'z', 'ab', 'fire', 'burn', 'unp', 'happy'];
export function serialize(s) {
  return {
    v: 1, name: s.name, seed: s.seed, map: s.map, difficulty: s.difficulty, money: Math.round(s.money), tick: s.tick,
    terrain: rle(s.terrain), trees: rle(s.trees), road: rle(s.road), zone: rle(s.zone),
    b: s.buildings.map((b) => B_KEYS.map((k) => (k === 'happy' ? Math.round(b[k] || 0) : b[k] ?? 0))),
    nextId: s.nextId, taxes: s.taxes, funding: s.funding, policies: s.policies, techs: s.techs, research: s.research,
    loans: s.loans, milestone: s.milestone, quests: s.quests, profitStreak: s.profitStreak, history: s.history,
    mods: s.mods, log: s.log.slice(0, 40), demand: s.demand, lastMonth: s.lastMonth, stats: s.stats, createdAt: s.createdAt,
    savedAt: Date.now(), newsLine: s.newsLine || '',
  };
}
export function deserialize(o) {
  if (!o || o.v !== 1) throw new Error('Sauvegarde inconnue');
  const base = createStateShell();
  const s = { ...base, ...o };
  s.terrain = unrle(o.terrain, T); s.trees = unrle(o.trees, T); s.road = unrle(o.road, T); s.zone = unrle(o.zone, T);
  s.buildings = (o.b || []).map((a) => { const b = {}; B_KEYS.forEach((k, j) => { b[k] = a[j]; }); if (b.type !== 'Z') delete b.z; return b; })
    .filter((b) => b.type === 'Z' ? ZONES[b.z] : BUILDINGS[b.type]);
  s.taxes = { ...base.taxes, ...o.taxes }; s.funding = { ...base.funding, ...o.funding };
  s.research = { ...base.research, ...o.research };
  delete s.b;
  s.f = null;
  prepare(s);
  return s;
}
function createStateShell() {
  return {
    taxes: { 1: 9, 2: 9, 3: 9, 4: 9 },
    funding: { energie: 100, eau: 100, dechets: 100, securite: 100, sante: 100, education: 100, loisirs: 100, transports: 100, merveilles: 100 },
    policies: {}, techs: {}, research: { cur: null, pts: 0 }, loans: [], milestone: 0, quests: {}, profitStreak: 0,
    history: [], mods: [], log: [], demand: { 1: 0.5, 2: 0.4, 3: 0.4, 4: 0 }, lastMonth: null, stats: { fires: 0, built: 0 },
  };
}
