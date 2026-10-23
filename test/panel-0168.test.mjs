import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, styles } from './support/panel.mjs';

// ---------- 0168: the builder badge on each in-flight ticket's Build card ----------
// 0416: the badge has gone, so only the words beside it are checked here: test/panel-0416.test.mjs checks no card has a picture.

const ago = s => new Date(Date.now() - s * 1000).toISOString();
// One ticket in each state an in-flight card can be in, and two ready ones.
const TICKETS = [
  T('0401', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' }),
  T('0402', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0403', 'reviewing', { title: 'Under review', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
    rounds: [{ ...round(2, 10), verdict: 'request_changes' }] }),
  T('0404', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0405', 'approved', { title: 'Waiting to ship', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') }),
  T('0406', 'blocked', { title: 'With a question', started: ago(300), blocked_question: 'A or B?' }),
  T('0407', 'building', { title: 'A build that stopped', started: ago(200), ...exitOf('It ended.') }),
  T('0408', 'approved', { title: 'Being shipped', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    ship: { running: true, started: ago(5) } }),
  T('0409', 'ready', { title: 'Ready' }),
  T('0410', 'ready', { title: 'Ready too', after: ['0409'], waiting_on: ['0409'] }),
];
// Each in-flight ticket's sentence and its stage's name.
const SHOWS = {
  '0401': ['Writing tests and code', 'Build'],
  '0402': ['Checking its own work', 'Self-check'],
  '0403': ['Codex is reviewing · round 2', 'Review 2'],
  '0404': ['Paused', 'Review'],
  '0405': ['Approved · waiting for you to ship it', 'Ship'],
  '0406': ['Blocked · it has a question for you', 'Build'],
  '0407': ['The build stopped', 'Build'],
  '0408': ['Shipping', null], // no stage's name since 0201
};

// speck run is on, as its ship queue ships the approved tickets auto-ship covers (0203: with it off, they wait for you).
function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [], run: { on: true } }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(' ');
const WORKING = ['0401', '0402', '0403']; // 0434: an agent is at work on them

test('0168 AC1: each in-flight card has a row under its title with the sentence and the stage\'s name (with no badge since 0416)', async () => {
  const p = fake();
  await p.settle();
  for (const [id, [sentence, stage]] of Object.entries(SHOWS)) {
    const top = topOf(rowOf(p, id)), rows = top.children.filter(n => classes(n)[0] === 'progress');
    assert.equal(rows.length, 1, `${id}: one progress row`);
    assert.ok(top.children.indexOf(rows[0]) > top.children.findIndex(n => n.className === 'line'), `${id}: under the title`);
    const text = rows[0];
    assert.equal(text.className, stage ? 'progress' : 'progress ship-line');
    // 0434: while its builder or reviewer is at work, a grid of lights named for the sentence stands in for it
    const shown = text.children.filter(n => n.className && n.className !== 'sep').map(n => [n.className.split(' ')[0], n.className === 'lights' ? n.attrs['aria-label'] : n.textContent.replace(/\d\d:\d\d$/, 'MM:SS')]);
    const say = WORKING.includes(id) ? 'lights' : 'say';
    assert.deepEqual(shown.slice(0, 2), [[say, sentence], stage ? ['stage', stage] : ['sub', 'MM:SS']], `${id}: the sentence and the stage, or (0434) a shipping card's one time`);
    // 0419: then the timer, on the same line (0434: after the reviewer's name while it reviews, and no tags while it's closed)
    assert.deepEqual(shown.slice(2).map(([c]) => c), id === '0403' ? ['by', 'sub'] : stage ? ['sub'] : [], `${id}: the timer`);
    assert.equal(p.all(top).filter(n => /\b(enso|orbit|speck|dots|dot)\b/.test(n.className || '')).length, 0, `${id}: no ensō, speck or stage dots`);
  }
  assert.doesNotMatch((page() + styles()), /\.enso\b|\.orbit\b|\.dot\.now|@keyframes orbit/, 'the ensō and the dots are gone from the page');
});
