import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fakePage, T, panelRepo, gitEnv, ROOT, click } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig, parseYaml } from '../scripts/speck.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings } from '../scripts/settings.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { startRun, stopRun, until, runRepo } from './support/run.mjs';
import { CLI } from './support/panel.mjs';
import { foremanAgentQueue, foremanAction, foremanArgv, foremanAgentOf, buildStuck, agentView, readAgentState, codeKey } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // speck foreman commits in this process

// ---------- 0287: let the Foreman look into work that stops for no known reason ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const ON = { on: true, pid: process.pid };

// The Foreman agent's queue in a repo, with a stand-in for starting the agent: each start is kept, and its agent runs
// until the test ends it with end(). Builds it resumes are kept too.
function agents(r, { fixing = 'fix', max = 1, cfg = {}, persist, withToken = () => [] } = {}) {
  const starts = [], resumed = [], said = [], again = [], running = new Set(), live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), foreman_fixing: fixing, ...cfg }),
    words: WORDS, cfg: CFG, max, running, ships: { again: id => again.push(id) }, say: m => said.push(m),
    startBuild: (id, argv, cwd, session, flags, record) => { resumed.push({ id, argv, rec: JSON.parse(record(4242)) }); running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ argv, cwd, log, token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken, ...(persist ? { persist } : {}) });
  return { q, starts, resumed, said, again, running, end: s => live.delete(s.pid), check: (tickets = [T('0001', 'building')]) => q.check(tickets) };
}
const brief = s => s.argv[2]; // claude -p <brief>
const logWith = (r, lines) => { const f = path.join(r.runs, '0001.log'); fs.writeFileSync(f, `${lines.join('\n')}\n`); return f; };
const act = (r, token, ...args) => foremanAction(r.dir, args, { token, now: new Date('2026-10-18T14:00:00Z') });

test('0287 AC1: with fix, a stop speck has no steps for starts the Foreman agent with a brief naming the ticket, what happened, the end of its log and what it may do', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  const log = logWith(r, ['early line', ...Array.from({ length: 20 }, (_, i) => `line ${i}`), 'the last thing it said']);
  a.q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log });
  a.check();
  assert.equal(a.starts.length, 1);
  const b = brief(a.starts[0]);
  assert.match(b, /ticket 0001/);
  assert.match(b, /its build ended with the ticket still building/);
  assert.match(b, /the last thing it said/);
  assert.match(b, /speck\/\.cache\/runs\/0001\.log/);
  assert.doesNotMatch(b, /early line/, 'only the last lines');
  for (const action of ['resume 0001', 'reship 0001', 'fix 0001', 'ask 0001']) assert.ok(b.includes(`speck.mjs foreman ${action}`), action);
  assert.match(b, /Never set a ticket ready, approve work, ship anything yourself/);
  assert.match(b, /speck-foreman/);
  assert.equal(a.starts[0].cwd, r.dir);
});

test('0287 AC1: with tell or off, nothing starts the Foreman agent', () => {
  for (const fixing of ['tell', 'off']) {
    const r = blockedRepo({ status: 'building' }), a = agents(r, { fixing });
    a.q.stuck({ id: '0001', what: 'its ship was refused: x', log: '' });
    a.check();
    assert.equal(a.starts.length, 0, fixing);
  }
});

test('0287 AC1: a build that ends with its ticket neither approved nor blocked is a stop for the Foreman', () => {
  for (const s of ['building', 'reviewing', 'ready']) assert.equal(typeof buildStuck(s), 'string', s);
  for (const s of ['approved', 'blocked', 'done', 'cancelled', null]) assert.equal(buildStuck(s), null, String(s));
});

test('0287 AC1: the ship queue gives the Foreman a refusal it has no hand-back for, and not one it hands back', () => {
  const r = blockedRepo({ status: 'approved' });
  const stuck = [], backs = [], launches = [];
  const q = shipQueue(r.dir, CFG, { say: () => {}, launch: (repo, id, log, done) => launches.push(done), handBack: h => backs.push(h), stuck: x => stuck.push(x) });
  const t = [{ id: '0001', status: 'approved', auto_ship: true, type: '', approved: '2026-10-18T10:00:00Z', build_running: false }];
  q.check(t);
  launches[0](13); // a conflict: handed back
  assert.equal(stuck.length, 0);
  assert.equal(backs.length, 1);
  q.again('0001'); q.check(t);
  launches[1](1);
  assert.equal(stuck.length, 1);
  assert.equal(stuck[0].id, '0001');
  assert.match(stuck[0].what, /its ship was refused/);
  assert.match(stuck[0].log, /0001\.ship\.log$/);
});

test('0287 AC2: the ship queue ships again once when the Foreman asks, and its notes alone aren\'t a new commit', () => {
  const r = blockedRepo({ status: 'approved' }), launches = [];
  const q = shipQueue(r.dir, CFG, { say: () => {}, launch: (repo, id, log, done) => launches.push(done) });
  const t = [{ id: '0001', status: 'approved', auto_ship: true, type: '', approved: '2026-10-18T10:00:00Z', build_running: false }];
  q.check(t); launches[0](1);
  fs.appendFileSync(r.file, '\nA note.\n');
  r.g('commit', '-qam', 'speck(0001): Foreman: ask');
  q.check(t); q.check(t);
  assert.equal(launches.length, 1, 'the Foreman\'s own commit doesn\'t ship it again');
  q.again('0001');
  q.check(t);
  assert.equal(launches.length, 2, 'shipped again once');
  launches[1](1);
  q.check(t);
  assert.equal(launches.length, 2, 'only once');
});

test('0287 AC2: speck foreman takes one action, only from the agent speck run started, for its own ticket', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  const token = a.starts[0].token;
  assert.throws(() => act(r, undefined, 'ask', '0001', 'Which?', '--why=x'), /Only the Foreman agent speck run starts/);
  assert.throws(() => act(r, 'another', 'ask', '0001', 'Which?', '--why=x'), /Only the Foreman agent/);
  assert.throws(() => act(r, token, 'ask', '0001', 'Which?'), /--why/);
  assert.throws(() => act(r, token, 'approve', '0001', '--why=x'), /Usage: speck foreman/);
  assert.throws(() => act(r, token, 'reship', '0001', '--why=x'), /isn't an approved ticket that auto_ship covers/);
  const before = r.head();
  act(r, token, 'ask', '0001', 'Should it keep the old test?', '--why=the build stopped on a choice');
  assert.notEqual(r.head(), before);
  assert.throws(() => act(r, token, 'resume', '0001', 'carry on', '--why=x'), /already taken its one action/);
  assert.match(r.ticket(), /^status: building$/m, 'never changes the ticket\'s status');
});

test('0287 AC2: a resume the Foreman asks for resumes the build\'s own session with its instruction once the agent has ended', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  act(r, a.starts[0].token, 'resume', '0001', 'Run the tests again and carry on.', '--why=the tests were stopped partway');
  a.check();
  assert.equal(a.resumed.length, 0, 'not while the agent is still running');
  a.end(a.starts[0]);
  a.check();
  assert.equal(a.resumed.length, 1);
  assert.ok(a.resumed[0].argv.includes('--resume') && a.resumed[0].argv.includes('sess-1'));
  assert.ok(a.resumed[0].argv.some(w => w.includes('Run the tests again and carry on.')));
  assert.equal(Object.hasOwn(a.resumed[0].rec, 'exited'), false);
  a.check();
  assert.equal(a.resumed.length, 1, 'once');
});

test('0287 AC2: speck foreman fix makes a draft fix ticket and leaves it a draft', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  r.g('checkout', '-q', 'main'); // the ticket's branch in its own worktree, as builds keep it
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0287-')), 'wt');
  r.g('worktree', 'add', '-q', wt, 'speck/0001-export-bookings');
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  const out = act(r, a.starts[0].token, 'fix', '0001', 'Mend the broken export test', '--why=the export test fails on main');
  const id = out.match(/fix ticket (\d+)/)[1];
  const file = fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).find(f => f.startsWith(`${id}-`));
  const text = fs.readFileSync(path.join(r.dir, 'speck', 'tickets', file), 'utf8');
  assert.match(text, /^status: draft\b/m);
  assert.match(text, /^type: fix\b/m);
  assert.match(text, /the export test fails on main/);
  assert.equal(r.g('status', '--porcelain', '--', `speck/tickets/${file}`), '', 'committed');
  assert.match(fs.readFileSync(path.join(wt, 'speck', 'tickets', '0001-export-bookings.md'), 'utf8'), new RegExp(`made draft fix ticket ${id}: Mend the broken export test`));
});

test('0287 AC2: speck foreman keeps its note to one line, and refuses a ticket with no Notes before making anything', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.check();
  act(r, a.starts[0].token, 'ask', '0001', 'Keep it?\n## Heading', '--why=because\n\nit stopped');
  assert.match(r.ticket(), /asked you: Keep it\? ## Heading\. Why: because it stopped$/m);
  const r2 = blockedRepo({ status: 'building' }), b = agents(r2);
  fs.writeFileSync(r2.file, r2.ticket().replace(/## Notes\n- A note\.\n\n/, ''));
  r2.g('commit', '-qam', 'no notes');
  b.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  b.check();
  const before = fs.readdirSync(path.join(r2.dir, 'speck', 'tickets'));
  r2.g('checkout', '-q', 'main');
  assert.throws(() => act(r2, b.starts[0].token, 'fix', '0001', 'Mend it', '--why=x'), /no "## Notes" section/);
  assert.deepEqual(fs.readdirSync(path.join(r2.dir, 'speck', 'tickets')), before, 'no fix ticket made');
});

test('0287 AC3: foreman, foreman_model and foreman_effort are in the config template, blank, each with a comment', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  for (const key of ['foreman', 'foreman_model', 'foreman_effort']) assert.match(text, new RegExp(`^${key}: "" +# \\S`, 'm'), key);
  const cfg = parseYaml(text);
  assert.equal(cfg.foreman, ''); assert.equal(cfg.foreman_model, ''); assert.equal(cfg.foreman_effort, '');
});

test('0287 AC3: speck config set accepts the Foreman agent\'s settings, and refuses what it can\'t run', () => {
  for (const v of ['', 'claude', 'codex']) assert.equal(checkConfigValue('foreman', v), v);
  for (const v of ['gemini', 'constructor', 'CLAUDE']) assert.throws(() => checkConfigValue('foreman', v), /foreman must be blank or one of claude, codex/);
  assert.equal(checkConfigValue('foreman_model', 'sonnet'), 'sonnet');
  for (const v of ['', 'low', 'max']) assert.equal(checkConfigValue('foreman_effort', v), v);
  assert.throws(() => checkConfigValue('foreman_effort', 'loads'), /foreman_effort must be blank/);
  const r = panelRepo();
  for (const [k, v] of [['foreman', 'codex'], ['foreman_model', 'gpt-x'], ['foreman_effort', 'high']]) {
    const out = r.run('config', 'set', k, v);
    assert.equal(out.status, 0, out.stderr);
  }
  const cfg = loadConfig(r.dir);
  assert.deepEqual([cfg.foreman, cfg.foreman_model, cfg.foreman_effort], ['codex', 'gpt-x', 'high']);
});

test('0287 AC3: the Settings view\'s Foreman group offers them, explained and editable', () => {
  const r = panelRepo();
  const g = panelSettings(r.dir).groups.find(x => x.title === 'Foreman');
  const by = Object.fromEntries(g.settings.map(s => [s.key, s]));
  for (const key of ['foreman', 'foreman_model', 'foreman_effort']) {
    assert.ok(by[key], key);
    assert.equal(by[key].editable, true, key);
    assert.equal(by[key].value, '', key);
    assert.ok(by[key].explain.length > 20, key);
  }
  assert.deepEqual(by.foreman.choices, ['', 'claude', 'codex', 'cursor']); // 0333: and cursor
  assert.deepEqual(by.foreman_effort.choices, ['', 'low', 'medium', 'high', 'xhigh', 'max']);
  assert.equal(by.foreman_model.choices, undefined, 'typed in');
});

test('0287 AC3: setup offers the Foreman agent\'s settings', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  for (const cmd of ['speck config set foreman <name>', 'speck config set foreman_model <name>', 'speck config set foreman_effort <effort>']) assert.ok(skill.includes(cmd), cmd);
});

test('0287 AC3: the agent runs on foreman, foreman_model and foreman_effort, blank for the defaults', () => {
  assert.equal(foremanAgentOf({}), 'claude');
  assert.equal(foremanAgentOf({ builder: 'codex' }), 'codex');
  assert.equal(foremanAgentOf({ builder: 'codex', foreman: 'claude' }), 'claude');
  assert.equal(foremanAgentOf({ foreman: '__proto__' }), 'claude');
  const plain = foremanArgv({}, 'B');
  assert.deepEqual(plain.slice(0, 3), ['claude', '-p', 'B']);
  assert.ok(!plain.includes('--model') && !plain.includes('--effort'));
  const claude = foremanArgv({ foreman_model: 'sonnet', foreman_effort: 'low' }, 'B');
  assert.equal(claude[claude.indexOf('--model') + 1], 'sonnet');
  assert.equal(claude[claude.indexOf('--effort') + 1], 'low');
  assert.ok(!claude.includes('--dangerously-skip-permissions'));
  const codex = foremanArgv({ foreman: 'codex', foreman_model: 'gpt-x', foreman_effort: 'high' }, 'B');
  assert.deepEqual(codex.slice(0, 2), ['codex', 'exec']);
  assert.equal(codex[codex.indexOf('-m') + 1], 'gpt-x');
  assert.ok(codex.includes('model_reasoning_effort="high"'));
  assert.equal(codex.at(-1), 'B');
});

test('0287 AC4: what the Foreman agent did, and why, goes in the ticket\'s Notes and the Foreman\'s status detail', async () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  a.check();
  let v = agentView(r.runs, [T('0001', 'building')]);
  assert.deepEqual(v.running, { id: '0001', what: 'its build ended with the ticket still building' });
  act(r, a.starts[0].token, 'ask', '0001', 'Should it keep the old test?', '--why=the build stopped on a choice it can\'t make');
  assert.match(r.ticket(), /^- The Foreman \(2026-10-18 14:00 UTC\) asked you: Should it keep the old test\?\. Why: the build stopped on a choice it can't make$/m);
  assert.match(r.g('log', '-1', '--format=%s'), /^speck\(0001\): Foreman: ask$/);
  a.end(a.starts[0]); a.check();
  v = agentView(r.runs, [T('0001', 'building')]);
  assert.equal(v.running, null);
  assert.equal(v.did[0].action, 'ask');
  assert.equal(v.did[0].why, 'the build stopped on a choice it can\'t make');
  assert.deepEqual(v.asks.map(q => q.question), ['Should it keep the old test?']);
  const f = foremanView({ run: ON, record: { lock: process.pid }, tickets: [T('0001', 'building')], agent: v });
  assert.equal(f.word, 'Needs you 1');
  assert.ok(foremanLines(f).some(l => l.includes('The Foreman asks you about 0001: Should it keep the old test?')));
  assert.ok(foremanLines(f).some(l => l.includes('Why: the build stopped on a choice')));
  assert.deepEqual(agentView(r.runs, [T('0001', 'done')]).asks, [], 'a question goes once its ticket has moved on');
  // The panel's detail shows it.
  const p = fakePage([{ tickets: [T('0001', 'building')], ideas: [], resume_command: '', run: ON, foreman: f }]);
  await p.settle();
  click(p.byId('run'));
  await p.settle();
  const text = p.byId('foreman').textContent;
  assert.match(text, /Looked into/);
  assert.match(text, /The Foreman asks you:/);
  assert.match(text, /Should it keep the old test\?/);
  assert.match(text, /Why: the build stopped on a choice/);
});

test('0287 AC5: at most one Foreman agent at a time, and once for the same ticket and commits', () => {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'first', log: '' });
  a.q.stuck({ id: '0002', what: 'second', log: '' });
  a.check(); a.check();
  assert.equal(a.starts.length, 1, 'one at a time');
  assert.deepEqual(readAgentState(r.runs).queue.map(q => q.id), ['0002']);
  a.end(a.starts[0]); a.check();
  assert.equal(a.starts.length, 2, 'the next once the first has ended');
  assert.match(brief(a.starts[1]), /ticket 0002/);
  a.end(a.starts[1]); a.check();
  a.q.stuck({ id: '0001', what: 'first again', log: '' });
  a.check();
  assert.equal(a.starts.length, 2, 'not again for the same commits');
  const key = codeKey(r.dir, CFG, '0001');
  fs.appendFileSync(r.file, '\nNote.\n'); r.g('commit', '-qam', 'speck(0001): Foreman: ask');
  assert.equal(codeKey(r.dir, CFG, '0001'), key, 'the Foreman\'s own commits don\'t count');
  fs.writeFileSync(path.join(r.dir, 'code.txt'), 'x\n'); r.g('add', 'code.txt'); r.g('commit', '-qm', 'more work');
  a.q.stuck({ id: '0001', what: 'after new work', log: '' });
  a.check();
  assert.equal(a.starts.length, 3, 'again once it has new commits');
  a.end(a.starts[2]);
  a.q.stuck({ id: '0003', what: 'third', log: '' });
  a.check([T('0003', 'done')]);
  assert.equal(a.starts.length, 3, 'not for a ticket that has since finished');
  assert.deepEqual(readAgentState(r.runs).queue, []);
});

test('0287 AC5: a record that can\'t be saved never starts a second Foreman agent, nor repeats its actions', () => {
  const r = blockedRepo({ status: 'building' });
  let fail = () => false, saves = 0;
  const persist = (runs, st) => { saves++; if (fail(st)) throw new Error('disk full'); saveRecord(path.join(runs, 'run.foreman-agent.json'), { ...st, tried: { ...st.tried } }); };
  const a = agents(r, { persist });
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  fail = () => true; // the reservation can't be saved: nothing starts
  a.check(); a.check();
  assert.equal(a.starts.length, 0);
  fail = st => !!st.running?.pid; // reserved, but its process id can't be saved
  a.check(); a.check(); a.check();
  assert.equal(a.starts.length, 1, 'one agent, though its record still has no process id');
  act(r, a.starts[0].token, 'resume', '0001', 'Carry on.', '--why=it stopped partway'); // its token was saved as it was reserved
  a.end(a.starts[0]);
  fail = () => true; // nothing can be saved now
  a.check(); a.check(); a.check();
  assert.equal(a.resumed.length, 1, 'its resume is carried out once');
  assert.equal(a.starts.length, 1);
  assert.ok(saves > 0);
});

test('0287 AC5: after a restart, an agent whose process id wasn\'t saved still holds the Foreman until it has ended', () => {
  const r = blockedRepo({ status: 'building' });
  const persist = (runs, st) => { if (st.running?.pid) throw new Error('disk full'); saveRecord(path.join(runs, 'run.foreman-agent.json'), { ...st, tried: { ...st.tried } }); };
  const a = agents(r, { persist });
  a.q.stuck({ id: '0001', what: 'first', log: '' });
  a.check();
  assert.equal(readAgentState(r.runs).running.pid, null);
  const token = a.starts[0].token;
  let holding = [4242]; // the agent's processes, found by its token
  const b = agents(r, { withToken: t => (t === token ? holding : []) }); // speck run restarted
  b.q.stuck({ id: '0002', what: 'second', log: '' });
  b.check(); b.check();
  assert.equal(b.starts.length, 0, 'waits for the first agent');
  const c = agents(r, { withToken: () => { throw new Error('ps failed'); } });
  c.check();
  assert.equal(c.starts.length, 0, 'counts as running when it can\'t be checked');
  holding = [];
  b.check();
  assert.equal(b.starts.length, 1, 'the next once it has ended');
  assert.match(brief(b.starts[0]), /ticket 0002/);
});

test('0287 AC1: speck run starts the Foreman agent when a build it started exits with its ticket still building, and not when it\'s blocked', async () => {
  // A fake builder that starts its ticket, as /speck-build does, sets it to FAKE_STATUS there and exits.
  const builder = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0287-b-')), 'build.cjs');
  fs.writeFileSync(builder, `const { spawnSync } = require('child_process');
const id = process.argv[2];
const wt = spawnSync(process.execPath, [${JSON.stringify(CLI)}, 'start', id], { encoding: 'utf8' }).stdout.trim().split('\\n').pop();
if (process.env.FAKE_STATUS) { spawnSync(process.execPath, [${JSON.stringify(CLI)}, 'set', id, 'status', process.env.FAKE_STATUS], { cwd: wt }); spawnSync('git', ['commit', '-qam', 'status'], { cwd: wt }); }
`);
  // A fake Foreman agent: claude on the PATH, writing its arguments down.
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0287-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0287-out-'));
  fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nprintf '%s\\n' "$@" > "${out}/$$.txt"\n`, { mode: 0o755 });
  const briefs = () => fs.readdirSync(out).map(f => fs.readFileSync(path.join(out, f), 'utf8'));
  for (const [status, expect] of [['', true], ['blocked', false]]) {
    const r = runRepo({ worktrees: 'true', command: `"${process.execPath}" "${builder}" {id} {session}` });
    fs.appendFileSync(r.cfgFile, 'foreman_fixing: fix\n');
    r.g('commit', '-qam', 'fix');
    for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f));
    const run = startRun(r.dir, { PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_STATUS: status });
    try {
      assert.ok(await until(() => /0001 build exited with code 0/.test(run.out())), run.out());
      if (expect) {
        assert.ok(await until(() => briefs().length === 1), run.out());
        assert.match(briefs()[0], /ticket 0001/);
        assert.match(briefs()[0], /still building, neither approved nor blocked/);
      } else {
        await new Promise(res => setTimeout(res, 400)); // a few of speck run's checks
        assert.deepEqual(briefs(), [], run.out());
      }
    } finally { await stopRun(run); }
  }
});
