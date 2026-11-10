import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, T, full, round, shippedRows, queueRows, openLane } from './support/panel.mjs';

// ---------- 0162: declutter the panel on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const HINTS = ['click one to open it', 'builds run in their own worktrees', 'latest 5'];
const ago = s => new Date(Date.now() - s * 1000).toISOString();

// Three shipped tickets: one with every figure and big token counts, one with some figures, one with none.
const SHIPPED = () => [
  T('0401', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, total_cost_usd: 2.906,
    rounds: [round(1, 60000), round(2, 48234)] }),
  T('0402', 'done', { title: 'Some figures', type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 500)] }),
  T('0403', 'done', { title: 'No figures' }),
];
const STATE = ({ queue = true } = {}) => ({
  run: { on: false },
  tickets: [
    full('0201', { title: 'A draft with every tag', priority: 1, size: 'M', risk: 'high', type: 'bug' }),
    ...(queue ? [T('0301', 'ready', { title: 'Ready to build' })] : []),
    ...SHIPPED(),
  ],
  ideas: [],
});

const byClass = (p, node, cls) => p.all(node).filter(n => (n.className || '').split(' ').includes(cls));
const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const tiles = (p, id) => p.byId(id).children.map(t => [byClass(p, t, 'num')[0].textContent, byClass(p, t, 'label')[0].textContent, byClass(p, t, 'num')[0].title || null]);

// ---------- AC1 ----------

test('0162 AC1: the three fixed hints are gone from the page', async () => {
  const html = page().replace(/<script>[\s\S]*?<\/script>/g, '');
  for (const h of HINTS) assert.ok(!html.toLowerCase().includes(h), `"${h}" is still in the page`);
  assert.doesNotMatch(html, /class="hint"/);
  const p = fakePage([STATE()]);
  await p.settle();
  const text = ['shaping-section', 'queue', 'queue-n', 'shipped'].map(id => p.byId(id).textContent.toLowerCase()).join(' '); // 0606: shipped-n is gone
  for (const h of HINTS) assert.ok(!text.includes(h), `"${h}" is shown`);
});

// ---------- AC2 ----------

// 0410: Build is a tab now. 0449: an empty lane says "Nothing building" in its message alone, and its counts line is hidden.
test('0162 AC2: with nothing in flight or ready, Build says "Nothing building"; a ready ticket brings its full layout back', async () => {
  const p = fakePage([STATE({ queue: false }), STATE(), STATE({ queue: false })]);
  await p.settle();
  const empty = () => p.byId('queue').children.map(n => [n.className, n.children[0].textContent]);
  assert.equal(p.byId('queue-n').hidden, true);
  assert.deepEqual(empty(), [['empty idle', 'Nothing building']], 'the lane says so');
  await refresh(p);
  assert.equal(p.byId('queue-n').textContent, '0 in flight · 1 queued');
  assert.equal(queueRows(p).length, 1);
  await refresh(p);
  assert.deepEqual(empty(), [['empty idle', 'Nothing building']], 'and again once it has gone');
  assert.equal(p.byId('queue-n').hidden, true);
});

test('0162 AC2: a ticket in flight also brings the full layout back', async () => {
  const p = fakePage([{ run: { on: false }, tickets: [T('0301', 'building', { started: ago(60) })], ideas: [] }]);
  await p.settle();
  assert.equal(p.byId('queue').hidden, false);
  assert.equal(p.byId('queue-n').textContent, '1 in flight · 0 queued');
});

// ---------- AC3 ----------

// 0587: three tiles up top, and More stats shows and hides the rest. 0606: four, and All figures adds the rest to the grid.
const ALWAYS = ['shipped today', 'median build time', 'median review rounds', 'approved first round'];
const OTHERS = ['median builder cost', 'total cost', 'median review tokens', 'median builder tokens'];
test('0162 AC3: Shipped shows four stats (0606), and All figures shows and hides the others', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  assert.deepEqual(tiles(p, 'shipped-stats').map(t => t[1]), ALWAYS);
  const more = p.byId('more-stats');
  assert.equal(more.hidden, false);
  assert.equal(more.textContent, 'All figures');
  assert.equal(more.attrs['aria-expanded'], 'false');
  p.press(more);
  await p.settle();
  assert.deepEqual(tiles(p, 'shipped-stats').map(t => t[1]), [...ALWAYS, ...OTHERS]);
  assert.equal(more.attrs['aria-expanded'], 'true');
  assert.equal(more.textContent, 'Fewer figures');
  await refresh(p);
  assert.equal(p.byId('shipped-stats').children.length, 8, 'still open after the next poll');
  p.press(more);
  await p.settle();
  assert.deepEqual(tiles(p, 'shipped-stats').map(t => t[1]), ALWAYS);
  assert.equal(more.textContent, 'All figures');
});

test('0162 AC3: every stat over 9,999 is shortened as the cards\' figures are, with the exact number as a tooltip', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  p.press(p.byId('more-stats')); // 0606: the others join the grid
  await p.settle();
  assert.deepEqual(tiles(p, 'shipped-stats').slice(1, 4), [['23 min', 'median build time', null], ['1.5', 'median review rounds', null], ['100%', 'approved first round', null]]);
  // Reviewer tokens 108,234 and 500, builder tokens 2,412,345 alone.
  assert.deepEqual(tiles(p, 'shipped-stats').slice(4), [['$2.91', 'median builder cost', null], ['$2.91', 'total cost', null], ['54k', 'median review tokens', '54,367'],
    ['2.4M', 'median builder tokens', '2,412,345']]);
  const big = fakePage([{ tickets: [T('0011', 'done', { started: ago(20000 * 60), finished: ago(0), builder_cost_usd: 12345.678 })], ideas: [] }]);
  await big.settle();
  assert.deepEqual(tiles(big, 'shipped-stats')[1], ['20k min', 'median build time', '20,000']);
  big.press(big.byId('more-stats'));
  await big.settle();
  assert.deepEqual(tiles(big, 'shipped-stats')[4], ['$12k', 'median builder cost', '$12,345.68']);
});

test('0162 AC3: with nothing shipped there are no stats and no All figures link (0606)', async () => {
  const p = fakePage([{ tickets: [T('0001', 'building')], ideas: [] }]);
  await p.settle();
  assert.equal(p.byId('shipped-stats').hidden, true);
  assert.equal(p.byId('more-stats').hidden, true);
});

// ---------- AC4 ----------

test('0162 AC4: a shipped row shows its id and title, its ship time and one line of figures, and has no buttons (0587)', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const a = cardOf(p, '0401');
  assert.deepEqual(a.children.map(n => n.className), ['name', 'sum'], 'the ship time in the line of figures since 0420');
  assert.deepEqual(byClass(p, a, 'line')[0].children.map(n => n.textContent), ['0401', 'Every figure']);
  assert.equal(byClass(p, a, 'figline')[0].textContent, '2 rounds · 15 min');
  assert.equal(byClass(p, cardOf(p, '0402'), 'figline')[0].textContent, '1 round · 30 min');
  assert.deepEqual(byClass(p, cardOf(p, '0403'), 'figline'), [], 'no figures: no line of them');
  for (const id of ['0401', '0402', '0403']) {
    assert.deepEqual(p.all(cardOf(p, id)).filter(n => n.tagName === 'button').map(n => n.textContent), [], `${id}: no buttons on the row`);
    assert.equal(byClass(p, cardOf(p, id), 'title')[0].attrs.role, 'button', `${id}: its title opens it`);
  }
  assert.deepEqual(byClass(p, a, 'facts'), [], 'the labelled figures are in the full view');
  assert.ok(!p.all(a).some(n => n.textContent === 'Review pack'), 'and so is Review pack');
});

test('0162 AC4: pressing the row shows the labelled figures and the Review pack button in the full view, and leaves the row as it was (0587)', async () => {
  const p = fakePage([STATE(), STATE(), { pack: '# Review pack\n\nAll good.\n' }]);
  await p.settle();
  p.press(byClass(p, cardOf(p, '0401'), 'title')[0]);
  await p.settle();
  const facts = () => Object.fromEntries(byClass(p, p.byId('full-ticket'), 'fact').map(f => [f.children[0].textContent, f.children[1].textContent]));
  for (const [label, value] of [['Builder cost', '$2.91'], ['Reviewer cost', '—'], ['Total cost', '$2.91'], ['Builder tokens', '2.4M'], ['Reviewer tokens', '108k']]) assert.equal(facts()[label], value, label);
  assert.deepEqual(cardOf(p, '0401').children.map(n => n.className), ['name', 'sum']);
  await refresh(p);
  assert.equal(facts()['Builder cost'], '$2.91', 'still open after the next poll');
  const pack = p.all(p.byId('full-ticket')).find(n => n.tagName === 'button' && n.textContent === 'Review pack');
  p.press(pack);
  await p.settle();
  assert.ok(p.calls.some(c => /\/api\/tickets\/0401\/pack$/.test(c.url)), 'Review pack opens the pack as before');
  assert.ok(p.byId('full-ticket').textContent.includes('All good.'));
});

test('0162 AC4: a row with no figures still opens its full view (0587)', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  assert.deepEqual(cardOf(p, '0403').children.map(n => n.className), ['name'], 'no line, and no Details (0466)');
  p.press(byClass(p, cardOf(p, '0403'), 'title')[0]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.ok(p.byId('full-ticket').textContent.includes('0403'));
});

test('0162 AC4 (0587): tapping the title opens the full ticket, not the row in place', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  p.press(byClass(p, cardOf(p, '0402'), 'title')[0]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.deepEqual(cardOf(p, '0402').children.map(n => n.className), ['name', 'sum']);
});

// ---------- in a real browser ----------

const stub = state => `(() => {
  try { localStorage.setItem('speck-theme', 'light'); } catch {}
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (/\\/pack$/.test(u)) return json({ pack: '# Review pack\\n\\nAll good.\\n' });
    return real(url, opts);
  };
})();`;

async function withPanel(fn, { width = 375, state = STATE() } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setTouchEmulationEnabled', width < 700 ? { enabled: true, maxTouchPoints: 1 } : { enabled: false }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#shipped tr').length === 3 && !!document.querySelector('#shaping .item')`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);

for (const width of [375, 1280]) {
  test(`0162 AC1: at ${width} px no hint shows in any section header`, skip, async () => {
    await withPanel(async b => {
      const text = await b.js(`[...document.querySelectorAll('.sh')].map(n => n.innerText.toLowerCase()).join(' ')`);
      for (const h of HINTS) assert.ok(!text.includes(h), `"${h}" shows`);
    }, { width });
  });

  // 0410: Build is a tab, open on load. 0425: its message is the first line of its lane, above the lane's list. 0449: an
  // empty lane's counts line is hidden, and its list says "Nothing building" first.
  test(`0162 AC2: at ${width} px an empty Build says "Nothing building" at the top of its lane, once`, skip, async () => {
    await withPanel(async b => {
      const s = await b.js(`(() => { const name = document.querySelector('#tab-build .tab-name'), n = document.getElementById('queue-n'), sec = document.getElementById('build-section');
        return { text: n.innerText, shown: n.getBoundingClientRect().height > 0, name: name.innerText,
          first: document.querySelector('#queue .idle').firstElementChild.innerText, lane: sec.innerText, open: !sec.hidden }; })()`);
      assert.equal(s.name, 'Build');
      assert.equal(s.text, '');
      assert.ok(!s.shown, 'the counts line takes no room');
      assert.ok(s.open, 'Build is open');
      assert.equal(s.first, 'Nothing building');
      assert.equal(s.lane.split('Nothing building').length - 1, 1, 'it says so once');
    }, { width, state: STATE({ queue: false }) });
  });

  // 0587: three tiles in a row, More stats under them, and the others in tiles under that. 0606: one grid of even tiles,
  // two to a row on a phone and four from 480 px, every row full, each label whole on one line, and All figures under it.
  test(`0606 AC1 AC2 AC4 (was 0162 AC3): at ${width} px the figures are even tiles ${width < 480 ? 2 : 4} to a row, every row full, and All figures under them adds the others`, skip, async () => {
    const perRow = width < 480 ? 2 : 4;
    await withPanel(async b => {
      await b.js(openLane('shipped')); // 0410
      await b.js(`document.fonts.ready.then(() => 1)`);
      const shown = () => b.js(`[...document.querySelectorAll('section.shipped .stat')].filter(n => n.getBoundingClientRect().height > 0).map(n => { const r = n.getBoundingClientRect(), l = n.querySelector('.label'), s = getComputedStyle(n);
        return { top: Math.round(r.top), bottom: r.bottom, width: r.width, height: r.height, label: l.textContent, cut: l.scrollWidth > l.clientWidth, lines: Math.round(l.getBoundingClientRect().height / parseFloat(getComputedStyle(l).lineHeight)),
          corners: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius], border: s.borderTopWidth, bg: s.backgroundColor }; })`);
      const surface = await b.js(`(() => { const s = document.createElement('span'); s.style.color = 'var(--surface)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`);
      const even = (tiles, what) => {
        const rows = [...new Set(tiles.map(t => t.top))];
        assert.equal(rows.length, tiles.length / perRow, `${what}: ${rows.length} rows of ${perRow}`);
        for (const row of rows) {
          const inRow = tiles.filter(t => t.top === row);
          assert.equal(inRow.length, perRow, `${what}: a full row`);
          assert.ok(inRow.every(t => Math.abs(t.height - inRow[0].height) < 1), `${what}: one height in a row`);
        }
        for (const t of tiles) {
          assert.ok(Math.abs(t.width - tiles[0].width) < 1, `${what}: one width`);
          assert.equal(new Set(t.corners).size, 1, `${what}: ${t.label}'s corners alike (${t.corners})`);
          assert.notEqual(t.corners[0], '0px', `${what}: rounded`);
          assert.equal(t.border, '0px', `${what}: no border`);
          assert.equal(t.bg, surface, `${what}: the surface colour`);
          assert.equal(t.lines, 1, `${what}: ${t.label} on one line`);
          assert.ok(!t.cut, `${what}: ${t.label} whole`);
        }
      };
      const before = await shown();
      assert.deepEqual(before.map(t => t.label), ALWAYS, 'four tiles until All figures');
      even(before, 'closed');
      const link = () => b.js(`(() => { const n = document.getElementById('more-stats'), r = n.getBoundingClientRect(), s = getComputedStyle(n); return { top: r.top, height: r.height, text: n.innerText, border: s.borderTopWidth, colour: s.color }; })()`);
      const more = await link();
      const accent = await b.js(`(() => { const s = document.createElement('span'); s.style.color = 'var(--accent)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`);
      assert.ok(more.top >= Math.max(...before.map(t => t.bottom)) - 0.5, 'All figures under the tiles');
      assert.deepEqual([more.text, more.border, more.colour], ['All figures', '0px', accent], 'a text link in the accent colour');
      assert.ok(more.height >= 43.5, `All figures is ${more.height} px high`);
      await b.js(`document.getElementById('more-stats').click()`);
      await settle(b);
      const after = await shown();
      assert.deepEqual(after.map(t => t.label), [...ALWAYS, ...OTHERS]);
      even(after, 'open');
      const open = await link();
      assert.ok(open.top >= Math.max(...after.map(t => t.bottom)) - 0.5, 'Fewer figures under the grid');
      assert.equal(open.text, 'Fewer figures');
      assert.deepEqual(await b.js(`[...document.querySelectorAll('section.shipped .stat .num')].filter(n => n.title).map(n => [n.textContent, n.title])`), [['54k', '54,367'], ['2.4M', '2,412,345']]);
    }, { width });
  });

  test(`0162 AC4: at ${width} px a shipped row stays compact, and its title opens the full view (0587)`, skip, async () => {
    await withPanel(async b => {
      await b.js(openLane('shipped')); // 0410
      const card = `[...document.querySelectorAll('#shipped tr')].find(n => n.querySelector('.id').textContent === '0401')`;
      const look = () => b.js(`(() => { const c = ${card}, r = c.getBoundingClientRect(), fl = c.querySelector('.figline'), d = c.querySelector('.line .title');
        const lh = fl && (parseFloat(getComputedStyle(fl).lineHeight) || parseFloat(getComputedStyle(fl).fontSize) * 1.5);
        return { height: r.height, figLines: fl ? Math.round(fl.getBoundingClientRect().height / lh) : 0, figs: !!c.querySelector('.facts'), buttons: c.querySelectorAll('button').length, title: getComputedStyle(d).color }; })()`);
      const closed = await look();
      assert.equal(closed.figLines, 1, 'the figures on one line');
      assert.ok(!closed.figs && !closed.buttons);
      if (width < 700) assert.ok(closed.height >= 43.5, `the row, its tap area, is ${closed.height} px high`);
      const text = await b.js(`(() => { const s = document.createElement('span'); s.style.color = 'var(--text)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`);
      assert.equal(closed.title, text, 'the title in the text colour, not the accent');
      await b.js(`${card}.querySelector('.line .title').click()`);
      await settle(b);
      assert.equal(await b.js(`document.getElementById('full-ticket').hidden`), false, 'pressing it opens the full view');
      assert.equal((await look()).height, closed.height, 'and the row is as it was');
    }, { width });
  });

  test(`0162 AC5: at ${width} px the gaps between a Plan card's tags are equal, beside the priority tag too`, skip, async () => {
    await withPanel(async b => {
      await b.js(openLane('plan')); // 0410
      const tags = await b.js(`[...document.querySelector('#shaping .item').querySelectorAll('.head .tag')].map(n => { const r = n.getBoundingClientRect(); return { text: n.textContent, left: r.left, right: r.right }; })`);
      assert.deepEqual(tags.map(t => t.text), ['P1', 'M', 'high', 'bug']);
      const gaps = tags.slice(1).map((t, i) => t.left - tags[i].right);
      for (const g of gaps) assert.ok(Math.abs(g - gaps[1]) < 0.5, `gaps of ${gaps.map(x => x.toFixed(1)).join(', ')} px`);
      if (width < 700) {
        const area = await b.js(`(() => { const tag = document.querySelector('#shaping .item .tag.pick'), r = tag.closest('.prio').getBoundingClientRect(); return [r.width, r.height]; })()`);
        assert.ok(area[0] >= 43.5 && area[1] >= 43.5, `the priority tag's tap area is still 44 px: ${area}`);
      }
    }, { width });
  });
}
