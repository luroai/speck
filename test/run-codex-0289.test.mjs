import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, runRepo, startRun, until, stopRun, killAll } from './support/run.mjs';
import { panelSettings } from '../scripts/settings.mjs';
import { shipRepo } from './support/ship.mjs';
import { panelModel, T } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { codexBuilds, codexStartWords, codexResumeArgv, threadId, fillSession, CODEX_RESUME_COMMAND } from '../scripts/codex-build.mjs';
import { resumeFor, handBackQueue, handBackMessage, resumeArgv } from '../scripts/hand-back.mjs';
import { resumeHint, resumeCommandOf, DEFAULT_RESUME_COMMAND } from '../scripts/run.mjs';
import { builderModelNote, withBuilderModel } from '../scripts/build-model.mjs';

// ---------- 0289: start and resume Codex builds from speck run ----------

const BYPASS = ['--json', '--dangerously-bypass-approvals-and-sandbox'];
const CODEX = { builder: 'codex', build_command: '' };
const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const save = (f, v) => fs.writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const tmpRuns = () => fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'));
const started = id => JSON.stringify({ type: 'thread.started', thread_id: id });

// A fake `codex` on a PATH of its own: records its arguments, folder, pid and build session in <out>/<n>.json, writes
// a thread.started line (FAKE_THREAD, none when it's blank) as Codex's --json output starts, then exits after FAKE_MS.
const FAKE = `
const fs = require('fs'), path = require('path');
const out = process.env.FAKE_OUT;
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ at: Date.now(), args: process.argv.slice(2), cwd: process.cwd(), pid: process.pid, build: process.env.SPECK_BUILD_SESSION }));
if (process.env.FAKE_THREAD) console.log(JSON.stringify({ type: 'thread.started', thread_id: process.env.FAKE_THREAD }));
console.log(JSON.stringify({ type: 'turn.started' }));
setTimeout(() => process.exit(0), +(process.env.FAKE_MS || 0));
`;
function fakeCodex() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-out-'));
  fs.writeFileSync(path.join(bin, 'fake.cjs'), FAKE);
  fs.writeFileSync(path.join(bin, 'codex'), `#!/bin/sh\nexec "${process.execPath}" "${path.join(bin, 'fake.cjs')}" "$@"\n`, { mode: 0o755 });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => read(path.join(out, f))).sort((a, b) => a.at - b.at);
  return { env: o => ({ PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_OUT: out, ...o }), calls };
}

// A speck run repo with builder codex, build_command blank and builder_model as given, its ticket 0001 in `status`.
function codexRepo({ model = '', status = 'ready' } = {}) {
  const r = runRepo({ tickets: [['0001', { status }]], command: null });
  let text = fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, 'builder: codex').replace(/^builder_model:.*$/m, '');
  text += `build_command: ""\nbuilder_model: "${model}"\n`;
  fs.writeFileSync(r.cfgFile, text);
  r.g('commit', '-qam', 'codex builder');
  return r;
}

test('0289 AC1: with builder codex and build_command blank, speck run builds with codex exec, passing builder_model as -m', () => {
  assert.equal(codexBuilds(CODEX), true);
  assert.equal(codexBuilds({ builder: 'codex' }), false, 'build_command missing: speck run refuses, as before');
  assert.equal(codexBuilds({ builder: 'codex', build_command: '   ' }), true, 'only spaces');
  assert.equal(codexBuilds({ builder: 'codex', build_command: 'codex exec "$speck-build {id}"' }), false, 'a build_command that is set is used as it is');
  assert.equal(codexBuilds({ builder: 'claude', build_command: '' }), false);
  assert.deepEqual(codexStartWords(CODEX), ['codex', 'exec', ...BYPASS, '$speck-build {id}']);
  assert.deepEqual(codexStartWords({ ...CODEX, builder_model: ' gpt-6.1-sol ' }), ['codex', 'exec', ...BYPASS, '-m', 'gpt-6.1-sol', '$speck-build {id}']);
  assert.equal(builderModelNote({ ...CODEX, builder_model: 'gpt-6.1-sol' }), null, 'no note that builder_model is left out: it is passed');
  assert.match(builderModelNote({ builder: 'codex', build_command: 'codex exec x', builder_model: 'gpt-6.1-sol' }), /only passed to Claude Code builds/);
});

test('0289 AC1, AC2: speck run starts a Codex build and keeps the session id from its log as the build\'s session', async () => {
  const r = codexRepo({ model: 'gpt-6.1-sol' }), codex = fakeCodex();
  const run = startRun(r.dir, codex.env({ FAKE_THREAD: 'thread-0289', FAKE_MS: '3000' }));
  const file = path.join(runsOf(r.dir), '0001.json');
  try {
    assert.ok(await until(() => codex.calls().length >= 1 && fs.existsSync(file) && read(file).session === 'thread-0289', 10000), run.out());
    assert.deepEqual(codex.calls()[0].args, ['exec', ...BYPASS, '-m', 'gpt-6.1-sol', '$speck-build 0001']);
    const rec = read(file);
    assert.equal(rec.agent, 'codex');
    assert.equal(codex.calls()[0].build, rec.env_session, 'its processes carry the UUID pause and stop look for');
    assert.doesNotMatch(run.out(), /builder_model/, run.out());
  } finally { await stopRun(run); killAll(codex.calls().map(c => c.pid)); }
});

test('0289 AC2: the session id is the first thread.started line\'s, read into a Codex build\'s record and its marks', () => {
  assert.equal(threadId(['not json', '{"type":"turn.started"}', started('t-1'), started('t-2')].join('\n')), 't-1');
  assert.equal(threadId('{"type":"turn.started"}\n'), null);
  assert.equal(threadId('{"type":"thread.started"}\n'), null, 'no thread_id');
  assert.equal(threadId(''), null);
  assert.equal(threadId(undefined), null);

  const runs = tmpRuns(), file = path.join(runs, '0001.json'), pid = deadPid();
  save(file, { id: '0001', session: null, agent: 'codex', env_session: 'u-1', pid });
  assert.equal(fillSession(runs, '0001', save).session, null, 'no log yet');
  fs.writeFileSync(path.join(runs, '0001.log'), '{"type":"turn.started"}\n');
  assert.equal(fillSession(runs, '0001', save).session, null, 'no thread.started line yet');
  save(path.join(runs, '0001.stopped'), { session: null, pid, stopped: 'x' });
  save(path.join(runs, '0001.paused'), { session: null, pid: pid + 1, paused: 'x' });
  fs.appendFileSync(path.join(runs, '0001.log'), `${started('t-9')}\n`);
  assert.equal(fillSession(runs, '0001', save).session, 't-9');
  assert.equal(read(file).session, 't-9');
  assert.equal(read(file).env_session, 'u-1', 'the rest of the record kept');
  assert.equal(read(path.join(runs, '0001.stopped')).session, 't-9', 'the mark for this build still matches it');
  assert.equal(read(path.join(runs, '0001.paused')).session, null, 'a mark for another process is left alone');
  fs.writeFileSync(path.join(runs, '0001.log'), `${started('t-other')}\n`);
  assert.equal(fillSession(runs, '0001', save).session, 't-9', 'kept once read');

  save(file, { id: '0001', session: 'claude-uuid', pid });
  fs.writeFileSync(path.join(runs, '0001.log'), `${started('t-x')}\n`);
  assert.equal(fillSession(runs, '0001', save).session, 'claude-uuid', 'a Claude Code build is left as it is');
  for (const bad of ['[]', 'not json']) { fs.writeFileSync(file, bad); assert.doesNotThrow(() => fillSession(runs, '0001', save)); }
  assert.equal(fillSession(runs, '0002', save), null, 'no record');
});

test('0289 AC3: a killed or handed-back Codex build carries on its own session with codex exec resume', () => {
  const rec = { id: '0007', agent: 'codex', session: 't-7' };
  const killed = resumeFor([], CODEX, '0007', rec).argv;
  assert.deepEqual(killed.slice(0, -1), ['codex', 'exec', 'resume', 't-7', ...BYPASS]);
  assert.match(killed.at(-1), /stopped unexpectedly[\s\S]*\$speck-build 0007/);
  const message = handBackMessage({ id: '0007', kind: 'conflict', why: 'merge conflict', base: 'main', count: 1 });
  assert.deepEqual(resumeFor([], CODEX, '0007', rec, message).argv, ['codex', 'exec', 'resume', 't-7', ...BYPASS, message]);
  assert.deepEqual(resumeFor([], { ...CODEX, builder_model: 'gpt-x' }, '0007', rec, 'm').argv, ['codex', 'exec', 'resume', 't-7', ...BYPASS, '-m', 'gpt-x', 'm']);
  assert.deepEqual(codexResumeArgv(CODEX, 't-7', 'm'), ['codex', 'exec', 'resume', 't-7', ...BYPASS, 'm']);
});

test('0289 AC3: the resume command speck says and the panel shows for a Codex build is codex exec resume', () => {
  assert.equal(CODEX_RESUME_COMMAND, "codex exec resume {session} --json --dangerously-bypass-approvals-and-sandbox '$speck-build {id}: carry on from where you left off.'");
  assert.equal(resumeCommandOf(CODEX), CODEX_RESUME_COMMAND, 'resume_command not set');
  assert.equal(resumeCommandOf({ ...CODEX, resume_command: 'claude --resume {session}' }), CODEX_RESUME_COMMAND, 'Claude Code\'s, which can\'t resume a Codex session');
  assert.equal(resumeCommandOf({ ...CODEX, resume_command: '' }), '', 'blank: only the session id');
  assert.equal(resumeCommandOf({ ...CODEX, resume_command: 'my-codex {session}' }), 'my-codex {session}', 'set: as it is');
  const hint = resumeHint({ resume_command: 'claude --resume {session}' }, { id: '0007', agent: 'codex', session: 't-7', cwd: '/tmp/x' });
  assert.equal(hint, "To carry it on, run: cd /tmp/x && codex exec resume t-7 --json --dangerously-bypass-approvals-and-sandbox '$speck-build 0007: carry on from where you left off.'");

  const r = codexRepo();
  assert.equal(statusData(r.dir).resume_command, CODEX_RESUME_COMMAND);
  const model = panelModel()({ tickets: [T('0004', 'building', { build_stopped: true, session: { id: 't-4', cwd: '/tmp/x' } })], resume_command: CODEX_RESUME_COMMAND });
  assert.equal(model.queue[0].resume.text,
    "cd /tmp/x && codex exec resume t-4 --json --dangerously-bypass-approvals-and-sandbox '$speck-build 0004: carry on from where you left off.'");
});

test('0289 AC3: the panel offers each build the resume command of the agent that ran it, whatever the builder is now', () => {
  const r = codexRepo({ status: 'blocked' }), runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const rec = agent => save(path.join(runs, '0001.json'), { id: '0001', session: 's-1', ...(agent ? { agent } : {}), cwd: '/tmp/x', pid: deadPid(), exited: '2026-10-18T10:30:00.000Z', exit_code: 0 });
  const setConfig = (from, to) => fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(from, to));
  const shown = () => {
    const state = statusData(r.dir);
    return panelModel()(state).queue[0].resume.text;
  };
  rec(null);
  assert.equal(statusData(r.dir).tickets[0].session.resume_command, DEFAULT_RESUME_COMMAND, 'a Claude Code build under a Codex builder');
  assert.match(shown(), /^cd \/tmp\/x && claude --resume s-1$/);
  rec('codex');
  assert.deepEqual(statusData(r.dir).tickets[0].session, { id: 's-1', cwd: '/tmp/x' }, 'the board\'s own command: nothing added');
  setConfig(/^builder: codex$/m, 'builder: claude');
  assert.equal(statusData(r.dir).tickets[0].session.resume_command, CODEX_RESUME_COMMAND, 'a Codex build after the builder changed to claude');
  assert.equal(statusData(r.dir).resume_command, DEFAULT_RESUME_COMMAND);
  assert.match(shown(), /^cd \/tmp\/x && codex exec resume s-1 .*'\$speck-build 0001: carry on/);
  setConfig(/^resume_command:.*$/m, 'resume_command: "my-tool {session}"');
  assert.equal(shown(), 'cd /tmp/x && my-tool s-1', 'a resume_command of their own is kept');
  const t = T('0004', 'building', { build_stopped: true, session: { id: 'abc', cwd: '/repo' } });
  assert.equal(panelModel()({ tickets: [t], resume_command: 'claude --resume {session}' }).queue[0].resume.text, 'cd /repo && claude --resume abc', 'a session without its own command takes the board\'s');
});

test('0289 AC3: speck run resumes a killed Codex build in its own session, from the folder it started in', async () => {
  const r = codexRepo({ status: 'building' }), codex = fakeCodex();
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  save(path.join(runsOf(r.dir), '0001.json'), { id: '0001', session: null, agent: 'codex', env_session: 'u-1', cwd: r.dir, started: '2026-10-18T10:00:00.000Z', pid: deadPid() });
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.log'), `${started('thread-k')}\n{"type":"turn.started"}\n`);
  const run = startRun(r.dir, codex.env({ FAKE_MS: '3000' }));
  try {
    assert.ok(await until(() => codex.calls().length >= 1, 10000), run.out());
    const c = codex.calls()[0];
    assert.deepEqual(c.args.slice(0, -1), ['exec', 'resume', 'thread-k', ...BYPASS]);
    assert.match(c.args.at(-1), /\$speck-build 0001/);
    assert.equal(fs.realpathSync(c.cwd), fs.realpathSync(r.dir));
    assert.equal(c.build, 'u-1', 'its processes still carry the build\'s UUID');
    assert.equal(read(path.join(runsOf(r.dir), '0001.json')).session, 'thread-k');
  } finally { await stopRun(run); killAll(codex.calls().map(c => c.pid)); }
});

// speck run's queue and hand-backs wired together as speck run wires them (0194), for an approved 0001 whose Codex
// build has ended with the given run record.
function wired(rec) {
  const r = shipRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  save(path.join(runs, '0001.json'), { id: '0001', agent: 'codex', env_session: 'u-1', cwd: r.wt, pid: deadPid(), exited: '2026-10-18T10:30:00.000Z', exit_code: 0, ...rec });
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', ...CODEX };
  const launches = [], starts = [], said = [];
  const log = console.log;
  const backs = handBackQueue({ repo: r.dir, cfg, words: codexStartWords(cfg), max: 1, running: new Set(),
    startBuild: (id, argv, cwd, session, flags, record, env) => starts.push({ id, argv, session, env }), resumeHint: (c, rec) => resumeHint(c, rec), runs: () => runs,
    saveRecord: save, fill: id => fillSession(runs, id, save) });
  const q = shipQueue(r.dir, cfg, { say: () => {}, launch: (repo, id, l, done) => launches.push({ id, done }), handBack: h => backs.keep(h), waiting: id => backs.waiting(id) });
  const tick = () => { console.log = s => said.push(s); try { const t = statusData(r.dir).tickets; q.check(t); backs.check(t); } finally { console.log = log; } };
  const shipFails = code => { console.log = s => said.push(s); try { launches.at(-1).done(code); } finally { console.log = log; } };
  return { r, runs, launches, starts, said, tick, shipFails };
}

test('0289 AC3: a hand-back resumes a Codex build\'s own session with the hand-back message', () => {
  const k = wired({ session: null });
  fs.writeFileSync(path.join(k.runs, '0001.log'), `${started('thread-h')}\n`);
  k.tick();
  assert.equal(k.launches.length, 1, 'the queue ships it');
  k.shipFails(13);
  k.tick();
  assert.equal(k.starts.length, 1, k.said.join('\n'));
  const { argv, session, env } = k.starts[0];
  assert.deepEqual(argv.slice(0, -1), ['codex', 'exec', 'resume', 'thread-h', ...BYPASS]);
  assert.match(argv.at(-1), /Conflict/);
  assert.equal(session, 'thread-h');
  assert.equal(env, 'u-1');
});

test('0289 AC4: a Codex build with no session id read yet is said in one line and treated as one that can\'t be resumed', async () => {
  assert.deepEqual(resumeFor([], CODEX, '0007', { agent: 'codex', session: null }), { argv: null, why: 'no session id has been read from its log yet, as Codex stopped before writing one' });
  assert.equal(resumeHint(CODEX, { id: '0007', agent: 'codex', session: null, cwd: '/tmp/x' }), 'Run /speck-build to carry it on.');

  const k = wired({ session: null });
  fs.writeFileSync(path.join(k.runs, '0001.log'), '{"type":"turn.started"}\n');
  k.tick();
  k.shipFails(13);
  k.tick();
  assert.equal(k.starts.length, 0, 'not handed back');
  const lines = k.said.filter(s => /no session id has been read/.test(s));
  assert.equal(lines.length, 1, k.said.join('\n'));
  assert.doesNotMatch(lines[0], /\n/);

  const r = codexRepo({ status: 'building' }), codex = fakeCodex();
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  save(path.join(runsOf(r.dir), '0001.json'), { id: '0001', session: null, agent: 'codex', env_session: 'u-1', cwd: r.dir, started: '2026-10-18T10:00:00.000Z', pid: deadPid() });
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.log'), '');
  const run = startRun(r.dir, codex.env());
  try {
    assert.ok(await until(() => /0001 build[^\n]*stopped unexpectedly/.test(run.out()), 10000), run.out());
    const said = run.out().split('\n').filter(l => /stopped unexpectedly/.test(l));
    assert.equal(said.length, 1, run.out());
    assert.match(said[0], /no session id has been read from its log yet[^\n]*Run \/speck-build to carry it on\./);
    assert.equal(codex.calls().length, 0, 'not resumed');
  } finally { await stopRun(run); }
});

test('0289 AC1, AC3: the brief, the setup skill and the config template name the Codex commands', () => {
  const doc = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
  for (const p of ['docs/brief.md', 'skills/speck-setup/SKILL.md'])
    assert.ok(doc(p).includes("codex exec --json --dangerously-bypass-approvals-and-sandbox '$speck-build <id>'"), p);
  assert.ok(doc('docs/brief.md').includes("codex exec resume <session> --json --dangerously-bypass-approvals-and-sandbox '<message>'"));
  assert.ok(doc('docs/brief.md').includes('thread.started'));
  assert.match(doc('templates/config.yml').split('\n').find(l => l.startsWith('builder_model:')), /Codex as -m/);
  assert.match(panelSettings(codexRepo().dir).groups.flatMap(g => g.settings).find(s => s.key === 'builder_model').explain, /Codex builds when build_command is blank/);
});

test('0289 AC5: Claude Code builds start and resume exactly as today', () => {
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}', '--output-format', 'stream-json'];
  const cfg = { builder: 'claude', build_command: words.join(' '), builder_model: 'opus' };
  assert.equal(codexBuilds(cfg), false);
  assert.deepEqual(withBuilderModel(words, cfg), [...words, '--model', 'opus']);
  const rec = { id: '0007', session: 's-1' };
  assert.deepEqual(resumeFor(words, cfg, '0007', rec).argv, resumeArgv(words, '0007', 's-1'));
  assert.deepEqual(resumeFor(words, cfg, '0007', rec, 'm').argv, ['claude', '-p', 'm', '--resume', 's-1', '--output-format', 'stream-json']);
  assert.match(resumeFor(words, cfg, '0007', rec).argv[2], /Carry on with \/speck-build 0007/);
  assert.equal(resumeFor(words, cfg, '0007', { id: '0007' }).why, 'its run record has no session');
  assert.equal(resumeFor(['claude', '-p', 'x'], cfg, '0007', rec).why, 'build_command needs --session-id {session} and one word with {id} in it');
  assert.equal(resumeCommandOf({ builder: 'claude' }), DEFAULT_RESUME_COMMAND);
  assert.equal(resumeCommandOf({ builder: 'claude', resume_command: '' }), '');
  assert.equal(resumeHint({}, { id: '0007', session: 's-1', cwd: '/tmp/x' }), 'To carry it on, run: cd /tmp/x && claude --resume s-1');
});
