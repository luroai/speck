import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, runRepo, startRun, until, stopRun, killAll } from './support/run.mjs';
import { shipRepo } from './support/ship.mjs';
import { panelModel } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { cursorBuilds, cursorCli, cursorStartWords, cursorResumeArgv, cursorResumeCommand, createChat } from '../scripts/cursor-build.mjs';
import { codexBuilds, codexStartWords, CODEX_RESUME_COMMAND } from '../scripts/codex-build.mjs';
import { resumeFor, handBackQueue, handBackMessage, resumeArgv } from '../scripts/hand-back.mjs';
import { resumeHint, resumeCommandOf, DEFAULT_RESUME_COMMAND } from '../scripts/run.mjs';
import { builderModelNote, withBuilderModel } from '../scripts/build-model.mjs';
import { doctorChecks } from '../scripts/install.mjs';

// ---------- 0290: start and resume Cursor builds from speck run ----------

const HEADLESS = ['-p', '--force', '--trust', '--output-format', 'stream-json'];
const CURSOR = { builder: 'cursor', build_command: '' };
const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const save = (f, v) => fs.writeFileSync(f, `${JSON.stringify(v, null, 2)}\n`);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// A fake Cursor CLI on a PATH of its own, named `names`. `create-chat` prints FAKE_CHAT and a newline, or with
// FAKE_CHAT_FAIL set prints it to stderr and exits 1. Any other call records its arguments, folder, pid and build
// session in <out>/<n>.json, then exits after FAKE_MS.
const FAKE = `
const fs = require('fs'), path = require('path');
const out = process.env.FAKE_OUT, args = process.argv.slice(2);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ at: Date.now(), n, args, cwd: process.cwd(), pid: process.pid, build: process.env.SPECK_BUILD_SESSION }));
if (args[0] === 'create-chat') {
  if (process.env.FAKE_CHAT_FAIL) { process.stderr.write(process.env.FAKE_CHAT_FAIL); process.exit(1); }
  process.stdout.write(process.env.FAKE_CHAT + '\\n');
  process.exit(0);
}
console.log(JSON.stringify({ type: 'system', subtype: 'init', session_id: args[args.indexOf('--resume') + 1] }));
setTimeout(() => process.exit(0), +(process.env.FAKE_MS || 0));
`;
function fakeCursor(names = ['agent']) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-out-'));
  fs.writeFileSync(path.join(bin, 'fake.cjs'), FAKE);
  for (const name of names) fs.writeFileSync(path.join(bin, name), `#!/bin/sh\nexec "${process.execPath}" "${path.join(bin, 'fake.cjs')}" "$@"\n`, { mode: 0o755 });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => read(path.join(out, f))).sort((a, b) => a.n - b.n);
  return { bin, env: o => ({ PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_OUT: out, ...o }), calls };
}

// A speck run repo with builder cursor, build_command blank and builder_model as given, its ticket 0001 in `status`.
function cursorRepo({ model = '', status = 'ready' } = {}) {
  const r = runRepo({ tickets: [['0001', { status, builder: 'cursor' }]], command: null }); // 0312: a ticket made with Cursor
  let text = fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, 'builder: cursor').replace(/^builder_model:.*$/m, '');
  text += `build_command: ""\nbuilder_model: "${model}"\n`;
  fs.writeFileSync(r.cfgFile, text);
  r.g('commit', '-qam', 'cursor builder');
  return r;
}

// Runs fn with PATH set to `dirs` only.
function withPath(dirs, fn) {
  const was = process.env.PATH;
  process.env.PATH = dirs.join(path.delimiter);
  try { return fn(); } finally { process.env.PATH = was; }
}

test('0290 AC1: with builder cursor and build_command blank, speck run builds with agent -p in a chat it made, on builder_model or auto', () => {
  assert.equal(cursorBuilds(CURSOR), true);
  assert.equal(cursorBuilds({ builder: 'cursor' }), false, 'build_command missing: speck run refuses, as before');
  assert.equal(cursorBuilds({ builder: 'cursor', build_command: 'agent -p x {id}' }), false, 'a build_command that is set is used as it is');
  assert.equal(cursorBuilds({ builder: 'claude', build_command: '' }), false);
  assert.deepEqual(cursorStartWords(CURSOR, 'agent'), ['agent', ...HEADLESS, '--model', 'auto', '--resume', '{session}', '/speck-build {id}'],
    'blank builder_model: auto, the one model every Cursor plan can use');
  assert.deepEqual(cursorStartWords({ ...CURSOR, builder_model: ' gpt-5 ' }, 'agent'), ['agent', ...HEADLESS, '--model', 'gpt-5', '--resume', '{session}', '/speck-build {id}']);
  assert.equal(builderModelNote({ ...CURSOR, builder_model: 'gpt-5' }), null, 'no note that builder_model is left out: it is passed');
  assert.match(builderModelNote({ builder: 'cursor', build_command: 'agent -p x', builder_model: 'gpt-5' }), /only passed to Claude Code builds/);
  assert.deepEqual(withBuilderModel(['agent', '-p'], { ...CURSOR, builder_model: 'gpt-5' }), ['agent', '-p']);

  assert.deepEqual(createChat('agent', '/tmp', () => ({ status: 0, stdout: 'chat-1\n', stderr: '' })), { session: 'chat-1' });
});

test('0290 AC1: speck run makes a chat with agent create-chat, keeps its id as the session and builds in it', async () => {
  const r = cursorRepo({ model: 'gpt-5' }), cursor = fakeCursor();
  const run = startRun(r.dir, cursor.env({ FAKE_CHAT: 'chat-0290', FAKE_MS: '3000' }));
  const file = path.join(runsOf(r.dir), '0001.json');
  try {
    assert.ok(await until(() => cursor.calls().length >= 2 && fs.existsSync(file) && read(file).pid, 10000), run.out());
    const [made, built] = cursor.calls();
    assert.deepEqual(made.args, ['create-chat']);
    assert.equal(fs.realpathSync(made.cwd), fs.realpathSync(r.dir), 'the chat is made where the build runs');
    assert.deepEqual(built.args, [...HEADLESS, '--model', 'gpt-5', '--resume', 'chat-0290', '/speck-build 0001']);
    const rec = read(file);
    assert.equal(rec.session, 'chat-0290');
    assert.equal(rec.agent, 'cursor');
    assert.equal(built.build, 'chat-0290', 'its processes carry the session pause and stop look for');
    assert.match(run.out(), /Launched 0001 \(session chat-0290\)/);
    assert.doesNotMatch(run.out(), /builder_model/, run.out());
  } finally { await stopRun(run); killAll(cursor.calls().map(c => c.pid)); }
});

test('0290 AC2: a killed or handed-back Cursor build carries on its chat with agent -p --resume', () => {
  const rec = { id: '0007', agent: 'cursor', session: 'chat-7' };
  const killed = resumeFor([], CURSOR, '0007', rec).argv;
  assert.deepEqual(killed.slice(0, -1), [cursorCli(), ...HEADLESS, '--resume', 'chat-7']);
  assert.match(killed.at(-1), /stopped unexpectedly[\s\S]*\/speck-build 0007/);
  const message = handBackMessage({ id: '0007', kind: 'conflict', why: 'merge conflict', base: 'main', count: 1 });
  assert.deepEqual(resumeFor([], { ...CURSOR, builder_model: 'gpt-5' }, '0007', rec, message).argv, [cursorCli(), ...HEADLESS, '--resume', 'chat-7', message],
    'a chat keeps the model it started on');
  assert.deepEqual(cursorResumeArgv('chat-7', 'm', 'cursor-agent'), ['cursor-agent', ...HEADLESS, '--resume', 'chat-7', 'm']);
  assert.equal(cursorResumeArgv(null, 'm', 'agent'), null);
  assert.equal(resumeFor([], CURSOR, '0007', { agent: 'cursor', session: null }).why, 'its run record has no session');
});

test('0290 AC2: the resume command speck says and the panel shows for a Cursor build is agent -p --resume', () => {
  const cmd = "agent -p --force --trust --output-format stream-json --resume {session} '/speck-build {id}: carry on from where you left off.'";
  assert.equal(cursorResumeCommand('agent'), cmd);
  assert.equal(resumeCommandOf(CURSOR, 'cursor').replace(/^cursor-agent /, 'agent '), cmd, 'resume_command not set');
  assert.equal(resumeCommandOf({ ...CURSOR, resume_command: 'claude --resume {session}' }, 'cursor').replace(/^cursor-agent /, 'agent '), cmd, 'Claude Code\'s, which can\'t resume a Cursor chat');
  assert.equal(resumeCommandOf({ ...CURSOR, resume_command: '' }, 'cursor'), '', 'blank: only the session id');
  assert.equal(resumeCommandOf({ ...CURSOR, resume_command: 'my-agent {session}' }, 'cursor'), 'my-agent {session}', 'set: as it is');
  const hint = withPath([fakeCursor(['agent']).bin], () => resumeHint({ resume_command: 'claude --resume {session}' }, { id: '0007', agent: 'cursor', session: 'chat-7', cwd: '/tmp/x' }));
  assert.equal(hint, "To carry it on, run: cd /tmp/x && agent -p --force --trust --output-format stream-json --resume chat-7 '/speck-build 0007: carry on from where you left off.'");

  const r = cursorRepo({ status: 'blocked' }), runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  save(path.join(runs, '0001.json'), { id: '0001', session: 'chat-1', agent: 'cursor', cwd: '/tmp/x', pid: deadPid(), exited: '2026-10-18T10:30:00.000Z', exit_code: 0 });
  const state = statusData(r.dir);
  assert.equal(state.resume_command, resumeCommandOf(CURSOR, 'cursor'), 'the board\'s command for a Cursor builder');
  assert.match(panelModel()(state).queue[0].resume.text, /^cd \/tmp\/x && (cursor-)?agent -p --force --trust --output-format stream-json --resume chat-1 '\/speck-build 0001: carry on/);
  fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder: cursor$/m, 'builder: claude'));
  assert.match(statusData(r.dir).tickets[0].session.resume_command, /--resume \{session\}/, 'a Cursor build after the builder changed to claude keeps its own command');
  assert.match(panelModel()(statusData(r.dir)).queue[0].resume.text, /^cd \/tmp\/x && (cursor-)?agent -p /);
});

test('0290 AC2: speck run resumes a killed Cursor build in its own chat, from the folder it started in', async () => {
  const r = cursorRepo({ status: 'building' }), cursor = fakeCursor();
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  save(path.join(runsOf(r.dir), '0001.json'), { id: '0001', session: 'chat-k', agent: 'cursor', cwd: r.dir, started: '2026-10-18T10:00:00.000Z', pid: deadPid() });
  fs.writeFileSync(path.join(runsOf(r.dir), '0001.log'), '');
  const run = startRun(r.dir, cursor.env({ FAKE_MS: '3000' }));
  try {
    assert.ok(await until(() => cursor.calls().length >= 1, 10000), run.out());
    const c = cursor.calls()[0];
    assert.deepEqual(c.args.slice(0, -1), [...HEADLESS, '--resume', 'chat-k']);
    assert.match(c.args.at(-1), /\/speck-build 0001/);
    assert.equal(fs.realpathSync(c.cwd), fs.realpathSync(r.dir));
    assert.equal(c.build, 'chat-k');
  } finally { await stopRun(run); killAll(cursor.calls().map(c => c.pid)); }
});

test('0290 AC2: a hand-back resumes a Cursor build\'s chat with the hand-back message', () => {
  const r = shipRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  save(path.join(runs, '0001.json'), { id: '0001', agent: 'cursor', session: 'chat-h', cwd: r.wt, pid: deadPid(), exited: '2026-10-18T10:30:00.000Z', exit_code: 0 });
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', ...CURSOR };
  const launches = [], starts = [], said = [], log = console.log;
  const backs = handBackQueue({ repo: r.dir, cfg, words: cursorStartWords(cfg, 'agent'), max: 1, running: new Set(),
    startBuild: (id, argv, cwd, session, flags, record, env) => starts.push({ id, argv, session, env }), resumeHint: (c, rec) => resumeHint(c, rec), runs: () => runs, saveRecord: save });
  const q = shipQueue(r.dir, cfg, { say: () => {}, launch: (repo, id, l, done) => launches.push({ id, done }), handBack: h => backs.keep(h), waiting: id => backs.waiting(id) });
  const quietly = fn => { console.log = s => said.push(s); try { fn(); } finally { console.log = log; } };
  const tick = () => quietly(() => { const t = statusData(r.dir).tickets; q.check(t); backs.check(t); });
  tick();
  assert.equal(launches.length, 1, 'the queue ships it');
  quietly(() => launches.at(-1).done(13));
  tick();
  assert.equal(starts.length, 1, said.join('\n'));
  const { argv, session, env } = starts[0];
  assert.deepEqual(argv.slice(0, -1), [cursorCli(), ...HEADLESS, '--resume', 'chat-h']);
  assert.match(argv.at(-1), /Conflict/);
  assert.equal(session, 'chat-h');
  assert.equal(env, 'chat-h');
});

test('0290 AC3: speck finds Cursor\'s CLI as agent, or as cursor-agent when only that is installed', () => {
  const both = fakeCursor(['agent', 'cursor-agent']).bin, old = fakeCursor(['cursor-agent']).bin, none = fs.mkdtempSync(path.join(os.tmpdir(), 'no-cursor-'));
  assert.equal(withPath([both], cursorCli), 'agent');
  assert.equal(withPath([old], cursorCli), 'cursor-agent');
  assert.equal(withPath([none], cursorCli), 'agent', 'neither: agent, so the error names the CLI Cursor installs today');
  assert.deepEqual(withPath([old], () => cursorStartWords(CURSOR)).slice(0, 2), ['cursor-agent', '-p']);
  assert.equal(withPath([old], () => resumeFor([], CURSOR, '0007', { agent: 'cursor', session: 'c' }, 'm').argv[0]), 'cursor-agent');
  assert.match(withPath([old], () => resumeCommandOf(CURSOR, 'cursor')), /^cursor-agent -p /);
  const cursorCheck = dirs => withPath(dirs, () => doctorChecks(ROOT, { builder: 'cursor' }, 'linux')).find(c => /Cursor CLI/.test(c.name));
  assert.equal(cursorCheck([fakeCursor(['agent']).bin]).ok, true, 'doctor: agent alone');
  assert.equal(cursorCheck([old]).ok, true, 'doctor: cursor-agent alone');
  assert.equal(cursorCheck([none]).ok, false);
});

test('0290 AC4: when agent create-chat fails, speck run says why in one line, doesn\'t start the build and leaves it ready', async () => {
  const fails = r => createChat('agent', '/tmp', () => r);
  assert.match(fails({ status: 1, stdout: '', stderr: 'Not signed in.\nRun agent login.\n' }).why, /^agent create-chat failed: Not signed in\. Run agent login\.$/);
  assert.match(fails({ status: 0, stdout: '', stderr: '' }).why, /printed no chat id/);
  assert.match(fails({ status: 0, stdout: 'Welcome!\nchat-1\n', stderr: '' }).why, /printed no chat id/, 'anything but one id');
  assert.match(fails({ error: Object.assign(new Error('spawn agent ENOENT'), { code: 'ENOENT' }) }).why, /Cursor's CLI isn't installed/);
  assert.match(fails({ error: Object.assign(new Error('spawnSync agent ETIMEDOUT'), { code: 'ETIMEDOUT' }) }).why, /didn't answer/);
  assert.match(fails({ status: null, signal: 'SIGKILL', stdout: '', stderr: '' }).why, /SIGKILL/);
  for (const r of [{ status: 1, stdout: '', stderr: '' }, { status: 1, stdout: '', stderr: 'a\n\n  b  ' }]) assert.doesNotMatch(fails(r).why, /\n/);

  const r = cursorRepo(), cursor = fakeCursor();
  const run = startRun(r.dir, cursor.env({ FAKE_CHAT_FAIL: 'Not signed in.\nRun agent login.' }));
  try {
    assert.ok(await until(() => /0001 wasn't started/.test(run.out()), 10000), run.out());
    assert.ok(await until(() => cursor.calls().length >= 3, 10000), 'tried again on later checks');
    const lines = run.out().split('\n').filter(l => l.includes('0001'));
    assert.equal(lines.length, 1, run.out());
    assert.match(lines[0], /agent create-chat failed: Not signed in\. Run agent login\./);
    assert.ok(cursor.calls().every(c => c.args[0] === 'create-chat'), 'no build started');
    assert.equal(fs.existsSync(path.join(runsOf(r.dir), '0001.json')), false, 'no run record');
    assert.equal(statusData(r.dir).tickets[0].status, 'ready');
  } finally { await stopRun(run); }
});

test('0290 AC5: Codex and Claude Code builds start and resume as they do with 0289', () => {
  const CODEX = { builder: 'codex', build_command: '' };
  assert.equal(cursorBuilds(CODEX), false);
  assert.equal(codexBuilds(CODEX), true);
  assert.deepEqual(codexStartWords(CODEX), ['codex', 'exec', '--json', '--dangerously-bypass-approvals-and-sandbox', '$speck-build {id}']);
  assert.deepEqual(resumeFor([], CODEX, '0007', { agent: 'codex', session: 't-7' }, 'm').argv, ['codex', 'exec', 'resume', 't-7', '--json', '--dangerously-bypass-approvals-and-sandbox', 'm']);
  assert.equal(resumeCommandOf(CODEX), CODEX_RESUME_COMMAND);
  assert.equal(resumeHint({}, { id: '0007', agent: 'codex', session: 't-7', cwd: '/tmp/x' }), `To carry it on, run: cd /tmp/x && ${CODEX_RESUME_COMMAND.replace('{session}', 't-7').replace('{id}', '0007')}`);

  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}', '--output-format', 'stream-json'];
  const cfg = { builder: 'claude', build_command: words.join(' ') };
  assert.equal(cursorBuilds(cfg), false);
  assert.deepEqual(resumeFor(words, cfg, '0007', { id: '0007', session: 's-1' }).argv, resumeArgv(words, '0007', 's-1'));
  assert.equal(resumeCommandOf({ builder: 'claude' }), DEFAULT_RESUME_COMMAND);
  assert.equal(resumeCommandOf({ builder: 'cursor', build_command: 'agent -p {id}' }), DEFAULT_RESUME_COMMAND, 'a Cursor build_command of their own: as today');
  assert.equal(resumeHint({}, { id: '0007', session: 's-1', cwd: '/tmp/x' }), 'To carry it on, run: cd /tmp/x && claude --resume s-1');
});

test('0290 AC1, AC2: the brief and the config template name the Cursor commands', () => {
  const doc = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const brief = doc('docs/brief.md');
  assert.ok(brief.includes('agent create-chat'));
  assert.ok(brief.includes("agent -p --force --trust --output-format stream-json --resume <session> '/speck-build <id>'"));
  assert.ok(brief.includes("agent -p --force --trust --output-format stream-json --resume <session> '<message>'"));
  assert.ok(brief.includes('`cursor-agent`'));
  assert.match(doc('templates/config.yml').split('\n').find(l => l.startsWith('builder_model:')), /Cursor as --model/);
});
