import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, page, styles } from './support/panel.mjs';

// ---------- 0364: the panel's header on one row, with the project always shown ----------

const css = () => styles();

// A board long enough to scroll, with the Foreman reading `word`. 0002 waits on 0001, so its row jumps to 0001 (0154).
const board = (word = 'Building 1', tone = 'ok', fixing = null) => ({
  tickets: [
    full('0001', { problem: Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a long problem.`).join('\n\n') }),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    ...Array.from({ length: 24 }, (_, i) => full(String(i + 10).padStart(4, '0'))),
  ],
  ideas: [],
  run: { on: true, pid: 1 },
  foreman: { word, tone, ...(fixing ? { fixing } : {}) },
});

// ---------- the Foreman's button, on the fake page ----------

const SpeckLCD = { badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; }, mini() { throw new Error('no mini builder in the header'); } };
const foremanPage = (word, tone) => fakePage([board(word, tone), board(word, tone)], { SpeckLCD });

test('0364 AC4: pressing the Foreman\'s button still opens and closes its detail', async () => {
  const p = foremanPage('Building 1', 'ok');
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
  p.press(p.byId('run'));
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
  assert.equal(p.byId('foreman').hidden, false);
  p.press(p.byId('run'));
  assert.equal(p.byId('run').attrs['aria-expanded'], 'false');
  assert.equal(p.byId('foreman').hidden, true);
});

test('0364 AC1: the header has no slimming as you scroll, in its styles or its script', () => {
  assert.doesNotMatch(css(), /header\.slim|header\.wide|head-slim|head-wide/);
  assert.doesNotMatch(page(), /classList\.(add|remove|contains)\('slim'/);
});

// 0413: the one-row header these checked in a browser, and the Foreman's word in its own button, are now speck's
// screen in its frame (panel-0413.test.mjs).
