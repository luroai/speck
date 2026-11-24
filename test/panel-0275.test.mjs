import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deferred } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, posted } from './support/settings.mjs';

// ---------- 0275: ask before closing Settings with unsaved changes (0731: never, as each setting saves as it changes) ----------

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
const asking = p => buttonsOf(dialog(p)).length > 0; // 0731: the page has no box for the question any more
const viewOpen = p => p.byId('settings').hidden === false;
const buttonsOf = n => n.children ? [n, ...n.children.flatMap(buttonsOf)].filter(c => c.tagName === 'button') : [];
const closeButton = p => buttonsOf(p.byId('settings')).find(b => b.textContent === 'Close');
// Each way of closing the view.
const WAYS = {
  Close: p => p.press(closeButton(p)),
  Escape: p => p.key('Escape'),
  outside: p => p.press(p.byId('settings-backdrop')),
};

// 0731: every setting saves as it changes, so there are never unsaved changes to ask about. A box typed in and not yet
// left is the one change not saved, and closing leaves it.
test('0275, since 0731: with a box typed in but not left, Close, Escape and a click outside close the view at once, asking nothing and saving nothing', async () => {
  for (const [how, close] of Object.entries(WAYS)) {
    const p = await opened([view()]);
    const box = controlOf(p, 'limits.max_review_rounds');
    box.value = '4';
    box.listeners.input({ target: box });
    close(p);
    assert.equal(asking(p), false, `${how}: no question`);
    assert.equal(viewOpen(p), false, `${how}: closed`);
    assert.equal(p.focused, 1, `${how}: focus is back on the Settings button`);
    assert.equal(p.asks.length, 0, `${how}: no dialog either`);
    await p.settle();
    assert.deepEqual(posted(p), [], `${how}: nothing saved`);
  }
});

test('0275, since 0731: a setting saved before closing stays saved, and the view opens again with it', async () => {
  const p = await opened([view(), view({ reviewer_effort: 'high' }), view({ reviewer_effort: 'high' })], [{ ok: true, changed: ['reviewer_effort'] }]);
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  WAYS.Close(p);
  assert.equal(viewOpen(p), false);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_effort').value, 'high');
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_effort=high']);
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

test('0275: with an explanation open, Escape only hides it, and the next Escape closes the view (0268, 0731)', async () => {
  const p = await opened([view()]);
  p.press(buttonsOf(rowOf(p, 'reviewer_effort')).find(b => /\bname\b/.test(b.className || ''))); // 0729: its name shows its explanation
  p.key('Escape');
  assert.ok(viewOpen(p));
  p.key('Escape');
  assert.equal(viewOpen(p), false);
  assert.equal(asking(p), false);
});

test('0275 self-check, since 0731: a save still being sent from a view since closed doesn\'t hold up the next view\'s saves', async () => {
  const later = deferred();
  const p = await opened([view(), view(), view({ reviewer_effort: 'high' })], [later, { ok: true, changed: ['reviewer_effort'] }]);
  changeTo(p, 'reviewer_effort', 'low');
  await p.settle();
  WAYS.Close(p);
  await openSettings(p);
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  assert.equal(posted(p).length, 2, 'sent at once');
  later.resolve({ ok: true, changed: ['reviewer_effort'] });
  await p.settle();
});
