// Stories Instagram Autoflow : éclairage, volumes et métal brossé partagés par les quatre visuels.

const ACCENT = '#2d5bff';
const ACCENT_EDGE = ['#2248d6', '#0f2a8a'];

// Lumière principale haute, 35° à gauche de la verticale : les ombres partent vers le bas à droite.
const SHADOW_ANGLE = 55; // angle écran (y vers le bas) de la direction de l'ombre
const LIGHT_AZ = 235;    // azimut SVG vers la lumière
const LIGHT_EL = 50;     // élévation de la lumière
const COOL = '143,166,214'; // remplissage froid, à l'opposé de la lumière

function el(tag, cls, parent) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (parent) parent.appendChild(node);
  return node;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${c.join(',')})`;
}

// Direction de l'ombre dans le repère local d'un plan tourné de planeRot degrés (rotateZ).
function shadowDir(planeRot = 0) {
  const a = (SHADOW_ANGLE - planeRot) * Math.PI / 180;
  return [Math.cos(a), Math.sin(a)];
}

function castShadow(h, planeRot = 0, k = 1, color = '18,22,34') {
  const [dx, dy] = shadowDir(planeRot);
  const n = h * 0.45, f = h * 1.5;
  return [
    `${dx * n}px ${dy * n}px ${h * 0.5}px rgba(${color},${0.38 * k})`,
    `${dx * f}px ${dy * f}px ${h * 2.4}px rgba(${color},${0.22 * k})`,
  ].join(', ');
}

// Biseau de la face : reflet côté lumière, liseré fin, ombre et remplissage froid côté opposé.
function bevel(planeRot = 0, { hl = 0.5, sh = 0.28, cool = 0.3, s = 2.5 } = {}) {
  const [dx, dy] = shadowDir(planeRot);
  return [
    `inset ${dx * 0.8}px ${dy * 0.8}px 0 rgba(255,255,255,${hl})`,
    `inset ${dx * s}px ${dy * s}px ${s * 1.6}px rgba(255,255,255,${hl * 0.6})`,
    `inset ${-dx * s}px ${-dy * s}px ${s * 1.6}px rgba(0,0,0,${sh})`,
    `inset ${-dx * s * 2.4}px ${-dy * s * 2.4}px ${s * 4}px rgba(${COOL},${cool})`,
  ].join(', ');
}

// Objet en volume : `depth` couches de 1 px sous une face biseautée, ombre portée au sol.
function vol(parent, o) {
  const {
    x, y, w, h, r = 0, depth = 10, lift = 0,
    face, edge = ['#888888', '#333333'], planeRot = 0,
    shadow = 1, shadowColor, bevelOpts,
  } = o;
  const g = el('div', 'vol', parent);
  Object.assign(g.style, {
    left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
    transform: `translateZ(${lift + depth}px)`,
  });
  const radius = typeof r === 'number' ? `${r}px` : r;
  for (let i = depth; i >= 1; i--) {
    const layer = el('div', 'vol-layer', g);
    const t = depth === 1 ? 0 : (i - 1) / (depth - 1);
    layer.style.borderRadius = radius;
    layer.style.background = i === 1 ? mix(edge[0], '#ffffff', 0.18) : mix(edge[0], edge[1], t);
    layer.style.transform = `translateZ(${-i}px)`;
    if (i === depth && shadow) layer.style.boxShadow = castShadow(depth + lift, planeRot, shadow, shadowColor);
  }
  const f = el('div', 'vol-face', g);
  f.style.borderRadius = radius;
  f.style.background = face;
  f.style.boxShadow = bevel(planeRot, bevelOpts);
  return f;
}

// Élément imprimé à plat sur une face (barres de texte, repères).
function print(parent, { x, y, w, h, r = h / 2, bg, shadow }) {
  const p = el('div', 'print', parent);
  Object.assign(p.style, {
    left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
    borderRadius: `${r}px`, background: bg,
  });
  if (shadow) p.style.boxShadow = shadow;
  return p;
}

// Grain fin du verre dépoli.
function grainURL(alpha = 22, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.round(rand() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function applyGrain(node, alpha) {
  node.style.backgroundImage = `url(${grainURL(alpha)})`;
}

// Chiffres et mots en métal brossé : face biseautée éclairée, épaisseur, ombre portée.
const METALS = {
  light: { // sur fond sombre
    face: [[0, '#e9edf2'], [0.3, '#b9bfc8'], [0.48, '#7a818c'], [0.54, '#69707b'], [0.74, '#c4cad2'], [1, '#8a919b']],
    side: ['#5d636d', '#22252b'],
    shadow: 'rgba(0,0,0,0.7)',
  },
  dark: { // sur fond clair
    face: [[0, '#c3c9d1'], [0.28, '#959ca6'], [0.47, '#5d646e'], [0.53, '#525963'], [0.72, '#a0a7b1'], [1, '#737a84']],
    side: ['#4a5059', '#2a2e35'],
    shadow: 'rgba(22,28,44,0.30)',
  },
};

let metalId = 0;
const measureCtx = document.createElement('canvas').getContext('2d');

function metal(text, { size, weight = 800, depth = 10, tone = 'light', tracking = -0.04, standoff = 2.4 }) {
  const id = `metal${metalId++}`;
  const m = METALS[tone];
  const ls = size * tracking;
  measureCtx.font = `${weight} ${size}px Inter`;
  measureCtx.letterSpacing = `${ls}px`;
  const width = measureCtx.measureText(text).width;
  const cap = size * 0.727;
  const P = Math.round(size * 0.4 + depth * 3);
  const W = Math.ceil(width + 2 * P), H = Math.ceil(cap + 2 * P);
  const bx = P, by = P + cap;
  const blur = Math.max(1.6, size * 0.016);
  const [sdx, sdy] = shadowDir(0);
  const sOff = depth * standoff;
  const t = (dx, dy, fill, extra = '') =>
    `<text x="${bx + dx}" y="${by + dy}" fill="${fill}" ${extra}>${text}</text>`;
  let extrusion = '';
  for (let i = depth; i >= 1; i--) extrusion += t(0, i, mix(m.side[0], m.side[1], (i - 1) / Math.max(1, depth - 1)));
  const stops = m.face.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     style="font-family:Inter;font-weight:${weight};font-size:${size}px;letter-spacing:${ls}px">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="${by - cap}" x2="0" y2="${by}" gradientUnits="userSpaceOnUse">${stops}</linearGradient>
    <filter id="${id}b" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="h"/>
      <feDiffuseLighting in="h" surfaceScale="${blur * 1.4}" diffuseConstant="${1 / Math.sin(LIGHT_EL * Math.PI / 180)}" lighting-color="#fff" result="d">
        <feDistantLight azimuth="${LIGHT_AZ}" elevation="${LIGHT_EL}"/>
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" result="lit"/>
      <feSpecularLighting in="h" surfaceScale="${blur * 1.4}" specularConstant="0.9" specularExponent="44" lighting-color="#fff" result="s">
        <feDistantLight azimuth="${LIGHT_AZ}" elevation="${LIGHT_EL}"/>
      </feSpecularLighting>
      <feDiffuseLighting in="h" surfaceScale="${blur * 1.4}" diffuseConstant="0.9" lighting-color="rgb(${COOL})" result="c">
        <feDistantLight azimuth="${LIGHT_AZ - 180}" elevation="18"/>
      </feDiffuseLighting>
      <feComponentTransfer in="c" result="c2">
        <feFuncR type="linear" slope="1" intercept="-0.25"/>
        <feFuncG type="linear" slope="1" intercept="-0.25"/>
        <feFuncB type="linear" slope="1" intercept="-0.25"/>
      </feComponentTransfer>
      <feComposite in="lit" in2="s" operator="arithmetic" k2="1" k3="0.5" result="ls"/>
      <feComposite in="ls" in2="c2" operator="arithmetic" k2="1" k3="0.55" result="all"/>
      <feComposite in="all" in2="SourceAlpha" operator="in"/>
    </filter>
    <filter id="${id}n" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.003 0.7" numOctaves="2" seed="${3 + metalId}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>
    </filter>
    <filter id="${id}s" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="${depth * 1.6}"/>
    </filter>
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      ${t(0, 0, '#fff')}
    </mask>
  </defs>
  <g filter="url(#${id}s)">${t(sdx * sOff, sdy * sOff, m.shadow)}</g>
  ${extrusion}
  <g filter="url(#${id}b)">
    <g mask="url(#${id}m)">
      <rect width="${W}" height="${H}" fill="url(#${id}g)"/>
      <rect width="${W}" height="${H}" filter="url(#${id}n)" style="mix-blend-mode:overlay" opacity="0.55"/>
    </g>
  </g>
</svg>`;
  const span = document.createElement('span');
  span.className = 'metal';
  span.innerHTML = svg;
  // La ligne de base du texte tombe sur le bas de la boîte : on retire les marges de dessin.
  span.style.margin = `${-P}px ${-P}px ${-(H - by)}px ${-P}px`;
  span.style.width = `${W}px`;
  span.style.height = `${H}px`;
  span.querySelector('svg').style.marginBottom = '0';
  return span;
}

async function ready(build) {
  await document.fonts.load('800 100px Inter');
  await document.fonts.load('500 100px Inter');
  build();
  await document.fonts.ready;
  window.__ready = true;
}
