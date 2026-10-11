// 0117: test/speck.test.mjs is split into smaller files by area, so node --test runs them in parallel.
// Run on its own with `node --test test/split-0117.check.mjs`. It sits outside the suite (test/*.test.mjs) because
// 0117 AC2 has the suite keep the same number of tests as before the split.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST = path.join(ROOT, 'test');
const AREAS = ['core', 'review', 'review-command', 'reviewing', 'ship', 'worktrees', 'close', 'ticket-file', 'cancel', 'skills', 'ideas', 'status-json'];
const read = f => fs.readFileSync(path.join(TEST, f), 'utf8');

// Each top-level test, from its `test(` line to the first `});` line at the start of a line after it.
const testBlocks = text => [...text.matchAll(/^test\(.*?^\}\);$/gms)].map(m => m[0]);
const testName = block => block.match(/^test\((['"`])((?:\\.|(?!\1).)*)\1/)[2];
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
// The test files on each side of the split: the commit that removed test/speck.test.mjs and the one before it,
// or HEAD and the working tree until that commit is made. Null when the history isn't there, as in a shallow clone.
function split() {
  const removed = git('log', '--diff-filter=D', '-1', '--format=%H', '--', 'test/speck.test.mjs').stdout.trim();
  const before = git('show', `${removed || 'HEAD'}${removed ? '^' : ''}:test/speck.test.mjs`);
  if (before.status !== 0) return null;
  const after = AREAS.map(area => removed ? git('show', `${removed}:test/${area}.test.mjs`).stdout : read(`${area}.test.mjs`));
  return { before: before.stdout, after };
}
const sides = split();

test('AC1: test/speck.test.mjs is gone, and its area files have no more than 30 tests each', () => {
  assert.equal(fs.existsSync(path.join(TEST, 'speck.test.mjs')), false);
  for (const area of AREAS) {
    const n = testBlocks(read(`${area}.test.mjs`)).length;
    assert.ok(n > 0 && n <= 30, `${area}.test.mjs has ${n} tests`);
  }
});

test('AC2: every test from test/speck.test.mjs went into an area file, word for word, and none was lost or doubled', { skip: !sides && 'needs the git history of this repo' }, () => {
  const before = testBlocks(sides.before);
  const after = sides.after.flatMap(testBlocks);
  assert.equal(before.length, 171);
  assert.equal(after.length, before.length);
  assert.deepEqual([...after].sort(), [...before].sort());
  assert.equal(new Set(after.map(testName)).size, new Set(before.map(testName)).size, 'names stay as distinct as before');
});

test('AC3: helpers shared between area files live in test/support/speck.mjs and are not copied into any of them', () => {
  const declared = text => [...text.matchAll(/^(?:export )?(?:const|let|function) ([\w$]+)/gm)].map(m => m[1]);
  const shared = new Set(declared(read('support/speck.mjs')));
  assert.ok(['ROOT', 'CLI', 'fm', 'gitEnv', 'reviewRepo', 'shipRepo', 'startRepo'].every(n => shared.has(n)));
  const seen = new Map();
  for (const area of AREAS) {
    const text = read(`${area}.test.mjs`);
    for (const name of declared(text)) {
      assert.ok(!shared.has(name), `${area}.test.mjs declares ${name} again instead of importing it from test/support/speck.mjs`);
      assert.ok(!seen.has(name), `${name} is declared in both ${seen.get(name)} and ${area}.test.mjs`);
      seen.set(name, `${area}.test.mjs`);
    }
    const imported = (text.match(/^import \{ ([^}]+) \} from '\.\/support\/speck\.mjs';$/m) || [, ''])[1].split(', ').filter(Boolean);
    for (const name of imported) assert.ok(shared.has(name), `${area}.test.mjs imports ${name}, which test/support/speck.mjs does not export`);
  }
});
