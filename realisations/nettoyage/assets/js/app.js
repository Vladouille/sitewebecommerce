/* ════════════════════════════════════════════════════════════════════
   app.js — remplit la page depuis config.js et gère les interactions.
   Aucune dépendance : fonctionne même si les CDN (GSAP, Lenis) ne chargent pas.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.SITE, root = document.documentElement;
  if (!S) return;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var get = function (path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, S); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var E = S.entreprise, C = S.createur;
  var pic = function (base, small) { return { src: base + '.webp', srcset: base + '-' + small + '.webp ' + small + 'w, ' + base + '.webp' }; };

  /* ── 1. Textes simples ([data-t="chemin.dans.config"]) ── */
  $$('[data-t]').forEach(function (el) { var v = get(el.dataset.t); if (v != null) el.textContent = v; });
  document.title = E.nom + ' · ' + E.metier + ' · démo';
  $('#year').textContent = new Date().getFullYear();

  /* Liens de l'entreprise fictive (bulle « lien de démonstration ») */
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + E.telephoneLien; a.textContent = E.telephone; });
  $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + E.email; a.textContent = E.email; });
  /* Liens du créateur (les vrais : jamais interceptés) */
  var isUrl = function (s) { return /^https?:\/\//.test(s); };
  $$('[data-creator-site]').forEach(function (a) { a.href = isUrl(C.site) ? C.site : '#'; if (isUrl(C.site)) { a.target = '_blank'; a.rel = 'noopener'; } });
  $$('[data-creator-mail]').forEach(function (a) { a.href = 'mailto:' + C.email; });
  $$('[data-creator-tel]').forEach(function (a) { a.href = 'tel:' + String(C.telephone).replace(/[^\d+]/g, ''); });

  /* ── 2. Hero : titre découpé lettre par lettre (lu en entier par les lecteurs d'écran) ── */
  var h1 = $('#hero-title');
  h1.setAttribute('aria-label', S.hero.titre.join(' '));
  h1.innerHTML = S.hero.titre.map(function (line) {
    return '<span class="line" aria-hidden="true">' + Array.from(line).map(function (ch) {
      return '<span class="char">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>';
    }).join('') + '</span>';
  }).join('');
  $('#badges').innerHTML = S.hero.badges.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
  var hi = $('#hero-img'), hp = pic(S.hero.image, 800);
  hi.srcset = hp.srcset; hi.sizes = '(min-width: 900px) 58vw, 100vw'; hi.src = hp.src; hi.alt = S.hero.imageAlt;

  /* ── 3. Marquee (2 copies pour une boucle sans couture) ── */
  var mq = S.marquee.map(function (m) { return '<span class="marquee-item">' + esc(m) + '</span>'; }).join('');
  $('#marquee').innerHTML = mq + mq;

  /* ── 4. Services ── */
  $('#stack').innerHTML = S.services.map(function (s, i) {
    var p = pic(s.image, 700);
    return '<article class="scard" style="--i:' + i + '">' +
      '<div><p class="scard-num">0' + (i + 1) + ' / 0' + S.services.length + '</p><h3>' + esc(s.titre) + '</h3><p>' + esc(s.texte) + '</p>' +
      '<ul>' + s.points.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<a class="btn btn-ghost magnetic" href="#devis" data-lieu="' + i + '">Demander un devis</a></div>' +
      '<div class="scard-media parallax"><img src="' + p.src + '" srcset="' + p.srcset + '" sizes="(min-width: 900px) 45vw, 100vw" width="1200" height="900" loading="lazy" decoding="async" alt="' + esc(s.alt) + '"></div>' +
      '</article>';
  }).join('');

  /* ── 5. Avant / après ── */
  var ap = pic(S.avantApres.image, 800);
  ['#ba-after', '#ba-before'].forEach(function (id) { var im = $(id); im.srcset = ap.srcset; im.sizes = '(min-width: 1360px) 1300px, 100vw'; im.src = ap.src; });
  $('#ba-after').alt = S.avantApres.alt;

  /* ── 6. Méthode, manifeste, chiffres, avis ── */
  $('#steps').innerHTML = S.etapes.map(function (e) { return '<li data-reveal><h3>' + esc(e.titre) + '</h3><p>' + esc(e.texte) + '</p></li>'; }).join('');
  var mp = pic(S.methodeImage, 600), mi = $('#method-img');
  mi.srcset = mp.srcset; mi.sizes = '(min-width: 960px) 36vw, 100vw'; mi.src = mp.src; mi.alt = S.methodeImageAlt;
  $('#manifest').innerHTML = S.manifeste.split(/\s+/).map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
  var cp = pic(S.chiffresImage, 500);
  var tiles = S.chiffres.map(function (c, i) {
    var cls = i === 0 ? ' hl' : (i === 3 ? ' soft' : '');
    return '<div class="tile' + cls + '" data-reveal><p class="tile-num"><span data-count="' + c.valeur + '">' + c.valeur + '</span>' + esc(c.suffixe) + '</p><p class="tile-label">' + esc(c.label) + '</p></div>';
  });
  tiles.splice(2, 0, '<div class="tile tile-img" data-reveal><img src="' + cp.src + '" srcset="' + cp.srcset + '" sizes="(min-width: 900px) 50vw, 100vw" width="800" height="800" loading="lazy" decoding="async" alt="' + esc(S.chiffresImageAlt) + '"></div>');
  $('#stats').innerHTML = tiles.join('');
  $('#carousel').innerHTML = S.avis.slice(0, 3).map(function (a) {
    return '<figure class="review"><blockquote>« ' + esc(a.texte) + ' »</blockquote><figcaption><div><strong>' + esc(a.nom) + '</strong><span>' + esc(a.contexte) + '</span></div><span class="stars" role="img" aria-label="5 étoiles sur 5">★★★★★</span></figcaption></figure>';
  }).join('');

  /* ── 7. Formulaire : options ── */
  var opt = function (name, arr, cls) { return arr.map(function (v, i) { return '<label class="' + cls + '"><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (i === 0 && name !== 'lieu' ? '' : '') + '><span>' + esc(v) + '</span></label>'; }).join(''); };
  $('#q-lieux').innerHTML = opt('lieu', S.devis.lieux, 'tile-opt');
  $('#q-surfaces').innerHTML = opt('surface', S.devis.surfaces, 'chip');
  $('#q-freq').innerHTML = opt('frequence', S.devis.frequences, 'chip');

  /* Contenu en place : on affiche la page d'un coup (aucun décalage de mise en page). */
  root.classList.remove('pending');

  /* ════════════════ INTERACTIONS ════════════════ */

  /* Palette + mode (panneau « Personnaliser ») */
  var KEYS = ['encre', 'accent', 'doux', 'fond', 'vif', 'gris'];
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var current = store.get('demo-palette'); if (!S.palettes[current]) current = S.paletteParDefaut;
  var mode = root.dataset.mode;
  function apply(key, m, animate) {
    if (animate && !reduce) { root.classList.add('palette-anim'); clearTimeout(apply.t); apply.t = setTimeout(function () { root.classList.remove('palette-anim'); }, 700); }
    var p = S.palettes[key]; KEYS.forEach(function (k) { root.style.setProperty('--' + k, p[k]); });
    root.dataset.mode = m; current = key; mode = m;
    store.set('demo-palette', key); store.set('demo-mode', m);
    $$('.swatch').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.key === key)); });
    var sw = $('#modeSwitch'); sw.setAttribute('aria-checked', String(m === 'sombre'));
    document.dispatchEvent(new CustomEvent('palettechange'));
  }
  $('#swatches').innerHTML = Object.keys(S.palettes).map(function (k) {
    var p = S.palettes[k];
    return '<button class="swatch" type="button" role="radio" data-key="' + k + '" aria-checked="false"><i style="background:linear-gradient(135deg,' + p.accent + ' 0 50%,' + p.encre + ' 50% 100%)"></i>' + esc(p.label) + '</button>';
  }).join('');
  $$('.swatch').forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.key, mode, true); }); });
  $('#modeSwitch').addEventListener('click', function () { apply(current, mode === 'sombre' ? 'clair' : 'sombre', true); });
  apply(current, mode, false);
  var panel = $('#panel'), cbtn = $('#customBtn');
  function togglePanel(open) { panel.hidden = !open; cbtn.setAttribute('aria-expanded', String(open)); if (open) $('.swatch[aria-checked="true"]').focus(); }
  cbtn.addEventListener('click', function () { togglePanel(panel.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { togglePanel(false); cbtn.focus(); } });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !cbtn.contains(e.target)) togglePanel(false); });

  /* Bulle « Lien de démonstration » sur les tel: / mailto: de l'entreprise fictive */
  var tip = $('#demoTip');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-demo-link]');
    if (!a) return;
    e.preventDefault();
    var r = a.getBoundingClientRect();
    tip.textContent = 'Lien de démonstration';
    tip.style.left = Math.min(Math.max(r.left + r.width / 2, 90), innerWidth - 90) + 'px';
    tip.style.top = r.top + 'px';
    tip.classList.add('show'); clearTimeout(tip.t); tip.t = setTimeout(function () { tip.classList.remove('show'); }, 1800);
  });

  /* Header : se cache au scroll vers le bas, revient vers le haut */
  var hd = $('#hd'), lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false; var y = scrollY, d = y - lastY;
    hd.classList.toggle('is-solid', y > 10);
    if (Math.abs(d) > 6) { hd.classList.toggle('is-hidden', d > 0 && y > 240 && !menu.classList.contains('is-open')); lastY = y; }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* Menu plein écran (focus piégé, Échap) */
  var menu = $('#menu'), burger = $('#burger');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
    if (open) { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); document.body.style.overflow = 'hidden'; if (window.__lenis) window.__lenis.stop(); setTimeout(function () { $('a', menu).focus(); }, 60); }
    else { menu.classList.remove('is-open'); document.body.style.overflow = ''; if (window.__lenis) window.__lenis.start(); setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450); }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('.menu-nav a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (menu.hidden) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('a, button', menu).concat([burger]), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Avant / après : pointeur (souris ET doigt, y compris iOS) + range invisible pour le clavier */
  var ba = $('#ba'), range = $('#ba-range');
  function setPos(v) { v = Math.max(0, Math.min(100, v)); ba.style.setProperty('--pos', v + '%'); range.value = Math.round(v); range.setAttribute('aria-valuetext', Math.round(v) + ' % avant, ' + (100 - Math.round(v)) + ' % après'); }
  window.__setBA = setPos;
  var drag = false;
  ba.addEventListener('pointerdown', function (e) { drag = true; ba.setPointerCapture(e.pointerId); var r = ba.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); });
  ba.addEventListener('pointermove', function (e) { if (!drag) return; var r = ba.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { ba.addEventListener(t, function () { drag = false; }); });
  range.addEventListener('input', function () { setPos(+range.value); });

  /* Compteurs : partent de 0 à l'apparition (valeur finale déjà écrite sinon) */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, end = +el.dataset.count, t0 = null;
        (function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('fr-FR'); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  }

  /* Carrousel d'avis : boutons + défilement auto (pause au survol / focus, coupé si mouvement réduit) */
  var car = $('#carousel');
  function step(dir) { var card = $('.review', car); var w = card ? card.getBoundingClientRect().width + 16 : 300; var max = car.scrollWidth - car.clientWidth - 4; var to = car.scrollLeft + dir * w; if (to > max + w / 2) to = 0; if (to < -w / 2) to = max; car.scrollTo({ left: to, behavior: reduce ? 'auto' : 'smooth' }); }
  $('#prev').addEventListener('click', function () { step(-1); });
  $('#next').addEventListener('click', function () { step(1); });
  if (!reduce) {
    var paused = false, timer = setInterval(function () { if (!paused && !document.hidden) step(1); }, 6000);
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (t) { car.addEventListener(t, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (t) { car.addEventListener(t, function () { paused = false; }); });
  }

  /* Formulaire de devis en 3 étapes (démo : rien n'est envoyé) */
  var form = $('#qform'), stepN = 1, err = $('#qerr');
  function show(n) {
    stepN = n;
    $$('.qstep', form).forEach(function (f) { f.hidden = +f.dataset.step !== n; });
    $('#qbar').style.transform = 'scaleX(' + (n / 3) + ')';
    $('#qcount').textContent = 'Étape ' + n + ' sur 3';
    $('#qback').hidden = n === 1; $('#qnext').hidden = n === 3; $('#qsend').hidden = n !== 3; err.textContent = '';
  }
  function valid(n) {
    if (n === 1 && !$('input[name="lieu"]:checked', form)) return 'Choisissez le type de lieu.';
    if (n === 2 && !$('input[name="surface"]:checked', form)) return 'Indiquez la surface approximative.';
    if (n === 2 && !$('input[name="frequence"]:checked', form)) return 'Indiquez la fréquence souhaitée.';
    if (n === 3) {
      var nom = form.nom, mail = form.email, ok = true;
      [nom, mail].forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (!nom.value.trim()) { nom.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!/^\S+@\S+\.\S+$/.test(mail.value)) { mail.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!ok) return 'Indiquez votre nom et un email valide.';
    }
    return '';
  }
  $('#qnext').addEventListener('click', function () { var m = valid(stepN); if (m) { err.textContent = m; return; } show(stepN + 1); var l = $('.qstep:not([hidden]) legend', form); if (l) { l.tabIndex = -1; l.focus(); } });
  $('#qback').addEventListener('click', function () { show(stepN - 1); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var m = valid(3); if (m) { err.textContent = m; return; }
    $$('.qstep, .qactions, .qcount, .qprog', form).forEach(function (el) { el.hidden = true; }); err.textContent = '';
    var d = $('#qdone'); d.hidden = false; d.focus();
  });
  $('#qreset').addEventListener('click', function () { form.reset(); $$('.qactions, .qcount, .qprog', form).forEach(function (el) { el.hidden = false; }); $('#qdone').hidden = true; show(1); });
  /* « Demander un devis » depuis une carte service : pré-coche le lieu */
  $$('[data-lieu]').forEach(function (a) { a.addEventListener('click', function () { var r = $$('input[name="lieu"]', form)[Math.min(+a.dataset.lieu, S.devis.lieux.length - 1)]; if (r) r.checked = true; }); });

  /* Bulles de savon (canvas) : discrètes, pause hors écran et onglet masqué */
  (function bubbles() {
    var cv = $('#bubbles'), hero = $('.hero'); if (reduce || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W, H, dpr, pts = [], raf = 0, vis = true;
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function mk(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 30, r: 6 + Math.random() * 22, v: .15 + Math.random() * .35, ph: Math.random() * 6.3, a: .25 + Math.random() * .35 }; }
    function color() { return getComputedStyle(root).getPropertyValue('--accent').trim() || '#19C3B5'; }
    var col = color(); document.addEventListener('palettechange', function () { col = color(); });
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.y -= p.v; var x = p.x + Math.sin(t / 1600 + p.ph) * 10;
        if (p.y < -40) { pts[i] = mk(false); continue; }
        ctx.globalAlpha = p.a; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = p.a * .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - p.r * .35, p.y - p.r * .35, p.r * .18, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf && vis && !document.hidden) raf = requestAnimationFrame(frame); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    size(); for (var i = 0; i < 22; i++) pts.push(mk(true));
    addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; vis ? run() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : run(); });
    run();
  })();
})();
