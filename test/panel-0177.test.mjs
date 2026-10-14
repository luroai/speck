import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { panelRepo, fm, freePort, startPanel, stop, request, post, tokenOf, cliCopy } from './support/panel.mjs';

// ---------- 0177: the panel keeps answering while it reads the board ----------

// A copy of the CLI whose board reader, before each reading, adds a line to a file and then waits `ms` milliseconds, so
// a test can count the readings and make one slow. Only the reading /api/state shares is slowed.
function slowCli(extra = '') {
  const { cli } = cliCopy();
  const file = path.join(path.dirname(cli), 'panel.mjs');
  const src = fs.readFileSync(file, 'utf8');
  const at = 'const board = m.statusData(';
  assert.ok(src.includes(at), 'the panel reads the board in its board reader');
  const hook = "(await import('node:fs')).appendFileSync(process.env.SPECK_TEST_READS, 'read\\\\n'); "
    + 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(process.env.SPECK_TEST_READ_MS)); ';
  fs.writeFileSync(file, src.replace(at, hook + extra + at));
  return cli;
}

// A panel repo with a draft 0002, served by the slowed CLI, each reading taking `ms`.
async function slowPanel(ms, extra) {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: 3 }));
  r.g('add', '-A'); r.g('commit', '-qm', 'two');
  const reads = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-reads-')), 'reads.txt');
  fs.writeFileSync(reads, '');
  const p = await startPanel(r.dir, ['--port', String(await freePort())], slowCli(extra), { SPECK_TEST_READS: reads, SPECK_TEST_READ_MS: String(ms) });
  const token = tokenOf((await request(p.port)).body);
  const readings = () => fs.readFileSync(reads, 'utf8').split('\n').filter(Boolean).length;
  return { r, p, port: p.port, token, readings };
}
const state = port => request(port, { pathName: '/api/state' });
const wait = ms => new Promise(r => setTimeout(r, ms));
// How long a request takes to be answered, in ms, with its answer.
const timed = async f => { const t = Date.now(); const out = await f(); return { ms: Date.now() - t, out }; };

// A /api/state request whose connection the test closes before it's answered.
function abandoned(port) {
  const req = http.request({ host: '127.0.0.1', port, path: '/api/state', headers: { Host: `127.0.0.1:${port}` } });
  req.on('error', () => {});
  req.end();
  return () => req.destroy();
}

test('0177 AC1: ten /api/state requests sent at once cause one reading of the board', async () => {
  const s = await slowPanel(1000);
  try {
    const answers = await Promise.all(Array.from({ length: 10 }, () => state(s.port)));
    for (const a of answers) assert.equal(a.status, 200, a.body);
    assert.ok(answers.every(a => a.body === answers[0].body), 'all ten get the same answer');
    assert.ok(JSON.parse(answers[0].body).tickets.some(t => t.id === '0002'), 'the answer is the board');
    assert.equal(s.readings(), 1);
  } finally { await stop(s.p); }
});

test('0177 AC2: a request whose connection closed before its reading started causes no reading', async () => {
  const s = await slowPanel(1500);
  try {
    const first = state(s.port);
    await wait(300);
    // A write while the board is being read: a request after it waits for a new reading rather than sharing this one.
    assert.equal((await post(s.port, '/api/tickets/2/priority/4', { token: s.token })).status, 200);
    const close = abandoned(s.port);
    await wait(200);
    close();
    assert.equal((await first).status, 200);
    await wait(2500);
    assert.equal(s.readings(), 1, 'the closed request started no reading of its own');
    // The same, with the connection kept open: it gets a reading of its own.
    const again = state(s.port);
    await wait(300);
    assert.equal((await post(s.port, '/api/tickets/2/priority/5', { token: s.token })).status, 200);
    const kept = state(s.port);
    assert.equal((await again).status, 200);
    assert.equal((await kept).status, 200);
    assert.equal(s.readings(), 3);
  } finally { await stop(s.p); }
});

test('0177 AC3: while one reading takes 5 seconds, the page, its icons, a build log and every write answer within 1 second', async () => {
  const s = await slowPanel(5000);
  try {
    const slow = state(s.port);
    await wait(300);
    const asks = [
      ['the page', () => request(s.port)],
      ['an icon', () => request(s.port, { pathName: '/icon.svg' })],
      ['a build log', () => request(s.port, { pathName: '/api/tickets/1/log' })],
      ['Set ready', () => post(s.port, '/api/tickets/2/ready', { token: s.token })],
      ['Back to Plan', () => post(s.port, '/api/tickets/2/draft', { token: s.token })],
      ['priority', () => post(s.port, '/api/tickets/2/priority/4', { token: s.token })],
      ['Stop build', () => post(s.port, '/api/tickets/1/stop', { token: s.token })],
      ['Ship', () => post(s.port, '/api/tickets/9999/ship', { token: s.token })],
      ['the speck run switch', () => post(s.port, '/api/run/off', { token: s.token })],
    ];
    for (const [name, ask] of asks) {
      const { ms, out } = await timed(ask);
      assert.ok(out.status < 500, `${name} answered ${out.status}: ${out.body}`);
      assert.ok(ms < 1000, `${name} answered in ${ms} ms`);
    }
    assert.equal((await slow).status, 200);
  } finally { await stop(s.p); }
});

test('0177 AC4: after a write, the next /api/state answer shows its result', async () => {
  const s = await slowPanel(1500);
  try {
    const before = state(s.port);
    await wait(300);
    const w = await post(s.port, '/api/tickets/2/priority/5', { token: s.token });
    assert.equal(w.status, 200, w.body);
    const after = await state(s.port);
    assert.equal(after.status, 200);
    assert.equal(JSON.parse(after.body).tickets.find(t => t.id === '0002').priority, 5, 'the answer after the write shows it');
    assert.equal((await before).status, 200);
    assert.equal(s.readings(), 2);
  } finally { await stop(s.p); }
});

test('0177 self-check: a board reader that stops answers with a plain error, and the next reading starts a new one', async () => {
  // The first reading stops its reader, as a crash would.
  const s = await slowPanel(0, "{ const fs = await import('node:fs'), once = process.env.SPECK_TEST_READS + '.stopped'; "
    + "if (!fs.existsSync(once)) { fs.writeFileSync(once, ''); process.exit(3); } } ");
  try {
    const first = await state(s.port);
    assert.equal(first.status, 500);
    assert.equal(JSON.parse(first.body).error, 'The board reader stopped with exit code 3.');
    const next = await state(s.port);
    assert.equal(next.status, 200, next.body);
    assert.ok(Array.isArray(JSON.parse(next.body).tickets));
  } finally { await stop(s.p); }
});
