import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0703: an open Plan card shows its chain as the facts Waits for and Waiting on it, as the full view does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click, findChrome, browserPage, panelRepo, startPanel, stop, freePort, openLane } from './support/panel.mjs';

const TICKETS = () => [
  full('0010'), full('0011', { after: ['0010'], waiting_on: ['0010'] }), full('0012', { after: ['0011'], waiting_on: ['0011'] }),
  full('0300', { title: 'Alone' }), T('0400', 'ready', { after: [] }),
];
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const factsIn = (p, n) => p.all(n).filter(x => x.className === 'facts chain-facts');
const boxes = (p, n) => p.all(n).filter(x => /^deps\b/.test(x.className || ''));
async function openCard(p, id) {
  let card = items(p).find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card.className)) { click(top(card)); await p.settle(); }
  return items(p).find(n => idOf(p, n) === id);
}
const page = async () => { const p = boardPage([{ run: { on: false }, ideas: [], tickets: TICKETS() }]); await p.settle(); return p; };

test('0703 AC1: an open Plan card shows Waits for and Waiting on it as facts, and no Chain box', async () => {
  const p = await page();
  const card = await openCard(p, '0011');
  const [facts] = factsIn(p, card);
  assert.ok(facts, 'chain facts');
  assert.deepEqual(facts.children.map(c => c.children[0].textContent), ['Waits for', 'Waiting on it']);
  assert.match(facts.textContent, /Waits for0010 queued/);
  assert.match(facts.textContent, /Waiting on it0012 queued/);
  assert.equal(boxes(p, card).length, 0, 'no Chain box');
});

test('0703 AC2: pressing an id in a Plan card\'s chain facts goes to that ticket on the page, not its full view', async () => {
  const p = await page();
  const card = await openCard(p, '0011');
  const link = p.all(card).find(n => n.tagName === 'button' && /^chain-id/.test(n.className) && n.textContent === '0012');
  assert.ok(link);
  p.press(link);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden !== false, true, 'its full view stays closed');
  assert.ok(queueRows(p).find(n => idOf(p, n) === '0012') || items(p).find(n => idOf(p, n) === '0012'), 'it is on the page');
});

test('0703 AC3: after a state refresh that changes the chain, the open card shows the new chain in one set of facts', async () => {
  const one = TICKETS();
  const two = TICKETS().map(t => (t.id === '0012' ? T('0012', 'building', { after: ['0011'], waiting_on: ['0011'], started: new Date().toISOString() }) : t));
  const p = boardPage([{ run: { on: false }, ideas: [], tickets: one }, { run: { on: false }, ideas: [], tickets: two }]);
  await p.settle();
  const card = await openCard(p, '0011');
  assert.equal(factsIn(p, card).length, 1);
  assert.match(factsIn(p, card)[0].textContent, /0012 queued/);
  p.timers.shift()();
  await p.settle();
  const after = await openCard(p, '0011');
  assert.equal(factsIn(p, after).length, 1, 'one set');
  assert.equal(boxes(p, after).length, 0);
  assert.match(factsIn(p, after)[0].textContent, /0012 building/, 'the new chain');
});

test('0703 AC1: in a browser at 320 px, a Plan card\'s chain facts keep their text visible, not cut off', { skip: findChrome() ? false : 'no Chromium found' }, async () => {
  const board = { run: { on: false }, ideas: [], tickets: TICKETS().concat([full('0013', { after: ['0011'], waiting_on: ['0011'] }), full('0014', { after: ['0011'], waiting_on: ['0011'] }), full('0015', { after: ['0011'], waiting_on: ['0011'] }), full('0016', { after: ['0011'], waiting_on: ['0011'] })]) };
  const stub = `(() => { const S = ${JSON.stringify(board)}; const real = window.fetch.bind(window);
    window.fetch = async (u, o = {}) => String(u) === '/api/state' ? new Response(JSON.stringify(S), { status: 200, headers: { 'content-type': 'application/json' } }) : real(u, o); })();`;
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.querySelectorAll('#shaping .item.ticket').length > 3`, 'the panel');
    await b.js(openLane('plan'));
    const m = await b.js(`(async () => {
      const card = () => [...document.querySelectorAll('#shaping .item.ticket')].find(n => n.querySelector('.id').textContent === '0011');
      if (!card().classList.contains('open')) card().querySelector('.head').click();
      for (let i = 0; i < 100 && !(card().classList.contains('open') && card().querySelector('.chain-facts')); i++) await new Promise(r => setTimeout(r, 20));
      return [...card().querySelectorAll('.chain-facts .value')].map(v => ({ text: v.textContent, clipped: v.scrollWidth > v.clientWidth + 0.5, ws: getComputedStyle(v).whiteSpace }));
    })()`);
    assert.equal(m.length, 2, JSON.stringify(m));
    for (const v of m) assert.ok(!v.clipped && v.ws === 'normal', JSON.stringify(v));
  } finally { await b.close(); await stop(panel); }
});

test('0703 AC4: an open Plan card with no chain shows no chain facts and no Chain box', async () => {
  const p = await page();
  const card = await openCard(p, '0300');
  assert.equal(factsIn(p, card).length, 0);
  assert.equal(boxes(p, card).length, 0);
});
