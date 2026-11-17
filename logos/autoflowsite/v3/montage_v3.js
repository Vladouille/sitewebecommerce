const { chromium } = require('playwright');
const fs = require('fs');
const dir = process.env.OUT || '/home/user/sitewebecommerce/logos/autoflowsite/v3';
const read = f => fs.readFileSync(`${dir}/${f}`, 'utf8');
const C = [
 ['1-ecran', '1. Écran + mini-site', 'Bleu nuit #14213D · blanc · ambre #FCA311 · Plus Jakarta Sans'],
 ['2-ecran-mobile', '2. Écran + mobile (site responsive)', 'Vert sapin #0D4D40 · blanc · menthe #6EE7B7 · Manrope'],
 ['3-portable-clic', '3. Ordinateur portable + clic', 'Blanc · indigo #1E1B4B · corail #FF5A4E · Sora'],
];
const col = ([k, t, p]) => `<section>
 <h2>${t}</h2><p>${p}</p>
 <div class="big">${read(k+'.svg')}</div>
 <div class="row">
   <div><div class="circle">${read(k+'.svg')}</div><small>Photo de profil (rond)</small></div>
   <div><div class="dark"><b style="width:72px">${read(k+'.svg')}</b></div><small>Sur fond sombre</small></div>
 </div>
 <div class="hdr"><b style="width:44px">${read(k+'.svg')}</b><span>Offres</span><span>Réalisations</span><span>Contact</span></div>
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
.row{display:flex;gap:16px;align-items:flex-end}.row small{display:block;font-size:12px;color:#666;margin-top:6px}
.circle{width:110px;height:110px;border-radius:50%;overflow:hidden;outline:1px solid #ddd}
.dark{background:#111;padding:19px;border-radius:6px}
.hdr{display:flex;align-items:center;gap:18px;border:1px solid #e5e5e5;border-radius:6px;padding:10px 14px;font-size:13px}.hdr b{margin-right:auto}
.favs{display:flex;align-items:center;gap:14px}.favs b svg{outline:1px solid #ddd}
.tab{display:flex;align-items:center;gap:6px;background:#f1f1f1;border-radius:6px 6px 0 0;padding:6px 10px;font-size:12px}.tab i svg{width:16px;height:16px}
</style><h1>AutoflowSite — logos carrés (v3)</h1>
<p class=s>Objet concret, 3 couleurs, sans slogan. Vu en grand, en photo de profil ronde, sur fond sombre, dans un en-tête de site et en favicon 48/32/16 px.</p>
<div class=g>${C.map(col).join('')}</div>`;
fs.writeFileSync(`${dir}/planche-v3.html`, html);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1556, height: 900 } });
  await p.goto('file://' + dir + '/planche-v3.html'); await p.screenshot({ path: dir + '/planche-v3.png', fullPage: true }); await b.close(); })();
