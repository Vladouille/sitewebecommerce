/* =========================================================================
   NETT SERVICES : interactions et animations
   1) Le socle (menu, header, formulaire, rideau, carte) fonctionne SANS librairie.
   2) Les animations GSAP / ScrollTrigger / Lenis s'ajoutent seulement si le CDN
      a chargé. Sinon, tout le contenu reste visible : aucun élément n'est masqué
      par défaut dans le CSS.
   3) prefers-reduced-motion : pas de Lenis, pas de curseur, pas de parallaxe,
      pas d'animation.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desktop = window.matchMedia('(min-width: 900px)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var cssVar = function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); };
  var secs = function (name, fallback) { var v = parseFloat(cssVar(name)); return isNaN(v) ? fallback : v; };

  /* ===== 0. Adresses propres en production (/bureaux au lieu de bureaux.html) =====
     Uniquement sur le vrai domaine : en local ou par double-clic, les liens .html restent. */
  var cleanHost = root.getAttribute('data-domaine');
  if (cleanHost && location.hostname.replace(/^www\./, '') === cleanHost) {
    $$('a[href$=".html"], a[href*=".html#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^(https?:)?\/\//.test(href)) return;
      a.setAttribute('href', '/' + href.replace(/^\.?\//, '').replace(/^index\.html/, '').replace(/\.html/, ''));
    });
  }

  /* ===== 1. Header : se cache en descendant, réapparaît en remontant ===== */
  var header = $('.header');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (!root.classList.contains('menu-open')) {
      if (y > lastY + 4 && y > 160) header.classList.add('is-hidden');
      else if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Un élément qui reçoit le focus clavier ne doit jamais être caché sous le header
  document.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });

  /* ===== 2. Menu plein écran ===== */
  var burger = $('.burger');
  var menu = $('#menu');
  var lenis = null;
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    $('.burger__label', burger).textContent = open ? 'Fermer' : 'Menu';
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    if ('inert' in menu) menu.inert = !open;
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    root.style.overflow = open ? 'hidden' : '';
    if (open) window.setTimeout(function () { var f = $('a', menu); if (f) f.focus({ preventScroll: true }); }, 60);
  }
  if (burger && menu) {
    if ('inert' in menu) menu.inert = true;
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.hash && a.pathname === location.pathname) setMenu(false); }); });
  }

  /* ===== 3. Rideau aqua entre les pages ===== */
  var rideau = $('.rideau');
  function rideauSortie() {
    if (!rideau || !root.classList.contains('rideau-entree')) return;
    requestAnimationFrame(function () {
      rideau.classList.add('is-out');
      root.classList.remove('rideau-entree');
      window.setTimeout(function () { rideau.classList.remove('is-out'); }, secs('--dur-rideau', .55) * 1000 + 50);
    });
  }
  rideauSortie();
  window.addEventListener('pageshow', function (e) { if (e.persisted && rideau) { rideau.classList.remove('is-in'); } });
  if (rideau && !reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      var sameDoc = url.pathname === location.pathname && url.search === location.search;
      if (url.origin !== location.origin || sameDoc || /^(mailto|tel):/.test(a.href)) return;
      e.preventDefault();
      try { sessionStorage.setItem('ns-rideau', '1'); } catch (err) { /* stockage indisponible : pas grave */ }
      rideau.classList.add('is-in');
      window.setTimeout(function () { location.href = a.href; }, secs('--dur-rideau', .55) * 1000);
    });
  }

  /* ===== 4. Ancres internes (avec ou sans Lenis) ===== */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) setMenu(false);
    var offset = -(header.offsetHeight + 16);
    if (lenis) lenis.scrollTo(target, { offset: offset });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', url.hash);
  });

  /* ===== 5. Carte Google Maps : chargée seulement au clic (aucun cookie Google avant) ===== */
  $$('[data-gmaps]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.className = 'carte__iframe';
      iframe.title = 'Carte Google Maps : NETT SERVICES, 17 rue Pixerécourt, 75020 Paris';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent('NETT SERVICES, 17 Rue Pixerécourt, 75020 Paris') + '&output=embed';
      btn.replaceWith(iframe);
    });
  });

  /* ===== 6. Formulaire de devis en 3 étapes ===== */
  $$('form[data-devis]').forEach(initDevis);
  function initDevis(form) {
    var steps = $$('.step', form);
    var fill = $('.progress__fill', form);
    var labels = $$('.progress__labels span', form);
    var status = $('.form__status', form);
    var prev = $('[data-prev]', form);
    var next = $('[data-next]', form);
    var submit = $('[type="submit"]', form);
    var current = 0;
    form.classList.add('js-steps');

    function show(i) {
      current = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      if (fill) fill.style.transform = 'scaleX(' + ((i + 1) / steps.length) + ')';
      labels.forEach(function (l, k) { l.classList.toggle('is-active', k <= i); });
      prev.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      submit.hidden = i !== steps.length - 1;
    }
    function err(el, msg) {
      var box = el.closest('.field, .step-choices, .consent') || el.parentNode;
      var id = (el.name || el.id) + '-erreur';
      var old = document.getElementById(id);
      if (old) old.remove();
      var group = el.type === 'radio' ? $$('input[name="' + el.name + '"]', form) : [el];
      group.forEach(function (g) {
        if (msg) { g.setAttribute('aria-invalid', 'true'); g.setAttribute('aria-describedby', id); }
        else { g.removeAttribute('aria-invalid'); g.removeAttribute('aria-describedby'); }
      });
      if (!msg) return true;
      var p = document.createElement('p'); p.className = 'erreur'; p.id = id; p.textContent = msg;
      box.appendChild(p);
      return false;
    }
    function validStep(i) {
      var ok = true, first = null;
      $$('input, textarea, select', steps[i]).forEach(function (el) {
        if (el.type === 'radio') {
          if (!el.required || el !== $('input[name="' + el.name + '"]', steps[i])) return;
          var checked = $('input[name="' + el.name + '"]:checked', form);
          if (!err(el, checked ? '' : 'Choisissez une option.')) { ok = false; first = first || el; }
          return;
        }
        if (el.type === 'checkbox') {
          if (el.required && !err(el, el.checked ? '' : 'Votre accord est nécessaire pour traiter la demande.')) { ok = false; first = first || el; }
          return;
        }
        if (el.type === 'file' && el.files && el.files[0] && el.files[0].size > 10 * 1024 * 1024) {
          if (!err(el, 'Fichier trop lourd (10 Mo maximum).')) { ok = false; first = first || el; }
          return;
        }
        var v = (el.value || '').trim();
        var msg = '';
        if (el.required && !v) msg = 'Ce champ est obligatoire.';
        else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Adresse email invalide.';
        else if (v && el.type === 'tel' && v.replace(/[^\d+]/g, '').length < 10) msg = 'Numéro de téléphone invalide.';
        if (el.type !== 'hidden' && el.name !== '_gotcha' && !err(el, msg)) { ok = false; first = first || el; }
      });
      if (first) first.focus();
      return ok;
    }
    next.addEventListener('click', function () { if (validStep(current)) { show(current + 1); steps[current].querySelector('input, textarea, select').focus(); } });
    prev.addEventListener('click', function () { show(current - 1); });
    show(0);

    function val(n) { var el = form.elements[n]; if (!el) return ''; if (el.length && el[0] && el[0].type === 'radio') { var c = $('input[name="' + n + '"]:checked', form); return c ? c.value : ''; } return (el.value || '').trim(); }
    function mailto() {
      var to = form.getAttribute('data-email');
      var body = ['Type de locaux : ' + val('type_locaux'), 'Fréquence : ' + val('frequence'), '',
        'Nom : ' + val('nom') + ' ' + val('prenom'), 'Email : ' + val('email'), 'Téléphone : ' + val('telephone'),
        "Adresse d'intervention : " + val('adresse'), '', val('message')].join('\n');
      return 'mailto:' + to + '?subject=' + encodeURIComponent('Demande de devis – ' + val('type_locaux')) + '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validStep(current)) return;
      if (form.elements._gotcha && form.elements._gotcha.value) return;
      var action = form.getAttribute('action');
      // Endpoint Formspree pas encore configuré : repli sur l'email pré-rempli
      if (action.indexOf('VOTRE_ID') !== -1) {
        location.href = mailto();
        status.className = 'form__status is-ok';
        status.textContent = 'Votre messagerie s\'ouvre avec la demande pré-remplie' +
          (val('fichier') ? ' (pensez à y joindre votre fichier)' : '') + '. Vous pouvez aussi appeler le 01 43 66 18 32.';
        return;
      }
      submit.disabled = true;
      status.className = 'form__status'; status.textContent = 'Envoi en cours…';
      fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); show(0); status.className = 'form__status is-ok'; status.textContent = 'Merci, votre demande est bien envoyée. Nous revenons vers vous rapidement.'; })
        .catch(function () { status.className = 'form__status is-error'; status.textContent = 'L\'envoi n\'a pas abouti. Appelez-nous au 01 43 66 18 32.'; })
        .then(function () { submit.disabled = false; });
    });
  }

  /* ===== 7. Curseur personnalisé (souris uniquement) ===== */
  if (fine && !reduce) {
    var cursor = document.createElement('div');
    cursor.className = 'cursor'; cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="cursor__dot"></div>';
    document.body.appendChild(cursor);
    root.classList.add('has-cursor');
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-link', !!e.target.closest('a, button, label, [role="button"]'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-visible'); });
  }

  /* ===== 8. Boutons magnétiques (souris uniquement) ===== */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ===== 9. Animations GSAP (seulement si le CDN a chargé) ===== */
  function initAnimations() {
    root.classList.remove('anim-attente');
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    var mobile = !desktop.matches;
    var ease = 'expo.out';
    var dReveal = secs('--dur-revelation', .9), dSlow = secs('--dur-lente', 1.1);
    var stagChars = secs('--decalage-lettres', .035), stagEls = secs('--decalage-elements', .08);
    var par = secs('--parallaxe', 8);

    // --- Lenis : défilement fluide (souris uniquement, jamais en mouvement réduit)
    if (window.Lenis && fine) {
      lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // --- Hero : titre révélé lettre par lettre
    $$('[data-split]').forEach(function (line) {
      var text = line.textContent;
      line.setAttribute('aria-hidden', 'true');
      line.innerHTML = '';
      Array.prototype.forEach.call(text, function (ch) {
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? ' ' : ch;
        line.appendChild(s);
      });
    });
    var chars = $$('.hero__line .char');
    if (chars.length) {
      gsap.from(chars, { yPercent: 115, opacity: 0, duration: dSlow, ease: ease, stagger: stagChars, delay: 0.1 });
      gsap.from('.hero__kicker, .hero__text > *, .hero__sticker', { y: 24, opacity: 0, duration: dReveal, ease: ease, stagger: stagEls, delay: 0.45 });
    }

    // --- Masque qui s'ouvre sur l'image du hero et des pages services
    $$('[data-reveal-mask]').forEach(function (m, k) {
      var volets = $$('.masque__volet', m);
      var img = $('img', m);
      volets.forEach(function (v) { v.style.display = 'block'; });
      var tl = gsap.timeline({ delay: k === 0 ? 0.35 : 0, scrollTrigger: k === 0 ? null : { trigger: m, start: 'top 85%' } });
      tl.to(volets[0], { xPercent: -101, duration: dSlow, ease: 'expo.inOut' }, 0)
        .to(volets[1], { xPercent: 101, duration: dSlow, ease: 'expo.inOut' }, 0)
        .from(img, { scale: 1.35, duration: dSlow * 1.4, ease: ease }, 0.1);
    });

    // --- Images : zoom arrière à l'entrée + parallaxe interne (desktop)
    $$('[data-parallax] img').forEach(function (img) {
      if (img.closest('[data-reveal-mask]')) return;
      gsap.fromTo(img, { scale: 1.3 }, { scale: mobile ? 1 : 1.12, duration: dSlow * 1.3, ease: ease, scrollTrigger: { trigger: img, start: 'top 90%' } });
      if (!mobile) {
        gsap.fromTo(img, { yPercent: -par / 2 }, { yPercent: par / 2, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });

    // --- Apparitions génériques en cascade
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: mobile ? 24 : 48, opacity: 0, duration: dReveal, ease: ease, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-stagger]').forEach(function (group) {
      gsap.from(group.children, { y: mobile ? 20 : 40, opacity: 0, duration: dReveal, ease: ease, stagger: stagEls, scrollTrigger: { trigger: group, start: 'top 85%' } });
    });

    // --- Cartes empilées : la carte du dessous recule quand la suivante arrive (desktop uniquement)
    if (!mobile) {
      var poles = $$('.poles--stack .pole');
      poles.forEach(function (card, i) {
        if (i === poles.length - 1) return;
        // la carte reste opaque (sinon son contenu transparaît) : on assombrit un voile posé dessus
        var st = { trigger: poles[i + 1], start: 'top bottom', end: 'top ' + (parseFloat(getComputedStyle(poles[i + 1]).top) || 100) + 'px', scrub: true };
        gsap.to(card, { scale: 0.92 + i * 0.02, ease: 'none', scrollTrigger: st });
        var voile = $('.pole__voile', card);
        if (voile) gsap.to(voile, { opacity: 0.35, ease: 'none', scrollTrigger: Object.assign({}, st) });
      });
    }

    // --- Icônes des atouts : tracé animé (stroke-dashoffset)
    $$('.bento__icon').forEach(function (svg) {
      var paths = $$('path, circle, rect, polyline, line', svg);
      paths.forEach(function (p) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; });
      gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dSlow * 1.6, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: { trigger: svg, start: 'top 85%' } });
    });

    // --- Manifeste : chaque mot passe de flou/gris à net, au fil du scroll
    var mots = $$('.manifeste .mot');
    if (mots.length) {
      var sales = mots.map(function (m) { return $('.mot__sale', m); });
      var propres = mots.map(function (m) { return $('.mot__propre', m); });
      gsap.set(sales, { opacity: 1 });
      gsap.set(propres, { opacity: 0 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: '.manifeste__text', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 } });
      mots.forEach(function (m, i) {
        tl.to(sales[i], { opacity: 0, duration: 1, ease: 'none' }, i * 0.5)
          .to(propres[i], { opacity: 1, duration: 1, ease: 'none' }, i * 0.5);
      });
    }

    // --- Carte : les quartiers s'allument un par un
    var zones = $$('.carte [data-zone]');
    if (zones.length) {
      gsap.from(zones, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: dReveal, ease: 'back.out(1.6)', stagger: 0.18, scrollTrigger: { trigger: '.carte', start: 'top 75%' } });
    }

    // --- Pied de page : le nom géant monte
    var geant = $('.footer__geant');
    if (geant) gsap.from(geant, { yPercent: 40, opacity: 0, duration: dSlow * 1.2, ease: ease, scrollTrigger: { trigger: geant, start: 'top bottom' } });

    window.addEventListener('load', function () { ST.refresh(); });
  }
  // Ce fichier est chargé AVANT les librairies (toutes en defer) : on attend DOMContentLoaded,
  // qui ne se déclenche qu'une fois GSAP, ScrollTrigger et Lenis exécutés (ou en échec).
  if (document.readyState === 'complete') initAnimations();
  else document.addEventListener('DOMContentLoaded', initAnimations);
})();
