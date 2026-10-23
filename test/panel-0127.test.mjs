import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fakePage, switchPage, page, startPanel, stop, freePort, request } from './support/panel.mjs';
import { runRepo, startRun, stopRun, until } from './support/run.mjs';

// ---------- 0127: the panel shows whether speck run is on ----------

const lockOf = dir => path.join(dir, 'speck', '.cache', 'runs', 'run.lock');
// /api/state has run only while speck run is on, so it still matches speck status --json otherwise (0031): no run means off.
const apiRun = async port => JSON.parse((await request(port, { pathName: '/api/state' })).body).run;
const OFF = undefined;
// 0285: the Auto-build switch, in the Settings view's Foreman group now.
const runPill = p => [p.runSwitch()].find(n => /\brun-(on|off)\b/.test(n.className || ''));
const state = on => ({ tickets: [], ideas: [], resume_command: '', ...(on ? { run: { on: true, pid: 4242 } } : {}) });

test('0127 AC1: while speck run is running, /api/state reports it on', async () => {
  const r = runRepo({ tickets: [] });
  const run = startRun(r.dir);
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    assert.ok(await until(() => fs.existsSync(lockOf(r.dir))), `speck run took its lock: ${run.out()}`);
    const got = await apiRun(p.port);
    assert.equal(got.on, true);
    assert.equal(got.pid, run.child.pid);
  } finally { await stop(p); await stopRun(run); }
});

test('0127 AC1: the page shows speck run is on when the state says so', async () => {
  const p = switchPage([state(true)]);
  await p.settle();
  const pill = runPill(p);
  assert.ok(pill, 'a speck run pill is in the header');
  assert.match(pill.className, /\brun-on\b/);
  assert.equal(pill.textContent, 'On');
});

test('0127 AC2: with no speck run, /api/state reports it off', async () => {
  const r = runRepo({ tickets: [] });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    assert.equal(await apiRun(p.port), OFF);
    // Reading it doesn't take a lock.
    assert.equal(fs.existsSync(lockOf(r.dir)), false);
  } finally { await stop(p); }
});

test('0127 AC2: after speck run stops, /api/state reports it off', async () => {
  const r = runRepo({ tickets: [] });
  const run = startRun(r.dir);
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    assert.ok(await until(async () => (await apiRun(p.port)).on));
    await stopRun(run);
    assert.equal(await apiRun(p.port), OFF);
  } finally { await stop(p); await stopRun(run); }
});

test('0127 AC2: the page shows speck run is off when the state has no run, or a run that is not on', async () => {
  for (const s of [state(false), { ...state(false), run: { on: false, pid: null } }]) {
    const p = switchPage([s]);
    await p.settle();
    const pill = runPill(p);
    assert.ok(pill, 'a speck run pill is in the header');
    assert.match(pill.className, /\brun-off\b/);
    assert.equal(pill.textContent, 'Off');
  }
});

test('0127 AC3: the page shows the new state at its next refresh, without reloading', async () => {
  const p = switchPage([state(false), state(true), state(false)]);
  await p.settle();
  assert.equal(runPill(p).textContent, 'Off');
  p.timers.shift()(); await p.settle();
  assert.equal(runPill(p).textContent, 'On');
  p.timers.shift()(); await p.settle();
  assert.equal(runPill(p).textContent, 'Off');
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 3);
});

test('0127 AC3: the pill sits in the header, not in a ticket row (0150: it is the Auto-build button, and the connection pill has gone)', async () => {
  const header = page().match(/<header>([\s\S]*?)<\/header>/)[1];
  assert.ok(header.indexOf('id="run"') >= 0, 'in the header');
  assert.doesNotMatch(header, /id="pills"/);
  const p = fakePage([state(true)]);
  await p.settle();
  assert.equal(p.byId('run').children.length, 0, 'nothing put in it: it is speck\'s screen (0413)');
  assert.equal(p.byId('pills').children.length, 0);
});

test('0127 AC4: a lock left by a speck run whose process has gone shows as off, and is left as it was', async () => {
  const r = runRepo({ tickets: [] });
  const gone = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
  const pid = gone.pid;
  await new Promise(res => { gone.on('exit', res); gone.kill('SIGKILL'); });
  fs.mkdirSync(path.dirname(lockOf(r.dir)), { recursive: true });
  fs.writeFileSync(lockOf(r.dir), String(pid));
  const before = fs.statSync(lockOf(r.dir)).mtimeMs;
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    assert.equal(await apiRun(p.port), OFF);
    assert.equal(fs.readFileSync(lockOf(r.dir), 'utf8'), String(pid));
    assert.equal(fs.statSync(lockOf(r.dir)).mtimeMs, before);
  } finally { await stop(p); }
});

test('0127 AC4: a lock that holds no process id shows as off', async () => {
  const r = runRepo({ tickets: [] });
  fs.mkdirSync(path.dirname(lockOf(r.dir)), { recursive: true });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    for (const junk of ['', 'abc', '0', '-1', '1.5', String(process.pid) + 'x']) {
      fs.writeFileSync(lockOf(r.dir), junk);
      assert.equal(await apiRun(p.port), OFF, JSON.stringify(junk));
    }
  } finally { await stop(p); }
});
