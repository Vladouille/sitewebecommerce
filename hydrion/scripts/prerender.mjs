// Injecte le HTML pré-rendu dans dist/*.html puis supprime le build serveur temporaire.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ssrDir = resolve(root, '.ssr');
const { render } = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href);

const pages = [
  { file: 'dist/index.html', page: 'home' },
  { file: 'dist/mentions-legales.html', page: 'legal' },
];

for (const { file, page } of pages) {
  const path = resolve(root, file);
  const html = await readFile(path, 'utf8');
  if (!html.includes('<!--ssr-outlet-->')) throw new Error(`Marqueur <!--ssr-outlet--> absent de ${file}`);
  await writeFile(path, html.replace('<!--ssr-outlet-->', render(page)));
  console.log(`✓ pré-rendu ${file}`);
}

await rm(ssrDir, { recursive: true, force: true });
