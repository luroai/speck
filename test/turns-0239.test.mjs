// 0239: every test run speck starts takes a turn, --files included, and runs at a lower priority through nice.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLI, env } from './support/ship.mjs';

const TURNS = fileURLToPath(new URL('../scripts/turns.mjs', import.meta.url));
const WAITING = /^Waiting for a turn to run the tests/gm;
const NODE = JSON.stringify(process.execPath);
// A test command that prints its own niceness.
const PRINT_NICE = `${NODE} -e "console.log('NICE=' + require('os').getPriority())"`;
const niceIn = out => Number(out.match(/^NICE=(-?\d+)$/m)?.[1]);

// Without NODE_TEST_CONTEXT, a node --test that speck runs reports to its own stdout rather than to this test run.
const { NODE_TEST_CONTEXT, ...plainEnv } = env;
const speck = (cwd, args, extra = {}) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env: { ...plainEnv, ...extra }, timeout: 30000 });

// A committed repo with speck set up, the given commands and max_parallel_tests.
function testRepo({ cmd = 'true', files = 'node --test {files}', max = 1, add = {} } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0239-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, ['init', '--skip-checks']).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test', cmd]).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test_files', files]).status, 0);
  const file = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^max_parallel_tests:.*$/m, `max_parallel_tests: ${max}`));
  for (const [name, text] of Object.entries(add)) fs.writeFileSync(path.join(dir, name), text);
  g('add', '-A'); g('commit', '-qm', 'base');
  return dir;
}

// Holds turn `n` of the repo's queue for a process that ends by itself after `secs` seconds. Its parent shell has
// already gone, so it isn't left as a zombie that still looks alive while a spawnSync blocks the event loop.
function holdTurnFor(dir, secs, n = 0) {
  const pid = Number(spawnSync('sh', ['-c', `sleep ${secs} >/dev/null 2>&1 & echo $!`], { encoding: 'utf8' }).stdout.trim());
  const q = path.join(dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(q, { recursive: true });
  fs.writeFileSync(path.join(q, `slot-${n}.g0.lock`), JSON.stringify({ pid, cwd: '/somewhere/else' }));
  return pid;
}

const recordedResults = dir => {
  const d = path.join(dir, 'speck', '.cache', 'results');
  return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')) : [];
};

test('0239 AC1: speck test --files waits for a turn held by another run, says so once, then runs and records nothing', () => {
  const dir = testRepo({ files: 'echo ran {files}' });
  holdTurnFor(dir, 1.5);
  const started = Date.now();
  const res = speck(dir, ['test', '--files', 'a.test.mjs']);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(Date.now() - started >= 1000, 'it waited for the turn to be free');
  assert.equal(res.stdout.match(WAITING)?.length, 1, `said once that it's waiting: ${res.stdout}`);
  assert.match(res.stdout, /max_parallel_tests is 1/);
  assert.match(res.stdout, /ran a\.test\.mjs/, 'then ran the files');
  assert.ok(res.stdout.indexOf('ran a.test.mjs') > res.stdout.search(WAITING), 'after the wait');
  assert.deepEqual(recordedResults(dir), [], 'no result is recorded');
});

test('0239 AC1: speck test --files shares max_parallel_tests: with a free turn left, it doesn\'t wait', () => {
  const dir = testRepo({ files: 'echo ran {files}', max: 2 });
  holdTurnFor(dir, 5);
  const res = speck(dir, ['test', '--files', 'a.test.mjs']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, WAITING);
  assert.match(res.stdout, /ran a\.test\.mjs/);
});

test('0239 AC2: a test run started while this process holds a turn runs in that turn, never waiting on it', () => {
  const dir = testRepo();
  // With max_parallel_tests 1, a run started in the onStart of a run holding the only turn would wait for itself
  // forever if it took a turn of its own.
  const script = `
    import { runTestsInTurn } from ${JSON.stringify(TURNS)};
    const cfg = { max_parallel_tests: 1 };
    const r = runTestsInTurn(process.argv[1], cfg, 'echo outer', () => {
      const inner = runTestsInTurn(process.argv[1], cfg, 'echo inner');
      console.log('INNER=' + inner.status);
    });
    console.log('OUTER=' + r.status);`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script, dir], { encoding: 'utf8', env, timeout: 15000 });
  assert.equal(res.error, undefined, 'it didn\'t hang');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /INNER=0/);
  assert.match(res.stdout, /OUTER=0/);
  assert.doesNotMatch(res.stdout, WAITING);
});

test('0239 AC2: the retry of failing tests runs in the full run\'s turn', () => {
  // The test fails the first time and passes the second. Each time, it notes the claims on turns held then, so they
  // show whether the retry ran in the full run's turn or took one of its own.
  const flaky = `import { test } from 'node:test';
import fs from 'node:fs';
test('sometimes', () => {
  const q = 'speck/.cache/tests';
  const held = fs.readdirSync(q).filter(f => f.endsWith('.lock')).map(f => fs.readFileSync(q + '/' + f, 'utf8')).join('\\n');
  if (!fs.existsSync('first.txt')) { fs.writeFileSync('first.txt', held); throw new Error('first time'); }
  fs.writeFileSync('second.txt', held);
});
`;
  const dir = testRepo({ cmd: 'node --test flaky.test.mjs', add: { 'flaky.test.mjs': flaky, '.gitignore': 'first.txt\nsecond.txt\n' } });
  const res = speck(dir, ['test', '--fresh']);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /^Flaky: sometimes/m, 'the retry ran and passed');
  assert.doesNotMatch(res.stdout, WAITING, 'it never waited for a turn');
  const first = fs.readFileSync(path.join(dir, 'first.txt'), 'utf8');
  assert.match(first, /"run"/, 'the full run held a turn');
  assert.equal(fs.readFileSync(path.join(dir, 'second.txt'), 'utf8'), first, 'the retry ran in that same turn');
});

// A folder for PATH with only sh, git and the tools speck's test runs use in it, so nice can't be found.
function pathWithoutNice() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'bin-'));
  for (const tool of ['sh', 'git', 'mkdir', 'sleep', 'ps']) {
    const at = spawnSync('sh', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
    fs.symlinkSync(at, path.join(bin, tool));
  }
  return bin;
}

test('0239 AC3: speck test, with and without --files, runs the tests through nice when it\'s on the system', () => {
  const own = os.getPriority();
  const dir = testRepo({ cmd: PRINT_NICE, files: `${PRINT_NICE} {files}` });
  const files = speck(dir, ['test', '--files', 'x']);
  assert.equal(files.status, 0, files.stderr);
  assert.ok(niceIn(files.stdout) > own, `--files ran at a lower priority: ${files.stdout}`);
  const full = speck(dir, ['test', '--fresh']);
  assert.equal(full.status, 0, full.stderr);
  assert.ok(niceIn(full.stdout) > own, `the full run did too: ${full.stdout}`);
});

test('0239 AC3: without nice on the system, the tests run as before', () => {
  const own = os.getPriority();
  const dir = testRepo({ cmd: PRINT_NICE, files: `${PRINT_NICE} {files}` });
  const PATH = pathWithoutNice();
  const files = speck(dir, ['test', '--files', 'x'], { PATH });
  assert.equal(files.status, 0, files.stderr);
  assert.equal(niceIn(files.stdout), own, `--files ran at the usual priority: ${files.stdout}`);
  const full = speck(dir, ['test', '--fresh'], { PATH });
  assert.equal(full.status, 0, full.stderr);
  assert.equal(niceIn(full.stdout), own, `the full run did too: ${full.stdout}`);
});

test('0239 AC4: speck test --files keeps its output and exit code', () => {
  const dir = testRepo({ files: 'echo out {files}; echo err >&2; exit 3' });
  const res = speck(dir, ['test', '--files', 'a.test.mjs']);
  assert.equal(res.status, 3);
  assert.match(res.stdout, /out a\.test\.mjs/);
  assert.match(res.stderr, /^err$/m);
  assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
});

test('0239 AC4: docs/brief.md names speck test --files and nice', () => {
  const brief = fs.readFileSync(fileURLToPath(new URL('../docs/brief.md', import.meta.url)), 'utf8');
  assert.ok(brief.includes('`speck test --files <file>…`'));
  assert.ok(brief.includes('`nice`'));
});
