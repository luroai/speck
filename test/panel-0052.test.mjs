import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, panelRepo, freePort, startPanel, stop, page, fakePage, queueRows, click, findChrome, browserPage } from './support/panel.mjs';
import { tickingSource } from './support/stream.mjs';

// ---------- 0052: show a build's log growing as it runs ----------

const writeLog = (dir, id, text) => {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, `${id}.log`), text);
};
const lines = (n, from = 1) => Array.from({ length: n }, (_, i) => `line ${i + from}`);

// A fake page whose fetch answers /api/state with each state in turn (the last one again once they run out) and
// /api/tickets/<id>/log from `logs`, a map from id to the answer, a function giving it, or an Error for a request that
// fails. Every timer the page sets is kept with its delay, so the board's updates (every 2 seconds) can be run apart.
// 0189: the page's stream is named NAME, and a log asked for on it is opened there: tick() then sends each open log's
// change since it was last sent, as the server does when the build writes to it (added lines, or a new build's log),
// and ping() sends a keep-alive.
const NAME = 'ab'.repeat(16);
function livePage(states, logs = {}) {
  const calls = [], timers = [], opened = new Map(), sources = []; // opened: id → what the stream last gave it
  let builds = 0;
  const answer = id => { const ans = typeof logs[id] === 'function' ? logs[id]() : logs[id]; return ans instanceof Error ? ans : ans ?? { text: '', truncated: false }; };
  const fetch = async (url, opts = {}) => {
    calls.push(url);
    const m = String(url).match(/^\/api\/tickets\/([^/]+)\/log(\/close)?$/);
    if (m) {
      const id = decodeURIComponent(m[1]), on = (opts.headers || {})['X-Speck-Stream'] === NAME;
      if (m[2]) { if (on) opened.delete(id); return { ok: true, status: 200, json: async () => ({ ok: true }) }; }
      const ans = answer(id);
      if (ans instanceof Error) throw ans;
      if (!on) return { ok: true, status: 200, json: async () => ans };
      const o = { text: ans.text, build: ++builds, at: 0 };
      opened.set(id, o);
      return { ok: true, status: 200, json: async () => ({ ...ans, build: o.build, at: 0 }) };
    }
    const s = states.length > 1 ? states.shift() : states[0];
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(s)) };
  };
  const setTimeout = (fn, ms) => timers.push({ fn, ms });
  const Ticking = tickingSource({ setTimeout });
  class EventSource extends Ticking {
    constructor(url) { super(url); sources.push(this); Promise.resolve().then(() => this.emit('stream', NAME)); }
  }
  const p = fakePage([], { fetch, setTimeout, EventSource, getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) },
    { made: n => { if (n.tagName === 'pre') sized(n); } });
  p.logCalls = () => calls.filter(u => /\/log$/.test(u));
  p.closeCalls = () => calls.filter(u => /\/log\/close$/.test(u));
  p.opened = opened;
  p.source = () => sources[sources.length - 1];
  p.pending = ms => timers.filter(t => t.ms === ms).length;
  p.send = async update => { p.source().emit('log', JSON.stringify(update)); await p.settle(); };
  p.tick = async () => {
    for (const [id, o] of opened) {
      const ans = answer(id);
      if (ans instanceof Error || ans.text === o.text) continue;
      const was = o.text ? o.text.split('\n') : [], now = ans.text ? ans.text.split('\n') : [];
      const grown = !ans.truncated && was.every((l, i) => now[i] === l);
      o.at++;
      if (grown) p.source().emit('log', JSON.stringify({ id, build: o.build, at: o.at, drop: 0, lines: now.slice(was.length) }));
      else { o.build = ++builds; o.at = 0; p.source().emit('log', JSON.stringify({ id, build: o.build, at: 0, reset: true, text: ans.text, truncated: ans.truncated })); }
      o.text = ans.text;
    }
    await p.settle();
  };
  p.ping = async () => { p.source().emit('ping', '1'); await p.settle(); };
  p.run = async ms => {
    const i = timers.findIndex(t => t.ms === ms);
    assert.ok(i >= 0, `a ${ms} ms timer is set`);
    timers.splice(i, 1)[0].fn();
    await p.settle();
  };
  return p;
}
const poll = p => p.run(2000);
const tick = p => p.tick();
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const logOf = (p, id) => p.all(rowOf(p, id)).find(n => /(^| )log( |$)/.test(n.className || ''));
const open = async (p, id) => { click(topOf(rowOf(p, id))); await p.settle(); };
const state = () => ({
  tickets: [
    T('0001', 'building', { started: new Date().toISOString() }),
    T('0002', 'reviewing'),
    T('0003', 'ready'),
  ],
  ideas: [],
});
// Gives a fake log box the sizes a browser would: 18 pixels a line, in a box 360 pixels high, with scrollTop kept
// between 0 and the bottom.
const sized = box => {
  let top = Number(box.scrollTop) || 0, high = 360;
  const max = () => Math.max(0, box.scrollHeight - high);
  Object.defineProperty(box, 'scrollHeight', { get: () => Math.max(high, box.textContent.split('\n').length * 18), configurable: true });
  Object.defineProperty(box, 'clientHeight', { get: () => high, set: v => { high = v; }, configurable: true });
  Object.defineProperty(box, 'scrollTop', { get: () => Math.min(top, max()), set: v => { top = Math.max(0, Math.min(Number(v), max())); }, configurable: true });
  return box;
};
const bottomOf = box => box.scrollHeight - box.clientHeight;

// 0189 changed these four from asking every second to the stream sending each change (0189 AC1).
test('0052 AC1: an open queue ticket\'s log is asked for once, on the page\'s stream, which then sends its changes, and never for a ticket never opened', async () => {
  let text = 'one';
  const p = livePage([state()], { '0001': () => ({ text, truncated: false }) });
  await p.settle();
  await poll(p);
  await poll(p);
  assert.deepEqual(p.logCalls(), [], 'nothing open: no log request');
  await open(p, '0001');
  assert.deepEqual(p.logCalls(), ['/api/tickets/0001/log'], 'asked for at once when opened');
  assert.ok(p.opened.has('0001'), 'opened on the stream');
  assert.equal(p.pending(1000), 0, 'no log timer');
  for (const more of ['one\ntwo', 'one\ntwo\nthree', 'one\ntwo\nthree\nfour']) { text = more; await tick(p); }
  assert.equal(logOf(p, '0001').textContent, 'one\ntwo\nthree\nfour', 'each change shows');
  await poll(p);
  await poll(p);
  assert.equal(p.logCalls().length, 1, 'never asked for again');
  assert.equal(p.pending(1000), 0, 'and no log timer');
});

test('0052 AC1: every open ticket gets its own changes, and a closed one is closed on the stream at once', async () => {
  const texts = { '0001': 'a', '0003': 'x' };
  const p = livePage([state()], { '0001': () => ({ text: texts['0001'], truncated: false }), '0003': () => ({ text: texts['0003'], truncated: false }) });
  await p.settle();
  await open(p, '0001');
  await open(p, '0003');
  texts['0001'] = 'a\nb'; texts['0003'] = 'x\ny';
  await tick(p);
  assert.equal(logOf(p, '0001').textContent, 'a\nb');
  assert.equal(logOf(p, '0003').textContent, 'x\ny');
  await open(p, '0001'); // closes it
  assert.deepEqual(p.closeCalls(), ['/api/tickets/0001/log/close'], 'closed on the stream');
  assert.deepEqual([...p.opened.keys()], ['0003']);
  await open(p, '0003'); // closes the last one
  assert.equal(p.opened.size, 0, 'nothing open: nothing sent');
  assert.equal(p.logCalls().length, 2, 'each asked for once');
});

test('0052 AC1: closing and opening again quickly, or refreshes that rebuild the row, ask for nothing more and show each change once', async () => {
  const s = state(), changed = JSON.parse(JSON.stringify(s));
  changed.tickets[0].title = 'Renamed'; // the open ticket's own data changes, so its row is rebuilt
  let text = 'one';
  const p = livePage([s, changed], { '0001': () => ({ text, truncated: false }) });
  await p.settle();
  await open(p, '0001');
  await open(p, '0001');
  await open(p, '0001');
  assert.equal(p.logCalls().length, 2, 'asked for on each opening');
  await poll(p);
  await poll(p);
  assert.equal(p.logCalls().length, 2, 'refreshes ask for nothing');
  text = 'one\ntwo';
  await tick(p);
  assert.equal(logOf(p, '0001').textContent, 'one\ntwo', 'the change shows once');
});

test('0052 AC1: an open ticket that has left the queue is no longer asked for', async () => {
  const s = state(), gone = JSON.parse(JSON.stringify(s));
  gone.tickets.shift(); // 0001 has shipped or gone
  const p = livePage([s, gone]);
  await p.settle();
  await open(p, '0001');
  await poll(p);
  assert.ok(!rowOf(p, '0001'), 'no longer in the queue');
  const before = p.logCalls().length;
  p.source().emit('stream', NAME); // the stream reconnected, which opens the open logs on it again
  await p.settle();
  assert.equal(p.logCalls().length, before, 'not asked for');
});

test('0052 AC2: the box has a fixed height and its own scrollbar', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  const rule = css.match(/\.log\s*\{([^}]*)\}/)[1];
  assert.match(rule, /(^|[;\s])height:\s*[\d.]+(em|px|rem)/, 'a fixed height, not only a maximum');
  assert.match(rule, /overflow-y:\s*auto/);
});

test('0052 AC2: new text goes into the same box, in place, with only the newest lines', async () => {
  let text = lines(3).join('\n'), truncated = false;
  const p = livePage([state()], { '0001': () => ({ text, truncated }) });
  await p.settle();
  await open(p, '0001');
  const box = logOf(p, '0001'), detached = box.detached || 0;
  assert.equal(box.textContent, lines(3).join('\n'));
  text = lines(5).join('\n');
  await tick(p);
  assert.equal(logOf(p, '0001'), box, 'the same box');
  assert.equal(box.detached || 0, detached, 'never taken out of the page');
  assert.equal(box.textContent, lines(5).join('\n'), 'with the new lines at the bottom');
  const o = p.opened.get('0001');
  await p.send({ id: '0001', build: o.build, at: ++o.at, drop: 0, lines: lines(295, 6) }); // 0189: the stream adds lines 6 to 300
  assert.equal(box.textContent.split('\n').slice(1).join('\n'), lines(200, 101).join('\n'), 'only the newest 200 lines');
  assert.match(box.textContent, /^Earlier lines aren't shown/);
});

test('0052 AC3: at the bottom the box follows each update; scrolled up it stays put; back at the bottom it follows again', async () => {
  let n = 30;
  const p = livePage([state()], { '0001': () => ({ text: lines(n).join('\n'), truncated: false }) });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  const box = sized(logOf(p, '0001')); // made at once, before its log arrives
  await p.settle();
  assert.equal(box.scrollTop, bottomOf(box), 'opened at the bottom');
  n = 40;
  await tick(p);
  assert.equal(box.scrollTop, bottomOf(box), 'still at the bottom: it follows');
  box.scrollTop = bottomOf(box) - 3; // not quite at the bottom, as a browser often leaves it
  n = 45;
  await tick(p);
  assert.equal(box.scrollTop, bottomOf(box), 'a few pixels off the bottom still counts as at the bottom');
  box.scrollTop = 100; // the reader scrolls up
  n = 60;
  await tick(p);
  assert.equal(box.scrollTop, 100, 'stays where the reader left it');
  assert.equal(box.textContent, lines(60).join('\n'), 'with the new text');
  box.scrollTop = bottomOf(box); // and back down
  n = 70;
  await tick(p);
  assert.equal(box.scrollTop, bottomOf(box), 'follows again');
});

test('0052 AC3: a rebuilt row keeps the box where it was: at the bottom, or where the reader scrolled', async () => {
  const s = state(), a = JSON.parse(JSON.stringify(s)), b = JSON.parse(JSON.stringify(s));
  a.tickets[0].title = 'Renamed'; b.tickets[0].title = 'Renamed again';
  const p = livePage([s, a, b], { '0001': { text: lines(50).join('\n'), truncated: false } });
  await p.settle();
  await open(p, '0001');
  const first = sized(logOf(p, '0001'));
  first.scrollTop = 120;
  await poll(p);
  const second = logOf(p, '0001');
  assert.notEqual(second, first, 'rebuilt');
  assert.equal(second.scrollTop, 120, 'scrolled up: kept there');
  sized(second);
  second.scrollTop = bottomOf(second);
  await poll(p);
  const third = sized(logOf(p, '0001'));
  assert.notEqual(third, second, 'rebuilt again');
  assert.equal(third.scrollTop, bottomOf(third), 'at the bottom: still at the bottom');
});

test('0052 AC4: a failed request leaves the log as it was, and the next good one shows the new text', async () => {
  let fail = false, text = 'first';
  const p = livePage([state()], { '0001': () => (fail ? new Error('down') : { text, truncated: false }) });
  await p.settle();
  await open(p, '0001');
  const box = sized(logOf(p, '0001'));
  box.scrollTop = 0;
  box.clientHeight = 10; // a box scrolled up, so nothing moves it but a new log
  const queue = p.byId('queue'), rows = [...queue.children];
  fail = true;
  p.source().emit('stream', NAME); // 0189: the stream reconnected, so the log is asked for again, and that fails
  await p.settle();
  await p.ping();
  assert.equal(p.logCalls().length, 3, 'asked for again, and again at the next keep-alive');
  assert.equal(logOf(p, '0001'), box);
  assert.equal(box.textContent, 'first', 'the log as it was');
  assert.equal(box.scrollTop, 0, 'not scrolled');
  assert.deepEqual(queue.children, rows, 'nothing else changed');
  fail = false; text = 'first\nsecond';
  await p.ping();
  assert.equal(box.textContent, 'first\nsecond', 'the next good answer shows');
});

test('0052 AC4: before any log has arrived, a failure says it is trying again, and the next good answer replaces that', async () => {
  let fail = true;
  const p = livePage([state()], { '0001': () => (fail ? new Error('down') : { text: 'at last', truncated: false }) });
  await p.settle();
  await open(p, '0001');
  const box = logOf(p, '0001');
  assert.match(box.textContent, /^Couldn't load the log/);
  assert.doesNotMatch(box.textContent, /Close and open/, 'it tries again by itself');
  fail = false;
  await p.ping(); // 0189: at the stream's next keep-alive
  assert.equal(logOf(p, '0001'), box);
  assert.equal(box.textContent, 'at last');
});

test('0052 AC5: a log replaced by a new build shows only the new log, at the bottom, even when scrolled up', async () => {
  let ans = { text: lines(200, 301).join('\n'), truncated: true };
  const p = livePage([state()], { '0001': () => ans });
  await p.settle();
  await open(p, '0001');
  const box = sized(logOf(p, '0001'));
  box.scrollTop = 40; // the reader has scrolled up
  ans = { text: 'new build\nstarting', truncated: false };
  await tick(p);
  assert.equal(box.textContent, 'new build\nstarting', 'nothing left over from the old log');
  assert.equal(box.scrollTop, bottomOf(box), 'at the bottom');
  box.clientHeight = 10; box.scrollTop = 0; // scrolled up again, in a short box
  ans = { text: 'other', truncated: false }; // shorter and different: replaced again
  await tick(p);
  assert.equal(box.textContent, 'other');
  assert.equal(box.scrollTop, bottomOf(box), 'at the bottom again');
  ans = { text: '', truncated: false }; // the new build's log has been emptied and nothing written yet
  box.scrollTop = 0;
  await tick(p);
  assert.equal(box.textContent, 'No log yet.');
});

// ---------- in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;
const box = `${row('0001')}.querySelector('.log')`;
const atBottom = `(${box}.scrollHeight - ${box}.clientHeight - ${box}.scrollTop <= 2)`;

test('0052 AC1-AC5: in a real browser, the log grows by itself in a fixed box, follows at the bottom, keeps a selection scrolled up, and resets for a new build', chrome, async () => {
  const r = panelRepo();
  writeLog(r.dir, '0001', `${lines(5).join('\n')}\n`);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`${row('0001')}`, 'the queue');
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    await b.until(`(${box} || {}).textContent?.includes('line 5')`, 'the log');
    const height = await b.js(`${box}.offsetHeight`);

    // AC1, AC2: new lines show up by themselves; the box doesn't grow.
    writeLog(r.dir, '0001', `${lines(300).join('\n')}\n`);
    await b.until(`${box}.textContent.includes('line 300')`, 'the new lines, with no reload');
    assert.equal(await b.js(`${box}.offsetHeight`), height, 'the box never grows');
    assert.ok(!(await b.js(`${box}.textContent`)).includes('line 100\n'), 'only the 200-line tail');
    assert.ok(await b.js(atBottom), 'AC3: at the bottom, it follows');

    // AC3: scrolled up, it stays put and a selection there stays selected.
    await b.js(`${box}.scrollTop = 200`);
    await b.js(`(() => { const t = ${box}.firstChild, at = t.data.indexOf('line 250'), r = document.createRange();
      r.setStart(t, at); r.setEnd(t, at + 'line 250'.length); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    assert.equal(await b.js('getSelection().toString()'), 'line 250');
    writeLog(r.dir, '0001', `${lines(310).join('\n')}\n`);
    await b.until(`${box}.textContent.includes('line 310')`, 'more lines');
    assert.equal(await b.js(`${box}.scrollTop`), 200, 'stays where the reader left it');
    assert.equal(await b.js('getSelection().toString()'), 'line 250', 'the selection stays');
    assert.ok(!(await b.js(atBottom)));

    // Back at the bottom, it follows again.
    await b.js(`getSelection().removeAllRanges(); ${box}.scrollTop = ${box}.scrollHeight`);
    writeLog(r.dir, '0001', `${lines(320).join('\n')}\n`);
    await b.until(`${box}.textContent.includes('line 320')`, 'more lines again');
    assert.ok(await b.js(atBottom), 'follows again');

    // AC5: a new build's shorter log replaces it, at the bottom, even when scrolled up.
    await b.js(`${box}.scrollTop = 100`);
    writeLog(r.dir, '0001', 'a new build\n');
    await b.until(`${box}.textContent === 'a new build'`, 'the new log');
    assert.ok(await b.js(atBottom));

    // AC1: closing it stops the requests.
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    assert.equal(await b.js(`!!${box}`), false);
  } finally {
    await b.close();
    await stop(panel);
  }
});

test('0052 AC3: in a real browser, a selection in repeated lines stays through unchanged and growing logs (review round 1, F1)', chrome, async () => {
  const r = panelRepo();
  writeLog(r.dir, '0001', 'working\nworking\n');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`${row('0001')}`, 'the queue');
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    await b.until(`(${box} || {}).textContent === 'working\\nworking'`, 'the log');
    await b.js(`(() => { const t = ${box}.firstChild, r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 7);
      getSelection().removeAllRanges(); getSelection().addRange(r); window.mark = t; })()`);
    const selected = `getSelection().toString() === 'working' && getSelection().anchorNode === window.mark && getSelection().anchorOffset === 0`;
    // 0189: an unchanged log isn't asked for again or sent.
    await b.js(`window.asks = 0; const f = window.fetch; window.fetch = (...a) => { if (/\\/log$/.test(a[0])) window.asks++; return f(...a); }`);
    await new Promise(res => setTimeout(res, 1200));
    assert.equal(await b.js('window.asks'), 0, 'not asked for again');
    assert.ok(await b.js(selected), 'unchanged: the selection in the first line stays');
    writeLog(r.dir, '0001', 'working\nworking\nworking\n');
    await b.until(`${box}.textContent === 'working\\nworking\\nworking'`, 'a repeated line added');
    assert.ok(await b.js(selected), 'grown: the selection in the first line stays');
  } finally {
    await b.close();
    await stop(panel);
  }
});
