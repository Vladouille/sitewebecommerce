import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_logos.py")).read().split("concept_a(); concept_b(); concept_c()")[0])

ACCENT = "#2B47F5"   # bleu cobalt : confiance + technique
THEMES = {"clair": (INK, PAPER, ACCENT), "sombre": (PAPER, INK, "#6F86FF")}
def write3(name, w, h, body_fn, title):
    if SUFFIX and "symbole" in name or SUFFIX and "favicon" in name: return
    for theme, (ink, paper, acc) in THEMES.items():
        with open(f"{OUT}/{name}{SUFFIX}-{theme}.svg", "w") as f:
            f.write(svg(w, h, body_fn(ink, paper, acc), title))

def cursor(x, y, s, fill, outline):
    # flèche de souris, pointe en (x, y), hauteur s
    k = s / 20.0
    pts = [(0,0),(0,17),(4.4,13.2),(7.3,19.6),(10.1,18.4),(7.3,12.2),(13,12.2)]
    d = "M" + "L".join(f"{x+px*k:.2f} {y+py*k:.2f}" for px, py in pts) + "Z"
    return (f'<path d="{d}" fill="{outline}" stroke="{outline}" stroke-width="{2.6*k:.2f}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{fill}"/>')

TAG = True
SUFFIX = ''
def wordmark(x, base, size, ink, acc, tagline=None):
    tagline = TAG if tagline is None else tagline
    d1, w1, cap, _ = text("caslon", "Autoflow", size, x, base)
    d2, w2, _, _ = text("caslon_it", "Site", size, x + w1 + size*0.06, base)
    out = f'<path fill="{ink}" d="{d1}"/><path fill="{acc}" d="{d2}"/>'
    W = w1 + size*0.06 + w2
    if tagline:
        ts = size * 0.20
        d3, w3, _, _ = text("inter600", "CRÉATION DE SITES WEB", ts, x + 2, base + size*0.42, tracking=0.32)
        out += f'<path fill="{ink}" d="{d3}"/>'
        W = max(W, w3)
    return out, W, cap

# ---------- D : Fenêtre-A (navigateur + monogramme + curseur) ----------
def icon_d(ox, oy, s, ink, paper, acc, detail=True):
    r = s*0.13; chrome = s*0.24
    out = f'<rect x="{ox}" y="{oy}" width="{s}" height="{s}" rx="{r:.2f}" fill="{ink}"/>'
    # barre de navigateur : trait + 3 pastilles (la 3e en accent)
    out += f'<rect x="{ox}" y="{oy+chrome:.2f}" width="{s}" height="{s*0.035:.2f}" fill="{paper}"/>'
    if detail:
        for i in range(3):
            c = acc if i == 2 else paper
            out += f'<circle cx="{ox+s*(0.17+i*0.11):.2f}" cy="{oy+chrome/2+s*0.01:.2f}" r="{s*0.033:.2f}" fill="{c}"/>'
    top, bot = oy + chrome + s*0.13, oy + s*0.86
    m = s*0.22; l, rg, cx = ox+m, ox+s-m, ox+s/2
    h = bot - top
    out += f'<path fill="{paper}" d="M{l:.2f} {bot:.2f}L{cx:.2f} {top:.2f}L{rg:.2f} {bot:.2f}Z"/>'
    out += f'<rect x="{ox:.2f}" y="{top+h*0.60:.2f}" width="{s:.2f}" height="{h*0.12:.2f}" fill="{ink}"/>'
    if detail:
        out += cursor(ox+s*0.66, oy+s*0.66, s*0.30, acc, ink)
    return out

def concept_d():
    pad, s, size = 20, 120, 84
    x = pad + s + 30
    _, _, cap, _ = text("caslon", "A", size, 0, 0)
    base = pad + s*0.50 + cap*0.25
    def body(ink, paper, acc):
        wm, W, _ = wordmark(x, base, size, ink, acc)
        return icon_d(pad, pad, s, ink, paper, acc) + wm
    _, Wm, _ = wordmark(x, base, size, INK, ACCENT)
    write3("D-fenetre-A", x + Wm + pad, s + 2*pad, body, "AutoflowSite, création de sites web")
    write3("D-symbole", 64, 64, lambda i,p,a: icon_d(0,0,64,i,p,a), "AutoflowSite")
    write3("D-favicon", 64, 64, lambda i,p,a: icon_d(0,0,64,i,p,a,detail=False), "AutoflowSite")

# ---------- E : Balise </A> (code) ----------
def concept_e():
    pad, size = 20, 84
    bs = 120  # taille des chevrons
    _, wl, capb, _ = text("inter400", "<", bs, 0, 0)
    _, wa, capA, _ = text("caslon", "A", bs*0.95, 0, 0)
    base_icon = pad + bs*0.78
    dl, wl, _, _ = text("inter400", "<", bs, pad, base_icon)
    ax = pad + wl + 4
    # A remplacé par le triangle barré, hauteur = capitale
    th = capA; tw = th*1.0
    ty = base_icon
    tri = f"M{ax:.2f} {ty:.2f}L{ax+tw/2:.2f} {ty-th:.2f}L{ax+tw:.2f} {ty:.2f}Z"
    bar_y = ty - th*0.40; bar_h = th*0.12
    dr, wr, _, _ = text("inter400", "/>", bs, ax + tw + 6, base_icon)
    icon_w = (ax + tw + 6 + wr) - pad
    x = pad + icon_w + 34
    _, _, cap, _ = text("caslon", "A", size, 0, 0)
    base = base_icon - capb*0.5 + cap*0.25
    def body(ink, paper, acc):
        wm, W, _ = wordmark(x, base, size, ink, acc)
        return (f'<path fill="{acc}" d="{dl}"/><path fill="{ink}" d="{tri}"/>'
                f'<rect x="{ax-2:.2f}" y="{bar_y:.2f}" width="{tw+4:.2f}" height="{bar_h:.2f}" fill="{paper}"/>'
                f'<path fill="{acc}" d="{dr}"/>' + wm)
    _, Wm, _ = wordmark(x, base, size, INK, ACCENT)
    write3("E-balise", x + Wm + pad, base_icon + pad + (26 if TAG else 0), body, "AutoflowSite, création de sites web")

# ---------- F : A dont la barre est un bouton cliqué ----------
def icon_f(ox, oy, s, ink, paper, acc, detail=True, bg=True):
    out = f'<rect x="{ox}" y="{oy}" width="{s}" height="{s}" rx="{s*0.13:.2f}" fill="{paper if not bg else ink}"/>' 
    fg = paper if bg else ink
    top, bot = oy + s*0.14, oy + s*0.86
    m = s*0.18; l, rg, cx = ox+m, ox+s-m, ox+s/2
    h = bot - top
    out += f'<path fill="{fg}" d="M{l:.2f} {bot:.2f}L{cx:.2f} {top:.2f}L{rg:.2f} {bot:.2f}Z"/>'
    by = top + h*0.56; bh = h*0.17; bw = s*0.60
    bx = cx - bw/2
    # gorge autour du bouton
    out += f'<rect x="{bx-s*0.035:.2f}" y="{by-s*0.035:.2f}" width="{bw+s*0.07:.2f}" height="{bh+s*0.07:.2f}" rx="{(bh+s*0.07)/2:.2f}" fill="{ink if bg else paper}"/>'
    out += f'<rect x="{bx:.2f}" y="{by:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh/2:.2f}" fill="{acc}"/>'
    if detail:
        out += cursor(cx + bw*0.18, by + bh*0.45, s*0.30, fg, ink if bg else paper)
    return out

def concept_f():
    pad, s, size = 20, 120, 84
    x = pad + s + 30
    _, _, cap, _ = text("caslon", "A", size, 0, 0)
    base = pad + s*0.50 + cap*0.25
    def body(ink, paper, acc):
        wm, W, _ = wordmark(x, base, size, ink, acc)
        return icon_f(pad, pad, s, ink, paper, acc) + wm
    _, Wm, _ = wordmark(x, base, size, INK, ACCENT)
    write3("F-bouton-A", x + Wm + pad, s + 2*pad, body, "AutoflowSite, création de sites web")
    write3("F-symbole", 64, 64, lambda i,p,a: icon_f(0,0,64,i,p,a), "AutoflowSite")
    write3("F-favicon", 64, 64, lambda i,p,a: icon_f(0,0,64,i,p,a,detail=False), "AutoflowSite")


def icon_e(ox, oy, s, ink, paper, acc):
    out = f'<rect x="{ox}" y="{oy}" width="{s}" height="{s}" rx="{s*0.13:.2f}" fill="{ink}"/>'
    cy = oy + s*0.5; sw = s*0.075; a = s*0.13
    for x0, dirn in ((ox+s*0.10, 1), (ox+s*0.90, -1)):
        out += (f'<path d="M{x0+dirn*a:.2f} {cy-a*1.2:.2f}L{x0:.2f} {cy:.2f}L{x0+dirn*a:.2f} {cy+a*1.2:.2f}" fill="none" '
                f'stroke="{acc}" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round"/>')
    th = s*0.46; tw = th; cx = ox + s/2; bot = cy + th/2
    out += f'<path fill="{paper}" d="M{cx-tw/2:.2f} {bot:.2f}L{cx:.2f} {bot-th:.2f}L{cx+tw/2:.2f} {bot:.2f}Z"/>'
    out += f'<rect x="{cx-tw/2:.2f}" y="{bot-th*0.40:.2f}" width="{tw:.2f}" height="{th*0.12:.2f}" fill="{ink}"/>'
    return out
write3("E-symbole", 64, 64, lambda i,p,a: icon_e(0,0,64,i,p,a), "AutoflowSite")
concept_d(); concept_e(); concept_f()
TAG = False; SUFFIX = "-compact"
concept_d(); concept_e(); concept_f()
print("ok")
