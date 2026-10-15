// 0212: a ship that was stopped partway leaves nothing that stops the ticket's next ship.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { shipRepo, BRANCH, CLI, env, gIn, runIn } from './support/ship.mjs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

// A ship repo whose first test run kills its own `speck ship` with SIGKILL, while the merged result is checked out;
// every later run passes. main moves on first, so the merge has something of main's in it.
function killedOnce({ worktree = true, auto = false } = {}) {
  const flag = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0212-')), 'killed');
  const record = '{main}/speck/.cache/runs/0001.ship.json';
  const r = shipRepo({ worktree, test: `if [ ! -f ${flag} ]; then touch ${flag}; kill -9 $(sed -n 's/.*"pid":\\([0-9]*\\).*/\\1/p' ${record}); sleep 1; fi` });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  if (auto) fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  if (!worktree) r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'moved\n');
  r.g('commit', '-qam', 'main moves on');
  if (!worktree) r.g('checkout', '-q', BRANCH);
  // Like a real main checkout, it has an untracked file, so a ship that falls back to it refuses.
  if (worktree) fs.writeFileSync(path.join(r.dir, 'scratch.txt'), 'mine\n');
  const tip = r.sha(BRANCH);
  const first = runIn(r.dir, 'ship', '1', ...(auto ? ['--auto'] : []));
  assert.equal(first.signal ?? 'SIGKILL', 'SIGKILL', first.stdout + first.stderr);
  assert.notEqual(first.status, 0, 'the first ship was killed');
  return { ...r, tip, folder: worktree ? r.wt : r.dir };
}

const on = cwd => gIn(cwd, 'branch', '--show-current').stdout.trim();

test('0212 AC1: the next ship puts the ticket\'s worktree back on its branch, then ships', () => {
  const r = killedOnce();
  assert.equal(on(r.wt), '', 'the killed ship left the worktree on the merged result, detached');
  const res = runIn(r.dir, 'ship', '1');
  noTrace(res);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.doesNotMatch(res.stdout + res.stderr, /uncommitted or untracked/);
  assert.equal(r.g('show', 'main:shared.txt'), 'feature', 'the ticket\'s change landed');
  assert.equal(r.g('show', 'main:other.txt'), 'moved', 'with main\'s');
  assert.equal(gIn(r.dir, 'merge-base', '--is-ancestor', r.tip, 'main').status, 0, 'every commit on the branch is in main');
  assert.equal(r.sha(BRANCH), '', 'the branch was deleted as usual');
  assert.equal(fs.existsSync(r.wt), false, 'and its worktree removed');
  assert.equal(on(r.dir), 'main', 'the main checkout stayed on main');
  assert.equal(fs.readFileSync(path.join(r.dir, 'scratch.txt'), 'utf8'), 'mine\n');
});

test('0212 AC1: an auto-ship puts it back the same way', () => {
  const r = killedOnce({ auto: true });
  const res = spawnSync(process.execPath, [CLI, 'ship', '0001', '--auto'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_SHIP_ALONE: '1' } });
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(r.g('show', 'main:shared.txt'), 'feature');
});

test('0212 AC1: without worktrees, the next ship puts the checkout back on the ticket\'s branch, then ships', () => {
  const r = killedOnce({ worktree: false });
  assert.equal(on(r.dir), '', 'the killed ship left the checkout detached');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(r.g('show', 'main:shared.txt'), 'feature');
  assert.equal(gIn(r.dir, 'merge-base', '--is-ancestor', r.tip, 'main').status, 0);
});

test('0212 AC1: a ship refused after putting it back leaves the worktree on its branch, with nothing lost', () => {
  const r = killedOnce();
  // main gets a commit that clashes with the ticket, so this ship refuses with a conflict after putting the worktree back.
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'clash\n');
  r.g('commit', '-qam', 'clash');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 13, res.stdout + res.stderr);
  assert.equal(on(r.wt), BRANCH);
  assert.equal(r.sha(BRANCH), r.tip, 'the branch is where it was');
});

// The ticket's worktree where speck start puts it, so speck knows it's the ticket's even when the branch isn't there.
function startWorktree(r) {
  r.g('worktree', 'remove', '--force', r.wt);
  const at = path.join(path.dirname(r.dir), `${path.basename(r.dir)}.worktrees`, ...BRANCH.split('/'));
  assert.equal(gIn(r.dir, 'worktree', 'add', '-q', at, BRANCH).status, 0);
  return fs.realpathSync(at);
}

test('0212 AC3: a ticket worktree that isn\'t on its branch, and isn\'t a ship\'s merge, is refused naming the worktree', () => {
  const r = shipRepo();
  const wt = startWorktree(r);
  gIn(wt, 'checkout', '-q', '--detach', 'main');
  const before = { main: r.sha('main'), branch: r.sha(BRANCH) };
  const res = runIn(r.dir, 'ship', '1');
  noTrace(res);
  assert.notEqual(res.status, 0);
  assert.doesNotMatch(res.stderr, /uncommitted or untracked/);
  assert.match(res.stderr, new RegExp(wt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'names the ticket\'s worktree');
  assert.match(res.stderr, new RegExp(`git checkout ${BRANCH}`), 'says how to fix it');
  assert.deepEqual({ main: r.sha('main'), branch: r.sha(BRANCH) }, before, 'nothing changed');
  assert.equal(on(wt), '', 'the worktree is left as it was');
});

test('0212 AC3: a killed ship\'s worktree that can\'t be put back is refused naming it, and left as it is', () => {
  const r = killedOnce();
  fs.writeFileSync(path.join(r.wt, 'other.txt'), 'edited there\n'); // differs on the branch, so git won't switch over it
  const res = runIn(r.dir, 'ship', '1');
  noTrace(res);
  assert.notEqual(res.status, 0);
  assert.doesNotMatch(res.stderr, /uncommitted or untracked changes\. Commit or remove them so the working tree/);
  assert.match(res.stderr, new RegExp(r.wt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(res.stderr, new RegExp(`git checkout ${BRANCH}`));
  assert.equal(fs.readFileSync(path.join(r.wt, 'other.txt'), 'utf8'), 'edited there\n', 'the edit is untouched');
  assert.equal(r.sha(BRANCH), r.tip);
});

test('0212 AC4: a ship that isn\'t killed leaves the worktree on the ticket\'s branch, shipped or not', () => {
  const failing = shipRepo({ test: 'false' });
  fs.writeFileSync(path.join(failing.dir, 'other.txt'), 'moved\n');
  failing.g('commit', '-qam', 'main moves on');
  const res = runIn(failing.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.equal(on(failing.wt), BRANCH);
  const ok = shipRepo();
  assert.equal(runIn(ok.dir, 'ship', '1').status, 0);
  assert.equal(ok.g('show', 'main:shared.txt'), 'feature');
});

// ---------- the queue ----------

function queued() {
  const r = shipRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'config');
  const said = [], launches = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, done }) });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  // What a ship killed partway leaves: its record, with a pid that has gone and no end.
  const killed = () => {
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({ pid: 999999, started: new Date().toISOString(), auto: true }));
  };
  const refused = () => fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({ pid: 999999, started: new Date().toISOString(), auto: true, ended: new Date().toISOString(), message: 'Tests failed.' }));
  return { r, said, launches, killed, refused, check: () => q.check(statusData(r.dir).tickets) };
}

test('0212 AC2: a ship killed partway is tried again on the next check, without a new commit, once', () => {
  const k = queued();
  k.check();
  assert.equal(k.launches.length, 1);
  k.killed();
  k.launches[0].done(null);
  k.check();
  assert.equal(k.launches.length, 2, 'tried again on the next check');
  k.killed();
  k.launches[1].done(null);
  for (let i = 0; i < 3; i++) k.check();
  assert.equal(k.launches.length, 2, 'killed again with nothing new: waits for a new commit');
  fs.writeFileSync(path.join(k.r.dir, 'notes.txt'), 'new\n');
  k.r.g('commit', '-qam', 'new');
  k.check();
  assert.equal(k.launches.length, 3, 'a new commit lets it try again');
  k.killed();
  k.launches[2].done(null);
  k.check();
  assert.equal(k.launches.length, 4, 'and a ship killed after that is tried again once more');
});

test('0212 AC2: a ship that ended without shipping still waits for a new commit', () => {
  const k = queued();
  k.check();
  k.refused();
  k.launches[0].done(1);
  for (let i = 0; i < 3; i++) k.check();
  assert.equal(k.launches.length, 1);
});
