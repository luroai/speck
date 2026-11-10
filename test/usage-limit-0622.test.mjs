// 0622: a build that stops on Claude's usage limit is waited out, then carried on, by speck run.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { limitInLog, usageLimitQueue, limitWaiting, readLimit, RETRY_MS, GRACE_MS } from '../scripts/usage-limit.mjs';
import { foremanView, foremanLines, stoppedForYou } from '../scripts/foreman.mjs';
import { foremanAgentQueue, agentView } from '../scripts/foreman-agent.mjs';
import { handBackQueue } from '../scripts/hand-back.mjs';
import { goWithQueue } from '../scripts/go-with.mjs';
import { launchAgent } from '../scripts/ticket-builder.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { T } from './support/panel.mjs';
import { runRepo, startRun, stopRun, waitFor, record } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { deadPid } from './support/blocked.mjs';

const RESET = Date.parse('2026-11-10T12:30:00Z'), MIN = 60000;
const event = (status, resetsAt = RESET / 1000) => ({ type: 'rate_limit_event', rate_limit_info: { status, ...(resetsAt === null ? {} : { resetsAt }), rateLimitType: 'five_hour' } });
const synthetic = { type: 'assistant', error: 'rate_limit', api_error: 'usage_limit_reached', message: { model: '<synthetic>', content: [{ type: 'text', text: 'You\'ve hit your session limit · resets 12:30pm (UTC)' }] } };
const real = { type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Working.' }] } };
const failedResult = { type: 'result', subtype: 'success', is_error: true, api_error_status: 429, result: 'You\'ve hit your session limit · resets 12:30pm (UTC)' };
const log = (...events) => `${events.map(e => JSON.stringify(e)).join('\n')}\n`;
const REFUSED = log({ type: 'system', subtype: 'init' }, real, event('allowed_warning'), event('rejected'), synthetic, failedResult);

// A runs folder and a queue over it with a clock the test moves. build() leaves a build stopped as speck run records it.
function setup({ status = 'building', max = 4, at = Date.parse('2026-11-10T11:57:00Z') } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-limit-'));
  const clock = { now: at }, said = [], starts = [], running = new Set(), statuses = new Map();
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  const q = usageLimitQueue({ repo: dir, runs: () => dir, settings: () => ({ cfg, words, max }), running, say: m => said.push(m), now: () => clock.now,
    statusOf: id => statuses.get(id) ?? status, resumeHint: () => 'Resume it by hand',
    startBuild: (id, argv, cwd, shown, flags, rec) => { running.add(id); starts.push({ id, argv, cwd, shown, flags, rec: JSON.parse(rec(123)) }); } });
  const build = (id, text = REFUSED, rec = {}) => {
    fs.writeFileSync(path.join(dir, `${id}.log`), text);
    saveRecord(path.join(dir, `${id}.json`), { id, session: `s-${id}`, cwd: dir, pid: 1, exited: new Date(clock.now).toISOString(), exit_code: 1, ...rec });
    return q.ended(id, path.join(dir, `${id}.log`), path.join(dir, `${id}.json`));
  };
  return { dir, clock, said, starts, running, statuses, cfg, words, q, build, rec: id => JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8')) };
}

// ---------- AC1 ----------

test('0622 AC1: a rejected rate_limit_event is read with its reset time', () => {
  assert.deepEqual(limitInLog(REFUSED), { resets: RESET, type: 'five_hour' });
});

test('0622 AC1: warnings, and a refusal the build got past, aren\'t the limit being reached', () => {
  assert.equal(limitInLog(log(event('allowed'), event('allowed_warning'), real)), null);
  assert.equal(limitInLog(log(event('rejected'), synthetic, real)), null, 'it carried on working');
  assert.equal(limitInLog(log(event('rejected'), event('allowed'))), null);
  assert.equal(limitInLog(log(event('rejected'), { type: 'result', is_error: false, result: 'Done.' })), null);
});

test('0622 AC1: a log that isn\'t all events is read without failing', () => {
  assert.equal(limitInLog(''), null);
  assert.equal(limitInLog('plain output\n{not json\n[1,2]\nnull\n'), null);
  assert.equal(limitInLog(log({ type: 'rate_limit_event' }, { type: 'rate_limit_event', rate_limit_info: 'x' })), null);
});

test('0622 AC1: the limit and when it resets are recorded, and said once however many builds stop on it', () => {
  const s = setup();
  assert.equal(s.build('0001'), true);
  assert.equal(s.build('0002'), true);
  const kept = readLimit(s.dir);
  assert.equal(Date.parse(kept.resets), RESET);
  assert.deepEqual(kept.builds, ['0001', '0002']);
  assert.deepEqual(s.said.filter(l => /usage limit is reached/.test(l)), ['» Claude\'s usage limit is reached until 12:30 UTC, so I\'ll carry on then.']);
});

test('0622 AC1: a later reset replaces an earlier one and is said, an earlier one changes nothing', () => {
  const s = setup();
  s.build('0001');
  s.build('0002', log(event('rejected', RESET / 1000 - 3600)));
  assert.equal(Date.parse(readLimit(s.dir).resets), RESET);
  s.build('0003', log(event('rejected', RESET / 1000 + 3600)));
  assert.equal(Date.parse(readLimit(s.dir).resets), RESET + 3600000);
  assert.match(s.said.at(-1), /until 13:30 UTC/);
});

test('0622 AC1: a reset more than a day away says its date', () => {
  const s = setup();
  s.build('0001', log(event('rejected', RESET / 1000 + 2 * 86400)));
  assert.match(s.said[0], /until 2026-11-12 12:30 UTC/);
  assert.equal(s.q.view().until, '2026-11-12 12:30');
});

// ---------- AC2 ----------

test('0622 AC2: until a minute after the reset, Claude is held and other agents aren\'t', () => {
  const s = setup();
  assert.equal(s.q.holds('claude'), false, 'nothing held before the limit');
  s.build('0001');
  assert.equal(s.q.holds('claude'), true);
  assert.equal(s.q.holds('codex'), false);
  assert.equal(s.q.holds('cursor'), false);
  s.clock.now = RESET + GRACE_MS - 1;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.q.holds('claude'), true);
});

test('0622 AC2: a build is held by what it runs on, its record\'s agent or else the configured builder', () => {
  const s = setup();
  s.build('0001');
  saveRecord(path.join(s.dir, '0002.json'), { id: '0002', agent: 'codex' });
  saveRecord(path.join(s.dir, '0003.json'), { id: '0003' });
  assert.equal(s.q.holdsBuild('0002'), false);
  assert.equal(s.q.holdsBuild('0003'), true);
  assert.equal(s.q.holdsBuild('0004'), true, 'no record: it can only be resumed once one exists, so it waits');
});

test('0622 AC2: a ticket launches on its own builder, or build_command\'s when you wrote one', () => {
  const cfg = { builder: 'claude' };
  assert.equal(launchAgent(cfg, '', { builder: 'codex' }), 'codex');
  assert.equal(launchAgent(cfg, '', { builder: '' }), 'claude');
  assert.equal(launchAgent({ builder: 'cursor' }, 'my-builder {id}', { builder: 'claude' }), 'cursor', 'build_command ignores the ticket\'s builder');
});

const ON = { on: true, pid: 7 };
const bar = (limit, o = {}) => foremanView({ run: ON, record: { lock: 7, max: 2, building: [], ready: [], ship: null, ...(limit ? { limit } : {}) }, tickets: [], ...o });

test('0622 AC2: the bar reads "Waiting: usage limit until 12:30", with the reason in its detail', () => {
  const s = setup();
  s.build('0001');
  const v = bar(s.q.view());
  assert.equal(v.word, 'Waiting: usage limit until 12:30');
  assert.equal(v.tone, 'warn');
  assert.match(v.why, /usage limit is reached until 12:30 UTC/);
  assert.ok(foremanLines(v).some(l => /usage limit is reached until 12:30 UTC/.test(l)), 'speck status says why');
});

test('0622 AC2: it reads that while other builds run or ship too, and a question for you still comes first', () => {
  const limit = { until: '12:30', why: 'x' };
  assert.equal(foremanView({ run: ON, record: { lock: 7, building: ['0009'], ready: [], ship: { running: '0008' }, limit }, tickets: [T('0009', 'building')] }).word, 'Waiting: usage limit until 12:30');
  assert.equal(foremanView({ run: ON, record: { lock: 7, building: [], ready: [], ship: null, limit }, tickets: [T('0009', 'blocked', { blocked_question: 'Which?' })] }).word, 'Needs you 1');
  assert.equal(foremanView({ run: { on: false }, record: { lock: 7, limit }, tickets: [] }).word, 'Off');
});

test('0622 AC2: a ready ticket held by the limit shows as waiting on it', () => {
  const v = foremanView({ run: ON, record: { lock: 7, building: [], ready: [{ id: '0009', kind: 'limit', why: 'the usage limit' }], ship: null }, tickets: [T('0009', 'ready')] });
  assert.equal(v.word, 'Waiting: usage limit');
});

test('0622 AC2: a build waiting out the limit doesn\'t count under Needs you', () => {
  const s = setup();
  s.build('0001');
  assert.deepEqual(limitWaiting(s.dir), ['0001']);
  const t = T('0001', 'building', { build_exit: { code: 1 } });
  const agent = agentView(s.dir, [t]);
  assert.deepEqual(agent.resuming, ['0001']);
  assert.equal(stoppedForYou(t, { on: true, fixing: 'fix', agent }), false);
});

const watchQueue = (dir, heldAgent, o = {}) => {
  const starts = [];
  const q = foremanAgentQueue({ repo: dir, runs: () => dir, readConfig: () => ({ base_branch: 'main', branch_prefix: 'speck/', watch: 'fix', ...o }), words: [], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again() {} }, say: () => {},
    startBuild() {}, providers: [], cantStart: () => '', key: () => 'k', statusOf: () => 'building', heldAgent,
    start: (argv, cwd, file) => { fs.writeFileSync(file, ''); starts.push(argv); return { pid: 91000, exited: () => false }; }, alive: () => true, withToken: () => [] });
  return { q, starts };
};

test('0622 AC2: no watch agent starts on Claude while it\'s held, and what waits is looked into after', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-limit-'));
  let held = true;
  const w = watchQueue(dir, agent => held && agent === 'claude');
  w.q.stuck({ id: '0007', what: 'its build ended', log: '' });
  w.q.check([T('0007', 'building')]);
  assert.equal(w.starts.length, 0);
  held = false;
  w.q.check([T('0007', 'building')]);
  assert.equal(w.starts.length, 1);
});

test('0622 AC2: a watch agent on another agent still starts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-limit-'));
  const w = watchQueue(dir, agent => agent === 'claude', { watch_agent: 'codex' });
  w.q.stuck({ id: '0007', what: 'its build ended', log: '' });
  w.q.check([T('0007', 'building')]);
  assert.equal(w.starts.length, 1);
});

test('0622 AC2: a hand-back and a recommendation you went with wait while their build is held', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-limit-'));
  const seen = [];
  const hb = handBackQueue({ repo: dir, cfg: {}, settings: () => { seen.push('hand-back'); return null; }, running: new Set(), startBuild() {}, saveRecord, resumeHint: () => '', runs: () => dir, heldBuild: () => true });
  saveRecord(path.join(dir, '0001.json'), { id: '0001', hand_back: { kind: 'changes', why: 'x' }, go_with: { option: 'A', head: 'h' } });
  hb.check([T('0001', 'approved')]);
  const gw = goWithQueue({ repo: dir, cfg: {}, settings: () => { seen.push('go-with'); return null; }, running: new Set(), startBuild() {}, saveRecord, resumeHint: () => '', runs: () => dir, heldBuild: () => true });
  gw.check([T('0001', 'building')]);
  assert.deepEqual(seen, [], 'neither got as far as starting it');
});

// ---------- AC3 ----------

test('0622 AC3: from a minute after the reset, each stopped build is resumed once, in its own session, told the limit has reset', () => {
  const s = setup();
  s.build('0001'); s.build('0002');
  const tickets = [T('0001', 'building'), T('0002', 'reviewing')];
  s.clock.now = RESET + GRACE_MS - 1;
  s.q.check(tickets);
  assert.equal(s.starts.length, 0, 'not before');
  s.clock.now = RESET + GRACE_MS;
  s.q.check(tickets);
  assert.deepEqual(s.starts.map(x => x.id), ['0001', '0002']);
  const [first] = s.starts;
  assert.equal(first.flags, 'a');
  assert.equal(first.shown, 's-0001');
  assert.deepEqual(first.argv.slice(0, 2), ['claude', '-p']);
  assert.equal(first.argv[first.argv.indexOf('--resume') + 1], 's-0001');
  assert.match(first.argv[2], /usage limit has reset/);
  assert.match(first.argv[2], /carry on with \/speck-build 0001 from where (you|it) (left off|stopped)/i);
  assert.equal(Object.hasOwn(first.rec, 'exited'), false, 'the board shows it running');
  assert.equal(s.q.holds('claude'), false, 'new work starts again');
  assert.ok(s.said.some(l => /usage limit has reset/.test(l)));
  s.running.clear();
  s.q.check(tickets);
  assert.equal(s.starts.length, 2, 'once');
  assert.equal(readLimit(s.dir), null, 'nothing left to carry on');
});

test('0622 AC3: a build resumed for the limit can still be resumed once if it\'s killed later', () => {
  const s = setup();
  s.build('0001');
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  assert.equal(Object.hasOwn(s.starts[0].rec, 'resumed'), false);
});

test('0622 AC3: builds wait for a free slot, and a slot is never overfilled', () => {
  const s = setup({ max: 1 });
  s.build('0001'); s.build('0002');
  const tickets = [T('0001', 'building'), T('0002', 'building')];
  s.clock.now = RESET + GRACE_MS;
  s.q.check(tickets);
  assert.deepEqual(s.starts.map(x => x.id), ['0001']);
  assert.equal(s.q.waiting('0002'), true);
  s.q.check(tickets);
  assert.equal(s.starts.length, 1);
  s.running.clear();
  s.q.check(tickets);
  assert.deepEqual(s.starts.map(x => x.id), ['0001', '0002']);
});

test('0622 AC3: a build that hits the limit again is waited out the same way', () => {
  const s = setup();
  s.build('0001');
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  s.running.clear();
  const next = (RESET + 5 * 3600000) / 1000;
  const file = path.join(s.dir, '0001.log');
  fs.appendFileSync(file, log({ type: 'system', subtype: 'init' }, event('rejected', next), synthetic, failedResult));
  saveRecord(path.join(s.dir, '0001.json'), { ...s.rec('0001'), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', file, path.join(s.dir, '0001.json')), true);
  assert.equal(s.q.holds('claude'), true);
  s.clock.now = next * 1000 + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 2);
});

test('0622 AC3: a build that moved on while waiting is left as it is', () => {
  const s = setup();
  s.build('0001'); s.build('0002'); s.build('0003'); s.build('0004');
  saveRecord(path.join(s.dir, '0004.json'), { ...s.rec('0004'), exited: undefined }); // JSON drops it: resumed by hand
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'blocked'), T('0002', 'building', { build_running: true }), T('0004', 'building')]);
  assert.equal(s.starts.length, 0);
  assert.deepEqual(limitWaiting(s.dir), []);
});

test('0622 AC3: a ticket still ready when its build hit the limit is resumed rather than launched afresh', () => {
  const s = setup({ status: 'ready' });
  assert.equal(s.build('0001'), true);
  assert.equal(s.q.waiting('0001'), true);
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'ready')]);
  assert.deepEqual(s.starts.map(x => x.id), ['0001']);
});

test('0622 AC3: a build that can\'t be resumed is said once, with how to do it by hand', () => {
  const s = setup();
  s.build('0001', REFUSED, { session: null });
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 0);
  assert.equal(s.said.filter(l => /can't resume/.test(l) && /Resume it by hand/.test(l)).length, 1);
});

test('0622 AC3: the wait survives a new speck run reading the same folder', () => {
  const s = setup();
  s.build('0001');
  const again = usageLimitQueue({ repo: s.dir, runs: () => s.dir, settings: () => ({ cfg: s.cfg, words: s.words, max: 4 }), running: new Set(), say: () => {}, now: () => s.clock.now, startBuild() {}, resumeHint: () => '' });
  assert.equal(again.holds('claude'), true);
  assert.equal(again.waiting('0001'), true);
});

test('0622 AC3: an unreadable record of the wait is no wait at all', () => {
  const s = setup();
  fs.writeFileSync(path.join(s.dir, 'run.usage-limit.json'), '{half');
  assert.equal(readLimit(s.dir), null);
  assert.equal(s.q.holds('claude'), false);
  fs.writeFileSync(path.join(s.dir, 'run.usage-limit.json'), JSON.stringify({ carry_on: 'soon', builds: ['0001', 2, '__proto__'] }));
  assert.equal(s.q.holds('claude'), false);
  assert.deepEqual(limitWaiting(s.dir), ['0001', '__proto__']);
});

// ---------- AC4 ----------

test('0622 AC4: a limit with no reset time is seen, in any form the log gives it', () => {
  assert.deepEqual(limitInLog(log(event('rejected', null))), { resets: null, type: 'five_hour' });
  assert.deepEqual(limitInLog(log(event('rejected', 'soon'))), { resets: null, type: 'five_hour' });
  assert.deepEqual(limitInLog(log(real, synthetic)), { resets: null, type: null });
  assert.deepEqual(limitInLog(log(real, failedResult)), { resets: null, type: null });
});

test('0622 AC4: the build\'s own words about limits, and other errors, aren\'t the limit', () => {
  assert.equal(limitInLog(log({ type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'text', text: 'You\'ve hit your session limit' }] } })), null);
  assert.equal(limitInLog(log({ type: 'result', is_error: false, result: 'You\'ve hit your session limit' })), null);
  assert.equal(limitInLog(log({ type: 'result', is_error: true, result: 'API Error: 500' })), null);
});

test('0622 AC4: with no reset time it tries again after 30 minutes, and every 30 minutes after, until a build gets past it', () => {
  const start = Date.parse('2026-11-10T11:57:00Z');
  const s = setup({ at: start });
  const refused = log(event('rejected', null));
  s.build('0001', refused);
  assert.equal(RETRY_MS, 30 * MIN);
  assert.match(s.said[0], /doesn't say when it resets.*12:27 UTC.*every 30 minutes/);
  assert.equal(s.q.view().until, null);
  assert.equal(bar(s.q.view()).word, 'Waiting: usage limit');
  s.clock.now = start + RETRY_MS - 1;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 0);
  s.clock.now = start + RETRY_MS;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 1, 'tried again');
  assert.equal(s.q.holds('claude'), false);
  s.running.clear();
  const file = path.join(s.dir, '0001.log');
  fs.appendFileSync(file, refused);
  saveRecord(path.join(s.dir, '0001.json'), { ...s.rec('0001'), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', file, path.join(s.dir, '0001.json')), true);
  assert.equal(s.q.holds('claude'), true, 'refused again: another 30 minutes');
  s.clock.now += RETRY_MS;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 2);
  s.running.clear();
  fs.appendFileSync(file, log(real, event('allowed')));
  saveRecord(path.join(s.dir, '0001.json'), { ...s.rec('0001'), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', file, path.join(s.dir, '0001.json')), false, 'past it');
  assert.equal(s.q.holds('claude'), false);
});

test('0622 AC4: more builds refused with no reset time don\'t push the retry back', () => {
  const start = Date.parse('2026-11-10T11:57:00Z');
  const s = setup({ at: start });
  s.build('0001', log(event('rejected', null)));
  s.clock.now = start + 10 * MIN;
  s.build('0002', log(event('rejected', null)));
  assert.equal(Date.parse(readLimit(s.dir).carry_on), start + RETRY_MS);
});

test('0622 AC4: a known reset beats none, and none doesn\'t replace a known reset', () => {
  const s = setup();
  s.build('0001', log(event('rejected', null)));
  s.build('0002');
  assert.equal(Date.parse(readLimit(s.dir).resets), RESET);
  s.build('0003', log(event('rejected', null)));
  assert.equal(Date.parse(readLimit(s.dir).resets), RESET);
});

test('0622 AC4: a reset time already past, or absurdly far off, is treated as none, so it can\'t spin or wait for ever', () => {
  const at = Date.parse('2026-11-10T11:57:00Z');
  const past = setup({ at });
  past.build('0001', log(event('rejected', at / 1000 - 3600)));
  assert.equal(readLimit(past.dir).resets, null);
  assert.equal(Date.parse(readLimit(past.dir).carry_on), at + RETRY_MS);
  const far = setup({ at });
  far.build('0001', log(event('rejected', at))); // milliseconds, not seconds
  assert.equal(readLimit(far.dir).resets, null);
  assert.equal(Date.parse(readLimit(far.dir).carry_on), at + RETRY_MS);
});

// ---------- AC5 ----------

test('0622 AC5: a build that stopped for any other reason isn\'t held', () => {
  const s = setup();
  assert.equal(s.build('0001', log(real, { type: 'result', is_error: true, result: 'API Error: 500' })), false);
  assert.equal(readLimit(s.dir), null);
  assert.equal(s.q.holds('claude'), false);
  assert.deepEqual(s.said, []);
});

test('0622 AC5: another agent\'s build is never read for Claude\'s limit', () => {
  const s = setup();
  assert.equal(s.build('0001', REFUSED, { agent: 'codex' }), false);
  assert.equal(s.build('0002', REFUSED, { agent: 'deepseek' }), false);
  assert.equal(readLimit(s.dir), null);
});

test('0622 AC5: a refusal already acted on isn\'t read again when a later run of the build stops for another reason', () => {
  const s = setup();
  s.build('0001');
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  s.running.clear();
  // The resumed build dies before writing anything: only the old refusal is in the log.
  saveRecord(path.join(s.dir, '0001.json'), { ...s.rec('0001'), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', path.join(s.dir, '0001.log'), path.join(s.dir, '0001.json')), false);
  assert.equal(s.q.holds('claude'), false);
});

test('0622 AC5: an approved, blocked or finished ticket isn\'t carried on, though the limit still holds new work', () => {
  for (const status of ['approved', 'blocked', 'done', 'cancelled']) {
    const s = setup({ status });
    assert.equal(s.build('0001'), false, status);
    assert.deepEqual(limitWaiting(s.dir), []);
    assert.equal(s.q.holds('claude'), true, status);
  }
});

test('0622 AC5: a missing log or record changes nothing', () => {
  const s = setup();
  assert.equal(s.q.ended('0001', path.join(s.dir, 'none.log'), path.join(s.dir, 'none.json')), false);
  assert.equal(readLimit(s.dir), null);
});

test('0622 AC5: a wait that can\'t be saved says so and leaves the build to be handled as any other stop', () => {
  const s = setup();
  fs.mkdirSync(path.join(s.dir, 'run.usage-limit.json', 'in-the-way'), { recursive: true });
  assert.equal(s.build('0001'), false);
  assert.ok(s.said.some(l => /couldn't save my record/.test(l)));
});

// ---------- speck run itself ----------

// Writes the refusal on its first run, exiting 1 as Claude Code does, and just records itself on the next.
const REFUSING = `
const fs = require('fs'), path = require('path');
const [out, flag, session, prompt] = process.argv.slice(2);
const dir = require('child_process').execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim();
const calls = path.join(dir, 'fake-out');
const n = fs.readdirSync(calls).length;
fs.writeFileSync(path.join(calls, n + '.json'), JSON.stringify({ at: Date.now(), flag, session, prompt }));
if (n === 0) {
  console.log(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected', resetsAt: Math.ceil(Date.now() / 1000) + 2, rateLimitType: 'five_hour' } }));
  console.log(JSON.stringify({ type: 'result', is_error: true, result: 'You have hit your session limit' }));
  process.exit(1);
}
`;

test('0622 AC1 AC2 AC3: speck run waits out a limit a build stopped on, then resumes it in its own session', async () => {
  const r = runRepo({ command: `"${process.execPath}" "${keptFile('fake-refusing.cjs', REFUSING)}" @repo --session-id {session} "/speck-build {id}"` });
  const run = startRun(r.dir, { SPECK_RUN_LIMIT_GRACE_MS: '0' });
  try {
    await waitFor(() => /usage limit is reached until/.test(run.out()), 'the limit to be said', run.out);
    assert.equal(r.calls().length, 1, 'nothing started while it waits');
    await waitFor(() => r.calls().length === 2, 'the build to be resumed', run.out);
    const [first, second] = r.calls();
    assert.equal(second.flag, '--resume');
    assert.equal(second.session, first.session);
    assert.match(second.prompt, /usage limit has reset/);
    await waitFor(() => Object.hasOwn(record(r.dir, '0001'), 'exited'), 'the resumed build to end', run.out);
    assert.equal(record(r.dir, '0001').session, first.session);
    assert.doesNotMatch(run.out(), /I'll look into it/);
  } finally { await stopRun(run); }
});

// Just records itself, as a build Claude lets through.
const RECORDING = REFUSING.replace(/if \(n === 0\) \{[\s\S]*\}\n$/, '');

test('0622 AC1 AC2 AC3: a build that hit the limit while speck run was off is waited out when it starts, and holds new work too', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', {}]], command: `"${process.execPath}" "${keptFile('fake-recording.cjs', RECORDING)}" @repo --session-id {session} "/speck-build {id}"` });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs'), resets = Math.ceil(Date.now() / 1000) + 3;
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.log'), log(event('rejected', resets), failedResult));
  saveRecord(path.join(runs, '0001.json'), { id: '0001', session: 'off-session', cwd: r.dir, pid: deadPid(), started: new Date().toISOString() });
  const run = startRun(r.dir, { SPECK_RUN_LIMIT_GRACE_MS: '0' });
  try {
    await waitFor(() => r.calls().length === 2, 'the build to be resumed and the next launched', run.out);
    assert.match(run.out(), /usage limit is reached until/);
    const [first, second] = r.calls();
    assert.equal(first.flag, '--resume');
    assert.equal(first.session, 'off-session');
    assert.ok(first.at >= resets * 1000, 'nothing started before the reset');
    assert.ok(second.at >= resets * 1000, 'nor did new work');
    assert.match(second.prompt, /speck-build 0002/);
  } finally { await stopRun(run); }
});
