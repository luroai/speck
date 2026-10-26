import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { board, lane, pad, swipe, slidingPage } from './support/lanes.mjs';

// ---------- 0517: lane swipes that are snappier ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const press = (p, key) => p.document.listeners.keydown({ key, target: { tagName: 'BODY' }, preventDefault() {} });
// A slow drag sideways by `dx` px, 5 px every 50 ms (0.1 px a ms, slower than a flick), from the middle of the card.
const slowDrag = (p, dx) => p.touch(Array.from({ length: Math.ceil(Math.abs(dx) / 5) + 1 }, (_, i) => [200 + Math.sign(dx) * Math.min(i * 5, Math.abs(dx)), 300]), { gap: 50 });

// ---------- AC1 ----------

test('0517 AC1: a sideways trackpad scroll changes lane once it has gone 20 px, and one under 20 px changes nothing', async () => {
  const p = await pad();
  p.scroll([5, 5, 5, 4]);
  p.scroll([5, 5, 5, 4], { pause: 200 });
  assert.equal(lane(p), 'build', '19 px, twice after a pause, changes nothing');
  p.scroll([3, 7], { pause: 200 });
  assert.equal(lane(p), 'build', '10 px of a scroll');
  p.wheel(10);
  assert.equal(lane(p), 'shipped', 'and it changes lane on the step that takes it to 20 px');
  p.scroll([5, 5, 5, 5], { way: -1 });
  assert.equal(lane(p), 'build', '20 px the other way, with no pause, changes lane back');
  p.scroll([5, 5, 5, 5], { way: -1, pause: 200 });
  assert.equal(lane(p), 'plan', 'and 20 px after a pause changes lane again');
});

test('0517 AC1: a whole swipe still changes lane once, its glide changes nothing, and the next swipe changes lane again', async () => {
  const p = await pad();
  p.scroll(swipe(), { way: -1 });
  assert.equal(lane(p), 'plan', 'one swipe left, one lane');
  p.scroll(swipe());
  assert.equal(lane(p), 'build', 'one swipe right, with its glide, goes one lane');
  p.scroll(swipe(), { pause: 400 });
  assert.equal(lane(p), 'shipped', 'and the next swipe goes on, with no click between');
});

// ---------- AC2 ----------

test('0517 AC2: a lane change by trackpad, swipe, arrow key or a lane\'s name brings the card to rest within 120 ms', async () => {
  const p = await slidingPage();
  const tab = id => p.byId(id).listeners;
  const ways = [
    ['a sideways trackpad scroll', () => p.scroll(swipe(), { pause: 400 }), 'shipped'],
    ['a flick', () => p.touch([[200, 300], [215, 300], [230, 300], [245, 300]]), 'build'],
    ['the left arrow key', () => press(p, 'ArrowLeft'), 'plan'],
    ['a lane\'s name in the strip', () => tab('tab-shipped').click({ stopPropagation() {} }), 'shipped'],
    ['the arrow key on a lane\'s name', () => tab('tab-shipped').keydown({ key: 'ArrowLeft', preventDefault() {} }), 'build'],
    ['a slow drag', () => slowDrag(p, -150), 'shipped'],
  ];
  for (const [what, change, to] of ways) {
    const from = p.slides.length;
    change();
    assert.equal(lane(p), to, `${what}: changes lane`);
    const mine = p.slides.slice(from);
    assert.equal(mine.length, 3, `${what}: the row slides`);
    for (const a of mine) assert.ok(a.opts.duration <= 120, `${what}: the slide lasts ${a.opts.duration} ms`);
    assert.ok(p.sliding(), `${what}: sliding`);
    await p.rest();
    assert.ok(!p.sliding(), `${what}: and at rest once its time is up`);
  }
});

test('0517 AC2: with reduced motion, a lane still changes, without sliding', async () => {
  const p = await slidingPage({ reduce: { on: true } });
  p.scroll(swipe());
  assert.equal(lane(p), 'shipped');
  press(p, 'ArrowLeft');
  p.byId('tab-plan').listeners.click({ stopPropagation() {} });
  p.touch([[200, 300], [215, 300], [230, 300], [245, 300]]);
  assert.equal(lane(p), 'plan', 'every way changes lane');
  p.touch([[200, 300], [215, 300], [230, 300], [245, 300]], { gap: 16 });
  assert.equal(lane(p), 'plan', 'a flick past the first lane stays there');
  assert.equal(p.slides.length, 0, 'nothing slid');
  assert.ok(!p.sliding());
});

// ---------- AC3 ----------

const line = p => p.byId('queue-n').textContent;

test('0517 AC3: the lane change\'s own redraw waits until the card has come to rest', async () => {
  for (const [what, change] of [['an arrow key', p => press(p, 'ArrowRight')], ['a lane\'s name', p => p.byId('tab-shipped').listeners.click({ stopPropagation() {} })],
    ['a trackpad', p => p.scroll(swipe(), { pause: 400 })], ['a flick', p => p.touch([[200, 300], [185, 300], [170, 300], [155, 300]])]]) {
    const p = await slidingPage();
    p.byId('queue-n').textContent = 'not redrawn';
    change(p);
    assert.equal(lane(p), 'shipped', `${what}: changes lane`);
    assert.equal(p.slides.length, 3, `${what}: the slide starts at once`);
    await p.settle();
    assert.equal(line(p), 'not redrawn', `${what}: and nothing is redrawn while it slides`);
    await p.rest();
    assert.equal(line(p), '0 in flight · 1 queued', `${what}: the page is redrawn once the card is at rest`);
  }
});

test('0517 AC3: the refresh during a slide is drawn once the card has come to rest, after the last of two slides', async () => {
  const later = { ...board(), tickets: [...board().tickets, T('0007', 'ready')] };
  const p = await slidingPage({ boards: [board(), later] });
  assert.equal(line(p), '0 in flight · 1 queued');
  press(p, 'ArrowRight');
  p.timers.shift()(); // the refresh, with a ticket more in Build
  await p.settle();
  assert.equal(line(p), '0 in flight · 1 queued', 'the refresh isn\'t drawn while the card slides');
  press(p, 'ArrowLeft'); // another slide, before the first is at rest
  await p.settle();
  assert.equal(line(p), '0 in flight · 1 queued', 'nor while the next one slides');
  await p.rest();
  assert.equal(lane(p), 'build');
  assert.equal(line(p), '0 in flight · 2 queued', 'it\'s drawn once the card is at rest');
});

test('0517 AC3: a redraw held by a slide a finger catches is made once the finger has let go and the card is at rest', async () => {
  const p = await slidingPage();
  p.byId('queue-n').textContent = 'not redrawn';
  press(p, 'ArrowRight');
  p.touch([[200, 300], [210, 300], [220, 300]], { lift: false }); // caught partway
  assert.equal(line(p), 'not redrawn', 'held while the finger holds the card');
  p.byId('lanes').listeners.touchend({ type: 'touchend', timeStamp: 99999, touches: [] });
  assert.equal(line(p), 'not redrawn', 'and while it slides back');
  await p.rest();
  assert.equal(line(p), '0 in flight · 1 queued');
});

// In a real browser, with 500 tickets in Shipped and 30 in Plan: the time from a lane change to the end of the first
// frame of its slide, laid out, the first change (which lays the cards out for the first time) included. The time
// depends on how busy the machine is, so the test also checks what ran in that frame: the page's redraw (which starts
// by working out the board, panelModel) and the buttons' measuring (wholeButtons) didn't, and both ran once the card was
// at rest. Before 0517 both ran in that frame.
test('0517 AC3: in a real browser with 500 shipped tickets, a slide\'s first frame comes within 50 ms of the lane change, with no redraw in it', skip, async () => {
  const r = panelRepo();
  for (let n = 0; n < 500; n++) r.write(`${2000 + n}-done.md`, fm({ id: `"${2000 + n}"`, title: `Shipped ticket ${n}`, status: 'done' }), good, 'speck/tickets/done');
  for (let n = 0; n < 30; n++) r.write(`${1000 + n}-draft.md`, fm({ id: `"${1000 + n}"`, title: `Draft ticket ${n}`, status: 'draft' }), good);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.until(`document.querySelectorAll('#shipped tr').length >= 10 && document.querySelectorAll('#shaping .item').length >= 30`, 'the board', 20000);
    await b.js(`(() => { window.work = [];
      for (const name of ['panelModel', 'wholeButtons']) { const f = window[name]; window[name] = function (...a) { work.push([name, performance.now()]); return f.apply(this, a); }; }
      return 1; })()`);
    const times = [];
    for (const [to, change] of [['shipped', `document.getElementById('tab-shipped').click()`], ['build', `document.getElementById('tab-build').click()`],
      ['shipped', `document.getElementById('tab-shipped').click()`], ['plan', `document.getElementById('tab-plan').click()`],
      ['build', `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`],
      ['shipped', `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`]]) {
      const [t0, t1] = await b.js(`new Promise(done => { work.length = 0; const t0 = performance.now(); ${change};
        requestAnimationFrame(() => { document.getElementById('${LANE_IDS[to]}').getBoundingClientRect(); document.getElementById('shipped-section').getBoundingClientRect(); done([t0, performance.now()]); }); })`);
      assert.equal(await b.js(`document.getElementById('tab-${to}').getAttribute('aria-selected')`), 'true', `to ${to}`);
      times.push(Math.round(t1 - t0));
      await b.until(`!document.querySelector('main').dataset.slide`, 'the slide to end', 5000);
      await b.until(`work.some(([n]) => n === 'panelModel') && work.some(([n]) => n === 'wholeButtons')`, `to ${to}: the redraw and the measuring once the card is at rest`, 5000);
      const early = await b.js(`work.filter(([, t]) => t <= ${t1}).map(([n, t]) => n + ' at ' + Math.round(t - ${t0}) + ' ms')`);
      assert.deepEqual(early, [], `to ${to}: nothing redrawn or measured before the slide's first frame was laid out (${Math.round(t1 - t0)} ms)`);
    }
    assert.ok(times.every(t => t <= 50), `each slide's first frame within 50 ms of the lane change, the first included: ${times.join(', ')} ms`);
  } finally { await b.close(); await stop(panel); }
});
const LANE_IDS = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };

// ---------- AC4 ----------

test('0517 AC4: a touch is followed sideways once it has gone 6 px more sideways than up or down', async () => {
  const p = await slidingPage();
  const vars = p.byId('lanes').vars;
  p.touch([[200, 300], [203, 300], [205, 300]], { lift: false });
  assert.ok(!p.sliding() && vars['--drag'] !== '5px', '5 px sideways doesn\'t move the card');
  p.byId('lanes').listeners.touchend({ type: 'touchend', timeStamp: 99999, touches: [] });
  p.touch([[200, 300], [203, 301], [207, 302]], { lift: false });
  assert.ok(!p.sliding(), '7 px sideways and 2 px down: only 5 px more');
  p.byId('lanes').listeners.touchend({ type: 'touchend', timeStamp: 99999, touches: [] });
  p.touch([[200, 300], [204, 300], [207, 301]], { lift: false });
  assert.deepEqual([p.byId('lanes').dataset.slide, vars['--drag']], ['drag', '7px'], '7 px sideways and 1 px down moves the card with the finger');
  p.byId('lanes').listeners.touchend({ type: 'touchend', timeStamp: 99999, touches: [] });
  await p.rest();
});

test('0517 AC4: a slow drag changes lane past a quarter of the card\'s width, and a quick flick however short it is', async () => {
  const p = await slidingPage({ width: 400 });
  slowDrag(p, -95);
  await p.rest();
  assert.equal(lane(p), 'build', 'a slow drag of 95 px, under a quarter of 400 px, comes back');
  slowDrag(p, -105);
  await p.rest();
  assert.equal(lane(p), 'shipped', 'one of 105 px, past a quarter, changes lane');
  slowDrag(p, 120);
  await p.rest();
  assert.equal(lane(p), 'build', 'and one of 120 px, under the third it took before, changes lane back');
  p.touch([[200, 300], [210, 300], [220, 300]]);
  await p.rest();
  assert.equal(lane(p), 'plan', 'a quick flick of 20 px changes lane');
});

test('0517 AC4: up-and-down scrolling never moves the card, however far sideways the finger goes after', async () => {
  const p = await slidingPage();
  const vars = p.byId('lanes').vars;
  for (const points of [[[200, 300], [201, 294], [203, 280], [260, 270], [330, 260]], [[200, 300], [202, 307], [204, 330], [120, 340], [60, 350]]]) {
    p.touch(points, { lift: false });
    assert.ok(!p.sliding() && !/[1-9]/.test(vars['--drag'] || ''), `the card stays put (${JSON.stringify(points)})`);
    p.byId('lanes').listeners.touchend({ type: 'touchend', timeStamp: 99999, touches: [] });
    assert.equal(lane(p), 'build', 'and the lane with it');
    assert.equal(p.slides.length, 0, 'nothing slides');
  }
});
