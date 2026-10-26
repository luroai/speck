import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, full, idea } from './support/panel.mjs';
import { rules } from './support/css.mjs';

// ---------- 0450: show which Plan list is open at a glance ----------

// 0520: Plan's Tickets, Ideas and Inbox buttons are gone; ideas and the inbox have their own Capture lane, so there is
// no selected toggle to fill or announce. What's left to check is that nothing of them remains.

const STATE = {
  run: { on: false },
  tickets: [full('0201', { title: 'A ticket' })],
  ideas: [idea('2026-10-15-an-idea', 'idea'), idea('2026-10-15-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0140\n\nSome text.\n')],
};

test('0450 (0520): no toggle is drawn in Plan, and no rule styles one', async () => {
  const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
  await p.settle();
  assert.ok(!p.all(p.byId('shaping-section')).some(n => /\btoggle\b/.test(n.className || '') || (n.attrs || {})['aria-pressed'] !== undefined), 'no toggle in Plan');
  assert.ok(!rules().some(r => r.sel.split(',').some(s => /\.toggle\b/.test(s))), 'no .toggle rule');
});
