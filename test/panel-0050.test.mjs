import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fm, good, panelRepo, freePort, startPanel, stop, fakePage, full, round, exitOf, queueRows, stepText, shippedRows, startOfToday, findChrome, browserPage, charAt } from './support/panel.mjs';

// ---------- 0050: selected text and scroll in queue and Shipped rows survive the refresh ----------

// A browser drops a selection, and resets a box's scroll, when a node holding it is taken out of the page. The fake page
// counts each node's removals in `detached`, so `node` keeps its selection while neither it nor any node above it, up
// to the box, has been taken out since `held` was called.
const held = (p, box, node) => {
  const chain = [];
  for (let at = node; at; at = at.parentNode) { chain.push([at, at.detached || 0]); if (at === p.byId(box)) break; }
  assert.equal(chain[chain.length - 1][0], p.byId(box), `the node is in #${box}`);
  return () => chain.every(([n, d], i) => (n.detached || 0) === d && (i === chain.length - 1 || n.parentNode === chain[i + 1][0]));
};
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const shipOf = (p, id) => shippedRows(p).find(r => r.textContent.includes(id));
const byClass = (p, row, cls) => p.all(row).find(n => new RegExp(`(^| )${cls}( |$)`).test(n.className || ''));
const ago = min => new Date(Date.now() - min * 60000).toISOString();

const base = () => ({
  tickets: [
    full('0001'),
    T('0002', 'blocked', { blocked_question: 'Which way should it go?', started: ago(9) }),
    T('0003', 'building', { started: ago(5), ...exitOf(Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n')) }),
    T('0004', 'reviewing', { started: ago(3), rounds: [round(1, 100)] }),
    T('0005', 'ready', { after: [] }),
    T('0006', 'ready', { after: ['0005'], waiting_on: ['0005'] }),
    T('0010', 'done', { started: ago(30), finished: ago(20), rounds: [round(1, 500)] }),
    T('0011', 'done', { started: ago(40), finished: ago(25), title: 'Older shipped' }),
  ],
  ideas: [],
});

test('0050 AC1: a selection in a queue row\'s title, blocked question or build message survives a refresh in which that ticket is unchanged, and other changes show', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[3].rounds = [round(1, 100), round(2, 200)]; // another queue ticket's review round
  next.tickets.splice(4, 0, T('0007', 'ready', { title: 'A new ready ticket' })); // a new row before the ready ones
  next.tickets.push(T('0012', 'done', { title: 'Newly shipped', finished: new Date().toISOString() }));
  const third = clone(next);
  third.tickets.push(T('0008', 'ready', { title: 'Third new' }));
  third.tickets[1].title = 'A renamed blocked ticket'; // 0002 changes, the others don't
  const p = fakePage([s, next, third]);
  await p.settle();
  const keptTitle = held(p, 'queue', byClass(p, rowOf(p, '0005'), 'title'));
  const keptQuestion = held(p, 'queue', p.all(rowOf(p, '0002')).find(n => n._text === 'Which way should it go?'));
  const keptMessage = held(p, 'queue', byClass(p, rowOf(p, '0003'), 'exit'));
  await refresh(p);
  assert.ok(keptTitle(), 'the ready row\'s title stayed on the page');
  assert.ok(keptQuestion(), 'the blocked question stayed on the page');
  assert.ok(keptMessage(), 'the build message stayed on the page');
  assert.ok(stepText(rowOf(p, '0004')).includes('Review 2'), 'the other ticket\'s new round shows');
  assert.ok(rowOf(p, '0007'), 'the new ready ticket shows');
  assert.ok(shipOf(p, 'Newly shipped'), 'the new shipped ticket shows');
  await refresh(p);
  assert.ok(keptTitle() && keptMessage(), 'and through a second refresh');
  assert.ok(rowOf(p, '0008'), 'the newer ready ticket shows');
  assert.ok(rowOf(p, '0002').textContent.includes('A renamed blocked ticket'));
});

test('0050 AC1: a chain change that comes only from another ticket shows on a kept row', async () => {
  const s = base();
  const next = clone(s);
  next.tickets.push(T('0009', 'ready', { after: ['0006'], waiting_on: ['0006'] })); // 0006 now unlocks 0009
  const third = clone(next);
  third.tickets.pop(); // and again it unlocks nothing
  const p = fakePage([s, next, third]);
  await p.settle();
  const row = rowOf(p, '0006');
  const kept = held(p, 'queue', byClass(p, row, 'title'));
  assert.ok(byClass(p, row, 'lock'), 'it waits on 0005');
  assert.match(row.textContent, /waiting on 0005/);
  await refresh(p);
  assert.ok(kept(), 'the row stayed');
  assert.ok(byClass(p, rowOf(p, '0006'), 'lock'), 'still waiting, so still a padlock');
  await refresh(p);
  assert.ok(kept());
  const s2 = { tickets: [T('0005', 'ready'), T('0006', 'ready')], ideas: [] };
  const n3 = clone(s2); n3.tickets.push(T('0007', 'ready', { after: ['0005'], waiting_on: ['0005'] })); // 0005 starts a chain, from another ticket
  const q = fakePage([s2, clone(s2), n3]);
  await q.settle();
  const keptFive = held(q, 'queue', byClass(q, rowOf(q, '0005'), 'title'));
  assert.ok(!byClass(q, rowOf(q, '0005'), 'chain'));
  await refresh(q);
  await refresh(q);
  assert.ok(keptFive(), '0005 kept its node');
  assert.ok(byClass(q, rowOf(q, '0005'), 'chain'), 'the chain icon shows');
  assert.match(rowOf(q, '0005').textContent, /unlocks 0007/, 'and the unlocks text');
});

test('0050 AC2: a build message box keeps its node, and so its scroll position, through refreshes in which its ticket is unchanged', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[1].blocked_question = 'Another question.'; // another ticket changes
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  const box = byClass(p, rowOf(p, '0003'), 'exit');
  const kept = held(p, 'queue', box);
  await refresh(p);
  await refresh(p);
  assert.ok(kept(), 'the scrolling box stayed on the page');
  assert.equal(byClass(p, rowOf(p, '0003'), 'exit'), box);
});

test('0050 AC3: a selection in a Shipped row survives a refresh in which that ticket is unchanged and Shipped has the same tickets', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[6].title = 'Renamed shipped'; // 0010 changes
  next.tickets[3].rounds = [round(1, 1), round(2, 2)];
  next.tickets.push(T('0013', 'draft'));
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  const td = shipOf(p, '0011').children[0];
  const kept = held(p, 'shipped', td);
  await refresh(p);
  assert.ok(kept(), 'the row stayed on the page');
  assert.ok(shipOf(p, 'Renamed shipped'), 'the other shipped ticket\'s change shows');
  await refresh(p);
  assert.ok(kept(), 'and through a second refresh');
});

test('0050 AC4: the in-flight time since started (MM:SS since 0058) and a Shipped time crossing midnight keep updating while text in that row is selected', async () => {
  let now = startOfToday() + 23 * 3600000 + 58 * 60000; // 23:58 today
  class FakeDate extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const iso = ms => new Date(ms).toISOString();
  const s = { tickets: [T('0003', 'building', { started: iso(now - 5 * 60000) }), T('0010', 'done', { started: iso(now - 20 * 60000), finished: iso(now - 10 * 60000) })], ideas: [] };
  const p = fakePage([s, clone(s), clone(s)], { Date: FakeDate });
  await p.settle();
  const keptRow = held(p, 'queue', byClass(p, rowOf(p, '0003'), 'title'));
  const keptShip = held(p, 'shipped', shipOf(p, '0010').children[0]);
  const minutes = () => rowOf(p, '0003').textContent.match(/(\d\d):00/)[1];
  const when = () => shipOf(p, '0010').children[2].textContent;
  assert.equal(minutes(), '05');
  assert.equal(when(), '23:48');
  now += 3 * 60000; // 00:01 tomorrow
  await refresh(p);
  assert.ok(keptRow() && keptShip(), 'both selections stayed');
  assert.equal(minutes(), '08', 'the minutes moved on');
  assert.match(when(), /^\d+ \w{3} 23:48$/, 'the time became date and time');
  now += 60000;
  await refresh(p);
  assert.ok(keptRow() && keptShip());
  assert.equal(minutes(), '09');
});

test('0050 AC5: when a row\'s own ticket data changes, the new content shows in that refresh', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[1].blocked_question = 'A new question.';
  next.tickets[2].build_exit.message = 'A new last message.';
  next.tickets[4].title = 'Renamed ready';
  next.tickets[7].rounds = [round(1, 7), round(2, 8)];
  const third = clone(next);
  third.tickets[2].status = 'blocked'; third.tickets[2].blocked_question = 'Stopped and blocked.';
  const p = fakePage([s, next, third]);
  await p.settle();
  await refresh(p);
  assert.ok(rowOf(p, '0002').textContent.includes('A new question.'));
  assert.ok(!rowOf(p, '0002').textContent.includes('Which way'));
  assert.equal(byClass(p, rowOf(p, '0003'), 'exit').textContent, 'A new last message.');
  assert.ok(rowOf(p, '0005').textContent.includes('Renamed ready'));
  assert.match(shipOf(p, '0011').textContent, /2 rounds · 15 reviewer tokens/);
  await refresh(p);
  assert.ok(rowOf(p, '0003').textContent.includes('Stopped and blocked.'));
  assert.ok(!byClass(p, rowOf(p, '0003'), 'exit'), 'a blocked ticket shows its question, not the build message');
});

const reorder = v => (Array.isArray(v) ? v.map(reorder) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map(k => [k, reorder(v[k])])) : v);
test('0050 AC1 and AC3: the same field values in another order count as unchanged', async () => {
  const s = base();
  const p = fakePage([s, reorder(s), clone(s)]);
  await p.settle();
  const keptRow = held(p, 'queue', byClass(p, rowOf(p, '0003'), 'exit'));
  const keptShip = held(p, 'shipped', shipOf(p, '0010').children[0]);
  await refresh(p);
  await refresh(p);
  assert.ok(keptRow() && keptShip());
});

test('0050 self-check: queue and Shipped rows sharing an id, or named like built-ins, all still show and refresh', async () => {
  const s = { tickets: [T('__proto__', 'ready'), T('0001', 'ready', { title: 'First copy' }), T('0001', 'ready', { title: 'Second copy' }), T('constructor', 'building', { started: ago(1) }),
    T('0002', 'done', { title: 'Done one', finished: ago(5) }), T('0002', 'done', { title: 'Done two', finished: ago(4) }), T('hasOwnProperty', 'done', { finished: ago(3) })], ideas: [] };
  const next = clone(s);
  next.tickets[2].title = 'Second copy, renamed';
  next.tickets[4].title = 'Done one, renamed';
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  const titles = () => queueRows(p).map(r => byClass(p, r, 'title').textContent);
  assert.deepEqual(titles(), ['Ticket constructor', 'Ticket __proto__', 'First copy', 'Second copy']);
  assert.equal(shippedRows(p).length, 3);
  await refresh(p);
  assert.deepEqual(titles(), ['Ticket constructor', 'Ticket __proto__', 'First copy', 'Second copy, renamed']);
  assert.ok(shippedRows(p).some(r => r.textContent.includes('Done one, renamed')));
  await refresh(p);
  assert.equal(queueRows(p).length, 4);
  assert.equal(shippedRows(p).length, 3);
});

test('0050 AC1-AC5: in a real browser, selections and the build message scroll stay through refreshes until the row\'s own data changes', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const write = (id, o, body = good, where) => r.write(`${id}-t.md`, fm({ id: `"${id}"`, ...o }), body, where);
  write('0002', { title: "'A blocked ticket'", status: 'blocked', started: ago(4) }, `${good}## Blocked question\nShould the export include archived bookings or only live ones?\n`);
  write('0003', { title: "'A stopped build'", status: 'building', started: ago(6) });
  write('0010', { title: "'Shipped and selectable'", status: 'done', started: ago(30), finished: ago(20) }, good, 'speck/tickets/done');
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0003.json'), JSON.stringify({ id: '0003', session: 's', started: ago(6), exited: ago(1), exit_code: 1 }));
  fs.writeFileSync(path.join(runs, '0003.log'), Array.from({ length: 50 }, (_, i) => `build output line ${i + 1}`).join('\n'));
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  // Each refresh puts a new square in the Auto-build button (0150), so a square that isn't the one marked is a refresh since.
  const refreshed = async what => { await b.js(`window.seen = document.getElementById('run').firstChild`); await b.until(`document.getElementById('run').firstChild !== window.seen`, what); };
  const exit = '#queue .question.exit';
  try {
    await b.until(`!!document.querySelector('${exit}') && document.querySelectorAll('#shipped tr').length === 1`, 'the queue and Shipped');
    // AC1: the blocked question.
    const q = '#queue .q.blocked .question:not(.exit)';
    await b.drag(await b.js(charAt(q, 0)), await b.js(charAt(q, 10)));
    assert.equal(await sel(), 'Should the');
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.equal(await sel(), 'Should the', 'kept through refreshes');
    // AC2: the build message box, scrolled.
    await b.js(`document.querySelector('${exit}').scrollTop = 120`);
    const scrolled = await b.js(`document.querySelector('${exit}').scrollTop`);
    assert.ok(scrolled > 0, 'the box scrolls');
    // Another ticket changes, and shows.
    write('0005', { title: "'Newly ready'", status: 'ready' });
    await b.until(`document.getElementById('queue').textContent.includes('Newly ready')`, 'the new ready ticket');
    await refreshed('another refresh');
    assert.equal(await sel(), 'Should the', 'kept while another ticket changes');
    assert.equal(await b.js(`document.querySelector('${exit}').scrollTop`), scrolled, 'the scroll position stayed');
    // AC3: a Shipped row.
    const ship = '#shipped tr td:first-child .title-link'; // the title, in a link from 0137 until 0141
    const at = await b.js(`document.querySelector('${ship}').lastChild.textContent.indexOf('Shipped')`);
    await b.js(`(() => { const t = document.querySelector('${ship}').lastChild, r = document.createRange(); r.setStart(t, ${at}); r.setEnd(t, ${at} + 7); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    assert.equal(await sel(), 'Shipped');
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.equal(await sel(), 'Shipped', 'the Shipped selection is kept');
    // AC5: its own data changes, and the new content shows.
    write('0003', { title: "'A stopped build, renamed'", status: 'building', started: ago(6) });
    await b.until(`document.getElementById('queue').textContent.includes('A stopped build, renamed')`, 'the renamed ticket');
    write('0010', { title: "'Shipped, renamed'", status: 'done', started: ago(30), finished: ago(20) }, good, 'speck/tickets/done');
    await b.until(`document.getElementById('shipped').textContent.includes('Shipped, renamed')`, 'the renamed shipped ticket');
  } finally {
    await b.close();
    await stop(panel);
  }
});

// Round 1, F1: a selection in or across the minutes or the Shipped time stays when the clock changes them.
test('0050 AC4: in a real browser, a selection in or across the minutes or the Shipped time stays as they update', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const late = startOfToday() + 23 * 3600000 + 58 * 60000 + 50000; // 23:58:50 today, where the page's clock starts
  const iso = ms => new Date(ms).toISOString();
  const r = panelRepo();
  r.write('0003-t.md', fm({ id: '"0003"', title: "'A long build'", status: 'building', started: iso(late - 5.5 * 60000) }));
  r.write('0010-t.md', fm({ id: '"0010"', title: "'Shipped late'", status: 'done', started: iso(late - 30 * 60000), finished: iso(late - 10 * 60000) }), good, 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  // The page's clock, moved by the test: every Date the page makes or asks for is `shift` ms on from the real one.
  const clock = ms => b.js(`(() => { const R = window.RealDate || (window.RealDate = Date); window.shift = ${ms} - R.now();
    window.Date = class extends R { constructor(...a) { super(...(a.length ? a : [R.now() + window.shift])); } static now() { return R.now() + window.shift; } }; })()`);
  const select = (sel1, from, sel2, to) => b.js(`(() => { const r = document.createRange(); r.setStart(document.querySelector(${JSON.stringify(sel1)}).firstChild, ${from});
    r.setEnd(document.querySelector(${JSON.stringify(sel2)}).firstChild, ${to}); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
  const sub = '#queue .q .sub', when = '#shipped tr td:nth-child(3)'; // the time: Full ticket (0063) comes after it
  try {
    await b.until(`!!document.querySelector('${sub}')`, 'the page');
    await clock(late);
    await b.until(`document.querySelector('${sub}') && /^05:3\\d$/.test(document.querySelector('${sub}').textContent) && document.querySelector('${when}').textContent === '23:48'`, 'the page on its moved clock');
    // Only the minutes (MM:SS since 0058).
    await select(sub, 0, sub, 2);
    assert.equal(await sel(), '05');
    await clock(late + 60000);
    await b.until(`document.querySelector('${sub}').textContent.startsWith('06:')`, 'the minutes to move on');
    assert.equal(await sel(), '06', 'the selected number is still selected, and updated');
    // The Shipped time, after midnight.
    await select(when, 0, when, 5);
    assert.equal(await sel(), '23:48');
    await clock(late + 2 * 60000);
    await b.until(`document.querySelector('${when}').textContent !== '23:48'`, 'midnight to pass');
    const date = await b.js(`document.querySelector('${when}').textContent`);
    assert.match(date, /^\d+ \w{3} 23:48$/, 'past midnight it shows date and time');
    assert.equal(await sel(), date, 'and the selection grows with it');
    // From the title across the minutes.
    await select('#queue .q .title', 2, sub, 5);
    assert.match(await sel(), /^long build\s+S\s+low\s+07:\d\d$/);
    await clock(late + 3 * 60000);
    await b.until(`document.querySelector('${sub}').textContent.startsWith('08:')`, 'the minutes to move on again');
    assert.match(await sel(), /^long build\s+S\s+low\s+08:\d\d$/, 'the selection across the title and minutes stays');
  } finally {
    await b.close();
    await stop(panel);
  }
});
