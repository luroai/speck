// 0265: speck ship merges the remote's base branch into the local one when each has commits the other doesn't.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, remoteMoves, gIn } from './support/ship.mjs';

// Main in the main checkout gets a commit of its own, after the remote got one from elsewhere.
function diverged(r, { remoteFile = 'remote.txt', remoteContent = 'remote\n', localFile = 'other.txt', localContent = 'local\n' } = {}) {
  const bare = remoteMoves(r, remoteFile, remoteContent);
  const at = r.g('branch', '--show-current') === 'main' ? r.dir : null;
  if (!at) r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, localFile), localContent);
  r.g('add', localFile); r.g('commit', '-qm', 'mine');
  if (!at) r.g('checkout', '-q', 'speck/0001-export-bookings');
  return { bare, local: r.sha('main'), theirs: gIn(bare, 'rev-parse', 'main').stdout.trim() };
}

test('0265 AC1: a cleanly diverged base branch is merged with a merge commit, said in one line, and the ship carries on', () => {
  const r = shipRepo();
  const { bare, local, theirs } = diverged(r);
  const out = r.run('ship', '1');
  assert.equal(out.status, 0, out.stderr + out.stdout);
  const said = out.stdout.split('\n').filter(l => l.includes('someone else'));
  assert.equal(said.length, 1, out.stdout);
  assert.match(said[0], /merg/i);
  assert.match(said[0], new RegExp(theirs.slice(0, 7)));
  // A merge commit with the local base first and the remote's second, then the ticket merged on top.
  const merge = r.g('log', '--merges', '--format=%H %P', 'main').split('\n').find(l => l.endsWith(`${local} ${theirs}`));
  assert.ok(merge, r.g('log', '--graph', '--oneline', 'main'));
  assert.equal(fs.readFileSync(path.join(r.dir, 'remote.txt'), 'utf8'), 'remote\n');
  assert.equal(fs.readFileSync(path.join(r.dir, 'other.txt'), 'utf8'), 'local\n');
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'feature\n');
  assert.equal(r.statusIn(r.dir), 'done');
  assert.equal(gIn(bare, 'rev-parse', 'main').stdout.trim(), r.sha('main'), 'pushed');
});

test('0265 AC1: the merge works when the base branch is checked out nowhere', () => {
  const r = shipRepo({ worktree: false });
  const { bare, local, theirs } = diverged(r);
  const out = r.run('ship', '1');
  assert.equal(out.status, 0, out.stderr + out.stdout);
  assert.ok(r.g('log', '--merges', '--format=%P', 'main').split('\n').includes(`${local} ${theirs}`));
  assert.equal(r.g('show', 'main:remote.txt'), 'remote');
  assert.equal(gIn(bare, 'rev-parse', 'main').stdout.trim(), r.sha('main'));
});

test('0265 AC2: when the two would conflict, ship refuses as before and changes nothing', () => {
  const r = shipRepo();
  diverged(r, { remoteFile: 'other.txt', remoteContent: 'remote\n' });
  fs.writeFileSync(path.join(r.dir, 'notes.txt'), 'mine, unstaged\n');
  const before = r.snapshot();
  const out = r.run('ship', '1');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr + out.stdout, /each have commits the other doesn't/);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(gIn(r.dir, 'diff', '--cached', '--name-only').stdout, '');
});

test('0265 AC3: uncommitted changes and untracked files stay as they were through the merge', () => {
  const r = shipRepo();
  diverged(r);
  fs.writeFileSync(path.join(r.dir, 'notes.txt'), 'mine, unstaged\n');
  fs.writeFileSync(path.join(r.dir, 'scratch.txt'), 'untracked\n');
  const out = r.run('ship', '1');
  assert.equal(out.status, 0, out.stderr + out.stdout);
  assert.equal(fs.readFileSync(path.join(r.dir, 'notes.txt'), 'utf8'), 'mine, unstaged\n');
  assert.equal(fs.readFileSync(path.join(r.dir, 'scratch.txt'), 'utf8'), 'untracked\n');
  assert.match(gIn(r.dir, 'status', '--porcelain').stdout, /^ M notes\.txt/);
  assert.match(r.g('status', '--porcelain'), /\?\? scratch\.txt/);
});

test('0265 AC3: an untracked file the merge would overwrite stops the ship, named, with nothing changed', () => {
  const r = shipRepo();
  diverged(r);
  fs.writeFileSync(path.join(r.dir, 'remote.txt'), 'my own\n');
  const before = r.snapshot();
  const out = r.run('ship', '1');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /remote\.txt/);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(fs.readFileSync(path.join(r.dir, 'remote.txt'), 'utf8'), 'my own\n');
});

test('0265 AC3: an uncommitted change the merge would overwrite stops the ship, named, with nothing changed', () => {
  const r = shipRepo();
  diverged(r, { remoteFile: 'notes.txt' });
  fs.writeFileSync(path.join(r.dir, 'notes.txt'), 'mine, unstaged\n');
  const before = r.snapshot();
  const out = r.run('ship', '1');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /notes\.txt/);
  assert.deepEqual(r.snapshot(), before);
});

test('0265 AC4: when the ship then fails, the merge commit stays on the local base branch', () => {
  const r = shipRepo({ test: 'false' });
  const { local, theirs } = diverged(r);
  const out = r.run('ship', '1');
  assert.notEqual(out.status, 0);
  assert.equal(r.g('rev-parse', 'main^1'), local);
  assert.equal(r.g('rev-parse', 'main^2'), theirs);
  assert.equal(r.g('rev-parse', 'HEAD'), r.sha('main'), 'the main checkout is on the merge');
  assert.equal(r.g('status', '--porcelain', '--untracked-files=no'), '');
  assert.equal(r.statusIn(r.wt), 'approved');
});
