const { chromium } = require('playwright'); const fs = require('fs');
const dir = process.env.OUT || '/home/user/sitewebecommerce/logos/autoflowsite/v5';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const f of files) { const svg = fs.readFileSync(`${dir}/${f}`, 'utf8').replace('<svg ', '<svg width="1080" height="1080" ');
    await p.setContent(`<style>html,body{margin:0}</style>${svg}`); await p.screenshot({ path: `${dir}/${f.replace('.svg', '-1080.png')}`, clip: { x: 0, y: 0, width: 1080, height: 1080 } }); }
  // planche de choix : les 3 côte à côte + aperçu rond
  const tiles = files.map(f => `<figure><div>${fs.readFileSync(`${dir}/${f}`, 'utf8')}</div><div class=c>${fs.readFileSync(`${dir}/${f}`, 'utf8')}</div><figcaption>${f.replace('autoflowsite-','').replace('.svg','')}</figcaption></figure>`).join('');
  await p.setViewportSize({ width: 1500, height: 700 });
  await p.setContent(`<style>body{margin:0;padding:24px;background:#e9e9e9;font:15px Inter,sans-serif;display:flex;gap:24px}figure{margin:0;flex:1;display:flex;flex-direction:column;gap:12px;align-items:flex-start}svg{display:block;width:100%;height:auto}figure>div:first-child{width:100%}.c{width:110px;height:110px;border-radius:50%;overflow:hidden}</style>${tiles}`);
  await p.screenshot({ path: `${dir}/planche-v5.png`, fullPage: true }); await b.close(); })();
