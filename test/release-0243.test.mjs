import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, setupPromptProblems } from './support/release.mjs';

// ---------- 0243: prepare release 0.5.2 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.2.md');

// 0248 (release 0.5.3) made the checks below that named 0.5.2 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0243 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0243 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

test('0243 AC2: CHANGELOG.md has a 0.5.2 section', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.5.2');
  assert.ok(s, 'CHANGELOG.md has a 0.5.2 section');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.2 init/, 'it says how to install this release');
});

test('0243 AC3: the README setup prompt installs the latest release', () => {
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

test('0243 AC3: the README and the brief name the current version', () => {
  // 0491: the version on the status line, the one fact here the README's tests check.
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), new RegExp(`Status: ${version().replace(/\./g, '\\.')}\\b`), f);
});

test('0243 AC4: the release notes say how to install 0.5.2', () => {
  assert.match(notes(), /npx github:luroai\/speck#v0\.5\.2 init/);
});

test('0243 AC4: the release notes link to the changelog heading GitHub makes for the 0.5.2 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.5\.2[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.5.2 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.5.2/CHANGELOG.md#${anchor})`), anchor);
});

test('0243 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

test('0243 AC5: the brief names the release notes file a workflow publishes each release from', () => {
  assert.ok(read('docs/brief.md').includes('`docs/releases/v<version>.md`'));
});

test('0243 AC6: package.json, the newest changelog section name the same version, and the setup prompt installs the latest release', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});
