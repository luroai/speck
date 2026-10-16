// 0242: a ticket whose last round at max_review_rounds left no more than one blocking finding open gets one extra
// review round by itself, and blocks only if that round doesn't approve.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { TICKET, read, verdict, mergeRepo, spawnReview } from './support/merge-rounds.mjs';
import { nextAction } from '../scripts/review.mjs';
import { reviewPack } from '../scripts/pack.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const cfg = { limits: { max_review_rounds: 3, max_merge_rounds: 2, escalate_after_repeat_disputes: 2 } };
const finding = (id, state = 'open') => ({ id, severity: 'blocking', state, file: 'a', issue: `${id} issue` });
const round = (n, v, findings = [], meta = {}) => ({ meta: { round: n, reviewer: 'codex', ...meta }, verdict: verdict(v, findings) });
const upTo = (last, ...rest) => [round(1, 'changes_requested', [finding('F9')]), round(2, 'changes_requested', [finding('F8')]), last, ...rest];

// A ticket in its own worktree with no rounds yet, max_review_rounds 1 and the fake command reviewer.
function freshRepo() {
  const r = mergeRepo();
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/(^## Review rounds\n)[\s\S]*$/m, '$1'));
  gIn(r.wt, 'commit', '-qam', 'no rounds yet');
  assert.equal(r.saved().length, 0);
  const review = (v, findings = []) => spawnReview(r.wt, v, { FAKE_VERDICT: JSON.stringify(verdict(v, findings)) });
  const vfile = path.join(r.bin, 'verdict-0242.json');
  const record = (v, findings = []) => { fs.writeFileSync(vfile, JSON.stringify(verdict(v, findings))); return runIn(r.wt, 'record', '1', vfile); };
  return { ...r, review, record };
}

test('0242 AC1: at the limit, a round that left one or no blocking finding open means fix, not block', () => {
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1'), finding('F2', 'resolved')])), cfg), { action: 'fix' });
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1', 'dispute_rejected')])), cfg), { action: 'fix' });
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested')), cfg), { action: 'fix' }, 'no blocking finding open, only a criterion failing');
  const minors = [1, 2, 3].map(i => ({ ...finding(`M${i}`), severity: 'minor' }));
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1'), ...minors])), cfg), { action: 'fix' }, 'minor findings don\'t count');
});

test('0242 AC1: speck review runs the extra round, and saves it marked as one', () => {
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.review('changes_requested', [finding('F1')]).status, 10);
  assert.equal(r.next(), 'fix');
  r.work('round 2\n');
  const res = r.review('approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.saved()[1].meta.extra, true);
  assert.equal(r.saved()[0].meta.extra, undefined, 'the round at the limit isn\'t extra');
  assert.equal(r.next(), 'ship');
});

test('0242 AC1: speck record accepts the extra round, and saves it marked as one', () => {
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.record('changes_requested', [finding('F1')]).status, 10);
  r.work('round 2\n');
  const res = r.record('changes_requested', [finding('F1')]);
  assert.equal(res.status, 11, res.stderr + res.stdout);
  noTrace(res);
  assert.equal(r.saved()[1].meta.extra, true);
  assert.match(res.stdout, /NEXT: block: No approval after 2 review rounds, the last of them an extra round\./);
});

test('0242 AC2: a ticket gets at most one extra round', () => {
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1')]), round(4, 'changes_requested', [finding('F1')], { extra: true })), cfg),
    { action: 'block', reason: 'No approval after 4 review rounds, the last of them an extra round.' });
  assert.equal(nextAction(upTo(round(3, 'changes_requested', [finding('F1')]), round(4, 'changes_requested', [], { extra: true })), cfg).action, 'block',
    'even with nothing open after it');
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.review('changes_requested', [finding('F1')]).status, 10);
  r.work('round 2\n');
  assert.equal(r.review('changes_requested').status, 11);
  r.work('round 3\n');
  const over = r.review('approve');
  assert.equal(over.status, 3, over.stderr + over.stdout);
  noTrace(over);
  assert.match(over.stderr, /Max review rounds \(1\) reached, and the extra round too\. Block the ticket\./);
  assert.equal(r.saved().length, 2, 'nothing recorded');
});

test('0242 AC2: two or more open blocking findings at the limit block as today, and speck review refuses another round', () => {
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1'), finding('F2', 'dispute_rejected')])), cfg),
    { action: 'block', reason: 'No approval after 3 review rounds.' });
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.review('changes_requested', [finding('F1'), finding('F2')]).status, 11);
  r.work('round 2\n');
  const over = r.review('approve');
  assert.equal(over.status, 3, over.stderr + over.stdout);
  noTrace(over);
  assert.match(over.stderr, /Max review rounds \(1\) reached\. Block the ticket\./);
});

test('0242 AC2: an escalation or a repeated dispute blocks, at the limit and in the extra round', () => {
  const esc = { ...round(3, 'escalate', [finding('F1')]) };
  esc.verdict.escalation_question = 'Which way?';
  assert.deepEqual(nextAction(upTo(esc), cfg), { action: 'block', reason: 'Which way?' });
  const extraEsc = round(4, 'escalate', [], { extra: true });
  extraEsc.verdict.escalation_question = 'Which way now?';
  assert.deepEqual(nextAction(upTo(round(3, 'changes_requested', [finding('F1')]), extraEsc), cfg), { action: 'block', reason: 'Which way now?' });
  const d = [finding('F1', 'dispute_rejected')];
  const atLimit = [round(1, 'changes_requested'), round(2, 'changes_requested', d), round(3, 'changes_requested', d)];
  assert.match(nextAction(atLimit, cfg).reason, /disagree on F1 for 2 rounds in a row/);
  const inExtra = [...upTo(round(3, 'changes_requested', d)), round(4, 'changes_requested', d, { extra: true })];
  assert.match(nextAction(inExtra, cfg).reason, /disagree on F1 for 2 rounds in a row/);
  // speck review refuses a round after a repeated dispute at the limit.
  const r = freshRepo();
  assert.equal(runIn(r.wt, 'config', 'set', 'limits.max_review_rounds', '2').status, 0);
  gIn(r.wt, 'commit', '-qam', 'two rounds');
  r.work('round 1\n');
  assert.equal(r.review('changes_requested', d).status, 10);
  r.work('round 2\n');
  assert.equal(r.review('changes_requested', d).status, 11);
  r.work('round 3\n');
  const over = r.review('approve');
  assert.equal(over.status, 3, over.stderr + over.stdout);
  noTrace(over);
});

test('0242 AC2: merge rounds get no extra round', () => {
  const merges = [round(1, 'approve'), round(2, 'changes_requested', [finding('F1')], { merge: true }), round(3, 'changes_requested', [finding('F1')], { merge: true })];
  assert.equal(nextAction(merges, cfg).action, 'block');
});

test('0242 AC3: the review pack names the extra round, and speck close says so in the Delivery log', () => {
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.review('changes_requested', [finding('F1')]).status, 10);
  r.work('round 2\n');
  assert.equal(r.review('approve').status, 0);
  const pack = reviewPack(r.wt, '1');
  assert.match(pack, /round 2 of 1, an extra round\)/);
  assert.match(pack, /^- Round 2, extra round \(/m);
  assert.match(pack, /^- Round 1 \(/m);
  assert.match(read(r.wt, TICKET), /<summary>Round 2 · fake · approve · extra round<\/summary>/);
  gIn(r.wt, 'add', TICKET); gIn(r.wt, 'commit', '-qm', 'rounds');
  const close = runIn(r.wt, 'close', '1');
  assert.equal(close.status, 0, close.stderr + close.stdout);
  const after = read(r.wt, TICKET);
  const delivery = after.split('## Delivery log')[1].split('\n## ')[0];
  assert.match(delivery, /^- Review rounds: 2, round 2 an extra round$/m);
  const log = after.split('## Review log')[1].split('\n## ')[0];
  assert.match(log, /^Round 2 \(fake, extra round\): approve\.$/m);
});

test('0242 AC3: a ticket with no extra round has no mention of one', () => {
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.review('approve').status, 0);
  assert.doesNotMatch(reviewPack(r.wt, '1'), /extra round/);
  gIn(r.wt, 'add', TICKET); gIn(r.wt, 'commit', '-qm', 'rounds');
  assert.equal(runIn(r.wt, 'close', '1').status, 0);
  assert.doesNotMatch(read(r.wt, TICKET), /extra round/);
});

test('0242 AC4: the build and review skills say the extra round is taken without asking, and the limit is never raised', () => {
  const root = path.join(import.meta.dirname, '..');
  for (const skill of ['speck-build', 'speck-review']) {
    const text = fs.readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /extra round/, skill);
    assert.match(text, /without asking the user/, skill);
    assert.match(text, /[Nn]ever change `limits\.max_review_rounds` in `speck\/config\.yml`/, skill);
  }
});
