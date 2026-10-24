import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenPage, foreman, state, wordDots, clockDots, expected, CLOCK } from './support/screen.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { SETTING_GROUPS } from '../scripts/settings.mjs';
import { ROOT } from './support/panel.mjs';

// ---------- 0451: the time at the top right of speck's screen, in place of "FIXING ON" ----------

// A `Date` whose clock the test sets, in this computer's time zone.
const clock = () => {
  let at = Date.now();
  class D extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } }
  return { Date: D, set(h, m, s = 0, ms = 0) { at = new Date(2026, 9, 24, h, m, s, ms).getTime(); } };
};
const reduced = matches => q => ({ matches: matches && /reduced-motion/.test(q), addEventListener() {} });
async function shown(o = {}, globals = {}) {
  const c = clock(), p = screenPage([state(foreman({ word: 'Idle', ...o }))], { Date: c.Date, ...globals });
  await p.settle();
  return { p, c };
}

test('0451 AC1: the top right of speck\'s screen shows the time as HH:MM in the 24-hour clock, in the dot font', async () => {
  const { p, c } = await shown();
  for (const [h, m, text] of [[9, 5, '09:05'], [21, 7, '21:07'], [0, 0, '00:00'], [23, 59, '23:59'], [12, 30, '12:30']]) {
    c.set(h, m, 0, 100);
    const top = p.draw(1000, false);
    assert.deepEqual(clockDots(top), expected(text, CLOCK.left, 2), text);
    assert.deepEqual(wordDots(top), expected('IDLE', 4, 2), `the word beside it: ${text}`);
  }
});

test('0451 AC1: the clock\'s colon blinks once a second', async () => {
  const { p, c } = await shown();
  for (const s of [0, 1, 2, 59]) {
    c.set(14, 30, s, 0);
    assert.deepEqual(clockDots(p.draw(1000, false)), expected('14:30', CLOCK.left, 2), `on at the start of second ${s}`);
    c.set(14, 30, s, 499);
    assert.deepEqual(clockDots(p.draw(1000, false)), expected('14:30', CLOCK.left, 2), `still on just before half way: ${s}`);
    c.set(14, 30, s, 500);
    assert.deepEqual(clockDots(p.draw(1000, false)), expected('14 30', CLOCK.left, 2), `off for the second half: ${s}`);
    c.set(14, 30, s, 999);
    assert.deepEqual(clockDots(p.draw(1000, false)), expected('14 30', CLOCK.left, 2), `off until the next second: ${s}`);
  }
});

test('0451 AC1: "FIXING ON" no longer shows anywhere on the screen, with foreman_fixing fix', async () => {
  for (const fixing of ['fix', 'tell', 'off']) {
    const { p, c } = await shown({ fixing });
    c.set(8, 15, 0, 0);
    const all = p.draw(1000, false), top = new Set(all.filter(([, r]) => r < 11).map(([x, y]) => `${x},${y}`));
    assert.deepEqual(top, new Set([...expected('IDLE', 4, 2), ...expected('08:15', CLOCK.left, 2)]), `only the word and the time: ${fixing}`);
    assert.ok(!p.made().draw.toString().includes('FIXING'), 'the screen draws no "FIXING ON"');
  }
});

test('0451 AC1: a word too wide for the top row is cut short before the clock, and scrolls without covering it', async () => {
  const word = 'Waiting: the base branch is failing its tests';
  const { p, c } = await shown({ word });
  c.set(10, 0, 0, 0);
  const start = [...expected(word.toUpperCase(), 4, 2)].filter(d => Number(d.split(',')[0]) <= CLOCK.wordRight);
  assert.deepEqual(wordDots(p.draw(5000, false)), new Set(start), 'its start, cut before the clock');
  for (const t of [5000, 5000 + 1800 + 1000, 5000 + 1800 + 4000, 5000 + 1800 + 9000]) {
    assert.deepEqual(clockDots(p.draw(t, false)), expected('10:00', CLOCK.left, 2), `the clock is whole at ${t}`);
  }
});

test('0451 AC2: with reduced motion on, the colon doesn\'t blink', async () => {
  const { p, c } = await shown({}, { matchMedia: reduced(true), devicePixelRatio: 1 });
  for (const ms of [0, 250, 500, 750, 999]) {
    c.set(7, 45, 3, ms);
    assert.deepEqual(clockDots(p.draw(1000, false)), expected('07:45', CLOCK.left, 2), `the colon stays at ${ms} ms`);
  }
  const { p: q, c: d } = await shown({}, { matchMedia: reduced(false), devicePixelRatio: 1 });
  d.set(7, 45, 3, 750);
  assert.deepEqual(clockDots(q.draw(1000, false)), expected('07 45', CLOCK.left, 2), 'and blinks without it');
});

test('0451 AC3: the screen\'s accessible name no longer mentions fixing; Settings still says whether it\'s on', async () => {
  for (const fixing of ['fix', 'tell', 'off', null]) {
    const { p } = await shown({ fixing, fixing_says: fixing ? `the ${fixing} setting` : '' });
    const name = p.byId('run').attrs['aria-label'];
    assert.equal(name, 'The Foreman: Idle', `with ${fixing}`);
    assert.doesNotMatch(name, /fixing/i);
    // 0458: the Pipeline pop-up shows only the log, so it no longer says it
  }
  assert.ok(SETTING_GROUPS.find(g => g.title === 'Foreman').settings.some(s => s.key === 'foreman_fixing'), 'Settings still has foreman_fixing');
});

test('0451 AC1: neither the README nor the brief says the screen shows "Fixing on"', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.ok(!fs.readFileSync(path.join(ROOT, f), 'utf8').includes('"Fixing on"'), f);
});
