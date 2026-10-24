import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, cssRules, cssValue, REST_LANES } from './support/panel.mjs';

// ---------- 0478: each lane card framed like a second screen under speck's ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LANE = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };
const DOT = { plan: 'var(--bezel-step)', build: 'var(--blue)', shipped: 'var(--purple)' };

test('0478 AC1 AC2 AC3: the lane cards share one frame, in the screen\'s frame colour and corners, with the title row in it', () => {
  const html = page();
  for (const [lane, id] of Object.entries(LANE)) {
    const sec = html.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)</section>`))[1];
    assert.match(sec, /^\s*<h2 class="lane-title">[^<]+<\/h2>/, `${lane}: its name opens the card`);
    if (lane !== 'plan') assert.match(sec, /<\/h2>\s*<div class="lane-n"/, `${lane}: its line follows its name, in the title row`);
  }
  // One frame for every lane: drawn once, for every card, in the screen's frame colour, its fill cut to inside the card's
  // padding, so its corners are the card's less that padding
  const frame = cssRules('main > section');
  assert.equal(cssValue(frame, 'background-color'), 'var(--bezel)', 'the frame is --bezel');
  assert.equal(cssValue(frame, 'background-clip'), 'content-box', 'inside the gap round it');
  const [rx, ry] = cssValue(frame, 'border-radius').split('/').map(parseFloat), [py, px] = cssValue(frame, 'padding').split(' ').map(parseFloat);
  const corner = parseFloat(cssValue(cssRules('.bezel'), 'border-radius'));
  assert.deepEqual([rx - px, ry - py], [corner, corner], 'with the screen\'s corners');
  for (const id of Object.values(LANE)) assert.deepEqual(cssRules(`#${id}`), [], `${id} has no frame of its own (AC3)`);
  // The title in the header's lettering, with a dot in its stage's colour
  const title = cssRules('.lane-title');
  assert.equal(cssValue(title, 'font-family'), cssValue(cssRules('.bezel .name'), 'font-family'), 'Doto, as "speck"');
  assert.equal(cssValue(title, 'font-weight'), cssValue(cssRules('.bezel .name'), 'font-weight'), 'at "speck"\'s weight');
  assert.equal(cssValue(title, 'color'), 'var(--bezel-ink)', 'in the frame\'s light ink');
  for (const [lane, id] of Object.entries(LANE)) assert.equal(cssValue(cssRules(`#${id} .lane-title::before`), 'background'), DOT[lane], `${lane}'s dot`);
  // 0461's grey for a step not reached is --line, which the dark look sets to this: the frame is dark in both looks
  assert.match(page() + cssRules(':root').join(';'), /--bezel-step:\s*#e4e4e462/i, 'Plan\'s dot is the grey a step not reached has on a dark ground');
  const line = cssRules('.lane-n');
  assert.equal(cssValue(line, 'color'), 'var(--bezel-muted)', 'the lane\'s line in the frame\'s muted ink');
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

// Each lane's card at rest: its frame's box, the sides of the frame round its tickets, its title row and its colours.
const MEASURE = `(async () => {
  await document.fonts.ready;
  const colour = v => { const p = document.createElement('i'); p.style.color = v; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
  const root = getComputedStyle(document.documentElement), val = v => colour(root.getPropertyValue(v));
  const bz = document.querySelector('.bezel').getBoundingClientRect(), glass = document.querySelector('.bezel .glass').getBoundingClientRect();
  const out = { vw: innerWidth, bezel: { colour: getComputedStyle(document.querySelector('.bezel')).backgroundColor, radius: getComputedStyle(document.querySelector('.bezel')).borderTopLeftRadius,
    side: glass.left - bz.left, bottom: bz.bottom - glass.bottom, titleTop: document.querySelector('.bezel .name').getBoundingClientRect().top - bz.top },
    want: { blue: val('--blue'), purple: val('--purple'), grey: val('--bezel-step'), ink: val('--bezel-ink'), muted: val('--bezel-muted'), panel: val('--panel') }, lanes: [] };
  for (const lane of ['plan', 'build', 'shipped']) {
    document.getElementById('tab-' + lane).click(); ${REST_LANES};
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const s = document.querySelector('main > section:not([hidden])'), r = s.getBoundingClientRect(), f = getComputedStyle(s);
    // The frame: the card's fill, inside its padding, with its corners less that padding
    const fr = { left: r.left + parseFloat(f.paddingLeft), top: r.top + parseFloat(f.paddingTop), right: r.right - parseFloat(f.paddingRight), bottom: r.bottom - parseFloat(f.paddingBottom) };
    const [rx, ry = rx] = f.borderTopLeftRadius.split(' ').map(parseFloat);
    const h = s.querySelector('.lane-title'), hs = getComputedStyle(h), dot = getComputedStyle(h, '::before'), n = s.querySelector('.lane-n'), list = s.querySelector('.lane-list');
    const inner = s.querySelector('.sh') || list, ib = inner.getBoundingClientRect(), lb = list.getBoundingClientRect(), hb = h.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(h);
    out.lanes.push({ lane, name: h.textContent, frame: { ...fr, width: fr.right - fr.left, height: fr.bottom - fr.top, colour: f.backgroundColor, clip: f.backgroundClip, radius: [rx - parseFloat(f.paddingLeft), ry - parseFloat(f.paddingTop)] },
      sides: { left: ib.left - fr.left, right: fr.right - ib.right, bottom: fr.bottom - lb.bottom, top: ib.top - fr.top },
      title: { family: hs.fontFamily, weight: hs.fontWeight, colour: hs.color, lines: range.getClientRects().length, top: hb.top, bottom: hb.bottom, left: hb.left, right: hb.right },
      dot: { colour: dot.backgroundColor, width: parseFloat(dot.width), right: hb.left + parseFloat(dot.width) },
      line: n ? (() => { const b = n.getBoundingClientRect(), st = getComputedStyle(n), t = document.createRange(); t.selectNodeContents(n);
        return { text: n.textContent, shown: b.width > 0, colour: st.color, left: b.left, right: Math.min(t.getBoundingClientRect().right, b.right - parseFloat(st.paddingRight)), top: b.top, bottom: b.bottom, cut: n.scrollWidth > n.clientWidth, overflow: st.textOverflow, wrap: st.whiteSpace }; })() : null,
      inside: { bg: getComputedStyle(list).backgroundColor, left: lb.left, right: lb.right } });
  }
  document.getElementById('tab-build').click(); ${REST_LANES};
  return out;
})()`;

const near = (a, b, d = 1) => Math.abs(a - b) <= d;

for (const theme of ['light', 'dark']) {
  test(`0478 AC1 AC2 AC3 AC4: in the ${theme} look, at every width from 320 px, each lane's card is framed like speck's screen, thinner, with its title row on one line`, skip, async () => {
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
          // AC1: the screen's frame colour and corners, its tickets inside it on the lane's own background
          assert.equal(l.frame.colour, m.bezel.colour, `${w}: the frame is the screen's frame colour`);
          assert.equal(l.frame.clip, 'content-box', `${w}: the fill is the frame, inside the card's padding`);
          assert.deepEqual(l.frame.radius, [parseFloat(m.bezel.radius), parseFloat(m.bezel.radius)], `${w}: with the screen's corners`);
          assert.ok(l.sides.left > 0 && l.sides.left < m.bezel.side, `${w}: its left side (${l.sides.left}) is thinner than the screen's (${m.bezel.side})`);
          assert.ok(l.sides.right > 0 && l.sides.right < m.bezel.side, `${w}: its right side (${l.sides.right}) is thinner than the screen's`);
          assert.ok(l.sides.bottom > 0 && l.sides.bottom < m.bezel.bottom, `${w}: its bottom (${l.sides.bottom}) is thinner than the screen's (${m.bezel.bottom})`);
          assert.equal(l.inside.bg, m.want.panel, `${w}: its tickets sit on the lane's own background`);
          assert.ok(l.title.top >= l.frame.top && l.title.bottom <= l.frame.top + l.sides.top, `${w}: the title row is in the frame, above the tickets`);
          // AC2: the dot-matrix title in the frame's ink, its stage's dot before it, its line at the row's right end
          assert.match(l.title.family, /^"?Doto"?/, `${w}: in Doto`);
          assert.equal(l.title.weight, '900', `${w}: at "speck"'s weight`);
          assert.equal(l.title.colour, m.want.ink, `${w}: in the frame's light ink`);
          assert.equal(l.dot.colour, { plan: m.want.grey, build: m.want.blue, shipped: m.want.purple }[l.lane], `${w}: its stage's dot`);
          assert.ok(l.dot.width > 0, `${w}: the dot shows`);
          assert.equal(l.title.lines, 1, `${w}: the title on one line`);
          if (l.line && l.line.shown) {
            assert.equal(l.line.colour, m.want.muted, `${w}: the lane's line in the frame's muted ink`);
            assert.ok(l.line.left >= l.title.right && near(l.line.top + (l.line.bottom - l.line.top) / 2, l.title.top + (l.title.bottom - l.title.top) / 2, 4), `${w}: the lane's line on the title row, after the title`);
            assert.ok(l.line.right <= l.frame.right && near(l.line.right, l.inside.right, 3), `${w}: at the row's right end`);
            assert.equal(l.line.wrap, 'nowrap', `${w}: on one line`);
            if (l.lane === 'shipped') assert.ok(l.line.cut && l.line.overflow === 'ellipsis', `${w}: a line too long for the row gives way with …`);
          }
          // AC4: all four sides in view
          assert.ok(l.frame.left >= 0 && l.frame.right <= m.vw && l.frame.top >= 0 && l.frame.bottom <= 700, `${w}: all four sides in view (${JSON.stringify(l.frame)})`);
        }
        assert.ok(m.lanes.find(l => l.lane === 'build').line.shown, `${at}: Build's line shows`);
        // AC3: the same frame for every lane
        const [first, ...rest] = m.lanes;
        for (const l of rest) assert.deepEqual([l.frame.width, l.frame.height, l.frame.colour], [first.frame.width, first.frame.height, first.frame.colour], `${at}: ${l.lane}'s frame is the size and colour of ${first.lane}'s`);
        for (const l of rest) for (const k of ['left', 'right', 'bottom']) assert.ok(near(l.sides[k], first.sides[k], .5), `${at}: ${l.lane}'s ${k} side matches ${first.lane}'s`);
        assert.deepEqual(m.lanes.map(l => l.name), ['Plan', 'Build', 'Shipped']);
      }
    } finally { await b.end(); }
  });
}

test('0478 AC4: sliding between lanes moves the whole framed card, its title and frame with it', skip, async () => {
  const b = await panel();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
    // Partway through a slide, held still: each card's frame and title are where its card is
    const got = await b.js(`(() => {
      const main = document.querySelector('main'); main.dataset.slide = 'drag'; main.style.setProperty('--lane', '1'); main.style.setProperty('--drag', '-120px');
      const out = [...main.children].map(s => { const r = s.getBoundingClientRect(), f = getComputedStyle(s), h = s.querySelector('.lane-title').getBoundingClientRect();
        return { id: s.id, left: r.left, frameLeft: r.left + parseFloat(f.paddingLeft), titleLeft: h.left }; });
      delete main.dataset.slide; main.style.removeProperty('--drag');
      return out; })()`);
    const build = got.find(c => c.id === 'build-section');
    assert.ok(build.left < -100, `Build's card has moved with the finger (${build.left})`);
    for (const c of got) {
      assert.ok(c.frameLeft > c.left && c.frameLeft - c.left < 30, `${c.id}: its frame moved with the card (${JSON.stringify(c)})`);
      assert.ok(c.titleLeft >= c.frameLeft && c.titleLeft - c.frameLeft < 30, `${c.id}: its title moved with the card (${JSON.stringify(c)})`);
    }
  } finally { await b.end(); }
});
