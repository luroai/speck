import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo } from './support/run.mjs';

const FIELDS = ['level', 'builder', 'builder_model', 'builder_effort', 'reviewer', 'reviewer_model', 'reviewer_effort'];

function repo(status = 'draft') {
  const r = runRepo({ tickets: [['0001', { status }]], worktrees: 'true' });
  const run = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
  return { ...r, run, ticket: path.join(r.dir, 'speck', 'tickets', '0001-t.md') };
}

test('0716 AC1: speck set level "" writes level: "" and says it is blank', () => {
  const r = repo();
  assert.equal(r.run(r.dir, 'set', '0001', 'level', 'quick').status, 0);
  const res = r.run(r.dir, 'set', '0001', 'level', '');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /blank/);
  assert.match(fs.readFileSync(r.ticket, 'utf8'), /^level: ""/m);
});

test('0716 AC2: the builder and reviewer fields blank too', () => {
  const r = repo();
  for (const f of FIELDS) {
    const res = r.run(r.dir, 'set', '0001', f, '');
    assert.equal(res.status, 0, `${f}: ${res.stderr}`);
    assert.match(res.stdout, /blank/);
    assert.match(fs.readFileSync(r.ticket, 'utf8'), new RegExp(`^${f}: ""`, 'm'));
  }
});

test('0716 AC3: blanking is refused for a ticket being built', () => {
  const r = repo('ready');
  assert.equal(r.run(r.dir, 'start', '0001').status, 0);
  const before = fs.readFileSync(r.ticket, 'utf8');
  const res = r.run(r.dir, 'set', '0001', 'level', '');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /being built/);
  assert.equal(fs.readFileSync(r.ticket, 'utf8'), before);
});

test('0716 AC4: title and status still give the usage message with ""', () => {
  const r = repo();
  for (const f of ['title', 'status']) {
    const res = r.run(r.dir, 'set', '0001', f, '');
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /Usage: speck set/);
  }
});
