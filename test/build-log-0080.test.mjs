import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readableLog } from '../scripts/speck.mjs';
import { panelRepo, freePort, startPanel, stop, request } from './support/panel.mjs';
import { runRepo, startRun, until, killAll, stopRun, leftRunning } from './support/run.mjs';

// ---------- 0080: show when each build log entry happened ----------

// A fixed zone, half an hour off UTC and with no summer time, so the expected local times are the same everywhere.
const TZ = 'Asia/Kolkata';
process.env.TZ = TZ;

const ev = o => JSON.stringify(o);
const AT = '2026-10-10T11:56:45.034Z'; // 17:26:45 in Kolkata
const LATE = '2026-10-10T20:05:09.000Z'; // 01:35:09 the next day there
const text = (t, timestamp) => ev({ type: 'assistant', timestamp, message: { content: [{ type: 'text', text: t }] } });
const tool = (name, input, timestamp) => ev({ type: 'assistant', timestamp, message: { content: [{ type: 'tool_use', name, input }] } });
const failed = (content, timestamp) => ev({ type: 'user', timestamp, message: { content: [{ type: 'tool_result', is_error: true, content }] } });
const timed = t => readableLog(t, { times: true });

const writeLog = (dir, id, t) => {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, `${id}.log`), t);
};
const getJson = async (port, pathName) => {
  const res = await request(port, { pathName });
  assert.equal(res.status, 200, res.body);
  return JSON.parse(res.body);
};

test('0080 AC1: agent messages, tool calls and failed tool results start with their local time as HH:MM:SS and a space', () => {
  const log = [
    text('Reading the ticket.', AT),
    tool('Bash', { description: 'Run the tests' }, AT),
    failed('File not found', LATE),
    tool('Read', { file_path: '/x' }, LATE),
  ].join('\n');
  assert.equal(timed(log), ['17:26:45 Reading the ticket.', '', '17:26:45 → Bash: Run the tests', '01:35:09   ✗ File not found', '01:35:09 → Read: /x'].join('\n'));
});

test('0080 AC1: each block of one event gets the event\'s time', () => {
  const log = ev({ type: 'assistant', timestamp: AT, message: { content: [{ type: 'text', text: 'Testing.' }, { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] } });
  assert.equal(timed(log), ['17:26:45 Testing.', '', '17:26:45 → Bash: npm test'].join('\n'));
});

test('0080 AC2: only the first line of a multi-line message is timed, and blank lines, the result and plain lines are not', () => {
  const log = [
    'Plain output from the builder',
    text('First line.\n\nThird line.\nFourth line.', AT),
    ev({ type: 'system', subtype: 'init', timestamp: AT }),
    ev({ type: 'result', subtype: 'error_max_turns', is_error: true, result: 'Stopped early.' }),
  ].join('\n');
  assert.equal(timed(log), ['Plain output from the builder', '17:26:45 First line.', '', 'Third line.', 'Fourth line.', '', 'Stopped early.', 'Build ended: error_max_turns'].join('\n'));
});

test('0080 AC2: a result that repeats the last message is still left out', () => {
  const log = [text('Shipped.', AT), ev({ type: 'result', subtype: 'success', result: 'Shipped.' })].join('\n');
  assert.equal(timed(log), ['17:26:45 Shipped.', ''].join('\n'));
});

test('0080 AC3: an event with a missing or unreadable timestamp shows without a time, and the rest as before', () => {
  for (const bad of [undefined, null, '', '1', 'yesterday', '2026-13-45T99:00:00Z', 'not-a-dateT00:00Z', 12345, {}, ['2026-10-10T11:56:45Z'], true]) {
    const log = [text('Before.', AT), tool('Bash', { command: 'ls' }, bad), failed('nope', bad), text('After.', LATE)].join('\n');
    assert.equal(timed(log), ['17:26:45 Before.', '', '→ Bash: ls', '  ✗ nope', '01:35:09 After.', ''].join('\n'), JSON.stringify(bad));
  }
});

test('0080 AC1, AC2: the panel\'s build log box gets the times, with trailing blank lines still dropped', async () => {
  const r = panelRepo();
  writeLog(r.dir, '0001', [text('Reading the ticket.', AT), tool('Bash', { command: 'npm test' }, LATE), ev({ type: 'result', subtype: 'success', result: 'Done.' }), ''].join('\n'));
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)], undefined, { TZ });
  try {
    assert.deepEqual(await getJson(port, '/api/tickets/0001/log'), { text: ['17:26:45 Reading the ticket.', '', '01:35:09 → Bash: npm test', 'Done.'].join('\n'), truncated: false });
  } finally { await stop(p); }
});

test('0080 AC4: without asking for times, the log reads as before', () => {
  const log = [text('Reading the ticket.', AT), tool('Bash', { command: 'npm test' }, AT), failed('nope', AT)].join('\n');
  assert.equal(readableLog(log), ['Reading the ticket.', '', '→ Bash: npm test', '  ✗ nope'].join('\n'));
});

test('0080 AC4: the failure message under a queue row has no times', async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  writeLog(r.dir, '0001', [text('Reading the ticket.', AT), tool('Bash', { command: 'npm test' }, AT), failed('nope', AT)].join('\n'));
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: 's', started: AT, exited: LATE, exit_code: 1 }));
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)], undefined, { TZ });
  try {
    const state = await getJson(port, '/api/state');
    const t = state.tickets.find(x => x.id === '0001');
    assert.equal(t.build_exit.message, ['Reading the ticket.', '', '→ Bash: npm test', '  ✗ nope'].join('\n'));
  } finally { await stop(p); }
});

test('0080 AC4: speck run\'s report of a build\'s last log lines has no times', async () => {
  const r = runRepo();
  const b = leftRunning(r.dir, '0001');
  writeLog(r.dir, '0001', [text('Reading the ticket.', AT), tool('Bash', { command: 'npm test' }, AT)].join('\n'));
  const run = startRun(r.dir, { TZ });
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    process.kill(b.pid, 'SIGKILL');
    assert.ok(await until(() => /won't launch it again/i.test(run.out())), run.out());
    const out = run.out();
    const tail = out.slice(out.search(/0001 is still ready/i));
    assert.match(tail, /^→ Bash: npm test$/m, out);
    assert.match(tail, /^Reading the ticket\.$/m, out);
    assert.doesNotMatch(tail, /\d\d:\d\d:\d\d/, out);
  } finally { await stopRun(run); killAll([b.pid, ...r.calls().map(c => c.pid)]); }
});
