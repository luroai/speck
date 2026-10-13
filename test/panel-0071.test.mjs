import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CLI, env, T, fakePage, queueRows, exitOf, nowStep } from './support/panel.mjs';
import { buildPanel, runs } from './support/build-panel.mjs';

// ---------- 0071: a paused build on its queue row (its pause and play icon went in 0145) ----------

const state = () => ({
  tickets: [
    T('0001', 'building', { build_running: true, paused: false, started: new Date(Date.now() - 60000).toISOString() }),
    T('0002', 'reviewing', { build_running: true, paused: true, started: new Date(Date.now() - 60000).toISOString() }),
    T('0003', 'building', { build_running: false, paused: false }), // built by hand, with no run record
    T('0004', 'approved', { build_running: true, paused: false }),
    T('0005', 'blocked', { build_running: false, paused: false, blocked_question: 'A or B?' }),
    T('0006', 'building', { build_running: false, paused: false, ...exitOf('Stopped.') }),
    T('0007', 'ready', { build_running: false, paused: false }),
  ],
  ideas: [],
});
// A page whose server answers /api/state with `s`. The pause and play icon went in 0145; speck pause and play remain.
function page(s = state()) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(s))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');

test('0071 AC4: a paused build has no moving dot and says "Paused" beside its counter', async () => {
  const p = page();
  await p.settle();
  const paused = rowOf(p, '0002'), running = rowOf(p, '0001');
  assert.ok(!/\bmoving\b/.test(nowStep(paused).className), 'paused: the dot stops');
  assert.ok(/\bmoving\b/.test(nowStep(running).className), 'running: the dot moves');
  const sub = topOf(paused).children.find(n => n.className === 'sub');
  assert.match(sub.textContent, /^Paused · 01:0\d$/);
  assert.match(topOf(running).children.find(n => n.className === 'sub').textContent, /^01:0\d$/);
  // The counter's own timer keeps "Paused" in place.
  for (const { fn } of p.intervals.values()) fn();
  assert.match(sub.textContent, /^Paused · 01:0\d$/);
});

test('0071 AC4: played again, the dot moves and "Paused" goes', async () => {
  const s = state();
  const p = page(s);
  await p.settle();
  s.tickets[1].paused = false;
  p.timers.shift()();
  await p.settle();
  const row = rowOf(p, '0002');
  assert.ok(/\bmoving\b/.test(nowStep(row).className));
  assert.match(topOf(row).children.find(n => n.className === 'sub').textContent, /^01:0\d$/);
});

// ---------- the server ----------

const json = dir => JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, encoding: 'utf8', env }).stdout);
const of = (dir, id) => json(dir).tickets.find(t => t.id === id);

test('0071 AC1: speck status --json says which builds speck run launched are running', async () => {
  const b = await buildPanel();
  try {
    assert.equal(of(b.r.dir, '0001').build_running, true);
    assert.equal(of(b.r.dir, '0002').build_running, false, 'no run record');
    fs.writeFileSync(runs(b.r.dir, '0002.json'), JSON.stringify({ session: 's-2', pid: b.pid, cwd: b.r.dir, exited: '2026-10-09T10:00:00Z', exit_code: 0 }));
    assert.equal(of(b.r.dir, '0002').build_running, false, 'exited');
  } finally { await b.done(); }
});

