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

  /* ---- Packs et prix : générés depuis config.js ---- */
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
  const formatPrice = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
  const renderValue = (value) => {
    if (value === true) return '<span class="pack__value">Oui</span>';
    if (value === false || value == null) return '<span class="pack__value pack__value--no">Non</span>';
    return `<span class="pack__value">${escapeHtml(value)}</span>`;
  };

  const packsGrid = document.getElementById('packs-grid');
  if (packsGrid && Array.isArray(config.packs)) {
    const rows = config.rows || [];
    packsGrid.style.setProperty('--pack-rows', rows.length + 3);
    packsGrid.innerHTML = config.packs.map((pack) => `
      <article class="pack${pack.recommended ? ' pack--recommended' : ''}" aria-labelledby="pack-${escapeHtml(pack.name)}">
        <div class="pack__head">
          ${pack.recommended ? '<span class="pack__badge"><span class="tri" aria-hidden="true"></span> Recommandé</span>' : ''}
          <h3 class="pack__name" id="pack-${escapeHtml(pack.name)}">${escapeHtml(pack.name)}</h3>
          <p class="pack__for">${escapeHtml(pack.forWho)}</p>
        </div>
        <div class="pack__pricing">
          <p class="pack__price">${formatPrice(pack.price)} <small>/mois</small></p>
          ${pack.reframe ? `<p class="pack__reframe">${escapeHtml(pack.reframe)}</p>` : ''}
        </div>
        ${rows.map((row) => `<div class="pack__row"><span class="pack__label">${escapeHtml(row.label)}</span>${renderValue(pack.values[row.key])}</div>`).join('')}
        <a class="btn ${pack.recommended ? '' : 'btn--ghost'} pack__cta" href="#audit" data-pack="${escapeHtml(pack.name)}">Choisir ${escapeHtml(pack.name)}</a>
      </article>
    `).join('');
  }

  const packsNotes = document.getElementById('packs-notes');
  if (packsNotes && Array.isArray(config.pricingNotes)) {
    packsNotes.innerHTML = config.pricingNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  }

  /* ---- Formulaire d'audit ---- */
  const form = document.getElementById('audit-form');
  if (!form) return;

  // Les boutons « Choisir … » présélectionnent le pack (le lien #audit fait défiler)
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pack]');
    if (!button) return;
    const select = form.elements.pack;
    if ([...select.options].some((o) => o.value === button.dataset.pack)) select.value = button.dataset.pack;
  });

  const success = document.getElementById('form-success');
  const status = document.getElementById('form-status');
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = submit.textContent;

  // Accepte « maboutique.com » comme « https://maboutique.com »
  const normalizeUrl = (value) => {
    const v = value.trim();
    if (!v) return '';
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };
  const isValidShopUrl = (value) => {
    try {
      const url = new URL(normalizeUrl(value));
      return /^[^.\s]+(\.[^.\s]+)+$/.test(url.hostname);
    } catch {
      return false;
    }
  };

  const rules = {
    firstname: (f) => (f.value.trim() ? '' : 'Indique ton prénom.'),
    email: (f) => {
      if (!f.value.trim()) return 'Indique ton email.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) ? '' : 'Cet email ne semble pas valide. Exemple : prenom@maboutique.com';
    },
    phone: (f) => {
      if (!f.value.trim()) return '';
      return /^[+\d][\d\s().-]{7,}$/.test(f.value.trim()) ? '' : 'Ce numéro ne semble pas valide.';
    },
    shop: (f) => {
      if (!f.value.trim()) return 'Indique le lien de ta boutique.';
      return isValidShopUrl(f.value) ? '' : 'Ce lien ne semble pas valide. Exemple : maboutique.com';
    },
    revenue: (f) => (f.value ? '' : 'Choisis une tranche de chiffre d\'affaires.'),
    consent: (f) => (f.checked ? '' : 'Coche cette case pour qu\'on puisse te recontacter.'),
  };

  const validateField = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const message = rule(field);
    const error = document.getElementById(`e-${field.name}`);
    error.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.closest('.field').classList.toggle('field--invalid', Boolean(message));
    return !message;
  };

  // Après une première erreur, on revalide pendant la saisie
  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    const evt = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(evt, () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    field.addEventListener('blur', () => {
      if (field.value.trim() || field.getAttribute('aria-invalid')) validateField(field);
    });
  });

  const setSending = (sending) => {
    submit.disabled = sending;
    submit.textContent = sending ? 'Envoi en cours' : submitLabel;
    form.setAttribute('aria-busy', String(sending));
  };

  const showSuccess = () => {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };

  const showFailure = () => {
    status.innerHTML = `L'envoi n'a pas fonctionné. Réessaie dans un instant, ou écris-nous directement à <a href="mailto:${contactEmail}">${contactEmail}</a>.`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';

    const fields = Object.keys(rules).map((name) => form.elements[name]);
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // Robot détecté : on fait comme si tout s'était bien passé, sans rien envoyer
    if (form.elements.botcheck.checked) {
      showSuccess();
      return;
    }

    const shop = normalizeUrl(form.elements.shop.value);
    const pack = form.elements.pack.value;
    const payload = {
      access_key: config.WEB3FORMS_ACCESS_KEY,
      subject: `Nouvelle demande d'audit : ${pack} – ${shop}`,
      botcheck: false,
      from_name: 'Site Autoflow',
      replyto: form.elements.email.value.trim(),
      'Prénom': form.elements.firstname.value.trim(),
      'Email': form.elements.email.value.trim(),
      'Téléphone': form.elements.phone.value.trim() || 'Non renseigné',
      'Boutique': shop,
      "Chiffre d'affaires mensuel": form.elements.revenue.value,
      'Pack qui l\'intéresse': pack,
      'Principal problème': form.elements.problem.value.trim() || 'Non renseigné',
      'Consentement RGPD': 'Oui',
    };

    setSending(true);
    try {
      if (!config.WEB3FORMS_ACCESS_KEY) throw new Error('WEB3FORMS_ACCESS_KEY est vide dans config.js');
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      console.log('Réponse Web3Forms :', response.status, result);
      if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`);
      showSuccess();
    } catch (error) {
      console.error('Envoi du formulaire impossible :', error);
      showFailure();
    } finally {
      setSending(false);
    }
  });
})();
