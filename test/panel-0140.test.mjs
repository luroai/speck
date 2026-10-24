import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, full, idea, round, exitOf, openLane, styles } from './support/panel.mjs';

// ---------- 0140: fit the panel to a phone screen ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => styles();

const NOW = Date.now();
const ago = m => new Date(NOW - m * 60000).toISOString();
const LONG = 'A ticket title long enough to need more than one line on a phone screen, with a longwordthatgoesonandonwithoutanybreaks';
// A board with every kind of control on it: drafts, a running and a paused build, a blocked one with a resume line,
// an approved one waiting to ship, a ready one waiting on another, shipped tickets, an idea and an inbox note.
const STATE = {
  run: { on: true }, resume_command: 'claude --resume {session}',
  tickets: [
    full('0201', { title: LONG, priority: 1, problem: `${LONG}. ${LONG}.`, outcome: 'It fits.' }),
    full('0202', { title: 'Two', type: 'bug', risk: 'high' }),
    T('0203', 'building', { title: LONG, started: ago(3), build_running: true, self_check: 'no changes',
      worktree: '/home/someone/projects/speck.worktrees/speck/0203-a-long-branch-name-for-a-phone-screen' }),
    T('0204', 'reviewing', { started: ago(9), build_running: true, paused: true, rounds: [round(1, 1200)] }),
    T('0205', 'blocked', { started: ago(30), blocked_question: `Which one? ${LONG}`, session: { id: '0e5c1d5a-7f3e-4c4b-9b8e-2f9d1c3a4b5c', cwd: '/home/someone/projects/speck.worktrees/speck/0205-blocked' } }),
    T('0206', 'approved', { title: LONG, started: ago(40), approved: ago(30), rounds: [round(1, 1000), round(2, 2000)], ...exitOf(`speck ship refused: ${LONG}`) }),
    T('0207', 'ready', { after: ['0201'], waiting_on: ['0201'] }),
    ...[1, 2, 3, 4, 5, 6].map(n => T(`010${n}`, 'done', { title: n === 1 ? LONG : n === 3 ? 'A' : `Shipped ${n}`, type: n === 2 ? 'fix' : '', started: ago(200 + n * 10), approved: ago(190 + n * 10),
      finished: ago(180 + n * 10), rounds: [round(1, 123456)], builder_tokens: 1234567, builder_cost_usd: 12.34 })),
  ],
  ideas: [idea('2026-10-13-an-idea', 'new'), idea('2026-10-13-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0139\n\nSome text.\n')],
};
const PACK = `# Review pack: 0206\n\n| Round | Verdict | Findings | Tokens |\n| --- | --- | --- | --- |\n| 1 | request_changes | ${LONG} | 1,000 |\n| 2 | approve | none | 2,000 |\n\n`
  + `<details><summary>Findings, round 1</summary>\n\n- ${LONG}\n\n</details>\n\n\`\`\`\nnode .speck/scripts/speck.mjs ship 0206 --a-very-long-flag-that-runs-on-and-on-past-the-edge-of-a-phone\n\`\`\`\n`;

// Before the page's own script runs: the look to use, and a fetch that answers with the board above.
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)}, PACK = ${JSON.stringify(PACK)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/pack$/.test(u)) return json({ pack: PACK });
    if (/\\/log$/.test(u)) return json({ text: 'Some log line that is long enough to wrap on a phone screen, and then some more of it.' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

async function withPhone(fn, { width = 375, theme = 'light' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setTouchEmulationEnabled', width < 700 ? { enabled: true, maxTouchPoints: 1 } : { enabled: false }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    const ready = `location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shipped tr') && !!document.querySelector('#queue .q')`;
    for (let i = 0; ; i++) {
      try { if (await b.js(ready)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
// Opens every Plan item in the current tab and every Build row.
async function openAll(b) {
  await b.js(`[...document.querySelectorAll('#shaping .item:not(.open) .head')].forEach(h => h.click())`);
  await b.js(`[...document.querySelectorAll('#queue .q:not(.open) .top')].forEach(t => t.click())`);
  await settle(b);
}
const tab = async (b, view) => { await b.js(`document.querySelector('#shaping-toggle .toggle.${view}').click()`); await settle(b); };
// 0463: an open draft's priority is in its facts' Priority cell
const openPrio = async b => { await b.js(`document.querySelector('#shaping .tag.pick, #shaping .set-prio').click()`); await settle(b); };
const openFull = async b => { await b.js(`document.querySelector('#shaping .item.open .full-open').click()`); await b.until(`!document.getElementById('full-ticket').hidden`, 'the full ticket'); };
const openPack = async b => {
  await b.js(`[...document.querySelectorAll('#queue .full-open')].find(x => x.textContent === 'Review pack').click()`);
  await b.until(`!!document.querySelector('#full-ticket .ship') && !!document.querySelector('#full-ticket details')`, 'the review pack and its Ship button');
};
const closePane = async b => { await b.js(`document.querySelector('#full-ticket .close').click()`); await b.until(`document.getElementById('full-ticket').hidden`, 'the pane to close'); };

// What reaches past the right edge of the screen: the page's own width, the full ticket pane's (which must not scroll
// sideways either), and every element and line of text in the header, the sections and the pane. Something inside a
// box that scrolls on its own (a code block, a log) counts only when that box itself reaches past the edge.
const OVERFLOW = `(() => {
  const W = document.documentElement.clientWidth, out = [];
  const name = n => n.nodeType === 3 ? 'text "' + n.textContent.trim().slice(0, 30) + '" in ' + name(n.parentElement)
    : n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\\s+/).join('.') : '');
  const pane = document.getElementById('full-ticket');
  // 0410: a lane's list scrolls up and down, which a browser makes clip sideways too, so it counts as reaching past the
  // edge itself when it scrolls sideways, and what's in it is checked as before.
  const clipped = n => { for (let p = n.parentElement; p && p !== document.body && p !== pane; p = p.parentElement) if (!p.classList.contains('lane-list') && getComputedStyle(p).overflowX !== 'visible') return true; return false; };
  for (const l of document.querySelectorAll('.lane-list')) if (l.getClientRects().length && l.scrollWidth > l.clientWidth) out.push(name(l) + ' scrolls sideways: ' + l.scrollWidth + ' > ' + l.clientWidth);
  if (document.documentElement.scrollWidth > W) out.push('the page is ' + document.documentElement.scrollWidth + 'px wide');
  if (!pane.hidden && pane.scrollWidth > pane.clientWidth) out.push('the pane scrolls sideways: ' + pane.scrollWidth + ' > ' + pane.clientWidth);
  const roots = [document.querySelector('header'), document.querySelector('main'), pane].filter(n => n && n.getClientRects().length);
  for (const root of roots) {
    for (const n of [root, ...root.querySelectorAll('*')]) {
      const r = n.getBoundingClientRect();
      if ((r.width || r.height) && r.right > W + 0.5 && !clipped(n)) out.push(name(n) + ' reaches ' + Math.round(r.right));
    }
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t; (t = walk.nextNode());) {
      if (!t.textContent.trim() || clipped(t)) continue;
      const range = document.createRange(); range.selectNodeContents(t);
      for (const r of range.getClientRects()) if (r.width && r.right > W + 0.5) { out.push(name(t) + ' reaches ' + Math.round(r.right)); break; }
    }
  }
  return out;
})()`;

// 0410: in each lane in turn while no pane covers them, as only the open lane shows.
async function overflow(b) {
  if (!(await b.js(`document.getElementById('full-ticket').hidden`))) return b.js(OVERFLOW);
  const out = [];
  for (const lane of ['plan', 'build', 'shipped']) { await b.js(openLane(lane)); await settle(b); out.push(...(await b.js(OVERFLOW)).map(o => `${lane}: ${o}`)); }
  await b.js(openLane('build'));
  return out;
}

for (const theme of ['light', 'dark']) {
  test(`0140 AC1: at 375 px in the ${theme} look, nothing reaches past the right edge, with every list, menu and pane open`, skip, async () => {
    await withPhone(async b => {
      assert.deepEqual(await overflow(b), [], 'as first shown');
      await openAll(b);
      await openPrio(b);
      assert.ok(await b.js(`!!document.querySelector('.prio-menu')`), 'the priority menu is open');
      assert.deepEqual(await overflow(b), [], 'tickets and builds open, priority menu open');
      for (const view of ['ideas', 'inbox']) {
        await tab(b, view);
        await openAll(b);
        assert.deepEqual(await overflow(b), [], `${view} open`);
      }
      await tab(b, 'tickets');
      await openFull(b);
      assert.deepEqual(await overflow(b), [], 'the full ticket pane');
      await closePane(b);
      await openPack(b);
      await b.js(`document.querySelector('#full-ticket details').open = true`);
      await settle(b);
      assert.deepEqual(await overflow(b), [], 'the review pack pane');
    }, { theme });
  });
}

// 0410: Plan, Build and Shipped are tabs, so each lane is opened by its tab in turn, and Build is opened again after.
const SECTIONS = `(() => {
  const main = document.querySelector('main'), s = getComputedStyle(main);
  const box = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
  const heads = [], boxes = [];
  for (const tab of document.querySelectorAll('#tabs .tab')) {
    tab.click();
    const open = [...main.querySelectorAll(':scope > section')].filter(n => !n.hidden);
    heads.push(tab.querySelector('.tab-name').textContent + (open.length === 1 ? '' : ' with ' + open.length + ' lanes'));
    boxes.push(box(open[0]));
  }
  document.getElementById('tab-build').click();
  return { main: { left: main.getBoundingClientRect().left + parseFloat(s.paddingLeft), right: main.getBoundingClientRect().right - parseFloat(s.paddingRight) }, heads, boxes };
})()`;

for (const width of [375, 699]) {
  test(`0140 AC2: at ${width} px, Plan, Build and Shipped are each full width, one at a time (0410)`, skip, async () => {
    await withPhone(async b => {
      const { main, heads, boxes } = await b.js(SECTIONS);
      assert.deepEqual(heads, ['Plan', 'Build', 'Shipped']);
      for (const [i, x] of boxes.entries()) assert.ok(Math.abs(x.left - main.left) < 1 && Math.abs(x.right - main.right) < 1, `${heads[i]} spans main's width: ${JSON.stringify(x)} in ${JSON.stringify(main)}`);
    }, { width });
  });
}

// Every computed style and box on the page, so the layout at a width can be compared with and without the phone rules.
const SNAPSHOT = `[...document.querySelectorAll('body, body *')].map(n => {
  const s = getComputedStyle(n), r = n.getBoundingClientRect(), props = [];
  for (let i = 0; i < s.length; i++) props.push(s[i] + ':' + s.getPropertyValue(s[i]));
  return n.tagName + '.' + n.className + ' ' + [r.left, r.top, r.width, r.height].map(v => Math.round(v * 100) / 100).join(',') + ' ' + props.join(';');
})`;
const DROP_NARROW = `(() => {
  let n = 0;
  for (const sheet of document.styleSheets) for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i];
    if (rule.media && /width/.test(rule.conditionText)) { sheet.deleteRule(i); n++; }
  }
  return n;
})()`;

for (const width of [700, 1280]) {
  test(`0140 AC2: at ${width} px, each lane is full width (0410: one at a time), and the layout is exactly what it is without the phone rules`, skip, async () => {
    await withPhone(async b => {
      const { main, heads, boxes } = await b.js(SECTIONS);
      assert.deepEqual(heads, ['Plan', 'Build', 'Shipped']);
      for (const [i, x] of boxes.entries()) assert.ok(Math.abs(x.left - main.left) < 1 && Math.abs(x.right - main.right) < 1, `${heads[i]} spans main's width`);
      await openAll(b);
      await openPrio(b);
      // Everything holds still to be compared, speck's screen too: dropping rules restarts an animation.
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await b.until(`document.getAnimations().length === 0`, 'nothing moving');
      // 0441: the clocks too. In a proportional font a ticking time changes its width, so the page's clock stops, and a
      // second passes for the timers to draw the time it stopped at.
      await b.js(`(() => { const D = Date, at = D.now(); window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } }; return true; })()`);
      await new Promise(res => setTimeout(res, 1100));
      const withRules = await b.js(SNAPSHOT);
      assert.ok(await b.js(DROP_NARROW) > 0, 'the page has width rules to drop');
      await settle(b);
      const without = await b.js(SNAPSHOT);
      assert.equal(withRules.length, without.length);
      const diff = withRules.map((s, i) => [s, without[i]]).filter(([x, y]) => x !== y).slice(0, 3);
      assert.deepEqual(diff, [], 'the phone rules change nothing at this width');
    }, { width });
  });
}

test('0140 AC2: the stylesheet\'s only width-based media query is for screens narrower than 700 px', () => {
  const queries = [...css().matchAll(/@media\s*([^{]*)\{/g)].map(m => m[1].trim()).filter(q => /width/.test(q));
  assert.ok(queries.length > 0, 'there is a width-based media query');
  for (const q of queries) assert.equal(q, '(max-width: 699.98px)');
});

// How many lines a node's text takes up on screen.
const LINES = sel => `(() => {
  const n = document.querySelector(${JSON.stringify(sel)}), range = document.createRange();
  range.selectNodeContents(n);
  const rects = [...range.getClientRects()].filter(r => r.width && r.height).sort((a, b) => a.top - b.top);
  let lines = 0, bottom = -Infinity;
  for (const r of rects) if (r.top >= bottom - 1) { lines++; bottom = r.bottom; } else bottom = Math.max(bottom, r.bottom);
  return lines;
})()`;
// 0150: speck run's state is itself its on/off button, Auto-build, and the live indicator has gone.
// 0372: and Settings, which ends it now that light and dark are chosen in Settings.
// 0413: the title row of speck's screen's frame, and the screen under it
const HEADER = { 'the speck name': 'header .name', 'the repo and base branch': 'header .repo', "speck's screen": '#run',
  'Settings': '#settings-open' };

test('0140 AC3: at 375 px, the header shows each of its parts in full, each label on one line', skip, async () => {
  await withPhone(async b => {
    const W = await b.js(`document.documentElement.clientWidth`);
    for (const [what, sel] of Object.entries(HEADER)) {
      const r = await b.js(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return null; const r = n.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, height: r.height, cut: n.scrollWidth > n.clientWidth + 0.5, hidden: getComputedStyle(n).visibility !== 'visible' }; })()`);
      assert.ok(r, `${what} is there`);
      assert.ok(r.width > 0 && r.height > 0 && !r.hidden, `${what} is shown`);
      assert.ok(r.left >= 0 && r.right <= W + 0.5, `${what} is on screen: ${JSON.stringify(r)}`);
      // 0364: the project shares the phone's one row with the buttons, so it may be cut short with "…", never hidden
      if (sel === 'header .repo') assert.ok(!r.cut || await b.js(`getComputedStyle(document.querySelector('header .repo')).textOverflow === 'ellipsis'`), `${what} is in full or ends in "…"`);
      else assert.ok(!r.cut, `${what} isn't cut short`);
      if (sel !== '#settings-open' && sel !== '#run') assert.equal(await b.js(LINES(sel)), 1, `${what} is on one line`);
    }
    assert.match(await b.js(`document.querySelector('header .repo').textContent`), / · main$/); // 0413: the project, then the base branch
    assert.ok(await b.js(`document.querySelector('#run canvas').getBoundingClientRect().height > 0`), "speck's screen is shown"); // 0413
  });
});

// Every button and clickable control that's showing, and its size. A link inside a ticket's own text is part of that
// text, not one of the panel's controls, so it's left out.
const CONTROLS = `(() => {
  const shown = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility === 'visible'; };
  const pointer = n => n && n.nodeType === 1 && getComputedStyle(n).cursor === 'pointer';
  const set = new Set(document.querySelectorAll('button, a[href], summary, select, input, .tag.pick, .set-prio, .head, .q .top'));
  for (const n of document.querySelectorAll('body *')) if (pointer(n) && !pointer(n.parentElement)) set.add(n);
  const prose = n => !!n.closest('#full-ticket .md, #full-ticket .criteria') && n.tagName === 'A';
  // 0151: the priority tag looks as high as the other tags, and its tap area is the box around it, which a tap anywhere
  // in reaches the tag (test/panel-0151.test.mjs checks that).
  return [...set].filter(n => shown(n) && !prose(n)).map(n => {
    const r = (n.matches('.tag.pick, .set-prio') ? n.closest('.prio') : n).getBoundingClientRect();
    return { what: n.tagName.toLowerCase() + '.' + String(n.className).trim().split(/\\s+/).join('.') + ' "' + n.textContent.trim().slice(0, 20) + '"', width: r.width, height: r.height };
  });
})()`;

for (const width of [375, 699]) {
  test(`0140 AC4: at ${width} px, every button and clickable control is at least 44 by 44 px`, skip, async () => {
    await withPhone(async b => {
      const seen = new Set();
      // 0410: in each lane in turn, while no pane covers them, as only the open lane shows
      const check = async when => {
        // Pressing a tab closes an open priority menu, as any click does, so Plan comes last and its menu opens again.
        const covered = !(await b.js(`document.getElementById('full-ticket').hidden`)), menu = await b.js(`!!document.querySelector('.prio-menu')`);
        const all = [];
        for (const lane of covered ? [null] : ['build', 'shipped', 'plan']) {
          if (lane) await b.js(openLane(lane));
          if (lane === 'plan' && menu) await openPrio(b);
          all.push(...await b.js(CONTROLS));
        }
        for (const c of all) seen.add(c.what.split(' ')[0]);
        const small = all.filter(c => c.width < 43.5 || c.height < 43.5).map(c => `${c.what} ${Math.round(c.width)}x${Math.round(c.height)}`);
        assert.deepEqual(small, [], when);
      };
      await check('as first shown');
      await openAll(b);
      await openPrio(b);
      await check('tickets and builds open, priority menu open');
      for (const view of ['ideas', 'inbox']) { await tab(b, view); await openAll(b); await check(`${view} open`); }
      await tab(b, 'tickets');
      await openFull(b);
      await check('the full ticket pane');
      await closePane(b);
      await openPack(b);
      await check('the review pack pane');
      // The controls the ticket names were all among those checked.
      for (const c of ['button.set-ready', 'button.on', 'button.stop-build', 'button.full-open',
        'button.ship', 'button.toggle.tickets.on', 'button.settings-open', 'span.tag.p1.pick', 'span.set-prio.pick', 'button.copy', 'button.close', 'span.title-link', 'summary.']) {
        assert.ok(seen.has(c), `${c} was checked (saw ${[...seen].join(', ')})`);
      }
      assert.ok([...seen].some(c => c === 'button.'), "speck run's on/off button was checked");
    }, { width });
  });
}

test('0140 AC1: at 375 px, each step label under a build shows in full', skip, async () => {
  await withPhone(async b => {
    const cut = await b.js(`[...document.querySelectorAll('.stages div')].filter(n => n.scrollWidth > n.clientWidth + 0.5).map(n => n.textContent + ' ' + n.scrollWidth + '/' + n.clientWidth)`);
    assert.deepEqual(cut, []);
  });
});
