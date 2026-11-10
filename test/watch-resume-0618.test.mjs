import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, gitEnv } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { foremanAgentQueue, foremanAction, readActions, readAgentState } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0618: drop a waiting watch resume once its ticket has moved on ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const ASKED = 'Re-run the failing test and carry on';
const NOW = new Date('2026-11-10T14:00:00Z');
const DROPPED = /asked for its build to be resumed, but the ticket has moved on since, so speck run left it as it is/;

// A repo whose ticket 0001 stopped, with the watch agent started for it and still running. `a.end()` ends it.
function looking(status = 'building') {
  const r = blockedRepo({ status });
  const config = path.join(r.dir, 'speck', 'config.yml'); // uncommitted, so it moves no branch
  fs.writeFileSync(config, `${fs.readFileSync(config, 'utf8').replace(/^watch:.*$/m, '').trimEnd()}\nwatch: fix\n`);
  const a = { starts: [], resumed: [], said: [], live: new Set(), running: new Set(), inUse: new Set() };
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: WORDS, cfg: CFG, max: 1, running: a.running, ships: { again: () => {} },
    say: m => a.said.push(m), key: () => 'base head', statusOf: () => status, providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], inUse: session => a.inUse.has(session),
    startBuild: (id, argv, cwd, session, flags, rec) => { a.resumed.push({ id, argv, rec: JSON.parse(rec(4242)) }); a.running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = (s = status) => a.q.check([T('0001', s)]);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  assert.equal(a.starts.length, 1, 'the agent started');
  a.token = a.starts[0].token;
  a.end = () => a.live.delete(a.starts[0].pid);
  a.resume = () => foremanAction(r.dir, ['resume', '0001', ASKED, '--why=A flaky test'], { token: a.token, now: NOW });
  return { r, a };
}

// A resume whose agent has ended and which waits for a build slot, then a check once `move` has run and a slot is free.
function waitingThen(move, status = 'building') {
  const s = looking(status);
  s.a.resume();
  s.a.running.add('other'); // no build slot free, so it waits
  s.a.end();
  s.a.check();
  assert.equal(s.a.resumed.length, 0);
  assert.equal(readAgentState(s.r.runs).resumes.length, 1, 'it waits');
  s.a.said.length = 0;
  s.a.running.clear();
  s.a.check(move(s) || status);
  return s;
}
function dropped(s) {
  assert.equal(s.a.resumed.length, 0, 'not resumed');
  assert.deepEqual(readAgentState(s.r.runs).resumes, [], 'and dropped');
  assert.equal(s.a.said.filter(l => DROPPED.test(l)).length, 1, s.a.said.join('\n'));
  s.a.check();
  assert.equal(s.a.said.filter(l => DROPPED.test(l)).length, 1, 'said once');
}

test('0618 AC1: a resume keeps the ticket\'s status, its branch\'s commit and its build\'s session from when it was asked', () => {
  const { r, a } = looking('reviewing');
  a.resume();
  const did = readActions(r.runs)[0];
  assert.equal(did.status, 'reviewing');
  assert.equal(did.head, r.head());
  assert.equal(did.session, 'sess-1');
  a.running.add('other');
  a.end();
  a.check();
  const kept = readAgentState(r.runs).resumes[0];
  assert.deepEqual([kept.status, kept.head, kept.session], ['reviewing', r.head(), 'sess-1']);
});

test('0618 AC2: a waiting resume is dropped once the ticket\'s branch has a new commit', () => dropped(waitingThen(({ r }) => { r.g('commit', '-q', '--allow-empty', '-m', 'carried on by hand'); })));
test('0618 AC2: a waiting resume is dropped once its build has another session', () => dropped(waitingThen(({ r }) => { fs.writeFileSync(r.record, JSON.stringify({ ...JSON.parse(fs.readFileSync(r.record, 'utf8')), session: 'sess-2' })); })));
test('0618 AC2: a waiting resume is dropped while its build\'s session is in use', () => dropped(waitingThen(({ a }) => { a.inUse.add('sess-1'); })));
for (const status of ['done', 'cancelled', 'reviewing'])
  test(`0618 AC2: a waiting resume is dropped once the ticket is ${status}`, () => dropped(waitingThen(() => status)));

test('0618 AC3: a waiting resume whose ticket hasn\'t moved on runs as it does today, once', () => {
  const s = waitingThen(() => {});
  assert.equal(s.a.resumed.length, 1);
  const message = s.a.resumed[0].argv.find(w => w.includes(ASKED)) ?? '';
  assert.ok(message.includes(ASKED), s.a.resumed[0].argv.join(' '));
  assert.equal(s.a.resumed[0].rec.session, 'sess-1');
  assert.ok(!s.a.said.some(l => DROPPED.test(l)));
  s.a.running.clear();
  s.a.check();
  assert.equal(s.a.resumed.length, 1, 'once');
});

test('0618 AC3: a resume with a slot free runs straight away once the agent has ended', () => {
  const { a } = looking();
  a.resume();
  a.end();
  a.check();
  assert.equal(a.resumed.length, 1);
});

test('0618 AC3: a resume waiting from before this change, with nothing kept, still runs', () => {
  const { r, a } = looking();
  a.resume();
  const file = path.join(r.runs, 'run.foreman-did.jsonl');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { const { head: _h, session: _s, ...x } = JSON.parse(l); return JSON.stringify(x); }).join('\n') + '\n');
  a.end();
  a.check();
  assert.equal(a.resumed.length, 1);
});

test('0618 AC3: a waiting resume on a blocked ticket still runs, as a resume leaves it blocked', () => {
  const s = waitingThen(() => {}, 'blocked');
  assert.equal(readActions(s.r.runs)[0].status, 'blocked');
  assert.equal(s.a.resumed.length, 1);
});
