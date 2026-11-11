// 0637: while the watch agent's own agent is held by a usage limit, each look runs on the next of your agents that's ready.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, gitEnv } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { foremanAgentQueue, foremanAction, readAgentState } from '../scripts/foreman-agent.mjs';
import { usageLimitQueue } from '../scripts/usage-limit.mjs';
import { limitQueues } from '../scripts/reviewer-limit.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { readyAgentsEvery, yourAgentsFile } from '../scripts/your-agents.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
const START = Date.parse('2026-11-10T11:57:00Z'), DUE = Date.parse('2026-11-10T12:30:00Z'), MIN = 60000;
const REFUSED = [
  { type: 'system', subtype: 'init' },
  { type: 'rate_limit_event', rate_limit_info: { status: 'rejected', resetsAt: DUE / 1000, rateLimitType: 'five_hour' } },
  { type: 'result', is_error: true, result: 'You\'ve hit your session limit · resets 12:30pm (UTC)' },
].map(e => JSON.stringify(e)).join('\n');
const PROVIDER = { name: 'deepseek', label: 'DeepSeek', address: 'https://api.deepseek.example', defaultModel: 'deepseek-chat', models: ['deepseek-chat'] };
const MOVED = /Claude's usage limit is reached, so I'll look into stops on Codex until it resets/;
const BACK = /Claude's usage limit has reset, so I'm looking into stops on Claude again/;

// A repo whose ticket 0001 stopped, with watch: fix on Claude with its own model and effort, and speck run's usage limit
// queue over the same runs folder, on a clock the test moves. `ready` is your agents that are ready, in speck agents'
// order, and `held` the other agents held by a limit speck recorded.
function watching({ ready = ['claude', 'codex', 'cursor'], held = new Set(), providers = [] } = {}) {
  const r = blockedRepo({ status: 'building' });
  const config = path.join(r.dir, 'speck', 'config.yml'); // uncommitted, so it moves no branch
  fs.writeFileSync(config, `${fs.readFileSync(config, 'utf8').replace(/^watch:.*$/m, '').trimEnd()}\nwatch: fix\nwatch_agent: claude\nwatch_model: opus\nwatch_effort: high\n`);
  const a = { r, starts: [], said: [], builds: [], live: new Set(), running: new Set(), clock: START, status: 'building', readyCalls: 0, held };
  a.limits = usageLimitQueue({ repo: r.dir, runs: () => r.runs, settings: () => ({ cfg: CFG, words: WORDS, max: 1 }), running: a.running, say: m => a.said.push(m), now: () => a.clock,
    statusOf: () => a.status, resumeHint: () => 'Resume it by hand', startBuild: () => {} });
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: WORDS, cfg: CFG, max: 1, running: a.running, ships: { again: () => {} }, now: () => a.clock,
    say: m => a.said.push(m), key: () => `key ${a.starts.length}`, statusOf: () => a.status, providers, cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], inUse: () => false,
    heldAgent: x => a.limits.holds(x) || a.held.has(x), agentLimited: (x, log) => a.limits.agentEnded(x, log), readyAgents: () => { a.readyCalls += 1; return ready; },
    heldBuild: id => a.limits.holdsBuild(id), startBuild: (id, argv) => { a.builds.push({ id, argv }); a.running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid, log }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = () => a.q.check([T('0001', a.status)]);
  a.stop = what => a.q.stuck({ id: '0001', what, log: '' });
  a.end = (log = '') => { const last = a.starts.at(-1); fs.writeFileSync(last.log, log); a.live.delete(last.pid); };
  a.limit = () => { // a look on Claude that the usage limit stopped
    a.stop('its build ended');
    a.check();
    a.end(REFUSED);
    a.check();
  };
  a.lines = re => a.said.filter(m => re.test(m));
  return { r, a };
}

// ---------- AC1 ----------

test('0637 AC1: with Claude held by its usage limit, the look runs on the next of your ready agents, without watch_model or watch_effort', () => {
  const { a } = watching();
  a.limit();
  assert.equal(a.starts.length, 2, 'it looked again straight away, on another agent');
  const argv = a.starts[1].argv;
  assert.equal(argv[0], 'codex', 'Codex, the first ready agent after Claude in speck agents\' order');
  assert.ok(!argv.includes('opus') && !argv.some(w => /high/.test(w)), `no watch_model or watch_effort: ${argv.join(' ')}`);
  assert.equal(readAgentState(a.r.runs).running.agent, 'codex', 'its record names the agent it runs on');
});

test('0637 AC1: an agent that isn\'t ready, isn\'t yours or is held by its own limit is passed over, in speck agents\' order', () => {
  const { a } = watching({ ready: ['claude', 'cursor', 'codex'], held: new Set(['cursor']) });
  a.limit();
  assert.equal(a.starts[1].argv[0], 'codex', 'Cursor is held, so Codex');
  const { a: b } = watching({ ready: ['claude', 'cursor'] });
  b.limit();
  assert.ok(b.starts[1].argv.includes('--print') || /agent|cursor/.test(b.starts[1].argv[0]), `Codex isn't ready, so Cursor: ${b.starts[1].argv.join(' ')}`);
  assert.notEqual(b.starts[1].argv[0], 'claude');
});

test('0637 AC1: a model provider of yours stands in on its own default model', () => {
  const { a } = watching({ ready: ['claude', 'deepseek'], providers: [PROVIDER] });
  a.limit();
  const argv = a.starts[1].argv;
  assert.ok(argv.includes('deepseek'), argv.join(' '));
  assert.equal(argv[argv.indexOf('--model') + 1], 'deepseek-chat', 'the provider\'s default, not watch_model');
  assert.ok(!argv.includes('--effort'));
});

test('0637 AC1: a reviewer\'s recorded limit holds its agent for the watch agent too', () => {
  const r = blockedRepo({ status: 'building' });
  const now = START;
  fs.mkdirSync(path.join(r.runs, 'reviewer-limits'), { recursive: true });
  saveRecord(path.join(r.runs, 'reviewer-limits', '0002.json'), { reviewer: 'codex', resets: null, carry_on: new Date(now + 30 * MIN).toISOString(), session: 's' });
  const q = limitQueues({ repo: r.dir, runs: () => r.runs, settings: () => null, running: new Set(), startBuild: () => {}, resumeHint: () => '', now: () => now, say: () => {} });
  assert.equal(q.holdsAgent('codex'), true);
  assert.equal(q.holdsAgent('cursor'), false);
  assert.equal(q.holdsAgent('claude'), false);
  const later = limitQueues({ repo: r.dir, runs: () => r.runs, settings: () => null, running: new Set(), startBuild: () => {}, resumeHint: () => '', now: () => now + 31 * MIN, say: () => {} });
  assert.equal(later.holdsAgent('codex'), false, 'not once it has reset');
});

test('0637 AC1: the agents it may stand in on are yours that are installed and signed in, or have their key, in speck agents\' order', () => {
  const r = blockedRepo({ status: 'building' });
  const agent = (id, installed, signed_in) => ({ id, name: id, command: id, installed, signed_in, models: [] });
  let asked = 0, clock = START;
  const find = () => { asked += 1; return { agents: [agent('claude', true, true), agent('codex', true, false), agent('cursor', true, true)] }; };
  const ready = readyAgentsEvery(r.dir, MIN, { find, providers: [PROVIDER], now: () => clock });
  assert.deepEqual(ready(), ['claude', 'cursor'], 'Codex isn\'t signed in and DeepSeek has no key');
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ['claude', 'codex'] }));
  assert.deepEqual(ready(), ['claude', 'cursor'], 'read again only after a minute');
  assert.equal(asked, 1);
  clock += MIN + 1;
  assert.deepEqual(ready(), ['claude'], 'Cursor isn\'t on this machine\'s list of your agents');
  assert.equal(asked, 2);
});

// ---------- AC2 ----------

test('0637 AC2: the log says once per limit which agent it moved to and why, and once more when it moves back', () => {
  const { a } = watching();
  a.limit();
  assert.equal(a.lines(MOVED).length, 1, a.said.join('\n'));
  assert.match(a.said.at(-1), /looking into it on codex/);
  a.end(); a.check(); // the look on Codex ends
  a.stop('its build ended again'); a.check(); a.end(); a.check(); // another look, still within the limit
  assert.equal(a.starts.length, 3);
  assert.equal(a.lines(MOVED).length, 1, 'said once for the same limit');
  assert.equal(a.lines(BACK).length, 0);
  a.clock = DUE + 2 * MIN;
  a.check();
  assert.equal(a.lines(BACK).length, 1, 'said when the limit resets, before any look');
  a.check();
  assert.equal(a.lines(BACK).length, 1, 'and only once');
});

test('0637 AC2: a speck run started meanwhile still says when it moves back, as its record keeps the move', () => {
  const { a } = watching();
  a.limit();
  a.end(); a.check();
  a.clock = DUE + 2 * MIN;
  const said = [];
  const q = foremanAgentQueue({ repo: a.r.dir, runs: () => a.r.runs, readConfig: () => loadConfig(a.r.dir), words: WORDS, cfg: CFG, max: 1,
    running: new Set(), ships: { again: () => {} }, now: () => a.clock, say: m => said.push(m), providers: [], heldAgent: () => false, readyAgents: () => [], withToken: () => [], alive: () => false });
  q.check([T('0001', 'building')]);
  assert.equal(said.filter(m => BACK.test(m)).length, 1, said.join('\n'));
  assert.equal(readAgentState(a.r.runs).moved, null, 'and the record no longer keeps the move');
});

test('0637 AC2: a move is forgotten without a word once the watch agent is set to another agent, or watch is turned off', () => {
  for (const change of [t => t.replace(/^watch_agent: claude$/m, 'watch_agent: codex'), t => t.replace(/^watch: fix$/m, 'watch: tell')]) {
    const { r, a } = watching();
    a.limit();
    a.end(); a.check();
    const config = path.join(r.dir, 'speck', 'config.yml');
    fs.writeFileSync(config, change(fs.readFileSync(config, 'utf8')));
    a.check();
    assert.equal(readAgentState(r.runs).moved, null);
    a.clock = DUE + 2 * MIN;
    a.check();
    assert.equal(a.lines(BACK).length, 0, a.said.join('\n'));
  }
});

test('0637 AC2: a move that can\'t be read is none, and one from an agent that isn\'t its own, even a built-in name, is forgotten without a word', () => {
  const { r, a } = watching();
  saveRecord(path.join(r.runs, 'run.foreman-agent.json'), { moved: { from: 'claude', to: 'constructor' } });
  assert.deepEqual(readAgentState(r.runs).moved, { from: 'claude', to: 'constructor' });
  saveRecord(path.join(r.runs, 'run.foreman-agent.json'), { moved: { from: 1, to: 'codex' } });
  assert.equal(readAgentState(r.runs).moved, null, 'one that can\'t be read is none');
  saveRecord(path.join(r.runs, 'run.foreman-agent.json'), { moved: { from: 'constructor', to: 'codex' } });
  a.check();
  assert.equal(readAgentState(r.runs).moved, null, 'not the watch agent\'s own agent, so forgotten');
  assert.ok(!a.said.some(m => /function/.test(m)), a.said.join('\n'));
});

// ---------- AC3 ----------

test('0637 AC3: once the limit has reset, each look runs on its own agent with its model and effort', () => {
  const { a } = watching();
  a.limit();
  a.end(); a.check();
  a.clock = DUE + 2 * MIN;
  a.stop('its build ended again'); a.check();
  const argv = a.starts.at(-1).argv;
  assert.equal(argv[0], 'claude');
  assert.equal(argv[argv.indexOf('--model') + 1], 'opus');
  assert.equal(argv[argv.indexOf('--effort') + 1], 'high');
});

test('0637 AC3: while its own agent isn\'t held, it never reads which agents are ready', () => {
  const { a } = watching();
  a.stop('its build ended'); a.check();
  assert.equal(a.starts[0].argv[0], 'claude');
  assert.equal(a.readyCalls, 0);
});

// ---------- AC4 ----------

test('0637 AC4: with every other agent held or none ready, it waits for the reset as before', () => {
  for (const opts of [{ ready: ['claude'] }, { ready: ['claude', 'codex', 'cursor'], held: new Set(['codex', 'cursor']) }, { ready: [] }]) {
    const { a } = watching(opts);
    a.limit();
    assert.equal(a.starts.length, 1, 'nothing else started');
    assert.equal(a.lines(MOVED).length, 0);
    assert.equal(readAgentState(a.r.runs).queue.length, 1, 'the look still waits');
    a.clock = DUE + 2 * MIN;
    a.check();
    assert.equal(a.starts.length, 2, 'looked into once the limit has reset');
    assert.equal(a.starts[1].argv[0], 'claude');
    assert.equal(a.lines(BACK).length, 0, 'it never moved, so it doesn\'t say it moved back');
  }
});

// ---------- AC5 ----------

test('0637 AC5: builds stay on their own agent while the watch agent stands in on another', () => {
  const { r, a } = watching();
  a.limit();
  assert.equal(a.starts[1].argv[0], 'codex');
  // the look on Codex asks for the build to be resumed: it waits for Claude's limit, then carries on as Claude Code
  foremanAction(r.dir, ['resume', '0001', 'Carry on', '--why=the limit'], { token: a.starts[1].token, now: new Date(a.clock) });
  a.end(); a.check();
  assert.equal(a.builds.length, 0, 'the build on Claude still waits for the limit');
  assert.equal(readAgentState(r.runs).resumes[0]?.id, '0001');
  a.clock = DUE + 2 * MIN;
  a.check();
  assert.equal(a.builds.length, 1, 'resumed once the limit has reset');
  assert.equal(a.builds[0].argv[0], 'claude', 'on the build\'s own agent');
  assert.equal(loadConfig(r.dir).watch_agent, 'claude', 'no setting changed');
});
