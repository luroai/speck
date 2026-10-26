import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, setupPromptProblems } from './support/release.mjs';
import { builtWithSpeckFigures, doneTicketsAt } from './support/figures.mjs';
import { commitBySubject } from './support/commits.mjs';

// ---------- 0515: prepare release 0.16.1 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.16.1.md');
const INSTALL = /npx github:luroai\/speck#v0\.16\.1 init/;

test('0515 AC1: package.json is version 0.16.1', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.16.1');
});

test('0515 AC1: speck init prints speck 0.16.1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.16\.1: /m);
});

// Where the section sits and that it describes each change are about how the changelog reads: checked by review.
test('0515 AC2: CHANGELOG.md has a 0.16.1 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.16.1');
  assert.ok(s, 'CHANGELOG.md has a 0.16.1 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0515 AC2: CHANGELOG.md\'s 0.16.1 section names the settings and commands the changes use', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.16.1');
  for (const name of ['`allow_same_model_review`', '`speck config set allow_same_model_review`', '`speck run`']) assert.ok(s.includes(name), name);
});

test('0515 AC2: CHANGELOG.md\'s 0.16.0 and earlier sections are as v0.16.0 left them', t => {
  const tagged = spawnSync('git', ['show', 'v0.16.0:CHANGELOG.md'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (tagged.status !== 0) return t.skip('no v0.16.0 tag in this checkout');
  const from = s => s.slice(s.indexOf('\n## 0.16.0 '));
  assert.equal(from(read('CHANGELOG.md')), from(tagged.stdout));
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0515 AC3: the README\'s and the brief\'s status lines name 0.16.1', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), /Status: 0\.16\.1\b/, f);
});

test('0515 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

test('0515 AC4: the release notes say how to update to 0.16.1 and name what changed', () => {
  for (const name of ['`allow_same_model_review`', '`speck run`']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0515 AC4: the release notes link to the changelog heading GitHub makes for the 0.16.1 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.16\.1[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.16.1 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.16.1/CHANGELOG.md#${anchor})`), anchor);
});

test('0515 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = 'speck(0514): Keep trackpad lane swipes working after each swipe';

// 0491: whether the README gives these figures is checked by review.
test('0515 AC5: the Built with speck figures 0.16.1 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 498, cancelled: 16, medianMinutes: 13, medianRounds: 1, firstRound: 254 });
});

test('0515 AC5: package.json and the newest changelog section name 0.16.1', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.16.1');
});
