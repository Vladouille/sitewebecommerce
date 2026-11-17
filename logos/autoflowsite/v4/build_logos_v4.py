"""AutoflowSite v4 : logos typographiques épurés (le nom seul), carré + horizontal + favicon."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "v3", "build_logos_v3.py")).read().split("S = 512; CX = 256")[0]
os.environ.setdefault("OUT", "/home/user/sitewebecommerce/logos/autoflowsite/v4")
exec(src)

S, CX = 512, 256
def fit(fontname, wght, word, width, tracking):
    _, w, cap = shape(fontname, wght, word, 100, 0, 0, tracking)
    return 100 * width / w

def two_lines(f1, f2, l1, l2, bg, c1, c2, tr1, tr2, width=330, gap=0.34, same_width=False, ratio=1.0):
    s1 = fit(*f1, l1, width, tr1)
    s2 = fit(*f2, l2, width, tr2) if same_width else s1 * ratio
    _, w1, cap1 = shape(*f1, l1, s1, 0, 0, tr1)
    _, w2, cap2 = shape(*f2, l2, s2, 0, 0, tr2)
    total = cap1 + gap * s1 + cap2
    b1 = S/2 - total/2 + cap1; b2 = b1 + gap * s1 + cap2
    d1, *_ = shape(*f1, l1, s1, CX - w1/2, b1, tr1)
    d2, *_ = shape(*f2, l2, s2, CX - w2/2, b2, tr2)
    return f'<path fill="{c1}" d="{d1}"/><path fill="{c2}" d="{d2}"/>'

def one_line(f1, f2, a, b, c1, c2, tr, width, cx, cy, gap=0.0):
    _, wa, cap = shape(*f1, a, 100, 0, 0, tr); _, wb, _ = shape(*f2, b, 100, 0, 0, tr)
    size = 100 * width / (wa + wb + gap*100)
    _, wa, cap = shape(*f1, a, size, 0, 0, tr)
    x = cx - width/2; base = cy + cap/2
    d1, *_ = shape(*f1, a, size, x, base, tr)
    d2, *_ = shape(*f2, b, size, x + wa + gap*size, base, tr)
    return f'<path fill="{c1}" d="{d1}"/><path fill="{c2}" d="{d2}"/>', size, cap

def horizontal(name, f1, f2, a, b, c1, c2, tr, gap=0.0, H=120, title="AutoflowSite"):
    _, wa, cap = shape(*f1, a, 100, 0, 0, tr); _, wb, _ = shape(*f2, b, 100, 0, 0, tr)
    size = 100 * (H*0.6) / cap * (cap/100)  # hauteur de capitale = 60 % de H
    size = (H*0.6) / (cap/100)
    W = (wa + wb + gap*100) * size/100 + H*0.4
    body, *_ = one_line(f1, f2, a, b, c1, c2, tr, W - H*0.4, W/2, H/2, gap)
    save(name, f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')

OPTS = {
 # 1 — Marine : deux lignes, « Site » en gris-bleu
 "1-marine": dict(bg="#0B1F3A", c1="#FFFFFF", c2="#8FA6C6", light=("#0B1F3A", "#5B7699"),
                  f1=("PlusJakartaSans", 800), f2=("PlusJakartaSans", 800), l=("Autoflow", "Site"), tr=-0.03),
 # 2 — Blanc : une ligne, « site » en bleu
 "2-blanc":  dict(bg="#FFFFFF", c1="#111827", c2="#1D4ED8", light=("#111827", "#1D4ED8"),
                  f1=("Manrope", 800), f2=("Manrope", 800), l=("autoflow", "site"), tr=-0.035),
 # 3 — Anthracite : capitales, contraste gras / fin, une seule couleur de texte
 "3-anthracite": dict(bg="#1F2937", c1="#FFFFFF", c2="#FFFFFF", light=("#1F2937", "#1F2937"),
                  f1=("Outfit", 700), f2=("Outfit", 300), l=("AUTOFLOW", "SITE"), tr=0.04),
}
for k, o in OPTS.items():
    a, b = o["l"]; bg, c1, c2 = o["bg"], o["c1"], o["c2"]
    if k == "2-blanc":
        body, size, cap = one_line(o["f1"], o["f2"], a, b, c1, c2, o["tr"], 360, CX, S/2)
    elif k == "3-anthracite":
        body = two_lines(o["f1"], o["f2"], a, b, bg, c1, c2, 0.06, 0.38, width=320, gap=0.42, ratio=0.62)
    else:
        body = two_lines(o["f1"], o["f2"], a, b, bg, c1, c2, o["tr"], o["tr"], width=320, gap=0.30)
    save(f"{k}-carre.svg", tile(body, bg, "AutoflowSite"))
    # favicon / petite taille : initiales
    fa, fb = ("A", "S") if k != "2-blanc" else ("a", "s")
    fav, *_ = one_line(o["f1"], o["f2"], fa, fb, c1, c2, 0.0 if k != "3-anthracite" else 0.02, 330, CX, S/2)
    save(f"{k}-favicon.svg", tile(fav, bg, "AutoflowSite"))
    # horizontal (en-tête de site, signature, devis) : fond transparent, couleurs pour fond clair
    l1, l2 = o["light"]
    trh = o["tr"] if k != "3-anthracite" else 0.06
    gap = 0.0 if k != "3-anthracite" else 0.28
    if k == "3-anthracite":
        horizontal(f"{k}-horizontal.svg", o["f1"], o["f2"], a, b, l1, l2, trh, gap=gap)
        horizontal(f"{k}-horizontal-blanc.svg", o["f1"], o["f2"], a, b, "#FFFFFF", "#FFFFFF", trh, gap=gap)
    else:
        horizontal(f"{k}-horizontal.svg", o["f1"], o["f2"], a, b, l1, l2, trh, gap=gap)
        horizontal(f"{k}-horizontal-blanc.svg", o["f1"], o["f2"], a, b, "#FFFFFF", c2 if k == "1-marine" else "#8FB0FF", trh, gap=gap)
print("ok", sorted(os.listdir(OUT)))
