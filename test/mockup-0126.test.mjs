import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, page, PALETTE, paletteProblems } from './support/panel.mjs';

// ---------- 0126: remove the panel mockup from the repo ----------

const MOCKUP = 'docs/panel-mockup.html';
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('0126 AC1: the panel mockup is not on disk and not tracked by git', () => {
  assert.equal(fs.existsSync(path.join(ROOT, MOCKUP)), false);
  assert.equal(git('ls-files', MOCKUP).stdout, '');
});

test('0126 AC2: the agreed colour block is written in the test support, not read from the mockup', () => {
  assert.equal(PALETTE, '--bg: #faf9f5; --panel: #ffffff; --raise: #f0eee6; --line: #87847d; --line-soft: #e8e7e3; --text: #141413; --muted: #3d3d3a; --faint: #4d4c48; --accent: #853123; --ok: #3f522e; --warn: #67460b; --bad: #921f2d; --run: #304f6d; --idea: #623f6c');
  assert.doesNotMatch(read('test/panel.test.mjs'), /panel-mockup/);
});

test('0126 AC2: the panel page has every agreed colour', () => {
  assert.deepEqual(paletteProblems(page()), []);
});

test('0126 AC2: the colour check fails when a value is changed or missing', () => {
  const html = page();
  const changed = html.replace('--accent: #853123;', '--accent: #b0412f;');
  assert.notEqual(changed, html);
  assert.deepEqual(paletteProblems(changed), ['--accent should be #853123']);
  const missing = html.replace('--idea: #623f6c;', '');
  assert.notEqual(missing, html);
  assert.deepEqual(paletteProblems(missing), ['--idea should be #623f6c']);
  assert.equal(paletteProblems('<style>body {}</style>').length, 14, 'no :root block at all');
});

test('0126 AC3: the 0082 AC5 test checks the mockup is gone instead of reading it', () => {
  const src = read('test/luro-0082.test.mjs');
  assert.doesNotMatch(src, /read\('docs\/panel-mockup\.html'\)/);
  assert.match(src, /test\('AC5: the panel mockup is gone'/);
});
