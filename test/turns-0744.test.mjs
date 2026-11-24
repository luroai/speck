// 0744: a `speck test` run that has waited too long for a turn gives up its place in the queue, before a builder's shell
// limit stops it, and says to run the same command again. SPECK_TURN_WAIT_MS stands in for the 8 minutes.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { shipRepo, CLI, env as baseEnv } from './support/ship.mjs';
import { BUSY_MS } from './support/run.mjs';
import { GAVE_UP_EXIT, turnWaitMs } from '../scripts/turns.mjs';

const WAITING = /^Waiting for a turn to run the tests/m;
const GAVE_UP = /Gave up this run's place in the queue after waiting .* for a turn to run the tests/;
const delay = ms => new Promise(r => setTimeout(r, ms));
async function until(cond, what) {
  for (const end = Date.now() + BUSY_MS; !cond();) {
    if (Date.now() > end) throw new Error(`gave up waiting until ${what}`);
    await delay(20);
  }
}
const envWith = ms => ({ ...baseEnv, SPECK_TURN_WAIT_MS: String(ms) });
const speck = (cwd, ms, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env: envWith(ms) });
function speckAsync(cwd, ms, ...a) {
  const child = spawn(process.execPath, [CLI, ...a], { cwd, env: envWith(ms) });
  const out = { stdout: '', stderr: '' };
  child.stdout.on('data', d => { out.stdout += d; });
  child.stderr.on('data', d => { out.stderr += d; });
  return { out, done: new Promise(r => child.on('close', status => r({ status, ...out }))) };
}

// A committed repo with speck set up, whose test commands log to ran.log in the repo, and a test file to name.
function testRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-turns-0744-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env: baseEnv });
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, 1000, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 1000, 'config', 'set', 'commands.test', 'echo full >> ran.log').status, 0);
  assert.equal(speck(dir, 1000, 'config', 'set', 'commands.test_files', 'echo {files} >> ran.log').status, 0);
  fs.writeFileSync(path.join(dir, 'a.test.mjs'), '');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'ran.log\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  return dir;
}
const queue = dir => path.join(dir, 'speck', '.cache', 'tests');
// Holds turn 0 (max_parallel_tests is 1) for the given pid.
function holdTurn(dir, pid) {
  fs.mkdirSync(queue(dir), { recursive: true });
  fs.writeFileSync(path.join(queue(dir), 'slot-0.g0.lock'), JSON.stringify({ pid, cwd: '/somewhere/else' }));
}
const sleeper = () => spawn('sleep', ['60'], { stdio: 'ignore' });
const ranLog = dir => { try { return fs.readFileSync(path.join(dir, 'ran.log'), 'utf8').trim().split('\n'); } catch { return []; } };

test('0744 AC1: the wait defaults to 8 minutes and the exit code is one no other command uses', () => {
  const saved = process.env.SPECK_TURN_WAIT_MS;
  delete process.env.SPECK_TURN_WAIT_MS;
  try { assert.equal(turnWaitMs(), 8 * 60 * 1000); } finally { if (saved !== undefined) process.env.SPECK_TURN_WAIT_MS = saved; }
  assert.equal(GAVE_UP_EXIT, 19);
  const scripts = path.join(path.dirname(CLI));
  for (const f of fs.readdirSync(scripts).filter(f => f.endsWith('.mjs') && f !== 'turns.mjs'))
    assert.doesNotMatch(fs.readFileSync(path.join(scripts, f), 'utf8'), /SpeckError\([^;]*,\s*19\)|exit\(19\)/, `${f} uses exit 19`);
});

for (const args of [['test', '--files', 'a.test.mjs'], ['test']]) {
  test(`0744 AC1: \`speck ${args.join(' ')}\` that waits too long gives up its place, runs nothing and says to run it again`, () => {
    const dir = testRepo();
    const holder = sleeper();
    try {
      holdTurn(dir, holder.pid);
      const res = speck(dir, 300, ...args);
      assert.equal(res.status, GAVE_UP_EXIT, res.stdout + res.stderr);
      assert.match(res.stdout, WAITING);
      assert.match(res.stderr, GAVE_UP);
      assert.match(res.stderr, /No tests were run\. Run the same command again/);
      assert.ok(res.stderr.includes(`\`speck ${args.join(' ')}\``), res.stderr);
      assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
      assert.deepEqual(ranLog(dir), []);
      // It left nothing behind in the queue: only the held turn.
      assert.deepEqual(fs.readdirSync(queue(dir)).filter(f => !f.startsWith('.')), ['slot-0.g0.lock']);
    } finally { holder.kill(); }
  });
}

test('0744 AC2: run again with the same arguments once a turn is free, it runs the tests', async () => {
  const dir = testRepo();
  const holder = sleeper();
  const ended = new Promise(r => holder.once('exit', r));
  try {
    holdTurn(dir, holder.pid);
    assert.equal(speck(dir, 300, 'test', '--files', 'a.test.mjs').status, GAVE_UP_EXIT);
  } finally { holder.kill(); }
  await ended; // reaped, so its turn is free
  const res = speck(dir, 300, 'test', '--files', 'a.test.mjs');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.deepEqual(ranLog(dir), ['a.test.mjs']);
});

test('0744 AC2: a run that gets a turn before the limit runs as today', async () => {
  const dir = testRepo();
  // A turn that's free straight away is taken, however short the limit.
  const now = speck(dir, 1, 'test', '--files', 'a.test.mjs');
  assert.equal(now.status, 0, now.stdout + now.stderr);
  assert.doesNotMatch(now.stdout + now.stderr, GAVE_UP);
  // One that waits less than the limit starts as soon as the turn is free.
  const holder = sleeper();
  try {
    holdTurn(dir, holder.pid);
    const run = speckAsync(dir, BUSY_MS * 2, 'test', '--fresh', '--files', 'a.test.mjs');
    await until(() => WAITING.test(run.out.stdout), 'the run said it was waiting');
    holder.kill();
    const res = await run.done;
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.doesNotMatch(res.stdout + res.stderr, GAVE_UP);
    assert.deepEqual(ranLog(dir), ['a.test.mjs', 'a.test.mjs']);
  } finally { holder.kill(); }
});

test('0744 AC2: speck ship keeps waiting for its turn past the limit', async () => {
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ship-0744-'))), 'ship.log');
  const r = shipRepo({ test: `echo ran >> ${log}` });
  const holder = sleeper();
  try {
    holdTurn(r.dir, holder.pid);
    const ship = speckAsync(r.dir, 100, 'ship', '1');
    await until(() => WAITING.test(ship.out.stdout), 'ship said it was waiting');
    await delay(400);
    holder.kill();
    const res = await ship.done;
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.doesNotMatch(res.stdout + res.stderr, GAVE_UP);
    assert.equal(fs.readFileSync(log, 'utf8').trim(), 'ran');
  } finally { holder.kill(); }
});
