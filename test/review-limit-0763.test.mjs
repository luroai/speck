// 0763: an escalation at the review limit that your answer allowed more rounds for is followed by those rounds.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import { verdict } from './support/merge-rounds.mjs';
import { nextAction, extraRound } from '../scripts/review-limit.mjs';

const cfg = max => ({ limits: { max_review_rounds: max, max_merge_rounds: 2, escalate_after_repeat_disputes: 2 } });
const finding = id => ({ id, severity: 'blocking', state: 'open', file: 'a', issue: `${id} issue` });
const round = (n, v, meta = {}) => ({ meta: { round: n, reviewer: 'codex', ...meta },
  verdict: { ...verdict(v, v === 'approve' ? [] : [finding(`A${n}`), finding(`B${n}`)]), ...(v === 'escalate' ? { escalation_question: `Question ${n}?` } : {}) } });
// `n` ordinary rounds asking for changes, the last of them escalating.
const escalatedAt = n => [...Array.from({ length: n - 1 }, (_, i) => round(i + 1, 'changes_requested')), round(n, 'escalate')];
const refused = (prior, c, allowed) => assert.throws(() => extraRound(prior, c, false, allowed), e => e.code === 3 && /Max review rounds/.test(e.message));

test('0763 AC1: an answered escalation at the limit runs the next round as an allowed one', () => {
  assert.deepEqual(extraRound(escalatedAt(3), cfg(3), false, 2), { extra: false, allowed: true });
  assert.deepEqual(extraRound(escalatedAt(5), cfg(5), false, 4), { extra: false, allowed: true });
});

test('0763 AC2: after an answered escalation at the limit, speck next says fix rather than block', () => {
  assert.deepEqual(nextAction(escalatedAt(3), cfg(3), 2), { action: 'fix' });
  // Escalated in a round you allowed, then answered again: two more on top.
  const again = [...escalatedAt(3).slice(0, 2), round(3, 'changes_requested'), round(4, 'escalate', { allowed: true })];
  assert.deepEqual(nextAction(again, cfg(3), 4), { action: 'fix' });
});

test('0763 AC3: escalations with no rounds allowed, all of them used, or before the limit, still block', () => {
  for (const [rounds, max, allowed] of [
    [escalatedAt(3), 3, 0], // at the limit, nothing allowed
    [[...escalatedAt(3).slice(0, 2), round(3, 'escalate')].concat(), 3, 0],
    [escalatedAt(2), 3, 0], // before the limit, unanswered
    [escalatedAt(2), 3, 2], // before the limit, even with an old allowance in the Notes
  ]) {
    const next = nextAction(rounds, cfg(max), allowed);
    assert.equal(next.action, 'block');
    assert.equal(next.reason, `Question ${rounds.length}?`, 'the escalation question, as today');
  }
  refused(escalatedAt(3), cfg(3), 0);
  // Allowed rounds all used, the last of them escalating.
  const used = [...escalatedAt(3), round(4, 'changes_requested', { allowed: true }), round(5, 'escalate', { allowed: true })];
  assert.equal(nextAction(used, cfg(3), 2).action, 'block');
  refused(used, cfg(3), 2);
  // An escalation in a round you allowed, not yet answered: the one round left doesn't run without your answer.
  const unanswered = [...escalatedAt(3), round(4, 'escalate', { allowed: true })];
  assert.equal(nextAction(unanswered, cfg(3), 2).action, 'block');
  refused(unanswered, cfg(3), 2);
});

test('0763 AC4: 5 rounds, the 5th escalated, one allowed line: a 6th and a 7th run, and an 8th is refused', () => {
  const c = cfg(5);
  let rounds = escalatedAt(5);
  for (const n of [6, 7]) {
    const { allowed, extra } = extraRound(rounds, c, false, 2);
    assert.equal(allowed, true, `round ${n} runs as an allowed round`);
    assert.equal(extra, false);
    rounds = [...rounds, round(n, 'changes_requested', { allowed })];
  }
  assert.equal(nextAction(rounds, c, 2).action, 'block');
  assert.match(nextAction(rounds, c, 2).reason, /^No approval after 7 review rounds, 2 of them rounds you allowed/);
  refused(rounds, c, 2);
});
