import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click, panelModel, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';
import { panelBoard } from '../scripts/board-feed.mjs';

// ---------- 0467: an open ticket shows its dependencies in a small box under its table ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const pad = n => String(n).padStart(4, '0');

// A draft waiting on four: two shipped, one building, one queued, and a ready chain 0010 → … → 0017.
const TICKETS = () => [
  full('0100', { title: 'Waits on four', after: ['0204', '0201', '0203', '0202'], waiting_on: ['0204', '0203'] }),
  T('0201', 'done'), T('0202', 'done'), T('0203', 'building', { started: new Date().toISOString() }), T('0204', 'ready'),
  T('0010', 'done'), T('0011', 'done', { after: ['0010'] }), T('0012', 'reviewing', { after: ['0011'], started: new Date().toISOString() }),
  T('0013', 'ready', { after: ['0012'], waiting_on: ['0012'] }),
  full('0014', { after: ['0013'], waiting_on: ['0013'] }), full('0015', { after: ['0014'], waiting_on: ['0014'] }),
  full('0016', { after: ['0014'], waiting_on: ['0014'] }), full('0017', { after: ['0015'], waiting_on: ['0015'] }),
  full('0300', { title: 'Alone' }),
];
const board = (tickets = TICKETS()) => ({ run: { on: false }, ideas: [], tickets });
const model = (tickets = TICKETS()) => panelModel()(board(tickets));
const depsIn = (m, id) => [...m.drafts, ...m.queue].find(t => t.id === id).deps;

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const cls = (n, re) => n.children.find(c => re.test(c.className));
async function openCard(p, id) {
  let card = items(p).find(n => idOf(p, n) === id);
  if (card) {
    if (!/\bopen\b/.test(card.className)) { click(top(card)); await p.settle(); }
    card = items(p).find(n => idOf(p, n) === id);
    return [card, top(card)];
  }
  card = queueRows(p).find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card.className)) { click(card.children[0]); await p.settle(); }
  card = queueRows(p).find(n => idOf(p, n) === id);
  return [card, card.children[0]];
}
const boxOf = (p, n) => p.all(n).find(x => /^deps\b/.test(x.className || ''));
const chipsOf = (p, box) => cls(box, /^deps-grid$/).children;
const slotsOf = box => cls(box, /^deps-slots$/).children;
const slotText = s => [s.className, s.textContent];

test('0467 AC1: the model gives a ticket waiting on two or more a Waits on box, in id order, with each one\'s state', () => {
  assert.deepEqual(depsIn(model(), '0100'), { kind: 'waits', shipped: 2, building: 1, queued: 1,
    items: [{ id: '0201', state: 'shipped' }, { id: '0202', state: 'shipped' }, { id: '0203', state: 'building' }, { id: '0204', state: 'queued' }] });
  // repeated and its own id count once and not at all; an id not on the board is shipped when waiting_on leaves it out
  const odd = depsIn(model([full('0100', { after: ['0100', '9', '0203', '0203'], waiting_on: ['0203'] }), T('0203', 'blocked')]), '0100');
  assert.deepEqual(odd.items, [{ id: '9', state: 'shipped' }, { id: '0203', state: 'building' }]);
});

test('0467 AC1: an open card waiting on four shows the counts, the bar, the unshipped chips and a +2 shipped chip that shows and hides the rest', async () => {
  const p = boardPage([board()]);
  await p.settle();
  const [card0, head] = await openCard(p, '0100');
  assert.equal(head.children[head.children.length - 1].className, 'facts', 'its top row ends with its table');
  const box = card0.children[card0.children.indexOf(head) + 1].children[0]; // first in its details, under its top row
  assert.equal(box.className, 'deps deps-waits', 'right under its table');
  assert.deepEqual(cls(box, /^deps-head$/).children.map(n => n.textContent), ['Waits on', '2 shipped · 1 building · 1 queued']);
  assert.deepEqual(cls(box, /^deps-bar$/).children.map(n => n.className), ['shipped', 'shipped', 'building', 'queued']);
  assert.deepEqual(chipsOf(p, box).map(c => [c.className, c.textContent]), [['chip building', '0203'], ['chip queued', '0204'], ['chip more', '+2 shipped']]);
  const more = chipsOf(p, box)[2];
  assert.equal(more.tagName, 'button');
  assert.equal(more.attrs['aria-expanded'], 'false');
  p.press(more);
  await p.settle();
  const [card] = await openCard(p, '0100');
  assert.match(card.className, /\bopen\b/, 'pressing it leaves the card open');
  const shown = boxOf(p, card);
  assert.deepEqual(chipsOf(p, shown).map(c => c.textContent), ['0203', '0204', '0201', '0202', 'Hide shipped']);
  assert.deepEqual(chipsOf(p, shown).slice(2, 4).map(c => c.className), ['chip shipped', 'chip shipped']);
  p.press(chipsOf(p, shown)[4]);
  await p.settle();
  assert.deepEqual(chipsOf(p, boxOf(p, (await openCard(p, '0100'))[0])).map(c => c.textContent), ['0203', '0204', '+2 shipped'], 'hidden again');
  // a count of 0 is left out, and none shipped means no shipped chip
  const q = boardPage([board([full('0100', { after: ['0204', '0205'], waiting_on: ['0204', '0205'] }), T('0204', 'ready'), T('0205', 'ready')])]);
  await q.settle();
  const b = boxOf(q, (await openCard(q, '0100'))[0]);
  assert.equal(cls(b, /^deps-head$/).children[1].textContent, '2 queued');
  assert.deepEqual(chipsOf(q, b).map(c => c.textContent), ['0204', '0205']);
});

test('0467 AC2: the model gives a chain its five slots, with +n at an end that has more', () => {
  const m = model();
  assert.deepEqual(depsIn(m, '0013'), { kind: 'chain', before: 3, after: 4,
    slots: [{ more: 2 }, { id: '0012', state: 'building' }, { id: '0013', state: 'self' }, { id: '0014', state: 'queued' }, { more: 3 }] });
  assert.deepEqual(depsIn(m, '0015'), { kind: 'chain', before: 5, after: 1,
    slots: [{ more: 4 }, { id: '0014', state: 'queued' }, { id: '0015', state: 'self' }, { id: '0017', state: 'queued' }, null] });
  assert.deepEqual(depsIn(m, '0017').slots.slice(0, 2), [{ more: 5 }, { id: '0015', state: 'queued' }]);
  // two before it, all shown, and one after it with a sibling beyond
  const short = model([T('0001', 'done'), T('0002', 'ready', { after: ['0001'] }), full('0003', { after: ['0002'], waiting_on: ['0002'] }), full('0004', { after: ['0003'], waiting_on: ['0003'] }), full('0005', { after: ['0003'], waiting_on: ['0003'] })]);
  assert.deepEqual(depsIn(short, '0003'), { kind: 'chain', before: 2, after: 2,
    slots: [{ id: '0001', state: 'shipped' }, { id: '0002', state: 'queued' }, { id: '0003', state: 'self' }, { id: '0004', state: 'queued' }, { more: 1 }] });
  // a ticket only others wait on starts a chain; one with neither has no box
  assert.deepEqual(depsIn(short, '0002').slots, [null, { id: '0001', state: 'shipped' }, { id: '0002', state: 'self' }, { id: '0003', state: 'queued' }, { more: 2 }]);
  assert.equal(depsIn(model(), '0300'), null);
  // a loop through after: stops rather than going round
  const loop = model([full('0001', { after: ['0002'], waiting_on: ['0002'] }), full('0002', { after: ['0001'], waiting_on: ['0001'] })]);
  assert.deepEqual(depsIn(loop, '0001'), { kind: 'chain', before: 1, after: 1, slots: [null, { id: '0002', state: 'queued' }, { id: '0001', state: 'self' }, { id: '0002', state: 'queued' }, null] });
});

test('0467 AC2: an open card in a chain shows the Chain box: its header, then five slots, each a circle over an id, a shipped one green and ticked, one building blue', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const [id, header] of [['0013', '3 before · 4 after'], ['0014', '4 before · 3 after']]) {
    const [card, head] = await openCard(p, id);
    const box = boxOf(p, card);
    assert.equal(box.className, 'deps deps-chain');
    assert.equal(head.children[head.children.length - 1].className, 'facts', `${id}: its top row ends with its table`);
    const under = card.children[card.children.indexOf(head) + 1];
    assert.equal(under.className === 'detail' ? under.children[0] : under, box, `${id}: right under it`);
    assert.deepEqual(cls(box, /^deps-head$/).children.map(n => n.textContent), ['Chain', header]);
    assert.equal(slotsOf(box).length, 5);
  }
  const box = boxOf(p, (await openCard(p, '0013'))[0]);
  assert.deepEqual(slotsOf(box).map(slotText), [['slot more', '+2'], ['slot building', '0012'], ['slot self', '0013'], ['slot queued', '0014'], ['slot more', '+3']]);
  for (const s of slotsOf(box)) assert.deepEqual(s.children.map(c => c.className), ['dot', 'sid'], 'a circle over an id');
  const q = boardPage([board([T('0001', 'done'), full('0002', { after: ['0001'] })])]);
  await q.settle();
  const b = boxOf(q, (await openCard(q, '0002'))[0]);
  assert.deepEqual(slotsOf(b).map(slotText), [['slot', ''], ['slot shipped', '0001'], ['slot self', '0002'], ['slot', ''], ['slot', '']]);
  assert.match(styles(), /\.deps \.slot\.shipped \.dot \{ border-color: var\(--green\)/, 'a shipped one\'s circle is green');
  assert.match(styles(), /\.deps \.slot\.shipped \.dot::after \{[^}]*border-width: 0 2px 2px 0; transform: rotate\(45deg\)/, 'with a tick');
  assert.match(styles(), /\.deps \.slot\.building \.dot \{ border-color: var\(--blue\)/, 'one building is blue');
  assert.equal(cls(b, /^deps-head$/).children[1].textContent, '1 before · 0 after');
  // neither: no box
  const [alone] = await openCard(p, '0300');
  assert.equal(boxOf(p, alone), undefined);
});

test('0467 AC3: pressing a chip or a circle goes to that ticket, opening its tab; one not on the page is no button', async () => {
  const p = boardPage([board()]);
  await p.settle();
  const [card] = await openCard(p, '0100');
  const chip = chipsOf(p, boxOf(p, card))[1];
  assert.equal(chip.tagName, 'button');
  assert.equal(chip.attrs['aria-label'], 'Go to ticket 0204, queued');
  p.press(chip);
  await p.settle();
  assert.equal(p.byId('tab-build').attrs['aria-selected'], 'true', 'its tab opens');
  assert.match(queueRows(p).find(n => idOf(p, n) === '0204').className, /\bflash\b/, 'and it lights up');
  assert.match((await openCard(p, '0100'))[0].className, /\bopen\b/, 'the card it was in stays open');
  const [chained] = await openCard(p, '0013');
  const slots = slotsOf(boxOf(p, chained));
  p.press(slots[3]);
  await p.settle();
  assert.equal(p.byId('tab-plan').attrs['aria-selected'], 'true');
  assert.match(items(p).find(n => idOf(p, n) === '0014').className, /\bflash\b/);
  assert.notEqual(slots[2].tagName, 'button', 'itself is no button');
  // a shipped ticket isn't on the page, so its chip is plain
  const [again] = await openCard(p, '0100');
  p.press(chipsOf(p, boxOf(p, again))[2]);
  await p.settle();
  const shipped = chipsOf(p, boxOf(p, (await openCard(p, '0100'))[0]))[2];
  assert.equal(shipped.textContent, '0201');
  assert.equal(shipped.tagName, 'span');
});

test('0467 AC4: the full ticket shows the same box under its table, and no open card has the line of ids', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0013', '0014']) {
    const [card, head] = await openCard(p, id);
    const want = boxOf(p, card).textContent;
    assert.doesNotMatch(head.textContent, /(after|unlocks|waiting on) \d/, `${id}: no line of ids`);
    p.press(p.all(card).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
    await p.settle();
    const steps = p.byId('full-ticket').children[1];
    assert.equal(steps.children.length, 3, `${id}: track, table, then the box`);
    assert.equal(steps.children[2].textContent, want, `${id}: the same box`);
    p.press(p.all(p.byId('full-ticket')).find(n => n.className === 'close'));
    await p.settle();
  }
});

test('0467 AC3: in the full ticket, which covers the page, pressing a chip shows that ticket there', async () => {
  const p = boardPage([board()]);
  await p.settle();
  const [card] = await openCard(p, '0100');
  p.press(p.all(card).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
  const chip = chipsOf(p, p.byId('full-ticket').children[1].children[2])[1];
  assert.equal(chip.textContent, '0204');
  p.press(chip);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.equal(p.byId('full-ticket').children[0].children[0].textContent, '0204', 'the pane shows 0204');
});

test('0467: the board the panel sends keeps a cut-down shipped ticket\'s after:, which a chain walks through', () => {
  const old = Array.from({ length: 12 }, (_, i) => T(pad(i + 1), 'done', { after: i ? [pad(i)] : [], finished: new Date(2026, 0, i + 1).toISOString() }));
  const out = panelBoard(board([...old, full('0013', { after: ['0012'] })]));
  assert.deepEqual(out.tickets.find(t => t.id === '0001').after, []);
  assert.deepEqual(out.tickets.find(t => t.id === '0002').after, ['0001']);
  assert.equal(panelModel()(out).drafts[0].deps.before, 12);
});

// ---------- in a real browser ----------

const BIG = () => {
  const ids = Array.from({ length: 27 }, (_, i) => pad(1000 + i));
  return board([full('0452', { title: 'Release', after: ids, waiting_on: ids.slice(9) }),
    ...ids.map((id, i) => T(id, i < 9 ? 'done' : i < 12 ? 'building' : 'ready', i < 9 ? {} : { started: new Date().toISOString() })),
    T('0900', 'done'), T('0901', 'ready', { after: ['0900'] }), full('0902', { after: ['0901'], waiting_on: ['0901'] }), full('0903', { after: ['0902'], waiting_on: ['0902'] }),
    full('0904', { after: ['0903'], waiting_on: ['0903'] }), full('0905', { after: ['0903'], waiting_on: ['0903'] })]);
};
const stub = `(() => {
  const STATE = ${JSON.stringify(BIG())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '', truncated: false }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Opens the draft's card, shows its shipped chips, and measures each chip or slot against its column.
const MEASURE = id => `(async () => {
  const wait = async test => { for (let i = 0; i < 200 && !test(); i++) await new Promise(r => setTimeout(r, 20)); if (!test()) throw new Error('timed out: ' + test); };
  document.getElementById('tab-plan').click();
  const card = () => [...document.querySelectorAll('#shaping .item.ticket')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)});
  if (!card().classList.contains('open')) card().querySelector('.head').click();
  await wait(() => card().classList.contains('open') && card().querySelector('.deps'));
  const more = card().querySelector('.chip.more');
  if (more && more.getAttribute('aria-expanded') === 'false') { more.click(); await wait(() => card().querySelector('.chip.more').getAttribute('aria-expanded') === 'true'); }
  const box = card().querySelector('.deps'), grid = box.querySelector('.deps-grid, .deps-slots'), g = grid.getBoundingClientRect(), c = card().getBoundingClientRect();
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
  const out = { card: [c.left, c.right], grid: [g.left, g.right], box: [box.getBoundingClientRect().left, box.getBoundingClientRect().right], cols,
    kids: [...grid.children].map(n => { const r = n.getBoundingClientRect(), t = n.querySelector('.sid') || n.querySelector('span') || n; const s = getComputedStyle(t);
      const range = document.createRange(); range.selectNodeContents(t.firstChild); const lines = range.getClientRects().length;
      return { text: n.textContent, left: r.left, right: r.right, top: r.top, width: r.width, over: t.scrollWidth > t.clientWidth + 0.5, nowrap: s.whiteSpace === 'nowrap', lines }; }) };
  return out;
})()`;

test('0467 AC3: in a real browser from 320 px up, every chip and circle keeps to its slot with its id on one line, 27 tickets in after:', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const width of [320, 390, 768, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.querySelectorAll('#shaping .item.ticket').length === 5`, 'the panel');
      for (const [id, per] of [['0452', 6], ['0903', 5]]) {
        const m = await b.js(MEASURE(id)), at = `${width} ${id}`;
        assert.equal(m.cols.length, per, `${at}: ${per} columns`);
        assert.ok(m.box[0] >= m.card[0] - 0.5 && m.box[1] <= m.card[1] + 0.5, `${at}: the box inside its card`);
        if (id === '0452') assert.equal(m.kids.length, 28, `${at}: 27 chips and the shipped chip`);
        const col = (m.grid[1] - m.grid[0] - (per - 1) * 4) / per;
        for (const [i, k] of m.kids.entries()) {
          const wide = /shipped|Hide/.test(k.text) ? 2 : 1;
          // Chrome draws a button a whole number of pixels wide, so one can reach under a pixel into the 4 px gap
          assert.ok(k.left >= m.grid[0] - 0.5 && k.right < m.grid[1] + 1, `${at}: ${k.text} inside the box`);
          assert.ok(Math.abs(k.width - (col * wide + (wide - 1) * 4)) < 1, `${at}: ${k.text} fills its slot (${k.width} vs ${col})`);
          assert.ok(!k.over && k.nowrap && k.lines === 1, `${at}: ${k.text}'s id on one line, not cut (${JSON.stringify(k)})`);
          if (id === '0452' && i < 24) assert.ok(Math.abs(k.top - m.kids[i - (i % 6)].top) < 0.5, `${at}: ${k.text} in its row of six`);
        }
      }
    }
  } finally { await b.close(); await stop(panel); }
});
