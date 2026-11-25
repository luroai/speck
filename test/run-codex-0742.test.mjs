import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fakeCodex } from './support/fake-codex.mjs';

// ---------- 0742: steady the 0289 killed-Codex-build test's reads ----------

// Preloaded into the fake: its write of a call file stops halfway, as a reader on a busy machine can find it.
const HALF = `
const fs = require('fs'), write = fs.writeFileSync;
fs.writeFileSync = (f, data, ...rest) => {
  if (!String(f).startsWith(process.env.FAKE_OUT)) return write(f, data, ...rest);
  write(f, String(data).slice(0, 10), ...rest);
  process.exit(7);
};
`;
const run = (codex, args, more = {}) => spawnSync('codex', args, { env: { ...process.env, ...codex.env(more) }, encoding: 'utf8' });

test('0742 AC1: a half-written call file of the fake codex is not read', () => {
  const hook = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'half-')), 'half.cjs');
  fs.writeFileSync(hook, HALF);
  const codex = fakeCodex();
  assert.equal(run(codex, ['exec'], { NODE_OPTIONS: `--require ${JSON.stringify(hook)}` }).status, 7, 'stopped halfway through its write');
  assert.deepEqual(codex.calls(), []);
});

test('0742 AC2: a finished call is still read back with the arguments the fake codex was given', () => {
  const codex = fakeCodex();
  assert.equal(run(codex, ['exec', 'resume', 't-1']).status, 0);
  assert.equal(run(codex, ['exec']).status, 0);
  assert.deepEqual(codex.calls().map(c => c.args), [['exec', 'resume', 't-1'], ['exec']]);
});
