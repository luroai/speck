// 0657: the quick run each ship waits for always runs the files commands.checks lists, heavy or not, so a change that
// breaks one of the panel's house rules fails before review and ship rather than on main afterwards.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture, runWith, mostAtOnce } from './support/suite-fixture.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { checkFiles } from '../scripts/checks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUITE = path.join(ROOT, 'test', 'support', 'suite.mjs');

// Built here rather than written out, so this file is neither heavy nor marked itself.
const heavyCode = () => `const ${'startPanel'} = () => {};\n${'startPanel'}();`;
const marked = why => `${'//'} Full suite only: ${why}`;
const cleanEnv = () => { const e = { ...process.env }; delete e.NODE_TEST_CONTEXT; return e; };

const started = dir => {
  const log = path.join(dir, 'runs.log');
  return fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(l => l.startsWith('start ')).map(l => l.slice(6)).sort() : [];
};
// The suite fixture, with a speck/config.yml whose commands.checks is `checks`, written as given.
function withChecks(files, checks) {
  const dir = fixture(files);
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\ncommands:\n  test: node test/support/suite.mjs --quick\n  checks: ${checks}\n`);
  return dir;
}
const FILES = () => ({
  'plain.test.mjs': {}, 'heavy.test.mjs': { code: heavyCode() }, 'heavy-rule.test.mjs': { code: heavyCode() },
  'marked.test.mjs': { code: marked('it waits on the clock') }, 'marked-rule.test.mjs': { code: marked('it waits on the clock') },
});

test('0657 AC1: the quick run runs every file commands.checks lists, heavy or full-suite only, as well as the quick files', () => {
  for (const cores of [4, 16]) {
    const dir = withChecks(FILES(), '[test/heavy-rule.test.mjs, test/marked-rule.test.mjs]');
    const r = runWith(dir, { cores, concurrency: 4, quick: true });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.deepEqual(started(dir), ['heavy-rule.test.mjs', 'marked-rule.test.mjs', 'plain.test.mjs'], `${cores} cores`);
  }
});

test('0657 AC1: node test/support/suite.mjs --quick reads commands.checks from speck/config.yml', () => {
  const dir = withChecks(FILES(), 'test/heavy-rule.test.mjs');
  const r = spawnSync(process.execPath, [SUITE, '--quick'], { cwd: dir, env: cleanEnv(), encoding: 'utf8', timeout: 90000 });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(started(dir), ['heavy-rule.test.mjs', 'plain.test.mjs']);
});

test('0657 AC1: a failing check fails the quick run', () => {
  const dir = withChecks({ 'plain.test.mjs': {}, 'rule.test.mjs': { code: heavyCode(), fail: true } }, '[test/rule.test.mjs]');
  const r = runWith(dir, { cores: 16, concurrency: 4, quick: true });
  assert.equal(r.status, 1, r.stderr + r.stdout);
  assert.match(r.stdout, /not ok .* rule\.test\.mjs checks/);
});

test('0657 AC1: heavy checks in the quick run keep to the heavy limit on a machine with 8 cores or fewer', () => {
  const heavy = ['a', 'b', 'c'].map(n => `${n}.test.mjs`);
  const dir = withChecks({ 'plain.test.mjs': {}, ...Object.fromEntries(heavy.map(f => [f, { code: heavyCode(), ms: 300 }])) },
    `[${heavy.map(f => `test/${f}`).join(', ')}]`);
  const r = runWith(dir, { cores: 4, concurrency: 4, quick: true });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.deepEqual(started(dir), [...heavy, 'plain.test.mjs']);
  assert.ok(mostAtOnce(dir, heavy) <= 2, 'at most 2 heavy files at once');
});

test('0657 AC1: a listed check that doesn\'t exist fails the quick run with a plain message, running nothing', () => {
  const dir = withChecks(FILES(), '[test/gone.test.mjs]');
  const r = runWith(dir, { cores: 16, concurrency: 4, quick: true });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /commands\.checks .*test\/gone\.test\.mjs/);
  assert.doesNotMatch(r.stderr, /^\s+at /m, 'no stack trace');
  assert.deepEqual(started(dir), []);
});

test('0657 AC2: commands.checks lists the panel\'s house-rule files, and each listed file exists', () => {
  const listed = checkFiles(ROOT, loadConfig(ROOT, { machine: false }));
  for (const f of ['test/panel-0161.test.mjs', 'test/panel-0427.test.mjs', 'test/panel-0543.test.mjs', 'test/panel-0577.test.mjs']) {
    assert.ok(listed.includes(f), `${f} is in commands.checks`);
  }
});

test('0657 AC4: with no commands.checks, or no speck/config.yml, the quick run and the full run run what they did before', () => {
  for (const config of [false, true]) {
    const dir = config ? withChecks(FILES(), '""') : fixture(FILES());
    let r = runWith(dir, { cores: 16, concurrency: 4, quick: true });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.deepEqual(started(dir), ['plain.test.mjs'], `quick, config ${config}`);
    fs.rmSync(path.join(dir, 'runs.log'));
    r = runWith(dir, { cores: 16, concurrency: 4 });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.deepEqual(started(dir), Object.keys(FILES()).sort(), `full, config ${config}`);
  }
});
