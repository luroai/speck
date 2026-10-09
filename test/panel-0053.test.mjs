import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, page, queueRows, click } from './support/panel.mjs';

// ---------- 0053: show the worktree path inside the open queue ticket ----------

const WT = '/home/me/projects/speck.worktrees/speck/0052-show-a-build-s-log-growing-as-it-runs';
const state = () => ({
  tickets: [
    T('0001', 'building', { worktree: WT, started: new Date(Date.now() - 3 * 60000).toISOString() }),
    T('0002', 'reviewing', { worktree: null }),
    T('0003', 'blocked', { worktree: '/tmp/wt/0003', blocked_question: 'Which?' }),
    T('0004', 'ready', { after: ['0005'], waiting_on: ['0005'] }),
    T('0005', 'ready', { worktree: null }),
  ],
  ideas: [],
});
// A fake page answering /api/state with the state and every log request with a short log.
const queuePage = (s = state()) => fakePage([], {
  fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'built', truncated: false } : JSON.parse(JSON.stringify(s))) }),
});
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const pathOf = (p, row) => p.all(row).find(n => /(^| )path( |$)/.test(n.className || ''));
const isOpen = row => /(^| )open( |$)/.test(row.className);
const open = async (p, id) => { click(topOf(rowOf(p, id))); await p.settle(); };

test('0053 AC1: a closed queue row shows nothing about the worktree', async () => {
  const p = queuePage();
  await p.settle();
  for (const id of ['0001', '0002', '0003', '0004', '0005']) {
    const row = rowOf(p, id);
    assert.ok(!isOpen(row), `${id} closed`);
    assert.ok(!row.textContent.includes('worktree'), `${id}: no worktree label`);
    assert.ok(!row.textContent.includes(WT) && !row.textContent.includes('/tmp/wt/'), `${id}: no path`);
    assert.equal(pathOf(p, row), undefined, `${id}: no path line`);
  }
});

test('0053 AC2: opening the ticket shows its worktree path in full, as text, in the details\' monospace style; opening it again closes it', async () => {
  const p = queuePage();
  await p.settle();
  await open(p, '0001');
  const row = rowOf(p, '0001');
  assert.ok(isOpen(row));
  const line = pathOf(p, row);
  assert.ok(line, 'a path line');
  assert.ok(line.textContent.includes(WT), 'the full path, not shortened');
  assert.ok(!line.textContent.includes('…') && !line.textContent.includes('~'));
  assert.ok(line._text.includes(WT), 'put in as text, not as elements');
  assert.match(line.className, /(^| )act( |$)/, 'the same .act monospace style as the lines under the bar');
  assert.match(page().match(/<style>([\s\S]*?)<\/style>/)[1].match(/\.act\s*\{([^}]*)\}/)[1], /monospace/);
  // It sits in the open details, after the bar (0069: no status line under it now) and before the log.
  const kids = row.children, at = kids.indexOf(line);
  assert.ok(at > kids.findIndex(n => n.className === 'stages'), 'after the bar');
  assert.ok(at < kids.findIndex(n => /(^| )log( |$)/.test(n.className)), 'before the log');
  await open(p, '0003');
  assert.ok(pathOf(p, rowOf(p, '0003')).textContent.includes('/tmp/wt/0003'), 'a blocked ticket too');
  await open(p, '0001');
  assert.ok(!isOpen(rowOf(p, '0001')), 'closed again');
  assert.equal(pathOf(p, rowOf(p, '0001')), undefined, 'and the path with it');
  assert.ok(isOpen(rowOf(p, '0003')), 'the other stays open');
});

test('0053 AC2: the path is never put in as HTML', async () => {
  const s = state();
  s.tickets[0].worktree = '/tmp/<img src=x onerror="alert(1)">';
  const p = queuePage(s);
  await p.settle();
  await open(p, '0001');
  const row = rowOf(p, '0001');
  assert.ok(pathOf(p, row).textContent.includes('<img src=x onerror="alert(1)">'));
  assert.ok(!p.all(row).some(n => n.tagName === 'img'));
});

test('0053 AC3: a ticket whose worktree is null shows nothing about it, open or closed', async () => {
  const p = queuePage();
  await p.settle();
  for (const id of ['0002', '0005']) {
    await open(p, id);
    const row = rowOf(p, id);
    assert.ok(isOpen(row), `${id} open`);
    assert.ok(!row.textContent.includes('worktree'), `${id}: nothing about the worktree`);
    assert.equal(pathOf(p, row), undefined, `${id}: no path line`);
  }
});

test('0053 AC4: everything else in the row stays where it is', async () => {
  const p = queuePage();
  await p.settle();
  const shape = row => row.children.map(n => n.className);
  const a = rowOf(p, '0001');
  assert.deepEqual(shape(a), ['top', 'stages'], 'top row, then the bar (0069: no status line under it)');
  assert.match(topOf(a).textContent, /03:0\d$/, 'the time since started, in the top row (MM:SS since 0058)');
  const c = rowOf(p, '0003');
  assert.deepEqual(shape(c), ['top', 'stages', 'question', 'act']);
  assert.equal(c.children[3].textContent, 'Answer the question, then run /speck-build 0003'); // 0069
  const waiting = rowOf(p, '0004');
  assert.deepEqual(shape(waiting), ['top', 'stages', 'act']);
  assert.equal(waiting.children[2].textContent, 'Queued · waiting on 0005');
  assert.ok(p.all(topOf(waiting)).some(n => n.className === 'lock'), 'the padlock in the top row');
  const chain = rowOf(p, '0005');
  assert.equal(chain.children[2].textContent, 'Queued · unlocks 0004');
  assert.ok(p.all(topOf(chain)).some(n => n.className === 'chain'), 'the chain icon in the top row');
  // Opened, the path goes between the bar and the log, and the rest keeps its place.
  await open(p, '0001');
  assert.deepEqual(shape(rowOf(p, '0001')), ['top', 'stages', 'act path', 'full-open', 'log']); // Full ticket: 0063
});
