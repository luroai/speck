import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, shippedRows, stoppedClock } from './support/panel.mjs';


// ---------- 0464: a shipped ticket's own figures. 0587: in its full view, as a shipped ticket no longer opens as a card ----------

// Midday local time, so "today" covers every ticket below that shipped minutes ago.
const NOW = new Date(2026, 9, 23, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();

const TICKETS = [
  T('0901', 'done', { title: 'Every figure', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, total_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
  T('0902', 'done', { title: 'A bug fix', type: 'bug', started: ago(3000), finished: ago(1200), rounds: [round(1, 500)], builder_cost_usd: 1.5, total_cost_usd: 1.5 }),
  T('0903', 'done', { title: 'Nothing at all' }),
  T('0905', 'done', { title: 'Merged, not pushed', started: ago(2000), finished: ago(1400), ship: { running: false, unpushed: true, message: 'Merged, but the push failed: run git push.' } }),
  T('0904', 'done', { title: 'A cost longer than its cell', started: ago(2000), finished: ago(1500), rounds: [round(1, 500)], builder_tokens: 900, builder_cost_usd: 123456789012345.67 }),
];
const board = () => ({ run: { on: false }, ideas: [], tickets: TICKETS });
const page = (states = [board()]) => fakePage(states, { Date: stoppedClock(NOW) });

const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const kids = n => n.children.map(c => c.className);
const meta = (p, id) => p.all(cardOf(p, id)).find(n => n.className === 'meta');
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
// Opens its full view, and returns its five figures' cells, after what the pane shows of every ticket.
async function figures(p, id) {
  p.press(cardOf(p, id));
  await p.settle();
  const f = p.all(p.byId('full-ticket')).find(n => n.className === 'facts');
  return { ...f, children: f.children.slice(-5) };
}

test('0464 AC2 (0587): its full view has Builder cost, Reviewer cost, Total cost, Builder tokens and Reviewer tokens, with — for one it lacks', async () => {
  const p = page();
  await p.settle();
  const a = await figures(p, '0901');
  assert.deepEqual(cells(a), [['Builder cost', '$2.91'], ['Reviewer cost', '—'], ['Total cost', '$2.91'], ['Builder tokens', '2.4M'], ['Reviewer tokens', '108k']]);
  assert.deepEqual(a.children.map(c => c.children[1].title), ['$2.91', '—', '$2.91', '2,412,345', '108,234'], 'a shortened count\'s exact number as its tooltip');
  assert.deepEqual(cells(await figures(p, '0902')), [['Builder cost', '$1.50'], ['Reviewer cost', '—'], ['Total cost', '$1.50'], ['Builder tokens', '—'], ['Reviewer tokens', '500']]);
  assert.deepEqual(cells(await figures(p, '0903')), [['Builder cost', '—'], ['Reviewer cost', '—'], ['Total cost', '—'], ['Builder tokens', '—'], ['Reviewer tokens', '—']]);
});

test('0464 AC2 (0587): a kept row\'s time still turns from the time alone to the date and time after midnight', async () => {
  let at = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  const p = fakePage([board(), board(), board()], { Date: Clock });
  await p.settle();
  const kept = cardOf(p, '0901');
  assert.equal(meta(p, '0901').textContent, '11:50 · 2 rounds · 15 min');
  at = NOW + 13 * 3600 * 1000;
  p.timers.shift()();
  await p.settle();
  assert.equal(cardOf(p, '0901'), kept, 'the same row, kept');
  assert.equal(meta(p, '0901').textContent, '23 Oct, 11:50 · 2 rounds · 15 min');
  assert.match(meta(p, '0901').title, /^Shipped 23 Oct, 11:50/);
});

test('0464 AC3 (0587): a shipped ticket is its title and its one line, with any push warning under them, however often it is pressed', async () => {
  const p = page();
  await p.settle();
  assert.deepEqual(kids(cardOf(p, '0901')), ['name', 'sum'], 'its title and its one line');
  assert.equal(meta(p, '0901').textContent, '11:50 · 2 rounds · 15 min');
  assert.deepEqual(kids(cardOf(p, '0905')), ['name', 'sum', 'unpushed'], 'one not pushed says so under its line');
  await figures(p, '0901');
  assert.deepEqual(kids(cardOf(p, '0901')), ['name', 'sum'], 'pressed, it stays one row');
});

test('0464 AC4 (0587): a screen reader reads each of the full view\'s figures as its label, then its value', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0901', '0903']) {
    for (const c of (await figures(p, id)).children) {
      assert.equal(c.tagName, 'div', `${id}: a cell is a group in the list`);
      assert.deepEqual(c.children.map(n => n.tagName), ['dt', 'dd'], `${id}: its label is a term, its value its description`);
      assert.ok(c.children[0].textContent && c.children[1].textContent, `${id}: both have words`);
    }
  }
});
