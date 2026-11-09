import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, stoppedClock } from './support/panel.mjs';
import { D, board, buttons, rows, openList } from './support/decided.mjs';

// ---------- 0590: Decided for you reads as speck's report ----------

const of = (p, root, cls) => p.all(root).filter(n => (n.className || '').split(' ').includes(cls));
const faceIn = (p, root) => p.all(root).find(n => n.attrs?.['data-mood']);
const local = (dayOffset, h, m) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + dayOffset, h, m).toISOString(); };
const SAY = 'I went with my recommendation. You can change any you\'d have called differently.';
const CHANGE = (n, change = 'changed') => ({ n, change, before: 'Was.', now: 'Now.' });
const WAITS = ', so this one waits for you at Ship.';

test('0590 AC1: under the bar, a line with speck pleased says how many calls it made this week, with Review', async () => {
  const p = board([T('0001', 'done')], ['0001', '0002', '0003', '0004'].map(id => D(id)));
  await p.settle();
  const line = p.byId('decided-open');
  assert.equal(line.hidden, false);
  assert.equal(of(p, line, 'decided-say')[0].textContent, 'I made 4 calls for you this week');
  assert.equal(of(p, line, 'decided-review')[0].textContent, 'Review');
  assert.equal(faceIn(p, line).attrs['data-mood'], 'pleased');
  const html = fs.readFileSync(new URL('../templates/panel.html', import.meta.url), 'utf8');
  assert.match(html, /<\/header>\s*<button class="decided-line" id="decided-open"/, 'straight under the bar');
});

test('0590 AC1: one call is said in the singular, and with none there is no line', async () => {
  const one = board([T('0001', 'done')], [D('0001')]);
  await one.settle();
  assert.equal(of(one, one.byId('decided-open'), 'decided-say')[0].textContent, 'I made 1 call for you this week');
  const none = board([T('0001', 'done')], []);
  await none.settle();
  assert.equal(none.byId('decided-open').hidden, true);
  assert.equal(none.byId('decided-open').children.length, 0);
});

test('0590 AC1: Review opens Decided for you', async () => {
  const p = board([T('0001', 'done')], [D('0001')]);
  await p.settle();
  assert.equal(p.byId('decided').hidden, true);
  p.press(of(p, p.byId('decided-open'), 'decided-review')[0]);
  await p.settle();
  assert.equal(p.byId('decided').hidden, false);
});

test('0590 AC1: a refresh leaves the line and its face alone, until the count changes', async () => {
  const decided = [D('0001')];
  const p = board([T('0001', 'done')], decided);
  await p.settle();
  const face = faceIn(p, p.byId('decided-open'));
  await p.timers.shift()();
  await p.settle();
  assert.equal(faceIn(p, p.byId('decided-open')), face, 'the same face, so it keeps its place in its animation');
  decided.push(D('0002'));
  await p.timers.shift()();
  await p.settle();
  assert.equal(of(p, p.byId('decided-open'), 'decided-say')[0].textContent, 'I made 2 calls for you this week');
});

test('0590 AC2: it opens with speck pleased beside a speech bubble, then the list', async () => {
  const p = board([T('0001', 'done')], [D('0001')]);
  await openList(p);
  const box = p.byId('decided'), parts = box.children.map(c => c.className);
  assert.deepEqual(parts, ['top', 'decided-intro', 'decided-list']);
  const [intro] = of(p, box, 'decided-intro');
  assert.equal(faceIn(p, intro).attrs['data-mood'], 'pleased');
  assert.equal(of(p, intro, 'decided-bubble')[0].textContent, SAY);
});

test('0590 AC2: the calls are listed under Today and Earlier, by the day where you are', async () => {
  const p = board([T('0001', 'done')], [D('0001', { at: local(0, 0, 5) }), D('0002', { at: local(-1, 23, 55) }), D('0003', { at: local(-4, 12, 0) })]);
  await openList(p);
  const [list] = of(p, p.byId('decided'), 'decided-list');
  assert.deepEqual(list.children.map(c => (/decided-day/.test(c.className) ? c.textContent : c.children[0].children[0].textContent)), ['Today', '0001', 'Earlier', '0002', '0003']);
});

test('0590 AC2: a heading with nothing under it is left out', async () => {
  const earlier = board([T('0001', 'done')], [D('0001', { at: local(-2, 12, 0) })]);
  await openList(earlier);
  assert.deepEqual(of(earlier, earlier.byId('decided'), 'decided-day').map(n => n.textContent), ['Earlier']);
  const today = board([T('0001', 'done')], [D('0001', { at: local(0, 0, 0) })]);
  await openList(today);
  assert.deepEqual(of(today, today.byId('decided'), 'decided-day').map(n => n.textContent), ['Today']);
});

test('0590 AC2: when midnight passes with it open, today\'s calls move to Earlier', async () => {
  const t = Date.parse('2026-11-09T12:00:00Z');
  let page = stoppedClock(t);
  const moved = class extends Date { constructor(...a) { super(...(a.length ? a : [page.now()])); } static now() { return page.now(); } };
  const p = board([T('0001', 'done')], [D('0001', { at: new Date(t).toISOString() })], { Date: moved });
  await openList(p);
  assert.deepEqual(of(p, p.byId('decided'), 'decided-day').map(n => n.textContent), ['Today']);
  page = stoppedClock(t + 864e5);
  await p.timers.shift()();
  await p.settle();
  assert.deepEqual(of(p, p.byId('decided'), 'decided-day').map(n => n.textContent), ['Earlier']);
});

test('0590 AC2: with nothing left to report there is no bubble', async () => {
  const decided = [D('0001')];
  const p = board([T('0001', 'done')], decided);
  await openList(p);
  decided.length = 0;
  await p.timers.shift()();
  await p.settle();
  assert.deepEqual(p.byId('decided').children.map(c => c.className), ['top', 'decided-none']);
});

test('0590 AC3: each call shows its ticket, the question, Went with, Not chosen and when', async () => {
  const p = board([T('0001', 'done')], [D('0001', { question: 'Which export?', other_options: ['Excel', 'PDF'] })]);
  await openList(p);
  const [row] = rows(p);
  assert.equal(of(p, row, 'id')[0].textContent, '0001');
  assert.equal(of(p, row, 'decided-title')[0].textContent, 'Ticket 0001');
  assert.equal(of(p, row, 'decided-question')[0].textContent, 'Which export?');
  assert.deepEqual(of(p, row, 'decided-fact').map(n => n.children.map(c => c.textContent)), [['Went with', 'Option of 0001'], ['Not chosen', 'Excel · PDF']]);
  assert.equal(of(p, row, 'decided-when')[0].textContent, '2026-11-08 10:30 UTC');
  assert.equal(of(p, row, 'decided-changed').length, 0, 'it changed no criterion');
});

test('0590 AC3: a call made before speck kept them shows without the question or Not chosen', async () => {
  for (const blank of [{ question: null, other_options: [] }, {}, { question: '', other_options: 'junk' }, { other_options: [null, '', 3] }]) {
    const p = board([T('0001', 'done')], [D('0001', blank)]);
    await openList(p);
    const [row] = rows(p);
    assert.equal(of(p, row, 'decided-question').length, 0);
    assert.deepEqual(of(p, row, 'decided-fact').map(n => n.children[0].textContent), ['Went with']);
  }
});

test('0590 AC3: text from a ticket stays text', async () => {
  const p = board([T('0001', 'done')], [D('0001', { question: '<b>q</b>', other_options: ['<i>o</i>'] })]);
  await openList(p);
  assert.equal(of(p, rows(p)[0], 'decided-question')[0].textContent, '<b>q</b>');
  assert.equal(of(p, rows(p)[0], 'decided-fact')[1].children[1].textContent, '<i>o</i>');
});

test('0590 AC3: one that changed a criterion shows speck sheepish beside which, and that it waits at Ship', async () => {
  const p = board([T('0001', 'approved', { criteria_changed: true, criteria_changes: [CHANGE(2)] })], [D('0001', { criteria_changed: true })]);
  await openList(p);
  const [line] = of(p, rows(p)[0], 'decided-changed');
  assert.equal(faceIn(p, line).attrs['data-mood'], 'sheepish');
  assert.equal(line.textContent, 'I changed criterion 2, so this one waits for you at Ship.');
});

test('0590 AC3: it says which criteria, or that it changed them when it can\'t say which', async () => {
  const said = async (changes, status = 'building') => {
    const p = board([T('0001', status, { criteria_changes: changes })], [D('0001', { criteria_changed: true })]);
    await openList(p);
    return of(p, rows(p)[0], 'decided-changed')[0].textContent;
  };
  assert.equal(await said([CHANGE(2), CHANGE(3)]), `I changed criteria 2 and 3${WAITS}`);
  assert.equal(await said([CHANGE(1), CHANGE(4, 'added')]), `I changed criterion 1 and added criterion 4${WAITS}`);
  assert.equal(await said(null), `I changed its criteria${WAITS}`);
});

test('0590 AC3: once it has shipped it doesn\'t say it\'s still waiting, nor if it was cancelled', async () => {
  const say = async status => {
    const p = board([T('0001', status)], [D('0001', { criteria_changed: true })]);
    await openList(p);
    return of(p, rows(p)[0], 'decided-changed')[0].textContent;
  };
  assert.equal(await say('done'), 'I changed its criteria, so this one waited for you at Ship.');
  assert.equal(await say('cancelled'), 'I changed its criteria.');
});

test('0590 AC3: a ticket that moves on is redrawn in what it says', async () => {
  const tickets = [T('0001', 'approved')];
  const p = board(tickets, [D('0001', { criteria_changed: true })]);
  await openList(p);
  tickets[0] = T('0001', 'approved', { criteria_changes: [CHANGE(2)] });
  await p.timers.shift()();
  await p.settle();
  assert.equal(of(p, rows(p)[0], 'decided-changed')[0].textContent, `I changed criterion 2${WAITS}`);
});

test('0590 AC4: Change still opens the review pack of a ticket waiting to ship, and only of one', async () => {
  const p = board([T('0001', 'approved'), T('0002', 'done')], [D('0001', { question: 'Q?', other_options: ['B'] }), D('0002', { question: 'Q?', other_options: ['B'] })]);
  await openList(p);
  assert.equal(buttons(p, 'Change').length, 1);
  assert.ok(p.all(rows(p)[0]).includes(buttons(p, 'Change')[0]));
  p.press(buttons(p, 'Change')[0]);
  await p.settle();
  assert.equal(p.byId('decided').hidden, true);
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.ok(p.answers.includes('/api/tickets/0001/pack'));
});
