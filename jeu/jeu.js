/* Pêcheur d'étoiles
 * Descente : éviter tout ce qui flotte. Remontée : tout attraper.
 * Tout le réglage du jeu (améliorations, objets, vitesses) est dans les constantes ci-dessous. */
(() => {
  'use strict';

  const PX_PER_M = 10;         // pixels par mètre de profondeur
  const DESCENT_SPEED = 190;   // px/s
  const ASCENT_SPEED = 270;    // px/s
  const HEART_DEPTH = 1050;    // profondeur du Cœur de la nébuleuse
  const SAVE_KEY = 'pecheur-etoiles-v1';

  const UPGRADES = [
    { id: 'cable', name: 'Câble', unit: 'm', desc: 'Profondeur maximale',
      values: [60, 120, 200, 300, 420, 560, 720, 900, 1100],
      costs: [0, 40, 120, 300, 650, 1300, 2500, 4500, 8000] },
    { id: 'hold', name: 'Soute', unit: 'objets', desc: 'Objets rapportés par plongée',
      values: [3, 5, 8, 12, 17, 23, 30, 40],
      costs: [0, 30, 90, 220, 500, 1000, 2000, 3800] },
    { id: 'shield', name: 'Bouclier', unit: 'chocs', desc: 'Chocs encaissés pendant la descente',
      values: [0, 1, 2, 3, 4, 5],
      costs: [0, 80, 250, 700, 1600, 3500] },
    { id: 'motor', name: 'Propulseurs', unit: '', desc: 'Vitesse de déplacement latéral',
      values: [1.0, 1.3, 1.6, 1.95, 2.35, 2.8],
      costs: [0, 50, 160, 450, 1000, 2200] },
  ];

  // minD : profondeur d'apparition (m). r : rayon de collision (px). vx : vitesse latérale max (largeur/s).
  const TYPES = {
    dust:    { name: "Poussière d'étoile", value: 2,    minD: 0,   r: 10, vx: 0.05, weight: 10 },
    meteor:  { name: 'Météorite',          value: 6,    minD: 40,  r: 14, vx: 0.08, weight: 9 },
    crystal: { name: 'Cristal lunaire',    value: 15,   minD: 110, r: 13, vx: 0.10, weight: 8 },
    comet:   { name: 'Comète',             value: 40,   minD: 200, r: 14, vx: 0.30, weight: 7 },
    dwarf:   { name: 'Planète naine',      value: 90,   minD: 320, r: 20, vx: 0.07, weight: 6 },
    pulsar:  { name: 'Pulsar',             value: 200,  minD: 480, r: 16, vx: 0.12, weight: 5 },
    heart:   { name: 'Cœur de la nébuleuse', value: 5000, minD: HEART_DEPTH, r: 30, vx: 0.04, weight: 0 },
    debris:  { name: 'Débris de satellite', value: 0,   minD: 30,  r: 14, vx: 0.15, weight: 0 },
  };
  const CATCHABLE = Object.keys(TYPES).filter((k) => k !== 'debris');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Sauvegarde ----------
  const fresh = () => ({ credits: 0, lvl: { cable: 0, hold: 0, shield: 0, motor: 0 }, seen: {}, best: 0, dives: 0, heart: false });
  let save = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible : partie non sauvegardée */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  const stat = (id) => UPGRADES.find((u) => u.id === id).values[save.lvl[id]];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('ciel');
  const ctx = canvas.getContext('2d');
  const ui = {
    menu: $('menu'), result: $('result'), hud: $('hud'), hint: $('hint'),
    credits: $('credits'), shop: $('shop'), codex: $('codex'), codexCount: $('codex-count'), records: $('records'),
    depth: $('hud-depth'), max: $('hud-max'), hold: $('hud-hold'), shield: $('hud-shield'),
    haul: $('haul'), haulTotal: $('haul-total'), resultTitle: $('result-title'), resultSub: $('result-sub'),
  };

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);

  // Étoiles de fond (parallaxe), en coordonnées relatives
  const bgStars = Array.from({ length: 90 }, () => ({
    x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, t: Math.random() * 6.28,
  }));

  // ---------- État de la plongée ----------
  let state = 'menu'; // menu | descent | ascent | result
  let probe, items, camY, time = 0, shake = 0, hintTimer = 0, keyDir = 0;

  function pickType(depthM) {
    const pool = CATCHABLE.filter((k) => TYPES[k].weight && TYPES[k].minD <= depthM);
    // Les objets récents (plus profonds) sont favorisés, les anciens se raréfient.
    const weights = pool.map((k, i) => TYPES[k].weight * (1 + i * 0.6) * (i < pool.length - 3 ? 0.35 : 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  function makeItem(type, depthM) {
    const t = TYPES[type];
    return {
      type, x: 0.1 + Math.random() * 0.8, y: depthM * PX_PER_M,
      vx: (Math.random() < 0.5 ? -1 : 1) * t.vx * (0.4 + Math.random() * 0.6),
      rot: Math.random() * 6.28, seed: Math.random(), caught: false, cool: 0,
      shape: Array.from({ length: 8 }, () => 0.75 + Math.random() * 0.35),
    };
  }

  function startDive() {
    const maxDepth = stat('cable');
    items = [];
    for (let d = 22; d < maxDepth + 25; d += 5 + Math.random() * 5) {
      items.push(makeItem(pickType(d), d));
      // Débris : obstacles qui font perdre une prise pendant la remontée
      if (d > TYPES.debris.minD && Math.random() < Math.min(0.28, d / 2500)) {
        items.push(makeItem('debris', d + 2 + Math.random() * 2));
      }
    }
    if (maxDepth >= HEART_DEPTH) items.push(Object.assign(makeItem('heart', HEART_DEPTH), { x: 0.5 }));

    probe = { x: 0.5, target: 0.5, y: 0, max: maxDepth * PX_PER_M, shield: stat('shield'), hold: stat('hold'),
      speed: stat('motor'), caught: [], lost: [], deepest: 0, reason: '' };
    camY = -H * 0.3;
    save.dives++;
    setState('descent');
    showHint('Évite tout !', 1.4);
  }

  function setState(s) {
    state = s;
    ui.menu.hidden = s !== 'menu';
    ui.result.hidden = s !== 'result';
    ui.hud.hidden = !(s === 'descent' || s === 'ascent');
    if (s === 'menu') renderMenu();
  }

  function showHint(text, dur) { ui.hint.textContent = text; ui.hint.hidden = false; hintTimer = dur; }

  function beginAscent(reason) {
    probe.reason = reason;
    state = 'ascent';
    showHint('Remontée : attrape tout !', 1.4);
  }

  // ---------- Boucle ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (state === 'descent' || state === 'ascent') update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    if (hintTimer > 0 && (hintTimer -= dt) <= 0) ui.hint.hidden = true;
    shake = Math.max(0, shake - dt * 3);

    // Déplacement latéral : vers le doigt, ou au clavier
    const maxStep = 0.9 * probe.speed * dt;
    if (keyDir) probe.target = Math.min(0.97, Math.max(0.03, probe.x + keyDir * maxStep * 1.5));
    const dx = probe.target - probe.x;
    probe.x += Math.max(-maxStep, Math.min(maxStep, dx));

    if (state === 'descent') {
      probe.y += DESCENT_SPEED * dt;
      if (probe.y >= probe.max) { probe.y = probe.max; beginAscent('Bout du câble atteint.'); }
    } else {
      const full = probe.caught.length >= probe.hold;
      probe.y -= ASCENT_SPEED * (full ? 1.6 : 1) * dt;
      if (probe.y <= 0) { probe.y = 0; finishDive(); return; }
    }
    probe.deepest = Math.max(probe.deepest, probe.y);

    // Objets
    const px = probe.x * W;
    for (const it of items) {
      if (it.caught) continue;
      it.x += it.vx * dt;
      if (it.x < 0.05 || it.x > 0.95) { it.vx *= -1; it.x = Math.min(0.95, Math.max(0.05, it.x)); }
      it.rot += dt * (it.type === 'debris' ? 1.4 : 0.6);
      if (it.cool > 0) { it.cool -= dt; continue; }
      if (Math.abs(it.y - probe.y) > 60) continue;
      const r = TYPES[it.type].r + 10;
      if (Math.hypot(it.x * W - px, it.y - probe.y) > r) continue;

      if (state === 'descent') {
        if (probe.shield > 0) {
          probe.shield--; it.cool = 1; shake = 0.6;
          showHint('Bouclier touché !', 0.8);
        } else {
          shake = 1;
          beginAscent(`Touché par : ${TYPES[it.type].name.toLowerCase()}.`);
        }
        break;
      }
      // Remontée
      if (it.type === 'debris') {
        it.caught = true; it.gone = true; shake = 0.8;
        const lost = probe.caught.pop();
        if (lost) { lost.gone = true; probe.lost.push(lost); showHint(`${TYPES[lost.type].name} perdue !`, 1); }
      } else if (probe.caught.length < probe.hold) {
        it.caught = true;
        probe.caught.push(it);
        if (probe.caught.length === probe.hold) showHint('Soute pleine !', 1.2);
      }
    }

    // Caméra : la sonde en haut à la descente, en bas à la remontée
    const targetCam = probe.y - H * (state === 'descent' ? 0.3 : 0.68);
    camY += (targetCam - camY) * Math.min(1, dt * 4);

    ui.depth.textContent = Math.round(probe.y / PX_PER_M);
    ui.max.textContent = Math.round(probe.max / PX_PER_M);
    ui.hold.textContent = `${probe.caught.length}/${probe.hold}`;
    ui.shield.textContent = probe.shield;
  }

  function finishDive() {
    ui.hint.hidden = true;
    const counts = {};
    let total = 0;
    for (const it of probe.caught) {
      counts[it.type] = (counts[it.type] || 0) + 1;
      total += TYPES[it.type].value;
      save.seen[it.type] = (save.seen[it.type] || 0) + 1;
    }
    const deepest = Math.round(probe.deepest / PX_PER_M);
    const newRecord = deepest > save.best;
    save.best = Math.max(save.best, deepest);
    save.credits += total;
    const gotHeart = !!counts.heart;
    if (gotHeart) save.heart = true;
    persist();

    ui.resultTitle.textContent = gotHeart ? 'Tu as rapporté le Cœur de la nébuleuse !' : 'Retour au vaisseau';
    ui.resultSub.textContent = `${probe.reason} Profondeur atteinte : ${deepest} m${newRecord ? ' (nouveau record)' : ''}.`;
    ui.haul.innerHTML = '';
    const rows = CATCHABLE.filter((k) => counts[k]).sort((a, b) => TYPES[b].value - TYPES[a].value);
    if (!rows.length) ui.haul.innerHTML = '<li>Soute vide. Vise mieux à la remontée !</li>';
    for (const k of rows) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${counts[k]} × ${TYPES[k].name}</span><span>${counts[k] * TYPES[k].value} ✦</span>`;
      ui.haul.appendChild(li);
    }
    if (probe.lost.length) {
      const li = document.createElement('li');
      li.className = 'lost';
      li.innerHTML = `<span>Perdu dans les débris</span><span>${probe.lost.length} objet${probe.lost.length > 1 ? 's' : ''}</span>`;
      ui.haul.appendChild(li);
    }
    ui.haulTotal.textContent = total;
    setState('result');
    $('btn-back').focus();
  }

  // ---------- Menu ----------
  function renderMenu() {
    ui.credits.textContent = save.credits;
    ui.shop.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = save.lvl[u.id];
      const maxed = lvl >= u.values.length - 1;
      const cost = maxed ? 0 : u.costs[lvl + 1];
      const fmt = (v) => (u.id === 'motor' ? `×${v}` : `${v} ${u.unit}`);
      const card = document.createElement('div');
      card.className = 'upgrade';
      card.innerHTML = `
        <h3>${u.name}</h3>
        <p>${u.desc} : ${fmt(u.values[lvl])}${maxed ? '' : ` → ${fmt(u.values[lvl + 1])}`}</p>
        <div class="lvl">${u.values.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</div>
        <button type="button" ${maxed || save.credits < cost ? 'disabled' : ''}>${maxed ? 'Max' : `${cost} ✦`}</button>`;
      card.querySelector('button').addEventListener('click', () => {
        if (maxed || save.credits < cost) return;
        save.credits -= cost;
        save.lvl[u.id]++;
        persist();
        renderMenu();
        ui.shop.children[UPGRADES.indexOf(u)].querySelector('button').focus();
      });
      ui.shop.appendChild(card);
    }

    ui.codex.innerHTML = '';
    let found = 0;
    for (const k of CATCHABLE) {
      const n = save.seen[k] || 0;
      if (n) found++;
      const li = document.createElement('li');
      if (n) li.innerHTML = `<span>${TYPES[k].name} <small>× ${n}</small></span><span>${TYPES[k].value} ✦</span>`;
      else { li.className = 'unknown'; li.innerHTML = `<span>??? <small>(dès ${TYPES[k].minD} m)</small></span><span>?</span>`; }
      ui.codex.appendChild(li);
    }
    ui.codexCount.textContent = `(${found}/${CATCHABLE.length})`;
    ui.records.textContent = save.dives
      ? `Plongées : ${save.dives} · Record : ${save.best} m${save.heart ? ' · Cœur de la nébuleuse rapporté ✦' : ''}`
      : '';
  }

  // ---------- Dessin ----------
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  function star(x, y, spikes, outer, inner, rot) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = rot + (i * Math.PI) / spikes;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function drawItem(it, x, y) {
    const t = TYPES[it.type];
    const tw = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(time * 4 + it.seed * 10);
    switch (it.type) {
      case 'dust':
        glow(x, y, 16 * tw, 'rgba(255,233,168,0.7)');
        ctx.fillStyle = '#fff6d8';
        star(x, y, 4, 9, 2.5, it.rot); ctx.fill();
        break;
      case 'meteor':
        ctx.fillStyle = '#8a6f5a';
        ctx.beginPath();
        it.shape.forEach((s, i) => {
          const a = it.rot + (i / it.shape.length) * 6.2832;
          ctx.lineTo(x + Math.cos(a) * t.r * s, y + Math.sin(a) * t.r * s);
        });
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5e4a3c';
        ctx.beginPath(); ctx.arc(x - 3, y - 2, 3, 0, 6.2832); ctx.arc(x + 4, y + 3, 2, 0, 6.2832); ctx.fill();
        break;
      case 'crystal':
        glow(x, y, 22 * tw, 'rgba(107,228,255,0.45)');
        ctx.fillStyle = '#9ff0ff';
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 15); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e6fbff';
        ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 15); ctx.closePath(); ctx.fill();
        break;
      case 'comet': {
        const dir = it.vx >= 0 ? -1 : 1;
        const g = ctx.createLinearGradient(x, y, x + dir * 60, y);
        g.addColorStop(0, 'rgba(160,220,255,0.9)'); g.addColorStop(1, 'rgba(160,220,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + dir * 60, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill();
        glow(x, y, 20, 'rgba(200,240,255,0.8)');
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
        break;
      }
      case 'dwarf': {
        const hue = Math.floor(it.seed * 360);
        ctx.fillStyle = `hsl(${hue},55%,55%)`;
        ctx.beginPath(); ctx.arc(x, y, 15, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `hsla(${hue},55%,30%,0.6)`;
        ctx.beginPath(); ctx.arc(x + 5, y + 4, 11, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = `hsla(${(hue + 40) % 360},70%,80%,0.9)`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(x, y, 25, 7, -0.35, 0, 6.2832); ctx.stroke();
        break;
      }
      case 'pulsar': {
        glow(x, y, 30 * tw, 'rgba(210,160,255,0.55)');
        const a = reducedMotion ? 0.6 : time * 3 + it.seed * 6;
        ctx.strokeStyle = 'rgba(235,210,255,0.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 30, y - Math.sin(a) * 30); ctx.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
        break;
      }
      case 'heart': {
        const p = reducedMotion ? 1 : 1 + 0.08 * Math.sin(time * 3);
        glow(x, y, 70 * p, 'rgba(255,122,184,0.55)');
        ctx.fillStyle = '#ff9fcb';
        star(x, y, 8, 30 * p, 13 * p, it.rot); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.2832); ctx.fill();
        break;
      }
      case 'debris':
        ctx.save(); ctx.translate(x, y); ctx.rotate(it.rot);
        ctx.fillStyle = '#6d7488'; ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = '#34507a'; ctx.fillRect(-18, -5, 12, 10); ctx.fillRect(6, -5, 12, 10);
        ctx.strokeStyle = '#9aa6c4'; ctx.lineWidth = 1; ctx.strokeRect(-18, -5, 12, 10); ctx.strokeRect(6, -5, 12, 10);
        ctx.restore();
        if (reducedMotion || Math.sin(time * 6 + it.seed * 9) > 0) {
          ctx.fillStyle = '#ff4d5e'; ctx.beginPath(); ctx.arc(x, y - 8, 2.5, 0, 6.2832); ctx.fill();
        }
        break;
    }
  }

  function drawProbe(x, y) {
    // Câble jusqu'au vaisseau
    ctx.strokeStyle = 'rgba(244,240,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2, Math.max(-10, -camY - 10)); ctx.lineTo(x, y - 14); ctx.stroke();
    if (probe && probe.shield > 0 && state === 'descent') {
      ctx.strokeStyle = 'rgba(107,228,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, 6.2832); ctx.stroke();
    }
    ctx.fillStyle = '#e9e4ff';
    ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x - 10, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath(); ctx.arc(x, y - 2, 3.5, 0, 6.2832); ctx.fill();
    // Pinces
    ctx.strokeStyle = '#e9e4ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.lineTo(x - 11, y + 12); ctx.moveTo(x + 8, y + 4); ctx.lineTo(x + 11, y + 12); ctx.stroke();
  }

  function drawShip() {
    const y = -camY - 30;
    if (y < -60) return;
    ctx.fillStyle = '#2b2360';
    ctx.beginPath(); ctx.ellipse(W / 2, y, 70, 18, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#4a3e9c';
    ctx.beginPath(); ctx.ellipse(W / 2, y - 10, 30, 16, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd66b';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(W / 2 + i * 22, y + 3, 3, 0, 6.2832); ctx.fill(); }
  }

  function draw() {
    const depth = state === 'menu' || state === 'result' ? 0 : Math.max(0, camY / PX_PER_M);
    const k = Math.min(1, depth / 1000);
    // Le ciel passe du violet profond au magenta près du cœur de la nébuleuse
    const top = `hsl(${250 - k * 20},${45 + k * 20}%,${10 + k * 4}%)`;
    const bottom = `hsl(${270 + k * 45},${50 + k * 20}%,${14 + k * 8}%)`;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, top); bg.addColorStop(1, bottom);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const sx = shake && !reducedMotion ? (Math.random() - 0.5) * 10 * shake : 0;
    const cam = state === 'menu' || state === 'result' ? time * 20 : camY;

    for (const s of bgStars) {
      const yy = (((s.y * H - cam * s.z * 0.3) % H) + H) % H;
      const a = reducedMotion ? 0.6 : 0.4 + 0.4 * Math.sin(time * 2 + s.t);
      ctx.fillStyle = `rgba(255,255,255,${a * s.z})`;
      ctx.fillRect(s.x * W, yy, 1.5 * s.z + 0.5, 1.5 * s.z + 0.5);
    }
    if (state !== 'descent' && state !== 'ascent') return;

    ctx.save();
    ctx.translate(sx, 0);
    drawShip();
    for (const it of items) {
      if (it.caught) continue;
      const y = it.y - camY;
      if (y < -60 || y > H + 60) continue;
      drawItem(it, it.x * W, y);
    }
    // Limite du câble
    const limitY = probe.max - camY + 16;
    if (limitY < H + 20) {
      ctx.strokeStyle = 'rgba(255,214,107,0.35)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, limitY); ctx.lineTo(W, limitY); ctx.stroke(); ctx.setLineDash([]);
    }
    const px = probe.x * W, py = probe.y - camY;
    // Prises accrochées sous la sonde
    probe.caught.forEach((it, i) => {
      const a = i * 2.4;
      const d = 12 + Math.sqrt(i) * 10;
      ctx.save(); ctx.globalAlpha = 0.95;
      drawItem(it, px + Math.cos(a) * d * 0.9, py + 22 + Math.abs(Math.sin(a)) * d);
      ctx.restore();
    });
    drawProbe(px, py);
    ctx.restore();
  }

  // ---------- Contrôles ----------
  function pointer(e) {
    if (state !== 'descent' && state !== 'ascent') return;
    const rect = canvas.getBoundingClientRect();
    probe.target = Math.min(0.97, Math.max(0.03, (e.clientX - rect.left) / rect.width));
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
  $('btn-back').addEventListener('click', () => { setState('menu'); $('btn-dive').focus(); });
  // Confirmation en deux clics, dans la page (pas de boîte de dialogue du navigateur)
  const resetBtn = $('btn-reset');
  let resetArmed = false;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = 'Toucher encore pour tout effacer';
      setTimeout(() => { resetArmed = false; resetBtn.textContent = 'Effacer la partie'; }, 3000);
      return;
    }
    resetArmed = false;
    resetBtn.textContent = 'Effacer la partie';
    save = fresh(); persist(); renderMenu();
  });

  resize();
  setState('menu');
  requestAnimationFrame(frame);
})();
