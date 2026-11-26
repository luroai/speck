import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0764: a project's summary gives the factory floor's line: the work at each station, with the agent, model and effort
// it runs on and why, what each station would run on when idle, the queue and the tickets at Ship.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { T, fakePage, items, top, panelRepo, fm, good, freePort, startPanel, stop, gitEnv, ROOT } from './support/panel.mjs';
import { reviewRepo } from './support/speck.mjs';
import { BUILD_ENV } from '../scripts/build-env.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { projectLine } from '../scripts/panel-line.mjs';
import { lineFacts } from '../scripts/line-facts.mjs';
import { levelBuilds, buildsWith } from '../scripts/level-builds.mjs';
import { markRoundRunning, roundStarted } from '../scripts/review-running.mjs';
import { launchPlan, launchTicket } from '../scripts/ticket-builder.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';

const P = [...PROVIDERS];
const at = min => new Date(Date.parse('2026-11-26T10:00:00Z') + min * 60000).toISOString();
// Settings as speck/config.yml has them, with `o` over them.
const CFG = (o = {}) => ({ base_branch: 'main', builder: 'claude', builder_model: 'opus', builder_effort: 'high', build_command: '', reviewer: 'codex', reviewer_model: 'gpt-x', reviewer_effort: 'xhigh',
  watch: 'fix', watch_agent: 'claude', watch_model: 'sonnet', watch_effort: 'low', levels: { quick: { builder_model: 'haiku', builder_effort: 'low' }, balanced: {}, deep: { builder_effort: 'max' } }, ...o });
// A ticket's Builder fact as the board gives it, from where it comes.
const BUILT = (fmo, cfg = CFG(), from = 'default') => ({ ...buildsWith(fmo, cfg, P), from, own: { builder: '', builder_model: '' } });
// The board's tickets, with its level_builds, and the line it gives with `facts`.
const boardOf = (tickets, cfg = CFG()) => ({ tickets, level_builds: levelBuilds(cfg, null, P) });
const lineOf = (tickets, facts, cfg) => projectLine({ board: boardOf(tickets, cfg), facts });
const facts = (o = {}) => ({ cfg: CFG(), providers: P, tickets: {}, check: null, ...o });
const byId = (line, id) => line.work.find(w => w.id === id);

// ---------- AC1: each ticket at its station ----------

test('0764 AC1: each ticket being built, reviewed or checked in the app is listed at its station, with what it runs on, why and since when', () => {
  const tickets = [
    T('0001', 'building', { level: 'deep', started: at(0), build_with: BUILT({ level: 'deep' }, CFG(), 'deep') }),
    T('0002', 'reviewing', { reviewer: 'codex', review_model: 'gpt-x', reviewer_model: '', reviewer_effort: '', review_running: 2, rounds: [{ round: 1 }], started: at(1), build_with: BUILT({}) }),
    T('0003', 'reviewing', { review_running: null, rounds: [{ round: 1 }], started: at(2), build_with: BUILT({ builder: 'codex', builder_effort: 'high' }, CFG(), 'ticket') }),
    T('0004', 'blocked', { app_checking: true, blocked_question: 'Does it show?' }),
    T('0005', 'approved', { build_running: true, approved: at(3), handed_back: at(4), started: at(0), build_with: BUILT({}) }),
    T('0006', 'ready'), T('0007', 'blocked', { blocked_question: 'Which?' }), T('0008', 'approved', { approved: at(3) }), T('0009', 'done'), T('0010', 'draft'),
  ];
  const line = lineOf(tickets, facts({ tickets: { '0002': { round: { started: at(5), stand_in: null } }, '0003': { last_round: at(6) } },
    check: { id: '0004', agent: 'claude', started: at(7) } }));
  assert.deepEqual(line.work.map(w => [w.id, w.station]), [['0001', 'builder'], ['0003', 'builder'], ['0005', 'builder'], ['0002', 'reviewer'], ['0004', 'qa']]);
  const none = { level: null, stands_in_for: null };
  assert.deepEqual(byId(line, '0001'), { id: '0001', title: 'Ticket 0001', station: 'builder', agent: 'claude', agent_name: 'Claude Code', model: 'Opus', model_slug: 'opus', effort: 'max', why: 'level', level: 'deep', stands_in_for: null, since: at(0) });
  assert.deepEqual(byId(line, '0003'), { id: '0003', title: 'Ticket 0003', station: 'builder', agent: 'codex', agent_name: 'Codex', model: 'default model', model_slug: '', effort: 'high', why: 'ticket', ...none, since: at(6) }, 'back from its round: since the round was saved');
  assert.deepEqual(byId(line, '0005'), { id: '0005', title: 'Ticket 0005', station: 'builder', agent: 'claude', agent_name: 'Claude Code', model: 'Opus', model_slug: 'opus', effort: 'high', why: 'settings', ...none, since: at(4) }, 'handed back since its approval');
  assert.deepEqual(byId(line, '0002'), { id: '0002', title: 'Ticket 0002', station: 'reviewer', agent: 'codex', agent_name: 'Codex', model: 'gpt-x', model_slug: 'gpt-x', effort: 'xhigh', why: 'settings', ...none, since: at(5) });
  assert.deepEqual(byId(line, '0004'), { id: '0004', title: 'Ticket 0004', station: 'qa', agent: 'claude', agent_name: 'Claude Code', model: 'Sonnet', model_slug: 'sonnet', effort: 'low', why: 'settings', ...none, since: at(7) });
});

test('0764 AC1: the builder has a ticket since it last got it: started, handed back, resumed by the watch agent or back from a round', () => {
  const t = o => T('0001', 'reviewing', { review_running: null, rounds: [{ round: 1 }], started: at(0), build_with: BUILT({}), ...o });
  assert.equal(byId(lineOf([t()], facts({ tickets: { '0001': { last_round: at(9) } } })), '0001').since, at(9));
  assert.equal(byId(lineOf([t()], facts({ tickets: { '0001': { last_round: at(9), resumed: at(12) } } })), '0001').since, at(12), 'resumed after its round');
  assert.equal(byId(lineOf([t({ status: 'building', rounds: [] })], facts()), '0001').since, at(0));
  assert.equal(byId(lineOf([t({ status: 'building', rounds: [], started: undefined })], facts()), '0001').since, null, 'no time known');
  assert.equal(byId(lineOf([t({ status: 'building', rounds: [] })], null), '0001').since, at(0), 'without facts, from the board');
  const queued = lineOf([T('0002', 'blocked', { app_checking: true })], facts());
  assert.equal(byId(queued, '0002').since, null, 'a check still to run has no time there yet');
});

test('0764 AC1: why it\'s on them: its level, its own fields or the settings', () => {
  const b = (id, fmo, from, o = {}) => T(id, 'building', { build_with: BUILT(fmo, CFG(), from), ...o });
  const r = (id, o) => T(id, 'reviewing', { review_running: 1, reviewer: 'codex', review_model: 'gpt-x', reviewer_model: '', reviewer_effort: '', ...o });
  const line = lineOf([b('0001', {}, 'default'), b('0002', { level: 'quick' }, 'quick'), b('0003', { builder_model: 'fable' }, 'ticket'), b('0004', { level: 'balanced' }, 'balanced'),
    r('0005', {}), r('0006', { reviewer: 'claude', review_model: null }), r('0007', { reviewer_model: 'gpt-y', review_model: 'gpt-y' }), r('0008', { reviewer_effort: 'low' })], facts());
  assert.deepEqual(line.work.map(w => [w.id, w.why, w.level]), [['0001', 'settings', null], ['0002', 'level', 'quick'], ['0003', 'ticket', null], ['0004', 'level', 'balanced'],
    ['0005', 'settings', null], ['0006', 'ticket', null], ['0007', 'ticket', null], ['0008', 'ticket', null]]);
  assert.deepEqual([byId(line, '0002').model, byId(line, '0002').effort], ['Haiku', 'low']);
  assert.deepEqual([byId(line, '0006').agent_name, byId(line, '0006').model, byId(line, '0006').effort], ['Claude Code', 'its own default', 'xhigh'], 'the settings\' effort for its own reviewer');
  assert.deepEqual([byId(line, '0008').model, byId(line, '0008').effort], ['gpt-x', 'low']);
});

test('0764 AC1: a ticket on a stand-in from a bench says so, whom it stands in for, and runs on that agent\'s own defaults', () => {
  const tickets = [
    T('0001', 'building', { builder: 'codex', build_with: BUILT({ builder: 'codex' }, CFG(), 'ticket') }), // as speck records a stand-in on the ticket
    T('0002', 'reviewing', { review_running: 1, reviewer: 'codex', review_model: 'gpt-x' }),
    T('0003', 'blocked', { app_checking: true }),
    T('0004', 'building', { build_with: BUILT({}) }),
  ];
  const line = lineOf(tickets, facts({ tickets: { '0001': { stands_in_for: 'claude' }, '0002': { round: { started: at(1), stand_in: { name: 'claude', for: 'codex' } } }, '0004': { stands_in_for: 'claude' } },
    check: { id: '0003', agent: 'codex', started: at(2) } }));
  const claude = { agent: 'claude', agent_name: 'Claude Code' }, codex = { agent: 'codex', agent_name: 'Codex' };
  assert.deepEqual(['agent', 'model', 'effort', 'why', 'stands_in_for'].map(k => byId(line, '0001')[k]), ['codex', 'default model', 'default effort', 'bench', claude]);
  assert.deepEqual(['agent', 'model', 'effort', 'why', 'stands_in_for', 'since'].map(k => byId(line, '0002')[k]), ['claude', 'its own default', 'default effort', 'bench', codex, at(1)]);
  assert.deepEqual(['agent', 'model', 'effort', 'why', 'stands_in_for', 'since'].map(k => byId(line, '0003')[k]), ['codex', 'default model', 'default effort', 'bench', claude, at(2)]);
  assert.equal(byId(line, '0004').why, 'settings', 'a record naming the agent it builds on now isn\'t a stand-in');
});

test('0764 AC1: the records of the work in hand are read from the project, and odd ones are left out', () => {
  const r = panelRepo({ prefix: 'speck-0764-' }), runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const put = (name, v) => fs.writeFileSync(path.join(runs, name), typeof v === 'string' ? v : JSON.stringify(v));
  put('0002.json', { id: '0002', agent: 'codex', started: at(0), stand_in: { for: 'claude' }, foreman_resumed: at(3) });
  put('0003.json', { id: '0003', agent: 'cursor', took_over: { from: 'claude', at: at(1) } });
  put('0004.json', '{ not json');
  markRoundRunning(r.dir, '0005', 2, process.pid, { stand_in: { name: 'claude', for: 'codex' } });
  put('run.foreman-agent.json', { running: { id: '0006', token: 't', pid: 1, key: 'k', what: 'check', agent: 'codex', started: at(4), check: { question: 'Q', line: 'Look', recommendation: 'Yes' }, qa: true }, queue: [] });
  const rounds = `\n## Review rounds\n\n<details><summary>Round 1 · codex · changes_requested</summary>\n\n\`\`\`json\n${JSON.stringify({ meta: { round: 1, reviewer: 'codex', saved_at: at(8) }, verdict: { verdict: 'changes_requested', criteria: [], findings: [], summary: 's', escalation_question: '' } }, null, 2)}\n\`\`\`\n\n</details>\n`;
  r.write('0007-back.md', fm({ id: '"0007"', status: 'reviewing' }), good + rounds);
  const board = { tickets: [T('0002', 'building'), T('0003', 'building'), T('0004', 'building'), T('0005', 'reviewing', { review_running: 2 }), T('0006', 'blocked', { app_checking: true }),
    T('0007', 'reviewing', { review_running: null, rounds: [{ round: 1 }], path: 'speck/tickets/0007-back.md' }), T('__proto__', 'building'), T('0009', 'done')] };
  const f = lineFacts(r.dir, board);
  assert.equal(f.cfg.base_branch, 'main');
  assert.ok(f.providers.some(p => p.name === 'deepseek'));
  assert.deepEqual(f.tickets['0002'], { stands_in_for: 'claude', resumed: at(3), last_round: null });
  assert.equal(f.tickets['0003'].stands_in_for, 'claude', 'a take-over stands in for the agent it took over from');
  assert.deepEqual(f.tickets['0004'], { stands_in_for: null, resumed: null, last_round: null });
  assert.equal(f.tickets['0005'].round.stand_in.name, 'claude');
  assert.equal(f.tickets['0007'].last_round, at(8));
  assert.ok(Object.hasOwn(f.tickets, '__proto__') && Object.getPrototypeOf(f.tickets) === Object.prototype, 'a ticket called __proto__ is one like any other');
  for (const id of ['0006', '0009']) assert.equal(Object.hasOwn(f.tickets, id), false, `${id} is at no builder or reviewer, so none of its records are read`);
  assert.deepEqual(f.check, { id: '0006', agent: 'codex', started: at(4) });
  // Not a check in the app, or nothing running: no check.
  put('run.foreman-agent.json', { running: { id: '0006', token: 't', pid: 1, agent: 'codex', started: at(4), what: 'a stop' }, queue: [] });
  assert.equal(lineFacts(r.dir, board).check, null);
  put('run.foreman-agent.json', 'nope');
  assert.equal(lineFacts(r.dir, { tickets: 'x' }).check, null);
  // Settings that can't be read: no facts, and the summary still has its line from the board.
  fs.writeFileSync(path.join(r.dir, 'speck', 'config.yml'), fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8') + '\nreviewer_bench: nobody\n');
  assert.equal(lineFacts(r.dir, board), null, 'a bench speck refuses');
  fs.rmSync(path.join(r.dir, 'speck', 'config.yml'));
  assert.equal(lineFacts(r.dir, board), null, 'no settings file');
  const s = projectSummary({ board: { tickets: [T('0001', 'building', { build_with: BUILT({}) })] }, foreman: {}, run: { on: true }, facts: null });
  assert.deepEqual([s.line.work[0].agent_name, s.line.idle.reviewer.agent], ['Claude Code', null]);
});

test('0764 AC1: a review round\'s record keeps the agent standing in for its reviewer while it runs', () => {
  const r = panelRepo({ prefix: 'speck-0764-' }), runs = path.join(r.dir, 'speck', '.cache', 'runs');
  const end = markRoundRunning(r.dir, '0001', 3, process.pid, { stand_in: { name: 'claude', for: 'codex' } });
  const got = roundStarted(runs, '0001');
  assert.deepEqual(got.stand_in, { name: 'claude', for: 'codex' });
  assert.ok(Date.parse(got.started) <= Date.now());
  end();
  assert.equal(roundStarted(runs, '0001'), null, 'gone once the round ends');
  markRoundRunning(r.dir, '0001', 1, process.pid, { id: 'x', round: 9, pid: 1 });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(runs, '0001.review.json'), 'utf8')).round, 1, 'a mark can\'t change the round it records');
  markRoundRunning(r.dir, '0002', 1);
  assert.deepEqual(roundStarted(runs, '0002').stand_in, null);
  for (const bad of [{ name: 'claude' }, { name: '', for: 'codex' }, 'claude', ['claude']]) {
    fs.writeFileSync(path.join(runs, '0003.review.json'), JSON.stringify({ round: 1, started: 'soon', stand_in: bad }));
    assert.deepEqual(roundStarted(runs, '0003'), { started: null, stand_in: null }, JSON.stringify(bad));
  }
  assert.equal(roundStarted(runs, '../x'), null);
});

test('0764 AC1: speck review on a stand-in keeps the stand-in in its round\'s record while the round runs', () => {
  const r = reviewRepo({ ticketFields: 'status: building\nbuilder: cursor\nreviewer_model: gpt-own', config: '\nreviewer_bench: claude\n' });
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0764-bin-')), seen = path.join(bin, 'seen.json');
  const verdict = { verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' };
  // A `claude` that's signed in, keeps the round's record as it finds it while it reviews, and gives a verdict; a `codex` that's signed in.
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}\nconst fs = require('fs'), args = process.argv.slice(2);
if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
fs.readFileSync(0, 'utf8');
fs.writeFileSync(${JSON.stringify(seen)}, fs.readFileSync(${JSON.stringify(path.join(r.dir, 'speck', '.cache', 'runs', '0001.review.json'))}, 'utf8'));
console.log(JSON.stringify({ result: JSON.stringify(${JSON.stringify(verdict)}), session_id: 'C1' }));\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}\nprocess.exit(process.argv[2] === 'login' ? 0 : 1);\n`, { mode: 0o755 });
  const limits = path.join(r.dir, 'speck', '.cache', 'runs', 'reviewer-limits');
  fs.mkdirSync(limits, { recursive: true });
  const later = Date.now() + 2 * 3600000;
  fs.writeFileSync(path.join(limits, '0002.json'), JSON.stringify({ reviewer: 'codex', resets: new Date(later - 60000).toISOString(), carry_on: new Date(later).toISOString(), session: 'other' }));
  const res = r.runEnv({ PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter), [BUILD_ENV]: 'session-1' }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  const rec = JSON.parse(fs.readFileSync(seen, 'utf8'));
  assert.deepEqual([rec.round, rec.stand_in], [1, { name: 'claude', for: 'codex' }]);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.review.json')), false, 'and it\'s gone once the round is recorded');
});

test('0764 AC1: a build speck run starts on a stand-in keeps, in its run record, the builder it stands in for', () => {
  const cfg = { base_branch: 'main', builder: 'claude', reviewer: 'claude-subagent', build_command: '' }, yes = () => true;
  const plan = standIn => launchPlan(cfg, launchTicket({ id: '0001', builder: 'codex' }, standIn, () => ({}), cfg), { command: '', words: [], repo: null, failed: new Map(), installed: yes, standIn });
  assert.deepEqual(plan(true).record, { stand_in: { for: 'claude' } });
  assert.deepEqual(plan(false).record, {});
  // speck run gives launchPlan whether it starts the build on a stand-in.
  const run = fs.readFileSync(path.join(ROOT, 'scripts', 'run.mjs'), 'utf8');
  assert.match(run, /const launch = \(t, standIn = false\) => \{[^\n]*\n\s*const plan = launchPlan\([^\n]*\bstandIn \}\)/);
});

// A real panel's own part of the bridge, as speck serve's front asks for it, with another speck's header.
function own(port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/projects/own', headers: { 'X-Speck-Via': '1' } }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

test('0764 AC1, AC2: a real panel\'s summary gives its line, from its board and its records', async () => {
  const r = panelRepo({ prefix: 'speck-0764-' }), runs = path.join(r.dir, 'speck', '.cache', 'runs');
  r.write('0002-built.md', fm({ id: '"0002"', title: 'Built on a stand-in', status: 'building', builder: 'codex', started: `"${at(0)}"` }));
  r.g('add', '-A');
  r.g('commit', '-qm', 'building');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0002.json'), JSON.stringify({ id: '0002', agent: 'codex', started: at(0), stand_in: { for: 'claude' } }));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const res = await own(p.port);
    assert.equal(res.status, 200, res.body);
    const { line } = JSON.parse(res.body);
    assert.deepEqual(line.work.map(w => [w.id, w.station, w.agent, w.why, w.stands_in_for?.agent, w.since]), [['0002', 'builder', 'codex', 'bench', 'claude', at(0)]]);
    assert.deepEqual(line.queue, { ready: 1, next: ['0001'] });
    assert.deepEqual([line.idle.builder.agent, line.idle.reviewer.agent, line.idle.qa.set_up], ['claude', 'codex', false], 'the settings, read for the line');
    assert.deepEqual(line.ship, []);
  } finally { await stop(p); }
});

// ---------- AC2: what each station would run on ----------

test('0764 AC2: each station gives the agent, model and effort a new ticket with no level would get, and whether QA is set up', () => {
  const idle = cfg => lineOf([], facts({ cfg }), cfg).idle;
  const words = s => [s.agent, s.agent_name, s.model, s.effort];
  let i = idle(CFG());
  assert.deepEqual(words(i.builder), ['claude', 'Claude Code', 'Opus', 'high'], 'the settings\', not a level\'s');
  assert.deepEqual(words(i.reviewer), ['codex', 'Codex', 'gpt-x', 'xhigh']);
  assert.deepEqual([...words(i.qa), i.qa.set_up], ['claude', 'Claude Code', 'Sonnet', 'low', true], 'QA\'s settings blank: on the watch agent\'s');
  i = idle(CFG({ qa_agent: 'codex', qa_model: 'gpt-q', qa_effort: 'medium' }));
  assert.deepEqual(words(i.qa), ['codex', 'Codex', 'gpt-q', 'medium'], 'QA\'s own');
  i = idle(CFG({ qa_effort: 'max' }));
  assert.deepEqual(words(i.qa), ['claude', 'Claude Code', 'its own default', 'max'], 'with any of QA\'s set, its blank model is its agent\'s default');
  for (const watch of ['tell', 'off']) assert.equal(idle(CFG({ watch })).qa.set_up, false, `watch ${watch}: nothing is checked in the app`);
  assert.equal(idle(CFG({ watch: 'decide' })).qa.set_up, true);
  i = idle(CFG({ builder: 'cursor', builder_model: '', reviewer: 'deepseek', reviewer_model: '', watch_agent: 'cursor', watch_model: '' }));
  assert.deepEqual(words(i.builder), ['cursor', 'Cursor', 'default model', null], 'Cursor isn\'t given an effort');
  assert.deepEqual(words(i.reviewer), ['deepseek', 'DeepSeek', 'V4 Pro', null], 'a provider\'s default model, by name');
  assert.deepEqual(words(i.qa), ['cursor', 'Cursor', 'default model', null]);
  i = idle(CFG({ reviewer: 'claude-subagent', reviewer_model: '', reviewer_effort: '' }));
  assert.deepEqual(words(i.reviewer), ['claude-subagent', 'Claude Code subagent', 'its own default', 'default effort']);
  i = lineOf([], null).idle;
  assert.deepEqual([words(i.builder), words(i.reviewer), i.qa.set_up], [['claude', 'Claude Code', 'Opus', 'high'], [null, null, null, null], null], 'without the settings, only the board\'s');
});

// ---------- AC3: the queue and Ship ----------

test('0764 AC3: the queue gives how many tickets are ready and the next three by priority', () => {
  const ready = [T('0001', 'ready', { priority: 3 }), T('0002', 'ready', { priority: 1 }), T('0003', 'ready', { priority: 2 }), T('0004', 'ready', { priority: 0, type: 'fix' }),
    T('0005', 'ready', { priority: 1 }), T('0006', 'draft', { priority: 1 }), T('0007', 'building', { priority: 1 })];
  assert.deepEqual(lineOf(ready, facts()).queue, { ready: 5, next: ['0004', '0002', '0005'] });
  assert.deepEqual(lineOf([T('0001', 'ready')], null).queue, { ready: 1, next: ['0001'] });
  assert.deepEqual(lineOf([], null).queue, { ready: 0, next: [] });
});

test('0764 AC3: the tickets at Ship say which wait for you, as Needs you counts them', () => {
  const tickets = [
    T('0001', 'approved', { auto_ship: false, approved: at(0) }),
    T('0002', 'approved', { auto_ship: true, approved: at(0) }),
    T('0003', 'approved', { auto_ship: true, risk: 'high', approved: at(0), ships_after: '0002' }),
    T('0004', 'done', { ship: { running: true } }),
    T('0005', 'approved', { auto_ship: true, approved: at(0), handed_back: at(1), build_running: true, build_with: BUILT({}) }),
    T('0006', 'approved', { auto_ship: true, approved: at(2), handed_back: at(1), build_running: true }),
    T('0007', 'ready'),
  ];
  for (const on of [true, false]) {
    const s = projectSummary({ board: { tickets }, foreman: { fixing: 'tell', blocked: [], agent: { asks: [] } }, run: { on }, facts: null });
    const ship = s.line.ship.map(x => [x.id, x.yours, x.shipping]);
    assert.deepEqual(ship, [['0001', true, false], ['0002', !on, false], ['0003', false, false], ['0004', false, true], ['0006', !on, false]], `speck run ${on ? 'on' : 'off'}`);
    const needs = s.needs.filter(n => ['ship', 'high_risk'].includes(n.why)).map(n => n.id);
    for (const x of s.line.ship) assert.equal(x.yours, needs.includes(x.id), `${x.id}, as Needs you counts it`);
    assert.deepEqual(s.line.work.map(w => [w.id, w.station]), [['0005', 'builder']], 'one handed back to its build is with the builder, not at Ship');
    assert.equal(s.line.ship[0].title, 'Ticket 0001');
  }
});

// ---------- AC4: a blank model, in Settings' and the Builder fact's words ----------

const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
// Each ticket's Builder fact as the panel's page shows it, for a board of drafts.
async function builderFacts(tickets) {
  const board = { run: { on: true }, ideas: [], levels: [], level_builds: [], tickets };
  const fetch = async u => ({ ok: true, status: 200, json: async () => structuredClone(String(u).startsWith('/api/agent-models') ? { agent: '', why: 'no' } : /\/log$/.test(String(u)) ? { text: '', truncated: false } : board) });
  const p = fakePage([], { fetch });
  await p.settle();
  const out = {};
  for (const t of tickets) {
    const card = () => items(p).find(n => idOf(p, n) === t.id);
    p.press(top(card()));
    await p.settle();
    out[t.id] = p.all(card()).find(n => has(n, 'set-builder')).textContent;
  }
  return out;
}

test('0764 AC4: a model left blank in the settings is named as its agent\'s default, in the words of a ticket\'s Builder fact and Settings', async () => {
  const agents = ['claude', 'codex', 'cursor', 'deepseek'];
  const cfgOf = agent => CFG({ builder: agent, builder_model: '', reviewer: agent === 'claude' ? 'codex' : 'claude', reviewer_model: '', watch_agent: agent, watch_model: '', qa_agent: agent, qa_model: '' });
  const drafts = agents.map((agent, i) => T(`070${i}`, 'draft', { build_with: BUILT({}, cfgOf(agent)) }));
  const shown = await builderFacts(drafts);
  const said = { claude: 'its own default', codex: 'default model', cursor: 'default model', deepseek: 'V4 Pro' };
  agents.forEach((agent, i) => {
    const idle = lineOf([], facts({ cfg: cfgOf(agent) }), cfgOf(agent)).idle, b = idle.builder;
    assert.equal([b.agent_name, b.model, b.effort].filter(Boolean).join(' · '), shown[`070${i}`], `${agent}: the line's builder says what its Builder fact says`);
    assert.equal(b.model, said[agent], agent);
    assert.equal(idle.qa.model, said[agent], `${agent}: QA's blank model in the same words`);
    const reviewer = lineOf([], facts({ cfg: CFG({ reviewer: agent, reviewer_model: '' }) })).idle.reviewer;
    assert.equal(reviewer.model, said[agent], `${agent}: the reviewer's blank model in the same words`);
  });
  // Settings gives Claude Code's blank model the same words, after its name (0700).
  const settings = fs.readFileSync(path.join(ROOT, 'templates', 'panel-settings.js'), 'utf8'), own = /const CLAUDE_OWN = '([^']*)';/.exec(settings);
  assert.ok(own, 'Settings\' words for Claude Code\'s own default');
  assert.equal(own[1], ` · ${said.claude}`);
});

// ---------- odd boards ----------

test('0764: a board that\'s missing or odd gives an empty line rather than an error', () => {
  for (const board of [undefined, null, {}, { tickets: 'x' }, { tickets: [null, 7, { id: '0001' }, { status: 'building' }, { id: 'constructor', status: 'reviewing', review_running: 1 }] }]) {
    const s = projectSummary({ board, foreman: undefined, run: undefined, facts: undefined });
    assert.deepEqual(s.line.queue, { ready: 0, next: [] });
    assert.deepEqual(s.line.ship, []);
    for (const w of s.line.work) assert.ok(['builder', 'reviewer'].includes(w.station), JSON.stringify(w));
  }
  const s = projectSummary({ board: { tickets: [T('0001', 'building')] }, foreman: {}, run: {}, facts: { cfg: 'x', providers: 'y', tickets: { '0001': 'z' }, check: 7 } });
  assert.equal(s.line.work[0].station, 'builder');
  // Should working out the line fail, the rest of the summary still reaches the bridge, without the line.
  const broken = { tickets: [T('0001', 'ready')], get level_builds() { throw new Error('unreadable'); } };
  const t = projectSummary({ board: broken, foreman: {}, run: { on: true }, facts: null });
  assert.deepEqual([t.line, t.queued], [null, 1]);
});
