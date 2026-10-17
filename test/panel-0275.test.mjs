import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deferred } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';

// ---------- 0275: ask before closing Settings with unsaved changes ----------

const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = (o = {}) => ({ groups: [
  { title: 'Shipping', settings: [
    S('auto_ship', o.auto_ship ?? false, { choices: [true, false] }),
    S('auto_ship_risk', o.auto_ship_risk ?? ['low'], { choices: ['low', 'high'] })] },
  { title: 'Building and reviewing', settings: [S('reviewer_effort', o.reviewer_effort ?? '', { choices: ['', 'low', 'high'] })] },
  { title: 'How much runs at once', settings: [
    S('max_parallel_builds', o.machine ?? 1, { for_machine: true, from: o.machine === undefined ? 'repo' : 'machine', repo_value: 1 })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', o.rounds ?? 3)] },
] });
// A page whose confirm() records what it asked and answers `answer`, and whose Settings button records its focus.
async function opened(views, saves = [], answer = true) {
  const asks = [];
  const p = settingsPage(views, saves, { confirm: msg => { asks.push(String(msg)); return answer; } });
  p.asks = asks;
  p.focused = 0;
  p.byId('settings-open').focus = () => { p.focused++; };
  await p.settle();
  await openSettings(p);
  return p;
}
const dialog = p => p.byId('settings-unsaved');
const asking = p => dialog(p).hidden === false;
const viewOpen = p => p.byId('settings').hidden === false;
const buttonsOf = n => n.children ? [n, ...n.children.flatMap(buttonsOf)].filter(c => c.tagName === 'button') : [];
const choice = (p, label) => buttonsOf(dialog(p)).find(b => b.textContent === label);
const closeButton = p => buttonsOf(p.byId('settings')).find(b => b.textContent === 'Close');
// Each way of closing the view.
const WAYS = {
  Close: p => p.press(closeButton(p)),
  Escape: p => p.key('Escape'),
  outside: p => p.press(p.byId('settings-backdrop')),
};

test('0275 AC1: with a change not saved, Close, Escape and a click outside each ask first, offering Save, Discard and Keep editing', async () => {
  for (const [how, close] of Object.entries(WAYS)) {
    const p = await opened([view()]);
    changeTo(p, 'limits.max_review_rounds', '4');
    close(p);
    await p.settle();
    assert.ok(asking(p), `${how}: it asks`);
    assert.ok(viewOpen(p), `${how}: the view stays open behind it`);
    assert.equal(p.focused, 0, `${how}: focus stays in the view`);
    assert.match(dialog(p).textContent, /unsaved changes/i);
    assert.deepEqual(buttonsOf(dialog(p)).map(b => b.textContent), ['Save', 'Discard', 'Keep editing']);
    assert.equal(dialog(p).attrs.role, 'alertdialog');
    assert.deepEqual(posted(p), [], `${how}: nothing is saved yet`);
  }
});

test('0275 AC1: clearing this machine\'s value counts as a change, as Save sees it', async () => {
  const p = await opened([view({ machine: 3 })]);
  p.press(buttonsOf(rowOf(p, 'max_parallel_builds')).find(b => b.textContent === 'Clear this machine\'s value'));
  WAYS.Close(p);
  assert.ok(asking(p));
});

test('0275 AC2: Save saves the changes as the view\'s Save does, then closes the view, with focus back on the Settings button', async () => {
  const later = deferred();
  const p = await opened([view(), view({ rounds: 4 })], [later]);
  changeTo(p, 'limits.max_review_rounds', '4');
  changeTo(p, 'reviewer_effort', 'high');
  WAYS.Escape(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_effort=high&repo%3Alimits.max_review_rounds=4']);
  assert.ok(viewOpen(p), 'still open while it saves');
  later.resolve({ ok: true, changed: ['reviewer_effort', 'limits.max_review_rounds'] });
  await p.settle();
  assert.equal(viewOpen(p), false, 'closed once saved');
  assert.equal(asking(p), false);
  assert.equal(p.focused, 1, 'focus is back on the Settings button');
});

test('0275 AC2: a refused save leaves the view open, showing the refusal beside the setting, with the changes in place', async () => {
  const refused = { 'limits.max_review_rounds': 'limits.max_review_rounds must be a whole number of 1 or more.' };
  const p = await opened([view()], [{ status: 422, body: { error: refused['limits.max_review_rounds'], refused } }]);
  changeTo(p, 'limits.max_review_rounds', '0');
  WAYS.Close(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  assert.equal(posted(p).length, 1);
  assert.ok(viewOpen(p), 'still open');
  assert.equal(asking(p), false, 'the question is gone, so the view shows why');
  assert.match(rowOf(p, 'limits.max_review_rounds').textContent, /must be a whole number/);
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '0');
  assert.equal(p.focused, 0);

  // A failure that's no one setting's shows under the view's Save.
  const q = await opened([view()], [{ status: 500, body: { error: 'Couldn\'t commit speck/config.yml, so nothing was saved.' } }]);
  changeTo(q, 'reviewer_effort', 'low');
  WAYS.outside(q);
  q.press(choice(q, 'Save'));
  await q.settle();
  assert.ok(viewOpen(q));
  assert.match(saveButton(q).parentNode.textContent, /Couldn't commit/);
});

test('0275 AC2: a save that needs 0259\'s confirmation asks it, and when cancelled sends nothing and leaves the view open', async () => {
  const p = await opened([view()], [], false);
  changeTo(p, 'auto_ship', 'true');
  WAYS.Close(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  assert.equal(p.asks.length, 1, 'asked to confirm');
  assert.deepEqual(posted(p), []);
  assert.ok(viewOpen(p));
  assert.equal(asking(p), false);

  // Confirmed, it saves with the confirmation and closes.
  const q = await opened([view(), view({ auto_ship: true })], [{ ok: true, changed: ['auto_ship'] }], true);
  changeTo(q, 'auto_ship', 'true');
  WAYS.Close(q);
  q.press(choice(q, 'Save'));
  await q.settle();
  assert.match(posted(q)[0], /confirm=low/);
  assert.equal(viewOpen(q), false);

  // Changed on the server since: the view stays open and reads the settings again, as its Save would.
  const r = await opened([view(), view({ auto_ship: true, auto_ship_risk: ['low', 'high'] })],
    [{ status: 409, body: { error: 'auto_ship has changed since this view read it.', confirm: true } }], true);
  changeTo(r, 'auto_ship', 'true');
  WAYS.Close(r);
  r.press(choice(r, 'Save'));
  await r.settle();
  assert.ok(viewOpen(r));
  assert.equal(asking(r), false);
  assert.match(saveButton(r).parentNode.textContent, /changed since/);
});

test('0275 AC2: a change still to be placed is asked about in the view, which stays open, and nothing is sent', async () => {
  const p = await opened([view()]);
  changeTo(p, 'max_parallel_builds', '3');
  WAYS.Close(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  assert.deepEqual(posted(p), []);
  assert.ok(viewOpen(p));
  assert.equal(asking(p), false);
  assert.match(rowOf(p, 'max_parallel_builds').textContent, /this machine only or the repo/);
});

test('0275 AC3: Discard closes the view without saving, and it opens again with the saved values', async () => {
  const p = await opened([view(), view()]);
  changeTo(p, 'limits.max_review_rounds', '4');
  changeTo(p, 'reviewer_effort', 'high');
  WAYS.Close(p);
  p.press(choice(p, 'Discard'));
  await p.settle();
  assert.equal(viewOpen(p), false);
  assert.equal(asking(p), false);
  assert.deepEqual(posted(p), []);
  assert.equal(p.focused, 1, 'focus is back on the Settings button');
  await openSettings(p);
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '3');
  assert.equal(controlOf(p, 'reviewer_effort').value, '');
  assert.equal(saveButton(p).disabled, true);
  WAYS.Close(p);
  assert.equal(viewOpen(p), false, 'nothing left to ask about');
});

test('0275 AC4: Keep editing, or Escape while it asks, closes the question and leaves the view open with the changes in place', async () => {
  for (const how of ['Keep editing', 'Escape']) {
    const p = await opened([view()]);
    changeTo(p, 'limits.max_review_rounds', '4');
    WAYS.Close(p);
    if (how === 'Escape') p.key('Escape'); else p.press(choice(p, how));
    await p.settle();
    assert.equal(asking(p), false, how);
    assert.ok(viewOpen(p), `${how}: the view stays open`);
    assert.equal(controlOf(p, 'limits.max_review_rounds').value, '4');
    assert.equal(saveButton(p).disabled, false);
    assert.deepEqual(posted(p), []);
    assert.equal(p.focused, 0);
    WAYS.Escape(p);
    assert.ok(asking(p), `${how}: closing again asks again`);
  }
});

test('0275 AC4: Keep editing while its Save is still saving leaves the view open once the save is done', async () => {
  const later = deferred();
  const p = await opened([view(), view({ rounds: 4 })], [later]);
  changeTo(p, 'limits.max_review_rounds', '4');
  WAYS.Close(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  p.key('Escape');
  later.resolve({ ok: true, changed: ['limits.max_review_rounds'] });
  await p.settle();
  assert.ok(viewOpen(p), 'not closed: you chose to keep editing');
  assert.equal(asking(p), false);
});

test('0275 AC5: with nothing changed, Close, Escape and a click outside close the view at once, with focus back on the Settings button', async () => {
  for (const [how, close] of Object.entries(WAYS)) {
    const p = await opened([view()]);
    changeTo(p, 'limits.max_review_rounds', '4');
    changeTo(p, 'limits.max_review_rounds', '3'); // put back: nothing differs
    close(p);
    assert.equal(asking(p), false, `${how}: no question`);
    assert.equal(viewOpen(p), false, `${how}: closed`);
    assert.equal(p.focused, 1, `${how}: focus is back on the Settings button`);
  }
});

test('0275 AC5: while the settings are loading, or couldn\'t be read, closing doesn\'t ask', async () => {
  const p = await opened([{ status: 500, body: { error: 'Couldn\'t read speck/config.yml.' } }]);
  WAYS.Close(p);
  assert.equal(viewOpen(p), false);
  assert.equal(asking(p), false);
});

test('0275: with an explanation open, Escape still only hides it, even with a change not saved (0268)', async () => {
  const p = await opened([view()]);
  changeTo(p, 'limits.max_review_rounds', '4');
  p.press(buttonsOf(rowOf(p, 'reviewer_effort')).find(b => b.attrs?.['aria-label'] === 'About reviewer_effort'));
  p.key('Escape');
  assert.equal(asking(p), false, 'no question yet');
  assert.ok(viewOpen(p));
  p.key('Escape');
  assert.ok(asking(p), 'the next Escape asks');
});

test('0275 AC2 self-check: a save still being sent from a view since closed doesn\'t hold up the next view\'s Save', async () => {
  const later = deferred();
  const p = await opened([view(), view()], [later, { ok: true, changed: ['reviewer_effort'] }]);
  changeTo(p, 'limits.max_review_rounds', '4');
  p.press(saveButton(p));
  await p.settle();
  WAYS.Close(p);
  p.press(choice(p, 'Discard'));
  await openSettings(p);
  changeTo(p, 'reviewer_effort', 'high');
  WAYS.Close(p);
  p.press(choice(p, 'Save'));
  await p.settle();
  assert.equal(posted(p).length, 2, 'sent at once');
  assert.equal(viewOpen(p), false, 'and closed once saved');
  later.resolve({ ok: true, changed: ['limits.max_review_rounds'] });
  await p.settle();
});
