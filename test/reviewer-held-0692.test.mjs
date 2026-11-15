// 0692: a reviewer's usage limit stays on record until it resets, whoever takes the rounds meanwhile.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { heldBy, agentHeld, reviewerLimitQueue, limitQueues, reviewerWaiting, readLimits } from '../scripts/reviewer-limit.mjs';
import { standInFor } from '../scripts/review-stand-in.mjs';
import { GRACE_MS } from '../scripts/usage-limit.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { stoppedForYou } from '../scripts/foreman.mjs';
import { agentView } from '../scripts/foreman-agent.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';
import { T } from './support/panel.mjs';
import { standInRepo } from './support/review-stand-in.mjs';

const MIN = 60000;
const runsIn = dir => path.join(dir, 'speck', '.cache', 'runs');
const heldFile = dir => path.join(runsIn(dir), 'reviewer-held', 'codex.json');
const buildLimit = (dir, id) => path.join(runsIn(dir), 'reviewer-limits', `${id}.json`);
const iso = ms => new Date(ms).toISOString();
// The codex reviewer's own limit on record, resetting at `resets` (null: it didn't say), carried on at `carry_on`.
function holdCodex(dir, resets, carry_on = resets + GRACE_MS) {
  fs.mkdirSync(path.dirname(heldFile(dir)), { recursive: true });
  saveRecord(heldFile(dir), { reviewer: 'codex', resets: resets === null ? null : iso(resets), carry_on: iso(carry_on) });
}
// speck run's queue over the runs folder of `dir`, with a clock the test moves.
function queue(dir, at = Date.now()) {
  const clock = { now: at }, starts = [], running = new Set();
  const opts = { repo: dir, runs: () => runsIn(dir), settings: () => ({ cfg: { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 4 }),
    running, say: () => {}, now: () => clock.now, statusOf: () => 'reviewing', resumeHint: () => 'Resume it by hand',
    startBuild: (id, argv, cwd, shown, flags, rec) => { running.add(id); starts.push({ id, rec: rec(1) }); } };
  return { clock, starts, running, q: reviewerLimitQueue(opts), opts };
}
// After a round the reviewer refused for its limit, taken by the stand-in.
function stoodIn() {
  const s = standInRepo();
  const one = s.review({ FAKE_REFUSE: '1' });
  assert.equal(one.status, 10, one.stderr);
  assert.deepEqual(s.calls().map(c => c.agent), ['codex', 'claude']);
  s.commit();
  return s;
}

// ---------- AC1 ----------

test('0692 AC1: after a stand-in\'s round, the next round goes straight to the stand-in without starting the limited reviewer', () => {
  const s = stoodIn();
  assert.equal(fs.existsSync(buildLimit(s.r.dir, '0001')), false, 'the build isn\'t waiting');
  assert.equal(fs.existsSync(heldFile(s.r.dir)), true, 'the reviewer\'s limit stays on record');
  const two = s.review({ FAKE_REFUSE: '1' });
  assert.equal(two.status, 10, two.stderr);
  assert.deepEqual(s.calls().map(c => c.agent), ['codex', 'claude', 'claude'], 'codex isn\'t started again');
  assert.equal(s.r.roundFile(2).meta.stand_in.for, 'codex');
});

test('0692 AC1: any other ticket\'s round goes to the stand-in too', () => {
  const s = stoodIn();
  assert.ok(heldBy(s.r.dir, 'codex'), 'the limit holds codex for every build');
  assert.equal(agentHeld(s.r.dir, 'codex'), true);
  const sub = standInFor(s.r.dir, { id: '0009', builder: 'cursor' }, { reviewer: 'codex', builder: 'claude', reviewer_bench: 'claude' }, { providers: [], ready: () => ['claude'], held: () => false });
  assert.equal(sub.name, 'claude');
  assert.match(sub.why, /codex reviewer's usage limit is reached/);
});

// ---------- AC2 ----------

test('0692 AC2: speck run\'s status says the reviewer is held, and until when, after a stand-in\'s round', () => {
  const s = stoodIn();
  const { q, opts } = queue(s.r.dir);
  assert.match(q.view().why, /The codex reviewer's usage limit is reached, so no review starts on it until speck run tries again at \d\d:\d\d UTC\./);
  assert.equal(q.view().reviewer, true);
  assert.equal(limitQueues(opts).holdsAgent('codex'), true);
  const resets = Math.ceil((Date.now() + 2 * 3600000) / MIN) * MIN;
  holdCodex(s.r.dir, resets);
  const v = queue(s.r.dir).q.view();
  assert.equal(v.until, new Date(resets).toISOString().slice(11, 16));
  assert.match(v.why, /The codex reviewer's usage limit is reached until \d\d:\d\d UTC, so no review starts on it until then\./);
});

// ---------- AC3 ----------

test('0692 AC3: once the limit has reset, the next round goes to the reviewer again', () => {
  const s = stoodIn();
  holdCodex(s.r.dir, Date.now() - 2 * MIN, Date.now() - MIN);
  assert.equal(heldBy(s.r.dir, 'codex'), null);
  assert.equal(queue(s.r.dir).q.view(), null, 'the status no longer says it\'s held');
  const two = s.review();
  assert.equal(two.status, 10, two.stderr);
  assert.equal(s.calls().at(-1).agent, 'codex');
  assert.equal(s.r.roundFile(2).meta.stand_in, undefined);
  assert.equal(fs.existsSync(heldFile(s.r.dir)), false, 'its round clears the record');
});

test('0692 AC3: a round the reviewer itself takes, run by hand, clears its limit early', () => {
  const s = stoodIn();
  const two = s.r.runEnv({ PATH: s.PATH, [BUILD_ENV]: '', FAKE_VERDICT: 'changes_requested' }, 'review', '1');
  assert.equal(two.status, 10, two.stderr);
  assert.equal(s.calls().at(-1).agent, 'codex');
  assert.equal(heldBy(s.r.dir, 'codex'), null);
});

// ---------- AC4 ----------

test('0692 AC4: the reviewer\'s own limit isn\'t a build waiting, so a stopped build still needs you', () => {
  const s = stoodIn();
  const runs = runsIn(s.r.dir);
  assert.deepEqual(reviewerWaiting(runs), []);
  assert.deepEqual(readLimits(runs), []);
  const t = T('0001', 'reviewing', { build_exit: { code: 0 } });
  assert.equal(stoppedForYou(t, { on: true, fixing: 'fix', agent: agentView(runs, [t]) }), true);
});

test('0692 AC4: a build waiting only for the reviewer\'s reset is carried on as today, and the reviewer\'s own record starts nothing', () => {
  const s = stoodIn();
  const runs = runsIn(s.r.dir), resets = Date.now() + 10 * MIN;
  holdCodex(s.r.dir, resets);
  const { q, clock, starts } = queue(s.r.dir);
  q.check([T('0001', 'reviewing')]);
  assert.deepEqual(starts, [], 'the reviewer\'s own limit resumes no build');
  assert.equal(fs.existsSync(heldFile(s.r.dir)), true, 'nor is it dropped as unreadable');

  fs.mkdirSync(path.dirname(buildLimit(s.r.dir, '0002')), { recursive: true });
  saveRecord(buildLimit(s.r.dir, '0002'), { reviewer: 'codex', resets: iso(resets), carry_on: iso(resets + GRACE_MS), session: 's-0002' });
  saveRecord(path.join(runs, '0002.json'), { id: '0002', session: 's-0002', cwd: s.r.dir, pid: 1, exited: iso(clock.now), exit_code: 0 });
  assert.deepEqual(reviewerWaiting(runs), ['0002']);
  q.check([T('0002', 'reviewing')]);
  assert.deepEqual(starts, []);
  clock.now = resets + GRACE_MS;
  q.check([T('0002', 'reviewing')]);
  assert.deepEqual(starts.map(x => x.id), ['0002']);
});
