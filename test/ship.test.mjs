import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseYaml, setField } from '../scripts/speck.mjs';
import { ROOT, CLI, gitEnv, approveVerdict, shipRepo, doneRepo } from './support/speck.mjs';

test('AC1: approved is a valid status, listed first by speck status as waiting for the user', () => {
  const r = shipRepo();
  assert.equal(r.status(), 'approved');
  assert.equal(r.run('new', 'Another').status, 0);
  const out = r.run('status').stdout;
  assert.match(out, /APPROVED \(1\)/);
  assert.ok(out.indexOf('APPROVED') < out.indexOf('DRAFT'), out);
  assert.match(out, /\/speck-ship/);
});

test('AC1: the build ends at approved, with no PR and no GitHub CLI', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const approvedStep = build.split('## 5. Approved')[1].split('\n## ')[0];
  assert.match(approvedStep, /`## Review log`/);
  assert.match(approvedStep, /`## Delivery log`/);
  assert.match(approvedStep, /speck close <id>/);
  assert.match(approvedStep, /commits only the ticket \(`speck\(<id>\): approved`\)/);
  assert.ok(approvedStep.indexOf('Review log') < approvedStep.indexOf('speck ship'), 'logs are filled in before shipping');
  for (const n of ['speck-build', 'speck-review', 'speck-ship'])
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /\bgh\s|pull request|gh pr/i, n);
});

test('AC2: speck ship refuses, changing nothing, unless every check passes', () => {
  const cases = [
    ['not approved', r => { r.run('set', '1', 'status', 'reviewing'); r.g('commit', '-qam', 'x'); }, /approved/],
    ['dirty tree', r => fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'dirty\n'), /uncommitted|clean/i],
    ['code changed after review', r => { fs.writeFileSync(path.join(r.dir, 'later.js'), '1\n'); r.g('add', '-A'); r.g('commit', '-qm', 'late'); }, /later\.js/],
  ];
  for (const [name, breakIt, why] of cases) {
    const r = shipRepo();
    breakIt(r);
    const before = r.state();
    const res = r.run('ship', '1');
    assert.notEqual(res.status, 0, name);
    assert.match(res.stderr, why, name);
    assert.deepEqual(r.state(), before, name);
  }
  // No approving review round, so speck next doesn't say ship.
  const none = shipRepo({ approve: false });
  none.run('set', '1', 'status', 'approved'); none.g('commit', '-qam', 'x');
  const b = none.state();
  assert.match(none.run('ship', '1').stderr, /review/i);
  assert.deepEqual(none.state(), b);
  // A code change after the review that was later reverted still counts (F1).
  const reverted = shipRepo();
  fs.writeFileSync(path.join(reverted.dir, 'sneaky.js'), '1\n'); reverted.g('add', '-A'); reverted.g('commit', '-qm', 'add');
  reverted.g('rm', '-q', 'sneaky.js'); reverted.g('commit', '-qm', 'revert');
  const rb = reverted.state();
  const rr = reverted.run('ship', '1');
  assert.notEqual(rr.status, 0);
  assert.match(rr.stderr, /sneaky\.js/);
  assert.deepEqual(reverted.state(), rb);
  // No test command set (F2).
  const noTests = shipRepo({ test: '' });
  const nb = noTests.state();
  const nr = noTests.run('ship', '1');
  assert.notEqual(nr.status, 0);
  assert.match(nr.stderr, /commands\.test/);
  assert.deepEqual(noTests.state(), nb);
  assert.equal(noTests.status(), 'approved');
  assert.equal(noTests.g('status', '--porcelain'), '');
  // Failing tests.
  const failing = shipRepo({ test: 'exit 3' });
  const f = failing.state();
  const res = failing.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /test/i);
  assert.deepEqual(failing.state(), f);
  assert.equal(failing.status(), 'approved');
});

test('AC2: changes under speck/ after the review do not block shipping', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'note.md'), 'note\n');
  r.g('add', 'speck/ideas/note.md'); r.g('commit', '-qm', 'speck only');
  assert.equal(r.run('ship', '1').status, 0);
});

test('AC3: speck ship marks the ticket done, merges with a merge commit, deletes the branch and leaves you on main', () => {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  const s = r.state();
  assert.equal(s.branch, 'main');
  assert.equal(s.feature, '', 'branch deleted');
  assert.equal(r.g('rev-list', '--parents', '-n', '1', 'main').split(' ').length, 3, 'merge commit');
  assert.equal(r.status(), 'done');
  assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md'), 'utf8'), /^finished: /m);
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'feature\n');
  assert.equal(r.g('status', '--porcelain'), '');
});

test('AC3: a conflicting merge is aborted and leaves main and the branch as they were', () => {
  const r = shipRepo();
  r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main moved\n');
  r.g('commit', '-qam', 'main moved');
  r.g('checkout', '-q', 'speck/0001-export-bookings');
  const before = r.state();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /conflict/i);
  assert.deepEqual(r.state(), before);
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(r.status(), 'approved');
});

test('AC4: speck ship pushes main to its remote, or says why it did not', () => {
  // With a remote.
  const r = shipRepo();
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  r.g('push', '-q', '-u', 'origin', 'speck/0001-export-bookings');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pushed/i);
  assert.equal(spawnSync('git', ['rev-parse', 'main'], { cwd: bare, encoding: 'utf8' }).stdout.trim(), r.g('rev-parse', 'main'));
  // The ticket branch is deleted on the remote as well as locally.
  const remoteHeads = () => spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: bare, encoding: 'utf8' }).stdout.trim();
  assert.equal(remoteHeads(), 'main');
  assert.match(res.stdout, /Deleted speck\/0001-export-bookings on origin/);
  // Without a remote.
  const local = shipRepo();
  const out = local.run('ship', '1');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /no remote/i);
  // A refused push: the merge stays, and the user is told how to fix it.
  const refused = shipRepo();
  const bare2 = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare2]);
  refused.g('remote', 'add', 'origin', bare2);
  refused.g('push', '-q', '-u', 'origin', 'main');
  refused.g('push', '-q', '-u', 'origin', 'speck/0001-export-bookings');
  fs.writeFileSync(path.join(bare2, 'hooks', 'pre-receive'), '#!/bin/sh\necho "protected branch" >&2\nexit 1\n', { mode: 0o755 });
  const p = refused.run('ship', '1');
  assert.notEqual(p.status, 0);
  assert.match(p.stderr, /push/i);
  assert.match(p.stderr, /git push/);
  assert.equal(refused.state().branch, 'main');
  assert.equal(refused.status(), 'done');
  // The push failed, so the remote copy of the branch is kept as the backup.
  assert.match(spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: bare2, encoding: 'utf8' }).stdout, /speck\/0001-export-bookings/);
  assert.match(p.stderr, /kept on origin/);
});

test('AC4: doctor treats the GitHub CLI as optional', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  const r = spawnSync(process.execPath, [CLI, 'doctor'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin } });
  assert.doesNotMatch(r.stdout, /✗ GitHub CLI/);
  assert.match(r.stdout, /GitHub CLI.*optional/i);
});

test('AC5: only the user can ship, and the agent rules say so', () => {
  const ship = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ship', 'SKILL.md'), 'utf8');
  assert.match(ship.split('\n---')[0], /^disable-model-invocation: true$/m);
  assert.match(ship, /speck ship <id>/);
  for (const n of ['speck-build', 'speck-review'])
    assert.match(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /never (merge|ship)[^.]*unless the user runs `\/speck-ship`/i, n);
  assert.match(fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8'), /unless the user runs `\/speck-ship`/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir });
  assert.match(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /unless the user runs `\/speck-ship`/);
});

test('AC3: speck ship works when run from main, where the ticket is not yet approved', () => {
  const r = shipRepo();
  r.g('checkout', '-q', 'main');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.status(), 'done');
  assert.equal(r.state().feature, '');
});

// ---------- 0007: finished tickets move into speck/tickets/done/ ----------

// A repo with speck installed, plus helpers for lint-clean tickets and file paths.
test('AC1: setting a ticket to done moves it into speck/tickets/done/, and out again', () => {
  const r = doneRepo();
  const live = r.add('Export bookings');
  const done = path.join('speck', 'tickets', 'done', path.basename(live));
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.equal(r.at(live), false, 'no longer in speck/tickets/');
  assert.equal(r.at(done), true, 'moved into speck/tickets/done/ under the same name');
  assert.equal(r.fm(done).status, 'done');
  assert.match(r.read(done), /^finished: /m, 'the finished timestamp survives the move');
  // A done ticket that goes back to work returns to speck/tickets/.
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  assert.equal(r.at(live), true);
  assert.equal(r.at(done), false, 'only one copy is left behind');
});

test('AC1: speck ship leaves the finished ticket in speck/tickets/done/', () => {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md')), true);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md')), false);
  assert.equal(r.g('status', '--porcelain'), '', 'the move is committed, not left loose');
});

test('AC2: commands find a done ticket, status still lists it, and new never reuses its number', () => {
  const r = doneRepo();
  r.add('Export bookings');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const done = path.join('speck', 'tickets', 'done', '0001-export-bookings.md');
  // A command that takes an id finds the ticket in the done folder.
  assert.equal(r.run('set', '1', 'priority', '1').status, 0);
  assert.equal(r.fm(done).priority, 1);
  assert.equal(r.run('lint', '1').status, 0);
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0, 'lint found the ticket in the done folder too');
  assert.equal(r.at(path.join('speck', 'tickets', '0001-export-bookings.md')), true, 'a live ticket is back in speck/tickets/');
  assert.equal(r.run('status').stdout.includes('DONE (1)'), false, 'it is not done any more');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.match(r.run('status').stdout, /DONE \(1\)/, 'done tickets are still listed');
  // The next number skips the one in the done folder.
  assert.equal(r.run('new', 'Second').stdout.trim(), path.join('speck', 'tickets', '0002-second.md'));
});

test('AC3: speck init moves done tickets left in speck/tickets/ and leaves the others alone', () => {
  const r = doneRepo();
  const oldLayout = r.add('Old work');
  const live = r.add('New work');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  // Put the done ticket back where the previous version of speck kept it.
  fs.renameSync(path.join(r.dir, 'speck', 'tickets', 'done', path.basename(oldLayout)), path.join(r.dir, oldLayout));
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(oldLayout))), false);
  const first = r.run('init', '--skip-checks');
  assert.equal(first.status, 0);
  assert.match(first.stdout, /moved\s+1 done ticket into speck\/tickets\/done\//);
  // Running it again finds nothing to move and says nothing.
  assert.doesNotMatch(r.run('init', '--skip-checks').stdout, /moved/);
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(oldLayout))), true);
  assert.equal(r.at(oldLayout), false);
  assert.equal(r.at(live), true, 'a ticket still in progress stays where it is');
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(live))), false, 'and is not moved into done/');
  assert.equal(r.fm(live).status, 'draft', 'it was left untouched');
});

test('AC3: a name clash makes init refuse rather than overwrite an archived ticket (F1)', () => {
  const r = doneRepo();
  const live = r.add('Old work');
  const done = path.join('speck', 'tickets', 'done', path.basename(live));
  // The same file name in both folders, with different contents.
  fs.writeFileSync(path.join(r.dir, done), r.read(live).replace('status: draft', 'status: done') + 'ARCHIVED COPY\n');
  fs.writeFileSync(path.join(r.dir, live), r.read(live).replace('status: draft', 'status: done') + 'LIVE COPY\n');
  const init = r.run('init', '--skip-checks');
  assert.notEqual(init.status, 0);
  assert.match(init.stderr, /two tickets called 0001-old-work\.md/);
  assert.match(r.read(done), /ARCHIVED COPY/, 'the archived ticket is not overwritten');
  assert.match(r.read(live), /LIVE COPY/, 'the live ticket is still there');
});

test('AC2: pack and reviewer-settings find a shipped ticket in the done folder', () => {
  const r = shipRepo();
  assert.equal(r.run('ship', '1').status, 0);
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /0001 · Export bookings/);
  assert.equal(r.run('reviewer-settings', '1').status, 0);
});

test('init skips a ticket file it cannot read, and still updates speck', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const init = () => spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(init().status, 0);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0003-broken.md'), 'no frontmatter here\n');
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'speck-build', 'SKILL.md'), 'stale');
  const r = init();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /skipped speck\/tickets\/0003-broken\.md/);
  assert.ok(fs.existsSync(path.join(dir, 'speck', 'tickets', '0003-broken.md')), 'left where it was');
  assert.match(fs.readFileSync(path.join(dir, '.claude', 'skills', 'speck-build', 'SKILL.md'), 'utf8'), /name: speck-build/, 'skills still refreshed');
});

// A ticket ready to ship, with main on a bare remote that someone else has pushed to.
function shipWithRemoteMoved(file, content) {
  const r = shipRepo();
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-other-'));
  const o = (...a) => spawnSync('git', a, { cwd: other, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
  o('clone', '-q', bare, '.');
  fs.writeFileSync(path.join(other, file), content);
  o('add', '-A'); o('commit', '-qm', 'someone else'); o('push', '-q', 'origin', 'main');
  const remoteMain = () => spawnSync('git', ['rev-parse', 'main'], { cwd: bare, encoding: 'utf8' }).stdout.trim();
  return { ...r, bare, remoteMain, theirs: o('rev-parse', 'HEAD').stdout.trim() };
}

test('ship catches up with new commits on the remote before merging, then pushes', () => {
  const r = shipWithRemoteMoved('other.txt', 'from elsewhere\n');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /bringing your main up to date/);
  assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', r.theirs, 'main'], { cwd: r.dir }).status, 0, 'remote commit is in main');
  assert.ok(fs.existsSync(path.join(r.dir, 'other.txt')));
  assert.equal(r.remoteMain(), r.g('rev-parse', 'main'), 'pushed');
  assert.equal(r.status(), 'done');
});

test('ship refuses, changing nothing, when local and remote main have both moved on', () => {
  const r = shipWithRemoteMoved('other.txt', 'from elsewhere\n');
  r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'local.txt'), 'local\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'local only');
  const before = r.state();
  const remoteBefore = r.remoteMain();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /git pull/);
  assert.doesNotMatch(res.stderr, /protected/);
  assert.deepEqual(r.state(), before);
  assert.equal(r.remoteMain(), remoteBefore);
});

test('a conflict with new remote commits leaves local main exactly as it was', () => {
  const r = shipWithRemoteMoved('shared.txt', 'changed elsewhere\n');
  const before = r.state();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /conflict/i);
  assert.deepEqual(r.state(), before);
  assert.equal(r.g('status', '--porcelain'), '');
});

// ---------- 0004: a readable header at the top of every ticket ----------

function autoShipRepo({ config = '', risk = 'low', sandboxFailed = false } = {}) {
  const r = shipRepo({ approve: false });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8');
  for (const line of config.split('\n').filter(Boolean)) {
    const key = line.split(':')[0];
    c = new RegExp(`^${key}:`, 'm').test(c) ? c.replace(new RegExp(`^${key}:.*$`, 'm'), line) : c + line + '\n';
  }
  fs.writeFileSync(cfgFile, c);
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  fs.writeFileSync(file, setField(fs.readFileSync(file, 'utf8'), 'risk', risk));
  r.g('add', 'speck/config.yml', 'speck/tickets/0001-export-bookings.md'); r.g('commit', '-qm', 'config and risk'); // record needs tracked changes committed (0025)
  const v = path.join(os.tmpdir(), `verdict-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  r.run('record', '1', v);
  if (sandboxFailed) {
    const t = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, t.replace('"reviewer": "claude-subagent"', '"reviewer": "codex",\n    "sandbox_ok": false'));
    assert.match(fs.readFileSync(file, 'utf8'), /"sandbox_ok": false/);
  }
  r.run('set', '1', 'status', 'approved');
  r.g('add', '-A'); r.g('commit', '-qm', 'approved');
  return r;
}

test('auto-ship: config templates default to off and low risk only', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  const y = parseYaml(tpl);
  assert.equal(y.auto_ship, false);
  assert.deepEqual(y.auto_ship_risk, ['low']);
});

test('auto-ship: speck ship --auto refuses, changing nothing, while auto_ship is off', () => {
  const r = autoShipRepo();
  const before = r.state();
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /auto_ship is off/);
  assert.match(res.stderr, /\/speck-ship 0001/);
  assert.deepEqual(r.state(), before);
  assert.equal(r.status(), 'approved');
});

test('auto-ship: speck ship --auto ships an approved ticket whose risk is allowed', () => {
  const r = autoShipRepo({ config: 'auto_ship: true' });
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Shipped 0001/);
  assert.equal(r.status(), 'done');
  assert.equal(r.state().feature, '');
});

test('auto-ship: the risk filter decides which tickets ship on their own', () => {
  const high = autoShipRepo({ config: 'auto_ship: true', risk: 'high' });
  const before = high.state();
  const res = high.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /risk "high"/);
  assert.match(res.stderr, /auto_ship_risk/);
  assert.deepEqual(high.state(), before);

  const all = autoShipRepo({ config: 'auto_ship: true\nauto_ship_risk: [low, high]', risk: 'high' });
  assert.equal(all.run('ship', '1', '--auto').status, 0);
  assert.equal(all.status(), 'done');
});

test('auto-ship: never when the reviewer could not inspect the repo', () => {
  const r = autoShipRepo({ config: 'auto_ship: true\nauto_ship_risk: [low, high]', sandboxFailed: true });
  const before = r.state();
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /couldn't inspect the repo/);
  assert.deepEqual(r.state(), before);
  // The user can still ship it themselves.
  assert.equal(r.run('ship', '1').status, 0);
});

test('auto-ship: plain speck ship ignores the auto-ship settings', () => {
  const r = autoShipRepo({ risk: 'high' });
  assert.equal(r.run('ship', '1').status, 0);
});

test('auto-ship: the build skill runs speck ship --auto after approval, and the rules allow only that', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const approved = build.split('## 5. Approved')[1].split('\n## ')[0];
  assert.match(approved, /speck ship <id> --auto/);
  assert.ok(approved.indexOf('speck close') < approved.indexOf('--auto'), 'auto-ship comes after the approval is committed');
  assert.match(approved, /exit code 12|exits with 12|exits 12/);
  for (const n of ['speck-build', 'speck-review'])
    assert.match(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /auto_ship/, n);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir });
  assert.match(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /auto_ship/);
});

// ---------- 0012: run a reviewer from a command set in config ----------
