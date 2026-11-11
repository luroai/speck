// 0644: a Codex or Cursor build that stops on its usage limit is waited out, then carried on, by speck run, as a
// Claude build is (0622).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { usageLimitQueue, limitWaiting, readLimit, RETRY_MS, GRACE_MS } from '../scripts/usage-limit.mjs';
import { codexLimitInLog, cursorLimitInLog } from '../scripts/agent-limit.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { T } from './support/panel.mjs';

const MIN = 60000;
const lines = (...events) => `${events.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n')}\n`;
const PRO = 'You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at';
const ordinal = n => (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const clockWords = ms => new Date(ms).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// Codex gives the date only when the reset is on another day, so the tests say the same thing whatever the time zone.
const dateWords = ms => { const d = new Date(ms); return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()} ${clockWords(ms)}`; };

// Times in the machine's own zone, as Codex gives them: the build stops at 01:00, and the limit resets at 03:41.
const AT = new Date(2026, 10, 10, 1, 0).getTime(), RESET = new Date(2026, 10, 10, 3, 41).getTime();
const stamped = (e, at = AT) => ({ speck_at: new Date(at).toISOString(), ...e });
const codexRefusal = (said = `${PRO} ${clockWords(RESET)}.`, at = AT) => lines(
  stamped({ type: 'thread.started', thread_id: 'T-1' }, at), stamped({ type: 'turn.started' }, at),
  stamped({ type: 'error', message: said }, at), stamped({ type: 'turn.failed', error: { message: said } }, at));
const codexWork = stamped({ type: 'item.completed', item: { type: 'agent_message', text: 'Working.' } });

// A Codex home with a session file for `thread` whose last turn ended as `error` says.
function codexHome(thread, error, at = AT) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-home-'));
  const dir = path.join(home, 'sessions', '2026', '11', '10');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `rollout-2026-11-10T01-00-00-${thread}.jsonl`), lines(
    { timestamp: new Date(at - MIN).toISOString(), type: 'event_msg', payload: { type: 'task_complete', last_agent_message: 'Done.' } },
    { timestamp: new Date(at).toISOString(), type: 'event_msg', payload: { type: 'task_complete', last_agent_message: null, error } }));
  return home;
}

const CURSOR_SAID = 'You\'ve hit your usage limit for Claude Opus. Your limit resets at 3:41 AM.';
const cursorRun = (...tail) => lines({ type: 'system', subtype: 'init', session_id: 'c-1' }, { type: 'assistant', message: { content: [{ type: 'text', text: 'Working.' }] } }, ...tail);

// A runs folder and a queue over it with a clock the test moves. build() leaves a build stopped as speck run records it.
function setup({ status = 'building', max = 4, at = AT, builder = 'claude', home } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-limit-0644-'));
  const clock = { now: at }, said = [], starts = [], running = new Set();
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  const q = usageLimitQueue({ repo: dir, runs: () => dir, settings: () => ({ cfg, words, max }), running, say: m => said.push(m), now: () => clock.now,
    statusOf: () => status, resumeHint: () => 'Resume it by hand', codexHome: home ?? path.join(dir, 'no-codex-home'),
    startBuild: (id, argv, cwd, shown, flags, rec) => { running.add(id); starts.push({ id, argv, cwd, shown, flags, rec: JSON.parse(rec(123)) }); } });
  const build = (id, agent, text, rec = {}) => {
    fs.writeFileSync(path.join(dir, `${id}.log`), text);
    saveRecord(path.join(dir, `${id}.json`), { id, agent, session: `s-${id}`, cwd: dir, pid: 1, exited: new Date(clock.now).toISOString(), exit_code: 1, ...rec });
    return q.ended(id, path.join(dir, `${id}.log`), path.join(dir, `${id}.json`));
  };
  return { dir, clock, said, starts, running, q, build };
}

// ---------- AC1: Codex ----------

test('0644 AC1: a Codex log that ends refused gives the reset time its message says, read from when it was written', () => {
  assert.deepEqual(codexLimitInLog(codexRefusal()), { resets: RESET, type: null });
  const later = RESET + 2 * 864e5;
  assert.equal(codexLimitInLog(codexRefusal(`${PRO} ${dateWords(later)}.`)).resets, later);
  assert.deepEqual(codexLimitInLog(lines(stamped({ type: 'turn.failed', error: { message: 'You\'ve hit your usage limit. Try again later.' } }))), { resets: null, type: null });
});

test('0644 AC1: usage_limit_exceeded counts as a refusal whatever the words', () => {
  assert.deepEqual(codexLimitInLog(lines(stamped({ type: 'turn.failed', error: { message: 'Stopped.', codex_error_info: 'usage_limit_exceeded' } }))), { resets: null, type: null });
});

test('0644 AC1: with no reset time in its log, the session file\'s own refusal gives it', () => {
  const home = codexHome('T-1', { message: `${PRO} ${clockWords(RESET)}.`, codex_error_info: 'usage_limit_exceeded' });
  const log = lines(stamped({ type: 'thread.started', thread_id: 'T-1' }), stamped({ type: 'turn.failed', error: { message: 'You\'ve hit your usage limit.' } }));
  assert.equal(codexLimitInLog(log, { home }).resets, RESET, 'the thread named in the log');
  assert.equal(codexLimitInLog(lines(stamped({ type: 'turn.failed', error: { message: 'You\'ve hit your usage limit.' } })), { home, thread: 'T-1' }).resets, RESET, 'the thread its run record names');
  const other = codexHome('T-1', { message: 'Something else failed. Try again at 3:41 AM.', codex_error_info: 'other' });
  assert.equal(codexLimitInLog(log, { home: other }).resets, null, 'a session that ended for another reason gives no time');
  assert.equal(codexLimitInLog(log, { home: path.join(home, 'none') }).resets, null);
});

test('0644 AC1: a Codex refusal it got past, another failure or Claude\'s own events aren\'t its limit', () => {
  assert.equal(codexLimitInLog(codexRefusal() + lines(codexWork)), null);
  assert.equal(codexLimitInLog(lines(stamped({ type: 'turn.failed', error: { message: 'stream disconnected before completion' } }))), null);
  assert.equal(codexLimitInLog(lines({ type: 'result', is_error: true, result: 'You\'ve hit your session limit · resets 12:30pm (UTC)' })), null);
  assert.equal(codexLimitInLog(lines(codexWork, stamped({ type: 'item.completed', item: { type: 'agent_message', text: 'The usage limit is reached in this test.' } }))), null, 'its own words');
  assert.equal(codexLimitInLog(''), null);
  assert.equal(codexLimitInLog('plain output\n{not json\n[1,2]\nnull\n'), null);
});

test('0644 AC1: a Codex build stopped on its limit is recorded for Codex, said once, and carried on a minute after the reset', () => {
  const s = setup({ builder: 'codex' });
  assert.equal(s.build('0001', 'codex', codexRefusal()), true);
  assert.equal(s.build('0002', 'codex', codexRefusal()), true);
  const kept = readLimit(s.dir, 'codex');
  assert.equal(Date.parse(kept.resets), RESET);
  assert.deepEqual(kept.builds, ['0001', '0002']);
  assert.equal(readLimit(s.dir), null, 'Claude\'s own record is untouched');
  assert.deepEqual(limitWaiting(s.dir), ['0001', '0002']);
  assert.equal(s.said.filter(l => /Codex's usage limit is reached until/.test(l)).length, 1, s.said.join('\n'));
  s.clock.now = RESET + GRACE_MS - 1;
  s.q.check([T('0001', 'building'), T('0002', 'building')]);
  assert.deepEqual(s.starts, []);
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building'), T('0002', 'building')]);
  assert.deepEqual(s.starts.map(b => b.id), ['0001', '0002']);
  const [first] = s.starts;
  assert.deepEqual(first.argv.slice(0, 4), ['codex', 'exec', 'resume', 's-0001']);
  assert.match(first.argv.at(-1), /Codex's usage limit has reset.*\$speck-build 0001/);
  assert.ok(s.said.some(l => /Codex's usage limit has reset/.test(l)));
  assert.equal(readLimit(s.dir, 'codex'), null, 'nothing left to wait for');
});

test('0644 AC1: a refusal already acted on isn\'t read again when the resumed Codex build stops for another reason', () => {
  const s = setup({ builder: 'codex' });
  s.build('0001', 'codex', codexRefusal());
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'building')]);
  s.running.clear();
  const file = path.join(s.dir, '0001.json');
  saveRecord(file, { ...JSON.parse(fs.readFileSync(file, 'utf8')), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', path.join(s.dir, '0001.log'), file), false);
  assert.equal(s.q.holds('codex'), false);
});

// ---------- AC2: Cursor ----------

test('0644 AC2: a Cursor build whose output ends refused is read loosely, with its reset time when it gives one', () => {
  assert.deepEqual(cursorLimitInLog(cursorRun(CURSOR_SAID), { now: AT }), { resets: RESET, type: null }, 'its error on standard error');
  assert.deepEqual(cursorLimitInLog(cursorRun('\x1b[31mError: You have reached your usage limit.\x1b[0m')), { resets: null, type: null });
  assert.deepEqual(cursorLimitInLog(cursorRun({ type: 'result', subtype: 'error', is_error: true, result: 'PRO_USER_USAGE_LIMIT' })), { resets: null, type: null });
  assert.deepEqual(cursorLimitInLog(cursorRun({ type: 'error', message: 'Usage limit exceeded for this billing period' })), { resets: null, type: null });
});

test('0644 AC2: a Cursor refusal it got past, another failure or its own words aren\'t its limit', () => {
  assert.equal(cursorLimitInLog(cursorRun(CURSOR_SAID, { type: 'assistant', message: { content: [{ type: 'text', text: 'Back.' }] } })), null);
  assert.equal(cursorLimitInLog(cursorRun('Error: Connection refused')), null);
  assert.equal(cursorLimitInLog(cursorRun({ type: 'tool_call', subtype: 'completed', tool_call: { shellToolCall: { result: { success: { stdout: 'You\'ve hit your usage limit' } } } } })), null, 'what a tool printed');
  assert.equal(cursorLimitInLog(cursorRun('You have used 90% of your usage limit')), null, 'a warning');
  assert.equal(cursorLimitInLog(''), null);
});

test('0644 AC2: a Cursor build with no reset time is tried again after 30 minutes, then carried on in its own chat', () => {
  const s = setup({ builder: 'cursor' });
  assert.equal(s.build('0001', 'cursor', cursorRun('Error: You have reached your usage limit.')), true);
  const kept = readLimit(s.dir, 'cursor');
  assert.equal(kept.resets, null);
  assert.equal(Date.parse(kept.carry_on), AT + RETRY_MS);
  assert.ok(s.said.some(l => /Cursor's usage limit is reached, and its log doesn't say when it resets/.test(l)), s.said.join('\n'));
  s.clock.now = AT + RETRY_MS;
  s.q.check([T('0001', 'building')]);
  assert.equal(s.starts.length, 1);
  assert.ok(s.starts[0].argv.includes('--resume') && s.starts[0].argv.includes('s-0001'), s.starts[0].argv.join(' '));
  assert.match(s.starts[0].argv.at(-1), /Cursor's usage limit has reset/);
});

test('0644 AC2: a Cursor build with a reset time is carried on a minute after it', () => {
  const s = setup({ builder: 'cursor' });
  assert.equal(s.build('0001', 'cursor', cursorRun(CURSOR_SAID)), true);
  assert.equal(Date.parse(readLimit(s.dir, 'cursor').carry_on), RESET + GRACE_MS);
});

test('0644 AC2: a Cursor log read hours after it stopped reads its reset time from when it was written', () => {
  const s = setup({ builder: 'cursor' });
  const later = RESET + 2 * 3600000; // speck run was off until after the reset
  s.clock.now = later;
  fs.writeFileSync(path.join(s.dir, '0001.log'), cursorRun(CURSOR_SAID));
  fs.utimesSync(path.join(s.dir, '0001.log'), AT / 1000, AT / 1000);
  saveRecord(path.join(s.dir, '0001.json'), { id: '0001', agent: 'cursor', session: 's-0001', cwd: s.dir, pid: 1, exited: new Date(AT).toISOString(), exit_code: 1 });
  assert.equal(s.q.ended('0001', path.join(s.dir, '0001.log'), path.join(s.dir, '0001.json')), true);
  assert.equal(Date.parse(readLimit(s.dir, 'cursor').carry_on), later + RETRY_MS, 'a reset already past is tried again soon, not the next day');
});

// ---------- AC3: what's held and what's said ----------

test('0644 AC3: while Codex\'s limit is recorded only Codex is held, and each agent\'s limit is kept apart', () => {
  const s = setup({ builder: 'codex' });
  s.build('0001', 'codex', codexRefusal());
  assert.equal(s.q.holds('codex'), true);
  assert.equal(s.q.holds('claude'), false);
  assert.equal(s.q.holds('cursor'), false);
  assert.equal(s.q.heldSays('codex'), 'Codex\'s usage limit is reached', 'what a ready ticket on Codex waits for');
  assert.equal(s.q.heldSays('claude'), null);
  saveRecord(path.join(s.dir, '0002.json'), { id: '0002', agent: 'claude' });
  saveRecord(path.join(s.dir, '0003.json'), { id: '0003', agent: 'codex' });
  assert.equal(s.q.holdsBuild('0002'), false);
  assert.equal(s.q.holdsBuild('0003'), true);
  assert.equal(s.q.holdsBuild('0004'), true, 'no record: the settings\' builder, Codex');
  s.build('0005', 'cursor', cursorRun('Error: You have reached your usage limit.'));
  assert.equal(s.q.holds('cursor'), true);
  assert.equal(s.q.holds('claude'), false);
});

const ON = { on: true, pid: 7 };
const bar = limit => foremanView({ run: ON, record: { lock: 7, max: 2, building: [], ready: [], ship: null, ...(limit ? { limit } : {}) }, tickets: [] });

test('0644 AC3: speck status and the panel say which agent is limited and until when', () => {
  const s = setup({ builder: 'codex' });
  s.build('0001', 'codex', codexRefusal());
  const at = new Date(RESET).toISOString().slice(11, 16);
  const v = bar(s.q.view());
  assert.equal(v.word, `Waiting: usage limit until ${at}`);
  assert.match(v.why, new RegExp(`Codex's usage limit is reached until ${at} UTC, so no build starts on Codex until then`));
  assert.ok(foremanLines(v).some(l => /Codex's usage limit is reached until/.test(l)), 'speck status says it');
  s.build('0002', 'cursor', cursorRun('Error: You have reached your usage limit.'));
  const both = bar(s.q.view());
  assert.match(both.why, /Codex's usage limit is reached until/);
  assert.match(both.why, /Cursor's usage limit is reached, so no build starts on Cursor until speck run tries again at/);
});

test('0644 AC3: a model provider\'s build is never read for a limit', () => {
  const s = setup();
  assert.equal(s.build('0001', 'deepseek', codexRefusal()), false);
  assert.equal(s.build('0002', 'deepseek', cursorRun(CURSOR_SAID)), false);
  assert.deepEqual(limitWaiting(s.dir), []);
  assert.equal(s.q.holds('deepseek'), false);
});

test('0644 AC3: the watch agent\'s own Codex or Cursor run stopped on its limit holds that agent', () => {
  const s = setup();
  const log = path.join(s.dir, 'watch.log');
  fs.writeFileSync(log, codexRefusal());
  assert.equal(s.q.agentEnded('codex', log), true);
  assert.equal(s.q.holds('codex'), true);
  fs.writeFileSync(log, cursorRun(CURSOR_SAID));
  assert.equal(s.q.agentEnded('cursor', log), true);
  assert.equal(s.q.holds('cursor'), true);
  assert.equal(s.q.holds('claude'), false);
});
