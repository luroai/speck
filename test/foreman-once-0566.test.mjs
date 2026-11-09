import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { T } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { foremanAgentQueue, agentView, readAgentState } from '../scripts/foreman-agent.mjs';
import { askKey } from '../scripts/foreman-answer.mjs';

// ---------- 0566: ask about a stop only once ----------

const ASKED = '2026-11-08T10:00:00.000Z';

// speck run's Foreman queue in a bare runs folder, starting nothing for real. `w.key` is the commits a stop is looked
// into for and `w.status` the ticket's status, so a test moves either on by setting it.
function watcher() {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0566-'));
  const w = { runs, key: 'base1 head1', status: 'approved', starts: [], said: [], live: new Set() };
  w.q = foremanAgentQueue({ repo: runs, runs: () => runs, readConfig: () => ({ watch: 'fix' }), cfg: { base_branch: 'main' }, running: new Set(),
    ships: { again: () => {} }, say: m => w.said.push(m), startBuild: () => {}, providers: [], cantStart: () => '',
    key: () => w.key, statusOf: () => w.status, alive: pid => w.live.has(pid), withToken: () => [],
    start: (argv, cwd, log, env) => { const pid = 90000 + w.starts.length; w.starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); w.live.add(pid); return { pid, exited: () => !w.live.has(pid) }; } });
  w.check = () => w.q.check([T('0001', w.status)]);
  w.stop = (what = 'its ship was refused: no') => w.q.stuck({ id: '0001', what, log: '' });
  w.ask = () => { // the running agent asks you, and ends
    const s = w.starts.at(-1);
    fs.appendFileSync(path.join(runs, 'run.foreman-did.jsonl'), `${JSON.stringify({ run: s.token, id: '0001', action: 'ask', text: 'macOS?', why: 'unknown', at: ASKED, status: w.status })}\n`);
    w.live.delete(s.pid);
  };
  w.reply = (action, o = {}) => fs.writeFileSync(path.join(runs, `run.foreman-answer.${askKey('0001', ASKED)}.json`),
    JSON.stringify({ id: '0001', ask_at: ASKED, question: 'macOS?', action, text: action === 'answer' ? 'Yes' : '', at: '2026-11-08T11:00:00.000Z', status: w.status, ...o }));
  return w;
}
// A watcher that has looked into 0001 and asked you about it, with its agent ended.
function asked() {
  const w = watcher();
  w.stop(); w.check();
  assert.equal(w.starts.length, 1);
  w.ask(); w.check();
  return w;
}
const again = w => { w.key = 'base2 head2'; w.stop('its ship was refused: again'); w.check(); };

test('0566 AC1: a new commit doesn\'t start the agent again while its question waits for you', () => {
  const w = asked();
  w.said.length = 0;
  w.key = 'base2 head1'; w.stop(); w.check(); // a new commit on the base branch
  w.key = 'base2 head2'; w.stop(); w.check(); // and on the ticket's branch
  assert.equal(w.starts.length, 1, 'not started again');
  assert.deepEqual(readAgentState(w.runs).queue, [], 'nothing waits to start');
  assert.deepEqual(w.said.filter(l => /I'll look into it/.test(l)), [], 'and it doesn\'t say it will');
});

test('0566 AC1: a stop queued while the agent was running is dropped once that agent has asked', () => {
  const w = watcher();
  w.stop(); w.check();
  w.key = 'base2 head1'; w.stop(); // new commits while it's still looking
  assert.equal(readAgentState(w.runs).queue.length, 1);
  w.ask(); w.check();
  assert.equal(w.starts.length, 1, 'not started again');
  assert.deepEqual(readAgentState(w.runs).queue, []);
});

test('0566 AC1: speck run reads the ticket\'s status itself, so a real repo\'s stop is held back when it happens', () => {
  const r = blockedRepo({ status: 'building' }), said = [];
  fs.writeFileSync(path.join(r.runs, 'run.foreman-did.jsonl'), `${JSON.stringify({ run: 'x', id: '0001', action: 'ask', text: 'macOS?', why: 'unknown', at: ASKED, status: 'building' })}\n`);
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ watch: 'fix' }), cfg: { base_branch: 'main', branch_prefix: 'speck/' }, running: new Set(), ships: {}, say: m => said.push(m), startBuild: () => {} });
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  assert.deepEqual(said, []);
  assert.deepEqual(readAgentState(r.runs).queue, []);
});

for (const action of ['answer', 'dismiss']) {
  test(`0566 AC2: once you ${action} the question, a new stop is looked into again`, () => {
    const w = asked();
    w.reply(action, { carry: 'resume' });
    again(w);
    assert.equal(w.starts.length, 2);
  });
}

test('0566 AC2: once the ticket\'s status changes, a new stop is looked into again', () => {
  const w = asked();
  w.status = 'building';
  again(w);
  assert.equal(w.starts.length, 2);
});

test('0566 AC2: a stop for the same commits is still looked into only once, as today', () => {
  const w = asked();
  w.reply('dismiss');
  w.stop(); w.check();
  assert.equal(w.starts.length, 1);
});

test('0566 AC2: another ticket\'s stop isn\'t held back by this one\'s question', () => {
  const w = asked();
  w.q.stuck({ id: '0002', what: 'its build ended', log: '' });
  w.q.check([T('0001', w.status), T('0002', w.status)]);
  assert.equal(w.starts.length, 2);
});

test('0566 AC3: the waiting question counts once under Needs you, however many stops came after it', () => {
  const w = asked();
  again(w); again(w);
  const tickets = [T('0001', w.status)], agent = agentView(w.runs, tickets);
  assert.equal(agent.asks.length, 1);
  assert.equal(foremanView({ run: { on: true, pid: process.pid }, record: { lock: process.pid }, tickets, agent }).word, 'Needs you 1');
});
