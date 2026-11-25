/* NODAL — panier local de la version HTML (pas de serveur, pas de paiement).
   Stocké dans le navigateur (localStorage). Le catalogue vient de window.NODAL_CATALOG. */
(() => {
  'use strict';
  const KEY = 'nodal-cart-v1';
  const CAT = window.NODAL_CATALOG || { variants: {} };
  const money = (c) => (c / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: c % 100 ? 2 : 0 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  const read = () => { try { const c = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return mem; } };
  let mem = [];
  const write = (c) => { mem = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* navigation privée : panier en mémoire */ } badge(); };
  const lineKey = (id, props) => `${id}|${(props && props._Composition) || ''}`;

  function add(items) {
    const cart = read();
    items.forEach(({ id, quantity, properties }) => {
      const v = CAT.variants[id];
      if (!v) throw new Error('Produit introuvable.');
      if (!v.available) throw new Error(`${v.title} est épuisé.`);
      const k = lineKey(id, properties);
      const line = cart.find((l) => l.key === k);
      if (line) line.qty += quantity || 1;
      else cart.push({ key: k, id, qty: quantity || 1, group: (properties && properties._Composition) || '' });
    });
    write(cart);
    return Promise.resolve(cart);
  }
  const count = () => read().reduce((a, l) => a + l.qty, 0);
  function badge() {
    document.querySelectorAll('[data-cart-count]').forEach((b) => { const n = count(); b.textContent = n; b.hidden = n === 0; });
    document.querySelectorAll('[data-cart-label]').forEach((a) => a.setAttribute('aria-label', `Panier, ${count()} article(s)`));
  }

  /* Page panier */
  function renderCart(root) {
    const cart = read();
    const list = root.querySelector('[data-lines]');
    const empty = root.querySelector('[data-empty]');
    const full = root.querySelector('[data-full]');
    empty.hidden = cart.length > 0; full.hidden = cart.length === 0;
    if (!cart.length) return;
    const groups = new Map();
    cart.forEach((l) => { const g = l.group || ''; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(l); });
    let html = '';
    let n = 0;
    groups.forEach((lines, g) => {
      if (g) { n++; html += `<li class="nd-cart__group"><span class="nd-mono">Rail composé n° ${n}</span><button type="button" class="nd-cart__rm" data-rm-group="${esc(g)}">Retirer la composition</button></li>`; }
      lines.forEach((l) => {
        const v = CAT.variants[l.id] || { title: 'Produit retiré', price: 0 };
        html += `<li class="nd-cart__line">
          <div class="nd-cart__ph" aria-hidden="true"></div>
          <div><b>${esc(v.title)}</b>${v.sub ? `<small>${esc(v.sub)}</small>` : ''}
            <div class="nd-qty" role="group" aria-label="Quantité de ${esc(v.title)}">
              <button type="button" data-dec="${esc(l.key)}" aria-label="Retirer un">−</button><span>${l.qty}</span><button type="button" data-inc="${esc(l.key)}" aria-label="Ajouter un">+</button>
            </div>
          </div>
          <div class="nd-cart__right"><span class="nd-price">${money(v.price * l.qty)}</span><button type="button" class="nd-cart__rm" data-rm="${esc(l.key)}">Retirer</button></div>
        </li>`;
      });
    });
    list.innerHTML = html;
    const total = cart.reduce((a, l) => a + ((CAT.variants[l.id] || { price: 0 }).price * l.qty), 0);
    root.querySelectorAll('[data-total]').forEach((t) => { t.textContent = money(total); });
  }
  function bindCart(root) {
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      let cart = read();
      if (t.dataset.inc) cart.find((l) => l.key === t.dataset.inc).qty++;
      else if (t.dataset.dec) { const l = cart.find((x) => x.key === t.dataset.dec); l.qty--; if (l.qty < 1) cart = cart.filter((x) => x !== l); }
      else if (t.dataset.rm) cart = cart.filter((l) => l.key !== t.dataset.rm);
      else if (t.dataset.rmGroup) cart = cart.filter((l) => l.group !== t.dataset.rmGroup);
      else return;
      write(cart); renderCart(root);
    });
    renderCart(root);
  }

  /* Fiche produit : formulaire d'ajout */
  function bindProduct(form) {
    const sel = () => {
      const opts = [...form.querySelectorAll('[data-opt]')].map((g) => g.querySelector('[aria-pressed="true"]').dataset.val);
      const ids = JSON.parse(form.dataset.variants);
      return ids.find((v) => opts.every((o, i) => v.options[i] === o)) || ids[0];
    };
    const update = () => {
      const v = sel();
      form.querySelector('[data-price]').textContent = money(v.price);
      const btn = form.querySelector('[data-add]');
      btn.disabled = !v.available; btn.textContent = v.available ? 'Ajouter au panier' : 'Épuisé dans cette combinaison';
    };
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-val]');
      if (b) { b.parentElement.querySelectorAll('[data-val]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); update(); return; }
      const q = e.target.closest('[data-q]');
      if (q) { const out = form.querySelector('[data-qty]'); out.textContent = Math.max(1, +out.textContent + (+q.dataset.q)); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = sel();
      const msg = form.querySelector('[data-msg]');
      try {
        await add([{ id: v.id, quantity: +form.querySelector('[data-qty]').textContent }]);
        msg.innerHTML = 'Ajouté. <a class="nd-link" href="panier.html">Voir le panier</a>';
        msg.hidden = false;
      } catch (err) { msg.textContent = err.message; msg.hidden = false; }
    });
    update();
  }

  window.NODAL = Object.assign(window.NODAL || {}, { cartAdd: add, money });
  document.addEventListener('DOMContentLoaded', () => {
    badge();
    const c = document.querySelector('[data-cart-page]'); if (c) bindCart(c);
    document.querySelectorAll('[data-product-form]').forEach(bindProduct);
  });
  window.addEventListener('storage', badge);
})();
