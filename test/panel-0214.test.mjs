import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, full, idea, click, toggles, items, top, openLane } from './support/panel.mjs';

// ---------- 0214: Plan's idea and inbox cards get a ticket card's larger title ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// A title long enough to wrap even at 1,280 px, and a short one. 0410: Plan is the full width there now, so it's longer.
const LONG = 'Let the panel say which of the reviewer findings were fixed, which were disputed and which are still open after the last round, so nobody has to read the log, '
  + 'and say it again in the review pack, with each finding\'s round and the reviewer who raised it';
const STATE = {
  run: { on: false },
  tickets: [full('0201', { title: 'A ticket' })],
  ideas: [{ ...idea('2026-10-15-a-long-idea', 'new'), title: LONG }, idea('2026-10-15-short', 'new'),
    { ...idea('2026-10-15-a-long-follow-up', 'inbox', '# A long follow-up\n\nStatus: inbox\nFrom ticket: 0139\n\nSome text.\n'), title: LONG },
    idea('2026-10-15-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0140\n\nSome text.\n')],
};

// ----- AC2 and AC4: the cards' parts, without a browser -----

const lineOf = item => top(item).children[0];
const VIEWS = [['ideas', 1, 'idea'], ['inbox', 2, 'inbox']];

for (const [view, at, label] of VIEWS) {
  test(`0214 AC2: in ${view}, a card's label and title share one line, the label first, as a ticket's id and title do`, async () => {
    const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
    await p.settle();
    const ticketLine = lineOf(items(p)[0]);
    assert.deepEqual(ticketLine.children.map(n => n.className), ['id', 'title']);
    click(toggles(p)[at]);
    const cards = items(p);
    assert.equal(cards.length, 2);
    for (const card of cards) {
      const line = lineOf(card);
      assert.equal(line.className, ticketLine.className, 'the same line as a ticket card');
      assert.deepEqual(line.children.map(n => n.className), ['id', 'title']);
      assert.equal(line.children[0].textContent, label);
    }
    assert.equal(lineOf(cards[0]).children[1].textContent, LONG);
  });

  test(`0214 AC4: in ${view}, a card still opens and closes, and the row under the title keeps its ${view === 'ideas' ? 'status' : 'from ticket'} and path`, async () => {
    const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
    await p.settle();
    click(toggles(p)[at]);
    const checks = items(p).map(n => top(n).children.find(c => /\bchecks\b/.test(c.className)).children.map(c => c.textContent));
    if (view === 'ideas') assert.deepEqual(checks, [['new', 'speck/ideas/2026-10-15-a-long-idea.md'], ['new', 'speck/ideas/2026-10-15-short.md']]);
    else assert.deepEqual(checks, [['from 0139', 'speck/ideas/2026-10-15-a-long-follow-up.md'], ['from 0140', 'speck/ideas/2026-10-15-a-follow-up.md']]);
    click(top(items(p)[0]));
    assert.match(items(p)[0].className, /\bopen\b/);
    assert.match(items(p)[0].textContent, /Status: /);
    click(top(items(p)[0]));
    assert.doesNotMatch(items(p)[0].className, /\bopen\b/);
    assert.doesNotMatch(items(p)[0].textContent, /Status: /);
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

// Each card in Plan's list showing: its label's and title's sizes, the title's lines, where the label is, and whether
// any of the title is hidden.
const CARDS = `[...document.querySelectorAll('#shaping .item')].map(item => {
  const id = item.querySelector('.id'), t = item.querySelector('.title'), s = getComputedStyle(t), range = document.createRange();
  range.selectNodeContents(t);
  const lines = [];
  for (const r of range.getClientRects()) {
    if (!r.width) continue;
    const same = lines.find(l => Math.abs(l.top - r.top) < 2);
    if (same) { same.left = Math.min(same.left, r.left); same.right = Math.max(same.right, r.right); }
    else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
  }
  const box = item.getBoundingClientRect(), idBox = id.getBoundingClientRect();
  return { label: id.textContent, title: t.textContent, idSize: getComputedStyle(id).fontSize, titleSize: s.fontSize, lines,
    id: { top: idBox.top, bottom: idBox.bottom, left: idBox.left, right: idBox.right },
    cut: t.scrollWidth > t.clientWidth + 0.5 || t.scrollHeight > t.clientHeight + 0.5 || s.textOverflow === 'ellipsis'
      || lines.some(l => l.left < box.left || l.right > box.right + 0.5 || l.bottom > box.bottom + 0.5) };
})`;

test('0214 AC1, AC3: at 375, 700 and 1,280 px, idea and inbox labels are 14 px and titles 17 px, as a ticket\'s, never cut off, wrapping under the title', skip, async () => {
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
      const [ticket] = await b.js(CARDS);
      assert.deepEqual([ticket.idSize, ticket.titleSize], ['14px', '17px'], `${width} px: the ticket`);
      for (const [view, , label] of VIEWS) {
        await b.js(`document.querySelector('#shaping-toggle .toggle.${view}').click()`);
        await b.until(`!!document.querySelector('#shaping .item.${view === 'ideas' ? 'idea' : 'inbox'}')`, view);
        const cards = await b.js(CARDS);
        assert.equal(cards.length, 2, `${width} px, ${view}`);
        for (const c of cards) {
          const where = `${width} px, ${view}, ${c.title.slice(0, 20)}`;
          assert.equal(c.label, label, where);
          assert.equal(c.idSize, ticket.idSize, `${where}: the label`);
          assert.equal(c.titleSize, ticket.titleSize, `${where}: the title`);
          assert.ok(!c.cut, `${where}: the title is cut off`);
          const [first] = c.lines;
          assert.ok(first.top < c.id.bottom && first.bottom > c.id.top, `${where}: the title starts on the label's line`);
          assert.ok(first.left >= c.id.right, `${where}: the label comes before the title`);
          for (const l of c.lines) assert.ok(Math.abs(l.left - first.left) < 1 && l.left >= c.id.right, `${where}: a line starts at ${l.left}, not under the title's start at ${first.left}`);
        }
        assert.ok(cards[0].lines.length >= 2, `${width} px, ${view}: the long title wraps`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
