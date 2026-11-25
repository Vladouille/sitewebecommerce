// Serveur statique local (gzip activé, comme Netlify/Hostinger). Usage : node serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
const SITE = new URL('../site/', import.meta.url).pathname;
const TOOLS = new URL('./', import.meta.url).pathname;
const PORT = Number(process.argv[2]) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.stl': 'model/stl', '.txt': 'text/plain' };
const GZ = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.wasm', '.txt']);
createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const ROOT = p.startsWith('/tools/') ? TOOLS : SITE;
    if (p.startsWith('/tools/')) p = p.slice(6);
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) throw new Error('forbidden');
    const st = await stat(file);
    if (st.isDirectory()) { res.writeHead(301, { location: p + '/' }); return res.end(); }
    let body = await readFile(file);
    const ext = extname(file);
    const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000' };
    if (GZ.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body); headers['content-encoding'] = 'gzip'; }
    res.writeHead(200, headers); res.end(body);
  } catch { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404'); }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/`));
