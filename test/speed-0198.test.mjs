import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, shipRepo } from './support/speck.mjs';

// ---------- 0198: make the slowest test files quicker ----------

// The commit the build started from: the one before speck start's commit for 0198. And the five slowest test files then.
const START = spawnSync('git', ['log', '-1', '--format=%H', '--fixed-strings', '--grep', 'speck(0198): start'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim() + '^';
const FIVE = ['reap-0175', 'build-log-0176', 'panel-0177', 'ship', 'stop-0072'].map(n => `test/${n}.test.mjs`);
const then = f => spawnSync('git', ['show', `${START}:${f}`], { cwd: ROOT, encoding: 'utf8' });
const now = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// Each test's name as written, in a test( call, and each line that asserts, without its indentation.
const names = src => [...src.matchAll(/\btest\(\s*((['"`])(?:\\.|(?!\2).)*\2)/g)].map(m => m[1]).sort();
const asserts = src => src.split('\n').map(l => l.trim()).filter(l => /\bassert\b/.test(l) && !/^import /.test(l)).sort();
const count = (src, re) => (src.match(re) || []).length;
const hasStart = START !== '^' && then(FIVE[0]).status === 0;

for (const f of FIVE) {
  test(`0198 AC3: ${f} keeps every test and every assertion it had, and skips nothing more`, { skip: !hasStart && 'the commit 0198 started from isn\'t in this clone' }, () => {
    const before = then(f).stdout, after = now(f);
    assert.deepEqual(names(after), names(before), 'the same tests, by name');
    const left = asserts(after);
    for (const a of asserts(before)) {
      const i = left.indexOf(a);
      assert.ok(i >= 0, `an assertion has changed or gone: ${a}`);
      left.splice(i, 1);
    }
    for (const re of [/\bskip\b/g, /\btodo\b/g, /\bonly\b/g]) assert.equal(count(after, re), count(before, re), `${re} is used as often as before`);
  });
}

// Tests that run at the same time share the file's temporary folder: one that ends doesn't empty it under another.
describe('0198 AC3: tests a file runs at the same time keep their temporary folders', { concurrency: true }, () => {
  let quickEnded;
  const ended = new Promise(res => { quickEnded = res; });
  const kept = path.join(os.tmpdir(), 'kept-0198');
  test('0198 AC3: a slower test\'s folder is still there after a quicker one has ended', async () => {
    fs.mkdirSync(kept);
    fs.writeFileSync(path.join(kept, 'file.txt'), 'still here');
    await ended;
    await new Promise(res => setImmediate(res)); // the quicker test's afterEach has run
    assert.equal(fs.readFileSync(path.join(kept, 'file.txt'), 'utf8'), 'still here');
  });
  test('0198 AC3: a quicker test ends first', async () => {
    fs.writeFileSync(path.join(os.tmpdir(), 'quick-0198.txt'), 'quick');
    setImmediate(quickEnded);
  });
});

test('0198 AC3: once the tests that ran together have all ended, the folder is emptied', () => {
  assert.ok(!fs.existsSync(path.join(os.tmpdir(), 'kept-0198')), 'the slower test\'s folder');
  assert.ok(!fs.existsSync(path.join(os.tmpdir(), 'quick-0198.txt')), 'the quicker test\'s file');
});

test('0198 AC3: each ship repo is a copy of its own: approved on its branch, clean, and unchanged by the others', () => {
  const a = shipRepo(), b = shipRepo();
  assert.notEqual(a.dir, b.dir);
  for (const r of [a, b]) {
    assert.equal(r.status(), 'approved');
    assert.equal(r.g('status', '--porcelain'), '', 'nothing uncommitted');
    assert.equal(r.state().branch, 'speck/0001-export-bookings');
  }
  assert.equal(a.run('ship', '1').status, 0);
  assert.equal(a.status(), 'done');
  assert.equal(b.status(), 'approved', 'shipping one leaves the other as it was');
  assert.equal(b.run('ship', '1').status, 0, 'and it ships too');
  // Each kind is built once and copied, with its own settings.
  const failing = shipRepo({ test: 'exit 3' });
  assert.notEqual(failing.run('ship', '1').status, 0);
  assert.equal(shipRepo({ approve: false }).status(), 'draft');
});
