import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fm, good, page, panelRepo, freePort, startPanel, stop, fakePage, round, exitOf, queueRows, badgeOf, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0055: a moving dot of light on the current step of a ticket being built or reviewed ----------
// Since 0168 the builder badge plays its laptop loop while an agent is at work (test/panel-0168.test.mjs); from 0156 until
// then, the current step was a dot that pulsed, with the speck going round an ensō beside it.

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const ago = min => new Date(Date.now() - min * 60000).toISOString();
const idOf = row => (function find(n) { if (n.className === 'id') return n._text; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
const rowOf = (p, id) => queueRows(p).find(r => idOf(r) === id);
// A row's badge, when it's at work: at most one. At the laptop, or since 0169 checking its own work or with the reviewer.
const movingSteps = row => [badgeOf(row)].filter(b => b && /^badge (type|check|review)$/.test(b.className));

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

test('0055 AC1: a building or reviewing ticket that isn\'t red moves on its current step, and only there', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const id of ['0001', '0002', '0008']) {
    const row = rowOf(p, id), steps = movingSteps(row);
    assert.equal(steps.length, 1, `${id} has one moving step`);
    assert.equal(steps[0].tagName, 'canvas', `${id}'s builder badge is drawn`);
    assert.ok(!/\bbad\b/.test(steps[0].className), `${id}'s step isn't red`);
  }
});

test('0055 AC2: no ready, blocked, approved or red building or reviewing ticket moves', async () => {
  const p = fakePage([board()]);
  await p.settle();
  for (const id of ['0003', '0004', '0005', '0006', '0007']) assert.equal(movingSteps(rowOf(p, id)).length, 0, `${id} doesn't move`);
});

test('0055 AC3: the motion is drawn only when the browser doesn\'t ask for reduced motion', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  const at = css.indexOf('@media (prefers-reduced-motion: no-preference)');
  assert.ok(at >= 0, 'there is a no-preference block');
  // The block's body, up to its matching brace.
  let depth = 0, end = css.indexOf('{', at);
  for (let i = end; i < css.length; i++) { if (css[i] === '{') depth++; else if (css[i] === '}' && --depth === 0) { end = i; break; } }
  const inside = css.slice(at, end + 1), outside = css.slice(0, at) + css.slice(end + 1);
  // Since 0168 the badge moves in the page script, which draws a still pose when the browser asks for reduced motion.
  assert.match(page(), /const fixed = matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches \|\| pose === 'still';/, 'a still badge with reduced motion');
  assert.doesNotMatch(outside, /\.moving/, 'no rule outside it changes a moving step');
  assert.doesNotMatch(outside, /animation:/, 'and nothing else animates');
});

test('0055 AC4: a refresh with the ticket unchanged keeps its moving step\'s node, so the motion carries on', async () => {
  const s = board(), next = clone(s), third = clone(s);
  next.tickets.push(T('0009', 'ready', { title: 'Another ticket' })); // another ticket changes
  third.tickets[0].status = 'reviewing'; third.tickets[0].rounds = [round(1, 100)]; // now 0001 changes
  const p = fakePage([s, next, third]);
  await p.settle();
  const step = movingSteps(rowOf(p, '0001'))[0], row = rowOf(p, '0001'), detached = step.detached || 0;
  await refresh(p);
  assert.equal(rowOf(p, '0001'), row, 'the row is kept');
  assert.equal(movingSteps(rowOf(p, '0001'))[0], step, 'the same moving step is on the page');
  assert.equal(step.detached || 0, detached, 'and was never taken out');
  await refresh(p);
  assert.notEqual(rowOf(p, '0001'), row, 'a change to the ticket itself redraws it');
  assert.equal(movingSteps(rowOf(p, '0001')).length, 1, 'and it still moves');
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
// Each refresh puts a new square in the Auto-build button (0150), so a square that isn't the one marked is a refresh since.
const refreshed = async (b, what) => { await b.js(`window.seen = document.getElementById('run').firstChild`); await b.until(`document.getElementById('run').firstChild !== window.seen`, what); };
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;
// The page point at a character offset in the text of the element an expression finds.
const charIn = (expr, offset) => `(() => { const n = ${expr}.firstChild, r = document.createRange(); r.setStart(n, ${offset}); r.setEnd(n, ${offset} + 1);
  const x = r.getBoundingClientRect(); return [x.left + 1, x.top + x.height / 2]; })()`;

test('0055 AC1-AC4: in a real browser, only the in-flight step moves, through refreshes, and not with reduced motion', chrome, async () => {
  const r = repoWithBoard();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the queue');
    // AC1 and AC2: since 0168, 0002's builder badge is the one at work, drawn afresh each frame, and nothing animates in CSS.
    const frame = `${row('0002')}.querySelector('canvas.badge').toDataURL()`;
    // 0200: the rows go in the order their builds started, so 0002, started last, is the last row.
    assert.deepEqual(await b.js(`[...document.querySelectorAll('canvas.badge')].map(c => c.className)`), ['badge bad', 'badge bad', 'badge type']);
    assert.equal(await b.js(`${row('0002')}.querySelector('canvas.badge').className`), 'badge type');
    assert.deepEqual(await b.js(`document.getAnimations().length`), 0);
    await b.js(`window.drawn = ${frame}`);
    await b.until(`${frame} !== window.drawn`, 'the badge moves');
    // AC4: the motion carries on through a refresh, and a selection in the row stays.
    const t = `${row('0002')}.querySelector('.title')`;
    await b.drag(await b.js(charIn(t, 0)), await b.js(charIn(t, 6)));
    assert.equal(await b.js('getSelection().toString()'), 'A buil');
    await b.js(`void (window.badge = ${row('0002')}.querySelector('canvas.badge'))`); // 0302: the canvas itself stays in the page
    await refreshed(b, 'a refresh'); await refreshed(b, 'a second refresh');
    assert.equal(await b.js(`${row('0002')}.querySelector('canvas.badge') === window.badge`), true, 'the same badge runs on');
    await b.js(`window.drawn = ${frame}`);
    await b.until(`${frame} !== window.drawn`, 'the badge still moves');
    assert.equal(await b.js('getSelection().toString()'), 'A buil', 'the selection stays');
    // AC3: with reduced motion, nothing moves, and the stage's name keeps its in-flight blue.
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await new Promise(r => setTimeout(r, 200));
    await b.js(`window.drawn = ${frame}`);
    await new Promise(r => setTimeout(r, 400));
    assert.equal(await b.js(`${frame} === window.drawn`), true, 'the badge holds still');
    assert.equal(await b.js(`getComputedStyle(${row('0002')}.querySelector('.stage')).color`), 'rgb(48, 79, 109)', 'in the in-flight blue');
  } finally {
    await b.close();
    await stop(panel);
  }
});
