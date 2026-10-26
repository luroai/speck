import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { full, fakePage, panelModel, idea, click, notes, top } from './support/panel.mjs';

// ---------- 0056: ticketed ideas leave the panel's Ideas list ----------

const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const titleOf = n => top(n).children[0].textContent.replace(/^idea/, '');
const isOpen = n => /\bopen\b/.test(n.className) && n.textContent.includes('Status:'); // open, with its note showing

test('0056 AC1: Ideas leaves out every ticketed, inbox and dropped idea and shows the rest in JSON order', () => {
  const m = panelModel()({ tickets: [], ideas: [
    idea('T', 'ticketed (0001)'), idea('Zed', 'idea'), idea('I', 'inbox'), idea('Later', 'ticketed'), idea('D', 'dropped'),
    idea('N', null), idea('Colon', 'ticketed: 0007'), idea('Many', 'ticketed (0001, 0002)'), idea('Alpha', 'parked'),
  ] });
  assert.deepEqual(m.ideas.map(i => i.title), ['Zed', 'N', 'Alpha']);
});

test('0056 AC1: a status that only mentions ticketed later, or in another case, still shows', () => {
  const m = panelModel()({ tickets: [], ideas: [idea('Not yet', 'not ticketed'), idea('Upper', 'Ticketed (0001)'), idea('Gone', 'ticketed')] });
  assert.deepEqual(m.ideas.map(i => i.title), ['Not yet', 'Upper'], 'only a status starting with `ticketed` is left out, as `speck status` counts it');
});

test('0056 AC1, AC2 (0520: in Capture): the page lists no ticketed idea, whatever number are ticketed', async () => {
  // 0520: Capture lists only notes whose status is idea or inbox, so the blank and parked ones are left out too, and
  // there's no Ideas button to count them.
  const s = { tickets: [full('0001')], ideas: [idea('One', 'idea'), idea('Done A', 'ticketed (0002)'), idea('Two', null), idea('Done B', 'ticketed (0003)'), idea('Done C', 'ticketed'), idea('Three', 'parked'), idea('Four', 'idea'), idea('Note', 'inbox')] };
  const p = fakePage([s]);
  await p.settle();
  assert.deepEqual(notes(p).filter(n => /\bidea\b/.test(n.className)).map(titleOf), ['One', 'Four']);
  assert.doesNotMatch(p.byId('capture').textContent, /Done|Two|Three/);
});

test('0056 AC3 (0520: in Capture): with every idea ticketed, Capture has no idea card, and with nothing else says "Nothing captured."', async () => {
  const s = { tickets: [], ideas: [idea('Done A', 'ticketed (0002)'), idea('Note', 'inbox'), idea('Gone', 'dropped')] };
  const p = fakePage([s]);
  await p.settle();
  assert.deepEqual(notes(p).map(n => /\bidea\b/.test(n.className)), [false], 'only the inbox note');
  const q = fakePage([{ tickets: [], ideas: [idea('Done A', 'ticketed (0002)'), idea('Gone', 'dropped')] }]);
  await q.settle();
  assert.equal(notes(q).length, 0);
  assert.equal(q.byId('capture').textContent, 'Nothing captured.');
});

test('0056 AC3 (0520: in Capture): with no ideas at all, Capture says "Nothing captured."', async () => {
  const p = fakePage([{ tickets: [], ideas: [] }]);
  await p.settle();
  assert.equal(p.byId('capture').textContent, 'Nothing captured.');
});

test('0056 AC4: an open idea that becomes ticketed leaves the list on the next refresh, and the other open ideas stay open', async () => {
  const s = { tickets: [], ideas: [idea('Alpha', 'idea'), idea('Beta', 'idea'), idea('Gamma', 'idea')] }; // 0520: Capture lists only idea and inbox notes
  const next = clone(s);
  next.ideas[1].status = 'ticketed (0009)';
  next.ideas[1].body = '# Beta\n\nStatus: ticketed (0009)\n';
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  for (let k = 0; k < 3; k++) click(top(notes(p)[k]));
  assert.ok(notes(p).every(isOpen), 'all three open');
  await refresh(p);
  assert.deepEqual(notes(p).map(titleOf), ['Alpha', 'Gamma'], 'Beta left the list');
  assert.ok(notes(p).every(isOpen), 'the others stayed open');
  assert.equal(notes(p).length, 2);
  await refresh(p);
  assert.ok(notes(p).every(isOpen), 'and through another refresh');
});
