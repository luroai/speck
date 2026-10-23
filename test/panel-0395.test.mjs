// 0395: an open explanation in Settings closes on a click or tap anywhere outside it and its info button.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heldTimeouts } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo } from './support/settings.mjs';

const KEYS = ['auto_ship', 'reviewer', 'max_parallel_builds'];
const S = (key, more = {}) => ({ key, value: 1, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = () => ({ groups: [{ title: 'Some', settings: [S('auto_ship', { value: false, choices: [true, false] }), S('reviewer', { value: 'codex', choices: ['codex', 'claude'] }), S('max_parallel_builds')] }] });

async function opened() {
  const clock = heldTimeouts();
  const p = settingsPage([view()], [], { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  p.clock = clock;
  await p.settle();
  await openSettings(p);
  return p;
}
const pop = p => p.byId('settings');
const infoOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\binfo\b/.test(n.className));
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
const shown = p => KEYS.filter(k => !tipOf(p, k).hidden);
const fire = (n, type) => n.listeners[type]({ target: n, currentTarget: n, stopPropagation() {}, preventDefault() {} });
// A click or tap on `node`, as a browser sends it: the pointer goes down on it, through each node it's in to the
// document, then the click, the document's listener first. At `x` px from the window's left, with the pop-up's column
// from 100 to 860 px.
function tap(p, node, x = 400) {
  for (const n of pop(p).children) n.getBoundingClientRect = () => ({ left: 100, right: 860, top: 0, bottom: 40, width: 760, height: 40 });
  const d = { target: node, clientX: x, clientY: 20, pointerType: 'touch', stopPropagation() {}, preventDefault() {} };
  for (let n = node; n; n = n.parentNode) if (n.listeners && n.listeners.pointerdown) n.listeners.pointerdown(d);
  if (p.document.listeners.pointerdown) p.document.listeners.pointerdown(d);
  const e = { ...d };
  if (p.document.listeners.click) p.document.listeners.click(e);
  for (let n = node; n; n = n.parentNode) if (n.listeners && n.listeners.click) n.listeners.click(e);
}
const groupOf = p => p.all(pop(p)).find(n => n !== pop(p) && /\bgroup\b/.test(n.className || '')) || pop(p).children[1];

// ---------- AC1: a click or tap outside closes it ----------

test('0395 AC1: a click or tap elsewhere in Settings, on another control or beside the column closes the open explanation', async () => {
  const places = {
    'elsewhere in Settings': p => tap(p, groupOf(p)),
    "another setting's control": p => tap(p, controlOf(p, 'reviewer')),
    'beside the column': p => tap(p, pop(p), 40),
    "another setting's name": p => tap(p, p.all(rowOf(p, 'max_parallel_builds')).find(n => /\bname\b/.test(n.className || ''))),
  };
  for (const [where, click] of Object.entries(places)) {
    const p = await opened();
    tap(p, infoOf(p, 'auto_ship'));
    assert.deepEqual(shown(p), ['auto_ship'], `${where}: open`);
    click(p);
    assert.deepEqual(shown(p), [], `${where}: closed`);
  }
});

test('0395 AC1: an explanation shown by focus or by the pointer resting also closes on a click outside', async () => {
  for (const how of ['focus', 'mouseenter']) {
    const p = await opened();
    const info = infoOf(p, 'reviewer');
    fire(info, how);
    if (how === 'mouseenter') p.clock.rest(500);
    assert.deepEqual(shown(p), ['reviewer'], how);
    tap(p, groupOf(p));
    assert.deepEqual(shown(p), [], `${how}: closed`);
    p.clock.rest(500);
    assert.deepEqual(shown(p), [], `${how}: no pause left to show it again`);
  }
});

// ---------- AC2: the click still works on what it lands on; beside the column it closes only the explanation ----------

test('0395 AC2: a tap on another info button opens that one, and one on another control still reaches it', async () => {
  const p = await opened();
  tap(p, infoOf(p, 'auto_ship'));
  tap(p, infoOf(p, 'reviewer'));
  assert.deepEqual(shown(p), ['reviewer'], "another setting's explanation opens in its place");
  let clicked = 0;
  const c = controlOf(p, 'max_parallel_builds');
  const before = c.listeners.click;
  c.listeners.click = e => { clicked++; if (before) before(e); };
  tap(p, c);
  assert.deepEqual(shown(p), [], 'closed');
  assert.equal(clicked, 1, 'the click reached the control');
});

test('0395 AC2: a click beside the column with an explanation open closes only the explanation, and the next closes Settings', async () => {
  const p = await opened();
  tap(p, infoOf(p, 'auto_ship'));
  tap(p, pop(p), 40);
  assert.deepEqual(shown(p), []);
  assert.equal(pop(p).hidden, false, 'Settings stays open');
  tap(p, pop(p), 40);
  assert.equal(pop(p).hidden, true, 'with none open, a click beside the column closes Settings, as 0368 made it');
});

// ---------- AC3: inside it, its info button and Escape ----------

test('0395 AC3: a click or tap inside the explanation leaves it open, and its info button still opens and closes it', async () => {
  const p = await opened();
  const info = infoOf(p, 'auto_ship'), tip = tipOf(p, 'auto_ship');
  tap(p, info);
  const inner = { tagName: '#text', children: [], listeners: {}, parentNode: tip }; // a word in it, as a text selection starts
  tap(p, tip);
  tap(p, inner);
  assert.deepEqual(shown(p), ['auto_ship'], 'still open');
  tap(p, info);
  assert.deepEqual(shown(p), [], 'its info button closes it');
  tap(p, info);
  assert.deepEqual(shown(p), ['auto_ship'], 'and opens it again');
});

test('0395 AC3: after a change to a setting whose row is drawn again, its info button still opens and closes it', async () => {
  const p = await opened();
  changeTo(p, 'reviewer', 'claude');
  const info = infoOf(p, 'reviewer');
  tap(p, info);
  assert.deepEqual(shown(p), ['reviewer'], 'opens');
  tap(p, info);
  assert.deepEqual(shown(p), [], 'and closes again');
  tap(p, info);
  changeTo(p, 'reviewer', 'codex');
  tap(p, controlOf(p, 'reviewer'));
  assert.deepEqual(shown(p), [], 'a tap on its control, outside it, closes it');
});

test('0395 AC3: Escape still closes the explanation without closing Settings', async () => {
  const p = await opened();
  tap(p, infoOf(p, 'reviewer'));
  p.key('Escape');
  assert.deepEqual(shown(p), []);
  assert.equal(pop(p).hidden, false);
});

// ---------- AC4: one opened by the pointer resting still closes when the pointer leaves ----------

test('0395 AC4: an explanation opened by resting the pointer closes when the pointer leaves', async () => {
  const p = await opened();
  const info = infoOf(p, 'max_parallel_builds');
  p.document.listeners.pointerover?.({ pointerType: 'mouse' });
  fire(info, 'mouseenter');
  p.clock.rest(500);
  assert.deepEqual(shown(p), ['max_parallel_builds']);
  fire(info, 'mouseleave');
  assert.deepEqual(shown(p), []);
});
