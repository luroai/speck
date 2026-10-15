import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { releaseRepo, runRelease } from './support/release-0240.mjs';

// ---------- 0240: publish a GitHub release when a new version lands on main ----------

const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release.yml');
const workflow = () => fs.readFileSync(WORKFLOW, 'utf8');

test('0240 AC1: the workflow runs the release script on every push to main', () => {
  const wf = workflow();
  assert.match(wf, /^on:\n  push:\n    branches: \[main\]\n/m, 'runs on push to main');
  assert.match(wf, /run: node \.github\/scripts\/release\.mjs\n/, 'runs the release script');
  assert.ok(fs.existsSync(path.join(ROOT, '.github', 'scripts', 'release.mjs')));
});

test('0240 AC1: release runs go one at a time, and a newer push never cancels a waiting one', () => {
  const wf = workflow();
  assert.match(wf, /^concurrency:\n  group: release\n  queue: max\n/m);
  assert.doesNotMatch(wf, /cancel-in-progress: true/);
});

test('0240 AC1: an untagged version gets its tag on the pushed commit and a release with its notes', () => {
  const repo = releaseRepo({ version: '0.5.0', notes: true });
  const r = runRelease(repo, { sha: 'abc123' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.calls, [
    'git ls-remote --tags origin refs/tags/v0.5.0',
    'gh release create v0.5.0 --target abc123 --title speck 0.5.0 --notes-file docs/releases/v0.5.0.md',
  ]);
  assert.match(r.stdout, /Published speck 0\.5\.0/);
});

test('0240 AC2: a version already tagged creates nothing and succeeds', () => {
  for (const version of ['0.2.0', '0.3.0', '0.4.0']) {
    const repo = releaseRepo({ version, notes: version === '0.4.0' });
    const r = runRelease(repo, { sha: 'abc123', tagged: true });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.calls, [`git ls-remote --tags origin refs/tags/v${version}`]);
    assert.match(r.stdout, new RegExp(`v${version.replace(/\./g, '\\.')} is already tagged`));
  }
});

test('0240 AC3: missing release notes create nothing and fail, naming the file', () => {
  const repo = releaseRepo({ version: '0.5.0', notes: false });
  const r = runRelease(repo, { sha: 'abc123' });
  assert.notEqual(r.status, 0);
  assert.ok(r.calls.every(c => !c.startsWith('gh ')), 'no release created');
  assert.match(r.stderr, /docs\/releases\/v0\.5\.0\.md/);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'a plain message, not a stack trace');
});

test('0240 AC3: a failed tag lookup creates nothing and fails', () => {
  const repo = releaseRepo({ version: '0.5.0', notes: true });
  const r = runRelease(repo, { sha: 'abc123', lsRemoteFails: true });
  assert.notEqual(r.status, 0);
  assert.ok(r.calls.every(c => !c.startsWith('gh ')), 'no release created');
  assert.doesNotMatch(r.stderr, /\n\s+at /);
});

test('0240 AC3: a missing or unreadable version creates nothing and fails', () => {
  for (const version of [undefined, '', 'not a version', '0.5.0; rm -rf /']) {
    const repo = releaseRepo({ version, notes: false });
    const r = runRelease(repo, { sha: 'abc123' });
    assert.notEqual(r.status, 0, `version ${JSON.stringify(version)}`);
    assert.ok(r.calls.every(c => !c.startsWith('gh ')), 'no release created');
    assert.match(r.stderr, /package\.json/);
  }
});

test('0240 AC1: without the pushed commit it creates nothing and fails', () => {
  const repo = releaseRepo({ version: '0.5.0', notes: true });
  const r = runRelease(repo, { sha: '' });
  assert.notEqual(r.status, 0);
  assert.ok(r.calls.every(c => !c.startsWith('gh ')));
  assert.match(r.stderr, /GITHUB_SHA/);
});

test('0240 AC4: the workflow uses only GITHUB_TOKEN, with contents: write and no other permission', () => {
  const wf = workflow();
  const perms = [...wf.matchAll(/^( *)permissions:(.*)\n((?:\1  .*\n)*)/gm)];
  assert.equal(perms.length, 1, 'permissions set once');
  assert.equal(perms[0][2].trim(), '');
  assert.deepEqual(perms[0][3].trim().split('\n').map(l => l.trim()), ['contents: write']);
  const secrets = [...wf.matchAll(/secrets\.(\w+)/g)].map(m => m[1]);
  assert.deepEqual(secrets, ['GITHUB_TOKEN']);
  assert.match(wf, /GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.doesNotMatch(wf, /\b(github\.token|vars\.)/);
});
