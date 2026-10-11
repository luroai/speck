import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo } from './support/run.mjs';
import { ROOT } from './support/speck.mjs';
import { parseTicket } from '../scripts/speck.mjs';

// ---------- 0114: refuse edits to a ticket that's being built ----------

// A repo with speck installed and ticket 0001 ready and committed, building in worktrees as speck start does by default.
function buildRepo() {
  const r = runRepo({ tickets: [['0001', { status: 'ready' }]], worktrees: 'true' });
  const run = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
  const ticket = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  const snapshot = () => ({
    head: r.g('rev-parse', 'HEAD'),
    status: r.g('status', '--porcelain', '--untracked-files=all'),
    ticket: fs.readFileSync(ticket, 'utf8'),
  });
  const start = () => {
    const res = run(r.dir, 'start', '0001');
    assert.equal(res.status, 0, res.stderr);
    return fs.realpathSync(res.stdout.trim().split('\n').pop());
  };
  return { ...r, run, ticket, snapshot, start };
}

function refuses(r, args) {
  const before = r.snapshot();
  const res = r.run(r.dir, ...args);
  assert.notEqual(res.status, 0, res.stdout);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.deepEqual(r.snapshot(), before, 'nothing changed in this checkout');
  return res.stderr;
}

for (const status of ['building', 'reviewing', 'blocked', 'approved']) {
  test(`0114 AC1: speck set from the base checkout refuses while the ticket is ${status} in its worktree`, () => {
    const r = buildRepo();
    const wt = r.start();
    if (status !== 'building') assert.equal(r.run(wt, 'set', '0001', 'status', status).status, 0);
    const err = refuses(r, ['set', '1', 'priority', '2']);
    assert.match(err, /0001/);
    assert.match(err, /being built/);
    assert.ok(err.includes(wt), `names the folder it's being built in: ${err}`);
    assert.match(err, /wait/i);
    assert.match(err, /ships/);
    assert.match(err, /change it there/);
  });
}

test('0114 AC1: setting a status or title from the base checkout refuses too', () => {
  const r = buildRepo();
  r.start();
  refuses(r, ['set', '0001', 'status', 'draft']);
  refuses(r, ['set', '0001', 'title', 'Something else']);
});

test('0114 AC1: the ticket\'s copy in its worktree is left as it was', () => {
  const r = buildRepo();
  const wt = r.start();
  const file = path.join(wt, 'speck', 'tickets', '0001-t.md');
  const before = fs.readFileSync(file, 'utf8');
  refuses(r, ['set', '0001', 'priority', '2']);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('0114 AC2: speck set in the ticket\'s own worktree works as before', () => {
  const r = buildRepo();
  const wt = r.start();
  for (const [key, value] of [['status', 'reviewing'], ['priority', '2'], ['status', 'blocked'], ['status', 'approved']]) {
    const res = r.run(wt, 'set', '0001', key, value);
    assert.equal(res.status, 0, res.stderr);
    assert.equal(String(parseTicket(fs.readFileSync(path.join(wt, 'speck', 'tickets', '0001-t.md'), 'utf8')).fm[key]), value);
  }
});

test('0114 AC2: speck set from a folder inside the ticket\'s worktree works too', () => {
  const r = buildRepo();
  const wt = r.start();
  const res = r.run(path.join(wt, 'speck'), 'set', '0001', 'priority', '4');
  assert.equal(res.status, 0, res.stderr);
});

for (const status of ['building', 'reviewing', 'blocked', 'approved']) {
  test(`0114 AC3: speck cancel from the base checkout refuses while the ticket is ${status} in its worktree`, () => {
    const r = buildRepo();
    const wt = r.start();
    if (status !== 'building') assert.equal(r.run(wt, 'set', '0001', 'status', status).status, 0);
    const err = refuses(r, ['cancel', '0001', 'Not needed']);
    assert.match(err, /0001/);
    assert.match(err, /being built/);
    assert.ok(err.includes(wt), `names the folder it's being built in: ${err}`);
    assert.match(err, /wait/i);
    assert.match(err, /ships/);
    assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-t.md')), false, 'not filed away');
  });
}

test('0114 AC4: the speck-ticket skill says never to edit a ticket that\'s being built', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ticket', 'SKILL.md'), 'utf8');
  const line = skill.split('\n').find(l => /being built/.test(l));
  assert.ok(line, 'a line about tickets being built');
  assert.match(line, /[Nn]ever edit/);
  for (const s of ['building', 'reviewing', 'blocked', 'approved']) assert.match(line, new RegExp(s));
  assert.match(line, /new ticket/);
  assert.match(line, /ships/);
});

test('0114 AC5: a ticket with no branch can be set and cancelled as before', () => {
  const r = buildRepo();
  assert.equal(r.run(r.dir, 'set', '0001', 'priority', '2').status, 0);
  const res = r.run(r.dir, 'cancel', '0001', 'Not needed');
  assert.equal(res.status, 0, res.stderr);
});

test('0114 AC5: a ticket whose branch exists but isn\'t checked out anywhere can be changed as before', () => {
  const r = buildRepo();
  const wt = r.start();
  r.g('worktree', 'remove', '--force', wt);
  assert.match(r.g('branch', '--list', 'speck/0001-*'), /speck\/0001-t/, 'the branch is still there');
  const res = r.run(r.dir, 'set', '0001', 'priority', '2');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(String(parseTicket(fs.readFileSync(r.ticket, 'utf8')).fm.priority), '2');
});

test('0114 AC5: other tickets can be changed while one is being built', () => {
  const r = runRepo({ tickets: [['0001', { status: 'ready' }], ['0002', {}]], worktrees: 'true' });
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: r.dir, encoding: 'utf8', env });
  assert.equal(run('start', '0001').status, 0);
  const res = run('set', '0002', 'priority', '2');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(run('cancel', '0002', 'Not needed').status, 0);
});

test('0114 AC5: speck set still works in a folder that isn\'t a git checkout', () => {
  const r = buildRepo();
  const bare = fs.mkdtempSync(path.join(path.dirname(r.dir), 'speck-nogit-'));
  fs.cpSync(path.join(r.dir, 'speck'), path.join(bare, 'speck'), { recursive: true });
  const res = r.run(bare, 'set', '0001', 'priority', '2');
  assert.equal(res.status, 0, res.stderr);
});
