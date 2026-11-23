"""Construit la version locale du QG (sans compte, sans serveur, sans IA).

Usage : python3 outils-internes/build_local.py
Produit :
- outils-internes/qg-local.html : contenu publié comme artifact (s'ouvre dans la discussion) ;
- qg-local/index.html : la même app en fichier HTML autonome.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from sans_ia import sans_ia  # noqa: E402

app = sans_ia((HERE / 'qg-associes.html').read_text(encoding='utf-8'))
adapter = (HERE / 'qg-local-adapter.js').read_text(encoding='utf-8')


def rep(old, new):
    global app
    assert app.count(old) == 1, (old[:70], app.count(old))
    app = app.replace(old, new)


# Le runtime local s'appelle QG_RT (dans un artifact, window.claude appartient à la plateforme).
app = app.replace('window.claude', 'window.QG_RT')
adapter = adapter.replace('window.claude = Object.freeze(', 'window.QG_RT = Object.freeze(')

# Partage par copier-coller (WhatsApp, SMS, mail) : la sauvegarde s'affiche en texte à copier.
rep("""      <button type="button" class="btn block" id="exportBtn">Exporter une sauvegarde (JSON)</button>
      <button type="button" class="btn block" id="importBtn" ${ro}>Importer une sauvegarde</button>""",
    """      <p class="hint" style="margin:0">Vos notes restent sur ce téléphone. Pour les envoyer à un associé : « Copier mes données », colle-les dans WhatsApp, et lui les colle dans « Importer ». Seuls les éléments plus récents remplacent les siens ; rien n’est supprimé.</p>
      <button type="button" class="btn block" id="exportBtn">Copier mes données</button>
      <label for="pasteBox" class="lbl" style="font-size:13px;font-weight:600;color:var(--muted)">Importer les données d’un associé</label>
      <textarea class="input" id="pasteBox" rows="3" placeholder="Colle ici le texte reçu"></textarea>
      <button type="button" class="btn block" id="pasteBtn">Importer le texte collé</button>
      <button type="button" class="btn block" id="importBtn" ${ro}>Importer depuis un fichier</button>""")
rep("""  $('#importBtn').addEventListener('click', () => { const f = $('#importFile'); f.value = ''; f.click(); });""",
    """  $('#importBtn').addEventListener('click', () => { const f = $('#importFile'); f.value = ''; f.click(); });
  $('#pasteBtn').addEventListener('click', () => {
    const text = $('#pasteBox').value.trim();
    if (!text) { toast('Colle d’abord le texte reçu.'); return; }
    importText(text);
  });""")
rep("""  z.innerHTML = `<p class="msg info">Le téléchargement n’est pas possible ici. Copie le texte ci-dessous et colle-le dans une note ou un email.</p>""",
    """  try { await navigator.clipboard.writeText(json); toast('Données copiées : colle-les dans WhatsApp ou un mail.'); } catch {}
  z.innerHTML = `<p class="msg info">Si la copie automatique n’a pas marché, touche le bouton ci-dessous ou sélectionne le texte.</p>""")
# Lecture d'un fichier ou d'un texte collé : même traitement.
rep("""$('#importFile').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const z = $('#ioZone'); if (!z) return;
    let data;
    try { data = JSON.parse(String(reader.result)); }""",
    """$('#importFile').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importText(String(reader.result));
  reader.readAsText(file);
});
function importText(raw) {
  {
    const z = $('#ioZone'); if (!z) return;
    let data;
    try { data = JSON.parse(raw); }""")
rep("""      z.innerHTML = ko ? `<p class="msg err">${ok} éléments importés, ${ko} en échec. Vérifie ta connexion et relance l’import (sans risque de doublon).</p>` : `<p class="msg info">${ok} éléments importés.</p>`;
    });
  };
  reader.readAsText(file);
});""",
    """      z.innerHTML = `<p class="msg info">${ok} éléments importés ou mis à jour, ${skip} déjà à jour chez toi.</p>`;
      const pb = $('#pasteBox'); if (pb) pb.value = '';
    });
  }
}""")
# Fusion : on ne remplace un élément que si la version reçue est plus récente.
rep("""      let ok = 0, ko = 0;
      for (const it of items) {
        try { await S.db.collection(it.col).doc(it.id).set(it.body); ok++; } catch { ko++; }
        btn.textContent = 'Import… ' + (ok + ko) + ' / ' + items.length;
      }
      if (Array.isArray(data.names) && data.names.length === 3) await queueWrite('config', 'app', { names: data.names.map((n, i) => String(n || DEFAULT_NAMES[i]).slice(0, 24)) }, { now: true });""",
    """      let ok = 0, ko = 0, skip = 0;
      for (const it of items) {
        const cur = S.data[it.col] && S.data[it.col].get(it.id);
        if (cur && (cur.updatedAt || 0) >= (it.body.updatedAt || 0)) { skip++; continue; }
        try { await S.db.collection(it.col).doc(it.id).set(it.body); ok++; } catch { ko++; }
      }
      if (Array.isArray(data.names) && data.names.length === 3) await queueWrite('config', 'app', { names: data.names.map((n, i) => String(n || DEFAULT_NAMES[i]).slice(0, 24)) }, { now: true });""")
rep("""z.innerHTML = `<div class="msg info">Sauvegarde du ${esc(fmtWhen(Date.parse(data.exportedAt)))} :""",
    """z.innerHTML = `<div class="msg info">Données du ${esc(fmtWhen(Date.parse(data.exportedAt)))} :""")
rep("""Les éléments présents dans le fichier remplacent leur version actuelle ; rien n’est supprimé.</div>""",
    """Seuls les éléments plus récents que les tiens seront remplacés ; rien n’est supprimé.</div>""")
rep("<h3 style=\"font-size:16px\">Sauvegarde de secours</h3>", "<h3 style=\"font-size:16px\">Partager et sauvegarder</h3>")

assert 'window.claude' not in app

(HERE / 'qg-local.html').write_text(f"{app.split('<style>', 1)[0]}<script>\n{adapter}\n</script>\n<style>{app.split('<style>', 1)[1]}", encoding='utf-8')

title = re.search(r'<title>.*?</title>\n', app).group(0)
body = app.replace(title, '', 1).replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)
full = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#3B5BDB">
{title.strip()}
<style>
:root {{ padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }}
body {{ margin: 0; }}
[hidden] {{ display: none !important; }}
</style>
<script>
{adapter}
</script>
</head>
<body>
{body}
</body>
</html>
"""
(ROOT / 'qg-local').mkdir(exist_ok=True)
(ROOT / 'qg-local' / 'index.html').write_text(full, encoding='utf-8')
print('ok : outils-internes/qg-local.html et qg-local/index.html')
