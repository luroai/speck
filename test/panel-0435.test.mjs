import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, idea, click, notes, top, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, page as html, styles } from './support/panel.mjs';

// ---------- 0435: a collapsed idea or inbox card is its title and one short line saying when it was captured ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = new Date(2026, 9, 23, 12).getTime(); // 23 Oct 2026, local time
const LONG = 'A note whose title is far too long to fit on a single line of a phone-sized pane, so it is cut off with an ellipsis';
const note = (name, status, head, title = `Note ${name}`) => ({ ...idea(name, status, `# ${title}\n\n${head}\n\nSome text.\n`), title });
const STATE = () => ({
  run: { on: false },
  tickets: [],
  ideas: [
    note('2026-10-08-plain', 'idea', 'Captured: 2026-10-08 · Status: idea'),
    note('2026-10-08-long', 'idea', 'Captured: 2026-10-08 · Status: idea', LONG),
    note('2025-10-08-last-year', 'idea', 'Captured: 2025-10-08 · Status: idea'),
    note('2026-10-08-shaped', 'shaped', 'Captured: 2026-10-08 · Status: shaped'),
    note('2026-10-08-no-date', 'idea', 'Status: idea'),
    note('2026-10-08-bad-date', 'parked', 'Captured: someday · Status: parked'),
    note('2026-10-08-not-a-day', 'idea', 'Captured: 2026-02-30 · Status: idea'),
    note('2026-10-09-follow-up', 'inbox', 'Captured: 2026-10-09 · Status: inbox\nFrom ticket: 0139'),
    note('2026-10-09-long-follow-up', 'inbox', 'Captured: 2026-10-09 · Status: inbox\nFrom ticket: 0141', LONG),
    note('2025-12-31-old-follow-up', 'inbox', 'Captured: 2025-12-31 · Status: inbox'),
    note('2026-10-09-undated-follow-up', 'inbox', 'Status: inbox\nFrom ticket: 0140'),
    note('2026-10-09-undated', 'inbox', 'Captured: soon · Status: inbox'),
  ],
});
const page = () => fakePage([STATE()], { Date: stoppedClock(NOW) });
// 0520: ideas and inbox notes are one list in Capture, newest captured first; `kind` picks out the idea or the inbox cards.
const cards = async kind => { const p = page(); await p.settle(); return { p, cards: notes(p).filter(n => new RegExp(`\\b${kind}\\b`).test(n.className)) }; };
const titled = (c, name) => c.find(n => lineOf(n).textContent === `Note ${name}`);
const lineOf = c => top(c).children[0];
const secondOf = c => top(c).children.find(n => /\bchecks\b/.test(n.className)).textContent;

test('0435 AC1: an idea card is its title with no label, then when it was captured and any status but idea, in smaller type', async () => {
  const { cards: c } = await cards('idea');
  assert.deepEqual(c.map(n => lineOf(n).children.map(x => x.className)), c.map(() => ['title']), 'no `idea` label before the title');
  assert.equal(lineOf(c[0]).textContent, 'Note 2026-10-08-plain');
  assert.equal(secondOf(c[0]), 'Captured 8 Oct');
  assert.equal(secondOf(titled(c, '2025-10-08-last-year')), 'Captured 8 Oct 2025', 'the year, when it isn\'t this year');
  // 0520: Capture lists only notes whose status is idea or inbox, so no card shows another status.
  assert.ok(!titled(c, '2026-10-08-shaped') && !titled(c, '2026-10-08-bad-date'), 'a note with another status isn\'t listed');
  const style = styles();
  assert.match(/\.item \.checks \{([^}]*)\}/.exec(style)[1], /font-size: 12px;/, 'smaller than the 17 px title');
});

test('0435 AC2: an inbox card is its title with no label, then the ticket it came from and when it was captured', async () => {
  const { cards: c } = await cards('inbox');
  assert.deepEqual(c.map(n => lineOf(n).children.map(x => x.className)), c.map(() => ['title']), 'no `inbox` label before the title');
  assert.equal(secondOf(c[0]), 'From 0139 · captured 9 Oct');
  assert.equal(secondOf(c[2]), 'Captured 31 Dec 2025', 'no ticket named');
});

test('0435 AC3: a note with no Captured line, or one with no real date in it, says No capture date there', async () => {
  const { cards: ideas } = await cards('idea');
  assert.deepEqual(['2026-10-08-no-date', '2026-10-08-not-a-day'].map(n => secondOf(titled(ideas, n))), ['No capture date', 'No capture date']);
  const { cards: inbox } = await cards('inbox');
  assert.deepEqual(inbox.slice(3).map(secondOf), ['From 0140 · No capture date', 'No capture date']);
});

test('0435 AC4: a collapsed card shows no file path; an open one shows it in small type above the note\'s text', async () => {
  for (const view of ['idea', 'inbox']) {
    const { p, cards: c } = await cards(view);
    for (const n of c) assert.ok(!n.textContent.includes('speck/ideas/'), `${view}: no path while it's collapsed`);
    click(top(c[0]));
    const open = notes(p).find(n => /\bopen\b/.test(n.className));
    assert.match(open.className, /\bopen\b/);
    const path = p.all(open).find(n => /\bpath\b/.test(n.className || ''));
    assert.ok(path, `${view}: the path, open`);
    assert.equal(path.textContent, STATE().ideas.find(i => open.textContent.includes(i.title)).path);
    const body = path.parentNode.children;
    assert.equal(body.indexOf(path), 0, `${view}: above the note`);
    assert.match(body[1].className, /\bnote\b/);
    assert.ok(!top(open).textContent.includes('speck/ideas/'), `${view}: not in its top row`);
  }
});

// ---------- in a real browser: a 390 px phone, with a touch screen and with a mouse ----------

const stub = `(() => {
  const STATE = ${JSON.stringify(STATE())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each card in Capture's list (0520): the rows its top row's parts take, the text lines of its second line, and the
// gap between them.
const CARDS = `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('#capture .item:not(.open)')].map(c => {
    const head = c.querySelector('.head'), title = head.querySelector('.title'), second = head.querySelector('.checks');
    const rows = [...head.children].filter(n => n.getBoundingClientRect().height > 0).map(n => Math.round(n.getBoundingClientRect().top));
    return { text: title.textContent, tip: title.title, children: c.children.length, rows: new Set(rows).size, titleLines: lines(title), secondLines: lines(second),
      cut: title.scrollWidth > title.clientWidth, inside: title.getBoundingClientRect().right <= c.getBoundingClientRect().right + 0.5,
      gap: second.getBoundingClientRect().top - title.getBoundingClientRect().bottom };
  });
})()`;

for (const touch of [true, false]) {
  test(`0435 AC5: at 390 px ${touch ? 'on a touch screen' : 'with a mouse'}, each collapsed idea or inbox card is two rows, its title line and its second line`, skip, async () => {
    const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
    const b = await browserPage('about:blank');
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#capture .item').length === 10`, 'the panel');
      assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
      await b.js(openLane('capture'));
      { // 0520: the ideas and inbox notes, together in Capture
        const n = 10;
        const seen = await b.js(CARDS);
        assert.equal(seen.length, n);
        for (const c of seen) {
          assert.equal(c.children, 1, `${c.text}: nothing under its top row`);
          assert.equal(c.rows, 2, `${c.text}: two rows`);
          assert.equal(c.titleLines, 1, `${c.text}: its title on one line`);
          assert.ok(c.inside, `${c.text}: its title stays inside the card`);
          assert.equal(c.tip, c.text, `${c.text}: the whole title is its tooltip`);
          assert.equal(c.secondLines, 1, `${c.text}: its second line on one line`);
          assert.ok(c.gap <= 8, `${c.text}: ${c.gap} px between its title and second line`);
        }
        assert.ok(seen.find(c => c.text === LONG).cut, 'a long title is cut off');
        // open, a long title wraps again
        await b.js(`[...document.querySelectorAll('#capture .item .head')].find(h => h.querySelector('.title').textContent === ${JSON.stringify(LONG)}).click(), true`);
        await b.until(`!!document.querySelector('#capture .item.open')`, 'the open card');
        assert.ok(await b.js(`(() => { const t = document.querySelector('#capture .item.open .title'); return t.getClientRects().length > 1 || t.getBoundingClientRect().height > parseFloat(getComputedStyle(t).lineHeight) * 1.5; })()`), 'open, the long title wraps');
        await b.js(`document.querySelector('#capture .item.open .head').click(), true`);
      }
    } finally { await b.close(); await stop(panel); }
  });
}
