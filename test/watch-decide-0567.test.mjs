import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, gitEnv } from './support/panel.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig } from '../scripts/speck.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanAgentQueue, foremanAction, foremanBrief, agentView, readActions } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0567: let the watch agent act on its own recommendation ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const CHOICE = 'Keep the retry and raise its timeout';
const NOW = new Date('2026-11-08T14:00:00Z');
const LINE = `- Went with the recommendation: ${CHOICE} (chosen by speck, as watch is decide, 2026-11-08 14:00 UTC).`;
const RAISE = 'Over the limit. Split it, or raise the limit?\n\nRecommended: Raise the limit\nChanges what you\'d notice: no\nClear winner: yes\nSize guard: yes';

function setWatch(r, value) { // uncommitted, so it moves no branch
  const file = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, /^watch:/m.test(text) ? text.replace(/^watch:.*$/m, `watch: ${value}`) : `${text.trimEnd()}\nwatch: ${value}\n`);
}
function edit(r, change) { fs.writeFileSync(r.file, change(fs.readFileSync(r.file, 'utf8'))); r.g('commit', '-qam', 'edited'); }
const notes = n => Array.from({ length: n }, (_, i) => `- Went with the recommendation: Option ${i} (chosen by speck, as watch is decide, 2026-11-0${i + 1} 10:00 UTC).`).join('\n');

// A repo whose ticket 0001 stopped, with the watch agent started for it and still running. `a.end()` ends it.
function looking({ status = 'building', watch = 'decide', question, record } = {}) {
  const r = blockedRepo({ status, ...(question !== undefined ? { question } : {}), ...(record !== undefined ? { record } : {}) });
  setWatch(r, watch);
  const a = { starts: [], resumed: [], said: [], live: new Set(), running: new Set() };
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: WORDS, cfg: CFG, max: 1, running: a.running, ships: { again: () => {} },
    say: m => a.said.push(m), key: () => 'base head', statusOf: () => status, providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [],
    startBuild: (id, argv, cwd, session, flags, rec) => { a.resumed.push({ id, argv, rec: JSON.parse(rec(4242)) }); a.running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = (s = status) => a.q.check([T('0001', s)]);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  assert.equal(a.starts.length, 1, 'the agent started');
  a.token = a.starts[0].token;
  a.end = () => a.live.delete(a.starts[0].pid);
  a.act = (...args) => foremanAction(r.dir, args, { token: a.token, now: NOW });
  a.decide = (option = CHOICE) => a.act('decide', '0001', option, '--why=A retry fixes it');
  return { r, a };
}
// Runs `act`, which must refuse saying `said`, and checks it changed nothing.
function refusesUnchanged({ r, a }, said, act = () => a.decide()) {
  const head = r.head(), ticket = r.ticket(), record = fs.readFileSync(r.record, 'utf8');
  assert.throws(act, said);
  assert.equal(r.head(), head, 'no commit');
  assert.equal(r.ticket(), ticket, 'ticket as it was');
  assert.equal(fs.readFileSync(r.record, 'utf8'), record, 'run record as it was');
  assert.deepEqual(readActions(r.runs), [], 'no action logged');
}

test('0567 AC1: decide adds the line to the ticket\'s Notes and commits only that as the agent\'s own', () => {
  const { r, a } = looking();
  assert.match(a.decide(), /resumes its build.*Stop here/);
  assert.ok(r.ticket().split('\n').includes(LINE), r.ticket());
  assert.equal(r.g('log', '-1', '--format=%s').trim(), 'speck(0001): watch: decide');
  assert.deepEqual(r.g('show', '--name-only', '--format=', 'HEAD').trim().split('\n'), [path.relative(r.dir, r.file)]);
});

test('0567 AC1: once the agent has ended, its build is resumed with that option, once', () => {
  const { a } = looking();
  a.decide();
  a.check();
  assert.equal(a.resumed.length, 0, 'not while the agent still runs');
  a.end();
  a.check();
  assert.equal(a.resumed.length, 1);
  assert.equal(a.resumed[0].id, '0001');
  const message = a.resumed[0].argv.find(w => w.includes('watch: decide')) ?? '';
  assert.ok(message.includes(CHOICE), message);
  assert.match(message, /speck \(watch: decide\)/);
  assert.match(message, /\/speck-build 0001/);
  assert.equal(a.resumed[0].rec.session, 'sess-1');
  a.running.clear();
  a.check();
  assert.equal(a.resumed.length, 1, 'once');
});

test('0567 AC1: a blocked ticket is set building, as the button does', () => {
  const { r, a } = looking({ status: 'blocked' });
  a.decide();
  assert.match(r.ticket(), /^status: building$/m);
  assert.equal(r.g('status', '--porcelain', '--', path.relative(r.dir, r.file)).trim(), '');
  assert.ok(r.ticket().split('\n').includes(LINE));
});

test('0567 AC1: a ticket that wasn\'t blocked keeps its status', () => {
  const { r, a } = looking({ status: 'reviewing' });
  a.decide();
  assert.match(r.ticket(), /^status: reviewing$/m);
});

test('0567 AC1: the board reads it as speck\'s choice, with the option', () => {
  const { r, a } = looking();
  a.decide();
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.went_with.option, CHOICE);
  assert.equal(t.foreman_took[0].option, CHOICE);
});

test('0567 AC1: it\'s logged as the run\'s one action, and a second is refused', () => {
  const { r, a } = looking();
  a.decide();
  const did = readActions(r.runs);
  assert.equal(did.length, 1);
  assert.deepEqual([did[0].action, did[0].text, did[0].why, did[0].run], ['decide', CHOICE, 'A retry fixes it', a.token]);
  assert.throws(() => a.decide('Another'), /already taken its one action/);
  assert.throws(() => a.act('ask', '0001', 'Why?', '--why=x'), /already taken its one action/);
});

test('0567 AC1: an option or a reason that\'s missing is refused, changing nothing, and the option stays on one line', () => {
  const s = looking();
  refusesUnchanged(s, /needs the option/, () => s.a.act('decide', '0001', '   ', '--why=x'));
  refusesUnchanged(s, /--why/, () => s.a.act('decide', '0001', CHOICE));
  s.a.act('decide', '0001', 'Keep\n  the   retry', '--why=x');
  assert.match(s.r.ticket(), /Went with the recommendation: Keep the retry \(chosen by speck/);
});

for (const watch of ['off', 'tell', 'fix']) {
  test(`0567 AC2: refused with watch: ${watch}, saying so, changing nothing`, () => {
    const s = looking({ watch: 'decide' });
    setWatch(s.r, watch);
    refusesUnchanged(s, new RegExp(`only with watch: decide.*watch is ${watch}`));
  });
}

test('0567 AC2: refused on a high-risk ticket, saying so, changing nothing', () => {
  const s = looking();
  edit(s.r, x => x.replace(/^risk: .*$/m, 'risk: high'));
  refusesUnchanged(s, /0001 is high risk/);
});

test('0567 AC2: a risk that can\'t be read counts as not low', () => {
  const s = looking();
  edit(s.r, x => x.replace(/^risk: .*$/m, 'risk: "constructor"'));
  refusesUnchanged(s, /unknown risk/);
});

test('0567: refused once speck has taken 3 recommendations for the ticket, as the button\'s check is', () => {
  const s = looking();
  edit(s.r, x => x.replace('- A note.', `- A note.\n${notes(3)}`));
  refusesUnchanged(s, /already taken 3 recommendations/);
});

test('0567: a size guard\'s block isn\'t the agent\'s to decide, so raising the limit is never chosen', () => {
  refusesUnchanged(looking({ status: 'blocked', question: RAISE }), /size guard/);
});

test('0567: refused when the build can\'t be resumed from here, changing nothing', () => {
  const s = looking();
  fs.rmSync(s.r.record);
  assert.throws(() => s.a.decide(), /no run record/);
  assert.deepEqual(readActions(s.r.runs), []);
  const b = looking({ record: { session: 'sess-1', pid: process.pid } }); // still running
  refusesUnchanged(b, /still running/);
});

test('0567: refused when the ticket\'s branch isn\'t checked out where its build left it, changing nothing', () => {
  const s = looking();
  s.r.g('stash', '-q');
  s.r.g('checkout', '-q', 'main');
  s.r.g('stash', 'pop', '-q');
  assert.throws(() => s.a.decide(), /isn't checked out/);
  assert.deepEqual(readActions(s.r.runs), []);
});

test('0567: the agent\'s brief offers decide only with watch: decide', () => {
  const brief = decide => foremanBrief({ id: '0001', what: 'x', log: 'y', tail: '', decide });
  assert.ok(brief(true).includes('speck.mjs watch decide 0001'));
  assert.ok(!brief(false).includes('watch decide'));
  const { a } = looking();
  assert.ok(a.starts[0].argv[2].includes('speck.mjs watch decide 0001'));
  const fix = looking({ watch: 'fix' });
  assert.ok(!fix.a.starts[0].argv[2].includes('watch decide'));
});

const view = (r, tickets) => foremanView({ run: { on: true, pid: process.pid }, record: { lock: process.pid }, tickets, agent: agentView(r.runs, tickets), fixing: 'decide' });

test('0567 AC4: a decide doesn\'t count under Needs you, and status says what speck did', () => {
  const { r, a } = looking();
  a.decide();
  const tickets = [T('0001', 'building')], v = view(r, tickets);
  assert.deepEqual(v.agent.asks, []);
  assert.doesNotMatch(v.word, /Needs you/);
  assert.ok(foremanLines(v).some(l => l.includes(`speck went with the recommendation for 0001: ${CHOICE}. Why: A retry fixes it`)), foremanLines(v).join('\n'));
});

test('0567 AC4: an unanswered ask still counts under Needs you', () => {
  const { r, a } = looking();
  a.act('ask', '0001', `Go with ${OPTION}?`, '--why=unsure');
  assert.equal(view(r, [T('0001', 'building')]).word, 'Needs you 1');
});
