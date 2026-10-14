import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0135: remove the numbers beside the panel's section headings ----------

const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const staticHtml = () => page().replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
// What each section header held before 0134: its heading, then its live count (or the Plan toggles) and its hint, which
// 0162 removed.
const BEFORE = [['Plan', ['H2', 'toggles']], ['Build', ['H2', 'n']], ['Shipped', ['H2', 'n']]];

test('0135 AC1-AC2: in a real browser, each section header starts with its heading and shows only what it did before 0134', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`!!document.querySelector('main .id')`, 'a ticket id');
    const heads = await b.js(`[...document.querySelectorAll('.sh')].map(sh => {
      const h2 = sh.querySelector('h2');
      const before = [];
      for (let n = sh.firstChild; n && n !== h2; n = n.nextSibling) before.push(n.textContent.trim());
      const pseudo = [[sh, '::before'], [h2, '::before'], [h2, '::after']].map(([e, p]) => getComputedStyle(e, p).content);
      return { text: h2.textContent, first: sh.firstElementChild === h2, before: before.filter(Boolean),
        kids: [...sh.children].map(c => (c.tagName === 'H2' ? 'H2' : c.className)), pseudo,
        leftmost: [...sh.children].every(c => c === h2 || c.getBoundingClientRect().width === 0 || c.getBoundingClientRect().left >= h2.getBoundingClientRect().right) };
    })`);
    assert.deepEqual(heads.map(h => h.text), ['Plan', 'Build', 'Shipped'], 'AC2: the headings are exactly Plan, Build and Shipped');
    for (const [i, [name, kids]] of BEFORE.entries()) {
      const h = heads[i];
      assert.ok(h.first, `${name}: the h2 is the header's first element`);
      assert.deepEqual(h.before, [], `${name}: no text before the h2`);
      assert.deepEqual(h.kids, kids, `${name}: the header holds only what it did before 0134`);
      for (const c of h.pseudo) assert.ok(c === 'none' || c === 'normal', `${name}: no generated content (${c})`);
      assert.ok(h.leftmost, `${name}: nothing is shown to the left of the heading`);
    }
  } finally { await b.close(); await stop(panel); }
});

test('0135 AC2: in the static HTML, each section heading is still exactly Plan, Build or Shipped', () => {
  const html = staticHtml();
  for (const name of ['Plan', 'Build', 'Shipped']) assert.match(html, new RegExp(`<div class="sh"><h2>${name}</h2>`), name);
});

test('0135 AC3: no number span in a section header, and no .sh .num rule; td.num is unchanged', () => {
  const html = staticHtml();
  const headers = [...html.matchAll(/<div class="sh">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  assert.equal(headers.length, 3, 'three section headers');
  for (const h of headers) assert.doesNotMatch(h, /<span class="num"/, h);
  assert.doesNotMatch(css(), /\.sh\s+\.num\b/);
  assert.ok(css().includes('  td.num { color: var(--muted); text-align: right; font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; white-space: nowrap; }'), 'the td.num rule is as it was, at 12 px (0161)');
});
