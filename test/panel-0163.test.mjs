import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, switchPage, exitOf, round, page, styles, pageScript } from './support/panel.mjs';

// ---------- 0163: the running build in the Auto-build button ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const ON = 'Pause Auto-build: ready tickets wait';
const OFF = 'Start Auto-build: build ready tickets'; // 0199: no longer one at a time
const RUN = { on: true, pid: 7 };
// A ticket in each state the button can name.
const BUILDING = T('0151', 'building', { started: ago(65), build_running: true, reviewer: 'codex' });
const CHECKING = T('0152', 'building', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' });
const REVIEWING = T('0153', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
  rounds: [{ ...round(2, 10), verdict: 'request_changes' }] });
const PAUSED = T('0154', 'reviewing', { started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' });
const SHIPPING = T('0155', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ship: { running: true, started: ago(5) } });
const TO_SHIP = T('0156', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') });
const NOT_AUTO = T('0157', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], build_running: true, auto_ship: false });
const BLOCKED = T('0158', 'blocked', { started: ago(300), blocked_question: 'A or B?' });
const STOPPED = T('0159', 'building', { started: ago(200), ...exitOf('It ended.') });
const AUTO = T('0160', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], build_running: true });
const READY = T('0161', 'ready');

const state = (tickets, run = RUN) => ({ tickets, ideas: [], resume_command: '', ...(run ? { run } : {}) });
// 0285: the Auto-build switch is in Settings now (runSwitch), and the header button shows the Foreman, with the builder.
const runOf = p => p.runSwitch();
const headerOf = p => p.byId('run');
const badgeIn = p => p.all(headerOf(p)).find(n => n.tagName === 'canvas');
const labelIn = p => ({ textContent: headerOf(p).attrs['aria-label'].replace(/^speck: /, '') }); // 0413: the word on speck's screen, in its name
const shows = async (tickets, run = RUN) => { const p = switchPage([state(tickets, run)]); await p.settle(); return p; };

test('0163 AC1: while Auto-build is on and a ticket is building, reviewing or shipping, the button reads "Auto-build on" (0199)', async () => {
  for (const t of [BUILDING, CHECKING, REVIEWING, PAUSED, SHIPPING]) {
    const p = await shows([READY, t]);
    assert.equal(runOf(p).textContent, 'On', t.id);
    assert.equal(labelIn(p).textContent, 'Idle', `${t.id}: the header's own label, which can be shortened, is the Foreman's (0285)`);
    assert.match(runOf(p).className, /\brun-on\b/);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/, `${t.id}: in the button's usual colour`);
  }
});

test('0163 AC1: the Build card still names the stage, and the button doesn\'t (0199)', async () => {
  const js = pageScript();
  assert.doesNotMatch(js, /function runLabel\(/);
  const p = await shows([REVIEWING]);
  const card = p.all(p.byId('queue')).find(n => /^stage\b/.test(n.className || ''));
  assert.equal(card.textContent, 'Review 2', 'the card counts the round');
  assert.equal(runOf(p).textContent, 'On');
});

test('0163 AC1: with more than one in flight, it names none of them (0199)', async () => {
  assert.equal(runOf(await shows([READY, CHECKING, BUILDING])).textContent, 'On');
  assert.equal(runOf(await shows([BLOCKED, BUILDING])).textContent, 'On');
  assert.equal(runOf(await shows([AUTO, BUILDING])).textContent, 'On');
});

test('0163 AC2: on with nothing in flight it reads "Auto-build on"; off, "Auto-build off", whatever is building', async () => {
  for (const tickets of [[], [READY], [AUTO]]) {
    const p = await shows(tickets);
    assert.equal(runOf(p).textContent, 'On');
    assert.equal(runOf(p).title, ON);
  }
  for (const tickets of [[], [BUILDING], [BLOCKED], [TO_SHIP]]) {
    const p = await shows(tickets, null);
    assert.equal(runOf(p).textContent, 'Off');
    assert.equal(runOf(p).title, OFF);
    assert.match(runOf(p).className, /\brun-off\b/);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/);
  }
});

test('0163 AC2: when a build waits for you it still reads "Auto-build on", in the button\'s usual colour (0199)', async () => {
  for (const t of [TO_SHIP, NOT_AUTO, BLOCKED, STOPPED]) {
    const p = await shows([t]);
    assert.equal(runOf(p).textContent, 'On', t.id);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/, t.id);
  }
  assert.doesNotMatch((page() + styles()), /\.run-state\.run-(wait|bad)\b/);
});

// 0364: the builder has gone from the button too, so its label alone is in it, at work or not.
test('0163 AC3: no square and no builder: the label alone, whether a build is running or not', async () => {
  const cases = [[[BUILDING], RUN, 'hop'], [[REVIEWING], RUN, 'hop'], [[SHIPPING], RUN, 'hop'], [[PAUSED], RUN, 'still'], [[BLOCKED], RUN, 'still'],
    [[TO_SHIP], RUN, 'still'], [[], RUN, 'still'], [[BUILDING], null, 'hop'], [[], null, 'still']]; // 0199: any build at work hops, on or off
  for (const [tickets, run, pose] of cases) {
    const p = await shows(tickets, run);
    assert.equal(p.all(headerOf(p)).filter(n => /\blive\b/.test(n.className || '')).length, 0, 'no square');
    assert.equal(badgeIn(p), undefined, `${tickets.map(t => t.id)} ${run ? 'on' : 'off'} (${pose} before 0364): no builder`);
  }
  assert.doesNotMatch((page() + styles()), /\.run-state \.mini \{/, 'no style for a builder in the button');
});

// 0303: the builder is the LCD renderer's mini builder, so the drawing of it is checked in panel-0303.test.mjs.

test('0163 AC4: clicking still starts or pauses Auto-build, and the tooltip says only what a click will do (0199)', async () => {
  const p = switchPage([state([BUILDING]), { ok: true, run: { on: false, pid: null } }, { ok: true, run: { on: true, pid: 9 } }]);
  await p.settle();
  assert.equal(runOf(p).title, ON);
  assert.equal(runOf(p).attrs['aria-checked'], 'true');
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(runOf(p).textContent, 'Off');
  assert.equal(runOf(p).title, OFF);
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(runOf(p).attrs['aria-checked'], 'true');
  const q = await shows([BLOCKED]);
  assert.equal(q.runSwitch().title, ON);
});

test('0163 AC4: while a click is going through, it says "Pausing…" as today', async () => {
  const answer = new Promise(() => {});
  const p = switchPage([state([BUILDING]), answer]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(runOf(p).textContent, 'Pausing…');
  assert.equal(runOf(p).disabled, true);
});

// 0413: the in-browser checks of the header row went with it: the top of the panel is speck's screen (panel-0413.test.mjs).
