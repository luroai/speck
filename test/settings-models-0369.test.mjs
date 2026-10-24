import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, deferred } from './support/panel.mjs';
import { openSettings, rowOf, controlOf, changeTo } from './support/settings.mjs';
import { agentModels, CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0369: show the chosen agent's models before saving ----------

const CODEX = [{ slug: 'gpt-new', display_name: 'GPT New', description: 'The newest.', efforts: ['low', 'xhigh'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const READ = { codex: { agent: 'codex', models: CODEX }, cursor: { agent: 'cursor', models: CURSOR } };
const read = agent => ({ agent, models: Object.hasOwn(READ, agent) ? READ[agent].models : CLAUDE_MODELS });

// A page whose fetch answers GET /api/settings with `view`, /api/agent-models?agent=<id> with `models[id]` (a promise
// the test settles later, an answer, or { unreachable: true }), and everything else with an empty board.
function modelsPage(view, models = READ) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method });
    let body = u.startsWith('/api/agent-models') ? models[new URLSearchParams(u.split('?')[1]).get('agent')]
      : u.startsWith('/api/settings') && method === 'GET' ? view : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.unreachable) throw new Error('unreachable');
    if (body && body.then) body = await body;
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.calls69 = calls;
  return p;
}
const row = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const view = ({ builder = 'claude', reviewer = 'codex', foreman = 'claude', builder_model = '', reviewer_model = '', foreman_model = '' } = {}) => ({ groups: [
  { title: 'Building and reviewing', settings: [
    row('builder', builder, { choices: ['claude', 'codex', 'cursor'] }), row('builder_model', builder_model),
    row('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor'] }), row('reviewer_model', reviewer_model),
    row('reviewer_effort', '', { choices: EFFORTS })] },
  { title: 'Watching', settings: [row('foreman', foreman, { choices: ['', 'claude', 'codex', 'cursor'] }), row('foreman_model', foreman_model)] }],
  builder_models: { builder, models: read(builder).models }, reviewer_models: { reviewer, models: read(reviewer).models },
  foreman_models: { foreman: foreman || 'claude', models: read(foreman).models }, claude_models: CLAUDE_MODELS });
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option')
  .map(o => ({ value: o.value, text: o.textContent, disabled: !!o.disabled }));
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p' && !/\bexplain\b/.test(n.className || '')).map(n => n.textContent);
const asked = p => p.calls69.filter(c => c.url.startsWith('/api/agent-models')).map(c => c.url);
const saved = p => p.calls69.filter(c => c.method === 'POST');

test('0369 AC1: choosing cursor, codex or claude as the builder lists its models, as when it is saved, without saving', async () => {
  for (const [from, to] of [['claude', 'cursor'], ['claude', 'codex'], ['cursor', 'claude'], ['codex', 'cursor']]) {
    const want = modelsPage(view({ builder: to }));
    await openSettings(want);
    const p = modelsPage(view({ builder: from }));
    await openSettings(p);
    changeTo(p, 'builder', to);
    await p.settle();
    assert.equal(controlOf(p, 'builder_model').tagName, 'select', `${from} to ${to}`);
    assert.deepEqual(options(p, 'builder_model'), options(want, 'builder_model'), `${from} to ${to}`);
    assert.deepEqual(saved(p), []);
    assert.equal(p.byId('settings').hidden, false);
  }
});

test('0369 AC2: choosing cursor or codex as the reviewer lists its models, without the line to save and open Settings again', async () => {
  for (const [from, to] of [['codex', 'cursor'], ['cursor', 'codex'], ['claude-subagent', 'cursor']]) {
    const want = modelsPage(view({ reviewer: to }));
    await openSettings(want);
    const p = modelsPage(view({ reviewer: from }));
    await openSettings(p);
    changeTo(p, 'reviewer', to);
    await p.settle();
    assert.deepEqual(options(p, 'reviewer_model'), options(want, 'reviewer_model'), `${from} to ${to}`);
    assert.ok(!said(p, 'reviewer_model').some(t => /open Settings again/.test(t)), said(p, 'reviewer_model').join(' | '));
    assert.deepEqual(saved(p), []);
  }
  // Codex's efforts come with its models.
  const p = modelsPage(view({ reviewer: 'cursor' }));
  await openSettings(p);
  changeTo(p, 'reviewer', 'codex');
  await p.settle();
  changeTo(p, 'reviewer_model', 'gpt-new');
  assert.deepEqual(options(p, 'reviewer_effort').map(o => o.value), ['', 'low', 'xhigh']);
  // Claude's names, as today, without asking the server.
  for (const to of ['claude', 'claude-subagent']) {
    changeTo(p, 'reviewer', to);
    assert.deepEqual(options(p, 'reviewer_model').filter(o => !o.disabled).map(o => o.value), ['', 'fable', 'opus', 'sonnet', 'haiku']);
  }
  assert.deepEqual(asked(p), ['/api/agent-models?agent=codex']);
});

test('0369 AC3: choosing another Foreman agent lists its models, without the line to save and open Settings again', async () => {
  for (const to of ['codex', 'cursor']) {
    const want = modelsPage(view({ foreman: to }));
    await openSettings(want);
    const p = modelsPage(view({ foreman: 'claude' }));
    await openSettings(p);
    changeTo(p, 'foreman', to);
    await p.settle();
    assert.equal(controlOf(p, 'foreman_model').tagName, 'select');
    assert.deepEqual(options(p, 'foreman_model'), options(want, 'foreman_model'), to);
    assert.ok(!said(p, 'foreman_model').some(t => /open Settings again/.test(t)), said(p, 'foreman_model').join(' | '));
  }
  // The Foreman on the builder's agent, picked as the builder: the same list, read once for both.
  const p = modelsPage(view({ foreman: '' }));
  await openSettings(p);
  changeTo(p, 'builder', 'cursor');
  await p.settle();
  assert.deepEqual(options(p, 'foreman_model').map(o => o.value), ['', 'auto', 'grok-4.7-high']);
  assert.deepEqual(asked(p), ['/api/agent-models?agent=cursor']);
});

test('0369 AC4: while the list is read the setting says so in one line, and when it can\'t be read it is a box with why', async () => {
  const later = deferred();
  const p = modelsPage(view({ reviewer: 'codex' }), { cursor: later });
  await openSettings(p);
  changeTo(p, 'reviewer', 'cursor');
  await p.settle();
  assert.deepEqual(said(p, 'reviewer_model'), ['Reading cursor\'s models…']);
  later.resolve({ agent: 'cursor', why: 'Cursor isn\'t signed in: run agent login. Type the model\'s name instead.' });
  await p.settle();
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'input');
  assert.equal(controlOf(p, 'reviewer_model').type, 'text');
  assert.deepEqual(said(p, 'reviewer_model'), ['Cursor isn\'t signed in: run agent login. Type the model\'s name instead.']);
  // Picking it again doesn't ask again while the view is open.
  changeTo(p, 'reviewer', 'codex');
  changeTo(p, 'reviewer', 'cursor');
  await p.settle();
  assert.equal(asked(p).length, 1);
  // A refusal or an unreachable server: why, in one line.
  for (const answer of [{ status: 500, body: { error: 'Boom.' } }, { unreachable: true }]) {
    const q = modelsPage(view({ builder: 'claude' }), { codex: answer });
    await openSettings(q);
    changeTo(q, 'builder', 'codex');
    await q.settle();
    assert.equal(controlOf(q, 'builder_model').tagName, 'input');
    const lines = said(q, 'builder_model');
    assert.equal(lines.length, 1, lines.join(' | '));
    assert.match(lines[0], /^Couldn't (read|reach).*codex's models.*type the model's name\.$/);
  }
});

test('0369 AC4: a value chosen that the new list doesn\'t offer still shows, marked as not offered, until you change it', async () => {
  const p = modelsPage(view({ builder: 'claude', builder_model: 'opus' }));
  await openSettings(p);
  changeTo(p, 'builder', 'cursor');
  await p.settle();
  assert.equal(controlOf(p, 'builder_model').value, 'opus');
  assert.deepEqual(options(p, 'builder_model')[0], { value: 'opus', text: 'opus (not offered)', disabled: true });
  // One picked in the view, before the reviewer changed, too.
  changeTo(p, 'reviewer_model', 'gpt-new');
  changeTo(p, 'reviewer', 'cursor');
  await p.settle();
  assert.equal(controlOf(p, 'reviewer_model').value, 'gpt-new');
  assert.ok(options(p, 'reviewer_model').some(o => o.value === 'gpt-new' && o.text === 'gpt-new (not offered)' && o.disabled));
  changeTo(p, 'reviewer_model', 'auto');
  assert.ok(!options(p, 'reviewer_model').some(o => o.value === 'gpt-new'));
});

test('0369: agentModels reads the models of the agent asked for, and only those speck can list', async () => {
  const notAsked = async () => { throw new Error('not asked'); };
  assert.deepEqual(await agentModels('codex', async () => ({ models: CODEX }), notAsked), { agent: 'codex', models: CODEX });
  assert.deepEqual(await agentModels('cursor', notAsked, async () => ({ models: CURSOR })), { agent: 'cursor', models: CURSOR });
  assert.deepEqual(await agentModels('cursor', notAsked, async () => ({ why: 'No.' })), { agent: 'cursor', why: 'No.' });
  assert.deepEqual(await agentModels('claude', notAsked, notAsked), { agent: 'claude', models: CLAUDE_MODELS });
  const failed = await agentModels('codex', async () => { throw new Error('spawn failed'); }, notAsked);
  assert.deepEqual(failed, { agent: 'codex', why: 'Couldn\'t read codex\'s models (spawn failed), so type the model\'s name.' });
  for (const odd of ['', 'gemini', '__proto__', 'constructor']) {
    const out = await agentModels(odd, notAsked, notAsked);
    assert.equal(out.agent, '');
    assert.match(out.why, /^speck can only list the models of claude, codex and cursor/);
  }
});
