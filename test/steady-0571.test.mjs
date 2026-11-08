import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';
import { UNTIL_MS } from './support/panel.mjs';
import { testBody } from './support/quick-run.mjs';

// ---------- 0571: steady 0150 AC2's wait for the Settings view ----------

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
const ac2of0150 = () => testBody(src('panel-0150.test.mjs'), '0150 AC2: pressing Enter or Space');
const limitOf0472 = () => Number(src('panel-0472.test.mjs').match(/const AGENTS_MS = (\d+);/)?.[1]);

test('0571 AC1: 0150 AC2 waits for the Settings view at least as long as 0472 AC3', () => {
  const limit = Number(src('panel-0150.test.mjs').match(/const AGENTS_MS = (\d+);/)?.[1]);
  assert.ok(limit >= limitOf0472(), `${limit} ms is at least 0472 AC3's ${limitOf0472()} ms`);
  assert.ok(limit > UNTIL_MS, 'longer than the default it failed on');
  assert.match(ac2of0150(), /Loading your agents.*'the Settings view', AGENTS_MS\);/);
});

test('0571 AC2: every wait for "Loading your agents" to go gives a limit of its own', () => {
  const dir = path.join(ROOT, 'test');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.mjs') && f !== 'steady-0571.test.mjs');
  const waits = files.flatMap(f => src(f).split('\n').filter(l => /\buntil\(/.test(l) && /Loading your agents/.test(l)).map(l => [f, l]));
  assert.ok(waits.length >= 1, 'it found the waits');
  for (const [f, l] of waits) assert.match(l, /, \w+\);\s*$/, `${f} gives its own limit: ${l.trim().slice(0, 80)}`);
});

test('0571 AC3: 0150 AC2 still presses Enter and Space and checks that each starts or pauses speck run', () => {
  const t = ac2of0150();
  assert.match(t, /await press\(b, 'Enter', 'Enter', 13\);/);
  assert.match(t, /await press\(b, ' ', 'Space', 32\);/);
  assert.match(t, /assert\.deepEqual\(await b\.js\('window\.runCalls'\), \['on'\]\);/);
  assert.match(t, /assert\.deepEqual\(await b\.js\('window\.runCalls'\), \['on', 'off'\]\);/);
});
