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
// ORPHAN: a step that starts a writer in a session of its own and exits at once, so the writer leaves the build's tree.
if (process.env.ORPHAN) spawn(process.execPath, ['-e', \`require('child_process').spawn(process.execPath, [\${JSON.stringify(helper)}, \${JSON.stringify(out)}, 'orphan'], { detached: true, stdio: 'ignore' }).unref()\`], { detached: true, stdio: 'ignore' }).unref();
// SELF_PAUSE: the build pauses itself with speck, and saves that speck pause's pid in <out>/self.pid.
if (process.env.SELF_PAUSE) setTimeout(() => {
  const c = spawn(process.execPath, [process.env.SELF_PAUSE, 'pause', id], { stdio: 'ignore' });
  fs.writeFileSync(path.join(out, 'self.pid'), String(c.pid));
}, 300);
// EXIT_ON_CONT: the build finishes the moment it's played, with exit code 3.
if (process.env.EXIT_ON_CONT) process.on('SIGCONT', () => process.exit(3));
let n = 0;
setInterval(() => { console.log('tick ' + n++); if (fs.existsSync(path.join(out, 'stop'))) process.exit(0); }, 20);
`;
const HELPER = `
const fs = require('fs'), path = require('path');
const [out, name = 'helper'] = process.argv.slice(2);
fs.writeFileSync(path.join(out, name + '.pid'), String(process.pid));
setInterval(() => { fs.appendFileSync(path.join(out, name + '.txt'), 'h\\n'); if (fs.existsSync(path.join(out, 'stop'))) process.exit(0); }, 20);
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
  const orphan = () => { try { return Number(fs.readFileSync(path.join(out, 'orphan.pid'), 'utf8')); } catch { return null; } };
  const finish = () => fs.writeFileSync(path.join(out, 'stop'), '');
  return { ...r, out, build, helper, orphan, finish, orphanFile: path.join(out, 'orphan.txt'), helperFile: path.join(out, 'helper.txt'), log: id => runsPath(r.dir, `${id}.log`) };
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
  const pids = [t.build('0001')?.pid, t.helper(), t.orphan()].filter(Boolean);
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
    const recPaused = fs.readFileSync(runsPath(t.dir, '0001.json'), 'utf8');
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
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, false, 'no longer marked paused');
    assert.equal(fs.readFileSync(runsPath(t.dir, '0001.json'), 'utf8'), recPaused, 'play leaves the run record to speck run');
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
  const mark = (id, o) => fs.writeFileSync(runsPath(t.dir, `${id}.paused`), JSON.stringify({ session: 's', paused: '2026-10-09T10:00:00.000Z', ...o }));
  fs.writeFileSync(runsPath(t.dir, '0002.json'), JSON.stringify({ id: '0002', session: 's', cwd: t.dir, pid: dead }));
  mark('0002', { pid: dead }); // its build has gone
  fs.writeFileSync(runsPath(t.dir, '0003.json'), JSON.stringify({ id: '0003', session: 's', cwd: t.dir, pid: process.pid, exited: '2026-10-09T11:00:00.000Z', exit_code: null }));
  mark('0003', { pid: process.pid }); // its build has exited
  fs.writeFileSync(runsPath(t.dir, '0001.json'), JSON.stringify({ id: '0001', session: 'new', cwd: t.dir, pid: process.pid }));
  mark('0001', { pid: process.pid }); // left by an earlier build of the ticket, in another session
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
    const files = () => Object.fromEntries(fs.readdirSync(runsPath(t.dir, '')).filter(f => !f.endsWith('.log')).map(f => [f, fs.readFileSync(runsPath(t.dir, f), 'utf8')]));
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

test('0070 AC1 (round 1 F1): a process the build started whose parent has exited is paused and played with it', async () => {
  const t = tickerRepo();
  const run = await launched(t, { ORPHAN: '1' });
  try {
    assert.ok(await until(() => t.orphan() && size(t.orphanFile) > 0), 'the orphaned writer is working');
    const rows = spawnSync('ps', ['-A', '-o', 'pid=,ppid=,pgid='], { encoding: 'utf8' }).stdout.trim().split('\n').map(l => l.trim().split(/\s+/).map(Number));
    const [, ppid, pgid] = rows.find(([p]) => p === t.orphan());
    const build = t.build('0001').pid;
    assert.ok(ppid !== build && pgid !== build, 'it is outside the build\'s tree and process group');
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    await wait(100);
    const n = size(t.orphanFile);
    await wait(400);
    assert.equal(size(t.orphanFile), n, 'it stops writing');
    assert.ok(state(t.orphan()).startsWith('T'));
    assert.equal(speck(t.dir, 'play', '0001').status, 0);
    assert.ok(await until(() => size(t.orphanFile) > n, 3000), 'it writes again once played');
  } finally { await cleanup(t, run)(); }
});

// A ps that works for its first FAKE_PS_OK runs (counted in FAKE_PS_COUNT), then fails.
function failingPs() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-ps-'));
  const real = spawnSync('sh', ['-c', 'command -v ps'], { encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(path.join(bin, 'ps'), `#!/bin/sh\nn=$(cat "$FAKE_PS_COUNT" 2>/dev/null || echo 0)\necho $((n + 1)) > "$FAKE_PS_COUNT"\nif [ "$n" -lt "$FAKE_PS_OK" ]; then exec ${real} "$@"; fi\necho "ps: broken" >&2\nexit 1\n`, { mode: 0o755 });
  return ok => ({ ...env, PATH: `${bin}${path.delimiter}${env.PATH}`, FAKE_PS_OK: String(ok), FAKE_PS_COUNT: path.join(bin, `count-${Math.random()}`) });
}
const speckWith = (dir, e, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: e });

test('0070 AC4 (round 1 F2): a pause that fails part way leaves the build running and unmarked', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  const ps = failingPs();
  try {
    for (const ok of [0, 1, 2]) { // fails checking the build, listing its processes, or going round again after stopping them
      const before = fs.readFileSync(runsPath(t.dir, '0001.json'), 'utf8');
      const r = speckWith(t.dir, ps(ok), 'pause', '0001');
      assert.notEqual(r.status, 0, `ps failing after ${ok} runs`);
      assert.match(r.stderr, /ps/);
      assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/, 'no stack trace');
      assert.equal(fs.readFileSync(runsPath(t.dir, '0001.json'), 'utf8'), before, 'its run record is unchanged');
      assert.ok(!fs.existsSync(runsPath(t.dir, '0001.paused')), 'not marked paused');
      assert.ok(await growing(t, '0001'), `still running (ps failing after ${ok} runs)`);
    }
  } finally { await cleanup(t, run)(); }
});

test('0070 AC4 (round 1 F2): a play that fails stays marked paused, never says it is playing, and can be run again', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  const ps = failingPs();
  try {
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    for (const ok of [0, 1]) { // fails checking the build, or listing its processes
      const r = speckWith(t.dir, ps(ok), 'play', '0001');
      assert.notEqual(r.status, 0);
      assert.doesNotMatch(r.stdout, /playing/i);
      assert.match(r.stderr, /ps/);
      assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, true, 'still marked paused');
      assert.ok(await still(t, '0001'), 'still paused');
    }
    const r = speck(t.dir, 'play', '0001');
    assert.equal(r.status, 0, r.stderr);
    assert.ok(await growing(t, '0001'), 'played on the retry');
  } finally { await cleanup(t, run)(); }
});

test('0070 AC2 (round 2 F3): a build that finishes as soon as it is played keeps the exit speck run records for it', async () => {
  const t = tickerRepo();
  const run = await launched(t, { EXIT_ON_CONT: '1' });
  try {
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    assert.ok(await still(t, '0001'));
    assert.equal(speck(t.dir, 'play', '0001').status, 0);
    assert.ok(await until(() => /0001 build exited with code 3/.test(run.out())), run.out());
    await wait(200);
    const rec = record(t.dir, '0001');
    assert.equal(rec.exit_code, 3, 'its exit is kept');
    assert.ok(rec.exited);
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, false);
  } finally { await cleanup(t, run)(); }
});
