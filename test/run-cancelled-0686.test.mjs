import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { statusData, loadConfig, parseTicket } from '../scripts/speck.mjs';
import { afterWait } from '../scripts/built-on.mjs';
import { cancelledQueue } from '../scripts/cancelled-build.mjs';
import { builtOnRepo, speckIn, gitIn } from './support/built-on.mjs';
import { runRepo, startRun, stopRun, waitFor, CLI, gitEnv } from './support/run.mjs';

Object.assign(process.env, gitEnv); // cancelOnBase commits in this process

// ---------- 0686: bring a ticket cancelled during its build onto the base branch ----------

const REASON = 'No longer needed: "0003" covers it';
const doneFile = dir => path.join(dir, 'speck', 'tickets', 'done', '0002-t.md');
const liveFile = dir => path.join(dir, 'speck', 'tickets', '0002-t.md');

// 0002 is cancelled on its own branch during its build, and its worktree removed, as 0664 was. 0001 waits for it.
function cancelledOnBranch({ keepWorktree = false } = {}) {
  const r = builtOnRepo({ status: 'building' });
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0003-t.md'), fs.readFileSync(liveFile(r.dir), 'utf8').replace('id: "0002"', 'id: "0003"'));
  gitIn(r.dir, 'add', 'speck/tickets/0003-t.md');
  gitIn(r.dir, 'commit', '-qm', 'another ticket');
  const res = speckIn(r.second, 'cancel', '0002', REASON);
  assert.equal(res.status, 0, res.stderr);
  gitIn(r.second, 'add', '-A', '--', 'speck/tickets');
  gitIn(r.second, 'commit', '-qm', 'speck(0002): cancelled');
  const onBranch = parseTicket(gitIn(r.second, 'show', 'HEAD:speck/tickets/done/0002-t.md')).fm;
  if (!keepWorktree) gitIn(r.dir, 'worktree', 'remove', '--force', r.second);
  return { ...r, onBranch };
}

const queue = r => {
  const said = [];
  return { said, q: cancelledQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), say: s => said.push(s) }) };
};

test('0686 AC1: a build that ends with its ticket cancelled on its branch cancels it on the base branch, as speck cancel does', () => {
  const r = cancelledOnBranch();
  assert.equal(parseTicket(fs.readFileSync(liveFile(r.dir), 'utf8')).fm.status, 'ready', 'the base branch still has it ready');
  const before = gitIn(r.dir, 'rev-parse', 'HEAD');
  const { said, q } = queue(r);
  q.ended('0002');
  assert.equal(fs.existsSync(liveFile(r.dir)), false, 'moved out of speck/tickets/');
  const fm = parseTicket(fs.readFileSync(doneFile(r.dir), 'utf8')).fm;
  assert.equal(fm.status, 'cancelled');
  assert.equal(fm.cancel_reason, REASON);
  assert.equal(fm.cancel_reason, r.onBranch.cancel_reason);
  assert.equal(String(fm.cancelled), String(r.onBranch.cancelled));
  assert.equal(gitIn(r.dir, 'rev-parse', 'HEAD~1'), before, 'one commit');
  assert.match(gitIn(r.dir, 'log', '-1', '--format=%s'), /^speck\(0002\): cancelled/);
  assert.deepEqual(gitIn(r.dir, 'show', '--no-renames', '--name-only', '--format=', 'HEAD').split('\n').sort(), ['speck/tickets/0002-t.md', 'speck/tickets/done/0002-t.md']);
  assert.equal(gitIn(r.dir, 'status', '--porcelain', '--', 'speck/tickets'), '', 'nothing left uncommitted');
  assert.match(said.join('\n'), /0002.*cancelled/);
});

test('0686 AC1: it commits only that ticket, leaving anything else staged or changed as it was', () => {
  const r = cancelledOnBranch();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'staged\n');
  gitIn(r.dir, 'add', 'other.txt');
  const third = path.join(r.dir, 'speck', 'tickets', '0003-t.md');
  fs.appendFileSync(third, '\nedited\n');
  const { q } = queue(r);
  q.ended('0002');
  assert.equal(gitIn(r.dir, 'show', '--name-only', '--format=', 'HEAD').includes('other.txt'), false);
  assert.match(gitIn(r.dir, 'status', '--porcelain'), /^A {2}other\.txt$/m);
  assert.match(gitIn(r.dir, 'status', '--porcelain'), /^ M speck\/tickets\/0003-t\.md$/m);
});

test('0686 AC2: after that, a ready ticket with it in after: is reported as cancelled, not as waiting for it', () => {
  const r = cancelledOnBranch();
  queue(r).q.ended('0002');
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.status, 'ready');
  const why = afterWait(t);
  assert.match(why, /Ticket 0001's after: lists 0002, which was cancelled\. Take it out of after: before the ticket can start\./);
  assert.doesNotMatch(why, /waiting for/);
  // The same words speck start refuses it with.
  assert.match(speckIn(r.dir, 'start', '0001').stderr, /lists 0002, which was cancelled\. Take it out of after: before the ticket can start\./);
});

test('0686 AC2: one cancelled and one still being built are each reported as they are', () => {
  const t = { id: '0001', waiting_on: ['0002', '0003'], after_cancelled: ['0002'], starts_on: null };
  const why = afterWait(t);
  assert.match(why, /waiting for 0003/);
  assert.match(why, /lists 0002, which was cancelled/);
  assert.doesNotMatch(why, /waiting for 0002/);
});

test('0686 AC3: a ticket already done or cancelled on the base branch is left as it is', () => {
  for (const status of ['done', 'cancelled']) {
    const r = cancelledOnBranch();
    const file = liveFile(r.dir), dest = doneFile(r.dir);
    const text = fs.readFileSync(file, 'utf8').replace(/^status: .*$/m, `status: ${status}`).replace(/^title: .*$/m, 'title: "Kept as it was"');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
    fs.rmSync(file);
    gitIn(r.dir, 'add', '-A', '--', 'speck/tickets');
    gitIn(r.dir, 'commit', '-qm', `speck(0002): ${status}`);
    const head = gitIn(r.dir, 'rev-parse', 'HEAD');
    const { said, q } = queue(r);
    q.ended('0002');
    assert.equal(gitIn(r.dir, 'rev-parse', 'HEAD'), head, status);
    assert.equal(fs.readFileSync(dest, 'utf8'), text, status);
    assert.deepEqual(said, [], status);
  }
});

test('0686 AC3: a build that ends with its ticket in any other status changes nothing on the base branch', () => {
  for (const status of ['building', 'reviewing', 'blocked', 'approved', 'ready']) {
    const r = builtOnRepo({ status: 'building' });
    const own = path.join(r.second, 'speck', 'tickets', '0002-t.md');
    fs.writeFileSync(own, fs.readFileSync(own, 'utf8').replace(/^status: .*$/m, `status: ${status}`));
    gitIn(r.second, 'commit', '-qam', `speck(0002): ${status}`);
    const head = gitIn(r.dir, 'rev-parse', 'HEAD'), text = fs.readFileSync(liveFile(r.dir), 'utf8');
    const { said, q } = queue(r);
    q.ended('0002');
    q.check();
    assert.equal(gitIn(r.dir, 'rev-parse', 'HEAD'), head, status);
    assert.equal(fs.readFileSync(liveFile(r.dir), 'utf8'), text, status);
    assert.deepEqual(said, [], status);
  }
  // No branch at all, or no such ticket: nothing to do, and nothing said.
  const r = builtOnRepo({ status: 'building' });
  const { said, q } = queue(r);
  for (const id of ['0009', '0001', 'constructor', '']) q.ended(id);
  q.check();
  assert.deepEqual(said, []);
});

test('0686 AC4: with the ticket changed and uncommitted in the main checkout, it says so once, naming it, and tries again at the next check', () => {
  const r = cancelledOnBranch();
  const file = liveFile(r.dir), edited = `${fs.readFileSync(file, 'utf8')}\nAn edit not yet committed.\n`;
  fs.writeFileSync(file, edited);
  const head = gitIn(r.dir, 'rev-parse', 'HEAD');
  const { said, q } = queue(r);
  q.ended('0002');
  q.check();
  q.check();
  assert.equal(said.length, 1, said.join('\n'));
  assert.match(said[0], /0002/);
  assert.match(said[0], /next check/);
  assert.equal(gitIn(r.dir, 'rev-parse', 'HEAD'), head, 'nothing committed');
  assert.equal(fs.readFileSync(file, 'utf8'), edited, 'the edit is left as it was');
  // Once the edit is committed, the next check cancels it.
  gitIn(r.dir, 'commit', '-qam', 'the edit');
  q.check();
  assert.equal(parseTicket(fs.readFileSync(doneFile(r.dir), 'utf8')).fm.status, 'cancelled');
  assert.equal(said.length, 2);
  q.check();
  assert.equal(said.length, 2, 'done with it');
});

test('0686 AC4: a commit that fails puts the ticket back where it was, and says so once', () => {
  const r = cancelledOnBranch();
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const text = fs.readFileSync(liveFile(r.dir), 'utf8');
  const { said, q } = queue(r);
  q.ended('0002');
  q.check();
  assert.equal(fs.readFileSync(liveFile(r.dir), 'utf8'), text);
  assert.equal(fs.existsSync(doneFile(r.dir)), false);
  assert.equal(said.length, 1);
  assert.match(said[0], /0002/);
  fs.rmSync(hook);
  q.check();
  assert.equal(parseTicket(fs.readFileSync(doneFile(r.dir), 'utf8')).fm.status, 'cancelled');
});

// A builder that starts the ticket in its own worktree, cancels it there and commits that, as a build taking a
// recommendation to cancel does, then exits.
test('0686 AC1: speck run takes it up when the build ends', async () => {
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-')), 'cancel-build.cjs');
  fs.writeFileSync(fake, `
const { spawnSync } = require('child_process');
const [cli, id] = process.argv.slice(2);
const started = spawnSync(process.execPath, [cli, 'start', id], { encoding: 'utf8' });
const wt = started.stdout.trim().split('\\n').pop();
spawnSync(process.execPath, [cli, 'cancel', id, 'Not needed after all'], { cwd: wt, encoding: 'utf8' });
spawnSync('git', ['add', '-A', '--', 'speck/tickets'], { cwd: wt });
spawnSync('git', ['commit', '-qm', 'speck(' + id + '): cancelled'], { cwd: wt });
`);
  const r = runRepo({ tickets: [['0002', {}]], worktrees: 'true', command: `"${process.execPath}" "${fake}" "${CLI}" {id}` });
  const run = startRun(r.dir);
  try {
    await waitFor(() => fs.existsSync(doneFile(r.dir)) && r.g('status', '--porcelain', '--', 'speck/tickets') === '', 'speck run to cancel 0002 on main', run.out);
    const fm = parseTicket(fs.readFileSync(doneFile(r.dir), 'utf8')).fm;
    assert.equal(fm.status, 'cancelled');
    assert.equal(fm.cancel_reason, 'Not needed after all');
    assert.match(r.g('log', '-1', '--format=%s'), /^speck\(0002\): cancelled/);
  } finally { await stopRun(run); }
});
