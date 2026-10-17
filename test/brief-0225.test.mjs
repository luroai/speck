import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';

// ---------- 0225: the brief says raising max_parallel_builds is supported ----------
// 0267 removed the checks on the brief's and the README's wording, leaving the one on the setting's default.

test('0225 AC2: templates/config.yml builds one at a time unless you raise max_parallel_builds', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'), /^max_parallel_builds: 1\s+# how many builds speck run keeps going at once/m);
});
