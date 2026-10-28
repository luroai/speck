import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, stopRun, until, killAll, alive, fm, good } from './support/run.mjs';
import { blockedRepo, ENDED } from './support/blocked.mjs';
import { gitEnv } from './support/panel.mjs';
import { statusData, loadConfig } from '../scripts/speck.mjs';
import { builderSettings, liveSettings } from '../scripts/run-settings.mjs';
import { handBackQueue } from '../scripts/hand-back.mjs';
import { goWithQueue, goWith } from '../scripts/go-with.mjs';
import { foremanAgentQueue } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

// ---------- 0549: use the builder settings as they are when each build starts ----------

const COMMAND = 'claude -p "/speck-build {id}" --session-id {session}';
const CFG = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude', build_command: COMMAND };
// A check every 250 ms: quick enough, without crowding out the tests that time speck run's checks.
const POLL = { SPECK_RUN_POLL_MS: '250' };
const wait = ms => new Promise(res => setTimeout(res, ms));
const speck = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
const effort = args => { const i = args.indexOf('--effort'); return i < 0 ? null : args[i + 1]; };
const save = (f, rec) => fs.writeFileSync(f, JSON.stringify(rec));

// Sets `key` in the repo's speck/config.yml, or removes it when `value` is null.
const setRepo = (dir, key, value) => {
  const file = path.join(dir, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8').replace(new RegExp(`^${key}:.*\\n?`, 'm'), '');
  fs.writeFileSync(file, value === null ? text : `${text.replace(/\n*$/, '\n')}${key}: ${value}\n`);
};
// Commits ticket `id` ready, so speck run launches it.
const addReady = (r, id) => {
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', `${id}-t.md`), `---\n${fm({ id: `"${id}"` })}\n---\n${good}`);
  r.g('add', `speck/tickets/${id}-t.md`); r.g('commit', '-qm', `ticket ${id}`);
};

test('0549 AC1: the words a build starts with come from the settings as they are, with builder_model and builder_effort, or without them when blank', () => {
  const words = c => builderSettings({ ...CFG, ...c }).words;
  assert.deepEqual(words({ builder_effort: 'high' }).slice(-2), ['--effort', 'high']);
  assert.deepEqual(words({ builder_effort: 'medium', builder_model: 'opus' }).slice(-4), ['--model', 'opus', '--effort', 'medium']);
  assert.equal(effort(words({ builder_effort: '' })), null, 'blank: none');
  assert.ok(!words({ builder_model: '' }).includes('--model'));
  let cfg = { ...CFG, builder_effort: 'high' };
  const live = liveSettings(() => cfg, () => {});
  assert.equal(effort(live().words), 'high');
  cfg = { ...CFG, builder_effort: 'medium', builder_model: 'sonnet' };
  assert.equal(effort(live().words), 'medium', 'read again on each call');
  assert.ok(live().words.includes('sonnet'));
  cfg = { ...CFG, builder_effort: '' };
  assert.equal(effort(live().words), null);
});

test('0549 AC1, AC3, AC5: speck run starts each build with the settings as they are then, waits while they can\'t start one, and carries on once they can', async () => {
  const r = runRepo();
  const run = startRun(r.dir, POLL);
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    assert.equal(effort(r.calls()[0].args), null);
    // For this machine only, as `speck config set` saves it by default.
    assert.equal(speck(r.dir, 'config', 'set', 'builder_effort', 'medium').status, 0);
    addReady(r, '0002');
    assert.ok(await until(() => r.calls().length === 2), run.out());
    assert.equal(effort(r.calls()[1].args), 'medium', 'the next build has the new value, without a restart');
    assert.equal(effort(r.calls()[0].args), null, 'the build that started first kept its own');

    const command = loadConfig(r.dir).build_command;
    setRepo(r.dir, 'builder', 'codex');
    setRepo(r.dir, 'build_command', `'${COMMAND}'`);
    addReady(r, '0003');
    assert.ok(await until(() => /builder in speck\/config\.yml is codex/.test(run.out())), run.out());
    assert.doesNotMatch(run.out(), /speck run won't start/, 'it isn\'t starting');
    setRepo(r.dir, 'builder', 'claude');
    setRepo(r.dir, 'build_command', `'${command} "unclosed'`);
    assert.ok(await until(() => /quote that isn't closed/.test(run.out())), run.out());
    await wait(400);
    assert.equal(r.calls().length, 2, 'no build starts while the settings can\'t start one');
    assert.equal(statusData(r.dir).tickets.find(t => t.id === '0003').status, 'ready');
    assert.equal(run.out().match(/quote that isn't closed/g).length, 1, `said once: ${run.out()}`);
    assert.equal(run.child.exitCode, null, 'speck run keeps running');

    assert.equal(speck(r.dir, 'config', 'set', 'builder_effort', '').status, 0);
    setRepo(r.dir, 'build_command', JSON.stringify(command));
    assert.ok(await until(() => r.calls().length === 3), run.out());
    assert.equal(r.calls()[2].args.includes('0003'), true);
    assert.equal(effort(r.calls()[2].args), null, 'set blank: started without it');
    assert.match(run.out(), /can start builds again/);

    // A builder that builds with build_command as it is: builder_effort is passed only to Claude Code.
    assert.equal(speck(r.dir, 'config', 'set', 'builder_effort', 'medium').status, 0);
    setRepo(r.dir, 'builder', 'cursor');
    addReady(r, '0004');
    assert.ok(await until(() => r.calls().length === 4), run.out());
    assert.equal(effort(r.calls()[3].args), null, 'started as the new builder');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0549 AC4: a change to max_parallel_builds applies from the next check, without stopping a build already running', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}]], max: 1 });
  const run = startRun(r.dir, { ...POLL, FAKE_MS: '4000' });
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    await wait(300);
    assert.equal(r.calls().length, 1, 'one at a time');
    assert.equal(speck(r.dir, 'config', 'set', 'max_parallel_builds', '3').status, 0);
    assert.ok(await until(() => r.calls().length === 3, 2000), `up to the new limit: ${run.out()}`);
    assert.equal(speck(r.dir, 'config', 'set', 'max_parallel_builds', '1').status, 0);
    addReady(r, '0004');
    await wait(400);
    assert.equal(r.calls().length, 3, 'none started while more than the new limit run');
    assert.ok(r.calls().every(c => alive(c.pid)), 'none of the running builds stopped');
    assert.ok(await until(() => r.calls().length === 4, 8000), `started once fewer run: ${run.out()}`);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0549 AC3: a change of builder applies to the next build', () => {
  let cfg = { ...CFG };
  const live = liveSettings(() => cfg, () => {});
  assert.equal(live().words[0], 'claude');
  cfg = { ...CFG, builder: 'codex', build_command: '' };
  assert.equal(live().words[0], 'codex', 'Codex\'s own command');
  cfg = { ...CFG, builder: 'claude' };
  assert.equal(live().words[0], 'claude', 'and back');
});

test('0549 AC3: a change to resume_command applies to what speck run says next about resuming a build by hand', () => {
  const r = blockedRepo();
  assert.equal(goWith(r.dir, '0001').status, 200);
  // build_command without --session-id can't resume a session, so speck run says how to resume it by hand.
  const s = changing(), said = [], log = console.log;
  s.set({ build_command: 'my-build {id}', resume_command: 'first-resume {session}' });
  const q = goWithQueue({ repo: r.dir, cfg: CFG, settings: s.settings, running: new Set(), startBuild: () => assert.fail('nothing can start'),
    saveRecord: save, runs: () => r.runs });
  s.set({ build_command: 'my-build {id}', resume_command: 'second-resume {session}' });
  console.log = m => said.push(m);
  try { q.check(statusData(r.dir).tickets); } finally { console.log = log; }
  assert.match(said.join('\n'), /second-resume sess-1/);
  assert.doesNotMatch(said.join('\n'), /first-resume/);
});

// A fake build that can be resumed: records its arguments in <out>/<n>.json and exits.
const RESUMABLE = `
const fs = require('fs'), path = require('path');
const [out, ...args] = process.argv.slice(2);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ at: Date.now(), args, pid: process.pid }));
`;

test('0549 AC2: a stopped build speck run resumes is resumed with the settings as they are then', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-out-'));
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, RESUMABLE);
  const r = runRepo({ tickets: [['0001', { status: 'building' }]], command: `"${process.execPath}" "${fake}" "${out}" "/speck-build {id}" --session-id {session}` });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')));
  const run = startRun(r.dir, POLL);
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    assert.equal(speck(r.dir, 'config', 'set', 'builder_effort', 'low').status, 0);
    const runs = path.join(r.dir, 'speck', '.cache', 'runs'), dead = spawnSync(process.execPath, ['-e', '0']).pid;
    fs.writeFileSync(path.join(runs, '0001.log'), 'first build line\n');
    fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: crypto.randomUUID(), cwd: r.dir, pid: dead, command: [] }));
    assert.ok(await until(() => calls().length === 1), run.out());
    assert.ok(calls()[0].args.includes('--resume'));
    assert.equal(effort(calls()[0].args), 'low');
  } finally { await stopRun(run); killAll(calls().map(c => c.pid)); }
});

// Settings that change between checks, as speck run's do: set(c) changes them, set(null) makes them unable to start a build.
const changing = () => {
  let s = builderSettings({ ...CFG, builder_effort: 'high' });
  return { settings: () => s, set: c => { s = c && builderSettings({ ...CFG, ...c }); } };
};

test('0549 AC2: a ticket handed back to its build is resumed with the settings as they are then', () => {
  const r = blockedRepo({ status: 'approved' });
  fs.writeFileSync(r.record, JSON.stringify({ id: '0001', cwd: r.dir, command: [], ...ENDED, pid: 1, hand_back: { kind: 'conflict', why: 'x', head: r.head(), at: '2026-10-27T10:00:00.000Z' } }));
  const s = changing(), started = [], running = new Set();
  const q = handBackQueue({ repo: r.dir, cfg: CFG, settings: s.settings, running, startBuild: (id, argv) => { started.push(argv); running.add(id); },
    saveRecord: save, resumeHint: () => '', runs: () => r.runs });
  s.set(null);
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 0, 'not while the settings can\'t start a build');
  s.set({ builder_effort: 'medium' });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  assert.ok(started[0].includes('--resume'));
  assert.equal(effort(started[0]), 'medium');
});

test('0549 AC2: a build carried on with its recommendation is resumed with the settings as they are then', () => {
  const r = blockedRepo();
  assert.equal(goWith(r.dir, '0001').status, 200);
  const s = changing(), started = [], running = new Set();
  const q = goWithQueue({ repo: r.dir, cfg: CFG, settings: s.settings, running, startBuild: (id, argv) => { started.push(argv); running.add(id); },
    saveRecord: save, resumeHint: () => '', runs: () => r.runs });
  s.set(null);
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 0);
  s.set({ builder_effort: '' });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  assert.equal(effort(started[0]), null, 'blank: none');
});

test('0549 AC2: a build speck\'s watch asks to carry on is resumed with the settings as they are then', () => {
  const r = blockedRepo({ status: 'building' });
  fs.writeFileSync(path.join(r.runs, 'run.foreman-agent.json'), JSON.stringify({ resumes: [{ id: '0001', message: 'Carry on.' }] }));
  const s = changing(), started = [], running = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'off' }), cfg: CFG, settings: s.settings,
    running, ships: { again: () => {} }, say: () => {}, startBuild: (id, argv) => { started.push(argv); running.add(id); } });
  const tickets = () => statusData(r.dir).tickets;
  s.set(null);
  q.check(tickets());
  assert.equal(started.length, 0);
  s.set({ builder_effort: 'max', builder_model: 'opus' });
  q.check(tickets());
  assert.equal(started.length, 1);
  assert.equal(effort(started[0]), 'max');
  assert.ok(started[0].includes('opus'));
});
