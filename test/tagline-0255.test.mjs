import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/speck.mjs';

// ---------- 0255: replace speck's tagline with one that says what's different ----------
// 0267 removed the check on the README's opening lines, which review checks now.

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TAGLINE = "Ship code you can't read, and still trust it.";
const OLD = 'Your judgement, at agent speed.';

test('0255 AC2: speck help, the comment at the top of scripts/speck.mjs and package.json use the new tagline', () => {
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
