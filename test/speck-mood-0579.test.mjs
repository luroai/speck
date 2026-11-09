import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, panelRepo, freePort, startPanel, stop, raw, heldTimeouts } from './support/panel.mjs';
import { speckMood } from '../scripts/panel-summary.mjs';
import { foremanView } from '../scripts/foreman.mjs';

// ---------- 0579: speck's mood from what the pipeline is doing ----------

const FACE = path.join(ROOT, 'templates', 'speck-face.js'), MOOD = path.join(ROOT, 'templates', 'speck-mood.js');

// The script in a stand-in for the page: `globals` are what it finds there, such as requestAnimationFrame.
function load(globals = {}) {
  const make = tag => ({ tag, attrs: {}, children: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; }, replaceChildren(...c) { this.children = c; } });
  const cx = { document: { createElementNS: (ns, tag) => make(tag), createElement: make, head: { appendChild: c => c } }, Object, Number, Math, ...globals };
  vm.createContext(cx);
  for (const f of [FACE, MOOD]) vm.runInContext(fs.readFileSync(f, 'utf8'), cx);
  return { draw: cx.SpeckFace.draw, setMood: cx.SpeckMood.change, plain: cx.SpeckFace.setMood, moodBeside: cx.SpeckMood.beside, moodWatcher: cx.SpeckMood.watcher };
}
const all = (n, out = []) => { out.push(n); for (const c of n.children) all(c, out); return out; };
const part = (svg, c) => all(svg).find(n => (n.attrs.class || '').split(' ').includes(c));
const has = (svg, c) => part(svg, c) !== undefined;
// Runs each animation frame only when the test says so: frame(ms) runs what's waiting, at that time.
function frames() {
  let waiting = [];
  return { requestAnimationFrame: fn => { waiting.push(fn); return waiting.length; }, frame(at) { const due = waiting; waiting = []; for (const f of due) f(at); }, pending: () => waiting.length };
}

const on = { on: true, pid: 7 };
const record = (o = {}) => ({ lock: 7, building: [], ready: [], ...o });
const mood = (tickets, { run = on, rec = record(), fixing = 'tell', agent = null } = {}) => speckMood({ board: { tickets }, foreman: foremanView({ run, record: rec, tickets, fixing, agent }), run });
const blocked = { id: '0001', status: 'blocked', title: 'A', blocked_question: 'Which?' };

test('0579 AC1: asleep while speck run is off, whatever else is going on', () => {
  assert.equal(mood([blocked, { id: '0002', status: 'building' }], { run: { on: false } }), 'asleep');
  assert.equal(speckMood({ board: null, foreman: null, run: null }), 'asleep', 'nothing known yet');
});

test('0579 AC1: asking while anything needs you, as the bridge counts it', () => {
  assert.equal(mood([blocked, { id: '0002', status: 'building' }], { rec: record({ building: ['0002'] }) }), 'asking', 'before focused');
  assert.equal(mood([{ id: '0003', status: 'approved', auto_ship: false }]), 'asking', 'waiting at Ship');
  const agent = { running: null, waiting: [], did: [], asks: [{ id: '0004', question: 'Why?' }] };
  assert.equal(mood([{ id: '0004', status: 'ready' }], { agent }), 'asking', 'the manager\'s question');
  assert.equal(mood([{ ...blocked, foreman_will: true }]), 'watching', 'one speck will answer itself doesn\'t need you');
  assert.equal(mood([blocked], { fixing: 'off' }), 'watching', 'with watch off, a question isn\'t counted');
});

test('0579 AC1: focused while a build is building, reviewing or shipping', () => {
  assert.equal(mood([{ id: '0002', status: 'building' }], { rec: record({ building: ['0002'] }) }), 'focused');
  assert.equal(mood([{ id: '0002', status: 'reviewing' }]), 'focused', 'a build run by hand counts');
  assert.equal(mood([{ id: '0002', status: 'building' }]), 'focused');
  assert.equal(mood([{ id: '0002', status: 'approved', auto_ship: true }], { rec: record({ ship: { running: '0002', refused: [], waiting: [] } }) }), 'focused', 'the ship queue');
  assert.equal(mood([{ id: '0002', status: 'done', ship: { running: true } }]), 'focused', 'a ship started by hand');
});

test('0579 AC1: watching while it\'s idle or waiting', () => {
  assert.equal(mood([]), 'watching', 'idle');
  assert.equal(mood([{ id: '0002', status: 'ready' }], { rec: record({ ready: [{ id: '0002', kind: 'after', why: 'waiting for 0001' }] }) }), 'watching', 'waiting');
  assert.equal(mood([{ id: '0002', status: 'done' }, { id: '0003', status: 'cancelled' }]), 'watching', 'nothing but finished work');
});

test('0579 AC1: the panel sends the page the mood, and serves the script that follows it', async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    assert.equal(JSON.parse(String((await raw(panel.port, '/api/state')).body)).mood, 'asleep', 'speck run isn\'t on');
    const script = await raw(panel.port, '/speck-mood.js');
    assert.equal(script.status, 200);
    assert.equal(String(script.body), fs.readFileSync(MOOD, 'utf8'));
  } finally { await stop(panel); }
});

// A watcher and what it has told, with the clock held.
function watch() {
  const clock = heldTimeouts(), told = [], update = load(clock).moodWatcher(m => told.push(m));
  return { clock, told, update };
}
const state = (mood, tickets = [], took = []) => ({ mood, tickets, foreman: { took } });
const took = { id: '0001', title: 'A', option: 'Yes', at: '2026-11-09T10:00:00.000Z' };

test('0579 AC2: for 10 seconds after a ticket ships the mood is pleased, then it returns', () => {
  const { clock, told, update } = watch();
  update(state('focused', [{ id: '0001', status: 'approved' }]));
  assert.deepEqual([...told], ['focused']);
  update(state('watching', [{ id: '0001', status: 'done' }]));
  assert.deepEqual([...told], ['focused', 'pleased']);
  assert.equal(clock.pending(10000), 1);
  clock.rest(10000);
  assert.deepEqual([...told], ['focused', 'pleased', 'watching']);
});

test('0579 AC2: for 10 seconds after speck takes a recommendation the mood is pleased, over any other', () => {
  const { clock, told, update } = watch();
  update(state('asking'));
  update(state('asking', [], [took]));
  assert.deepEqual([...told], ['asking', 'pleased']);
  clock.rest(10000);
  assert.deepEqual([...told], ['asking', 'pleased', 'asking']);
});

test('0579 AC2: it returns to whatever the mood has become meanwhile', () => {
  const { clock, told, update } = watch();
  update(state('watching', []));
  update(state('watching', [{ id: '0001', status: 'done' }]));
  update(state('focused', [{ id: '0001', status: 'done' }]));
  assert.deepEqual([...told], ['watching', 'pleased'], 'still pleased');
  clock.rest(10000);
  assert.deepEqual([...told], ['watching', 'pleased', 'focused']);
});

test('0579 AC2: a second event starts the 10 seconds again, with only the last timer returning it', () => {
  let waits = [];
  const told = [], update = load({ setTimeout: (fn, ms) => { const w = { fn, ms }; waits.push(w); return w; }, clearTimeout: w => { waits = waits.filter(x => x !== w); } }).moodWatcher(m => told.push(m));
  update(state('watching'));
  update(state('watching', [{ id: '0001', status: 'done' }]));
  update(state('watching', [{ id: '0001', status: 'done' }, { id: '0002', status: 'done' }]));
  assert.equal(waits.length, 1, 'the first wait was dropped');
  assert.equal(waits[0].ms, 10000);
});

test('0579 AC2: what happened before the page opened, and a ship still running, don\'t count', () => {
  const { clock, told, update } = watch();
  update(state('watching', [{ id: '0001', status: 'done' }], [took]));
  update(state('watching', [{ id: '0001', status: 'done' }], [took]));
  update(state('focused', [{ id: '0001', status: 'done' }, { id: '0002', status: 'done', ship: { running: true } }], [took]));
  assert.deepEqual([...told], ['watching', 'focused']);
  assert.equal(clock.pending(10000), 0);
  update(state('watching', [{ id: '0001', status: 'done' }, { id: '0002', status: 'done', ship: { running: false } }], [took]));
  assert.deepEqual([...told], ['watching', 'focused', 'pleased'], 'it counts once it has shipped');
});

test('0579 AC2: an unusable state changes nothing, and a state with no tickets doesn\'t start the count again', () => {
  const { told, update, clock } = watch();
  for (const s of [null, undefined, 'x', {}]) update(s);
  assert.deepEqual([...told], ['watching'], 'an unknown mood draws as watching, and no state tells nothing');
  update(state('watching', [{ id: '0001', status: 'done' }]));
  update({ mood: 'watching' });
  update(state('watching', [{ id: '0001', status: 'done' }]));
  assert.equal(clock.pending(10000), 0);
  assert.doesNotThrow(() => update({ mood: '__proto__', tickets: [null, { id: '__proto__', status: 'done' }], foreman: { took: [null] } }));
});

test('0579 AC3: a face beside a ticket whose criteria changed is sheepish', () => {
  const { moodBeside } = load();
  assert.equal(moodBeside({ criteria_changed: true }, 'focused'), 'sheepish');
  assert.equal(moodBeside({ criteria_changed: false }, 'focused'), 'focused');
  for (const t of [{}, null, undefined, { criteria_changed: 'true' }]) assert.equal(moodBeside(t, 'watching'), 'watching');
});

const numbers = d => [...d.matchAll(/-?\d*\.?\d+/g)].map(m => Number(m[0]));

test('0579 AC4: the visor eases from one shape to the next, and ends on the new one', () => {
  const f = frames(), { draw, setMood } = load(f);
  const svg = draw({ mood: 'watching' }), end = draw({ mood: 'pleased' });
  const was = part(svg, 'sf-visor').attrs.d;
  setMood(svg, 'pleased');
  assert.equal(svg.attrs['data-mood'], 'pleased');
  assert.equal(svg.attrs['aria-label'], 'pleased');
  assert.equal(part(svg, 'sf-visor').attrs.d, was, 'nothing jumps before the first frame');
  f.frame(1000); f.frame(1210);
  const mid = numbers(part(svg, 'sf-visor').attrs.d), [a, b] = [numbers(was), numbers(part(end, 'sf-visor').attrs.d)];
  mid.forEach((v, i) => { if (a[i] !== b[i]) assert.ok(v > Math.min(a[i], b[i]) && v < Math.max(a[i], b[i]), `point ${i} is between: ${v}`); });
  assert.equal(part(svg, 'sf-glow').attrs.d, part(svg, 'sf-visor').attrs.d, 'the glow follows');
  f.frame(2000);
  for (const c of ['sf-visor', 'sf-glow']) for (const k of ['d', 'stroke-width', 'opacity']) assert.equal(part(svg, c).attrs[k], part(end, c).attrs[k], `${c} ${k}`);
  assert.equal(f.pending(), 0, 'and stops');
});

test('0579 AC4: a change partway through another carries on from where the visor is', () => {
  const f = frames(), { draw, setMood } = load(f), svg = draw({ mood: 'watching' }), end = draw({ mood: 'asleep' });
  setMood(svg, 'pleased');
  f.frame(0); f.frame(210);
  const part1 = part(svg, 'sf-visor').attrs.d;
  setMood(svg, 'asleep');
  f.frame(300);
  assert.equal(part(svg, 'sf-visor').attrs.d, part1, 'no jump');
  f.frame(1000);
  assert.equal(part(svg, 'sf-visor').attrs.d, part(end, 'sf-visor').attrs.d, 'the earlier change no longer draws');
  assert.equal(f.pending(), 0);
});

test('0579 AC4: setMood without an ease goes straight there', () => {
  const { draw, plain } = load(frames()), svg = draw({ mood: 'watching' }), end = draw({ mood: 'pleased' });
  plain(svg, 'pleased');
  assert.equal(part(svg, 'sf-visor').attrs.d, part(end, 'sf-visor').attrs.d);
});

test('0579 AC4: the marks are the new mood\'s, and they stay inside the glass', () => {
  const f = frames(), { draw, setMood } = load(f), svg = draw({ mood: 'asking' });
  assert.ok(has(svg, 'sf-hook'));
  setMood(svg, 'asleep');
  assert.ok(!has(svg, 'sf-hook'));
  assert.ok(has(svg, 'sf-z1'));
  const lit = part(svg, 'sf-lit').children;
  assert.equal(lit[0].attrs.class, 'sf-move');
  assert.equal(lit[lit.length - 1].attrs.class, 'sf-glass');
  setMood(svg, 'focused');
  assert.ok(!has(svg, 'sf-z1'));
});

test('0579 AC4: with reduced motion it goes straight there, and without frames too', () => {
  const f = frames();
  for (const g of [{ ...f, matchMedia: q => ({ matches: q === '(prefers-reduced-motion: reduce)' }) }, {}]) {
    const { draw, setMood } = load(g), svg = draw({ mood: 'watching' }), end = draw({ mood: 'pleased' });
    setMood(svg, 'pleased');
    assert.equal(part(svg, 'sf-visor').attrs.d, part(end, 'sf-visor').attrs.d);
    assert.equal(f.pending(), 0);
  }
});

test('0579 AC4: the same mood again, an unknown mood and a stranger\'s element are handled', () => {
  const f = frames(), { draw, setMood } = load(f), svg = draw({ mood: 'focused' });
  setMood(svg, 'focused');
  assert.equal(f.pending(), 0, 'it doesn\'t start again');
  setMood(svg, 'constructor');
  assert.equal(svg.attrs['data-mood'], 'watching');
  assert.doesNotThrow(() => setMood({}, 'pleased'));
  const small = draw({ mood: 'watching', size: 16 }), labelled = draw({ mood: 'watching', label: 'speck is on' });
  setMood(small, 'asking');
  assert.ok(!has(small, 'sf-hook'), 'too small for the question mark');
  setMood(labelled, 'focused');
  assert.equal(labelled.attrs['aria-label'], 'speck is on', 'a label it was given stays');
});
