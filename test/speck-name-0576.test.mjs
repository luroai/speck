import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakePage, T, click, gitEnv, ROOT, openQueueRows, nowOf, startPanel, stop, freePort, request, CLI } from './support/panel.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { loadConfig, statusData } from '../scripts/speck.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanTicketLines } from '../scripts/foreman-took.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { foremanAgentQueue, foremanAction, agentView } from '../scripts/foreman-agent.mjs';
import { foremanReply } from '../scripts/foreman-answer.mjs';
import { goWith, goWithQueue } from '../scripts/go-with.mjs';

Object.assign(process.env, gitEnv); // goWith and speck watch commit in this process

// ---------- 0576: call speck by the name you chose wherever it speaks ----------

const ON = { on: true, pid: 4242 };
const rec = () => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] } });
const AT = new Date().toISOString();
const AGENT = {
  running: { id: '0002', what: 'its build ended', started: AT }, waiting: [], asks: [{ id: '0003', question: 'Keep it?', at: AT }],
  did: [{ id: '0004', action: 'resume', did: 'resumed its build', text: 'carry on', why: 'it stopped', at: AT }],
};
const TOOK = [T('0005', 'building', { foreman_took: [{ option: 'A', at: AT }] })];
const view = o => foremanView({ run: ON, record: rec(), tickets: TOOK, fixing: 'fix', agent: AGENT, ...o });
const named = (r, name = 'Virgil') => fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), `speck_name: ${name}\nwatch: fix\n`);
const state = (foreman, tickets = [], o = {}) => ({ tickets, ideas: [], resume_command: '', run: ON, foreman, ...o });
const BLOCKED = (id, o = {}) => T(id, 'blocked', { blocked_question: 'A or B?', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_resumable: true, ...o });
const rowOf = (p, id) => p.byId('queue').children.find(n => /\bq\b/.test(n.className) && n.textContent.includes(id));
const SPOKEN = /speck (?:is looking|asks you|resumed|went with|takes)/;

test('0576 AC1: speck status\'s lines say the name for what it looks into, asks, does and took, and what watch has it do', () => {
  const out = foremanLines(view({ name: 'Virgil' })).join('\n');
  for (const said of ['  watch: fix. Virgil takes the recommendation', '  Virgil is looking into 0002: its build ended', '  Virgil asks you about 0003: Keep it?', '  Virgil resumed its build for 0004', '  Virgil went with the recommendation for 0005: A'])
    assert.ok(out.includes(said), `${said}\n${out}`);
  assert.doesNotMatch(out, SPOKEN);
  assert.equal(view({ name: 'Virgil' }).fixing_says.startsWith('fix. Virgil takes'), true);
});

test('0576 AC1: every watch setting that names it says the name', () => {
  for (const fixing of ['off', 'tell', 'fix', 'decide']) {
    assert.match(view({ name: 'Virgil', fixing }).fixing_says, new RegExp(`^${fixing}\\. Virgil `));
    assert.doesNotMatch(view({ name: 'Virgil', fixing }).fixing_says, /\bspeck\b/);
  }
});

test('0576 AC1: a blocked ticket\'s lines say who will take it and who went with it', () => {
  const will = foremanTicketLines({ status: 'blocked', foreman_will: true, blocked_recommendation: 'A' }, 'Q', 'Virgil').join('\n');
  assert.match(will, /→ Virgil will take its recommendation: A/);
  const went = foremanTicketLines({ status: 'building', went_with: { by: 'foreman', option: 'A', at: AT } }, '', 'Virgil').join('\n');
  assert.match(went, /✓ Virgil went with the recommendation: A/);
  const you = foremanTicketLines({ status: 'building', went_with: { by: 'user', option: 'A', at: AT } }, '', 'Virgil').join('\n');
  assert.match(you, /✓ You went with the recommendation: A/);
});

test('0576 AC1: with speck_name unset everything says speck as today', () => {
  const out = foremanLines(view()).join('\n');
  for (const said of ['watch: fix. speck takes', 'speck is looking into 0002', 'speck asks you about 0003', 'speck resumed its build for 0004', 'speck went with the recommendation for 0005']) assert.ok(out.includes(said), said);
  assert.match(foremanTicketLines({ status: 'blocked', foreman_will: true, blocked_recommendation: 'A' }, 'Q').join('\n'), /→ speck will take its recommendation: A/);
});

test('0576 AC1: a real speck status reads the name from speck_name, and an unset one says speck', () => {
  const r = blockedRepo();
  fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), 'watch: fix\n');
  assert.ok(r.run('status').stdout.includes(`→ speck will take its recommendation: ${OPTION}`));
  fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), 'speck_name: Virgil\n');
  const out = r.run('status').stdout;
  assert.ok(out.includes(`→ Virgil will take its recommendation: ${OPTION}`), out);
  assert.ok(out.includes('watch: fix. Virgil takes'), out);
  assert.equal(goWith(r.dir, '0001', new Date(), { by: 'foreman' }).status, 200);
  const after = r.run('status').stdout;
  assert.ok(after.includes(`✓ Virgil went with the recommendation: ${OPTION}`), after);
  assert.ok(after.includes(`  Virgil went with the recommendation for 0001: ${OPTION}`), after);
});

// A repo whose ticket 0001 the Foreman agent has asked about, with the agent ended. `said` is speck run's log.
function asked(status = 'building', name = 'Virgil') {
  const r = blockedRepo({ status });
  if (name) named(r, name);
  const starts = [], said = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'],
    cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again: () => {} }, say: m => said.push(m), startBuild: () => {},
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  return { r, q, said, starts, end: () => live.delete(starts[starts.length - 1].pid) };
}

test('0576 AC1: the moved-on sentence under a question takes the name it\'s given', () => {
  const { r, q, starts, end } = asked();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  q.check([T('0001', 'building')]);
  foremanAction(r.dir, ['ask', '0001', 'Keep it?', '--why=it stopped'], { token: starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  end();
  q.check([T('0001', 'building')]);
  const did = path.join(r.runs, 'run.foreman-did.jsonl');
  fs.appendFileSync(did, `${JSON.stringify({ run: 'later', id: '0001', action: 'resume', text: 'go on', why: 'w', at: '2026-10-18T15:00:00Z', status: 'building' })}\n`);
  const view = (...name) => agentView(r.runs, [T('0001', 'building')], ...name).did.find(d => d.action === 'ask').outcome;
  assert.equal(view('Virgil'), 'No longer waiting: Virgil has done something else about 0001 since.');
  assert.equal(view(), 'No longer waiting: speck has done something else about 0001 since.');
});

test('0576 AC2: a blocked card says the name when it will take the recommendation, in its status words too', async () => {
  const p = fakePage([state(view({ name: 'Virgil', agent: undefined, tickets: [] }), [BLOCKED('0001', { foreman_will: true })])]);
  await p.settle();
  await openQueueRows(p);
  const row = rowOf(p, '0001');
  assert.ok(row.textContent.includes(`Virgil will take its recommendation: ${OPTION}`), row.textContent);
  assert.equal(nowOf(row).textContent, 'Virgil will answer');
  assert.equal(nowOf(row).title, 'Blocked · Virgil will take its recommendation');
  assert.doesNotMatch(row.textContent, /speck will/);
});

test('0576 AC2: the card that went with a recommendation says the name', async () => {
  const went = { option: OPTION, by: 'foreman', at: AT };
  const p = fakePage([state(view({ name: 'Virgil', agent: undefined, tickets: [] }), [T('0001', 'building', { went_with: went })])]);
  await p.settle();
  await openQueueRows(p);
  assert.ok(rowOf(p, '0001').textContent.includes(`Virgil went with the recommendation: ${OPTION}`), rowOf(p, '0001').textContent);
});

test('0576 AC2: its question and Answer box say the name, and Dismiss asks about it by name', async () => {
  const confirms = [];
  const agent = { running: null, waiting: [], did: [], asks: [{ id: '0001', question: 'Keep it?', at: AT }] };
  const p = fakePage([state(view({ name: 'Virgil', agent, tickets: [] }), [T('0001', 'building')])], { confirm: m => { confirms.push(m); return false; } });
  await p.settle();
  const row = rowOf(p, '0001');
  assert.ok(row.textContent.includes('Virgil asks you: Keep it?'), row.textContent);
  const find = (n, want) => (want(n) ? n : (n.children || []).map(c => find(c, want)).find(Boolean));
  assert.equal(find(row, n => /ask-answer/.test(n.className || '')).attrs['aria-label'], 'Your answer to Virgil\'s question about 0001');
  click(find(row, n => /ask-reply/.test(n.className || '') && n.textContent === 'Dismiss'));
  await p.settle();
  assert.match(confirms[0], /^Dismiss Virgil's question about 0001: "Keep it\?"/);
});

test('0576 AC2: the Decided for you line says the name, and a board without one says speck', async () => {
  const decided = [{ id: '0001', title: 'T', option: 'A', at: AT, criteria_changed: false }];
  const p = fakePage([state(view({ name: 'Virgil', agent: undefined, tickets: [] }), [], { decided })]);
  await p.settle();
  assert.equal(p.byId('decided-open').textContent, 'Virgil decided 1 for you in the last 7 days');
  const old = fakePage([state(view({ agent: undefined, tickets: [] }), [BLOCKED('0001', { foreman_will: true })], { decided })]);
  await old.settle();
  assert.equal(old.byId('decided-open').textContent, 'speck decided 1 for you in the last 7 days');
  await openQueueRows(old);
  assert.equal(nowOf(rowOf(old, '0001')).textContent, 'speck will answer');
});

test('0576 AC2: renaming it redraws a card already showing, and anything that isn\'t a name says speck', async () => {
  const tickets = [BLOCKED('0001', { foreman_will: true })];
  const p = fakePage([state(view({ name: 'Virgil', agent: undefined, tickets: [] }), tickets), state(view({ name: 'Beatrice', agent: undefined, tickets: [] }), tickets)]);
  await p.settle();
  assert.ok(rowOf(p, '0001').textContent.includes('Virgil will answer'), rowOf(p, '0001').textContent); // a closed card, as an open one's log would take the next board
  p.timers.shift()();
  await p.settle();
  assert.ok(rowOf(p, '0001').textContent.includes('Beatrice will answer'), rowOf(p, '0001').textContent);
  for (const name of [undefined, '', 7, null]) assert.equal(foremanLines(view({ name })).some(l => l.includes('speck is looking into 0002')), true, String(name));
});

test('0576 AC2: the real panel sends the name from speck_name', async () => {
  const r = blockedRepo();
  named(r);
  const p = await startPanel(r.dir, ['--port', String(await freePort())], CLI, { SPECK_FOREMAN_RUN: '' });
  try {
    const body = JSON.parse((await request(p.port, { pathName: '/api/state' })).body);
    assert.equal(body.foreman.name, 'Virgil');
    assert.match(body.foreman.fixing_says, /^fix\. Virgil takes/);
  } finally { await stop(p); }
});

test('0576 AC3: speck run\'s log says the name for what it looks into, does and asks', () => {
  const { r, q, said, starts, end } = asked();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  assert.equal(said[0], '0001: Virgil will look into it, as watch is fix: its build ended');
  q.check([T('0001', 'building')]);
  assert.ok(said.some(m => /^0001: Virgil \(.+\) is looking into it\./.test(m)), said.join('\n'));
  end();
  q.check([T('0001', 'building')]);
  assert.ok(said.some(m => m.startsWith('0001: Virgil looked into it and took no action.')), said.join('\n'));
  assert.ok(starts.length);
  assert.ok(!said.some(m => /: speck (?:will|looked|\()/.test(m)), said.join('\n'));
});

test('0576 AC3: its actions, and an unset name, in the log', () => {
  const { r, q, said, starts, end } = asked();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  q.check([T('0001', 'building')]);
  foremanAction(r.dir, ['ask', '0001', 'Keep it?', '--why=it stopped'], { token: starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  end();
  q.check([T('0001', 'building')]);
  assert.ok(said.some(m => m === '0001: Virgil asked you: Keep it? (it stopped)'), said.join('\n'));
  const plain = asked('building', '');
  fs.appendFileSync(path.join(plain.r.dir, 'speck', 'config.yml'), 'watch: fix\n');
  plain.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  assert.equal(plain.said[0], '0001: speck will look into it, as watch is fix: its build ended');
});

test('0576 AC3: taking a recommendation, or not, says the name in the log', () => {
  const r = blockedRepo(), said = [];
  named(r);
  const fixes = foremanFixQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), say: m => said.push(m) });
  fixes.check(statusData(r.dir).tickets);
  assert.ok(said.some(m => m.startsWith('0001: Virgil went with its recommendation (')), said.join('\n'));
  const refused = [];
  foremanFixQueue({ repo: r.dir, running: new Set(), readConfig: () => ({ watch: 'fix', speck_name: 'Virgil' }), say: m => refused.push(m), goWith: () => ({ status: 409, body: { error: 'no' } }) })
    .check([BLOCKED('0002', { risk: 'low' })]);
  assert.deepEqual(refused, ['0002: Virgil didn\'t take its recommendation: no']);
});

test('0576 AC3: the resume log line says the name when it went with a recommendation', () => {
  const r = blockedRepo();
  named(r);
  assert.equal(goWith(r.dir, '0001', new Date(), { by: 'foreman' }).status, 200);
  const logged = [], was = console.log;
  console.log = m => logged.push(m);
  try {
    goWithQueue({ cfg: loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running: new Set(), startBuild: () => {}, saveRecord: (f, v) => fs.writeFileSync(f, JSON.stringify(v)), runs: () => r.runs, repo: r.dir })
      .check([{ id: '0001', status: 'building' }]);
  } finally { console.log = was; }
  assert.ok(logged.some(m => /^0001: Virgil went with its recommendation/.test(m)), logged.join('\n'));
});

test('0576 AC2: refusing your reply speaks of its question by name', () => {
  const { r } = asked();
  assert.throws(() => foremanReply(r.dir, 'dismiss', '0001', '', { env: {} }), /Virgil hasn't asked you anything about 0001/);
});

test('0576 AC4: the Notes lines keep speck, however it\'s called', () => {
  const r = blockedRepo();
  named(r);
  assert.equal(goWith(r.dir, '0001', new Date(), { by: 'foreman' }).status, 200);
  assert.match(r.ticket(), /\(chosen by speck, as watch is fix, /);
  assert.doesNotMatch(r.ticket(), /chosen by Virgil/);
  assert.equal(statusData(r.dir).tickets.find(t => t.id === '0001').went_with.by, 'foreman', 'still read as its own choice');
});

test('0576 AC4: an action noted in a ticket, its commands and the panel\'s title stay speck\'s', () => {
  const { r, q, starts, end } = asked();
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  q.check([T('0001', 'building')]);
  foremanAction(r.dir, ['ask', '0001', 'Keep it?', '--why=it stopped'], { token: starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  end();
  assert.match(fs.readFileSync(r.file, 'utf8'), /^- speck \(.*\) asked you/m);
  const lines = foremanLines(view({ name: 'Virgil' })).join('\n');
  assert.ok(lines.includes('Answer with speck answer 0003 "<your answer>", or dismiss it with speck dismiss 0003'), lines);
  assert.match(lines, /^SPECK: /);
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'panel.html'), 'utf8'), /<title>speck · control panel<\/title>/);
});
