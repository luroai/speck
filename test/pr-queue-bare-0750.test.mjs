// 0750: in pull request mode, speck run's pull request queue merges nothing while the main checkout's core.bare is
// true, doesn't count it as a try, and carries on once it's set back.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openAndKeep } from '../scripts/pull-request.mjs';
import { prQueue } from '../scripts/pr-queue.mjs';
import { gIn } from './support/ship.mjs';
import { prRepo } from './support/pr.mjs';
import { gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv); // the commits speck makes when the tests call it directly

const URL1 = 'https://github.com/o/r/pull/1';
const bare = (dir, on) => assert.equal(gIn(dir, 'config', 'core.bare', String(on)).status, 0);
const approved = () => [{ id: '0001', status: 'approved', build_running: false, auto_ship: true, pull_request: { url: URL1, error: null } }];

// A queue over a pull request mode repo whose approved ticket's pull request is open, with stand-ins for gh and speck ship.
function queue({ state = 'OPEN', onShip = () => 0 } = {}) {
  const r = prRepo();
  openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  const ships = [], looks = [], said = [], at = { t: 100000 };
  const q = prQueue(r.dir, r.cfg, {
    say: l => said.push(l), lookMs: 60000, now: () => at.t,
    look: id => { looks.push(id); return { state, key: 'same' }; },
    ship: (repo, id, log, done) => { ships.push(id); const code = onShip(); fs.writeFileSync(log, code ? 'The main checkout isn\'t a work tree.\n' : 'Shipped 0001.\n'); done(code); },
    launch: () => assert.fail('no pull request to open'),
  });
  return { r, q, ships, looks, said, at };
}

test('0750 AC1: while the main checkout is bare, the pull request queue merges nothing, looks at nothing and says why', () => {
  for (const state of ['OPEN', 'MERGED']) {
    const { r, q, ships, looks, said } = queue({ state });
    bare(r.dir, true);
    q.check(approved());
    q.check(approved());
    assert.deepEqual(ships, [], state);
    assert.deepEqual(looks, [], `${state}: no gh look while it's held`);
    assert.equal(said.filter(l => /core\.bare/.test(l)).length, 1, `${state}: said once: ${said.join('\n')}`);
    assert.equal(q.running(), null);
    bare(r.dir, false);
  }
});

test('0750 AC1 AC2: once core.bare is false again, the next check merges it, with nothing else changed and no wait', () => {
  const { r, q, ships, said } = queue();
  bare(r.dir, true);
  q.check(approved());
  bare(r.dir, false);
  q.check(approved());
  assert.deepEqual(ships, ['0001']);
  assert.ok(said.some(l => /work tree again/.test(l)), said.join('\n'));
  assert.ok(said.includes('Shipped 0001.'), said.join('\n'));
});

test('0750 AC1 AC2: a ship refused because the main checkout went bare as it ran isn\'t a try: set back, the next check merges it', () => {
  let n = 0;
  const { r, q, ships, said } = queue({ onShip: () => (n++ === 0 ? (bare(r.dir, true), 1) : 0) });
  q.check(approved());
  assert.deepEqual(ships, ['0001']);
  assert.ok(!said.some(l => /tries again once its pull request/.test(l)), `not counted as a try: ${said.join('\n')}`);
  q.check(approved());
  assert.deepEqual(ships, ['0001'], 'held while it is still bare');
  bare(r.dir, false);
  q.check(approved());
  assert.deepEqual(ships, ['0001', '0001'], 'tried again with nothing changed and within lookMs');
  assert.ok(said.includes('Shipped 0001.'), said.join('\n'));
});
