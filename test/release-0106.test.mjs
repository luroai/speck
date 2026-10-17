import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches, setupPromptProblems } from './support/release.mjs';

// ---------- 0106: prepare release 0.3.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// 0210 (release 0.4.0) made the checks below that named 0.3.0 as the current version check the current version instead.
const version = () => JSON.parse(read('package.json')).version;
const esc = v => v.replace(/\./g, '\\.');

test('0106 AC1: package.json has the current release version', () => {
  assert.match(version(), /^\d+\.\d+\.\d+$/);
  assert.ok(changelogSection(read('CHANGELOG.md'), version()), 'with a changelog section of its own');
});

test('0106 AC1: speck init prints speck and the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`^speck ${esc(version())}: `, 'm'));
});

test('0106 AC2: CHANGELOG.md has a 0.3.0 section', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.3.0');
  assert.ok(s, 'CHANGELOG.md has a 0.3.0 section');
});

test('0106 AC3: the README setup prompt installs the latest release', () => {
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.doesNotMatch(read('README.md'), /#v0\.2\.0/);
});

test('0106 AC3: the README and the brief name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.ok(read(f).includes(version()), f);
});

test('0106 AC4: package.json and the newest changelog section name the same version, and the setup prompt installs the latest release', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});

// 0253: the setup prompt always installs the latest release, so the version check covers only these two;
// test/install-0253.test.mjs checks the prompt.
test('0106 AC4: the version check fails when either of the two differs or is missing', () => {
  const pkg = v => JSON.stringify({ version: v });
  const changelog = v => `# Changelog\n\n## ${v} · 1 January 2027\n\n### A\n\n- a\n\n## 0.1.0 · 1 January 2026\n`;
  assert.deepEqual(releaseMismatches({ pkg: pkg('1.2.3'), changelog: changelog('1.2.3') }), []);
  for (const [name, input] of Object.entries({
    'package.json': { pkg: pkg('1.2.4'), changelog: changelog('1.2.3') },
    changelog: { pkg: pkg('1.2.3'), changelog: changelog('1.2.4') },
    'no package version': { pkg: '{}', changelog: changelog('1.2.3') },
    'no changelog section': { pkg: pkg('1.2.3'), changelog: '# Changelog\n' },
  })) {
    assert.equal(releaseMismatches(input).length, 1, `${name}: one mismatch reported`);
  }
  // Only the newest section counts: an older matching one doesn't hide a mismatch.
  assert.equal(releaseMismatches({ pkg: pkg('0.1.0'), changelog: changelog('1.2.3') }).length, 1);
});

test('0106 AC4: the 0092 release tests check the current version, not 0.2.0', () => {
  const t = read('test/release-0092.test.mjs');
  assert.doesNotMatch(t, /assert\.equal\(pkg\(\)\.version, '0\.2\.0'\)/);
  assert.doesNotMatch(t, /speck 0\\\.2\\\.0/);
  assert.doesNotMatch(t, /#v0\\\.2\\\.0 init/);
});
