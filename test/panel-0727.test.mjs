import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { T, full, fakePage, click, items, top, styles } from './support/panel.mjs';

// ---------- 0727: Keep Set ready off a closed Plan row ----------

const board = (tickets) => ({ tickets, ideas: [] });
const byClass = (p, n, re) => p.all(n).find(c => re.test(c.className));
const setReady = (p, n) => byClass(p, n, /^set-ready\b/);
const headOf = (n) => n.children.find(c => c.className === 'head') || n.children[0];
const pane = (p) => p.byId('full-ticket');
const buttons = (p, n) => p.all(n).filter(x => x.tagName === 'button');
const brief = () => fs.readFileSync(fileURLToPath(new URL('../docs/brief.md', import.meta.url)), 'utf8');
const planPhrase = (text) => {
  const m = text.match(/Plan \([^)]+\)/);
  assert.ok(m, 'the brief names Plan');
  return m[0];
};

test('0727 AC1: a closed draft row has no Set ready, and its head is only its title and details lines', async () => {
  const p = fakePage([board([T('0727', 'draft', { lint: { errors: 0, warnings: 0 } })])]);
  await p.settle();
  const row = items(p)[0];
  assert.doesNotMatch(row.className, /\bopen\b/);
  assert.equal(setReady(p, row), undefined, 'no Set ready on the closed row');
  assert.deepEqual(headOf(row).children.map(c => c.className.split(' ')[0]), ['line', 'checks']);
});

test('0727 AC1: a closed row\'s title and details still end in an ellipsis only when they don\'t fit', () => {
  const css = styles();
  assert.match(css, /\.item\.row:not\(\.open\) \.line \.title[^}]*text-overflow:\s*ellipsis/);
  assert.match(css, /\.item\.row:not\(\.open\) \.checks[^}]*text-overflow:\s*ellipsis/);
});

test('0727 AC2: an open draft row still has Set ready, disabled with why when the ready check fails, and Setting ready… while the request is under way', async () => {
  const draft = board([full('0727', { lint: { errors: 1, warnings: 0 }, lint_messages: { errors: ['Outcome contains "and": one outcome per ticket.'], warnings: [] } })]);
  const p = fakePage([draft, { ok: true, id: '0727' }, { tickets: [T('0727', 'ready')], ideas: [] }]);
  await p.settle();
  click(top(items(p)[0]));
  await p.settle();
  const bad = setReady(p, items(p)[0]);
  assert.ok(bad, 'Set ready on the open row');
  assert.equal(bad.disabled, true);
  assert.match(bad.title, /ready check/);
  assert.equal(bad.textContent, 'Set ready');

  const okDraft = board([full('0728', { lint: { errors: 0, warnings: 0 } })]);
  const q = fakePage([okDraft, { ok: true, id: '0728' }, { tickets: [T('0728', 'ready')], ideas: [] }]);
  await q.settle();
  click(top(items(q)[0]));
  await q.settle();
  const b = setReady(q, items(q)[0]);
  assert.equal(b.disabled, false);
  b.listeners.click({ stopPropagation() {} });
  assert.equal(setReady(q, items(q)[0]).textContent, 'Setting ready…');
  await q.settle();
  assert.ok(q.calls.some(c => String(c.url) === '/api/tickets/0728/ready' && c.opts?.method === 'POST'));
});

test('0727 AC3: a draft\'s full view still has Set ready in its bar', async () => {
  const p = fakePage([board([full('0727')])]);
  await p.settle();
  click(top(items(p)[0]));
  click(buttons(p, items(p)[0]).find(b => b.textContent === 'Full ticket'));
  await p.settle();
  assert.equal(pane(p).hidden, false);
  const bar = p.all(pane(p)).find(n => n.className === 'ready-bar');
  assert.ok(bar, 'the Set ready bar');
  assert.deepEqual(buttons(p, bar).map(b => b.textContent), ['Set ready']);
});

test('0727 AC4: the brief\'s Plan description puts Set ready on an open draft and in its full view, not on the closed row', () => {
  const plan = planPhrase(brief());
  // Names and places that survive 0267's rewording (the/and/a/is swaps), not a fixed sentence.
  for (const name of ['Set ready', 'open draft', 'full view']) assert.ok(plan.includes(name), name);
  assert.doesNotMatch(plan, /with Set ready and priority on the row/);
  assert.match(plan, /priority on \w+ row/);
});
