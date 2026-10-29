// 0552: in pull request mode, a ship refused because a file under speck/ holds a private word or the home folder's path
// (exit 17) is handed back to its build with the private-words steps, as the local ship queue does.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openAndKeep } from '../scripts/pull-request.mjs';
import { prQueue } from '../scripts/pr-queue.mjs';
import { BRANCH } from './support/ship.mjs';
import { prRepo } from './support/pr.mjs';
import { gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv);

const URL1 = 'https://github.com/o/r/pull/1';

function opened() {
  const r = prRepo({ config: ['auto_ship: true'] });
  openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  return r;
}

// The queue with its look and ship stood in for: each ship exits `code`, writing `line` last. Each check is a look
// period after the one before, so the queue may look at the pull request again every time.
function queue(r, code, line, { waiting = () => false, key = () => 'k' } = {}) {
  const ships = [], handed = [], said = [];
  let time = 0;
  const q = prQueue(r.dir, r.cfg, {
    say: s => said.push(s), lookMs: 1000, now: () => (time += 1000), look: () => ({ state: 'OPEN', key: key() }),
    ship: (repo, id, log, done) => { ships.push(id); fs.writeFileSync(log, `earlier line\n${line}\n`); done(code); },
    launch: () => assert.fail('no pull request to open'),
    handBack: h => handed.push(h), waiting,
  });
  return { q, ships, handed, said };
}
const approved = [{ id: '0001', status: 'approved', build_running: false, auto_ship: true, pull_request: { url: URL1, error: null } }];
const PRIVATE = 'speck/tickets/0001-x.md, line 4, holds one of your private words, so 0001 wasn\'t shipped. Nothing was changed.';

test('0552 AC1: a ship that exits 17 is handed back to its build as private, with the log\'s last line as the reason', () => {
  const r = opened();
  const { q, ships, handed } = queue(r, 17, PRIVATE);
  q.check(approved);
  assert.deepEqual(ships, ['0001']);
  assert.deepEqual(handed, [{ id: '0001', kind: 'private', why: PRIVATE, head: r.sha(BRANCH) }]);
});

test('0552 AC2: a ticket handed back for private words isn\'t shipped again while its hand-back is still to run', () => {
  const r = opened();
  let pending = false, n = 0;
  const { q, ships, handed } = queue(r, 17, PRIVATE, { waiting: id => pending && id === '0001', key: () => `k${n++}` });
  q.check(approved);
  assert.equal(handed.length, 1);
  pending = true;
  q.check(approved); // its pull request looks different now, but the hand-back is still to run
  assert.deepEqual(ships, ['0001']);
});

test('0552 AC3: exit 13 is still handed back as a conflict, and other refusals aren\'t handed back but tried again once something changes', () => {
  const r = opened();
  const conflict = queue(r, 13, 'conflicts');
  conflict.q.check(approved);
  assert.deepEqual(conflict.handed, [{ id: '0001', kind: 'conflict', why: 'conflicts', head: r.sha(BRANCH) }]);

  for (const code of [1, 12, 14, 16]) {
    let k = 'k';
    const { q, ships, handed, said } = queue(r, code, 'refused', { key: () => k });
    q.check(approved);
    assert.deepEqual(handed, [], `exit ${code} isn't handed back`);
    assert.match(said.at(-1), /^0001 didn't ship: refused speck run tries again once its pull request, main or its branch changes\.$/);
    q.check(approved);
    assert.deepEqual(ships, ['0001'], `exit ${code}: not tried again while nothing has changed`);
    k = 'k2';
    q.check(approved);
    assert.deepEqual(ships, ['0001', '0001'], `exit ${code}: tried again once its pull request changed`);
  }
});
