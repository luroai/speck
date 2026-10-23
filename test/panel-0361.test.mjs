// 0361: a document task whose build has finished is a short row saying so, with a Review pack button, and no log box.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, queueRows, exitOf, findText } from './support/panel.mjs';
import { PACK, DOCS, pane, docButtons } from './support/documents.mjs';

const MESSAGE = 'line one of the log\nline two of the log';
const LOG = { text: 'the full log', truncated: false };
const finished = (o = {}) => T('0001', 'approved', { task: 'document', auto_ship: false, rounds: [round(1, 1)], ...exitOf(MESSAGE), ...o });
const code = (o = {}) => T('0002', 'approved', { auto_ship: false, rounds: [round(1, 1)], ...exitOf(MESSAGE), ...o });
const state = (...tickets) => ({ tickets, ideas: [] });
const rowOf = (p, id) => queueRows(p).find(r => r.textContent.includes(id));
const say = row => row.children[0].children.find(n => n.className === 'progress');
const buttons = (p, row, label) => p.all(row).filter(n => n.tagName === 'button' && n.textContent === label);
async function load(responses) {
  const p = fakePage(responses);
  await p.settle();
  return p;
}
async function opened(responses, id = '0001') {
  const p = await load(responses);
  p.press(rowOf(p, id).children.find(n => n.className === 'top'));
  await p.settle();
  return p;
}
const noExit = (p, row) => {
  assert.equal(findText(p, row, 'Build finished without shipping'), undefined, 'no Build finished without shipping line');
  assert.ok(!p.all(row).some(n => /\bexit\b/.test(n.className || '')), 'no box with the log\'s last lines');
  assert.ok(!row.textContent.includes('line one of the log'), 'none of the log\'s last lines');
};

test('0361 AC1: a finished document task keeps its id, title, tags and progress, says it is finished, and has no exit line or log box', async () => {
  const p = await load([state(finished())]);
  const row = rowOf(p, '0001');
  assert.ok(row.textContent.includes('0001') && row.textContent.includes('Ticket 0001'), 'id and title');
  assert.ok(p.all(row).some(n => n.className === 'tag document'), 'its document tag');
  const progress = say(row);
  assert.ok(progress, 'its progress');
  assert.ok(progress.textContent.startsWith('Finished · read the document'), progress.textContent);
  assert.ok(!row.textContent.includes('Approved · waiting for you to ship it'));
  assert.ok(p.all(row).some(n => /\bstage\b/.test(n.className || '') && n.textContent === 'Ship'), 'its stage as now');
  noExit(p, row);
});

test('0361 AC1: open, it still has no exit line or log box', async () => {
  const p = await opened([state(finished()), LOG]);
  const row = rowOf(p, '0001');
  assert.match(row.className, /\bopen\b/);
  assert.ok(say(row).textContent.startsWith('Finished · read the document'));
  noExit(p, row);
});

// 0434: closed, a Build card is its two lines only, so the Review pack button shows once it's open
test('0361 AC2: closed, it is its two lines; open, its Review pack button opens the pack, files first', async () => {
  const closed = await load([state(finished())]);
  assert.deepEqual(rowOf(closed, '0001').children.map(n => n.className), ['top'], 'closed: its two lines only');
  const p = await opened([state(finished()), LOG, { pack: PACK, documents: DOCS }, state(finished())]);
  const [pack] = buttons(p, rowOf(p, '0001'), 'Review pack');
  assert.ok(pack, 'a Review pack button');
  p.press(pack);
  await p.settle();
  assert.ok(p.calls.some(c => String(c.url).endsWith('/api/tickets/0001/pack')), 'asks for the pack');
  assert.deepEqual(docButtons(p).map(b => b.textContent), DOCS.map(d => d.path), 'the document\'s files');
  assert.ok(pane(p).children.findIndex(n => p.all(n).includes(docButtons(p)[0])) <= pane(p).children.findIndex(n => n.className === 'md'), 'at the top');
});

test('0361 AC2: an open row\'s Review pack button leaves it open', async () => {
  const p = await opened([state(finished()), LOG, { pack: PACK, documents: DOCS }, state(finished())]);
  p.press(buttons(p, rowOf(p, '0001'), 'Review pack')[0]);
  await p.settle();
  assert.match(rowOf(p, '0001').className, /\bopen\b/);
});

test('0361 AC3: open, it has the Full ticket and Review pack buttons and the build log once each', async () => {
  const p = await opened([state(finished()), LOG]);
  const row = rowOf(p, '0001');
  assert.equal(buttons(p, row, 'Full ticket').length, 1);
  assert.equal(buttons(p, row, 'Review pack').length, 1);
  assert.equal(p.all(row).filter(n => n.tagName === 'pre' && n.className === 'log').length, 1, 'one log');
  // 0422: the log's lines are text nodes in rows of their own.
  assert.equal(p.all(row).filter(n => (n.tagName === '#text' ? n.textContent : n._text || '').includes('the full log')).length, 1, 'the log shown once');
});

test('0361 AC4: a code ticket waiting to be shipped keeps its line, log box and sentence, and no closed Review pack button', async () => {
  const closed = await load([state(code())]);
  assert.ok(say(rowOf(closed, '0002')).textContent.startsWith('Approved · waiting for you to ship it'));
  assert.equal(buttons(closed, rowOf(closed, '0002'), 'Review pack').length, 0);
  const p = await opened([state(code()), LOG], '0002'); // 0434: its line and log box show while it's open
  const row = rowOf(p, '0002');
  assert.ok(findText(p, row, 'Build finished without shipping'));
  assert.ok(p.all(row).some(n => /\bquestion exit to-ship\b/.test(n.className || '')));
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
    const p = await load([state(t)]);
    const row = rowOf(p, '0001');
    assert.ok(!row.textContent.includes('Finished · read the document'), name);
    assert.equal(buttons(p, row, 'Review pack').length, 0, `${name}: no Review pack button while closed`);
    if (label) {
      const o = await opened([state(t), LOG]), open = rowOf(o, '0001'); // 0434: its line shows while it's open
      assert.ok(findText(o, open, label), `${name}: its line`);
      if (t.build_exit) assert.ok(open.textContent.includes('line one of the log'), `${name}: its log box`);
    }
  }
});
