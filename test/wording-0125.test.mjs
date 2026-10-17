import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, gitIn } from './support/speck.mjs';

const TAGLINE = "Ship code you can't read, and still trust it.";
const help = () => spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' }).stdout;

function initOutput() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0125-'));
  gitIn(dir, 'init', '-q', '-b', 'main');
  const r = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.slice(r.stdout.indexOf('Next:'));
}

// 0267: whether the README gives the tagline is left to review.
test('0125 AC1: package.json and speck help share the tagline, and neither says "you merge"', () => {
  const description = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).description;
  assert.ok(description.startsWith(TAGLINE), description);
  const first = help().split('\n')[0];
  assert.ok(first.includes(TAGLINE), first);
  assert.doesNotMatch(description, /you merge/i);
  assert.doesNotMatch(help(), /you merge/i);
});

test('0125 AC2: speck help describes doctor by what it checks, without GitHub', () => {
  const line = help().split('\n').find(l => /^\s*speck doctor\b/.test(l));
  assert.ok(line, 'speck help has a doctor line');
  assert.doesNotMatch(line, /GitHub/);
  for (const word of ['git', 'builder', 'reviewer']) assert.match(line, new RegExp(`\\b${word}\\b`));
});

test('0125 AC3: speck init\'s next steps describe ticket, ready, run, panel and ship', () => {
  const next = initOutput();
  for (const want of ['/speck-ticket', 'ready', 'speck.mjs run', 'one at a time', 'speck.mjs panel', '/speck-ship', 'auto_ship', 'auto_ship_risk'])
    assert.ok(next.includes(want), `next steps mention ${want}:\n${next}`);
  assert.doesNotMatch(next, /speck-capture/);
});
