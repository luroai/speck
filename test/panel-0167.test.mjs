import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, full, idea, round } from './support/panel.mjs';
import { rules, selectors, tokens, get, rule } from './support/css.mjs';

// ---------- 0167: use colour only to show state ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NEUTRAL = ['--text', '--muted', '--faint'];
const lastCompound = s => s.trim().split(/\s+|>|\+|~/).filter(Boolean).pop() || '';
// A selector for a section or a card: Plan's items, the Build queue's tickets and the shipped tickets.
const isCard = s => /^(section|#shaping-section|\.item|\.q)(?![\w-])/.test(lastCompound(s)) || /#shipped tr(?![\w-])/.test(s);
const plain = () => rules().filter(r => !r.sel.startsWith(':root') && !r.at.some(a => a.startsWith('@keyframes')));

test('0167 AC1: no section or card rule draws a top or left stripe, and each card has a border on all sides', () => {
  const stripes = [];
  for (const r of plain()) {
    if (!selectors(r).some(isCard)) continue;
    for (const [k, v] of r.decls) if (/^border-(top|left)/.test(k)) stripes.push(`${r.sel} { ${k}: ${v} }`);
  }
  assert.deepEqual(stripes, [], 'no stripes');
  for (const sel of ['section', '.item', '.q', '#shipped tr']) {
    assert.match(get(rule(sel), 'border') || '', /^\S+ solid var\(--line\)$/, `${sel}: a border all round in the line colour`);
  }
});

test('0167 AC2: a ticket waiting for you is purple, a blocked or stopped one crimson, each with its border and a light background', () => {
  const blocked = rule('.q.blocked'), toShip = rule('.q.to-ship');
  assert.deepEqual([tokens(get(blocked, 'border-color')), tokens(get(blocked, 'background'))], [['--bad'], ['--bad-bg']]);
  assert.deepEqual([tokens(get(toShip, 'border-color')), tokens(get(toShip, 'background'))], [['--idea'], ['--idea-bg']]);
  // The passing checks stay green.
  assert.deepEqual(tokens(get(rule('.ok'), 'color')), ['--ok']);
  assert.deepEqual(tokens(get(rule('.q .top .dot.d'), 'background')), ['--ok']);
});

test('0167 AC2: the speck red is used only for the speck itself', () => {
  const users = plain().filter(r => r.decls.some(([, v]) => tokens(v).some(t => t === '--accent' || t === '--accent-bg'))).map(r => r.sel);
  assert.deepEqual(users, ['.q .top .enso .speck']);
});

test('0167 AC3: ids, titles, Plan tabs and links are in the normal text colours, with underlines or borders to show what can be clicked', () => {
  const coloured = [];
  for (const r of plain()) {
    if (!selectors(r).some(s => /\.(id|title|title-link|goto|toggle)(?![\w-])/.test(lastCompound(s)) || /(^|\s)a(:hover)?$/.test(s))) continue;
    for (const k of ['color', 'border-color']) {
      const t = tokens(get(r, k));
      if (t.some(x => !NEUTRAL.includes(x))) coloured.push(`${r.sel} { ${k}: ${get(r, k)} }`);
    }
  }
  assert.deepEqual(coloured, [], 'no accent or list colour');
  assert.match(get(rule('.goto'), 'text-decoration') || '', /underline/, 'a linked id is underlined');
  assert.match(get(rule('td .title-link'), 'text-decoration') || '', /underline/, 'a shipped title is underlined');
  assert.deepEqual(tokens(get(rule('.toggle.on'), 'border-color')), ['--text'], 'the selected tab has a border in the text colour');
  for (const sel of ['.item.idea .id', '.item.inbox .id']) assert.equal(rule(sel), undefined, `${sel} keeps the muted colour of every id`);
});

test('0167 AC4: the high risk tag stays red, and the bug and fix tags keep their own colours', () => {
  for (const [sel, t] of [['.tag.high', '--bad'], ['.tag.bug', '--bug'], ['.tag.fix', '--fix']]) {
    assert.deepEqual([tokens(get(rule(sel), 'color')), tokens(get(rule(sel), 'border-color'))], [[t], [t]], sel);
  }
});

// ---------- In the browser ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const STATE = {
  run: { on: true },
  tickets: [
    full('0201', { title: 'A draft that unlocks another' }),
    full('0202', { title: 'A draft waiting on it', after: ['0201'], waiting_on: ['0201'] }),
    T('0301', 'building', { title: 'A build at work', started: ago(125), build_running: true }),
    T('0302', 'approved', { title: 'A ticket waiting for you to ship it', started: ago(900), approved: ago(60), build_exit: { code: 0 }, rounds: [round(1, 100)] }),
    T('0303', 'blocked', { title: 'A blocked ticket', started: ago(3000), blocked_question: 'Which one?' }),
    T('0304', 'building', { title: 'A build that stopped', started: ago(200), build_exit: { code: 1, message: 'It ended.' } }),
    T('0305', 'ready', { title: 'A ready ticket' }),
    T('0401', 'done', { title: 'A shipped ticket', started: ago(1500), finished: ago(600), rounds: [round(1, 500)] }),
    T('0402', 'done', { title: 'Another shipped ticket', started: ago(5000), finished: ago(1800), rounds: [round(1, 500)] }),
  ],
  ideas: [idea('2026-10-14-an-idea', 'new'),
    idea('2026-10-14-a-follow-up', 'inbox', '# A follow-up\n\nStatus: inbox\nFrom ticket: 0161\n\nSome text.\n')],
};
// Each queue card's state colour: its border and its background, or none.
const STATES = { '0301': null, '0302': ['--idea', '--idea-bg'], '0303': ['--bad', '--bad-bg'], '0304': ['--bad', '--bad-bg'], '0305': null };

const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
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

async function withPanel(fn, theme) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === 5 && document.querySelectorAll('#shipped tr').length === 2`, 'the panel');
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
// A colour as the browser computes it, from a CSS value such as var(--bad).
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;
const colours = async b => { const c = {}; for (const k of ['line', 'text', 'muted', 'idea', 'idea-bg', 'bad', 'bad-bg', 'panel']) c[k] = await b.js(RGB(`var(--${k})`)); return c; };
// Each element's four border colours and widths, and its background.
const LOOK = sel => `[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => { const s = getComputedStyle(n);
  return { id: (n.querySelector('.id') || n).textContent.slice(0, 40), cls: n.className, back: s.backgroundColor,
    sides: ['Top', 'Right', 'Bottom', 'Left'].map(k => [s['border' + k + 'Color'], parseFloat(s['border' + k + 'Width']), s['border' + k + 'Style']]) }; })`;
const sameAllRound = (c, colour, what) => {
  for (const [k, [col, width, style]] of c.sides.entries()) {
    assert.equal(col, colour, `${what}: side ${k} is ${col}, not ${colour}`);
    assert.ok(width > 0 && width <= 1 && style === 'solid', `${what}: side ${k} is ${width} px ${style}, a plain border with no stripe`);
  }
};

for (const theme of ['light', 'dark']) {
  test(`0167 AC1 AC5: in the ${theme} look, the sections and every card have the same plain border all round`, skip, async () => {
    await withPanel(async b => {
      const c = await colours(b);
      for (const s of await b.js(LOOK('main > section'))) sameAllRound(s, c.line, `section ${s.cls}`);
      for (const view of ['tickets', 'ideas', 'inbox']) {
        await b.js(`document.querySelector('#shaping-toggle .toggle.${view}').click()`); await settle(b);
        for (const s of await b.js(LOOK('#shaping-section'))) sameAllRound(s, c.line, `Plan showing ${view}`);
        const cards = await b.js(LOOK('#shaping .item'));
        assert.ok(cards.length >= 1, `${view}: some cards`);
        for (const card of cards) sameAllRound(card, c.line, `${view} ${card.id}`);
        await b.js(`document.querySelector('#shaping .item .head').click()`); await settle(b);
        for (const card of await b.js(LOOK('#shaping .item.open'))) sameAllRound(card, c.text, `${view} ${card.id}, open`);
      }
      for (const card of await b.js(LOOK('#shipped tr'))) sameAllRound(card, c.line, `shipped ${card.id}`);
    }, theme);
  });

  test(`0167 AC2 AC5: in the ${theme} look, only a ticket waiting for you or in trouble is coloured, open or closed`, skip, async () => {
    await withPanel(async b => {
      const c = await colours(b);
      const check = async when => {
        const cards = await b.js(LOOK('#queue .q'));
        assert.deepEqual(cards.map(x => x.id).sort(), Object.keys(STATES));
        for (const card of cards) {
          const state = STATES[card.id];
          if (state) {
            sameAllRound(card, c[state[0].slice(2)], `${card.id} ${when}`);
            assert.equal(card.back, c[state[1].slice(2)], `${card.id} ${when}: its background`);
          } else sameAllRound(card, /\bopen\b/.test(card.cls) ? c.text : c.line, `${card.id} ${when}`);
        }
      };
      await check('closed');
      for (const id of Object.keys(STATES)) {
        await b.js(`[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === '${id}').querySelector('.top').click()`);
        await settle(b);
      }
      await check('open');
    }, theme);
  });

  test(`0167 AC3: in the ${theme} look, ids, titles, tabs and links are in the text colours, links underlined and the selected tab bordered`, skip, async () => {
    await withPanel(async b => {
      const c = await colours(b);
      const style = sel => b.js(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(n => { const s = getComputedStyle(n);
        return { text: n.textContent, color: s.color, line: s.textDecorationLine, border: s.borderTopColor }; })`);
      for (const n of await style('#queue .id, #shipped .id')) assert.equal(n.color, c.muted, `id ${n.text}`);
      for (const n of await style('#shipped .title-link')) assert.deepEqual([n.color, n.line], [c.text, 'underline'], `shipped title ${n.text}`);
      const gotos = await style('#shaping .goto');
      assert.ok(gotos.length >= 1, 'a linked id');
      for (const n of gotos) assert.deepEqual([n.color, n.line], [c.text, 'underline'], `linked id ${n.text}`);
      for (const view of ['tickets', 'ideas', 'inbox']) {
        await b.js(`document.querySelector('#shaping-toggle .toggle.${view}').click()`); await settle(b);
        const [on] = await style('#shaping-toggle .toggle.on');
        assert.deepEqual([on.color, on.border], [c.text, c.text], `the ${view} tab, selected`);
        for (const n of await style('#shaping .id')) assert.equal(n.color, c.muted, `${view} id ${n.text}`);
      }
    }, theme);
  });
}
