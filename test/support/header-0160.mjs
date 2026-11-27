// 0160's panel in a real headless browser, with a board long enough to scroll, shared with 0776's tests of 0160 AC5.
import assert from 'node:assert/strict';
import { T, full, browserPage, openLane } from './panel.mjs';
import { sharedPanel } from './shared-panel.mjs';

// Enough tickets for the page to scroll well past one screen, on a phone and on a desktop. 0001 unlocks 0010, so 0010's
// item in Plan, open, has a button that jumps to 0001 (0154, 0467). 0585: a Build row's full view shows a ticket in the pane instead.
export const board = () => ({
  tickets: [
    full('0001', { problem: Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a long problem.`).join('\n\n') }),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    ...Array.from({ length: 24 }, (_, i) => full(String(i + 10).padStart(4, '0'), i === 0 ? { after: ['0001'], waiting_on: ['0001'] } : {})),
    ...Array.from({ length: 12 }, (_, i) => T(String(i + 50).padStart(4, '0'), 'done', { shipped: new Date().toISOString() })),
  ],
  ideas: [],
  run: { on: false, pid: null },
});

// The panel in a real headless browser, with a board of tickets, at a width and with the screen's safe-area insets
// (the status bar's height above, the home indicator's below), as on an iPhone in the home-screen app.
export async function withPanel(fn, { width = 375, height = 640, insets = null, theme = null, reducedMotion = false } = {}) {
  const panel = await sharedPanel(); // one for the whole file: the page stub below answers every request (0234)
  const b = await browserPage('about:blank');
  const STATE = board();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    if (insets) await b.send('Emulation.setSafeAreaInsetsOverride', { insets });
    if (reducedMotion) await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      ${theme ? `localStorage.setItem('speck-theme', ${JSON.stringify(theme)});` : ''}
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    for (let i = 0; ; i++) {
      try { if (await b.js(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .where') && !document.querySelector('#run').hidden`)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    await fn(b);
  } finally { await b.close(); }
}
// In Plan, opens 0010 and presses the button in its dependency box that jumps to ticket 0001.
export async function jumpTo0001(b) {
  await b.js(openLane('plan'));
  await b.js(`[...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0010').querySelector('.head').click()`); // open, to reach its box
  await b.until(`!!document.querySelector('#shaping .item.open button[aria-label^="Go to ticket 0001"]')`, 'its dependency box');
  await b.js(`document.querySelector('#shaping .item.open button[aria-label^="Go to ticket 0001"]').scrollIntoView()`);
  await b.js(`document.querySelector('#shaping .item.open button[aria-label^="Go to ticket 0001"]').click()`);
}
// 0776: where ticket 0001's row and the header are, once both have stayed put for one 100 ms check (any smooth scroll
// and the header's fade over), and that the row is below the header. It finds the row by its id: its highlight lasts
// only 1.5 s, which a busy machine can take to get here.
const ROW_0001 = `[...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id')?.textContent === '0001')`;
export async function jumpedBelowHeader(b, ms) {
  const where = `(() => { const t = ${ROW_0001}.getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return [t.top, h.bottom]; })()`;
  await b.js('delete window.rest0776, true');
  await b.until(`(() => { const now = JSON.stringify(${where}), same = window.rest0776 === now; window.rest0776 = now; return same; })()`, 'the ticket to come to rest', ms);
  const [top, bottom] = await b.js(where);
  assert.ok(top >= bottom, `the ticket's top (${top}) is below the header's bottom (${bottom})`);
}
