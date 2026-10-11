import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0096: speck lint warns when a criterion asks for the whole suite to pass ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const WORDING = 'no test that passed before this change fails';

// A fresh repo with one ticket whose acceptance criteria are `criteria`, otherwise lint-clean.
function repo(criteria) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-lint-')));
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const run = args => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run(['init', '--skip-checks']).status, 0);
  const file = path.join(dir, run(['new', 'Export CSV']).stdout.trim());
  const head = fs.readFileSync(file, 'utf8').split('## Problem')[0];
  const ac = criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  fs.writeFileSync(file, `${head}## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n${ac}\n## Out of scope\n- PDF export\n## Notes\n`);
  return { dir, run, file };
}
const suiteWarnings = out => out.split('\n').filter(l => l.startsWith('! ') && l.includes(WORDING));

test('0096 AC1: the speck-ticket skill asks for "no test that passed before this change fails", never "the full test suite passes"', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ticket', 'SKILL.md'), 'utf8');
  const line = skill.split('\n').find(l => l.includes(`"${WORDING}"`));
  assert.ok(line, 'the skill gives the suite-wide wording');
  assert.match(line, /never[^.]*"the full test suite passes"/i);
});

for (const phrase of [
  'The full test suite passes.',
  'The whole test suite passes after the change.',
  'The entire suite passes.',
  'All tests pass.',
  'All the tests still pass.',
  'all existing tests pass',
  'All tests must pass.',
  'The entire test suite should pass.',
  'All tests must still pass.',
  'The full suite continues to pass.',
  'All tests are green.',
]) {
  test(`0096 AC2: "${phrase}" gets a ! warning naming the criterion and suggesting the wording`, () => {
    const r = repo(['Export button downloads a CSV.', phrase]);
    const out = r.run(['lint', '1']);
    const w = suiteWarnings(out.stdout);
    assert.equal(w.length, 1, out.stdout);
    assert.match(w[0], /[Cc]riterion 2\b/);
    assert.ok(w[0].includes(phrase), w[0]);
  });
}

test('0096 AC2: each criterion asking for the whole suite gets its own warning', () => {
  const r = repo(['The full test suite passes.', 'Export button downloads a CSV.', 'All tests pass.']);
  const w = suiteWarnings(r.run(['lint', '1']).stdout);
  assert.equal(w.length, 2, w.join('\n'));
  assert.match(w[0], /[Cc]riterion 1\b/);
  assert.match(w[1], /[Cc]riterion 3\b/);
});

test('0096 AC3: the warning does not make speck lint fail', () => {
  const r = repo(['Export button downloads a CSV.', 'The full test suite passes.']);
  const out = r.run(['lint', '1']);
  assert.equal(suiteWarnings(out.stdout).length, 1, out.stdout);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.match(out.stdout, /✓ .*passes size rules/);
});

test('0096 AC3: the warning does not stop speck set <id> status ready', () => {
  const r = repo(['Export button downloads a CSV.', 'The full test suite passes.']);
  const out = r.run(['set', '1', 'status', 'ready']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.match(fs.readFileSync(r.file, 'utf8'), /^status: ready\b/m);
});

for (const phrase of [
  'Export button downloads a CSV.',
  `${WORDING[0].toUpperCase()}${WORDING.slice(1)}.`,
  'The export test passes.',
  'All tests in test/export.test.mjs are renamed to match the file.',
  'The full export runs in under a second.',
  'The whole suite of export options is listed.',
  'All tests passively document expected behaviour.',
  'The skill says never to write "the full test suite passes".',
  'Lint flags “all tests pass” and `the whole suite passes` as wording to avoid.',
]) {
  test(`0096 AC4: "${phrase}" gets no whole-suite warning`, () => {
    const r = repo([phrase]);
    const out = r.run(['lint', '1']);
    assert.deepEqual(suiteWarnings(out.stdout), [], out.stdout);
    assert.equal(out.status, 0, out.stdout + out.stderr);
  });
}

test('0096 AC2: a criterion wrapped onto a second line is checked whole, and the warning quotes all of it', () => {
  const r = repo(['Export button downloads a CSV, and once it does the full test\n   suite passes.']);
  const w = suiteWarnings(r.run(['lint', '1']).stdout);
  assert.equal(w.length, 1, w.join('\n'));
  assert.match(w[0], /[Cc]riterion 1\b/);
  assert.ok(w[0].includes('the full test suite passes'), w[0]);
});
