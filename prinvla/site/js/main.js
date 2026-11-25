import {
  STOCK, STOCK_TOTAL, DROP_NAME, STRIPE_LINKS, DROP2_FORM_URL, DUO_BADGE,
  CONTACT_EMAIL, SHOW_REVIEWS, REVIEWS, PLAUSIBLE_DOMAIN,
} from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const isDesktop = () => matchMedia('(min-width: 900px)').matches;
const BAR_H = 0; // barre d'annonce retirée

/* ───────── 1. Contenu piloté par config.js ───────── */
const soldOut = STOCK <= 0;
const stock = Math.max(0, Math.min(STOCK, STOCK_TOTAL));

$$('[data-buy]').forEach((a) => {
  if (soldOut) {
    a.textContent = 'Rejoindre la liste du Drop #2';
    a.href = DROP2_FORM_URL;
  } else {
    a.href = STRIPE_LINKS[a.dataset.buy];
  }
});
$$('[data-buy-hero]').forEach((a) => {
  if (soldOut) {
    a.innerHTML = '<span>Rejoindre la liste du Drop #2</span>';
    a.href = DROP2_FORM_URL;
    a.removeAttribute('data-buy-hero');
  }
});
if (soldOut) {
  document.body.classList.add('is-soldout');
  $('[data-stock-line]').textContent = `${DROP_NAME} épuisé : les ${STOCK_TOTAL} pinces sont parties.`;
  const ld = $('script[type="application/ld+json"]');
  ld.textContent = ld.textContent.replaceAll('https://schema.org/InStock', 'https://schema.org/SoldOut');
}
const badge = $('[data-duo-badge]');
if (badge) badge.textContent = DUO_BADGE;
$$('[data-contact]').forEach((a) => { a.href = `mailto:${CONTACT_EMAIL}`; });

// Garde-fou : un lien Stripe encore en placeholder ne doit jamais partir en production.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href*="XXXX"]');
  if (!a) return;
  e.preventDefault();
  alert('Lien de paiement pas encore configuré (js/config.js).');
});

// Avis : affichés seulement si SHOW_REVIEWS = true et qu'il y a de vraies vidéos
if (SHOW_REVIEWS && REVIEWS.length) {
  const sec = $('#avis');
  $('[data-reviews]').innerHTML = REVIEWS.map((r) => `
    <figure class="review">
      <video src="${r.video}" poster="${r.poster || ''}" controls playsinline preload="none"></video>
      <figcaption><strong>${r.name}</strong>${r.caption ? ` — ${r.caption}` : ''}</figcaption>
    </figure>`).join('');
  sec.hidden = false;
}

// Mesure d'audience sans cookie, désactivée par défaut
if (PLAUSIBLE_DOMAIN) {
  const s = document.createElement('script');
  s.defer = true; s.dataset.domain = PLAUSIBLE_DOMAIN; s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
}

/* ───────── 2. Défilement : Lenis + ancres ───────── */
let lenis = null;
function scrollToEl(el) {
  if (lenis) lenis.scrollTo(el, { offset: -BAR_H - 8, duration: 1.3 });
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
function highlight(pack) {
  const card = $(`.card[data-pack="${pack}"]`);
  if (!card) return;
  card.classList.remove('is-highlight');
  void card.offsetWidth;
  card.classList.add('is-highlight');
  setTimeout(() => card.querySelector('.btn')?.focus({ preventScroll: true }), reduceMotion ? 0 : 1100);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href') === '#' || a.hasAttribute('data-dialog')) return;
  const target = $(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  scrollToEl(target);
  if (a.dataset.highlight) highlight(a.dataset.highlight);
  history.replaceState(null, '', a.getAttribute('href'));
});

/* ───────── 3. Compteur de stock ───────── */
const stockEl = $('[data-stock]');
const stockBar = $('[data-stock-bar]');
if (stockEl) {
  stockEl.textContent = String(stock);
  stockBar.style.transform = `scaleX(${stock / STOCK_TOTAL})`;
  if (!reduceMotion && stock > 0) {
    stockEl.textContent = '0';
    stockBar.style.transform = 'scaleX(0)';
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1100;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        stockEl.textContent = String(Math.round(stock * e));
        stockBar.style.transform = `scaleX(${(stock / STOCK_TOTAL) * e})`;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(stockEl);
  }
}

/* ───────── 4. Icônes des étapes (animées une fois visibles) ───────── */
const stepIO = new IntersectionObserver((ens) => ens.forEach((en) => en.target.classList.toggle('is-in', en.isIntersecting)), { threshold: 0.4 });
$$('.how__step').forEach((s) => stepIO.observe(s));

/* ───────── 5. Barre d'achat mobile ───────── */
const buybar = $('[data-buybar]');
if (buybar && !soldOut) {
  const seen = new Map();
  const watch = [$('.hero__actions'), $('#prix'), $('.final')];
  const io = new IntersectionObserver((ens) => {
    ens.forEach((en) => seen.set(en.target, en.isIntersecting));
    const heroGone = seen.has(watch[0]) && !seen.get(watch[0]) && watch[0].getBoundingClientRect().top < 0;
    const on = heroGone && !seen.get(watch[1]) && !seen.get(watch[2]);
    buybar.classList.toggle('is-on', on);
    buybar.setAttribute('aria-hidden', String(!on));
    buybar.querySelector('a').tabIndex = on ? 0 : -1;
  });
  watch.forEach((el) => io.observe(el));
}

/* ───────── 6. Boutons magnétiques ───────── */
if (finePointer && !reduceMotion) {
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
      btn.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.32}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });
}

/* ───────── 7. Champ de flocons (canvas 2D, fuit le curseur) ───────── */
function startSnow() {
  const cv = $('.snow');
  const ctx = cv.getContext('2d', { alpha: true });
  const mobile = !isDesktop();
  const COUNT = mobile ? 200 : 320;           // ≤ 400 sur mobile (cahier des charges)
  let w, h, dpr, flakes = [];
  const mouse = { x: -9999, y: -9999 };
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize, { passive: true });
  for (let i = 0; i < COUNT; i++) {
    const z = Math.random();
    flakes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.5 + z * 1.9, vy: 12 + z * 38, vx: (Math.random() - 0.5) * 8, ph: Math.random() * 6.28, a: 0.18 + z * 0.5, ox: 0, oy: 0 });
  }
  if (finePointer) addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  let last = performance.now(), running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(loop); } });
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e8f7ff';
    for (const f of flakes) {
      f.ph += dt;
      f.y += f.vy * dt;
      f.x += (f.vx + Math.sin(f.ph) * 6) * dt;
      const dx = f.x + f.ox - mouse.x, dy = f.y + f.oy - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 14400) { const d = Math.sqrt(d2) || 1, k = (120 - d) / 120; f.ox += (dx / d) * k * 90 * dt * 6; f.oy += (dy / d) * k * 90 * dt * 6; }
      f.ox *= 0.94; f.oy *= 0.94;
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      if (f.x > w + 5) f.x = -5; else if (f.x < -5) f.x = w + 5;
      ctx.globalAlpha = f.a;
      ctx.beginPath(); ctx.arc(f.x + f.ox, f.y + f.oy, f.r, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ───────── 8. GSAP + ScrollTrigger + Lenis ───────── */
async function startMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) { root.classList.remove('motion'); return null; }
  gsap.registerPlugin(ScrollTrigger);

  const { default: Lenis } = await import('../assets/vendor/lenis.mjs');
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Zéro bullshit : la ligne négative est barrée, puis le positif glisse en place
  $$('.zb__row').forEach((row) => {
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 82%', once: true } })
      .from(row.querySelector('.zb__neg'), { opacity: 0, x: -16, duration: 0.45, ease: 'power2.out' })
      .to(row.querySelector('.zb__strike'), { scaleX: 1, duration: 0.45, ease: 'power3.inOut' }, '+=0.1')
      .to(row.querySelector('.zb__neg'), { opacity: 0.8, duration: 0.3 }, '<0.2')
      .to(row.querySelector('.zb__pos'), { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.1');
  });

  // Titres de section : légère montée
  $$('.h2, .final__title').forEach((h) => gsap.from(h, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
  gsap.from('.camp--kaki', { xPercent: -30, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.camps__grid', start: 'top 80%', once: true } });
  gsap.from('.camp--bordeaux', { xPercent: 30, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.camps__grid', start: 'top 80%', once: true } });
  gsap.from('.camps__vs', { scale: 0, rotate: -90, duration: 0.7, delay: 0.3, ease: 'back.out(2)', scrollTrigger: { trigger: '.camps__grid', start: 'top 80%', once: true } });
  gsap.from('.card', { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 85%', once: true } });

  return { gsap, ScrollTrigger };
}

/* ───────── 9. 3D différée ───────── */
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function start3D(motion) {
  const stage = $('[data-stage]');
  const host = $('[data-canvas]');
  if (!hasWebGL()) { root.classList.add('no-webgl'); return; }
  let api;
  try {
    const { createScene } = await import('./scene3d.js');
    api = await createScene(host);
  } catch (err) {
    console.warn('3D indisponible, image statique conservée.', err);
    root.classList.add('no-webgl');
    return;
  }
  stage.classList.add('is-3d');
  const hint = $('.stage__hint');
  const onProgress = (p) => { api.setProgress(p); hint.style.opacity = p > 0.08 ? '0' : ''; };

  if (motion) {
    const { ScrollTrigger } = motion;
    const mm = motion.gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      ScrollTrigger.create({ trigger: '.hero', start: () => 0, end: 'bottom bottom', scrub: 0.6, onUpdate: (s) => onProgress(s.progress) });
    });
    mm.add('(max-width: 899px)', () => {
      ScrollTrigger.create({ trigger: stage, start: () => 0, end: 'center 45%', scrub: 0.5, onUpdate: (s) => onProgress(s.progress) });
    });
    ScrollTrigger.refresh();
  }
}

/* ───────── Démarrage ───────── */
// Animations et 3D sont chargées APRÈS le premier affichage, au premier geste
// de l'utilisateur (scroll, toucher, souris) ou après un court délai.
function whenReady(fn) {
  let done = false;
  const go = () => { if (done) return; done = true; evs.forEach((ev) => removeEventListener(ev, go)); fn(); };
  const evs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'];
  evs.forEach((ev) => addEventListener(ev, go, { passive: true, once: true }));
  const later = () => setTimeout(go, 4500);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
}

if (reduceMotion) {
  // Contenu statique et lisible : pas de Lenis, pas de particules, pas d'animation au scroll, pas de 3D.
} else {
  let motionReady = null;
  const boot = () => {
    if (!motionReady) motionReady = startMotion().catch((e) => { console.warn(e); root.classList.remove('motion'); return null; });
    return motionReady;
  };
  // Les effets légers démarrent dès que le navigateur est libre
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(() => { startSnow(); boot(); });
  whenReady(async () => { const m = await boot(); start3D(m); });
}
