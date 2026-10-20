import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakeAgents, READY } from './support/agents.mjs';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf } from './support/settings.mjs';
import { speck } from './support/cli.mjs';
import { findAgents, findAgentsAsync, parseCursorModels, AGENTS_TIMEOUT_MS } from '../scripts/agents.mjs';
import { panelSettings, builderModels, CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0288: find the agents and models on this machine ----------

// Runs fn with `dir` as the whole PATH.
function onlyOnPath(dir, fn) {
  const was = process.env.PATH;
  process.env.PATH = dir;
  try { return fn(); } finally { process.env.PATH = was; }
}
async function onlyOnPathAsync(dir, fn) {
  const was = process.env.PATH;
  process.env.PATH = dir;
  try { return await fn(); } finally { process.env.PATH = was; }
}
const byId = out => Object.fromEntries(out.agents.map(a => [a.id, a]));

test('0288 AC1: speck agents --json gives each agent, whether it is installed and signed in, and its models', () => {
  const r = panelRepo();
  const out = speck(r.dir, { ...process.env, PATH: fakeAgents(READY) }, 'agents', '--json');
  assert.equal(out.status, 0, out.stderr);
  const json = JSON.parse(out.stdout);
  assert.deepEqual(json.agents.map(a => a.id), ['claude', 'codex', 'cursor']);
  const a = byId(json);
  assert.deepEqual(a.claude.name, 'Claude Code');
  assert.deepEqual(a.codex.name, 'Codex');
  assert.deepEqual(a.cursor.name, 'Cursor');
  for (const id of ['claude', 'codex', 'cursor']) {
    assert.equal(a[id].installed, true, id);
    assert.equal(a[id].signed_in, true, id);
    assert.ok(a[id].models.length > 0, id);
    for (const m of a[id].models) assert.deepEqual(Object.keys(m).sort(), ['description', 'display_name', 'name'], `${id} ${m.name}`);
  }
  assert.deepEqual(a.codex.models[0], { name: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: 'The frontier model for hard work.' });
  assert.deepEqual(a.codex.models[1], { name: 'gpt-small', display_name: null, description: null }, 'null where Codex gives none');
});

test('0288 AC1: an agent that is missing or signed out says so, with why', () => {
  const none = onlyOnPath(fakeAgents({}), () => byId(findAgents()));
  for (const id of ['claude', 'codex', 'cursor']) {
    assert.equal(none[id].installed, false, id);
    assert.equal(none[id].signed_in, false, id);
    assert.deepEqual(none[id].models, [], id);
    assert.match(none[id].why, /isn't installed/, id);
  }
  const out = onlyOnPath(fakeAgents({
    claude: { auth: { out: JSON.stringify({ loggedIn: false }), code: 1 } },
    codex: { login: { out: 'Not logged in', code: 1 }, models: READY.codex.models },
    agent: { status: { out: 'Not logged in' }, models: READY.agent.models },
  }), () => byId(findAgents()));
  for (const id of ['claude', 'codex', 'cursor']) {
    assert.equal(out[id].installed, true, id);
    assert.equal(out[id].signed_in, false, id);
    assert.match(out[id].why, /isn't signed in/, id);
  }
  assert.match(out.claude.why, /claude auth login|\/login/);
  assert.match(out.codex.why, /codex login/);
  assert.match(out.cursor.why, /agent login/);
  // Claude Code that prints something other than JSON isn't counted as signed in.
  const odd = onlyOnPath(fakeAgents({ claude: { auth: { out: 'Logged in' } } }), () => byId(findAgents()));
  assert.equal(odd.claude.signed_in, false);
});

test('0288 AC2: Codex\'s models from codex debug models without hidden ones, Cursor\'s from agent models, and Claude\'s four', () => {
  const a = onlyOnPath(fakeAgents(READY), () => byId(findAgents()));
  assert.deepEqual(a.codex.models.map(m => m.name), ['gpt-6.1-sol', 'gpt-small'], 'gpt-secret is hidden');
  assert.deepEqual(a.cursor.models, [
    { name: 'auto', display_name: 'Auto', description: null },
    { name: 'opus-4.6-thinking', display_name: 'Claude 4.6 Opus (Thinking)', description: null },
    { name: 'sonnet-4.6', display_name: 'Claude 4.6 Sonnet', description: null },
  ]);
  assert.deepEqual(a.claude.models.map(m => m.name), ['fable', 'opus', 'sonnet', 'haiku']);
  for (const m of a.claude.models) {
    const kind = m.name[0].toUpperCase() + m.name.slice(1);
    assert.equal(m.display_name, kind);
    assert.match(m.description, new RegExp(`newest ${kind}`));
  }
  // The same, read without waiting, for the panel.
  return onlyOnPathAsync(fakeAgents(READY), async () => assert.deepEqual(byId(await findAgentsAsync()), a));
});

test('0288 AC2: agent models lines, with ANSI colours, and anything else left out', () => {
  assert.deepEqual(parseCursorModels('\u001b[1mAvailable models\u001b[0m\n\n\u001b[36mgpt-5\u001b[0m - GPT-5  (current, default)\nnot a model line\nTip: x - y\n').models,
    [{ name: 'gpt-5', display_name: 'GPT-5', description: null }]);
  assert.match(parseCursorModels('').why, /\S/);
  assert.match(parseCursorModels('Available models\nTip: none').why, /\S/);
});

test('0288 AC2: a list that can\'t be read in time, or at all, is empty with the reason', async () => {
  assert.equal(AGENTS_TIMEOUT_MS, 10_000);
  const slow = { ...READY, codex: { login: READY.codex.login, models: { sleep: 5 } }, agent: { status: READY.agent.status, models: { sleep: 5 } } };
  const started = Date.now();
  const a = onlyOnPath(fakeAgents(slow), () => byId(findAgents({ timeoutMs: 300 })));
  assert.ok(Date.now() - started < 4000, 'ended, not waited for');
  for (const id of ['codex', 'cursor']) {
    assert.deepEqual(a[id].models, [], id);
    assert.match(a[id].models_why, /more than 0\.3 seconds/, id);
    assert.equal(a[id].signed_in, true, `${id}: still signed in`);
  }
  const b = await onlyOnPathAsync(fakeAgents(slow), async () => byId(await findAgentsAsync({ timeoutMs: 300 })));
  assert.match(b.cursor.models_why, /more than 0\.3 seconds/);
  const broken = { ...READY, codex: { login: READY.codex.login, models: { out: 'nope', code: 2 } }, agent: { status: READY.agent.status, models: { out: '{}' } } };
  const c = onlyOnPath(fakeAgents(broken), () => byId(findAgents()));
  assert.deepEqual(c.codex.models, []);
  assert.match(c.codex.models_why, /\S/);
  assert.deepEqual(c.cursor.models, []);
  assert.match(c.cursor.models_why, /\S/);
  // A list that was read gives no reason.
  assert.equal(onlyOnPath(fakeAgents(READY), () => byId(findAgents())).codex.models_why, undefined);
});

test('0288 AC2: Cursor\'s CLI found by its old name, cursor-agent, too', () => {
  const a = onlyOnPath(fakeAgents({ agent: { ...READY.agent, as: 'cursor-agent' } }), () => byId(findAgents()));
  assert.equal(a.cursor.installed, true);
  assert.equal(a.cursor.command, 'cursor-agent');
  assert.equal(a.cursor.models.length, 3);
});

// The Settings view, as the panel sends it with the agents it found.
const FOUND = (ready = {}) => ({ agents: [
  { id: 'claude', name: 'Claude Code', installed: true, signed_in: ready.claude ?? true, why: ready.claude === false ? 'Claude Code isn\'t signed in: run claude auth login.' : undefined },
  { id: 'codex', name: 'Codex', installed: ready.codex ?? true, signed_in: ready.codex ?? true, why: ready.codex === false ? 'Codex isn\'t installed.' : undefined },
  // 0347: Cursor is a reviewer too, so it's ready only when asked for.
  { id: 'cursor', name: 'Cursor', installed: ready.cursor ?? false, signed_in: ready.cursor ?? false, why: ready.cursor ? undefined : 'Cursor isn\'t installed.' },
] });
const reviewerRow = s => s.groups.flatMap(g => g.settings).find(x => x.key === 'reviewer');

test('0288 AC3: reviewer offers only agents installed and signed in, plus the current value, and says why others are missing', () => {
  const r = panelRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^reviewer: .*$/m, 'reviewer: claude-subagent'));
  const all = reviewerRow(panelSettings(r.dir, { agents: FOUND({ cursor: true }) }));
  assert.ok(all.choices.includes('codex') && all.choices.includes('claude-subagent'));
  assert.equal(all.missing, undefined);
  const row = reviewerRow(panelSettings(r.dir, { agents: FOUND({ codex: false }) }));
  assert.ok(!row.choices.includes('codex'));
  assert.ok(row.choices.includes('claude-subagent'));
  assert.match(row.missing, /codex/);
  assert.match(row.missing, /Codex isn't installed/);
  assert.ok(!row.missing.includes('\n'), 'one line');
  // The current value stays, even when its agent isn't ready.
  const cur = reviewerRow(panelSettings(r.dir, { agents: FOUND({ claude: false, codex: false }) }));
  assert.ok(cur.choices.includes('claude-subagent'));
  assert.match(cur.missing, /codex/);
  assert.doesNotMatch(cur.missing, /claude-subagent/);
  // Without the agents, every reviewer is offered, as before.
  assert.ok(reviewerRow(panelSettings(r.dir)).choices.includes('codex'));
});

const KEYS = ['builder', 'builder_model', 'reviewer', 'reviewer_model'];
const view = ({ missing, choices = ['codex', 'claude-subagent'] } = {}) => ({ groups: [{ title: 'Building and reviewing', settings: KEYS.map(key => ({
  key, value: key === 'builder' ? 'claude' : key === 'reviewer' ? 'codex' : '', default: false, explain: `What ${key} does.`, editable: key !== 'builder',
  ...(key === 'reviewer' ? { choices, ...(missing ? { missing } : {}) } : {}) })) }],
  reviewer_models: { reviewer: 'codex', models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: 'The frontier model for hard work.', efforts: ['low'] }, { slug: 'gpt-small', efforts: [] }] },
  builder_models: { builder: 'claude', models: CLAUDE_MODELS }, claude_models: CLAUDE_MODELS });
const optionText = (p, key) => Object.fromEntries(p.all(controlOf(p, key)).filter(n => n.tagName === 'option').map(o => [o.value, o.textContent]));

test('0288 AC3: builder_model and reviewer_model show each model\'s display name and description', async () => {
  const p = settingsPage([view()]);
  await openSettings(p);
  const reviewer = optionText(p, 'reviewer_model');
  assert.match(reviewer['gpt-6.1-sol'], /GPT-6\.1 Sol/);
  assert.match(reviewer['gpt-6.1-sol'], /The frontier model for hard work\./);
  assert.equal(reviewer['gpt-small'], 'gpt-small', 'just its name when Codex gives no more');
  const builder = optionText(p, 'builder_model');
  for (const m of CLAUDE_MODELS) {
    assert.match(builder[m.slug], new RegExp(m.display_name));
    assert.ok(builder[m.slug].includes(m.description), m.slug);
  }
});

test('0288 AC3: the view offers the reviewers the panel sent and shows why the others are missing', async () => {
  const p = settingsPage([view({ choices: ['codex'], missing: 'Not offered: claude-subagent (Claude Code isn\'t signed in: run claude auth login).' })]);
  await openSettings(p);
  assert.deepEqual(Object.keys(optionText(p, 'reviewer')), ['codex']);
  assert.ok(p.all(rowOf(p, 'reviewer')).some(n => n.tagName === 'p' && /Not offered: claude-subagent/.test(n.textContent)));
  const q = settingsPage([view()]);
  await openSettings(q);
  assert.ok(!q.all(rowOf(q, 'reviewer')).some(n => n.tagName === 'p' && /Not offered/.test(n.textContent)));
});

test('0288 AC3: with builder cursor, builder_model offers the models Cursor lists, with their names', async () => {
  const r = panelRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^builder: .*$/m, 'builder: cursor'));
  const built = await onlyOnPathAsync(fakeAgents(READY), () => builderModels(r.dir));
  assert.deepEqual(built, { builder: 'cursor', models: [
    { slug: 'auto', display_name: 'Auto' },
    { slug: 'opus-4.6-thinking', display_name: 'Claude 4.6 Opus (Thinking)' },
    { slug: 'sonnet-4.6', display_name: 'Claude 4.6 Sonnet' },
  ] });
  const p = settingsPage([{ ...view(), builder_models: built }]);
  await openSettings(p);
  const text = optionText(p, 'builder_model');
  assert.deepEqual(Object.keys(text), ['', 'auto', 'opus-4.6-thinking', 'sonnet-4.6']);
  assert.match(text['opus-4.6-thinking'], /Claude 4\.6 Opus \(Thinking\)/);
  // Not installed, or a list it can't read: a box to type in, saying why.
  const none = await onlyOnPathAsync(fakeAgents({}), () => builderModels(r.dir));
  assert.equal(none.models, undefined);
  assert.match(none.why, /Cursor isn't installed/);
  const q = settingsPage([{ ...view(), builder_models: none }]);
  await openSettings(q);
  assert.equal(controlOf(q, 'builder_model').tagName, 'input');
  assert.ok(q.all(rowOf(q, 'builder_model')).some(n => n.tagName === 'p' && /Cursor isn't installed/.test(n.textContent)));
});

test('0288 AC5: speck agents prints the same as plain lines', () => {
  const r = panelRepo();
  const env = { ...process.env, PATH: fakeAgents({ ...READY, codex: { login: { code: 1 }, models: READY.codex.models } }) };
  const json = JSON.parse(speck(r.dir, env, 'agents', '--json').stdout);
  const out = speck(r.dir, env, 'agents');
  assert.equal(out.status, 0, out.stderr);
  assert.doesNotMatch(out.stdout, /^\s*[{[]/, 'not JSON');
  for (const a of json.agents) {
    assert.ok(out.stdout.includes(a.name), a.name);
    if (!a.installed) assert.match(out.stdout, new RegExp(`${a.name} \\(${a.command}\\): not installed`));
    else if (a.why) assert.ok(out.stdout.includes(a.why), a.why);
    for (const m of a.models) {
      assert.ok(out.stdout.includes(m.name), m.name);
      if (m.display_name) assert.ok(out.stdout.includes(m.display_name), m.display_name);
      if (m.description) assert.ok(out.stdout.includes(m.description), m.description);
    }
  }
  assert.match(out.stdout, /Codex.*not signed in/);
  assert.match(out.stdout, /Claude Code.*signed in/);
  assert.equal(speck(r.dir, env, 'agents', '--bogus').status, 1);
});

test('0288 AC4: setup and the brief name speck agents', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const setup = fs.readFileSync(path.join(root, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  assert.match(setup, /`speck agents --json`/);
  assert.match(setup, /speck config set reviewer_model <name>/);
  assert.match(setup, /speck config set builder_model <name>/);
  assert.match(fs.readFileSync(path.join(root, 'docs', 'brief.md'), 'utf8'), /^\| `speck agents \[--json\]` \|/m);
  assert.match(fs.readFileSync(path.join(root, 'scripts', 'speck.mjs'), 'utf8'), /speck agents \[--json\]/);
});
