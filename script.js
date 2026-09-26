(() => {
  'use strict';

  const config = window.AUTOFLOW_CONFIG || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Conversation du hero : lecture unique, message par message ---- */
  const chat = document.getElementById('chat');
  if (chat && !reduceMotion) {
    const figure = chat.closest('.chat');
    const messages = Array.from(chat.children);
    const typing = chat.querySelector('.msg--typing');
    figure.classList.add('chat--play');

    // Délai avant chaque élément (ms)
    const delays = [300, 700, 1500, 1300, 1500, 1300, 900];
    let t = 0;
    messages.forEach((msg, i) => {
      t += delays[i] || 800;
      setTimeout(() => {
        if (msg !== typing && typing.classList.contains('is-in')) typing.remove();
        msg.classList.add('is-in');
      }, t);
    });
  } else if (chat) {
    chat.querySelector('.msg--typing')?.remove();
  }

  /* ---- Outils ---- */
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
  const euros = (n, decimals = 0) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
  const number = (n, decimals = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(n);

  /* ---- Formulaire d'audit : lien Google Forms, ouvert dans un nouvel onglet ---- */
  const formUrl = config.AUDIT_FORM_URL;
  const newTabHint = '<span class="visually-hidden"> (s\'ouvre dans un nouvel onglet)</span>';
  const formLinkAttrs = formUrl ? `href="${escapeHtml(formUrl)}" target="_blank" rel="noopener"` : 'href="#audit"';

  document.querySelectorAll('.js-form').forEach((link) => {
    if (!formUrl) return;
    link.href = formUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.insertAdjacentHTML('beforeend', newTabHint);
  });

  /* ---- Packs et prix : générés depuis config.js ---- */
  const packs = Array.isArray(config.packs) ? config.packs : [];
  const rows = config.rows || [];
  const byName = (name) => packs.find((p) => p.name === name);

  const renderValue = (value) => {
    if (value === true) return '<span class="pack__value">Oui</span>';
    if (value === false || value == null) return '<span class="pack__value">Non</span>';
    return `<span class="pack__value">${escapeHtml(value)}</span>`;
  };

  const renderPricing = (pack) => {
    const lines = [`<p class="pack__price">${euros(pack.price)} <small>/mois</small></p>`];

    // Coût par conversation (effet « grand format » du cinéma)
    if (pack.conversations) {
      lines.push(`<p class="pack__unit">${euros(pack.price / pack.conversations, 2)} par conversation</p>`);
      const ref = byName(pack.compareTo);
      if (ref && ref.conversations) {
        // Arrondi au demi pour un message lisible (ex. 2,92 -> 3 ; 3,5 -> 3,5)
        const ratio = Math.round(((ref.price / ref.conversations) / (pack.price / pack.conversations)) * 2) / 2;
        lines.push(`<p class="pack__unit-compare">${number(ratio)} fois moins cher par conversation qu'${escapeHtml(ref.name)}</p>`);
      }
    } else {
      lines.push('<p class="pack__unit">Conversations illimitées</p>');
    }

    // Recadrage en résultat
    if (pack.reframe) lines.push(`<p class="pack__daily">${escapeHtml(pack.reframe)}</p>`);
    return lines.join('');
  };

  // Écart minuscule entre le pack recommandé et son pack de référence
  const renderPitch = (pack) => {
    const ref = byName(pack.compareTo);
    if (!ref) return '';
    const convRatio = pack.conversations && ref.conversations ? pack.conversations / ref.conversations : null;
    let text = `Seulement ${euros(pack.price - ref.price)} de plus qu'${escapeHtml(ref.name)} : `;
    text += convRatio ? `${number(convRatio)} fois plus de conversations, ` : '';
    text += `${escapeHtml(pack.pitchExtras || '')}.`;
    return `<p>${text}</p>`;
  };

  const packsGrid = document.getElementById('packs-grid');
  if (packsGrid) {
    packsGrid.style.setProperty('--pack-rows', rows.length + 5);
    packsGrid.innerHTML = packs.map((pack) => {
      const id = `pack-${pack.name.toLowerCase()}`;
      return `
      <article class="pack${pack.recommended ? ' pack--recommended' : ''}" aria-labelledby="${id}">
        <div class="pack__head">
          ${pack.recommended ? '<span class="pack__badge"><span class="tri" aria-hidden="true"></span> Recommandé</span>' : ''}
          <h3 class="pack__name" id="${id}">${escapeHtml(pack.name)}</h3>
          <p class="pack__for">${escapeHtml(pack.forWho)}</p>
        </div>
        <div class="pack__pricing">${renderPricing(pack)}</div>
        <div class="pack__pitch">${pack.recommended ? renderPitch(pack) : ''}</div>
        ${rows.map((row) => {
          const value = pack.values[row.key];
          const missing = value === false || value == null;
          return `<div class="pack__row${missing ? ' pack__row--missing' : ''}">
            ${missing ? '<span class="pack__cross" aria-hidden="true">✕</span>' : ''}
            <span class="pack__label">${escapeHtml(row.label)}</span>${renderValue(value)}
          </div>`;
        }).join('')}
        <a class="btn ${pack.recommended ? '' : 'btn--ghost'} pack__cta" ${formLinkAttrs}>Choisir ${escapeHtml(pack.name)}${formUrl ? newTabHint : ''}</a>
        <p class="pack__guarantee">${pack.guaranteeUnderButton && config.guaranteeLine
          ? `<span class="tri" aria-hidden="true"></span> ${escapeHtml(config.guaranteeLine)}` : ''}</p>
      </article>`;
    }).join('');
  }

  const packsNotes = document.getElementById('packs-notes');
  if (packsNotes && Array.isArray(config.pricingNotes)) {
    packsNotes.innerHTML = config.pricingNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  }
})();
