import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, QUICK_PINGS, UNTIL_MS } from './support/panel.mjs';
import { fakeAgents, READY } from './support/agents.mjs';

// ---------- 0429: halve the time of the suite's slowest tests ----------

const read = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
// The source of the test in `file` whose name starts with `name`, up to the next top-level test.
function testIn(file, name) {
  const src = read(file);
  const at = src.indexOf(`test('${name}`);
  assert.ok(at >= 0, `${file} has the test ${name}`);
  const next = src.indexOf('\ntest(', at + 1);
  return src.slice(at, next < 0 ? undefined : next);
}

test('0429 AC2: the browser tests sped up still drive a real browser on a real panel, refreshing faster than the panel does by itself', () => {
  for (const [file, name] of [['panel-0050.test.mjs', '0050 AC1-AC5'], ['panel-0060.test.mjs', '0060 AC1-AC5'], ['panel-0040.test.mjs', '0040 AC1-AC5']]) {
    const body = testIn(file, name);
    assert.match(body, /await browserPage\(/, `${name} uses a real browser`);
    assert.match(body, /await startPanel\([^\n]*QUICK_PINGS\)/, `${name} starts a real panel with quick keep-alives`);
    assert.match(body, /await refreshed\(/, `${name} still waits for real refreshes`);
  }
  const ms = Number(QUICK_PINGS.SPECK_PANEL_PING_MS);
  assert.ok(ms > 0 && ms < 5000, `a keep-alive every ${ms} ms, against the panel's own 5 seconds`);
  assert.deepEqual(Object.keys(QUICK_PINGS), ['SPECK_PANEL_PING_MS'], 'nothing else about the panel changes');
});

test('0429 AC2: b.until() and b.loaded() still wait 10 seconds without a limit of their own, and 0159 checks each gives up in the one it\'s given', () => {
  assert.equal(UNTIL_MS, 10000);
  const body = testIn('panel-0159.test.mjs', '0159 AC3: b.js() and b.until()');
  assert.match(body, /await browserPage\(/);
  assert.match(body, /within\(2500, b\.until\('false', 'a thing that never happens', 1000\)/);
  assert.match(testIn('panel-0159.test.mjs', '0159 AC3: b.loaded() gives up'), /within\(2500, b\.loaded\(1000\)/);
});

test('0429 AC2: the settings test\'s stand-in agents come before any installed ones, so its panel never asks the real ones', () => {
  const PATH = `${fakeAgents(READY)}${path.delimiter}${process.env.PATH}`;
  for (const cmd of ['claude', 'codex', 'agent']) {
    const found = spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8', env: { ...process.env, PATH } }).stdout.trim();
    assert.equal(path.dirname(found), PATH.split(path.delimiter)[0], `${cmd} is the stand-in`);
  }
  assert.match(testIn('panel-0257.test.mjs', '0257 AC4-AC5'), /await startPanel\([^\n]*fakeAgents\(READY\)/);
});

test('0429 AC2: 0176 still times speck status the same number of times for each size, and keeps the least of each three', () => {
  const src = read('build-log-0176.test.mjs');
  assert.match(src, /try \{ return statusMs\(dir, 3\); \}/);
  assert.match(src, /for \(let round = 0; round < 4; round\+\+\)/);
  assert.match(src, /assert\.ok\(slow < fast \* 1\.1,/);
});
