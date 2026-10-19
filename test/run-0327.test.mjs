import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runRepo, startRun, until, killAll, stopRun, env } from './support/run.mjs';
import { speck } from './support/cli.mjs';
import { markStillReady, readyAgain } from '../scripts/build-records.mjs';

// ---------- 0327: launch a ticket again once it's set ready after its build never started ----------

const runs = dir => { const d = path.join(dir, 'speck', '.cache', 'runs'); fs.mkdirSync(d, { recursive: true }); return d; };
const ticket = { id: '0001', path: 'speck/tickets/0001-t.md' };
const wait = ms => new Promise(res => setTimeout(res, ms));
// A build of 0001 that has ended, as speck run records it, with the ticket's last commit kept as it ended still ready.
const ended = (r, extra = {}) => {
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: 123, exited: '2026-10-19T10:00:00.000Z', exit_code: 0, ...extra }));
  markStillReady(runs(r.dir), '0001', r.g('log', '-1', '--format=%H', '--', ticket.path));
};
const editTicket = (r, from, to) => {
  const file = path.join(r.dir, ticket.path);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(from, to));
};

test('0327 AC1: a ticket whose build ended with it still ready is held while nothing about it changes', () => {
  const r = runRepo();
  ended(r);
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false);
  editTicket(r, 'Export button', 'The export button'); // changed but not committed: still held
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false);
  r.g('commit', '-qm', 'unrelated', '--allow-empty'); // a commit that doesn't touch the ticket
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false);
});

test('0327 AC1: a build record with no commit kept, or one that can\'t be read, holds the ticket', () => {
  const r = runRepo();
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false, 'no record');
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), '{ not json');
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false, 'unreadable');
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', pid: 1, exited: 'x' }));
  r.g('commit', '-qm', 'ready again', '--allow-empty');
  editTicket(r, 'Export button', 'The export button');
  r.g('commit', '-qam', 'edited');
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false, 'no commit kept');
});

test('0327 AC3: a change committed to the ticket with its status still ready counts as setting it ready again', () => {
  const r = runRepo();
  ended(r);
  editTicket(r, 'Export button downloads a CSV.', 'Export button downloads a CSV file.');
  r.g('commit', '-qam', 'criterion corrected');
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), true);
});

test('0327 AC5: a build ended by speck stop isn\'t released by this, however the ticket is committed since', () => {
  const r = runRepo();
  ended(r, { session: 'stopped-s', pid: 4242 });
  fs.writeFileSync(path.join(runs(r.dir), '0001.stopped'), JSON.stringify({ session: 'stopped-s', pid: 4242, ticket_commit: 'old' }));
  editTicket(r, 'Export button', 'The export button');
  r.g('commit', '-qam', 'edited');
  assert.equal(readyAgain(r.dir, runs(r.dir), ticket), false);
});

test('0327 AC2, AC4: speck run launches a ticket again, without restarting, once it is set ready again and committed', async () => {
  const r = runRepo();
  const run = startRun(r.dir);
  const foreman = () => { try { return JSON.parse(fs.readFileSync(path.join(runs(r.dir), 'run.foreman.json'), 'utf8')).ready.find(x => x.id === '0001'); } catch { return null; } };
  const stillReady = n => until(() => (run.out().match(/0001 is still ready/g) || []).length === n);
  try {
    assert.ok(await stillReady(1), run.out());
    assert.ok(await until(() => foreman()?.kind === 'unstarted'), JSON.stringify(foreman()));
    await wait(400); // several checks
    assert.equal(r.calls().length, 1, 'AC1: not launched again while nothing changes');
    // Set ready again by hand, not yet committed: it waits for that, and no longer says it won't be launched again.
    assert.equal(speck(r.dir, env, 'set', '0001', 'status', 'draft').status, 0);
    r.g('commit', '-qam', 'draft');
    editTicket(r, 'status: draft', 'status: ready');
    assert.ok(await until(() => foreman()?.kind === 'uncommitted'), JSON.stringify(foreman()));
    assert.doesNotMatch(foreman().why, /won't launch|not launch/i);
    assert.equal(r.calls().length, 1);
    r.g('commit', '-qam', 'ready again');
    assert.ok(await until(() => r.calls().length === 2), run.out());
    // Set ready again with speck set, which commits it.
    assert.ok(await stillReady(2), run.out());
    assert.equal(speck(r.dir, env, 'set', '0001', 'status', 'draft').status, 0);
    r.g('commit', '-qam', 'draft');
    assert.equal(speck(r.dir, env, 'set', '0001', 'status', 'ready').status, 0);
    assert.ok(await until(() => r.calls().length === 3), run.out());
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});
