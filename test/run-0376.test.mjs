import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CLI, runRepo, until, record } from './support/run.mjs';
import { wait, runsPath, speck, tickerRepo, launched, cleanup } from './support/ticker.mjs';
import { readyAfterStop } from '../scripts/build-records.mjs';

// ---------- 0376: launch a stopped ticket again without restarting speck run ----------

const ticket = { id: '0001', path: 'speck/tickets/0001-t.md' };
const runs = dir => { const d = runsPath(dir, ''); fs.mkdirSync(d, { recursive: true }); return d; };
const setStatus = (dir, from, to) => {
  const file = path.join(dir, ticket.path);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(new RegExp(`^status: ${from}$`, 'm'), `status: ${to}`));
};
// A build of 0001 that `speck stop` ended, with the ticket's commit as it was stopped, then blocked and committed.
const stopped = r => {
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: 4242, exited: '2026-10-22T10:00:00.000Z', exit_code: null }));
  fs.writeFileSync(path.join(runs(r.dir), '0001.stopped'), JSON.stringify({ session: 's', pid: 4242, ticket_commit: r.g('log', '-1', '--format=%H', '--', ticket.path) }));
  setStatus(r.dir, 'ready', 'blocked');
  r.g('commit', '-qam', 'speck(0001): stopped');
};

test('0376 AC1, AC2: a ticket speck stop ended counts as ready again only once it is committed ready', () => {
  const r = runRepo();
  stopped(r);
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'the stop\'s own commit blocks it');
  setStatus(r.dir, 'blocked', 'ready');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'set ready, not committed');
  r.g('commit', '-qm', 'unrelated', '--allow-empty');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'a commit that doesn\'t touch the ticket');
  r.g('commit', '-qam', 'ready again');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), true);
});

test('0376 AC2: a stop that couldn\'t block the ticket holds it until it is committed again', () => {
  const r = runRepo();
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: 4242, exited: 'x' }));
  fs.writeFileSync(path.join(runs(r.dir), '0001.stopped'), JSON.stringify({ session: 's', pid: 4242, ticket_commit: r.g('log', '-1', '--format=%H', '--', ticket.path) }));
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false);
  fs.appendFileSync(path.join(r.dir, ticket.path), '\n');
  r.g('commit', '-qam', 'committed again');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), true);
});

test('0376 AC3: a build speck stop didn\'t end, or a mark that doesn\'t name it or can\'t be read, isn\'t released by this', () => {
  const r = runRepo();
  stopped(r);
  setStatus(r.dir, 'blocked', 'ready');
  r.g('commit', '-qam', 'ready again');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), true);
  const rec = path.join(runs(r.dir), '0001.json'), mark = path.join(runs(r.dir), '0001.stopped');
  fs.writeFileSync(rec, JSON.stringify({ id: '0001', session: 's2', pid: 5151, exited: 'x' })); // launched again since
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'a later build');
  fs.writeFileSync(rec, JSON.stringify({ id: '0001', session: 's', pid: 4242, exited: 'x' }));
  fs.writeFileSync(mark, JSON.stringify({ session: 's', pid: 4242 }));
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'no commit kept');
  fs.writeFileSync(mark, '{ not json');
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'unreadable');
  fs.rmSync(rec);
  assert.equal(readyAfterStop(r.dir, runs(r.dir), ticket), false, 'no record');
});

const foreman = dir => { try { return JSON.parse(fs.readFileSync(runsPath(dir, 'run.foreman.json'), 'utf8')).ready.find(x => x.id === '0001'); } catch { return null; } };
const launches = run => (run.out().match(/Launched 0001/g) || []).length;

for (const worktrees of [false, true]) {
  test(`0376 AC1-AC3: the speck run whose build speck stop ended launches it again once its ticket is set ready and committed, and only then (worktrees ${worktrees})`, async () => {
    const t = tickerRepo({ worktrees: String(worktrees) });
    const run = await launched(t, worktrees ? { START: CLI } : {});
    const at = worktrees ? t.build('0001').worktree : t.dir; // where the build keeps its ticket
    try {
      assert.equal(speck(t.dir, 'stop', '0001').status, 0);
      assert.ok(await until(() => Object.hasOwn(record(t.dir, '0001'), 'exited')), run.out());
      await wait(300); // checks since the stop, so what the run says is about the blocked ticket
      // AC2: set ready again but not committed: still not launched, and still told to set it ready and commit it.
      setStatus(at, 'blocked', 'ready');
      await wait(300);
      assert.ok(await until(() => foreman(t.dir)?.kind === 'stopped'), JSON.stringify(foreman(t.dir)));
      assert.match(foreman(t.dir).why, /set it ready again and commit it/);
      assert.equal(launches(run), 1, `AC2: not launched before the commit: ${run.out()}`);
      // AC1: committed, so the same speck run launches it.
      t.g('-C', at, 'commit', '-qam', 'ready again');
      assert.ok(await until(() => launches(run) === 2), run.out());
      // AC3: that build ends with the ticket still ready, and speck stop didn't end it: it isn't launched a third time.
      t.finish();
      assert.ok(await until(() => Object.hasOwn(record(t.dir, '0001'), 'exited')), run.out());
      await wait(400); // several checks
      assert.equal(launches(run), 2, run.out());
    } finally { await cleanup(t, run)(); }
  });
}
