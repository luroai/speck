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
  assert.equal(PALETTE, '--bg: #1c1d20; --panel: #232428; --raise: #2a2b30; --line: #36383e; --line-soft: #2e3035; --text: #d6d8dd; --muted: #8a8e97; --faint: #5f636c; --accent: #7aa7f0; --ok: #62b77a; --warn: #e3a04f; --bad: #e0675d; --run: #5fa8e0; --idea: #b291e6');
  assert.doesNotMatch(read('test/panel.test.mjs'), /panel-mockup/);
});

test('0126 AC2: the panel page has every agreed colour', () => {
  assert.deepEqual(paletteProblems(page()), []);
});

test('0126 AC2: the colour check fails when a value is changed or missing', () => {
  const html = page();
  const changed = html.replace('--accent: #7aa7f0;', '--accent: #7aa7f1;');
  assert.notEqual(changed, html);
  assert.deepEqual(paletteProblems(changed), ['--accent should be #7aa7f0']);
  const missing = html.replace('--idea: #b291e6;', '');
  assert.notEqual(missing, html);
  assert.deepEqual(paletteProblems(missing), ['--idea should be #b291e6']);
  assert.equal(paletteProblems('<style>body {}</style>').length, 14, 'no :root block at all');
});

test('0126 AC3: the 0082 AC5 test checks the mockup is gone instead of reading it', () => {
  const src = read('test/luro-0082.test.mjs');
  assert.doesNotMatch(src, /read\('docs\/panel-mockup\.html'\)/);
  assert.match(src, /test\('AC5: the panel mockup is gone'/);
});
