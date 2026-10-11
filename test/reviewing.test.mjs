import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket } from '../scripts/speck.mjs';
import { ROOT, reviewRepo, shipRepo, skillText, fenced, subagentVerdict, subagentRepo, commandRepo, buildSkill } from './support/speck.mjs';

const statusOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm.status;
const statusLine = file => fs.readFileSync(file, 'utf8').match(/^\*\*Status:\*\* .*$/m)[0];

test('0022 AC1: speck review round 1 sets a building ticket to reviewing before the reviewer runs, left uncommitted with the round', () => {
  const r = commandRepo({ ticketFields: 'status: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  const res = r.run('review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.calls()[0].ticketStatus, 'reviewing', 'the reviewer already sees reviewing');
  assert.equal(statusOf(r.ticketFile), 'reviewing');
  assert.equal(statusLine(r.ticketFile), '**Status:** 🔍 reviewing', 'the header follows');
  assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`, 'only the ticket is changed, and nothing is committed');
  assert.match(r.git('show', `HEAD:${path.relative(r.dir, r.ticketFile)}`).stdout, /^status: building/m);
});

test('0022 AC1: the codex adapter does the same', () => {
  const r = reviewRepo({ ticketFields: 'status: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(statusOf(r.ticketFile), 'reviewing');
  assert.equal(r.roundFile(1).meta.reviewer, 'codex');
});

test('0022 AC1: other statuses and later rounds are left alone', () => {
  for (const status of ['ready', 'blocked', 'reviewing']) {
    const r = commandRepo({ ticketFields: `status: ${status}` });
    r.git('add', '-A'); r.git('commit', '-qm', status);
    assert.equal(r.run('review', '1').status, 10);
    assert.equal(statusOf(r.ticketFile), status, `${status} is not changed`);
  }
  // Round 2 on a ticket set back to building by hand stays building.
  const r = commandRepo({ ticketFields: 'status: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix');
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(statusOf(r.ticketFile), 'building');
});

test('0022 AC1: round 2 runs when the only uncommitted ticket changes are round 1 and the status it set', () => {
  const r = commandRepo({ ticketFields: 'status: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  assert.equal(r.run('review', '1').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('add', 'a.txt'); r.git('commit', '-qm', 'fix, ticket left uncommitted');
  const res = r.run('review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.roundFile(2).meta.round, 2);
  // Any other uncommitted edit to the ticket is still refused.
  fs.writeFileSync(r.ticketFile, fs.readFileSync(r.ticketFile, 'utf8').replace('Users cannot export.', 'Users cannot export at all.'));
  assert.match(r.run('review', '1').stderr, /Commit your work before review/);
});

test('0022 AC2: a failed round leaves the status as it was', () => {
  for (const mode of ['fail', 'garbage', 'badshape']) {
    const r = commandRepo({ ticketFields: 'status: building' });
    r.git('add', '-A'); r.git('commit', '-qm', 'building');
    const before = fs.readFileSync(r.ticketFile, 'utf8');
    assert.equal(r.runEnv({ FAKE_MODE: mode }, 'review', '1').status, 1);
    assert.equal(r.calls()[0].ticketStatus, 'reviewing');
    assert.equal(fs.readFileSync(r.ticketFile, 'utf8'), before, `${mode}: the ticket is exactly as it was`);
    assert.equal(r.git('status', '--porcelain').stdout.trim(), '');
  }
  const codex = reviewRepo({ ticketFields: 'status: building', extraEnv: { FAKE_CODEX_FAIL: '1' } });
  codex.git('add', '-A'); codex.git('commit', '-qm', 'building');
  const res = codex.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /codex exited 2/);
  assert.equal(statusOf(codex.ticketFile), 'building');
  assert.equal(codex.git('status', '--porcelain').stdout.trim(), '');
  // An uncommitted tree refuses before anything changes.
  const dirty = commandRepo({ ticketFields: 'status: building' });
  dirty.git('add', '-A'); dirty.git('commit', '-qm', 'building');
  fs.writeFileSync(path.join(dirty.dir, 'a.txt'), 'uncommitted\n');
  assert.match(dirty.run('review', '1').stderr, /Commit your work before review/);
  assert.equal(statusOf(dirty.ticketFile), 'building');
  assert.equal(dirty.calls().length, 0);
});

test('0022 AC3: speck record round 1 sets a building ticket to reviewing, and a refused reply changes nothing', () => {
  const r = reviewRepo({ config: 'allow_same_model_review: true\n', ticketFields: 'reviewer: claude-subagent\nstatus: building' });
  r.git('add', '-A'); r.git('commit', '-qm', 'building');
  const v = path.join(r.dir, '..', `v-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, 'not json');
  assert.equal(r.run('record', '1', v).status, 1);
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve' }));
  assert.equal(r.run('record', '1', v).status, 1);
  assert.equal(statusOf(r.ticketFile), 'building');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  assert.equal(r.run('record', '1', v).status, 10);
  assert.equal(statusOf(r.ticketFile), 'reviewing');
  assert.equal(statusLine(r.ticketFile), '**Status:** 🔍 reviewing');
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`);
  // Round 2 never changes the status.
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  r.git('add', '-A'); r.git('commit', '-qm', 'round 1');
  fs.writeFileSync(v, fenced(subagentVerdict('approve', 'resolved')));
  assert.equal(r.run('record', '1', v).status, 0);
  assert.equal(statusOf(r.ticketFile), 'building');
});

test('0022 AC4: the build skill no longer asks for a separate set reviewing step and commit', () => {
  const md = buildSkill();
  assert.doesNotMatch(md, /speck set <id> status reviewing/);
  assert.match(md, /first review round sets the ticket to `reviewing`/);
  assert.match(skillText('speck-review'), /status change/);
});

// ---------- 0032: builds can run in parallel ----------

// Two ready tickets, both started with `speck start` in their own worktrees, each changing a file and approved there.
// With sameLines, both change the same line of shared.txt; otherwise each changes its own file.
test('0025 AC1: the build and review skills say to stage files by name, never all at once, and to leave unknown files alone', () => {
  for (const n of ['speck-build', 'speck-review']) {
    const md = fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8');
    assert.match(md, /stage[^.]*by name/i, n);
    for (const banned of ['`git add -A`', '`git add .`', '`git commit -a`']) assert.ok(md.includes(banned), `${n} names ${banned}`);
    assert.match(md, /never[^.]*`git add -A`/i, n);
    assert.match(md, /didn't (create|write) or change[^.]*leave them alone[^.]*(tell|mention)[^.]*user/i, n);
    assert.doesNotMatch(md, /commit everything/i, `${n} no longer says to commit everything`);
  }
});

test('0025 AC2: speck review runs with untracked files present, but still refuses modified or staged tracked files', () => {
  const r = reviewRepo();
  fs.writeFileSync(path.join(r.dir, 'other-session.md'), 'not mine\n');
  fs.mkdirSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'draft.md'), '# Someone else\n');
  const res = r.run('review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.roundFile(1).meta.round, 1);
  assert.ok(fs.existsSync(path.join(r.dir, 'other-session.md')), 'left alone');
  assert.match(r.git('status', '--porcelain').stdout, /\?\? other-session\.md/, 'still untracked, not committed');

  for (const [name, dirty] of [
    ['modified', d => fs.writeFileSync(path.join(d.dir, 'a.txt'), 'uncommitted\n')],
    ['staged new file', d => { fs.writeFileSync(path.join(d.dir, 'b.txt'), 'staged\n'); d.git('add', 'b.txt'); }],
    ['staged edit', d => { fs.writeFileSync(path.join(d.dir, 'a.txt'), 'staged\n'); d.git('add', 'a.txt'); }],
  ]) {
    const d = reviewRepo();
    dirty(d);
    const out = d.run('review', '1');
    assert.notEqual(out.status, 0, name);
    assert.match(out.stderr, /Commit your work before review/, name);
    assert.equal(d.calls().length, 0, `${name}: the reviewer didn't run`);
  }
});

test('0025 AC2: speck record records with untracked files present, but refuses modified or staged tracked files', () => {
  const r = subagentRepo();
  const v = path.join(r.dir, 'v.json'); // the reply file itself is untracked, as the review skill writes it
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  fs.writeFileSync(path.join(r.dir, 'other-session.md'), 'not mine\n');
  const ok = r.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(ok.status, 10, ok.stderr);
  assert.equal(r.roundFile(1).meta.round, 1);
  // The recorded round itself is left uncommitted in the ticket, and the next round can still be recorded.
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('add', 'a.txt'); r.git('commit', '-qm', 'fix');
  assert.equal(r.run('record', '1', v, '--reviewer=claude-subagent').status, 10);
  assert.equal(r.roundFile(2).meta.round, 2);

  for (const [name, dirty] of [
    ['modified', d => fs.writeFileSync(path.join(d.dir, 'a.txt'), 'uncommitted\n')],
    ['staged new file', d => { fs.writeFileSync(path.join(d.dir, 'b.txt'), 'staged\n'); d.git('add', 'b.txt'); }],
    ['ticket edited beyond its rounds', d => fs.writeFileSync(d.ticketFile, fs.readFileSync(d.ticketFile, 'utf8').replace('Users cannot export.', 'Users cannot export at all.'))],
  ]) {
    const d = subagentRepo();
    const w = path.join(d.dir, 'w.json');
    fs.writeFileSync(w, fenced(subagentVerdict('changes_requested', 'open')));
    dirty(d);
    const before = fs.readFileSync(d.ticketFile, 'utf8');
    const out = d.run('record', '1', w, '--reviewer=claude-subagent');
    assert.notEqual(out.status, 0, name);
    assert.match(out.stderr, /Commit your work/, name);
    assert.equal(fs.readFileSync(d.ticketFile, 'utf8'), before, `${name}: nothing recorded`);
  }
});

test('0025 AC3: speck ship still refuses an untracked file in the ticket\'s tree', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other-session.md'), 'not mine\n');
  const before = r.state();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /untracked/);
  assert.deepEqual(r.state(), before);
  assert.equal(r.status(), 'approved');
});

test('0025 AC2 (F1): a ticket edit that is staged, with the working copy put back, still refuses review and record', () => {
  const stageHidden = d => {
    const rel = path.relative(d.dir, d.ticketFile);
    const original = fs.readFileSync(d.ticketFile, 'utf8');
    fs.writeFileSync(d.ticketFile, original.replace('Users cannot export.', 'Users cannot export at all.'));
    d.git('add', rel);
    fs.writeFileSync(d.ticketFile, original); // the working copy matches HEAD again; the index doesn't
    assert.match(d.git('status', '--porcelain').stdout, /^MM /m);
  };
  const r = reviewRepo();
  stageHidden(r);
  const res = r.run('review', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /Commit your work before review/);
  assert.equal(r.calls().length, 0, "the reviewer didn't run");

  const s = subagentRepo();
  const w = path.join(s.dir, 'w.json');
  fs.writeFileSync(w, fenced(subagentVerdict('changes_requested', 'open')));
  stageHidden(s);
  const before = fs.readFileSync(s.ticketFile, 'utf8');
  const out = s.run('record', '1', w, '--reviewer=claude-subagent');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /Commit your work/);
  assert.equal(fs.readFileSync(s.ticketFile, 'utf8'), before, 'nothing recorded');

  // A staged copy holding only a recorded round and the status change is still fine.
  const ok = subagentRepo();
  const v = path.join(ok.dir, 'v.json');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  assert.equal(ok.run('record', '1', v, '--reviewer=claude-subagent').status, 10);
  ok.git('add', path.relative(ok.dir, ok.ticketFile));
  assert.equal(ok.run('record', '1', v, '--reviewer=claude-subagent').status, 10, 'staged round 1, round 2 recorded');
});

// ---------- 0033: everything needed for Gate 1 in status --json ----------
