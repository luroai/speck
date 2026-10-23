// 0416: each ticket's card says its stage in words only, and speck's screen is the only part of the panel that animates.
// 0434: apart from a card's grid of moving lights while an agent is at work on it, named for the words it stands in for.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, round, page } from './support/panel.mjs';
import { LCD } from './support/screen.mjs';

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
// A card at each stage, with what it says and its colour: '' the normal text colour, 'to-ship' purple, 'bad' crimson.
const CARDS = [
  [T('0901', 'building', { started: ago(300) }), 'Writing tests and code', ''],
  [T('0902', 'building', { started: ago(300), self_check: 'no changes' }), 'Checking its own work', ''],
  [T('0903', 'reviewing', { started: ago(600), self_check: 'no changes', rounds: [round(1, 10)], review_running: 2, reviewer: 'codex' }), 'Codex is reviewing · round 2', ''],
  [T('0904', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(4) } })), 'Shipping', ''], // 0434: with no ship's time
  [T('0905', 'approved', approved({ auto_ship: false, build_exit: { at: ago(30), code: 0 } })), 'Approved · waiting for you to ship it', 'to-ship'],
  [T('0906', 'blocked', { started: ago(300), blocked_question: 'Which one?' }), 'Blocked · it has a question for you', 'bad'],
  [T('0907', 'building', { started: ago(300), build_exit: { at: ago(30), code: 1 } }), 'The build stopped', 'bad'],
];

// The real renderer, counting each thing the page asks it to draw.
function fake(tickets = CARDS.map(c => c[0])) {
  const drawn = [];
  const SpeckLCD = { ...LCD,
    Screen: class { constructor(canvas) { drawn.push(['Screen', canvas]); this.dirty = true; } size() {} },
    badge: (...a) => { drawn.push(['badge', ...a]); return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; },
    mini: (...a) => { drawn.push(['mini', ...a]); return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; } };
  const p = fakePage([], {
    SpeckLCD, requestAnimationFrame() {},
    fetch: async url => ({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(/\/log$/.test(url) ? { text: '', truncated: false } : { tickets, ideas: [], run: { on: true, pid: 1 } })) }),
  });
  p.byId('screen').getContext = () => ({});
  p.drawn = drawn;
  return p;
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(/\s+/).filter(Boolean);
const progressOf = row => topOf(row).children.find(n => classes(n)[0] === 'progress');
const WORKING = ['0901', '0902', '0903']; // 0434: their grid of lights stands in for their sentence
const sentenceIn = n => (n.className === 'lights' ? n.attrs['aria-label'] : n.textContent);
// The page's CSS, from its <style>, without its comments.
const css = () => /<style>([\s\S]*?)<\/style>/.exec(page())[1].replace(/\/\*[\s\S]*?\*\//g, '');

test('0416 AC1: no card has a tile, picture or animation of its stage, at any stage', async () => {
  const p = fake();
  await p.settle();
  for (const [t] of CARDS) {
    const row = rowOf(p, t.id);
    assert.ok(row, `${t.id}: a card`);
    const pictures = p.all(row).filter(n => ['canvas', 'img', 'svg', 'video'].includes(n.tagName) || /\bbadge/.test(n.className || '') || n.attrs?.role === 'img');
    // 0434: only the grid of lights, on a card an agent is at work on
    assert.deepEqual(pictures.map(n => `${n.tagName}.${n.className}`), WORKING.includes(t.id) ? ['span.lights'] : [], `${t.id}: no picture on its card`);
  }
  assert.deepEqual(p.drawn.filter(([what]) => what !== 'Screen').map(([what]) => what), [], 'only speck\'s screen is drawn');
  assert.equal(p.drawn.filter(([what]) => what === 'Screen').length, 1, 'speck\'s screen, once');
  assert.doesNotMatch(page(), /badgeOf|badgeFor|startBadges|LCD\.badge/, 'the badge code has gone');
  assert.doesNotMatch(css(), /\.badge\b|badgerow|badgetext/, 'and its styles');
});

test('0416 AC1: the card\'s text starts at its left edge, where the tile was', async () => {
  const p = fake();
  await p.settle();
  for (const [t] of CARDS) {
    const prog = progressOf(rowOf(p, t.id));
    assert.ok(prog, `${t.id}: its progress row`);
    assert.ok(new RegExp(WORKING.includes(t.id) ? '^lights$' : '\\bsay\\b').test(prog.children[0].className), `${t.id}: the sentence (0434: or its grid of lights) comes first, with nothing before it`);
  }
  // The row is one line of text from the card's left padding (0419: as Plan's details line).
  const rule = /\.q \.top \.progress, \.q \.top \.act \{([^}]*)\}/.exec(css());
  assert.ok(rule, 'a rule for the progress row');
  assert.match(rule[1], /display: block;/);
  assert.doesNotMatch(rule[1], /grid-template-columns|padding-left|margin-left/, 'no column or gap left for a tile');
});

test('0416 AC2: each card says its stage in the same words, with its stage name under its title, in its colour', async () => {
  const p = fake();
  await p.settle();
  for (const [t, words, tone] of CARDS) {
    const row = rowOf(p, t.id), top = topOf(row), prog = progressOf(row);
    const say = prog.children.find(n => /^(say|lights)\b/.test(n.className)), stage = prog.children.find(n => /\bstage\b/.test(n.className));
    assert.ok(sentenceIn(say).startsWith(words), `${t.id}: "${sentenceIn(say)}"`);
    assert.ok(top.children.indexOf(prog) > top.children.findIndex(n => n.className === 'line'), `${t.id}: under its title`);
    assert.deepEqual(classes(say), WORKING.includes(t.id) ? ['lights'] : tone ? ['say', tone] : ['say'], `${t.id}: its sentence's colour`);
    if (t.id !== '0904') { // a shipping card says how long it's shipped for instead (0201)
      const now = t.steps?.find(s => s.state === 'now');
      assert.ok(stage && stage.textContent, `${t.id}: its stage's name`);
      assert.deepEqual(classes(stage), tone ? ['stage', tone] : ['stage'], `${t.id}: its stage name's colour`);
      if (now && t.id !== '0903') assert.equal(stage.textContent, now.label);
      if (t.id === '0903') assert.equal(stage.textContent, 'Review 2', '0434: the round under review');
    }
    if (tone === 'to-ship') assert.ok(classes(row).includes('to-ship'), `${t.id}: a purple card`);
    if (tone === 'bad') assert.ok(classes(row).includes('blocked'), `${t.id}: a crimson card`);
  }
  assert.match(css(), /\.q \.top \.say\.to-ship \{ color: var\(--idea\); \}/, 'purple');
  assert.match(css(), /\.q \.top \.say\.bad \{ color: var\(--bad\); \}/, 'crimson');
});

test('0416 AC3: apart from speck\'s screen, nothing on the panel moves unless you\'ve just done something', () => {
  const style = css();
  // Each animation in the CSS: only the ring that lights a ticket you went to, on its .flash class, and (0434) the
  // grid of lights on a card an agent is at work on.
  const animations = [...style.matchAll(/([^{}]+)\{[^{}]*\banimation\s*:[^{}]*\}/g)].map(m => m[1].trim());
  assert.deepEqual(animations, ['.item.flash, .q.flash', '.q .top .lights i'], 'only the ring after "Go to ticket", and the grid of lights');
  assert.deepEqual([...style.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]), ['flash', 'lights']);
  // Each transition: only the Settings switch's knob, which moves when you flip it.
  const transitions = [...style.matchAll(/([^{}]+)\{[^{}]*\btransition\s*:\s*(?!\s|none)[^{}]*\}/g)].map(m => m[1].trim());
  assert.deepEqual(transitions, ['#settings [role="switch"] .knob']);
  // The page draws on one canvas only, speck's screen, and asks for frames only for it.
  assert.deepEqual([...page().matchAll(/<canvas\b[^>]*\bid="(\w+)"/g)].map(m => m[1]), ['screen']);
  assert.doesNotMatch(page(), /el\('canvas'/, 'no canvas made for a card');
});
