// 0711: an approved ticket's handed-back build that stops on its agent's usage limit, with the reset more than an hour
// away, moves to a free agent on builder_bench, as a building ticket's build does (0648).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { usageLimitQueue, readLimit, limitWaiting } from '../scripts/usage-limit.mjs';
import { buildTakeOver, takeOverNote } from '../scripts/build-take-over.mjs';
import { handBackQueue } from '../scripts/hand-back.mjs';
import { shipQueue, refsOf } from '../scripts/ship-queue.mjs';
import { saveRecord, buildTicket } from '../scripts/build-records.mjs';

Object.assign(process.env, gitEnv); // the take-over commits in this process

const AT = Date.parse('2026-11-11T12:00:00Z'), MIN = 60000, LATER = AT + 3 * 3600e3;
const CLASH = 'CONFLICT (add/add): Merge conflict in a.txt';
const refused = resetsAt => `${JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected', ...(resetsAt ? { resetsAt: resetsAt / 1000 } : {}) } })}\n`;
const cursorRefused = `${[{ type: 'system', subtype: 'init', session_id: 'chat-1' }, { type: 'result', subtype: 'error', is_error: true, result: 'PRO_USER_USAGE_LIMIT' }].map(e => JSON.stringify(e)).join('\n')}\n`;
const promptOf = start => start.argv.find(w => w.includes('0001') && w.length > 40);
const firstMessageOf = start => start.argv.find(w => /^speck run's ship queue tried to ship ticket 0001/.test(w));

// A repo with ticket 0001 approved on its branch, in its own worktree, after a build speck run started for it. speck
// run's usage-limit queue, with 0648's take-over, and its hand-back queue run over it, with a clock the test moves.
// handBack() hands it back to that build as a refused ship does, and stop() leaves the build it's handed back to
// stopped on Claude's limit, as speck run records it, then runs one check.
function setup({ ready = ['claude', 'codex', 'cursor'], held = ['claude'], max = 4, handBacks } = {}) {
  const r = panelRepo({ worktrees: 'true' });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^reviewer: .*$/m, 'reviewer: claude-subagent'));
  fs.appendFileSync(r.file, '\n## Notes\n- Shaped by hand.\n');
  r.g('commit', '-qam', 'reviewer and notes');
  assert.equal(r.run('start', '1').status, 0);
  const cfg = () => loadConfig(r.dir);
  const { at: wt, t } = buildTicket(r.dir, cfg(), '0001');
  const gw = (...a) => r.g('-C', wt, ...a);
  fs.writeFileSync(t.file, fs.readFileSync(t.file, 'utf8').replace(/^status: .*$/m, 'status: approved'));
  gw('commit', '-qam', 'speck(0001): approved');
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const recFile = path.join(runs, '0001.json'), log = path.join(runs, '0001.log');
  const s = { r, wt, gw, runs, ticketFile: t.file, clock: { now: AT }, said: [], starts: [], running: new Set(), held: new Set(held) };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  const settings = () => ({ cfg: cfg(), words, max });
  // As speck run's: the build's run record is written as it starts.
  const startBuild = (id, argv, cwd, shown, flags, rec, session) => {
    s.running.add(id);
    fs.writeFileSync(recFile, rec(321));
    s.starts.push({ id, argv, cwd, shown, flags, session, rec: JSON.parse(rec(321)) });
  };
  const takeOver = buildTakeOver({ repo: r.dir, runs: () => runs, startBuild, heldAgent: a => s.held.has(a) || s.q.holds(a), readyAgents: () => ready,
    speak: m => s.said.push(m), now: () => s.clock.now, providers: () => [], installed: () => true, chat: () => ({ session: 'chat-1' }) });
  s.q = usageLimitQueue({ repo: r.dir, runs: () => runs, settings, running: s.running, startBuild, resumeHint: () => 'Resume it by hand', say: m => s.said.push(m),
    now: () => s.clock.now, statusOf: () => s.ticket().fm.status, takeOver });
  s.hb = handBackQueue({ repo: r.dir, cfg: cfg(), settings, running: s.running, startBuild, saveRecord, resumeHint: () => 'Resume it by hand', runs: () => runs,
    heldBuild: id => s.q.holdsBuild(id) });
  s.tickets = () => [{ id: '0001', status: s.ticket().fm.status }];
  s.rec = () => JSON.parse(fs.readFileSync(recFile, 'utf8'));
  s.ticket = () => { const raw = fs.readFileSync(buildTicket(r.dir, cfg(), '0001').t.file, 'utf8'); return { fm: parseTicket(raw).fm, raw }; };
  s.notesLine = () => s.ticket().raw.split('\n').find(l => l.startsWith('- Builder: '));
  // The build running now ended, as speck run records it.
  s.end = () => { s.running.delete('0001'); saveRecord(recFile, { ...s.rec(), exited: new Date(s.clock.now).toISOString(), exit_code: 0 }); };
  // A ship of it refused with `kind`, handed back to its build: the start that hands it back.
  s.handBack = (kind = 'conflict', why = CLASH) => {
    s.hb.keep({ id: '0001', kind, why, head: refsOf(r.dir, cfg(), '0001').head });
    s.hb.check(s.tickets());
    return s.starts.at(-1);
  };
  s.stop = (resets = LATER, text = refused(resets)) => {
    s.running.delete('0001');
    fs.writeFileSync(log, text);
    saveRecord(recFile, { ...s.rec(), exited: new Date(s.clock.now).toISOString(), exit_code: 1 });
    const waits = s.q.ended('0001', log, recFile);
    s.q.check(s.tickets());
    return waits;
  };
  saveRecord(recFile, { id: '0001', session: 's-old', agent: 'claude', cwd: wt, pid: 1, started: new Date(AT - 3600e3).toISOString(),
    exited: new Date(AT - 600e3).toISOString(), exit_code: 0, ...(handBacks === undefined ? {} : { hand_backs: handBacks }) });
  return s;
}

// The clash its ship hit: a.txt added on main and on its branch.
function clash(s) {
  fs.writeFileSync(path.join(s.r.dir, 'a.txt'), 'main\n');
  s.r.g('add', 'a.txt');
  s.r.g('commit', '-qm', 'a on main');
  fs.writeFileSync(path.join(s.wt, 'a.txt'), 'branch\n');
  s.gw('add', 'a.txt');
  s.gw('commit', '-qm', 'a on the branch');
}

// ---------- AC1 ----------

test('0711 AC1: an approved ticket\'s handed-back build stopped with the reset over an hour away carries on on the first free bench agent, in its worktree', () => {
  const s = setup();
  const branch = s.gw('rev-parse', '--abbrev-ref', 'HEAD');
  s.handBack();
  assert.equal(s.stop(), true, 'waits on Claude\'s limit, as 0691 has it');
  assert.equal(s.starts.length, 2, 'handed back, then moved');
  const b = s.starts[1];
  assert.equal(b.argv[0], 'codex', 'Codex, the first on the bench, with its own command');
  assert.equal(b.rec.agent, 'codex');
  assert.equal(b.flags, 'w', 'a fresh build, not Claude\'s session resumed');
  assert.notEqual(b.session, 's-old');
  assert.equal(b.cwd, s.wt, 'in the ticket\'s worktree');
  assert.equal(s.gw('rev-parse', '--abbrev-ref', 'HEAD'), branch, 'on its branch');
  assert.deepEqual(readLimit(s.runs)?.builds ?? [], [], 'no longer waiting for Claude\'s reset');
  assert.equal(s.ticket().fm.status, 'approved', 'still approved');
});

test('0711 AC1: the ticket\'s Notes gain the take-over line and its builder the new agent, committed on its branch as for a building ticket', () => {
  const s = setup();
  s.handBack();
  s.stop();
  const { fm } = s.ticket(), line = s.notesLine();
  assert.equal(fm.builder, 'codex');
  assert.equal(line, takeOverNote('Claude', 'Codex', { resets: new Date(LATER).toISOString() }, AT), 'the line 0648 writes');
  for (const fact of ['Codex', 'Claude', '2026-11-11 12:00 UTC', 'usage limit', '2026-11-11 15:00 UTC']) assert.ok(line.includes(fact), `${fact}: ${line}`);
  assert.match(s.gw('log', '-1', '--format=%s'), /^speck\(0001\): codex takes over the build$/);
  assert.equal(s.gw('status', '--porcelain'), '');
  assert.equal(s.r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'nothing changed in the main checkout');
  assert.deepEqual(s.starts[1].rec.took_over, { from: 'claude', at: new Date(AT).toISOString() });
});

test('0711 AC1: stopped partway through the merge, it still moves, leaving the merge unfinished with the take-over committed under it', () => {
  const s = setup();
  clash(s);
  s.handBack();
  s.gw('merge', 'main'); // the handed-back build starts the merge, which stops on the clash
  const mergeHead = s.gw('rev-parse', '-q', '--verify', 'MERGE_HEAD'), before = s.gw('rev-parse', 'HEAD');
  assert.ok(mergeHead, 'a merge is unfinished');
  s.stop();
  assert.equal(s.starts.length, 2, 'moved');
  assert.equal(s.starts[1].rec.agent, 'codex');
  assert.equal(s.gw('rev-parse', '-q', '--verify', 'MERGE_HEAD'), mergeHead, 'the merge is left unfinished, for the new agent');
  assert.equal(s.gw('rev-parse', 'HEAD^'), before, 'the take-over is committed on the branch, after its last commit');
  assert.match(s.gw('log', '-1', '--format=%s'), /^speck\(0001\): codex takes over the build$/);
  assert.equal(s.gw('status', '--porcelain'), 'AA a.txt', 'only the clash is left to resolve; the ticket is as committed');
  const rel = path.relative(s.wt, s.ticketFile).split(path.sep).join('/');
  assert.match(s.gw('show', `HEAD:${rel}`), /^builder: "?codex"?/m);
  assert.ok(s.gw('show', `HEAD:${rel}`).includes(s.notesLine()), 'the Notes line is in the commit');
  // The new agent finishes the merge: its commit keeps the take-over.
  const took = s.gw('rev-parse', 'HEAD');
  fs.writeFileSync(path.join(s.wt, 'a.txt'), 'both\n');
  s.gw('add', 'a.txt');
  s.gw('commit', '-q', '--no-edit');
  assert.equal(s.gw('rev-parse', '-q', '--verify', 'MERGE_HEAD'), '');
  assert.deepEqual(s.gw('rev-list', '--parents', '-n', '1', 'HEAD').split(' ').slice(1), [took, mergeHead]);
  assert.match(s.gw('show', `HEAD:${rel}`), /^builder: "?codex"?/m);
  assert.ok(s.gw('show', `HEAD:${rel}`).includes(s.notesLine()));
});

test('0711 AC1: with its ticket changed in the unfinished merge, nothing is committed or started, it waits for the reset, and that\'s said once', () => {
  const variants = {
    'merged in from main': s => {
      fs.writeFileSync(s.r.file, fs.readFileSync(s.r.file, 'utf8').replace('- PDF export', '- PDF export, for now'));
      s.r.g('commit', '-qam', 'ticket on main');
    },
    'edited by the build, not committed': () => {},
  };
  for (const [what, change] of Object.entries(variants)) {
    const s = setup();
    clash(s);
    change(s);
    s.handBack();
    s.gw('merge', 'main');
    if (what.startsWith('edited')) fs.appendFileSync(s.ticketFile, '- A note the build was writing.\n');
    const state = () => ({ head: s.gw('rev-parse', 'HEAD'), status: s.gw('status', '--porcelain'), merge: s.gw('rev-parse', '-q', '--verify', 'MERGE_HEAD'), text: fs.readFileSync(s.ticketFile, 'utf8') });
    const before = state();
    assert.ok(before.merge && /^[M ]{2} speck\/tickets\//m.test(before.status), `${what}: ${before.status}`);
    s.stop();
    s.q.check(s.tickets());
    assert.equal(s.starts.length, 1, `${what}: not moved`);
    assert.deepEqual(readLimit(s.runs).builds, ['0001'], `${what}: still waiting for the reset`);
    assert.deepEqual(state(), before, `${what}: nothing changed`);
    const says = s.said.filter(l => /can't take it over/.test(l));
    assert.equal(says.length, 1, says.join('\n'));
    assert.match(says[0], /unfinished merge/);
  }
});

test('0711 AC1: when the ticket\'s index entry can\'t be updated under the merge, the branch is put back and nothing else changes', () => {
  const s = setup();
  clash(s);
  s.handBack();
  s.gw('merge', 'main');
  const lock = path.resolve(s.wt, s.gw('rev-parse', '--git-path', 'index.lock'));
  const state = () => ({ head: s.gw('rev-parse', 'HEAD'), status: s.gw('status', '--porcelain'), merge: s.gw('rev-parse', '-q', '--verify', 'MERGE_HEAD'), text: fs.readFileSync(s.ticketFile, 'utf8') });
  const before = state();
  fs.writeFileSync(lock, ''); // another git process holds the index
  try { s.stop(); } finally { fs.rmSync(lock, { force: true }); }
  assert.equal(s.starts.length, 1, 'not moved');
  assert.deepEqual(state(), before);
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  assert.match(s.said.find(l => /can't take it over/.test(l)) ?? '', /couldn't be committed \(git update-index failed: .*index\.lock/);
  s.q.check(s.tickets()); // once the index is free, the next check moves it
  assert.equal(s.starts.length, 2);
  assert.equal(s.gw('rev-parse', 'HEAD^'), before.head);
});

// ---------- AC2 ----------

test('0711 AC2: the new agent is told what the hand-back was for, with the reason and steps the first build was given', () => {
  const s = setup();
  const first = firstMessageOf(s.handBack());
  assert.ok(first && first.includes(CLASH) && first.includes('"Conflict" steps'), first);
  s.stop();
  const prompt = promptOf(s.starts[1]);
  assert.match(prompt, /^\$speck-build 0001: /);
  assert.ok(prompt.includes(first), `the first build's message, whole:\n${prompt}`);
  assert.match(prompt, /carry on Claude's build of ticket 0001/, 'and it carries on another agent\'s build, as 0648 says');
  assert.match(prompt, /read the ticket's Notes and the branch's commits/);
});

test('0711 AC2: for a merge clash it\'s told to check for an unfinished merge first, and for failing tests, whose steps merge too', () => {
  for (const [kind, why] of [['conflict', CLASH], ['tests', 'not ok 3 - adds up']]) {
    const s = setup();
    s.handBack(kind, why);
    s.stop();
    const prompt = promptOf(s.starts[1]);
    assert.match(prompt, /unfinished merge/, kind);
    assert.match(prompt, /git status/, kind);
  }
});

test('0711 AC2: a hand-back whose steps don\'t merge isn\'t told to look for a merge', () => {
  const base = setup();
  const first = base.handBack('base', 'not ok 1 - main is broken');
  assert.match(firstMessageOf(first), /"Base branch failing" steps/);
  base.stop();
  assert.ok(promptOf(base.starts[1]).includes(firstMessageOf(first)));
  assert.doesNotMatch(promptOf(base.starts[1]), /unfinished merge/);
  const again = setup({ handBacks: 2 }); // its third clash: the steps say not to merge again
  const third = again.handBack();
  assert.match(firstMessageOf(third), /Handed back again/);
  again.stop();
  assert.ok(promptOf(again.starts[1]).includes(firstMessageOf(third)));
  assert.doesNotMatch(promptOf(again.starts[1]), /unfinished merge/);
});

test('0711 AC2: a handed-back build whose record doesn\'t say what for isn\'t moved: it waits for the reset, said once', () => {
  for (const handed_back_for of [undefined, null, 'conflict', { kind: '__proto__', why: CLASH }, { kind: 'conflict', why: 7 }]) {
    const s = setup();
    s.handBack();
    saveRecord(path.join(s.runs, '0001.json'), { ...s.rec(), handed_back_for }); // as one handed back before 0711 left it
    s.stop();
    s.q.check(s.tickets());
    assert.equal(s.starts.length, 1, JSON.stringify(handed_back_for));
    assert.deepEqual(readLimit(s.runs).builds, ['0001']);
    assert.equal(s.ticket().fm.builder, '', 'nothing recorded on the ticket');
    assert.equal(s.said.filter(l => /what it was handed back for/.test(l)).length, 1, s.said.join('\n'));
  }
});

// ---------- AC3 ----------

test('0711 AC3: while the moved build runs, the ship queue holds the ticket, even from tickets read before it started', () => {
  const s = setup();
  s.handBack();
  const stale = [{ id: '0001', status: 'approved', auto_ship: true, build_running: false }];
  const launched = [];
  const ships = shipQueue(s.r.dir, loadConfig(s.r.dir), { say: () => {}, launch: (repo, id) => launched.push(id), handBack: h => s.hb.keep(h), waiting: id => s.hb.waiting(id) });
  s.stop();
  assert.equal(s.starts.length, 2, 'moved');
  ships.check(stale);
  assert.deepEqual(launched, [], 'not shipped while the moved build runs');
  s.end();
  ships.check(stale);
  assert.deepEqual(launched, ['0001'], 'shipped once it has ended');
});

test('0711 AC3: the move keeps the hand-back count, and spends none: the third clash still blocks the ticket', () => {
  const s = setup({ ready: ['claude', 'cursor'] });
  const first = s.handBack();
  assert.equal(first.rec.hand_backs, 1);
  s.stop();
  const moved = s.starts[1];
  assert.equal(moved.rec.agent, 'cursor');
  assert.equal(moved.rec.hand_backs, 1, 'not reset, and not spent again');
  assert.equal(moved.rec.handed_back, first.rec.handed_back);
  assert.ok(s.said.every(l => !/handing it back/.test(l)), 'the move isn\'t a hand-back');
  s.end();
  const second = s.handBack();
  assert.equal(second.argv[second.argv.indexOf('--resume') + 1], 'chat-1', 'handed back to the agent that took it over');
  assert.equal(second.rec.hand_backs, 2);
  assert.match(firstMessageOf(second), /"Conflict" steps/);
  s.end();
  const third = s.handBack();
  assert.equal(third.rec.hand_backs, 3);
  assert.match(firstMessageOf(third), /Handed back again/, 'blocks the ticket, as today');
});

test('0711 AC3: the moved build stopping on its own agent\'s limit still holds the ticket', () => {
  const s = setup({ ready: ['claude', 'cursor'] });
  s.handBack();
  s.stop();
  assert.equal(s.starts[1].rec.agent, 'cursor');
  s.held.add('cursor');
  assert.equal(s.stop(null, cursorRefused), true, 'it waits on Cursor\'s limit too');
  assert.ok(limitWaiting(s.runs).includes('0001'));
  assert.equal(s.hb.waiting('0001'), true);
});

test('0711 AC3: a ticket under review that had been handed back keeps its hand-back count when its build moves', () => {
  const s = setup();
  s.handBack();
  const tf = buildTicket(s.r.dir, loadConfig(s.r.dir), '0001').t.file;
  fs.writeFileSync(tf, fs.readFileSync(tf, 'utf8').replace(/^status: .*$/m, 'status: reviewing'));
  s.gw('commit', '-qam', 'speck(0001): merge round');
  s.stop();
  assert.equal(s.starts.length, 2);
  assert.equal(s.starts[1].rec.hand_backs, 1);
  assert.ok(s.starts[1].rec.handed_back);
});

// ---------- AC4 ----------

test('0711 AC4: with the reset an hour away or less, it waits and carries on its own session after the reset', () => {
  const s = setup();
  s.handBack();
  s.stop(AT + 60 * MIN);
  assert.equal(s.starts.length, 1, 'not moved');
  assert.deepEqual(readLimit(s.runs).builds, ['0001']);
  assert.equal(s.ticket().fm.builder, '');
  assert.equal(s.notesLine(), undefined);
  s.clock.now = AT + 62 * MIN;
  s.q.check(s.tickets());
  assert.equal(s.starts.length, 2);
  assert.equal(s.starts[1].flags, 'a');
  assert.equal(s.starts[1].shown, 's-old', 'its own session, resumed');
  assert.equal(s.starts[1].rec.hand_backs, 1);
});

test('0711 AC4: with no agent on the bench free, it waits for the reset and carries on its own session', () => {
  for (const o of [{ ready: ['claude'] }, { held: ['claude', 'codex', 'cursor'] }]) {
    const s = setup(o);
    s.handBack();
    s.stop();
    assert.equal(s.starts.length, 1, JSON.stringify(o));
    assert.deepEqual(readLimit(s.runs).builds, ['0001']);
    s.clock.now = LATER + 2 * MIN;
    s.q.check(s.tickets());
    assert.equal(s.starts.length, 2);
    assert.equal(s.starts[1].shown, 's-old');
  }
});
