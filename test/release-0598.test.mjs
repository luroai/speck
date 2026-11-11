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

// ---------- 0598: prepare release 1.0.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v1.0.0.md');
const INSTALL = /npx github:luroai\/speck#v1\.0\.0 init/;
// The day this release was built, when it refreshed the price table.
const BUILT_ON = '2026-11-10';
// 0640 (release 1.1.0) made the checks below that named 1.0.0 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0598 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0598 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

// Where the section sits, that it describes each change and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0598 AC2: CHANGELOG.md has a 1.0.0 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.0.0');
  assert.ok(s, 'CHANGELOG.md has a 1.0.0 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0598 AC2: CHANGELOG.md\'s 1.0.0 section names the setting and fields the changes add', () => {
  const s = changelogSection(read('CHANGELOG.md'), '1.0.0');
  for (const name of ['`speck_name`', '`speck config set speck_name', '`Other options:`', '`speck status --json`', '`watch`']) assert.ok(s.includes(name), name);
});

// What the pictures show is checked by review, by looking at them. That they were taken again is a fact: they differ
// from the ones 0597 took, which this release found in the README.
const PICTURES_BEFORE = 'speck(0597): Bring the docs up to date with the new panel';
test('0598 AC3: the README\'s demo pictures were taken again since 0597', t => {
  const commit = commitBySubject(PICTURES_BEFORE);
  if (!commit) return t.skip('0597\'s commit is not in this checkout\'s history');
  for (const f of ['docs/images/demo-light.png', 'docs/images/demo-dark.png']) {
    const then = spawnSync('git', ['show', `${commit}:${f}`], { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 });
    assert.equal(then.status, 0, `${f} was in 0597's commit`);
    assert.ok(!fs.readFileSync(path.join(ROOT, f)).equals(then.stdout), `${f} has been taken again`);
  }
});

// Only the version is a fact in the README's status line (0491): that it no longer says public preview there is
// checked by review. The brief's status line is checked for both.
test('0598 AC3: the README\'s and the brief\'s status lines name the current version, and the brief\'s no longer says public preview', () => {
  const status = new RegExp(`Status: ${esc(version())}\\b`);
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), status, f);
  const line = read('docs/brief.md').split('\n').find(l => status.test(l));
  assert.doesNotMatch(line, /preview/i);
});

test('0598 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

// A later release refreshes the table again, so this checks it was taken no earlier than the day this was built.
test('0598 AC3: the shipped price table was taken on or after the day 1.0.0 was built', () => {
  const table = JSON.parse(read('scripts/prices.json'));
  assert.match(table.taken, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(table.taken >= BUILT_ON, table.taken);
  assert.ok(Object.keys(table.models).length > 0, 'it has rates');
});

test('0598 AC4: the release notes say how to update to 1.0.0 and name the new setting', () => {
  for (const name of ['`speck_name`', '`speck config set speck_name']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0598 AC4: the release notes link to the changelog heading GitHub makes for the 1.0.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (1\.0\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 1.0.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v1.0.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0598 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = 'speck(0617): End a draft\'s full view in Set ready';

// 0491: whether the README gives these figures is checked by review.
test('0598 AC5: the Built with speck figures 1.0.0 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 604, cancelled: 16, medianMinutes: 14, medianRounds: 2, firstRound: 296 });
});

test('0598 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});
