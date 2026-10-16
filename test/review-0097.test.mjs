// 0097: a review round that only re-checks a merge of the base branch after an approval doesn't count towards
// max_review_rounds. Merge rounds have their own limit, max_merge_rounds.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { TICKET, read, verdict, mergeRepo, spawnReview } from './support/merge-rounds.mjs';
import { nextAction, isMergeRound, appendRounds } from '../scripts/review.mjs';
import { loadConfig, ticketRounds } from '../scripts/core.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { reviewPack } from '../scripts/pack.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const cfg = (o = {}) => ({ limits: { max_review_rounds: 3, max_merge_rounds: 2, escalate_after_repeat_disputes: 2, ...o } });
const round = (n, v, meta = {}, findings = []) => ({ meta: { round: n, reviewer: 'codex', ...meta }, verdict: verdict(v, findings) });

test('0097 AC1: a round after an approval and a merge of the base branch is a merge round, and next doesn\'t count it towards max_review_rounds', () => {
  const r = mergeRepo();
  r.mergeMain();
  const res = r.record('changes_requested');
  assert.equal(res.status, 10, res.stderr + res.stdout);
  assert.equal(r.saved()[1].meta.merge, true);
  assert.equal(r.saved()[0].meta.merge, undefined, 'the ordinary round isn\'t marked');
  assert.equal(r.next(), 'fix', 'one ordinary round of one, but the merge round doesn\'t count');
});

test('0097 AC1: speck review runs a merge round when max_review_rounds is used up', () => {
  const r = mergeRepo();
  r.mergeMain();
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  noTrace(res);
  assert.equal(r.saved()[1].meta.merge, true);
  assert.equal(r.next(), 'ship');
});

test('0097 AC1: a round after an approval with no merge is a merge round too (0241)', () => {
  const r = mergeRepo();
  r.work();
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  noTrace(res);
  assert.equal(r.saved()[1].meta.merge, true);
  assert.equal(r.next(), 'ship');
});

test('0097 AC1: a merge after a round that didn\'t approve isn\'t a merge round', () => {
  assert.equal(isMergeRound([round(1, 'changes_requested')], true), false);
  assert.equal(isMergeRound([round(1, 'approve')], true), true);
  assert.equal(isMergeRound([round(1, 'approve')], false), true, 'with or without a merge (0241)');
  assert.equal(isMergeRound([], true), false, 'round 1 is never a merge round');
});

test('0097 AC1: the rounds that re-review a merge until it is approved are merge rounds too', () => {
  // The fix for a merge round's findings is re-reviewed in the same merge's next round, not an ordinary one.
  assert.equal(isMergeRound([round(1, 'approve'), round(2, 'changes_requested', { merge: true })], false), true);
  assert.equal(isMergeRound([round(1, 'approve'), round(2, 'approve', { merge: true })], false), true, 'an approved merge ends the run, and the round after it starts a new one (0241)');
  const r = mergeRepo();
  r.mergeMain();
  assert.equal(r.record('changes_requested').status, 10);
  r.work();
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.saved()[2].meta.merge, true);
});

test('0097 AC2: max_merge_rounds defaults to 2 and speck config set accepts it like the other limits', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cfg-'));
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'limits:\n  max_review_rounds: 3\n');
  assert.equal(loadConfig(dir).limits.max_merge_rounds, 2);
  assert.equal(checkConfigValue('limits.max_merge_rounds', '3'), 3);
  assert.throws(() => checkConfigValue('limits.max_merge_rounds', '0'), /limits\.max_merge_rounds must be a whole number of 1 or more/);
  const r = mergeRepo();
  const res = runIn(r.wt, 'config', 'set', 'limits.max_merge_rounds', '4');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /^limits\.max_merge_rounds: 2 → 4$/m);
  assert.equal(loadConfig(r.wt).limits.max_merge_rounds, 4);
  assert.match(read(r.dir, 'speck/config.yml'), /^  max_merge_rounds: 2\b/m, 'speck init writes it into a new config');
});

test('0097 AC2: when max_merge_rounds merge rounds in a row don\'t approve, next says block with a plain reason', () => {
  const all = [round(1, 'approve'), round(2, 'changes_requested', { merge: true }), round(3, 'changes_requested', { merge: true })];
  const n = nextAction(all, cfg());
  assert.equal(n.action, 'block');
  assert.match(n.reason, /No approval after 2 merge rounds in a row/);
  assert.match(n.reason, /max_merge_rounds/);
  assert.equal(nextAction(all.slice(0, 2), cfg()).action, 'fix');
  assert.equal(nextAction([...all.slice(0, 2), round(3, 'approve', { merge: true })], cfg()).action, 'ship');
  // A later merge after an approved one starts a new run.
  const again = [round(1, 'approve'), round(2, 'changes_requested', { merge: true }), round(3, 'approve', { merge: true }), round(4, 'changes_requested', { merge: true })];
  assert.equal(nextAction(again, cfg()).action, 'fix');
});

test('0097 AC2: speck review refuses another merge round once max_merge_rounds is reached', () => {
  const r = mergeRepo();
  r.mergeMain();
  assert.equal(r.record('changes_requested').status, 10);
  r.work();
  assert.equal(r.record('changes_requested').status, 11);
  assert.match(r.next(), /^block: No approval after 2 merge rounds in a row/);
  r.work('again\n');
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 3, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /Max merge rounds \(2\) reached/);
  assert.equal(r.saved().length, 3);
});

test('0097 AC2 (F1): a new merge after a merge approved in its last allowed round gets a merge round', () => {
  const r = mergeRepo();
  r.mergeMain();
  assert.equal(r.record('changes_requested').status, 10);
  r.work();
  assert.equal(r.record('approve').status, 0, 'the merge is approved in its second, last allowed round');
  gIn(r.wt, 'commit', '-qam', 'rounds');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side again\n');
  r.g('commit', '-qam', 'main moves on again');
  gIn(r.wt, 'merge', '-q', 'main');
  fs.writeFileSync(path.join(r.wt, 'shared.txt'), 'feature\nmain side again\n');
  gIn(r.wt, 'add', 'shared.txt');
  assert.equal(gIn(r.wt, 'commit', '-q', '--no-edit').status, 0);
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.saved()[3].meta.merge, true);
  assert.equal(r.next(), 'ship');
});

test('0097 AC3: Review rounds, the review log and the review pack mark merge rounds', () => {
  const r = mergeRepo();
  r.mergeMain();
  assert.equal(r.record('approve').status, 0);
  const text = read(r.wt, TICKET);
  assert.match(text, /<summary>Round 2 · claude-subagent · approve · merge round<\/summary>/);
  assert.match(text, /<summary>Round 1 · claude-subagent · approve<\/summary>/, 'ordinary rounds unchanged');
  const pack = reviewPack(r.wt, '1');
  assert.match(pack, /^- Round 2, merge round \(/m);
  assert.match(pack, /^- Round 1 \(/m);
  assert.match(pack, /merge round 1 of 2\)/);
  assert.match(pack, /^- Review rounds: 2, 1 of them a merge round$/m);
  gIn(r.wt, 'add', TICKET); gIn(r.wt, 'commit', '-qm', 'round 2');
  const close = runIn(r.wt, 'close', '1');
  assert.equal(close.status, 0, close.stderr);
  const after = read(r.wt, TICKET);
  const log = after.split('## Review log')[1].split('\n## ')[0];
  assert.match(log, /^Round 2 \(claude-subagent, merge round\): approve\.$/m);
  assert.match(log, /^Round 1 \(claude-subagent\): approve\.$/m);
  assert.match(after.split('## Delivery log')[1], /^- Review rounds: 2, 1 of them a merge round$/m);
});

test('0097 AC3: a marked round reads back like any other', () => {
  const text = appendRounds('# t\n', [round(1, 'approve'), round(2, 'approve', { merge: true })]);
  const { rounds, errors } = ticketRounds(text);
  assert.deepEqual(errors, []);
  assert.equal(rounds[1].meta.merge, true);
});

test('0097 AC4: repeated disputes still block across merge rounds', () => {
  const d = [{ id: 'F1', severity: 'blocking', state: 'dispute_rejected', file: 'a', issue: 'x' }];
  const all = [round(1, 'approve'), round(2, 'changes_requested', { merge: true }, d), round(3, 'changes_requested', { merge: true }, d)];
  const n = nextAction(all, cfg({ max_merge_rounds: 5 }));
  assert.equal(n.action, 'block');
  assert.match(n.reason, /disagree on F1 for 2 rounds in a row/);
});

test('0097 AC4: ordinary rounds work as before', () => {
  // 0242: a round at the limit with no more than one blocking finding open gets an extra round, so two are open here.
  const two = ['F1', 'F2'].map(id => ({ id, severity: 'blocking', state: 'open', file: 'a', issue: 'x' }));
  const three = [1, 2, 3].map(n => round(n, 'changes_requested', {}, two));
  assert.deepEqual(nextAction(three, cfg()), { action: 'block', reason: 'No approval after 3 review rounds.' });
  assert.equal(nextAction(three.slice(0, 2), cfg()).action, 'fix');
  assert.equal(nextAction([1, 2, 3].map(n => round(n, 'changes_requested')), cfg()).action, 'fix', '0242 AC1: the extra round');
  // Merge rounds earlier in the history don't use up ordinary rounds.
  const mixed = [round(1, 'approve'), round(2, 'approve', { merge: true }), round(3, 'changes_requested')];
  assert.equal(nextAction(mixed, cfg()).action, 'fix');
  assert.deepEqual(nextAction([...mixed, round(4, 'changes_requested', {}, two)], cfg()), { action: 'block', reason: 'No approval after 3 review rounds.' });
});
