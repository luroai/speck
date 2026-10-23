import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipRepo, gIn } from './support/ship.mjs';
import { T, fakePage, round, panelModel, shippedRows } from './support/panel.mjs';
import { panelBoard } from '../scripts/board-feed.mjs';

// ---------- 0204: show when a ship merged but couldn't push ----------

// Gives main a bare remote, pushed to once, whose pre-receive hook then refuses every push, until `allow()`.
function refusingRemote(r) {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  gIn(bare, 'init', '-q', '--bare', '-b', 'main');
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  const hook = path.join(bare, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\necho "refused by the test" >&2\nexit 1\n', { mode: 0o755 });
  return { bare, allow: () => fs.rmSync(hook) };
}
const shipOf = r => JSON.parse(r.run('status', '--json').stdout).tickets.find(t => t.id === '0001').ship;

test('0204 AC1, AC3: a ship you start that merges but can\'t push leaves the ticket done with the push\'s message', () => {
  const r = shipRepo();
  refusingRemote(r);
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /Merged locally, but pushing main to origin failed/);
  assert.equal(r.statusIn(r.dir), 'done');
  const s = shipOf(r);
  assert.equal(s.running, false);
  assert.equal(s.unpushed, true);
  assert.match(s.message, /Merged locally, but pushing main to origin failed:[\s\S]*refused by the test[\s\S]*git push origin main/);
});

test('0204 AC1, AC3: so does an auto-ship', () => {
  const r = shipRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship: .*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'auto_ship on');
  refusingRemote(r);
  const res = r.run('ship', '1', '--auto');
  assert.notEqual(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stderr, /Merged locally/);
  const s = shipOf(r);
  assert.equal(s.unpushed, true);
  assert.equal(s.auto, true);
  assert.match(s.message, /Merged locally/);
});

test('0204 AC2: once the base branch\'s commit with the ticket has reached the remote, it shows as plainly shipped', () => {
  const r = shipRepo();
  const remote = refusingRemote(r);
  r.run('ship', '1');
  assert.equal(shipOf(r).unpushed, true);
  // Pulling in the remote's commits, or committing more, without pushing doesn't clear it.
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'later\n');
  r.g('commit', '-qam', 'later');
  assert.equal(shipOf(r).unpushed, true);
  remote.allow();
  assert.equal(gIn(r.dir, 'push', '-q', 'origin', 'main').status, 0);
  assert.equal(shipOf(r), null);
});

test('0204 AC4: a ship that pushes, or one with no remote, shows as it does today', () => {
  const pushed = shipRepo();
  refusingRemote(pushed).allow();
  assert.equal(pushed.run('ship', '1').status, 0);
  assert.equal(shipOf(pushed), null);
  const local = shipRepo();
  const res = local.run('ship', '1');
  assert.equal(res.status, 0);
  assert.match(res.stdout, /No remote set/);
  assert.equal(shipOf(local), null);
});

// ---------- the panel ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const MESSAGE = 'Merged locally, but pushing main to origin failed:\nremote: refused\nIf main is protected on GitHub, allow direct pushes (turn off "Require a pull request before merging"), then run `git push origin main`.';
const unpushed = { running: false, auto: false, started: ago(120), ended: ago(60), message: MESSAGE, unpushed: true };
const doneT = (id, finishedAgo, o = {}) => T(id, 'done', { started: ago(finishedAgo + 600), approved: ago(finishedAgo + 60), finished: ago(finishedAgo), rounds: [round(1, 10)], ...o });
const state = tickets => ({ tickets, ideas: [], resume_command: '' });
const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const texts = (p, row) => p.all(row).map(n => n._text).filter(Boolean);

test('0204 AC1: the panel shows the ticket in Shipped with "Merged, but not pushed" and speck ship\'s message', async () => {
  const p = fakePage([state([doneT('0801', 60, { ship: unpushed }), doneT('0802', 30)])]);
  await p.settle();
  assert.deepEqual(p.byId('queue').children.filter(n => /\bq\b/.test(n.className)), [], 'not in the Build list');
  const card = cardOf(p, '0801');
  assert.ok(card, 'in Shipped');
  const said = texts(p, card);
  assert.ok(said.includes('Merged, but not pushed'), said.join(' | '));
  assert.ok(said.includes(MESSAGE), said.join(' | '));
  const plain = texts(p, cardOf(p, '0802'));
  assert.ok(!plain.includes('Merged, but not pushed'), plain.join(' | '));
});

test('0204 AC2: once speck says it has been pushed, the card shows as plainly shipped', async () => {
  const p = fakePage([state([doneT('0801', 60, { ship: unpushed })]), state([doneT('0801', 60, { ship: null })])]);
  await p.settle();
  assert.ok(texts(p, cardOf(p, '0801')).includes('Merged, but not pushed'));
  p.timers.shift()(); await p.settle();
  const said = texts(p, cardOf(p, '0801'));
  assert.ok(!said.includes('Merged, but not pushed') && !said.includes(MESSAGE), said.join(' | '));
});

test('0204 AC1: an unpushed ticket older than the latest ten (five before 0411) still shows in Shipped, whole', () => {
  const tickets = [doneT('0900', 9000, { ship: unpushed }), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => doneT(`09${String(n).padStart(2, '0')}`, n * 10))];
  const board = panelBoard(state(tickets));
  const old = board.tickets.find(t => t.id === '0900');
  assert.equal(old.ship?.message, MESSAGE, 'the server keeps it whole');
  const m = panelModel()(board);
  assert.ok(m.shipped.some(t => t.id === '0900'), m.shipped.map(t => t.id).join(' '));
  assert.equal(m.shippedTotal, 11);
});

test('0204 AC4: a ticket with no unpushed ship has no such line', async () => {
  const p = fakePage([state([doneT('0801', 60), doneT('0802', 30, { ship: { running: false, auto: true, started: ago(100), ended: ago(90), message: 'Old refusal.' } })])]);
  await p.settle();
  for (const id of ['0801', '0802']) assert.ok(!texts(p, cardOf(p, id)).includes('Merged, but not pushed'), id);
});

test('0204 AC4: a ship record with an unreadable unpushed part counts as pushed, running nothing it names', async () => {
  const { shipState } = await import('../scripts/ship.mjs');
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-runs-'));
  const write = unpushed => fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({ pid: 999999999, started: ago(60), ended: ago(30), auto: false, message: 'm', unpushed }));
  for (const bad of [{}, 'yes', { remote: '--upload-pack=touch x', base: 'main', sha: 'abcdef1' }, { remote: 'origin', base: 'main', sha: 'not a sha' }]) {
    write(bad);
    assert.equal(shipState(runs, '1'), null, JSON.stringify(bad));
  }
});

test('0204 AC2: shipping the ticket again before it\'s pushed refuses and keeps the message', async () => {
  const r = shipRepo();
  const remote = refusingRemote(r);
  r.run('ship', '1');
  const before = shipOf(r);
  const again = r.run('ship', '1');
  assert.notEqual(again.status, 0);
  assert.match(again.stderr, /already been merged, but its push failed[\s\S]*Merged locally/);
  assert.deepEqual(shipOf(r), before);
  remote.allow();
  assert.equal(gIn(r.dir, 'push', '-q', 'origin', 'main').status, 0);
  assert.equal(shipOf(r), null);
  assert.doesNotMatch(r.run('ship', '1').stderr, /already been merged/, 'once pushed, a ship is refused as before');
});
