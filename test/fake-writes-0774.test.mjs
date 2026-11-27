import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fakeClaude } from './support/provider-builder.mjs';

// ---------- 0774: write the other fake agents' call files whole ----------

const source = name => fs.readFileSync(path.join(import.meta.dirname, name), 'utf8');
const literal = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Fails unless each file `name`'s fake writes to `target` is written under another name and then renamed to it.
function wholeIn(name, ...targets) {
  const text = source(name);
  for (const t of targets) {
    assert.match(text, new RegExp(`writeFileSync\\(${literal(t)} \\+ '\\.part',`), `${name}: ${t} is written under another name`);
    assert.match(text, new RegExp(`renameSync\\(${literal(t)} \\+ '\\.part', ${literal(t)}\\)`), `${name}: ${t} is renamed into place`);
    assert.doesNotMatch(text, new RegExp(`writeFileSync\\(${literal(t)},`), `${name}: ${t} has no plain write`);
  }
}

test('0774 AC1: the fake agents the ticket names write each call file under another name and rename it into place', () => {
  for (const name of ['run-0110.test.mjs', 'run-0194.test.mjs', 'run-cursor-0290.test.mjs', 'run-builder-0312.test.mjs',
    'run-settings-0549.test.mjs', 'machine-builds-0726.test.mjs', 'support/provider-builder.mjs']) wholeIn(name, 'call');
});

test('0774 AC1: a half-written call file of the provider fake is not read, and a finished one is', () => {
  const hook = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'half-')), 'half.cjs');
  // The fake's write of its call file stops halfway, as a reader on a busy machine can find it.
  fs.writeFileSync(hook, `const fs = require('fs'), write = fs.writeFileSync;
fs.writeFileSync = (f, data) => { write(f, String(data).slice(0, 10)); process.exit(7); };
`);
  const fake = fakeClaude();
  const run = env => spawnSync('claude', ['-p'], { encoding: 'utf8', env: { ...process.env, PATH: fake.PATH, ...env } });
  assert.equal(run({ NODE_OPTIONS: `--require ${JSON.stringify(hook)}` }).status, 7, 'stopped halfway through its write');
  assert.deepEqual(fake.calls(), []);
  assert.equal(run({}).status, 0);
  assert.deepEqual(fake.calls().map(c => c.args), [['-p']]);
});

test('0774 AC2: every other fake agent whose files are read while it runs writes them whole', () => {
  wholeIn('run-0245.test.mjs', 'call');
  wholeIn('run-agents-0654.test.mjs', 'call');
  wholeIn('reviewer-limit-0623.test.mjs', 'call', 'limit');
  wholeIn('usage-limit-0622.test.mjs', 'call');
  wholeIn('support/ticker.mjs', 'rec', 'pidFile', 'selfFile');
  wholeIn('build-panels-0619.test.mjs', 'pidFile');
  wholeIn('panel-0220.test.mjs', 'file');
  assert.match(source('support/ticker.mjs'), /renameSync\(\$\{|renameSync\(" \+ /, 'the stubborn writer\'s pid file is renamed into place');
  assert.match(source('foreman-agent-0287.test.mjs'), /> "\$\{out\}\/\$\$\.part" && mv "\$\{out\}\/\$\$\.part" "\$\{out\}\/\$\$\.txt"/);
});
