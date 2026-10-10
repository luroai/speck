// 0048: a ship that hits a conflict exits 13, and the build merges the base branch in and gets it re-reviewed.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shipRepo, remoteMoves, runIn, gIn, BRANCH, env } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TICKET = 'speck/tickets/0001-export-bookings.md';
const approve = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' };
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

// An approved ticket whose ship conflicts: main changes shared.txt (as the ticket does) and adds mainonly.txt.
// The ticket uses reviewer "fake", a command that logs its stdin and answers with FAKE_VERDICT (approve by default).
// Its Delivery log already has the figures an earlier `speck close` wrote, and a follow-up idea.
function conflictRepo({ remote = false } = {}) {
  const r = shipRepo();
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-'));
  const fake = path.join(bin, 'fake-reviewer');
  const log = path.join(bin, 'stdin.log');
  fs.writeFileSync(fake, `#!${process.execPath}
const fs = require('fs');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(fs.readFileSync(0, 'utf8')) + '\\n');
if (process.env.FAKE_FAIL) process.exit(3);
console.log(process.env.FAKE_VERDICT || ${JSON.stringify(JSON.stringify(approve))});
`, { mode: 0o755 });
  const cfg = path.join(r.wt, 'speck', 'config.yml');
  fs.writeFileSync(cfg, read(r.wt, 'speck/config.yml').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(fake)}\n`));
  const t = path.join(r.wt, TICKET);
  fs.writeFileSync(t, read(r.wt, TICKET).replace(/^reviewer: .*$/m, 'reviewer: fake')
    .replace(/^## Review rounds$/m, '## Review log\nRound 1 (claude-subagent): approve.\n\n## Delivery log\n- Review rounds: 1\n- Reviewer: fake, model default, effort default\n- Reviewer tokens: 0\n- Elapsed: not recorded\n- Changed lines: 1 (limit 5000)\n- Follow-up: keep this idea\n\n## Review rounds'));
  gIn(r.wt, 'add', 'speck/config.yml', TICKET);
  gIn(r.wt, 'commit', '-qm', 'reviewer fake');
  // With `remote`, only the remote's main moves on (shared.txt), and local main stays where the ticket branched from it.
  if (remote) remoteMoves(r, 'shared.txt', 'main side\n');
  else {
    fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
    fs.writeFileSync(path.join(r.dir, 'mainonly.txt'), 'from main\n');
    r.g('add', 'shared.txt', 'mainonly.txt');
    r.g('commit', '-qm', 'main moves on');
  }
  const prompts = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const wtRun = (extraEnv, ...a) => spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'speck.mjs'), ...a], { cwd: r.wt, encoding: 'utf8', env: { ...env, ...extraEnv } });
  // Merges main (or the ref ship named) into the ticket branch in its worktree and resolves shared.txt keeping both sides.
  const mergeMain = (ref = 'main') => {
    assert.notEqual(gIn(r.wt, 'merge', '-q', ref).status, 0, 'the merge conflicts');
    fs.writeFileSync(path.join(r.wt, 'shared.txt'), 'feature\nmain side\n');
    gIn(r.wt, 'add', 'shared.txt');
    assert.equal(gIn(r.wt, 'commit', '-q', '--no-edit').status, 0);
  };
  const statusOf = () => read(r.wt, TICKET).match(/^status: (\S+)/m)[1];
  return { ...r, prompts, wtRun, mergeMain, statusOf };
}

test('0048 AC1: a conflicting merge exits 13, names the conflicting files and changes nothing', () => {
  const r = conflictRepo();
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 13, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /conflict/);
  assert.match(res.stderr, /shared\.txt/);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusOf(), 'approved');
});

test('0048 AC1: speck ship --auto also exits 13 on a conflict', () => {
  const r = conflictRepo();
  for (const dir of [r.dir, r.wt]) {
    const cfg = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, read(dir, 'speck/config.yml').replace(/^auto_ship: .*$/m, 'auto_ship: true'));
  }
  r.g('commit', '-qam', 'auto ship on');
  gIn(r.wt, 'commit', '-qam', 'auto ship on');
  const before = r.snapshot();
  const res = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(res.status, 13, res.stderr + res.stdout);
  assert.match(res.stderr, /shared\.txt/);
  assert.deepEqual(r.snapshot(), before);
});

test('0048 AC1: other refusals keep their codes', () => {
  const failing = shipRepo({ test: '! grep -q feature shared.txt' }); // fails on the ticket branch only: main's own failing tests exit 14 (0099)
  fs.writeFileSync(path.join(failing.dir, 'shared.txt'), 'main side\n');
  failing.g('commit', '-qam', 'main moves on');
  assert.equal(runIn(failing.dir, 'ship', '1').status, 1, 'failed tests');
  const off = shipRepo();
  assert.equal(runIn(off.dir, 'ship', '1', '--auto').status, 12, 'auto_ship off');
  const overwrite = shipRepo();
  fs.writeFileSync(path.join(overwrite.dir, 'shared.txt'), 'uncommitted\n');
  const res = runIn(overwrite.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.doesNotMatch(res.stderr, /conflict/i);
});

test('0048 AC1 self-check: a merge that fails without conflicting files keeps code 1 and isn\'t called a conflict', () => {
  const r = shipRepo();
  r.hook('exit 1', 'pre-merge-commit');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.doesNotMatch(res.stderr, /conflict/i);
  assert.match(res.stderr, /failed, so nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
});

test('0048 AC2: speck review accepts an approved ticket, sets it to reviewing and runs the next round', () => {
  const r = conflictRepo();
  assert.equal(r.statusOf(), 'approved');
  const res = r.wtRun({}, 'review', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(res.stdout, /Round 2: approve/);
  assert.equal(r.statusOf(), 'reviewing');
  assert.match(read(r.wt, TICKET), /^\*\*Status:\*\* 🔍 reviewing$/m, 'header rewritten');
  assert.equal(r.prompts().length, 1);
});

test('0048 AC2: a failed round on an approved ticket leaves it approved', () => {
  const r = conflictRepo();
  const before = read(r.wt, TICKET);
  const res = r.wtRun({ FAKE_FAIL: '1' }, 'review', '1');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.equal(read(r.wt, TICKET), before);
});

test('0048 AC2: speck record also moves an approved ticket to reviewing', () => {
  const r = conflictRepo();
  const v = path.join(os.tmpdir(), `verdict-0048-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approve));
  const res = runIn(r.wt, 'record', '1', v);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.statusOf(), 'reviewing');
});

test('0048 AC3: after merging the base branch, the reviewer gets the whole change against the base as merged, and is told about the merge', () => {
  const r = conflictRepo();
  assert.equal(runIn(r.dir, 'ship', '1').status, 13);
  r.mergeMain();
  // speck diff shows the same diff the reviewer is about to get.
  const diff = r.wtRun({}, 'diff', '1');
  assert.equal(diff.status, 0, diff.stderr);
  assert.match(diff.stdout, /^\+feature$/m);
  assert.doesNotMatch(diff.stdout, /mainonly\.txt/);
  const res = r.wtRun({}, 'review', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  const [prompt] = r.prompts();
  // The round's own part comes after the earlier rounds.
  const round = prompt.slice(prompt.lastIndexOf('# Review round 2'));
  assert.match(round, /follows a merge of main/);
  assert.match(round, /whole change against main as merged/);
  assert.doesNotMatch(round, /Changes since your last review/);
  assert.match(round, /diff --git a\/shared\.txt/);
  assert.match(round, /^\+feature$/m, "the ticket's own change is in the diff");
  assert.doesNotMatch(prompt, /mainonly\.txt/, "main's own changes aren't shown as the ticket's, in this round or the rebuilt round 1");
  const mb = gIn(r.wt, 'merge-base', 'main', 'HEAD').stdout.trim();
  assert.equal(mb, r.sha('main'));
  assert.ok(round.includes(`(${mb.slice(0, 8)}..HEAD)`));
  assert.ok(round.includes(diff.stdout.trim()), 'the same diff as speck diff');
});

test('0048 AC3: a round with no merge since the last review still gets only the changes since then', () => {
  const r = conflictRepo();
  fs.writeFileSync(path.join(r.wt, 'notes.txt'), 'later\n');
  gIn(r.wt, 'commit', '-qam', 'more work');
  assert.equal(r.wtRun({}, 'review', '1').status, 0);
  const prompt = r.prompts()[0];
  const round = prompt.slice(prompt.lastIndexOf('# Review round 2'));
  assert.match(round, /Changes since your last review/);
  assert.doesNotMatch(round, /follows a merge/);
  assert.match(round, /diff --git a\/notes\.txt/);
  assert.doesNotMatch(round, /diff --git a\/shared\.txt/);
});

test('0048 AC2/AC4: after the merge, the re-review, speck close and a second ship go through', () => {
  const r = conflictRepo();
  assert.equal(runIn(r.dir, 'ship', '1').status, 13);
  r.mergeMain();
  assert.equal(r.wtRun({}, 'review', '1').status, 0);
  gIn(r.wt, 'add', TICKET);
  gIn(r.wt, 'commit', '-qm', 'round 2');
  const close = runIn(r.wt, 'close', '1');
  assert.equal(close.status, 0, close.stderr);
  const log = read(r.wt, TICKET).split('## Delivery log')[1];
  assert.equal(log.match(/^- Review rounds:/gm).length, 1, 'the earlier close\'s figures are replaced, not repeated');
  assert.match(log, /^- Review rounds: 2, 1 of them a merge round$/m); // 0097: round 2 re-reviews the merge
  assert.equal(log.match(/^- Changed lines:/gm).length, 1);
  assert.match(log, /^- Follow-up: keep this idea$/m);
  const ship = runIn(r.dir, 'ship', '1');
  assert.equal(ship.status, 0, ship.stderr + ship.stdout);
  assert.equal(read(r.dir, 'shared.txt'), 'feature\nmain side\n');
  assert.equal(read(r.dir, 'mainonly.txt'), 'from main\n');
  assert.equal(gIn(r.dir, 'branch', '--list', BRANCH).stdout.trim(), '');
});

test('0048 round 1 F1: a conflict with commits only on the remote names the remote copy to merge, and the merge is re-reviewed and auto-ships', () => {
  const r = conflictRepo({ remote: true });
  const cfg = path.join(r.wt, 'speck', 'config.yml');
  fs.writeFileSync(cfg, read(r.wt, 'speck/config.yml').replace(/^auto_ship: .*$/m, 'auto_ship: true'));
  gIn(r.wt, 'commit', '-qm', 'auto ship on', '--', 'speck/config.yml');
  const before = r.snapshot();
  const first = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(first.status, 13, first.stderr + first.stdout);
  assert.match(first.stderr, /shared\.txt/);
  assert.match(first.stderr, /Merge origin\/main into /);
  assert.deepEqual(r.snapshot(), before, 'local main is back where it was');
  // Merging the local main does nothing: it doesn't have the remote's commits.
  assert.match(gIn(r.wt, 'merge', 'main').stdout, /Already up to date/);
  r.mergeMain('origin/main');
  const diff = r.wtRun({}, 'diff', '1');
  assert.match(diff.stdout, /^\+feature$/m);
  assert.doesNotMatch(diff.stdout, /^-main side$/m, "the remote's change isn't shown as reverted");
  assert.equal(r.wtRun({}, 'review', '1').status, 0);
  const prompt = r.prompts()[0];
  const round = prompt.slice(prompt.lastIndexOf('# Review round 2'));
  assert.match(round, /follows a merge of main/);
  assert.ok(round.includes(diff.stdout.trim()), 'the same diff as speck diff');
  gIn(r.wt, 'add', TICKET);
  gIn(r.wt, 'commit', '-qm', 'round 2');
  assert.equal(runIn(r.wt, 'close', '1').status, 0);
  const ship = runIn(r.wt, 'ship', '1', '--auto');
  assert.equal(ship.status, 0, ship.stderr + ship.stdout);
  assert.equal(read(r.dir, 'shared.txt'), 'feature\nmain side\n');
  assert.equal(gIn(r.dir, 'rev-parse', 'main').stdout, gIn(r.dir, 'rev-parse', 'origin/main').stdout, 'pushed');
});

// The section of the build skill between `## 5.` and the next `## `.
const section5 = () => read(ROOT, 'skills/speck-build/SKILL.md').split(/^## 5\./m)[1].split(/^## /m)[0];

test('0048 AC4: /speck-build section 5 says how to merge, resolve, re-review and ship again on exit 13', () => {
  const s = section5();
  assert.match(s, /exits with 13/);
  assert.match(s, /merge the base branch into the ticket branch/i);
  assert.match(s, /`<remote>\/<base_branch>`/, 'the remote copy when ship names it');
  assert.match(s, /in its worktree|in the ticket's worktree/i);
  assert.match(s, /keeping the intent of both sides/);
  assert.match(s, /run the tests/i);
  assert.match(s, /commit/i);
  assert.match(s, /review round/i);
  assert.match(s, /each file you resolved and how/);
  assert.match(s, /`speck close <id>`/);
  assert.match(s, /`speck ship <id> --auto` again/);
  assert.match(s, /two merges/);
  assert.match(s, /block the ticket/i);
  assert.match(s, /conflicting files in the question/);
});

