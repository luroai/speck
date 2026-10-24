// 0440: a ticket waiting for you to ship it is Cursor's green, so it can't be taken for one that needs you, in red.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styles } from './support/panel.mjs';

const css = () => styles();
const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim().toLowerCase()]));
const looks = () => ({
  light: vars([...css().matchAll(/:root \{([^}]*)\}/g)].map(m => m[1]).join(' ')),
  dark: vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' ')),
});
const rgba = hex => [1, 3, 5, 7].map(i => (hex.length > i ? parseInt(hex.slice(i, i + 2), 16) : 255) / 255);
const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (fg, bg) => { const back = rgba(bg), front = over(rgba(fg), back); const [x, y] = [lum(front), lum(back)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hue = hex => {
  const [r, g, b] = rgba(hex), max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const hueGap = (a, b) => { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d); };
const mix = (top, under, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(top.slice(i, i + 2), 16) * t + parseInt(under.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
// The var the rules for exactly `selector` give `prop`.
const ruleVar = (selector, prop) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const m of css().matchAll(new RegExp(`(?:^|[\\s,}])${esc}\\s*\\{([^}]*)\\}`, 'g'))) {
    const v = m[1].match(new RegExp(`(?:^|;|\\s)${prop}\\s*:[^;]*var\\((--[\\w-]+)\\)`));
    if (v) return v[1];
  }
  return null;
};
const CURSOR_GREEN = { light: '#1f8a65', dark: '#70b489' };

test('0440 AC1: a ticket waiting for you to ship it is green on its edge, its tint and its words', () => {
  assert.equal(ruleVar('.q.to-ship', 'border-color'), '--ok', 'its edge');
  assert.equal(ruleVar('.q.to-ship', 'background'), '--ok-bg', 'its tint');
  assert.equal(ruleVar('.q .top .say.to-ship', 'color'), '--ok', 'its sentence');
  assert.equal(ruleVar('.q .top .stage.to-ship', 'color'), '--ok', 'its current step');
  assert.equal(ruleVar('.act.to-ship', 'color'), '--ok', 'its label');
  assert.equal(ruleVar('.question.exit.to-ship', 'border-left-color'), '--ok', 'its message\'s edge');
  // nothing about a ticket waiting to ship is magenta any more
  for (const m of css().replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]*\bto-ship\b[^{}]*)\{([^}]*)\}/g))
    assert.doesNotMatch(m[2], /var\(--idea(?:-bg)?\)/, `${m[1].trim()} is still magenta`);
  assert.doesNotMatch(css(), /--idea-bg/, 'the magenta tint, used only there, is gone');
});

test('0440 AC1: the green is Cursor\'s, its words at the shade 0161 needs and its tint 8% over the card', () => {
  for (const [name, look] of Object.entries(looks())) {
    const green = CURSOR_GREEN[name];
    assert.equal(look.get('--green'), green, `${name}: --green is Cursor's own`);
    assert.equal(hue(look.get('--ok')).toFixed(0), hue(green).toFixed(0), `${name}: --ok is a shade of Cursor's green`);
    assert.equal(look.get('--ok-bg'), mix(green, look.get('--panel'), 0.08), `${name}: --ok-bg is Cursor's green 8% over --panel`);
  }
});

test('0440 AC1: a ticket that needs you stays red', () => {
  assert.equal(ruleVar('.q.blocked', 'border-color'), '--bad');
  assert.equal(ruleVar('.q.blocked', 'background'), '--bad-bg');
  assert.equal(ruleVar('.q .top .stage.bad', 'color'), '--bad');
  assert.equal(ruleVar('.tab .needs', 'color'), '--bad');
  assert.equal(ruleVar('.bezel.needs', 'border-color'), '--bad');
  const { light, dark } = looks();
  assert.equal(light.get('--bad'), '#96213f');
  assert.equal(dark.get('--bad'), '#ef95ad');
});

test('0440 AC2: waiting for you and needs you are at least 60° of hue apart, in both looks', () => {
  for (const [name, look] of Object.entries(looks())) {
    const gap = hueGap(look.get('--ok'), look.get('--bad'));
    assert.ok(gap >= 60, `${name}: --ok ${look.get('--ok')} and --bad ${look.get('--bad')} are ${gap.toFixed(0)}° apart`);
    const tints = hueGap(look.get('--ok-bg'), look.get('--bad-bg'));
    assert.ok(tints >= 60, `${name}: --ok-bg and --bad-bg are ${tints.toFixed(0)}° apart`);
  }
});

test('0440 AC3: the green meets 0161\'s contrast on its own tint and every surface, and text reads on the tint', () => {
  for (const [name, look] of Object.entries(looks())) {
    for (const s of ['--bg', '--panel', '--raise', '--input', '--accent-bg', '--ok-bg', '--inbox-bg', '--bad-bg'])
      assert.ok(contrast(look.get('--ok'), look.get(s)) >= 7, `${name}: --ok on ${s} is ${contrast(look.get('--ok'), look.get(s)).toFixed(2)}:1`);
    for (const t of ['--text', '--muted', '--faint'])
      assert.ok(contrast(look.get(t), look.get('--ok-bg')) >= 7, `${name}: ${t} on --ok-bg`);
    assert.ok(contrast(look.get('--line'), look.get('--ok-bg')) >= 3, `${name}: --line on --ok-bg`);
  }
});
