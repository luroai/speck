import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0736: the one test that still failed the full suite's retry on main (0159 AC3 under load) waits up to 10 s on the
// clock for Chrome's own 1 s limit, so a busy machine doesn't fail it. The named 0159 tests themselves check the
// give-up behaviour (`speck test --files`, and the full suite at ship).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

const src = fs.readFileSync(path.join(ROOT, 'test', 'panel-0159.test.mjs'), 'utf8');
function testIn(name) {
  const at = src.indexOf(`test('${name}`);
  assert.ok(at >= 0, `panel-0159 has ${name}`);
  const next = src.indexOf('\ntest(', at + 1);
  return src.slice(at, next < 0 ? undefined : next);
}

test('0736 AC1: 0159 AC3\'s b.js(), b.until() and b.loaded() give-up checks wait up to 10 s on the clock for a 1 s Chrome limit', () => {
  const js = testIn('0159 AC3: b.js() and b.until()');
  assert.match(js, /within\(10000, b\.js\('new Promise\(\(\) => \{\}\)', 1000\)/);
  assert.match(js, /within\(10000, b\.until\('false', 'a thing that never happens', 1000\)/);
  assert.match(testIn('0159 AC3: b.loaded() gives up'), /within\(10000, b\.loaded\(1000\)/);
});
