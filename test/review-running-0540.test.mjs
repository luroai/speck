// 0540: `speck review` records its round's process as running as soon as it starts it, so the panel shows the round
// running after an exit 12 even when that process is too slow, on a busy machine, to have recorded it yet.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { commandRepo, changesVerdict } from './support/speck.mjs';
import { keptFile } from './support/copy.mjs';
import { runsOf } from '../scripts/speck.mjs';
import { roundRunning } from '../scripts/review-running.mjs';

// A reviewer that answers only once its go file exists, or fails then with SLOW_FAIL set.
const slow = keptFile('slow-reviewer-0540', `#!${process.execPath}
const fs = require('fs');
fs.readFileSync(0, 'utf8');
const tick = () => {
  if (!fs.existsSync(process.env.SLOW_GO)) return setTimeout(tick, 20);
  if (process.env.SLOW_FAIL) process.exit(3);
  console.log(${JSON.stringify(JSON.stringify(changesVerdict))});
};
tick();
`, 0o755);

async function until(check, ms = 10000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise(r => setTimeout(r, 20));
  }
}

// A repo whose `speck review` waits only 1 ms, so it exits 12 before the round's own process has loaded.
function slowRepo(t, more = {}) {
  const r = commandRepo({ command: slow });
  const go = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'slow-')), 'go');
  const env = { SLOW_GO: go, SPECK_REVIEW_WAIT_MS: '1', SPECK_REVIEW_TIMEOUT_MS: '20000', ...more };
  t.after(() => { try { fs.writeFileSync(go, ''); } catch { /* gone */ } });
  const record = () => { try { return JSON.parse(fs.readFileSync(path.join(runsOf(r.dir), '0001.review.json'), 'utf8')); } catch { return null; } };
  const worker = () => JSON.parse(fs.readFileSync(path.join(r.dir, 'speck', '.cache', '0001', 'review-run-1.json'), 'utf8')).pid;
  return { ...r, env, go: () => fs.writeFileSync(go, ''), runs: runsOf(r.dir), record, worker };
}

test('0540 AC1: the round shows as running as soon as speck review exits 12, before its own process has recorded it', async t => {
  const r = slowRepo(t);
  const res = r.runEnv(r.env, 'review', '1');
  assert.equal(res.status, 12, res.stderr);
  assert.equal(roundRunning(r.runs, '0001', 0), 1, 'running straight after the exit 12');
  assert.equal(r.record().pid, r.worker(), 'recorded with the round\'s own process');
  r.go();
  await until(() => r.roundFile(1));
});

test('0540 AC4: once the round is recorded, it no longer shows as running and its record is gone', async t => {
  const r = slowRepo(t);
  assert.equal(r.runEnv(r.env, 'review', '1').status, 12);
  r.go();
  const done = r.runEnv({ ...r.env, SPECK_REVIEW_WAIT_MS: '20000' }, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.equal(roundRunning(r.runs, '0001', 1), null);
  assert.equal(r.record(), null, 'the round\'s process removed its record');
});

test('0540 AC4: a round whose process fails no longer shows as running', async t => {
  const r = slowRepo(t, { SLOW_FAIL: '1' });
  assert.equal(r.runEnv(r.env, 'review', '1').status, 12);
  r.go();
  const done = r.runEnv({ ...r.env, SPECK_REVIEW_WAIT_MS: '20000' }, 'review', '1', '--wait');
  assert.equal(done.status, 1, done.stdout);
  assert.equal(roundRunning(r.runs, '0001', 0), null);
});
