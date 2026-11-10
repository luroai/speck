// 0623: a review round the reviewer refuses for its usage limit is waited out, then run again, by speck run.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REVIEWER_LIMITED, resetIn, reviewerRefused, stopOnLimit, readLimits, reviewerLimitQueue, reviewerWaiting } from '../scripts/reviewer-limit.mjs';
import { GRACE_MS, RETRY_MS } from '../scripts/usage-limit.mjs';
import { foremanView, stoppedForYou } from '../scripts/foreman.mjs';
import { agentView } from '../scripts/foreman-agent.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';
import { parseTicket } from '../scripts/speck.mjs';
import { T } from './support/panel.mjs';
import { reviewRepo, gitIn, ROOT } from './support/speck.mjs';
import { runRepo, startRun, stopRun, waitFor, record } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { deadPid } from './support/blocked.mjs';

const MIN = 60000;
const lines = (...events) => events.map(e => JSON.stringify(e)).join('\n') + '\n';
const PRO = 'You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at';
// When the reset falls on another day, Codex gives its date too, so the message says the same thing whenever the test runs.
const ordinal = n => (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const dateWords = ms => { const d = new Date(ms); return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()} ${d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`; };
const refusal = ms => lines({ type: 'thread.started', thread_id: 'T' }, { type: 'turn.started' }, { type: 'turn.failed', error: { message: `${PRO} ${dateWords(ms)}.` } });
const inTwoDays = () => Math.ceil((Date.now() + 2 * 864e5) / MIN) * MIN;
const limitFile = (dir, id) => path.join(dir, 'speck', '.cache', 'runs', 'reviewer-limits', `${id}.json`);
const statusIn = r => parseTicket(fs.readFileSync(r.ticketFile, 'utf8')).fm.status;
const building = () => { const r = reviewRepo({ ticketFields: 'status: building' }); r.git('add', '-A'); r.git('commit', '-qm', 'building'); return r; };

// ---------- AC1: reading the message ----------

test('0623 AC1: Codex\'s own wording counts as a refusal, and other failures don\'t', () => {
  for (const said of [`${PRO} 3:41 AM.`, 'You\'ve hit your usage limit. Try again at 4:12 PM.', 'You\'ve hit your usage limit. Try again later.', 'You\'ve hit your usage limit for GPT-6 Sol. Try again later.', 'You\'ve hit your session limit · resets 12:30pm (UTC)'])
    assert.equal(reviewerRefused(said), true, said);
  for (const said of ['codex exited 1: The model is not supported.', 'stream disconnected: rate limit', '', null, undefined])
    assert.equal(reviewerRefused(said), false, String(said));
});

test('0623 AC1: a reset time today is read in the machine\'s local time, as Codex gives it', t => {
  const was = process.env.TZ;
  t.after(() => { if (was === undefined) delete process.env.TZ; else process.env.TZ = was; });
  process.env.TZ = 'America/New_York';
  const now = new Date(2026, 10, 10, 1, 0).getTime();
  assert.equal(resetIn(`${PRO} 3:41 AM.`, now), new Date(2026, 10, 10, 3, 41).getTime());
  assert.equal(resetIn(`${PRO} 12:05 PM.`, now), new Date(2026, 10, 10, 12, 5).getTime());
  assert.equal(resetIn(`${PRO} 12:05 AM.`, new Date(2026, 10, 9, 23, 50).getTime()), new Date(2026, 10, 10, 0, 5).getTime(), 'past midnight, so tomorrow');
});

test('0623 AC1: a reset on another day is read with its date', () => {
  const now = new Date(2026, 9, 27, 12, 0).getTime();
  assert.equal(resetIn(`${PRO} Oct 28th, 2026 3:41 AM.`, now), new Date(2026, 9, 28, 3, 41).getTime());
  assert.equal(resetIn(`${PRO} Nov 3rd, 2026 7:08 PM.`, now), new Date(2026, 10, 3, 19, 8).getTime());
});

test('0623 AC1: Claude\'s wording, in UTC, is read too', () => {
  const now = Date.parse('2026-11-10T11:57:00Z');
  assert.equal(resetIn('You\'ve hit your session limit · resets 12:30pm (UTC)', now), Date.parse('2026-11-10T12:30:00Z'));
  assert.equal(resetIn('You\'ve hit your session limit · resets 3pm (UTC)', now), Date.parse('2026-11-10T15:00:00Z'));
  assert.equal(resetIn('You\'ve hit your weekly limit · resets Nov 12, 3pm (UTC)', now), Date.parse('2026-11-12T15:00:00Z'));
});

test('0623 AC1 AC4: a time that can\'t be read gives none', () => {
  const now = Date.parse('2026-11-10T11:57:00Z');
  for (const said of ['You\'ve hit your usage limit. Try again later.', 'You\'ve hit your usage limit.', 'try again at 13:61 PM', 'try again at 0:30 AM', 'try again at Foo 3rd, 2026 3:41 AM', 'try again at Feb 31st, 2026 3:41 AM', 'resets 12:30pm (Mars/Olympus)', '', null])
    assert.equal(resetIn(said, now), null, String(said));
});

// ---------- AC1: speck review ----------

test('0623 AC1: a refused round exits with its own code, says when the limit resets and records no round', () => {
  const r = building(), at = inTwoDays();
  const res = r.runEnv({ FAKE_CODEX_EXIT: '1', FAKE_CODEX_STDOUT: refusal(at), [BUILD_ENV]: 'session-1' }, 'review', '1');
  assert.equal(REVIEWER_LIMITED, 18);
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.ok(res.stderr.includes(new Date(at).toISOString().slice(0, 16).replace('T', ' ')), res.stderr);
  assert.match(res.stderr, /usage limit/);
  assert.equal(r.roundFile(1), undefined);
  const rec = JSON.parse(fs.readFileSync(limitFile(r.dir, '0001'), 'utf8'));
  assert.deepEqual({ ...rec }, { reviewer: 'codex', resets: new Date(at).toISOString(), carry_on: new Date(at + GRACE_MS).toISOString(), session: 'session-1' });
});

test('0623 AC1: a round refused outside a build speck run started says so, and leaves nothing for speck run to wait on', () => {
  const r = building(), at = inTwoDays();
  const res = r.runEnv({ FAKE_CODEX_EXIT: '1', FAKE_CODEX_STDOUT: refusal(at), [BUILD_ENV]: '' }, 'review', '1');
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.equal(fs.existsSync(limitFile(r.dir, '0001')), false);
});

test('0623 AC1: the record goes in the main checkout, where speck run looks, from a ticket\'s own worktree', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-main-')), wt = `${dir}-wt`;
  gitIn(dir, 'init', '-q', '-b', 'main'); gitIn(dir, 'commit', '-q', '--allow-empty', '-m', 'base'); gitIn(dir, 'worktree', 'add', '-q', '-b', 'w', wt);
  assert.throws(() => stopOnLimit(wt, '0001', 'codex', `${PRO} 3:41 AM.`, { session: 's', now: new Date(2026, 10, 10, 1, 0).getTime() }), e => e.code === REVIEWER_LIMITED);
  assert.equal(fs.existsSync(limitFile(fs.realpathSync(dir), '0001')), true);
  assert.equal(fs.existsSync(limitFile(wt, '0001')), false);
});

const CLAUDE_LIKE = `
const fs = require('fs');
const count = process.env.FAKE_COUNT, n = fs.existsSync(count) ? fs.readFileSync(count, 'utf8').length : 0;
fs.appendFileSync(count, 'x'); fs.readFileSync(0);
if (n < +process.env.FAKE_PASSES) { console.log(JSON.stringify({ result: JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [{ id: 'F1', severity: 'blocking', file: 'a', issue: 'i', suggested_fix: 's', state: 'open' }], summary: 's', escalation_question: '' }), session_id: 'S1' })); process.exit(0); }
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: true, result: process.env.FAKE_SAID }));
process.exit(1);
`;
function commandRepo() {
  const r = reviewRepo({ ticketFields: 'status: building\nreviewer: fake' });
  const file = path.join(r.dir, 'speck', 'config.yml'), fake = `"${process.execPath}" "${keptFile('fake-claude-reviewer.cjs', CLAUDE_LIKE)}"`;
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(fake)}\n    resume_command: ${JSON.stringify(`${fake} {session}`)}\n    session_id_path: session_id\n`));
  r.git('add', '-A'); r.git('commit', '-qm', 'fake reviewer');
  const count = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-count-')), 'n');
  return { r, count, starts: () => fs.existsSync(count) ? fs.readFileSync(count, 'utf8').length : 0 };
}

test('0623 AC1: a command reviewer refused in Claude\'s own output exits with the same code', () => {
  const { r, count } = commandRepo();
  const res = r.runEnv({ FAKE_COUNT: count, FAKE_PASSES: '0', FAKE_SAID: 'You\'ve hit your session limit · resets 12:30pm (UTC)' }, 'review', '1');
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.match(res.stderr, /fake reviewer's usage limit/);
});

test('0623 AC1: a session the limit refuses isn\'t tried again fresh', () => {
  const { r, count, starts } = commandRepo();
  const env = { FAKE_COUNT: count, FAKE_PASSES: '1', FAKE_SAID: 'You\'ve hit your session limit · resets 12:30pm (UTC)' };
  assert.equal(r.runEnv(env, 'review', '1').status, 10);
  r.git('add', '-A'); r.git('commit', '-qm', 'round 1');
  const res = r.runEnv(env, 'review', '1');
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.equal(starts(), 2, 'one try to resume, and no fresh one');
});

// ---------- AC2 ----------

test('0623 AC2: a refused round leaves the ticket reviewing, and the next round can still start', () => {
  const r = building(), at = inTwoDays();
  r.runEnv({ FAKE_CODEX_EXIT: '1', FAKE_CODEX_STDOUT: refusal(at), [BUILD_ENV]: '' }, 'review', '1');
  assert.equal(statusIn(r), 'reviewing');
  const again = r.runEnv({ [BUILD_ENV]: '' }, 'review', '1');
  assert.equal(again.status, 10, again.stderr);
  assert.equal(statusIn(r), 'reviewing');
  assert.ok(r.roundFile(1));
});

test('0623 AC2: the build and review skills give the exit code for a reviewer\'s limit', () => {
  for (const skill of ['speck-build', 'speck-review'])
    assert.match(fs.readFileSync(path.join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8'), new RegExp(`\\b${REVIEWER_LIMITED}\\b.*usage limit`), skill);
});

// ---------- AC3 ----------

test('0623 AC3: until the reset, a build speck run started doesn\'t reach the reviewer, and is waited out too', () => {
  const r = building(), at = Date.now() + 3600000, dir = path.dirname(limitFile(r.dir, '0002'));
  fs.mkdirSync(dir, { recursive: true });
  saveRecord(limitFile(r.dir, '0002'), { reviewer: 'codex', resets: new Date(at).toISOString(), carry_on: new Date(at + GRACE_MS).toISOString(), session: 'other' });
  const res = r.runEnv({ [BUILD_ENV]: 'session-1' }, 'review', '1');
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.equal(r.calls().length, 0, 'the reviewer wasn\'t started');
  assert.equal(statusIn(r), 'reviewing');
  const mine = JSON.parse(fs.readFileSync(limitFile(r.dir, '0001'), 'utf8'));
  assert.equal(mine.session, 'session-1');
  assert.equal(Date.parse(mine.carry_on), at + GRACE_MS);
});

test('0623 AC3: another reviewer isn\'t held, and neither is a round once the limit is over', () => {
  const r = building(), dir = path.dirname(limitFile(r.dir, '0002'));
  fs.mkdirSync(dir, { recursive: true });
  const hold = (reviewer, at) => saveRecord(limitFile(r.dir, '0002'), { reviewer, resets: null, carry_on: new Date(at).toISOString(), session: 'other' });
  hold('claude', Date.now() + 3600000);
  assert.equal(r.runEnv({ [BUILD_ENV]: 's' }, 'review', '1').status, 10);
  r.git('add', '-A'); r.git('commit', '-qm', 'round 1');
  hold('codex', Date.now() - 1000);
  assert.equal(r.runEnv({ [BUILD_ENV]: 's' }, 'review', '1').status, 10);
});

test('0623 AC3: a recorded round clears the build\'s own record of the limit', () => {
  const r = building(), file = limitFile(r.dir, '0001');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  saveRecord(file, { reviewer: 'codex', resets: null, carry_on: new Date(Date.now() - 1000).toISOString(), session: 's' });
  assert.equal(r.runEnv({ [BUILD_ENV]: 's' }, 'review', '1').status, 10);
  assert.equal(fs.existsSync(file), false);
});

// A runs folder and a queue over it with a clock the test moves. refuse() leaves a build stopped as speck review and
// speck run record it.
function setup({ status = 'reviewing', max = 4, at = Date.parse('2026-11-10T11:57:00Z'), heldBuild } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-rlimit-'));
  const clock = { now: at }, said = [], starts = [], running = new Set(), statuses = new Map();
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  const q = reviewerLimitQueue({ repo: dir, runs: () => dir, settings: () => ({ cfg, words, max }), running, say: m => said.push(m), now: () => clock.now,
    statusOf: id => statuses.get(id) ?? status, resumeHint: () => 'Resume it by hand', ...(heldBuild ? { heldBuild } : {}),
    startBuild: (id, argv, cwd, shown, flags, rec) => { running.add(id); starts.push({ id, argv, cwd, shown, flags, rec: JSON.parse(rec(123)) }); } });
  const limit = (id, resets, { reviewer = 'codex', session = `s-${id}` } = {}) => {
    fs.mkdirSync(path.join(dir, 'reviewer-limits'), { recursive: true });
    saveRecord(path.join(dir, 'reviewer-limits', `${id}.json`), { reviewer, resets: resets === null ? null : new Date(resets).toISOString(), carry_on: new Date(resets === null ? clock.now + RETRY_MS : resets + GRACE_MS).toISOString(), session });
  };
  const stop = id => saveRecord(path.join(dir, `${id}.json`), { id, session: `s-${id}`, cwd: dir, pid: 1, exited: new Date(clock.now).toISOString(), exit_code: 0 });
  const refuse = (id, resets, o) => { limit(id, resets, o); stop(id); return q.ended(id, path.join(dir, `${id}.json`)); };
  return { dir, clock, said, starts, running, statuses, q, limit, stop, refuse, ts: (id = '0001', s = status) => [T(id, s)] };
}
const RESET = Date.parse('2026-11-10T12:30:00Z');

test('0623 AC1: speck run says the limit once, and shows it on the bar', () => {
  const s = setup();
  assert.equal(s.refuse('0001', RESET), true);
  assert.equal(s.refuse('0002', RESET), true);
  s.q.check([T('0001', 'reviewing'), T('0002', 'reviewing')]);
  s.q.check([T('0001', 'reviewing'), T('0002', 'reviewing')]);
  assert.equal(s.said.filter(m => /usage limit is reached until 12:30 UTC/.test(m)).length, 1, s.said.join('\n'));
  assert.equal(s.q.view().until, '12:30');
  assert.match(s.q.view().why, /codex/);
});

test('0623 AC1: the bar waits while nothing builds, and keeps saying what\'s building', () => {
  const limit = { until: '12:30', why: 'The codex reviewer\'s usage limit is reached.', reviewer: true };
  const on = { on: true, pid: 7, since: '2026-11-10T11:00:00Z' };
  assert.equal(foremanView({ run: on, record: { lock: 7, building: [], ready: [], ship: null, limit }, tickets: [] }).word, 'Waiting: usage limit until 12:30');
  const v = foremanView({ run: on, record: { lock: 7, building: ['0009'], ready: [], ship: null, limit }, tickets: [T('0009', 'building')] });
  assert.equal(v.word, 'Building 1');
  assert.ok(v.held.includes(limit.why));
});

test('0623 AC1: a build waiting out the reviewer isn\'t counted as needing you', () => {
  const s = setup();
  s.refuse('0001', RESET);
  assert.deepEqual(reviewerWaiting(s.dir), ['0001']);
  const t = T('0001', 'reviewing', { build_exit: { code: 0 } });
  assert.equal(stoppedForYou(t, { on: true, fixing: 'fix', agent: agentView(s.dir, [t]) }), false);
});

test('0623 AC3: nothing is resumed until a minute after the reset, then it is, once, in its own session', () => {
  const s = setup();
  s.refuse('0001', RESET);
  s.clock.now = RESET + GRACE_MS - 1;
  s.q.check(s.ts());
  assert.equal(s.starts.length, 0);
  assert.equal(s.q.holdsBuild('0001'), true);
  s.clock.now = RESET + GRACE_MS;
  assert.equal(s.q.holdsBuild('0001'), false);
  s.q.check(s.ts());
  assert.equal(s.starts.length, 1);
  assert.equal(s.starts[0].shown, 's-0001');
  assert.ok(s.starts[0].argv.includes('--resume'));
  assert.ok(s.starts[0].argv.some(w => /review round again/.test(w) && /codex/.test(w)), s.starts[0].argv.join(' '));
  assert.equal(Object.hasOwn(s.starts[0].rec, 'exited'), false);
  s.running.clear();
  s.q.check(s.ts());
  assert.equal(s.starts.length, 1, 'once');
  assert.deepEqual(readLimits(s.dir), []);
});

test('0623 AC3: a build still running isn\'t resumed, and is once it has ended', () => {
  const s = setup();
  s.limit('0001', RESET);
  saveRecord(path.join(s.dir, '0001.json'), { id: '0001', session: 's-0001', cwd: s.dir, pid: 1 });
  s.running.add('0001');
  s.clock.now = RESET + GRACE_MS;
  s.q.check(s.ts());
  assert.equal(s.starts.length, 0);
  assert.equal(readLimits(s.dir).length, 1);
  s.running.clear();
  s.stop('0001');
  assert.equal(s.q.ended('0001', path.join(s.dir, '0001.json')), true);
  s.q.check(s.ts());
  assert.equal(s.starts.length, 1);
});

test('0623 AC3: it waits for a build slot, and for a limit its own builder is held by', () => {
  const s = setup({ max: 1 });
  s.refuse('0001', RESET);
  s.clock.now = RESET + GRACE_MS;
  s.running.add('0009');
  s.q.check(s.ts());
  assert.equal(s.starts.length, 0);
  assert.equal(readLimits(s.dir).length, 1);
  s.running.clear();
  s.q.check(s.ts());
  assert.equal(s.starts.length, 1);
  let builderHeld = true;
  const b = setup({ heldBuild: () => builderHeld });
  b.refuse('0001', RESET);
  b.clock.now = RESET + GRACE_MS;
  b.q.check(b.ts());
  assert.equal(b.starts.length, 0);
  builderHeld = false;
  b.q.check(b.ts());
  assert.equal(b.starts.length, 1);
});

test('0623 AC3: a ticket that has moved on isn\'t resumed', () => {
  for (const status of ['approved', 'blocked', 'done', 'cancelled']) {
    const s = setup({ status: 'reviewing' });
    s.refuse('0001', RESET);
    s.clock.now = RESET + GRACE_MS;
    s.q.check([T('0001', status)]);
    assert.equal(s.starts.length, 0, status);
    assert.deepEqual(readLimits(s.dir), [], status);
  }
});

// A build that ends on a refusal on its first run, as the skill tells it to, and just records itself on the next.
const REFUSED_BUILD = `
const fs = require('fs'), path = require('path');
const [out, flag, session, prompt] = process.argv.slice(2);
const git = require('child_process').execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim();
const calls = path.join(git, 'fake-out'), n = fs.readdirSync(calls).length;
fs.writeFileSync(path.join(calls, n + '.json'), JSON.stringify({ at: Date.now(), flag, session, prompt }));
if (n === 0) {
  const dir = path.join(path.dirname(git), 'speck', '.cache', 'runs', 'reviewer-limits'), at = Date.now() + 1500;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '0001.json'), JSON.stringify({ reviewer: 'codex', resets: new Date(at).toISOString(), carry_on: new Date(at).toISOString(), session: process.env.SPECK_BUILD_SESSION }));
}
`;

test('0623 AC3: speck run waits out a build that stopped for the reviewer\'s limit, then resumes it in its own session', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'reviewing' }]], command: `"${process.execPath}" "${keptFile('fake-refused-build.cjs', REFUSED_BUILD)}" @repo --session-id {session} "/speck-build {id}"` });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  // Started through a killed build's resume, as a reviewing ticket isn't launched: the same way any build in hand carries on.
  const session = '11111111-1111-4111-8111-111111111111';
  fs.writeFileSync(path.join(runs, '0001.log'), '');
  saveRecord(path.join(runs, '0001.json'), { id: '0001', session, cwd: r.dir, pid: deadPid(), started: new Date().toISOString() });
  const run = startRun(r.dir);
  try {
    await waitFor(() => r.calls().length === 2, 'the build to be resumed after the limit', run.out);
    const [first, second] = r.calls();
    assert.equal(second.flag, '--resume');
    assert.equal(second.session, first.session);
    assert.match(second.prompt, /review round again/);
    assert.match(run.out(), /usage limit/);
    await waitFor(() => Object.hasOwn(record(r.dir, '0001'), 'exited'), 'the resumed build to end', run.out);
    assert.doesNotMatch(run.out(), /I'll look into it/);
  } finally { await stopRun(run); }
});

// ---------- AC4 ----------

test('0623 AC4: with no reset time speck review waits 30 minutes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-main-')), now = Date.parse('2026-11-10T11:57:00Z');
  assert.throws(() => stopOnLimit(dir, '0001', 'codex', 'You\'ve hit your usage limit. Try again later.', { session: 's', now }), e => e.code === REVIEWER_LIMITED && /doesn't say when/.test(e.message));
  const rec = JSON.parse(fs.readFileSync(limitFile(dir, '0001'), 'utf8'));
  assert.equal(rec.resets, null);
  assert.equal(Date.parse(rec.carry_on), now + RETRY_MS);
});

test('0623 AC4: a reset time already past, or absurdly far off, is treated as none', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-main-')), now = new Date(2026, 10, 10, 12, 0).getTime();
  for (const said of [`${PRO} Oct 1st, 2026 3:41 AM.`, `${PRO} Oct 1st, 2030 3:41 AM.`]) {
    assert.throws(() => stopOnLimit(dir, '0001', 'codex', said, { session: 's', now }), e => e.code === REVIEWER_LIMITED);
    const rec = JSON.parse(fs.readFileSync(limitFile(dir, '0001'), 'utf8'));
    assert.equal(rec.resets, null, said);
    assert.equal(Date.parse(rec.carry_on), now + RETRY_MS, said);
  }
});

test('0623 AC4: speck run tries again after 30 minutes, and every 30 minutes after', () => {
  const s = setup();
  for (let tries = 1; tries <= 3; tries++) {
    s.refuse('0001', null);
    s.clock.now += RETRY_MS - 1;
    s.q.check(s.ts());
    assert.equal(s.starts.length, tries - 1);
    s.clock.now += 1;
    s.q.check(s.ts());
    assert.equal(s.starts.length, tries);
    s.running.clear();
  }
  assert.ok(s.said.some(m => /doesn't say when it resets/.test(m)), s.said.join('\n'));
});

test('0623 AC4: builds refused a few minutes apart, with no reset time, say the limit once', () => {
  const s = setup();
  s.refuse('0001', null);
  s.q.check([T('0001', 'reviewing')]);
  s.clock.now += 5 * MIN;
  s.refuse('0002', null);
  s.q.check([T('0001', 'reviewing'), T('0002', 'reviewing')]);
  assert.equal(s.said.filter(m => /doesn't say when it resets/.test(m)).length, 1, s.said.join('\n'));
});

// ---------- AC5 ----------

test('0623 AC5: a round failing for any other reason exits 1 and puts the ticket back, with nothing to wait on', () => {
  const r = building();
  const res = r.runEnv({ FAKE_CODEX_EXIT: '1', FAKE_CODEX_STDOUT: lines({ type: 'turn.failed', error: { message: 'The model is not supported.' } }), [BUILD_ENV]: 's' }, 'review', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.match(res.stderr, /codex exited 1: The model is not supported\./);
  assert.equal(statusIn(r), 'building');
  assert.equal(fs.existsSync(limitFile(r.dir, '0001')), false);
});

test('0623 AC5: a command reviewer failing for another reason fails as before', () => {
  const { r, count } = commandRepo();
  const failed = r.runEnv({ FAKE_COUNT: count, FAKE_PASSES: '0', FAKE_SAID: 'API Error: 500' }, 'review', '1');
  assert.equal(failed.status, 1, failed.stderr);
  assert.equal(statusIn(r), 'building');
});

test('0623 AC5: a build with no record of the limit, or another session\'s, is handled as any other stop', () => {
  const s = setup();
  s.stop('0001');
  assert.equal(s.q.ended('0001', path.join(s.dir, '0001.json')), false);
  assert.equal(s.refuse('0002', RESET, { session: 'someone-else' }), false);
  assert.deepEqual(reviewerWaiting(s.dir).includes('0001'), false);
  s.statuses.set('0003', 'blocked');
  assert.equal(s.refuse('0003', RESET), false);
});

test('0623 AC5: an unreadable record is ignored and cleared', () => {
  const s = setup();
  fs.mkdirSync(path.join(s.dir, 'reviewer-limits'), { recursive: true });
  for (const [name, text] of [['0001.json', '{half'], ['0002.json', '[]'], ['0003.json', JSON.stringify({ reviewer: 'codex', carry_on: 'soon', session: 's' })], ['__proto__.json', JSON.stringify({ reviewer: 'codex', carry_on: new Date(RESET).toISOString(), session: 's' })]])
    fs.writeFileSync(path.join(s.dir, 'reviewer-limits', name), text);
  assert.deepEqual(readLimits(s.dir), []);
  assert.equal(s.q.view(), null);
  s.q.check([]);
  assert.deepEqual(fs.readdirSync(path.join(s.dir, 'reviewer-limits')), []);
});
