const $ = (sel) => document.querySelector(sel);
let deals = [], filter = "all", known = new Set(), firstLoad = true;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
function ago(ts) {
  const m = Math.round((Date.now() / 1000 - ts) / 60);
  return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.round(m / 60)} h`;
}

function card(d) {
  const meta = [d.brand, d.size, d.status].filter(Boolean).join(" · ");
  return el("article", { class: "card" + (known.has(d.id) ? "" : " new") },
    el("div", { class: "photo" },
      d.photo ? el("img", { src: d.photo, alt: d.title, loading: "lazy" }) : null,
      el("span", { class: "badge " + d.kind },
        (d.kind === "error" ? "🚨 " : "🔥 ") + "-" + Math.round(d.discount * 100) + " %")),
    el("div", { class: "body" },
      el("p", { class: "title" }, d.title),
      el("div", { class: "meta" }, meta),
      el("div", { class: "price" }, euro(d.price), el("s", {}, euro(d.median))),
      el("div", { class: "meta" },
        `Médiane sur ${d.samples} annonces (${d.basis}) · ${d.search} · ${ago(d.found_at)}`)),
    el("div", { class: "actions" },
      el("a", { class: "btn buy", href: d.buy_url, target: "_blank", rel: "noopener" }, "🛒 Acheter"),
      el("a", { class: "btn", href: d.url, target: "_blank", rel: "noopener" }, "👀 Voir l'annonce"),
      el("button", { class: "btn ai", onclick: () => openResale(d) }, "✨ Créer une annonce de revente")));
}

function render() {
  const list = $("#list");
  const shown = deals.filter((d) => filter === "all" || d.kind === filter);
  list.replaceChildren(...(shown.length ? shown.map(card)
    : [el("p", { class: "empty" }, "Aucune affaire pour l'instant. Laisse la page ouverte, le bot cherche.")]));
  deals.forEach((d) => known.add(d.id));
}

function alertNew(fresh) {
  if (!fresh.length) return;
  document.title = `(${fresh.length}) Vinted Deals`;
  try {
    const ctx = new AudioContext(), o = ctx.createOscillator();
    o.frequency.value = 880; o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
  if ("Notification" in window && Notification.permission === "granted") {
    for (const d of fresh.slice(0, 3)) {
      const n = new Notification(`${d.kind === "error" ? "🚨 Erreur de prix" : "🔥 Bonne affaire"} : ${euro(d.price)}`,
        { body: `${d.title} (médiane ${euro(d.median)})`, icon: d.photo || undefined });
      n.onclick = () => window.open(d.url, "_blank");
    }
  }
}

async function refresh() {
  try {
    const r = await fetch("/api/state");
    const s = await r.json();
    const pill = $("#status");
    pill.textContent = s.status;
    pill.classList.toggle("on", /^(Scan|Analyse)/.test(s.status));
    const fresh = s.deals.filter((d) => !known.has(d.id));
    deals = s.deals;
    if (fresh.length || firstLoad) render();
    if (!firstLoad) alertNew(fresh);
    firstLoad = false;
  } catch {
    $("#status").textContent = "Bot arrêté : relance-le sur ton ordinateur";
    $("#status").classList.remove("on");
  }
}

document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
  filter = b.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  render();
}));
$("#notif").addEventListener("click", async () => {
  if (!("Notification" in window)) return alert("Ton navigateur ne gère pas les notifications.");
  const p = await Notification.requestPermission();
  $("#notif").setAttribute("aria-pressed", p === "granted");
  $("#notif").textContent = p === "granted" ? "🔔 Alertes activées" : "🔕 Alertes refusées";
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) document.title = "Vinted Deals"; });

function field(label, text) {
  const copy = el("button", { class: "copy", onclick: async () => {
    await navigator.clipboard.writeText(text); copy.textContent = "Copié ✓";
  } }, "Copier");
  return el("div", { class: "field" }, el("label", {}, label, copy), el("div", { class: "box" }, text));
}

async function openResale(d) {
  const body = $("#resale-body"), dlg = $("#resale");
  const close = el("button", { class: "btn", onclick: () => dlg.close() }, "Fermer");
  body.replaceChildren(el("h2", {}, "✨ Annonce de revente"), el("p", { class: "meta" },
    "Rédaction de l'annonce à partir de la photo et du prix du marché… (jusqu'à une minute avec l'IA locale)"), close);
  dlg.showModal();
  try {
    const r = await fetch("/api/resale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) });
    const x = await r.json();
    if (!r.ok) throw new Error(x.error || "Erreur");
    body.replaceChildren(
      el("h2", {}, "✨ Annonce de revente"),
      el("div", { class: "stats" },
        el("div", { class: "stat" }, el("b", {}, euro(x.suggested_price)), el("span", {}, "Prix conseillé")),
        el("div", { class: "stat" }, el("b", {}, euro(x.quick_sale_price)), el("span", {}, "Vente rapide")),
        el("div", { class: "stat" }, el("b", {}, euro(x.estimated_profit)), el("span", {}, "Bénéfice estimé"))),
      field("Titre", x.title),
      field("Description", x.description + (x.hashtags.length ? "\n\n" + x.hashtags.join(" ") : "")),
      field("Conseils photos", x.photo_tips.map((t) => "• " + t).join("\n")),
      el("p", { class: "meta" }, `Rédigé par : ${x.source}. Vérifie l'article reçu et complète ce qui est entre crochets avant de publier.`),
      close);
  } catch (e) {
    body.replaceChildren(el("h2", {}, "✨ Annonce de revente"),
      el("p", { class: "error-msg" }, e.message), close);
  }
}

refresh();
setInterval(refresh, 5000);
setInterval(() => { if (deals.length) render(); }, 60000);
