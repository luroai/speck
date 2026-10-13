import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fakePage, startPanel, stop, freePort, request, post, tokenOf, env as panelEnv, CLI } from './support/panel.mjs';
import { runRepo, startRun, stopRun, until, alive, killAll } from './support/run.mjs';

// ---------- 0128: the panel turns speck run on and off ----------

const lockOf = dir => path.join(dir, 'speck', '.cache', 'runs', 'run.lock');
const apiRun = async port => JSON.parse((await request(port, { pathName: '/api/state' })).body).run;
const ON = '/api/run/on', OFF = '/api/run/off';
// speck run checks for ready tickets every 100 ms, and the fake builder stays up for a minute, so a build is running.
const runEnv = { SPECK_RUN_POLL_MS: '100', FAKE_MS: '60000' };
const lockPid = dir => { try { return Number(fs.readFileSync(lockOf(dir), 'utf8').trim()) || null; } catch { return null; } };

async function panelFor(dir) {
  const p = await startPanel(dir, ['--port', String(await freePort())], CLI, runEnv);
  return { p, port: p.port, token: tokenOf((await request(p.port)).body) };
}
// Stops a speck run that isn't the test's child, and every build the fake builder started.
const cleanUp = (r, ...pids) => killAll([...pids.filter(Boolean), ...r.calls().map(c => c.pid)]);

test('0128 AC1: turning speck run on from the panel starts it for the repo, and the panel then shows it on', async () => {
  const r = runRepo();
  const { p, port, token } = await panelFor(r.dir);
  let pid = null;
  try {
    assert.equal(await apiRun(port), undefined, 'off to begin with');
    const res = await post(port, ON, { token });
    assert.equal(res.status, 200, res.body);
    const body = JSON.parse(res.body);
    pid = body.run.pid;
    assert.equal(body.run.on, true);
    assert.equal(lockPid(r.dir), pid, 'the speck run it started holds the lock');
    assert.deepEqual(await apiRun(port), { on: true, pid });
    // It's a real speck run: it launches the ready ticket.
    assert.ok(await until(() => r.calls().length === 1), 'speck run launched the ready ticket');
    // Its output goes to a file under speck/.cache/runs/, which git ignores.
    assert.match(fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.log'), 'utf8'), /Launched 0001/);
    assert.equal(r.g('status', '--porcelain'), '');
  } finally { await stop(p); cleanUp(r, pid); }
});

test('0128 AC2: a speck run started from the panel keeps running after the page is closed and the panel stops, even with Ctrl+C', async () => {
  const r = runRepo();
  // The panel in a terminal of its own, so Ctrl+C reaches its whole process group, as it does in a real terminal.
  const port = await freePort();
  const child = spawn(process.execPath, [CLI, 'panel', '--port', String(port)], { cwd: r.dir, env: { ...panelEnv, ...runEnv }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', res));
  let pid = null;
  try {
    assert.ok(await until(() => /http:\/\/127\.0\.0\.1:/.test(out)), `the panel started: ${out}`);
    const token = tokenOf((await request(port)).body);
    const res = await post(port, ON, { token });
    assert.equal(res.status, 200, res.body);
    pid = JSON.parse(res.body).run.pid;
    process.kill(-child.pid, 'SIGINT'); // Ctrl+C in the panel's terminal
    await exited;
    assert.ok(await until(async () => { try { await request(port); return false; } catch { return true; } }), 'the panel has stopped');
    await new Promise(res2 => setTimeout(res2, 300));
    assert.ok(alive(pid), 'speck run is still running');
    assert.equal(lockPid(r.dir), pid);
    // A new panel shows it on.
    const again = await panelFor(r.dir);
    try { assert.deepEqual(await apiRun(again.port), { on: true, pid }); } finally { await stop(again.p); }
  } finally { try { process.kill(-child.pid, 'SIGKILL'); } catch {} cleanUp(r, pid); }
});

test('0128 AC3: turning off a speck run started from a terminal stops it as Ctrl+C does, and its builds carry on', async () => {
  const r = runRepo();
  const run = startRun(r.dir, runEnv);
  const { p, port, token } = await panelFor(r.dir);
  try {
    assert.ok(await until(() => r.calls().length === 1), `speck run launched a build: ${run.out()}`);
    const build = r.calls()[0].pid;
    const res = await post(port, OFF, { token });
    assert.equal(res.status, 200, res.body);
    assert.deepEqual(JSON.parse(res.body).run, { on: false, pid: null });
    assert.equal(await run.exited, 0, 'it stopped cleanly');
    assert.match(run.out(), /speck run stopped\. 1 build is still running: 0001\./);
    assert.equal(await apiRun(port), undefined, 'the panel shows it off');
    assert.equal(fs.existsSync(lockOf(r.dir)), false, 'its lock is gone');
    assert.ok(alive(build), 'the build carries on');
  } finally { await stop(p); await stopRun(run); cleanUp(r); }
});

test('0128 AC3: a speck run started from the panel can be turned off from it, and turned on again', async () => {
  const r = runRepo({ tickets: [] });
  const { p, port, token } = await panelFor(r.dir);
  const pids = [];
  try {
    for (let i = 0; i < 2; i++) {
      const on = await post(port, ON, { token });
      assert.equal(on.status, 200, on.body);
      const pid = JSON.parse(on.body).run.pid;
      pids.push(pid);
      const off = await post(port, OFF, { token });
      assert.equal(off.status, 200, off.body);
      assert.equal(alive(pid), false, 'speck run has stopped');
      assert.equal(await apiRun(port), undefined);
    }
    assert.notEqual(pids[0], pids[1]);
    assert.match(fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.log'), 'utf8'), /speck run stopped\./);
  } finally { await stop(p); cleanUp(r, ...pids); }
});

test('0128 AC3: turning speck run off while it is off says so and changes nothing', async () => {
  const r = runRepo({ tickets: [] });
  const { p, port, token } = await panelFor(r.dir);
  try {
    const res = await post(port, OFF, { token });
    assert.equal(res.status, 409);
    assert.match(JSON.parse(res.body).error, /speck run is off/);
    assert.equal(fs.existsSync(lockOf(r.dir)), false);
  } finally { await stop(p); }
});

test('0128 AC3: a lock held by a process that is not speck run is left alone, and that process is not stopped', async () => {
  const r = runRepo({ tickets: [] });
  const other = spawn(process.execPath, ['-e', 'process.on("SIGINT", () => {}); setTimeout(() => {}, 60000)'], { stdio: 'ignore', detached: true });
  fs.mkdirSync(path.dirname(lockOf(r.dir)), { recursive: true });
  fs.writeFileSync(lockOf(r.dir), String(other.pid));
  const { p, port, token } = await panelFor(r.dir);
  try {
    const res = await post(port, OFF, { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, new RegExp(`process ${other.pid}`));
    assert.ok(alive(other.pid));
    assert.equal(lockPid(r.dir), other.pid);
  } finally { await stop(p); killAll([other.pid]); }
});

test('0128 AC4: with no build_command, the panel gets speck run\'s own error and speck run stays off', async () => {
  const r = runRepo({ command: null });
  const { p, port, token } = await panelFor(r.dir);
  try {
    const res = await post(port, ON, { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /^No build_command is set in speck\/config\.yml, so speck run has nothing to start builds with\./);
    assert.equal(await apiRun(port), undefined);
    assert.equal(fs.existsSync(lockOf(r.dir)), false);
    assert.equal(r.g('status', '--porcelain'), '', 'its output file is git-ignored');
  } finally { await stop(p); }
});

test('0128 AC4: off the base branch, or with speck run already on, the panel gets speck run\'s own error', async () => {
  const r = runRepo({ tickets: [] });
  const { p, port, token } = await panelFor(r.dir);
  let pid = null;
  try {
    r.g('checkout', '-qb', 'elsewhere');
    let res = await post(port, ON, { token });
    assert.equal(res.status, 409, res.body);
    assert.equal(JSON.parse(res.body).error, 'This checkout is on "elsewhere", not main. speck run starts builds from main, so switch to it, then run this again.');
    assert.equal(await apiRun(port), undefined);
    r.g('checkout', '-q', 'main');
    res = await post(port, ON, { token });
    assert.equal(res.status, 200, res.body);
    pid = JSON.parse(res.body).run.pid;
    res = await post(port, ON, { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, new RegExp(`^speck run is already running in this repo \\(process ${pid}\\)`));
    assert.deepEqual(await apiRun(port), { on: true, pid }, 'the first one is still on');
  } finally { await stop(p); cleanUp(r, pid); }
});

test('0128 AC5: turning speck run on or off without the token, or from another origin, is refused with 403 and changes nothing', async () => {
  const r = runRepo({ tickets: [] });
  const { p, port, token } = await panelFor(r.dir);
  const run = startRun(r.dir, runEnv);
  try {
    assert.ok(await until(() => lockPid(r.dir) === run.child.pid));
    const bad = [{}, { token: 'nope' }, { token: token.slice(1) + 'é' }, { token, origin: 'http://evil.example' }, { token, origin: null }, { token, origin: `http://127.0.0.1:${port + 1}` }];
    for (const opts of bad) {
      const res = await post(port, OFF, opts);
      assert.equal(res.status, 403, JSON.stringify(opts));
      assert.match(JSON.parse(res.body).error, /^Forbidden/);
    }
    assert.equal(run.child.exitCode, null, 'speck run is still running');
    await stopRun(run);
    for (const opts of bad) assert.equal((await post(port, ON, opts)).status, 403, JSON.stringify(opts));
    await new Promise(res => setTimeout(res, 300));
    assert.equal(fs.existsSync(lockOf(r.dir)), false, 'speck run was not started');
    assert.equal(fs.existsSync(path.join(r.dir, 'speck', '.cache', 'runs', 'run.log')), false);
    // GET does nothing either: only a POST is a write, as with the panel's other writes.
    assert.equal((await request(port, { pathName: ON })).status, 404);
    assert.equal(fs.existsSync(lockOf(r.dir)), false);
  } finally { await stop(p); await stopRun(run); }
});

// ---------- the page ----------

const state = run => ({ tickets: [], ideas: [], resume_command: '', ...(run ? { run } : {}) });
const switchOf = p => p.all(p.byId('run-switch')).find(n => n.tagName === 'button') || null;
const pillText = p => p.byId('run').textContent;

test('0128 AC1: while speck run is off, the page has a button to turn it on, which posts with the token and then shows it on', async () => {
  const p = fakePage([state(null), { ok: true, run: { on: true, pid: 77 } }]);
  await p.settle();
  const b = switchOf(p);
  assert.ok(b, 'a button beside the speck run pill');
  assert.equal(b.textContent, 'Start');
  p.press(b);
  assert.equal(switchOf(p).disabled, true);
  assert.match(switchOf(p).textContent, /Starting…/);
  await p.settle();
  const sent = p.calls.at(-1);
  assert.equal(sent.url, '/api/run/on');
  assert.equal(sent.opts.method, 'POST');
  assert.equal(sent.opts.headers['X-Speck-Token'], '{{token}}');
  assert.equal(pillText(p), 'Auto-build on');
  assert.equal(switchOf(p).textContent, 'Pause');
  assert.equal(switchOf(p).disabled, false);
});

test('0128 AC3: while speck run is on, the page has a button to turn it off, which then shows it off', async () => {
  const p = fakePage([state({ on: true, pid: 77 }), { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  assert.equal(switchOf(p).textContent, 'Pause');
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(pillText(p), 'Auto-build offready tickets wait');
  assert.equal(switchOf(p).textContent, 'Start');
});

test('0128 AC4: a refusal shows speck run\'s own message and leaves it off, until the next click', async () => {
  const msg = 'No build_command is set in speck/config.yml, so speck run has nothing to start builds with.';
  const p = fakePage([state(null), { status: 409, body: { error: msg } }, state(null), new Error('down'), { ok: true, run: { on: true, pid: 9 } }]);
  await p.settle();
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.byId('run-error').hidden, false);
  assert.equal(p.byId('run-error').textContent, msg);
  assert.equal(pillText(p), 'Auto-build offready tickets wait');
  assert.equal(switchOf(p).textContent, 'Start');
  // A poll keeps the message.
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('run-error').textContent, msg);
  // The next click replaces it, and one that works clears it.
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.byId('run-error').textContent, "Couldn't reach the panel server, so speck run wasn't turned on.");
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.byId('run-error').hidden, true);
  assert.equal(pillText(p), 'Auto-build on');
});

test('0128 AC1: the button sits in the header beside the speck run pill', async () => {
  const p = fakePage([state(null)]);
  await p.settle();
  const html = fs.readFileSync(new URL('../templates/panel.html', import.meta.url), 'utf8');
  const header = html.match(/<header>([\s\S]*?)<\/header>/)[1];
  assert.ok(header.indexOf('id="run"') < header.indexOf('id="run-switch"') && header.indexOf('id="run-switch"') < header.indexOf('id="pills"'));
  assert.match(html, /<div class="run-error" id="run-error" hidden><\/div>/, 'no message until something is refused');
  assert.equal(p.byId('run-error').textContent, '');
});
