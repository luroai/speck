import './support/tmp.mjs';
// Build logs written with `--output-format stream-json` read as text in the panel and in speck run's messages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readableLog } from '../scripts/speck.mjs';

const ev = o => JSON.stringify(o);

test('stream-json events become the agent text and one line per tool call', () => {
  const log = [
    ev({ type: 'system', subtype: 'init', session_id: 's' }),
    ev({ type: 'rate_limit_event' }),
    ev({ type: 'assistant', message: { content: [{ type: 'text', text: 'Reading the ticket.' }] } }),
    ev({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm test', description: 'Run the tests' } }] } }),
    ev({ type: 'user', message: { content: [{ type: 'tool_result', content: 'all 400 pass' }] } }),
    ev({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/x/panel.html' } }] } }),
    ev({ type: 'user', message: { content: [{ type: 'tool_result', is_error: true, content: 'File not found' }] } }),
    ev({ type: 'assistant', message: { content: [{ type: 'text', text: 'Shipped.' }] } }),
    ev({ type: 'result', subtype: 'success', result: 'Shipped.' }),
  ].join('\n');
  assert.equal(readableLog(log), ['Reading the ticket.', '', '→ Bash: Run the tests', '→ Read: /x/panel.html', '  ✗ File not found', 'Shipped.', ''].join('\n'));
});

test('a failed result is said, and plain lines are kept as they are', () => {
  const log = ['Error: something broke', '{not json', ev({ type: 'result', subtype: 'error_max_turns', is_error: true, result: '' })].join('\n');
  assert.equal(readableLog(log), ['Error: something broke', '{not json', 'Build ended: error_max_turns'].join('\n'));
});

test('a plain text log is unchanged', () => {
  const text = 'I built ticket 0060.\n\n- **Tests:** all pass';
  assert.equal(readableLog(text), text);
});
