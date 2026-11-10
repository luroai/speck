import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome, browserPage, T } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0155: each Build queue ticket a clear row (0585: it was a card) ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// The longest existing title (68 characters), as in 0151's tests.
const LONGEST = "Read the owner's private words from outside the repo in 0082's check";
const ago = s => new Date(Date.now() - s * 1000).toISOString();
// One ticket in each state the queue colours: building, reviewing, waiting to ship, blocked, a build that stopped,
// and two ready tickets, one of them waiting on the other.
const STATE = {
  run: { on: true },
  tickets: [
    T('0301', 'building', { title: LONGEST, priority: 1, size: 'M', risk: 'high', type: 'bug', started: ago(125), build_running: true, worktree: '/tmp/wt-0301' }),
    T('0302', 'reviewing', { title: 'A ticket under review', started: ago(400) }),
    T('0303', 'approved', { title: 'A ticket waiting to ship', started: ago(900), approved: ago(60), build_exit: { code: 0 },
      rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens: 100 }] }),
    T('0304', 'blocked', { title: 'A blocked ticket', started: ago(3000), blocked_question: 'Which one?' }),
    T('0305', 'building', { title: 'A build that stopped', started: ago(200), build_exit: { code: 1, message: 'It ended.' } }),
    T('0306', 'ready', { title: LONGEST, type: 'fix' }),
    T('0307', 'ready', { title: 'A ready ticket waiting its turn', after: ['0306'], waiting_on: ['0306'] }),
  ],
  ideas: [],
};
// 0585: each ticket's dot by its state: orange for needs you (blocked, waiting to ship), blue while it's worked on, grey while it waits (a build that stopped, a ready ticket).
const STATES = { '0301': 'run', '0302': 'run', '0303': 'needs', '0304': 'needs', '0305': 'wait', '0306': 'wait', '0307': 'wait' };

// Before the page's own script runs: the look to use, a confirm that says yes, and a fetch that answers with the board
// above and records each POST.
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  window.__posts = [];
  window.confirm = () => true;
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: 'the log of ' + u });
    if (/\\/pack$/.test(u)) return json({ pack: '# Review pack\\n\\nAll good.\\n' });
    if (opts.method === 'POST') { window.__posts.push(u); return json({ message: 'Done.' }); }
    return real(url, opts);
  };
})();`;

async function withPanel(fn, { width = 1280, theme = 'light' } = {}) {
  const panel = await sharedPanel(); // one for the whole file: the page stub below answers every request (0234)
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${STATE.tickets.length}`, 'the panel');
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
// The queue row with this id.
const CARD = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
const open = async (b, id) => { await b.js(`${CARD(id)}.querySelector('.top').click()`); await settle(b); };
const FULL = '#full-ticket';
const closeFull = async b => { await b.js(`document.querySelector('${FULL} .close').click()`); await b.until(`document.getElementById('full-ticket').hidden`, 'the full ticket to close'); };
// A colour as the browser computes it, from a CSS value such as var(--bad).
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;

// Each row in the queue: its bottom edge, how well it stands out from the section, its height, and its dot's colour.
const CARDS = `(() => {
  const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const back = getComputedStyle(document.getElementById('queue').closest('.lane-list')).backgroundColor; // 0478: the lane's list, inside its frame
  return [...document.querySelectorAll('#queue .q')].map(n => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect(), where = n.querySelector('.where');
    return { id: n.querySelector('.id').textContent, open: n.classList.contains('open'), height: r.height, bottom: { width: parseFloat(s.borderBottomWidth), style: s.borderBottomStyle, contrast: contrast(s.borderBottomColor, back) },
      dot: getComputedStyle(where, '::before').backgroundColor };
  });
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0155 AC1: at ${width} px in the ${theme} look, every ticket in the Build queue is a row with a visible edge under it, and none is open`, skip, async () => {
      await withPanel(async b => {
        await open(b, '0302'); // pressing a row opens its full view, never the row
        const cards = await b.js(CARDS);
        assert.equal(cards.length, STATE.tickets.length);
        for (const c of cards) {
          assert.ok(c.bottom.width >= 0.5 && c.bottom.style === 'solid', `${c.id}: no edge under it`);
          assert.ok(c.bottom.contrast >= 1.1, `${c.id}: its edge is hard to see, contrast ${c.bottom.contrast.toFixed(2)}`);
          assert.ok(c.height >= 44, `${c.id}: only ${c.height} px tall`);
          assert.ok(!c.open, `${c.id}: open in the list`);
        }
      }, { width, theme });
    });

    test(`0155 AC2: at ${width} px in the ${theme} look, each row's dot is coloured by its state`, skip, async () => {
      await withPanel(async b => {
        const colour = {};
        for (const [k, v] of [['needs', 'var(--needs-you)'], ['run', 'var(--accent)'], ['wait', 'var(--muted)']]) colour[k] = await b.js(RGB(v));
        assert.equal(new Set(Object.values(colour)).size, 3, 'three different colours');
        for (const c of await b.js(CARDS)) assert.equal(c.dot, colour[STATES[c.id]], `${c.id}: its dot should be ${STATES[c.id]}`);
      }, { width, theme });
    });
  }
}

// One row's layout: where its content starts, its id, title lines, and the line saying where it is.
const LAYOUT = id => `(() => {
  const card = ${CARD(id)}, top = card.querySelector('.top'), s = getComputedStyle(top), box = card.getBoundingClientRect();
  const left = top.getBoundingClientRect().left + parseFloat(s.paddingLeft), right = top.getBoundingClientRect().right - parseFloat(s.paddingRight);
  const rect = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height }; };
  const idN = card.querySelector('.top .id'), t = card.querySelector('.top .title'), ts = getComputedStyle(t), range = document.createRange();
  range.selectNodeContents(t);
  const lines = [];
  for (const r of range.getClientRects()) {
    if (!r.width) continue;
    const same = lines.find(l => Math.abs(l.top - r.top) < 2);
    if (same) { same.left = Math.min(same.left, r.left); same.right = Math.max(same.right, r.right); }
    else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
  }
  const where = card.querySelector('.top .where'), sub = where.querySelector('.sub');
  return { overflow: t.scrollWidth > t.clientWidth + 0.5, left, right, idSize: getComputedStyle(idN).fontSize, titleSize: ts.fontSize, id: rect(idN), lines,
    cut: t.scrollWidth > t.clientWidth + 0.5 || t.scrollHeight > t.clientHeight + 0.5 || ts.textOverflow === 'ellipsis' || lines.some(l => l.left < box.left || l.right > box.right + 0.5),
    where: rect(where), sub: sub ? rect(sub) : null, line: rect(card.querySelector('.top .line')), children: [...card.children].map(n => n.className), topChildren: [...top.children].map(n => n.className) };
})()`;

for (const width of [375, 699, 700, 1000, 1280]) {
  test(`0155 AC3: at ${width} px, a row has its id (14 px) and title (17 px) on one row, then one line saying where it is with its minutes, all from its left padding`, skip, async () => {
    await withPanel(async b => {
      for (const id of Object.keys(STATES)) {
        const l = await b.js(LAYOUT(id));
        assert.equal(l.idSize, '14px', `${id}: the id`);
        assert.equal(l.titleSize, '17px', `${id}: the title`);
        assert.equal(l.lines.length, 1, `${id}: the title on one line (0599)`);
        assert.ok(Math.abs(l.id.left - l.left) < 0.5, `${id}: the id starts at ${l.id.left}, not the row's left padding at ${l.left}`);
        // The title starts on the id's row, and a wrapped title's next lines start under the title, not under the id.
        const [first] = l.lines;
        assert.ok(first.top < l.id.bottom && first.bottom > l.id.top, `${id}: the title starts on the id's row`);
        for (const line of l.lines) {
          assert.ok(Math.abs(line.left - first.left) < 1, `${id}: a title line starts at ${line.left}, not under the title's start at ${first.left}`);
          assert.ok(line.left >= l.id.right, `${id}: a title line starts under the id`);
        }
        const titleBottom = Math.max(...l.lines.map(x => x.bottom));
        assert.ok(Math.abs(l.line.right - l.right) < 1, `${id}: the title's row ends at ${l.line.right}, not the row's right padding at ${l.right}`);
        assert.ok(Math.abs(l.where.left - l.left) < 0.5, `${id}: its where line starts at ${l.where.left}, not the row's left padding at ${l.left}`);
        assert.ok(l.where.top >= titleBottom - 0.5, `${id}: its where line is under the title`);
        if (['0306', '0307'].includes(id)) assert.equal(l.sub, null, `${id}: a ready ticket has no minutes`);
        else assert.ok(l.sub && l.sub.left >= l.where.left && l.sub.right <= l.where.right + 0.5, `${id}: its minutes are in the where line`);
        assert.deepEqual(l.children, ['top'], `${id}: nothing under its top`);
        assert.deepEqual(l.topChildren, ['line', l.topChildren[1]], `${id}: its id and title, then one line`);
        assert.match(l.topChildren[1], /^where /);
      }
    }, { width });
  });
}

// The same widths as 0151's AC1 tests. A ready ticket has no timer, so its title wraps as a Plan ticket's does. Since
// 0168 so does a ticket in flight's, whose timer is on its progress's row (from 0156 its ensō was beside its title).
// 0441: 3 lines at 375 px, as the longest title takes in a proportional font with Arial's widths
for (const [width, most] of [[375, 3], [699, 3], [700, 3], [1000, 3], [1279, 3], [1280, 1], [1440, 1]]) {
  test(`0155 AC3: at ${width} px, the longest title is on one line, cut off when it doesn't fit (0599), in flight or not`, skip, async () => {
    await withPanel(async b => {
      const ready = await b.js(LAYOUT('0306'));
      assert.equal(ready.lines.length, 1, `0306: the title is on ${ready.lines.length} lines`);
      const flying = await b.js(LAYOUT('0301'));
      assert.equal(flying.lines.length, 1, `0301: the title is on ${flying.lines.length} lines`);
      if (width === 375) assert.ok(ready.overflow && flying.overflow, 'a title too long for a phone\'s row is cut off');
    }, { width });
  });
}

for (const width of [375, 1280]) {
  test(`0155 AC4: at ${width} px, pressing a row opens its full view, with the live log, Stop build, Back to Plan, Review pack and Ship working as before, and the timer counting`, skip, async () => {
    await withPanel(async b => {
      const full = sel => `document.querySelector('${FULL} ${sel}')`;
      const hidden = () => b.js(`document.getElementById('full-ticket').hidden`);
      assert.ok(await hidden(), 'the full view is closed at first');
      // Pressing a row opens the full view with its title and the live log, and the timer counts on.
      await open(b, '0302');
      assert.ok(!(await hidden()), '0302 opens its full view');
      assert.ok(await b.js(`!${CARD('0302')}.classList.contains('open')`), 'and the row stays closed');
      const before = await b.js(`${full('.live-now .sub')}.textContent`);
      await b.until(`${full('.live-now .sub')}.textContent !== ${JSON.stringify(before)}`, 'the timer to count');
      await closeFull(b);
      await open(b, '0301');
      await b.until(`(${full('.log')} || {}).textContent === 'the log of /api/tickets/0301/log'`, 'the live log');
      assert.ok(await b.js(`!${CARD('0301')}.querySelector('.log')`), 'the row has no log');
      // Stop build.
      await b.js(`${full('.stop-build')}.click()`);
      await b.until(`window.__posts.includes('/api/tickets/0301/stop')`, 'Stop build');
      await closeFull(b);
      // Back to Plan.
      await open(b, '0306');
      await b.until(`${full('.title')} && ${full('.title')}.textContent === ${JSON.stringify(LONGEST)}`, 'the full ticket');
      await b.js(`${full('.back-to-plan')}.click()`);
      await b.until(`window.__posts.includes('/api/tickets/0306/draft')`, 'Back to Plan');
      await closeFull(b);
      // Review pack, and Ship from it.
      await open(b, '0303');
      await b.js(`[...document.querySelectorAll('${FULL} .pane-row')].find(n => n.textContent === 'Review pack').click()`);
      await b.until(`!!${full('.ship')}`, 'the review pack with its Ship button');
      await b.js(`${full('.ship')}.click()`);
      await b.until(`window.__posts.includes('/api/tickets/0303/ship')`, 'Ship');
    }, { width });
  });
}
