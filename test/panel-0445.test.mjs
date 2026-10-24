// 0445: a document task's document, in its own pop-up, set out as the full ticket is (0424): its first heading is its
// title, then its other headings, text and lists in the full ticket's sizes.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssRules, cssValue } from './support/panel.mjs';
import { DOCS, text, openPack, docView, docButtons } from './support/documents.mjs';

const MEMO = 'A line before any heading.\n\n# Pricing\n\nPrices go **up**.\n\n## Why\n\n1. Costs\n2. Demand\n\n### Detail\n\n- More\n\n# Next\n';
async function openDoc(body = MEMO) {
  const p = await openPack({ pack: '## 0005 · Ticket 0005\n', documents: DOCS }, [text(body)]);
  p.press(docButtons(p)[0]);
  await p.settle();
  return p;
}
const docBody = p => docView(p).children.find(n => n.className === 'md');
const heads = p => p.all(docBody(p)).filter(n => /^h[56]$/.test(n.tagName));
// The value the last rule naming `sel` gives `prop`, and in px when asked.
const val = (sel, prop) => cssValue(cssRules(sel).filter(d => new RegExp(`(^|;)\\s*${prop}\\s*:`).test(d)), prop);
const px = (sel, prop = 'font-size') => {
  const v = val(sel, prop);
  assert.match(v || '', /^\d+(\.\d+)?px$/, `${sel} sets ${prop} in px (is ${v})`);
  return parseFloat(v);
};
const TITLE = '#full-ticket .top .title', SECTION = '#full-ticket h4';

// ---------- AC1: the first heading is the title, the rest in the full ticket's sizes ----------

test('0445 AC1: the document\'s first heading, wherever it is, is its title, and only that one', async () => {
  const p = await openDoc();
  const hs = heads(p);
  assert.deepEqual(hs.map(n => n.textContent), ['Pricing', 'Why', 'Detail', 'Next']);
  assert.deepEqual(hs.map(n => n.className.split(' ').includes('doc-title')), [true, false, false, false]);
});

test('0445 AC1: a document whose first heading is a ## still has it as its title, and one with no heading has none', async () => {
  let p = await openDoc('Intro.\n\n## Summary\n\nText.\n\n## More\n');
  assert.deepEqual(heads(p).map(n => n.className.split(' ').includes('doc-title')), [true, false]);
  p = await openDoc('Only text.\n');
  assert.equal(heads(p).length, 0);
  assert.ok(!p.all(docBody(p)).some(n => String(n.className || '').includes('doc-title')));
});

test('0445 AC1: the title is in the full ticket\'s title size, weight and line height', () => {
  const sel = '#doc-view .md .doc-title';
  assert.equal(px(sel), px(TITLE), 'the title size');
  assert.equal(val(sel, 'line-height'), val(TITLE, 'line-height'));
  assert.equal(val(sel, 'font-weight'), val(TITLE, 'font-weight'));
});

test('0445 AC1: its other headings, at each level, are in the full ticket\'s section heading size, with its room above them', () => {
  for (const lvl of [1, 2, 3]) {
    const sel = `#doc-view .md .md-h${lvl}`;
    assert.equal(px(sel), px(SECTION), `a level-${lvl} heading is the section heading's size`);
    for (const prop of ['margin', 'line-height', 'font-weight', 'font-family', 'color']) assert.equal(val(sel, prop), val(SECTION, prop), `and its ${prop}`);
  }
  assert.ok(!cssRules('#doc-view .md-h1').length && !cssRules('#doc-view .md-h2').length && !cssRules('#doc-view .md-h3').length, 'the old small heading sizes are gone');
});

test('0445 AC1: the text is at least 15 px with a line height of at least 1.5, the full ticket\'s, with its paragraph gaps', () => {
  assert.ok(px('#doc-view .md') >= 15);
  assert.equal(px('#doc-view .md'), px('#full-ticket .md'));
  assert.ok(parseFloat(val('#doc-view .md', 'line-height')) >= 1.5);
  assert.equal(val('#doc-view .md', 'line-height'), val('#full-ticket .md', 'line-height'));
  assert.equal(val('#doc-view .md p', 'margin'), val('#full-ticket .md p', 'margin'));
  for (const sel of ['#doc-view .md table', '#doc-view pre code']) assert.ok(px(sel) >= 15, `${sel} is the text size too`);
});

test('0445 AC1: lists hang their numbers and bullets to the left of the text, as the full ticket\'s do', async () => {
  for (const sel of ['#doc-view .md ol', '#doc-view .md ul']) {
    assert.equal(val(sel, 'list-style-position'), 'outside', `${sel} hangs its markers`);
    assert.equal(val(sel, 'padding-left'), val('#full-ticket .md ol', 'padding-left'), `${sel} leaves the full ticket's room for them`);
    assert.equal(val(sel, 'margin'), val('#full-ticket .md ol', 'margin'));
  }
  const p = await openDoc();
  assert.ok(p.all(docBody(p)).some(n => n.tagName === 'ol' && n.children.length === 2), 'the numbered list is drawn as one');
});

// ---------- AC2: the top line still shows the file's path ----------

test('0445 AC2: the pop-up\'s top line still shows the document\'s file path, not its title', async () => {
  const p = await openDoc();
  const top = docView(p).children[0];
  assert.equal(top.className, 'top');
  const title = top.children.find(n => n.className === 'title');
  assert.equal(title && title.textContent, DOCS[0].path);
  assert.ok(!top.textContent.includes('Pricing'), 'the document\'s title stays in the document');
  assert.match(val('#doc-view .top .title', 'font-family') || '', /monospace/, 'in the path\'s own type, as today');
  assert.equal(px('#doc-view .top .title'), 12);
});
