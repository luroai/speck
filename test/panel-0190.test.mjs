import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, T } from './support/panel.mjs';

// ---------- 0190: a queued ticket's Queued line stays clear of its tags' tap areas on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// Two queued tickets, each with a plain Queued line, as in 0165's test. With chained, each one's Queued line names
// the other, the ticket it unlocks or waits on.
const STATE = ({ chained = false } = {}) => ({
  run: { on: false },
  tickets: [
    T('0204', 'ready', { title: 'Ready to build', priority: 0, size: 'M', risk: 'low', type: 'bug', auto_ship: true }),
    T('0205', 'ready', { title: 'Another', priority: 1, size: 'S', risk: 'high', type: 'fix', auto_ship: false, ...(chained ? { waiting_on: ['0204'], after: ['0204'] } : {}) }),
  ],
  ideas: [],
});
const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

async function onPhone(fn, state = STATE()) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q .act').length === 2`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

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
