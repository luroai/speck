import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { heavyLimit, readTimes, timesFile } from './support/suite.mjs';
import { fixture, runWith, mostAtOnce, overlapped, names, waiting } from './support/suite-fixture.mjs';
import { summariseTap, failingTestFiles } from '../scripts/tap.mjs';

test('0233 AC1: heavy files run at most 2 at a time on machines with 8 cores or fewer, with no limit of their own on bigger ones', () => {
  for (const cores of [1, 2, 4, 8]) assert.equal(heavyLimit(cores), 2, `${cores} cores`);
  for (const cores of [9, 12, 16, 64]) assert.equal(heavyLimit(cores), null, `${cores} cores`);
});

test('0233 AC1: with 8 cores, the heavy files run at most 2 at a time, while the others run as many at a time as before, beside them', () => {
  const heavy = names('heavy', 5), light = names('light', 6);
  const dir = fixture({ ...waiting(heavy, { ms: 1000 }), ...waiting(light, { ms: 1000 }) });
  const r = runWith(dir, { cores: 8, concurrency: 4, heavy: heavy.map(n => `test/${n}`) });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(mostAtOnce(dir, heavy), 2, 'heavy files at once');
  assert.equal(mostAtOnce(dir, light), 4, 'other files at once');
  assert.ok(overlapped(dir, heavy, light), 'the heavy files run beside the others');
});

test('0233 AC1: with more than 8 cores, the heavy files run as many at a time as the others', () => {
  const heavy = names('heavy', 5);
  const dir = fixture(waiting(heavy, { ms: 1000 }));
  const r = runWith(dir, { cores: 16, concurrency: 4, heavy: heavy.map(n => `test/${n}`) });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(mostAtOnce(dir, heavy), 4);
});

test('0233 AC2: split between heavy and other files, one run still runs every file once, fails when a test fails, and its output is read as before', () => {
  const heavy = ['h1.test.mjs', 'h2.test.mjs', 'h3.test.mjs'], light = ['l1.test.mjs', 'l2.test.mjs', 'l3.test.mjs'];
  const dir = fixture({ ...waiting(heavy, { ms: 200 }), ...waiting(light, { ms: 200 }), 'h2.test.mjs': { ms: 200, fail: true }, 'l3.test.mjs': { ms: 200, fail: true } });
  const r = runWith(dir, { cores: 8, concurrency: 3, heavy: heavy.map(n => `test/${n}`) });
  assert.equal(r.status, 1, r.stderr);
  const log = fs.readFileSync(path.join(dir, 'runs.log'), 'utf8').trim().split('\n').filter(l => l.startsWith('start ')).map(l => l.slice(6));
  assert.deepEqual(log.sort(), [...heavy, ...light].sort(), 'every file ran once');
  assert.match(r.stdout, /^TAP version 13$/m);
  assert.equal(r.stdout.match(/^1\.\.\d+$/gm)?.join(), '1..12', 'one plan for the whole run');
  const numbers = [...r.stdout.matchAll(/^(?:not )?ok (\d+) - /gm)].map(m => Number(m[1]));
  assert.deepEqual(numbers, Array.from({ length: 12 }, (_, i) => i + 1), 'the top-level tests are numbered in turn');
  for (const total of ['tests', 'pass', 'fail']) assert.equal(r.stdout.match(new RegExp(`^# ${total} \\d+$`, 'gm'))?.length, 1, `one # ${total} line`);
  const summary = summariseTap(r.stdout, '0233', 'out.txt');
  assert.match(summary, /^# tests 12$/m);
  assert.match(summary, /^# pass 10$/m);
  assert.match(summary, /^# fail 2$/m);
  assert.match(summary, /Failing tests \(2\):/);
  assert.deepEqual(failingTestFiles(r.stdout).map(t => ({ ...t, file: path.relative(dir, t.file) })).sort((a, b) => a.name.localeCompare(b.name)),
    [{ name: 'h2.test.mjs checks', file: path.join('test', 'h2.test.mjs') }, { name: 'l3.test.mjs checks', file: path.join('test', 'l3.test.mjs') }]);
  assert.deepEqual([...readTimes(timesFile(dir)).keys()].sort(), [...heavy, ...light].map(n => `test/${n}`).sort(), 'every file\'s time is recorded');
});

test('0233 AC2: split between heavy and other files, a run whose tests all pass exits 0, and a heavy file that can\'t run fails it', () => {
  const dir = fixture({ 'h1.test.mjs': {}, 'l1.test.mjs': {} });
  const options = { cores: 8, concurrency: 2, heavy: ['test/h1.test.mjs', 'test/broken.test.mjs'] };
  const passing = runWith(dir, options);
  assert.equal(passing.status, 0, passing.stderr);
  assert.match(passing.stdout, /^# pass 4$/m);
  fs.writeFileSync(path.join(dir, 'test', 'broken.test.mjs'), "throw new Error('it broke on loading');\n");
  const broken = runWith(dir, options);
  assert.equal(broken.status, 1, broken.stderr);
  assert.match(summariseTap(broken.stdout, '0233', 'out.txt'), /Failing tests \(1\):\nnot ok - .*broken\.test\.mjs/);
});
