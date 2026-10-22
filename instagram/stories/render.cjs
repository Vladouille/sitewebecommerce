// Rend les stories en PNG 1080 x 1920 : node render.cjs [1 2 3 4]
// (Playwright installé globalement : NODE_PATH="$(npm root -g)" node render.cjs)
const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const which = process.argv.slice(2).length ? process.argv.slice(2) : ['1', '2', '3', '4'];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const n of which) {
    await page.goto(pathToFileURL(path.join(__dirname, 'src', `story-${n}.html`)).href);
    await page.waitForFunction(() => window.__ready === true);
    await page.waitForTimeout(150);
    const out = path.join(__dirname, `story-${n}.png`);
    await page.screenshot({ path: out });
    console.log(out);
  }
  await browser.close();
})();
