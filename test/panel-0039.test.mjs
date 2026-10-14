import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fm, panelRepo, freePort, startPanel, stop, page, fakePage, full, idea, click, toggles, items, top, button, findChrome, browserPage, charAt } from './support/panel.mjs';

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
    if (/\bpick\b/.test(inHead[i].className)) continue; // since 0077 the priority tag opens its menu instead (covered there)
    if ((inHead[i].className || '').split(' ').includes('tag')) continue; // since 0165 a tag shows its tip instead (covered there)
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
  // Within a section the click lands on its text; across Problem and the readiness list, on the details themselves.
  press(p.all(items(p)[0]).find(n => n.tagName === 'p'));
  assert.ok(isOpen(items(p)[0]), 'selecting within a section');
  press(detailOf(items(p)[0]));
  assert.ok(isOpen(items(p)[0]), 'selecting across sections');
  click(toggles(p)[1]);
  press(top(items(p)[0]));
  press(p.all(items(p)[0]).find(n => n.tagName === 'p')); // the note's text, formatted since 0142
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

test('0039 AC4: in a real browser, dragging to select text in a ticket\'s details or an idea\'s note leaves it open', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-draft.md', fm({ id: '"0002"', title: 'A draft to read', status: 'draft' }),
    `## Problem\nReading a long problem statement at Gate 1.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n2. A second criterion to select.\n## Out of scope\n- PDF export\n`);
  fs.mkdirSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'note.md'), '# A parked idea\n\nStatus: idea\n\nThe note text, long enough to select across.\nAnd a second line.\n');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
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
    await b.drag(await b.js(charAt(`${item} .detail p.text`, 3)), await b.js(charAt(`${item} .detail p.text:nth-of-type(2)`, 8)));
    assert.match(await b.js('getSelection().toString()'), /long problem[\s\S]*Users ca/, 'a selection across sections');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'still open');

    await b.js(`document.querySelectorAll('#shaping-toggle button')[1].click()`);
    await b.until(`!!document.querySelector('${item}.idea .title')`, 'the idea');
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .note')`, 'the idea to open');
    const note = `${item} .note p:last-child`; // its last paragraph: the note is formatted since 0142
    const start = await b.js(`document.querySelector('${note}').textContent.indexOf('The note')`);
    await b.drag(await b.js(charAt(note, start)), await b.js(charAt(note, start + 30)));
    assert.equal(await b.js('getSelection().toString()'), 'The note text, long enough to ');
    assert.ok(await b.js(`document.querySelector('${item}').classList.contains('open')`), 'the idea stays open');
  } finally {
    await b.close();
    await stop(panel);
  }
});
