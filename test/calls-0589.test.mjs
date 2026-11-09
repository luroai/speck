import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, gitEnv } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig } from '../scripts/speck.mjs';
import { questionFacts } from '../scripts/question-facts.mjs';
import { goWith, goWithQueue, callsOf, newBuildKeeps } from '../scripts/go-with.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { foremanAction } from '../scripts/foreman-agent.mjs';
import { withCalls } from '../scripts/foreman-took.mjs';

Object.assign(process.env, gitEnv); // goWith and speck watch commit in this process

// ---------- 0589: keep the whole question with each call speck makes ----------

const ASKED = 'Should the old test be removed or kept and fixed?';
const CHOSEN = 'Keep the test and fix it', OTHER = 'Remove the test', THIRD = 'Skip it for now';
const FACTS = `Recommended: ${CHOSEN}\nOther options: ${OTHER}; ${THIRD}\nChanges what you'd notice: no\nClear winner: yes`;
const QUESTION = `${ASKED}\n\n${FACTS}`;
const NOW = new Date('2026-11-09T14:00:30.000Z');
const recordOf = r => JSON.parse(fs.readFileSync(r.record, 'utf8'));
const CALL = { question: ASKED, option: CHOSEN, other_options: [OTHER, THIRD], at: NOW.toISOString() };

function setWatch(r, value) { // uncommitted, so it moves no branch
  const file = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, /^watch:/m.test(text) ? text.replace(/^watch:.*$/m, `watch: ${value}`) : `${text.trimEnd()}\nwatch: ${value}\n`);
}
function watched(watch, options = {}) { const r = blockedRepo({ question: QUESTION, ...options }); setWatch(r, watch); return r; }
const take = (r, now = NOW) => goWith(r.dir, '0001', now, { by: 'foreman' });
// The agent speck run starts for ticket 0001, as it stands while that agent runs, going with `option`.
function agentDecides(r, option, status = 'blocked') {
  fs.writeFileSync(path.join(r.runs, 'run.foreman-agent.json'), JSON.stringify({ running: { token: 'tok', id: '0001', key: 'k', status, started: NOW.toISOString(), pid: 1 }, waiting: [], resumes: [], seen: {} }));
  return foremanAction(r.dir, ['decide', '0001', option, '--why=It is the safer one'], { token: 'tok', now: NOW });
}
const noted = (option, at) => `- Went with the recommendation: ${option} (chosen by speck, as watch is fix, ${at.slice(0, 10)} ${at.slice(11, 16)} UTC).`;
function withNote(r, line) { fs.writeFileSync(r.file, r.ticket().replace('- A note.', `- A note.\n${line}`)); r.g('commit', '-qam', 'noted'); }
const lastDay = () => new Date(Date.now() - 864e5).toISOString();

test('0589 AC1: the build skill asks for an Other options line beside Recommended', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  assert.match(skill, /^ *Recommended: <[^\n]*\n *Other options: <[^\n]*>$/m);
});

test('0589 AC1: speck reads Other options as it reads Recommended, out of the question, the last one counting', () => {
  const f = questionFacts(QUESTION.split('\n'));
  assert.equal(f.question, `${ASKED}\n`);
  assert.equal(f.recommendation, CHOSEN);
  assert.deepEqual(f.otherOptions, [OTHER, THIRD]);
  assert.deepEqual(questionFacts([`- Other options:  A ;B; ;A`]).otherOptions, ['A', 'B'], 'trimmed, without blanks or repeats, and as a list item');
  assert.deepEqual(questionFacts(['Other options: A', 'other options: B']).otherOptions, ['B']);
  assert.deepEqual(questionFacts(['Other options: None']).otherOptions, []);
  assert.equal(questionFacts(['A or B?']).otherOptions, undefined);
  const blank = questionFacts(['Other options:', 'Other options: ;']);
  assert.equal(blank.otherOptions, undefined);
  assert.equal(blank.question, 'Other options:\nOther options: ;', 'a line it can\'t read stays in the question');
  assert.deepEqual(questionFacts(['Other options: constructor; __proto__']).otherOptions, ['constructor', '__proto__']);
});

test('0589 AC1: a blocked ticket gives its other options on the board, or null with none', () => {
  const t = statusData(blockedRepo({ question: QUESTION }).dir).tickets.find(x => x.id === '0001');
  assert.deepEqual(t.blocked_other_options, [OTHER, THIRD]);
  assert.equal(t.blocked_question, ASKED);
  assert.equal(statusData(blockedRepo().dir).tickets.find(x => x.id === '0001').blocked_other_options, null);
});

test('0589 AC2: speck taking a recommendation with watch: fix keeps the whole call in the run record', () => {
  const r = watched('fix');
  assert.equal(take(r).status, 200);
  assert.deepEqual(recordOf(r).calls, [CALL]);
  assert.equal(recordOf(r).go_with.option, CHOSEN, 'and the choice still waits for speck run');
});

test('0589 AC2: so does taking one through speck run\'s check, with watch: decide', () => {
  const r = watched('decide');
  const q = foremanFixQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), say: () => {} });
  q.check(statusData(r.dir).tickets);
  const [call] = recordOf(r).calls;
  assert.deepEqual({ ...call, at: NOW.toISOString() }, CALL);
  assert.ok(Number.isFinite(Date.parse(call.at)));
});

test('0589 AC2: so does a size guard\'s split', () => {
  const r = watched('fix', { question: `Over the limit. Split it or raise it?\n\nRecommended: Split it\nOther options: Raise the limit\nChanges what you'd notice: yes\nClear winner: no\nSize guard: yes` });
  assert.equal(take(r).status, 200);
  assert.deepEqual(recordOf(r).calls, [{ question: 'Over the limit. Split it or raise it?', option: 'Split it', other_options: ['Raise the limit'], at: NOW.toISOString() }]);
  assert.equal(recordOf(r).go_with.split, true);
});

test('0589 AC2: your own press of the button isn\'t a call speck made', () => {
  const r = watched('fix');
  assert.equal(goWith(r.dir, '0001', NOW).status, 200);
  assert.equal(recordOf(r).calls, undefined);
});

test('0589 AC2: a refused choice keeps nothing', () => {
  const r = watched('fix', { question: `${ASKED}\nOther options: ${OTHER}` });
  const before = fs.readFileSync(r.record, 'utf8');
  assert.equal(take(r).status, 409);
  assert.equal(fs.readFileSync(r.record, 'utf8'), before);
});

test('0589 AC2: the watch agent\'s decide keeps the call in the run record', () => {
  const r = watched('decide');
  agentDecides(r, CHOSEN);
  assert.deepEqual(recordOf(r).calls, [CALL]);
});

test('0589 AC2: an agent choosing an option its build didn\'t recommend counts the recommended one as not chosen', () => {
  const r = watched('decide');
  agentDecides(r, OTHER);
  assert.deepEqual(recordOf(r).calls, [{ question: ASKED, option: OTHER, other_options: [CHOSEN, THIRD], at: NOW.toISOString() }]);
});

test('0589 AC2: an agent deciding on a ticket that isn\'t blocked keeps no old question', () => {
  const r = watched('decide', { status: 'building' });
  agentDecides(r, 'Carry on', 'building');
  assert.deepEqual(recordOf(r).calls, [{ question: null, option: 'Carry on', other_options: [], at: NOW.toISOString() }]);
});

test('0589 AC2: an agent\'s decide still stands when its run record can\'t be saved', () => {
  const r = watched('decide');
  const realRename = fs.renameSync;
  fs.renameSync = () => { throw new Error('disk full'); };
  try { assert.match(agentDecides(r, CHOSEN), /Noted in 0001's Notes/); } finally { fs.renameSync = realRename; }
  assert.equal(recordOf(r).calls, undefined);
  assert.match(r.ticket(), /Went with the recommendation/);
});

test('0589 AC2: later calls add to the earlier ones, and a run record\'s unusable calls are dropped', () => {
  const r = watched('fix');
  const earlier = { question: 'Before?', option: 'A', other_options: ['B'], at: '2026-11-01T10:00:00.000Z' };
  fs.writeFileSync(r.record, JSON.stringify({ ...recordOf(r), calls: [earlier, null, 'x', [], { option: 7, at: 'y' }, { option: 'no time' }] }));
  assert.equal(take(r).status, 200);
  assert.deepEqual(recordOf(r).calls, [earlier, CALL]);
  for (const bad of ['nope', { 0: 1 }, null]) {
    fs.writeFileSync(r.record, JSON.stringify({ ...recordOf(r), calls: bad }));
    assert.deepEqual(callsOf(r.runs, '0001'), []);
  }
  assert.deepEqual(callsOf(r.runs, 'nothing-here'), []);
  assert.deepEqual(callsOf(r.runs, '../0001'), []);
});

test('0589 AC2: a call outlasts the build resuming, and a new build of the ticket', () => {
  const r = watched('fix');
  assert.equal(take(r).status, 200);
  const started = [], running = new Set();
  const q = goWithQueue({ repo: r.dir, cfg: { base_branch: 'main', branch_prefix: 'speck/' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running,
    startBuild: (id, argv, cwd, session, flags, record) => { started.push(JSON.parse(record(4242))); running.add(id); },
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1, 'resumed');
  assert.deepEqual(started[0].calls, [CALL]);
  assert.deepEqual(newBuildKeeps(r.runs, '0001').calls, [CALL]);
  assert.deepEqual(newBuildKeeps(r.runs, '0002'), {}, 'nothing to keep for a ticket with no record');
});

test('0589 AC3: speck status --json lists each call\'s ticket, question, chosen option, other options, time and criteria change', () => {
  const r = watched('fix');
  const at = lastDay();
  assert.equal(take(r, new Date(at)).status, 200);
  const out = r.run('status', '--json');
  assert.equal(out.status, 0, out.stderr);
  const { decided } = JSON.parse(out.stdout);
  assert.equal(decided.length, 1);
  const { title, ...rest } = decided[0];
  assert.equal(typeof title, 'string');
  assert.deepEqual(rest, { id: '0001', question: ASKED, option: CHOSEN, other_options: [OTHER, THIRD], at: new Date(`${at.slice(0, 16)}:00.000Z`).toISOString(), criteria_changed: false });
});

test('0589 AC4: a call made before this still shows, with the question and other options blank', () => {
  const r = blockedRepo({ question: QUESTION, status: 'building' });
  withNote(r, noted('An old choice', lastDay()));
  const [d] = statusData(r.dir).decided;
  assert.equal(d.option, 'An old choice');
  assert.equal(d.question, null);
  assert.deepEqual(d.other_options, []);
});

test('0589 AC4: a Notes line only takes the kept call it matches, once', () => {
  const at = '2026-11-09T14:00:00.000Z', d = o => ({ id: '0001', title: 'T', option: o, at, criteria_changed: false });
  const calls = [{ question: 'Q', option: 'A', other_options: ['B'], at: '2026-11-09T14:00:45.000Z' }, { question: 'other day', option: 'C', other_options: [], at: '2026-11-08T14:00:00.000Z' }];
  const rows = withCalls([d('A'), d('A'), d('C')], () => calls);
  assert.deepEqual(rows.map(x => x.question), ['Q', null, null]);
  assert.deepEqual(rows.map(x => x.other_options), [['B'], [], []]);
  assert.equal(calls.length, 2, 'what callsOf gave is left as it was');
});
