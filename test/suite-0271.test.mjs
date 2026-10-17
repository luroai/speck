import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as heavyModule from './support/heavy.mjs';
import { heavyFiles } from './support/heavy.mjs';
import { fixture, runWith, mostAtOnce, overlapped, names, waiting } from './support/suite-fixture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELPERS = ['startPanel', 'browserPage', 'startRun', 'buildPanel', 'slowPanel', 'readyPanel', 'launched'];

// A stand-in helper of that name, called at the top of the file, as a heavy test file calls the real one.
const calls = helper => `const ${helper} = () => {};\n${helper}();`;

test('0271 AC1: a test file is heavy when its code calls a helper that starts a real panel, browser or speck run, and only then', () => {
  const files = {
    ...Object.fromEntries(HELPERS.map(h => [`calls-${h}.test.mjs`, { code: calls(h) }])),
    'plain.test.mjs': {},
    'imports-only.test.mjs': { code: "// startPanel is named here but never called: startPanel, browserPage" },
    'other-name.test.mjs': { code: 'const restartPanel = () => {};\nrestartPanel();\nconst unlaunched = () => {};\nunlaunched();' },
  };
  const dir = fixture(files);
  const all = Object.keys(files).map(f => `test/${f}`);
  assert.deepEqual(heavyFiles(dir, all).sort(), HELPERS.map(h => `test/calls-${h}.test.mjs`).sort());
  assert.deepEqual(heavyFiles(dir, ['test/missing.test.mjs']), [], 'a file that can\'t be read isn\'t heavy');
});

test('0271 AC1: in this repo, the files that start a real panel, browser or speck run are heavy, and the runner\'s own tests aren\'t', () => {
  const files = fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs')).map(f => `test/${f}`);
  const heavy = heavyFiles(ROOT, files);
  for (const f of ['test/panel.test.mjs', 'test/run.test.mjs', 'test/panel-0039.test.mjs', 'test/killed-0174.test.mjs']) assert.ok(heavy.includes(f), f);
  for (const f of ['test/suite-0233.test.mjs', 'test/suite-0271.test.mjs']) assert.ok(!heavy.includes(f), f);
});

test('0271 AC2 AC3: with 8 cores and no list given, files that start a real panel run at most 2 at a time, beside the others', () => {
  const heavy = names('heavy', 5), light = names('light', 6);
  const dir = fixture({ ...waiting(heavy, { ms: 1000, code: calls('startPanel') }), ...waiting(light, { ms: 1000 }) });
  const r = runWith(dir, { cores: 8, concurrency: 4 });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(mostAtOnce(dir, heavy), 2, 'heavy files at once');
  assert.equal(mostAtOnce(dir, light), 4, 'other files at once');
  assert.ok(overlapped(dir, heavy, light), 'the heavy files run beside the others');
});

test('0271 AC3: with more than 8 cores and no list given, files that start a real panel run with no limit of their own', () => {
  const heavy = names('heavy', 5);
  const dir = fixture(waiting(heavy, { ms: 1000, code: calls('startPanel') }));
  const r = runWith(dir, { cores: 16, concurrency: 4 });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(mostAtOnce(dir, heavy), 4);
});

test('0271 AC4: no hand-kept list of heavy test files is left, and no test reads one', () => {
  for (const [name, value] of Object.entries(heavyModule)) assert.ok(!Array.isArray(value), `heavy.mjs exports a list, ${name}`);
  const tests = fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs') && f !== 'suite-0271.test.mjs');
  assert.deepEqual(tests.filter(f => /\bHEAVY\b/.test(fs.readFileSync(path.join(ROOT, 'test', f), 'utf8'))), []);
});
