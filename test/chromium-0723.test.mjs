// 0723: the 0182 AC3 test of a file that ran out of time under --test-timeout holds up on a busy machine.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { findChrome } from './support/panel.mjs';
import { runOutOfTime, goneWithin10s, mentioning } from './support/chromium-file.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
test('0723 AC1: a test file that ran out of time under --test-timeout exits only once its Chromium has gone', skip, async () => {
  // The file's last word, written as its process exits, after browserPage's own clean-up: whether its Chromium is there.
  const f = await runOutOfTime(`let chrome;
test('hangs', async () => { const b = await browserPage('about:blank'); chrome = b.pid; logPid(b.pid); await new Promise(() => {}); });
test('never starts', () => {});
process.on('exit', () => {
  if (!chrome) return;
  let there; try { process.kill(chrome, 0); there = true; } catch (e) { there = e.code === 'EPERM'; }
  logPid((there ? 'there ' : 'gone ') + chrome);
});`);
  assert.notEqual(f.code, 0, f.out);
  const lines = fs.readFileSync(f.log, 'utf8').trim().split('\n');
  assert.equal(lines.length, 2, f.out);
  assert.equal(lines[1], `gone ${lines[0]}`, 'Chromium had gone by the time the file\'s process exited');
  await goneWithin10s(f);
});

test('0723 AC1: the 10 s check passes when a listing that began before the 10 s were up, and ended after, showed a process that has gone since', async () => {
  // The file exited 9.9 s ago. The first listing begins before the 10 s are up and takes 300 ms, as ps can on a busy
  // machine, showing a process that has gone by the time the next one begins.
  const calls = [];
  const slow = async () => { calls.push(Date.now()); if (calls.length > 1) return []; await new Promise(r => setTimeout(r, 300)); return [12345]; };
  const exited = Date.now() - 9900;
  await goneWithin10s({ dir: 'unused', exited, out: '' }, slow);
  assert.equal(calls.length, 2);
  assert.ok(calls[1] >= exited + 10000, 'the second listing began once the 10 s were up');
});

test('0723 AC1: a file whose first test can\'t log in time is run again with twice as long, until one does', async () => {
  // Stands in for a Chromium that takes 2 s to start, and keeps the file going as its connection would: nothing is
  // logged within 1.5 s, so a later run allows longer (3 s, or more when the file itself is slow to start).
  const f = await runOutOfTime(`test('slow to start', async () => { await new Promise(r => setTimeout(r, 2000)); logPid(1); setInterval(() => {}, 1000); await new Promise(() => {}); });`);
  assert.deepEqual(f.pids, [1], f.out);
  assert.ok(f.allowed >= 3000 && f.allowed <= 12000, `allowed ${f.allowed} ms`);
  assert.match(f.out, new RegExp(`timed out after ${f.allowed}ms`));
});

test('0723 AC2: the 10 s check fails when a listing that began once the 10 s were up still shows a process', async () => {
  const calls = [];
  const exited = Date.now() - 9900;
  const always = async () => { calls.push(Date.now()); return [2 ** 22 + 1]; }; // a pid above pid_max's default, so nothing is killed
  await assert.rejects(goneWithin10s({ dir: 'unused', exited, out: '' }, always), /Chromium still running 10 s after the test file finished/);
  assert.ok(calls.at(-1) >= exited + 10000, 'it gave up on a listing that began once the 10 s were up');
  assert.ok(calls.at(-1) < exited + 11000, 'and no later than it had to');
});

test('0723 AC2: the 0182 AC3 check still fails when Chromium is left running after a test file runs out of time', skip, async () => {
  // The file drops browserPage's clean-up, as a broken one would, so the runner's SIGTERM ends the file but not Chromium.
  const f = await runOutOfTime(`test('hangs', async () => {
  const b = await browserPage('about:blank'); logPid(b.pid);
  process.removeAllListeners('exit'); for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.removeAllListeners(s);
  await new Promise(() => {});
});
test('never starts', () => {});`);
  assert.notEqual(f.code, 0, f.out);
  assert.equal(f.pids.length, 1, f.out);
  assert.ok(mentioning(f.dir).includes(f.pids[0]), 'Chromium was left running');
  await assert.rejects(goneWithin10s(f), /Chromium still running 10 s after the test file finished/);
  assert.equal(mentioning(f.dir).length, 0, 'the check ended what was left');
});
