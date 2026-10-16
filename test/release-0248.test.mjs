import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, builtWithSpeckFigures, readmeFigures, doneTicketsAt } from './support/release.mjs';
import { commitBySubject } from './support/commits.mjs';

// ---------- 0248: prepare release 0.5.3 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.3.md');
const notesSection = heading => notes().match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';

test('0248 AC1: package.json is version 0.5.3', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.5.3');
});

test('0248 AC1: speck init prints speck 0.5.3', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.5\.3: /m);
});

test('0248 AC2: CHANGELOG.md has a 0.5.3 section above 0.5.2, under a heading or two', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.5.3');
  assert.ok(s, 'CHANGELOG.md has a 0.5.3 section');
  assert.ok(log.match(/^## .*$/m)[0].startsWith('## 0.5.3'), '0.5.3 is the newest section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.5.2')), '0.5.3 comes above 0.5.2');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 1 && groups.length <= 6, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /since 0\.5\.2/, 'it says what changed since 0.5.2');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.3 init/, 'it says how to install this release');
});

test('0248 AC2: the 0.5.3 section covers what someone using speck will notice', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.5.3');
  assert.match(s, /switches to (its|the) new code/); // 0247
  assert.match(s, /off and on/); // 0247: the upgrade step
});

test('0248 AC2: the 0.5.2 and 0.5.1 sections are unchanged', () => {
  const log = read('CHANGELOG.md');
  const hash = s => crypto.createHash('sha256').update(s).digest('hex');
  // The hashes of each section as tagged in v0.5.2.
  assert.equal(hash(changelogSection(log, '0.5.2') || ''), 'b846e5085aa2a36686ff8d55ced9bc1a1eb0c533bb5dbba639887de040a03b80');
  assert.equal(hash(changelogSection(log, '0.5.1') || ''), '7f1b4639352a11e2e9c6477f147dc48e0ebe7e8544b8166ecca163070b39c57e');
});

test('0248 AC3: the README setup prompt names v0.5.3', () => {
  assert.match(read('README.md'), /npx github:luroai\/speck#v0\.5\.3 init/);
  assert.doesNotMatch(read('README.md'), /#v0\.5\.2/);
});

test('0248 AC3: the README and brief status lines say 0.5.3, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, /\b0\.5\.3, a public preview/);
    assert.doesNotMatch(line, /0\.5\.2/);
  }
});

test('0248 AC3: the README says nothing the 0.5.3 tickets made untrue', () => {
  // 0247: nothing says speck run must be turned off and on to pick up new code.
  assert.doesNotMatch(read('README.md'), /off and on|restart `?speck run/i);
});

test('0248 AC4: the release notes say it is a patch release so speck run runs its newest code, each fix, how to install and how to upgrade', () => {
  const n = notes();
  const intro = n.split(/^## /m)[0];
  assert.equal(intro.trim().split(/\n\s*\n/).length, 1, 'one short opening paragraph');
  assert.match(intro, /0\.5\.3 is a patch release/);
  assert.match(intro, /`speck run`/);
  assert.match(intro, /newest code/);
  const fixes = notesSection('What matters most');
  assert.equal([...fixes.matchAll(/^- \*\*/gm)].length, 1, 'one item for its one fix');
  assert.match(fixes, /switches to (its|the) new code/);
  assert.match(notesSection('Install'), /npx github:luroai\/speck#v0\.5\.3 init/);
  const upgrading = notesSection('Upgrading from 0\\.5\\.2');
  assert.match(upgrading, /npx github:luroai\/speck#v0\.5\.3 init/);
  assert.match(upgrading, /off and on once/, 'a speck run already on has to be turned off and on once');
});

test('0248 AC4: the release notes link to the changelog heading GitHub makes for the 0.5.3 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.5\.3[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.5.3 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.5.3/CHANGELOG.md#${anchor})`), anchor);
});

test('0248 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message. Its done tickets are what the figures were worked out from.
const builtFrom = () => commitBySubject('speck(0247): Switch speck run to its new code once it\'s idle');

test('0248 AC5: the README\'s Built with speck figures match the done tickets this release was built from', () => {
  const figures = builtWithSpeckFigures(doneTicketsAt(builtFrom()));
  assert.deepEqual(readmeFigures(read('README.md')), figures);
  assert.deepEqual(figures, { shipped: 231, cancelled: 16, medianMinutes: 14, medianRounds: 1, firstRound: 116 });
});

test('0248 AC5: package.json, the newest changelog section and the setup prompt all name 0.5.3', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md'), readme: read('README.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.5.3');
});
