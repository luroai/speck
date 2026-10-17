import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0090: an MIT licence in Luro's name ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const MIT = `MIT License

Copyright (c) 2026 Luro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

test('AC1: LICENSE at the repo root is the standard MIT text, copyright 2026 Luro', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'LICENSE')), 'LICENSE exists at the repo root');
  const text = read('LICENSE');
  assert.match(text, /^Copyright \(c\) 2026 Luro$/m);
  assert.equal(text, MIT);
});

test('AC2: the README links to LICENSE and names MIT', () => {
  const readme = read('README.md');
  assert.match(readme, /\]\(LICENSE\)/, 'the README links to LICENSE');
  assert.match(readme, /\bMIT\b/);
});

test('AC2: package.json still says MIT', () => {
  assert.equal(JSON.parse(read('package.json')).license, 'MIT');
});
