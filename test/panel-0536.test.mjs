import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, full, T, notes, page, cssRules } from './support/panel.mjs';

// ---------- 0536: Capture says how many notes it lists, under its title ----------

const note = (name, status) => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\nCaptured: 2026-10-20 · Status: ${status}\n\n## What\nThe text of ${name}.\n` });
const board = ideas => ({ tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready')], ideas });
const opened = async (...boards) => { const p = fakePage(boards); await p.settle(); return p; };
const count = p => p.byId('capture-n');
const next = async p => { p.timers.shift()(); await p.settle(); }; // the next board update

test('0536 AC1: the count sits under Capture\'s title, as a lane-n line like Build\'s and Shipped\'s', () => {
  const html = page();
  assert.match(html, /<h2 class="lane-title">Capture<\/h2>\s*<div class="lane-n" id="capture-n"><\/div>\s*<div id="capture" class="lane-list">/);
});

test('0536 AC1: one note in Capture says "1 note"', async () => {
  const p = await opened(board([note('only-idea', 'idea'), note('ticketed-one', 'ticketed (0001)')]));
  assert.equal(notes(p).length, 1);
  assert.equal(count(p).textContent, '1 note');
  assert.equal(count(p).hidden, false);
});

test('0536 AC1: more notes say "<n> notes", counting only idea and inbox notes', async () => {
  const ideas = [...Array.from({ length: 33 }, (_, i) => note(`idea-${i}`, 'idea')), note('in-a', 'inbox'), note('in-b', 'inbox'),
    note('ticketed-one', 'ticketed (0001)'), note('dropped-one', 'dropped'), note('blank', '')];
  const p = await opened(board(ideas));
  assert.equal(notes(p).length, 35);
  assert.equal(count(p).textContent, '35 notes');
});

test('0536 AC2: with no notes in Capture, the count line is hidden and the lane says "Nothing captured."', async () => {
  const p = await opened(board([note('ticketed-one', 'ticketed (0001)'), note('dropped-one', 'dropped')]));
  assert.equal(count(p).hidden, true);
  assert.equal(count(p).textContent, '');
  assert.equal(p.byId('capture').textContent, 'Nothing captured.');
});

test('0536 AC3: the count follows notes added, ticketed and dropped with each board update', async () => {
  const p = await opened(
    board([note('a', 'idea'), note('b', 'inbox')]),
    board([note('a', 'idea'), note('b', 'inbox'), note('c', 'idea')]),
    board([note('a', 'ticketed (0001)'), note('b', 'inbox'), note('c', 'dropped')]),
    board([note('a', 'ticketed (0001)'), note('b', 'dropped'), note('c', 'dropped')]),
    board([note('a', 'ticketed (0001)'), note('b', 'dropped'), note('c', 'dropped'), note('d', 'inbox')]),
  );
  assert.equal(count(p).textContent, '2 notes');
  await next(p);
  assert.equal(count(p).textContent, '3 notes', 'a note added');
  await next(p);
  assert.equal(count(p).textContent, '1 note', 'one ticketed and one dropped');
  await next(p);
  assert.equal(count(p).hidden, true, 'the last one dropped');
  assert.equal(p.byId('capture').textContent, 'Nothing captured.');
  await next(p);
  assert.equal(count(p).hidden, false, 'shown again when a note comes in');
  assert.equal(count(p).textContent, '1 note');
});

test('0536 AC4: no style sets Capture\'s count apart from the other lanes\' count lines', () => {
  assert.equal(cssRules('#capture-n').length, 0);
});
