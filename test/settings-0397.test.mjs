import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, heldTimeouts } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, saveButton, posted } from './support/settings.mjs';
import { panelSettings, SETTING_GROUPS, EDITABLE } from '../scripts/settings.mjs';
import { MACHINE_SETTINGS } from '../scripts/machine.mjs';

// ---------- 0397: say where a setting is saved in its explanation ----------

const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
// A view with a setting from this machine, one from the repo, one left at speck's default and one only the repo holds.
const view = (o = {}) => ({ groups: [
  { title: 'Building and reviewing', settings: [
    S('reviewer_model', o.reviewer_model ?? 'gpt-y', { for_machine: true, from: o.from ?? 'machine', repo_value: 'gpt-x' }),
    S('reviewer_effort', '', { choices: ['', 'low', 'high'], for_machine: true, from: 'repo', repo_value: '', default: true })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', 3, { default: true }), S('ship_mode', 'local', { choices: ['local', 'pr'] })] },
] });
const KEYS = ['reviewer_model', 'reviewer_effort', 'limits.max_review_rounds', 'ship_mode'];
const cls = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && cls(n, 'explain'));
const infoOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && cls(n, 'info'));
const buttonIn = (node, p, label) => p.all(node).find(n => n.tagName === 'button' && n.textContent === label);
// A row's text outside its explanation: what it shows without being asked.
const shownText = (p, key) => { const tip = tipOf(p, key), all = rowOf(p, key).textContent; return tip ? all.replace(tip.textContent, '') : all; };
const opened = async (views, saves = [], globals = {}) => { const p = settingsPage(views, saves, globals); await p.settle(); await openSettings(p); return p; };

test('0397 AC1: no setting\'s row shows a repo, repo default, default or this machine mark', async () => {
  const p = await opened([view()]);
  assert.deepEqual(p.all(p.byId('settings')).filter(n => cls(n, 'default')).map(n => n.textContent), [], 'no mark');
  for (const key of KEYS) {
    // A blank choice's "(default)" in a list is what picking it means, not a mark.
    assert.deepEqual(p.all(rowOf(p, key)).filter(n => n.tagName === 'span' && /^(repo|repo default|default|this machine)$/i.test(n.textContent.trim())).map(n => n.textContent), [], key);
    assert.doesNotMatch(shownText(p, key), /\brepo\b|this machine/i, key);
  }
});

test('0397 AC2: each explanation ends by saying where a change is saved, and says what speck uses when it\'s left blank', () => {
  const r = panelRepo();
  const all = panelSettings(r.dir).groups.flatMap(g => g.settings);
  assert.equal(all.length, SETTING_GROUPS.flatMap(g => g.settings).length);
  for (const x of all) {
    const ending = !EDITABLE.includes(x.key) ? /speck\/config\.yml rather than here, and saved there for the project, with a commit\.$/
      : MACHINE_SETTINGS.includes(x.key) ? /saved for your machine only, without a commit\.$/ : /saved for the project in speck\/config\.yml, with a commit\.$/;
    assert.match(x.explain, ending, x.key);
    assert.match(x.explain, /\bblank\b|When it isn't set, speck uses \S/i, x.key);
  }
  const s = Object.fromEntries(all.map(x => [x.key, x]));
  assert.match(s['limits.max_review_rounds'].explain, /When it isn't set, speck uses 3\./);
  assert.match(s.auto_ship_risk.explain, /When it isn't set, speck uses low\./);
  assert.match(s.reviewer_model.explain, /Blank leaves it to the reviewer's own default/);
});

test('0397 AC2: the view shows the server\'s explanation as it is, ahead of anything else in it', async () => {
  const v = view();
  v.groups[1].settings[1].explain = 'How it ships. A change here is saved for the project in speck/config.yml, with a commit.';
  const p = await opened([v]);
  assert.equal(tipOf(p, 'ship_mode').textContent, v.groups[1].settings[1].explain);
});

test('0397 AC3: this machine\'s own value is said in the explanation, which offers to clear it back to the project\'s', async () => {
  const p = await opened([view(), view({ reviewer_model: 'gpt-x', from: 'repo' })], [{ ok: true, changed: ['reviewer_model'] }]);
  const tip = tipOf(p, 'reviewer_model');
  assert.match(tip.textContent, /your machine's own value, used over the project's: gpt-x/);
  const clear = buttonIn(tip, p, 'Clear this machine\'s value');
  assert.ok(clear, 'the button is in the explanation');
  assert.equal(buttonIn(tipOf(p, 'reviewer_effort'), p, 'Clear this machine\'s value'), undefined, 'the repo\'s value has none');
  assert.doesNotMatch(tipOf(p, 'reviewer_effort').textContent, /own value/);

  // Pressing it keeps the explanation open, now saying the value is cleared on Save, with a button to keep it.
  p.press(clear);
  const after = tipOf(p, 'reviewer_model');
  assert.equal(after.hidden, false);
  assert.match(after.textContent, /cleared when you save/);
  assert.ok(buttonIn(after, p, 'Keep this machine\'s value'));
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?machine%3Areviewer_model=']);
  assert.equal(buttonIn(tipOf(p, 'reviewer_model'), p, 'Clear this machine\'s value'), undefined);
});

test('0397 AC3: the focus or the pointer can move from the info button to the explanation\'s button without it closing', async () => {
  const clock = heldTimeouts();
  const p = await opened([view()], [], { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  const info = infoOf(p, 'reviewer_model'), tip = tipOf(p, 'reviewer_model');
  const clear = buttonIn(tip, p, 'Clear this machine\'s value');
  tip.contains = n => p.all(tip).includes(n);
  info.listeners.focus();
  assert.equal(tip.hidden, false);
  info.listeners.blur({ relatedTarget: clear });
  tip.listeners.focusin({ target: clear });
  assert.equal(tip.hidden, false, 'kept open while its button has the focus');
  tip.listeners.focusout({ relatedTarget: null });
  assert.equal(tip.hidden, true, 'closed once the focus leaves it');

  info.listeners.mouseenter();
  info.listeners.focus(); // shown, as after the pause
  info.listeners.blur({ relatedTarget: null });
  assert.equal(tip.hidden, false, 'the pointer is still over the button');
  info.listeners.mouseleave({ relatedTarget: clear });
  tip.listeners.mouseenter();
  assert.equal(tip.hidden, false, 'the pointer is over the explanation');
  tip.listeners.mouseleave({ relatedTarget: null });
  assert.equal(tip.hidden, false, 'a moment to come back');
  clock.rest(500);
  assert.equal(tip.hidden, true, 'closed once the pointer has left it');
});

test('0397 AC4: the paragraph starting "What speck uses now" is gone, with nothing in its place', async () => {
  const p = await opened([view()]);
  const pane = p.byId('settings');
  assert.ok(!p.all(pane).some(n => /What speck uses now/.test(n.textContent || '')));
  assert.ok(!p.all(pane).some(n => n.tagName === 'p' && /commits speck\/config\.yml|marked this machine/.test(n.textContent || '')));
});
