import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI } from './support/speck.mjs';

// ---------- 0255: replace speck's tagline with one that says what's different ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TAGLINE = "Ship code you can't read, and still trust it.";
// 0262: the README revision made on GitHub cut the plain line to end at "every time.".
const PLAIN = 'speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time.';
const OLD = 'Your judgement, at agent speed.';

test('0255 AC1: under the # speck heading, the README opens with the new tagline and the plain line', () => {
  const readme = read('README.md');
  const lines = readme.split('\n').filter(l => l.trim());
  assert.equal(lines[0], '# speck');
  assert.equal(lines[1], `**${TAGLINE}**`);
  assert.equal(lines[2], PLAIN);
  assert.ok(!readme.includes(OLD), 'the old tagline is gone from the README');
});

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
