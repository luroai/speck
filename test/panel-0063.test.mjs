import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fm, panelRepo, freePort, startPanel, stop, fakePage, full, T, round, click, items, top, queueRows, shippedRows, shippedFull, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0063: open the full ticket pane from any ticket in the panel ----------

const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const paneId = p => (paneOpen(p) ? pane(p).children[0].children[0].textContent : null);
const headings = (p, node) => p.all(node).filter(n => n.tagName === 'h4').map(n => n.textContent);
const named = (p, node, text) => p.all(node).find(n => n.tagName === 'button' && n.textContent === text);
const fullOf = (p, node) => named(p, node, 'Full ticket');
// 0137: a Shipped row opened the full ticket from its title. 0466: from Full ticket in its open card, as in Plan and Build.
const titleOf = (p, row) => shippedFull(p, () => shipOf(p, p.all(row).find(n => n.className === 'id')._text));
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const shipOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const isOpen = n => /(^| )open( |$)/.test(n.className);
const logOf = (p, row) => p.all(row).find(n => /(^| )log( |$)/.test(n.className || ''));
const clone = s => JSON.parse(JSON.stringify(s));
const at = h => new Date(Date.UTC(2026, 9, 9, h)).toISOString();
// A ticket in any status with every section filled in, as /api/state gives it.
const any = (id, status, o = {}) => full(id, { status, ...o });
const shipped = (id, h, o = {}) => any(id, 'done', { started: at(h - 1), finished: at(h), rounds: [round(1, 100)], ...o });

// A fake page whose /api/state answers with `p.state` at that moment, and every log request with a short log.
function livePage(s) {
  const box = { state: s }, calls = [];
  const p = fakePage([], {
    fetch: async url => { calls.push(url); return { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'built\nmore', truncated: false } : clone(box.state)) }; },
  });
  p.set = next => { box.state = next; };
  p.fetched = calls;
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
// Clicks a button as the browser would, saying whether the click went any further.
const press = b => { let stopped = false; b.listeners.click({ stopPropagation() { stopped = true; }, preventDefault() {} }); return stopped; };

const board = () => ({
  tickets: [
    full('0001', { title: 'A draft' }),
    any('0002', 'building', { title: 'A build', started: at(9) }),
    any('0003', 'blocked', { title: 'Blocked', blocked_question: 'Which one?' }),
    any('0004', 'ready', { title: 'Queued one' }),
    shipped('0005', 8, { title: 'Shipped one' }),
    shipped('0006', 7, { title: 'Shipped two' }),
  ],
  ideas: [],
});
// What's open or selected across the page: each Shaping item's and queue row's open state, and the Shaping list showing.
const openStates = p => [items(p).map(isOpen), queueRows(p).map(isOpen), p.byId('shaping-section').className];

test('0063 AC1: an open queue ticket has a Full ticket button, and a closed one has none', async () => {
  const p = livePage(board());
  await p.settle();
  for (const id of ['0002', '0003', '0004']) assert.equal(fullOf(p, rowOf(p, id)), undefined, `${id}: closed, no button`);
  for (const id of ['0002', '0003', '0004']) {
    click(topOf(rowOf(p, id)));
    await p.settle();
    assert.ok(logOf(p, rowOf(p, id)), `${id}: its log is showing`);
    assert.ok(fullOf(p, rowOf(p, id)), `${id}: open, so it has the button`);
    assert.ok(!p.all(topOf(rowOf(p, id))).includes(fullOf(p, rowOf(p, id))), 'not in the top row, which opens and closes it');
  }
  click(topOf(rowOf(p, '0002')));
  await p.settle();
  assert.equal(fullOf(p, rowOf(p, '0002')), undefined, 'closed again: no button');
});

test('0063 AC1: clicking a queue ticket\'s Full ticket opens the pane on it and opens, closes or selects nothing else', async () => {
  const p = livePage(board());
  await p.settle();
  click(top(itemOf(p, '0001')));
  click(topOf(rowOf(p, '0002')));
  click(topOf(rowOf(p, '0003')));
  await p.settle();
  const before = openStates(p), calls = p.fetched.length;
  assert.ok(press(fullOf(p, rowOf(p, '0003'))), 'the click goes no further');
  assert.ok(paneOpen(p), 'the pane opens');
  assert.equal(paneId(p), '0003', 'on that ticket');
  assert.ok(pane(p).textContent.includes('Blocked'), 'with its title');
  assert.deepEqual(openStates(p), before, 'nothing else opens or closes');
  assert.equal(p.fetched.length, calls, 'and nothing is asked of the server');
});

test('0063 AC1: each Shipped card\'s Full ticket opens the pane on that ticket and nothing else (from its open card since 0466)', async () => {
  const p = livePage(board());
  await p.settle();
  click(topOf(rowOf(p, '0002')));
  await p.settle();
  for (const id of ['0005', '0006']) assert.ok(titleOf(p, shipOf(p, id)), `${id}: a Full ticket button`);
  const before = openStates(p);
  assert.ok(press(titleOf(p, shipOf(p, '0006'))), 'the click goes no further');
  assert.equal(paneId(p), '0006');
  assert.ok(pane(p).textContent.includes('Shipped two'));
  assert.deepEqual(openStates(p), before, 'nothing else opens or closes');
  named(p, pane(p), 'Close').listeners.click();
  press(titleOf(p, shipOf(p, '0005')));
  assert.equal(paneId(p), '0005');
});

test('0063 AC2: a ticket that isn\'t a draft shows the same id, title and sections as a draft, with no readiness list or Set ready', async () => {
  const s = board();
  const p = livePage(s);
  await p.settle();
  click(top(itemOf(p, '0001')));
  press(fullOf(p, itemOf(p, '0001')));
  const draftHeadings = headings(p, pane(p));
  assert.deepEqual(draftHeadings, ['Readiness', 'Problem', 'Outcome', 'Acceptance criteria', 'Out of scope', 'Notes']);
  const sections = node => node.children.at(-1).children.filter(n => !/\bready\b/.test(n.className)).map(n => n.textContent);
  const draftSections = sections(pane(p));
  named(p, pane(p), 'Close').listeners.click();
  for (const [id, from] of [['0002', 'queue'], ['0004', 'queue'], ['0005', 'shipped']]) {
    if (from === 'queue') { click(topOf(rowOf(p, id))); await p.settle(); press(fullOf(p, rowOf(p, id))); } else press(titleOf(p, shipOf(p, id)));
    assert.equal(paneId(p), id);
    const [head] = pane(p).children;
    assert.equal(head.children.find(n => n.className === 'title').textContent, s.tickets.find(t => t.id === id).title, `${id}: its title`);
    assert.deepEqual(headings(p, pane(p)), draftHeadings.slice(1), `${id}: the same sections, with no readiness list`);
    assert.deepEqual(sections(pane(p)).map(t => t.replaceAll(id, 'X')), draftSections.map(t => t.replaceAll('0001', 'X')), `${id}: shown the same way`);
    assert.equal(p.all(pane(p)).find(n => /\bset-ready\b/.test(n.className || '')), undefined, `${id}: no Set ready`);
    assert.ok(!pane(p).textContent.includes('Readiness') && !pane(p).textContent.includes('lint passes'), `${id}: no readiness lines`);
    named(p, pane(p), 'Close').listeners.click();
  }
});

test('0063 AC2: a ticket that isn\'t a draft leaves out sections with nothing in them, as a draft does', async () => {
  const s = { tickets: [shipped('0005', 8, { problem: '', notes: null, out_of_scope: '', acceptance_criteria: [] })], ideas: [] };
  const p = livePage(s);
  await p.settle();
  press(titleOf(p, shipOf(p, '0005')));
  assert.deepEqual(headings(p, pane(p)), ['Outcome']);
});

test('0063 AC3: the pane stays on a ticket as it moves from Tickets to the queue to Shipped, and closes when it shows nowhere', async () => {
  const s = board();
  const p = livePage(s);
  await p.settle();
  click(top(itemOf(p, '0001')));
  press(fullOf(p, itemOf(p, '0001')));
  assert.ok(headings(p, pane(p)).includes('Readiness'), 'a draft: with its readiness list');
  const move = async (o, what) => {
    const next = clone(s);
    Object.assign(next.tickets[0], o);
    p.set(next);
    await refresh(p);
    assert.equal(paneId(p), '0001', `${what}: still open on the same ticket`);
    return next;
  };
  await move({ status: 'ready' }, 'set ready');
  assert.ok(rowOf(p, '0001') && !itemOf(p, '0001'), 'it is in the queue now');
  assert.ok(!headings(p, pane(p)).includes('Readiness'), 'ready: no readiness list');
  assert.equal(named(p, pane(p), 'Set ready'), undefined, 'and no Set ready');
  await move({ status: 'building', started: at(9) }, 'starts building');
  await move({ status: 'approved', started: at(9), rounds: [round(1, 50)] }, 'approved');
  let next = await move({ status: 'done', started: at(9), finished: at(10), rounds: [round(1, 50)] }, 'ships');
  assert.ok(shipOf(p, '0001') && !rowOf(p, '0001'), 'it is in the Shipped list now');
  // Nine more ship after it: it's still among the latest 10 (5 before 0411).
  for (let i = 0; i < 9; i++) next.tickets.push(shipped(`001${i}`, 11 + i));
  p.set(clone(next));
  await refresh(p);
  assert.equal(paneId(p), '0001', 'still in the latest 10');
  next.tickets.push(shipped('0020', 21));
  p.set(clone(next));
  await refresh(p);
  assert.ok(!shipOf(p, '0001'), 'an eleventh pushed it off the list');
  assert.ok(!paneOpen(p), 'so the pane closes');
  assert.ok(pane(p).hidden && p.byId('full-backdrop').hidden, 'with its backdrop');
  next.tickets.pop();
  p.set(clone(next));
  await refresh(p);
  assert.ok(shipOf(p, '0001') && !paneOpen(p), 'and stays closed if it comes back');
});

test('0063 AC3: the pane closes when its ticket is cancelled, from the queue or from Tickets', async () => {
  for (const id of ['0001', '0004']) {
    const s = board();
    const p = livePage(s);
    await p.settle();
    if (id === '0001') { click(top(itemOf(p, id))); press(fullOf(p, itemOf(p, id))); } else { click(topOf(rowOf(p, id))); await p.settle(); press(fullOf(p, rowOf(p, id))); }
    assert.equal(paneId(p), id);
    const next = clone(s);
    next.tickets.find(t => t.id === id).status = 'cancelled';
    p.set(next);
    await refresh(p);
    assert.ok(!paneOpen(p), `${id}: closed`);
  }
});

test('0063 AC3: its content changes with the ticket, and a draft\'s readiness list goes when it leaves Tickets', async () => {
  const s = board();
  const p = livePage(s);
  await p.settle();
  click(topOf(rowOf(p, '0002')));
  await p.settle();
  press(fullOf(p, rowOf(p, '0002')));
  const next = clone(s);
  next.tickets[1].notes = '- A new note.';
  p.set(next);
  await refresh(p);
  assert.ok(pane(p).textContent.includes('A new note.'), 'the new content shows');
});

// As in 0040: a selection in `node` survives while neither it nor any node above it, up to `root`, has been taken out.
const held = (node, root) => {
  const chain = [];
  for (let at = node; at; at = at.parentNode) { chain.push([at, at.detached || 0]); if (at === root) break; }
  assert.equal(chain[chain.length - 1][0], root, 'the node is under the root');
  return () => chain.every(([n, d], i) => (n.detached || 0) === d && (i === chain.length - 1 || n.parentNode === chain[i + 1][0]));
};

test('0063 AC4: opening and closing the pane leaves queue tickets as they were, and their rows, Shipped rows and log boxes keep their nodes', async () => {
  const s = board();
  const p = livePage(s);
  await p.settle();
  click(topOf(rowOf(p, '0002')));
  await p.settle();
  const log = logOf(p, rowOf(p, '0002'));
  Object.assign(log, { scrollHeight: 1000, clientHeight: 100, scrollTop: 37 }); // the reader has scrolled it up
  const keptLog = held(log, p.byId('queue')), keptRow = held(rowOf(p, '0003'), p.byId('queue'));
  const keptShip = held(shipOf(p, '0006').children[0], p.byId('shipped'));
  const before = openStates(p);
  for (const how of ['Close', 'Escape', 'backdrop']) {
    for (const from of ['queue', 'shipped']) {
      press(from === 'queue' ? fullOf(p, rowOf(p, '0002')) : titleOf(p, shipOf(p, '0005')));
      assert.ok(paneOpen(p));
      await refresh(p);
      assert.ok(paneOpen(p), 'open through the refresh');
      if (how === 'Close') named(p, pane(p), 'Close').listeners.click();
      else if (how === 'Escape') p.key('Escape');
      else p.byId('full-backdrop').listeners.click({ target: p.byId('full-backdrop') });
      assert.ok(!paneOpen(p), `${how} closes it`);
      await refresh(p);
      assert.deepEqual(openStates(p), before, `${how} from ${from}: queue tickets open or closed as they were`);
      assert.ok(keptLog(), `${how} from ${from}: the log box is never taken out`);
      assert.equal(log.scrollTop, 37, 'and stays where it was scrolled');
      assert.ok(keptRow(), 'a queue row keeps its node, so text selected in it stays');
      assert.ok(keptShip(), 'a Shipped row keeps its node too');
    }
  }
});

test('0063 self-check: built-in names as ids, and an id in more than one list, show the first match in Tickets, the queue, then Shipped', async () => {
  const s = { tickets: [any('__proto__', 'building', { title: 'Proto build' }), shipped('constructor', 8, { title: 'Ctor shipped' }), full('0009', { title: 'Draft 9' }), shipped('0009', 9, { title: 'Done 9' })], ideas: [] };
  const p = livePage(s);
  await p.settle();
  click(topOf(rowOf(p, '__proto__')));
  await p.settle();
  press(fullOf(p, rowOf(p, '__proto__')));
  assert.ok(pane(p).textContent.includes('Proto build'));
  await refresh(p);
  assert.ok(pane(p).textContent.includes('Proto build'), 'kept through the refresh');
  press(titleOf(p, shipOf(p, 'constructor')));
  assert.ok(pane(p).textContent.includes('Ctor shipped'));
  press(titleOf(p, shipOf(p, '0009')));
  assert.ok(pane(p).textContent.includes('Draft 9'), 'the first ticket with that id');
});

test('0063 AC1-AC4: in a real browser, Full ticket from the queue and from an open Shipped card open the pane and leaves the log where it was', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const body = `## Problem\nWatching a build.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
  r.write('0002-build.md', fm({ id: '"0002"', title: 'A build to watch', status: 'building', started: at(9) }), body);
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0002.log'), Array.from({ length: 120 }, (_, i) => `line ${i}`).join('\n'));
  r.write('0003-done.md', fm({ id: '"0003"', title: 'A shipped one', status: 'done', started: at(7), finished: at(8) }), body, 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const isHidden = () => b.js(`document.getElementById('full-ticket').hidden`);
  try {
    await b.until(`[...document.querySelectorAll('#queue .q')].some(q => q.textContent.includes('A build to watch'))`, 'the build in the queue');
    const row = `[...document.querySelectorAll('#queue .q')].find(q => q.textContent.includes('A build to watch'))`;
    assert.ok(await b.js(`!(${row}).querySelector('button.full-open')`), 'closed: no button');
    await b.js(`(${row}).querySelector('.top').click()`);
    await b.until(`!!(${row}).querySelector('.log') && (${row}).querySelector('.log').textContent.includes('line 119')`, 'the log');
    await b.js(`(${row}).querySelector('.log').scrollTop = 40`);
    const scrolled = await b.js(`(${row}).querySelector('.log').scrollTop`);
    assert.ok(scrolled > 0, 'the log scrolled');
    await b.js(`[...(${row}).querySelectorAll('button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden`, 'the pane');
    assert.ok(await b.js(`document.querySelector('#full-ticket .id').textContent === '0002'`));
    assert.ok(await b.js(`!document.querySelector('#full-ticket .ready') && !document.querySelector('#full-ticket .set-ready')`), 'no readiness list');
    assert.ok(await b.js(`(${row}).classList.contains('open')`), 'the queue ticket stays open');
    await b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    assert.ok(await isHidden(), 'Escape closes it');
    assert.equal(await b.js(`(${row}).querySelector('.log').scrollTop`), scrolled, 'the log is where it was');
    assert.ok(await b.js(`(${row}).classList.contains('open')`), 'and the ticket is still open');
    await b.until(`!!document.querySelector('#shipped tr .title')`, 'the Shipped row\'s title');
    await b.js(`document.querySelector('#shipped tr .title').click()`); // 0466: it opens the card, which has Full ticket
    await b.until(`!!document.querySelector('#shipped tr.open .full-open')`, 'the open Shipped card');
    await b.js(`document.querySelector('#shipped tr.open .full-open').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden`, 'the pane from Shipped');
    assert.ok(await b.js(`document.querySelector('#full-ticket .id').textContent === '0003' && document.getElementById('full-ticket').textContent.includes('Watching a build.')`));
  } finally {
    await b.close();
    await stop(panel);
  }
});

test('0063 self-check: in a real browser, Set ready in the pane keeps the pane open on the ticket, with the focus in it', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    const item = `[...document.querySelectorAll('#shaping .item')].find(n => n.textContent.includes('Two'))`;
    await b.until(`!!(${item})`, 'the draft');
    await b.js(`(${item}).querySelector('.head').click()`);
    await b.until(`!!(${item}).querySelector('button.full-open')`, 'the draft to open');
    await b.js(`(${item}).querySelector('button.full-open').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket .set-ready')`, 'the pane');
    await b.js(`document.querySelector('#full-ticket .set-ready').focus(); document.querySelector('#full-ticket .set-ready').click()`);
    await b.until(`!document.querySelector('#full-ticket .ready') && [...document.querySelectorAll('#queue .q')].some(q => q.textContent.includes('Two'))`, 'the ticket in the queue');
    assert.ok(!(await b.js(`document.getElementById('full-ticket').hidden`)), 'the pane stays open');
    assert.equal(await b.js(`document.querySelector('#full-ticket .id').textContent`), '0002');
    assert.ok(await b.js(`document.activeElement === document.getElementById('full-ticket')`), 'the pane has the focus, so the keys still scroll it');
  } finally {
    await b.close();
    await stop(panel);
  }
});
