import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0484: a Build row's state and minutes show whole on a phone (0585: a closed card's tag, stage and time did) ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.now(); // the real browser's clock too
const ago = s => new Date(NOW - s * 1000).toISOString();
// SPECK_TEST_0500_DELAY: seconds to wait before starting each panel, to check the line's time when it starts late (0500).
const DELAY = Number(process.env.SPECK_TEST_0500_DELAY) || 0;
const approved = o => ({ started: ago(1212), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });

// 0901: a blocked bug ticket the manager will answer; 0902: a finished document task; 0903: a fix ticket waiting for you; 0904: one under review with its reviewer's long model; 0905: a blocked one with no tag.
const TICKETS = [
  T('0901', 'blocked', { type: 'bug', started: ago(5990), self_check: 'no changes', rounds: [round(1, 10), round(2, 10)], blocked_question: 'A or B?', blocked_recommendation: 'A', foreman_will: true }),
  T('0902', 'approved', approved({ kind: 'task', auto_ship: false, build_exit: { at: ago(30), code: 0, message: 'Done.' } })),
  T('0903', 'approved', approved({ type: 'fix', auto_ship: false })),
  T('0904', 'reviewing', { type: 'bug', started: ago(300), build_running: true, self_check: 'no changes', rounds: [], review_running: 1, review_model: 'anthropic/claude-opus-5-5-20261001' }),
  T('0905', 'blocked', { started: ago(5990), self_check: 'no changes', rounds: [round(1, 10)], blocked_question: 'A or B?' }),
];
const BOARD = { run: { on: true }, ideas: [], tickets: TICKETS };
const stub = `(() => {
  const STATE = ${JSON.stringify(BOARD)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

// Each Build row's where line (0585: its state, then its minutes), and each part in it: its text, whether it shows inside
// the row, and whether it is cut short (its text reaches past its box, or past the row).
const LINES = `(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); // after the page has handled a resize
  return [...document.querySelectorAll('#queue .q')].map(c => {
    const status = c.querySelector('.where'), row = c.getBoundingClientRect(), box = status.getBoundingClientRect();
    const parts = [...status.children].map(n => {
      const r = n.getBoundingClientRect(), words = document.createRange(); words.selectNodeContents(n); const w = words.getBoundingClientRect(); // all its text, as laid out
      return { text: n.textContent, cls: n.className, inside: r.right <= row.right + 0.5 && r.left >= row.left - 0.5, cut: w.right > r.right + 0.5 || w.right > row.right + 0.5,
        ellipsis: getComputedStyle(n).textOverflow };
    });
    return { id: c.querySelector('.id').textContent, text: status.textContent, over: c.scrollWidth > c.clientWidth + 0.5 || box.right > row.right + 0.5, parts };
  });
})()`;

async function open(width, touch = true) {
  if (DELAY) await new Promise(r => setTimeout(r, DELAY * 1000));
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 1, mobile: true });
    await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await b.js(openLane('build'));
  } catch (e) { await b.close(); await stop(panel); throw e; }
  return { panel, b };
}
const look = (b, theme) => b.js(`(document.documentElement.dataset.theme = ${JSON.stringify(theme)}, true)`);
const resize = (b, width) => b.send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 1, mobile: true });

for (const touch of [true, false]) {
  test(`0484 AC1 AC2: at every width from 320 px ${touch ? 'on a touch screen' : 'with a mouse'}, in both looks, a Build row's state and minutes show whole, inside the row`, skip, async () => {
    const { panel, b } = await open(320, touch);
    try {
      for (const theme of ['light', 'dark']) {
        await look(b, theme);
        for (let width = 320; width <= 480; width += 5) {
          await resize(b, width);
          const lines = await b.js(LINES);
          assert.equal(lines.length, TICKETS.length, `${width} px: every ticket a row`);
          for (const l of lines) {
            const at = `${theme}, ${width} px, ${l.id} (${l.text})`;
            assert.ok(!l.over, `${at}: the row's line reaches past it`);
            for (const p of l.parts) {
              assert.ok(p.inside, `${at}: "${p.text}" shows inside the row`);
              assert.ok(!p.cut && p.ellipsis !== 'ellipsis', `${at}: "${p.text}" isn't cut off`);
            }
          }
          assert.match(lines.find(l => l.id === '0904').text, /^Reviewing · round 1 · \d+ min$/, `${theme}, ${width} px: the row under review says so, with its minutes`);
          assert.match(lines.find(l => l.id === '0901').text, /min$/, `${theme}, ${width} px: and the blocked one its minutes`);
        }
      }
    } finally { await b.close(); await stop(panel); }
  });
}
