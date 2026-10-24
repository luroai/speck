// 0366: pressing the Foreman's notice board opens its detail in a pop-up over the whole panel, shared with a document's
// pop-up (0362), rather than under the header.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, page, T, styles } from './support/panel.mjs';
import { foremanView } from '../scripts/foreman.mjs';

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const view = (o = {}, tickets = [], agent) => foremanView({ run: ON, record: rec(o), tickets, ...(agent ? { agent } : {}) });
const state = (foreman, o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman, ...o });
// The declarations of each CSS rule whose selector list holds exactly `sel`, in the page's style, media queries included.
const rules = sel => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].replace(/^[^{]*\{/, '').split(',').map(x => x.trim()).includes(sel)).map(m => m[2]);
};
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };

// A page where each node can take the focus (`p.focused()`), knows whether it's still on the page, and the page can be
// held: `p.behind` are the header, the notices and the board, which holdPage makes inert.
function popPage(responses, globals = {}) {
  let focused = null;
  const roots = new Set();
  const focusable = n => {
    n.focus = () => { focused = n; };
    Object.defineProperty(n, 'isConnected', { configurable: true, get: () => { let r = n; while (r.parentNode) r = r.parentNode; return roots.has(r); } });
    return n;
  };
  const p = fakePage(responses, { scrollX: 0, scrollY: 0, scrollTo() {}, ...globals }, { made: focusable });
  for (const id of ['foreman', 'run', 'queue', 'doc-view', 'full-ticket', 'settings']) roots.add(focusable(p.byId(id)));
  p.behind = ['header', 'offline', 'restart', 'main'].map(tag => ({ tagName: tag, inert: false }));
  const classes = new Set();
  p.document.documentElement = { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } };
  p.document.querySelectorAll = () => p.behind;
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  p.held = () => classes.has('held');
  return p;
}
const pop = p => p.byId('foreman');
const closeOf = p => p.all(pop(p)).find(n => n.tagName === 'button' && n.textContent === 'Close');
const tick = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
async function opened(responses, globals) {
  const p = popPage(responses, globals);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const BUSY = view({ building: ['0001'], ready: [{ id: '0004', kind: 'after', why: 'waiting for 0003' }] },
  [T('0001', 'ready'), T('0004', 'ready'), T('0006', 'blocked', { blocked_question: 'Which one?' })]);

// ---------- AC1: a pop-up over the whole panel, in a document's look, with Close and the detail ----------

test('0366 AC1: pressing the notice board opens a pop-up with a Close button and, since 0458, only the log', async () => {
  const p = await opened([state(BUSY)]);
  assert.equal(pop(p).hidden, false, 'open');
  assert.ok(closeOf(p), 'a Close button');
  assert.deepEqual(p.all(pop(p)).filter(n => /^h\d$/.test(n.tagName)).map(n => n.textContent), []); // 0470: no Log heading
  assert.doesNotMatch(pop(p).textContent, /0004 waiting for 0003|Which one\?/);
});

test('0366 AC1: the pop-up is a modal dialog after the board, not under the header, sharing the document pop-up\'s rules', () => {
  const html = page(), tag = html.match(/<div class="foreman" id="foreman"[^>]*>/)?.[0] || '';
  assert.match(tag, /role="dialog"/);
  assert.match(tag, /aria-modal="true"/);
  assert.match(tag, /tabindex="-1"/);
  assert.ok(html.indexOf(tag) > html.indexOf('</main>'), 'not between the header and the board');
  for (const sel of ['#foreman .close']) { // 0470: its title is in Doto, the document's isn't. 0479: it's framed as a lane card, filling the window, so only its Close is the document's
    const shared = sel.replace('#foreman', '#doc-view');
    assert.ok(rules(sel).length >= 1, `${sel} is styled`);
    assert.ok(rules(sel).some(r => rules(shared).includes(r)), `${sel} shares ${shared}'s rules`); // 0479: and has the frame's colours as well
  }
  assert.match(rules('#foreman')[0], /position: fixed/);
  assert.match(rules('#foreman')[0], /inset: 0/);
  assert.ok(rules('#foreman').some(r => /round\(down, calc\(\(100% - 720px\) \/ 2\), 1px\)/.test(r)), 'its text in a centred column (0479: the lanes\' column)');
  assert.ok(!rules('.foreman').some(r => /border-bottom|padding/.test(r)), 'no longer laid out as a strip under the header');
});

// ---------- AC2: nothing behind it can be reached, the focus moves in and it scrolls on its own ----------

test('0366 AC2: while it is open, the page behind is held and inert, and the focus is in the pop-up', async () => {
  const p = await opened([state(BUSY)]);
  assert.equal(p.held(), true, 'the page behind can\'t scroll');
  for (const n of p.behind) assert.equal(n.inert, true, `${n.tagName} can't be clicked or reached with Tab`);
  assert.ok(within(p.focused(), pop(p)), 'the focus is in the pop-up');
  assert.match(rules('#foreman')[0], /overflow-y: auto/, 'a long detail scrolls inside it');
  assert.match(rules('#foreman')[0], /overscroll-behavior: contain/);
});

// ---------- AC3: Close and Escape close it, the focus back on the board ----------

for (const [how, close] of [['Close', p => p.press(closeOf(p))], ['Escape', p => p.key('Escape')]]) {
  test(`0366 AC3: ${how} closes the pop-up, with the focus back on the notice board`, async () => {
    const p = await opened([state(BUSY)]);
    close(p);
    await p.settle();
    assert.equal(pop(p).hidden, true, 'closed');
    assert.equal(p.focused(), p.byId('run'), 'the focus on the notice board');
    assert.equal(p.byId('run').attrs['aria-expanded'], 'false');
    assert.equal(p.held(), false);
    for (const n of p.behind) assert.equal(n.inert, false, `${n.tagName} can be used again`);
  });
}

// ---------- AC4: it stays up to date, keeping an answer being typed, and Reload page still reloads ----------

test('0366 AC4: the pop-up stays up to date as the panel refreshes, keeping its Close button and the focus in it', async () => {
  // 0458: what changes in it is the log
  const p = await opened([state(BUSY, { run_log: '1' }), { lines: ['first'] }, state(BUSY, { run_log: '2' }), { lines: ['second', 'first'] }]);
  const close = closeOf(p);
  assert.match(pop(p).textContent, /first/);
  await tick(p);
  assert.equal(pop(p).hidden, false, 'still open');
  assert.match(pop(p).textContent, /firstsecond/); // 0459: the newest line at the bottom
  assert.equal(closeOf(p), close, 'Close is kept');
  assert.ok(within(p.focused(), pop(p)), 'the focus stays in the pop-up');
});

test('0366 AC4: an answer being typed to the Foreman\'s question keeps its text and focus through a refresh', async () => {
  // 0458: the question is on its ticket's card, not in the pop-up
  const agent = { running: null, asks: [{ id: '0001', question: 'Should it keep the old test?' }], did: [] };
  const f = { ...view({}, [T('0001', 'building')]), agent };
  const p = popPage([state(f, { tickets: [T('0001', 'building')] }), state(f, { tickets: [T('0001', 'building')] })]);
  await p.settle();
  const box = () => p.all(p.byId('queue')).find(n => n.tagName === 'textarea');
  const typed = box();
  assert.ok(typed, 'the question has an Answer box');
  typed.value = 'Keep it';
  typed.listeners.input();
  typed.focus();
  await tick(p);
  assert.equal(box().value, 'Keep it', 'with the text typed');
  assert.equal(p.focused(), box(), 'and the focus in it');
});

test('0366 AC4: the Reload page button in the pop-up still reloads the page', async () => {
  let reloaded = 0;
  const p = await opened([state(view({}), { page: 'newer' })], { location: { reload: () => { reloaded++; } } });
  const reload = p.all(pop(p)).find(n => n.id === 'foreman-reload');
  assert.ok(reload, 'a Reload page button');
  assert.equal(reload.textContent, 'Reload page');
  p.press(reload);
  assert.equal(reloaded, 1);
});
