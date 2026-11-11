// 0649: while the reviewer's own agent is held by a recorded usage limit, review rounds run on the first agent on its
// bench that can take them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { standInFor, readyAgents } from '../scripts/review-stand-in.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';
import { agentHeld, REVIEWER_LIMITED } from '../scripts/reviewer-limit.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';
import { parseTicket } from '../scripts/speck.mjs';
import { reviewRepo, gitIn, gitEnv } from './support/speck.mjs';

const HOUR = 3600000;
const runsIn = dir => path.join(dir, 'speck', '.cache', 'runs');
const limitFile = (dir, id) => path.join(runsIn(dir), 'reviewer-limits', `${id}.json`);
const iso = ms => new Date(ms).toISOString();
// A limit on record for `reviewer`, as another build's `speck review` leaves it, lasting until `until`.
function holdReviewer(dir, reviewer, until, id = '0002') {
  fs.mkdirSync(path.dirname(limitFile(dir, id)), { recursive: true });
  fs.writeFileSync(limitFile(dir, id), JSON.stringify({ reviewer, resets: iso(until - 60000), carry_on: iso(until), session: 'other' }));
}
function bare() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0649-'));
  gitIn(dir, 'init', '-q', '-b', 'main');
  return fs.realpathSync(dir);
}
const later = () => Date.now() + 2 * HOUR;
const pick = (dir, cfg, ready, opts = {}) => standInFor(dir, opts.fm ?? {}, { reviewer: 'codex', builder: 'codex', ...cfg }, { providers: [], ready: () => ready, held: () => false, ...opts });

// ---------- AC1: choosing the stand-in ----------

test('0649 AC1: the first agent on reviewer_bench that is ready, not held and allowed takes the round', () => {
  const dir = bare();
  holdReviewer(dir, 'codex', later());
  assert.equal(pick(dir, { reviewer_bench: 'cursor, claude' }, ['codex', 'cursor', 'claude']).name, 'cursor');
  assert.equal(pick(dir, { reviewer_bench: 'cursor, claude' }, ['codex', 'claude']).name, 'claude', 'cursor isn\'t ready');
  assert.equal(pick(dir, { reviewer_bench: 'cursor, claude' }, ['codex', 'cursor', 'claude'], { held: a => a === 'cursor' }).name, 'claude', 'cursor is held');
  const sub = pick(dir, { reviewer_bench: 'claude' }, ['claude']);
  assert.equal(sub.for, 'codex');
  assert.match(sub.why, /^the codex reviewer's usage limit is reached until \d{4}-\d\d-\d\d \d\d:\d\d UTC$/);
});

test('0649 AC1: a stand-in the same-model rule refuses for this build is skipped, unless allow_same_model_review is on', () => {
  const dir = bare();
  holdReviewer(dir, 'codex', later());
  assert.equal(pick(dir, { builder: 'claude', reviewer_bench: 'claude, cursor' }, ['claude', 'cursor']).name, 'cursor');
  assert.equal(pick(dir, { builder: 'claude', reviewer_bench: 'claude, cursor', allow_same_model_review: true }, ['claude', 'cursor']).name, 'claude');
  assert.equal(pick(dir, { reviewer_bench: 'claude, cursor' }, ['claude', 'cursor'], { fm: { builder: 'claude' } }).name, 'cursor', 'the ticket\'s own builder counts');
});

test('0649 AC1: a blank bench is your ready agents in order, without the reviewer\'s own', () => {
  const dir = bare();
  holdReviewer(dir, 'codex', later());
  assert.equal(pick(dir, {}, ['codex', 'claude', 'cursor']).name, 'claude');
  assert.equal(pick(dir, {}, ['codex', 'deepseek']), null, 'a provider on an API key isn\'t on a blank bench');
});

test('0649 AC1: a ticket\'s own reviewer is stood in for, even one the bench names', () => {
  const dir = bare();
  holdReviewer(dir, 'cursor', later());
  assert.equal(pick(dir, { reviewer_bench: 'cursor, claude' }, ['cursor', 'claude'], { fm: { reviewer: 'cursor' } }).name, 'claude');
});

test('0649 AC1: Claude held by its own usage limit as a builder counts as held', () => {
  const dir = bare();
  assert.equal(agentHeld(dir, 'claude'), false);
  fs.mkdirSync(runsIn(dir), { recursive: true });
  fs.writeFileSync(path.join(runsIn(dir), 'run.usage-limit.json'), JSON.stringify({ resets: null, carry_on: iso(later()), builds: [] }));
  assert.equal(agentHeld(dir, 'claude'), true);
  assert.equal(agentHeld(dir, 'cursor'), false);
  holdReviewer(dir, 'claude-subagent', later());
  assert.equal(agentHeld(dir, 'claude'), true);
});

// ---------- AC3 and AC4: none free, or the limit over ----------

test('0649 AC3: with no agent free there is no stand-in', () => {
  const dir = bare();
  holdReviewer(dir, 'codex', later());
  assert.equal(pick(dir, { reviewer_bench: 'claude' }, ['codex']), null, 'not ready');
  assert.equal(pick(dir, { reviewer_bench: 'claude' }, ['claude'], { held: () => true }), null, 'held');
  assert.equal(pick(dir, { reviewer_bench: 'claude' }, ['claude'], { ready: () => { throw new Error('unreadable'); } }), null, 'can\'t be read');
});

test('0649 AC3: with no agents of yours on this machine, none is asked whether it is ready', () => {
  const dir = bare();
  fs.mkdirSync(path.dirname(yourAgentsFile(dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(dir), JSON.stringify({ agents: [] }));
  const was = process.env.PATH;
  try { process.env.PATH = ''; assert.deepEqual(readyAgents(dir), []); } finally { process.env.PATH = was; }
});

test('0649 AC4: once the limit has reset there is no stand-in', () => {
  const dir = bare();
  assert.equal(pick(dir, { reviewer_bench: 'claude' }, ['claude']), null, 'no limit on record');
  holdReviewer(dir, 'codex', Date.now() - 1000);
  assert.equal(pick(dir, { reviewer_bench: 'claude' }, ['claude']), null, 'its carry-on time has passed');
});

// ---------- speck review with fake agents ----------

const verdict = v => ({ verdict: v, criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' });
// A fake `claude`, signed in unless FAKE_SIGNED_OUT, that reviews with FAKE_VERDICT and logs its arguments and prompts,
// and a fake `codex`, signed in, refusing on its limit when FAKE_REFUSE is set.
function fakeAgents() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0649-bin-')), log = path.join(bin, 'calls.log');
  const head = `#!${process.execPath}\nconst fs = require('fs'), args = process.argv.slice(2), log = ${JSON.stringify(log)};\n`;
  fs.writeFileSync(path.join(bin, 'claude'), `${head}
if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: !process.env.FAKE_SIGNED_OUT })); process.exit(0); }
fs.appendFileSync(log, JSON.stringify({ agent: 'claude', args, prompt: fs.readFileSync(0, 'utf8') }) + '\\n');
console.log(JSON.stringify({ result: JSON.stringify(process.env.FAKE_VERDICT === 'approve' ? ${JSON.stringify(verdict('approve'))} : ${JSON.stringify(verdict('changes_requested'))}), session_id: 'C1' }));
`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'codex'), `${head}
if (args[0] === 'login') process.exit(0);
fs.appendFileSync(log, JSON.stringify({ agent: 'codex', args, prompt: fs.readFileSync(0, 'utf8') }) + '\\n');
if (process.env.FAKE_REFUSE) { console.log(JSON.stringify({ type: 'turn.failed', error: { message: 'You\\u2019ve hit your usage limit. Try again later.' } })); process.exit(1); }
fs.writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify(${JSON.stringify(verdict('changes_requested'))}));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
`, { mode: 0o755 });
  const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : []);
  return { PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter), calls };
}
function standInRepo() {
  const r = reviewRepo({ ticketFields: 'status: building\nbuilder: cursor\nreviewer_model: gpt-own', config: '\nreviewer_bench: claude\n' });
  const agents = fakeAgents();
  const review = (more = {}) => r.runEnv({ PATH: agents.PATH, [BUILD_ENV]: 'session-1', FAKE_VERDICT: 'changes_requested', ...more }, 'review', '1');
  const commit = () => { r.git('add', '-A'); r.git('commit', '-qm', 'round'); };
  return { r, ...agents, review, commit };
}

test('0649 AC1, AC2, AC4: rounds run on the stand-in while the reviewer is held, then go back to it in a fresh session', () => {
  const { r, calls, review, commit } = standInRepo();
  holdReviewer(r.dir, 'codex', later());

  const one = review();
  assert.equal(one.status, 10, one.stderr);
  assert.match(one.stdout, /runs on claude, the first agent on reviewer_bench/);
  assert.match(one.stdout, /Ran on claude, standing in for codex, as the codex reviewer's usage limit is reached until /);
  assert.deepEqual(calls().map(c => c.agent), ['claude'], 'codex isn\'t asked while its limit is on record');
  assert.ok(!calls()[0].args.includes('gpt-own'), 'the stand-in runs on its own default model');
  const rec = r.roundFile(1);
  assert.equal(rec.meta.reviewer, 'claude');
  assert.equal(rec.meta.reviewer_model, 'default');
  assert.equal(rec.meta.stand_in.for, 'codex');
  assert.match(rec.meta.stand_in.why, /usage limit is reached until/);
  assert.match(fs.readFileSync(r.ticketFile, 'utf8'), /<summary>Round 1 · claude · changes_requested · standing in for codex<\/summary>/);
  assert.equal(fs.existsSync(limitFile(r.dir, '0001')), false, 'the round was recorded, so its build isn\'t waiting');
  assert.equal(fs.existsSync(limitFile(r.dir, '0002')), true, 'another build\'s record stays');

  // AC2: the review pack says so.
  commit();
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /Round 1 \(claude, model default, effort default, standing in for codex, as the codex reviewer's usage limit is reached until [^)]+\): \*\*changes_requested\*\*/);

  // AC4: the limit over, the next round is codex's, fresh, with the full history.
  holdReviewer(r.dir, 'codex', Date.now() - 1000);
  const two = review();
  assert.equal(two.status, 10, two.stderr);
  const back = calls().at(-1);
  assert.equal(back.agent, 'codex');
  assert.deepEqual(back.args.slice(0, 2), ['exec', '--sandbox'], 'a fresh session, not a resumed one');
  assert.match(back.prompt, /# Earlier review rounds/);
  assert.match(two.stdout, /Started a fresh codex session with the full history, because round 1 was reviewed by claude/);
  assert.equal(r.roundFile(2).meta.reviewer, 'codex');
  assert.equal(r.roundFile(2).meta.stand_in, undefined);
});

test('0649 AC1: a round the reviewer refuses for its limit runs on the stand-in straight away', () => {
  const { r, calls, review } = standInRepo();
  const res = review({ FAKE_REFUSE: '1' });
  assert.equal(res.status, 10, res.stderr);
  assert.deepEqual(calls().map(c => c.agent), ['codex', 'claude']);
  assert.equal(r.roundFile(1).meta.stand_in.for, 'codex');
  assert.match(r.roundFile(1).meta.stand_in.why, /didn't say when it resets/);
  assert.equal(fs.existsSync(limitFile(r.dir, '0001')), false);
});

test('0649 AC2: the review log line says the round ran on a stand-in and why', () => {
  const { r, review, commit } = standInRepo();
  holdReviewer(r.dir, 'codex', later());
  const res = review({ FAKE_VERDICT: 'approve' });
  assert.equal(res.status, 0, res.stderr);
  const text = fs.readFileSync(r.ticketFile, 'utf8');
  fs.writeFileSync(r.ticketFile, text.replace('## Review rounds', '## Review log\n\n## Delivery log\n\n## Review rounds'));
  commit();
  const closed = r.runEnv(gitEnv, 'close', '1');
  assert.equal(closed.status, 0, closed.stderr);
  const log = [].concat(parseTicket(fs.readFileSync(r.ticketFile, 'utf8')).sections['review log']).join('\n');
  assert.match(log, /^Round 1 \(claude, standing in for codex, as the codex reviewer's usage limit is reached until \d{4}-\d\d-\d\d \d\d:\d\d UTC\): approve\.$/m);
});

test('0649 AC3: with no agent on the bench free, the round ends as a refused one does', () => {
  const { r, calls, review } = standInRepo();
  holdReviewer(r.dir, 'codex', later());
  const res = review({ FAKE_SIGNED_OUT: '1' });
  assert.equal(res.status, REVIEWER_LIMITED, res.stderr);
  assert.match(res.stderr, /The codex reviewer's usage limit is reached until/);
  assert.deepEqual(calls(), []);
  assert.equal(r.roundFile(1), undefined);
  assert.equal(JSON.parse(fs.readFileSync(limitFile(r.dir, '0001'), 'utf8')).session, 'session-1', 'speck run carries the build on after the reset');
});

test('0649 AC1: a stand-in taking over from a later round starts a fresh session with the full history', () => {
  const { r, calls, review, commit } = standInRepo();
  assert.equal(review().status, 10);
  commit();
  holdReviewer(r.dir, 'codex', later());
  const res = review();
  assert.equal(res.status, 10, res.stderr);
  const sub = calls().at(-1);
  assert.equal(sub.agent, 'claude');
  assert.ok(!sub.args.includes('--resume'), 'a fresh session');
  assert.match(sub.prompt, /# Earlier review rounds[\s\S]*## Your round 1 verdict/);
  assert.match(res.stdout, /Started a fresh claude session with the full history, because it stands in for codex/);
});

test('0649 AC1: each round on a stand-in starts a fresh session with the full history, the same stand-in\'s included', () => {
  const { r, calls, review, commit } = standInRepo();
  holdReviewer(r.dir, 'codex', later());
  assert.equal(review().status, 10);
  commit();
  const res = review();
  assert.equal(res.status, 10, res.stderr);
  const [first, second] = calls();
  assert.equal(first.agent, 'claude');
  assert.equal(second.agent, 'claude');
  assert.ok(!second.args.includes('--resume'), 'not a resumed session');
  assert.match(second.prompt, /# Earlier review rounds[\s\S]*## Your round 1 verdict/);
  assert.match(res.stdout, /Started a fresh claude session with the full history, because it stands in for codex/);
  assert.equal(r.roundFile(2).meta.session, 'fresh');
});
