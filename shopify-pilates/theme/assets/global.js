/* Comportements communs : menu mobile, sélecteurs de quantité, mise à jour du panier.
   JavaScript natif, sans dépendance. Le site reste utilisable sans JavaScript. */
(function () {
  'use strict';

  // Menu mobile : fermer avec Échap, bloquer le défilement de la page quand il est ouvert
  var drawer = document.querySelector('[data-header-drawer]');
  if (drawer) {
    var summary = drawer.querySelector('summary');
    drawer.addEventListener('toggle', function () {
      document.body.style.overflow = drawer.open ? 'hidden' : '';
      summary.setAttribute('aria-expanded', drawer.open ? 'true' : 'false');
    });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) drawer.open = false;
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.open) {
        drawer.open = false;
        drawer.querySelector('summary').focus();
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) {
      if (mq.matches) drawer.open = false;
    });
  }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inEditor = window.Shopify && window.Shopify.designMode;
  var motionOk = root.classList.contains('motion-ok');

  // En-tête : se cache en descendant, réapparaît en remontant
  var header = document.querySelector('.header--sticky[data-header]');
  if (header) {
    var lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var menuOpen = drawer && drawer.open;
        header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 160);
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // Vidéos : chargées seulement à l'approche de l'écran, mises en pause hors écran
  var lazyVideos = document.querySelectorAll('video[data-lazy-video]');
  if (lazyVideos.length && 'IntersectionObserver' in window) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          if (!video.dataset.loaded) {
            video.querySelectorAll('source[data-src]').forEach(function (source) { source.src = source.dataset.src; });
            video.load();
            video.dataset.loaded = '1';
          }
          if (!reduceMotion) {
            var playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          }
        } else if (video.dataset.loaded) {
          video.pause();
        }
      });
    }, { rootMargin: '300px 0px' });
    lazyVideos.forEach(function (video) { videoObserver.observe(video); });
  }

  // Nom géant du pied de page : révélation lettre par lettre
  var giant = document.querySelector('[data-giant-word]');
  if (giant) {
    if (motionOk && 'IntersectionObserver' in window) {
      var giantObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          giant.classList.add('is-in');
          giantObserver.disconnect();
        }
      }, { threshold: 0.35 });
      giantObserver.observe(giant);
    } else {
      giant.classList.add('is-in');
    }
  }

  // Ambiance sonore : jamais automatique, activée et coupée par le visiteur
  var soundButton = document.querySelector('[data-sound-toggle]');
  var sound = document.querySelector('audio[data-sound]');
  if (soundButton && sound) {
    sound.volume = 0.35;
    soundButton.addEventListener('click', function () {
      var on = soundButton.getAttribute('aria-pressed') !== 'true';
      if (on) {
        var p = sound.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        sound.pause();
      }
      soundButton.setAttribute('aria-pressed', on ? 'true' : 'false');
      soundButton.querySelector('[data-sound-label]').textContent = soundButton.getAttribute(on ? 'data-label-on' : 'data-label-off');
    });
  }

  // Curseur personnalisé : option, ordinateur uniquement (jamais sur écran tactile)
  var cursor = document.querySelector('[data-cursor]');
  if (cursor && motionOk && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    root.classList.add('cursor-on');
    var cx = 0, cy = 0, hover = false;
    var place = function () { cursor.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)' + (hover ? ' scale(3.2)' : ''); };
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; place(); }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      hover = !!e.target.closest('a, button, summary, input, select, [data-magnetic]');
      place();
    });
  }

  // Apparition douce des sections situées sous l'écran (pages sans animations avancées)
  if (motionOk && !root.classList.contains('motion-advanced') && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-done');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.main-content > .shopify-section').forEach(function (section) {
      if (section.getBoundingClientRect().top > window.innerHeight) {
        section.classList.add('reveal-pending');
        revealObserver.observe(section);
      }
    });
  }

  // Boutons + / − des champs quantité
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-quantity-minus], [data-quantity-plus]');
    if (!button) return;
    var wrapper = button.closest('[data-quantity]');
    var input = wrapper && wrapper.querySelector('[data-quantity-input]');
    if (!input) return;
    var min = parseInt(input.min, 10);
    if (isNaN(min)) min = 0;
    var value = parseInt(input.value, 10) || 0;
    value = button.hasAttribute('data-quantity-plus') ? value + 1 : Math.max(min, value - 1);
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Panier : envoi automatique quand une quantité change
  var cartForm = document.querySelector('[data-cart-form]');
  if (cartForm) {
    var timer;
    cartForm.addEventListener('change', function (event) {
      if (!event.target.matches('[data-cart-autoupdate]')) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var update = cartForm.querySelector('[data-cart-update]');
        if (update) {
          cartForm.requestSubmit ? cartForm.requestSubmit(update) : update.click();
        }
      }, 600);
    });
  }

  // Fermer les menus déroulants (filtres) quand on clique ailleurs
  document.addEventListener('click', function (event) {
    document.querySelectorAll('details[data-facet][open]').forEach(function (details) {
      if (!details.contains(event.target)) details.open = false;
    });
  });
})();
