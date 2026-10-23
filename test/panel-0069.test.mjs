import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, queueRows, click, exitOf } from './support/panel.mjs';

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
const open = async (p, id) => { click(topOf(rowOf(p, id))); await p.settle(); };
// What's under the bar: every child after the top row, which has the progress in it since 0156.
const under = row => row.children.slice(row.children.findIndex(n => n.className === 'top') + 1);

test('0069 AC1: a building, reviewing or approved ticket has no status line under its bar, closed or open', async () => {
  const p = queuePage();
  await p.settle();
  for (const [id, status] of [['0001', 'building'], ['0002', 'reviewing'], ['0003', 'approved']]) {
    assert.deepEqual(shape(rowOf(p, id)), ['top'], `${id} closed: only the top row, with the progress in it (0156)`);
    assert.ok(!under(rowOf(p, id)).some(n => n.textContent.includes(status)), `${id} closed: no "${status}"`);
    await open(p, id);
    const row = rowOf(p, id);
    assert.ok(!under(row).some(n => n.className === 'act' || n.textContent.includes(status)), `${id} open: no "${status}" line`);
  }
});

test('0069 AC1: the rest of the row shows as before: bar, counter, worktree path and log', async () => {
  const p = queuePage();
  await p.settle();
  const a = rowOf(p, '0001');
  assert.ok(topOf(a).children.some(n => n.className === 'progress'), 'the progress, in the top row since 0156: in words only since 0416');
  assert.match(topOf(a).children.find(n => n.className === 'sub').textContent, /^01:0\d$/, 'the counter in the top row');
  await open(p, '0001');
  assert.deepEqual(shape(rowOf(p, '0001')), ['top', 'act path', 'full-open', 'log']);
  assert.ok(rowOf(p, '0001').textContent.includes(`worktree ${WT}`));
  await open(p, '0002');
  assert.deepEqual(shape(rowOf(p, '0002')), ['top', 'full-open', 'log'], 'no worktree: no path line');
});

test('0069 AC1: a build exit message still shows, with no status line after it', async () => {
  const s = { tickets: [T('0001', 'approved', { rounds: [round(1, 1)], ...exitOf('Ship refused.') }), T('0002', 'building', exitOf('Stopped here.'))], ideas: [] };
  const p = fakePage([s]);
  await p.settle();
  const [a, b] = queueRows(p);
  assert.deepEqual(shape(a), ['top', 'act to-ship', 'question exit to-ship']); // purple since 0138
  assert.equal(a.children[1].textContent, 'Build finished without shipping');
  assert.equal(a.children[2].textContent, 'Ship refused.');
  assert.ok(!a.textContent.includes('approved'));
  assert.deepEqual(shape(b), ['top', 'act bad', 'question exit']);
  assert.equal(b.children[1].textContent, 'Build stopped before finishing');
  assert.ok(!b.textContent.includes('building'));
});

test('0069 AC2: a blocked ticket says "Answer the question, then run /speck-build <id>" under its question and resume command', async () => {
  const p = queuePage();
  await p.settle();
  const row = rowOf(p, '0004');
  assert.deepEqual(shape(row), ['top', 'question', 'resume', 'act']);
  assert.equal(row.children[1].textContent, 'A or B?');
  assert.match(row.children[2].textContent, /^cd \/tmp\/x && claude --resume abc/);
  assert.equal(row.children[3].textContent, 'Waiting for you. Answer the question, then run /speck-build 0004');
  assert.ok(!row.textContent.includes('blocked'), 'no status word');
  await open(p, '0004');
  assert.deepEqual(shape(rowOf(p, '0004')), ['top', 'question', 'resume', 'act', 'full-open', 'log'], 'open: the rest as before');
  assert.equal(rowOf(p, '0004').children[3].textContent, 'Waiting for you. Answer the question, then run /speck-build 0004');
});

test('0069 AC2: a blocked ticket with no question or session still gets the line, with its own id', async () => {
  const p = fakePage([{ tickets: [T('0042', 'blocked')], ideas: [] }]);
  await p.settle();
  const [row] = queueRows(p);
  assert.deepEqual(shape(row), ['top', 'act']);
  assert.equal(row.children[1].textContent, 'Waiting for you. Answer the question, then run /speck-build 0042');
});

test('0069 AC3: a ready ticket\'s Queued line is unchanged', async () => {
  const p = queuePage();
  await p.settle();
  const waiting = rowOf(p, '0005'), chain = rowOf(p, '0006');
  assert.deepEqual(shape(waiting), ['top', 'act']);
  assert.equal(waiting.children[1].textContent, 'Queued · waiting on 0006');
  assert.equal(waiting.children[1].children[0].tagName, 'b');
  assert.equal(chain.children[1].textContent, 'Queued · unlocks 0005');
  const lone = fakePage([{ tickets: [T('0007', 'ready')], ideas: [] }]);
  await lone.settle();
  assert.equal(queueRows(lone)[0].children[1].textContent, 'Queued');
});
