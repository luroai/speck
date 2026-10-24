import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0442: each " · " in a details line has a clear gap on each side, in the interface font ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LONG = 'A ticket whose title is far too long to fit on a single line of a phone-sized pane, so it is cut off';

// Times from the real clock, as the page's own clock isn't stopped in a real browser
const board = () => {
  const real = Date.now(), ago = s => new Date(real - s * 1000).toISOString();
  return {
    run: { on: true },
    tickets: [
      full('0801', { title: 'A Plan ticket', priority: 3, size: 'M', risk: 'low' }),
      full('0802', { title: LONG, priority: 2, size: 'S', risk: 'high', type: 'bug' }),
      T('0901', 'building', { title: 'Writing its code', priority: 3, size: 'M', risk: 'low', started: ago(67), build_running: true }),
      T('0903', 'reviewing', { title: 'Under review', started: ago(472), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: 'gpt-6.1-sol' }),
      T('0904', 'reviewing', { title: 'Fixing findings', started: ago(472), build_running: true, self_check: 'no changes', rounds: [{ round: 1, verdict: 'request_changes' }], review_running: null, builder: 'claude' }),
      T('0906', 'blocked', { title: 'Has a question', started: ago(300), blocked_question: 'A or B?', type: 'fix' }),
      T('0907', 'approved', { title: 'Waiting for you', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: false, build_exit: { at: ago(30), code: 0 } }),
      T('0426', 'ready', { title: LONG, priority: 2, size: 'S', risk: 'high' }),
      T('0910', 'ready', { title: 'Queued behind', after: ['0426'], waiting_on: ['0426'] }),
      T('0401', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
      T('0402', 'done', { title: 'A bug fix', type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 500)], builder_cost_usd: 1.5 }),
      T('0407', 'done', { title: LONG, started: ago(3 * 86400 + 900), finished: ago(3 * 86400), rounds: [round(1, 500), round(2, 500), round(3, 500)], builder_cost_usd: 12.34 }),
    ],
    ideas: [],
  };
};
const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

// Each " · " in the shown details lines: the gap from the dot's ink to the box of the text either side of it, where the
// text is on the dot's line. The dot's ink is where the font draws it within its box, measured in the font it's drawn in.
const LINES = '.item.ticket .head .checks, .q .top .progress, .q .top .act, #shipped .meta, #shipped-stats';
const GAPS = `(async () => {
  await document.fonts.ready;
  const ink = document.createElement('canvas').getContext('2d'), out = [];
  for (const line of document.querySelectorAll(${JSON.stringify(LINES)})) {
    if (!line.getClientRects().length) continue;
    const chars = [], w = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) for (let i = 0; i < t.data.length; i++) chars.push({ t, i, c: t.data[i] });
    const rect = ({ t, i }) => { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); return r.getClientRects()[0]; };
    chars.forEach((ch, k) => {
      if (ch.c !== '·') return;
      const box = rect(ch), cs = getComputedStyle(ch.t.parentNode);
      ink.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = ink.measureText('·'), left = box.left - m.actualBoundingBoxLeft, right = box.left + m.actualBoundingBoxRight;
      let a = k - 1, b = k + 1;
      while (a >= 0 && /\\s/.test(chars[a].c)) a--;
      while (b < chars.length && /\\s/.test(chars[b].c)) b++;
      const before = a >= 0 ? rect(chars[a]) : null, after = b < chars.length ? rect(chars[b]) : null;
      const same = r => r && Math.abs((r.top + r.bottom) / 2 - (box.top + box.bottom) / 2) < 4;
      out.push({ text: line.textContent, font: ink.font, before: same(before) ? left - before.right : null, after: same(after) ? after.left - right : null });
    });
  }
  return out;
})()`;

async function panelAt(width, state = board()) {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 420 });
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await b.send('Page.enable');
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state) });
  await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
  await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length === 3 && document.querySelectorAll('#queue .q').length === 7`, 'the panel');
  return { panel, b };
}

test('0442 AC1: in the interface font, each " · " in a status line, a shipped ticket\'s second line and the shipped stats is at least 4 px from the text on each side, in both looks', skip, async () => {
  const { panel, b } = await panelAt(420);
  try {
    assert.match(await b.js(`getComputedStyle(document.body).fontFamily`), /system-ui/, 'the panel is in the interface font');
    for (const look of ['light', 'dark']) {
      await b.js(`(document.documentElement.dataset.theme = ${JSON.stringify(look)}, true)`);
      const seen = { plan: 0, build: 0, shipped: 0 };
      for (const lane of ['plan', 'build', 'shipped']) {
        await b.js(openLane(lane));
        // open one ticket too, so an open card's line, with its priority, size and risk, is measured as well
        if (lane === 'build') await b.js(`(document.querySelector('#queue .q .top').click(), true)`);
        const gaps = await b.js(GAPS);
        seen[lane] = gaps.length;
        for (const g of gaps) {
          assert.ok(g.before === null || g.before >= 4, `${look}, ${lane}: ${g.before?.toFixed(2)} px before the dot in "${g.text}" (${g.font})`);
          assert.ok(g.after === null || g.after >= 4, `${look}, ${lane}: ${g.after?.toFixed(2)} px after the dot in "${g.text}" (${g.font})`);
        }
        assert.ok(gaps.filter(g => g.before !== null && g.after !== null).length >= 3, `${look}, ${lane}: dots with text on both sides measured (${gaps.length})`);
      }
      assert.ok(seen.shipped >= 4, `${look}: the shipped stats' dot and the shipped tickets' dots (${seen.shipped})`);
    }
  } finally { await b.close(); await stop(panel); }
});

// Each closed card in the open lane: how many rows its title line and its details line take
const ROWS = `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('#queue .q:not(.open), #shipped tr:not(.open)')].filter(c => c.getClientRects().length).map(c => {
    const title = c.querySelector('.line'), details = c.querySelector('.top > .progress, .top > .act, .meta');
    return { id: c.querySelector('.id').textContent, title: lines(title), details: details ? lines(details) : 0, text: details && details.textContent,
      inside: !details || details.getBoundingClientRect().right <= c.getBoundingClientRect().right + 0.5 };
  });
})()`;

test('0442 AC2: at 390 px with a mouse, each closed Build and shipped ticket is still its title line and one details line', skip, async () => {
  const { panel, b } = await panelAt(390);
  try {
    for (const lane of ['build', 'shipped']) {
      await b.js(openLane(lane));
      const cards = await b.js(ROWS);
      assert.ok(cards.length >= 3, `${lane}: ${cards.length} cards`);
      for (const c of cards) {
        assert.equal(c.title, 1, `${lane} ${c.id}: its title on one line`);
        assert.equal(c.details, 1, `${lane} ${c.id}: its details on one line: "${c.text}"`);
        assert.ok(c.inside, `${lane} ${c.id}: its details stay inside the card`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
