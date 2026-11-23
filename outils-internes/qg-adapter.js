/* QG des associés : version hors Claude.
   Remplace window.claude.use(...) par une couche qui parle à la fonction Supabase "qg".
   Le reste de l'app est identique à la version artifact. */
(() => {
  'use strict';
  const URL_FN = (window.QG_CONFIG && window.QG_CONFIG.FUNCTION_URL) || '';
  const CODE_KEY = 'qg.code.v1';
  const POLL_MS = 8000;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function call(op, payload = {}, signal, codeOverride) {
    let res;
    try {
      res = await fetch(URL_FN, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-qg-code': codeOverride ?? lsGet(CODE_KEY) ?? '' },
        body: JSON.stringify(Object.assign({ op }, payload)),
        signal,
      });
    } catch (e) {
      if (signal && signal.aborted) throw { code: 'cancelled' };
      throw { code: 'unavailable', message: 'Réseau indisponible' };
    }
    let j = null;
    try { j = await res.json(); } catch {}
    if (!res.ok) {
      const code = (j && j.code) || 'unavailable';
      if (code === 'bad_code' && codeOverride === undefined) { lsDel(CODE_KEY); location.reload(); }
      throw { code, message: (j && j.message) || '' };
    }
    return j || {};
  }

  /* ---------- Écran du code commun ---------- */
  let unlocked = null;
  function needUnlock() {
    if (unlocked) return unlocked;
    unlocked = new Promise((resolve) => {
      if (!/^https:\/\//.test(URL_FN) || URL_FN.includes('VOTRE-PROJET')) {
        return showMsg('App pas encore branchée', 'Renseigne l’adresse de la fonction Supabase dans QG_CONFIG.FUNCTION_URL, en haut du fichier index.html, puis renvoie le fichier sur Hostinger.');
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
          try { await call('ping', {}, undefined, code); lsSet(CODE_KEY, code); resolve(); }
          catch (e) {
            render(e.code === 'bad_code' ? 'Code incorrect.' : e.code === 'not_configured' ? 'Le code n’est pas encore réglé côté serveur (secret QG_CODE).' : 'Serveur injoignable. Vérifie ta connexion puis réessaie.');
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

  /* ---------- Base de données (même interface que le db des artifacts) ---------- */
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
    refreshing = call('list').then((r) => {
      server.clear();
      for (const it of r.items || []) server.set(it.col + '/' + it.id, it.data);
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
  function docRef(path) {
    const [col, id] = path.split('/');
    return {
      id, path,
      async get() { await refresh(); return snapDoc(id, view().get(path)); },
      async set(data) {
        overlay.set(path, JSON.parse(JSON.stringify(data))); notify();
        await call('set', { col, id, data });
        server.set(path, JSON.parse(JSON.stringify(data))); overlay.delete(path); notify();
      },
      async update(data) {
        const base = view().get(path) || {};
        overlay.set(path, Object.assign({}, base, JSON.parse(JSON.stringify(data)))); notify();
        try { await call('update', { col, id, data }); }
        catch (e) {
          if (e.code === 'missing') { overlay.delete(path); server.delete(path); notify(); throw { code: 'invalid_argument' }; }
          throw e;
        }
        server.set(path, overlay.get(path)); overlay.delete(path); notify();
      },
      async delete() {
        overlay.set(path, null); notify();
        await call('delete', { col, id });
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

  /* ---------- Analyse IA (passe par la fonction serveur) ---------- */
  const sample = async () => { throw { code: 'invalid_request' }; };
  sample.json = async (prompt, opts = {}) => {
    const r = await call('analyse', { prompt }, opts.signal);
    return r.result;
  };

  /* ---------- Sauvegarde : téléchargement direct ---------- */
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

  const caps = { db, sample, downloads, user };
  window.claude = Object.freeze({
    use: async (name) => { await needUnlock(); return caps[name] || null; },
  });
  window.QG_LOCK = () => { lsDel(CODE_KEY); location.reload(); };
})();
