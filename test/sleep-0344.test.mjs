// 0344: time the machine was asleep during a build is left out of the build's time.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { runsPath } from './support/ticker.mjs';
import { builtWithSpeckFigures } from './support/figures.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { clockGap, macGap, sysctlTime, macSleepTimes, sleepWatch, sleepQueue, SLACK_MS } from '../scripts/sleep-wait.mjs';

Object.assign(process.env, gitEnv); // countSleep commits in this process

const HOUR = 3600000, MIN = 60000;
const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;

// Clocks a test moves by hand: awake moves both, asleep moves only the wall clock, as Linux's monotonic clock does.
const fakeClocks = () => {
  const c = { wall: Date.parse('2026-10-20T12:00:00Z'), mono: 1000 };
  return { c, read: () => ({ ...c }), awake: ms => { c.wall += ms; c.mono += ms; }, asleep: ms => { c.wall += ms; } };
};
// A repo with ticket 0001 at `status`, and a sleep queue over it with `running` builds and fake clocks.
function setup(status = 'building', { running = ['0001'], platform = 'linux', times = () => null } = {}) {
  const r = panelRepo();
  if (status !== 'ready') { assert.equal(r.run('set', '1', 'status', status).status, 0); r.g('commit', '-qam', status); }
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const k = fakeClocks(), logs = [];
  const q = sleepQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), running: new Set(running), runs: () => runsPath(r.dir, ''),
    watch: sleepWatch({ read: k.read, platform, times, pollMs: 5000 }), log: s => logs.push(s) });
  const tickets = () => [{ id: '0001', status: fmOf(r.file).status }];
  return { ...r, k, q, logs, tickets, waited: () => Number(fmOf(r.file).waited_seconds || 0) };
}

// ---------- AC1 ----------

test('0344 AC1: a sleep while a ticket is building is added to its waited_seconds once, at the first check after waking', () => {
  const s = setup('building');
  s.q.check(s.tickets());
  s.k.awake(5000); s.q.check(s.tickets());
  s.k.asleep(3 * HOUR); s.k.awake(5000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 3 * 3600);
  assert.match(s.g('log', '-1', '--format=%s'), /^speck\(0001\): time asleep$/);
  assert.equal(s.g('status', '--porcelain', '--', s.file), '', 'committed');
  assert.match(s.logs.join('\n'), /0001: the machine was asleep for 180 min/);
  s.k.awake(5000); s.q.check(s.tickets());
  s.k.awake(5000); s.q.check(s.tickets());
  assert.equal(s.waited(), 3 * 3600, 'added once');
});

test('0344 AC1: a reviewing ticket gets it too, adding to what it had waited before', () => {
  const s = setup('reviewing');
  fs.writeFileSync(s.file, fs.readFileSync(s.file, 'utf8').replace(/^status:/m, 'waited_seconds: 100\nstatus:'));
  s.g('commit', '-qam', 'waited');
  s.q.check(s.tickets());
  s.k.asleep(HOUR); s.k.awake(1000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 100 + 3600);
});

test('0344 AC1: on macOS, where the clock keeps counting through sleep, the sleep macOS recorded is added', () => {
  let times = null;
  const s = setup('building', { platform: 'darwin', times: () => times });
  s.q.check(s.tickets());
  const slept = s.k.c.wall + 1000;
  s.k.awake(2 * HOUR); // macOS's monotonic clock counts the sleep too, so neither clock shows it
  times = { sleep: slept, wake: slept + 2 * HOUR - 2000 };
  s.q.check(s.tickets());
  assert.equal(s.waited(), Math.round((2 * HOUR - 2000) / 1000));
  s.k.awake(10 * MIN); s.q.check(s.tickets()); // late, with that same sleep still the last macOS recorded
  assert.equal(s.waited(), Math.round((2 * HOUR - 2000) / 1000), 'counted once');
});

test('0344 AC1: on macOS, a sleep both clocks show is counted once, not once for each', () => {
  const s = setup('building', { platform: 'darwin', times: () => ({ sleep: start + 1000, wake: start + 1000 + HOUR }) });
  const start = s.k.c.wall;
  s.q.check(s.tickets());
  s.k.awake(1000); s.k.asleep(HOUR); s.k.awake(1000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 3600);
});

test('0344 AC1: macOS\'s recorded sleep and wake times are read from sysctl', () => {
  assert.equal(sysctlTime('{ sec = 1760990000, usec = 250000 } Mon Oct 20 20:33:20 2025'), 1760990000250);
  assert.equal(sysctlTime(''), null);
  assert.equal(sysctlTime('{ sec = 0, usec = 0 }'), null, 'never slept');
  const run = () => ({ status: 0, stdout: '{ sec = 100, usec = 0 } x\n{ sec = 200, usec = 500000 } y\n' });
  assert.deepEqual(macSleepTimes(run), { sleep: 100000, wake: 200500 });
  assert.equal(macSleepTimes(() => ({ status: 1, stdout: '' })), null, 'no sysctl');
  assert.equal(macSleepTimes(() => { throw new Error('ENOENT'); }), null);
  assert.equal(macSleepTimes(() => ({ status: 0, stdout: 'nonsense\n' })), null);
});

test('0344 AC1: speck run checks for a sleep on each of its checks, with its build slots', () => {
  const src = fs.readFileSync(path.join(import.meta.dirname, '..', 'scripts', 'run.mjs'), 'utf8');
  assert.match(src, /sleepQueue\(\{[^}]*running[^}]*\}\)/);
  assert.match(src, /sleeps\.check\(tickets\)/);
});

// ---------- AC2 ----------

test('0344 AC2: a check that comes late while the machine stayed awake adds nothing', () => {
  const s = setup('building');
  s.q.check(s.tickets());
  s.k.awake(40 * MIN);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 0);
  assert.equal(clockGap({ wall: 0, mono: 0 }, { wall: HOUR, mono: HOUR - SLACK_MS }), 0, 'drift within the slack');
  assert.equal(clockGap({ wall: 0, mono: 0 }, { wall: HOUR, mono: HOUR + 9000 }), 0, 'the wall clock set back');
});

test('0344 AC2: on macOS, a late check reads the last sleep, and one from before the last check adds nothing', () => {
  const prev = { wall: 10 * HOUR, mono: 0 }, now = { wall: 11 * HOUR, mono: HOUR };
  assert.equal(macGap(prev, now, () => ({ sleep: 2 * HOUR, wake: 3 * HOUR }), 5000), 0);
  let read = 0;
  assert.equal(macGap(prev, { wall: prev.wall + 7000, mono: 7000 }, () => { read++; return null; }, 5000), 0);
  assert.equal(read, 0, 'an on-time check runs no command');
  const s = setup('building', { platform: 'darwin', times: () => ({ sleep: 1, wake: 2 }) });
  s.q.check(s.tickets());
  s.k.awake(30 * MIN);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 0);
});

// ---------- AC3 ----------

test('0344 AC3: a ticket blocked while the machine slept doesn\'t get that time added as well', () => {
  const s = setup('blocked');
  const before = fmOf(s.file).blocked_at;
  assert.ok(before, 'its blocked time is counting');
  s.q.check(s.tickets());
  s.k.asleep(2 * HOUR); s.k.awake(1000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 0);
  assert.equal(fmOf(s.file).blocked_at, before);
});

test('0344 AC3: a ticket whose build was paused while the machine slept doesn\'t get that time added as well', () => {
  const s = setup('building');
  fs.writeFileSync(runsPath(s.dir, '0001.json'), JSON.stringify({ id: '0001', session: 's1', pid: process.pid }));
  fs.writeFileSync(runsPath(s.dir, '0001.paused'), JSON.stringify({ session: 's1', pid: process.pid, paused: new Date().toISOString() }));
  s.q.check(s.tickets());
  s.k.asleep(2 * HOUR); s.k.awake(1000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 0);
});

test('0344 AC3: a ticket whose build had stopped, already counting its wait, doesn\'t get it added as well', () => {
  const s = setup('building', { running: [] });
  s.q.check(s.tickets());
  s.k.asleep(2 * HOUR); s.k.awake(1000);
  s.q.check(s.tickets());
  assert.equal(s.waited(), 0);
});

test('0344 AC3: a ticket that blocks just after waking still gets the sleep, as it was building while asleep', () => {
  const s = setup('building');
  s.q.check(s.tickets());
  s.k.asleep(HOUR); s.k.awake(1000);
  assert.equal(s.run('set', '1', 'status', 'blocked').status, 0); s.g('commit', '-qam', 'blocked');
  s.q.check(s.tickets());
  assert.equal(s.waited(), 3600);
});

// ---------- AC4 ----------

test('0344 AC4: the README figures leave each ticket\'s waited_seconds out of its time', () => {
  const done = (start, end, waited) => `---\nstatus: done\nstarted: "${start}"\nfinished: "${end}"\n${waited === undefined ? '' : `waited_seconds: ${waited}\n`}---\n`;
  const f = builtWithSpeckFigures([
    done('2026-10-20T10:00:00Z', '2026-10-20T15:10:00Z', 5 * 3600), // 310 minutes, 300 of them asleep
    done('2026-10-20T10:00:00Z', '2026-10-20T10:12:00Z'),
    done('2026-10-20T10:00:00Z', '2026-10-20T10:20:00Z', 0),
  ]);
  assert.equal(f.medianMinutes, 12);
  const one = builtWithSpeckFigures([done('2026-10-20T10:00:00Z', '2026-10-20T15:10:00Z', 5 * 3600)]);
  assert.equal(one.medianMinutes, 10);
});
