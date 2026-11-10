// 0591: speck run's log gives the engineering manager's own lines in the first person, marked so the panel can tell
// them from the tool's.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gitEnv, model, T } from './support/panel.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { loadConfig, statusData } from '../scripts/speck.mjs';
import { speckSays } from '../scripts/core.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { foremanAgentQueue, foremanAction } from '../scripts/foreman-agent.mjs';
import { goWith, goWithQueue } from '../scripts/go-with.mjs';

Object.assign(process.env, gitEnv); // goWith and speck watch commit in this process

const lineOf = vm.runInNewContext(`${model()}\nrunLogLine`, {});
const named = r => fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), 'speck_name: Virgil\nwatch: fix\n');
const mine = text => speckSays(text);

// A repo whose ticket 0001 the agent can be started for. `said` is speck run's log.
function watching(status = 'building', o = {}) {
  const r = blockedRepo({ status });
  named(r);
  const starts = [], said = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'],
    cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again: () => {} }, say: m => said.push(m), startBuild: () => {},
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [], ...o });
  return { r, q, said, starts, end: () => live.delete(starts[starts.length - 1].pid) };
}

// What goWithQueue logs for a ticket a recommendation was taken for.
function resumeLogged(r) {
  const logged = [], was = console.log;
  console.log = m => logged.push(m);
  try {
    goWithQueue({ cfg: loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running: new Set(), startBuild: () => {}, saveRecord: (f, v) => fs.writeFileSync(f, JSON.stringify(v)), runs: () => r.runs, repo: r.dir })
      .check([{ id: '0001', status: 'building' }]);
  } finally { console.log = was; }
  return logged;
}

test('0591 AC1: looking into a ticket is said in the first person, without the name', () => {
  const { r, q, said, end } = watching();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  assert.equal(said[0], mine('0001: I\'ll look into it, as watch is fix: its build ended'));
  q.check([T('0001', 'building')]);
  assert.ok(said.some(m => m.startsWith(mine('0001: I\'m looking into it on '))), said.join('\n'));
  end();
  q.check([T('0001', 'building')]);
  assert.ok(said.some(m => m.startsWith(mine('0001: I looked into it and took no action.'))), said.join('\n'));
  assert.ok(!said.some(m => /Virgil/.test(m)), said.join('\n'));
  assert.ok(r.dir);
});

test('0591 AC1: what it did about a ticket is said in the first person', () => {
  const { r, q, said, starts, end } = watching();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  q.check([T('0001', 'building')]);
  foremanAction(r.dir, ['ask', '0001', 'Keep it?', '--why=it stopped'], { token: starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  end();
  q.check([T('0001', 'building')]);
  assert.ok(said.includes(mine('0001: I asked you: Keep it? (it stopped)')), said.join('\n'));
});

test('0591 AC1: not being able to start looking into it, or to save, is said in the first person', () => {
  const cant = watching('building', { cantStart: () => 'no key' });
  cant.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  cant.q.check([T('0001', 'building')]);
  assert.ok(cant.said.some(m => m.startsWith(mine('0001: I couldn\'t start looking into it on ')) && m.endsWith(': no key')), cant.said.join('\n'));
  const unsaved = watching('building', { persist: () => { throw new Error('disk full'); } });
  unsaved.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  assert.deepEqual(unsaved.said, [mine('I couldn\'t save my record of what I look into (disk full), so I\'ll try again on speck run\'s next check.')]);
});

test('0591 AC1: taking a recommendation, or not, is said in the first person', () => {
  const r = blockedRepo(), said = [];
  named(r);
  foremanFixQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), say: m => said.push(m) }).check(statusData(r.dir).tickets);
  assert.ok(said.includes(mine(`0001: I went with the recommendation: ${OPTION}, as watch is fix, and noted it in the ticket.`)), said.join('\n'));
  const refused = [];
  foremanFixQueue({ repo: r.dir, readConfig: () => ({ watch: 'fix' }), say: m => refused.push(m), goWith: () => ({ status: 409, body: { error: 'no' } }) })
    .check([T('0002', 'blocked', { blocked_question: 'A or B?', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_resumable: true, risk: 'low' })]);
  assert.deepEqual(refused, [mine('0002: I didn\'t take its recommendation: no')]);
});

test('0591 AC1: the resume line after taking a recommendation is said in the first person', () => {
  const r = blockedRepo();
  named(r);
  assert.equal(goWith(r.dir, '0001', new Date(), { by: 'foreman' }).status, 200);
  const logged = resumeLogged(r);
  assert.ok(logged.some(m => m.startsWith(mine('0001: I went with its recommendation, so speck run is resuming its build'))), logged.join('\n'));
});

test('0591 AC2: a choice you made with the button stays yours, unmarked', () => {
  const r = blockedRepo();
  named(r);
  assert.equal(goWith(r.dir, '0001', new Date(), { by: 'user' }).status, 200);
  const logged = resumeLogged(r);
  assert.ok(logged.some(m => m.startsWith('0001: you went with its recommendation, so speck run is resuming its build')), logged.join('\n'));
});

test('0591 AC2: a build running long under watch: tell is not spoken by the manager', () => {
  const said = [];
  const r = blockedRepo({ status: 'building', record: { session: 's', pid: 4242, started: new Date(Date.now() - 3 * 3600e3).toISOString() } });
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'tell' }), cfg: { base_branch: 'main', branch_prefix: 'speck/' }, running: new Set(['0001']), ships: { again: () => {} },
    say: m => said.push(m), key: () => 'base head', statusOf: () => 'building', providers: [], cantStart: () => '', alive: () => true, withToken: () => [], startBuild: () => {}, load: () => ({ one: 1, cores: 4 }) });
  const done = Array.from({ length: 20 }, (_, i) => T(String(100 + i).padStart(4, '0'), 'done', { started: new Date(Date.now() - 7200e3).toISOString(), done_at: new Date(Date.now() - 6600e3).toISOString() }));
  q.check([T('0001', 'building', { started: new Date(Date.now() - 3 * 3600e3).toISOString() }), ...done]);
  for (const m of said) assert.ok(!m.startsWith(speckSays('')), m);
});

test('0591 AC2 and AC3: the tool\'s own lines are as they were, and the panel reads none of them as the manager\'s', () => {
  const lines = [
    ['18:30:00 Started 0554: speck build 0554', 'Started 0554'], ['18:30:00 Launched 0554 (session abc). Log: x.log', '0554 build started'], ['18:30:00 Shipped 0550.', '0550 shipped'],
    ['18:30:00 0550 didn\'t ship: it was stopped', '0550 didn\'t ship: it was stopped'], ['Shipping is on hold until main passes.', 'Shipping'],
    // Nothing but the mark says so: first-person words on a line without it don't count.
    ['18:30:00 0001: I went with the recommendation: A', '0001'], ['I think this came from a build\'s output', 'I think'],
  ];
  for (const [line, starts] of lines) {
    const p = lineOf(line);
    assert.ok(!p.speck, line);
    assert.ok(p.text.startsWith(starts), `${line} → ${p.text}`);
  }
});

test('0591 AC3: the panel knows each marked line as the manager\'s, timed or not, and shows it without the mark', () => {
  const timed = lineOf(`18:30:00 ${speckSays('0412: I\'ll look into it, as watch is decide: its build ended')}`);
  assert.equal(timed.speck, true);
  assert.equal(timed.at, '18:30:00 ');
  assert.equal(timed.text, '0412: I\'ll look into it, as watch is decide: its build ended'); // 0620: whole, not cut short
  assert.equal(timed.kind, 'msg');
  const plain = lineOf(speckSays('I couldn\'t save my record of what I look into.'));
  assert.equal(plain.speck, true);
  assert.equal(plain.at, '');
  assert.doesNotMatch(plain.text, /»/);
});

test('0591 AC3: a line that is only the mark, or empty, doesn\'t throw', () => {
  assert.equal(lineOf(speckSays('')).speck, true);
  assert.equal(lineOf(speckSays('')).text, '');
  assert.ok(!lineOf('').speck);
});

test('0591 AC4: speck status still names the manager by its chosen name', () => {
  const at = new Date().toISOString();
  const agent = { running: { id: '0002', what: 'its build ended', started: at }, waiting: [], asks: [{ id: '0003', question: 'Keep it?', at }], did: [{ id: '0004', action: 'resume', did: 'resumed its build', text: 'carry on', why: 'it stopped', at }] };
  const out = foremanLines(foremanView({ run: { on: true, pid: 1 }, record: { lock: 1, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] } }, tickets: [], fixing: 'fix', agent, name: 'Virgil' })).join('\n');
  for (const said of ['Virgil is looking into 0002', 'Virgil asks you about 0003', 'Virgil resumed its build for 0004']) assert.ok(out.includes(said), `${said}\n${out}`);
  assert.doesNotMatch(out, /\bI(?:'ll|'m)?\s/);
  assert.doesNotMatch(out, /»/);
});
