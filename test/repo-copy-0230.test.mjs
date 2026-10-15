import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// A `git` ahead of the real one on PATH that logs each call's arguments, set before the helpers are imported, as
// some of them copy the environment when they load.
const realGit = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-gitlog-'));
const LOG = path.join(bin, 'git.log');
fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\necho "$*" >> "${LOG}"\nexec "${realGit}" "$@"\n`, { mode: 0o755 });
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;

const speck = await import('./support/speck.mjs');
const ship = await import('./support/ship.mjs');
const run = await import('./support/run.mjs');
const panel = await import('./support/panel.mjs');

const calls = () => fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean) : [];
// What making a repo ran: the git calls set up from scratch would make (init and commit), and whether the speck CLI ran.
function made(make) {
  const before = calls().length;
  const r = make();
  const git = calls().slice(before);
  return { r, inits: git.filter(c => /^(-c \S+ )*init\b/.test(c)).length, commits: git.filter(c => /^(-c \S+ )*commit\b/.test(c)).length };
}
const head = dir => spawnSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
const clean = dir => spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }).stdout;

const KINDS = {
  reviewRepo: () => speck.reviewRepo(),
  subagentRepo: () => speck.subagentRepo(),
  commandRepo: () => speck.commandRepo(),
  startRepo: () => speck.startRepo(),
  doneRepo: () => speck.doneRepo(),
  'speck.mjs shipRepo': () => speck.shipRepo(),
  'ship.mjs shipRepo': () => ship.shipRepo(),
  'ship.mjs shipRepo without a worktree': () => ship.shipRepo({ worktree: false }),
  runRepo: () => run.runRepo(),
  'runRepo with a command of its own': () => run.runRepo({ command: '/nonexistent/builder {id}' }),
  'ship.mjs shipRepo whose test command names its main checkout': () => ship.shipRepo({ test: 'cd {main} && true' }),
  panelRepo: () => panel.panelRepo(),
};

for (const [name, make] of Object.entries(KINDS)) {
  test(`0230 AC1: ${name} sets up its first repo and copies it for the next, with no git init or setup commit`, () => {
    const first = made(make);
    const second = made(make);
    assert.ok(first.inits + first.commits > 0 || head(first.r.dir), `${name}: the first repo is set up`);
    assert.equal(second.inits, 0, `${name}: no git init for the copy`);
    assert.equal(second.commits, 0, `${name}: no setup commit for the copy`);
    assert.notEqual(second.r.dir, first.r.dir);
    assert.equal(head(second.r.dir), head(first.r.dir), `${name}: the copy has the same commits`);
    assert.equal(clean(second.r.dir), clean(first.r.dir), `${name}: the copy's working tree matches`);
  });
}

test('0230 AC1: repos asked for with different options are set up separately', () => {
  const a = speck.reviewRepo();
  const b = made(() => speck.reviewRepo({ ticketFields: 'status: building' }));
  assert.ok(b.inits > 0 && b.commits > 0);
  assert.notEqual(head(b.r.dir), head(a.dir));
  assert.match(fs.readFileSync(b.r.ticketFile, 'utf8'), /^status: building\b/m);
});

test('0230 AC2: a change in one copy never shows in another, including its fake reviewer and builder logs', () => {
  const a = speck.reviewRepo(), b = speck.reviewRepo();
  fs.writeFileSync(path.join(a.dir, 'a.txt'), 'mine\n');
  a.git('commit', '-qam', 'mine');
  assert.equal(fs.readFileSync(path.join(b.dir, 'a.txt'), 'utf8'), 'change\n');
  assert.notEqual(head(a.dir), head(b.dir));
  assert.equal(b.git('log', '--format=%s', '-1').stdout.trim(), 'work');

  const c1 = speck.commandRepo(), c2 = speck.commandRepo();
  spawnSync(process.execPath, [speck.CLI, 'review', '1'], { cwd: c1.dir, encoding: 'utf8' });
  assert.equal(c1.calls().length, 1);
  assert.equal(c2.calls().length, 0);
  assert.equal(c1.calls()[0].cwd, fs.realpathSync(c1.dir));

  const r1 = run.runRepo(), r2 = run.runRepo();
  assert.equal(run.runOnce(r1.dir).status, 0);
  assert.ok(r1.calls().length >= 1);
  assert.equal(r2.calls().length, 0);
});

test('0230 AC2: {main} in a ship repo\'s test command is each copy\'s own main checkout, from its worktree', () => {
  const a = ship.shipRepo({ test: 'printf x > {main}/marker.txt' }), b = ship.shipRepo({ test: 'printf x > {main}/marker.txt' });
  const cmd = fs.readFileSync(path.join(a.wt, 'speck', 'config.yml'), 'utf8').match(/^  test: (.*)$/m)[1];
  const res = spawnSync('sh', ['-c', JSON.parse(cmd)], { cwd: a.wt, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(fs.existsSync(path.join(a.dir, 'marker.txt')));
  assert.equal(fs.existsSync(path.join(a.wt, 'marker.txt')), false);
  assert.equal(fs.existsSync(path.join(b.dir, 'marker.txt')), false);
});

let earlier;
test('0230 AC2: copies made in one test', () => {
  earlier = [speck.reviewRepo().dir, ship.shipRepo().dir, run.runRepo().dir, speck.startRepo().dir];
  for (const d of earlier) assert.ok(fs.existsSync(d));
});
test('0230 AC2: are removed once that test ends, while later copies still work', () => {
  for (const d of earlier) assert.equal(fs.existsSync(d), false, d);
  const r = speck.startRepo();
  assert.equal(r.run('start', '1').status, 0);
});
