// 0743: the 0182 AC3 test of a test that timed out waiting on its page holds up on a busy machine.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome } from './support/panel.mjs';
import { runPastItsLimit, timesOutOnItsPage, goneWithin10s, mentioning } from './support/chromium-file.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0743 AC1: a test whose page isn\'t open within its time limit is run again with longer, until it is', async () => {
  // Stands in for a Chromium that takes 2 s to start: the first test's page isn't open within 1.5 s.
  const f = await runPastItsLimit(ms => `
test('slow to start', { timeout: ${ms} }, async () => { await new Promise(r => setTimeout(r, 2000)); logPid(1); await new Promise(r => setTimeout(r, ${ms})); });
test('then another', async () => { logPid(0); await new Promise(r => setTimeout(r, 1000)); });`);
  assert.deepEqual(f.pids, [1, 0], f.out); // the page was open before the next test started
  assert.ok(f.allowed >= 3000 && f.allowed <= 12000, `allowed ${f.allowed} ms`);
  assert.match(f.out, new RegExp(`timed out after ${f.allowed}ms`));
});

test('0743 AC2: the 0182 AC3 check still fails when Chromium is left running after a test runs out of time', skip, async () => {
  // Stopping the file's Chromium only pretends to, as with a broken clean-up, so it outlives the file.
  const f = await timesOutOnItsPage(`(await import('node:child_process')).ChildProcess.prototype.kill = function () { this.emit('exit', 0); return true; };
    setTimeout(() => process.exit(1), 5000).unref();`);
  assert.notEqual(f.code, 0, f.out);
  assert.equal(f.pids.length, 3, f.out);
  assert.ok(mentioning(f.dir).includes(f.pids[0]), 'Chromium was left running');
  await assert.rejects(goneWithin10s(f), /Chromium still running 10 s after the test file finished/);
  assert.equal(mentioning(f.dir).length, 0, 'the check ended what was left');
});
