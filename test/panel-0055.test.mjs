import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fm, good, page, panelRepo, freePort, startPanel, stop, fakePage, round, exitOf, queueRows, stagesOf, nowStep, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0055: a moving dot of light on the current step of a ticket being built or reviewed ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const ago = min => new Date(Date.now() - min * 60000).toISOString();
const idOf = row => (function find(n) { if (n.className === 'id') return n._text; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
const rowOf = (p, id) => queueRows(p).find(r => idOf(r) === id);
const moving = n => /(^| )moving( |$)/.test(n.className || '');
const movingSteps = row => stagesOf(row).children.filter(moving);

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
    assert.equal(steps[0], nowStep(row), `${id}'s moving step is its current one`);
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
  assert.match(inside, /\.moving::after\s*\{[^}]*animation:/, 'the moving dot is inside it');
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
// Each refresh puts in a new status pill, so a pill that isn't the one marked is a refresh since.
const refreshed = async (b, what) => { await b.js(`window.seen = document.getElementById('pills').firstChild`); await b.until(`document.getElementById('pills').firstChild !== window.seen`, what); };
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;
// The page point at a character offset in the text of the element an expression finds.
const charIn = (expr, offset) => `(() => { const n = ${expr}.firstChild, r = document.createRange(); r.setStart(n, ${offset}); r.setEnd(n, ${offset} + 1);
  const x = r.getBoundingClientRect(); return [x.left + 1, x.top + x.height / 2]; })()`;
const dotLeft = id => `parseFloat(getComputedStyle(${row(id)}.querySelector('.stages .now'), '::after').left)`;

test('0055 AC1-AC4: in a real browser, only the in-flight step moves, side to side within itself, through refreshes, and not with reduced motion', chrome, async () => {
  const r = repoWithBoard();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the queue');
    // AC1 and AC2: one animation, on 0002's current step, running forever (Infinity comes back as null) and back and forth.
    const anims = `document.getAnimations().map(a => ({ target: a.effect.target === ${row('0002')}.querySelector('.stages .now'), pseudo: a.effect.pseudoElement,
      iterations: a.effect.getTiming().iterations, direction: a.effect.getTiming().direction, state: a.playState }))`;
    assert.deepEqual(await b.js(anims), [{ target: true, pseudo: '::after', iterations: null, direction: 'alternate', state: 'running' }]);
    // The dot stays within the step: sample it as it goes.
    const width = await b.js(`${row('0002')}.querySelector('.stages .now').clientWidth`);
    const dot = await b.js(`parseFloat(getComputedStyle(${row('0002')}.querySelector('.stages .now'), '::after').width)`);
    const seen = [];
    for (let i = 0; i < 12; i++) { seen.push(await b.js(dotLeft('0002'))); await new Promise(res => setTimeout(res, 150)); }
    assert.ok(new Set(seen.map(Math.round)).size > 3, `the dot moves: ${seen}`);
    for (const x of seen) assert.ok(x >= 0 && x + dot <= width + 0.5, `the dot at ${x} stays within the ${width}px step`);
    // AC4: the motion carries on through a refresh, and a selection in the row stays.
    const t = `${row('0002')}.querySelector('.title')`;
    await b.drag(await b.js(charIn(t, 0)), await b.js(charIn(t, 6)));
    assert.equal(await b.js('getSelection().toString()'), 'A buil');
    await b.js(`window.anim = document.getAnimations()[0]; window.at = window.anim.currentTime`);
    await refreshed(b, 'a refresh'); await refreshed(b, 'a second refresh');
    assert.equal(await b.js(`document.getAnimations()[0] === window.anim && window.anim.currentTime > window.at`), true, 'the same animation runs on');
    assert.equal(await b.js('getSelection().toString()'), 'A buil', 'the selection stays');
    // AC3: with reduced motion, nothing moves, and the step looks as it did before 0055.
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await b.until(`document.getAnimations().length === 0`, 'no animations');
    assert.equal(await b.js(`getComputedStyle(${row('0002')}.querySelector('.stages .now'), '::after').content`), 'none', 'no dot is drawn');
    const look = id => b.js(`(() => { const s = getComputedStyle(${row(id)}.querySelector('.stages .now')); return [s.borderTopColor, s.color, s.position, s.overflow]; })()`);
    const blocked = await look('0004'); // a step 0055 doesn't touch, for its geometry
    assert.deepEqual((await look('0002')).slice(2), blocked.slice(2), 'laid out as an untouched step');
    assert.equal((await look('0002'))[0], 'rgb(95, 168, 224)', 'in the in-flight blue');
  } finally {
    await b.close();
    await stop(panel);
  }
});
