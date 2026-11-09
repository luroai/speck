import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, queueRows, exitOf, fullViewOf } from './support/panel.mjs';

// ---------- 0069: drop the status word under an in-flight queue ticket's bar ----------

const WT = '/tmp/wt/0001';
const state = () => ({
  tickets: [
    T('0001', 'building', { worktree: WT, started: new Date(Date.now() - 60000).toISOString() }),
    T('0002', 'reviewing', { self_check: 'x', rounds: [round(1, 1)] }),
    T('0003', 'approved', { rounds: [round(1, 1)] }),
    T('0004', 'blocked', { blocked_question: 'A or B?', session: { id: 'abc', cwd: '/tmp/x' } }),
    T('0005', 'ready', { after: ['0006'], waiting_on: ['0006'] }),
    T('0006', 'ready'),
  ],
  ideas: [],
  resume_command: 'claude --resume {session}',
});
const queuePage = (s = state()) => fakePage([], {
  fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'built', truncated: false } : JSON.parse(JSON.stringify(s))) }),
});
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const shape = row => row.children.map(n => n.className);
// 0585: a row opens the ticket's full view, which has what was under the card's two lines: its live section, whose
// state is what's under the bar.
const stateOf = (p, view) => p.all(view).find(n => n.className === 'live-state');
const whereOf = row => p_find(row, n => /^where\b/.test(n.className || ''));
const p_find = (n, f) => (f(n) ? n : (n.children || []).reduce((found, c) => found || p_find(c, f), null));

test('0069 AC1: a building, reviewing or approved ticket has no status line under its bar, on its row or in its full view', async () => {
  const p = queuePage();
  await p.settle();
  for (const [id, status] of [['0001', 'building'], ['0002', 'reviewing'], ['0003', 'approved']]) {
    assert.deepEqual(shape(rowOf(p, id)), ['top'], `${id} row: only the top row`);
    assert.ok(!rowOf(p, id).textContent.includes(status), `${id} row: no "${status}"`);
    const view = await fullViewOf(p, id);
    assert.ok(!p.all(stateOf(p, view)).some(n => n.className === 'act' || n.textContent === status), `${id} full view: no "${status}" line`);
  }
});

test('0069 AC1: the rest of the ticket shows as before: counter and log (the worktree path went in 0421)', async () => {
  const p = queuePage();
  await p.settle();
  assert.match(p.all(topOf(rowOf(p, '0001'))).find(n => n.className === 'sub').textContent, /^1 min$/, 'the minutes in the row');
  const view = await fullViewOf(p, '0001');
  assert.match(p.all(view).find(n => n.className === 'sub').textContent, /^01:0\d$/, 'the counter in the full view');
  assert.deepEqual(stateOf(p, view).children.map(n => n.className), ['live-now', 'live-buttons'], 'no path line since 0421 (0548: Full log)');
  assert.ok(p.all(view).some(n => n.className === 'log'), 'the log');
  assert.deepEqual(stateOf(p, await fullViewOf(p, '0002')).children.map(n => n.className), ['live-now', 'live-buttons']);
});

test('0069 AC1: a build exit message still shows in the full view, with no status line after it', async () => {
  const s = { tickets: [T('0001', 'approved', { rounds: [round(1, 1)], ...exitOf('Ship refused.') }), T('0002', 'building', exitOf('Stopped here.'))], ideas: [] };
  const p = fakePage([s]);
  await p.settle();
  const a = stateOf(p, await fullViewOf(p, '0001'));
  assert.deepEqual(shape(a).slice(0, 4), ['live-now', 'act to-ship', 'question exit to-ship', 'live-buttons']); // purple since 0138
  assert.equal(a.children[1].textContent, 'Build finished without shipping');
  assert.equal(a.children[2].textContent, 'Ship refused.');
  assert.ok(!a.textContent.includes('approved'));
  const b = stateOf(p, await fullViewOf(p, '0002'));
  assert.deepEqual(shape(b).slice(0, 4), ['live-now', 'act bad', 'question exit', 'live-buttons']);
  assert.equal(b.children[1].textContent, 'Build stopped before finishing');
  assert.ok(!b.textContent.includes('building'));
});

test('0069 AC2: a blocked ticket says "Answer the question, then run /speck-build <id>" under its question and resume command', async () => {
  const p = queuePage();
  await p.settle();
  assert.deepEqual(shape(rowOf(p, '0004')), ['top'], '0585: its row is its two lines only');
  const live = stateOf(p, await fullViewOf(p, '0004'));
  assert.deepEqual(shape(live), ['live-now', 'question', 'resume', 'act', 'live-buttons'], 'the rest as before (0548: and Full log)');
  assert.equal(live.children[1].textContent, 'A or B?');
  assert.match(live.children[2].textContent, /^cd \/tmp\/x && claude --resume abc/);
  assert.equal(live.children[3].textContent, 'Waiting for you. Answer the question, then run /speck-build 0004');
  assert.ok(!live.textContent.includes('blocked'), 'no status word');
});

test('0069 AC2: a blocked ticket with no question or session still gets the line, with its own id', async () => {
  const p = fakePage([{ tickets: [T('0042', 'blocked')], ideas: [] }]);
  await p.settle();
  const live = stateOf(p, await fullViewOf(p, '0042'));
  assert.deepEqual(shape(live).slice(0, 2), ['live-now', 'act']);
  assert.equal(live.children[1].textContent, 'Waiting for you. Answer the question, then run /speck-build 0042');
});

test('0069 AC3: a ready ticket\'s row line says Ready, and what it waits on', async () => {
  const p = queuePage();
  await p.settle();
  const waiting = rowOf(p, '0005'), chain = rowOf(p, '0006');
  assert.deepEqual(shape(waiting), ['top']);
  assert.equal(whereOf(waiting).textContent, 'Ready · after 0006'); // 0585: what it waits on is in the line
  assert.equal(whereOf(chain).textContent, 'Ready');
  const lone = fakePage([{ tickets: [T('0007', 'ready')], ideas: [] }]);
  await lone.settle();
  assert.equal(whereOf(queueRows(lone)[0]).textContent, 'Ready');
});
