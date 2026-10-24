// 0424: the full ticket, and a review pack, set out as a document: a title, section headings, then the text, each
// clearly set apart.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, page, full, click, items, top, queueRows, cssRules, cssValue, styles } from './support/panel.mjs';

const clone = s => JSON.parse(JSON.stringify(s));
const board = () => ({ tickets: [full('0001', { title: 'A draft', type: 'bug', priority: 3, size: 'M', risk: 'high' }), full('0002', { title: 'Approved one', status: 'approved' })], ideas: [] });
const PACK = '## 0002 · Approved one\n**Verdict:** approved\n\n### Acceptance criteria\n| # | Criterion | Result | Evidence |\n|---|---|---|---|\n| 1 | A | ✅ | B |\n\n### Risk\n- Ticket risk: **low**\n';
function livePage() {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/pack$/.test(url) ? { pack: PACK, pictures: [], documents: [] } : /\/log$/.test(url) ? { text: '', truncated: false } : clone(board())) }),
  });
}
const pane = p => p.byId('full-ticket');
async function openTicket() {
  const p = livePage();
  await p.settle();
  const item = () => items(p).find(n => n.textContent.startsWith('0001'));
  click(top(item()));
  await p.settle();
  click(p.all(item()).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  return p;
}
async function openPack() {
  const p = livePage();
  await p.settle();
  const row = () => queueRows(p).find(r => r.textContent.includes('0002'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  p.press(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  return p;
}
// A rule's value in px, from the rule whose selector list holds `sel`.
const px = (sel, prop = 'font-size') => {
  const v = cssValue(cssRules(sel), prop);
  assert.ok(v !== undefined, `${sel} sets ${prop}`);
  assert.match(v, /^\d+(\.\d+)?px$/, `${sel} ${prop} in px`);
  return parseFloat(v);
};
const marginTop = sel => { const m = cssValue(cssRules(sel), 'margin'); assert.ok(m, `${sel} sets margin`); return parseFloat(m.split(/\s+/)[0]); };
const marginBottom = sel => { const m = cssValue(cssRules(sel), 'margin').split(/\s+/); return parseFloat(m[m.length === 4 ? 2 : 0]); };
// Every font size a #full-ticket rule sets, outside media queries' tweaks to buttons.
const allSizes = () => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => /#full-ticket/.test(m[1])).flatMap(m => [...m[2].matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(x => [m[1].trim(), parseFloat(x[1])]));
};

const TITLE = '#full-ticket .top .title', SECTION = '#full-ticket h4', TEXT = '#full-ticket .md';

// ---------- AC1: the title, the id and status above it, the tags under it (0465: its track and table) ----------

test('0424 AC1: the id and status come before the title, and the priority, size, risk and type after it', async () => {
  const p = await openTicket();
  const head = pane(p).children[0];
  const kids = head.children.filter(n => n.tagName !== 'button');
  assert.deepEqual(kids.map(n => n.className), ['id', 'state', 'title']);
  assert.deepEqual(kids.map(n => n.textContent), ['0001', 'draft', 'A draft']);
  // 0465: in the table under the top row, in place of the tags
  const facts = pane(p).children[1].children[1].children.map(c => c.children[1].textContent);
  assert.deepEqual(facts.slice(3), ['P3', 'M · high', 'bug'], 'its priority, size, risk and type');
});

test('0424 AC1: the title is the largest text, on a line of its own, and the id and status are in small type', () => {
  const title = px(TITLE);
  for (const [sel, size] of allSizes()) if (sel !== TITLE) assert.ok(size < title, `${sel} (${size}px) is smaller than the title (${title}px)`);
  assert.equal(cssValue(cssRules(TITLE), 'flex-basis'), '100%', 'the title takes its own line');
  assert.ok(px('#full-ticket .top .id') <= 12 && px('#full-ticket .top .state') <= 12, 'id and status in small type');
  assert.ok(+cssValue(cssRules(TITLE), 'order') > 0, 'the title comes after the id, status and Close, wherever Close is in the line'); // 0465: no tags after it
});

test('0424 AC1: a ticket in the queue or the Shipped list shows its own status above its title', async () => {
  const p = livePage();
  await p.settle();
  const row = () => queueRows(p).find(r => r.textContent.includes('0002'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  click(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
  const state = pane(p).children[0].children.find(n => n.className === 'state');
  assert.equal(state && state.textContent, 'approved');
});

test('0424 AC1: the status follows a change to the ticket, and the rest of the pane keeps its nodes', async () => {
  const s1 = { tickets: [full('0002', { title: 'Building one', status: 'building' })], ideas: [] }, s2 = clone(s1);
  s2.tickets[0].status = 'reviewing';
  const p = fakePage([s1, s2, clone(s2)]);
  await p.settle();
  const row = () => queueRows(p).find(r => r.textContent.includes('0002'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  click(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
  const [head, , body] = pane(p).children, state = head.children.find(n => n.className === 'state'); // 0465: the track and table between them
  assert.equal(state.textContent, 'building');
  p.timers.shift()();
  await p.settle();
  assert.equal(state.textContent, 'reviewing', 'the same node, now saying reviewing');
  assert.deepEqual([pane(p).children[0], pane(p).children[2]], [head, body]);
  assert.equal(body.detached || 0, 0, 'the body was not redrawn');
});

// ---------- AC2: section headings ----------

test('0424 AC2: each section has a heading smaller than the title and larger than the text', async () => {
  const p = await openTicket();
  const heads = p.all(pane(p).children.at(-1)).filter(n => n.tagName === 'h4').map(n => n.textContent);
  for (const h of ['Problem', 'Outcome', 'Acceptance criteria', 'Out of scope', 'Notes']) assert.ok(heads.includes(h), h);
  assert.ok(px(SECTION) < px(TITLE), 'smaller than the title');
  assert.ok(px(SECTION) > px(TEXT), 'larger than the text');
});

test('0424 AC2: a section heading has more room above it than there is between the section\'s paragraphs', () => {
  const gap = marginBottom('#full-ticket .md p');
  assert.ok(marginTop(SECTION) > gap, `above a heading (${marginTop(SECTION)}px) is more than between paragraphs (${gap}px)`);
  assert.ok(marginTop(SECTION) > marginBottom('#full-ticket .md ul'), 'and more than under a list');
});

// ---------- AC3: the text, and headings inside it ----------

test('0424 AC3: the text is at least 15 px with a line height of at least 1.5', () => {
  for (const sel of [TEXT, '#full-ticket ol.criteria']) {
    assert.ok(px(sel) >= 15, `${sel} at least 15px`);
    assert.ok(parseFloat(cssValue(cssRules(sel), 'line-height')) >= 1.5, `${sel} line height at least 1.5`);
  }
});

// The size a selector's text gets from the last rule that names it and sets one, as the cascade gives it between rules of
// the same specificity, or undefined when no rule sets one.
const lastSize = sel => cssValue(cssRules(sel).filter(d => /font-size/.test(d)), 'font-size');

test('0424 AC3: tables and code blocks in a ticket or a review pack are the text size too, and none of the text is set smaller', () => {
  for (const sel of ['#full-ticket .md table', '#full-ticket pre code']) {
    const v = lastSize(sel);
    assert.ok(v && parseFloat(v) >= 15, `${sel} is at least 15px (is ${v})`);
  }
  for (const sel of ['#full-ticket .md th', '#full-ticket .md td', '#full-ticket .md p', '#full-ticket .criteria p', '#full-ticket code.md-code', '#full-ticket .md summary', '#full-ticket ol.criteria > li']) {
    const v = lastSize(sel);
    assert.ok(v === undefined || v === 'inherit' || parseFloat(v) >= 15, `${sel} keeps the text size (sets ${v})`);
  }
  assert.equal(lastSize('#doc-view .md table'), '15px', 'a document\'s pop-up, set out as the ticket is since 0445');
});

test('0424 AC3: a heading in a section\'s text is smaller than the section\'s heading, and each level smaller than the one above', () => {
  const [h1, h2, h3] = [1, 2, 3].map(n => px(`#full-ticket .md-h${n}`));
  assert.ok(h1 < px(SECTION), '# is smaller than a section heading');
  assert.ok(h2 < h1 && h3 < h2, `# ${h1}px > ## ${h2}px > ### ${h3}px`);
});

test('0424 AC3: a ticket\'s sections sit inside its body, so a review pack\'s heading rules never reach them', async () => {
  const p = await openTicket();
  assert.ok(!pane(p).children.some(n => n.className === 'md'), 'no section\'s text straight in the pane');
  assert.ok(p.all(pane(p).children.at(-1)).some(n => n.className === 'md'), 'the sections\' text is in the body');
});

// ---------- AC4: lists ----------

test('0424 AC4: numbered lists hang their numbers to the left of the text, and nested lists are indented under their item', async () => {
  for (const sel of ['#full-ticket ol.criteria', '#full-ticket .md ol', '#full-ticket .md ul', '#full-ticket .criteria ol']) {
    const d = cssRules(sel);
    assert.equal(cssValue(d, 'list-style-position'), 'outside', `${sel} hangs its markers`);
    assert.ok(parseFloat(cssValue(d, 'padding-left')) > 0, `${sel} leaves room for them`);
  }
  assert.ok(!cssRules('#full-ticket li ul').some(d => /padding-left:\s*0/.test(d)), 'a nested list keeps its indent');
  const p = await openTicket();
  const ol = p.all(pane(p)).find(n => n.tagName === 'ol' && n.className === 'criteria');
  assert.ok(ol && ol.children.length > 0 && ol.children.every(n => n.tagName === 'li'), 'the criteria are a numbered list');
});

// ---------- AC5: a review pack ----------

test('0424 AC5: a review pack uses the same sizes for its title, headings, text and lists', async () => {
  const p = await openPack();
  const head = pane(p).children[0];
  assert.ok(head.children.some(n => n.className === 'title'), 'its title is drawn by the same rule as a ticket\'s');
  const body = pane(p).children.find(n => n.className === 'md');
  assert.ok(body, 'its text is the same .md text, straight in the pane');
  assert.ok(!pane(p).children.some(n => n.className === 'md' && n !== body), 'and the only .md straight in it');
  const heads = p.all(body).filter(n => /^h[56]$/.test(n.tagName));
  assert.deepEqual(heads.map(n => n.className), ['md-h2', 'md-h3', 'md-h3']);
  for (const lvl of [1, 2, 3]) assert.ok(cssRules(`#full-ticket > .md .md-h${lvl}`).some(d => cssRules(SECTION).includes(d)), `the pack's level-${lvl} heading looks as a section heading does`);
  assert.ok(p.all(body).some(n => n.tagName === 'ul'), 'its lists are the .md lists');
});
