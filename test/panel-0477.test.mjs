import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, fakePage, full, click, page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0477: the lanes in a thin strip under speck's screen, in place of the tabs ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const TAB = { capture: 'tab-capture', plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const LANE = { capture: 'capture-section', plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };
const clone = s => JSON.parse(JSON.stringify(s));
const board = (foreman = null) => ({ tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready')], ideas: [], ...(foreman ? { foreman } : {}) });
const headerCss = () => fs.readFileSync(path.join(ROOT, 'templates', 'panel-header.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// The declarations of every plain rule in the header's styles whose selectors include `sel`.
const decls = sel => [...headerCss().matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');
const nav = () => page().match(/<nav [^>]*id="tabs"[^>]*>([\s\S]*?)<\/nav>/);
// A fake page whose /api/state answers with `p.state` at that moment.
function livePage(s) {
  const box = { state: s };
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : clone(box.state)) }) });
  p.set = next => { box.state = next; };
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const open = p => Object.keys(LANE).filter(l => !p.byId(LANE[l]).hidden);

// ---------- AC1 ----------

test('0477 AC1: the lanes are a strip of their names in order, at most 32 px tall, the one in view in the text colour and the others muted, with no tab look', () => {
  const [whole, inner] = nav();
  assert.match(whole, /role="tablist"/);
  assert.deepEqual([...inner.matchAll(/<button [^>]*id="([^"]+)"[^>]*><span class="tab-name">([^<]+)<\/span>/g)].map(m => [m[1], m[2]]),
    [['tab-capture', 'Capture'], ['tab-plan', 'Plan'], ['tab-build', 'Build'], ['tab-shipped', 'Shipped']], 'each lane in order, as its name (0520: Capture first)');
  const strip = decls('.tabs');
  assert.match(strip, /(^|[\s;])height:\s*32px/, 'the strip is 32 px tall');
  assert.match(strip, /display:\s*flex/);
  assert.match(decls('.tab'), /color:\s*var\(--muted\)/, 'a lane not in view is muted');
  assert.match(decls('.tab[aria-selected="true"]'), /color:\s*var\(--text\)/, 'the lane in view is in the text colour');
  assert.match(decls('.tab'), /border:\s*0/, 'no box round a lane\'s name');
  assert.match(decls('.tab'), /border-radius:\s*0;/, 'no tab corners, so a tap in a corner of its box lands');
  assert.doesNotMatch(decls('.tab[aria-selected="true"]'), /background|border/, 'the lane in view isn\'t a tab joined to its lane (0457)');
});

// ---------- AC2 ----------

test('0477 AC2: Build shows how many tickets need you, in the colour the tab\'s number had, whichever lane is in view, and nothing at none', async () => {
  assert.match(decls('.tab .needs'), /color:\s*var\(--bad\)/, 'the number in the needs-you colour, as the tab had it');
  const p = livePage(board({ word: 'Needs you 3', tone: 'bad' }));
  await p.settle();
  const label = () => (p.byId('tab-build').attrs || {})['aria-label'];
  for (const lane of ['build', 'plan', 'shipped', 'capture', 'build']) {
    click(p.byId(TAB[lane]));
    assert.deepEqual(open(p), [lane]);
    assert.equal(p.byId('build-needs').textContent, '3', `${lane} in view: the number`);
    assert.equal(label(), 'Build, 3 needs you', `${lane} in view: its accessible name`);
  }
  p.set(board({ word: 'Needs you 12', tone: 'bad' }));
  await refresh(p);
  assert.equal(p.byId('build-needs').textContent, '12');
  for (const word of ['Building', 'Idle', 'Needs you', 'Needs you 0x']) {
    p.set(board({ word, tone: 'idle' }));
    await refresh(p);
    assert.equal(p.byId('build-needs').textContent, '', `"${word}": no number`);
    assert.equal(label(), 'Build', `"${word}": its name is Build`);
  }
});

// ---------- AC3 ----------

test('0477 AC3: each lane in the strip is a button Tab reaches, Enter or Space press and a screen reader hears as a tab of the lanes, the one in view selected', async () => {
  const [whole, inner] = nav();
  assert.match(whole, /aria-label="Lanes"/);
  const buttons = [...inner.matchAll(/<button ([^>]*)>/g)].map(m => m[1]);
  assert.equal(buttons.length, 4); // 0520: Capture, Plan, Build and Shipped
  for (const attrs of buttons) {
    assert.match(attrs, /\btype="button"/, attrs);
    assert.match(attrs, /\brole="tab"/, attrs);
    assert.match(attrs, /\baria-controls="[^"]+-section"/, attrs);
    assert.doesNotMatch(attrs, /\btabindex=|\bdisabled\b/, attrs);
  }
  const p = livePage(board());
  await p.settle();
  for (const lane of ['plan', 'shipped', 'capture', 'build']) {
    click(p.byId(TAB[lane]));
    assert.deepEqual(open(p), [lane], `pressing ${lane}`);
    for (const l of Object.keys(TAB)) assert.equal(p.byId(TAB[l]).attrs['aria-selected'], String(l === lane), `pressing ${lane}: ${l} selected or not`);
  }
});

// ---------- AC1, AC3 and AC4 in a real browser ----------

test('0477 AC1, AC3, AC4: in a real browser the strip is one row at most 32 px tall at every width from 320 px, each lane a 44 × 44 px tap target, pressing one slides to it, and a fourth lane fits with no change to the styles', skip, async () => {
  const r = panelRepo();
  r.write('0010-ready.md', fm({ id: '"0010"', title: 'Ready ticket', status: 'ready' }), good);
  r.write('0020-draft.md', fm({ id: '"0020"', title: 'Draft ticket', status: 'draft' }), good);
  r.write('0030-done.md', fm({ id: '"0030"', title: 'Shipped ticket', status: 'done' }), good, 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`!!document.querySelector('#queue .id') && !!document.querySelector('#shaping .item')`, 'the board');
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
    // AC3: pressing Plan slides the row to its card, as a swipe does
    await b.js(`window.__slid = []; new MutationObserver(() => window.__slid.push(document.querySelector('main').dataset.slide || '')).observe(document.querySelector('main'), { attributes: true, attributeFilter: ['data-slide'] }), 1`);
    await b.js(`document.getElementById('tab-plan').click(), 1`);
    await b.until(`document.getElementById('tab-plan').getAttribute('aria-selected') === 'true' && !document.querySelector('main').dataset.slide && !document.getElementById('shaping-section').hidden`, 'Plan to come into view', 3000);
    assert.ok((await b.js(`window.__slid`)).includes('settle'), 'the row slid to Plan\'s card');
    // The strip and each lane in it, at a width: its height, and each lane's box.
    const measure = () => b.js(`(() => {
      const nav = document.getElementById('tabs'), r = nav.getBoundingClientRect();
      return { height: r.height, top: r.top, left: r.left, right: r.right, bezelBottom: document.querySelector('.bezel').getBoundingClientRect().bottom,
        lanes: [...nav.querySelectorAll('[role="tab"]')].map(t => { const b = t.getBoundingClientRect();
          return { id: t.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height, lines: t.querySelector('.tab-name').getClientRects().length,
            colour: getComputedStyle(t).color, open: t.getAttribute('aria-selected') === 'true' }; }) };
    })()`);
    // A press with the mouse at each corner of each lane's box, half a pixel in, and at its middle, lands on that lane,
    // with nothing drawn over any of it.
    await b.js(`window.__pressed = []; document.addEventListener('pointerdown', e => window.__pressed.push((e.target.closest('[role="tab"]') || e.target).id || e.target.tagName), true), 1`);
    const presses = async lanes => {
      const out = [];
      for (const { id } of lanes) {
        const l = await b.js(`JSON.parse(JSON.stringify(document.getElementById('${id}').getBoundingClientRect()))`); // where it is now
        const points = [[l.left + .5, l.top + .5], [l.right - .5, l.top + .5], [l.left + .5, l.bottom - .5], [l.right - .5, l.bottom - .5], [(l.left + l.right) / 2, (l.top + l.bottom) / 2]];
        for (const [x, y] of points) for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
        out.push([id, await b.js(`window.__pressed.splice(0)`)]);
      }
      await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 690 }); // off the strip, so no lane is lit by hovering over it
      return out;
    };
    const check = async (s, at, n) => {
      assert.equal(s.lanes.length, n, `${at}: ${n} lanes`);
      assert.ok(s.height <= 32, `${at}: the strip is ${s.height} px tall`);
      assert.ok(s.bezelBottom <= s.top, `${at}: under speck's screen`);
      for (const [i, l] of s.lanes.entries()) {
        assert.equal(l.top, s.lanes[0].top, `${at}, lane ${i + 1}: on the one row`);
        assert.equal(l.lines, 1, `${at}, lane ${i + 1}: its name on one line`);
        assert.ok(l.left >= s.left && l.right <= s.right, `${at}, lane ${i + 1}: inside the strip`);
        assert.ok(l.width >= 44 && l.height >= 44, `${at}, lane ${i + 1}: ${l.width} × ${l.height} px`);
        if (i) assert.ok(l.left >= s.lanes[i - 1].right, `${at}, lane ${i + 1}: after the one before`);
      }
      const open = s.lanes.filter(l => l.open), shut = s.lanes.filter(l => !l.open);
      assert.equal(open.length, 1, `${at}: one lane in view`);
      assert.ok(shut.every(l => l.colour !== open[0].colour), `${at}: the lane in view stands out from the others`);
      for (const [id, got] of await presses(s.lanes)) assert.deepEqual(got, Array(5).fill(id), `${at}: a press anywhere in ${id} lands on it`);
    };
    // With a two-digit needs-you number on Build, its widest, kept there when the page draws it again
    await b.js(`(() => { const n = document.getElementById('build-needs'), put = () => { if (n.textContent !== '12') n.textContent = '12'; };
      put(); new MutationObserver(put).observe(n, { childList: true, characterData: true, subtree: true }); return 1; })()`);
    // AC4: 0520's Capture is the fourth lane, so the four real lanes are checked at every width
    for (const width of [320, 360, 414, 600, 900]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: width < 700 });
      await check(await measure(), `${width} px`, 4);
    }
  } finally { await b.close(); await stop(panel); }
});
