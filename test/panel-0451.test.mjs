import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SETTING_GROUPS } from '../scripts/settings.mjs';
import { ROOT, fakePage } from './support/panel.mjs';
import { foreman, state } from './support/bar.mjs';

// ---------- 0451: the bar's button doesn't say "FIXING ON" (0581: the screen's clock went with it) ----------

async function shown(o = {}) {
  const p = fakePage([state(foreman({ word: 'Idle', ...o }))]);
  await p.settle();
  return { p };
}

test('0451 AC3: the screen\'s accessible name no longer mentions fixing; Settings still says whether it\'s on', async () => {
  for (const fixing of ['fix', 'tell', 'off', null]) {
    const { p } = await shown({ fixing, fixing_says: fixing ? `the ${fixing} setting` : '' });
    const name = p.byId('run').textContent, tip = p.byId('run').title; // 0580: its name is the text in it
    assert.equal(p.byId('run').attrs['aria-label'], undefined, `with ${fixing}`);
    assert.match(tip, /^speck: Idle · /, `with ${fixing}`); // 0485: the word is in its tooltip
    assert.doesNotMatch(name + tip, /fixing/i);
    // 0458: the Pipeline pop-up shows only the log, so it no longer says it
  }
  assert.ok(SETTING_GROUPS.find(g => g.title === 'Your engineering manager').settings.some(s => s.key === 'watch'), 'Settings still has watch');
});

// 0491: the README is checked by review.
test('0451 AC1: the brief doesn\'t say the screen shows "Fixing on"', () => {
  for (const f of ['docs/brief.md']) assert.ok(!fs.readFileSync(path.join(ROOT, f), 'utf8').includes('"Fixing on"'), f);
});
