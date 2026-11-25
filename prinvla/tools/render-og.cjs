// Génère l'image de partage 1200×630 (sans visuel produit). Prérequis : npm run serve.
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(`${process.env.BASE || 'http://localhost:8080'}/tools/og.html`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(__dirname, '../site/assets/img/og.jpg'), type: 'jpeg', quality: 86 });
  console.log('✓ og.jpg');
  await b.close();
})();
