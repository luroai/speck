// 0384, 0558: a slow command reviewer, and the checks that `speck review` run twice at once starts one reviewer and
// records its round once. Each test file starts the two commands itself, as no shared helper starts the CLI (0231). Each start is two processes deep (the round's own process, then its reviewer), so on a busy
// machine the reviewer's first line can come after both commands have exited 12: the checks wait for it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { commandRepo, changesVerdict } from './speck.mjs';
import { keptFile } from './copy.mjs';

// A reviewer that logs each start, once its start file exists when SLOW_START is set, and answers only once its go
// file exists, or fails then with SLOW_FAIL set.
const slow = keptFile('slow-reviewer', `#!${process.execPath}
const fs = require('fs');
fs.readFileSync(0, 'utf8');
const begin = () => {
  if (process.env.SLOW_START && !fs.existsSync(process.env.SLOW_START)) return setTimeout(begin, 20);
  fs.appendFileSync(process.env.SLOW_LOG, 'start\\n');
  tick();
};
const tick = () => {
  if (!fs.existsSync(process.env.SLOW_GO)) return setTimeout(tick, 20);
  if (process.env.SLOW_FAIL) { console.error('slow reviewer broke'); process.exit(3); }
  console.log(${JSON.stringify(JSON.stringify(changesVerdict))});
};
begin();
`, 0o755);

// Waits, with a time limit, until `check` is true.
export async function until(check, ms = 5000) {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise(r => setTimeout(r, 20));
  }
}

export function slowRepo(t, more = {}) {
  const r = commandRepo({ command: slow });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slow-'));
  const env = { SLOW_LOG: path.join(tmp, 'log'), SLOW_GO: path.join(tmp, 'go'), SPECK_REVIEW_WAIT_MS: '300', SPECK_REVIEW_TIMEOUT_MS: '10000', ...more };
  const go = () => fs.writeFileSync(env.SLOW_GO, '');
  // So no reviewer is left running, unless the test's folders have gone already: then its time limit ends it.
  t.after(() => { try { go(); if (env.SLOW_START) fs.writeFileSync(env.SLOW_START, ''); } catch { /* gone */ } });
  const starts = () => fs.existsSync(env.SLOW_LOG) ? fs.readFileSync(env.SLOW_LOG, 'utf8').split('\n').filter(Boolean).length : 0;
  const run = (extra, ...a) => r.runEnv({ ...env, ...extra }, ...a);
  const rounds = () => [1, 2].filter(n => r.roundFile(n)).length;
  // The starts commands have claimed for 0001: each is claimed before its reviewer is started.
  const claimed = () => { try { return fs.readdirSync(path.join(r.dir, 'speck', '.cache', '0001')).filter(n => /^review-run-\d+\.json$/.test(n)).length; } catch { return 0; } };
  return { ...r, env, go, starts, run, rounds, claimed };
}

// Checks, once both commands have exited, that one reviewer was started: one start claimed, and one reviewer that
// has said it started, waiting for its first line however long a busy machine takes to get to it.
export async function assertOneReviewer(r) {
  assert.equal(r.claimed(), 1, 'one start claimed');
  await until(() => r.starts() >= 1, 30000);
  assert.equal(r.starts(), 1, 'one reviewer only');
}

// Lets the reviewer answer, waits for the round and checks it was recorded once, with nothing left to record again.
export function assertRecordedOnce(r) {
  r.go();
  const done = r.run({ SPECK_REVIEW_WAIT_MS: '30000' }, 'review', '1', '--wait');
  assert.equal(done.status, 10, done.stderr);
  assert.equal(r.rounds(), 1, 'one round recorded in the ticket');
  assert.match(r.run({}, 'review', '1', '--wait').stderr, /No review round of 0001 is running/, 'nothing left to record');
  assert.equal(r.claimed(), 1, 'no start claimed since');
  assert.equal(r.starts(), 1, 'no reviewer started since');
}
