import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, boardPage, fakePage, click, items, notes, top, panelRepo, freePort, startPanel, stop, browserPage } from './support/panel.mjs';

const note = (name, status, extra = '', captured = '2026-10-20') => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\nCaptured: ${captured} · Status: ${status}\n${extra}\n## What\nThe whole text of ${name}.\n` });
const board = (tickets, ideas = []) => ({ tickets, ideas });
const show = async (b, globals) => { const p = boardPage([b], globals); await p.settle(); return p; };
const posting = async b => { const p = fakePage([b]); await p.settle(); return p; }; // keeps what the page sends, in p.calls
const byClass = (p, n, re) => p.all(n).find(c => re.test(c.className));
const star = (p, n) => byClass(p, n, /^star\b/);
const setReady = (p, n) => byClass(p, n, /^set-ready\b/);
const details = (p, n) => byClass(p, n, /^checks\b/);
const posts = p => p.calls.filter(c => c.opts && c.opts.method === 'POST').map(c => String(c.url));
const clean = s => s.replace(/\s+/g, ' ').trim();
const year = new Date().getFullYear();

test('0586 AC1: a note is one row: its title, then that it is an idea and when', async () => {
  const p = await show(board([], [note('plain', 'idea', '', `${year}-10-20`)]));
  const [row] = notes(p);
  assert.match(row.className, /\brow\b/);
  assert.equal(byClass(p, row, /^title\b/).textContent, 'plain');
  assert.equal(clean(details(p, row).textContent), 'Idea · 20 Oct');
});

test('0586 AC1: a follow-up says which ticket it came from and when', async () => {
  const p = await show(board([], [note('later', 'inbox', 'From ticket: 0585\n', `${year}-10-21`)]));
  assert.match(clean(details(p, notes(p)[0]).textContent), /^From 0585 · 21 Oct/);
});

test('0586 AC1: an inbox note from no ticket counts as an idea, and a note with no date says so', async () => {
  const p = await show(board([], [note('mine', 'inbox', '', `${year}-10-21`), { path: 'speck/ideas/undated.md', title: 'undated', status: 'idea', body: '# undated\n' }]));
  const lines = notes(p).map(n => clean(details(p, n).textContent));
  assert.ok(lines.includes('Idea · 21 Oct'), lines.join(' | '));
  assert.ok(lines.includes('Idea · no capture date'), lines.join(' | '));
});

test('0586 AC1: the row\'s star still marks the note, without opening it', async () => {
  const p = await posting(board([], [note('plain', 'idea')]));
  const row = notes(p)[0];
  assert.equal(star(p, row).parentNode, top(row), 'on the row itself');
  click(star(p, row));
  await p.settle();
  assert.ok(posts(p).some(u => /\/api\/ideas\/plain\.md\/star$/.test(u)));
  assert.doesNotMatch(notes(p)[0].className, /\bopen\b/);
});

test('0586 AC1: pressing the row opens the note\'s whole text', async () => {
  const p = await show(board([], [note('plain', 'idea')]));
  click(top(notes(p)[0]));
  await p.settle();
  assert.match(notes(p)[0].className, /\bopen\b/);
  assert.match(notes(p)[0].textContent, /The whole text of plain\./);
});

test('0586 AC2: a draft is one row: its id, title and a line with its priority, size and risk', async () => {
  const p = await show(board([T('0701', 'draft', { title: 'Show it', priority: 3, size: 'M', risk: 'high' })]));
  const [row] = items(p);
  assert.match(row.className, /\brow\b/);
  assert.equal(byClass(p, row, /^id\b/).textContent, '0701');
  assert.equal(byClass(p, row, /^title\b/).textContent, 'Show it');
  assert.equal(clean(details(p, row).textContent), 'P3 · M · high');
});

test('0586 AC2: Set ready is on the closed row, and sets the ticket ready without opening it', async () => {
  const p = await posting(board([T('0701', 'draft', { lint: { errors: 0, warnings: 0 } })]));
  const row = items(p)[0];
  assert.doesNotMatch(row.className, /\bopen\b/);
  assert.equal(setReady(p, row).parentNode, top(row), 'on the row itself');
  click(setReady(p, row));
  await p.settle();
  assert.ok(posts(p).some(u => /\/api\/tickets\/0701\/ready$/.test(u)));
  assert.doesNotMatch(items(p)[0].className, /\bopen\b/);
});

test('0586 AC2: a draft that fails the ready check can\'t be set ready from its row, and says why on hover', async () => {
  const p = await show(board([T('0701', 'draft', { lint: { errors: 2, warnings: 0 } })]));
  const b = setReady(p, items(p)[0]);
  assert.equal(b.disabled, true);
  assert.match(b.title, /Fix the ready check errors first/);
});

test('0586 AC2: an open row has one Set ready, and a refusal shows on the row, open or closed', async () => {
  const p = fakePage([board([T('0701', 'draft', { lint: { errors: 0, warnings: 0 } })]), { status: 409, body: { error: 'No, not that one.' } }]);
  await p.settle();
  const count = (re) => p.all(items(p)[0]).filter(n => re.test(n.className)).length;
  click(setReady(p, items(p)[0]));
  await p.settle();
  assert.doesNotMatch(items(p)[0].className, /\bopen\b/);
  assert.equal(byClass(p, items(p)[0], /\brefused\b/).textContent, 'No, not that one.');
  click(top(items(p)[0]));
  await p.settle();
  assert.equal(count(/^set-ready\b/), 1, 'open, still one');
  assert.equal(count(/\brefused\b/), 1, 'and one refusal');
});

test('0586 AC2: the priority on the row opens the menu and sets it', async () => {
  const p = await posting(board([T('0701', 'draft', { priority: 3 })]));
  const tag = byClass(p, details(p, items(p)[0]), /\bpick\b/);
  assert.equal(tag.textContent, 'P3');
  click(tag);
  await p.settle();
  const menu = byClass(p, items(p)[0], /^prio-menu\b/);
  assert.deepEqual(menu.children.map(b => b.textContent), ['P1', 'P2', 'P3', 'P4', 'P5']);
  click(menu.children[0]);
  await p.settle();
  assert.ok(p.calls.some(c => /\/api\/tickets\/0701\/priority/.test(String(c.url))));
});

const face = (p, box) => p.all(box).find(n => n.tagName === 'svg' && n.attrs?.['data-mood']);

test('0586 AC3: an empty Plan shows speck asleep and one line saying what lands there', async () => {
  const p = await show(board([]));
  const [empty] = p.byId('shaping').children;
  assert.equal(face(p, empty).attrs['data-mood'], 'asleep');
  assert.equal(clean(byClass(p, empty, /^asleep-line\b/).textContent), 'Nothing to plan · Draft tickets wait here for you to set them ready.');
});

test('0586 AC3: an empty Capture shows speck asleep and one line saying what lands there', async () => {
  const p = await show(board([]));
  const [empty] = p.byId('capture').children;
  assert.equal(face(p, empty).attrs['data-mood'], 'asleep');
  assert.equal(clean(byClass(p, empty, /^asleep-line\b/).textContent), 'Nothing captured · Ideas you capture in chat land here.');
});

test('0586 AC3: an empty lane is left in place when the board changes, so its face keeps breathing', async () => {
  const p = await show(board([]));
  const first = p.byId('shaping').children[0];
  p.timers.shift()();
  await p.settle();
  assert.equal(p.byId('shaping').children[0], first);
  assert.ok(!first.detached, 'never taken off the page');
});

test('0586 AC3: a lane with something in it has no sleeping speck', async () => {
  const p = await show(board([T('0701', 'draft')], [note('plain', 'idea')]));
  for (const box of ['shaping', 'capture']) assert.equal(face(p, p.byId(box)), undefined);
});

test('0586 AC4: at 320 px wide each row is at least 44 px tall, long titles wrap, and an empty lane shows the real face', async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const LONG = 'A title long enough that it never fits on one line of a narrow phone at all, however it is set out';
  const LONG_NOTE = { ...note('long', 'idea'), title: LONG };
  const states = [board([T('0701', 'draft', { title: 'Short' }), T('0702', 'draft', { title: LONG })], [note('short', 'idea'), LONG_NOTE, note('raised', 'inbox', 'From ticket: 0585\nRaised by: agent\n')]), board([])];
  const stub = `(() => { const real = window.fetch.bind(window); const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(window.__state) : real(url, opts); const states = ${JSON.stringify(states)}; window.__state = states[sessionStorage.getItem('emptied') ? 1 : 0]; })();`;
  const measure = (box, tab, section) => `(() => { document.getElementById('${tab}').click(); return !document.getElementById('${section}').hidden ? [...document.querySelectorAll('#${box} .item')].map(c => { const t = c.querySelector('.title'), s = getComputedStyle(t), r = c.getBoundingClientRect();
    const control = c.querySelector('.head > .star, .head > .set-ready').getBoundingClientRect(), agent = c.querySelector('.head .agent');
    return { title: t.textContent, gapRight: r.right - control.right, agentGap: agent ? agent.getBoundingClientRect().left - agent.previousElementSibling.getBoundingClientRect().right : null, top: c.firstElementChild.getBoundingClientRect().height, right: r.right, nowrap: s.whiteSpace, overflow: t.scrollWidth > t.clientWidth + 0.5, titleHeight: t.getBoundingClientRect().height, line: parseFloat(s.lineHeight) }; }) : null; })()`;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shaping .item').length === 2 && document.querySelectorAll('#capture .item').length === 3`, 'the rows');
    for (const [box, tab, section] of [['shaping', 'tab-plan', 'shaping-section'], ['capture', 'tab-capture', 'capture-section']]) {
      await b.until(`(${measure(box, tab, section)}) !== null`, box);
      const rows = await b.js(measure(box, tab, section));
      assert.ok(rows.length >= 2, `${box}: its rows`);
      for (const row of rows) {
        assert.ok(row.top >= 44, `${box}: "${row.title}" is ${row.top} px tall`);
        assert.ok(row.gapRight <= 14.5, `${box}: "${row.title}"'s control is ${row.gapRight} px from the row's right edge`);
        if (row.agentGap !== null) assert.ok(row.agentGap >= 6, `${box}: only ${row.agentGap} px before its agent tag`);
      }
      const long = rows.find(x => x.title === LONG);
      assert.notEqual(long.nowrap, 'nowrap');
      assert.equal(long.overflow, false, 'its text fits its box');
      assert.ok(long.titleHeight > long.line * 1.5, `${box}: it wraps (${long.titleHeight} px at ${long.line} px a line)`);
      assert.ok(long.right <= 320.5, `${box}: it stays on the screen`);
    }
    // open, a note's star keeps its own column, and a long title never runs behind it
    await b.js(`document.getElementById('tab-capture').click(), [...document.querySelectorAll('#capture .item .head')].find(h => h.querySelector('.title').textContent === ${JSON.stringify(LONG)}).click(), true`);
    await b.until(`!!document.querySelector('#capture .item.open')`, 'the open note');
    const open = await b.js(`(() => { const c = document.querySelector('#capture .item.open'), range = document.createRange(); range.selectNodeContents(c.querySelector('.title'));
      return { titleRight: Math.max(...[...range.getClientRects()].map(r => r.right)), starLeft: c.querySelector('.star').getBoundingClientRect().left }; })()`);
    assert.ok(open.titleRight <= open.starLeft + 0.5, `the open title ends at ${open.titleRight}, past the star at ${open.starLeft}`);
    await b.js(`sessionStorage.setItem('emptied', '1'); 1`);
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.querySelector('#shaping .asleep svg[data-mood="asleep"]') && document.querySelector('#capture .asleep svg[data-mood="asleep"]')`, 'speck asleep in the empty lanes', 15000);
  } finally { await b.close(); await stop(panel); }
});
