import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../templates/panel-base.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const block = (open) => { // the text between the braces that follow `open`
  const i = css.indexOf(open); assert.ok(i >= 0, `${open} is in the stylesheet`);
  let d = 0, j = css.indexOf('{', i);
  for (let k = j; k < css.length; k++) { if (css[k] === '{') d++; if (css[k] === '}' && --d === 0) return css.slice(j + 1, k); }
};
const vars = (text) => Object.fromEntries([...text.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1], m[2]]));
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const light = vars(block(':root {'));
const dark = { ...light, ...vars(block(':root[data-theme="dark"] {')) };
const more = block('@media (prefers-contrast: more)');
function inner(text, open) { const i = text.indexOf(open); let d = 0; const j = text.indexOf('{', i); for (let k = j; k < text.length; k++) { if (text[k] === '{') d++; if (text[k] === '}' && --d === 0) return text.slice(j + 1, k); } }
const lightMore = { ...light, ...vars(inner(more, ':root {')) };
const darkMore = { ...dark, ...vars(inner(more, ':root[data-theme="dark"] {')) };

for (const [name, look] of [['light', lightMore], ['dark', darkMore]]) {
  test(`0708 AC1: with more contrast, in the ${name} look, edges reach 3:1 on the panel and raised backgrounds`, () => {
    for (const e of ['--line', '--line-soft', '--border']) for (const b of ['--panel', '--raise'])
      assert.ok(ratio(look[e], look[b]) >= 3, `${e} on ${b}: ${ratio(look[e], look[b]).toFixed(2)}`);
  });
  test(`0708 AC2: with more contrast, in the ${name} look, small muted text reaches 7:1 on the panel and raised backgrounds`, () => {
    for (const t of ['--muted', '--muted-large', '--faint']) for (const b of ['--panel', '--raise'])
      assert.ok(ratio(look[t], look[b]) >= 7, `${t} on ${b}: ${ratio(look[t], look[b]).toFixed(2)}`);
  });
}

test('0708 AC3: the more-contrast rules sit only inside the media query, so other colours are as they were', () => {
  const outside = css.replace(more, '');
  assert.match(outside, /--line: #D9DCE1/);
  assert.match(outside, /--muted: #5F6670/);
  assert.match(outside, /--line: #383B41/);
  assert.match(outside, /--muted: #9AA0A8/);
  assert.equal([...css.matchAll(/prefers-contrast/g)].length, 1);
});
