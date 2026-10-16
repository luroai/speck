import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT, env, runRepo, until, alive, leftRunning } from './support/run.mjs';
import { shipRepo } from './support/ship.mjs';
import { cliCopy } from './support/panel.mjs';
import { waitingSays, failedSays } from '../scripts/run-switch.mjs';

// ---------- 0247: speck run switches to its new code once it's idle ----------

// speck run from a copy of the CLI, in a process group of its own, as a terminal starts it, so Ctrl+C can be sent to
// the whole group.
function startRun(dir, cli, extraEnv = {}) {
  const child = spawn(process.execPath, [cli, 'run'], { cwd: dir, detached: true, env: { ...env, ...extraEnv } });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', code => res(code)));
  return { child, out: () => out, exited };
}
const stop = async run => { if (run.child.exitCode === null) { try { process.kill(-run.child.pid, 'SIGINT'); } catch { /* gone */ } await run.exited; } };
const lockPid = dir => { try { return Number(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', 'run.lock'), 'utf8')); } catch { return null; } };
const childrenOf = pid => spawnSync('ps', ['-o', 'pid=', '--ppid', String(pid)], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).map(Number);
const count = (text, part) => text.split(part).length - 1;
// Changes a file of the copied CLI's code. Marked in run-switch.mjs, where the line is.
const edit = (cli, file, fn) => { const f = path.join(path.dirname(cli), file); fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8'))); };
// The line speck run on new code says as it takes over, marked so the test knows which code said it.
const SWITCHED = 'speck run switched to the new code.';
const mark = tag => src => src.replace(/'speck run switched to the new code\.[^']*'/, `'${SWITCHED} ${tag}'`);
const watching = run => until(() => run.out().includes('speck run: watching for ready tickets'));

test('0247 AC1, AC3: a change to the code\'s content switches it, the same content saved again doesn\'t, and the lock, output and Ctrl+C stay', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    const host = run.child.pid;
    assert.equal(lockPid(r.dir), host);
    // Saved again as it was: newer, but the same content.
    edit(cli, 'core.mjs', src => src);
    await new Promise(res => setTimeout(res, 800));
    assert.ok(!run.out().includes('code has changed'), run.out());

    // Changed: the lock names the same live process at every moment of the switch.
    const seen = new Set();
    let sampling = true;
    const sampler = (async () => { while (sampling) { seen.add(alive(host) ? lockPid(r.dir) : 'gone'); await new Promise(res => setTimeout(res, 10)); } })();
    edit(cli, 'run-switch.mjs', mark('v2'));
    const switched = await until(() => run.out().includes(`${SWITCHED} v2`));
    assert.ok(switched, run.out());
    // A later change switches again, from the speck run on new code.
    edit(cli, 'run-switch.mjs', mark('v3'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v3`)), run.out());
    sampling = false;
    await sampler;
    assert.deepEqual([...seen], [host], 'the lock names the process that was started, and it\'s alive, throughout');
    assert.equal(count(run.out(), 'switching to the new code'), 2, run.out());
    // One speck run watching: the process you started, with only the one on the newest code under it.
    assert.ok(await until(() => childrenOf(host).length === 1), `${childrenOf(host)}`);
    const worker = childrenOf(host)[0];

    process.kill(-host, 'SIGINT'); // Ctrl+C from the terminal
    assert.ok(await until(() => run.child.exitCode !== null), run.out());
    assert.ok(await until(() => !alive(worker)), 'the speck run on new code stopped too');
    assert.equal(lockPid(r.dir), null, 'the lock is released');
    assert.ok(run.out().includes('speck run stopped.'), run.out());
  } finally { await stop(run); }
});

test('0247 AC3: the panel\'s off switch, SIGINT to the process it started, stops it after a switch', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    const worker = childrenOf(run.child.pid)[0];
    run.child.kill('SIGINT');
    assert.ok(await until(() => run.child.exitCode !== null), run.out());
    assert.ok(await until(() => !alive(worker)), 'the speck run on new code stopped too');
    assert.equal(lockPid(r.dir), null);
  } finally { await stop(run); }
});

test('0247 AC2: it waits for the running build, saying so once, starts nothing new meanwhile, and the new code carries on', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 1 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '1500' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes('will switch to the new code')), run.out());
    assert.ok(run.out().includes(waitingSays(['0001'], null)), run.out());
    assert.ok(await until(() => r.calls().length === 2, 10000), run.out());
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('0001 build exited with code 0.') < out.indexOf(`${SWITCHED} v2`), out);
    assert.ok(out.indexOf('0001 build exited with code 0.') < out.indexOf('Launched 0002'), `0002 is launched only once 0001 has ended:\n${out}`);
    assert.ok(!out.includes('couldn\'t switch'), `so by the new code:\n${out}`);
    assert.equal(count(out, 'Launched 0001'), 1, `the new code doesn't launch 0001 again:\n${out}`);
  } finally { await stop(run); }
});

// Sets a draft ticket ready and commits it, for speck run to launch.
const setReady = (r, id) => {
  const t = path.join(r.dir, 'speck', 'tickets', `${id}-t.md`);
  fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: draft', 'status: ready'));
  r.g('commit', '-qam', `ready ${id}`);
};

test('0247 AC1, AC2: it waits for a build it adopted, naming it once, launches nothing meanwhile, then switches', async () => {
  const r = runRepo({ tickets: [['0002', { status: 'draft' }]], max: 2 });
  const left = leftRunning(r.dir, '0001');
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await until(() => run.out().includes('0001 is already being built')), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(waitingSays(['0001'], null))), run.out());
    setReady(r, '0002');
    await new Promise(res => setTimeout(res, 600));
    assert.equal(r.calls().length, 0, `nothing is launched while it waits:\n${run.out()}`);
    process.kill(left.pid, 'SIGKILL');
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    assert.ok(await until(() => r.calls().length === 1), run.out());
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('0001 build (session old-0001') < out.indexOf(`${SWITCHED} v2`), out);
  } finally { try { process.kill(left.pid, 'SIGKILL'); } catch { /* gone */ } await stop(run); }
});

test('0247 AC1, AC2: it waits for the ship it started, naming it once, then switches', async () => {
  const r = shipRepo({ test: 'sleep 1.5' });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await until(() => run.out().includes('Shipping 0001')), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(waitingSays([], '0001'))), run.out());
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`), 20000), run.out());
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('Shipped 0001.') > 0 && out.indexOf('Shipped 0001.') < out.indexOf(`${SWITCHED} v2`), out);
    assert.equal(count(out, 'Shipping 0001'), 1, `no ship starts again:\n${out}`);
  } finally { await stop(run); }
});

// A copy of the CLI whose speck run, on new code, fails as it starts watching, after its code has loaded.
const failsStarting = src => src.replace('const start = () => { started = true;', 'const start = () => { started = true; throw new Error(\'broken start\');');

test('0247 AC4: new code that fails as it starts watching leaves the old one running, the first time and after a switch', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]], max: 2 });
  const { cli } = cliCopy();
  assert.notEqual(failsStarting(fs.readFileSync(path.join(path.dirname(cli), 'run.mjs'), 'utf8')), fs.readFileSync(path.join(path.dirname(cli), 'run.mjs'), 'utf8'));
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    // The process you started, still running its own code.
    edit(cli, 'run.mjs', failsStarting);
    assert.ok(await until(() => run.out().includes('couldn\'t switch to the new code: Error: broken start')), run.out());
    setReady(r, '0001');
    assert.ok(await until(() => r.calls().length === 1), run.out());
    // A speck run on new code, after a switch.
    edit(cli, 'run.mjs', src => src.replace('throw new Error(\'broken start\');', ''));
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    edit(cli, 'run.mjs', failsStarting);
    assert.ok(await until(() => count(run.out(), 'couldn\'t switch to the new code: Error: broken start') === 2), run.out());
    setReady(r, '0002');
    assert.ok(await until(() => r.calls().length === 2), run.out());
    assert.equal(run.child.exitCode, null);
    assert.equal(childrenOf(run.child.pid).length, 1, 'only the speck run that carried on');
    assert.ok(!run.out().includes(`${SWITCHED} v3`));
  } finally { await stop(run); }
});

test('0247 AC2: what it says names each build and the ship it waits for', () => {
  assert.equal(waitingSays(['0001', '0003'], '0002'), 'speck run\'s code has changed, so it will switch to the new code when its running builds and ships have ended: the build of 0001, the build of 0003 and the ship of 0002. It starts no new build or ship until then.');
  assert.equal(waitingSays([], '0002'), 'speck run\'s code has changed, so it will switch to the new code when its running builds and ships have ended: the ship of 0002. It starts no new build or ship until then.');
  assert.equal(waitingSays([], null), 'speck run\'s code has changed, so it\'s switching to the new code.');
});

test('0247 AC4: new code that can\'t start leaves the old one running, said once with the reason, and the next change switches', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await watching(run), run.out());
    const host = run.child.pid;
    edit(cli, 'core.mjs', src => `${src}\nexport const broken = ;\n`);
    assert.ok(await until(() => run.out().includes('couldn\'t switch to the new code')), run.out());
    await new Promise(res => setTimeout(res, 800));
    const out = run.out();
    assert.equal(count(out, 'couldn\'t switch to the new code'), 1, out);
    assert.match(out, /couldn't switch to the new code: SyntaxError: [^\n]+\nIt carries on with the code it has, and tries again at the next change\./);
    assert.ok(!out.includes(SWITCHED), out);
    assert.equal(run.child.exitCode, null);
    assert.equal(lockPid(r.dir), host);
    assert.deepEqual(childrenOf(host), [], 'nothing left over from the try');

    // Still the old speck run, watching: it launches a ticket set ready now.
    const t = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
    fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: draft', 'status: ready'));
    r.g('commit', '-qam', 'ready');
    assert.ok(await until(() => r.calls().length === 1), run.out());

    edit(cli, 'core.mjs', src => src.replace('\nexport const broken = ;\n', '\n// mended\n'));
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
  } finally { await stop(run); }
});

test('0247 AC1: failedSays gives the reason and what happens next', () => {
  assert.equal(failedSays('it stopped.'), 'speck run couldn\'t switch to the new code: it stopped.\nIt carries on with the code it has, and tries again at the next change.');
});

test('0247 AC5: the brief says speck run switches to new code once it\'s idle', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck run` |'));
  assert.match(row, /switches to its new code once it's idle/);
});
