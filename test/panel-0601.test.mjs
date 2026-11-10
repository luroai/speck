import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styles, cssRules, cssValue } from './support/panel.mjs';

// ---------- 0601: the panel's border lines a little more visible ----------

const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const plain = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');
const light = () => vars([...plain().matchAll(/:root \{([^}]*)\}/g)].map(m => m[1]).join(' '));
const dark = () => vars([...plain().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '));
// Every border, outline or edge declared with a width and one of the line colours.
const lineBorders = () => [...plain().matchAll(/(border(?:-(?:top|right|bottom|left))?|outline)\s*:\s*([^;}]*var\(--line(?:-soft)?\)[^;}]*)/g)].map(m => `${m[1]}: ${m[2].trim()}`);

test('0601 AC1: --line and --line-soft are #D9DCE1 in the light look and #383B41 in the dark', () => {
  for (const [look, v, want] of [['light', light(), '#D9DCE1'], ['dark', dark(), '#383B41']])
    for (const name of ['--line', '--line-soft']) assert.equal(v.get(name)?.toUpperCase(), want, `${look} ${name}`);
});

test('0601 AC2: no border in a line colour is half a pixel wide, and the rows, boxes and headings are drawn 1 px wide', () => {
  const all = lineBorders();
  assert.ok(all.length > 50, `found the panel's line borders (${all.length})`);
  const thin = all.filter(d => /(^|\s)(0?\.\d+px)\b/.test(d.split(': ')[1]));
  assert.deepEqual(thin, [], 'a border thinner than 1 px');
  for (const [sel, prop, want] of [['.item.row', 'border-bottom', '1px solid var(--line-soft)'], ['.q.row', 'border-bottom', '1px solid var(--line-soft)'],
    ['#shipped tr', 'border-bottom', '1px solid var(--line-soft)'], ['section', 'border', '1px solid var(--line)'], ['.sh', 'border-bottom', '1px solid var(--line)']])
    assert.equal(cssValue(cssRules(sel), prop), want, `${sel} ${prop}`);
});

test('0601 AC3: the black bar, the text, the buttons and the design\'s own border colour stay as they were', () => {
  const l = light(), d = dark();
  for (const [name, want] of Object.entries({ '--border': '#E4E6EA', '--text': '#15171A', '--panel': '#FFFFFF', '--raise': '#F4F5F7', '--bar': '#1C1D19', '--bar-line': '#34352F' }))
    assert.equal(l.get(name)?.toUpperCase(), want, `light ${name}`);
  for (const [name, want] of Object.entries({ '--border': '#2A2D31', '--text': '#ECEDEF', '--panel': '#111214', '--raise': '#1B1D20' }))
    assert.equal(d.get(name)?.toUpperCase(), want, `dark ${name}`);
  // Borders in other colours keep their half-pixel width: a button's outline, the black bar's own lines.
  assert.equal(cssValue(cssRules('.set-ready'), 'border'), '.5px solid var(--text)');
  assert.equal(cssValue(cssRules('.bezel .settings-open'), 'border'), '.5px solid var(--bar-muted)');
  assert.equal(cssValue(cssRules('#bridge .bridge-tile'), 'border'), '.5px solid var(--bar-line)');
  assert.equal(cssValue(cssRules('.item.row .head'), 'padding'), '7px 0 8px', 'the spacing in a row');
});
