import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page } from './support/panel.mjs';

// ---------- 0426: use Cursor's colours in the panel ----------

const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const vars = block => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
// Each look's tokens: every plain :root block, and the dark look's block over them.
function looks(text = css()) {
  const plain = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const light = Object.assign({}, ...[...plain.matchAll(/(?:^|\n)\s*:root \{([^}]*)\}/g)].map(m => vars(m[1])));
  const dark = { ...light, ...Object.assign({}, ...[...plain.matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => vars(m[1]))) };
  return { light, dark };
}
// The declarations of every rule whose selector list is exactly `sel`, outside any at-rule.
const rule = sel => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = [...css().matchAll(new RegExp(`\\n  ${esc} \\{([^}]*)\\}`, 'g'))].map(m => m[1]);
  assert.ok(found.length, `a rule for ${sel}`);
  return found.join(';');
};
const uses = (sel, prop, token) => assert.match(rule(sel), new RegExp(`(?:^|;|\\s)${prop}:[^;]*var\\(${token}\\)`), `${sel} sets ${prop} to ${token}`);

const rgba = hex => [1, 3, 5, 7].map(i => (hex.length > i ? parseInt(hex.slice(i, i + 2), 16) : 255) / 255);
const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (fg, bg) => { const back = rgba(bg), front = over(rgba(fg), back); const [x, y] = [lum(front), lum(back)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const SURFACES = ['--bg', '--panel', '--raise', '--input', '--accent-bg', '--idea-bg', '--inbox-bg', '--bad-bg'];
const meets = (look, colour, need) => SURFACES.every(s => contrast(colour, look[s]) >= need);

// The nearest shade: the colour's HSL lightness moved, a quarter of a percent at a time, until it meets `need` on every
// surface (lighter in the dark look, darker in the light one).
const hsl = hex => {
  const [r, g, b] = rgba(hex), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6;
  return [h, s, l];
};
const hex = ([h, s, l]) => {
  const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
};
function nearest(look, colour, need, dir) {
  const [h, s, l] = hsl(colour);
  for (let k = 0; k <= 400; k++) {
    const x = hex([h, s, Math.min(1, Math.max(0, l + dir * k * 0.0025))]);
    if (meets(look, x, need)) return x;
  }
  return null;
}
// The nearest alpha of a grey that meets `need` on every surface, from the alpha given up.
function nearestAlpha(look, grey, from, need) {
  for (let a = from; a <= 255; a++) { const x = grey + a.toString(16).padStart(2, '0'); if (meets(look, x, need)) return x; }
  return null;
}
const same = (a, b, what) => assert.equal(String(a).toLowerCase(), String(b).toLowerCase(), what);

const CURSOR = {
  light: { grey: '#141414', text: '#141414EB', muted: '#141414AD', bg: '#F3F3F3', panel: '#FCFCFC', input: '#FCFCFC', dir: -1,
    red: '#CF2D56', magenta: '#B8448B', green: '#1F8A65', blue: '#3C7CAB', cyan: '#4C7F8C', yellow: '#A16900' },
  dark: { grey: '#E4E4E4', text: '#E4E4E4EB', muted: '#E4E4E48D', bg: '#141414', panel: '#181818', input: '#1C1C1C', dir: 1,
    red: '#E34671', magenta: '#B48EAD', green: '#70B489', blue: '#81A1C1', cyan: '#88C0D0', yellow: '#D2943E' },
};

test('0426 AC1: the page, cards, text and inputs are Cursor Dark\'s and Cursor Light\'s', () => {
  const all = looks();
  for (const [name, c] of Object.entries(CURSOR)) {
    const look = all[name];
    same(look['--bg'], c.bg, `${name}: the page behind the lanes`);
    same(look['--panel'], c.panel, `${name}: cards, the open tab, pop-ups and Settings`);
    same(look['--text'], c.text, `${name}: text`);
    same(look['--input'], c.input, `${name}: inputs`);
  }
  for (const sel of ['body', 'header', '.tabs']) uses(sel, 'background', '--bg');
  for (const sel of ['section', '.tab[aria-selected="true"]', '.prio-menu', '#tag-tip', '#settings', '#full-ticket', '#settings-unsaved .box'])
    assert.match(rule(sel), /background(?:-color)?: var\(--panel\)/, `${sel} is on --panel`);
  for (const sel of ['#settings .setting .edit, #settings .arow .edit', '.foreman-ask .ask-answer', '#full-ticket .changes-note, #doc-view .changes-note'])
    uses(sel, 'background', '--input');
  uses('body', 'color', '--text');
});

test('0426 AC1: the browser bar and the home-screen app take the new page colour', () => {
  const html = page();
  assert.match(html, /<meta name="theme-color" content="#f3f3f3" media="\(prefers-color-scheme: light\)">/);
  assert.match(html, /<meta name="theme-color" content="#141414" media="\(prefers-color-scheme: dark\)">/);
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'templates/icons/manifest.webmanifest'), 'utf8'));
  assert.deepEqual([m.background_color, m.theme_color], ['#f3f3f3', '#f3f3f3']);
});

test('0426 AC2: muted text is Cursor\'s where it meets 0161, and small text and edges are the nearest alpha of the same grey that does', () => {
  const all = looks();
  for (const [name, c] of Object.entries(CURSOR)) {
    const look = all[name];
    same(look['--muted-large'], c.muted, `${name}: Cursor's muted text`);
    assert.ok(meets(look, c.muted, 4.5), `${name}: Cursor's muted meets 4.5:1 for text of 14 px and over`);
    assert.ok(!meets(look, c.muted, 7), `${name}: Cursor's muted falls short of 7:1, so small text needs its own shade`);
    const small = nearestAlpha(look, c.grey, parseInt(c.muted.slice(7), 16), 7);
    same(look['--muted'], small, `${name}: --muted, for text under 14 px`);
    same(look['--faint'], small, `${name}: --faint`);
    same(look['--line'], nearestAlpha(look, c.grey, 0x13, 3), `${name}: the edges of controls and cards (Cursor's #..13 is too faint)`);
  }
  // 14 px muted text is Cursor's own
  for (const sel of ['.tag', '.prio-menu button', '#full-ticket .md-h3']) uses(sel, 'color', '--muted-large');
  // and a tag in a line of 12 px text isn't
  assert.match(css(), /:where\([^)]*#shipped \.line \.tags\) \.tag \{ color: var\(--muted\); \}/);
});

test('0426 AC2: only rules whose text is 14 px or more use Cursor\'s muted', () => {
  for (const m of css().replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*var\(--muted-large\)[^{}]*)\}/g)) {
    const size = (m[2].match(/font-size:\s*([\d.]+)px/) || m[2].match(/font:[^;]*?\s([\d.]+)px/) || [])[1];
    assert.ok(Number(size) >= 14, `${m[1].trim()} is ${size || 'not given'} px`);
  }
});

test('0426 AC3: each state colour is Cursor\'s, at the nearest shade that meets 0161\'s contrast for its text', () => {
  const all = looks();
  // token, Cursor's colour, and the contrast 0161 asks of its text: 7:1, as 0161 takes a rule that sets no size to be 13 px
  const STATES = [['--bad', 'red', 7], ['--bug', 'red', 7], ['--idea', 'magenta', 7], ['--ok', 'green', 7], ['--run', 'blue', 7],
    ['--warn', 'yellow', 7], ['--fix', 'yellow', 7]];
  for (const [name, c] of Object.entries(CURSOR)) {
    const look = all[name];
    for (const [token, colour, need] of STATES) {
      const own = c[colour];
      same(look[token], meets(look, own, need) ? own : nearest(look, own, need, c.dir), `${name}: ${token} is Cursor's ${colour}, at the nearest shade for ${need}:1`);
    }
    // the edges and the focus ring need 3:1, which Cursor's own colours meet
    for (const colour of ['blue', 'cyan', 'yellow', 'green']) {
      same(look[`--${colour}`], c[colour], `${name}: --${colour} is Cursor's own`);
      assert.ok(meets(look, c[colour], 3), `${name}: Cursor's ${colour} meets 3:1 on every surface`);
    }
  }
});

test('0426 AC3: every link is blue, visited or not, including the pull request link in a review pack', () => {
  uses('a', 'color', '--run');
  assert.doesNotMatch(css(), /:(visited|link)\b/, 'nothing gives a visited link another colour');
  // the pull request link is a plain <a> in the pack's ship line
  assert.match(page(), /const a = el\('a', null, pr\.url\);/);
  for (const sel of ['#full-ticket .ship-said, #doc-view .ship-said', '#full-ticket .ship-said.bad, #doc-view .ship-said.bad'])
    assert.doesNotMatch(css(), new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' a\\b'), `${sel} doesn't recolour its link`);
});

test('0426 AC3: needs you, waiting for you, passing checks, links, the focus ring and the stage edges take those colours', () => {
  // needs you, a stopped build and the high-risk tag: red
  uses('.tab .needs', 'color', '--bad');
  uses('.bezel.needs', 'border-color', '--bad');
  uses('.q.blocked', 'border-color', '--bad');
  uses('.q .top .stage.bad', 'color', '--bad');
  uses('.tag.high', 'color', '--bad');
  // waiting for you: magenta
  uses('.q.to-ship', 'border-color', '--idea');
  uses('.q .top .say.to-ship', 'color', '--idea');
  // passing checks: green
  uses('.next', 'color', '--ok');
  // links and the focus ring: blue
  uses('.shaping .md a', 'color', '--run');
  uses('#full-ticket .md a, #full-ticket .criteria a, #doc-view .md a', 'color', '--run');
  assert.match(rule(':focus-visible'), /outline: 2px solid var\(--blue\)/);
  // a ticket's edge at each stage: blue while its tests and code are written, cyan in its self-check, yellow in review,
  // green while it ships
  for (const [sel, token] of [['.q.at-build', '--blue'], ['.q.at-check', '--cyan'], ['.q.at-review', '--yellow'], ['.q.at-ship', '--green']])
    uses(sel, 'border-color', token);
});

test('0426 AC4: speck\'s screen, its frame and the dot-matrix title keep their own colours', () => {
  const all = looks();
  const KEPT = {
    light: { '--lcd-bg': '#e6e9db', '--lcd-off': '#dde1cf', '--lcd-ink': '#20241d', '--lcd-red': '#d63f28', '--lcd-shadow': 'rgba(30, 40, 15, .14)',
      '--bezel': '#262722', '--bezel-ink': '#e6e7df', '--bezel-muted': '#b8b9b1', '--dot': '#b0412e' },
    dark: { '--lcd-bg': '#0d130f', '--lcd-off': '#151d17', '--lcd-ink': '#cfe6c6', '--lcd-red': '#ff5a3f', '--lcd-shadow': 'transparent',
      '--bezel': '#080907', '--bezel-ink': '#e6e7df', '--bezel-muted': '#b8b9b1', '--dot': '#d4664e' },
  };
  for (const [name, kept] of Object.entries(KEPT)) for (const [k, v] of Object.entries(kept)) assert.equal(all[name][k], v, `${name}: ${k}`);
  uses('.bezel', 'background', '--bezel');
  uses('.bezel .name', 'color', '--bezel-ink');
  uses('.bezel .glass', 'background', '--lcd-bg');
});

test('0426 AC5: System, light and dark all take these colours: they are set only for the light look and the dark one', () => {
  const plain = css().replace(/\/\*[\s\S]*?\*\//g, '');
  // no other block sets the colour tokens, such as one for the computer's own light or dark setting
  for (const m of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/--(bg|panel|text|muted|line|bad)\s*:/.test(m[2])) continue;
    assert.match(m[1].trim(), /^:root(\[data-theme="dark"\])?$/, `${m[1].trim()} sets colour tokens`);
  }
  assert.doesNotMatch(plain, /@media[^{]*prefers-color-scheme/, 'no colours by the computer\'s setting alone');
  // and System shows the light or dark look, by the computer's setting
  assert.match(page(), /set\(choice\(\) === 'system' \? \(system\.matches \? 'dark' : 'light'\) : choice\(\)\)/);
});
