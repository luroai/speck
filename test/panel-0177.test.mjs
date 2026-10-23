import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { panelRepo, fm, stop, request, post } from './support/panel.mjs';
import { slowServe, slowPanel } from './support/slow-panel.mjs';
import { shipRepo, runIn } from './support/ship.mjs';
import { waitedForReading } from './support/timing.mjs';
import { runRepo, alive, killAll } from './support/run.mjs';
import { hasStopped } from './support/stopped.mjs';

// ---------- 0177: the panel keeps answering while it reads the board ----------

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

// Each AC3 test waits about 5 seconds for its slow reading, on a panel of its own, so they run at the same time (0198).
// The reading after its write, which nothing is asked during, isn't slowed (0429: it took another 5 seconds until then). Each compares an answer given while a reading runs with the same ask on the same panel
// with nothing reading, timed in the same test, rather than with 1 second, so a busy machine slows both alike (0207).
// An answer that waits for the reading takes the rest of the reading longer (waitedForReading): the length of one
// reading, as the panel measured it, since a request that a write made out of date waits for a second one too.
const notWaited = (name, ms, base, reading) =>
  assert.ok(!waitedForReading({ ms, base, reading }), `${name} answered in ${ms} ms while a reading took ${reading} ms, against ${base} ms with nothing reading`);
// A stand-in build for ticket `id` of `r`, launched as speck run does, leading its own process group, with its run record.
function standIn(r, id) {
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  fs.mkdirSync(path.join(r.dir, 'speck', '.cache', 'runs'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', '.cache', 'runs', `${id}.json`), JSON.stringify({ session: `s-0177-${id}`, pid: build.pid, cwd: r.dir }));
  return build.pid;
}

describe('0177 AC3: answers within 1 second while a reading takes 5 seconds', { concurrency: true }, () => {
  test('0177 AC3: while one reading takes 5 seconds, the page, its icons, a build log, Set ready, Back to Plan and priority answer within 1 second', async () => {
    const s = await slowPanel(5000, undefined, 1);
    try {
      const asks = priority => [
        ['the page', () => request(s.port), 200],
        ['an icon', () => request(s.port, { pathName: '/icon.svg' }), 200],
        ['a build log', () => request(s.port, { pathName: '/api/tickets/1/log' }), 200],
        ['priority', () => post(s.port, `/api/tickets/2/priority/${priority}`, { token: s.token }), 200],
        ['Set ready', () => post(s.port, '/api/tickets/2/ready', { token: s.token }), 200],
        ['Back to Plan', () => post(s.port, '/api/tickets/2/draft', { token: s.token }), 200],
      ];
      // Each ask with nothing reading, then each again while a reading runs.
      const times = async list => {
        const ms = {};
        for (const [name, ask, status] of list) {
          const t = await timed(ask);
          assert.equal(t.out.status, status, `${name}: ${t.out.body}`);
          ms[name] = t.ms;
        }
        return ms;
      };
      const base = await times(asks(4));
      const slow = timed(() => state(s.port));
      await wait(300);
      const during = await times(asks(5));
      assert.match(fs.readFileSync(path.join(s.r.dir, 'speck', 'tickets', '0002-two.md'), 'utf8'), /^status: draft$/m, 'set ready, then back to Plan');
      const read = await slow;
      assert.equal(read.out.status, 200);
      assert.ok(read.ms >= 4500, `the reading took ${read.ms} ms`);
      for (const name of Object.keys(during)) notWaited(name, during[name], base[name], s.readingMs());
    } finally { await stop(s.p); }
  });

  test('0177 AC3: while one reading takes 5 seconds, Stop build stops a running build within 1 second', async () => {
    const r = panelRepo();
    fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
    r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', status: 'building' }));
    r.g('add', '-A'); r.g('commit', '-qm', 'building');
    const builds = [standIn(r, '0001'), standIn(r, '0002')];
    const s = await slowServe(r.dir, 5000, undefined, 1);
    try {
      const stopping = async id => {
        const t = await timed(() => post(s.port, `/api/tickets/${id}/stop`, { token: s.token }));
        assert.equal(t.out.status, 200, t.out.body);
        assert.match(JSON.parse(t.out.body).message, new RegExp(`000${id}[^\\n]*stopped`));
        return t.ms;
      };
      const base = await stopping(2);
      const slow = timed(() => state(s.port));
      await wait(300);
      const ms = await stopping(1);
      const read = await slow;
      assert.equal(read.out.status, 200);
      notWaited('Stop build', ms, base, s.readingMs());
    } finally { killAll(builds); await stop(s.p); }
  });

  test('0177 AC3: while one reading takes 5 seconds, the speck run switch turns it on and off within 1 second each', async () => {
    const r = runRepo({ tickets: [] });
    const s = await slowServe(r.dir, 5000, undefined, 1);
    const pids = [];
    try {
      // Turns speck run on and off, with how long each answer took.
      const onOff = async () => {
        const on = await timed(() => post(s.port, '/api/run/on', { token: s.token }));
        assert.equal(on.out.status, 200, on.out.body);
        const pid = JSON.parse(on.out.body).run.pid;
        pids.push(pid);
        const off = await timed(() => post(s.port, '/api/run/off', { token: s.token }));
        assert.equal(off.out.status, 200, off.out.body);
        assert.ok(await hasStopped(() => !alive(pid)), 'speck run has stopped');
        return { on: on.ms, off: off.ms };
      };
      const base = await onOff();
      const slow = timed(() => state(s.port));
      await wait(300);
      const during = await onOff();
      const read = await slow;
      assert.equal(read.out.status, 200);
      notWaited('on', during.on, base.on, s.readingMs());
      notWaited('off', during.off, base.off, s.readingMs());
    } finally { killAll(pids); await stop(s.p); }
  });

  test('0177 AC3: while one reading takes 5 seconds, Ship ships an approved ticket, answering within 1 second', async () => {
    // The same ship with nothing reading: another approved ticket shipped by the speck ship the Ship button runs.
    const other = shipRepo();
    const base = await timed(async () => runIn(other.dir, 'ship', '1'));
    assert.equal(base.out.status, 0, base.out.stderr);
    const r = shipRepo();
    const s = await slowServe(r.dir, 5000, undefined, 1);
    try {
      const slow = timed(() => state(s.port));
      await wait(300);
      const { ms, out } = await timed(() => post(s.port, '/api/tickets/1/ship', { token: s.token }));
      assert.equal(out.status, 200, out.body);
      assert.match(JSON.parse(out.body).message, /Shipped 0001/);
      assert.equal(r.statusIn(r.dir), 'done');
      const read = await slow;
      assert.equal(read.out.status, 200);
      notWaited('Ship', ms, base.ms, s.readingMs());
    } finally { await stop(s.p); }
  });
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
