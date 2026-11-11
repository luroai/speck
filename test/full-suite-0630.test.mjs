// 0630: with commands.test_full set, speck run runs it on the base branch after ships, and a failure reaches you.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gIn, env } from './support/ship.mjs';
import { speck } from './support/cli.mjs';
import { fullSuiteQueue, fullDir, fullCheckout, runFull, launchFull, RETRY_MS } from '../scripts/full-suite.mjs';
import { recordedAt, testedCode, testRun } from '../scripts/results.mjs';
import { sharedCacheDir } from '../scripts/turns.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { checkConfigValue } from '../scripts/config.mjs';

const SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts');
const TAP_FAIL = 'TAP version 13\n# Subtest: widgets\nnot ok 1 - widgets\n  ---\n  location: \'/x/test/w.test.mjs:1:1\'\n  ...\n1..1\n';

// A committed repo on main with speck/config.yml, whose full suite writes the folder it runs in to `where`, outside it.
function repo({ full = true, fail = false } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0630-')));
  const where = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'where-'))), 'where.txt');
  const cmd = `pwd >> ${where}${fail ? ' && exit 3' : ''}`;
  gIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nmax_parallel_tests: 1\ncommands:\n  test: "true"\n${full === true ? `  test_full: "${cmd}"\n` : full === '' ? '  test_full: ""\n' : ''}`);
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  const head = () => gIn(dir, 'rev-parse', 'HEAD').stdout.trim();
  const commit = text => { fs.writeFileSync(path.join(dir, 'app.txt'), text); gIn(dir, 'commit', '-qam', text); return head(); };
  const ran = () => (fs.existsSync(where) ? fs.readFileSync(where, 'utf8').trim().split('\n') : []);
  return { dir, cmd, where, head, commit, ran, cfg: () => loadConfig(dir) };
}

// Records `status` and `output` as the full run's result for the code `rev` holds, as a run would.
function recordFor(r, rev, status, output = '') {
  gIn(r.dir, 'checkout', '-q', '--detach', rev);
  try {
    const code = testedCode(r.dir, r.cmd);
    fs.writeFileSync(path.join(sharedCacheDir(r.dir, 'results'), `${code.key}.json`), JSON.stringify({ cmd: r.cmd, status, commit: code.commit, at: new Date().toISOString(), output, root: r.dir }));
  } finally { gIn(r.dir, 'checkout', '-q', 'main'); }
}

const until = async (fn, what, ms = 15000) => {
  const end = Date.now() + ms;
  while (!fn()) { if (Date.now() > end) assert.fail(`timed out waiting for ${what}`); await new Promise(res => setTimeout(res, 25)); }
};

// A queue whose launches are counted, not started.
function counted(r, say = () => {}) {
  const launches = [];
  const q = fullSuiteQueue({ repo: r.dir, readConfig: r.cfg, say, launch: (repo, commit) => { launches.push(commit); return null; } });
  return { q, launches };
}

test('0630 AC1: speck run runs commands.test_full on the base branch\'s newest commit in a checkout of its own, and records the result as speck test does', async () => {
  const r = repo();
  const said = [];
  const q = fullSuiteQueue({ repo: r.dir, readConfig: r.cfg, say: l => said.push(l) });
  const head = r.head();
  q.check();
  await until(() => recordedAt(r.dir, r.cmd, head), 'the full run\'s recorded result');
  await until(() => !fs.existsSync(path.join(fullDir(r.dir), 'running.json')), 'the run to end');
  assert.equal(recordedAt(r.dir, r.cmd, head).status, 0);
  assert.deepEqual(r.ran(), [fullCheckout(r.dir)], 'it ran once, in its own checkout');
  assert.notEqual(fullCheckout(r.dir), r.dir);
  assert.ok(!fs.existsSync(fullCheckout(r.dir)), 'its checkout is removed afterwards');
  assert.match(said.join('\n'), /Running the full suite \(commands\.test_full\) on main at [0-9a-f]{7}/);
  q.check();
  assert.equal(r.ran().length, 1, 'a commit with a recorded result isn\'t run again');
  const next = r.commit('two\n');
  q.check();
  await until(() => recordedAt(r.dir, r.cmd, next), 'the newer commit\'s result');
  await until(() => !fs.existsSync(path.join(fullDir(r.dir), 'running.json')), 'the second run to end');
  assert.equal(r.ran().length, 2);
});

test('0630 AC1: no full run starts while one is running', () => {
  const r = repo();
  fs.writeFileSync(path.join(fullDir(r.dir), 'running.json'), JSON.stringify({ pid: process.pid, commit: 'x', started: new Date().toISOString() }));
  let t = 0;
  const launches = [];
  const q = fullSuiteQueue({ repo: r.dir, readConfig: r.cfg, say: () => {}, now: () => t, launch: (repo, commit) => { launches.push(commit); return null; } });
  q.check();
  assert.deepEqual(launches, []);
  fs.rmSync(path.join(fullDir(r.dir), 'running.json'));
  q.check();
  assert.deepEqual(launches, [r.head()]);
  t = RETRY_MS - 1;
  q.check();
  assert.deepEqual(launches, [r.head()], 'one that ended without a result isn\'t started again straight away');
  t = RETRY_MS;
  q.check();
  assert.deepEqual(launches, [r.head(), r.head()], 'it is started again on the same commit once RETRY_MS has passed');
});

// Holds test turn `slot` in r's repo for about a second, with a process that isn't this one's child.
function holdTurn(r, slot) {
  const sh = spawnSync('sh', ['-c', 'sleep 1 >/dev/null 2>&1 & echo $!'], { encoding: 'utf8' });
  const pid = Number(sh.stdout.trim());
  fs.writeFileSync(path.join(sharedCacheDir(r.dir, 'tests'), `slot-${slot}.g0.lock`), JSON.stringify({ pid, cwd: '/somewhere/else' }));
}
const logged = fn => {
  const lines = [], log = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  try { return { out: fn(), lines: lines.join('\n') }; } finally { console.log = log; }
};

test('0630 AC1: a full run takes a test turn, its own, waiting while another run holds it', () => {
  const r = repo();
  holdTurn(r, 'full');
  const { out, lines } = logged(() => runFull(r.dir, r.head()));
  assert.equal(out, 0);
  assert.match(lines, /Waiting for the full suite's own turn/);
  assert.equal(recordedAt(r.dir, r.cmd, r.head()).status, 0);
});

test('0630 AC3: a full run doesn\'t wait for the max_parallel_tests turns, so it takes none a ship or build waits for', () => {
  const r = repo();
  holdTurn(r, 0);
  const start = Date.now();
  const { out, lines } = logged(() => runFull(r.dir, r.head()));
  assert.equal(out, 0);
  assert.doesNotMatch(lines, /Waiting/);
  assert.ok(Date.now() - start < 900, 'it didn\'t wait for the held turn');
});

test('0630 AC3: while a slow full run is going, a ship\'s or build\'s tests run without waiting for it', async () => {
  const r = repo();
  fs.writeFileSync(path.join(r.dir, 'speck', 'config.yml'), `base_branch: main\nmax_parallel_tests: 1\ncommands:\n  test: "true"\n  test_full: "sleep 2"\n`);
  gIn(r.dir, 'commit', '-qam', 'slow full suite');
  let ended = null;
  launchFull(r.dir, r.head(), path.join(fullDir(r.dir), 'run.log'), code => { ended = code; });
  const tests = sharedCacheDir(r.dir, 'tests');
  await until(() => fs.readdirSync(tests).some(f => /^run\..*\.started$/.test(f)), 'the full run to start its tests');
  const { out, lines } = logged(() => testRun(r.dir, r.cfg(), 'true', { reuse: 'none' }));
  assert.equal(out.status, 0);
  assert.doesNotMatch(lines, /Waiting/);
  assert.equal(ended, null, 'the full run was still going');
  await until(() => ended !== null, 'the full run to end');
  assert.equal(ended, 0);
});

test('0630 AC2: a failing full run counts under Needs you, naming its failing tests, and the log says so once per failing commit', () => {
  const r = repo();
  const first = r.head();
  recordFor(r, first, 1, TAP_FAIL);
  const said = [];
  const { q } = counted(r, l => said.push(l));
  q.check(); q.check();
  const full = q.view().full;
  assert.equal(full.commit, first);
  assert.deepEqual(full.tests, ['widgets']);
  assert.equal(said.filter(l => /failed on main/.test(l)).length, 1, said.join('\n'));
  assert.match(said.find(l => /failed on main/.test(l)), /widgets/);
  // speck status and the panel's bar read speck run's record
  const v = foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, ...q.view() }, tickets: [] });
  assert.equal(v.word, 'Needs you 1');
  assert.match(foremanLines(v).join('\n'), /full suite \(commands\.test_full\) failed on main at [0-9a-f]{7}: widgets/);
  // a newer commit with no result yet: still failing, said no more
  r.commit('two\n');
  q.check();
  assert.ok(q.view().full);
  assert.equal(said.filter(l => /failed on main/.test(l)).length, 1);
  // a newer commit that fails is said once more
  const third = r.commit('three\n');
  recordFor(r, third, 2, 'not tap\n');
  q.check(); q.check();
  assert.equal(said.filter(l => /failed on main/.test(l)).length, 2);
  assert.match(said.at(-1), /exit code 2, and its output names no failing tests/);
  // until a run on a newer commit passes
  const fourth = r.commit('four\n');
  recordFor(r, fourth, 0);
  q.check();
  assert.deepEqual(q.view(), {});
  assert.equal(foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, ...q.view() }, tickets: [] }).word, 'Idle');
});

test('0630 AC2: the last run\'s result counts while the newest commit has none, as kept by the run itself', () => {
  const r = repo({ fail: true });
  const lines = [], log = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  try { assert.equal(runFull(r.dir, r.head()), 1); } finally { console.log = log; }
  r.commit('two\n');
  const { q } = counted(r);
  q.check();
  assert.equal(q.view().full.status, 3);
});

test('0630 AC3: speck ship, builds and speck test never run commands.test_full, and nothing they do waits on it', () => {
  const uses = fs.readdirSync(SCRIPTS).filter(f => f.endsWith('.mjs') && /test_full/.test(fs.readFileSync(path.join(SCRIPTS, f), 'utf8')));
  assert.deepEqual(uses.sort(), ['config.mjs', 'full-suite.mjs', 'settings.mjs'], 'only the full run, and the settings, read it');
  const full = fs.readFileSync(path.join(SCRIPTS, 'full-suite.mjs'), 'utf8');
  for (const f of fs.readdirSync(SCRIPTS).filter(f => f.endsWith('.mjs') && f !== 'full-suite.mjs' && f !== 'run.mjs' && f !== 'foreman.mjs' && f !== 'turns.mjs'))
    assert.doesNotMatch(fs.readFileSync(path.join(SCRIPTS, f), 'utf8'), /from '\.\/full-suite\.mjs'/, `${f} doesn't use the full run`);
  // 0632: speck test --recorded reads the full suite's recorded result, and only that: it takes the command's name, never runs it.
  const turns = fs.readFileSync(path.join(SCRIPTS, 'turns.mjs'), 'utf8');
  assert.deepEqual(turns.match(/^import .* from '\.\/full-suite\.mjs';$/gm), ["import { fullCommand } from './full-suite.mjs';"]);
  assert.deepEqual(turns.match(/.*fullCommand\(.*/g).map(l => l.trim()), ['const kept = showRecordedRun(repo, cmd, fullCommand(cfg));']);
  assert.match(full, /detached: true/, 'the full run is a process of its own, which speck run doesn\'t wait for');
  // speck test runs commands.test, with commands.test_full set
  const r = repo();
  const out = speck(r.dir, env, 'test', '--fresh');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(r.ran(), []);
});

test('0630 AC3: a full run going doesn\'t hold up speck run\'s check', () => {
  const r = repo();
  let ended = null;
  const start = Date.now();
  const pid = launchFull(r.dir, r.head(), path.join(fullDir(r.dir), 'run.log'), code => { ended = code; });
  assert.ok(pid > 0);
  assert.ok(Date.now() - start < 1000, 'launching returns straight away');
  return until(() => ended !== null, 'the run to end').then(() => assert.equal(ended, 0));
});

for (const [what, full] of [['blank', ''], ['missing', false]]) {
  test(`0630 AC4: with commands.test_full ${what}, speck run runs no full suite and nothing counts`, () => {
    const r = repo({ full });
    fs.writeFileSync(path.join(fullDir(r.dir), 'latest.json'), JSON.stringify({ cmd: '', commit: r.head(), status: 1, tests: ['x'] }));
    const said = [];
    const { q, launches } = counted(r, l => said.push(l));
    q.check(); r.commit('two\n'); q.check();
    assert.deepEqual(launches, []);
    assert.deepEqual(said, []);
    assert.deepEqual(q.view(), {});
    const v = foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, ...q.view() }, tickets: [] });
    assert.equal(v.word, 'Idle');
    assert.equal(v.full, undefined);
  });
}

test('0630 AC5: speck config set commands.test_full sets it, and speck config show explains it', () => {
  assert.equal(checkConfigValue('commands.test_full', 'npm run test:all'), 'npm run test:all');
  const r = repo({ full: false });
  const set = speck(r.dir, env, 'config', 'set', 'commands.test_full', 'npm run test:all');
  assert.equal(set.status, 0, set.stdout + set.stderr);
  assert.equal(loadConfig(r.dir).commands.test_full, 'npm run test:all');
  assert.equal(loadConfig(r.dir).commands.test, 'true', 'commands.test is kept');
  const show = speck(r.dir, env, 'config', 'show', '--json');
  assert.equal(show.status, 0, show.stderr);
  const s = JSON.parse(show.stdout).groups.flatMap(g => g.settings).find(x => x.key === 'commands.test_full');
  assert.equal(s.value, 'npm run test:all');
  assert.match(s.explain, /speck run/);
  assert.match(s.explain, /base branch/);
  assert.match(s.explain, /Needs you/);
  assert.match(speck(r.dir, env, 'config', 'show').stdout, /commands\.test_full: npm run test:all/);
});

test('0630 AC1: a full run that can\'t start says so in speck run\'s log, and isn\'t started again straight away', () => {
  const r = repo();
  const said = [];
  let n = 0;
  const q = fullSuiteQueue({ repo: r.dir, readConfig: r.cfg, say: l => said.push(l), launch: (repo, commit, log, done) => { n++; done(null); return null; } });
  q.check(); q.check();
  assert.equal(n, 1);
  assert.match(said.join('\n'), /ended without a result\. speck run tries it again in 10 minutes, or sooner on a newer commit/);
  assert.ok(!fs.existsSync(path.join(fullDir(r.dir), 'running.json')));
});

test('0630 AC1: a folder that isn\'t speck\'s where the full run checks out is left alone, with a plain message', () => {
  const r = repo();
  fs.mkdirSync(fullCheckout(r.dir), { recursive: true });
  fs.writeFileSync(path.join(fullCheckout(r.dir), 'keep.txt'), 'mine');
  assert.throws(() => runFull(r.dir, r.head()), /isn't speck's full-suite checkout\. Move or remove it/);
  assert.equal(fs.readFileSync(path.join(fullCheckout(r.dir), 'keep.txt'), 'utf8'), 'mine');
  assert.deepEqual(r.ran(), []);
});

test('0630: the brief names the setting, the command that sets it, the full run\'s checkout and its log as speck has them', () => {
  const brief = fs.readFileSync(path.join(SCRIPTS, '..', 'docs', 'brief.md'), 'utf8');
  for (const fact of ['`commands.test_full`', '`speck config set commands.test_full "<command>"`', '`<repo>.worktrees/.full-suite`', '`speck/.cache/full/run.log`']) assert.ok(brief.includes(fact), fact);
  const r = repo();
  assert.equal(fullCheckout(r.dir), `${r.dir}.worktrees/.full-suite`);
  assert.equal(path.join(fullDir(r.dir), 'run.log'), path.join(r.dir, 'speck', '.cache', 'full', 'run.log'));
});
