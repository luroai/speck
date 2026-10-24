import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome } from './support/panel.mjs';
import { onPhone } from './support/queue-phone.mjs';

// ---------- 0190: a queued ticket's Queued line stays clear of its tags' tap areas on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// For each queued ticket: its tags, the points of each tag's 44 by 44 px tap area that don't reach it, and whether
// each tag is in its Queued line (0419: the tags follow "Queued" in that line, under the title).
const ROWS = `[...document.querySelectorAll('#queue .q')].map(q => {
  q.scrollIntoView({ block: 'center' });
  const act = q.querySelector('.top .act');
  const tags = [...q.querySelectorAll('.tag')].map(n => {
    const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const points = [[cx - 21.5, cy - 21.5], [cx + 21.5, cy - 21.5], [cx - 21.5, cy + 21.5], [cx + 21.5, cy + 21.5], [cx, cy - 21.5], [cx, cy + 21.5], [cx - 21.5, cy], [cx + 21.5, cy]];
    return { text: n.textContent, inLine: act.contains(n),
      misses: points.filter(([x, y]) => { const hit = document.elementFromPoint(x, y); return !(hit === n || n.contains(hit)); }) };
  });
  return { id: q.querySelector('.id').textContent, line: act.textContent, tags };
})`;

test('0190 AC1: at 375 px, every point of each queued ticket\'s tags\' 44 by 44 px tap areas reaches its tag, in its Queued line', skip, async () => {
  await onPhone(async b => {
    const rows = await b.js(ROWS);
    // 0434: a closed card's line has only its bug, fix or document tag. 0463: open, its facts are in a table.
    assert.deepEqual(rows.map(r => [r.id, r.line]), [['0204', 'Queued · bug'], ['0205', 'Queued · fix']]);
    for (const row of rows) {
      assert.equal(row.tags.length, 1, `${row.id}: its tag`);
      for (const t of row.tags) {
        assert.deepEqual(t.misses, [], `${row.id} ${t.text}: these points of its 44 px tap area miss it`);
        assert.ok(t.inLine, `${row.id} ${t.text}: in its Queued line`);
      }
    }
  });
});

// 0468: AC2 checked a tap on the id in a Queued line; a closed card's ids are in its chip now.
