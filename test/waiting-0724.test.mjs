// 0724: the 0166 AC1 and 0217 AC2 waited-time checks use bounds measured in the test, not a fixed ±5 s or 10 s limit.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';
import { testBody } from './support/quick-run.mjs';
import { assertCounted, assertWrittenSince } from './support/timing.mjs';

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
const ac1 = name => testBody(src('waiting-0166.test.mjs'), name);
const ac2 = name => testBody(src('stopped-wait-0217.test.mjs'), name);

// Fixed ±5 s (`near`) or a fixed 10 s window of "now" leave no room for a speck command that takes longer.
const fixedTolerance = t => /\bnear\s*\(/.test(t) || /Math\.abs\([^)]*\)\s*(?:<=|<)\s*5\b/.test(t) || /<\s*10000\b/.test(t);

// ---------- AC1: measured bounds, no fixed ±5 s or 10 s ----------

test('0724 AC1: 0166 AC1 checks waited_seconds with assertCounted, and has no fixed ±5 s tolerance', () => {
  for (const name of [
    '0166 AC1: blocking records the time, and leaving blocked adds the stretch to waited_seconds and clears it',
    '0166 AC1: a ticket that blocks more than once adds each stretch, and setting blocked again keeps the first time',
    '0166 AC1: cancelling a blocked ticket adds its blocked stretch and clears blocked_at',
  ]) {
    const t = ac1(name);
    assert.match(t, /assertCounted\(/, name);
    assert.ok(!fixedTolerance(t), `${name} still has a fixed ±5 s or 10 s check`);
  }
  assert.doesNotMatch(src('waiting-0166.test.mjs'), /\bconst near\b/, 'near is gone from the file');
});

test('0724 AC1: 0217 AC2 checks noticed times with measured bounds, and has no fixed ±5 s or 10 s limit', () => {
  const first = ac2("0217 AC2: a killed build\\'s stop is recorded when speck first notices it, and stays the same after");
  assert.match(first, /assertWrittenSince\(/, 'noticed now');
  assert.match(first, /assert\.equal\([^,]+,\s*marked/, 'backdated time is the mark, not an age with a tolerance');
  assert.ok(!fixedTolerance(first), 'first AC2 test');
  const other = ac2('0217 AC2: a mark left by an earlier build of the ticket is not its stop');
  assert.match(other, /assertWrittenSince\(/, 'noticed now');
  assert.ok(!fixedTolerance(other), 'other AC2 test');
  assert.doesNotMatch(src('stopped-wait-0217.test.mjs'), /\bconst near\b/, 'near is gone from the file');
});

// ---------- AC2: still fails when the wait is a minute out ----------

test('0724 AC2: assertCounted fails when the counted wait is a minute out', () => {
  const since = Date.now();
  assert.throws(() => assertCounted(540, 600, since, 'a minute short'), /isn't between/);
  assert.throws(() => assertCounted(660, 600, since, 'a minute long'), /isn't between/);
});

test('0724 AC2: assertWrittenSince fails when the written time is a minute out', () => {
  const before = Date.now();
  assert.throws(() => assertWrittenSince(new Date(before - 60000).toISOString(), before, 'a minute early'), /isn't between/);
  assert.throws(() => assertWrittenSince(new Date(before + 60000).toISOString(), before, 'a minute late'), /isn't between/);
});

test('0724 AC2: the 0166 AC1 and 0217 AC2 checks still name the waits they expect', () => {
  assert.match(ac1('0166 AC1: blocking records the time, and leaving blocked adds the stretch to waited_seconds and clears it'), /assertCounted\([^,]+,\s*600,/);
  assert.match(ac1('0166 AC1: a ticket that blocks more than once adds each stretch, and setting blocked again keeps the first time'), /assertCounted\([^,]+,\s*500,/);
  assert.match(ac1('0166 AC1: cancelling a blocked ticket adds its blocked stretch and clears blocked_at'), /assertCounted\([^,]+,\s*300,/);
  assert.match(ac2("0217 AC2: a killed build\\'s stop is recorded when speck first notices it, and stays the same after"), /realAgo\(300\)/);
});

// ---------- AC3: passes when a speck command takes more than 5 s ----------

test('0724 AC3: assertCounted passes when more than 5 s went by between the mark and the check', () => {
  // As if backdating at `since`, then a speck command took 6 s before the count was read.
  const since = Date.now() - 6000;
  assertCounted(605, 600, since, 'command took 6 s');
});

test('0724 AC3: assertWrittenSince passes when more than 5 s went by since the write began', () => {
  const before = Date.now() - 6000;
  assertWrittenSince(new Date(before + 100).toISOString(), before, 'written while a slow command ran');
});
