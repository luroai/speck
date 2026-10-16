import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, runRepo, until, stopRun, ROOT } from './support/run.mjs';
import { runsPath } from './support/ticker.mjs';
import { buildEnv } from '../scripts/build-env.mjs';

// ---------- 0245: speck run's Claude Code builds can't run commands in the background ----------

const VAR = 'CLAUDE_CODE_DISABLE_BACKGROUND_TASKS';
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;

// A stand-in for Claude Code, a file named claude: records its arguments and the variable in <out>/<n>.json.
function fakeClaude(out) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-claude-')), 'claude');
  fs.writeFileSync(file, `#!${process.execPath}
const fs = require('fs'), path = require('path');
let n = 0; while (fs.existsSync(path.join(${JSON.stringify(out)}, n + '.json'))) n++;
fs.writeFileSync(path.join(${JSON.stringify(out)}, n + '.json'), JSON.stringify({ args: process.argv.slice(2), has: ${JSON.stringify(VAR)} in process.env, value: process.env[${JSON.stringify(VAR)}] }));
`, { mode: 0o755 });
  return file;
}

// A repo whose build_command starts the fake claude, and speck run started in it with the variable as `value`
// (undefined: not set at all), stopped once the fake has been started `n` times.
async function launched({ status = 'ready', value, prepare = () => {} } = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-claude-out-'));
  const r = runRepo({ tickets: [['0001', { status }]], command: `"${fakeClaude(out)}" -p "/speck-build {id}" --session-id {session}` });
  prepare(r);
  const runEnv = { ...env };
  delete runEnv[VAR];
  if (value !== undefined) runEnv[VAR] = value;
  const child = spawn(process.execPath, [CLI, 'run'], { cwd: r.dir, env: runEnv });
  let said = '';
  child.stdout.on('data', d => { said += d; });
  child.stderr.on('data', d => { said += d; });
  const run = { child, exited: new Promise(res => child.on('exit', res)) };
  const calls = () => fs.readdirSync(out).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')));
  try { await until(() => calls().length >= 1 || child.exitCode !== null, 10000); } finally { await stopRun(run); }
  assert.equal(calls().length, 1, said);
  return calls()[0];
}

test('0245 AC1: a build whose first word is claude, or a path ending in /claude, gets the variable set to 1', () => {
  for (const argv of [['claude', '-p', '/speck-build 0001'], ['/usr/local/bin/claude', '-p', 'x'], ['./claude']]) {
    const e = buildEnv(argv, 's1', { PATH: '/bin' });
    assert.equal(e[VAR], '1', argv[0]);
    assert.equal(e.SPECK_BUILD_SESSION, 's1', argv[0]);
    assert.equal(e.PATH, '/bin', argv[0]);
  }
});

test('0245 AC1: a new build speck run starts with Claude Code has the variable set to 1', async () => {
  const call = await launched();
  assert.equal(call.value, '1');
});

test('0245 AC1: a killed Claude Code build that speck run resumes has the variable set to 1', async () => {
  const call = await launched({
    status: 'building',
    prepare: r => {
      const session = crypto.randomUUID();
      fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
      fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify({ id: '0001', session, cwd: r.dir, started: '2026-10-10T10:00:00.000Z', pid: deadPid(), command: ['claude', '-p', '/speck-build 0001'] }));
      fs.writeFileSync(runsPath(r.dir, '0001.log'), 'first build line\n');
    },
  });
  assert.ok(call.args.includes('--resume'), JSON.stringify(call.args));
  assert.equal(call.value, '1');
});

test('0245 AC1: every build speck run starts, handed back ones included, goes through the one spawn that sets it', () => {
  const run = fs.readFileSync(path.join(ROOT, 'scripts', 'run.mjs'), 'utf8');
  assert.equal(run.match(/spawn\(argv\[0\]/g)?.length, 1);
  assert.match(run, /spawn\(argv\[0\], argv\.slice\(1\), \{[^}]*env: buildEnv\(argv, session\)/);
  const handBack = fs.readFileSync(path.join(ROOT, 'scripts', 'hand-back.mjs'), 'utf8');
  assert.match(handBack, /startBuild\(id, argv,/);
  assert.doesNotMatch(handBack, /\bspawn(Sync)?\(/);
});

test('0245 AC2: a build whose command starts any other program gets no such variable', () => {
  for (const argv of [['node', 'build.js'], ['/usr/bin/claudex'], ['/opt/claude/run'], ['my-claude'], ['claude.sh'], []]) {
    const e = buildEnv(argv, 's1', { PATH: '/bin' });
    assert.equal(Object.hasOwn(e, VAR), false, JSON.stringify(argv));
    assert.equal(e.SPECK_BUILD_SESSION, 's1');
  }
});

test('0245 AC2: when the variable is already set in speck run\'s environment, the build keeps that value', async () => {
  for (const value of ['0', '', 'true']) {
    assert.equal(buildEnv(['claude', '-p', 'x'], 's1', { [VAR]: value })[VAR], value, JSON.stringify(value));
    assert.equal(buildEnv(['node'], 's1', { [VAR]: value })[VAR], value, JSON.stringify(value));
  }
  const call = await launched({ value: '0' });
  assert.equal(call.value, '0');
});

test('0245 AC3: the brief says speck run\'s Claude Code builds can\'t run commands in the background, and why', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck run` |'));
  assert.ok(row);
  assert.match(row, new RegExp(VAR));
  assert.match(row, /can't run commands in the background/);
  assert.match(row, /ends? the build/);
});
