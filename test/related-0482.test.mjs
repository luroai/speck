// 0482: 0447's check of what 0437's change picks guards 0447's rules for `speck test --related` without counting
// the tests in this repo, so it doesn't start failing as the suite grows.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './support/panel.mjs';
import os from 'node:os';
import { checkMeasured, measuredRepo, pickedFor } from './support/related.mjs';
import { relatedTests } from '../scripts/related.mjs';

// What 0447's AC3 test measures.
const MEASURED = { change: ['scripts/turns.mjs', 'skills/speck-build/SKILL.md', 'docs/brief.md'], names: /(?<![\w.-])turns\.mjs/, cli: ['scripts/speck.mjs'] };
const FILES = [...MEASURED.change, ...MEASURED.cli];

// 100 more tests, each naming docs/brief.md.
const MORE = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`test/more-${i}.test.mjs`, "const f = 'docs/brief.md';\n"]));

test('0482 AC1: with 100 more tests naming docs/brief.md, the check still passes, where counting would fail', () => {
  const dir = measuredRepo(ROOT, FILES, MORE);
  const picked = checkMeasured(dir, relatedTests, MEASURED);
  assert.ok(picked.length >= 100, `picked ${picked.length}`);
  for (const f of Object.keys(MORE)) assert.ok(picked.includes(f), f);
});

// scripts/related.mjs with one of 0447's rules turned off, loaded from a copy outside the repo.
const RULES = {
  'a SKILL.md never brings a test in through a support module': ['!c.skill && ', ''],
  'a file more than a quarter of the support modules name brings no test in through one': ['<= modules.length / 4', '<= Infinity'],
};
async function relatedWithout(rule) {
  const [from, to] = RULES[rule];
  const text = fs.readFileSync(path.join(ROOT, 'scripts', 'related.mjs'), 'utf8');
  assert.equal(text.split(from).length, 2, `scripts/related.mjs has "${from}" once`);
  const core = pathToFileURL(path.join(ROOT, 'scripts', 'core.mjs')).href;
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-related-')), 'related.mjs');
  fs.writeFileSync(file, text.replace(from, to).replace("from './core.mjs'", `from '${core}'`));
  return (await import(pathToFileURL(file).href)).relatedTests;
}

test('0482 AC2: the check fails with each of 0447\'s two rules for support modules turned off', async () => {
  const dir = measuredRepo(ROOT, FILES);
  checkMeasured(dir, relatedTests, MEASURED);
  for (const rule of Object.keys(RULES)) {
    const without = await relatedWithout(rule);
    assert.throws(() => checkMeasured(dir, without, MEASURED), /through a support module/, rule);
  }
});

test('0482 AC3: every test naming scripts/turns.mjs is among the tests 0437\'s change picks', () => {
  const dir = measuredRepo(ROOT, FILES);
  const picked = pickedFor(dir, relatedTests, 'turns', MEASURED.change).map(c => c.test);
  const turns = fs.readdirSync(path.join(ROOT, 'test'), { recursive: true }).map(f => `test/${f}`)
    .filter(f => /\.test\.mjs$/.test(f) && !f.startsWith('test/support/') && MEASURED.names.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert.ok(turns.includes('test/related-0482.test.mjs'));
  for (const f of turns) assert.ok(picked.includes(f), f);
});
