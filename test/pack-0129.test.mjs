// 0129: the review pack counts the ticket branch's own changes wherever it's run from, and says so plainly once
// the branch is gone.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, gIn, BRANCH } from './support/ship.mjs';
import { reviewPack } from '../scripts/pack.mjs';

const TICKET = 'speck/tickets/0001-export-bookings.md';
const DONE = 'speck/tickets/done/0001-export-bookings.md';

// shipRepo's approved ticket, whose branch also adds a sensitive file and a test. Counted: shared.txt (1 added,
// 1 removed) and src/auth.js (3 added), so 5. The test file and the ticket aren't counted.
function packRepo(opts) {
  const r = shipRepo(opts);
  const wt = r.wt;
  if (wt === r.dir) r.g('checkout', '-q', BRANCH);
  fs.mkdirSync(path.join(wt, 'src'), { recursive: true });
  fs.writeFileSync(path.join(wt, 'src', 'auth.js'), 'a\nb\nc\n');
  fs.mkdirSync(path.join(wt, 'test'), { recursive: true });
  fs.writeFileSync(path.join(wt, 'test', 'export.test.js'), 'x\n'.repeat(40));
  gIn(wt, 'add', '-A'); gIn(wt, 'commit', '-qm', 'more work');
  if (wt === r.dir) r.g('checkout', '-q', 'main');
  return r;
}

// The changed-lines line, without the limit, which comes from the config.
const figure = pack => pack.match(/^- Changed lines.*$/m)?.[0].replace(/ \(limit \d+\)$/, '');
const sensitive = pack => pack.match(/^- (Sensitive files|No sensitive).*$/m)?.[0];

test('0129 AC1: from the base branch checkout, with the branch in its own worktree, the pack counts the branch', () => {
  const r = packRepo();
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(sensitive(pack), '- Sensitive files touched: `src/auth.js`');
});

test('0129 AC1: from the base branch checkout, with the branch not checked out anywhere, the pack counts the branch', () => {
  const r = packRepo({ worktree: false });
  assert.equal(r.g('branch', '--show-current'), 'main');
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(sensitive(pack), '- Sensitive files touched: `src/auth.js`');
});

test('0129 AC1: the base branch moving on after the branch left it changes nothing', () => {
  const r = packRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'main\nmoves\non\n');
  fs.writeFileSync(path.join(r.dir, 'deploy.sh'), 'x\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'main moves on');
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(sensitive(pack), '- Sensitive files touched: `src/auth.js`');
});

test('0129 AC1: the base branch\'s own changes merged into the ticket\'s branch aren\'t counted as the ticket\'s', () => {
  const r = packRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'main\nmoves\non\n');
  fs.writeFileSync(path.join(r.dir, 'deploy.sh'), 'x\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'main moves on');
  assert.equal(gIn(r.wt, 'merge', '-q', '--no-edit', 'main').status, 0);
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(sensitive(pack), '- Sensitive files touched: `src/auth.js`');
  assert.equal(figure(reviewPack(r.wt, '1')), figure(pack));
});

test('0129 AC1: a branch merged into the base branch but kept is still counted from where it left', () => {
  const r = packRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'main moves on\n');
  r.g('commit', '-qam', 'main moves on');
  assert.equal(gIn(r.dir, 'merge', '-q', '--no-ff', '-m', 'merge', BRANCH).status, 0);
  fs.writeFileSync(path.join(r.dir, 'notes.txt'), 'after\n');
  r.g('commit', '-qam', 'and on');
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(sensitive(pack), '- Sensitive files touched: `src/auth.js`');
  const inside = reviewPack(r.wt, '1');
  assert.equal(figure(inside), figure(pack), 'the same from the ticket\'s own worktree');
  assert.equal(sensitive(inside), sensitive(pack));
});

test('0129 AC2: from inside the ticket\'s own worktree the pack gives the same figure and sensitive files', () => {
  const r = packRepo();
  const inside = reviewPack(r.wt, '1');
  const outside = reviewPack(r.dir, '1');
  assert.equal(figure(inside), '- Changed lines (excluding tests and lockfiles): 5');
  assert.equal(figure(inside), figure(outside));
  assert.equal(sensitive(inside), sensitive(outside));
});

// Ships shipRepo's ticket, which deletes its branch and worktree, then gives the done ticket on main `delivery` as
// its Delivery log.
function shipped(delivery) {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.g('branch', '--list', BRANCH), '', 'the branch is gone');
  const file = path.join(r.dir, DONE);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^## Review rounds$/m, `## Delivery log\n${delivery}\n\n## Review rounds`));
  return r;
}

test('0129 AC3: with the branch gone, the pack shows the delivery log\'s figure, recorded at approval', () => {
  const r = shipped('- Review rounds: 1\n- Changed lines: 158 (limit 5000)\n- Some note');
  const pack = reviewPack(r.dir, '1');
  assert.equal(figure(pack), '- Changed lines (excluding tests and lockfiles): 158, as recorded at approval');
});

test('0129 AC3: with the branch gone and no figure in the delivery log, the pack says the count isn\'t available', () => {
  const r = shipped('- Review rounds: 1');
  const line = figure(reviewPack(r.dir, '1'));
  assert.match(line, /not available/);
  assert.doesNotMatch(line, /\d/);
});

test('0129 AC3: a figure elsewhere in the ticket isn\'t taken for the delivery log\'s', () => {
  const r = shipped('');
  const file = path.join(r.dir, DONE);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## Out of scope', '- Changed lines: 99 (limit 5000)\n## Out of scope'));
  assert.match(figure(reviewPack(r.dir, '1')), /not available/);
});

test('0129 AC4: with the branch gone, the pack says it can\'t list the sensitive files instead of saying none were touched', () => {
  const r = shipped('- Changed lines: 5 (limit 5000)');
  const pack = reviewPack(r.dir, '1');
  assert.doesNotMatch(pack, /No sensitive file patterns touched/);
  assert.match(sensitive(pack), /^- Sensitive files touched: can't be listed/);
  assert.ok(fs.existsSync(path.join(r.dir, DONE)) && !fs.existsSync(path.join(r.dir, TICKET)));
});
