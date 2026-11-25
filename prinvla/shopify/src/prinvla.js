(() => {
  // PRINVLA — comportement de la section (aucune dépendance ; la 3D se charge à la demande).
  const host = document.currentScript && document.currentScript.parentElement;
  const root = host && host.querySelector('.pv');
  if (!root || root.dataset.pvReady) return;
  root.dataset.pvReady = '1';

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const desktop = () => matchMedia('(min-width: 900px)').matches;
  if (!reduce) root.classList.add('pv-motion');

  /* Apparitions au scroll */
  const io = new IntersectionObserver((ens) => ens.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); if (!en.target.matches('.pv-how__step')) io.unobserve(en.target); }
    else if (en.target.matches('.pv-how__step')) en.target.classList.remove('is-in');
  }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  $$('[data-pv-reveal]').forEach((el) => io.observe(el));

  /* Compteur de stock */
  const stockEl = $('[data-pv-stock]');
  const bar = $('[data-pv-stock-bar]');
  if (stockEl && !reduce) {
    const target = Number(stockEl.dataset.pvStock) || 0;
    const ratio = bar ? (parseFloat((bar.style.transform.match(/scaleX\(([\d.]+)\)/) || [])[1]) || 0) : 0;
    stockEl.textContent = '0';
    if (bar) bar.style.transform = 'scaleX(0)';
    const sio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      sio.disconnect();
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
        stockEl.textContent = String(Math.round(target * e));
        if (bar) bar.style.transform = `scaleX(${ratio * e})`;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    sio.observe(stockEl);
  }

  /* Bouton « Je prends le Duo » : défile vers les prix et met le Duo en avant */
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-pv-highlight]');
    if (!a) return;
    const target = root.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const card = $(`.pv-card[data-pack="${a.dataset.pvHighlight}"]`);
    if (card) {
      card.classList.remove('is-highlight'); void card.offsetWidth; card.classList.add('is-highlight');
      setTimeout(() => card.querySelector('button, a')?.focus({ preventScroll: true }), reduce ? 0 : 900);
    }
  });

  /* Boutons magnétiques */
  if (fine && !reduce) $$('.pv-magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.32}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* Barre d'achat mobile : visible entre le hero et les prix */
  const buybar = $('[data-pv-buybar]');
  if (buybar) {
    const seen = new Map();
    const watch = [$('.pv-hero__actions'), $('.pv-pricing'), $('.pv-final')].filter(Boolean);
    const bio = new IntersectionObserver((ens) => {
      ens.forEach((en) => seen.set(en.target, en.isIntersecting));
      const heroGone = !seen.get(watch[0]) && watch[0].getBoundingClientRect().top < 0;
      const on = heroGone && !seen.get(watch[1]) && !seen.get(watch[2]);
      buybar.classList.toggle('is-on', on);
      buybar.setAttribute('aria-hidden', String(!on));
      buybar.querySelector('a').tabIndex = on ? 0 : -1;
    });
    watch.forEach((el) => bio.observe(el));
  }

  /* Champ de flocons (fuit le curseur), actif seulement quand la section est à l'écran */
  if (!reduce) {
    const cv = $('.pv-snow');
    const ctx = cv.getContext('2d');
    const COUNT = desktop() ? 320 : 200;
    let w = 0, h = 0, running = false, visible = false, last = 0;
    const mouse = { x: -9999, y: -9999 };
    const flakes = [];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize, { passive: true });
    for (let i = 0; i < COUNT; i++) {
      const z = Math.random();
      flakes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.5 + z * 1.9, vy: 12 + z * 38, vx: (Math.random() - 0.5) * 8, ph: Math.random() * 6.28, a: 0.18 + z * 0.5, ox: 0, oy: 0 });
    }
    if (fine) addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    const loop = (now) => {
      if (!visible || document.hidden) { running = false; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#e8f7ff';
      for (const f of flakes) {
        f.ph += dt; f.y += f.vy * dt; f.x += (f.vx + Math.sin(f.ph) * 6) * dt;
        const dx = f.x + f.ox - mouse.x, dy = f.y + f.oy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) || 1, k = (120 - d) / 120; f.ox += (dx / d) * k * 540 * dt; f.oy += (dy / d) * k * 540 * dt; }
        f.ox *= 0.94; f.oy *= 0.94;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5; else if (f.x < -5) f.x = w + 5;
        ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x + f.ox, f.y + f.oy, f.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(loop);
    };
    const start = () => { if (!running && visible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(loop); } };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; start(); }).observe(root);
    document.addEventListener('visibilitychange', start);
  }

  /* Pince 3D : chargée au premier geste (ou après 4,5 s), pilotée par le défilement */
  const stage = $('[data-pv-stage]');
  const canvasHost = $('[data-pv-canvas]');
  const enable3D = root.dataset.enable3d !== 'false';
  const hasWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };

  async function start3D() {
    if (!hasWebGL()) { stage.classList.add('no-webgl'); return; }
    const src = host.querySelector('[data-pv-scene-src]').textContent;
    const glb = host.querySelector('[data-pv-glb]').textContent.trim();
    window.__NEVE_EMBED__ = {
      glbUrl: root.dataset.modelUrl || undefined,
      glb: root.dataset.modelUrl ? undefined : glb,
      dracoPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
    };
    let api;
    try {
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      const { createScene } = await import(url);
      api = await createScene(canvasHost);
    } catch (err) {
      console.warn('PRINVLA : 3D indisponible, image fixe conservée.', err);
      stage.classList.add('no-webgl');
      return;
    }
    stage.classList.add('is-3d');
    const hint = $('.pv-stage__hint');
    const hero = $('.pv-hero');
    let target = 0, current = 0, raf = 0;
    const measure = () => {
      if (desktop()) {
        const r = hero.getBoundingClientRect();
        target = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      } else {
        const r = stage.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const startC = innerHeight * 1.05, endC = innerHeight * 0.45;
        target = Math.min(1, Math.max(0, (startC - center) / (startC - endC)));
        if (scrollY < 2) target = 0;
      }
    };
    const step = () => {
      raf = 0;
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.0005) current = target;
      api.setProgress(current);
      if (hint) hint.style.opacity = current > 0.08 ? '0' : '';
      if (current !== target) raf = requestAnimationFrame(step);
    };
    const onScroll = () => { measure(); if (!raf) raf = requestAnimationFrame(step); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  if (!reduce && enable3D && stage) {
    let done = false;
    const evs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'];
    const go = () => { if (done) return; done = true; evs.forEach((ev) => removeEventListener(ev, go)); start3D(); };
    evs.forEach((ev) => addEventListener(ev, go, { passive: true, once: true }));
    const later = () => setTimeout(go, 4500);
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  }
})();
