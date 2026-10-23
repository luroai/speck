import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchPage, deferred } from './support/panel.mjs';

// ---------- 0144: call the speck run switch Auto-build ----------

const state = run => ({ tickets: [], ideas: [], resume_command: '', ...(run ? { run } : {}) });
// 0150: the indicator is itself the button, so there's no separate Pause or Start, and "ready tickets wait" moved into its tooltip.
// 0285: the switch is in the Settings view's Foreman group now, and the header button shows the Foreman. 0364: with no builder.
const pillOf = p => p.runSwitch();
const dotOf = p => p.all(p.byId('run')).find(n => /\bmini\b/.test(n.className || '') || n.tagName === 'canvas'); // 0163: the builder in place of the square
const switchOf = pillOf;

test('0144 AC1: while speck run is on, the indicator reads "Auto-build on" with a green square (0150: and is the button)', async () => {
  const p = switchPage([state({ on: true, pid: 7 })]);
  await p.settle();
  assert.equal(pillOf(p).textContent, 'On');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.equal(switchOf(p).title, 'Pause Auto-build: ready tickets wait');
});

test('0144 AC2: while speck run is off, the indicator reads "Auto-build off" with a red square (0150: "ready tickets wait" is in the tooltip)', async () => {
  const p = switchPage([state(null)]);
  await p.settle();
  const pill = pillOf(p);
  assert.equal(pill.textContent, 'Off');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.ok(!p.all(pill).some(n => /\brun-wait\b/.test(n.className || '')), 'no small print beside it');
});

test('0144 AC3: the indicator\'s tooltip says what a click does, on or off (0150)', async () => {
  for (const [run, title] of [[null, 'Start Auto-build: build ready tickets'], [{ on: true, pid: 7 }, 'Pause Auto-build: ready tickets wait']]) {
    const p = switchPage([state(run)]);
    await p.settle();
    assert.equal(pillOf(p).title, title);
  }
});

test('0144 AC3: while the request is being answered, the button reads "Starting…" or "Pausing…" and can\'t be clicked again', async () => {
  for (const [run, label, url] of [[null, 'Starting…', '/api/run/on'], [{ on: true, pid: 7 }, 'Pausing…', '/api/run/off']]) {
    const answer = deferred();
    const p = switchPage([state(run), answer]);
    await p.settle();
    p.press(switchOf(p));
    await p.settle();
    assert.equal(switchOf(p).textContent, label);
    assert.equal(switchOf(p).disabled, true);
    p.press(switchOf(p));
    await p.settle();
    assert.equal(p.calls.filter(c => c.url === url).length, 1, 'a second click sends nothing');
  }
});

test('0144 AC4: clicking it posts to turn speck run on, then off, as Start and Pause did (0150: the connection indicator has gone)', async () => {
  const p = switchPage([state(null), { ok: true, run: { on: true, pid: 9 } }, { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(pillOf(p).textContent, 'On');
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(pillOf(p).textContent, 'Off');
  assert.equal(p.byId('pills').children.length, 0);
});

// ---------- in a browser: the colours, and the phone layout ----------

// 0413: the in-browser checks of the Foreman's word in the header went with the header row: it's speck's screen now
// (panel-0413.test.mjs).
