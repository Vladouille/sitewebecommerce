// =====================================================================
// Aurore : modèles 3D procéduraux et textures dessinées à la volée
// Chaque modèle est une géométrie unique en 3 groupes :
//   0 façade (texture de fenêtres, allumées la nuit), 1 matière simple, 2 lumière (brille la nuit)
// =====================================================================
import * as THREE from 'three';
import { rng } from './sim.js';

const FLOOR = 0.14; // hauteur d'un étage

// ---------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// façade : 8 travées x 8 étages, répétable. style : res, com, ind, off, house
export function makeFacade(style, seed = 1) {
  const S = 256, c = canvas(S, S), e = canvas(S, S), g = c.getContext('2d'), ge = e.getContext('2d');
  const r = rng(seed * 97 + style.length * 13);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  const bay = S / 8, fl = S / 8;
  // léger grain du mur
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.035})`; g.fillRect(r() * S, r() * S, 2, 2); }
  for (let j = 0; j < 8; j++) {
    if (style === 'com' || style === 'off') { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, j * fl + fl - 5, S, 5); }
    if (style === 'res') { g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, j * fl + fl - 3, S, 3); }
    for (let i = 0; i < 8; i++) {
      const x = i * bay, y = j * fl;
      let wx, wy, ww, wh;
      if (style === 'off') { wx = x + 2; wy = y + 3; ww = bay - 4; wh = fl - 8; }
      else if (style === 'com') { wx = x + 4; wy = y + 6; ww = bay - 8; wh = fl - 14; }
      else if (style === 'ind') { if (i % 2 || j % 3) continue; wx = x + 4; wy = y + 6; ww = bay * 2 - 8; wh = fl * 0.35; }
      else { wx = x + 9; wy = y + 7; ww = bay - 18; wh = fl - 15; }
      const glass = style === 'off' ? `rgb(${40 + r() * 20},${62 + r() * 20},${84 + r() * 25})` : `rgb(${46 + r() * 16},${58 + r() * 16},${72 + r() * 18})`;
      g.fillStyle = glass; g.fillRect(wx, wy, ww, wh);
      // reflet du ciel
      const grd = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
      grd.addColorStop(0, 'rgba(255,255,255,0.28)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.04)'); grd.addColorStop(1, 'rgba(255,255,255,0.12)');
      g.fillStyle = grd; g.fillRect(wx, wy, ww, wh);
      if (style === 'res' || style === 'house') {
        g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.strokeRect(wx, wy, ww, wh);
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(wx - 2, wy + wh, ww + 4, 3);
        if (r() < 0.3) { g.fillStyle = `rgba(${200 + r() * 55},${150 + r() * 80},${120 + r() * 60},0.55)`; g.fillRect(wx, wy, ww * 0.3, wh); }
      }
      if (style === 'off') { g.fillStyle = 'rgba(200,215,230,0.35)'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh); }
      // fenêtres allumées la nuit
      const lit = r() < (style === 'off' ? 0.42 : style === 'ind' ? 0.6 : 0.5);
      if (lit) {
        const warm = style === 'off' ? [215 + r() * 40, 228 + r() * 27, 255] : [255, 190 + r() * 50, 110 + r() * 60];
        const k = 0.55 + r() * 0.45;
        ge.fillStyle = `rgb(${warm[0] * k | 0},${warm[1] * k | 0},${warm[2] * k | 0})`;
        ge.fillRect(wx, wy, ww, wh);
      }
    }
  }
  const map = new THREE.CanvasTexture(c), em = new THREE.CanvasTexture(e);
  for (const t of [map, em]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  map.colorSpace = THREE.SRGBColorSpace; em.colorSpace = THREE.SRGBColorSpace;
  return { map, em };
}

// routes : forme de base orientée vers le nord (haut du dessin)
// shape : 0 isolée, 1 impasse (N), 2 droite (N-S), 3 virage (N-E), 4 T (N-E-S), 5 croisement
export function makeRoadTexture(shape, avenue) {
  const S = 256, c = canvas(S, S), g = c.getContext('2d');
  const conn = [[], ['N'], ['N', 'S'], ['N', 'E'], ['N', 'E', 'S'], ['N', 'E', 'S', 'W']][shape];
  const side = avenue ? 22 : 34;
  // trottoirs
  g.fillStyle = '#b9b6ae'; g.fillRect(0, 0, S, S);
  for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(Math.random() * S, Math.random() * S, 3, 3); }
  // chaussée
  const asphalt = '#3a3e44';
  g.fillStyle = asphalt;
  const lo = side, hi = S - side;
  g.fillRect(lo, lo, hi - lo, hi - lo);
  for (const d of conn) {
    if (d === 'N') g.fillRect(lo, 0, hi - lo, lo);
    if (d === 'S') g.fillRect(lo, hi, hi - lo, S - hi);
    if (d === 'E') g.fillRect(hi, lo, S - hi, hi - lo);
    if (d === 'W') g.fillRect(0, lo, lo, hi - lo);
  }
  if (shape === 0) { g.fillRect(lo, lo, hi - lo, hi - lo); }
  // grain de l'asphalte
  for (let k = 0; k < 1400; k++) {
    const x = Math.random() * S, y = Math.random() * S;
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(x, y, 2, 2);
  }
  // bordures
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3;
  g.strokeRect(lo, lo, hi - lo, hi - lo);
  // marquages
  const mid = S / 2;
  g.lineCap = 'butt';
  const dash = (x0, y0, x1, y1) => {
    if (avenue) {
      g.strokeStyle = '#4f7a3a'; g.lineWidth = 18; g.setLineDash([]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = '#d9d4c7'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.setLineDash([16, 14]);
      for (const off of [-52, 52]) {
        g.beginPath();
        if (x0 === x1) { g.moveTo(x0 + off, y0); g.lineTo(x1 + off, y1); } else { g.moveTo(x0, y0 + off); g.lineTo(x1, y1 + off); }
        g.stroke();
      }
      g.setLineDash([]);
    } else {
      g.strokeStyle = 'rgba(245,240,225,0.9)'; g.lineWidth = 4; g.setLineDash([18, 16]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    }
  };
  if (shape === 2) dash(mid, 0, mid, S);
  else if (shape === 1) dash(mid, 0, mid, mid);
  else if (shape === 3) { dash(mid, 0, mid, mid - (avenue ? 0 : 20)); dash(mid + (avenue ? 0 : 20), mid, S, mid); }
  else if (shape >= 4) {
    // passages piétons
    g.fillStyle = 'rgba(245,245,240,0.85)';
    const zebra = (d) => {
      for (let k = 0; k < 6; k++) {
        const p = lo + 10 + k * ((hi - lo - 20) / 6);
        if (d === 'N') g.fillRect(p, lo - 30, 12, 24);
        if (d === 'S') g.fillRect(p, hi + 6, 12, 24);
        if (d === 'E') g.fillRect(hi + 6, p, 24, 12);
        if (d === 'W') g.fillRect(lo - 30, p, 24, 12);
      }
    };
    conn.forEach(zebra);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function makeSoftDot(color = '#ffffff', size = 64) {
  const c = canvas(size, size), g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, color); grd.addColorStop(0.4, color.replace('rgb', 'rgba').replace(')', ',0.6)'));
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function makeIcon(emoji, bg) {
  const S = 96, c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(S / 2, S / 2 + 3, 38, 0, Math.PI * 2); g.fill();
  g.fillStyle = bg; g.beginPath(); g.arc(S / 2, S / 2, 36, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
  g.font = '44px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji, S / 2, S / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function makeWaterNormal() {
  const S = 256, c = canvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
  const r = rng(5), waves = [];
  for (let k = 0; k < 18; k++) waves.push([r() * 6.28, (1 + Math.floor(r() * 5)) * (r() < 0.5 ? 1 : -1), (1 + Math.floor(r() * 5)) * (r() < 0.5 ? 1 : -1), 0.3 + r()]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let dx = 0, dy = 0;
    for (const [ph, fx, fy, a] of waves) {
      const t = (x / S * fx + y / S * fy) * Math.PI * 2 + ph;
      dx += Math.cos(t) * fx * a; dy += Math.cos(t) * fy * a;
    }
    const k = (y * S + x) * 4;
    img.data[k] = 128 + dx * 3; img.data[k + 1] = 128 + dy * 3; img.data[k + 2] = 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function makeTileTexture() {
  const S = 64, c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 5; g.strokeRect(5, 5, S - 10, S - 10);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function makeScaffoldTexture() {
  const S = 128, c = canvas(S, S), g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.strokeStyle = '#e8a33a'; g.lineWidth = 6;
  for (let k = 0; k <= S; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(S, k); g.stroke(); }
  g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, S); g.moveTo(S, 0); g.lineTo(0, S); g.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------
// Construction de géométries
// ---------------------------------------------------------------------
const tmpC = new THREE.Color();
export class Builder {
  constructor(seed = 1) {
    this.g = [[], [], []]; // pour chaque groupe : {pos, nor, uv, col}
    this.r = rng(seed);
    this.meta = { smoke: [], steam: [], height: 0, blades: null, lights: [] };
  }
  pick(a) { return a[Math.floor(this.r() * a.length)]; }
  rand(a, b) { return a + (b - a) * this.r(); }
  _push(group, p, n, uv, color) {
    tmpC.set(color);
    const G = this.g[group];
    G.push([p, n, uv, [tmpC.r, tmpC.g, tmpC.b]]);
    if (p[1] > this.meta.height) this.meta.height = p[1];
  }
  quad(group, a, b, c, d, n, uvs, color) {
    // a b c d dans le sens trigonométrique vu de face
    const [ua, ub, uc, ud] = uvs;
    this._push(group, a, n, ua, color); this._push(group, b, n, ub, color); this._push(group, c, n, uc, color);
    this._push(group, a, n, ua, color); this._push(group, c, n, uc, color); this._push(group, d, n, ud, color);
  }
  // boîte posée en y (bas), centrée en x/z
  box(x, y, z, w, h, d, color, opt = {}) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = y + h;
    const facade = opt.facade, grp = facade ? 0 : (opt.glow ? 2 : 1);
    const fu = opt.fu ?? 1, fv = 1 / (FLOOR * 8);
    const ou = opt.ou ?? Math.floor(this.r() * 8) / 8, ov = opt.ov ?? Math.floor(this.r() * 8) / 8;
    const suv = (len) => facade ? [[ou, ov], [ou + len * fu, ov], [ou + len * fu, ov + h * fv], [ou, ov + h * fv]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
    const col = color;
    // +z (avant)
    this.quad(grp, [x0, y, z1], [x1, y, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], suv(w), col);
    // -z
    this.quad(grp, [x1, y, z0], [x0, y, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], suv(w), col);
    // +x
    this.quad(grp, [x1, y, z1], [x1, y, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], suv(d), col);
    // -x
    this.quad(grp, [x0, y, z0], [x0, y, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], suv(d), col);
    if (!opt.noTop) {
      const top = opt.roof || color;
      this.quad(opt.glow ? 2 : 1, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], top);
    }
    return y1;
  }
  // toit à deux pans (faîtage selon x)
  gable(x, y, z, w, h, d, color, wallColor) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, yt = y + h;
    const s1 = new THREE.Vector3(0, d / 2, h).normalize(), s2 = new THREE.Vector3(0, d / 2, -h).normalize();
    const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
    this.quad(1, [x0, y, z1], [x1, y, z1], [x1, yt, z], [x0, yt, z], [s1.x, s1.y, s1.z], u, color);
    this.quad(1, [x1, y, z0], [x0, y, z0], [x0, yt, z], [x1, yt, z], [s2.x, s2.y, s2.z], u, color);
    const wc = wallColor || color;
    this._push(1, [x1, y, z1], [1, 0, 0], [0, 0], wc); this._push(1, [x1, y, z0], [1, 0, 0], [1, 0], wc); this._push(1, [x1, yt, z], [1, 0, 0], [0.5, 1], wc);
    this._push(1, [x0, y, z0], [-1, 0, 0], [0, 0], wc); this._push(1, [x0, y, z1], [-1, 0, 0], [1, 0], wc); this._push(1, [x0, yt, z], [-1, 0, 0], [0.5, 1], wc);
    return yt;
  }
  // toit en croupe (pyramide tronquée)
  hip(x, y, z, w, h, d, color) {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, yt = y + h, k = Math.min(w, d) * 0.5;
    const ix0 = x0 + k * 0.9, ix1 = x1 - k * 0.9, iz0 = z0 + k * 0.9, iz1 = z1 - k * 0.9;
    const n = (a, b, c) => { const v1 = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), v2 = new THREE.Vector3(...c).sub(new THREE.Vector3(...a)); const r = v1.cross(v2).normalize(); return [r.x, r.y, r.z]; };
    const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const faces = [
      [[x0, y, z1], [x1, y, z1], [ix1, yt, iz1], [ix0, yt, iz1]],
      [[x1, y, z1], [x1, y, z0], [ix1, yt, iz0], [ix1, yt, iz1]],
      [[x1, y, z0], [x0, y, z0], [ix0, yt, iz0], [ix1, yt, iz0]],
      [[x0, y, z0], [x0, y, z1], [ix0, yt, iz1], [ix0, yt, iz0]],
    ];
    for (const f of faces) this.quad(1, f[0], f[1], f[2], f[3], n(f[0], f[1], f[2]), u, color);
    if (ix1 > ix0 && iz1 > iz0) this.quad(1, [ix0, yt, iz1], [ix1, yt, iz1], [ix1, yt, iz0], [ix0, yt, iz0], [0, 1, 0], u, color);
    return yt;
  }
  // n'importe quelle géométrie three.js
  geo(geometry, color, group = 1, m = null) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (m) g.applyMatrix4(m);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      this._push(group, [p.getX(i), p.getY(i), p.getZ(i)], [n.getX(i), n.getY(i), n.getZ(i)], uv ? [uv.getX(i), uv.getY(i)] : [0, 0], color);
    }
    geometry.dispose(); if (g !== geometry) g.dispose();
  }
  cyl(x, y, z, rt, rb, h, color, seg = 10, group = 1) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    g.translate(x, y + h / 2, z);
    this.geo(g, color, group);
    return y + h;
  }
  sphere(x, y, z, r, color, sy = 1, group = 1, seg = 12) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6 | 0));
    g.scale(1, sy, 1); g.translate(x, y, z);
    this.geo(g, color, group);
  }
  cone(x, y, z, r, h, color, seg = 8, group = 1) {
    const g = new THREE.ConeGeometry(r, h, seg);
    g.translate(x, y + h / 2, z);
    this.geo(g, color, group);
  }
  tree(x, z, s = 1, kind = 0, y = 0) {
    this.cyl(x, y, z, 0.02 * s, 0.03 * s, 0.12 * s, '#6b4a2f', 5);
    if (kind === 0) { this.sphere(x, y + 0.2 * s, z, 0.11 * s, this.pick(['#4e8a3c', '#5c9a45', '#44803a']), 1.1, 1, 7); }
    else this.cone(x, y + 0.08 * s, z, 0.1 * s, 0.3 * s, this.pick(['#2f6b3a', '#37753f']), 7);
  }
  lawn(w, color = '#6fa153', y = 0.004) { this.box(0, 0, 0, w, y, w, color, { roof: color }); }
  build() {
    // fusion en une géométrie avec groupes
    const total = this.g.reduce((a, G) => a + G.length, 0);
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 3);
    const geo = new THREE.BufferGeometry();
    let o = 0;
    this.g.forEach((G, gi) => {
      const start = o;
      for (const [p, n, u, c] of G) {
        pos.set(p, o * 3); nor.set(n, o * 3); uv.set(u, o * 2); col.set(c, o * 3); o++;
      }
      if (o > start) geo.addGroup(start, o - start, gi);
    });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    return geo;
  }
}

// ---------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------
const P = {
  resWall: ['#f2e8d8', '#e8d2b8', '#f5f0e6', '#dcc6a9', '#e9dfd2', '#d3dade', '#efd8c6', '#e3e0cf'],
  resRoof: ['#9c4a3a', '#7a3b30', '#5b5f66', '#8a5a44', '#b0643c', '#4d5561', '#6e4234'],
  comWall: ['#eef1f3', '#dfe6ea', '#f3efe9', '#d7dde3', '#e8e2d6'],
  awning: ['#d9534f', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085'],
  indWall: ['#b8b2a7', '#a9a39a', '#c9c2b5', '#9fa4a9', '#b5aa98'],
  indRoof: ['#6d6f73', '#7f8388', '#5d6166'],
  glass: ['#a9bfd1', '#93abc0', '#bccbd6', '#89a1b6', '#b0c1cc', '#9db3b0'],
  concrete: ['#c9c6bf', '#bdbab3', '#d4d0c8'],
};

// ---------------------------------------------------------------------
// Bâtiments des zones : z 1 R, 2 C, 3 I, 4 O ; lvl 1..4 ; v variante 0..2
// ---------------------------------------------------------------------
export function zoneModel(z, lvl, v) {
  const B = new Builder(z * 1000 + lvl * 100 + v * 7 + 3);
  const style = z === 1 ? (lvl <= 2 ? 'house' : 'res') : z === 2 ? 'com' : z === 3 ? 'ind' : 'off';
  B.style = style;
  if (z === 1) residential(B, lvl, v);
  else if (z === 2) commercial(B, lvl, v);
  else if (z === 3) industrial(B, lvl, v);
  else offices(B, lvl, v);
  return B;
}

function residential(B, lvl, v) {
  const wall = B.pick(P.resWall), roof = B.pick(P.resRoof);
  if (lvl === 1) {
    B.lawn(0.94, B.pick(['#76a957', '#6f9f50', '#7bae5c']));
    B.box(0, 0.004, 0.3, 0.14, 0.006, 0.34, '#cfc8ba');
    const w = B.rand(0.46, 0.58), d = B.rand(0.36, 0.44), h = B.rand(0.26, 0.32);
    B.box(0, 0, -0.05, w, h, d, wall, { facade: true, fu: 1.3 });
    B.box(0, 0, -0.05 + d / 2 + 0.001, 0.08, 0.14, 0.002, '#6a4a34', { roof: '#6a4a34' });
    if (v === 1) B.hip(0, h, -0.05, w + 0.06, 0.2, d + 0.06, roof);
    else B.gable(0, h, -0.05, w + 0.06, 0.22, d + 0.08, roof, wall);
    B.box(w * 0.28, h, -0.1, 0.06, 0.2, 0.06, '#8b6f5c');
    if (v === 2) { B.box(-w / 2 - 0.1, 0, 0.02, 0.16, 0.16, 0.22, wall, { facade: true }); B.box(-w / 2 - 0.1, 0.16, 0.02, 0.18, 0.02, 0.24, roof); }
    B.tree(0.34, 0.3, 0.8, 0); B.tree(-0.34, -0.34, 0.7, v % 2);
    // haie
    B.box(0, 0, 0.44, 0.9, 0.05, 0.04, '#4f7f3d');
  } else if (lvl === 2) {
    B.lawn(0.94, '#79a85c');
    const n = v === 0 ? 2 : 1;
    if (n === 2) {
      for (const sx of [-0.21, 0.21]) {
        const c = B.pick(P.resWall);
        B.box(sx, 0, 0, 0.4, 0.44, 0.55, c, { facade: true });
        B.gable(sx, 0.44, 0, 0.42, 0.2, 0.6, B.pick(P.resRoof), c);
      }
    } else {
      const h = v === 1 ? 0.44 : 0.6;
      B.box(0, 0, -0.04, 0.7, h, 0.55, wall, { facade: true });
      B.hip(0, h, -0.04, 0.76, 0.2, 0.6, roof);
      for (let k = 1; k < h / FLOOR; k++) B.box(0, k * FLOOR - 0.01, 0.25, 0.4, 0.015, 0.08, '#e9e9e9');
    }
    B.tree(0.38, 0.38, 0.7, 0);
  } else if (lvl === 3) {
    B.box(0, 0, 0, 0.94, 0.01, 0.94, '#bdb8ad');
    const floors = 5 + v * 1 + Math.floor(B.r() * 2);
    const h = floors * FLOOR;
    B.box(0, 0.01, 0, 0.8, h, 0.7, wall, { facade: true, roof: '#8e8f8c' });
    B.box(0, 0.01, 0, 0.82, FLOOR, 0.72, B.pick(P.comWall), { facade: true, noTop: true });
    // balcons
    for (let k = 1; k < floors; k++) B.box(0, 0.01 + k * FLOOR, 0.37, 0.7, 0.012, 0.07, '#dcdcdc', { roof: '#dcdcdc' });
    // toit : parapet, local technique, citerne
    B.box(0, h + 0.01, 0, 0.8, 0.03, 0.7, '#9c9d99', { roof: '#7d7e7a' });
    B.box(-0.2, h + 0.01, -0.1, 0.18, 0.1, 0.16, '#a8a9a5');
    if (v === 2) B.cyl(0.22, h + 0.01, 0.1, 0.06, 0.06, 0.12, '#7c6552', 8);
    else B.gable(0, h + 0.01, 0, 0.8, 0.14, 0.7, roof, wall);
  } else {
    B.box(0, 0, 0, 0.96, 0.012, 0.96, '#c3beb2');
    const floors = 16 + v * 4 + Math.floor(B.r() * 3);
    const base = 2, fh = FLOOR;
    B.box(0, 0.012, 0, 0.9, base * fh, 0.9, B.pick(P.comWall), { facade: true, roof: '#999' });
    let y = 0.012 + base * fh, w = 0.74;
    const segs = v === 0 ? 1 : 2;
    for (let sgi = 0; sgi < segs; sgi++) {
      const f = Math.floor((floors - base) / segs);
      B.box(0, y, 0, w, f * fh, w * (v === 1 ? 0.8 : 1), wall, { facade: true, roof: '#8d8e8a' });
      for (let k = 1; k < f; k += 1) B.box(0, y + k * fh, w / 2 + 0.02, w * 0.6, 0.01, 0.05, '#e5e5e5', { roof: '#e5e5e5' });
      y += f * fh; w -= 0.14;
    }
    B.box(0, y, 0, w + 0.1, 0.1, w + 0.1, '#6d6e6b');
    B.cyl(0, y + 0.1, 0, 0.012, 0.012, 0.35, '#ccc', 5);
    B.sphere(0, y + 0.46, 0, 0.025, '#ff5a4a', 1, 2, 6);
  }
}

function commercial(B, lvl, v) {
  const wall = B.pick(P.comWall);
  B.box(0, 0, 0, 0.96, 0.012, 0.96, '#c9c3b6');
  if (lvl === 1) {
    const h = 0.26;
    B.box(0, 0.012, -0.05, 0.74, h, 0.6, wall, { facade: true, fu: 1.2, roof: '#8f8c86' });
    const aw = B.pick(P.awning);
    // auvent incliné et enseigne lumineuse
    const g = new THREE.BoxGeometry(0.76, 0.012, 0.16); g.rotateX(0.35); g.translate(0, 0.2, 0.3);
    B.geo(g, aw);
    B.box(0, h + 0.012, 0.22, 0.5, 0.08, 0.02, B.pick(['#ffe9a8', '#ffd0e0', '#c8f0ff']), { glow: true });
    B.box(-0.22, 0.012, 0.4, 0.06, 0.08, 0.06, '#7a5a3c'); B.box(0.22, 0.012, 0.4, 0.06, 0.08, 0.06, '#7a5a3c');
  } else if (lvl === 2) {
    const floors = 3 + v % 2, h = floors * FLOOR;
    B.box(0, 0.012, 0, 0.84, h, 0.76, wall, { facade: true, roof: '#8f8c86' });
    B.box(0, 0.012, 0.385, 0.84, FLOOR * 0.9, 0.01, '#9ec3d8', { roof: '#9ec3d8' });
    B.box(0, 0.012 + FLOOR * 0.92, 0.39, 0.86, 0.03, 0.06, B.pick(P.awning));
    B.box(0, h + 0.012, -0.1, 0.6, 0.18, 0.02, B.pick(['#fff1b0', '#b8f3ff', '#ffc3e1']), { glow: true });
    B.cyl(-0.3, 0.012 + h, -0.1, 0.01, 0.01, 0.18, '#666', 4); B.cyl(0.3, 0.012 + h, -0.1, 0.01, 0.01, 0.18, '#666', 4);
  } else if (lvl === 3) {
    const floors = 6 + v * 2, h = floors * FLOOR;
    B.box(0, 0.012, 0, 0.9, 2 * FLOOR, 0.9, B.pick(P.glass), { facade: true, roof: '#888' });
    B.box(0, 0.012 + 2 * FLOOR, -0.02, 0.8, h - 2 * FLOOR, 0.8, wall, { facade: true, roof: '#7f7f7c' });
    B.box(0, 0.012 + h, 0, 0.3, 0.14, 0.3, '#999');
    B.box(0, 0.012 + h * 0.6, 0.41, 0.3, 0.5, 0.02, B.pick(['#ff8a5c', '#5cc8ff', '#ffd45c', '#ff5cae']), { glow: true });
  } else {
    const floors = 20 + v * 5, h = floors * FLOOR;
    B.box(0, 0.012, 0, 0.92, 3 * FLOOR, 0.92, B.pick(P.glass), { facade: true, roof: '#888' });
    const w = v === 2 ? 0.62 : 0.72;
    B.box(0, 0.012 + 3 * FLOOR, 0, w, h - 3 * FLOOR, w, B.pick(P.glass), { facade: true, roof: '#7a7c80' });
    if (v === 1) B.cone(0, 0.012 + h, 0, w * 0.6, 0.6, '#b8c7d4', 4);
    else B.box(0, 0.012 + h, 0, w * 0.8, 0.08, w * 0.8, '#dfe8ef', { glow: true });
    B.cyl(0, 0.012 + h, 0, 0.01, 0.01, 0.8, '#ddd', 4);
    B.sphere(0, 0.012 + h + 0.82, 0, 0.03, '#ff4a3a', 1, 2, 6);
  }
}

function industrial(B, lvl, v) {
  const wall = B.pick(P.indWall), roof = B.pick(P.indRoof);
  B.box(0, 0, 0, 0.96, 0.01, 0.96, '#8f8b82');
  if (lvl === 1) {
    B.box(-0.05, 0.01, -0.05, 0.7, 0.24, 0.6, wall, { facade: true, roof });
    // toit en dents de scie
    for (let k = 0; k < 3; k++) {
      const g = new THREE.BoxGeometry(0.7, 0.012, 0.22); g.rotateX(-0.5); g.translate(-0.05, 0.3, -0.28 + k * 0.2);
      B.geo(g, roof);
    }
    B.cyl(0.3, 0.01, -0.28, 0.035, 0.045, 0.55, '#7d5a4a', 8);
    B.meta.smoke.push([0.3, 0.58, -0.28]);
    for (let k = 0; k < 3; k++) B.box(0.3 - k * 0.12, 0.01, 0.38, 0.1, 0.08, 0.1, '#a4773f');
  } else if (lvl === 2) {
    B.box(0, 0.01, -0.08, 0.86, 0.38, 0.62, wall, { facade: true, roof });
    B.box(-0.2, 0.01, 0.3, 0.3, 0.2, 0.2, B.pick(P.indWall), { facade: true, roof });
    B.cyl(0.3, 0.01, 0.3, 0.1, 0.1, 0.4, '#c0c2c4', 12);
    B.cone(0.3, 0.41, 0.3, 0.1, 0.08, '#a8aaac', 12);
    B.cyl(-0.3, 0.39, -0.2, 0.04, 0.055, 0.6, '#8a4c3a', 10);
    B.box(-0.3, 0.8, -0.2, 0.11, 0.03, 0.11, '#ddd');
    B.meta.smoke.push([-0.3, 1.0, -0.2]);
  } else if (lvl === 3) {
    B.box(-0.1, 0.01, 0, 0.66, 0.5, 0.86, wall, { facade: true, roof });
    for (let k = 0; k < 3; k++) { B.cyl(0.35, 0.01, -0.3 + k * 0.28, 0.1, 0.1, 0.62, '#d4d6d8', 12); B.sphere(0.35, 0.63, -0.3 + k * 0.28, 0.1, '#d4d6d8', 0.5); }
    B.box(0.12, 0.5, 0, 0.5, 0.03, 0.03, '#999');
    for (const cz of [-0.25, 0.2]) {
      B.cyl(-0.3, 0.51, cz, 0.05, 0.07, 0.8, '#9b5040', 10);
      for (let k = 0; k < 3; k++) B.cyl(-0.3, 0.6 + k * 0.22, cz, 0.066 - k * 0.006, 0.066 - k * 0.006, 0.05, '#f0f0f0', 10);
      B.meta.smoke.push([-0.3, 1.34, cz]);
    }
  } else {
    // usine propre de haute technologie
    B.box(0, 0.01, 0, 0.9, 0.44, 0.8, '#eef2f5', { facade: true, roof: '#e0e6ea' });
    B.box(0, 0.01, 0.41, 0.9, 0.12, 0.01, '#6fa7c8', { glow: false, roof: '#6fa7c8' });
    for (let k = 0; k < 4; k++) {
      const g = new THREE.BoxGeometry(0.18, 0.01, 0.3); g.rotateX(-0.4); g.translate(-0.3 + k * 0.2, 0.52, -0.1);
      B.geo(g, '#23395b');
    }
    B.box(0.3, 0.45, 0.25, 0.14, 0.02, 0.14, '#7ee0ff', { glow: true });
  }
}

function offices(B, lvl, v) {
  const glass = B.pick(P.glass);
  B.box(0, 0, 0, 0.96, 0.012, 0.96, '#cfcac0');
  if (lvl === 1) {
    const h = 3 * FLOOR;
    B.box(0, 0.012, 0, 0.76, h, 0.66, glass, { facade: true, roof: '#8a8c90' });
    B.box(0, 0.012 + h, 0, 0.8, 0.03, 0.7, '#e4e4e4');
    B.tree(0.38, 0.4, 0.6, 0); B.tree(-0.38, 0.4, 0.6, 0);
  } else if (lvl === 2) {
    const h = (5 + v) * FLOOR;
    B.box(0, 0.012, 0, 0.84, h, 0.8, glass, { facade: true, roof: '#83868a' });
    for (let k = 0; k < 4; k++) B.box(-0.42 + k * 0.28, 0.012, 0.405, 0.03, h, 0.02, '#dfe3e6');
    B.box(0.2, 0.012 + h, -0.1, 0.2, 0.1, 0.2, '#9a9da1');
  } else if (lvl === 3) {
    const f = 9 + v * 2, h = f * FLOOR;
    B.box(0, 0.012, 0, 0.9, h * 0.35, 0.9, glass, { facade: true, roof: '#83868a' });
    B.box(0, 0.012 + h * 0.35, 0, 0.72, h * 0.65, 0.72, B.pick(P.glass), { facade: true, roof: '#83868a' });
    B.box(0, 0.012 + h, 0, 0.5, 0.06, 0.5, '#bfe8ff', { glow: true });
  } else {
    const f = 28 + v * 6, h = f * FLOOR;
    const w0 = 0.84;
    if (v === 0) {
      B.box(0, 0.012, 0, w0, h, w0, glass, { facade: true, roof: '#7b7e82' });
      B.box(0, 0.012 + h, 0, w0 * 0.7, 0.3, w0 * 0.7, '#dfe7ee');
      B.cyl(0, 0.312 + h, 0, 0.012, 0.02, 1.1, '#e6e6e6', 5);
    } else if (v === 1) {
      let y = 0.012, w = w0;
      for (let k = 0; k < 4; k++) { const hh = h / 4; B.box(0, y, 0, w, hh, w, glass, { facade: true, roof: '#7b7e82' }); y += hh; w -= 0.12; }
      B.cone(0, y, 0, w * 0.75, 0.9, '#c9d6e0', 4);
    } else {
      // tour torsadée
      let y = 0.012;
      const n = 14;
      for (let k = 0; k < n; k++) {
        const g = new THREE.BoxGeometry(0.66, h / n, 0.66);
        g.rotateY(k * 0.07); g.translate(0, y + h / n / 2, 0);
        const B2 = g;
        // la façade de chaque segment reçoit des fenêtres
        const uv = B2.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.66, uv.getY(i) * (h / n) / (FLOOR * 8) + k * 0.13);
        B.geo(B2, glass, 0);
        y += h / n;
      }
      B.box(0, y, 0, 0.4, 0.1, 0.4, '#9fe4ff', { glow: true });
    }
    B.sphere(0, 0.012 + h + 1.3, 0, 0.03, '#ff4a3a', 1, 2, 6);
  }
}

// ---------------------------------------------------------------------
// Services et merveilles (modèles centrés, emprise size x size)
// ---------------------------------------------------------------------
export function serviceModel(type, lvl = 1, size = 1) {
  const B = new Builder(type.length * 31 + lvl * 7);
  B.style = 'res';
  const S = size, f = SERVICES[type];
  if (f) f(B, lvl, S); else B.box(0, 0, 0, S * 0.8, 0.4, S * 0.8, '#ccc', { facade: true });
  return B;
}

function plot(B, S, color = '#bdb8ad') { B.box(0, 0, 0, S - 0.04, 0.012, S - 0.04, color, { roof: color }); }
function floorsUp(B, lvl) { return (lvl - 1) * 2; }
function flag(B, x, y, z, color) { B.cyl(x, y, z, 0.006, 0.006, 0.3, '#ddd', 4); B.box(x + 0.05, y + 0.22, z, 0.1, 0.06, 0.005, color); }
function cross(B, x, y, z, s, color, glow) {
  B.box(x, y, z, s, 0.02, s * 0.3, color, { glow }); B.box(x, y, z, s * 0.3, 0.021, s, color, { glow });
}

const SERVICES = {
  mairie(B, lvl, S) {
    plot(B, S, '#d8d2c4');
    const w = 1.3, d = 0.9, h = 0.42 + lvl * 0.14;
    B.box(0, 0.012, -0.1, w, h, d, '#efe6d2', { facade: true, roof: '#b9b1a0' });
    // portique à colonnes
    for (let k = 0; k < 6; k++) B.cyl(-0.4 + k * 0.16, 0.012, 0.42, 0.03, 0.03, h * 0.8, '#f7f2e6', 10);
    B.box(0, 0.012 + h * 0.8, 0.42, 0.95, 0.05, 0.16, '#f2ebdc');
    B.gable(0, 0.062 + h * 0.8, 0.42, 0.95, 0.14, 0.18, '#e9dfcb');
    if (lvl >= 2) { B.cyl(0, 0.012 + h, -0.1, 0.22, 0.24, 0.12, '#e8dfca', 16); B.sphere(0, 0.13 + h, -0.1, 0.22, '#6f8fa3', 0.8, 1, 16); }
    if (lvl >= 3) { B.box(-0.55, 0.012, -0.1, 0.3, h + 0.25, 0.3, '#efe6d2', { facade: true }); B.box(-0.55, h + 0.26, -0.1, 0.18, 0.02, 0.18, '#fff6d6', { glow: true }); B.cone(-0.55, h + 0.27, -0.1, 0.2, 0.3, '#5c7385', 4); }
    if (lvl >= 4) { B.box(0.55, 0.012, -0.1, 0.3, h + 0.1, 0.5, '#efe6d2', { facade: true }); flag(B, 0, 0.35 + h, -0.1, '#3b6fd6'); }
    flag(B, 0.6, 0.012, 0.6, '#e04a3a');
    B.tree(-0.75, 0.7, 0.9, 0); B.tree(0.75, 0.7, 0.9, 0);
    B.box(0, 0.013, 0.72, 0.4, 0.004, 0.3, '#cfc6b3');
    B.cyl(-0.4, 0.013, 0.72, 0.1, 0.12, 0.05, '#bcb3a0', 12); B.cyl(-0.4, 0.063, 0.72, 0.08, 0.08, 0.01, '#6fb7e0', 12, 2);
  },
  eolienne(B) {
    B.lawn(0.96, '#77a85a');
    B.cyl(0, 0, 0, 0.1, 0.12, 0.04, '#bbb', 10);
    B.cyl(0, 0.04, 0, 0.025, 0.05, 1.4, '#f4f6f7', 12);
    B.box(0, 1.42, -0.02, 0.07, 0.07, 0.18, '#eef1f2');
    B.meta.blades = [0, 1.455, 0.08];
  },
  charbon(B) {
    plot(B, 2, '#8d887e');
    B.box(-0.3, 0.012, 0.1, 1.0, 0.6, 1.2, '#9a6b55', { facade: true, roof: '#5f5a55' });
    B.box(-0.3, 0.6, 0.1, 1.0, 0.18, 1.2, '#7b5646', { roof: '#555' });
    for (const [x, z] of [[0.55, -0.45], [0.55, 0.15]]) {
      B.cyl(x, 0.012, z, 0.1, 0.16, 1.9, '#d8d3cb', 14);
      for (let k = 0; k < 3; k++) B.cyl(x, 1.1 + k * 0.28, z, 0.13 - k * 0.012, 0.13 - k * 0.012, 0.08, '#c0392b', 14);
      B.meta.smoke.push([x, 1.95, z]);
    }
    B.cone(0.3, 0.012, 0.7, 0.25, 0.22, '#232323', 10); B.cone(0.62, 0.012, 0.72, 0.18, 0.16, '#2a2a2a', 10);
  },
  solaire(B) {
    B.lawn(1.96, '#7aa35a');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const g = new THREE.BoxGeometry(0.4, 0.015, 0.36); g.rotateX(-0.5); g.translate(-0.66 + i * 0.44, 0.2, -0.6 + j * 0.5);
      B.geo(g, '#1f3553');
      B.cyl(-0.66 + i * 0.44, 0, -0.6 + j * 0.5, 0.01, 0.01, 0.18, '#aaa', 4);
    }
    B.box(0.6, 0, 0.8, 0.5, 0.2, 0.26, '#e7e7e2', { facade: true });
  },
  gaz(B) {
    plot(B, 2, '#a19d94');
    B.box(-0.35, 0.012, 0, 0.9, 0.5, 1.5, '#dfe2e4', { facade: true, roof: '#8c9196' });
    for (const z of [-0.45, 0.4]) { B.sphere(0.5, 0.35, z, 0.3, '#e6e8ea', 1, 1, 16); B.cyl(0.5, 0, z, 0.03, 0.03, 0.2, '#999', 5); }
    B.cyl(-0.35, 0.5, -0.5, 0.07, 0.09, 0.7, '#b9bdc0', 10);
    B.meta.smoke.push([-0.35, 1.22, -0.5]);
  },
  nucleaire(B) {
    plot(B, 3, '#a8a49b');
    const tower = new THREE.LatheGeometry([0.55, 0.47, 0.4, 0.36, 0.35, 0.37, 0.41].map((r, k) => new THREE.Vector2(r, k * 0.28)), 24);
    for (const x of [-0.7, 0.55]) {
      const g = tower.clone(); g.translate(x, 0.012, -0.55);
      B.geo(g, '#d9d6cf');
      B.meta.steam.push([x, 1.75, -0.55]);
    }
    tower.dispose();
    B.cyl(0, 0.012, 0.7, 0.4, 0.4, 0.5, '#e6e3dc', 20); B.sphere(0, 0.51, 0.7, 0.4, '#ecebe6', 0.6, 1, 20);
    B.box(0.85, 0.012, 0.75, 0.6, 0.35, 0.8, '#cfd4d8', { facade: true, roof: '#8a9096' });
  },
  pompe(B) {
    plot(B, 1, '#b7b2a6');
    B.box(-0.1, 0.012, 0, 0.44, 0.26, 0.4, '#dfe8ee', { facade: true, roof: '#4a7aa0' });
    B.cyl(0.28, 0.012, -0.25, 0.14, 0.14, 0.3, '#5b93c7', 14);
    const g = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8); g.rotateZ(Math.PI / 2); g.translate(0.2, 0.08, 0.3);
    B.geo(g, '#6c8ea8');
  },
  chateau(B) {
    B.lawn(0.96, '#78a65b');
    for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) B.cyl(x, 0, z, 0.02, 0.025, 1.0, '#9aa3aa', 6);
    B.cyl(0, 0, 0, 0.05, 0.05, 1.0, '#b4bcc2', 8);
    B.sphere(0, 1.15, 0, 0.3, '#e9eef2', 0.75, 1, 18);
    B.box(0, 1.1, 0.29, 0.22, 0.08, 0.02, '#3d7cc9');
  },
  epuration(B) {
    plot(B, 2, '#a7a399');
    for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.4]]) {
      B.cyl(x, 0.012, z, 0.38, 0.38, 0.12, '#c9c6bf', 20);
      B.cyl(x, 0.13, z, 0.34, 0.34, 0.005, '#5a8f7b', 20);
    }
    B.box(0.45, 0.012, 0.45, 0.6, 0.3, 0.5, '#e3e6e8', { facade: true, roof: '#7a8f99' });
  },
  decharge(B) {
    plot(B, 2, '#7d7465');
    B.cone(-0.35, 0.012, -0.3, 0.55, 0.45, '#8a7a5f', 10); B.cone(0.4, 0.012, -0.4, 0.4, 0.3, '#6f6a5c', 9); B.cone(0.1, 0.012, 0.35, 0.45, 0.28, '#95846a', 9);
    for (let k = 0; k < 8; k++) B.box(-0.9 + k * 0.25, 0.012, 0.93, 0.02, 0.18, 0.02, '#777');
    B.box(0, 0.012, 0.93, 1.9, 0.02, 0.01, '#777', { noTop: false });
    B.box(0.65, 0.012, 0.55, 0.24, 0.13, 0.12, '#e0a526'); B.box(0.78, 0.012, 0.55, 0.08, 0.16, 0.12, '#e0a526');
  },
  incinerateur(B) {
    plot(B, 2, '#9e998f');
    B.box(-0.2, 0.012, 0.1, 1.2, 0.7, 1.1, '#c1c5c8', { facade: true, roof: '#6f757a' });
    B.cyl(0.6, 0.012, -0.55, 0.1, 0.14, 2.2, '#c8c2b8', 12);
    B.cyl(0.6, 2.0, -0.55, 0.105, 0.105, 0.1, '#b84a3a', 12);
    B.meta.smoke.push([0.6, 2.25, -0.55]);
  },
  recyclage(B) {
    plot(B, 2, '#a9a79e');
    B.box(-0.25, 0.012, -0.1, 1.2, 0.5, 1.2, '#e2e9e3', { facade: true, roof: '#5da35a' });
    const cols = ['#2f8f4f', '#2f6fb0', '#e0b12f', '#8a8f94'];
    for (let k = 0; k < 4; k++) B.box(0.7, 0.012, -0.6 + k * 0.38, 0.35, 0.22, 0.3, cols[k]);
  },
  police(B, lvl) {
    plot(B, 1, '#c4c0b6');
    const h = 0.34 + floorsUp(B, lvl) * FLOOR * 0.6;
    B.box(0, 0.012, -0.05, 0.78, h, 0.66, '#e8ecf0', { facade: true, roof: '#6e7c8c' });
    B.box(0, 0.012 + h - 0.06, 0.285, 0.78, 0.06, 0.01, '#2c5aa0');
    B.box(0, 0.012 + h, -0.05, 0.3, 0.04, 0.3, '#9fc3ff', { glow: true });
    for (const x of [-0.25, 0.1]) { B.box(x, 0.012, 0.4, 0.2, 0.07, 0.1, '#1d3f78'); B.box(x, 0.082, 0.4, 0.1, 0.04, 0.08, '#f2f2f2'); B.box(x, 0.122, 0.4, 0.04, 0.015, 0.03, '#ff3b3b', { glow: true }); }
    if (lvl >= 3) B.cyl(0.3, 0.012 + h, -0.2, 0.01, 0.01, 0.4, '#ccc', 4);
    flag(B, -0.36, 0.012 + h, -0.3, '#2c5aa0');
  },
  pompiers(B, lvl) {
    plot(B, 1, '#c4c0b6');
    const h = 0.34 + floorsUp(B, lvl) * FLOOR * 0.6;
    B.box(-0.08, 0.012, -0.05, 0.66, h, 0.66, '#c8463b', { facade: true, roof: '#5f3b36' });
    for (let k = 0; k < 2; k++) B.box(-0.26 + k * 0.33, 0.012, 0.285, 0.26, 0.22, 0.01, '#333a40');
    B.box(0.34, 0.012, -0.2, 0.18, h + 0.3, 0.18, '#b53d33', { facade: true, roof: '#5f3b36' });
    B.box(0.2, 0.012, 0.42, 0.26, 0.1, 0.1, '#d83a2e'); B.box(0.2, 0.112, 0.42, 0.04, 0.015, 0.03, '#ffb03b', { glow: true });
  },
  clinique(B, lvl) {
    plot(B, 1, '#cfcac0');
    const h = 0.36 + floorsUp(B, lvl) * FLOOR * 0.6;
    B.box(0, 0.012, -0.05, 0.8, h, 0.66, '#f4f6f7', { facade: true, roof: '#dde3e6' });
    cross(B, 0, 0.012 + h, -0.05, 0.3, '#e53935', true);
    B.box(0, 0.012, 0.3, 0.34, 0.12, 0.08, '#9ed1e8');
  },
  hopital(B, lvl) {
    plot(B, 2, '#d3cec3');
    const h = 0.7 + floorsUp(B, lvl) * FLOOR;
    B.box(-0.2, 0.012, -0.1, 1.2, h, 1.0, '#f3f5f6', { facade: true, roof: '#d9dfe3' });
    B.box(0.6, 0.012, 0.2, 0.5, h * 0.6, 1.2, '#e6eef3', { facade: true, roof: '#d9dfe3' });
    B.cyl(-0.2, 0.012 + h, -0.1, 0.34, 0.34, 0.02, '#4a5560', 20);
    B.box(-0.2, 0.034 + h, -0.1, 0.06, 0.005, 0.3, '#fff', { glow: true }); B.box(-0.28, 0.034 + h, -0.1, 0.06, 0.005, 0.3, '#fff', { glow: true }); B.box(-0.12, 0.034 + h, -0.1, 0.06, 0.005, 0.3, '#fff', { glow: true });
    cross(B, 0.6, 0.02 + h * 0.6, 0.3, 0.34, '#e53935', true);
  },
  ecole(B, lvl) {
    plot(B, 1, '#c9c2b2');
    const h = 0.3 + floorsUp(B, lvl) * FLOOR * 0.5;
    B.box(-0.12, 0.012, -0.12, 0.66, h, 0.6, '#c9774f', { facade: true, roof: '#6d4a3a' });
    B.gable(-0.12, 0.012 + h, -0.12, 0.7, 0.14, 0.64, '#7a4c3c', '#c9774f');
    B.box(0.3, 0.013, 0.3, 0.34, 0.004, 0.34, '#d86a4a');
    B.box(0.3, 0.013, 0.3, 0.02, 0.2, 0.02, '#f0c419');
    flag(B, 0.38, 0.012, -0.36, '#3a7bd5');
  },
  lycee(B, lvl) {
    plot(B, 2, '#c7c0b0');
    const h = 0.45 + floorsUp(B, lvl) * FLOOR * 0.6;
    B.box(-0.4, 0.012, -0.3, 1.0, h, 1.2, '#d08a5c', { facade: true, roof: '#5f4c42' });
    B.box(0.5, 0.013, 0.3, 0.85, 0.005, 1.3, '#4f9a4a');
    B.box(0.5, 0.019, 0.3, 0.02, 0.001, 1.2, '#ffffff'); B.box(0.5, 0.019, 0.3, 0.75, 0.001, 0.02, '#ffffff');
    for (const z of [-0.33, 0.93]) { B.box(0.5, 0.013, z, 0.2, 0.1, 0.02, '#eee'); }
  },
  universite(B, lvl) {
    B.lawn(2.96, '#6f9f52');
    const h = 0.7 + floorsUp(B, lvl) * FLOOR;
    B.box(0, 0.004, -0.6, 2.0, h, 0.9, '#e6dcc6', { facade: true, roof: '#8a7f6c' });
    for (let k = 0; k < 8; k++) B.cyl(-0.7 + k * 0.2, 0.004, -0.12, 0.035, 0.035, h * 0.85, '#f6f1e6', 10);
    B.box(0, 0.004 + h * 0.85, -0.12, 1.7, 0.06, 0.1, '#efe7d6');
    B.box(-1.05, 0.004, 0.6, 0.6, h * 0.8, 1.2, '#dccfb4', { facade: true, roof: '#8a7f6c' });
    B.box(1.05, 0.004, 0.6, 0.6, h * 0.8, 1.2, '#dccfb4', { facade: true, roof: '#8a7f6c' });
    B.box(0, 0.004, -0.6, 0.3, h + 0.7, 0.3, '#e9e0cc', { facade: true });
    B.box(0, 0.004 + h + 0.55, -0.44, 0.14, 0.14, 0.01, '#fff3c4', { glow: true });
    B.cone(0, 0.004 + h + 0.7, -0.6, 0.23, 0.4, '#56707f', 4);
    B.box(0, 0.005, 0.5, 0.2, 0.003, 1.9, '#d8cfb8');
    for (const [x, z] of [[-0.4, 0.3], [0.4, 0.3], [-0.4, 1.1], [0.4, 1.1]]) B.tree(x, z, 1.1, 0);
  },
  bibliotheque(B) {
    plot(B, 1, '#d2ccbd');
    B.box(0, 0.012, -0.08, 0.76, 0.36, 0.56, '#ece2cc', { facade: true, roof: '#8f8573' });
    for (let k = 0; k < 4; k++) B.cyl(-0.27 + k * 0.18, 0.012, 0.26, 0.025, 0.025, 0.3, '#f7f2e6', 8);
    B.gable(0, 0.34, 0.26, 0.72, 0.1, 0.12, '#e9dfcb');
    B.sphere(0, 0.37, -0.08, 0.16, '#6f8fa3', 0.7, 1, 12);
  },
  parc(B) {
    B.lawn(0.98, '#6aa34f');
    B.box(0, 0.006, 0, 0.14, 0.003, 0.98, '#d9ccaa'); B.box(0, 0.006, 0, 0.98, 0.003, 0.14, '#d9ccaa');
    B.tree(-0.28, -0.28, 1.2, 0); B.tree(0.3, -0.26, 1.0, 1); B.tree(-0.3, 0.3, 1.1, 0); B.tree(0.28, 0.3, 1.2, 0);
    B.box(0.12, 0.006, 0.2, 0.12, 0.04, 0.03, '#8a5a3c');
  },
  place(B) {
    plot(B, 1, '#d8cfbd');
    B.cyl(0, 0.012, 0, 0.26, 0.28, 0.06, '#c8bfae', 20);
    B.cyl(0, 0.072, 0, 0.23, 0.23, 0.005, '#6db8e6', 20, 2);
    B.cyl(0, 0.07, 0, 0.03, 0.04, 0.16, '#c8bfae', 8);
    B.sphere(0, 0.25, 0, 0.05, '#bfe6ff', 1.2, 2, 8);
    for (const [x, z] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) B.tree(x, z, 0.9, 0);
  },
  grandparc(B) {
    B.lawn(1.96, '#68a14c');
    B.cyl(0.3, 0.004, 0.25, 0.45, 0.45, 0.006, '#5aa0c8', 24);
    B.cyl(0.3, 0.004, 0.25, 0.49, 0.49, 0.004, '#cbbd95', 24);
    B.box(-0.45, 0.006, 0, 0.12, 0.003, 1.96, '#d9ccaa');
    const pts = [[-0.8, -0.8], [-0.2, -0.75], [0.6, -0.7], [-0.8, 0.1], [-0.75, 0.75], [0.8, -0.2], [-0.1, 0.85], [0.85, 0.8]];
    pts.forEach(([x, z], k) => B.tree(x, z, 1.2 + (k % 3) * 0.15, k % 3 === 0 ? 1 : 0));
    B.box(-0.2, 0.004, -0.2, 0.2, 0.12, 0.2, '#f1ede4'); B.hip(-0.2, 0.124, -0.2, 0.26, 0.08, 0.26, '#6b8b5a');
  },
  stade(B) {
    plot(B, 3, '#b6b1a6');
    const bowl = new THREE.LatheGeometry([new THREE.Vector2(0.9, 0), new THREE.Vector2(1.38, 0.55), new THREE.Vector2(1.4, 0.55), new THREE.Vector2(1.42, 0)], 40);
    bowl.scale(1, 1, 0.8); bowl.translate(0, 0.012, 0);
    B.geo(bowl, '#dfe3e6');
    B.cyl(0, 0.012, 0, 0.92, 0.92, 0.01, '#3f8f3a', 40);
    B.box(0, 0.024, 0, 0.9, 0.002, 0.02, '#fff');
    const ring = new THREE.TorusGeometry(1.35, 0.03, 6, 40); ring.rotateX(Math.PI / 2); ring.scale(1, 1, 0.8); ring.translate(0, 0.6, 0);
    B.geo(ring, '#c0392b');
    for (const [x, z] of [[-1.3, -1.0], [1.3, -1.0], [-1.3, 1.0], [1.3, 1.0]]) { B.cyl(x, 0.012, z, 0.02, 0.03, 1.0, '#999', 5); B.box(x, 1.0, z, 0.2, 0.1, 0.04, '#fff8d8', { glow: true }); }
  },
  musee(B) {
    plot(B, 2, '#d5cfc2');
    B.box(0, 0.012, -0.15, 1.6, 0.5, 1.2, '#efe8da', { facade: true, roof: '#b8b0a0' });
    for (let k = 0; k < 7; k++) B.cyl(-0.6 + k * 0.2, 0.012, 0.5, 0.03, 0.03, 0.44, '#f8f3e8', 10);
    B.gable(0, 0.46, 0.5, 1.4, 0.16, 0.14, '#e9dfcb');
    B.cone(0, 0.512, -0.15, 0.45, 0.45, '#9fd0ea', 4, 0);
    B.box(0, 0.013, 0.8, 0.6, 0.003, 0.3, '#cfc6b3');
  },
  bus(B) {
    plot(B, 1, '#a9a59c');
    B.box(-0.1, 0.012, -0.2, 0.74, 0.26, 0.5, '#e3e7ea', { facade: true, roof: '#8aa1b1' });
    for (const x of [-0.25, 0.1]) { B.box(x, 0.012, 0.3, 0.3, 0.12, 0.1, '#f2b705'); B.box(x, 0.06, 0.352, 0.26, 0.04, 0.002, '#27465c'); }
  },
  metro(B) {
    plot(B, 1, '#cfcac0');
    B.box(0, 0.012, 0, 0.5, 0.02, 0.36, '#666');
    const g = new THREE.CylinderGeometry(0.28, 0.28, 0.6, 16, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.translate(0, 0.14, 0);
    B.geo(g, '#9fd0ea', 0);
    B.cyl(0.36, 0.012, 0.3, 0.012, 0.012, 0.4, '#ddd', 4);
    B.box(0.36, 0.4, 0.3, 0.12, 0.12, 0.02, '#2f6fd6', { glow: true });
  },
  gare(B) {
    plot(B, 2, '#9c978d');
    for (const z of [-0.5, 0, 0.5]) { B.box(0, 0.013, z, 1.9, 0.004, 0.04, '#6b5a4a'); }
    const g = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.translate(0, 0.1, -0.25); g.scale(1, 0.6, 1);
    B.geo(g, '#a9c4d6');
    const cols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'];
    for (let k = 0; k < 5; k++) B.box(-0.8 + k * 0.4, 0.012, 0.65, 0.34, 0.15, 0.14, cols[k]);
  },
  tour(B) {
    plot(B, 2, '#d6d0c4');
    B.box(0, 0.012, 0, 1.6, 0.3, 1.6, '#dfe6ec', { facade: true, roof: '#9aa8b4' });
    let y = 0.31;
    const levels = [[1.0, 1.6], [0.84, 1.6], [0.68, 1.4], [0.52, 1.1], [0.38, 0.8]];
    for (const [w, h] of levels) { B.box(0, y, 0, w, h, w, '#a8c3d8', { facade: true, roof: '#dde7ee' }); B.box(0, y + h, 0, w + 0.06, 0.04, w + 0.06, '#f4f8fb', { glow: true }); y += h + 0.04; }
    B.cyl(0, y, 0, 0.03, 0.12, 1.6, '#eef2f5', 8);
    B.sphere(0, y + 1.65, 0, 0.06, '#ffd27a', 1, 2, 8);
  },
  opera(B) {
    plot(B, 3, '#dcd6ca');
    B.box(0, 0.012, 0.2, 2.4, 0.3, 1.8, '#d9cfbd', { roof: '#cbbfa8' });
    const shells = [[-0.8, 0.8, 0.9], [-0.2, 1.1, 1.2], [0.5, 0.9, 1.0], [1.0, 0.6, 0.7]];
    for (const [x, sc, h] of shells) {
      const g = new THREE.SphereGeometry(0.6, 16, 10, 0, Math.PI, 0, Math.PI / 2); g.rotateY(-Math.PI / 2); g.scale(sc * 0.7, h * 1.6, sc);
      g.translate(x, 0.31, 0.1);
      B.geo(g, '#f7f5ef');
    }
    for (let k = 0; k < 5; k++) B.box(-1 + k * 0.5, 0.31, 1.0, 0.3, 0.08, 0.02, '#ffe7b0', { glow: true });
  },
  arcologie(B) {
    plot(B, 3, '#c9c4b8');
    let y = 0.012, w = 2.8;
    for (let k = 0; k < 7; k++) {
      const h = 0.45;
      B.box(0, y, 0, w, h, w, '#e8ecef', { facade: true, roof: '#5f9a4a' });
      for (let t = 0; t < 4; t++) { const a = t * Math.PI / 2; B.tree(Math.cos(a) * (w / 2 - 0.1), Math.sin(a) * (w / 2 - 0.1), 0.9, 0, y + h); }
      y += h; w -= 0.34;
    }
    B.sphere(0, y, 0, 0.4, '#bfe4f5', 0.6, 0, 16);
  },
  fusion(B) {
    plot(B, 3, '#b9b8b4');
    B.box(0, 0.012, 0, 2.6, 0.2, 2.6, '#d7dade', { roof: '#9aa0a6' });
    const tor = new THREE.TorusGeometry(0.8, 0.22, 12, 40); tor.rotateX(Math.PI / 2); tor.translate(0, 0.55, 0);
    B.geo(tor, '#c7ccd2');
    const glow = new THREE.TorusGeometry(0.8, 0.08, 8, 40); glow.rotateX(Math.PI / 2); glow.translate(0, 0.78, 0);
    B.geo(glow, '#7ee8ff', 2);
    B.sphere(0, 0.22, 0, 0.4, '#e4e7ea', 0.8, 1, 16);
    for (const [x, z] of [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]]) B.cyl(x, 0.21, z, 0.16, 0.18, 0.5, '#e8ebee', 12);
  },
  spatioport(B) {
    plot(B, 4, '#a8a59e');
    B.cyl(0.6, 0.012, -0.5, 0.9, 0.9, 0.1, '#6e7176', 28);
    B.cyl(0.6, 0.112, -0.5, 0.55, 0.55, 0.005, '#f2c230', 28);
    // fusée
    B.cyl(0.6, 0.12, -0.5, 0.16, 0.18, 2.6, '#f4f5f7', 16);
    B.cyl(0.6, 1.2, -0.5, 0.165, 0.165, 0.12, '#222', 16);
    B.cone(0.6, 2.72, -0.5, 0.16, 0.5, '#d8412f', 16);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; B.box(0.6 + Math.cos(a) * 0.2, 0.12, -0.5 + Math.sin(a) * 0.2, 0.05 + Math.abs(Math.sin(a)) * 0.1, 0.4, 0.05 + Math.abs(Math.cos(a)) * 0.1, '#d8412f'); }
    // tour de lancement
    B.box(1.25, 0.012, -0.5, 0.18, 3.0, 0.18, '#d24a2a', { facade: false });
    for (let k = 0; k < 5; k++) B.box(1.0, 0.5 + k * 0.55, -0.5, 0.3, 0.03, 0.04, '#9a3a22');
    B.box(-1.0, 0.012, 0.8, 1.6, 0.6, 1.0, '#e2e6ea', { facade: true, roof: '#7a8791' });
    B.box(-1.0, 0.012, -0.9, 1.2, 0.8, 0.9, '#d9dfe4', { facade: true, roof: '#7a8791' });
    B.box(0.9, 0.013, 1.2, 1.6, 0.004, 0.8, '#3a3e44');
    for (let k = 0; k < 6; k++) B.box(0.2 + k * 0.28, 0.02, 1.2, 0.12, 0.002, 0.03, '#ffffff', { glow: true });
  },
};

// Pales d'éolienne (animées à part)
export function bladesGeometry() {
  const B = new Builder(9);
  for (let k = 0; k < 3; k++) {
    const g = new THREE.BoxGeometry(0.04, 0.62, 0.01); g.translate(0, 0.32, 0); g.rotateZ(k * Math.PI * 2 / 3);
    B.geo(g, '#f7f8f9');
  }
  B.sphere(0, 0, 0, 0.035, '#e6e9eb', 1, 1, 8);
  return B.build();
}
// Arbres (instanciés) : feuillu et conifère
export function treeGeometry(kind) {
  const B = new Builder(kind + 1);
  B.cyl(0, 0, 0, 0.025, 0.04, 0.16, '#6b4a2f', 6);
  if (kind === 0) {
    B.sphere(0, 0.3, 0, 0.17, '#ffffff', 1.05, 1, 9);
    B.sphere(0.07, 0.24, 0.05, 0.11, '#f2f2f2', 1, 1, 7);
    B.sphere(-0.07, 0.26, -0.04, 0.1, '#f7f7f7', 1, 1, 7);
  } else if (kind === 1) {
    B.cone(0, 0.1, 0, 0.16, 0.3, '#ffffff', 8); B.cone(0, 0.28, 0, 0.12, 0.26, '#ffffff', 8);
  } else {
    B.sphere(0, 0.32, 0, 0.12, '#ffffff', 1.6, 1, 8);
  }
  return B.build();
}
export function carGeometry() {
  const B = new Builder(3);
  B.box(0, 0.02, 0, 0.1, 0.045, 0.2, '#ffffff');
  B.box(0, 0.065, -0.01, 0.085, 0.04, 0.11, '#ffffff', { roof: '#ffffff' });
  B.box(0, 0.066, 0.046, 0.08, 0.034, 0.002, '#1d2a36'); B.box(0, 0.066, -0.066, 0.08, 0.034, 0.002, '#1d2a36');
  for (const [x, z] of [[-0.05, 0.06], [0.05, 0.06], [-0.05, -0.06], [0.05, -0.06]]) B.box(x, 0, z, 0.012, 0.035, 0.035, '#151515');
  return B.build();
}
export function carLightsGeometry() {
  const B = new Builder(4);
  B.box(-0.035, 0.035, 0.101, 0.022, 0.014, 0.004, '#fff6d0', { glow: true }); B.box(0.035, 0.035, 0.101, 0.022, 0.014, 0.004, '#fff6d0', { glow: true });
  B.box(-0.035, 0.035, -0.101, 0.022, 0.012, 0.004, '#ff2a1a', { glow: true }); B.box(0.035, 0.035, -0.101, 0.022, 0.012, 0.004, '#ff2a1a', { glow: true });
  return B.build();
}
export function boatGeometry() {
  const B = new Builder(5);
  const g = new THREE.CylinderGeometry(0.06, 0.035, 0.34, 8); g.rotateX(Math.PI / 2); g.scale(1, 0.4, 1); g.translate(0, 0.01, 0);
  B.geo(g, '#f4f4f4');
  B.box(0, 0.03, -0.03, 0.07, 0.05, 0.1, '#ffffff');
  B.box(0, 0.08, -0.03, 0.05, 0.004, 0.08, '#d24a3a');
  return B.build();
}
export function craneGeometry() {
  const B = new Builder(6);
  B.box(0, 0, 0, 0.06, 1.8, 0.06, '#e6b422');
  B.box(0.3, 1.8, 0, 1.0, 0.05, 0.05, '#e6b422');
  B.box(-0.28, 1.72, 0, 0.14, 0.1, 0.1, '#777');
  B.box(0.6, 1.4, 0, 0.004, 0.4, 0.004, '#333');
  return B.build();
}
export function lampGeometry() {
  const B = new Builder(8);
  B.cyl(0, 0, 0, 0.006, 0.008, 0.22, '#4a4f55', 5);
  B.box(0.03, 0.22, 0, 0.07, 0.008, 0.012, '#4a4f55');
  return B.build();
}
export function lampHeadGeometry() {
  const B = new Builder(8);
  B.box(0.06, 0.212, 0, 0.03, 0.006, 0.02, '#fff1c2', { glow: true });
  return B.build();
}
export function cloudGeometry(seed) {
  const B = new Builder(seed);
  const n = 5 + Math.floor(B.r() * 4);
  for (let k = 0; k < n; k++) B.sphere(B.rand(-1.6, 1.6), B.rand(0, 0.3), B.rand(-0.7, 0.7), B.rand(0.5, 0.95), '#ffffff', 0.6, 1, 10);
  return B.build();
}
