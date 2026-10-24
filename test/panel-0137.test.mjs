import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fm, good, panelRepo, freePort, startPanel, stop, fakePage, T, shippedRows, queueRows, findChrome, browserPage, openDetails, openLane, styles } from './support/panel.mjs';

// ---------- 0137: open a shipped ticket by clicking its title ----------
// 0466: the title opens and closes the card in place, as a Build ticket's top row does, and the open card's Full
// ticket button opens the full ticket.

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = () => ({ ideas: [], tickets: [
  T('0005', 'approved', { started: ago(30) }), T('0007', 'ready'),
  T('0009', 'done', { started: ago(90), finished: ago(60), title: 'Shipped nine' }),
  T('0010', 'done', { started: ago(50), finished: ago(20), title: 'Shipped ten', type: 'bug' }),
] });
const pane = p => p.byId('full-ticket');
const paneId = p => (pane(p).hidden || !pane(p).children.length ? null : pane(p).children[0].children[0].textContent);
const rowOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const linkOf = (p, row) => p.all(row).find(n => n.className === 'title'); // a link until 0141, opening the card since 0466
const isOpen = (p, id) => /\bopen\b/.test(rowOf(p, id).className);
const buttonsOf = (p, row) => p.all(row).filter(n => n.tagName === 'button');
const css = () => styles();
const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0137 AC1 (0466): each Shipped row\'s title opens that card in place, and its Full ticket opens the full ticket pane', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  for (const [id, title] of [['0009', 'Shipped nine'], ['0010', 'Shipped ten']]) {
    const a = linkOf(p, rowOf(p, id));
    assert.ok(a, `${id}: a title`);
    assert.equal(a.textContent, title, `${id}: its text is the title`);
  }
  const opens = () => queueRows(p).map(r => r.className);
  const before = opens();
  p.press(linkOf(p, rowOf(p, '0010')));
  assert.ok(isOpen(p, '0010'), 'the card opens');
  assert.equal(paneId(p), null, 'and no full ticket');
  assert.equal(linkOf(p, rowOf(p, '0010')).href, undefined, 'the title goes to no other address (no address at all since 0141)');
  assert.deepEqual(opens(), before, 'nothing else opens or closes');
  p.press(buttonsOf(p, rowOf(p, '0010')).find(b => b.textContent === 'Full ticket'));
  assert.equal(paneId(p), '0010');
  assert.ok(pane(p).textContent.includes('Shipped ten'));
  assert.ok(!pane(p).textContent.includes('Review pack'), 'the full ticket, not the review pack');
});

test('0137 AC1: the id and the bug tag stay beside the title, outside it', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const row = rowOf(p, '0010');
  const a = linkOf(p, row);
  assert.equal(p.all(a).filter(n => n.className === 'id').length, 0, 'the id isn\'t in the link');
  assert.ok(!a.textContent.includes('bug'), 'nor is the tag');
  assert.ok(row.children[0].textContent.startsWith('0010'), 'the id comes first in the cell');
  assert.match(row.children[0].textContent, /bug/);
});

test('0137 AC1 (0466): the card\'s top row has a pointer cursor, and the title is no longer underlined as a link', () => {
  const rule = sel => (css().match(new RegExp(`\\n\\s*${sel.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
  assert.match(css(), /\n\s*#shipped tr \{[^}]*cursor:\s*pointer/);
  assert.match(css(), /\n\s*#shipped td\.unpushed, #shipped td\.full-cell \{[^}]*cursor:\s*auto/, 'not what\'s under it');
  assert.doesNotMatch(rule('#shipped .line .title'), /underline/);
  assert.doesNotMatch(css(), /title-link/);
});

test('0137 AC2: Tab reaches the title, and its text is the title', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const a = linkOf(p, rowOf(p, '0009'));
  assert.equal(a.tabIndex, 0); // an address made Tab reach it until 0141
  assert.equal(a.textContent, 'Shipped nine');
});

test('0137 AC1: a ticket with no title still gets a title to press, named by its id', async () => {
  const s = STATE();
  s.tickets.push(T('0011', 'done', { started: ago(40), finished: ago(10), title: '' }));
  s.tickets.push(T('0012', 'done', { started: ago(35), finished: ago(5), title: '   ' }));
  const p = fakePage([s, s]);
  await p.settle();
  const a = linkOf(p, rowOf(p, '0011'));
  assert.equal(a.textContent, 'Ticket 0011');
  assert.equal(linkOf(p, rowOf(p, '0012')).textContent, 'Ticket 0012', 'a title of only spaces too');
  p.press(a);
  assert.ok(isOpen(p, '0011'), 'it opens the card (0466)');
});

test('0137 AC3 (0466): a closed Shipped card has no buttons, an open one has Full ticket and Review pack, and Review pack opens the review pack', async () => {
  const p = fakePage([STATE(), { pack: '## 0010 · Shipped ten\n**Verdict:** ✅ Approved by reviewer\n' }, STATE()]);
  await p.settle();
  for (const id of ['0009', '0010']) assert.deepEqual(buttonsOf(p, rowOf(p, id)).map(b => b.textContent), [], id);
  await openDetails(p);
  // 0464: under the facts table. 0466: Full ticket first, as on an open Build card.
  for (const id of ['0009', '0010']) assert.deepEqual(buttonsOf(p, rowOf(p, id)).map(b => b.textContent), ['Full ticket', 'Review pack'], id);
  p.press(buttonsOf(p, rowOf(p, '0010'))[1]);
  await p.settle();
  assert.equal(paneId(p), '0010');
  assert.ok(pane(p).textContent.includes('Approved by reviewer'), 'the pack shows');
});

test('0137 AC1-AC4: in a real browser, the title opens the card by mouse and keyboard, Full ticket opens the full ticket, the title is named by its text, and the row stays slim', chrome, async () => {
  const r = panelRepo();
  r.write('0003-done.md', fm({ id: '"0003"', title: 'A shipped one', status: 'done', started: ago(70), finished: ago(60) }), good.replace('Users cannot export.', 'Watching a build.'), 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  const link = `document.querySelector('#shipped tr .title')`; // a link until 0141
  const cardOpen = `document.querySelector('#shipped tr').classList.contains('open') && document.getElementById('full-ticket').hidden`; // 0466
  const opened = `!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .id').textContent === '0003' && document.getElementById('full-ticket').textContent.includes('Watching a build.')`;
  const close = () => b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, ...(k === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }); };
  try {
    await b.until(`!!${link}`, 'the Shipped row\'s title');
    await b.js(openLane('shipped')); // 0410
    const look = await b.js(`(() => { const a = ${link}, s = getComputedStyle(a), probe = document.createElement('span');
      probe.style.color = 'var(--text)'; document.body.appendChild(probe); const text = getComputedStyle(probe).color; probe.remove();
      return { text: a.textContent, color: s.color, textColour: text, cursor: s.cursor, line: s.textDecorationLine, buttons: [...a.closest('tr').querySelectorAll('button')].map(x => x.textContent) }; })()`);
    assert.equal(look.text, 'A shipped one');
    assert.equal(look.color, look.textColour, 'AC1: the text colour (0167)');
    assert.equal(look.cursor, 'pointer', 'AC1: a pointer cursor');
    assert.equal(look.line, 'none', 'AC1: not underlined, as a Build title isn\'t (0466)');
    assert.deepEqual(look.buttons, [], 'AC3: no buttons on a closed card (0466)');
    const [x, y] = await b.js(`(r => [r.left + r.width / 2, r.top + r.height / 2])(${link}.getBoundingClientRect())`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    await b.until(cardOpen, 'AC1: the card opened from a click on the title');
    assert.equal(await b.js(`location.hash`), '', 'the address stays the same');
    await b.js(`[...document.querySelectorAll('#shipped tr.open button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(opened, 'AC1: Full ticket opened the pane');
    await close();
    assert.ok(await b.js(`document.getElementById('full-ticket').hidden`), 'closed again');
    await b.js(`${link}.click()`);
    await b.until(`!document.querySelector('#shipped tr').classList.contains('open')`, 'the card closed again');
    // AC2: Tab reaches the title, and Enter opens the card.
    await b.js(`document.activeElement && document.activeElement.blur()`);
    let reached = false;
    for (let i = 0; i < 200 && !reached; i++) { await key('Tab', 'Tab', 9); reached = await b.js(`document.activeElement === ${link}`); }
    assert.ok(reached, 'AC2: Tab reaches the title');
    await key('Enter', 'Enter', 13);
    await b.until(cardOpen, 'AC2: the card opened with Enter');
    assert.equal(await b.js(`location.hash`), '', 'the address stays the same');
    // AC2: screen readers get a link named by the title.
    await b.send('Accessibility.enable');
    const { nodes } = await b.send('Accessibility.getFullAXTree');
    assert.ok(nodes.some(n => n.role && n.role.value === 'button' && n.name && n.name.value === 'A shipped one'), 'AC2: a button named "A shipped one" (a link until 0141)');
    // AC4 until 0157, when each shipped ticket became a card: Review pack now sits at the bottom of the card, under the rest,
    // once it's open (0162, 0466).
    const [packTop, above] = await b.js(`(() => { const tr = document.querySelector('#shipped tr'), cell = tr.querySelector('td.full-cell');
      return [cell.getBoundingClientRect().top, Math.max(...[...tr.children].filter(n => n !== cell).map(n => n.getBoundingClientRect().bottom))]; })()`);
    assert.ok(packTop >= above - 0.5, `Review pack at ${packTop}px, the rest of the card down to ${above}px`);
  } finally { await b.close(); await stop(panel); }
});
