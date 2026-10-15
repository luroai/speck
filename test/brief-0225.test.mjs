import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';

// ---------- 0225: the brief says raising max_parallel_builds is supported ----------

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const brief = () => read('docs/brief.md');
// Principle 7 with its reasons, up to the next numbered principle or section.
const principle = () => {
  const m = brief().match(/^\d+\. \*\*One build at a time\.\*\*[\s\S]*?(?=^\d+\. |^## )/m);
  assert.ok(m, 'the brief has a "One build at a time" principle');
  return m[0];
};
const reasons = () => principle().split(/Why:\n/)[1];

test('0225 AC1: the reasons say one build at a time is the default and raising max_parallel_builds is supported', () => {
  const r = reasons();
  assert.ok(r, 'principle 7 has reasons after "Why:"');
  assert.match(r, /one build at a time is the default/i);
  assert.match(r, /raising `max_parallel_builds` in `speck\/config\.yml` is supported/i);
});

test('0225 AC1: the reasons no longer say tickets are always built one after another, or that parallel builds would come back only as a designed feature', () => {
  const r = reasons();
  assert.doesNotMatch(r, /^\s*- \*\*The cost is throughput\.\*\* Tickets are built and shipped one after another\./m);
  assert.doesNotMatch(r, /deliberately designed feature/i);
  assert.doesNotMatch(r, /would come back/i);
});

test('0225 AC2: the brief, the README and templates/config.yml agree on one build at a time unless you raise max_parallel_builds', () => {
  assert.match(principle(), /one build at a time \(WIP 1\) unless you change it/);
  assert.match(principle(), /`max_parallel_builds` in `speck\/config\.yml` sets how many builds `speck run` keeps going at once: 1 unless you change it/);
  assert.match(read('README.md'), /builds one at a time unless you raise `max_parallel_builds`/);
  assert.match(read('templates/config.yml'), /^max_parallel_builds: 1\s+# how many builds speck run keeps going at once/m);
  // The workflow diagram doesn't say speck run builds strictly one at a time.
  assert.match(brief(), /→ speck run\s+→ starts \/speck-build for the next ready ticket, one at a time by default,/);
});

test('0225 AC3: 0111 checks the new wording in place of the wording AC1 removes', () => {
  const t = read('test/brief-0111.test.mjs');
  assert.doesNotMatch(t, /deliberately designed feature/);
  assert.match(t, /raising `max_parallel_builds`/);
});
