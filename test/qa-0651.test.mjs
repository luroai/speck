// 0651: QA is a team member of its own: checks in the running app run on QA's agent, model and effort, and say QA did them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gitEnv, model } from './support/panel.mjs';
import { CHECK, ASKED, NOW, settings, blocked } from './support/app-check.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { SpeckError, loadConfig } from '../scripts/core.mjs';
import { statusData } from '../scripts/speck.mjs';
import { MACHINE_SETTINGS } from '../scripts/machine.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { benchOwnAgent, benchProblems } from '../scripts/bench.mjs';
import { QA_SETTINGS, qaOn, qaConfig, qaRows } from '../scripts/app-check.mjs';
import { foremanAgentQueue, foremanAction } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

const SAW = 'The Save button shows at the bottom in the dark look';
const PROVIDER = { name: 'deepseek', label: 'DeepSeek', address: 'https://api.deepseek.example', defaultModel: 'deepseek-chat', models: ['deepseek-chat'] };

// A repo whose ticket 0001 is blocked on a question to check in the app, with watch on Claude on its own model and
// effort, `qa` QA's settings, written in speck/config.yml, and speck run's agent queue for it. `held` are the agents held
// by a usage limit and `ready` your ready agents in speck agents' order.
function qaChecking({ qa = '', watch = 'decide', held = [], ready = ['claude', 'codex', 'cursor'] } = {}) {
  const r = blockedRepo({ question: ASKED });
  settings(r, { watch });
  const file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').trimEnd()}\nwatch_agent: claude\nwatch_model: opus\nwatch_effort: low\n${qa}`);
  const a = { starts: [], said: [], stopped: [], live: new Set(), running: new Set() };
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: a.running, ships: { again: () => {} },
    say: m => a.said.push(m), statusOf: () => 'blocked', providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], inUse: () => false, startBuild: () => {},
    heldAgent: x => held.includes(x), readyAgents: () => ready, stopCheckApp: id => { a.stopped.push(id); return Promise.resolve(true); },
    start: (argv, cwd, log, env) => { const pid = 92000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = (t = blocked()) => a.q.check([t]);
  a.end = () => { for (const s of a.starts) a.live.delete(s.pid); };
  a.act = (...args) => foremanAction(r.dir, args, { token: a.starts.at(-1).token, now: NOW });
  a.note = () => r.ticket().split('\n').find(l => /^- (?:Went with|speck \()/.test(l));
  return { r, a };
}
const QA = 'qa_agent: codex\nqa_model: gpt-qa\nqa_effort: high\n';

// ---------- AC1 ----------

test('0651 AC1: qa_agent, qa_model, qa_effort and qa_bench are settings of your own, checked as the watch settings are', () => {
  assert.deepEqual([...QA_SETTINGS], ['qa_agent', 'qa_model', 'qa_effort', 'qa_bench']);
  for (const key of QA_SETTINGS) assert.ok(MACHINE_SETTINGS.includes(key), `${key} is one of your own settings`);
  assert.equal(checkConfigValue('qa_agent', 'codex'), 'codex');
  assert.equal(checkConfigValue('qa_agent', 'deepseek', [PROVIDER]), 'deepseek', 'a model provider');
  assert.equal(checkConfigValue('qa_agent', ''), '');
  for (const bad of ['gemini', '__proto__']) assert.throws(() => checkConfigValue('qa_agent', bad), e => e instanceof SpeckError && /qa_agent must be blank or one of/.test(e.message));
  assert.equal(checkConfigValue('qa_model', 'gpt-qa'), 'gpt-qa');
  assert.equal(checkConfigValue('qa_effort', 'high'), 'high');
  assert.throws(() => checkConfigValue('qa_effort', 'huge'), /qa_effort must be blank or one of/);
  assert.deepEqual(checkConfigValue('qa_bench', 'cursor, codex'), ['cursor', 'codex']);
  assert.throws(() => checkConfigValue('qa_bench', 'gemini'), /qa_bench names "gemini", an agent speck doesn't know/);
});

test('0651 AC1: qa_bench can\'t name QA\'s own agent, worked out with qa_agent blank as the watch agent\'s', () => {
  assert.equal(benchOwnAgent({ builder: 'claude', qa_agent: 'codex' }, 'qa_bench'), 'codex');
  assert.equal(benchOwnAgent({ builder: 'claude', watch_agent: 'cursor' }, 'qa_bench'), 'cursor', 'qa_agent blank: the watch agent\'s agent');
  assert.equal(benchOwnAgent({ builder: 'codex' }, 'qa_bench'), 'codex', 'as the watch agent\'s is worked out');
  const [problem] = benchProblems({ builder: 'claude', qa_agent: 'codex', qa_bench: ['cursor', 'codex'] });
  assert.match(problem, /qa_bench names codex, which is QA's own agent/);
  assert.deepEqual(benchProblems({ builder: 'claude', qa_agent: 'codex', qa_bench: ['claude'] }), [], 'the watch agent\'s own may stand in for QA');
});

test('0651 AC1: speck refuses a qa_bench naming QA\'s own agent whenever it reads its settings', () => {
  const r = blockedRepo();
  const file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').trimEnd()}\nqa_agent: cursor\nqa_bench: [cursor]\n`);
  assert.throws(() => loadConfig(r.dir), e => e instanceof SpeckError && /qa_bench names cursor/.test(e.message) && /speck config set qa_bench/.test(e.message));
});

test('0651 AC1: qa_agent blank is the watch agent\'s agent, and qa_model and qa_effort blank that agent\'s defaults', () => {
  const watch = { builder: 'claude', watch_agent: 'cursor', watch_model: 'opus', watch_effort: 'low' };
  assert.deepEqual(qaConfig({ ...watch, qa_agent: 'codex' }), { ...watch, qa_agent: 'codex', watch_agent: 'codex', watch_model: '', watch_effort: '' });
  const onWatch = qaConfig({ ...watch, qa_effort: 'high' });
  assert.equal(onWatch.watch_agent, 'cursor', 'the watch agent\'s agent');
  assert.equal(onWatch.watch_model, '', 'its default model, not watch_model');
  assert.equal(onWatch.watch_effort, 'high');
  assert.equal(qaConfig({ builder: 'codex', qa_model: 'gpt-qa' }).watch_agent, 'codex', 'worked out as the watch agent\'s');
});

test('0651 AC1: speck config show lists QA\'s settings with the watch agent\'s, marking one this machine holds', () => {
  const rows = qaRows({ qa_agent: 'codex' }, { qa_bench: ['cursor'] });
  assert.deepEqual([...new Set(rows.map(x => x.group))], ['Your engineering manager']);
  assert.deepEqual(rows.map(x => x.row.key), [...QA_SETTINGS]);
  const [agent, model, , bench] = rows.map(x => x.row);
  assert.equal(agent.value, 'codex');
  assert.equal(agent.is_default, false);
  assert.match(agent.explain, /Blank uses the watch agent's agent/);
  assert.equal(model.is_default, true);
  assert.deepEqual(bench.value, ['cursor']);
  assert.equal(bench.this_machine, true);
  assert.equal(bench.repo_value, '');
});

// ---------- AC2 ----------

test('0651 AC2: a check in the running app runs on QA\'s agent, model and effort, while other looks stay on the watch agent\'s', () => {
  const { a } = qaChecking({ qa: QA });
  a.check();
  assert.equal(a.starts.length, 1);
  const argv = a.starts[0].argv;
  assert.equal(argv[0], 'codex', argv.join(' '));
  assert.ok(argv.includes('gpt-qa'), 'qa_model');
  assert.ok(argv.includes('model_reasoning_effort="high"'), 'qa_effort');
  assert.ok(!argv.includes('opus'), 'not watch_model');
  a.end(); a.check(blocked({ blocked_check_in_app: null }));
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check(blocked({ blocked_check_in_app: null }));
  assert.equal(a.starts.length, 2);
  assert.equal(a.starts[1].argv[0], 'claude', 'a look into a stop is the watch agent\'s');
  assert.ok(a.starts[1].argv.includes('opus'));
});

test('0651 AC2: while QA\'s agent is held by a usage limit, the check runs on the first agent on qa_bench that\'s ready', () => {
  const { a } = qaChecking({ qa: `${QA}qa_bench: [cursor, claude]\n`, held: ['codex'], ready: ['claude', 'codex'] });
  a.check();
  assert.equal(a.starts.length, 1);
  assert.equal(a.starts[0].argv[0], 'claude', 'Cursor isn\'t ready, so Claude');
  assert.ok(!a.starts[0].argv.includes('gpt-qa') && !a.starts[0].argv.includes('opus'), 'on the stand-in\'s own model');
  assert.ok(a.said.some(l => /Codex's usage limit is reached, so QA will check in the app on Claude until it resets/.test(l)), a.said.join('\n'));
  const none = qaChecking({ qa: `${QA}qa_bench: cursor\n`, held: ['codex'], ready: ['claude', 'codex'] }).a;
  none.check();
  assert.equal(none.starts.length, 0, 'none on qa_bench is ready: it waits');
});

// ---------- AC3 ----------

test('0651 AC3: the check\'s line in the ticket\'s Notes says QA checked it, and is still read as a call speck made', () => {
  const { r, a } = qaChecking({ qa: QA });
  a.check();
  a.act('decide', '0001', OPTION, `--saw=${SAW}`, '--why=It shows as asked');
  assert.equal(a.note(), `- Went with the recommendation: ${OPTION} (chosen by speck, as watch is decide, 2026-11-11 14:00 UTC). QA checked in the app: ${CHECK}. Saw: ${SAW}.`);
  assert.deepEqual(statusData(r.dir).tickets.find(x => x.id === '0001').foreman_took.map(w => w.option), [OPTION]);
  const asked = qaChecking({ qa: QA }).a;
  asked.check();
  asked.act('ask', '0001', 'Keep it?', `--saw=${SAW}`, '--why=It doesn\'t fully pass');
  assert.match(asked.note(), new RegExp(`asked you: Keep it\\?\\. QA checked in the app: ${CHECK}\\. Saw: ${SAW}\\. Why:`));
});

test('0651 AC3: speck run\'s log says QA checks it, on which agent, and what QA did', async () => {
  const { a } = qaChecking({ qa: QA });
  a.check();
  a.act('ask', '0001', 'Keep it?', `--saw=${SAW}`, '--why=It doesn\'t fully pass');
  a.end(); a.check();
  await new Promise(resolve => setImmediate(resolve));
  const said = a.said.join('\n');
  assert.match(said, /0001: QA will check its question in the app, as watch is decide: /);
  assert.match(said, /0001: QA is checking it in the app on codex\. Log: /);
  assert.match(said, /0001: QA checked it in the app and asked you: Keep it\?/);
  assert.match(said, /0001: QA stopped the app it started to check it\./);
  assert.doesNotMatch(said, /I'm looking into it|I asked you/);
});

test('0651 AC3: the Pipeline log shows QA\'s lines with the agent it checked on', () => {
  const details = vm.runInNewContext(`${model()}\nrunLogDetails`, {}), line = vm.runInNewContext(`${model()}\nrunLogLine`, {});
  const said = '12:00:00 » 0001: QA is checking it in the app on codex. Log: speck/.cache/runs/run.watch.log';
  assert.deepEqual([...details(said)], ['codex', 'speck/.cache/runs/run.watch.log']);
  assert.match(line(said).text, /QA is checking it in the app/);
  assert.match(line('12:01:00 » 0001: QA checked it in the app and went with the recommendation: keep it').text, /QA checked it in the app/);
});

// ---------- AC4 ----------

test('0651 AC4: with the QA settings blank, app checks run as they do today', async () => {
  assert.equal(qaOn({ qa_agent: '', qa_model: '', qa_effort: '', qa_bench: [] }), false);
  const cfg = { builder: 'claude', watch_model: 'opus' };
  assert.equal(qaConfig(cfg), cfg, 'the watch agent\'s settings as they are');
  const { a } = qaChecking();
  a.check();
  assert.equal(a.starts[0].argv[0], 'claude');
  assert.ok(a.starts[0].argv.includes('opus') && a.starts[0].argv.includes('low'), 'watch_model and watch_effort');
  a.act('decide', '0001', OPTION, `--saw=${SAW}`, '--why=It shows as asked');
  assert.match(a.note(), / Checked in the app: /);
  a.end(); a.check(blocked({ status: 'building' }));
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(a.said.some(l => /I'm looking into it on claude/.test(l)) && a.said.some(l => /I stopped the app I started/.test(l)), a.said.join('\n'));
  assert.ok(!a.said.some(l => /\bQA\b/.test(l)), a.said.join('\n'));
});
