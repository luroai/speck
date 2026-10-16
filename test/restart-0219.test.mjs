// 0219: a ticket that speck stop blocked before its build had started it can be started again with speck start.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, gitEnv, runRepo } from './support/run.mjs';
import { stopBuild } from '../scripts/run.mjs';

Object.assign(process.env, gitEnv); // stopBuild commits in this process

function repo(status, worktrees = 'true') {
  const r = runRepo({ tickets: [['0001', { status }]], worktrees });
  const start = (dir = r.dir) => spawnSync(process.execPath, [CLI, 'start', '0001'], { cwd: dir, encoding: 'utf8', env });
  const ticket = dir => fs.readFileSync(path.join(dir, 'speck', 'tickets', '0001-t.md'), 'utf8');
  const branches = () => r.g('for-each-ref', '--format=%(refname:short)', 'refs/heads/speck/');
  return { ...r, start, ticket, branches };
}

// A build of 0001 as speck run records one: a process leading its own group, with a record naming it.
async function fakeBuild(dir) {
  const c = spawn(process.execPath, ['-e', "console.log('ready'); setInterval(() => {}, 1000);"], { detached: true, stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise(res => c.stdout.once('data', res));
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ pid: c.pid, session: 's-0219' }));
  return c;
}
async function stop(dir) {
  const c = await fakeBuild(dir);
  const lines = [];
  try { stopBuild(dir, ['0001'], l => lines.push(l)); } finally { try { process.kill(-c.pid, 'SIGKILL'); } catch {} }
  return lines.join('\n');
}

for (const worktrees of ['true', 'false']) {
  test(`0219 AC1: speck start starts a blocked ticket with no branch as it would a ready one (worktrees ${worktrees})`, () => {
    const r = repo('blocked', worktrees);
    const res = r.start();
    assert.equal(res.status, 0, res.stderr);
    const branch = 'speck/0001-t';
    assert.equal(r.branches(), branch, 'its branch is made');
    const at = res.stdout.trim().split('\n').pop();
    if (worktrees === 'true') {
      assert.notEqual(fs.realpathSync(at), fs.realpathSync(r.dir), 'in its own worktree');
      assert.ok(r.g('worktree', 'list', '--porcelain').includes(`branch refs/heads/${branch}`), 'the worktree has the branch');
    }
    assert.match(r.ticket(at), /^status: building\b/m);
    assert.equal(spawnSync('git', ['log', '-1', '--format=%s'], { cwd: at, encoding: 'utf8' }).stdout.trim(), 'speck(0001): start');
  });
}

test('0219 AC1: a ticket speck stop blocked before its build started starts again, and the time it was blocked is counted as waiting', async () => {
  const r = repo('ready', 'true');
  await stop(r.dir);
  assert.match(r.ticket(r.dir), /^status: blocked\b/m);
  const res = r.start();
  assert.equal(res.status, 0, res.stderr);
  const t = r.ticket(res.stdout.trim().split('\n').pop());
  assert.match(t, /^status: building\b/m);
  assert.match(t, /^blocked_at: *(""|)$/m, 'it is no longer timed as blocked');
});

test('0219 AC2: speck start on a blocked ticket that has a branch still refuses, saying where to carry on', () => {
  const r = repo('ready', 'true');
  const first = r.start();
  assert.equal(first.status, 0, first.stderr);
  const wt = first.stdout.trim().split('\n').pop();
  assert.equal(spawnSync(process.execPath, [CLI, 'set', '0001', 'status', 'blocked'], { cwd: wt, encoding: 'utf8', env }).status, 0);
  spawnSync('git', ['commit', '-qam', 'blocked'], { cwd: wt, env });
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).stdout;
  const res = r.start();
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /already started/);
  assert.ok(res.stderr.includes(wt), res.stderr);
  assert.equal(spawnSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).stdout, head, 'nothing is committed');
  assert.match(r.ticket(wt), /^status: blocked\b/m);
});

test('0219 AC3: speck stop on a build that had not started its ticket blocks it and says /speck-build starts it again', async () => {
  const r = repo('ready', 'true');
  const said = await stop(r.dir);
  assert.match(r.ticket(r.dir), /^status: blocked\b/m, 'still blocked (0072 AC2)');
  assert.match(said, /before it started/);
  assert.match(said, /\/speck-build 0001 starts it again/);
  assert.doesNotMatch(said, /branch and work kept/);
});

test('0219 AC3: speck stop on a build that had started its ticket still says its branch and work were kept', async () => {
  const r = repo('ready', 'true');
  assert.equal(r.start().status, 0);
  const said = await stop(r.dir);
  assert.match(said, /with its branch and work kept/);
  assert.doesNotMatch(said, /before it started/);
});

for (const status of ['draft', 'building', 'reviewing', 'approved', 'done', 'cancelled']) {
  test(`0219 AC4: speck start still refuses a ${status} ticket with no branch`, () => {
    const r = repo(status, 'true');
    const head = r.g('rev-parse', 'HEAD');
    const res = r.start();
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, new RegExp(`"${status}", not "ready"`));
    assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(r.branches(), '', 'no branch');
    assert.equal(r.g('rev-parse', 'HEAD'), head, 'no commit');
  });
}
