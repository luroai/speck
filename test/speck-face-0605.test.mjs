import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './support/panel.mjs';

// ---------- 0605: speck's pleased visor is a closed eye arched upwards, not a smile ----------

const FACE = path.join(ROOT, 'templates', 'speck-face.js');

// The script in a stand-in for the page, as in the 0578 tests: what it makes is { tag, attrs, children }.
function load() {
  const added = [];
  const make = tag => ({ tag, attrs: {}, children: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; }, replaceChildren(...c) { this.children = c; } });
  const cx = { document: { createElementNS: (ns, tag) => Object.assign(make(tag), { ns }), createElement: make, head: { appendChild: c => { added.push(c); return c; } } }, Object, Number };
  vm.runInNewContext(fs.readFileSync(FACE, 'utf8'), cx);
  return { SpeckFace: cx.SpeckFace, sheet: () => added.map(s => s.textContent).join('') };
}
const all = (n, out = []) => { out.push(n); for (const c of n.children) all(c, out); return out; };
const one = (svg, c) => { const f = all(svg).filter(n => (n.attrs.class || '').split(' ').includes(c)); assert.equal(f.length, 1, `one .${c}`); return f[0]; };
const numbers = d => [...d.matchAll(/-?\d*\.?\d+/g)].map(m => Number(m[0]));
const shape = (svg, c = 'sf-visor') => {
  const n = one(svg, c), [x1, y1, cx, cy, x2, y2] = numbers(n.attrs.d);
  return { x1, y1, cx, cy, x2, y2, stroke: Number(n.attrs['stroke-width']), opacity: Number(n.attrs.opacity) };
};
// Where a quadratic curve is halfway along: its middle as drawn, not its control point.
const middle = v => ({ x: (v.x1 + 2 * v.cx + v.x2) / 4, y: (v.y1 + 2 * v.cy + v.y2) / 4 });

test('0605 AC1: the pleased visor is an arch whose middle is higher than its ends, at every size from 16 px', () => {
  const { SpeckFace } = load();
  for (const size of [16, 20, 23, 24, 44, 96, 8]) {
    const v = shape(SpeckFace.draw({ mood: 'pleased', size })), m = middle(v);
    assert.ok(m.y < v.y1 && m.y < v.y2, `at ${size} px its middle (y ${m.y}) is above both ends (y ${v.y1}, ${v.y2})`);
    assert.ok(v.cy < v.y1 && v.cy < v.y2, `at ${size} px it bends upwards, like ^`);
    assert.ok(v.x1 < m.x && m.x < v.x2, `at ${size} px its highest point is between its ends`);
    assert.equal(v.y1, v.y2, `at ${size} px its ends are level`);
  }
});

test('0605 AC2: it keeps its red, its glow and its lift every 6.5 s, and eases in and out of the other moods', () => {
  const { SpeckFace, sheet } = load();
  const svg = SpeckFace.draw({ mood: 'pleased' }), v = shape(svg), g = shape(svg, 'sf-glow');
  assert.ok(one(svg, 'sf-visor').attrs.class.split(' ').includes('sf-light'), 'the visor is the red light');
  assert.equal(v.stroke, 4);
  assert.equal(v.opacity, 1);
  assert.deepEqual({ ...g, stroke: 0 }, { ...v, stroke: 0 }, 'the glow follows the visor');
  assert.equal(g.stroke, v.stroke + 3.6, 'the glow is wider');
  assert.match(sheet(), /\.speck-face\[data-mood="pleased"\] \.sf-move \{ animation: sf-lift 6\.5s ease-in-out infinite; \}/);
  for (const other of SpeckFace.moods.filter(m => m !== 'pleased')) {
    const face = SpeckFace.draw({ mood: other }), seen = [];
    const ease = (from, to, paint) => { seen.push(from, to); paint(to); };
    SpeckFace.setMood(face, 'pleased', ease);
    assert.deepEqual(shape(face), v, `from ${other} it eases into the new arch`);
    SpeckFace.setMood(face, other, ease);
    assert.deepEqual(shape(face), shape(SpeckFace.draw({ mood: other })), `and back out to ${other}`);
    assert.equal(seen.length, 4, `both changes from ${other} go through the ease`);
  }
});

test('0605 AC3: the other five moods look as they do today', () => {
  const { SpeckFace } = load();
  const today = {
    watching: 'M -5 -25 Q 0 -25 5 -25|5|1',
    focused: 'M -3 -22 Q 0 -22 3 -22|4|1',
    sheepish: 'M -3 -19 Q 0 -20.1 3 -21.2|4|1',
    asking: 'M 0 -16.5 Q 0 -16.5 0.01 -16.5|4.6|1',
    asleep: 'M -9 -20 Q -5 -20 -1 -20|2.2|0.5',
  };
  for (const [mood, was] of Object.entries(today)) {
    const n = one(SpeckFace.draw({ mood }), 'sf-visor');
    assert.equal([n.attrs.d, n.attrs['stroke-width'], n.attrs.opacity].join('|'), was, mood);
  }
});
