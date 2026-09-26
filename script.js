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

  /* ---- Formulaire d'audit ---- */
  const form = document.getElementById('audit-form');
  if (!form) return;

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
    if (form.elements.botcheck.value) {
      showSuccess();
      return;
    }

    const shop = normalizeUrl(form.elements.shop.value);
    const payload = {
      access_key: config.web3formsKey,
      subject: `Nouvelle demande d'audit : ${shop}`,
      from_name: 'Site Autoflow',
      replyto: form.elements.email.value.trim(),
      'Prénom': form.elements.firstname.value.trim(),
      'Email': form.elements.email.value.trim(),
      'Téléphone': form.elements.phone.value.trim() || 'Non renseigné',
      'Boutique': shop,
      "Chiffre d'affaires mensuel": form.elements.revenue.value,
      'Principal problème': form.elements.problem.value.trim() || 'Non renseigné',
      'Consentement RGPD': 'Oui',
    };

    setSending(true);
    try {
      if (!config.web3formsKey) throw new Error('Clé Web3Forms manquante dans config.js');
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
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
