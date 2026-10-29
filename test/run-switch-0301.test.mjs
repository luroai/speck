import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runRepo, waitFor, alive, leftRunning, record, fm, good, FAKE } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { shipRepo } from './support/ship.mjs';
import { gated } from './support/gate.mjs';
import { cliCopy } from './support/panel.mjs';
import { waitingSays } from '../scripts/run-switch.mjs';
import { readForeman } from '../scripts/foreman.mjs';
import { startRun, stop, count, edit, SWITCHED, mark, setReady, buildGate, openGate } from './support/run-switch.mjs';

// ---------- 0301: speck run switches to new code without waiting for builds to end ----------

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const building = dir => readForeman(runs(dir))?.building || [];
const killAll = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } };

test('0301 AC1, AC2, AC5: it switches while a build runs, which carries on, counted, shown as building and watched to its end', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'draft' }]], max: 1 });
  const { cli } = cliCopy();
  // Its builds run until the test lets them end.
  const build = buildGate();
  const run = startRun(r.dir, cli, { FAKE_GATE: build.gate });
  try {
    await waitFor(() => r.calls().length === 1, 'the build of 0001 to start', run.out);
    const { pid } = r.calls()[0];
    edit(cli, 'run-switch.mjs', mark('v2'));
    await waitFor(() => run.out().includes(`${SWITCHED} v2`), 'the switch to v2', run.out);
    assert.ok(alive(pid), `the build is still running as it switches:\n${run.out()}`);
    assert.ok(!run.out().includes('will switch to the new code'), `it didn't wait:\n${run.out()}`);
    // AC2: counted towards max_parallel_builds (1), and shown as building.
    await waitFor(() => building(r.dir).includes('0001'), '0001 to show as building', () => JSON.stringify(readForeman(runs(r.dir))));
    setReady(r, '0002');
    await new Promise(res => setTimeout(res, 600));
    assert.equal(r.calls().length, 1, `nothing else is launched while it runs:\n${run.out()}`);
    build.open();
    // Watched to its end by the new code, which then launches the next.
    await waitFor(() => r.calls().length === 2, 'the build of 0002 to start once 0001 ends', run.out);
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
  // Its build runs until the test lets it end, then is killed.
  const build = buildGate();
  const run = startRun(r.dir, cli, { FAKE_GATE: build.gate, FAKE_SIGNAL: 'SIGTERM' });
  try {
    await waitFor(() => r.calls().length === 1, 'the build of 0001 to start', run.out);
    // The build starts its ticket, as speck start does.
    const t = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
    fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: ready', 'status: building'));
    r.g('commit', '-qam', 'building');
    edit(cli, 'run-switch.mjs', mark('v2'));
    await waitFor(() => run.out().includes(`${SWITCHED} v2`), 'the switch to v2', run.out);
    assert.ok(alive(r.calls()[0].pid), run.out());
    build.open();
    // As before the switch: kept to resume, with no exit recorded, and said once. This build_command can't resume it.
    await waitFor(() => run.out().includes('0001 build (session') && run.out().includes('stopped unexpectedly'), 'speck run to say the build of 0001 stopped unexpectedly', run.out);
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
  // Its ship's tests, and its build, run until the test lets them end.
  const ship = gated(), build = buildGate();
  const r = shipAndBuild(ship.test);
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli, { FAKE_GATE: build.gate });
  try {
    await waitFor(() => run.out().includes('Shipping 0001') && fs.existsSync(ship.reached), 'the ship of 0001 to start its tests', run.out);
    edit(cli, 'run-switch.mjs', mark('v2'));
    await waitFor(() => run.out().includes(waitingSays('0001')), 'speck run to say it waits for the ship', run.out);
    setReady(r, '0002');
    await waitFor(() => r.calls().length === 1, 'a build to start while it waits for the ship', run.out);
    assert.ok(!run.out().includes(`${SWITCHED} v2`), run.out());
    openGate(ship);
    await waitFor(() => run.out().includes(`${SWITCHED} v2`), 'the switch to v2 once the ship ends', run.out);
    const out = run.out();
    assert.equal(count(out, 'will switch to the new code'), 1, out);
    assert.ok(out.indexOf('Launched 0002') < out.indexOf('Shipped 0001.'), out);
    assert.ok(out.indexOf('Shipped 0001.') < out.indexOf(`${SWITCHED} v2`), out);
    assert.equal(count(out, 'Shipping '), 1, `no other ship started:\n${out}`);
    assert.ok(alive(r.calls()[0].pid), 'the build carries on through the switch');
    await waitFor(() => building(r.dir).includes('0002'), '0002 to show as building', () => JSON.stringify(readForeman(runs(r.dir))));
  } finally { await stop(run); killAll(r.calls().map(c => c.pid)); }
});

test('0301 AC2, AC3: a build of an approved ticket, running through the switch, ships once it ends', async () => {
  const r = shipAndBuild('true');
  const left = leftRunning(r.dir, '0001');
  const { cli } = cliCopy();
  const run = startRun(r.dir, cli);
  try {
    await waitFor(() => run.out().includes('0001 is already being built'), 'speck run to take up the build of 0001 already running', run.out);
    edit(cli, 'run-switch.mjs', mark('v2'));
    await waitFor(() => run.out().includes(`${SWITCHED} v2`), 'the switch to v2', run.out);
    assert.ok(alive(left.pid));
    await waitFor(() => building(r.dir).includes('0001'), '0001 to show as building', () => JSON.stringify(readForeman(runs(r.dir))));
    await new Promise(res => setTimeout(res, 400));
    assert.ok(!run.out().includes('Shipping 0001'), `not while its build runs:\n${run.out()}`);
    process.kill(left.pid, 'SIGKILL');
    await waitFor(() => run.out().includes('Shipped 0001.'), 'the ship of 0001 once its build ends', run.out);
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

// Self-check: new code that fails getting ready only once `gate` is opened, or its folder is gone, so the build ends
// while it hands over.
const slowFail = gate => src => src.replace('const adoptEarlierBuilds = () => {', `const adoptEarlierBuilds = () => { if (process.connected) { while (!fs.existsSync(${JSON.stringify(gate)}) && fs.existsSync(${JSON.stringify(path.dirname(gate))})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50); throw new Error('broken start'); }`);

test('0301 AC3 self-check: a build that ends while the new code fails to start is handled by the code that carries on', async () => {
  const r = runRepo({ tickets: [['0001', {}]], max: 1 });
  const { cli } = cliCopy();
  const build = buildGate(), fail = buildGate();
  const run = startRun(r.dir, cli, { FAKE_GATE: build.gate });
  try {
    await waitFor(() => r.calls().length === 1, 'the build of 0001 to start', run.out);
    edit(cli, 'run.mjs', slowFail(fail.gate));
    await waitFor(() => run.out().includes(waitingSays(null)), 'speck run to start switching', run.out);
    // The build ends while the new code is still getting ready, which then fails.
    build.open();
    await waitFor(() => !alive(r.calls()[0].pid), 'the build of 0001 to end', run.out);
    fail.open();
    await waitFor(() => run.out().includes('0001 build exited with code 0.'), 'speck run to say the build of 0001 exited', run.out);
    const out = run.out();
    assert.ok(out.indexOf('couldn\'t switch to the new code') < out.indexOf('0001 build exited with code 0.'), `held until the switch failed:\n${out}`);
    assert.equal(count(out, '0001 build exited'), 1, out);
    assert.ok(Object.hasOwn(record(r.dir, '0001'), 'exited'), JSON.stringify(record(r.dir, '0001')));
  } finally { fail.open(); await stop(run); killAll(r.calls().map(c => c.pid)); }
});
