import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/panel.mjs';

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

test('AC2: CHANGELOG.md has a 0.2.0 section grouped under a few headings', () => {
  const log = read('CHANGELOG.md');
  const m = log.match(/^## \[?0\.2\.0\]?[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  assert.ok(m, 'CHANGELOG.md has a 0.2.0 section');
  const groups = [...m[1].matchAll(/^### .+$/gm)];
  assert.ok(groups.length >= 2 && groups.length <= 8, `a few headings, not ${groups.length}`);
  assert.ok([...m[1].matchAll(/^- /gm)].length >= groups.length, 'each heading lists what you can now do');
  assert.match(m[1], /0\.1\.0/, 'it says what changed since the private 0.1.0');
});

test('AC3: the README and brief status lines say the current version, a public preview, not v0.1', () => {
  const readme = read('README.md').match(/^> Status:.*$/m)?.[0] || '';
  const brief = read('docs/brief.md').match(/^Status:.*$/m)?.[0] || '';
  for (const line of [readme, brief]) {
    assert.ok(line.includes(pkg().version), line);
    assert.match(line, /public preview/);
    assert.doesNotMatch(line, /v0\.1\b/);
  }
});

test('AC4: the README setup prompt names the current version', () => {
  assert.ok(read('README.md').includes(`npx github:luroai/speck#v${pkg().version} init`));
});
