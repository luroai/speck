// 0648: a build stopped on a usage limit more than an hour from resetting is carried on by the next builder on the
// bench, from its branch and ticket.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { usageLimitQueue, readLimit } from '../scripts/usage-limit.mjs';
import { buildTakeOver, recordTakeOver, worthMoving, TAKE_OVER_MS } from '../scripts/build-take-over.mjs';
import { saveRecord, buildTicket } from '../scripts/build-records.mjs';
import { ticketSameModelProblem } from '../scripts/same-model.mjs';

Object.assign(process.env, gitEnv); // recordTakeOver commits in this process

const AT = Date.parse('2026-11-11T12:00:00Z'), MIN = 60000;
const everyone = () => true;
const refused = resetsAt => `${JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected', ...(resetsAt ? { resetsAt: resetsAt / 1000 } : {}) } })}\n`;

// A repo with ticket 0001 started in its own worktree, and speck run's limit queue over it with a clock the test moves.
// stop() leaves 0001's build stopped on Claude's limit as speck run records it, then runs one check.
function setup({ reviewer = 'claude-subagent', ready = ['claude', 'codex', 'cursor'], held = ['claude'], start = true, max = 4 } = {}) {
  const r = panelRepo({ worktrees: 'true' });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^reviewer: .*$/m, `reviewer: ${reviewer}`));
  fs.appendFileSync(r.file, '\n## Notes\n- Shaped by hand.\n');
  r.g('commit', '-qam', 'reviewer and notes');
  if (start) assert.equal(r.run('start', '1').status, 0);
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const s = { r, runs, clock: { now: AT }, said: [], starts: [], running: new Set(), held: new Set(held) };
  const cfg = () => loadConfig(r.dir);
  const settings = () => ({ cfg: cfg(), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max });
  const startBuild = (id, argv, cwd, shown, flags, rec, session) => { s.running.add(id); s.starts.push({ id, argv, cwd, shown, flags, session, rec: JSON.parse(rec(321)) }); };
  const takeOver = buildTakeOver({ repo: r.dir, runs: () => runs, startBuild, heldAgent: a => s.held.has(a) || s.q.holds(a), readyAgents: () => ready,
    speak: t => s.said.push(t), now: () => s.clock.now, providers: () => [], installed: everyone, chat: () => ({ session: 'chat-1' }) });
  s.q = usageLimitQueue({ repo: r.dir, runs: () => runs, settings, running: s.running, startBuild, resumeHint: () => 'Resume it by hand', say: t => s.said.push(t),
    now: () => s.clock.now, statusOf: () => 'building', takeOver });
  s.tickets = () => [{ id: '0001', status: 'building' }];
  s.stop = (resets, rec = {}) => {
    s.running.delete('0001');
    fs.writeFileSync(path.join(runs, '0001.log'), refused(resets));
    saveRecord(path.join(runs, '0001.json'), { id: '0001', session: 's-old', agent: 'claude', cwd: r.dir, pid: 1, exited: new Date(s.clock.now).toISOString(), exit_code: 1, ...rec });
    assert.equal(s.q.ended('0001', path.join(runs, '0001.log'), path.join(runs, '0001.json')), true);
    s.q.check(s.tickets());
  };
  s.ticket = () => { const { at, t } = buildTicket(r.dir, cfg(), '0001'); return { at, fm: parseTicket(fs.readFileSync(t.file, 'utf8')).fm, raw: fs.readFileSync(t.file, 'utf8') }; };
  s.gw = (...a) => r.g('-C', s.ticket().at, ...a);
  return s;
}

// ---------- AC1 ----------

test('0648 AC1: a build stopped with the reset more than an hour away starts again on the first free bench agent, in its worktree on its branch', () => {
  const s = setup();
  const branch = s.gw('rev-parse', '--abbrev-ref', 'HEAD');
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts.length, 1);
  const b = s.starts[0];
  assert.equal(b.id, '0001');
  assert.equal(b.cwd, s.ticket().at);
  assert.notEqual(b.cwd, s.r.dir, 'in the ticket\'s worktree, not the main checkout');
  assert.match(branch, /^speck\/0001-/);
  assert.equal(s.gw('rev-parse', '--abbrev-ref', 'HEAD'), branch);
  assert.equal(b.flags, 'w');
  assert.equal(b.argv[0], 'codex', 'Codex, the first on the bench, with its own command');
  assert.equal(b.rec.agent, 'codex');
  assert.equal(b.rec.cwd, b.cwd);
  assert.notEqual(b.session, 's-old', 'a fresh session, not Claude\'s');
  assert.deepEqual(readLimit(s.runs).builds, [], 'no longer waiting for Claude\'s reset');
});

test('0648 AC1: the new build is told it carries on another agent\'s build, and to read the Notes and the branch\'s commits first', () => {
  const s = setup();
  s.stop(AT + 3 * 3600e3);
  const prompt = s.starts[0].argv.find(w => w.includes('0001'));
  assert.match(prompt, /^\$speck-build 0001: /);
  assert.match(prompt, /carry on Claude's build of ticket 0001/);
  assert.match(prompt, /read the ticket's Notes and the branch's commits/);
  assert.match(prompt, /on branch speck\/0001-/);
});

test('0648 AC1: a reset not known moves it too, and a Cursor stand-in gets its own chat', () => {
  const s = setup({ ready: ['claude', 'cursor'] });
  s.stop(null);
  assert.equal(s.starts.length, 1);
  assert.equal(s.starts[0].rec.agent, 'cursor');
  assert.equal(s.starts[0].session, 'chat-1');
  assert.match(s.said.at(-1), /^0001: Claude's usage limit is reached with no reset time known, so Cursor, the first agent on builder_bench that's ready and free, carries on its build\.$/);
});

test('0648 AC1: a bench agent that is limited, or not ready, is passed over', () => {
  const s = setup({ held: ['claude', 'codex'] });
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts[0].rec.agent, 'cursor');
});

test('0648 AC1: with every build slot in use, it isn\'t moved until one is free', () => {
  const s = setup({ max: 1 });
  s.running.add('0002');
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts.length, 0);
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  s.running.delete('0002');
  s.q.check(s.tickets());
  assert.equal(s.starts.length, 1);
});

// ---------- AC2 ----------

test('0648 AC2: with the reset an hour away or less, it waits and carries on its own session after the reset', () => {
  assert.equal(worthMoving({ resets: new Date(AT + TAKE_OVER_MS).toISOString() }, AT), false);
  assert.equal(worthMoving({ resets: new Date(AT + TAKE_OVER_MS + MIN).toISOString() }, AT), true);
  assert.equal(worthMoving({ resets: null }, AT), true);
  const s = setup();
  s.stop(AT + 60 * MIN);
  assert.equal(s.starts.length, 0);
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  s.clock.now = AT + 62 * MIN;
  s.q.check(s.tickets());
  assert.equal(s.starts.length, 1);
  assert.equal(s.starts[0].flags, 'a');
  assert.equal(s.starts[0].shown, 's-old', 'its own session, resumed');
  assert.equal(s.ticket().fm.builder, '');
});

test('0648 AC2: with no bench agent free, it waits for the reset and is resumed as 0622 does', () => {
  const s = setup({ ready: ['claude'] });
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts.length, 0);
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  s.clock.now = AT + 3 * 3600e3 + 2 * MIN;
  s.q.check(s.tickets());
  assert.equal(s.starts.length, 1);
  assert.equal(s.starts[0].shown, 's-old');
});

test('0648 AC2: a bench agent that frees up while it waits, with the reset still over an hour away, takes it then', () => {
  const s = setup({ held: ['claude', 'codex', 'cursor'] });
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts.length, 0);
  s.held.delete('cursor');
  s.clock.now = AT + 30 * MIN;
  s.q.check(s.tickets());
  assert.equal(s.starts[0].rec.agent, 'cursor');
});

// ---------- AC3 ----------

test('0648 AC3: the ticket\'s Notes say who took over, why and when, and its builder records the new agent, committed on its branch', () => {
  const s = setup();
  s.stop(AT + 3 * 3600e3);
  const { fm, raw } = s.ticket();
  assert.equal(fm.builder, 'codex');
  assert.match(raw, /^- Builder: Codex took over this build from Claude at 2026-11-11 12:00 UTC, because Claude's usage limit was reached until 2026-11-11 15:00 UTC, more than an hour away\.$/m);
  assert.match(s.gw('log', '-1', '--format=%s'), /^speck\(0001\): codex takes over the build$/);
  assert.equal(s.gw('status', '--porcelain'), '');
  assert.equal(s.r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'nothing changed in the main checkout');
  assert.deepEqual(s.starts[0].rec.took_over, { from: 'claude', at: new Date(AT).toISOString() });
});

test('0648 AC3: a reset not known is said so in the Notes', () => {
  const s = setup();
  s.stop(null);
  assert.match(s.ticket().raw, /from Claude at 2026-11-11 12:00 UTC, because Claude's usage limit was reached with no reset time known\./);
});

test('0648 AC3: when the ticket can\'t be recorded, nothing starts, it keeps waiting and that\'s said once', () => {
  const s = setup();
  s.gw('checkout', '-q', '-b', 'elsewhere');
  s.stop(AT + 3 * 3600e3);
  s.q.check(s.tickets());
  assert.equal(s.starts.length, 0);
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  const says = s.said.filter(l => /can't take it over/.test(l));
  assert.equal(says.length, 1);
  assert.match(says[0], /its branch, speck\/0001-\S+, isn't checked out in any folder/);
  assert.equal(s.r.g('log', '-1', '--format=%s'), 'reviewer and notes', 'nothing committed on the base branch');
});

test('0648 AC3: a checkout on another branch isn\'t recorded in', () => {
  const r = panelRepo();
  r.g('checkout', '-q', '-b', 'elsewhere');
  const text = fs.readFileSync(r.file, 'utf8');
  assert.match(recordTakeOver(r.dir, loadConfig(r.dir), '0001', 'cursor', '- Builder: Cursor took over.').why, /is on elsewhere, not 0001's branch or main/);
  assert.equal(fs.readFileSync(r.file, 'utf8'), text);
});

test('0648 AC3: recordTakeOver on a ticket not yet started commits on the base branch', () => {
  const r = panelRepo();
  fs.appendFileSync(r.file, '\n## Notes\n');
  r.g('commit', '-qam', 'notes');
  const cfg = loadConfig(r.dir);
  const done = recordTakeOver(r.dir, cfg, '0001', 'cursor', '- Builder: Cursor took over.');
  assert.equal(done.branch, 'main');
  assert.equal(parseTicket(fs.readFileSync(r.file, 'utf8')).fm.builder, 'cursor');
  assert.equal(r.g('status', '--porcelain'), '');
});

// ---------- AC4 ----------

test('0648 AC4: an agent of the reviewer\'s family is passed over, so the reviewer differs from the agent that finishes it', () => {
  const s = setup({ reviewer: 'codex' });
  s.stop(AT + 3 * 3600e3);
  assert.equal(s.starts[0].rec.agent, 'cursor');
  const { fm } = s.ticket();
  assert.equal(ticketSameModelProblem(fm, loadConfig(s.r.dir)), null);
  const only = setup({ reviewer: 'codex', ready: ['claude', 'codex'] });
  only.stop(AT + 3 * 3600e3);
  assert.equal(only.starts.length, 0, 'Codex can\'t finish a build Codex reviews, so it waits');
});
