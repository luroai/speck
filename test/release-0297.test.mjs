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

// ---------- 0297: prepare release 0.7.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.7.0.md');
const INSTALL = /npx github:luroai\/speck#v0\.7\.0 init/;

// 0298 (release 0.8.0) made the checks below that named 0.7.0 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0297 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0297 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

test('0297 AC2: CHANGELOG.md has a 0.7.0 section above 0.6.0, naming how to install it and what the shipped tickets added', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.7.0');
  assert.ok(s, 'CHANGELOG.md has a 0.7.0 section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.6.0')), '0.7.0 comes above 0.6.0');
  assert.match(s, INSTALL, 'it says how to install this release');
  for (const name of ['speck agents', 'builder: codex', 'builder: cursor', 'reviewer: claude', 'speck config set builder']) assert.ok(s.includes(name), name);
});

test('0297 AC2: the 0.6.0 and earlier sections are as v0.6.0 tagged them', t => {
  const tagged = spawnSync('git', ['show', 'v0.6.0:CHANGELOG.md'], { cwd: ROOT, encoding: 'utf8' });
  if (tagged.status !== 0) return t.skip('no v0.6.0 tag in this checkout');
  const from = text => text.slice(text.indexOf('## 0.6.0'));
  assert.equal(from(read('CHANGELOG.md')), from(tagged.stdout));
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0297 AC3: the README\'s and the brief\'s status lines name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), new RegExp(`Status: ${esc(version())}\\b`), f);
});

test('0297 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /speck#v\d/);
});

test('0297 AC4: the release notes say how to install or update 0.7.0 and name the new settings and command', () => {
  for (const name of ['speck agents', 'builder: codex', 'builder: cursor', 'reviewer: claude', 'build_command', '`speck/config.yml`']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0297 AC4: the release notes link to the changelog heading GitHub makes for the 0.7.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.7\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.7.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.7.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0297 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = 'speck(0293): Switch the builder from the panel and in setup';

// 0298 worked the README's figures out again, so this checks only the figures 0.7.0 was built from.
test('0297 AC5: the Built with speck figures 0.7.0 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 272, cancelled: 16, medianMinutes: 13, medianRounds: 1, firstRound: 139 });
});

test('0297 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});
