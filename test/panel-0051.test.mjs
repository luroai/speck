import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { T, panelRepo, freePort, startPanel, stop, request, post, fakePage, page, model, queueRows, click, exitOf, findChrome, browserPage, charAt, styles, pageScript } from './support/panel.mjs';

// ---------- 0051: expand a queue ticket to read its build log ----------

const logPath = id => `/api/tickets/${id}/log`;
const writeLog = (dir, id, text) => {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, `${id}.log`), text);
};
const getLog = async (port, id) => {
  const res = await request(port, { pathName: logPath(id) });
  assert.equal(res.status, 200, res.body);
  assert.match(res.headers['content-type'], /application\/json/);
  return JSON.parse(res.body);
};
const lines = n => Array.from({ length: n }, (_, i) => `line ${i + 1}`);

test('0051 AC1: /api/tickets/<id>/log gives the last 200 lines, read afresh, with trailing blank lines dropped', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  try {
    assert.deepEqual(await getLog(port, '0001'), { text: '', truncated: false }, 'no log yet');
    assert.deepEqual(await getLog(port, '0042'), { text: '', truncated: false }, 'a ticket with no log, even one that does not exist');
    writeLog(r.dir, '0001', `${lines(250).join('\n')}\n\n  \n\n`);
    const long = await getLog(port, '0001');
    assert.equal(long.truncated, true);
    assert.equal(long.text, lines(250).slice(-200).join('\n'));
    writeLog(r.dir, '0001', `${lines(200).join('\n')}\n\n\n`);
    assert.deepEqual(await getLog(port, '0001'), { text: lines(200).join('\n'), truncated: false }, 'exactly 200 lines, read afresh');
    writeLog(r.dir, '0001', 'one\n\n\ntwo\n');
    assert.deepEqual(await getLog(port, '0001'), { text: 'one\n\n\ntwo', truncated: false }, 'blank lines inside are kept');
    writeLog(r.dir, '0001', '');
    assert.deepEqual(await getLog(port, '0001'), { text: '', truncated: false }, 'an empty log');
    writeLog(r.dir, '0002', 'two\n');
    assert.deepEqual(await getLog(port, '2'), { text: 'two', truncated: false }, 'an unpadded id finds the padded log');
  } finally { await stop(p); }
});

test('0051 AC1: the log comes from the main checkout, even when the panel runs in a worktree', async () => {
  const r = panelRepo({ worktrees: 'true' });
  const started = r.run('start', '1');
  assert.equal(started.status, 0, started.stderr);
  const wt = started.stdout.trim().split('\n').pop();
  assert.ok(fs.existsSync(wt), wt);
  writeLog(r.dir, '0001', 'from the main checkout\n');
  writeLog(wt, '0001', 'from the worktree\n');
  const p = await startPanel(wt, ['--port', String(await freePort())]);
  const { port } = p;
  try {
    assert.deepEqual(await getLog(port, '0001'), { text: 'from the main checkout', truncated: false });
  } finally { await stop(p); }
});

test('0051 AC1: the other request rules still apply to the log path', async () => {
  const r = panelRepo();
  writeLog(r.dir, '0001', 'secret\n');
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  try {
    for (const host of ['evil.example', `evil.example:${port}`, `127.0.0.1:${port + 1}`])
      assert.equal((await request(port, { host, pathName: logPath('0001') })).status, 403, host);
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'])
      assert.equal((await request(port, { method, pathName: logPath('0001') })).status, 405, method);
    const withToken = await post(port, logPath('0001'), { token: 'x' });
    assert.equal(withToken.status, 405, 'a POST is refused like any other non-GET');
    for (const pathName of ['/api/tickets/abc/log', '/api/tickets/00001/log', '/api/tickets/0001/log/x', '/api/tickets//log', '/api/tickets/0001/logs', '/api/tickets/..%2F..%2Fx/log'])
      assert.equal((await request(port, { pathName })).status, 404, pathName);
    assert.equal((await request(port, { pathName: `${logPath('0001')}?x=1` })).status, 200, 'a query string is ignored');
  } finally { await stop(p); }
});

// ---------- the page ----------

// A fake page whose fetch answers /api/state with each state in turn (the last one again once they run out) and
// /api/tickets/<id>/log from `logs`, a map from id to the answer or to an Error for a request that fails.
function logPage(states, logs = {}) {
  const calls = [];
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
  const p = fakePage([], { fetch });
  p.logCalls = () => calls.filter(u => /\/log$/.test(u));
  return p;
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const logOf = (p, row) => p.all(row).find(n => /(^| )log( |$)/.test(n.className || ''));
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const isOpen = row => /(^| )open( |$)/.test(row.className);
const state = () => ({
  tickets: [
    T('0001', 'building', { started: new Date().toISOString() }),
    T('0002', 'reviewing'),
    T('0003', 'ready'),
    T('0004', 'blocked', { blocked_question: 'Which?' }),
  ],
  ideas: [],
});

test('0051 AC2: clicking a queue ticket\'s top row opens it, and again closes it; several can be open', async () => {
  const p = logPage([state()], { '0001': { text: 'built', truncated: false }, '0003': { text: 'queued log', truncated: false } });
  await p.settle();
  assert.ok(!isOpen(rowOf(p, '0001')) && !logOf(p, rowOf(p, '0001')), 'closed at first');
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(isOpen(rowOf(p, '0001')), 'open after a click');
  assert.ok(logOf(p, rowOf(p, '0001')), 'with its log');
  click(topOf(rowOf(p, '0003')));
  await p.settle();
  assert.ok(isOpen(rowOf(p, '0001')) && isOpen(rowOf(p, '0003')), 'two open at once, a ready one too');
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(!isOpen(rowOf(p, '0001')) && !logOf(p, rowOf(p, '0001')), 'closed again');
  assert.ok(isOpen(rowOf(p, '0003')), 'the other stays open');
});

test('0051 AC2: only the top row opens and closes it: clicking inside the open ticket leaves it open', async () => {
  const p = logPage([state()], { '0004': { text: 'log text', truncated: false } });
  await p.settle();
  click(topOf(rowOf(p, '0004')));
  await p.settle();
  const row = rowOf(p, '0004');
  assert.ok(isOpen(row));
  // Nothing else in the row reacts to a click (a click there, or a drag to select text, can't close it).
  // Its Full ticket button (0063) opens the side pane, and the click goes no further, so the ticket stays open.
  // Since 0165 a tag shows its tip, and its click goes no further either.
  const isTag = n => (n.className || '').split(' ').includes('tag');
  for (const n of p.all(row)) if (n !== topOf(row) && n.className !== 'full-open' && !isTag(n) && n.listeners && n.listeners.click) assert.fail(`${n.className} reacts to a click`);
  for (const n of p.all(row).filter(isTag)) {
    let goes = true;
    n.listeners.click({ stopPropagation() { goes = false; } });
    assert.ok(!goes, `the ${n.textContent} tag's click goes no further`);
  }
  const full = p.all(row).find(n => n.className === 'full-open');
  let stopped = false;
  full.listeners.click({ stopPropagation() { stopped = true; } });
  assert.ok(stopped && isOpen(rowOf(p, '0004')), 'Full ticket goes no further and leaves it open');
  assert.ok(isOpen(rowOf(p, '0004')));
});

test('0051 AC2: a click that ends selecting text in the top row neither opens nor closes it', async () => {
  let collapsed = false;
  const fetch = async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'x', truncated: false } : state()) });
  const p = fakePage([], { fetch, getSelection: () => ({ isCollapsed: collapsed }) });
  await p.settle();
  collapsed = false;
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(!isOpen(rowOf(p, '0001')), 'text selected: still closed');
  collapsed = true;
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(isOpen(rowOf(p, '0001')), 'a plain click opens it');
  collapsed = false;
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(isOpen(rowOf(p, '0001')), 'text selected: still open');
});

test('0051 AC3: the log shows as text with ANSI escapes removed, blank runs as one, a truncation line, or "No log yet."', async () => {
  const p = logPage([state()], {
    '0001': { text: '\x1b[1mbold\x1b[0m start\r\n\n\n\n\x1b[32mgreen\x1b[39m\x1b]0;title\x07\n  \nend\x1b[2K', truncated: true },
    '0002': { text: '', truncated: false },
  });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  click(topOf(rowOf(p, '0002')));
  await p.settle();
  const log = logOf(p, rowOf(p, '0001'));
  assert.equal(log.tagName, 'pre', 'a monospace block');
  const text = log.textContent;
  assert.ok(!text.includes('\x1b'), 'no escape characters');
  assert.ok(!/\[\d*m/.test(text), 'no leftover codes');
  assert.match(text, /^Earlier lines aren't shown/, 'truncated: a line saying so first');
  assert.equal(text.split('\n').slice(1).join('\n'), 'bold start\n\ngreen\n\nend', 'each run of blank lines shows as one');
  assert.equal(logOf(p, rowOf(p, '0002')).textContent, 'No log yet.');
  const css = styles();
  const rule = css.match(/\.log\s*\{([^}]*)\}/);
  assert.ok(rule, 'a .log rule');
  assert.match(rule[1], /max-height:/);
  assert.match(rule[1], /overflow(-y)?:\s*auto/);
  assert.match(rule[1], /monospace/);
});

test('0051 AC3: the formatting on its own', () => {
  const logText = vm.runInNewContext(`${model()}\nlogText`, {}); // 0431: from the model's own file
  assert.equal(logText({ text: '', truncated: false }), 'No log yet.');
  assert.equal(logText({ text: '\x1b[0m\n\n', truncated: false }), 'No log yet.', 'nothing left once the codes are gone');
  assert.equal(logText(null), 'No log yet.');
  assert.equal(logText({ text: 'a\n\n\n\nb', truncated: false }), 'a\n\nb');
  assert.equal(logText({ text: '\x1b[38;5;196mred\x1b[0m', truncated: false }), 'red');
  // Review round 1, F1: every kind of escape is consumed whole, leaving nothing visible.
  assert.equal(logText({ text: '\x1b(Bnormal', truncated: false }), 'normal', 'a character set designation');
  assert.equal(logText({ text: '\x1b)0\x1b#8\x1b%Ga', truncated: false }), 'a', 'others with intermediate bytes');
  assert.equal(logText({ text: '\x1b7\x1b8\x1b=\x1b>\x1bMb\x1bc', truncated: false }), 'b', 'two-byte escapes');
  assert.equal(logText({ text: '\x1bPq#0;2;0;0;0\x1b\\c\x1b_app\x1b\\\x1b]8;;http://x\x1b\\d\x1b]8;;\x07', truncated: false }), 'cd', 'strings, ended by ST or BEL');
  assert.equal(logText({ text: '\x1b[?25l\x1b[?2004he\x9b31mf\x1b', truncated: false }), 'ef', 'private modes, 8-bit CSI and a lone ESC');
  assert.match(logText({ text: 'a', truncated: true }), /^Earlier lines aren't shown.*\na$/);
});

test('0051 AC4: the log is shown as text, never as HTML', async () => {
  const evil = '<img src=x onerror="alert(1)"><b>bold</b>';
  const p = logPage([state()], { '0001': { text: evil, truncated: false } });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  const log = logOf(p, rowOf(p, '0001'));
  assert.equal(log.textContent, evil);
  assert.ok(!p.all(rowOf(p, '0001')).some(n => n.tagName === 'img' || n.tagName === 'b' && n._text === 'bold'), 'no element made from the log');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(pageScript()));
});

test('0051 AC5: no log is asked for while no queue ticket is open, and only open ones are asked for', async () => {
  const p = logPage([state()], { '0001': { text: 'one', truncated: false } });
  await p.settle();
  await refresh(p);
  await refresh(p);
  assert.deepEqual(p.logCalls(), [], 'nothing open: no log request');
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  assert.deepEqual(p.logCalls(), ['/api/tickets/0001/log']);
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  await refresh(p);
  assert.deepEqual(p.logCalls(), ['/api/tickets/0001/log'], 'closed: no more');
});

test('0051 AC5: what\'s open and the log box survive the refresh while the ticket is unchanged', async () => {
  const s = state();
  const next = JSON.parse(JSON.stringify(s));
  next.tickets[1].rounds = [{ round: 1, reviewer: 'codex', verdict: 'revise', seconds: 1, tokens: 5 }]; // another ticket changes
  const third = JSON.parse(JSON.stringify(next));
  third.tickets[0].title = 'Renamed'; // this ticket changes
  const p = logPage([s, next, third], { '0001': { text: 'a long log', truncated: false } });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  const box = logOf(p, rowOf(p, '0001'));
  const detached = box.detached || 0, row = rowOf(p, '0001');
  box.scrollTop = 120; // a scroll position, kept by the node itself
  await refresh(p);
  assert.equal(rowOf(p, '0001'), row, 'the row stayed on the page');
  assert.equal(logOf(p, row), box, 'the same log box, so its scroll position stays');
  assert.equal(box.detached || 0, detached, 'never taken out');
  assert.equal(box.scrollTop, 120);
  await refresh(p);
  assert.ok(isOpen(rowOf(p, '0001')), 'still open after its own data changes');
  assert.equal(logOf(p, rowOf(p, '0001')).textContent, 'a long log', 'with its log');
});

test('0051: a log request that fails leaves the last log on screen', async () => {
  let fail = false;
  const p = logPage([state()], { '0001': () => (fail ? new Error('down') : { text: 'first', truncated: false }) });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  fail = true;
  click(topOf(rowOf(p, '0001'))); // close
  click(topOf(rowOf(p, '0001'))); // and open again: this request fails
  await p.settle();
  assert.equal(logOf(p, rowOf(p, '0001')).textContent, 'first');
});

test('0051: the build-exit message box is unchanged by opening a red ticket', async () => {
  const s = state();
  s.tickets[0] = T('0001', 'building', exitOf('the last 50 lines'));
  const p = logPage([s], { '0001': { text: 'full log', truncated: false } });
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  const row = rowOf(p, '0001');
  assert.ok(p.all(row).some(n => /\bexit\b/.test(n.className || '') && n._text === 'the last 50 lines'));
  assert.equal(logOf(p, row).textContent, 'full log');
});

// ---------- in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const refreshed = async (b, what) => { await b.js(`window.seen = window.drawn || 0; if (!window.drawWatch) (window.drawWatch = new MutationObserver(() => { window.drawn = (window.drawn || 0) + 1; })).observe(document.getElementById('bezel'), { attributes: true }); true`); await b.until(`(window.drawn || 0) > window.seen`, what); }; // 0413: each redraw sets the frame of speck's screen, which stays between them
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;

test('0051 AC2-AC5: in a real browser, a click opens the log, its scroll position survives refreshes, and selecting the title opens nothing', chrome, async () => {
  const r = panelRepo();
  writeLog(r.dir, '0001', `\x1b[1m${lines(300).join('\n')}\x1b[0m\n`);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`${row('0001')}`, 'the queue');
    // Selecting the title doesn't open it.
    await b.drag(await b.js(charAt(`#queue .q .title`, 0)), await b.js(charAt(`#queue .q .title`, 5)));
    assert.equal(await b.js('getSelection().toString()'), 'Expor');
    assert.equal(await b.js(`!!${row('0001')}.querySelector('.log')`), false, 'still closed');
    await b.js(`getSelection().removeAllRanges(); ${row('0001')}.querySelector('.top').click()`);
    await b.until(`(${row('0001')}.querySelector('.log') || {}).textContent?.includes('line 300')`, 'the log');
    const box = `${row('0001')}.querySelector('.log')`;
    assert.match(await b.js(`${box}.textContent`), /^Earlier lines aren't shown/);
    assert.ok(!(await b.js(`${box}.textContent`)).includes('\x1b'));
    assert.match(await b.js(`getComputedStyle(${box}).fontFamily`), /mono/i);
    assert.ok(await b.js(`${box}.scrollHeight > ${box}.clientHeight`), 'a fixed height, with its own scrollbar');
    await b.js(`${box}.scrollTop = 150`);
    await refreshed(b, 'a refresh'); await refreshed(b, 'a second refresh');
    assert.equal(await b.js(`${box}.scrollTop`), 150, 'the scroll position stays');
    await b.js(`${box}.click()`);
    assert.equal(await b.js(`!!${box}`), true, 'a click in the log leaves it open');
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    assert.equal(await b.js(`!!${box}`), false, 'the top row closes it');
  } finally {
    await b.close();
    await stop(panel);
  }
});
