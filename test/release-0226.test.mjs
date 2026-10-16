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

// ---------- 0226: prepare release 0.5.1 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const notes = () => read('docs/releases/v0.5.1.md');
const notesSection = heading => notes().match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';
const readmeSection = heading => read('README.md').match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## )`, 'm'))?.[1] || '';

test('0226 AC1: package.json is version 0.5.1', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.5.1');
});

test('0226 AC1: speck init prints speck 0.5.1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.5\.1: /m);
});

test('0226 AC2: CHANGELOG.md has a 0.5.1 section above 0.5.0, under a few headings', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.5.1');
  assert.ok(s, 'CHANGELOG.md has a 0.5.1 section');
  assert.ok(log.match(/^## .*$/m)[0].startsWith('## 0.5.1'), '0.5.1 is the newest section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.5.0')), '0.5.1 comes above 0.5.0');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 6, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /since 0\.5\.0/, 'it says what changed since 0.5.0');
  assert.match(s, /npx github:luroai\/speck#v0\.5\.1 init/, 'it says how to install this release');
});

test('0226 AC2: the 0.5.1 section covers the fixes someone using speck will notice', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.5.1');
  for (const re of [
    /P0/, // 0213
    /idea and inbox cards/i, // 0214
    /review pack's build time/i, // 0215
    /merged but not pushed/, // 0216
    /timer/, // 0217
    /five seconds/, // 0218
    /stopped before it started/, // 0219
    /turn `speck run` on/, // 0220
    /once/, // 0221
    /plain review pack/i, // 0222
    /fixing the last round's findings/, // 0223
    /tap/, // 0224
    /max_parallel_builds/, // 0225
  ]) assert.match(s, re);
});

test('0226 AC2: the 0.5.0 and 0.4.0 sections are unchanged', () => {
  const log = read('CHANGELOG.md');
  const hash = s => crypto.createHash('sha256').update(s).digest('hex');
  // The hashes of each section as tagged in v0.5.0.
  assert.equal(hash(changelogSection(log, '0.5.0') || ''), 'b5bed929b197bdc7345e3a8f84fa4b8ea7a7a7a42ff67d4c6633b0b0832184a0');
  assert.equal(hash(changelogSection(log, '0.4.0') || ''), 'bec30aebab04cfdcd45b6ef52ef2edc1de344c96f976390a33a5baa4eaae49f3');
});

test('0226 AC3: the README setup prompt names v0.5.1', () => {
  assert.match(read('README.md'), /npx github:luroai\/speck#v0\.5\.1 init/);
  assert.doesNotMatch(read('README.md'), /#v0\.5\.0/);
});

test('0226 AC3: the README and brief status lines say 0.5.1, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, /\b0\.5\.1, a public preview/);
    assert.doesNotMatch(line, /0\.5\.0/);
  }
});

test('0226 AC3: the README\'s commands say run builds one at a time unless max_parallel_builds is raised, and a stopped build keeps a branch only once started', () => {
  const s = readmeSection('Commands');
  const run = s.match(/^\| `run` \|.*$/m)?.[0] || '';
  assert.match(run, /one at a time unless you raise `max_parallel_builds`/);
  const stop = s.match(/^\| `pause <id>`.*$/m)?.[0] || '';
  assert.match(stop, /keeping its branch and work if it had started/);
});

test('0226 AC4: the release notes say it is a patch release of fixes to 0.4.0, the main fixes, how to install and how to upgrade', () => {
  const n = notes();
  const intro = n.split(/^## /m)[0];
  assert.equal(intro.trim().split(/\n\s*\n/).length, 1, 'one short opening paragraph');
  assert.match(intro, /0\.5\.1 is a patch release/);
  assert.match(intro, /0\.4\.0/);
  const fixes = [...notesSection('What matters most').matchAll(/^- \*\*/gm)];
  assert.ok(fixes.length >= 3 && fixes.length <= 5, `three to five main fixes, not ${fixes.length}`);
  assert.match(notesSection('Install'), /npx github:luroai\/speck#v0\.5\.1 init/);
  assert.match(notesSection('Upgrading from 0\\.5\\.0'), /npx github:luroai\/speck#v0\.5\.1 init/);
});

test('0226 AC4: the release notes link to the changelog heading GitHub makes for the 0.5.1 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.5\.1[^\n]*)$/m)?.[1];
  assert.ok(heading, 'CHANGELOG.md has a 0.5.1 heading');
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`(https://github.com/luroai/speck/blob/v0.5.1/CHANGELOG.md#${anchor})`), anchor);
});

test('0226 AC4: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message. Its done tickets are what the figures were worked out from.
const builtFrom = () => commitBySubject('speck(0220): Show only the refusing speck run\'s words when Turn on fails');

test('0226 AC5: the README\'s Built with speck figures match the done tickets this release was built from', () => {
  const figures = builtWithSpeckFigures(doneTicketsAt(builtFrom()));
  assert.deepEqual(readmeFigures(read('README.md')), figures);
  assert.deepEqual(figures, { shipped: 223, cancelled: 16, medianMinutes: 14, medianRounds: 1, firstRound: 112 });
});

test('0226 AC5: package.json, the newest changelog section and the setup prompt all name 0.5.1', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md'), readme: read('README.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.5.1');
});
