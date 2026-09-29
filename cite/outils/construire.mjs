// =====================================================================
// Aurore : construit cite/index.html, un seul fichier autonome
// (JavaScript, styles et three.js intégrés, sans modules ni importmap).
// Il s'ouvre dans n'importe quel navigateur récent, même en double-cliquant
// dessus depuis l'ordinateur, sans serveur.
//
// Utilisation (depuis la racine du dépôt) :
//   npm i --no-save esbuild && node cite/outils/construire.mjs
// Les sources à modifier sont dans cite/js/ ; cite/dev.html les charge directement.
// =====================================================================
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'vendor/three');

// « three » et « three/addons/… » pointent vers les copies de cite/vendor
const threeAlias = {
  name: 'three-local',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: join(vendor, 'three.module.min.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: join(vendor, 'addons', a.path.slice('three/addons/'.length)) }));
  },
};

const out = await build({
  entryPoints: [join(root, 'js/main.js')],
  bundle: true, format: 'iife', minify: true, write: false, legalComments: 'inline',
  target: ['es2017', 'chrome64', 'firefox67', 'safari12', 'edge79'],
  plugins: [threeAlias],
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(root, 'cite.css'), 'utf8');
let html = readFileSync(join(root, 'dev.html'), 'utf8');
html = html
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace('<link rel="stylesheet" href="cite.css">', () => `<style>\n${css}</style>`)
  .replace('<script type="module" src="js/main.js"></script>', () => `<script>\n${js}</script>`)
  .replace('<!doctype html>', '<!doctype html>\n<!-- Fichier construit par cite/outils/construire.mjs : ne pas modifier à la main, modifier cite/js/ puis reconstruire. -->');
writeFileSync(join(root, 'index.html'), html);
console.log(`cite/index.html : ${(html.length / 1024).toFixed(0)} Ko`);
