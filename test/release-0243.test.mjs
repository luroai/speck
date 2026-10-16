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

// ---------- 0243: prepare release 0.5.2 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.2.md');
const notesSection = heading => notes().match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';
const docSection = (text, heading) => text.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';

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

test('0243 AC2: CHANGELOG.md has a 0.5.2 section above 0.5.1, under a few headings', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.5.2');
  assert.ok(s, 'CHANGELOG.md has a 0.5.2 section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.5.1')), '0.5.2 comes above 0.5.1');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 6, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /since 0\.5\.1/, 'it says what changed since 0.5.1');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.2 init/, 'it says how to install this release');
});

test('0243 AC2: the 0.5.2 section covers what someone using speck will notice', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.5.2');
  for (const re of [
    /merge round/, // 0241
    /extra round/, // 0242
    /ticket's own change/, // 0244
    /background/, // 0245
    /by chance/, // 0246
  ]) assert.match(s, re);
  assert.doesNotMatch(s, /fail together/);
});

test('0243 AC2: the 0.5.1 and 0.5.0 sections are unchanged', () => {
  const log = read('CHANGELOG.md');
  const hash = s => crypto.createHash('sha256').update(s).digest('hex');
  // The hashes of each section as tagged in v0.5.1.
  assert.equal(hash(changelogSection(log, '0.5.1') || ''), '7f1b4639352a11e2e9c6477f147dc48e0ebe7e8544b8166ecca163070b39c57e');
  assert.equal(hash(changelogSection(log, '0.5.0') || ''), 'b5bed929b197bdc7345e3a8f84fa4b8ea7a7a7a42ff67d4c6633b0b0832184a0');
});

test('0243 AC3: the README setup prompt names the current version', () => {
  assert.ok(read('README.md').includes(`npx github:luroai/speck#v${version()} init`));
  assert.doesNotMatch(read('README.md'), /#v0\.5\.1/);
});

test('0243 AC3: the README and brief status lines say the current version, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, new RegExp(`\\b${esc(version())}, a public preview`));
    assert.doesNotMatch(line, /0\.5\.1/);
  }
});

test('0243 AC3: the README says nothing the 0.5.2 tickets made untrue', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /fail together/); // 0244
  assert.doesNotMatch(readme, /background/i); // 0245: nothing says builds may run commands in the background
});

test('0243 AC4: the release notes say it is a patch release that cuts needless stops, each fix, how to install and how to upgrade', () => {
  const n = notes();
  const intro = n.split(/^## /m)[0];
  assert.equal(intro.trim().split(/\n\s*\n/).length, 1, 'one short opening paragraph');
  assert.match(intro, /0\.5\.2 is a patch release/);
  assert.match(intro, /needless stops/);
  const fixes = notesSection('What matters most');
  assert.equal([...fixes.matchAll(/^- \*\*/gm)].length, 5, 'one item for each of the five fixes');
  for (const re of [/merge round/, /extra round/, /ticket's own change/, /background/, /by chance/]) assert.match(fixes, re);
  assert.match(notesSection('Install'), /npx github:luroai\/speck#v0\.5\.2 init/);
  assert.match(notesSection('Upgrading from 0\\.5\\.1'), /npx github:luroai\/speck#v0\.5\.2 init/);
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

test('0243 AC5: the brief says a workflow tags and publishes each release from its notes file, which the release ticket adds', () => {
  const s = docSection(read('docs/brief.md'), 'Releases');
  assert.match(s, /lands on `main`/);
  assert.match(s, /workflow tags the version and publishes its GitHub release from `docs\/releases\/v<version>\.md`/);
  assert.match(s, /release ticket must add that file/);
  assert.doesNotMatch(s, /maintainer creates and pushes the tag/);
  assert.doesNotMatch(s, /by hand/);
});

// The commit this release was built from, found by its message. Its done tickets are what the figures were worked out from.
const builtFrom = () => commitBySubject('speck(0245): Stop speck run\'s Claude Code builds running commands in the background');

// 0248 (release 0.5.3) set the figures again, so this checks the README as this release shipped it.
test('0243 AC6: the README\'s Built with speck figures match the done tickets this release was built from', () => {
  const figures = builtWithSpeckFigures(doneTicketsAt(builtFrom()));
  const shipped = commitBySubject('speck(0243): prepare release 0.5.2');
  assert.ok(shipped, 'found the commit');
  const readmeThen = spawnSync('git', ['show', `${shipped}:README.md`], { cwd: ROOT, encoding: 'utf8' }).stdout;
  assert.deepEqual(readmeFigures(readmeThen), figures);
  assert.deepEqual(figures, { shipped: 229, cancelled: 16, medianMinutes: 14, medianRounds: 1, firstRound: 115 });
});

test('0243 AC6: package.json, the newest changelog section and the setup prompt name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md'), readme: read('README.md') }), []);
});
