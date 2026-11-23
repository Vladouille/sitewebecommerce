/* Filtres et tri de collection : envoi automatique du formulaire quand un choix change.
   Sans JavaScript, le bouton « Appliquer » reste visible et fait le même travail. */
(function () {
  'use strict';

  document.querySelectorAll('[data-facets-form]').forEach(function (form) {
    var timer;

    function submit() {
      var params = new URLSearchParams(new FormData(form));
      // Retire les champs de prix vides pour garder une adresse propre
      Array.from(params.keys()).forEach(function (key) {
        if (params.get(key) === '') params.delete(key);
      });
      window.location.search = params.toString();
    }

    form.addEventListener('change', function (event) {
      clearTimeout(timer);
      var delay = event.target.type === 'number' ? 800 : 0;
      timer = setTimeout(submit, delay);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submit();
    });
  });
})();
