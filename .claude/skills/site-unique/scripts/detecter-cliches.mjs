#!/usr/bin/env node
/*
 * Détecteur de clichés « site fait par l'IA » et de défauts de finition.
 * Fonctionne sur n'importe quel site : fichiers HTML locaux ou URL.
 *
 * Usage :
 *   node detecter-cliches.mjs                      -> analyse ./index.html
 *   node detecter-cliches.mjs page.html autre.html -> plusieurs pages
 *   node detecter-cliches.mjs https://exemple.fr   -> site en ligne
 *
 * Niveaux :
 *   ÉCHEC  : défaut objectif (accessibilité, typographie, lien mort, débordement). Bloque la livraison.
 *   CLICHÉ : marqueur typique des sites générés par IA. À remplacer, sauf choix délibéré et justifié.
 *   ALERTE : détail de finition à corriger ou à justifier.
 * Code de sortie : 1 s'il y a au moins un ÉCHEC.
 * Nécessite Playwright (préinstallé dans les sessions Claude Code cloud).
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('Playwright introuvable : npm i -D playwright, ou lance le script dans une session Claude Code cloud.');
  process.exit(2);
}

const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ['index.html']).map((t) => {
  if (/^https?:\/\//.test(t)) return t;
  const p = resolve(t);
  if (!existsSync(p)) { console.error(`Introuvable : ${t}`); process.exit(2); }
  return pathToFileURL(p).href;
});

/* ---------- Listes de clichés (à enrichir au fil des projets) ---------- */
const COPY_CLICHES = [
  // Français
  /r[ée]volutionn\w*/i, /\bboost\w*/i, /propuls\w*/i, /lib[ée]r(ez|er) (tout )?(le|votre) potentiel/i,
  /en quelques clics/i, /tout-en-un/i, /\bsans effort\b/i, /\bclé en main\b/i, /\bnouvelle ère\b/i,
  /passez au niveau sup[ée]rieur/i, /(transformez|transforme) votre (business|entreprise|activit[ée])/i,
  /\bpr[eê]ts? à (vous lancer|commencer|passer)/i, /pourquoi nous choisir/i, /\bnos services\b/i,
  /\bd[ée]couvrez (comment|nos|notre)/i, /\bdes solutions innovantes\b/i, /\bà la pointe\b/i,
  /\bl'avenir de\b/i, /\bsimple, rapide(,| et) efficace\b/i, /\bcon[çc]u pour vous\b/i, /\bpropuls[ée] par l'ia\b/i,
  /\bexp[ée]rience (utilisateur )?(unique|in[ée]gal[ée]e|fluide)\b/i, /\bsur-mesure pour vous\b/i,
  // Anglais
  /\bunlock (your|the)\b/i, /\bseamless(ly)?\b/i, /\bsupercharge\w*/i, /\belevate your\b/i, /\bgame[- ]changer\b/i,
  /\bnext[- ]level\b/i, /\bempower\w*/i, /\bcutting[- ]edge\b/i, /\bget started (today|now)\b/i,
  /\bwhy choose us\b/i, /\bin just a few clicks\b/i, /\ball[- ]in[- ]one\b/i,
];
const SOCIAL_PROOF = [
  /\b\d+\s?k\+/i, /\b\d[\d  ]*\+\s*(clients|utilisateurs|entreprises|users|customers)/i, /★★★★★/, /\b4[,.]\d\s?\/\s?5\b/,
  /ils nous font confiance/i, /trusted by/i, /rejoignez (plus de )?\d/i,
];
// Couleurs signatures des pages générées (indigo/violet SaaS, crème + terracotta, vert acide)
const TELL_COLORS = {
  '#6366f1': 'indigo SaaS', '#4f46e5': 'indigo SaaS', '#8b5cf6': 'violet SaaS', '#7c3aed': 'violet SaaS',
  '#a855f7': 'violet SaaS', '#3b82f6': 'bleu Tailwind', '#d97757': 'terracotta', '#f4f1ea': 'crème',
  '#faf9f5': 'crème', '#c6ff00': 'vert acide', '#bef264': 'vert acide', '#a3e635': 'vert acide', '#22d3ee': 'cyan néon',
};
const DEFAULT_DISPLAY_FONTS = ['inter', 'roboto', 'poppins', 'montserrat', 'open sans', 'lato', 'system-ui',
  '-apple-system', 'arial', 'helvetica', 'segoe ui', 'plus jakarta sans', 'dm sans', 'manrope', 'outfit', 'geist'];

/* ---------- Analyse dans la page ---------- */
function analyse({ COPY, PROOF, TELLS, FONTS }) {
  const toRe = (s) => { const m = s.match(/^\/(.*)\/(\w*)$/); return new RegExp(m[1], m[2]); };
  const copyRes = COPY.map(toRe); const proofRes = PROOF.map(toRe);
  const out = [];
  const add = (level, msg) => out.push([level, msg]);
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const label = (el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50);
  const all = [...document.body.querySelectorAll('*')].filter(vis);
  const lang = (document.documentElement.lang || '').toLowerCase();

  /* --- Texte visible --- */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !n.parentElement.closest('script,style,code,pre,noscript,svg,textarea')
      && vis(n.parentElement) && n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const texts = []; while (walker.nextNode()) texts.push(walker.currentNode.textContent);
  const fullText = texts.join('\n');

  for (const re of copyRes) { const m = fullText.match(re); if (m) add('CLICHÉ', `Formule toute faite : « ${m[0]} »`); }
  for (const re of proofRes) { const m = fullText.match(re); if (m) add('ALERTE', `Preuve sociale « ${m[0]} » : vérifie qu'elle est réelle et sourcée, sinon retire-la`); }

  if (lang.startsWith('fr')) {
    const sample = (re) => { const m = fullText.match(re); return m ? ` (ex. « ${fullText.slice(Math.max(0, m.index - 15), m.index + 5).replace(/\s+/g, ' ')} »)` : ''; };
    const count = (re) => (fullText.match(new RegExp(re.source, 'g')) || []).length;
    const noSpace = /[A-Za-zÀ-ÿ0-9)»][?!;]/; const noSpaceColon = /[A-Za-zÀ-ÿ)][:](?=\s)/;
    if (count(noSpace)) add('ÉCHEC', `Typo FR : ${count(noSpace)} « ? ! ; » sans espace avant${sample(noSpace)}`);
    if (count(noSpaceColon)) add('ÉCHEC', `Typo FR : ${count(noSpaceColon)} « : » sans espace avant${sample(noSpaceColon)}`);
    const breakable = / [?!:;»]|« /;
    if (count(breakable)) add('ALERTE', `Typo FR : ${count(breakable)} espace(s) sécable(s) avant « ? ! : ; » ou dans « » : la ponctuation peut passer seule à la ligne sur mobile (utiliser &nbsp; ou l'espace fine U+202F)${sample(breakable)}`);
    const straightQuotes = /"[^"\n]{2,}"/;
    if (count(straightQuotes)) add('ALERTE', `Typo FR : ${count(straightQuotes)} guillemets droits "…" au lieu de « … »${sample(straightQuotes)}`);
    const apos = /[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/;
    if (count(apos)) add('ALERTE', `Typo : ${count(apos)} apostrophe(s) droite(s) ' au lieu de l'apostrophe typographique ’ (détail de finition)`);
    if (/\.\.\./.test(fullText)) add('ALERTE', `Typo : « ... » au lieu du caractère « … »${sample(/\.\.\./)}`);
    const euro = /\d €/;
    if (count(euro)) add('ALERTE', `Typo FR : ${count(euro)} montant(s) avec espace sécable avant « € » : le symbole peut passer seul à la ligne${sample(euro)}`);
    // Seulement les quantit\u00e9s et montants (pas les codes postaux, SIRET, t\u00e9l\u00e9phones, ann\u00e9es).
    const bigNum = /(?<![\d.,\u00a0\u202f])\d{4,}\s?(\u20ac|euros?|\$|%|clients|personnes|abonn\u00e9s|conversations|appels|messages|utilisateurs|visiteurs|ventes)/i;
    if (count(bigNum)) add('ALERTE', `Typo FR : nombre(s) sans séparateur de milliers${sample(bigNum)}`);
  }

  /* --- Titres --- */
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
  const h1 = hs.filter((h) => h.tagName === 'H1').length;
  if (h1 !== 1) add('ÉCHEC', `${h1} titre(s) h1 au lieu d'un seul`);
  let prev = 0;
  for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) add('ALERTE', `Niveau de titre sauté : h${prev} puis h${l} (« ${label(h)} »)`); prev = l; }
  const emojiH = hs.filter((h) => /\p{Extended_Pictographic}/u.test(h.textContent));
  if (emojiH.length) add('CLICHÉ', `${emojiH.length} titre(s) avec emoji : « ${label(emojiH[0])} »`);
  const unbalanced = hs.filter((h) => /^H[12]$/.test(h.tagName)).filter((h) => !/balance|pretty/.test(getComputedStyle(h).textWrap || getComputedStyle(h).textWrapStyle || ''));
  if (unbalanced.length) add('ALERTE', `${unbalanced.length} titre(s) h1/h2 sans « text-wrap: balance » : risque de mot orphelin en fin de titre`);
  // Mot accentué seul dans un titre (couleur, italique ou gras différent) : le tic n°1
  const accented = hs.filter((h) => [...h.querySelectorAll('span,em,strong,i,b,mark')].some((c) => {
    const a = getComputedStyle(h), b = getComputedStyle(c);
    return c.textContent.trim().split(/\s+/).length <= 3 && (a.color !== b.color || a.fontStyle !== b.fontStyle || b.backgroundImage !== 'none');
  }));
  if (accented.length) add('CLICHÉ', `${accented.length} titre(s) avec un mot mis en couleur, italique ou dégradé : « ${label(accented[0])} »`);

  /* --- Boutons et liens --- */
  const clickables = [...document.querySelectorAll('a,button,[role=button],input[type=submit]')].filter(vis);
  const arrows = clickables.filter((b) => /[→➜➔⟶›»]\s*$/.test(b.textContent.trim()));
  if (arrows.length) add('CLICHÉ', `${arrows.length} bouton(s)/lien(s) terminé(s) par une flèche : « ${label(arrows[0])} »`);
  const toTop = (a) => /haut|top|accueil|home/i.test(a.getAttribute('aria-label') || '');
  const dead = clickables.filter((a) => a.tagName === 'A' && !toTop(a) && (!a.getAttribute('href') || a.getAttribute('href') === '#' || /^javascript:/i.test(a.getAttribute('href'))));
  if (dead.length) add('ÉCHEC', `${dead.length} lien(s) mort(s) (href vide, « # » ou javascript:) : « ${label(dead[0])} »`);
  const vague = clickables.filter((b) => /^(en savoir plus|cliquez ici|ici|learn more|click here|d[ée]couvrir|submit|envoyer|go)$/i.test(b.textContent.trim()));
  if (vague.length) add('ALERTE', `${vague.length} libellé(s) d'action vague(s) : « ${label(vague[0])} » (dire exactement ce qui se passe)`);
  const blank = clickables.filter((a) => a.target === '_blank' && !/nouvel onglet|new tab|new window/i.test(a.textContent + (a.getAttribute('aria-label') || '')));
  if (blank.length) add('ALERTE', `${blank.length} lien(s) ouvrant un nouvel onglet sans l'annoncer (lecteurs d'écran)`);
  if (innerWidth <= 400) {
    const notInline = clickables.filter((el) => !el.closest('p,td,figcaption') || el.classList.length);
    const tiny = notInline.filter((el) => { const r = el.getBoundingClientRect(); return r.height < 16 || r.width < 16; });
    const small = notInline.filter((el) => !tiny.includes(el)).filter((el) => { const r = el.getBoundingClientRect(); return r.height < 24 || r.width < 24; });
    if (tiny.length) add('ÉCHEC', `${tiny.length} zone(s) cliquable(s) de moins de 16 px sur mobile : « ${label(tiny[0])} »`);
    // Entre 16 et 24 px : conforme seulement si l'espacement autour suffit (exception WCAG 2.5.8), à vérifier à l'œil.
    if (small.length) add('ALERTE', `${small.length} zone(s) cliquable(s) de moins de 24 px sur mobile (ajouter du padding) : « ${label(small[0])} »`);
    const btns = clickables.filter((el) => /btn|button/i.test(el.className) || el.tagName === 'BUTTON').filter((el) => el.getBoundingClientRect().height < 44);
    if (btns.length) add('ALERTE', `${btns.length} bouton(s) de moins de 44 px de haut sur mobile : « ${label(btns[0])} »`);
  }

  /* --- Images --- */
  const imgs = [...document.images];
  const noAlt = imgs.filter((i) => !i.hasAttribute('alt'));
  if (noAlt.length) add('ÉCHEC', `${noAlt.length} image(s) sans attribut alt`);
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && vis(i));
  if (broken.length) add('ÉCHEC', `${broken.length} image(s) cassée(s) : ${broken[0].getAttribute('src')}`);
  const noDim = imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height'));
  if (noDim.length) add('ALERTE', `${noDim.length} image(s) sans width/height : la page saute au chargement`);

  /* --- Couleurs, contrastes --- */
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
  const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  const lum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e);
    if (s.backgroundImage !== 'none') return null; const c = parse(s.backgroundColor); if (c && c.a > 0.95) return c; }
    return { r: 255, g: 255, b: 255, a: 1 }; };
  const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  const tellHits = new Map(); const lowContrast = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    for (const prop of ['color', 'backgroundColor', 'borderTopColor']) {
      const c = parse(s[prop]); if (!c || c.a < 0.5) continue;
      if (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 6) continue; // gris neutres : jamais un cliché de couleur
      for (const [h, name] of Object.entries(TELLS)) {
        const t = { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
        if (dist(c, t) < 10) tellHits.set(name, hex(c));
      }
    }
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      const fg = parse(s.color), bg = bgOf(el);
      if (fg && bg) {
        const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a); const ratio = (L1 + 0.05) / (L2 + 0.05);
        const size = parseFloat(s.fontSize); const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
        if (ratio < (large ? 3 : 4.5)) lowContrast.push(`« ${label(el)} » ${ratio.toFixed(2)}:1`);
      }
    }
  }
  for (const [name, h] of tellHits) add('CLICHÉ', `Couleur signature des sites IA (${name}) : ${h}`);
  if (lowContrast.length) add('ÉCHEC', `${lowContrast.length} texte(s) sous le contraste AA : ${lowContrast.slice(0, 3).join(' ; ')}`);

  /* --- Styles génériques --- */
  const gradients = all.filter((el) => /gradient/.test(getComputedStyle(el).backgroundImage));
  if (gradients.length > 1) add('CLICHÉ', `${gradients.length} élément(s) avec dégradé décoratif`);
  const textGrad = all.filter((el) => getComputedStyle(el).webkitBackgroundClip === 'text' || getComputedStyle(el).backgroundClip === 'text');
  if (textGrad.length) add('CLICHÉ', `${textGrad.length} texte(s) en dégradé`);
  const glass = all.filter((el) => (getComputedStyle(el).backdropFilter || 'none') !== 'none');
  if (glass.length) add('CLICHÉ', `${glass.length} élément(s) en verre flouté (backdrop-filter)`);
  const shadows = {}; for (const el of all) { const v = getComputedStyle(el).boxShadow; if (v !== 'none' && !/0px 0px 0px/.test(v)) shadows[v] = (shadows[v] || 0) + 1; }
  const topShadow = Object.entries(shadows).sort((a, b) => b[1] - a[1])[0];
  if (topShadow && topShadow[1] >= 3) add('CLICHÉ', `La même ombre portée répétée sur ${topShadow[1]} éléments`);
  const boxes = all.filter((el) => { const s = getComputedStyle(el); return (s.borderTopWidth !== '0px' || (parse(s.backgroundColor)?.a ?? 0) > 0) && el.getBoundingClientRect().width > 120; });
  const radii = {}; for (const el of boxes) { const r = parseFloat(getComputedStyle(el).borderTopLeftRadius); if (r >= 8) radii[r] = (radii[r] || 0) + 1; }
  const topR = Object.entries(radii).sort((a, b) => b[1] - a[1])[0];
  if (topR && topR[1] >= 6 && topR[1] / boxes.length > 0.5) add('CLICHÉ', `Le même arrondi de ${topR[0]} px sur ${topR[1]} blocs : aucune hiérarchie de formes`);
  const eyebrows = all.filter((el) => { const s = getComputedStyle(el); return s.textTransform === 'uppercase' && parseFloat(s.letterSpacing) > 0.5 && parseFloat(s.fontSize) <= 14 && el.textContent.trim(); });
  if (eyebrows.length > 2) add('CLICHÉ', `${eyebrows.length} petits labels en capitales espacées (sur-titres) : « ${label(eyebrows[0])} »`);
  // Grilles de cartes identiques « icône + titre + texte »
  const seen = new Set();
  for (const el of all) {
    const kids = [...el.children].filter(vis); if (kids.length < 3 || kids.length > 6) continue;
    const cls = kids[0].className; if (!cls || typeof cls !== 'string' || !kids.every((k) => k.className === cls)) continue;
    if (kids.every((k) => k.querySelector('svg,img,i,[class*=icon]') && k.querySelector('h3,h4,strong') && k.querySelector('p')) && !seen.has(cls)) {
      seen.add(cls); add('CLICHÉ', `Grille de ${kids.length} cartes identiques icône + titre + texte (.${cls.split(' ')[0]})`);
    }
  }
  // Police d'affichage par défaut
  const h1El = document.querySelector('h1');
  if (h1El) {
    const fam = getComputedStyle(h1El).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (FONTS.includes(fam)) add('CLICHÉ', `Titre principal en « ${fam} » : police par défaut, aucune personnalité typographique`);
  }
  // Animations d'apparition au défilement
  const below = all.filter((el) => el.getBoundingClientRect().top > innerHeight && getComputedStyle(el).opacity === '0');
  const aos = document.querySelectorAll('[data-aos],[class*=fade-up],[class*=fadeInUp],[class*=animate__],[class*=reveal]').length;
  // Une séquence unique (éléments d'un même parent, ex. une conversation animée) n'est pas un « reveal » de sections.
  const groups = new Set(below.map((el) => el.parentElement));
  if (groups.size > 2 || aos > 3) add('CLICHÉ', `${Math.max(groups.size, aos)} bloc(s) qui apparaissent en fondu au défilement`);

  /* --- Tête de page --- */
  if (!lang) add('ÉCHEC', 'Attribut lang absent sur <html>');
  if (!document.title.trim()) add('ÉCHEC', 'Balise <title> vide ou absente');
  if (!document.querySelector('meta[name=viewport]')) add('ÉCHEC', 'Meta viewport absente : site cassé sur mobile');
  if (!document.querySelector('meta[name=description]')) add('ALERTE', 'Meta description absente');
  if (!document.querySelector('meta[property="og:image"]')) add('ALERTE', 'Image Open Graph absente (partage sur réseaux)');
  if (!document.querySelector('link[rel~=icon]')) add('ALERTE', 'Favicon absent');

  return out;
}

/* ---------- Exécution ---------- */
const browser = await chromium.launch();
let failures = 0;
for (const url of targets) {
  const results = [];
  for (const width of [320, 375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errors = []; const missing = new Set();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('requestfailed', (r) => { if (r.url().startsWith('file:')) missing.add(r.url().split('/').pop()); });
    if (url.startsWith('file:')) await page.route(/^https?:\/\//, (r) => r.abort());
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) results.push(['ÉCHEC', `[${width}px] Défilement horizontal de ${overflow}px`]);
    if (width === 375) {
      results.push(...await page.evaluate(analyse, { COPY: COPY_CLICHES.map(String), PROOF: SOCIAL_PROOF.map(String), TELLS: TELL_COLORS, FONTS: DEFAULT_DISPLAY_FONTS }));
      if (errors.length) results.push(['ÉCHEC', `Erreurs JavaScript : ${errors.slice(0, 3).join(' | ')}`]);
      if (missing.size) results.push(['ÉCHEC', `Fichiers locaux introuvables : ${[...missing].join(', ')}`]);
      // Focus clavier visible
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null;
        const s = getComputedStyle(el); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none'; });
      if (focus === false) results.push(['ÉCHEC', 'Focus clavier invisible sur le premier élément atteint avec Tab']);
      // Mouvement réduit
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(400);
      const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getTiming().iterations === Infinity || a.effect?.getTiming().duration > 200)).length);
      if (running) results.push(['ALERTE', `${running} animation(s) encore active(s) avec « réduire les animations » activé`]);
    }
    await page.close();
  }
  const rank = { 'ÉCHEC': 0, 'CLICHÉ': 1, 'ALERTE': 2 };
  results.sort((a, b) => rank[a[0]] - rank[b[0]]);
  console.log(`\n=== ${decodeURIComponent(url)} ===`);
  if (!results.length) console.log('Aucun défaut détecté.');
  for (const [lvl, msg] of results) console.log(`${lvl.padEnd(6)} ${msg}`);
  const n = (l) => results.filter((r) => r[0] === l).length;
  console.log(`-> ${n('ÉCHEC')} échec(s), ${n('CLICHÉ')} cliché(s), ${n('ALERTE')} alerte(s)`);
  failures += n('ÉCHEC');
}
await browser.close();
console.log('\nCe script ne juge pas : la cohérence de la direction artistique, la qualité des textes, l\'élément marquant. Ça reste une relecture humaine (voir SKILL.md, « Test du remplacement »).');
process.exit(failures ? 1 : 0);
