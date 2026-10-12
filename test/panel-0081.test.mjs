import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { ROOT, T, page, findChrome, browserPage } from './support/panel.mjs';
import { commitBySubject } from './support/commits.mjs';

// ---------- 0081: a build's pause or play icon sits vertically centred on its collapsed queue row ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const started = () => new Date(Date.now() - 60000).toISOString();
const board = () => ({
  tickets: [
    T('0001', 'building', { build_running: true, paused: false, started: started() }),
    T('0002', 'reviewing', { build_running: true, paused: true, started: started() }),
    T('0003', 'building', { build_running: false, paused: false, started: started() }), // built by hand: no icon
    T('0004', 'ready'),
  ],
  ideas: [],
});

// Serves `html` as the panel, a fixed board as /api/state, and records each pause or play it is sent.
// With `refuse`, it refuses each one, with a reason long enough to take more than one line.
function stub(html, { refuse = false } = {}) {
  const sent = [];
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && refuse) { sent.push(req.url); res.writeHead(409, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: `Refused. ${'This build could not be changed. '.repeat(40)}` })); }
    if (req.method === 'POST') { sent.push(req.url); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    if (req.url === '/api/state') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(board())); }
    if (/\/log$/.test(req.url)) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"text":"","truncated":false}'); }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, sent, close: () => new Promise(r => server.close(r)) })));
}

// Opens `html` in the browser and waits for the queue. Returns the browser and its server.
async function open(html = page(), opts) {
  const s = await stub(html, opts);
  const b = await browserPage(`http://127.0.0.1:${s.port}/`);
  await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the queue');
  return { b, s, close: async () => { await b.close(); await s.close(); } };
}

// Where each part of a ticket's row is, in px from the row's top and left edge.
const layout = id => `(() => {
  const q = [...document.querySelectorAll('#queue .q')].find(r => [...r.querySelectorAll('.id')].some(n => n.textContent === ${JSON.stringify(id)}));
  const r = q.getBoundingClientRect();
  const at = n => { if (!n) return null; const b = n.getBoundingClientRect(); return { top: b.top - r.top, bottom: b.bottom - r.top, left: b.left - r.left, right: b.right - r.left, width: b.width, height: b.height }; };
  const icon = q.querySelector('.toggle-build');
  return { open: q.classList.contains('open'), top: at(q.querySelector('.top')), stages: at(q.querySelector('.stages')), icon: at(icon),
    id: at(q.querySelector('.id')), title: at(q.querySelector('.top .title')), tags: [...q.querySelectorAll('.top .tag')].map(at), sub: at(q.querySelector('.top .sub')),
    hit: icon ? (() => { const b = icon.getBoundingClientRect(); return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === icon; })() : null };
})()`;
const centre = l => (l.icon.top + l.icon.bottom) / 2;
const middle = l => (l.top.top + l.stages.bottom) / 2;
const clickAt = async (b, sel) => {
  const [x, y] = await b.js(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); n.scrollIntoView({ block: 'center' }); const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
};
const rowSel = id => `#queue .q:nth-child(${['0001', '0002', '0003', '0004'].indexOf(id) + 1})`;

test('0081 AC1: a running build\'s pause icon is centred between the top of the title line and the bottom of the stage labels', chrome, async () => {
  const w = await open();
  try {
    const l = await w.b.js(layout('0001'));
    assert.equal(l.open, false);
    assert.ok(Math.abs(centre(l) - middle(l)) <= 1, `icon centre ${centre(l)}px, row middle ${middle(l)}px`);
  } finally { await w.close(); }
});

test('0081 AC2: a paused build\'s play icon is centred the same way', chrome, async () => {
  const w = await open();
  try {
    const l = await w.b.js(layout('0002'));
    assert.match(await w.b.js(`document.querySelector('${rowSel('0002')} .toggle-build').className`), /\bplay\b/);
    assert.ok(Math.abs(centre(l) - middle(l)) <= 1, `icon centre ${centre(l)}px, row middle ${middle(l)}px`);
  } finally { await w.close(); }
});

test('0081 AC3: opening the row leaves the icon where it was when the row was collapsed', chrome, async () => {
  const w = await open();
  try {
    for (const id of ['0001', '0002']) {
      const shut = await w.b.js(layout(id));
      await clickAt(w.b, `${rowSel(id)} .top .title`);
      await w.b.until(`document.querySelector('${rowSel(id)}').classList.contains('open')`, `${id} to open`);
      const opened = await w.b.js(layout(id));
      assert.ok(opened.icon, 'the open row has its icon');
      assert.ok(Math.abs(opened.icon.top - shut.icon.top) <= 1, `${id}: icon top ${opened.icon.top}px open, ${shut.icon.top}px collapsed`);
      assert.ok(Math.abs(centre(opened) - middle(opened)) <= 1, `${id}: still centred on the title line and stages, not the open row`);
    }
  } finally { await w.close(); }
});

test('0081 AC4: clicking the icon pauses or plays the build without opening the row, and it is at least 16 × 14px', chrome, async () => {
  const w = await open();
  try {
    for (const [id, what] of [['0001', 'pause'], ['0002', 'play']]) {
      const l = await w.b.js(layout(id));
      assert.ok(l.icon.width >= 16 && l.icon.height >= 14, `${id}: ${l.icon.width} × ${l.icon.height}px`);
      assert.equal(l.hit, true, `${id}: the icon is what a click on its centre lands on`);
      await clickAt(w.b, `${rowSel(id)} .toggle-build`);
      for (let i = 0; i < 50 && !w.s.sent.includes(`/api/tickets/${id}/${what}`); i++) await new Promise(r => setTimeout(r, 100));
      assert.ok(w.s.sent.includes(`/api/tickets/${id}/${what}`), `${id}: ${what} sent (${w.s.sent})`);
      assert.equal((await w.b.js(layout(id))).open, false, `${id}: the row stays collapsed`);
    }
    // An open row stays open.
    await clickAt(w.b, `${rowSel('0001')} .top .title`);
    await w.b.until(`document.querySelector('${rowSel('0001')}').classList.contains('open')`, 'the row to open');
    const n = w.s.sent.length;
    await clickAt(w.b, `${rowSel('0001')} .toggle-build`);
    for (let i = 0; i < 50 && w.s.sent.length === n; i++) await new Promise(r => setTimeout(r, 100));
    assert.equal(w.s.sent.length, n + 1);
    assert.equal((await w.b.js(layout('0001'))).open, true, 'the open row stays open');
  } finally { await w.close(); }
});

test('0081 AC1, AC2, AC3: a refused pause or play leaves the icon centred, collapsed and open', chrome, async () => {
  const w = await open(page(), { refuse: true });
  try {
    for (const id of ['0001', '0002']) {
      await clickAt(w.b, `${rowSel(id)} .toggle-build`);
      await w.b.until(`document.querySelector('${rowSel(id)} .toggle-refused')`, `${id}'s refusal`);
      assert.ok(await w.b.js(`document.querySelector('${rowSel(id)} .toggle-refused').getBoundingClientRect().height > 40`), 'the reason takes more than one line');
      const shut = await w.b.js(layout(id));
      assert.equal(shut.open, false);
      assert.ok(Math.abs(centre(shut) - middle(shut)) <= 1, `${id}: icon centre ${centre(shut)}px, row middle ${middle(shut)}px`);
      await clickAt(w.b, `${rowSel(id)} .top .title`);
      await w.b.until(`document.querySelector('${rowSel(id)}').classList.contains('open')`, `${id} to open`);
      const opened = await w.b.js(layout(id));
      assert.ok(Math.abs(opened.icon.top - shut.icon.top) <= 1, `${id}: icon top ${opened.icon.top}px open, ${shut.icon.top}px collapsed`);
    }
  } finally { await w.close(); }
});

// The panel as it was before this ticket, to check rows without the icon against. It gets today's stylesheet with this
// ticket's icon rules put back as they were, so a later restyle (0134) moves both alike and only this ticket's change
// to the rows is compared.
const ICON_RULES = /  \/\* A running build's pause icon[\s\S]*?\n  \.q \.toggle-build \{[^\n]*\n/;
const before = () => {
  const ready = commitBySubject('speck(0081): ready');
  if (!ready) return null;
  const r = spawnSync('git', ['show', `${ready}:templates/panel.html`], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) return null;
  const was = (r.stdout.match(ICON_RULES) || [])[0], style = (page().match(/<style>[\s\S]*?<\/style>/) || [])[0];
  assert.ok(was && style && ICON_RULES.test(style), 'the icon rules are found in both pages');
  return r.stdout.replace(/<style>[\s\S]*?<\/style>/, () => style.replace(ICON_RULES, () => was));
};
const parts = l => ({ top: l.top, stages: l.stages, id: l.id, title: l.title, tags: l.tags, sub: l.sub });

test('0081 AC5: rows without the icon have their title, tags, counter and progress bar where they were', { skip: chrome.skip || (before() ? false : 'the pre-0081 panel is not in this clone') }, async () => {
  const was = await open(before()), now = await open();
  try {
    for (const id of ['0003', '0004']) {
      const a = await was.b.js(layout(id)), b = await now.b.js(layout(id));
      assert.equal(b.icon, null);
      assert.deepEqual(parts(b), parts(a), `${id} is laid out as before`);
    }
    // A row with the icon has its other parts where a row without one has them.
    const a = await now.b.js(layout('0003')), b = await now.b.js(layout('0001'));
    for (const k of ['top', 'stages', 'id', 'title', 'sub']) {
      assert.ok(Math.abs(a[k].top - b[k].top) <= 0.5 && Math.abs(a[k].left - b[k].left) <= 0.5, `${k}: ${JSON.stringify(b[k])} with the icon, ${JSON.stringify(a[k])} without`);
    }
  } finally { await was.close(); await now.close(); }
});
