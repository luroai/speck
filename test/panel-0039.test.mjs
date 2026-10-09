import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { env, fm, panelRepo, freePort, startPanel, stop, page, fakePage, full, idea, click, toggles, items, top, button } from './support/panel.mjs';

// ---------- 0039: an open item closes only from its top row ----------

// A click as the browser delivers it: to the node, then up through its parents, until a listener stops it.
// A drag that selects text ends in a click on the nearest node holding both ends, so this covers that too.
const press = n => {
  let stopped = false;
  const e = { target: n, stopPropagation() { stopped = true; } };
  for (let at = n; at && !stopped; at = at.parentNode) if (at.listeners && at.listeners.click) at.listeners.click(e);
};
const isOpen = item => /\bopen\b/.test(item.className);
const detailOf = item => item.children.find(n => /\bdetail\b/.test(n.className));

test('0039 AC1: a draft opens and closes from anywhere in its top row: id, title, tags, criteria count and lint line', async () => {
  const state = { tickets: [full('0001', { priority: 1, lint: { errors: 1, warnings: 1 } })], ideas: [] };
  const p = fakePage([state]);
  await p.settle();
  const head = top(items(p)[0]);
  assert.ok(head, 'the ticket has a top row');
  const inHead = p.all(head);
  for (const s of ['0001', 'Ticket 0001', 'P1', 'S', 'low', 'criteria', 'lint: 1 error', '1 warning'])
    assert.ok(inHead.some(n => n.textContent === s || n.textContent.includes(s)), `the top row holds ${s}`);
  for (const i of inHead.keys()) {
    press(p.all(top(items(p)[0]))[i]);
    assert.ok(isOpen(items(p)[0]), `opens from top-row node ${i}`);
    press(p.all(top(items(p)[0]))[i]);
    assert.ok(!isOpen(items(p)[0]), `closes from top-row node ${i}`);
  }
  assert.ok(!items(p)[0].listeners.click, 'the item itself does not open or close it');
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.head \{[^}]*cursor: pointer/, 'the top row shows it can be clicked');
  assert.doesNotMatch(css, /\.item\.(ticket|idea) \{[^}]*cursor: pointer/, 'the details do not');
});

test('0039 AC2: clicking anywhere in an open ticket\'s sections or readiness list leaves it open', async () => {
  const state = { tickets: [full('0001', { acceptance_criteria: ['One.', 'Two.'], lint_messages: { errors: [], warnings: ['A warning.'] }, after: ['0002'], waiting_on: ['0002'] })], ideas: [] };
  const p = fakePage([state]);
  await p.settle();
  press(top(items(p)[0]));
  const detail = () => detailOf(items(p)[0]);
  const count = p.all(detail()).length;
  assert.ok(count > 10, 'the details have sections and a readiness list');
  for (let i = 0; i < count; i++) {
    const n = p.all(detail())[i];
    if (n.tagName === 'button') continue; // Set ready: its own click, covered by 0042
    press(n);
    assert.ok(isOpen(items(p)[0]) && detail(), `still open after a click on ${n.tagName} "${n.textContent.slice(0, 30)}"`);
  }
  press(items(p)[0]);
  assert.ok(isOpen(items(p)[0]), 'a click on the item outside its top row leaves it open');
  press(button(items(p)[0]));
  assert.ok(isOpen(items(p)[0]), 'Set ready leaves it open');
});

test('0039 AC3: an idea opens and closes from its top row (title, status, path), and clicks in its note leave it open', async () => {
  const state = { tickets: [], ideas: [idea('Fresh', 'idea', 'Line one.\nLine two.\n')] };
  const p = fakePage([state]);
  await p.settle();
  click(toggles(p)[1]);
  const head = top(items(p)[0]);
  assert.ok(head, 'the idea has a top row');
  for (const s of ['Fresh', 'idea', 'speck/ideas/Fresh.md']) assert.ok(p.all(head).some(n => n.textContent === s), `the top row holds ${s}`);
  for (const i of p.all(head).keys()) {
    press(p.all(top(items(p)[0]))[i]);
    assert.ok(isOpen(items(p)[0]), `opens from top-row node ${i}`);
    press(p.all(top(items(p)[0]))[i]);
    assert.ok(!isOpen(items(p)[0]), `closes from top-row node ${i}`);
  }
  press(top(items(p)[0]));
  for (const n of p.all(detailOf(items(p)[0]))) {
    press(n);
    assert.ok(isOpen(items(p)[0]), `still open after a click on ${n.tagName}`);
  }
  assert.ok(items(p)[0].textContent.includes('Line two.'));
  press(items(p)[0]);
  assert.ok(isOpen(items(p)[0]), 'a click on the item outside its top row leaves it open');
});

test('0039 AC4: the click a selecting drag ends with, on a ticket\'s details or an idea\'s note, leaves it open', async () => {
  const state = { tickets: [full('0001', { acceptance_criteria: ['One.', 'Two.'] })], ideas: [idea('Fresh', 'idea')] };
  const p = fakePage([state]);
  await p.settle();
  press(top(items(p)[0]));
  // Across two criteria the click lands on their list; across Problem and the readiness list, on the details themselves.
  const ol = p.all(items(p)[0]).find(n => n.tagName === 'ol');
  press(ol);
  assert.ok(isOpen(items(p)[0]), 'selecting across criteria');
  press(detailOf(items(p)[0]));
  assert.ok(isOpen(items(p)[0]), 'selecting across sections');
  click(toggles(p)[1]);
  press(top(items(p)[0]));
  press(p.all(items(p)[0]).find(n => n.tagName === 'pre'));
  assert.ok(isOpen(items(p)[0]), 'selecting within the note');
  press(detailOf(items(p)[0]));
  assert.ok(isOpen(items(p)[0]), 'selecting to the edge of the note');
});

test('0039 AC5: several items can be open at once, and what is open survives the 2-second refresh', async () => {
  const state = { tickets: [full('0001'), full('0002'), full('0003')], ideas: [idea('A', 'idea'), idea('B', 'idea')] };
  const p = fakePage([state, state, state]);
  await p.settle();
  press(top(items(p)[0])); press(top(items(p)[2]));
  assert.deepEqual(items(p).map(isOpen), [true, false, true]);
  click(toggles(p)[1]);
  press(top(items(p)[0])); press(top(items(p)[1]));
  assert.deepEqual(items(p).map(isOpen), [true, true]);
  p.timers.shift()(); await p.settle();
  assert.deepEqual(items(p).map(isOpen), [true, true], 'ideas stay open through a refresh');
  click(toggles(p)[0]);
  assert.deepEqual(items(p).map(isOpen), [true, false, true], 'tickets stay open too');
  press(top(items(p)[0]));
  p.timers.shift()(); await p.settle();
  assert.deepEqual(items(p).map(isOpen), [false, false, true], 'and a closed one stays closed');
});

// A headless Chromium driven over the DevTools protocol, with no dependencies: SPECK_TEST_CHROME, or one Playwright installed.
function findChrome() {
  if (process.env.SPECK_TEST_CHROME) return process.env.SPECK_TEST_CHROME;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  const found = fs.existsSync(cache) ? fs.readdirSync(cache).sort().reverse().flatMap(d => [
    path.join(cache, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'), path.join(cache, d, 'chrome-linux64', 'chrome')]) : [];
  return [...found, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(f => fs.existsSync(f)) || null;
}
async function browserPage(url) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-chrome-'));
  const chrome = spawn(findChrome(), ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--window-size=1280,900', 'about:blank']);
  const port = await new Promise((resolve, reject) => {
    let err = '';
    const t = setTimeout(() => reject(new Error(`chrome didn't start: ${err}`)), 15000);
    chrome.stderr.on('data', d => { err += d; const m = err.match(/ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) { clearTimeout(t); resolve(m[1]); } });
  });
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const waiting = new Map();
  ws.onmessage = m => { const r = JSON.parse(m.data); if (waiting.has(r.id)) { waiting.get(r.id)(r); waiting.delete(r.id); } };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    waiting.set(id, r => (r.error ? reject(new Error(`${method}: ${r.error.message}`)) : resolve(r.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const js = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`${expr}: ${r.exceptionDetails.text}`);
    return r.result.value;
  };
  const until = async (expr, what) => {
    for (let i = 0; i < 100; i++) { if (await js(expr)) return; await new Promise(r => setTimeout(r, 100)); }
    throw new Error(`timed out waiting for ${what}`);
  };
  const mouse = (type, [x, y]) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  // A real drag with the mouse, from one point to another, through a point between them.
  const drag = async (from, to) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from[0], y: from[1] });
    await mouse('mousePressed', from);
    await mouse('mouseMoved', [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]);
    await mouse('mouseMoved', to);
    await mouse('mouseReleased', to);
  };
  const close = async () => { ws.close(); chrome.kill(); await new Promise(r => chrome.once('exit', r)); fs.rmSync(profile, { recursive: true, force: true }); };
  return { js, until, drag, close };
}
// The page point at a character offset in the first text node of the element a selector finds.
const charAt = (sel, offset) => `(() => { const t = document.querySelector(${JSON.stringify(sel)}).firstChild; const r = document.createRange();
  r.setStart(t, ${offset}); r.setEnd(t, ${offset} + 1); const b = r.getBoundingClientRect(); return [b.left + 1, b.top + b.height / 2]; })()`;

test('0039 AC4: in a real browser, dragging to select text in a ticket\'s details or an idea\'s note leaves it open', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-draft.md', fm({ id: '"0002"', title: 'A draft to read', status: 'draft' }),
    `## Problem\nReading a long problem statement at Gate 1.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n2. A second criterion to select.\n## Out of scope\n- PDF export\n`);
  fs.mkdirSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'note.md'), '# A parked idea\n\nStatus: idea\n\nThe note text, long enough to select across.\nAnd a second line.\n');
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    const item = '#shaping .item';
    await b.until(`!!document.querySelector('${item} .title')`, 'the draft');
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .detail')`, 'the draft to open');
    // Within one section, then across sections into the readiness list.
    await b.drag(await b.js(charAt(`${item} .detail p.text`, 0)), await b.js(charAt(`${item} .detail p.text`, 20)));
    assert.equal(await b.js('getSelection().toString()'), 'Reading a long probl', 'the drag selected text');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'the ticket stays open');
    await b.js('getSelection().removeAllRanges()'); // a drag that starts in a selection would move it, not make a new one
    await b.drag(await b.js(charAt(`${item} .detail p.text`, 3)), await b.js(charAt(`${item} .detail ol li:nth-child(2)`, 8)));
    assert.match(await b.js('getSelection().toString()'), /long problem[\s\S]*A second/, 'a selection across sections');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'still open');

    await b.js(`document.querySelectorAll('#shaping-toggle button')[1].click()`);
    await b.until(`!!document.querySelector('${item}.idea .title')`, 'the idea');
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .note')`, 'the idea to open');
    const note = `${item} .note`;
    const start = await b.js(`document.querySelector('${note}').textContent.indexOf('The note')`);
    await b.drag(await b.js(charAt(note, start)), await b.js(charAt(note, start + 30)));
    assert.equal(await b.js('getSelection().toString()'), 'The note text, long enough to ');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'the idea stays open');
  } finally {
    await b.close();
    await stop(panel);
  }
});
