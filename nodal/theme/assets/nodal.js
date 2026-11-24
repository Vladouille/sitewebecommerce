/* NODAL — comportements globaux (accueil, fiche, panier). Pas de dépendance. */
(() => {
  'use strict';

  /* ---------- Date de livraison estimée ----------
     <span data-nd-eta data-fab="5" data-min="2" data-max="3"></span>
     Jours ouvrés : du lundi au vendredi. Les jours fériés ne sont pas
     comptés : l'affichage reste une estimation (« entre le … et le … »). */
  const addBusinessDays = (date, n) => {
    const d = new Date(date);
    let left = n;
    while (left > 0) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) left--;
    }
    return d;
  };
  const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const renderEta = (root = document) => {
    root.querySelectorAll('[data-nd-eta]').forEach((el) => {
      const fab = +el.dataset.fab || 0, min = +el.dataset.min || 0, max = +el.dataset.max || min;
      const now = new Date();
      const from = addBusinessDays(now, fab + min);
      const to = addBusinessDays(now, fab + max);
      el.dataset.ndDone = '1';
      el.textContent = from.getTime() === to.getTime()
        ? `le ${fmt.format(from)}`
        : `entre le ${fmt.format(from)} et le ${fmt.format(to)}`;
    });
  };
  window.NODAL = Object.assign(window.NODAL || {}, { renderEta, addBusinessDays });

  /* ---------- Avant / après ---------- */
  const initBeforeAfter = (root = document) => {
    root.querySelectorAll('.nd-ba').forEach((b) => {
      if (b.dataset.ready) return;
      b.dataset.ready = '1';
      const i = b.querySelector('input[type=range]');
      if (!i) return;
      const set = () => b.style.setProperty('--pos', i.value + '%');
      i.addEventListener('input', set);
      set();
    });
  };

  /* ---------- Barre « Composer mon rail » collante (mobile) ---------- */
  const initSticky = () => {
    const bar = document.querySelector('[data-nd-sticky]');
    const hero = document.querySelector('.nd-hero');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;
    const link = bar.querySelector('a');
    let pastHero = false;
    const hidden = new Set();
    const update = () => {
      const on = pastHero && hidden.size === 0;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      if (link) link.tabIndex = on ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(hero);
    // La barre se cache quand un bouton équivalent est déjà à l'écran (mini configurateur, pied de page).
    const hideOn = document.querySelectorAll('[data-nd-hide-sticky]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)));
      update();
    });
    hideOn.forEach((el) => io.observe(el));
  };

  /* ---------- Mini configurateur de l'accueil ---------- */
  const money = (cents) => window.NODAL.money ? window.NODAL.money(cents)
    : (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 ? 2 : 0 });
  window.NODAL.money = window.NODAL.money || ((cents) =>
    (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'EUR', minimumFractionDigits: cents % 100 ? 2 : 0 }));

  const initTeaser = (root = document) => {
    root.querySelectorAll('[data-nd-teaser]').forEach((t) => {
      if (t.dataset.ready) return;
      t.dataset.ready = '1';
      const btns = t.querySelectorAll('[data-len]');
      const rail = t.querySelector('[data-rail]');
      const dimR = t.querySelector('[data-dim-r]');
      const dimH = t.querySelector('[data-dim-h]');
      const slotsG = t.querySelector('[data-slots]');
      const lenTxt = t.querySelector('[data-len-txt]');
      const slotTxt = t.querySelector('[data-slot-txt]');
      const priceTxt = t.querySelector('[data-price-txt]');
      const cta = t.querySelector('[data-cta]');
      const W = 335;
      const pitch = +t.dataset.pitch || 130;
      const lenOf = (b) => parseInt(b.dataset.len, 10);
      const maxLen = Math.max(...[...btns].map(lenOf));
      const set = (b) => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const len = lenOf(b), slots = Math.max(1, Math.floor((len * 10) / pitch));
        const w = Math.round((W * len) / maxLen);
        rail.setAttribute('width', w);
        dimR.setAttribute('d', `M${w} 10v-8`);
        dimH.setAttribute('d', `M0 6h${w}`);
        slotsG.innerHTML = '';
        const step = w / slots;
        for (let k = 0; k < slots; k++) {
          const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('x', k * step + 3); r.setAttribute('y', 34);
          r.setAttribute('width', Math.max(step - 6, 2)); r.setAttribute('height', 22);
          slotsG.appendChild(r);
        }
        lenTxt.textContent = `${len * 10} mm`;
        slotTxt.textContent = `jusqu'à ${slots} modules`;
        if (b.dataset.price) priceTxt.textContent = money(+b.dataset.price);
        if (cta) {
          const u = new URL(cta.dataset.base, location.origin);
          u.searchParams.set('longueur', len);
          cta.href = u.pathname + u.search;
        }
      };
      btns.forEach((b) => b.addEventListener('click', () => set(b)));
      set(t.querySelector('[data-len][aria-pressed="true"]') || btns[0]);
    });
  };

  const initAll = (root) => { renderEta(root); initBeforeAfter(root); initTeaser(root); };

  document.addEventListener('DOMContentLoaded', () => { initAll(document); initSticky(); });
  // Éditeur de thème Shopify : réinitialiser une section rechargée.
  document.addEventListener('shopify:section:load', (e) => initAll(e.target));
  // Tiroir panier et panier de Dawn : leur HTML est remplacé à chaque mise à jour.
  // On recalcule les dates dès qu'un nouvel élément [data-nd-eta] apparaît.
  if ('MutationObserver' in window) {
    let t;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => { if (document.querySelector('[data-nd-eta]:not([data-nd-done])')) renderEta(document); }, 30);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
