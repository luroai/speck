// 0676: a failing `speck test --related` run ends with the command to run next, so a build re-runs only the files that
// failed and its own rather than the whole related set again.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env as shipEnv, gIn } from './support/ship.mjs';
import { ROOT } from './support/panel.mjs';
import { repo, write } from './support/related.mjs';
import { nextRunFiles, summariseTap } from '../scripts/tap.mjs';
import { NEXT_RUN } from '../scripts/turns.mjs';

const BRIEF = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');

// Without node --test's own marker, so the tests speck runs report TAP as they would for a build.
const env = Object.fromEntries(Object.entries(shipEnv).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });

const PASS = "import { test } from 'node:test';\ntest('fine', () => {});\n";
const FAIL = "import { test } from 'node:test';\ntest('broken', () => { throw new Error('no'); });\n";

// A repo set up with speck and `node --test {files}`, where test/by-import.test.mjs names scripts/turns.mjs.
function speckRepo({ testFiles = 'node --test {files}', byImport = FAIL } = {}) {
  const dir = repo({
    'scripts/turns.mjs': 'export const a = 1;\n',
    'test/by-import.test.mjs': `${byImport}// '../scripts/turns.mjs'\n`,
    'test/ticket.test.mjs': PASS,
    'test/other.test.mjs': FAIL,
  });
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test_files', testFiles).status, 0);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'speck');
  gIn(dir, 'branch', '-qf', 'main', 'HEAD');
  write(dir, 'scripts/turns.mjs', 'export const a = 2;\n');
  return dir;
}

const lastLine = out => out.trimEnd().split('\n').at(-1);

// TAP as node --test writes it, with a failing test at each location.
const tap = (...locations) => ['TAP version 13', ...locations.flatMap((loc, i) => [
  `# Subtest: t${i}`, `not ok ${i + 1} - t${i}`, '  ---', '  duration_ms: 1', `  location: '${loc}:3:1'`, "  failureType: 'testCodeFailure'", '  ...',
]), `1..${locations.length}`, `# fail ${locations.length}`].join('\n');

test('0676 AC1: the files to run next are the given files, then each failing test\'s file, each once, from where speck ran', () => {
  const dir = repo({ 'test/a.test.mjs': '', 'test/b.test.mjs': '', 'test/c.test.mjs': '' });
  const at = f => path.join(dir, f);
  const out = tap(at('test/b.test.mjs'), at('test/a.test.mjs'), at('test/b.test.mjs'), at('test/c.test.mjs'));
  assert.deepEqual(nextRunFiles(out, [at('test/a.test.mjs')], dir, dir), ['test/a.test.mjs', 'test/b.test.mjs', 'test/c.test.mjs']);
  assert.deepEqual(nextRunFiles(out, [], dir, path.join(dir, 'test')), ['b.test.mjs', 'a.test.mjs', 'c.test.mjs']);
});

test('0676 AC1: a failing --related run ends with one line giving the command to run next', () => {
  const dir = speckRepo();
  const res = speck(dir, 'test', '--related', 'test/ticket.test.mjs');
  assert.notEqual(res.status, 0, res.stdout);
  assert.equal(lastLine(res.stdout), `${NEXT_RUN}speck test --files test/ticket.test.mjs test/by-import.test.mjs`);
  assert.equal(res.stdout.split('\n').filter(l => l.startsWith(NEXT_RUN)).length, 1);
  assert.equal(res.stderr.trim(), '', 'nothing printed after it');
});

test('0676 AC1: a failing given file is named once', () => {
  const dir = speckRepo();
  const res = speck(dir, 'test', '--related', 'test/other.test.mjs', 'test/ticket.test.mjs');
  assert.notEqual(res.status, 0);
  assert.equal(lastLine(res.stdout), `${NEXT_RUN}speck test --files test/other.test.mjs test/ticket.test.mjs test/by-import.test.mjs`);
});

test('0676 AC1: the line comes after the TAP, so the reviewer\'s summary doesn\'t take it as a test\'s output', () => {
  const dir = repo({ 'test/a.test.mjs': '' });
  const text = `${tap(path.join(dir, 'test/a.test.mjs'))}\n${NEXT_RUN}speck test --files test/a.test.mjs\n`;
  const summary = summariseTap(text, '0676', '/tmp/x');
  assert.match(summary, /Failing tests \(1\)/);
  assert.ok(!summary.includes(NEXT_RUN), summary);
});

test('0676 AC2: no line from a passing --related run or from any --files run', () => {
  const dir = speckRepo({ byImport: PASS });
  const passing = speck(dir, 'test', '--related', 'test/ticket.test.mjs');
  assert.equal(passing.status, 0, passing.stdout);
  assert.ok(!passing.stdout.includes(NEXT_RUN), passing.stdout);
  const files = speck(dir, 'test', '--files', 'test/other.test.mjs');
  assert.notEqual(files.status, 0);
  assert.ok(!files.stdout.includes(NEXT_RUN), files.stdout);
});

test('0676 AC2: no line when a failing --related run\'s failing tests\' files can\'t be read from its output', () => {
  const dir = speckRepo({ testFiles: 'echo not tap {files}; exit 1' });
  const res = speck(dir, 'test', '--related');
  assert.equal(res.status, 1);
  assert.ok(!res.stdout.includes(NEXT_RUN), res.stdout);
  const there = repo({ 'test/a.test.mjs': '' });
  const at = f => path.join(there, f);
  assert.equal(nextRunFiles('not tap', [], there, there), null, 'not TAP');
  assert.equal(nextRunFiles('TAP version 13\nok 1 - fine\n1..1', [], there, there), null, 'no failing test');
  assert.equal(nextRunFiles(tap(at('test/a.test.mjs')).replace(/ {2}location: .*\n/, ''), [], there, there), null, 'no location');
  assert.equal(nextRunFiles(tap(at('test/a.test.mjs'), at('test/gone.test.mjs')), [], there, there), null, 'a file that isn\'t there');
  assert.equal(nextRunFiles(tap('/elsewhere/x.test.mjs'), [], there, there), null, 'a file outside the repo');
});

test('0676 AC1: with commands.test_files blank, a failing --related run of the whole suite ends with the line too', () => {
  const dir = speckRepo({ testFiles: '' });
  assert.equal(speck(dir, 'config', 'set', 'commands.test', 'node --test').status, 0);
  const res = speck(dir, 'test', '--related', 'test/ticket.test.mjs');
  assert.notEqual(res.status, 0, res.stdout);
  assert.equal(lastLine(res.stdout), `${NEXT_RUN}speck test --files test/ticket.test.mjs test/by-import.test.mjs test/other.test.mjs`);
});

test('0676 AC2: no line from a --related run that stalled', () => {
  const dir = speckRepo({ byImport: `${FAIL}test('hangs', () => new Promise(r => setTimeout(r, 60000)));\n` });
  const res = spawnSync(process.execPath, [CLI, 'test', '--related'], { cwd: dir, encoding: 'utf8', env: { ...env, SPECK_STALL_MS: '1500' } });
  // by-import fails and prints its TAP, then the run writes nothing until it's ended as stalled.
  assert.notEqual(res.status, 0);
  assert.match(res.stdout + res.stderr, /stall/i);
  assert.ok(!res.stdout.includes(NEXT_RUN), res.stdout);
});

test('0676 AC1: a file whose name starts with - is given as ./ so it isn\'t read as an option', () => {
  const dir = speckRepo();
  write(dir, '-dash.test.mjs', FAIL);
  const res = speck(dir, 'test', '--related', '-dash.test.mjs');
  assert.notEqual(res.status, 0);
  assert.ok(lastLine(res.stdout).includes(' ./-dash.test.mjs '), res.stdout);
});

test('0676 AC4: the brief\'s speck test row describes the line', () => {
  const row = BRIEF.split('\n').find(l => l.startsWith('| `speck test` |'));
  const said = row.slice(row.indexOf('`speck test --related'));
  assert.match(said, /`[^`]*speck test --files <file>…`/, 'gives the line\'s command');
  assert.match(said, /`location:`/, 'reads the files from TAP locations');
});
