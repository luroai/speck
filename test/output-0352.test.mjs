// 0352: `speck output <id>` gives a document task's folder in the main checkout's outputs/, making it if it's missing.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, fm, good } from './support/run.mjs';

// One repo, set up once: a code ticket and document tasks with good and bad outputs, and a worktree of it. Both are
// named speck-keep-*, so they last until the file's tests are done.
const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-output-')));
const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
g('init', '-q', '-b', 'main');
assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
const tickets = {
  '0001': {},
  '0002': { task: 'document', output: 'strategy-2027/pricing/' },
  '0003': { task: 'document', output: 'emails' },
  '0004': { task: 'document', output: '../x' },
  '0005': { task: 'document', output: '/tmp/x' },
  '0006': { task: 'document', output: '""' },
  '0007': { task: 'document' },
};
for (const [id, o] of Object.entries(tickets))
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', `${id}-t.md`), `---\n${fm({ id: `"${id}"`, ...o })}\n---\n${good}`);
g('add', '-A'); g('commit', '-qm', 'base');
const wt = path.join(path.dirname(dir), `${path.basename(dir)}-wt`);
g('worktree', 'add', '-q', '-b', 'other', wt, 'main');
const outputs = path.join(dir, 'outputs');

test('0352 AC1: speck output prints the folder in the main checkout\'s outputs/, making it, from the main checkout', () => {
  const r = speck(dir, 'output', '2');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), path.join(outputs, 'strategy-2027', 'pricing') + path.sep);
  assert.ok(path.isAbsolute(r.stdout.trim()));
  assert.ok(fs.statSync(path.join(outputs, 'strategy-2027', 'pricing')).isDirectory());
  const again = speck(dir, 'output', '0002');
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.stdout, r.stdout, 'the same folder when it already exists');
});

test('0352 AC1: from a worktree it still prints, and makes, the folder in the main checkout', () => {
  const r = speck(wt, 'output', '3');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), path.join(outputs, 'emails') + path.sep);
  assert.ok(fs.statSync(path.join(outputs, 'emails')).isDirectory());
  assert.ok(!fs.existsSync(path.join(wt, 'outputs')), 'nothing in the worktree');
});

test('0352 AC2: speck output refuses a code ticket or a document task whose output fails lint, making nothing', () => {
  const before = fs.existsSync(outputs) ? fs.readdirSync(outputs, { recursive: true }).sort() : [];
  for (const [id, why] of [['1', /code ticket|not a document/i], ['4', /outputs\//], ['5', /absolute/], ['6', /output/], ['7', /output/]]) {
    for (const cwd of [dir, wt]) {
      const r = speck(cwd, 'output', id);
      assert.notEqual(r.status, 0, `ticket ${id} is refused`);
      assert.equal(r.stdout, '', `ticket ${id}: no folder printed`);
      assert.match(r.stderr, why, `ticket ${id}: says why`);
      assert.doesNotMatch(r.stderr, /\n\s+at /, `ticket ${id}: no stack trace`);
    }
  }
  const after = fs.existsSync(outputs) ? fs.readdirSync(outputs, { recursive: true }).sort() : [];
  assert.deepEqual(after, before, 'nothing made');
  assert.ok(!fs.existsSync(path.join(path.dirname(dir), 'x')) && !fs.existsSync(path.join(wt, 'outputs')));
});

test('0352 AC2: speck output with no id or an unknown one says what to do', () => {
  for (const args of [[], ['99']]) {
    const r = speck(dir, 'output', ...args);
    assert.notEqual(r.status, 0);
    assert.ok(r.stderr.trim(), 'a message');
    assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
});

test('0352 AC1: a file where the folder should be gives a plain error', () => {
  fs.mkdirSync(outputs, { recursive: true });
  const t = path.join(dir, 'speck', 'tickets', '0008-t.md');
  fs.writeFileSync(t, `---\n${fm({ id: '"0008"', task: 'document', output: 'afile/sub' })}\n---\n${good}`);
  fs.writeFileSync(path.join(outputs, 'afile'), 'not a folder');
  const r = speck(dir, 'output', '8');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /afile/);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
  fs.rmSync(t);
});

test('0352 AC1: speck help lists speck output', () => {
  assert.match(speck(dir, 'help').stdout, /speck output <id>/);
});
