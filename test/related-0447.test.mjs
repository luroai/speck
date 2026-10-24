// 0447: speck test --related picks the tests that really cover a change, so a change to the CLI or a skill runs a
// small set rather than nearly the whole suite.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gIn } from './support/ship.mjs';
import { ROOT } from './support/panel.mjs';
import { repo, write } from './support/related.mjs';
import { relatedTests } from '../scripts/related.mjs';

const BRIEF = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
const change = (dir, ...files) => { for (const f of files) write(dir, f, `changed ${f}\n`); gIn(dir, 'commit', '-qam', 'change'); };
const picked = (dir) => relatedTests(dir, 'main').map(c => c.test);

// Eight support modules: two name scripts/few.mjs, three name scripts/many.mjs (more than a quarter of eight).
const SUPPORT = {
  'scripts/few.mjs': '', 'scripts/many.mjs': '',
  'test/support/f1.mjs': "export const f = 'scripts/few.mjs';\n",
  'test/support/f2.mjs': "export const f = 'few.mjs';\n",
  'test/support/m1.mjs': "export const m = '../../scripts/many.mjs';\n",
  'test/support/m2.mjs': "export const m = 'many.mjs';\n",
  'test/support/m3.mjs': "export const m = 'scripts/many.mjs';\n",
  'test/support/s1.mjs': '', 'test/support/s2.mjs': '', 'test/support/s3.mjs': '',
  'test/via-f1.test.mjs': "import './support/f1.mjs';\n",
  'test/via-f2.test.mjs': "import { f } from './support/f2.mjs';\n",
  'test/via-m1.test.mjs': "import './support/m1.mjs';\n",
  'test/via-m3.test.mjs': "import { m } from './support/m3.mjs';\n",
  'test/names-many.test.mjs': "import './support/m1.mjs';\nimport '../scripts/many.mjs';\n",
  'test/plain.test.mjs': "import './support/s1.mjs';\n",
};

test('0447 AC1: a file at most a quarter of the support modules name brings tests in through them', () => {
  const dir = repo(SUPPORT);
  change(dir, 'scripts/few.mjs');
  assert.deepEqual(picked(dir), ['test/via-f1.test.mjs', 'test/via-f2.test.mjs']);
});

test('0447 AC1: a file more than a quarter of them name brings in only the tests that name it themselves', () => {
  const dir = repo(SUPPORT);
  change(dir, 'scripts/many.mjs');
  assert.deepEqual(relatedTests(dir, 'main'), [{ test: 'test/names-many.test.mjs', because: 'scripts/many.mjs' }]);
});

test('0447 AC1: a support module names a file when a support module it imports does', () => {
  // cli.mjs names scripts/run.mjs; two of the other three import it, so three of four name it: more than a quarter.
  const dir = repo({
    'scripts/run.mjs': '',
    'test/support/cli.mjs': "export const CLI = 'scripts/run.mjs';\n",
    'test/support/a.mjs': "import { CLI } from './cli.mjs';\n",
    'test/support/b.mjs': "export * from './a.mjs';\n",
    'test/support/c.mjs': '',
    'test/through-b.test.mjs': "import './support/b.mjs';\n",
    'test/through-cli.test.mjs': "import { CLI } from './support/cli.mjs';\n",
    'test/direct.test.mjs': "const f = path.join(ROOT, 'scripts', 'run.mjs');\n",
  });
  change(dir, 'scripts/run.mjs');
  assert.deepEqual(picked(dir), ['test/direct.test.mjs']);
});

test('0447 AC1: support modules that import each other in a loop each name what the other does', () => {
  // a.mjs and b.mjs import each other and name scripts/one.mjs between them; c.mjs to h.mjs name nothing.
  const files = { 'scripts/one.mjs': '', 'scripts/two.mjs': '',
    'test/support/a.mjs': "import './b.mjs';\nconst f = 'scripts/one.mjs';\n",
    'test/support/b.mjs': "import './a.mjs';\nconst f = 'scripts/two.mjs';\n",
    'test/via-a.test.mjs': "import './support/a.mjs';\n", 'test/via-b.test.mjs': "import './support/b.mjs';\n" };
  for (const m of 'cdefgh') files[`test/support/${m}.mjs`] = '';
  const dir = repo(files);
  change(dir, 'scripts/one.mjs');
  assert.deepEqual(picked(dir), ['test/via-a.test.mjs', 'test/via-b.test.mjs']);
  change(dir, 'scripts/two.mjs');
  assert.deepEqual(relatedTests(dir, 'main').map(c => [c.test, c.because]), [['test/via-a.test.mjs', 'scripts/one.mjs'], ['test/via-b.test.mjs', 'scripts/one.mjs']]);
});

test('0447 AC1: a file at the repo root is named after ../ but not after another folder', () => {
  const dir = repo({ 'package.json': '{}\n', 'test/fixtures/package.json': '{}\n',
    'test/up.test.mjs': "const p = new URL('../package.json', import.meta.url);\n",
    'test/fixture.test.mjs': "const p = './fixtures/package.json';\n" });
  change(dir, 'package.json');
  assert.deepEqual(picked(dir), ['test/up.test.mjs']);
});

test('0447 AC1: a file name inside the path of a file in another folder does not name it', () => {
  const dir = repo({
    'scripts/speck.mjs': '', 'test/support/speck.mjs': '',
    'test/support-speck.test.mjs': "import { x } from './support/speck.mjs';\n",
    'test/relative.test.mjs': "import '../scripts/speck.mjs';\n",
    'test/joined.test.mjs': "const CLI = path.join(ROOT, 'scripts', 'speck.mjs');\n",
    'test/copied.test.mjs': "const CLI = '.speck/scripts/speck.mjs';\n",
  });
  change(dir, 'scripts/speck.mjs');
  assert.deepEqual(picked(dir), ['test/copied.test.mjs', 'test/joined.test.mjs', 'test/relative.test.mjs']);
});

test('0447 AC2: a change to a skill\'s SKILL.md brings in only the tests that name that skill, by folder or name', () => {
  const dir = repo({
    'skills/speck-build/SKILL.md': '', 'skills/speck-ship/SKILL.md': '',
    'test/support/skills.mjs': "export const BUILD = 'skills/speck-build/SKILL.md';\n",
    'test/support/a.mjs': '', 'test/support/b.mjs': '', 'test/support/c.mjs': '',
    'test/folder.test.mjs': "const f = 'skills/speck-build/SKILL.md';\n",
    'test/joined.test.mjs': "const f = path.join(ROOT, 'skills', 'speck-build', 'SKILL.md');\n",
    'test/other-skill.test.mjs': "const f = 'skills/speck-ship/SKILL.md';\n",
    'test/any-skill.test.mjs': "for (const s of skills) read(path.join(s, 'SKILL.md'));\n",
    'test/longer.test.mjs': "const f = 'skills/speck-build-extra/SKILL.md';\n",
    'test/command.test.mjs': "const build_command = 'claude -p \"/speck-build {id}\"';\n",
    'test/codex-command.test.mjs': "const argv = ['codex', 'exec', '$speck-build {id}'];\n",
    'test/via-support.test.mjs': "import { BUILD } from './support/skills.mjs';\n",
  });
  change(dir, 'skills/speck-build/SKILL.md');
  assert.deepEqual(picked(dir), ['test/folder.test.mjs', 'test/joined.test.mjs']);
  assert.ok(relatedTests(dir, 'main').every(c => c.because === 'skills/speck-build/SKILL.md' && !c.through));
});

// This repo's test/ folder, with 0437's three changed files and the CLI, in a repo of its own.
function measuredRepo() {
  const dir = repo({ 'scripts/turns.mjs': '', 'scripts/speck.mjs': '', 'skills/speck-build/SKILL.md': '', 'docs/brief.md': '' });
  fs.cpSync(path.join(ROOT, 'test'), path.join(dir, 'test'), { recursive: true, filter: src => !src.includes(`${path.sep}node_modules`) });
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'tests');
  gIn(dir, 'branch', '-qf', 'main', 'HEAD');
  return dir;
}

test('0447 AC3: 0437\'s change picks fewer than 100 test files, every one naming scripts/turns.mjs among them', () => {
  const dir = measuredRepo();
  change(dir, 'scripts/turns.mjs', 'skills/speck-build/SKILL.md', 'docs/brief.md');
  const chosen = picked(dir);
  assert.ok(chosen.length < 100, `picked ${chosen.length}`);
  const turns = fs.readdirSync(path.join(dir, 'test'), { recursive: true }).map(f => `test/${f}`)
    .filter(f => /\.test\.mjs$/.test(f) && !f.startsWith('test/support/') && /(?<![\w.-])turns\.mjs/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  assert.ok(turns.length > 0);
  for (const f of turns) assert.ok(chosen.includes(f), `${f} names scripts/turns.mjs`);
});

test('0447 AC1: in this repo, a change to scripts/speck.mjs brings in no test through a support module', () => {
  const dir = measuredRepo();
  change(dir, 'scripts/speck.mjs');
  const chosen = relatedTests(dir, 'main');
  assert.ok(chosen.length > 0);
  assert.deepEqual(chosen.filter(c => c.through), []);
});

test('0447 AC4: the brief\'s speck test row says how --related chooses', () => {
  const row = BRIEF.split('\n').find(l => l.startsWith('| `speck test` |'));
  for (const fact of ['`test/support/`', '`SKILL.md`', '`skills/speck-build`', '`/speck-build`', '`$speck-build`', '`scripts/speck.mjs`', '`./support/speck.mjs`', '`../`']) {
    assert.ok(row.includes(fact), fact);
  }
});
