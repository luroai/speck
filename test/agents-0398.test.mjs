import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fakeAgents, READY } from './support/agents.mjs';
import { panelRepo } from './support/panel.mjs';
import { speck } from './support/cli.mjs';
import { saveProviderKey } from '../scripts/keys.mjs';
import { yourAgentsFile, readYourAgents, yourAgents, fillYourAgents, rolesUsing } from '../scripts/your-agents.mjs';

// ---------- 0398: keep a list of your agents for this machine ----------

// Only the stand-ins and git on the PATH, so the machine's own agents don't count.
const pathOf = spec => `${fakeAgents(spec)}:/usr/bin:/bin`;
const envOf = spec => ({ ...process.env, PATH: pathOf(spec) });
const json = (r, env) => { const out = speck(r.dir, env, 'agents', '--json'); assert.equal(out.status, 0, out.stderr); return JSON.parse(out.stdout); };
const byId = report => Object.fromEntries([...report.agents, ...report.providers].map(a => [a.id, a]));
const ONLY_CLAUDE = { claude: READY.claude };
// Runs fn with only the stand-ins `spec` names on the PATH.
function withPath(spec, fn) {
  const was = process.env.PATH;
  process.env.PATH = pathOf(spec);
  try { return fn(); } finally { process.env.PATH = was; }
}

test('0398 AC1: speck agents shows every agent speck knows, whether it is yours, ready, and its models', () => {
  const r = panelRepo();
  saveProviderKey(r.dir, 'deepseek', 'sk-test');
  const report = json(r, envOf({ claude: READY.claude, codex: READY.codex }));
  assert.equal(report.list, false);
  const a = byId(report);
  assert.deepEqual(Object.keys(a), ['claude', 'codex', 'cursor', 'deepseek']);
  assert.equal(a.claude.yours, true);
  assert.equal(a.codex.yours, true);
  assert.equal(a.cursor.yours, false);
  assert.equal(a.cursor.installed, false);
  assert.equal(a.deepseek.key_set, true);
  assert.equal(a.deepseek.yours, true);
  assert.deepEqual(a.deepseek.models.map(m => m.name), ['deepseek-v4-pro', 'deepseek-v4-flash']);
  assert.ok(a.codex.models.length > 0);
  const out = speck(r.dir, envOf({ claude: READY.claude, codex: READY.codex }), 'agents');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Claude Code \(claude\): installed, signed in, yours/);
  assert.match(out.stdout, /Cursor \(agent\): not installed, not yours/);
  assert.match(out.stdout, /DeepSeek \(deepseek\): key set, yours/);
  assert.match(out.stdout, /deepseek-v4-flash/);
});

test('0398 AC1: the list is kept for this machine, in the cache git ignores, so it commits nothing', () => {
  const r = panelRepo();
  const env = envOf(ONLY_CLAUDE);
  assert.equal(speck(r.dir, env, 'agents', 'add', 'claude').status, 0);
  const file = yourAgentsFile(r.dir);
  assert.equal(path.relative(r.dir, file), path.join('speck', '.cache', 'machine', 'agents.json'));
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { agents: ['claude'] });
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: r.dir, encoding: 'utf8' }).stdout.trim(), '');
  assert.equal(json(r, env).list, true);
});

test('0398 AC2: add and remove change the list', () => {
  const r = panelRepo();
  const env = envOf({ claude: READY.claude, codex: READY.codex });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^builder:.*$/m, 'builder: codex'));
  saveProviderKey(r.dir, 'deepseek', 'sk-test');
  let out = speck(r.dir, env, 'agents', 'remove', 'deepseek');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Removed DeepSeek/);
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex'], 'starts from the agents that counted as yours');
  out = speck(r.dir, env, 'agents', 'add', 'DeepSeek');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /Added DeepSeek/);
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex', 'deepseek']);
  out = speck(r.dir, env, 'agents', 'add', 'deepseek');
  assert.match(out.stdout, /already one of your agents/);
  assert.equal(byId(json(r, env)).deepseek.yours, true);
});

test('0398 AC2: adding a provider without its key, or an agent not installed, is refused with how to fix it', () => {
  const r = panelRepo();
  const env = envOf(ONLY_CLAUDE);
  let out = speck(r.dir, env, 'agents', 'add', 'deepseek');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /DeepSeek has no API key.*speck keys set deepseek/);
  out = speck(r.dir, env, 'agents', 'add', 'cursor');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /Cursor isn't installed.*Install it/);
  out = speck(r.dir, env, 'agents', 'add', 'gemini');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /doesn't know an agent called "gemini".*claude, codex, cursor, deepseek/);
  out = speck(r.dir, env, 'agents', 'add', '__proto__');
  assert.equal(out.status, 1);
  assert.equal(speck(r.dir, env, 'agents', 'add').status, 1);
  assert.equal(readYourAgents(r.dir), null, 'nothing was written');
});

test('0398 AC2: removing an agent the builder, reviewer or Foreman uses is refused, naming the role', () => {
  const r = panelRepo();
  const env = envOf({ claude: READY.claude, codex: READY.codex });
  let out = speck(r.dir, env, 'agents', 'remove', 'claude');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /Claude Code is the builder and the agent speck watches with, so it wasn't removed/);
  out = speck(r.dir, env, 'agents', 'remove', 'codex');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /Codex is the reviewer/);
  assert.equal(readYourAgents(r.dir), null);
  assert.deepEqual(rolesUsing('claude', { builder: 'codex', reviewer: 'claude-subagent' }), ['reviewer']);
  assert.deepEqual(rolesUsing('deepseek', { builder: 'claude', reviewer: 'codex', foreman: 'deepseek' }), ['Foreman']);
});

// A new repo, set up with speck init and its checks.
function initRepo(spec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-init-0398-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  return { dir, init: () => speck(dir, envOf(spec), 'init') };
}

test('0398 AC3: speck init adds every agent it finds ready, and says which', () => {
  const { dir, init } = initRepo({ claude: READY.claude, codex: READY.codex, agent: { status: { out: 'Not logged in' }, models: READY.agent.models } });
  const out = init();
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /added {3}your agents on this machine: Claude Code, Codex\n/);
  assert.deepEqual(readYourAgents(dir), ['claude', 'codex']);
});

test('0398 AC3: an existing list is left as it is', () => {
  const { dir, init } = initRepo({ claude: READY.claude, codex: READY.codex });
  fs.mkdirSync(path.dirname(yourAgentsFile(dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(dir), JSON.stringify({ agents: ['codex'] }));
  const out = init();
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /kept {4}this machine's list of your agents \(Codex\)/);
  assert.deepEqual(JSON.parse(fs.readFileSync(yourAgentsFile(dir), 'utf8')), { agents: ['codex'] });
  assert.equal(withPath({ claude: READY.claude, codex: READY.codex }, () => fillYourAgents(dir)), null);
});

test('0398 AC3: a provider whose key is set is added too', () => {
  const r = panelRepo();
  saveProviderKey(r.dir, 'deepseek', 'sk-test');
  assert.deepEqual(withPath({}, () => fillYourAgents(r.dir)), ['deepseek']);
  assert.deepEqual(readYourAgents(r.dir), ['deepseek']);
});

test('0398 AC3: a list that cannot be read is reported by init, not a crash, and left alone', () => {
  const { dir, init } = initRepo(ONLY_CLAUDE);
  fs.mkdirSync(path.dirname(yourAgentsFile(dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(dir), 'not json');
  const out = init();
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /skipped your agents on this machine: .*can't be read\. Delete it/);
  assert.equal(fs.readFileSync(yourAgentsFile(dir), 'utf8'), 'not json');
});

test('0398 AC4: without a list, every ready agent and provider with a key is yours, and nothing is written', () => {
  const r = panelRepo();
  assert.deepEqual(withPath({ codex: READY.codex, agent: READY.agent }, () => yourAgents(r.dir)), ['codex', 'cursor']);
  assert.deepEqual(withPath({}, () => yourAgents(r.dir)), []);
  // With nothing ready, init makes no list, so an agent set up later still counts as yours.
  assert.deepEqual(withPath({}, () => fillYourAgents(r.dir)), []);
  assert.equal(readYourAgents(r.dir), null);
  assert.deepEqual(withPath(ONLY_CLAUDE, () => yourAgents(r.dir)), ['claude']);
  assert.equal(fs.existsSync(yourAgentsFile(r.dir)), false);
});

test('0398 AC5: the README and speck help name the agents commands', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  for (const s of ['speck agents add', 'speck agents remove', 'speck/.cache/machine/agents.json']) assert.ok(readme.includes(s), s);
  const help = speck(root, process.env, 'help').stdout;
  assert.match(help, /speck agents add\|remove <agent>/);
});

test('0398 AC3 F1: setup saves the list in a project that already had speck', () => {
  const setup = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  for (const s of ['`list`', '`yours`', '`speck agents add <id>`', '`speck agents remove <agent>`']) assert.ok(setup.includes(s), s);
  // What it runs saves every agent that counted as yours: the first add keeps them all.
  const r = panelRepo();
  saveProviderKey(r.dir, 'deepseek', 'sk-test');
  const env = envOf({ claude: READY.claude, codex: READY.codex });
  for (const a of [...json(r, env).agents, ...json(r, env).providers].filter(x => x.yours)) assert.equal(speck(r.dir, env, 'agents', 'add', a.id).status, 0);
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex', 'deepseek']);
});

test('0398 AC1 F2: speck agents still lists every agent before speck is set up', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-none-0398-'));
  const out = speck(dir, envOf(ONLY_CLAUDE), 'agents', '--json');
  assert.equal(out.status, 0, out.stderr);
  const report = JSON.parse(out.stdout), a = byId(report);
  assert.equal(report.list, false);
  assert.equal(a.claude.installed, true);
  assert.equal(a.claude.yours, true);
  assert.equal(a.deepseek.key_set, false);
  assert.equal(speck(dir, envOf(ONLY_CLAUDE), 'agents').status, 0);
  const add = speck(dir, envOf(ONLY_CLAUDE), 'agents', 'add', 'claude');
  assert.equal(add.status, 1);
  assert.match(add.stderr, /No speck\/config.yml found/);
});
