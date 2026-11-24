/* QG des associés : version locale (aucun compte, aucun serveur).
   Les données restent sur le téléphone ; chaque modification est enregistrée immédiatement.
   Pour échanger avec les associés : Réglages > Copier mes données, puis Importer chez l'autre. */
(() => {
  'use strict';
  const KEY = 'qg.local.data.v1';
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { mem = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const listeners = new Set();
  const snapDoc = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: { fromCache: false, hasPendingWrites: false } });
  function notify() {
    for (const l of listeners) {
      if (l.kind === 'doc') l.next(snapDoc(l.path.split('/')[1], mem[l.path]));
      else {
        const docs = Object.keys(mem).filter((k) => k.split('/')[0] === l.path).sort().map((k) => snapDoc(k.split('/')[1], mem[k]));
        l.next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
      }
    }
  }
  const rid = () => {
    const a = new Uint8Array(12); crypto.getRandomValues(a);
    return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  };
  function docRef(path) {
    const id = path.split('/')[1];
    return {
      id, path,
      async get() { return snapDoc(id, mem[path]); },
      async set(data) { mem[path] = clone(data); save(); notify(); },
      async update(data) {
        if (!mem[path]) throw { code: 'invalid_argument' };
        mem[path] = Object.assign({}, mem[path], clone(data)); save(); notify();
      },
      async delete() { delete mem[path]; save(); notify(); },
      onSnapshot(next) { const l = { kind: 'doc', path, next }; listeners.add(l); setTimeout(notify, 0); return () => listeners.delete(l); },
    };
  }
  const db = Object.freeze({
    doc: (path) => docRef(path),
    collection: (col) => ({
      path: col,
      doc: (id) => docRef(col + '/' + (id || rid())),
      onSnapshot(next) { const l = { kind: 'col', path: col, next }; listeners.add(l); setTimeout(notify, 0); return () => listeners.delete(l); },
    }),
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    try { mem = JSON.parse(e.newValue || '{}') || {}; } catch {}
    notify();
  });
  const user = Object.freeze({ can: async () => true });
  const caps = { db, user };
  window.claude = Object.freeze({ use: async (name) => caps[name] || null });
})();
