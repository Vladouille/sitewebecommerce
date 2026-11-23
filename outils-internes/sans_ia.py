"""Retire l'IA de l'app (version artifact) : la note devient une note donnée par les associés."""

NOTE_FIELD = """      <div class="field"><label for="f-score">Notre note sur 10</label><select class="input" id="f-score" data-f="score" ${ro}><option value="">Pas encore notée</option>${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => `<option value="${n}" ${String(item.score) === String(n) ? 'selected' : ''}>${n} / 10</option>`).join('')}</select><span class="hint">Une idée moyenne mérite 5. Ne vous faites pas plaisir.</span></div>
      <hr class="sep">"""

SCORE_OLD = """${typeof x.score === 'number' ? `<div class="score ${x.score >= 7 ? 'hi' : x.score >= 5 ? 'mid' : 'lo'}">${fmtScore(x.score)}<small>/10</small></div>` : '<div class="score na">Non analysée</div>'}"""
SCORE_NEW = """${scoreOf(x.score) !== null ? `<div class="score ${scoreOf(x.score) >= 7 ? 'hi' : scoreOf(x.score) >= 5 ? 'mid' : 'lo'}">${scoreOf(x.score)}<small>/10</small></div>` : '<div class="score na">Pas notée</div>'}"""


def sans_ia(app):
    def rep(old, new):
        nonlocal app
        assert app.count(old) == 1, (old[:70], app.count(old))
        app = app.replace(old, new)

    rep('      <hr class="sep">\n      <div id="analysisZone"></div>\n      <hr class="sep">', NOTE_FIELD)
    rep("const sa = typeof a.score === 'number' ? a.score : -1, sb = typeof b.score === 'number' ? b.score : -1;",
        "const sa = scoreOf(a.score) ?? -1, sb = scoreOf(b.score) ?? -1;")
    rep(SCORE_OLD, SCORE_NEW)
    rep("const who = (i) =>", "const scoreOf = (v) => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);\nconst who = (i) =>")
    rep("Ton avis sur l’idée ou sur l’analyse", "Ton avis sur l’idée")
    rep("Touche « + Idée », décris-la en 3-4 lignes, puis lance l’analyse.", "Touche « + Idée », décris-la en 3-4 lignes, puis notez-la ensemble.")
    a = app.index("/* ---------- Idées : analyse IA + commentaires ---------- */")
    b = app.index("function renderComments() {", a)
    app = app[:a] + "/* ---------- Idées : commentaires ---------- */\nfunction refreshIdeaLive() { renderComments(); }\nfunction renderAnalysisZone() {}\n\n" + app[b:]
    rep("Enregistrement impossible (' + esc(err && err.code || 'erreur') + '). Vérifie ta connexion et que ton compte a le niveau Éditeur.",
        "Enregistrement impossible (' + esc(err && err.code || 'erreur') + '). Vérifie ta connexion puis réessaie.")
    for word in ('buildPrompt', 'ANA_ERRORS', 'S.sample.json', 'renderAnalysis(', 'Analyser avec'):
        assert word not in app, word
    return app
