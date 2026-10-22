// 0377: a test that fails in a ship's run and passes when its file is run once more is a chance failure: the ship's
// refusal doesn't name it, and it isn't what hands the ticket back to its build.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, runIn } from './support/ship.mjs';
import { failingTests, RETRY_NOTE } from '../scripts/tap.mjs';

// TAP output for `lines`, each failing one with a location in shared.txt, so the retry has a file to run.
const tapText = lines => ['TAP version 13', ...lines.flatMap((l, i) => {
  const line = l.replace(/^(not ok|ok)/, `$1 ${i + 1}`);
  return l.startsWith('not ok') ? [line, '  ---', '  location: shared.txt:1:1', '  ...'] : [line];
}), `1..${lines.length}`].join('\n') + '\n';

// A full run's output `first`, then the run of its failing tests' files once more, `again`, as a ship's run keeps it.
const retried = (first, again) => `${tapText(first)}${RETRY_NOTE}node --test test/a.test.mjs\n${tapText(again)}`;

// A shell command printing tapText(lines), exiting 1 when any of them fails.
const print = lines => `printf '${tapText(lines).replaceAll('\n', '\\n')}'; exit ${lines.some(l => l.startsWith('not ok')) ? 1 : 0}`;

// An approved ticket with auto_ship on, whose full run prints `base` on main and `ticket` where the ticket's change is,
// and whose run of the failing tests' files once more prints `baseAgain` and `ticketAgain` the same way.
function autoRepo({ base, ticket, baseAgain, ticketAgain }) {
  const pick = (b, t) => `if grep -q feature shared.txt; then ${print(t)}; else ${print(b)}; fi`;
  const r = shipRepo({ test: pick(base, ticket) });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true')
    .replace(/^  test_files:.*$/m, `  test_files: ${JSON.stringify(`true {files}; ${pick(baseAgain, ticketAgain)}`)}`));
  r.g('commit', '-qam', 'config');
  return r;
}

const BLAMED = /and main's own tests are failing too, so this isn't the ticket's fault\. Nothing was shipped\. Fix main, then ship again\./;

test('0377 AC1: a failing test that passes on the second try isn\'t named among the failing tests', () => {
  const text = retried(['not ok - readme names it', 'not ok - widget adds up', 'ok - export works'], ['not ok - readme names it', 'ok - widget adds up']);
  assert.deepEqual(failingTests(text), ['readme names it']);
});

test('0377 AC1: two failing tests of one name need two passes on the second try to both be left out', () => {
  assert.deepEqual(failingTests(retried(['not ok - adds up', 'not ok - adds up'], ['ok - adds up', 'not ok - adds up'])), ['adds up']);
  assert.deepEqual(failingTests(retried(['not ok - adds up', 'not ok - adds up'], ['ok - adds up', 'ok - adds up'])), []);
});

test('0377 AC1: a run whose command runs two suites, with no second try, names the failing tests of both', () => {
  const text = tapText(['not ok - adds up', 'ok - export works']) + tapText(['ok - adds up', 'not ok - export works']);
  assert.deepEqual(failingTests(text), ['adds up', 'export works']);
});

test('0377 AC1: with main failing, a chance failure doesn\'t hand the ticket back, and main is blamed', () => {
  const r = autoRepo({
    base: ['not ok - readme names it', 'ok - widget adds up'], baseAgain: ['not ok - readme names it', 'ok - widget adds up'],
    ticket: ['not ok - readme names it', 'not ok - widget adds up'], ticketAgain: ['not ok - readme names it', 'ok - widget adds up'],
  });
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 14, res.stderr + res.stdout);
  assert.match(res.stderr, BLAMED);
  assert.doesNotMatch(res.stderr, /widget adds up/);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0377 AC2: a test failing on both tries is still named, and still hands the ticket back when main passes it', () => {
  const text = retried(['not ok - readme names it', 'not ok - widget adds up'], ['not ok - readme names it', 'not ok - widget adds up']);
  assert.deepEqual(failingTests(text), ['readme names it', 'widget adds up']);
  const r = autoRepo({
    base: ['not ok - readme names it', 'ok - widget adds up'], baseAgain: ['not ok - readme names it', 'ok - widget adds up'],
    ticket: ['not ok - readme names it', 'not ok - widget adds up'], ticketAgain: ['not ok - readme names it', 'not ok - widget adds up'],
  });
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.match(res.stderr, /fails tests that pass on main/);
  assert.match(res.stderr, /Failing tests: widget adds up\./);
});

test('0377 AC2: a test failing on both tries hands the ticket back when main\'s tests pass', () => {
  const r = autoRepo({
    base: ['ok - widget adds up', 'ok - export works'], baseAgain: ['ok - widget adds up'],
    ticket: ['not ok - widget adds up', 'not ok - export works'], ticketAgain: ['not ok - widget adds up', 'ok - export works'],
  });
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 16, res.stderr + res.stdout);
  assert.match(res.stderr, /main's own tests pass/);
  assert.match(res.stderr, /Failing tests: widget adds up\./);
  assert.doesNotMatch(res.stderr, /export works/);
});

test('0377 AC3: when every failing test passes on the second try, the ship counts the run as passed', () => {
  const r = autoRepo({
    base: ['ok - widget adds up'], baseAgain: ['ok - widget adds up'],
    ticket: ['not ok - widget adds up', 'ok - export works'], ticketAgain: ['ok - widget adds up'],
  });
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.g('show', 'main:shared.txt'), 'feature');
});
