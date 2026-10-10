import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { doctorChecks, cmdDoctor, cmdInit } from '../scripts/install.mjs';

// ---------- 0091: say plainly on Windows that speck doesn't support it yet ----------

const isWindowsItem = c => /WSL/.test(c.fix || '');

function gitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  return dir;
}

// Runs fn in dir and returns what it printed, and what it threw.
function capture(dir, fn) {
  const was = process.cwd(), log = console.log, lines = [];
  console.log = (...a) => lines.push(a.join(' '));
  let error;
  try { process.chdir(dir); fn(); } catch (e) { error = e; } finally { process.chdir(was); console.log = log; }
  return { out: lines.join('\n'), error };
}

test('0091 AC1: on Windows, doctor has a ✗ item saying speck supports macOS and Linux for now, fixed by using WSL', () => {
  const items = doctorChecks(gitRepo(), {}, 'win32').filter(isWindowsItem);
  assert.equal(items.length, 1);
  const [item] = items;
  assert.equal(item.ok, false);
  assert.ok(!item.optional && !item.info, 'a ✗ item, not a note');
  assert.match(item.name, /macOS and Linux/);
  assert.match(item.name, /Windows/);
  assert.match(item.fix, /WSL \(Windows Subsystem for Linux\)/);
  assert.match(item.fix, /run speck there/);
});

test('0091 AC1: speck doctor on Windows prints the ✗ item with its fix and fails', () => {
  const { out, error } = capture(gitRepo(), () => cmdDoctor([], 'win32'));
  assert.match(out, /✗ .*macOS and Linux/);
  assert.match(out, /Fix: .*WSL \(Windows Subsystem for Linux\)/);
  assert.match(out, /Fix the ✗ items above/);
  assert.equal(error?.code, 1);
});

test('0091 AC2: on macOS and Linux there is no such item, and every other check is unchanged', () => {
  const dir = gitRepo();
  const shape = checks => checks.map(({ name, ok, fix, optional, info }) => ({ name, ok, fix, optional, info }));
  const windows = doctorChecks(dir, {}, 'win32');
  for (const platform of ['linux', 'darwin']) {
    const checks = doctorChecks(dir, {}, platform);
    assert.equal(checks.filter(isWindowsItem).length, 0, platform);
    assert.deepEqual(shape(checks), shape(windows.filter(c => !isWindowsItem(c))), platform);
  }
  if (process.platform !== 'win32') assert.deepEqual(shape(doctorChecks(dir, {})), shape(doctorChecks(dir, {}, process.platform)), 'defaults to this platform');
});

test('0091 AC3: speck init on Windows shows the same item in its checks and ends by asking you to fix the ✗ items', () => {
  const { out, error } = capture(gitRepo(), () => cmdInit([], 'win32'));
  assert.equal(error, undefined);
  const checks = out.slice(out.indexOf('Checking what speck needs:'));
  assert.match(checks, /✗ .*macOS and Linux/);
  assert.match(checks, /Fix: .*WSL \(Windows Subsystem for Linux\)/);
  assert.match(out, /fix the ✗ items above before building a ticket/);
});

test('0091 AC2: speck init on Linux shows no such item', () => {
  const { out } = capture(gitRepo(), () => cmdInit([], 'linux'));
  assert.doesNotMatch(out, /WSL/);
});
