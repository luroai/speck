import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, exitOf, queueRows, boardPage, openQueueRows, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { rules, tokens, get } from './support/css.mjs';

// ---------- 0462: an open in-flight Build ticket's facts in a table of six cells under its step track ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'a-reviewer-model-with-a-very-long-name-6.1-sol';

const TICKETS = [
  T('0901', 'building', { started: ago(65), build_running: true, builder: 'claude', priority: 1, size: 'M', risk: 'high', type: 'bug' }),
  T('0902', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: LONG, type: 'fix', priority: 0 }),
  T('0903', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: false, task: 'document', builder: 'claude' }),
  T('0904', 'reviewing', { started: ago(200), build_running: true, self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], review_running: null, builder: 'cursor' }),
  T('0905', 'blocked', { started: ago(300), self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?', builder: 'claude' }),
  T('0906', 'building', { started: ago(65), build_running: true, self_check: 'no changes', builder: 'claude' }),
  T('0907', 'ready', {}),
];
const board = () => ({ run: { on: true }, ideas: [], tickets: TICKETS });
let clock = NOW;
const page = () => { clock = NOW; return boardPage([board()], { Date: class extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } } }); };
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const factsOf = c => c.children[0].children.find(n => n.className === 'facts') || null;
// Each cell as [label, value, value's classes, tooltip].
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent, c.children[1].className, c.children[1].title]);

test('0462 AC1: an open in-flight ticket shows six labelled cells under its track, in place of the dotted line', async () => {
  const p = page();
  await p.settle();
  await openQueueRows(p);
  const want = {
    '0901': [['Now', 'Writing'], ['Builder', 'Claude'], ['Time', '01:05'], ['Priority', 'P1'], ['Size · risk', 'M · high'], ['Type', 'bug']],
    '0902': [['Now', 'Reviewing'], ['Reviewer', LONG], ['Time', '01:05'], ['Priority', 'P0'], ['Size · risk', 'S · low'], ['Type', 'fix']],
    '0903': [['Now', 'Ready to ship'], ['Builder', 'Claude'], ['Waiting'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'document']],
    '0904': [['Now', 'Fixing'], ['Builder', 'Cursor'], ['Time'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'code']],
    '0905': [['Now', 'Has a question'], ['Builder', 'Claude'], ['Time'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'code']],
    '0906': [['Now', 'Checking'], ['Builder', 'Claude'], ['Time'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'code']],
  };
  for (const [id, rows] of Object.entries(want)) {
    const c = card(p, id), top = c.children[0], f = factsOf(c);
    assert.ok(f, `${id}: a table of facts`);
    assert.equal(f.tagName, 'dl', `${id}: a list of labels and values`);
    const track = top.children.findIndex(n => /^track\b/.test(n.className));
    assert.equal(top.children.indexOf(f), track + 1, `${id}: straight under the track`);
    assert.equal(top.children.length, track + 2, `${id}: nothing after it in the top row`);
    assert.ok(!p.all(c).some(n => /^progress\b/.test(n.className || '')), `${id}: no dotted line`);
    const got = cells(f);
    assert.equal(got.length, 6, `${id}: six cells`);
    rows.forEach(([label, value], i) => {
      assert.equal(got[i][0], label, `${id}: cell ${i + 1}'s label`);
      if (value !== undefined) assert.equal(got[i][1], value, `${id}: ${label}'s value`);
      assert.ok(got[i][1].length > 0, `${id}: ${label} has a value`);
    });
  }
  // colours: bug, fix and document in their tags' colours, code plain
  assert.match(cells(factsOf(card(p, '0901')))[5][2], /\bbug\b/);
  assert.match(cells(factsOf(card(p, '0902')))[5][2], /\bfix\b/);
  assert.match(cells(factsOf(card(p, '0903')))[5][2], /\bdocument\b/);
  assert.equal(cells(factsOf(card(p, '0904')))[5][2], 'value');
  // the moving lights in Now while an agent is at work, not while it waits
  const lit = id => p.all(factsOf(card(p, id)).children[0]).some(n => n.className === 'lights');
  for (const id of ['0901', '0902', '0904', '0906']) assert.ok(lit(id), `${id}: lights`);
  for (const id of ['0903', '0905']) assert.ok(!lit(id), `${id}: no lights`);
});

const all = rules();
const val = (sel, prop) => all.filter(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();

test('0462 AC1: the table is three equal columns, with lines between the cells and round it, and its colours are the tags\'', () => {
  assert.equal(val('.q .facts', 'display'), 'grid');
  assert.equal(val('.q .facts', 'grid-template-columns'), 'repeat(3, minmax(0, 1fr))');
  for (const side of ['border-top', 'border-left']) assert.deepEqual(tokens(val('.q .facts', side)), ['--line'], `round it: ${side}`);
  for (const side of ['border-right', 'border-bottom']) assert.deepEqual(tokens(val('.q .facts .fact', side)), ['--line'], `between cells: ${side}`);
  for (const [k, t] of [['bug', '--bug'], ['fix', '--fix'], ['document', '--idea']]) {
    assert.deepEqual(tokens(val(`.q .facts .value.${k}`, 'color')), [t], k);
    assert.deepEqual(tokens(get(all.find(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(`.tag.${k}`)), 'color')), [t], `the ${k} tag`);
  }
});

test('0462 AC2: each value is one line cut short with …, and its whole text is its tooltip, which the clock keeps up', async () => {
  for (const sel of ['.q .facts .label', '.q .facts .value']) {
    assert.equal(val(sel, 'white-space'), 'nowrap', sel);
    assert.equal(val(sel, 'overflow'), 'hidden', sel);
    assert.equal(val(sel, 'text-overflow'), 'ellipsis', sel);
  }
  const p = page();
  await p.settle();
  await openQueueRows(p);
  for (const id of ['0901', '0902', '0903', '0904', '0905', '0906']) {
    for (const [label, value, , tip] of cells(factsOf(card(p, id)))) {
      if (label === 'Now') assert.ok(tip.length >= value.length, `${id}: Now's tooltip is the whole sentence`);
      else assert.equal(tip, value, `${id}: ${label}'s tooltip`);
    }
  }
  const time = () => cells(factsOf(card(p, '0901')))[2];
  assert.equal(time()[1], '01:05');
  // a second later, the counter's timer puts the Time cell and its tooltip right
  const tick = [...p.intervals.values()].find(i => i.ms === 1000);
  assert.ok(tick, 'the counter runs');
  clock = NOW + 1000;
  tick.fn();
  assert.equal(time()[1], '01:06', 'the Time cell moves on');
  assert.equal(time()[3], '01:06', 'and its tooltip with it');
});

test('0462 AC3: a closed ticket keeps its one line, a queued one its line, and the buttons and log stay under the table', async () => {
  const p = page();
  await p.settle();
  for (const t of TICKETS) {
    const c = card(p, t.id);
    assert.equal(factsOf(c), null, `${t.id}: closed, no table`);
    assert.ok(c.children[0].children.some(n => (t.status === 'ready' ? /^act\b/ : /^progress\b/).test(n.className)), `${t.id}: its line`);
  }
  await openQueueRows(p);
  const q = card(p, '0907');
  assert.equal(factsOf(q), null, 'queued: no table');
  assert.ok(q.children[0].children.some(n => /^act\b/.test(n.className)), 'queued: its line');
  for (const id of ['0901', '0903']) {
    const c = card(p, id), names = c.children.slice(1).map(n => (n.tagName === 'button' ? n.textContent : n.className));
    assert.ok(names.includes('Full ticket'), `${id}: Full ticket`);
    assert.equal(names[names.length - 1], 'log', `${id}: the log last`);
    if (id === '0903') assert.ok(names.includes('Review pack'), `${id}: Review pack`);
    assert.equal(c.children[0].children[c.children[0].children.length - 1], factsOf(c), `${id}: the table ends the top row, above them`);
  }
});

test('0462 AC4: a screen reader reads each cell as its label, then its value', async () => {
  const p = page();
  await p.settle();
  await openQueueRows(p);
  for (const id of ['0901', '0903']) {
    for (const c of factsOf(card(p, id)).children) {
      assert.equal(c.tagName, 'div', `${id}: a cell is a group in the list`);
      assert.deepEqual(c.children.map(n => n.tagName), ['dt', 'dd'], `${id}: its label is a term, its value its description`);
      for (const n of p.all(c.children[1])) assert.notEqual(n.attrs?.role, 'button', `${id}: no control inside a value`);
      const lights = p.all(c).find(n => n.className === 'lights');
      if (lights) assert.equal(lights.attrs['aria-hidden'], 'true', `${id}: the lights aren't read out as well as the word`);
    }
  }
});

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
const MEASURE = `(async () => {
  await document.fonts.ready;
  return [...document.querySelectorAll('#queue .q.open')].map(c => {
    const f = c.querySelector('.facts');
    if (!f) return { id: c.querySelector('.id').textContent, none: true };
    const box = f.getBoundingClientRect(), card = c.getBoundingClientRect();
    return { id: c.querySelector('.id').textContent, box: [box.left, box.right], card: [card.left, card.right], scroll: [f.scrollWidth, f.clientWidth],
      cells: [...f.children].map(n => { const b = n.getBoundingClientRect(), l = n.children[0], v = n.children[1], lb = l.getBoundingClientRect(), vb = v.getBoundingClientRect();
        return { label: l.textContent, value: v.textContent, tip: v.title, top: b.top, left: b.left, width: b.width, height: b.height,
          labelAt: [lb.top - b.top, lb.left - b.left], valueAt: [vb.top - b.top, vb.left - b.left], labelHeight: lb.height, valueHeight: vb.height,
          lineHeight: parseFloat(getComputedStyle(v).lineHeight), cut: v.scrollWidth > v.clientWidth + 0.5, ellipsis: getComputedStyle(v).textOverflow === 'ellipsis' }; }) };
  });
})()`;

test('0462 AC2: in a real browser at 320 and 390 px, the cells are even, each value on one line, a long one cut short with …', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const width of [320, 390]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: true });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
      await b.js(openLane('build'));
      await b.js(`[...document.querySelectorAll('#queue .q .top')].forEach(t => t.click()), true`);
      await b.until(`document.querySelectorAll('#queue .q.open').length === ${TICKETS.length}`, 'every card open');
      const cards = await b.js(MEASURE);
      for (const c of cards) {
        if (c.id === '0907') { assert.ok(c.none, `${width}: the queued ticket has no table`); continue; }
        assert.ok(!c.none, `${width} ${c.id}: a table`);
        assert.ok(c.box[0] >= c.card[0] && c.box[1] <= c.card[1], `${width} ${c.id}: inside its card`);
        assert.ok(c.scroll[0] <= c.scroll[1] + 0.5, `${width} ${c.id}: nothing past the table`);
        assert.equal(c.cells.length, 6, `${width} ${c.id}: six cells`);
        const [first] = c.cells;
        for (const [i, cell] of c.cells.entries()) {
          const rowFirst = c.cells[i < 3 ? 0 : 3];
          assert.ok(Math.abs(cell.top - rowFirst.top) < 0.5, `${width} ${c.id}: ${cell.label} is in its row`);
          assert.ok(Math.abs(cell.height - rowFirst.height) < 0.5, `${width} ${c.id}: ${cell.label} is as tall as its row`);
          assert.ok(Math.abs(cell.width - first.width) < 1, `${width} ${c.id}: ${cell.label} is as wide as the others`);
          assert.ok(Math.abs(cell.labelAt[0] - first.labelAt[0]) < 0.5 && Math.abs(cell.labelAt[1] - first.labelAt[1]) < 0.5, `${width} ${c.id}: ${cell.label}'s label in the same place`);
          assert.ok(Math.abs(cell.valueAt[0] - first.valueAt[0]) < 0.5 && Math.abs(cell.valueAt[1] - first.valueAt[1]) < 0.5, `${width} ${c.id}: ${cell.label}'s value in the same place`);
          assert.ok(cell.valueAt[0] >= cell.labelAt[0] + cell.labelHeight - 0.5, `${width} ${c.id}: ${cell.label}'s value under its label`);
          assert.ok(cell.valueHeight <= cell.lineHeight + 0.5, `${width} ${c.id}: ${cell.label}'s value is one line (${cell.valueHeight} px)`);
          assert.ok(cell.ellipsis, `${width} ${c.id}: ${cell.label} ends in … when it's too long`);
          if (cell.label !== 'Now') assert.equal(cell.tip, cell.value, `${width} ${c.id}: ${cell.label}'s tooltip`);
        }
        if (c.id === '0902') assert.ok(c.cells[1].cut && c.cells[1].tip === LONG, `${width}: the long model name is cut short, with all of it its tooltip`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
