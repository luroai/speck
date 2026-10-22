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

// ---------- 0367: prepare release 0.12.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.12.0.md');
const INSTALL = /npx github:luroai\/speck#v0\.12\.0 init/;

test('0367 AC1: package.json is version 0.12.0', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.12.0');
});

test('0367 AC1: speck init prints speck 0.12.0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.12\.0: /m);
});

// Where the section sits, that it describes each fix and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0367 AC2: CHANGELOG.md has a 0.12.0 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.12.0');
  assert.ok(s, 'CHANGELOG.md has a 0.12.0 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0367 AC3: the README\'s and the brief\'s status lines name 0.12.0', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), /Status: 0\.12\.0\b/, f);
});

test('0367 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /speck#v\d/);
});

test('0367 AC4: the release notes say how to update to 0.12.0 and name what changes for someone upgrading', () => {
  for (const name of ['Review pack', 'Ship', 'Ask for changes', 'Escape', 'Reload page', '`speck/config.yml`', '`prefers-reduced-motion`'])
    assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0367 AC2: CHANGELOG.md\'s 0.12.0 section names the words and settings the panel changes show', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.12.0');
  for (const name of ['Finished · read the document', 'Review pack', 'Ask for changes', 'Escape', 'Reload page', 'Needs you',
    '`prefers-reduced-motion: reduce`', '`auto_ship`']) assert.ok(s.includes(name), name);
});

test('0367 AC4: the release notes link to the changelog heading GitHub makes for the 0.12.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.12\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.12.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.12.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0367 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = "speck(0366): Open the Foreman's detail in a pop-up over the whole panel";

test('0367 AC5: the README\'s Built with speck figures match the done tickets this release was built from', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  const f = builtWithSpeckFigures(doneTicketsAt(commit));
  assert.deepEqual(f, { shipped: 350, cancelled: 16, medianMinutes: 12, medianRounds: 1, firstRound: 174 });
  const readme = read('README.md');
  for (const figure of [`**${f.shipped} tickets shipped**`, `${f.cancelled} cancelled`, `**${f.medianMinutes} minutes**`,
    `**${f.medianRounds} review round${f.medianRounds === 1 ? '' : 's'}**`, `${f.firstRound} tickets were approved`]) assert.ok(readme.includes(figure), figure);
});

test('0367 AC5: package.json and the newest changelog section name 0.12.0', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.12.0');
});
