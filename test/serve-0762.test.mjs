// 0762: a real speck serve over projects whose own speck is the stand-in (support/stand-in-panel.mjs): a project turned
// off has the panel speck serve started for it stopped, and neither its panel nor its speck run started again, while
// ones started by hand keep running; turned on again, its panel and its run start and it's shown again.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { speck } from './support/cli.mjs';
import { machine, standInProject, addProject, startServe, until, portOf, getJson, pidAlive, panelByHand, endServe } from './support/serve.mjs';
import { ask } from './support/serve-front.mjs';
import { runsIn, writeAutoBuild } from '../scripts/serve-runs.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const lockOf = dir => { try { return Number(fs.readFileSync(path.join(runsIn(dir), 'run.lock'), 'utf8').trim()) || null; } catch { return null; } };
const turn = (m, verb, dir) => { const r = speck(os.tmpdir(), m.env, 'projects', verb, dir); assert.equal(r.status, 0, r.stderr); };
const frontOf = out => Number((out.match(/All projects: http:\/\/127\.0\.0\.1:(\d+)\//) || [])[1]) || null;
const shownAt = async port => JSON.parse((await ask(port, { method: 'POST', pathName: '/api/projects/summary', origin: `http://127.0.0.1:${port}` })).body).projects.map(p => p.name);

test('0762 AC2, AC3, AC4: a project turned off is stopped and left out by speck serve, hand-started ones keep running, and turned on it comes back', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  fs.copyFileSync(path.join(import.meta.dirname, '..', 'scripts', 'serve-runs.mjs'), path.join(a, '.speck', 'scripts', 'serve-runs.mjs')); // a speck that records its switch
  writeAutoBuild(runsIn(a), true, 'test');
  // bravo's panel and speck run, started by hand.
  const hand = await panelByHand(m, b);
  const handRun = spawn(process.execPath, [path.join(b, '.speck', 'scripts', 'speck.mjs'), 'run'], { cwd: b, env: m.env, stdio: 'ignore' });
  await until('bravo\'s run started by hand', () => lockOf(b) === handRun.pid);
  const s = startServe(m);
  let runPid = null;
  try {
    const front = await until('the address printed', () => frontOf(s.out()));
    const port = await until('alpha\'s panel started', () => portOf(s.out(), 'alpha'));
    runPid = await until('alpha\'s run started', () => lockOf(a));
    assert.deepEqual(await shownAt(front), ['alpha', 'bravo']);

    // Turned off: the panel speck serve started is stopped within 10 seconds, and it's left out of All projects.
    turn(m, 'off', a); turn(m, 'off', b);
    const off = Date.now();
    await until('alpha\'s panel stopping', async () => (await getJson(port, '/api/panel'))?.repo !== a, 10000);
    assert.ok(Date.now() - off <= 10000);
    await until('speck serve saying so', () => /alpha was turned off, so the panel speck serve started for it was stopped/.test(s.out()), 3000);
    await until('both left out of All projects', async () => (await shownAt(front)).length === 0, 3000);

    // Its run, stopped now, isn't started again while it's off, though its switch is on.
    process.kill(runPid, 'SIGTERM');
    await until('alpha\'s run stopping', () => !pidAlive(runPid) && lockOf(a) === null);
    await sleep(4500); // two of speck serve's looks at the list
    assert.equal(lockOf(a), null, 'alpha\'s run not started again');
    assert.equal((await getJson(port, '/api/panel'))?.repo === a, false, 'nor its panel');
    assert.doesNotMatch(s.out().slice(s.out().indexOf('alpha was turned off')), /alpha: http:/, 'no panel started for alpha');
    // bravo's, started by hand, are left running.
    assert.equal(hand.child.exitCode, null, 'bravo\'s panel started by hand still running');
    assert.equal((await getJson(hand.port, '/api/panel'))?.repo, b);
    assert.ok(pidAlive(handRun.pid) && lockOf(b) === handRun.pid, 'bravo\'s run started by hand still running');

    // Turned on again: within 10 seconds its panel and its run start, and it's shown again.
    turn(m, 'on', a);
    const on = Date.now();
    const again = await until('alpha\'s panel started again', async () => { const p = portOf(s.out().slice(s.out().indexOf('alpha was turned off')), 'alpha'); return p && (await getJson(p, '/api/panel'))?.repo === a && p; }, 10000);
    runPid = await until('alpha\'s run started again', () => { const p = lockOf(a); return p && pidAlive(p) && p; }, 10000);
    await until('alpha shown again', async () => (await shownAt(front)).includes('alpha'), 10000);
    assert.ok(Date.now() - on <= 10000, 'all within 10 seconds');
    assert.ok(again > 0);
    assert.deepEqual(await shownAt(front), ['alpha'], 'bravo, still off, still left out');
  } finally {
    await endServe(s);
    for (const pid of [runPid, handRun.pid]) if (pid && pidAlive(pid)) process.kill(pid, 'SIGTERM');
    hand.child.kill();
  }
});
