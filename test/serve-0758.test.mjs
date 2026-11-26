// 0758: speck serve keeps each listed project's speck run going. Most criteria are checked on runKeeper directly, with
// stood-in starts; one test runs a real speck serve over a project whose own speck is the stand-in (support/stand-in-panel.mjs).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runKeeper, runsIn, wantedAtStart, writeAutoBuild, readAutoBuild, RESTARTS_AN_HOUR } from '../scripts/serve-runs.mjs';
import { panelRunOff } from '../scripts/panel-run.mjs';
import { machine, standInProject, addProject, startServe, serveOnce, until, pidAlive, endServe } from './support/serve.mjs';

const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
const tick = () => new Promise(r => setImmediate(r));
const project = name => { const dir = path.join(tmp('speck-0758-'), name); fs.mkdirSync(runsIn(dir), { recursive: true }); return dir; };
const setSwitch = (dir, on, at) => fs.writeFileSync(path.join(runsIn(dir), 'auto-build.json'), JSON.stringify({ on, at, by: 'test' }));
const runLog = dir => { try { return fs.readFileSync(path.join(runsIn(dir), 'run.log'), 'utf8'); } catch { return ''; } };
const lockOf = dir => { try { return Number(fs.readFileSync(path.join(runsIn(dir), 'run.lock'), 'utf8').trim()) || null; } catch { return null; } };

// A keeper over stood-in runs: `on` holds the folders whose run is on, and each start is recorded and turns it on.
function keeper(file, { now = () => Date.now(), startOk = true } = {}) {
  const on = new Set(), started = [], said = [];
  const k = runKeeper({
    file, env: {}, say: t => said.push(t), now,
    state: runs => ({ on: on.has(path.dirname(path.dirname(path.dirname(runs)))), pid: 1 }),
    start: async folder => { started.push(folder); if (!startOk) return { why: 'it stopped (exit code 1)' }; on.add(folder); return { pid: 4242 }; },
  });
  return { k, on, started, said };
}

test('0758 AC1: as it starts, speck serve starts the runs that were on when it last stopped or whose switch was last turned on, and no others', async () => {
  const file = path.join(tmp('speck-0758-home-'), 'serve-runs.json');
  const [onSwitch, wasOn, offSince, never, onAgain] = ['on-switch', 'was-on', 'off-since', 'never', 'on-again'].map(project);
  setSwitch(onSwitch, true, '2026-11-20T10:00:00.000Z');
  setSwitch(offSince, false, '2026-11-20T12:00:00.000Z');
  setSwitch(onAgain, false, '2026-11-20T09:00:00.000Z');
  fs.writeFileSync(file, JSON.stringify({ runs: {
    [wasOn]: { since: '2026-11-20T08:00:00.000Z' },
    [offSince]: { since: '2026-11-20T11:00:00.000Z' }, // turned off after this run took its lock
    [onAgain]: { since: '2026-11-20T10:00:00.000Z' }, // started again after it was turned off
  } }));
  const { k, started, said } = keeper(file);
  k.check([onSwitch, wasOn, offSince, never, onAgain]);
  await tick(); await tick();
  assert.deepEqual(started.sort(), [onSwitch, wasOn, onAgain].sort());
  assert.ok(said.some(t => /on-switch: started speck run \(process 4242\), as its Auto-build switch was last turned on/.test(t)), said.join('\n'));
  assert.match(runLog(wasOn), /speck serve: started speck run \(process 4242\), as it was on when speck serve last stopped/);
  assert.equal(readAutoBuild(runsIn(wasOn)).on, true, 'a run it starts is one it keeps going');
  assert.equal(runLog(never), '');

  assert.equal(wantedAtStart(null, null), false);
  assert.equal(wantedAtStart({ on: false, at: 'nonsense' }, { since: null }), false, 'unreadable times leave it off');
});

test('0758 AC1: speck serve records which runs are on, keeping that after it stops, and forgets a project taken off the list', async () => {
  const file = path.join(tmp('speck-0758-home-'), 'serve-runs.json');
  const a = project('alpha'), b = project('bravo');
  fs.writeFileSync(path.join(runsIn(a), 'run.lock'), '1');
  const { k, on } = keeper(file);
  on.add(a);
  k.check([a, b]);
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(rec.runs), [a]);
  assert.equal(typeof rec.runs[a].since, 'string');
  k.check([b]);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).runs, {});
});

test('0758 AC2: the Auto-build switch turned off is recorded, so speck serve neither starts the run again nor starts it on its next start', async () => {
  const dir = project('alpha');
  setSwitch(dir, true, '2026-11-20T10:00:00.000Z');
  const out = await panelRunOff(dir);
  assert.equal(out.status, 409, 'off already');
  const sw = readAutoBuild(runsIn(dir));
  assert.equal(sw.on, false);
  const file = path.join(tmp('speck-0758-home-'), 'serve-runs.json');
  fs.writeFileSync(file, JSON.stringify({ runs: { [dir]: { since: '2026-11-20T10:00:00.000Z' } } }));
  // While it runs: on, then off with the switch off, is left off.
  const one = keeper(file);
  one.on.add(dir);
  one.k.check([dir]);
  one.on.delete(dir);
  one.k.check([dir]); one.k.check([dir]);
  await tick();
  assert.deepEqual(one.started, []);
  // After a restart, with the record saying it was on before the switch was turned off.
  const two = keeper(file);
  two.k.check([dir]);
  await tick();
  assert.deepEqual(two.started, []);
});

test(`0758 AC3: a run that stops without being turned off is started again, at most ${RESTARTS_AN_HOUR} times an hour, saying so in the Pipeline log`, async () => {
  const file = path.join(tmp('speck-0758-home-'), 'serve-runs.json');
  const dir = project('alpha');
  setSwitch(dir, true, '2026-11-20T10:00:00.000Z');
  let t = Date.parse('2026-11-26T09:00:00');
  const { k, on, started, said } = keeper(file, { now: () => t });
  on.add(dir);
  k.check([dir]);
  for (let i = 1; i <= RESTARTS_AN_HOUR; i++) {
    on.delete(dir); t += 60000;
    k.check([dir]); await tick(); await tick();
    assert.equal(started.length, i);
    assert.match(runLog(dir), new RegExp(`speck serve: speck run stopped without being turned off, so speck serve started it again \\(process 4242\\), ${i} of at most ${RESTARTS_AN_HOUR} times an hour`));
  }
  on.delete(dir); t += 60000;
  k.check([dir]); k.check([dir]); await tick();
  assert.equal(started.length, RESTARTS_AN_HOUR, 'not a fourth time in the hour');
  const held = runLog(dir).match(/speck serve: speck run stopped without being turned off, but speck serve has started it again 3 times in the last hour, so it leaves it off until 10:01, then starts it again/g);
  assert.equal(held?.length, 1, 'said once');
  assert.ok(said.some(s => s.startsWith('alpha: speck run stopped')));
  t = Date.parse('2026-11-26T10:01:00');
  k.check([dir]); await tick(); await tick();
  assert.equal(started.length, RESTARTS_AN_HOUR + 1, 'started again once the hour allows');
});

test('0758 AC3: a run that fails to start is said in the Pipeline log and counts towards the limit', async () => {
  const file = path.join(tmp('speck-0758-home-'), 'serve-runs.json');
  const dir = project('alpha');
  setSwitch(dir, true, '2026-11-20T10:00:00.000Z');
  const { k, started } = keeper(file, { startOk: false });
  for (let i = 0; i < 6; i++) { k.check([dir]); await tick(); await tick(); }
  assert.equal(started.length, 1 + RESTARTS_AN_HOUR);
  assert.match(runLog(dir), /speck serve: speck run didn't start: it stopped \(exit code 1\)\. speck serve tries again while Auto-build is on/);
});

test('0758 AC1, AC3, AC4: a real speck serve starts the run, starts it again when it stops, and --stop leaves it on and says so', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  writeAutoBuild(runsIn(a), true, 'test');
  const s = startServe(m);
  let pid;
  try {
    const first = await until('alpha\'s run started', () => lockOf(a));
    assert.ok(pidAlive(first));
    await until('the Pipeline log saying it started', () => new RegExp(`speck serve: started speck run \\(process ${first}\\), as its Auto-build switch was last turned on`).test(runLog(a)));
    process.kill(first, 'SIGKILL');
    const killed = Date.now();
    pid = await until('alpha\'s run started again', () => { const p = lockOf(a); return p && p !== first && pidAlive(p) && p; }, 30000);
    assert.ok(Date.now() - killed < 30000);
    await until('the Pipeline log saying so', () => /started it again \(process \d+\), 1 of at most 3 times an hour/.test(runLog(a)));
    assert.equal(lockOf(b), null, 'bravo\'s run left off');
    const stop = serveOnce(m, '--stop');
    assert.equal(stop.status, 0, stop.stderr);
    assert.match(stop.stdout, /speck run is still on in alpha: turn it off with each project's Auto-build switch\./);
    assert.ok(pidAlive(pid), 'alpha\'s run still running');
  } finally { await endServe(s); if (pid && pidAlive(pid)) process.kill(pid, 'SIGTERM'); }
});

test('0758: the brief names the files speck serve keeps runs going by, and that --stop leaves each speck run on', () => {
  const brief = fs.readFileSync(path.join(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck serve'));
  for (const fact of ['`speck/.cache/runs/auto-build.json`', '`~/.config/speck/serve-runs.json`', 'at most 3 times an hour']) assert.ok(row.includes(fact), fact);
  assert.equal(RESTARTS_AN_HOUR, 3);
});
