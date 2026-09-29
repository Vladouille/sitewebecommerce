// =====================================================================
// Aurore : petites courbes de l'onglet Statistiques (canvas)
// Une seule échelle par graphique, traits de 2 px, info-bulle au survol.
// =====================================================================
import { MONTHS } from './data.js';
import { START_YEAR, START_MONTH } from './sim.js';

export const SERIES = ['#3987e5', '#d95926', '#199e70']; // teintes validées (thème sombre)

const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), k = v / p;
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * p;
}
function monthLabel(t) { const m = Math.floor(t / 30) - 1 + START_MONTH; return `${MONTHS[((m % 12) + 12) % 12].slice(0, 4)}. ${START_YEAR + Math.floor(m / 12)}`; }

// lines : [{ name, key, color }], data : historique, unit : suffixe
export function lineChart(canvas, data, lines, { unit = '', min = null, max = null, tooltipEl = null } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 300, Hh = canvas.clientHeight || 150;
  canvas.width = W * dpr; canvas.height = Hh * dpr;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, Hh);
  const pad = { l: 46, r: 10, t: 10, b: 22 };
  const pw = W - pad.l - pad.r, ph = Hh - pad.t - pad.b;
  const css = getComputedStyle(canvas);
  const ink2 = css.getPropertyValue('--text-2').trim() || '#b8c0cc', grid = css.getPropertyValue('--grid').trim() || 'rgba(255,255,255,0.08)';
  g.font = '11px Outfit, system-ui, sans-serif';
  if (data.length < 2) {
    g.fillStyle = ink2; g.textAlign = 'center';
    g.fillText('Les courbes apparaissent après deux mois de jeu.', W / 2, Hh / 2);
    canvas.onpointermove = null;
    return;
  }
  let lo = min ?? Infinity, hi = max ?? -Infinity;
  if (min == null || max == null) for (const d of data) for (const l of lines) { const v = d[l.key]; if (v == null) continue; if (min == null) lo = Math.min(lo, v); if (max == null) hi = Math.max(hi, v); }
  if (min == null) lo = Math.min(0, lo);
  if (max == null) hi = niceMax(hi * 1.05);
  if (min == null && lo < 0) lo = -niceMax(-lo * 1.05);
  if (hi === lo) hi = lo + 1;
  const X = (i) => pad.l + (i / (data.length - 1)) * pw, Y = (v) => pad.t + ph - ((v - lo) / (hi - lo)) * ph;
  // grille légère
  g.strokeStyle = grid; g.lineWidth = 1; g.fillStyle = ink2; g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) {
    const v = lo + (hi - lo) * k / 4, y = Math.round(Y(v)) + 0.5;
    g.beginPath(); g.moveTo(pad.l, y); g.lineTo(W - pad.r, y); g.stroke();
    g.fillText(short(v) + unit, pad.l - 6, y);
  }
  if (lo < 0 && hi > 0) { g.strokeStyle = ink2; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(pad.l, Y(0)); g.lineTo(W - pad.r, Y(0)); g.stroke(); g.globalAlpha = 1; }
  g.textAlign = 'center'; g.textBaseline = 'top';
  const step = Math.max(1, Math.round(data.length / 4));
  for (let i = 0; i < data.length; i += step) g.fillText(monthLabel(data[i].t), X(i), Hh - pad.b + 6);
  // courbes
  for (const l of lines) {
    g.strokeStyle = l.color; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    data.forEach((d, i) => { const v = d[l.key] ?? 0; if (i) g.lineTo(X(i), Y(v)); else g.moveTo(X(i), Y(v)); });
    g.stroke();
    if (lines.length === 1) {
      const grd = g.createLinearGradient(0, pad.t, 0, pad.t + ph);
      grd.addColorStop(0, l.color + '38'); grd.addColorStop(1, l.color + '00');
      g.lineTo(X(data.length - 1), Y(Math.max(lo, 0))); g.lineTo(X(0), Y(Math.max(lo, 0))); g.closePath(); g.fillStyle = grd; g.fill();
    }
  }
  // info-bulle avec réticule
  const img = g.getImageData(0, 0, canvas.width, canvas.height);
  canvas.onpointerleave = () => { g.putImageData(img, 0, 0); if (tooltipEl) tooltipEl.hidden = true; };
  canvas.onpointermove = (e) => {
    const r = canvas.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad.l) / pw) * (data.length - 1));
    if (i < 0 || i >= data.length) return;
    g.putImageData(img, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const x = X(i);
    g.strokeStyle = ink2; g.globalAlpha = 0.6; g.lineWidth = 1; g.beginPath(); g.moveTo(x, pad.t); g.lineTo(x, pad.t + ph); g.stroke(); g.globalAlpha = 1;
    for (const l of lines) {
      const y = Y(data[i][l.key] ?? 0);
      g.fillStyle = css.getPropertyValue('--panel').trim() || '#161c26'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
      g.fillStyle = l.color; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    }
    if (tooltipEl) {
      tooltipEl.hidden = false;
      tooltipEl.innerHTML = `<b>${monthLabel(data[i].t)}</b>` + lines.map((l) => `<span><i style="background:${l.color}"></i>${l.name} : ${fmt(data[i][l.key] ?? 0)}${unit}</span>`).join('');
      const tx = Math.min(r.width - 170, Math.max(0, x + 10));
      tooltipEl.style.left = `${tx}px`; tooltipEl.style.top = '6px';
    }
  };
}
function short(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' M';
  if (a >= 1e4) return Math.round(v / 1e3) + ' k';
  if (a >= 1e3) return (v / 1e3).toFixed(1).replace('.', ',') + ' k';
  return Math.round(v * 10) / 10 + '';
}
