import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env } from './support/run.mjs';
import { timedMessage, timeRunOutput } from '../scripts/run-times.mjs';
import { runWorker } from '../scripts/run.mjs';

// ---------- 0460: each line speck run writes says when ----------

const TIME = /^\d\d:\d\d:\d\d /;
const at = new Date(2026, 9, 24, 9, 5, 3);

// A committed repo whose speck/config.yml has the given build_command, on `branch`, with run.log holding `old`.
function repoWith(command, branch = 'main', old = '') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0460-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', branch);
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nbuilder: claude\nreviewer: codex\nbuild_command: ${JSON.stringify(command)}\n`);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  const log = path.join(dir, 'speck', '.cache', 'runs', 'run.log');
  fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.writeFileSync(log, old);
  return { dir, log };
}

// Runs speck run in `dir` with its output going to the end of run.log, as the panel's switch sends it (0128).
function runInto({ dir, log }) {
  const fd = fs.openSync(log, 'a');
  try { return spawnSync(process.execPath, [CLI, 'run'], { cwd: dir, env, stdio: ['ignore', fd, fd], timeout: 30000 }); }
  finally { fs.closeSync(fd); }
}

// What console.log and console.error write while fn runs, with timeRunOutput on, put back as they were afterwards.
function printed(fn, now) {
  const said = [], { log, error } = console;
  console.log = (...a) => said.push(['log', ...a]);
  console.error = (...a) => said.push(['error', ...a]);
  const undo = timeRunOutput(now);
  try { fn(); } finally { undo(); console.log = log; console.error = error; }
  return said;
}

test('0460 AC1: a message starts with the local time as HH:MM:SS and a space', () => {
  assert.equal(timedMessage('Launched 0001 (session x).', at), '09:05:03 Launched 0001 (session x).');
  const said = printed(() => { console.log('Launched %s.', '0001'); console.error('speck run couldn\'t read the tickets'); }, () => at);
  assert.deepEqual(said, [['log', '09:05:03 Launched 0001.'], ['error', '09:05:03 speck run couldn\'t read the tickets']]);
});

test('0460 AC1: speck run\'s own output, refusals included, is timed', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0460-none-')));
  const r = spawnSync(process.execPath, [CLI, 'run'], { cwd: dir, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, new RegExp(`${TIME.source}No speck/config.yml found`), r.stderr);
});

test('0460 AC1: speck run on new code times its output too', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0460-worker-')));
  const was = process.cwd(), { log } = console;
  let timed;
  process.chdir(dir);
  try {
    assert.throws(() => runWorker(), /No speck\/config\.yml found/);
    timed = console.log !== log;
  } finally { timeRunOutput()(); process.chdir(was); }
  assert.ok(timed, 'runWorker timed console.log');
  assert.equal(console.log, log, 'put back afterwards');
});

test('0460 AC1: other commands run in this process aren\'t timed', () => {
  const r = spawnSync(process.execPath, [CLI, 'help'], { env, encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, TIME);
});

test('0460 AC2: a message over several lines has the time on its first line only', () => {
  assert.equal(timedMessage('first\n  second\nthird', at), '09:05:03 first\n  second\nthird');
  const said = printed(() => console.log('a\nb'), () => at);
  assert.deepEqual(said, [['log', '09:05:03 a\nb']]);
});

test('0460 AC2 AC3: in run.log, earlier lines stay as they were, and a refusal over two lines is timed on its first', () => {
  const old = 'speck run: watching for ready tickets every 5s.\nLaunched 0001 (session x). Log: speck/.cache/runs/0001.log\n';
  const r = repoWith('', 'main', old);
  assert.equal(runInto(r).status, 1);
  const text = fs.readFileSync(r.log, 'utf8');
  assert.ok(text.startsWith(old), text);
  const added = text.slice(old.length).split('\n');
  assert.match(added[0], new RegExp(`${TIME.source}No build_command is set`), text);
  assert.equal(added[1], `  build_command: 'claude -p "/speck-build {id}" --session-id {session} --output-format stream-json --verbose --dangerously-skip-permissions'`, text);
});
