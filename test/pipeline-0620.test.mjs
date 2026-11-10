// 0620: every line in the Pipeline log view shows in full, wrapping under its own text, rather than being cut off.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fakePage, model, styles } from './support/panel.mjs';

const summary = vm.runInNewContext(`${model()}\nrunLogSummary`, {});
const lineOf = vm.runInNewContext(`${model()}\nrunLogLine`, {});

const LONG = 'speck run is waiting for main to pass its tests before it ships anything else, and it checks again every minute until then.';
const AGAIN = 'speck run will try it again once main or its branch has a new commit.';
const WHY = 'the ship of it ran on far longer than anyone would expect it to and gave no reason why at all';
const LINES = [ // newest first, as the server gives them
  `21:06:00 ${LONG}`,
  AGAIN,
  `21:04:00 0003 didn't ship: ${WHY}`,
  '21:03:00 speck run stopped. 1 build is still running: 0457.',
  '21:02:00 » 0002: I went with the recommendation: keep it, as watch is fix, and noted it in the ticket, so its build carries on from where it stopped.',
  '21:00:00 Shipped 0001.',
];

function popPage(lines) {
  const made = n => { n.focus = () => {}; n.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0 }); };
  const board = { tickets: [], ideas: [], resume_command: '', run: { on: true, pid: 4242 }, foreman: null, run_log: '1' };
  const p = fakePage([], { scrollX: 0, scrollY: 0, scrollTo() {}, fetch: async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? { lines } : board) }) }, { made });
  for (const id of ['foreman', 'run']) made(p.byId(id));
  p.document.documentElement = { dataset: {}, classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  return p;
}
async function opened(lines = LINES) {
  const p = popPage(lines);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const of = (p, cls, root) => p.all(root).filter(n => (n.className || '').split(' ').includes(cls));
const rows = p => p.all(p.byId('foreman')).filter(n => n.tagName === 'li');
const textOf = (p, row) => of(p, 'log-text', row)[0].textContent;

const css = () => styles();
const decls = sel => [...css().matchAll(new RegExp(`^\\s*${sel.replace(/[.#]/g, c => `\\${c}`)} \\{([^}]*)\\}`, 'gm'))]
  .flatMap(m => [...m[1].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map(d => [d[1], d[2].trim()]));
const decl = (sel, name) => (decls(sel).filter(([k]) => k === name).pop() || [])[1];
const ROW = '#foreman.log-view .run-log';

// ---------- AC1: a long line wraps, whole, under its own text ----------

test('0620 AC1: a long line\'s summary is its whole text, with no … and no sentence left out', () => {
  assert.equal(summary(LONG), LONG);
  assert.equal(summary(AGAIN), AGAIN);
  assert.equal(summary('speck run stopped. 1 build is still running: 0457.'), '0457 speck run stopped. 1 build is still running: 0457.', 'starting with the id it names, as since 0459');
  assert.equal(summary(`0003 didn't ship: ${WHY}`), `0003 didn't ship: ${WHY}`);
  assert.equal(summary('0457 is already being built, so speck run won\'t launch it.'), '0457 is already being built, so speck run won\'t launch it.');
});

test('0620 AC1: the whole line shows in the view, each in its own row\'s text', async () => {
  const p = await opened();
  const texts = rows(p).map(r => textOf(p, r));
  assert.ok(texts.includes(LONG), 'the long line whole');
  assert.ok(texts.includes(AGAIN), 'the line with no time whole');
  assert.ok(texts.includes(`0003 didn't ship: ${WHY}`), 'the ship\'s reason whole');
  assert.ok(texts.some(t => t.endsWith('so its build carries on from where it stopped.')), 'speck\'s own line whole');
  assert.ok(texts.every(t => !t.includes('…')), 'no line is cut off');
});

test('0620 AC1: a row\'s text wraps within its own column, and nothing around it cuts it off', () => {
  assert.equal(decl(`${ROW} .log-text`, 'white-space'), 'pre-wrap');
  assert.equal(decl(`${ROW} .log-text`, 'overflow-wrap'), 'anywhere');
  assert.equal(decl(`${ROW} .log-main`, 'grid-column'), '3', 'the text and its wrapped lines in the third column, under it');
  for (const sel of [`${ROW} .log-row`, `${ROW} .log-main`, `${ROW} .log-text`, `${ROW}`, '.foreman .run-log', '.foreman ol.run-log']) {
    assert.notEqual(decl(sel, 'white-space'), 'nowrap', `${sel} doesn't stop it wrapping`);
    assert.equal(decl(sel, 'text-overflow'), undefined, `${sel} doesn't end it in …`);
    assert.equal(decl(sel, 'max-height'), undefined, `${sel} isn't cut to a height`);
    assert.equal(decl(sel, '-webkit-line-clamp'), undefined, `${sel} isn't clamped to some lines`);
  }
});

test('0620 AC1: a whole line still never shows a session id, a file path or a command', () => {
  const s = summary("0457 build (session 8e7e50ba-3ede-4362-b6de-8e47775cbe50) stopped unexpectedly, so speck run is resuming it once. Run `speck ship 0457 --auto` to ship it, or see speck/.cache/runs/0457.log for more.");
  assert.ok(s.startsWith('0457 build stopped unexpectedly, so speck run is resuming it once.'), s);
  assert.doesNotMatch(s, /[0-9a-f]{8}-|`|\/|--auto|\.log\b/, s);
});

// ---------- AC2: one line to a row, with its time and speck's face ----------

test('0620 AC2: each line is one row, its time first and speck\'s face beside speck\'s own, in the columns they had', async () => {
  const p = await opened();
  const all = rows(p);
  assert.equal(all.length, LINES.length, 'one row for each line');
  const first = all[0];
  assert.equal(first.children[0].className, 'at');
  assert.equal(first.children[0].textContent, '21:00:00');
  const mine = all.find(r => textOf(p, r).startsWith('0002: I went with'));
  assert.equal(mine.children[0].className, 'at');
  assert.equal(mine.children[2].className, 'log-main', 'the face between the time and the text');
  assert.equal(decl(`${ROW} .log-row`, 'display'), 'grid');
  assert.equal(decl(`${ROW} .log-row`, 'grid-template-columns'), '9ch 20px minmax(0, 1fr)');
  assert.equal(decl(`${ROW} .log-row`, 'align-items'), 'start', 'the time and face stay at the top of a wrapped row');
  assert.equal(decl(`${ROW} .at`, 'grid-column'), '1');
  assert.equal(decl(`${ROW} .speck-face`, 'grid-column'), '2');
  assert.deepEqual(JSON.parse(JSON.stringify(lineOf(`21:06:00 ${LONG}`))), { at: '21:06:00 ', text: LONG, kind: 'msg' });
});

// ---------- AC3: the bar's one line may still be cut short ----------

test('0620 AC3: the bar\'s one-line summary stays on one line, cut short with … when it doesn\'t fit', () => {
  assert.equal(decl('.bezel .bar-more', 'white-space'), 'nowrap');
  assert.equal(decl('.bezel .bar-more', 'text-overflow'), 'ellipsis');
});
