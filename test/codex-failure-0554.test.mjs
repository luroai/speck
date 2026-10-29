import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import { codexFailure } from '../scripts/review.mjs';
import { reviewRepo } from './support/speck.mjs';

const lines = (...events) => events.map(e => JSON.stringify(e)).join('\n') + '\n';
const LIMIT = "You've hit your usage limit. Try again at 4:12 PM.";

test('0554 AC1: a turn.failed or error event on standard output gives the message', () => {
  const failed = lines({ type: 'thread.started', thread_id: 'T' }, { type: 'turn.started' }, { type: 'turn.failed', error: { message: LIMIT } });
  assert.equal(codexFailure(1, failed, 'Reading additional input from stdin...\n'), `codex exited 1: ${LIMIT}`);
  assert.equal(codexFailure(1, lines({ type: 'error', message: LIMIT }), ''), `codex exited 1: ${LIMIT}`);
  // An item that is an error is only a warning, and Codex carries on after it.
  const warned = lines({ type: 'item.completed', item: { id: 'i', type: 'error', message: 'Model metadata not found' } }, { type: 'turn.failed', error: { message: LIMIT } });
  assert.equal(codexFailure(1, warned, ''), `codex exited 1: ${LIMIT}`);
});

test('0554 AC1: an API error wrapped in the message is given by its own message', () => {
  const api = JSON.stringify({ type: 'error', status: 400, error: { type: 'invalid_request_error', message: "The 'x' model is not supported.", code: 'model_not_found' } });
  const out = lines({ type: 'error', message: api }, { type: 'turn.failed', error: { message: api } });
  assert.equal(codexFailure(1, out, ''), "codex exited 1: The 'x' model is not supported.");
});

test('0554 AC2: with no error event it gives the last lines of standard error, or says there was no reason', () => {
  const err = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].join('\n') + '\n';
  assert.equal(codexFailure(2, lines({ type: 'thread.started', thread_id: 'T' }), err), 'codex exited 2: c\nd\ne\nf\ng');
  assert.equal(codexFailure(2, 'not json\n{"type":"turn.failed"}\n{"type":"error","message":"  "}\n', 'broke\n'), 'codex exited 2: broke');
  assert.equal(codexFailure(3, '', ''), 'codex exited 3 and gave no reason.');
  assert.equal(codexFailure(3, undefined, '  \n'), 'codex exited 3 and gave no reason.');
});

test('0554 AC1 AC3: a failed round says codex exited with its reason, and records no round', () => {
  const r = reviewRepo({ ticketFields: 'status: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  const before = r.git('status', '--porcelain').stdout;
  const res = r.runEnv({ FAKE_CODEX_EXIT: '1', FAKE_CODEX_STDOUT: lines({ type: 'thread.started', thread_id: 'T' }, { type: 'turn.failed', error: { message: LIMIT } }), FAKE_CODEX_STDERR: 'Reading additional input from stdin...\n' }, 'review', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.match(res.stderr, new RegExp(`codex exited 1: ${LIMIT.replace(/[.']/g, '\\$&')}`));
  assert.equal(r.roundFile(1), undefined);
  assert.equal(r.git('status', '--porcelain').stdout, before);
  const none = r.runEnv({ FAKE_CODEX_EXIT: '1' }, 'review', '1');
  assert.match(none.stderr, /codex exited 1 and gave no reason\./);
  assert.equal(r.roundFile(1), undefined);
});
