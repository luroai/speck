import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseYaml, parseTicket } from '../scripts/speck.mjs';
import { ROOT, CLI, good, gitEnv, approveVerdict, shipRepo, startRepo } from './support/speck.mjs';

function worktreeShipRepo({ addFile = false, autoShip = false, remote = false, test = 'true' } = {}) {
  const r = shipRepo({ approve: false, test });
  const env = { ...process.env, ...gitEnv };
  const gIn = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env });
  const runIn = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
  if (addFile) { fs.writeFileSync(path.join(r.dir, 'new.txt'), 'from the branch\n'); r.g('add', '-A'); r.g('commit', '-qm', 'new file'); }
  if (autoShip) {
    const c = path.join(r.dir, 'speck', 'config.yml');
    fs.writeFileSync(c, fs.readFileSync(c, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
    r.g('add', '-A'); r.g('commit', '-qm', 'auto ship on');
  }
  const v = path.join(os.tmpdir(), `verdict-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  r.run('record', '1', v);
  r.run('set', '1', 'status', 'approved');
  r.g('add', '-A'); r.g('commit', '-qm', 'approved');
  let bare = null;
  if (remote) {
    bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
    gIn(bare, 'init', '-q', '--bare', '-b', 'main');
    r.g('remote', 'add', 'origin', bare);
    r.g('push', '-q', '-u', 'origin', 'main');
    r.g('push', '-q', '-u', 'origin', 'speck/0001-export-bookings');
  }
  r.g('checkout', '-q', 'main');
  if (autoShip) { // in real use, auto_ship is set on main and the branch inherits it
    const c = path.join(r.dir, 'speck', 'config.yml');
    fs.writeFileSync(c, fs.readFileSync(c, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
    r.g('commit', '-qam', 'auto ship on, on main');
  }
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-wt-')), 'wt');
  assert.equal(gIn(r.dir, 'worktree', 'add', '-q', wt, 'speck/0001-export-bookings').status, 0);
  const sha = ref => gIn(r.dir, 'rev-parse', '--verify', '-q', ref).stdout.trim();
  const worktrees = () => gIn(r.dir, 'worktree', 'list', '--porcelain').stdout.split('\n').filter(l => l.startsWith('worktree ')).length;
  const statusIn = cwd => parseTicket(fs.readFileSync(path.join(cwd, 'speck', 'tickets', '0001-export-bookings.md'), 'utf8')).fm.status;
  const snapshot = () => ({ main: sha('main'), branch: sha('speck/0001-export-bookings'), wt: fs.existsSync(wt) && gIn(wt, 'rev-parse', 'HEAD').stdout.trim(),
    dirBranch: gIn(r.dir, 'branch', '--show-current').stdout.trim(), dirStatus: gIn(r.dir, 'status', '--porcelain').stdout, wtStatus: fs.existsSync(wt) && gIn(wt, 'status', '--porcelain').stdout });
  return { ...r, wt, bare, gIn, runIn, sha, worktrees, statusIn, snapshot };
}

test('0027 AC1/AC3: ship from the main checkout merges the worktree branch, pushes, deletes the branch everywhere and removes the worktree', () => {
  const r = worktreeShipRepo({ remote: true });
  const res = r.runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(r.g('log', '-1', '--format=%s', 'main'), /speck\(0001\): Export bookings/);
  assert.equal(r.g('rev-list', '--count', '--min-parents=2', '-1', 'main'), '1', 'a merge commit');
  assert.ok(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md')), 'the main checkout has the merged files');
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'feature\n');
  assert.equal(r.g('branch', '--show-current'), 'main');
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(fs.existsSync(r.wt), false, 'worktree removed');
  assert.equal(r.worktrees(), 1);
  assert.equal(r.sha('speck/0001-export-bookings'), '', 'branch deleted');
  assert.equal(r.gIn(r.bare, 'rev-parse', 'main').stdout.trim(), r.sha('main'), 'pushed');
  assert.equal(r.gIn(r.bare, 'rev-parse', '--verify', '-q', 'speck/0001-export-bookings').stdout.trim(), '', 'remote branch deleted');
});

test('0027 AC1/AC3: ship --auto run from inside the worktree ships, removes it and says where main is', () => {
  const r = worktreeShipRepo({ autoShip: true });
  const res = r.runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(r.g('log', '-1', '--format=%s', 'main'), /speck\(0001\): Export bookings/);
  assert.equal(fs.existsSync(r.wt), false);
  assert.ok(res.stdout.includes(r.wt), 'names the removed folder');
  assert.ok(res.stdout.includes(fs.realpathSync(r.dir)), 'prints where the base branch is checked out');
  assert.match(res.stdout, /removed/i);
});

test('0027 AC2: tracked changes in the base checkout refuse; untracked files only block when the merge would overwrite them', () => {
  const dirty = worktreeShipRepo();
  fs.writeFileSync(path.join(dirty.dir, 'shared.txt'), 'local edit\n');
  let before = dirty.snapshot();
  let res = dirty.runIn(dirty.wt, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /uncommitted/i);
  assert.ok(res.stderr.includes(fs.realpathSync(dirty.dir)), 'names the checkout');
  assert.deepEqual(dirty.snapshot(), before);
  assert.equal(dirty.statusIn(dirty.wt), 'approved');

  const clash = worktreeShipRepo({ addFile: true });
  fs.writeFileSync(path.join(clash.dir, 'new.txt'), 'mine, untracked\n');
  before = clash.snapshot();
  res = clash.runIn(clash.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /new\.txt/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.deepEqual(clash.snapshot(), before);
  assert.equal(fs.readFileSync(path.join(clash.dir, 'new.txt'), 'utf8'), 'mine, untracked\n');
  assert.equal(clash.statusIn(clash.wt), 'approved');

  const harmless = worktreeShipRepo({ addFile: true });
  fs.writeFileSync(path.join(harmless.dir, 'notes.txt'), 'mine\n');
  res = harmless.runIn(harmless.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readFileSync(path.join(harmless.dir, 'notes.txt'), 'utf8'), 'mine\n');
  assert.equal(fs.readFileSync(path.join(harmless.dir, 'new.txt'), 'utf8'), 'from the branch\n');
});

test('0027 AC2: with the base branch checked out nowhere, ship still merges and removes the worktree', () => {
  const r = worktreeShipRepo();
  r.g('checkout', '-q', '-b', 'dashboard');
  const res = r.runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(r.g('log', '-1', '--format=%s', 'main'), /speck\(0001\): Export bookings/);
  assert.equal(r.g('branch', '--show-current'), 'dashboard', 'the folder it ran in keeps its branch');
  assert.equal(fs.existsSync(r.wt), false);
  assert.equal(r.sha('speck/0001-export-bookings'), '');
});

test('0027 AC4: a conflict or a failed check leaves the worktree, both branches and both folders as they were', () => {
  const r = worktreeShipRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
  r.g('commit', '-qam', 'main moves on');
  const before = r.snapshot();
  const res = r.runIn(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /conflict/i);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusIn(r.wt), 'approved');
  assert.equal(r.worktrees(), 2);

  const failing = worktreeShipRepo({ test: 'false' });
  const was = failing.snapshot();
  const f = failing.runIn(failing.dir, 'ship', '1');
  assert.notEqual(f.status, 0);
  assert.match(f.stderr, /Tests failed/);
  assert.deepEqual(failing.snapshot(), was);
  assert.equal(failing.statusIn(failing.wt), 'approved');
});

test('0027 (self-check): a missing worktree folder gets a plain error, and a worktree that cannot be removed still ships and pushes', () => {
  const gone = worktreeShipRepo();
  fs.rmSync(gone.wt, { recursive: true, force: true });
  const before = gone.sha('main');
  let res = gone.runIn(gone.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /git worktree prune/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.equal(gone.sha('main'), before);

  const locked = worktreeShipRepo({ remote: true });
  locked.g('worktree', 'lock', locked.wt);
  res = locked.runIn(locked.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(res.stdout, /Couldn't remove the worktree/);
  assert.ok(res.stdout.includes(`git worktree unlock ${locked.wt}`), 'unlocks first (F2)');
  assert.ok(res.stdout.indexOf(`git worktree unlock ${locked.wt}`) < res.stdout.indexOf(`git worktree remove ${locked.wt}`));
  // The printed steps actually finish the job.
  assert.equal(locked.g('worktree', 'unlock', locked.wt), '');
  locked.g('worktree', 'remove', locked.wt);
  locked.g('branch', '-D', 'speck/0001-export-bookings');
  assert.equal(locked.worktrees(), 1);
  assert.equal(locked.sha('speck/0001-export-bookings'), '');
  assert.equal(locked.gIn(locked.bare, 'rev-parse', 'main').stdout.trim(), locked.sha('main'), 'still pushed');
  assert.match(locked.g('log', '-1', '--format=%s', 'main'), /speck\(0001\): Export bookings/);
});

test('0027 AC1: ship --auto from the main checkout reads the approved ticket from its worktree', () => {
  const r = worktreeShipRepo({ autoShip: true });
  const res = r.runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(fs.existsSync(r.wt), false);
});

test('0027 AC2/AC4 (F1): a remote catch-up blocked by an untracked file leaves everything as it was', () => {
  const r = worktreeShipRepo({ remote: true });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-other-'));
  r.gIn(other, 'clone', '-q', r.bare, '.');
  fs.writeFileSync(path.join(other, 'remote.txt'), 'from the remote\n');
  r.gIn(other, 'add', '-A'); r.gIn(other, 'commit', '-qm', 'remote adds a file'); r.gIn(other, 'push', '-q', 'origin', 'main');
  fs.writeFileSync(path.join(r.dir, 'remote.txt'), 'mine, untracked\n');
  const before = r.snapshot();
  const res = r.runIn(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /remote\.txt/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusIn(r.wt), 'approved');
  assert.equal(fs.readFileSync(path.join(r.dir, 'remote.txt'), 'utf8'), 'mine, untracked\n');
});

// ---------- 0028: build each ticket in its own worktree ----------

// A repo with speck installed and committed, and ticket 0001 ready on main.
test('0028 AC1: speck start makes the ticket branch in its own worktree outside the checkout, sets building there and prints the path', () => {
  const r = startRepo({ config: { worktrees: 'true' } });
  const head = r.g('rev-parse', 'HEAD');
  const res = r.run('start', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  const [, wt] = r.worktrees();
  assert.ok(wt, 'a second worktree exists');
  assert.ok(res.stdout.includes(wt), 'prints its path');
  assert.ok(!wt.startsWith(fs.realpathSync(r.dir) + path.sep), 'outside the main checkout');
  assert.equal(spawnSync('git', ['branch', '--show-current'], { cwd: wt, encoding: 'utf8' }).stdout.trim(), r.branch);
  assert.equal(r.statusIn(wt), 'building');
  assert.equal(spawnSync('git', ['log', '-1', '--format=%s'], { cwd: wt, encoding: 'utf8' }).stdout.trim(), 'speck(0001): start');
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: wt, encoding: 'utf8' }).stdout, '');
  assert.equal(r.g('rev-parse', `${r.branch}~1`), head, 'branched from the local base');
  // The main checkout is untouched.
  assert.equal(r.g('branch', '--show-current'), 'main');
  assert.equal(r.g('rev-parse', 'HEAD'), head);
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(r.statusIn(r.dir), 'ready');
});

test('0028 AC2: worktree_setup runs in the new worktree, and a failing setup removes the worktree and branch', () => {
  const ok = startRepo({ config: { worktrees: 'true', worktree_setup: '"touch setup-ran"' } });
  assert.equal(ok.run('start', '1').status, 0);
  assert.ok(fs.existsSync(path.join(ok.worktrees()[1], 'setup-ran')));
  assert.ok(!fs.existsSync(path.join(ok.dir, 'setup-ran')));

  const bad = startRepo({ config: { worktrees: 'true', worktree_setup: '"echo setup-boom >&2; exit 3"' } });
  const res = bad.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /setup-boom/);
  assert.match(res.stderr, /worktree_setup/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.equal(bad.worktrees().length, 1, 'worktree removed');
  assert.equal(bad.g('rev-parse', '--verify', '-q', bad.branch), '', 'branch removed');
  assert.equal(bad.statusIn(bad.dir), 'ready');
  assert.ok(!fs.existsSync(path.join(path.dirname(fs.realpathSync(bad.dir)), `${path.basename(bad.dir)}.worktrees`, 'speck', '0001-export-bookings')), 'folder gone');
});

test('0028 AC3: speck start refuses, changing nothing, for a ticket that is not ready, already started, edited but uncommitted, or without committed tooling', () => {
  const draft = startRepo({ config: { worktrees: 'true' }, ready: false });
  let res = draft.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /"draft".*ready/);
  assert.equal(draft.worktrees().length, 1);
  assert.equal(draft.g('rev-parse', '--verify', '-q', draft.branch), '');

  const twice = startRepo({ config: { worktrees: 'true' } });
  assert.equal(twice.run('start', '1').status, 0);
  const wt = twice.worktrees()[1];
  res = twice.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.ok((res.stderr + res.stdout).includes(wt), 'prints the existing worktree so the build can resume there');
  assert.equal(twice.worktrees().length, 2);

  const branchOnly = startRepo({ config: { worktrees: 'true' } });
  branchOnly.g('branch', branchOnly.branch);
  res = branchOnly.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.ok(res.stderr.includes(branchOnly.branch));
  assert.equal(branchOnly.worktrees().length, 1);

  const edited = startRepo({ config: { worktrees: 'true' } });
  fs.appendFileSync(edited.file, '\nmore\n');
  res = edited.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit/i);
  assert.equal(edited.worktrees().length, 1);

  const tooling = startRepo({ config: { worktrees: 'true' }, commitTooling: false });
  res = tooling.run('start', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /\.speck\//);
  assert.match(res.stderr, /commit/i);
  assert.equal(tooling.worktrees().length, 1);
  assert.equal(tooling.g('rev-parse', '--verify', '-q', tooling.branch), '');
});

test('0028 AC4: with worktrees off, speck start branches in the current checkout; new projects turn worktrees on', () => {
  const off = startRepo({ config: { worktrees: 'false' } });
  const res = off.run('start', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(off.g('branch', '--show-current'), off.branch);
  assert.equal(off.statusIn(off.dir), 'building');
  assert.equal(off.g('log', '-1', '--format=%s'), 'speck(0001): start');
  assert.equal(off.worktrees().length, 1);
  assert.ok(res.stdout.includes(fs.realpathSync(off.dir)));

  const tpl = parseYaml(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'));
  assert.equal(tpl.worktrees, true);
  assert.equal(tpl.worktree_setup, '');
});

test('0028 AC5: the build skill starts with speck start and works only in the printed worktree, resuming there', () => {
  const md = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const pre = md.split('## 1. Pre-flight')[1].split('\n## ')[0];
  assert.match(pre, /`speck start <id>`/);
  assert.match(pre, /printed/i);
  assert.match(pre, /all of (your|the) (building|work)[^.]*worktree|every command[^.]*worktree/i);
  assert.match(pre, /resum[^.]*existing worktree|existing worktree[^.]*resum/i);
  assert.doesNotMatch(pre, /Create the branch `<branch_prefix><id>-<slug>`/, 'no hand-made branch any more');
});

test('0028 (self-check): a failed start commit is undone in both modes', () => {
  for (const worktrees of ['true', 'false']) {
    const r = startRepo({ config: { worktrees } });
    const head = r.g('rev-parse', 'HEAD');
    // No identity anywhere, so the start commit fails.
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', HOME: os.tmpdir(), GIT_AUTHOR_NAME: '', GIT_AUTHOR_EMAIL: '', GIT_COMMITTER_NAME: '', GIT_COMMITTER_EMAIL: '', EMAIL: '' };
    const res = spawnSync(process.execPath, [CLI, 'start', '1'], { cwd: r.dir, encoding: 'utf8', env });
    assert.notEqual(res.status, 0, worktrees);
    assert.equal(r.g('branch', '--show-current'), 'main', worktrees);
    assert.equal(r.g('rev-parse', 'HEAD'), head, worktrees);
    assert.equal(r.g('status', '--porcelain'), '', worktrees);
    assert.equal(r.g('rev-parse', '--verify', '-q', r.branch), '', worktrees);
    assert.equal(r.worktrees().length, 1, worktrees);
    assert.equal(r.statusIn(r.dir), 'ready', worktrees);
  }
});

test('0028 AC3/AC5 (F1): from inside an in-progress worktree, speck start prints where to resume', () => {
  const r = startRepo({ config: { worktrees: 'true' } });
  assert.equal(r.run('start', '1').status, 0);
  const wt = r.worktrees()[1];
  const env = { ...process.env, ...gitEnv };
  for (const status of ['building', 'reviewing', 'blocked']) {
    if (status !== 'building') {
      spawnSync(process.execPath, [CLI, 'set', '1', 'status', status], { cwd: wt, env });
      spawnSync('git', ['commit', '-qam', status], { cwd: wt, env });
    }
    const res = spawnSync(process.execPath, [CLI, 'start', '1'], { cwd: wt, encoding: 'utf8', env });
    assert.notEqual(res.status, 0, status);
    assert.ok((res.stdout + res.stderr).includes(wt), `${status}: prints the worktree`);
    assert.equal(r.worktrees().length, 2, status);
  }
});

test('0028 AC3 (F2): tooling must be in the base commit, not just staged or on another branch, following symlinks', () => {
  const staged = startRepo({ config: { worktrees: 'true' }, commitTooling: false });
  staged.g('add', '.speck', '.claude', '.agents');
  let res = staged.run('start', '1');
  assert.notEqual(res.status, 0, 'staged only');
  assert.match(res.stderr, /\.speck\//);
  assert.equal(staged.worktrees().length, 1);
  assert.equal(staged.g('rev-parse', '--verify', '-q', staged.branch), '');

  const elsewhere = startRepo({ config: { worktrees: 'true' }, commitTooling: false });
  elsewhere.g('switch', '-q', '-c', 'tooling');
  elsewhere.g('add', '-A'); elsewhere.g('commit', '-qm', 'tooling on a side branch');
  res = elsewhere.run('start', '1');
  assert.notEqual(res.status, 0, 'committed on another branch only');
  assert.equal(elsewhere.worktrees().length, 1);

  // A symlinked .speck/scripts (as in speck's own repo) counts if its target is committed, and not if it dangles.
  const linked = startRepo({ config: { worktrees: 'true' } });
  fs.renameSync(path.join(linked.dir, '.speck', 'scripts'), path.join(linked.dir, 'cli'));
  fs.symlinkSync('../cli', path.join(linked.dir, '.speck', 'scripts'));
  linked.g('add', '-A'); linked.g('commit', '-qm', 'symlinked cli');
  res = linked.run('start', '1');
  assert.equal(res.status, 0, res.stderr);

  const dangling = startRepo({ config: { worktrees: 'true' } });
  fs.rmSync(path.join(dangling.dir, '.speck', 'scripts'), { recursive: true });
  fs.symlinkSync('../missing', path.join(dangling.dir, '.speck', 'scripts'));
  dangling.g('add', '-A'); dangling.g('commit', '-qm', 'dangling cli');
  res = dangling.run('start', '1');
  assert.notEqual(res.status, 0, 'dangling symlink');
  assert.match(res.stderr, /\.speck\//);
  assert.equal(dangling.worktrees().length, 1);
});

// ---------- 0029: show tickets being built in other worktrees ----------

test('0029 AC1/AC2: speck status shows each ticket being built in another worktree once, under its real status, with the path below', () => {
  const r = startRepo({ config: { worktrees: 'true' } });
  // A second ready ticket, so two builds can run in two worktrees.
  const second = path.join(r.dir, r.run('new', 'Import bookings').stdout.trim());
  fs.writeFileSync(second, fs.readFileSync(second, 'utf8').split('## Problem')[0] + good);
  r.run('set', '2', 'status', 'ready');
  r.g('add', '-A'); r.g('commit', '-qm', 'second ticket');
  assert.equal(r.run('start', '1').status, 0);
  assert.equal(r.run('start', '2').status, 0);
  const [, wt1, wt2] = r.worktrees();
  const env = { ...process.env, ...gitEnv };
  const inWt = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
  inWt(wt1, 'set', '1', 'status', 'reviewing'); spawnSync('git', ['commit', '-qam', 'reviewing'], { cwd: wt1, env });
  inWt(wt2, 'set', '2', 'status', 'blocked'); spawnSync('git', ['commit', '-qam', 'blocked'], { cwd: wt2, env });

  const fromMain = r.run('status').stdout;
  const lines = fromMain.split('\n');
  const at = id => lines.findIndex(l => new RegExp(`^  ${id} `).test(l));
  const group = i => lines.slice(0, i).reverse().find(l => /^[A-Z]+ \(/.test(l));
  assert.match(group(at('0001')), /^REVIEWING \(1\)/, fromMain);
  assert.match(group(at('0002')), /^BLOCKED \(1\)/, fromMain);
  assert.ok(lines[at('0001') + 1].includes(wt1), 'path on the line below');
  assert.ok(lines[at('0002') + 1].includes(wt2));
  assert.equal(lines.filter(l => /^  0001 /.test(l)).length, 1, 'shown once');
  assert.doesNotMatch(fromMain, /^READY/m, 'not shown as ready from main');

  // From one build's worktree, the other build still shows with its path; its own ticket shows as it is there.
  const fromWt1 = inWt(wt1, 'status').stdout.split('\n');
  const own = fromWt1.findIndex(l => /^  0001 /.test(l));
  const other = fromWt1.findIndex(l => /^  0002 /.test(l));
  assert.ok(fromWt1[other + 1].includes(wt2));
  assert.ok(!fromWt1[own + 1].includes(wt1), 'no path line for the folder you are in');
  assert.match(fromWt1.slice(0, own).reverse().find(l => /^[A-Z]+ \(/.test(l)), /^REVIEWING/);
});

test('0029 AC1: an approved ticket in a worktree shows as approved', () => {
  const r = startRepo({ config: { worktrees: 'true' } });
  assert.equal(r.run('start', '1').status, 0);
  const wt = r.worktrees()[1];
  const env = { ...process.env, ...gitEnv };
  spawnSync(process.execPath, [CLI, 'set', '1', 'status', 'approved'], { cwd: wt, env });
  spawnSync('git', ['commit', '-qam', 'approved'], { cwd: wt, env });
  const out = r.run('status').stdout;
  assert.match(out, /^APPROVED \(1\)[^\n]*\n  0001 [^\n]*\n[^\n]*/m);
  assert.ok(out.split('\n')[out.split('\n').findIndex(l => /^  0001 /.test(l)) + 1].includes(wt));
});

test('0029 AC3: with no other worktrees, speck status output is unchanged', () => {
  const r = startRepo({ config: { worktrees: 'false' } });
  // 0285: after the Foreman's status, with speck run off
  assert.equal(r.run('status').stdout, 'SPECK: Off\n  0001 ready, not building: speck run is off\n\nREADY (1)\n  0001  P3  S/low  Export bookings\n\nIDEAS (0: 0 waiting, 0 in the inbox, 0 ticketed) in speck/ideas/\n');
  assert.equal(r.run('start', '1').status, 0); // a branch in this checkout, no other worktree
  assert.equal(r.run('status').stdout, 'SPECK: Off\n\nBUILDING (1)\n  0001  P3  S/low  Export bookings\n\nIDEAS (0: 0 waiting, 0 in the inbox, 0 ticketed) in speck/ideas/\n');
});

test('0029 AC4: the status skill says to resume an in-progress ticket in its worktree and name the path', () => {
  const md = fs.readFileSync(path.join(ROOT, 'skills', 'speck-status', 'SKILL.md'), 'utf8');
  assert.match(md, /worktree/i);
  assert.match(md, /resume[^.]*in (that|its) worktree|in (that|its) worktree[^.]*resume/i);
  assert.match(md, /name the path|naming the path|give the path/i);
});

// ---------- 0021: close an approved build with one command ----------

// A built ticket with two review rounds recorded (changes requested, then approved) and the tree otherwise clean.
function parallelRepo({ sameLines = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-par-'));
  const env = { ...process.env, ...gitEnv };
  const runIn = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
  const gIn = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env }).stdout.trim();
  const run = (...a) => runIn(dir, ...a);
  const g = (...a) => gIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"');
  c = /^worktrees:/m.test(c) ? c.replace(/^worktrees:.*$/m, 'worktrees: true') : c + 'worktrees: true\n';
  fs.writeFileSync(cfgFile, c);
  const tickets = ['Export bookings', 'Import bookings'].map((title, i) => {
    const file = path.join(dir, run('new', title).stdout.trim());
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
    assert.equal(run('set', String(i + 1), 'status', 'ready').status, 0);
    return { id: String(i + 1), name: path.basename(file), branch: `speck/${path.basename(file, '.md')}` };
  });
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'line one\nline two\nline three\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  // Start both before building either, as two parallel sessions would.
  for (const t of tickets) {
    const res = run('start', t.id);
    assert.equal(res.status, 0, res.stderr + res.stdout);
    t.wt = res.stdout.trim().split('\n').pop().trim();
    assert.ok(fs.existsSync(t.wt), `worktree for ${t.id} exists`);
  }
  const v = path.join(os.tmpdir(), `verdict-${path.basename(dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  for (const [i, t] of tickets.entries()) {
    if (sameLines) fs.writeFileSync(path.join(t.wt, 'shared.txt'), `line one\nline two from ticket ${t.id}\nline three\n`);
    else fs.writeFileSync(path.join(t.wt, `ticket-${i + 1}.txt`), `from ticket ${t.id}\n`);
    gIn(t.wt, 'add', '-A'); gIn(t.wt, 'commit', '-qm', `work ${t.id}`);
    assert.equal(runIn(t.wt, 'record', t.id, v).status, 0);
    assert.equal(runIn(t.wt, 'set', t.id, 'status', 'approved').status, 0);
    gIn(t.wt, 'add', '-A'); gIn(t.wt, 'commit', '-qm', `approved ${t.id}`);
  }
  const sha = ref => g('rev-parse', '--verify', '-q', ref);
  const statusAt = (cwd, t) => {
    const p = ['speck/tickets', 'speck/tickets/done'].map(d => path.join(cwd, d, t.name)).find(f => fs.existsSync(f));
    return p && parseTicket(fs.readFileSync(p, 'utf8')).fm.status;
  };
  const worktrees = () => g('worktree', 'list', '--porcelain').split('\n').filter(l => l.startsWith('worktree ')).length;
  return { dir, run, g, gIn, tickets, sha, statusAt, worktrees };
}

test('0032 AC1: two tickets built side by side in their own worktrees both ship, one after the other', () => {
  const r = parallelRepo();
  const [a, b] = r.tickets;
  assert.equal(r.worktrees(), 3, 'both builds have their own worktree');
  assert.equal(r.statusAt(a.wt, a), 'approved');
  assert.equal(r.statusAt(b.wt, b), 'approved');
  for (const t of [a, b]) {
    const res = r.run('ship', t.id);
    assert.equal(res.status, 0, res.stderr + res.stdout);
  }
  for (const t of [a, b]) {
    assert.equal(r.statusAt(r.dir, t), 'done', `${t.id} is done on main`);
    assert.ok(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', t.name)), `${t.id} filed under done/`);
    assert.equal(r.sha(t.branch), '', `${t.id} branch deleted`);
    assert.equal(fs.existsSync(t.wt), false, `${t.id} worktree removed`);
    assert.equal(r.g('merge-base', '--is-ancestor', `main^{/approved ${t.id}}`, 'main'), '', `${t.id} work merged into main`);
  }
  assert.equal(fs.readFileSync(path.join(r.dir, 'ticket-1.txt'), 'utf8'), 'from ticket 1\n');
  assert.equal(fs.readFileSync(path.join(r.dir, 'ticket-2.txt'), 'utf8'), 'from ticket 2\n');
  assert.equal(r.worktrees(), 1);
  assert.equal(r.g('branch', '--show-current'), 'main');
  assert.equal(r.g('status', '--porcelain'), '');
});

test('0032 AC2: when two parallel tickets change the same lines, the second ship is refused and changes nothing', () => {
  const r = parallelRepo({ sameLines: true });
  const [a, b] = r.tickets;
  const first = r.run('ship', a.id);
  assert.equal(first.status, 0, first.stderr + first.stdout);
  assert.equal(r.statusAt(r.dir, a), 'done');
  const snapshot = () => ({
    main: r.sha('main'), branch: r.sha(b.branch), wtHead: r.gIn(b.wt, 'rev-parse', 'HEAD'),
    wtStatus: r.gIn(b.wt, 'status', '--porcelain'), wtBranch: r.gIn(b.wt, 'branch', '--show-current'),
    dirStatus: r.g('status', '--porcelain'), dirBranch: r.g('branch', '--show-current'),
    shared: fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), worktrees: r.worktrees(),
  });
  const before = snapshot();
  const second = r.run('ship', b.id);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, new RegExp(`Merging ${b.branch.replace(/[/.]/g, '\\$&')} into main hit a conflict, so nothing was shipped`));
  assert.deepEqual(snapshot(), before);
  assert.equal(r.statusAt(b.wt, b), 'approved');
  assert.ok(fs.existsSync(b.wt), 'worktree kept');
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'line one\nline two from ticket 1\nline three\n');
});

// ---------- 0025: keep other sessions' files out of a build ----------
