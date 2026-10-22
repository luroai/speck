// The Foreman's notice board (0365) on the fake page, with the real LCD renderer and frames run only when a test says.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { T, fakePage, ROOT } from './panel.mjs';

// The LCD renderer as the page loads it, from lcd.js, with the cards' builder badges, which draw on a canvas, left blank.
export const LCD = (() => { const window = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'), 'utf8'), { window, Math, Array, Object, String, Set, Uint8Array, Float32Array }); return window.SpeckLCD; })();
const PAGE_LCD = { ...LCD, badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; } };

export const foreman = (o = {}) => ({ word: 'Building 2', tone: 'ok', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
export const state = (f, o = {}) => ({ tickets: [T('0362', 'building'), T('0363', 'building'), T('0358', 'blocked')], ideas: [], run: { on: true, pid: 1 }, foreman: f, ...o });

// The page with the real renderer, frames it runs only when the test says, the reduced-motion setting and how wide the
// board is on the page (null: no layout, as on the fake page).
export function boardPage(states, { reduce = false, width = null } = {}) {
  const frames = [];
  const media = { matches: reduce, addEventListener() {} };
  const made = n => { if (width !== null) n.getBoundingClientRect = () => ({ width: /\bboard\b/.test((n.attrs || {}).class || '') ? width : 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 }); };
  const p = fakePage(states, { SpeckLCD: PAGE_LCD, requestAnimationFrame: fn => frames.push(fn), matchMedia: () => media, devicePixelRatio: 1 }, { made });
  // Runs the frames waiting, at `now` ms.
  p.frame = now => { for (const fn of frames.splice(0)) fn(now); };
  p.board = () => p.byId('run').children.find(n => n.tagName === 'svg');
  p.svg = p.board;
  p.group = () => p.all(p.svg()).find(n => n.tagName === 'g');
  p.x = () => Number(/translate\((-?\d+) 0\)/.exec(p.group().attrs.transform)[1]);
  p.name = () => p.byId('run').children.find(n => n.className === 'board-text').textContent;
  p.frames = frames;
  return p;
}
// The lit dots of a path, as "column,row".
export const dotsOf = d => new Set([...String(d).matchAll(/M(-?[\d.]+) (-?[\d.]+)h/g)].map(m => `${Math.floor(Number(m[1]))},${Math.floor(Number(m[2]))}`));
// The dots `text` should light in the 5 × 7 font, in capitals, its top a row down.
export const expected = text => {
  const out = new Set();
  [...text.toUpperCase()].forEach((ch, n) => (ch === '·' ? ['.....', '.....', '.....', '..#..', '.....', '.....', '.....'] : LCD.F5.g[ch] || []).forEach((row, r) => [...row].forEach((c, k) => { if (c === '#') out.add(`${n * 6 + k},${r + 1}`); })));
  return out;
};

export const LONG = foreman({ building: ['0362', '0363'], blocked: [{ id: '0358' }] }); // 'Building 2 · 0362 building · 0363 building · 0358 blocked'
export const LONG_W = 'Building 2 · 0362 building · 0363 building · 0358 blocked'.length * 6 - 1;
