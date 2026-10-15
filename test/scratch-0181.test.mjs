import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipRepo, gIn, runIn } from './support/ship.mjs';
import { good } from './support/speck.mjs';

// ---------- 0181: a ticket's scratch files are removed once it's shipped or cancelled ----------
// support/tmp.mjs points TMPDIR at the run's own folder, so the scratch files here never touch the real /tmp.

const tmp = () => os.tmpdir();
const OWN = ['speck-0001-tests.txt', 'speck-0001-prompt.md', 'speck-0001-main-tests.txt'];
const OTHERS = ['speck-00010-tests.txt', 'speck-0002-tests.txt', 'speck-0001', 'speck-0001x.md', 'xspeck-0001-tests.txt'];

// Writes the ticket's own scratch files, a folder of them among them, and other tickets' files beside them.
function scratch() {
  for (const f of [...OWN, ...OTHERS]) fs.writeFileSync(path.join(tmp(), f), 'x\n');
  fs.mkdirSync(path.join(tmp(), 'speck-0001-review', 'inner'), { recursive: true });
  fs.writeFileSync(path.join(tmp(), 'speck-0001-review', 'inner', 'diff.txt'), 'x\n');
}
const left = () => fs.readdirSync(tmp()).filter(f => f.startsWith('speck-000') || f.startsWith('xspeck-'));

// A repo with ticket 0001 in draft, to cancel.
function cancelRepo() {
  const dir = fs.mkdtempSync(path.join(tmp(), 'repo-cancel-'));
  gIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(runIn(dir, 'init', '--skip-checks').status, 0);
  const p = runIn(dir, 'new', 'Export', 'bookings').stdout.trim();
  fs.writeFileSync(path.join(dir, p), fs.readFileSync(path.join(dir, p), 'utf8').split('## Problem')[0] + good);
  return dir;
}

test('0181 AC1: speck ship removes every file and folder in /tmp starting speck-<id>-', () => {
  const r = shipRepo();
  scratch();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.statusIn(r.dir), 'done');
  for (const f of [...OWN, 'speck-0001-review']) assert.equal(fs.existsSync(path.join(tmp(), f)), false, `${f} is removed`);
});

test('0181 AC1: speck cancel removes every file and folder in /tmp starting speck-<id>-', () => {
  const dir = cancelRepo();
  scratch();
  const res = runIn(dir, 'cancel', '1', 'Not needed');
  assert.equal(res.status, 0, res.stderr);
  for (const f of [...OWN, 'speck-0001-review']) assert.equal(fs.existsSync(path.join(tmp(), f)), false, `${f} is removed`);
});

test('0181 AC2: a ship that refuses leaves the scratch files', () => {
  const r = shipRepo({ test: 'false' });
  scratch();
  const before = left().sort();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0, 'the ship is refused');
  assert.equal(r.statusIn(r.wt), 'approved');
  assert.deepEqual(left().sort(), before);
});

test('0181 AC2: a cancel that refuses leaves the scratch files', () => {
  const dir = cancelRepo();
  scratch();
  const before = left().sort();
  assert.notEqual(runIn(dir, 'cancel', '1').status, 0, 'no reason, so refused');
  assert.deepEqual(left().sort(), before);
});

test('0181 AC3: files for other tickets are left alone, including ids starting with the same digits', () => {
  const dir = cancelRepo();
  scratch();
  assert.equal(runIn(dir, 'cancel', '1', 'Not needed').status, 0);
  assert.deepEqual(left().sort(), [...OTHERS].sort());
  const r = shipRepo();
  assert.equal(r.run('ship', '1').status, 0);
  assert.deepEqual(left().sort(), [...OTHERS].sort());
});

// Root can remove anything, so there's no file it can't remove.
const asRoot = process.getuid?.() === 0;

test('0181 AC4: a file that can\'t be removed doesn\'t stop the cancel or the ship, and is mentioned in one line', { skip: asRoot }, () => {
  for (const cmd of ['cancel', 'ship']) {
    const r = cmd === 'ship' ? shipRepo() : null;
    const dir = r ? r.dir : cancelRepo();
    scratch();
    // Two folders whose contents can't be removed: still one line between them.
    const stuck = ['speck-0001-stuck', 'speck-0001-stuck2'].map(f => path.join(tmp(), f));
    for (const s of stuck) { fs.mkdirSync(s); fs.writeFileSync(path.join(s, 'f'), 'x\n'); fs.chmodSync(s, 0o500); }
    try {
      const res = cmd === 'ship' ? r.run('ship', '1') : runIn(dir, 'cancel', '1', 'Not needed');
      assert.equal(res.status, 0, `${cmd}: ${res.stderr}`);
      const lines = (res.stdout + res.stderr).split('\n').filter(l => /speck-0001-stuck/.test(l));
      assert.equal(lines.length, 1, `${cmd}: one line mentions them:\n${res.stdout}${res.stderr}`);
      assert.match(lines[0], /speck-0001-stuck\b.*speck-0001-stuck2|speck-0001-stuck2.*speck-0001-stuck\b/);
      assert.doesNotMatch(res.stderr, /at .*\.mjs:\d+/, 'no stack trace');
      assert.equal(fs.existsSync(path.join(tmp(), 'speck-0001-tests.txt')), false, `${cmd}: the rest are still removed`);
    } finally { for (const s of stuck) { fs.chmodSync(s, 0o700); fs.rmSync(s, { recursive: true, force: true }); } }
  }
});

test('0181 AC1: a scratch entry that links elsewhere is removed without touching what it links to', () => {
  const dir = cancelRepo();
  const target = fs.mkdtempSync(path.join(tmp(), 'kept-'));
  fs.writeFileSync(path.join(target, 'keep.txt'), 'x\n');
  fs.symlinkSync(target, path.join(tmp(), 'speck-0001-link'));
  assert.equal(runIn(dir, 'cancel', '1', 'Not needed').status, 0);
  assert.equal(fs.existsSync(path.join(tmp(), 'speck-0001-link')), false, 'the link is removed');
  assert.equal(fs.readFileSync(path.join(target, 'keep.txt'), 'utf8'), 'x\n', 'what it links to is kept');
});
