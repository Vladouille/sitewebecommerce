(() => {
  'use strict';

  const config = window.AUTOFLOW_CONFIG || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Lien de réservation : un seul réglage pour tous les boutons ---- */
  const bookingHref = config.bookingUrl
    || `mailto:${config.contactEmail}?subject=${encodeURIComponent('Audit Autoflow offert')}`;
  document.querySelectorAll('.js-book').forEach((link) => {
    link.href = bookingHref;
    if (config.bookingUrl) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
  });

  /* ---- Email de contact ---- */
  document.querySelectorAll('.js-email').forEach((link) => {
    link.href = `mailto:${config.contactEmail}`;
    link.textContent = config.contactEmail;
  });

  /* ---- Grille de prix générée depuis config.js ---- */
  const formatPrice = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

  const renderValue = (value) => {
    if (value === true) return '<span class="plan__value">Oui</span>';
    if (value === false || value == null) return '<span class="plan__value plan__value--no">Non</span>';
    return `<span class="plan__value">${escapeHtml(value)}</span>`;
  };

  const pricing = document.getElementById('pricing');
  if (pricing && Array.isArray(config.plans)) {
    pricing.innerHTML = config.plans.map((plan) => `
      <article class="plan${plan.recommended ? ' plan--recommended' : ''}">
        ${plan.recommended ? '<span class="plan__tag"><span class="tri"></span> Recommandé</span>' : ''}
        <h3 class="plan__name">${escapeHtml(plan.name)}</h3>
        <p class="plan__price">${formatPrice(plan.price)} <small>/mois</small></p>
        <ul class="plan__features">
          ${config.features.map((f) => `<li><span>${escapeHtml(f.label)}</span>${renderValue(plan.values[f.key])}</li>`).join('')}
        </ul>
        <a class="btn" href="${escapeHtml(bookingHref)}"${config.bookingUrl ? ' target="_blank" rel="noopener"' : ''}>Réserver mon audit offert</a>
      </article>
    `).join('');
  }

  const notes = document.getElementById('pricing-notes');
  if (notes && Array.isArray(config.pricingNotes)) {
    notes.innerHTML = config.pricingNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join('');
  }

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
})();
