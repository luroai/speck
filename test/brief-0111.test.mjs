import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';

// ---------- 0111: the one-build-at-a-time principle in the brief ----------
// 0267 removed the checks on the brief's and the README's wording, leaving the one on the skills.

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Wording that says or implies builds run side by side.
const PARALLEL = /builds? (run|running|go|going) (in parallel|side by side|at once|at the same time)|among the builds running|several builds|other builds running/i;

test('AC4: no skill says builds run in parallel', () => {
  const files = [...fs.readdirSync(path.join(ROOT, 'skills')).map(s => `skills/${s}/SKILL.md`)];
  for (const f of files) {
    const hit = read(f).match(PARALLEL);
    assert.equal(hit, null, `${f}: "${hit?.[0]}"`);
  }
});

test('AC4 self-check: the check catches the wording this ticket removed', () => {
  for (const s of ['Builds run in parallel, but', 'so builds running in parallel don\'t clash', 'it keeps its place among the builds running']) {
    assert.match(s, PARALLEL, s);
  }
});
