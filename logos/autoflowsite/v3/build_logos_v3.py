"""AutoflowSite v3 : logos carrés, objet concret (écran / site), 3 couleurs, sans slogan."""
import io, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

HERE = os.path.dirname(os.path.abspath(__file__))
FONTDIR = os.environ.get("FONTDIR", os.path.join(HERE, "fonts"))
OUT = os.environ.get("OUT", "/home/user/sitewebecommerce/logos/autoflowsite/v3")
os.makedirs(OUT, exist_ok=True)
_cache = {}
def font(name, wght):
    key = (name, wght)
    if key not in _cache:
        tt = TTFont(os.path.join(FONTDIR, name + ".ttf"))
        if "fvar" in tt: tt = instancer.instantiateVariableFont(tt, {"wght": wght})
        b = io.BytesIO(); tt.save(b); data = b.getvalue()
        _cache[key] = (TTFont(io.BytesIO(data)), hb.Font(hb.Face(data)))
    return _cache[key]

def fmt(v): return f"{v:.2f}".rstrip("0").rstrip(".")
def shape(name, wght, s, size, x, y, tracking=0.0):
    tt, f = font(name, wght); k = size / tt["head"].unitsPerEm
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties(); hb.shape(f, buf, {"kern": True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder(); pen = SVGPathPen(gs, fmt); cx = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gs[order[info.codepoint]].draw(TransformPen(pen, (k, 0, 0, -k, x + (cx + pos.x_offset) * k, y)))
        cx += pos.x_advance + tracking * tt["head"].unitsPerEm
    cx -= tracking * tt["head"].unitsPerEm
    return pen.getCommands(), cx * k, tt["OS/2"].sCapHeight * k

def name_fit(fontname, wght, cx, base, width, fg, acc, tracking=-0.02):
    """« Autoflow » + « Site » sur une ligne, centré, largeur = width."""
    _, w1, _ = shape(fontname, wght, "Autoflow", 100, 0, 0, tracking)
    _, w2, _ = shape(fontname, wght, "Site", 100, 0, 0, tracking)
    gap = 100 * 0.02
    size = 100 * width / (w1 + gap + w2)
    x = cx - width / 2
    d1, w1, cap = shape(fontname, wght, "Autoflow", size, x, base, tracking)
    d2, _, _ = shape(fontname, wght, "Site", size, x + w1 + gap * size / 100, base, tracking)
    return f'<path fill="{fg}" d="{d1}"/><path fill="{acc}" d="{d2}"/>', cap

def R(x, y, w, h, r, fill): return f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" rx="{fmt(r)}" fill="{fill}"/>'
def C(x, y, r, fill): return f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{fill}"/>'

def mini_site(ix, iy, iw, ih, fg, bg, acc, simple=False):
    """Une vraie page web en miniature : barre du navigateur, titre, texte, bouton, photo."""
    o = []
    bar = ih * 0.16
    o.append(R(ix, iy, iw, bar, 0, fg))
    for i in range(3): o.append(C(ix + bar*0.55 + i*bar*0.55, iy + bar/2, bar*0.16, bg))
    if simple:
        o.append(R(ix + iw*0.25, iy + ih*0.52, iw*0.5, ih*0.2, ih*0.1, acc)); return "".join(o)
    px, pw = ix + iw*0.08, iw*0.44
    top = iy + bar + ih*0.13; lh = ih*0.085
    o.append(R(px, top, pw, lh, lh/2, fg))
    o.append(R(px, top + lh*1.6, pw*0.72, lh, lh/2, fg))
    th = ih*0.04
    o.append(R(px, top + lh*3.4, pw*0.9, th, th/2, fg))
    o.append(R(px, top + lh*3.4 + th*2.2, pw*0.7, th, th/2, fg))
    bh = ih*0.15
    o.append(R(px, iy + ih - ih*0.11 - bh, pw*0.62, bh, bh/2, acc))
    # photo : cadre, montagnes, soleil
    fx, fy, fw, fh = ix + iw*0.58, iy + bar + ih*0.12, iw*0.34, ih - bar - ih*0.24
    o.append(R(fx, fy, fw, fh, ih*0.03, fg))
    o.append(f'<path fill="{bg}" d="M{fmt(fx+fw*0.08)} {fmt(fy+fh*0.88)}L{fmt(fx+fw*0.38)} {fmt(fy+fh*0.48)}L{fmt(fx+fw*0.56)} {fmt(fy+fh*0.70)}L{fmt(fx+fw*0.70)} {fmt(fy+fh*0.56)}L{fmt(fx+fw*0.92)} {fmt(fy+fh*0.88)}Z"/>')
    o.append(C(fx + fw*0.72, fy + fh*0.26, fw*0.11, acc))
    return "".join(o)

def monitor(cx, top, w, fg, bg, acc, simple=False):
    h = w*0.64; t = w*0.035
    x = cx - w/2
    o = [R(x, top, w, h, w*0.05, fg), R(x+t, top+t, w-2*t, h-2*t, w*0.02, bg)]
    o.append(mini_site(x+t*2, top+t*2, w-4*t, h-4*t, fg, bg, acc, simple))
    o.append(R(cx - w*0.06, top + h, w*0.12, w*0.09, 0, fg))
    o.append(R(cx - w*0.2, top + h + w*0.085, w*0.4, w*0.04, w*0.02, fg))
    return "".join(o), h + w*0.125

def phone(x, top, w, fg, bg, acc, ring):
    h = w*1.9; t = w*0.08
    o = [R(x - ring, top - ring, w + 2*ring, h + 2*ring, w*0.2 + ring, bg), R(x, top, w, h, w*0.2, fg),
         R(x+t, top+t*1.8, w-2*t, h-t*3.6, w*0.06, bg)]
    ix, iy, iw, ih = x+t*1.6, top+t*2.6, w-3.2*t, h-t*5.2
    o.append(R(ix, iy, iw, ih*0.34, ih*0.02, fg))                                   # photo
    o.append(C(ix + iw*0.72, iy + ih*0.1, iw*0.09, acc))
    o.append(R(ix, iy + ih*0.42, iw*0.9, ih*0.06, ih*0.03, fg))                     # titre
    o.append(R(ix, iy + ih*0.53, iw*0.6, ih*0.06, ih*0.03, fg))
    o.append(R(ix, iy + ih*0.80, iw, ih*0.12, ih*0.06, acc))                         # bouton
    return "".join(o)

def laptop(cx, top, w, fg, bg, acc):
    h = w*0.62; t = w*0.035; x = cx - w/2
    o = [R(x, top, w, h, w*0.04, fg), R(x+t, top+t, w-2*t, h-2*t, w*0.015, bg)]
    o.append(mini_site(x+t*2, top+t*2, w-4*t, h-4*t, fg, bg, acc))
    bw, bh = w*1.18, w*0.055
    o.append(f'<path fill="{fg}" d="M{fmt(cx-bw/2)} {fmt(top+h+bh*0.1)}H{fmt(cx+bw/2)}V{fmt(top+h+bh*0.55)}Q{fmt(cx+bw/2)} {fmt(top+h+bh)} {fmt(cx+bw/2-bh)} {fmt(top+h+bh)}H{fmt(cx-bw/2+bh)}Q{fmt(cx-bw/2)} {fmt(top+h+bh)} {fmt(cx-bw/2)} {fmt(top+h+bh*0.55)}Z"/>')
    o.append(R(cx - w*0.09, top+h+bh*0.1, w*0.18, bh*0.35, bh*0.17, bg))
    return "".join(o), h + bh

def cursor(x, y, s, fill, outline):
    k = s / 20.0
    pts = [(0,0),(0,17),(4.4,13.2),(7.3,19.6),(10.1,18.4),(7.3,12.2),(13,12.2)]
    d = "M" + "L".join(f"{fmt(x+px*k)} {fmt(y+py*k)}" for px, py in pts) + "Z"
    return (f'<path d="{d}" fill="{outline}" stroke="{outline}" stroke-width="{fmt(3.2*k)}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{fill}"/>')

def tile(body, bg, title, S=512):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" role="img" aria-label="{title}">'
            f'<title>{title}</title><rect width="{S}" height="{S}" fill="{bg}"/>{body}</svg>\n')

def save(name, content):
    with open(os.path.join(OUT, name), "w") as f: f.write(content)

S = 512; CX = 256
# Le contenu reste dans le cercle inscrit (Instagram, Google, WhatsApp recadrent en rond).
OPTIONS = {
  "1-ecran":        dict(bg="#14213D", fg="#FFFFFF", acc="#FCA311", font=("PlusJakartaSans", 800)),
  "2-ecran-mobile": dict(bg="#0D4D40", fg="#FFFFFF", acc="#6EE7B7", font=("Manrope", 800)),
  "3-portable-clic":dict(bg="#FFFFFF", fg="#1E1B4B", acc="#FF5A4E", font=("Sora", 700)),
}
for key, o in OPTIONS.items():
    bg, fg, acc = o["bg"], o["fg"], o["acc"]
    if key == "1-ecran":
        art, h = monitor(CX, 118, 250, fg, bg, acc)
        fav, _ = monitor(CX, 118, 330, fg, bg, acc, simple=True)
    elif key == "2-ecran-mobile":
        m, h = monitor(CX - 22, 118, 236, fg, bg, acc)
        art = m + phone(CX + 74, 168, 62, fg, bg, acc, ring=9)
        fav, _ = monitor(CX, 118, 330, fg, bg, acc, simple=True)
    else:
        art, h = laptop(CX, 128, 232, fg, bg, acc)
        # curseur sur le bouton du mini-site
        art += cursor(CX - 52, 128 + 232*0.62 - 52, 52, fg, bg)
        fav, _ = laptop(CX, 150, 300, fg, bg, acc)
    text, cap = name_fit(*o["font"], CX, 392, 330, fg, acc)
    save(f"{key}.svg", tile(art + text, bg, "AutoflowSite"))
    save(f"{key}-favicon.svg", tile(fav, bg, "AutoflowSite"))
print("ok", sorted(os.listdir(OUT)))
