import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fm, good, page, panelRepo, freePort, startPanel, stop, fakePage, round, exitOf, queueRows, findChrome, browserPage, styles } from './support/panel.mjs';

// ---------- 0055: a moving dot of light on the current step of a ticket being built or reviewed ----------
// Since 0168 the builder badge plays its laptop loop while an agent is at work (test/panel-0168.test.mjs); from 0156 until
// then, the current step was a dot that pulsed, with the speck going round an ensō beside it. 0416: no card moves now, as
// speck's screen is the only part of the panel that animates, so these check that nothing on a card does.

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const ago = min => new Date(Date.now() - min * 60000).toISOString();
const idOf = row => (function find(n) { if (n.className === 'id') return n._text; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
const rowOf = (p, id) => queueRows(p).find(r => idOf(r) === id);
// Anything on a row that could move: a canvas, or a node marked as moving or as a badge.
const movingSteps = row => (function all(n) { return [n, ...(n.children || []).flatMap(all)]; })(row)
  .filter(n => n.tagName === 'canvas' || /\b(moving|badge)\b/.test(n.className || ''));
// The row's current stage's name.
const stageIn = row => (function find(n) { if (/^stage\b/.test(n.className || '')) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);

const board = () => ({
  tickets: [
    T('0001', 'building', { started: ago(5) }),
    T('0002', 'reviewing', { started: ago(4), rounds: [round(1, 100)] }),
    T('0003', 'building', { started: ago(6), ...exitOf() }), // red: its build has exited
    T('0004', 'reviewing', { started: ago(6), rounds: [round(1, 100)], ...exitOf() }), // red too
    T('0005', 'blocked', { started: ago(9), blocked_question: 'Which way?' }),
    T('0006', 'approved', { started: ago(9), rounds: [round(1, 100)] }),
    T('0007', 'ready'),
    T('0008', 'building', { started: ago(2), self_check: 'Self-check: no changes' }), // on the Self-check step's successor
  ],
  ideas: [],
});

test('0055 AC1: a building or reviewing ticket that isn\'t red says its current step, and nothing on it moves (0416)', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const id of ['0001', '0002', '0008']) {
    const row = rowOf(p, id);
    assert.equal(movingSteps(row).length, 0, `${id} doesn't move`);
    assert.ok(stageIn(row) && stageIn(row).textContent, `${id} names its current step`);
    assert.ok(!/\bbad\b/.test(stageIn(row).className), `${id}'s step isn't red`);
  }
});

test('0055 AC2: no ready, blocked, approved or red building or reviewing ticket moves', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const id of ['0003', '0004', '0005', '0006', '0007']) assert.equal(movingSteps(rowOf(p, id)).length, 0, `${id} doesn't move`);
});

test('0055 AC3: no motion is drawn on a card, whatever the browser asks for (0416)', () => {
  const css = styles();
  const at = css.indexOf('@media (prefers-reduced-motion: no-preference)');
  assert.ok(at >= 0, 'there is a no-preference block');
  // The block's body, up to its matching brace.
  let depth = 0, end = css.indexOf('{', at);
  for (let i = end; i < css.length; i++) { if (css[i] === '{') depth++; else if (css[i] === '}' && --depth === 0) { end = i; break; } }
  const inside = css.slice(at, end + 1), outside = css.slice(0, at) + css.slice(end + 1);
  // From 0168 until 0416 the badge moved in the page script. 0364: the Foreman's button has no builder (0303) now.
  assert.doesNotMatch(page(), /LCD\.badge\(/, 'no badge on a card');
  assert.doesNotMatch(page(), /LCD\.mini\(/, 'and no builder in the Foreman\'s button to move');
  assert.doesNotMatch(outside, /\.moving/, 'no rule outside it changes a moving step');
  assert.doesNotMatch(outside, /animation:/, 'and nothing else animates');
});

test('0055 AC4: a refresh with the ticket unchanged keeps its current step\'s node', async () => {
  const s = board(), next = clone(s), third = clone(s);
  next.tickets.push(T('0009', 'ready', { title: 'Another ticket' })); // another ticket changes
  third.tickets[0].status = 'reviewing'; third.tickets[0].rounds = [round(1, 100)]; // now 0001 changes
  const p = fakePage([s, next, third]);
  await p.settle();
  const step = stageIn(rowOf(p, '0001')), row = rowOf(p, '0001'), detached = step.detached || 0;
  await refresh(p);
  assert.equal(rowOf(p, '0001'), row, 'the row is kept');
  assert.equal(stageIn(rowOf(p, '0001')), step, 'the same step is on the page');
  assert.equal(step.detached || 0, detached, 'and was never taken out');
  await refresh(p);
  assert.notEqual(rowOf(p, '0001'), row, 'a change to the ticket itself redraws it');
  assert.equal(movingSteps(rowOf(p, '0001')).length, 0, 'and it still doesn\'t move');
});

// ---------- in a real browser ----------

function repoWithBoard() {
  const r = panelRepo();
  const write = (id, o, body = good) => r.write(`${id}-t.md`, fm({ id: `"${id}"`, ...o }), body);
  write('0002', { title: "'A building ticket'", status: 'building', started: ago(4) });
  write('0003', { title: "'A stopped build'", status: 'building', started: ago(6) });
  write('0004', { title: "'A blocked ticket'", status: 'blocked', started: ago(6) }, `${good}## Blocked question\nWhich way?\n`);
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0003.json'), JSON.stringify({ id: '0003', session: 's', started: ago(6), exited: ago(1), exit_code: 1 }));
  return r;
}
// Each refresh puts a new label in the Foreman's button (0150; 0303: its builder stays), so a label that isn't the one
// marked is a refresh since.
const refreshed = async (b, what) => { await b.js(`window.seen = window.drawn || 0; if (!window.drawWatch) (window.drawWatch = new MutationObserver(() => { window.drawn = (window.drawn || 0) + 1; })).observe(document.getElementById('bezel'), { attributes: true }); true`); await b.until(`(window.drawn || 0) > window.seen`, what); }; // 0413: each redraw sets the frame of speck's screen, which stays between them
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;
// The page point at a character offset in the text of the element an expression finds.
const charIn = (expr, offset) => `(() => { const n = ${expr}.firstChild, r = document.createRange(); r.setStart(n, ${offset}); r.setEnd(n, ${offset} + 1);
  const x = r.getBoundingClientRect(); return [x.left + 1, x.top + x.height / 2]; })()`;

test('0055 AC1-AC4: in a real browser, no card moves, a refresh keeps a selection, and the stage keeps its blue (0416)', chrome, async () => {
  const r = repoWithBoard();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the queue');
    // AC1 and AC2: since 0416, no card has a canvas, and nothing animates in CSS but (0434) the dots of the grid of
    // lights on a card an agent is at work on.
    assert.equal(await b.js(`document.querySelectorAll('#queue canvas').length`), 0);
    assert.deepEqual(await b.js(`document.getAnimations().filter(a => !a.effect.target.matches('#queue .q .lights > i')).length`), 0);
    // AC4: a refresh keeps the row's step, and a selection in the row stays.
    const t = `${row('0002')}.querySelector('.title')`;
    await b.drag(await b.js(charIn(t, 0)), await b.js(charIn(t, 6)));
    assert.equal(await b.js('getSelection().toString()'), 'A buil');
    await b.js(`void (window.step = ${row('0002')}.querySelector('.stage'))`);
    await refreshed(b, 'a refresh'); await refreshed(b, 'a second refresh');
    assert.equal(await b.js(`${row('0002')}.querySelector('.stage') === window.step`), true, 'the same step stays');
    assert.equal(await b.js('getSelection().toString()'), 'A buil', 'the selection stays');
    // AC3: the stage's name keeps its in-flight blue.
    assert.equal(await b.js(`getComputedStyle(${row('0002')}.querySelector('.stage')).color`), 'rgb(40, 83, 114)', 'in the in-flight blue'); // 0426: --run, Cursor's blue at the shade small text needs
  } finally {
    await b.close();
    await stop(panel);
  }
});
