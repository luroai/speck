// 0677: a passing `speck test --files` or `--related` run is recorded against the code as it stands in the checkout, the
// test command and the test files, so a later run with nothing changed prints that result instead of running again.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env as shipEnv, gIn } from './support/ship.mjs';
import { write } from './support/related.mjs';

const env = Object.fromEntries(Object.entries(shipEnv).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));
const REUSED = /^Reusing the passing test result from \d{4}-\d\d-\d\d \d\d:\d\d\b/m;

// A test file that adds a line to $COUNT_0677 each time it runs, and fails while $FAIL_0677 names a file that exists.
const COUNTED = `import { test } from 'node:test';
import fs from 'node:fs';
test('counted', () => {
  fs.appendFileSync(process.env.COUNT_0677, 'ran\\n');
  if (process.env.FAIL_0677 && fs.existsSync(process.env.FAIL_0677)) throw new Error('told to fail');
});
`;

// A committed repo with speck set up, `node --test {files}` and two counted test files, on a branch off main.
function counted() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0677-')));
  const out = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0677-count-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  const speck = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: { ...env, COUNT_0677: path.join(out, 'count'), FAIL_0677: path.join(out, 'fail') }, timeout: 60_000, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(speck('init', '--skip-checks').status, 0);
  assert.equal(speck('config', 'set', 'commands.test_files', 'node --test {files}').status, 0);
  write(dir, 'scripts/code.mjs', 'export const a = 1;\n');
  write(dir, 'test/a.test.mjs', `${COUNTED}// '../scripts/code.mjs'\n`);
  write(dir, 'test/b.test.mjs', COUNTED);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  gIn(dir, 'checkout', '-qb', 'feature');
  const runs = () => { try { return fs.readFileSync(path.join(out, 'count'), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  const failing = on => on ? fs.writeFileSync(path.join(out, 'fail'), '') : fs.rmSync(path.join(out, 'fail'), { force: true });
  const inDir = (cwd, a, opts = {}) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env: { ...env, COUNT_0677: path.join(out, 'count'), FAIL_0677: path.join(out, 'fail') }, ...opts });
  return { dir, speck, runs, failing, inDir };
}

test('0677 AC1, AC2: a passing --files run is reused, with its output and when it ran, by the same run with uncommitted changes', () => {
  const r = counted();
  write(r.dir, 'scripts/code.mjs', 'export const a = 2;\n'); // uncommitted
  write(r.dir, 'scripts/new.mjs', 'export const b = 1;\n'); // untracked
  const first = r.speck('test', '--files', 'test/a.test.mjs');
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.doesNotMatch(first.stdout, REUSED);
  assert.equal(r.runs(), 1);
  const again = r.speck('test', '--files', 'test/a.test.mjs');
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.match(again.stdout, REUSED);
  assert.match(again.stdout, /^ok 1 - counted/m, 'the recorded output is printed');
  assert.equal(r.runs(), 1, 'the tests did not run again');
});

test('0677 AC1, AC3: an untracked file that git does not ignore counts as code; an ignored one does not', () => {
  const r = counted();
  write(r.dir, '.gitignore', 'ignored/\n'); gIn(r.dir, 'add', '.gitignore'); gIn(r.dir, 'commit', '-qm', 'ignore');
  write(r.dir, 'scripts/new.mjs', 'one\n');
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  write(r.dir, 'ignored/x.txt', 'whatever\n');
  assert.match(r.speck('test', '--files', 'test/a.test.mjs').stdout, REUSED);
  write(r.dir, 'scripts/new.mjs', 'two\n');
  const changed = r.speck('test', '--files', 'test/a.test.mjs');
  assert.equal(changed.status, 0);
  assert.doesNotMatch(changed.stdout, REUSED);
  assert.equal(r.runs(), 2);
});

test('0677 AC2: another worktree with the same code reuses it, without waiting for a turn', () => {
  const r = counted();
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  const other = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0677-wt-'))), 'wt');
  gIn(r.dir, 'worktree', 'add', '-q', '--detach', other, 'HEAD');
  // Every turn held, by this test's own process, which stays alive.
  const turns = path.join(r.dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(turns, { recursive: true });
  assert.equal(r.speck('config', 'set', 'max_parallel_tests', '1').status, 0);
  const held = path.join(turns, 'slot-0.g0.lock');
  fs.writeFileSync(held, JSON.stringify({ pid: process.pid, cwd: r.dir, run: 'held' }));
  let res;
  try { res = r.inDir(other, ['test', '--files', 'test/a.test.mjs'], { timeout: 10_000 }); } finally { fs.rmSync(held, { force: true }); }
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, REUSED);
  assert.doesNotMatch(res.stdout, /Waiting for/);
  assert.equal(res.signal, null, 'it did not wait for the held turn');
  assert.equal(r.runs(), 1);
});

test('0677 AC2: a passing --related run is reused', () => {
  const r = counted();
  write(r.dir, 'scripts/code.mjs', 'export const a = 2;\n');
  const first = r.speck('test', '--related', 'test/b.test.mjs');
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(r.runs(), 2);
  const again = r.speck('test', '--related', 'test/b.test.mjs');
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.match(again.stdout, REUSED);
  assert.equal(r.runs(), 2);
});

test('0677 AC3: a change outside speck/ or to the test files runs them; a change under speck/ does not', () => {
  const r = counted();
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  write(r.dir, 'speck/ideas/note.md', 'an idea\n');
  assert.match(r.speck('test', '--files', 'test/a.test.mjs').stdout, REUSED);
  assert.equal(r.runs(), 1);
  write(r.dir, 'scripts/code.mjs', 'export const a = 3;\n');
  assert.doesNotMatch(r.speck('test', '--files', 'test/a.test.mjs').stdout, REUSED);
  assert.equal(r.runs(), 2);
  write(r.dir, 'test/a.test.mjs', `${COUNTED}// changed\n`);
  assert.doesNotMatch(r.speck('test', '--files', 'test/a.test.mjs').stdout, REUSED);
  assert.equal(r.runs(), 3);
  assert.doesNotMatch(r.speck('test', '--files', 'test/a.test.mjs', 'test/b.test.mjs').stdout, REUSED, 'other test files');
  assert.equal(r.runs(), 5);
});

test('0677 AC3: a failure is never reused, and a failing run stops an earlier pass being reused', () => {
  const r = counted();
  r.failing(true);
  assert.notEqual(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  assert.notEqual(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  assert.equal(r.runs(), 2, 'a failure ran both times');
  r.failing(false);
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  r.failing(true);
  assert.notEqual(r.speck('test', '--fresh', '--files', 'test/a.test.mjs').status, 0);
  r.failing(false);
  const after = r.speck('test', '--files', 'test/a.test.mjs');
  assert.equal(after.status, 0);
  assert.doesNotMatch(after.stdout, REUSED);
  assert.equal(r.runs(), 5);
});

test('0677 AC4: --fresh with --files or --related always runs the tests', () => {
  const r = counted();
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  const fresh = r.speck('test', '--fresh', '--files', 'test/a.test.mjs');
  assert.equal(fresh.status, 0, fresh.stdout + fresh.stderr);
  assert.doesNotMatch(fresh.stdout, REUSED);
  assert.equal(r.runs(), 2);
  write(r.dir, 'scripts/code.mjs', 'export const a = 2;\n');
  assert.equal(r.speck('test', '--related').status, 0);
  assert.equal(r.runs(), 3);
  const related = r.speck('test', '--fresh', '--related');
  assert.equal(related.status, 0, related.stdout + related.stderr);
  assert.doesNotMatch(related.stdout, REUSED);
  assert.equal(r.runs(), 4);
});

test('0677 AC1, AC4: the brief\'s speck test row gives the --fresh commands for --files and --related', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck test` |'));
  for (const cmd of ['speck test --fresh --files <file>…', 'speck test --fresh --related']) assert.ok(row.includes(`\`${cmd}\``), cmd);
});

test('0677 AC2: --fresh may also come just after --files or --related; anywhere else it is refused', () => {
  const r = counted();
  assert.equal(r.speck('test', '--files', 'test/a.test.mjs').status, 0);
  const res = r.speck('test', '--files', '--fresh', 'test/a.test.mjs');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.doesNotMatch(res.stdout, REUSED);
  assert.equal(r.runs(), 2);
  const bad = r.speck('test', '--fresh', '--recorded');
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /Usage: speck test .*with --fresh first/);
  assert.doesNotMatch(bad.stderr, /^\s+at /m);
});

test('0677 AC2 F1: a reused run prints all of a long run\'s output, its start as well as its end', () => {
  const r = counted();
  write(r.dir, 'test/long.test.mjs', `${COUNTED}console.log('START-0677');\nconsole.log('x'.repeat(1_200_000));\nconsole.log('END-0677');\n`);
  const first = r.speck('test', '--files', 'test/long.test.mjs');
  assert.equal(first.status, 0, first.stderr);
  const again = r.speck('test', '--files', 'test/long.test.mjs');
  assert.match(again.stdout, REUSED);
  assert.equal(r.runs(), 1);
  assert.ok(again.stdout.includes('START-0677') && again.stdout.includes('END-0677'));
  assert.ok(again.stdout.length > first.stdout.length - 1000, 'nothing was cut');
});
