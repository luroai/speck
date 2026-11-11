// 0654: the tests that start speck run through test/support/run.mjs see only the agents they fake, so they give the
// same result on any machine.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runRepo, startRun, stopRun, waitFor, runEnv, agentFreePath, AGENT_CLIS, HOME, CLI } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { deadPid } from './support/blocked.mjs';

const onPathOf = (e, cmd) => e.PATH.split(path.delimiter).some(d => fs.existsSync(path.join(d, cmd)));
const bin = (files, mode = 0o755) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text, { mode });
  return dir;
};

// ---------- AC1 ----------
test('0654 AC1: speck run is given no agent CLI on its PATH, an empty home folder and none of the agents\' settings', () => {
  const e = runEnv();
  for (const cmd of AGENT_CLIS) assert.ok(!onPathOf(e, cmd), `${cmd} isn't on the PATH`);
  assert.ok(onPathOf(e, 'git'), 'git still is');
  assert.equal(e.HOME, HOME);
  assert.notEqual(e.HOME, os.homedir());
  assert.deepEqual(fs.readdirSync(e.HOME), []);
  for (const k of Object.keys(e)) assert.doesNotMatch(k, /^(ANTHROPIC_|OPENAI_|CLAUDE|CODEX_|CURSOR_|XDG_CONFIG_HOME$)/, k);
});

test('0654 AC1: a machine folder with an agent CLI is swapped for one without it, and a test\'s own folder is kept', () => {
  const machine = bin({ claude: '', codex: '', agent: '', 'cursor-agent': '', tool: '' });
  const own = bin({ agent: '' });
  const dirs = agentFreePath([own, machine].join(path.delimiter), [machine]).split(path.delimiter);
  assert.equal(dirs[0], own);
  assert.notEqual(dirs[1], machine);
  assert.deepEqual(fs.readdirSync(dirs[1]), ['tool']);
  assert.equal(agentFreePath(machine, [machine]), dirs[1], 'the same copy each time');
});

test('0654 AC1: settings a test gives speck run itself are kept', () => {
  const e = runEnv({ HOME: '/home/me', CODEX_HOME: '/codex', PATH: `/own${path.delimiter}${process.env.PATH}` });
  assert.equal(e.HOME, '/home/me');
  assert.equal(e.CODEX_HOME, '/codex');
  assert.equal(e.PATH.split(path.delimiter)[0], '/own');
  for (const cmd of AGENT_CLIS) assert.ok(!onPathOf(e, cmd), `${cmd} isn't on the PATH`);
});

test('0654 AC1: speck finds none of this machine\'s agents with the environment speck run is given', () => {
  const r = runRepo();
  const res = spawnSync(process.execPath, [CLI, 'agents', '--json'], { cwd: r.dir, encoding: 'utf8', env: runEnv() });
  assert.equal(res.status, 0, res.stderr);
  const report = JSON.parse(res.stdout);
  assert.deepEqual(report.agents.filter(a => a.installed).map(a => a.id), []);
});

// ---------- AC3 ----------
// A fake Cursor CLI that says it's signed in, makes a chat, and records each build it's started with in the repo's
// fake-out folder.
const CURSOR = `#!${process.execPath}
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
if (args[0] === 'status') { console.log('Logged in as t@t'); process.exit(0); }
if (args[0] === 'create-chat') { console.log('chat-0654'); process.exit(0); }
const dir = require('child_process').execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim();
const calls = path.join(dir, 'fake-out');
fs.writeFileSync(path.join(calls, fs.readdirSync(calls).length + '.json'), JSON.stringify({ at: Date.now(), args }));
`;
// Claude's own builds, which mustn't start while it's limited.
const CLAUDE_BUILD = `require('fs').writeFileSync(require('path').join(require('child_process').execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim(), 'fake-out', 'claude-' + Date.now() + '.json'), JSON.stringify({ at: Date.now(), claude: true }));`;

test('0654 AC3: with a second faked agent ready on the builder\'s bench, new work starts on it while Claude is limited', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', {}]], command: `"${process.execPath}" "${keptFile('fake-claude-0654.cjs', CLAUDE_BUILD)}" @repo --session-id {session} "/speck-build {id}"` });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs'), resets = Math.ceil(Date.now() / 1000) + 600;
  fs.mkdirSync(runs, { recursive: true });
  const limit = { type: 'rate_limit_event', rate_limit_info: { status: 'rejected', resetsAt: resets, rateLimitType: 'five_hour' } };
  fs.writeFileSync(path.join(runs, '0001.log'), `${JSON.stringify(limit)}\n${JSON.stringify({ type: 'result', is_error: true, api_error_status: 429, result: 'You\'ve hit your session limit' })}\n`);
  saveRecord(path.join(runs, '0001.json'), { id: '0001', session: 'off-session', cwd: r.dir, pid: deadPid(), started: new Date().toISOString() });
  const fake = bin({ agent: CURSOR });
  const run = startRun(r.dir, { SPECK_RUN_LIMIT_GRACE_MS: '0', PATH: `${fake}${path.delimiter}${runEnv().PATH}` });
  try {
    await waitFor(() => r.calls().length === 1, 'the next ticket to start', run.out);
    assert.match(run.out(), /new builds start on Cursor/);
    const [call] = r.calls();
    assert.ok(!call.claude, 'not on Claude');
    assert.match(call.args.join(' '), /speck-build 0002/);
    assert.ok(call.args.includes('chat-0654'), 'in the chat made for it');
    assert.ok(call.at < resets * 1000, 'while Claude is limited');
    assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'tickets', '0002-t.md'), 'utf8'), /^builder: cursor$/m);
    assert.equal(r.g('status', '--porcelain', 'speck/tickets'), '', 'its builder is committed');
  } finally { await stopRun(run); }
});
