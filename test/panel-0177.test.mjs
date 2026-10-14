import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { panelRepo, fm, freePort, startPanel, stop, request, post, tokenOf, cliCopy } from './support/panel.mjs';
import { shipRepo } from './support/ship.mjs';
import { runRepo, alive, killAll } from './support/run.mjs';

// ---------- 0177: the panel keeps answering while it reads the board ----------

// A copy of the CLI in which, whenever the panel's server process does them, on any thread: each board reading
// (statusData) adds a line to a file, so a test can count them, and each scan of every ticket file (listTickets, which
// a board reading does once) waits SPECK_TEST_READ_MS first, so it's slow. `extra` is more code to run in each
// reading. Other commands (speck ship, speck run) run at their usual speed.
function slowCli(extra = '') {
  const { cli } = cliCopy();
  const panelOnly = "process.execArgv.includes('--input-type=module') && process.env.SPECK_TEST_READS";
  const patch = (file, at, code) => {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(src.includes(at), `${path.basename(file)} has ${at.trim()}`);
    fs.writeFileSync(file, src.replace(at, `${at}  if (${panelOnly}) { ${code} }\n`));
  };
  patch(cli, 'export function statusData(repo) {\n', `fs.appendFileSync(process.env.SPECK_TEST_READS, 'read\\n'); ${extra}`);
  patch(path.join(path.dirname(cli), 'core.mjs'), 'export function listTickets(repo) {\n',
    'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(process.env.SPECK_TEST_READ_MS));');
  return cli;
}

// The slowed panel serving `dir`, each reading taking `ms`.
async function slowServe(dir, ms, extra) {
  const reads = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-reads-')), 'reads.txt');
  fs.writeFileSync(reads, '');
  const p = await startPanel(dir, ['--port', String(await freePort())], slowCli(extra), { SPECK_TEST_READS: reads, SPECK_TEST_READ_MS: String(ms) });
  const token = tokenOf((await request(p.port)).body);
  const readings = () => fs.readFileSync(reads, 'utf8').split('\n').filter(Boolean).length;
  return { p, port: p.port, token, readings };
}
// A panel repo with a draft 0002 as well, committed, served slowed.
async function slowPanel(ms, extra) {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: 3 }));
  r.g('add', '-A'); r.g('commit', '-qm', 'two');
  return { r, ...(await slowServe(r.dir, ms, extra)) };
}
const state = port => request(port, { pathName: '/api/state' });
const wait = ms => new Promise(r => setTimeout(r, ms));
// How long a request takes to be answered, in ms, with its answer.
const timed = async f => { const t = Date.now(); const out = await f(); return { ms: Date.now() - t, out }; };
const priorityOf = (answer, id) => JSON.parse(answer.body).tickets.find(t => t.id === id).priority;

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
    // One request starts a reading, then a write makes it out of date, then a second request comes in. Both would wait
    // for a reading after the write, but both connections close before that reading starts.
    const closeFirst = abandoned(s.port);
    await wait(300);
    assert.equal((await post(s.port, '/api/tickets/2/priority/4', { token: s.token })).status, 200);
    const closeSecond = abandoned(s.port);
    await wait(200);
    closeFirst();
    closeSecond();
    await wait(2500);
    assert.equal(s.readings(), 1, 'no reading after the write');
    // The same with both connections kept open: they get the reading after the write.
    const first = state(s.port);
    await wait(300);
    assert.equal((await post(s.port, '/api/tickets/2/priority/5', { token: s.token })).status, 200);
    const second = state(s.port);
    assert.equal(priorityOf(await first, '0002'), 5);
    assert.equal(priorityOf(await second, '0002'), 5);
    assert.equal(s.readings(), 3);
  } finally { await stop(s.p); }
});

test('0177 AC3: while one reading takes 5 seconds, the page, its icons, a build log, Set ready, Back to Plan and priority answer within 1 second', async () => {
  const s = await slowPanel(5000);
  try {
    const slow = timed(() => state(s.port));
    await wait(300);
    const asks = [
      ['the page', () => request(s.port), 200],
      ['an icon', () => request(s.port, { pathName: '/icon.svg' }), 200],
      ['a build log', () => request(s.port, { pathName: '/api/tickets/1/log' }), 200],
      ['priority', () => post(s.port, '/api/tickets/2/priority/4', { token: s.token }), 200],
      ['Set ready', () => post(s.port, '/api/tickets/2/ready', { token: s.token }), 200],
      ['Back to Plan', () => post(s.port, '/api/tickets/2/draft', { token: s.token }), 200],
    ];
    for (const [name, ask, status] of asks) {
      const { ms, out } = await timed(ask);
      assert.equal(out.status, status, `${name}: ${out.body}`);
      assert.ok(ms < 1000, `${name} answered in ${ms} ms`);
    }
    assert.match(fs.readFileSync(path.join(s.r.dir, 'speck', 'tickets', '0002-two.md'), 'utf8'), /^status: draft$/m, 'set ready, then back to Plan');
    const read = await slow;
    assert.equal(read.out.status, 200);
    assert.ok(read.ms >= 4500, `the reading took ${read.ms} ms`);
  } finally { await stop(s.p); }
});

test('0177 AC3: while one reading takes 5 seconds, Stop build stops a running build within 1 second', async () => {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
  r.g('add', '-A'); r.g('commit', '-qm', 'building');
  // A stand-in build launched as speck run does, leading its own process group, with its run record.
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  fs.mkdirSync(path.join(r.dir, 'speck', '.cache', 'runs'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.json'), JSON.stringify({ session: 's-0177', pid: build.pid, cwd: r.dir }));
  const s = await slowServe(r.dir, 5000);
  try {
    const slow = state(s.port);
    await wait(300);
    const { ms, out } = await timed(() => post(s.port, '/api/tickets/1/stop', { token: s.token }));
    assert.equal(out.status, 200, out.body);
    assert.match(JSON.parse(out.body).message, /0001[^\n]*stopped/);
    assert.ok(ms < 1000, `Stop build answered in ${ms} ms`);
    assert.equal((await slow).status, 200);
  } finally { killAll([build.pid]); await stop(s.p); }
});

test('0177 AC3: while one reading takes 5 seconds, the speck run switch turns it on and off within 1 second each', async () => {
  const r = runRepo({ tickets: [] });
  const s = await slowServe(r.dir, 5000);
  let pid = null;
  try {
    const slow = state(s.port);
    await wait(300);
    const on = await timed(() => post(s.port, '/api/run/on', { token: s.token }));
    assert.equal(on.out.status, 200, on.out.body);
    pid = JSON.parse(on.out.body).run.pid;
    assert.ok(on.ms < 1000, `on answered in ${on.ms} ms`);
    const off = await timed(() => post(s.port, '/api/run/off', { token: s.token }));
    assert.equal(off.out.status, 200, off.out.body);
    assert.ok(off.ms < 1000, `off answered in ${off.ms} ms`);
    assert.ok(!alive(pid), 'speck run has stopped');
    assert.equal((await slow).status, 200);
  } finally { if (pid) killAll([pid]); await stop(s.p); }
});

test('0177 AC3: while one reading takes 5 seconds, Ship ships an approved ticket, answering within 1 second', async () => {
  const r = shipRepo();
  const s = await slowServe(r.dir, 5000);
  try {
    const slow = state(s.port);
    await wait(300);
    const { ms, out } = await timed(() => post(s.port, '/api/tickets/1/ship', { token: s.token }));
    assert.equal(out.status, 200, out.body);
    assert.match(JSON.parse(out.body).message, /Shipped 0001/);
    assert.equal(r.statusIn(r.dir), 'done');
    assert.ok(ms < 1000, `Ship answered in ${ms} ms`);
    assert.equal((await slow).status, 200);
  } finally { await stop(s.p); }
});

test('0177 AC4: after a write, every /api/state answer shows its result, even one asked for before the write', async () => {
  const s = await slowPanel(1500);
  try {
    const before = state(s.port);
    await wait(300);
    const w = await post(s.port, '/api/tickets/2/priority/5', { token: s.token });
    assert.equal(w.status, 200, w.body);
    const after = state(s.port);
    // The request sent before the write is answered after it, so it shows the write too.
    assert.equal(priorityOf(await before, '0002'), 5, 'the answer sent after the write shows it');
    assert.equal(priorityOf(await after, '0002'), 5, 'the next answer shows it');
    assert.equal(s.readings(), 2);
  } finally { await stop(s.p); }
});

test('0177 self-check: a board reader that stops answers with a plain error, and the next reading starts a new one', async () => {
  // The first reading stops its reader, as a crash would.
  const s = await slowPanel(0, "if (!fs.existsSync(process.env.SPECK_TEST_READS + '.stopped')) { fs.writeFileSync(process.env.SPECK_TEST_READS + '.stopped', ''); process.exit(3); } ");
  try {
    const first = await state(s.port);
    assert.equal(first.status, 500);
    assert.equal(JSON.parse(first.body).error, 'The board reader stopped with exit code 3.');
    const next = await state(s.port);
    assert.equal(next.status, 200, next.body);
    assert.ok(Array.isArray(JSON.parse(next.body).tickets));
  } finally { await stop(s.p); }
});
