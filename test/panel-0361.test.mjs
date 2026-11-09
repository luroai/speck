// 0361: a document task whose build has finished is a short row saying so, with a Review pack button, and no log box.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, queueRows, exitOf, findText, fullViewOf } from './support/panel.mjs';
import { PACK, DOCS, pane, docButtons } from './support/documents.mjs';

const MESSAGE = 'line one of the log\nline two of the log';
const LOG = { text: 'the full log', truncated: false };
const finished = (o = {}) => T('0001', 'approved', { kind: 'task', auto_ship: false, rounds: [round(1, 1)], ...exitOf(MESSAGE), ...o });
const code = (o = {}) => T('0002', 'approved', { auto_ship: false, rounds: [round(1, 1)], ...exitOf(MESSAGE), ...o });
const state = (...tickets) => ({ tickets, ideas: [] });
const rowOf = (p, id) => queueRows(p).find(r => r.textContent.includes(id));
const where = row => row.children[0].children.find(n => /^where\b/.test(n.className));
const say = view => view.children.length ? p_find(view, n => n.className === 'say to-ship') : null;
const p_find = (n, f) => (f(n) ? n : (n.children || []).reduce((found, c) => found || p_find(c, f), null));
const buttons = (p, row, label) => p.all(row).filter(n => n.tagName === 'button' && n.textContent === label);
async function load(responses) {
  const p = fakePage(responses);
  await p.settle();
  return p;
}
// 0585: a row opens the ticket's full view, which holds its sentence, log and buttons.
async function opened(responses, id = '0001') {
  const p = await load(responses);
  return { p, view: await fullViewOf(p, id) };
}
const noExit = (p, row) => {
  assert.equal(findText(p, row, 'Build finished without shipping'), undefined, 'no Build finished without shipping line');
  assert.ok(!p.all(row).some(n => /\bexit\b/.test(n.className || '')), 'no box with the log\'s last lines');
  assert.ok(!row.textContent.includes('line one of the log'), 'none of the log\'s last lines');
};

test('0361 AC1: a finished document task keeps its id and title, says it is finished, and has no exit line or log box', async () => {
  const p = await load([state(finished()), LOG]);
  const row = rowOf(p, '0001');
  assert.ok(row.textContent.includes('0001') && row.textContent.includes('Ticket 0001'), 'id and title');
  assert.ok(where(row), 'its line saying where it is');
  assert.ok(!row.textContent.includes('Approved · waiting for you to ship it'));
  noExit(p, row);
  const view = await fullViewOf(p, '0001');
  assert.equal(say(view).textContent, 'Finished · read the result'); // 0584: its full view says it
  assert.ok(p.all(view).some(n => /\bstage\b/.test(n.className || '') && n.textContent === 'Ship'), 'its stage as now');
  assert.ok(!view.textContent.includes('Approved · waiting for you to ship it'));
  noExit(p, view);
});

test('0361 AC1: its full view still has no exit line or log box', async () => {
  const { p, view } = await opened([state(finished()), LOG]);
  assert.equal(say(view).textContent, 'Finished · read the result');
  noExit(p, view);
});

// 0434, 0585: a Build row is its two lines only, so the Review pack button is in its full view
test('0361 AC2: closed, it is its two lines; its full view\'s Review pack button opens the pack, files first', async () => {
  const closed = await load([state(finished())]);
  assert.deepEqual(rowOf(closed, '0001').children.map(n => n.className), ['top'], 'closed: its two lines only');
  const { p, view } = await opened([state(finished()), LOG, { pack: PACK, documents: DOCS }, state(finished())]);
  const [pack] = buttons(p, view, 'Review pack');
  assert.ok(pack, 'a Review pack button');
  p.press(pack);
  await p.settle();
  assert.ok(p.calls.some(c => String(c.url).endsWith('/api/tickets/0001/pack')), 'asks for the pack');
  assert.deepEqual(docButtons(p).map(b => b.title), DOCS.map(d => d.path), 'the document\'s files'); // 0562: each path as its tooltip
  assert.ok(pane(p).children.findIndex(n => p.all(n).includes(docButtons(p)[0])) <= pane(p).children.findIndex(n => n.className === 'md'), 'at the top');
});

test('0361 AC2: the Review pack button leaves its row in the list unopened', async () => {
  const { p, view } = await opened([state(finished()), LOG, { pack: PACK, documents: DOCS }, state(finished())]);
  p.press(buttons(p, view, 'Review pack')[0]);
  await p.settle();
  assert.doesNotMatch(rowOf(p, '0001').className, /\bopen\b/);
  assert.deepEqual(rowOf(p, '0001').children.map(n => n.className), ['top']);
});

test('0361 AC3: its full view has the Review pack and Build log buttons and the build log once each', async () => {
  const { p, view } = await opened([state(finished()), LOG]);
  assert.equal(buttons(p, view, 'Review pack').length, 1);
  assert.equal(buttons(p, view, 'Build log').length, 1);
  assert.equal(p.all(view).filter(n => /(^| )log( |$)/.test(n.className || '')).length, 1, 'one log');
  // 0422: the log's lines are text nodes in rows of their own.
  assert.equal(p.all(view).filter(n => (n.tagName === '#text' ? n.textContent : n._text || '').includes('the full log')).length, 1, 'the log shown once');
});

test('0361 AC4: a code ticket waiting to be shipped keeps its line, log box and sentence in its full view, and no Review pack button on its row', async () => {
  const closed = await load([state(code())]);
  assert.match(where(rowOf(closed, '0002')).textContent, /^Ready to ship/);
  assert.equal(buttons(closed, rowOf(closed, '0002'), 'Review pack').length, 0);
  const { p, view } = await opened([state(code()), LOG], '0002'); // 0584: its line and log box show in its full view
  assert.ok(findText(p, view, 'Build finished without shipping'));
  assert.ok(p.all(view).some(n => /\bquestion exit to-ship\b/.test(n.className || '')));
});

test('0361 AC4: a document task blocked, building, reviewing, shipping or stopped looks as it did', async () => {
  const cases = [
    ['blocked', finished({ status: 'blocked', blocked_question: 'Which?', build_exit: undefined }), null],
    ['building', finished({ status: 'building', build_exit: undefined }), null],
    ['reviewing', finished({ status: 'reviewing', build_exit: undefined }), null],
    ['shipping', finished({ ship: { running: true, started: new Date().toISOString() } }), null],
    ['stopped before finishing', finished({ status: 'building' }), 'Build stopped before finishing'],
    ['stopped unexpectedly', finished({ status: 'reviewing', build_exit: undefined, build_stopped: true, build_running: false }), 'Build stopped unexpectedly'],
  ];
  for (const [name, t, label] of cases) {
    const p = await load([state(t), LOG]);
    const row = rowOf(p, '0001');
    assert.ok(!row.textContent.includes('Finished · read the result'), name);
    assert.equal(buttons(p, row, 'Review pack').length, 0, `${name}: no Review pack button on its row`);
    const view = await fullViewOf(p, '0001'); // 0584: its line shows in its full view
    assert.ok(!view.textContent.includes('Finished · read the result'), `${name}: not finished`);
    if (label) {
      assert.ok(findText(p, view, label), `${name}: its line`);
      if (t.build_exit) assert.ok(view.textContent.includes('line one of the log'), `${name}: its log box`);
    }
  }
});
