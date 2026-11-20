/* Fiche produit : galerie, choix de la variante, mise en évidence du palier de remise.
   JavaScript natif, sans dépendance. */
(function () {
  'use strict';

  document.querySelectorAll('[data-product-section]').forEach(function (section) {
    initGallery(section);
    initVariants(section);
    initTiers(section);
  });

  function initGallery(section) {
    var track = section.querySelector('[data-gallery-track]');
    if (!track) return;
    var items = Array.prototype.slice.call(track.querySelectorAll('[data-gallery-item]'));
    var thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-gallery-thumb]'));
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setActive(index) {
      thumbs.forEach(function (thumb, i) {
        var active = i === index;
        thumb.classList.toggle('is-active', active);
        if (active) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
    }

    function goTo(index) {
      var item = items[index];
      if (!item) return;
      track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      setActive(index);
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        goTo(parseInt(thumb.getAttribute('data-gallery-thumb'), 10));
      });
    });

    if ('IntersectionObserver' in window && thumbs.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(items.indexOf(entry.target));
        });
      }, { root: track, threshold: 0.6 });
      items.forEach(function (item) { observer.observe(item); });
    }

    section.galleryGoToMedia = function (mediaId) {
      var index = items.findIndex(function (item) {
        return item.getAttribute('data-media-id') === String(mediaId);
      });
      if (index > -1) goTo(index);
    };
  }

  function initVariants(section) {
    var jsonEl = section.querySelector('[data-product-json]');
    var selects = section.querySelectorAll('[data-option-index]');
    if (!jsonEl || !selects.length) return;
    var data = JSON.parse(jsonEl.textContent);
    var idInput = section.querySelector('[data-variant-id]');
    var addButton = section.querySelector('[data-add-button]');

    function onChange() {
      var selected = Array.prototype.map.call(selects, function (select) { return select.value; });
      var variant = data.variants.find(function (v) {
        return v.options.every(function (option, i) { return option === selected[i]; });
      });

      if (!variant) {
        if (addButton) {
          addButton.disabled = true;
          addButton.textContent = addButton.getAttribute('data-label-soldout');
        }
        return;
      }

      if (idInput) idInput.value = variant.id;

      section.querySelectorAll('.product__price [data-price-ttc]').forEach(function (el) { el.textContent = variant.ttc; });
      section.querySelectorAll('.product__price [data-price-ht]').forEach(function (el) { el.textContent = variant.ht; });

      var tierHt = section.querySelectorAll('[data-tier-ht]');
      var tierTtc = section.querySelectorAll('[data-tier-ttc]');
      (variant.tiers || []).forEach(function (tier, i) {
        if (tierHt[i]) tierHt[i].textContent = tier.ht;
        if (tierTtc[i]) tierTtc[i].textContent = tier.ttc;
      });

      if (addButton) {
        addButton.disabled = !variant.available;
        addButton.textContent = addButton.getAttribute(variant.available ? 'data-label-add' : 'data-label-soldout');
      }

      if (variant.media_id && section.galleryGoToMedia) section.galleryGoToMedia(variant.media_id);

      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    selects.forEach(function (select) { select.addEventListener('change', onChange); });
  }

  function initTiers(section) {
    var rows = section.querySelectorAll('[data-tier-min]');
    var input = section.querySelector('[data-quantity-input]');
    if (!rows.length || !input) return;

    function highlight() {
      var qty = parseInt(input.value, 10) || 1;
      rows.forEach(function (row) {
        var min = parseInt(row.getAttribute('data-tier-min'), 10);
        var maxAttr = row.getAttribute('data-tier-max');
        var max = maxAttr ? parseInt(maxAttr, 10) : Infinity;
        row.classList.toggle('is-active', qty >= min && qty <= max);
      });
    }

    input.addEventListener('change', highlight);
    input.addEventListener('input', highlight);
    highlight();
  }
})();
