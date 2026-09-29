// =====================================================================
// Aurore : le jeu (boucle, outils, interface)
// =====================================================================
import {
  N, TICK_MS, TICKS_PER_MONTH, SEASONS, MONTHS, DIFFICULTY, MAPS, ZONES, ROADS, BUILDINGS, DEPTS,
  MILESTONES, TECHS, POLICIES, QUESTS, LEVEL_LAND, LEVEL_MILESTONE,
} from './data.js';
import * as S from './sim.js';
import { SaveManager } from './save.js';
import { lineChart, SERIES } from './charts.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = S.fmt;
const money = (n) => `${fmt(n)} €`;
const signed = (n) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
const idx = (x, y) => y * N + x;
const isTouch = () => matchMedia('(pointer: coarse)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------
// Réglages de l'appareil
// ---------------------------------------------------------------------
const PREF_KEY = 'aurore-prefs';
const prefs = Object.assign({ quality: 'auto', dayMode: 'cycle', dayLength: 360, weather: 'auto', sound: true, volume: 0.5, tutorial: true }, (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch (e) { return {}; } })());
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }
const autoQuality = () => (isTouch() || (navigator.hardwareConcurrency || 4) <= 4 ? 'moyen' : 'haut');

// ---------------------------------------------------------------------
// Sons (synthétisés, aucun fichier)
// ---------------------------------------------------------------------
let actx = null;
function sfx(kind) {
  if (!prefs.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime, g = actx.createGain();
    g.connect(actx.destination);
    const vol = prefs.volume * 0.25;
    const tone = (f, d, type = 'sine', at = 0, v = vol) => {
      const o = actx.createOscillator(), gg = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + at);
      gg.gain.setValueAtTime(0, t + at); gg.gain.linearRampToValueAtTime(v, t + at + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
      o.connect(gg); gg.connect(g); o.start(t + at); o.stop(t + at + d + 0.02);
      return o;
    };
    if (kind === 'click') tone(880, 0.06, 'triangle', 0, vol * 0.5);
    else if (kind === 'build') { const o = tone(160, 0.22, 'triangle'); o.frequency.exponentialRampToValueAtTime(70, t + 0.2); tone(320, 0.12, 'sine', 0.02, vol * 0.4); }
    else if (kind === 'road') tone(220, 0.1, 'square', 0, vol * 0.25);
    else if (kind === 'zone') { tone(520, 0.08, 'sine'); tone(780, 0.1, 'sine', 0.05); }
    else if (kind === 'demolish') {
      const len = 0.25, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = actx.createBufferSource(), f = actx.createBiquadFilter(), gg = actx.createGain();
      f.type = 'lowpass'; f.frequency.value = 900; gg.gain.value = vol * 1.2;
      src.buffer = buf; src.connect(f); f.connect(gg); gg.connect(g); src.start();
    } else if (kind === 'coin') { tone(988, 0.1, 'triangle'); tone(1319, 0.25, 'triangle', 0.08); }
    else if (kind === 'fanfare') { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', i * 0.11)); }
    else if (kind === 'alert') { tone(440, 0.15, 'sawtooth', 0, vol * 0.3); tone(330, 0.2, 'sawtooth', 0.16, vol * 0.3); }
    else if (kind === 'error') tone(180, 0.15, 'square', 0, vol * 0.3);
  } catch (e) { /* pas de son */ }
}

// ---------------------------------------------------------------------
// État global
// ---------------------------------------------------------------------
let view = null;
let s = null;          // l'état de la ville en cours
let playing = false;   // une partie est ouverte (sinon : menu)
let speed = 1, lastSpeed = 1;
let tool = null;       // { kind, k, z, type, overlay }
let category = null;
let selected = null;   // id du bâtiment sélectionné
let panel = null;
let acc = 0;
const saves = new SaveManager({ onStatus: () => renderSaveIndicator() });

// ---------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------
async function boot() {
  try {
    const R = await import('./render.js');
    const q = prefs.quality === 'auto' ? autoQuality() : prefs.quality;
    view = new R.View($('scene'), { quality: q, reducedMotion: reduced });
    view.dayMode = prefs.dayMode; view.dayLength = prefs.dayLength;
    view.fixedWeather = prefs.weather === 'auto' ? null : prefs.weather;
  } catch (e) {
    console.error(e);
    $('loading').textContent = 'Ton navigateur ne peut pas afficher la 3D (WebGL). Essaie avec Chrome, Firefox, Safari ou Edge récents.';
    return;
  }
  $('loading').textContent = '';
  window.addEventListener('resize', () => view.resize());
  // fond du menu : la dernière ville, sinon une ville de démonstration
  const last = saves.meta.last && saves.load(saves.meta.last);
  showBackground(last || demoCity());
  buildMenu();
  buildTools();
  bindUI();
  requestAnimationFrame(loop);
  saves.initCloud().then((changed) => { if (changed && !playing) buildMenu(); });
}

function demoCity() {
  const d = S.createState({ name: 'Démo', seed: 1234 + Math.floor(Math.random() * 1000), map: ['vallee', 'cote', 'lacs'][Math.floor(Math.random() * 3)] });
  d.money = 1e9;
  const m = d.buildings[0];
  const y0 = m.y - 1;
  for (let y = y0 - 8; y <= y0 + 8; y += 4) S.buildRoad(d, S.linePath(2, y, 26, y), 1);
  for (let x = 2; x <= 26; x += 6) S.buildRoad(d, S.linePath(x, y0 - 8, x, y0 + 8), 1);
  const put = (z, n) => {
    let c = 0;
    for (let k = 0; k < 4000 && c < n; k++) {
      const x = 2 + Math.floor(Math.random() * 25), y = y0 - 8 + Math.floor(Math.random() * 17), i = idx(x, y);
      if (!d.road[i] && !d.bld[i] && !d.zone[i] && d.terrain[i] !== 1 && d.f.roadDist[i] <= 1) { S.applyZone(d, [[x, y]], z); c++; }
    }
  };
  put(1, 70); put(2, 26); put(3, 18);
  for (const t of ['eolienne', 'eolienne', 'eolienne', 'pompe', 'parc', 'parc', 'place']) {
    for (let k = 0; k < 3000; k++) { const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N); if (S.canPlace(d, t, x, y).ok) { S.placeBuilding(d, t, x, y); break; } }
  }
  d.milestone = 3;
  for (let k = 0; k < 420; k++) S.tick(d);
  return d;
}
function showBackground(state) {
  s = state;
  view.setState(s);
  view.autoRotate = true;
  view.controls.target.set(-10, 0, 0);
  view.camera.position.set(-34, 22, 26);
}

// ---------------------------------------------------------------------
// Menu principal
// ---------------------------------------------------------------------
function buildMenu() {
  const list = saves.list();
  const cont = $('btn-continue');
  const last = saves.meta.last && saves.meta.slots[saves.meta.last];
  cont.hidden = !last;
  if (last) cont.textContent = `Continuer ${last.name}`;
  $('slots').innerHTML = list.map((sl) => {
    if (sl.empty) return `<button type="button" class="slot empty" data-new="${sl.n}"><span class="thumb">＋</span><span><b>Nouvelle ville</b><small>Emplacement ${sl.n} libre</small></span></button>`;
    const d = S.dateOf(sl.tick || 0);
    return `<div class="slot"><span class="thumb" style="${sl.thumb ? `background-image:url(${sl.thumb})` : ''}">${sl.thumb ? '' : '🏙️'}</span>
      <span><b>${esc(sl.name)}</b><small>${esc(MILESTONES[sl.milestone || 0].name)} · ${fmt(sl.pop || 0)} habitants<br>${MONTHS[d.month]} ${d.year} · ${esc(MAPS[sl.map] ? MAPS[sl.map].name : '')}</small></span>
      <span class="acts"><button type="button" class="btn small primary" data-load="${sl.n}">Jouer</button><button type="button" class="btn small danger" data-del="${sl.n}">Effacer</button></span></div>`;
  }).join('');
  // formulaire
  $('new-map').innerHTML = '<legend>Carte</legend>' + Object.entries(MAPS).map(([k, m], i) => `<label><input type="radio" name="map" value="${k}" ${i === 0 ? 'checked' : ''}><b>${m.name}</b><small>${m.text}</small></label>`).join('');
  $('new-diff').innerHTML = '<legend>Difficulté</legend>' + Object.entries(DIFFICULTY).map(([k, d]) => `<label><input type="radio" name="diff" value="${k}" ${k === 'normal' ? 'checked' : ''}><b>${d.name}</b><small>${money(d.money)} au départ${d.cost !== 1 ? `, prix ${d.cost < 1 ? '−' : '+'}${Math.round(Math.abs(1 - d.cost) * 100)} %` : ''}</small></label>`).join('');
}
let newSlot = null;
function openNewForm(n) {
  newSlot = n || saves.freeSlot();
  if (!newSlot) { modal({ title: 'Trois villes au maximum', text: 'Efface une ville pour en fonder une nouvelle.', actions: [['OK']] }); return; }
  $('menu-main').hidden = true; $('menu-new').hidden = false;
  $('new-name').value = ['Aurore', 'Valclair', 'Beaumont', 'Rivelune', 'Hautecime', 'Port-Soleil'][Math.floor(Math.random() * 6)];
  $('new-name').focus();
}
function startNew(e) {
  e.preventDefault();
  const name = $('new-name').value.trim() || 'Aurore';
  const map = document.querySelector('input[name="map"]:checked').value;
  const difficulty = document.querySelector('input[name="diff"]:checked').value;
  const st = S.createState({ name, map, difficulty, seed: Math.floor(Math.random() * 1e9) });
  saves.slot = newSlot;
  enterGame(st, true);
  saves.save(s, { reason: 'backup' });
}
function loadSlot(n) {
  const st = saves.load(n);
  if (!st) { toast('Cette sauvegarde est illisible.', 'bad'); return; }
  saves.slot = n;
  saves.backup(st, 'au chargement');
  enterGame(st, false);
}
function enterGame(st, fresh) {
  s = st;
  view.resetMapCaches();
  view.setState(s);
  view.autoRotate = false;
  playing = true; speed = 1; acc = 0; tool = null; category = null; selected = null;
  $('menu').hidden = true; $('ui').hidden = false;
  $('menu-main').hidden = false; $('menu-new').hidden = true;
  const m = s.buildings.find((b) => b.type === 'mairie') || { x: N / 2, y: N / 2 };
  view.controls.target.set(m.x - N / 2 + 1, 0, m.y - N / 2 + 1);
  view.camera.position.set(m.x - N / 2 - 12, 18, m.y - N / 2 + 18);
  buildTools(); renderAll();
  if (fresh && prefs.tutorial) tutorial();
  else if (!fresh) catchUp();
}
function backToMenu() {
  if (playing) saves.save(s, { thumb: safeThumb() });
  playing = false;
  closePanel(); closeInfo(); setTool(null);
  $('ui').hidden = true; $('menu').hidden = false;
  view.autoRotate = true;
  buildMenu();
}

// progrès pendant l'absence (3 mois au plus)
function catchUp() {
  const away = Date.now() - (s.savedAt || Date.now());
  if (away < 60000) return;
  const ticks = Math.min(Math.floor(away / TICK_MS), TICKS_PER_MONTH * 3);
  if (ticks < 5) return;
  const pop0 = s.m.pop, money0 = s.money;
  for (let k = 0; k < ticks; k++) S.tick(s);
  view.sync(true);
  modal({
    kicker: 'Pendant ton absence', title: `${s.name} a continué de vivre`,
    text: `<p>${Math.round(ticks / 30 * 10) / 10} mois se sont écoulés.</p><ul><li>Habitants : ${signed(Math.round(s.m.pop - pop0))}</li><li>Trésorerie : ${signed(Math.round(s.money - money0))} €</li></ul>`,
    actions: [['Reprendre', null, true]],
  });
}

// ---------------------------------------------------------------------
// Boucle
// ---------------------------------------------------------------------
let last = performance.now(), uiTimer = 0, autosaveTimer = 0, thumbTimer = 80, fpsAcc = 0, fpsN = 0, lowFps = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (playing && speed > 0 && $('modal').hidden) {
    acc += dt * 1000 * speed;
    let n = 0;
    while (acc >= TICK_MS && n < 12) {
      const ev = S.tick(s);
      handleEvents(ev);
      acc -= TICK_MS; n++;
    }
    if (n >= 12) acc = 0;
  }
  if (s) view.sync();
  view.render(dt);
  if (playing) {
    uiTimer += dt; autosaveTimer += dt; thumbTimer += dt;
    if (uiTimer > 0.25) { uiTimer = 0; renderTop(); }
    if (autosaveTimer > 15) { autosaveTimer = 0; const th = thumbTimer > 90 ? safeThumb() : null; if (th) thumbTimer = 0; saves.save(s, { thumb: th }); }
  }
  // qualité automatique : on allège si l'appareil peine
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 4) {
    const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
    if (prefs.quality === 'auto' && fps < 28 && document.visibilityState === 'visible') {
      lowFps++;
      if (lowFps >= 2 && view.quality !== 'bas') { view.setQuality(view.quality === 'haut' ? 'moyen' : 'bas'); lowFps = 0; }
    } else lowFps = 0;
  }
  requestAnimationFrame(loop);
}
function safeThumb() { try { return view.screenshot(192); } catch (e) { return null; } }

// ---------------------------------------------------------------------
// Événements de la simulation
// ---------------------------------------------------------------------
function handleEvents(ev) {
  let month = false;
  for (const e of ev) {
    if (e.type === 'log') {
      if (panel !== 'log') $('dot-log').hidden = false;
      if (e.kind === 'alert') { toast(e.text, 'bad'); sfx('alert'); }
      else if (e.kind === 'quest' || e.kind === 'tech' || e.kind === 'money' || e.kind === 'event') { toast(e.text, 'gold'); sfx('coin'); }
    } else if (e.type === 'milestone') {
      sfx('fanfare');
      const ms = MILESTONES[e.i];
      const unl = Object.entries(BUILDINGS).filter(([, d]) => d.ms === e.i).map(([, d]) => d.name);
      const lv = LEVEL_MILESTONE.indexOf(e.i);
      modal({
        kicker: 'Nouveau palier', title: `${s.name} devient : ${ms.name}`,
        text: `<p>Prime de ${money(ms.reward)}. L'hôtel de ville s'agrandit.</p>${unl.length || lv > 0 ? `<ul>${lv > 0 ? `<li>Les bâtiments peuvent monter au niveau ${lv}${lv === 4 ? ' (avec la recherche Gratte-ciel)' : ''}</li>` : ''}${unl.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}`,
        actions: [['Super !', null, true]],
      });
      saves.save(s, { reason: 'backup', thumb: safeThumb() });
      buildTools();
    } else if (e.type === 'tech') { buildTools(); $('dot-research').hidden = !!s.research.cur; }
    else if (e.type === 'news') setTicker(e.text);
    else if (e.type === 'month') month = true;
    else if (e.type === 'quest') { renderQuests(true); }
    else if (e.type === 'levelup' && e.b.id === selected) renderInfo();
    else if (e.type === 'removed' && e.b.id === selected) closeInfo();
  }
  if (month) {
    renderQuests(); renderRCI(); renderAdvice();
    if (panel && !panelBusy()) renderPanel();
    if (selected) renderInfo();
    if (!s.research.cur && Object.keys(TECHS).some((k) => S.techAvailable(s, k))) $('dot-research').hidden = false;
  }
}
function setTicker(t) { $('ticker').innerHTML = `<b>Aurore Matin</b>${esc(t)}`; }

// ---------------------------------------------------------------------
// Barre d'outils
// ---------------------------------------------------------------------
const OVERLAYS = [
  ['none', 'Aucun', 'Vue normale'], ['land', 'Valeur foncière', 'Où les bâtiments peuvent grandir'], ['happy', 'Bonheur', 'Humeur de chaque maison'],
  ['pollution', 'Pollution', 'Air sain en vert'], ['noise', 'Bruit', 'Calme en vert'], ['traffic', 'Circulation', 'Routes chargées en rouge'],
  ['power', 'Électricité et eau', 'Bâtiments privés en rouge'], ['police', 'Police', 'Couverture'], ['fire', 'Pompiers', 'Couverture'],
  ['health', 'Santé', 'Couverture'], ['edu', 'Éducation', 'Couverture'], ['leisure', 'Loisirs', 'Couverture'], ['transit', 'Transports', 'Couverture'],
];
const CATS = [
  { id: 'select', icon: '👆', name: 'Voir', direct: true },
  { id: 'road', icon: '🛣️', name: 'Routes' },
  { id: 'zone', icon: '🏘️', name: 'Zones' },
  { sep: true },
  { id: 'energie', icon: '⚡', name: 'Énergie' },
  { id: 'eau', icon: '💧', name: 'Eau' },
  { id: 'dechets', icon: '♻️', name: 'Déchets' },
  { id: 'securite', icon: '🚒', name: 'Sécurité' },
  { id: 'sante', icon: '🏥', name: 'Santé' },
  { id: 'education', icon: '🎓', name: 'Éducation' },
  { id: 'loisirs', icon: '🌳', name: 'Loisirs' },
  { id: 'transports', icon: '🚌', name: 'Transports' },
  { id: 'merveilles', icon: '🏛️', name: 'Merveilles' },
  { sep: true },
  { id: 'trees', icon: '🌲', name: 'Arbres', direct: true },
  { id: 'bulldoze', icon: '🧨', name: 'Démolir', direct: true },
  { id: 'overlay', icon: '🗺️', name: 'Calques' },
];
function buildTools() {
  const cur = tool ? (tool.kind === 'build' ? BUILDINGS[tool.type].dept : tool.kind) : 'select';
  $('tools').innerHTML = CATS.map((c) => {
    if (c.sep) return '<span class="sep" aria-hidden="true"></span>';
    const pressed = category === c.id || (!category && cur === c.id) || (c.id === 'overlay' && view && view.overlay && category === 'overlay');
    return `<button type="button" class="tool" data-cat="${c.id}" aria-pressed="${pressed}"><i aria-hidden="true">${c.icon}</i><span>${c.name}</span></button>`;
  }).join('');
  if (category) renderFlyout();
}
function renderFlyout() {
  const fl = $('flyout');
  if (!category) { fl.hidden = true; document.body.classList.remove('fly-open'); return; }
  let html = '';
  if (category === 'road') {
    html = Object.entries(ROADS).map(([k, r]) => item({ key: `road:${k}`, name: r.name, price: `${money(S.costOf(s, r.cost))} / case`, text: `Entretien ${r.upkeep} €/mois. Glisse pour tracer.`, locked: !S.roadUnlocked(s, +k), lockText: r.tech ? `Recherche : ${TECHS[r.tech].name}` : '', pressed: tool && tool.kind === 'road' && tool.k === +k }));
  } else if (category === 'zone') {
    html = Object.entries(ZONES).map(([z, Z]) => item({ key: `zone:${z}`, name: `<span class="sw" style="background:${Z.color}"></span>${Z.name}`, price: `${money(S.costOf(s, 2))} / case`, text: zoneText(+z), locked: !S.zoneUnlocked(s, +z), lockText: Z.tech ? `Recherche : ${TECHS[Z.tech].name}` : '', pressed: tool && tool.kind === 'zone' && tool.z === +z })).join('')
      + item({ key: 'zone:0', name: 'Retirer la zone', price: 'Gratuit', text: 'Efface les zones (et les bâtiments dessus).', pressed: tool && tool.kind === 'zone' && tool.z === 0 });
  } else if (category === 'overlay') {
    html = OVERLAYS.map(([k, n, t]) => item({ key: `overlay:${k}`, name: n, price: '', text: t, pressed: (view.overlay || 'none') === k }));
  } else {
    html = Object.entries(BUILDINGS).filter(([, d]) => d.dept === category).map(([k, d]) => {
      const locked = !S.isUnlocked(s, k);
      const built = d.wonder && s.buildings.some((b) => b.type === k);
      let lockText = '';
      if (built) lockText = 'Déjà bâtie';
      else if (d.tech && !s.techs[d.tech]) lockText = `Recherche : ${TECHS[d.tech].name}`;
      else if (d.ms && s.milestone < d.ms) lockText = `Palier : ${MILESTONES[d.ms].name}`;
      return item({ key: `build:${k}`, name: d.name, price: `${money(S.costOf(s, d.cost))}`, text: `${buildingSummary(d)}`, locked, lockText, pressed: tool && tool.kind === 'build' && tool.type === k });
    }).join('');
  }
  fl.innerHTML = Array.isArray(html) ? html.join('') : html;
  fl.hidden = false;
  document.body.classList.add('fly-open');
}
function zoneText(z) { return { 1: 'Maisons puis immeubles et tours.', 2: 'Boutiques et centres commerciaux.', 3: 'Usines : des emplois, mais de la pollution.', 4: 'Bureaux propres, aiment l\'éducation.' }[z]; }
function buildingSummary(d) {
  const bits = [];
  if (d.power > 0) bits.push(`${fmt(d.power)} MW`);
  if (d.water) bits.push(`${fmt(d.water)} m³ d'eau`);
  if (d.sewage) bits.push(`${fmt(d.sewage)} m³ traités`);
  if (d.garbage) bits.push(`${fmt(d.garbage)} t de déchets`);
  if (d.cap) bits.push(`${fmt(d.cap)} places`);
  if (d.r) bits.push(`rayon ${d.r}`);
  if (d.research) bits.push(`+${d.research} recherche`);
  if (d.homes) bits.push(`${fmt(d.homes)} habitants`);
  bits.push(`${fmt(d.upkeep)} €/mois`);
  return `${esc(d.text)}<br>${bits.join(' · ')}`;
}
function item({ key, name, price, text, locked, lockText, pressed }) {
  return `<button type="button" class="item ${locked ? 'locked' : ''}" data-item="${key}" aria-pressed="${!!pressed}" ${locked ? 'aria-disabled="true"' : ''}><b>${name}</b>${price ? `<span class="price">${price}</span>` : ''}<small>${locked ? `🔒 ${esc(lockText)}` : text}</small></button>`;
}
function onCat(id) {
  sfx('click');
  if (id === 'select') { setTool(null); category = null; renderFlyout(); buildTools(); return; }
  if (id === 'trees') { category = null; setTool({ kind: 'trees' }); return; }
  if (id === 'bulldoze') { category = null; setTool({ kind: 'bulldoze' }); return; }
  category = category === id ? null : id;
  buildTools();
  renderFlyout();
}
function onItem(key, locked) {
  if (locked) { sfx('error'); return; }
  sfx('click');
  const [kind, v] = key.split(':');
  if (kind === 'overlay') { view.setOverlay(v); renderFlyout(); return; }
  if (kind === 'road') setTool({ kind: 'road', k: +v });
  else if (kind === 'zone') setTool({ kind: 'zone', z: +v });
  else if (kind === 'build') setTool({ kind: 'build', type: v });
  renderFlyout();
}
function setTool(t) {
  tool = t;
  cancelDrag();
  view.hideGhost(); view.clearPreview(); view.setCursor(null);
  $('place-bar').hidden = true; pendingPlace = null;
  const c = view.controls;
  // avec un outil, un doigt dessine ; deux doigts déplacent et zooment
  if (t) {
    c.mouseButtons = { LEFT: -1, MIDDLE: 1, RIGHT: 2 };
    c.touches = { ONE: -1, TWO: 2 };
    closeInfo();
  } else {
    c.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
    c.touches = { ONE: 1, TWO: 3 };
  }
  if (t && t.kind === 'bulldoze') toast('Glisse sur ce que tu veux démolir.');
  buildTools();
  if (t && t.kind === 'build' && isTouch()) toast('Touche la carte pour placer le bâtiment.');
}

// ---------------------------------------------------------------------
// Pointeur sur la carte
// ---------------------------------------------------------------------
const pointers = new Map();
let drag = null, down = null, pendingPlace = null;
const costTag = document.createElement('div');
costTag.className = 'toast'; costTag.style.cssText = 'position:fixed;animation:none;pointer-events:none;z-index:6;font-size:.8rem;padding:5px 10px;display:none';
document.body.appendChild(costTag);

function bindCanvas() {
  const cv = $('scene');
  cv.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, e);
    if (!playing) return;
    if (pointers.size > 1) { cancelDrag(); return; }
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (!tool || e.button !== 0) return;
    const p = view.pick(e.clientX, e.clientY);
    if (!p || !p.inside) return;
    if (tool.kind === 'build') { moveGhost(p, true); return; }
    drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    updateDragPreview(e);
  });
  cv.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
    if (!playing) return;
    const p = view.pick(e.clientX, e.clientY);
    if (drag && p) {
      const x = Math.max(0, Math.min(N - 1, p.x)), y = Math.max(0, Math.min(N - 1, p.y));
      if (x !== drag.x1 || y !== drag.y1) { drag.x1 = x; drag.y1 = y; updateDragPreview(e); }
      else moveCostTag(e);
      return;
    }
    if (tool && tool.kind === 'build' && p && p.inside && (e.pointerType === 'mouse' || pointers.has(e.pointerId))) { moveGhost(p, false); return; }
    if (e.pointerType === 'mouse' && p && p.inside && tool) view.setCursor(p.x, p.y, 1, tool.kind === 'bulldoze' ? '#ff6b5b' : '#ffffff');
    else if (e.pointerType === 'mouse' && p && p.inside && !tool && !pointers.size) {
      const b = p.bid && s.byId.get(p.bid);
      if (b) view.setCursor(b.x, b.y, S.sizeOf(b), '#ffe28a'); else view.setCursor(p.x, p.y, 1, 'rgba(255,255,255,0.6)');
    }
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (!playing) return;
    if (drag) { applyDrag(); return; }
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dtm = performance.now() - down.t;
    down = null;
    if (moved > 8 || dtm > 500) return;
    const p = view.pick(e.clientX, e.clientY);
    if (!p) return;
    if (tool && tool.kind === 'build') {
      if (e.pointerType === 'mouse') tryPlace(p.x, p.y);
      return;
    }
    if (!tool) {
      const b = p.bid ? s.byId.get(p.bid) : (p.inside && s.bld[idx(p.x, p.y)] ? s.byId.get(s.bld[idx(p.x, p.y)]) : null);
      if (b) { select(b.id); sfx('click'); } else if (p.inside) showTileInfo(p.x, p.y);
    }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); cancelDrag(); });
  cv.addEventListener('pointerleave', () => { if (!drag) view.setCursor(null); });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
}
function dragTiles() {
  if (!drag) return [];
  if (tool.kind === 'road') return S.linePath(drag.x0, drag.y0, drag.x1, drag.y1);
  return S.rectTiles(drag.x0, drag.y0, drag.x1, drag.y1);
}
function updateDragPreview(e) {
  const tiles = dragTiles();
  let plan, color;
  if (tool.kind === 'road') { plan = S.planRoad(s, tiles, tool.k); color = '#9fb4c8'; }
  else if (tool.kind === 'zone') { plan = S.planZone(s, tiles, tool.z); color = tool.z ? ZONES[tool.z].color : '#ff8a7a'; }
  else if (tool.kind === 'bulldoze') { plan = S.planBulldoze(s, tiles); color = '#ff5b4b'; }
  else { plan = S.planTrees(s, tiles); color = '#3fae55'; }
  const tooMuch = plan.cost > s.money;
  view.showPreview(tiles.map(([x, y]) => [x, y, tooMuch ? '#ff3b30' : null]), color);
  costTag.style.display = 'block';
  costTag.className = `toast ${tooMuch ? 'bad' : ''}`;
  costTag.style.animation = 'none';
  const n = tool.kind === 'road' ? plan.n : plan.n;
  costTag.textContent = `${n} ${n > 1 ? 'cases' : 'case'} · ${money(plan.cost)}${tooMuch ? ' · pas assez d\'argent' : ''}`;
  moveCostTag(e);
}
function moveCostTag(e) { if (e) { costTag.style.left = `${e.clientX + 16}px`; costTag.style.top = `${e.clientY - 40}px`; } }
function applyDrag() {
  const tiles = dragTiles();
  let r;
  if (tool.kind === 'road') { r = S.buildRoad(s, tiles, tool.k); if (r.ok) sfx('road'); }
  else if (tool.kind === 'zone') { r = S.applyZone(s, tiles, tool.z); if (r.ok) sfx('zone'); }
  else if (tool.kind === 'bulldoze') { r = S.bulldoze(s, tiles); if (r.ok) sfx('demolish'); }
  else { r = S.plantTrees(s, tiles); if (r.ok) sfx('zone'); }
  if (r && !r.ok && r.msg) { toast(r.msg, 'bad'); sfx('error'); }
  if (r && r.ok) { afterAction(); if (tool.kind === 'road') view.buildHighway(); }
  cancelDrag();
}
function cancelDrag() { drag = null; if (view) view.clearPreview(); costTag.style.display = 'none'; }
function moveGhost(p, fromTap) {
  const d = BUILDINGS[tool.type], sz = d.size;
  const x = Math.max(0, Math.min(N - sz, p.x - Math.floor((sz - 1) / 2))), y = Math.max(0, Math.min(N - sz, p.y - Math.floor((sz - 1) / 2)));
  const c = S.canPlace(s, tool.type, x, y);
  view.showGhost(tool.type, x, y, c.ok);
  if (isTouch() || fromTap && !matchMedia('(pointer: fine)').matches) {
    pendingPlace = { x, y };
    $('place-bar').hidden = false;
    $('place-text').textContent = c.ok ? `${d.name} · ${money(c.cost)}` : c.msg;
    $('place-ok').disabled = !c.ok;
  }
  pendingPlace = { x, y };
}
function tryPlace(px, py) {
  const d = BUILDINGS[tool.type], sz = d.size;
  const x = pendingPlace ? pendingPlace.x : Math.max(0, Math.min(N - sz, px - Math.floor((sz - 1) / 2)));
  const y = pendingPlace ? pendingPlace.y : Math.max(0, Math.min(N - sz, py - Math.floor((sz - 1) / 2)));
  const r = S.placeBuilding(s, tool.type, x, y);
  if (!r.ok) { toast(r.msg, 'bad'); sfx('error'); return; }
  sfx('build');
  toast(`${d.name} en construction.`);
  afterAction();
  if (d.wonder || !S.isUnlocked(s, tool.type)) { setTool(null); category = null; renderFlyout(); }
  else { $('place-bar').hidden = true; pendingPlace = null; view.hideGhost(); renderFlyout(); }
}
function afterAction() {
  saves.soon(s);
  renderTop(); renderQuests(); renderAdvice();
  S.checkQuests(s);
  handleEvents(s.events.splice(0));
}

// ---------------------------------------------------------------------
// Sélection et fiches
// ---------------------------------------------------------------------
function select(id) {
  selected = id;
  const b = s.byId.get(id);
  view.showSelection(b);
  view.setCursor(b.x, b.y, S.sizeOf(b), '#ffe28a');
  renderInfo();
}
function closeInfo() { selected = null; $('info').hidden = true; document.body.classList.remove('info-open'); if (view) { view.showSelection(null); view.setCursor(null); } }
function stars(l, max = 4) { return `<span class="stars" aria-label="niveau ${l} sur ${max}">${'★'.repeat(l)}<em>${'★'.repeat(Math.max(0, max - l))}</em></span>`; }
function meter(label, v, max = 100, suffix = '') {
  const p = Math.max(0, Math.min(100, v / max * 100));
  return `<div class="meter"><span>${label}</span><div class="progress"><i style="width:${p}%;background:${p < 35 ? 'var(--bad)' : p < 60 ? 'var(--warn)' : 'linear-gradient(90deg,var(--good),#a6f0bc)'}"></i></div><b>${Math.round(v)}${suffix}</b></div>`;
}
function renderInfo() {
  const b = selected && s.byId.get(selected);
  if (!b) { closeInfo(); return; }
  const f = s.f, i = idx(b.x, b.y);
  let h = '';
  if (b.type === 'Z') {
    const Z = ZONES[b.z];
    const kind = b.z === 1 ? ['Maison', 'Maisons de ville', 'Immeuble', 'Tour d\'habitation'][b.lvl - 1] : b.z === 2 ? ['Boutique', 'Magasin', 'Grand magasin', 'Tour commerciale'][b.lvl - 1] : b.z === 3 ? ['Atelier', 'Usine', 'Complexe industriel', 'Usine high-tech'][b.lvl - 1] : ['Petits bureaux', 'Immeuble de bureaux', 'Tour de bureaux', 'Gratte-ciel'][b.lvl - 1];
    const people = S.peopleOf(s, b);
    h += `<h3>${kind}</h3><p class="sub">${Z.name} · ${stars(b.lvl)} · ${b.z === 1 ? `${people} habitants` : `${people} emplois`}</p>`;
    if (b.cons) h += '<p class="next">🏗️ En construction…</p>';
    else if (b.fire) h += '<p class="next">🔥 En feu ! Une caserne de pompiers proche l\'éteindra.</p>';
    else if (b.ab) h += '<p class="next">🏚️ Abandonné. Il sera réoccupé si le quartier redevient agréable (électricité, bonheur, demande).</p>';
    const hr = S.happinessOf(s, b, true);
    h += meter(b.z === 1 ? 'Bonheur' : 'Satisfaction', hr.h, 100, ' %');
    h += meter('Valeur foncière', f.land[i]);
    h += meter('Air sain', 100 - Math.min(100, f.pollution[i] * 100));
    h += `<div class="status"><span class="${b.pow !== false ? 'ok' : 'ko'}">⚡ ${b.pow !== false ? 'Électricité' : 'Pas d\'électricité'}</span><span class="${b.wat !== false ? 'ok' : 'ko'}">💧 ${b.wat !== false ? 'Eau' : 'Pas d\'eau'}</span></div>`;
    if (hr.reasons.length) h += `<ul class="reasons">${hr.reasons.slice(0, 7).map(([v, w]) => `<li class="${v > 0 ? 'p' : 'n'}">${v > 0 ? '+' : ''}${v} ${esc(w)}</li>`).join('')}</ul>`;
    h += `<p class="next">${nextLevelText(b, hr.h)}</p>`;
    h += `<div class="row"><button type="button" class="btn small danger" data-act="demolish">Démolir</button></div>`;
  } else {
    const d = BUILDINGS[b.type], sv = S.svc(b);
    h += `<h3>${esc(d.name)}</h3><p class="sub">${d.up ? `${stars(b.lvl, d.up.length + 1)} · ` : b.type === 'mairie' ? `${stars(b.lvl)} · ` : ''}${d.dept ? DEPTS[d.dept] : 'Hôtel de ville'}${d.upkeep ? ` · ${fmt(d.upkeep * (1 + 0.5 * (b.lvl - 1)))} €/mois` : ''}</p>`;
    h += `<p class="help">${esc(d.text)}</p>`;
    if (b.cons) h += '<p class="next">🏗️ En construction…</p>';
    const bits = [];
    if (d.power > 0) bits.push(`⚡ ${fmt(d.power * Math.min(1.25, S.fundOf(s, d.dept)))} MW`);
    if (d.water) bits.push(`💧 ${fmt(d.water)} m³`);
    if (d.garbage) bits.push(`♻️ ${fmt(d.garbage)} t`);
    if (sv.cap) bits.push(`${fmt(sv.cap)} places`);
    if (sv.r) bits.push(`Rayon ${sv.r}`);
    if (d.research) bits.push(`🔬 +${d.research * (1 + 0.5 * (b.lvl - 1))} / mois`);
    if (d.tourism) bits.push(`🧳 ${fmt(d.tourism)} €/mois`);
    if (bits.length) h += `<div class="status">${bits.map((x) => `<span>${x}</span>`).join('')}</div>`;
    if (d.dept) h += `<p class="help">Budget ${DEPTS[d.dept].toLowerCase()} : ${s.funding[d.dept]} %. Un budget plus haut rend ces bâtiments plus efficaces.</p>`;
    if (b.type === 'mairie') {
      const m = s.m;
      h += `<div class="status"><span>👥 ${fmt(m.pop)} habitants</span><span>💼 ${fmt(m.totalJobs)} emplois</span><span>Chômage ${Math.round(m.unemployment * 100)} %</span></div>`;
      h += `<p class="next">L'hôtel de ville grandit avec les paliers de population. Prochain palier : ${s.milestone < MILESTONES.length - 1 ? `${MILESTONES[s.milestone + 1].name} à ${fmt(MILESTONES[s.milestone + 1].pop)} habitants` : 'tous atteints !'}.</p>`;
    }
    const uc = S.upgradeCost(s, b);
    h += '<div class="row">';
    if (uc != null) {
      const u = d.up[b.lvl - 1];
      h += `<button type="button" class="btn small primary" data-act="upgrade" ${uc > s.money || b.cons ? 'disabled' : ''}>Améliorer (${money(uc)})</button>`;
      h += `</div><p class="help">Niveau ${b.lvl + 1} : rayon ${u.r}${u.cap ? `, ${fmt(u.cap)} places` : ''}. Le bâtiment s'agrandit.</p><div class="row">`;
    }
    if (!d.fixed) h += `<button type="button" class="btn small danger" data-act="demolish">Démolir</button>`;
    h += '</div>';
  }
  $('info-body').innerHTML = h;
  $('info').hidden = false;
  document.body.classList.add('info-open');
}
function nextLevelText(b, happy) {
  const maxL = S.maxLevel(s);
  if (b.lvl >= 4) return 'Niveau maximum atteint. Bravo !';
  const next = b.lvl + 1;
  if (next > maxL) {
    if (s.milestone < LEVEL_MILESTONE[next]) return `Pour monter au niveau ${next} : la ville doit atteindre le palier ${MILESTONES[LEVEL_MILESTONE[next]].name}.`;
    return `Pour monter au niveau ${next} : termine la recherche Gratte-ciel.`;
  }
  const need = [];
  const landNeed = LEVEL_LAND[next] * (b.z === 3 ? 0.55 : 1);
  if (s.f.land[idx(b.x, b.y)] < landNeed) need.push(`valeur foncière ${Math.round(landNeed)} (parcs, services, moins de pollution)`);
  if (happy < 38 + 5 * next) need.push(`${38 + 5 * next} % de bonheur`);
  if (b.pow === false) need.push('de l\'électricité');
  if (b.wat === false) need.push('de l\'eau');
  if (next >= 3 && (b.z === 2 || b.z === 4) && s.f.edu[idx(b.x, b.y)] <= 0.25) need.push('une école à proximité');
  if (s.demand[b.z] <= -0.15) need.push('plus de demande pour ce type de zone');
  if (b.z === 3 && next === 4 && !s.techs.tertiaire) need.push('la recherche Économie tertiaire');
  return need.length ? `Pour monter au niveau ${next}, il faut : ${need.join(', ')}.` : `Tout est prêt : il montera bientôt au niveau ${next}.`;
}
function showTileInfo(x, y) {
  const i = idx(x, y), f = s.f;
  selected = null;
  view.showSelection(null); view.setCursor(x, y, 1, '#ffffff');
  const t = s.terrain[i] === 1 ? 'Eau' : s.road[i] ? ROADS[s.road[i]].name : s.zone[i] ? `Zone ${ZONES[s.zone[i]].name.toLowerCase()} libre` : s.trees[i] ? 'Forêt' : 'Terrain libre';
  let h = `<h3>${t}</h3><p class="sub">Case ${x}, ${y}</p>`;
  if (s.road[i]) h += meter('Circulation', Math.min(100, f.traffic[i] * 70), 100, ' %');
  else if (s.terrain[i] !== 1) {
    h += meter('Valeur foncière', f.land[i]);
    h += meter('Air sain', 100 - Math.min(100, f.pollution[i] * 100));
    h += meter('Calme', 100 - Math.min(100, f.noise[i] * 100));
    if (s.zone[i] && f.roadDist[i] > 2) h += '<p class="next">Trop loin d\'une route : rien ne poussera ici.</p>';
    else if (s.zone[i] && s.demand[s.zone[i]] <= 0) h += '<p class="next">Pas de demande pour cette zone en ce moment.</p>';
    else if (s.zone[i] && !s.m.powerCap) h += '<p class="next">Il faut de l\'électricité pour que la zone se construise.</p>';
  }
  $('info-body').innerHTML = h;
  $('info').hidden = false;
  document.body.classList.add('info-open');
}

// ---------------------------------------------------------------------
// Bandeau, demande, objectifs
// ---------------------------------------------------------------------
function renderAll() { renderTop(); renderRCI(); renderQuests(); renderAdvice(); renderSpeed(); setTicker(s.newsLine || `Bienvenue à ${s.name} !`); }
function renderTop() {
  const m = s.m;
  $('city-name').textContent = s.name;
  $('city-rank').textContent = MILESTONES[s.milestone].name;
  $('money').textContent = money(s.money);
  $('money').classList.toggle('neg', s.money < 0);
  const net = $('net');
  net.textContent = `${signed(m.net)} € / mois`;
  net.className = m.net >= 0 ? 'pos' : 'neg';
  $('pop').textContent = fmt(m.pop);
  const nx = MILESTONES[s.milestone + 1];
  $('pop-d').textContent = nx ? `${nx.name} à ${fmt(nx.pop)}` : 'habitants';
  $('happy').textContent = `${Math.round(m.happy)} %`;
  $('happy-ico').textContent = m.happy >= 70 ? '😄' : m.happy >= 50 ? '🙂' : m.happy >= 35 ? '😐' : '😟';
  $('date').textContent = S.dateText(s.tick);
  const w = view.weather;
  $('weather-ico').textContent = view.night > 0.6 && w.kind === 'clair' ? '🌙' : { clair: '☀️', nuageux: '⛅', pluie: '🌧️', neige: '❄️', brume: '🌫️' }[w.kind] || '☀️';
  $('season').textContent = `${SEASONS[S.dateOf(s.tick).season]} · ${{ clair: 'dégagé', nuageux: 'nuageux', pluie: w.target === 'orage' ? 'orage' : 'pluie', neige: 'neige', brume: 'brume' }[w.kind] || ''}`;
  renderSaveIndicator();
}
function renderSaveIndicator() {
  const el = $('save-ind');
  if (!el) return;
  el.dataset.state = saves.status;
  const ago = saves.lastSaved ? agoText(saves.lastSaved) : '';
  const txt = { idle: 'Sauvegarde auto', local: `Sauvegardé ${ago}`, cloud: `Sur ton compte ${ago}`, saving: 'Sauvegarde…', error: 'Sauvegarde en attente' }[saves.status] || '';
  $('save-text').textContent = txt;
  el.title = `${txt}. Sauvegarde automatique toutes les 15 secondes et après chaque action.`;
}
function agoText(ts) {
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 5) return 'à l\'instant';
  if (sec < 60) return `il y a ${sec} s`;
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  return `il y a ${Math.floor(sec / 3600)} h`;
}
function renderRCI() {
  for (const el of document.querySelectorAll('.rci .bar')) {
    const z = +el.dataset.z, v = s.demand[z];
    const locked = !S.zoneUnlocked(s, z);
    el.classList.toggle('locked', locked);
    const i = el.querySelector('i');
    const hgt = Math.abs(v) * 50;
    if (v >= 0) { i.style.bottom = 'calc(18px + (100% - 18px) / 2)'; i.style.top = ''; i.style.height = `calc((100% - 18px) * ${hgt / 100})`; i.style.opacity = 1; }
    else { i.style.top = 'calc((100% - 18px) / 2)'; i.style.bottom = ''; i.style.height = `calc((100% - 18px) * ${hgt / 100})`; i.style.opacity = 0.45; }
    el.title = `${ZONES[z].name} : ${locked ? 'pas encore débloqué' : v > 0.15 ? 'forte demande' : v > 0 ? 'demande faible' : 'pas de demande'}`;
  }
}
function renderQuests(flash) {
  const qs = S.activeQuests(s, 3);
  $('q-list').innerHTML = qs.length ? qs.map((q) => `<li>${esc(q.text)}<small>+${money(q.reward)}</small></li>`).join('') : '<li>Tous les objectifs sont atteints !</li>';
  if (flash) $('q-list').firstElementChild?.classList.add('done');
}
function renderAdvice() { const a = S.advice(s); $('advice').textContent = a.length ? `💡 ${a[0]}` : ''; }
function renderSpeed() { for (const b of document.querySelectorAll('.speed button')) b.setAttribute('aria-pressed', String(+b.dataset.speed === speed)); }
function setSpeed(v) { if (v > 0) lastSpeed = v; speed = v; renderSpeed(); }

// ---------------------------------------------------------------------
// Panneaux
// ---------------------------------------------------------------------
const PANELS = { budget: 'Budget', research: 'Recherche', policies: 'Décrets', stats: 'Statistiques', goals: 'Paliers et objectifs', log: 'Journal', settings: 'Réglages' };
let statRange = 24;
function openPanel(name) {
  if (panel === name) { closePanel(); return; }
  panel = name;
  $('panel').hidden = false;
  $('panel-title').textContent = PANELS[name];
  for (const b of document.querySelectorAll('.panels-nav button')) b.setAttribute('aria-pressed', String(b.dataset.panel === name));
  if (name === 'log') $('dot-log').hidden = true;
  if (name === 'research') $('dot-research').hidden = true;
  renderPanel();
  if (isTouch()) closeInfo();
}
function closePanel() {
  panel = null; $('panel').hidden = true;
  for (const b of document.querySelectorAll('.panels-nav button')) b.setAttribute('aria-pressed', 'false');
}
function panelBusy() { const a = document.activeElement; return a && $('panel').contains(a) && (a.type === 'range' || a.tagName === 'TEXTAREA'); }
function renderPanel() {
  if (!panel) return;
  const body = $('panel-body');
  const scroll = body.scrollTop;
  body.innerHTML = ({ budget: budgetHtml, research: researchHtml, policies: policiesHtml, stats: statsHtml, goals: goalsHtml, log: logHtml, settings: settingsHtml })[panel]();
  body.scrollTop = scroll;
  if (panel === 'stats') drawCharts();
}
function budgetHtml() {
  const m = s.m, lm = s.lastMonth;
  const incNames = { R: 'Impôts résidentiels', C: 'Impôts commerciaux', I: 'Impôts industriels', O: 'Impôts des bureaux', tourisme: 'Tourisme' };
  const expNames = { services: 'Services publics', routes: 'Entretien des routes', decrets: 'Décrets', emprunts: 'Emprunts' };
  let h = `<div class="kpis"><div class="kpi"><b>${money(s.money)}</b><small>Trésorerie</small></div><div class="kpi"><b class="${m.net >= 0 ? 'pos' : 'neg'}">${signed(m.net)} €</b><small>Ce mois-ci</small></div><div class="kpi"><b>${lm ? `${signed(lm.net)} €` : '—'}</b><small>Mois dernier</small></div></div>`;
  h += '<h3>Impôts</h3><p>Plus d\'impôts remplit les caisses, mais freine la demande et le bonheur.</p>';
  for (const z of [1, 2, 3, 4]) {
    if (!S.zoneUnlocked(s, z)) continue;
    const key = { 1: 'R', 2: 'C', 3: 'I', 4: 'O' }[z];
    h += `<div class="slider"><label for="tax-${z}">${ZONES[z].name}</label><output id="tax-o-${z}">${s.taxes[z]} %</output><input type="range" id="tax-${z}" data-tax="${z}" min="0" max="20" step="1" value="${s.taxes[z]}"><small>Rapporte ${money(m.income[key])} par mois</small></div>`;
  }
  h += '<h3>Recettes et dépenses du mois</h3><table class="money">';
  for (const [k, v] of Object.entries(m.income)) if (v > 0.5 || k !== 'tourisme') h += `<tr><td>${incNames[k]}</td><td class="pos">+${money(v)}</td></tr>`;
  for (const [k, v] of Object.entries(m.expense)) if (v > 0.5) h += `<tr><td>${expNames[k]}</td><td class="neg">−${money(v)}</td></tr>`;
  h += `<tr class="total"><td>Solde</td><td class="${m.net >= 0 ? 'pos' : 'neg'}">${signed(m.net)} €</td></tr></table>`;
  h += '<h3>Budget des services</h3><p>Entre 50 % et 150 %. Moins de budget : moins d\'efficacité. Plus de budget : plus d\'effet (jusqu\'à 125 %).</p>';
  for (const [d, name] of Object.entries(DEPTS)) {
    const cost = m.upkeepBy[d] || 0;
    if (!cost && !s.buildings.some((b) => BUILDINGS[b.type] && BUILDINGS[b.type].dept === d)) continue;
    h += `<div class="slider"><label for="fund-${d}">${name}</label><output id="fund-o-${d}">${s.funding[d]} %</output><input type="range" id="fund-${d}" data-fund="${d}" min="50" max="150" step="5" value="${s.funding[d]}"><small>Coûte ${money(cost)} par mois</small></div>`;
  }
  h += '<h3>Emprunts</h3><p>À rembourser en 4 ans, avec 24 % d\'intérêts au total.</p>';
  if (s.loans.length) h += `<ul class="backups">${s.loans.map((l, i) => `<li><span>${money(l.amount)}<small>Reste ${money(l.left)} · ${money(l.monthly)} / mois</small></span><button type="button" class="btn small" data-repay="${i}" ${s.money < l.left ? 'disabled' : ''}>Rembourser</button></li>`).join('')}</ul>`;
  h += `<div class="row">${S.LOANS.map((a) => `<button type="button" class="btn small" data-loan="${a}" ${s.loans.length >= 3 ? 'disabled' : ''}>Emprunter ${money(a)}</button>`).join('')}</div>`;
  return h;
}
function researchHtml() {
  const m = s.m, cur = s.research.cur && TECHS[s.research.cur];
  let h = `<p>Les écoles, lycées, universités et bibliothèques produisent des points de recherche : <b>${Math.round(m.research * 10) / 10} par mois</b>.</p>`;
  if (cur) h += `<div class="card on"><div class="top-line"><b>En cours : ${esc(cur.name)}</b><small>${Math.floor(s.research.pts)} / ${cur.cost}</small></div><div class="progress"><i style="width:${Math.min(100, s.research.pts / cur.cost * 100)}%"></i></div><span>${esc(cur.text)}</span><small>${m.research > 0 ? `Encore environ ${Math.max(1, Math.ceil((cur.cost - s.research.pts) / m.research))} mois` : 'Construis une école pour avancer plus vite.'}</small></div>`;
  h += '<h3>Arbre des recherches</h3><div class="cards">';
  for (const [k, t] of Object.entries(TECHS)) {
    const done = !!s.techs[k], avail = S.techAvailable(s, k), on = s.research.cur === k;
    const req = t.req.filter((r) => !s.techs[r]).map((r) => TECHS[r].name);
    h += `<button type="button" class="card ${done ? 'done' : on ? 'on' : avail ? '' : 'locked'}" data-tech="${k}" ${!avail || on ? 'disabled' : ''}><div class="top-line"><b>${esc(t.name)}</b><small>${done ? 'Terminée' : `${t.cost} points`}</small></div><span>${esc(t.text)}</span>${!done && req.length ? `<small>Il faut d'abord : ${req.map(esc).join(', ')}</small>` : ''}${avail && !on ? '<small>Touche pour étudier ce sujet</small>' : ''}</button>`;
  }
  return h + '</div>';
}
function policiesHtml() {
  let h = '<p>Les décrets changent la vie de la ville. Certains coûtent un peu chaque mois, par habitant.</p><div class="cards">';
  for (const [k, p] of Object.entries(POLICIES)) {
    const on = !!s.policies[k], locked = !on && s.milestone < (p.ms || 0);
    const cost = p.perRes ? `${money(p.perRes * s.m.pop)} / mois` : 'Gratuit';
    h += `<div class="card ${on ? 'on' : ''} ${locked ? 'locked' : ''}"><div class="pol"><span><b>${esc(p.name)}</b></span><label class="switch"><input type="checkbox" data-policy="${k}" ${on ? 'checked' : ''} ${locked ? 'disabled' : ''} aria-label="${esc(p.name)}"><i></i></label></div><span>${esc(p.text)}</span><small>${locked ? `🔒 Palier : ${MILESTONES[p.ms].name}` : cost}</small></div>`;
  }
  return h + '</div>';
}
function statsHtml() {
  const m = s.m;
  let h = `<div class="kpis"><div class="kpi"><b>${fmt(m.pop)}</b><small>Habitants</small></div><div class="kpi"><b>${fmt(m.totalJobs)}</b><small>Emplois</small></div><div class="kpi"><b>${Math.round(m.unemployment * 100)} %</b><small>Chômage</small></div>
    <div class="kpi"><b>${fmt(m.powerUse)}/${fmt(m.powerCap)}</b><small>Électricité (MW)</small></div><div class="kpi"><b>${fmt(m.waterUse)}/${fmt(m.waterCap)}</b><small>Eau (m³)</small></div><div class="kpi"><b>${fmt(m.garbage)}/${fmt(m.garbageCap)}</b><small>Déchets (t)</small></div>
    <div class="kpi"><b>${Math.round(m.healthRatio * 100)} %</b><small>Places de soins</small></div><div class="kpi"><b>${Math.round(m.eduRatio * 100)} %</b><small>Places d'école</small></div><div class="kpi"><b>${s.stats.fires}</b><small>Incendies</small></div></div>`;
  h += `<div class="seg" role="group" aria-label="Période">${[[24, '2 ans'], [120, '10 ans'], [9999, 'Tout']].map(([v, l]) => `<button type="button" data-range="${v}" aria-pressed="${statRange === v}">${l}</button>`).join('')}</div>`;
  const chart = (id, title, lines) => `<div class="chart"><h4>${title}${lines.length > 1 ? lines.map((l) => `<span class="leg"><i style="background:${l[1]}"></i>${l[0]}</span>`).join('') : ''}</h4><canvas id="ch-${id}" role="img" aria-label="${title}"></canvas><div class="tip" id="tip-${id}" hidden></div></div>`;
  h += chart('pop', 'Population', [['Habitants', SERIES[0]]]);
  h += chart('money', 'Trésorerie (€)', [['Trésorerie', SERIES[0]]]);
  h += chart('budget', 'Recettes et dépenses (€ par mois)', [['Recettes', SERIES[2]], ['Dépenses', SERIES[1]]]);
  h += chart('happy', 'Bonheur (%)', [['Bonheur', SERIES[0]]]);
  h += chart('power', 'Électricité (MW)', [['Consommée', SERIES[1]], ['Produite', SERIES[0]]]);
  h += chart('water', 'Eau (m³)', [['Consommée', SERIES[1]], ['Produite', SERIES[0]]]);
  h += chart('un', 'Chômage (%)', [['Chômage', SERIES[1]]]);
  return h;
}
function drawCharts() {
  const d = s.history.slice(-statRange);
  const c = (id, lines, o = {}) => { const cv = $(`ch-${id}`); if (cv) lineChart(cv, d, lines, { ...o, tooltipEl: $(`tip-${id}`) }); };
  c('pop', [{ name: 'Habitants', key: 'pop', color: SERIES[0] }]);
  c('money', [{ name: 'Trésorerie', key: 'money', color: SERIES[0] }], { unit: ' €' });
  c('budget', [{ name: 'Recettes', key: 'inc', color: SERIES[2] }, { name: 'Dépenses', key: 'exp', color: SERIES[1] }], { unit: ' €' });
  c('happy', [{ name: 'Bonheur', key: 'happy', color: SERIES[0] }], { unit: ' %', min: 0, max: 100 });
  c('power', [{ name: 'Consommée', key: 'pw', color: SERIES[1] }, { name: 'Produite', key: 'pc', color: SERIES[0] }], { unit: ' MW' });
  c('water', [{ name: 'Consommée', key: 'wu', color: SERIES[1] }, { name: 'Produite', key: 'wc', color: SERIES[0] }], { unit: ' m³' });
  c('un', [{ name: 'Chômage', key: 'un', color: SERIES[1] }], { unit: ' %', min: 0 });
}
function goalsHtml() {
  const cur = MILESTONES[s.milestone], nx = MILESTONES[s.milestone + 1];
  let h = `<div class="card on"><div class="top-line"><b>${esc(cur.name)}</b><small>${fmt(s.m.pop)} habitants</small></div>`;
  if (nx) {
    const p = (s.m.pop - cur.pop) / (nx.pop - cur.pop) * 100;
    const unl = Object.values(BUILDINGS).filter((d) => d.ms === s.milestone + 1).map((d) => d.name);
    h += `<div class="progress"><i style="width:${Math.max(2, Math.min(100, p))}%"></i></div><span>Prochain palier : <b>${esc(nx.name)}</b> à ${fmt(nx.pop)} habitants, prime de ${money(nx.reward)}.</span>${unl.length ? `<small>Débloque : ${unl.map(esc).join(', ')}</small>` : ''}`;
  } else h += '<span>Tous les paliers sont atteints. Aurore est une mégalopole !</span>';
  h += '</div><h3>Paliers</h3><div class="cards">';
  MILESTONES.forEach((ms, i) => { if (i) h += `<div class="card ${i <= s.milestone ? 'done' : 'locked'}"><div class="top-line"><b>${esc(ms.name)}</b><small>${fmt(ms.pop)} hab.</small></div><small>Prime ${money(ms.reward)}${LEVEL_MILESTONE.indexOf(i) > 0 ? ` · bâtiments de niveau ${LEVEL_MILESTONE.indexOf(i)}` : ''}</small></div>`; });
  h += '</div>';
  const done = QUESTS.filter((q) => s.quests[q.id]).length;
  h += `<h3>Objectifs (${done} / ${QUESTS.length})</h3><div class="cards">`;
  for (const q of QUESTS) h += `<div class="card ${s.quests[q.id] ? 'done' : ''}"><div class="top-line"><b>${esc(q.text)}</b><small>+${money(q.reward)}</small></div></div>`;
  return h + '</div>';
}
function logHtml() {
  const ico = { story: '📖', alert: '⚠️', milestone: '🏆', quest: '✅', tech: '🔬', money: '💶', event: '🎉', info: '📰' };
  return `<ul class="log-list">${s.log.map((l) => `<li class="${l.kind}"><span>${ico[l.kind] || '📰'}</span><span>${esc(l.text)}</span><small>${S.dateText(l.t)}</small></li>`).join('')}</ul>`;
}
function settingsHtml() {
  const seg = (name, cur, opts) => `<div class="seg" role="group" aria-label="${name}">${opts.map(([v, l]) => `<button type="button" data-pref="${name}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
  let h = '<h3>Sauvegarde</h3>';
  h += `<p>${esc(s.name)} se sauvegarde tout seul : toutes les 15 secondes, après chaque action et quand tu quittes la page${saves.cloud ? ', sur cet appareil et sur ton compte' : ', sur cet appareil'}. Dernière sauvegarde : <b>${saves.lastSaved ? agoText(saves.lastSaved) : 'pas encore'}</b>.</p>`;
  h += '<div class="row"><button type="button" class="btn small primary" data-act="save-now">Sauvegarder maintenant</button><button type="button" class="btn small" data-act="menu">Menu des villes</button></div>';
  const bks = saves.backups();
  h += '<h3>Copies de secours</h3><p>Une copie toutes les 3 minutes, à chaque palier et à chaque chargement (6 gardées).</p>';
  h += bks.length ? `<ul class="backups">${bks.map((b, i) => `<li><span>${new Date(b.ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}<small>${fmt(b.pop)} habitants · ${S.dateText(b.tick)} · ${esc(b.reason)}</small></span><button type="button" class="btn small" data-restore="${i}">Restaurer</button></li>`).join('')}</ul>` : '<p class="help">Pas encore de copie.</p>';
  h += '<h3>Changer d\'appareil</h3><p>Copie ce code et colle-le sur un autre appareil.</p>';
  h += '<div class="row"><button type="button" class="btn small" data-act="export">Copier mon code</button></div><textarea id="code" spellcheck="false" placeholder="Colle ici un code de sauvegarde"></textarea><div class="row"><button type="button" class="btn small" data-act="import">Charger ce code</button></div>';
  h += '<h3>Graphismes</h3>';
  h += seg('quality', prefs.quality, [['auto', 'Auto'], ['haut', 'Haut'], ['moyen', 'Moyen'], ['bas', 'Bas']]);
  h += `<p class="help">Actuellement : ${view.quality}. Haut ajoute l'éclat des lumières la nuit et des ombres plus fines.</p>`;
  h += '<h3>Jour et nuit</h3>';
  h += seg('dayMode', prefs.dayMode, [['cycle', 'Cycle'], ['jour', 'Toujours jour'], ['nuit', 'Toujours nuit']]);
  h += seg('dayLength', prefs.dayLength, [[180, 'Journée 3 min'], [360, '6 min'], [720, '12 min']]);
  h += '<h3>Météo</h3>';
  h += seg('weather', prefs.weather, [['auto', 'Selon la saison'], ['clair', 'Beau'], ['pluie', 'Pluie'], ['neige', 'Neige'], ['orage', 'Orage']]);
  h += '<h3>Son</h3>';
  h += seg('sound', prefs.sound, [[true, 'Activé'], [false, 'Coupé']]);
  h += '<h3>Partie</h3><div class="row"><button type="button" class="btn small" data-act="tutorial">Revoir l\'aide</button><button type="button" class="btn small danger" data-act="delete">Effacer cette ville</button></div>';
  h += '<p class="help" style="margin-top:14px">Raccourcis : espace pause · 1 2 3 vitesse · Q E tourner · flèches ou ZQSD déplacer · + − zoom · Échap annuler · P photo.</p>';
  return h;
}

// ---------------------------------------------------------------------
// Petites fenêtres et messages
// ---------------------------------------------------------------------
function toast(text, kind = '') {
  const el = document.createElement('p');
  el.className = `toast ${kind}`; el.textContent = text;
  const box = $('toasts');
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.remove(), 3500);
}
function modal({ kicker = '', title, text, actions }) {
  $('modal-kicker').textContent = kicker;
  $('modal-title').textContent = title;
  $('modal-text').innerHTML = text;
  const box = $('modal-actions');
  box.innerHTML = '';
  actions.forEach(([label, fn, primary]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `btn ${primary ? 'primary' : ''}`; b.textContent = label;
    b.onclick = () => { $('modal').hidden = true; if (fn) fn(); };
    box.appendChild(b);
  });
  $('modal').hidden = false;
  box.lastElementChild.focus();
}
function tutorial() {
  const steps = [
    ['Bienvenue, maire !', `<p>${esc(s.name)} n'est encore qu'un hôtel de ville au bout d'une route. À toi d'en faire une grande cité.</p><ul><li><b>Fais glisser</b> pour te déplacer, <b>pince</b> ou fais défiler pour zoomer.</li><li>Les boutons ⟲ ⟳ font tourner la vue.</li></ul>`],
    ['Routes et zones', '<ul><li>Choisis <b>Routes</b>, puis glisse sur la carte pour tracer.</li><li>Choisis <b>Zones</b> et peins le long des routes : vert pour les maisons, bleu pour les commerces, jaune pour les usines.</li><li>Les habitants construisent eux-mêmes, si la demande (les barres R C I) est positive.</li></ul>'],
    ['Électricité, eau, bonheur', '<ul><li>Rien ne pousse sans <b>électricité</b> : pose une éolienne ou une centrale.</li><li>Une <b>pompe</b> au bord de l\'eau apporte l\'eau.</li><li>Parcs, écoles, cliniques, police et pompiers rendent les habitants heureux : les maisons deviennent alors des immeubles puis des tours.</li><li>La ville se <b>sauvegarde toute seule</b>.</li></ul>'],
  ];
  let i = 0;
  const show = () => {
    const [t, x] = steps[i];
    modal({ kicker: `Aide ${i + 1} / ${steps.length}`, title: t, text: x, actions: i < steps.length - 1 ? [['Passer', () => { prefs.tutorial = false; savePrefs(); }], ['Suivant', () => { i++; show(); }, true]] : [['C\'est parti !', () => { prefs.tutorial = false; savePrefs(); }, true]] });
  };
  show();
}

// ---------------------------------------------------------------------
// Liaisons de l'interface
// ---------------------------------------------------------------------
function bindUI() {
  bindCanvas();
  $('btn-continue').onclick = () => { if (saves.meta.last) loadSlot(saves.meta.last); };
  $('slots').onclick = (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.new) openNewForm(+t.dataset.new);
    if (t.dataset.load) loadSlot(+t.dataset.load);
    if (t.dataset.del) {
      const n = +t.dataset.del, nm = saves.meta.slots[n].name;
      modal({ title: `Effacer ${nm} ?`, text: '<p>La ville et ses copies de secours seront supprimées de cet appareil. C\'est définitif.</p>', actions: [['Annuler'], ['Effacer', () => { saves.remove(n); buildMenu(); }, true]] });
    }
  };
  $('menu-new').onsubmit = startNew;
  $('new-back').onclick = () => { $('menu-main').hidden = false; $('menu-new').hidden = true; };
  $('tools').onclick = (e) => { const b = e.target.closest('[data-cat]'); if (b) onCat(b.dataset.cat); };
  $('flyout').onclick = (e) => { const b = e.target.closest('[data-item]'); if (b) onItem(b.dataset.item, b.classList.contains('locked')); };
  document.querySelector('.speed').onclick = (e) => { const b = e.target.closest('[data-speed]'); if (b) { setSpeed(+b.dataset.speed); sfx('click'); } };
  for (const b of document.querySelectorAll('[data-panel]')) b.addEventListener('click', () => { openPanel(b.dataset.panel); sfx('click'); });
  $('panel-close').onclick = closePanel;
  $('info-close').onclick = closeInfo;
  $('q-toggle').onclick = () => { const q = $('quests'); q.classList.toggle('collapsed'); $('q-toggle').setAttribute('aria-expanded', String(!q.classList.contains('collapsed'))); };
  if (matchMedia('(max-width: 760px)').matches) { $('quests').classList.add('collapsed'); $('q-toggle').setAttribute('aria-expanded', 'false'); }
  $('cam-rl').onclick = () => view.rotateBy(Math.PI / 4);
  $('cam-rr').onclick = () => view.rotateBy(-Math.PI / 4);
  $('cam-in').onclick = () => view.zoomBy(0.8);
  $('cam-out').onclick = () => view.zoomBy(1.25);
  $('cam-photo').onclick = photoMode;
  $('photo-exit').onclick = exitPhoto;
  $('photo-rotate').onclick = () => { view.autoRotate = !view.autoRotate; };
  $('photo-shot').onclick = () => {
    const url = view.screenshot();
    const a = document.createElement('a'); a.href = url; a.download = `${s.name.replace(/[^\w-]+/g, '_')}-${S.dateOf(s.tick).year}.png`; a.click();
    sfx('coin');
  };
  $('place-ok').onclick = () => { if (tool && tool.kind === 'build' && pendingPlace) tryPlace(pendingPlace.x, pendingPlace.y); };
  $('place-cancel').onclick = () => { $('place-bar').hidden = true; pendingPlace = null; view.hideGhost(); };
  // fiche
  $('info-body').onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const bd = selected && s.byId.get(selected);
    if (!bd) return;
    if (b.dataset.act === 'upgrade') {
      const r = S.upgradeBuilding(s, bd);
      if (!r.ok) { toast(r.msg, 'bad'); sfx('error'); } else { sfx('build'); toast(`${BUILDINGS[bd.type].name} amélioré au niveau ${bd.lvl}.`, 'gold'); afterAction(); renderInfo(); }
    }
    if (b.dataset.act === 'demolish') {
      const r = S.bulldoze(s, [[bd.x, bd.y]]);
      if (!r.ok) { toast(r.msg, 'bad'); return; }
      sfx('demolish'); closeInfo(); afterAction();
    }
  };
  // panneaux
  const pb = $('panel-body');
  pb.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.tax) { S.setTax(s, +t.dataset.tax, +t.value); $(`tax-o-${t.dataset.tax}`).textContent = `${s.taxes[t.dataset.tax]} %`; S.measure(s); renderTop(); saves.soon(s); }
    if (t.dataset.fund) { S.setFunding(s, t.dataset.fund, +t.value); $(`fund-o-${t.dataset.fund}`).textContent = `${s.funding[t.dataset.fund]} %`; S.measure(s); s.fieldsStale = true; renderTop(); saves.soon(s); }
  });
  pb.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.tax || t.dataset.fund) renderPanel();
    if (t.dataset.policy) { const r = S.togglePolicy(s, t.dataset.policy); if (!r.ok) toast(r.msg, 'bad'); else { sfx('click'); afterAction(); } renderPanel(); }
  });
  pb.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.tech) { S.setResearch(s, t.dataset.tech); sfx('click'); renderPanel(); saves.soon(s); }
    if (t.dataset.loan) { S.takeLoan(s, +t.dataset.loan); sfx('coin'); afterAction(); renderPanel(); }
    if (t.dataset.repay != null && t.dataset.repay !== undefined && t.hasAttribute('data-repay')) { const r = S.repayLoan(s, +t.dataset.repay); if (!r.ok && r.msg) toast(r.msg, 'bad'); afterAction(); renderPanel(); }
    if (t.dataset.range) { statRange = +t.dataset.range; renderPanel(); }
    if (t.dataset.restore != null && t.hasAttribute('data-restore')) {
      const i = +t.dataset.restore;
      modal({ title: 'Restaurer cette copie ?', text: '<p>La ville reviendra à ce moment-là. L\'état actuel est gardé dans une nouvelle copie de secours.</p>', actions: [['Annuler'], ['Restaurer', () => {
        const st = saves.restore(i);
        if (!st) { toast('Copie illisible.', 'bad'); return; }
        saves.backup(s, 'avant restauration');
        enterGame(st, false); saves.save(s); toast('Copie restaurée.', 'gold');
      }, true]] });
    }
    if (t.dataset.pref) {
      const k = t.dataset.pref; let v = t.dataset.v;
      if (v === 'true') v = true; else if (v === 'false') v = false; else if (!isNaN(+v)) v = +v;
      prefs[k] = v; savePrefs();
      if (k === 'quality') view.setQuality(v === 'auto' ? autoQuality() : v);
      if (k === 'dayMode') view.dayMode = v;
      if (k === 'dayLength') view.dayLength = v;
      if (k === 'weather') { view.fixedWeather = v === 'auto' ? null : v; view.weather.next = 0; }
      sfx('click'); renderPanel();
    }
    const act = t.dataset.act;
    if (act === 'save-now') { saves.save(s, { reason: 'backup', thumb: safeThumb() }); toast('Ville sauvegardée.', 'gold'); renderPanel(); }
    if (act === 'menu') backToMenu();
    if (act === 'tutorial') tutorial();
    if (act === 'export') {
      const code = await saves.exportCode(s);
      $('code').value = code;
      try { await navigator.clipboard.writeText(code); toast('Code copié.', 'gold'); } catch (err) { $('code').select(); toast('Sélectionne le code et copie-le.'); }
    }
    if (act === 'import') {
      try {
        const st = await saves.importCode($('code').value);
        saves.backup(s, 'avant import');
        enterGame(st, false); saves.save(s); toast('Ville chargée.', 'gold');
      } catch (err) { toast(err.message || 'Code illisible.', 'bad'); }
    }
    if (act === 'delete') {
      modal({ title: `Effacer ${s.name} ?`, text: '<p>La ville et ses copies de secours seront supprimées. C\'est définitif.</p>', actions: [['Annuler'], ['Effacer', () => { const n = saves.slot; playing = false; saves.remove(n); saves.slot = null; $('ui').hidden = true; $('menu').hidden = false; closePanel(); buildMenu(); }, true]] });
    }
  });
  // clavier
  window.addEventListener('keydown', (e) => {
    if (!playing || e.target.closest('input, textarea') || !$('modal').hidden) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); setSpeed(speed ? 0 : lastSpeed); }
    else if (k === '1' || k === '2' || k === '3') setSpeed([1, 3, 8][+k - 1]);
    else if (k === 'escape') { if (document.body.classList.contains('photo')) exitPhoto(); else if (tool || category) { setTool(null); category = null; renderFlyout(); buildTools(); } else if (selected) closeInfo(); else closePanel(); }
    else if (k === 'q' && !e.ctrlKey) view.rotateBy(Math.PI / 4);
    else if (k === 'e') view.rotateBy(-Math.PI / 4);
    else if (k === '+' || k === '=') view.zoomBy(0.8);
    else if (k === '-' || k === '_') view.zoomBy(1.25);
    else if (k === 'arrowleft' || k === 'a') view.panBy(-1, 0);
    else if (k === 'arrowright' || k === 'd') view.panBy(1, 0);
    else if (k === 'arrowup' || k === 'z' || k === 'w') view.panBy(0, 1);
    else if (k === 'arrowdown' || k === 's') view.panBy(0, -1);
    else if (k === 'p') photoMode();
    else if (k === 'b') openPanel('budget');
    else if (k === 'r') onCat('road');
  });
  // sauvegarde en quittant la page
  const leave = () => { if (playing && s) saves.save(s); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); });
  window.addEventListener('pagehide', leave);
  window.addEventListener('beforeunload', leave);
}
function photoMode() {
  document.body.classList.add('photo'); $('photo-bar').hidden = false;
  closeInfo(); setTool(null); category = null; renderFlyout();
  view.cursor.visible = false;
}
function exitPhoto() { document.body.classList.remove('photo'); $('photo-bar').hidden = true; view.autoRotate = false; }

boot();

// accès pour les tests automatiques et la console
window.aurore = { S, get state() { return s; }, get view() { return view; }, enter: (st) => enterGame(st, false) };
