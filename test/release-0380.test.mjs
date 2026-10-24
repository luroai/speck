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

// ---------- 0380: prepare release 0.13.1 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.13.1.md');
const INSTALL = /npx github:luroai\/speck#v0\.13\.1 init/;

// 0394 (release 0.14.0) made the checks below that named 0.13.1 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0380 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0380 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

// Where the section sits, that it describes each fix and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0380 AC2: CHANGELOG.md has a 0.13.1 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.13.1');
  assert.ok(s, 'CHANGELOG.md has a 0.13.1 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0380 AC2: CHANGELOG.md\'s 0.13.1 section names the commands and settings the fixes use', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.13.1');
  for (const name of ['`speck stop`', '`speck run`', '`speck doctor`', '`reviewer: cursor`', '`reviewer_options.cursor`',
    '`agent`', '`cursor-agent`', 'Close']) assert.ok(s.includes(name), name);
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0380 AC3: the README\'s and the brief\'s status lines name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), new RegExp(`Status: ${esc(version())}\\b`), f);
});

test('0380 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

test('0380 AC4: the release notes say how to update to 0.13.1 and name the commands the fixes use', () => {
  for (const name of ['`speck stop`', '`speck run`', '`speck doctor`', 'Close']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0380 AC4: the release notes link to the changelog heading GitHub makes for the 0.13.1 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.13\.1[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.13.1 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.13.1/CHANGELOG.md#${anchor})`), anchor);
});

test('0380 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = "speck(0379): Keep a pop-up's Close button in view";

// 0394 worked the README's figures out again, so this checks only the figures 0.13.1 was built from.
test('0380 AC5: the Built with speck figures 0.13.1 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 371, cancelled: 16, medianMinutes: 12, medianRounds: 1, firstRound: 186 });
});

test('0380 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});
