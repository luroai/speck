import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, page, queueRows, click, fullViewOf } from './support/panel.mjs';

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
const closeView = async p => { click(p.all(p.byId('full-ticket')).find(n => n.className === 'close')); await p.settle(); };
const whereOf = (p, row) => p.all(row).find(n => /^where\b/.test(n.className || ''));

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

// 0421: the ticket has no worktree line now, so 0053 AC2's path line is gone. 0585: pressing its row opens its full view, and its Back link closes it.
test('0053 AC2 (since 0421): opening the ticket shows no worktree path; going back closes it', async () => {
  const p = queuePage();
  await p.settle();
  const view = await fullViewOf(p, '0001');
  assert.equal(view.hidden, false);
  assert.equal(pathOf(p, view), undefined, 'no path line');
  assert.ok(!view.textContent.includes(WT), 'no path');
  assert.ok(!isOpen(rowOf(p, '0001')), 'its row does not open');
  assert.ok(!(await fullViewOf(p, '0003')).textContent.includes('/tmp/wt/0003'), 'a blocked ticket neither');
  await closeView(p);
  assert.equal(p.byId('full-ticket').hidden, true, 'closed again');
});

test('0053 AC3: a ticket whose worktree is null shows nothing about it, on its row or in its full view', async () => {
  const p = queuePage();
  await p.settle();
  for (const id of ['0002', '0005']) {
    const view = await fullViewOf(p, id);
    assert.equal(view.hidden, false, `${id} open`);
    assert.ok(!view.textContent.includes('worktree'), `${id}: nothing about the worktree`);
    assert.equal(pathOf(p, view), undefined, `${id}: no path line`);
    assert.ok(!rowOf(p, id).textContent.includes('worktree'), `${id}: nor on its row`);
  }
});

test('0053 AC4: everything else stays where it is', async () => {
  const p = queuePage();
  await p.settle();
  const shape = row => row.children.map(n => n.className);
  const a = rowOf(p, '0001');
  assert.deepEqual(shape(a), ['top'], 'the top row, with nothing under it (0069: no status line)');
  assert.match(whereOf(p, a).children.find(n => n.className === 'sub').textContent, /^3 min$/, 'the time since started, in the row (0585: in minutes)');
  assert.deepEqual(shape(rowOf(p, '0003')), ['top'], '0434: closed, its two lines only');
  const live = p.all(await fullViewOf(p, '0003')).find(n => n.className === 'live-state');
  assert.deepEqual(shape(live).slice(0, 3), ['live-now', 'question', 'act'], '0585: its question is in its full view');
  assert.equal(live.children[2].textContent, 'Waiting for you. Answer the question, then run /speck-build 0003'); // 0069, 0317
  const waiting = rowOf(p, '0004');
  assert.deepEqual(shape(waiting), ['top']); // 0585: the line saying where it is is in the top row
  assert.equal(whereOf(p, waiting).textContent, 'Ready · after 0005');
  assert.ok(!p.all(waiting).some(n => n.className === 'lock'), '0483: no padlock in the row');
  const chain = rowOf(p, '0005');
  assert.equal(whereOf(p, chain).textContent, 'Ready');
  assert.ok(!p.all(chain).some(n => n.className === 'chain'), '0483: no chain icon in the row');
});
