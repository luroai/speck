// 0479: the Pipeline log is one card in a lane card's frame (0478) that fills the window and holds still, and only the
// log box inside it scrolls, shrinking to make room for a stale page's line.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fakePage, page, ROOT, findChrome, browserPage, styles, model, settingsScript, pageScript, popupsScript, headerScript, cssRules, cssValue } from './support/panel.mjs';

const ON = { on: true, pid: 4242 };
const state = (o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman: { word: 'Idle' }, run_log: '1', ...o });
const LINES = Array.from({ length: 200 }, (_, i) => `10:${String(i % 60).padStart(2, '0')} line ${200 - i}`); // newest (line 200) first, as /api/run-log gives them
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };

// ---------- quick: the frame's rules ----------

test('0479 AC1: the pop-up is clear of a phone\'s status bar and home indicator, and its frame is the lane card\'s colour', () => {
  const pad = cssValue(cssRules('#foreman'), 'padding');
  assert.match(pad, /env\(safe-area-inset-top\)/, 'clear of the status bar');
  assert.match(pad, /env\(safe-area-inset-bottom\)/, 'and the home indicator');
  for (const sel of ['#foreman .top', '#foreman .fm-body']) assert.equal(cssValue(cssRules(sel), 'background'), 'var(--bezel)', `${sel} is on the frame`);
  assert.equal(cssValue(cssRules('#foreman .top .title::before'), 'background'), 'var(--lcd-red)', 'speck\'s red dot, as the header\'s');
});

function popPage(responses, globals = {}) {
  let focused = null;
  const made = n => {
    n.focus = () => { focused = n; };
    n.getBoundingClientRect = () => (n.className === 'top' ? { left: 300, right: 1060, top: 0, bottom: 40 } : { left: 0, right: 0, top: 0, bottom: 0 });
  };
  const p = fakePage(responses, { scrollX: 0, scrollY: 0, scrollTo() {}, ...globals }, { made });
  for (const id of ['foreman', 'run']) made(p.byId(id));
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  return p;
}

test('0479 AC4: on the fake page, the title row, the stale line\'s place and the log box are where the frame expects them, and Close, Escape and a click beside it still close it', async () => {
  for (const how of ['Close', 'Escape', 'beside']) {
    const p = popPage([state(), { lines: LINES.slice(0, 3), stamp: '1' }]);
    await p.settle();
    p.press(p.byId('run'));
    await p.settle();
    const box = p.byId('foreman'), [top, body] = box.children;
    assert.match(top.className, /\btop\b/);
    assert.equal(top.children.map(n => n.className).join(' '), 'title close', 'the title, then Close at the end of the row');
    assert.deepEqual(body.children.map(n => n.className), ['fm-stale', 'fm-log']);
    assert.equal(p.all(body.children[1]).filter(n => n.tagName === 'li').length, 3, 'the log\'s lines');
    assert.ok(within(p.focused(), box), `${how}: the focus is in it`);
    if (how === 'Close') p.press(top.children[1]);
    else if (how === 'Escape') p.key('Escape');
    else { const e = { target: box, clientX: 100, stopPropagation() {}, preventDefault() {} }; box.listeners.pointerdown(e); box.listeners.click(e); }
    assert.equal(box.hidden, true, `${how}: shut`);
    assert.equal(p.focused(), p.byId('run'), `${how}: the focus back on the screen`);
  }
});

// ---------- slow: in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// The board is window.__board, so a test can change it and send the page a ping to draw it again.
const FAKE = (board, log) => `(() => {
  window.__board = ${JSON.stringify(board)}; const log = ${JSON.stringify(log)};
  window.fetch = async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? log : String(url).startsWith('/api/state') ? window.__board : {}) });
  window.EventSource = class { constructor() { this.l = {}; this.readyState = 1; window.__ping = () => this.l.message && this.l.message({ data: String(Date.now()) }); setTimeout(window.__ping, 10); } addEventListener(t, f) { this.l[t] = f; } close() {} };
})();`;

async function openLog(b, width, height) {
  await b.send('Page.enable');
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE(state(), { lines: LINES, stamp: '1' }) });
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: model() });
  await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  // As in 0470: a page opened from its file can't load its scripts, styles or font from the panel, so they're put in.
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0479-')), 'panel.html');
  fs.writeFileSync(copy, page().replace('<script src="panel-settings.js"></script>', () => `<script>${settingsScript()}</script>`)
    .replace('<script src="panel.js" data-page="{{page}}" data-token="{{token}}"></script>', () => `<script data-page="{{page}}" data-token="{{token}}">${pageScript()}</script>`)
    .replace('<script src="panel-popups.js"></script>', () => `<script>${popupsScript()}</script>`)
    .replace('<script src="panel-header.js"></script>', () => `<script>${headerScript()}</script>`));
  const url = pathToFileURL(copy).href, font = fs.readFileSync(path.join(ROOT, 'templates', 'fonts', 'Doto.ttf')).toString('base64');
  await b.send('Page.navigate', { url });
  await b.until(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`, 'the page');
  await b.js(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(styles())}; document.head.appendChild(s); return true; })()`);
  await b.js(`(async () => { const f = new FontFace('Doto', Uint8Array.from(atob(${JSON.stringify(font)}), c => c.charCodeAt(0)).buffer, { weight: '100 900' });
    document.fonts.add(await f.load()); return true; })()`);
  await b.until(`!!document.getElementById('run') && document.getElementById('run').getAttribute('aria-label') !== null`, 'the board');
  await b.js(`document.getElementById('run').click(), true`);
  await b.until(`document.querySelectorAll('#foreman ol.run-log li').length === 200`, 'the 200 lines in the pop-up');
}

// Where everything is, and whether anything but the log box can scroll.
const MEASURE = `(() => {
  const v = document.getElementById('foreman'), top = v.querySelector('.top'), body = v.querySelector('.fm-body'), log = v.querySelector('.run-log');
  const t = top.querySelector('.title'), close = top.querySelector('.close'), stale = v.querySelector('.fm-stale');
  const r = n => { const b = n.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
  const lane = [...document.querySelectorAll('main > section')].map(s => ({ s, b: s.getBoundingClientRect() })).find(x => x.b.width > 0);
  const ls = lane && getComputedStyle(lane.s), cs = getComputedStyle(top), bs = getComputedStyle(body), dot = getComputedStyle(t, '::before');
  const bezel = (() => { const d = document.createElement('div'); d.style.background = 'var(--bezel)'; document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; })();
  const ink = (() => { const d = document.createElement('div'); d.style.color = 'var(--bezel-ink)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })();
  const se = document.scrollingElement;
  return { w: innerWidth, h: innerHeight, top: r(top), body: r(body), log: r(log), title: r(t), close: r(close), stale: stale.hidden ? null : r(stale),
    laneFrame: lane ? { left: lane.b.left + parseFloat(ls.paddingLeft), right: lane.b.right - parseFloat(ls.paddingRight) } : null,
    laneSide: 4, // 0480: the lanes are light cards now, so the log keeps 0478's 4 px frame of its own
    bezel, topBg: cs.backgroundColor, bodyBg: bs.backgroundColor, corners: [cs.borderTopLeftRadius, cs.borderTopRightRadius, bs.borderBottomLeftRadius, bs.borderBottomRightRadius],
    side: [parseFloat(bs.paddingLeft), parseFloat(bs.paddingRight), parseFloat(bs.paddingBottom)],
    titleFont: getComputedStyle(t).fontFamily, titleWeight: getComputedStyle(t).fontWeight, nameFont: getComputedStyle(document.querySelector('.bezel .name')).fontFamily,
    dot: dot.backgroundColor, nameDot: getComputedStyle(document.querySelector('.bezel .name'), '::before').backgroundColor, dotW: parseFloat(dot.width),
    ink, titleColor: getComputedStyle(t).color, titleText: t.textContent, titleRects: t.getClientRects().length,
    pageScrolls: se.scrollHeight > se.clientHeight || se.scrollWidth > se.clientWidth, popScrolls: v.scrollHeight > v.clientHeight || v.scrollWidth > v.clientWidth,
    bodyScrolls: body.scrollHeight > body.clientHeight, topScrolls: top.scrollHeight > top.clientHeight,
    logScrolls: log.scrollHeight > log.clientHeight, logOverflow: getComputedStyle(log).overflowY };
})()`;

test('0479 AC1 and AC2: in a real browser at 390 × 844 and 1200 × 800 with 200 lines, the log is a lane card\'s frame filling the window, up to the lanes\' column, and only the log box scrolls', chrome, async () => {
  const b = await browserPage('about:blank');
  try {
    await openLog(b, 390, 844);
    // AC4: it opens on the newest line, at the bottom of the log box (0459).
    const opened = await b.js(`(() => { const l = document.querySelector('#foreman ol.run-log'); return { gap: l.scrollHeight - l.clientHeight - l.scrollTop, last: l.lastElementChild.textContent }; })()`);
    assert.ok(opened.gap <= 1, `it opens at the newest line (${opened.gap} px short)`);
    assert.match(opened.last, /line 200$/, `which is the newest, first in what /api/run-log gives (${opened.last})`);
    for (const [width, height] of [[390, 844], [1200, 800]]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      for (const look of ['light', 'dark']) {
        await b.js(`document.documentElement.dataset.theme = ${JSON.stringify(look)}, true`);
        const m = await b.js(MEASURE), where = `${width} × ${height}, ${look}`;
        // AC1: the frame fills the window's height, and its width up to the lanes' column, centred.
        assert.equal(m.top.top, 8, `${where}: the frame starts at the top of the window, past the lanes' 8 px gap (${m.top.top})`);
        assert.equal(m.body.bottom, height - 8, `${where}: and ends at its bottom (${m.body.bottom})`);
        assert.ok(m.laneFrame, `${where}: a lane is there to line up with`);
        assert.equal(m.top.left, m.laneFrame.left, `${where}: its left side is the lane frames' (${m.top.left}, ${m.laneFrame.left})`);
        assert.equal(m.top.right, m.laneFrame.right, `${where}: and its right side (${m.top.right}, ${m.laneFrame.right})`);
        assert.equal(m.body.left, m.top.left); assert.equal(m.body.right, m.top.right);
        assert.ok(m.top.width <= 720, `${where}: no wider than the panel's column (${m.top.width})`);
        if (width >= 720) assert.ok(Math.abs(m.top.left - (width - m.top.right)) <= 1, `${where}: centred`);
        else assert.equal(m.top.left, 16, `${where}: across the window, with the lanes' 16 px sides`);
        // A lane card's frame: its colour, thickness and corners.
        assert.equal(m.topBg, m.bezel, `${where}: the title row is on --bezel`);
        assert.equal(m.bodyBg, m.bezel, `${where}: so is the frame round the log`);
        assert.deepEqual(m.side, [m.laneSide, m.laneSide, m.laneSide], `${where}: its sides and bottom are a lane frame's ${m.laneSide} px`);
        assert.deepEqual(m.corners, ['12px', '12px', '12px', '12px'], `${where}: its corners are 12 px, as a lane frame's`);
        assert.equal(m.log.left, m.body.left + m.laneSide); assert.equal(m.log.right, m.body.right - m.laneSide);
        assert.equal(m.log.bottom, m.body.bottom - m.laneSide, `${where}: the log box fills the frame to its bottom side`);
        // Its title row: speck's red dot, Pipeline log in the dot-matrix letters, and Close at its end.
        assert.equal(m.titleText, 'Pipeline log');
        assert.equal(m.titleColor, m.ink, `${where}: in the frame's light ink (${m.titleColor})`);
        assert.equal(m.titleFont, m.nameFont, `${where}: in the header's lettering`);
        assert.equal(m.titleWeight, '900');
        assert.equal(m.dot, m.nameDot, `${where}: speck's own dot`);
        assert.ok(m.dotW > 0, `${where}: which shows`);
        assert.equal(m.titleRects, 1, `${where}: on one line`);
        assert.ok(m.close.right <= m.top.right && m.top.right - m.close.right <= 8, `${where}: Close at the row's right-hand end`);
        assert.ok(m.close.top < m.title.bottom && m.title.top < m.close.bottom, `${where}: on the title's row`);
        // AC2: only the log box scrolls, and it takes the room left.
        assert.equal(m.pageScrolls, false, `${where}: the page doesn't scroll`);
        assert.equal(m.popScrolls, false, `${where}: nor the pop-up`);
        assert.equal(m.bodyScrolls || m.topScrolls, false, `${where}: nor the frame`);
        assert.equal(m.log.top, m.top.bottom, `${where}: the log box starts under the title row`);
        assert.equal(m.logScrolls, true, `${where}: the log box has more than it shows`);
        assert.equal(m.logOverflow, 'auto', `${where}: and scrolls`);
      }
      // Scrolling the log moves the log alone, and the pop-up won't scroll even when asked to.
      const moved = await b.js(`(() => {
        const v = document.getElementById('foreman'), log = v.querySelector('ol.run-log'), before = v.querySelector('.top').getBoundingClientRect().top;
        log.scrollTop = 0; const up = log.scrollTop; log.scrollTop = log.scrollHeight; v.scrollTop = 500; document.scrollingElement.scrollTop = 500;
        return { up, down: log.scrollTop, pop: v.scrollTop, page: document.scrollingElement.scrollTop, before, after: v.querySelector('.top').getBoundingClientRect().top };
      })()`);
      assert.ok(moved.down > moved.up, `${width} × ${height}: the log box scrolls`);
      assert.equal(moved.pop, 0, `${width} × ${height}: the pop-up stays put`);
      assert.equal(moved.page, 0, `${width} × ${height}: and the page`);
      assert.equal(moved.after, moved.before, `${width} × ${height}: and the frame`);
    }
    // At every width from 320 px and every height from 480 px.
    for (const width of [320, 360, 414, 600, 719, 720, 721, 1024, 1600]) {
      for (const height of [480, 568, 700, 1000]) {
        await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
        const m = await b.js(MEASURE), where = `${width} × ${height}`;
        assert.equal(m.pageScrolls || m.popScrolls || m.bodyScrolls || m.topScrolls, false, `${where}: nothing but the log scrolls`);
        assert.equal(m.top.top, 8, `${where}: the frame's top`); assert.equal(m.body.bottom, height - 8, `${where}: its bottom`);
        assert.equal(m.titleRects, 1, `${where}: the title on one line`);
        assert.ok(m.title.right <= m.close.left && m.close.right <= m.top.right, `${where}: the title and Close fit the row`);
        assert.ok(m.log.height > 100, `${where}: the log box has room (${m.log.height})`);
      }
    }
  } finally { await b.close(); }
});

test('0479 AC1: in a real browser, the frame clears a phone\'s status bar and home indicator', chrome, async t => {
  const b = await browserPage('about:blank');
  try {
    await openLog(b, 390, 844);
    try { await b.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } }); } catch { t.skip('this Chromium can\'t emulate a phone\'s safe areas'); return; }
    const m = await b.js(MEASURE);
    assert.equal(m.top.top, 47 + 8, `past the status bar (${m.top.top})`);
    assert.equal(m.body.bottom, 844 - 34 - 8, `and above the home indicator (${m.body.bottom})`);
    assert.equal(m.pageScrolls || m.popScrolls || m.bodyScrolls, false, 'and still nothing but the log scrolls');
  } finally { await b.close(); }
});

test('0479 AC3: in a real browser, a stale page\'s line sits in the frame between the title row and the log, which shrinks for it and grows back when it goes', chrome, async () => {
  const b = await browserPage('about:blank');
  try {
    await openLog(b, 390, 844);
    for (const [width, height] of [[390, 844], [320, 480], [1200, 800]]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      const where = `${width} × ${height}`, before = await b.js(MEASURE);
      assert.equal(before.stale, null, `${where}: no stale line yet`);
      await b.js(`window.__board = { ...window.__board, page: 'newer' }, window.__ping(), true`);
      await b.until(`!!document.getElementById('foreman-reload') && !document.querySelector('#foreman .fm-stale').hidden`, 'the stale line');
      const m = await b.js(MEASURE);
      assert.ok(m.stale.top >= m.top.bottom && m.stale.bottom <= m.log.top, `${where}: between the title row and the log`);
      assert.ok(m.stale.left >= m.body.left && m.stale.right <= m.body.right, `${where}: inside the frame`);
      const reload = await b.js(`(() => { const r = document.getElementById('foreman-reload').getBoundingClientRect(), s = document.querySelector('#foreman .fm-stale').getBoundingClientRect(); return r.top >= s.top && r.bottom <= s.bottom && r.height > 0; })()`);
      assert.ok(reload, `${where}: with its Reload page button`);
      assert.ok(m.log.height < before.log.height, `${where}: the log box shrinks (${before.log.height} to ${m.log.height})`);
      assert.equal(m.top.top, before.top.top, `${where}: the frame's top stays`); assert.equal(m.body.bottom, before.body.bottom, `${where}: and its bottom`);
      assert.equal(m.pageScrolls || m.popScrolls || m.bodyScrolls || m.topScrolls, false, `${where}: nothing but the log scrolls`);
      await b.js(`window.__board = { ...window.__board, page: undefined }, window.__ping(), true`);
      await b.until(`document.querySelector('#foreman .fm-stale').hidden`, 'the stale line to go');
      const after = await b.js(MEASURE);
      assert.equal(after.log.height, before.log.height, `${where}: the log box grows back`);
    }
  } finally { await b.close(); }
});
