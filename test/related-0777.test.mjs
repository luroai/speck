// 0777: speck test --related doesn't follow a template through a support module that only names it in a comment, such
// as test/support/panel.mjs, whose fakePage reads any page by name and whose comment names the factory floor's.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, STYLE_FILES } from './support/panel.mjs';
import { measuredRepo, pickedFor, repo } from './support/related.mjs';
import { relatedTests } from '../scripts/related.mjs';

const picked = (dir, branch, ...files) => pickedFor(dir, relatedTests, branch, files).map(c => c.test).sort();

// Twenty support modules, as in this repo: page.mjs loads the panel's page and reads any other page by name, naming
// the floor's only in comments; floor.mjs imports it and loads the floor's page; six others import page.mjs.
function floorRepo() {
  const files = { 'templates/panel.html': '', 'templates/panel.js': '', 'templates/floor.html': '',
    'test/support/page.mjs': [
      "// Reads any page by name, such as the factory floor's (floor.html).",
      "export const PAGE = path.join(ROOT, 'templates', 'panel.html'); // the panel's page, not templates/floor.html",
      "export const SCRIPT = path.join(ROOT, 'templates', 'panel.js');",
      "const home = 'http://localhost/'; /* floor.html is read when a test asks for it */",
      "export const fakePage = (page = 'panel.html') => read(page);", ''].join('\n'),
    'test/support/floor.mjs': "import { fakePage } from './page.mjs';\nexport const floorPage = () => fakePage('floor.html');\n",
    'test/panel-a.test.mjs': "import { fakePage } from './support/page.mjs';\n",
    'test/panel-b.test.mjs': "import './support/tmp.mjs';\nimport { PAGE } from './support/page.mjs';\n",
    'test/floor-a.test.mjs': "import { floorPage } from './support/floor.mjs';\n",
    'test/other.test.mjs': "import './support/tmp.mjs';\n" };
  for (let i = 1; i <= 6; i++) files[`test/support/uses-${i}.mjs`] = "export * from './page.mjs';\n";
  for (let i = 1; i <= 11; i++) files[`test/support/plain-${i}.mjs`] = '';
  files['test/support/tmp.mjs'] = '';
  return repo(files);
}

test('0777 AC1: a template a support module names only in comments brings in no test through that module', () => {
  const dir = floorRepo();
  assert.deepEqual(picked(dir, 'floor', 'templates/floor.html'), ['test/floor-a.test.mjs']);
  const chosen = relatedTests(dir, 'main');
  assert.deepEqual(chosen, [{ test: 'test/floor-a.test.mjs', because: 'templates/floor.html', through: 'test/support/floor.mjs' }]);
});

const importsPanel = text => /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])\.\/support\/panel\.mjs\1/.test(text);
const testFiles = dir => fs.readdirSync(path.join(dir, 'test')).filter(f => /\.test\.mjs$/.test(f)).map(f => `test/${f}`);
const text = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');

test('0777 AC1: in this repo, a change to templates/floor.html brings in the floor\'s tests and none of the panel tests that never load it', () => {
  const dir = measuredRepo(ROOT, ['templates/floor.html']);
  const got = picked(dir, 'floor', 'templates/floor.html');
  const floorTests = testFiles(dir).filter(f => /support\/floor(?:-line)?\.mjs|floor\.html/.test(text(dir, f)));
  assert.ok(floorTests.length >= 5, floorTests.join(' '));
  for (const f of floorTests) assert.ok(got.includes(f), `${f} loads the floor but wasn't picked`);
  const strays = got.filter(f => !floorTests.includes(f));
  assert.deepEqual(strays, [], 'picked tests that never load the floor');
  assert.ok(got.length < 50, `${got.length} test files picked`);
});

test('0777 AC2: a file the panel\'s page loads still brings in the tests that load the panel', () => {
  const dir = floorRepo();
  for (const f of ['templates/panel.html', 'templates/panel.js']) {
    assert.deepEqual(picked(dir, `change-${path.basename(f)}`, f), ['test/panel-a.test.mjs', 'test/panel-b.test.mjs'], f);
  }
});

test('0777 AC2: in this repo, a change to the panel\'s page, script or styles still brings in every test that imports test/support/panel.mjs', () => {
  const files = ['templates/panel.html', 'templates/panel.js', `templates/${STYLE_FILES[0]}`];
  const dir = measuredRepo(ROOT, files);
  const loaders = testFiles(dir).filter(f => importsPanel(text(dir, f)));
  assert.ok(loaders.length > 100, `${loaders.length} test files import it`);
  for (const f of files) {
    const got = new Set(picked(dir, `page-${path.basename(f)}`, f));
    const missing = loaders.filter(t => !got.has(t));
    assert.deepEqual(missing, [], `${f} doesn't bring in ${missing.length} of them`);
  }
});

test('0777 AC3: a change to the support module itself still brings in every test that imports it', () => {
  const dir = floorRepo();
  assert.deepEqual(picked(dir, 'support', 'test/support/page.mjs'), ['test/panel-a.test.mjs', 'test/panel-b.test.mjs']);
  const real = measuredRepo(ROOT, []);
  const loaders = testFiles(real).filter(f => importsPanel(text(real, f)));
  const got = new Set(picked(real, 'panel-support', 'test/support/panel.mjs'));
  assert.deepEqual(loaders.filter(t => !got.has(t)), []);
});

test('0777 self-check: code() drops line and block comments but keeps a // inside a string and a quote inside a regex', async () => {
  const { code } = await import('../scripts/related.mjs');
  assert.equal(code("const a = 'b.js'; // c.js\n/* d.js\n e.js */const f = 'http://x/g.js';\n"), "const a = 'b.js'; \n const f = 'http://x/g.js';\n");
  assert.equal(code("const r = /(['\"])x/; // h.js\nconst i = 'j.js';\n").includes('h.js'), false);
  assert.equal(code("const u = `a // not a comment\n k.js`;\n").includes('k.js'), true);
  assert.equal(code("/* never closed floor.html"), ' ');
});

test('0777 F1: a file outside templates/ that a support module names only in a comment still brings in its tests', () => {
  const dir = repo({ 'scripts/serve.mjs': '',
    'test/support/serve.mjs': "// Starts the front of scripts/serve.mjs for a test.\nexport const start = () => {};\n",
    'test/serve-a.test.mjs': "import { start } from './support/serve.mjs';\n",
    'test/other.test.mjs': '', 'test/support/a.mjs': '', 'test/support/b.mjs': '', 'test/support/c.mjs': '' });
  assert.deepEqual(pickedFor(dir, relatedTests, 'serve', ['scripts/serve.mjs']),
    [{ test: 'test/serve-a.test.mjs', because: 'scripts/serve.mjs', through: 'test/support/serve.mjs' }]);
});
