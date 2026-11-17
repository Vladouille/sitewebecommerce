const { chromium } = require('playwright');
const fs = require('fs');
const dir = '/home/user/sitewebecommerce/logos/autoflowsite';
const read = f => fs.readFileSync(`${dir}/${f}`, 'utf8');
const C = [
 ['D','D-fenetre-A','D-symbole','Fenêtre-A : navigateur + monogramme + curseur', 'D-favicon'],
 ['E','E-balise','E-symbole','Balise </A> : le code du site, en signature', 'E-symbole'],
 ['F','F-bouton-A','F-symbole','Bouton-A : la barre du A est un bouton cliqué', 'F-favicon'],
];const _OLD = [
 ['A', 'A-famille-autoflow', 'A-symbole', 'Famille Autoflow — même typo serif et même triangle que ta marque coachs'],
 ['B', 'B-fenetre-croissance', 'B-symbole', 'Fenêtre + croissance — moderne, lisible « tech »'],
 ['C', 'C-monogramme', 'C-symbole', 'Monogramme A — premium, éditorial'],
];
const row = ([k, full, sym, label, fav]) => `
<section><h2>${k}. ${label}</h2>
<div class="g">
 <div class="card l"><div class="logo">${read(full+'-clair.svg')}</div></div>
 <div class="card d"><div class="logo">${read(full+'-sombre.svg')}</div></div>
 <div class="card l small">
   <div class="hdr"><div class="hl">${read(full+'-compact-clair.svg')}</div><span>Offres</span><span>Contact</span></div>
   <div class="favs"><div class="tab"><i>${read(fav+'-clair.svg')}</i>autoflowsite.com</div>
     <b style="width:64px">${read(sym+'-clair.svg')}</b><b style="width:32px">${read(sym+'-clair.svg')}</b><b style="width:16px">${read(fav+'-clair.svg')}</b>
     <b style="width:32px">${read(sym+'-sombre.svg')}</b></div>
 </div>
</div></section>`;
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:28px;background:#ececec;font:15px Inter,sans-serif;color:#0a0a0a;width:1500px}
h1{font-size:22px;margin:0 0 4px}p.s{margin:0 0 18px;color:#555}
h2{font-size:16px;font-weight:600;margin:22px 0 10px}
.g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.card{border-radius:6px;padding:34px;display:flex;align-items:center;justify-content:center;min-height:150px}
.l{background:#fff;border:1px solid #d4d4d4}.d{background:#0a0a0a}
.logo svg{width:100%;max-width:400px;height:auto;display:block}
.small{flex-direction:column;align-items:stretch;gap:22px;padding:20px}
.hdr{display:flex;align-items:center;gap:18px;border-bottom:1px solid #e5e5e5;padding-bottom:14px;font-size:13px}
.hl svg{height:28px;width:auto;display:block}.hdr .hl{margin-right:auto}
.favs{display:flex;align-items:center;gap:14px}.favs b svg{width:100%;height:auto;display:block;outline:1px solid #e5e5e5}
.tab{display:flex;align-items:center;gap:6px;background:#f1f1f1;border-radius:6px 6px 0 0;padding:6px 10px;font-size:12px}
.tab i svg{width:16px;height:16px;display:block}
</style><h1>AutoflowSite — 3 pistes détaillées (noir, blanc, bleu)</h1><p class=s>Fond clair, fond sombre, puis en situation : en-tête de site (version compacte sans slogan), onglet navigateur (16 px), favicon 64/32/16 px.</p>
${C.map(row).join('')}`;
fs.writeFileSync(`${dir}/planche-v2.html`, html);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1556, height: 800 } });
  await p.goto('file://' + dir + '/planche-v2.html');
  await p.screenshot({ path: dir + '/planche-v2.png', fullPage: true }); await b.close();
})();
