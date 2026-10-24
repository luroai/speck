// 0470: the pop-up speck's screen opens has one title, Pipeline log, on its top row beside Close, in the header's
// dot-matrix lettering, with no Log heading under it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fakePage, page, ROOT, findChrome, browserPage, styles, model, settingsScript, pageScript, popupsScript, headerScript } from './support/panel.mjs';

const ON = { on: true, pid: 4242 };
const state = (o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman: { word: 'Idle' }, run_log: '1', ...o });
const LOG = { lines: ['10:02 0001 build started', '10:01 speck run on'], stamp: '1' };
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };

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
const pop = p => p.byId('foreman');
async function opened(board = state(), globals) {
  const p = popPage([board, LOG], globals);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}

// ---------- AC1: one title, Pipeline log, beside Close, and no Log heading ----------

test('0470 AC1: the top row reads Pipeline log beside Close, and no heading is under it', async () => {
  const p = await opened();
  const [top, body] = pop(p).children;
  assert.equal(top.textContent, 'Pipeline logClose');
  assert.equal(top.children.find(n => /\btitle\b/.test(n.className || '')).textContent, 'Pipeline log');
  assert.deepEqual(p.all(pop(p)).filter(n => /^h\d$/.test(n.tagName)).map(n => n.textContent), [], 'no Log heading');
  const log = body.children[1];
  assert.match(log.className, /\bfm-log\b/);
  assert.match(log.children[0].className, /\brun-log\b/, 'the log box is first in its section');
  assert.equal(log.children.length, 1, 'and nothing else is in it');
  assert.equal(p.all(log.children[0]).filter(n => n.tagName === 'li').length, 2, 'with the log\'s lines');
});

test('0470 AC1: the empty log, too, is straight under the top row, with no Log heading', async () => {
  const p = await opened(state({ run_log: undefined }));
  const log = pop(p).children[1].children[1];
  assert.equal(log.children.length, 1);
  assert.equal(log.textContent, 'speck run hasn\'t written anything yet.');
});

test('0470 AC1: the dialog\'s accessible name is Pipeline log', () => {
  assert.match(page().match(/<div class="foreman" id="foreman"[^>]*>/)[0], /aria-label="Pipeline log"/);
});

// ---------- AC3: Close, Escape, a click outside and the focus as before ----------

test('0470 AC3: opening puts the focus in the pop-up, and Close, Escape and a click beside it close it, the focus back on the screen', async () => {
  for (const how of ['Close', 'Escape', 'beside']) {
    const p = await opened();
    assert.ok(within(p.focused(), pop(p)), `${how}: the focus is in the pop-up`);
    if (how === 'Close') p.press(p.all(pop(p)).find(n => n.tagName === 'button' && n.textContent === 'Close'));
    else if (how === 'Escape') p.key('Escape');
    else {
      const e = { target: pop(p), clientX: 100, stopPropagation() {}, preventDefault() {} };
      pop(p).listeners.pointerdown(e);
      pop(p).listeners.click(e);
    }
    assert.equal(pop(p).hidden, true, `${how}: shut`);
    assert.equal(p.focused(), p.byId('run'), `${how}: the focus is back on the screen`);
  }
});

test('0470 AC3: a stale page\'s Reload page button sits between the top row and the log', async () => {
  const p = await opened(state({ page: 'newer' }), { location: { reload() {} } });
  const body = pop(p).children[1], reload = p.all(pop(p)).find(n => n.id === 'foreman-reload');
  assert.ok(within(reload, body.children[0]));
  assert.match(body.children[1].children[0].className, /\brun-log\b/);
});

// ---------- AC2: in a real browser, the title is in Doto at the header's weight, at least 18 px, on one line ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const FAKE = (board, log) => `(() => {
  const board = ${JSON.stringify(board)}, log = ${JSON.stringify(log)};
  window.fetch = async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? log : String(url).startsWith('/api/state') ? board : {}) });
  window.EventSource = class { constructor() { this.l = {}; this.readyState = 1; setTimeout(() => this.l.message && this.l.message({ data: '1' }), 10); } addEventListener(t, f) { this.l[t] = f; } close() {} };
})();`;

test('0470 AC2 and AC3: in a real browser, the title is in the header\'s Doto at 18 px or more, on one line beside Close from 320 px up, in both looks, and stays in view as the pop-up scrolls', chrome, async () => {
  const lines = Array.from({ length: 120 }, (_, i) => `10:${String(i % 60).padStart(2, '0')} line ${120 - i}`);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE(state(), { lines, stamp: '1' }) });
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: model() });
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    // As in 0415 AC5: a page opened from its file can't load its scripts, styles or font from the panel, so they're put in.
    const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0470-')), 'panel.html');
    fs.writeFileSync(copy, page().replace('<script src="/panel-settings.js"></script>', () => `<script>${settingsScript()}</script>`)
      .replace('<script src="/panel.js" data-page="{{page}}" data-token="{{token}}"></script>', () => `<script data-page="{{page}}" data-token="{{token}}">${pageScript()}</script>`)
      .replace('<script src="/panel-popups.js"></script>', () => `<script>${popupsScript()}</script>`)
      .replace('<script src="/panel-header.js"></script>', () => `<script>${headerScript()}</script>`));
    const url = pathToFileURL(copy).href, font = fs.readFileSync(path.join(ROOT, 'templates', 'fonts', 'Doto.ttf')).toString('base64');
    await b.send('Page.navigate', { url });
    await b.until(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`, 'the page');
    await b.js(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(styles())}; document.head.appendChild(s); return true; })()`);
    // A file page can't load /fonts/Doto.ttf either, so the font is put in from its own file.
    await b.js(`(async () => { const f = new FontFace('Doto', Uint8Array.from(atob(${JSON.stringify(font)}), c => c.charCodeAt(0)).buffer, { weight: '100 900' });
      document.fonts.add(await f.load()); return true; })()`);
    await b.until(`!!document.getElementById('run') && document.getElementById('run').getAttribute('aria-label') !== null`, 'the board');
    await b.js(`document.getElementById('run').click(), true`);
    await b.until(`!!document.querySelector('#foreman ol.run-log li')`, 'the log in the pop-up');
    assert.ok(await b.js(`[...document.fonts].some(f => f.family.replace(/"/g, '') === 'Doto' && f.status === 'loaded')`), 'Doto loaded');
    for (const width of [320, 375, 414, 600, 768, 1024, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 640, deviceScaleFactor: 1, mobile: width < 600 });
      for (const look of ['light', 'dark']) {
        const at = await b.js(`(() => {
          document.documentElement.dataset.theme = ${JSON.stringify(look)};
          const v = document.getElementById('foreman'), top = v.querySelector('.top'), t = top.querySelector('.title'), close = top.querySelector('.close');
          const cs = getComputedStyle(t), name = getComputedStyle(document.querySelector('.bezel .name'));
          const tr = t.getBoundingClientRect(), cr = close.getBoundingClientRect(), log = v.querySelector('.run-log').getBoundingClientRect();
          return { family: cs.fontFamily, weight: cs.fontWeight, nameFamily: name.fontFamily, nameWeight: name.fontWeight, size: parseFloat(cs.fontSize),
            rects: t.getClientRects().length, height: tr.height, lineHeight: parseFloat(cs.fontSize) * 1.6, sameRow: tr.top < cr.bottom && cr.top < tr.bottom,
            besideClose: tr.right <= cr.left, headings: v.querySelectorAll('h1, h2, h3, h4, h5, h6').length, gap: log.top - top.getBoundingClientRect().bottom,
            label: v.getAttribute('aria-label') };
        })()`);
        const where = `${width} px, ${look}`;
        assert.equal(at.family.split(',')[0].replace(/"/g, '').trim(), 'Doto', `${where}: Doto (${at.family})`);
        assert.equal(at.family, at.nameFamily, `${where}: the header's font`);
        assert.equal(at.weight, at.nameWeight, `${where}: the header's weight`);
        assert.ok(at.size >= 18, `${where}: at least 18 px (${at.size})`);
        assert.equal(at.rects, 1, `${where}: on one line`);
        assert.ok(at.height <= at.lineHeight, `${where}: one line high (${at.height} px)`);
        assert.ok(at.sameRow && at.besideClose, `${where}: beside Close`);
        assert.equal(at.headings, 0, `${where}: no heading`);
        assert.ok(at.gap >= 0 && at.gap <= 16, `${where}: the log box starts straight under the top row (${at.gap} px)`);
        assert.equal(at.label, 'Pipeline log');
      }
    }
    // The top row stays in view while the pop-up and the log scroll.
    // At 200 px high the log box's 12 lines don't fit under the top row, so the pop-up scrolls as well as the log.
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: true });
    const kept = await b.js(`(() => {
      const v = document.getElementById('foreman'), list = v.querySelector('ol.run-log');
      v.scrollTop = v.scrollHeight; list.scrollTop = 0;
      const top = v.querySelector('.top').getBoundingClientRect();
      return { scrolled: v.scrollTop, top: top.top, bottom: top.bottom };
    })()`);
    assert.ok(kept.scrolled > 0, 'the pop-up scrolled');
    assert.ok(kept.top >= -1 && kept.bottom <= 200, `the top row is still in view (${kept.top} to ${kept.bottom})`);
  } finally { await b.close(); }
});

test('0470 AC1: the brief calls it the Pipeline log pop-up', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(brief, /opens the Pipeline log pop-up/);
  assert.doesNotMatch(brief, /the Pipeline pop-up/);
});
