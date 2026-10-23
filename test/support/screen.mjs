// speck's screen at the top of the panel (0413) on the fake page, with the real LCD renderer drawing into a buffer of
// dots, as its Screen would on a canvas.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { T, fakePage, ROOT } from './panel.mjs';

export const LCD = (() => { const window = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'), 'utf8'), { window, Math, Array, Object, String, Set, Uint8Array, Float32Array }); return window.SpeckLCD; })();

export const foreman = (o = {}) => ({ word: 'Building 2', tone: 'ok', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
export const state = (f, o = {}) => ({ tickets: [T('0362', 'building'), T('0363', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: f, ...o });

// The page, with a Screen that keeps what the page made it with, and the cards' badges left blank. made() gives the
// screen's options, cast() speck's cast, and draw(t) the lit dots of one frame at `t`, as [column, row].
export function screenPage(states, globals = {}) {
  let made = null;
  class Screen { constructor(canvas, o) { made = { canvas, ...o }; this.dirty = true; this.still = o.still; } }
  const PAGE_LCD = { ...LCD, Screen, Cast: class extends LCD.Cast { constructor(...a) { super(...a); casts.push(this); } },
    badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; } };
  const casts = [];
  const p = fakePage(states, { SpeckLCD: PAGE_LCD, requestAnimationFrame() {}, ...globals });
  p.byId('screen').getContext = () => ({}); // a canvas
  p.made = () => made;
  p.cast = () => casts[casts.length - 1];
  p.draw = (t = 1000, still = true) => {
    const buf = { c: made.cols, r: made.rows, v: new Uint8Array(made.cols * made.rows) };
    made.draw({ still, pen: (k = 1, ox = 0, oy = 0) => new LCD.Pen(buf, k, ox, oy) }, t);
    const out = [];
    buf.v.forEach((v, n) => { if (v) out.push([n % buf.c, Math.floor(n / buf.c)]); });
    return out;
  };
  return p;
}
// The lit dots of the screen's top row, above its dotted line, as "column,row".
export const wordDots = dots => new Set(dots.filter(([, r]) => r < 11).map(([c, r]) => `${c},${r}`));
// The dots `text` lights in the 5 × 7 font with its top left at (x, y).
export const expected = (text, x, y) => {
  const out = new Set();
  [...text].forEach((ch, n) => (LCD.F5.g[ch] || []).forEach((row, r) => [...row].forEach((c, k) => { if (c === '#') out.add(`${x + n * 6 + k},${y + r}`); })));
  return out;
};
