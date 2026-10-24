// Throwaway git repos for the tests of `speck test --related` (0437, 0447, 0482).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { gIn } from './ship.mjs';

export const write = (dir, rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };

// A committed repo on main with these files, then a branch `feature`.
export function repo(files) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-related-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  for (const [rel, text] of Object.entries(files)) write(dir, rel, text);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  gIn(dir, 'checkout', '-qb', 'feature');
  return dir;
}

// The measured repo's files are given by the tests (0447, 0482), so this module names none of them and brings no test
// in through itself when one changes.

// This repo's test/ folder (from `root`), plus `extra` files, in a repo of its own on main with the `files` it measures.
export function measuredRepo(root, files, extra = {}) {
  const dir = repo(Object.fromEntries(files.map(f => [f, ''])));
  fs.cpSync(path.join(root, 'test'), path.join(dir, 'test'), { recursive: true, filter: src => !src.includes(`${path.sep}node_modules`) });
  for (const [rel, text] of Object.entries(extra)) write(dir, rel, text);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'tests');
  gIn(dir, 'branch', '-qf', 'main', 'HEAD');
  return dir;
}

// What `relatedTests` picks in `dir` for a branch off main that changes `files`.
export function pickedFor(dir, relatedTests, branch, files) {
  gIn(dir, 'checkout', '-qf', 'main'); gIn(dir, 'checkout', '-qB', branch);
  for (const f of files) write(dir, f, `changed ${f}\n`);
  gIn(dir, 'commit', '-qam', 'change');
  return relatedTests(dir, 'main');
}

// 0447's rules for `speck test --related`, checked in a measured repo without counting its tests (0482). `change`, a
// change that includes a skill's SKILL.md, brings in no test through a support module, yet picks every test whose text
// matches `names`. `cli`, a change to a file more than a quarter of the support modules name, picks tests but brings
// none in through a support module. Throws an assertion error saying which broke; returns what `change` picked.
export function checkMeasured(dir, relatedTests, { change, names, cli }) {
  const chosen = pickedFor(dir, relatedTests, 'measured-change', change);
  assert.deepEqual(chosen.filter(c => c.through), [], 'the change brings in tests through a support module');
  const picked = chosen.map(c => c.test);
  const named = fs.readdirSync(path.join(dir, 'test'), { recursive: true }).map(f => `test/${f}`)
    .filter(f => /\.test\.mjs$/.test(f) && !f.startsWith('test/support/') && names.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  assert.ok(named.length > 0, `no test matches ${names}`);
  for (const f of named) assert.ok(picked.includes(f), `${f} matches ${names} but wasn't picked`);
  const viaCli = pickedFor(dir, relatedTests, 'measured-cli', cli);
  assert.ok(viaCli.length > 0, 'the CLI change picks no test');
  assert.deepEqual(viaCli.filter(c => c.through), [], 'the CLI change brings in tests through a support module');
  return picked;
}
