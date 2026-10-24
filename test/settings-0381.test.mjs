import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, deferred } from './support/panel.mjs';
import { openSettings, rowOf, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0381: put each agent's model beside its family ----------

const CODEX = [{ slug: 'gpt-new', display_name: 'GPT New', efforts: ['low', 'xhigh'] }, { slug: 'gpt-old', efforts: ['high'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const MODELS = { codex: { models: CODEX }, cursor: { models: CURSOR } };
const listOf = agent => Object.hasOwn(MODELS, agent) ? MODELS[agent].models : CLAUDE_MODELS;
const CLAUDE = CLAUDE_MODELS.map(m => m.slug);
const PAIRS = [['builder', 'builder_model'], ['reviewer', 'reviewer_model'], ['watch_agent', 'watch_model']];

// A page whose fetch answers GET /api/settings with each of `views` in turn, POST with each of `saves` in turn,
// /api/agent-models?agent=<id> with `models[id]` (or a promise of it), and everything else with an empty board.
function page(views, { saves = [], models = MODELS } = {}) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method });
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
const view = ({ builder = 'claude', reviewer = 'codex', foreman = '', builder_model = '', reviewer_model = '', watch_model = '' } = {}) => ({ groups: [
  { title: 'Watching', settings: [S('watch', 'tell', { choices: ['off', 'tell', 'fix'] }), S('watch_agent', foreman, { choices: ['', 'claude', 'codex', 'cursor'] }),
    S('watch_model', watch_model), S('watch_effort', '', { choices: ['', 'low', 'high'] })] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor', 'mine'] }),
    S('reviewer_model', reviewer_model), S('reviewer_effort', '', { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] })] },
  { title: 'Shipping', settings: [S('auto_ship', false, { choices: ['true', 'false'] })] }],
  builder_models: { builder, models: listOf(builder) }, reviewer_models: { reviewer, models: listOf(reviewer) },
  foreman_models: { foreman: foreman || builder, models: listOf(foreman || builder) }, claude_models: CLAUDE_MODELS });

const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option' && !n.disabled).map(o => o.value);
const offOptions = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option' && n.disabled).map(o => o.value);
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p' && !/\bexplain\b/.test(n.className || '')).map(n => n.textContent);
// The Settings view's rows: each element with the class setting that isn't inside another.
const topRows = p => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || '')
  && !(function up(m) { return m && m !== p.byId('settings') && (/\bsetting\b/.test(m.className || '') || up(m.parentNode)); })(n.parentNode));
const nameOf = (p, row) => p.all(row).find(n => /\bname\b/.test(n.className || ''))?.textContent;
const inside = (p, outer, n) => p.all(outer).includes(n);

test('0381 AC1: each agent and its model are two lists on one row, the agent\'s first, offering the agent\'s choices and its models', async () => {
  const p = page([view({ builder: 'codex', reviewer: 'cursor', foreman: 'claude' })]);
  await openSettings(p);
  const rows = topRows(p).map(r => nameOf(p, r));
  for (const [agent, model] of PAIRS) {
    assert.ok(rows.includes(agent), `${agent} has a row: ${rows.join(', ')}`);
    assert.ok(!rows.includes(model), `${model} has no row of its own: ${rows.join(', ')}`);
    const row = topRows(p).find(r => nameOf(p, r) === agent);
    const lists = p.all(row).filter(n => n.tagName === 'select' || n.tagName === 'input');
    assert.deepEqual(lists.map(n => n.attrs['aria-label']), [agent, model], `${agent}'s row has its list, then its model's`);
    assert.ok(inside(p, row, controlOf(p, model)), `${model}'s list is in ${agent}'s row`);
  }
  assert.deepEqual(options(p, 'builder'), ['claude', 'codex', 'cursor']);
  assert.deepEqual(options(p, 'builder_model'), ['', 'gpt-new', 'gpt-old'], 'the builder\'s models: Codex\'s');
  assert.deepEqual(options(p, 'reviewer'), ['codex', 'claude', 'claude-subagent', 'cursor', 'mine']);
  assert.deepEqual(options(p, 'reviewer_model'), ['', 'auto', 'grok-4.7-high'], 'the reviewer\'s models: Cursor\'s');
  assert.deepEqual(options(p, 'watch_agent'), ['', 'claude', 'codex', 'cursor']);
  assert.deepEqual(options(p, 'watch_model'), ['', ...CLAUDE], 'the Foreman\'s models: Claude\'s');
});

test('0381 AC2: choosing an agent fills its row\'s model list before saving, and the first lists keep what they offered', async () => {
  const p = page([view({ builder: 'claude', reviewer: 'claude-subagent', foreman: '' })]);
  await openSettings(p);
  assert.deepEqual(options(p, 'reviewer'), ['codex', 'claude', 'claude-subagent', 'cursor', 'mine'], 'a reviewer command too');
  assert.deepEqual(options(p, 'watch_agent'), ['', 'claude', 'codex', 'cursor'], 'blank too');
  for (const [agent, model, pick, want] of [['builder', 'builder_model', 'cursor', ['', 'auto', 'grok-4.7-high']],
    ['reviewer', 'reviewer_model', 'codex', ['', 'gpt-new', 'gpt-old']], ['watch_agent', 'watch_model', 'codex', ['', 'gpt-new', 'gpt-old']]]) {
    changeTo(p, agent, pick);
    await p.settle();
    assert.deepEqual(options(p, model), want, `${model} after picking ${pick}`);
    assert.ok(inside(p, rowOf(p, agent), controlOf(p, model)), `${model} is still in ${agent}'s row`);
  }
  assert.deepEqual(posted(p), [], 'nothing saved');
});

test('0381 AC3: Save writes each pair as two settings', async () => {
  const p = page([view(), view({ builder: 'codex', builder_model: 'gpt-old' })], { saves: [{ saved: true }] });
  await openSettings(p);
  changeTo(p, 'builder', 'codex');
  await p.settle();
  changeTo(p, 'builder_model', 'gpt-old');
  changeTo(p, 'reviewer_model', 'gpt-new');
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Abuilder=codex&repo%3Abuilder_model=gpt-old&repo%3Areviewer_model=gpt-new']);
  assert.equal(controlOf(p, 'builder_model').value, 'gpt-old');
  assert.ok(inside(p, rowOf(p, 'builder'), controlOf(p, 'builder_model')));
});

test('0381 AC3: a model not offered stays marked, the loading line and the type-in box with why show, and so does the builder\'s note', async () => {
  const later = deferred();
  const p = page([view({ reviewer_model: 'gone-model' })], { models: { cursor: later, codex: MODELS.codex } });
  await openSettings(p);
  assert.deepEqual(offOptions(p, 'reviewer_model'), ['gone-model'], 'marked and can\'t be picked again');
  assert.ok(p.all(controlOf(p, 'reviewer_model')).some(o => o.tagName === 'option' && o.textContent === 'gone-model (not offered)'));
  changeTo(p, 'builder', 'cursor');
  await p.settle();
  assert.ok(said(p, 'builder_model').includes("Reading cursor's models…"), said(p, 'builder_model').join(' | '));
  assert.ok(said(p, 'builder').some(t => /Saving changes who builds every ticket that doesn't name its own builder, from its next build/.test(t)),
    said(p, 'builder').join(' | '));
  later.resolve({ status: 500, body: { why: "cursor can't list its models here, so type the model's name." } });
  await p.settle();
  assert.equal(controlOf(p, 'builder_model').tagName, 'input', 'a box to type in');
  assert.ok(said(p, 'builder_model').includes("cursor can't list its models here, so type the model's name."), said(p, 'builder_model').join(' | '));
  assert.ok(inside(p, rowOf(p, 'builder'), controlOf(p, 'builder_model')), 'the box is in the builder\'s row');
  assert.ok(said(p, 'builder').some(t => /A ticket that names one keeps it/.test(t)), 'the note is still there');
});

test('0381 AC4: the efforts keep their own rows, and changing either list in a row leaves the rest of Settings where it was', async () => {
  for (const [what, key, value, affects] of [['builder', 'builder', 'codex', ['builder', 'builder_model', 'watch_model']],
    ['builder_model', 'builder_model', 'opus', []], ['reviewer', 'reviewer', 'cursor', ['reviewer', 'reviewer_model', 'reviewer_effort']],
    ['reviewer_model', 'reviewer_model', 'gpt-new', ['reviewer_model', 'reviewer_effort']], ['watch_agent', 'watch_agent', 'codex', ['watch_agent', 'watch_model']],
    ['watch_model', 'watch_model', 'opus', []]]) {
    const p = page([view()]);
    await openSettings(p);
    const rows = topRows(p).map(r => nameOf(p, r));
    for (const k of ['reviewer_effort', 'watch_effort']) assert.ok(rows.includes(k), `${k} has its own row`);
    const pane = p.byId('settings');
    pane.scrollTop = 480;
    let drawnAfresh = false;
    const replace = pane.replaceChildren;
    pane.replaceChildren = (...cs) => { drawnAfresh = true; return replace(...cs); };
    const control = controlOf(p, key), before = new Map(p.all(pane).map(n => [n, n.detached || 0])), its = new Set(p.all(control));
    // Every node outside the rows the change redraws, which stays where it was.
    const redrawn = new Set(affects.filter(k => k !== key).flatMap(k => p.all(rowOf(p, k))
      .filter(n => !PAIRS.some(([a, m]) => k === a && p.all(rowOf(p, m)).includes(n)))));
    // The lines under the list changed, drawn again (0370), and the options it offers. Its name and list, the row's
    // first part, stay.
    const lines = new Set(p.all(rowOf(p, key)).filter(n => n !== rowOf(p, key) && !p.all(rowOf(p, key).children[0]).includes(n)
      && !p.all(rowOf(p, key)).filter(r => r !== rowOf(p, key) && /\bsetting\b/.test(r.className || '')).some(r => p.all(r).includes(n))));
    changeTo(p, key, value);
    await p.settle();
    assert.equal(drawnAfresh, false, `the pane isn't drawn afresh (${what})`);
    assert.equal(pane.scrollTop, 480, what);
    assert.equal(controlOf(p, key), control, `the list changed is the same one, so it keeps the focus (${what})`);
    assert.equal((control.detached || 0), before.get(control), what);
    for (const [n, was] of before) if (!redrawn.has(n) && !lines.has(n) && !its.has(n)) assert.equal(n.detached || 0, was, `${n.tagName}.${n.className} "${String(n.textContent).slice(0, 40)}" stays (${what})`);
  }
});
