import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome } from './support/panel.mjs';
import { STATE, onPhone } from './support/queue-phone.mjs';

// ---------- 0224: keep a queued ticket's tags tappable above a linked id ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// 0204 unlocks 0205, and 0205 waits on 0204. 0468: their ids are in their chips, at the end of their title rows, not
// in their Queued lines.
const CHAINED = STATE({ chained: true });

const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
// A finger-sized tap. Chrome taps at whole pixels, so a test point is a whole pixel inside the area it means to hit.
const tap = async (b, [x, y]) => {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 12, radiusY: 12 }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(b);
};

// For each queued ticket: its Queued line, and for each tag the points of its 44 by 44 px tap area, a 9 by 9 grid
// out to its edges, that don't reach it.
const ROWS = `[...document.querySelectorAll('#queue .q')].map(q => {
  q.scrollIntoView({ block: 'center' });
  const tags = [...q.querySelectorAll('.tag')].map(n => {
    const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, misses = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      const x = cx - 21.5 + i * 43 / 8, y = cy - 21.5 + j * 43 / 8, hit = document.elementFromPoint(x, y);
      if (!(hit === n || n.contains(hit))) misses.push([Math.round(x), Math.round(y), hit && (hit.className || hit.tagName)]);
    }
    return { text: n.textContent, misses };
  });
  return { id: q.querySelector('.id').textContent, line: q.querySelector('.top .act').textContent, tags };
})`;

test('0224 AC1: at 375 px, every point of each queued ticket\'s tags\' 44 by 44 px tap areas reaches its tag, with a linked ticket (0419, 0468)', skip, async () => {
  await onPhone(async b => {
    const rows = await b.js(ROWS);
    // 0434: a closed card's line has only its bug, fix or document tag. 0463: open, its facts are in a table.
    assert.deepEqual(rows.map(r => [r.id, r.line]), [['0204', 'Queued · bug'], ['0205', 'Queued · fix']]);
    for (const row of rows) {
      assert.equal(row.tags.length, 1, `${row.id}: its tag`);
      for (const t of row.tags) assert.deepEqual(t.misses, [], `${row.id} ${t.text}: these points of its 44 px tap area miss it`);
    }
  }, CHAINED);
});

test('0224 AC1: at 375 px, a tap at the bottom edge of a queued ticket\'s tag tap area shows that tag\'s tip, not the linked ticket', skip, async () => {
  await onPhone(async b => {
    for (const id of ['0204', '0205']) {
      const tags = await b.js(`(() => {
        const q = [...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}');
        q.scrollIntoView({ block: 'center' });
        // the bottom row of whole pixels in each tag's tap area, at its left end, middle and right end
        return [...q.querySelectorAll('.tag')].flatMap(t => {
          const r = t.getBoundingClientRect(), cx = r.left + r.width / 2, y = Math.ceil(r.top + r.height / 2 + 22) - 1;
          return [Math.floor(cx - 22) + 1, Math.round(cx), Math.ceil(cx + 22) - 1].map(x => ({ text: t.textContent, tip: t.tip, at: [x, y] }));
        });
      })()`);
      for (const t of tags) {
        // A tip shows just under its tag, over the next tag's tap point, so the last one is closed first, as a scroll does
        await b.js(`document.dispatchEvent(new Event('scroll'))`);
        await b.until(`document.getElementById('tag-tip').hidden`, 'the last tip to close');
        await tap(b, t.at);
        const shown = `!document.getElementById('tag-tip').hidden && document.getElementById('tag-tip').textContent === ${JSON.stringify(t.tip)}`;
        await b.until(shown, `${t.text}'s tip`).catch(() => {}); // the tap's click comes a moment later; checked below
        const after = await b.js(`({ tip: document.getElementById('tag-tip').hidden ? null : document.getElementById('tag-tip').textContent, lit: document.querySelectorAll('.flash').length })`);
        assert.deepEqual(after, { tip: t.tip, lit: 0 }, `${id} ${t.text}: a tap at ${t.at} on the bottom edge of its tap area`);
      }
    }
  }, CHAINED);
});

// 0468: AC2 kept a tap on a linked id in a Queued line clear of the tags; a closed card's ids are in its chip now.
