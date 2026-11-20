/* Comportements communs : menu mobile, sélecteurs de quantité, mise à jour du panier.
   JavaScript natif, sans dépendance. Le site reste utilisable sans JavaScript. */
(function () {
  'use strict';

  // Menu mobile : fermer avec Échap, bloquer le défilement de la page quand il est ouvert
  var drawer = document.querySelector('[data-header-drawer]');
  if (drawer) {
    drawer.addEventListener('toggle', function () {
      document.body.style.overflow = drawer.open ? 'hidden' : '';
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
