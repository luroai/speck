// 0323: in pull request mode, a pull request GitHub says conflicts with the base branch is refused as a conflict
// (exit 13), and speck run hands it back to its build with the conflict steps, as it does a conflict found locally.
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

function opened(opts = { config: ['auto_ship: true'] }) {
  const r = prRepo(opts);
  openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  return r;
}
const merges = r => r.gh.calls().filter(c => c.args[0] === 'pr' && c.args[1] === 'merge');

// speck ship --auto on the pull request as GitHub sees it: what it exits with and says, and that nothing changed.
function shipAs(view, opts) {
  const r = opened(opts);
  r.gh.edit(URL1, view);
  const before = r.snapshot(), remoteMain = r.remoteHas('main');
  const shipped = r.cli(r.dir, 'ship', '1', '--auto');
  assert.deepEqual(merges(r), [], 'gh never asked to merge');
  assert.deepEqual(r.snapshot(), before, 'nothing changed');
  assert.equal(r.remoteHas('main'), remoteMain);
  assert.equal(r.gh.prs()[0].state, 'OPEN');
  return shipped;
}

const CONFLICT = new RegExp(`^0001's pull request, https://github\\.com/o/r/pull/1, conflicts with origin/main on GitHub, so it wasn't merged\\. Merge origin/main into ${BRANCH}, resolve the conflicts, get the result reviewed, then ship again\\. Nothing was changed\\.$`);

test('0323 AC1: a pull request GitHub says conflicts is refused with exit 13, naming the conflict, changing nothing', () => {
  for (const view of [{ mergeable: 'CONFLICTING' }, { mergeStateStatus: 'DIRTY' }, { mergeable: 'conflicting', mergeStateStatus: 'dirty' }]) {
    const shipped = shipAs(view);
    assert.equal(shipped.status, 13, shipped.stderr);
    assert.match(shipped.stderr.trim(), CONFLICT);
  }
});

test('0323 AC1: a conflict is refused as one even when its checks are failing or it\'s waiting for a review', () => {
  const shipped = shipAs({ mergeable: 'CONFLICTING', reviewDecision: 'REVIEW_REQUIRED', statusCheckRollup: [{ name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' }] });
  assert.equal(shipped.status, 13, shipped.stderr);
  assert.match(shipped.stderr.trim(), CONFLICT);
});

// The queue with its look and ship stood in for: the ship exits `code`, writing `line` last.
function queue(r, code, line, { waiting = () => false } = {}) {
  const ships = [], handed = [];
  const q = prQueue(r.dir, r.cfg, {
    say: () => {}, lookMs: 1000, now: () => 0, look: () => ({ state: 'OPEN', key: 'k' }),
    ship: (repo, id, log, done) => { ships.push(id); fs.writeFileSync(log, `${line}\n`); done(code); },
    launch: () => assert.fail('no pull request to open'),
    handBack: h => handed.push(h), waiting,
  });
  return { q, ships, handed };
}
const approved = [{ id: '0001', status: 'approved', build_running: false, auto_ship: true, pull_request: { url: URL1, error: null } }];

test('0323 AC2: speck run hands a pull request GitHub says conflicts back to its build with the conflict steps', () => {
  const r = opened();
  const why = `0001's pull request, ${URL1}, conflicts with origin/main on GitHub, so it wasn't merged.`;
  const { q, ships, handed } = queue(r, 13, why);
  q.check(approved);
  assert.deepEqual(ships, ['0001']);
  assert.deepEqual(handed, [{ id: '0001', kind: 'conflict', why, head: r.sha(BRANCH) }]);
});

test('0323 AC2: a ticket waiting for its hand-back isn\'t shipped meanwhile', () => {
  const r = opened();
  const { q, ships } = queue(r, 0, 'Shipped 0001.', { waiting: id => id === '0001' });
  q.check(approved);
  assert.deepEqual(ships, []);
});

test('0323 AC3: a pull request GitHub can\'t merge for another reason is refused as today, and isn\'t handed back', () => {
  const failing = shipAs({ mergeable: 'MERGEABLE', statusCheckRollup: [{ name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' }] });
  assert.equal(failing.status, 1, failing.stderr);
  assert.match(failing.stderr, /can't be merged yet: its checks are failing \(test\)\. Nothing was changed\./);
  const review = shipAs({ mergeable: 'MERGEABLE', reviewDecision: 'REVIEW_REQUIRED' });
  assert.equal(review.status, 1, review.stderr);
  assert.match(review.stderr, /can't be merged yet: GitHub requires an approving review first\. Nothing was changed\./);

  const r = opened();
  for (const code of [1, 12, 14, 16]) {
    const { q, ships, handed } = queue(r, code, 'refused');
    q.check(approved);
    assert.deepEqual(ships, ['0001']);
    assert.deepEqual(handed, [], `exit ${code} isn't handed back`);
  }
});

test('0323 AC4: with ship_mode: local, speck ship merges locally and never asks GitHub, whatever it says', () => {
  const r = prRepo({ mode: 'local' });
  r.gh.set('remote', r.bare);
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.deepEqual(r.gh.calls(), [], 'gh was never run');
});
