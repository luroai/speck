// 0437: speck test --related runs the existing tests that name a file the branch changed, so a build finds what it
// broke before review rather than at ship.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, gIn } from './support/ship.mjs';
import { ROOT } from './support/panel.mjs';
import { relatedTests, relatedReport } from '../scripts/related.mjs';

const BUILD = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');

const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
const write = (dir, rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };

// A committed repo on main with these files, then a branch `feature`.
function repo(files) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-related-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  for (const [rel, text] of Object.entries(files)) write(dir, rel, text);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  gIn(dir, 'checkout', '-qb', 'feature');
  return dir;
}

const FILES = {
  'scripts/turns.mjs': 'export const a = 1;\n',
  'scripts/build-panel.mjs': 'export const b = 1;\n',
  'scripts/panel.mjs': 'export const p = 1;\n',
  'templates/panel.html': '<p>panel</p>\n',
  'docs/brief.md': '# brief\n',
  'speck/tickets/0001-x.md': '# ticket\n',
  'test/support/page.mjs': "export const PAGE = path.join(ROOT, 'templates', 'panel.html');\n",
  'test/support/other.mjs': 'export const x = 1;\n',
  'test/by-path.test.mjs': "const f = 'templates/panel.html';\n",
  'test/by-import.test.mjs': "import { a } from '../scripts/turns.mjs';\n",
  'test/via-support.test.mjs': "import { PAGE } from './support/page.mjs';\n",
  'test/unrelated.test.mjs': "import { x } from './support/other.mjs';\nimport { b } from '../scripts/build-panel.mjs';\n",
  'test/ticket.test.mjs': "const t = 'speck/tickets/0001-x.md';\n",
  'test/deep/nested.test.mjs': "const d = 'brief.md';\n",
};

test('0437 AC1: chooses test files naming a changed file by path or by file name, or through a support module', () => {
  const dir = repo(FILES);
  write(dir, 'templates/panel.html', '<p>changed</p>\n');
  write(dir, 'scripts/turns.mjs', 'export const a = 2;\n');
  gIn(dir, 'commit', '-qam', 'change');
  const chosen = relatedTests(dir, 'main');
  assert.deepEqual(chosen.map(c => c.test), ['test/by-import.test.mjs', 'test/by-path.test.mjs', 'test/via-support.test.mjs']);
  assert.deepEqual(chosen.find(c => c.test === 'test/via-support.test.mjs'), { test: 'test/via-support.test.mjs', because: 'templates/panel.html', through: 'test/support/page.mjs' });
  assert.equal(chosen.find(c => c.test === 'test/by-import.test.mjs').because, 'scripts/turns.mjs');
});

test('0437 AC1: a file name only counts on its own, not inside a longer one', () => {
  const dir = repo(FILES);
  write(dir, 'scripts/panel.mjs', 'export const p = 2;\n');
  gIn(dir, 'commit', '-qam', 'change');
  assert.deepEqual(relatedTests(dir, 'main'), [], 'build-panel.mjs does not name panel.mjs');
});

test('0437 AC1: files under speck/ do not count; uncommitted, untracked and nested ones do', () => {
  const dir = repo(FILES);
  write(dir, 'speck/tickets/0001-x.md', '# changed\n');
  gIn(dir, 'commit', '-qam', 'ticket');
  assert.deepEqual(relatedTests(dir, 'main'), [], 'a ticket change brings in nothing');
  write(dir, 'docs/brief.md', '# changed, not committed\n');
  assert.deepEqual(relatedTests(dir, 'main').map(c => c.test), ['test/deep/nested.test.mjs']);
  write(dir, 'scripts/new.mjs', '');
  write(dir, 'test/new-user.test.mjs', "import '../scripts/new.mjs';\n");
  assert.ok(relatedTests(dir, 'main').some(c => c.test === 'test/new-user.test.mjs' && c.because === 'scripts/new.mjs'), 'untracked files count');
});

test('0437 AC1: only changes since the branch left the base branch count, not ones the base branch made', () => {
  const dir = repo(FILES);
  gIn(dir, 'checkout', '-q', 'main');
  write(dir, 'scripts/turns.mjs', 'export const a = 3;\n');
  gIn(dir, 'commit', '-qam', 'on main');
  gIn(dir, 'checkout', '-q', 'feature');
  assert.deepEqual(relatedTests(dir, 'main'), []);
});

test('0437 AC2: the report names each chosen file and what brought it in, or says in one line there are none', () => {
  const text = relatedReport([{ test: 'test/a.test.mjs', because: 'scripts/a.mjs' }, { test: 'test/b.test.mjs', because: 'templates/panel.html', through: 'test/support/panel.mjs' }], 'main');
  assert.match(text, /test\/a\.test\.mjs: scripts\/a\.mjs$/m);
  assert.match(text, /test\/b\.test\.mjs: templates\/panel\.html, through test\/support\/panel\.mjs$/m);
  const none = relatedReport([], 'main');
  assert.equal(none.split('\n').length, 1);
  assert.match(none, /no related tests/i);
});

// A repo set up with speck, commands.test_files logging each file it's given, and a check file.
function speckRepo() {
  const dir = repo(FILES);
  const log = path.join(dir, '..', `${path.basename(dir)}.log`);
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  write(dir, 'test/rule.test.mjs', '');
  assert.equal(speck(dir, 'config', 'set', 'commands.test', `echo suite >> ${log}`).status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test_files', `for f in {files}; do echo "file $f" >> ${log}; done`).status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.checks', 'test/rule.test.mjs').status, 0);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'speck');
  // Where the branch leaves main now, so speck's own files aren't changes.
  gIn(dir, 'branch', '-qf', 'main', 'HEAD');
  return { dir, log: () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [] };
}

test('0437 AC2: speck test --related prints its choice before running it, in one run with commands.checks', () => {
  const { dir, log } = speckRepo();
  write(dir, 'scripts/turns.mjs', 'export const a = 2;\n');
  const res = speck(dir, 'test', '--related', 'test/ticket.test.mjs');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /test\/by-import\.test\.mjs: scripts\/turns\.mjs/);
  assert.deepEqual(log(), ['file test/ticket.test.mjs', 'file test/by-import.test.mjs', 'file test/rule.test.mjs'], 'one run, given files too, checks once, no suite');
});

test('0437 AC2: with none chosen, speck test --related says so in one line, runs nothing and exits 0', () => {
  const { dir, log } = speckRepo();
  const res = speck(dir, 'test', '--related');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim().split('\n').length, 1, res.stdout);
  assert.match(res.stdout, /no related tests/i);
  assert.deepEqual(log(), []);
});

test('0437 AC2: an option after --related is refused plainly, without a stack trace', () => {
  const { dir, log } = speckRepo();
  const res = speck(dir, 'test', '--related', '--files', 'test/a.test.mjs');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /--files/);
  assert.doesNotMatch(res.stderr, /^\s+at /m);
  assert.deepEqual(log(), []);
});

test('0437 AC3: the build skill runs speck test --related with the ticket\'s own files, into the round\'s test output', () => {
  assert.ok(BUILD.includes('`speck test --related <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`'));
});

test('0437 AC4: the brief\'s speck test row names --related', () => {
  const row = BRIEF.split('\n').find(l => l.startsWith('| `speck test` |'));
  assert.ok(row);
  assert.match(row, /`speck test --related/);
  assert.match(row, /test\/support\//);
});
