// 0416: each ticket's card says its stage in words only, and speck's screen is the only part of the panel that animates.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, tipSentence, round, page, styles } from './support/panel.mjs';

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
// A row at each stage, with the words its where line starts with, the sentence in full as its tooltip, and its dot: needs you
// (orange), run (blue) or wait (grey). 0585: a row has no colour of its stage, only its dot.
const CARDS = [
  [T('0901', 'building', { started: ago(300) }), 'Writing', 'Writing tests and code', 'run'],
  [T('0902', 'building', { started: ago(300), self_check: 'no changes' }), 'Checking', 'Checking its own work', 'run'],
  [T('0903', 'reviewing', { started: ago(600), self_check: 'no changes', rounds: [round(1, 10)], review_running: 2, reviewer: 'codex' }), 'Reviewing · round 2', 'Codex is reviewing · round 2', 'run'],
  [T('0904', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(4) } })), 'Shipping', undefined, 'run'],
  [T('0905', 'approved', approved({ auto_ship: false, build_exit: { at: ago(30), code: 0 } })), 'Ready to ship', 'Approved · waiting for you to ship it', 'needs'],
  [T('0906', 'blocked', { started: ago(300), blocked_question: 'Which one?' }), 'Has a question', 'Blocked · it has a question for you', 'needs'],
  [T('0907', 'building', { started: ago(300), build_exit: { at: ago(30), code: 1 } }), 'Build stopped', 'The build stopped', 'needs'], // 0616: nothing will carry it on, so it needs you,
];

function fake(tickets = CARDS.map(c => c[0])) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(/\/log$/.test(url) ? { text: '', truncated: false } : { tickets, ideas: [], run: { on: true, pid: 1 } })) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(/\s+/).filter(Boolean);
const whereOf = (p, row) => p.all(row).find(n => classes(n)[0] === 'where');
// The page's CSS, from panel.css (0430), without its comments.
const css = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');

test('0416 AC1: no row has a tile, picture or animation of its stage, at any stage', async () => {
  const p = fake();
  await p.settle();
  for (const [t] of CARDS) {
    const row = rowOf(p, t.id);
    assert.ok(row, `${t.id}: a row`);
    const pictures = p.all(row).filter(n => ['canvas', 'img', 'svg', 'video'].includes(n.tagName) || /\bbadge|\blights/.test(n.className || '') || n.attrs?.role === 'img');
    assert.deepEqual(pictures.map(n => `${n.tagName}.${n.className}`), [], `${t.id}: no picture on its row`);
  }
  assert.doesNotMatch(page(), /badgeOf|badgeFor|startBadges|LCD\.badge/, 'the badge code has gone');
  assert.doesNotMatch(css(), /\.badge\b|badgerow|badgetext/, 'and its styles');
});

test('0416 AC1: the row\'s text starts at its left edge, where the tile was', async () => {
  const p = fake();
  await p.settle();
  for (const [t] of CARDS) {
    const top = topOf(rowOf(p, t.id));
    assert.equal(top.children[0].className, 'line', `${t.id}: its title line comes first, with nothing before it`);
    assert.equal(top.children[0].children[0].className, 'id', `${t.id}: starting with its id`);
  }
  assert.doesNotMatch(css(), /\.q \.top[^{}]*\{[^}]*(grid-template-columns|padding-left|margin-left)/, 'no column or gap left for a tile');
});

test('0416 AC2: each row says its stage in the same words, with its stage under its title and a dot for what it needs', async () => {
  const p = fake();
  await p.settle();
  for (const [t, words, sentence, dot] of CARDS) {
    const row = rowOf(p, t.id), top = topOf(row), where = whereOf(p, row);
    assert.ok(where.textContent.startsWith(words), `${t.id}: "${where.textContent}"`);
    assert.equal(tipSentence(where), sentence ?? '', `${t.id}: its sentence in full`);
    assert.ok(top.children.indexOf(where) > top.children.findIndex(n => n.className === 'line'), `${t.id}: under its title`);
    assert.deepEqual(classes(where), ['where', dot], `${t.id}: its dot`);
    assert.deepEqual(classes(row), ['q', 'row'], `${t.id}: a row is not coloured by its stage`);
  }
  assert.match(css(), /\.where\.needs::before \{ background: var\(--needs-you\); \}/, 'orange');
  assert.match(css(), /\.where\.run::before \{ background: var\(--accent\); \}/, 'blue');
});

test('0416 AC3: apart from speck\'s screen, nothing on the panel moves unless you\'ve just done something', () => {
  const style = css();
  // Each animation in the CSS: only the ring that lights a ticket you went to, on its .flash class (0585: the grid of lights has gone).
  // 0614: on an open Plan or Capture row, the same ring round its whole fill.
  const animations = [...style.matchAll(/([^{}]+)\{[^{}]*\banimation\s*:\s*(?!\s|none)[^{}]*\}/g)].map(m => m[1].trim());
  assert.deepEqual(animations, ['.item.flash, .q.flash', '.item.row.open.flash::after'], 'only the ring after "Go to ticket"');
  assert.deepEqual([...style.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]), ['flash']);
  // Each transition: only the Settings switch's knob, which moves when you flip it.
  const transitions = [...style.matchAll(/([^{}]+)\{[^{}]*\btransition\s*:\s*(?!\s|none)[^{}]*\}/g)].map(m => m[1].trim());
  assert.deepEqual(transitions, ['#settings [role="switch"] .knob']);
  // 0580: the page draws on no canvas.
  assert.deepEqual([...page().matchAll(/<canvas\b[^>]*\bid="(\w+)"/g)].map(m => m[1]), []);
  assert.doesNotMatch(page(), /el\('canvas'/, 'no canvas made for a card');
});
