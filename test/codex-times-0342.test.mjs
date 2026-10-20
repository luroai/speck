import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readableLog, readablePiece } from '../scripts/build-log.mjs';
import { stampLine, timedCommand, codexStartWords, codexResumeArgv, TIME_FIELD } from '../scripts/codex-build.mjs';
import { buildProcesses, signalBuild, carryOn } from '../scripts/build-procs.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';
import { until, alive, killAll } from './support/run.mjs';

// ---------- 0342: show when each Codex build log entry happened ----------

// A fixed zone, half an hour off UTC and with no summer time, so the expected local times are the same everywhere.
process.env.TZ = 'Asia/Kolkata';

const TIMES = fileURLToPath(new URL('../scripts/codex-times.mjs', import.meta.url));
const AT = '2026-10-10T11:56:45.034Z'; // 17:26:45 in Kolkata
const LATE = '2026-10-10T20:05:09.000Z'; // 01:35:09 the next day there
const log = events => events.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n');
const timed = events => readablePiece(log(events), { times: true }).lines;
const item = (i, at) => ({ ...(at === undefined ? {} : { speck_at: at }), type: 'item.completed', item: { id: 'item_1', ...i } });
const CLOCK = /^\d\d:\d\d:\d\d /;

// A fake Codex: writes a thread.started line, a line that isn't JSON, a line to stderr, a JSON line in two pieces, then
// an agent message every FAKE_GAP ms up to FAKE_N, then exits with FAKE_CODE. Asked to end, it says so, then ends
// the way it was asked to.
const FAKE = `
const say = text => console.log(JSON.stringify({ type: 'item.completed', item: { id: 'i', type: 'agent_message', text } }));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 't-1' }));
console.log('plain words');
console.error('to stderr');
process.stdout.write('{"type":"turn.sta');
let tick = null;
setTimeout(() => {
  process.stdout.write('rted"}\\n');
  let n = 0;
  tick = setInterval(() => { say('step ' + ++n); if (n >= +(process.env.FAKE_N || 3)) { clearInterval(tick); process.exitCode = +(process.env.FAKE_CODE || 0); } }, +(process.env.FAKE_GAP || 20));
}, 30);
process.on('SIGTERM', () => { clearInterval(tick); say('stopping'); process.removeAllListeners('SIGTERM'); setTimeout(() => process.kill(process.pid, 'SIGTERM'), 20); });
`;
function fakeDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-times-'));
  fs.writeFileSync(path.join(dir, 'fake.cjs'), FAKE);
  fs.writeFileSync(path.join(dir, 'codex'), `#!/bin/sh\nexec "${process.execPath}" "${path.join(dir, 'fake.cjs')}" "$@"\n`, { mode: 0o755 });
  return dir;
}
// Starts the fake Codex as speck run starts a Codex build: timedCommand, detached, its output to a log of its own.
function startTimed(env = {}) {
  const dir = fakeDir(), logFile = path.join(dir, 'build.log');
  const session = `s-${process.pid}-${Date.now()}`;
  const [cmd, args] = timedCommand(['codex', 'exec', '--json', '$speck-build 0001']);
  const fd = fs.openSync(logFile, 'w');
  const child = spawn(cmd, args, { detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}`, [BUILD_ENV]: session, ...env } });
  fs.closeSync(fd);
  const exited = new Promise(r => child.on('exit', (code, signal) => r({ code, signal })));
  return { child, logFile, session, exited, text: () => fs.readFileSync(logFile, 'utf8') };
}
const jsonLines = text => text.split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));

test('0342 AC1: each Codex agent message, command and file change line begins with its local time as HH:MM:SS and a space', () => {
  assert.deepEqual(timed([
    { speck_at: AT, type: 'thread.started', thread_id: 't' },
    item({ type: 'agent_message', text: 'I will run the tests.' }, AT),
    item({ type: 'command_execution', command: "/bin/bash -lc 'npm test'", exit_code: 1, status: 'failed' }, LATE),
    item({ type: 'file_change', changes: [{ path: 'a.js', kind: 'update' }, { path: 'b.js', kind: 'add' }], status: 'completed' }, AT),
  ]), ['17:26:45 I will run the tests.', '', '01:35:09 → Bash: npm test', '  ✗ exit code 1', '17:26:45 → Edit: a.js', '17:26:45 → Write: b.js']);
});

test('0342 AC1: without times asked for, or with no usable speck_at, Codex lines carry no time and show as before', () => {
  const events = at => [item({ type: 'agent_message', text: 'Hi.' }, at), item({ type: 'command_execution', command: 'ls', exit_code: 0 }, at)];
  assert.deepEqual(readablePiece(log(events(AT))).lines, ['Hi.', '', '→ Bash: ls']);
  assert.equal(readableLog(log(events(AT))), 'Hi.\n\n→ Bash: ls');
  for (const bad of [undefined, null, 'soon', '2026-13-45T99:99:99Z', 1792511607818, {}, []]) {
    assert.deepEqual(timed(events(bad)), ['Hi.', '', '→ Bash: ls'], JSON.stringify(bad) ?? 'missing');
  }
});

test('0342 AC1: stampLine adds speck_at to a JSON object line and leaves every other line as it is', () => {
  assert.deepEqual(JSON.parse(stampLine('{"type":"turn.started"}', AT)), { [TIME_FIELD]: AT, type: 'turn.started' });
  assert.deepEqual(JSON.parse(stampLine('{}', AT)), { speck_at: AT });
  assert.deepEqual(JSON.parse(stampLine('{ }', AT)), { speck_at: AT });
  for (const line of ['', 'plain words', '{not json', '[1,2]', '{"speck_at":"x","type":"a"}', 'null']) assert.equal(stampLine(line, AT), line);
  assert.deepEqual(JSON.parse(stampLine('{"__proto__":{"x":1},"constructor":2}', AT)), JSON.parse(`{"speck_at":"${AT}","__proto__":{"x":1},"constructor":2}`));
});

test('0342 AC1: a Codex build started as speck run starts it writes each JSON line with the time it was written', async () => {
  const before = Date.now();
  const b = startTimed();
  assert.deepEqual(await b.exited, { code: 0, signal: null });
  const after = Date.now(), text = b.text();
  const events = jsonLines(text);
  assert.deepEqual(events.map(e => e.type), ['thread.started', 'turn.started', 'item.completed', 'item.completed', 'item.completed']);
  for (const e of events) {
    const t = Date.parse(e.speck_at);
    assert.ok(t >= before - 5 && t <= after + 5, e.speck_at);
  }
  assert.match(text, /^plain words$/m);
  assert.match(text, /^to stderr$/m);
  const shown = readableLog(text, { times: true }).split('\n').filter(l => l.includes('step'));
  assert.equal(shown.length, 3);
  for (const l of shown) assert.match(l, /^\d\d:\d\d:\d\d step \d$/);
});

// Starts the fake Codex through its times from a process that ends at once, as speck run stopping or switching to new
// code would, so it's no child of this one. Returns its pid, the session in its environment and its log.
function startDetached(env = {}) {
  const dir = fakeDir(), logFile = path.join(dir, 'build.log');
  const session = `s-${process.pid}-${Date.now()}`;
  const starter = `
    const fs = require('fs'), { spawn } = require('child_process');
    const fd = fs.openSync(${JSON.stringify(logFile)}, 'w');
    const c = spawn(${JSON.stringify(process.execPath)}, [${JSON.stringify(TIMES)}, 'codex', 'exec', '--json'], { detached: true, stdio: ['ignore', fd, fd] });
    c.unref(); console.log(c.pid); process.exit(0);`;
  const r = spawnSync(process.execPath, ['-e', starter], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}`, [BUILD_ENV]: session, ...env } });
  assert.equal(r.status, 0, r.stderr);
  return { pid: Number(r.stdout.trim()), session, ended: Date.now(), text: () => fs.readFileSync(logFile, 'utf8') };
}

test('0342 AC2: a Codex build keeps running, and its later lines keep getting times, after what started it has ended', async () => {
  const b = startDetached({ FAKE_N: '5', FAKE_GAP: '60' });
  try {
    assert.ok(alive(b.pid), 'the build is still running after its starter ended');
    await until(() => b.text().includes('step 5'));
    const later = jsonLines(b.text()).filter(e => e.item?.text?.startsWith('step'));
    assert.equal(later.length, 5);
    for (const e of later) assert.ok(Date.parse(e.speck_at) >= b.ended - 5, `${e.item.text} at ${e.speck_at}`);
  } finally { killAll(buildProcesses(b.pid, b.session)); }
});

test('0342 AC3: pausing, carrying on and stopping a Codex build reach it and its times, and its last lines keep theirs', async () => {
  const b = startDetached({ FAKE_N: '1000', FAKE_GAP: '20' });
  try {
    await until(() => b.text().includes('step 2'));
    const found = buildProcesses(b.pid, b.session);
    assert.ok(found.includes(b.pid) && found.length >= 2, `found ${found}`);
    const rec = { pid: b.pid, rec: { env_session: b.session } };
    const paused = signalBuild(rec, 'SIGSTOP');
    assert.equal(paused.error, null);
    assert.ok(paused.sent.includes(b.pid) && paused.sent.length >= 2);
    await new Promise(r => setTimeout(r, 100));
    const size = b.text().length;
    await new Promise(r => setTimeout(r, 200));
    assert.equal(b.text().length, size, 'nothing is written while it is paused');
    carryOn(paused.sent);
    await until(() => b.text().length > size);
    assert.equal(signalBuild(rec, 'SIGTERM').error, null);
    await until(() => !alive(b.pid));
    const last = jsonLines(b.text()).at(-1);
    assert.equal(last.item.text, 'stopping');
    assert.ok(!Number.isNaN(Date.parse(last.speck_at)), 'its last line, written as it was stopped, has its time');
  } finally { killAll(buildProcesses(b.pid, b.session)); }
});

test('0342 AC3: a Codex build ends as it was ended: by the same signal, or with its own exit code', async () => {
  const b = startTimed({ FAKE_N: '1000' });
  await until(() => b.text().includes('step 1'));
  process.kill(-b.child.pid, 'SIGTERM'); // the whole build, as speck stop signals it
  assert.deepEqual(await b.exited, { code: null, signal: 'SIGTERM' });
  assert.equal(jsonLines(b.text()).at(-1).item.text, 'stopping');
});

test('0342 AC3: a Codex build exits with its own exit code, and one that cannot start says why', async () => {
  const b = startTimed({ FAKE_CODE: '3', FAKE_N: '1' });
  assert.deepEqual(await b.exited, { code: 3, signal: null });
  const r = spawnSync(process.execPath, [TIMES, path.join(os.tmpdir(), 'no-such-codex-0342')], { encoding: 'utf8' });
  assert.equal(r.status, 127);
  assert.match(r.stderr, /couldn't start .*no-such-codex-0342: .*ENOENT/);
});

test('0342 AC3: starting, resuming and handing back a Codex build all go through its times', () => {
  const cfg = { builder: 'codex', build_command: '' };
  for (const argv of [codexStartWords(cfg), codexResumeArgv(cfg, 'sess-1', 'carry on'), ['/usr/local/bin/codex', 'exec', '--json']]) {
    assert.deepEqual(timedCommand(argv), [process.execPath, [TIMES, ...argv]]);
  }
});

test('0342 AC4: Claude Code and Cursor builds start as before, and their lines take their times from their own events', () => {
  for (const argv of [['claude', '-p', '/speck-build 0001'], ['/opt/bin/claude', '-p'], ['agent', '-p', '--output-format', 'stream-json'], ['codexx'], ['sh', '-c', 'codex exec']]) {
    assert.deepEqual(timedCommand(argv), [argv[0], argv.slice(1)]);
  }
  const claude = { type: 'assistant', timestamp: AT, speck_at: LATE, message: { content: [{ type: 'text', text: 'Hi.' }, { type: 'tool_use', name: 'Bash', input: { command: 'ls' } }] } };
  const cursor = { type: 'assistant', timestamp_ms: Date.parse(LATE), speck_at: AT, message: { content: [{ type: 'text', text: 'Yo.' }] } };
  assert.deepEqual(timed([claude, cursor]), ['17:26:45 Hi.', '', '17:26:45 → Bash: ls', '01:35:09 Yo.', '']);
  assert.ok(timed([{ type: 'assistant', message: { content: [{ type: 'text', text: 'No time.' }] } }]).every(l => !CLOCK.test(l)));
});

test('0342 AC3: a Codex build that leaves a process holding its output still ends, soon after it exits', async () => {
  const left = `require('child_process').spawn(process.execPath, ['-e', 'setTimeout(() => {}, 8000)'], { stdio: ['ignore', 'inherit', 'ignore'], detached: true }).unref(); console.log('{"type":"turn.started"}');`;
  const started = Date.now();
  const c = spawn(process.execPath, [TIMES, process.execPath, '-e', left], { stdio: ['ignore', 'pipe', 'ignore'] });
  let out = '';
  c.stdout.on('data', d => { out += d; });
  const [code] = await new Promise(r => c.on('exit', (...a) => r(a)));
  c.stdout.destroy(); // the process it left still holds it
  assert.equal(code, 0);
  assert.ok(Date.now() - started < 6000, 'it ended without waiting for the process it left');
  assert.equal(JSON.parse(out.split('\n')[0]).type, 'turn.started');
});
