// 0741: tests that read a nested run's TAP name the reporter, as Node 24 prints its spec reporter by default.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');

test('0741 AC1: tmp-cleanup asks for TAP from the run whose fail count it reads', () => {
  assert.match(read('./tmp-cleanup.test.mjs'), /\['--test', '--test-reporter=tap', file\]/);
});

test('0741 AC2: related-0676 asks for TAP from every run speck makes for it', () => {
  const runs = read('./related-0676.test.mjs').match(/'node --test[^']*'/g);
  assert.ok(runs?.length >= 2, `its node --test commands: ${runs}`);
  for (const run of runs) assert.match(run, /--test-reporter=tap/);
});
