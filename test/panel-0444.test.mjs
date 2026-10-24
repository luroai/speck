import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, round } from './support/panel.mjs';

// ---------- 0444: keep the review pack's Result column readable ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const ago = m => new Date(Date.now() - m * 60000).toISOString();

// A pack whose criteria and evidence are long, as a real one's are, so they take nearly all of the table's width.
const LONG = 'A long sentence that goes on for a while, as a criterion or its evidence often does in a real review pack, ';
const PACK = [
  '## 0005 · Ticket 0005',
  '',
  '### Acceptance criteria',
  '| # | Criterion | Result | Evidence |',
  '|---|---|---|---|',
  `| 1 | ${LONG.repeat(3)} | ✅ | ${LONG.repeat(4)}test/panel-0444.test.mjs and /home/someone/projects/speck.worktrees/speck/0444-keep-the-review-pack-s-result-column-readable/templates/panel.css |`,
  `| 2 | ${LONG.repeat(2)} | ❌ | ${LONG.repeat(3)} |`,
  `| 3 | ${LONG} | ⚠️ | ${LONG.repeat(2)} |`,
].join('\n');
const STATE = { tickets: [T('0005', 'approved', { started: ago(40), approved: ago(30), rounds: [round(1, 1000)] })], ideas: [] };

const stub = `(() => {
  const STATE = ${JSON.stringify(STATE)}, PACK = ${JSON.stringify(PACK)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/pack$/.test(u)) return json({ pack: PACK });
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;

// The panel with the review pack open in the pane, at each width in turn.
async function withPack(widths, fn) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    for (const width of widths) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#queue .q .top')`, 'the panel');
      await b.js(`document.querySelector('#queue .q .top').click()`);
      await b.until(`[...document.querySelectorAll('#queue .full-open')].some(x => x.textContent === 'Review pack')`, 'the Review pack button');
      await b.js(`[...document.querySelectorAll('#queue .full-open')].find(x => x.textContent === 'Review pack').click()`);
      await b.until(`!!document.querySelector('#full-ticket .md table.ac-table tbody tr')`, 'the review pack');
      await fn(b, width);
    }
  } finally { await b.close(); await stop(panel); }
}

// The criteria table's boxes: the table's and the pack's, and for the Result heading and each row's number and result,
// the cell's box, its text's width and how many lines its text takes.
const MEASURE = `(() => {
  const t = document.querySelector('#full-ticket .md table.ac-table');
  const box = n => { const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }; };
  const text = n => {
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter(x => x.width);
    return { text: n.textContent, box: box(n), inner: n.clientWidth - parseFloat(getComputedStyle(n).paddingLeft) - parseFloat(getComputedStyle(n).paddingRight),
      width: Math.max(0, ...rects.map(x => x.right)) - Math.min(...rects.map(x => x.left)), lines: new Set(rects.map(x => Math.round(x.top))).size };
  };
  return {
    table: box(t), pack: box(t.closest('.md')),
    result: text(t.querySelectorAll('th')[2]),
    rows: [...t.querySelectorAll('tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); return { num: text(td[0]), result: text(td[2]) }; }),
  };
})()`;

test('0444 AC1: at 1280 and 1440 px, the Result column fits its heading on one line and its widest mark, inside the pack', skip, () => withPack([1280, 1440], async (b, width) => {
  const m = await b.js(MEASURE);
  assert.equal(m.result.text, 'Result');
  assert.equal(m.result.lines, 1, `${width} px: Result reads on one line`);
  assert.ok(m.result.width <= m.result.inner + 0.5, `${width} px: the column is as wide as its heading (${m.result.width} in ${m.result.inner})`);
  const widest = Math.max(...m.rows.map(r => r.result.width));
  assert.ok(widest <= m.result.inner + 0.5, `${width} px: and as wide as its widest mark`);
  for (const r of m.rows) assert.equal(r.result.lines, 1, `${r.result.text}: the mark on one line`);
  assert.ok(m.table.right <= m.pack.right + 0.5, `${width} px: the table doesn't reach past the pack's right edge (${m.table.right} > ${m.pack.right})`);
  assert.ok(await b.js(`(p => p.scrollWidth <= p.clientWidth)(document.getElementById('full-ticket'))`), `${width} px: the pane doesn't scroll sideways`);
}));

test('0444 AC2: at 375 px, each criterion\'s result still shows beside its number', skip, () => withPack([375], async b => {
  const m = await b.js(MEASURE);
  assert.equal(m.rows.length, 3);
  for (const { num, result } of m.rows) {
    assert.ok(Math.abs(num.box.top - result.box.top) < 1, `${num.text} ${result.text}: on one line`);
    assert.ok(result.box.left > num.box.right, 'the result after the number');
  }
}));
