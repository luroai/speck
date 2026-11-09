import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { read, TICKET } from './support/merge-rounds.mjs';
import { changesRepo } from './support/changes.mjs';
import { T, fakePage, queueRows, round, fullViewOf } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';

// ---------- 0588: what changed in a ticket's criteria, in its row and full view ----------

const OLD = '1. Export button downloads a CSV.';
const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');
function edit(r, fn) {
  fs.writeFileSync(path.join(r.wt, TICKET), fn(read(r.wt, TICKET)));
  gIn(r.wt, 'commit', '-qam', 'edit the ticket');
}

test('0588 AC1: status gives a reworded criterion as it was when set ready and as it is now, from the CLI too', () => {
  const r = changesRepo();
  assert.equal(shown(r).criteria_changes, null, 'nothing changed yet');
  edit(r, s => s.replace(OLD, '1. Export button downloads an Excel file.'));
  const want = [{ n: 1, change: 'changed', before: 'Export button downloads a CSV.', now: 'Export button downloads an Excel file.' }];
  assert.deepEqual(shown(r).criteria_changes, want);
  assert.deepEqual(JSON.parse(runIn(r.dir, 'status', '--json').stdout).tickets.find(t => t.id === '0001').criteria_changes, want);
});

test('0588 AC1: an added criterion has no text from when it was set ready, and a removed one has no text now', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, `${OLD}\n2. It has a header row.`));
  assert.deepEqual(shown(r).criteria_changes, [{ n: 2, change: 'added', before: null, now: 'It has a header row.' }]);
  const gone = changesRepo();
  edit(gone, s => s.replace(OLD, '').replace('## Acceptance criteria\n', '## Acceptance criteria\nNone left.\n'));
  assert.deepEqual(shown(gone).criteria_changes, [{ n: 1, change: 'removed', before: 'Export button downloads a CSV.', now: null }]);
});

test('0588 AC1: a change that leaves every criterion\'s words alone gives the whole section, before and now', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, `Reworked.\n\n${OLD}`));
  const [only, ...more] = shown(r).criteria_changes;
  assert.deepEqual(more, []);
  assert.equal(only.n, null);
  assert.equal(only.change, 'order or layout');
  assert.equal(only.before, OLD);
  assert.equal(only.now, `Reworked.\n\n${OLD}`);
});

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => T('0701', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], build_exit: { at: ago(30), code: 0 }, auto_ship: false, acceptance_criteria: ['First.', 'Second, now.', 'Third.'], ...o });
const page = async t => {
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: [t], ideas: [], run: { on: true } }))) }) });
  await p.settle();
  return p;
};
const CHANGED = { n: 2, change: 'changed', before: 'Second, then.', now: 'Second, now.' };
const changed = (...items) => ({ criteria_changed: true, criteria_changes: items });
const of = (p, root, cls) => p.all(root).filter(n => (n.className || '').split(' ').includes(cls));
const view = async (t) => { const p = await page(t); return { p, pane: await fullViewOf(p, '0701') }; };

test('0588 AC2: the full view has a callout above the facts, with speck sheepish and what it changed', async () => {
  const { p, pane } = await view(approved(changed(CHANGED)));
  const steps = of(p, pane, 'steps')[0], [callout] = of(p, pane, 'criteria-callout');
  const parts = steps.children.map(c => c.className);
  assert.ok(parts.indexOf('criteria-callout') >= 0 && parts.indexOf('criteria-callout') < parts.indexOf('facts'), `above the facts: ${parts}`);
  const face = p.all(callout).find(n => n.attrs?.['data-mood']);
  assert.equal(face.attrs['data-mood'], 'sheepish');
  assert.equal(of(p, callout, 'callout-head')[0].textContent, 'I changed criterion 2 while building');
});

test('0588 AC2: each change is shown as Was and Now, and a line says it will not ship by itself', async () => {
  const { p, pane } = await view(approved(changed(CHANGED, { n: 3, change: 'changed', before: 'Third, then.', now: 'Third.' })));
  const [callout] = of(p, pane, 'criteria-callout');
  assert.equal(of(p, callout, 'callout-head')[0].textContent, 'I changed criteria 2 and 3 while building');
  const rows = of(p, callout, 'was-now').map(n => [...n.children.map(c => c.textContent)]);
  assert.deepEqual(rows, [['Was', 'Second, then.'], ['Now', 'Second, now.'], ['Was', 'Third, then.'], ['Now', 'Third.']]);
  assert.match(of(p, callout, 'callout-line')[0].textContent, /won't ship by itself/);
});

test('0588 AC2: added, removed and layout changes say so, an added one has no Was and a removed one no Now', async () => {
  const { p, pane } = await view(approved(changed(CHANGED, { n: 3, change: 'added', before: null, now: 'Third.' }, { n: 4, change: 'removed', before: 'Fourth.', now: null })));
  const [callout] = of(p, pane, 'criteria-callout');
  assert.equal(of(p, callout, 'callout-head')[0].textContent, 'I changed criterion 2, added criterion 3 and removed criterion 4 while building');
  const rows = of(p, callout, 'was-now').map(n => n.children.map(c => c.textContent));
  assert.deepEqual(rows.slice(2), [['Was', '(none)'], ['Now', 'Third.'], ['Was', 'Fourth.'], ['Now', '(none)']]);
  const layout = await view(approved(changed({ n: null, change: 'order or layout', before: '1. A', now: 'Note\n\n1. A' })));
  assert.equal(of(layout.p, layout.pane, 'callout-head')[0].textContent, 'I changed the order or layout of the criteria while building');
});

test('0588 AC2: it shows on a ticket still being built, and not on one with nothing changed or from an older status', async () => {
  const live = await view(T('0701', 'reviewing', { started: ago(900), ...changed(CHANGED) }));
  assert.equal(of(live.p, live.pane, 'criteria-callout').length, 1);
  for (const o of [{ criteria_changed: false, criteria_changes: null }, {}]) {
    const none = await view(approved(o));
    assert.equal(of(none.p, none.pane, 'criteria-callout').length, 0);
  }
});

test('0588 AC2: text that isn\'t what status gives is left out rather than breaking the view', async () => {
  const odd = await view(approved(changed({ n: 2, change: 'changed', before: 5, now: { a: 1 } }, null, 'x')));
  assert.equal(of(odd.p, odd.pane, 'callout-head')[0].textContent, 'I changed criterion 2 while building');
  const empty = await view(approved(changed()));
  assert.match(of(empty.p, empty.pane, 'criteria-callout')[0].textContent, /won't ship by itself/, 'a changed ticket still says so with no detail');
});

test('0588 AC2: a change appearing on an open full view draws the callout without closing it', async () => {
  let t = approved({});
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: [t], ideas: [], run: { on: true } }))) }) });
  await p.settle();
  const pane = await fullViewOf(p, '0701');
  assert.equal(of(p, pane, 'criteria-callout').length, 0);
  t = approved(changed(CHANGED));
  p.intervals.forEach(i => i.fn());
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(of(p, pane, 'criteria-callout').length, 1);
  assert.equal(pane.hidden, false);
});

test('0588 AC3: each changed criterion in the list is marked "changed", and the others are not', async () => {
  const { p, pane } = await view(approved(changed(CHANGED, { n: 3, change: 'added', before: null, now: 'Third.' }, { n: 9, change: 'removed', before: 'Gone.', now: null })));
  const items = of(p, pane, 'criteria')[0].children;
  assert.deepEqual(items.map(li => of(p, li, 'criterion-mark').map(n => n.textContent)), [[], ['changed'], ['added']]);
});

test('0588 AC4: the Build row reads as the ticket says, and only for an approved ticket whose criteria changed', async () => {
  const p = await page(approved(changed(CHANGED)));
  assert.equal(of(p, queueRows(p)[0], 'said')[0].textContent, 'Approved · waiting at Ship: a criterion changed');
  const same = await page(approved({ criteria_changed: false, criteria_changes: null }));
  assert.ok(!/criterion changed/.test(of(same, queueRows(same)[0], 'said')[0].textContent));
});
