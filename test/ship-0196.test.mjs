import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { shipRepo, CLI, BRANCH, env } from './support/ship.mjs';
import { speckProcess } from './support/cli.mjs';
import { runRepo, startRun, stopRun, until, killAll } from './support/run.mjs';
import { statusData, ticketShown } from '../scripts/speck.mjs';

// ---------- 0196: show an auto-shipping ticket as shipping from approval until it ships ----------

// The ticket's worktree with the ticket branch merged into main checked out detached, as speck ship has it while its
// tests run on the merged result (0192).
function shipTesting(r) {
  const tree = r.g('merge-tree', '--write-tree', 'main', BRANCH).split('\n')[0];
  const merged = r.g('commit-tree', tree, '-p', 'main', '-p', BRANCH, '-m', 'merged');
  r.g('-C', r.wt, 'checkout', '-q', '--detach', merged);
}

test('0196 AC2: a ticket whose worktree has its merge with the base branch checked out shows its approved copy, from there', () => {
  const r = shipRepo();
  shipTesting(r);
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.status, 'approved');
  assert.equal(t.worktree, r.wt);
  assert.deepEqual([ticketShown(r.dir, '0001').status, ticketShown(r.dir, '0001').worktree], ['approved', r.wt]);
});

test('0196 AC2: a detached worktree that isn\'t a merge of a ticket branch counts as no ticket\'s', () => {
  const r = shipRepo();
  r.g('-C', r.wt, 'checkout', '-q', '--detach', 'main');
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.worktree, null, 'read from the main checkout');
  assert.notEqual(t.status, 'approved');
});

test('0196 AC2: while speck ship runs the tests on the merged result, speck status --json gives the ticket as approved and shipping', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0196-')), 'status.json');
  const r = shipRepo({ test: `cd {main} && "${process.execPath}" "${CLI}" status --json > "${out}"` });
  const shipped = speckProcess(r.dir, env, 'ship', '1'); // found among the processes as `speck ship`
  assert.equal(shipped.status, 0, shipped.stderr);
  const t = JSON.parse(fs.readFileSync(out, 'utf8')).tickets.find(x => x.id === '0001');
  assert.equal(t.status, 'approved');
  assert.equal(t.ship.running, true);
});

test('0196 AC3: speck run started during a ship of a ready-looking ticket doesn\'t launch its build until the ship has ended', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'ready' }]] });
  const ship = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', '0001'], { detached: true, stdio: 'ignore' });
  ship.unref();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({ pid: ship.pid, started: new Date().toISOString(), auto: true }));
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 400)); // several of speck run's checks, 100ms apart
    assert.deepEqual(r.calls(), [], 'no build while the ship runs');
    killAll([ship.pid]);
    assert.ok(await until(() => r.calls().length === 1), 'launched once the ship has gone');
  } finally { killAll([ship.pid]); await stopRun(run); }
});
