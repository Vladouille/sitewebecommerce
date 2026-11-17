/* =========================================================================
   C'DU NETT MULTISERVICES : interactions
   JavaScript sans dépendance et sans module, pour que le site s'ouvre aussi
   en double-cliquant sur index.html. Si l'utilisateur demande moins
   d'animations (prefers-reduced-motion), toutes les animations sont coupées.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ===== 1. Header : se compacte après quelques pixels de scroll ===== */
  var header = $('.site-header');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      header.classList.toggle('is-compact', window.scrollY > 40);
      updateParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ===== 2. Menu burger (mobile) ===== */
  var burger = $('.burger');
  var nav = $('#menu');
  var backdrop = $('.nav-backdrop');
  var desktopMq = window.matchMedia('(min-width: 1024px)');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      backdrop.hidden = false;
      window.requestAnimationFrame(function () { backdrop.classList.add('is-visible'); });
      var first = $('.nav__link', nav);
      if (first) first.focus({ preventScroll: true });
    } else {
      backdrop.classList.remove('is-visible');
      window.setTimeout(function () { if (!nav.classList.contains('is-open')) backdrop.hidden = true; }, 300);
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  backdrop.addEventListener('click', function () { setMenu(false); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (!desktopMq.matches) setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  desktopMq.addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ===== 3. Révélation au scroll (cascade sur les éléments qui entrent ensemble) ===== */
  var revealEls = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
      batch.forEach(function (el, k) {
        el.style.setProperty('--i', Math.min(k, 7));
        el.classList.add('is-visible');
        revealIO.unobserve(el);
        startCounters(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ===== 4. Compteurs animés (uniquement des données réelles : 16, 2, 6) ===== */
  // Le HTML contient déjà la valeur finale (visible sans JS) ; on part de 0 seulement si on anime
  var counters = $$('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) counters.forEach(function (c) { c.textContent = '0'; });

  function startCounters(scope) {
    if (reduceMotion) return;
    $$('[data-count]', scope).forEach(function (c) {
      if (c.dataset.done) return;
      c.dataset.done = '1';
      var target = parseInt(c.getAttribute('data-count'), 10);
      var t0 = null;
      var dur = 1200;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        c.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      })(performance.now());
    });
  }

  /* ===== 5. Hero : léger parallaxe sur l'image de fond ===== */
  var hero = $('.hero');
  var heroBg = $('.hero__bg');
  var heroVisible = true;
  function updateParallax() {
    if (reduceMotion || !heroBg || !heroVisible) return;
    heroBg.style.transform = 'translate3d(0,' + (window.scrollY * 0.25).toFixed(1) + 'px,0)';
  }

  /* ===== 6. Bouton d'appel flottant : apparaît une fois le hero dépassé (piloté par l'observer du hero, section 7) ===== */
  var fab = $('.call-fab');
  if (!('IntersectionObserver' in window)) fab.classList.add('is-visible');

  /* ===== 7. Hero : bulles de savon discrètes (canvas, moins de 40) ===== */
  var canvas = $('.hero__bubbles');
  var bubbles = [];
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var running = false;
  var rafId = 0;
  var lastTs = 0;
  var cw = 0, ch = 0;

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function makeBubble(randomY) {
    return {
      x: Math.random() * cw,
      y: randomY ? Math.random() * ch : ch + 30,
      r: 4 + Math.random() * 16,
      speed: 12 + Math.random() * 26,          // px par seconde
      drift: 6 + Math.random() * 14,           // amplitude du balancement
      phase: Math.random() * Math.PI * 2,
      alpha: 0.07 + Math.random() * 0.14     // très discret
    };
  }
  function drawBubble(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,' + b.alpha + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (b.alpha * 0.25) + ')';
    ctx.fill();
    // petit reflet
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(b.alpha * 2, 0.6) + ')';
    ctx.fill();
  }
  function frame(ts) {
    var dt = Math.min((ts - (lastTs || ts)) / 1000, 0.05);
    lastTs = ts;
    ctx.clearRect(0, 0, cw, ch);
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y -= b.speed * dt;
      b.phase += dt * 0.8;
      var x = b.x + Math.sin(b.phase) * b.drift;
      if (b.y < -30) { bubbles[i] = makeBubble(false); continue; }
      drawBubble({ x: x, y: b.y, r: b.r, alpha: b.alpha });
    }
    rafId = window.requestAnimationFrame(frame);
  }
  function play() {
    if (running || !ctx) return;
    running = true; lastTs = 0;
    rafId = window.requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    window.cancelAnimationFrame(rafId);
  }
  if (ctx && !reduceMotion) {
    sizeCanvas();
    var count = cw < 768 ? 14 : 28; // toujours moins de 40
    for (var i = 0; i < count; i++) bubbles.push(makeBubble(true));
    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvas, 150);
    });
    // Pause quand l'onglet est caché
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else if (heroVisible) play();
    });
    play();
  }
  // Pause des bulles et du parallaxe quand le hero est hors de l'écran
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (ctx && !reduceMotion) { if (heroVisible && !document.hidden) play(); else pause(); }
      fab.classList.toggle('is-visible', !heroVisible);
    }).observe(hero);
  }


  /* ===== 8. Cartes de services : léger effet 3D (tilt) au survol ===== */
  if (finePointer && !reduceMotion) {
    $$('.service__card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ===== 9. Filtres des services ===== */
  var filterBtns = $$('.filter');
  var services = $$('.service');
  var filterStatus = $('#filtre-statut');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      services.forEach(function (s) {
        var match = f === 'tous' || s.getAttribute('data-cat') === f;
        if (match) shown++;
        if (reduceMotion) { s.classList.toggle('is-hidden', !match); return; }
        if (!match && !s.classList.contains('is-hidden')) {
          s.classList.add('is-leaving');
          window.setTimeout(function () { s.classList.add('is-hidden'); s.classList.remove('is-leaving'); }, 220);
        } else if (match && s.classList.contains('is-hidden')) {
          window.setTimeout(function () {
            s.classList.add('is-leaving');
            s.classList.remove('is-hidden');
            void s.offsetWidth; // force le recalcul pour lancer la transition
            s.classList.remove('is-leaving');
          }, 230);
        }
      });
      filterStatus.textContent = shown + ' service' + (shown > 1 ? 's' : '') + ' affiché' + (shown > 1 ? 's' : '');
    });
  });

  /* ===== 10. Formulaire de devis ===== */
  var form = $('#form-devis');
  var statusEl = $('.form__status', form);
  var mailtoBtn = $('#form-mailto');
  var EMAIL_TO = 'cdunettmultiservices@gmail.com';

  // Les boutons "Devis professionnel / particulier" pré-cochent le type de client
  $$('[data-client]').forEach(function (a) {
    a.addEventListener('click', function () {
      var radio = form.querySelector('input[name="type_client"][value="' + a.getAttribute('data-client') + '"]');
      if (radio) radio.checked = true;
    });
  });

  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.length && el[0] && el[0].type === 'radio') {
      var c = form.querySelector('input[name="' + name + '"]:checked');
      return c ? c.value : '';
    }
    return (el.value || '').trim();
  }

  // Construit un email pré-rempli à partir des champs (solution de secours sans serveur)
  function buildMailto() {
    var subject = 'Demande de devis' + (val('type_client') ? ' – ' + val('type_client') : '') + (val('nom') ? ' – ' + val('nom') : '');
    var body = [
      'Nom : ' + val('nom'),
      'Téléphone : ' + val('telephone'),
      'Email : ' + val('email'),
      'Type de client : ' + val('type_client'),
      'Service : ' + val('service'),
      '',
      val('message')
    ].join('\n');
    return 'mailto:' + EMAIL_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  mailtoBtn.addEventListener('click', function () { mailtoBtn.href = buildMailto(); });

  function setError(field, msg) {
    var wrap = field.closest('.field') || field.closest('.consent');
    var id = (field.id || field.name) + '-erreur';
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var inputs = field.type === 'radio' ? $$('input[name="' + field.name + '"]', form) : [field];
    inputs.forEach(function (inp) {
      if (msg) { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', id); }
      else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
    });
    if (!msg) return;
    var p = document.createElement('p');
    p.className = 'field__error'; p.id = id; p.textContent = msg; p.style.margin = '0';
    wrap.appendChild(p);
  }

  function validate() {
    var firstBad = null;
    var checks = [
      ['nom', function (v) { return v ? '' : 'Indiquez votre nom.'; }],
      ['telephone', function (v) { return v.replace(/[^0-9+]/g, '').length >= 10 ? '' : 'Indiquez un numéro de téléphone valide.'; }],
      ['email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Indiquez une adresse email valide.'; }],
      ['type_client', function (v) { return v ? '' : 'Précisez si vous êtes un professionnel ou un particulier.'; }],
      ['message', function (v) { return v ? '' : 'Décrivez votre besoin en quelques mots.'; }]
    ];
    checks.forEach(function (c) {
      var el = form.elements[c[0]];
      var field = el.length && el[0] && el[0].type === 'radio' ? el[0] : el;
      var msg = c[1](val(c[0]));
      setError(field, msg);
      if (msg && !firstBad) firstBad = field;
    });
    var consent = form.elements.consentement;
    var cMsg = consent.checked ? '' : 'Merci d\'accepter l\'utilisation de vos informations pour traiter la demande.';
    setError(consent, cMsg);
    if (cMsg && !firstBad) firstBad = consent;
    return firstBad;
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'form__status' + (type ? ' is-' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) { bad.focus(); showStatus('Certains champs sont à compléter.', 'error'); return; }

    // Champ anti-robot rempli : on ne transmet rien
    if (form.elements._gotcha && form.elements._gotcha.value) { showStatus('Merci, votre demande a bien été envoyée.', 'success'); return; }

    var action = form.getAttribute('action') || '';
    // Endpoint Formspree pas encore configuré : on bascule sur l'email pré-rempli
    if (action.indexOf('VOTRE_ID') !== -1) {
      window.location.href = buildMailto();
      showStatus('Votre messagerie s\'ouvre avec votre demande pré-remplie. Si rien ne s\'ouvre, écrivez-nous à ' + EMAIL_TO + '.', 'success');
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    showStatus('Envoi en cours…');
    fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showStatus('Merci, votre demande a bien été envoyée. Nous revenons vers vous rapidement.', 'success');
      })
      .catch(function () {
        showStatus('L\'envoi n\'a pas abouti. Utilisez le bouton « Envoyer par email » ou appelez le 01 43 89 39 97.', 'error');
      })
      .then(function () { submitBtn.disabled = false; });
  });
})();
