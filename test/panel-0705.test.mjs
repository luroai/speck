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
const shown = (p, v) => p.all(v).find(n => n.className === 'sub').textContent;
const secs = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };

// Runs the page's counter for 120 seconds as a browser might: each callback comes up to 50 ms away from its time.
async function run(jitter) {
  clock = NOW;
  const p = boardPage([board()], { Date: Clock });
  await p.settle();
  const views = {};
  for (const id of ids) views[id] = await fullViewOf(p, id);
  const ticks = [...p.intervals.values()].filter(i => i.ms < 1000);
  assert.ok(ticks.length >= 1, 'the counter runs on a timer shorter than a second');
  const seen = Object.fromEntries(ids.map(id => [id, [secs(shown(p, views[id]))]]));
  let n = 0;
  for (let t = 0; t < 120_000; ) {
    const step = ticks[0].ms;
    t += step;
    clock = NOW + t + jitter(n++);
    for (const i of ticks) i.fn();
    for (const id of ids) { const s = secs(shown(p, views[id])); if (s !== seen[id].at(-1)) seen[id].push(s); }
  }
  return seen;
}

for (const [name, jitter] of [['early', () => -50], ['late', () => 50], ['mixed', n => (n % 2 ? 50 : -50)]]) {
  test(`0705 AC1+AC2: two builds at different fractions of a second show every second once, in order, ticks ${name}`, async () => {
    const seen = await run(jitter);
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
  assert.equal(shown(p, v), '00:05'); // 5.3 s since start
  clock = NOW + 699; for (const i of p.intervals.values()) i.fn();
  assert.equal(shown(p, v), '00:05'); // 5.999 s
  clock = NOW + 700; for (const i of p.intervals.values()) i.fn();
  assert.equal(shown(p, v), '00:06');
});
