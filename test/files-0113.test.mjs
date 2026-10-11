// 0113: speck test --files runs only the given test files, through commands.test_files, while a build works.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shipRepo, CLI, env, gIn } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
const BUILD = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
const REVIEW = fs.readFileSync(path.join(ROOT, 'skills', 'speck-review', 'SKILL.md'), 'utf8');

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });

// A file outside the repo that the test commands write to, so a test can see which ran and with what.
function logFile() {
  return path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'files-'))), 'log.txt');
}
const lines = log => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [];

// A committed repo with speck set up, commands.test writing `suite` to `log`, and commands.test_files as given.
function filesRepo(log, testFiles) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-files-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test', `echo suite >> ${log}`).status, 0);
  if (testFiles !== undefined) {
    const set = speck(dir, 'config', 'set', 'commands.test_files', testFiles);
    assert.equal(set.status, 0, set.stderr);
  }
  fs.mkdirSync(path.join(dir, 'test'));
  for (const f of ['a.test.mjs', 'b.test.mjs', 'with space.test.mjs']) fs.writeFileSync(path.join(dir, 'test', f), '');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  return dir;
}

// A test_files command that writes each file it's given, one per line, then exits with `code`.
const each = (log, code = 0) => `for f in {files}; do echo "file $f" >> ${log}; done; exit ${code}`;

test('0113 AC1: the config template has commands.test_files, blank, with a comment', () => {
  const m = TEMPLATE.match(/^commands:\n((?: {2}.*\n)+)/m);
  assert.ok(m, 'a commands section');
  assert.match(m[1], /^ {2}test_files: ""\s+#.*\{files\}/m, 'blank, with a comment naming {files}');
});

test('0113 AC1: speck config set accepts commands.test_files, and it reads back', () => {
  const log = logFile();
  const dir = filesRepo(log);
  const res = speck(dir, 'config', 'set', 'commands.test_files', 'node --test {files}');
  assert.equal(res.status, 0, res.stderr);
  assert.match(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), /^ {2}test_files: node --test \{files\}/m);
  assert.equal(speck(dir, 'config', 'set', 'commands.test_files', '').status, 0, 'blank is accepted');
});

test('0113 AC1: speck config set refuses a commands.test_files without {files}', () => {
  const log = logFile();
  const dir = filesRepo(log);
  const before = fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
  const res = speck(dir, 'config', 'set', 'commands.test_files', 'node --test');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /\{files\}/);
  assert.equal(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), before, 'nothing changed');
});

test('0113 AC2: speck test --files runs commands.test_files with those files, not the suite', () => {
  const log = logFile();
  const dir = filesRepo(log, each(log));
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs', 'test/with space.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  noTrace(res);
  assert.deepEqual(lines(log), ['file test/a.test.mjs', 'file test/with space.test.mjs'], 'each file once, as given, and no suite');
});

test('0113 AC2: speck test --files exits with the command\'s exit code', () => {
  const log = logFile();
  const dir = filesRepo(log, each(log, 7));
  const res = speck(dir, 'test', '--files', 'test/b.test.mjs');
  assert.equal(res.status, 7);
  noTrace(res);
  assert.deepEqual(lines(log), ['file test/b.test.mjs']);
});

test('0113 AC2: files are passed as one shell word each, so names can\'t run commands', () => {
  const log = logFile();
  const dir = filesRepo(log, `printf '%s\\n' {files} >> ${log}`);
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs; echo pwned', '$(echo x)');
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(lines(log), ['test/a.test.mjs; echo pwned', '$(echo x)']);
});

test('0113 AC2: files given from a subfolder are passed relative to the repo root, where the command runs', () => {
  const log = logFile();
  const dir = filesRepo(log, each(log));
  const res = speck(path.join(dir, 'test'), 'test', '--files', 'a.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(lines(log), ['file test/a.test.mjs']);
});

test('0113 AC2: with commands.test_files blank, speck test --files runs commands.test, saying so in one line', () => {
  const log = logFile();
  const dir = filesRepo(log);
  const res = speck(dir, 'test', '--files', 'test/a.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  noTrace(res);
  assert.deepEqual(lines(log), ['suite'], 'the whole suite ran');
  const said = res.stdout.split('\n').filter(l => /commands\.test_files/.test(l));
  assert.equal(said.length, 1, res.stdout);
  assert.match(said[0], /blank|not set/i);
  assert.match(said[0], /commands\.test\b/);
});

test('0113 AC2: speck test --files with no files is a usage error that runs nothing', () => {
  const log = logFile();
  const dir = filesRepo(log, each(log));
  const res = speck(dir, 'test', '--files');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /--files/);
  assert.deepEqual(lines(log), []);
});

test('0113 AC2: a run of only some files is never recorded as the suite\'s result', () => {
  const log = logFile();
  const dir = filesRepo(log, each(log));
  assert.equal(speck(dir, 'test', '--files', 'test/a.test.mjs').status, 0);
  const full = speck(dir, 'test');
  assert.equal(full.status, 0, full.stderr);
  assert.doesNotMatch(full.stdout, /^Reusing the test result/m);
  assert.deepEqual(lines(log), ['file test/a.test.mjs', 'suite'], 'the full suite still ran');
});

// The build skill's step that starts with `marker`, up to the next numbered step or heading.
const step = (text, marker) => {
  const at = text.indexOf(marker);
  assert.ok(at >= 0, `the skill has a step starting ${JSON.stringify(marker)}`);
  const rest = text.slice(at);
  const end = rest.slice(1).search(/\n(?:\d+\. |#)/);
  return end < 0 ? rest : rest.slice(0, end + 1);
};

test('0113 AC3: the build skill runs only the ticket\'s own test files while checking they fail and fixing', () => {
  const fail = step(BUILD.slice(BUILD.indexOf('## 2. Tests first')), '2. Run ');
  assert.match(fail, /speck test --files/);
  assert.match(fail, /should fail/);
  const fix = step(BUILD.slice(BUILD.indexOf('## 3. Implement')), '2. Run ');
  assert.match(fix, /speck test --files/);
  assert.match(fix, /until they pass/);
});

test('0113 AC4: the build skill runs the whole suite before changing anything, once its own tests pass, and after a merge', () => {
  const before = step(BUILD, '6. In that folder, before you change anything');
  assert.match(before, /`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`/);
  assert.doesNotMatch(before, /--files/);
  const fix = step(BUILD.slice(BUILD.indexOf('## 3. Implement')), '2. Run ');
  assert.match(fix, /once (?:they|the ticket's own tests) pass[^.]*`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`/i, 'whole suite once its own tests pass');
  const merge = step(BUILD, '3. Run the tests (');
  assert.match(merge, /`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`/);
  assert.doesNotMatch(merge, /--files/);
});

test('0113 AC4: the whole suite runs before every review round', () => {
  assert.match(BUILD, /whole suite[^.]*before every review round/i);
  const fresh = REVIEW.split('\n').find(l => l.includes('The test output is fresh'));
  assert.ok(fresh);
  assert.match(fresh, /`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`/);
  assert.match(fresh, /whole suite/);
  assert.match(fresh, /not `speck test --files`|never `speck test --files`/);
});

test('0113 AC4: speck ship still runs the whole suite, not commands.test_files', () => {
  const log = logFile();
  const r = shipRepo({ test: `echo suite >> ${log}` });
  for (const cwd of [r.dir, r.wt]) {
    assert.equal(speck(cwd, 'config', 'set', 'commands.test_files', each(log)).status, 0);
    gIn(cwd, 'commit', '-qam', 'test_files');
  }
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.deepEqual(lines(log), ['suite']);
});

test('0113 AC2: a file name like $& or one starting with - reaches the command as a file name', () => {
  const log = logFile();
  const dir = filesRepo(log, `printf '%s\\n' {files} >> ${log}`);
  const res = speck(dir, 'test', '--files', "it's $&.mjs", '--fresh');
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(lines(log), ["it's $&.mjs", './--fresh']);
});
