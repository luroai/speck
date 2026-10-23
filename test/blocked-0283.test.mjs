import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, fm, good, T, fakePage, queueRows, openQueueRows } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';
import { questionFacts } from '../scripts/question-facts.mjs';

// ---------- 0283: whether a blocked question changes anything you'd notice ----------

const QUESTION = 'Should the old test be removed (A) or kept and fixed (B)? I recommend B: it keeps the check.';
const FACTS = 'Recommended: B, keep the test and fix it\nChanges what you\'d notice: no\nClear winner: yes';

// A repo with one blocked ticket whose question section is `section`, and that ticket as `speck status --json` gives it.
function blockedAs(section) {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0002-blocked.md'),
    `---\n${fm({ id: '"0002"', title: 'Blocked one', status: 'blocked' })}\n---\n${good}\n## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\n${section}\n`);
  return statusData(r.dir).tickets.find(t => t.id === '0002');
}

test('0283 AC2: speck status --json gives a blocked ticket\'s recommendation, whether it changes what you\'d notice and whether it\'s a clear winner', () => {
  const t = blockedAs(`${QUESTION}\n\n${FACTS}`);
  assert.equal(t.blocked_recommendation, 'B, keep the test and fix it');
  assert.equal(t.blocked_noticeable, false);
  assert.equal(t.blocked_clear, true);
  assert.equal(t.blocked_question, QUESTION, 'the three are kept apart from the question itself');
  const other = blockedAs(`${QUESTION}\n- Recommended: A\n- Changes what you’d notice: Yes\n- Clear winner: NO`);
  assert.deepEqual([other.blocked_recommendation, other.blocked_noticeable, other.blocked_clear], ['A', true, false], 'bullets, a curly apostrophe and any case');
});

test('0283 AC3: a question without them reads as it does today, with all three unknown', () => {
  const t = blockedAs(QUESTION);
  assert.equal(t.status, 'blocked');
  assert.equal(t.blocked_question, QUESTION);
  assert.deepEqual([t.blocked_recommendation, t.blocked_noticeable, t.blocked_clear], [null, null, null]);
  const none = statusData(panelRepo().dir).tickets.find(t => t.id === '0001');
  assert.deepEqual([none.blocked_question, none.blocked_recommendation, none.blocked_noticeable, none.blocked_clear], [null, null, null, null]);
});

test('0283 AC3: a value speck can\'t read is unknown and stays in the question, so nothing is lost', () => {
  const f = questionFacts([QUESTION, 'Recommended:', 'Changes what you\'d notice: maybe', 'Clear winner: yes']);
  assert.deepEqual(f, { question: `${QUESTION}\nRecommended:\nChanges what you'd notice: maybe`, recommendation: null, noticeable: null, clear: true });
  assert.deepEqual(questionFacts([]), { question: '', recommendation: null, noticeable: null, clear: null });
  assert.deepEqual(questionFacts(['Recommended: A', 'Recommended: B']).recommendation, 'B', 'the last one counts');
  assert.deepEqual(questionFacts(['Clear winner: constructor', 'Changes what you\'d notice: __proto__']), { question: 'Clear winner: constructor\nChanges what you\'d notice: __proto__', recommendation: null, noticeable: null, clear: null });
});

// ---------- The panel ----------

const page = tickets => fakePage([], {
  fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : { tickets: JSON.parse(JSON.stringify(tickets)), ideas: [] }) }),
});
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const factsOf = (p, id) => p.all(rowOf(p, id)).filter(n => /\bquestion-fact\b/.test(n.className)).map(n => n.textContent);

test('0283 AC4: the panel says on a blocked ticket\'s question whether it changes what you\'d notice and whether it\'s a clear recommendation', async () => {
  const p = page([
    T('0001', 'blocked', { blocked_question: 'A or B?', blocked_recommendation: 'B', blocked_noticeable: true, blocked_clear: true }),
    T('0002', 'blocked', { blocked_question: 'A or B?', blocked_recommendation: 'A', blocked_noticeable: false, blocked_clear: false }),
    T('0003', 'blocked', { blocked_question: 'A or B?', blocked_recommendation: null, blocked_noticeable: null, blocked_clear: null }),
    T('0004', 'blocked', { blocked_question: 'A or B?', blocked_noticeable: false, blocked_clear: null }),
    T('0005', 'blocked', { blocked_question: null, blocked_recommendation: 'A', blocked_noticeable: true, blocked_clear: false }),
  ]);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  assert.deepEqual(factsOf(p, '0001'), ['Changes what you\'d notice', 'Clear recommendation']);
  assert.deepEqual(factsOf(p, '0002'), ['Doesn\'t change what you\'d notice', 'Close call']);
  assert.deepEqual(factsOf(p, '0003'), [], 'nothing for an unknown');
  assert.deepEqual(factsOf(p, '0004'), ['Doesn\'t change what you\'d notice'], 'only the one that\'s known');
  assert.deepEqual(factsOf(p, '0005'), ['Changes what you\'d notice', 'Close call'], 'shown even when the section holds nothing else');
  const q = p.all(rowOf(p, '0002')).find(n => n.className === 'question');
  assert.ok(q && p.all(q).some(n => /\bquestion-fact\b/.test(n.className)), 'shown on the question itself');
});
