#!/usr/bin/env node
/*
 * Vérification automatique de la landing Autoflow avant livraison.
 * Usage : node .claude/skills/autoflow-brand/scripts/verifier-site.mjs [dossier-du-site]
 * Par défaut, le dossier du site est la racine du dépôt (là où se trouve index.html).
 * Nécessite Playwright (préinstallé dans les sessions Claude Code cloud).
 * Code de sortie : 1 s'il y a au moins un ÉCHEC, 0 sinon.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright introuvable : installe-le (npm i -D playwright) ou lance ce script dans une session Claude Code cloud.');
  process.exit(2);
}

const root = resolve(process.argv[2] || process.cwd());
const results = [];
const ok = (msg) => results.push(['OK', msg]);
const fail = (msg) => results.push(['ÉCHEC', msg]);
const warn = (msg) => results.push(['ALERTE', msg]);
const check = (cond, okMsg, koMsg, level = fail) => (cond ? ok(okMsg) : level(koMsg));

const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
const indexHtml = read('index.html');
if (!indexHtml) {
  console.error(`index.html introuvable dans ${root}`);
  process.exit(2);
}

/* ---------- Contrôles statiques ---------- */
const css = read('styles.css') || '';
const config = read('config.js') || '';
const formUrl = (config.match(/AUDIT_FORM_URL\s*=\s*['"]([^'"]+)['"]/) || [])[1];
check(!!formUrl, `AUDIT_FORM_URL défini : ${formUrl}`, 'AUDIT_FORM_URL introuvable dans config.js');

check(existsSync(join(root, 'assets/AUTOFLOW.png')),
  'Logo officiel assets/AUTOFLOW.png présent',
  'Logo officiel assets/AUTOFLOW.png absent : le site affiche le repli texte, pas le logo validé', warn);

check(/prefers-reduced-motion/.test(css), 'prefers-reduced-motion géré', 'Aucune règle prefers-reduced-motion dans styles.css');
check(/:focus-visible/.test(css), 'Focus clavier visible (:focus-visible)', 'Aucun style :focus-visible dans styles.css');
check(!/fonts\.googleapis|fonts\.gstatic/.test(indexHtml + css),
  'Aucune police chargée depuis Google Fonts', 'Polices Google Fonts détectées : dépôt de données tiers, à retirer ou à déclarer');

const forbiddenColors = ['#d97757', '#f4f1ea'];
const foundColors = forbiddenColors.filter((c) => css.toLowerCase().includes(c));
check(foundColors.length === 0, 'Aucune couleur interdite dans styles.css',
  `Couleurs interdites dans styles.css : ${foundColors.join(', ')}`);

for (const [label, re] of [['meta description', /<meta\s+name="description"/], ['Open Graph', /property="og:image"/], ['favicon', /rel="icon"/]]) {
  check(re.test(indexHtml), `SEO : ${label} présent`, `SEO : ${label} manquant`, warn);
}

for (const page of ['mentions-legales.html', 'confidentialite.html', 'cookies.html', 'cgv.html']) {
  const html = read(page);
  if (!html) { fail(`Page légale manquante : ${page}`); continue; }
  check(/Modèle à faire valider/.test(html), `${page} : commentaire de validation juridique présent`, `${page} : commentaire « Modèle à faire valider » manquant`, warn);
  const todo = (html.match(/\[À COMPLÉTER[^\]]*\]/g) || []).length;
  if (todo) warn(`${page} : ${todo} champ(s) [À COMPLÉTER] encore visible(s)`);
  check(new RegExp(`href="${page}"`).test(indexHtml), `Lien vers ${page} dans le pied de page`, `Lien vers ${page} absent de index.html`);
}

/* ---------- Contrôles dans le navigateur ---------- */
const browser = await chromium.launch();
const url = pathToFileURL(join(root, 'index.html')).href;

for (const width of [375, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const missing = new Set();
  page.on('requestfailed', (r) => {
    if (r.url().startsWith('file:')) missing.add(decodeURIComponent(r.url()).replace(pathToFileURL(root).href + '/', ''));
  });
  // Le site est hors ligne en local : on bloque les requêtes externes pour ne mesurer que le site.
  await page.route(/^https?:\/\//, (r) => r.abort());
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const data = await page.evaluate(() => {
    const vis = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const ctas = [...document.querySelectorAll('a')]
      .filter((a) => /R[ée]server mon audit gratuit|^\s*Choisir /i.test(a.textContent))
      .map((a) => ({ text: a.textContent.trim().replace(/\s+/g, ' '), href: a.href, target: a.target, rel: a.rel, visible: vis(a) }));
    const packs = [...document.querySelectorAll('#packs .pack')].map((p) => ({
      name: p.querySelector('.pack__name')?.textContent.trim(),
      price: p.querySelector('.pack__price')?.textContent.replace(/\s+/g, ' ').trim(),
      recommended: p.classList.contains('pack--recommended'),
      top: Math.round(p.getBoundingClientRect().top),
      left: Math.round(p.getBoundingClientRect().left),
    }));
    const text = document.body.innerText;
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctas,
      packs,
      imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src),
      h1: document.querySelectorAll('h1').length,
      struck: document.querySelectorAll('s, del, strike').length,
      arrows: [...document.querySelectorAll('a.btn, button')].filter((b) => /→/.test(b.textContent)).length,
      bannedWords: ['le plus populaire', 'le plus choisi', 'mois offert', 'frais offerts', 'offre limitée', 'places limitées']
        .filter((w) => text.toLowerCase().includes(w)),
    };
  });

  const tag = `[${width}px]`;
  check(data.overflow <= 0, `${tag} Pas de défilement horizontal`, `${tag} Défilement horizontal de ${data.overflow}px`);
  check(errors.length === 0, `${tag} Aucune erreur JavaScript`, `${tag} Erreurs JavaScript : ${errors.join(' | ')}`);
  if (width === 375) {
    // Le logo absent est déjà signalé plus haut (repli texte prévu) ; tout autre fichier manquant casse le site.
    const others = [...missing].filter((f) => f !== 'assets/AUTOFLOW.png');
    check(others.length === 0, 'Tous les fichiers locaux appelés par la page existent', `Fichiers locaux introuvables : ${others.join(', ')}`);
  }

  if (width === 375) {
    check(data.h1 === 1, 'Un seul h1', `${data.h1} balise(s) h1 au lieu d'une`);
    check(data.imgsNoAlt.length === 0, 'Toutes les images ont un attribut alt', `Images sans alt : ${data.imgsNoAlt.join(', ')}`);
    check(data.struck === 0, 'Aucun prix barré', `${data.struck} élément(s) barré(s) (s/del)`);
    check(data.arrows === 0, 'Aucune flèche « → » dans les boutons', `${data.arrows} bouton(s) avec « → »`);
    check(data.bannedWords.length === 0, 'Aucune formule de fausse promo ou fausse preuve sociale',
      `Formules interdites trouvées : ${data.bannedWords.join(', ')}`);

    const bad = data.ctas.filter((c) => c.href !== formUrl || c.target !== '_blank' || !/noopener/.test(c.rel));
    check(data.ctas.length > 0 && bad.length === 0,
      `${data.ctas.length} boutons d'audit/packs ouvrent le formulaire dans un nouvel onglet`,
      bad.length ? `Boutons mal reliés : ${bad.map((c) => `« ${c.text} » → ${c.href} (target=${c.target || '∅'}, rel=${c.rel || '∅'})`).join(' ; ')}` : 'Aucun bouton d\'audit trouvé');
    const choisir = data.ctas.filter((c) => /^Choisir /.test(c.text)).length;
    check(choisir === 3, '3 boutons « Choisir … » présents', `${choisir} bouton(s) « Choisir … » au lieu de 3`);
  }

  // Ordre des packs : Scale, Croissance, Essentiel (gauche → droite en desktop, haut → bas en mobile)
  const order = [...data.packs].sort((a, b) => (width === 375 ? a.top - b.top : a.left - b.left)).map((p) => p.name);
  check(order.join(',') === 'Scale,Croissance,Essentiel', `${tag} Ordre des packs : ${order.join(', ')}`,
    `${tag} Ordre des packs incorrect : ${order.join(', ') || 'aucun pack rendu'} (attendu : Scale, Croissance, Essentiel)`);
  if (width === 1280) {
    const expected = { Scale: '1780', Croissance: '480', Essentiel: '280' };
    for (const p of data.packs) {
      const digits = (p.price || '').replace(/\D/g, '');
      check(digits === expected[p.name], `Prix ${p.name} : ${p.price}`, `Prix ${p.name} inattendu : « ${p.price} » (attendu ${expected[p.name]} €/mois)`);
    }
    const rec = data.packs.filter((p) => p.recommended).map((p) => p.name);
    check(rec.join() === 'Croissance', 'Seul Croissance est mis en avant', `Pack(s) mis en avant : ${rec.join(', ') || 'aucun'}`);
  }
  await page.close();
}
await browser.close();

/* ---------- Rapport ---------- */
const order = { 'ÉCHEC': 0, 'ALERTE': 1, OK: 2 };
results.sort((a, b) => order[a[0]] - order[b[0]]);
for (const [level, msg] of results) console.log(`${level.padEnd(6)} ${msg}`);
const n = (l) => results.filter((r) => r[0] === l).length;
console.log(`\n${n('OK')} OK, ${n('ALERTE')} alerte(s), ${n('ÉCHEC')} échec(s).`);
console.log('Non couvert par ce script : rendu sur un vrai téléphone, clic réel sur le formulaire en ligne, contraste des maquettes, relecture des textes.');
process.exit(n('ÉCHEC') ? 1 : 0);
