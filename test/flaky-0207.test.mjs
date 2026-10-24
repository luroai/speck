import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startPanel, stop, freePort, request, post, tokenOf, cliCopy } from './support/panel.mjs';
import { runRepo, killAll } from './support/run.mjs';
import { waitedForReading, costMs } from './support/timing.mjs';
import { slowPanel } from './support/slow-panel.mjs';

// ---------- 0207: the tests that failed by chance give the same result however busy the machine is ----------

const TEST = path.dirname(fileURLToPath(import.meta.url));
const src = f => fs.readFileSync(path.join(TEST, f), 'utf8');
// The body of the test named `name` in `file`: from its name to the next test.
function body(file, name) {
  const s = src(file);
  const at = s.indexOf(`test('${name}'`);
  assert.ok(at >= 0, `${file} has the test "${name}"`);
  const next = s.indexOf('test(\'', at + 1);
  return s.slice(at, next < 0 ? s.length : next);
}

test('0207 AC1: the 0153 second-ship test takes its snapshot only once the first ship has reached its tests', () => {
  const b = body('ship-0153.test.mjs', '0153 AC2: a second speck ship for the same ticket refuses, saying a ship is already running, and changes nothing');
  assert.match(b, /const \{ gate, reached, test: cmd \} = gated\(\);/);
  const waits = b.search(/await until\(\(\) => fs\.existsSync\(reached\), 'the first ship to reach its tests'\);/);
  const snap = b.indexOf('const snap = r.snapshot();');
  assert.ok(waits >= 0, 'it waits for the gate\'s reached file');
  assert.ok(snap > waits, 'its snapshot comes after that wait');
});

// A copy of the CLI whose `speck run` pauses for SPECK_TEST_LOCKED_MS once it holds its lock, before it says it's
// watching, as a busy machine can make it.
function pausedCli() {
  const { cli } = cliCopy();
  const run = path.join(path.dirname(cli), 'run.mjs');
  const at = '  const lock = takeRunLock(repo);\n';
  const s = fs.readFileSync(run, 'utf8');
  assert.ok(s.includes(at), 'run.mjs takes its lock');
  fs.writeFileSync(run, s.replace(at, `${at}  if (process.env.SPECK_TEST_LOCKED_MS) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(process.env.SPECK_TEST_LOCKED_MS));\n`));
  return cli;
}

test('0207 AC2: a speck run turned on from the panel shows as on only once it has said so, so a second one\'s refusal is only its own', async () => {
  const r = runRepo({ tickets: [] });
  const p = await startPanel(r.dir, ['--port', String(await freePort())], pausedCli(), { SPECK_RUN_POLL_MS: '100', SPECK_TEST_LOCKED_MS: '1000' });
  let pid = null;
  try {
    const token = tokenOf((await request(p.port)).body);
    let res = await post(p.port, '/api/run/on', { token });
    assert.equal(res.status, 200, res.body);
    pid = JSON.parse(res.body).run.pid;
    const log = fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.log'), 'utf8');
    assert.match(log, /^\d\d:\d\d:\d\d speck run: watching for ready tickets/m, 'it had said it\'s watching when the panel showed it on');
    res = await post(p.port, '/api/run/on', { token });
    assert.equal(res.status, 409, res.body);
    const error = JSON.parse(res.body).error;
    assert.match(error, new RegExp(`^speck run is already running in this repo \\(process ${pid}\\)`));
    assert.doesNotMatch(error, /watching/, 'nothing the first one said');
  } finally { await stop(p); if (pid) killAll([pid]); }
});

test('0207 AC3: an answer that waits for a reading counts as waiting, and one slowed by a busy machine doesn\'t', () => {
  // 0177's slow reading takes 5 seconds; an ask sent 300 ms in that waits for it takes the rest of it.
  assert.equal(waitedForReading({ ms: 200 + 4700, base: 200, reading: 5000 }), true);
  assert.equal(waitedForReading({ ms: 900 + 2600, base: 900, reading: 5100 }), true, 'one sent later still waits for half of it');
  // The times seen while another build's suite ran (0191): 1306 and 1106 ms, against 1 second.
  assert.equal(waitedForReading({ ms: 1306, base: 900, reading: 5100 }), false);
  assert.equal(waitedForReading({ ms: 1106, base: 300, reading: 5000 }), false);
});

test('0207 AC3: on a panel whose readings take 2 seconds, an answer that waits for a reading counts as waiting, and one that doesn\'t wait doesn\'t', async () => {
  const s = await slowPanel(2000);
  const timed = async f => { const t = Date.now(); const out = await f(); return { ms: Date.now() - t, out }; };
  const log = () => request(s.port, { pathName: '/api/tickets/1/log' }), state = () => request(s.port, { pathName: '/api/state' });
  try {
    const base = await timed(log);
    const slow = state();
    await new Promise(r => setTimeout(r, 300));
    // Another /api/state request waits for the reading under way, as any answer would if the panel made it wait.
    const [quick, waited] = await Promise.all([timed(log), timed(state)]);
    for (const t of [base, quick, waited, { out: await slow }]) assert.equal(t.out.status, 200, t.out.body);
    const reading = s.readingMs();
    assert.equal(waitedForReading({ ms: waited.ms, base: base.ms, reading }), true, `waited ${waited.ms} ms, against ${base.ms} ms, for a ${reading} ms reading`);
    assert.equal(waitedForReading({ ms: quick.ms, base: base.ms, reading }), false, `answered in ${quick.ms} ms, against ${base.ms} ms, during a ${reading} ms reading`);
  } finally { await stop(s.p); }
});

test('0207 AC3: the 0177 AC3 tests compare each answer with the same ask made with nothing reading, not with 1 second', () => {
  const s = src('panel-0177.test.mjs');
  const from = s.indexOf("describe('0177 AC3"), to = s.indexOf("test('0177 AC4");
  assert.ok(from >= 0 && to > from);
  const ac3 = s.slice(from, to);
  assert.doesNotMatch(ac3, /< ?1000\b/, 'no fixed limit');
  for (const name of ['the page, its icons', 'Stop build stops', 'the speck run switch', 'Ship ships']) {
    const at = ac3.indexOf(name);
    assert.ok(at >= 0, name);
    const next = ac3.indexOf("test('", at);
    assert.match(ac3.slice(at, next < 0 ? ac3.length : next), /notWaited\(/, `${name} uses the comparison`);
  }
  assert.match(s, /waitedForReading\(\{ ms, base, reading \}\)/);
  assert.doesNotMatch(ac3, /notWaited\([^)]*read\.ms/, 'one reading, not the whole request, which a write can make wait for two');
});

test('0207 AC3: the 0176 AC1 timing counts the work speck status does, not time spent waiting for other processes', { skip: process.platform !== 'linux' && 'reads /proc' }, () => {
  // Work until it has used 300 ms of CPU, however long that takes on a busy machine; and wait 300 ms, doing nothing.
  const spin = spawnSync.bind(null, process.execPath, ['-e', 'while (process.cpuUsage().user < 300000);']);
  const sleep = spawnSync.bind(null, process.execPath, ['-e', 'setTimeout(() => {}, 300)']);
  const idle = costMs(sleep), busy = costMs(spin);
  assert.ok(busy >= 290, `300 ms of work costs ${busy} ms`);
  assert.ok(idle < busy - 200, `300 ms of waiting costs ${idle} ms, against ${busy} ms of work`);
  assert.match(body('build-log-0176.test.mjs', '0176 AC1: with 200 finished builds, logs 10 times bigger add less than 10% to how long speck status --json takes'), /statusMs\(dir, 3\)/);
  assert.match(src('build-log-0176.test.mjs'), /function statusMs\(dir, tries\) \{[^}]*costMs\(\(\) => \{ r = spawnSync\(process\.execPath, \[CLI, 'status', '--json'\]/);
});
