/* ════════════════════════════════════════════════════════════════════
   motion.js — animations (GSAP + ScrollTrigger + Lenis, chargés par CDN).
   Si le CDN ne répond pas ou si l'utilisateur demande moins de mouvement :
   on retire la classe .anim et tout le contenu reste visible, statique.
   Règle : on n'anime que transform et opacity.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove('anim'); return; }
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  window.__motionReady = true;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Lenis (scroll fluide) synchronisé avec ScrollTrigger ── */
  if (window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -110 });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* ── Hero : lettres + image révélée par un masque (transform uniquement) ── */
  var chars = document.querySelectorAll('.hero-title .char');
  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(chars, { y: 0, duration: 1.1, stagger: .028 })
    .to('.mask-cover', { scaleX: 0, duration: 1.2, ease: 'expo.inOut' }, .15)
    .from('.hero-media img', { scale: 1.18, duration: 1.6 }, .2)
    .add(function () { root.classList.remove('anim'); gsap.set(chars, { clearProps: 'transform' }); });

  /* ── Apparitions au scroll ── */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    /* Cartes services empilées : la carte du dessous recule quand la suivante arrive */
    var cards = gsap.utils.toArray('.scard');
    cards.forEach(function (card, i) {
      var next = cards[i + 1]; if (!next) return;
      gsap.to(card, { scale: .92, opacity: .55, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true } });
    });
    /* Parallaxe légère des images */
    gsap.utils.toArray('.parallax img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* Méthode : la ligne se dessine au scroll (scaleY) */
  gsap.fromTo('.steps-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true } });

  /* Manifeste : chaque mot passe de « grisé » à net (opacity). Départ à .55 = contraste AA (texte large) même avant le scroll. */
  gsap.fromTo('.manifest-text .w', { opacity: .55 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.manifest-text', start: 'top 80%', end: 'bottom 50%', scrub: true } });

  /* Avant / après : la poignée se « montre » une fois à l'apparition */
  ST.create({ trigger: '#ba', start: 'top 70%', once: true, onEnter: function () {
    var o = { v: 50 };
    gsap.timeline().to(o, { v: 70, duration: .7, ease: 'power2.inOut', onUpdate: function () { window.__setBA && window.__setBA(o.v); } })
      .to(o, { v: 35, duration: .8, ease: 'power2.inOut', onUpdate: function () { window.__setBA && window.__setBA(o.v); } })
      .to(o, { v: 50, duration: .6, ease: 'power2.out', onUpdate: function () { window.__setBA && window.__setBA(o.v); } });
  } });

  /* ── Desktop uniquement : curseur custom + boutons magnétiques ── */
  if (fine) {
    root.classList.add('has-cursor');
    var cur = document.querySelector('.cursor'), dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
    var dx = gsap.quickTo(dot, 'x', { duration: .12 }), dy = gsap.quickTo(dot, 'y', { duration: .12 });
    var rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) { cur.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, label, input, .ba'))); });
    gsap.utils.toArray('.magnetic').forEach(function (b) {
      var bx = gsap.quickTo(b, 'x', { duration: .5, ease: 'elastic.out(1, .4)' }), by = gsap.quickTo(b, 'y', { duration: .5, ease: 'elastic.out(1, .4)' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * .3); by((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener('pointerleave', function () { bx(0); by(0); });
    });
  }

  addEventListener('load', function () { ST.refresh(); });
})();
