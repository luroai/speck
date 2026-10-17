// 0264: when the base branch is failing, a ship refusal puts only the tests that also fail on the base branch down
// to the base branch. A ticket failing tests the base branch passes is handed back to its build, with them named.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, runIn } from './support/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';

// A test command printing TAP: the `base` lines on main, and the `ticket` lines where the ticket's change is
// (shared.txt says feature). It exits 1 when any line it prints is a failure.
const tap = (base, ticket) => {
  const run = all => `printf '${['TAP version 13', ...all.map((l, i) => l.replace(/^(not ok|ok)/, `$1 ${i + 1}`)), `1..${all.length}`].join('\\n')}\\n'; exit ${all.some(l => l.startsWith('not ok')) ? 1 : 0}`;
  return `if grep -q feature shared.txt; then ${run(ticket)}; else ${run(base)}; fi`;
};

// An approved ticket with auto_ship on, so a ship started with --auto gets as far as the tests.
function autoRepo(test) {
  const r = shipRepo({ test });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  return r;
}

const BLAMED = /and main's own tests are failing too, so this isn't the ticket's fault\. Nothing was shipped\. Fix main, then ship again\./;

test('0264 AC1: when every failing test also fails on main, the base branch is blamed and an auto-ship exits 14', () => {
  const both = ['not ok - readme names it', 'ok - widget adds up'];
  const r = autoRepo(tap(both, both));
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 14, res.stderr + res.stdout);
  assert.match(res.stderr, BLAMED);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0264 AC1: the same failing test on both, plus passing ones only the ticket has, still blames main', () => {
  const r = autoRepo(tap(['not ok - readme names it'], ['not ok - readme names it', 'ok - the new export test']));
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 14, res.stderr + res.stdout);
  assert.match(res.stderr, BLAMED);
});

test('0264 AC2: a failing test that passes on main hands the ticket back, naming only it, and says main is failing as well', () => {
  const r = autoRepo(tap(['not ok - readme names it', 'ok - widget adds up'], ['not ok - readme names it', 'not ok - widget adds up']));
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.doesNotMatch(res.stderr, BLAMED);
  assert.match(res.stderr, /fails tests that pass on main/);
  assert.match(res.stderr, /main's own tests are failing as well/);
  assert.match(res.stderr, /Failing tests: widget adds up\./);
  assert.doesNotMatch(res.stderr, /readme names it/);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0264 AC2: shipped by hand, it refuses with the same message and exits 1', () => {
  const r = shipRepo({ test: tap(['not ok - readme names it'], ['not ok - readme names it', 'not ok - widget adds up']) });
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /fails tests that pass on main/);
  assert.match(res.stderr, /Failing tests: widget adds up\./);
  assert.doesNotMatch(res.stderr, /readme names it/);
});

test('0264 AC3: speck run doesn\'t put shipping on hold, and hands the ticket back to its build', () => {
  const r = autoRepo(tap(['not ok - readme names it'], ['not ok - readme names it', 'not ok - widget adds up']));
  const code = runIn(r.dir, 'ship', '1', '--auto').status;
  assert.equal(code, 16);
  const said = [], launches = [], handed = [];
  const T = id => ({ id, status: 'approved', auto_ship: true, type: '', approved: '2026-10-17T10:00:00.000Z', build_running: false });
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, {
    say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, done }), handBack: h => handed.push(h),
  });
  q.check([T('0001')]);
  launches[0].done(code);
  assert.doesNotMatch(said.join('\n'), /on hold/);
  assert.deepEqual(handed.map(h => [h.id, h.kind]), [['0001', 'tests']]);
  q.check([T('0001'), T('0002')]);
  assert.deepEqual(launches.map(l => l.id), ['0001', '0002'], 'another ticket ships with no new commit on main');
});

test('0264 AC4: a test the ticket adds, missing from main, counts as passing there', () => {
  const r = autoRepo(tap(['not ok - readme names it'], ['not ok - readme names it', 'not ok - the new export test']));
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.match(res.stderr, /Failing tests: the new export test\./);
});

test('0264 AC4: only a test of the same name failing on main counts, not one in another place or a passing one', () => {
  // Main fails "adds up" under "cart" and passes "adds up" under "widget"; the ticket fails "adds up" under "widget".
  const base = "printf 'TAP version 13\\n# Subtest: cart\\n    not ok 1 - adds up\\n    1..1\\nnot ok 1 - cart\\n# Subtest: widget\\n    ok 1 - adds up\\n    1..1\\nok 2 - widget\\n1..2\\n'";
  const ticket = "printf 'TAP version 13\\n# Subtest: cart\\n    not ok 1 - adds up\\n    1..1\\nnot ok 1 - cart\\n# Subtest: widget\\n    not ok 1 - adds up\\n    1..1\\nnot ok 2 - widget\\n1..2\\n'";
  const r = autoRepo(`if grep -q feature shared.txt; then ${ticket}; else ${base}; fi; exit 1`);
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.match(res.stderr, /Failing tests: widget > adds up\./);
  assert.doesNotMatch(res.stderr, /cart/);
});
