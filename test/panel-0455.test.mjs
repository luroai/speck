// 0455: a ticket's build log looks like a terminal in every look: a black box with light text and an edge on all four
// sides.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';
import { readPng } from './support/icons.mjs';

// ---------- the colours, from the stylesheet ----------

const css = () => styles();
const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const light = () => vars((css().match(/:root \{([\s\S]*?)\}/) || [])[1] || '');
const dark = () => new Map([...light(), ...vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '))]);
// Every declaration in the rules for exactly `.q .log`, in order.
const logDecls = () => [...css().matchAll(/^\s*\.q \.log \{([^}]*)\}/gm)].flatMap(m => [...m[1].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map(d => [d[1], d[2].trim()]));
const decl = (decls, name) => (decls.filter(([k]) => k === name).pop() || [])[1];
// A colour's value in a look: a var() resolved from the log's own declarations first, then the look's.
const resolve = (value, look) => {
  const own = new Map(logDecls().filter(([k]) => k.startsWith('--')));
  for (let i = 0; i < 5 && /var\(/.test(value); i++) value = value.replace(/var\((--[\w-]+)\)/, (_, v) => own.get(v) ?? look.get(v));
  return value;
};
const rgba = hex => {
  const h = hex.replace('#', '');
  const full = h.length <= 4 ? [...h].map(c => c + c).join('') : h;
  return [0, 2, 4, 6].map(i => (i < full.length ? parseInt(full.slice(i, i + 2), 16) : 255) / 255);
};
const over = (fg, bg) => { const [r, g, b, a] = rgba(fg), [R, G, B] = rgba(bg); return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]; };
const lum = ([r, g, b]) => [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const KINDS = ['at', 'msg', 'tool', 'fail', 'note'];
const kindColour = k => (css().match(new RegExp(`\\.q \\.log \\.${k} \\{[^}]*?color: ([^;}]+)`)) || [])[1]?.trim();

test('0455 AC1: the build log has the same background in both looks, darker than the dark look\'s page', () => {
  const bg = decl(logDecls(), 'background');
  assert.ok(bg, 'the log has a background');
  const inLight = resolve(bg, light()), inDark = resolve(bg, dark());
  assert.match(inLight, /^#[0-9a-f]{3,8}$/i, `a colour in the light look: ${inLight}`);
  assert.equal(inLight, inDark, 'the same in both looks');
  assert.ok(lum(over(inLight, '#ffffff')) < lum(over('#141414', '#ffffff')), `${inLight} is darker than #141414`);
  // nothing for one look alone changes it: no rule but `.q .log`'s own sets the log's background or its colours
  assert.doesNotMatch(css(), /\[data-theme[^{]*\.q \.log[^{]*\{/, 'no look has a rule of its own for the log');
});

test('0455 AC2: every kind of log text is at least 4.5:1 on the log\'s background, in both looks, each in its own colour', () => {
  const bg = resolve(decl(logDecls(), 'background'), light());
  for (const [name, look] of [['light', light()], ['dark', dark()]]) {
    const plain = resolve(decl(logDecls(), 'color'), look);
    assert.ok(contrast(over(plain, bg), over(bg, '#000000')) >= 4.5, `plain lines in the ${name} look: ${plain}`);
    const seen = new Set([plain]);
    for (const k of KINDS) {
      const c = resolve(kindColour(k), look);
      assert.match(c, /^#[0-9a-f]{3,8}$/i, `.${k} has a colour in the ${name} look: ${c}`);
      const ratio = contrast(over(c, bg), over(bg, '#000000'));
      assert.ok(ratio >= 4.5, `.${k} in the ${name} look: ${c} at ${ratio.toFixed(2)}:1`);
      if (k !== 'at') { assert.ok(!seen.has(c), `.${k} has a colour of its own in the ${name} look`); seen.add(c); }
    }
  }
});

test('0455 AC3: the log box has a border on all four sides, in whole CSS pixels, with rounded corners', () => {
  const d = logDecls();
  assert.equal(decl(d, 'border-left'), undefined, 'no left edge of its own any more');
  assert.match(decl(d, 'border') || '', /^1px solid /, 'one CSS pixel on every side, at least a device pixel at any ratio');
  assert.match(css(), /\.q \.log, [^{]*\{ border-radius: 12px; \}|, \.q \.log,[^{]*\{ border-radius: 12px; \}/, 'its 12 px corners');
});

test('0455 AC4: the log keeps its height, scrolling, monospaced font, line layout and selectable text', () => {
  const d = logDecls();
  assert.equal(decl(d, 'height'), '24em');
  assert.equal(decl(d, 'max-height'), '24em');
  assert.equal(decl(d, 'overflow-y'), 'auto');
  assert.match(decl(d, 'font'), /^12px\/1\.5 "SF Mono".*monospace$/);
  assert.equal(decl(d, 'white-space'), 'pre-wrap');
  assert.equal(decl(d, 'cursor'), 'text');
  assert.equal(decl(d, 'user-select'), undefined, 'its text can still be selected');
  assert.match(css(), /\.q \.log \.ln \{ display: block; padding-left: 9ch; \}/, '0422\'s line layout');
});

// ---------- in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const row = `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '0001')`;
const box = `${row}.querySelector('.log')`;
const said = (text, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'text', text }] } })}\n`;
const ran = (command, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'tool_use', name: 'Bash', input: { command } }] } })}\n`;
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`;
// As 0453's: how much of the middle third of each side has its outermost device pixels unlike the box a few pixels in.
const sidesShown = (png, r, dpr) => {
  const px = (x, y) => png.at(Math.max(0, Math.min(png.w - 1, x)), Math.max(0, Math.min(png.h - 1, y)));
  const differs = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) >= 24;
  const L = Math.round(r.left * dpr), R = Math.round(r.right * dpr) - 1, T = Math.round(r.top * dpr), B = Math.round(r.bottom * dpr) - 1;
  const along = (from, to) => { const out = []; for (let i = Math.ceil(from + (to - from) / 3); i <= Math.floor(to - (to - from) / 3); i++) out.push(i); return out; };
  const side = (points, edge, inside) => points.filter(p => edge(p).some(e => differs(px(...e), px(...inside(p))))).length / points.length;
  return {
    top: side(along(L, R), x => [[x, T], [x, T + 1]], x => [x, T + 4]),
    bottom: side(along(L, R), x => [[x, B], [x, B - 1]], x => [x, B - 4]),
    left: side(along(T, B), y => [[L, y], [L + 1, y]], y => [L + 5, y]),
    right: side(along(T, B), y => [[R, y], [R - 1, y]], y => [R - 5, y]),
  };
};
const whole = x => Math.abs(x - Math.round(x)) < 1e-6;
const parse = s => (s.match(/[\d.]+/g) || []).map(Number).map((v, i) => (i < 3 ? v / 255 : v));
const flat = (fg, bg) => { const [r, g, b, a = 1] = parse(fg), [R, G, B] = parse(bg); return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]; };

test('0455 AC1, AC2, AC3: in a real browser, the log is the same dark box in every look, its text readable, and all four of its sides show on a phone at 3x', chrome, async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.log'), said('A message.', '2026-10-24T09:00:01Z') + ran('npm test', '2026-10-24T09:00:02Z'));
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`!!${row}`, 'the queue');
    await b.js(`${row}.querySelector('.top').click()`);
    await b.until(`(${box} || {}).textContent?.includes('npm test')`, 'the log');
    const LOOKS = [['light', 'light', 'light'], ['dark', 'dark', 'dark'], ['System, set to dark', null, 'dark'], ['System, set to light', null, 'light']];
    const backgrounds = new Set();
    for (const [look, set, system] of LOOKS) {
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: system }] });
      await b.js(set ? `setLook('${set}'), true` : `localStorage.removeItem('speck-theme'), document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', true`);
      await b.until(`document.documentElement.dataset.theme === '${system}'`, look);
      await b.js(frames);
      const got = await b.js(`(() => {
        const box = ${box}, cs = getComputedStyle(box), r = box.getBoundingClientRect();
        const kinds = {}; for (const k of ['at', 'msg', 'tool', 'fail', 'note']) { const n = document.createElement('span'); n.className = k; box.appendChild(n); kinds[k] = getComputedStyle(n).color; n.remove(); }
        return { bg: cs.backgroundColor, page: getComputedStyle(document.body).backgroundColor, plain: cs.color, kinds,
          edges: [r.top - ${row}.getBoundingClientRect().top, r.right, r.height, r.left], styles: [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle],
          widths: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
          colours: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor], card: getComputedStyle(${row}).backgroundColor,
          corners: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius] };
      })()`);
      backgrounds.add(got.bg);
      const bg = flat(got.bg, 'rgb(0, 0, 0)');
      assert.ok(lum(bg) < lum(flat('rgb(20, 20, 20)', 'rgb(0, 0, 0)')), `AC1, ${look}: ${got.bg} is darker than #141414`);
      for (const [k, c] of [['plain', got.plain], ...Object.entries(got.kinds)]) {
        const ratio = contrast(flat(c, got.bg), bg);
        assert.ok(ratio >= 4.5, `AC2, ${look}: ${k} text ${c} at ${ratio.toFixed(2)}:1`);
      }
      assert.equal(new Set(['msg', 'tool', 'fail', 'note'].map(k => got.kinds[k])).size, 4, `AC2, ${look}: each kind keeps a colour of its own`);
      got.styles.forEach((s, i) => assert.equal(s, 'solid', `AC3, ${look}: side ${i} is drawn`));
      got.widths.forEach((w, i) => assert.ok(parseFloat(w) * 3 >= 1, `AC3, ${look}: side ${i} is ${w}, at least a device pixel`));
      // its left and right edges on whole pixels, and its top and height whole within its card: the header and tabs above it
      // are what put a card's top on a fraction of a pixel
      got.edges.forEach((e, i) => assert.ok(whole(e), `AC3, ${look}: ${['top in its card', 'right edge', 'height', 'left edge'][i]} at ${e} px`));
      got.colours.forEach((c, i) => assert.notEqual(c, got.card, `AC3, ${look}: side ${i} differs from the card it sits on`));
      got.corners.forEach(c => assert.equal(c, '12px', `AC3, ${look}: rounded corners`));
      // AC3: all four sides show in the picture itself, in device pixels
      await b.js(`${box}.scrollIntoView({ block: 'center' }), true`);
      await b.js(frames);
      const rect = await b.js(`(() => { const r = ${box}.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()`);
      const png = readPng(Buffer.from((await b.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      assert.equal(png.w, 390 * 3, 'the picture is in device pixels');
      for (const [s, share] of Object.entries(sidesShown(png, rect, 3))) assert.ok(share >= 0.9, `AC3, ${look}: the ${s} side shows along ${(share * 100).toFixed(0)}% of its middle`);
    }
    assert.equal(backgrounds.size, 1, `AC1: the same background in every look: ${[...backgrounds]}`);

  } finally {
    await b.close();
    await stop(panel);
  }
});
