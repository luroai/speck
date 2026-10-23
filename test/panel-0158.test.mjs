import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fakePage, T, idea, round, queueRows, openLane } from './support/panel.mjs';

// ---------- 0158: stack review pack tables on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const ago = m => new Date(Date.now() - m * 60000).toISOString();

// A pack with the criteria table `speck pack` writes, and another table with other columns.
const PACK = [
  '## 0005 · Ticket 0005',
  '',
  '### Acceptance criteria',
  '| # | Criterion | Result | Evidence |',
  '|---|---|---|---|',
  '| 1 | On a phone, each row of a table shows as its own block with every cell labelled by its column heading. | ✅ | templates/panel.html gives each cell its heading, and the browser test measures the blocks at 375 px, as /home/someone/projects/speck.worktrees/speck/0158-stack-review-pack-tables-on-a-phone/test/panel-0158.test.mjs and test/supportfilewithaverylongnamethatgoesonandonwithoutanybreaksatall.mjs show. |',
  '| 2 | Copying still copies every cell. | ❌ | Evidence with `code` and \\| a pipe. |',
  '',
  '### Rounds',
  '| Round | Verdict | Findings |',
  '| --- | --- | --- |',
  '| 1 | request_changes | Two findings about the layout of the review pack on a narrow screen. |',
  '| 2 | approve | none |',
].join('\n');
const NOTE = '# A note with a table\n\nStatus: new\n\n| Name | Value |\n| --- | --- |\n| First | One thing written out at some length so it wraps |\n| Second | Two |\n';
const STATE = {
  tickets: [T('0005', 'approved', { started: ago(40), approved: ago(30), rounds: [round(1, 1000)] })],
  ideas: [idea('2026-10-13-a-table', 'new', NOTE)],
};

// ---------- the page's own nodes, without a browser ----------

const tags = (p, n, tag) => p.all(n).filter(x => x.tagName === tag);
async function fakePack() {
  const p = fakePage([JSON.parse(JSON.stringify(STATE)), { text: '', truncated: false }, { pack: PACK }, JSON.parse(JSON.stringify(STATE))]);
  await p.settle();
  p.press(queueRows(p)[0].children.find(n => n.className === 'top'));
  await p.settle();
  p.press(p.all(queueRows(p)[0]).find(x => x.tagName === 'button' && x.textContent === 'Review pack')); // the opened row
  await p.settle();
  return p;
}

test('0158 AC1: each cell of a review pack table carries its column heading, in column order', async () => {
  const p = await fakePack();
  const tables = tags(p, p.byId('full-ticket'), 'table');
  assert.equal(tables.length, 2);
  for (const t of tables) {
    const heads = tags(p, t, 'th').map(th => th.textContent);
    for (const tr of tags(p, t, 'tbody').flatMap(b => tags(p, b, 'tr'))) {
      assert.deepEqual(tags(p, tr, 'td').map(td => td.attrs && td.attrs['data-label']), heads, tr.textContent);
    }
  }
});

test('0158 AC2: only a table with the criteria columns is marked as the criteria table', async () => {
  const p = await fakePack();
  const [criteria, rounds] = tags(p, p.byId('full-ticket'), 'table');
  assert.match(criteria.className, /\bac-table\b/);
  assert.doesNotMatch(rounds.className, /\bac-table\b/);
});

// ---------- a real browser ----------

const stub = `(() => {
  const STATE = ${JSON.stringify(STATE)}, PACK = ${JSON.stringify(PACK)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/pack$/.test(u)) return json({ pack: PACK });
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;

// The panel at a width, with the review pack open in the pane and the idea's note open in Plan.
async function withPack(width, fn) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    for (let i = 0; ; i++) {
      try { if (await b.js(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#queue .q')`)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    await b.js(openLane('plan')); // 0410: the idea's table is in Plan, beside the pane
    await b.js(`document.querySelector('#shaping-toggle .toggle.ideas').click()`);
    await b.until(`!!document.querySelector('#shaping .item .head')`, 'the idea');
    await b.js(`document.querySelector('#shaping .item .head').click()`);
    await b.until(`!!document.querySelector('.shaping .md table')`, 'the idea\'s note');
    await b.js(`document.querySelector('#queue .q .top').click()`);
    await b.until(`[...document.querySelectorAll('#queue .full-open')].some(x => x.textContent === 'Review pack')`, 'the Review pack button');
    await b.js(`[...document.querySelectorAll('#queue .full-open')].find(x => x.textContent === 'Review pack').click()`);
    await b.until(`document.querySelectorAll('#full-ticket .md table').length === 2`, 'the review pack');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

// Each table: its headings, whether they show, and for each row its cells' text, box, label (the ::before) and style.
const TABLES = `[...document.querySelectorAll('#full-ticket .md table, .shaping .md table')].map(t => {
  const box = n => { const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; };
  const thead = t.querySelector('thead');
  return {
    where: t.closest('#full-ticket') ? 'pane' : 'note',
    criteria: t.classList.contains('ac-table'),
    display: getComputedStyle(t).display,
    heads: [...t.querySelectorAll('th')].map(th => th.textContent),
    head: box(thead),
    rows: [...t.querySelectorAll('tbody tr')].map(tr => {
      const s = getComputedStyle(tr);
      return { box: box(tr), border: parseFloat(s.borderBottomWidth), padding: parseFloat(s.paddingTop) + parseFloat(s.paddingBottom),
        cells: [...tr.querySelectorAll('td')].map(td => {
          const before = getComputedStyle(td, '::before');
          // Each word in the cell's own text, and whether it sits on one line. A hyphen ends a word, as a space does: a line
          // may break after one, as it would in a sentence.
          const split = [];
          const walk = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
          for (let n; (n = walk.nextNode());) for (const m of n.textContent.matchAll(/[^\\s-]+/g)) {
            const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
            const lines = new Set([...r.getClientRects()].filter(x => x.width).map(x => Math.round(x.top)));
            if (lines.size > 1) split.push(m[0]);
          }
          return { text: td.textContent, box: box(td), display: getComputedStyle(td).display, split,
            label: before.content, labelDisplay: before.display, labelSize: parseFloat(before.fontSize), cellSize: parseFloat(getComputedStyle(td).fontSize),
            labelCase: before.textTransform, labelColour: before.color, labelWrap: before.whiteSpace };
        }) };
    }),
  };
})`;
// 0426: as the browser computes it, as --muted has an alpha
const MUTED = `(() => { const s = document.createElement('span'); s.style.color = 'var(--muted)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()`;

test('0158 AC1: at 375 px, each row of every table in the pane and in an opened note is a block of labelled cells, one to a line', skip, () => withPack(375, async b => {
  const tables = await b.js(TABLES), muted = await b.js(MUTED);
  assert.deepEqual(tables.map(t => t.where), ['note', 'pane', 'pane']);
  for (const t of tables) {
    assert.ok(t.head.height <= 1 && t.head.width <= 1, `${t.where}: the heading row is hidden, its headings shown on the cells instead`);
    for (const row of t.rows) {
      assert.deepEqual(row.cells.map(c => c.label), t.heads.map(h => JSON.stringify(h)), 'every cell is labelled with its heading, in column order');
      row.cells.forEach((c, i) => {
        assert.equal(c.display, 'block', c.text);
        if (t.criteria && i < 3) return; // AC2: the number, criterion and result go unlabelled
        assert.equal(c.labelDisplay, 'block', 'the label is on a line of its own above the cell\'s text');
        assert.ok(c.labelSize < c.cellSize, 'in small type');
        assert.equal(c.labelCase, 'uppercase', 'in capitals');
        assert.equal(c.labelColour, muted, 'muted');
      });
      if (t.criteria) continue; // AC2 has its own layout
      for (let i = 1; i < row.cells.length; i++) assert.ok(row.cells[i].box.top >= row.cells[i - 1].box.bottom - 0.5, `${row.cells[i].text}: under the cell before it`);
    }
  }
}));

test('0158 AC2: at 375 px, a criteria block starts with its number and result on one line, then the criterion, then the evidence', skip, () => withPack(375, async b => {
  const [crit] = (await b.js(TABLES)).filter(t => t.criteria);
  assert.ok(crit, 'the pack has a criteria table');
  for (const { cells: [num, criterion, result, evidence] } of crit.rows) {
    assert.ok(Math.abs(num.box.top - result.box.top) < 1, `${num.text} ${result.text}: on one line`);
    assert.ok(result.box.left > num.box.right, 'the result after the number');
    assert.ok(criterion.box.top >= Math.max(num.box.bottom, result.box.bottom) - 0.5, 'then the criterion, under them');
    assert.ok(evidence.box.top >= criterion.box.bottom - 0.5, 'then the evidence');
    for (const c of [num, criterion, result]) assert.equal(c.labelDisplay, 'none', `${c.text}: no label`);
    assert.equal(evidence.label, '"Evidence"');
    assert.equal(evidence.labelDisplay, 'block');
  }
}));

test('0158 AC3: at 375 px, blocks are set apart, and no label or word breaks inside itself', skip, () => withPack(375, async b => {
  assert.ok(await b.js(`document.documentElement.scrollWidth <= innerWidth`), 'the page doesn\'t scroll sideways');
  assert.ok(await b.js(`(p => p.scrollWidth <= p.clientWidth)(document.getElementById('full-ticket'))`), 'nor does the pane: a word too long for a line scrolls inside its cell');
  for (const t of await b.js(TABLES)) {
    t.rows.forEach((row, i) => {
      if (i < t.rows.length - 1) {
        assert.ok(row.border > 0, `${t.where}: a line under each block but the last`);
        assert.ok(t.rows[i + 1].box.top >= row.box.bottom - 0.5, 'blocks don\'t overlap');
      }
      assert.ok(row.padding > 0, 'with space inside it');
      for (const c of row.cells) {
        assert.deepEqual(c.split, [], `${c.text}: no word is broken across lines, even one wider than the screen`);
        if (c.labelDisplay !== 'none') assert.equal(c.labelWrap, 'nowrap', `${c.label}: the label stays on one line`);
      }
    });
  }
}));

test('0158 AC4: at 1280 px tables are tables as before, with a heading row and no labels', skip, () => withPack(1280, async b => {
  const tables = await b.js(TABLES);
  assert.equal(tables.length, 3);
  for (const t of tables) {
    assert.equal(t.display, 'table');
    assert.ok(t.head.height > 1, 'the heading row shows');
    for (const row of t.rows) {
      for (const c of row.cells) {
        assert.equal(c.display, 'table-cell');
        assert.equal(c.labelDisplay !== 'none' ? c.label : 'none', 'none', 'no label before a cell');
      }
      assert.ok(row.cells.every(c => Math.abs(c.box.top - row.cells[0].box.top) < 1), 'the cells sit side by side');
    }
  }
}));

// Each table's cells' text, and the points a drag from the start of its first cell's text to the end of its last cell's
// text goes between, as a user selects a table to copy it.
const ENDS = `[...document.querySelectorAll('#full-ticket .md table, .shaping .md table')].map(t => {
  const tds = [...t.querySelectorAll('td')], text = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), all = []; for (let x; (x = w.nextNode());) if (x.textContent.trim()) all.push(x); return all; };
  const first = text(tds[0])[0], last = text(tds.at(-1)).at(-1);
  const r = document.createRange(); r.setStart(first, 0); r.setEnd(first, 1); const a = r.getBoundingClientRect();
  r.setStart(last, last.textContent.length - 1); r.setEnd(last, last.textContent.length); const z = r.getBoundingClientRect();
  return { cells: tds.map(td => td.innerText.trim()), from: [a.left + 0.5, a.top + a.height / 2], to: [z.right + 2, z.top + z.height / 2], pane: !!t.closest('#full-ticket') };
})`;
for (const width of [375, 1280]) {
  test(`0158 AC4: at ${width} px, copying a table copies every cell's text`, skip, () => withPack(width, async b => {
    let copies = 0;
    const tables = (await b.js(ENDS)).map((t, i) => ({ ...t, i }));
    const order = [...tables.filter(t => t.pane), ...tables.filter(t => !t.pane)]; // the pane's first: the note sits under it
    assert.deepEqual(order.map(t => t.pane), [true, true, false]);
    for (const t of order) {
      if (!t.pane && !(await b.js(`document.getElementById('full-ticket').hidden`))) await b.js(`document.querySelector('#full-ticket .close').click()`);
      await b.js(`getSelection().removeAllRanges()`);
      // The table at the top of the screen, so the drag's two ends are on it.
      await b.js(`document.querySelectorAll('#full-ticket .md table, .shaping .md table')[${t.i}].scrollIntoView({ block: 'start' })`);
      const { from, to } = (await b.js(ENDS))[t.i];
      assert.ok(await b.js(`${from[1]} > 0 && ${to[1]} < innerHeight`), 'the whole table is on the screen');
      await b.drag(from, to);
      const copied = await b.js(`getSelection().toString()`);
      for (const c of t.cells) assert.ok(copied.includes(c), `${JSON.stringify(c)} is in what's copied: ${JSON.stringify(copied)}`);
      copies++;
    }
    assert.equal(copies, 3, 'every table was copied');
  }));
}
