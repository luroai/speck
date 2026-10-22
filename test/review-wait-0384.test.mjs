// 0384: a review round that runs past the builder's shell limit carries on. `speck review` exits 12 after a while,
// printing the command that waits for the same round, and that command records it once its reviewer is done.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { reviewRepo, commandRepo, changesVerdict, ROOT, CLI } from './support/speck.mjs';
import { keptFile } from './support/copy.mjs';
import { runsOf } from '../scripts/speck.mjs';
import { roundRunning } from '../scripts/review-running.mjs';
import { reviewWaitMs, claimStart } from '../scripts/review-wait.mjs';

// A reviewer that logs each start and answers only once its go file exists, or fails then with SLOW_FAIL set.
const slow = keptFile('slow-reviewer', `#!${process.execPath}
const fs = require('fs');
fs.readFileSync(0, 'utf8');
fs.appendFileSync(process.env.SLOW_LOG, 'start\\n');
const tick = () => {
  if (!fs.existsSync(process.env.SLOW_GO)) return setTimeout(tick, 20);
  if (process.env.SLOW_FAIL) { console.error('slow reviewer broke'); process.exit(3); }
  console.log(${JSON.stringify(JSON.stringify(changesVerdict))});
};
tick();
`, 0o755);

// Waits, with a time limit, until `check` is true.
async function until(check, ms = 5000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise(r => setTimeout(r, 20));
  }
}

function slowRepo(t, more = {}) {
  const r = commandRepo({ command: slow });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slow-'));
  const env = { SLOW_LOG: path.join(tmp, 'log'), SLOW_GO: path.join(tmp, 'go'), SPECK_REVIEW_WAIT_MS: '300', SPECK_REVIEW_TIMEOUT_MS: '10000', ...more };
  const go = () => fs.writeFileSync(env.SLOW_GO, '');
  // So no reviewer is left running, unless the test's folders have gone already: then its time limit ends it.
  t.after(() => { try { go(); } catch { /* gone */ } });
  const starts = () => fs.existsSync(env.SLOW_LOG) ? fs.readFileSync(env.SLOW_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
  const run = (extra, ...a) => r.runEnv({ ...env, ...extra }, ...a);
  const rounds = () => [1, 2].filter(n => r.roundFile(n)).length;
  return { ...r, env, go, starts, run, rounds };
}

const STILL = /Round 1 of 0001 is still running/;
const WAIT = '`speck review 0001 --wait`';

test('0384 AC1: a command reviewer still running when the wait ends exits 12, says so and names the command to wait for it', async t => {
  const r = slowRepo(t);
  const res = r.run({}, 'review', '1');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stdout, STILL);
  assert.ok(res.stdout.includes(WAIT), res.stdout);
  assert.equal(r.rounds(), 0, 'nothing recorded yet');
  await until(() => r.starts() === 1);
  // The reviewer carries on after speck review exits.
  r.go();
  await until(() => r.rounds() === 1);
});

test('0384 AC1: a Codex reviewer still running is still ended review_timeout_minutes after it started', async t => {
  const r = reviewRepo();
  const pid = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hang-')), 'pid');
  const env = { FAKE_HANG_PID: pid, SPECK_REVIEW_WAIT_MS: '300', SPECK_REVIEW_TIMEOUT_MS: '1500' };
  const res = r.runEnv(env, 'review', '1');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stdout, STILL);
  const done = r.runEnv({ ...env, SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1', '--wait');
  assert.equal(done.status, 1, done.stdout);
  assert.match(done.stderr, /took longer than 1\.5 seconds/);
  assert.equal(r.roundFile(1), undefined, 'no round recorded');
});

test('0384 AC2: the wait command records the round once the reviewer finishes, with the same output and exit code', async t => {
  const r = slowRepo(t);
  assert.equal(r.run({}, 'review', '1').status, 12);
  const again = r.run({}, 'review', '1', '--wait');
  assert.equal(again.status, 12, 'still running: 12 again');
  assert.match(again.stdout, STILL);
  assert.ok(again.stdout.includes(WAIT));
  // While it runs, speck review waits for the same round rather than starting a second reviewer.
  const plain = r.run({}, 'review', '1');
  assert.equal(plain.status, 12);
  await until(() => r.starts() >= 1);
  assert.equal(r.starts(), 1, 'one reviewer only');
  r.go();
  const done = r.run({ SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.match(done.stdout, /^Round 1: changes_requested\nRound one summary\./);
  assert.match(done.stdout, /NEXT: fix/);
  assert.equal(r.rounds(), 1);
  assert.equal(r.roundFile(1).meta.reviewer, 'fake');
  assert.equal(r.starts(), 1);
});

test('0384 AC2: a round that finished before the wait command ran is printed then, and only once', async t => {
  const r = slowRepo(t);
  assert.equal(r.run({}, 'review', '1').status, 12);
  r.go();
  await until(() => r.rounds() === 1);
  const done = r.run({}, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.match(done.stdout, /^Round 1: changes_requested/);
  const after = r.run({}, 'review', '1', '--wait');
  assert.equal(after.status, 1);
  assert.match(after.stderr, /No review round of 0001 is running/);
  assert.equal(r.starts(), 1, '--wait never starts a reviewer');
});

test('0384 AC2: a reviewer that fails gives its failure message from the wait command, with nothing recorded', async t => {
  const r = slowRepo(t, { SLOW_FAIL: '1' });
  assert.equal(r.run({}, 'review', '1').status, 12);
  r.go();
  const done = r.run({ SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1', '--wait');
  assert.equal(done.status, 1);
  assert.match(done.stderr, /The fake reviewer \(.*\) exited 3, so no round was recorded\.[\s\S]*slow reviewer broke/);
  assert.equal(r.rounds(), 0);
  assert.equal(r.git('status', '--porcelain', '--untracked-files=no').stdout, '', 'the ticket is as it was');
});

test('0384 AC2: only one command can claim a start, so two started at once never both start a reviewer', () => {
  const r = commandRepo();
  assert.equal(claimStart(r.dir, '0001', 1, 1), true);
  assert.equal(claimStart(r.dir, '0001', 1, 1), false, 'the second claim of the same start fails');
  const rec = JSON.parse(fs.readFileSync(path.join(r.dir, 'speck', '.cache', '0001', 'review-run-1.json'), 'utf8'));
  assert.equal(rec.pid, process.pid, 'and leaves the first one\'s record as it was');
});

test('0384 AC2: speck review run twice at once starts one reviewer, and its round is recorded once', async t => {
  const r = slowRepo(t);
  const start = () => new Promise(resolve => {
    const p = spawn(process.execPath, [CLI, 'review', '1'], { cwd: r.dir, env: { ...process.env, ...r.env, SPECK_REVIEW_WAIT_MS: '1500' } });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('close', code => resolve({ code, out }));
  });
  const both = await Promise.all([start(), start()]);
  assert.deepEqual(both.map(b => b.code), [12, 12], JSON.stringify(both));
  assert.equal(r.starts(), 1, 'one reviewer only');
  r.go();
  const done = r.run({ SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.equal(r.rounds(), 1);
  assert.equal(r.starts(), 1);
});

test('0384 AC2: a command that looked before later rounds started can never claim an earlier start again', async t => {
  const r = slowRepo(t);
  const dir = path.join(r.dir, 'speck', '.cache', '0001');
  r.go();
  assert.equal(r.run({ SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1').status, 10);
  fs.rmSync(r.env.SLOW_GO);
  // Round 2 is start 2, still running. A command that read "no start yet" before both now tries to claim start 1.
  assert.equal(r.run({}, 'review', '1').status, 12);
  assert.ok(fs.existsSync(path.join(dir, 'review-run-1.json')), 'start 1 is kept');
  assert.equal(claimStart(r.dir, '0001', 1, 1), false);
  assert.equal(claimStart(r.dir, '0001', 2, 2), false);
  await until(() => r.starts() === 2);
  r.go();
  const done = r.run({ SPECK_REVIEW_WAIT_MS: '10000' }, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.match(done.stdout, /^Round 2: changes_requested/m);
  assert.equal(r.starts(), 2, 'one reviewer for each round');
});

test('0384 AC2: a round marked printed keeps its output for the command that marked it, whatever starts next', () => {
  const r = commandRepo();
  const dir = path.join(r.dir, 'speck', '.cache', '0001');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'review-run-1.json'), JSON.stringify({ round: 1, pid: process.pid, started: new Date().toISOString() }));
  fs.writeFileSync(path.join(dir, 'review-run-1.out'), 'Round 1: approve\n');
  fs.writeFileSync(path.join(dir, 'review-run-1.done.json'), JSON.stringify({ code: 0 }));
  const res = r.run('review', '1', '--wait');
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'Round 1: approve\n');
  // The next start removes start 1's output, once it's printed, and keeps its record.
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(fs.existsSync(path.join(dir, 'review-run-1.out')), false);
  assert.ok(fs.existsSync(path.join(dir, 'review-run-1.json')));
});

test('0384 AC3: a reviewer that finishes within the wait gives the output, exit code and round it did before', () => {
  const r = commandRepo();
  const res = r.run('review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /^Round 1: changes_requested\nRound one summary\.\n  AC1 fail: a\.txt\n  F1 \[blocking\/open\] a\.txt: First problem\. → Fix it\.\nNEXT: fix\n$/);
  assert.equal(res.stderr, '');
  assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
  assert.equal(r.calls().length, 1);
});

test('0384 AC3: the panel shows the round as running through every exit 12, until it is recorded', async t => {
  const r = slowRepo(t);
  const runs = runsOf(r.dir);
  assert.equal(r.run({}, 'review', '1').status, 12);
  assert.equal(roundRunning(runs, '0001', 0), 1, 'running after the first exit 12');
  assert.equal(r.run({}, 'review', '1', '--wait').status, 12);
  assert.equal(roundRunning(runs, '0001', 0), 1, 'running after the second');
  r.go();
  await until(() => r.rounds() === 1);
  await until(() => roundRunning(runs, '0001', 1) === null);
});

test('0384 AC2: a round whose process is gone, or whose pid another process has taken since, is said to have stopped', () => {
  const r = commandRepo();
  const dir = path.join(r.dir, 'speck', '.cache', '0001');
  fs.mkdirSync(dir, { recursive: true });
  const stale = [{ round: 1, pid: 2 ** 22 + 12345, started: new Date().toISOString() }, { round: 1, pid: process.pid, started: '2020-01-01T00:00:00Z' }];
  for (const [i, rec] of stale.entries()) {
    fs.writeFileSync(path.join(dir, `review-run-${i + 1}.json`), JSON.stringify(rec));
    const res = r.run('review', '1', '--wait');
    assert.equal(res.status, 1, res.stdout);
    assert.match(res.stderr, /Review round 1 of 0001 stopped before it finished, and no round was recorded\./);
    assert.doesNotMatch(res.stderr, /^\s+at /m);
    assert.match(r.run('review', '1', '--wait').stderr, /No review round of 0001 is running/, 'it is said once');
  }
  // With the stale record gone, a new round runs as usual.
  assert.equal(r.run('review', '1').status, 10);
});

test('0384: the wait is 9 minutes unless the tests shorten it', () => {
  const saved = process.env.SPECK_REVIEW_WAIT_MS;
  delete process.env.SPECK_REVIEW_WAIT_MS;
  try { assert.equal(reviewWaitMs(), 9 * 60 * 1000); } finally { if (saved !== undefined) process.env.SPECK_REVIEW_WAIT_MS = saved; }
});

test('0384 AC4: the review and build skills say exit 12 means the round is still running, and to run the printed command again', () => {
  for (const skill of ['speck-review', 'speck-build']) {
    const text = fs.readFileSync(path.join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /\b12\b/, skill);
    assert.ok(text.includes('speck review <id> --wait'), skill);
  }
});
