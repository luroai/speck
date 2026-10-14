import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, T, round, shippedRows, startOfToday } from './support/panel.mjs';

// ---------- 0157: a tidy Shipped section ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// The longest existing title (68 characters), as in 0151's tests.
const LONGEST = "Read the owner's private words from outside the repo in 0082's check";
const ago = s => new Date(Date.now() - s * 1000).toISOString();
const yesterday = (h, m) => { const d = new Date(startOfToday()); d.setDate(d.getDate() - 1); d.setHours(h, m); return d; };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Five shipped tickets: one with every figure and big token counts, a bug fix with a long title, one with only some
// figures, one with no figures at all and no ship time, and one shipped yesterday.
const STATE = () => ({
  run: { on: false },
  tickets: [
    T('0401', 'done', { title: 'Every figure', started: ago(1500), approved: ago(900), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 3.456,
      rounds: [round(1, 60000), round(2, 48234)] }),
    T('0402', 'done', { title: LONGEST, type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 9999)], builder_tokens: 10000 }),
    T('0403', 'done', { title: 'Some figures', started: ago(5000), finished: ago(1800), rounds: [round(1, 500)] }),
    T('0404', 'done', { title: 'No figures' }),
    T('0405', 'done', { title: 'Shipped yesterday', started: new Date(yesterday(21, 30)).toISOString(), finished: yesterday(21, 52).toISOString(), rounds: [round(1, 999600)] }),
  ],
  ideas: [],
});

// ---------- in the fake page ----------

const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const byClass = (p, node, cls) => p.all(node).filter(n => (n.className || '').split(' ').includes(cls));
// A card's figures, as [label, value, tooltip] for each.
const figures = (p, card) => byClass(p, card, 'fig').map(f => [byClass(p, f, 'k')[0].textContent, byClass(p, f, 'v')[0].textContent, byClass(p, f, 'v')[0].title || null]);

test('0157 AC2: each stat is a tile with its number, then a short label, then the tickets its median covers', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const tiles = p.byId('shipped-stats').children;
  assert.equal(tiles.length, 6);
  const parts = tiles.map(t => [t.className, ...t.children.map(c => [c.tagName, c.className, c.textContent])]);
  const today = STATE().tickets.filter(t => t.finished && Date.parse(t.finished) >= startOfToday()).length;
  assert.deepEqual(parts[0], ['stat', ['b', 'num', String(today)], ['span', 'label', 'shipped today']], 'shipped today covers no median, so no count');
  assert.deepEqual(parts.slice(1).map(t => t[2][2]), ['median minutes', 'median review rounds', 'median reviewer tokens', 'median builder tokens', 'median builder cost']);
  for (const t of parts.slice(1)) {
    assert.equal(t.length, 4, `${t[2][2]}: number, label and count`);
    assert.deepEqual(t[1].slice(0, 2), ['b', 'num']);
    assert.deepEqual(t[3].slice(0, 2), ['span', 'count']);
  }
  assert.deepEqual(parts.slice(1).map(t => t[3][2]), ['4 tickets', '4 tickets', '4 tickets', '2 tickets', '1 ticket']);
  assert.equal(parts[2][1][2], '1', 'median review rounds: 1, 1, 1, 2');
});

test('0157 AC3: a card has the id, then the title that opens the full ticket, with a bug or fix tag under them', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const card = cardOf(p, '0402');
  const line = byClass(p, card, 'line')[0];
  assert.deepEqual(line.children.map(n => [n.className, n.textContent]), [['id', '0402'], ['title-link', LONGEST]]);
  assert.deepEqual(byClass(p, card, 'tag').map(n => n.textContent), ['bug'], 'the type tag');
  assert.ok(!byClass(p, cardOf(p, '0401'), 'tag').length, 'no tag row without a type');
  p.press(line.children[1]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the title opens the full ticket');
  assert.ok(p.byId('full-ticket').textContent.includes('0402'));
});

test('0157 AC4: under the title, a labelled ship time: the time alone today, the day and time before', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const when = id => byClass(p, cardOf(p, id), 'when').map(n => n.textContent);
  const today = new Date(Date.parse(STATE().tickets[0].finished)), y = yesterday(21, 52);
  if (new Date(Date.now() - 600000).getDate() === new Date().getDate()) assert.deepEqual(when('0401'), [`Shipped ${hhmm(today)}`]);
  assert.deepEqual(when('0405'), [`Shipped ${y.getDate()} ${MONTHS[y.getMonth()]}, 21:52`]);
  assert.deepEqual(when('0404'), [], 'no ship time: no line');
  const kids = cardOf(p, '0401').children.map(n => n.className);
  assert.deepEqual(kids, ['name', 'when', 'figs', 'full-cell'], 'title, then when it shipped, then its figures, then Review pack');
});

test('0157 AC4: the figures are label and value pairs, missing ones left out, big token counts shortened with the exact number as a tooltip', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  assert.deepEqual(figures(p, cardOf(p, '0401')), [['Time', '10 min', null], ['Review rounds', '2', null], ['Reviewer tokens', '108k', '108,234'],
    ['Builder tokens', '2.4M', '2,412,345'], ['Builder cost', '$3.46', null]]);
  assert.deepEqual(figures(p, cardOf(p, '0402')), [['Time', '30 min', null], ['Review rounds', '1', null], ['Reviewer tokens', '9,999', null], ['Builder tokens', '10k', '10,000']]);
  assert.deepEqual(figures(p, cardOf(p, '0403')), [['Time', '53 min', null], ['Review rounds', '1', null], ['Reviewer tokens', '500', null]]);
  assert.deepEqual(figures(p, cardOf(p, '0404')), [], 'none recorded: none shown');
  assert.deepEqual(figures(p, cardOf(p, '0405')), [['Time', '22 min', null], ['Review rounds', '1', null], ['Reviewer tokens', '1M', '999,600']]);
  assert.ok(!shippedRows(p).some(r => r.textContent.includes(' · ')), 'no run of figures separated by dots');
});

test('0157 AC4: the Review pack button is the card\'s last part and opens its pack as before', async () => {
  const p = fakePage([STATE(), { pack: '# Review pack\n\nAll good.\n' }]);
  await p.settle();
  const card = cardOf(p, '0401'), last = card.children.at(-1);
  const b = p.all(last).find(n => n.tagName === 'button');
  assert.equal(b.textContent, 'Review pack');
  p.press(b);
  await p.settle();
  assert.ok(p.calls.some(c => /\/api\/tickets\/0401\/pack$/.test(c.url)), 'it asked for the pack');
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.ok(p.byId('full-ticket').textContent.includes('All good.'));
});

// ---------- in a real browser ----------

const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/pack$/.test(u)) return json({ pack: '# Review pack\\n\\nAll good.\\n' });
    return real(url, opts);
  };
})();`;

async function withPanel(fn, { width = 1280, theme = 'light' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#shipped tr').length === 5`, 'the panel');
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
// A colour as the browser computes it, from a CSS value such as var(--ok).
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;
const SECTION = `document.getElementById('shipped').closest('section')`;

for (const theme of ['light', 'dark']) {
  test(`0157 AC1: in the ${theme} look, Shipped's top border is as plain as its other sides (its green stripe went in 0167)`, skip, async () => {
    await withPanel(async b => {
      const [top, bottom] = await b.js(`(() => { const s = getComputedStyle(${SECTION}); return [[s.borderTopWidth, s.borderTopStyle, s.borderTopColor], [s.borderBottomWidth, s.borderBottomStyle, s.borderBottomColor]]; })()`);
      assert.deepEqual(top, bottom);
      assert.equal(top[2], await b.js(RGB('var(--line)')));
    }, { theme });
  });
}

// The stats tiles: where each sits, its size, how many lines its label takes, and its count's size and colour.
const TILES = `[...document.querySelectorAll('#shipped-stats .stat')].map(n => {
  const r = n.getBoundingClientRect(), label = n.querySelector('.label'), ls = getComputedStyle(label), count = n.querySelector('.count');
  const num = n.querySelector('.num').getBoundingClientRect(), lr = label.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, numAbove: num.bottom <= lr.top + 0.5,
    lines: Math.round(lr.height / parseFloat(ls.lineHeight)), labelSize: parseFloat(ls.fontSize), labelColor: ls.color,
    count: count && { size: parseFloat(getComputedStyle(count).fontSize), color: getComputedStyle(count).color, below: count.getBoundingClientRect().top >= lr.bottom - 0.5 } };
})`;
for (const [width, perRow] of [[375, 2], [700, 6], [1280, 6]]) {
  test(`0157 AC2: at ${width} px the six stats are tiles of equal size, ${perRow} to a row, each number above its label, no label past two lines`, skip, async () => {
    await withPanel(async b => {
      const tiles = await b.js(TILES);
      assert.equal(tiles.length, 6);
      const rows = [...new Set(tiles.map(t => Math.round(t.top)))];
      assert.equal(rows.length, 6 / perRow, `${rows.length} rows`);
      for (const row of rows) assert.equal(tiles.filter(t => Math.round(t.top) === row).length, perRow);
      for (const t of tiles) {
        assert.ok(Math.abs(t.width - tiles[0].width) < 1 && Math.abs(t.height - tiles[0].height) < 1, `every tile the same size: ${JSON.stringify(tiles.map(x => [x.width, x.height]))}`);
        assert.ok(t.numAbove, 'the number above its label');
        if (width === 375) assert.ok(t.lines <= 2, `a label on ${t.lines} lines`);
      }
      const faint = await b.js(RGB('var(--faint)'));
      for (const t of tiles.slice(1)) {
        assert.ok(t.count && t.count.below, 'the count under the label');
        assert.ok(t.count.size < t.labelSize, `the count (${t.count.size} px) smaller than the label (${t.labelSize} px)`);
        assert.equal(t.count.color, faint, 'the count muted');
      }
      assert.equal(tiles[0].count, null);
    }, { width });
  });
}

// Each shipped card: its four borders and how well each stands out from the section, the space to the next card, and
// where its id, title lines, ship time, figures and Review pack sit.
const CARDS = `(() => {
  const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const back = getComputedStyle(${SECTION}).backgroundColor;
  const cards = [...document.querySelectorAll('#shipped tr')];
  const rect = n => { if (!n) return null; const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
  return cards.map((n, i) => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect(), next = cards[i + 1];
    const side = k => ({ width: parseFloat(s['border' + k + 'Width']), style: s['border' + k + 'Style'], color: s['border' + k + 'Color'], contrast: contrast(s['border' + k + 'Color'], back) });
    const idN = n.querySelector('.line .id'), t = n.querySelector('.line .title-link'), range = document.createRange();
    range.selectNodeContents(t);
    const lines = [];
    for (const q of range.getClientRects()) {
      if (!q.width) continue;
      const same = lines.find(l => Math.abs(l.top - q.top) < 2);
      if (same) same.left = Math.min(same.left, q.left); else lines.push({ top: q.top, bottom: q.bottom, left: q.left });
    }
    const figs = n.querySelector('.figs');
    return { id: idN.textContent, top: side('Top'), right: side('Right'), bottom: side('Bottom'), left: side('Left'), gap: next ? next.getBoundingClientRect().top - r.bottom : null,
      idSize: getComputedStyle(idN).fontSize, titleSize: getComputedStyle(t).fontSize, idRect: rect(idN), lines, when: rect(n.querySelector('.when')),
      figs: rect(figs), figsDisplay: figs && getComputedStyle(figs).display, figCells: figs ? [...figs.children].map(rect) : [], pack: rect(n.querySelector('.full-open')) };
  });
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0157 AC3: at ${width} px in the ${theme} look, each shipped ticket is a bordered card with no stripe (since 0167), 8 px or more from the next`, skip, async () => {
      await withPanel(async b => {
        const cards = await b.js(CARDS);
        assert.equal(cards.length, 5);
        for (const c of cards) {
          for (const k of ['top', 'right', 'bottom', 'left']) {
            assert.ok(c[k].width >= 0.5 && c[k].style === 'solid', `${c.id}: no ${k} border`);
            assert.ok(c[k].contrast >= 1.4, `${c.id}: the ${k} border (${c[k].color}) is hard to see, contrast ${c[k].contrast.toFixed(2)}`);
          }
          assert.deepEqual([c.left.width, c.left.color], [c.right.width, c.right.color], `${c.id}: no stripe on its left edge`);
          if (c.gap !== null) assert.ok(c.gap >= 7.99, `${c.id}: only ${c.gap} px to the next card`);
        }
      }, { width, theme });
    });
  }
}

for (const width of [375, 1280]) {
  test(`0157 AC3 AC4: at ${width} px, a card has its id and title first, as on a Plan card, then the ship time, the figures in a grid and Review pack at the bottom`, skip, async () => {
    await withPanel(async b => {
      for (const c of await b.js(CARDS)) {
        assert.deepEqual([c.idSize, c.titleSize], ['14px', '17px'], c.id);
        const [first, ...rest] = c.lines;
        assert.ok(first.top < c.idRect.bottom && first.bottom > c.idRect.top, `${c.id}: the title starts on the id's line`);
        assert.ok(first.left >= c.idRect.right, `${c.id}: the title after the id`);
        for (const l of rest) assert.ok(Math.abs(l.left - first.left) < 1, `${c.id}: a wrapped line starts under the title, not the id`);
        const below = c.lines.at(-1).bottom;
        if (c.when) assert.ok(c.when.top >= below - 0.5, `${c.id}: the ship time under the title`);
        if (c.figCells.length) {
          assert.equal(c.figsDisplay, 'grid', `${c.id}: the figures in a grid`);
          assert.ok(c.figs.top >= (c.when ? c.when.bottom : below) - 0.5, `${c.id}: the figures under the ship time`);
          if (c.figCells.length > 1) assert.ok(new Set(c.figCells.map(f => Math.round(f.left))).size > 1, `${c.id}: more than one column`);
        }
        assert.ok(c.pack.top >= (c.figCells.length ? c.figs.bottom : c.when ? c.when.bottom : below) - 0.5, `${c.id}: Review pack at the bottom`);
      }
    }, { width });
  });
}

test('0157 AC4: in the browser, a shortened token count has the exact number as its tooltip', skip, async () => {
  await withPanel(async b => {
    const v = await b.js(`[...document.querySelectorAll('#shipped .fig .v')].filter(n => n.title).map(n => [n.textContent, n.title])`);
    assert.deepEqual(v, [['108k', '108,234'], ['2.4M', '2,412,345'], ['10k', '10,000'], ['1M', '999,600']]);
  });
});

for (const theme of ['light', 'dark']) {
  test(`0157 AC5: at 375 px in the ${theme} look, nothing in Shipped reaches past the right edge`, skip, async () => {
    await withPanel(async b => {
      const out = await b.js(`[...${SECTION}.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > innerWidth + 0.5 || n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).overflowX !== 'visible')
        .map(n => n.className || n.tagName)`);
      assert.deepEqual(out, []);
      assert.ok(await b.js(`document.documentElement.scrollWidth <= innerWidth`), 'the page doesn\'t scroll sideways');
    }, { width: 375, theme });
  });
}
