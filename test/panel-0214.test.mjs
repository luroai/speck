import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, full, idea, click, items, notes, top, openLane } from './support/panel.mjs';

// ---------- 0214: Plan's idea and inbox cards get a ticket card's larger title (0520: in Capture now) ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// A title long enough to wrap even at 1,280 px, and a short one. 0410: Plan is the full width there now, so it's longer.
const LONG = 'Let the panel say which of the reviewer findings were fixed, which were disputed and which are still open after the last round, so nobody has to read the log, '
  + 'and say it again in the review pack, with each finding\'s round and the reviewer who raised it';
const STATE = {
  run: { on: false },
  tickets: [full('0201', { title: 'A ticket' })],
  ideas: [{ ...idea('2026-10-15-a-long-idea', 'idea'), title: LONG }, idea('2026-10-15-short', 'idea'),
    { ...idea('2026-10-15-a-long-follow-up', 'inbox', '# A long follow-up\n\nStatus: inbox\nFrom ticket: 0139\n\nSome text.\n'), title: LONG },
    idea('2026-10-15-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0140\n\nSome text.\n')],
};

// ----- AC2 and AC4: the cards' parts, without a browser -----

const lineOf = item => top(item).children[0];
// 0520: ideas and inbox notes are one list in Capture, each card marked with its kind
const VIEWS = [['ideas', 'idea'], ['inbox', 'inbox']];
const cardsOf = (p, kind) => notes(p).filter(n => new RegExp(`\\b${kind}\\b`).test(n.className));

for (const [view, kind] of VIEWS) {
  test(`0214 AC2: in ${view}, a card's title is on a line like a ticket's id and title, with no label before it since 0435`, async () => {
    const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
    await p.settle();
    const ticketLine = lineOf(items(p)[0]);
    assert.deepEqual(ticketLine.children.map(n => n.className), ['id', 'title']);
    const cards = cardsOf(p, kind);
    assert.equal(cards.length, 2);
    for (const card of cards) {
      const line = lineOf(card);
      assert.equal(line.className, ticketLine.className, 'the same line as a ticket card');
      assert.deepEqual(line.children.map(n => n.className), ['title']);
    }
    assert.equal(lineOf(cards[0]).children[0].textContent, LONG);
  });

  test(`0214 AC4: in ${view}, a card still opens and closes, and the row under the title keeps its ${view === 'ideas' ? 'status' : 'from ticket'}, without the path since 0435`, async () => {
    const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
    await p.settle();
    const checks = cardsOf(p, kind).map(n => top(n).children.find(c => /\bchecks\b/.test(c.className)).children.filter(c => !/\btag\b/.test(c.className)).map(c => c.textContent)); // 0521: not an agent tag
    if (view === 'ideas') assert.deepEqual(checks, [['No capture date'], ['No capture date']]); // 0520: only notes whose status is idea, which isn't repeated
    else assert.deepEqual(checks, [['From 0139 · No capture date'], ['From 0140 · No capture date']]);
    click(top(cardsOf(p, kind)[0]));
    assert.match(cardsOf(p, kind)[0].className, /\bopen\b/);
    assert.match(cardsOf(p, kind)[0].textContent, /Status: /);
    click(top(cardsOf(p, kind)[0]));
    assert.doesNotMatch(cardsOf(p, kind)[0].className, /\bopen\b/);
    assert.doesNotMatch(cardsOf(p, kind)[0].textContent, /Status: /);
  });
}

// ----- AC1 and AC3: sizes and wrapping, in a real browser -----

const stub = `(() => {
  try { localStorage.setItem('speck-theme', 'light'); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

// Each card showing that the selector picks (Plan's, or 0520: Capture's of one kind): its label's and title's sizes,
// the title's lines, where the label is, and whether any of the title is hidden.
const CARDS = sel => `[...document.querySelectorAll('${sel}')].map(item => {
  const id = item.querySelector('.id'), t = item.querySelector('.title'), s = getComputedStyle(t), range = document.createRange();
  range.selectNodeContents(t);
  const lines = [];
  for (const r of range.getClientRects()) {
    if (!r.width) continue;
    const same = lines.find(l => Math.abs(l.top - r.top) < 2);
    if (same) { same.left = Math.min(same.left, r.left); same.right = Math.max(same.right, r.right); }
    else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
  }
  const box = item.getBoundingClientRect(), idBox = id && id.getBoundingClientRect();
  return { label: id && id.textContent, title: t.textContent, idSize: id && getComputedStyle(id).fontSize, titleSize: s.fontSize, lines,
    id: id && { top: idBox.top, bottom: idBox.bottom, left: idBox.left, right: idBox.right },
    cut: t.scrollWidth > t.clientWidth + 0.5 || t.scrollHeight > t.clientHeight + 0.5 || s.textOverflow === 'ellipsis'
      || lines.some(l => l.left < box.left || l.right > box.right + 0.5 || l.bottom > box.bottom + 0.5) };
})`;

test('0214 AC1, AC3: at 375, 700 and 1,280 px, idea and inbox titles are 17 px, as a ticket\'s, never cut off when open, wrapping under the title (their labels gone since 0435)', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const width of [375, 700, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shaping .item.ticket')`, 'the panel');
      await b.js(openLane('plan')); // 0410
      const [ticket] = await b.js(CARDS('#shaping .item'));
      assert.deepEqual([ticket.idSize, ticket.titleSize], ['14px', '17px'], `${width} px: the ticket`);
      await b.js(openLane('capture')); // 0520
      for (const [view, kind] of VIEWS) {
        await b.until(`!!document.querySelector('#capture .item.${kind}')`, view);
        // 0435: a closed card's title is cut to one line, so these are opened, where a title wraps
        await b.js(`document.querySelectorAll('#capture .item.${kind}:not(.open) .head').forEach(h => h.click()), true`);
        await b.until(`document.querySelectorAll('#capture .item.${kind}.open').length === 2`, `${view}, open`);
        const cards = await b.js(CARDS(`#capture .item.${kind}`));
        assert.equal(cards.length, 2, `${width} px, ${view}`);
        for (const c of cards) {
          const where = `${width} px, ${view}, ${c.title.slice(0, 20)}`;
          assert.equal(c.label, null, `${where}: no label`);
          assert.equal(c.titleSize, ticket.titleSize, `${where}: the title`);
          assert.ok(!c.cut, `${where}: the title is cut off`);
          const [first] = c.lines;
          for (const l of c.lines) assert.ok(Math.abs(l.left - first.left) < 1, `${where}: a line starts at ${l.left}, not under the title's start at ${first.left}`);
        }
        assert.ok(cards[0].lines.length >= 2, `${width} px, ${view}: the long title wraps`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
