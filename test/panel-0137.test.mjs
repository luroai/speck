import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fm, good, panelRepo, freePort, startPanel, stop, fakePage, T, shippedRows, queueRows, findChrome, browserPage, openDetails } from './support/panel.mjs';

// ---------- 0137: open a shipped ticket by clicking its title ----------

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = () => ({ ideas: [], tickets: [
  T('0005', 'approved', { started: ago(30) }), T('0007', 'ready'),
  T('0009', 'done', { started: ago(90), finished: ago(60), title: 'Shipped nine' }),
  T('0010', 'done', { started: ago(50), finished: ago(20), title: 'Shipped ten', type: 'bug' }),
] });
const pane = p => p.byId('full-ticket');
const paneId = p => (pane(p).hidden || !pane(p).children.length ? null : pane(p).children[0].children[0].textContent);
const rowOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const linkOf = (p, row) => p.all(row).find(n => n.className === 'title-link'); // a link until 0141
const buttonsOf = (p, row) => p.all(row).filter(n => n.tagName === 'button');
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0137 AC1: each Shipped row\'s title is a link that opens that ticket in the full ticket pane, and nothing else', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  for (const [id, title] of [['0009', 'Shipped nine'], ['0010', 'Shipped ten']]) {
    const a = linkOf(p, rowOf(p, id));
    assert.ok(a, `${id}: a link`);
    assert.equal(a.textContent, title, `${id}: the link is the title`);
    assert.equal(a.className, 'title-link');
  }
  const opens = () => queueRows(p).map(r => r.className);
  const before = opens();
  let stopped = false;
  linkOf(p, rowOf(p, '0010')).listeners.click({ preventDefault() {}, stopPropagation() { stopped = true; } });
  assert.equal(paneId(p), '0010');
  assert.ok(pane(p).textContent.includes('Shipped ten'));
  assert.equal(linkOf(p, rowOf(p, '0010')).href, undefined, 'the title goes to no other address (no address at all since 0141)');
  assert.ok(stopped, 'the click goes no further');
  assert.deepEqual(opens(), before, 'nothing else opens or closes');
  p.press(linkOf(p, rowOf(p, '0009')));
  assert.equal(paneId(p), '0009', 'another title opens that ticket instead');
  assert.ok(!pane(p).textContent.includes('Review pack'), 'the full ticket, not the review pack');
});

test('0137 AC1: the id and the bug tag stay beside the title, outside the link', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const row = rowOf(p, '0010');
  const a = linkOf(p, row);
  assert.equal(p.all(a).filter(n => n.className === 'id').length, 0, 'the id isn\'t in the link');
  assert.ok(!a.textContent.includes('bug'), 'nor is the tag');
  assert.ok(row.children[0].textContent.startsWith('0010'), 'the id comes first in the cell');
  assert.match(row.children[0].textContent, /bug/);
});

test('0137 AC1: the link has a pointer cursor and, since 0167, is in the text colour and underlined, more thickly on hover', () => {
  const rule = sel => (css().match(new RegExp(`\\n\\s*${sel.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
  const base = rule('td .title-link'), hover = rule('td .title-link:hover');
  assert.match(base, /color:\s*var\(--text\)/);
  assert.match(base, /cursor:\s*pointer/);
  assert.match(base, /text-decoration:\s*underline/);
  assert.match(hover, /text-decoration-thickness:\s*2px/);
});

test('0137 AC2: the link has an address, so Tab reaches it and Enter opens it, and its text is the title', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const a = linkOf(p, rowOf(p, '0009'));
  assert.equal(a.tabIndex, 0); // an address made Tab reach it until 0141
  assert.equal(a.textContent, 'Shipped nine');
});

test('0137 AC1: a ticket with no title still gets a link to click, named by its id', async () => {
  const s = STATE();
  s.tickets.push(T('0011', 'done', { started: ago(40), finished: ago(10), title: '' }));
  s.tickets.push(T('0012', 'done', { started: ago(35), finished: ago(5), title: '   ' }));
  const p = fakePage([s, s]);
  await p.settle();
  const a = linkOf(p, rowOf(p, '0011'));
  assert.equal(a.textContent, 'Ticket 0011');
  assert.equal(linkOf(p, rowOf(p, '0012')).textContent, 'Ticket 0012', 'a title of only spaces too');
  p.press(a);
  assert.equal(paneId(p), '0011');
});

test('0137 AC3: each Shipped row has exactly one button, Details, which shows Review pack (0162), and Review pack opens the review pack', async () => {
  const p = fakePage([STATE(), { pack: '## 0010 · Shipped ten\n**Verdict:** ✅ Approved by reviewer\n' }, STATE()]);
  await p.settle();
  // 0162: Details is the card's one button, and opening it shows Review pack.
  for (const id of ['0009', '0010']) assert.deepEqual(buttonsOf(p, rowOf(p, id)).map(b => b.textContent), ['Details'], id);
  await openDetails(p);
  for (const id of ['0009', '0010']) assert.deepEqual(buttonsOf(p, rowOf(p, id)).map(b => b.textContent), ['Details', 'Review pack'], id);
  p.press(buttonsOf(p, rowOf(p, '0010'))[1]);
  await p.settle();
  assert.equal(paneId(p), '0010');
  assert.ok(pane(p).textContent.includes('Approved by reviewer'), 'the pack shows');
});

test('0137 AC1-AC4: in a real browser, the title link opens the full ticket by mouse and keyboard, is named by its title, and the row stays slim', chrome, async () => {
  const r = panelRepo();
  r.write('0003-done.md', fm({ id: '"0003"', title: 'A shipped one', status: 'done', started: ago(70), finished: ago(60) }), good.replace('Users cannot export.', 'Watching a build.'), 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  const link = `document.querySelector('#shipped tr .title-link')`; // a link until 0141
  const opened = `!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .id').textContent === '0003' && document.getElementById('full-ticket').textContent.includes('Watching a build.')`;
  const close = () => b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, ...(k === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }); };
  try {
    await b.until(`!!${link}`, 'the Shipped row\'s title link');
    const look = await b.js(`(() => { const a = ${link}, s = getComputedStyle(a), probe = document.createElement('span');
      probe.style.color = 'var(--text)'; document.body.appendChild(probe); const text = getComputedStyle(probe).color; probe.remove();
      return { text: a.textContent, color: s.color, textColour: text, cursor: s.cursor, line: s.textDecorationLine, buttons: [...a.closest('tr').querySelectorAll('button')].map(x => x.textContent) }; })()`);
    assert.equal(look.text, 'A shipped one');
    assert.equal(look.color, look.textColour, 'AC1: the text colour (0167)');
    assert.equal(look.cursor, 'pointer', 'AC1: a pointer cursor');
    assert.equal(look.line, 'underline', 'AC1: underlined, to show it can be clicked (0167)');
    assert.deepEqual(look.buttons, ['Details'], 'AC3: only Details, which holds Review pack (0162)');
    const [x, y] = await b.js(`(r => [r.left + r.width / 2, r.top + r.height / 2])(${link}.getBoundingClientRect())`);
    await b.move([x, y]);
    assert.equal(await b.js(`getComputedStyle(${link}).textDecorationThickness`), '2px', 'AC1: underlined more thickly on hover');
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    await b.until(opened, 'AC1: the pane opened from a click on the title');
    assert.equal(await b.js(`location.hash`), '', 'the address stays the same');
    await close();
    assert.ok(await b.js(`document.getElementById('full-ticket').hidden`), 'closed again');
    // AC2: Tab reaches the link, and Enter opens it.
    await b.js(`document.activeElement && document.activeElement.blur()`);
    let reached = false;
    for (let i = 0; i < 200 && !reached; i++) { await key('Tab', 'Tab', 9); reached = await b.js(`document.activeElement === ${link}`); }
    assert.ok(reached, 'AC2: Tab reaches the title link');
    await key('Enter', 'Enter', 13);
    await b.until(opened, 'AC2: the pane opened with Enter');
    assert.equal(await b.js(`location.hash`), '', 'the address stays the same');
    await close();
    // AC2: screen readers get a link named by the title.
    await b.send('Accessibility.enable');
    const { nodes } = await b.send('Accessibility.getFullAXTree');
    assert.ok(nodes.some(n => n.role && n.role.value === 'button' && n.name && n.name.value === 'A shipped one'), 'AC2: a button named "A shipped one" (a link until 0141)');
    // AC4 until 0157, when each shipped ticket became a card: Review pack now sits at the bottom of the card, under the rest,
    // once Details has opened it (0162).
    await b.js(`document.querySelector('#shipped tr .details').click()`);
    const [packTop, above] = await b.js(`(() => { const tr = document.querySelector('#shipped tr'), cell = tr.querySelector('td.full-cell');
      return [cell.getBoundingClientRect().top, Math.max(...[...tr.children].filter(n => n !== cell).map(n => n.getBoundingClientRect().bottom))]; })()`);
    assert.ok(packTop >= above - 0.5, `Review pack at ${packTop}px, the rest of the card down to ${above}px`);
  } finally { await b.close(); await stop(panel); }
});
