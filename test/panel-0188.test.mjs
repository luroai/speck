import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0188: after the whole board a page gets when it connects, each update to it carries only what changed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { panelRepo, startPanel, stop, freePort, fakePage, T, full, idea, CLI, env } from './support/panel.mjs';
import { openStream, manualSources } from './support/stream.mjs';
import { boardSnapshot, boardDelta, boardVersions } from '../scripts/board-feed.mjs';
import { statusData } from '../scripts/speck.mjs';

// A board of `n` tickets the size of real ones, with a few ideas and speck run on.
const bigText = (id, n) => `Words about ticket ${id}. `.repeat(n);
const board = n => ({
  tickets: Array.from({ length: n }, (_, i) => full(String(i + 1).padStart(4, '0'), { notes: bigText(i, 200) })),
  ideas: [idea('one', 'inbox'), idea('two', 'shaped')],
  resume_command: 'claude --resume {session}',
  run: { on: true, pid: 1, since: '2026-10-14T10:00:00.000Z' },
});
const changeOne = b => ({ ...b, tickets: b.tickets.map((t, i) => (i === 7 ? { ...t, status: 'ready', title: 'Changed' } : t)) });
const deltaOf = (a, b) => { const from = boardSnapshot(a); return boardDelta(from, boardSnapshot(b, from), 'e:1', 'e:2'); };

// The /api/state answer a page gets, with its X-Speck-Board header.
function state(port, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/api/state', headers: { Host: `127.0.0.1:${port}`, ...headers } }, r => {
      let body = ''; r.setEncoding('utf8'); r.on('data', d => { body += d; });
      r.on('end', () => resolve({ status: r.statusCode, version: r.headers['x-speck-board'], text: body, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}

// ---------- AC1: an update carries only what changed, whatever the board's size ----------

test('0188 AC1: an update for one changed ticket is the same size with 150 and with 300 other tickets', () => {
  const small = deltaOf(board(151), changeOne(board(151))), large = deltaOf(board(301), changeOne(board(301)));
  assert.ok(Math.abs(small.length - large.length) < 1024, `${small.length} and ${large.length} bytes`);
  assert.ok(large.length < JSON.stringify(board(301)).length / 100, 'a small part of the whole board');
  const d = JSON.parse(large).delta;
  assert.deepEqual(d.lists.tickets.put.map(t => t.id), ['0008'], 'only the changed ticket');
  assert.deepEqual(d.lists.tickets.drop, []);
  assert.deepEqual(d.set, {}, 'nothing else');
  assert.equal(d.lists.ideas, undefined, 'no ideas, as none changed');
});

test('0188 AC1: an update carries the ideas and speck run state that changed, and what went', () => {
  const a = board(3);
  const b = { ...a, ideas: [a.ideas[0], idea('three', 'inbox')], run: { ...a.run, since: '2026-10-14T11:00:00.000Z' }, restart_error: 'boom' };
  const d = JSON.parse(deltaOf(a, b)).delta;
  assert.deepEqual(d.lists.ideas.put.map(i => i.path), ['speck/ideas/three.md']);
  assert.deepEqual(d.lists.ideas.drop, ['speck/ideas/two.md']);
  assert.deepEqual(Object.keys(d.set).sort(), ['restart_error', 'run']);
  assert.equal(d.lists.tickets, undefined);
  const { run, ...off } = a;
  const gone = JSON.parse(deltaOf(a, off)).delta;
  assert.ok(!gone.keys.includes('run'), 'speck run turning off leaves run out');
  assert.deepEqual(gone.set, {});
});

test('0188 AC1: the panel answers a page that says which board it has with only what changed since', async () => {
  const r = panelRepo();
  r.write('0002-two.md', 'id: "0002"\ntitle: Two\nstatus: draft\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex');
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const s = openStream(p.port);
  try {
    const first = await s.until(e => e.event === 'message', 5000);
    const whole = await state(p.port, { 'X-Speck-Board': first.data });
    assert.ok(Array.isArray(whole.body.tickets), 'the whole board first');
    assert.match(whole.version, /^[0-9a-f]{16}:\d+$/);
    fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^priority: .*$/m, 'priority: 1'));
    const next = await s.until(e => e.event === 'message' && e.data !== first.data, 5000);
    const upd = await state(p.port, { 'X-Speck-Board': next.data, 'X-Speck-Have': whole.version });
    assert.equal(upd.body.delta.from, whole.version);
    assert.equal(upd.body.delta.to, upd.version);
    assert.deepEqual(upd.body.delta.lists.tickets.put.map(t => [t.id, t.priority]), [['0001', 1]]);
    assert.deepEqual(upd.body.delta.set, {}, 'nothing else');
    // AC3: a board this panel didn't number, or none, gets the whole board.
    for (const have of [`${'0'.repeat(16)}:1`, 'nonsense', '']) {
      const again = await state(p.port, { 'X-Speck-Board': next.data, 'X-Speck-Have': have });
      assert.ok(Array.isArray(again.body.tickets), `whole for ${JSON.stringify(have)}`);
      assert.equal(again.body.tickets.find(t => t.id === '0001').priority, 1);
    }
  } finally { s.close(); await stop(p); }
});

// ---------- AC2: after any updates, the page shows what a fresh load would ----------

// What the page shows: each part of it the board fills, as text and classes.
const shown = p => ['shaping', 'queue', 'queue-n', 'shipped', 'shipped-n', 'shipped-stats', 'shipped-more', 'run', 'offline', 'restart']
  .map(id => p.all(p.byId(id)).map(n => `${n.tagName}.${n.className || ''}${n.hidden ? '!' : ''}:${n._text ?? n.textContent ?? ''}`).join('|'));
const whole = (b, version) => Promise.resolve({ ok: true, status: 200, headers: { get: k => (k === 'X-Speck-Board' ? version : null) }, json: async () => b });

// A seeded sequence of boards: tickets changing, coming, going and moving, ideas changing, speck run turning on and off.
function boards(seed, steps) {
  let x = seed;
  const rand = n => { x = (x * 1103515245 + 12345) % 2147483648; return x % n; };
  const statuses = ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved', 'done'];
  let b = { tickets: Array.from({ length: 6 }, (_, i) => T(String(i + 1).padStart(4, '0'), statuses[i % 7])), ideas: [idea('a', 'inbox')], resume_command: 'r {session}' };
  const out = [b];
  for (let i = 0; i < steps; i++) {
    const tickets = [...b.tickets], ideas = [...b.ideas];
    const next = { ...b };
    switch (rand(7)) {
      case 0: if (tickets.length) { const j = rand(tickets.length); tickets[j] = { ...tickets[j], status: statuses[rand(7)] }; } break;
      case 1: tickets.push(T(String(100 + i).padStart(4, '0'), statuses[rand(7)], { title: `New ${i}` })); break;
      case 2: if (tickets.length > 1) tickets.splice(rand(tickets.length), 1); break;
      case 3: tickets.reverse(); break;
      case 4: if (rand(2)) ideas.push(idea(`i${i}`, 'inbox')); else ideas.splice(0, 1); break;
      case 5: if (next.run) delete next.run; else next.run = { on: true, pid: 1, since: '2026-10-14T10:00:00.000Z' }; break;
      case 6: if (tickets.length) { const j = rand(tickets.length); tickets[j] = { ...tickets[j], title: `Title ${i}`, priority: rand(5) + 1 }; } break;
    }
    b = { ...next, tickets, ideas };
    out.push(b);
  }
  return out;
}

test('0188 AC2: after any sequence of updates, the page shows what it would show loading the board afresh', async () => {
  for (const seed of [1, 42]) {
    const seq = boards(seed, 20), snaps = [];
    for (const b of seq) snaps.push(boardSnapshot(b, snaps.at(-1) || null));
    const { EventSource, sources } = manualSources();
    const p = fakePage([whole(seq[0], 'e:0'), ...seq.slice(1).map((_, i) => JSON.parse(boardDelta(snaps[i], snaps[i + 1], `e:${i}`, `e:${i + 1}`)))], { EventSource });
    sources[0].emit('open');
    for (let i = 0; i < seq.length; i++) {
      sources[0].emit('message', String(i + 1));
      await p.settle();
      if (i > 0) assert.equal(p.calls.at(-1).opts.headers['X-Speck-Have'], `e:${i - 1}`, 'says which board it has');
      // A fresh page, loading the board as it is now.
      const own = manualSources(), f = fakePage([seq[i]], { EventSource: own.EventSource });
      own.sources[0].emit('open');
      own.sources[0].emit('message', '1');
      await f.settle();
      assert.deepEqual(shown(p), shown(f), `seed ${seed}, step ${i}`);
    }
  }
});

// ---------- AC3: a page that may have missed updates gets the whole board ----------

test('0188 AC3: after its stream reconnects, or an update it can\'t apply, the page asks for the whole board', async () => {
  const a = board(3), b = changeOne(a), sa = boardSnapshot(a), sb = boardSnapshot(b, sa);
  const { EventSource, sources } = manualSources();
  const p = fakePage([whole(a, 'e:1'), JSON.parse(boardDelta(sb, sa, 'e:9', 'e:10')), whole(b, 'e:2'), whole(b, 'e:2')], { EventSource });
  sources[0].emit('open');
  sources[0].emit('message', '1');
  await p.settle();
  sources[0].emit('message', '2');
  await p.settle();
  const asks = p.calls.filter(c => c.url === '/api/state');
  assert.equal(asks[1].opts.headers['X-Speck-Have'], 'e:1');
  assert.equal(asks[2].opts.headers['X-Speck-Have'], undefined, 'an update from a board it doesn\'t have: asks again for the whole one');
  assert.equal(asks.length, 3);
  sources[0].emit('open'); // the browser reconnected the stream
  sources[0].emit('message', '3');
  await p.settle();
  assert.equal(p.calls.at(-1).opts.headers['X-Speck-Have'], undefined, 'after reconnecting: the whole board');
  assert.equal(p.byId('offline').hidden, true);
});

test('0188 AC3: a malformed update, or one from a board the panel no longer keeps, gets the whole board', async () => {
  const a = board(2), b = changeOne(a);
  const { EventSource, sources } = manualSources();
  const p = fakePage([whole(a, 'e:1'), { delta: { from: 'e:1', to: 'e:2', keys: ['tickets'] } }, whole(b, 'e:2')], { EventSource });
  sources[0].emit('open');
  sources[0].emit('message', '1');
  await p.settle();
  sources[0].emit('message', '2');
  await p.settle();
  assert.equal(p.calls.at(-1).opts.headers['X-Speck-Have'], undefined, 'asked again for the whole board');
  assert.equal(p.byId('offline').hidden, true);
  const v = boardVersions();
  const first = v.snapshot(a);
  v.keep(1, first);
  const name = v.answer(first, 1, null).name;
  assert.ok(Array.isArray(JSON.parse(v.answer(first, 1, null).body).tickets), 'no board said: the whole board');
  assert.ok(JSON.parse(v.answer(first, 1, name).body).delta, 'a kept board: only what changed');
  for (let i = 2; i <= 17; i++) v.keep(i, v.snapshot(i % 2 ? a : b));
  assert.ok(Array.isArray(JSON.parse(v.answer(first, 17, name).body).tickets), 'one no longer kept: the whole board');
});

// ---------- AC4: speck status --json is unchanged ----------

test('0188 AC4: speck status --json prints the board as before, and the panel\'s whole board is the same text', () => {
  const r = panelRepo();
  r.write('0002-two.md', 'id: "0002"\ntitle: Two\nstatus: draft\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex');
  const out = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env });
  assert.equal(out.status, 0, out.stderr);
  const data = statusData(r.dir);
  assert.equal(out.stdout, `${JSON.stringify(data, null, 2)}\n`);
  assert.equal(boardSnapshot(data).body, JSON.stringify(data));
  const odd = { tickets: [{ id: '1' }, { id: '1' }], ideas: [{ path: '__proto__' }, 3], x: undefined, y: null };
  assert.equal(boardSnapshot(odd).body, JSON.stringify(odd), 'a list it can\'t key is kept whole');
});
