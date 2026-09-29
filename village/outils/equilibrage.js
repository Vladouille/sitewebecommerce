/* Robot d'équilibrage de Clairval : joue la partie entière hors navigateur et affiche le jour d'arrivée dans chaque ère.
 * Usage : node village/outils/equilibrage.js [jours max] [v]   (v = détail tous les 10 jours)
 * Le robot touche la carte 40 fois par jour dans les deux premières ères, puis construit ce qui manque. */
const fs = require('fs');
// Charge la partie « simulation » du jeu (sans page, le fichier s'arrête avant l'interface)
const src = fs.readFileSync(__dirname + '/../village.js', 'utf8');
const m = { exports: {} };
new Function('module', src)(m);
const G = m.exports;
G.save = G.fresh();
const S = () => G.save;
S().intro = true;
Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
G.H.card = (k, t, txt, actions) => { /* marchand : on refuse */ };
const eraDay = {};
const MAXD = +process.argv[2] || 1500;
const verbose = process.argv[3] === 'v';
function act() {
  const s = S();
  for (let i = 0; i < 30; i++) {
    let did = false;
    for (const t of G.TOOLS) if (!s.tools[t.id] && t.era <= s.era && G.canPay(t.cost)) { G.buyTool(t.id); did = true; }
    for (const t of G.TECHS) if (t.era <= s.era && !s.techs[t.id] && G.canPay(t.cost)) { G.buyTech(t.id); did = true; }
    for (const g of G.GOALS) if (g.era <= s.era && G.goalDone(g) && !s.claimed[g.id]) G.claimGoal(g.id);
    if (G.eraReady()) { G.eraUp(); eraDay[s.era] = s.day; did = true; }
    const { prod, cons } = G.rates();
    const keys = ['water', 'food']; if (s.era >= 3) keys.push('energy');
    const hk = s.era >= 3 ? 'energy' : 'wood';
    for (const k of keys) if (prod[k] - cons[k] < 0 || s.res[k] < s.pop * 2) { const o = G.optionsFor(k).find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; }
    if (prod[hk] - cons[hk] < s.pop * 0.4) { const o = G.optionsFor(hk).find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; }
    if (s.pop >= G.housing() * 0.85) { const o = G.optionsFor('beds').find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; }
    if (G.happyTarget() < 65) { const o = G.optionsFor('happy').find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; }
    const next = G.ERAS[s.era] || { gate: { cost: {}, bld: ['portail'], pop: 0 } };
    if (next) {
      for (const id of next.gate.bld) { const b = G.BY_ID[id]; if (!G.CNT[id] && b.era <= s.era && G.canPay(G.newCost(b))) { if (G.build(id, undefined, undefined, true)) did = true; } }
      const need = { ...next.gate.cost };
      for (const id of next.gate.bld) if (!G.CNT[id] && G.BY_ID[id].era <= s.era) for (const [k, v] of Object.entries(G.newCost(G.BY_ID[id]))) need[k] = (need[k] || 0) + v;
      const maxNeed = Math.max(...Object.values(need));
      if (G.cap() < maxNeed * 1.05) { const o = G.optionsFor('store').find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; }
      for (const [k, v] of Object.entries(need)) if (s.res[k] < v && G.RES[k].era <= s.era) { const o = G.optionsFor(k).find((x) => G.canPay(x.cost) && !Object.keys(x.cost).some((c) => need[c] && s.res[c] - x.cost[c] < need[c] * 0.5 && c !== k)); if (o && G.doOption(o, true)) did = true; }
      // matières premières des métiers de transformation
      for (const j of G.JKEYS) { const J = G.JOBS[j]; if (!J.inputs || !s.jobs[j]) continue; for (const k of Object.keys(J.inputs)) if (s.res[k] < 5 || prod[k] - cons[k] < 0) { const o = G.optionsFor(k).find((x) => G.canPay(x.cost)); if (o && G.doOption(o, true)) did = true; } }
    }
    G.autoAssign(true);
    if (!did) break;
  }
}
let lastEra = 1;
function taps() {
  const s = S(); if (s.era > 2) return;
  for (let i = 0; i < 40; i++) {
    const k = ['food', 'water', 'wood', 'stone'].sort((a, b) => s.res[a] - s.res[b])[0];
    s.res[k] = Math.min(G.cap(), s.res[k] + 1 + (s.techs.t_main1 ? 2 : 0) + (s.techs.t_main2 ? 3 : 0));
  }
}
for (let d = 0; d < MAXD; d++) {
  taps(); act();
  for (let k = 0; k < 20; k++) { G.step(30 / 20); G.processQueue(); }
  const s = S();
  if (verbose && d % 10 === 0) console.log(`j${s.day} ère${s.era} pop ${s.pop}/${G.housing()} bonheur ${Math.round(s.happy)} idle ${G.idleCount()} cap ${G.fmt(G.cap())} ` + G.RKEYS.filter((k) => G.RES[k].era <= s.era).map((k) => k + ':' + G.fmt(s.res[k])).join(' '));
  if (d % 50 === 0 && s.era >= 5) {
    const nx = G.ERAS[s.era] || { gate: { cost: {}, bld: ['portail'], pop: 0 } }; if (nx) {
      const need = { ...nx.gate.cost };
      for (const id of nx.gate.bld) if (!G.CNT[id]) for (const [k, v] of Object.entries(G.newCost(G.BY_ID[id]))) need[k] = (need[k] || 0) + v;
      const { prod, cons } = G.rates();
      console.log(`  j${s.day} ère${s.era} pop ${G.fmt(s.pop)} manque: ` + Object.entries(need).filter(([k, v]) => s.res[k] < v).map(([k, v]) => `${k} ${G.fmt(s.res[k])}/${G.fmt(v)} (net ${G.fmt(prod[k] - cons[k])})`).join(', ') + ` cap ${G.fmt(G.cap())}` + (s.pop < nx.gate.pop ? ` pop<${nx.gate.pop}` : ''));
    }
  }
  if (s.era !== lastEra) { console.log(`>>> ère ${s.era} (${G.ERAS[s.era - 1].name}) au jour ${s.day}, pop ${s.pop}`); lastEra = s.era; }
  if (G.CNT.portail) { console.log('PORTAIL au jour', s.day); break; }
}
const s = S();
console.log('FIN jour', s.day, 'ère', s.era, 'pop', s.pop, 'happy', Math.round(s.happy));
const next = G.ERAS[s.era];
if (next) console.log('prochaine ère', next.name, JSON.stringify(G.gateChecks(next)), 'coût', JSON.stringify(next.gate.cost));
console.log('res', G.RKEYS.filter((k) => G.RES[k].era <= s.era).map((k) => k + ':' + G.fmt(s.res[k])).join(' '), 'cap', G.fmt(G.cap()));
const { prod, cons } = G.rates();
console.log('net', G.RKEYS.filter((k) => G.RES[k].era <= s.era).map((k) => k + ':' + G.fmt(prod[k] - cons[k])).join(' '));
console.log('bâtiments', G.BUILDINGS.filter((b) => G.CNT[b.id]).map((b) => `${b.id}:${G.CNT[b.id]}/${G.LV[b.id]}`).join(' '));
console.log('jobs', JSON.stringify(s.jobs));
