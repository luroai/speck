import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, cssRules, cssValue, findChrome, browserPage, T, idea, REST_LANES } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0600: the lanes look like the panel's other views ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LANES = { capture: 'capture-section', plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };

test('0600 AC1: a lane has no card of its own, and its list sits in the 16 px side margins with the log\'s hairline between rows', () => {
  const sec = cssRules('main > section');
  for (const prop of ['border-radius', 'background-clip', 'isolation']) assert.equal(cssValue(sec, prop), undefined, `no ${prop} on the lane`);
  assert.equal(cssValue(sec, 'padding'), '0', 'the lane has no gap round it');
  assert.deepEqual(cssRules('main > section::before'), [], 'no edge drawn over the lane');
  const list = cssRules('.lane-list');
  assert.equal(cssValue(list, 'padding'), '0 16px', 'its rows inside the 16 px side margins');
  assert.equal(cssValue(list, 'border-radius'), undefined);
  const hairline = cssValue(cssRules('#foreman.log-view .run-log .log-row'), 'border-bottom');
  assert.equal(hairline, '1px solid var(--line-soft)'); // 0601: a full pixel
  for (const sel of ['.q.row', '.item.row', '#shipped tr']) assert.equal(cssValue(cssRules(sel), 'border-bottom'), hairline, `${sel}: the log's hairline`);
});

test('0600 AC2: a lane has no title or dot of its own, and its line stays, under the tabs', () => {
  const html = page();
  assert.doesNotMatch(html, /lane-title/, 'no lane title in the page');
  assert.deepEqual(cssRules('.lane-title'), [], 'no style for one');
  assert.deepEqual(cssRules('.lane-title::before'), [], 'nor for its dot');
  const main = html.match(/<main>([\s\S]*?)<\/main>/)[1];
  for (const [lane, id] of Object.entries(LANES)) {
    const sec = main.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)</section>`))[1];
    assert.doesNotMatch(sec, /<h2/, `${lane}: no heading`);
    if (lane === 'shipped') assert.match(sec, /^\s*<div [^>]*class="lane-list"/, `${lane}: its list, with no line since 0606, as its tab gives the count`);
    else if (lane !== 'plan') assert.match(sec, /^\s*<div class="lane-n" id="[a-z]+-n"><\/div>\s*<div [^>]*class="lane-list"/, `${lane}: its line first, then its list`);
  }
  assert.match(html, /<nav class="tabs"[\s\S]*<\/nav>\s*<main>/, 'the tabs straight above the lanes');
});

test('0600 AC3: rows\' titles are 15 px medium on a 20 px line and their details 13 px muted, in every lane and view', () => {
  const v = (sel, prop) => cssValue(cssRules(sel), prop);
  for (const sel of ['.item .line .title', '.q .top .line .title', '#shipped .line .title', '#decided .decided-title', '#full-ticket .pane-row']) {
    assert.equal(v(sel, 'font-size'), '15px', `${sel}: size`);
    assert.equal(v(sel, 'font-weight'), '500', `${sel}: weight`);
  }
  for (const sel of ['.item.row .line .title', '#shipped .line .title', '#decided .decided-title', '#full-ticket .pane-row']) assert.equal(v(sel, 'line-height'), '20px', `${sel}: line height`);
  assert.equal(v('.item.row .line .title', 'font-size'), '15px');
  assert.equal(v('.item.row .line .title', 'font-weight'), '500');
  assert.equal(v('#foreman.log-view .run-log .log-text', 'font-size'), '15px', 'a log line\'s text, a row\'s main line');
  for (const sel of ['.q.row .where', '.item.row .checks', '#shipped .meta', '#foreman.log-view .run-log .log-more', '#foreman.log-view .run-log .at', '#decided .decided-when', '#decided .decided-fact .label']) {
    assert.equal(v(sel, 'font-size'), '13px', `${sel}: size`);
    assert.equal(v(sel, 'color'), 'var(--muted)', `${sel}: muted`);
  }
});

// ---------- in a real browser, at 320 px, in both looks ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const STATE = {
  run: { on: true },
  run_log: 'stamp-1',
  tickets: [
    T('0601', 'ready', { title: 'A ready ticket' }),
    T('0602', 'draft', { title: 'A draft ticket' }),
    T('0603', 'done', { title: 'A shipped ticket', started: ago(4000), approved: ago(3000), shipped: ago(2000), rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens: 100 }] }),
  ],
  ideas: [idea('2026-11-10-a-note', 'inbox')],
  decided: [{ id: '0601', title: 'A ready ticket', option: 'Split it', at: ago(600), criteria_changed: false, question: 'Split it?', other_options: ['Keep it'] }],
};
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (u.startsWith('/api/run-log')) return json({ lines: ['07:58:04 Launched 0601 (session a). Log: speck/.cache/runs/0601.log', '07:58:07 Shipped 0600.'] });
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (/\\/pack$/.test(u)) return json({ pack: '# Review pack' });
    return real(url, opts);
  };
})();`;

async function at320(theme, fn) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 2, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === 1 && document.fonts.status === 'loaded'`, 'the panel');
    assert.equal(await b.js('document.documentElement.dataset.theme'), theme);
    await fn(b);
  } finally { await b.close(); }
}
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`;
const STYLE = `const st = (n, pseudo) => { if (!n) return null; const c = getComputedStyle(n, pseudo); return { size: c.fontSize, weight: c.fontWeight, line: c.lineHeight, colour: c.color }; };`;

// Each lane at rest: its frame, its line, its list's box, its first row's text and hairline, and its rows' type.
const LANES_NOW = `(async () => {
  ${STYLE}
  const out = {};
  for (const lane of ['capture', 'plan', 'build', 'shipped']) {
    document.getElementById('tab-' + lane).click(); ${REST_LANES};
    await ${frames};
    const s = document.querySelector('main > section:not([hidden])'), f = getComputedStyle(s), list = s.querySelector('.lane-list'), lb = list.getBoundingClientRect();
    const row = list.querySelector('.q.row, .item.row, #shipped tr'), rb = row.getBoundingClientRect(), rs = getComputedStyle(row);
    const title = row.querySelector('.line .title'), details = row.querySelector('.where, .checks, .meta');
    out[lane] = { radius: f.borderTopLeftRadius, border: f.borderTopWidth, edge: getComputedStyle(s, '::before').content, headings: s.querySelectorAll('h2, .lane-title').length,
      line: s.querySelector('.lane-n') ? (() => { const n = s.querySelector('.lane-n'), b = n.getBoundingClientRect(); return { text: n.textContent, shown: b.height > 0, top: b.top }; })() : null,
      tabsBottom: document.getElementById('tabs').getBoundingClientRect().bottom, list: { left: lb.left, right: lb.right },
      row: { left: rb.left, right: rb.right, hairline: [rs.borderBottomStyle, rs.borderBottomColor, rs.borderBottomWidth] },
      title: { ...st(title), left: title.getBoundingClientRect().left }, details: st(details) };
  }
  return out;
})()`;

const VIEWS_NOW = `(async () => {
  ${STYLE}
  const out = {};
  const back = (n, sel) => { const b = n.querySelector(sel); if (!b) return null; return { ...st(b), before: getComputedStyle(b, '::before').content, border: getComputedStyle(b).borderTopWidth }; };
  // The Pipeline log
  document.getElementById('run').click();
  for (let i = 0; i < 50 && !document.querySelector('#foreman .log-row .log-text'); i++) await new Promise(r => setTimeout(r, 100));
  const fm = document.getElementById('foreman'), lr = fm.querySelector('.log-row'), ls = getComputedStyle(lr);
  out.log = { heading: st(fm.querySelector('.top .title')), back: back(fm, '.back'), text: st(lr.querySelector('.log-text')), more: lr.querySelector('.log-more') ? st(lr.querySelector('.log-more')) : null,
    row: { left: lr.getBoundingClientRect().left, hairline: [ls.borderBottomStyle, ls.borderBottomColor, ls.borderBottomWidth] }, textLeft: lr.querySelector('.at').getBoundingClientRect().left };
  fm.querySelector('.back').click();
  await ${frames};
  // Decided for you
  document.getElementById('decided-open').click();
  await ${frames};
  const dc = document.getElementById('decided');
  out.decided = { heading: st(dc.querySelector('.top .title')), back: back(dc, '.top .close'), title: st(dc.querySelector('.decided-title')), when: st(dc.querySelector('.decided-when')) };
  dc.querySelector('.top .close').click();
  await ${frames};
  // A ticket's full view
  document.getElementById('tab-build').click(); ${REST_LANES};
  document.querySelector('#queue .q .top').click();
  for (let i = 0; i < 50 && document.getElementById('full-ticket').hidden; i++) await new Promise(r => setTimeout(r, 100));
  const ft = document.getElementById('full-ticket'), pr = ft.querySelector('.pane-row');
  out.full = { heading: st(ft.querySelector('.top .title')), back: back(ft, '.top .close'), row: pr ? st(pr) : null };
  out.muted = (() => { const p = document.createElement('i'); p.style.color = 'var(--muted)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
  return out;
})()`;

for (const theme of ['light', 'dark']) {
  test(`0600 AC1 AC2 AC3 AC4: in the ${theme} look at 320 px, the lanes are flat lists in the views' margins and type, and the views share one heading and back link`, skip, async () => {
    await at320(theme, async b => {
      const views = await b.js(VIEWS_NOW);
      const lanes = await b.js(LANES_NOW);
      for (const [lane, l] of Object.entries(lanes)) {
        assert.equal(l.radius, '0px', `${lane}: no corners (AC1)`);
        assert.equal(l.border, '0px', `${lane}: no border (AC1)`);
        assert.ok(l.edge === 'none' || l.edge === 'normal', `${lane}: no edge drawn over it (AC1)`);
        assert.deepEqual([l.list.left, l.list.right], [0, 320], `${lane}: its list runs the panel's width (AC1)`);
        assert.equal(l.row.left, 16, `${lane}: its row inside the 16 px margin (AC1)`);
        assert.equal(l.row.right, 304, `${lane}: and the right one`);
        assert.equal(l.row.left, views.log.row.left, `${lane}: the log's margins`);
        assert.deepEqual(l.row.hairline, views.log.row.hairline, `${lane}: the log's hairline (AC1)`);
        assert.equal(l.headings, 0, `${lane}: no title of its own (AC2)`);
        if (l.line) { assert.ok(l.line.shown && l.line.text, `${lane}: its line kept (AC2)`); assert.ok(l.line.top >= l.tabsBottom - 0.5, `${lane}: under the tabs`); }
        assert.deepEqual([l.title.size, l.title.weight, l.title.line], ['15px', '500', '20px'], `${lane}: its rows' titles (AC3)`);
        assert.deepEqual([l.details.size, l.details.colour], ['13px', views.muted], `${lane}: its rows' details (AC3)`);
      }
      assert.ok(lanes.build.line && lanes.capture.line, 'Build and Capture keep their lines');
      assert.equal(lanes.shipped.line, null, '0606: Shipped\'s "in total" line is gone, as its tab gives the count');
      // AC3: the views' rows on the same scale
      assert.equal(views.log.text.size, '15px', 'a log line');
      assert.equal(views.log.text.line, '20px');
      if (views.log.more) assert.deepEqual([views.log.more.size, views.log.more.colour], ['13px', views.muted], 'its details');
      assert.deepEqual([views.decided.title.size, views.decided.title.weight, views.decided.title.line], ['15px', '500', '20px'], 'a call\'s title');
      assert.deepEqual([views.decided.when.size, views.decided.when.colour], ['13px', views.muted], 'its details');
      if (views.full.row) assert.deepEqual([views.full.row.size, views.full.row.weight, views.full.row.line], ['15px', '500', '20px'], 'a full view\'s row');
      // AC4: one heading and one back link
      assert.deepEqual(views.decided.heading, views.log.heading, 'Decided for you\'s heading as the log\'s');
      assert.deepEqual(views.full.heading, views.log.heading, 'the full view\'s heading as the log\'s');
      assert.deepEqual([views.log.heading.size, views.log.heading.weight], ['20px', '600']);
      assert.deepEqual(views.decided.back, views.log.back, 'Decided for you\'s back link as the log\'s');
      assert.deepEqual(views.full.back, views.log.back, 'the full view\'s back link as the log\'s');
      assert.equal(views.log.back.border, '0px', 'a link, not a box');
    });
  });
}
