import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fm, page, panelRepo, freePort, startPanel, stop, fakePage, full, idea, click, toggles, items, top, button, findChrome, browserPage, charAt } from './support/panel.mjs';

// ---------- 0054: a short ticket in Shaping, with the full ticket in a side pane ----------

const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const isOpen = item => /\bopen\b/.test(item.className);
const named = (p, node, text) => p.all(node).find(n => n.tagName === 'button' && n.textContent === text);
const fullButton = (p, item) => named(p, item, 'Full ticket');
const closeButton = p => named(p, pane(p), 'Close');
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const openTicket = (p, id) => { click(top(itemOf(p, id))); return itemOf(p, id); };
const showFull = (p, id) => click(fullButton(p, itemOf(p, id)));
const headings = (p, node) => p.all(node).filter(n => n.tagName === 'h4').map(n => n.textContent);
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
// As in 0040: a selection in `node` survives while neither it nor any node above it, up to the pane, has been taken out.
const held = (p, node) => {
  const chain = [];
  for (let at = node; at; at = at.parentNode) { chain.push([at, at.detached || 0]); if (at === pane(p)) break; }
  assert.equal(chain[chain.length - 1][0], pane(p), 'the node is in the side pane');
  return () => chain.every(([n, d], i) => (n.detached || 0) === d && (i === chain.length - 1 || n.parentNode === chain[i + 1][0]));
};
const base = () => ({ tickets: [full('0001', { acceptance_criteria: ['First criterion.', 'Second criterion.'] }), full('0002', { title: 'Second draft' })], ideas: [] });

test('0054 AC1: an open ticket shows its problem, outcome, readiness list and Set ready, and not its criteria, out of scope or notes', async () => {
  const p = fakePage([base()]);
  await p.settle();
  const item = openTicket(p, '0001');
  const text = item.textContent;
  for (const s of ['Problem', 'Problem of 0001.', 'Outcome', 'Outcome of 0001.', 'Readiness', '2 criteria', 'lint passes']) assert.ok(text.includes(s), s);
  assert.ok(named(p, item, 'Set ready'), 'the Set ready button');
  for (const s of ['First criterion.', 'Second criterion.', 'Out of scope', '- Not this.', 'Notes', '- A note.']) assert.ok(!text.includes(s), `no ${s}`);
  assert.ok(!headings(p, item).some(h => h.startsWith('Acceptance criteria')), 'no criteria heading');
  assert.ok(!p.all(item).some(n => n.tagName === 'ol'), 'no criteria list');
  assert.equal(button(item).textContent, 'Set ready', 'Set ready is still the first button');
});

test('0054 AC2: Full ticket keeps the ticket open and shows its whole text in the side pane, leaving out empty sections', async () => {
  const s = base();
  s.tickets[0].notes = 'A <b>bold</b> note.';
  s.tickets.push(full('0003', { problem: '', notes: null, out_of_scope: '', acceptance_criteria: [] }));
  const p = fakePage([s]);
  await p.settle();
  assert.ok(!paneOpen(p), 'no pane until asked');
  const item = openTicket(p, '0001');
  assert.ok(fullButton(p, item), 'the open ticket has a Full ticket button');
  assert.ok(!fullButton(p, itemOf(p, '0002')), 'a closed one shows none');
  showFull(p, '0001');
  assert.ok(isOpen(itemOf(p, '0001')), 'the ticket stays open');
  assert.ok(paneOpen(p), 'the side pane opens');
  const text = pane(p).textContent;
  for (const x of ['0001', 'Ticket 0001', 'Problem of 0001.', 'Outcome of 0001.', 'Not this.', 'A <b>bold</b> note.']) assert.ok(text.includes(x), x);
  assert.deepEqual(headings(p, pane(p)), ['Problem', 'Outcome', 'Acceptance criteria', 'Out of scope', 'Notes']);
  const ol = p.all(pane(p)).find(n => n.tagName === 'ol');
  assert.deepEqual(ol.children.map(li => li.textContent), ['First criterion.', 'Second criterion.'], 'numbered criteria');
  assert.doesNotMatch(page(), /innerHTML|insertAdjacentHTML/, 'built as text, never read as HTML');

  openTicket(p, '0003');
  showFull(p, '0003');
  assert.deepEqual(headings(p, pane(p)), ['Outcome'], 'empty sections are left out');
  assert.ok(!p.all(pane(p)).some(n => n.tagName === 'ol'));
});

test('0054 AC3: one ticket at a time; Close or Escape shuts the pane and leaves the open ticket open', async () => {
  const p = fakePage([base()]);
  await p.settle();
  openTicket(p, '0001'); openTicket(p, '0002');
  showFull(p, '0001');
  showFull(p, '0002');
  assert.ok(pane(p).textContent.includes('Second draft') && !pane(p).textContent.includes('Ticket 0001'), 'the pane shows only the later ticket');
  assert.equal(p.all(pane(p)).filter(n => n.tagName === 'ol').length, 1, 'one ticket in the pane');
  click(closeButton(p));
  assert.ok(!paneOpen(p), 'Close shuts it');
  assert.ok(isOpen(itemOf(p, '0001')) && isOpen(itemOf(p, '0002')), 'the open tickets stay open');
  showFull(p, '0001');
  assert.ok(paneOpen(p));
  p.key('Enter');
  assert.ok(paneOpen(p), 'another key leaves it');
  p.key('Escape');
  assert.ok(!paneOpen(p), 'Escape shuts it');
  assert.ok(isOpen(itemOf(p, '0001')), 'and the ticket stays open');
  p.key('Escape');
  assert.ok(isOpen(itemOf(p, '0001')), 'Escape with no pane changes nothing');
});

test('0054 AC4: the pane stays through the refresh, shows new data, and closes when the ticket leaves the Tickets list', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[0].acceptance_criteria = ['First criterion, reworded.'];
  const third = clone(next);
  third.tickets[0].status = 'ready';
  const p = fakePage([s, clone(s), next, third, clone(third)]);
  await p.settle();
  openTicket(p, '0001');
  showFull(p, '0001');
  await refresh(p);
  assert.ok(paneOpen(p) && pane(p).textContent.includes('First criterion.'), 'still showing the same ticket');
  click(toggles(p)[1]);
  assert.ok(paneOpen(p), 'showing the Ideas list leaves it');
  click(toggles(p)[0]);
  await refresh(p);
  assert.ok(pane(p).textContent.includes('First criterion, reworded.') && !pane(p).textContent.includes('Second criterion.'), 'the new content shows');
  await refresh(p);
  assert.ok(!paneOpen(p), 'set ready: the pane closes');
  assert.ok(!itemOf(p, '0001'), 'and the ticket has left Shaping');
  await refresh(p);
  assert.ok(!paneOpen(p), 'and stays closed');
});

test('0054 AC5: text selected in the pane stays selected through the refresh while that ticket is unchanged', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[1].title = 'Second draft, renamed'; // another ticket changes
  next.ideas.push(idea('New', 'idea'));
  const third = clone(next);
  third.tickets[0].notes = '- A new note.';
  const p = fakePage([s, clone(s), next, third]);
  await p.settle();
  openTicket(p, '0001');
  showFull(p, '0001');
  const li = p.all(pane(p)).find(n => n.tagName === 'li');
  const kept = held(p, li);
  await refresh(p);
  assert.ok(kept(), 'kept through an unchanged refresh');
  await refresh(p);
  assert.ok(kept(), 'kept while other things change');
  await refresh(p);
  assert.ok(pane(p).textContent.includes('A new note.'), 'its own change shows');
  assert.ok(!kept(), 'and then the pane is rebuilt');
});

test('0054 self-check: ids named like built-ins, and repeated ids, show the first match', async () => {
  const s = { tickets: [full('__proto__'), full('constructor'), full('0001', { title: 'First copy' }), full('0001', { title: 'Second copy' })], ideas: [] };
  const p = fakePage([s, clone(s)]);
  await p.settle();
  openTicket(p, '__proto__');
  showFull(p, '__proto__');
  assert.ok(pane(p).textContent.includes('Ticket __proto__'));
  click(top(items(p)[1]));
  click(fullButton(p, items(p)[1]));
  assert.ok(pane(p).textContent.includes('Ticket constructor'));
  click(top(items(p)[3]));
  click(fullButton(p, items(p)[3]));
  assert.ok(pane(p).textContent.includes('First copy'), 'a repeated id shows its first ticket');
  await refresh(p);
  assert.ok(paneOpen(p));
});

test('0054 AC2-AC5: in a real browser, the pane opens, keeps a selection through refreshes and closes with Escape', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-draft.md', fm({ id: '"0002"', title: 'A draft to read', status: 'draft' }),
    `## Problem\nReading a long problem statement at Gate 1.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n2. A second criterion to select.\n## Out of scope\n- PDF export\n`);
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  try {
    const item = '#shaping .item';
    await b.until(`!!document.querySelector('${item} .title')`, 'the draft');
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .detail')`, 'the draft to open');
    assert.ok(!(await b.js(`!!document.querySelector('${item} .detail ol')`)), 'no criteria in the short view');
    await b.js(`[...document.querySelectorAll('${item} button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket ol li')`, 'the pane');
    assert.ok(await b.js(`document.getElementById('full-ticket').getBoundingClientRect().width > 0`), 'the pane is visible');
    await b.drag(await b.js(charAt('#full-ticket ol li', 0)), await b.js(charAt('#full-ticket ol li', 13)));
    assert.equal(await sel(), 'Export button', 'the drag selected text');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'the ticket stays open');
    const refreshed = async what => { await b.js(`window.seen = document.getElementById('pills').firstChild`); await b.until(`document.getElementById('pills').firstChild !== window.seen`, what); };
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.equal(await sel(), 'Export button', 'kept through refreshes');
    await b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    assert.ok(await b.js(`document.getElementById('full-ticket').hidden`), 'Escape closes it');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'the ticket is still open');
  } finally {
    await b.close();
    await stop(panel);
  }
});
