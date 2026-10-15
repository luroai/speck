import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathsOutside } from '../scripts/speck.mjs';
import { ROOT, CLI, approveVerdict, shipRepo, changesVerdict } from './support/speck.mjs';

function closeRepo({ approve = true } = {}) {
  const r = shipRepo({ approve: false });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  fs.appendFileSync(file, '\n## Review log\n<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->\n\n## Delivery log\n<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->\n');
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  r.g('add', '-A'); r.g('commit', '-qm', 'reviewing');
  const rec = (name, v) => { const f = path.join(os.tmpdir(), `${name}-${path.basename(r.dir)}.json`); fs.writeFileSync(f, JSON.stringify(v)); return r.run('record', '1', f, '--reviewer=codex'); };
  const finding = (id, issue, state = 'open', severity = 'blocking') => ({ id, severity, file: 'a.txt', issue, suggested_fix: 'Fix it.', state });
  rec('r1', { ...changesVerdict, findings: [finding('F1', 'Missing the empty-input case. It crashes.'), finding('F2', 'Wrong   total\nin the summary! Check it.'), finding('F9', 'Nit about naming.', 'open', 'minor')] });
  r.g('add', '-A'); r.g('commit', '-qm', 'round 1');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'fixed\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'fix');
  if (approve) rec('r2', { ...approveVerdict, findings: [finding('F1', 'Missing the empty-input case. It crashes.', 'resolved'), finding('F2', 'Wrong total in the summary.', 'resolved')] });
  const text = () => fs.readFileSync(file, 'utf8');
  return { ...r, file, text, rec, finding };
}
const sectionOf = (text, name) => text.split(`## ${name}\n`)[1].split(/\n## /)[0];

test('0021 AC1: speck close refuses, changing nothing, unless the review says ship and only the ticket has changed', () => {
  const unapproved = closeRepo({ approve: false });
  const before = [unapproved.text(), unapproved.g('rev-parse', 'HEAD')];
  const res = unapproved.run('close', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /fix/);
  assert.deepEqual([unapproved.text(), unapproved.g('rev-parse', 'HEAD')], before);

  for (const [name, dirty] of [
    ['untracked file', r => fs.writeFileSync(path.join(r.dir, 'new.txt'), 'x\n')],
    ['edited file', r => fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'edited\n')],
    ['staged file', r => { fs.writeFileSync(path.join(r.dir, 'staged.txt'), 'x\n'); r.g('add', 'staged.txt'); }],
  ]) {
    const r = closeRepo();
    dirty(r);
    const snap = [r.text(), r.g('rev-parse', 'HEAD'), r.g('status', '--porcelain')];
    const out = r.run('close', '1');
    assert.notEqual(out.status, 0, name);
    assert.match(out.stderr, /outside the ticket|commit or remove/i, name);
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
    assert.deepEqual([r.text(), r.g('rev-parse', 'HEAD'), r.g('status', '--porcelain')], snap, name);
  }
  const closed = closeRepo();
  assert.equal(closed.run('close', '1').status, 0);
  const again = closed.run('close', '1');
  assert.notEqual(again.status, 0, 'a second close would duplicate the delivery log');
  assert.match(again.stderr, /approved/);
  assert.equal(closeRepo().run('close').status, 1, 'needs an id');
});

test('0021 AC2: the review log has one line per round, with new blocking findings only', () => {
  const r = closeRepo();
  assert.equal(r.run('close', '1').status, 0);
  const log = sectionOf(r.text(), 'Review log').trim().split('\n');
  assert.equal(log.length, 2, log.join('\n'));
  assert.match(log[0], /^Round 1 \(codex\): changes requested/);
  assert.ok(log[0].includes('F1 Missing the empty-input case.'), log[0]);
  assert.ok(log[0].includes('F2 Wrong total in the summary!'), log[0]);
  assert.ok(!log[0].includes('It crashes') && !log[0].includes('F9') && !log[0].includes('Nit'), 'first sentence only, blocking only');
  assert.match(log[1], /^Round 2 \(codex\): approve/);
  assert.doesNotMatch(log[1], /F1|F2/, 'carried-over findings are not repeated');
  assert.doesNotMatch(r.text(), /one line per round, with the verdict/, 'the placeholder is replaced');
});

test('0021 AC2: a pre-existing review log is replaced, and a finding new in a later round is listed there', () => {
  const r = closeRepo({ approve: false });
  r.rec('r2', { ...changesVerdict, findings: [r.finding('F1', 'Missing the empty-input case.'), r.finding('F3', 'Brand new problem.')] });
  r.g('add', '-A'); r.g('commit', '-qm', 'round 2');
  r.rec('r3', { ...approveVerdict });
  fs.writeFileSync(r.file, r.text().replace('## Review log\n', '## Review log\nStale line from an earlier attempt.\n'));
  assert.equal(r.run('close', '1').status, 0);
  const log = sectionOf(r.text(), 'Review log');
  assert.doesNotMatch(log, /Stale/);
  const lines = log.trim().split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].includes('F3 Brand new problem.') && !lines[1].includes('F1'), lines[1]);
});

test('0021 AC3: the delivery log gets the pack figures, and keeps what was already there', () => {
  const r = closeRepo();
  fs.writeFileSync(r.file, r.text().replace(/(## Delivery log\n)/, '$1- Follow-up ideas: tidy the CSV header.\n'));
  r.g('commit', '-qam', 'follow-up idea');
  assert.equal(r.run('close', '1').status, 0);
  const d = sectionOf(r.text(), 'Delivery log');
  const pack = r.run('pack', '1').stdout;
  assert.match(d, /Follow-up ideas: tidy the CSV header\./);
  assert.match(d, /Review rounds: 2/);
  assert.match(d, /Reviewer: codex, model default/);
  const tokens = pack.match(/Reviewer tokens: (.*)/)[1];
  assert.ok(d.includes(`Reviewer tokens: ${tokens}`), d);
  assert.match(d, /Elapsed since build started: \d+ min/);
  const lines = pack.match(/Changed lines \(excluding tests and lockfiles\): (\d+) \(limit (\d+)\)/);
  assert.ok(d.includes(`Changed lines: ${lines[1]} (limit ${lines[2]})`), d);
});

test('0021 AC3: the delivery log works when the build has no recorded start', () => {
  const r = closeRepo();
  fs.writeFileSync(r.file, r.text().replace(/^started: .*\n/m, ''));
  r.g('commit', '-qam', 'no start');
  assert.equal(r.run('close', '1').status, 0);
  assert.match(sectionOf(r.text(), 'Delivery log'), /Elapsed: not recorded/);
});

test('0021 AC4: it sets approved and commits only the ticket file', () => {
  const r = closeRepo();
  const head = r.g('rev-parse', 'HEAD');
  assert.equal(r.run('close', '1').status, 0);
  assert.equal(r.status(), 'approved');
  assert.match(r.text(), /\*\*Status:\*\* 👍 approved/);
  assert.equal(r.g('rev-list', '--count', `${head}..HEAD`), '1');
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0001): approved');
  assert.deepEqual(r.g('diff', '--name-only', `${head}..HEAD`).split('\n'), ['speck/tickets/0001-export-bookings.md']);
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(r.g('branch', '--show-current'), 'speck/0001-export-bookings', 'never merges or pushes');
  assert.equal(r.run('ship', '1').status, 0, 'the closed ticket can be shipped');
});

test('0021 AC4: a ticket missing a log section is refused with a plain message, changing nothing', () => {
  const r = closeRepo();
  fs.writeFileSync(r.file, r.text().replace('## Delivery log', '## Something else'));
  r.g('commit', '-qam', 'broken');
  const snap = [r.text(), r.g('rev-parse', 'HEAD')];
  const res = r.run('close', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /## Delivery log/);
  assert.deepEqual([r.text(), r.g('rev-parse', 'HEAD')], snap);
});

test('0021 AC5: the build skill closes with speck close, and since 0194 runs no speck ship after it', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const approved = build.split('## 5. Approved')[1].split('\n## ')[0];
  assert.match(approved, /speck close <id>/);
  assert.doesNotMatch(approved, /speck set <id> status approved/);
  assert.ok(approved.indexOf('follow-up') < approved.indexOf('speck close'), 'follow-up ideas come first');
  assert.doesNotMatch(approved, /speck ship <id> --auto/);
  assert.match(spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' }).stdout, /speck close <id>/);
});

test('0021 AC1: a rename or copy counts both of its paths as changes outside the ticket', () => {
  const rel = 'speck/tickets/0001-x.md';
  assert.deepEqual(pathsOutside(`R  ${rel}\0other.md\0`, rel), ['other.md'], 'the old path of a rename into the ticket');
  assert.deepEqual(pathsOutside(`C  new.md\0${rel}\0`, rel), ['new.md']);
  assert.deepEqual(pathsOutside(` M ${rel}\0?? constructor\0`.replace('?? ', '?? '), rel), ['constructor']);
  assert.deepEqual(pathsOutside(`M  ${rel}\0`, rel), []);
  assert.deepEqual(pathsOutside('', rel), []);
});

test('0021 AC4: a rejected commit puts the ticket back exactly as it was, staged changes included', () => {
  const r = closeRepo();
  fs.writeFileSync(r.file, r.text().replace('## Review log', 'Staged note.\n\n## Review log'));
  r.g('add', r.file);
  fs.writeFileSync(r.file, r.text().replace('## Review log', 'Unstaged note.\n\n## Review log'));
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\necho rejected >&2\nexit 1\n', { mode: 0o755 });
  const snap = [r.text(), r.g('rev-parse', 'HEAD'), r.g('diff', '--cached', '--stat'), r.g('diff', '--stat')];
  const res = r.run('close', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /nothing was changed/);
  assert.deepEqual([r.text(), r.g('rev-parse', 'HEAD'), r.g('diff', '--cached', '--stat'), r.g('diff', '--stat')], snap);
  assert.equal(r.status(), 'reviewing');
});

// ---------- 0030: speck status --json ----------
