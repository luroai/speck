import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { T, gitEnv } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { foremanAgentQueue, foremanAction, foremanBrief, agentView, readActions, readAgentState } from '../scripts/foreman-agent.mjs';
import { usualBuild } from '../scripts/long-build.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0569: look into a build that runs long ----------

const NOW = Date.parse('2026-11-09T12:00:00Z'), MIN = 60000;
const iso = ms => new Date(ms).toISOString();
const ago = minutes => iso(NOW - minutes * MIN);
// `n` shipped tickets, newest first, each built in `minutes`, the first finishing `offset` hours before NOW.
const shipped = (n, minutes, offset = 1) => Array.from({ length: n }, (_, i) => {
  const end = NOW - (offset + i) * 60 * MIN;
  return T(String(1000 + offset + i), 'done', { started: iso(end - minutes * MIN), approved: iso(end), finished: iso(end) });
});
const LOAD = [3.25, 2.5, 1.75];

// speck run's Foreman queue in a bare runs folder with one running build of 0001, starting nothing for real. A median of
// 10 minutes comes from `history`, and `o` is added to the ticket.
function watcher({ watch = 'fix', ran = 30, history = shipped(20, 10), record = {}, o = {}, state = null } = {}) {
  const runs = state || fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0569-'));
  const w = { runs, key: 'base1 head1', starts: [], said: [], live: new Set(), running: new Set(['0001']), watch, now: NOW, o: { started: ago(ran), ...o }, status: 'building' };
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: 's', started: ago(ran), pid: 4242, ...record }));
  fs.writeFileSync(path.join(runs, '0001.log'), 'first line\nnode --test is still going\n');
  w.q = foremanAgentQueue({ repo: runs, runs: () => runs, readConfig: () => ({ watch: w.watch }), cfg: { base_branch: 'main' }, running: w.running,
    ships: { again: () => {} }, say: m => w.said.push(m), startBuild: () => {}, providers: [], cantStart: () => '', key: () => w.key, statusOf: () => w.status,
    alive: pid => w.live.has(pid), withToken: () => [], now: () => w.now, load: () => LOAD,
    start: (argv, cwd, log, env) => { const pid = 90000 + w.starts.length; w.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); w.live.add(pid); return { pid, exited: () => !w.live.has(pid) }; } });
  w.tickets = () => [T('0001', w.status, w.o), ...history];
  w.check = () => w.q.check(w.tickets());
  w.end = () => { for (const s of w.starts) w.live.delete(s.pid); w.check(); };
  w.brief = () => w.starts.at(-1).argv[w.starts.at(-1).argv.indexOf('-p') + 1];
  return w;
}

for (const watch of ['fix', 'decide']) {
  test(`0569 AC1: with watch: ${watch}, a build past twice the median and 20 minutes starts the agent, whose brief has the figures`, () => {
    const w = watcher({ watch, ran: 30 });
    w.check();
    assert.equal(w.starts.length, 1);
    const brief = w.brief();
    assert.match(brief, /0001/);
    assert.match(brief, /30 min/, 'how long it has run');
    assert.match(brief, /10 min/, 'the median');
    assert.match(brief, /last 20 shipped tickets/);
    assert.match(brief, /node --test is still going/, 'the last lines of its log');
    assert.match(brief, /3\.25, 2\.50, 1\.75/, 'the load average');
    assert.match(brief, /speck-watch/);
    assert.match(brief, /speck\.mjs watch tell 0001/);
    assert.match(brief, /speck\.mjs watch fix 0001/);
    assert.doesNotMatch(brief, /watch (resume|reship|ask|decide) 0001/, 'nothing that acts on a build still running');
    assert.doesNotMatch(brief, /stopped for a reason/);
  });
}

test('0569 AC1: the agent starts once per build, whatever commits land or however many checks pass', () => {
  const w = watcher();
  w.check();
  assert.equal(w.starts.length, 1);
  w.key = 'base2 head2'; w.now += 5 * MIN; w.check();
  w.end();
  w.key = 'base3 head3'; w.now += 60 * MIN; w.check();
  assert.equal(w.starts.length, 1);
});

test('0569 AC1: a speck run started after the look, as when it switches to new code, doesn\'t look again', () => {
  const first = watcher();
  first.check();
  first.end();
  const second = watcher({ state: first.runs });
  second.check();
  assert.equal(second.starts.length, 0);
  assert.deepEqual(second.said, []);
});

const thresholds = [
  ['exactly twice the median', { history: shipped(20, 15), ran: 30 }, 0],
  ['just over twice the median', { history: shipped(20, 15), ran: 30.5 }, 1],
  ['over twice the median but under 20 minutes', { history: shipped(20, 5), ran: 19.5 }, 0],
  ['exactly 20 minutes, over twice the median', { history: shipped(20, 5), ran: 20 }, 1],
  ['long, with no shipped ticket to compare with', { history: [], ran: 500 }, 0],
];
for (const [name, opts, starts] of thresholds) {
  test(`0569 AC1: a build ${name} ${starts ? 'counts' : 'doesn\'t count'}`, () => {
    const w = watcher(opts);
    w.check();
    assert.equal(w.starts.length, starts);
  });
}

test('0569 AC1: the median comes from the last 20 shipped tickets, as the panel measures them', () => {
  // Waiting is left out of a ticket's time, and approval ends it, as in the panel.
  const end = NOW - 60 * MIN;
  assert.deepEqual(usualBuild([T('1', 'done', { started: iso(end - 40 * MIN), approved: iso(end - 10 * MIN), finished: iso(end), waited_seconds: 600 })]), { minutes: 20, count: 1 });
  // Older tickets outside the latest 20 count for nothing, a cancelled one and one with no times are left out.
  assert.deepEqual(usualBuild([...shipped(20, 10), ...shipped(30, 200, 21), T('2', 'cancelled', { started: ago(900), finished: ago(1) }), T('3', 'done')]), { minutes: 10, count: 20 });
  assert.equal(usualBuild([]), null);
});

test('0569 AC1: a paused build doesn\'t count, and time paused stays out of its time once it plays', () => {
  const w = watcher({ o: { paused: true } });
  w.check();
  assert.equal(w.starts.length, 0);
  w.o = { started: ago(30), paused: false, waited_seconds: 25 * 60 }; // played again: 25 of its 30 minutes were paused
  w.check();
  assert.equal(w.starts.length, 0);
  w.now += 40 * MIN;
  w.check();
  assert.equal(w.starts.length, 1);
});

test('0569 AC1: only a build still running counts', () => {
  const notRunning = watcher(); notRunning.running.clear(); notRunning.check();
  assert.equal(notRunning.starts.length, 0, 'not in speck run\'s builds');
  const exited = watcher({ record: { exited: ago(1), exit_code: 0 } }); exited.check();
  assert.equal(exited.starts.length, 0, 'its record says it ended');
  const outside = watcher({ record: { seen: true } }); outside.check();
  assert.equal(outside.starts.length, 0, 'someone\'s own session, which speck run didn\'t start');
  for (const status of ['approved', 'blocked', 'done']) {
    const w = watcher(); w.status = status; w.check();
    assert.equal(w.starts.length, 0, `a ${status} ticket`);
  }
});

test('0569 AC1: a ticket handed back or resumed after a wait is timed from then, not from when it first started', () => {
  const back = watcher({ o: { started: ago(600) }, record: { handed_back: ago(5) } });
  back.check();
  assert.equal(back.starts.length, 0, 'handed back 5 minutes ago');
  back.now += 30 * MIN;
  back.check();
  assert.equal(back.starts.length, 1);
  const resumed = watcher({ o: { started: ago(600) }, record: { foreman_resumed: ago(5) } });
  resumed.check();
  assert.equal(resumed.starts.length, 0, 'resumed 5 minutes ago with your answer');
});

test('0569 AC1: a build that hasn\'t started its ticket yet is timed from its launch', () => {
  const w = watcher({ o: { started: undefined } });
  w.status = 'ready';
  w.check();
  assert.equal(w.starts.length, 1);
});

test('0569 AC1: an unreadable start time counts for nothing', () => {
  const w = watcher({ o: { started: 'soon' }, record: { started: 'later' } });
  w.check();
  assert.equal(w.starts.length, 0);
});

test('0569 AC1: a look at a long build leaves a stop on the same commits to be looked into', () => {
  const w = watcher();
  w.check();
  assert.equal(readAgentState(w.runs).tried['0001'], undefined);
  w.end();
  w.q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  w.check();
  assert.equal(w.starts.length, 2);
  assert.match(w.brief(), /stopped for a reason/);
});

test('0569 AC1: a build that ends while its look waits for the agent is no longer looked into', () => {
  const w = watcher();
  w.q.stuck({ id: '0002', what: 'its ship was refused', log: '' });
  w.check(); // the agent starts for 0002, and 0001's look waits
  assert.equal(readAgentState(w.runs).queue.length, 1);
  w.running.clear();
  w.end();
  assert.equal(w.starts.length, 1);
  assert.deepEqual(readAgentState(w.runs).queue, []);
});

test('0569 AC1: a question still waiting for you holds back the look, which comes once it\'s answered', () => {
  const w = watcher();
  fs.writeFileSync(path.join(w.runs, 'run.foreman-did.jsonl'), `${JSON.stringify({ run: 'x', id: '0001', action: 'ask', text: 'macOS?', why: 'unknown', at: ago(1), status: 'building' })}\n`);
  w.check();
  assert.equal(w.starts.length, 0);
  fs.rmSync(path.join(w.runs, 'run.foreman-did.jsonl'));
  w.check();
  assert.equal(w.starts.length, 1);
});

test('0569 AC1: unknown ticket ids in the saved record are kept apart from Object\'s own names', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0569-'));
  fs.writeFileSync(path.join(runs, 'run.foreman-agent.json'), '{"long":{"constructor":"x","0001":5}}');
  const s = readAgentState(runs);
  assert.equal(s.long.toString, undefined);
  assert.equal(s.long['0001'], undefined, 'only text counts');
  assert.equal(s.long.constructor, 'x');
});

test('0569 AC2: with watch: tell, speck run says so once in its log, with the figures, and starts no agent', () => {
  const w = watcher({ watch: 'tell' });
  w.check();
  w.now += 10 * MIN; w.check();
  assert.equal(w.starts.length, 0);
  assert.equal(w.said.length, 1);
  assert.match(w.said[0], /^0001: /);
  assert.match(w.said[0], /running long/);
  assert.match(w.said[0], /30 min/);
  assert.match(w.said[0], /10 min/);
  assert.match(w.said[0], /3\.25, 2\.50, 1\.75/);
  assert.deepEqual(readAgentState(w.runs).queue, []);
  const next = watcher({ watch: 'tell', state: w.runs });
  next.check();
  assert.deepEqual(next.said, [], 'not said again after a restart');
});

test('0569 AC2: with watch: off, it neither says so nor starts an agent, and an unset watch tells', () => {
  const w = watcher({ watch: 'off' });
  w.check();
  assert.deepEqual(w.said, []);
  assert.equal(w.starts.length, 0);
  const unset = watcher();
  unset.watch = undefined;
  unset.check();
  assert.equal(unset.said.length, 1);
});

test('0569 AC2: the load average says when the machine can\'t give one', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0569-')), said = [];
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', started: ago(30), pid: 1 }));
  const q = foremanAgentQueue({ repo: runs, runs: () => runs, readConfig: () => ({ watch: 'tell' }), cfg: { base_branch: 'main' }, running: new Set(['0001']), ships: {}, say: m => said.push(m), startBuild: () => {},
    providers: [], cantStart: () => '', key: () => 'k', statusOf: () => 'building', now: () => NOW, load: () => [0, 0, 0] });
  q.check([T('0001', 'building', { started: ago(30) }), ...shipped(5, 10)]);
  assert.match(said[0], /last 5 shipped tickets/);
  assert.match(said[0], /load average isn't known/);
});

// A real repo whose ticket 0001 is building, with the watch agent started for it. `long` is whether its look is at a
// long build, or at a stop.
function looking({ long = true } = {}) {
  const r = blockedRepo({ status: 'building', record: { session: 's', pid: 4242, started: ago(30) } });
  const a = { starts: [], said: [], live: new Set(), running: new Set(['0001']) };
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix' }), cfg: { base_branch: 'main', branch_prefix: 'speck/' }, running: a.running, ships: { again: () => {} },
    say: m => a.said.push(m), key: () => 'base head', statusOf: () => 'building', providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], startBuild: () => {}, now: () => NOW, load: () => LOAD,
    start: (argv, cwd, log, env) => { const pid = 90000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.tickets = [T('0001', 'building', { started: ago(30) }), ...shipped(20, 10)];
  if (!long) { a.running.clear(); a.q.stuck({ id: '0001', what: 'its build ended', log: '' }); }
  a.q.check(a.tickets);
  assert.equal(a.starts.length, 1);
  a.act = (...args) => foremanAction(r.dir, args, { token: a.starts[0].token, now: new Date(NOW) });
  a.end = () => { a.live.clear(); a.q.check(a.tickets); };
  return { ...r, ...a };
}

test('0569 AC3: speck watch tell writes what it found in the ticket\'s Notes and speck run\'s log', () => {
  const a = looking();
  const said = a.act('tell', '0001', 'The tests were slow, as four builds ran at once.', '--why=The load was 12 on a 4-core machine.');
  assert.match(said, /Stop here/);
  assert.match(a.ticket(), /^- speck \(2026-11-09 12:00 UTC\) told you: The tests were slow, as four builds ran at once\. Why: The load was 12 on a 4-core machine\.$/m);
  assert.match(a.g('log', '-1', '--format=%s'), /^speck\(0001\): watch: tell/);
  assert.deepEqual(readActions(a.runs).map(x => [x.action, x.text]), [['tell', 'The tests were slow, as four builds ran at once.']]);
  a.said.length = 0;
  a.end();
  assert.ok(a.said.some(l => /^0001: speck told you what it found: The tests were slow, as four builds ran at once\./.test(l)), a.said.join('\n'));
  assert.equal(a.starts.length, 1, 'and it starts nothing more');
});

test('0569 AC3: a tell needs no answer and doesn\'t count under Needs you', () => {
  const a = looking();
  a.act('tell', '0001', 'Harmless: a long review.', '--why=Nothing is broken.');
  const view = agentView(a.runs, a.tickets);
  assert.deepEqual(view.asks, []);
  assert.equal(view.did[0].action, 'tell');
  assert.equal(foremanView({ run: { on: true, pid: 1 }, record: null, tickets: a.tickets, fixing: 'fix', agent: view }).word.startsWith('Needs you'), false);
});

test('0569 AC3: speck watch tell needs the finding and a reason, and comes once a run', () => {
  const a = looking();
  assert.throws(() => a.act('tell', '0001', '--why=No finding.'), /needs what you found/);
  assert.throws(() => a.act('tell', '0001', 'A finding.'), /--why/);
  a.act('tell', '0001', 'A finding.', '--why=Because.');
  assert.throws(() => a.act('tell', '0001', 'Another.', '--why=Because.'), /already taken its one action/);
});

test('0569 AC3: while a build runs long the agent can only tell or make a fix ticket, and tell is only for a long build', () => {
  const a = looking();
  for (const args of [['resume', '0001', 'Carry on'], ['reship', '0001'], ['ask', '0001', 'Why?']]) assert.throws(() => a.act(...args, '--why=Because.'), /still running/);
  assert.deepEqual(readActions(a.runs), []);
  const stop = looking({ long: false });
  assert.throws(() => stop.act('tell', '0001', 'A finding.', '--why=Because.'), /long/);
  assert.deepEqual(readActions(stop.runs), []);
  assert.doesNotMatch(foremanBrief({ id: '0001', what: 'x', log: 'l', tail: '' }), /watch tell/);
});

test('0569 AC3: speck watch fix on a long build makes the draft fix ticket as it does for a stop', () => {
  const a = looking();
  a.g('checkout', '-q', 'main');
  a.g('worktree', 'add', '-q', `${a.dir}-wt`, 'speck/0001-export-bookings');
  const said = a.act('fix', '0001', 'Fix the hanging test', '--why=A test on the base branch hangs.');
  assert.match(said, /Made draft fix ticket/);
  assert.equal(readActions(a.runs)[0].action, 'fix');
  const id = readActions(a.runs)[0].fix_id;
  const made = fs.readdirSync(path.join(a.dir, 'speck', 'tickets')).find(f => f.startsWith(id));
  const text = fs.readFileSync(path.join(a.dir, 'speck', 'tickets', made), 'utf8');
  assert.match(text, /^status: draft/m);
  assert.match(text, /A test on the base branch hangs\./);
});
