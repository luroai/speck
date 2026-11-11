// 0645: each team member's bench, the agents in order speck switches it to while its own agent is held by a usage limit.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { speck } from './support/cli.mjs';
import { SpeckError, loadConfig } from '../scripts/core.mjs';
import { MACHINE_SETTINGS, machineConfig, machineConfigFile } from '../scripts/machine.mjs';
import { checkConfigValue, benchOwnAgent } from '../scripts/config.mjs';
import { BENCHES, benchOf } from '../scripts/bench.mjs';
import { standIn } from '../scripts/watch-stand-in.mjs';
import { FOREMAN_AGENTS } from '../scripts/foreman-agent.mjs';

const PROVIDER = { name: 'deepseek', label: 'DeepSeek', address: 'https://api.deepseek.example', defaultModel: 'deepseek-chat', models: ['deepseek-chat'] };
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

// A git repo with a claude builder and a codex reviewer, and no watch_agent, so the watch agent is claude.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bench-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\nbuilder: claude\nreviewer: codex\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  git(dir, 'add', '.');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  return { dir, set: (...a) => speck(dir, process.env, 'config', 'set', ...a), show: (...a) => speck(dir, process.env, 'config', 'show', ...a) };
}

// ---------- AC1 ----------

test('0645 AC1: the three benches are settings of your own, each a list of agents speck knows', () => {
  for (const key of ['builder_bench', 'reviewer_bench', 'watch_bench']) {
    assert.ok(MACHINE_SETTINGS.includes(key), `${key} is one of your own settings`);
    assert.deepEqual(checkConfigValue(key, 'codex, cursor'), ['codex', 'cursor']);
    assert.deepEqual(checkConfigValue(key, '[cursor claude]'), ['cursor', 'claude']);
    assert.deepEqual(checkConfigValue(key, 'codex,codex'), ['codex'], 'each agent once');
    assert.deepEqual(checkConfigValue(key, 'deepseek', [PROVIDER]), ['deepseek'], 'a model provider by its name');
    assert.equal(checkConfigValue(key, ''), '', 'blank');
    for (const bad of ['gemini', 'codex,constructor', '__proto__'])
      assert.throws(() => checkConfigValue(key, bad), e => e instanceof SpeckError && /doesn't know/.test(e.message), `${key} ${bad}`);
  }
  assert.deepEqual([...BENCHES], ['builder_bench', 'reviewer_bench', 'watch_bench']);
});

test('0645 AC1: speck config set saves a bench for this machine, refusing an unknown agent or the member\'s own', () => {
  const r = repo();
  const saved = r.set('builder_bench', 'cursor,codex');
  assert.equal(saved.status, 0, saved.stderr);
  assert.deepEqual(machineConfig(r.dir).builder_bench, ['cursor', 'codex']);
  assert.deepEqual(loadConfig(r.dir).builder_bench, ['cursor', 'codex'], 'read back as the list given');
  for (const [key, own] of [['builder_bench', 'claude'], ['reviewer_bench', 'codex'], ['watch_bench', 'claude']]) {
    const out = r.set(key, `cursor,${own}`);
    assert.notEqual(out.status, 0, `${key} naming ${own}`);
    assert.match(out.stderr, new RegExp(`${key} names ${own}, which is .*own agent`));
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
  }
  const unknown = r.set('watch_bench', 'gemini');
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /watch_bench names "gemini", an agent speck doesn't know/);
  assert.equal(machineConfig(r.dir).watch_bench, undefined, 'nothing refused was saved');
  assert.equal(r.set('builder_bench', '').status, 0, 'a bench can be set blank');
  assert.equal(machineConfig(r.dir).builder_bench, '');
});

test('0645 AC1: a bench is checked as speck reads it, refusing an unknown agent, the member\'s own or one that isn\'t a list', () => {
  assert.throws(() => benchOf({ builder_bench: ['gemini'] }, 'builder_bench', { own: 'claude' }), e => e instanceof SpeckError && /doesn't know/.test(e.message) && /speck config set builder_bench/.test(e.message));
  // The member's own agent, as it is now: a builder switched to codex can't stand in for itself.
  const cfg = { builder: 'codex', builder_bench: ['claude', 'codex'] };
  assert.throws(() => benchOf(cfg, 'builder_bench', { own: benchOwnAgent(cfg, 'builder_bench', []) }), /builder_bench names codex, which is the builder's own agent/);
  assert.equal(benchOwnAgent({ reviewer: 'claude-subagent' }, 'reviewer_bench', []), 'claude');
  assert.equal(benchOwnAgent({ builder: 'cursor' }, 'watch_bench', []), 'cursor', 'the watch agent follows the builder when watch_agent is blank');
  const r = repo();
  fs.mkdirSync(path.dirname(machineConfigFile(r.dir)), { recursive: true });
  fs.writeFileSync(machineConfigFile(r.dir), 'watch_bench: 3\n');
  assert.throws(() => loadConfig(r.dir), e => e instanceof SpeckError && /watch_bench .* must be blank or a list of agents/.test(e.message));
});

// ---------- AC2 ----------

test('0645 AC2: a blank bench is your agents in speck agents\' order, without the member\'s own or a model provider', () => {
  const yours = ['claude', 'codex', 'cursor', 'deepseek'];
  for (const blank of [undefined, '', []])
    assert.deepEqual(benchOf({ builder_bench: blank }, 'builder_bench', { yours, own: 'claude', providers: [PROVIDER] }), ['codex', 'cursor']);
  assert.deepEqual(benchOf({}, 'reviewer_bench', { yours, own: 'codex', providers: [PROVIDER] }), ['claude', 'cursor']);
  assert.deepEqual(benchOf({}, 'watch_bench', { yours: ['cursor', 'deepseek'], own: 'claude', providers: [PROVIDER] }), ['cursor'], 'only your agents');
  assert.deepEqual(benchOf({ watch_bench: ['deepseek', 'codex'] }, 'watch_bench', { yours, own: 'claude', providers: [PROVIDER] }), ['deepseek', 'codex'], 'one set keeps its order and providers');
});

// ---------- AC3 ----------

// The watch agent's stand-in, with `held` the agents held by a limit and `ready` your ready agents in speck agents' order.
function stand({ held = ['claude'], ready = ['claude', 'codex', 'cursor', 'deepseek'] } = {}) {
  const said = [], s = { moved: null };
  const { lookOn } = standIn({ heldAgent: a => held.includes(a), readyAgents: () => ready, speak: m => said.push(m), agents: FOREMAN_AGENTS });
  return { said, on: cfg => lookOn(s, { watch_agent: 'claude', ...cfg }, 'claude', [PROVIDER])?.watch_agent ?? null };
}

test('0645 AC3: the watch agent takes its stand-in from watch_bench in order, skipping agents not ready or held', () => {
  assert.equal(stand().on({ watch_bench: ['cursor', 'codex'] }), 'cursor', 'the first on the bench, not speck agents\' first');
  assert.equal(stand({ held: ['claude', 'cursor'] }).on({ watch_bench: ['cursor', 'codex'] }), 'codex', 'Cursor is held');
  assert.equal(stand({ ready: ['claude', 'codex'] }).on({ watch_bench: ['cursor', 'codex'] }), 'codex', 'Cursor isn\'t ready');
  assert.equal(stand().on({ watch_bench: ['deepseek', 'codex'] }), 'deepseek', 'a provider on the bench stands in');
  assert.equal(stand({ held: ['claude', 'cursor'] }).on({ watch_bench: ['cursor'] }), null, 'none on the bench can: it waits');
  assert.equal(stand({ ready: ['claude', 'deepseek', 'cursor'] }).on({}), 'cursor', 'blank: your agents in order, without a provider');
});

test('0645 AC3: a watch_bench speck can\'t use is said once, and the look waits rather than running on it', () => {
  const t = stand();
  assert.equal(t.on({ watch_bench: ['claude', 'codex'] }), null);
  assert.equal(t.on({ watch_bench: ['claude', 'codex'] }), null);
  assert.equal(t.said.length, 1, t.said.join('\n'));
  assert.match(t.said[0], /watch_bench names claude, which is the watch agent's own agent/);
  assert.equal(stand({ held: [] }).on({ watch_bench: ['claude'] }), 'claude', 'while its own agent isn\'t held, the bench isn\'t read');
});

// ---------- AC4 ----------

test('0645 AC4: speck config show shows each bench, what it does and that blank means your agents in order', () => {
  const r = repo();
  assert.equal(r.set('watch_bench', 'cursor').status, 0);
  const out = r.show('--json');
  assert.equal(out.status, 0, out.stderr);
  const all = JSON.parse(out.stdout).groups.flatMap(g => g.settings);
  for (const key of BENCHES) {
    const s = all.find(x => x.key === key);
    assert.ok(s, `${key} is shown`);
    assert.match(s.explain, /in order/, key);
    assert.match(s.explain, /usage limit/, key);
    assert.match(s.explain, /Blank means your agents in the order speck agents lists them/, key);
  }
  const watch = all.find(x => x.key === 'watch_bench');
  assert.deepEqual(watch.value, ['cursor']);
  assert.equal(watch.this_machine, true);
  assert.equal(all.find(x => x.key === 'builder_bench').is_default, true);
  const plain = r.show();
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(plain.stdout, /^ {2}builder_bench: "" \(the default\)$/m);
  assert.match(plain.stdout, /^ {2}watch_bench: \[cursor\] \(this machine's own/m);
});
