// 0202: a stalled test run is ended with every process it started, found the way the reviewer time limit finds them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hasStopped } from './support/stopped.mjs';
import { markRun, marked, runProcesses } from '../scripts/procs.mjs';

const SCRIPTS = fileURLToPath(new URL('../scripts/', import.meta.url));
const STALL = path.join(SCRIPTS, 'stall.mjs');
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const sleeps = [];
const stopAll = () => { for (const p of sleeps) { try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } } };

// A folder with spawn.mjs: `node spawn.mjs orphan <file>` starts `sleep 300` in a process group of its own, writes its
// pid to <file> and exits, leaving it without its parent. `kept` does the same but stays running, so the sleep is still
// descended from the run.
function folder() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0202-')));
  fs.writeFileSync(path.join(dir, 'spawn.mjs'), `
    import fs from 'node:fs';
    import { spawn } from 'node:child_process';
    const c = spawn('sleep', ['300'], { detached: true, stdio: 'ignore' });
    fs.writeFileSync(process.argv[3] + '.tmp', String(c.pid)); fs.renameSync(process.argv[3] + '.tmp', process.argv[3]);
    if (process.argv[2] === 'kept') setInterval(() => {}, 1e6); else { c.unref(); process.exit(0); }
  `);
  return dir;
}

const pidIn = async file => {
  assert.ok(await hasStopped(() => fs.existsSync(file)), `${file} was written`);
  const pid = Number(fs.readFileSync(file, 'utf8'));
  sleeps.push(pid);
  return pid;
};

// stall.mjs run directly on `cmd` with a stall time of `ms`: the process, and a promise of its exit code.
function stallRun(dir, cmd, ms) {
  const ended = path.join(dir, `ended-${Math.random()}`);
  const p = spawn(process.execPath, [STALL, cmd, String(ms), ended], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', d => { out += d; });
  const exit = new Promise(r => p.on('exit', code => r(code)));
  return { p, exit, ended: () => fs.readFileSync(ended, 'utf8'), out: () => out };
}

test('0202 AC1, AC2: a stalled run ends every process it started, in a group of its own or orphaned, and nothing else', async () => {
  const dir = folder();
  try {
    const other = spawn('sleep', ['300'], { detached: true, stdio: 'ignore' });
    other.unref();
    sleeps.push(other.pid);
    // Another run going at the same time, with an orphan of its own, that keeps writing so doesn't stall.
    const second = stallRun(dir, 'node spawn.mjs orphan c; while true; do echo tick; sleep 0.2; done', 60000);
    const orphanC = await pidIn(path.join(dir, 'c'));
    const first = stallRun(dir, 'node spawn.mjs orphan a; node spawn.mjs kept b & echo started; sleep 300', 1000);
    const orphanA = await pidIn(path.join(dir, 'a'));
    const keptB = await pidIn(path.join(dir, 'b'));

    assert.equal(await first.exit, 1);
    assert.match(first.ended(), /^stalled\n/);
    assert.match(first.out(), /The tests stalled/);
    assert.ok(await hasStopped(() => !alive(orphanA) && !alive(keptB), 10000),
      `every process the stalled run started has ended (orphaned: ${alive(orphanA)}, own group: ${alive(keptB)})`);

    assert.ok(alive(other.pid), 'a process the run did not start is left running');
    assert.ok(alive(orphanC), 'the other run\'s process is left running');
    assert.ok(alive(second.p.pid), 'the other run is still going');

    // AC1: the other run, ended by a signal, ends its orphan too.
    second.p.kill('SIGTERM');
    assert.equal(await second.exit, 1);
    assert.ok(await hasStopped(() => !alive(orphanC), 10000), 'the other run\'s orphan ended with it');
  } finally { stopAll(); }
});

test('0202 AC3: a run that does not stall ends as before, with its own exit code', async () => {
  const dir = folder();
  const r = stallRun(dir, 'for i in 1 2 3 4 5 6; do echo tick $i; sleep 0.2; done; exit 3', 600);
  assert.equal(await r.exit, 3);
  assert.equal(r.ended(), '3');
  assert.doesNotMatch(r.out(), /stalled/);
  assert.match(r.out(), /tick 6/);
});

test('0202 AC4: runProcesses finds a marked process whose parent has gone, and not an unmarked one', async () => {
  const dir = folder();
  try {
    const { run, env } = markRun('SPECK_0202_TEST');
    const holder = spawn('sleep', ['300'], { detached: true, stdio: 'ignore', env });
    holder.unref();
    sleeps.push(holder.pid);
    const orphan = spawn(process.execPath, ['spawn.mjs', 'orphan', 'm'], { cwd: dir, env, stdio: 'ignore' });
    await new Promise(r => orphan.on('exit', r));
    const m = await pidIn(path.join(dir, 'm'));
    const plain = spawn(process.execPath, ['spawn.mjs', 'orphan', 'u'], { cwd: dir, stdio: 'ignore' });
    await new Promise(r => plain.on('exit', r));
    const u = await pidIn(path.join(dir, 'u'));

    const found = runProcesses(orphan.pid, 'SPECK_0202_TEST', run);
    assert.ok(found.includes(m), 'the orphaned marked process is found');
    assert.ok(found.includes(holder.pid), 'another marked process is found');
    assert.ok(!found.includes(u), 'an unmarked process is not');
    assert.ok(!found.includes(process.pid), 'this process is not');

    // A run inside it keeps the outer mark, so the outer run still finds its processes.
    const inner = markRun('SPECK_0202_TEST', env);
    const nested = spawn('sleep', ['300'], { detached: true, stdio: 'ignore', env: inner.env });
    nested.unref();
    sleeps.push(nested.pid);
    assert.ok(marked('SPECK_0202_TEST', run).includes(nested.pid), 'the outer run finds the inner run\'s process');
    assert.ok(marked('SPECK_0202_TEST', inner.run).includes(nested.pid), 'the inner run finds it too');
    assert.ok(!marked('SPECK_0202_TEST', inner.run).includes(holder.pid), 'the inner run does not find the outer one\'s');
  } finally { stopAll(); }
});

test('0202 AC4: a mark is added to an outer run\'s, and replaces a value that is not a list of marks', () => {
  const outer = markRun('SPECK_0202_TEST', {});
  assert.equal(outer.env.SPECK_0202_TEST, outer.run);
  const inner = markRun('SPECK_0202_TEST', outer.env);
  assert.equal(inner.env.SPECK_0202_TEST, `${outer.run}:${inner.run}`);
  for (const odd of ['', 'two words', 'x=y', '\n']) assert.equal(markRun('SPECK_0202_TEST', { SPECK_0202_TEST: odd }).env.SPECK_0202_TEST.includes(':'), false, JSON.stringify(odd));
});

test('0202 AC4: the reviewer limit and the stall handling find a run\'s processes the same way', () => {
  for (const file of ['limit.mjs', 'stall.mjs']) {
    const src = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
    assert.match(src, /from '\.\/procs\.mjs'/, `${file} uses procs.mjs`);
    assert.match(src, /runProcesses\(/, `${file} finds a run's processes with runProcesses`);
    assert.doesNotMatch(src, /spawnSync\('ps'/, `${file} has no copy of its own`);
  }
});
