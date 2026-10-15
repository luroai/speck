import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipQueue } from '../scripts/ship-queue.mjs';

// ---------- 0216: speck run's log says a merged but unpushed ship needs a push ----------

const PUSH = 'Merged locally, but pushing main to origin failed:\n! [rejected] main -> main (fetch first)\norigin got new commits on main while you were shipping. Run `git pull`, then `git push origin main`.';

// speck run's queue in a plain folder, with a stand-in for `speck ship` that ends by writing `record` (if any) as the
// ship's record, then exiting with `code`.
function shipped(code, record) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'q-'));
  const said = [];
  let end;
  const q = shipQueue(dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: s => said.push(s), launch: (repo, id, log, done) => { end = done; } });
  q.check([{ id: '0001', status: 'approved', auto_ship: true, type: '', approved: '2026-10-15T10:00:00.000Z', build_running: false }]);
  if (record) fs.writeFileSync(path.join(dir, 'speck', '.cache', 'runs', '0001.ship.json'), JSON.stringify({ pid: 999999999, auto: true, started: new Date().toISOString(), ended: new Date().toISOString(), ...record }));
  end(code);
  return said.join('\n');
}

const unpushed = () => shipped(1, { message: PUSH, unpushed: { remote: 'origin', base: 'main', sha: 'abc1234' } });

test('0216 AC1: a ship that merged but couldn\'t push is logged as merged but not pushed, with the ship\'s message', () => {
  const log = unpushed();
  assert.ok(log.includes(`0001 merged into main but wasn't pushed: ${PUSH}`), log);
  assert.match(log, /git push origin main/);
});

test('0216 AC2: a merged but unpushed ship isn\'t logged as not shipped or to be tried again', () => {
  const log = unpushed();
  assert.doesNotMatch(log, /didn't ship/);
  assert.doesNotMatch(log, /try it again/);
});

test('0216 AC3: a ship that fails before it merges is logged as today', () => {
  const log = shipped(1, { message: 'The tests failed.' });
  assert.match(log, /0001 didn't ship: The tests failed\.\nspeck run will try it again once main or its branch has a new commit\./);
  assert.doesNotMatch(log, /wasn't pushed/);
});
