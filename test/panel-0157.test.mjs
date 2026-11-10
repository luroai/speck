import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, T, round, shippedRows, startOfToday, shippedPack, openLane, click } from './support/panel.mjs';

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
// 0587: a ticket's own figures, in its full view, as [label, value, tooltip] for each, the tooltip only when it says
// more than the value.
const COST = ['Builder cost', 'Reviewer cost', 'Total cost', 'Builder tokens', 'Reviewer tokens'];
const figures = async (p, id) => { p.press(cardOf(p, id)); await p.settle();
  return byClass(p, p.byId('full-ticket'), 'fact').filter(f => COST.includes(f.children[0].textContent)).map(f => { const v = f.children[1]; return [f.children[0].textContent, v.textContent, v.title !== v.textContent ? v.title : null]; }); };

// 0587: the three up top and those under More stats are all tiles. 0606: one grid, All figures adding the others.
test('0157 AC2: each stat is a tile with its number, then a short label, then the tickets its median covers', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  click(p.byId('more-stats'));
  await p.settle();
  const all = p.byId('shipped-stats').children.map(t => [t.className, ...t.children.map(c => [c.tagName, c.className, c.textContent])]);
  assert.deepEqual(all.map(t => t[2][2]), ['shipped today', 'median build time', 'median review rounds', 'approved first round', 'median builder cost', 'total cost', 'median review tokens', 'median builder tokens']);
  for (const t of all) {
    assert.deepEqual(t[1].slice(0, 2), ['b', 'num']);
    if (t[2][2] === 'shipped today') { assert.equal(t.length, 3, 'number and label: it covers no median'); continue; }
    assert.equal(t.length, 4, `${t[2][2]}: number, label and count`);
    assert.deepEqual(t[3].slice(0, 2), ['span', 'count']);
  }
  // 0606: each from fewer than the five shipped, so each says how many
  assert.deepEqual(all.slice(1).map(t => t[3][2]), ['from 4 tickets', 'from 4 tickets', 'from 4 tickets', 'from 1 ticket', 'from 0 tickets', 'from 4 tickets', 'from 2 tickets']);
  assert.equal(all[2][1][2], '1', 'median review rounds: 1, 1, 1, 2');
});

test('0157 AC3: a row has the id, then the title that opens its full view (0587), with a bug or fix tag after them (0420)', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const card = cardOf(p, '0402');
  const line = byClass(p, card, 'line')[0];
  assert.deepEqual(line.children.map(n => [n.className, n.textContent]), [['id', '0402'], ['title', LONGEST], ['tags tag-row', 'bug']]);
  assert.deepEqual(byClass(p, card, 'tag').map(n => n.textContent), ['bug'], 'the type tag');
  assert.ok(!byClass(p, cardOf(p, '0401'), 'tag').length, 'no tag row without a type');
  p.press(line.children[1]);
  await p.settle();
  assert.deepEqual(cardOf(p, '0402').children.map(n => n.className), ['name', 'sum'], 'the row stays one row (0587)');
  assert.equal(p.byId('full-ticket').hidden, false, 'its title opens the full ticket');
  assert.ok(p.byId('full-ticket').textContent.includes('0402'));
});

test('0157 AC4: under the title, the ship time: the time alone today, the day and time before (0587)', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const when = id => byClass(p, cardOf(p, id), 'when').map(n => n.textContent);
  const today = new Date(Date.parse(STATE().tickets[0].finished)), y = yesterday(21, 52);
  if (new Date(Date.now() - 600000).getDate() === new Date().getDate()) assert.deepEqual(when('0401'), [hhmm(today)]);
  assert.deepEqual(when('0405'), [`${y.getDate()} ${MONTHS[y.getMonth()]}, 21:52`]);
  assert.match(byClass(p, cardOf(p, '0405'), 'meta')[0].title, new RegExp(`^Shipped ${y.getDate()} ${MONTHS[y.getMonth()]}, 21:52 · `));
  assert.deepEqual(when('0404'), [], 'no ship time: no line');
  assert.deepEqual(cardOf(p, '0401').children.map(n => n.className), ['name', 'sum'], 'title, then its line (0587)');
});

// 0587: rounds and time on the row, and its costs and tokens in its full view.
test('0157 AC4: the figures are label and value pairs in the full view, missing ones a dash (0464), big token counts shortened with the exact number as a tooltip', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const figline = id => byClass(p, cardOf(p, id), 'figline').map(n => n.textContent);
  assert.deepEqual(figline('0401'), ['2 rounds · 10 min']);
  assert.deepEqual(figline('0402'), ['1 round · 30 min']);
  assert.deepEqual(figline('0403'), ['1 round · 53 min']);
  assert.deepEqual(figline('0404'), []);
  assert.deepEqual(figline('0405'), ['1 round · 22 min']);
  assert.deepEqual(await figures(p, '0401'), [['Builder cost', '$3.46', null], ['Reviewer cost', '—', null], ['Total cost', '—', null], ['Builder tokens', '2.4M', '2,412,345'], ['Reviewer tokens', '108k', '108,234']]);
  assert.deepEqual(await figures(p, '0402'), [['Builder cost', '—', null], ['Reviewer cost', '—', null], ['Total cost', '—', null], ['Builder tokens', '10k', '10,000'], ['Reviewer tokens', '9,999', null]]);
  assert.deepEqual(await figures(p, '0403'), [['Builder cost', '—', null], ['Reviewer cost', '—', null], ['Total cost', '—', null], ['Builder tokens', '—', null], ['Reviewer tokens', '500', null]]);
  assert.deepEqual((await figures(p, '0404')).map(f => f[1]), ['—', '—', '—', '—', '—'], 'none recorded: a dash for each');
  assert.deepEqual(await figures(p, '0405'), [['Builder cost', '—', null], ['Reviewer cost', '—', null], ['Total cost', '—', null], ['Builder tokens', '—', null], ['Reviewer tokens', '1M', '999,600']]);
  assert.ok(!shippedRows(p).some(r => byClass(p, r, 'facts').length), 'no labelled figures on a row');
});

test('0157 AC4: the Review pack button is in the full view and opens its pack as before (0587)', async () => {
  const p = fakePage([STATE(), { pack: '# Review pack\n\nAll good.\n' }]);
  await p.settle();
  const b = await shippedPack(p, () => cardOf(p, '0401'));
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
    await b.js(openLane('shipped')); // 0410
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
      assert.deepEqual([top[0], top[1]], ['0px', 'none'], '0418: no border round a lane at all');
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
for (const [width, perRow] of [[375, 2], [700, 4], [1280, 4]]) { // three to a row since 0162. 0606: two below 480 px, four from it
  // 0587: the three tiles up top. 0606: the four that always show.
  test(`0157 AC2: at ${width} px the four stats up top are tiles of equal size, ${perRow} to a row, each number above its label, each label on one line (0606)`, skip, async () => {
    await withPanel(async b => {
      const tiles = await b.js(TILES);
      assert.equal(tiles.length, 4);
      const rows = [...new Set(tiles.map(t => Math.round(t.top)))];
      assert.equal(rows.length, 4 / perRow, `${rows.length} rows`);
      for (const row of rows) assert.equal(tiles.filter(t => Math.round(t.top) === row).length, perRow);
      for (const t of tiles) {
        // 0162: the same width, and the same height as the others in its row.
        const first = tiles.find(x => Math.round(x.top) === Math.round(t.top));
        assert.ok(Math.abs(t.width - tiles[0].width) < 1 && Math.abs(t.height - first.height) < 1, `every tile the same size: ${JSON.stringify(tiles.map(x => [x.width, x.height]))}`);
        assert.ok(t.numAbove, 'the number above its label');
        assert.equal(t.lines, 1, `a label on ${t.lines} lines`); // 0606: one line, cut off with … if it can't fit
      }
      const faint = await b.js(RGB('var(--faint)'));
      for (const t of tiles.filter(x => x.count)) { // 0606: shipped today covers no median
        assert.ok(t.count && t.count.below, 'the count under the label');
        assert.ok(t.count.size < t.labelSize, `the count (${t.count.size} px) smaller than the label (${t.labelSize} px)`);
        assert.equal(t.count.color, faint, 'the count muted');
      }
    }, { width });
  });
}

// Each shipped row: its four borders and how well each stands out from the section, the space to the next row, and
// where its id, title lines and ship time sit, and whether it holds a facts table or Review pack.
const CARDS = `(() => {
  const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const back = getComputedStyle(document.getElementById('shipped-list')).backgroundColor; // 0478: the lane's list, inside its frame
  const cards = [...document.querySelectorAll('#shipped tr')];
  const rect = n => { if (!n) return null; const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
  return cards.map((n, i) => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect(), next = cards[i + 1];
    const side = k => ({ width: parseFloat(s['border' + k + 'Width']), style: s['border' + k + 'Style'], color: s['border' + k + 'Color'], contrast: contrast(s['border' + k + 'Color'], back) });
    const idN = n.querySelector('.line .id'), t = n.querySelector('.line .title'), range = document.createRange();
    range.selectNodeContents(t);
    const lines = [];
    for (const q of range.getClientRects()) {
      if (!q.width) continue;
      const same = lines.find(l => Math.abs(l.top - q.top) < 2);
      if (same) same.left = Math.min(same.left, q.left); else lines.push({ top: q.top, bottom: q.bottom, left: q.left });
    }
    return { id: idN.textContent, top: side('Top'), right: side('Right'), bottom: side('Bottom'), left: side('Left'), gap: next ? next.getBoundingClientRect().top - r.bottom : null,
      idSize: getComputedStyle(idN).fontSize, titleSize: getComputedStyle(t).fontSize, idRect: rect(idN), lines, when: rect(n.querySelector('.when')),
      facts: !!n.querySelector('.facts'), buttons: n.querySelectorAll('button').length };
  });
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0157 AC3: at ${width} px in the ${theme} look, each shipped ticket is a row with a hairline under it and no stripe (0587), touching the next`, skip, async () => {
      await withPanel(async b => {
        const cards = await b.js(CARDS);
        assert.equal(cards.length, 5);
        for (const c of cards) {
          assert.ok(c.bottom.width >= 0.5 && c.bottom.style === 'solid', `${c.id}: no bottom border`);
          assert.ok(c.bottom.contrast >= 1.2, `${c.id}: the bottom border (${c.bottom.color}) is hard to see, contrast ${c.bottom.contrast.toFixed(2)}`);
          for (const k of ['top', 'right', 'left']) assert.equal(c[k].width, 0, `${c.id}: a ${k} border`);
          if (c.gap !== null) assert.ok(Math.abs(c.gap) < 0.5, `${c.id}: ${c.gap} px to the next row`);
        }
      }, { width, theme });
    });
  }
}

for (const width of [375, 1280]) {
  test(`0157 AC3 AC4: at ${width} px, a row has its id and title first, as on a Plan row, then the ship time, and no figures or buttons (0587)`, skip, async () => {
    await withPanel(async b => {
      for (const c of await b.js(CARDS)) {
        assert.deepEqual([c.idSize, c.titleSize], ['14px', '15px'], c.id); // 0600: 15 px, as the views' rows
        const [first, ...rest] = c.lines;
        assert.ok(first.top < c.idRect.bottom && first.bottom > c.idRect.top, `${c.id}: the title starts on the id's line`);
        assert.ok(first.left >= c.idRect.right, `${c.id}: the title after the id`);
        for (const l of rest) assert.ok(Math.abs(l.left - first.left) < 1, `${c.id}: a wrapped line starts under the title, not the id`);
        const below = c.lines.at(-1).bottom;
        if (c.when) assert.ok(c.when.top >= below - 0.5, `${c.id}: the ship time under the title`);
        assert.ok(c.id === '0404' ? !c.when : !!c.when, `${c.id}: its line`);
        assert.ok(!c.facts && !c.buttons, `${c.id}: no facts table or buttons on the row`);
      }
    }, { width });
  });
}

test('0157 AC4: in the browser, a shortened token count in the full view has the exact number as its tooltip (0587)', skip, async () => {
  await withPanel(async b => {
    await b.js(`document.querySelector('#shipped tr').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden && document.querySelectorAll('#full-ticket .fact .value').length > 0`, 'the full view');
    const v = await b.js(`[...document.querySelectorAll('#full-ticket .fact .value')].filter(n => n.title !== n.textContent && /tokens/.test(n.previousElementSibling.textContent)).map(n => [n.textContent, n.title])`);
    assert.deepEqual(v, [['2.4M', '2,412,345'], ['108k', '108,234']]);
  });
});

for (const theme of ['light', 'dark']) {
  test(`0157 AC5: at 375 px in the ${theme} look, nothing in Shipped reaches past the right edge`, skip, async () => {
    await withPanel(async b => {
      // 0434: a closed card's title is one line that ends in an ellipsis when it doesn't fit, so its text is wider than its box
      const out = await b.js(`[...${SECTION}.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > innerWidth + 0.5 || n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).overflowX !== 'visible' && getComputedStyle(n).textOverflow !== 'ellipsis')
        .map(n => n.className || n.tagName)`);
      assert.deepEqual(out, []);
      assert.ok(await b.js(`document.documentElement.scrollWidth <= innerWidth`), 'the page doesn\'t scroll sideways');
    }, { width: 375, theme });
  });
}
