import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';

// ---------- 0225: the brief says raising max_parallel_builds is supported ----------
// 0267 removed the checks on the brief's and the README's wording, leaving the checks on the setting's default and the names the brief gives.

test('0225 AC2: templates/config.yml builds one at a time unless you raise max_parallel_builds', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'), /^max_parallel_builds: 1\s+# how many builds speck run keeps going at once/m);
});

test('0225 AC2: the brief names max_parallel_builds, speck/config.yml and after:', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  for (const s of ['`max_parallel_builds`', '`speck/config.yml`', '`after:`']) assert.ok(brief.includes(s), s);
});
