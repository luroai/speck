import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, styles } from './support/panel.mjs';

// ---------- 0164: line up a ticket's dependency note ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => styles();

// 0001 (a draft) unlocks seven tickets, enough that its note wraps onto a line of its own on a phone; 0003 (a draft)
// waits on 0001, and 0008 is a short draft whose "waiting on 0001" fits beside its criteria at every width.
const UNLOCKED = ['0002', '0003', '0004', '0005', '0006', '0007'];
const board = () => ({
  run: { on: false },
  tickets: [
    full('0001', { acceptance_criteria: ['One.', 'Two.', 'Three.', 'Four.', 'Five.'] }),
    ...UNLOCKED.map(id => (id === '0003' ? full : (i, o) => T(i, 'ready', o))(id, { after: ['0001'], waiting_on: ['0001'] })),
    full('0008', { after: ['0001'], waiting_on: ['0001'] }),
  ],
  ideas: [],
});

async function withBoard(fn, { width = 1280 } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const STATE = board();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setTouchEmulationEnabled', width < 700 ? { enabled: true, maxTouchPoints: 1 } : { enabled: false }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shaping .item .dep-chip').length > 0`, 'the panel');
    await b.js(openLane('plan')); // 0410: these are Plan's cards
    await b.js(`document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))`);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

// 0468: AC1, AC2 and AC4 lined up a closed card's note of ids, and the taps on them; a closed card's ids are in its
// chip now (test/panel-0468.test.mjs), and an open card's go to their tickets from its dependency box (0154, 0467).

// ---------- AC3 ----------

// Every rule in the stylesheet that shades a card on :hover, with the @media rule it's in, if any.
function hoverRules() {
  const text = css().replace(/\/\*[\s\S]*?\*\//g, ''), out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const sel = m[1].trim();
    if (!/\.(item|q)\b[^,]*:hover/.test(sel) || !/background/.test(m[2])) continue;
    const before = text.slice(0, m.index);
    let depth = 0, media = null;
    for (let i = before.length - 1; i >= 0; i--) {
      if (before[i] === '}') depth++;
      else if (before[i] === '{') { if (depth === 0) { media = before.slice(before.lastIndexOf('}', i) + 1, i).trim(); break; } depth--; }
    }
    out.push({ sel, media });
  }
  return out;
}

test('0164 AC3: a card is shaded on hover only where the main pointer can hover', () => {
  const rs = hoverRules();
  assert.ok(rs.some(r => /\.item:hover/.test(r.sel)), `a card is still shaded on hover: ${JSON.stringify(rs)}`);
  for (const r of rs) assert.match(r.media || '', /^@media\s*\(hover:\s*hover\)$/, `${r.sel} is only for a pointer that can hover`);
});

test('0164 AC3: in a browser whose pointer can\'t hover, a tapped card keeps its background, and an opened card keeps its opened colour', skip, () => withBoard(async b => {
  assert.equal(await b.js(`matchMedia('(hover: none)').matches`), true, 'this headless browser reports a pointer that can\'t hover');
  const back = id => b.js(`getComputedStyle([...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '${id}')).backgroundColor`);
  // 0413: below speck's screen, the card may start under the fold, so it's scrolled to first.
  const at = await b.js(`(() => { const t = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0008').querySelector('.title'); t.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return [r.left + 4, r.top + r.height / 2]; })()`);
  const before = await back('0008');
  const raise = await b.js(`(() => { const s = document.createElement('span'); s.style.color = 'var(--raise)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`);
  assert.notEqual(before, raise, 'a closed card isn\'t shaded to start with');
  await b.move(at);
  await new Promise(r => setTimeout(r, 50));
  assert.equal(await back('0008'), before, 'with the pointer over it, its background is as it was');
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at[0], y: at[1] }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.until(`document.querySelectorAll('#shaping .item.open').length === 1`, 'the tap to open the card');
  assert.equal(await back('0008'), raise, 'an opened card keeps its opened colour');
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at[0], y: at[1] }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.until(`document.querySelectorAll('#shaping .item.open').length === 0`, 'a second tap to close it');
  await new Promise(r => setTimeout(r, 50));
  assert.equal(await back('0008'), before, 'once closed, the tapped card isn\'t left shaded');
}, { width: 375 }));
