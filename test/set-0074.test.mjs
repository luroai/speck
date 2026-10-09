import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0074: speck set writes values that read back exactly as given ----------

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'speck.mjs');
const VALUES = ['It\'s fine', 'A \'quoted\' word', 'Say "hi" now', 'Ends with a quote\'', 'Tom\'s and Ann\'s', 'plain title'];
const body = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;

// A fresh repo with one ticket made from the template, with a filled-in body so it can pass lint.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-set-')));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['init', '-q'], { cwd: dir });
  assert.equal(run('init', '--skip-checks').status, 0);
  const file = path.join(dir, run('new', 'Placeholder').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + body);
  return { run, file, line: key => fs.readFileSync(file, 'utf8').split('\n').find(l => l.startsWith(`${key}:`)) };
}
const statusJson = run => JSON.parse(run('status', '--json').stdout).tickets[0];

for (const v of VALUES) {
  test(`0074 AC1, AC3, AC4: a title of ${JSON.stringify(v)} reads back exactly, keeps its comment and passes lint`, () => {
    const { run, file, line } = repo();
    const set = run('set', '1', 'title', v);
    assert.equal(set.status, 0, set.stderr);
    assert.equal(statusJson(run).title, v, 'AC1: status --json');
    assert.ok(run('status').stdout.split('\n').some(l => l.endsWith(`S/low  ${v}`)), 'AC1: status lists the exact title');
    assert.ok(fs.readFileSync(file, 'utf8').includes(`\n# 0001 · ${v}\n`), 'AC1: the heading is the exact title');
    assert.match(line('title'), /\s+# one outcome, no "and"$/, 'AC3: the trailing comment stays on the line');
    const lint = run('lint', '1');
    assert.equal(lint.status, 0, `AC4: lint passes\n${lint.stdout}${lint.stderr}`);
    assert.doesNotMatch(lint.stdout, /# one outcome/, 'AC4: no warning quotes the comment');
  });

  test(`0074 AC2, AC3: a source of ${JSON.stringify(v)} reads back exactly and keeps its comment`, () => {
    const { run, line } = repo();
    assert.equal(run('set', '1', 'source', v).status, 0);
    assert.equal(statusJson(run).source, v, 'AC2: source');
    assert.match(line('source'), /\s+# e\.g\. speck\/ideas\//, 'AC3: the trailing comment stays on the line');
    assert.equal(run('set', '1', 'reviewer_model', v).status, 0);
    assert.equal(statusJson(run).reviewer_model, v, 'AC2: reviewer_model');
  });
}

test('0074 AC2: values that are entirely quoted, padded or hold a backslash read back exactly', () => {
  const { run } = repo();
  for (const v of [' padded ', '"', '\'', '"hi"', '\'hi\'', '"a" and "b"', 'back\\slash "q"', 'it\'s: # odd']) {
    assert.equal(run('set', '1', 'source', v).status, 0);
    assert.equal(statusJson(run).source, v, v);
  }
});

test('0074: plain values speck set writes keep their types', () => {
  const { run, line } = repo();
  assert.equal(run('set', '1', 'priority', '2').status, 0);
  assert.equal(statusJson(run).priority, 2);
  assert.equal(run('set', '1', 'after', '["0002", "0003"]').status, 0);
  assert.deepEqual(statusJson(run).after, ['0002', '0003']);
  assert.equal(run('set', '1', 'title', 'plain title').status, 0);
  assert.match(line('title'), /^title: plain title\s+#/, 'a plain title is still written without quotes');
});
