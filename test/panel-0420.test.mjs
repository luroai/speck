import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, page as html, fakePage, shippedRows, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0420: each shipped ticket is a title line and one line of details, and the stats are one line ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// Midday local time, so "today" covers every ticket below that shipped minutes ago.
const NOW = new Date(2026, 9, 23, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'A shipped ticket whose title is long enough that it has to wrap onto a second line here';

const board = () => ({
  run: { on: false },
  tickets: [
    T('0401', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
    T('0402', 'done', { title: 'A bug fix', type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 500)], builder_cost_usd: 1.5 }),
    T('0403', 'done', { title: 'A fix of main', type: 'fix', priority: 0, finished: ago(1300) }),
    T('0404', 'done', { title: 'No ship time', started: ago(4000), rounds: [round(1, 500)] }),
    T('0405', 'done', { title: 'Nothing at all' }),
    T('0406', 'done', { title: 'Merged, not pushed', started: ago(2000), finished: ago(1400), ship: { running: false, unpushed: true, message: 'Merged, but the push failed: run git push.' } }),
    T('0407', 'done', { title: LONG, started: ago(2000), finished: ago(1500), rounds: [round(1, 500)] }),
  ],
  ideas: [],
});
const page = (states = [board()]) => fakePage(states, { Date: stoppedClock(NOW) });

const byClass = (p, node, cls) => p.all(node).filter(n => (n.className || '').split(' ').includes(cls));
const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const kids = n => n.children.map(c => c.className);
const lineOf = (p, id) => byClass(p, cardOf(p, id), 'line')[0];
const metaOf = (p, id) => byClass(p, cardOf(p, id), 'meta')[0];
const detailsOf = (p, id) => byClass(p, cardOf(p, id), 'details')[0];

test('0420 AC1: a shipped ticket is its id, title and bug or fix tag, then one line: when it shipped, then its figures, separated by " · "', async () => {
  const p = page();
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0401')), ['name', 'sum'], 'two lines and nothing else');
  assert.deepEqual(lineOf(p, '0401').children.map(n => [n.className, n.textContent]), [['id', '0401'], ['title-link', 'Every figure']], 'no tag: none after the title');
  // the tag after the title, on the title's line
  assert.deepEqual(lineOf(p, '0402').children.map(n => n.className), ['id', 'title-link', 'tags tag-row']);
  assert.deepEqual(byClass(p, lineOf(p, '0402'), 'tag').map(n => n.textContent), ['bug']);
  assert.deepEqual(byClass(p, lineOf(p, '0403'), 'tag').map(n => n.textContent), ['fix']);
  assert.deepEqual(kids(byClass(p, cardOf(p, '0402'), 'name')[0]), ['line'], 'no row of tags under the title');
  // the second line
  assert.equal(metaOf(p, '0401').textContent, '11:50 · 15 min · 2 rounds · $2.91');
  assert.equal(metaOf(p, '0402').textContent, '11:40 · 30 min · 1 round · $1.50');
  assert.equal(metaOf(p, '0403').textContent, '11:38', 'no figures: when it shipped alone');
  assert.equal(metaOf(p, '0404').textContent, '1 round', 'no ship time: its figures alone');
  assert.equal(metaOf(p, '0405'), undefined, 'neither: no text, only the Details button');
  assert.deepEqual(kids(byClass(p, cardOf(p, '0405'), 'sum')[0]), ['full-open details']);
  assert.equal(metaOf(p, '0401').title, 'Shipped 11:50 · 15 min · 2 rounds · $2.91', 'when it shipped, with the time, and its figures as its tooltip');
  assert.equal(metaOf(p, '0404').title, '1 round');
  assert.deepEqual(byClass(p, metaOf(p, '0401'), 'when').map(n => n.textContent), ['11:50']);
  assert.deepEqual(byClass(p, metaOf(p, '0401'), 'figline').map(n => n.textContent), ['15 min · 2 rounds · $2.91']);
});

test('0420 AC1: a kept card\'s ship time still turns from the time alone to the day after midnight', async () => {
  let at = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  const p = fakePage([board(), board()], { Date: Clock });
  await p.settle();
  assert.equal(byClass(p, metaOf(p, '0401'), 'when')[0].textContent, '11:50');
  const before = metaOf(p, '0401');
  at = NOW + 13 * 3600 * 1000;
  p.timers.shift()();
  await p.settle();
  assert.equal(byClass(p, metaOf(p, '0401'), 'when')[0].textContent, '23 Oct', 'the day alone, before today');
  assert.equal(metaOf(p, '0401'), before, 'the same card, kept');
  assert.equal(before.title, 'Shipped 23 Oct, 11:50 · 15 min · 2 rounds · $2.91', 'and its tooltip, with the time');
});

test('0420 AC2: a small Details button ends the second line, opens and closes the details, and the title opens the full ticket', async () => {
  const p = page([board(), board(), board()]);
  await p.settle();
  const sum = byClass(p, cardOf(p, '0401'), 'sum')[0];
  assert.deepEqual(kids(sum), ['meta', 'full-open details'], 'the line, then the button at its end');
  const d = detailsOf(p, '0401');
  assert.equal(d.tagName, 'button');
  assert.equal(d.textContent, 'Details');
  assert.equal(d.attrs['aria-expanded'], 'false');
  p.press(d);
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0401')), ['name', 'steps', 'full-cell']); // 0464: its steps and facts
  assert.equal(detailsOf(p, '0401').attrs['aria-expanded'], 'true');
  assert.ok(p.all(cardOf(p, '0401')).some(n => n.textContent === 'Review pack'));
  p.press(detailsOf(p, '0401'));
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0401')), ['name', 'sum']);
  p.press(lineOf(p, '0401').children[1]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the title opens the full ticket');
  assert.ok(p.byId('full-ticket').textContent.includes('0401'));
});

test('0420 AC3: the stats are one line, followed by More stats, which opens the other figures as before', async () => {
  const p = page([board(), board()]);
  await p.settle();
  const stats = p.byId('shipped-stats');
  assert.equal(stats.textContent, '5 today · median 13 min, $2.20');
  assert.match(html(), /<div class="stats-line" id="shipped-stats-line" hidden><div id="shipped-stats" hidden><\/div><button [^>]*id="more-stats"/, 'More stats follows the stats, in their line');
  assert.equal(p.byId('shipped-stats-line').hidden, false);
  const more = p.byId('more-stats');
  assert.equal(more.textContent, 'More stats');
  assert.equal(p.byId('shipped-more').hidden, true);
  p.press(more);
  await p.settle();
  assert.equal(p.byId('shipped-more').hidden, false);
  assert.equal(more.textContent, 'Fewer stats');
  assert.deepEqual(p.byId('shipped-more').children.map(n => byClass(p, n, 'label')[0].textContent), ['median review rounds', 'median reviewer tokens', 'median builder tokens']);
});

test('0420 AC3: a stat with nothing to cover shows a dash, a big one is shortened with the exact number as its tooltip, and with nothing shipped there is no line', async () => {
  const p = page([{ tickets: [T('0011', 'done', { started: ago(20000 * 60), finished: ago(0), builder_cost_usd: 12345.678 }), T('0012', 'done', { finished: ago(0) })], ideas: [] }]);
  await p.settle();
  assert.equal(p.byId('shipped-stats').textContent, '2 today · median 20k min, $12k');
  assert.deepEqual(byClass(p, p.byId('shipped-stats'), 'num').map(n => n.title || null), [null, '20,000', '$12,345.68']);
  const q = page([{ tickets: [T('0012', 'done', { finished: ago(0) })], ideas: [] }]);
  await q.settle();
  assert.equal(q.byId('shipped-stats').textContent, '1 today · median – min, –');
  const none = page([{ tickets: [T('0001', 'building')], ideas: [] }]);
  await none.settle();
  assert.equal(none.byId('shipped-stats').hidden, true);
  assert.equal(none.byId('more-stats').hidden, true);
  assert.equal(none.byId('shipped-stats-line').hidden, true, 'the whole line hidden');
});

test('0420 AC4: a ship that didn\'t push still shows its warning under its ticket', async () => {
  const p = page();
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0406')), ['name', 'sum', 'unpushed'], 'under the two lines');
  const u = byClass(p, cardOf(p, '0406'), 'unpushed')[0];
  assert.equal(u.textContent, 'Merged, but not pushedMerged, but the push failed: run git push.');
});

// ---------- in a real browser: a 420 px side pane with a mouse ----------

const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
const CARDS = `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.bottom) <= 4)) out.push(x.bottom); }
    return out.length; };
  const box = n => { const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; };
  const row = document.getElementById('shipped-stats-line'), more = document.getElementById('more-stats'), stats = document.getElementById('shipped-stats');
  // the room left in the stats line: its width inside its padding, less the stats' text, the gap and the button
  const cs = getComputedStyle(row), text = document.createRange(), probe = document.createElement('span');
  text.selectNodeContents(stats);
  probe.textContent = '000';
  stats.appendChild(probe);
  const digits = probe.getBoundingClientRect().width;
  probe.remove();
  const room = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.columnGap) - text.getBoundingClientRect().width - more.getBoundingClientRect().width;
  return { stats: { label: more.textContent, lines: lines(stats), box: box(stats), more: box(more), row: box(row), overflows: stats.getBoundingClientRect().right > row.getBoundingClientRect().right, room, digits },
    cards: [...document.querySelectorAll('#shipped tr')].map(c => {
      const title = c.querySelector('.title-link'), meta = c.querySelector('.meta'), details = c.querySelector('.details'), tag = c.querySelector('.line .tag');
      return { id: c.querySelector('.id').textContent, height: c.getBoundingClientRect().height, titleLines: lines(c.querySelector('.line')),
        metaLines: meta ? lines(meta) : 0, titleSize: parseFloat(getComputedStyle(title).fontSize), metaSize: meta ? parseFloat(getComputedStyle(meta).fontSize) : null,
        meta: meta && box(meta), details: box(details), card: box(c), title: box(title), tag: tag && box(tag), metaClipped: meta ? meta.scrollWidth > meta.clientWidth + 0.5 || meta.getBoundingClientRect().right > c.getBoundingClientRect().right : false, metaText: meta && meta.textContent, metaW: meta && [meta.scrollWidth, meta.clientWidth],
        titleCut: title.scrollWidth > title.clientWidth + 0.5 && getComputedStyle(title).textOverflow === 'ellipsis' };
    }) };
})()`;

test('0420 AC1, AC2, AC3 and AC5: at 420 px with a mouse, a shipped ticket whose title fits on one line is no more than 56 px tall, and the stats are one line', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    // shipped minutes ago and yesterday, so both the time alone and the date and time show
    const s = board(), real = Date.now(), at = sec => new Date(real - sec * 1000).toISOString();
    for (const t of s.tickets) for (const k of ['started', 'finished']) if (t[k]) t[k] = at((NOW - Date.parse(t[k])) / 1000);
    s.tickets.push(T('0408', 'done', { title: 'Shipped a while back', started: at(3 * 86400 + 900), finished: at(3 * 86400), rounds: [round(1, 500), round(2, 500), round(3, 500)], builder_cost_usd: 12.34 }));
    await b.send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(s) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length === 8`, 'the panel');
    assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), false, 'a mouse is the main pointer');
    await b.js(openLane('shipped'));
    const { stats, cards } = await b.js(CARDS);
    // AC3: the stats on one line, with More stats beside them, and still once it says Fewer stats, with room to spare
    // for bigger figures, such as "34 today" or "$12.85"
    for (const [label, st] of [['More stats', stats], ['Fewer stats', (await b.js(`(document.getElementById('more-stats').click(), true)`), await b.js(CARDS)).stats]]) {
      assert.equal(st.label, label);
      assert.equal(st.lines, 1, `${label}: the stats on one line`);
      assert.ok(!st.overflows, `${label}: the stats stay inside their line`);
      assert.ok(st.more.top < st.box.bottom && st.more.bottom > st.box.top, `${label}: on the same line`);
      assert.ok(st.more.left >= st.box.right - 0.5, `${label}: after the stats`);
      assert.ok(st.row.height <= 40, `${label}: the stats line is ${st.row.height} px tall`);
      assert.ok(st.room >= st.digits, `${label}: ${st.room.toFixed(1)} px to spare, less than three more digits (${st.digits.toFixed(1)} px)`);
    }
    for (const c of cards) {
      // AC1: the details line is smaller type, on one line, with Details at its end (AC2)
      if (c.meta) {
        assert.ok(c.metaSize < c.titleSize, `${c.id}: the details (${c.metaSize} px) are smaller than the title (${c.titleSize} px)`);
        assert.equal(c.metaLines, 1, `${c.id}: the details on one line`);
        assert.ok(!c.metaClipped, `${c.id}: the details fit, with none cut off: "${c.metaText}" ${c.metaW}`);
        assert.ok(c.details.left >= c.meta.right - 0.5 && c.details.top < c.meta.bottom && c.details.bottom > c.meta.top, `${c.id}: Details after them, on their line`);
      }
      assert.ok(c.details.top >= c.title.bottom - 0.5, `${c.id}: Details under the title`);
      assert.ok(c.details.right <= c.card.right, `${c.id}: Details inside the card`);
      if (c.tag) assert.ok(c.tag.top < c.title.bottom && c.tag.bottom > c.title.top, `${c.id}: the tag on the title's line`);
      // 0434: a closed card's long title is one line, cut off with an ellipsis, so the card is as tall as any other
      if (c.id === '0407') assert.ok(c.titleLines === 1 && c.titleCut, `0407: a long title is cut off on one line (${c.titleLines} lines)`);
      if (c.id === '0406') continue; // its warning is under its two lines (AC4)
      // AC5
      assert.equal(c.titleLines, 1, `${c.id}: the title fits on one line`);
      assert.ok(c.height <= 56, `${c.id}: ${c.height} px tall`);
    }
    assert.deepEqual(cards.map(c => c.id).sort(), ['0401', '0402', '0403', '0404', '0405', '0406', '0407', '0408']);
  } finally { await b.close(); await stop(panel); }
});
