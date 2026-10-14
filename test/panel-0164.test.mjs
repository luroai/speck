import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full, items, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0164: line up a ticket's dependency note ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';

// 0001 (a draft) unlocks seven tickets, enough that its note wraps onto a line of its own on a phone; 0003 (a draft)
// waits on 0001, and 0008 is a short draft whose "waiting on 0001" fits beside its criteria at every width.
const UNLOCKED = ['0002', '0003', '0004', '0005', '0006', '0007'];
const UNLOCKS = [...UNLOCKED, '0008']; // every ticket 0001 unlocks
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
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shaping .item .goto').length > 0`, 'the panel');
    await b.js(`document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))`);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

// For a card's details row: each part's text, font size, and the place of its first and last line of text, measured
// from the text itself (not its boxes, which a tap area may stretch). A note's ids and commas are measured one by one.
const ROW = id => `(() => {
  const card = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)});
  // Only its text's own boxes, not an icon's.
  const rectsOf = node => { const out = [], w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = node.nodeType === 3 ? node : w.nextNode(); t; t = node.nodeType === 3 ? null : w.nextNode()) { const r = document.createRange(); r.selectNodeContents(t); out.push(...[...r.getClientRects()].filter(x => x.width > 0)); }
    return out; };
  const lineOf = rects => ({ left: Math.round(rects[0].left), bottom: Math.round(rects[0].bottom), lastBottom: Math.round(rects[rects.length - 1].bottom) });
  const checks = card.querySelector('.checks');
  const parts = [...checks.children].map(n => ({ text: n.textContent, size: getComputedStyle(n).fontSize, height: Math.round(n.getBoundingClientRect().height), ...lineOf(rectsOf(n)) }));
  const note = [...checks.children].find(n => /^(unlocks|waiting on) /.test(n.textContent));
  const pieces = note ? [...note.childNodes].map(c => ({ text: c.textContent, goto: c.nodeType === 1, size: c.nodeType === 1 ? getComputedStyle(c).fontSize : getComputedStyle(note).fontSize,
    box: c.nodeType === 1 ? (b => ({ top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), height: Math.round(b.height) }))(c.getBoundingClientRect()) : null,
    ...(r => ({ textLeft: r[0].left, textRight: r[r.length - 1].right, textBottom: Math.round(r[0].bottom) }))(rectsOf(c)) })) : [];
  return { parts, pieces, cardLeft: Math.round(checks.getBoundingClientRect().left) };
})()`;

// ---------- AC1 ----------

for (const width of [1280, 375]) {
  for (const id of ['0001', '0008']) {
    test(`0164 AC1: at ${width} px, ${id}'s dependency note shares the text size and baseline of "5 criteria", or starts its own line at the left edge`, skip, () => withBoard(async b => {
      const { parts, cardLeft } = await b.js(ROW(id));
      const [criteria, lint] = parts;
      const note = parts.find(p => /^(unlocks|waiting on) /.test(p.text));
      assert.ok(note, `found the note: ${JSON.stringify(parts)}`);
      assert.match(criteria.text, /criteria$/);
      assert.equal(lint.text, 'lint passes');
      for (const p of [lint, note]) assert.equal(p.size, criteria.size, `"${p.text}" is the size of "${criteria.text}"`);
      assert.equal(lint.bottom, criteria.bottom, 'the lint result is on the line of the criteria');
      assert.equal(criteria.left, cardLeft, 'the criteria start at the left edge');
      if (note.bottom === criteria.bottom) assert.ok(note.left > lint.left, 'on the same line, after the lint result');
      else {
        assert.ok(note.bottom > criteria.bottom, `on a line of its own, under the criteria: ${JSON.stringify(parts)}`);
        assert.equal(note.left, criteria.left, 'which starts at the left edge, not indented');
      }
      // Nothing in it pushes its line out.
      if (note.lastBottom === note.bottom) assert.ok(Math.abs(note.height - criteria.height) <= 1, `on one line, the note is ${note.height} px high, as "${criteria.text}" is ${criteria.height} px`);
    }, { width }));
  }
}

test('0164 AC1: on a phone, the seven-id note doesn\'t fit beside the criteria, so it starts its own line (the case above checks it lines up)', skip, () => withBoard(async b => {
  const { parts } = await b.js(ROW('0001'));
  const note = parts.find(p => p.text.startsWith('unlocks '));
  assert.ok(note.bottom > parts[0].bottom, `the note wrapped: ${JSON.stringify(parts)}`);
}, { width: 375 }));

// ---------- AC2 ----------

test('0164 AC2: the note reads "unlocks 0002, 0003, …" with each comma straight after its id', async () => {
  const p = fakePage([board()]);
  await p.settle();
  const card = items(p).find(n => p.all(n).some(x => x.className === 'id' && x._text === '0001'));
  const note = p.all(card).find(n => n.tagName === 'span' && /^unlocks /.test(n.textContent || ''));
  assert.equal(note.textContent, `unlocks ${UNLOCKS.join(', ')}`);
});

for (const width of [1280, 375]) {
  test(`0164 AC2: at ${width} px, there's no gap between an id and its comma, one space before the next id, and each id sits on the text's baseline`, skip, () => withBoard(async b => {
    for (const id of ['0001', '0008']) {
      const { pieces } = await b.js(ROW(id));
      const gotos = pieces.filter(p => p.goto);
      assert.ok(gotos.length >= 1, `${id} has linked ids`);
      for (const [i, p] of pieces.entries()) {
        assert.equal(p.size, pieces[0].size, `"${p.text}" is the size of "${pieces[0].text}"`);
        if (!p.goto) continue;
        const prev = pieces[i - 1], next = pieces[i + 1];
        // An id to the right of the text before it is on its line, so on its baseline.
        if (p.textLeft > prev.textLeft) assert.equal(p.textBottom, prev.textBottom, `${id}: ${p.text} is on the baseline of "${prev.text}"`);
        if (next) {
          assert.equal(next.text, ', ');
          assert.ok(Math.abs(next.textLeft - p.textRight) < 1, `${id}: the comma after ${p.text} is ${(next.textLeft - p.textRight).toFixed(1)} px from it`);
          // The next id starts where the ", " ends: the comma and one space are all that's between them.
          const after = pieces[i + 2];
          if (after.textLeft > p.textLeft) assert.ok(Math.abs(after.textLeft - next.textRight) < 1, `${id}: ${(after.textLeft - next.textRight).toFixed(1)} px from the comma after ${p.text} to ${after.text}`);
        }
      }
    }
  }, { width }));
}

test('0164 AC2: under 700 px each id\'s tap area is at least 44 px each way, its text in line with the note\'s', skip, () => withBoard(async b => {
  for (const id of ['0001', '0008']) {
    const { pieces } = await b.js(ROW(id));
    for (const [i, p] of pieces.entries()) {
      if (!p.goto) continue;
      assert.ok(p.box.height >= 44 && p.box.right - p.box.left >= 44, `${id}: ${p.text}'s tap area is ${p.box.right - p.box.left} by ${p.box.height} px`);
      const prev = pieces[i - 1];
      if (p.textLeft > prev.textLeft) assert.ok(p.box.top < prev.textBottom - 20 && p.box.bottom > prev.textBottom + 10, `${id}: ${p.text}'s tap area reaches above and below the line`);
    }
  }
}, { width: 375 }));

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
  const at = await b.js(`(() => { const r = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0008').querySelector('.title').getBoundingClientRect(); return [r.left + 4, r.top + r.height / 2]; })()`);
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

// ---------- AC4 ----------

test('0164 AC4: on a phone, tapping an id near the top of its tap area scrolls to that ticket and briefly highlights it', skip, () => withBoard(async b => {
  const at = await b.js(`(() => { const btn = [...[...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0001').querySelectorAll('.goto')].find(n => n.textContent === '0007');
    btn.scrollIntoView({ block: 'center' }); const r = btn.getBoundingClientRect(); return [r.left + r.width / 2, r.top + 4]; })()`);
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at[0], y: at[1] }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.until(`[...document.querySelectorAll('.flash')].some(n => n.querySelector('.id').textContent === '0007')`, 'the highlight on 0007');
  const r = await b.js(`(() => { const n = document.querySelector('.flash'); const box = n.getBoundingClientRect(); return { inView: box.bottom > 0 && box.top < innerHeight, open: document.querySelectorAll('.item.open').length }; })()`);
  assert.deepEqual(r, { inView: true, open: 0 });
  await b.until(`!document.querySelector('.flash')`, 'the highlight to end by itself');
}, { width: 375 }));
