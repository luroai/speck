// The panel's builder badge drawing code (BADGE, from templates/panel.html), run in Node against a canvas that records
// what each frame draws instead of drawing it (0169).
import { page } from './panel.mjs';

// BADGE, evaluated on its own: it uses nothing but Math.
export function loadBadge() {
  const src = page().match(/const BADGE = \(\(\) => \{[\s\S]*?\n\}\)\(\);/)[0];
  const BADGE = new Function(`${src}\nreturn BADGE;`)();
  // Each colour is its own name, so a recorded mark says which colour it was drawn in.
  Object.assign(BADGE.C, { ink: 'ink', paper: 'paper', speck: 'speck', line: 'line', wait: 'wait', bad: 'bad', tile: 'tile', ok: 'ok', code: 'code' });
  return BADGE;
}

const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const at = (m, x, y) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

// A 2D context that records, in tile units ((0, 0) at the tile's top left), each circle filled or stroked and each
// character of text, with its colour, opacity and size, and each dashed stroke.
export function recorder() {
  let m = [1, 0, 0, 1, 0, 0], path = [];
  const stack = [], marks = [];
  const style = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1, lineCap: '', lineJoin: '', font: '', textAlign: '', dash: [] };
  const scale = () => Math.hypot(m[0], m[1]);
  const g = {
    marks,
    save() { stack.push({ m, style: { ...style } }); },
    restore() { const s = stack.pop(); m = s.m; Object.assign(style, s.style); },
    translate(x, y) { m = mul(m, [1, 0, 0, 1, x, y]); },
    scale(x, y) { m = mul(m, [x, 0, 0, y, 0, 0]); },
    rotate(a) { m = mul(m, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    setTransform(...a) { m = a; },
    setLineDash(d) { style.dash = d; },
    beginPath() { path = []; },
    arc(x, y, r) { path.push({ kind: 'arc', ...at(m, x, y), r: r * scale() }); },
    ellipse(x, y, rx, ry) { path.push({ kind: 'ellipse', ...at(m, x, y), rx: rx * scale(), ry: ry * Math.hypot(m[2], m[3]) }); },
    moveTo(x, y) { path.push({ kind: 'point', ...at(m, x, y) }); },
    lineTo(x, y) { path.push({ kind: 'point', ...at(m, x, y) }); },
    quadraticCurveTo(cx, cy, x, y) { path.push({ kind: 'point', ...at(m, x, y) }); },
    rect() {}, roundRect() {}, closePath() {}, clip() {}, clearRect() {},
    fill() { marks.push({ op: 'fill', colour: style.fillStyle, alpha: style.globalAlpha, path }); },
    stroke() { marks.push({ op: 'stroke', colour: style.strokeStyle, alpha: style.globalAlpha, dash: style.dash, path }); },
    fillText(text, x, y) { marks.push({ op: 'text', text, colour: style.fillStyle, alpha: style.globalAlpha, font: style.font, size: scale(), ...at(m, x, y) }); },
  };
  for (const k of Object.keys(style)) if (k !== 'dash') Object.defineProperty(g, k, { get: () => style[k], set: v => { style[k] = v; } });
  return g;
}

// Draws one frame of a pose at time t and returns what it drew.
export function frame(BADGE, pose, t) {
  const g = recorder();
  BADGE.draw(g, pose, t);
  return g.marks;
}
// The characters of code in a frame.
export const glyphs = marks => marks.filter(k => k.op === 'text' && /code|ok/.test(k.colour) && k.text !== '?');
// The builder's eye (the speck) and its body's centre, and the reviewer's eyes' centre, or null.
export const eye = marks => { const k = marks.find(k => k.op === 'fill' && k.colour === 'speck'); return k ? k.path[0] : null; };
export const body = marks => { const k = marks.find(k => k.op === 'fill' && k.colour === 'paper' && k.path[0]?.kind === 'arc' && Math.abs(k.path[0].r - 20 * .64) < .5); return k ? k.path[0] : null; };
export const reviewerEyes = marks => {
  const e = marks.filter(k => k.op === 'fill' && k.colour === 'ink' && k.path[0]?.kind === 'arc' && Math.abs(k.path[0].r - 2.4 * .64) < .2).map(k => k.path[0]);
  return e.length === 2 ? { x: (e[0].x + e[1].x) / 2, y: (e[0].y + e[1].y) / 2 } : null;
};
// The rings round characters: stroked circles in the code's colour.
export const rings = marks => marks.filter(k => k.op === 'stroke' && k.colour === 'code' && k.path[0]?.kind === 'arc').map(k => k.path[0]);
// A green tick: a dashed stroke in the green.
export const ticks = marks => marks.filter(k => k.op === 'stroke' && k.colour === 'ok' && k.dash.length);
