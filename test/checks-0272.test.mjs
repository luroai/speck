// 0272: commands.checks names quick test files that check rules for the whole repo, and speck test --files runs them
// with the ticket's own test files in every build.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, gIn } from './support/ship.mjs';
import { ROOT } from './support/panel.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { checkFiles } from '../scripts/turns.mjs';

const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
const BUILD = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
const configText = dir => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');

function logFile() {
  return path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'checks-'))), 'log.txt');
}
const lines = log => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [];

// A committed repo with speck set up, commands.test_files writing each file it's given to `log` and exiting with
// `code`, and commands.checks as given.
function checksRepo(log, checks, code = 0) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-checks-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test', `echo suite >> ${log}`).status, 0);
  const files = `for f in {files}; do echo "file $f" >> ${log}; done; exit ${code}`;
  assert.equal(speck(dir, 'config', 'set', 'commands.test_files', files).status, 0);
  if (checks !== undefined) {
    const set = speck(dir, 'config', 'set', 'commands.checks', checks);
    assert.equal(set.status, 0, set.stderr);
  }
  fs.mkdirSync(path.join(dir, 'test'));
  for (const f of ['a.test.mjs', 'rule.test.mjs', 'size.test.mjs']) fs.writeFileSync(path.join(dir, 'test', f), '');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  return dir;
}

test('0272 AC1: the config template has commands.checks, blank, with a comment', () => {
  const m = TEMPLATE.match(/^commands:\n((?: {2}.*\n)+)/m);
  assert.ok(m, 'a commands section');
  assert.match(m[1], /^ {2}checks: ""\s+#\s*\S/m, 'blank, with a comment');
});

test('0272 AC1: speck config set accepts commands.checks as a list of files, and it reads back', () => {
  const log = logFile();
  const dir = checksRepo(log);
  let res = speck(dir, 'config', 'set', 'commands.checks', 'test/rule.test.mjs test/size.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  assert.match(configText(dir), /^ {2}checks: \[test\/rule\.test\.mjs, test\/size\.test\.mjs\]/m);
  res = speck(dir, 'config', 'set', 'commands.checks', '[test/rule.test.mjs, test/rule.test.mjs]');
  assert.equal(res.status, 0, res.stderr);
  assert.match(configText(dir), /^ {2}checks: \[test\/rule\.test\.mjs\]/m, 'brackets and commas read, repeats dropped');
  res = speck(dir, 'config', 'set', 'commands.checks', '');
  assert.equal(res.status, 0, res.stderr);
  assert.match(configText(dir), /^ {2}checks: (""|'')/m, 'blank is accepted');
});

test('0272 AC1: commands.checks refuses a value speck could not read back as file names', () => {
  assert.deepEqual(checkConfigValue('commands.checks', 'a.mjs, b.mjs'), ['a.mjs', 'b.mjs']);
  assert.equal(checkConfigValue('commands.checks', '  '), '');
  for (const bad of ['a.mjs "b.mjs"', "it's.mjs", 'a.mjs #b']) assert.throws(() => checkConfigValue('commands.checks', bad), /commands\.checks/, bad);
});

test('0272 AC2: speck test --files runs commands.checks together with the given files, each once', () => {
  const log = logFile();
  const dir = checksRepo(log, 'test/rule.test.mjs test/size.test.mjs');
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs', 'test/rule.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(lines(log), ['file test/a.test.mjs', 'file test/rule.test.mjs', 'file test/size.test.mjs'], 'one run, each file once, no suite');
});

test('0272 AC2: a failing run with the checks fails speck test --files', () => {
  const log = logFile();
  const dir = checksRepo(log, 'test/rule.test.mjs', 3);
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
  assert.equal(res.status, 3);
  noTrace(res);
  assert.deepEqual(lines(log), ['file test/a.test.mjs', 'file test/rule.test.mjs']);
});

test('0272 AC2: with commands.checks blank or missing, speck test --files runs only the given files', () => {
  for (const checks of [undefined, '']) {
    const log = logFile();
    const dir = checksRepo(log, checks);
    const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
    assert.equal(res.status, 0, res.stderr);
    assert.deepEqual(lines(log), ['file test/a.test.mjs'], String(checks));
  }
});

test('0272 AC2: the build skill says builds run commands.checks with the ticket\'s own test files', () => {
  assert.match(BUILD, /commands\.checks/);
});

test('0272 AC3: a file in commands.checks that does not exist fails the run, naming it, and runs nothing', () => {
  const log = logFile();
  const dir = checksRepo(log, 'test/rule.test.mjs test/gone.test.mjs');
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /test\/gone\.test\.mjs/);
  assert.match(res.stderr, /commands\.checks/);
  assert.doesNotMatch(res.stderr, /test\/rule\.test\.mjs/, 'names only the missing file');
  assert.deepEqual(lines(log), [], 'nothing ran');
});

test('0272 AC3: a folder in commands.checks is not a test file, and fails the run too', () => {
  const log = logFile();
  const dir = checksRepo(log, 'test');
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.deepEqual(lines(log), []);
});

test('0272 AC3: the missing-file check also applies when commands.test_files is blank and the suite runs', () => {
  const log = logFile();
  const dir = checksRepo(log, 'test/gone.test.mjs');
  assert.equal(speck(dir, 'config', 'set', 'commands.test_files', '').status, 0);
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /test\/gone\.test\.mjs/);
  assert.deepEqual(lines(log), []);
});

test('0272 AC3: a hand-written value speck reads as a number or a bare name is still checked as a file', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-checks-')));
  fs.writeFileSync(path.join(dir, 'a.mjs'), '');
  assert.throws(() => checkFiles(dir, { commands: { checks: 123 } }), /: 123\./);
  assert.deepEqual(checkFiles(dir, { commands: { checks: 'a.mjs, a.mjs' } }), ['a.mjs']);
  assert.deepEqual(checkFiles(dir, { commands: {} }), []);
  assert.deepEqual(checkFiles(dir, {}), []);
});

test('0272 AC5: the brief describes commands.checks beside commands.test_files', () => {
  assert.match(BRIEF, /commands\.checks/);
  assert.match(BRIEF, /commands\.test_files/);
});
