// Génère les visuels statiques depuis la scène 3D (à relancer après avoir remplacé le STL).
// Prérequis : serveur local lancé (npm run serve) et Playwright installé.
const { chromium } = require('playwright');
const { writeFileSync, statSync } = require('node:fs');
const path = require('node:path');
const BASE = process.env.BASE || 'http://localhost:8080';
const IMG = path.join(__dirname, '../site/assets/img');
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function grab(page, query, type, quality) {
  await page.goto(`${BASE}/tools/render.html?${query}`);
  await page.waitForFunction(() => window.ready || window.err, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.err);
  if (err) throw new Error(err);
  return page.evaluate(([t, q]) => window.shot(t, q), [type, quality]);
}
const save = (name, dataUrl) => {
  const f = path.join(IMG, name);
  writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`✓ ${name} ${(statSync(f).size / 1024).toFixed(0)} Ko`);
};

(async () => {
  const browser = await chromium.launch({ args: ARGS });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // Image du hero : même état que la 3D au chargement (θ = 16°), fond transparent
  save('pince-hero.webp', await grab(page, 'w=800&h=800&theta=16', 'image/webp', 0.8));
  save('pince-hero-480.webp', await grab(page, 'w=480&h=480&theta=16', 'image/webp', 0.8));
  save('camp-kaki.webp', await grab(page, 'w=600&h=600&halves=A&theta=0&yaw=-0.45&zoom=1.1&oy=-14', 'image/webp', 0.8));
  save('camp-bordeaux.webp', await grab(page, 'w=600&h=600&halves=B&theta=0&yaw=-0.45&zoom=1.1&oy=14', 'image/webp', 0.8));
  // Image Open Graph 1200×630 : pince entrouverte sur la boule
  const og = await grab(page, 'w=900&h=900&theta=6&ball=1&yaw=-0.55', 'image/png');
  const p2 = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await p2.goto(`${BASE}/tools/og.html`);
  await p2.evaluate((src) => new Promise((ok) => { const i = document.getElementById('r'); i.onload = ok; i.src = src; }), og);
  await p2.evaluate(() => document.fonts.ready);
  await p2.screenshot({ path: path.join(IMG, 'og.jpg'), type: 'jpeg', quality: 86 });
  console.log(`✓ og.jpg ${(statSync(path.join(IMG, 'og.jpg')).size / 1024).toFixed(0)} Ko`);
  // Icône Apple 180×180 depuis le favicon
  const p3 = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await p3.goto(`${BASE}/tools/render.html`); await p3.setContent(`<body style="margin:0"><img src="${BASE}/assets/img/favicon.svg" width="180" height="180"></body>`);
  await p3.waitForTimeout(200);
  await p3.screenshot({ path: path.join(IMG, 'apple-touch-icon.png') });
  console.log('✓ apple-touch-icon.png');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
