// 0315: in pull request mode the ticket is filed as done by its pull request, so nothing is pushed straight to the
// base branch, which may be protected so that it only takes pull requests.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { openAndKeep } from '../scripts/pull-request.mjs';
import { doneTip } from '../scripts/pr-done.mjs';
import { shipState } from '../scripts/ship.mjs';
import { gIn, BRANCH } from './support/ship.mjs';
import { prRepo, TICKET, runs } from './support/pr.mjs';
import { gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv); // the commits speck makes when the tests call it directly

const DONE = 'speck/tickets/done/0001-export-bookings.md';

function opened(opts) {
  const r = prRepo(opts);
  openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  return r;
}
const merges = r => r.gh.calls().filter(c => c.args[0] === 'pr' && c.args[1] === 'merge');
const show = (cwd, spec) => gIn(cwd, 'show', spec);
// Refuses every push to the remote's main, as a branch protected to take only pull requests does, logging each try.
function protect(r) {
  const hook = path.join(r.bare, 'hooks', 'pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\nwhile read o n ref; do [ "$ref" = refs/heads/main ] && { echo "$ref" >> "$GIT_DIR/refused"; echo "protected branch hook declined" >&2; exit 1; }; done\nexit 0\n', { mode: 0o755 });
  return () => fs.existsSync(path.join(r.bare, 'refused')) ? fs.readFileSync(path.join(r.bare, 'refused'), 'utf8') : '';
}
const mergeByHand = r => assert.equal(spawnSync(r.gh.gh, ['pr', 'merge', '1', '--merge'], { encoding: 'utf8' }).status, 0);

// ---------- AC1 ----------

test('0315 AC1: the pull request\'s branch has the ticket filed as done on top of the reviewed branch, which stays approved', () => {
  const r = opened();
  const head = r.remoteHas(BRANCH), local = r.sha(BRANCH);
  assert.notEqual(head, local);
  assert.equal(r.remoteHas(`${BRANCH}^1`), local, 'one commit on top of the local branch');
  assert.equal(gIn(r.bare, 'log', '-1', '--format=%s', BRANCH).stdout.trim(), 'speck(0001): ship');
  assert.deepEqual(gIn(r.bare, 'diff', '--name-only', '--no-renames', `${BRANCH}^1`, BRANCH).stdout.trim().split('\n').sort(), [TICKET, DONE].sort(), 'only the ticket moves');
  const done = show(r.bare, `${BRANCH}:${DONE}`).stdout;
  assert.match(done, /^status: done/m);
  assert.match(done, /^pull_request: "?https:\/\/github\.com\/o\/r\/pull\/1/m, 'with the link written on it');
  assert.equal(r.statusIn(r.wt), 'approved', 'the local branch keeps the ticket approved');
  assert.equal(doneTip(r.dir, '0001', BRANCH), head, 'the same tip gives the same commit');
});

test('0315 AC1: a new commit on the branch replaces the done commit on GitHub, but someone else\'s commit there is never overwritten', () => {
  const r = opened();
  const old = r.remoteHas(BRANCH);
  fs.writeFileSync(path.join(r.wt, 'speck', 'note.md'), 'later\n');
  gIn(r.wt, 'add', '.'); gIn(r.wt, 'commit', '-qm', 'later');
  const again = r.cli(r.dir, 'pr', '1');
  assert.equal(again.status, 0, again.stderr);
  assert.notEqual(r.remoteHas(BRANCH), old);
  assert.equal(r.remoteHas(`${BRANCH}^1`), r.sha(BRANCH));

  // Someone pushes to the pull request's branch on GitHub: speck pr refuses rather than losing it.
  const other = fs.mkdtempSync(path.join(path.dirname(r.bare), 'speck-other-'));
  assert.equal(gIn(path.dirname(other), 'clone', '-q', '-b', BRANCH, r.bare, other).status, 0);
  fs.writeFileSync(path.join(other, 'theirs.txt'), 'theirs\n');
  gIn(other, 'add', '.'); gIn(other, 'commit', '-qm', 'theirs'); gIn(other, 'push', '-q', 'origin', BRANCH);
  const theirs = r.remoteHas(BRANCH);
  fs.writeFileSync(path.join(r.wt, 'speck', 'note.md'), 'later still\n');
  gIn(r.wt, 'commit', '-qam', 'later still');
  const refused = r.cli(r.dir, 'pr', '1');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Couldn't push speck\/0001-export-bookings to origin/);
  assert.equal(r.remoteHas(BRANCH), theirs, 'their commit is kept');
});

// ---------- AC2 ----------

test('0315 AC2: shipping merges the pull request and catches main up from GitHub, with no push to main, protected or not', () => {
  const r = opened();
  const refused = protect(r);
  const head = r.remoteHas(BRANCH);
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.equal(refused(), '', 'speck never tried to push main');
  assert.deepEqual(merges(r)[0].args, ['pr', 'merge', '1', '--merge', '--match-head-commit', head]);
  assert.equal(r.sha('main'), r.remoteHas('main'), 'the local main is GitHub\'s');
  assert.match(fs.readFileSync(path.join(r.dir, DONE), 'utf8'), /^status: done/m);
  assert.ok(!fs.existsSync(path.join(r.dir, TICKET)));
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(shipState(runs(r.dir), '1')?.unpushed, undefined, 'nothing left unpushed');
  assert.doesNotMatch(shipped.stdout, /Pushed main/);
});

test('0315 AC2: a pull request opened without the done commit gets it pushed to its branch first, then merges on the next ship', () => {
  const r = opened();
  const refused = protect(r);
  r.g('push', '-q', '-f', 'origin', `${BRANCH}:${BRANCH}`); // as speck pushed it before 0315: the branch alone
  const first = r.cli(r.dir, 'ship', '1');
  assert.notEqual(first.status, 0);
  assert.match(first.stderr.trim(), /^0001's pull request didn't file the ticket as done, so speck pushed the commit that does to speck\/0001-export-bookings and didn't merge it yet\./);
  assert.deepEqual(merges(r), []);
  assert.equal(r.remoteHas(`${BRANCH}^1`), r.sha(BRANCH));
  const second = r.cli(r.dir, 'ship', '1');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(refused(), '');
  assert.match(show(r.bare, `main:${DONE}`).stdout, /^status: done/m);
});

test('0315 AC2: a merged pull request that didn\'t file the ticket leaves it done on this computer only, and says so', () => {
  const r = opened();
  const refused = protect(r);
  r.g('push', '-q', '-f', 'origin', `${BRANCH}:${BRANCH}`);
  mergeByHand(r);
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.notEqual(shipped.status, 0);
  assert.match(shipped.stderr.trim(), /^0001's pull request is merged, but it didn't file the ticket as done.*speck pushes nothing straight to main in pull request mode/);
  assert.ok(!shipped.stderr.trim().includes('\n'), 'one line');
  assert.equal(refused(), '');
  assert.ok(fs.existsSync(path.join(r.dir, DONE)));
  assert.equal(r.sha(BRANCH), '', 'tidied up all the same');
  assert.equal(shipState(runs(r.dir), '1')?.unpushed, true);
});

// ---------- AC3 ----------

test('0315 AC3: a pull request merged on GitHub by hand files its ticket as done on GitHub\'s main, and tidying up pushes nothing', () => {
  const r = opened();
  const refused = protect(r);
  mergeByHand(r);
  assert.match(show(r.bare, `main:${DONE}`).stdout, /^status: done/m, 'done on GitHub before speck runs at all');
  assert.notEqual(show(r.bare, `main:${TICKET}`).status, 0);
  const tidied = r.cli(r.dir, 'ship', '1');
  assert.equal(tidied.status, 0, tidied.stderr);
  assert.equal(refused(), '');
  assert.equal(r.sha('main'), r.remoteHas('main'));
  assert.match(fs.readFileSync(path.join(r.dir, DONE), 'utf8'), /^status: done/m);
});

// ---------- AC4 ----------

test('0315 AC4: with ship_mode local, shipping files the ticket on the branch, merges it and pushes main as before', () => {
  const r = prRepo({ mode: 'local' });
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.deepEqual(r.gh.calls(), []);
  assert.match(shipped.stdout, /^Pushed main to origin\./m);
  assert.equal(r.remoteHas('main'), r.sha('main'));
  assert.equal(r.remoteHas(BRANCH), '', 'no ticket branch pushed');
  assert.match(show(r.bare, `main:${DONE}`).stdout, /^status: done/m);
});

