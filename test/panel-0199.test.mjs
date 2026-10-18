import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, switchPage, exitOf, round, page, queueRows } from './support/panel.mjs';

// ---------- 0199: the header button is only the Auto-build switch ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const ON = 'Pause Auto-build: ready tickets wait';
const OFF = 'Start Auto-build: build ready tickets';
const RUN = { on: true, pid: 7 };
const BUILDING = T('0301', 'building', { started: ago(65), build_running: true, reviewer: 'codex' });
const CHECKING = T('0302', 'building', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' });
const REVIEWING = T('0303', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
  rounds: [{ ...round(2, 10), verdict: 'request_changes' }] });
const PAUSED = T('0304', 'reviewing', { started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' });
const SHIPPING = T('0305', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ship: { running: true, started: ago(5) } });
const TO_SHIP = T('0306', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') });
const WAITING = T('0307', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: true, ...exitOf('Done.') });
const BLOCKED = T('0308', 'blocked', { started: ago(300), blocked_question: 'A or B?' });
const STOPPED = T('0309', 'building', { started: ago(200), ...exitOf('It ended.') });
const READY = T('0310', 'ready');
const ALL = [READY, BUILDING, CHECKING, REVIEWING, PAUSED, SHIPPING, TO_SHIP, WAITING, BLOCKED, STOPPED];
// Each set of tickets the button might once have named, alone and together.
const SETS = [[], [READY], ...ALL.slice(1).map(t => [t]), ALL, [BLOCKED, BUILDING], [TO_SHIP, SHIPPING]];

const state = (tickets, run = RUN) => ({ tickets, ideas: [], resume_command: '', ...(run ? { run } : {}) });
// 0285: the Auto-build switch is in Settings now (runSwitch), and the header button shows the Foreman, with the builder.
const runOf = p => p.runSwitch();
const builderIn = p => p.all(p.byId('run')).find(n => n.tagName === 'canvas');
const shows = async (tickets, run = RUN) => { const p = switchPage([state(tickets, run)]); await p.settle(); return p; };
const ids = tickets => tickets.map(t => t.id).join(' ') || 'none';

test('0199 AC1: on, the button says "Auto-build on", and off, "Auto-build off", whatever the tickets are doing', async () => {
  for (const tickets of SETS) {
    assert.equal(runOf(await shows(tickets)).textContent, 'Auto-build on', `on: ${ids(tickets)}`);
    assert.equal(runOf(await shows(tickets, null)).textContent, 'Auto-build off', `off: ${ids(tickets)}`);
  }
});

test('0199 AC1: while it switches, it says "Starting…" or "Pausing…"', async () => {
  const hang = new Promise(() => {});
  for (const [run, text] of [[RUN, 'Pausing…'], [null, 'Starting…']]) {
    const p = switchPage([state([BLOCKED, BUILDING], run), hang]);
    await p.settle();
    p.press(runOf(p));
    await p.settle();
    assert.equal(runOf(p).textContent, text);
    assert.equal(runOf(p).disabled, true);
  }
});

test('0199 AC2: it never names a ticket, a build step or that something needs you, and its colour shows only on or off', async () => {
  for (const run of [RUN, null]) for (const tickets of SETS) {
    const p = await shows(tickets, run), r = runOf(p), where = `${run ? 'on' : 'off'}: ${ids(tickets)}`;
    for (const text of [r.textContent, r.title]) {
      assert.doesNotMatch(text, /\b03\d\d\b|needs you|Building|Build\b|Self-check|Review|Ship\b|Shipping/, where);
    }
    assert.deepEqual(r.className.split(' '), ['run-switch', run ? 'run-on' : 'run-off'], where);
  }
  const js = page().match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(js, /function runLabel\(/, 'nothing works out a ticket to name');
  assert.doesNotMatch(page(), /\.run-state\.run-(wait|bad)\b/, 'no colour for a ticket waiting for you');
});

test('0199 AC3: its builder hops while any build or ship is at work, and stands still otherwise', async () => {
  const cases = [[[BUILDING], 'hop'], [[CHECKING], 'hop'], [[REVIEWING], 'hop'], [[SHIPPING], 'hop'], [[READY, BLOCKED, CHECKING], 'hop'],
    [[TO_SHIP, PAUSED, SHIPPING], 'hop'], [ALL, 'hop'], [[], 'still'], [[READY], 'still'], [[PAUSED], 'still'], [[TO_SHIP], 'still'],
    [[WAITING], 'still'], [[BLOCKED], 'still'], [[STOPPED], 'still'], [[READY, PAUSED, TO_SHIP, WAITING, BLOCKED, STOPPED], 'still']];
  for (const run of [RUN, null]) for (const [tickets, pose] of cases) {
    const b = builderIn(await shows(tickets, run));
    assert.deepEqual(b.className.split(' '), ['mini', pose], `${run ? 'on' : 'off'}: ${ids(tickets)}`);
  }
});

test('0199 AC3: a ship started from the panel and not yet answered counts as a ship at work', async () => {
  const st = state([TO_SHIP]), never = new Promise(() => {});
  const p = switchPage([], {
    fetch: async url => {
      if (/\/ship$/.test(url)) return never;
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? { pack: '## 0306 · Ticket 0306\n' } : st;
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
  });
  await p.settle();
  assert.equal(builderIn(p).className, 'mini still');
  const buttons = (n, text) => p.all(n).filter(x => x.tagName === 'button' && text.test(x.textContent));
  const row = queueRows(p).find(r => r.textContent.includes('0306'));
  p.press(row.children.find(n => n.className === 'top'));
  await p.settle();
  p.press(buttons(queueRows(p).find(r => r.textContent.includes('0306')), /^Review pack$/)[0]);
  await p.settle();
  p.press(buttons(p.byId('full-ticket'), /^Ship$/)[0]);
  await p.settle();
  assert.equal(builderIn(p).className, 'mini hop');
  assert.equal(runOf(p).textContent, 'Auto-build on');
});

test('0199 AC4: the tooltip says only what a click does, and a click switches Auto-build in place, keeping focus', async () => {
  for (const tickets of SETS) {
    assert.equal(runOf(await shows(tickets)).title, ON, `on: ${ids(tickets)}`);
    assert.equal(runOf(await shows(tickets, null)).title, OFF, `off: ${ids(tickets)}`);
  }
  const p = switchPage([state([BUILDING, BLOCKED]), { ok: true, run: { on: false, pid: null } }, { ok: true, run: { on: true, pid: 9 } }]);
  await p.settle();
  const button = runOf(p);
  assert.equal(button.attrs['aria-pressed'], 'true');
  p.press(button);
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(runOf(p), button, 'the same button, so it keeps focus');
  assert.equal(button.textContent, 'Auto-build off');
  assert.equal(button.title, OFF);
  assert.equal(button.attrs['aria-pressed'], 'false');
  p.press(button);
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(runOf(p), button);
  assert.equal(button.textContent, 'Auto-build on');
  assert.equal(button.title, ON);
});
