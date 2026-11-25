// Construit prinvla/shopify/sections/prinvla-landing.liquid : la page de vente en UNE section
// de thème Shopify, autonome (modèle 3D et images intégrés). Usage : npm run shopify
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const P = (...p) => join(HERE, '..', ...p);
const txt = (p) => readFileSync(P(p), 'utf8');
const b64 = (p) => readFileSync(P(p)).toString('base64');
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';

// Module 3D du site, imports réécrits vers le CDN (versions épinglées)
let scene = txt('site/js/scene3d.js');
const rewrites = [
  ["from 'three'", `from '${CDN}/+esm'`],
  ["'../assets/vendor/three/addons/loaders/GLTFLoader.js'", `'${CDN}/examples/jsm/loaders/GLTFLoader.js/+esm'`],
  ["'../assets/vendor/three/addons/loaders/DRACOLoader.js'", `'${CDN}/examples/jsm/loaders/DRACOLoader.js/+esm'`],
  ["'../assets/vendor/three/addons/environments/RoomEnvironment.js'", `'${CDN}/examples/jsm/environments/RoomEnvironment.js/+esm'`],
  ["const BASE = new URL('../', import.meta.url);", "const BASE = new URL('/', location.href);"],
];
for (const [a, b] of rewrites) { if (!scene.includes(a)) throw new Error(`scene3d.js : introuvable ${a}`); scene = scene.replace(a, b); }

// Police des titres (Space Grotesk) intégrée : identité visuelle conservée, sans Google Fonts (RGPD)
const fontFace = `@font-face { font-family: "PV Space Grotesk"; src: url(data:font/woff2;base64,${b64('site/assets/fonts/space-grotesk-latin-wght.woff2')}) format("woff2"); font-weight: 300 700; font-display: swap; }`;
const css = fontFace + '\n' + txt('shopify/src/prinvla.css');
const js = txt('shopify/src/prinvla.js');
for (const [name, code] of [['CSS', css], ['JS', js], ['scene', scene]]) {
  // Le CSS est interprété par Liquid ; le JS et la scène sont dans un bloc {% raw %}
  if (name === 'CSS' && /\{\{|\{%/.test(code)) throw new Error('CSS contient {{ ou {% : incompatible Liquid');
  if (/endraw/.test(code)) throw new Error(`${name} contient « endraw »`);
  if (/<\/script/i.test(code)) throw new Error(`${name} contient </script`);
}

let out = txt('shopify/src/prinvla-landing.liquid');
const fill = (key, val) => { if (!out.includes(key)) throw new Error(`Gabarit : ${key} manquant`); out = out.split(key).join(val); };
fill('__CSS__', css.trim());
fill('__MAIN_JS__', js.trim());
fill('__SCENE_JS__', scene.trim());
fill('__GLB_B64__', b64('site/assets/model/neve.glb'));
fill('__POSTER_B64__', b64('site/assets/img/pince-hero.webp'));
fill('__KAKI_B64__', b64('site/assets/img/camp-kaki.webp'));
fill('__BORDEAUX_B64__', b64('site/assets/img/camp-bordeaux.webp'));

const OUT = P('shopify/sections/prinvla-landing.liquid');
writeFileSync(OUT, out);
const kb = statSync(OUT).size / 1024;
console.log(`✓ ${OUT} : ${kb.toFixed(0)} Ko${kb > 250 ? '  ⚠ proche de la limite de taille des fichiers de thème' : ''}`);
