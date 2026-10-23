import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, gitEnv, startPanel, stop, freePort, request, deferred } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { settingsQuick, CLAUDE_MODELS } from '../scripts/settings.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0407: Settings opens from the config, and the agents' lists fill in afterwards ----------

const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high'] }];
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const EFFORTS = { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] };
// The view from the config alone, as GET /api/settings?quick=1 answers it.
const quick = () => ({ groups: [
  { title: 'Foreman', settings: [S('foreman', '', { choices: ['', 'claude', 'codex'] }), S('foreman_model', ''), S('foreman_effort', '', EFFORTS)] },
  { title: 'Building and reviewing', settings: [
    S('builder', 'claude', { choices: ['claude', 'codex'], build_command: { value: '', own: { claude: '', codex: '' }, each_ticket: true } }),
    S('builder_model', ''), S('builder_effort', '', EFFORTS), S('reviewer', 'codex', { choices: ['codex', 'claude', 'claude-subagent'] }),
    S('reviewer_model', 'gpt-6.1-sol'), S('reviewer_effort', '', EFFORTS), S('max_parallel_builds', 2, { for_machine: false })] }],
  claude_models: CLAUDE_MODELS, providers: [], loading: true });
// The whole answer, as GET /api/settings answers it once every agent has: `codex`, Codex's models or why it has none.
const full = ({ codex = { models: CODEX } } = {}) => {
  const v = quick();
  delete v.loading;
  return { ...v, builder_models: { builder: 'claude', models: CLAUDE_MODELS }, reviewer_models: { reviewer: 'codex', models: CODEX }, foreman_models: { foreman: 'claude', models: CLAUDE_MODELS },
    your_agents: { list: true, agents: [
      { id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: ['builder'] },
      { id: 'codex', name: 'Codex', kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: ['reviewer'] }] },
    agent_models: [{ id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
      { id: 'codex', name: 'Codex', efforts: true, models: codex.models ?? [], ...(codex.why ? { why: codex.why } : { default_model: 'gpt-6.1-sol' }) }] };
};

const pane = p => p.byId('settings');
const groupTitles = p => p.all(pane(p)).filter(n => n.tagName === 'h4').map(n => n.textContent);
const agentsBox = p => p.all(pane(p)).find(n => n.tagName === 'section' && /\bagents\b/.test(n.className || ''));
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option');
const attached = (p, n) => { for (let m = n; m; m = m.parentNode) if (m === pane(p)) return true; return false; };
const lines = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p' && !/\bexplain\b/.test(n.className || '')).map(n => n.textContent);

test('0407 AC1: the quick answer has every group and its values from the config, at once, saying the lists are still loading', async () => {
  const r = panelRepo();
  const at = Date.now(), body = settingsQuick(r.dir);
  assert.ok(Date.now() - at < 500, 'within half a second');
  assert.equal(body.loading, true);
  assert.ok(body.groups.length > 0 && body.groups.every(g => g.settings.length > 0));
  assert.equal(body.groups.flatMap(g => g.settings).find(s => s.key === 'max_parallel_builds').value, 1);
  for (const k of ['agent_models', 'your_agents', 'reviewer_models', 'builder_models', 'foreman_models']) assert.equal(Object.hasOwn(body, k), false, `no ${k} yet`);
});

test('0407 AC1: the panel answers GET /api/settings?quick=1 within half a second, without asking the agents', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    await request(p.port); // the panel is up
    const at = Date.now(), res = await request(p.port, { pathName: '/api/settings?quick=1' });
    assert.ok(Date.now() - at < 500, `answered in ${Date.now() - at} ms`);
    const body = JSON.parse(res.body);
    assert.equal(body.loading, true);
    assert.equal(body.groups.flatMap(g => g.settings).find(s => s.key === 'max_parallel_builds').value, 1);
    assert.equal(Object.hasOwn(body, 'agent_models'), false);
  } finally { await stop(p); }
});

test('0407 AC1: Settings draws every group and its values before the agents\' lists come back', async () => {
  const p = settingsPage([quick(), deferred()]); // the whole answer never comes
  await openSettings(p);
  assert.doesNotMatch(pane(p).textContent, /Loading the settings/);
  for (const g of ['Your agents', 'Foreman', 'Building and reviewing']) assert.ok(groupTitles(p).includes(g), `${g} is drawn`);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '2');
  assert.deepEqual(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).map(c => c.url), ['/api/settings?quick=1', '/api/settings']);
});

test('0407 AC2: each role\'s list and Your agents say they are loading, then fill in place, keeping what\'s typed, the scroll and the focus', async () => {
  const later = deferred();
  const p = settingsPage([quick(), later]);
  await openSettings(p);
  for (const role of ['builder', 'reviewer', 'foreman']) { // the Foreman left to the builder's agent, which is among its entries
    assert.match(options(p, role).map(o => o.textContent).join(' '), /Loading your agents' models/, `${role} says it's loading`);
  }
  assert.equal(controlOf(p, 'foreman').value, '|');
  assert.match(agentsBox(p).textContent, /Loading your agents/);
  changeTo(p, 'max_parallel_builds', '3');
  const typed = controlOf(p, 'max_parallel_builds'), reviewer = controlOf(p, 'reviewer'), groups = [...pane(p).children];
  pane(p).scrollTop = 420;
  p.document.activeElement = reviewer;
  later.resolve(full());
  await p.settle();
  assert.equal(controlOf(p, 'reviewer'), reviewer, 'the same list, so it keeps the focus');
  assert.ok(attached(p, reviewer));
  assert.deepEqual(options(p, 'reviewer').filter(o => !o.disabled).map(o => o.value), ['claude|fable', 'claude|opus', 'claude|', 'claude|haiku', 'claude-subagent|', 'codex|']);
  assert.equal(reviewer.value, 'codex|', 'the reviewer as set');
  assert.doesNotMatch(pane(p).textContent, /loading the list|Loading your agents/);
  assert.equal(controlOf(p, 'foreman').value, '|', 'the Foreman as set');
  assert.match(agentsBox(p).textContent, /Claude Code/);
  assert.match(agentsBox(p).textContent, /Codex/);
  assert.equal(controlOf(p, 'max_parallel_builds'), typed);
  assert.equal(typed.value, '3', 'what was typed stays');
  assert.equal(pane(p).scrollTop, 420, 'not scrolled');
  assert.deepEqual(pane(p).children, groups, 'the view isn\'t drawn again');
  assert.equal(saveButton(p).disabled, false, 'the change is still there to save');
});

test('0407 AC2: the keyboard focus in Your agents stays on its control when the view reads the lists again after a Save', async () => {
  const again = deferred();
  const p = settingsPage([quick(), full(), quick(), again], [{ ok: true }]);
  const make = p.document.createElement;
  p.document.createElement = tag => { const n = make(tag); n.focus = () => { p.document.activeElement = n; }; n.getAttribute = k => n.attrs?.[k] ?? null; return n; };
  await openSettings(p);
  await p.settle();
  changeTo(p, 'max_parallel_builds', '3');
  p.press(saveButton(p));
  await p.settle();
  assert.doesNotMatch(pane(p).textContent, /loading the list|Loading your agents/, 'the lists read last time show while they\'re read again');
  assert.match(agentsBox(p).textContent, /Claude Code/);
  const add = () => p.all(agentsBox(p)).find(n => n.tagName === 'button' && n.textContent === 'Add an agent');
  p.document.activeElement = add();
  again.resolve(full());
  await p.settle();
  assert.equal(p.document.activeElement, add(), 'the focus goes back to Add an agent');
  assert.ok(attached(p, add()));
  assert.equal(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).length, 4);
});

test('0407 AC3: lists that can\'t be read say why in one line, and the rest of Settings still works', async () => {
  const p = settingsPage([quick(), { status: 500, body: { error: 'Codex timed out after 10 seconds.' } }]);
  await openSettings(p);
  await p.settle();
  assert.deepEqual(lines(p, 'reviewer').filter(t => /Codex timed out/.test(t)).length, 1, 'one line under the reviewer');
  assert.match(options(p, 'reviewer').map(o => o.textContent).join(' '), /couldn't be read/);
  assert.match(agentsBox(p).textContent, /Codex timed out after 10 seconds/);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '2');
  // One agent's list that times out, in the whole answer, says why under the role that uses it.
  const q = settingsPage([quick(), full({ codex: { why: 'Codex didn\'t list its models within 10 seconds.' } })]);
  await openSettings(q);
  await q.settle();
  assert.deepEqual(lines(q, 'reviewer').filter(t => /within 10 seconds/.test(t)).length, 1);
});

test('0407 AC3: a setting that needs no list is saved while the lists are still loading', async () => {
  const p = settingsPage([quick(), deferred(), quick(), deferred()], [{ ok: true }]);
  await openSettings(p);
  assert.match(options(p, 'reviewer').map(o => o.textContent).join(' '), /loading the list/, 'still loading');
  changeTo(p, 'max_parallel_builds', '3');
  p.press(saveButton(p));
  await p.settle();
  const sent = posted(p).find(u => u.startsWith('/api/settings/save'));
  assert.ok(sent, 'Save sent it');
  assert.equal(new URLSearchParams(sent.split('?')[1]).get('repo:max_parallel_builds'), '3');
});

test('0407 AC4: a whole answer to the first read is drawn at once, with no second read', async () => {
  const p = settingsPage([full()]);
  await openSettings(p);
  assert.equal(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).length, 1);
  assert.doesNotMatch(pane(p).textContent, /loading the list|Loading your agents/);
  assert.equal(controlOf(p, 'reviewer').value, 'codex|');
});

test('0407 self-check: an agent removed while the lists are read again stays removed when the older answer comes back', async () => {
  const again = deferred(), left = { list: true, agents: [{ id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: ['builder'] },
    { id: 'codex', name: 'Codex', kind: 'agent', yours: false, ready: true, installed: true, signed_in: true, roles: [] }] };
  const p = settingsPage([quick(), full(), quick(), again], [{ ok: true }, { ok: true, said: 'Removed Codex from your agents on this machine.', your_agents: left }]);
  await openSettings(p);
  await p.settle();
  changeTo(p, 'max_parallel_builds', '3');
  p.press(saveButton(p));
  await p.settle();
  p.press(p.all(agentsBox(p)).find(n => n.tagName === 'button' && n.attrs?.['aria-label'] === 'Remove Codex'));
  await p.settle();
  again.resolve(full());
  await p.settle();
  assert.equal(p.all(agentsBox(p)).some(n => n.tagName === 'button' && n.attrs?.['aria-label'] === 'Remove Codex'), false, 'Codex isn\'t listed as yours again');
  assert.match(agentsBox(p).textContent, /Removed Codex/);
});
