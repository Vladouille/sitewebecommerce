(() => {
  'use strict';

  const fmtEUR = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  /* ---- Header au scroll ---- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Menu mobile ---- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ---- Compteurs animés ---- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmtNum(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---- Apparition au scroll ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('[data-count]').forEach(animateCount);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---- Barres du graphique : délai en cascade ---- */
  document.querySelectorAll('.chart__bar').forEach((bar, i) => bar.style.setProperty('--i', i));

  /* ---- Flux d'activité simulé ---- */
  const feed = document.getElementById('feed');
  const events = [
    ['🛒', 'Panier récupéré', [45, 260]],
    ['🎯', 'Nouveau client via TikTok', [30, 150]],
    ['💬', 'Conversation → vente', [60, 320]],
    ['🔁', 'Client réactivé', [40, 180]],
    ['📣', 'Vente via campagne Meta', [35, 220]],
    ['⭐', 'Avis 5★ → nouvelle commande', [50, 140]],
  ];
  const rand = (min, max) => Math.round(min + Math.random() * (max - min));
  if (feed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      const [icon, label, [min, max]] = events[rand(0, events.length - 1)];
      const li = document.createElement('li');
      li.innerHTML = `<span class="feed__icon">${icon}</span> ${label} — <strong>${rand(min, max)} €</strong><span class="feed__time">à l'instant</span>`;
      feed.prepend(li);
      feed.querySelectorAll('li').forEach((item, i) => {
        if (i === 1) item.querySelector('.feed__time').textContent = 'il y a 1 min';
        if (i > 2) item.remove();
      });
    }, 3500);
  }

  /* ---- Simulateur de gains ---- */
  const visitors = document.getElementById('visitors');
  const basket = document.getElementById('basket');
  const conv = document.getElementById('conv');

  // Hypothèses moyennes : +35 % de conversion relative (agents vendeur + relance)
  // + 5 % de nouveaux clients issus de la prospection, commission de 8 % (plan Croissance).
  const UPLIFT_CONVERSION = 0.35;
  const PROSPECTION_BONUS = 0.05;
  const COMMISSION = 0.08;
  const FIXED_FEE = 490;

  const updateSim = () => {
    const v = Number(visitors.value);
    const b = Number(basket.value);
    const c = Number(conv.value) / 100;

    document.getElementById('visitorsOut').textContent = fmtNum(v);
    document.getElementById('basketOut').textContent = fmtEUR(b);
    document.getElementById('convOut').textContent = conv.value.replace('.', ',') + ' %';

    const currentOrders = v * c;
    const extraOrders = currentOrders * (UPLIFT_CONVERSION + PROSPECTION_BONUS);
    const extraRevenue = extraOrders * b;
    const net = extraRevenue - extraRevenue * COMMISSION - FIXED_FEE;

    document.getElementById('simRevenue').textContent = '+' + fmtEUR(extraRevenue);
    document.getElementById('simClients').textContent = '+' + fmtNum(extraOrders);
    document.getElementById('simNet').textContent = fmtEUR(Math.max(net, 0));
  };
  [visitors, basket, conv].forEach((el) => el.addEventListener('input', updateSim));
  updateSim();

  /* ---- Pré-sélection de l'offre depuis les tarifs ---- */
  const planSelect = document.getElementById('planSelect');
  document.querySelectorAll('[data-plan]').forEach((btn) => btn.addEventListener('click', () => {
    planSelect.value = btn.dataset.plan;
  }));

  /* ---- Formulaire de contact ---- */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const ok = field.checkValidity() && field.value.trim() !== '';
      field.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      form.querySelector('.invalid').focus();
      return;
    }

    // TODO : brancher sur votre outil (Formspree, HubSpot, Calendly, API…)
    const data = Object.fromEntries(new FormData(form));
    console.info('Nouvelle demande d\'audit :', data);

    form.reset();
    planSelect.value = 'Croissance';
    success.hidden = false;
    setTimeout(() => { success.hidden = true; }, 8000);
  });
  form.querySelectorAll('input').forEach((f) => f.addEventListener('input', () => f.classList.remove('invalid')));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
