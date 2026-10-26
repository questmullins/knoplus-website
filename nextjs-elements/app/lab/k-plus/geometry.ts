// The K+ mark is drawn from straight strokes so a K can bend into a + and back.
// Each stroke is stored by its midpoint, angle (degrees, y down) and length, which
// lets a morph rotate strokes instead of sliding their ends in straight lines.

export type Stroke = { x: number; y: number; a: number; l: number };
export type Shape = Stroke[];

const deg = Math.PI / 180;

function between(x1: number, y1: number, x2: number, y2: number): Stroke {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
    a: Math.atan2(y2 - y1, x2 - x1) / deg,
    l: Math.hypot(x2 - x1, y2 - y1),
  };
}

// 100 x 100 box. Stem, upper arm, lower arm (the lower arm leaves the upper arm, as in Kanit).
export const K: Shape = [
  between(28, 16, 28, 84),
  between(28, 60, 74, 16),
  between(44, 45, 76, 84),
];

// Scissor: the arms close into the upright and the stem tips over into the crossbar.
export const PLUS_SCISSOR: Shape = [
  between(16, 50, 84, 50),
  between(50, 50, 50, 16),
  between(50, 84, 50, 50),
];

// Fold: the stem slides to the middle and the arms flatten out to either side.
export const PLUS_FOLD: Shape = [
  between(50, 16, 50, 84),
  between(50, 50, 84, 50),
  between(16, 50, 50, 50),
];

// Lines have no direction, so an angle and that angle +/-180 draw the same stroke.
// Pick the version of each target angle closest to where the stroke is now.
export function align(from: Shape, to: Shape): Shape {
  return to.map((t, i) => {
    const f = from[i];
    let a = t.a;
    while (a - f.a > 90.01) a -= 180;
    while (f.a - a > 90.01) a += 180;
    return { ...t, a };
  });
}

export function mix(from: Shape, to: Shape, t: number): Shape {
  return from.map((f, i) => ({
    x: f.x + (to[i].x - f.x) * t,
    y: f.y + (to[i].y - f.y) * t,
    a: f.a + (to[i].a - f.a) * t,
    l: f.l + (to[i].l - f.l) * t,
  }));
}

export function spin(shape: Shape, degrees: number, cx = 50, cy = 50): Shape {
  const c = Math.cos(degrees * deg);
  const s = Math.sin(degrees * deg);
  return shape.map((p) => ({
    x: cx + (p.x - cx) * c - (p.y - cy) * s,
    y: cy + (p.x - cx) * s + (p.y - cy) * c,
    a: p.a + degrees,
    l: p.l,
  }));
}

export function ends(p: Stroke) {
  const dx = (Math.cos(p.a * deg) * p.l) / 2;
  const dy = (Math.sin(p.a * deg) * p.l) / 2;
  return { x1: p.x - dx, y1: p.y - dy, x2: p.x + dx, y2: p.y + dy };
}

export function path(shape: Shape, scale = 1, ox = 0, oy = 0) {
  const r = (n: number) => Math.round(n * 100) / 100;
  return shape
    .map((p) => {
      const e = ends(p);
      return `M${r(ox + e.x1 * scale)} ${r(oy + e.y1 * scale)}L${r(ox + e.x2 * scale)} ${r(oy + e.y2 * scale)}`;
    })
    .join("");
}

export const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number) => {
    const c1 = 1.5;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
