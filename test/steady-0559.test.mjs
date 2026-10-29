import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BUSY_MS, waitFor } from './support/run.mjs';
import { testBody } from './support/quick-run.mjs';

// ---------- 0559: steady the other tests of speck run's switch under a busy run ----------

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
// The tests this ticket steadies: whole files, or the named tests in one.
const STEADIED = [
  ['run-0247.test.mjs', ['0247 AC1, AC3:', '0247 AC3:', '0247 AC1, AC2:']],
  ['run-switch-0301.test.mjs'],
  ['run-lock-0321.test.mjs'],
  ['seen-builds-0300.test.mjs', ["0300 AC5: speck run doesn\\'t take a build it started itself"]],
];
const steadied = () => STEADIED.flatMap(([file, names]) => names ? names.map(n => [`${file}: ${n}`, testBody(src(file), n)]) : [[file, src(file)]]);

test('0559 AC1: the steadied tests wait for each process with a time limit for a busy machine, not 8 or 20 seconds', () => {
  assert.ok(BUSY_MS >= 30000, `${BUSY_MS}`);
  for (const [where, text] of steadied()) {
    assert.doesNotMatch(text, /\buntil\(/, `${where} waits through waitFor, whose limit is BUSY_MS`);
    assert.doesNotMatch(text, /\b(8000|10000|15000|20000)\b/, `${where} names no shorter limit`);
    assert.doesNotMatch(text, /'still running'/, `${where} waits for speck run to exit through waitFor`);
  }
  // The waits all files share: speck run starting to watch, and a second speck run being refused.
  assert.match(src('support/run-switch.mjs'), /export const watching = \(run, ms = BUSY_MS\) =>/);
  assert.match(src('run-lock-0321.test.mjs'), /const again = \(dir, cli\) => spawnSync\([^\n]*timeout: BUSY_MS \}\);/);
});

test('0559 AC1: each steadied test still waits for what it checks', () => {
  for (const [where, text] of steadied().filter(([w]) => !w.endsWith('run-lock-0321.test.mjs'))) assert.match(text, /await waitFor\(/, where);
  assert.equal(src('run-lock-0321.test.mjs').match(/await waitFor\(/g)?.length >= 10, true);
});

test('0559 AC2: a wait that runs out fails its test, saying what it waited for, with the output', async () => {
  const t = Date.now();
  await assert.rejects(waitFor(() => false, 'speck run to switch to v2', () => 'what speck run said', 200), err => {
    assert.ok(err instanceof assert.AssertionError, String(err));
    assert.equal(err.message, 'waited 0.2 s for speck run to switch to v2, and it didn\'t happen.\nwhat speck run said');
    return true;
  });
  assert.ok(Date.now() - t >= 200, 'it waited the whole limit');
  await waitFor(() => true, 'nothing'); // a wait that's met passes at once
  let n = 0;
  await waitFor(() => ++n === 3, 'the third look');
  assert.equal(n, 3);
});
