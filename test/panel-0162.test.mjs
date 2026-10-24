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
  T('0401', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906,
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
  const text = ['shaping-section', 'queue', 'queue-n', 'shipped-n', 'shipped'].map(id => p.byId(id).textContent.toLowerCase()).join(' ');
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

// 0420: the first three are one line of stats, not tiles.
test('0162 AC3: Shipped shows three stats, and More stats shows and hides the other three', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  assert.match(p.byId('shipped-stats').textContent, /^\d+ today · median \d+ min, \$[\d.]+$/);
  const more = p.byId('more-stats');
  assert.equal(more.hidden, false);
  assert.equal(more.textContent, 'More stats');
  assert.equal(more.attrs['aria-expanded'], 'false');
  assert.equal(p.byId('shipped-more').hidden, true, 'the other three start hidden');
  assert.deepEqual(tiles(p, 'shipped-more').map(t => t[1]), ['median review rounds', 'median reviewer tokens', 'median builder tokens']);
  p.press(more);
  await p.settle();
  assert.equal(p.byId('shipped-more').hidden, false);
  assert.equal(more.attrs['aria-expanded'], 'true');
  assert.equal(more.textContent, 'Fewer stats');
  await refresh(p);
  assert.equal(p.byId('shipped-more').hidden, false, 'still open after the next poll');
  p.press(more);
  await p.settle();
  assert.equal(p.byId('shipped-more').hidden, true);
  assert.equal(more.textContent, 'More stats');
});

test('0162 AC3: every stat over 9,999 is shortened as the cards\' figures are, with the exact number as a tooltip', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  // Reviewer tokens 108,234 and 500, builder tokens 2,412,345 alone.
  assert.deepEqual(tiles(p, 'shipped-more'), [['1.5', 'median review rounds', null], ['54k', 'median reviewer tokens', '54,367'],
    ['2.4M', 'median builder tokens', '2,412,345']]);
  const line = q => [q.byId('shipped-stats').textContent.replace(/^\d+ today · /, ''), byClass(q, q.byId('shipped-stats'), 'num').slice(1).map(n => n.title || null)]; // one line since 0420
  assert.deepEqual(line(p), ['median 23 min, $2.91', [null, null]]);
  const big = fakePage([{ tickets: [T('0011', 'done', { started: ago(20000 * 60), finished: ago(0), builder_cost_usd: 12345.678 })], ideas: [] }]);
  await big.settle();
  assert.deepEqual(line(big), ['median 20k min, $12k', ['20,000', '$12,345.68']]);
});

test('0162 AC3: with nothing shipped there are no stats and no More stats button', async () => {
  const p = fakePage([{ tickets: [T('0001', 'building')], ideas: [] }]);
  await p.settle();
  assert.equal(p.byId('shipped-stats').hidden, true);
  assert.equal(p.byId('shipped-more').hidden, true);
  assert.equal(p.byId('more-stats').hidden, true);
});

// ---------- AC4 ----------

test('0162 AC4: a shipped card shows its id and title, its ship time and one line of figures, and its title opens it (0466: no Details button)', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const a = cardOf(p, '0401');
  assert.deepEqual(a.children.map(n => n.className), ['name', 'sum'], 'the ship time in the line of figures since 0420');
  assert.deepEqual(byClass(p, a, 'line')[0].children.map(n => n.textContent), ['0401', 'Every figure']);
  assert.equal(byClass(p, a, 'figline')[0].textContent, '15 min · 2 rounds · $2.91');
  assert.equal(byClass(p, cardOf(p, '0402'), 'figline')[0].textContent, '30 min · 1 round');
  assert.deepEqual(byClass(p, cardOf(p, '0403'), 'figline'), [], 'no figures: no line of them');
  for (const id of ['0401', '0402', '0403']) {
    assert.deepEqual(p.all(cardOf(p, id)).filter(n => n.tagName === 'button').map(n => n.textContent), [], `${id}: no Details button (0466)`);
    assert.equal(byClass(p, cardOf(p, id), 'title')[0].attrs['aria-expanded'], 'false', `${id}: its title opens it`);
  }
  assert.deepEqual(byClass(p, a, 'facts'), [], 'the labelled figures wait for it to open (0464: in the facts table)');
  assert.ok(!p.all(a).some(n => n.textContent === 'Review pack'), 'and so does Review pack');
});

test('0162 AC4: opening the card shows the labelled figures and the Review pack button, and closing it hides them again', async () => {
  const p = fakePage([STATE(), STATE(), { pack: '# Review pack\n\nAll good.\n' }]);
  await p.settle();
  p.press(byClass(p, cardOf(p, '0401'), 'title')[0]); // 0466: its title, where Details was
  await p.settle();
  let a = cardOf(p, '0401');
  // 0464: its steps and its facts in a table, in place of its line
  assert.deepEqual(a.children.map(n => n.className), ['name', 'steps', 'full-cell']);
  assert.deepEqual(byClass(p, a, 'fact').map(f => [f.children[0].textContent, f.children[1].textContent]),
    [['Shipped', byClass(p, a, 'fact')[0].children[1].textContent], ['Time', '15 min'], ['Review rounds', '2'], ['Builder cost', '$2.91'], ['Builder tokens', '2.4M'], ['Reviewer tokens', '108k']]);
  assert.equal(byClass(p, a, 'title')[0].attrs['aria-expanded'], 'true');
  assert.deepEqual(cardOf(p, '0402').children.map(n => n.className), ['name', 'sum'], 'only the card tapped opens');
  await refresh(p);
  a = cardOf(p, '0401');
  assert.deepEqual(a.children.map(n => n.className), ['name', 'steps', 'full-cell'], 'still open after the next poll');
  const pack = p.all(a).find(n => n.tagName === 'button' && n.textContent === 'Review pack');
  p.press(pack);
  await p.settle();
  assert.ok(p.calls.some(c => /\/api\/tickets\/0401\/pack$/.test(c.url)), 'Review pack opens the pack as before');
  assert.ok(p.byId('full-ticket').textContent.includes('All good.'));
  p.press(byClass(p, cardOf(p, '0401'), 'title')[0]);
  await p.settle();
  assert.deepEqual(cardOf(p, '0401').children.map(n => n.className), ['name', 'sum'], 'its title again hides them');
});

test('0162 AC4: a card with no figures still opens, showing Review pack', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  assert.deepEqual(cardOf(p, '0403').children.map(n => n.className), ['name'], 'closed: no line, and no Details (0466)');
  p.press(byClass(p, cardOf(p, '0403'), 'title')[0]);
  await p.settle();
  assert.deepEqual(cardOf(p, '0403').children.map(n => n.className), ['name', 'steps', 'full-cell']);
});

test('0162 AC4 (0466): tapping the title opens the card, not the full ticket', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  p.press(byClass(p, cardOf(p, '0402'), 'title')[0]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, true);
  assert.deepEqual(cardOf(p, '0402').children.map(n => n.className), ['name', 'steps', 'full-cell']);
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

  // 0420: the three are one line, with More stats at its end, and the other three are tiles in one row under it.
  test(`0162 AC3: at ${width} px three stats show in one line, and More stats shows the other three in one row`, skip, async () => {
    await withPanel(async b => {
      await b.js(openLane('shipped')); // 0410
      const shown = () => b.js(`[...document.querySelectorAll('section.shipped .stat')].filter(n => n.getBoundingClientRect().height > 0).map(n => { const r = n.getBoundingClientRect(); return { top: Math.round(r.top), bottom: r.bottom, label: n.querySelector('.label').textContent }; })`);
      assert.deepEqual(await shown(), [], 'no tiles until More stats');
      const line = await b.js(`(() => { const r = document.getElementById('shipped-stats').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, right: r.right, text: document.getElementById('shipped-stats').innerText }; })()`);
      assert.match(line.text, /^\d+ today · median \d+ min, \$[\d.]+$/);
      const more = await b.js(`(() => { const r = document.getElementById('more-stats').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, height: r.height, text: document.getElementById('more-stats').innerText }; })()`);
      assert.ok(more.left >= line.right - 0.5 && more.top < line.bottom && more.bottom > line.top, 'More stats at the end of the line');
      assert.equal(more.text.toLowerCase(), 'more stats');
      if (width < 700) assert.ok(more.height >= 43.5, `More stats is ${more.height} px high`);
      await b.js(`document.getElementById('more-stats').click()`);
      await settle(b);
      const after = await shown();
      assert.deepEqual(after.map(t => t.label), ['median review rounds', 'median reviewer tokens', 'median builder tokens']);
      assert.equal(new Set(after.map(t => t.top)).size, 1, 'one row');
      assert.deepEqual(await b.js(`[...document.querySelectorAll('section.shipped .stat .num')].filter(n => n.title).map(n => [n.textContent, n.title])`), [['54k', '54,367'], ['2.4M', '2,412,345']]);
    }, { width });
  });

  test(`0162 AC4: at ${width} px a shipped card is compact until its title opens it`, skip, async () => {
    await withPanel(async b => {
      await b.js(openLane('shipped')); // 0410
      const card = `[...document.querySelectorAll('#shipped tr')].find(n => n.querySelector('.id').textContent === '0401')`;
      const look = () => b.js(`(() => { const c = ${card}, r = c.getBoundingClientRect(), fl = c.querySelector('.figline'), d = c.querySelector('.line .title');
        const lh = fl && (parseFloat(getComputedStyle(fl).lineHeight) || parseFloat(getComputedStyle(fl).fontSize) * 1.5);
        return { height: r.height, figLines: fl ? Math.round(fl.getBoundingClientRect().height / lh) : 0, figs: !!c.querySelector('.facts'), pack: !!c.querySelector('.full-cell .full-open'),
          details: d.getBoundingClientRect().height, title: getComputedStyle(d).color }; })()`);
      const closed = await look();
      assert.equal(closed.figLines, 1, 'the figures on one line');
      assert.ok(!closed.figs && !closed.pack);
      if (width < 700) assert.ok(closed.details >= 43.5, `its title is ${closed.details} px high`);
      const text = await b.js(`(() => { const s = document.createElement('span'); s.style.color = 'var(--text)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`);
      assert.equal(closed.title, text, 'the title in the text colour, not the accent');
      await b.js(`${card}.querySelector('.line .title').click()`);
      await settle(b);
      const open = await look();
      assert.ok(open.figs && open.pack, 'opening it shows the figures and Review pack');
      assert.ok(open.height > closed.height);
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
