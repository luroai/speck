import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, panelRepo, freePort, startPanel, stop, findChrome, browserPage, stoppedClock, T, full, click } from './support/panel.mjs';

// ---------- 0449: make an empty Build lane say what to do next ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// The page's clock, stopped at 14:30 local time, so "today" and "min ago" don't move under the test.
const NOW = new Date(2026, 9, 24, 14, 30, 0).getTime();
const at = (h, m, day = 24) => new Date(2026, 9, day, h, m, 0).toISOString();
const shippedAt = (id, finished) => T(id, 'done', { started: finished, finished });
const STATE = (tickets, o = {}) => ({ run: { on: false }, tickets, ideas: [], ...o });
const pageOf = (state, now = NOW) => fakePage([state], { Date: stoppedClock(now) });
const lane = p => p.byId('queue');
const textOf = n => n.textContent;
// The lines of the empty lane's message, by class, in order.
const lines = p => {
  const box = lane(p).children;
  assert.equal(box.length, 1, 'the lane holds one message');
  return box[0].children.map(n => [n.className, textOf(n)]);
};
const SHIPPED = () => [shippedAt('0431', at(9, 5)), shippedAt('0433', at(14, 18)), shippedAt('0420', at(16, 0, 22))];

// ---------- AC1 ----------

test('0449 AC1: an empty Build lane says "Nothing building" once, and the counts line doesn\'t repeat it', async () => {
  const p = pageOf(STATE([]));
  await p.settle();
  assert.equal(lines(p)[0][1], 'Nothing building');
  assert.equal(p.byId('queue-n').textContent, '', 'the counts line says nothing');
  assert.equal(p.byId('queue-n').hidden, true, 'and is hidden');
  const all = `${p.byId('queue-n').textContent} ${lane(p).textContent}`;
  assert.equal(all.split('Nothing building').length - 1, 1, 'it says so once');
  assert.doesNotMatch(all, /Nothing in flight/);
});

test('0449 AC1: a ticket in the lane brings the counts line back', async () => {
  const p = fakePage([STATE([]), STATE([T('0301', 'ready')])], { Date: stoppedClock(NOW) });
  await p.settle();
  p.timers.shift()();
  await p.settle();
  assert.equal(p.byId('queue-n').hidden, false);
  assert.equal(p.byId('queue-n').textContent, '0 in flight · 1 queued');
  assert.doesNotMatch(lane(p).textContent, /Nothing building/);
});

// ---------- AC2 ----------

test('0449 AC2: under it, when the last ticket shipped and which, and how many shipped today', async () => {
  const p = pageOf(STATE(SHIPPED()));
  await p.settle();
  const l = lines(p);
  assert.deepEqual(l.slice(0, 3).map(x => x[1]), ['Nothing building', 'Last shipped 0433 · 12 min ago', '2 shipped today']);
});

test('0449 AC2: earlier today it gives the time, and before today the date', async () => {
  const p = pageOf(STATE([shippedAt('0431', at(8, 10))]));
  await p.settle();
  assert.equal(lines(p)[1][1], 'Last shipped 0431 · today 08:10');
  assert.equal(lines(p)[2][1], '1 shipped today');
  const q = pageOf(STATE([shippedAt('0420', at(16, 0, 22))]));
  await q.settle();
  assert.equal(lines(q)[1][1], 'Last shipped 0420 · 22 Oct');
  assert.equal(lines(q)[2][1], '0 shipped today');
});

test('0449 AC2: a ticket shipped just before midnight shows its date once the day has changed', async () => {
  const p = pageOf(STATE([shippedAt('0432', at(23, 58, 23))]), new Date(2026, 9, 24, 0, 10, 0).getTime());
  await p.settle();
  assert.equal(lines(p)[1][1], 'Last shipped 0432 · 23 Oct');
  assert.equal(lines(p)[2][1], '0 shipped today');
});

test('0449 AC2: with nothing shipped yet, it leaves those lines out', async () => {
  for (const tickets of [[], [T('0403', 'done')]]) { // a done ticket with no shipped time is no help either
    const p = pageOf(STATE(tickets));
    await p.settle();
    assert.doesNotMatch(lane(p).textContent, /shipped/i);
    assert.equal(lines(p)[0][1], 'Nothing building');
  }
});

test('0449 AC2: the minutes move on between updates of the board', async () => {
  let now = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
  const p = fakePage([STATE(SHIPPED())], { Date: Clock });
  await p.settle();
  assert.equal(lines(p)[1][1], 'Last shipped 0433 · 12 min ago');
  now += 5 * 60000;
  for (const { fn } of [...p.intervals.values()]) fn();
  assert.equal(lines(p)[1][1], 'Last shipped 0433 · 17 min ago');
});

// ---------- AC3 ----------

test('0449 AC3: with drafts in Plan, a "Go to Plan · <n> drafts" button opens the Plan tab', async () => {
  const p = pageOf(STATE([full('0201'), full('0202'), ...SHIPPED()]));
  await p.settle();
  const box = lane(p).children[0];
  const go = p.all(box).find(n => n.tagName === 'button');
  assert.ok(go, 'there is a button');
  assert.equal(go.textContent, 'Go to Plan · 2 drafts');
  assert.doesNotMatch(box.textContent, /Talk to your agent/);
  click(go);
  await p.settle();
  assert.equal(p.byId('tab-plan').attrs['aria-selected'], 'true', 'Plan is the open tab');
  assert.equal(p.byId('shaping-section').hidden, false);
  assert.equal(p.byId('build-section').hidden, true);
  const one = pageOf(STATE([full('0201')]));
  await one.settle();
  assert.equal(one.all(lane(one).children[0]).find(n => n.tagName === 'button').textContent, 'Go to Plan · 1 draft');
});

test('0449 AC3: with no drafts, it says to talk to your agent to capture an idea or make a ticket', async () => {
  const p = pageOf(STATE(SHIPPED()));
  await p.settle();
  const box = lane(p).children[0];
  assert.equal(p.all(box).filter(n => n.tagName === 'button').length, 0, 'no button');
  assert.match(box.textContent, /Talk to your agent to capture an idea or make a ticket\./);
});

// ---------- AC4: in a real browser ----------

const stub = (state, look) => `(() => {
  try { localStorage.setItem('speck-theme', '${look}'); } catch {}
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => String(url) === '/api/state'
    ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
})();`;
// In the page: the message's box against the lane's, and each line's contrast against what's behind it, with the alpha
// of each colour laid over what's under it.
const MEASURE = `(() => {
  const rgba = s => { const m = s.match(/[\\d.]+/g).map(Number); return [m[0] / 255, m[1] / 255, m[2] / 255, m.length > 3 ? m[3] : 1]; };
  const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
  const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const back = n => { const chain = []; for (let x = n; x; x = x.parentElement) chain.push(rgba(getComputedStyle(x).backgroundColor)); return chain.reverse().reduce((b, c) => over(c, b), [1, 1, 1, 1]); };
  const ratio = n => { const b = back(n), f = over(rgba(getComputedStyle(n).color), b); const [x, y] = [lum(f), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const lane = document.getElementById('queue'), msg = lane.firstElementChild, L = lane.getBoundingClientRect(), M = msg.getBoundingClientRect();
  const parts = [...msg.children].map(n => { const r = n.getBoundingClientRect(); return { text: n.innerText, size: parseFloat(getComputedStyle(n).fontSize), ratio: ratio(n), left: r.left - L.left, right: L.right - r.right }; });
  return { theme: document.documentElement.dataset.theme, left: M.left - L.left, right: L.right - M.right, parts };
})()`;

test('0449 AC4: at 375 and 1280 px, in both looks, the message is centred in the lane and meets 0161\'s contrast', skip, async () => {
  const state = STATE([full('0201'), shippedAt('0433', new Date(Date.now() - 12 * 60000).toISOString())]);
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    for (const look of ['light', 'dark']) {
      const b = await browserPage('about:blank');
      try {
        await b.send('Page.enable');
        await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state, look) });
        for (const width of [375, 1280]) {
          await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
          await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
          await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && /Nothing building/.test(document.getElementById('queue').innerText)`, 'the empty lane');
          const s = await b.js(MEASURE);
          const where = `${look} look, ${width} px`;
          assert.equal(s.theme, look, where);
          assert.ok(Math.abs(s.left - s.right) <= 1, `${where}: the message is centred (${s.left} vs ${s.right})`);
          assert.ok(s.parts.length >= 3, `${where}: its lines show`);
          for (const p of s.parts) {
            assert.ok(Math.abs(p.left - p.right) <= 1, `${where}: "${p.text}" is centred (${p.left} vs ${p.right})`);
            const need = p.size < 14 ? 7 : 4.5;
            assert.ok(p.ratio >= need, `${where}: "${p.text}" has ${p.ratio.toFixed(2)}:1, under ${need}:1`);
          }
        }
      } finally { await b.close(); }
    }
  } finally { await stop(panel); }
});
