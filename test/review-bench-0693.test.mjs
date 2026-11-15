// 0693: a round whose stand-in is held by its own usage limit goes to the next agent on reviewer_bench that can take it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REVIEWER_LIMITED, stopOnLimit, waitForFirst, reviewerLimitQueue } from '../scripts/reviewer-limit.mjs';
import { standInFor, benchFor } from '../scripts/review-stand-in.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { T } from './support/panel.mjs';
import { reviewRepo } from './support/speck.mjs';
import { benchRepo, benchAgents } from './support/review-bench-0693.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';

const MIN = 60000;
const runsIn = dir => path.join(dir, 'speck', '.cache', 'runs');
const heldFile = (dir, agent) => path.join(runsIn(dir), 'reviewer-held', `${agent}.json`);
const buildLimit = (dir, id = '0001') => path.join(runsIn(dir), 'reviewer-limits', `${id}.json`);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const iso = ms => new Date(ms).toISOString();
// `agent`'s own limit on record, carried on at `at`.
function hold(dir, agent, at) {
  fs.mkdirSync(path.dirname(heldFile(dir, agent)), { recursive: true });
  saveRecord(heldFile(dir, agent), { reviewer: agent, resets: iso(at - MIN), carry_on: iso(at) });
}

// ---------- AC1 ----------

test('0693 AC1: when the stand-in refuses for its own limit, the round runs on the next agent on reviewer_bench', () => {
  const s = benchRepo();
  const r = s.review('codex,claude');
  assert.equal(r.status, 10, r.stderr);
  assert.deepEqual(s.calls(), ['codex', 'claude', 'cursor']);
  const round = s.r.roundFile(1);
  assert.equal(round.meta.reviewer, 'cursor');
  assert.equal(round.meta.stand_in.for, 'codex');
  assert.match(r.stdout, /so this round runs on cursor, the next agent on reviewer_bench that can take it/);
  assert.equal(fs.existsSync(buildLimit(s.r.dir)), false, 'the build isn\'t left waiting');
});

test('0693 AC1: the next agent is skipped when it isn\'t ready, is held by a limit or is of the builder\'s family', () => {
  const dir = reviewRepo().dir;
  hold(dir, 'codex', Date.now() + 60 * MIN);
  const cfg = { reviewer: 'codex', builder: 'codex', reviewer_bench: 'claude, cursor, codex' };
  const pick = (fm, ready, held) => standInFor(dir, fm, cfg, { providers: [], ready: () => ready, held })?.name ?? null;
  assert.equal(pick({}, ['claude', 'cursor'], a => a === 'claude'), 'cursor', 'in bench order, past the limited one');
  assert.equal(pick({}, ['claude'], a => a === 'claude'), null, 'cursor isn\'t ready');
  assert.equal(pick({ builder: 'cursor' }, ['claude', 'cursor'], a => a === 'claude'), null, 'cursor built it');
  assert.deepEqual(benchFor({ builder: 'cursor' }, cfg, { providers: [], ready: () => ['claude', 'cursor'] }), ['claude']);
});

test('0693 AC1: a next agent of the builder\'s family isn\'t started', () => {
  const r = reviewRepo({ ticketFields: 'status: building\nbuilder: cursor', config: '\nreviewer_bench: claude, cursor\n' });
  const agents = benchAgents();
  const res = r.runEnv({ PATH: agents.PATH, [BUILD_ENV]: 'session-1', FAKE_REFUSE: 'codex,claude' }, 'review', '1');
  assert.equal(res.status, REVIEWER_LIMITED, res.stdout + res.stderr);
  assert.deepEqual(agents.calls(), ['codex', 'claude']);
});

// ---------- AC2 ----------

test('0693 AC2: with every agent on the bench limited, the build waits for the first of their limits to reset', () => {
  const s = benchRepo();
  const r = s.review('codex,claude,cursor');
  assert.equal(r.status, REVIEWER_LIMITED, r.stdout + r.stderr);
  assert.deepEqual(s.calls(), ['codex', 'claude', 'cursor']);
  const first = ['codex', 'claude', 'cursor'].map(agent => ({ agent, ...read(heldFile(s.r.dir, agent)) }))
    .reduce((a, b) => (Date.parse(b.carry_on) < Date.parse(a.carry_on) ? b : a));
  const rec = read(buildLimit(s.r.dir));
  assert.equal(rec.carry_on, first.carry_on);
  assert.equal(rec.reviewer, 'codex');
  assert.equal(rec.stand_in, first.agent === 'codex' ? undefined : first.agent);
  assert.match(r.stderr, /speck run resumes this build/);
});

test('0693 AC2: a round no stand-in can take because each is held already waits for the first reset, without starting them', () => {
  const s = benchRepo();
  hold(s.r.dir, 'claude', Date.now() + 10 * MIN);
  hold(s.r.dir, 'cursor', Date.now() + 20 * MIN);
  const r = s.review('codex');
  assert.equal(r.status, REVIEWER_LIMITED, r.stdout + r.stderr);
  assert.deepEqual(s.calls(), ['codex']);
  const rec = read(buildLimit(s.r.dir));
  assert.equal(rec.stand_in, 'claude');
  assert.equal(rec.carry_on, read(heldFile(s.r.dir, 'claude')).carry_on);
  assert.match(r.stderr, /The first to reset is claude's/);
});

test('0693 AC2: speck run carries the build on after the earliest reset, the reviewer\'s own when it comes first', () => {
  const dir = reviewRepo().dir, now = Date.now();
  const runs = runsIn(dir);
  fs.mkdirSync(path.dirname(buildLimit(dir)), { recursive: true });
  const reviewerRefused = () => saveRecord(buildLimit(dir), { reviewer: 'codex', resets: iso(now + 179 * MIN), carry_on: iso(now + 180 * MIN), session: 's-1' });
  hold(dir, 'codex', now + 180 * MIN);
  hold(dir, 'claude', now + 120 * MIN);
  hold(dir, 'cursor', now + 60 * MIN);
  reviewerRefused();
  assert.throws(() => waitForFirst(dir, '0001', 'codex', ['claude', 'cursor'], { session: 's-1', now }), e => e.code === REVIEWER_LIMITED && /The first to reset is cursor's/.test(e.message));
  assert.deepEqual(read(buildLimit(dir)), { reviewer: 'codex', resets: iso(now + 59 * MIN), carry_on: iso(now + 60 * MIN), session: 's-1', stand_in: 'cursor' });

  saveRecord(path.join(runs, '0001.json'), { id: '0001', session: 's-1', cwd: dir, pid: 1, exited: iso(now), exit_code: 0 });
  const clock = { now }, starts = [], said = [];
  const q = reviewerLimitQueue({ repo: dir, runs: () => runs, running: new Set(), say: t => said.push(t), now: () => clock.now, statusOf: () => 'reviewing', resumeHint: () => 'Resume it by hand',
    settings: () => ({ cfg: { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 4 }),
    startBuild: (id, argv) => starts.push({ id, argv }) });
  q.check([T('0001', 'reviewing')]);
  assert.deepEqual(starts, []);
  assert.match(said.join('\n'), /again on cursor once its limit resets/);
  clock.now = now + 60 * MIN;
  q.check([T('0001', 'reviewing')]);
  assert.deepEqual(starts.map(x => x.id), ['0001'], 'carried on at the stand-in\'s reset, not the reviewer\'s');
  assert.match(starts[0].argv.join(' '), /usage limit of cursor, standing in for the codex reviewer, has reset/);

  reviewerRefused();
  hold(dir, 'claude', now + 240 * MIN);
  hold(dir, 'cursor', now + 300 * MIN);
  assert.throws(() => waitForFirst(dir, '0001', 'codex', ['claude', 'cursor'], { session: 's-1', now }), e => e.code === REVIEWER_LIMITED && /The first to reset is the reviewer's/.test(e.message));
  assert.equal(read(buildLimit(dir)).carry_on, iso(now + 180 * MIN), 'the reviewer\'s own reset comes first');
  assert.equal(read(buildLimit(dir)).stand_in, undefined);
});

// ---------- AC3 ----------

test('0693 AC3: a stand-in\'s limit is recorded as its own, and the reviewer\'s record stays', () => {
  const s = benchRepo();
  const r = s.review('codex,claude');
  assert.equal(r.status, 10, r.stderr);
  assert.equal(read(heldFile(s.r.dir, 'claude')).reviewer, 'claude');
  assert.equal(read(heldFile(s.r.dir, 'codex')).reviewer, 'codex', 'the reviewer\'s own limit is still on record');
  assert.equal(fs.existsSync(heldFile(s.r.dir, 'cursor')), false);
});

test('0693 AC3: a stand-in\'s refusal leaves the build\'s record of the reviewer\'s limit as it is', () => {
  const dir = reviewRepo().dir, now = Date.now();
  fs.mkdirSync(path.dirname(buildLimit(dir)), { recursive: true });
  const before = { reviewer: 'codex', resets: null, carry_on: iso(now + 30 * MIN), session: 's-1' };
  saveRecord(buildLimit(dir), before);
  assert.throws(() => stopOnLimit(dir, '0001', 'claude', 'You’ve hit your usage limit · resets 11pm (UTC)', { session: 's-1', now, standIn: true }), e => e.code === REVIEWER_LIMITED);
  assert.deepEqual(read(buildLimit(dir)), before);
  assert.equal(read(heldFile(dir, 'claude')).reviewer, 'claude');
});
