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

// ---------- 0668: prepare release 1.3.1 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v1.3.1.md');
const INSTALL = /npx github:luroai\/speck#v1\.3\.1 init/;
// 0684 (release 1.4.0) made the checks below that named 1.3.1 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0668 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0668 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

// Where the section sits, that it describes each change and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0668 AC2: CHANGELOG.md has a 1.3.1 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.3.1');
  assert.ok(s, 'CHANGELOG.md has a 1.3.1 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0668 AC2: CHANGELOG.md\'s 1.3.1 section names the settings the changes save', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.3.1');
  for (const name of ['`builder`', '`builder_model`', '`builder_effort`', '`speck set`']) assert.ok(s.includes(name), name);
});

test('0668 AC2: the 1.3.0 section is still there beside the 1.3.1 one', () => {
  const log = read('CHANGELOG.md');
  for (const v of ['1.3.1', '1.3.0']) assert.ok(changelogSection(log, v), `CHANGELOG.md has a ${v} section`);
});

// Only the version is a fact in the README's status line (0491): the rest of its wording is checked by review.
test('0668 AC3: the README\'s and the brief\'s status lines name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), new RegExp(`Status: ${esc(version())}\\b`), f);
});

test('0668 AC3: the setup prompt still installs the latest release', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

test('0668 AC4: the release notes say how to update to 1.3.1 and name what they change', () => {
  for (const name of ['`builder`', '`builder_model`', '`speck/config.yml`']) assert.ok(notes().includes(name), name);
  assert.match(notes(), /bug-fix release/);
  assert.match(notes(), INSTALL);
});

test('0668 AC4: the release notes link to the changelog heading GitHub makes for the 1.3.1 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (1\.3\.1[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 1.3.1 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v1.3.1/CHANGELOG.md#${anchor})`), anchor);
});

test('0668 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = "speck(0669): Choose a ticket's builder model in the panel";

// 0491: whether the README gives these figures is checked by review.
test('0668 AC5: the Built with speck figures 1.3.1 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 653, cancelled: 16, medianMinutes: 14, medianRounds: 2, firstRound: 311 });
});

test('0668 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});
