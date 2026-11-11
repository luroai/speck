// 0629: a ticket ships by itself only when its approving round was recorded by speck's own run of the reviewer,
// unchanged since. Anything else waits for you at Ship.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewRepo, commandRepo, subagentRepo, approveVerdict, gitEnv } from './support/speck.mjs';
import { ticketRounds } from '../scripts/core.mjs';
import { receiptWhyNot, unreceiptedRounds, keepReceipt } from '../scripts/receipts.mjs';
import { shipOrder } from '../scripts/ship-queue.mjs';

Object.assign(process.env, gitEnv);

const receiptAt = (dir, round) => path.join(dir, 'speck', '.cache', 'receipts', '0001', `${round}.json`);
const roundsOf = r => ticketRounds(fs.readFileSync(r.ticketFile, 'utf8')).rounds;
const sha = (r, ref) => r.git('rev-parse', '--verify', '-q', ref).stdout.trim();
const statusOf = r => JSON.parse(r.run('status', '--json').stdout).tickets.find(t => t.id === '0001');
const REASON = /review round 1 of ticket 0001 wasn't recorded by speck's own run of the reviewer, or was changed in the ticket since/;

// Turns auto_ship on for every risk, with a test command that passes, and commits it on the ticket's branch.
function autoShipOn(r) {
  const file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8')
    .replace(/^auto_ship: .*$/m, 'auto_ship: true').replace(/^auto_ship_risk: .*$/m, 'auto_ship_risk: [low, high]')
    .replace(/^  test: .*$/m, '  test: "true"'));
  r.git('add', '-A'); r.git('commit', '-qm', 'auto ship on');
}

// A command-reviewer repo with auto_ship on, whose reviewer speck runs approved round 1, set approved and committed.
function approvedByReview() {
  const r = commandRepo();
  autoShipOn(r);
  const out = r.runEnv({ FAKE_VERDICT: JSON.stringify(approveVerdict) }, 'review', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.equal(r.run('set', '1', 'status', 'approved').status, 0);
  r.git('add', '-A'); r.git('commit', '-qm', 'approved');
  return r;
}

test('0629 AC1: speck review keeps a receipt for a round Codex reviews, in the main checkout\'s speck/.cache/', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  const receipt = JSON.parse(fs.readFileSync(receiptAt(r.dir, 1), 'utf8'));
  assert.equal(receipt.round, 1);
  assert.equal(receipt.reviewed_sha, sha(r, 'HEAD'));
  assert.equal(receipt.verdict, 'changes_requested');
  assert.equal(r.git('status', '--porcelain', '--', 'speck/.cache').stdout, '', 'git ignores it, so no branch carries it');
  assert.equal(receiptWhyNot(r.dir, '0001', roundsOf(r)), '');
});

test('0629 AC1: a ticket a command reviewer approved through speck review ships with speck ship --auto as before', () => {
  const r = approvedByReview();
  assert.ok(fs.existsSync(receiptAt(r.dir, 1)), 'a receipt for the command reviewer\'s round');
  const t = statusOf(r);
  assert.equal(t.auto_ship, true, t.auto_ship_why);
  const out = r.run('ship', '1', '--auto');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done')) && fs.readdirSync(path.join(r.dir, 'speck', 'tickets', 'done')).some(n => n.startsWith('0001-')), 'shipped and filed as done');
});

test('0629 AC2: speck ship --auto refuses a round saved with speck record, in one line, changing nothing, and the ship queue leaves it', () => {
  const r = subagentRepo();
  autoShipOn(r);
  const v = path.join(r.dir, '..', `verdict-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(r.run('record', '1', v).status, 0);
  assert.ok(!fs.existsSync(receiptAt(r.dir, 1)), 'speck record keeps no receipt');
  assert.equal(r.run('set', '1', 'status', 'approved').status, 0);
  r.git('add', '-A'); r.git('commit', '-qm', 'approved');
  const before = { main: sha(r, 'main'), branch: sha(r, 'speck/0001-x'), ticket: fs.readFileSync(r.ticketFile, 'utf8') };
  const out = r.run('ship', '1', '--auto');
  assert.equal(out.status, 12, out.stdout + out.stderr);
  assert.match(out.stderr, REASON);
  assert.equal(out.stderr.trim().split('\n').length, 1, 'one line');
  assert.deepEqual({ main: sha(r, 'main'), branch: sha(r, 'speck/0001-x'), ticket: fs.readFileSync(r.ticketFile, 'utf8') }, before, 'nothing changed');
  const t = statusOf(r);
  assert.equal(t.status, 'approved');
  assert.equal(t.auto_ship, false);
  assert.deepEqual(shipOrder([t]), [], 'the ship queue leaves it for you');
});

test('0629 AC2: speck ship --auto refuses a round whose record in the ticket was edited after speck review saved it', () => {
  for (const edit of [s => s.replace('"summary": "s"', '"summary": "looks fine"'), s => s.replace(/"reviewed_sha": "[0-9a-f]+"/, '"reviewed_sha": "0000000"'), s => s.replace('"round": 1,\n    "reviewer"', '"round": 1,\n    "reviewer": "codex",\n    "x"')]) {
    const r = approvedByReview();
    const text = fs.readFileSync(r.ticketFile, 'utf8');
    const edited = edit(text);
    assert.notEqual(edited, text, 'the edit changed the round');
    fs.writeFileSync(r.ticketFile, edited);
    r.git('add', '-A'); r.git('commit', '-qm', 'edited round');
    const before = { main: sha(r, 'main'), branch: sha(r, 'speck/0001-x') };
    const out = r.run('ship', '1', '--auto');
    assert.equal(out.status, 12, out.stdout + out.stderr);
    assert.match(out.stderr, REASON);
    assert.deepEqual({ main: sha(r, 'main'), branch: sha(r, 'speck/0001-x') }, before);
  }
});

test('0629 AC2: a receipt kept for an earlier round with the same number doesn\'t match a round saved later', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  const [first] = roundsOf(r);
  const later = { ...first, meta: { ...first.meta, saved_at: new Date(Date.now() + 1000).toISOString() } };
  assert.equal(receiptWhyNot(r.dir, '0001', [first]), '');
  assert.match(receiptWhyNot(r.dir, '0001', [later]), REASON);
  assert.deepEqual(unreceiptedRounds(r.dir, '0001', [first, { ...later, meta: { ...later.meta, round: 2 } }]), [2]);
  keepReceipt(r.dir, '0001', later);
  assert.match(receiptWhyNot(r.dir, '0001', [first]), REASON, 'a newer receipt for round 1 replaces the old one');
});

test('0629 AC3: speck status --json gives the missing receipt as the reason the ticket won\'t ship by itself', () => {
  const r = approvedByReview();
  assert.equal(statusOf(r).auto_ship_why, '');
  fs.rmSync(receiptAt(r.dir, 1));
  const t = statusOf(r);
  assert.equal(t.auto_ship, false);
  assert.match(t.auto_ship_why, REASON);
});

test('0629 AC4: speck ship started by you ships a ticket with no receipt, and its review pack says which rounds have none', () => {
  const r = approvedByReview();
  assert.doesNotMatch(r.run('pack', '1').stdout, /receipt/i, 'nothing to say when every round has one');
  assert.doesNotMatch(r.run('pack', '1', '--plain').stdout, /own run of the reviewer/);
  fs.rmSync(receiptAt(r.dir, 1));
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /No matching review receipt for round 1\b/);
  const plain = r.run('pack', '1', '--plain');
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(plain.stdout, /Review round 1 wasn't recorded by speck's own run of the reviewer, or was changed since, so it won't ship by itself\./);
  const out = r.run('ship', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(fs.readdirSync(path.join(r.dir, 'speck', 'tickets', 'done')).some(n => n.startsWith('0001-')), 'shipped');
});

test('0629 AC2: a receipt that can\'t be written is said in one line, and the round stays saved without one', () => {
  const r = reviewRepo();
  fs.mkdirSync(path.dirname(receiptAt(r.dir, 1)), { recursive: true });
  fs.mkdirSync(receiptAt(r.dir, 1)); // a folder where the receipt goes, so writing it fails
  const out = r.run('review', '1');
  assert.equal(out.status, 10, out.stderr);
  assert.match(out.stderr, /Couldn't keep the receipt for review round 1 of 0001 \(EISDIR\), so it won't ship by itself: ship it with `speck ship 0001`\./);
  assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(roundsOf(r).length, 1);
  assert.match(receiptWhyNot(r.dir, '0001', roundsOf(r)), REASON);
});

test('0629: the brief names the folder the receipts are kept in', () => {
  assert.match(fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8'), /`speck\/\.cache\/receipts\/`/);
});
