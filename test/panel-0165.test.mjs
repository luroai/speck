import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, request, findChrome, browserPage, fakePage, T, full, items, top, queueRows } from './support/panel.mjs';

// ---------- 0165: explain each tag when it's tapped ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

const STATE = (o = {}) => ({
  run: { on: false },
  tickets: [
    full('0201', { title: 'A draft with every tag', priority: 1, size: 'M', risk: 'high', type: 'bug', auto_ship: false }),
    full('0203', { title: 'Another draft', priority: 3, size: 'S', risk: 'low', type: 'fix', auto_ship: true }),
    T('0204', 'ready', { title: 'Ready to build', priority: 0, size: 'M', risk: 'low', type: 'bug', auto_ship: true }),
  ],
  ideas: [],
  ...o,
});
const MEANING = {
  P0: 'Priority 0: built before any other ticket',
  P1: 'Priority 1: built after P0 tickets',
  P3: 'Priority 3: built after P0 to P2 tickets',
  S: 'S: a small, contained change',
  M: 'M: several files or one new component',
  low: 'Low risk: ships by itself once approved',
  high: 'High risk: waits for you to ship it',
  bug: 'Bug: fixes a defect',
  fix: 'Fix: fixes a broken main, built before anything else',
};
const isTag = n => (n.className || '').split(' ').includes('tag');
const LABEL = text => (text === 'S' || text === 'M' ? `Size ${MEANING[text]}` : MEANING[text]);

// Before the page's own script runs: a fetch that answers with the board above.
const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

async function withPanel(fn, { width = 1280, height = 900, state = STATE(), touch = false } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    if (touch) await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shaping .item') && !!document.querySelector('#queue .q')`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
const mouse = async (b, [x, y]) => {
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await settle(b);
};
const tap = async (b, [x, y]) => {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise(r => setTimeout(r, 100));
  await settle(b);
};
const key = async (b, k) => {
  const code = k === ' ' ? 'Space' : k;
  const vk = { Enter: 13, ' ': 32, Escape: 27 }[k];
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(k === 'Enter' ? { text: '\r' } : k === ' ' ? { text: ' ' } : {}) });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
  await settle(b);
};
// Every tag in a part of the page, as a selector the page can use: Plan, the Build queue or the full ticket pane.
const WHERE = { plan: '#shaping .item .tag', queue: '#queue .q .tag', pane: '#full-ticket .tag' };
// Scrolls the tag into the middle of the screen and gives back its middle point.
const centre = (sel, i) => `(() => { const n = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; n.scrollIntoView({ block: 'center' });
  const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`;
const TIP = `(() => { const t = document.getElementById('tag-tip'); if (!t || t.hidden) return null; const r = t.getBoundingClientRect();
  return { text: t.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`;
const texts = (b, sel) => b.js(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => n.textContent)`);
const openPane = async b => {
  await b.js(`document.querySelector('#queue .q .top').click()`);
  await settle(b);
  await b.js(`document.querySelector('#queue .q .full-open').click()`);
  await settle(b);
  assert.equal(await b.js(`document.getElementById('full-ticket').hidden`), false, 'the full ticket pane is open');
};

// ---------- AC1 ----------

// Each tag's visible box, and whether the points of a 44 by 44 px square centred on it reach that tag.
const BOXES = sel => `[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => {
  n.scrollIntoView({ block: 'center' });
  const r = n.getBoundingClientRect(), s = getComputedStyle(n), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const points = [[cx - 21.5, cy - 21.5], [cx + 21.5, cy - 21.5], [cx - 21.5, cy + 21.5], [cx + 21.5, cy + 21.5], [cx, cy - 21.5], [cx, cy + 21.5], [cx - 21.5, cy], [cx + 21.5, cy]];
  return { text: n.textContent, height: r.height, top: r.top, left: r.left, right: r.right, font: s.fontSize, line: s.lineHeight, padding: s.paddingLeft,
    misses: points.filter(([x, y]) => { const hit = document.elementFromPoint(x, y); return !(hit === n || n.contains(hit)); }) };
})`;

for (const width of [375, 1280]) {
  test(`0165 AC1: at ${width} px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps${width < 700 ? ', with a 44 by 44 px tap area each' : ''}`, skip, async () => {
    await withPanel(async b => {
      const all = [];
      for (const where of ['plan', 'queue']) all.push(...(await b.js(BOXES(WHERE[where]))).map(t => ({ ...t, where })));
      await openPane(b);
      all.push(...(await b.js(BOXES(WHERE.pane))).map(t => ({ ...t, where: 'pane' })));
      assert.deepEqual(all.map(t => `${t.where} ${t.text}`), ['plan P1', 'plan M', 'plan high', 'plan bug', 'plan P3', 'plan S', 'plan low', 'plan fix',
        'queue P0', 'queue M', 'queue low', 'queue bug', 'pane bug', 'pane P0', 'pane M', 'pane low']);
      for (const t of all) {
        assert.ok(Math.abs(t.height - all[0].height) < 0.5, `${t.where} ${t.text} is ${t.height} px high, not ${all[0].height}`);
        assert.equal(t.font, all[0].font, `${t.where} ${t.text}: text size`);
        assert.equal(t.padding, all[0].padding, `${t.where} ${t.text}: padding`);
        if (width < 700) assert.deepEqual(t.misses, [], `${t.where} ${t.text}: these points of its 44 px tap area miss it`);
      }
      // The gaps between the tags in each row are equal, in every part of the page.
      const rows = new Map();
      for (const t of all) { const k = `${t.where} ${Math.round(t.top)}`; rows.set(k, [...(rows.get(k) || []), t]); }
      const gaps = [];
      for (const [k, row] of rows) {
        if (k.startsWith('pane')) continue; // measured after the page scrolled, so compared on its own below
        gaps.push(...row.slice(1).map((t, i) => [`${k} ${row[i].text}–${t.text}`, t.left - row[i].right]));
      }
      for (const [k, row] of rows) if (k.startsWith('pane')) gaps.push(...row.slice(1).map((t, i) => [`${k} ${row[i].text}–${t.text}`, t.left - row[i].right]));
      for (const [k, g] of gaps) assert.ok(Math.abs(g - gaps[0][1]) < 0.5, `${k}: a gap of ${g.toFixed(1)} px, not ${gaps[0][1].toFixed(1)}`);
    }, { width });
  });
}

// ---------- AC2 ----------

test('0165 AC2: a click on each tag that opens no menu shows its meaning next to it', skip, async () => {
  await withPanel(async b => {
    for (const where of ['plan', 'queue']) {
      const tags = await texts(b, WHERE[where]);
      for (let i = 0; i < tags.length; i++) {
        if (where === 'plan' && /^P\d$/.test(tags[i])) continue; // opens the priority menu (AC4)
        const at = await b.js(centre(WHERE[where], i));
        await mouse(b, at);
        const tip = await b.js(TIP);
        assert.ok(tip, `${where} ${tags[i]}: no tip`);
        assert.equal(tip.text, MEANING[tags[i]], `${where} ${tags[i]}`);
        const r = await b.js(`(() => { const r = document.querySelectorAll(${JSON.stringify(WHERE[where])})[${i}].getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; })()`);
        assert.ok(tip.top >= r.bottom - 0.5 ? tip.top - r.bottom < 16 : r.top - tip.bottom < 16, `${where} ${tags[i]}: the tip isn't next to the tag`);
        await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await settle(b);
      }
    }
    await openPane(b);
    const tags = await texts(b, WHERE.pane);
    for (let i = 0; i < tags.length; i++) {
      await mouse(b, await b.js(centre(WHERE.pane, i)));
      assert.equal((await b.js(TIP))?.text, MEANING[tags[i]], `pane ${tags[i]}`);
    }
  });
});

test('0165 AC2: Enter or Space on a focused tag shows its tip', skip, async () => {
  await withPanel(async b => {
    for (const k of ['Enter', ' ']) {
      await b.js(`document.querySelectorAll('#queue .q .tag')[1].focus()`);
      await key(b, k);
      assert.equal((await b.js(TIP))?.text, MEANING.M, `${JSON.stringify(k)} shows it`);
      assert.equal(await b.js(`document.querySelector('#queue .q').classList.contains('open')`), false, `${JSON.stringify(k)} doesn't open the ticket`);
      await b.js(`document.activeElement.blur()`);
      await mouse(b, [5, 890]);
      assert.equal(await b.js(TIP), null);
    }
  });
});

test('0165 AC2: with a mouse the tip shows on hover, and goes once the pointer leaves', skip, async () => {
  await withPanel(async b => {
    const at = await b.js(centre(WHERE.queue, 2));
    await b.move(at);
    await settle(b);
    assert.equal((await b.js(TIP))?.text, MEANING.low);
    await b.move([5, 890]);
    await settle(b);
    assert.equal(await b.js(TIP), null);
    // Hovered, then clicked: it stays open once the pointer leaves.
    await mouse(b, at);
    await b.move([5, 890]);
    await settle(b);
    assert.equal((await b.js(TIP))?.text, MEANING.low);
  });
});

// The risk tag's tip and label for a ticket in the queue, as the board gives it.
const riskTip = async ticket => {
  const p = fakePage([STATE({ tickets: [T('0204', 'ready', { type: '', ...ticket })] })]);
  await p.settle();
  const tag = p.all(p.byId('queue')).find(n => isTag(n) && n._text === ticket.risk);
  p.pointer('touch');
  p.press(tag);
  return [p.byId('tag-tip').textContent, tag.attrs['aria-label']];
};

test('0165 AC2: the risk tip says whether the ticket ships by itself, from its auto_ship', async () => {
  const both = s => [s, s];
  assert.deepEqual(await riskTip({ risk: 'low', auto_ship: true }), both(MEANING.low));
  assert.deepEqual(await riskTip({ risk: 'high', auto_ship: false }), both(MEANING.high));
  assert.deepEqual(await riskTip({ risk: 'low', auto_ship: false }), both('Low risk: waits for you to ship it'));
  assert.deepEqual(await riskTip({ risk: 'high', auto_ship: true }), both('High risk: ships by itself once approved'));
  assert.deepEqual(await riskTip({ risk: 'low' }), both('Low risk: waits for you to ship it'), 'a board without the field');
});

test('0165 AC2: the risk tip follows auto_ship and auto_ship_risk in speck/config.yml, through the panel\'s board', async () => {
  const r = panelRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  const base = fs.readFileSync(cfgFile, 'utf8');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const tip = async (autoShip, risks) => {
      fs.writeFileSync(cfgFile, base.replace(/^auto_ship:.*$/m, `auto_ship: ${autoShip}`).replace(/^auto_ship_risk:.*$/m, `auto_ship_risk: ${risks}`));
      const res = await request(panel.port, { pathName: '/api/state' });
      assert.equal(res.status, 200, res.body);
      const [ticket] = JSON.parse(res.body).tickets;
      assert.equal(ticket.risk, 'low');
      return (await riskTip(ticket))[0];
    };
    assert.equal(await tip('true', '[low]'), MEANING.low);
    assert.equal(await tip('true', '[high]'), 'Low risk: waits for you to ship it');
    assert.equal(await tip('false', '[low, high]'), 'Low risk: waits for you to ship it');
  } finally { await stop(panel); }
});

// ---------- AC3 ----------

test('0165 AC3: one tip at a time; a click elsewhere, Escape or a scroll closes it; a tag never opens or closes its ticket', skip, async () => {
  await withPanel(async b => {
    // One at a time.
    await mouse(b, await b.js(centre(WHERE.plan, 1)));
    await mouse(b, await b.js(centre(WHERE.plan, 2)));
    assert.equal((await b.js(TIP))?.text, MEANING.high);
    assert.equal(await b.js(`document.querySelectorAll('#tag-tip, .tag-tip').length`), 1);
    // The ticket stays shut, and an open one stays open.
    assert.equal(await b.js(`document.querySelector('#shaping .item').classList.contains('open')`), false, 'the tag opened its ticket');
    await b.js(`document.querySelector('#shaping .item .head').click()`);
    await settle(b);
    await mouse(b, await b.js(centre(WHERE.plan, 1)));
    assert.equal(await b.js(`document.querySelector('#shaping .item').classList.contains('open')`), true, 'the tag closed its ticket');
    await mouse(b, await b.js(centre(WHERE.queue, 1)));
    assert.equal(await b.js(`document.querySelector('#queue .q').classList.contains('open')`), false, 'the tag opened the queue ticket');
    // A click elsewhere.
    await mouse(b, [5, 890]);
    assert.equal(await b.js(TIP), null, 'a click elsewhere closes it');
    // Escape.
    await mouse(b, await b.js(centre(WHERE.queue, 1)));
    assert.ok(await b.js(TIP));
    await key(b, 'Escape');
    assert.equal(await b.js(TIP), null, 'Escape closes it');
    // A scroll.
    await mouse(b, await b.js(centre(WHERE.queue, 1)));
    assert.ok(await b.js(TIP));
    await b.js(`new Promise(r => { addEventListener('scroll', () => r(), { once: true }); scrollBy(0, 40); })`);
    await settle(b);
    assert.equal(await b.js(TIP), null, 'a scroll closes it');
  }, { width: 700, height: 600 });
});

test('0165 AC3: at 375 px, a tapped tip stays on screen, the rightmost tag\'s too', skip, async () => {
  await withPanel(async b => {
    for (const where of ['plan', 'queue']) {
      const tags = await texts(b, WHERE[where]);
      for (let i = 0; i < tags.length; i++) {
        if (where === 'plan' && /^P\d$/.test(tags[i])) continue;
        await tap(b, await b.js(centre(WHERE[where], i)));
        const tip = await b.js(TIP);
        assert.equal(tip?.text, MEANING[tags[i]], `${where} ${tags[i]}: a tap shows it`);
        assert.ok(tip.left >= 0 && tip.right <= 375 && tip.top >= 0 && tip.bottom <= 900, `${where} ${tags[i]}: the tip is off screen: ${JSON.stringify(tip)}`);
      }
    }
    assert.equal(await b.js(`[...document.querySelectorAll('#shaping .item, #queue .q')].some(n => n.classList.contains('open'))`), false, 'a tap opened a ticket');
  }, { width: 375, touch: true });
});

// ---------- AC4 ----------

test('0165 AC4: on a draft in Plan the priority tag opens the priority menu, not a tip; in the queue and the pane it shows its tip', skip, async () => {
  await withPanel(async b => {
    await mouse(b, await b.js(centre('#shaping .item .tag.pick', 0)));
    assert.equal(await b.js(`!!document.querySelector('#shaping .item .prio-menu')`), true, 'the menu opens');
    assert.equal(await b.js(TIP), null, 'and no tip');
    await key(b, 'Escape');
    assert.equal(await b.js(`!!document.querySelector('.prio-menu')`), false);
    await mouse(b, await b.js(centre(WHERE.queue, 0)));
    assert.equal((await b.js(TIP))?.text, MEANING.P0);
    await key(b, 'Escape');
    await openPane(b);
    await mouse(b, await b.js(centre(WHERE.pane, 1)));
    assert.equal((await b.js(TIP))?.text, MEANING.P0);
  });
});

test('0165 AC4: in the fake page, a draft\'s priority tag opens the menu and shows no tip', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const pick = p.all(items(p)[0]).find(n => /\bpick\b/.test(n.className || ''));
  p.press(pick);
  assert.ok(p.all(p.byId('shaping')).some(n => n.className === 'prio-menu'), 'the menu opens');
  assert.equal(p.byId('tag-tip').textContent, '', 'no tip was shown');
});

// ---------- AC5 ----------

test('0165 AC5: every tag is announced with its meaning', skip, async () => {
  await withPanel(async b => {
    const LABELS = sel => `[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => [n.textContent, n.getAttribute('aria-label'), n.getAttribute('role'), n.tabIndex])`;
    const got = [...await b.js(LABELS(WHERE.plan)), ...await b.js(LABELS(WHERE.queue))];
    await openPane(b);
    got.push(...await b.js(LABELS(WHERE.pane)));
    for (const [text, label, role, tab] of got) {
      if (/^P[13]$/.test(text) && label && label.includes('priority menu')) {
        assert.ok(label.startsWith(MEANING[text]), `the Plan priority tag ${text} says its meaning: ${label}`);
      } else assert.equal(label, LABEL(text), text);
      assert.equal(role, 'button', `${text}: role`);
      assert.equal(tab, 0, `${text}: reachable with Tab`);
    }
    assert.equal(LABEL('M'), 'Size M: several files or one new component');
  });
});

test('0165 AC5: the fake page gives each tag its label, the Plan priority tag too', async () => {
  const p = fakePage([STATE()]);
  await p.settle();
  const tags = p.all(top(items(p)[1])).filter(isTag);
  assert.deepEqual(tags.map(n => n._text), ['P3', 'S', 'low', 'fix']);
  assert.deepEqual(tags.slice(1).map(n => n.attrs['aria-label']), [LABEL('S'), LABEL('low'), LABEL('fix')]);
  assert.match(tags[0].attrs['aria-label'], /^Priority 3: built after P0 to P2 tickets\. /);
  const q = p.all(queueRows(p)[0]).filter(isTag);
  assert.deepEqual(q.map(n => n.attrs['aria-label']), [LABEL('P0'), LABEL('M'), LABEL('low'), LABEL('bug')]);
});

test('0165 AC4: the Plan priority tag keeps its pointer, and the tags that show a tip get the help pointer', skip, async () => {
  await withPanel(async b => {
    assert.equal(await b.js(`getComputedStyle(document.querySelector('#shaping .item .tag.pick')).cursor`), 'pointer');
    assert.equal(await b.js(`getComputedStyle(document.querySelectorAll('#queue .q .tag')[0]).cursor`), 'help');
  });
});

test('0165 AC2: an open full ticket pane updates its risk tip and label when only the ticket\'s auto_ship changes', async () => {
  const board = autoShip => STATE({ tickets: [full('0203', { risk: 'low', auto_ship: autoShip })] });
  const p = fakePage([board(true), board(false)]);
  await p.settle();
  p.press(top(items(p)[0]));
  p.press(p.all(items(p)[0]).find(n => n.className === 'full-open'));
  assert.equal(p.calls.length, 1, 'opening it asked for nothing more');
  const risk = () => p.all(p.byId('full-ticket')).find(n => isTag(n) && n._text === 'low');
  assert.equal(risk().attrs['aria-label'], MEANING.low);
  p.timers.shift()(); // the next refresh
  await p.settle();
  assert.equal(risk().attrs['aria-label'], 'Low risk: waits for you to ship it');
  p.press(risk());
  assert.equal(p.byId('tag-tip').textContent, 'Low risk: waits for you to ship it');
});
