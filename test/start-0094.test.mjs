import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, killAll, stopRun } from './support/run.mjs';

// ---------- 0094: refuse to start a ticket until what it waits on has shipped ----------

// A repo with speck installed and these tickets committed, building in worktrees as speck start does by default.
function startRepo(tickets) {
  const r = runRepo({ tickets, worktrees: 'true' });
  const start = id => spawnSync(process.execPath, [CLI, 'start', id], { cwd: r.dir, encoding: 'utf8', env });
  const snapshot = () => ({
    head: r.g('rev-parse', 'HEAD'),
    branches: r.g('branch', '--format=%(refname:short)'),
    worktrees: r.g('worktree', 'list', '--porcelain'),
    status: r.g('status', '--porcelain'),
    ticket: fs.readFileSync(path.join(r.dir, 'speck', 'tickets', '0001-t.md'), 'utf8'),
  });
  return { ...r, start, snapshot };
}

function refuses(r, pattern) {
  const before = r.snapshot();
  const res = r.start('0001');
  assert.notEqual(res.status, 0, res.stdout);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  for (const p of [].concat(pattern)) assert.match(res.stderr, p);
  assert.deepEqual(r.snapshot(), before, 'no branch, worktree, status change or commit');
  assert.equal(fs.existsSync(`${r.dir}.worktrees`), false, 'no worktree folder');
  return res.stderr;
}

test('0094 AC1: speck start refuses while a ticket in after: isn\'t done, naming each with its status', () => {
  const r = startRepo([['0001', { after: '["0086", "0087"]' }], ['0086', { status: 'approved' }], ['0087', { status: 'building' }]]);
  const err = refuses(r, [/0086 \(approved\)/, /0087 \(building\)/, /shipped/]);
  assert.match(err, /0001/);
});

test('0094 AC1: one done ticket and one still waiting refuses, naming only the one still waiting', () => {
  const r = startRepo([['0001', { after: '["0086", "0087"]' }], ['0086', { status: 'done' }], ['0087', { status: 'ready' }]]);
  const err = refuses(r, [/0087 \(ready\)/, /shipped/]);
  assert.doesNotMatch(err, /0086/);
});

test('0094 AC1: an id written as a number in after: is still found', () => {
  const r = startRepo([['0001', { after: '[86]' }], ['0086', { status: 'reviewing' }]]);
  refuses(r, /0086 \(reviewing\)/);
});

test('0094 AC2: a cancelled ticket in after: refuses, saying it must come out of after:', () => {
  const r = startRepo([['0001', { after: '["0086"]' }], ['0086', { status: 'cancelled' }]]);
  refuses(r, [/0086/, /cancelled/, /after:/]);
});

test('0094 AC2: an id in after: that matches no ticket refuses, saying it must come out of after:', () => {
  const r = startRepo([['0001', { after: '["0099", "constructor"]' }]]);
  const err = refuses(r, [/0099/, /constructor/, /no ticket/, /after:/]);
  assert.doesNotMatch(err, /shipped/, 'nothing to wait for, only ids to take out');
});

test('0094 AC1 AC2: waiting and cancelled tickets are named together', () => {
  const r = startRepo([['0001', { after: '["0086", "0087"]' }], ['0086', { status: 'approved' }], ['0087', { status: 'cancelled' }]]);
  refuses(r, [/0086 \(approved\)/, /shipped/, /0087/, /cancelled/, /after:/]);
});

test('0094 AC3: a ticket whose after: tickets are all done starts as before', () => {
  const r = startRepo([['0001', { after: '["0086"]' }], ['0086', { status: 'done' }]]);
  const res = r.start('0001');
  assert.equal(res.status, 0, res.stderr);
  const at = res.stdout.trim().split('\n').pop();
  assert.match(fs.readFileSync(path.join(at, 'speck', 'tickets', '0001-t.md'), 'utf8'), /^status: building/m);
  assert.equal(spawnSync('git', ['log', '-1', '--format=%s'], { cwd: at, encoding: 'utf8' }).stdout.trim(), 'speck(0001): start');
});

test('0094 AC3: a ticket with no after: tickets starts as before', () => {
  for (const after of [null, '[]']) {
    const r = startRepo([['0001', after ? { after } : {}]]);
    const res = r.start('0001');
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /Started 0001/);
  }
});

test('0094 AC4: speck run launches a ticket only once its after: tickets are done', async () => {
  const r = runRepo({ tickets: [
    ['0001', { after: '["0002"]' }], ['0002', { status: 'approved' }],
    ['0003', { after: '["0004"]' }], ['0004', { status: 'done' }],
  ] });
  const run = startRun(r.dir, { FAKE_MS: '100' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    assert.ok(await until(() => /0003[^\n]*exit/i.test(run.out())), run.out());
    await new Promise(res => setTimeout(res, 400));
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0003'], 'never the ticket waiting on an approved one');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});
