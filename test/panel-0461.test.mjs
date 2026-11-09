import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, exitOf, boardPage, fullViewOf, stoppedClock } from './support/panel.mjs';
import { rules, tokens, get, rule } from './support/css.mjs';
import { looks, contrast, rgba } from './support/contrast.mjs';

// ---------- 0461: an open ticket's five steps as a track of coloured bars ----------
// 0585: a Build row doesn't open as a card, so Build's track is the full view's (0583); the five-step colours are an open Plan ticket's (0587: a shipped ticket no longer opens as a card).

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const KEYS = ['build', 'check', 'review', 'approve', 'ship'];
// Each step's bar colour, and its name's colour when it's the current step.
const BAR = { build: '--blue', check: '--inbox', review: '--yellow', approve: '--green', ship: '--purple' };
const NAME = { build: '--run', check: '--cyan-text', review: '--warn', approve: '--ok', ship: '--purple-text' };

const TICKETS = [
  T('0901', 'building', { started: ago(65), build_running: true }),
  T('0902', 'building', { started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0903', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }, { ...round(2, 10), verdict: 'request_changes' }] }),
  T('0904', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: true, ship: { running: true, auto: true, started: ago(5) } }),
  T('0905', 'blocked', { started: ago(300), self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?' }),
  T('0906', 'reviewing', { started: ago(200), self_check: 'no changes', ...exitOf('It ended.') }),
  T('0907', 'ready', {}),
];
const board = () => ({ run: { on: true }, ideas: [], tickets: TICKETS });
const page = () => boardPage([board()], { Date: stoppedClock(NOW) });
const trackOf = (p, n) => p.all(n).find(x => /^track\b/.test(x.className || '')) || null;
const has = (n, c) => (n.className || '').split(/\s+/).includes(c);

test('0461 AC1: an in-flight ticket\'s full view shows a track of its steps under its title; a queued one has one with none reached', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0901', '0902', '0903', '0904', '0905', '0906', '0907']) {
    const view = await fullViewOf(p, id), track = trackOf(p, view);
    assert.ok(track, `${id}: a track`);
    assert.equal(track.children.length, 4, `${id}: four steps (0583)`);
    assert.deepEqual(track.children.map(s => s.textContent), ['Ready', 'Built', 'Reviewed', 'Ship'], `${id}: its steps' names`);
  }
});

test('0461 AC2: each step is marked done, now or not reached, and a blocked or stopped ticket\'s track says so', async () => {
  const p = page();
  await p.settle();
  const want = { '0901': 'dn--', '0902': 'dn--', '0903': 'ddn-', '0904': 'dddn', '0905': 'ddw-', '0906': 'ddw-', '0907': 'd---' };
  for (const [id, states] of Object.entries(want)) {
    const track = trackOf(p, await fullViewOf(p, id));
    const got = track.children.map(s => (has(s, 'done') ? 'd' : has(s, 'now') ? 'n' : has(s, 'waits') ? 'w' : '-')).join('');
    assert.equal(got, states, `${id}: its steps`);
  }
});

const all = rules();
// The last value the plain rules (in no at-rule) whose selector lists hold `sel` give `prop`.
const val = (sel, prop) => all.filter(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();

test('0461 AC2: a finished or current step\'s bar is in its step\'s colour, the current name in it and bold, the rest grey', () => {
  assert.deepEqual(tokens(val('.item.ticket .track .step', 'border-top')), ['--line'], 'a step not reached: grey bar');
  assert.deepEqual(tokens(val('.item.ticket .track .step', 'color')), ['--muted'], 'and grey name');
  for (const k of KEYS) {
    for (const state of ['done', 'now']) assert.deepEqual(tokens(val(`.item.ticket .track .step.${state}.${k}`, 'border-top-color')), [BAR[k]], `${k} ${state}: its bar`);
    assert.deepEqual(tokens(val(`.item.ticket .track .step.now.${k}`, 'color')), [NAME[k]], `${k} now: its name's colour`);
  }
  assert.equal(val('.item.ticket .track .step.now', 'font-weight'), '600', 'the current step\'s name is bold');
  assert.deepEqual(tokens(val('.item.ticket .track.stopped .step.now', 'border-top-color')), ['--bad'], 'blocked or stopped: crimson bar');
  assert.deepEqual(tokens(val('.item.ticket .track.stopped .step.now', 'color')), ['--bad'], 'and crimson name');
  // the stopped rule comes after every step's own, so it wins at the same specificity
  const at = sel => all.findIndex(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(sel));
  for (const k of KEYS) assert.ok(at('.item.ticket .track.stopped .step.now') > at(`.item.ticket .track .step.now.${k}`), `crimson after ${k}`);
});

test('0461 AC2: the colours are Cursor\'s blue, cyan, yellow and green, and a purple well apart from the crimson', () => {
  const hue = hex => {
    const [r, g, b] = rgba(hex), max = Math.max(r, g, b), d = max - Math.min(r, g, b);
    if (d === 0) return 0;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const gap = (a, b) => { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d); };
  for (const [name, look] of Object.entries(looks())) {
    for (const [k, t] of [['purple bar', '--purple'], ['purple name', '--purple-text']]) {
      assert.ok(hue(look[t]) >= 250 && hue(look[t]) <= 290, `${name}: the ${k} ${look[t]} is purple`);
      assert.ok(gap(look[t], look['--bad']) >= 60, `${name}: the ${k} is ${gap(look[t], look['--bad']).toFixed(0)}° from --bad`);
    }
    assert.ok(Math.abs(hue(look['--cyan-text']) - hue(look['--inbox'])) < 3, `${name}: the cyan name is a shade of the inbox's cyan`);
  }
});

// What an open in-flight card can sit on: an open card's raised fill, a blocked one's tint, a waiting one's tint.
const CARDS = ['--raise', '--panel', '--bad-bg', '--ok-bg'];
test('0461 AC4: every bar reaches 3:1 and every name 0161\'s 7:1 against the card, in both looks', () => {
  assert.equal(val('.item.ticket .track .step', 'font-size'), '12px', 'the names are 12 px');
  for (const [name, look] of Object.entries(looks())) {
    for (const bg of CARDS) {
      for (const t of [...Object.values(BAR), '--bad']) assert.ok(contrast(look[t], look[bg]) >= 3, `${name}: bar ${t} on ${bg} is ${contrast(look[t], look[bg]).toFixed(2)}:1`);
      for (const t of [...Object.values(NAME), '--bad', '--muted', '--text']) assert.ok(contrast(look[t], look[bg]) >= 4.5, `${name}: name ${t} on ${bg} is ${contrast(look[t], look[bg]).toFixed(2)}:1`);
    }
  }
});
