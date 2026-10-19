import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { runRepo, until, alive, killAll, env } from './support/run.mjs';
import { cliCopy } from './support/panel.mjs';
import { startRun, stop, lockPid, childrenOf, count, edit, SWITCHED, mark, watching } from './support/run-switch.mjs';
import { panelRunOn, panelRunOff, panelRunState } from '../scripts/panel-run.mjs';
import { lockLost, recordedRun, keepsLock, isSpeckRun, processCwd } from '../scripts/run-lock.mjs';

// ---------- 0321: never run two speck runs for one repo ----------

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const lockFile = dir => path.join(runs(dir), 'run.lock');
const foremanFile = dir => path.join(runs(dir), 'run.foreman.json');
const again = (dir, cli) => spawnSync(process.execPath, [cli, 'run'], { cwd: dir, encoding: 'utf8', env, timeout: 10000 });
const refusal = pid => `speck run is already running in this repo (process ${pid}).`;
// A live process that isn't speck run, to stand for another one in the lock.
const other = () => { const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' }); p.unref(); return p.pid; };
const LOST = 'no longer holds this repo\'s lock';

test('0321 AC1: starting another speck run, before or after a switch to new code, is refused naming the one running, and starts nothing', async () => {
  const r = runRepo({ tickets: [['0001', {}]], max: 1 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '20000' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    const before = again(r.dir, cli);
    assert.notEqual(before.status, 0, before.stdout);
    assert.ok(before.stderr.includes(refusal(run.child.pid)), before.stderr);
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    const after = again(r.dir, cli);
    assert.notEqual(after.status, 0, after.stdout);
    assert.ok(after.stderr.includes(refusal(run.child.pid)), after.stderr);
    // From the Settings view's switch too.
    const res = await panelRunOn(r.dir);
    assert.equal(res.status, 409, JSON.stringify(res.body));
    assert.ok(res.body.error.includes(refusal(run.child.pid)), res.body.error);
    assert.equal(r.calls().length, 1, run.out());
    assert.equal(lockPid(r.dir), run.child.pid);
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});

test('0321 AC1: a speck run still working though its lock is gone is named and counted, so a second one is refused', async () => {
  const r = runRepo({ tickets: [] });
  // Its next check is a minute away, so it's still working when the second one starts.
  const run = startRun(r.dir, cliCopy().cli, { SPECK_RUN_POLL_MS: '60000' });
  try {
    assert.ok(await watching(run), run.out());
    assert.ok(await until(() => fs.existsSync(foremanFile(r.dir))), run.out());
    fs.rmSync(lockFile(r.dir));
    const second = again(r.dir, cliCopy().cli);
    assert.notEqual(second.status, 0, second.stdout);
    assert.ok(second.stderr.includes(refusal(run.child.pid)), second.stderr);
    assert.equal(fs.existsSync(lockFile(r.dir)), false, 'the refused one took no lock');
  } finally { await stop(run); }
});

test('0321 AC1: the Foreman\'s record counts only while it names a live speck run in this repo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0321-'));
  const write = lock => fs.writeFileSync(path.join(dir, 'run.foreman.json'), JSON.stringify({ lock }));
  assert.equal(recordedRun(dir, dir), null, 'no record');
  write(process.pid); // this test, alive, isn't speck run
  assert.equal(recordedRun(dir, dir), null);
  const p = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
  write(p.pid);
  assert.equal(recordedRun(dir, dir), null, 'a process that is gone, or not speck run');
  for (const odd of ['__proto__', '12', -1, 0, null]) { write(odd); assert.equal(recordedRun(dir, dir), null, String(odd)); }
  fs.writeFileSync(path.join(dir, 'run.foreman.json'), 'not json');
  assert.equal(recordedRun(dir, dir), null);
});

test('0321 AC1: a speck run working in another repo is never counted as this repo\'s', async () => {
  const r = runRepo({ tickets: [] }), elsewhere = runRepo({ tickets: [] });
  const run = startRun(elsewhere.dir, cliCopy().cli, { SPECK_RUN_POLL_MS: '60000' });
  try {
    assert.ok(await watching(run), run.out());
    assert.equal(isSpeckRun(run.child.pid), true);
    assert.equal(isSpeckRun(run.child.pid, elsewhere.dir), true);
    assert.equal(isSpeckRun(run.child.pid, r.dir), false);
    // This repo's record names it, as a pid reused by it would.
    fs.mkdirSync(runs(r.dir), { recursive: true });
    fs.writeFileSync(foremanFile(r.dir), JSON.stringify({ lock: run.child.pid }));
    assert.equal(recordedRun(r.dir, runs(r.dir)), null);
  } finally { await stop(run); }
});

test('0321 AC2: turning it off from the Settings view stops the whole speck run, worker included, and shows it off only once all of it has stopped', async () => {
  const r = runRepo({ tickets: [] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    const workers = childrenOf(run.child.pid);
    assert.equal(workers.length, 1, `${workers}`);
    const res = await panelRunOff(r.dir);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    // Looked at once: the switch has already waited for it, and says off only once it has gone.
    assert.deepEqual(workers.filter(alive), [], 'the worker has stopped');
    await run.exited;
  } finally { await stop(run); }
});

// A stand-in speck run: `speck.mjs run`, which starts a worker in its own process group and exits at once on Ctrl+C,
// leaving the worker running. The worker writes its pid to WORKER_FILE.
const STANDIN = `
import { spawn } from 'node:child_process';
spawn(process.execPath, ['-e', "require('fs').writeFileSync(process.argv[1], String(process.pid)); setTimeout(() => {}, 60000)", process.env.WORKER_FILE], { stdio: 'ignore' }).unref();
process.on('SIGINT', () => process.exit(0));
setInterval(() => {}, 1000);
`;

test('0321 AC2: the switch shows it off only once its worker has stopped, even when the process you started stops first', async () => {
  const r = runRepo({ tickets: [] });
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0321-'));
  fs.writeFileSync(path.join(bin, 'speck.mjs'), STANDIN);
  const workerFile = path.join(bin, 'worker');
  const host = spawn(process.execPath, [path.join(bin, 'speck.mjs'), 'run'], { cwd: r.dir, detached: true, stdio: 'ignore', env: { ...env, WORKER_FILE: workerFile } });
  let worker = null;
  try {
    assert.ok(await until(() => fs.existsSync(workerFile) && fs.readFileSync(workerFile, 'utf8')), 'the worker started');
    worker = Number(fs.readFileSync(workerFile, 'utf8'));
    fs.mkdirSync(runs(r.dir), { recursive: true });
    fs.writeFileSync(lockFile(r.dir), String(host.pid));
    // The worker stops half a second after the process you started has.
    host.on('exit', () => setTimeout(() => killAll([worker]), 500));
    const t = Date.now();
    const res = await panelRunOff(r.dir);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    // Looked at once: the switch has already waited for it, and says off only once it has gone.
    assert.deepEqual([worker].filter(alive), [], 'shown off only once the worker has gone');
    assert.ok(Date.now() - t >= 400, `it waited for the worker (${Date.now() - t} ms)`);
  } finally { killAll([host.pid, worker].filter(Boolean)); }
});

test('0321 AC3, AC5: a speck run whose lock names another live speck run stops launching, says so once and exits, leaving its build running for the one that remains', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'draft' }]], max: 2 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '20000' });
  const thief = other();
  let next = null;
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    const build = r.calls()[0].pid;
    fs.writeFileSync(lockFile(r.dir), String(thief));
    // A ticket set ready now is never launched by the one that no longer holds the lock.
    const t = path.join(r.dir, 'speck', 'tickets', '0002-t.md');
    fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: draft', 'status: ready'));
    r.g('commit', '-qam', 'ready 0002');
    assert.equal(await Promise.race([run.exited, new Promise(res => setTimeout(() => res('still running'), 8000))]), 0, run.out());
    assert.equal(count(run.out(), LOST), 1, run.out());
    assert.ok(run.out().includes(`its lock names another speck run, process ${thief}`), run.out());
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001'], run.out());
    assert.ok(alive(build), 'its build carries on');
    assert.equal(lockPid(r.dir), thief, 'it left the other one\'s lock alone');
    // AC5: once the other one has gone, the speck run that remains picks the build up rather than launching it again.
    killAll([thief]);
    next = startRun(r.dir, cli, { FAKE_MS: '200' });
    assert.ok(await until(() => next.out().includes('0001 is already being built')), next.out());
    assert.ok(await until(() => r.calls().some(c => c.args[0] === '0002')), next.out());
    assert.equal(r.calls().filter(c => c.args[0] === '0001').length, 1, next.out());
  } finally { killAll([thief]); if (next) await stop(next); await stop(run); killAll(r.calls().map(c => c.pid)); }
});

test('0321 AC3: on new code, a speck run whose lock file is gone stops, worker and the process you started both', async () => {
  const r = runRepo({ tickets: [] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    const workers = childrenOf(run.child.pid);
    fs.rmSync(lockFile(r.dir));
    assert.equal(await Promise.race([run.exited, new Promise(res => setTimeout(() => res('still running'), 8000))]), 0, run.out());
    assert.equal(count(run.out(), LOST), 1, run.out());
    assert.ok(run.out().includes('its lock file is gone'), run.out());
    assert.ok(await until(() => workers.every(p => !alive(p))), `${workers}`);
  } finally { await stop(run); }
});

test('0321 AC3: lockLost says why for a lock that is gone, names another live process, or a process that has gone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0321-'));
  assert.equal(lockLost(dir, 123), 'its lock file is gone');
  fs.writeFileSync(path.join(dir, 'run.lock'), '123\n');
  assert.equal(lockLost(dir, 123), null);
  fs.writeFileSync(path.join(dir, 'run.lock'), String(process.pid));
  assert.equal(lockLost(dir, 123), `its lock names another speck run, process ${process.pid}`);
  for (const odd of ['', '__proto__', '-5', '99999999']) {
    fs.writeFileSync(path.join(dir, 'run.lock'), odd);
    assert.match(lockLost(dir, 123), /^its lock names process .+, not 123$/, odd);
  }
  // keepsLock: true while held; once not, says so once and stops.
  const said = [], was = console.log;
  let stops = 0;
  console.log = line => said.push(line);
  try {
    fs.writeFileSync(path.join(dir, 'run.lock'), '123');
    const holding = keepsLock(() => dir, 123, () => { stops++; });
    assert.equal(holding(), true);
    fs.rmSync(path.join(dir, 'run.lock'));
    assert.equal(holding(), false);
  } finally { console.log = was; }
  assert.equal(stops, 1);
  assert.equal(said.length, 1);
  assert.match(said[0], /no longer holds this repo's lock: its lock file is gone\. It launches no more builds or ships, and is stopping\./);
});

test('0321 AC4: only the speck run holding the lock writes the Foreman\'s status', async () => {
  const r = runRepo({ tickets: [] });
  const run = startRun(r.dir, cliCopy().cli);
  const thief = other();
  try {
    assert.ok(await watching(run), run.out());
    assert.ok(await until(() => fs.existsSync(foremanFile(r.dir))), 'the holder writes it');
    fs.writeFileSync(lockFile(r.dir), String(thief));
    fs.rmSync(foremanFile(r.dir));
    assert.equal(await Promise.race([run.exited, new Promise(res => setTimeout(() => res('still running'), 8000))]), 0, run.out());
    assert.equal(fs.existsSync(foremanFile(r.dir)), false, 'it wrote no status once it no longer held the lock');
  } finally { killAll([thief]); await stop(run); }
});

test('0321 AC1: a speck run\'s folder is read on macOS as well as Linux, so either can tell which repo it works in', { skip: spawnSync('lsof', ['-v']).error ? 'no lsof here' : false }, async () => {
  const r = runRepo({ tickets: [] });
  const run = startRun(r.dir, cliCopy().cli, { SPECK_RUN_POLL_MS: '60000' });
  try {
    assert.ok(await watching(run), run.out());
    const real = fs.realpathSync(r.dir);
    if (process.platform === 'linux') assert.equal(processCwd(run.child.pid, 'linux'), real); // /proc is Linux's only
    assert.equal(processCwd(run.child.pid, 'darwin'), real, 'with lsof, as on macOS');
    assert.equal(processCwd(99999999, 'darwin'), null);
  } finally { await stop(run); }
});

// Starts the stand-in speck run in `r` holding its lock, and gives it with its worker's pid.
async function standIn(r) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0321-'));
  fs.writeFileSync(path.join(bin, 'speck.mjs'), STANDIN);
  const workerFile = path.join(bin, 'worker');
  const host = spawn(process.execPath, [path.join(bin, 'speck.mjs'), 'run'], { cwd: r.dir, detached: true, stdio: 'ignore', env: { ...env, WORKER_FILE: workerFile } });
  assert.ok(await until(() => fs.existsSync(workerFile) && fs.readFileSync(workerFile, 'utf8')), 'the worker started');
  fs.mkdirSync(runs(r.dir), { recursive: true });
  fs.writeFileSync(lockFile(r.dir), String(host.pid));
  const exited = new Promise(res => host.on('exit', res));
  return { host, worker: Number(fs.readFileSync(workerFile, 'utf8')), exited };
}

test('0321 AC2: every page shows speck run on while its worker is still stopping, after the process you started has gone, and Turn on is refused meanwhile', async () => {
  const r = runRepo({ tickets: [] });
  const { host, worker, exited } = await standIn(r);
  try {
    const off = panelRunOff(r.dir);
    await exited;
    // Its lock is gone with it (the stand-in leaves it, so remove it as speck run does), but the worker is still running.
    fs.rmSync(lockFile(r.dir), { force: true });
    assert.deepEqual(panelRunState(r.dir), { on: true, pid: worker });
    const on = await panelRunOn(r.dir);
    assert.equal(on.status, 409, JSON.stringify(on.body));
    assert.match(on.body.error, new RegExp(`speck run \\(process ${worker}\\) is still stopping`));
    killAll([worker]);
    assert.equal((await off).status, 200);
    assert.deepEqual(panelRunState(r.dir), { on: false, pid: null });
  } finally { killAll([host.pid, worker]); }
});

test('0321 AC2: once the wait for it has run out, it still shows on until all of it has stopped, and turning it off again asks what is left to stop', async () => {
  const r = runRepo({ tickets: [] });
  const { host, worker, exited } = await standIn(r);
  try {
    const res = await panelRunOff(r.dir, { ms: 300 });
    assert.equal(res.status, 500, JSON.stringify(res.body));
    assert.match(res.body.error, new RegExp(`process ${worker}\\) is still stopping`));
    await exited;
    fs.rmSync(lockFile(r.dir), { force: true });
    assert.equal(panelRunState(r.dir).on, true);
    // The worker stops on Ctrl+C now, so turning it off again ends it.
    const again2 = await panelRunOff(r.dir);
    assert.equal(again2.status, 200, JSON.stringify(again2.body));
    assert.deepEqual(panelRunState(r.dir), { on: false, pid: null });
  } finally { killAll([host.pid, worker]); }
});
