/* QG des associés : version Hostinger (page + api.php, aucun compte, aucun service externe).
   Le lien d'invitation contient la clé (?k=...) : elle est gardée sur le téléphone puis retirée de l'adresse.
   ?moi=0|1|2 dans le lien indique à qui appartient le téléphone. */
(() => {
  'use strict';
  const API = 'api.php';
  const KEY_LS = 'qg.key.v1';
  const POLL_MS = 6000;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch {} };

  // Lecture du lien d'invitation
  try {
    const u = new URL(location.href);
    const k = u.searchParams.get('k');
    const moi = u.searchParams.get('moi');
    if (k) lsSet(KEY_LS, k);
    if (moi === '0' || moi === '1' || moi === '2') lsSet('qg.me', JSON.stringify(moi));
    if (k || moi) { u.searchParams.delete('k'); u.searchParams.delete('moi'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  } catch {}

  async function call(op, payload = {}) {
    const body = JSON.stringify(Object.assign({ op }, payload));
    let res;
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-qg-key': lsGet(KEY_LS) || '' },
        body,
        keepalive: body.length < 60000, // la requête part même si l'app est fermée juste après
        cache: 'no-store',
      });
    } catch {
      throw { code: 'unavailable' };
    }
    let j = null;
    try { j = await res.json(); } catch {}
    if (!res.ok) {
      const code = (j && j.code) || 'unavailable';
      if (code === 'bad_key') { lsDel(KEY_LS); location.reload(); }
      throw { code };
    }
    return j;
  }

  function showMsg(title, text) {
    const g = document.getElementById('gate');
    g.hidden = false; document.getElementById('app').hidden = true;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    g.innerHTML = `<div class="box"><div class="logo">QG DES ASSOCIÉS</div><h1>${esc(title)}</h1><p class="muted">${esc(text)}</p></div>`;
  }
  let ready = null;
  function needKey() {
    if (ready) return ready;
    ready = new Promise((resolve) => {
      if (!lsGet(KEY_LS)) return showMsg('Ouvre ton lien d’invitation', 'Cette app s’ouvre avec le lien envoyé par Vladimir. Touche ce lien une fois : ce téléphone s’en souviendra.');
      resolve();
    });
    return ready;
  }

  /* ---------- Base de données ---------- */
  const server = new Map();
  const overlay = new Map();
  let loaded = false;
  const listeners = new Set();
  const view = () => { const m = new Map(server); for (const [k, v] of overlay) { if (v === null) m.delete(k); else m.set(k, v); } return m; };
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
    refreshing = call('list').then((rows) => {
      server.clear();
      for (const it of rows || []) server.set(it.col + '/' + it.id, it.data);
      loaded = true; notify();
    }).catch(() => {}).finally(() => { refreshing = null; });
    return refreshing;
  }
  let polling = false;
  function startPolling() {
    if (polling) return; polling = true;
    refresh();
    setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
  }
  const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function docRef(path) {
    const [col, id] = path.split('/');
    return {
      id, path,
      async get() { await refresh(); return snapDoc(id, view().get(path)); },
      async set(data) {
        overlay.set(path, clone(data)); notify();
        await call('set', { col, id, data });
        server.set(path, clone(data)); overlay.delete(path); notify();
      },
      async update(data) {
        overlay.set(path, Object.assign({}, view().get(path) || {}, clone(data))); notify();
        const r = await call('update', { col, id, data });
        if (r && r.found === false) { overlay.delete(path); server.delete(path); notify(); throw { code: 'invalid_argument' }; }
        server.set(path, overlay.get(path)); overlay.delete(path); notify();
      },
      async delete() {
        overlay.set(path, null); notify();
        await call('delete', { col, id });
        server.delete(path); overlay.delete(path); notify();
      },
      onSnapshot(next) { const l = { kind: 'doc', path, next }; listeners.add(l); startPolling(); if (loaded) notify(); return () => listeners.delete(l); },
    };
  }
  const db = Object.freeze({
    doc: (path) => docRef(path),
    collection: (col) => ({
      path: col,
      doc: (id) => docRef(col + '/' + (id || rid())),
      onSnapshot(next) { const l = { kind: 'col', path: col, next }; listeners.add(l); startPolling(); if (loaded) notify(); return () => listeners.delete(l); },
    }),
  });
  const downloads = Object.freeze({
    async save({ filename, data }) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { status: 'saved' };
    },
  });
  const user = Object.freeze({ can: async () => true });
  const caps = { db, downloads, user };
  window.QG_RT = Object.freeze({ use: async (name) => { await needKey(); return caps[name] || null; } });
})();
