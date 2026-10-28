import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fakePage, click, notes, panelModel } from './support/panel.mjs';
import { ideaStatus } from '../scripts/core.mjs';

// ---------- 0537: notes from the same day are listed in Capture newest first by the time on their Captured line ----------

const Y = new Date().getFullYear();
const note = (name, status, captured) => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\n${captured === null ? '' : `Captured: ${captured} · `}Status: ${status}\n\n## What\nThe whole text of ${name}.\n` });
const order = ideas => panelModel()({ tickets: [], ideas }).capture.map(i => i.title);
const cards = async ideas => {
  const p = fakePage([{ tickets: [], ideas }]);
  await p.settle();
  click(p.byId('tab-capture'));
  return notes(p).map(n => [p.all(n).find(x => /\btitle\b/.test(x.className)).textContent, n.textContent]);
};

test('0537 AC1: a Captured line with a time still gives the note its status', () => {
  assert.equal(ideaStatus(`# A\n\nCaptured: ${Y}-10-27 14:32 · Status: idea\n`), 'idea');
  assert.equal(ideaStatus(`# A\n\nCaptured: ${Y}-10-27 14:32 · Status: inbox\nFrom ticket: 0001\n`), 'inbox');
});

test('0537 AC1: a note with a time has the same card date as one without', async () => {
  const shown = await cards([note('timed', 'idea', `${Y}-10-27 14:32`), note('untimed', 'idea', `${Y}-10-27`)]);
  assert.equal(shown.length, 2, 'both are listed as ideas');
  for (const [title, text] of shown) {
    assert.match(text, /Captured 27 Oct/, `${title} says when it was captured`);
    assert.doesNotMatch(text, /14:32/, `${title} shows no time`);
  }
});

test('0537 AC2: notes from the same day are listed latest time first, then those with no time in the order given', () => {
  assert.deepEqual(order([
    note('a-early', 'idea', `${Y}-10-27 09:05`),
    note('b-untimed', 'idea', `${Y}-10-27`),
    note('c-older-day', 'idea', `${Y}-10-26 23:59`),
    note('d-late', 'inbox', `${Y}-10-27 14:32`),
    note('e-undated', 'idea', null),
    note('f-untimed', 'idea', `${Y}-10-27`),
    note('g-newer-day', 'idea', `${Y}-10-28`),
    note('h-midnight', 'idea', `${Y}-10-27 00:00`),
    note('i-impossible', 'idea', `${Y}-02-30 10:00`),
  ]), ['g-newer-day', 'd-late', 'a-early', 'h-midnight', 'b-untimed', 'f-untimed', 'c-older-day', 'e-undated', 'i-impossible']);
});

test('0537 AC2: the time decides the order, whatever the file names or the order given', () => {
  const late = note('aaa', 'idea', `${Y}-10-27 14:32`), early = note('zzz', 'idea', `${Y}-10-27 09:05`);
  assert.deepEqual(order([early, late]), ['aaa', 'zzz']);
  const late2 = note('zzz', 'idea', `${Y}-10-27 14:32`), early2 = note('aaa', 'idea', `${Y}-10-27 09:05`);
  assert.deepEqual(order([early2, late2]), ['zzz', 'aaa']);
});

test('0537 AC3: a time that is not a real time sorts as no time', () => {
  for (const bad of ['25:00', '9:5', '12:60', '9:05', '24:00', '12:5x', '12:345']) {
    assert.deepEqual(order([
      note('untimed', 'idea', `${Y}-10-27`),
      note('bad', 'idea', `${Y}-10-27 ${bad}`),
      note('timed', 'idea', `${Y}-10-27 00:01`),
    ]), ['timed', 'untimed', 'bad'], `${bad} counts as no time`);
  }
});

test('0537 AC3: a note with a time that is not real shows its date as one with no time', async () => {
  const shown = await cards([note('bad', 'idea', `${Y}-10-27 25:00`), note('worse', 'idea', `${Y}-10-27 9:5`)]);
  assert.equal(shown.length, 2);
  for (const [title, text] of shown) assert.match(text, /Captured 27 Oct/, title);
});

test('0537 AC4: the capture and follow-up note formats write the time on the Captured line', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  assert.match(read('skills/speck-capture/SKILL.md'), /^ *Captured: <YYYY-MM-DD HH:MM> · Status: idea$/m);
  assert.match(read('skills/speck-build/SKILL.md'), /^ *Captured: <YYYY-MM-DD HH:MM> · Status: inbox$/m);
  for (const f of ['skills/speck-capture/SKILL.md', 'skills/speck-build/SKILL.md'])
    assert.doesNotMatch(read(f), /Captured: <date>/, `${f} has no line without the time`);
});
