import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, ROOT, env, good, fm, runRepo, startRun, until, killAll, stopRun } from './support/run.mjs';
import { waitingLine } from './support/ready.mjs';

// ---------- 0108: build only tickets whose ready status is committed ----------

const wait = ms => new Promise(res => setTimeout(res, ms));
const count = (text, re) => (text.match(new RegExp(re.source, `${re.flags.replace('g', '')}g`)) || []).length;

// A repo on main with speck installed and committed, and one draft ticket that passes lint, not yet committed.
function setRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-ready-')));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  g('add', '-A'); g('commit', '-qm', 'base');
  const rel = run('new', 'Export bookings').stdout.trim();
  const file = path.join(dir, rel);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  const head = () => g('rev-parse', 'HEAD').stdout.trim();
  const show = (...a) => g('show', '--format=%s', '--name-only', '--no-renames', ...a).stdout.trim().split('\n').filter(Boolean);
  return { dir, run, g, rel: rel.split(path.sep).join('/'), file, head, show };
}

test('0108 AC1: speck set <id> status ready commits only that ticket, as speck(<id>): ready', () => {
  const r = setRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'someone else\'s work\n');
  fs.writeFileSync(path.join(r.dir, 'staged.txt'), 'staged by someone else\n');
  r.g('add', 'staged.txt');
  const res = r.run('set', '1', 'status', 'ready');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.deepEqual(r.show('HEAD'), ['speck(0001): ready', r.rel]);
  assert.match(r.g('show', `HEAD:${r.rel}`).stdout, /^status: ready/m);
  const status = r.g('status', '--porcelain').stdout;
  assert.match(status, /^A  staged\.txt$/m, 'what was staged stays staged and uncommitted');
  assert.match(status, /^\?\? other\.txt$/m, 'other files are left alone');
  assert.doesNotMatch(status, /0001/, 'the ticket is committed');
});

test('0108 AC1: setting ready commits the same ticket text the panel would', () => {
  const r = setRepo();
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(r.g('show', `HEAD:${r.rel}`).stdout, fs.readFileSync(r.file, 'utf8'));
});

test('0108 AC1: off the base branch, speck set status ready refuses and changes nothing', () => {
  const r = setRepo();
  r.g('checkout', '-q', '-b', 'elsewhere');
  const before = fs.readFileSync(r.file, 'utf8'), head = r.head();
  const res = r.run('set', '1', 'status', 'ready');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /elsewhere/);
  assert.match(res.stderr, /main/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(fs.readFileSync(r.file, 'utf8'), before, 'the ticket is unchanged');
  assert.equal(r.head(), head, 'nothing committed');
  assert.match(r.g('status', '--porcelain').stdout, /^\?\? speck\/tickets\/0001-export-bookings\.md$/m, 'still uncommitted');
});

test('0108 AC1: on a detached HEAD, speck set status ready refuses and changes nothing', () => {
  const r = setRepo();
  r.g('checkout', '-q', '--detach');
  const before = fs.readFileSync(r.file, 'utf8'), head = r.head();
  const res = r.run('set', '1', 'status', 'ready');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /not on a branch/);
  assert.equal(fs.readFileSync(r.file, 'utf8'), before);
  assert.equal(r.head(), head);
});

test('0108 AC1: a ticket set ready from speck/tickets/done/ is committed as moved', () => {
  const r = setRepo();
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const filed = 'speck/tickets/done/' + path.basename(r.rel);
  r.g('add', 'speck'); r.g('commit', '-qm', 'filed');
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  const files = r.show('HEAD');
  assert.equal(files[0], 'speck(0001): ready');
  assert.deepEqual(files.slice(1).sort(), [filed, r.rel].sort());
  assert.equal(r.g('status', '--porcelain').stdout, '', 'nothing left over');
});

test('0108 AC1: when the commit fails, the ticket is put back as it was', () => {
  const r = setRepo();
  // A pre-commit hook that always fails.
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\necho "hook says no" >&2\nexit 1\n');
  fs.chmodSync(hook, 0o755);
  const before = fs.readFileSync(r.file, 'utf8'), head = r.head();
  const res = r.run('set', '1', 'status', 'ready');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /commit/i);
  assert.match(res.stderr, /hook says no/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(fs.readFileSync(r.file, 'utf8'), before, 'still a draft');
  assert.equal(r.head(), head);
  assert.match(r.g('status', '--porcelain').stdout, /^\?\? speck\/tickets\/0001-export-bookings\.md$/m, 'out of the index again');
});

test('0108 AC1: setting ready again on a ticket already committed as ready commits nothing and succeeds', () => {
  const r = setRepo();
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  const head = r.head();
  const res = r.run('set', '1', 'status', 'ready');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.head(), head);
});

test('0108 AC1: when the commit of a ticket moved back from done/ fails, it goes back to done/ as it was', () => {
  const r = setRepo();
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const filed = path.join(r.dir, 'speck', 'tickets', 'done', path.basename(r.rel));
  r.g('add', 'speck'); r.g('commit', '-qm', 'filed');
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(hook, 0o755);
  const before = fs.readFileSync(filed, 'utf8'), head = r.head();
  assert.notEqual(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(fs.readFileSync(filed, 'utf8'), before);
  assert.equal(fs.existsSync(r.file), false, 'no copy left in speck/tickets/');
  assert.equal(r.head(), head);
  assert.equal(r.g('status', '--porcelain').stdout, '', 'the index is as it was');
});

test('0108 AC1: other speck set changes still don\'t commit', () => {
  const r = setRepo();
  r.g('add', r.rel); r.g('commit', '-qm', 'ticket');
  const head = r.head();
  for (const args of [['priority', '2'], ['title', 'Export bookings as CSV'], ['status', 'blocked'], ['status', 'draft']])
    assert.equal(r.run('set', '1', ...args).status, 0, args.join(' '));
  assert.equal(r.head(), head, 'no commit');
  assert.match(r.g('status', '--porcelain').stdout, /^ M speck\/tickets\/0001/m);
});

// ---------- AC2: speck run launches only tickets ready in the base branch's latest commit ----------

test('0108 AC2: a ticket set ready but not committed isn\'t launched, and speck run says once that it\'s waiting', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: draft$/m, 'status: ready'));
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => waitingLine.test(run.out())), run.out());
    await wait(600); // several polls
    assert.deepEqual(r.calls(), [], 'not launched');
    assert.equal(count(run.out(), waitingLine), 1, run.out());
    // Once it's committed, it's launched.
    r.g('commit', '-qam', 'speck(0001): ready');
    assert.ok(await until(() => r.calls().length === 1), run.out());
    assert.deepEqual(r.calls()[0].args.slice(0, 1), ['0001']);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0108 AC2: a ready ticket that was never committed isn\'t launched', async () => {
  const r = runRepo({ tickets: [] });
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0002-new.md'), `---\n${fm({ id: '"0002"' })}\n---\n${good}`);
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /0002[^\n]*commit/i.test(run.out())), run.out());
    await wait(400);
    assert.deepEqual(r.calls(), []);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0108 AC2: a ticket committed as ready on the base branch is launched as before', async () => {
  const r = runRepo();
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    assert.doesNotMatch(run.out(), waitingLine);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0108 AC2: a ticket ready only in an uncommitted change on top of a committed draft is held even after other commits', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', {}]] });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: draft$/m, 'status: ready'));
  fs.writeFileSync(path.join(r.dir, 'unrelated.txt'), 'x\n');
  r.g('add', 'unrelated.txt'); r.g('commit', '-qm', 'unrelated');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => r.calls().length === 1), run.out());
    await wait(400);
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002'], 'only the committed one');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

// ---------- AC3: the build skill keeps builders out of the main checkout ----------

test('0108 AC3: the build skill says never to commit, stage or change files in the main checkout, and to stop when speck start refuses', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8').replace(/\s+/g, ' ');
  assert.match(skill, /[Nn]ever commit, stage or change (any )?files in the main checkout/);
  assert.match(skill, /[Ii]f `speck start` refuses a `ready` ticket here, report its reason in plain words and stop\. Don't commit the ticket, switch branches or change anything else to get past it/);
});
