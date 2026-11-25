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

// ---------- 0732: prepare release 1.6.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v1.6.0.md');
const INSTALL = /npx github:luroai\/speck#v1\.6\.0 init/;
// The day this release was built, when it refreshed the price table.
const BUILT_ON = '2026-11-24';
// 0753 (release 1.6.1) made the checks below that named 1.6.0 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0732 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0732 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

// Where the section sits, that it describes each change and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0732 AC2: CHANGELOG.md has a 1.6.0 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.6.0');
  assert.ok(s, 'CHANGELOG.md has a 1.6.0 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0732 AC2: CHANGELOG.md\'s 1.6.0 section names the commands and settings the changes add', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.6.0');
  for (const name of ['`machine_parallel_builds`', '`max_parallel_builds`', '`speck config set machine_parallel_builds <n>`',
    '`speck set <id> level ""`', '`speck answer`', '`speck logins set`', '`builder_bench`', '`after:`']) assert.ok(s.includes(name), name);
});

test('0732 AC2: the 1.5.0 section is still there beside the 1.6.0 one', () => {
  const log = read('CHANGELOG.md');
  for (const v of ['1.6.0', '1.5.0']) assert.ok(changelogSection(log, v), `CHANGELOG.md has a ${v} section`);
});

// Only the version is a fact in the README's status line (0491): the rest of its wording is checked by review.
test('0732 AC3: the README\'s and the brief\'s status lines name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), new RegExp(`Status: ${esc(version())}\\b`), f);
});

test('0732 AC3: the setup prompt still installs the latest release', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

// A later release refreshes the table again, so this checks it was taken no earlier than the day this was built.
test('0732 AC3: the shipped price table was taken on or after the day 1.6.0 was built', () => {
  const table = JSON.parse(read('scripts/prices.json'));
  assert.match(table.taken, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(table.taken >= BUILT_ON, table.taken);
  assert.ok(Object.keys(table.models).length > 0, 'it has rates');
});

test('0732 AC4: the release notes say how to update to 1.6.0 and name what changes on upgrading', () => {
  for (const name of ['`speck/config.yml`', '`machine_parallel_builds`', '`speck config set machine_parallel_builds <n>`', '`sonnet`']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0732 AC4: the release notes link to the changelog heading GitHub makes for the 1.6.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (1\.6\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 1.6.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v1.6.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0732 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = "speck(0730): Make Settings' controls look like Cursor's";

// 0491: whether the README gives these figures is checked by review.
test('0732 AC5: the Built with speck figures 1.6.0 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 719, cancelled: 18, medianMinutes: 15, medianRounds: 2, firstRound: 341 });
});

test('0732 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});
