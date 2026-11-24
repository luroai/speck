// 0726: machine_parallel_builds, saved in your home folder, caps how many builds speck run starts across every
// project of yours on this machine.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { speck } from './support/cli.mjs';
import { gitEnv, runRepo, startRun, waitFor, stopRun, killAll } from './support/run.mjs';

const tmp = name => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `speck-0726-${name}-`)));

// The environment speck runs with in these tests: your home settings in `home`, and no turn on this machine held.
function envWith(home, extra = {}) {
  const { NODE_TEST_CONTEXT, SPECK_MACHINE_TURN, ...rest } = process.env;
  return { ...rest, ...gitEnv, SPECK_HOME_SETTINGS_DIR: home, SPECK_RUN_POLL_MS: '100', ...extra };
}

const setLimit = (home, n) => {
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'config.yml'), `machine_parallel_builds: ${n}\n`);
};

// A committed git repo with speck set up (for config set / show).
function speckRepo(env) {
  const dir = tmp('repo');
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  const r = speck(dir, env, 'init', '--skip-checks');
  assert.equal(r.status, 0, r.stderr);
  spawnSync('git', ['add', '-A'], { cwd: dir, env });
  spawnSync('git', ['commit', '-qm', 'base'], { cwd: dir, env });
  return dir;
}

const buildingKeys = shown => {
  const g = JSON.parse(shown).groups.find(x => x.title === 'Building and reviewing');
  return (g?.settings || []).map(s => s.key);
};

test('0726 AC1: speck config set machine_parallel_builds saves it in the home folder, every project shows it after max_parallel_builds, and "" removes it', () => {
  const home = tmp('home');
  const { SPECK_HOME_SETTINGS_DIR, ...rest } = envWith('');
  const env = { ...rest, HOME: home }; // the real home folder's place for it, in a stand-in home folder
  const a = speckRepo(env), b = speckRepo(env);
  const set = speck(a, env, 'config', 'set', 'machine_parallel_builds', '3');
  assert.equal(set.status, 0, set.stderr);
  const file = path.join(home, '.config', 'speck', 'config.yml');
  assert.match(fs.readFileSync(file, 'utf8'), /^machine_parallel_builds: 3$/m);
  assert.equal(spawnSync('git', ['status', '--porcelain', '--ignored'], { cwd: a, encoding: 'utf8' }).stdout.split('\n').filter(l => l && !l.includes('speck/.cache/')).join('\n'), '');
  assert.equal(fs.existsSync(path.join(a, 'speck', '.cache', 'machine', 'config.yml')), false);
  for (const dir of [a, b]) {
    const shown = speck(dir, env, 'config', 'show', '--json');
    assert.equal(shown.status, 0, shown.stderr);
    const keys = buildingKeys(shown.stdout);
    const atBuilds = keys.indexOf('max_parallel_builds'), atMachine = keys.indexOf('machine_parallel_builds');
    assert.ok(atBuilds >= 0, 'max_parallel_builds is shown');
    assert.equal(atMachine, atBuilds + 1, 'machine_parallel_builds follows max_parallel_builds');
    const row = JSON.parse(shown.stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_builds');
    assert.equal(row?.value, 3, `config show in ${dir} gives it`);
    assert.match(speck(dir, env, 'config', 'show').stdout, /^ {2}machine_parallel_builds: 3 /m);
  }
  const removed = speck(b, env, 'config', 'set', 'machine_parallel_builds', '');
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.existsSync(file), false, 'with nothing else in it, the file goes');
  const row = JSON.parse(speck(a, env, 'config', 'show', '--json').stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_builds');
  assert.equal(row.value, '');
  assert.equal(row.is_default, true);
});

test('0726 AC4: a value that isn\'t a whole number of 1 or more, or --repo, is refused and changes nothing', () => {
  const home = tmp('home');
  const env = envWith(home);
  const dir = speckRepo(env);
  for (const bad of [['0'], ['-1'], ['two'], ['1.5'], ['--repo', '2'], ['--machine', '2']]) {
    const args = bad[0].startsWith('--') ? ['config', 'set', bad[0], 'machine_parallel_builds', bad[1]] : ['config', 'set', 'machine_parallel_builds', bad[0]];
    const r = speck(dir, env, ...args);
    assert.notEqual(r.status, 0, `refused: ${bad.join(' ')}`);
    assert.match(r.stderr, /machine_parallel_builds/);
    assert.doesNotMatch(r.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(fs.existsSync(path.join(home, 'config.yml')), false);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), /machine_parallel_builds/);
});

test('0726 AC4: without it, each project\'s max_parallel_builds alone applies and no build turns are kept in the home folder', async () => {
  const home = tmp('home'), env = envWith(home);
  const a = runRepo({ tickets: [['0001', {}]], max: 1 });
  const b = runRepo({ tickets: [['0001', {}]], max: 1 });
  const runA = startRun(a.dir, env);
  const runB = startRun(b.dir, env);
  try {
    await waitFor(() => a.calls().length >= 1 && b.calls().length >= 1, 'both projects to launch a build', () => `${runA.out()}\n${runB.out()}`);
    assert.ok(a.calls().every(c => c.pid) && b.calls().every(c => c.pid));
    assert.equal(fs.existsSync(path.join(home, 'build-turns')), false);
  } finally {
    await stopRun(runA); await stopRun(runB);
    killAll([...a.calls(), ...b.calls()].map(c => c.pid));
  }
});

const foremanReady = dir => {
  try {
    const f = JSON.parse(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', 'run.foreman.json'), 'utf8'));
    return Array.isArray(f.ready) ? f.ready : [];
  } catch { return []; }
};
const waitsOnMachine = dir => foremanReady(dir).some(r => /machine_parallel_builds/.test(r.why || ''));

test('0726 AC2: with it set to 1, a second project\'s speck run starts no build while the first\'s is running, then starts once it ends', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 1);
  const a = runRepo({ tickets: [['0001', {}]], max: 2 });
  const b = runRepo({ tickets: [['0001', {}]], max: 2 });
  const runA = startRun(a.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => a.calls().length >= 1, 'project A to launch', runA.out);
    const runB = startRun(b.dir, env);
    try {
      await waitFor(() => waitsOnMachine(b.dir), 'project B to record waiting for a machine slot', runB.out);
      assert.equal(b.calls().length, 0, `B launched nothing while A held the slot:\n${runB.out()}`);
      fs.writeFileSync(gate, '');
      await waitFor(() => b.calls().length >= 1, 'project B to launch once A ends', () => `${runA.out()}\n${runB.out()}`);
    } finally { await stopRun(runB); killAll(b.calls().map(c => c.pid)); }
  } finally { await stopRun(runA); killAll(a.calls().map(c => c.pid)); }
});

test('0726 AC2: with it set to 2, two projects build at once and a third waits', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 2);
  const a = runRepo({ tickets: [['0001', {}]], max: 2 });
  const b = runRepo({ tickets: [['0001', {}]], max: 2 });
  const c = runRepo({ tickets: [['0001', {}]], max: 2 });
  const runA = startRun(a.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  const runB = startRun(b.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => a.calls().length >= 1 && b.calls().length >= 1, 'A and B to launch', () => `${runA.out()}\n${runB.out()}`);
    const runC = startRun(c.dir, env);
    try {
      await waitFor(() => waitsOnMachine(c.dir), 'C to record waiting for a machine slot', runC.out);
      assert.equal(c.calls().length, 0, `C launched nothing:\n${runC.out()}`);
      fs.writeFileSync(gate, '');
      await waitFor(() => c.calls().length >= 1, 'C to launch once a slot frees', () => `${runA.out()}\n${runB.out()}\n${runC.out()}`);
    } finally { await stopRun(runC); killAll(c.calls().map(x => x.pid)); }
  } finally {
    await stopRun(runA); await stopRun(runB);
    killAll([...a.calls(), ...b.calls()].map(x => x.pid));
  }
});

test('0726 AC3: each project\'s max_parallel_builds still applies within that project', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 5);
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}]], max: 1 });
  const run = startRun(r.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => r.calls().length >= 1, 'the first build to launch', run.out);
    await new Promise(res => setTimeout(res, 400));
    assert.equal(r.calls().length, 1, `only one in the project while max_parallel_builds is 1:\n${run.out()}`);
    fs.writeFileSync(gate, '');
    await waitFor(() => r.calls().length >= 2, 'the next once the first ends', run.out);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0726: the tests\' own runs never use the real home folder\'s settings', () => {
  assert.ok(process.env.SPECK_HOME_SETTINGS_DIR, 'support/tmp.mjs points them elsewhere');
  assert.ok(!process.env.SPECK_HOME_SETTINGS_DIR.startsWith(path.join(os.homedir(), '.config')));
});

test('0726 AC1: machine_parallel_tests still shows after max_parallel_tests when both home settings exist', () => {
  const home = tmp('home'), env = envWith(home);
  const dir = speckRepo(env);
  assert.equal(speck(dir, env, 'config', 'set', 'machine_parallel_builds', '2').status, 0);
  assert.equal(speck(dir, env, 'config', 'set', 'machine_parallel_tests', '3').status, 0);
  const keys = buildingKeys(speck(dir, env, 'config', 'show', '--json').stdout);
  assert.deepEqual(
    keys.filter(k => k === 'max_parallel_builds' || k === 'machine_parallel_builds' || k === 'max_parallel_tests' || k === 'machine_parallel_tests'),
    ['max_parallel_builds', 'machine_parallel_builds', 'max_parallel_tests', 'machine_parallel_tests'],
  );
});
