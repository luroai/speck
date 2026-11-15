// 0696: speck test --related brings in the tests that load a changed panel file, through the support module that
// loads it, however many other support modules import that one.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, STYLE_FILES, pageScripts } from './support/panel.mjs';
import { measuredRepo, pickedFor, repo } from './support/related.mjs';
import { relatedTests } from '../scripts/related.mjs';

const picked = (dir, branch, ...files) => pickedFor(dir, relatedTests, branch, files).map(c => c.test);

// Twenty support modules, as in this repo: page.mjs loads the page's files, naming each by `how`, and six others
// import it, so more than a quarter of them name those files through it.
function pageRepo(how) {
  const files = { 'templates/panel.js': '', 'templates/panel-base.css': '', 'scripts/ship-queue.mjs': '',
    'test/support/page.mjs': `${how('panel.js')}\n${how('panel-base.css')}\n`,
    'test/loads.test.mjs': "import { fakePage } from './support/page.mjs';\n",
    'test/also-loads.test.mjs': "import './support/tmp.mjs';\nimport { ROOT } from './support/page.mjs';\n",
    'test/other.test.mjs': "import './support/tmp.mjs';\n",
    'test/queue.test.mjs': "import '../scripts/ship-queue.mjs';\n" };
  for (let i = 1; i <= 6; i++) files[`test/support/uses-${i}.mjs`] = "export * from './page.mjs';\n";
  for (let i = 1; i <= 13; i++) files[`test/support/plain-${i}.mjs`] = '';
  files['test/support/tmp.mjs'] = '';
  return repo(files);
}
const JOINED = f => `export const F = path.join(ROOT, 'templates', '${f}');`;

test('0696 AC1: a change to a file a support module loads into the page brings in every test that imports that module', () => {
  const dir = pageRepo(JOINED);
  for (const f of ['templates/panel.js', 'templates/panel-base.css']) {
    assert.deepEqual(picked(dir, `change-${path.basename(f)}`, f), ['test/also-loads.test.mjs', 'test/loads.test.mjs'], f);
    const chosen = relatedTests(dir, 'main');
    assert.ok(chosen.every(c => c.because === f && c.through === 'test/support/page.mjs'), JSON.stringify(chosen));
  }
});

// The files test/support/panel.mjs loads into the page: the page, its styles and every script it loads.
const PAGE_FILES = ['templates/panel.html', ...STYLE_FILES.map(f => `templates/${f}`), ...pageScripts().map(s => `templates/${s.src}`)];
const importsPanel = text => /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])\.\/support\/panel\.mjs\1/.test(text);

test('0696 AC1: in this repo, a change to any file the panel\'s page loads brings in every test file that imports test/support/panel.mjs', () => {
  assert.ok(PAGE_FILES.includes('templates/panel.js') && PAGE_FILES.length >= 10, PAGE_FILES.join(' '));
  const dir = measuredRepo(ROOT, []);
  const loaders = fs.readdirSync(path.join(dir, 'test')).filter(f => /\.test\.mjs$/.test(f))
    .filter(f => importsPanel(fs.readFileSync(path.join(dir, 'test', f), 'utf8'))).map(f => `test/${f}`);
  assert.ok(loaders.length > 100, `${loaders.length} test files import it`);
  for (const f of PAGE_FILES) {
    const got = new Set(picked(dir, `page-${path.basename(f)}`, f));
    const missing = loaders.filter(t => !got.has(t));
    assert.deepEqual(missing, [], `${f} doesn't bring in ${missing.length} of them`);
  }
});

test('0696 AC2: a support module that joins a file\'s path from its parts, or builds it with new URL, names it as one writing it whole does', () => {
  const ways = {
    joined: JOINED,
    url: f => `export const F = new URL('../../templates/${f}', import.meta.url);`,
    whole: f => `export const F = 'templates/${f}';`,
  };
  for (const [way, how] of Object.entries(ways)) {
    const dir = pageRepo(how);
    assert.deepEqual(picked(dir, `${way}-js`, 'templates/panel.js'), ['test/also-loads.test.mjs', 'test/loads.test.mjs'], way);
  }
});

test('0696 AC3: a change to a file no support module loads brings in only the tests that name it themselves', () => {
  const dir = pageRepo(JOINED);
  assert.deepEqual(relatedTests(dir, 'main'), []);
  assert.deepEqual(pickedFor(dir, relatedTests, 'queue', ['scripts/ship-queue.mjs']), [{ test: 'test/queue.test.mjs', because: 'scripts/ship-queue.mjs' }]);
});

test('0696 AC3: in this repo, scripts/ship-queue.mjs brings in only the tests that name it, and the CLI none through a support module', () => {
  const dir = measuredRepo(ROOT, ['scripts/ship-queue.mjs', 'scripts/speck.mjs']);
  const queue = pickedFor(dir, relatedTests, 'queue', ['scripts/ship-queue.mjs']);
  assert.ok(queue.length > 0);
  assert.deepEqual(queue.filter(c => c.through), []);
  for (const { test: t } of queue) assert.match(fs.readFileSync(path.join(dir, t), 'utf8'), /ship-queue\.mjs/, t);
  const cli = pickedFor(dir, relatedTests, 'cli', ['scripts/speck.mjs']);
  assert.ok(cli.length > 0);
  assert.deepEqual(cli.filter(c => c.through), []);
});

test('0696 AC1: the brief\'s speck test row says a file few support modules name brings in the tests that import them', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck test` |'));
  assert.ok(row.includes('`test/support/panel.mjs`'));
});
