import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, builtWithSpeckFigures, readmeFigures } from './support/release.mjs';
import { commitBySubject } from './support/commits.mjs';

// ---------- 0210: prepare release 0.4.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const principle7 = () => read('docs/brief.md').match(/^7\. [\s\S]*?(?=^\d+\. |^## )/m)?.[0] || '';
const notes = () => read('docs/releases/v0.4.0.md');
const notesSection = heading => notes().match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';

// The done tickets as they were in a commit, read with git.
function doneTicketsAt(commit) {
  assert.ok(commit, 'found the commit');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const archive = spawnSync('git', ['archive', '--format=tar', commit, 'speck/tickets/done'], { cwd: ROOT, maxBuffer: 1 << 28 });
  assert.equal(archive.status, 0, String(archive.stderr));
  const tar = spawnSync('tar', ['-x', '-C', dir], { input: archive.stdout });
  assert.equal(tar.status, 0, String(tar.stderr));
  const done = path.join(dir, 'speck', 'tickets', 'done');
  return fs.readdirSync(done).filter(f => f.endsWith('.md')).map(f => fs.readFileSync(path.join(done, f), 'utf8'));
}

test('0210 AC1: package.json is version 0.4.0', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.4.0');
});

test('0210 AC1: speck init prints speck 0.4.0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.4\.0: /m);
});

test('0210 AC2: CHANGELOG.md has a 0.4.0 section above 0.3.0, under a few headings', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.4.0');
  assert.ok(s, 'CHANGELOG.md has a 0.4.0 section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.3.0')), '0.4.0 comes above 0.3.0');
  assert.ok(log.match(/^## .*$/m)[0].startsWith('## 0.4.0'), '0.4.0 is the newest section');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 8, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /since 0\.3\.0/, 'it says what changed since 0.3.0');
});

test('0210 AC2: the 0.3.0 section is unchanged', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.3.0');
  assert.ok(s, 'CHANGELOG.md still has a 0.3.0 section');
  // The hash of the 0.3.0 section as tagged in v0.3.0.
  assert.equal(crypto.createHash('sha256').update(s).digest('hex'), '39fc8660025776499f2578cd43a4d58b5a7c7bc4b94df0016d47e8611bf41d5d');
});

test('0210 AC3: the README setup prompt names v0.4.0', () => {
  assert.match(read('README.md'), /npx github:luroai\/speck#v0\.4\.0 init/);
  assert.doesNotMatch(read('README.md'), /#v0\.3\.0/);
});

test('0210 AC3: the README and brief status lines say 0.4.0, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, /\b0\.4\.0, a public preview/);
    assert.doesNotMatch(line, /0\.3\.0/);
  }
});

test('0210 AC4: the brief\'s principle 7 says builds end at approved, one ship queue ships them one at a time, and max_parallel_builds sets how many builds go at once', () => {
  const p = principle7();
  assert.match(p, /Builds end at approved, and one ship queue in `speck run` ships tickets one at a time/);
  assert.match(p, /`max_parallel_builds` in `speck\/config\.yml` sets how many builds `speck run` keeps going at once: 1 unless you change it/);
  assert.match(p, /one build at a time \(WIP 1\) unless you change it/);
});

test('0210 AC5: package.json, the newest changelog section and the setup prompt all name 0.4.0', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md'), readme: read('README.md') }), []);
  assert.equal(JSON.parse(read('package.json')).version, '0.4.0');
});

test('0210 AC6: the release notes say what speck is, the main changes, how to install and how to upgrade', () => {
  const n = notes();
  const intro = n.split(/^## /m)[0];
  assert.equal(intro.trim().split(/\n\s*\n/).length, 1, 'one short opening paragraph');
  assert.match(intro, /speck is /);
  assert.match(intro, /0\.4\.0 is about/);
  const changes = [...notesSection('What matters most').matchAll(/^- \*\*/gm)];
  assert.ok(changes.length >= 3 && changes.length <= 5, `three to five main changes, not ${changes.length}`);
  assert.match(notesSection('Install'), /npx github:luroai\/speck#v0\.4\.0 init/);
  const upgrade = notesSection('Upgrading from 0\\.3\\.0');
  assert.match(upgrade, /Only `speck run` ships auto-ship tickets now/);
  assert.match(upgrade, /Keep `speck run` on/);
  assert.match(n, /\[[^\]]*0\.4\.0 section of the changelog\]\(https:\/\/github\.com\/luroai\/speck\/blob\/v0\.4\.0\/CHANGELOG\.md#040--15-october-2026\)/);
});

test('0210 AC6: the release notes link to the changelog heading GitHub makes for the 0.4.0 section', () => {
  const heading = read('CHANGELOG.md').match(/^## (0\.4\.0[^\n]*)$/m)[1];
  // GitHub's anchor: lower case, punctuation other than hyphens dropped, each space a hyphen.
  const anchor = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-');
  assert.ok(notes().includes(`CHANGELOG.md#${anchor})`), anchor);
});

test('0210 AC6: the release notes use none of the private words', () => {
  let words = [];
  try { words = fs.readFileSync(path.join(os.homedir(), '.config', 'speck', 'private-words'), 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')); }
  catch { /* no list: nothing to check against */ }
  const n = notes().toLowerCase();
  for (const w of words) assert.ok(!n.includes(w), 'a private word is in the release notes');
});

// The commit this release was built from, found by its message. Its done tickets are what the figures were worked out from.
const builtFrom = () => commitBySubject('speck(0212): Recover a ship that was stopped partway');

test('0210 AC7: the README\'s Built with speck figures match the done tickets this release was built from', () => {
  const figures = builtWithSpeckFigures(doneTicketsAt(builtFrom()));
  assert.deepEqual(readmeFigures(read('README.md')), figures);
  assert.deepEqual(figures, { shipped: 195, cancelled: 16, medianMinutes: 14, medianRounds: 1, firstRound: 100 });
});

test('0210 AC7: worked out the same way, the done tickets of the last figures give the figures the README stated then', () => {
  // This commit last set the figures: 131 shipped, 13 cancelled, 10 minutes, 1 round, 67 approved in the first round.
  const then = commitBySubject('Lead with judgement: new tagline and README opening');
  assert.ok(then, 'found the commit');
  const readmeThen = spawnSync('git', ['show', `${then}:README.md`], { cwd: ROOT, encoding: 'utf8' }).stdout;
  assert.deepEqual(builtWithSpeckFigures(doneTicketsAt(then)), readmeFigures(readmeThen));
  assert.deepEqual(readmeFigures(readmeThen), { shipped: 131, cancelled: 13, medianMinutes: 10, medianRounds: 1, firstRound: 67 });
});
