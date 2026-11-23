/* QG des associés : version autonome (une page HTML + une base Supabase gratuite).
   Remplace window.claude.use(...) par une couche qui parle directement à Supabase.
   Chaque appel envoie le code commun ; la base le vérifie avant toute lecture ou écriture. */
(() => {
  'use strict';
  const CFG = window.QG_CONFIG || {};
  const BASE = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  const KEY = String(CFG.SUPABASE_KEY || '');
  const CODE_KEY = 'qg.code.v1';
  const POLL_MS = 8000;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const configured = /^https:\/\/[^/]+$/.test(BASE) && !BASE.includes('VOTRE-PROJET') && KEY.length > 20 && !KEY.includes('VOTRE-CLE');

  async function rpc(fn, args, codeOverride) {
    const headers = { 'content-type': 'application/json', apikey: KEY };
    if (KEY.startsWith('eyJ')) headers.authorization = 'Bearer ' + KEY;
    let res;
    try {
      res = await fetch(BASE + '/rest/v1/rpc/' + fn, {
        method: 'POST', headers,
        body: JSON.stringify(Object.assign({ p_code: codeOverride ?? lsGet(CODE_KEY) ?? '' }, args)),
      });
    } catch {
      throw { code: 'unavailable', message: 'Réseau indisponible' };
    }
    let j = null;
    try { j = await res.json(); } catch {}
    if (!res.ok) {
      const msg = (j && (j.message || j.msg)) || '';
      let code = 'unavailable';
      if (/bad_code/.test(msg)) code = 'bad_code';
      else if (/invalid_argument/.test(msg)) code = 'invalid_argument';
      else if (res.status === 404 || (j && j.code === 'PGRST202')) code = 'not_configured';
      else if (res.status === 401) code = 'bad_key';
      if (code === 'bad_code' && codeOverride === undefined) { lsDel(CODE_KEY); location.reload(); }
      throw { code, message: msg };
    }
    return j;
  }

  /* ---------- Écran du code commun ---------- */
  let unlocked = null;
  function needUnlock() {
    if (unlocked) return unlocked;
    unlocked = new Promise((resolve) => {
      if (!configured) {
        return showMsg('App pas encore branchée', 'Renseigne SUPABASE_URL et SUPABASE_KEY en haut du fichier HTML (voir le guide d’installation), puis rouvre la page.');
      }
      if (lsGet(CODE_KEY)) return resolve();
      const render = (err) => {
        const g = document.getElementById('gate');
        g.hidden = false; document.getElementById('app').hidden = true;
        g.innerHTML = `<form class="box" id="codeForm" autocomplete="off">
          <div class="logo">QG DES ASSOCIÉS</div>
          <h1>Code d’accès</h1>
          <p class="muted">Entre le code commun. Ce téléphone s’en souviendra : tu ne le taperas qu’une fois.</p>
          <div class="field"><label for="codeInput">Code</label><input class="input" id="codeInput" type="password" required autocomplete="current-password"></div>
          ${err ? `<p class="msg err">${escH(err)}</p>` : ''}
          <button class="btn primary block" type="submit">Entrer</button></form>`;
        const input = document.getElementById('codeInput');
        setTimeout(() => input.focus(), 50);
        document.getElementById('codeForm').addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const btn = ev.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Vérification…';
          const code = input.value.trim();
          try { await rpc('qg_ping', {}, code); lsSet(CODE_KEY, code); resolve(); }
          catch (e) {
            render({
              bad_code: 'Code incorrect.',
              not_configured: 'La base n’est pas prête : le script schema.sql n’a pas été exécuté dans Supabase.',
              bad_key: 'Clé Supabase refusée : vérifie SUPABASE_KEY en haut du fichier.',
            }[e.code] || 'Serveur injoignable. Vérifie ta connexion puis réessaie.');
          }
        });
      };
      render();
    });
    return unlocked;
  }
  function showMsg(title, text) {
    const g = document.getElementById('gate');
    g.hidden = false; document.getElementById('app').hidden = true;
    g.innerHTML = `<div class="box"><div class="logo">QG DES ASSOCIÉS</div><h1>${escH(title)}</h1><p class="muted">${escH(text)}</p></div>`;
  }

  /* ---------- Base de données (même interface que dans la version d'origine) ---------- */
  const server = new Map(); // "col/id" -> data
  const overlay = new Map(); // écritures pas encore confirmées : "col/id" -> data | null (supprimé)
  let loaded = false;
  const listeners = new Set();
  const view = () => {
    const m = new Map(server);
    for (const [k, v] of overlay) { if (v === null) m.delete(k); else m.set(k, v); }
    return m;
  };
  const snapDoc = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: { fromCache: false, hasPendingWrites: false } });
  function notify() {
    if (!loaded) return;
    const all = view();
    for (const l of listeners) {
      if (l.kind === 'doc') l.next(snapDoc(l.path.split('/')[1], all.get(l.path)));
      else {
        const docs = [];
        for (const [k, d] of all) { const [c, id] = k.split('/'); if (c === l.path) docs.push(snapDoc(id, d)); }
        docs.sort((a, b) => (a.id < b.id ? -1 : 1));
        l.next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
      }
    }
  }
  let refreshing = null;
  function refresh() {
    if (refreshing) return refreshing;
    refreshing = rpc('qg_list', {}).then((rows) => {
      server.clear();
      for (const it of rows || []) server.set(it.col + '/' + it.id, it.data);
      loaded = true; notify();
    }).catch(() => {}).finally(() => { refreshing = null; });
    return refreshing;
  }
  let pollTimer = null;
  function startPolling() {
    if (pollTimer) return;
    refresh();
    pollTimer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
  }
  const rid = () => {
    const a = new Uint8Array(12); crypto.getRandomValues(a);
    return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function docRef(path) {
    const [col, id] = path.split('/');
    return {
      id, path,
      async get() { await refresh(); return snapDoc(id, view().get(path)); },
      async set(data) {
        overlay.set(path, clone(data)); notify();
        await rpc('qg_set', { p_col: col, p_id: id, p_data: data });
        server.set(path, clone(data)); overlay.delete(path); notify();
      },
      async update(data) {
        const base = view().get(path) || {};
        overlay.set(path, Object.assign({}, base, clone(data))); notify();
        const found = await rpc('qg_merge', { p_col: col, p_id: id, p_patch: data });
        if (found === false) { overlay.delete(path); server.delete(path); notify(); throw { code: 'invalid_argument' }; }
        server.set(path, overlay.get(path)); overlay.delete(path); notify();
      },
      async delete() {
        overlay.set(path, null); notify();
        await rpc('qg_delete', { p_col: col, p_id: id });
        server.delete(path); overlay.delete(path); notify();
      },
      onSnapshot(next) {
        const l = { kind: 'doc', path, next }; listeners.add(l); startPolling();
        if (loaded) notify();
        return () => listeners.delete(l);
      },
    };
  }
  const db = Object.freeze({
    doc: (path) => docRef(path),
    collection: (col) => ({
      path: col,
      doc: (id) => docRef(col + '/' + (id || rid())),
      onSnapshot(next) {
        const l = { kind: 'col', path: col, next }; listeners.add(l); startPolling();
        if (loaded) notify();
        return () => listeners.delete(l);
      },
    }),
  });

  /* ---------- Sauvegarde : téléchargement direct du fichier ---------- */
  const downloads = Object.freeze({
    async save({ filename, data }) {
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { status: 'saved' };
    },
  });
  const user = Object.freeze({ can: async () => true });

  const caps = { db, downloads, user };
  window.claude = Object.freeze({ use: async (name) => { await needUnlock(); return caps[name] || null; } });
})();
