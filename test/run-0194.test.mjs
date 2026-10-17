import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { shipRepo, runIn } from './support/ship.mjs';
import { ROOT, startRun, until, stopRun } from './support/run.mjs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { handBackMessage, resumeArgv, handBackQueue } from '../scripts/hand-back.mjs';
import { killAll } from './support/run.mjs';

// ---------- 0194: builds end at approved, and speck run's ship queue does every auto-ship ----------

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const build = () => read('skills/speck-build/SKILL.md');
const section5 = () => build().split(/^## 5\./m)[1].split(/^## /m)[0];
const part = heading => {
  const m = section5().match(new RegExp(`^### ${heading}[^\\n]*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, 'm'));
  assert.ok(m, `section 5 has a "${heading}" part`);
  return m[1];
};
const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;

// An approved ticket 0001 with auto_ship on, as shipRepo makes it.
function approvedRepo(o = {}) {
  const r = shipRepo(o);
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  return r;
}

// speck run's queue with a stand-in for `speck ship`, and a record of each hand-back it makes.
function queue(r) {
  const said = [], launches = [], handed = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, {
    say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, log, done }), handBack: h => handed.push(h),
  });
  return { said, launches, handed, check: (tickets = statusData(r.dir).tickets) => q.check(tickets) };
}

test('0194 AC1: /speck-build ends at approved and never runs speck ship', () => {
  const s = build();
  assert.doesNotMatch(s, /`speck ship <id>[^`]*`/, 'no speck ship command to run');
  assert.doesNotMatch(s, /--auto/);
  assert.match(s.split('\n').slice(0, 12).join('\n'), /from `ready` to `approved`\./);
  const rule = s.split(/^## Rules/m)[1].split('\n').find(l => /^- Never merge or ship/.test(l));
  assert.ok(rule, 'the never-ship rule is there');
  assert.doesNotMatch(rule, /exception|--auto/i);
});

test('0194 AC1: its report says the ticket waits for speck run\'s ship queue, or for /speck-ship when auto_ship doesn\'t cover it', () => {
  const s = section5();
  const report = s.split('\n').find(l => /^3\. /.test(l)) || '';
  assert.match(report, /`auto_ship`/);
  assert.match(report, /`speck run`'s ship queue/);
  assert.match(report, /`\/speck-ship <id>`/);
  assert.match(report, /how many follow-ups went to the inbox/);
  assert.match(report, /or that none did/);
});

test('0194 AC2: a ship started with --auto exits 16 when the ticket and the base branch\'s newer changes fail together', () => {
  // The tests fail only with the ticket's change (shared.txt) and main's newer change (other.txt) together.
  const r = approvedRepo({ test: 'if grep -q feature shared.txt && grep -q moved other.txt; then exit 1; fi' });
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'moved\n');
  r.g('commit', '-qam', 'main moves on');
  const before = r.snapshot();
  const auto = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(auto.status, 16, auto.stderr + auto.stdout);
  assert.match(auto.stderr, /because of its own change or because of it with main's newer changes/);
  assert.deepEqual(r.snapshot(), before, 'nothing changed');
  const own = runIn(r.dir, 'ship', '1');
  assert.equal(own.status, 1, 'your own ship exits 1 as before');
});

test('0194 AC2 AC3: the queue hands a ticket back on exit 13, 16 and 14, and on nothing else', () => {
  for (const [code, kind] of [[13, 'conflict'], [16, 'tests'], [14, 'base'], [0, null], [1, null], [12, null], [15, null], [null, null]]) {
    const r = approvedRepo(), k = queue(r);
    k.check();
    k.launches[0].done(code);
    assert.deepEqual(k.handed.map(h => h.kind), kind ? [kind] : [], `exit ${code}`);
    if (kind) {
      assert.equal(k.handed[0].id, '0001');
      assert.equal(k.handed[0].head, r.sha('speck/0001-export-bookings'), 'the branch as the ship tried it');
      assert.ok(k.handed[0].why.length > 0, 'with the reason');
    }
  }
});

test('0194 AC3: after exit 14 the queue still holds every ship until the base branch has a new commit', () => {
  const r = approvedRepo(), k = queue(r);
  k.check();
  k.launches[0].done(14);
  fs.writeFileSync(path.join(r.wt, 'other.txt'), 'x\n');
  r.g('-C', r.wt, 'commit', '-qam', 'branch moves'); // as a hand-back session might
  for (let i = 0; i < 3; i++) k.check();
  assert.equal(k.launches.length, 1, 'on hold');
  assert.match(k.said.join('\n'), /on hold until main passes/);
});

test('0194 AC2: the hand-back message names what happened and the build skill\'s steps for it', () => {
  const why = 'Merging speck/0001-x into main hit a conflict. Conflicting files: a.txt.';
  const conflict = handBackMessage({ id: '0001', kind: 'conflict', why, base: 'main', count: 1 });
  assert.match(conflict, /0001/);
  assert.match(conflict, /conflict/i);
  assert.ok(conflict.includes(why), 'with ship\'s own message, which names the ref and the files');
  assert.match(conflict, /\/speck-build/);
  assert.match(conflict, /"Conflict"/);
  const tests = handBackMessage({ id: '0001', kind: 'tests', why: 'Tests failed.', base: 'main', count: 2 });
  assert.match(tests, /main's own tests pass/);
  assert.match(tests, /"Tests fail together"/);
  for (const m of [conflict, tests]) assert.match(m, /approved/, 'it ends at approved again');
  for (const m of [conflict, tests]) assert.match(m, /ship queue ships it/);
});

test('0194 AC2: after two hand-backs without shipping, the third tells the session to block the ticket instead', () => {
  for (const kind of ['conflict', 'tests']) {
    const m = handBackMessage({ id: '0001', kind, why: 'Conflicting files: a.txt.', base: 'main', count: 3 });
    assert.match(m, /twice/);
    assert.match(m, /"Handed back again"/);
    assert.doesNotMatch(m, /"Conflict"|"Tests fail together"/, 'no third merge');
  }
  const s = part('Handed back again');
  assert.match(s, /block the ticket \(section 6\)/i);
  assert.match(s, /without git terms/);
});

test('0194 AC3: exit 14 hands back to the "Base branch failing" steps, and the ticket stays approved', () => {
  const m = handBackMessage({ id: '0001', kind: 'base', why: 'main\'s own tests are failing too.', base: 'main', count: 0 });
  assert.match(m, /"Base branch failing"/);
  assert.match(m, /main's own tests are failing/);
  const s = part('Base branch failing');
  assert.match(s, /leave this ticket `approved`/i);
  assert.match(s, /fix ticket/);
});

test('0194 AC2: the build skill has steps for each hand-back, ending at approved for the queue to ship', () => {
  const s = part('When speck run hands it back');
  for (const name of ['"Conflict"', '"Tests fail together"', '"Base branch failing"', '"Handed back again"']) assert.ok(s.includes(name), name);
  const c = part('Conflict');
  assert.match(c, /`speck merge-check <id>`/);
  assert.match(c, /merge round/i);
  assert.match(c, /On `ship`: run `speck close <id>`, then stop/);
  assert.match(c, /ship queue ships it/);
  const t = part('Tests fail together');
  assert.match(t, /`git merge <base_branch>`/);
  assert.match(t, /"Conflict"/, 'it reuses the conflict steps for the merge round');
  assert.match(t, /fix the failing tests/i);
});

test('0194 AC2: a hand-back resumes the build\'s own session with its message in place of the prompt', () => {
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}', '--verbose'];
  const argv = resumeArgv(words, '0001', 'abc', 'Hand-back message');
  assert.deepEqual(argv, ['claude', '-p', 'Hand-back message', '--resume', 'abc', '--verbose']);
});

// speck run's queue and hand-backs wired together as speck run wires them, with stand-ins for `speck ship` and for
// starting a build. `running` is speck run's set of builds, and 0001 has a run record from a build that has ended.
function wired(r, running = new Set()) {
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const file = path.join(runs, '0001.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ id: '0001', session: 'sess-1', cwd: r.wt, pid: deadPid(), exited: '2026-10-15T10:30:00.000Z', exit_code: 0 }));
  const cfg = { base_branch: 'main', branch_prefix: 'speck/' };
  const launches = [], started = [];
  const backs = handBackQueue({ repo: r.dir, cfg, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running,
    startBuild: (id, argv) => { started.push({ id, argv }); running.add(id); }, resumeHint: () => '', runs: () => runs,
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)) });
  const q = shipQueue(r.dir, cfg, { say: () => {}, launch: (repo, id, log, done) => launches.push({ id, done }), handBack: h => backs.keep(h), waiting: id => backs.waiting(id) });
  const tick = () => { const t = statusData(r.dir).tickets; q.check(t); backs.check(t); };
  return { launches, started, running, tick };
}
const mainMoves = r => { fs.writeFileSync(path.join(r.dir, 'notes.txt'), `${Math.random()}\n`); r.g('commit', '-qam', 'main moves'); };

test('0194 AC2: a hand-back waiting for a build slot stops the queue shipping its ticket, even after a new commit on the base branch', () => {
  const r = approvedRepo();
  const k = wired(r, new Set(['0009'])); // another build has the only slot
  k.tick();
  k.launches[0].done(13);
  mainMoves(r);
  for (let i = 0; i < 3; i++) k.tick();
  assert.equal(k.launches.length, 1, 'not shipped again while its hand-back waits');
  assert.equal(k.started.length, 0, 'the slot is taken');
  k.running.delete('0009');
  k.tick();
  assert.deepEqual(k.started.map(s => s.id), ['0001'], 'handed back once the slot is free');
  assert.equal(k.launches.length, 1, 'and not shipped in the same check');
});

test('0194 AC2: a hand-back kept in the run record still stops the queue shipping its ticket after speck run restarts', () => {
  const r = approvedRepo();
  const first = wired(r, new Set(['0009']));
  first.tick();
  first.launches[0].done(16);
  mainMoves(r);
  const again = wired(r, new Set(['0009'])); // a new speck run, with nothing in memory
  for (let i = 0; i < 3; i++) again.tick();
  assert.equal(again.launches.length, 0, 'not shipped');
  again.running.delete('0009');
  again.tick();
  assert.deepEqual(again.started.map(s => s.id), ['0001'], 'handed back');
});

test('0194 AC2: a hand-back is not started while a ship of its ticket is running', () => {
  const r = approvedRepo();
  const k = wired(r, new Set(['0009']));
  k.tick();
  k.launches[0].done(13);
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', '0001'], { detached: true, stdio: 'ignore' });
  p.unref();
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.ship.json'), JSON.stringify({ pid: p.pid, started: new Date().toISOString(), auto: false }));
  try {
    k.running.delete('0009');
    k.tick();
    assert.equal(k.started.length, 0, 'waits for that ship to end');
  } finally { killAll([p.pid]); }
});

// A fake build: records its arguments, folder and pid in <out>/<n>.json, prints a line, then exits after FAKE_MS.
const FAKE = `
const fs = require('fs'), path = require('path');
const [out, ...args] = process.argv.slice(2);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ at: Date.now(), args, cwd: process.cwd(), pid: process.pid }));
console.log('fake build ' + n);
setTimeout(() => process.exit(0), +(process.env.FAKE_MS || 0));
`;

test('0194 AC2 AC4: a conflicting ship that speck run started resumes the build session, which counts towards max_parallel_builds and logs to the build log', async () => {
  const r = approvedRepo();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-out-'));
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, FAKE);
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  let cfg = fs.readFileSync(cfgFile, 'utf8').replace(/^(build_command|max_parallel_builds):.*$/gm, '');
  cfg += `\nbuild_command: ${JSON.stringify(`"${process.execPath}" "${fake}" "${out}" "/speck-build {id}" --session-id {session}`)}\nmax_parallel_builds: 1\n`;
  fs.writeFileSync(cfgFile, cfg);
  // Ticket 0002, ready, which speck run launches at once, so the hand-back waits for its slot.
  const t2 = path.join(r.dir, runIn(r.dir, 'new', 'Second ticket').stdout.trim());
  fs.writeFileSync(t2, fs.readFileSync(t2, 'utf8').split('## Problem')[0].replace(/^status: draft/m, 'status: ready')
    + '## Problem\nP.\n## Outcome\nO.\n## Acceptance criteria\n1. A.\n## Out of scope\n- N\n');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main\n'); // conflicts with the ticket's change
  r.g('add', '-A'); r.g('commit', '-qm', 'main changes shared.txt and adds 0002');
  // 0001's build, which ended at approved.
  const session = crypto.randomUUID();
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.json'), JSON.stringify({ id: '0001', session, cwd: r.wt, started: '2026-10-15T10:00:00.000Z', pid: deadPid(), command: ['claude'], exited: '2026-10-15T10:30:00.000Z', exit_code: 0 }));
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.log'), 'first build line\n{"type":"result"}\n');
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'))).sort((a, b) => a.at - b.at);
  const run = startRun(r.dir, { FAKE_MS: '1500' });
  try {
    assert.ok(await until(() => calls().some(c => c.args.includes('--resume')), 20000), run.out());
    const [first, back] = calls();
    assert.ok(first.args.includes('/speck-build 0002'), 'the ready ticket took the only slot first');
    assert.ok(back.at - first.at >= 1400, `the hand-back waited for the slot (${back.at - first.at} ms)`);
    assert.equal(back.args[back.args.indexOf('--resume') + 1], session, 'its own session');
    assert.equal(back.cwd, r.wt, 'in its own folder');
    const message = back.args[0]; // the prompt's place
    assert.match(message, /"Conflict"/);
    assert.match(message, /shared\.txt/);
    assert.match(run.out(), /0001[^\n]*hand/i, run.out());
    const rec = JSON.parse(fs.readFileSync(path.join(runsOf(r.dir), '0001.json'), 'utf8'));
    assert.ok(!Object.hasOwn(rec, 'exited'), 'running again while it works');
    assert.equal(rec.hand_backs, 1);
    assert.ok(statusData(r.dir).tickets.find(t => t.id === '0001').build_running, 'the board shows it running');
    assert.ok(await until(() => /fake build 1/.test(fs.readFileSync(path.join(runsOf(r.dir), '0001.log'), 'utf8'))), 'it writes to the build log');
    assert.match(fs.readFileSync(path.join(runsOf(r.dir), '0001.log'), 'utf8'), /^first build line/, 'after what was there');
    assert.ok(await until(() => Object.hasOwn(JSON.parse(fs.readFileSync(path.join(runsOf(r.dir), '0001.json'), 'utf8')), 'exited')), 'its exit is recorded');
    await new Promise(res => setTimeout(res, 300));
    assert.equal(calls().filter(c => c.args.includes('--resume')).length, 1, 'handed back once');
  } finally { await stopRun(run); }
});

test('0194 AC2: a ticket with no build session to resume is reported once, with what to do', async () => {
  const r = approvedRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main\n');
  r.g('commit', '-qam', 'main changes shared.txt');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /0001[^\n]*can't resume/i.test(run.out()), 15000), run.out());
    await new Promise(res => setTimeout(res, 300));
    assert.equal(run.out().split('\n').filter(l => /can't resume/i.test(l)).length, 1, 'said once');
    assert.match(run.out(), /0001[^\n]*"Conflict"/, 'with the steps to follow');
  } finally { await stopRun(run); }
});

test('0194: the other docs no longer say a build ships its own ticket', () => {
  for (const f of ['AGENTS.md', 'README.md', 'skills/speck-review/SKILL.md', 'scripts/install.mjs'])
    assert.doesNotMatch(read(f), /`speck ship <id> --auto` (step )?in/, f);
});
