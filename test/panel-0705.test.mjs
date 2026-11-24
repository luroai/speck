import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, boardPage, fullViewOf } from './support/panel.mjs';

// ---------- 0705: build timers count smoothly ----------

const NOW = 1_700_000_000_000;
let clock = NOW;
const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } };
const ids = ['0901', '0902'];
// Builds started at different fractions of a second.
const offsets = { '0901': 300, '0902': 850 };
const board = () => ({ run: { on: true }, ideas: [], tickets: ids.map(id => T(id, 'building', { started: new Date(NOW - 5000 - offsets[id]).toISOString(), build_running: true, builder: 'claude' })) });
const secs = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
const shownOf = (p, v) => secs(p.all(v).find(n => n.className === 'sub').textContent);

// The full view holds one second counter at a time, so each build gets its own page. Both pages run over the same
// clock, which moves in lock step, with each page's own timer callbacks as early or late as the jitter says.
async function run(jitter) {
  clock = NOW;
  const pages = {}, views = {}, seen = {}, at = {};
  for (const id of ids) {
    pages[id] = boardPage([board()], { Date: Clock });
    await pages[id].settle();
    views[id] = await fullViewOf(pages[id], id);
    seen[id] = [shownOf(pages[id], views[id])];
    at[id] = [];
  }
  assert.notEqual(pages['0901'].byId('full-ticket'), undefined);
  const ticks = Object.fromEntries(ids.map(id => [id, [...pages[id].intervals.values()].filter(i => i.ms < 1000)]));
  for (const id of ids) assert.ok(ticks[id].length >= 1, `${id}: the counter runs on a timer shorter than a second`);
  let n = 0;
  for (let t = 0; t < 120_000; ) {
    t += ticks['0901'][0].ms;
    clock = NOW + t + jitter(n++);
    for (const id of ids) {
      for (const i of ticks[id]) i.fn();
      const s = shownOf(pages[id], views[id]);
      if (s !== seen[id].at(-1)) { seen[id].push(s); at[id].push(t); }
    }
  }
  return { seen, at };
}

for (const [name, jitter] of [['early', () => -50], ['late', () => 50], ['mixed', n => (n % 2 ? 50 : -50)]]) {
  test(`0705 AC1+AC2: builds started at different fractions of a second show every second once, in order, ticks ${name}`, async () => {
    const { seen, at } = await run(jitter);
    // 0901 is 5.3 s in and 0902 5.85 s: each changes a different fraction of a second after the other, on the clock's own whole seconds
    assert.ok(at['0902'].slice(0, 5).every((t, i) => t < at['0901'][i]), 'the build further into its second changes first');
    for (const id of ids) {
      const s = seen[id];
      for (let i = 1; i < s.length; i++) assert.equal(s[i], s[i - 1] + 1, `${id}: ${s[i - 1]} then ${s[i]}`);
      assert.ok(s.length >= 119, `${id}: ${s.length} different seconds shown`);
    }
  });
}

test('0705 AC3: a timer shows the whole seconds since its start, rounded down', async () => {
  clock = NOW;
  const p = boardPage([board()], { Date: Clock });
  await p.settle();
  const v = await fullViewOf(p, '0901');
  assert.equal(shownOf(p, v), 5); // 5.3 s since start
  clock = NOW + 699; for (const i of p.intervals.values()) i.fn();
  assert.equal(shownOf(p, v), 5); // 5.999 s
  clock = NOW + 700; for (const i of p.intervals.values()) i.fn();
  assert.equal(shownOf(p, v), 6);
});
