import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0548: a Build card's build log opens in the Pipeline log's full-screen pop-up, showing only that ticket's log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, T, queueRows, click, styles } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';

const NAME = 'ab'.repeat(16);
// A page with the board `tickets`, on a stream the test drives, whose log requests are answered by `logOf(id)`: a log,
// an Error for a request that fails, or a promise the test settles later. `made` is called with each node made.
function logPage(tickets, logOf, made = () => {}) {
  const { EventSource, sources } = manualSources();
  const calls = [];
  const fetch = async url => {
    calls.push(String(url));
    const m = String(url).match(/^\/api\/tickets\/(\w+)\/log$/);
    if (m) { const log = await logOf(m[1]); if (log instanceof Error) throw log; return { ok: true, status: 200, json: async () => log }; }
    if (/\/log\/close$/.test(url)) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    if (/\/api\/run-log$/.test(url)) return { ok: true, status: 200, json: async () => ({ lines: ['10:00:00 Shipped 0457.'] }) };
    return { ok: true, status: 200, json: async () => ({ tickets, ideas: [], run: { on: true, pid: 1 }, run_log: '1' }) };
  };
  let focused = null;
  const p = fakePage([], { fetch, EventSource, getSelection: () => ({ isCollapsed: true, rangeCount: 0 }), scrollX: 0, scrollY: 0, scrollTo() {} },
    { made: n => { n.focus = () => { focused = n; }; made(n); } });
  for (const id of ['foreman', 'run', 'build-section']) p.byId(id).focus = () => { focused = p.byId(id); };
  p.document.documentElement = { classList: { toggle() {} } };
  const held = [p.byId('main-stand-in')];
  p.document.querySelectorAll = sel => (/\bmain\b/.test(sel) ? held : []);
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  p.calls2 = calls;
  p.main = held[0];
  p.source = () => sources[sources.length - 1];
  return p;
}
const building = (id = '0001') => T(id, 'building', { started: new Date().toISOString() });
const rowOf = (p, id = '0001') => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const cardLog = (p, id) => p.all(rowOf(p, id)).find(n => /(^| )log( |$)/.test(n.className || ''));
const logButton = (p, id) => p.all(rowOf(p, id)).find(n => n.tagName === 'button' && n.textContent === 'Full log');
const pop = p => p.byId('foreman');
const listOf = p => p.all(pop(p)).find(n => /\brun-log\b/.test(n.className || '') && /^ol$/i.test(n.tagName));
const shown = p => listOf(p).children.map(li => li.textContent);
// Starts the page on its stream and opens the card of `id`.
async function opened(tickets, logOf, made, id = '0001') {
  const p = logPage(tickets, logOf, made);
  await p.settle();
  p.source().emit('open');
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  click(rowOf(p, id).children.find(n => n.className === 'top'));
  await p.settle();
  return p;
}
const LOG = { text: '09:00:00 Starting.\n09:00:01 → Bash: npm test\n09:00:02 ✗ npm test failed', truncated: false, build: 2, at: 0 };
async function poppedUp(log = LOG, made, tickets = [building()]) {
  const p = await opened(tickets, () => log, made);
  p.press(logButton(p, '0001'));
  await p.settle();
  return p;
}

// ---------- AC1: a button next to every open card's log box ----------

test('0548 AC1: an open card in flight, and an open queued one, each have a Full log button in the row of buttons just above their log box', async () => {
  const p = await opened([building('0001'), T('0002', 'ready')], () => LOG);
  click(rowOf(p, '0002').children.find(n => n.className === 'top'));
  await p.settle();
  for (const id of ['0001', '0002']) {
    const row = rowOf(p, id), b = logButton(p, id), box = cardLog(p, id);
    assert.ok(b, `${id}: the button`);
    assert.equal(b.attrs.type ?? b.type, 'button');
    const between = row.children.slice(row.children.indexOf(b) + 1, row.children.indexOf(box));
    assert.ok(row.children.indexOf(b) < row.children.indexOf(box), `${id}: before the log box`);
    assert.ok(between.every(n => n.tagName === 'button'), `${id}: only buttons between it and the box`);
  }
});

test('0548 AC1: a closed card has no Full log button', async () => {
  const p = logPage([building()], () => LOG);
  await p.settle();
  p.source().emit('open');
  p.source().emit('message', '1');
  await p.settle();
  assert.ok(rowOf(p), 'the card');
  assert.equal(logButton(p, '0001'), undefined);
});

test('0548 AC1: the button opens the pop-up titled "<id> build log", and the dialog is named so too', async () => {
  const p = await poppedUp();
  assert.equal(pop(p).hidden, false);
  const title = p.all(pop(p)).find(n => n.className === 'title');
  assert.equal(title.textContent, '0001 build log');
  assert.equal(pop(p).attrs['aria-label'], '0001 build log');
});

// ---------- AC2: the Pipeline log's template ----------

const shape = n => ({ tag: String(n.tagName).toLowerCase(), cls: n.className, kids: (n.children || []).filter(c => c.tagName !== '#text' && !/^(ol|li|p)$/i.test(c.tagName)).map(shape) });

test('0548 AC2: the pop-up is the Pipeline log\'s own, with the same frame, title row, Close and log box', async () => {
  const p = await poppedUp();
  const ours = shape(pop(p));
  p.key('Escape');
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(pop(p).hidden, false, 'the Pipeline log opens in the same element');
  const theirs = shape(pop(p));
  ours.kids[1].kids[0].kids = theirs.kids[1].kids[0].kids = []; // the stale page's line, empty in both
  assert.deepEqual(ours, theirs);
  assert.equal(p.all(pop(p)).find(n => n.className === 'title').textContent, 'Pipeline log');
  assert.equal(pop(p).attrs['aria-label'], 'Pipeline log', 'named for the Pipeline log again');
});

test('0548 AC2: each line is laid out as a Pipeline log line, a time column then the text, coloured by its kind', async () => {
  const p = await poppedUp();
  const rows = listOf(p).children;
  assert.deepEqual(rows.map(r => r.className), ['ln msg timed', 'ln tool timed', 'ln fail timed']);
  assert.ok(rows.every(r => r.children[0].className === 'at'));
  assert.equal(rows[0].children[0].textContent, '09:00:00 ');
  const css = styles();
  for (const [kind, v] of [['tool', '--log-run'], ['note', '--log-warn']]) assert.match(css, new RegExp(`\\.foreman \\.run-log \\.${kind} \\{ color: var\\(${v}\\); \\}`), kind);
});

test('0548 AC2: it shows only this ticket\'s log, never speck run\'s or another ticket\'s', async () => {
  const p = await poppedUp(LOG, undefined, [building('0001'), building('0002')]);
  click(rowOf(p, '0002').children.find(n => n.className === 'top'));
  await p.settle();
  p.source().emit('log', JSON.stringify({ id: '0002', build: 2, at: 1, drop: 0, lines: ['other ticket'] }));
  await p.settle();
  assert.ok(!shown(p).includes('other ticket'));
  assert.ok(!p.calls2.includes('/api/run-log'), 'speck run\'s log isn\'t asked for');
  assert.ok(!shown(p).some(l => /Shipped|0457/.test(l)));
});

// ---------- AC3: the card's lines, live ----------

test('0548 AC3: the same lines as the card\'s box, oldest at the top, and each new one is added at the bottom without reloading', async () => {
  const p = await poppedUp();
  assert.deepEqual(shown(p), cardLog(p, '0001').textContent.split('\n'));
  const asks = p.calls2.filter(u => /\/log$/.test(u)).length;
  p.source().emit('log', JSON.stringify({ id: '0001', build: 2, at: 1, drop: 0, lines: ['09:00:03 Fixed it.'] }));
  assert.equal(shown(p).at(-1), '09:00:03 Fixed it.', 'at once');
  assert.deepEqual(shown(p), cardLog(p, '0001').textContent.split('\n'));
  await p.settle();
  assert.equal(p.calls2.filter(u => /\/log$/.test(u)).length, asks, 'not asked for again');
});

test('0548 AC3: a cut-short log starts with the card\'s note, and a blank line keeps its place', async () => {
  const p = await poppedUp({ text: '09:00:00 a\n\n09:00:01 b', truncated: true, build: 1, at: 0 });
  assert.deepEqual(listOf(p).children.map(r => r.className), ['ln note', 'ln msg timed', 'ln gap', 'ln msg timed']);
  assert.match(styles(), /\.foreman \.run-log \.ln\.gap \{ min-height: 1\.5em; \}/, 'a blank line is a line high');
});

// A browser's layout: the log box 200 px high from 100 px down, each line 20 px.
function layout(n) {
  const list = () => (n.className === 'run-log' ? n : n.parentNode);
  Object.defineProperty(n, 'scrollHeight', { configurable: true, get: () => (n.className === 'run-log' ? n.children.length * 20 : 0) });
  Object.defineProperty(n, 'clientHeight', { configurable: true, get: () => (n.className === 'run-log' ? 200 : 0) });
  let top = 0;
  Object.defineProperty(n, 'scrollTop', { configurable: true, get: () => Math.min(top, Math.max(0, n.scrollHeight - 200)), set: v => { top = Math.max(0, Math.min(v, Math.max(0, n.scrollHeight - 200))); } });
  n.getBoundingClientRect = () => {
    if (n.className === 'run-log') return { top: 100, bottom: 300, left: 0, right: 0 };
    if (/^li$/i.test(n.tagName) && n.parentNode) { const at = 100 + n.parentNode.children.indexOf(n) * 20 - list().scrollTop; return { top: at, bottom: at + 20, left: 0, right: 0 }; }
    return { top: 0, bottom: 0, left: 0, right: 0 };
  };
}
const numbered = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `09:00:00 line ${from + i}`).join('\n');
const firstSeen = p => listOf(p).children.find(li => li.getBoundingClientRect().bottom > 100).textContent;

test('0548 AC3: it opens at the newest line and follows new ones while the reader is at the bottom', async () => {
  const p = await poppedUp({ text: numbered(1, 50), truncated: false, build: 1, at: 0 }, layout);
  const box = listOf(p);
  assert.equal(box.scrollTop, box.scrollHeight - 200, 'opened at the bottom');
  p.source().emit('log', JSON.stringify({ id: '0001', build: 1, at: 1, drop: 0, lines: ['09:00:01 line 51'] }));
  assert.equal(listOf(p), box, 'the same box');
  assert.equal(box.scrollTop, box.scrollHeight - 200, 'still at the bottom');
});

test('0548 AC3: a reader scrolled up keeps their place as new lines come in, even as the oldest drop out', async () => {
  const p = await poppedUp({ text: numbered(1, 200), truncated: false, build: 1, at: 0 }, layout);
  listOf(p).scrollTop = 500;
  const was = firstSeen(p);
  p.source().emit('log', JSON.stringify({ id: '0001', build: 1, at: 1, drop: 0, lines: ['09:00:01 line 201', '09:00:01 line 202'] }));
  assert.equal(shown(p).at(-1).endsWith('line 202'), true);
  assert.equal(firstSeen(p), was, 'the same line first in view');
  assert.equal(listOf(p).children[0].className, 'ln note', 'under the card\'s note that earlier lines aren\'t shown');
  p.source().emit('log', JSON.stringify({ id: '0001', build: 1, at: 2, drop: 0, lines: ['09:00:01 line 203'] }));
  assert.equal(firstSeen(p), was, 'and again, with the note on both');
  p.source().emit('log', JSON.stringify({ id: '0001', build: 1, at: 3, drop: 1, lines: ['09:00:01 line 203 and more', '09:00:02 line 204'] }));
  assert.equal(shown(p).at(-2), '09:00:01 line 203 and more', 'the last line written further');
  assert.equal(firstSeen(p), was, 'and once the last line is written further');
});

test('0548 AC3: a new build\'s log replaces the old one, scrolled to its newest line', async () => {
  const p = await poppedUp({ text: numbered(1, 100), truncated: false, build: 1, at: 0 }, layout);
  listOf(p).scrollTop = 300;
  p.source().emit('log', JSON.stringify({ id: '0001', build: 2, at: 0, reset: true, text: numbered(1, 30).replace(/line/g, 'new') }));
  assert.equal(shown(p).length, 30);
  assert.ok(shown(p).every(l => /new/.test(l)), 'only the new build\'s lines');
  assert.equal(listOf(p).scrollTop, listOf(p).scrollHeight - 200, 'at the bottom');
});

test('0548 AC3: before the log has loaded, and when it can\'t be loaded, it says so in the card\'s words', async () => {
  let answer;
  const slow = new Promise(r => { answer = r; });
  const p = await opened([building()], () => slow);
  p.press(logButton(p, '0001'));
  await p.settle();
  const said = () => p.all(pop(p)).find(n => /\brun-log\b/.test(n.className || '')).textContent;
  assert.equal(said(), 'Loading the log…');
  assert.equal(said(), cardLog(p, '0001').textContent);
  answer(new Error('down'));
  await p.settle();
  assert.equal(said(), "Couldn't load the log yet. Trying again in a few seconds…");
  assert.equal(said(), cardLog(p, '0001').textContent);
  const q = await poppedUp({ text: '', truncated: false, build: 1, at: 0 });
  assert.equal(q.all(pop(q)).find(n => /\brun-log\b/.test(n.className || '')).textContent, 'No log yet.');
});

// ---------- AC4: closing, focus and the page behind ----------

test('0548 AC4: Close, Escape and a click beside its column close it, with the focus back on the button that opened it', async () => {
  for (const how of ['Close', 'Escape', 'beside']) {
    const made = n => { n.getBoundingClientRect = () => (n.className === 'top' ? { left: 300, right: 1060, top: 0, bottom: 40 } : { left: 0, right: 0, top: 0, bottom: 0 }); };
    const p = await poppedUp(LOG, made);
    if (how === 'Close') p.press(p.all(pop(p)).find(n => n.className === 'close'));
    else if (how === 'Escape') p.key('Escape');
    else {
      const e = { target: pop(p), clientX: 100, stopPropagation() {}, preventDefault() {} };
      pop(p).listeners.pointerdown(e);
      pop(p).listeners.click(e);
    }
    await p.settle();
    assert.equal(pop(p).hidden, true, `${how}: shut`);
    assert.equal(p.focused(), logButton(p, '0001'), `${how}: the focus is back on Full log`);
  }
});

test('0548 AC4: while it\'s open the page behind is held, and it\'s let go once it closes', async () => {
  const p = await poppedUp();
  assert.equal(p.main.inert, true);
  assert.equal(p.focused(), pop(p), 'the focus is in the pop-up');
  p.key('Escape');
  await p.settle();
  assert.equal(p.main.inert, false);
});

test('0548 AC4: opening and closing it leaves the card open, and its log open on the stream', async () => {
  const p = await opened([building()], () => LOG);
  const before = p.calls2.length;
  p.press(logButton(p, '0001'));
  await p.settle();
  assert.match(rowOf(p).className, /\bopen\b/);
  p.key('Escape');
  await p.settle();
  assert.match(rowOf(p).className, /\bopen\b/, 'still open');
  assert.ok(!p.calls2.slice(before).some(u => /\/log(\/close)?$/.test(u)), 'the log is neither asked for again nor closed');
});
