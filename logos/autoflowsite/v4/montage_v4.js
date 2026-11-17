const { chromium } = require('playwright');
const fs = require('fs');
const dir = process.env.OUT || '/home/user/sitewebecommerce/logos/autoflowsite/v4';
const read = f => fs.readFileSync(`${dir}/${f}`, 'utf8');
const C = [
 ['1-marine', '1. Marine', 'Bleu marine #0B1F3A · blanc · gris-bleu #8FA6C6 · Plus Jakarta Sans'],
 ['2-blanc', '2. Blanc', 'Blanc · noir encre #111827 · bleu #1D4ED8 · Manrope'],
 ['3-anthracite', '3. Anthracite', 'Anthracite #1F2937 · blanc · gras + fin · Outfit'],
];
const col = ([k, t, p]) => `<section>
 <h2>${t}</h2><p>${p}</p>
 <div class="big">${read(k+'-carre.svg')}</div>
 <div class="row"><div class="circle">${read(k+'-carre.svg')}</div><small>Photo de profil (rond)</small></div>
 <div class="hdr"><b>${read(k+'-horizontal.svg')}</b><span>Offres</span><span>Contact</span></div>
 <div class="hdr dk"><b>${read(k+'-horizontal-blanc.svg')}</b><span>Offres</span><span>Contact</span></div>
 <div class="favs"><div class="tab"><i>${read(k+'-favicon.svg')}</i>autoflowsite.com</div>
   <b style="width:48px">${read(k+'-favicon.svg')}</b><b style="width:32px">${read(k+'-favicon.svg')}</b><b style="width:16px">${read(k+'-favicon.svg')}</b></div>
</section>`;
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:28px;background:#e9e9e9;font:15px Inter,sans-serif;color:#111;width:1500px}
h1{font-size:22px;margin:0 0 4px}p.s{margin:0 0 20px;color:#555}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
section{background:#fff;border-radius:8px;padding:20px;display:flex;flex-direction:column;gap:16px}
h2{font-size:17px;margin:0}section>p{margin:-10px 0 0;color:#555;font-size:13px}
svg{display:block;width:100%;height:auto}.big{outline:1px solid #ddd}
.row{display:flex;gap:16px;align-items:center}.row small{font-size:12px;color:#666}
.circle{width:110px;height:110px;border-radius:50%;overflow:hidden;outline:1px solid #ddd}
.hdr{display:flex;align-items:center;gap:18px;border:1px solid #e5e5e5;border-radius:6px;padding:14px 16px;font-size:13px}
.hdr b{margin-right:auto}.hdr b svg{height:26px;width:auto}.dk{background:#111;color:#eee;border-color:#111}
.favs{display:flex;align-items:center;gap:14px}.favs b svg{outline:1px solid #ddd}
.tab{display:flex;align-items:center;gap:6px;background:#f1f1f1;border-radius:6px 6px 0 0;padding:6px 10px;font-size:12px}.tab i svg{width:16px;height:16px}
</style><h1>AutoflowSite — logos typographiques (v4)</h1>
<p class=s>Le nom seul, sans dessin, 3 couleurs sobres. Carré (profil, réseaux), version horizontale (en-tête de site, devis, email) sur fond clair et sombre, favicon en initiales.</p>
<div class=g>${C.map(col).join('')}</div>`;
fs.writeFileSync(`${dir}/planche-v4.html`, html);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1556, height: 900 } });
  await p.goto('file://' + dir + '/planche-v4.html'); await p.screenshot({ path: dir + '/planche-v4.png', fullPage: true }); await b.close(); })();
