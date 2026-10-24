// speck's animations on its screen (0414, 0436): the page with boards to show, a clock the test moves and, when
// given, Math.random's answer and reduced motion, and what speck shows on it.
import assert from 'node:assert/strict';
import { T } from './panel.mjs';
import { screenPage, foreman, state, expected } from './screen.mjs';

// A clock the test moves, for the page's Date.
const clock = () => {
  let at = Date.parse('2026-10-23T12:00:00Z');
  const D = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  return { D, go: ms => { at += ms; } };
};
export const MIN = 60000;
export const building = () => [T('0362', 'building'), T('0363', 'building')];
// 0495: the Foreman's builds and blocked tickets are the board's, and its base branch main, unless `f` says otherwise.
export const board = (tickets, f = {}, o = {}) => state(foreman({ base: 'main', building: tickets.filter(t => ['building', 'reviewing'].includes(t.status)).map(t => t.id),
  blocked: tickets.filter(t => t.status === 'blocked').map(t => ({ id: t.id, title: '', question: '', foreman: false })), ...f }), { tickets, ...o });
// The page with its boards. `random` is a number, or a function giving Math.random's next answer. `globals`: more of
// the page's globals, such as an EventSource (0446).
export function speckPage(boards, { random = null, reduced = false, globals: more = {} } = {}) {
  const c = clock(), globals = { Date: c.D, ...more };
  if (random !== null) globals.Math = Object.assign(Object.create(Math), { random: typeof random === 'function' ? random : () => random });
  if (reduced) Object.assign(globals, { matchMedia: q => ({ matches: /reduced-motion/.test(q), addEventListener() {} }), devicePixelRatio: 1 });
  const p = screenPage(boards, globals);
  p.go = c.go;
  p.next = async () => { p.timers.shift()(); await p.settle(); }; // the next board
  return p;
}
// The caption's lit dots, under the screen's lower dotted line, and those `text` lights centred there.
export const capDots = dots => new Set(dots.filter(([, r]) => r >= 64).map(([c, r]) => `${c},${r}`));
export const capOf = text => { const W = text.length * 6 - 1; return expected(text, Math.round(80 - W / 2), 65); };
// What speck shows now: its pose, and whether the caption is `text`.
export function shows(p, pose, text, t = 1000, still = true) {
  const dots = p.draw(t, still);
  assert.equal(p.cast().cur, pose, `the pose for ${text}`);
  assert.deepEqual(capDots(dots), capOf(text), `the caption ${text}`);
}
