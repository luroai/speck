import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { D, board, buttons, openList } from './support/decided.mjs';

// ---------- 0611: Decided for you's back link names the lane ----------

const back = p => p.all(p.byId('decided')).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className));
const lanes = [['build', 'Build'], ['plan', 'Plan'], ['capture', 'Capture'], ['shipped', 'Shipped']];

test('0611 AC1 AC2: the back link reads the open lane\'s name, and a screen reader hears "Back to" it', async () => {
  for (const [lane, name] of lanes) {
    const p = board([T('0001', 'done')], [D('0001')]);
    await p.settle();
    p.press(p.byId(`tab-${lane}`));
    await openList(p);
    const b = back(p);
    assert.ok(b, `${lane}: a back link`);
    assert.equal(b.textContent, name, `${lane}: its name (the ‹ comes from the style, as the other views')`);
    assert.equal(b.attrs['aria-label'], `Back to ${name}`, `${lane}: its accessible name`);
    assert.equal(buttons(p, 'Close').length, 0, `${lane}: no Close`);
  }
});

test('0611 AC3: pressing it, or Escape, closes Decided for you and shows the lane it came from', async () => {
  for (const how of ['press', 'Escape']) {
    const p = board([T('0001', 'done')], [D('0001')]);
    await p.settle();
    p.press(p.byId('tab-plan'));
    await openList(p);
    assert.equal(p.byId('decided').hidden, false);
    if (how === 'press') p.press(back(p)); else p.key('Escape');
    await p.settle();
    assert.equal(p.byId('decided').hidden, true, `${how}: closed`);
    assert.equal(p.byId('tab-plan').attrs['aria-selected'], 'true', `${how}: Plan still open`);
    assert.equal(p.byId('shaping-section').hidden, false, `${how}: Plan's lane shown`);
  }
});
