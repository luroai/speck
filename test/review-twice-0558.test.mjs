// 0558: 0384's run-twice-at-once test failed by chance on a busy machine, as it counted the reviewer's starts as soon
// as both commands had exited, before the reviewer had got to say it started. Its checks now wait for that.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { CLI } from './support/speck.mjs';
import { claimStart } from '../scripts/review-wait.mjs';
import { slowRepo, assertOneReviewer, assertRecordedOnce } from './support/review-twice.mjs';

// Runs `speck review 0001` twice at once, each waiting 1.5 s for the round, and gives each one's exit code and output.
function reviewTwiceAtOnce(r) {
  const start = () => new Promise(resolve => {
    const p = spawn(process.execPath, [CLI, 'review', '1'], { cwd: r.dir, env: { ...process.env, ...r.env, SPECK_REVIEW_WAIT_MS: '1500' } });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('close', code => resolve({ code, out }));
  });
  return Promise.all([start(), start()]);
}

// A slow repo whose reviewer says it started only once `letStart` is called, as a busy machine's may.
function lateRepo(t) {
  const start = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'late-')), 'start');
  const r = slowRepo(t, { SLOW_START: start });
  return { ...r, letStart: () => fs.writeFileSync(start, '') };
}

test('0558 AC1: a reviewer that says it started only after both commands exited 12 is still counted once', async t => {
  const r = lateRepo(t);
  const both = await reviewTwiceAtOnce(r);
  assert.deepEqual(both.map(b => b.code), [12, 12], JSON.stringify(both));
  assert.equal(r.starts(), 0, 'it has not said so yet: counting now, as the test did, would find none');
  const counted = assertOneReviewer(r);
  r.letStart();
  await counted;
  assertRecordedOnce(r);
});

test('0558 AC2: the check fails when a second start is claimed, or a second reviewer starts', async t => {
  const r = slowRepo(t);
  await reviewTwiceAtOnce(r);
  await assertOneReviewer(r);
  assert.equal(claimStart(r.dir, '0001', 2, 1), true, 'a second command claims a start');
  await assert.rejects(assertOneReviewer(r), /one start claimed/);
  fs.appendFileSync(r.env.SLOW_LOG, 'start\n');
  fs.rmSync(path.join(r.dir, 'speck', '.cache', '0001', 'review-run-2.json'));
  await assert.rejects(assertOneReviewer(r), /one reviewer only/);
});

test('0558 AC2: the check fails when a reviewer starts after the round is recorded', async t => {
  const r = slowRepo(t);
  await reviewTwiceAtOnce(r);
  await assertOneReviewer(r);
  fs.appendFileSync(r.env.SLOW_LOG, 'start\n');
  assert.throws(() => assertRecordedOnce(r), /no reviewer started since/);
});
