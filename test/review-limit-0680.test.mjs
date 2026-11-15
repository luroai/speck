// 0680: a ticket blocked at the review limit carries on for 2 more rounds once you've answered its question, and speck
// never takes that question's recommendation by itself.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { TICKET, read, verdict, mergeRepo, spawnReview } from './support/merge-rounds.mjs';
import { OPTION, QUESTION, blockedRepo } from './support/blocked.mjs';
import { gitEnv, T, ROOT } from './support/panel.mjs';
import { nextAction, allowedRounds, allowedLine, ticketNext } from '../scripts/review.mjs';
import { questionFacts } from '../scripts/question-facts.mjs';
import { statusData, loadConfig } from '../scripts/speck.mjs';
import { goWith } from '../scripts/go-with.mjs';
import { fixable, decidable } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { foremanBoard } from '../scripts/foreman-took.mjs';
import { foremanReply } from '../scripts/foreman-answer.mjs';
import { asked } from './support/foreman-asked.mjs';
import { reviewPack, roundsLine } from '../scripts/pack.mjs';
import { findTicket } from '../scripts/core.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

const LIMIT_Q = `${QUESTION}\nReview limit: yes`;
const cfg = { limits: { max_review_rounds: 3, max_merge_rounds: 2, escalate_after_repeat_disputes: 2 } };
const finding = (id, state = 'open') => ({ id, severity: 'blocking', state, file: 'a', issue: `${id} issue` });
const round = (n, v, findings = [], meta = {}) => ({ meta: { round: n, reviewer: 'codex', ...meta }, verdict: verdict(v, findings) });
// Three rounds that each left two blocking findings open: no extra round is due.
const three = () => [1, 2, 3].map(n => round(n, 'changes_requested', [finding(`A${n}`), finding(`B${n}`)]));
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');

// A ticket in its own worktree with no rounds yet, max_review_rounds 1 and the fake command reviewer.
function freshRepo() {
  const r = mergeRepo();
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/(^## Review rounds\n)[\s\S]*$/m, '$1'));
  gIn(r.wt, 'commit', '-qam', 'no rounds yet');
  const two = [finding('F1'), finding('F2')];
  const review = (v = 'changes_requested') => spawnReview(r.wt, v, { FAKE_VERDICT: JSON.stringify(verdict(v, v === 'approve' ? [] : two)) });
  const vfile = path.join(r.bin, 'verdict-0680.json');
  const record = (v = 'changes_requested') => { fs.writeFileSync(vfile, JSON.stringify(verdict(v, v === 'approve' ? [] : two))); return runIn(r.wt, 'record', '1', vfile); };
  // Your answer, as the button and speck answer note it.
  const allow = () => {
    const file = path.join(r.wt, TICKET);
    const raw = read(r.wt, TICKET), line = allowedLine('you', '2026-11-15 10:00 UTC');
    fs.writeFileSync(file, /^## Notes$/m.test(raw) ? raw.replace(/^## Notes$/m, `## Notes\n${line}`) : raw.replace(/^## Review log$/m, `## Notes\n${line}\n\n## Review log`));
    gIn(r.wt, 'commit', '-qam', 'you allowed 2 more');
  };
  const config = () => read(r.wt, 'speck/config.yml');
  return { ...r, review, record, allow, config };
}

test('0680 AC1: the build adds Review limit: yes beside its question, and speck status --json gives it as blocked_review_limit', () => {
  const facts = questionFacts(LIMIT_Q.split('\n'));
  assert.equal(facts.reviewLimit, true);
  assert.doesNotMatch(facts.question, /Review limit/, 'not left in the question');
  assert.equal(questionFacts(QUESTION.split('\n')).reviewLimit, undefined);
  assert.equal(shown(blockedRepo({ question: LIMIT_Q })).blocked_review_limit, true);
  assert.equal(shown(blockedRepo()).blocked_review_limit, false);
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('`Review limit: yes`'), 'the build skill tells it to');
  assert.match(nextAction(three(), cfg).reason, /^No approval after/, 'the reason the skill names');
});

test('0680 AC2: each answer allows 2 more rounds: speck next says fix until they are used, then block', () => {
  const allowed = round(4, 'changes_requested', [finding('A4'), finding('B4')], { allowed: true });
  assert.equal(nextAction(three(), cfg).action, 'block');
  assert.deepEqual(nextAction(three(), cfg, 2), { action: 'fix' });
  assert.deepEqual(nextAction([...three(), allowed], cfg, 2), { action: 'fix' });
  const used = [...three(), allowed, round(5, 'changes_requested', [finding('A5'), finding('B5')], { allowed: true })];
  assert.equal(nextAction(used, cfg, 2).action, 'block');
  assert.match(nextAction(used, cfg, 2).reason, /2 of them rounds you allowed/);
  assert.deepEqual(nextAction(used, cfg, 4), { action: 'fix' }, 'the next answer allows 2 more');
  assert.equal(nextAction([...three(), { ...allowed, verdict: verdict('approve') }], cfg, 2).action, 'ship');
  const raw = n => `---\nid: "0001"\n---\n## Notes\n- A note.\n${Array.from({ length: n }, () => allowedLine('you', '2026-11-15 10:00 UTC')).join('\n')}\n## Blocked question\n`;
  assert.equal(allowedRounds(raw(0)), 0);
  assert.equal(allowedRounds(raw(1)), 2);
  assert.equal(allowedRounds(raw(2)), 4);
  assert.equal(allowedRounds('no frontmatter'), 0);
  assert.equal(allowedRounds(`---\nid: "0001"\n---\n## Problem\n${allowedLine('you', 'x')}\n`), 0, 'only in the Notes');
  assert.deepEqual(ticketNext(raw(1), three(), cfg), { action: 'fix' });
});

test('0680 AC2: going with the recommendation of a review-limit question notes 2 more rounds; any other question notes none', () => {
  const r = blockedRepo({ question: LIMIT_Q });
  assert.equal(goWith(r.dir, '0001', new Date('2026-11-15T10:00:00Z')).status, 200);
  assert.match(r.ticket(), /^- Review limit: you allowed 2 more review rounds \(2026-11-15 10:00 UTC\)\.$/m);
  assert.equal(allowedRounds(r.ticket()), 2);
  const other = blockedRepo();
  assert.equal(goWith(other.dir, '0001', new Date('2026-11-15T10:00:00Z')).status, 200);
  assert.equal(allowedRounds(other.ticket()), 0);
});

test('0680 AC2: answering speck\'s question about a ticket blocked at the review limit, with speck answer or the panel\'s Answer, notes 2 more rounds', () => {
  const reply = (r, action) => foremanReply(r.dir, action, '0001', 'Keep going', { now: new Date('2026-11-15T10:00:00Z'), env: {} });
  const { r } = asked('blocked', LIMIT_Q);
  assert.match(reply(r, 'answer'), /resumes its build with your answer/);
  assert.match(r.ticket(), /^- Review limit: you allowed 2 more review rounds \(2026-11-15 10:00 UTC\)\.$/m);
  assert.equal(allowedRounds(r.ticket()), 2);
  assert.deepEqual(ticketNext(r.ticket(), three(), cfg), { action: 'fix' });
  const dismissed = asked('blocked', LIMIT_Q).r;
  reply(dismissed, 'dismiss');
  assert.equal(allowedRounds(dismissed.ticket()), 0, 'dismissing allows none');
  const other = asked('blocked').r;
  reply(other, 'answer');
  assert.equal(allowedRounds(other.ticket()), 0, 'an answer at any other question allows none');
});

test('0680 AC2: a block after merge rounds isn\'t a review-limit block, as the build skill tells them apart', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('`No approval after <n> review rounds`') && skill.includes('`No approval after <n> merge rounds`'));
  const reviewLimit = /^No approval after \d+ review rounds/;
  assert.match(nextAction(three(), cfg).reason, reviewLimit);
  const merges = [round(1, 'approve'), round(2, 'changes_requested', [finding('M1'), finding('M2')], { merge: true }), round(3, 'changes_requested', [finding('M1'), finding('M2')], { merge: true })];
  const merged = nextAction(merges, cfg, 2);
  assert.equal(merged.action, 'block', 'an allowance doesn\'t open merge rounds');
  assert.doesNotMatch(merged.reason, reviewLimit);
});

test('0680 AC2: speck review accepts the 2 rounds you allowed, marks them, and blocks again after them', () => {
  const r = freshRepo();
  const before = r.config();
  r.work('round 1\n');
  assert.equal(r.review().status, 11, 'two blocking findings open: no extra round');
  assert.equal(r.next().split(':')[0], 'block');
  r.work('round 2\n');
  const refused = r.review();
  assert.equal(refused.status, 3, refused.stderr + refused.stdout);
  assert.match(refused.stderr, /Max review rounds \(1\) reached.*Review limit: yes/);
  noTrace(refused);
  r.allow();
  assert.equal(r.next(), 'fix');
  assert.equal(r.review().status, 10);
  assert.equal(r.saved()[1].meta.allowed, true);
  assert.equal(r.saved()[0].meta.allowed, undefined, 'the round at the limit isn\'t one you allowed');
  r.work('round 3\n');
  assert.equal(r.review().status, 11, 'both allowed rounds used');
  assert.equal(r.saved()[2].meta.allowed, true);
  r.work('round 4\n');
  assert.equal(r.review().status, 3);
  r.allow();
  const res = r.review('approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.next(), 'ship');
  assert.equal(r.config(), before, 'limits.max_review_rounds is left as it is');
});

test('0680 AC2: speck record accepts the rounds you allowed, and marks them', () => {
  const r = freshRepo();
  r.work('round 1\n');
  assert.equal(r.record().status, 11);
  r.work('round 2\n');
  assert.equal(r.record().status, 3);
  r.allow();
  const res = r.record();
  assert.equal(res.status, 10, res.stderr + res.stdout);
  assert.equal(r.saved()[1].meta.allowed, true);
});

test('0680 AC3: speck never goes with a review-limit question\'s recommendation by itself, and says why once', () => {
  const t = T('0001', 'blocked', { risk: 'low', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_review_limit: true });
  assert.equal(fixable(t), false);
  assert.equal(decidable(t), false);
  assert.equal(fixable({ ...t, blocked_review_limit: false }), true, 'only because of the review limit');
  for (const watch of ['fix', 'decide']) {
    const r = blockedRepo({ question: LIMIT_Q }), said = [];
    const went = [];
    const q = foremanFixQueue({ repo: r.dir, readConfig: () => ({ ...loadConfig(r.dir), watch }), say: m => said.push(m), goWith: (...a) => { went.push(a); return goWith(...a); } });
    q.check(statusData(r.dir).tickets);
    q.check(statusData(r.dir).tickets);
    assert.equal(went.length, 0, `${watch}: not taken`);
    assert.equal(said.length, 1, `${watch}: said once`);
    assert.match(said[0], /review limit.*waits for you/);
    assert.match(r.ticket(), /^status: blocked$/m);
    assert.equal(foremanBoard([findTicket(r.dir, '0001')], { ...loadConfig(r.dir), watch }, r.runs)[0].foreman_will, false, `${watch}: the panel says it waits for you`);
    const refused = goWith(r.dir, '0001', new Date(), { by: 'foreman' });
    assert.equal(refused.status, 409);
    assert.match(refused.body.error, /review limit/);
    assert.equal(allowedRounds(r.ticket()), 0);
  }
});

test('0680 AC4: the review log, the review pack and the rounds line mark each round you allowed', () => {
  const r = freshRepo();
  r.work('round 1\n');
  r.review();
  r.work('round 2\n');
  r.allow();
  r.review();
  r.work('round 3\n');
  const res = r.review('approve');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  const all = r.saved();
  assert.match(roundsLine(all), /rounds 2 and 3 rounds you allowed/);
  assert.match(roundsLine(all.slice(0, 2)), /round 2 a round you allowed/);
  const pack = reviewPack(r.wt, '0001');
  assert.match(pack, /round 3 of 1, a round you allowed/);
  assert.match(pack, /Round 2, a round you allowed/);
  const closed = runIn(r.wt, 'close', '1');
  assert.equal(closed.status, 0, closed.stderr + closed.stdout);
  const log = read(r.wt, TICKET).match(/## Review log\n([\s\S]*?)\n## /)[1];
  assert.match(log, /Round 2 \(fake, a round you allowed\)/);
  assert.match(log, /Round 3 \(fake, a round you allowed\)/);
  assert.doesNotMatch(log, /Round 1 \([^)]*allowed/);
});

test('0680 AC4: the brief\'s Max rounds reached line names the review limit\'s facts', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const max = brief.split('\n').find(l => l.includes('**Max rounds reached**'));
  assert.ok(max.includes('`Review limit: yes`') && max.includes('`blocked_review_limit`'));
  assert.ok(max.includes('`Review limit: you allowed 2 more review rounds`'), 'the Notes line your answer adds');
});
