import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome, browserPage, T, MONO_UI } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0155: each Build queue ticket a clear card ----------

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
// The colour of each card's border by its state since 0167: plain while at work or ready, purple waiting to ship, red
// blocked or stopped. A ready ticket is 'ready'.
// 0171: a running card's border has its stage's colour: building in --run, review in --warn. 0426: Cursor's blue and
// yellow, --blue and --yellow.
const STATES = { '0301': 'blue', '0302': 'yellow', '0303': 'idea', '0304': 'bad', '0305': 'bad', '0306': 'ready', '0307': 'ready' };

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
// The queue card with this id.
const CARD = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
const open = async (b, id) => { await b.js(`${CARD(id)}.querySelector('.top').click()`); await settle(b); };
// A colour as the browser computes it, from a CSS value such as var(--bad).
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;

// Each card in the queue: its four borders, how well each stands out from the section, and the space to the next card.
const CARDS = `(() => {
  const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const back = getComputedStyle(document.getElementById('queue').closest('section')).backgroundColor;
  const cards = [...document.querySelectorAll('#queue .q')];
  return cards.map((n, i) => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect(), next = cards[i + 1];
    const side = k => ({ width: parseFloat(s['border' + k + 'Width']), style: s['border' + k + 'Style'], color: s['border' + k + 'Color'], contrast: contrast(s['border' + k + 'Color'], back) });
    return { id: n.querySelector('.id').textContent, open: n.classList.contains('open'), top: side('Top'), right: side('Right'), bottom: side('Bottom'), left: side('Left'),
      gap: next ? next.getBoundingClientRect().top - r.bottom : null };
  });
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0155 AC1: at ${width} px in the ${theme} look, every ticket in the Build queue is a bordered card, 8 px or more from the next`, skip, async () => {
      await withPanel(async b => {
        await open(b, '0302'); // an open card too
        await open(b, '0306');
        const cards = await b.js(CARDS);
        assert.equal(cards.length, STATE.tickets.length);
        for (const c of cards) {
          for (const k of ['top', 'right', 'bottom', 'left']) {
            assert.ok(c[k].width >= 0.5 && c[k].style === 'solid', `${c.id}: no ${k} border`);
            assert.ok(c[k].contrast >= 1.4, `${c.id}: the ${k} border (${c[k].color}) is hard to see, contrast ${c[k].contrast.toFixed(2)}`);
          }
          if (c.gap !== null) assert.ok(c.gap >= 7.99, `${c.id}: only ${c.gap} px to the next card`);
        }
      }, { width, theme });
    });

    test(`0155 AC2: at ${width} px in the ${theme} look, each card's border is coloured by its state (all round since 0167), open or closed`, skip, async () => {
      await withPanel(async b => {
        const colour = {};
        for (const k of ['line', 'idea', 'bad', 'text', 'blue', 'yellow']) colour[k] = await b.js(RGB(`var(--${k})`));
        assert.equal(new Set(Object.values(colour)).size, 6, 'six different colours');
        const check = async when => {
          for (const c of await b.js(CARDS)) {
            const state = STATES[c.id] === 'ready' ? 'line' : STATES[c.id];
            // A plain card that's open has a border in the text colour; one in a state keeps its state's colour.
            const want = state === 'line' && c.open ? 'text' : state;
            for (const k of ['top', 'right', 'bottom', 'left']) assert.equal(c[k].color, colour[want], `${c.id} ${when}: its ${k} edge should be --${want}`);
            assert.equal(c.left.width, c.right.width, `${c.id} ${when}: no stripe on its left edge`);
          }
        };
        await check('closed');
        for (const id of Object.keys(STATES)) await open(b, id);
        assert.equal((await b.js(CARDS)).filter(c => c.open).length, STATE.tickets.length, 'every card is open');
        await check('open');
      }, { width, theme });
    });
  }
}

// One card's layout: where its content starts, its id, title lines, timer, tags, bar and everything under the bar.
const LAYOUT = id => `(() => {
  const card = ${CARD(id)}, s = getComputedStyle(card), box = card.getBoundingClientRect();
  const left = box.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft), right = box.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight);
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
  const sub = card.querySelector('.top .sub'), progress = card.querySelector('.top .progress'), act = card.querySelector('.top .act');
  const under = [...card.children].filter(n => !n.classList.contains('top'));
  return { left, right, idSize: getComputedStyle(idN).fontSize, titleSize: ts.fontSize, id: rect(idN), lines,
    cut: t.scrollWidth > t.clientWidth + 0.5 || t.scrollHeight > t.clientHeight + 0.5 || ts.textOverflow === 'ellipsis' || lines.some(l => l.left < box.left || l.right > box.right + 0.5),
    sub: sub && sub.textContent ? rect(sub) : null, progress: progress ? rect(progress) : null, act: act ? rect(act) : null, line: rect(card.querySelector('.top .line')),
    tags: [...card.querySelectorAll('.top .tag')].map(n => ({ text: n.textContent, ...rect(n) })),
    under: under.map(n => ({ what: n.className, button: n.tagName === 'BUTTON', first: n === under.find(x => x.tagName === 'BUTTON'), ...rect(n) })),
    firstButton: (() => { const bs = under.filter(n => n.tagName === 'BUTTON'); return bs.length ? rect(bs[0]) : null; })() };
})()`;

for (const width of [375, 699, 700, 1000, 1280]) {
  test(`0155 AC3: at ${width} px, a card has its id (14 px) and title (17 px) on one row, then (0419) one details line with its progress or Queued line, its timer and its tags, then the rest, all from its left padding`, skip, async () => {
    await withPanel(async b => {
      for (const id of Object.keys(STATES)) await open(b, id);
      for (const id of Object.keys(STATES)) {
        const l = await b.js(LAYOUT(id));
        assert.equal(l.idSize, '14px', `${id}: the id`);
        assert.equal(l.titleSize, '17px', `${id}: the title`);
        assert.ok(!l.cut, `${id}: the title is cut off`);
        assert.ok(Math.abs(l.id.left - l.left) < 0.5, `${id}: the id starts at ${l.id.left}, not the card's left padding at ${l.left}`);
        // The title starts on the id's row, and a wrapped title's next lines start under the title, not under the id.
        const [first] = l.lines;
        assert.ok(first.top < l.id.bottom && first.bottom > l.id.top, `${id}: the title starts on the id's row`);
        for (const line of l.lines) {
          assert.ok(Math.abs(line.left - first.left) < 1, `${id}: a title line starts at ${line.left}, not under the title's start at ${first.left}`);
          assert.ok(line.left >= l.id.right, `${id}: a title line starts under the id`);
        }
        const titleBottom = Math.max(...l.lines.map(x => x.bottom)), titleRight = Math.max(...l.lines.map(x => x.right));
        // 0419: under the title, one details line from the card's left padding: a ticket in flight's progress (0168),
        // with its timer in it, or a ready one's Queued line, with no timer; then the tags, in the same line.
        // The title has the full width.
        assert.ok(Math.abs(l.line.right - l.right) < 1, `${id}: the title's row ends at ${l.line.right}, not the card's right padding at ${l.right}`);
        const details = STATES[id] === 'ready' ? l.act : l.progress;
        assert.ok(details, `${id}: no details line`);
        assert.ok(Math.abs(details.left - l.left) < 0.5, `${id}: the details line starts at ${details.left}, not the card's left padding at ${l.left}`);
        assert.ok(details.top >= titleBottom - 0.5, `${id}: the details line is under the title`);
        const inside = r => r.left >= details.left - 0.5 && r.right <= details.right + 0.5 && r.top >= details.top - 0.5 && r.bottom <= details.bottom + 0.5;
        if (STATES[id] === 'ready') assert.ok(l.sub === null && l.progress === null, `${id}: a ready ticket has no timer`);
        else assert.ok(l.sub && inside(l.sub), `${id}: the timer is in the details line`);
        assert.ok(l.tags.length >= 3, `${id}: ${l.tags.length} tags`);
        for (const t of l.tags) {
          assert.ok(inside(t), `${id}: ${t.text} is in the details line`);
          assert.ok(Math.abs(t.height - l.tags[0].height) < 0.5, `${id}: ${t.text} is ${t.height} px high, ${l.tags[0].text} ${l.tags[0].height} px`);
        }
        // Then everything under the top row (the bar went into it in 0156), starting at the left padding: no empty column on the left.
        assert.ok(l.under[0].top >= details.bottom - 0.5, `${id}: ${l.under[0].what} is not under the details line`);
        for (const u of l.under) {
          if (u.button && !u.first) continue; // beside the first button
          assert.ok(Math.abs(u.left - l.left) < 0.5, `${id}: ${u.what} starts at ${u.left}, not the card's left padding at ${l.left}`);
        }
        assert.ok(l.firstButton && Math.abs(l.firstButton.left - l.left) < 0.5, `${id}: its first button doesn't start at the card's left padding`);
      }
    }, { width });
  });
}

// The same widths as 0151's AC1 tests. A ready ticket has no timer, so its title wraps as a Plan ticket's does. Since
// 0168 so does a ticket in flight's, whose timer is on its progress's row (from 0156 its ensō was beside its title).
for (const [width, most] of [[375, 2], [699, 3], [700, 3], [1000, 3], [1279, 3], [1280, 1], [1440, 1]]) {
  test(`0155 AC3: at ${width} px, the longest title wraps as in Plan, on at most ${most} ${most === 1 ? 'line' : 'lines'}, in flight or not, while its card is open`, skip, async () => {
    await withPanel(async b => {
      // 0434: a closed card's title is one line, cut off when it doesn't fit
      await open(b, '0306');
      await open(b, '0301');
      const lines = most + (await b.js(MONO_UI) ? 1 : 0); // 0427: a bold title in a monospace system font can take a line more
      const ready = await b.js(LAYOUT('0306'));
      assert.ok(ready.lines.length >= 1 && ready.lines.length <= lines, `0306: the title is on ${ready.lines.length} lines`);
      const flying = await b.js(LAYOUT('0301'));
      assert.ok(flying.lines.length >= 1 && flying.lines.length <= lines && !flying.cut, `0301: the title is on ${flying.lines.length} lines, uncut`);
    }, { width });
  });
}

for (const width of [375, 1280]) {
  test(`0155 AC4: at ${width} px, opening and closing a card, the live log, Stop build, Back to Plan, Full ticket, Review pack and Ship work as before, and the timer counts`, skip, async () => {
    await withPanel(async b => {
      const isOpen = id => b.js(`${CARD(id)}.classList.contains('open')`);
      // The timer counts on.
      const before = await b.js(`${CARD('0302')}.querySelector('.top .sub').textContent`);
      await b.until(`${CARD('0302')}.querySelector('.top .sub').textContent !== ${JSON.stringify(before)}`, 'the timer to count');
      // Opening shows the live log; closing takes it away.
      await open(b, '0301');
      assert.ok(await isOpen('0301'), '0301 opens');
      await b.until(`(${CARD('0301')}.querySelector('.log') || {}).textContent === 'the log of /api/tickets/0301/log'`, 'the live log');
      await open(b, '0301');
      assert.ok(!(await isOpen('0301')), '0301 closes');
      assert.ok(await b.js(`!${CARD('0301')}.querySelector('.log')`), 'a closed card has no log');
      // Stop build.
      await open(b, '0301');
      await b.js(`${CARD('0301')}.querySelector('.stop-build').click()`);
      await b.until(`window.__posts.includes('/api/tickets/0301/stop')`, 'Stop build');
      // Back to Plan.
      await open(b, '0306');
      await b.js(`${CARD('0306')}.querySelector('.back-to-plan').click()`);
      await b.until(`window.__posts.includes('/api/tickets/0306/draft')`, 'Back to Plan');
      // Full ticket.
      await b.js(`${CARD('0306')}.querySelector('.full-open').click()`);
      await b.until(`!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .title').textContent === ${JSON.stringify(LONGEST)}`, 'the full ticket');
      await b.js(`document.querySelector('#full-ticket .close').click()`);
      await b.until(`document.getElementById('full-ticket').hidden`, 'the full ticket to close');
      // Review pack, and Ship from it.
      await open(b, '0303');
      await b.js(`[...${CARD('0303')}.querySelectorAll('.full-open')].find(n => n.textContent === 'Review pack').click()`);
      await b.until(`!!document.querySelector('#full-ticket .ship')`, 'the review pack with its Ship button');
      await b.js(`document.querySelector('#full-ticket .ship').click()`);
      await b.until(`window.__posts.includes('/api/tickets/0303/ship')`, 'Ship');
    }, { width });
  });
}
