import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { model } from './support/panel.mjs';
import { timeLine } from './support/time-line-0500.mjs';

// ---------- 0500: the 0484 checks of a blocked ticket's time hold however long the panel takes to start ----------

const counter = vm.runInNewContext(`${model()}\ncounter`, {}); // the page's own MM:SS
const STARTED = 5990; // 0484's blocked tickets start this many seconds before its file loads
const BUG = { before: 'speck will answer · Review 2', after: 'bug' };
// The line the panel shows `late` seconds after the file loaded, and the check 0484 makes of it when it reads it then.
const shown = late => `${BUG.before} · ${counter((STARTED + late) * 1000)} · ${BUG.after}`;
const check = (text, late) => timeLine(text, { ...BUG, least: STARTED, most: STARTED + late + 1 });

test('0500 AC1: the blocked bug ticket\'s line passes 0484\'s check when the panel starts 60 s late, or later', () => {
  for (const late of [0, 9, 10, 60, 61, 600, 4000]) check(shown(late), late);
  assert.equal(shown(60), 'speck will answer · Review 2 · 100:50 · bug', 'what 0484 failed on: the time past 99:59');
});

test('0500 AC2: the check still fails when the line\'s words, stage, form of time or tag change', () => {
  const ok = shown(60);
  const changed = {
    words: ok.replace('speck will answer', 'speck answers'),
    stage: ok.replace('Review 2', 'Review 3'),
    'hours and minutes': ok.replace('100:50', '1:40:50'),
    'minutes under an hour': `${BUG.before} · 59:50 · ${BUG.after}`,
    'minutes and seconds in words': ok.replace('100:50', '100m 50s'),
    'seconds only': ok.replace('100:50', '6050'),
    'one-digit seconds': ok.replace('100:50', '100:5'),
    tag: ok.replace(/bug$/, 'fix'),
    'no tag': ok.replace(/ · bug$/, ''),
  };
  for (const [what, text] of Object.entries(changed)) assert.throws(() => check(text, 60), assert.AssertionError, `${what}: ${text}`);
  assert.throws(() => check(shown(60), 0), assert.AssertionError, 'a time later than the clock allows');
  assert.throws(() => timeLine(`${BUG.before} · 99:40 · ${BUG.after}`, { ...BUG, least: STARTED, most: STARTED + 60 }), assert.AssertionError, 'a time from before the ticket started');
});

test('0500 AC1 AC2: 0484\'s checks of the blocked ticket\'s time use the clock, not a fixed 99:5x', () => {
  const src = fs.readFileSync(new URL('./panel-0484.test.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /99:5/, 'no fixed 99:5x');
  assert.match(src, /const bugLine = \(text, message\) => timeLine\(/, 'its line is checked with timeLine');
  assert.equal((src.match(/bugLine\(bug/g) || []).length, 2, 'both checks of its line go through it');
  assert.match(src, /\\d\+:\\d\\d/, 'the copy check blanks a time of any number of minutes');
});
