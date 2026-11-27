import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0771: the project panels speck serve started keep running through its switch to new code, and the new code looks
// after them. The first two run speck serve from a copy of the CLI whose code they change; the rest check the run keeper
// directly, with stood-in runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runKeeper, runsIn, RESTARTS_AN_HOUR } from '../scripts/serve-runs.mjs';
import { argsOf } from '../scripts/serve.mjs';
import { machine, standInProject, addProject, removeProject, until, portOf, getJson, readJson, pidAlive, panelRecords, endServe } from './support/serve.mjs';
import { serveCopy, readCode, writeCode, marked, slowToLoad, serveFrom, workersOf } from './support/serve-switch.mjs';
import { STOP_MS } from './support/stopped.mjs';

const nameOf = dir => path.basename(dir);
const count = (text, part) => text.split(part).length - 1;
const SWITCHED = 'speck serve: its code changed, so it switched to the new code.';
// The pid of the panel serving `dir` on `port`, once it does.
const panelPid = (port, dir) => until(`${nameOf(dir)}'s panel answering on ${port}`, async () => (await getJson(port, '/api/panel'))?.repo === dir && (await getJson(port, '/copy'))?.pid);
const gone = (pid, port, dir) => until(`${nameOf(dir)}'s panel stopping`, async () => !pidAlive(pid) && (await getJson(port, '/api/panel'))?.repo !== dir);
// Switches the speck serve `s` runs to serve-front.mjs as `text`, for the `times`th time: done once the worker on the old
// code, if it ran in one, has ended, and one worker serves.
async function switched(s, cli, text, times) {
  const [old] = workersOf(s.child.pid); // none before the first switch, when the process you started serves by itself
  writeCode(cli, 'serve-front.mjs', text);
  await until('the switch to the new code', () => count(s.out(), SWITCHED) === times, 10000);
  if (old) await until('the old worker ending', () => !pidAlive(old));
  await until('one worker serving', () => workersOf(s.child.pid).length === 1);
}

test('0771 AC3: the panels speck serve started keep running through the switch, and the new code looks after them rather than starting second copies', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo'), cli = serveCopy(), front = readCode(cli, 'serve-front.mjs');
  addProject(m, a); addProject(m, b);
  const s = serveFrom(cli, m);
  try {
    const pa = await until('alpha started', () => portOf(s.out(), 'alpha')), pb = await until('bravo started', () => portOf(s.out(), 'bravo'));
    const alpha = await panelPid(pa, a), bravo = await panelPid(pb, b);
    await switched(s, cli, marked(front, 'v2'), 1);
    for (const [pid, port, dir] of [[alpha, pa, a], [bravo, pb, b]]) {
      assert.ok(pidAlive(pid), `${nameOf(dir)}'s panel still running`);
      assert.equal((await getJson(port, '/copy'))?.pid, pid, `and still the one serving ${nameOf(dir)} on its port`);
      assert.equal(panelRecords(m, dir).length, 1, `no second panel for ${nameOf(dir)}`);
    }
    assert.deepEqual(readJson(m.record).panels.map(p => p.pid).sort(), [alpha, bravo].sort(), 'its record names them, written by the new code');
    assert.equal(count(s.out(), 'alpha: http://'), 1, 'alpha\'s panel wasn\'t started again');
    assert.doesNotMatch(s.out(), /already running, so left as it is/, 'nor taken for one started by hand');
    // The new code looks after them: one that stops is started again, and one taken off the list is stopped.
    const after = s.out().length;
    process.kill(alpha, 'SIGKILL');
    const again = await until('alpha\'s panel started again by the new code', async () => { const c = await getJson(pa, '/copy'); return c && c.pid !== alpha && (await getJson(pa, '/api/panel'))?.repo === a && c.pid; });
    assert.match(s.out().slice(after), /alpha's panel stopped/);
    removeProject(m, b);
    await gone(bravo, pb, b);
    await until('the new code saying it stopped bravo\'s panel', () => /bravo was taken off your list, so the panel speck serve started for it was stopped/.test(s.out().slice(after)));
    // And the next switch hands over the panel the new code started.
    await switched(s, cli, marked(front, 'v3'), 2);
    assert.equal((await getJson(pa, '/copy'))?.pid, again, 'alpha\'s panel kept through the second switch');
    assert.equal(panelRecords(m, a).length, 1);
    await endServe(s);
    await gone(again, pa, a);
    assert.equal(fs.existsSync(m.record), false, 'its record is gone as it stops');
  } finally { await endServe(s); }
});

test('0771 AC3: speck serve stopped while it switches stops its panels once, and leaves nothing of itself running', async () => {
  // Stopped during its first switch, which the process you started makes itself, and during a later one, which goes
  // through it.
  for (const before of [0, 1]) {
    const m = machine(), a = standInProject('alpha'), cli = serveCopy(), front = readCode(cli, 'serve-front.mjs');
    addProject(m, a);
    const s = serveFrom(cli, m);
    try {
      const pa = await until('alpha started', () => portOf(s.out(), 'alpha'));
      const alpha = await panelPid(pa, a);
      if (before) await switched(s, cli, marked(front, 'v2'), 1);
      const serving = workersOf(s.child.pid);
      writeCode(cli, 'serve-front.mjs', slowToLoad(front, 5000)); // the new code is still starting when it's stopped
      const fresh = await until('a worker starting on the new code', () => workersOf(s.child.pid).find(pid => !serving.includes(pid)));
      const exited = new Promise(r => s.child.once('exit', r));
      s.child.kill('SIGINT');
      await exited;
      await gone(alpha, pa, a);
      await until('its workers ending', () => [fresh, ...serving].every(pid => !pidAlive(pid)), STOP_MS);
      assert.equal(count(s.out(), 'with the 1 panel it started: alpha'), 1, s.out());
      assert.equal(fs.existsSync(m.record), false);
      assert.equal(count(s.out(), SWITCHED), before, 'it didn\'t switch to the code still starting');
    } finally { await endServe(s); }
  }
});

test('0771 AC3: a panel\'s command line is read without starting ps, as the new code looks at every panel it took over each time it reads the list', { skip: fs.existsSync('/proc/self/cmdline') ? false : 'no /proc here, so ps is used' }, () => {
  const path_ = process.env.PATH;
  process.env.PATH = ''; // no ps to be found
  try { assert.ok(argsOf(process.pid).includes('serve-switch-panels-0771.test.mjs'), argsOf(process.pid)); }
  finally { process.env.PATH = path_; }
  assert.equal(argsOf(2 ** 22 + 1), '', 'nothing for a process that isn\'t running');
});

// A keeper over stood-in runs, as 0758's tests have them: `on` holds the folders whose run is on, and each start is
// recorded, failing when `startOk` is false. `carried` is what a keeper on older code handed over.
function keeper(file, { carried, startOk = true } = {}) {
  const on = new Set(), started = [], said = [];
  const k = runKeeper({
    file, env: {}, say: t => said.push(t), records: () => true, boot: () => 'boot-a', carried, stop: async () => true,
    state: runs => ({ on: on.has(path.dirname(path.dirname(path.dirname(runs)))), pid: 1 }),
    start: async folder => { started.push(folder); if (!startOk) return { why: 'it stopped (exit code 1)' }; on.add(folder); return { pid: 4242 }; },
  });
  return { k, on, started, said };
}
const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
const project = name => { const dir = path.join(tmp('speck-0771-'), name); fs.mkdirSync(runsIn(dir), { recursive: true }); return dir; };
const setSwitch = (dir, on, at) => fs.writeFileSync(path.join(runsIn(dir), 'auto-build.json'), JSON.stringify({ on, at, by: 'test' }));
const settle = () => new Promise(r => setImmediate(r));

test('0771 AC3: the run keeper on the new code carries on from the old one\'s, so a run it started again keeps to at most 3 an hour', async () => {
  const file = path.join(tmp('speck-0771-home-'), 'serve-runs.json'), dir = project('alpha');
  setSwitch(dir, true, '2026-11-20T10:00:00.000Z');
  const old = keeper(file, { startOk: false });
  for (let i = 0; i < 6; i++) { old.k.check([dir]); await settle(); await settle(); }
  assert.equal(old.started.length, 1 + RESTARTS_AN_HOUR, 'the old code started it, then again until the hour\'s limit');
  const carried = JSON.parse(JSON.stringify(old.k.carry())); // as it's sent to the new code
  const next = keeper(file, { startOk: false, carried });
  for (let i = 0; i < 3; i++) { next.k.check([dir]); await settle(); await settle(); }
  assert.deepEqual(next.started, [], 'the new code keeps to the hour\'s limit the old one reached');
  const fresh = keeper(file, { startOk: false });
  fresh.k.check([dir]);
  await settle();
  assert.equal(fresh.started.length, 1, 'whereas a keeper starting afresh would start it again');
});

test('0771 AC3: the run keeper on the new code doesn\'t look at a project afresh that the old one had looked at', async () => {
  const file = path.join(tmp('speck-0771-home-'), 'serve-runs.json'), dir = project('alpha');
  // Its run was on when the old code last looked, and has stopped since, with Auto-build turned off before it started.
  setSwitch(dir, false, '2026-11-20T10:00:00.000Z');
  fs.writeFileSync(file, JSON.stringify({ runs: { [dir]: { since: '2026-11-20T11:00:00.000Z', log: 0 } } }));
  const next = keeper(file, { carried: { looked: [dir], restarts: [], held: [], wasOff: [] } });
  next.k.check([dir]);
  await settle();
  assert.deepEqual(next.started, [], 'left off, as the old code would have left it');
  fs.writeFileSync(file, JSON.stringify({ runs: { [dir]: { since: '2026-11-20T11:00:00.000Z', log: 0 } } }));
  const fresh = keeper(file);
  fresh.k.check([dir]);
  await settle();
  assert.deepEqual(fresh.started, [dir], 'whereas a speck serve starting afresh starts it, as on when it last stopped');
});

test('0771 AC3: the run keeper says it\'s busy while it starts a run, so speck serve doesn\'t switch then', async () => {
  const file = path.join(tmp('speck-0771-home-'), 'serve-runs.json'), dir = project('alpha');
  setSwitch(dir, true, '2026-11-20T10:00:00.000Z');
  let let_go;
  const held = new Promise(r => { let_go = r; });
  const k = runKeeper({ file, env: {}, say: () => {}, records: () => true, boot: () => 'boot-a', stop: async () => true,
    state: () => ({ on: false, pid: null }), start: async () => { await held; return { pid: 4242 }; } });
  assert.equal(k.busy(), false);
  k.check([dir]);
  await settle();
  assert.equal(k.busy(), true, 'while a run is starting');
  let_go();
  await until('the start finished', () => !k.busy(), 2000);
  assert.deepEqual(JSON.parse(JSON.stringify(k.carry())).looked, [dir], 'and what it carries over is plain data');
});
