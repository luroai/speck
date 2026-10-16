import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome } from './support/panel.mjs';
import { STATE, onPhone } from './support/queue-phone.mjs';

// ---------- 0190: a queued ticket's Queued line stays clear of its tags' tap areas on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// For each queued ticket: its tags, the points of each tag's 44 by 44 px tap area that don't reach it, and how far
// below the tags its Queued line starts.
const ROWS = `[...document.querySelectorAll('#queue .q')].map(q => {
  q.scrollIntoView({ block: 'center' });
  const act = q.querySelector(':scope > .act');
  const tags = [...q.querySelectorAll('.tag')].map(n => {
    const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const points = [[cx - 21.5, cy - 21.5], [cx + 21.5, cy - 21.5], [cx - 21.5, cy + 21.5], [cx + 21.5, cy + 21.5], [cx, cy - 21.5], [cx, cy + 21.5], [cx - 21.5, cy], [cx + 21.5, cy]];
    return { text: n.textContent, reach: cy + 22,
      misses: points.filter(([x, y]) => { const hit = document.elementFromPoint(x, y); return !(hit === n || n.contains(hit)); }) };
  });
  return { id: q.querySelector('.id').textContent, line: act.textContent, lineTop: act.getBoundingClientRect().top, tags };
})`;

test('0190 AC1: at 375 px, every point of each queued ticket\'s tags\' 44 by 44 px tap areas reaches its tag, above its Queued line', skip, async () => {
  await onPhone(async b => {
    const rows = await b.js(ROWS);
    assert.deepEqual(rows.map(r => [r.id, r.line]), [['0204', 'Queued'], ['0205', 'Queued']]);
    for (const row of rows) {
      assert.equal(row.tags.length, 4, `${row.id}: its four tags`);
      for (const t of row.tags) {
        assert.deepEqual(t.misses, [], `${row.id} ${t.text}: these points of its 44 px tap area miss it`);
        assert.ok(row.lineTop >= t.reach, `${row.id} ${t.text}: its tap area reaches ${t.reach} px, into the Queued line at ${row.lineTop} px`);
      }
    }
  });
});

test('0190 AC2: at 375 px, a tap on the id in a Queued line still reaches that id', skip, async () => {
  await onPhone(async b => {
    const hit = await b.js(`(() => {
      const id = [...document.querySelectorAll('#queue .q .act .goto')].find(n => n.textContent === '0204');
      id.scrollIntoView({ block: 'center' });
      const r = id.querySelector('span').getBoundingClientRect();
      const n = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!n && (n === id || id.contains(n));
    })()`);
    assert.equal(hit, true, 'the middle of the id reaches it');
  }, STATE({ chained: true }));
});
