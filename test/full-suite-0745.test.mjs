// 0745: when the full suite's retry passes some of the first run's failing tests, its result (latest.json) and the fix
// ticket speck run writes name only the tests that failed again on the retry.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gIn, env } from './support/ship.mjs';
import { fullSuiteQueue, fullDir, runFull, latestFull } from '../scripts/full-suite.mjs';
import { testedCode } from '../scripts/results.mjs';
import { sharedCacheDir } from '../scripts/turns.mjs';
import { loadConfig, listTickets } from '../scripts/core.mjs';

Object.assign(process.env, env); // the fix ticket is committed in the test repo

const failing = (n, name, file) => `not ok ${n} - ${name}\n  ---\n  duration_ms: 1\n  location: '${file}:1:1'\n  failureType: 'testCodeFailure'\n  ...\n`;
const passing = (n, name) => `ok ${n} - ${name}\n  ---\n  duration_ms: 1\n  ...\n`;
const tap = (...tests) => `TAP version 13\n${tests.join('')}1..${tests.length}\n`;
const FIRST = tap(failing(1, 'alpha works', 'test/alpha.test.mjs'), failing(2, 'beta works', 'test/beta.test.mjs'));

// A committed repo on main whose full suite prints FIRST and fails, and whose rerun of the failing files prints `second`.
function repo(second, watch = '') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0745-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'test'));
  for (const f of ['alpha', 'beta']) fs.writeFileSync(path.join(dir, 'test', `${f}.test.mjs`), '// a test\n');
  fs.writeFileSync(path.join(dir, 'first.tap'), FIRST);
  fs.writeFileSync(path.join(dir, 'second.tap'), second);
  const cmd = 'cat first.tap; exit 1';
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nmax_parallel_tests: 1\n${watch ? `watch: ${watch}\n` : ''}commands:\n  test: "true"\n  test_full: "${cmd}"\n  test_files: "cat second.tap; exit 1 # {files}"\n`);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  const head = gIn(dir, 'rev-parse', 'HEAD').stdout.trim();
  return { dir, cmd, head, cfg: () => loadConfig(dir) };
}

// The retry's output as a run records it after the first run's: the line saying it ran the files once more, then its TAP.
const retried = second => `${FIRST}Some tests failed: running their files once more, to tell a chance failure from a real one: cat second.tap; exit 1 # test/alpha.test.mjs test/beta.test.mjs\n${second}`;

// Records `output` as the failing full run's result for the repo's head, as a run would.
function recordFail(r, output) {
  const code = testedCode(r.dir, r.cmd);
  fs.writeFileSync(path.join(sharedCacheDir(r.dir, 'results'), `${code.key}.json`), JSON.stringify({ cmd: r.cmd, status: 1, commit: code.commit, at: new Date().toISOString(), output, root: r.dir }));
}

const quiet = fn => { const log = console.log; console.log = () => {}; try { return fn(); } finally { console.log = log; } };
const latestJson = r => JSON.parse(fs.readFileSync(path.join(fullDir(r.dir), 'latest.json'), 'utf8'));

// The fix ticket speck run writes, with watch fix, for the full run's result.
function fixTicket(r) {
  fullSuiteQueue({ repo: r.dir, readConfig: r.cfg, say: () => {}, launch: () => null }).check();
  const fixes = listTickets(r.dir).filter(t => t.fm.type === 'fix');
  assert.equal(fixes.length, 1, 'one fix ticket');
  return fixes[0].raw;
}

const SOME = tap(passing(1, 'alpha works'), failing(2, 'beta works', 'test/beta.test.mjs'));
const ALL = tap(failing(1, 'alpha works', 'test/alpha.test.mjs'), failing(2, 'beta works', 'test/beta.test.mjs'));

test('0745 AC1: a full run whose retry passes one first-run failure and fails another records only the one that failed again in latest.json', () => {
  const r = repo(SOME);
  assert.equal(quiet(() => runFull(r.dir, r.head)), 1);
  const last = latestJson(r);
  assert.equal(last.status, 1);
  assert.deepEqual(last.tests, ['beta works']);
  assert.deepEqual(latestFull(r.dir, r.cfg()).tests, ['beta works']);
});

test('0745 AC1: the fix ticket for a recorded full run whose retry passed some failures names only the test that failed again', () => {
  const r = repo(SOME, 'fix');
  recordFail(r, retried(SOME));
  assert.deepEqual(latestFull(r.dir, r.cfg()).tests, ['beta works']);
  assert.deepEqual(latestJson(r).tests, ['beta works']);
  const raw = fixTicket(r);
  assert.match(raw, /beta works/);
  assert.doesNotMatch(raw, /alpha works/);
});

test('0745 AC2: a full run whose retry fails everything that failed first records all of them in latest.json', () => {
  const r = repo(ALL);
  assert.equal(quiet(() => runFull(r.dir, r.head)), 1);
  assert.deepEqual(latestJson(r).tests, ['alpha works', 'beta works']);
});

test('0745 AC2: the fix ticket for a recorded full run whose retry failed everything again names every failing test', () => {
  const r = repo(ALL, 'fix');
  recordFail(r, retried(ALL));
  assert.deepEqual(latestFull(r.dir, r.cfg()).tests, ['alpha works', 'beta works']);
  const raw = fixTicket(r);
  assert.match(raw, /alpha works/);
  assert.match(raw, /beta works/);
});

test('0745 AC2: a full run with no retry names every failing test, as before', () => {
  const r = repo(ALL, 'fix');
  recordFail(r, FIRST);
  assert.deepEqual(latestFull(r.dir, r.cfg()).tests, ['alpha works', 'beta works']);
});
