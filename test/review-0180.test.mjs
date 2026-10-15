// 0180: a reviewer speck runs (Codex, or a command under reviewer_options) that runs past review_timeout_minutes is
// ended, with every process it started, and the round fails, recording nothing.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reviewRepo, commandRepo } from './support/speck.mjs';
import { hasStopped } from './support/stopped.mjs';
import { reviewTimeoutMs, tookTooLong } from '../scripts/reviewers.mjs';

// speck's own tests can't wait minutes, so they set the limit in milliseconds.
const fast = { SPECK_REVIEW_TIMEOUT_MS: '700' };
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const pidFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hang-')), 'pid');
const setTimeoutLine = (dir, line) => {
  const file = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').replace(/^review_timeout_minutes:.*\n/m, '')}${line}\n`);
};

// A repo whose ticket uses the given reviewer, and `review(env)` running `speck review 1` with extra environment.
function repoFor(kind) {
  const r = kind === 'command' ? commandRepo() : reviewRepo();
  return { ...r, review: env => r.runEnv(env, 'review', '1') };
}

for (const kind of ['codex', 'command']) {
  test(`0180 AC1: a ${kind} reviewer still running after the limit is ended with every process it started, and the round fails saying so`, async () => {
    const r = repoFor(kind);
    const pids = pidFile();
    const started = Date.now();
    const res = r.review({ ...fast, FAKE_HANG_PID: pids });
    assert.ok(Date.now() - started < 30000, 'ended near the limit, not left to run');
    assert.equal(res.status, 1, res.stderr);
    assert.match(res.stderr, /reviewer took longer than 0\.7 seconds/);
    assert.match(res.stderr, /no round was recorded/i);
    noTrace(res);
    const pid = Number(fs.readFileSync(pids, 'utf8'));
    assert.ok(await hasStopped(() => !alive(pid)), 'the process the reviewer started was ended too');
  });

  test(`0180 AC2: nothing from an ended ${kind} attempt is recorded, and the round runs again as normal`, () => {
    const r = repoFor(kind);
    const before = fs.readFileSync(r.ticketFile, 'utf8');
    const res = r.review({ ...fast, FAKE_HANG_PID: pidFile() });
    assert.equal(res.status, 1, res.stderr);
    assert.equal(r.roundFile(1), undefined);
    assert.equal(fs.readFileSync(r.ticketFile, 'utf8'), before, 'the ticket is as it was');
    const again = r.review({});
    assert.equal(again.status, 10, again.stderr);
    assert.match(again.stdout, /Round 1: changes_requested/);
    assert.equal(r.roundFile(1).meta.round, 1);
    assert.equal(r.roundFile(2), undefined);
  });

  test(`0180 AC4: a ${kind} reviewer that finishes within the limit works as before`, () => {
    const r = repoFor(kind);
    const res = r.review({ SPECK_REVIEW_TIMEOUT_MS: '60000' });
    assert.equal(res.status, 10, res.stderr);
    assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
    assert.equal(r.calls().length, 1);
  });
}

test('0180 AC1: review_timeout_minutes defaults to 30, and the message gives the limit in minutes', () => {
  const was = process.env.SPECK_REVIEW_TIMEOUT_MS;
  delete process.env.SPECK_REVIEW_TIMEOUT_MS;
  try {
    assert.equal(reviewTimeoutMs({}), 30 * 60 * 1000);
    assert.equal(reviewTimeoutMs({ review_timeout_minutes: 2 }), 2 * 60 * 1000);
  } finally { if (was !== undefined) process.env.SPECK_REVIEW_TIMEOUT_MS = was; }
  assert.match(tookTooLong('codex', 30 * 60 * 1000), /The codex reviewer took longer than 30 minutes, so speck ended it and every process it started\. No round was recorded/);
  assert.match(tookTooLong('fake', 60 * 1000), /took longer than 1 minute,/);
  const t = reviewRepo();
  assert.match(fs.readFileSync(path.join(t.dir, 'speck', 'config.yml'), 'utf8'), /^review_timeout_minutes: 30\b/m, 'in the config template');
});

test('0180 AC4: a reviewer command that exits non-zero or is missing gives the same messages as before', () => {
  const fail = commandRepo();
  let res = fail.runEnv({ FAKE_MODE: 'fail' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /exited 3/);
  assert.match(res.stderr, /err line 7/);
  const missing = commandRepo({ command: '/no/such/dir/reviewer --x' });
  res = missing.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /`\/no\/such\/dir\/reviewer` isn't installed or isn't on your PATH/);
  noTrace(res);
});

test('0180 AC3: a review_timeout_minutes that is not a whole number of 1 or more is refused, saying how to fix it, and no reviewer runs', () => {
  for (const kind of ['codex', 'command']) {
    const r = repoFor(kind);
    const before = fs.readFileSync(r.ticketFile, 'utf8');
    for (const bad of ['0', '-1', '1.5', 'soon', '""']) {
      setTimeoutLine(r.dir, `review_timeout_minutes: ${bad}`);
      const res = r.review({});
      assert.equal(res.status, 1, `${kind} ${bad}: ${res.stderr}`);
      assert.match(res.stderr, /review_timeout_minutes in speck\/config\.yml must be a whole number of 1 or more/);
      assert.match(res.stderr, /speck config set review_timeout_minutes 30/);
      noTrace(res);
      assert.equal(r.calls().length, 0, 'the reviewer never ran');
      assert.equal(fs.readFileSync(r.ticketFile, 'utf8'), before);
    }
  }
});

test('0180 AC3: speck config set refuses a review_timeout_minutes that is not a whole number of 1 or more', () => {
  const r = reviewRepo();
  for (const bad of ['0', '-3', '2.5', 'never']) {
    const res = r.run('config', 'set', 'review_timeout_minutes', bad);
    assert.equal(res.status, 1, bad);
    assert.match(res.stderr, /review_timeout_minutes must be a whole number of 1 or more/);
  }
  assert.equal(r.run('config', 'set', 'review_timeout_minutes', '45').status, 0);
  assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), /^review_timeout_minutes: 45\b/m);
});

test('0180 AC1: a process the reviewer started in a process group of its own is ended too', async () => {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-detach-'));
  const pids = path.join(bin, 'pid');
  const script = path.join(bin, 'reviewer');
  fs.writeFileSync(script, `#!${process.execPath}
const c = require('child_process').spawn('sleep', ['300'], { stdio: 'ignore', detached: true });
require('fs').writeFileSync(${JSON.stringify(pids)}, String(c.pid));
setInterval(() => {}, 1e6);
`, { mode: 0o755 });
  const r = commandRepo({ command: script });
  const res = r.runEnv(fast, 'review', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.match(res.stderr, /took longer than 0\.7 seconds/);
  const pid = Number(fs.readFileSync(pids, 'utf8'));
  assert.ok(await hasStopped(() => !alive(pid)), 'the process in its own group was ended too');
});

test('0180 AC4: a limit longer than one timer can wait still lets a quick reviewer finish', () => {
  // 35792 minutes is more than a single Node timer can wait, which would otherwise fire at once.
  const res = spawnSync(process.execPath, [path.join(import.meta.dirname, '..', 'scripts', 'limit.mjs'), String(35792 * 60 * 1000), 'sh', '-c', 'sleep 0.3; cat; exit 4'],
    { input: 'the prompt', encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe', 'pipe'], timeout: 30000 });
  assert.equal(res.status, 4, res.stderr);
  assert.equal(res.stdout, 'the prompt');
  assert.equal(res.output[3], '', 'not ended for taking too long');
});
