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

// ---------- 0339: prepare release 0.10.1 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.10.1.md');
const INSTALL = /npx github:luroai\/speck#v0\.10\.1 init/;

test('0339 AC1: package.json is version 0.10.1', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.10.1');
});

test('0339 AC1: speck init prints speck 0.10.1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.10\.1: /m);
});

// Where the section sits and that it describes each fix are about how the changelog reads: checked by review.
test('0339 AC2: CHANGELOG.md has a 0.10.1 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.10.1');
  assert.ok(s, 'CHANGELOG.md has a 0.10.1 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0339 AC2: the 0.10.0 and earlier sections of CHANGELOG.md are as the v0.10.0 tag has them', t => {
  const r = spawnSync('git', ['show', 'v0.10.0:CHANGELOG.md'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) return t.skip('the v0.10.0 tag is not in this checkout');
  const from = s => s.slice(s.indexOf('\n## 0.10.0 '));
  assert.equal(from(read('CHANGELOG.md')), from(r.stdout));
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0339 AC3: the README\'s and the brief\'s status lines name 0.10.1', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), /Status: 0\.10\.1\b/, f);
});

test('0339 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /speck#v\d/);
});

test('0339 AC4: the release notes say how to update to 0.10.1 and name what changes for someone upgrading', () => {
  for (const name of ['`speck run`', '`auto_ship`', '`speck/config.yml`']) assert.ok(notes().includes(name), name);
  assert.match(notes(), INSTALL);
});

test('0339 AC4: the release notes link to the changelog heading GitHub makes for the 0.10.1 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.10\.1[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.10.1 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.10.1/CHANGELOG.md#${anchor})`), anchor);
});

test('0339 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = 'speck(0338): Keep a handed-back ticket out of red while speck run is handling it';

test('0339 AC5: the README\'s Built with speck figures match the done tickets this release was built from', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  const f = builtWithSpeckFigures(doneTicketsAt(commit));
  assert.deepEqual(f, { shipped: 322, cancelled: 16, medianMinutes: 13, medianRounds: 1.5, firstRound: 159 });
  const readme = read('README.md');
  for (const figure of [`**${f.shipped} tickets shipped**`, `${f.cancelled} cancelled`, `**${f.medianMinutes} minutes**`,
    `**${f.medianRounds} review rounds**`, `${f.firstRound} tickets were approved`]) assert.ok(readme.includes(figure), figure);
});

test('0339 AC5: package.json and the newest changelog section name 0.10.1', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.10.1');
});
