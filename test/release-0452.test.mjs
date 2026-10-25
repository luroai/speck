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

// ---------- 0452: prepare release 0.15.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.15.0.md');
const INSTALL = /npx github:luroai\/speck#v0\.15\.0 init/;

test('0452 AC1: package.json is version 0.15.0', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.15.0');
});

test('0452 AC1: speck init prints speck 0.15.0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.15\.0: /m);
});

// Where the section sits, that it describes each change and that the older sections are unchanged are about how the
// changelog reads: checked by review.
test('0452 AC2: CHANGELOG.md has a 0.15.0 section, naming how to install it', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.15.0');
  assert.ok(s, 'CHANGELOG.md has a 0.15.0 section');
  assert.match(s, INSTALL, 'it says how to install this release');
});

test('0452 AC2: CHANGELOG.md\'s 0.15.0 section names the commands and settings the changes use', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.15.0');
  for (const name of ['`speck agents`', '`speck agents add', '`speck agents remove', '`builder_effort`', '`watch`', '`watch_agent`',
    '`watch_model`', '`watch_effort`', '`foreman_fixing`', '`speck answer', '`speck dismiss', '`speck foreman', '`kind: task`',
    '`kind: code`', '`task: document`', '`speck test --related`', '`speck status`', '`speck set`', '`speck run`']) assert.ok(s.includes(name), name);
});

// Only the version is a fact: the rest of the status line's wording is checked by review.
test('0452 AC3: the README\'s and the brief\'s status lines name 0.15.0', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.match(read(f), /Status: 0\.15\.0\b/, f);
});

test('0452 AC3: the setup prompt still installs the latest release, as 0253 left it', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

test('0452 AC4: the release notes say how to update to 0.15.0 and name what\'s new', () => {
  for (const name of ['Pipeline log', 'Plan', 'Build', 'Shipped', 'Settings', '`watch`', '`kind: task`', '`speck answer`']) {
    assert.ok(notes().includes(name), name);
  }
  assert.match(notes(), INSTALL);
});

test('0452 AC4: the release notes link to the changelog heading GitHub makes for the 0.15.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.15\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.15.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.15.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0452 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message: main as it was when this ticket was built.
const BUILT_FROM = 'speck(0500): Keep the 0484 copy test passing when the machine is busy';

// 0491: whether the README gives these figures is checked by review.
test('0452 AC5: the Built with speck figures 0.15.0 was built from match the done tickets then', t => {
  const commit = commitBySubject(BUILT_FROM);
  if (!commit) return t.skip('the commit this release was built from is not in this checkout\'s history');
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(commit)), { shipped: 484, cancelled: 16, medianMinutes: 13, medianRounds: 1, firstRound: 245 });
});

test('0452 AC5: package.json and the newest changelog section name 0.15.0', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.15.0');
});
