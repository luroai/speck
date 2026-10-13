// 0153: speck ship leaves a record of a ship in progress, and of an auto-ship that ended without shipping, for the panel.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { CLI, env, gIn, runIn, shipRepo } from './support/ship.mjs';
import { freePort, startPanel, stop, request, post, tokenOf } from './support/panel.mjs';

// A test command that waits until `gate` exists, so a ship stays running until the test lets it go.
const gated = () => {
  const gate = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-gate-')), 'go');
  return { gate, test: `sh -c 'while [ ! -f ${gate} ]; do sleep 0.05; done'` };
};
// Sets `key: value` in speck/config.yml on both branches and commits it, so both checkouts stay clean.
const configure = (r, key, value) => {
  for (const dir of [r.dir, r.wt]) {
    const cfg = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(new RegExp(`^${key}: .*$`, 'm'), `${key}: ${value}`));
  }
  r.g('commit', '-qam', key);
  if (r.wt !== r.dir) gIn(r.wt, 'commit', '-qam', key);
};
const autoOn = r => configure(r, 'auto_ship', 'true');
// `speck ship` in its own process, as a build, the panel or /speck-ship starts it. Each one, and the test command it
// started, is killed after its test, so a failing test can't leave one waiting on its gate.
const started = [];
afterEach(() => { for (const c of started.splice(0)) killGroup(c); });
const shipping = (cwd, ...a) => {
  const child = spawn(process.execPath, [CLI, 'ship', '1', ...a], { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { err += d; });
  started.push(child);
  const exited = new Promise(resolve => child.on('close', code => resolve({ code, out, err })));
  return { child, exited };
};
const until = async (cond, what, ms = 15000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await cond();
    if (v) return v;
    if (Date.now() > end) assert.fail(`timed out waiting for ${what}`);
    await new Promise(r => setTimeout(r, 50));
  }
};
const statusOf = (cwd, id = '0001') => {
  const r = runIn(cwd, 'status', '--json');
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout).tickets.find(t => t.id === id);
};
const shipOf = (cwd, id) => statusOf(cwd, id).ship;
const running = cwd => { const s = shipOf(cwd); return s && s.running === true ? s : null; };
// Kills a ship and the test command it started.
const killGroup = child => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } };

test('0153 AC1: while speck ship runs, speck status --json shows it shipping with when it started, from the main checkout and the worktree', async () => {
  const { gate, test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  assert.equal(shipOf(r.dir), null, 'nothing before');
  const before = Date.now();
  const s = shipping(r.dir);
  try {
    const rec = await until(() => running(r.dir), 'the ship to show as running');
    assert.equal(typeof rec.started, 'string');
    const started = Date.parse(rec.started);
    assert.ok(started >= before - 1000 && started <= Date.now(), `started is now-ish: ${rec.started}`);
    assert.deepEqual(running(r.wt), rec, 'the same from the ticket\'s worktree');
    // A later read, as a reload of the page makes, shows the same ship with the same start.
    await new Promise(res => setTimeout(res, 200));
    assert.equal(running(r.dir).started, rec.started);
  } finally { fs.writeFileSync(gate, ''); }
  const out = await s.exited;
  assert.equal(out.code, 0, out.err);
  assert.equal(r.statusIn(r.dir), 'done');
  assert.equal(shipOf(r.dir), null, 'no record once it has shipped');
});

test('0153 AC1: a build\'s auto-ship shows as shipping too', async () => {
  const { gate, test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  autoOn(r);
  const s = shipping(r.wt, '--auto');
  try {
    const rec = await until(() => running(r.dir), 'the auto-ship to show as running');
    assert.equal(rec.auto, true);
  } finally { fs.writeFileSync(gate, ''); }
  const out = await s.exited;
  assert.equal(out.code, 0, out.err);
  assert.equal(shipOf(r.dir), null);
});

test('0153 AC1 AC2: the panel\'s Ship button shows as shipping in /api/state, and a second Ship is refused while it runs', async () => {
  const { gate, test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const first = post(p.port, '/api/tickets/1/ship', { token });
    const state = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).tickets.find(t => t.id === '0001');
    try {
      const t = await until(async () => { const x = await state(); return x.ship && x.ship.running ? x : null; }, 'the panel to show the ship');
      assert.equal(t.status, 'approved');
      // Another ship from a terminal refuses while the panel's runs.
      const again = runIn(r.dir, 'ship', '1');
      assert.notEqual(again.status, 0);
      assert.match(again.stderr, /already running/i);
    } finally { fs.writeFileSync(gate, ''); }
    const res = await first;
    assert.equal(res.status, 200, res.body);
    assert.equal((await state()).ship, null);
  } finally { await stop(p); }
});

test('0153 AC2: a second speck ship for the same ticket refuses, saying a ship is already running, and changes nothing', async () => {
  const { gate, test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  autoOn(r); // so the --auto ship below gets as far as the record
  const s = shipping(r.dir);
  try {
    const rec = await until(() => running(r.dir), 'the first ship to start');
    const snap = r.snapshot();
    for (const [cwd, args] of [[r.dir, []], [r.wt, []], [r.dir, ['--auto']]]) {
      const again = runIn(cwd, 'ship', '1', ...args);
      assert.notEqual(again.status, 0, again.stdout);
      assert.match(again.stderr, /A ship is already running for ticket 0001/);
      assert.doesNotMatch(again.stderr, /^\s+at /m, 'no stack trace');
      assert.deepEqual(r.snapshot(), snap, 'nothing changed');
      assert.deepEqual(running(r.dir), rec, 'the first ship\'s record is untouched');
    }
  } finally { fs.writeFileSync(gate, ''); }
  const out = await s.exited;
  assert.equal(out.code, 0, out.err);
  assert.equal(r.statusIn(r.dir), 'done', 'the first ship still shipped');
});

test('0153 AC2: a ship that was killed doesn\'t stop the next one', async () => {
  const { gate, test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  const s = shipping(r.dir);
  await until(() => running(r.dir), 'the ship to start');
  killGroup(s.child);
  await s.exited;
  fs.writeFileSync(gate, '');
  const again = runIn(r.dir, 'ship', '1');
  assert.equal(again.status, 0, again.stderr);
  assert.equal(r.statusIn(r.dir), 'done');
});

test('0153 AC3: an auto-ship that fails leaves speck ship\'s own message for the panel', () => {
  const r = shipRepo({ test: 'false' });
  autoOn(r);
  const res = runIn(r.wt, 'ship', '1', '--auto');
  assert.notEqual(res.status, 0);
  const rec = shipOf(r.dir);
  assert.ok(rec, 'a record');
  assert.equal(rec.running, false);
  assert.equal(rec.auto, true);
  assert.equal(rec.message, res.stderr.trim(), 'speck ship\'s own message');
  assert.equal(typeof rec.ended, 'string');
  assert.ok(Number.isFinite(Date.parse(rec.ended)));
});

test('0153 AC3: an auto-ship that refuses (here, files changed after approval) leaves its message too', () => {
  const r = shipRepo();
  autoOn(r);
  fs.writeFileSync(path.join(r.wt, 'other.txt'), 'changed after approval\n');
  gIn(r.wt, 'commit', '-qam', 'late change');
  const res = runIn(r.wt, 'ship', '1', '--auto');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /changed after the reviewer approved/);
  assert.equal(shipOf(r.dir).message, res.stderr.trim());
});

test('0153 AC3: an auto-ship that was killed shows as ended, with no message', async () => {
  const { test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  autoOn(r);
  const s = shipping(r.wt, '--auto');
  await until(() => running(r.dir), 'the auto-ship to start');
  killGroup(s.child);
  await s.exited;
  const rec = shipOf(r.dir);
  assert.ok(rec, 'a record');
  assert.equal(rec.running, false);
  assert.equal(rec.auto, true);
  assert.equal(rec.message, null);
});

test('0153 AC3: a later auto-ship that works clears the earlier failure', () => {
  const pass = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-pass-')), 'pass');
  const r = shipRepo({ test: `test -f ${pass}` });
  autoOn(r);
  assert.notEqual(runIn(r.wt, 'ship', '1', '--auto').status, 0);
  assert.ok(shipOf(r.dir), 'the failure is recorded');
  fs.writeFileSync(pass, '');
  const res = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(shipOf(r.dir), null);
});

test('0153 AC4: an auto-ship that config doesn\'t cover (exit 12) leaves no record', () => {
  const r = shipRepo();
  const off = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(off.status, 12, off.stderr);
  assert.equal(shipOf(r.dir), null, 'auto_ship off');
  autoOn(r);
  configure(r, 'auto_ship_risk', '[high]');
  const risk = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(risk.status, 12, risk.stderr);
  assert.equal(shipOf(r.dir), null, 'a risk auto_ship_risk doesn\'t cover');
});

test('0153 AC4: a ship the user started that fails leaves no auto-ship message', () => {
  const r = shipRepo({ test: 'false' });
  const res = runIn(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.equal(shipOf(r.dir), null);
});

test('0153 AC4: a ship the user started that was killed leaves no auto-ship message', async () => {
  const { test: cmd } = gated();
  const r = shipRepo({ test: cmd });
  const s = shipping(r.dir);
  await until(() => running(r.dir), 'the ship to start');
  killGroup(s.child);
  await s.exited;
  assert.equal(shipOf(r.dir), null);
});

test('0153 AC2: a record whose pid now belongs to another program, or that can\'t be read, doesn\'t hold the ticket', () => {
  for (const text of [JSON.stringify({ pid: process.pid, started: new Date().toISOString(), auto: false }), 'not json', '{"__proto__": {"pid": 1}}']) {
    const r = shipRepo();
    const runs = path.join(r.dir, 'speck', '.cache', 'runs');
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, '0001.ship.json'), text);
    assert.equal(shipOf(r.dir), null, text);
    const res = runIn(r.dir, 'ship', '1');
    assert.equal(res.status, 0, `${text}: ${res.stderr}`);
    assert.equal(shipOf(r.dir), null);
  }
});

test('0153 AC2: when the record can\'t be written, speck ship says so plainly and ships nothing', { skip: process.getuid?.() === 0 }, () => {
  const r = shipRepo();
  const cache = path.join(r.dir, 'speck', '.cache');
  fs.mkdirSync(path.join(cache, 'runs'), { recursive: true });
  fs.chmodSync(path.join(cache, 'runs'), 0o500);
  try {
    const snap = r.snapshot();
    const res = runIn(r.dir, 'ship', '1');
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /couldn't write ticket 0001's ship record/);
    assert.doesNotMatch(res.stderr, /^\s+at /m);
    assert.deepEqual(r.snapshot(), snap);
  } finally { fs.chmodSync(path.join(cache, 'runs'), 0o700); }
});
