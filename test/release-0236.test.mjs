import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, setupPromptProblems, builtWithSpeckFigures, readmeFigures, doneTicketsAt } from './support/release.mjs';
import { commitBySubject } from './support/commits.mjs';

// ---------- 0236: prepare release 0.5.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.0.md');
const notesSection = heading => notes().match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';

// 0226 (release 0.5.1) made the checks below that named 0.5.0 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0236 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0236 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

test('0236 AC2: CHANGELOG.md has a 0.5.0 section above 0.4.0, under a few headings', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.5.0');
  assert.ok(s, 'CHANGELOG.md has a 0.5.0 section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.4.0')), '0.5.0 comes above 0.4.0');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 6, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /since 0\.4\.0/, 'it says what changed since 0.4.0');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.0 init/, 'it says how to install this release');
});

test('0236 AC2: the 0.4.0 section is unchanged', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.4.0');
  assert.ok(s, 'CHANGELOG.md still has a 0.4.0 section');
  // The hash of the 0.4.0 section as tagged in v0.4.0.
  assert.equal(crypto.createHash('sha256').update(s).digest('hex'), 'bec30aebab04cfdcd45b6ef52ef2edc1de344c96f976390a33a5baa4eaae49f3');
});

test('0236 AC3: the README setup prompt installs the latest release', () => {
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /#v0\.4\.0/);
});

test('0236 AC3: the README and brief status lines say the current version, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, new RegExp(`\\b${esc(version())}, a public preview`));
    assert.doesNotMatch(line, /0\.4\.0/);
  }
});

// 0250 renamed the README's How you work with it to How it works, so this checks that section instead.
test('0236 AC3: the README\'s How it works says a build runs the ticket\'s own tests and the whole suite runs when it ships', () => {
  const s = read('README.md').match(/^## How it works\n([\s\S]*?)(?=^## )/m)?.[1] || '';
  assert.match(s, /runs the ticket's own tests/);
  assert.match(s, /whole suite runs when (?:a|the) ticket ships/);
});

test('0236 AC4: the release notes say it is a minor release, the main changes, how to install and how to upgrade', () => {
  const n = notes();
  const intro = n.split(/^## /m)[0];
  assert.equal(intro.trim().split(/\n\s*\n/).length, 1, 'one short opening paragraph');
  assert.match(intro, /0\.5\.0 is a minor release/);
  assert.match(intro, /one whole test run, when it ships/);
  assert.match(intro, /no longer take over the computer/);
  const changes = [...notesSection('What matters most').matchAll(/^- \*\*/gm)];
  assert.ok(changes.length >= 3 && changes.length <= 5, `three to five main changes, not ${changes.length}`);
  assert.match(notesSection('Install'), /npx github:luroai\/speck#v0\.5\.0 init/);
  const upgrade = notesSection('Upgrading from 0\\.4\\.0');
  assert.match(upgrade, /reviewer no longer sees a whole-suite run/);
  assert.match(upgrade, /`speck test --files` waits its turn/);
});

test('0236 AC4: the release notes link to the changelog heading GitHub makes for the 0.5.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.5\.0[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.5.0 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.5.0/CHANGELOG.md#${anchor})`), anchor);
});

test('0236 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message. Its done tickets are what the figures were worked out from.
const builtFrom = () => commitBySubject('speck(0239): Keep the computer usable while speck runs tests');

// 0226 (release 0.5.1) set the figures again, so this checks the README as this release shipped it.
test('0236 AC5: the README\'s Built with speck figures match the done tickets this release was built from', () => {
  const figures = builtWithSpeckFigures(doneTicketsAt(builtFrom()));
  const shipped = commitBySubject('speck(0236): prepare release 0.5.0');
  assert.ok(shipped, 'found the commit');
  const readmeThen = spawnSync('git', ['show', `${shipped}:README.md`], { cwd: ROOT, encoding: 'utf8' }).stdout;
  assert.deepEqual(readmeFigures(readmeThen), figures);
  assert.deepEqual(figures, { shipped: 209, cancelled: 16, medianMinutes: 15, medianRounds: 1, firstRound: 105 });
});

test('0236 AC5: package.json, the newest changelog section name the same version, and the setup prompt installs the latest release', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});
