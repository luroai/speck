import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { timeLine } from './support/time-line-0500.mjs';

// ---------- 0484: a closed Build card's bug, fix or document tag shows whole on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.now(); // the real browser's clock too
const ago = s => new Date(NOW - s * 1000).toISOString();
// 0500: the blocked bug ticket's line, its time read against the clock: at least the 5,990 seconds its ticket started
// before this file loaded, and no more than the time since then allows, however long the panel took to start.
const bugLine = (text, message) => timeLine(text, { before: 'speck will answer · Review 2', after: 'bug', least: 5990, most: 5990 + Math.ceil((Date.now() - NOW) / 1000) + 1 }, message);
// SPECK_TEST_0500_DELAY: seconds to wait before starting each panel, to check the line's time when it starts late (0500).
const DELAY = Number(process.env.SPECK_TEST_0500_DELAY) || 0;
const approved = o => ({ started: ago(1212), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });

// 0901: a blocked bug ticket whose line is "speck will answer · Review 2 · MM:SS · bug", its time counting up from 5,990 seconds; 0902: a finished document
// task; 0903: a fix ticket waiting for you; 0904: one under review, its grid of lights and its reviewer's long model in
// the line; 0905: no tag.
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

// Each closed Build card's status line, and each part in it: its text, whether it shows inside the line, whether its
// text reaches past it or the line (cut short), and for a tag, what a tap at its middle reaches.
const LINES = `(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); // after the page has handled a resize
  return [...document.querySelectorAll('#queue .q:not(.open)')].map(c => {
    const status = c.firstElementChild.children[1], box = status.getBoundingClientRect();
    const parts = [...status.children].filter(n => !n.classList.contains('sep')).map(n => {
      const r = n.getBoundingClientRect(), hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      const words = document.createRange(); words.selectNodeContents(n); const w = words.getBoundingClientRect(); // all its text, as laid out
      return { text: n.textContent, cls: n.className, width: r.width,
        inside: r.right <= box.right + 0.5 && r.left >= box.left - 0.5, cut: w.right > Math.min(r.right, box.right) + 0.5,
        ellipsis: getComputedStyle(n).textOverflow, tapped: !!hit && (hit === n || n.contains(hit)) };
    });
    return { id: c.querySelector('.id').textContent, text: status.textContent, height: box.height, lineHeight: parseFloat(getComputedStyle(status).lineHeight), parts };
  });
})()`;

// The rule 0484 added, taken out of the page, and the widths its page script gave the words, so the page can be
// measured as it was before them.
const WITHOUT = `(() => {
  let gone = 0;
  for (const sheet of document.styleSheets) for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    if (/\\.progress > :is\\(\\.say, \\.by\\)/.test(sheet.cssRules[i].selectorText || '')) { sheet.deleteRule(i); gone++; }
  }
  for (const w of document.querySelectorAll('#queue .progress > *')) w.style.maxWidth = '';
  return gone;
})()`;
// Where everything a card's top row draws sits, in the card: each piece of its text, as laid out (a space alone draws
// nothing), and each box that
// draws something of its own (its lights' dots, its tags), each by its left, top, width and height.
const SPOTS = `(async () => {
  await document.fonts.ready;
  const out = {}, spot = (what, r, at) => [what, ...[r.left - at.left, r.top - at.top, r.width, r.height].map(x => +x.toFixed(2))];
  for (const c of document.querySelectorAll('#queue .q')) {
    const at = c.getBoundingClientRect(), top = c.querySelector('.top'), spots = [];
    const walk = document.createTreeWalker(top, NodeFilter.SHOW_TEXT);
    for (let t; (t = walk.nextNode());) if (t.data.trim()) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) spots.push(spot(JSON.stringify(t.data), x, at)); }
    for (const n of top.querySelectorAll('.lights i, .tag, .dep-chip, .step')) spots.push(spot(n.className, n.getBoundingClientRect(), at));
    out[c.querySelector('.id').textContent] = spots;
  }
  return out;
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
const isTag = p => /\btag\b/.test(p.cls);
const isWords = p => /\b(say|by)\b/.test(p.cls);

for (const touch of [true, false]) {
  test(`0484 AC1 AC2: at every width from 320 px ${touch ? 'on a touch screen' : 'with a mouse'}, in both looks, a closed Build card's tag, stage and time show whole, and its words give up room first`, skip, async () => {
    const { panel, b } = await open(320, touch);
    try {
      for (const theme of ['light', 'dark']) {
        await look(b, theme);
        for (let width = 320; width <= 480; width += 5) {
          await resize(b, width);
          const lines = await b.js(LINES);
          assert.equal(lines.length, TICKETS.length, `${width} px: every card closed`);
          for (const l of lines) {
            const at = `${theme}, ${width} px, ${l.id} (${l.text})`;
            assert.ok(l.height <= l.lineHeight + 0.5, `${at}: one line (${l.height} px)`);
            for (const p of l.parts.filter(x => !isWords(x))) {
              assert.ok(p.inside, `${at}: "${p.text}" shows inside the line`);
              assert.ok(!p.cut, `${at}: "${p.text}" isn't cut off`);
            }
            for (const p of l.parts.filter(isTag)) assert.ok(p.tapped, `${at}: a tap on "${p.text}" reaches it`);
            for (const p of l.parts.filter(x => isWords(x) && x.cut)) assert.equal(p.ellipsis, 'ellipsis', `${at}: "${p.text}" is cut short with …`);
          }
          const want = { '0901': 'bug', '0902': 'task', '0903': 'fix', '0904': 'bug' };
          for (const [id, tag] of Object.entries(want)) assert.equal(lines.find(l => l.id === id).parts.filter(isTag).map(p => p.text).join(), tag, `${theme}, ${width} px, ${id}: its tag`);
        }
      }
    } finally { await b.close(); await stop(panel); }
  });
}

test('0484 AC2: at 320 px and 375 px, in both looks, the blocked bug ticket\'s line and the finished document task\'s line keep their stage, time and tag, and cut only their words', skip, async () => {
  const { panel, b } = await open(320);
  try {
    for (const theme of ['light', 'dark']) {
      await look(b, theme);
      for (const width of [320, 375]) {
        await resize(b, width);
        const lines = await b.js(LINES);
        const bug = lines.find(l => l.id === '0901'), doc = lines.find(l => l.id === '0902');
        bugLine(bug.text, `${theme}, ${width} px: the blocked bug ticket's line`);
        assert.match(doc.text, /^Read the result · \S.* · \d+:\d{2} · task$/, `${theme}, ${width} px: the document task's line`);
        for (const l of [bug, doc]) {
          const [words, ...rest] = l.parts;
          assert.match(words.cls, /\bsay\b/, `${l.id}: its words come first`);
          assert.ok(words.width > 0, `${theme}, ${width} px, ${l.id}: its words have room left (${words.width} px)`);
          for (const p of rest) assert.ok(p.inside && !p.cut, `${theme}, ${width} px, ${l.id}: "${p.text}" whole`);
          if (words.cut) assert.equal(words.ellipsis, 'ellipsis', `${l.id}: cut short with …`);
        }
      }
    }
  } finally { await b.close(); await stop(panel); }
});

test('0484 AC2: when the line is short of room, the words are cut short before anything else', skip, async () => {
  const { panel, b } = await open(320);
  try {
    const bug = (await b.js(LINES)).find(l => l.id === '0901');
    assert.ok(bug.parts[0].cut, `at 320 px, "${bug.parts[0].text}" is cut short (${bug.parts[0].width} px)`);
    assert.equal(bug.parts[0].ellipsis, 'ellipsis');
    for (const p of bug.parts.slice(1)) assert.ok(p.inside && !p.cut, `"${p.text}" whole while the words are cut`);
  } finally { await b.close(); await stop(panel); }
});

test('0484 AC3: a closed card whose line fits, and an open card, sit exactly as they did before 0484, in both looks', skip, async () => {
  const { panel, b } = await open(700);
  try {
    await b.js(`(document.querySelectorAll('#queue .q .top')[2].click(), true)`); // open one card
    await b.until(`document.querySelectorAll('#queue .q.open').length === 1`, 'an open card');
    for (const theme of ['light', 'dark']) {
      await look(b, theme);
      const lines = await b.js(LINES);
      for (const l of lines) for (const p of l.parts) assert.ok(!p.cut && p.inside, `${l.id}: "${p.text}" fits at 700 px`);
      const after = await b.js(SPOTS);
      assert.equal(Object.keys(after).length, TICKETS.length);
      assert.equal(await b.js(WITHOUT), 1, 'the rule 0484 added was taken out');
      const before = await b.js(SPOTS);
      assert.deepEqual(Object.keys(after), Object.keys(before), `${theme}: the same cards`);
      for (const id of Object.keys(after)) {
        assert.deepEqual(after[id].map(x => x[0]), before[id].map(x => x[0]), `${theme}, ${id}: the same text and boxes`);
        after[id].forEach((x, i) => x.slice(1).forEach((v, j) => assert.ok(Math.abs(v - before[id][i][j + 1]) <= 0.25,
          `${theme}, ${id}: ${x[0]} within a quarter of a pixel of where it was (${x.slice(1)} against ${before[id][i].slice(1)})`)));
      }
      await b.send('Page.reload');
      await b.until(`document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel again');
      await b.js(openLane('build'));
      await b.js(`(document.querySelectorAll('#queue .q .top')[2].click(), true)`);
      await b.until(`document.querySelectorAll('#queue .q.open').length === 1`, 'an open card again');
    }
  } finally { await b.close(); await stop(panel); }
});

test('0484 AC3: a closed card\'s line, its words cut short or not, copies as it did before 0484', skip, async () => {
  const { panel, b } = await open(320);
  const COPY = `[...document.querySelectorAll('#queue .q:not(.open)')].map(c => { const line = c.firstElementChild.children[1], r = document.createRange();
    r.selectNodeContents(line); getSelection().removeAllRanges(); getSelection().addRange(r); return [c.querySelector('.id').textContent, getSelection().toString(), line.innerText]; })`;
  try {
    const after = await b.js(COPY);
    const bug = after.find(([id]) => id === '0901');
    assert.equal(bug[1], bug[2]);
    bugLine(bug[1], 'the cut line copies whole, on one line');
    assert.equal(await b.js(WITHOUT), 1);
    const before = await b.js(COPY);
    const sameTime = x => x.map(([id, sel, text]) => [id, sel.replace(/\d+:\d\d/g, 'MM:SS'), text.replace(/\d+:\d\d/g, 'MM:SS')]); // its clock ticks between
    assert.deepEqual(sameTime(after), sameTime(before), 'every closed card copies as before');
  } finally { await b.close(); await stop(panel); }
});
