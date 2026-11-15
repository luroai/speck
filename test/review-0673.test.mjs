// 0673: a merge round that follows a merge of the base branch gives the reviewer only what changed since it approved:
// how each conflict was resolved, anything else changed by hand in the merge and every change committed after.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gIn, runIn } from './support/ship.mjs';
import { read, verdict, mergeRepo, spawnReview } from './support/merge-rounds.mjs';
import { reviewSince, reviewDiff, reviewerPrompt } from '../scripts/review.mjs';
import { loadConfig, parseTicket } from '../scripts/core.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const HEADING = '## Changes beyond a clean merge of main';
const sha = (cwd, ref = 'HEAD') => gIn(cwd, 'rev-parse', ref).stdout.trim();
const commitAll = (cwd, msg) => { gIn(cwd, 'add', '-A'); assert.equal(gIn(cwd, 'commit', '-qm', msg).status, 0); };
const diffIn = prompt => prompt.split(HEADING)[1].split('## Test output')[0];

// An approved ticket that also changed ticket-only.txt before its approval, while main changed shared.txt (a
// conflict) and added main-only.txt, merged in with the conflict resolved, then a change committed after the merge.
function mergedAfterApproval() {
  const r = mergeRepo();
  fs.writeFileSync(path.join(r.wt, 'ticket-only.txt'), 'the ticket\'s own\n');
  commitAll(r.wt, 'ticket-only');
  assert.equal(r.record('approve').status, 0);
  commitAll(r.wt, 'rounds');
  const approved = r.saved().at(-1).meta.reviewed_sha;
  fs.writeFileSync(path.join(r.dir, 'main-only.txt'), 'main only\n');
  commitAll(r.dir, 'main adds a file');
  r.mergeMain();
  r.work('after the merge\n');
  return { r, approved };
}

function reviewPrompt(r) {
  const file = path.join(r.bin, 'prompt.txt');
  const res = spawnReview(r.wt, 'approve', { FAKE_PROMPT: file });
  assert.equal(res.status, 0, res.stderr + res.stdout);
  return fs.readFileSync(file, 'utf8');
}

// The prompt a later round gets on `cwd` with these earlier rounds, by calling speck's own functions.
function promptFor(cwd, prior) {
  const cfg = loadConfig(cwd);
  const s = reviewSince(cwd, cfg, prior);
  const ticket = parseTicket(read(cwd, 'speck/tickets/0001-export-bookings.md'));
  return { s, prompt: reviewerPrompt(cwd, ticket, cfg, prior.length + 1, { diff: reviewDiff(cwd, s.sinceSha), tests: 'ok', response: 'r', ...s }) };
}
const approvedAt = reviewed_sha => [{ meta: { round: 1, reviewer: 'fake', reviewed_sha }, verdict: verdict('approve') }];

test('0673 AC1: a merge round after a conflict merge holds the resolution and later changes, not main\'s files or the unchanged part of the ticket', () => {
  const { r } = mergedAfterApproval();
  const diff = diffIn(reviewPrompt(r));
  assert.match(diff, /diff --git a\/shared\.txt b\/shared\.txt/, 'the resolved conflict');
  assert.match(diff, /^-<<<<<<< /m, 'shown against git\'s own merge, conflict markers and all');
  assert.match(diff, /^-=======$/m, 'the resolution takes the markers out');
  assert.match(diff, /^\+after the merge$/m, 'a change committed after the merge');
  assert.doesNotMatch(diff, /main-only\.txt/, 'a file only main changed');
  assert.doesNotMatch(diff, /ticket-only\.txt/, 'a part of the ticket the merge left as it was approved');
});

test('0673 AC1: a hand change in a clean merge commit is in the diff, and main\'s files aren\'t', () => {
  const { r } = mergedAfterApproval();
  assert.equal(r.record('approve').status, 0);
  commitAll(r.wt, 'rounds again');
  fs.writeFileSync(path.join(r.dir, 'main-again.txt'), 'main again\n');
  commitAll(r.dir, 'main moves on again');
  assert.equal(gIn(r.wt, 'merge', '-q', '--no-commit', 'main').status, 0);
  fs.writeFileSync(path.join(r.wt, 'other.txt'), 'changed by hand in the merge\n');
  gIn(r.wt, 'add', 'other.txt');
  assert.equal(gIn(r.wt, 'commit', '-q', '--no-edit').status, 0);
  const diff = diffIn(reviewPrompt(r));
  assert.match(diff, /^\+changed by hand in the merge$/m);
  assert.doesNotMatch(diff, /main-again\.txt|main-only\.txt|shared\.txt/);
});

test('0673 AC1: when a clean merge leaves nothing to show, the prompt says so in words, and the round still runs', () => {
  const r = mergeRepo();
  const before = sha(r.wt);
  fs.writeFileSync(path.join(r.dir, 'main-only.txt'), 'main only\n');
  commitAll(r.dir, 'main adds a file');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'feature\n'); // main makes the ticket's change too, so the merge is clean
  commitAll(r.dir, 'main agrees');
  assert.equal(gIn(r.wt, 'merge', '-q', '--no-edit', 'main').status, 0);
  const { s, prompt } = promptFor(r.wt, approvedAt(before));
  assert.ok(s.afterMerge, 'a merge round after a merge');
  assert.equal(reviewDiff(r.wt, s.sinceSha).trim(), '');
  assert.match(prompt.split(HEADING)[1], /Nothing: the merge changed nothing beyond git's own clean merge/);
  assert.doesNotMatch(prompt.split(HEADING)[1].split('## Test output')[0], /```diff/, 'no empty diff block');

  // speck review runs it too.
  const file = path.join(r.bin, 'prompt.txt');
  const res = spawnReview(r.wt, 'approve', { FAKE_PROMPT: file });
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(fs.readFileSync(file, 'utf8'), new RegExp(HEADING));
});

test('0673 AC2: the prompt names the approved commit, says main was merged in since, and gives the command for the whole change', () => {
  const { r, approved } = mergedAfterApproval();
  const out = runIn(r.wt, 'diff', '1'); // before the round, which moves where the next diff starts
  const prompt = reviewPrompt(r);
  assert.match(prompt, new RegExp(`approved commit ${approved.slice(0, 8)}`));
  assert.match(prompt, /This round follows a merge of main into the ticket branch/);
  const cmd = prompt.match(/run `(git diff [0-9a-f]{40,64} HEAD)`/);
  assert.ok(cmd, 'the command for the whole change');
  const whole = gIn(r.wt, ...cmd[1].split(' ').slice(1)).stdout;
  assert.match(whole, /ticket-only\.txt/, 'it prints the whole change against main');
  assert.match(whole, /shared\.txt/);
  assert.doesNotMatch(whole, /main-only\.txt/);
  // speck diff, which the builder gives a claude-subagent reviewer, says the same.
  assert.equal(out.status, 0, out.stderr);
  assert.ok(out.stdout.includes(`approved commit ${approved.slice(0, 8)}`) && out.stdout.includes(`run \`${cmd[1]}\``), out.stdout);
  assert.equal(diffIn(out.stdout + '\n## Test output'), diffIn(prompt));
});

test('0673 AC3: round 1, a later round without a merge and a round before the first approval after a merge are given what they were', () => {
  const r = mergeRepo();
  const before = sha(r.wt);
  const base = gIn(r.wt, 'merge-base', 'main', 'HEAD').stdout.trim();
  assert.equal(reviewSince(r.wt, loadConfig(r.wt), []).sinceSha, base, 'round 1: the whole change');

  r.work('a fix\n');
  const later = promptFor(r.wt, [{ meta: { round: 1, reviewer: 'fake', reviewed_sha: before }, verdict: verdict('changes_requested') }]);
  assert.equal(later.s.sinceSha, before, 'a later round: the changes since the last review');
  assert.match(later.prompt, /## Changes since your last review/);

  r.mergeMain();
  const beforeApproval = promptFor(r.wt, [{ meta: { round: 1, reviewer: 'fake', reviewed_sha: before }, verdict: verdict('changes_requested') }]);
  assert.equal(beforeApproval.s.afterMerge, undefined);
  assert.equal(beforeApproval.s.sinceSha, sha(r.wt, 'main'), 'the whole change against main as merged');
  assert.match(beforeApproval.prompt, /## The whole change against main as merged/);
  assert.doesNotMatch(beforeApproval.prompt, new RegExp(HEADING));
});

test('0673 AC4: the brief, speck-review and speck-build\'s Conflict step no longer say a merge round shows the whole change', () => {
  const brief = read(ROOT, 'docs/brief.md').split('**Merge rounds.**')[1].split('\n')[0];
  const review = read(ROOT, 'skills/speck-review/SKILL.md');
  const build = read(ROOT, 'skills/speck-build/SKILL.md').split('### Conflict')[1].split('\n### ')[0];
  for (const [name, text] of [['brief', brief], ['speck-review', review], ['speck-build', build]]) {
    assert.doesNotMatch(text, /sees the branch's whole change against the base branch as merged/, name);
    assert.doesNotMatch(text, /or the whole change against the base branch as merged after a merge/, name);
    assert.match(text, /clean merge/, `${name} says a merge round shows what changed beyond a clean merge`);
  }
});
