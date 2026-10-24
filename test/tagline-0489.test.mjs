import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/speck.mjs';

// ---------- 0489: the tagline says how speck is used: plan, then come back to it shipped ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TAGLINE = 'Plan in ten minutes. Come back to it shipped.';
const OLD = "Ship code you can't read";

// The README's tagline is left to review: 0491 lets only a few test files read the README.
test('0489 AC1: speck help, scripts/speck.mjs and package.json use the new tagline, and none keeps the old one', () => {
  const help = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' }).stdout;
  assert.equal(help.split('\n')[0], `speck: ${TAGLINE}`);
  assert.ok(!help.includes(OLD), 'speck help no longer has the old tagline');

  const script = read('scripts/speck.mjs');
  assert.equal(script.split('\n')[1], `// speck: ${TAGLINE}`);
  assert.ok(!script.includes(OLD), 'scripts/speck.mjs no longer has the old tagline');

  const { description } = JSON.parse(read('package.json'));
  assert.ok(description.startsWith(TAGLINE), description);
  assert.ok(!description.includes(OLD), description);
});
