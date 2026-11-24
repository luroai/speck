import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, headOf, gitEnv, deferred } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, typeIn, leaveBox, blurBox, pressEnter, tick, boxesOf, posted, savedLine, refusedLine } from './support/settings.mjs';
import { panelSaveRequest } from '../scripts/settings.mjs';
import { machineConfig } from '../scripts/machine.mjs';

// ---------- 0731: each setting saves as soon as it changes ----------

Object.assign(process.env, gitEnv); // panelSaveRequest commits in this process

const asked = url => Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));
const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = (o = {}) => ({ groups: [
  { title: 'Shipping', settings: [
    S('auto_ship', o.auto_ship ?? false, { choices: [true, false] }),
    S('auto_ship_risk', o.auto_ship_risk ?? ['low'], { choices: ['low', 'high'] })] },
  { title: 'Building and reviewing', settings: [
    S('reviewer_effort', o.reviewer_effort ?? '', { choices: ['', 'low', 'medium', 'high'] }),
    S('max_parallel_builds', o.max_parallel_builds ?? 1, { for_machine: true, from: 'repo', repo_value: 1 })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', o.rounds ?? 3)] },
] });
const OK = { ok: true, changed: ['x'] };
function page(views, saves = [], answer = true) {
  const asks = [];
  const p = settingsPage(views, saves, { confirm: msg => { asks.push(String(msg)); return answer; } });
  p.asks = asks;
  return p;
}
const opened = async p => { await p.settle(); await openSettings(p); return p; };

test('0731 AC1: a switch or a list saves that one setting the moment it changes, and its row says it saved, briefly', async () => {
  const p = await opened(page([view({ auto_ship: true }), view({ auto_ship: false }), view({ reviewer_effort: 'high' })], [OK, OK]));
  changeTo(p, 'auto_ship', 'false'); // off: no dialog
  await p.settle();
  assert.equal(posted(p).length, 1, 'saved at once, with no Save');
  assert.deepEqual(asked(posted(p)[0]), { 'repo:auto_ship': 'false' }, 'only that setting');
  assert.ok(savedLine(p, 'auto_ship'), 'its row says it saved');
  assert.equal(controlOf(p, 'auto_ship').value, 'false', 'as now saved');

  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  assert.equal(posted(p).length, 2);
  assert.deepEqual(asked(posted(p)[1]), { 'repo:reviewer_effort': 'high' });
  assert.ok(savedLine(p, 'reviewer_effort'));

  for (const fn of p.timers.splice(0)) fn(); // a few seconds on
  await p.settle();
  assert.equal(savedLine(p, 'reviewer_effort'), undefined, 'the saved line goes again');
  assert.equal(savedLine(p, 'auto_ship'), undefined);
});

test('0731 AC1: a text or number box saves when you press Enter or leave it changed, not as you type, and for this machine where it is one of yours', async () => {
  const p = await opened(page([view(), view({ rounds: 5 }), view({ rounds: 5, max_parallel_builds: 3 })], [OK, OK]));
  typeIn(p, 'limits.max_review_rounds', '5');
  await p.settle();
  assert.deepEqual(posted(p), [], 'nothing while typing');
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 1);
  assert.deepEqual(asked(posted(p)[0]), { 'repo:limits.max_review_rounds': '5' });
  assert.ok(savedLine(p, 'limits.max_review_rounds'));

  // Left again without a change: nothing more to save.
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 1);

  typeIn(p, 'max_parallel_builds', '3');
  pressEnter(p, 'max_parallel_builds');
  await p.settle();
  assert.equal(posted(p).length, 2);
  assert.deepEqual(asked(posted(p)[1]), { 'machine:max_parallel_builds': '3' }, 'for this machine only');
});

test('0731 AC1: a box typed in while another setting saves, and so drawn again, still saves when it\'s left', async () => {
  const p = await opened(page([view(), view({ reviewer_effort: 'high' }), view({ reviewer_effort: 'high', rounds: 6 })], [OK, OK]));
  typeIn(p, 'limits.max_review_rounds', '6');
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '6', 'kept as typed when drawn again');
  blurBox(p, 'limits.max_review_rounds'); // the new box saw no change since it got the focus: only blur
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [{ 'repo:reviewer_effort': 'high' }, { 'repo:limits.max_review_rounds': '6' }]);
  // Leaving it again saves nothing more.
  blurBox(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 2);
});

test('0731 AC1: a change made while an earlier save is under way waits for it, so each saves alone and in the order made', async () => {
  const first = deferred();
  const p = await opened(page([view(), view({ reviewer_effort: 'high' }), view({ reviewer_effort: 'high', rounds: 4 })], [first, OK]));
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  typeIn(p, 'limits.max_review_rounds', '4');
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 1, 'the second waits');
  first.resolve(OK);
  await p.settle();
  await p.settle();
  assert.equal(posted(p).length, 2);
  assert.deepEqual(posted(p).map(asked), [{ 'repo:reviewer_effort': 'high' }, { 'repo:limits.max_review_rounds': '4' }]);
});

test('0731 AC1: several changes to one setting while its first save waits are each sent, in the order made (review F1)', async () => {
  const first = deferred();
  const p = await opened(page([view(), view({ reviewer_effort: 'low' }), view({ reviewer_effort: 'medium' }), view({ reviewer_effort: 'high' })], [first, OK, OK]));
  for (const v of ['low', 'medium', 'high']) { changeTo(p, 'reviewer_effort', v); await p.settle(); }
  assert.equal(posted(p).length, 1, 'the rest wait');
  first.resolve(OK);
  for (let i = 0; i < 4; i++) await p.settle();
  assert.deepEqual(posted(p).map(asked), [{ 'repo:reviewer_effort': 'low' }, { 'repo:reviewer_effort': 'medium' }, { 'repo:reviewer_effort': 'high' }]);
  assert.equal(controlOf(p, 'reviewer_effort').value, 'high');

  // Put back to the saved value while a save to another is on its way: that's a change too, and is sent.
  const later = deferred();
  const q = await opened(page([view(), view({ reviewer_effort: 'low' }), view()], [later, OK]));
  changeTo(q, 'reviewer_effort', 'low');
  await q.settle();
  changeTo(q, 'reviewer_effort', '');
  later.resolve(OK);
  for (let i = 0; i < 4; i++) await q.settle();
  assert.deepEqual(posted(q).map(asked), [{ 'repo:reviewer_effort': 'low' }, { 'repo:reviewer_effort': '' }]);
});

test('0731 AC2: a refused save doesn\'t undo a correction made while it waited, which is saved next (review F1)', async () => {
  const why = 'limits.max_review_rounds must be a whole number of 1 or more (got "0").';
  const first = deferred();
  const p = await opened(page([view(), view({ rounds: 5 })], [first, OK]));
  typeIn(p, 'limits.max_review_rounds', '0');
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  typeIn(p, 'limits.max_review_rounds', '5');
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  first.resolve({ status: 422, body: { error: why, refused: { 'limits.max_review_rounds': why } } });
  for (let i = 0; i < 4; i++) await p.settle();
  assert.deepEqual(posted(p).map(asked), [{ 'repo:limits.max_review_rounds': '0' }, { 'repo:limits.max_review_rounds': '5' }]);
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '5');
  assert.equal(refusedLine(p, 'limits.max_review_rounds'), undefined, 'the correction saved');
});

test('0731 AC1, AC4: a box left changed and then Settings closed at once still saves, as the browser sends change before the click (review F2)', async () => {
  const p = await opened(page([view()], [OK]));
  typeIn(p, 'limits.max_review_rounds', '6');
  leaveBox(p, 'limits.max_review_rounds');
  p.press(p.all(p.byId('settings')).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className || '')));
  assert.equal(p.byId('settings').hidden, true, 'closed at once');
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [{ 'repo:limits.max_review_rounds': '6' }]);

  // Also when it waits behind an earlier save.
  const first = deferred();
  const q = await opened(page([view()], [first, OK]));
  changeTo(q, 'reviewer_effort', 'high');
  typeIn(q, 'limits.max_review_rounds', '7');
  leaveBox(q, 'limits.max_review_rounds');
  q.key('Escape');
  assert.equal(q.byId('settings').hidden, true);
  first.resolve(OK);
  for (let i = 0; i < 4; i++) await q.settle();
  assert.deepEqual(posted(q).map(asked), [{ 'repo:reviewer_effort': 'high' }, { 'repo:limits.max_review_rounds': '7' }]);
});

test('0731 AC1: each project setting saved is its own commit of only speck/config.yml', () => {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'not mine\n');
  const head = headOf(r);
  assert.equal(panelSaveRequest(r.dir, 'repo%3Alimits.max_review_rounds=5').status, 200);
  assert.equal(panelSaveRequest(r.dir, 'repo%3Aship_mode=pr').status, 200);
  assert.equal(r.g('rev-parse', 'HEAD~2'), head, 'two commits');
  for (const at of ['HEAD', 'HEAD~1']) assert.equal(r.g('diff-tree', '--no-commit-id', '--name-only', '-r', at), 'speck/config.yml');
  assert.deepEqual(r.g('log', '-2', '--format=%s').split('\n'), ['speck: config ship_mode pr', 'speck: config limits.max_review_rounds 5']);
  assert.equal(r.g('status', '--porcelain'), '?? other.txt');
  // One of yours, for this machine only: no commit.
  assert.equal(panelSaveRequest(r.dir, 'machine%3Amax_parallel_tests=2').status, 200);
  assert.equal(machineConfig(r.dir).max_parallel_tests, 2);
  assert.equal(r.g('rev-parse', 'HEAD~2'), head);
});

test('0731 AC2: a change speck refuses is not saved: the row goes back to the saved value and says why under it', async () => {
  const why = 'This checkout is on "feature", not main, so the setting would be committed to the wrong branch. Switch to main, then try again.';
  const p = await opened(page([view(), view()], [
    { status: 409, body: { error: why, refused: { 'limits.max_review_rounds': why } } },
    { status: 422, body: { error: 'nope', refused: { reviewer_effort: 'reviewer_effort must be one of …' } } },
  ]));
  typeIn(p, 'limits.max_review_rounds', '9');
  pressEnter(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 1);
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '3', 'back to the saved value');
  assert.equal(refusedLine(p, 'limits.max_review_rounds')?.textContent, why);
  assert.equal(savedLine(p, 'limits.max_review_rounds'), undefined);

  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  assert.equal(controlOf(p, 'reviewer_effort').value, '', 'back to the saved value');
  assert.match(refusedLine(p, 'reviewer_effort').textContent, /must be one of/);

  // Leaving the box now saves nothing: it holds the saved value again.
  leaveBox(p, 'limits.max_review_rounds');
  await p.settle();
  assert.equal(posted(p).length, 2);
});

test('0731 AC2: a refusal the server gives for no one setting, or no answer at all, still shows under the row and puts it back', async () => {
  const p = await opened(page([view()], [{ status: 500, body: { error: 'Couldn\'t commit speck/config.yml, so nothing was saved.' } }]));
  changeTo(p, 'reviewer_effort', 'low');
  await p.settle();
  assert.equal(controlOf(p, 'reviewer_effort').value, '');
  assert.match(refusedLine(p, 'reviewer_effort').textContent, /Couldn't commit/);

  // The panel can't be reached: the save's request fails.
  const q = await opened(page([view()], [{ then: (_, fail) => fail(new Error('down')) }]));
  typeIn(q, 'limits.max_review_rounds', '6');
  leaveBox(q, 'limits.max_review_rounds');
  await q.settle();
  assert.equal(posted(q).length, 1);
  assert.equal(controlOf(q, 'limits.max_review_rounds').value, '3');
  assert.match(refusedLine(q, 'limits.max_review_rounds').textContent, /Couldn't reach/);
});

test('0731 AC3: turning auto_ship on asks first with the approved tickets that would ship, and saves only once confirmed', async () => {
  const p = await opened(page([view()], [], false));
  changeTo(p, 'auto_ship', 'true');
  await p.settle();
  assert.equal(p.asks.length, 1);
  assert.match(p.asks[0], /approved low-risk tickets/);
  assert.deepEqual(posted(p), [], 'cancelled: nothing saved');
  assert.equal(controlOf(p, 'auto_ship').value, 'false', 'the switch goes back');

  const q = await opened(page([view(), view({ auto_ship: true })], [OK], true));
  changeTo(q, 'auto_ship', 'true');
  await q.settle();
  assert.equal(q.asks.length, 1);
  assert.deepEqual(asked(posted(q)[0]), { 'repo:auto_ship': 'true', confirm: 'low' });
});

test('0731 AC3: adding a risk while turning auto_ship on is still saving asks about it too, and sends its confirmation (review F4)', async () => {
  const first = deferred();
  const p = await opened(page([view(), view({ auto_ship: true }), view({ auto_ship: true, auto_ship_risk: ['low', 'high'] })], [first, OK], true));
  changeTo(p, 'auto_ship', 'true');
  await p.settle();
  tick(p, 'auto_ship_risk', 'high', true);
  await p.settle();
  assert.equal(p.asks.length, 2, 'asked again for the risk');
  assert.match(p.asks[1], /approved low-risk and high-risk tickets/);
  first.resolve(OK);
  for (let i = 0; i < 4; i++) await p.settle();
  assert.deepEqual(posted(p).map(asked), [{ 'repo:auto_ship': 'true', confirm: 'low' }, { 'repo:auto_ship_risk': 'low,high', confirm: 'low,high' }]);
});

test('0731 AC3: adding a risk while auto_ship is on asks first, cancelling unticks it, and unticking the last risk is refused', async () => {
  const p = await opened(page([view({ auto_ship: true })], [], false));
  tick(p, 'auto_ship_risk', 'high', true);
  await p.settle();
  assert.match(p.asks[0], /approved low-risk and high-risk tickets/);
  assert.deepEqual(posted(p), []);
  assert.equal(boxesOf(p, 'auto_ship_risk').find(b => b.value === 'high').checked, false, 'unticked again');

  tick(p, 'auto_ship_risk', 'low', false);
  await p.settle();
  assert.deepEqual(posted(p), [], 'refused: nothing sent');
  assert.equal(boxesOf(p, 'auto_ship_risk').find(b => b.value === 'low').checked, true, 'ticked again');
  assert.match(refusedLine(p, 'auto_ship_risk').textContent, /Tick at least one risk/);

  // Removing a risk needs no dialog.
  const q = await opened(page([view({ auto_ship: true, auto_ship_risk: ['low', 'high'] }), view({ auto_ship: true })], [OK], false));
  tick(q, 'auto_ship_risk', 'high', false);
  await q.settle();
  assert.equal(q.asks.length, 0);
  assert.deepEqual(asked(posted(q)[0]), { 'repo:auto_ship_risk': 'low' });
});

test('0731 AC4: Settings has no Save button, and closing it never asks about unsaved changes', async () => {
  const p = await opened(page([view(), view()]));
  const buttons = p.all(p.byId('settings')).filter(n => n.tagName === 'button');
  assert.ok(!buttons.some(b => /^(Save|Saving…)$/.test(b.textContent || '') || /\bsave-all\b/.test(b.className || '')), 'no Save');
  assert.ok(!p.all(p.byId('settings')).some(n => /\bsavebar\b/.test(n.className || '')), 'no save bar');
  typeIn(p, 'limits.max_review_rounds', '7'); // typed, not yet left
  p.press(p.all(p.byId('settings')).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className || '')));
  await p.settle();
  assert.equal(p.byId('settings').hidden, true, 'closed at once');
  assert.equal(p.asks.length, 0);
  assert.ok(!p.all(p.byId('settings-unsaved')).some(n => n.tagName === 'button'), 'no question');
  assert.ok(!fs.readFileSync(new URL('../templates/panel.html', import.meta.url), 'utf8').includes('settings-unsaved'), 'the page has no box for one');

  // Escape too.
  await openSettings(p);
  typeIn(p, 'limits.max_review_rounds', '8');
  p.key('Escape');
  await p.settle();
  assert.equal(p.byId('settings').hidden, true);
});
