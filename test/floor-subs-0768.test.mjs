import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0768: your subscriptions on the factory floor, under the line: each agent with a usage reading, its tightest window's
// share used as a number and a segmented gauge in its agent's colour, when it resets and how many stations across all
// projects run on it. What speck serve gives is checked by calling it; what the page draws, on fakePage's DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stoppedClock } from './support/panel.mjs';
import { panelsHere, ask } from './support/serve-front.mjs';
import { floorPage, floorPanel, floorFront } from './support/floor.mjs';
import { byClass, classes, textOf, nodes, lineAnswer, lineOf, quietLine, NOW, run } from './support/floor-line.mjs';
import { floorUsage } from '../scripts/subscriptions.mjs';
import { floorAnswer, floorBoards } from '../scripts/serve-floor.mjs';
import { saveUsage } from '../scripts/agent-usage.mjs';

const at = mins => new Date(NOW + mins * 60000).toISOString();
const claude = (five, week, o = {}) => ({ read_at: at(-4), windows: { five_hour: { used_percent: five, resets_at: at(90), refused: false }, seven_day: { used_percent: week, resets_at: at(3 * 1440), refused: false } }, ...o });
const codex = (five, week, o = {}) => ({ read_at: at(-2), windows: { five_hour: { used_percent: five, resets_at: at(200) }, seven_day: { used_percent: week, resets_at: at(5000) } }, ...o });
const sub = (o = {}) => ({ id: 'claude', name: 'Claude Code', label: 'Week', used_percent: 42, resets_at: at(135), resets_on: null, high: false, limited: false, ...o });

const subsOf = p => byClass(p.byId('subs'), 'sub');
const subFacts = s => ({ name: textOf(s, 'sub-name'), window: textOf(s, 'sub-window'), n: textOf(s, 'sub-n'), resets: textOf(s, 'sub-resets'), feeding: textOf(s, 'sub-feeding'), warn: textOf(s, 'sub-warn') });
const litOf = s => byClass(s, 'sub-seg').map(x => classes(x).includes('on'));
const agentOf = s => ['claude', 'codex', 'cursor', 'other'].find(a => classes(s).includes(`agent-${a}`)) || null;
const open = async (usage, o = {}) => { const p = floorPage([{ ...lineAnswer(o), usage }], { Date: stoppedClock(NOW) }); await p.settle(); return p; };

// ---------- AC1: name, share of the tightest window, gauge in the agent's colour, reset ----------

test('0768 AC1: speck serve gives each agent with a reading its tightest window: the one most used, with its reset', () => {
  const got = floorUsage({ claude: claude(30, 64), codex: codex(71, 12) }, NOW);
  assert.deepEqual(got.map(u => [u.id, u.name, u.label, u.used_percent, u.resets_at, u.high, u.limited]),
    [['claude', 'Claude Code', 'Week', 64, at(3 * 1440), false, false], ['codex', 'Codex', '5 hours', 71, at(200), false, false]]);
  const cursor = { read_at: at(-1), resets_on: '2026-12-01', windows: { included: { used_percent: 18 }, auto: { used_percent: 7 } } };
  assert.deepEqual(floorUsage({ cursor }, NOW).map(u => [u.name, u.label, u.used_percent, u.resets_at, u.resets_on]), [['Cursor', 'Month', 18, null, '2026-12-01']], 'a day it resets on, when it gives no time');
});

test('0768 AC1: a window whose reset has passed is left out of the choice, as it has reset since', () => {
  const r = claude(20, 40, { windows: { five_hour: { used_percent: 99, resets_at: at(-5) }, seven_day: { used_percent: 40, resets_at: at(600) } } });
  assert.deepEqual(floorUsage({ claude: r }, NOW).map(u => [u.label, u.used_percent]), [['Week', 40]]);
});

test('0768 AC1: the floor\'s answer carries the subscriptions from the readings it\'s given, and none without', async () => {
  const listed = [{ folder: '/x/alpha', name: 'alpha', port: null }], boards = floorBoards({ wait: 20 });
  assert.deepEqual((await floorAnswer({ listed, live: new Set(), via: 1, boards, readings: { claude: claude(10, 55) }, now: NOW })).usage.map(u => [u.id, u.used_percent]), [['claude', 55]]);
  assert.deepEqual((await floorAnswer({ listed, live: new Set(), via: 1, boards, now: NOW })).usage, []);
  assert.deepEqual((await floorAnswer({ listed, live: new Set(), via: 1, boards, readings: 'junk', now: NOW })).usage, [], 'readings it can\'t read give none');
});

test('0768 AC1: speck serve\'s /api/floor reads the readings each project on the list keeps', async t => {
  const dir = panelsHere(), folder = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0768-'));
  fs.mkdirSync(path.join(folder, 'speck'));
  assert.ok(saveUsage(folder, 'codex', { read_at: new Date().toISOString(), windows: { five_hour: { used_percent: 33, resets_at: new Date(Date.now() + 3600e3).toISOString() } } }));
  const a = await floorPanel(dir, 'alpha');
  t.after(() => a.stop());
  const f = await floorFront(t, dir, () => [{ folder, name: 'alpha', port: a.port }]);
  const body = JSON.parse((await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: f.origin })).body);
  assert.deepEqual(body.usage.map(u => [u.id, u.name, u.label, u.used_percent]), [['codex', 'Codex', '5 hours', 33]]);
});

test('0768 AC1: under the line, the floor shows each subscription\'s name, share used, a segmented gauge in its agent\'s colour and when it resets', async () => {
  const p = await open([sub(), sub({ id: 'codex', name: 'Codex', label: '5 hours', used_percent: 7.4, resets_at: at(40) }),
    sub({ id: 'cursor', name: 'Cursor', label: 'Month', used_percent: 50, resets_at: null, resets_on: '2026-12-01' })]);
  const html = fs.readFileSync(new URL('../templates/floor.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('id="line"') < html.indexOf('id="subs"') && html.indexOf('id="subs"') < html.indexOf('id="stations"'), 'under the line, above the stations');
  const [c, x, u] = subsOf(p);
  assert.deepEqual(subFacts(c), { name: 'Claude Code', window: 'Week', n: '42', resets: 'Resets in 2 h 15 min', feeding: 'Feeding 2 stations', warn: null });
  assert.deepEqual(litOf(c), Array.from({ length: 20 }, (_, i) => i < 8), '42% lights 8 of its 20 segments');
  assert.equal(agentOf(c), 'claude');
  assert.equal(byClass(c, 'sub-gauge')[0].attrs['aria-valuenow'], '42');
  assert.deepEqual([subFacts(x).n, subFacts(x).resets, agentOf(x)], ['7', 'Resets in 40 min', 'codex']);
  assert.deepEqual([subFacts(u).resets, agentOf(u)], ['Resets 1 Dec', 'cursor']);
  const q = await open([sub({ resets_at: null, resets_on: '2026-12-45' }), sub({ id: 'codex', name: 'Codex', resets_at: at(3 * 1440 + 30) })]);
  assert.deepEqual(subsOf(q).map(s => textOf(s, 'sub-resets')), ['Reset not known', 'Resets 29 Nov']);
});

// ---------- AC2: how many stations it's feeding ----------

test('0768 AC2: each says how many stations across all projects run on it now, from their lines', async () => {
  const bravo = { ...quietLine(), work: [run('0201', 'builder', { agent: 'codex', agent_name: 'Codex' }), run('0202', 'reviewer', { agent: 'claude-subagent' })] };
  const p = await open([sub(), sub({ id: 'codex', name: 'Codex' }), sub({ id: 'cursor', name: 'Cursor' })], { bravo });
  // alpha: Claude Code on 0101 and 0103, Cursor on 0102, Codex on 0104; bravo: Codex on 0201, a Claude subagent on 0202
  assert.deepEqual(subsOf(p).map(s => textOf(s, 'sub-feeding')), ['Feeding 3 stations', 'Feeding 2 stations', 'Feeding 1 station']);
  const q = await open([sub()], { alpha: lineOf({ work: [] }) });
  assert.equal(textOf(subsOf(q)[0], 'sub-feeding'), 'Feeding 0 stations', 'none while nothing runs on it');
});

// ---------- AC3: orange from 90% or limited; none without a reading ----------

test('0768 AC3: at 90% or more, or limited, its gauge and number turn orange and it says so', async () => {
  const p = await open([sub({ used_percent: 89.4 }), sub({ id: 'codex', name: 'Codex', used_percent: 90, high: true }), sub({ id: 'cursor', name: 'Cursor', used_percent: 30, high: true, limited: true })]);
  const [calm, high, limited] = subsOf(p);
  assert.ok(!classes(calm).includes('high'));
  assert.equal(textOf(calm, 'sub-warn'), null);
  assert.ok(classes(high).includes('high'), 'orange at 90%');
  assert.equal(textOf(high, 'sub-warn'), 'Nearly used up');
  assert.ok(classes(limited).includes('high'), 'orange when limited, under 90% too');
  assert.equal(textOf(limited, 'sub-warn'), 'Limited');
  const css = fs.readFileSync(new URL('../templates/floor.css', import.meta.url), 'utf8');
  assert.match(css, /\.sub\.high\s*\{[^}]*--agent:\s*var\(--signal\)/, 'its gauge\'s lit segments turn orange');
  assert.match(css, /\.sub\.high \.sub-n[^{]*\{[^}]*color:\s*var\(--signal\)/, 'its number turns orange');
});

test('0768 AC3: speck serve marks a window at 90% or more, or limited, as high, and a limited one as the tightest', () => {
  assert.deepEqual(floorUsage({ claude: claude(91, 20) }, NOW).map(u => [u.label, u.high, u.limited]), [['5 hours', true, false]]);
  const r = claude(20, 95, { windows: { five_hour: { used_percent: 20, resets_at: at(30), refused: true }, seven_day: { used_percent: 95, resets_at: at(900) } } });
  assert.deepEqual(floorUsage({ claude: r }, NOW).map(u => [u.label, u.used_percent, u.high, u.limited]), [['5 hours', 20, true, true]]);
  const unnamed = codex(40, 60, { limit_reached: true, limit_type: 'something new' });
  assert.deepEqual(floorUsage({ codex: unnamed }, NOW).map(u => [u.label, u.used_percent, u.high, u.limited]), [['Week', 60, true, true]], 'a Codex limit naming no window, as the bridge warns');
  assert.deepEqual(floorUsage({ codex: codex(40, 60) }, NOW).map(u => u.limited), [false]);
});

test('0768 AC3: an agent with no reading shows none, and what isn\'t a reading is left out', async () => {
  assert.deepEqual(floorUsage({ claude: { windows: {} }, codex: null, cursor: { read_at: at(-1), windows: {} }, __proto__: claude(5, 5) }, NOW), [], 'no reading, no windows, or a built-in name');
  const p = await open([sub(), null, 'junk', { id: 'codex', name: 'Codex' }, sub({ id: 'cursor', name: '<b>x</b>', used_percent: 'lots' })]);
  assert.deepEqual(subsOf(p).map(s => textOf(s, 'sub-name')), ['Claude Code']);
  const q = await open([]);
  assert.equal(subsOf(q).length, 0);
  assert.match(q.byId('subs').textContent, /No usage readings yet/);
  assert.ok(nodes(q.byId('subs')).every(n => !('innerHTML' in n)), 'no markup is set');
});
