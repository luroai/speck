import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0169: the builder badge's self-check and review loops ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const TICKETS = [
  T('0401', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' }),
  T('0402', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0403', 'reviewing', { title: 'Under review', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
    rounds: [{ ...round(2, 10), verdict: 'request_changes' }] }),
  T('0404', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0405', 'approved', { title: 'Being shipped', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    ship: { running: true, started: ago(5) } }),
  T('0406', 'building', { title: 'A build that stopped', started: ago(200), ...exitOf('It ended.') }),
];
function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const badgeIn = (p, id) => rowOf(p, id).children.find(n => n.className === 'top').children.find(n => n.className === 'badgerow').children[0];
// Since 0302 the poses are drawn by the design's LCD renderer (test/panel-0302.test.mjs), so what they draw is its own.

test('0169 AC1 and AC2: self-check and review have their own badge poses, with the same names; building and shipping keep the laptop', async () => {
  const p = fake();
  await p.settle();
  const shows = id => [badgeIn(p, id).className, badgeIn(p, id).attrs['aria-label']];
  assert.deepEqual(shows('0401'), ['badge type', 'The builder is writing code']);
  assert.deepEqual(shows('0402'), ['badge check', 'The builder is checking its own work']);
  assert.deepEqual(shows('0403'), ['badge review', 'The builder is with the reviewer']);
  assert.deepEqual(shows('0404'), ['badge still', 'The builder is paused'], 'a paused review stands still');
  assert.deepEqual(shows('0405'), ['badge ship', 'The builder is shipping']); // its own loop since 0172
  assert.deepEqual(shows('0406'), ['badge bad', 'The builder needs you']);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const stub = `(() => {
  const STATE = ${JSON.stringify({ run: { on: true }, tickets: TICKETS, ideas: [] })};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;
async function withPanel(fn, { motion = 'no-preference' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const FRAME = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)}).querySelector('canvas.badge').toDataURL()`;

test('0169 AC1, AC2 and AC4: in a real browser, the self-check and review badges move, and with reduced motion nothing moves', skip, async () => {
  const ids = ['0402', '0403'];
  // 0410: Build's list scrolls in a box shorter than the page was, and a badge out of view stands still, so the two are
  // scrolled into view first.
  const frames = async b => {
    await b.js(`[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === '0402').scrollIntoView({ block: 'start' })`);
    return Promise.all(ids.map(id => b.js(FRAME(id))));
  };
  await withPanel(async b => {
    const first = await frames(b);
    await new Promise(r => setTimeout(r, 450));
    const then = await frames(b);
    ids.forEach((id, i) => assert.notEqual(then[i], first[i], `${id}: moves`));
  });
  await withPanel(async b => {
    const first = await frames(b);
    await new Promise(r => setTimeout(r, 450));
    assert.deepEqual(await frames(b), first, 'nothing moves');
  }, { motion: 'reduce' });
});
