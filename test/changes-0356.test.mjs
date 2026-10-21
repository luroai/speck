import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gitEnv } from './support/speck.mjs';
import { runIn } from './support/ship.mjs';
import { spawnReview, TICKET } from './support/merge-rounds.mjs';
import { changesRepo, reviewLog, NOTE, ENDED, WORDS } from './support/changes.mjs';
import { statusData } from '../scripts/speck.mjs';
import { askForChanges } from '../scripts/changes.mjs';
import { handBackQueue, handBackMessage } from '../scripts/hand-back.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';

Object.assign(process.env, gitEnv); // askForChanges commits in this process

const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');
const AT = new Date('2026-10-21T14:05:00Z');
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const backs = (r, started, running = new Set()) => handBackQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running,
  startBuild: (id, argv, cwd, session, flags, record) => { started.push({ id, argv, cwd, session, flags, rec: JSON.parse(record(4242)) }); running.add(id); },
  saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => 'resume it', runs: () => r.runs });

// ---------- AC1: the note goes in the Review log, dated, committed, and holds the ticket from shipping ----------

test('0356 AC1: speck changes adds the note, dated, to the Review log as changes asked for by the user, and commits it', () => {
  const r = changesRepo();
  const before = r.head();
  const out = askForChanges(r.wt, '1', NOTE, AT);
  assert.match(out, /won't ship until it's approved again/);
  assert.notEqual(r.head(), before, 'committed');
  assert.equal(r.g('-C', r.wt, 'status', '--porcelain', '--', TICKET), '', 'nothing left uncommitted');
  assert.equal(r.g('-C', r.wt, 'log', '-1', '--format=%s'), 'speck(0001): changes asked for');
  const line = reviewLog(r.ticket()).split('\n').find(l => l.includes(NOTE));
  assert.ok(line, 'the note is in the Review log');
  assert.match(line, /2026-10-21 14:05 UTC/, 'dated');
  assert.match(line, /Changes asked for by the user/);
  assert.match(r.ticket(), /^status: approved/m, 'still approved until its build takes it up');
});

test('0356 AC1: a note over several lines is kept on one line', () => {
  const r = changesRepo();
  askForChanges(r.wt, '0001', 'First this.\n\nThen   that.', AT);
  assert.ok(reviewLog(r.ticket()).includes('Changes asked for by the user after round 1: First this. Then that.'));
});

test('0356 AC1: speck changes works from the CLI, from the main checkout', () => {
  const r = changesRepo();
  const out = runIn(r.dir, 'changes', '1', 'Rename', 'the', 'button.');
  assert.equal(out.status, 0, out.stderr);
  assert.ok(reviewLog(r.ticket()).includes('Rename the button.'));
});

test('0356 AC1: until it is approved again, speck next says review, auto_ship is off for it and speck ship --auto refuses', () => {
  const r = changesRepo();
  assert.equal(shown(r).auto_ship, true, 'auto_ship covers it before');
  askForChanges(r.wt, '1', NOTE, AT);
  assert.match(r.next(), /^review: the user asked for changes after round 1/);
  assert.equal(shown(r).auto_ship, false);
  const main = r.sha('main');
  const ship = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(ship.status, 12, ship.stdout + ship.stderr);
  assert.match(ship.stderr, /asked for changes/);
  assert.equal(r.sha('main'), main, 'nothing shipped');
  const byHand = runIn(r.dir, 'ship', '1');
  assert.notEqual(byHand.status, 0);
  assert.match(byHand.stderr, /The review loop says "review", not "ship": the user asked for changes/, 'nor does shipping it by hand');
  assert.equal(r.sha('main'), main);
});

test('0356 AC1: the ship queue doesn\'t ship it while the changes wait, nor once its build has taken them up', () => {
  const r = changesRepo();
  askForChanges(r.wt, '1', NOTE, AT);
  const launches = [], handBacks = backs(r, []);
  const q = shipQueue(r.dir, CFG, { say: () => {}, launch: (repo, id) => launches.push(id), waiting: id => handBacks.waiting(id) });
  q.check(statusData(r.dir).tickets);
  assert.equal(handBacks.waiting('0001'), true, 'held by the hand-back meanwhile');
  // Its build was resumed, then ended without a round: the hand-back has gone, but the note still holds it.
  const { hand_back: _, ...rest } = JSON.parse(r.rec());
  fs.writeFileSync(r.record, JSON.stringify(rest));
  assert.equal(handBacks.waiting('0001'), false);
  q.check(statusData(r.dir).tickets);
  assert.deepEqual(launches, []);
});

test('0356 AC1: once a round has reviewed the changes and the ticket is closed, it is approved again, keeping the note in its Review log', () => {
  const r = changesRepo();
  askForChanges(r.wt, '1', NOTE, AT);
  r.work('blue\n');
  const round = spawnReview(r.wt, 'approve');
  assert.equal(round.status, 0, round.stdout + round.stderr);
  assert.equal(r.next(), 'ship');
  const close = runIn(r.wt, 'close', '1');
  assert.equal(close.status, 0, close.stderr);
  assert.match(r.ticket(), /^status: approved/m);
  const log = reviewLog(r.ticket()).trim().split('\n');
  assert.equal(log.length, 3, log.join('\n'));
  assert.match(log[0], /^Round 1 /);
  assert.ok(log[1].includes(NOTE), 'the note stays, after the round it followed');
  assert.match(log[2], /^Round 2 /);
  assert.equal(shown(r).auto_ship, true, 'auto_ship covers it again');
});

// ---------- AC2: speck run resumes the build with the note, and the reviewer checks it ----------

test('0356 AC2: speck run resumes the build\'s own session with a message that has the note and says what to do', () => {
  const r = changesRepo();
  askForChanges(r.wt, '1', NOTE, AT);
  const started = [];
  const q = backs(r, started);
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  const s = started[0];
  const message = s.argv[2];
  assert.deepEqual(s.argv, ['claude', '-p', message, '--resume', 'sess-1'], 'its own session, with the message in place of the prompt');
  assert.equal(message, handBackMessage({ id: '0001', kind: 'changes', why: NOTE, base: 'main' }));
  assert.ok(message.includes(NOTE), 'the note');
  assert.match(message, /make the changes/i);
  assert.match(message, /run the review loop again/i);
  assert.match(message, /once it's approved again, close it and stop/i);
  assert.equal(s.cwd, r.wt, 'from the folder it started in');
  assert.equal(s.rec.hand_backs, 0, 'not counted as a ship\'s hand-back');
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1, 'resumed once');
});

test('0356 AC2: the reviewer\'s next round is given the note to check as well as the acceptance criteria, until a round approves it', () => {
  const r = changesRepo();
  askForChanges(r.wt, '1', NOTE, AT);
  r.work('blue\n');
  const prompt = path.join(r.bin, 'prompt.md');
  assert.equal(spawnReview(r.wt, 'changes_requested', { FAKE_PROMPT: prompt }).status, 10);
  const first = fs.readFileSync(prompt, 'utf8');
  assert.match(first, /## Changes asked for by the user/);
  assert.ok(first.includes(NOTE), 'the note');
  assert.match(first, /as well as every acceptance criterion/);
  r.work('bluer\n');
  assert.equal(spawnReview(r.wt, 'approve', { FAKE_PROMPT: prompt }).status, 0);
  assert.ok(fs.readFileSync(prompt, 'utf8').includes(NOTE), 'still given in the round after, until one approves');
  r.work('later\n');
  spawnReview(r.wt, 'approve', { FAKE_PROMPT: prompt });
  assert.ok(!fs.readFileSync(prompt, 'utf8').includes(NOTE), 'not once a round has approved it');
});

// ---------- AC3: refusals change nothing and say why ----------

test('0356 AC3: speck changes refuses, changing nothing and saying why, for a ticket that isn\'t approved, an empty note or a build it can\'t resume', () => {
  const cases = [
    [r => { fs.writeFileSync(path.join(r.wt, TICKET), r.ticket().replace(/^status: .*$/m, 'status: reviewing')); r.g('-C', r.wt, 'commit', '-qam', 'reviewing'); }, NOTE, /"reviewing", not approved/],
    [() => {}, '   \n ', /Say what you want changed/],
    [r => fs.rmSync(r.record), NOTE, /can't be resumed: it has no run record/],
    [r => fs.writeFileSync(r.record, JSON.stringify({ ...ENDED, session: '', cwd: r.wt })), NOTE, /can't be resumed: its run record has no session/],
    [r => { const f = path.join(r.dir, 'speck', 'config.yml'); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^build_command:.*$/m, "build_command: 'claude -p hello'")); }, NOTE, /can't be resumed: build_command needs --session-id/],
  ];
  for (const [setUp, note, why] of cases) {
    const r = changesRepo();
    setUp(r);
    const ticket = r.ticket(), head = r.head(), rec = r.rec();
    const out = runIn(r.dir, 'changes', '1', note);
    assert.equal(out.status, 1, String(why));
    assert.match(out.stderr, why);
    assert.match(out.stderr, /Nothing was changed/);
    assert.equal(r.ticket(), ticket, 'the ticket is unchanged');
    assert.equal(r.head(), head, 'nothing committed');
    assert.equal(r.rec(), rec, 'the run record is unchanged');
  }
});

test('0356 AC3: a second note while the first still waits for the build is refused', () => {
  const r = changesRepo();
  askForChanges(r.wt, '1', NOTE, AT);
  const ticket = r.ticket(), rec = r.rec();
  assert.throws(() => askForChanges(r.wt, '1', 'Something else.', AT), /already has changes you asked for/);
  assert.equal(r.ticket(), ticket);
  assert.equal(r.rec(), rec);
});
