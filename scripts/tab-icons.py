"""Tab icons: the section's first letter in Kanit Medium (the KNO+ logo font) followed by a +.

    pip install fonttools pillow
    python3 scripts/tab-icons.py

Writes nextjs-elements/public/icons/<letter>-plus.svg plus PNGs for iOS and the Annex app.
Downloads Kanit Medium from Google Fonts (OFL) each run, so nothing extra is kept in the repo.
"""
import io
import re
import urllib.request
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "nextjs-elements" / "public"
INK, PAPER = "#050506", "#f6f3ec"   # globals.css --black and --white
SECTIONS = {"k": "K", "a": "A", "r": "R", "w": "W", "c": "C"}

css = urllib.request.urlopen("https://fonts.googleapis.com/css2?family=Kanit:wght@500").read().decode()
url = re.findall(r"url\((https://[^)]+\.ttf)\)", css)[-1]
font = TTFont(io.BytesIO(urllib.request.urlopen(url).read()))
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
CAP = 644  # Kanit cap height


class Flat(BasePen):
    """Outline as lists of points, curves flattened, for the PNGs."""

    def __init__(self, gs):
        super().__init__(gs)
        self.contours, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, 9):
            t = i / 8
            self.cur.append(tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3)))

    def _closePath(self):
        self.contours.append(self.cur)
        self.cur = []


def layout(letter):
    """Letter then +, as (glyph name, x offset) in font units, with the pair's width."""
    a, p = cmap[ord(letter)], cmap[ord("+")]
    return [(a, 0), (p, glyphs[a].width - 30)], glyphs[a].width - 30 + glyphs[p].width


def ink_box(parts):
    xs, ys = [], []
    for name, dx in parts:
        pen = Flat(glyphs)
        glyphs[name].draw(pen)
        for c in pen.contours:
            xs += [x + dx for x, _ in c]
            ys += [y for _, y in c]
    return min(xs), max(xs), min(ys), max(ys)


def fit(parts, box, size):
    """Scale and offset so the ink fills `box` (fraction of the tile) and sits centred on the cap height."""
    x0, x1, _, _ = ink_box(parts)
    s = min(size * box / (x1 - x0), size * box * 0.8 / CAP)
    ox = size / 2 - (x0 + x1) / 2 * s
    oy = size / 2 + CAP / 2 * s   # y flips: font baseline lands here
    return s, ox, oy


def svg(letter):
    parts, _ = layout(letter)
    s, ox, oy = fit(parts, 0.78, 64)
    paths = []
    for name, dx in parts:
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        paths.append(f'<path transform="translate({ox + dx * s:.2f} {oy:.2f}) scale({s:.5f} {-s:.5f})" d="{pen.getCommands()}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{INK}"/>'
            f'<g fill="{PAPER}">{"".join(paths)}</g></svg>\n')


def png(letter, size, box=0.78, rounded=False):
    parts, _ = layout(letter)
    s, ox, oy = fit(parts, box, size * 4)
    n = size * 4
    img = Image.new("RGB", (n, n), INK)
    mask = Image.new("L", (n, n), 0)
    for name, dx in parts:
        pen = Flat(glyphs)
        glyphs[name].draw(pen)
        for c in pen.contours:   # counters (A, R) cut out by xor-ing each contour
            m = Image.new("L", (n, n), 0)
            ImageDraw.Draw(m).polygon([(ox + (x + dx) * s, oy - y * s) for x, y in c], fill=255)
            mask = ImageChops.logical_xor(mask.convert("1"), m.convert("1")).convert("L")
    img.paste(Image.new("RGB", (n, n), PAPER), mask=mask)
    return img.resize((size, size), Image.LANCZOS)


for key, letter in SECTIONS.items():
    (ROOT / "icons" / f"{key}-plus.svg").write_text(svg(letter))
png("K", 180).save(ROOT / "icons" / "k-plus-180.png")
png("A", 192).save(ROOT / "annex" / "icon-192.png")
png("A", 512).save(ROOT / "annex" / "icon-512.png")
png("A", 512, box=0.5).save(ROOT / "annex" / "icon-maskable-512.png")   # stays inside Android's safe circle
(ROOT / "annex" / "icon.svg").write_text(svg("A"))
print("done")
