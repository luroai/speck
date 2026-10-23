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

// 0421: the open ticket's card has no worktree line now, so 0053 AC2's path line is gone. Opening and closing work as before.
test('0053 AC2 (since 0421): opening the ticket shows no worktree path; opening it again closes it', async () => {
  const p = queuePage();
  await p.settle();
  await open(p, '0001');
  const row = rowOf(p, '0001');
  assert.ok(isOpen(row));
  assert.equal(pathOf(p, row), undefined, 'no path line');
  assert.ok(!row.textContent.includes(WT), 'no path');
  await open(p, '0003');
  assert.ok(!rowOf(p, '0003').textContent.includes('/tmp/wt/0003'), 'a blocked ticket neither');
  await open(p, '0001');
  assert.ok(!isOpen(rowOf(p, '0001')), 'closed again');
  assert.ok(isOpen(rowOf(p, '0003')), 'the other stays open');
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
  assert.deepEqual(shape(a), ['top'], 'the top row, with the progress in it since 0156 (0069: no status line under it)');
  assert.match(p.all(topOf(a)).find(n => n.className === 'sub').textContent, /^03:0\d$/, 'the time since started, in the top row (MM:SS since 0058)');
  assert.deepEqual(shape(rowOf(p, '0003')), ['top'], '0434: closed, its two lines only');
  await open(p, '0003');
  const c = rowOf(p, '0003');
  assert.deepEqual(shape(c).slice(0, 3), ['top', 'question', 'act'], '0434: open, its question under them');
  assert.equal(c.children[2].textContent, 'Waiting for you. Answer the question, then run /speck-build 0003'); // 0069, 0317
  const waiting = rowOf(p, '0004');
  assert.deepEqual(shape(waiting), ['top']); // 0419: the Queued line is the top row's details line
  assert.equal(topOf(waiting).children[1].textContent, 'Queued · waiting on 0005');
  assert.ok(p.all(topOf(waiting)).some(n => n.className === 'lock'), 'the padlock in the top row');
  const chain = rowOf(p, '0005');
  assert.equal(topOf(chain).children[1].textContent, 'Queued · unlocks 0004');
  assert.ok(p.all(topOf(chain)).some(n => n.className === 'chain'), 'the chain icon in the top row');
  // Opened, the rest keeps its place (0421: with no path line).
  await open(p, '0001');
  assert.deepEqual(shape(rowOf(p, '0001')), ['top', 'full-open', 'log']); // Full ticket: 0063
});
