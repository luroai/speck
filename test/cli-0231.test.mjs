import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runCommand, runInProcess } from '../scripts/speck.mjs';
import { CLI, ROOT, gitEnv, speck } from './support/speck.mjs';

const env = { ...process.env, ...gitEnv };
const spawned = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
const same = r => ({ status: r.status, stdout: r.stdout, stderr: r.stderr });

// A repo with speck set up, its tests set to print a line to each stream.
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0231-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  assert.equal(spawned(dir, 'init', '--skip-checks').status, 0);
  const cfg = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8')
    .replace(/^  test: .*$/m, '  test: "echo suite-out; echo suite-err >&2"')
    .replace(/^  test_files: .*$/m, '  test_files: "echo files-out {files}; echo files-err >&2; exit 3"'));
  return dir;
}

test('0231 AC1: runCommand runs one command in the given folder and environment, and returns its exit code and output', () => {
  const dir = repo();
  const cwd = process.cwd(), before = { ...process.env };
  const r = runCommand(['new', 'Export', 'bookings'], { cwd: dir, env: { ...env, SPECK_0231_MARK: 'x' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'speck/tickets/0001-export-bookings.md\n');
  assert.equal(r.stderr, '');
  assert.ok(fs.existsSync(path.join(dir, 'speck', 'tickets', '0001-export-bookings.md')));
  assert.equal(process.cwd(), cwd);
  assert.deepEqual({ ...process.env }, before);
  const bad = runCommand(['lint', '0099'], { cwd: dir, env });
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.match(bad.stderr, /0099/);
});

test('0231 AC1: the environment given is the one the command and its child processes see', () => {
  const dir = repo();
  const cfg = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^  test_files: .*$/m, '  test_files: "echo mark=$SPECK_0231_MARK {files}"'));
  const r = runCommand(['test', '--files', 'a.test.mjs'], { cwd: dir, env: { ...env, SPECK_0231_MARK: 'given' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'mark=given a.test.mjs\n');
  assert.equal(process.env.SPECK_0231_MARK, undefined);
});

test('0231 AC1: a variable given as undefined is left out of the command\'s environment, as spawnSync leaves it out', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0231-'));
  process.env.SPECK_0231_INHERITED = 'inherited';
  try {
    const given = { ...process.env, SPECK_0231_INHERITED: undefined };
    const r = runInProcess(() => console.log(JSON.stringify([Object.hasOwn(process.env, 'SPECK_0231_INHERITED'), spawnSync('sh', ['-c', 'echo "${SPECK_0231_INHERITED-unset}"'], { encoding: 'utf8' }).stdout.trim()])), { cwd: dir, env: given });
    assert.deepEqual(JSON.parse(r.stdout), [false, 'unset']);
    const p = spawnSync('sh', ['-c', 'echo "${SPECK_0231_INHERITED-unset}"'], { encoding: 'utf8', env: given });
    assert.equal(p.stdout.trim(), 'unset', 'as spawnSync does');
    assert.equal(process.env.SPECK_0231_INHERITED, 'inherited', 'and it\'s back afterwards');
  } finally { delete process.env.SPECK_0231_INHERITED; }
});

test('0231 AC1: output a child process writes straight to the terminal is returned too, from each stream', () => {
  const dir = repo();
  const files = runCommand(['test', '--files', 'a.test.mjs'], { cwd: dir, env });
  assert.equal(files.status, 3);
  assert.equal(files.stdout, 'files-out a.test.mjs\n');
  assert.equal(files.stderr, 'files-err\n');
  const suite = runCommand(['test', '--fresh'], { cwd: dir, env });
  assert.equal(suite.status, 0);
  assert.match(suite.stdout, /suite-out/);
  assert.match(suite.stderr, /suite-err/);
});

test('0231 AC1: a command calling process.exit, changing the folder or the environment, or setting exitCode leaves the process as it was', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0231-'));
  const cwd = process.cwd(), before = { ...process.env }, code = process.exitCode, exit = process.exit;
  const r = runInProcess(() => {
    console.log('out');
    process.stderr.write(Buffer.from('err\n'));
    process.chdir(os.tmpdir());
    process.env.SPECK_0231_SET = '1';
    delete process.env.PATH;
    process.exit(4);
    console.log('never');
  }, { cwd: dir, env: { ...env } });
  assert.deepEqual(same(r), { status: 4, stdout: 'out\n', stderr: 'err\n' });
  assert.equal(process.cwd(), cwd);
  assert.deepEqual({ ...process.env }, before);
  assert.equal(process.exit, exit);
  assert.equal(process.exitCode, code);
  // exitCode set on the way out is the status, and process.exit() with no code uses it, as in a process of its own.
  assert.equal(runInProcess(() => { process.exitCode = 10; }, { cwd: dir, env }).status, 10);
  assert.equal(runInProcess(() => { process.exitCode = 11; process.exit(); }, { cwd: dir, env }).status, 11);
  assert.equal(process.exitCode, code);
  // A command runs in the folder given.
  assert.equal(fs.realpathSync(runInProcess(() => console.log(process.cwd()), { cwd: dir, env }).stdout.trim()), fs.realpathSync(dir));
});

test('0231 AC1: an unexpected error ends the command with exit code 1 and its stack on stderr, not the test process', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0231-'));
  const cwd = process.cwd();
  const r = runInProcess(() => { console.log('before'); throw new TypeError('boom'); }, { cwd: dir, env });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, 'before\n');
  assert.match(r.stderr, /TypeError: boom/);
  const missing = runCommand(['status'], { cwd: path.join(dir, 'not-there'), env });
  assert.equal(missing.status, null);
  assert.equal(missing.error.code, 'ENOENT');
  assert.equal(process.cwd(), cwd);
});

test('0231 AC2: the command line prints, changes and exits exactly as runCommand does', () => {
  const a = repo(), b = repo();
  const runs = [
    [], ['help'], ['--help'], ['nope'], ['new', 'Export', 'bookings'], ['lint', '1'], ['lint', '0099'], ['status'],
    ['status', '--json'], ['set', '1', 'priority', '2'], ['set', '1', 'status', 'ready'], ['next', '1'], ['config', 'set', 'nope', '1'],
    ['test', '--files', 'x.test.mjs'], ['test', '--fresh'], ['diffstat'],
  ];
  for (const args of runs) {
    const p = spawned(a, ...args), i = runCommand(args, { cwd: b, env });
    const norm = s => s.replaceAll(a, '<dir>').replaceAll(b, '<dir>').replace(/"(created|updated|at)": "[^"]*"/g, '"$1": "<t>"');
    assert.deepEqual({ status: i.status, stdout: norm(i.stdout), stderr: norm(i.stderr) }, { status: p.status, stdout: norm(p.stdout), stderr: norm(p.stderr) }, `speck ${args.join(' ')}`);
  }
  const files = d => spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: d, encoding: 'utf8' }).stdout;
  assert.equal(files(b), files(a));
  assert.equal(fs.readFileSync(path.join(b, 'speck', 'tickets', '0001-export-bookings.md'), 'utf8'), fs.readFileSync(path.join(a, 'speck', 'tickets', '0001-export-bookings.md'), 'utf8'));
});

test('0231 AC2: a command the CLI ends with a SpeckError still exits with its code from a process of its own', () => {
  const dir = repo();
  const r = spawned(dir, 'test', '--files', 'x.test.mjs');
  assert.deepEqual(same(r), { status: 3, stdout: 'files-out x.test.mjs\n', stderr: 'files-err\n' });
});

test('0231 AC3: the shared helper runs a command in this process', () => {
  const dir = repo();
  const pid = path.join(dir, 'pid');
  const cfg = path.join(dir, 'speck', 'config.yml');
  // The test command's parent is the process watching it for stalls, whose parent is speck.
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^  test_files: .*$/m, `  test_files: "ps -o ppid= -p $PPID > ${pid}; true {files}"`));
  const r = speck(dir, env, 'test', '--files', 'x');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(Number(fs.readFileSync(pid, 'utf8').trim()), process.pid);
});

test('0231 AC3: no shared helper starts the speck CLI as a process, except for panel and run', () => {
  const dir = path.join(ROOT, 'test', 'support');
  const offenders = [];
  // cli.mjs is the helper itself, which starts a process for panel and run.
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.mjs') && n !== 'cli.mjs')) {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
      if (/spawn(Sync)?\(process\.execPath, \[(CLI|cli)\b/.test(line) && !/'(panel|run)'/.test(line)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});
