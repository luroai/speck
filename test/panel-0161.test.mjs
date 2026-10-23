import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, idea, round, openLane } from './support/panel.mjs';

// ---------- 0161: make the panel readable for low vision ----------

// The page's stylesheet as a list of rules: each rule's selector, its declarations and the at-rules it sits in.
const css = (html = page()) => (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
function rules(text = css()) {
  const out = [], stack = [];
  let buf = '';
  for (const ch of text.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; } else if (ch === '}') {
      const sel = stack.pop();
      if (buf.trim()) {
        const decls = buf.split(';').map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
        out.push({ sel, decls, at: stack.filter(s => s.startsWith('@')) });
      }
      buf = '';
    } else buf += ch;
  }
  return out.filter(r => !r.at.some(a => a.startsWith('@keyframes')));
}
const get = (r, prop) => r.decls.filter(([k]) => k === prop).map(([, v]) => v).pop();
const tokens = v => [...String(v || '').matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]);

// Each look's colour tokens: the plain :root blocks, and the dark look's block over them.
function looks(rs = rules()) {
  const vars = sel => Object.assign({}, ...rs.filter(r => r.sel === sel).map(r => Object.fromEntries(r.decls.filter(([k]) => k.startsWith('--')))));
  const light = vars(':root');
  return { light, dark: { ...light, ...vars(':root[data-theme="dark"]') } };
}
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// The backgrounds text and controls sit on: the page, the sections, raised rows and the open items' tints.
const SURFACES = ['--bg', '--panel', '--raise', '--accent-bg', '--idea-bg', '--inbox-bg', '--bad-bg'];
// 0413: what sits in speck's screen's dark frame (its rules start ".bezel") sits on the frame's colour, not the surfaces.
const onFrame = sel => sel.split(',').every(s => /^\.bezel\b/.test(s.trim()));
const behind = sel => (onFrame(sel) ? ['--bezel'] : SURFACES);
// Rules with a fill that holds no text: the live light, the squares, the padlock, the lines between the stat tiles. (The
// stage dots and the ensō's speck went in 0168.)
const NO_TEXT = ['.live', '.live.go', '.live.stop', '.sq', '.lock::after', '.stats'];
// Every control and card with an edge of its own, by its main rule.
const EDGED = ['.tag', '.toggle', '.bezel .settings-open', '.set-ready', '.full-open', '.q .stop-build', '.q .back-to-plan', '.resume .copy',
  '#full-ticket .close', '#full-ticket .ship', '.prio-menu', '.item', '.q', '#shipped tr', 'section'];
const CONTROL = /(?:^|[^\w-])(?:\.(?:tag|toggle|settings-open|run-state|set-ready|full-open|stop-build|back-to-plan|copy|close|ship|prio-menu|item|q)|section)(?![\w-])/;
const lastCompound = s => s.trim().split(/\s+|>|\+|~/).filter(Boolean).pop() || '';
const size = r => {
  const fs = get(r, 'font-size'), font = get(r, 'font');
  const m = (fs || '').match(/^([\d.]+)px$/) || (font || '').match(/(?:^|\s)([\d.]+)px(?:\/|\s)/);
  return m ? Number(m[1]) : null;
};

test('0161 AC1: every text colour meets 4.5:1 on each background it can sit on, and 7:1 below 14 px, in light and dark', () => {
  const rs = rules(), all = looks(rs);
  let checked = 0;
  for (const [name, look] of Object.entries(all)) {
    for (const r of rs) {
      const colour = get(r, 'color');
      if (!colour || r.sel.startsWith(':root')) continue;
      if (/^(inherit|currentColor|transparent)$/i.test(colour)) continue;
      const fg = tokens(colour);
      assert.equal(fg.length, 1, `${r.sel}: its colour ${colour} is one of the panel's tokens`);
      const bgDecl = get(r, 'background') || get(r, 'background-color');
      const own = tokens(bgDecl).filter(t => !SURFACES.includes(t));
      const under = own.length ? own : behind(r.sel);
      const need = (size(r) || 13) >= 14 ? 4.5 : 7;
      for (const b of under) {
        const ratio = contrast(look[fg[0]], look[b]);
        assert.ok(ratio >= need, `${name}: ${r.sel} (${fg[0]} ${look[fg[0]]}) on ${b} ${look[b]} is ${ratio.toFixed(2)}:1, under ${need}:1`);
        checked++;
      }
    }
    assert.ok(contrast(look['--text'], look['--bg']) >= 7, `${name}: the body text`);
  }
  assert.ok(checked > 300, `the check covers the stylesheet (${checked} pairs)`);
});

test('0161 AC1: a background that isn\'t one of the surfaces either holds no text or sets its own text colour, which is checked on it', () => {
  for (const r of rules()) {
    const bg = tokens(get(r, 'background') || get(r, 'background-color')).filter(t => !SURFACES.includes(t));
    if (!bg.length) continue;
    assert.ok(get(r, 'color') || r.sel.split(',').every(s => NO_TEXT.includes(s.trim())), `${r.sel} fills with ${bg} and sets no text colour`);
  }
});

test('0161 AC1: no text is faded: only a disabled button is see-through', () => {
  for (const r of rules()) {
    const o = get(r, 'opacity');
    if (o === undefined || Number(o) >= 1) continue;
    for (const s of r.sel.split(',')) assert.match(s, /:disabled\b/, `${s.trim()} fades to ${o}`);
  }
});

test('0161 AC1: the check fails when a pair falls short', () => {
  const faint = css().replace(/--faint: #[0-9a-f]{6};/, '--faint: #999999;');
  const rs = rules(faint), { light } = looks(rs);
  const r = rs.find(x => x.sel === '.empty');
  assert.ok(contrast(light[tokens(get(r, 'color'))[0]], light['--raise']) < 7, 'a lighter --faint is caught');
});

test('0161 AC2: the edge of every control and card meets 3:1 against each background next to it, in light and dark', () => {
  const rs = rules(), all = looks(rs);
  for (const base of EDGED) {
    const own = rs.filter(x => x.sel.split(',').map(s => s.trim()).includes(base) && x.at.length === 0);
    assert.ok(own.length, `${base} has a rule`);
    const edge = own.flatMap(r => r.decls.filter(([k]) => /^border/.test(k)).flatMap(([, v]) => tokens(v)));
    assert.ok(edge.length, `${base} has a border in one of the tokens`);
  }
  let checked = 0;
  for (const [name, look] of Object.entries(all)) {
    for (const r of rs) {
      if (!r.sel.split(',').some(s => CONTROL.test(lastCompound(s)))) continue;
      const edge = r.decls.filter(([k]) => /^border/.test(k)).flatMap(([, v]) => tokens(v));
      const fill = tokens(get(r, 'background')).filter(t => !SURFACES.includes(t)); // a filled button's edge is its fill
      for (const t of [...edge, ...fill]) {
        for (const b of behind(r.sel)) {
          const ratio = contrast(look[t], look[b]);
          assert.ok(ratio >= 3, `${name}: ${r.sel}'s edge ${t} ${look[t]} on ${b} ${look[b]} is ${ratio.toFixed(2)}:1`);
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 100, `the check covers the controls (${checked} pairs)`);
});

test('0161 AC3: no text is smaller than 12 px, and nothing is lighter than weight 400', () => {
  for (const r of rules()) {
    for (const [k, v] of r.decls) {
      if (k === 'font-size' && v !== 'inherit') { // inherit: the size of a rule checked here
        const m = v.match(/^([\d.]+)px$/);
        assert.ok(m, `${r.sel}: font-size ${v} is in px`);
        assert.ok(Number(m[1]) >= 12, `${r.sel}: font-size ${v}`);
      }
      if (k === 'font' && v !== 'inherit') {
        const m = v.match(/^(?:(\d{3})\s+)?([\d.]+)px/);
        assert.ok(m, `${r.sel}: font ${v} gives a size in px`);
        assert.ok(Number(m[2]) >= 12, `${r.sel}: font ${v}`);
        if (m[1]) assert.ok(Number(m[1]) >= 400, `${r.sel}: font ${v}`);
      }
      if (k === 'font-weight' && /^\d+$/.test(v)) assert.ok(Number(v) >= 400, `${r.sel}: font-weight ${v}`);
    }
  }
  assert.match(get(rules().find(r => r.sel === 'body' && get(r, 'font')), 'font'), /^400 13px/, 'running text is 400');
});

// 0419: a Plan or Build card's tags are words in its details line, not boxes.
const IN_LINE = /\.(checks|progress|act) \.tag$/;
test('0161 AC3: the tags are 14 px text in boxes at least 28 px tall, and only the one rule sizes them', () => {
  const rs = rules();
  const tag = rs.find(r => r.sel === '.tag');
  assert.equal(get(tag, 'font-size'), '14px');
  const border = Number((get(tag, 'border').match(/^([\d.]+)px/) || [])[1]);
  assert.ok(Number(get(tag, 'line-height').replace('px', '')) + 2 * border >= 28, 'line height and borders make 28 px');
  const inLine = r => r.sel.split(',').every(s => IN_LINE.test(s.trim()));
  for (const r of rs.filter(x => x !== tag && !inLine(x) && x.sel.split(',').some(s => /\.tag(?![\w-])/.test(lastCompound(s))))) {
    for (const k of ['font', 'font-size', 'line-height', 'height', 'min-height', 'max-height', 'padding']) {
      assert.equal(get(r, k), undefined, `${r.sel} changes the tag's ${k}`);
    }
  }
});

test('0161 AC4: everything reached with the keyboard shows a ring of at least 2 px, at least 3:1 against what\'s around it', () => {
  const rs = rules(), all = looks(rs);
  const ring = rs.find(r => r.sel === ':focus-visible' && r.at.length === 0);
  assert.ok(ring, 'a :focus-visible rule for every element');
  const m = get(ring, 'outline').match(/^([\d.]+)px solid var\((--[\w-]+)\)$/);
  assert.ok(m, `the ring is a solid outline in a token: ${get(ring, 'outline')}`);
  assert.ok(Number(m[1]) >= 2, 'at least 2 px');
  for (const [name, look] of Object.entries(all)) {
    for (const b of SURFACES) assert.ok(contrast(look[m[2]], look[b]) >= 3, `${name}: the ring on ${b}`);
  }
  // Nothing takes the ring away, but the full ticket pane, which is focused to scroll it with the keys and is no control.
  for (const r of rs) {
    const o = get(r, 'outline'), w = get(r, 'outline-width'), s = get(r, 'outline-style');
    if ([o, w, s].every(v => v === undefined) || r === ring) continue;
    assert.equal(r.sel, '#full-ticket:focus', `${r.sel} sets the outline`);
  }
});

test('0161 AC4: the page can be zoomed', () => {
  const html = page();
  const vp = html.match(/<meta name="viewport" content="([^"]*)">/)[1];
  assert.doesNotMatch(vp, /user-scalable\s*=\s*(no|0)|maximum-scale/i);
  for (const r of rules()) {
    const t = get(r, 'touch-action');
    if (t !== undefined) assert.match(t, /^(auto|pinch-zoom|.*\bpinch-zoom\b.*)$/, `${r.sel}: touch-action ${t} stops a pinch`);
  }
  const script = html.slice(html.indexOf('</style>'));
  assert.doesNotMatch(script, /gesture(start|change)|['"]wheel['"]|['"]touchmove['"]/, 'no script stops a pinch or Ctrl and the wheel');
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const ago = m => new Date(Date.now() - m * 60000).toISOString();
const STATE = {
  run: { on: true },
  tickets: [
    T('0001', 'draft', { title: 'A bug, first', type: 'bug', priority: 1, risk: 'high' }),
    T('0002', 'draft', { title: 'A fix for the base', type: 'fix', priority: 0 }),
    T('0003', 'ready', { title: 'Ready to build' }),
    T('0004', 'ready', { title: 'Waiting on another', waiting_on: ['0003'] }),
    T('0005', 'building', { title: 'At work', started: ago(5) }),
    T('0006', 'blocked', { title: 'Stuck', started: ago(50), blocked_question: 'Which way?' }),
    T('0007', 'approved', { title: 'To ship', started: ago(60), approved: ago(10), rounds: [round(1, 1000)] }),
    T('0008', 'done', { title: 'Shipped', type: 'bug', started: ago(300), approved: ago(200), finished: ago(100), rounds: [round(1, 2000)] }),
  ],
  ideas: [idea('2026-10-14-an-idea', 'new'), idea('2026-10-14-a-note', 'inbox', '# A note\n\nStatus: inbox\nFrom ticket: 0008\n\nSome text.\n')],
};
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: 'a line of the log' });
    if (/\\/pack$/.test(u)) return json({ pack: '## Pack\\n\\nAll good.' });
    return real(url, opts);
  };
})();`;
async function withPanel(theme, fn) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    for (let i = 0; ; i++) {
      try { if (await b.js(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#queue .q') && !!document.querySelector('#shipped .tag')`)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    assert.equal(await b.js('document.documentElement.dataset.theme'), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

// In the page: colours as [r, g, b, a], the colour behind an element (its own and its ancestors' fills, laid over
// each other) and the contrast of two colours.
const LIB = `
  const rgba = c => { const m = String(c).match(/rgba?\\(([^)]*)\\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const behind = el => { const layers = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    return layers.reverse().reduce((acc, c) => over(c, acc), [255, 255, 255, 1]); };
  const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const shown = el => el.getClientRects().length > 0 && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden';
`;
// Every piece of text on show: its size, weight, how faded it is, whether it's in a disabled button, and its contrast.
const TEXTS = `(() => { ${LIB}
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = walk.nextNode());) {
    const el = t.parentElement;
    if (!t.textContent.trim() || !shown(el)) continue;
    const s = getComputedStyle(el);
    let fade = 1; for (let n = el; n; n = n.parentElement) fade *= Number(getComputedStyle(n).opacity);
    const bg = behind(el), fg = over(rgba(s.color), bg);
    out.push({ text: t.textContent.trim().slice(0, 30), cls: el.className, size: parseFloat(s.fontSize), weight: Number(s.fontWeight), fade,
      disabled: !!el.closest(':disabled'), ratio: ratio(fg, bg) });
  }
  return out;
})()`;
// The edge of every control and card on show against what's next to it: each border side with a width, or its fill.
const EDGES = `(() => { ${LIB}
  const out = [];
  const sel = 'button:not(.goto):not(.prio-menu button), .tag:not(:is(.checks, .progress, .act) .tag), .item, .q, #shipped tr, section:not(main > section), .prio-menu'; // 0418: a lane has no edge. 0419: a card's tags are words
  for (const el of document.querySelectorAll(sel)) {
    if (!shown(el)) continue;
    const s = getComputedStyle(el), next = behind(el.parentElement);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter(d => parseFloat(s['border' + d + 'Width']) > 0 && s['border' + d + 'Style'] !== 'none');
    const fill = rgba(s.backgroundColor);
    const edges = sides.map(d => ratio(over(rgba(s['border' + d + 'Color']), next), next));
    if (fill[3] > 0) edges.push(ratio(over(fill, next), next));
    out.push({ what: el.tagName + '.' + el.className + ' ' + (el.textContent || '').trim().slice(0, 20), best: edges.length ? Math.max(...edges) : 0,
      worst: sides.length ? Math.min(...edges.slice(0, sides.length)) : null, disabled: el.matches(':disabled') });
  }
  return out;
})()`;
// 0419: the boxed tags, apart from a Plan or Build card's, which are words in its details line
const TAGS = `[...document.querySelectorAll('.tag:not(:is(.checks, .progress, .act) .tag)')].filter(el => el.getClientRects().length).map(el => ({
  where: el.closest('#full-ticket') ? 'pane' : el.closest('#queue') ? 'build' : el.closest('#shaping') ? 'plan' : el.closest('#shipped') ? 'shipped' : 'other',
  text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize), height: el.getBoundingClientRect().height }))`;

function checkTexts(texts, where, atLeast = 21) {
  assert.ok(texts.length >= atLeast, `${where}: text found (${texts.length})`);
  for (const t of texts) {
    const what = `${where}: "${t.text}" (${t.cls})`;
    assert.ok(t.size >= 12, `${what} is ${t.size} px`);
    assert.ok(t.weight >= 400, `${what} has weight ${t.weight}`);
    if (t.disabled) continue;
    assert.equal(t.fade, 1, `${what} is faded`);
    const need = t.size >= 14 ? 4.5 : 7;
    assert.ok(t.ratio >= need - 0.005, `${what} is ${t.ratio.toFixed(2)}:1, under ${need}:1`);
  }
}
function checkEdges(edges, where, atLeast = 11) {
  assert.ok(edges.length >= atLeast, `${where}: controls found (${edges.length})`);
  for (const e of edges.filter(x => !x.disabled)) assert.ok(e.best >= 3 - 0.005, `${where}: ${e.what}'s edge is ${e.best.toFixed(2)}:1`);
}

// Opens a draft and a queued ticket in Plan and Build, the priority menu and a ticket in the full pane, and checks each
// list of Plan, in the look given.
async function everyView(b, theme) {
  await b.js(`document.querySelector('#shaping .item.ticket .head').click()`);
  await b.until(`!!document.querySelector('#shaping .item.open')`, 'the open draft');
  for (const id of ['0004', '0006', '0007']) {
    await b.js(`[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}').querySelector('.top').click()`);
  }
  await b.until(`document.querySelectorAll('#queue .q.open').length === 3`, 'the open queue tickets');
  // 0410: each lane in turn, as only the open one shows
  const tags = [];
  for (const lane of ['plan', 'build', 'shipped']) {
    await b.js(openLane(lane));
    checkTexts(await b.js(TEXTS), `${theme}, ${lane}, with Plan's tickets and Build open`);
    checkEdges(await b.js(EDGES), `${theme}, ${lane}, with Plan's tickets and Build open`, 5); // Shipped has fewer controls than the others
    tags.push(...await b.js(TAGS));
  }
  await b.js(openLane('plan'));
  await b.js(`document.querySelector('#shaping .tag.pick').click()`);
  await b.until(`!!document.querySelector('.prio-menu')`, 'the priority menu');
  checkTexts(await b.js(TEXTS), `${theme}, the priority menu`);
  checkEdges(await b.js(EDGES), `${theme}, the priority menu`);
  await b.js(`document.querySelector('.prio-menu button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await b.until(`!document.querySelector('.prio-menu')`, 'the priority menu to close');
  await b.js(`document.querySelector('#shaping .full-open').click()`);
  await b.until(`!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket .tag')`, 'the full ticket');
  checkTexts(await b.js(TEXTS), `${theme}, the full ticket`);
  checkEdges(await b.js(EDGES), `${theme}, the full ticket`);
  tags.push(...(await b.js(TAGS)).filter(t => t.where === 'pane'));
  for (const where of ['pane', 'shipped']) assert.ok(tags.some(t => t.where === where), `${theme}: tags in ${where}`);
  for (const t of tags) {
    assert.equal(t.size, 14, `${theme}: the ${t.text} tag in ${t.where} is 14 px`);
    assert.ok(t.height >= 28, `${theme}: the ${t.text} tag in ${t.where} is ${t.height} px tall`);
  }
  assert.equal(new Set(tags.map(t => Math.round(t.height))).size, 1, `${theme}: every tag is the same height: ${JSON.stringify(tags)}`);
  await b.js(`document.querySelector('#full-ticket .close').click()`);
  for (const list of ['ideas', 'inbox']) {
    await b.js(`document.querySelector('#shaping-toggle .toggle.${list}').click()`);
    await b.until(`!!document.querySelector('#shaping .item.${list === 'ideas' ? 'idea' : 'inbox'} .head')`, list);
    await b.js(`document.querySelector('#shaping .item .head').click()`);
    await b.until(`!!document.querySelector('#shaping .item.open')`, `the open ${list} item`);
    checkTexts(await b.js(TEXTS), `${theme}, ${list}`, 10); // 0410: Plan alone shows now
    checkEdges(await b.js(EDGES), `${theme}, ${list}`, 5);
  }
}

test('0161 AC1, AC2 and AC3: in a real browser, in the light look, every text and edge on show meets its contrast, and the tags are one size everywhere', skip, async () => {
  await withPanel('light', b => everyView(b, 'light'));
});

test('0161 AC1, AC2 and AC3: in a real browser, in the dark look, every text and edge on show meets its contrast, and the tags are one size everywhere', skip, async () => {
  await withPanel('dark', b => everyView(b, 'dark'));
});

test('0161 AC4: in a real browser, each button, link and tab reached with Tab shows a ring of at least 2 px, at least 3:1 against what\'s around it', skip, async () => {
  for (const theme of ['light', 'dark']) {
    await withPanel(theme, async b => {
      const seen = [];
      // 0410: from the top of each lane in turn, as only the open one shows
      for (const lane of ['plan', 'build', 'shipped']) {
        await b.js(`${openLane(lane)} && document.activeElement.blur()`);
        for (let i = 0; i < 40; i++) { // since 0165 each tag is a stop too
          await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          const f = await b.js(`(() => { ${LIB}
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const s = getComputedStyle(el), around = behind(el.parentElement);
            return { what: el.tagName + '.' + el.className + ' ' + el.textContent.trim().slice(0, 20), width: parseFloat(s.outlineWidth), style: s.outlineStyle,
              ratio: ratio(over(rgba(s.outlineColor), around), around), offset: parseFloat(s.outlineOffset) };
          })()`);
          if (f) seen.push(f);
        }
      }
      assert.ok(seen.length >= 10, `${theme}: Tab reaches the controls (${seen.length})`);
      for (const kind of ['BUTTON.toggle', 'BUTTON.settings-open', 'SPAN.title-link', 'BUTTON.full-open', 'BUTTON.goto']) {
        assert.ok(seen.some(f => f.what.startsWith(kind)), `${theme}: Tab reaches a ${kind}: ${seen.map(f => f.what).join(' | ')}`);
      }
      for (const f of seen) {
        assert.equal(f.style, 'solid', `${theme}: ${f.what} shows a ring`);
        assert.ok(f.width >= 2, `${theme}: ${f.what}'s ring is ${f.width} px`);
        assert.ok(f.ratio >= 3, `${theme}: ${f.what}'s ring is ${f.ratio.toFixed(2)}:1`);
      }
    });
  }
});
