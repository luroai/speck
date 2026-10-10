// 0099: when a ship's tests fail, speck ship runs them on the base branch too, and exits 14 when that fails as well.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipRepo, runIn, gIn } from './support/ship.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

// A ship whose test command logs the folder it ran in, then runs `check` there. On the ticket branch shared.txt
// holds "feature", and on main "base", so `grep -q base shared.txt` fails on the branch and passes on main.
function failingShip(check, opts = {}) {
  const log = path.join(fs.realpathSync(os.tmpdir()), `ran-${Math.random().toString(36).slice(2)}.log`);
  const r = shipRepo({ test: `pwd -P >> ${log}; ${check}`, ...opts });
  const ran = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [];
  const worktrees = () => gIn(r.dir, 'worktree', 'list', '--porcelain').stdout;
  return { ...r, ran, worktrees };
}

test('0099 AC1: a failing ship runs the tests on the base branch in a temporary worktree, then removes it', () => {
  const r = failingShip('false');
  const before = r.worktrees();
  const res = runIn(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  const ran = r.ran();
  assert.equal(ran.length, 2, `the tests ran twice: ${ran.join(', ')}`);
  assert.equal(ran[0], r.wt, 'first on the ticket branch');
  assert.ok(![r.dir, r.wt].includes(ran[1]), 'then in a folder of its own');
  assert.equal(fs.existsSync(ran[1]), false, 'the temporary worktree is gone');
  assert.equal(r.worktrees(), before, 'git no longer lists it');
});

test('0099 AC1: the base branch is tested as it is, not with the ticket\'s change', () => {
  const r = failingShip('grep -q base shared.txt');
  runIn(r.dir, 'ship', '1');
  assert.equal(r.ran().length, 2);
});

test('0099 AC1: the temporary worktree gets worktree_setup, like a build\'s worktree', () => {
  const r = failingShip('test -f setup-ran');
  for (const dir of [r.dir, r.wt]) {
    const cfg = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^worktree_setup: .*$/m, 'worktree_setup: "touch setup-ran"'));
  }
  r.g('commit', '-qam', 'setup'); gIn(r.wt, 'commit', '-qam', 'setup');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.match(res.stderr, /tests pass/, 'the setup ran, so main\'s tests passed');
});

test('0099 AC1: if worktree_setup fails there, it refuses as before and says main couldn\'t be checked', () => {
  const r = failingShip('false');
  for (const dir of [r.dir, r.wt]) {
    const cfg = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^worktree_setup: .*$/m, 'worktree_setup: "exit 4"'));
  }
  r.g('commit', '-qam', 'setup'); gIn(r.wt, 'commit', '-qam', 'setup');
  const before = r.worktrees();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr);
  noTrace(res);
  assert.match(res.stderr, /Tests failed on the approved branch, so nothing was shipped/);
  assert.match(res.stderr, /worktree_setup/);
  assert.equal(r.ran().length, 1, 'main\'s tests never ran');
  assert.equal(r.worktrees(), before);
});

test('0099 AC2: if the base branch fails too, it exits 14 and says main is failing, not the ticket', () => {
  const r = failingShip('false');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 14, res.stderr);
  noTrace(res);
  assert.match(res.stderr, /main's own tests are failing/);
  assert.match(res.stderr, /isn't the ticket's fault/);
  assert.match(res.stderr, /Nothing was shipped/);
});

test('0099 AC2: speck ship --auto exits 14 too', () => {
  const r = failingShip('false');
  for (const dir of [r.dir, r.wt]) {
    const cfg = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship: .*$/m, 'auto_ship: true'));
  }
  r.g('commit', '-qam', 'auto'); gIn(r.wt, 'commit', '-qam', 'auto');
  const res = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(res.status, 14, res.stderr);
});

test('0099 AC2: without worktrees, it exits 14 too', () => {
  const r = failingShip('false', { worktree: false });
  const before = r.worktrees();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 14, res.stderr);
  assert.equal(r.worktrees(), before);
});

test('0099 AC3: if the base branch passes, it refuses as before and adds that main\'s tests pass', () => {
  const r = failingShip('grep -q base shared.txt');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr);
  noTrace(res);
  assert.match(res.stderr, /Tests failed on the approved branch, so nothing was shipped/);
  assert.match(res.stderr, /main's tests pass/);
});

test('0099 AC4: either way, nothing else changes', () => {
  for (const check of ['false', 'grep -q base shared.txt']) {
    for (const worktree of [true, false]) {
      const r = failingShip(check, { worktree });
      const before = { snap: r.snapshot(), wts: r.worktrees(), branches: r.g('branch', '--list'), stash: r.g('stash', 'list') };
      const res = runIn(r.dir, 'ship', '1');
      assert.notEqual(res.status, 0);
      assert.deepEqual({ snap: r.snapshot(), wts: r.worktrees(), branches: r.g('branch', '--list'), stash: r.g('stash', 'list') }, before, `${check}, worktree ${worktree}`);
      assert.equal(r.statusIn(r.wt), 'approved');
      assert.equal(r.g('status', '--porcelain'), '', 'no files left behind in the main checkout');
    }
  }
});
