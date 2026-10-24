// 0296: shipping in pull request mode merges the ticket's pull request on GitHub with gh, then tidies up as a local
// ship does, whether you ship it, speck run's queue ships it, or you merged it on GitHub yourself.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { openAndKeep } from '../scripts/pull-request.mjs';
import { whyNotMergeable, prLook } from '../scripts/pr-ship.mjs';
import { prQueue } from '../scripts/pr-queue.mjs';
import { gIn, BRANCH } from './support/ship.mjs';
import { prRepo, runs } from './support/pr.mjs';
import { gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv); // the commits speck makes when the tests call it directly

const DONE = 'speck/tickets/done/0001-export-bookings.md';
const URL1 = 'https://github.com/o/r/pull/1';

// A pull request mode repo whose approved ticket has its pull request open.
function opened(opts) {
  const r = prRepo(opts);
  openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  return r;
}
const merges = r => r.gh.calls().filter(c => c.args[0] === 'pr' && c.args[1] === 'merge');

// Shipped and tidied up: main has the merge from GitHub and the ticket done, pushed, and the branch and worktree are gone.
function assertTidied(r) {
  assert.ok(fs.existsSync(path.join(r.dir, DONE)), 'the ticket is filed as done');
  assert.match(fs.readFileSync(path.join(r.dir, DONE), 'utf8'), /^status: done/m);
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'feature\n', 'main has the ticket\'s change');
  assert.equal(r.g('branch', '--show-current'), 'main');
  assert.equal(r.sha(BRANCH), '', 'the local branch is deleted');
  assert.equal(r.remoteHas(BRANCH), '', 'the remote branch is deleted');
  assert.ok(!fs.existsSync(r.wt), 'the worktree is removed');
  // 0315: main isn't pushed: GitHub's main has the done ticket from the pull request, and the local one has caught up with it.
  assert.ok(gIn(r.dir, 'merge-base', '--is-ancestor', r.remoteHas('main'), 'main').status === 0, 'main has the remote\'s main');
  assert.match(gIn(r.bare, 'show', `main:${DONE}`).stdout, /^status: done/m, 'the merge on GitHub filed the ticket as done');
  assert.equal(r.g('status', '--porcelain'), '');
}

// ---------- AC1: merging the pull request ----------

test('0296 AC1: speck ship merges the pull request with gh once its checks pass, then tidies up as a local ship does', () => {
  const r = opened();
  r.gh.edit(URL1, { statusCheckRollup: [{ name: 'test', status: 'COMPLETED', conclusion: 'SUCCESS' }] });
  const head = r.remoteHas(BRANCH); // 0315: the branch with the commit filing the ticket as done on top
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  const [merge] = merges(r);
  assert.deepEqual(merge.args, ['pr', 'merge', '1', '--merge', '--match-head-commit', head]);
  assert.equal(r.gh.prs()[0].state, 'MERGED');
  assert.ok(gIn(r.dir, 'merge-base', '--is-ancestor', head, 'main').status === 0, 'main has the merged branch');
  assertTidied(r);
  assert.match(shipped.stdout, /Merged 0001's pull request on GitHub: https:\/\/github\.com\/o\/r\/pull\/1\./);
  assert.match(shipped.stdout, /^Shipped 0001: /m);
});

test('0296 AC1: the local base branch is brought up to date even when it has commits the remote doesn\'t', () => {
  const r = opened();
  fs.writeFileSync(path.join(r.dir, 'notes.txt'), 'local\n');
  r.g('commit', '-qam', 'local only');
  const local = r.sha('main');
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.ok(gIn(r.dir, 'merge-base', '--is-ancestor', local, 'main').status === 0, 'the local commit is kept');
  assertTidied(r);
});

test('0296 AC1: it ships a ticket whose branch isn\'t checked out anywhere', () => {
  const r = opened();
  r.g('worktree', 'remove', r.wt);
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assertTidied(r);
});

test('0296 AC1: the whole suite runs on the ticket as it would land before the merge, and a failure merges nothing', () => {
  const r = opened({ test: 'grep -q base shared.txt' }); // passes on main alone, fails with the ticket's change
  const before = r.snapshot(), remoteMain = r.remoteHas('main');
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.notEqual(shipped.status, 0);
  assert.match(shipped.stderr, /Tests failed on the approved branch, so nothing was shipped\./);
  assert.deepEqual(merges(r), [], 'gh never asked to merge');
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.remoteHas('main'), remoteMain);
  assert.equal(r.gh.prs()[0].state, 'OPEN');
});

test('0296 AC1: when gh only queues the merge, nothing is tidied up until GitHub has merged it', () => {
  const r = opened();
  r.gh.set('merge', 'queue');
  const before = r.snapshot();
  const queued = r.cli(r.dir, 'ship', '1');
  assert.notEqual(queued.status, 0);
  assert.match(queued.stderr.trim(), /^gh accepted 0001's pull request, https:\/\/github\.com\/o\/r\/pull\/1, but GitHub hasn't merged it yet, as with a merge queue, so nothing was tidied up\./);
  assert.equal(merges(r).length, 1);
  assert.deepEqual(r.snapshot(), before, 'nothing tidied up');
  assert.ok(fs.existsSync(r.wt));
  r.gh.set('merge', 'ok');
  assert.equal(spawnSync(r.gh.gh, ['pr', 'merge', '1', '--merge'], { encoding: 'utf8' }).status, 0); // the queue merges it
  const tidied = r.cli(r.dir, 'ship', '1');
  assert.equal(tidied.status, 0, tidied.stderr);
  assertTidied(r);
});

// ---------- AC2: already merged on GitHub ----------

test('0296 AC2: when the pull request was already merged on GitHub, speck ship only tidies up', () => {
  const r = opened();
  assert.equal(spawnSync(r.gh.gh, ['pr', 'merge', '1', '--merge'], { encoding: 'utf8' }).status, 0);
  r.g('push', '-q', 'origin', '--delete', BRANCH); // GitHub deleting the head branch after the merge
  const before = r.gh.calls().length;
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.deepEqual(r.gh.calls().slice(before).filter(c => c.args[1] === 'merge'), [], 'nothing merged again');
  assert.match(shipped.stdout, /already merged on GitHub, so speck is only tidying up/);
  assertTidied(r);
});

test('0296 AC2: a pull request merged without the branch\'s latest commits is left alone', () => {
  const r = opened();
  assert.equal(spawnSync(r.gh.gh, ['pr', 'merge', '1', '--merge'], { encoding: 'utf8' }).status, 0);
  fs.writeFileSync(path.join(r.wt, 'speck', 'note.md'), 'later\n');
  gIn(r.wt, 'add', '.'); gIn(r.wt, 'commit', '-qm', 'later');
  const before = r.snapshot();
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.notEqual(shipped.status, 0);
  assert.match(shipped.stderr, /was merged without speck\/0001-export-bookings's latest commits.*Nothing was changed\.$/m);
  assert.deepEqual(r.snapshot(), before);
});

// ---------- AC3: can't be merged ----------

function refused(r, said) {
  const before = r.snapshot(), remoteMain = r.remoteHas('main');
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.notEqual(shipped.status, 0);
  const line = shipped.stderr.trim();
  assert.match(line, said);
  assert.ok(!line.includes('\n'), `one line: ${line}`);
  assert.deepEqual(r.snapshot(), before, 'nothing changed locally');
  assert.equal(r.remoteHas('main'), remoteMain, 'nothing merged');
  assert.equal(r.statusIn(r.wt), 'approved');
}

test('0296 AC3: failing checks, a conflict or a review GitHub requires: nothing changes, and speck says why in one line', () => {
  const cases = [
    [{ statusCheckRollup: [{ name: 'test', status: 'COMPLETED', conclusion: 'FAILURE' }] }, /can't be merged yet: its checks are failing \(test\)\. Nothing was changed\./],
    [{ statusCheckRollup: [{ context: 'ci/build', state: 'PENDING' }] }, /can't be merged yet: its checks haven't finished \(ci\/build\)/],
    [{ mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' }, /conflicts with origin\/main on GitHub, so it wasn't merged\./], // 0323: refused as a conflict
    [{ reviewDecision: 'REVIEW_REQUIRED', mergeStateStatus: 'BLOCKED' }, /can't be merged yet: GitHub requires an approving review first/],
  ];
  for (const [change, said] of cases) {
    const r = opened();
    r.gh.edit(URL1, change);
    refused(r, said);
    assert.deepEqual(merges(r), [], 'gh never asked to merge');
  }
});

test('0296 AC3: when GitHub refuses the merge, nothing changes locally', () => {
  const r = opened();
  r.gh.set('merge', 'no');
  refused(r, /^GitHub didn't merge 0001's pull request, https:\/\/github\.com\/o\/r\/pull\/1: GraphQL: Pull request is not mergeable.*Nothing was changed\.$/);
});

test('0296 AC3: a pull request that differs from the reviewed branch isn\'t merged', () => {
  const r = opened();
  fs.writeFileSync(path.join(r.wt, 'speck', 'note.md'), 'unpushed\n');
  gIn(r.wt, 'add', '.'); gIn(r.wt, 'commit', '-qm', 'unpushed');
  refused(r, /has commits its pull request doesn't, so it wasn't merged\. Run `speck pr 0001`/);
  assert.deepEqual(merges(r), []);
});

test('0296 AC3: a pull request whose head commit gh doesn\'t give isn\'t merged', () => {
  const r = opened();
  r.gh.edit(URL1, { headRefOid: '' });
  refused(r, /gh didn't say which commit 0001's pull request, .* is at/);
  assert.deepEqual(merges(r), []);
});

test('0296 AC3: whyNotMergeable reads checks, drafts, conflicts and reviews', () => {
  assert.equal(whyNotMergeable({ mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', statusCheckRollup: [{ name: 'a', status: 'COMPLETED', conclusion: 'SKIPPED' }] }), '');
  assert.equal(whyNotMergeable({}), '');
  assert.match(whyNotMergeable({ statusCheckRollup: [{ name: 'a', status: 'IN_PROGRESS', conclusion: '' }] }), /haven't finished \(a\)/);
  assert.match(whyNotMergeable({ isDraft: true }), /draft/);
  assert.match(whyNotMergeable({ reviewDecision: 'CHANGES_REQUESTED' }), /asked for changes/);
  assert.match(whyNotMergeable({ mergeable: 'UNKNOWN' }), /still working out/);
  assert.match(whyNotMergeable({ mergeStateStatus: 'BLOCKED' }), /rules on GitHub block it/);
  assert.equal(whyNotMergeable({ statusCheckRollup: [null, 'x', { status: 'COMPLETED', conclusion: 'SUCCESS' }] }), '');
});

// The queue with its look and ship stood in for: `views` gives each ticket's pull request as gh would, by id.
function queue(r, views, { ships = [], said = [], code = 0, at = { t: 0 } } = {}) {
  const q = prQueue(r.dir, r.cfg, {
    say: l => said.push(l), lookMs: 1000, now: () => at.t,
    look: id => views[id] ?? null,
    ship: (repo, id, log, done) => { ships.push(id); fs.writeFileSync(log, code ? 'GitHub said no.\n0001\'s pull request can\'t be merged yet: its checks are failing (test). Nothing was changed.\n' : 'Shipped 0001.\n'); done(code); },
    launch: () => assert.fail('no pull request to open'),
  });
  return { q, ships, said, at };
}
const approved = (extra = {}) => [{ id: '0001', status: 'approved', build_running: false, auto_ship: true, pull_request: { url: URL1, error: null }, ...extra }];

test('0296 AC3: speck run tries a pull request it couldn\'t merge again only once the pull request changes', () => {
  const r = opened();
  const views = { '0001': { state: 'OPEN', key: 'failing' } };
  const { q, ships, said, at } = queue(r, views, { code: 1 });
  q.check(approved());
  assert.deepEqual(ships, ['0001']);
  const line = said.find(l => /didn't ship/.test(l));
  assert.equal(line, '0001 didn\'t ship: 0001\'s pull request can\'t be merged yet: its checks are failing (test). Nothing was changed. speck run tries again once its pull request, main or its branch changes.');
  at.t += 5000;
  q.check(approved());
  assert.deepEqual(ships, ['0001'], 'not tried again with nothing changed');
  views['0001'] = { state: 'OPEN', key: 'passing' };
  q.check(approved());
  assert.deepEqual(ships, ['0001'], 'not looked at again within lookMs');
  at.t += 5000;
  q.check(approved());
  assert.deepEqual(ships, ['0001', '0001'], 'tried again once it changed');
});

// ---------- AC4: speck run ----------

test('0296 AC4: speck run ships a pull request mode ticket auto_ship covers, and tidies up after one merged on GitHub', () => {
  const r = opened();
  const covered = queue(r, { '0001': { state: 'OPEN', key: 'k' } });
  covered.q.check(approved());
  assert.deepEqual(covered.ships, ['0001']);
  assert.ok(covered.said.includes('Shipped 0001.'), covered.said.join('\n'));
  assert.match(covered.said[0], /^Merging 0001's pull request: speck ship 0001 --auto\. Log: /);

  const notCovered = queue(r, { '0001': { state: 'OPEN', key: 'k' } });
  notCovered.q.check(approved({ auto_ship: false }));
  assert.deepEqual(notCovered.ships, [], 'one auto_ship doesn\'t cover waits for you');

  const merged = queue(r, { '0001': { state: 'MERGED', key: 'm' } });
  merged.q.check(approved({ auto_ship: false }));
  assert.deepEqual(merged.ships, ['0001'], 'merged on GitHub: tidied up whatever auto_ship says');
  assert.match(merged.said[0], /^0001's pull request was merged on GitHub, so speck run is tidying up after it/);

  const none = queue(r, {});
  none.q.check(approved());
  none.q.check([{ id: '0002', status: 'reviewing', auto_ship: true, pull_request: { url: URL1, error: null } }]);
  assert.deepEqual(none.ships, [], 'gh giving no answer, or a ticket not approved: nothing shipped');
});

test('0296 AC4: speck ship --auto merges only what auto_ship covers, but always tidies up after a merge on GitHub', () => {
  const off = opened();
  const refusedAuto = off.cli(off.dir, 'ship', '1', '--auto');
  assert.equal(refusedAuto.status, 12, refusedAuto.stderr);
  assert.match(refusedAuto.stderr, /Not merging automatically: auto_ship is off/);
  assert.deepEqual(merges(off), []);
  assert.equal(spawnSync(off.gh.gh, ['pr', 'merge', '1', '--merge'], { encoding: 'utf8' }).status, 0);
  const tidied = off.cli(off.dir, 'ship', '1', '--auto');
  assert.equal(tidied.status, 0, tidied.stderr);
  assertTidied(off);

  const on = opened({ config: ['auto_ship: true'] });
  const shipped = on.cli(on.dir, 'ship', '1', '--auto');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.equal(merges(on).length, 1);
  assertTidied(on);
});

test('0296 AC4: prLook gives the pull request\'s state, and a key that changes when it does', () => {
  const r = opened();
  const first = prLook(r.dir, r.cfg, '1', r.gh.gh);
  assert.equal(first.state, 'OPEN');
  assert.deepEqual(prLook(r.dir, r.cfg, '1', r.gh.gh), first);
  r.gh.edit(URL1, { statusCheckRollup: [{ name: 'test', status: 'COMPLETED', conclusion: 'SUCCESS' }] });
  assert.notEqual(prLook(r.dir, r.cfg, '1', r.gh.gh).key, first.key);
  r.gh.set('view', 'no');
  assert.equal(prLook(r.dir, r.cfg, '1', r.gh.gh), null, 'gh failing is no answer');
});

// ---------- AC5: local mode ----------

test('0296 AC5: with ship_mode local, speck ship merges locally as before and never runs gh', () => {
  const r = prRepo({ mode: 'local' });
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.match(shipped.stdout, /^Shipped 0001: merged speck\/0001-export-bookings into main and deleted the local branch\./m);
  assert.deepEqual(r.gh.calls(), []);
  assert.ok(fs.existsSync(path.join(r.dir, DONE)));
  assert.equal(r.remoteHas('main'), r.sha('main'));
});

// ---------- the docs ----------

// 0491: the README is checked by review.
test('0296 AC1: the brief names what pull request mode ships with', () => {
  const read = f => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const brief = read('docs/brief.md');
  assert.match(brief, /`gh pr merge --merge`/);
  assert.match(brief, /`speck\(<id>\): ship`/);
  assert.match(fs.readFileSync(new URL('../scripts/pr-ship.mjs', import.meta.url), 'utf8'), /\['pr', 'merge', String\(v\.number\), '--merge'/);
  assert.doesNotMatch(brief, /pull requests as the way to ship/);
  assert.doesNotMatch(brief, /In this mode `speck ship` merges nothing/);
});
