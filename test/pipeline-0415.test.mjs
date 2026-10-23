// 0415: pressing speck's screen opens the Pipeline pop-up: what the Foreman's detail showed, as its Right now section,
// and speck run's output from run.log under it, as its Log section.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fakePage, page, T, PAGE, panelRepo, cliCopy, startPanel, stop, freePort, request, findChrome, browserPage } from './support/panel.mjs';
import { openStream } from './support/stream.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { runLogTail, runLogStamp, RUN_LOG_LINES } from '../scripts/run-log.mjs';

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const view = (o = {}, tickets = [], agent) => foremanView({ run: ON, record: rec(o), tickets, ...(agent ? { agent } : {}) });
const state = (foreman, o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman, ...o });
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };

// A page where each node can take the focus, and the page can be held, as the pop-up holds it.
function popPage(responses, globals = {}, made = () => {}) {
  let focused = null;
  const p = fakePage(responses, { scrollX: 0, scrollY: 0, scrollTo() {}, ...globals }, { made: n => { n.focus = () => { focused = n; }; made(n); } });
  for (const id of ['foreman', 'run']) { const n = p.byId(id); n.focus = () => { focused = n; }; made(n); }
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  return p;
}
const pop = p => p.byId('foreman');
const closeOf = p => p.all(pop(p)).find(n => n.tagName === 'button' && n.textContent === 'Close');
const tick = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
async function opened(responses, globals, made) {
  const p = popPage(responses, globals, made);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const sectionOf = (p, title) => p.all(pop(p)).find(n => /\bfm-(now|log)\b/.test(n.className || '') && n.children[0] && n.children[0].tagName === 'h3' && n.children[0].textContent === title);
const logLines = p => { const s = sectionOf(p, 'Log'); const ol = s && p.all(s).find(n => n.tagName === 'ol'); return ol ? ol.children.map(li => li.textContent) : null; };
const runLogCalls = p => p.calls.filter(c => c.url === '/api/run-log');

const BUSY = view({ building: ['0001'], ready: [{ id: '0004', kind: 'after', why: 'waiting for 0003' }] },
  [T('0001', 'ready'), T('0004', 'ready'), T('0006', 'blocked', { blocked_question: 'Which one?' })]);
const HEADS = ['Building', 'Ready, not building', 'Shipping', 'Blocked', 'Recommendations taken', 'Looked into'];

// ---------- AC1: a pop-up titled Pipeline, with the Foreman's detail as its Right now section ----------

test('0415 AC1: pressing the screen opens a pop-up titled Pipeline, not The Foreman, whose first section is Right now', async () => {
  const p = await opened([state(BUSY)]);
  assert.equal(pop(p).hidden, false, 'open');
  const title = p.all(pop(p)).find(n => /\btitle\b/.test(n.className || ''));
  assert.equal(title.textContent, 'Pipeline');
  assert.ok(!p.all(pop(p)).some(n => n.textContent === 'The Foreman'), 'the Foreman\'s detail is gone');
  assert.match(page().match(/<div class="foreman" id="foreman"[^>]*>/)[0], /aria-label="Pipeline"/);
  const now = sectionOf(p, 'Right now'), log = sectionOf(p, 'Log');
  assert.ok(now && log, 'a Right now and a Log section');
  const order = p.all(pop(p)).filter(n => n.tagName === 'h3').map(n => n.textContent);
  assert.deepEqual(order, ['Right now', 'Log'], 'Right now first, then Log');
});

test('0415 AC1: Right now shows the detail\'s sections and wording, in the same order', async () => {
  const p = await opened([state(BUSY)]);
  const now = sectionOf(p, 'Right now');
  assert.deepEqual(p.all(now).filter(n => n.tagName === 'h4').map(n => n.textContent), HEADS);
  const t = now.textContent;
  assert.match(t, /^Right nowFixing: tell\. [^]*?Building0001Ready, not building0004 waiting for 0003Shipping/);
  assert.match(t, /Blocked0006 Ticket 0006Which one\?Waiting for you\./);
  assert.match(t, /The Foreman hasn't had to look into anything\.$/);
});

test('0415 AC1: the Foreman\'s questions keep their Answer and Dismiss buttons in Right now', async () => {
  const agent = { running: null, asks: [{ id: '0001', question: 'Should it keep the old test?' }], did: [] };
  const f = { ...view({}, [T('0001', 'building')]), agent };
  const p = await opened([state(f, { tickets: [T('0001', 'building')] })]);
  const now = sectionOf(p, 'Right now');
  assert.match(now.textContent, /Should it keep the old test\?/);
  for (const b of ['Answer', 'Dismiss']) assert.ok(p.all(now).some(n => n.tagName === 'button' && n.textContent === b), `its ${b} button`);
});

test('0415 AC1: a stale page keeps its Reload page button, first in Right now', async () => {
  let reloaded = 0;
  const p = await opened([state(view({}), { page: 'newer' })], { location: { reload: () => { reloaded++; } } });
  const now = sectionOf(p, 'Right now'), reload = p.all(now).find(n => n.id === 'foreman-reload');
  assert.ok(reload, 'a Reload page button');
  assert.ok(within(reload, now.children[1]), 'straight under the heading');
  reload.listeners.click();
  assert.equal(reloaded, 1);
});

// ---------- AC2: the Log section, from run.log, newest first ----------

test('0415 AC2: the Log shows the lines /api/run-log gives, newest first as given, asked for once the pop-up opens', async () => {
  const p = popPage([state(BUSY, { run_log: '10:1' }), { lines: ['third', 'second', 'first'], stamp: '10:1' }]);
  await p.settle();
  assert.equal(runLogCalls(p).length, 0, 'not asked for while the pop-up is shut');
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(runLogCalls(p).length, 1, 'asked for once it opens');
  assert.deepEqual(logLines(p), ['third', 'second', 'first']);
});

test('0415 AC2: with no run.log the Log says speck run hasn\'t written anything yet, without asking the server', async () => {
  const p = await opened([state(BUSY)]);
  assert.equal(sectionOf(p, 'Log').textContent, 'Logspeck run hasn\'t written anything yet.');
  assert.equal(runLogCalls(p).length, 0);
});

test('0415 AC2: lines written while the pop-up is open appear with the next board, and an unchanged log isn\'t asked for again', async () => {
  const p = await opened([state(BUSY, { run_log: '10:1' }), { lines: ['first'], stamp: '10:1' },
    state(BUSY, { run_log: '10:1' }),
    state(BUSY, { run_log: '20:2' }), { lines: ['second', 'first'], stamp: '20:2' }]);
  assert.deepEqual(logLines(p), ['first']);
  await tick(p);
  assert.equal(runLogCalls(p).length, 1, 'the same run_log: not asked for again');
  await tick(p);
  assert.equal(runLogCalls(p).length, 2, 'a new run_log: asked for again');
  assert.deepEqual(logLines(p), ['second', 'first']);
});

test('0415 AC2: a reader scrolled down the log stays where they are as new lines come in above them', async () => {
  const LINE = 20;
  let box = null;
  const made = n => { n.getBoundingClientRect = () => ({ top: n.className === 'run-log' ? -400 : 0, bottom: n.className === 'top' ? 40 : 0, left: 0, right: 0 }); };
  const p = await opened([state(BUSY, { run_log: '1' }), { lines: ['c', 'b', 'a'], stamp: '1' },
    state(BUSY, { run_log: '2' }), { lines: ['f', 'e', 'd', 'c', 'b', 'a'], stamp: '2' }], {}, made);
  box = pop(p);
  Object.defineProperty(box, 'scrollHeight', { configurable: true, get: () => 1000 + LINE * (logLines(p) || []).length });
  box.scrollTop = 500;
  await tick(p);
  assert.deepEqual(logLines(p), ['f', 'e', 'd', 'c', 'b', 'a']);
  assert.equal(box.scrollTop, 500 + 3 * LINE, 'moved down by the lines added above, so what they read stays put');
});

test('0415 AC2: a reader at the top of the pop-up sees the new lines', async () => {
  const made = n => { n.getBoundingClientRect = () => ({ top: n.className === 'run-log' ? 300 : 0, bottom: n.className === 'top' ? 40 : 0, left: 0, right: 0 }); };
  const p = await opened([state(BUSY, { run_log: '1' }), { lines: ['a'], stamp: '1' }, state(BUSY, { run_log: '2' }), { lines: ['b', 'a'], stamp: '2' }], {}, made);
  Object.defineProperty(pop(p), 'scrollHeight', { configurable: true, get: () => 1000 + 20 * (logLines(p) || []).length });
  pop(p).scrollTop = 0;
  await tick(p);
  assert.equal(pop(p).scrollTop, 0);
});

test('0415 AC2: a request for the log that fails isn\'t sent again at once, and the next board asks again', async () => {
  const p = await opened([state(BUSY, { run_log: '1' }), { status: 500, body: { error: 'no' } }, state(BUSY, { run_log: '1' }), { lines: ['a'], stamp: '1' }]);
  await p.settle();
  assert.equal(runLogCalls(p).length, 1, 'asked once');
  assert.equal(logLines(p), null, 'nothing to show yet');
  await tick(p);
  assert.equal(runLogCalls(p).length, 2, 'asked again with the next board');
  assert.deepEqual(logLines(p), ['a']);
});

const runsDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'speck-runlog-'));

test('0415 AC2: the server gives the latest 200 lines of run.log, newest first, without blank lines at the end', () => {
  const runs = runsDir();
  assert.deepEqual(runLogTail(runs), { lines: null, stamp: null }, 'no run.log');
  assert.equal(runLogStamp(runs), null);
  fs.writeFileSync(path.join(runs, 'run.log'), `${Array.from({ length: 250 }, (_, i) => `line ${i + 1}`).join('\n')}\n\n`);
  const out = runLogTail(runs);
  assert.equal(RUN_LOG_LINES, 200);
  assert.equal(out.lines.length, 200);
  assert.equal(out.lines[0], 'line 250');
  assert.equal(out.lines[199], 'line 51');
  assert.equal(out.stamp, runLogStamp(runs));
  const was = out.stamp;
  fs.appendFileSync(path.join(runs, 'run.log'), 'line 251\n');
  assert.notEqual(runLogStamp(runs), was, 'a write changes the stamp');
  assert.equal(runLogTail(runs).lines[0], 'line 251');
});

test('0415 AC2: an empty run.log has no lines, and a long one is read from its end only', () => {
  const runs = runsDir(), file = path.join(runs, 'run.log');
  fs.writeFileSync(file, '');
  assert.deepEqual(runLogTail(runs).lines, []);
  fs.writeFileSync(file, `${'x'.repeat(400 * 1024)}\nlast\n`);
  assert.deepEqual(runLogTail(runs).lines, ['last'], 'a piece of a line cut off at the start of what was read isn\'t shown');
});

// ---------- AC3: Close, Escape and a click outside close it, with the focus back on the screen ----------

test('0415 AC3: Close, Escape and a click beside its column close the pop-up, and the focus goes back to the screen', async () => {
  for (const how of ['Close', 'Escape', 'beside']) {
    const made = n => { n.getBoundingClientRect = () => (n.className === 'top' ? { left: 300, right: 1060, top: 0, bottom: 40 } : { left: 0, right: 0, top: 0, bottom: 0 }); };
    const p = await opened([state(BUSY)], {}, made);
    if (how === 'Close') p.press(closeOf(p));
    else if (how === 'Escape') p.key('Escape');
    else {
      const e = { target: pop(p), clientX: 100, stopPropagation() {}, preventDefault() {} };
      pop(p).listeners.pointerdown(e);
      pop(p).listeners.click(e);
    }
    assert.equal(pop(p).hidden, true, `${how}: shut`);
    assert.equal(p.focused(), p.byId('run'), `${how}: the focus is back on the screen`);
  }
});

test('0415 AC3: a click in its column, or one ending beside it after starting in it, leaves it open', async () => {
  const made = n => { n.getBoundingClientRect = () => (n.className === 'top' ? { left: 300, right: 1060, top: 0, bottom: 40 } : { left: 0, right: 0, top: 0, bottom: 0 }); };
  const p = await opened([state(BUSY)], {}, made);
  const inCol = { target: pop(p), clientX: 500, stopPropagation() {}, preventDefault() {} };
  pop(p).listeners.pointerdown(inCol);
  pop(p).listeners.click(inCol);
  assert.equal(pop(p).hidden, false, 'a click in the column');
  const now = sectionOf(p, 'Right now');
  pop(p).listeners.pointerdown({ target: now, clientX: 500 });
  pop(p).listeners.click({ target: pop(p), clientX: 100 });
  assert.equal(pop(p).hidden, false, 'a drag from the column ending beside it');
});

// ---------- AC4: only run.log is read ----------

test('0415 AC4: a run.log that is a link, or a folder, is read as no log, so nothing else can be read through it', () => {
  const runs = runsDir(), secret = path.join(runsDir(), 'secret.txt');
  fs.writeFileSync(secret, 'a secret\n');
  fs.symlinkSync(secret, path.join(runs, 'run.log'));
  assert.deepEqual(runLogTail(runs), { lines: null, stamp: null });
  assert.equal(runLogStamp(runs), null);
  const other = runsDir();
  fs.mkdirSync(path.join(other, 'run.log'));
  assert.deepEqual(runLogTail(other), { lines: null, stamp: null });
});

test('0415 AC2 and AC4: the real panel serves run.log at /api/run-log whatever the request adds, and tells an open page of each write within its 2-second refresh', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, 'run.log'), 'speck run: watching\n');
  fs.writeFileSync(path.join(dir, 'speck', 'secret.txt'), 'not the log\n');
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    for (const pathName of ['/api/run-log', '/api/run-log?file=../../secret.txt', '/api/run-log?path=/etc/passwd']) {
      const r = await request(p.port, { pathName });
      assert.equal(r.status, 200, pathName);
      assert.deepEqual(JSON.parse(r.body).lines, ['speck run: watching'], pathName);
    }
    for (const pathName of ['/api/run-log/../../secret.txt', '/api/run-log%2F..%2F..%2Fsecret.txt', '/api/run-log/secret.txt']) {
      const r = await request(p.port, { pathName });
      assert.equal(r.status, 404, pathName);
      assert.doesNotMatch(r.body, /not the log/, pathName);
    }
    const s = openStream(p.port);
    try {
      const first = await s.until(e => e.event === 'message', 5000, 0, 'the first board');
      const was = JSON.parse((await request(p.port, { pathName: '/api/state' })).body).run_log;
      assert.ok(was, 'the board carries run_log');
      const from = s.events.length, at = Date.now();
      fs.appendFileSync(path.join(runs, 'run.log'), 'speck run: started 0001\n');
      await s.until(e => e.event === 'message' && e.data !== first.data, 4000, from, 'a new board after the write');
      assert.ok(Date.now() - at < 3500, `told within the 2-second refresh (${Date.now() - at} ms)`);
      assert.notEqual(JSON.parse((await request(p.port, { pathName: '/api/state' })).body).run_log, was);
      assert.deepEqual(JSON.parse((await request(p.port, { pathName: '/api/run-log' })).body).lines, ['speck run: started 0001', 'speck run: watching']);
    } finally { s.close(); }
  } finally { await stop(p); }
});

// ---------- AC5: at 320 px wide, it fits without scrolling sideways, and long lines wrap ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// A source of the panel's events for the page in the browser, telling it of one board at once.
const FAKE = (board, log) => `(() => {
  const board = ${JSON.stringify(board)}, log = ${JSON.stringify(log)};
  window.fetch = async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? log : String(url).startsWith('/api/state') ? board : {}) });
  window.EventSource = class { constructor() { this.l = {}; this.readyState = 1; setTimeout(() => this.l.message && this.l.message({ data: '1' }), 10); } addEventListener(t, f) { this.l[t] = f; } close() {} };
})();`;

test('0415 AC5: in a real browser at 320 px wide, the open pop-up doesn\'t scroll sideways and a long log line wraps', chrome, async () => {
  const long = `speck run: ${'a-very-long-unbroken-path/'.repeat(12)}and some words after it that go on well past the edge of a phone`;
  const board = state(BUSY, { run_log: '1' });
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE(board, { lines: [long, 'speck run: watching'], stamp: '1' }) });
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    const url = pathToFileURL(PAGE).href;
    await b.send('Page.navigate', { url });
    await b.until(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`, 'the page');
    await b.until(`!!document.getElementById('run') && document.getElementById('run').getAttribute('aria-label') !== null`, 'the board');
    await b.js(`document.getElementById('run').click(), true`);
    await b.until(`!!document.querySelector('#foreman ol.run-log li')`, 'the log in the pop-up');
    for (const look of ['light', 'dark']) {
      const at = await b.js(`(() => {
        document.documentElement.dataset.theme = ${JSON.stringify(look)};
        const v = document.getElementById('foreman'), li = v.querySelector('ol.run-log li'), h = parseFloat(getComputedStyle(li).lineHeight) || 16;
        return { popWide: v.scrollWidth - v.clientWidth, pageWide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          right: li.getBoundingClientRect().right, width: innerWidth, rows: li.getBoundingClientRect().height / h };
      })()`);
      assert.ok(at.popWide <= 0, `${look}: the pop-up doesn't scroll sideways (${at.popWide} px over)`);
      assert.ok(at.pageWide <= 0, `${look}: the page doesn't scroll sideways (${at.pageWide} px over)`);
      assert.ok(at.right <= at.width, `${look}: the long line ends inside the screen`);
      assert.ok(at.rows > 2, `${look}: the long line wraps (${at.rows.toFixed(1)} rows)`);
    }
  } finally { await b.close(); }
});
