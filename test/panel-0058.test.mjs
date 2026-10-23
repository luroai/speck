import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { CLI, T, fm, good, panelModel, panelRepo, freePort, startPanel, stop, fakePage, round, queueRows, shippedRows, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0058: an in-flight ticket's elapsed time as an MM:SS counter that moves every second ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const subOf = (p, id) => p.all(rowOf(p, id)).find(n => n.className === 'sub');
// The page's clock, moved by the test.
const clock = start => {
  const c = { now: start };
  c.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [c.now])); } static now() { return c.now; } };
  return c;
};
const NOW = Date.parse('2026-10-09T12:00:00.000Z');
const iso = ms => new Date(ms).toISOString();
const secs = s => iso(NOW - s * 1000);
// Each repeating timer the page has set, as { fn, ms }.
const intervals = p => [...p.intervals.values()];
const tick = async p => { const all = intervals(p); assert.equal(all.length, 1, 'one repeating timer is set'); all[0].fn(); await p.settle(); };

const board = () => ({
  tickets: [
    T('0001', 'building', { started: secs(7) }),
    T('0002', 'reviewing', { started: secs(7 * 60 + 42), rounds: [round(1, 100)] }),
    T('0003', 'blocked', { started: secs(62 * 60 + 7), blocked_question: 'Which way?' }),
    T('0004', 'approved', { started: secs(30), rounds: [round(1, 100)] }),
    T('0005', 'building', { started: 'not a date' }),
    T('0006', 'reviewing'), // no started
    T('0007', 'ready', { started: secs(90) }),
  ],
  ideas: [],
});

test('0058 AC1: each in-flight ticket with a started shows MM:SS in the row\'s right-hand place; ready and unreadable ones show nothing', async () => {
  const c = clock(NOW);
  const p = fakePage([board()], { Date: c.Date });
  await p.settle();
  const shown = id => subOf(p, id)?.textContent ?? ''; // 0419: a row with no time has no counter in its details line
  assert.equal(shown('0001'), '00:07', 'building');
  assert.equal(shown('0002'), '07:42', 'reviewing');
  assert.equal(shown('0003'), '62:07', 'blocked');
  assert.equal(shown('0004'), '00:30', 'approved');
  assert.equal(shown('0005'), '', 'an unreadable started shows nothing');
  assert.equal(shown('0006'), '', 'no started shows nothing');
  assert.equal(shown('0007'), '', 'a ready ticket shows nothing');
  // 0419: the counter is in the details line under the title, after the stage's name and before the tags.
  const line = p.all(rowOf(p, '0001')).find(n => n.className === 'progress');
  assert.ok(line.children.includes(subOf(p, '0001')));
  assert.match(line.textContent, /^Writing tests and code · Build · 00:07 · P2 · S · low$/);
  assert.ok(!rowOf(p, '0001').textContent.includes('min'), 'no whole minutes are left');
});

test('0058 AC1: /api/state gains no field: the page works the counter out from started alone', () => {
  const r = panelRepo();
  r.write('0003-t.md', fm({ id: '"0003"', title: "'A build'", status: 'building', started: iso(Date.now() - 65000) }), good);
  const out = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8' });
  const t = JSON.parse(out.stdout).tickets.find(x => x.id === '0003');
  assert.deepEqual(Object.keys(t).filter(k => /counter|elapsed|since|second|minute/i.test(k)), [], 'the state has no such field');
  // The page has only started to go on.
  assert.match(panelModel()({ tickets: [t], ideas: [] }).queue[0].counter, /^01:0[5-9]$/);
});

test('0058 AC2: minutes are padded to two digits and count past 59', () => {
  // The model section runs on its own with the real clock, so each started is that far before now, plus a little slack.
  const model = panelModel();
  const at = s => model({ tickets: [T('0001', 'building', { started: iso(Date.now() - s * 1000 - 300) })], ideas: [] }).queue[0].counter;
  assert.equal(at(7), '00:07');
  assert.equal(at(7 * 60 + 42), '07:42');
  assert.equal(at(62 * 60 + 7), '62:07');
  assert.equal(at(0), '00:00');
  assert.equal(at(100 * 60), '100:00', 'past 99 minutes it keeps counting');
});

test('0058 AC2: a started in the future shows 00:00 rather than a negative time', async () => {
  const c = clock(NOW);
  const p = fakePage([{ tickets: [T('0001', 'building', { started: iso(NOW + 90000) })], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '00:00');
});

test('0058 AC3: the counter moves on once a second from its own timer, between polls, and touches nothing else', async () => {
  const c = clock(NOW);
  const p = fakePage([board()], { Date: c.Date });
  await p.settle();
  const all = intervals(p);
  assert.equal(all.length, 1, 'one repeating timer');
  assert.equal(all[0].ms, 1000, 'every second');
  // Everything in the queue as it is before the tick, apart from each counter.
  const snap = () => p.all(p.byId('queue')).map(n => [n, n._text, n.className, [...(n.children || [])], n.detached || 0, n.title]);
  const before = snap(), fetches = p.calls.length, timers = p.timers.length;
  const subs = queueRows(p).map(r => p.all(r).find(n => n.className === 'sub'));
  c.now += 1000;
  await tick(p);
  assert.equal(p.calls.length, fetches, 'no request: the poll didn\'t run');
  assert.equal(p.timers.length, timers, 'no other timer was set');
  assert.equal(subOf(p, '0001').textContent, '00:08');
  assert.equal(subOf(p, '0002').textContent, '07:43');
  assert.equal(subOf(p, '0003').textContent, '62:08');
  assert.equal(subOf(p, '0004').textContent, '00:31');
  assert.equal(subOf(p, '0005'), undefined);
  assert.equal(subOf(p, '0007'), undefined, 'a ready ticket still shows nothing');
  const after = snap();
  assert.equal(after.length, before.length, 'no node added or taken out');
  for (let i = 0; i < before.length; i++) {
    const [n, text, cls, kids, detached, title] = before[i];
    assert.equal(after[i][0], n, 'the same nodes in the same order');
    assert.equal(n.className, cls, 'no class changed: tags, bar and motion stay');
    assert.deepEqual(n.children || [], kids, 'no child changed');
    assert.equal(n.detached || 0, detached, 'nothing was taken out');
    assert.equal(n.title, title, 'no hover text changed');
    if (!subs.includes(n)) assert.equal(n._text, text, 'only a counter\'s text changed');
  }
  c.now += 60000;
  await tick(p);
  assert.equal(subOf(p, '0002').textContent, '08:43', 'it keeps going, a minute later');
});

test('0058 AC3: one timer however many polls, it follows a rebuilt row, and none is left once no in-flight ticket has a started', async () => {
  const c = clock(NOW);
  const s = board(), renamed = clone(s);
  renamed.tickets[0].title = 'Renamed'; // 0001's own data changes, so its row is built afresh
  const none = { tickets: [T('0005', 'building', { started: 'not a date' }), T('0006', 'reviewing'), T('0007', 'ready', { started: secs(90) })], ideas: [] };
  const p = fakePage([s, renamed, clone(renamed), none, clone(s)], { Date: c.Date });
  await p.settle();
  const old = rowOf(p, '0001');
  c.now += 2000;
  await refresh(p);
  assert.notEqual(rowOf(p, '0001'), old, 'the row was rebuilt');
  assert.equal(intervals(p).length, 1, 'still one timer');
  assert.equal(subOf(p, '0001').textContent, '00:09');
  c.now += 1000;
  await tick(p);
  assert.equal(subOf(p, '0001').textContent, '00:10', 'the new row ticks');
  await refresh(p);
  assert.equal(intervals(p).length, 1, 'still one timer after another poll');
  await refresh(p);
  assert.equal(intervals(p).length, 0, 'no timer once no in-flight ticket has a started');
  await refresh(p);
  assert.equal(intervals(p).length, 1, 'and it starts again when one comes back');
});

test('0058 AC3: no timer is set when nothing in flight has a started', async () => {
  const p = fakePage([{ tickets: [T('0006', 'reviewing'), T('0007', 'ready', { started: secs(90) })], ideas: [] }]);
  await p.settle();
  assert.equal(intervals(p).length, 0);
});

test('0058 AC5: the Shipped rows and the median stat keep whole minutes', async () => {
  const c = clock(NOW);
  const s = { tickets: [
    T('0010', 'done', { started: iso(NOW - 20 * 60000), finished: iso(NOW - 10 * 60000 - 20000), rounds: [round(1, 500)] }),
    T('0011', 'done', { started: iso(NOW - 40 * 60000), finished: iso(NOW - 26 * 60000) }),
  ], ideas: [] };
  const p = fakePage([s], { Date: c.Date });
  await p.settle();
  const rows = shippedRows(p).map(r => r.textContent);
  assert.ok(rows.some(t => t.includes('10 min')), 'a Shipped row shows whole minutes');
  assert.ok(rows.some(t => t.includes('14 min')));
  assert.ok(!rows.some(t => /\d\d:\d\d ·|\d+:\d\d min/.test(t)), 'no MM:SS in Shipped');
  const stats = p.byId('shipped-stats').textContent;
  assert.ok(stats.includes('12median minutes'), `the median is whole minutes: ${stats}`);
});

// ---------- in a real browser ----------

test('0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays', chrome, async () => {
  const r = panelRepo();
  r.write('0003-t.md', fm({ id: '"0003"', title: "'A long build'", status: 'building', started: iso(Date.now() - (7 * 60 + 30) * 1000) }), good);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  const sub = '#queue .q .sub';
  const select = (sel1, from, sel2, to) => b.js(`(() => { const r = document.createRange(); r.setStart(document.querySelector(${JSON.stringify(sel1)}).firstChild, ${from});
    r.setEnd(document.querySelector(${JSON.stringify(sel2)}).firstChild, ${to}); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
  try {
    await b.until(`/^\\d\\d:\\d\\d$/.test((document.querySelector('${sub}') || {}).textContent || '')`, 'the counter');
    // Every replaceData on the page, with the text before it, so the test sees how much each change replaced.
    await b.js(`(() => { window.edits = []; const real = CharacterData.prototype.replaceData;
      CharacterData.prototype.replaceData = function (at, n, put) { window.edits.push([this.data, at, n, put]); return real.call(this, at, n, put); }; })()`);
    const text = () => b.js(`document.querySelector('${sub}').textContent`);
    const next = async () => { const was = await text(); await b.until(`document.querySelector('${sub}').textContent !== ${JSON.stringify(was)}`, 'the counter to move on'); };
    // With render() held off, so neither the poll nor anything else redraws: only the counter's own timer can move it on.
    await b.js(`(() => { window.realRender = window.render; window.render = () => {}; })()`);
    await next();
    await next();
    await b.js(`window.render = window.realRender`);
    // The minutes: they stay selected while the counter moves on.
    await select(sub, 0, sub, 2);
    assert.match(await sel(), /^\d\d$/);
    await next();
    assert.equal(await sel(), (await text()).slice(0, 2), 'the selected minutes are still selected');
    // The seconds' last digit, which each tick replaces: the selection moves to the new digit.
    await select(sub, 4, sub, 5);
    await next();
    assert.equal(await sel(), (await text()).slice(4), 'the selected digit is still selected, and updated');
    // From the title across the counter.
    await select('#queue .q .title', 2, sub, 5);
    assert.match(await sel(), /^long build\s+Writing tests and code · Build · \d\d:\d\d$/); // what it's doing and its stage come before the timer since 0156, and the tags after it since 0419
    await next();
    const shown = await text();
    assert.ok((await sel()).startsWith('long build') && (await sel()).endsWith(shown), 'the selection across the title and counter stays, updated');
    // Each change replaced only the characters that differ: '07:42' to '07:43' is one character.
    const edits = await b.js('window.edits');
    assert.ok(edits.length >= 5, 'the counter changed in place each time');
    for (const [from, at, n, put] of edits) {
      const to = from.slice(0, at) + put + from.slice(at + n);
      let a = 0, z = 0;
      while (a < from.length && from[a] === to[a]) a++;
      while (z < from.length - a && from[from.length - 1 - z] === to[to.length - 1 - z]) z++;
      assert.equal(n, from.length - a - z, `${from} to ${to} replaced only the characters that differ`);
      if (from.slice(0, 4) === to.slice(0, 4)) assert.equal(n, 1, `${from} to ${to} replaced one character`);
    }
  } finally {
    await b.close();
    await stop(panel);
  }
});
