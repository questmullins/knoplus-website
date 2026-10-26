import { K, PLUS_SCISSOR, path, type Shape } from "./geometry";

// Site palette (globals.css): --black and --white.
const ink = "#050506";
const paper = "#f6f3ec";

export type Favicon = { id: string; name: string; note: string; svg: string };

let clips = 0;

// One glyph from the 100-box strokes, trimmed to its cap height (y 16..84) so the K's arms end flat.
function glyph(shape: Shape, width: number, scale: number, ox: number, oy: number) {
  const id = `c${clips++}`;
  return `<clipPath id="${id}"><rect x="0" y="${oy + 16 * scale}" width="64" height="${68 * scale}"/></clipPath><path clip-path="url(#${id})" stroke-width="${width}" d="${path(shape, scale, ox, oy)}"/>`;
}

function tile(bg: string, fg: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><g fill="none" stroke="${fg}">${body}</g></svg>`;
}

// K and + side by side, so "K+" reads even at 16px.
const pair = () => glyph(K, 7, 0.48, -4, 8) + glyph(PLUS_SCISSOR, 5.5, 0.3, 33, 17);

// A big K with the + raised like an exponent.
const raised = () => glyph(K, 7.5, 0.54, -5, 8) + glyph(PLUS_SCISSOR, 5, 0.26, 36, 4.8);

export const favicons: Favicon[] = [
  { id: "pair-dark", name: "K+ on black", note: "Matches the dark site. Reads on light and dark browser tabs.", svg: tile(ink, paper, pair()) },
  { id: "raised-dark", name: "K with a raised +", note: "A bigger K, so it stays sharp at the smallest tab size.", svg: tile(ink, paper, raised()) },
  { id: "pair-light", name: "K+ on paper", note: "The light version, for a lighter feel in the tab strip.", svg: tile(paper, ink, pair()) },
];

// Two frames for the tab while a page is loading.
export const tabFrames = {
  k: tile(ink, paper, glyph(K, 8, 0.62, 1, 1)),
  plus: tile(ink, paper, glyph(PLUS_SCISSOR, 8, 0.62, 1, 1)),
};

export const dataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
