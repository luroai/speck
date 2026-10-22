import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { verdictFromOutput } from '../scripts/reviewers.mjs';
import { commandRepo, changesVerdict, fenced, subagentVerdict, subagentRepo } from './support/speck.mjs';

const approve = { round: 1, verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'a.txt' }], findings: [], summary: 'Fine.', escalation_question: '' };
const bare = JSON.stringify(approve);
const envelope = result => JSON.stringify({ type: 'result', session_id: 'S1', result, usage: { input_tokens: 5 } });

test('0383 AC1: prose before, after, or both around an unfenced verdict gives that verdict', () => {
  for (const reply of [`I'll review ticket 0374 first.${bare}`, `${bare}\nThat's my review.`, `I'll review ticket 0374 first. Then the tests.${bare} Done.`]) {
    assert.deepEqual(verdictFromOutput(reply).verdict, approve, reply);
    const inEnvelope = verdictFromOutput(envelope(reply));
    assert.deepEqual(inEnvelope.verdict, approve, `in an envelope: ${reply}`);
    assert.equal(inEnvelope.envelope.session_id, 'S1', 'the envelope is still read for its session and usage');
  }
});

test('0383 AC1: a command reviewer that opens with a line of prose has its round recorded', () => {
  const r = commandRepo();
  const res = r.runEnv({ FAKE_MODE: 'raw', FAKE_VERDICT: `I'll review ticket 0001 first.${JSON.stringify(changesVerdict)}` }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
  assert.equal(r.roundFile(1).verdict.findings[0].id, 'F1');
});

test('0383 AC2: the last object with a verdict key is used, and one without is never taken', () => {
  const first = { ...approve, verdict: 'changes_requested', summary: 'First go.' };
  assert.deepEqual(verdictFromOutput(`Draft: ${JSON.stringify(first)} then final: ${bare} and {"ok":true}`).verdict, approve);
  assert.equal(verdictFromOutput('All good, {"ok":true} and {"round":1}.').verdict, null);
  assert.equal(verdictFromOutput(envelope('Done: {"ok":true}')).verdict, null);
  assert.deepEqual(verdictFromOutput(`A stray { brace, then ${bare}`).verdict, approve);
});

test('0383 AC2: braces and escaped quotes inside the verdict\'s strings don\'t stop it being read', () => {
  const tricky = { ...approve, criteria: [{ id: 1, status: 'pass', evidence: 'calls `f({ a: "}" })` and "\\"quoted\\"" in {x}' }], summary: 'A } and a { and a \\ too.' };
  const reply = `Looking at it now.${JSON.stringify(tricky)}\nDone.`;
  assert.deepEqual(verdictFromOutput(reply).verdict, tricky);
  assert.deepEqual(verdictFromOutput(envelope(reply)).verdict, tricky);
});

test('0383 AC3: speck record accepts a saved reply with prose before or after an unfenced verdict', () => {
  const v = JSON.stringify(subagentVerdict('changes_requested', 'open'));
  for (const reply of [`Here's my review.${v}`, `${v}\nThat's all.`, `First {"ok":true}, then: ${v} done`]) {
    const r = subagentRepo(), file = path.join(r.dir, 'v.json');
    fs.writeFileSync(file, reply);
    const rec = r.run('record', '1', file, '--reviewer=claude-subagent');
    assert.equal(rec.status, 10, rec.stderr);
    assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
  }
});

test('0383 AC4: bare JSON, a fence and an envelope holding either read as before', () => {
  const fence = 'Here is my review.\n\n```json\n' + bare + '\n```\nThanks.';
  for (const reply of [bare, fence, envelope(bare), envelope(fence)]) assert.deepEqual(verdictFromOutput(reply).verdict, approve, reply);
  assert.equal(verdictFromOutput(envelope(bare)).envelope.session_id, 'S1');
  // A bare object is still taken whole, as before, for validateVerdict to judge.
  assert.deepEqual(verdictFromOutput('{"verdict":"approve"}').verdict, { verdict: 'approve' });
});

test('0383 AC4: a reply with no verdict fails with today\'s message and records nothing', () => {
  const r = commandRepo();
  const res = r.runEnv({ FAKE_MODE: 'garbage' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /didn't return a verdict: its output wasn't JSON, a ```json block or a JSON envelope with a "result"\. No round was recorded\./);
  assert.equal(r.roundFile(1), undefined);

  const s = subagentRepo(), file = path.join(s.dir, 'v.json');
  fs.writeFileSync(file, 'Looks fine to me {"ok":true}.');
  const rec = s.run('record', '1', file, '--reviewer=claude-subagent');
  assert.equal(rec.status, 1);
  assert.match(rec.stderr, /isn't a JSON verdict\. Save the reviewer's JSON reply/);
  assert.equal(s.roundFile(1), undefined);
  // A fenced reply is still accepted by speck record.
  const f = subagentRepo(), ff = path.join(f.dir, 'v.json');
  fs.writeFileSync(ff, fenced(subagentVerdict('changes_requested', 'open')));
  assert.equal(f.run('record', '1', ff, '--reviewer=claude-subagent').status, 10);
});
