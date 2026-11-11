// 0631: speck ships on its quick tests, and its whole suite runs on main after ships through commands.test_full.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fullOnlyFiles } from './support/full-only.mjs';
import { heavyFiles } from './support/heavy.mjs';
import { fixture, runWith } from './support/suite-fixture.mjs';
import { CLI, env, gIn } from './support/ship.mjs';
import { repo, write } from './support/related.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUITE = path.join(ROOT, 'test', 'support', 'suite.mjs');
const SIX = ['build-log-0176', 'quick-waits-0232', 'ship-0264', 'review-wait-0384', 'run-switch-0301', 'stop-0072'].map(f => `test/${f}.test.mjs`);

// Built here rather than written out, so this file is neither heavy nor marked itself.
const heavyCode = () => `const ${'startPanel'} = () => {};\n${'startPanel'}();`;
const marked = why => `${'//'} Full suite only: ${why}`;

const started = dir => {
  const log = path.join(dir, 'runs.log');
  return fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(l => l.startsWith('start ')).map(l => l.slice(6)).sort() : [];
};
const suiteFixture = () => fixture({
  'plain.test.mjs': {}, 'other.test.mjs': {}, 'heavy.test.mjs': { code: heavyCode() }, 'marked.test.mjs': { code: marked('it waits on the clock') },
  'mentions.test.mjs': { code: "const s = '// Full suite only: in a string';" },
});
const ALL = ['heavy.test.mjs', 'marked.test.mjs', 'mentions.test.mjs', 'other.test.mjs', 'plain.test.mjs'];
const QUICK = ['mentions.test.mjs', 'other.test.mjs', 'plain.test.mjs'];
const cleanEnv = () => { const e = { ...process.env }; delete e.NODE_TEST_CONTEXT; return e; };

test('0631 AC1: the quick run leaves out the heavy and full-suite-only files, on any number of cores', () => {
  for (const cores of [4, 16]) {
    const dir = suiteFixture();
    const r = runWith(dir, { cores, concurrency: 4, quick: true });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.deepEqual(started(dir), QUICK, `${cores} cores`);
  }
});

test('0631 AC1: node test/support/suite.mjs --quick runs the quick files, and without it every file runs', () => {
  const dir = suiteFixture();
  const quick = spawnSync(process.execPath, [SUITE, '--quick'], { cwd: dir, env: cleanEnv(), encoding: 'utf8', timeout: 90000 });
  assert.equal(quick.status, 0, quick.stderr + quick.stdout);
  assert.deepEqual(started(dir), QUICK);
  fs.rmSync(path.join(dir, 'runs.log'));
  const all = spawnSync(process.execPath, [SUITE], { cwd: dir, env: cleanEnv(), encoding: 'utf8', timeout: 90000 });
  assert.equal(all.status, 0, all.stderr + all.stdout);
  assert.deepEqual(started(dir), ALL);
});

test('0631 AC1: npm test runs the whole suite, not the quick one', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node test/support/suite.mjs');
});

test('0631 AC1: a quick run keeps the times the full run recorded for the files it left out', () => {
  const dir = suiteFixture();
  assert.equal(runWith(dir, { cores: 16, concurrency: 4 }).status, 0);
  const times = path.join(dir, 'speck', '.cache', 'test-times.json');
  const full = JSON.parse(fs.readFileSync(times, 'utf8'));
  assert.deepEqual(Object.keys(full).sort(), ALL.map(f => `test/${f}`));
  assert.equal(runWith(dir, { cores: 16, concurrency: 4, quick: true }).status, 0);
  const after = JSON.parse(fs.readFileSync(times, 'utf8'));
  assert.deepEqual(Object.keys(after).sort(), ALL.map(f => `test/${f}`));
  for (const f of ['test/heavy.test.mjs', 'test/marked.test.mjs']) assert.equal(after[f], full[f], f);
});

test('0631 AC1: a quick run with nothing left to run says so and fails', () => {
  const dir = fixture({ 'heavy.test.mjs': { code: heavyCode() } });
  const r = runWith(dir, { cores: 16, quick: true });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /No test files to run/);
  assert.doesNotMatch(r.stderr, /^\s+at /m, 'no stack trace');
});

test('0631 AC2: the six files are marked as full-suite only, and are found by the mark alone', () => {
  for (const f of SIX) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  assert.deepEqual(fullOnlyFiles(ROOT, SIX), SIX);
  const tests = fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs')).map(f => `test/${f}`);
  const found = fullOnlyFiles(ROOT, tests);
  for (const f of SIX) assert.ok(found.includes(f), f);
  assert.ok(!found.includes('test/quick-0631.test.mjs'), 'this file isn\'t marked');
  const dir = fixture({ 'new.test.mjs': { code: marked('a new one') }, 'plain.test.mjs': {} });
  assert.deepEqual(fullOnlyFiles(dir, ['test/new.test.mjs', 'test/plain.test.mjs', 'test/missing.test.mjs']), ['test/new.test.mjs']);
});

// 0631 AC3, the commands in speck/config.yml, has no test: speck's tests don't read this repo's speck/ folder (0122).
// AC4's repo below has the same two commands as speck/config.yml.

test('0631 AC4: speck test --files and --related run heavy and full-suite-only files they are given or choose', () => {
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'quick-0631-'))), 'ran.log');
  const body = (name, code) => `import { test } from 'node:test';\nimport fs from 'node:fs';\n${code}\n// names src/app.mjs\ntest('${name}', () => { fs.appendFileSync(${JSON.stringify(log)}, '${name}\\n'); });\n`;
  const dir = repo({
    'speck/config.yml': `base_branch: main\ncommands:\n  test: node test/support/suite.mjs --quick\n  test_files: node --test {files}\n`,
    'src/app.mjs': 'export const a = 1;\n',
    'test/heavy.test.mjs': body('heavy', heavyCode()), 'test/marked.test.mjs': body('marked', marked('slow')),
  });
  assert.deepEqual([heavyFiles(dir, ['test/heavy.test.mjs']), fullOnlyFiles(dir, ['test/marked.test.mjs'])], [['test/heavy.test.mjs'], ['test/marked.test.mjs']]);
  const speck = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: (({ NODE_TEST_CONTEXT, ...e }) => e)(env) });
  const ran = () => { const t = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').sort() : []; fs.rmSync(log, { force: true }); return t; };
  let r = speck('test', '--files', 'test/heavy.test.mjs', 'test/marked.test.mjs');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(ran(), ['heavy', 'marked'], 'given with --files');
  write(dir, 'src/app.mjs', 'export const a = 2;\n');
  gIn(dir, 'commit', '-qam', 'change');
  r = speck('test', '--related');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(ran(), ['heavy', 'marked'], 'chosen by --related');
  r = speck('test', '--related', 'test/marked.test.mjs');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(ran(), ['heavy', 'marked'], 'given to --related');
});
