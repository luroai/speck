// 0368: Settings opens in a pop-up over the whole panel, in a document's pop-up's look (0362), rather than in a pane
// down the right.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from './support/panel.mjs';
import { settingsPage, openSettings, changeTo } from './support/settings.mjs';

const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = () => ({ groups: [
  { title: 'Shipping', settings: [S('auto_ship', false, { choices: [true, false] })] },
  { title: 'How much runs at once', settings: [S('max_parallel_builds', 1, { for_machine: true, from: 'repo', repo_value: 1 })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', 3)] },
] });
// The declarations of each CSS rule whose selector list holds exactly `sel`, in the page's style, media queries included.
const rules = sel => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].replace(/^[^{]*\{/, '').split(',').map(x => x.trim()).includes(sel)).map(m => m[2]);
};
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };
const pop = p => p.byId('settings');
const closeOf = p => p.all(pop(p)).find(n => n.tagName === 'button' && n.textContent === 'Close');
// An open Settings pop-up, on a page that records the focus and holds the page as a browser would.
async function opened(saves = []) {
  const p = settingsPage([view()], saves, { scrollX: 0, scrollY: 0, scrollTo() {} });
  let focused = null;
  for (const id of ['settings', 'settings-open']) p.byId(id).focus = function () { focused = this; };
  p.behind = ['header', 'offline', 'restart', 'main'].map(tag => ({ tagName: tag, inert: false }));
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => p.behind;
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  await p.settle();
  await openSettings(p);
  return p;
}
// A click at `x` px from the window's left, on the pop-up itself rather than on anything in it, with its column from
// 100 to 860 px, as a browser lays it out in a window 960 px wide. The pointer went down at `from` px, on `down`.
function clickAt(p, x, from = x, down = pop(p)) {
  for (const n of pop(p).children) n.getBoundingClientRect = () => ({ left: 100, right: 860, top: 0, bottom: 40, width: 760, height: 40 });
  const d = { target: down, clientX: from, clientY: 20 };
  for (let n = down; n; n = n.parentNode) if (n.listeners && n.listeners.pointerdown) n.listeners.pointerdown(d);
  const e = { target: pop(p), clientX: x, clientY: 20, stopPropagation() {}, preventDefault() {} };
  if (p.document.listeners.click) p.document.listeners.click(e);
  for (let n = pop(p); n; n = n.parentNode) if (n.listeners && n.listeners.click) n.listeners.click(e);
}

// ---------- AC1: a pop-up over the whole window, in a document's look ----------

test('0368 AC1: Settings is a pop-up over the whole window, its settings in a centred column at most 760 px wide', () => {
  const [base] = rules('#settings');
  assert.match(base, /position: fixed/);
  assert.match(base, /inset: 0/);
  assert.doesNotMatch(base, /480px|right: 0|border-left|box-shadow/, 'not a pane down the right');
  // The last margin-left in the rule is the one that holds: half the room left over, rounded down to a whole pixel.
  assert.ok(rules('#settings > *').some(r => /max-width: 760px/.test(r) && /margin-right: auto/.test(r)
    && /margin-left: max\(0px, round\(down, calc\(\(100% - 760px\) \/ 2\), 1px\)\);\s*$/.test(r)), 'a centred column');
  assert.ok(!rules(':root[data-theme="dark"] #settings').length, 'no side pane\'s shadow in the dark look');
  for (const sel of ['#settings .top', '#settings .close', '#settings .close:hover']) {
    const shared = sel.replace('#settings', '#doc-view');
    assert.ok(rules(sel).length >= 1, `${sel} is styled`);
    assert.ok(rules(sel).every(r => rules(shared).includes(r)), `${sel} shares ${shared}'s rules`);
  }
  assert.ok(rules('#settings > .savebar').some(r => /margin: 16px auto 0/.test(r)), 'Save stays in the column');
});

test('0368 AC1: pressing Settings opens the pop-up as a modal dialog with a Close button', async () => {
  const tag = page().match(/<aside id="settings"[^>]*>|<div id="settings"[^>]*>/)?.[0] || '';
  assert.match(tag, /role="dialog"/);
  assert.match(tag, /aria-modal="true"/);
  const p = await opened();
  assert.equal(pop(p).hidden, false);
  assert.ok(closeOf(p), 'a Close button');
});

// ---------- AC2: nothing behind it can be reached, the focus moves in, it scrolls on its own ----------

test('0368 AC2: while it is open, the page and the ticket pane behind are inert, and the focus is in the pop-up', async () => {
  const p = await opened();
  for (const n of p.behind) assert.equal(n.inert, true, `${n.tagName} can't be clicked or reached with Tab`);
  for (const id of ['full-ticket', 'full-backdrop']) assert.equal(p.byId(id).inert, true, `${id} can't be reached`);
  assert.ok(within(p.focused(), pop(p)), 'the focus is in the pop-up');
  assert.match(rules('#settings')[0], /overflow-y: auto/, 'a long view scrolls inside it');
  assert.match(rules('#settings')[0], /overscroll-behavior: contain/);
  closeOf(p) && p.press(closeOf(p));
  await p.settle();
  for (const id of ['full-ticket', 'full-backdrop']) assert.equal(p.byId(id).inert, false, `${id} usable again`);
  for (const n of p.behind) assert.equal(n.inert, false);
});

// ---------- AC3: Close, Escape and a click beside the column close it ----------

const WAYS = { Close: p => p.press(closeOf(p)), Escape: p => p.key('Escape'), backdrop: p => clickAt(p, 40) };
for (const [how, close] of Object.entries(WAYS)) {
  test(`0368 AC3: ${how} closes it, with the focus back on the Settings button`, async () => {
    const p = await opened();
    close(p);
    await p.settle();
    assert.equal(pop(p).hidden, true, 'closed');
    assert.equal(p.focused(), p.byId('settings-open'));
  });
  test(`0368 AC3: ${how} with a change not saved asks first`, async () => {
    const p = await opened();
    changeTo(p, 'limits.max_review_rounds', '4');
    close(p);
    await p.settle();
    assert.equal(p.byId('settings-unsaved').hidden, false, 'asks');
    assert.equal(pop(p).hidden, false, 'still open behind the question');
  });
}

test('0368 AC3: a click on the pop-up inside its column, such as between two groups, doesn\'t close it', async () => {
  const p = await opened();
  clickAt(p, 400);
  await p.settle();
  assert.equal(pop(p).hidden, false);
});

test('0368 AC3: a click on the pop-up\'s scroll bar, beside the column, scrolls rather than closing it', async () => {
  const p = await opened();
  pop(p).getBoundingClientRect = () => ({ left: 0, right: 960, top: 0, bottom: 800, width: 960, height: 800 });
  pop(p).clientLeft = 0;
  pop(p).clientWidth = 945; // a 15 px scroll bar on the right
  clickAt(p, 950);
  await p.settle();
  assert.equal(pop(p).hidden, false, 'still open');
  clickAt(p, 900);
  await p.settle();
  assert.equal(pop(p).hidden, true, 'beside the column and left of the scroll bar, it closes');
});

test('0368 AC3: a drag from the column, such as selecting a setting\'s text, ending beside it doesn\'t close it', async () => {
  const p = await opened();
  clickAt(p, 40, 400, pop(p).children[1]);
  await p.settle();
  assert.equal(pop(p).hidden, false);
  clickAt(p, 40, 400);
  await p.settle();
  assert.equal(pop(p).hidden, false, 'nor one from between two groups');
});

// ---------- AC4: the same view as the side pane showed ----------

test('0368 AC4: the pop-up shows the groups, controls, this-machine choices and Save, as the side pane did', async () => {
  const p = await opened();
  const kids = pop(p).children;
  const titles = kids.filter(n => n.className === 'sgroup').map(g => p.all(g).find(n => n.tagName === 'h4')?.textContent);
  for (const t of ['Shipping', 'How much runs at once', 'Ticket size limits', 'Foreman']) assert.ok(titles.includes(t), `the ${t} group`);
  assert.ok(p.all(pop(p)).some(n => n.tagName === 'select' || n.tagName === 'input'), 'controls');
  assert.ok(p.all(pop(p)).some(n => n.tagName === 'button' && /\bsave-all\b/.test(n.className || '')), 'Save');
  assert.match(pop(p).textContent, /this machine/i);
});

// ---------- AC2 and AC4: what the pop-up covers is shown in it ----------

test('0368 AC4: a refused Auto-build switch shows speck run\'s message beside the switch, as the pop-up covers the strip under the header', async () => {
  const p = await opened([{ status: 409, body: { error: 'speck run won\'t start: no build_command.' } }]);
  p.press(p.all(pop(p)).find(n => n.id === 'run-switch'));
  await p.settle();
  const said = p.all(pop(p)).find(n => n.tagName === 'p' && n.className === 'bad' && n.hidden === false);
  assert.equal(said?.textContent, 'speck run won\'t start: no build_command.');
  assert.equal(p.byId('run-error').textContent, 'speck run won\'t start: no build_command.', 'and under the header, as before');
});
