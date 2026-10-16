// 0244: a ship refused because the tests fail on the ticket as it would land, while the base branch's own tests pass,
// names both possible causes: the ticket's own change, or it with the base branch's newer changes.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shipRepo, runIn } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// TAP naming a failing test, then a failing exit, on the ticket's change (shared.txt) with main's newer change (other.txt).
const failsLanded = "if grep -q feature shared.txt && grep -q moved other.txt; then printf 'TAP version 13\\nnot ok 1 - widget adds up\\nok 2 - other thing\\n1..2\\n'; exit 1; fi";

const mainMoves = r => {
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'moved\n');
  r.g('commit', '-qam', 'main moves on');
};

// auto_ship on, so a ship started with --auto gets as far as the tests.
const autoShipOn = r => {
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
};

const BOTH = /main's own tests pass, so the tests failed on this ticket as it would land, because of its own change or because of it with main's newer changes\./;

test('0244 AC1: a refused ship on a moved base names both causes, the failing tests and what to do', () => {
  const r = shipRepo({ test: failsLanded });
  mainMoves(r);
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, BOTH);
  assert.match(res.stderr, /Failing tests: widget adds up\./);
  assert.match(res.stderr, /Merge main's newer changes into the ticket, fix the failing tests, get it reviewed, then ship again\./);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0244 AC2: it no longer says "fail together", and an auto-ship still exits 16', () => {
  const r = shipRepo({ test: failsLanded });
  autoShipOn(r);
  mainMoves(r);
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.match(res.stderr, BOTH);
  assert.doesNotMatch(res.stderr, /fail together/);
});

test('0244 AC2: when main hasn\'t moved on, the message is as before', () => {
  const r = shipRepo({ test: "printf 'TAP version 13\\nnot ok 1 - lonely test\\n1..1\\n'; grep -q base shared.txt" });
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /main's tests pass, so the failure comes from this ticket's change\. Failing tests: lonely test\./);
  assert.doesNotMatch(res.stderr, BOTH);
});

test('0244 AC2: when main\'s own tests fail too, it still exits 14 with the same message', () => {
  const r = shipRepo({ test: 'grep -q moved other.txt && exit 1; true' });
  autoShipOn(r);
  mainMoves(r);
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 14, res.stderr + res.stdout);
  assert.match(res.stderr, /and main's own tests are failing too, so this isn't the ticket's fault\. Nothing was shipped\. Fix main, then ship again\./);
  assert.doesNotMatch(res.stderr, BOTH);
});

test('0244 AC3: the brief says the same as the message', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(brief, /If they fail but the base branch's own tests pass, ship says the failure comes from the ticket's change or, when the base branch has moved on, that the tests failed on the ticket as it would land, because of its own change or because of it with the base branch's newer changes, and to merge the base branch's newer changes into the ticket, fix the failing tests, get it reviewed, then ship again\. Either way it names the failing tests when the output is TAP\./);
  assert.doesNotMatch(brief, /fail together/);
});
