import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, full, idea, click, toggles } from './support/panel.mjs';
import { rules, rule, get } from './support/css.mjs';
import { looks, contrast, over, rgba, toHex } from './support/contrast.mjs';

// ---------- 0450: show which Plan list is open at a glance ----------

const STATE = {
  run: { on: false },
  tickets: [full('0201', { title: 'A ticket' })],
  ideas: [idea('2026-10-15-an-idea', 'new'), idea('2026-10-15-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0140\n\nSome text.\n')],
};
const VIEWS = ['tickets', 'ideas', 'inbox'];
const LOOKS = Object.entries(looks());
const token = v => (String(v || '').match(/^var\((--[\w-]+)\)$/) || [])[1];
const on = () => rule('.toggle.on');
const off = () => rule('.toggle');
// The background beside the toggles: the Plan section's own, as the section header sets none.
const beside = () => token(get(rule('section'), 'background'));

// ----- AC1 -----

test('0450 AC1: the selected toggle is filled, its background the text colour and its text the background beside it', () => {
  assert.equal(token(get(on(), 'background')), '--text', '.toggle.on is filled with the text colour');
  assert.equal(token(get(on(), 'color')), beside(), '.toggle.on has the background colour for its text');
  assert.equal(get(rule('.sh'), 'background'), undefined, 'the section header sets no background of its own');
});

test('0450 AC1: the other two toggles stay outlined, and no look or screen size changes the fill', () => {
  assert.equal(get(off(), 'background'), 'transparent');
  assert.equal(token(get(off(), 'color')), '--muted');
  assert.match(get(off(), 'border'), /var\(--line\)/);
  const others = rules().filter(r => r.sel.split(',').some(s => /\.toggle\b/.test(s)) && (r.at.length || !['.toggle', '.toggle.on'].includes(r.sel)));
  for (const r of others) for (const p of ['background', 'background-color', 'color'])
    assert.equal(get(r, p), undefined, `${r.sel} doesn't change the toggles' ${p}`);
});

test('0450 AC1: in the fake page, exactly the open list\'s toggle has the selected class, as each is clicked', async () => {
  const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
  await p.settle();
  for (const [i, view] of VIEWS.entries()) {
    click(toggles(p)[i]);
    const ts = toggles(p);
    assert.deepEqual(ts.map(t => /\bon\b/.test(t.className)), VIEWS.map(v => v === view), `${view} open`);
  }
});

// ----- AC2 -----

test('0450 AC2: each toggle tells a screen reader whether it is selected, and only the open list\'s says it is', async () => {
  const p = fakePage([JSON.parse(JSON.stringify(STATE))]);
  await p.settle();
  for (const [i, view] of VIEWS.entries()) {
    click(toggles(p)[i]);
    const ts = toggles(p);
    assert.equal(ts.length, 3);
    assert.deepEqual(ts.map(t => (t.attrs || {})['aria-pressed']), VIEWS.map(v => String(v === view)), `${view} open`);
  }
});

// ----- AC3 -----

for (const [name, look] of LOOKS) {
  test(`0450 AC3: in the ${name} look, the fill meets 3:1 against the background beside it and its text 4.5:1 against the fill`, () => {
    const back = look[beside()];
    const fill = toHex(over(rgba(look['--text']), rgba(back)));
    const fillVsBack = contrast(fill, back), textVsFill = contrast(look[token(get(on(), 'color'))], fill);
    assert.ok(fillVsBack >= 3, `fill against ${beside()}: ${fillVsBack.toFixed(2)}:1`);
    assert.ok(textVsFill >= 4.5, `text against the fill: ${textVsFill.toFixed(2)}:1`);
  });
}
