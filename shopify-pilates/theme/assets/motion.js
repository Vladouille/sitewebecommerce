/* Ressaline — motion design de la page d'accueil.
   Bibliothèques hébergées dans le thème : GSAP, ScrollTrigger, SplitText (licence GSAP « Standard »,
   gratuite, usage commercial autorisé) et Lenis (licence MIT).
   Chargé seulement sur l'accueil, et actif seulement si le <head> a ajouté « motion-advanced » :
   jamais avec « moins de mouvement », jamais dans l'éditeur de thème.
   Toutes les animations n'utilisent que transform et opacity. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('motion-advanced')) return;
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('motion-ok', 'motion-advanced');
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var introDelay = root.classList.contains('has-loader') ? 1.05 : 0.1;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------------------------------------------------------------
     Défilement fluide (Lenis), synchronisé avec ScrollTrigger
     --------------------------------------------------------------------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    var drawer = document.querySelector('[data-header-drawer]');
    if (drawer) {
      drawer.addEventListener('toggle', function () {
        if (drawer.open) lenis.stop();
        else lenis.start();
      });
    }
  }

  /* ---------------------------------------------------------------------
     Titres : apparition ligne par ligne, chaque ligne glisse hors d'un masque
     --------------------------------------------------------------------- */
  var titles = document.querySelectorAll('[data-split]');
  titles.forEach(function (el) {
    var inHero = !!el.closest('[data-hero]');
    if (!window.SplitText) {
      gsap.from(el, { opacity: 0, y: 30, duration: 1, ease: 'expo.out', delay: inHero ? introDelay : 0,
        scrollTrigger: inHero ? null : { trigger: el, start: 'top 85%' } });
      return;
    }
    window.SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          delay: inHero ? introDelay : 0,
          scrollTrigger: inHero ? null : { trigger: el, start: 'top 85%', once: true }
        });
      }
    });
  });
  root.classList.add('motion-ready');

  /* ---------------------------------------------------------------------
     Hero : léger zoom arrière du média, rotation douce du modèle 3D au défilement
     --------------------------------------------------------------------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var heroMedia = hero.querySelector('[data-hero-media]');
    if (heroMedia) {
      gsap.fromTo(heroMedia, { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'expo.out', delay: introDelay - 0.1 });
      gsap.to(heroMedia, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    var heroContent = hero.querySelectorAll('.hero__eyebrow, .hero__bottom, .hero__note');
    gsap.from(heroContent, { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.08, delay: introDelay + 0.35 });

    var model = hero.querySelector('[data-hero-model] model-viewer');
    if (model) {
      ScrollTrigger.create({
        trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
        onUpdate: function (self) {
          model.setAttribute('camera-orbit', (-25 + self.progress * 110).toFixed(1) + 'deg 78deg auto');
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Images : révélation par un cadre qui glisse, et léger zoom arrière
     (même effet qu'une découpe, mais uniquement avec transform)
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-reveal-media]').forEach(function (frame) {
    var inner = frame.querySelector('[data-reveal-inner]') || frame.firstElementChild;
    var img = frame.querySelector('img, video');
    var tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } });
    if (inner) tl.from(inner, { yPercent: 101, duration: 1.3, ease: 'expo.out' }, 0);
    if (img) tl.from(img, { scale: 1.25, duration: 1.8, ease: 'expo.out' }, 0);
  });

  /* ---------------------------------------------------------------------
     LA GAMME : section épinglée sur ordinateur, chaque machine glisse
     sur la précédente avec sa couleur d'ambiance ; défilement simple sur mobile
     --------------------------------------------------------------------- */
  var mm = gsap.matchMedia();
  document.querySelectorAll('[data-range]').forEach(function (range) {
    var stage = range.querySelector('[data-range-stage]');
    var slides = Array.prototype.slice.call(range.querySelectorAll('[data-range-slide]'));
    var counter = range.querySelector('[data-range-current]');
    var progress = range.querySelector('[data-range-progress]');
    var n = slides.length;
    if (!n) return;

    mm.add('(min-width: 990px)', function () {
      if (n < 2) return;
      range.classList.add('range--pinned');
      slides.forEach(function (slide, i) { slide.style.zIndex = i + 1; });
      gsap.set(slides.slice(1), { yPercent: 100 });
      gsap.set(slides.slice(1).map(function (s) { return s.querySelector('[data-range-media]'); }), { scale: 1.15 });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=' + (n - 1) * 100 + '%',
          pin: true,
          scrub: 0.7,
          snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
          onUpdate: function (self) {
            var idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            if (counter) counter.textContent = pad(idx + 1);
            if (progress) progress.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')';
          }
        }
      });
      for (var i = 1; i < n; i++) {
        tl.to(slides[i], { yPercent: 0 }, i - 1)
          .to(slides[i].querySelector('[data-range-media]'), { scale: 1 }, i - 1)
          .to(slides[i - 1].querySelector('[data-range-content]'), { opacity: 0, yPercent: -10 }, i - 1);
      }

      // Clavier : amener à l'écran la machine qui reçoit le focus
      var onFocus = function (event) {
        var slide = event.target.closest('[data-range-slide]');
        if (!slide) return;
        var st = tl.scrollTrigger;
        var target = st.start + (st.end - st.start) * (slides.indexOf(slide) / (n - 1));
        if (lenis) lenis.scrollTo(target, { immediate: true });
        else window.scrollTo(0, target);
      };
      stage.addEventListener('focusin', onFocus);

      return function () {
        stage.removeEventListener('focusin', onFocus);
        range.classList.remove('range--pinned');
        gsap.set(slides, { clearProps: 'zIndex' });
      };
    });

    mm.add('(max-width: 989px)', function () {
      slides.forEach(function (slide) {
        var content = slide.querySelector('[data-range-content]');
        var media = slide.querySelector('[data-range-media]');
        gsap.from(content, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: slide, start: 'top 70%', once: true } });
        if (media) gsap.fromTo(media, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: slide, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  });

  /* ---------------------------------------------------------------------
     AVANT / AVEC : la rature se trace quand la ligne arrive à l'écran
     --------------------------------------------------------------------- */
  document.querySelectorAll('[data-strike-item]').forEach(function (item) {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 82%',
      once: true,
      onEnter: function () { item.classList.add('is-struck'); }
    });
  });

  /* ---------------------------------------------------------------------
     Apparition douce des autres blocs de section
     --------------------------------------------------------------------- */
  document.querySelectorAll('.section-text, .calculator__form, .accordion-group, .guarantee__content .check-list, .contact-cta__actions').forEach(function (el) {
    gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------------------------------------------------------------------
     Boutons magnétiques (ordinateur uniquement)
     --------------------------------------------------------------------- */
  if (finePointer) {
    document.querySelectorAll('[data-magnetic], .button--buy').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        gsap.to(btn, { x: x, y: y, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* Recalcule les positions quand les polices et les images sont prêtes */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
