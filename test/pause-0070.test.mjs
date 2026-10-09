import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, alive, killAll, stopRun, record } from './support/run.mjs';

// ---------- 0070: pause a running build from the CLI until it's played ----------

const wait = ms => new Promise(res => setTimeout(res, ms));
const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const speck = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
const size = f => { try { return fs.statSync(f).size; } catch { return -1; } };
const json = dir => JSON.parse(speck(dir, 'status', '--json').stdout);
// A process's state letter from ps: T while it's stopped.
const state = pid => spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();

// A build that keeps working: it writes a line to its log every 20ms, and starts a helper in a session and process
// group of its own (as Claude Code does for each Bash command) that adds a line to <out>/helper.txt every 20ms and
// saves its pid in <out>/helper.pid. It stops when <out>/stop exists.
const TICKER = `
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const [helper, out, id, session] = process.argv.slice(2);
fs.writeFileSync(path.join(out, id + '.build.json'), JSON.stringify({ pid: process.pid, session, cwd: process.cwd() }));
spawn(process.execPath, [helper, out], { detached: true, stdio: 'ignore' }).unref();
// SELF_PAUSE: the build pauses itself with speck, and saves that speck pause's pid in <out>/self.pid.
if (process.env.SELF_PAUSE) setTimeout(() => {
  const c = spawn(process.execPath, [process.env.SELF_PAUSE, 'pause', id], { stdio: 'ignore' });
  fs.writeFileSync(path.join(out, 'self.pid'), String(c.pid));
}, 300);
let n = 0;
setInterval(() => { console.log('tick ' + n++); if (fs.existsSync(path.join(out, 'stop'))) process.exit(0); }, 20);
`;
const HELPER = `
const fs = require('fs'), path = require('path');
const out = process.argv[2];
fs.writeFileSync(path.join(out, 'helper.pid'), String(process.pid));
setInterval(() => { fs.appendFileSync(path.join(out, 'helper.txt'), 'h\\n'); if (fs.existsSync(path.join(out, 'stop'))) process.exit(0); }, 20);
`;

function tickerRepo(opts = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-out-'));
  const ticker = path.join(bin, 'ticker.cjs');
  const helperJs = path.join(bin, 'helper.cjs');
  fs.writeFileSync(ticker, TICKER);
  fs.writeFileSync(helperJs, HELPER);
  const r = runRepo({ ...opts, command: `"${process.execPath}" "${ticker}" "${helperJs}" "${out}" {id} {session}` });
  const build = id => { try { return JSON.parse(fs.readFileSync(path.join(out, `${id}.build.json`), 'utf8')); } catch { return null; } };
  const helper = () => { try { return Number(fs.readFileSync(path.join(out, 'helper.pid'), 'utf8')); } catch { return null; } };
  const finish = () => fs.writeFileSync(path.join(out, 'stop'), '');
  return { ...r, out, build, helper, finish, helperFile: path.join(out, 'helper.txt'), log: id => runsPath(r.dir, `${id}.log`) };
}

// Launches 0001 with speck run and waits until the build and its helper are both working.
async function launched(t, extraEnv) {
  const run = startRun(t.dir, extraEnv);
  assert.ok(await until(() => t.build('0001') && t.helper() && size(t.helperFile) > 0 && size(t.log('0001')) > 0), run.out());
  return run;
}

// True if neither the build's log nor the helper's file grows over `ms`.
async function still(t, id, ms = 400) {
  await wait(100); // anything already on its way lands first
  const a = [size(t.log(id)), size(t.helperFile)];
  await wait(ms);
  return size(t.log(id)) === a[0] && size(t.helperFile) === a[1];
}
async function growing(t, id) {
  const a = [size(t.log(id)), size(t.helperFile)];
  return until(() => size(t.log(id)) > a[0] && size(t.helperFile) > a[1], 3000);
}

const cleanup = (t, run) => async () => {
  const pids = [t.build('0001')?.pid, t.helper()].filter(Boolean);
  for (const p of pids) try { process.kill(p, 'SIGCONT'); } catch {}
  t.finish();
  if (run) await stopRun(run);
  killAll(pids);
};

test('0070 AC1: pause stops the build and the processes it started, says so, and leaves the ticket as it is', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  try {
    const ticket = fs.readFileSync(path.join(t.dir, 'speck', 'tickets', '0001-t.md'), 'utf8');
    const head = t.g('rev-parse', 'HEAD');
    const r = speck(t.dir, 'pause', '0001');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /0001[^\n]*paused/i);
    assert.ok(await still(t, '0001'), 'its log and its helper stop growing');
    assert.ok(state(t.build('0001').pid).startsWith('T'), 'the build is stopped');
    assert.ok(state(t.helper()).startsWith('T'), 'a process it started in its own process group is stopped too');
    assert.equal(fs.readFileSync(path.join(t.dir, 'speck', 'tickets', '0001-t.md'), 'utf8'), ticket, 'the ticket is unchanged');
    assert.equal(t.g('rev-parse', 'HEAD'), head, 'no commits');
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').status, 'ready', 'the status is unchanged');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC2: play carries the same build on, in the same session and folder, with its output going on into the same log', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  try {
    const before = t.build('0001');
    const rec = record(t.dir, '0001');
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    assert.ok(await still(t, '0001'));
    const logBefore = fs.readFileSync(t.log('0001'), 'utf8');
    const r = speck(t.dir, 'play', '0001');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /0001[^\n]*playing/i);
    assert.ok(await growing(t, '0001'), 'its log and its helper grow again');
    assert.ok(alive(before.pid), 'the same process carries on');
    assert.ok(!state(before.pid).startsWith('T') && !state(t.helper()).startsWith('T'), 'nothing is left stopped');
    assert.ok(fs.readFileSync(t.log('0001'), 'utf8').startsWith(logBefore), 'the log is added to, not started again');
    assert.equal(t.calls().length, 0, 'no other build was started');
    const after = record(t.dir, '0001');
    assert.equal(after.session, rec.session, 'the same session');
    assert.equal(after.pid, before.pid);
    assert.equal(after.cwd, rec.cwd, 'the same folder');
    assert.ok(!after.paused, 'no longer marked paused');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC3: while paused, speck run does not report the build stopped or relaunch it, and it holds its slot; status --json gives paused', async () => {
  const t = tickerRepo({ tickets: [['0001', {}], ['0002', {}]], max: 1 });
  const run = await launched(t);
  try {
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    await wait(800); // several polls
    assert.equal(t.build('0002'), null, '0002 waits for the one slot');
    assert.doesNotMatch(run.out(), /0001[^\n]*(stopped|exited)/i, run.out());
    assert.equal((run.out().match(/Launched 0001/g) || []).length, 1, 'not launched again');
    const s = json(t.dir).tickets;
    assert.equal(s.find(x => x.id === '0001').paused, true);
    assert.equal(s.find(x => x.id === '0002').paused, false);
    assert.equal(speck(t.dir, 'play', '0001').status, 0);
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, false, 'false again once it is played');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC3: every ticket without a paused build gets paused false, including one whose paused build has gone', () => {
  const t = tickerRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}]] });
  fs.mkdirSync(runsPath(t.dir, ''), { recursive: true });
  const dead = spawnSync(process.execPath, ['-e', '0']).pid;
  fs.writeFileSync(runsPath(t.dir, '0002.json'), JSON.stringify({ id: '0002', session: 's', cwd: t.dir, pid: dead, paused: '2026-10-09T10:00:00.000Z' }));
  fs.writeFileSync(runsPath(t.dir, '0003.json'), JSON.stringify({ id: '0003', session: 's', cwd: t.dir, pid: process.pid, paused: '2026-10-09T10:00:00.000Z', exited: '2026-10-09T11:00:00.000Z', exit_code: null }));
  for (const x of json(t.dir).tickets) assert.equal(x.paused, false, x.id);
});

test('0070 AC4: pause and play refuse plainly, exit non-zero and change nothing', async () => {
  const t = tickerRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}], ['0004', {}]] });
  const run = await launched(t);
  try {
    fs.mkdirSync(runsPath(t.dir, ''), { recursive: true });
    const dead = spawnSync(process.execPath, ['-e', '0']).pid;
    fs.writeFileSync(runsPath(t.dir, '0003.json'), JSON.stringify({ id: '0003', session: 's', cwd: t.dir, pid: dead }));
    fs.writeFileSync(runsPath(t.dir, '0004.json'), JSON.stringify({ id: '0004', session: 's', cwd: t.dir, pid: t.build('0001').pid, exited: '2026-10-09T11:00:00.000Z', exit_code: 0 }));
    const files = () => Object.fromEntries(fs.readdirSync(runsPath(t.dir, '')).filter(f => f.endsWith('.json')).map(f => [f, fs.readFileSync(runsPath(t.dir, f), 'utf8')]));
    const refused = (args, re) => {
      const before = files();
      const r = speck(t.dir, ...args);
      assert.notEqual(r.status, 0, `${args.join(' ')} should be refused`);
      assert.match(r.stderr, re, args.join(' '));
      assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/, 'no stack trace');
      assert.deepEqual(files(), before, `${args.join(' ')} changes nothing`);
    };
    refused(['pause'], /usage/i);
    refused(['play'], /usage/i);
    refused(['pause', '0099'], /0099[^\n]*not found/i);
    refused(['play', '0099'], /0099[^\n]*not found/i);
    refused(['pause', '0002'], /0002[^\n]*no running build/i); // no run record
    refused(['pause', '0003'], /0003[^\n]*no running build/i); // its process has gone
    refused(['pause', '0004'], /0004[^\n]*no running build/i); // it has exited
    refused(['play', '0001'], /0001[^\n]*isn't paused/i);
    refused(['play', '0002'], /0002[^\n]*isn't paused/i);
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    refused(['pause', '0001'], /0001[^\n]*already paused/i);
    assert.ok(await still(t, '0001'), 'still paused after the refusals');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC5: a paused build stays paused when speck run is stopped and started again, and can then be played', async () => {
  const t = tickerRepo();
  let run = await launched(t);
  try {
    const pid = t.build('0001').pid;
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    await stopRun(run);
    assert.ok(alive(pid), 'stopping speck run leaves it alive');
    assert.ok(await still(t, '0001'), 'and paused');
    run = startRun(t.dir);
    assert.ok(await until(() => /0001[^\n]*already being built/i.test(run.out())), run.out());
    assert.ok(await still(t, '0001'), 'starting speck run again does not play it');
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, true);
    assert.equal(speck(t.dir, 'play', '0001').status, 0);
    assert.ok(await growing(t, '0001'), 'it carries on');
    t.finish();
    assert.ok(await until(() => /0001[^\n]*stopped/i.test(run.out())), 'the restarted speck run sees it finish');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC1 (self-check): a build that pauses itself is paused, and the pause it ran still finishes', async () => {
  const t = tickerRepo();
  const run = await launched(t, { SELF_PAUSE: CLI });
  try {
    const self = path.join(t.out, 'self.pid');
    assert.ok(await until(() => fs.existsSync(self)));
    const pid = Number(fs.readFileSync(self, 'utf8'));
    // Its parent, the build, is paused, so a finished speck pause stays a zombie (Z) until the build is played.
    assert.ok(await until(() => /^Z/.test(state(pid)) || !alive(pid), 5000), `speck pause, run inside the build, finished (${state(pid)})`);
    assert.ok(await still(t, '0001'), 'and the build is paused');
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, true);
  } finally { await cleanup(t, run)(); }
});
