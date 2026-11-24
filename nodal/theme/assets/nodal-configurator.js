/* NODAL — configurateur de rail.
   Données lues dans <script type="application/json" data-cfg-data> (voir sections/nodal-configurator.liquid).
   Aucune dépendance. Prix en centimes, comme Shopify. */
(() => {
  'use strict';

  const STORE_KEY = 'nodal-config-v1';
  const money = (c) => (window.NODAL && window.NODAL.money)
    ? window.NODAL.money(c)
    : (c / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: c % 100 ? 2 : 0 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const lenCm = (name) => parseInt(String(name).replace(/[^\d]/g, ''), 10) || 0;

  function init(root) {
    if (!root || root.dataset.ready) return;
    const dataEl = root.querySelector('[data-cfg-data]');
    if (!dataEl) return;
    root.dataset.ready = '1';
    let D;
    try { D = JSON.parse(dataEl.textContent); } catch (e) { console.error('NODAL configurateur : données illisibles', e); return; }

    const $ = (s) => root.querySelector(s);
    const el = {
      lenGroup: $('[data-len-group]'), lenOut: $('[data-len-out]'),
      finWrap: $('[data-fin-wrap]'), finGroup: $('[data-fin-group]'), finOut: $('[data-fin-out]'),
      railBar: $('[data-rail-bar]'), inner: $('[data-board-inner]'), scroll: $('[data-board-scroll]'), scrollHint: $('[data-scroll-hint]'), dimOut: $('[data-dim-out]'), slots: $('[data-slots]'), hint: $('[data-hint]'),
      picker: $('[data-picker]'), countOut: $('[data-count-out]'), modStep: $('[data-mod-step]'),
      suggest: $('[data-suggest]'), clear: $('[data-clear]'),
      recap: $('[data-recap]'), total: $('[data-total]'), add: $('[data-add]'), err: $('[data-err]'),
    };

    const modules = D.modules.map((m) => ({ ...m, slots: Math.max(1, parseInt(m.slots, 10) || 1) }));
    const modById = new Map(modules.map((m) => [m.id, m]));
    const hasFinish = D.finIndex >= 0 && D.finishes.length > 0;

    /* ---------- État ---------- */
    const state = { len: D.lengths[0], fin: hasFinish ? D.finishes[0].name : null, placed: [], target: null };
    // placed : [{ id, start }] — start = index du premier emplacement occupé.

    const slotCount = () => Math.max(1, Math.floor((lenCm(state.len) * 10) / (D.pitch || 130)));
    const railVariant = () => D.railVariants.find((v) =>
      v.options[D.lenIndex] === state.len && (!hasFinish || v.options[D.finIndex] === state.fin));
    const occupancy = () => {
      const occ = new Array(slotCount()).fill(null);
      state.placed.forEach((p, i) => { const m = modById.get(p.id); for (let k = 0; k < m.slots; k++) occ[p.start + k] = i; });
      return occ;
    };
    const fitsAt = (occ, start, w, ignore = -1) => {
      if (start < 0 || start + w > occ.length) return false;
      for (let k = start; k < start + w; k++) if (occ[k] !== null && occ[k] !== ignore) return false;
      return true;
    };
    const firstFit = (occ, w) => { for (let s = 0; s <= occ.length - w; s++) if (fitsAt(occ, s, w)) return s; return -1; };
    const hint = (html) => { el.hint.innerHTML = html; };

    /* ---------- Persistance (retour arrière, rechargement) ---------- */
    const save = () => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ len: state.len, fin: state.fin, placed: state.placed })); } catch (e) { /* stockage indisponible */ } };
    const restore = () => {
      try {
        const s = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
        if (!s) return;
        if (D.lengths.includes(s.len)) state.len = s.len;
        if (hasFinish && D.finishes.some((f) => f.name === s.fin)) state.fin = s.fin;
        if (Array.isArray(s.placed)) state.placed = s.placed.filter((p) => modById.has(p.id));
      } catch (e) { /* ignorer */ }
    };
    restore();
    // ?longueur=80 (depuis l'accueil) est prioritaire sur la sauvegarde.
    const qLen = new URLSearchParams(location.search).get('longueur');
    if (qLen) {
      const m = D.lengths.find((l) => lenCm(l) === parseInt(qLen, 10));
      if (m) state.len = m;
      // Appliqué une seule fois : un rechargement ou un retour arrière garde ensuite le choix du client.
      try { const u = new URL(location.href); u.searchParams.delete('longueur'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) { /* ignorer */ }
    }
    // Réparer une composition sauvegardée qui ne rentre plus.
    const repack = () => {
      const kept = [], occ = new Array(slotCount()).fill(null);
      let dropped = 0;
      state.placed.sort((a, b) => a.start - b.start).forEach((p) => {
        const w = modById.get(p.id).slots;
        let s = fitsAt(occ, p.start, w) ? p.start : firstFit(occ, w);
        if (s < 0) { dropped++; return; }
        for (let k = 0; k < w; k++) occ[s + k] = kept.length;
        kept.push({ id: p.id, start: s });
      });
      state.placed = kept;
      return dropped;
    };
    repack();

    /* ---------- Actions ---------- */
    const place = (id, at = null) => {
      const m = modById.get(id);
      if (!m || !m.available) return;
      const occ = occupancy();
      let start = at !== null && fitsAt(occ, at, m.slots) ? at : firstFit(occ, m.slots);
      if (start < 0) {
        hint(`Plus de place pour <b>${esc(m.title)}</b>. Passe à un rail plus long ou retire un module.`);
        return;
      }
      state.placed.push({ id, start });
      state.target = null;
      hint(`<b>${esc(m.title)}</b> ajouté. Touche un module sur le rail pour le retirer.`);
      render();
    };
    const removeAt = (slotIdx) => {
      const i = occupancy()[slotIdx];
      if (i === null || i === undefined) return;
      const m = modById.get(state.placed[i].id);
      state.placed.splice(i, 1);
      hint(`${esc(m.title)} retiré.`);
      render();
    };
    const move = (fromIdx, toSlot) => {
      const p = state.placed[fromIdx];
      const w = modById.get(p.id).slots;
      if (fitsAt(occupancy(), toSlot, w, fromIdx)) { p.start = toSlot; render(); }
    };

    /* ---------- Rendu ---------- */
    function renderLengths() {
      el.lenGroup.style.setProperty('--n', D.lengths.length);
      el.lenGroup.innerHTML = D.lengths.map((l) =>
        `<button type="button" data-l="${esc(l)}" aria-pressed="${l === state.len}">${esc(l)}</button>`).join('');
    }
    function renderFinishes() {
      if (!hasFinish) return;
      el.finWrap.hidden = false;
      el.finGroup.innerHTML = D.finishes.map((f) => {
        const sw = f.image ? `background:url('${esc(f.image)}') center/cover` : `--sw:${esc(f.color || '#C9A877')}`;
        return `<button type="button" data-f="${esc(f.name)}" aria-pressed="${f.name === state.fin}"><i style="${sw}"></i>${esc(f.name)}</button>`;
      }).join('');
    }
    function renderBoard() {
      const n = slotCount();
      const occ = occupancy();
      const maxLen = Math.max(...D.lengths.map(lenCm));
      // Largeur proportionnelle à la longueur, avec 58 px minimum par emplacement (lisible au doigt) : au-delà, le rail défile.
      el.inner.style.width = `max(${(lenCm(state.len) / maxLen) * 100}%, ${n * 58}px)`;
      const f = hasFinish && D.finishes.find((x) => x.name === state.fin);
      el.railBar.style.setProperty('--rail-color', (f && f.color) || '#C9A877');
      el.slots.style.setProperty('--slots', n);
      el.dimOut.textContent = `${lenCm(state.len) * 10} mm`;
      let html = '';
      for (let s = 0; s < n; s++) {
        const i = occ[s];
        if (i === null) {
          const t = state.target === s;
          html += `<button type="button" class="nd-slot${t ? ' is-target' : ''}" data-slot="${s}" aria-label="Emplacement ${s + 1}, libre${t ? ', ciblé' : ''}">${t ? 'Ici' : '+'}</button>`;
        } else if (state.placed[i].start === s) {
          const m = modById.get(state.placed[i].id);
          const img = m.image ? `<img src="${esc(m.image)}" alt="" loading="lazy" width="56" height="56">` : '';
          html += `<button type="button" class="nd-slot is-filled" style="grid-column:span ${m.slots}" data-slot="${s}" data-placed="${i}" draggable="true" aria-label="Emplacement ${s + 1} : ${esc(m.title)}. Toucher pour retirer">${img}<span>${esc(m.title)}</span><span class="nd-slot__x" aria-hidden="true">×</span></button>`;
        }
      }
      el.slots.innerHTML = html;
      requestAnimationFrame(() => { if (el.scrollHint) el.scrollHint.hidden = el.scroll.scrollWidth <= el.scroll.clientWidth + 1; });
      const free = occ.filter((x) => x === null).length;
      el.countOut.textContent = `${n - free} / ${n} emplacements`;
      el.lenOut.textContent = `${n} emplacements`;
      if (el.finOut) el.finOut.textContent = state.fin || '';
      if (el.modStep) el.modStep.textContent = hasFinish ? '3' : '2';
    }
    function renderPicker() {
      if (!modules.length) { el.picker.innerHTML = '<p class="nd-mono">Choisis la collection des modules dans l\'éditeur.</p>'; return; }
      const occ = occupancy();
      el.picker.innerHTML = modules.map((m) => {
        const noRoom = firstFit(occ, m.slots) < 0;
        const dis = !m.available || noRoom;
        const img = m.image ? `<img src="${esc(m.image)}" alt="" loading="lazy" width="56" height="56">` : '<span class="nd-pick__ph"></span>';
        const kg = m.kg !== '' && m.kg !== null ? ` · ${esc(m.kg)} kg max` : '';
        const why = !m.available ? 'Épuisé' : (noRoom ? 'Plus de place' : `<span class="nd-price">${money(m.price)}</span>${kg}`);
        return `<button type="button" class="nd-pick" data-mod="${m.id}" draggable="${!dis}" ${dis ? 'disabled' : ''} aria-label="Ajouter ${esc(m.title)}${m.available ? ', ' + esc(money(m.price)) : ', épuisé'}">${img}<span><b>${esc(m.title)}</b><span>${why}</span>${m.slots > 1 ? `<span>${m.slots} emplacements</span>` : ''}</span></button>`;
      }).join('');
    }
    function renderRecap() {
      const rv = railVariant();
      const lines = [];
      lines.push({ label: `${D.railTitle} · ${state.len}${state.fin ? ' · ' + state.fin : ''}`, price: rv ? rv.price : 0, qty: 1 });
      const counts = new Map();
      state.placed.forEach((p) => counts.set(p.id, (counts.get(p.id) || 0) + 1));
      counts.forEach((q, id) => { const m = modById.get(id); lines.push({ label: m.title, price: m.price * q, qty: q }); });
      el.recap.innerHTML = lines.map((l) =>
        `<li><span>${l.qty > 1 ? l.qty + ' × ' : ''}${esc(l.label)}</span><span class="nd-price">${money(l.price)}</span></li>`).join('');
      const total = lines.reduce((a, l) => a + l.price, 0);
      el.total.textContent = rv ? money(total) : '—';
      el.add.disabled = !rv || !rv.available;
      el.add.textContent = !rv ? 'Combinaison indisponible' : (!rv.available ? 'Épuisé dans cette finition' : 'Ajouter au panier');
    }
    function render() { renderLengths(); renderFinishes(); renderBoard(); renderPicker(); renderRecap(); save(); }

    /* ---------- Événements ---------- */
    el.lenGroup.addEventListener('click', (e) => {
      const b = e.target.closest('[data-l]'); if (!b) return;
      state.len = b.dataset.l; state.target = null;
      const dropped = repack();
      hint(dropped ? `${dropped} module(s) retiré(s) : ils ne tenaient plus sur ${esc(state.len)}.` : '');
      render();
    });
    el.finGroup.addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      state.fin = b.dataset.f; render();
    });
    el.picker.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mod]'); if (!b || b.disabled) return;
      place(+b.dataset.mod, state.target);
    });
    el.slots.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot]'); if (!b) return;
      const s = +b.dataset.slot;
      if (b.dataset.placed !== undefined) { removeAt(s); return; }
      state.target = state.target === s ? null : s;
      hint(state.target === null ? '' : `Emplacement ${s + 1} ciblé : touche un module pour l'y placer.`);
      renderBoard();
    });
    el.suggest.addEventListener('click', () => {
      if (!D.suggested.length) { hint('Aucun kit suggéré pour le moment.'); return; }
      state.placed = []; state.target = null;
      let skipped = 0;
      D.suggested.forEach((id) => {
        const m = modById.get(id);
        if (!m || !m.available) { skipped++; return; }
        const s = firstFit(occupancy(), m.slots);
        if (s < 0) { skipped++; return; }
        state.placed.push({ id, start: s });
      });
      hint(skipped ? `Kit ajouté. ${skipped} module(s) ne tenai(en)t pas sur ce rail.` : 'Kit suggéré ajouté. Modifie-le comme tu veux.');
      render();
    });
    el.clear.addEventListener('click', () => { state.placed = []; state.target = null; hint('Rail vidé.'); render(); });

    /* Glisser-déposer (ordinateur) */
    let drag = null;
    root.addEventListener('dragstart', (e) => {
      const pick = e.target.closest('[data-mod]');
      const slot = e.target.closest('[data-placed]');
      if (pick) drag = { type: 'new', id: +pick.dataset.mod };
      else if (slot) drag = { type: 'move', idx: +slot.dataset.placed };
      else return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'nodal');
    });
    el.slots.addEventListener('dragover', (e) => {
      if (!drag) return;
      const b = e.target.closest('[data-slot]'); if (!b) return;
      e.preventDefault();
      el.slots.querySelectorAll('.is-over').forEach((x) => x.classList.remove('is-over'));
      b.classList.add('is-over');
    });
    el.slots.addEventListener('dragleave', (e) => { const b = e.target.closest('[data-slot]'); if (b) b.classList.remove('is-over'); });
    el.slots.addEventListener('drop', (e) => {
      const b = e.target.closest('[data-slot]'); if (!b || !drag) return;
      e.preventDefault();
      const s = +b.dataset.slot;
      if (drag.type === 'new') place(drag.id, s); else move(drag.idx, s);
      drag = null;
    });
    root.addEventListener('dragend', () => { drag = null; el.slots.querySelectorAll('.is-over').forEach((x) => x.classList.remove('is-over')); });

    /* Ajout au panier : rail + modules en un appel */
    el.add.addEventListener('click', async () => {
      const rv = railVariant();
      if (!rv || !rv.available) return;
      const cid = 'R' + Date.now().toString(36).toUpperCase();
      const props = { _Composition: cid };
      const counts = new Map();
      state.placed.forEach((p) => counts.set(p.id, (counts.get(p.id) || 0) + 1));
      const items = [{ id: rv.id, quantity: 1, properties: props }];
      counts.forEach((q, id) => items.push({ id, quantity: q, properties: props }));
      el.add.disabled = true; el.add.textContent = 'Ajout…'; el.err.hidden = true;
      try {
        const r = await fetch(D.cartAddUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.description || j.message || 'Ajout impossible.');
        try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignorer */ }
        location.href = D.cartUrl;
      } catch (e) {
        el.err.textContent = `${e.message} Réessaie, ou écris-nous si le problème continue.`;
        el.err.hidden = false;
        renderRecap();
      }
    });

    if (!state.placed.length && D.suggested.length === 0) hint('Touche un module pour l\'ajouter au rail.');
    else if (!state.placed.length) hint('Touche un module pour l\'ajouter, ou prends le kit suggéré.');
    render();
  }

  const boot = (scope = document) => scope.querySelectorAll('[data-nd-configurator]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot()); else boot();
  document.addEventListener('shopify:section:load', (e) => boot(e.target));
  window.NODAL = Object.assign(window.NODAL || {}, { initConfigurator: init });
})();
