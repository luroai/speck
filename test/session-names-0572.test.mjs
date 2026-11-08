import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0572: speck finds a resumed build by its session name across every process on the machine, so a stand-in agent's
// name must be its own test run's, or a copy of the same test running at the same time is found instead.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { ownSession, assertFoundBySession, killAll, until } from './support/run.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(here, f), 'utf8');

test('0572 AC1: a stand-in\'s session name is its own test run\'s', () => {
  assert.equal(ownSession('hand-0001'), `hand-0001-${process.pid}`);
});

test('0572 AC1: no test starts a stand-in agent with a fixed session name on its command line', () => {
  const fixed = /(?:spawn|sleeper)\(.*['"]--(?:session-id|resume)['"],\s*['"`]/;
  for (const dir of ['.', 'support']) {
    for (const name of fs.readdirSync(path.join(here, dir)).filter(n => n.endsWith('.mjs'))) {
      if (name === 'session-names-0572.test.mjs') continue;
      const hit = read(path.join(dir, name)).split('\n').find(l => fixed.test(l));
      assert.equal(hit, undefined, `${name}: ${hit}`);
    }
  }
});

test('0572 AC1: the builds speck run resumes under a stand-in have no fixed session name', () => {
  for (const [file, names] of [['seen-builds-0300.test.mjs', ["'--session-id', `hand-"]], ['run-codex-0289.test.mjs', ["started('thread-k')", "'resume', 'thread-k'"]], ['run-cursor-0290.test.mjs', ["session: 'chat-k'", "FAKE_CHAT: 'chat-0290'"]]]) {
    const text = read(file);
    for (const name of names) assert.ok(!text.includes(name), `${file} still names ${name}`);
  }
});

test('0572 AC3: a stand-in is found by its session name, and only by the name it runs under', async () => {
  const session = ownSession('found');
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)', '--', 'claude', '--resume', session], { detached: true, stdio: 'ignore' });
  p.unref();
  try {
    assert.ok(await until(() => { try { assertFoundBySession(session, p.pid); return true; } catch { return false; } }, 5000));
    assert.throws(() => assertFoundBySession(ownSession('nobody'), p.pid));
  } finally { killAll([p.pid]); }
});
