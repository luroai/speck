import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings } from '../scripts/settings.mjs';
import { foremanAgentQueue, foremanArgv, foremanAgentOf, skillPath } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0333: run the Foreman on Cursor ----------

const HEADLESS = ['-p', '--force', '--trust', '--output-format', 'stream-json'];

// A folder holding a stand-in for each of `names`, so speck finds Cursor's CLI by that name.
function cursorBin(names) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-bin-'));
  for (const name of names) fs.writeFileSync(path.join(bin, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return bin;
}
function withPath(dirs, fn) {
  const was = process.env.PATH;
  process.env.PATH = dirs.join(path.delimiter);
  try { return fn(); } finally { process.env.PATH = was; }
}

test('0333 AC1: speck config set foreman cursor and the Settings view accept cursor as the Foreman\'s agent', () => {
  assert.equal(checkConfigValue('foreman', 'cursor'), 'cursor');
  assert.throws(() => checkConfigValue('foreman', 'Cursor'), /foreman must be blank or one of claude, codex, cursor/);
  const r = panelRepo();
  const out = r.run('config', 'set', 'foreman', 'cursor');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(loadConfig(r.dir).foreman, 'cursor');
  const g = panelSettings(r.dir).groups.find(x => x.title === 'Watching');
  const foreman = g.settings.find(s => s.key === 'foreman');
  assert.ok(foreman.choices.includes('cursor'), String(foreman.choices));
  assert.match(foreman.explain, /cursor/);
});

test('0333 AC2: with foreman cursor, the Foreman starts with Cursor\'s CLI headless, on foreman_model when it\'s set, with the brief as the prompt', () => {
  assert.deepEqual(foremanArgv({ foreman: 'cursor' }, 'B', 'agent'), ['agent', ...HEADLESS, 'B'], 'blank foreman_model: no --model');
  assert.deepEqual(foremanArgv({ foreman: 'cursor', foreman_model: 'gpt-5-high' }, 'B', 'agent'), ['agent', ...HEADLESS, '--model', 'gpt-5-high', 'B']);
  const effort = foremanArgv({ foreman: 'cursor', foreman_effort: 'high' }, 'B', 'agent');
  assert.ok(!effort.some(w => /effort/.test(w)), 'foreman_effort isn\'t passed to Cursor');
  assert.equal(skillPath('cursor'), '.claude/skills/speck-watch/SKILL.md');
});

test('0333 AC2: the Foreman finds Cursor\'s CLI as agent, or as cursor-agent when only that is installed', () => {
  assert.equal(withPath([cursorBin(['agent', 'cursor-agent'])], () => foremanArgv({ foreman: 'cursor' }, 'B'))[0], 'agent');
  assert.equal(withPath([cursorBin(['cursor-agent'])], () => foremanArgv({ foreman: 'cursor' }, 'B'))[0], 'cursor-agent');
});

test('0333 AC2: speck run\'s Foreman queue starts a Cursor Foreman with its brief as the prompt', () => {
  const r = blockedRepo({ status: 'building' }), starts = [];
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), foreman_fixing: 'fix', foreman: 'cursor', foreman_model: 'm1' }),
    words: [], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again: () => {} }, say: () => {},
    startBuild: () => {}, start: argv => { starts.push(argv); return { pid: 91000, exited: () => false }; }, alive: () => true, withToken: () => [] });
  q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  q.check([{ id: '0001', status: 'building' }]);
  assert.equal(starts.length, 1);
  const argv = starts[0];
  assert.ok(['agent', 'cursor-agent'].includes(argv[0]), argv[0]);
  assert.deepEqual(argv.slice(1, 8), [...HEADLESS, '--model', 'm1']);
  assert.match(argv.at(-1), /You are speck, watching the pipeline\. Work on ticket 0001/);
  assert.match(argv.at(-1), /\.claude\/skills\/speck-watch\/SKILL\.md/);
});

test('0333 AC3: with foreman blank and a Cursor builder, the Foreman runs on Cursor', () => {
  assert.equal(foremanAgentOf({ builder: 'cursor' }), 'cursor');
  assert.equal(foremanAgentOf({ builder: 'cursor', foreman: '' }), 'cursor');
  assert.equal(foremanArgv({ builder: 'cursor' }, 'B', 'agent')[1], '-p');
  assert.equal(foremanAgentOf({ builder: 'cursor', foreman: 'claude' }), 'claude', 'a foreman that is set wins');
});

test('0333 AC4: with foreman blank and any other builder, the Foreman runs as before', () => {
  assert.equal(foremanAgentOf({ builder: 'codex' }), 'codex');
  assert.equal(foremanAgentOf({ builder: 'claude' }), 'claude');
  assert.equal(foremanAgentOf({}), 'claude');
  assert.equal(foremanAgentOf({ builder: 'gemini' }), 'claude');
  assert.equal(foremanAgentOf({ builder: '__proto__' }), 'claude');
  assert.equal(foremanAgentOf({ foreman: 'cursor', builder: 'codex' }), 'cursor');
  assert.deepEqual(foremanArgv({ builder: 'codex' }, 'B').slice(0, 2), ['codex', 'exec']);
  assert.deepEqual(foremanArgv({ builder: 'claude' }, 'B').slice(0, 3), ['claude', '-p', 'B']);
});
