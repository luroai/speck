import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full, page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0476: the lanes as whole cards in a row, slid between by a swipe ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LANE = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };
const TAB = { plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const LIST = { plan: 'shaping', build: 'queue', shipped: 'shipped-list' };
const staticHtml = () => page().replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const board = () => ({ tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready'), full('0005', { status: 'done', finished: new Date().toISOString() })], ideas: [] });
const showing = p => Object.keys(LANE).filter(l => !p.byId(LANE[l]).hidden);
const selected = p => Object.keys(TAB).filter(l => (p.byId(TAB[l]).attrs || {})['aria-selected'] === 'true');

// A real panel with enough tickets that every lane's list scrolls, in a real browser at `width` px, as a phone with a
// touch screen. b.lane() is the lane in view.
async function phone(width = 390) {
  const r = panelRepo();
  for (let n = 10; n < 40; n++) {
    r.write(`00${n}-ready.md`, fm({ id: `"00${n}"`, title: `Ready ticket ${n}`, status: 'ready' }), good);
    r.write(`01${n}-draft.md`, fm({ id: `"01${n}"`, title: `Draft ticket ${n}`, status: 'draft' }), good);
    r.write(`02${n}-done.md`, fm({ id: `"02${n}"`, title: `Shipped ticket ${n}`, status: 'done' }), good, 'speck/tickets/done');
  }
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  b.end = async () => { await b.close(); await stop(panel); };
  b.repo = r;
  try {
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: width < 700 });
    await b.until(`document.querySelectorAll('#queue .q').length >= 30 && document.querySelectorAll('#shipped tr').length >= 5 && document.querySelectorAll('#shaping .item').length >= 20`, 'the board');
  } catch (e) { await b.end(); throw e; }
  b.lane = () => b.js(`['plan', 'build', 'shipped'].find(l => document.querySelector('#tab-' + l).getAttribute('aria-selected') === 'true')`);
  // Where each card is against the column: its left edge less the column's, its width and whether it shows.
  b.cards = () => b.js(`(() => { const m = document.querySelector('main').getBoundingClientRect();
    return ${JSON.stringify(Object.values(LANE))}.map(id => { const s = document.getElementById(id), r = s.getBoundingClientRect();
      return { left: Math.round(r.left - m.left), width: Math.round(r.width), shows: s.getClientRects().length > 0 && getComputedStyle(s).visibility === 'visible', column: Math.round(m.width) }; }); })()`);
  b.width = () => b.js(`document.querySelector('main').getBoundingClientRect().width`);
  return b;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
// A finger on the screen: down at the first point, through each of the rest with `gap` ms between them, and up. Each
// event carries the time it happened, `gap` ms (or 10 ms, with no gap) after the one before, so how fast the finger
// moved doesn't depend on how quickly a busy machine sends them.
async function finger(b, points, { gap = 0, lift = true } = {}) {
  const at = ([x, y]) => [{ x, y, id: 1 }];
  const start = Date.now() / 1000, step = (gap || 10) / 1000;
  let i = 0;
  const touch = (type, touchPoints) => b.send('Input.dispatchTouchEvent', { type, touchPoints, timestamp: start + step * i++ });
  await touch('touchStart', at(points[0]));
  for (const p of points.slice(1)) { if (gap) await pause(gap); await touch('touchMove', at(p)); }
  if (lift) await touch('touchEnd', []);
}
// The open card comes to rest: the slide under way ends within 250 ms, by its own timing, and then the card is at rest.
async function settles(b, lane, what) {
  const left = await b.js(`Math.max(0, ...document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.parentElement === document.querySelector('main')).map(a => a.effect.getComputedTiming().endTime - (a.currentTime || 0)))`);
  assert.ok(left <= 250, `${what}: the slide ends within 250 ms (${left} ms)`);
  await b.until(`!document.querySelector('main').dataset.slide`, `${what}: the slide to end`, 3000);
  await atRest(b, lane, what);
}
// Points from one place to another in `n` equal steps.
const path = ([x0, y0], [x1, y1], n) => Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
// A quick swipe to the lane on the left (1) or the right (-1) that's also further than a third of the card, so it changes
// lane however quickly the browser gets it.
const swipe = (b, [x, y], w, dir) => finger(b, path([x - (dir * w) / 5, y], [x + (dir * w) / 4, y], 4));
// A point in the middle of the open lane's list.
const middle = b => b.js(`(() => { const r = document.querySelector('main').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`);
// The open card is at rest: wholly in the column, and the only one showing.
async function atRest(b, lane, what) {
  const cards = await b.cards();
  const i = Object.keys(LANE).indexOf(lane);
  assert.equal(await b.lane(), lane, `${what}: ${lane}'s tab is open`);
  assert.deepEqual(cards.map(c => c.shows), cards.map((c, j) => j === i), `${what}: only ${lane}'s card shows (${JSON.stringify(cards)})`);
  assert.deepEqual([cards[i].left, cards[i].width], [0, cards[i].column], `${what}: ${lane}'s card fills the column (${JSON.stringify(cards)})`);
}

// ---------- AC1 ----------

test('0476 AC1: Plan, Build and Shipped are three cards in one row in that order, each its lane\'s name at its top, over its lane line and tickets', async () => {
  const main = staticHtml().match(/<main>([\s\S]*?)<\/main>/);
  assert.ok(main, 'the lanes are in one box');
  const sections = [...main[1].matchAll(/<section id="([^"]+)"[^>]*>\s*<h2 class="lane-title">([^<]*)<\/h2>([\s\S]*?)<\/section>/g)];
  assert.deepEqual(sections.map(s => [s[1], s[2]]), [['shaping-section', 'Plan'], ['build-section', 'Build'], ['shipped-section', 'Shipped']], 'each card\'s name is the first thing in it');
  assert.match(sections[1][3], /id="queue-n"[\s\S]*id="queue"/, 'Build\'s lane line, then its tickets');
  assert.match(sections[2][3], /id="shipped-n"[\s\S]*id="shipped-list"/, 'Shipped\'s lane line, then its tickets');
  const p = fakePage([board()]);
  await p.settle();
  assert.deepEqual(showing(p), ['build'], 'one card in view: Build, as the page opens');
  assert.equal(p.byId('queue-n').textContent, '0 in flight · 1 queued', 'the lane line as today');
});

test('0476 AC1: the arrow keys change lane anywhere but in a text field or a tab, without going round the ends', async () => {
  const p = fakePage([board()]);
  await p.settle();
  const press = (key, o = {}) => p.document.listeners.keydown({ key, target: { tagName: 'BODY' }, preventDefault() {}, ...o });
  press('ArrowRight');
  assert.deepEqual([showing(p), selected(p)], [['shipped'], ['shipped']], '→ from Build');
  press('ArrowRight');
  assert.deepEqual(showing(p), ['shipped'], '→ at the last lane stays there');
  press('ArrowLeft'); press('ArrowLeft');
  assert.deepEqual([showing(p), selected(p)], [['plan'], ['plan']], '← twice');
  press('ArrowLeft');
  assert.deepEqual(showing(p), ['plan'], '← at the first lane stays there');
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) { press('ArrowRight', { target: { tagName } }); assert.deepEqual(showing(p), ['plan'], `in a ${tagName}`); }
  press('ArrowRight', { target: { tagName: 'DIV', isContentEditable: true } });
  press('ArrowRight', { altKey: true });
  press('ArrowRight', { target: { tagName: 'BUTTON', getAttribute: k => (k === 'role' ? 'tab' : null) } });
  assert.deepEqual(showing(p), ['plan'], 'nor in an editable box, with Alt held, or on a tab (whose own key handler moves it)');
  p.key('ArrowRight'); // a key with no target, as the fake page sends it
  assert.deepEqual(showing(p), ['build']);
});

// ---------- AC2, AC3 and AC4: in a real browser, with a simulated finger ----------

test('0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 250 ms; a flick changes lane however short, a slow drag past a third', skip, async () => {
  const b = await phone(390);
  try {
    await atRest(b, 'build', 'as the page opens');
    const w = await b.width(), [x, y] = await middle(b);
    // A slow drag, held down: the card follows the finger.
    await finger(b, path([x, y], [x - 60, y], 6), { gap: 40, lift: false });
    const held = await b.cards();
    assert.equal(held[1].left, -60, `the card moved with the finger (${JSON.stringify(held)})`);
    assert.deepEqual([held[2].shows, held[2].left], [true, held[2].column - 60], 'and the next card shows beside it, in line');
    assert.deepEqual([held[0].shows, held[0].left], [true, -held[0].column - 60], 'and the one before it, in line');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settles(b, 'build', 'a slow drag under a third of the card');
    // A slow drag past a third
    await finger(b, path([x + 80, y], [x + 80 - w / 3 - 20, y], 10), { gap: 50 });
    await settles(b, 'shipped', 'a slow drag left past a third');
    // A quick flick, a sixth of the card's width
    await finger(b, path([x, y], [x + w / 6, y], 3));
    await settles(b, 'build', 'a short quick flick right');
    await finger(b, path([x, y], [x + w / 6, y], 3));
    await settles(b, 'plan', 'and another');
    await finger(b, path([x - 50, y], [x + 100, y], 3));
    await settles(b, 'plan', 'a flick past the first card comes back to it');
  } finally { await b.end(); }
});

test('0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding', skip, async () => {
  const b = await phone(390);
  try {
    const w = await b.width(), [x, y] = await middle(b);
    const wheel = async dx => {
      for (let i = 0; i < 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: dx, deltaY: 0 });
    };
    await wheel(30);
    await settles(b, 'shipped', 'a sideways scroll right changes lane once');
    await pause(200);
    await wheel(-30);
    await settles(b, 'build', 'and back');
    const top = await b.js(`document.getElementById('queue').scrollTop`);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: 200 });
    await b.until(`document.getElementById('queue').scrollTop > ${top}`, 'an up-and-down scroll to scroll the list');
    assert.equal(await b.lane(), 'build', 'an up-and-down scroll leaves the lane as it is');
    await b.js('document.activeElement.blur(), 1');
    const key = async k => { for (const type of ['rawKeyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: k === 'ArrowLeft' ? 37 : 39 }); };
    await key('ArrowLeft');
    await settles(b, 'plan', '← with the focus on nothing');
    await key('ArrowRight');
    await settles(b, 'build', '→');
    // Reduced motion: the lane changes at once, with no slide and no card beside it showing on the way.
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await key('ArrowRight');
    await atRest(b, 'shipped', 'reduced motion: at rest as soon as the key is pressed');
    const [x2, y2] = await middle(b);
    await finger(b, path([x2, y2], [x2 + 150, y2], 6), { gap: 40, lift: false });
    const held = await b.cards();
    assert.equal(held[2].left, 0, 'reduced motion: the card stays put under the finger');
    assert.equal(held[1].shows, false, 'and the card beside it stays hidden');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await atRest(b, 'build', 'reduced motion: the swipe changes lane at once');
  } finally { await b.end(); }
});

test('0476 AC3: a touch follows only the way it went in its first 10 px, a swipe straight after a scroll slides at once, and one in something that scrolls sideways scrolls that', skip, async () => {
  const b = await phone(390);
  try {
    const w = await b.width(), [x, y] = await middle(b);
    // Up and down first: then sideways goes nowhere, and the list scrolled. (The browser itself holds back a touch's
    // moves until it has gone 15 px, so each way is taken a little further than 10 px before it turns.)
    await finger(b, [...path([x, y], [x + 2, y - 24], 4), ...path([x + 2, y - 24], [x - 150, y - 30], 6)], { gap: 16, lift: false });
    assert.equal((await b.cards())[1].left, 0, 'a touch that went up first doesn\'t move the card sideways');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.ok(await b.js(`document.getElementById('queue').scrollTop > 0`), 'it scrolled the list');
    await settles(b, 'build', 'after a touch that went up first');
    // Sideways first: then up and down doesn't scroll the list.
    await b.js(`document.getElementById('queue').scrollTop = 0, 1`);
    await finger(b, [...path([x, y], [x - 24, y - 2], 4), ...path([x - 24, y - 2], [x - 40, y - 120], 6)], { gap: 16, lift: false });
    assert.equal(await b.js(`document.getElementById('queue').scrollTop`), 0, 'a touch that went sideways first doesn\'t scroll the list');
    assert.ok((await b.cards())[1].left < -20, 'and moves the card');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settles(b, 'build', 'after a short drag that went sideways first');
    // A quick scroll up the list that leaves it gliding, and a swipe straight after it.
    await b.js(`document.getElementById('queue').scrollTop = 0, 1`);
    await finger(b, path([x, y + 150], [x, y - 150], 4));
    const lifted = await b.js(`document.getElementById('queue').scrollTop`);
    await pause(20);
    const glide = await b.js(`document.getElementById('queue').scrollTop`);
    assert.ok(glide > lifted, `the list is still gliding after the finger lifted (${lifted} px, then ${glide} px)`);
    await swipe(b, [x, y], w, -1);
    await settles(b, 'shipped', `a swipe straight after a quick scroll (the list at ${glide} px when it started)`);
    // A swipe that starts in something that scrolls sideways scrolls it instead.
    await b.js(`(() => { const d = document.createElement('div'); d.id = 'wide'; d.style.cssText = 'overflow-x:auto;height:120px';
      d.innerHTML = '<div style="width:2000px;height:100px">wide</div>'; const l = document.getElementById('shipped-list'); l.scrollTop = 0; l.prepend(d); return 1; })()`);
    const box = await b.js(`(() => { const r = document.getElementById('wide').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + 50)]; })()`);
    await finger(b, path(box, [box[0] - 150, box[1]], 6), { gap: 16 });
    await settles(b, 'shipped', 'a swipe in a sideways scroller');
    assert.ok(await b.js(`document.getElementById('wide').scrollLeft > 50`), 'scrolled the scroller instead');
  } finally { await b.end(); }
});

test('0476 AC3: the tabs stay in step with the cards, and the lane open and each lane\'s scroll place survive the refresh and a pop-up', skip, async () => {
  const b = await phone(390);
  try {
    const w = await b.width(), [x, y] = await middle(b);
    await b.js(`document.getElementById('tab-plan').click(), 1`);
    assert.equal(await b.js(`document.querySelector('main').dataset.slide === 'settle' && getComputedStyle(document.getElementById('build-section')).display`), 'flex', 'pressing a tab slides from the card that was open');
    await settles(b, 'plan', 'after pressing Plan\'s tab');
    // Self-check: a ticket scrolled into view partway through a slide, as "Go to ticket" does, never scrolls the row aside.
    await b.js(`document.getElementById('tab-shipped').click(), document.querySelector('#shipped tr:last-child').scrollIntoView(), 1`);
    await settles(b, 'shipped', 'after a ticket was scrolled into view during a slide');
    assert.equal(await b.js(`document.querySelector('main').scrollLeft`), 0, 'the row wasn\'t scrolled');
    await b.js(`document.getElementById('shipped-list').scrollTop = 0, document.getElementById('tab-plan').click(), 1`);
    await settles(b, 'plan', 'after pressing Plan\'s tab again');
    await b.js(`document.getElementById('shaping').scrollTop = 150, 1`);
    await swipe(b, [x, y], w, -1);
    await settles(b, 'build', 'the open tab follows a swipe');
    await b.js(`document.getElementById('queue').scrollTop = 220, 1`);
    await swipe(b, [x, y], w, -1);
    await settles(b, 'shipped', 'after another swipe');
    await b.js(`document.getElementById('shipped-list').scrollTop = 90, 1`);
    const place = lane => b.js(`document.getElementById('${LIST[lane]}').scrollTop`);
    // A closed lane's list isn't drawn, so each lane's place is read with it open, by a swipe.
    const places = async () => {
      const out = { shipped: await place('shipped') };
      for (const lane of ['build', 'plan']) { await swipe(b, [x, y], w, 1); await settles(b, lane, `back to ${lane}`); out[lane] = await place(lane); }
      for (const lane of ['build', 'shipped']) { await swipe(b, [x, y], w, -1); await settles(b, lane, `on to ${lane}`); }
      await atRest(b, 'shipped', 'back to Shipped');
      return out;
    };
    assert.deepEqual(await places(), { shipped: 90, build: 220, plan: 150 });
    // The refresh, every 2 seconds, with a board that has changed in every lane
    b.repo.write('0099-new.md', fm({ id: '"0099"', title: 'Added while open', status: 'ready' }), good);
    b.repo.write('0199-new.md', fm({ id: '"0199"', title: 'Drafted while open', status: 'draft' }), good);
    await b.until(`document.getElementById('queue').textContent.includes('Added while open') && document.getElementById('shaping').textContent.includes('Drafted while open')`, 'the refresh');
    await atRest(b, 'shipped', 'after the refresh');
    assert.deepEqual(await places(), { shipped: 90, build: 220, plan: 150 }, 'after the refresh');
    // A pop-up opening and closing
    await b.js(`document.getElementById('settings-open').click(), 1`);
    await b.until(`!document.getElementById('settings').hidden`, 'Settings to open');
    await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await b.until(`document.getElementById('settings').hidden`, 'Settings to close');
    await atRest(b, 'shipped', 'after a pop-up');
    assert.deepEqual(await places(), { shipped: 90, build: 220, plan: 150 }, 'after a pop-up');
    // While a finger drags, the card beside the open one shows its list where it was left.
    await finger(b, path([x, y], [x + 60, y], 4), { gap: 40, lift: false });
    assert.equal(await place('build'), 220, 'Build\'s list, beside Shipped, during a drag');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await b.end(); }
});

for (const width of [390, 1400]) {
  test(`0476 AC4: at ${width} px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them`, skip, async () => {
    const b = await phone(width);
    try {
      const box = await b.js(`(() => { const r = document.querySelector('main').getBoundingClientRect(); return { left: r.left, width: r.width, page: document.documentElement.clientWidth }; })()`);
      assert.equal(box.width, Math.min(720, box.page), `as wide as the page, up to 720 px (${JSON.stringify(box)})`);
      assert.ok(Math.abs(box.left - (box.page - box.width) / 2) <= 1, `centred (${JSON.stringify(box)})`);
      await atRest(b, 'build', 'as the page opens');
      const [x0, y0] = await middle(b);
      await finger(b, path([x0, y0], [x0 - 40, y0], 4), { gap: 40, lift: false });
      const cards = await b.cards();
      assert.deepEqual(cards.map(c => [c.shows, c.width, c.left]), [-1, 0, 1].map(j => [true, Math.round(box.width), j * Math.round(box.width) - 40]), `while a finger drags, the three cards show in a row, each as wide as the column (${JSON.stringify(cards)})`);
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await settles(b, 'build', 'after a drag under a third');
      const shows = await b.js(`[...document.querySelectorAll('main > section')].filter(s => { const r = s.getBoundingClientRect(); return s.getClientRects().length > 0 && getComputedStyle(s).visibility === 'visible' && r.right > 0 && r.left < innerWidth; }).length`);
      assert.equal(shows, 1, 'one lane shows on the page');
      const w = await b.width(), [x, y] = await middle(b);
      await swipe(b, [x, y], w, -1);
      await settles(b, 'shipped', 'after a swipe left');
      await swipe(b, [x, y], w, 1);
      await settles(b, 'build', 'after a swipe right');
    } finally { await b.end(); }
  });
}
