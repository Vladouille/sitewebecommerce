import io, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

REPO = "/home/user/sitewebecommerce"
OUT = os.path.join(REPO, "logos/autoflowsite")
FONTS = {
  "caslon": f"{REPO}/assets/fonts/libre-caslon-text-latin-400-normal.woff2",
  "caslon_it": f"{REPO}/assets/fonts/libre-caslon-text-latin-400-italic.woff2",
  "inter500": "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
  "inter600": "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf",
  "inter400": "/usr/share/fonts/opentype/inter/InterDisplay-Regular.otf",
  "interd600": "/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf",
}
_cache = {}
def load(key):
    if key in _cache: return _cache[key]
    tt = TTFont(FONTS[key]); tt.flavor = None
    buf = io.BytesIO(); tt.save(buf); data = buf.getvalue()
    tt = TTFont(io.BytesIO(data))
    face = hb.Face(data); font = hb.Font(face)
    _cache[key] = (tt, font); return _cache[key]

def text(key, s, size, x, y, tracking=0.0):
    """Return (svg path d, width, capHeight) of s set at baseline y."""
    tt, font = load(key)
    upem = tt["head"].unitsPerEm; k = size / upem
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs, lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    cx = 0.0
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        tp = TransformPen(pen, (k, 0, 0, -k, x + (cx + pos.x_offset) * k, y - pos.y_offset * k))
        gs[name].draw(tp)
        cx += pos.x_advance
        if i < n - 1: cx += tracking * upem
    cap = getattr(tt["OS/2"], "sCapHeight", 0) * k
    xh = getattr(tt["OS/2"], "sxHeight", 0) * k
    return pen.getCommands(), cx * k, cap, xh

INK, PAPER, MUTED_L, MUTED_D = "#0a0a0a", "#ffffff", "#6b6b6b", "#a3a3a3"

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')

def write(name, w, h, body_fn, title):
    for theme, (ink, paper, muted) in {"clair": (INK, PAPER, MUTED_L), "sombre": (PAPER, INK, MUTED_D)}.items():
        with open(f"{OUT}/{name}-{theme}.svg", "w") as f:
            f.write(svg(w, h, body_fn(ink, paper, muted), title))

# ---------- A : Famille Autoflow (serif + triangle + SITE) ----------
def concept_a():
    pad = 20; size = 100; base = pad + 74
    d1, w1, cap, _ = text("caslon", "AUTOFLOW", size, pad, base, tracking=0.06)
    tri_h = cap * 0.52; tri_w = tri_h * 1.155
    tx = pad + w1 + 16
    tri = f"M{tx:.1f} {base:.1f}L{tx+tri_w/2:.1f} {base-tri_h:.1f}L{tx+tri_w:.1f} {base:.1f}Z"
    rule_x = tx + tri_w + 30
    s_size = 50
    _, _, s_cap, _ = text("inter600", "S", s_size, 0, 0)
    sy = base - cap / 2 + s_cap / 2
    d2, w2, _, _ = text("inter600", "SITE", s_size, rule_x + 30, sy, tracking=0.2)
    W = rule_x + 30 + w2 + pad; H = base + pad + 6
    def body(ink, paper, muted):
        return (f'<path fill="{ink}" d="{d1}"/><path fill="{ink}" d="{tri}"/>'
                f'<rect x="{rule_x:.1f}" y="{base-cap-4:.1f}" width="2" height="{cap+8:.1f}" fill="{muted}"/>'
                f'<path fill="{ink}" d="{d2}"/>')
    write("A-famille-autoflow", W, H, body, "Autoflow Site")
    # symbole seul (favicon) : A▲ dans un carré
    def icon(ink, paper, muted):
        da, wa, ca, _ = text("caslon", "A", 40, 0, 0)
        x0 = (64 - (wa + 4 + 13)) / 2; y0 = 32 + ca / 2
        da, *_ = text("caslon", "A", 40, x0, y0)
        tx2 = x0 + wa + 3
        return (f'<rect width="64" height="64" fill="{paper}"/><path fill="{ink}" d="{da}"/>'
                f'<path fill="{ink}" d="M{tx2:.1f} {y0:.1f}L{tx2+6.5:.1f} {y0-11.3:.1f}L{tx2+13:.1f} {y0:.1f}Z"/>')
    write("A-symbole", 64, 64, icon, "Autoflow Site")

# ---------- B : Fenêtre + croissance (moderne, tech) ----------
def icon_b(ox, oy, s, ink, paper, filled=False):
    # fenêtre de navigateur : cadre + barre, triangle de croissance à l'intérieur
    sw = s * 0.075; r = s * 0.14
    bar = oy + s * 0.30
    inner_top = bar; inner_bot = oy + s - sw * 1.0
    th = (inner_bot - inner_top) * 0.62; tw = th * 1.155
    cx = ox + s / 2; by = oy + s * 0.80
    tri = f"M{cx-tw/2:.2f} {by:.2f}L{cx:.2f} {by-th:.2f}L{cx+tw/2:.2f} {by:.2f}Z"
    if filled:
        return (f'<rect x="{ox}" y="{oy}" width="{s}" height="{s}" rx="{r:.2f}" fill="{ink}"/>'
                f'<rect x="{ox}" y="{bar-sw/2:.2f}" width="{s}" height="{sw:.2f}" fill="{paper}"/>'
                f'<path fill="{paper}" d="{tri}"/>')
    return (f'<rect x="{ox+sw/2:.2f}" y="{oy+sw/2:.2f}" width="{s-sw:.2f}" height="{s-sw:.2f}" rx="{r:.2f}" '
            f'fill="none" stroke="{ink}" stroke-width="{sw:.2f}"/>'
            f'<rect x="{ox+sw/2:.2f}" y="{bar-sw/2:.2f}" width="{s-sw:.2f}" height="{sw:.2f}" fill="{ink}"/>'
            f'<path fill="{ink}" d="{tri}"/>')

def concept_b():
    pad = 20; s = 112; size = 88
    _, _, _, xh = text("interd600", "a", size, 0, 0)
    base = pad + s / 2 + xh / 2
    x = pad + s + 30
    d1, w1, _, _ = text("interd600", "autoflow", size, x, base, tracking=-0.025)
    d2, w2, _, _ = text("inter400", "site", size, x + w1 + 2, base, tracking=-0.02)
    W = x + w1 + 2 + w2 + pad; H = s + 2 * pad
    def body(ink, paper, muted):
        return icon_b(pad, pad, s, ink, paper) + f'<path fill="{ink}" d="{d1}"/><path fill="{muted}" d="{d2}"/>'
    write("B-fenetre-croissance", W, H, body, "autoflowsite")
    write("B-symbole", 64, 64, lambda ink, paper, muted: icon_b(0, 0, 64, ink, paper, filled=True), "autoflowsite")

# ---------- C : Monogramme A-triangle (premium) ----------
def icon_c(ox, oy, s, ink, paper):
    r = s * 0.12
    m = s * 0.20; top = oy + s * 0.20; bot = oy + s * 0.80
    l, rgt, cx = ox + m, ox + s - m, ox + s / 2
    h = bot - top
    bar_y = top + h * 0.62; bar_h = h * 0.11
    return (f'<rect x="{ox}" y="{oy}" width="{s}" height="{s}" rx="{r:.2f}" fill="{ink}"/>'
            f'<path fill="{paper}" d="M{l:.2f} {bot:.2f}L{cx:.2f} {top:.2f}L{rgt:.2f} {bot:.2f}Z"/>'
            f'<rect x="{ox:.2f}" y="{bar_y:.2f}" width="{s:.2f}" height="{bar_h:.2f}" fill="{ink}"/>')

def concept_c():
    pad = 20; s = 112; size = 92
    _, _, cap, _ = text("caslon", "A", size, 0, 0)
    base = pad + s / 2 + cap / 2
    x = pad + s + 30
    d1, w1, _, _ = text("caslon", "Autoflow", size, x, base, tracking=0.0)
    d2, w2, _, _ = text("caslon_it", "Site", size, x + w1 + 6, base, tracking=0.0)
    W = x + w1 + 6 + w2 + pad; H = s + 2 * pad
    def body(ink, paper, muted):
        return icon_c(pad, pad, s, ink, paper) + f'<path fill="{ink}" d="{d1}"/><path fill="{ink}" d="{d2}"/>'
    write("C-monogramme", W, H, body, "Autoflow Site")
    write("C-symbole", 64, 64, lambda ink, paper, muted: icon_c(0, 0, 64, ink, paper), "Autoflow Site")

concept_a(); concept_b(); concept_c()
print("ok", sorted(os.listdir(OUT)))
