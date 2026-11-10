// 0455: a ticket's build log looks like a terminal in every look: a black box with light text and an edge on all four
// sides. 0602: no longer: it sits flat in the full view, on the panel's own colours in each look, its text readable on them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';

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
// 0602: each kind's colour is on its row (or, for the time, its own span), and a message keeps the row's own
const KINDS = ['at', 'msg', 'tool', 'fail', 'note'];
const kindColour = k => (k === 'at' ? (css().match(/\.q \.log \.at \{[^}]*?color: ([^;}]+)/) || [])[1]
  : (css().match(new RegExp(`\\.q \\.log \\.ln\\.${k}[,\\s][^{]*\\{[^}]*?color: ([^;}]+)`)) || [])[1] ?? (css().match(/\.q \.log \.ln \{[^}]*?color: ([^;}]+)/) || [])[1])?.trim();

test('0455 AC1, since 0602: the build log has no background of its own, so it is on the view\'s colour in each look', () => {
  assert.equal(decl(logDecls(), 'background'), undefined, 'no background');
  assert.equal(decl(logDecls(), 'color-scheme'), undefined, 'not dark in the light look');
  assert.doesNotMatch(css(), /\[data-theme[^{]*\.q \.log[^{]*\{/, 'no look has a rule of its own for the log');
});

test('0455 AC2, since 0602: every kind of log text is at least 4.5:1 on the panel, in both looks, and a failure and a message each in its own colour', () => {
  for (const [name, look] of [['light', light()], ['dark', dark()]]) {
    const bg = resolve('var(--panel)', look), seen = new Map();
    for (const k of KINDS) {
      const c = resolve(kindColour(k), look);
      assert.match(c, /^#[0-9a-f]{3,8}$/i, `.${k} has a colour in the ${name} look: ${c}`);
      const ratio = contrast(over(c, bg), over(bg, '#000000'));
      assert.ok(ratio >= 4.5, `.${k} in the ${name} look: ${c} at ${ratio.toFixed(2)}:1`);
      seen.set(k, c);
    }
    assert.equal(new Set(['msg', 'tool', 'fail'].map(k => seen.get(k))).size, 3, `a message, a tool call and a failure each have a colour of their own in the ${name} look`);
  }
});

test('0455 AC3, since 0602: the log box has no four-sided border or corners, only a line above and below it', () => {
  const d = logDecls();
  assert.equal(decl(d, 'border'), undefined, 'no box around it');
  assert.equal(decl(d, 'border-radius'), undefined, 'no corners');
  assert.equal(decl(d, 'border-top'), '1px solid var(--line-soft)');
  assert.equal(decl(d, 'border-bottom'), '1px solid var(--line-soft)');
  assert.doesNotMatch(css(), /\.q \.log[,\s][^{]*\{ border-radius: 12px; \}/, 'no 12 px corners');
});

test('0455 AC4: the log keeps its height, scrolling, line layout and selectable text', () => {
  const d = logDecls();
  assert.equal(decl(d, 'height'), '24em');
  assert.equal(decl(d, 'max-height'), '24em');
  assert.equal(decl(d, 'overflow-y'), 'auto');
  assert.equal(decl(d, 'white-space'), 'pre-wrap');
  assert.equal(decl(d, 'cursor'), 'text');
  assert.equal(decl(d, 'user-select'), undefined, 'its text can still be selected');
  assert.match(css(), /, \.q \.log \.ln \{ display: block; min-width: 0; padding-left: 74px;/, '0602\'s line layout');
});

// ---------- in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// 0585: the log is in the full view's live section, which a Build row opens.
const row = `document.querySelector('#full-ticket .q.live')`;
const box = `document.querySelector('#full-ticket .log')`;
const said = (text, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'text', text }] } })}\n`;
const ran = (command, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'tool_use', name: 'Bash', input: { command } }] } })}\n`;
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`;
const parse = s => (s.match(/[\d.]+/g) || []).map(Number).map((v, i) => (i < 3 ? v / 255 : v));
const flat = (fg, bg) => { const [r, g, b, a = 1] = parse(fg), [R, G, B] = parse(bg); return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]; };

test('0455 AC1, AC2, AC3, since 0602: in a real browser, the log is flat on the view in every look, its text readable, and its lines above and below show on a phone at 3x', chrome, async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  assert.equal(r.run('set', '1', 'status', 'building').status, 0); // in flight, so its full view follows its log
  fs.writeFileSync(path.join(runs, '0001.log'), said('A message.', '2026-10-24T09:00:01Z') + ran('npm test', '2026-10-24T09:00:02Z'));
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`!!document.querySelector('#queue .q')`, 'the queue');
    await b.js(`document.querySelector('#queue .q .top').click()`);
    await b.until(`(${box} || {}).textContent?.includes('npm test')`, 'the log');
    const LOOKS = [['light', 'light', 'light'], ['dark', 'dark', 'dark'], ['System, set to dark', null, 'dark'], ['System, set to light', null, 'light']];
    for (const [look, set, system] of LOOKS) {
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: system }] });
      await b.js(set ? `setLook('${set}'), true` : `localStorage.removeItem('speck-theme'), document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', true`);
      await b.until(`document.documentElement.dataset.theme === '${system}'`, look);
      await b.js(frames);
      const got = await b.js(`(() => {
        const box = ${box}, cs = getComputedStyle(box);
        const kinds = {};
        for (const k of ['msg', 'tool', 'fail', 'note']) { const n = document.createElement('span'); n.className = 'ln ' + k; box.appendChild(n); kinds[k] = getComputedStyle(n).color; n.remove(); }
        kinds.at = getComputedStyle(box.querySelector('.at')).color;
        return { bg: cs.backgroundColor, page: getComputedStyle(${row}).backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.getElementById('full-ticket')).backgroundColor : getComputedStyle(${row}).backgroundColor, kinds,
          styles: [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle], widths: [cs.borderTopWidth, cs.borderBottomWidth] };
      })()`);
      assert.equal(got.bg, 'rgba(0, 0, 0, 0)', `AC1, ${look}: no background of its own`);
      const bg = flat(got.page, 'rgb(0, 0, 0)');
      for (const [k, c] of Object.entries(got.kinds)) {
        const ratio = contrast(flat(c, got.page), bg);
        assert.ok(ratio >= 4.5, `AC2, ${look}: ${k} text ${c} at ${ratio.toFixed(2)}:1`);
      }
      assert.equal(new Set(['msg', 'tool', 'fail'].map(k => got.kinds[k])).size, 3, `AC2, ${look}: a message, a tool call and a failure each keep a colour of their own`);
      assert.deepEqual(got.styles, ['solid', 'none', 'solid', 'none'], `AC3, ${look}: a line above and below, no sides`);
      got.widths.forEach(w => assert.ok(parseFloat(w) * 3 >= 1, `AC3, ${look}: its line is ${w}, at least a device pixel`));
    }

  } finally {
    await b.close();
    await stop(panel);
  }
});
