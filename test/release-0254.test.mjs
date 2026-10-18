import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, setupPromptProblems } from './support/release.mjs';

// ---------- 0254: prepare release 0.5.4 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.4.md');

// 0282 (release 0.6.0) made the checks below that named 0.5.4 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0254 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0254 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

test('0254 AC2: CHANGELOG.md has a 0.5.4 section', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.5.4');
  assert.ok(s, 'CHANGELOG.md has a 0.5.4 section');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.4 init/, 'it says how to install this release');
});

test('0254 AC3: the README and the brief name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.ok(read(f).includes(version()), f);
});

test('0254 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /#v0\.5\.\d/);
});

test('0254 AC3: no install command in the README names a fixed release', () => {
  // 0253: no install command names a fixed release.
  assert.doesNotMatch(read('README.md'), /speck#v\d/);
});

test('0254 AC4: the release notes say how to install 0.5.4', () => {
  assert.match(notes(), /npx github:luroai\/speck#v0\.5\.4 init/);
});

test('0254 AC4: the release notes link to the changelog heading GitHub makes for the 0.5.4 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.5\.4[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.5.4 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.5.4/CHANGELOG.md#${anchor})`), anchor);
});

test('0254 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

test('0254 AC5: package.json and the newest changelog section name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});

test('0254 AC4: the release notes name speck/config.yml', () => {
  assert.ok(notes().includes('`speck/config.yml`'));
});
