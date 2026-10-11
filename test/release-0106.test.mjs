import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { changelogSection, releaseMismatches } from './support/release.mjs';

// ---------- 0106: prepare release 0.3.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const section = (text, heading) => text.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || null;

test('0106 AC1: package.json is version 0.3.0', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.3.0');
});

test('0106 AC1: speck init prints speck 0.3.0', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^speck 0\.3\.0: /m);
});

test('0106 AC2: CHANGELOG.md has a 0.3.0 section above 0.2.0, under a few headings', () => {
  const log = read('CHANGELOG.md');
  const s = changelogSection(log, '0.3.0');
  assert.ok(s, 'CHANGELOG.md has a 0.3.0 section');
  assert.ok(log.indexOf(s) < log.indexOf(changelogSection(log, '0.2.0')), '0.3.0 comes above 0.2.0');
  assert.equal(log.match(/^## .*$/m)[0].startsWith('## 0.3.0'), true, '0.3.0 is the newest section');
  const groups = [...s.matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 8, `a few headings, not ${groups.length}`);
  assert.ok([...s.matchAll(/^- /gm)].length >= groups.length, 'each heading lists what changed');
  assert.match(s, /0\.2\.0/, 'it says what changed since 0.2.0');
});

test('0106 AC2: the 0.2.0 section is unchanged', () => {
  const s = changelogSection(read('CHANGELOG.md'), '0.2.0');
  assert.ok(s, 'CHANGELOG.md still has a 0.2.0 section');
  // The hash of the 0.2.0 section as tagged in v0.2.0.
  assert.equal(crypto.createHash('sha256').update(s).digest('hex'), 'ea64d32025832543bbd1f26a0726978d393b7f9abd02eb92360709691afbb9f5');
});

test('0106 AC3: the README setup prompt names v0.3.0', () => {
  assert.match(read('README.md'), /npx github:luroai\/speck#v0\.3\.0 init/);
  assert.doesNotMatch(read('README.md'), /#v0\.2\.0/);
});

test('0106 AC3: the README and brief status lines say 0.3.0, a public preview', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.match(line, /\b0\.3\.0, a public preview/);
    assert.doesNotMatch(line, /0\.2\.0/);
  }
});

test('0106 AC4: package.json, the newest changelog section and the setup prompt name the same version', () => {
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md'), readme: read('README.md') }), []);
});

test('0106 AC4: the version check fails when any one of the three differs or is missing', () => {
  const pkg = v => JSON.stringify({ version: v });
  const changelog = v => `# Changelog\n\n## ${v} · 1 January 2027\n\n### A\n\n- a\n\n## 0.1.0 · 1 January 2026\n`;
  const readme = v => `run \`npx github:luroai/speck#v${v} init\` and follow`;
  assert.deepEqual(releaseMismatches({ pkg: pkg('1.2.3'), changelog: changelog('1.2.3'), readme: readme('1.2.3') }), []);
  for (const [name, input] of Object.entries({
    'package.json': { pkg: pkg('1.2.4'), changelog: changelog('1.2.3'), readme: readme('1.2.3') },
    changelog: { pkg: pkg('1.2.3'), changelog: changelog('1.2.4'), readme: readme('1.2.3') },
    'setup prompt': { pkg: pkg('1.2.3'), changelog: changelog('1.2.3'), readme: readme('1.2.4') },
    'no package version': { pkg: '{}', changelog: changelog('1.2.3'), readme: readme('1.2.3') },
    'no changelog section': { pkg: pkg('1.2.3'), changelog: '# Changelog\n', readme: readme('1.2.3') },
    'no setup prompt': { pkg: pkg('1.2.3'), changelog: changelog('1.2.3'), readme: 'nothing here' },
  })) {
    assert.equal(releaseMismatches(input).length, 1, `${name}: one mismatch reported`);
  }
  // Only the newest section counts: an older matching one doesn't hide a mismatch.
  assert.equal(releaseMismatches({ pkg: pkg('0.1.0'), changelog: changelog('1.2.3'), readme: readme('0.1.0') }).length, 1);
});

test('0106 AC4: the 0092 release tests check the current version, not 0.2.0', () => {
  const t = read('test/release-0092.test.mjs');
  assert.doesNotMatch(t, /assert\.equal\(pkg\(\)\.version, '0\.2\.0'\)/);
  assert.doesNotMatch(t, /speck 0\\\.2\\\.0/);
  assert.doesNotMatch(t, /#v0\\\.2\\\.0 init/);
});

test('0106 AC5: the brief has a short Releases section saying how releases work', () => {
  const s = section(read('docs/brief.md'), 'Releases');
  assert.ok(s, 'the brief has a "## Releases" section');
  assert.ok(s.split('\n').filter(l => l.trim()).length <= 12, 'it is short');
  assert.match(s, /`main` moves with every ship/);
  assert.match(s, /tagged version/);
  assert.match(s, /README always points at the latest release/);
  assert.match(s, /maintainer creates and pushes the tag/);
  assert.match(s, /once the release ticket has shipped/i);
  assert.match(s, /shipping is theirs/);
});
