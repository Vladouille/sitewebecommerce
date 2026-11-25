// Construit prinvla/prinvla-site.html : le site complet en UN SEUL fichier HTML autonome
// (CSS, polices, images, modèle 3D, Three.js, GSAP, Lenis, pages légales en fenêtres).
// Il s'ouvre par double-clic, sans serveur. Usage : npm run single
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '../site');
const OUT = join(HERE, '../prinvla-site.html');
const read = (p, enc) => readFileSync(join(SITE, p), enc);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2' };
const dataUri = (p) => `data:${MIME[p.split('.').pop()]};base64,${read(p).toString('base64')}`;
const safe = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\u0021--');

// 1. JS : main.js + config + scene3d + three + lenis en un seul module
const threePath = join(SITE, 'assets/vendor/three/three.module.min.js');
// La 3D n'est embarquée que si le bloc [data-stage] est présent dans index.html
const HAS_3D = read('index.html', 'utf8').includes('data-stage');
const bundle = await esbuild.build({
  entryPoints: [join(SITE, 'js/main.js')],
  bundle: true, format: 'esm', platform: 'browser', target: 'es2020', write: false,
  minify: false, legalComments: 'none', charset: 'utf8',
  plugins: [{ name: 'three', setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: threePath }));
    if (!HAS_3D) {
      b.onResolve({ filter: /scene3d\.js$/ }, () => ({ path: 'scene3d-off', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export async function createScene() { throw new Error("3D désactivée"); }', loader: 'js' }));
    }
  } }],
});
const appJs = bundle.outputFiles[0].text;

// 2. CSS avec polices embarquées
const css = read('css/style.css', 'utf8').replace(/url\("\.\.\/(assets\/fonts\/[^"]+)"\)/g, (_, p) => `url("${dataUri(p)}")`);

// 3. Pages légales → <dialog>
const legal = [['mentions-legales', 'Mentions légales'], ['cgv', 'Conditions générales de vente'], ['confidentialite', 'Politique de confidentialité']]
  .map(([id, title]) => {
    const html = read(`${id}.html`, 'utf8');
    const inner = html.split('<main id="main" class="legal">')[1].split('  </main>')[0];
    return `<dialog class="legal-dialog" id="${id}" aria-label="${title}" data-lenis-prevent>
  <form method="dialog" class="legal-dialog__bar"><button class="legal-dialog__close" aria-label="Fermer">Fermer ✕</button></form>
  <div class="legal">${inner.replace(/href="(mentions-legales|cgv|confidentialite)\.html"/g, 'href="#$1" data-dialog')}</div>
</dialog>`;
  }).join('\n');
const dialogCss = `
.legal-dialog{width:min(780px,calc(100% - 20px));max-height:calc(100dvh - 40px);padding:0;border:1px solid var(--line);border-radius:20px;background:var(--bg-2);color:var(--text);overscroll-behavior:contain}
.legal-dialog::backdrop{background:rgba(5,7,11,.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.legal-dialog .legal{padding:8px clamp(18px,5vw,40px) 40px}
.legal-dialog__bar{position:sticky;top:0;display:flex;justify-content:flex-end;padding:12px;background:linear-gradient(var(--bg-2) 70%,transparent);z-index:2}
.legal-dialog__close{font:600 .95rem/1 var(--font-title);color:var(--text);background:var(--bg-3);border:1px solid var(--line);border-radius:999px;padding:12px 16px;cursor:pointer}
.legal-dialog__close:hover{border-color:var(--ice);color:var(--ice)}`;
const dialogJs = `
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-dialog]');
  if (!a) return;
  const d = document.getElementById(a.getAttribute('href').slice(1));
  if (!d) return;
  e.preventDefault();
  document.querySelectorAll('dialog[open]').forEach((o) => o !== d && o.close());
  if (!d.open) d.showModal();
  d.scrollTop = 0;
});
const h = location.hash.slice(1);
if (h && document.getElementById(h)?.tagName === 'DIALOG') document.getElementById(h).showModal();`;

// 4. Données embarquées pour la 3D
const embed = !HAS_3D ? null : {
  glb: read('assets/model/neve.glb').toString('base64'),
  dracoWasm: read('assets/vendor/draco/draco_decoder.wasm').toString('base64'),
  dracoWrapper: read('assets/vendor/draco/draco_wasm_wrapper.js', 'utf8'),
};

// 5. Assemblage du HTML
let html = read('index.html', 'utf8');
const swap = (from, to) => { if (!html.includes(from)) throw new Error(`Introuvable dans index.html : ${from.slice(0, 80)}`); html = html.replace(from, () => to); };

html = html.replace(/\s*<link rel="preload"[^>]*>/g, '');
html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
swap('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n${dialogCss}\n</style>`);
html = html.replace(/(src|href)="(assets\/img\/[^"]+)"/g, (_, attr, p) => `${attr}="${dataUri(p)}"`);
html = html.replace(/srcset="([^"]+)"/g, (_, set) => `srcset="${set.split(',').map((s) => { const [u, w] = s.trim().split(/\s+/); return `${dataUri(u)} ${w}`; }).join(', ')}"`);
for (const id of ['mentions-legales', 'cgv', 'confidentialite']) swap(`<a href="${id}.html">`, `<a href="#${id}" data-dialog>`);
swap('<script defer src="assets/vendor/gsap.min.js"></script>', `<script>\n${safe(read('assets/vendor/gsap.min.js', 'utf8'))}\n</script>`);
swap('<script defer src="assets/vendor/ScrollTrigger.min.js"></script>', `<script>\n${safe(read('assets/vendor/ScrollTrigger.min.js', 'utf8'))}\n</script>`);
swap('<script type="module" src="js/main.js"></script>', `${legal}
${embed ? `<script>window.__NEVE_EMBED__ = ${safe(JSON.stringify(embed))};</script>` : ''}
<script>${dialogJs}</script>
<script type="module">
/* ═══════════ RÉGLAGES PRINVLA ═══════════
   Cherche (Ctrl+F) les lignes ci-dessous dans ce fichier pour les modifier :
   var STOCK = …            → pinces restantes (0 = boutons « Drop #2 »)
   var STRIPE_LINKS = …     → liens de paiement solo / duo / clan
   var DROP2_FORM_URL = …   → formulaire du Drop #2
   var DUO_BADGE = …        → badge de la carte Duo
   var CONTACT_EMAIL = …    → email de contact
   ═════════════════════════════════════ */
${safe(appJs)}
</script>`);

writeFileSync(OUT, html);
console.log(`✓ ${OUT} : ${(statSync(OUT).size / 1024 / 1024).toFixed(2)} Mo`);
