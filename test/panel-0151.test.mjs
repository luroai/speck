import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, full, idea, openLane } from './support/panel.mjs';

// ---------- 0151: each Plan ticket a clear card ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// The longest existing title (68 characters), and the one that needs the widest line to wrap onto two, then one near
// the 90th percentile (58) and a short one.
const LONGEST = "Read the owner's private words from outside the repo in 0082's check";
const LONG = 'Keep the Build queue in the order the tickets will be built';
const STATE = {
  run: { on: false },
  tickets: [
    full('0201', { title: LONGEST, priority: 1, size: 'M', risk: 'high', type: 'bug' }),
    full('0202', { title: LONG, after: ['0201'], waiting_on: ['0201'] }),
    full('0203', { title: 'Short', type: 'fix' }),
    T('0204', 'ready', { title: 'A risky one in the queue', risk: 'high' }),
  ],
  ideas: [idea('2026-10-13-an-idea', 'new'), idea('2026-10-13-another-idea', 'new'),
    idea('2026-10-13-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0139\n\nSome text.\n'),
    idea('2026-10-13-a-second-follow-up', 'inbox', '# A second follow-up\n\nStatus: inbox\nFrom ticket: 0140\n\nSome text.\n')],
};

// Before the page's own script runs: the look to use, and a fetch that answers with the board above and records each POST.
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  window.__posts = [];
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') { window.__posts.push(u); return json({}); }
    return real(url, opts);
  };
})();`;

async function withPanel(fn, { width = 1280, theme = 'light' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setTouchEmulationEnabled', width < 700 ? { enabled: true, maxTouchPoints: 1 } : { enabled: false }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shaping .item') && !!document.querySelector('#queue .q')`, 'the panel');
    await b.js(openLane('plan')); // 0410: these are Plan's cards
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
const tab = async (b, view) => { await b.js(`document.querySelector('#shaping-toggle .toggle.${view}').click()`); await settle(b); };
const click = async (b, [x, y]) => {
  for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await settle(b);
};
// The draft in Plan with this id.
const ITEM = id => `[...document.querySelectorAll('#shaping .item.ticket')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
// A colour as the browser computes it, from a CSS value such as var(--bad).
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;

// Each ticket title in Plan: its lines (one box per line), where its id is, and whether any of it is hidden.
const TITLES = `[...document.querySelectorAll('#shaping .item.ticket')].map(item => {
  const id = item.querySelector('.id'), t = item.querySelector('.title'), s = getComputedStyle(t), range = document.createRange();
  range.selectNodeContents(t);
  const lines = [];
  for (const r of range.getClientRects()) {
    if (!r.width) continue;
    const same = lines.find(l => Math.abs(l.top - r.top) < 2);
    if (same) { same.left = Math.min(same.left, r.left); same.right = Math.max(same.right, r.right); }
    else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
  }
  const box = item.getBoundingClientRect(), idBox = id.getBoundingClientRect();
  return { title: t.textContent, idSize: getComputedStyle(id).fontSize, titleSize: s.fontSize, lines,
    id: { top: idBox.top, bottom: idBox.bottom, right: idBox.right },
    cut: t.scrollWidth > t.clientWidth + 0.5 || t.scrollHeight > t.clientHeight + 0.5 || s.textOverflow === 'ellipsis'
      || lines.some(l => l.left < box.left || l.right > box.right + 0.5 || l.bottom > box.bottom + 0.5) };
})`;

// 0441: 3 lines at 375 px, as the longest title takes in a proportional font with Arial's widths
for (const [width, most] of [[375, 3], [699, 3], [700, 3], [1000, 3], [1279, 3], [1280, 1], [1440, 1]]) {
  test(`0151 AC1: at ${width} px, an open ticket's id is 14 px and its title 17 px, never cut off, on at most ${most} ${most === 1 ? 'line' : 'lines'} starting under the title`, skip, async () => {
    assert.equal(LONGEST.length, 68);
    await withPanel(async b => {
      // 0434: a closed ticket's title is one line, cut off when it doesn't fit, so these are the open tickets' titles
      await b.js(`[...document.querySelectorAll('#shaping .item.ticket .head')].forEach(h => h.click())`);
      await settle(b);
      assert.equal(await b.js(`document.querySelectorAll('#shaping .item.ticket.open').length`), 3, 'every ticket open');
      const titles = await b.js(TITLES);
      assert.deepEqual(titles.map(t => t.title), [LONGEST, LONG, 'Short']);
      for (const t of titles) {
        assert.equal(t.idSize, '14px', `${t.title}: the id`);
        assert.equal(t.titleSize, '17px', `${t.title}: the title`);
        assert.ok(!t.cut, `${t.title} is cut off`);
        assert.ok(t.lines.length >= 1 && t.lines.length <= most, `${t.title} is on ${t.lines.length} lines`);
        const [first] = t.lines;
        assert.ok(first.top < t.id.bottom && first.bottom > t.id.top, `${t.title} starts on the id's line`);
        for (const l of t.lines) {
          assert.ok(Math.abs(l.left - first.left) < 1, `${t.title}: a line starts at ${l.left}, not under the title's start at ${first.left}`);
          assert.ok(l.left >= t.id.right, `${t.title}: a line starts under the id`);
        }
      }
    }, { width });
  });
}

// The tags under a ticket's title: their text, and their visible boxes.
const TAGS = id => `(() => {
  const item = ${ITEM(id)}, lines = item.querySelector('.title').getClientRects();
  return { titleBottom: Math.max(...[...lines].map(r => r.bottom)), tags: [...item.querySelector('.head').querySelectorAll('.tag')].map(n => {
    const r = n.getBoundingClientRect(); return { text: n.textContent, top: r.top, bottom: r.bottom, height: r.height }; }) };
})()`;

for (const width of [375, 1280]) {
  test(`0151 AC2: at ${width} px, the priority, size, risk and type tags sit under the title (0419: in its details line), in that order, all the same height`, skip, async () => {
    await withPanel(async b => {
      for (const [id, want] of [['0201', ['P1', 'M', 'high', 'bug']], ['0202', ['P2', 'S', 'low']], ['0203', ['P2', 'S', 'low', 'fix']]]) {
        const { titleBottom, tags } = await b.js(TAGS(id));
        assert.deepEqual(tags.map(t => t.text), want, id);
        for (const t of tags) {
          assert.ok(t.top >= titleBottom - 0.5, `${id}: ${t.text} is under the title`);
          assert.ok(Math.abs(t.height - tags[0].height) < 0.5, `${id}: ${t.text} is ${t.height} px high, ${tags[0].text} ${tags[0].height} px`);
          assert.ok(Math.abs(t.top - tags[0].top) < 0.5, `${id}: ${t.text} is on the same row as ${tags[0].text}`);
        }
      }
    }, { width });
  });
}

test('0151 AC2: at 375 px, the priority tag has a 44 by 44 px tap area and opens its menu from the edge of that area', skip, async () => {
  await withPanel(async b => {
    const area = await b.js(`(() => { const tag = ${ITEM('0201')}.querySelector('.tag.pick'), r = tag.closest('.prio').getBoundingClientRect();
      const points = [[r.left + 1, r.top + 1], [r.right - 1, r.top + 1], [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1], [r.left + r.width / 2, r.top + r.height / 2]];
      return { width: r.width, height: r.height, points, hits: points.map(([x, y]) => document.elementFromPoint(x, y) === tag) }; })()`);
    assert.ok(area.width >= 43.5 && area.height >= 43.5, `the tap area is ${area.width} by ${area.height}`);
    assert.deepEqual(area.hits, area.points.map(() => true), 'every point of the tap area reaches the priority tag');
    await click(b, area.points[3]);
    assert.ok(await b.js(`!!${ITEM('0201')}.querySelector('.prio-menu')`), 'a tap at the corner of the area opens the menu');
  }, { width: 375 });
});

for (const theme of ['light', 'dark']) {
  test(`0151 AC2: in the ${theme} look, a high risk tag is in the panel's red in Plan, the Build queue and the full ticket pane`, skip, async () => {
    await withPanel(async b => {
      const red = await b.js(RGB('var(--bad)'));
      assert.notEqual(red, await b.js(RGB('var(--warn)')));
      const colours = sel => b.js(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => [getComputedStyle(n).color, getComputedStyle(n).borderTopColor])`);
      // 0434: a Build ticket shows its risk while it's open. 0463: in its facts table, as plain text, so the queue has no tag
      await b.js(`document.querySelector('#queue .q .top').click()`);
      await settle(b);
      const plan = await colours('#shaping .tag.high'), queue = await colours('#queue .tag.high');
      assert.equal(queue.length, 0, 'no risk tag in the Build queue');
      await b.js(`${ITEM('0201')}.querySelector('.head').click()`);
      await settle(b);
      await b.js(`${ITEM('0201')}.querySelector('.full-open').click()`);
      await b.until(`!document.getElementById('full-ticket').hidden`, 'the full ticket');
      // 0465: and so is the full ticket's, as its open card's is
      assert.equal((await colours('#full-ticket .tag.high')).length, 0, 'no risk tag in the full ticket pane');
      assert.equal(plan.length, 1, 'one high risk tag in Plan');
      assert.deepEqual(plan[0], [red, red], 'Plan');
    }, { theme });
  });
}

for (const width of [375, 1280]) {
  test(`0151 AC3: at ${width} px, the criteria count, lint result and waiting-on note follow the tags, in the same line (0419)`, skip, async () => {
    await withPanel(async b => {
      const got = await b.js(`(() => { const item = ${ITEM('0202')}, checks = item.querySelector('.checks');
        return { text: checks.textContent, tagsIn: [...item.querySelectorAll('.head .tag')].every(n => checks.contains(n)) }; })()`);
      assert.match(got.text, /^P2 · S · low · 2 criteria · lint passes · after 0201$/);
      assert.ok(got.tagsIn, 'the tags are in the same line');
    }, { width });
  });
}

// Each item in the Plan list showing: its four borders, and the space to the next item.
const CARDS = `(() => {
  const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const back = getComputedStyle(document.getElementById('shaping-section')).backgroundColor;
  const items = [...document.querySelectorAll('#shaping .item')];
  return items.map((n, i) => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect(), next = items[i + 1];
    const side = k => ({ width: parseFloat(s['border' + k + 'Width']), style: s['border' + k + 'Style'], color: s['border' + k + 'Color'], contrast: contrast(s['border' + k + 'Color'], back) });
    return { what: n.className + ' ' + n.querySelector('.title').textContent, top: side('Top'), right: side('Right'), bottom: side('Bottom'), left: side('Left'),
      gap: next ? next.getBoundingClientRect().top - r.bottom : null };
  });
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0151 AC4: at ${width} px in the ${theme} look, every ticket, idea and inbox note in Plan is a bordered card, 8 px or more from the next`, skip, async () => {
      await withPanel(async b => {
        const line = await b.js(RGB('var(--line)'));
        for (const [view, count] of [['tickets', 3], ['ideas', 2], ['inbox', 2]]) {
          await tab(b, view);
          if (view === 'tickets') { await b.js(`${ITEM('0202')}.querySelector('.head').click()`); await settle(b); } // an open card too
          const cards = await b.js(CARDS);
          assert.equal(cards.length, count, `${view}: ${count} cards`);
          for (const c of cards) {
            for (const k of ['top', 'right', 'bottom', 'left']) {
              assert.ok(c[k].width >= 0.5 && c[k].style === 'solid', `${c.what}: no ${k} border`);
              assert.ok(c[k].contrast >= 1.4, `${c.what}: the ${k} border (${c[k].color}) is hard to see, contrast ${c[k].contrast.toFixed(2)}`);
            }
            if (c.gap !== null) assert.ok(c.gap >= 7.99, `${c.what}: only ${c.gap} px to the next card`);
            // 0167: no stripe. A closed card's left edge is as plain as its other sides.
            if (!/\bopen\b/.test(c.what)) assert.deepEqual([c.left.width, c.left.color], [c.right.width, line], `${c.what}: no stripe on its left edge`);
          }
        }
      }, { width, theme });
    });
  }
}

for (const width of [375, 1280]) {
  test(`0151 AC5: at ${width} px, opening a ticket, the priority menu, Set ready and Full ticket work as before`, skip, async () => {
    await withPanel(async b => {
      await b.js(`${ITEM('0202')}.querySelector('.head').click()`);
      await settle(b);
      assert.ok(await b.js(`${ITEM('0202')}.classList.contains('open')`), 'the ticket opens');
      await b.js(`${ITEM('0201')}.querySelector('.tag.pick').click()`);
      await settle(b);
      assert.ok(await b.js(`!!${ITEM('0201')}.querySelector('.prio-menu')`), 'the priority menu opens');
      await b.js(`[...${ITEM('0201')}.querySelectorAll('.prio-menu button')].find(n => n.textContent === 'P3').click()`);
      await b.until(`window.__posts.includes('/api/tickets/0201/priority/3')`, 'the priority to be set');
      await b.js(`${ITEM('0202')}.querySelector('.set-ready').click()`);
      await b.until(`window.__posts.includes('/api/tickets/0202/ready')`, 'Set ready');
      await b.js(`${ITEM('0202')}.querySelector('.full-open').click()`);
      await b.until(`!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .title').textContent === ${JSON.stringify(LONG)}`, 'the full ticket');
    }, { width });
  });
}
