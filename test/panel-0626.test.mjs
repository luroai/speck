import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0626: the project menu's tests (0516) use made-up project names, never one from the user's machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { privateWordList } from '../scripts/private-words.mjs';

const FILE = new URL('./panel-0516.test.mjs', import.meta.url);
const MADE_UP = new Set(['speck', 'alpha', 'beta', 'bravo', 'charlie', 'gone', 'wrong port', 'mine', 'other', 'b', 'x']);

// Every sample project's name in the file: [port, 'name'] pairs, name: '…' fields and panelRepo's folder prefixes.
function sampleNames(src) {
  const names = [];
  for (const m of src.matchAll(/\[\s*\d+\s*,\s*'([^']*)'\s*\]/g)) names.push(m[1]);
  for (const m of src.matchAll(/\bname:\s*'([^']*)'/g)) names.push(m[1]);
  for (const m of src.matchAll(/prefix:\s*'(?:speck-keep-)?([^'-]+)-'/g)) names.push(m[1]);
  return names;
}

test('0626 AC1: every sample project in the project menu\'s tests is speck or a made-up name', () => {
  const names = sampleNames(fs.readFileSync(FILE, 'utf8'));
  assert.ok(names.length > 20, `the sample projects are found (${names.length})`);
  assert.deepEqual([...new Set(names.filter(n => !MADE_UP.has(n)))], [], 'names that aren\'t made up');
  assert.ok(names.includes('alpha') && names.includes('beta'));
});

test('0626 AC1: the project menu\'s tests hold none of the user\'s private words', () => {
  const src = fs.readFileSync(FILE, 'utf8').toLowerCase();
  const { words } = privateWordList();
  const found = words.filter(w => src.includes(w));
  assert.equal(found.length, 0, `${found.length} of the private words appear`); // without repeating them
});
