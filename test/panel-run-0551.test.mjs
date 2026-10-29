import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { panelRunOn, panelRunState, stopStarted } from '../scripts/panel-run.mjs';
import { startBackground } from '../scripts/run-background.mjs';
import { runRepo, alive, killAll } from './support/run.mjs';

// ---------- 0551: a speck run the panel's switch started that didn't say it was watching in time is stopped ----------

const LOG = path.join('speck', '.cache', 'runs', 'run.log');
// Every live process in the process group `pgid` leads.
const group = pgid => spawnSync('ps', ['-eo', 'pid=,pgid='], { encoding: 'utf8' }).stdout.split('\n')
  .map(l => l.trim().split(/\s+/).map(Number)).filter(([, g]) => g === pgid).map(([p]) => p).filter(alive);

test('0551 AC1 AC2: on a time-out, the speck run it started and its process group are stopped before it answers, and it shows off', async () => {
  const r = runRepo({ tickets: [] });
  let pid = null;
  try {
    const res = await panelRunOn(r.dir, { ms: 1 });
    pid = res.body.pid;
    // Checked once, on purpose: panelRunOn waits for it to go, so it must have gone when it answers.
    const goneWhenItAnswered = !alive(pid) && group(pid).length === 0;
    assert.equal(res.status, 500);
    assert.ok(goneWhenItAnswered, 'speck run and its process group stopped before the answer');
    assert.equal(panelRunState(r.dir).on, false, 'the switch shows speck run off');
    assert.equal(res.body.error, `speck run (process ${pid}) started but didn't take its lock and say it's watching within 0.001 seconds, so it was stopped. Its output is in ${LOG}.`);
  } finally { if (pid) killAll([-pid, pid]); }
});

test('0551 AC3: if it\'s still there after SIGTERM and SIGKILL, the error names its process and says to stop it yourself', async () => {
  const r = runRepo({ tickets: [] });
  let pid = null, asked = null;
  try {
    const stop = async p => { asked = p; throw new Error('still there'); };
    const res = await panelRunOn(r.dir, { ms: 1, stop });
    pid = res.body.pid;
    assert.equal(asked, pid, 'it was asked to stop the speck run it started');
    assert.equal(res.status, 500);
    assert.match(res.body.error, new RegExp(`^speck run \\(process ${pid}\\) started but didn't take its lock and say it's watching within 0\\.001 seconds, and didn't stop when it was sent SIGTERM and then SIGKILL\\. Stop process ${pid} yourself\\. Its output is in ${LOG.replace(/\./g, '\\.')}\\.$`));
  } finally { if (pid) killAll([-pid, pid]); }
});

test('0551 AC4: speck run --background still stops one that didn\'t say it was watching in time, and fails with the time-out\'s message', async () => {
  const r = runRepo({ tickets: [] });
  await assert.rejects(startBackground(r.dir, { ms: 1 }), e => {
    assert.equal(e.code, 1);
    assert.match(e.message, /^speck run \(process (\d+)\) started but didn't take its lock and say it's watching within 0\.001 seconds, so it was stopped\./);
    const pid = Number(e.message.match(/process (\d+)/)[1]);
    const goneWhenItFailed = !alive(pid);
    assert.ok(goneWhenItFailed, 'stopped before the command fails');
    return true;
  });
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.lock')) && alive(Number(fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.lock'), 'utf8'))), false, 'no live speck run holds the lock');
});

test('0551 AC1 (round 1 F1): a process in its group that ignores SIGTERM is killed too, and stopping waits until it has gone', async () => {
  // A leader that leaves on SIGTERM, with a child in its process group that ignores it.
  // The leader says the child's pid only once the child is ignoring SIGTERM.
  const kid = "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000);";
  const lead = `const c = require('child_process').spawn(process.execPath, ['-e', ${JSON.stringify(kid)}], { stdio: ['ignore', 'pipe', 'ignore'] }); c.stdout.once('data', () => console.log(c.pid)); setInterval(() => {}, 1000);`;
  const p = spawn(process.execPath, ['-e', lead], { detached: true, stdio: ['ignore', 'pipe', 'ignore'] });
  let child = null;
  try {
    child = Number(await new Promise(res => p.stdout.setEncoding('utf8').once('data', res)));
    assert.ok(alive(child));
    await stopStarted(p.pid, 300);
    const goneWhenItResolved = !alive(p.pid) && !alive(child); // once: stopStarted waits for all of it to go
    assert.ok(goneWhenItResolved, 'the leader and the child that ignored SIGTERM have both gone');
  } finally { killAll([-p.pid, p.pid, child].filter(Boolean)); }
});
