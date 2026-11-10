// 0625: the watcher can schedule a ticket's resume for a set time, and a look stopped by a usage limit is tried again.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, gitEnv, fakePage, ROOT } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig, SpeckError } from '../scripts/speck.mjs';
import { foremanAgentQueue, foremanAction, foremanBrief, readActions, readAgentState, agentView } from '../scripts/foreman-agent.mjs';
import { foremanView, foremanLines, stoppedForYou } from '../scripts/foreman.mjs';
import { usageLimitQueue, readLimit, GRACE_MS } from '../scripts/usage-limit.mjs';
import { resumeTime } from '../scripts/resume-at.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
const ASKED = 'Carry on from where you stopped';
const WHY = 'the usage limit resets then';
const START = Date.parse('2026-11-10T11:57:00Z'), DUE = Date.parse('2026-11-10T12:30:00Z'), MIN = 60000;
const DROPPED = /scheduled its build's resume for 12:30 UTC, but the ticket has moved on since, so speck run left it as it is/;
const REFUSED = [
  { type: 'system', subtype: 'init' },
  { type: 'rate_limit_event', rate_limit_info: { status: 'rejected', resetsAt: DUE / 1000, rateLimitType: 'five_hour' } },
  { type: 'result', is_error: true, result: 'You\'ve hit your session limit · resets 12:30pm (UTC)' },
].map(e => JSON.stringify(e)).join('\n');
const OTHER_FAILURE = JSON.stringify({ type: 'result', is_error: true, result: 'The network went away.' });

// A repo whose ticket 0001 stopped, with the watch agent started for it on Claude and still running, and speck run's
// usage limit queue over the same runs folder, on a clock the test moves. `a.end()` ends the agent, its log holding `log`.
function looking({ status = 'building', agent = '' } = {}) {
  const r = blockedRepo({ status });
  const config = path.join(r.dir, 'speck', 'config.yml'); // uncommitted, so it moves no branch
  fs.writeFileSync(config, `${fs.readFileSync(config, 'utf8').replace(/^watch:.*$/m, '').trimEnd()}\nwatch: fix\n${agent ? `watch_agent: ${agent}\n` : ''}`);
  const a = { starts: [], resumed: [], said: [], live: new Set(), running: new Set(), inUse: new Set(), clock: START, status };
  a.limits = usageLimitQueue({ repo: r.dir, runs: () => r.runs, settings: () => ({ cfg: CFG, words: WORDS, max: 1 }), running: a.running, say: m => a.said.push(m), now: () => a.clock,
    statusOf: () => a.status, resumeHint: () => 'Resume it by hand', startBuild: () => {} });
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: WORDS, cfg: CFG, max: 1, running: a.running, ships: { again: () => {} }, now: () => a.clock,
    say: m => a.said.push(m), key: () => 'base head', statusOf: () => a.status, providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], inUse: session => a.inUse.has(session),
    heldAgent: x => a.limits.holds(x), agentLimited: (x, log) => a.limits.agentEnded(x, log),
    startBuild: (id, argv, cwd, session, flags, rec) => { a.resumed.push({ id, argv, rec: JSON.parse(rec(4242)) }); a.running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid, log }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = () => a.q.check([T('0001', a.status)]);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  assert.equal(a.starts.length, 1, 'the agent started');
  a.token = a.starts[0].token;
  a.act = (...args) => foremanAction(r.dir, args, { token: a.token, now: new Date(a.clock) });
  a.schedule = (at = '12:30') => a.act('resume', '0001', ASKED, '--at', at, `--why=${WHY}`);
  a.end = (log = '') => { const last = a.starts.at(-1); fs.writeFileSync(last.log, log); a.live.delete(last.pid); };
  return { r, a };
}
function scheduled() {
  const s = looking();
  s.a.schedule();
  s.a.end();
  s.a.check();
  return s;
}
const refuses = (fn, pattern) => assert.throws(fn, e => e instanceof SpeckError && pattern.test(e.message));
const utc = iso => new Date(iso);

// ---------- AC1 ----------

test('0625 AC1: a time such as 12:30 is UTC today, or tomorrow once it has passed', () => {
  assert.equal(resumeTime('12:30', utc('2026-11-10T11:57:00Z')), DUE);
  assert.equal(resumeTime('12:30', utc('2026-11-10T12:30:00Z')), DUE + 864e5, 'that very minute has passed');
  assert.equal(resumeTime('12:30', utc('2026-11-10T18:00:00Z')), DUE + 864e5);
  assert.equal(resumeTime('12:30', utc('2026-12-31T18:00:00Z')), Date.parse('2027-01-01T12:30:00Z'), 'across a year');
  assert.equal(resumeTime('9:05', utc('2026-11-10T01:00:00Z')), Date.parse('2026-11-10T09:05:00Z'));
});

test('0625 AC1: a full ISO date and time is taken as it says, as UTC when it gives no offset', () => {
  const now = utc('2026-11-10T11:57:00Z');
  assert.equal(resumeTime('2026-11-10T12:30:00Z', now), DUE);
  assert.equal(resumeTime('2026-11-10T13:30:00+01:00', now), DUE);
  assert.equal(resumeTime('2026-11-10T12:30', now), DUE);
  assert.equal(resumeTime('2026-11-10T12:30:00.000Z', now), DUE);
});

test('0625 AC1: a time that can\'t be used is refused in plain words', () => {
  const now = utc('2026-11-10T11:57:00Z');
  for (const bad of ['', 'soon', '25:00', '12:60', '12', '12:30pm', '2026-02-30T12:00:00Z', '2026-13-01T12:00:00Z', '2026-11-10', 'constructor', '__proto__'])
    refuses(() => resumeTime(bad, now), /--at needs a time such as 12:30/);
  refuses(() => resumeTime('2026-11-10T11:00:00Z', now), /has passed/);
  refuses(() => resumeTime('2027-11-10T11:00:00Z', now), /more than 31 days/);
});

test('0625 AC1: speck watch resume --at schedules it, and notes it in the ticket and speck run\'s log', () => {
  const { r, a } = looking();
  const says = a.schedule();
  assert.match(says, /speck run resumes its build at 12:30 UTC/);
  const did = readActions(r.runs)[0];
  assert.deepEqual([did.action, did.text, did.resume_at, did.why], ['resume', ASKED, new Date(DUE).toISOString(), WHY]);
  assert.match(r.ticket(), /I'll resume 0001 at 12:30 UTC: the usage limit resets then\./);
  assert.ok(r.ticket().includes(ASKED), 'the note says what it will do');
  a.running.add('other'); a.end(); a.check();
  assert.equal(a.said.filter(l => l.includes('0001: I\'ll resume it at 12:30 UTC: the usage limit resets then.')).length, 1, a.said.join('\n'));
  a.check();
  assert.equal(a.said.filter(l => l.includes('I\'ll resume it at')).length, 1, 'said once');
});

test('0625 AC1: --at=<time> works too, and the time doesn\'t end up in the instruction', () => {
  const { r, a } = looking();
  a.act('resume', '0001', ASKED, '--at=2026-11-10T12:30:00Z', `--why=${WHY}`);
  const did = readActions(r.runs)[0];
  assert.deepEqual([did.text, did.resume_at], [ASKED, new Date(DUE).toISOString()]);
});

test('0625 AC1: it counts as the run\'s one action', () => {
  const { a } = looking();
  a.schedule();
  refuses(() => a.act('ask', '0001', 'Anything?', '--why=Because'), /already taken its one action/);
  refuses(() => a.schedule('13:00'), /already taken its one action/);
});

test('0625 AC1: a bad --at changes nothing, and --at is only for resume', () => {
  const { r, a } = looking();
  const before = r.ticket();
  refuses(() => a.schedule('soon'), /--at needs a time/);
  refuses(() => a.act('resume', '0001', ASKED, '--at', `--why=${WHY}`), /--at needs a time/);
  refuses(() => a.act('resume', '0001', ASKED, '--at', '12:30', '--at', '13:00', `--why=${WHY}`), /only one --at/);
  refuses(() => a.act('ask', '0001', 'Anything?', '--at', '12:30', `--why=${WHY}`), /--at works only with speck watch resume/);
  assert.equal(r.ticket(), before);
  assert.deepEqual(readActions(r.runs), []);
});

test('0625 AC1: the brief offers --at', () => {
  assert.match(foremanBrief({ id: '0001', what: 'x', log: 'y', tail: '' }), /watch resume 0001 "[^"]*" --at <time>/);
});

// ---------- AC2 ----------

test('0625 AC2: it waits for its time, then resumes the build with the instruction, once', () => {
  const { r, a } = scheduled();
  assert.equal(a.resumed.length, 0, 'not yet');
  a.clock = DUE - 1; a.check();
  assert.equal(a.resumed.length, 0, 'not a moment early');
  a.clock = DUE; a.check();
  assert.equal(a.resumed.length, 1);
  assert.ok(a.resumed[0].argv.find(w => w.includes(ASKED)), a.resumed[0].argv.join(' '));
  assert.equal(a.resumed[0].rec.session, 'sess-1');
  assert.deepEqual(readAgentState(r.runs).resumes, []);
  a.running.clear(); a.check();
  assert.equal(a.resumed.length, 1, 'once');
});

test('0625 AC2: past its time it still waits for a build slot', () => {
  const { r, a } = scheduled();
  a.running.add('other');
  a.clock = DUE + MIN; a.check();
  assert.equal(a.resumed.length, 0);
  assert.equal(readAgentState(r.runs).resumes.length, 1);
  a.running.clear(); a.check();
  assert.equal(a.resumed.length, 1);
});

test('0625 AC2: a scheduled resume is kept while speck run is off, as its record is on disk', () => {
  const { r } = scheduled();
  assert.equal(readAgentState(r.runs).resumes[0].at, new Date(DUE).toISOString());
});

test('0625 AC2: one whose record holds an unreadable time isn\'t left waiting for ever', () => {
  const { r, a } = scheduled();
  const file = path.join(r.runs, 'run.foreman-agent.json'), kept = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ ...kept, resumes: kept.resumes.map(x => ({ ...x, at: 'soon' })) }));
  a.check();
  assert.equal(a.resumed.length, 1);
});

test('0625 AC3: a record holding a time that isn\'t text doesn\'t break speck status', () => {
  const { r } = scheduled();
  const file = path.join(r.runs, 'run.foreman-agent.json'), kept = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ ...kept, resumes: kept.resumes.map(x => ({ ...x, at: 12 })) }));
  assert.ok(!statusLines(r.runs).some(l => l.includes('will resume')));
});

for (const [name, move] of [
  ['its ticket has another status', s => { s.a.status = 'reviewing'; }],
  ['its branch has a new commit', s => { s.r.g('commit', '-q', '--allow-empty', '-m', 'carried on by hand'); }],
  ['its build has another session', s => { fs.writeFileSync(s.r.record, JSON.stringify({ ...JSON.parse(fs.readFileSync(s.r.record, 'utf8')), session: 'sess-2' })); }],
  ['its build\'s session is in use', s => { s.a.inUse.add('sess-1'); }],
])
  test(`0625 AC2: it's dropped, and said once, once ${name}`, () => {
    const s = scheduled();
    s.a.said.length = 0;
    move(s);
    s.a.clock = DUE; s.a.check(); s.a.check();
    assert.equal(s.a.resumed.length, 0, 'not resumed');
    assert.deepEqual(readAgentState(s.r.runs).resumes, [], 'dropped');
    assert.equal(s.a.said.filter(l => DROPPED.test(l)).length, 1, s.a.said.join('\n'));
  });

// ---------- AC3 ----------

const statusLines = (runs, status = 'building') => {
  const tickets = [T('0001', status)];
  return foremanLines(foremanView({ run: { on: true, pid: 1 }, record: { lock: 1, building: [], ready: [] }, tickets, fixing: 'fix', agent: agentView(runs, tickets) }));
};

test('0625 AC3: speck status says which resumes are scheduled and when, until it runs', () => {
  const { r, a } = scheduled();
  assert.ok(statusLines(r.runs).some(l => l.includes('speck will resume 0001 at 2026-11-10 12:30 UTC: the usage limit resets then')), statusLines(r.runs).join('\n'));
  a.clock = DUE; a.check();
  assert.ok(!statusLines(r.runs).some(l => l.includes('will resume')), 'gone once it has run');
});

test('0625 AC3: speck status stops saying so once it\'s dropped', () => {
  const { r, a } = scheduled();
  a.inUse.add('sess-1'); a.check();
  assert.ok(!statusLines(r.runs).some(l => l.includes('will resume')));
});

test('0625 AC3: its action reads as scheduled, not as already resumed', () => {
  const { r } = scheduled();
  const did = agentView(r.runs, [T('0001', 'building')]).did[0];
  assert.equal(did.did, 'scheduled its build\'s resume at 2026-11-10 12:30 UTC');
});

test('0625 AC3: a stopped build with a resume scheduled doesn\'t count as needing you', () => {
  const { r } = scheduled();
  const t = T('0001', 'building', { build_exit: { code: 1 } });
  assert.equal(stoppedForYou(t, { on: true, fixing: 'fix', agent: agentView(r.runs, [t]) }), false);
});

function popPage(scheduledList) {
  const made = n => { n.focus = () => {}; n.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0 }); };
  const board = { tickets: [], ideas: [], resume_command: '', run: { on: true, pid: 4242 }, run_log: '1', foreman: { word: 'Idle', tone: 'idle', agent: { running: null, waiting: [], did: [], asks: [], scheduled: scheduledList } } };
  const p = fakePage([], { scrollX: 0, scrollY: 0, scrollTo() {}, fetch: async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? { lines: [] } : board) }) }, { made });
  for (const id of ['foreman', 'run']) made(p.byId(id));
  p.document.documentElement = { dataset: {}, classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  return p;
}
async function pipelineLog(list) {
  const p = popPage(list);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p.all(p.byId('foreman')).filter(n => (n.className || '').split(' ').includes('log-scheduled'));
}

test('0625 AC3: the Pipeline log says which resumes are scheduled and when, soonest first', async () => {
  const [box] = await pipelineLog([
    { id: '0002', at: '2026-11-10T14:00:00.000Z', text: 'Go on', why: 'the outage ends then' },
    { id: '0001', at: '2026-11-10T12:30:00.000Z', text: ASKED, why: WHY },
  ]);
  assert.ok(box && !box.hidden, 'shown');
  assert.deepEqual(box.children.map(n => n.textContent), [
    '0001 resumes at 2026-11-10 12:30 UTC: the usage limit resets then.',
    '0002 resumes at 2026-11-10 14:00 UTC: the outage ends then.',
  ]);
});

test('0625 AC3: with none scheduled, the Pipeline log shows no list', async () => {
  const [box] = await pipelineLog([]);
  assert.ok(!box || box.hidden, 'nothing to show');
});

// ---------- AC4 ----------

test('0625 AC4: a look stopped by the usage limit isn\'t counted, and the limit is recorded', () => {
  const { r, a } = looking();
  a.end(REFUSED); a.check();
  assert.ok(!a.said.some(l => /took no action/.test(l)), a.said.join('\n'));
  assert.ok(a.said.some(l => l.includes('0001: The usage limit stopped me looking into it, so I\'ll look again once it has reset.')), a.said.join('\n'));
  assert.equal(Date.parse(readLimit(r.runs).resets), DUE);
  const s = readAgentState(r.runs);
  assert.equal(s.tried['0001'], undefined, 'not counted as a look');
  assert.deepEqual(s.queue.map(q => [q.id, q.what]), [['0001', 'its build ended']]);
  assert.equal(s.running, null);
});

test('0625 AC4: it looks again once the limit has reset, and not before', () => {
  const { a } = looking();
  a.end(REFUSED); a.check();
  a.clock = DUE; a.check();
  assert.equal(a.starts.length, 1, 'still held');
  a.clock = DUE + GRACE_MS; a.check();
  assert.equal(a.starts.length, 2, 'looked again');
});

test('0625 AC4: a second look stopped by the limit is waited out the same way', () => {
  const { a } = looking();
  a.end(REFUSED); a.check();
  a.clock = DUE + GRACE_MS; a.check();
  a.end(REFUSED); a.check(); // its reset time is past now, so speck run tries again in 30 minutes
  assert.equal(a.starts.length, 2);
  a.clock += 30 * MIN + 1; a.check();
  assert.equal(a.starts.length, 3);
});

test('0625 AC4: a look that ended any other way is noted as today', () => {
  const { r, a } = looking();
  a.end(OTHER_FAILURE); a.check();
  assert.ok(a.said.some(l => /took no action/.test(l)), a.said.join('\n'));
  assert.equal(readLimit(r.runs), null);
  assert.equal(readAgentState(r.runs).queue.length, 0);
});

test('0625 AC4: a look that took its action before the limit stands', () => {
  const { r, a } = looking();
  a.act('ask', '0001', 'Anything?', '--why=Because');
  a.end(REFUSED); a.check();
  assert.equal(readAgentState(r.runs).queue.length, 0);
  assert.equal(readAgentState(r.runs).tried['0001'], 'base head');
});

test('0625 AC4: another agent\'s log isn\'t read for Claude\'s limit', () => {
  const { r, a } = looking({ agent: 'codex' });
  a.end(REFUSED); a.check();
  assert.equal(readLimit(r.runs), null);
  assert.ok(a.said.some(l => /took no action/.test(l)), a.said.join('\n'));
});

test('0625 AC4: speck run gives the watcher its usage limit check', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'scripts', 'run.mjs'), 'utf8'), /foremanAgentQueue\(\{[^\n]*agentLimited: \(agent, log\) => limits\.agentEnded\(agent, log\)/);
});

// ---------- AC5 ----------

test('0625 AC5: the docs name the --at option', () => {
  assert.ok(fs.readFileSync(path.join(ROOT, 'docs/brief.md'), 'utf8').includes('`resume <id> "<instruction>" [--at <time>]`'));
  assert.ok(fs.readFileSync(path.join(ROOT, 'skills/speck-watch/SKILL.md'), 'utf8').includes('--at 12:30'));
});
