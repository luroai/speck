import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, items, click, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { STUB, LANES, MEASURE, LABELS, CARD_COUNTS } from './support/cards-0519.mjs';

// ---------- 0519: every closed card the same height, and a closed Plan card's second row its labels ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const card = (p, id) => items(p).find(n => idOf(p, n) === id);
const rowOf = n => n.children[0].children[1]; // a closed Plan card's second row, under its title line
const tags = (p, n) => p.all(n).filter(x => /\btag\b/.test(x.className));

const board = () => ({ run: { on: true }, ideas: [], tickets: [
  full('0601', { priority: 3, size: 'M', risk: 'low', acceptance_criteria: ['One.', 'Two.', 'Three.'] }),
  full('0602', { priority: 1, size: 'S', risk: 'high', type: 'bug', lint: { errors: 1, warnings: 1 }, lint_messages: { errors: ['An error.'], warnings: ['A warning.'] } }),
  full('0603', { priority: 0, size: 'S', risk: 'low', type: 'fix' }),
  full('0604', { priority: 2, size: 'M', risk: 'low', kind: 'task' }),
  full('0605', { priority: '', size: '', risk: '' }),
] });

test('0519 AC1: a closed Plan card\'s second row is its priority, size, risk and type, each a label, with no " · ", criteria or lint result', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const [id, want] of [['0601', ['P3', 'M', 'low']], ['0602', ['P1', 'S', 'high', 'bug']], ['0603', ['P0', 'S', 'low', 'fix']], ['0604', ['P2', 'M', 'low', 'task']], ['0605', []]]) {
    const row = rowOf(card(p, id));
    assert.equal(row.className, 'checks', `${id}: its second row`);
    assert.deepEqual(tags(p, row).map(n => n.textContent), want, `${id}: its labels`);
    assert.equal(row.textContent, want.join(''), `${id}: nothing but its labels`);
    assert.ok(!p.all(row).some(n => /\bsep\b/.test(n.className)), `${id}: no " · " between them`);
    assert.doesNotMatch(row.textContent, /criteri|lint|warning/, `${id}: no criteria count or lint result`);
  }
});

test('0519 AC1: an open Plan card still shows its criteria count and lint result', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const id of ['0601', '0602']) { click(card(p, id).children[0]); await p.settle(); }
  const said = id => p.all(card(p, id)).filter(n => /^(ok|warn|bad)$/.test(n.className)).map(n => n.textContent);
  assert.ok(said('0601').includes('3 criteria'), said('0601').join(' | '));
  assert.ok(said('0601').includes('lint passes'));
  assert.ok(said('0602').includes('2 criteria'));
  assert.ok(said('0602').includes('An error.') && said('0602').includes('A warning.'), said('0602').join(' | '));
  assert.ok(!said('0602').includes('lint passes'));
});

test('0519 AC2: the priority label still opens the priority menu and sets the priority; size, risk and type explain themselves', async () => {
  const posts = [];
  const fetch = async (url, opts = {}) => {
    if (opts.method === 'POST') posts.push(String(url));
    return { ok: true, status: 200, json: async () => board() };
  };
  const p = fakePage([], { fetch });
  await p.settle();
  const [prio, size, risk, type] = tags(p, rowOf(card(p, '0602')));
  assert.equal(prio.attrs['aria-label'], 'Priority 1: built after P0 tickets. Opens the priority menu');
  click(prio);
  await p.settle();
  const menu = p.all(card(p, '0602')).find(n => n.className === 'prio-menu');
  assert.ok(menu, 'the priority menu opened');
  click(menu.children.find(b => b.textContent === 'P4'));
  await p.settle();
  assert.ok(posts.includes('/api/tickets/0602/priority/4'), posts.join(', '));
  for (const [n, tip] of [[size, 'S: a small, contained change'], [risk, 'High risk: waits for you to ship it'], [type, 'Bug: fixes a defect']]) {
    assert.equal(n.tip, tip);
    assert.equal(n.attrs.role, 'button');
    assert.ok(n.listeners.click && n.listeners.mouseenter, `${n.textContent}: shows its tip on a tap or a hover`);
  }
  const [, , , task] = tags(p, rowOf(card(p, '0604')));
  assert.equal(task.tip, 'Task: the build does a task and leaves its result in outputs/, not code');
});

// ---------- in a real browser: phones on a touch screen, and a 420 px side pane with a mouse ----------

async function inPanel(fn) {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    const go = async (width, look) => {
      const touch = width < 400;
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: touch });
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('speck-theme', ${JSON.stringify(look)}); } catch {}\n${STUB}` });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && ${CARD_COUNTS}`, 'the panel');
      assert.equal(await b.js(`document.documentElement.dataset.theme`), look, `the ${look} look`);
    };
    await fn(b, go);
  } finally { await b.close(); await stop(panel); }
}

test('0519 AC3 and AC4: at 320, 375 and 420 px, in both looks, every closed card in Plan, Build and Shipped is the same height, its title and second row on one line each with no room under the row', skip, () => inPanel(async (b, go) => {
  for (const width of [320, 375, 420]) for (const look of ['light', 'dark']) {
    const at = `${width} px, ${look}`;
    await go(width, look);
    const heights = [];
    for (const [lane, sel] of LANES) {
      await b.js(openLane(lane));
      const cards = await b.js(MEASURE(sel));
      assert.ok(cards.length >= 3, `${at}: the ${lane} lane's closed cards`);
      for (const c of cards) {
        const who = `${at}, ${lane} ${c.id}`;
        assert.equal(c.titleLines, 1, `${who}: its title is on one line`);
        assert.equal(c.rowLines, 1, `${who}: its second row is on one line`);
        assert.ok(!c.outside, `${who}: its second row stays inside the card`);
        assert.ok(c.rowEnd <= 0.5, `${who}: the card ends ${c.rowEnd} px under its second row, past its padding`);
        if (c.long) assert.ok(c.cut, `${who}: its long title is cut short with …`);
        heights.push([who, c.height]);
      }
    }
    assert.deepEqual([...new Set(heights.map(([, h]) => h))].length, 1, `${at}: ${heights.map(h => h.join(': ')).join(', ')}`);
  }
}));

test('0519 AC1 and AC2: in a real browser, a closed Plan card\'s labels are small boxes side by side with a small gap, and a tap on the priority opens its menu', skip, () => inPanel(async (b, go) => {
  for (const width of [320, 420]) {
    await go(width, 'light');
    await b.js(openLane('plan'));
    const cards = await b.js(LABELS);
    for (const c of cards) {
      const at = `${width} px, ${c.id}`;
      assert.ok(c.labels.length >= 3, `${at}: its labels`);
      for (const l of c.labels) {
        assert.ok(l.border > 0, `${at}: ${l.text} has a border`);
        assert.ok(l.size < c.titleSize, `${at}: ${l.text} is smaller type (${l.size} px) than the title (${c.titleSize} px)`);
        assert.ok(Math.abs(l.top - c.labels[0].top) < 0.5, `${at}: ${l.text} is beside the others`);
      }
      for (let i = 1; i < c.labels.length; i++) {
        const gap = c.labels[i].left - c.labels[i - 1].right;
        assert.ok(gap > 0 && gap <= 8, `${at}: ${gap} px between ${c.labels[i - 1].text} and ${c.labels[i].text}`);
      }
    }
    // the priority, tapped where its label is, opens the menu
    const [x, y] = await b.js(`(() => { const r = document.querySelector('#shaping .item.ticket:not(.open) .tag.pick').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    if (width < 400) for (const type of ['touchStart', 'touchEnd']) await b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    else for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
    await b.until(`!!document.querySelector('#shaping .prio-menu')`, `the priority menu at ${width} px`);
  }
}));
