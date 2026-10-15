import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0189: an open build log is sent to the page over its event stream as the build writes it, instead of the page asking
// for the whole log every second.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { panelRepo, startPanel, stop, freePort, page, fakePage, T, queueRows, click } from './support/panel.mjs';
import { openStream, manualSources, wait } from './support/stream.mjs';
import { logFeed } from '../scripts/log-feed.mjs';
import { readableLog } from '../scripts/speck.mjs';

// A stream-json event as a build writes it: the agent saying `text` at `at`.
const said = (text, at = '2026-10-15T09:00:00.000Z') => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'text', text }] } })}\n`;
const ran = (command, at = '2026-10-15T09:00:00.000Z') => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'tool_use', name: 'Bash', input: { command } }] } })}\n`;
const ended = `${JSON.stringify({ type: 'result', subtype: 'success', result: 'done' })}\n`;
const clock = iso => { const d = new Date(iso), two = n => String(n).padStart(2, '0'); return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`; };

// A logFeed over a folder of its own, with one open stream named 's1', whose updates are kept in `sent`.
function feedOf() {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-runs-')), sent = [];
  const feed = logFeed(runs, (stream, event, data) => sent.push({ stream, event, data }), id => ({ fallback: id }));
  feed.opened('s1');
  const file = id => path.join(runs, `${id}.log`);
  return { runs, sent, feed, file, write: (id, text) => fs.writeFileSync(file(id), text), add: (id, text) => fs.appendFileSync(file(id), text) };
}
// A request's headers on stream `stream`, numbered `n` (X-Speck-Order) when given.
const on = (stream, n) => ({ 'x-speck-stream': stream, ...(n === undefined ? {} : { 'x-speck-order': String(n) }) });
// Counts the bytes read from files while fn runs.
function bytesRead(fn) {
  const real = fs.readSync;
  let n = 0;
  fs.readSync = (...a) => { const got = real(...a); n += got; return got; };
  try { fn(); } finally { fs.readSync = real; }
  return n;
}
// GET /api/tickets/<id>/log as the page sends it, on stream `name`.
const getLog = (port, id, name, close = false) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: `/api/tickets/${id}/log${close ? '/close' : ''}`, headers: { Host: `127.0.0.1:${port}`, 'X-Speck-Stream': name } }, r => {
    let body = ''; r.setEncoding('utf8'); r.on('data', d => { body += d; }); r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(body) }));
  }).on('error', reject);
});

// A fake page with a stream the test drives, whose /api/tickets/<id>/log answers with `log` and counts each request.
function streamPage(log) {
  const { EventSource, sources } = manualSources();
  const asks = [], orders = [];
  const fetch = async (url, opts = {}) => {
    if (/\/log(\/close)?$/.test(url)) orders.push((opts.headers || {})['X-Speck-Order']);
    if (/\/log$/.test(url)) { asks.push({ url, stream: (opts.headers || {})['X-Speck-Stream'] }); return { ok: true, status: 200, json: async () => log }; }
    if (/\/log\/close$/.test(url)) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    return { ok: true, status: 200, json: async () => ({ tickets: [T('0001', 'building', { started: new Date().toISOString() })], ideas: [] }) };
  };
  const p = fakePage([], { fetch, EventSource, getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) });
  p.asks = asks;
  p.orders = orders;
  p.source = () => sources[sources.length - 1];
  return p;
}
const NAME = 'cd'.repeat(16);
const rowOf = p => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === '0001'));
const logOf = p => p.all(rowOf(p)).find(n => /(^| )log( |$)/.test(n.className || ''));

// ---------- AC1: each new entry within a second, and no timer ----------

test('0189 AC1: a build\'s new entry reaches the page\'s stream within 1 second of being written', async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.log'), said('Starting.'));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const s = openStream(p.port);
  try {
    const name = (await s.until(e => e.event === 'stream', 5000)).data;
    const first = await getLog(p.port, '0001', name);
    assert.equal(first.status, 200);
    assert.match(first.body.text, /Starting\./);
    for (const [i, cmd] of ['npm test', 'git status', 'ls'].entries()) {
      const from = s.events.length, t0 = Date.now();
      fs.appendFileSync(path.join(runs, '0001.log'), ran(cmd));
      const e = await s.until(e => e.event === 'log', 1000, from, `the update for "${cmd}"`);
      assert.ok(Date.now() - t0 <= 1000, `within a second: ${Date.now() - t0} ms`);
      const u = JSON.parse(e.data);
      assert.equal(u.id, '0001');
      assert.equal(u.at, i + 1);
      assert.deepEqual(u.lines.filter(l => l !== '').map(l => l.replace(/^\d\d:\d\d:\d\d /, '')), [`→ Bash: ${cmd}`], 'only the new entry');
    }
  } finally { s.close(); await stop(p); }
});

test('0189 AC1: the page asks for an open log once, on its stream, sets no timer for it, and shows each update as it arrives', async () => {
  const p = streamPage({ text: 'one', truncated: false, build: 7, at: 0 });
  await p.settle();
  p.source().emit('open');
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  click(rowOf(p).children.find(n => n.className === 'top'));
  await p.settle();
  assert.deepEqual(p.asks, [{ url: '/api/tickets/0001/log', stream: NAME }], 'asked for once, on the stream');
  assert.equal(logOf(p).textContent, 'one');
  const timers = p.timers.length;
  for (let at = 1; at <= 3; at++) {
    p.source().emit('log', JSON.stringify({ id: '0001', build: 7, at, drop: 0, lines: [`line ${at}`] }));
    assert.equal(logOf(p).textContent, ['one', 'line 1', 'line 2', 'line 3'].slice(0, at + 1).join('\n'), 'shown at once');
  }
  p.source().emit('ping', '1');
  await p.settle();
  assert.equal(p.asks.length, 1, 'never asked for again');
  assert.equal(p.timers.length, timers, 'no timer set');
  assert.doesNotMatch(page(), /LOG_MS|logTick|startLogTimer/, 'the page has no log timer');
});

test('0189 AC1: a page whose stream reconnects opens its log on the new stream, and an update it missed makes it ask again', async () => {
  const p = streamPage({ text: 'one', truncated: false, build: 7, at: 0 });
  await p.settle();
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  click(rowOf(p).children.find(n => n.className === 'top'));
  await p.settle();
  const other = 'ef'.repeat(16);
  p.source().emit('stream', other);
  await p.settle();
  assert.deepEqual(p.asks.map(a => a.stream), [NAME, other], 'opened again on the new stream');
  p.source().emit('log', JSON.stringify({ id: '0001', build: 7, at: 2, drop: 0, lines: ['skipped one'] }));
  await p.settle();
  assert.equal(p.asks.length, 3, 'update 1 never came: asked again');
  p.source().emit('log', JSON.stringify({ id: '0001', build: 7, at: 0, drop: 0, lines: ['old'] }));
  p.source().emit('log', '{not json');
  await p.settle();
  assert.equal(logOf(p).textContent, 'one', 'an update already shown, or one that isn\'t one, changes nothing');
});

// ---------- AC2: opening shows the last 200 entries, with their times ----------

test('0189 AC2: opening a log on a stream gives its last 200 lines with their times, as the panel did before', () => {
  const { feed, write, file } = feedOf();
  let text = '';
  for (let i = 0; i < 250; i++) text += said(`Step ${i}.`, `2026-10-15T09:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.000Z`);
  write('0001', text);
  const got = feed.answer(on('s1'), '0001');
  const before = readableLog(fs.readFileSync(file('0001'), 'utf8'), { times: true }).replace(/\s+$/, '').split('\n');
  assert.equal(got.text, before.slice(-200).join('\n'), 'the same 200 lines');
  assert.equal(got.truncated, true);
  assert.ok(got.text.endsWith(`${clock('2026-10-15T09:04:09.000Z')} Step 249.`), 'each with its time');
  assert.deepEqual(feed.answer(on('nobody'), '0003'), { fallback: '0003' }, 'without an open stream: the panel reads it as before, and doesn\'t follow it');
  assert.deepEqual(feed.answer(on('nobody'), '0001'), { text: got.text, truncated: true }, 'or, while a stream follows it, gives it without reading it again');
  assert.deepEqual(feed.following(), ['0001']);
  const none = feed.answer(on('s1'), '0002');
  assert.equal(none.text, '', 'no log yet');
  assert.equal(none.truncated, false);
});

test('0189 AC2: the page shows the last 200 lines as updates add to them, with the note that earlier ones aren\'t shown', async () => {
  const p = streamPage({ text: Array.from({ length: 199 }, (_, i) => `l${i}`).join('\n'), truncated: false, build: 3, at: 0 });
  await p.settle();
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  click(rowOf(p).children.find(n => n.className === 'top'));
  await p.settle();
  p.source().emit('log', JSON.stringify({ id: '0001', build: 3, at: 1, drop: 0, lines: ['l199', 'l200'] }));
  const shown = logOf(p).textContent.split('\n');
  assert.match(shown[0], /^Earlier lines aren't shown/);
  assert.deepEqual(shown.slice(1), Array.from({ length: 200 }, (_, i) => `l${i + 1}`));
});

// ---------- AC3: only the new entries, without reading the whole log again ----------

test('0189 AC3: each update carries only the new entries, and reads only what was written since', () => {
  const { feed, sent, add, write, file } = feedOf();
  let big = '';
  while (big.length < 2.5 * 1024 * 1024) big += ran(`echo ${'x'.repeat(150)}`);
  write('0001', big);
  feed.answer(on('s1'), '0001');
  const more = said('Tests pass.') + ran('git commit');
  add('0001', more);
  const n = bytesRead(() => feed.ping());
  assert.ok(n <= Buffer.byteLength(more) + 1024, `read ${n} bytes for ${Buffer.byteLength(more)} new ones, of a ${fs.statSync(file('0001')).size}-byte log`);
  assert.equal(sent.length, 1);
  const u = sent[0].data;
  assert.equal(sent[0].event, 'log');
  assert.equal(u.drop, 0);
  assert.deepEqual(u.lines.map(l => l.replace(/^\d\d:\d\d:\d\d /, '')), ['Tests pass.', '', '→ Bash: git commit']);
  assert.equal(bytesRead(() => feed.ping()), 1024, 'unchanged: only its first bytes are looked at, to tell a new build');
  assert.equal(sent.length, 1, 'and nothing is sent');
});

test('0189 AC3: an entry written in two parts is sent once it\'s whole, and a plain line still being written is shown and then finished', () => {
  const { feed, sent, add, write } = feedOf();
  write('0001', said('Hello.'));
  feed.answer(on('s1'), '0001');
  const line = ran('npm test');
  add('0001', line.slice(0, 30));
  feed.ping();
  assert.equal(sent.length, 0, 'half an event: nothing yet');
  add('0001', line.slice(30));
  feed.ping();
  assert.deepEqual(sent.map(s => s.data.lines.map(l => l.replace(/^\d\d:\d\d:\d\d /, ''))), [['', '→ Bash: npm test']], 'the blank line after the agent\'s text, then the entry');
  add('0001', 'npm ER');
  feed.ping();
  add('0001', 'R! failed\n');
  feed.ping();
  assert.deepEqual(sent.slice(1).map(s => [s.data.drop, s.data.lines]), [[0, ['npm ER']], [1, ['npm ERR! failed']]]);
});

test('0189 AC1: a plain line still being written is sent again each time it grows, before it ends (review round 1, F1)', () => {
  const { feed, sent, add, write } = feedOf();
  write('0001', 'Building\n');
  feed.answer(on('s1'), '0001');
  for (const part of ['npm ER', 'R! fai', 'led']) { add('0001', part); feed.ping(); }
  assert.deepEqual(sent.map(s => [s.data.drop, s.data.lines]), [[0, ['npm ER']], [1, ['npm ERR! fai']], [1, ['npm ERR! failed']]]);
  feed.ping();
  assert.equal(sent.length, 3, 'unchanged: nothing more');
});

test('0189 AC3: a stream that closes, or closes the log, is sent nothing more, and a log no stream has open isn\'t followed', () => {
  const { feed, sent, add, write } = feedOf();
  write('0001', said('Hello.'));
  feed.opened('s2');
  feed.answer(on('s1'), '0001');
  feed.answer(on('s2'), '0001');
  feed.answer(on('s1'), '0001', true);
  add('0001', ran('ls'));
  feed.ping();
  assert.deepEqual(sent.map(s => s.stream), ['s2'], 'only the stream that has it open');
  feed.closed('s2');
  assert.deepEqual(feed.following(), [], 'nobody has it open: not followed');
  add('0001', ran('pwd'));
  feed.ping();
  assert.equal(sent.length, 1);
});

test('0189 AC3: closing and opening a log quickly leaves it open, whichever request arrives last', async () => {
  const { feed, sent, add, write } = feedOf();
  write('0001', said('Hello.'));
  feed.answer(on('s1', 1), '0001');
  feed.answer(on('s1', 3), '0001'); // opened again, before...
  assert.deepEqual(feed.answer(on('s1', 2), '0001', true), { ok: true }); // ...the close made between them arrives
  add('0001', ran('ls'));
  feed.ping();
  assert.equal(sent.length, 1, 'still open');
  feed.answer(on('s1', 4), '0001', true);
  const late = feed.answer(on('s1', 3), '0001'); // an opening answered after a later close
  assert.deepEqual(late, { fallback: '0001' }, 'still answered with the log');
  add('0001', ran('pwd'));
  feed.ping();
  assert.equal(sent.length, 1, 'but not opened again');
  // The page numbers each opening and closing.
  const p = streamPage({ text: 'one', truncated: false, build: 1, at: 0 });
  await p.settle();
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  for (let i = 0; i < 3; i++) { click(rowOf(p).children.find(n => n.className === 'top')); await p.settle(); }
  assert.deepEqual(p.orders, ['1', '2', '3'], 'open, close, open: in order');
});

// ---------- AC4: an ended build's log gets nothing more until a new build starts ----------

test('0189 AC4: a log whose build has ended gets no more updates until a new build of the ticket starts', async () => {
  const { feed, sent, write, file, add } = feedOf();
  write('0001', said('All done.') + ended);
  const first = feed.answer(on('s1'), '0001');
  for (let i = 0; i < 3; i++) feed.ping();
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(file('0001'), later, later); // touched, but nothing written
  feed.written('0001.log');
  await wait(120);
  feed.ping();
  assert.deepEqual(sent, [], 'nothing sent while the build has ended');
  write('0001', said('A new build begins.', '2026-10-15T10:00:00.000Z')); // speck run starts a new build's log afresh
  feed.ping();
  assert.equal(sent.length, 1);
  const u = sent[0].data;
  assert.equal(u.reset, true, 'the new build\'s log replaces it');
  assert.ok(u.build > first.build);
  assert.equal(u.text, `${clock('2026-10-15T10:00:00.000Z')} A new build begins.`);
  add('0001', ran('npm test'));
  feed.ping();
  assert.equal(sent.length, 2, 'and the new build\'s entries follow');
  assert.equal(sent[1].data.at, u.at + 1);
});

test('0189 AC4: a new build whose log has already grown past the old one is still told apart from it', () => {
  const { feed, sent, write } = feedOf();
  write('0001', said('Old build.') + ended);
  feed.answer(on('s1'), '0001');
  write('0001', said('New build, with a much longer first message than the old build had.') + ran('npm test') + ran('git status'));
  feed.ping();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].data.reset, true);
  assert.match(sent[0].data.text, /New build/);
  assert.doesNotMatch(sent[0].data.text, /Old build/);
});

test('0189 AC4: in the panel, an ended build\'s open log sends nothing, and a new build of it does', async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs'), log = path.join(runs, '0001.log');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(log, said('Finished.') + ended);
  const p = await startPanel(r.dir, ['--port', String(await freePort())], undefined, { SPECK_PANEL_PING_MS: '200' });
  const s = openStream(p.port);
  try {
    const name = (await s.until(e => e.event === 'stream', 5000)).data;
    await getLog(p.port, '0001', name);
    const from = s.events.length;
    await wait(700); // several keep-alives, each of which looks at the log
    assert.deepEqual(s.events.slice(from).filter(e => e.event === 'log'), [], 'nothing sent');
    fs.writeFileSync(log, said('Started again.'));
    const e = await s.until(e => e.event === 'log', 1000, from, 'the new build\'s log');
    assert.equal(JSON.parse(e.data).reset, true);
  } finally { s.close(); await stop(p); }
});
