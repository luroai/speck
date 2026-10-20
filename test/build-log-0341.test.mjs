import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readableLog } from '../scripts/build-log.mjs';

// ---------- 0341: each tool a Cursor or Codex build uses shows in its log, as for Claude Code ----------

process.env.TZ = 'Asia/Kolkata'; // a fixed zone with no summer time
const AT = Date.parse('2026-10-10T11:56:45.034Z'); // 17:26:45 in Kolkata
const log = events => events.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n');
const read = (events, o) => readableLog(log(events), o).split('\n');

// Cursor tool calls, shaped as `agent -p --output-format stream-json` writes them (Cursor Agent 2026.10.19).
const call = (subtype, kind, args, result, timestamp_ms) => ({ type: 'tool_call', subtype, call_id: `c-${kind}`, session_id: 's',
  tool_call: { [kind]: { args, ...(result ? { result } : {}) }, toolCallId: 'x' }, ...(timestamp_ms === undefined ? {} : { timestamp_ms }) });
const both = (kind, args, result) => [call('started', kind, args), call('completed', kind, args, result)];
const edited = (path, isNew) => ({ success: { path, linesAdded: 1, linesRemoved: isNew ? 0 : 1,
  diffString: `${isNew ? '--- /dev/null' : `--- a/${path}`}\n+++ b/${path}\n@@ -1 +1 @@\n+hi`, message: `Wrote contents to ${path}` } });

// Codex items, shaped as `codex exec --json` writes them (codex-cli 0.159.0).
const item = (type, rest) => [{ type: 'item.started', item: { id: 'i', type, ...rest, status: 'in_progress' } }, { type: 'item.completed', item: { id: 'i', type, status: 'completed', ...rest } }];
const command = c => item('command_execution', { command: c, aggregated_output: '', exit_code: 0 });

test('0341 AC1: a Cursor build\'s shell, read, edit, new file, content search and file-name search show as Claude Code\'s do', () => {
  assert.deepEqual(read([
    ...both('shellToolCall', { command: 'npm test' }, { success: { exitCode: 0 } }),
    ...both('readToolCall', { path: '/w/a.md' }, { success: { content: 'x' } }),
    ...both('editToolCall', { path: '/w/a.md', streamContent: 'hi' }, edited('/w/a.md', false)),
    ...both('editToolCall', { path: '/w/b.txt', streamContent: 'hi' }, edited('/w/b.txt', true)),
    ...both('grepToolCall', { pattern: 'doc', path: '/w' }, { success: {} }),
    ...both('globToolCall', { globPattern: '*.md' }, { success: { files: ['./a.md'] } }),
  ]), ['→ Bash: npm test', '→ Read: /w/a.md', '→ Edit: /w/a.md', '→ Write: /w/b.txt', '→ Grep: doc', '→ Glob: *.md']);
});

test('0341 AC1: a Cursor file line shows once its change finishes, with that event\'s time, and a failed one says so', () => {
  assert.deepEqual(read([
    call('started', 'editToolCall', { path: 'a.md' }, null, AT),
    call('completed', 'editToolCall', { path: 'a.md' }, edited('a.md', true), AT),
    call('started', 'editToolCall', { path: 'c.md' }, null, AT),
    call('completed', 'editToolCall', { path: 'c.md' }, { error: { message: 'denied' } }, AT),
    call('started', 'editToolCall', { path: 'unfinished.md' }, null, AT),
  ], { times: true }), ['17:26:45 → Write: a.md', '17:26:45 → Edit: c.md', '  ✗ failed']);
});

test('0341 AC1: Cursor tool calls with a missing or odd path, command or pattern show their name alone', () => {
  assert.deepEqual(read([
    call('started', 'readToolCall', {}), call('started', 'grepToolCall', { pattern: 42 }), call('started', 'globToolCall', null),
    call('started', 'shellToolCall', { command: '  ' }), call('completed', 'editToolCall', undefined, { success: { diffString: 7 } }),
  ]), ['→ Read', '→ Grep', '→ Glob', '→ Bash', '→ Edit']);
});

test('0341 AC2: a Codex command shows as Bash, with its /bin/bash -lc wrapper taken off in single, double or no quotes', () => {
  assert.deepEqual(read([
    ...command("/bin/bash -lc 'cat a.md'"),
    ...command(`/bin/bash -lc "rg -n -w --hidden 'doc' ."`),
    ...command(`/bin/bash -lc "echo \\"hi\\" \\$HOME \\\\ \\\`x\\\`"`),
    ...command('/bin/bash -lc ls'),
    ...command("/bin/bash -lc 'echo '\\''hi'\\'''"),
    ...command('npm test'),
  ]), ['→ Bash: cat a.md', "→ Bash: rg -n -w --hidden 'doc' .", '→ Bash: echo "hi" $HOME \\ `x`', '→ Bash: ls', "→ Bash: echo 'hi'", '→ Bash: npm test']);
});

test('0341 AC2: a Codex file change shows one line per file, Write for one it adds and Edit for the rest', () => {
  assert.deepEqual(read([
    ...item('file_change', { changes: [{ path: '/w/a.md', kind: 'update' }, { path: '/w/b.txt', kind: 'add' }] }),
    { type: 'item.completed', item: { type: 'file_change', changes: [{ path: 'c.md', kind: 'delete' }, null, { kind: 'add' }, { path: 5 }], status: 'failed' } },
    { type: 'item.completed', item: { type: 'file_change', changes: 'nope' } },
  ]), ['→ Edit: /w/a.md', '→ Write: /w/b.txt', '→ Edit: c.md', '→ Write', '→ Edit', '  ✗ failed']);
});

test('0341 AC3: other Cursor and Codex tool calls show as their name, and the rest of the log as before', () => {
  assert.deepEqual(read([
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Working.' }] }, session_id: 's' },
    ...both('deleteToolCall', { path: 'a.md' }, { success: {} }),
    { type: 'tool_call', subtype: 'started', tool_call: { shellToolCall: null } },
    { type: 'tool_call', subtype: 'started', tool_call: { toolCallId: 'x' } },
    { type: 'thinking', subtype: 'delta', text: 'Hmm' },
    ...item('mcp_tool_call', { server: 'docs', tool: 'search', arguments: {} }),
    ...item('web_search', { query: 'node test' }),
    ...item('mcp_tool_call', { server: 'docs', tool: `long ${'x'.repeat(300)}` }),
    ...item('reasoning', { text: 'Thinking' }),
    ...item('todo_list', { items: [] }),
    { type: 'item.completed', item: { type: '__proto__', text: 'x' } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Done.' } },
  ]), ['Working.', '', '→ Delete', '→ search', '→ web_search', `→ long ${'x'.repeat(194)}…`, 'Done.', '']);
});

test('0341 AC4: Claude Code build logs show exactly as before', () => {
  const claude = log([
    { type: 'system', subtype: 'init' },
    { type: 'assistant', timestamp: '2026-10-10T11:56:45.034Z', message: { content: [{ type: 'text', text: 'Reading.' },
      { type: 'tool_use', name: 'Bash', input: { command: "/bin/bash -lc 'npm test'" } }, { type: 'tool_use', name: 'Read', input: { file_path: 'a.md' } },
      { type: 'tool_use', name: 'Glob', input: { pattern: '*.md' } }, { type: 'tool_use', name: 'Shell', input: {} }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', is_error: true, content: 'boom' }, { type: 'tool_result', content: 'fine' }] } },
    { type: 'result', subtype: 'success', result: 'Done.' },
  ]);
  assert.equal(readableLog(claude, { times: true }), ['17:26:45 Reading.', '', "17:26:45 → Bash: /bin/bash -lc 'npm test'", '17:26:45 → Read: a.md',
    '17:26:45 → Glob: *.md', '17:26:45 → Shell', '  ✗ boom', 'Done.'].join('\n'));
});
