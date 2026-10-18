import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runRepo, until, alive, leftRunning, record, fm, good, FAKE } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { shipRepo } from './support/ship.mjs';
import { cliCopy } from './support/panel.mjs';
import { waitingSays } from '../scripts/run-switch.mjs';
import { readForeman } from '../scripts/foreman.mjs';
import { startRun, stop, count, edit, SWITCHED, mark, setReady } from './support/run-switch.mjs';

// ---------- 0301: speck run switches to new code without waiting for builds to end ----------

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const building = dir => readForeman(runs(dir))?.building || [];
const killAll = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } };

test('0301 AC1, AC2, AC5: it switches while a build runs, which carries on, counted, shown as building and watched to its end', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'draft' }]], max: 1 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '5000' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    const { pid } = r.calls()[0];
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    assert.ok(alive(pid), `the build is still running as it switches:\n${run.out()}`);
    assert.ok(!run.out().includes('will switch to the new code'), `it didn't wait:\n${run.out()}`);
    // AC2: counted towards max_parallel_builds (1), and shown as building.
    assert.ok(await until(() => building(r.dir).includes('0001')), JSON.stringify(readForeman(runs(r.dir))));
    setReady(r, '0002');
    await new Promise(res => setTimeout(res, 600));
    assert.equal(r.calls().length, 1, `nothing else is launched while it runs:\n${run.out()}`);
    // Watched to its end by the new code, which then launches the next.
    assert.ok(await until(() => r.calls().length === 2, 10000), run.out());
    const out = run.out();
    assert.ok(out.indexOf(`${SWITCHED} v2`) < out.indexOf('0001 build (session'), out);
    assert.ok(out.indexOf('0001 build (session') < out.indexOf('Launched 0002'), out);
    // AC5: the build wasn't stopped or started again.
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001', '0002'], out);
    assert.equal(count(out, 'Launched 0001'), 1, out);
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});

test('0301 AC3: a build killed after the switch, its ticket building, is treated as stopped partway, as before', async () => {
  const r = runRepo({ tickets: [['0001', {}]], max: 1 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '3000', FAKE_SIGNAL: 'SIGTERM' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    // The build starts its ticket, as speck start does.
    const t = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
    fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: ready', 'status: building'));
    r.g('commit', '-qam', 'building');
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    assert.ok(alive(r.calls()[0].pid), run.out());
    // As before the switch: kept to resume, with no exit recorded, and said once. This build_command can't resume it.
    assert.ok(await until(() => run.out().includes('0001 build (session') && run.out().includes('stopped unexpectedly'), 10000), run.out());
    await new Promise(res => setTimeout(res, 400));
    const out = run.out();
    assert.ok(out.indexOf(`${SWITCHED} v2`) < out.indexOf('stopped unexpectedly'), out);
    assert.equal(count(out, 'stopped unexpectedly'), 1, out);
    assert.ok(!Object.hasOwn(record(r.dir, '0001'), 'exited'), JSON.stringify(record(r.dir, '0001')));
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});

// A repo with an approved ticket that auto-ships, 0001, whose ship's tests take `test`, and a draft ticket 0002 that
// the fake builder builds.
function shipAndBuild(test) {
  const r = shipRepo({ test });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  const cmd = `"${process.execPath}" "${keptFile('fake-build.cjs', FAKE)}" @repo {id} {session}`;
  const text = fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true').replace(/^build_command:.*$/m, '').replace(/^max_parallel_builds:.*$/m, '');
  fs.writeFileSync(cfg, `${text}\nbuild_command: ${JSON.stringify(cmd)}\nmax_parallel_builds: 2\n`);
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0002-t.md'), `---\n${fm({ id: '"0002"', title: 'Second', status: 'draft' })}\n---\n${good}`);
  r.g('add', '-A');
  r.g('commit', '-qm', 'config and 0002');
  const out = path.join(r.dir, '.git', 'fake-out');
  fs.mkdirSync(out, { recursive: true });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')));
  return { ...r, calls };
}

test('0301 AC1, AC4: it waits only for the ship, naming it once, starting no ship but launching builds meanwhile', async () => {
  const r = shipAndBuild('sleep 3');
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '8000' });
  try {
    assert.ok(await until(() => run.out().includes('Shipping 0001')), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(waitingSays('0001'))), run.out());
    setReady(r, '0002');
    assert.ok(await until(() => r.calls().length === 1), `a build starts while it waits:\n${run.out()}`);
    assert.ok(!run.out().includes(`${SWITCHED} v2`), run.out());
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`), 20000), run.out());
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('Launched 0002') < out.indexOf('Shipped 0001.'), out);
    assert.ok(out.indexOf('Shipped 0001.') < out.indexOf(`${SWITCHED} v2`), out);
    assert.equal(count(out, 'Shipping '), 1, `no other ship started:\n${out}`);
    assert.ok(alive(r.calls()[0].pid), 'the build carries on through the switch');
    assert.ok(await until(() => building(r.dir).includes('0002')), JSON.stringify(readForeman(runs(r.dir))));
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});

test('0301 AC2, AC3: a build of an approved ticket, running through the switch, ships once it ends', async () => {
  const r = shipAndBuild('true');
  const left = leftRunning(r.dir, '0001');
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    assert.ok(await until(() => run.out().includes('0001 is already being built')), run.out());
    edit(cli, 'run-switch.mjs', mark('v2'));
    assert.ok(await until(() => run.out().includes(`${SWITCHED} v2`)), run.out());
    assert.ok(alive(left.pid));
    assert.ok(await until(() => building(r.dir).includes('0001')), JSON.stringify(readForeman(runs(r.dir))));
    await new Promise(res => setTimeout(res, 400));
    assert.ok(!run.out().includes('Shipping 0001'), `not while its build runs:\n${run.out()}`);
    process.kill(left.pid, 'SIGKILL');
    assert.ok(await until(() => run.out().includes('Shipped 0001.'), 20000), run.out());
    const out = run.out();
    assert.ok(out.indexOf(`${SWITCHED} v2`) < out.indexOf('Shipping 0001'), out);
  } finally { killAll([left.pid]); await stop(run); }
});

test('0301 AC4: what it says names the ship it waits for, and that builds may start meanwhile', () => {
  const said = waitingSays('0002');
  assert.ok(said.includes('the ship of 0002'), said);
  assert.ok(!/build/.test(said.replace(/new builds? may (still )?start/, '')), said);
  assert.equal(waitingSays(null), 'speck run\'s code has changed, so it\'s switching to the new code.');
});

// Self-check: new code that takes a while to fail getting ready, so the build ends while it hands over.
const slowFail = src => src.replace('const adoptEarlierBuilds = () => {', 'const adoptEarlierBuilds = () => { if (process.connected) { const end = Date.now() + 2500; while (Date.now() < end); throw new Error(\'broken start\'); }');

test('0301 AC3 self-check: a build that ends while the new code fails to start is handled by the code that carries on', async () => {
  const r = runRepo({ tickets: [['0001', {}]], max: 1 });
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_MS: '1200' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    edit(cli, 'run.mjs', slowFail);
    assert.ok(await until(() => run.out().includes('0001 build exited with code 0.'), 15000), run.out());
    const out = run.out();
    assert.ok(out.indexOf('couldn\'t switch to the new code') < out.indexOf('0001 build exited with code 0.'), `held until the switch failed:\n${out}`);
    assert.equal(count(out, '0001 build exited'), 1, out);
    assert.ok(Object.hasOwn(record(r.dir, '0001'), 'exited'), JSON.stringify(record(r.dir, '0001')));
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});
