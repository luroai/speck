import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, boardPage, full, T, click, items, top, queueRows, shippedRows } from './support/panel.mjs';
import { rules, selectors, get } from './support/css.mjs';

// ---------- 0617: a draft's full view ends in a bar with Set ready ----------

const pane = p => p.byId('full-ticket');
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const of = (p, cls, root = pane(p)) => p.all(root).find(n => (n.className || '').split(' ').includes(cls));
const buttons = (p, n) => p.all(n).filter(x => x.tagName === 'button');
const bar = p => of(p, 'ready-bar');
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const ONE = { lint: { errors: 1, warnings: 0 }, lint_messages: { errors: ['Outcome contains "and": one outcome per ticket.'], warnings: [] } };
const TWO = { lint: { errors: 2, warnings: 0 }, lint_messages: { errors: ['Outcome contains "and": one outcome per ticket.', 'No acceptance criteria.'], warnings: [] } };

async function openDraft(t, more = []) {
  const s = { tickets: [t], ideas: [] };
  const p = fakePage([s, ...more]);
  await p.settle();
  click(top(itemOf(p, t.id)));
  click(buttons(p, itemOf(p, t.id)).find(b => b.textContent === 'Full ticket'));
  assert.equal(pane(p).hidden, false, 'the full view opens');
  return p;
}
const rule = s => rules().filter(r => selectors(r).includes(s)).pop();
// What the plain rules naming the selector give it, later ones winning.
const cascaded = s => Object.fromEntries(rules().filter(r => !r.at.length && selectors(r).includes(s)).flatMap(r => r.decls));

test('0617 AC1: a draft\'s full view ends in a bar with Set ready, and nothing else there', async () => {
  const p = await openDraft(full('0001'));
  const kids = pane(p).children;
  assert.equal(kids.at(-1), bar(p), 'the bar is the last thing in the view');
  assert.deepEqual(buttons(p, bar(p)).map(b => b.textContent), ['Set ready']);
  assert.equal(buttons(p, bar(p))[0].disabled, false);
  assert.equal(of(p, 'ship-bar'), undefined, 'not the ship bar');
});

test('0617 AC1: the bar is fixed to the bottom, as the ship bar is, and its Set ready is in the accent colour', () => {
  const b = cascaded('#full-ticket .ready-bar');
  assert.equal(b.position, 'sticky');
  assert.equal(b.bottom, '0');
  assert.ok(rules().some(r => selectors(r).includes('#full-ticket:has(> .ready-bar)') && get(r, 'flex-direction') === 'column'), 'pushed to the bottom however little is above it');
  assert.match(get(rule('#full-ticket .ready-bar .set-ready'), 'background'), /--blue/);
});

test('0617 AC1: Set ready in the bar does what Set ready does: it posts, and the ticket moves to the queue on the next refresh', async () => {
  const p = await openDraft(full('0002'), [{ ok: true, id: '0002' }, { tickets: [T('0002', 'ready')], ideas: [] }]);
  let stopped = false;
  buttons(p, bar(p))[0].listeners.click({ stopPropagation() { stopped = true; } });
  assert.equal(buttons(p, bar(p))[0].textContent, 'Setting ready…', 'in progress');
  await p.settle();
  assert.ok(stopped);
  assert.equal(p.calls[1].url, '/api/tickets/0002/ready');
  assert.equal(p.calls[1].opts.method, 'POST');
  await refresh(p);
  assert.equal(bar(p), undefined, 'a ready ticket has no bar');
  assert.ok(queueRows(p).some(r => r.textContent.includes('0002')));
});

test('0617 AC1: a ticket that isn\'t a draft has no Set ready bar', async () => {
  for (const status of ['ready', 'approved', 'done']) {
    const p = boardPage([{ run: { on: true }, ideas: [], tickets: [full('0003'), T('0004', status, { title: 'Other', finished: status === 'done' ? new Date().toISOString() : undefined })] }]);
    await p.settle();
    if (status === 'done') p.press(shippedRows(p).find(n => n.textContent.includes('Other')));
    else {
      const row = () => queueRows(p).find(n => n.textContent.includes('0004'));
      p.press(row().children[0]);
      await p.settle();
      p.press(buttons(p, row()).find(b => b.textContent === 'Full ticket'));
    }
    await p.settle();
    assert.equal(pane(p).hidden, false, `${status}: the full view opens`);
    assert.equal(bar(p), undefined, `${status}: no Set ready bar`);
  }
});

test('0617 AC2: with one ready check error, the bar\'s Set ready is disabled and says which, in one line', async () => {
  const p = await openDraft(full('0005', ONE));
  const [b] = buttons(p, bar(p));
  assert.equal(b.disabled, true);
  const why = of(p, 'why', bar(p));
  assert.equal(why.textContent, 'Fix the ready check error first: Outcome contains "and": one outcome per ticket.');
  assert.equal(why.title, why.textContent, 'the whole line when it is cut short');
  const r = rule('#full-ticket .ready-bar .why');
  assert.equal(get(r, 'white-space'), 'nowrap', 'one line');
  assert.equal(get(r, 'text-overflow'), 'ellipsis');
});

test('0617 AC2: with several errors, it counts them and points at the list above', async () => {
  const p = await openDraft(full('0006', TWO));
  assert.equal(buttons(p, bar(p))[0].disabled, true);
  assert.equal(of(p, 'why', bar(p)).textContent, 'Fix the 2 ready check errors above first.');
});

test('0617 AC2: with an error count but no messages, it still says why, without pointing at lines that aren\'t there', async () => {
  const p = await openDraft(full('0010', { lint: { errors: 3, warnings: 0 }, lint_messages: undefined }));
  assert.equal(buttons(p, bar(p))[0].disabled, true);
  assert.equal(of(p, 'why', bar(p)).textContent, "Fix the ready check first: a ticket that fails it can't be ready.");
});

test('0617 AC2: with no errors there is no line, and a refusal from the server shows in the bar whole', async () => {
  const reason = 'Not ready:\n  ✗ size L can never be ready: split it into sibling tickets.';
  const s = { tickets: [full('0007')], ideas: [] };
  const p = await openDraft(full('0007'), [{ status: 422, body: { error: reason } }, clone(s)]);
  assert.equal(of(p, 'why', bar(p)), undefined, 'nothing to say');
  click(buttons(p, bar(p))[0]);
  await p.settle();
  assert.equal(of(p, 'refused', bar(p)).textContent, reason);
  assert.equal(get(rule('#full-ticket .ready-bar .why.bad'), 'white-space'), 'pre-wrap', 'not cut to one line');
});

test('0617 AC2: when a refresh brings an error, the bar follows it and the rest of the view keeps its nodes', async () => {
  const s = t => ({ tickets: [t], ideas: [] });
  const changed = full('0008', ONE);
  const p = await openDraft(full('0008'), [s(changed), s(clone(changed))]);
  const body = pane(p).children[2];
  await refresh(p);
  assert.equal(buttons(p, bar(p))[0].disabled, true);
  assert.match(of(p, 'why', bar(p)).textContent, /^Fix the ready check error first/);
  assert.equal(pane(p).children[2], body, 'the body stays');
  assert.equal(pane(p).children.at(-1), bar(p), 'and the bar is still last');
  const now = bar(p);
  await refresh(p);
  assert.equal(bar(p), now, 'unchanged: the bar keeps its nodes');
});

test('0617 AC3: the readiness list stays in the view, above the bar', async () => {
  const p = await openDraft(full('0009', ONE));
  const [, , body] = pane(p).children;
  const ready = body.children[0];
  assert.match(ready.className, /\bready\b/);
  assert.equal(ready.children[0].textContent, 'Ready check');
  assert.ok(ready.textContent.includes('Outcome contains "and"'), 'with its lines');
  assert.equal(buttons(p, ready).length, 0, 'its Set ready is in the bar now');
  const kids = pane(p).children;
  assert.ok(kids.indexOf(body) < kids.indexOf(bar(p)), 'above the bar');
});
