// 0142: an opened draft, idea or inbox note in Plan shows its Markdown formatted, as the full ticket pane does.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fm, panelRepo, freePort, startPanel, stop, fakePage, full, idea, click, items, notes, top, findChrome, browserPage, charAt, page, openLane, styles } from './support/panel.mjs';

const clone = s => JSON.parse(JSON.stringify(s));
const tags = (p, n, tag) => p.all(n).filter(x => x.tagName === tag);
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const detailOf = item => item.children.find(n => /\bdetail\b/.test(n.className || ''));
// A node as its tag, link, list start and text, its children in order, without classes: what the reader sees.
const shape = n => (n.tagName === '#text' ? n.textContent
  : [n.tagName, n.href ?? null, n.start ?? null, n._text, ...(n.children || []).map(shape).filter(c => c !== '')]);

// What a draft's opened view shows under a heading: every node after it up to the next heading.
function planSection(item, heading) {
  const body = detailOf(item).children[0];
  const i = body.children.findIndex(n => n.tagName === 'h4' && n.textContent === heading);
  assert.ok(i >= 0, `the opened draft has a ${heading} section`);
  const out = [];
  for (const n of body.children.slice(i + 1)) { if (n.tagName === 'h4') break; out.push(n); }
  return out;
}
// What the full ticket pane shows under a heading: the children of its formatted block.
function paneSection(p, heading) {
  const body = p.byId('full-ticket').children.at(-1); // 0465: the body is last, after the track and table
  const i = body.children.findIndex(n => n.tagName === 'h4' && n.textContent === heading);
  assert.ok(i >= 0, `the pane has a ${heading} section`);
  return body.children[i + 1].children;
}

const PROBLEM = [
  'Some **bold**, *star* and _under_ text with `a code span`, a [link](https://example.com/a) and an [http one](http://x.y).',
  'A [bad link](javascript:alert(1)) keeps its text only.',
  '',
  '# A heading',
  '## A smaller one',
  '',
  '- one',
  '  - nested',
  '- two',
  '',
  '3. three',
  '4. four',
].join('\n');
const OUTCOME = 'Users see **formatted** text.\n\n```\n**as written**\n```';

test('0142 AC1: an opened draft\'s Problem and Outcome are formatted exactly as the full ticket pane formats them', async () => {
  const t = full('0001', { problem: PROBLEM, outcome: OUTCOME });
  const s = { tickets: [t], ideas: [] };
  const p = fakePage([s, clone(s), clone(s)]);
  await p.settle();
  click(top(items(p)[0]));
  const item = items(p)[0];
  const problem = planSection(item, 'Problem'), outcome = planSection(item, 'Outcome');
  const all = [...problem, ...outcome].flatMap(n => p.all(n));
  for (const tag of ['strong', 'em', 'code', 'ul', 'ol', 'li', 'h5', 'h6', 'a', 'pre']) assert.ok(all.some(n => n.tagName === tag), `it has a ${tag}`);
  assert.deepEqual(all.filter(n => n.tagName === 'a').map(a => a.href), ['https://example.com/a', 'http://x.y']);
  click(p.all(item).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  assert.deepEqual(problem.map(shape), [...paneSection(p, 'Problem')].map(shape), 'Problem as in the pane');
  assert.deepEqual(outcome.map(shape), [...paneSection(p, 'Outcome')].map(shape), 'Outcome as in the pane');
});

const NOTE = [
  '# A note',
  '',
  'Captured: 2026-10-13 · Status: inbox',
  'From ticket: 0141',
  '',
  '## What',
  'Some **bold** and `code`, see [docs](https://example.com/d).',
  '',
  '| # | Thing | Why |',
  '|---|---|---|',
  '| 1 | **One** | a \\| pipe |',
  '| 2 | Two | `x` |',
  '',
  '- a point',
  '- another',
].join('\n');

// Opens an idea (1) or an inbox note (2), the only card in Capture (0520), and returns its note.
async function openNote(list, body) {
  const s = { tickets: [], ideas: [idea('Note', list === 2 ? 'inbox' : 'idea', body)] };
  const p = fakePage([s, clone(s), clone(s)]);
  await p.settle();
  click(top(notes(p)[0]));
  const note = p.all(notes(p)[0]).find(n => /\bnote\b/.test(n.className || ''));
  assert.ok(note, 'the opened item shows its note');
  return { p, note };
}

for (const [list, name] of [[1, 'idea'], [2, 'inbox note']]) {
  test(`0142 AC2: an opened ${name}'s whole text is formatted, its tables included`, async () => {
    const { p, note } = await openNote(list, NOTE);
    assert.equal(tags(p, note, 'pre').length, 0, 'not shown as preformatted text');
    assert.deepEqual(note.children.map(n => n.tagName), ['h5', 'p', 'h6', 'p', 'table', 'ul']);
    assert.equal(note.children[1].textContent, 'Captured: 2026-10-13 · Status: inbox\nFrom ticket: 0141');
    const [table] = tags(p, note, 'table');
    assert.deepEqual(tags(p, table, 'th').map(c => c.textContent), ['#', 'Thing', 'Why']);
    assert.deepEqual(tags(p, table, 'tr').slice(1).map(r => tags(p, r, 'td').map(c => c.textContent)), [['1', 'One', 'a | pipe'], ['2', 'Two', 'x']]);
    assert.ok(tags(p, table, 'strong').some(n => n.textContent === 'One'));
    assert.ok(tags(p, note, 'strong').some(n => n.textContent === 'bold'));
    assert.ok(tags(p, note, 'code').some(n => n.textContent === 'code'));
    assert.deepEqual(tags(p, note, 'a').map(a => a.href), ['https://example.com/d']);
    assert.deepEqual(tags(p, note, 'li').map(n => n.textContent), ['a point', 'another']);
  });
}

test('0142 AC2: a note that isn\'t text shows nothing, and an empty one no blocks', async () => {
  for (const body of [null, 42, ['x'], '']) {
    const { note } = await openNote(1, body);
    assert.equal(note.textContent, '');
  }
});

const HTML = 'A <b>x</b> and <script>alert(1)</script> and <img src=x onerror=alert(1)>.';
const MADE = ['b', 'script', 'img'];

test('0142 AC3: HTML in a draft\'s Problem or Outcome shows as written', async () => {
  const s = { tickets: [full('0001', { problem: HTML, outcome: '<script>alert(2)</script>' })], ideas: [] };
  const p = fakePage([s, clone(s)]);
  await p.settle();
  click(top(items(p)[0]));
  const item = items(p)[0];
  assert.ok(!p.all(item).some(n => MADE.includes(n.tagName)), 'no HTML was made from it');
  assert.equal(planSection(item, 'Problem').map(n => n.textContent).join(''), HTML);
  assert.equal(planSection(item, 'Outcome').map(n => n.textContent).join(''), '<script>alert(2)</script>');
});

for (const [list, name] of [[1, 'idea'], [2, 'inbox note']]) {
  test(`0142 AC3: HTML in an ${name} shows as written, in a table too`, async () => {
    const body = `${HTML}\n\n| a | b |\n|---|---|\n| <b>c</b> | <script>d</script> |\n\n<div>\nkept\n</div>`;
    const { p, note } = await openNote(list, body);
    assert.ok(!p.all(note).slice(1).some(n => [...MADE, 'div'].includes(n.tagName)), 'no HTML was made from it');
    assert.ok(note.textContent.includes(HTML));
    assert.deepEqual(tags(p, note, 'td').map(c => c.textContent), ['<b>c</b>', '<script>d</script>']);
    assert.ok(note.textContent.includes('<div>\nkept\n</div>'));
  });
}

// The fake page counts each node's removals in `detached`; a selection survives while nothing from the node up to the
// Shaping list has been taken out (as 0040's tests check it).
const held = (p, node) => {
  const chain = [];
  const lists = [p.byId('shaping'), p.byId('capture')]; // 0520: or Capture's
  for (let at = node; at; at = at.parentNode) { chain.push([at, at.detached || 0]); if (lists.includes(at)) break; }
  assert.ok(lists.includes(chain[chain.length - 1][0]), 'the node is in the Shaping or Capture list');
  return () => chain.every(([n, d], i) => (n.detached || 0) === d && (i === chain.length - 1 || n.parentNode === chain[i + 1][0]));
};

test('0142 AC4: text selected in an opened draft, idea or inbox note stays on the page across refreshes', async () => {
  const s = { tickets: [full('0001', { problem: PROBLEM, outcome: OUTCOME }), full('0002')],
    ideas: [idea('Idea', 'idea', NOTE), idea('Other', 'idea'), idea('Inbox', 'inbox', NOTE)] };
  const next = clone(s);
  next.tickets[1].title = 'Changed elsewhere';
  next.ideas[1].body = 'Changed.';
  const p = fakePage([s, next, clone(next), clone(next), clone(next), clone(next), clone(next)]);
  await p.settle();
  click(top(items(p)[0]));
  const draft = held(p, p.all(items(p)[0]).find(n => n.tagName === 'strong'));
  await refresh(p);
  await refresh(p);
  assert.ok(draft(), 'the draft\'s formatted text stayed on the page');
  click(top(notes(p)[0])); // 0520: in Capture
  const ideaKept = held(p, tags(p, notes(p)[0], 'td')[1]);
  await refresh(p);
  await refresh(p);
  assert.ok(ideaKept(), 'the idea\'s formatted text stayed on the page');
  const inbox = () => notes(p).find(n => /\binbox\b/.test(n.className));
  click(top(inbox()));
  const inboxKept = held(p, tags(p, inbox(), 'li')[0]);
  await refresh(p);
  await refresh(p);
  assert.ok(inboxKept(), 'the inbox note\'s formatted text stayed on the page');
});

test('0142 AC1 and AC2: the opened view styles its formatted Markdown, not as preformatted text', () => {
  const css = styles();
  const rule = sel => (css.match(new RegExp(`(?:^|\\n)\\s*([^{}\\n]*${sel.replace(/[.*]/g, '\\$&')}[^{}\\n]*)\\{([^}]*)\\}`)) || [])[2] || '';
  assert.doesNotMatch(rule('.note '), /white-space:\s*pre/, 'a note is no longer preformatted');
  assert.doesNotMatch(rule('.detail p.text'), /white-space:\s*pre/, 'a draft\'s paragraph wraps as the pane\'s does');
  for (const sel of ['.shaping .md table', '.shaping code.md-code', '.shaping .md pre', '.shaping .md-h1']) assert.ok(rule(sel), `${sel} is styled`);
});

const chrome = findChrome();
test('0142 AC4: in a browser, a selection in an opened draft\'s and idea\'s formatted text survives the refreshes', { skip: !chrome && 'no Chrome or Chromium installed' }, async () => {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0001-x.md'), `---\n${fm()}\n---\n## Problem\nUsers **cannot export** bookings at all.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`);
  const ideas = path.join(r.dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  fs.writeFileSync(path.join(ideas, 'note.md'), '# A parked idea\n\nStatus: idea\n\n| a | b |\n|---|---|\n| The **cell** text to select | b |\n');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  const wait = ms => new Promise(res => setTimeout(res, ms));
  try {
    const item = '#shaping .item';
    await b.until(`!!document.querySelector('${item} .title')`, 'the draft');
    await b.js(openLane('plan')); // 0410
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .detail strong')`, 'the draft to open, formatted');
    await b.drag(await b.js(charAt(`${item} .detail strong`, 0)), await b.js(charAt(`${item} .detail strong`, 6)));
    assert.equal(await sel(), 'cannot');
    await wait(4500);
    assert.equal(await sel(), 'cannot', 'kept through refreshes');

    await b.js('getSelection().removeAllRanges()');
    await b.js(openLane('capture')); // 0520: ideas are in Capture
    const card = '#capture .item';
    await b.until(`!!document.querySelector('${card}.idea .title')`, 'the idea');
    await b.js(`document.querySelector('${card} .title').click()`);
    await b.until(`!!document.querySelector('${card}.open .note td')`, 'the idea to open, formatted');
    const cell = `${card}.open .note td`;
    await b.drag(await b.js(charAt(cell, 0)), await b.js(charAt(cell, 3)));
    assert.equal(await sel(), 'The');
    await wait(4500);
    assert.equal(await sel(), 'The', 'kept through refreshes');
  } finally {
    await b.close();
    await stop(panel);
  }
});
