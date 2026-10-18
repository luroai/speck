import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectFacts } from '../scripts/detect.mjs';
import { findAgents } from '../scripts/agents.mjs';

// ---------- 0310: speck detect finds Cursor's CLI as `agent` or `cursor-agent` ----------

const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

// A folder holding the named fake tools, each one that just exits 0.
function binWith(...names) {
  const bin = tmp('speck-bin-');
  for (const name of names) fs.writeFileSync(path.join(bin, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return bin;
}

// Runs fn with `dir` as the whole PATH.
function onlyOnPath(dir, fn) {
  const was = process.env.PATH;
  process.env.PATH = dir;
  try { return fn(); } finally { process.env.PATH = was; }
}

const detectCursor = bin => onlyOnPath(bin, () => detectFacts(tmp('speck-detect-')).agents['cursor-agent'].on_path);
const agentsCursor = bin => onlyOnPath(bin, () => findAgents({ only: 'cursor', models: false }).agents[0].installed);

test('0310 AC1: with only `agent` on the PATH, speck detect reports Cursor installed', () => {
  assert.equal(detectCursor(binWith('agent')), true);
});

test('0310 AC2: with only `cursor-agent` on the PATH, speck detect reports Cursor installed', () => {
  assert.equal(detectCursor(binWith('cursor-agent')), true);
});

test('0310 AC3: with neither on the PATH, speck detect reports Cursor missing', () => {
  assert.equal(detectCursor(binWith()), false);
  assert.equal(detectCursor(binWith('cursor', 'agents')), false);
});

test('0310 AC4: speck detect and speck agents agree on whether Cursor is installed', () => {
  for (const names of [['agent'], ['cursor-agent'], ['agent', 'cursor-agent'], []]) {
    const bin = binWith(...names);
    assert.equal(detectCursor(bin), agentsCursor(bin), `with ${names.join(' and ') || 'neither'} on the PATH`);
  }
});

test('0310 AC1: the brief says speck detect finds Cursor\'s CLI by either name', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck detect` |'));
  for (const name of ['`agent`', '`cursor-agent`']) assert.ok(row.includes(name), `the speck detect row names ${name}`);
});
