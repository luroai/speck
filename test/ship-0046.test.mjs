import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, remoteMoves, gIn, runIn } from './support/ship.mjs';

// ---------- 0046: a refused ship never wipes uncommitted changes ----------

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const staged = (dir, f) => gIn(dir, 'show', `:${f}`).stdout;
const status = dir => gIn(dir, 'status', '--porcelain', '--untracked-files=no').stdout;
const noTrace = res => assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');

test('0046 AC1: changes made in the base checkout while the tests run refuse the ship, named and untouched', () => {
  const r = shipRepo({ test: "printf 'mine\\n' > {main}/shared.txt && printf 'staged\\n' > {main}/notes.txt && git -C {main} add notes.txt && printf 'both\\n' > {main}/notes.txt" });
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /shared\.txt/);
  assert.match(res.stderr, /notes\.txt/);
  assert.match(res.stderr, /uncommitted/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.equal(status(r.dir), 'MM notes.txt\n M shared.txt\n', 'staged and unstaged states kept');
  assert.equal(read(r.dir, 'shared.txt'), 'mine\n');
  assert.equal(read(r.dir, 'notes.txt'), 'both\n');
  assert.equal(staged(r.dir, 'notes.txt'), 'staged\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main, 'main unchanged');
  assert.equal(after.branch, before.branch, 'branch unchanged');
  assert.deepEqual(after.wt, before.wt, 'the ticket\'s worktree unchanged');
  assert.equal(after.dir.head, before.dir.head);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0046 AC1: without a worktree, tracked changes left by the tests refuse the ship and stay put', () => {
  const r = shipRepo({ worktree: false, test: "printf 'mine\\n' > other.txt" });
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /other\.txt/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M other.txt\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
  assert.equal(after.dir.branch, before.dir.branch, 'still on the ticket branch');
  assert.equal(r.statusIn(r.dir), 'approved');
});

test('0046 AC2/AC3: a conflict keeps uncommitted changes in both folders and names the conflicting file', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
  r.g('commit', '-qam', 'main moves on');
  const before = r.snapshot();
  // Git refuses to merge over staged changes, so only the worktree, where nothing is merged, can have them here.
  r.hook("printf 'mine\\n' > {main}/other.txt && printf 'staged\\n' > {wt}/notes.txt && git -C {wt} add notes.txt && printf 'wt\\n' > {wt}/other.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /hit a conflict/);
  assert.match(res.stderr, /shared\.txt/);
  assert.equal(status(r.dir), ' M other.txt\n');
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  assert.equal(read(r.dir, 'shared.txt'), 'main side\n');
  assert.equal(status(r.wt), 'M  notes.txt\n M other.txt\n', 'staged and unstaged states kept');
  assert.equal(staged(r.wt, 'notes.txt'), 'staged\n');
  assert.equal(read(r.wt, 'other.txt'), 'wt\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
  assert.equal(after.dir.head, before.dir.head);
  assert.equal(after.wt.head, before.wt.head, 'the ship commit is undone');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0046 AC2: without a worktree, a conflict keeps the uncommitted change and returns to the ticket branch', () => {
  const r = shipRepo({ worktree: false });
  r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
  r.g('commit', '-qam', 'main moves on');
  r.g('checkout', '-q', 'speck/0001-export-bookings');
  const before = r.snapshot();
  r.hook("printf 'mine\\n' > {main}/notes.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /hit a conflict/);
  assert.equal(status(r.dir), ' M notes.txt\n');
  assert.equal(read(r.dir, 'notes.txt'), 'mine\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
  assert.equal(after.dir.branch, 'speck/0001-export-bookings');
  assert.equal(r.statusIn(r.dir), 'approved');
});

test('0046 AC2: a conflict after catching up with the remote undoes the catch-up and keeps uncommitted changes', () => {
  const r = shipRepo();
  remoteMoves(r, 'shared.txt', 'changed elsewhere\n');
  const before = r.snapshot();
  r.hook("printf 'mine\\n' > {main}/notes.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /hit a conflict/);
  assert.equal(status(r.dir), ' M notes.txt\n');
  assert.equal(read(r.dir, 'notes.txt'), 'mine\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main, 'main is exactly as it was');
  assert.equal(after.branch, before.branch);
});

test('0046 AC3: a merge that would overwrite uncommitted changes says so, names the files and keeps them', () => {
  const r = shipRepo();
  const before = r.snapshot();
  r.hook("printf 'mine\\n' > {main}/shared.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.doesNotMatch(res.stderr, /conflict/i);
  assert.match(res.stderr, /uncommitted changes/);
  assert.match(res.stderr, /shared\.txt/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.equal(read(r.dir, 'shared.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M shared.txt\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
  assert.equal(after.wt.head, before.wt.head);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0046 AC3: catching up with the remote over uncommitted changes says so and keeps them', () => {
  const r = shipRepo();
  remoteMoves(r, 'other.txt', 'changed elsewhere\n');
  const before = r.snapshot();
  r.hook("printf 'mine\\n' > {main}/other.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.doesNotMatch(res.stderr, /conflict/i);
  assert.match(res.stderr, /uncommitted changes/);
  assert.match(res.stderr, /other\.txt/);
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
});

test('0046 AC4: tests that leave changes in the ticket\'s own worktree still ship, and a clean ship is unchanged', () => {
  const r = shipRepo({ test: "printf 'left behind\\n' > other.txt" });
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(res.stdout, /Shipped 0001/);
  assert.match(r.g('log', '-1', '--format=%s', 'main'), /speck\(0001\): Export bookings/);
  assert.equal(fs.existsSync(r.wt), false, 'worktree removed');
  assert.equal(read(r.dir, 'other.txt'), 'base\n');
  assert.equal(status(r.dir), '');

  const plain = shipRepo({ worktree: false });
  const p = runIn(plain.dir, 'ship', '1');
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.equal(plain.g('branch', '--show-current'), 'main', 'leaves you on main');
  assert.equal(status(plain.dir), '');
  assert.equal(plain.statusIn(plain.dir), 'done');
});

test('0046 (self-check): without a worktree, a change that stops the switch to main is named and kept, and the ship commit undone', () => {
  const r = shipRepo({ worktree: false });
  const before = r.snapshot();
  r.hook("printf 'mine\\n' > {main}/shared.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /uncommitted changes to shared\.txt/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.equal(read(r.dir, 'shared.txt'), 'mine\n');
  assert.equal(status(r.dir), ' M shared.txt\n');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch, 'the ship commit is undone');
  assert.equal(after.dir.branch, 'speck/0001-export-bookings');
  assert.equal(r.statusIn(r.dir), 'approved');
});

test('0046 (self-check): changes that cannot be put back in place are saved in the stash, and the message says how to get them', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
  r.g('commit', '-qam', 'main moves on');
  const before = r.snapshot();
  // The ship commit sets the ticket's status to done, which the undo takes away again, so an edit to that same line can't go back in place.
  r.hook("t={wt}/speck/tickets/done/0001-export-bookings.md && sed 's/^status: done/status: edited/' $t > $t.new && mv $t.new $t");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /hit a conflict/);
  assert.match(res.stderr, /git stash pop --index/);
  assert.ok(res.stderr.includes(r.wt), 'names the folder');
  assert.match(gIn(r.wt, 'stash', 'list').stdout, /speck ship 0001/);
  assert.match(gIn(r.wt, 'stash', 'show', '-p', 'stash@{0}').stdout, /\+status: edited/, 'the stash holds the change');
  const after = r.snapshot();
  assert.equal(after.main, before.main);
  assert.equal(after.branch, before.branch);
  assert.equal(after.wt.head, before.wt.head);
  assert.equal(status(r.wt), '');
  assert.equal(r.statusIn(r.wt), 'approved');
});
