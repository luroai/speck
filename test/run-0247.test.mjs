import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, runRepo, until, alive } from './support/run.mjs';
import { shipRepo } from './support/ship.mjs';
import { cliCopy } from './support/panel.mjs';
import { waitingSays, failedSays } from '../scripts/run-switch.mjs';
import { startRun, stop, lockPid, childrenOf, count, edit, SWITCHED, mark, watching, setReady } from './support/run-switch.mjs';

// ---------- 0247: speck run switches to its new code once it's idle ----------

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
    assert.ok(await until(() => run.out().includes(waitingSays('0001'))), run.out());
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`), 20000), run.out());
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('Shipped 0001.') > 0 && out.indexOf('Shipped 0001.') < out.indexOf(`${SWITCHED} v2`), out);
    assert.equal(count(out, 'Shipping 0001'), 1, `no ship starts again:\n${out}`);
  } finally { await stop(run); }
});

// speck run's code broken so that, on new code, it fails getting ready after its code has loaded, adopting earlier
// builds, so not as it imports.
const failsPreparing = src => src.replace('const adoptEarlierBuilds = () => {', 'const adoptEarlierBuilds = () => { if (process.connected) throw new Error(\'broken start\');');

test('0247 AC4: new code that fails getting ready leaves the old one running, the first time and after a switch, launching each ticket once', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]], max: 2 });
  const { cli } = cliCopy();
  const runFile = path.join(path.dirname(cli), 'run.mjs');
  assert.notEqual(failsPreparing(fs.readFileSync(runFile, 'utf8')), fs.readFileSync(runFile, 'utf8'));
  const run = startRun(r.dir, cli);
  const fails = () => count(run.out(), 'couldn\'t switch to the new code: Error: broken start');
  try {
    assert.ok(await watching(run), run.out());
    // From the process you started, still running its own code, with a ticket ready to launch as it switches.
    setReady(r, '0001');
    edit(cli, 'run.mjs', failsPreparing);
    assert.ok(await until(() => fails() === 1 && r.calls().length >= 1), run.out());
    // From a speck run on new code, after a switch.
    edit(cli, 'run.mjs', src => src.replace(' if (process.connected) throw new Error(\'broken start\');', ''));
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    setReady(r, '0002');
    edit(cli, 'run.mjs', failsPreparing);
    assert.ok(await until(() => fails() === 2 && r.calls().length >= 2), run.out());
    await new Promise(res => setTimeout(res, 600));
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001', '0002'], `each ticket launched once:\n${run.out()}`);
    assert.equal(fails(), 2, run.out());
    assert.equal(run.child.exitCode, null);
    assert.equal(childrenOf(run.child.pid).length, 1, 'only the speck run that carried on');
  } finally { await stop(run); }
});

// 0301: it waits for the ship only, so it names only that (run-switch-0301.test.mjs).
test('0247 AC2: what it says names the ship it waits for', () => {
  assert.ok(waitingSays('0002').includes('the ship of 0002'));
  assert.equal(waitingSays(null), 'speck run\'s code has changed, so it\'s switching to the new code.');
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

// 0267 left the brief's wording to review.
test('0247 AC5: the brief names speck run', () => {
  assert.ok(fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').includes('`speck run`'));
});
