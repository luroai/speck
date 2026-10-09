import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, panelRepo, freePort, startPanel, stop, page, fakePage, queueRows, click, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0052: show a build's log growing as it runs ----------

const writeLog = (dir, id, text) => {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, `${id}.log`), text);
};
const lines = (n, from = 1) => Array.from({ length: n }, (_, i) => `line ${i + from}`);

// A fake page whose fetch answers /api/state with each state in turn (the last one again once they run out) and
// /api/tickets/<id>/log from `logs`, a map from id to the answer, a function giving it, or an Error for a request that
// fails. Every timer the page sets is kept with its delay, so the state poll (2 seconds) and the log timer (1 second) can
// be run apart.
function livePage(states, logs = {}) {
  const calls = [], timers = [];
  const fetch = async url => {
    calls.push(url);
    const m = String(url).match(/^\/api\/tickets\/([^/]+)\/log$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      const ans = typeof logs[id] === 'function' ? logs[id]() : logs[id];
      if (ans instanceof Error) throw ans;
      return { ok: true, status: 200, json: async () => ans ?? { text: '', truncated: false } };
    }
    const s = states.length > 1 ? states.shift() : states[0];
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(s)) };
  };
  const p = fakePage([], { fetch, setTimeout: (fn, ms) => timers.push({ fn, ms }), getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) },
    { made: n => { if (n.tagName === 'pre') sized(n); } });
  p.logCalls = () => calls.filter(u => /\/log$/.test(u));
  p.pending = ms => timers.filter(t => t.ms === ms).length;
  p.run = async ms => {
    const i = timers.findIndex(t => t.ms === ms);
    assert.ok(i >= 0, `a ${ms} ms timer is set`);
    timers.splice(i, 1)[0].fn();
    await p.settle();
  };
  return p;
}
const poll = p => p.run(2000);
const tick = p => p.run(1000);
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

test('0052 AC1: an open queue ticket\'s log is asked for once a second, on its own timer, and never for a ticket never opened', async () => {
  const p = livePage([state()], { '0001': { text: 'one', truncated: false } });
  await p.settle();
  assert.equal(p.pending(1000), 0, 'nothing open: no log timer');
  await poll(p);
  await poll(p);
  assert.deepEqual(p.logCalls(), [], 'nothing open: no log request');
  await open(p, '0001');
  assert.deepEqual(p.logCalls(), ['/api/tickets/0001/log'], 'asked for at once when opened');
  assert.equal(p.pending(1000), 1, 'a 1-second timer');
  for (let i = 0; i < 3; i++) await tick(p);
  assert.equal(p.logCalls().length, 4, 'once more each second');
  assert.equal(p.pending(1000), 1, 'one timer, set again each time');
  await poll(p);
  await poll(p);
  assert.equal(p.logCalls().length, 4, 'the state poll asks for no log');
  assert.equal(p.pending(1000), 1, 'and sets no log timer');
  assert.ok(p.logCalls().every(u => u === '/api/tickets/0001/log'), 'tickets never opened are never asked for');
});

test('0052 AC1: every open ticket is asked for on each tick, and a closed one at once stops being asked for', async () => {
  const p = livePage([state()]);
  await p.settle();
  await open(p, '0001');
  await open(p, '0003');
  assert.equal(p.pending(1000), 1, 'one timer for all the open tickets');
  const before = p.logCalls().length;
  await tick(p);
  assert.deepEqual(p.logCalls().slice(before).sort(), ['/api/tickets/0001/log', '/api/tickets/0003/log']);
  await open(p, '0001'); // closes it
  const after = p.logCalls().length;
  await tick(p);
  assert.deepEqual(p.logCalls().slice(after), ['/api/tickets/0003/log'], 'the closed one is no longer asked for');
  await open(p, '0003'); // closes the last one
  const last = p.logCalls().length;
  await tick(p);
  assert.equal(p.logCalls().length, last, 'nothing open: nothing asked for');
  assert.equal(p.pending(1000), 0, 'and the timer stops');
});

test('0052 AC1: closing and opening again quickly, or refreshes that rebuild the row, never start a second timer', async () => {
  const s = state(), changed = JSON.parse(JSON.stringify(s));
  changed.tickets[0].title = 'Renamed'; // the open ticket's own data changes, so its row is rebuilt
  const p = livePage([s, changed]);
  await p.settle();
  await open(p, '0001');
  await open(p, '0001');
  await open(p, '0001');
  assert.equal(p.pending(1000), 1, 'still one timer');
  await poll(p);
  await poll(p);
  assert.equal(p.pending(1000), 1, 'refreshes leave it alone');
  const before = p.logCalls().length;
  await tick(p);
  assert.equal(p.logCalls().length, before + 1, 'one request a second, not two');
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
  await tick(p);
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
  text = lines(200, 101).join('\n'); truncated = true;
  await tick(p);
  assert.equal(box.textContent.split('\n').slice(1).join('\n'), lines(200, 101).join('\n'), 'only the tail the server sends');
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
  await tick(p);
  await tick(p);
  assert.equal(logOf(p, '0001'), box);
  assert.equal(box.textContent, 'first', 'the log as it was');
  assert.equal(box.scrollTop, 0, 'not scrolled');
  assert.deepEqual(queue.children, rows, 'nothing else changed');
  assert.equal(p.pending(1000), 1, 'still asking');
  fail = false; text = 'first\nsecond';
  await tick(p);
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
  await tick(p);
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
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
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
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`${row('0001')}`, 'the queue');
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    await b.until(`(${box} || {}).textContent === 'working\\nworking'`, 'the log');
    await b.js(`(() => { const t = ${box}.firstChild, r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 7);
      getSelection().removeAllRanges(); getSelection().addRange(r); window.mark = t; })()`);
    const selected = `getSelection().toString() === 'working' && getSelection().anchorNode === window.mark && getSelection().anchorOffset === 0`;
    await b.js(`window.asks = 0; const f = window.fetch; window.fetch = (...a) => { if (/\\/log$/.test(a[0])) window.asks++; return f(...a); }`);
    await b.until('window.asks >= 2', 'two more log requests, with the same answer');
    await new Promise(res => setTimeout(res, 200));
    assert.ok(await b.js(selected), 'unchanged: the selection in the first line stays');
    writeLog(r.dir, '0001', 'working\nworking\nworking\n');
    await b.until(`${box}.textContent === 'working\\nworking\\nworking'`, 'a repeated line added');
    assert.ok(await b.js(selected), 'grown: the selection in the first line stays');
  } finally {
    await b.close();
    await stop(panel);
  }
});
