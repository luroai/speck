import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, remoteMoves, gIn, runIn } from './support/ship.mjs';

// ---------- Shipping while you keep editing in the main checkout ----------
// The ticket changes shared.txt. Edits to other files in the base checkout stay there, uncommitted, through the merge.

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const status = dir => gIn(dir, 'status', '--porcelain', '--untracked-files=no').stdout;
const shipped = r => { assert.equal(r.statusIn(r.dir), 'done'); assert.equal(read(r.dir, 'shared.txt'), 'feature\n'); };

test('ship merges over an uncommitted edit to a file the ticket does not change, and keeps it', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  shipped(r);
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M other.txt\n', 'still uncommitted, and not in the merge');
  assert.equal(gIn(r.dir, 'show', 'main:other.txt').stdout, 'base\n');
});

test('ship keeps an unrelated edit made while the tests run', () => {
  const r = shipRepo({ test: "printf 'mine\\n' > {main}/notes.txt" });
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  shipped(r);
  assert.equal(read(r.dir, 'notes.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M notes.txt\n');
});

test('ship refuses an uncommitted edit to a file the ticket changes, names it and leaves it', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'mine\n');
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'fine\n');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /shared\.txt \(the ticket changes it too\)/);
  assert.doesNotMatch(res.stderr, /other\.txt/, 'only the files in the way are named');
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('ship refuses staged changes in the base checkout, even in a file the ticket does not change', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /other\.txt \(staged\)/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
});

test('ship catches up with the remote, merges and pushes over an unrelated uncommitted edit', () => {
  const r = shipRepo();
  const bare = remoteMoves(r, 'remote.txt', 'theirs\n');
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  shipped(r);
  assert.equal(read(r.dir, 'remote.txt'), 'theirs\n');
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M other.txt\n');
  assert.equal(gIn(bare, 'rev-parse', 'main').stdout, gIn(r.dir, 'rev-parse', 'main').stdout, 'pushed');
});
