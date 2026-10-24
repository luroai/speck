import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, shippedRows, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { rules, selectors } from './support/css.mjs';

// ---------- 0464: an open shipped ticket shows the same step track and facts table as one in flight ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// Midday local time, so "today" covers every ticket below that shipped minutes ago.
const NOW = new Date(2026, 9, 23, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();

const TICKETS = [
  T('0901', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
  T('0902', 'done', { title: 'A bug fix', type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 500)], builder_cost_usd: 1.5 }),
  T('0903', 'done', { title: 'Nothing at all' }),
  T('0905', 'done', { title: 'Merged, not pushed', started: ago(2000), finished: ago(1400), ship: { running: false, unpushed: true, message: 'Merged, but the push failed: run git push.' } }),
  T('0904', 'done', { title: 'A cost longer than its cell', started: ago(2000), finished: ago(1500), rounds: [round(1, 500)], builder_tokens: 900, builder_cost_usd: 123456789012345.67 }),
];
const board = () => ({ run: { on: false }, ideas: [], tickets: TICKETS });
const page = (states = [board()]) => fakePage(states, { Date: stoppedClock(NOW) });

const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const kids = n => n.children.map(c => c.className);
const detailsOf = (p, id) => p.all(cardOf(p, id)).find(n => n.tagName === 'button' && /\bdetails\b/.test(n.className || ''));
const stepsOf = (p, id) => cardOf(p, id).children.find(c => c.className === 'steps');
const trackOf = (p, id) => stepsOf(p, id).children[0];
const factsOf = (p, id) => stepsOf(p, id).children[1];
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
async function open(p, ...ids) {
  for (const id of ids) { p.press(detailsOf(p, id)); await p.settle(); }
}

test('0464 AC1: Details shows, under the title, the five steps all done, Review naming its last round, then the table', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0902', '0903');
  for (const id of ['0901', '0902', '0903']) {
    assert.deepEqual(kids(cardOf(p, id)), ['name', 'steps', 'full-cell'], `${id}: title, then the track and table, then Review pack`);
    const track = trackOf(p, id), f = factsOf(p, id);
    assert.equal(track.className, 'track', `${id}: a track, not stopped`);
    assert.deepEqual(track.children.map(s => s.className), ['step build done', 'step check done', 'step review done', 'step approve done', 'step ship done'], `${id}: every step done`);
    for (const s of track.children) assert.equal(s.title, s.textContent, `${id}: a step's tooltip is its whole name`);
    assert.equal(f.tagName, 'dl', `${id}: a list of labels and values`);
    assert.equal(f.className, 'facts');
    assert.equal(f.children.length, 6, `${id}: six cells`);
    for (const c of f.children) assert.match(c.children[1].className, /^value\b/);
  }
  assert.deepEqual(trackOf(p, '0901').children.map(s => s.textContent), ['Build', 'Self-check', 'Review 2', 'Approve', 'Ship']);
  assert.equal(trackOf(p, '0902').children[2].textContent, 'Review 1');
  assert.equal(trackOf(p, '0903').children[2].textContent, 'Review', 'no rounds: the step\'s name alone');
});

const plain = rules().filter(r => !r.at.length);
test('0464 AC1: the track and the table look the same on a shipped card as on a Build card', () => {
  const qs = plain.filter(r => selectors(r).some(s => /^\.q \.(track|facts)\b/.test(s)));
  assert.ok(qs.length >= 20, 'the track\'s and table\'s rules');
  for (const r of qs) {
    for (const s of selectors(r).filter(s => s.startsWith('.q '))) {
      assert.ok(selectors(r).includes(s.replace('.q ', '#shipped ')), `${s} also styles a shipped card's`);
    }
  }
});

test('0464 AC2: the six cells are Shipped, Time, Review rounds, Builder cost, Builder tokens and Reviewer tokens, with — for one it lacks', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0902', '0903');
  assert.deepEqual(cells(factsOf(p, '0901')), [['Shipped', '11:50'], ['Time', '15 min'], ['Review rounds', '2'], ['Builder cost', '$2.91'], ['Builder tokens', '2.4M'], ['Reviewer tokens', '108k']]);
  assert.deepEqual(cells(factsOf(p, '0902')), [['Shipped', '11:40'], ['Time', '30 min'], ['Review rounds', '1'], ['Builder cost', '$1.50'], ['Builder tokens', '—'], ['Reviewer tokens', '500']]);
  assert.deepEqual(cells(factsOf(p, '0903')), [['Shipped', '—'], ['Time', '—'], ['Review rounds', '—'], ['Builder cost', '—'], ['Builder tokens', '—'], ['Reviewer tokens', '—']]);
  // each value's tooltip is all of it: the date and time it shipped, and a shortened count's exact number
  const tips = id => factsOf(p, id).children.map(c => c.children[1].title);
  assert.deepEqual(tips('0901'), ['11:50', '15 min', '2', '$2.91', '2,412,345', '108,234']);
  assert.deepEqual(tips('0903'), ['—', '—', '—', '—', '—', '—']);
});

test('0464 AC2: a kept open card\'s Shipped cell still turns from the time alone to the day after midnight', async () => {
  let at = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  const p = fakePage([board(), board(), board()], { Date: Clock });
  await p.settle();
  await open(p, '0901');
  const kept = cardOf(p, '0901');
  assert.equal(cells(factsOf(p, '0901'))[0][1], '11:50');
  at = NOW + 13 * 3600 * 1000;
  p.timers.shift()();
  await p.settle();
  assert.equal(cardOf(p, '0901'), kept, 'the same card, kept');
  assert.equal(cells(factsOf(p, '0901'))[0][1], '23 Oct', 'the day alone, before today');
  assert.equal(factsOf(p, '0901').children[0].children[1].title, '23 Oct, 11:50');
});

test('0464 AC3: the labelled figures are gone, Review pack is under the table, Details closes it, and a closed card keeps its line', async () => {
  const p = page();
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0901')), ['name', 'sum'], 'closed: its title and its one line');
  assert.equal(p.all(cardOf(p, '0901')).find(n => n.className === 'meta').textContent, '11:50 · 15 min · 2 rounds · $2.91');
  await open(p, '0901');
  const c = cardOf(p, '0901');
  assert.ok(!p.all(c).some(n => /^(figs|fig|meta)$/.test(n.className || '')), 'no labelled figures, and no line');
  const bottom = c.children[2];
  assert.equal(bottom.className, 'full-cell');
  assert.deepEqual(bottom.children.map(n => n.textContent), ['Review pack', 'Details'], 'Review pack under the table, then Details');
  assert.equal(detailsOf(p, '0901').attrs['aria-expanded'], 'true');
  assert.deepEqual(kids(cardOf(p, '0902')), ['name', 'sum'], 'only the card tapped opens');
  await open(p, '0905');
  assert.deepEqual(kids(cardOf(p, '0905')), ['name', 'steps', 'unpushed', 'full-cell'], 'one not pushed says so under its table, above Review pack');
  p.press(detailsOf(p, '0901'));
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0901')), ['name', 'sum'], 'Details again closes it');
});

test('0464 AC4: a screen reader reads each cell as its label, then its value', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0903');
  for (const id of ['0901', '0903']) {
    for (const c of factsOf(p, id).children) {
      assert.equal(c.tagName, 'div', `${id}: a cell is a group in the list`);
      assert.deepEqual(c.children.map(n => n.tagName), ['dt', 'dd'], `${id}: its label is a term, its value its description`);
      assert.ok(c.children[0].textContent && c.children[1].textContent, `${id}: both have words`);
    }
  }
});

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
const MEASURE = `(async () => {
  await document.fonts.ready;
  const probe = document.createElement('i');
  document.body.appendChild(probe);
  const colour = v => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
  const want = ['--blue', '--inbox', '--yellow', '--green', '--purple'].map(colour), grey = colour('--line');
  probe.remove();
  return { want, grey, cards: [...document.querySelectorAll('#shipped tr.open')].map(c => {
    const f = c.querySelector('.facts'), t = c.querySelector('.track'), title = c.querySelector('.line'), pack = c.querySelector('.full-cell');
    const box = f.getBoundingClientRect(), card = c.getBoundingClientRect();
    const row = pack.getBoundingClientRect(), last = pack.lastElementChild.getBoundingClientRect();
    return { id: c.querySelector('.id').textContent, box: [box.left, box.right, box.top, box.bottom], card: [card.left, card.right], scroll: [f.scrollWidth, f.clientWidth],
      row: [row.left, row.right], details: [pack.lastElementChild.textContent, last.right],
      order: [title.getBoundingClientRect().bottom, t.getBoundingClientRect().top, t.getBoundingClientRect().bottom, box.top, box.bottom, pack.getBoundingClientRect().top],
      steps: [...t.children].map(s => getComputedStyle(s).borderTopColor),
      cells: [...f.children].map(n => { const b = n.getBoundingClientRect(), l = n.children[0], v = n.children[1], lb = l.getBoundingClientRect(), vb = v.getBoundingClientRect();
        return { label: l.textContent, value: v.textContent, top: b.top, width: b.width, height: b.height,
          labelAt: [lb.top - b.top, lb.left - b.left], valueAt: [vb.top - b.top, vb.left - b.left], valueHeight: vb.height,
          lineHeight: parseFloat(getComputedStyle(v).lineHeight), cut: v.scrollWidth > v.clientWidth + 0.5, ellipsis: getComputedStyle(v).textOverflow === 'ellipsis' }; }) };
  }) };
})()`;

test('0464 AC1 and AC3: in a real browser at 320 and 390 px, an open shipped card shows the coloured track and an even table, a long value cut short with …', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    // shipped minutes ago, by the real clock
    const s = board(), real = Date.now(), at = sec => new Date(real - sec * 1000).toISOString();
    for (const t of s.tickets) for (const k of ['started', 'finished']) if (t[k]) t[k] = at((NOW - Date.parse(t[k])) / 1000);
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub.replace(JSON.stringify(board()), JSON.stringify(s)) });
    for (const width of [320, 390]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: true });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.querySelectorAll('#shipped tr').length === ${TICKETS.length}`, 'the panel');
      await b.js(openLane('shipped'));
      await b.js(`[...document.querySelectorAll('#shipped .details')].forEach(d => d.click()), true`);
      await b.until(`document.querySelectorAll('#shipped tr.open').length === ${TICKETS.length}`, 'every card open');
      const { want, grey, cards } = await b.js(MEASURE);
      assert.equal(new Set(want).size, 5, 'five step colours');
      for (const c of cards) {
        const where = `${width} ${c.id}`;
        assert.deepEqual(c.steps, want, `${where}: each bar in its step's colour`);
        assert.ok(!c.steps.includes(grey), `${where}: no grey bar`);
        for (let i = 1; i < c.order.length; i++) assert.ok(c.order[i] >= c.order[i - 1] - 0.5, `${where}: title, track, table, then Review pack, in order (${c.order})`);
        assert.ok(c.box[0] >= c.card[0] && c.box[1] <= c.card[1], `${where}: inside its card`);
        assert.ok(Math.abs(c.row[0] - c.box[0]) < 0.5 && Math.abs(c.row[1] - c.box[1]) < 0.5, `${where}: Review pack's row as wide as the table (${c.row})`);
        assert.ok(c.details[0] === 'Details' && Math.abs(c.details[1] - c.row[1]) < 0.5, `${where}: Details at the end of that row`);
        assert.ok(c.scroll[0] <= c.scroll[1] + 0.5, `${where}: nothing past the table`);
        const [first] = c.cells;
        for (const [i, cell] of c.cells.entries()) {
          const rowFirst = c.cells[i < 3 ? 0 : 3];
          assert.ok(Math.abs(cell.top - rowFirst.top) < 0.5, `${where}: ${cell.label} is in its row`);
          assert.ok(Math.abs(cell.height - first.height) < 0.5, `${where}: ${cell.label} is as tall as the others`);
          assert.ok(Math.abs(cell.width - first.width) < 1, `${where}: ${cell.label} is as wide as the others`);
          assert.ok(Math.abs(cell.labelAt[0] - first.labelAt[0]) < 0.5 && Math.abs(cell.labelAt[1] - first.labelAt[1]) < 0.5, `${where}: ${cell.label}'s label in the same place`);
          assert.ok(Math.abs(cell.valueAt[0] - first.valueAt[0]) < 0.5 && Math.abs(cell.valueAt[1] - first.valueAt[1]) < 0.5, `${where}: ${cell.label}'s value in the same place`);
          assert.ok(cell.valueHeight <= cell.lineHeight + 0.5, `${where}: ${cell.label}'s value is one line (${cell.valueHeight} px)`);
          assert.ok(cell.ellipsis, `${where}: ${cell.label} ends in … when it's too long`);
        }
        if (c.id === '0904') assert.ok(c.cells[3].cut && c.cells[3].value === '$123456789012345.67', `${where}: the long cost is cut short`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
