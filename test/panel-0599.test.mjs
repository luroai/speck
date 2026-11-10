import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, round, boardPage, items, notes, top, shippedRows, panelRepo, freePort, startPanel, stop, browserPage, openLane } from './support/panel.mjs';

const LONG = 'A ticket whose title is long enough that it never fits on one line of the panel at all, however wide the window is, because it keeps going and going well past any sensible length for a title';
const SHORT = 'Short';
const stamp = new Date().toISOString();
const note = (name, title) => ({ path: `speck/ideas/${name}.md`, title, status: 'idea', body: `# ${title}\n\nCaptured: 2026-10-20 · Status: idea\n\n## What\nThe whole text.\n` });
const STATE = {
  run: { on: false },
  ideas: [note('short', SHORT), note('long', LONG)],
  tickets: [
    T('0701', 'draft', { title: SHORT }), T('0702', 'draft', { title: LONG, type: 'bug', risk: 'high' }),
    T('0711', 'ready', { title: SHORT }), T('0712', 'ready', { title: LONG, waiting_on: ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0710', '0713', '0714', '0715'] }),
    T('0721', 'done', { title: SHORT, started: stamp, finished: stamp, rounds: [round(1, 500)] }),
    T('0722', 'done', { title: LONG, type: 'bug', started: stamp, finished: stamp, rounds: [round(1, 500), round(2, 123456)] }),
  ],
};
const titleOf = (p, n) => p.all(n).find(c => /^title\b/.test(c.className));

test('0599 AC2: a closed row\'s title is the whole title, as its text and its tooltip, in every lane', async () => {
  const p = boardPage([STATE]);
  await p.settle();
  const rows = {
    Capture: notes(p).find(n => titleOf(p, n).textContent === LONG),
    Plan: items(p).find(n => titleOf(p, n).textContent === LONG),
    Build: p.byId('queue').children.find(n => /\bq\b/.test(n.className) && titleOf(p, n)?.textContent === LONG),
    Shipped: shippedRows(p).find(n => titleOf(p, n).textContent === LONG),
  };
  for (const [lane, row] of Object.entries(rows)) {
    assert.ok(row, `${lane}: the long row`);
    const t = titleOf(p, row);
    assert.equal(t.textContent, LONG, `${lane}: its text, and so what a screen reader reads, is the whole title`);
    assert.equal(t.title, LONG, `${lane}: its tooltip is the whole title`);
  }
  assert.ok(top(items(p)[0]), 'a Plan row has its top row');
});

// Each row in the lane shown: how many lines its title and details take, whether the title is cut off with an
// ellipsis, whether its id is on the title's line, and the row's height.
const ROWS = sel => `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('${sel}')].filter(r => r.getClientRects().length).map(r => {
    const t = r.querySelector('.title'), s = getComputedStyle(t), id = r.querySelector('.id'), details = r.querySelector('.where, .checks, .meta');
    const tb = t.getBoundingClientRect(), ib = id ? id.getBoundingClientRect() : null;
    return { title: t.textContent, titleLines: lines(t), detailLines: details ? lines(details) : 0, cut: t.scrollWidth > t.clientWidth + 0.5, wraps: s.whiteSpace !== 'nowrap', ellipsis: s.textOverflow,
      idOnLine: ib ? ib.top < tb.bottom && ib.bottom > tb.top : null, height: r.getBoundingClientRect().height, right: r.getBoundingClientRect().right };
  });
})()`;
const LANES = [['capture', '#capture .item:not(.open) .head'], ['plan', '#shaping .item:not(.open) .head'], ['build', '#queue .q .top'], ['shipped', '#shipped tr']];

test('0599 AC1, AC3, AC4: at 320 and 1280 px, every closed row is one title line and one details line; an open one wraps', async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const stub = `(() => { const real = window.fetch.bind(window); const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(${JSON.stringify(STATE)}) : /\\/log$/.test(String(url)) ? json({ text: '' }) : real(url, opts); })();`;
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const width of [320, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length === 2 && document.querySelectorAll('#queue .q').length === 2 && document.querySelectorAll('#capture .item').length === 2`, 'the rows');
      for (const [lane, sel] of LANES) {
        await b.js(openLane(lane));
        const rows = await b.js(ROWS(sel));
        assert.equal(rows.length, 2, `${width} px, ${lane}: both rows`);
        for (const r of rows) {
          const at = `${width} px, ${lane}, "${r.title.slice(0, 12)}"`;
          assert.equal(r.titleLines, 1, `${at}: its title on one line`);
          assert.equal(r.detailLines, 1, `${at}: its details on one line`);
          assert.ok(r.height >= 44, `${at}: ${r.height} px tall`);
          assert.ok(r.right <= width + 0.5, `${at}: on the screen`);
          if (lane !== 'capture') assert.equal(r.idOnLine, true, `${at}: its id on the title's line`);
        }
        assert.ok(Math.abs(rows[0].height - rows[1].height) < 0.5, `${width} px, ${lane}: both rows the same height (${rows[0].height}, ${rows[1].height})`);
        const long = rows.find(r => r.title === LONG);
        assert.ok(long.cut, `${width} px, ${lane}: the long title is cut off`);
        assert.equal(long.ellipsis, 'ellipsis', `${width} px, ${lane}: with an ellipsis`);
        if (lane !== 'plan') continue;
        // the details line is cut off only across, and not over the priority's 44 px box, which reaches past it
        const prio = await b.js(`[...document.querySelectorAll('#shaping .item:not(.open) .checks .prio')].map(n => { const r = n.getBoundingClientRect(), hit = (x, y) => n.contains(document.elementFromPoint(x, y));
          return { w: r.width, h: r.height, corners: [hit(r.left + 1, r.top + 1), hit(r.left + 1, r.bottom - 1), hit(r.right - 1, r.top + 1), hit(r.right - 1, r.bottom - 1)] }; })`);
        assert.equal(prio.length, 2, `${width} px: each Plan row's priority`);
        for (const x of prio) { assert.ok(x.w >= 44 && x.h >= 44, `${width} px: the priority's box is ${x.w} × ${x.h}`); assert.deepEqual(x.corners, [true, true, true, true], `${width} px: each corner of it takes a tap`); }
      }
      if (width !== 320) continue;
      // AC3: open, a Plan ticket's and a Capture note's long titles wrap whole
      for (const [lane, box] of [['plan', 'shaping'], ['capture', 'capture']]) {
        await b.js(`${openLane(lane)}, [...document.querySelectorAll('#${box} .item .head')].find(h => h.querySelector('.title').textContent === ${JSON.stringify(LONG)}).click(), true`);
        await b.until(`!!document.querySelector('#${box} .item.open')`, `the open ${lane} row`);
        const [open] = await b.js(ROWS(`#${box} .item.open .head`));
        assert.ok(open.titleLines > 1, `${lane}: open, its title wraps (${open.titleLines} lines)`);
        assert.ok(!open.cut && open.wraps && open.ellipsis !== 'ellipsis', `${lane}: open, its title isn't cut off`);
      }
      // and the ticket's full view
      await b.js(`${openLane('build')}, [...document.querySelectorAll('#queue .q .top')].find(h => h.querySelector('.title').textContent === ${JSON.stringify(LONG)}).click(), true`);
      await b.until(`!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket .top .title')`, 'the full view');
      const [full] = await b.js(ROWS('#full-ticket .top'));
      assert.ok(full.titleLines > 1, `the full view's title wraps (${full.titleLines} lines)`);
      assert.ok(!full.cut, 'the full view\'s title isn\'t cut off');
    }
  } finally { await b.close(); await stop(panel); }
});
