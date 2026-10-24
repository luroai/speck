import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readableLog, readablePiece, logTail } from '../scripts/build-log.mjs';
import { builderSpend } from '../scripts/core.mjs';
import { T, round, fakePage, shippedRows, openDetails } from './support/panel.mjs';

// ---------- 0291: Codex and Cursor build logs and tokens ----------

const log = events => events.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n');

// A Codex build's log, as `codex exec --json` writes it (codex-cli 0.159.0).
const CODEX = log([
  { type: 'thread.started', thread_id: 't1' },
  { type: 'turn.started' },
  { type: 'item.completed', item: { id: 'item_0', type: 'reasoning', text: 'Thinking about the tests' } },
  { type: 'item.completed', item: { id: 'item_1', type: 'agent_message', text: 'I will run the tests.' } },
  { type: 'item.started', item: { id: 'item_2', type: 'command_execution', command: "/bin/bash -lc 'npm test'", aggregated_output: '', exit_code: null, status: 'in_progress' } },
  { type: 'item.completed', item: { id: 'item_2', type: 'command_execution', command: "/bin/bash -lc 'npm test'", aggregated_output: 'ok\n', exit_code: 0, status: 'completed' } },
  { type: 'item.completed', item: { id: 'item_3', type: 'command_execution', command: "/bin/bash -lc 'echo '\\''hi'\\'' && false'", aggregated_output: 'hi\n', exit_code: 1, status: 'failed' } },
  { type: 'item.completed', item: { id: 'item_4', type: 'file_change', changes: [{ path: 'a.js', kind: 'update' }], status: 'completed' } },
  { type: 'item.completed', item: { id: 'item_5', type: 'agent_message', text: 'All done.' } },
  { type: 'turn.completed', usage: { input_tokens: 14670, cached_input_tokens: 12288, cache_write_input_tokens: 0, output_tokens: 5, reasoning_output_tokens: 0 } },
]);

// A Cursor build's log, as `agent -p --output-format stream-json` writes it (Cursor CLI 2026.10.16-e3cb207).
const shell = (subtype, command, result) => ({ type: 'tool_call', subtype, call_id: `c-${command}`, session_id: 's',
  tool_call: { shellToolCall: { args: { command }, ...(result ? { result } : {}) } } });
const CURSOR = log([
  { type: 'system', subtype: 'init', session_id: 's', model: 'auto', cwd: '/x', permissionMode: 'default' },
  { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '/speck-build 0001' }] }, session_id: 's' },
  { type: 'thinking', subtype: 'delta', text: 'Hmm', session_id: 's' },
  { type: 'thinking', subtype: 'completed', session_id: 's' },
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'I will run the tests.' }] }, session_id: 's' },
  shell('started', 'npm test'),
  shell('completed', 'npm test', { success: { exitCode: 0, stdout: 'ok', stderr: '' } }),
  shell('started', 'false'),
  shell('completed', 'false', { success: { exitCode: 1, stdout: '', stderr: 'boom' } }),
  { type: 'tool_call', subtype: 'started', call_id: 'r1', session_id: 's', tool_call: { readToolCall: { args: { path: 'a.js' } } } },
  { type: 'tool_call', subtype: 'completed', call_id: 'r1', session_id: 's', tool_call: { readToolCall: { args: { path: 'a.js' }, result: { success: { content: 'x' } } } } },
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'All done.' }] }, session_id: 's' },
  { type: 'result', subtype: 'success', is_error: false, result: 'I will run the tests.All done.', session_id: 's',
    usage: { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 3000, cacheWriteTokens: 40 } },
]);

// ---------- AC1 ----------

test('0291 AC1: a Codex log reads as its messages and one line per command, other events left out', () => {
  assert.equal(readableLog(CODEX), [
    'I will run the tests.', '',
    '→ Bash: npm test',
    "→ Bash: echo 'hi' && false",
    '  ✗ exit code 1',
    '→ Edit: a.js', // 0341
    'All done.', '',
  ].join('\n'));
});

test('0291 AC1: a Codex turn that fails says the build ended, with its message', () => {
  const out = readableLog(log([{ type: 'item.completed', item: { type: 'agent_message', text: 'Starting.' } },
    { type: 'turn.failed', error: { message: 'stream disconnected' } }]));
  assert.equal(out, 'Starting.\n\nBuild ended: stream disconnected');
  assert.equal(readableLog(log([{ type: 'turn.failed' }])), 'Build ended: error');
});

test('0291 AC1: odd Codex items are left out rather than shown as JSON or breaking the log', () => {
  const out = readableLog(log([
    { type: 'item.completed' }, { type: 'item.completed', item: null }, { type: 'item.completed', item: { type: 'agent_message', text: 42 } },
    { type: 'item.completed', item: { type: 'agent_message', text: '   ' } },
    { type: 'item.completed', item: { type: 'command_execution' } },
    { type: 'item.completed', item: { type: 'command_execution', command: ['git', 'status'], exit_code: 0 } },
    { type: 'item.completed', item: { type: '__proto__', text: 'x' } },
  ]));
  assert.equal(out, '→ Bash\n→ Bash: git status');
});

test('0291 AC1: the end of a Codex log reads the same way on the board', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'log-')), 'x.log');
  fs.writeFileSync(file, `${CODEX}\n`);
  assert.equal(logTail(file, 4), "→ Bash: echo 'hi' && false\n  ✗ exit code 1\n→ Edit: a.js\nAll done.");
  const { lines } = readablePiece(CODEX);
  assert.ok(!lines.some(l => l.startsWith('{')), 'no raw JSON');
});

// ---------- AC2 ----------

test('0291 AC2: a Cursor log reads as its messages and one line per command, other events left out', () => {
  assert.equal(readableLog(CURSOR), [
    'I will run the tests.', '',
    '→ Bash: npm test',
    '→ Bash: false',
    '  ✗ exit code 1',
    '→ Read: a.js', // 0341
    'All done.', '',
  ].join('\n'));
});

test('0291 AC2: a Cursor result that says something new is shown, and a failed one says the build ended', () => {
  const said = log([{ type: 'assistant', message: { content: [{ type: 'text', text: 'Working.' }] } },
    { type: 'result', subtype: 'success', is_error: false, result: 'Finished: approved.', usage: { inputTokens: 1, outputTokens: 1 } }]);
  assert.equal(readableLog(said), 'Working.\n\nFinished: approved.');
  const failed = log([{ type: 'result', subtype: 'error', is_error: true, result: '', usage: { inputTokens: 1, outputTokens: 1 } }]);
  assert.equal(readableLog(failed), 'Build ended: error');
});

test('0291 AC2: a Cursor shell call that fails without an exit code is shown as failed', () => {
  const out = readableLog(log([shell('started', 'rm x'), shell('completed', 'rm x', { failure: { message: 'rejected' } }),
    { type: 'tool_call', subtype: 'started', tool_call: { shellToolCall: null } }, { type: 'tool_call', subtype: 'started', tool_call: null }]));
  assert.equal(out, '→ Bash: rm x\n  ✗ failed');
});

// ---------- AC3 ----------

test('0291 AC3: a Codex build\'s tokens come from its last turn, which covers the whole session, and its cost is unknown', () => {
  // input_tokens already includes the cached input, so it isn't added again.
  assert.deepEqual(builderSpend(CODEX), { tokens: 14675, cost_usd: null });
  const resumed = `${CODEX}\n${log([{ type: 'thread.started', thread_id: 't1' },
    { type: 'turn.completed', usage: { input_tokens: 29821, cached_input_tokens: 26752, output_tokens: 10 } }])}`;
  assert.deepEqual(builderSpend(resumed), { tokens: 29831, cost_usd: null });
});

test('0291 AC3: a Cursor build\'s tokens are its input, output and cache tokens, and its cost is unknown', () => {
  assert.deepEqual(builderSpend(CURSOR), { tokens: 4240, cost_usd: null });
  assert.deepEqual(builderSpend(log([{ type: 'result', usage: { inputTokens: 'x', outputTokens: -1, cacheReadTokens: 5 } }])), { tokens: 5, cost_usd: null });
});

test('0291 AC3: a Codex or Cursor log with no usage records nothing', () => {
  assert.equal(builderSpend(log([{ type: 'turn.completed' }])), null);
  assert.equal(builderSpend(log([{ type: 'turn.completed', usage: null }])), null);
  assert.equal(builderSpend(log([{ type: 'item.completed', item: { type: 'agent_message', text: 'hi' } }])), null);
});

test('0291 AC3: the panel shows a Codex or Cursor build\'s tokens, and no $0 cost', async () => {
  const now = Date.now(), iso = ms => new Date(ms).toISOString();
  const p = fakePage([{ tickets: [
    T('0011', 'done', { started: iso(now - 4 * 60000), finished: iso(now), rounds: [round(1, 1200)], ...builderOf(builderSpend(CURSOR)) }),
  ], ideas: [] }]);
  await p.settle();
  await openDetails(p);
  const [row] = shippedRows(p);
  assert.equal(figsOf(row), 'Time4 minReview rounds1Builder cost—Builder tokens4,240Reviewer tokens1,200', 'no cost recorded: a dash (0464)');
  assert.ok(!p.all(row).some(n => /\$0/.test(n.textContent || '')), 'no $0 anywhere on the card');
});
// 0464: an open card's figures are in its facts table, after its Shipped cell, whose time depends on the clock
const figsOf = tr => tr.children.find(n => n.className === 'steps').children.find(n => n.className === 'facts').children.slice(1).map(c => c.textContent).join('');
const builderOf = s => ({ builder_tokens: s.tokens, builder_cost_usd: s.cost_usd });

// ---------- AC4 ----------

const CLAUDE = log([
  { type: 'system', subtype: 'init', session_id: 's' },
  { type: 'assistant', timestamp: '2026-10-18T09:05:07.000Z', message: { content: [{ type: 'text', text: 'Reading the ticket.' },
    { type: 'tool_use', name: 'Bash', input: { command: 'npm test', description: 'Run the tests' } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', is_error: true, content: 'Exit code 1' }] } },
  { type: 'assistant', message: { content: [{ type: 'text', text: 'Done.' }] } },
  { type: 'result', subtype: 'success', result: 'Done.', total_cost_usd: 1.5, usage: { input_tokens: 1, cache_read_input_tokens: 2, cache_creation_input_tokens: 3, output_tokens: 4 },
    modelUsage: { m: { inputTokens: 10, cacheReadInputTokens: 20, cacheCreationInputTokens: 30, outputTokens: 40 } } },
  'plain text line',
]);

test('0291 AC4: a Claude Code log reads and counts as before', () => {
  assert.equal(readableLog(CLAUDE), 'Reading the ticket.\n\n→ Bash: Run the tests\n  ✗ Exit code 1\nDone.\n\nplain text line');
  assert.deepEqual(builderSpend(CLAUDE), { tokens: 100, cost_usd: 1.5 });
  // A Claude Code result whose text ends with the last message, but isn't it, is still shown.
  const ends = log([{ type: 'assistant', message: { content: [{ type: 'text', text: 'done.' }] } }, { type: 'result', subtype: 'success', result: 'All done.' }]);
  assert.equal(readableLog(ends), 'done.\n\nAll done.');
  const usageOnly = log([{ type: 'result', usage: { input_tokens: 1, cache_read_input_tokens: 2, cache_creation_input_tokens: 3, output_tokens: 4 } }]);
  assert.deepEqual(builderSpend(usageOnly), { tokens: 10, cost_usd: null });
});

test('0291 AC3: the brief says speck run records spend from Codex and Cursor logs too', () => {
  const row = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8').split('\n').find(l => l.startsWith('| `speck run` |'));
  assert.ok(row, 'the brief has a speck run row');
  for (const fact of ["Claude Code's `stream-json`", "Codex's `--json`", "Cursor's `stream-json`"]) assert.ok(row.includes(fact), fact);
});
