import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../templates/panel-cards.css', import.meta.url), 'utf8');
const hoverBlock = css.match(/@media \(hover: hover\) \{([^\n]*)\}/)?.[1] ?? '';

test('0701 AC1: with hover, a hovered closed row\'s fill reaches 12 px past each side', () => {
  assert.match(hoverBlock, /\.item\.row:not\(\.open\)[^{]*:hover \{ box-shadow: -12px 0 0 var\(--raise\), 12px 0 0 var\(--raise\); \}/);
});

test('0701 AC2: the hover moves no text: it sets no padding, margin or border', () => {
  const rule = hoverBlock.match(/\.item\.row:not\(\.open\)[^{]*:hover \{([^}]*)\}/)[1];
  assert.doesNotMatch(rule, /padding|margin|border|width|transform/);
});

test('0701 AC3: without hover, closed rows get no side fill', () => {
  const outside = css.replace(/@media \(hover: hover\) \{[^\n]*\}/, '');
  assert.doesNotMatch(outside, /\.item\.row:not\(\.open\)[^{]*:hover/);
});

test('0701 AC1: a hovered closed row that is lit by a link gets the same side fill (0728: no ring on top)', () => {
  assert.doesNotMatch(hoverBlock, /\.item\.row\.hl:not\(\.open\):hover/);
  assert.doesNotMatch(hoverBlock, /:not\(\.hl\)/);
  assert.match(hoverBlock, /\.item\.row\.hl:not\(\.open\),\s*\.q\.row\.hl \{ box-shadow: -12px 0 0 var\(--raise\), 12px 0 0 var\(--raise\); \}/);
});
