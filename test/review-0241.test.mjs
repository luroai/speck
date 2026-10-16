// 0241: every review round that follows an approved round is a merge round, whether or not the branch merged the base
// branch in since, so a fix after an approval doesn't count towards max_review_rounds.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { TICKET, read, verdict, mergeRepo, spawnReview } from './support/merge-rounds.mjs';
import { isMergeRound, nextAction } from '../scripts/review.mjs';

const round = (n, v, meta = {}) => ({ meta: { round: n, reviewer: 'codex', ...meta }, verdict: verdict(v) });
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

test('0241 AC1: a round whose previous round approved is a merge round, with or without a merge', () => {
  assert.equal(isMergeRound([round(1, 'approve')]), true);
  assert.equal(isMergeRound([round(1, 'approve')], false), true);
  assert.equal(isMergeRound([round(1, 'approve')], true), true);
  assert.equal(isMergeRound([round(1, 'changes_requested')]), false, 'rounds that don\'t follow an approval are unchanged');
  assert.equal(isMergeRound([]), false, 'round 1 is never a merge round');
  assert.equal(isMergeRound([round(1, 'approve'), round(2, 'changes_requested', { merge: true })]), true, 'the run goes on until one approves');
});

test('0241 AC1: speck record saves a round after an approval with no merge as a merge round that next doesn\'t count', () => {
  const r = mergeRepo();
  r.work();
  const res = r.record('changes_requested');
  assert.equal(res.status, 10, res.stderr + res.stdout);
  noTrace(res);
  assert.equal(r.saved()[1].meta.merge, true);
  assert.equal(r.next(), 'fix', 'one ordinary round of one, but the merge round doesn\'t count');
});

test('0241 AC1: speck review runs merge rounds with no merge until max_merge_rounds', () => {
  const r = mergeRepo();
  r.work();
  assert.equal(spawnReview(r.wt, 'changes_requested').status, 10);
  r.work('again\n');
  const res = spawnReview(r.wt, 'changes_requested');
  assert.equal(res.status, 11, res.stderr + res.stdout);
  assert.equal(r.saved()[2].meta.merge, true);
  assert.match(r.next(), /block/);
  r.work('once more\n');
  const over = spawnReview(r.wt, 'approve');
  assert.equal(over.status, 3, over.stderr + over.stdout);
  noTrace(over);
  assert.match(over.stderr, /Max merge rounds \(2\) reached/);
});

test('0241 AC2: with max_review_rounds 3, a ticket approved in round 3 whose code then changes, with no merge, has round 4 approved and ships', () => {
  const r = mergeRepo();
  assert.equal(runIn(r.wt, 'config', 'set', 'limits.max_review_rounds', '3').status, 0);
  // Start the ticket's rounds again, so rounds 1 and 2 ask for changes and round 3 approves.
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/(^## Review rounds\n)[\s\S]*$/m, '$1'));
  gIn(r.wt, 'commit', '-qam', 'no rounds yet');
  assert.equal(r.saved().length, 0);
  for (const [i, v] of ['changes_requested', 'changes_requested', 'approve'].entries()) {
    r.work(`round ${i + 1}\n`);
    const res = r.record(v);
    assert.equal(res.status, v === 'approve' ? 0 : 10, res.stderr + res.stdout);
  }
  assert.equal(r.next(), 'ship');
  r.work('a three-line fix after the approval\n');
  const res = spawnReview(r.wt, 'approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  noTrace(res);
  assert.equal(r.saved().length, 4);
  assert.equal(r.saved()[3].meta.merge, true);
  assert.equal(r.next(), 'ship');
});

test('0241 AC3: with no merge, the reviewer gets the changes since its last review and isn\'t told the round follows a merge', () => {
  const r = mergeRepo();
  const last = r.saved()[0].meta.reviewed_sha;
  r.work('the fix\n');
  const prompt = path.join(r.bin, 'prompt.txt');
  const res = spawnReview(r.wt, 'approve', { FAKE_PROMPT: prompt });
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.saved()[1].meta.merge, true, 'it is still a merge round');
  const p = fs.readFileSync(prompt, 'utf8');
  assert.match(p, new RegExp(`## Changes since your last review \\(${last.slice(0, 8)}\\.\\.HEAD\\)`));
  const since = p.split('## Changes since your last review')[1].split('```')[1];
  assert.match(since, /\+the fix/);
  assert.doesNotMatch(since, /shared\.txt/, 'not the whole change against main');
  assert.doesNotMatch(p, /follows a merge|The whole change against main as merged/);
});

test('0241 AC3: after a merge, the reviewer is still given the whole change as merged', () => {
  const r = mergeRepo();
  r.mergeMain();
  const prompt = path.join(r.bin, 'prompt.txt');
  assert.equal(spawnReview(r.wt, 'approve', { FAKE_PROMPT: prompt }).status, 0);
  assert.match(fs.readFileSync(prompt, 'utf8'), /This round follows a merge of main/);
});

test('0241 AC4: the brief says a round is a merge round whenever the round before it approved', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const para = brief.split('\n').find(l => l.startsWith('**Merge rounds.**'));
  assert.match(para, /A round is a merge round whenever the round before it approved, whether or not the branch merged the base branch in since\./);
  assert.doesNotMatch(para, /merged the base branch in since the previous round and that round approved/);
});
