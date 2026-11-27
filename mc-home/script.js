/* MC Home — menu mobile + calculateur de coût après crédit d'impôt */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Fermer" : "Menu";
    });
  }

  /* ---------- Calculateur ----------
     Règles (service-public.gouv.fr, fiche F12) :
     - crédit d'impôt = 50 % des dépenses ;
     - plafond de base : 12 000 € de dépenses par an et par foyer
       (+1 500 € par enfant à charge ou membre du foyer de plus de 65 ans,
       maximum 15 000 € ; 20 000 € en cas d'invalidité).
     On applique le plafond de base pour ne jamais promettre trop. */
  var PLAFOND = 12000;
  var SEMAINES_PAR_MOIS = 52 / 12;
  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  function run(calc) {
    var service = calc.querySelector("[data-calc-service]");
    var hours = calc.querySelector("[data-calc-hours]");
    var out = {
      brut: calc.querySelector("[data-calc-brut]"),
      credit: calc.querySelector("[data-calc-credit]"),
      net: calc.querySelector("[data-calc-net]"),
      warn: calc.querySelector("[data-calc-warn]")
    };

    function update() {
      var rate = parseFloat(service.value) || 0;
      var h = parseFloat(String(hours.value).replace(",", ".")) || 0;
      if (h < 0) h = 0;
      if (h > 60) h = 60;
      var mensuel = h * SEMAINES_PAR_MOIS * rate;
      var annuel = mensuel * 12;
      var creditAnnuel = Math.min(annuel, PLAFOND) * 0.5;
      var creditMensuel = creditAnnuel / 12;
      out.brut.textContent = euro.format(mensuel);
      out.credit.textContent = "− " + euro.format(creditMensuel);
      out.net.textContent = euro.format(mensuel - creditMensuel);
      out.warn.hidden = annuel <= PLAFOND;
    }

    service.addEventListener("change", update);
    hours.addEventListener("input", update);
    update();
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-calc]"), run);
})();
