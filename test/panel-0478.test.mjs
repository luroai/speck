import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, cssRules, cssValue, REST_LANES } from './support/panel.mjs';

// ---------- 0478: each lane card framed like a second screen under speck's ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LANE = { capture: 'capture-section', plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };

// 0600: the lanes are flat lists now, as the panel's other views are, with no card, title or dot of their own (see
// panel-0600.test.mjs). These check what is left of 0478's card: the lane's line, and a lane sliding as a whole.
test('0478 AC1 AC2 AC3, since 0600: the lanes have no card, title or dot, and the lane\'s line is muted, cut short with …', () => {
  const html = page();
  for (const [lane, id] of Object.entries(LANE)) {
    const sec = html.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)</section>`))[1];
    assert.doesNotMatch(sec, /lane-title|<h2/, `${lane}: no name of its own, as its tab names it`);
  }
  for (const id of Object.values(LANE)) assert.deepEqual(cssRules(`#${id}`), [], `${id} has no frame of its own`);
  assert.deepEqual(cssRules('.lane-title'), [], 'no lane title');
  for (const id of Object.values(LANE)) assert.deepEqual(cssRules(`#${id} .lane-title::before`), [], `${id}: no dot`);
  const line = cssRules('.lane-n');
  assert.equal(cssValue(line, 'color'), 'var(--muted)', '0480: the lane\'s line in the muted colour');
  assert.equal(cssValue(line, 'text-overflow'), 'ellipsis', 'cut short with …');
});

// A real panel with tickets in every lane, in a real browser.
async function panel() {
  const r = panelRepo();
  for (let n = 10; n < 16; n++) {
    r.write(`00${n}-ready.md`, fm({ id: `"00${n}"`, title: `Ready ticket ${n}`, status: 'ready' }), good);
    r.write(`01${n}-draft.md`, fm({ id: `"01${n}"`, title: `Draft ticket ${n}`, status: 'draft' }), good);
    r.write(`02${n}-done.md`, fm({ id: `"02${n}"`, title: `Shipped ticket ${n}`, status: 'done' }), good, 'speck/tickets/done');
  }
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${p.port}/`);
  b.end = async () => { await b.close(); await stop(p); };
  try { await b.until(`document.querySelectorAll('#queue .q').length >= 6 && document.querySelectorAll('#shipped tr').length >= 3 && document.querySelectorAll('#shaping .item').length >= 6 && document.fonts.status === 'loaded'`, 'the board'); }
  catch (e) { await b.end(); throw e; }
  return b;
}

// Each lane at rest: its box and corners, its list's box and background, and its line.
const MEASURE = `(async () => {
  await document.fonts.ready;
  const colour = v => { const p = document.createElement('i'); p.style.color = v; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
  const root = getComputedStyle(document.documentElement), val = v => colour(root.getPropertyValue(v));
  const out = { vw: innerWidth, want: { muted: val('--muted'), panel: val('--panel') }, tabs: document.getElementById('tabs').getBoundingClientRect().bottom, lanes: [] };
  for (const lane of ['capture', 'plan', 'build', 'shipped']) {
    document.getElementById('tab-' + lane).click(); ${REST_LANES};
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const s = document.querySelector('main > section:not([hidden])'), r = s.getBoundingClientRect(), f = getComputedStyle(s), n = s.querySelector('.lane-n'), list = s.querySelector('.lane-list'), lb = list.getBoundingClientRect();
    out.lanes.push({ lane, box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, radius: f.borderTopLeftRadius, border: f.borderTopWidth, edge: getComputedStyle(s, '::before').content },
      line: n ? (() => { const b = n.getBoundingClientRect(), st = getComputedStyle(n), t = document.createRange(); t.selectNodeContents(n);
        return { text: n.textContent, shown: b.width > 0 && b.height > 0, colour: st.color, top: b.top, bottom: b.bottom, right: Math.min(t.getBoundingClientRect().right, b.right - parseFloat(st.paddingRight)), boxRight: b.right, cut: n.scrollWidth > n.clientWidth, overflow: st.textOverflow, wrap: st.whiteSpace }; })() : null,
      list: { bg: getComputedStyle(list).backgroundColor, left: lb.left, right: lb.right, top: lb.top } });
  }
  document.getElementById('tab-build').click(); ${REST_LANES};
  return out;
})()`;

const near = (a, b, d = 1) => Math.abs(a - b) <= d;

for (const theme of ['light', 'dark']) {
  test(`0478 AC1 AC3 AC4, since 0600: in the ${theme} look, at every width from 320 px, each lane is a flat list filling the column, its line under the tabs at the right`, skip, async () => {
    const b = await panel();
    try {
      await b.js(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}, 1`);
      // A lane line far too long for the row, to see it give way, kept there when the page draws it again
      await b.js(`(() => { const n = document.getElementById('shipped-n'), long = '1234567890 in total, ' + 'and a great deal more to say about it, '.repeat(6), put = () => { if (n.textContent !== long) n.textContent = long; };
        put(); new MutationObserver(put).observe(n, { childList: true, characterData: true, subtree: true }); return 1; })()`);
      for (const width of [320, 360, 414, 600, 720, 1280]) {
        await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: width < 700 });
        const m = await b.js(MEASURE);
        const at = `${theme}, ${width} px`;
        for (const l of m.lanes) {
          const w = `${at}, ${l.lane}`;
          assert.equal(l.box.radius, '0px', `${w}: no corners`);
          assert.equal(l.box.border, '0px', `${w}: no border`);
          assert.ok(l.box.edge === 'none' || l.box.edge === 'normal', `${w}: no edge drawn over it`);
          assert.equal(l.list.bg, m.want.panel, `${w}: its tickets sit on the lane's own background`);
          assert.ok(near(l.list.left, l.box.left) && near(l.list.right, l.box.right), `${w}: its list runs the lane's width`);
          if (l.line && l.line.shown) {
            assert.equal(l.line.colour, m.want.muted, `${w}: the lane's line in the muted colour (0480)`);
            assert.ok(l.line.top >= m.tabs - 0.5 && l.line.bottom <= l.list.top + 0.5, `${w}: the lane's line under the tabs, above its list`);
            assert.ok(near(l.line.right, l.line.boxRight - 16, 3), `${w}: at the row's right end, inside the 16 px margin`);
            assert.equal(l.line.wrap, 'nowrap', `${w}: on one line`);
            if (l.lane === 'shipped') assert.ok(l.line.cut && l.line.overflow === 'ellipsis', `${w}: a line too long for the row gives way with …`);
          }
          // AC4: all four sides in view
          assert.ok(l.box.left >= 0 && l.box.right <= m.vw && l.box.top >= 0 && l.box.bottom <= 700, `${w}: all four sides in view (${JSON.stringify(l.box)})`);
        }
        assert.ok(m.lanes.find(l => l.lane === 'build').line.shown, `${at}: Build's line shows`);
        // AC3: the same box for every lane
        const [first, ...rest] = m.lanes;
        for (const l of rest) for (const k of ['left', 'right', 'top', 'bottom']) assert.ok(near(l.box[k], first.box[k], .5), `${at}: ${l.lane}'s ${k} side matches ${first.lane}'s`);
      }
    } finally { await b.end(); }
  });
}

test('0478 AC4, since 0600: sliding between lanes moves the whole lane, its line and list with it', skip, async () => {
  const b = await panel();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
    // Partway through a slide, held still: each lane's list and line are where its lane is
    const got = await b.js(`(() => {
      const main = document.querySelector('main'); main.dataset.slide = 'drag'; main.style.setProperty('--lane', '2'); /* 0520: Build is the third card */ main.style.setProperty('--drag', '-120px');
      const out = [...main.children].map(s => { const r = s.getBoundingClientRect(), l = s.querySelector('.lane-list').getBoundingClientRect(), n = s.querySelector('.lane-n');
        return { id: s.id, left: r.left, listLeft: l.left, lineRight: n && !n.hidden ? n.getBoundingClientRect().right : null, right: r.right }; });
      delete main.dataset.slide; main.style.removeProperty('--drag');
      return out; })()`);
    const build = got.find(c => c.id === 'build-section');
    assert.ok(build.left < -100, `Build's lane has moved with the finger (${build.left})`);
    for (const c of got) {
      assert.ok(near(c.listLeft, c.left), `${c.id}: its list moved with the lane (${JSON.stringify(c)})`);
      if (c.lineRight !== null) assert.ok(near(c.lineRight, c.right), `${c.id}: its line moved with the lane (${JSON.stringify(c)})`);
    }
  } finally { await b.end(); }
});
