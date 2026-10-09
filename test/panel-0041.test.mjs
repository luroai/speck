import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fm, fakePage, full, click, items, top, toggles, queueRows, page, panelModel, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0041: tickets that start a dependency chain, and tickets waiting on others ----------

const refresh = async p => { p.timers.shift()(); await p.settle(); };
const nodes = (p, row, cls) => p.all(row).filter(n => new RegExp(`\\b${cls}\\b`).test(n.className || ''));
const shaping = (p, id) => items(p).find(n => p.all(n).some(x => x.className === 'id' && x._text === id));
const queued = (p, id) => queueRows(p).find(n => p.all(n).some(x => x.className === 'id' && x._text === id));
const idRow = (p, row) => p.all(row).find(n => n.className === 'row'); // the row with the id, the title and the tags
const iconOf = (p, row) => { const r = idRow(p, row); return r.children[1] && /\b(chain|lock)\b/.test(r.children[1].className) ? r.children[1] : null; };
const css = () => page().match(/<style>([\s\S]*?)<\/style>/)[1];
const rule = sel => (css().match(new RegExp(`(^|\\n)\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[2] || '';

// 0001 (draft) starts a chain that 0002 (ready) and 0003 (draft) wait on; a done and a cancelled ticket also list it.
// 0006 (ready) starts one that 0007 (ready) waits on. 0008 is in flight, with 0009 waiting on it.
const chained = () => ({
  tickets: [
    full('0001'),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    full('0003', { after: ['0001', '0099'], waiting_on: ['0001', '0099'] }),
    T('0004', 'done', { after: ['0001'], finished: new Date().toISOString() }),
    T('0005', 'cancelled', { after: ['0001'] }),
    T('0006', 'ready', { after: [] }),
    T('0007', 'ready', { after: ['0006'], waiting_on: ['0006'] }),
    T('0008', 'building', { after: [] }),
    full('0009', { after: ['0008'], waiting_on: ['0008'] }),
    full('0010'),
  ],
  ideas: [],
});

test('0041 AC1: a ticket that starts a chain shows a chain icon after its id and "unlocks <ids>" under its title, in Shaping and in the queue', async () => {
  const p = fakePage([chained()]);
  await p.settle();
  const s = shaping(p, '0001');
  const icon = iconOf(p, s);
  assert.ok(icon && /\bchain\b/.test(icon.className), 'Shaping: a chain icon right after the id');
  assert.ok(nodes(p, s, 'checks')[0].textContent.includes('unlocks 0002, 0003'), 'Shaping: unlocks the unfinished tickets that list it, in JSON order');
  assert.ok(!nodes(p, s, 'checks')[0].textContent.includes('0004'), 'a done ticket waiting on it does not count');
  assert.ok(!nodes(p, s, 'checks')[0].textContent.includes('0005'), 'a cancelled one does not count either');
  const q = queued(p, '0006');
  assert.ok(/\bchain\b/.test(iconOf(p, q).className), 'queue: a ready ticket that starts a chain has the icon');
  assert.ok(nodes(p, q, 'act')[0].textContent.includes('unlocks 0007'), 'queue: unlocks under its title');
  assert.match(rule('.chain'), /var\(--accent\)/, 'the chain icon is in the accent colour');
});

test('0041 AC1: only tickets with nothing to wait on and an unfinished ticket waiting on them start a chain', () => {
  const m = panelModel()(chained());
  const draft = id => m.drafts.find(t => t.id === id), q = id => m.queue.find(t => t.id === id);
  assert.equal(draft('0001').chain, true);
  assert.equal(q('0006').chain, true);
  assert.equal(draft('0010').chain, false, 'nothing waits on it');
  assert.equal(draft('0003').chain, false, 'waiting itself');
  // Only done and cancelled tickets waiting on it: no chain.
  const lone = panelModel()({ tickets: [full('0001'), T('0002', 'done', { after: ['0001'] }), T('0003', 'cancelled', { after: ['0001'] })] });
  assert.equal(lone.drafts[0].chain, false);
  assert.deepEqual(lone.drafts[0].unlocks, []);
});

test('0041 AC2: a waiting ticket shows a dimmed padlock after its id, with "waiting on <ids>" under its title in Shaping and in the queue', async () => {
  const p = fakePage([chained()]);
  await p.settle();
  const s = shaping(p, '0003');
  assert.ok(/\block\b/.test(iconOf(p, s).className), 'Shaping: a padlock right after the id');
  assert.ok(nodes(p, s, 'checks')[0].textContent.includes('waiting on 0001, 0099'), 'Shaping: waiting on its ids');
  const q = queued(p, '0007');
  assert.ok(/\block\b/.test(iconOf(p, q).className), 'queue: a padlock right after the id');
  assert.equal(nodes(p, q, 'act')[0].textContent, 'Queued · waiting on 0006', 'queue: the text it already shows');
  assert.ok(/\block\b/.test(iconOf(p, shaping(p, '0009')).className), 'waiting on an in-flight ticket');
  assert.match(rule('.lock'), /color:\s*var\(--faint\)/, 'the padlock is dimmed');
});

test('0041 AC3: a ticket with neither shows no icon, and each icon says what it means when hovered', async () => {
  const p = fakePage([chained()]);
  await p.settle();
  assert.equal(iconOf(p, shaping(p, '0010')), null, 'nothing waits on it and it waits on nothing');
  assert.equal(nodes(p, shaping(p, '0010'), 'chain').length + nodes(p, shaping(p, '0010'), 'lock').length, 0);
  assert.equal(iconOf(p, queued(p, '0008')), null, 'in-flight tickets show no icon');
  assert.ok(!nodes(p, shaping(p, '0010'), 'checks')[0].textContent.includes('unlocks'));
  assert.ok(!nodes(p, shaping(p, '0010'), 'checks')[0].textContent.includes('waiting on'));
  assert.equal(iconOf(p, shaping(p, '0001')).title, 'Starts a chain: unlocks 0002, 0003');
  assert.equal(iconOf(p, queued(p, '0006')).title, 'Starts a chain: unlocks 0007');
  assert.equal(iconOf(p, shaping(p, '0003')).title, 'Waiting on 0001, 0099');
  assert.equal(iconOf(p, queued(p, '0007')).title, 'Waiting on 0006');
});

test('0041 AC4: when the chain\'s first ticket is done, the next refresh takes the padlock off what waited only on it and moves the chain on', async () => {
  // 0001 → 0002 → 0003: 0002 waits on 0001, and 0003 on 0002.
  const before = { tickets: [T('0001', 'ready'), T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }), full('0003', { after: ['0002'], waiting_on: ['0002'] })], ideas: [] };
  const after = { tickets: [T('0001', 'done', { finished: new Date().toISOString() }), T('0002', 'ready', { after: ['0001'], waiting_on: [] }),
    full('0003', { after: ['0002'], waiting_on: ['0002'] })], ideas: [] };
  const p = fakePage([before, after]);
  await p.settle();
  assert.ok(/\bchain\b/.test(iconOf(p, queued(p, '0001')).className));
  assert.ok(/\block\b/.test(iconOf(p, queued(p, '0002')).className));
  await refresh(p);
  assert.equal(queued(p, '0001'), undefined, 'the done ticket has left the queue');
  const q = queued(p, '0002');
  assert.ok(/\bchain\b/.test(iconOf(p, q).className), 'it starts the chain now');
  assert.equal(iconOf(p, q).title, 'Starts a chain: unlocks 0003');
  assert.equal(nodes(p, q, 'act')[0].textContent, 'Queued · unlocks 0003');
  assert.equal(nodes(p, q, 'lock').length, 0, 'no padlock');
  assert.ok(/\block\b/.test(iconOf(p, shaping(p, '0003')).className), 'the next one still waits');

  // Waiting on nothing else and with nothing waiting on it in turn: no icon at all.
  const solo = fakePage([{ tickets: [T('0001', 'ready'), T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] })] },
    { tickets: [T('0001', 'done'), T('0002', 'ready', { after: ['0001'], waiting_on: [] })] }]);
  await solo.settle();
  await refresh(solo);
  assert.equal(iconOf(solo, queued(solo, '0002')), null);
});

// 0001 ← 0002 ← 0003 and 0001 ← 0004 make one group; 0005 ← 0006 another; 0010 stands alone.
const groups = () => ({
  tickets: [
    full('0001'),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    full('0003', { after: ['0002'], waiting_on: ['0002'] }),
    T('0004', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    T('0005', 'ready'),
    full('0006', { after: ['0005'], waiting_on: ['0005'] }),
    full('0010'),
  ],
  ideas: [],
});
const lit = n => /\bhl\b/.test(n.className);
const dim = n => /\bdim\b/.test(n.className);
const look = p => Object.fromEntries([...items(p), ...queueRows(p)].map(n => [p.all(n).find(x => x.className === 'id')._text, lit(n) ? 'hl' : dim(n) ? 'dim' : '']));

test('0041 AC5: hovering a ticket highlights every ticket linked to it through after:, in either direction and through others, in both places, and dims the rest', async () => {
  const p = fakePage([groups(), groups()]);
  await p.settle();
  queued(p, '0004').listeners.mouseenter();
  assert.deepEqual(look(p), { '0001': 'hl', '0003': 'hl', '0006': 'dim', '0010': 'dim', '0002': 'hl', '0004': 'hl', '0005': 'dim' },
    '0004 → 0001 → 0002 → 0003, across Shaping and the queue');
  queued(p, '0004').listeners.mouseleave();
  assert.ok(Object.values(look(p)).every(v => v === ''), 'moving away undoes it');
  shaping(p, '0006').listeners.mouseenter();
  assert.deepEqual(look(p), { '0001': 'dim', '0003': 'dim', '0006': 'hl', '0010': 'dim', '0002': 'dim', '0004': 'dim', '0005': 'hl' });
  shaping(p, '0010').listeners.mouseenter();
  assert.deepEqual(Object.entries(look(p)).filter(([, v]) => v === 'hl').map(([k]) => k), ['0010'], 'a ticket with no links lights only itself');
  assert.match(rule('.item.dim, .q.dim'), /opacity/);
});

test('0041 AC5: the highlight lasts through a refresh, keeps the Shaping item on the page and ends when the pointer leaves', async () => {
  const p = fakePage([groups(), groups(), groups()]);
  await p.settle();
  const item = shaping(p, '0003');
  item.listeners.mouseenter();
  const detached = item.detached || 0;
  await refresh(p);
  assert.equal(shaping(p, '0003'), item, 'the same node, so a selection in it survives (0040)');
  assert.equal(item.detached || 0, detached);
  assert.equal(look(p)['0004'], 'hl');
  assert.equal(look(p)['0005'], 'dim');
  item.listeners.mouseleave();
  await refresh(p);
  assert.ok(Object.values(look(p)).every(v => v === ''));
});

test('0041: odd links: built-in names as ids, a ticket after itself, repeated and missing after: lists', () => {
  const m = panelModel()({ tickets: [
    full('__proto__'), full('constructor', { after: ['__proto__'], waiting_on: ['__proto__'] }),
    full('0001', { after: ['0001'], waiting_on: ['0001'] }),
    full('0002', { after: null, waiting_on: null }), full('0003', { after: ['0002', '0002'], waiting_on: [] }),
    T('0004', 'ready', { after: ['0002'], waiting_on: [] }),
  ] });
  const d = id => m.drafts.find(t => t.id === id);
  assert.deepEqual(d('__proto__').unlocks, ['constructor']);
  assert.equal(d('__proto__').chain, true);
  assert.deepEqual(d('constructor').unlocks, []);
  assert.deepEqual(d('0001').unlocks, [], 'a ticket after itself does not unlock itself');
  assert.deepEqual(d('0002').unlocks, ['0003', '0004'], 'each once, in JSON order');
  assert.deepEqual(d('0002').waiting_on, []);
  assert.deepEqual([...d('0003').linked].sort(), ['0002', '0003', '0004']);
  assert.deepEqual(d('0001').linked, ['0001']);
  assert.deepEqual([...d('constructor').linked].sort(), ['__proto__', 'constructor']);
});

test('0041 AC5: a hovered ticket that leaves the page, such as when Shaping shows ideas, stops dimming the rest', async () => {
  const p = fakePage([groups()]);
  await p.settle();
  shaping(p, '0003').listeners.mouseenter();
  assert.equal(look(p)['0005'], 'dim');
  click(toggles(p)[1]);
  assert.ok(queueRows(p).every(n => !lit(n) && !dim(n)), 'the queue is back to normal');
  click(toggles(p)[0]);
  assert.ok(Object.values(look(p)).every(v => v === ''));
});

test('0041 AC1, AC2 and AC5: in a real browser, the icons show and hovering lights up the chain until the pointer leaves', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo(); // 0001 is ready
  r.write('0002-next.md', fm({ id: '"0002"', title: 'Next in the chain', after: '["0001"]' }));
  r.write('0003-alone.md', fm({ id: '"0003"', title: 'On its own' }));
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const cls = sel => b.js(`document.querySelector(${JSON.stringify(sel)}).className`);
  const centre = sel => b.js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  try {
    await b.until(`document.querySelectorAll('#shaping .item').length === 2 && !!document.querySelector('#queue .q')`, 'the tickets');
    assert.equal(await b.js(`document.querySelector('#queue .q .chain').title`), 'Starts a chain: unlocks 0002');
    assert.equal(await b.js(`getComputedStyle(document.querySelector('#queue .q .chain')).color`), 'rgb(122, 167, 240)', 'the accent colour');
    assert.ok(await b.js(`document.querySelector('#queue .q .chain').getBoundingClientRect().width > 0`), 'the icon takes up room');
    assert.equal(await b.js(`document.querySelector('#shaping .item .lock').title`), 'Waiting on 0001');
    assert.ok(await b.js(`[...document.querySelectorAll('#shaping .item')][0].textContent.includes('waiting on 0001')`));
    await b.move(await centre('#shaping .item .title'));
    await b.until(`document.querySelector('#queue .q').classList.contains('hl')`, 'the chain to light up');
    assert.match(await cls('#shaping .item:nth-child(2)'), /\bdim\b/, 'the unlinked ticket dims');
    assert.match(await cls('#shaping .item:nth-child(1)'), /\bhl\b/);
    await new Promise(res => setTimeout(res, 2500)); // through a refresh
    assert.match(await cls('#queue .q'), /\bhl\b/);
    await b.move(await centre('header .logo'));
    await b.until(`!document.querySelector('.hl, .dim')`, 'the highlight to end');
  } finally {
    await b.close();
    await stop(panel);
  }
});

test('0041 AC5: links are not followed through a done or cancelled ticket', () => {
  const m = panelModel()({ tickets: [T('0001', 'done'), T('0009', 'cancelled'), full('0002', { after: ['0001', '0009'] }), full('0003', { after: ['0001', '0009'] })] });
  assert.deepEqual(m.drafts.map(t => t.linked), [['0002'], ['0003']]);
});
