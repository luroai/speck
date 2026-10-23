import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0187: the panel pushes board changes to every open page over one event stream, instead of each page asking for the
// board every 2 seconds.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { panelRepo, startPanel, stop, freePort, request, page, fakePage, T, findChrome, browserPage, cliCopy } from './support/panel.mjs';
import { openStream, stateFor, countingGit, manualSources, wait } from './support/stream.mjs';
import { boardWatcher } from '../scripts/board-feed.mjs';

const FEED = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'scripts', 'board-feed.mjs');
const runs = (r, f) => path.join(r.dir, 'speck', '.cache', 'runs', f);
const served = async (r = panelRepo(), extraEnv = {}, cli) => ({ r, p: await startPanel(r.dir, ['--port', String(await freePort())], cli, extraEnv) });
const boards = s => s.events.filter(e => e.event === 'message');
// The board the page gets for the stream's latest announcement.
const latest = async (p, s) => (await stateFor(p.port, boards(s).at(-1).data)).body;
// Resolves with the board once a change after event `from` makes `pred` true, within `ms` of now.
async function changed(p, s, pred, ms = 1000, what = 'the change') {
  const t0 = Date.now();
  for (let from = boards(s).length; ;) {
    const left = ms - (Date.now() - t0);
    const e = await s.until(e => e.event === 'message', Math.max(left, 1), s.events.indexOf(boards(s)[from - 1]) + 1, what);
    from = boards(s).length;
    const board = (await stateFor(p.port, e.data)).body;
    if (pred(board)) return { board, ms: Date.now() - t0 };
  }
}
const ticket = (board, id) => board.tickets.find(t => t.id === id);
const setField = (file, re, to) => fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(re, to));

// ---------- AC1: a change shows within a second, without the page asking ----------

test('0187 AC1: a ticket\'s status, fields and text, and an idea, reach an open stream within 1 second', async () => {
  const { r, p } = await served();
  const s = openStream(p.port);
  try {
    await s.until(e => e.event === 'message', 5000);
    assert.equal(ticket(await latest(p, s), '0001').status, 'ready');
    setField(r.file, /^status: ready/m, 'status: blocked');
    await changed(p, s, b => ticket(b, '0001').status === 'blocked', 1000, 'the new status');
    setField(r.file, /^priority: .*$/m, 'priority: 1');
    await changed(p, s, b => ticket(b, '0001').priority === 1, 1000, 'the new priority');
    setField(r.file, /Users cannot export\./, 'Users still cannot export.');
    await changed(p, s, b => /still cannot/.test(ticket(b, '0001').problem), 1000, 'the new text');
    r.write('0002-two.md', 'id: "0002"\ntitle: Two\nstatus: draft\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex');
    await changed(p, s, b => !!ticket(b, '0002'), 1000, 'a new ticket');
    fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', '2026-10-14-an-idea.md'), '# An idea 0187\n\nStatus: raw\n');
    await changed(p, s, b => b.ideas.some(i => i.title === 'An idea 0187'), 1000, 'the idea');
  } finally { s.close(); await stop(p); }
});

test('0187 AC1: a build pausing, a ship and speck run turning on and off reach an open stream within 1 second', async () => {
  const { r, p } = await served();
  const s = openStream(p.port);
  const alive = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
  try {
    await s.until(e => e.event === 'message', 5000);
    fs.mkdirSync(runs(r, ''), { recursive: true });
    fs.writeFileSync(runs(r, 'run.lock'), String(alive.pid));
    await changed(p, s, b => b.run && b.run.on === true, 1000, 'speck run on');
    fs.rmSync(runs(r, 'run.lock'));
    await changed(p, s, b => !b.run, 1000, 'speck run off');
    const rec = { pid: alive.pid, session: 's-0187', cwd: r.dir, started: new Date().toISOString() };
    fs.writeFileSync(runs(r, '0001.json'), JSON.stringify(rec));
    await changed(p, s, b => ticket(b, '0001').session?.id === 's-0187', 1000, 'the build starting');
    fs.writeFileSync(runs(r, '0001.paused'), JSON.stringify({ pid: alive.pid, session: 's-0187' }));
    await changed(p, s, b => ticket(b, '0001').paused === true, 1000, 'the build paused');
    fs.writeFileSync(runs(r, '0001.json'), JSON.stringify({ ...rec, exited: new Date().toISOString(), exit_code: 3 }));
    await changed(p, s, b => ticket(b, '0001').build_exit?.code === 3, 1000, 'the build ending');
    assert.equal(ticket(await latest(p, s), '0001').ship, null);
    const started = new Date().toISOString();
    fs.writeFileSync(runs(r, '0001.ship.json'), JSON.stringify({ pid: alive.pid, started, auto: true }));
    await changed(p, s, b => ticket(b, '0001').ship?.started === started, 1000, 'the ship starting');
    fs.writeFileSync(runs(r, '0001.ship.json'), JSON.stringify({ pid: alive.pid, started, auto: true, ended: new Date().toISOString(), message: 'Shipped 0187.' }));
    await changed(p, s, b => ticket(b, '0001').ship?.message === 'Shipped 0187.', 1000, 'the ship ending');
  } finally { alive.kill(); s.close(); await stop(p); }
});

test('0187 AC1: a ticket changed in a build\'s own worktree, made after the panel started, reaches an open stream within 1 second', async () => {
  const { r, p } = await served(panelRepo({ worktrees: 'true' }));
  const s = openStream(p.port);
  const wt = `${r.dir}-wt-0001`;
  try {
    await s.until(e => e.event === 'message', 5000);
    r.g('worktree', 'add', '-q', '-b', 'speck/0001-export-bookings', wt);
    await changed(p, s, b => ticket(b, '0001').worktree !== null, 1000, 'the worktree');
    await wait(300); // its folder is watched once it shows
    const file = path.join(wt, path.relative(r.dir, r.file));
    setField(file, /^status: ready/m, 'status: reviewing');
    await changed(p, s, b => ticket(b, '0001').status === 'reviewing', 1000, 'the status in the worktree');
  } finally { s.close(); await stop(p); fs.rmSync(wt, { recursive: true, force: true }); }
});

test('0187 AC1: a change no file records, speck run\'s process ending, shows within a few keep-alives, by default within 30 seconds', async () => {
  const { r, p } = await served(undefined, { SPECK_PANEL_PING_MS: '500' });
  const s = openStream(p.port);
  const alive = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
  try {
    await s.until(e => e.event === 'message', 5000);
    fs.mkdirSync(runs(r, ''), { recursive: true });
    fs.writeFileSync(runs(r, 'run.lock'), String(alive.pid));
    await changed(p, s, b => b.run && b.run.on === true, 1000, 'speck run on');
    alive.kill('SIGKILL');
    await changed(p, s, b => !b.run, 3000, 'speck run off, with its lock left behind'); // read again every third keep-alive
  } finally { alive.kill(); s.close(); await stop(p); }
  const src = fs.readFileSync(FEED, 'utf8');
  const every = Number((src.match(/PANEL_PING_MS = (\d+)/) || [])[1]) * Number((src.match(/BOARD_CHECK_PINGS = (\d+)/) || [])[1]);
  assert.ok(every > 0 && every <= 30000, `by default, read again every ${every} ms`);
});

test('0187 AC1: a change that leaves the board as it was sends nothing', async () => {
  const { r, p } = await served();
  const s = openStream(p.port);
  try {
    await s.until(e => e.event === 'message', 5000);
    await wait(500);
    const n = boards(s).length;
    fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8')); // the same content
    await wait(800);
    assert.equal(boards(s).length, n);
  } finally { s.close(); await stop(p); }
});

test('0187 AC1: in a real browser, a ticket\'s new title shows within 1 second, without a reload', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const { r, p } = await served();
  const b = await browserPage(`http://127.0.0.1:${p.port}/`);
  try {
    await b.loaded();
    await b.until(`document.body.textContent.includes('Export bookings')`, 'the ticket');
    await b.js('window.__kept = true');
    await wait(300);
    setField(r.file, /^title: .*$/m, 'title: "Renamed 0187"');
    const t0 = Date.now();
    while (!(await b.js(`document.body.textContent.includes('Renamed 0187')`))) {
      assert.ok(Date.now() - t0 < 1000, 'the new title within 1 second');
      await wait(20);
    }
    assert.equal(await b.js('window.__kept'), true, 'not reloaded');
  } finally { await b.close(); await stop(p); }
});

// ---------- AC2: no timer asks for the board; only a keep-alive while nothing changes ----------

test('0187 AC2: the page opens one stream, asks for the board only when told, and sets no timer that asks for it', async () => {
  const { EventSource, sources } = manualSources();
  const state = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([state, state, state, state], { EventSource });
  await p.settle();
  assert.equal(sources.length, 1);
  assert.equal(sources[0].url, '/api/events');
  const states = () => p.calls.filter(c => c.url === '/api/state').length;
  assert.equal(states(), 0, 'nothing asked before the stream says so');
  for (const f of p.timers.splice(0)) f();
  await p.settle();
  assert.equal(states(), 0, 'no timer asks for it');
  sources[0].emit('open');
  sources[0].emit('message', '1');
  await p.settle();
  assert.equal(states(), 1);
  assert.equal(p.calls.at(-1).opts.headers['X-Speck-Board'], '1', 'says which board it was told of');
  sources[0].emit('ping', '1');
  for (const f of p.timers.splice(0)) f();
  await p.settle();
  assert.equal(states(), 1, 'a keep-alive asks for nothing');
  let drawn = 0; // 0413: each redraw sets the frame of speck's screen, which stays between redraws
  Object.defineProperty(p.byId('bezel'), 'className', { get: () => 'bezel', set: () => { drawn++; } });
  sources[0].emit('ping', '1');
  assert.ok(drawn > 0, 'but redraws the page, so what it works out from the clock moves on');
  sources[0].emit('message', '2');
  await p.settle();
  assert.equal(states(), 2);
  assert.equal(sources.length, 1, 'still one stream');
  assert.doesNotMatch(page(), /POLL_MS|setTimeout\(poll/);
});

test('0187 AC2: while nothing changes, the stream carries only a keep-alive, and by default at least every 30 seconds', async () => {
  const { p } = await served(undefined, { SPECK_PANEL_PING_MS: '300' });
  const s = openStream(p.port);
  try {
    await s.opened;
    assert.match(s.res.headers['content-type'], /^text\/event-stream/);
    assert.match(s.res.headers['cache-control'], /no-store/);
    await s.until(e => e.event === 'message', 5000);
    await wait(500);
    const from = s.events.length;
    await wait(1200);
    const after = s.events.slice(from);
    assert.ok(after.filter(e => e.event === 'ping').length >= 2, `keep-alives: ${JSON.stringify(after)}`);
    assert.deepEqual(after.filter(e => e.event !== 'ping'), [], 'nothing else');
  } finally { s.close(); await stop(p); }
  const ms = Number((fs.readFileSync(FEED, 'utf8').match(/PANEL_PING_MS = (\d+)/) || [])[1]);
  assert.ok(ms > 0 && ms <= 30000, `the default keep-alive, ${ms} ms`);
});

// ---------- AC3: one reading per change, however many pages; a burst is one update ----------

test('0187 AC3: with four pages open, a change is read once, and each page gets that one board', async () => {
  const git = countingGit();
  const { r, p } = await served(undefined, git.env);
  const streams = [0, 1, 2, 3].map(() => openStream(p.port));
  try {
    for (const s of streams) await s.until(e => e.event === 'message', 5000);
    await Promise.all(streams.map(s => latest(p, s)));
    await wait(500);
    git.reset();
    await request(p.port, { pathName: '/api/state' }); // one plain reading, to count what one costs
    const one = git.count();
    assert.ok(one > 0);
    await wait(300);
    git.reset();
    const counts = streams.map(s => boards(s).length);
    setField(r.file, /^status: ready/m, 'status: blocked');
    const got = await Promise.all(streams.map((s, i) => s.until(e => e.event === 'message', 2000, s.events.indexOf(boards(s)[counts[i] - 1]) + 1)));
    const answers = await Promise.all(got.map(e => stateFor(p.port, e.data)));
    for (const a of answers) assert.equal(ticket(a.body, '0001').status, 'blocked');
    await wait(500);
    assert.equal(git.count(), one, 'one reading of the board for all four pages');
  } finally { for (const s of streams) s.close(); await stop(p); }
});

test('0187 AC3: ten tickets changed at once reach each page as one update', async () => {
  const { r, p } = await served();
  const streams = [0, 1].map(() => openStream(p.port));
  try {
    for (const s of streams) await s.until(e => e.event === 'message', 5000);
    await wait(500);
    const counts = streams.map(s => boards(s).length);
    for (let i = 2; i <= 11; i++) r.write(`${String(i).padStart(4, '0')}-t.md`, `id: "${String(i).padStart(4, '0')}"\ntitle: T${i}\nstatus: draft\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex`);
    await wait(1500);
    for (const [i, s] of streams.entries()) {
      assert.equal(boards(s).length, counts[i] + 1, `one update: ${JSON.stringify(s.events)}`);
      assert.equal((await latest(p, s)).tickets.length, 11);
    }
  } finally { for (const s of streams) s.close(); await stop(p); }
});

test('0187 AC3: a write the page made is in the board it gets next, not an older one', async () => {
  const { r, p } = await served();
  const s = openStream(p.port);
  try {
    await s.until(e => e.event === 'message', 5000);
    const version = boards(s).at(-1).data;
    r.write('0002-two.md', 'id: "0002"\ntitle: Two\nstatus: draft\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex');
    const html = (await request(p.port)).body;
    const token = (html.match(/data-token="([0-9a-f]+)"/) || [])[1];
    await new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port: p.port, method: 'POST', path: '/api/tickets/0002/priority/1', headers: { Host: `127.0.0.1:${p.port}`, Origin: `http://127.0.0.1:${p.port}`, 'X-Speck-Token': token } }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', reject); req.end();
    });
    const b = (await stateFor(p.port, version)).body; // asked for the board it was told of before the write
    assert.equal(ticket(b, '0002').priority, 1, 'the write shows');
  } finally { s.close(); await stop(p); }
});

// ---------- AC4: reconnecting by itself, and "Disconnected" only after 10 seconds ----------

test('0187 AC4: a dropped stream shows nothing at first, reconnects, and asks for the board at once', async () => {
  const { EventSource, sources } = manualSources();
  const timers = [], cleared = new Set();
  const state = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([state, state, state, state], { EventSource, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: id => cleared.add(id) });
  sources[0].emit('open'); sources[0].emit('message', '1');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  sources[0].fail(); // the network blips: the browser tries again by itself
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'not "Disconnected" at once');
  const lost = timers.findLastIndex(t => t.ms === 10000); // the stream's: the board's own wait came first (0186)
  assert.ok(lost >= 0, 'it waits 10 seconds');
  sources[0].emit('open'); sources[0].emit('message', '1'); // back
  await p.settle();
  assert.ok(cleared.has(lost + 1), 'the wait is called off');
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 2, 'the board, asked for again at once');
  assert.equal(p.byId('offline').hidden, true);
});

test('0187 AC4: a stream that stays gone for 10 seconds shows "Disconnected", and one the browser gave up on is started again', async () => {
  const { EventSource, sources } = manualSources();
  const timers = [];
  const state = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([state, state], { EventSource, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {} });
  sources[0].emit('open'); sources[0].emit('message', '1');
  await p.settle();
  sources[0].fail(true); // the browser won't try again by itself
  await p.settle();
  timers.findLast(t => t.ms === 10000).fn(); // the stream's: the board's own wait came first (0186)
  await p.settle();
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /^Disconnected: can't reach speck panel\./);
  const again = timers.filter(t => t.ms < 10000); // apart from the 10- and 15-second waits for the board (0186)
  assert.equal(again.length, 1, 'one try again');
  again[0].fn();
  assert.equal(sources.length, 2, 'a new stream');
  assert.equal(sources[0].readyState, 2);
  sources[1].emit('open'); sources[1].emit('message', '1');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'back');
});

test('0187 AC4: coming back to the page, as a phone does when it wakes, reconnects and asks for the board at once', async () => {
  const { EventSource, sources } = manualSources();
  const state = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([state, state], { EventSource, clearTimeout: () => {} });
  sources[0].emit('open'); sources[0].emit('message', '1');
  await p.settle();
  const shown = p.document.listeners.visibilitychange;
  assert.ok(shown, 'it listens for the page being shown again');
  p.document.visibilityState = 'hidden';
  shown({});
  assert.equal(sources.length, 1, 'hiding it does nothing');
  p.document.visibilityState = 'visible';
  shown({});
  assert.equal(sources.length, 2, 'a new stream');
  assert.equal(sources[0].readyState, 2, 'the old one closed');
  sources[1].emit('open'); sources[1].emit('message', '1');
  await p.settle();
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 2);
});

test('0187 AC4: when the panel restarts on new code, its open streams end so pages reconnect to the new one, which tells them of its board', async () => {
  const c = cliCopy();
  const { p } = await served(undefined, {}, c.cli);
  const s = openStream(p.port);
  try {
    await s.until(e => e.event === 'message', 5000);
    assert.ok(s.retry > 0 && s.retry <= 2000, `the browser tries again soon: retry ${s.retry}`);
    const code = path.join(path.dirname(c.cli), 'panel.mjs');
    fs.writeFileSync(code, `${fs.readFileSync(code, 'utf8')}\n// 0187 changed\n`);
    await Promise.race([s.ended, wait(8000).then(() => assert.fail('the stream didn\'t end on the restart'))]);
    // As a browser does: try again until a stream opens on the new server.
    for (let tries = 0; ; tries++) {
      const again = openStream(p.port);
      try {
        const e = await again.until(e => e.event === 'message', 2000);
        assert.equal((await stateFor(p.port, e.data)).status, 200);
        break;
      } catch (err) { if (tries >= 10) throw err; await wait(200); } finally { again.close(); }
    }
  } finally { s.close(); await stop(p); }
});

test('0187 AC4: in a real browser, the page rides out the panel stopping and starting again, without "Disconnected", and shows the board as it is', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  let p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const port = p.port;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.loaded();
    await b.until(`document.body.textContent.includes('Export bookings')`, 'the ticket');
    await b.js(`window.__offline = false; new MutationObserver(() => { if (!document.getElementById('offline').hidden) window.__offline = true; }).observe(document.getElementById('offline'), { attributes: true })`);
    await stop(p);
    setField(r.file, /^title: .*$/m, 'title: "While away 0187"');
    await wait(2500);
    p = await startPanel(r.dir, ['--port', String(p.port)]);
    assert.equal(p.port, port, 'back on the same port');
    const t0 = Date.now();
    while (!(await b.js(`document.body.textContent.includes('While away 0187')`))) {
      assert.ok(Date.now() - t0 < 2000, 'the board as it is now, soon after the panel is back');
      await wait(20);
    }
    assert.equal(await b.js('window.__offline'), false, '"Disconnected" never showed');
  } finally { await b.close(); await stop(p); }
});

// ---------- review round 1 ----------

test('0187 AC4: a page coming back after every page had gone gets the board as it is now, not the last one read', async () => {
  const { r, p } = await served();
  const s = openStream(p.port);
  try {
    await s.until(e => e.event === 'message', 5000);
    assert.equal(ticket(await latest(p, s), '0001').status, 'ready');
  } finally { s.close(); }
  try {
    await wait(300);
    setField(r.file, /^status: ready/m, 'status: blocked');
    await wait(500); // the change is seen with no page open
    const back = openStream(p.port);
    try {
      const e = await back.until(e => e.event === 'message', 2000);
      assert.equal(ticket((await stateFor(p.port, e.data)).body, '0001').status, 'blocked', 'the first board it gets');
    } finally { back.close(); }
  } finally { await stop(p); }
});

test('0187 AC4: a request for the board that fails is asked again at the next keep-alive, without waiting for a change', async () => {
  const { EventSource, sources } = manualSources();
  const timers = [];
  const state = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([new Error('blip'), state], { EventSource, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {} });
  sources[0].emit('open'); sources[0].emit('message', '7');
  await p.settle();
  assert.equal(p.byId('offline').textContent, '', 'one failure shows nothing (0186)');
  assert.deepEqual(timers.filter(t => t.ms < 10000), [], 'no timer of its own to ask again');
  sources[0].emit('ping', '1');
  await p.settle();
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 2, 'asked again');
  assert.equal(p.calls.at(-1).opts.headers['X-Speck-Board'], '7', 'for the same board');
  assert.equal(p.byId('offline').hidden, true, 'back, with nothing on the board changed');
  sources[0].emit('ping', '1');
  await p.settle();
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 2, 'and not again once it worked');
});

test('0187 AC4: a board the panel couldn\'t read isn\'t asked for again until the panel announces another', async () => {
  const { EventSource, sources } = manualSources();
  const timers = [];
  const p = fakePage([{ status: 500, body: { error: 'Ticket 0002 has no frontmatter.' } }], { EventSource, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {} });
  sources[0].emit('open'); sources[0].emit('message', '1');
  await p.settle();
  timers.find(t => t.ms === 10000).fn(); // 0186: it shows once 10 seconds pass without a board
  assert.match(p.byId('offline').textContent, /couldn't read the tickets: Ticket 0002 has no frontmatter\./);
  sources[0].emit('ping', '1');
  await p.settle();
  assert.equal(p.calls.filter(c => c.url === '/api/state').length, 1, 'not at a keep-alive');
  assert.deepEqual(timers.filter(t => t.ms < 10000), [], 'nor on a timer');
});

// ---------- merge review round (F4) ----------

// A build's worktree whose speck/tickets folder isn't there, and a watch on the files the board is read from that
// makes it, with a ticket in it, just as the watch on its speck/ folder starts: after the watcher checked for it, so
// that folder's watch can't see it appear.
function raceWatch(r, wt, made) {
  fs.rmSync(path.join(wt, 'speck', 'tickets'), { recursive: true, force: true });
  const real = fs.watch;
  fs.watch = (dir, opts, fn) => {
    if (dir === path.join(wt, 'speck') && opts && opts.recursive === false && !made.done) {
      made.done = true;
      fs.mkdirSync(path.join(wt, 'speck', 'tickets'));
      fs.writeFileSync(path.join(wt, 'speck', 'tickets', '0001-x.md'), 'status: ready\n');
    }
    return real(dir, opts, fn);
  };
  return () => { fs.watch = real; };
}

test('0187 AC1: a build worktree\'s tickets folder that appears while the watches start is watched, and a change in it seen at once', async () => {
  const r = panelRepo();
  const wt = `${r.dir}-wt-race`;
  r.g('worktree', 'add', '-q', '-b', 'speck/0001-export-bookings', wt);
  const calls = [];
  const made = {};
  const put = raceWatch(r, wt, made);
  let files;
  try { files = boardWatcher(fs.realpathSync(r.dir), runs(r, ''), () => calls.push(Date.now())); } finally { put(); }
  try {
    assert.ok(made.done, 'the folder appeared as the watch started');
    await wait(200);
    const from = calls.length;
    fs.writeFileSync(path.join(wt, 'speck', 'tickets', '0001-x.md'), 'status: building\n');
    await wait(300);
    assert.ok(calls.length > from, 'the change in it was seen');
  } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); }
});
