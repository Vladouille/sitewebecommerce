"""AutoflowSite v5 : piste 3 (anthracite, Outfit) + une forme géométrique discrète. Carré, logo seul."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
V3 = os.environ.get("V3", os.path.join(HERE, "..", "v3", "build_logos_v3.py"))
os.environ.setdefault("OUT", "/home/user/sitewebecommerce/logos/autoflowsite/v5")
exec(open(V3).read().split("S = 512; CX = 256")[0])

S, CX = 512, 256
BG, FG = "#1F2937", "#FFFFFF"
F1, F2 = ("Outfit", 700), ("Outfit", 300)
TR1, TR2 = 0.06, 0.38
WIDTH = 320

def layout(site_extra=0.0, gap_k=0.42):
    _, w, _ = shape(*F1, "AUTOFLOW", 100, 0, 0, TR1); s1 = 100 * WIDTH / w; s2 = s1 * 0.62
    _, w1, cap1 = shape(*F1, "AUTOFLOW", s1, 0, 0, TR1)
    _, w2, cap2 = shape(*F2, "SITE", s2, 0, 0, TR2)
    gap = gap_k * s1
    total = cap1 + gap + cap2
    b1 = S/2 - total/2 + cap1; b2 = b1 + gap + cap2
    return dict(s1=s1, s2=s2, w1=w1, w2=w2, cap1=cap1, cap2=cap2, b1=b1, b2=b2, gap=gap)

def words(L, site_x=None):
    d1, *_ = shape(*F1, "AUTOFLOW", L["s1"], CX - L["w1"]/2, L["b1"], TR1)
    sx = CX - L["w2"]/2 if site_x is None else site_x
    d2, *_ = shape(*F2, "SITE", L["s2"], sx, L["b2"], TR2)
    return f'<path fill="{FG}" d="{d1}"/><path fill="{FG}" d="{d2}"/>'

def v_lignes():
    """— SITE — : deux filets qui complètent la largeur de AUTOFLOW."""
    L = layout(); y = L["b2"] - L["cap2"]/2; t = 2.6; pad = L["s2"]*0.42
    left, right = CX - L["w1"]/2, CX + L["w1"]/2
    o = words(L)
    o += R(left, y - t/2, (CX - L["w2"]/2 - pad) - left, t, 0, FG)
    o += R(CX + L["w2"]/2 + pad, y - t/2, right - (CX + L["w2"]/2 + pad), t, 0, FG)
    return o

def v_losange():
    """Un petit losange entre les deux mots."""
    L = layout(gap_k=0.62); o = words(L)
    cy = (L["b1"] + (L["b2"] - L["cap2"])) / 2; r = 6.5
    o += f'<path fill="{FG}" d="M{fmt(CX)} {fmt(cy-r)}L{fmt(CX+r)} {fmt(cy)}L{fmt(CX)} {fmt(cy+r)}L{fmt(CX-r)} {fmt(cy)}Z"/>'
    return o

def v_curseur():
    """SITE suivi d'un petit carré plein, comme le curseur d'un écran."""
    L = layout(); bw = L["cap2"]*0.52; sp = L["s2"]*TR2
    group = L["w2"] + sp + bw; sx = CX - group/2
    o = words(L, site_x=sx)
    o += R(sx + L["w2"] + sp, L["b2"] - L["cap2"], bw, L["cap2"], 0, FG)
    return o

VARIANTS = {"A-filets": v_lignes, "B-losange": v_losange, "C-curseur": v_curseur}
for k, fn in VARIANTS.items():
    save(f"autoflowsite-{k}.svg", tile(fn(), BG, "AutoflowSite"))
print("ok", sorted(os.listdir(OUT)))
