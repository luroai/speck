import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssRules, cssValue, styles } from './support/panel.mjs';

const css = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');
const cards = readFileSync(new URL('../templates/panel-cards.css', import.meta.url), 'utf8');
const decls = sel => [...css().matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');
const hoverBlock = cards.match(/@media \(hover: hover\) \{([^\n]*)\}/)?.[1] ?? '';

test('0728 AC1: on hover devices, a lit ticket and its chain use the raised fill, reaching 12 px past the text, with no text-colour ring or border', () => {
  for (const sel of ['.item.hl', '.q.hl']) {
    const hl = decls(sel);
    assert.match(hl, /background:\s*var\(--raise\)/, `${sel} has the raised fill`);
    assert.doesNotMatch(hl, /inset 0 0 0 \d+px var\(--text\)/, `${sel} has no ring in the text colour`);
    assert.doesNotMatch(hl, /(^|;)\s*border-color\s*:/, `${sel} sets no border colour`);
  }
  for (const sel of ['.item.row.hl:not(.open)', '.q.row.hl']) {
    assert.equal(cssValue(cssRules(sel), 'box-shadow'),
      '-12px 0 0 var(--raise), 12px 0 0 var(--raise)', `${sel}: fill reaches 12 px past each side`);
  }
  assert.equal(cssValue(cssRules('.item.row.open.hl::after'), 'box-shadow'), undefined, 'an open lit row gets no ring');
});

test('0728 AC2: lit rows set no size or text colour, and leave state borders and fills alone', () => {
  for (const sel of ['.item.hl', '.q.hl', '.item.row.hl:not(.open)', '.q.row.hl']) {
    const rule = decls(sel);
    assert.doesNotMatch(rule, /(^|;)\s*(padding|margin|width|height|transform|color)\s*:/, `${sel} moves nothing and keeps text colour`);
  }
  // State still lives on the where-line dots (0167/0585), not on the row's border or fill; hl must not invent a border.
  assert.doesNotMatch(decls('.item.hl') + decls('.q.hl'), /border(-color)?\s*:/);
});

test('0728 AC3: a tapped id\'s flash is the same fill fading out, or the fill still when motion is reduced', () => {
  assert.match(css(), /\.item\.flash,\s*\.q\.flash \{[^}]*animation:\s*flash 1\.5s ease-out/);
  assert.match(css(), /@keyframes flash \{[^}]*background:\s*var\(--raise\)/);
  assert.doesNotMatch(css(), /@keyframes flash \{[^}]*inset 0 0 0 \d+px var\(--text\)/);
  assert.match(css(), /@media \(prefers-reduced-motion: reduce\) \{ \.item\.flash, \.q\.flash \{ background: var\(--raise\); \}/);
  assert.doesNotMatch(css(), /@media \(prefers-reduced-motion: reduce\) \{ \.item\.flash, \.q\.flash \{ box-shadow: inset/);
});

test('0728 AC4: an open row already filled looks as today when lit or flashed, with no ring', () => {
  assert.equal(cssValue(cssRules('.item.row.open'), 'box-shadow'), '-12px 0 0 var(--raise), 12px 0 0 var(--raise)');
  assert.equal(cssValue(cssRules('.item.row.open.hl::after'), 'box-shadow'), undefined);
  assert.equal(cssValue(cssRules('.item.row.open.flash'), 'animation'), 'none');
  assert.equal(cssValue(cssRules('.item.row.open.flash::after'), 'animation'), undefined);
  assert.equal(cssValue(cssRules('.item.row.open.flash::after'), 'box-shadow'), undefined);
});

test('0728 AC1: the lit chain\'s fill lives only where the pointer can hover, matching a hovered row\'s', () => {
  assert.match(hoverBlock, /\.item\.hl,\s*\.q\.hl \{ background: var\(--raise\); \}/);
  assert.match(hoverBlock, /\.item\.row\.hl:not\(\.open\),\s*\.q\.row\.hl \{ box-shadow: -12px 0 0 var\(--raise\), 12px 0 0 var\(--raise\); \}/);
  assert.doesNotMatch(hoverBlock, /\.item\.row\.hl:not\(\.open\):hover/);
  const outside = cards.replace(/@media \(hover: hover\) \{[^\n]*\}/, '');
  assert.doesNotMatch(outside, /\.item\.hl|\.q\.hl/);
});
