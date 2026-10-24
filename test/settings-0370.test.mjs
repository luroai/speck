import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, deferred } from './support/panel.mjs';
import { openSettings, rowOf, controlOf, changeTo, tick, saveButton, posted } from './support/settings.mjs';
import { CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0370: keep Settings still when a setting changes ----------

const CODEX = [{ slug: 'gpt-new', display_name: 'GPT New', efforts: ['low', 'xhigh'] }, { slug: 'gpt-old', efforts: ['high'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const MODELS = { codex: { agent: 'codex', models: CODEX }, cursor: { agent: 'cursor', models: CURSOR } };
const listOf = agent => Object.hasOwn(MODELS, agent) ? MODELS[agent].models : CLAUDE_MODELS;

// A page whose fetch answers GET /api/settings with each of `views` in turn, POST with each of `saves` in turn,
// /api/agent-models?agent=<id> with `models[id]` (or a promise of it), and everything else with an empty board.
function page(views, { saves = [], models = MODELS } = {}) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method, headers: opts.headers || {} });
    let body = method === 'POST' ? saves.shift() : u.startsWith('/api/agent-models') ? models[new URLSearchParams(u.split('?')[1]).get('agent')]
      : u.startsWith('/api/settings') ? views.shift() : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.then) body = await body;
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.settingsCalls = calls;
  return p;
}
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const view = ({ builder = 'claude', reviewer = 'codex', foreman = 'claude' } = {}) => ({ groups: [
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', ''), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor'] }),
    S('reviewer_model', ''), S('reviewer_effort', '', { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] })] },
  { title: 'Shipping', settings: [S('auto_ship', false, { choices: ['true', 'false'] }), S('auto_ship_risk', ['low'], { choices: ['low', 'high'] })] },
  { title: 'Limits', settings: [S('limits.max_review_rounds', 3),
    S('max_parallel_builds', 1, { for_machine: true, from: 'repo', repo_value: 1 }), S('base_branch', 'main')] },
  { title: 'Watching', settings: [S('foreman', foreman, { choices: ['', 'claude', 'codex', 'cursor'] }), S('foreman_model', '')] }],
  builder_models: { builder, models: listOf(builder) }, reviewer_models: { reviewer, models: listOf(reviewer) },
  foreman_models: { foreman, models: listOf(foreman) }, claude_models: CLAUDE_MODELS });

const KEYS = view().groups.flatMap(g => g.settings.map(x => x.key));
// 0381: a setting's own nodes, leaving out an agent's model's, which is drawn in the agent's row.
const own = (p, row) => { const inner = new Set(p.all(row).filter(n => n !== row && /\bsetting\b/.test(n.className || '')).flatMap(n => p.all(n)));
  return p.all(row).filter(n => !inner.has(n)); };
// Each setting's row and every node in it, and every other node in the pane, before a change, so a test can see which
// were taken out or drawn again.
function snapshot(p) {
  const rows = new Map(KEYS.map(k => [k, rowOf(p, k)]));
  const inRows = new Set([...rows.values()].flatMap(r => own(p, r)));
  const rest = p.all(p.byId('settings')).filter(n => !inRows.has(n) && n !== p.byId('settings'));
  return { rows, rest, detached: new Map([...inRows, ...rest].map(n => [n, n.detached || 0])) };
}
const attached = (p, n) => { for (let m = n; m; m = m.parentNode) if (m === p.byId('settings')) return true; return false; };
const moved = (snap, n) => (n.detached || 0) !== snap.detached.get(n);
// A setting the change doesn't affect: the same row in the same place, none of its nodes taken out.
function unchanged(p, snap, key, why) {
  const row = snap.rows.get(key);
  assert.equal(rowOf(p, key), row, `${key} is the same row (${why})`);
  assert.ok(attached(p, row), `${key} is still in the view (${why})`);
  for (const n of own(p, row)) assert.ok(!moved(snap, n), `nothing in ${key} was taken out (${why})`);
}
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p' && !/\bexplain\b/.test(n.className || '')).map(n => n.textContent);
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option' && !n.disabled).map(o => o.value);

// What changing each kind of control affects, beyond its own row.
const CHANGES = [
  ['builder list', p => changeTo(p, 'builder', 'cursor'), 'builder', ['builder', 'builder_model', 'foreman_model']],
  ['reviewer list', p => changeTo(p, 'reviewer', 'cursor'), 'reviewer', ['reviewer', 'reviewer_model', 'reviewer_effort']],
  ['Foreman list', p => changeTo(p, 'foreman', 'codex'), 'foreman', ['foreman', 'foreman_model']],
  ['reviewer_model list', p => changeTo(p, 'reviewer_model', 'gpt-new'), 'reviewer_model', ['reviewer_model', 'reviewer_effort']],
  ['reviewer_effort list', p => changeTo(p, 'reviewer_effort', 'low'), 'reviewer_effort', []],
  ['auto_ship list', p => changeTo(p, 'auto_ship', 'true'), 'auto_ship', []],
  ['text box', p => changeTo(p, 'base_branch', 'trunk'), 'base_branch', []],
  ['number box', p => changeTo(p, 'limits.max_review_rounds', '4'), 'limits.max_review_rounds', []],
  ['tick', p => tick(p, 'auto_ship_risk', 'high', true), 'auto_ship_risk', []],
];

test('0370 AC1: changing a list, a text box, a number box or a tick leaves the view, its scroll and the changed control where they were', async () => {
  for (const [what, change, key, affects] of CHANGES) {
    const p = page([view()]);
    await openSettings(p);
    const pane = p.byId('settings');
    pane.scrollTop = 640; // how far it's scrolled, which drawing the pane afresh would lose
    const snap = snapshot(p), control = key === 'auto_ship_risk' ? null : controlOf(p, key);
    let drawnAfresh = false;
    const replace = pane.replaceChildren;
    pane.replaceChildren = (...cs) => { drawnAfresh = true; return replace(...cs); };
    change(p);
    await p.settle();
    assert.equal(drawnAfresh, false, `the pane isn't drawn afresh (${what})`);
    assert.equal(pane.scrollTop, 640, what);
    for (const n of snap.rest) assert.ok(!moved(snap, n), `nothing outside the settings' rows was taken out (${what})`);
    if (control) {
      assert.equal(controlOf(p, key), control, `the changed control is the same one, so it keeps the focus (${what})`);
      assert.ok(attached(p, control) && !moved(snap, control), what);
    }
    for (const k of KEYS.filter(k => !affects.includes(k) && k !== key)) unchanged(p, snap, k, what);
    if (!affects.length) unchanged(p, snap, key, what);
  }
});

test('0370 AC1: models read after a change redraw only the settings that show them, and leave the focus where it was', async () => {
  const later = deferred();
  const p = page([view({ builder: 'claude', reviewer: 'claude-subagent' })], { models: { cursor: later } });
  await openSettings(p);
  changeTo(p, 'builder', 'cursor');
  await p.settle();
  const builder = controlOf(p, 'builder');
  let focused = 0;
  builder.focus = () => { focused++; };
  p.document.activeElement = builder;
  const snap = snapshot(p);
  later.resolve(MODELS.cursor);
  await p.settle();
  assert.deepEqual(options(p, 'builder_model'), ['', 'auto', 'grok-4.7-high']);
  assert.equal(controlOf(p, 'builder'), builder);
  assert.equal(focused, 0, 'the focus never left it');
  for (const k of KEYS.filter(k => !['builder_model', 'reviewer_model', 'reviewer_effort', 'foreman_model'].includes(k))) unchanged(p, snap, k, 'models read');
});

test('0370 AC2: what a change must show still updates', async () => {
  const p = page([view({ builder: 'claude', reviewer: 'codex', foreman: 'claude' })]);
  await openSettings(p);
  assert.equal(saveButton(p).disabled, true);
  // The builder: the line under it, Save, and its models and the Foreman's (which follows the builder).
  changeTo(p, 'builder', 'codex');
  await p.settle();
  assert.ok(said(p, 'builder').some(t => /Saving changes who builds every ticket that doesn't name its own builder/.test(t)), said(p, 'builder').join(' | '));
  assert.equal(saveButton(p).disabled, false);
  assert.deepEqual(options(p, 'builder_model'), ['', 'gpt-new', 'gpt-old']);
  changeTo(p, 'builder', 'claude');
  await p.settle();
  assert.ok(!said(p, 'builder').some(t => /names one keeps it/.test(t)));
  assert.equal(saveButton(p).disabled, true);
  // The reviewer and its model: the model and effort lists.
  changeTo(p, 'reviewer', 'cursor');
  await p.settle();
  assert.deepEqual(options(p, 'reviewer_model'), ['', 'auto', 'grok-4.7-high']);
  changeTo(p, 'reviewer', 'codex');
  changeTo(p, 'reviewer_model', 'gpt-old');
  assert.deepEqual(options(p, 'reviewer_effort'), ['', 'high']);
  // The Foreman agent: its models.
  changeTo(p, 'foreman', 'cursor');
  await p.settle();
  assert.deepEqual(options(p, 'foreman_model'), ['', 'auto', 'grok-4.7-high']);
  // 0387: a change to one of your own settings is saved for this machine, so where it goes is never asked.
  const asks = () => p.all(rowOf(p, 'max_parallel_builds')).filter(n => n.tagName === 'button' && /This machine only/.test(n.textContent)).length;
  changeTo(p, 'max_parallel_builds', '3');
  assert.equal(asks(), 0);
  changeTo(p, 'reviewer', 'claude');
  await p.settle();
  assert.equal(asks(), 0);
});

test('0370 AC3: saving, a refusal and the question on closing with unsaved changes work after a change redraws rows', async () => {
  // Saved: one request with the change, then the view reads the settings again.
  let p = page([view(), view({ builder: 'cursor' })], { saves: [{ saved: true }] });
  await openSettings(p);
  changeTo(p, 'builder', 'cursor');
  await p.settle();
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Abuilder=cursor']);
  assert.equal(controlOf(p, 'builder').value, 'cursor');
  assert.equal(saveButton(p).disabled, true);
  // Refused: the reason beside the setting, with the change kept.
  const why = "reviewer can't be cursor here.";
  p = page([view()], { saves: [{ status: 422, body: { error: why, refused: { reviewer: why } } }] });
  await openSettings(p);
  changeTo(p, 'reviewer', 'cursor');
  await p.settle();
  p.press(saveButton(p));
  await p.settle();
  assert.ok(said(p, 'reviewer').includes(why), said(p, 'reviewer').join(' | '));
  assert.equal(controlOf(p, 'reviewer').value, 'cursor');
  // Closing with the change unsaved asks first, and Keep editing leaves it as it was.
  p.press(p.all(p.byId('settings')).find(n => n.tagName === 'button' && n.className === 'close'));
  assert.equal(p.byId('settings-unsaved').hidden, false);
  assert.match(p.byId('settings-unsaved').textContent, /unsaved changes/i);
  p.press(p.all(p.byId('settings-unsaved')).find(n => n.tagName === 'button' && n.textContent === 'Keep editing'));
  assert.equal(p.byId('settings-unsaved').hidden, true);
  assert.equal(p.byId('settings').hidden, false);
  assert.equal(controlOf(p, 'reviewer').value, 'cursor');
});
