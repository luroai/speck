import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, boardPage, click, stoppedClock, panelRepo, freePort, startPanel, stop, browserPage, findChrome } from './support/panel.mjs';

// ---------- 0608: speck asleep in an empty Build and Shipped, as in an empty Capture and Plan ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = new Date(2026, 9, 24, 14, 30, 0).getTime();
const shippedAt = (id, h, m) => { const at = new Date(2026, 9, 24, h, m, 0).toISOString(); return T(id, 'done', { started: at, finished: at }); };
const STATE = (tickets, o = {}) => ({ run: { on: false }, tickets, ideas: [], ...o });
const clean = s => s.replace(/\s+/g, ' ').trim();
const face = (p, box) => p.all(box).find(n => n.tagName === 'svg' && n.attrs?.['data-mood']);
const byClass = (p, n, re) => p.all(n).find(c => re.test(c.className));
const only = (p, id) => { const kids = p.byId(id).children; assert.equal(kids.length, 1, `${id} holds one message`); return kids[0]; };

test('0608 AC1: an empty Build shows speck asleep and "Nothing building", with a line saying ready tickets land there', async () => {
  const p = fakePage([STATE([])], { Date: stoppedClock(NOW) });
  await p.settle();
  const empty = only(p, 'queue');
  assert.match(empty.className, /\basleep\b/);
  assert.equal(face(p, empty).attrs['data-mood'], 'asleep');
  assert.equal(clean(byClass(p, empty, /^asleep-line\b/).textContent), 'Nothing building · Ready tickets land here.');
});

test('0608 AC1: under them, the line about what shipped last and the button to Plan stay', async () => {
  const p = fakePage([STATE([full('0201'), shippedAt('0433', 14, 18)])], { Date: stoppedClock(NOW) });
  await p.settle();
  const empty = only(p, 'queue'), kids = empty.children;
  assert.equal(kids[0].tagName, 'svg', 'speck first');
  assert.match(kids[1].className, /^asleep-line\b/, 'then its line');
  const more = kids[2];
  assert.deepEqual(more.children.map(n => clean(n.textContent)), ['Last shipped 0433 · 12 min ago', '1 shipped today', 'Go to Plan · 1 draft']);
  click(byClass(p, more, /\bgo-plan\b/));
  await p.settle();
  assert.equal(p.byId('shaping-section').hidden, false, 'the button still opens Plan');
});

test('0608 AC1: a refresh keeps speck on the page and puts the lines under it right', async () => {
  const p = fakePage([STATE([]), STATE([shippedAt('0433', 14, 18)])], { Date: stoppedClock(NOW) });
  await p.settle();
  const first = only(p, 'queue'), sleeper = face(p, first);
  assert.doesNotMatch(first.textContent, /Last shipped/);
  p.timers.shift()();
  await p.settle();
  const now = only(p, 'queue');
  assert.equal(now, first);
  assert.equal(face(p, now), sleeper, 'the same face, still breathing');
  assert.equal(p.all(now).filter(n => /^idle-more\b/.test(n.className)).length, 1, 'one set of lines under it');
  assert.match(now.textContent, /Last shipped 0433/);
});

test('0608 AC2: an empty Shipped shows speck asleep and "Nothing shipped yet", with a line saying approved tickets land there once they ship', async () => {
  const p = await boardPage([{ tickets: [], ideas: [] }]);
  await p.settle();
  const empty = only(p, 'shipped');
  assert.match(empty.className, /\basleep\b/);
  assert.equal(face(p, empty).attrs['data-mood'], 'asleep');
  assert.equal(clean(byClass(p, empty, /^asleep-line\b/).textContent), 'Nothing shipped yet · Approved tickets land here once they ship.');
});

test('0608 AC2: a shipped ticket takes speck\'s place', async () => {
  const p = fakePage([STATE([shippedAt('0433', 14, 18)])], { Date: stoppedClock(NOW) });
  await p.settle();
  assert.equal(face(p, p.byId('shipped')), undefined);
});

// Where each lane's speck and its line (heading and all) sit, from the top left of its section, and how they look. The
// line's width and height go with its words, so only where it starts is compared.
const MEASURE = `(() => { const out = {};
  for (const [tab, section] of [['tab-capture', 'capture-section'], ['tab-plan', 'shaping-section'], ['tab-build', 'build-section'], ['tab-shipped', 'shipped-section']]) {
    document.getElementById(tab).click();
    const sec = document.getElementById(section), box = sec.querySelector('.asleep');
    if (!box) return null;
    const at = n => { const s = sec.getBoundingClientRect(), r = n.getBoundingClientRect(); return [r.left - s.left, r.top - s.top, r.width, r.height].map(x => Math.round(x * 2) / 2); };
    const line = box.querySelector('.asleep-line'), ls = getComputedStyle(line), svg = box.querySelector('svg');
    out[tab] = { face: at(svg), lineTop: at(line)[1], lineLook: [ls.fontFamily, ls.fontSize, ls.fontWeight, ls.lineHeight, ls.color, ls.textAlign].join(' | '), bg: getComputedStyle(box).backgroundColor };
  }
  return out; })()`;

test('0608 AC3: at 320 px, in both looks, speck, the heading and the line sit and look in Build and Shipped as in Capture and Plan', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const stub = `(() => { const real = window.fetch.bind(window); const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json({ tickets: [], ideas: [] }) : real(url, opts); })();`;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('.asleep svg[data-mood="asleep"]').length === 4`, 'speck asleep in all four lanes', 15000);
    for (const look of ['light', 'dark']) {
      await b.js(`document.documentElement.setAttribute('data-theme', '${look}'), 1`);
      const m = await b.js(MEASURE);
      assert.ok(m, `${look}: every lane has its sleeping speck`);
      const want = m['tab-capture'];
      assert.deepEqual(m['tab-plan'], want, `${look}: Capture and Plan alike`);
      for (const tab of ['tab-build', 'tab-shipped']) assert.deepEqual(m[tab], want, `${look}: ${tab} as Capture`);
    }
  } finally { await b.close(); await stop(panel); }
});
