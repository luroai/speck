// 0678: machine_parallel_tests, saved in your home folder, limits the test runs speck starts across every project of
// yours on this machine, the full suite's included.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { speck } from './support/cli.mjs';
import { gitEnv } from './support/run.mjs';

const TURNS = pathToFileURL(fileURLToPath(new URL('../scripts/turns.mjs', import.meta.url))).href;
const MACHINE_WAIT = /^Waiting for a turn on this machine to run the tests/gm;
const REPO_WAIT = /^Waiting for a turn to run the tests: max_parallel_tests/m;
const waitsOnMachine = out => new RegExp(MACHINE_WAIT.source, 'm').test(out), waitsInRepo = out => REPO_WAIT.test(out);

// The environment speck runs with in these tests: your home settings in `home`, and no turn on this machine held.
function envWith(home, extra = {}) {
  const { NODE_TEST_CONTEXT, SPECK_MACHINE_TURN, ...rest } = process.env;
  return { ...rest, ...gitEnv, SPECK_HOME_SETTINGS_DIR: home, ...extra };
}
const tmp = name => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `speck-0678-${name}-`)));
const setLimit = (home, n) => { fs.mkdirSync(home, { recursive: true }); fs.writeFileSync(path.join(home, 'config.yml'), `machine_parallel_tests: ${n}\n`); };

// A script that runs as one test run speck starts would: it takes a turn with inTurn in <repo>, with
// max_parallel_tests <max> and lane <lane> ('' for none), prints IN TURN, then waits for the file <release> to exist
// ('' for not at all). With <nested>, it then runs itself again in its turn, as a test run its tests start, in that repo.
const SCRIPT = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-0678-')), 'turn.mjs'); // speck-keep-*: kept until the file's tests end
fs.writeFileSync(SCRIPT, `import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { inTurn } from ${JSON.stringify(TURNS)};
const [repo, max, lane, release, nested, sameProcess] = process.argv.slice(2);
const cfg = { max_parallel_tests: Number(max) };
inTurn(repo, cfg, () => {
  console.log('IN TURN ' + repo);
  while (release && !fs.existsSync(release)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  if (sameProcess) inTurn(sameProcess, cfg, () => console.log('IN TURN ' + sameProcess));
  if (nested) { const r = spawnSync(process.execPath, [process.argv[1], nested, max, '', ''], { encoding: 'utf8', timeout: 20000 }); process.stdout.write(r.stdout); process.stderr.write(r.stderr); }
}, { lane });
`);

// Starts the script in the background, collecting its output.
function start(env, repo, { max = 1, lane = '', release = '', nested = '', sameProcess = '' } = {}) {
  const child = spawn(process.execPath, [SCRIPT, repo, String(max), lane, release, nested, sameProcess], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  const run = { child, out: '', err: '', done: new Promise(resolve => child.on('exit', (code, signal) => resolve({ code, signal }))) };
  child.stdout.on('data', d => { run.out += d; });
  child.stderr.on('data', d => { run.err += d; });
  return run;
}
async function waitFor(check, what, ms = 15000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error(`Timed out waiting for ${what}`);
    await new Promise(r => setTimeout(r, 20));
  }
}
const finished = async run => { const r = await run.done; assert.equal(r.code, 0, run.err); return run.out; };
const release = file => fs.writeFileSync(file, '');

// A committed git repo with speck set up.
function speckRepo(env) {
  const dir = tmp('repo');
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  const r = speck(dir, env, 'init', '--skip-checks');
  assert.equal(r.status, 0, r.stderr);
  spawnSync('git', ['add', '-A'], { cwd: dir, env });
  spawnSync('git', ['commit', '-qm', 'base'], { cwd: dir, env });
  return dir;
}

test('0678 AC1: speck config set machine_parallel_tests saves it in your home folder, every project shows it, and "" removes it', () => {
  const home = tmp('home');
  const { SPECK_HOME_SETTINGS_DIR, ...rest } = envWith('');
  const env = { ...rest, HOME: home }; // the real home folder's place for it, in a stand-in home folder
  const a = speckRepo(env), b = speckRepo(env);
  const set = speck(a, env, 'config', 'set', 'machine_parallel_tests', '3');
  assert.equal(set.status, 0, set.stderr);
  const file = path.join(home, '.config', 'speck', 'config.yml');
  assert.match(fs.readFileSync(file, 'utf8'), /^machine_parallel_tests: 3$/m);
  // Nothing in the repo changed, committed or not.
  assert.equal(spawnSync('git', ['status', '--porcelain', '--ignored'], { cwd: a, encoding: 'utf8' }).stdout.split('\n').filter(l => l && !l.includes('speck/.cache/')).join('\n'), '');
  assert.equal(fs.existsSync(path.join(a, 'speck', '.cache', 'machine', 'config.yml')), false);
  for (const dir of [a, b]) {
    const shown = speck(dir, env, 'config', 'show', '--json');
    assert.equal(shown.status, 0, shown.stderr);
    const row = JSON.parse(shown.stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_tests');
    assert.equal(row?.value, 3, `config show in ${dir} gives it`);
    assert.match(speck(dir, env, 'config', 'show').stdout, /^ {2}machine_parallel_tests: 3 /m);
  }
  const removed = speck(b, env, 'config', 'set', 'machine_parallel_tests', '');
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.existsSync(file), false, 'with nothing else in it, the file goes');
  const row = JSON.parse(speck(a, env, 'config', 'show', '--json').stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_tests');
  assert.equal(row.value, '');
  assert.equal(row.is_default, true);
});

test('0678 AC1: a value that isn\'t a whole number of 1 or more, or --repo, is refused and changes nothing', () => {
  const home = tmp('home');
  const env = envWith(home);
  const dir = speckRepo(env);
  for (const bad of [['0'], ['-1'], ['two'], ['1.5'], ['--repo', '2'], ['--machine', '2']]) {
    const args = bad[0].startsWith('--') ? ['config', 'set', bad[0], 'machine_parallel_tests', bad[1]] : ['config', 'set', 'machine_parallel_tests', bad[0]];
    const r = speck(dir, env, ...args);
    assert.notEqual(r.status, 0, `refused: ${bad.join(' ')}`);
    assert.match(r.stderr, /machine_parallel_tests/);
    assert.doesNotMatch(r.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(fs.existsSync(path.join(home, 'config.yml')), false);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), /machine_parallel_tests/);
});

test('0678 AC1: without it, nothing changes: runs in two projects go at once and no turns are kept in the home folder', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  const a = start(env, tmp('a'), { release: gate });
  await waitFor(() => a.out.includes('IN TURN'), 'the first run to start');
  const b = start(env, tmp('b'));
  const out = await finished(b);
  assert.match(out, /IN TURN/);
  assert.doesNotMatch(out, MACHINE_WAIT);
  release(gate);
  await finished(a);
  assert.equal(fs.existsSync(path.join(home, 'test-turns')), false);
});

test('0678 AC2: with it set to 1, a run in another project waits, says so once, and starts when the first ends', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 1);
  const first = tmp('a'), a = start(env, first, { release: gate });
  await waitFor(() => a.out.includes('IN TURN'), 'the first run to start');
  const b = start(env, tmp('b'));
  await waitFor(() => waitsOnMachine(b.out), 'the second run to say it waits');
  await new Promise(r => setTimeout(r, 300));
  assert.doesNotMatch(b.out, /IN TURN/, 'it hasn\'t started while the first holds the turn');
  assert.ok(b.out.includes(first), 'it says which run it waits for');
  release(gate);
  const out = await finished(b);
  await finished(a);
  assert.equal(out.match(MACHINE_WAIT)?.length, 1, `said once: ${out}`);
  assert.match(out, /IN TURN/);
});

test('0678 AC2: with it set to 2, two projects run at once and a third waits, the full suite\'s run included', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 2);
  const a = start(env, tmp('a'), { release: gate });
  const full = start(env, tmp('b'), { release: gate, lane: 'full' });
  await waitFor(() => a.out.includes('IN TURN') && full.out.includes('IN TURN'), 'both runs to start');
  const c = start(env, tmp('c'), { lane: 'full' });
  await waitFor(() => waitsOnMachine(c.out), 'the third run to say it waits');
  assert.doesNotMatch(c.out, /IN TURN/);
  release(gate);
  assert.match(await finished(c), /IN TURN/);
  await finished(a); await finished(full);
});

test('0678 AC3: each project\'s own max_parallel_tests still holds within it', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go'), repo = tmp('a');
  setLimit(home, 5);
  const a = start(env, repo, { release: gate });
  await waitFor(() => a.out.includes('IN TURN'), 'the first run to start');
  const b = start(env, repo);
  await waitFor(() => waitsInRepo(b.out), 'the second run in the same project to wait for its turn there');
  assert.doesNotMatch(b.out, MACHINE_WAIT);
  release(gate);
  assert.match(await finished(b), /IN TURN/);
  await finished(a);
});

test('0678 AC3: a test run started while one already holds the turn runs in that turn, in the same process or one its tests start', async () => {
  const home = tmp('home'), env = envWith(home);
  setLimit(home, 1);
  const inner = tmp('inner'), other = tmp('other');
  const run = start(env, tmp('outer'), { nested: inner, sameProcess: other });
  const out = await finished(run);
  assert.ok(out.includes(`IN TURN ${other}`), out);
  assert.ok(out.includes(`IN TURN ${inner}`), out);
  assert.doesNotMatch(out, MACHINE_WAIT);
});

test('0678 AC3: a turn held by a process that has died is freed', async () => {
  const home = tmp('home'), env = envWith(home);
  setLimit(home, 1);
  const a = start(env, tmp('a'), { release: path.join(tmp('gate'), 'never') });
  await waitFor(() => a.out.includes('IN TURN'), 'the first run to start');
  a.child.kill('SIGKILL');
  await a.done;
  const out = await finished(start(env, tmp('b')));
  assert.match(out, /IN TURN/);
  assert.doesNotMatch(out, MACHINE_WAIT);
});

test('0678 AC3: a turn whose project folder has gone since its process died is freed', async () => {
  const home = tmp('home'), env = envWith(home), gone = tmp('gone');
  setLimit(home, 1);
  const a = start(env, gone, { release: path.join(tmp('gate'), 'never') });
  await waitFor(() => a.out.includes('IN TURN'), 'the first run to start');
  a.child.kill('SIGKILL');
  await a.done;
  fs.rmSync(gone, { recursive: true, force: true });
  const out = await finished(start(env, tmp('b')));
  assert.match(out, /IN TURN/);
});

test('0678 AC2: a value in the home folder\'s file that isn\'t a whole number stops the run with what to do', () => {
  const home = tmp('home'), env = envWith(home);
  setLimit(home, 'lots');
  const r = spawnSync(process.execPath, [SCRIPT, tmp('a'), '1', '', '', '', ''], { env, encoding: 'utf8', timeout: 20000 });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /machine_parallel_tests .* must be a whole number of 1 or more/);
  assert.doesNotMatch(r.stdout, /IN TURN/);
});

test('0678 AC4: the brief describes machine_parallel_tests in its speck test and speck config set rows', () => {
  const brief = fs.readFileSync(fileURLToPath(new URL('../docs/brief.md', import.meta.url)), 'utf8');
  for (const row of ['| `speck test` |', '| `speck config set <key> <value>` |']) {
    const line = brief.split('\n').find(l => l.startsWith(row));
    assert.ok(line, `the brief has the ${row} row`);
    assert.match(line, /\bmachine_parallel_tests\b/, `${row} names machine_parallel_tests`);
  }
});

test('0678: the tests\' own runs never use the real home folder\'s settings', () => {
  assert.ok(process.env.SPECK_HOME_SETTINGS_DIR, 'support/tmp.mjs points them elsewhere');
  assert.ok(!process.env.SPECK_HOME_SETTINGS_DIR.startsWith(path.join(os.homedir(), '.config')));
});

test('0678: a home settings file that can\'t be read, or a turns folder that can\'t be made, stops the run with what to do', () => {
  const home = tmp('home'), env = envWith(home);
  fs.mkdirSync(path.join(home, 'config.yml'), { recursive: true }); // a folder, so it can't be read as a file
  let r = spawnSync(process.execPath, [SCRIPT, tmp('a'), '1', '', '', '', ''], { env, encoding: 'utf8', timeout: 20000 });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Can't read .*config\.yml/);
  fs.rmSync(path.join(home, 'config.yml'), { recursive: true });
  setLimit(home, 1);
  fs.writeFileSync(path.join(home, 'test-turns'), ''); // a file where its folder goes
  r = spawnSync(process.execPath, [SCRIPT, tmp('a'), '1', '', '', '', ''], { env, encoding: 'utf8', timeout: 20000 });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /where the turns machine_parallel_tests shares are kept/);
  assert.doesNotMatch(r.stdout, /IN TURN/);
});
