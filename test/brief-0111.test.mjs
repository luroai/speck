import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';

// ---------- 0111: the one-build-at-a-time principle in the brief ----------

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const brief = () => read('docs/brief.md');
const principles = () => brief().match(/^## Principles\n([\s\S]*?)^## /m)[1];
// The numbered principle on one build at a time, with the lines that follow it up to the next numbered principle.
const principle = () => {
  const m = principles().match(/^\d+\. \*\*One build at a time\.\*\*[\s\S]*?(?=^\d+\. |(?![\s\S]))/m);
  assert.ok(m, 'the Principles list has a "One build at a time" principle');
  return m[0];
};

test('AC1: the Principles list says speck runs one build at a time (WIP 1), each in its own worktree', () => {
  const p = principle();
  assert.match(p, /speck runs one build at a time \(WIP 1\)/);
  assert.match(p, /each in its own worktree/);
  assert.match(p, /keep shaping ideas and tickets on the base branch while builds and ships are handled/);
});

test('AC1: the principle says the user can create tickets, set them ready and walk away', () => {
  assert.match(principle(), /create tickets, set them ready and walk away/);
});

test('AC2: the principle gives the reasons: bottleneck, simplicity, users, isolation, cost and coming back', () => {
  const p = principle();
  assert.match(p, /value is its gates/, 'bottleneck');
  assert.match(p, /your attention, not agent time/, 'bottleneck');
  for (const word of ['order', '`after:` dependencies', 'conflicts', 'a broken base branch', 'starts from the latest base branch']) {
    assert.ok(p.includes(word), `simplicity: ${word}`);
  }
  assert.match(p, /shape product/, 'users');
  assert.match(p, /debug races/, 'users');
  assert.match(p, /worktrees for isolation/i, 'isolation versus parallelism');
  assert.match(p, /running builds side by side is a different thing/i, 'isolation versus parallelism');
  assert.match(p, /cost is throughput/i, 'cost');
  // 0225 replaced the reason that parallel builds would come back only as a designed feature with raising max_parallel_builds being supported.
  assert.match(p, /raising `max_parallel_builds` in `speck\/config\.yml` is supported/i, 'coming back');
});

// 0194 replaced "Each build ships its own ticket: there is no separate shipping agent" with speck run's one ship queue.
test('AC3: the brief says builds end at approved and one ship queue in speck run ships tickets', () => {
  assert.match(principle(), /builds end at approved, and one ship queue in `speck run` ships tickets one at a time/i);
});

test('AC3: no part of the brief describes a shipping agent as part of speck', () => {
  assert.doesNotMatch(brief().replace(/no separate shipping agent/gi, ''), /shipping agent/i);
});

// Wording that says or implies builds run side by side.
const PARALLEL = /builds? (run|running|go|going) (in parallel|side by side|at once|at the same time)|among the builds running|several builds|other builds running/i;

test('AC4: no part of the brief, the README or the skills says builds run in parallel', () => {
  const files = ['docs/brief.md', 'README.md', ...fs.readdirSync(path.join(ROOT, 'skills')).map(s => `skills/${s}/SKILL.md`)];
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
