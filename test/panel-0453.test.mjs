import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fm, good, openLane } from './support/panel.mjs';
import { readPng } from './support/icons.mjs';

// ---------- 0453: every button's border on all four sides on a phone, as 0281 gave Settings' info buttons ----------

// Runs in the page: each button on show with a border, its edges, the width the stylesheet gives each side's border at
// this pixel ratio, its corners and its sides' colours. Chromium draws any border under 1px as 1px, so its computed
// widths can't show what a phone's Safari is given (0281): the width is read from the rules, in cascade order.
function measure() {
  const rules = [];
  const walk = list => { for (const r of Array.from(list)) {
    if (r.media) { if (matchMedia(r.media.mediaText).matches) walk(r.cssRules); }
    else if (r.cssRules && typeof r.conditionText === 'string') { if (CSS.supports(r.conditionText)) walk(r.cssRules); }
    else if (r.selectorText) rules.push(r);
  } };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
  const split = s => { const out = []; let depth = 0, cur = '';
    for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; }
    return [...out, cur].map(x => x.trim()); };
  // A selector's specificity, enough for this stylesheet: nothing in :where() counts, and :not(), :is() and :has() count their arguments.
  const spec = s => {
    s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/:(?:not|is|has)\(/g, ' (');
    const a = (s.match(/#[\w-]+/g) || []).length, b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) || []).length;
    const c = (s.replace(/\[[^\]]*\]|[#.:][\w-]+/g, ' ').match(/(?:^|[\s>+~(])[a-z][\w-]*/gi) || []).length;
    return a * 1e6 + b * 1e3 + c;
  };
  // A shorthand with var() in it leaves its longhands blank, so the width is read from the shorthand then.
  const set = (st, side) => st.getPropertyValue(`border-${side}-width`)
    || (st.getPropertyValue(`border-${side}`) || st.getPropertyValue('border')).match(/(?:^|\s)(0|[\d.]+px)(?=\s|$)/)?.[1];
  const declared = (n, side) => {
    const on = rules.map((r, order) => ({ r, order, spec: Math.max(-1, ...split(r.selectorText).filter(s => { try { return n.matches(s); } catch { return false; } }).map(spec)) }))
      .filter(x => x.spec >= 0 && set(x.r.style, side)).sort((x, y) => x.spec - y.spec || x.order - y.order);
    return on.length ? set(on[on.length - 1].r.style, side) : null;
  };
  const shown = n => n.getClientRects().length && !n.closest('[hidden], [inert]') && getComputedStyle(n).visibility !== 'hidden';
  return [...document.querySelectorAll('button')].filter(shown).map(n => {
    const cs = getComputedStyle(n), r = n.getBoundingClientRect(), prev = n.previousElementSibling;
    const sides = ['top', 'right', 'bottom', 'left'];
    return { what: `${n.className || n.id} "${n.textContent.trim().slice(0, 20)}"`, cls: n.className, text: n.textContent.trim(),
      left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      styles: sides.map(s => cs[`border${s[0].toUpperCase()}${s.slice(1)}Style`]),
      widths: sides.map(s => declared(n, s)),
      colours: sides.map(s => cs[`border${s[0].toUpperCase()}${s.slice(1)}Color`]),
      corners: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius],
      // a tab after another shares the edge between them (0428), drawn by the tab before it
      sharedWith: prev && prev.tagName === 'BUTTON' && /\btab\b/.test(n.className) ? { right: prev.getBoundingClientRect().right, width: declared(prev, 'right') } : null };
  }).filter(o => o.styles.some(s => s !== 'none'));
}
const MEASURE = `(${measure})()`;
const whole = x => Math.abs(x - Math.round(x)) < 1e-6;
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`;

// A repo whose panel has a draft in Plan, an approved ticket in Build and a shipped one.
function repo() {
  const r = panelRepo();
  const iso = t => new Date(t).toISOString();
  r.write('0002-a.md', fm({ id: '"0002"', title: "'An approved ticket'", status: 'approved' }), good);
  r.write('0003-d.md', fm({ id: '"0003"', title: "'A draft to shape'", status: 'draft', priority: 2 }), good);
  r.write('0010-t.md', fm({ id: '"0010"', title: "'A shipped ticket with a longer title'", status: 'done', started: iso(Date.now() - 3e6), finished: iso(Date.now() - 1e6) }), good, 'speck/tickets/done');
  r.g('add', '-A'); r.g('commit', '-qm', 'tickets');
  return r;
}
const PACK = `{ id: '0002', state: 'ok', text: '# Review pack\\n\\nIt passed.', pictures: [], documents: [{ path: 'outputs/0002/plan.md', url: '/api/tickets/0002/output/plan.md' }] }`;
// Each view with buttons, opened in turn: [name, script that opens it, what shows once it's open].
const VIEWS = [
  ['Plan, a ticket open', `${openLane('plan')}, document.querySelector('#shaping .item .head').click(), true`, `!!document.querySelector('#shaping .item.open .full-open')`],
  ['Plan, the priority menu', `document.querySelector('#shaping .tag.pick, #shaping .set-prio').click(), true`, `!!document.querySelector('.prio-menu button')`],
  ['Build, a ticket open', `document.querySelector('.prio-menu button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), ${openLane('build')}, document.querySelector('#queue .q .top').click(), true`, `!!document.querySelector('#queue .q.open .full-open')`],
  ['Shipped, a ticket open', `${openLane('shipped')}, document.querySelector('#shipped .line .title').click(), true`, `!!document.querySelector('#shipped .facts')`], // 0466: its title opens it
  ['the full ticket', `${openLane('plan')}, document.querySelector('#shaping .item.open .full-open').click(), true`, `!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket .close')`],
  ['a review pack with a document', `closeFull(), packOf = ${PACK}, fullId = '0002', fullFrom = null, render(), true`, `!!document.querySelector('#full-ticket .pack-document')`],
  ['a document', `docOpen = { id: '0002', path: 'outputs/0002/plan.md', state: 'ok', text: '# Plan\\n\\nWords.' }, drawDoc(), true`, `!document.getElementById('doc-view').hidden && !!document.querySelector('#doc-view .close')`],
  ['Settings', `closeDoc(), closeFull(), document.getElementById('settings-open').click(), true`, `document.querySelectorAll('#settings .setting').length >= 10 && !!document.querySelector('#settings .save-all')`],
  ['Settings\' question about unsaved changes', `settingsLeaving = { saving: false }, renderLeaving(), true`, `!document.getElementById('settings-unsaved').hidden && document.querySelectorAll('#settings-unsaved button').length === 3`],
  ['the Foreman', `keepEditing(), closeSettings(), document.getElementById('run').click(), true`, `!document.getElementById('foreman').hidden && !!document.querySelector('#foreman .close')`],
];
// Opens the panel at a size and pixel ratio, then each view in turn, calling `each(view, buttons)` with what MEASURE gives.
async function eachView(b, port, width, dpr, each) {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: dpr, mobile: width < 900 });
  await b.send('Page.navigate', { url: `http://127.0.0.1:${port}/?w=${width}&d=${dpr}` });
  await b.until(`location.search === '?w=${width}&d=${dpr}' && document.readyState === 'complete' && !!document.querySelector('#shaping .item .head') && !!document.querySelector('#shipped .line .title')`, 'the panel');
  await b.js(`document.fonts.ready.then(() => true)`);
  for (const [view, open, shows] of VIEWS) {
    await b.js(open);
    await b.until(shows, view);
    await b.js(frames);
    await each(view, await b.js(MEASURE));
  }
}

const skip = findChrome() ? false : 'needs Chrome or Chromium';

// The phone widths, odd ones among them, and a wide window at an odd width, which centres the column.
const SIZES = [[320, 1], [375, 3], [390, 3], [393, 3], [400, 2], [1280, 1], [1281, 2]];
test('0453 AC1 AC3: at every width and pixel ratio, every button sits on whole pixels with a border at least a device pixel on all four sides, and keeps its corners', { skip }, async () => {
  const r = repo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const seen = new Set();
  try {
    for (const [width, dpr] of SIZES) {
      await eachView(b, panel.port, width, dpr, (view, all) => {
        const at = `${width} px at ${dpr}x, ${view}`;
        assert.ok(all.length >= 1, `${at}: buttons found (${all.length})`);
        for (const o of all) {
          seen.add(o.text);
          // AC1: its left and right edges on whole pixels, or a tab's left edge on the tab before it, which draws that side
          assert.ok(whole(o.right), `${at}: ${o.what}'s right edge at ${o.right} px`);
          if (o.widths[3] === '0' || o.widths[3] === '0px') {
            assert.ok(o.sharedWith, `${at}: ${o.what} has no left side`);
            assert.ok(Math.abs(o.sharedWith.right - o.left) < 1e-6, `${at}: ${o.what} starts where the tab before it ends`);
            assert.ok(parseFloat(o.sharedWith.width) * dpr >= 1 - 1e-6, `${at}: the side ${o.what} shares is ${o.sharedWith.width}`);
          } else assert.ok(whole(o.left), `${at}: ${o.what}'s left edge at ${o.left} px`);
          // AC1: each side's border at least a device pixel
          o.widths.forEach((w, i) => {
            if (i === 3 && o.sharedWith && parseFloat(w) === 0) return;
            assert.match(String(w), /^[\d.]+px$/, `${at}: ${o.what}'s side ${i} border ${w} is set in px`);
            assert.ok(parseFloat(w) * dpr >= 1 - 1e-6, `${at}: ${o.what} has a ${w} border on side ${i}`);
            assert.notEqual(o.styles[i], 'none', `${at}: ${o.what}'s side ${i} is drawn`);
          });
          // AC3: its 8 px corners (0428), a tab's on top only, and speck's screen its own (0438), and every side drawn in the one colour
          const corner = /\btab\b/.test(o.cls) ? ['8px', '8px', '0px', '0px'] : /\bglass\b/.test(o.cls) ? ['4px', '4px', '4px', '4px'] : ['8px', '8px', '8px', '8px'];
          assert.deepEqual(o.corners, corner, `${at}: ${o.what}'s corners`);
          if (!/\btab\b/.test(o.cls)) assert.equal(new Set(o.colours).size, 1, `${at}: ${o.what}'s sides are one colour: ${o.colours}`);
        }
      });
    }
    for (const name of ['More stats', 'Close', 'Save', 'Review pack', 'Full ticket', 'Set ready', 'Ship', 'Ask for changes', 'outputs/0002/plan.md', 'Plan', 'Build', 'Light', 'Discard', 'Keep editing'])
      assert.ok(seen.has(name) || [...seen].some(t => t.startsWith(name)), `the ${name} button was checked`);
  } finally { await b.close(); await stop(panel); }
});

// AC3: the open tab's edge is the text colour, as before, though the tab before it draws the side they share. 0457: its
// bottom edge is the lane's colour, so the tab and its lane are one sheet.
test('0453 AC3: the open tab is edged in the text colour on its top and sides', { skip }, async () => {
  const r = repo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 3, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete' && !!document.querySelector('#shipped .line .title')`, 'the panel');
    for (const lane of ['plan', 'build', 'shipped']) {
      await b.js(openLane(lane));
      const got = await b.js(`(() => { const t = document.getElementById('tab-${lane}'), prev = t.previousElementSibling, cs = getComputedStyle(t), text = getComputedStyle(document.body).color;
        const ink = n => { const c = document.createElement('span'); c.style.color = n; document.body.append(c); const v = getComputedStyle(c).color; c.remove(); return v; };
        const want = ink('var(--text)');
        return { top: cs.borderTopColor === want, right: cs.borderRightColor === want, bottom: cs.borderBottomColor === ink('var(--panel)'),
          left: prev ? getComputedStyle(prev).borderRightColor === want : cs.borderLeftColor === want }; })()`);
      assert.deepEqual(got, { top: true, right: true, bottom: true, left: true }, `${lane}'s tab`);
    }
  } finally { await b.close(); await stop(panel); }
});

// AC2: a picture of each button at a phone's size and pixel ratio shows its border on every side. For each side, along its
// middle, the device pixels at its edge differ from the button's own background just inside it.
const NAMED = [
  ['Shipped, a ticket open', '#more-stats'],
  ['Shipped, a ticket open', '#shipped .full-cell .full-open:first-child'], // 0466: Full ticket, where Details was
  ['Shipped, a ticket open', '#shipped .full-cell .full-open:last-child'],
  ['Build, a ticket open', '#queue .q.open .full-open'],
  ['the full ticket', '#full-ticket .close'],
  ['a review pack with a document', '#full-ticket .close'],
  ['a review pack with a document', '#full-ticket .pack-document'],
  ['a document', '#doc-view .close'],
  ['Settings', '#settings .close'],
  ['Settings', '#settings .save-all'],
  ['Settings\' question about unsaved changes', '#settings-unsaved .save-all'],
  ['the Foreman', '#foreman .close'],
];
const sidesShown = (png, r, dpr) => {
  const px = (x, y) => png.at(Math.max(0, Math.min(png.w - 1, x)), Math.max(0, Math.min(png.h - 1, y)));
  const differs = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) >= 24;
  const L = Math.round(r.left * dpr), R = Math.round(r.right * dpr) - 1, T = Math.round(r.top * dpr), B = Math.round(r.bottom * dpr) - 1;
  const along = (from, to) => { const out = []; for (let i = Math.ceil(from + (to - from) / 3); i <= Math.floor(to - (to - from) / 3); i++) out.push(i); return out; };
  // the edge's outermost device pixels, against the button's background a few device pixels in from it
  const side = (points, edge, inside) => points.filter(p => edge(p).some(e => differs(px(...e), px(...inside(p))))).length / points.length;
  return {
    top: side(along(L, R), x => [[x, T], [x, T + 1]], x => [x, T + 4]),
    bottom: side(along(L, R), x => [[x, B], [x, B - 1]], x => [x, B - 4]),
    left: side(along(T, B), y => [[L, y], [L + 1, y]], y => [L + 5, y]),
    right: side(along(T, B), y => [[R, y], [R - 1, y]], y => [R - 5, y]),
  };
};
test('0453 AC2: on a phone at a pixel ratio of 3, Full ticket (0466: where Details was), Close, Save, Review pack, a document\'s button and the Foreman\'s Close show all four sides of their border', { skip }, async () => {
  const r = repo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const checked = [];
  try {
    await eachView(b, panel.port, 390, 3, async view => {
      for (const [v, sel] of NAMED.filter(([v]) => v === view)) {
        await b.js(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({ block: 'center' }), true`);
        await b.js(frames);
        const rect = await b.js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
        const shot = await b.send('Page.captureScreenshot', { format: 'png' });
        const png = readPng(Buffer.from(shot.data, 'base64'));
        assert.equal(png.w, 390 * 3, 'the picture is in device pixels');
        const shown = sidesShown(png, rect, 3);
        for (const [s, share] of Object.entries(shown)) assert.ok(share >= 0.9, `${v}, ${sel}: its ${s} side shows along ${(share * 100).toFixed(0)}% of its middle`);
        checked.push(`${v}: ${sel}`);
      }
    });
    assert.equal(checked.length, NAMED.length, `every named button checked: ${checked.join('; ')}`);
  } finally { await b.close(); await stop(panel); }
});
