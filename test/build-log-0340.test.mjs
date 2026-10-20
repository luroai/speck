import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readableLog, readablePiece } from '../scripts/build-log.mjs';

// ---------- 0340: show when each Cursor build log entry happened ----------

// A fixed zone, half an hour off UTC and with no summer time, so the expected local times are the same everywhere.
process.env.TZ = 'Asia/Kolkata';

const AT = Date.parse('2026-10-10T11:56:45.034Z'); // 17:26:45 in Kolkata
const LATE = Date.parse('2026-10-10T20:05:09.000Z'); // 01:35:09 the next day there
const log = events => events.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n');
const timed = events => readablePiece(log(events), { times: true }).lines;

// Cursor events, shaped as `agent -p --output-format stream-json` writes them.
const said = (text, timestamp_ms) => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] }, session_id: 's', ...(timestamp_ms === undefined ? {} : { timestamp_ms }) });
const shell = (subtype, command, result, timestamp_ms) => ({ type: 'tool_call', subtype, call_id: `c-${command}`, session_id: 's',
  tool_call: { shellToolCall: { args: { command }, ...(result ? { result } : {}) } }, ...(timestamp_ms === undefined ? {} : { timestamp_ms }) });
const result = text => ({ type: 'result', subtype: 'success', is_error: false, result: text, session_id: 's', usage: { inputTokens: 1, outputTokens: 1 } });

test('0340 AC1: a Cursor agent message and a shell command starting begin with their local time as HH:MM:SS and a space', () => {
  assert.deepEqual(timed([
    said('I will run the tests.', AT),
    shell('started', 'npm test', null, LATE),
  ]), ['17:26:45 I will run the tests.', '', '01:35:09 → Bash: npm test']);
});

test('0340 AC1: without times asked for, Cursor lines carry no time', () => {
  assert.deepEqual(readablePiece(log([said('Hi.', AT), shell('started', 'ls', null, AT)])).lines, ['Hi.', '', '→ Bash: ls']);
});

test('0340 AC2: a Cursor event with no timestamp_ms, or one that is not a usable number, has no time and the rest shows as before', () => {
  // JSON has no NaN or Infinity, so a number out of a date's range stands in for an unusable one.
  for (const bad of [undefined, null, '1792511607818', 'soon', 1e20, -1e20, true, {}, []]) {
    assert.deepEqual(timed([said('Starting.', bad), shell('started', 'ls', null, bad), said('Then this.', AT)]),
      ['Starting.', '', '→ Bash: ls', '17:26:45 Then this.', ''], JSON.stringify(bad) ?? 'missing');
  }
});

test('0340 AC3: other lines of a multi-line message, blank lines, a failed command\'s ✗ line and the result get no time', () => {
  assert.deepEqual(timed([
    said('First line.\n\nThird line.', AT),
    shell('started', 'false', null, AT),
    shell('completed', 'false', { success: { exitCode: 1, stdout: '', stderr: '' } }, AT),
    shell('started', 'nope', null, AT),
    shell('completed', 'nope', { failure: { message: 'no' } }, AT),
    { type: 'result', subtype: 'error', is_error: true, result: 'Gave up.', session_id: 's', usage: { inputTokens: 1 }, timestamp_ms: AT },
  ]).join('\n'), [
    '17:26:45 First line.', '', 'Third line.', '',
    '17:26:45 → Bash: false', '  ✗ exit code 1',
    '17:26:45 → Bash: nope', '  ✗ failed',
    'Gave up.', 'Build ended: error',
  ].join('\n'));
});

test('0340 AC3: a Cursor result that ends with the last message is still left out', () => {
  assert.deepEqual(timed([said('All done.', AT), result('Working. All done.')]), ['17:26:45 All done.', '']);
});

test('0340 AC4: Claude Code and Codex build logs show exactly as before', () => {
  const claude = log([
    { type: 'assistant', timestamp: '2026-10-10T11:56:45.034Z', message: { content: [{ type: 'text', text: 'Reading.' }, { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] } },
    { type: 'user', timestamp: '2026-10-10T20:05:09.000Z', message: { content: [{ type: 'tool_result', is_error: true, content: 'boom' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'No time here.' }] } },
    { type: 'result', subtype: 'success', result: 'Done.' },
  ]);
  assert.equal(readableLog(claude, { times: true }), ['17:26:45 Reading.', '', '17:26:45 → Bash: npm test', '01:35:09   ✗ boom', 'No time here.', '', 'Done.'].join('\n'));
  const codex = log([
    { type: 'item.completed', item: { type: 'agent_message', text: 'I will run the tests.' } },
    { type: 'item.completed', item: { type: 'command_execution', command: "/bin/bash -lc 'false'", exit_code: 1 } },
    { type: 'turn.failed', error: { message: 'stopped' } },
  ]);
  assert.equal(readableLog(codex, { times: true }), ['I will run the tests.', '', '→ Bash: false', '  ✗ exit code 1', 'Build ended: stopped'].join('\n'));
});
