import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';
import { setupPromptProblems } from './support/release.mjs';

// ---------- 0092: mark the repo as release 0.2.0 ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pkg = () => JSON.parse(read('package.json'));

test('AC1: package.json has a version and names the GitHub repository', () => {
  assert.match(pkg().version, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg().repository, 'github:luroai/speck');
});

test('AC1: speck init prints the current version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.split('\n').some(l => l.startsWith(`speck ${pkg().version}: `)), r.stdout);
  assert.equal(fs.readFileSync(path.join(dir, '.speck', 'VERSION'), 'utf8').trim(), pkg().version);
});

test('AC2: CHANGELOG.md has a 0.2.0 section', () => {
  assert.match(read('CHANGELOG.md'), /^## \[?0\.2\.0\]?/m);
});

test('AC3: the README and the brief name the current version', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.ok(read(f).includes(pkg().version), f);
});

test('AC4: the README setup prompt installs the latest release', () => {
  // 0253: the setup prompt always installs the latest release, so this checks that instead of a fixed version.
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
});
