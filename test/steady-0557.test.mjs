import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';
import { UNTIL_MS } from './support/panel.mjs';
import { CHECK_BUDGET_S, BUSY_SHARE, spendCpu, testBody } from './support/quick-run.mjs';

// ---------- 0557: steady 0232 AC3 and 0472 AC3 under a busy run ----------

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
const cpuMs = () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
const ac3of0232 = () => testBody(src('quick-waits-0232.test.mjs'), "0232 AC3: 0176 AC3\\'s check");
const ac3of0472 = () => testBody(src('panel-0472.test.mjs'), '0472 AC3: in a real browser');

test('0557 AC1: the costly check in 0232 AC3 spends CPU time, not time on the clock', () => {
  const t = ac3of0232();
  assert.match(t, /spendCpu\(1000\)/);
  assert.doesNotMatch(t, /Date\.now\(\)/, 'no loop that a busy machine can fill with waiting');
  // The line it puts in the copy of speck run spends what it says, however long that takes.
  const from = cpuMs();
  new Function(spendCpu(50))();
  assert.ok(cpuMs() - from >= 50, `spent ${cpuMs() - from} ms of CPU`);
});

test('0557 AC1: 0232 AC3 waits long enough between checks that a run given a tenth of a core is still seen over budget', () => {
  const t = ac3of0232(), poll = Number(t.match(/pollMs: (\d+)/)?.[1]), cost = Number(t.match(/spendCpu\((\d+)\)/)?.[1]);
  assert.ok(BUSY_SHARE * poll / 1000 >= CHECK_BUDGET_S, `${BUSY_SHARE} of a core over ${poll} ms is at least ${CHECK_BUDGET_S} s`);
  assert.ok(cost / 1000 > CHECK_BUDGET_S, 'each check costs more than the budget');
  assert.ok(cost < poll, 'and less than the wait, so a quiet machine sees the whole of it');
  assert.match(t, /assert\.ok\(!\(m\.perCheck < CHECK_BUDGET_S\)/, 'it still asks whether 0176 AC3\'s check would fail');
});

test('0557 AC2: 0472 AC3 waits up to a minute for Settings\' agents, and the other views as long as before', () => {
  const s = src('panel-0472.test.mjs');
  assert.equal(Number(s.match(/const AGENTS_MS = (\d+);/)?.[1]), 60000);
  assert.ok(60000 > UNTIL_MS);
  const settings = s.split('\n').find(l => l.startsWith("  ['Settings', "));
  assert.match(settings, /settingsView\.catalogues !== 'loading'`, false, AGENTS_MS\]/);
  assert.equal(s.split('\n').filter(l => /AGENTS_MS\]/.test(l)).length, 1, 'only Settings waits longer');
  const t = ac3of0472();
  assert.match(t, /for \(const \[view, open, shows, check = true, ms\] of VIEWS\)/);
  assert.match(t, /await b\.until\(shows, view, ms\);/);
});

test('0557 AC2: 0472 AC3 still compares every element\'s computed style in each of its four ways of seeing the page', () => {
  const t = ac3of0472();
  assert.match(t, /const SEEN = \[\[390, 3, false\], \[390, 3, true\], \[1200, 1, false\], \[1200, 1, true\]\];/);
  assert.match(t, /for \(const way of SEEN\)/);
  assert.match(t, /for \(const look of \['light', 'dark'\]\)/);
  assert.match(t, /assert\.equal\(d\.bad, 0,/);
  assert.match(t, /assert\.ok\(compared > 10000,/);
});
