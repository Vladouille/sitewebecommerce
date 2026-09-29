// =====================================================================
// Aurore : sauvegardes
// - 3 emplacements de ville sur l'appareil (localStorage), avec miniature
// - sauvegarde automatique : toutes les 15 s, après chaque action, en quittant la page
// - copies de secours : toutes les 3 minutes et avant tout chargement (6 par ville)
// - compte claude.ai quand la page est publiée comme Artifact (capacités db + user)
// - code de sauvegarde à copier-coller pour changer d'appareil
// =====================================================================
import { serialize, deserialize } from './sim.js';

const META_KEY = 'aurore-meta';
const slotKey = (n) => `aurore-slot-${n}`;
const bkKey = (n) => `aurore-backups-${n}`;
export const SLOTS = [1, 2, 3];
const BK_MAX = 6;

function readJSON(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; }
}
function writeRaw(key, str) {
  try { localStorage.setItem(key, str); return true; } catch (e) { return false; }
}

export class SaveManager {
  constructor({ onStatus, onRemoteNewer } = {}) {
    this.onStatus = onStatus || (() => {});
    this.onRemoteNewer = onRemoteNewer || (() => {});
    this.meta = readJSON(META_KEY, { slots: {}, last: null });
    if (!this.meta.slots) this.meta.slots = {};
    this.slot = null;
    this.lastSaved = 0;
    this.lastBackup = Date.now();
    this.pending = 0;
    this.cloud = null; // { db, uid }
    this.cloudBusy = false; this.cloudAgain = false;
    this.status = 'idle';
  }

  // ---------- emplacements ----------
  list() { return SLOTS.map((n) => ({ n, ...(this.meta.slots[n] || {}), empty: !this.meta.slots[n] })); }
  freeSlot() { return SLOTS.find((n) => !this.meta.slots[n]) || null; }
  load(n) {
    const raw = readJSON(slotKey(n), null);
    if (raw) {
      try { return deserialize(raw); } catch (e) { /* sauvegarde abîmée : on tente les copies */ }
    }
    for (const b of this.backups(n)) {
      try { return deserialize(JSON.parse(b.data)); } catch (e) { /* suivante */ }
    }
    return null;
  }
  remove(n) {
    try { localStorage.removeItem(slotKey(n)); localStorage.removeItem(bkKey(n)); } catch (e) { /* ignore */ }
    delete this.meta.slots[n];
    if (this.meta.last === n) this.meta.last = null;
    this.writeMeta();
    if (this.cloud) this.cloudDelete(n);
  }
  writeMeta() { writeRaw(META_KEY, JSON.stringify(this.meta)); }

  // ---------- sauvegarde ----------
  save(s, { thumb = null, reason = 'auto' } = {}) {
    if (!this.slot || !s) return false;
    const data = serialize(s);
    const str = JSON.stringify(data);
    let ok = writeRaw(slotKey(this.slot), str);
    if (!ok) {
      // réserve pleine : on libère les plus vieilles copies de secours, puis on réessaie
      for (const n of SLOTS) {
        const list = this.backups(n);
        while (list.length && !ok) { list.pop(); writeRaw(bkKey(n), JSON.stringify(list)); ok = writeRaw(slotKey(this.slot), str); }
      }
    }
    const m = s.m || {};
    this.meta.slots[this.slot] = {
      name: s.name, pop: Math.round(m.pop || 0), tick: s.tick, savedAt: Date.now(), milestone: s.milestone,
      money: Math.round(s.money), map: s.map, difficulty: s.difficulty,
      thumb: thumb || (this.meta.slots[this.slot] && this.meta.slots[this.slot].thumb) || null,
    };
    this.meta.last = this.slot;
    if (!writeRaw(META_KEY, JSON.stringify(this.meta))) {
      // la miniature prend de la place : on la retire si besoin
      this.meta.slots[this.slot].thumb = null;
      this.writeMeta();
    }
    this.lastSaved = Date.now();
    this.pending = 0;
    if (Date.now() - this.lastBackup > 180000 || reason === 'backup') { this.backup(s, reason === 'backup' ? 'manuelle' : 'automatique', str); }
    this.setStatus(ok ? (this.cloud ? 'saving' : 'local') : 'error');
    if (ok && this.cloud) this.pushCloud(this.slot, data);
    return ok;
  }
  // sauvegarde différée après une action (regroupe les actions rapprochées)
  soon(s) {
    clearTimeout(this.soonTimer);
    this.soonTimer = setTimeout(() => this.save(s), 1500);
  }

  // ---------- copies de secours ----------
  backups(n = this.slot) { const l = readJSON(bkKey(n), []); return Array.isArray(l) ? l : []; }
  backup(s, reason, str) {
    if (!this.slot) return;
    const list = this.backups();
    list.unshift({ ts: Date.now(), pop: Math.round((s.m && s.m.pop) || 0), tick: s.tick, reason, data: str || JSON.stringify(serialize(s)) });
    const trimmed = list.slice(0, BK_MAX);
    while (trimmed.length && !writeRaw(bkKey(this.slot), JSON.stringify(trimmed))) trimmed.pop();
    this.lastBackup = Date.now();
  }
  restore(i) {
    const b = this.backups()[i];
    if (!b) return null;
    return deserialize(JSON.parse(b.data));
  }

  // ---------- code de sauvegarde ----------
  async exportCode(s) {
    const json = JSON.stringify(serialize(s));
    const bytes = new TextEncoder().encode(json);
    let out = bytes, prefix = 'A1:';
    if (window.CompressionStream) {
      try {
        const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
        out = new Uint8Array(await new Response(cs).arrayBuffer());
        prefix = 'A1Z:';
      } catch (e) { out = bytes; prefix = 'A1:'; }
    }
    let bin = '';
    for (let i = 0; i < out.length; i += 0x8000) bin += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
    return prefix + btoa(bin);
  }
  async importCode(code) {
    code = (code || '').trim();
    const z = code.startsWith('A1Z:');
    if (!z && !code.startsWith('A1:')) throw new Error('Ce code ne vient pas d\'Aurore.');
    const bin = atob(code.slice(z ? 4 : 3));
    let bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (z) {
      const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      bytes = new Uint8Array(await new Response(ds).arrayBuffer());
    }
    return deserialize(JSON.parse(new TextDecoder().decode(bytes)));
  }

  // ---------- compte claude.ai ----------
  async initCloud() {
    try {
      if (!window.claude || !window.claude.use) return false;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return false;
      const uid = await user.id();
      if (!uid) return false;
      this.cloud = { db, uid };
      // récupère les villes plus récentes enregistrées sur le compte
      const metaSnap = await db.doc(`data/users/${uid}/aurore-meta`).get();
      const remote = metaSnap.exists ? metaSnap.data() : null;
      let changed = false;
      if (remote && remote.slots) {
        for (const n of SLOTS) {
          const r = remote.slots[n], l = this.meta.slots[n];
          if (r && (!l || (r.savedAt || 0) > (l.savedAt || 0))) {
            const snap = await db.doc(`data/users/${uid}/aurore-slot-${n}`).get();
            if (snap.exists) {
              const cur = readJSON(slotKey(n), null);
              if (cur) this.backupRaw(n, cur, 'avant récupération du compte');
              writeRaw(slotKey(n), JSON.stringify(snap.data()));
              this.meta.slots[n] = { ...r, thumb: (l && l.thumb) || r.thumb || null };
              changed = true;
              if (n === this.slot) this.onRemoteNewer(n);
            }
          }
        }
        if (changed) this.writeMeta();
      }
      this.setStatus('cloud');
      return changed;
    } catch (e) {
      this.cloud = null;
      return false;
    }
  }
  backupRaw(n, data, reason) {
    const list = this.backups(n);
    list.unshift({ ts: Date.now(), pop: 0, tick: data.tick || 0, reason, data: JSON.stringify(data) });
    writeRaw(bkKey(n), JSON.stringify(list.slice(0, BK_MAX)));
  }
  async pushCloud(n, data) {
    if (!this.cloud) return;
    if (this.cloudBusy) { this.cloudAgain = [n, data]; return; }
    this.cloudBusy = true;
    try {
      const { db, uid } = this.cloud;
      await db.doc(`data/users/${uid}/aurore-slot-${n}`).set(data);
      const slim = { slots: {} };
      for (const k of SLOTS) if (this.meta.slots[k]) { const { thumb, ...rest } = this.meta.slots[k]; slim.slots[k] = rest; void thumb; }
      await db.doc(`data/users/${uid}/aurore-meta`).set(slim);
      this.setStatus('cloud');
    } catch (e) {
      if (e && ['invalid_argument', 'revoked', 'not_granted'].includes(e.code)) { this.cloud = null; this.setStatus('local'); }
      else this.setStatus('error');
    }
    this.cloudBusy = false;
    if (this.cloudAgain) { const [a, b] = this.cloudAgain; this.cloudAgain = false; this.pushCloud(a, b); }
  }
  async cloudDelete(n) {
    try {
      const { db, uid } = this.cloud;
      await db.doc(`data/users/${uid}/aurore-slot-${n}`).delete();
    } catch (e) { /* ignore */ }
  }
  setStatus(st) { this.status = st; this.onStatus(st); }
}
