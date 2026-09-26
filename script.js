(() => {
  'use strict';

  const config = window.AUTOFLOW_CONFIG || {};
  const contactEmail = config.contactEmail || 'contact.autoflow1@gmail.com';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Conversation du hero : lecture unique, message par message ---- */
  const chat = document.getElementById('chat');
  if (chat && !reduceMotion) {
    const figure = chat.closest('.chat');
    const messages = Array.from(chat.children);
    const typing = chat.querySelector('.msg--typing');
    figure.classList.add('chat--play');

    // Délai avant chaque élément (ms)
    const delays = [300, 700, 1600, 1400, 900];
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

  /* ---- Packs et prix : générés depuis config.js ---- */
  const packs = Array.isArray(config.packs) ? config.packs : [];
  const rows = config.rows || [];
  const freeMonths = config.annualFreeMonths || 0;
  const byName = (name) => packs.find((p) => p.name === name);

  // Prix mensuel affiché selon la période choisie
  const monthlyPrice = (pack, billing) => (billing === 'annual'
    ? Math.round((pack.price * (12 - freeMonths)) / 12)
    : pack.price);

  const renderValue = (value) => {
    if (value === true) return '<span class="pack__value">Oui</span>';
    if (value === false || value == null) return '<span class="pack__value">Non</span>';
    return `<span class="pack__value">${escapeHtml(value)}</span>`;
  };

  const renderPricing = (pack, billing) => {
    const price = monthlyPrice(pack, billing);
    const annual = billing === 'annual';
    const lines = [];

    lines.push(`<p class="pack__price">
      ${annual ? `<s class="pack__was"><span class="visually-hidden">au lieu de </span>${euros(pack.price)}</s>` : ''}
      <span class="pack__amount">${euros(price)}</span> <small>/mois</small>
    </p>`);
    lines.push(`<p class="pack__billing">${annual ? 'Par mois, facturé annuellement' : 'Facturé chaque mois, sans engagement'}</p>`);

    // Coût par conversation (effet « grand format » du cinéma)
    if (pack.conversations) {
      lines.push(`<p class="pack__unit">${euros(price / pack.conversations, 2)} par conversation</p>`);
      const ref = byName(pack.compareTo);
      if (ref && ref.conversations) {
        const ratio = (monthlyPrice(ref, billing) / ref.conversations) / (price / pack.conversations);
        lines.push(`<p class="pack__unit-compare">${number(ratio)} fois moins cher par conversation qu'${escapeHtml(ref.name)}</p>`);
      }
    } else {
      lines.push('<p class="pack__unit">Conversations illimitées</p>');
    }

    // Recadrage quotidien
    if (pack.dailyNote) {
      lines.push(`<p class="pack__daily">Soit ${euros(Math.round(price / 30))} par jour, ${escapeHtml(pack.dailyNote)}.</p>`);
    }
    return lines.join('');
  };

  // Écart minuscule entre le pack recommandé et son pack de référence
  const renderPitch = (pack, billing) => {
    const ref = byName(pack.compareTo);
    if (!ref) return '';
    const diff = monthlyPrice(pack, billing) - monthlyPrice(ref, billing);
    const convRatio = pack.conversations && ref.conversations ? pack.conversations / ref.conversations : null;
    let text = `Seulement ${euros(diff)} de plus par mois qu'${escapeHtml(ref.name)} : `;
    text += convRatio ? `${number(convRatio)} fois plus de conversations, ` : '';
    text += `${escapeHtml(pack.pitchExtras || '')}.`;
    if (billing === 'monthly') {
      const firstMonthDiff = (pack.price + pack.setupFee) - (ref.price + ref.setupFee);
      if (firstMonthDiff > 0) text += ` Le premier mois, la différence n'est que de ${euros(firstMonthDiff)}.`;
    }
    return `<p>${text}</p>`;
  };

  const packsGrid = document.getElementById('packs-grid');
  const renderPacks = (billing) => {
    if (!packsGrid) return;
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
        <div class="pack__pricing">${renderPricing(pack, billing)}</div>
        <div class="pack__pitch">${pack.recommended ? renderPitch(pack, billing) : ''}</div>
        ${rows.map((row) => {
          const value = pack.values[row.key];
          const missing = value === false || value == null;
          return `<div class="pack__row${missing ? ' pack__row--missing' : ''}">
            ${missing ? '<span class="pack__cross" aria-hidden="true">✕</span>' : ''}
            <span class="pack__label">${escapeHtml(row.label)}</span>${renderValue(value)}
          </div>`;
        }).join('')}
        <a class="btn ${pack.recommended ? '' : 'btn--ghost'} pack__cta" href="#audit" data-pack="${escapeHtml(pack.name)}">Choisir ${escapeHtml(pack.name)}</a>
        <p class="pack__guarantee">${pack.guaranteeUnderButton && config.guaranteeLine
          ? `<span class="tri" aria-hidden="true"></span> ${escapeHtml(config.guaranteeLine)}` : ''}</p>
      </article>`;
    }).join('');
  };

  const billingField = document.getElementById('billing');
  const currentBilling = () => billingField?.querySelector('input:checked')?.value || 'annual';
  billingField?.addEventListener('change', () => renderPacks(currentBilling()));
  renderPacks(currentBilling());

  const packsNotes = document.getElementById('packs-notes');
  if (packsNotes && Array.isArray(config.pricingNotes)) {
    packsNotes.innerHTML = config.pricingNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  }

  /* ---- Formulaire d'audit : Tally intégré ---- */
  const tallyBox = document.getElementById('tally');
  const fallback = document.getElementById('audit-fallback');
  const mailLink = document.getElementById('audit-mail');
  const formId = config.TALLY_FORM_ID;
  let chosenPack = '';

  const tallySrc = () => {
    const params = new URLSearchParams({
      alignLeft: '1', hideTitle: '1', transparentBackground: '1', dynamicHeight: '1',
    });
    if (chosenPack) params.set('pack', chosenPack);
    return `https://tally.so/embed/${encodeURIComponent(formId)}?${params}`;
  };

  const updateMailLink = () => {
    const subject = chosenPack ? `Demande d'audit – pack ${chosenPack}` : "Demande d'audit";
    mailLink.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;
  };

  let iframe = null;
  if (formId && tallyBox) {
    iframe = document.createElement('iframe');
    iframe.dataset.tallySrc = tallySrc();
    iframe.title = "Formulaire de demande d'audit gratuit";
    iframe.loading = 'lazy';
    iframe.width = '100%';
    iframe.height = '620';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('marginheight', '0');
    iframe.setAttribute('marginwidth', '0');
    tallyBox.appendChild(iframe);

    // Script officiel Tally : gère la hauteur dynamique. Sans lui, on charge l'iframe directement.
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = () => window.Tally?.loadEmbeds();
    script.onerror = () => { iframe.src = iframe.dataset.tallySrc; };
    document.body.appendChild(script);
  } else if (fallback) {
    tallyBox?.remove();
    fallback.hidden = false;
    updateMailLink();
  }

  // Les boutons « Choisir … » transmettent le pack (le lien #audit fait défiler)
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pack]');
    if (!button || button.dataset.pack === chosenPack) return;
    chosenPack = button.dataset.pack;
    if (iframe) {
      iframe.dataset.tallySrc = tallySrc();
      iframe.src = iframe.dataset.tallySrc;
    } else if (mailLink) {
      updateMailLink();
    }
  });
})();
