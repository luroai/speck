import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0043: build ready tickets automatically with speck run ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
// SPECK_RUN_POLL_MS shortens the 5-second wait between checks, so the tests run quickly.
const env = { ...process.env, ...gitEnv, SPECK_RUN_POLL_MS: '100' };
const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'ready', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// A fake builder: records its arguments, folder and pid in <out>/<id>.<n>.json, prints a line to stdout and one to
// stderr, then stays alive for FAKE_MS (default 0) and exits with FAKE_EXIT (default 0).
const FAKE = `
const fs = require('fs'), path = require('path');
const [out, ...args] = process.argv.slice(2);
const id = args[0];
let n = 0; while (fs.existsSync(path.join(out, id + '.' + n + '.json'))) n++;
fs.writeFileSync(path.join(out, id + '.' + n + '.json'), JSON.stringify({ at: Date.now(), args, cwd: process.cwd(), pid: process.pid, stdin: (() => { try { return fs.readFileSync(0, 'utf8'); } catch (e) { return 'ERR ' + e.code; } })() }));
console.log('building ' + id);
for (let i = 1; i <= 7; i++) console.error('stderr line ' + i);
// FAKE_BLOCK: start the ticket in its own worktree with speck, as /speck-build does, and block it there.
if (process.env.FAKE_BLOCK) {
  const { spawnSync } = require('child_process');
  const started = spawnSync(process.execPath, [process.env.FAKE_BLOCK, 'start', id], { encoding: 'utf8' });
  const wt = started.stdout.trim().split('\\n').pop();
  spawnSync(process.execPath, [process.env.FAKE_BLOCK, 'set', id, 'status', 'blocked'], { cwd: wt, encoding: 'utf8' });
  spawnSync('git', ['commit', '-qam', 'blocked'], { cwd: wt });
}
setTimeout(() => process.exit(+(process.env.FAKE_EXIT || 0)), +(process.env.FAKE_MS || 0));
`;

// A repo with speck installed, the given tickets committed and build_command pointing at the fake builder.
function runRepo({ tickets = [['0001', {}]], max, command, worktrees = 'false' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-out-'));
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, FAKE);
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8', env }).status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let cfg = fs.readFileSync(cfgFile, 'utf8').replace(/^worktrees:.*$/m, `worktrees: ${worktrees}`);
  const cmd = command !== undefined ? command : `"${process.execPath}" "${fake}" "${out}" {id} {session}`;
  cfg = cfg.replace(/^build_command:.*$/m, '');
  if (cmd !== null) cfg += `\nbuild_command: ${JSON.stringify(cmd)}\n`;
  cfg = cfg.replace(/^max_parallel_builds:.*$/m, '');
  if (max !== undefined) cfg += `max_parallel_builds: ${max}\n`;
  fs.writeFileSync(cfgFile, cfg);
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  for (const [id, o] of tickets) fs.writeFileSync(path.join(dir, 'speck', 'tickets', `${id}-t.md`), `---\n${fm({ id: `"${id}"`, ...o })}\n---\n${good}`);
  g('add', '-A'); g('commit', '-qm', 'base');
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')) })).sort((a, b) => a.at - b.at || (a.file < b.file ? -1 : 1)); // in launch order (builds launched together, by id)
  return { dir, out, g, calls, cfgFile };
}

// Starts `speck run` in the background, collecting its output.
function startRun(dir, extraEnv = {}) {
  const child = spawn(process.execPath, [CLI, 'run'], { cwd: dir, env: { ...env, ...extraEnv } });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', code => res(code)));
  return { child, out: () => out, exited };
}
const until = async (cond, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await cond()) return true; await new Promise(r => setTimeout(r, 50)); }
  return false;
};
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const killAll = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch {} };
const stopRun = async r => { if (r.child.exitCode === null) { r.child.kill('SIGINT'); await r.exited; } };
const record = (dir, id) => JSON.parse(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', `${id}.json`), 'utf8'));
const runOnce = (dir, extraEnv = {}) => spawnSync(process.execPath, [CLI, 'run'], { cwd: dir, encoding: 'utf8', env: { ...env, ...extraEnv }, timeout: 10000 });

test('0043 AC1: launches ready tickets with nothing to wait on, in status order, one at a time by default', async () => {
  const r = runRepo({ tickets: [
    ['0001', { priority: 3 }], ['0002', { priority: 1 }], ['0003', { status: 'draft' }],
    ['0004', { after: '["0003"]' }], ['0005', { status: 'building' }],
  ] });
  const run = startRun(r.dir, { FAKE_MS: '600' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    await new Promise(res => setTimeout(res, 300));
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002'], 'priority 1 first, and only one at a time');
    assert.ok(await until(() => r.calls().length >= 2), run.out());
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002', '0001'], 'the next once the first exits');
    assert.ok(await until(() => /0001[^\n]*exit[^\n]*\b0\b/i.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 400));
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002', '0001'], 'never a draft, a waiting ticket or one in flight');
    const out = run.out();
    for (const id of ['0002', '0001']) {
      assert.match(out, new RegExp(`launch[^\\n]*${id}|${id}[^\\n]*launch`, 'i'), `a line for launching ${id}`);
      assert.match(out, new RegExp(`${id}[^\\n]*exit[^\\n]*code 0`, 'i'), `a line for ${id} exiting, with the code`);
    }
    assert.equal(run.child.exitCode, null, 'runs until stopped');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC1: max_parallel_builds lets builds run side by side, up to the limit', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}]], max: 2 });
  const run = startRun(r.dir, { FAKE_MS: '1500' });
  try {
    assert.ok(await until(() => r.calls().length >= 2), run.out());
    await new Promise(res => setTimeout(res, 300));
    assert.deepEqual(r.calls().map(c => c.args[0]).sort(), ['0001', '0002']);
    assert.ok(r.calls().every(c => alive(c.pid)), 'both running at once');
    assert.ok(await until(() => r.calls().length >= 3), run.out());
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC1: a max_parallel_builds that is not a whole number of at least 1 is refused', () => {
  for (const bad of ['0', '-1', 'abc', '1.5']) {
    const r = runRepo({ max: bad });
    const res = runOnce(r.dir);
    assert.notEqual(res.status, 0, bad);
    assert.match(res.stderr, /max_parallel_builds/, bad);
    assert.doesNotMatch(res.stderr, /at .*\.mjs:\d+/, 'no stack trace');
    assert.deepEqual(r.calls(), [], 'nothing launched');
  }
});

test('0043 AC1: stopping speck run launches nothing more and leaves running builds running', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]] });
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    const [first] = r.calls();
    run.child.kill('SIGINT');
    await run.exited;
    assert.ok(alive(first.pid), 'the build is still running');
    await until(() => !alive(first.pid), 5000);
    await new Promise(res => setTimeout(res, 300));
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001'], 'nothing more launched');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC2: runs build_command from the repo root, without a shell, with {id} and a fresh UUID for {session}', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 2 });
  // Shell syntax in the command must reach the builder as plain words.
  const cfg = fs.readFileSync(r.cfgFile, 'utf8').replace(/\{id\} \{session\}/, '{id} {session} $HOME ; x-{id}');
  fs.writeFileSync(r.cfgFile, cfg); r.g('commit', '-qam', 'cfg');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => r.calls().length >= 2), run.out());
    const calls = r.calls();
    for (const c of calls) {
      assert.equal(fs.realpathSync(c.cwd), fs.realpathSync(r.dir), 'from the repo root');
      assert.match(c.args[1], UUID, 'a UUID');
      assert.deepEqual(c.args.slice(2), ['$HOME', ';', `x-${c.args[0]}`], 'no shell');
      assert.equal(c.stdin, '', 'stdin is empty, so claude -p doesn\'t wait for it');
    }
    assert.notEqual(calls[0].args[1], calls[1].args[1], 'a fresh session for each build');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC2: a blank or missing build_command stops speck run with a plain message', () => {
  for (const command of [null, '', '   ']) {
    const r = runRepo({ command });
    const res = runOnce(r.dir);
    assert.notEqual(res.status, 0, JSON.stringify(command));
    assert.match(res.stderr, /build_command/);
    assert.doesNotMatch(res.stderr, /at .*\.mjs:\d+/, 'no stack trace');
    assert.deepEqual(r.calls(), []);
  }
});

test('0043 AC2: the config template has the default build_command and max_parallel_builds', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(cfg, /^build_command: 'claude -p "\/speck-build \{id\}" --session-id \{session\} --dangerously-skip-permissions'/m);
  assert.match(cfg, /^max_parallel_builds: 1\b/m);
});

test('0043 AC3: each build has a run record and a log, and speck run changes nothing in speck/tickets/', async () => {
  const r = runRepo({ tickets: [['0001', {}]] });
  const before = fs.readFileSync(path.join(r.dir, 'speck', 'tickets', '0001-t.md'), 'utf8');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /exit/i.test(run.out())), run.out());
    const [call] = r.calls();
    const rec = record(r.dir, '0001');
    assert.equal(rec.session, call.args[1]);
    assert.equal(fs.realpathSync(rec.cwd), fs.realpathSync(r.dir));
    assert.equal(rec.pid, call.pid);
    assert.ok(!Number.isNaN(Date.parse(rec.started)) && /T.*Z$/.test(rec.started), 'an ISO start time');
    const log = fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.log'), 'utf8');
    assert.match(log, /building 0001/, 'stdout');
    assert.match(log, /stderr line 7/, 'stderr');
    assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'tickets', '0001-t.md'), 'utf8'), before);
    assert.equal(r.g('status', '--porcelain'), '', 'nothing for git to see');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC4: a build that exits leaving its ticket ready is reported with its last five log lines and not launched again', async () => {
  const r = runRepo({ tickets: [['0001', {}]] });
  const run = startRun(r.dir, { FAKE_EXIT: '3' });
  try {
    assert.ok(await until(() => /stderr line 7/.test(run.out())), run.out());
    const out = run.out();
    assert.match(out, /0001[^\n]*code 3/);
    assert.match(out, /0001[^\n]*still ready/i);
    for (let i = 3; i <= 7; i++) assert.match(out, new RegExp(`stderr line ${i}`), `line ${i}`);
    assert.doesNotMatch(out, /stderr line 2/, 'only the last five');
    await new Promise(res => setTimeout(res, 600));
    assert.equal(r.calls().length, 1, 'launched once');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0043 AC4: a build_command that cannot start is reported without a stack trace, and speck run keeps going', async () => {
  const r = runRepo({ tickets: [['0001', {}]], command: '/nonexistent/builder {id}' });
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /0001[^\n]*(couldn't start|ENOENT)/i.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 300));
    assert.equal(run.child.exitCode, null, 'still running');
    assert.doesNotMatch(run.out(), /at .*\.mjs:\d+/);
  } finally { await stopRun(run); }
});

test('0043 AC5: speck run refuses to start off the base branch, or while another speck run is running in this repo', async () => {
  const r = runRepo({ tickets: [['0001', {}]] });
  r.g('checkout', '-q', '-b', 'elsewhere');
  let res = runOnce(r.dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /main/);
  assert.doesNotMatch(res.stderr, /at .*\.mjs:\d+/);
  r.g('checkout', '-q', 'main');

  const first = startRun(r.dir, { FAKE_MS: '2000' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), first.out());
    res = runOnce(r.dir);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /already running/i);
    assert.equal(first.child.exitCode, null, 'the first keeps going');
  } finally { await stopRun(first); killAll(r.calls().map(c => c.pid)); }

  // A run that was killed outright leaves a stale lock, which doesn't stop the next one.
  const r2 = runRepo({ tickets: [] });
  const killed = startRun(r2.dir);
  await until(() => /watching|ready/i.test(killed.out()));
  killed.child.kill('SIGKILL'); await killed.exited;
  const next = startRun(r2.dir);
  try {
    await new Promise(res2 => setTimeout(res2, 400));
    assert.equal(next.child.exitCode, null, next.out());
  } finally { await stopRun(next); }
});

test('0043 AC2 (self-check): a build_command with an unclosed quote is refused, naming build_command', () => {
  const r = runRepo({ command: 'claude -p "/speck-build {id}' });
  const res = runOnce(r.dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /build_command/);
  assert.doesNotMatch(res.stderr, /reviewer/);
  assert.deepEqual(r.calls(), []);
});

test('0043 AC4 (self-check): a log file that cannot be opened is reported, and speck run keeps going', async () => {
  const r = runRepo({ tickets: [['0001', {}]] });
  fs.mkdirSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.log'), { recursive: true }); // a folder where the log should go
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /0001[^\n]*couldn't start/i.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 300));
    assert.equal(run.child.exitCode, null, 'still running');
    assert.deepEqual(r.calls(), []);
    assert.doesNotMatch(run.out(), /at .*\.mjs:\d+/);
  } finally { await stopRun(run); }
});

test('0043 AC4 (round 1 F1): a build that moved its ticket on in its own worktree is not reported as never started', async () => {
  const r = runRepo({ tickets: [['0001', {}]], worktrees: 'true' });
  const run = startRun(r.dir, { FAKE_BLOCK: CLI });
  try {
    assert.ok(await until(() => /0001[^\n]*exit/i.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 300));
    const state = JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env }).stdout);
    assert.equal(state.tickets.find(t => t.id === '0001').status, 'blocked', 'the build blocked it in its worktree');
    assert.doesNotMatch(run.out(), /still ready/i, run.out());
    assert.equal(r.calls().length, 1);
  } finally {
    await stopRun(run); killAll(r.calls().map(c => c.pid));
    // The ticket's worktree sits beside the repo: remove it with the repo.
    fs.rmSync(`${r.dir}.worktrees`, { recursive: true, force: true });
  }
});

// Starts several speck runs at the same moment and returns them once they've settled.
async function race(dir, n, extraEnv = {}) {
  const runs = Array.from({ length: n }, () => startRun(dir, { FAKE_MS: '4000', ...extraEnv }));
  await new Promise(res => setTimeout(res, 1500));
  return runs;
}

test('0043 AC5 (round 1 F2): of several speck runs started at once, exactly one keeps running and launches', async () => {
  for (let round = 0; round < 3; round++) {
    const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 5 });
    const runs = await race(r.dir, 6);
    try {
      const live = runs.filter(x => x.child.exitCode === null);
      assert.equal(live.length, 1, runs.map(x => x.out()).join('\n---\n'));
      assert.deepEqual(r.calls().map(c => c.args[0]).sort(), ['0001', '0002'], 'each ticket launched once, by the one runner');
      for (const x of runs.filter(y => y.child.exitCode !== null)) assert.notEqual(x.child.exitCode, 0);
    } finally { for (const x of runs) await stopRun(x); killAll(r.calls().map(c => c.pid)); }
  }
});

test('0043 AC5 (round 1 F2): several speck runs taking over the same stale lock at once leave exactly one running', async () => {
  for (let round = 0; round < 3; round++) {
    const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 5 });
    const dead = spawnSync(process.execPath, ['-e', 'console.log(process.pid)'], { encoding: 'utf8' }).stdout.trim();
    const runs = path.join(r.dir, 'speck', '.cache', 'runs');
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, 'run.lock'), dead);
    const racers = await race(r.dir, 6);
    try {
      const live = racers.filter(x => x.child.exitCode === null);
      assert.equal(live.length, 1, racers.map(x => x.out()).join('\n---\n'));
      assert.deepEqual(r.calls().map(c => c.args[0]).sort(), ['0001', '0002']);
      assert.ok(!fs.existsSync(path.join(runs, 'run.lock.recover')), 'the recovery lock is released');
    } finally { for (const x of racers) await stopRun(x); killAll(r.calls().map(c => c.pid)); }
  }
});

test('0043 AC3 (round 1 F3): a run record that cannot be written stops that build from starting, and speck run keeps going', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]] });
  fs.mkdirSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.json'), { recursive: true }); // a folder where the record should go
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => r.calls().some(c => c.args[0] === '0002')), run.out());
    assert.match(run.out(), /0001[^\n]*couldn't start/i);
    assert.ok(!r.calls().some(c => c.args[0] === '0001'), 'no build without a record');
    assert.equal(run.child.exitCode, null, 'still running');
    assert.doesNotMatch(run.out(), /at .*\.mjs:\d+/);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});
