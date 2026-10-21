// 0355: a document task never ships by itself, and shipping it files it as done without running the tests.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { shipOrder } from '../scripts/ship-queue.mjs';
import { runIn, shipRepo } from './support/ship.mjs';
import { docRepo, DOC_BRANCH } from './support/doc-ship.mjs';

// A test command that leaves a mark in the main checkout when it runs, and fails, so a ship that ran it can't pass.
const MARK = 'touch "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/tests-ran"; false';
const statusOf = (cwd, id = '0001') => JSON.parse(runIn(cwd, 'status', '--json').stdout).tickets.find(t => t.id === id);

test('0355 AC1: autoShipWhyNot holds back a document task whatever auto_ship and auto_ship_risk say', () => {
  for (const cfg of [{ auto_ship: true, auto_ship_risk: ['low', 'high'] }, { auto_ship: false }, { auto_ship: true, auto_ship_risk: [] }]) {
    const why = autoShipWhyNot(cfg, '0007', 'low', [], 'document');
    assert.match(why, /0007 is a document task, and a document task waits for you to ship it/, JSON.stringify(cfg));
  }
  assert.equal(autoShipWhyNot({ auto_ship: true, auto_ship_risk: ['low'] }, '0007', 'low', [], 'code'), '');
  assert.equal(autoShipWhyNot({ auto_ship: true, auto_ship_risk: ['low'] }, '0007', 'low', []), '', 'no task is a code ticket');
});

test('0355 AC1: speck ship --auto refuses a document task, saying it waits for you, and the ship queue skips it', () => {
  const r = docRepo({ auto: true });
  const before = { main: r.sha('main'), branch: r.sha(DOC_BRANCH) };
  const out = r.run('ship', '1', '--auto');
  assert.equal(out.status, 12, out.stdout + out.stderr);
  assert.match(out.stderr, /Not shipping automatically: ticket 0001 is a document task, and a document task waits for you to ship it\./);
  assert.deepEqual({ main: r.sha('main'), branch: r.sha(DOC_BRANCH) }, before, 'nothing shipped');
  assert.equal(r.statusIn(r.wt), 'approved');
  const t = statusOf(r.dir);
  assert.equal(t.status, 'approved');
  assert.equal(t.auto_ship, false, 'speck status --json says auto_ship won\'t ship it');
  assert.deepEqual(shipOrder([t]), [], 'so the ship queue never picks it');
});

test('0355 AC2: speck ship merges a document task that changes only speck/ and files it as done, without running the tests', () => {
  const r = docRepo({ test: MARK });
  const out = r.run('ship', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(!fs.existsSync(path.join(r.dir, 'tests-ran')), 'the test command never ran');
  assert.doesNotMatch(out.stdout, /Running tests/);
  assert.equal(r.statusIn(r.dir), 'done');
  assert.ok(fs.existsSync(path.join(r.dir, 'speck/tickets/done/0001-write-a-pricing-plan.md')), 'filed as done on main');
  assert.equal(r.sha(DOC_BRANCH), '', 'its branch is gone');
});

test('0355 AC3: speck ship refuses a document task whose branch changes files outside speck/, naming them, and ships nothing', () => {
  const r = docRepo({ outside: ['shared.txt', 'extra.txt'] });
  const before = { main: r.sha('main'), branch: r.sha(DOC_BRANCH) };
  const out = r.run('ship', '1');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /document task/);
  assert.match(out.stderr, /extra\.txt/);
  assert.match(out.stderr, /shared\.txt/);
  assert.deepEqual({ main: r.sha('main'), branch: r.sha(DOC_BRANCH) }, before, 'nothing shipped');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0355 AC4: a code ticket still runs the tests when it ships, and still auto-ships', () => {
  const failing = shipRepo({ test: 'false' });
  const out = failing.run('ship', '1');
  assert.notEqual(out.status, 0, 'a failing test command stops a code ticket');
  assert.match(out.stdout, /Running tests: false/);
  assert.equal(failing.statusIn(failing.wt), 'approved');
  const passing = shipRepo();
  const ok = passing.run('ship', '1');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.equal(passing.statusIn(passing.dir), 'done');
});

test('0355 AC1, AC3: the brief says a document task never auto-ships and ships only files under speck/', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const gate = brief.split('\n').find(l => l.startsWith('4. **Humans hold two gates.**'));
  assert.match(gate, /document task/);
  const ship = brief.split('\n').find(l => l.startsWith('| `/speck-ship <id>`'));
  assert.match(ship, /document task/);
  assert.match(ship, /`outputs\/`/);
  assert.match(ship, /`speck\/`/);
});
