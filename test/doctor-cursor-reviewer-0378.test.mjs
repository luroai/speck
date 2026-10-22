import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { doctorChecks } from '../scripts/install.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

// A folder holding an executable file for each name, to stand in for an installed CLI.
function bin(names = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-bin-'));
  for (const name of names) fs.writeFileSync(path.join(dir, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return dir;
}

// doctor's checks with PATH set to `dirs` only.
function checksWith(dirs, cfg) {
  const was = process.env.PATH;
  process.env.PATH = dirs.join(path.delimiter);
  try { return doctorChecks(ROOT, cfg, 'linux'); } finally { process.env.PATH = was; }
}
const reviews = checks => checks.filter(c => /review/i.test(c.name));

test('0378 AC1: with reviewer cursor and no command, doctor checks agent or cursor-agent is on the PATH', () => {
  for (const names of [['agent'], ['cursor-agent'], ['agent', 'cursor-agent']]) {
    const [c, ...rest] = reviews(checksWith([bin(names)], { reviewer: 'cursor' }));
    assert.equal(rest.length, 0, 'one reviewer check');
    assert.match(c.name, /Cursor CLI \(reviews tickets\)/);
    assert.equal(c.ok, true, `${names.join(' and ')} counts as installed`);
  }
  for (const cfg of [{ reviewer: 'cursor' }, { reviewer: 'cursor', reviewer_options: { cursor: {} } }, { reviewer: 'cursor', reviewer_options: { cursor: { command: '  ' } } }]) {
    const [c] = reviews(checksWith([bin()], cfg));
    assert.equal(c.ok, false, 'neither installed: the check fails');
    assert.match(c.fix, /Install the Cursor CLI/);
    assert.match(c.fix, /https:\/\/cursor\.com\/docs\/cli\/installation/);
  }
});

test('0378 AC2: a command under reviewer_options.cursor is checked by its first word, without requiring agent or cursor-agent', () => {
  const cfg = { reviewer: 'cursor', reviewer_options: { cursor: { command: 'my-cursor --flag' } } };
  const [c, ...rest] = reviews(checksWith([bin(['my-cursor'])], cfg));
  assert.equal(rest.length, 0, 'no Cursor CLI check besides it');
  assert.equal(c.name, 'Reviewer command for "cursor" (my-cursor)');
  assert.equal(c.ok, true, 'passes with only the command\'s first word on the PATH');
  const [missing] = reviews(checksWith([bin(['agent'])], cfg));
  assert.equal(missing.ok, false, 'agent being installed doesn\'t stand in for the command');
});

test('0378 AC3: codex and claude reviewers, and a cursor builder, are checked as before', () => {
  const claude = reviews(checksWith([bin(['claude'])], { reviewer: 'claude' }));
  assert.deepEqual(claude.map(c => [c.name, c.ok]), [['Claude Code (reviews tickets)', true]]);
  const codex = reviews(checksWith([bin()], { reviewer: 'codex' }));
  assert.deepEqual(codex.map(c => [c.name, c.ok]), [['Codex CLI (reviews tickets)', false]]);
  assert.deepEqual(reviews(checksWith([bin()], {})).map(c => c.name), ['Codex CLI (reviews tickets)'], 'codex is the default reviewer');
  const builder = checksWith([bin(['cursor-agent'])], { builder: 'cursor', reviewer: 'codex' });
  assert.deepEqual(builder.filter(c => /Cursor CLI/.test(c.name)).map(c => [c.name, c.ok]), [['Cursor CLI (builds tickets)', true]],
    'a cursor builder gets its own check, and no reviewer check for Cursor');
  const both = checksWith([bin(['agent'])], { builder: 'cursor', reviewer: 'cursor' });
  assert.deepEqual(both.filter(c => /Cursor CLI/.test(c.name)).map(c => c.name), ['Cursor CLI (builds tickets)', 'Cursor CLI (reviews tickets)']);
});

test('0378 AC1: the brief\'s speck doctor row names the Cursor reviewer check', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs/brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck doctor` |'));
  assert.match(row, /`reviewer: cursor`/);
  assert.match(row, /`agent` or `cursor-agent`/);
});
