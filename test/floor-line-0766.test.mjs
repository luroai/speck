import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0766: the line on the factory floor, above its stations: a row per project through Queue, Builder, Reviewer, QA and
// Ship, from the line each project's summary gives (0764's), checked on fakePage's DOM. How it scrolls at a window's
// width is checked in a real browser (floor-line-browser-0766.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stoppedClock } from './support/panel.mjs';
import { floorPage } from './support/floor.mjs';
import { nodes, classes, byClass, textOf, lineAnswer, lineOf, NOW, minutesAgo, run } from './support/floor-line.mjs';

const rowsOf = p => byClass(p.byId('line'), 'line-row');
const cellOf = (row, col) => byClass(row, `line-${col}`)[0];
const slotsOf = cell => byClass(cell, 'slot');
const slotFacts = s => Object.fromEntries(['slot-id', 'slot-title', 'slot-time', 'slot-agent', 'slot-model', 'slot-effort', 'slot-why'].map(c => [c.slice(5), textOf(s, c)]));
const agentOf = s => ['claude', 'codex', 'cursor', 'other'].find(a => classes(s).includes(`agent-${a}`)) || null;
const open = async answers => { const p = floorPage(answers, { Date: stoppedClock(NOW) }); await p.settle(); return p; };

// ---------- AC1: a row per project, the five columns, the members' faces ----------

test('0766 AC1: the line is above the stations, with a row for each project on the list and the columns Queue, Builder, Reviewer, QA and Ship', async () => {
  const p = await open([lineAnswer()]);
  const html = fs.readFileSync(new URL('../templates/floor.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('id="line"') > 0 && html.indexOf('id="line"') < html.indexOf('id="stations"'), 'the line comes before the stations');
  assert.ok(html.indexOf('speck-face.js') > 0 && html.indexOf('speck-face.js') < html.indexOf('floor.js'), 'the members\' faces load before the floor\'s script');
  const heads = byClass(p.byId('line'), 'line-head');
  assert.deepEqual(heads.map(h => textOf(h, 'line-head-label')), ['Queue', 'Builder', 'Reviewer', 'QA', 'Ship']);
  assert.deepEqual(rowsOf(p).map(r => [textOf(r, 'line-n'), textOf(r, 'line-name')]), [['01', 'alpha'], ['02', 'bravo'], ['03', 'charlie']], 'every project on the list, in its order, even one not answering');
  for (const r of rowsOf(p)) for (const col of ['queue', 'builder', 'reviewer', 'qa', 'ship']) assert.ok(cellOf(r, col), `${textOf(r, 'line-name')} has a ${col} cell`);
});

test('0766 AC1: the Builder, Reviewer and QA headings show that member\'s character as the panel draws it, and Queue and Ship none', async () => {
  const p = await open([lineAnswer()]);
  const faces = byClass(p.byId('line'), 'line-head').map(h => nodes(h).filter(n => n.tagName === 'svg').map(n => n.attrs['data-role']));
  assert.deepEqual(faces, [[], ['builder'], ['reviewer'], ['qa'], []]);
  for (const svg of nodes(p.byId('line')).filter(n => n.tagName === 'svg' && n.attrs.class === 'speck-face')) assert.ok(+svg.attrs.width >= 16, 'as big as SpeckFace draws it');
});

// ---------- AC2: a lit station ----------

test('0766 AC2: a station with a ticket on it is lit, with its id, title, time there, agent as a stripe in its colour, model, effort and why', async () => {
  const p = await open([lineAnswer()]);
  const alpha = rowsOf(p)[0];
  const [build, second] = slotsOf(cellOf(alpha, 'builder'));
  assert.ok(classes(build).includes('lit') && !classes(build).includes('idle'));
  assert.deepEqual(slotFacts(build), { id: '0101', title: 'Paint the shed', time: '12 min', agent: 'Claude Code', model: 'Opus 4.5', effort: 'high', why: 'Level deep' });
  assert.equal(agentOf(build), 'claude');
  assert.equal(byClass(build, 'slot-stripe').length, 1, 'a stripe in the agent\'s colour');
  assert.deepEqual(slotFacts(second), { id: '0102', title: 'Mend the gate', time: '2 h 5 min', agent: 'Cursor', model: 'default model', effort: null, why: 'Ticket\'s own' }, 'an agent given no effort shows none');
  assert.equal(agentOf(second), 'cursor');
  const [review] = slotsOf(cellOf(alpha, 'reviewer'));
  assert.deepEqual(slotFacts(review), { id: '0103', title: 'Sweep the yard', time: 'under 1 min', agent: 'Claude Code', model: 'its own default', effort: 'default effort', why: 'Stands in for Codex' });
  assert.equal(agentOf(review), 'claude');
  const [qa] = slotsOf(cellOf(alpha, 'qa'));
  assert.deepEqual(slotFacts(qa), { id: '0104', title: 'Check the lights', time: null, agent: 'Codex', model: 'gpt-5', effort: 'medium', why: 'Settings' }, 'a check still to run has no time there yet');
  assert.equal(agentOf(qa), 'codex');
  const [other] = slotsOf(cellOf(rowsOf(p)[1], 'builder'));
  assert.equal(agentOf(other), 'other', 'a model provider gets a colour of its own, not a status colour');
  assert.equal(textOf(other, 'slot-agent'), 'Local LLM');
});

test('0766 AC2: an id, title or model the summary gives oddly is shown as text, never as markup, and a station with nothing usable stays idle', async () => {
  const odd = lineOf({ work: [{ id: '<b>9</b>', title: '<img src=x onerror=alert(1)>', station: 'builder', agent: '__proto__', agent_name: null, model: null, effort: null, why: 'nonsense', since: 'not a time' }, null, 'junk'] });
  const p = await open([lineAnswer({ alpha: odd })]);
  const [s, ...more] = slotsOf(cellOf(rowsOf(p)[0], 'builder'));
  assert.equal(more.length, 0, 'what isn\'t a ticket is left out');
  assert.equal(textOf(s, 'slot-id'), '<b>9</b>');
  assert.equal(textOf(s, 'slot-title'), '<img src=x onerror=alert(1)>');
  assert.equal(agentOf(s), 'other');
  assert.equal(textOf(s, 'slot-time'), null);
  assert.equal(textOf(s, 'slot-why'), null);
  assert.ok(nodes(p.byId('line')).every(n => !('innerHTML' in n)), 'no markup is set');
  const unknown = { agent: null, agent_name: null, model: null, model_slug: null, effort: null };
  const q = await open([lineAnswer({ alpha: lineOf({ work: [], idle: { builder: unknown, reviewer: unknown, qa: { ...unknown, set_up: null } } }) })]);
  assert.deepEqual(['builder', 'reviewer', 'qa'].map(c => slotsOf(cellOf(rowsOf(q)[0], c)).map(n => n.textContent)), [['Not known'], ['Not known'], ['Not known']],
    'a station whose agent its panel couldn\'t read says so');
});

// ---------- AC3: idle stations, QA not set up, Queue and Ship ----------

test('0766 AC3: an idle station shows, dimmed, the agent and model it would use, and QA in a project with no QA set up says so', async () => {
  const p = await open([lineAnswer()]);
  const bravo = rowsOf(p)[1];
  const [rev, ...more] = slotsOf(cellOf(bravo, 'reviewer'));
  assert.equal(more.length, 0);
  assert.ok(classes(rev).includes('idle') && !classes(rev).includes('lit'));
  assert.equal(agentOf(rev), 'codex');
  assert.equal(textOf(rev, 'slot-agent'), 'Codex');
  assert.equal(textOf(rev, 'slot-model'), 'default model');
  assert.equal(textOf(rev, 'slot-id'), null, 'no ticket');
  const [qa] = slotsOf(cellOf(bravo, 'qa'));
  assert.ok(classes(qa).includes('none'));
  assert.equal(qa.textContent, 'No QA set up');
  const charlie = rowsOf(p)[2];
  assert.equal(textOf(cellOf(charlie, 'queue'), 'line-empty'), 'No line from this project', 'a project not answering has none to show');
  assert.deepEqual(['builder', 'reviewer', 'qa', 'ship'].map(c => slotsOf(cellOf(charlie, c)).length), [0, 0, 0, 0]);
});

test('0766 AC3: Queue shows the ready count and the next ids, and Ship the tickets waiting there, marking those that wait for you', async () => {
  const p = await open([lineAnswer()]);
  const [alpha, bravo] = rowsOf(p);
  assert.equal(textOf(cellOf(alpha, 'queue'), 'queue-n'), '5');
  assert.equal(textOf(cellOf(alpha, 'queue'), 'queue-next'), 'Next 0110 · 0111 · 0112');
  assert.equal(textOf(cellOf(bravo, 'queue'), 'queue-n'), '0');
  assert.equal(textOf(cellOf(bravo, 'queue'), 'queue-next'), 'Nothing ready');
  const ship = byClass(cellOf(alpha, 'ship'), 'ship-item');
  assert.deepEqual(ship.map(s => [textOf(s, 'ship-id'), textOf(s, 'ship-title'), textOf(s, 'ship-mark'), classes(s).includes('yours')]), [
    ['0120', 'Ready to go', 'Waits for you', true], ['0121', 'On its way', 'Shipping', false], ['0122', 'In the queue', null, false]]);
  assert.equal(textOf(cellOf(bravo, 'ship'), 'line-empty'), 'Nothing to ship');
});

// ---------- AC4: idle and off projects ----------

test('0766 AC4: a project that is idle has a faint line, one whose speck run is off is dimmed, and one not answering too', async () => {
  const p = await open([lineAnswer()]);
  const looks = rowsOf(p).map(r => ['idle', 'off'].filter(c => classes(r).includes(c)));
  assert.deepEqual(looks, [[], ['idle'], ['off']]);
  const asleep = await open([lineAnswer({ alpha: lineOf(), alphaMood: 'asleep' })]);
  assert.deepEqual(['idle', 'off'].filter(c => classes(rowsOf(asleep)[0]).includes(c)), ['off'], 'speck run off: dimmed, though work is on its line');
});

test('0766 AC4: the line keeps up with each answer, and the time at a station moves on with the clock', async () => {
  let now = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
  const p = floorPage([lineAnswer(), lineAnswer({ bravo: lineOf({ work: [run('0201', 'builder', { since: minutesAgo(1) })] }) })], { Date: Clock });
  await p.settle();
  assert.equal(textOf(slotsOf(cellOf(rowsOf(p)[0], 'builder'))[0], 'slot-time'), '12 min');
  now += 3 * 60000;
  const poll = [...p.intervals.values()].find(i => i.ms <= 5000);
  poll.fn();
  await p.settle();
  assert.equal(textOf(slotsOf(cellOf(rowsOf(p)[1], 'builder'))[0], 'slot-id'), '0201', 'bravo\'s new build');
  assert.equal(textOf(slotsOf(cellOf(rowsOf(p)[1], 'builder'))[0], 'slot-time'), '4 min');
  assert.deepEqual(['idle', 'off'].filter(c => classes(rowsOf(p)[1]).includes(c)), [], 'no longer idle');
});

test('0766 AC4: the line sits in a box of its own that scrolls sideways, so the page doesn\'t', async () => {
  const css = fs.readFileSync(new URL('../templates/floor.css', import.meta.url), 'utf8');
  assert.match(css, /\.line-box\s*\{[^}]*overflow-x:\s*auto/);
  const html = fs.readFileSync(new URL('../templates/floor.html', import.meta.url), 'utf8'), tag = /<div id="line"[^>]*>/.exec(html)[0];
  assert.match(tag, /class="line-box"/);
  assert.match(tag, /tabindex="0"/, 'its box can be scrolled from the keyboard');
});

test('0766: before the first answer the line says it\'s reading, and with no projects it\'s empty', async () => {
  const p = floorPage([new Promise(() => {})], { Date: stoppedClock(NOW) });
  await p.settle();
  assert.equal(p.byId('line').textContent, 'Reading your projects…');
  const q = await open([{ stations: [], chosen: null, board_name: null }]);
  assert.equal(q.byId('line').textContent, '');
  const r = await open([lineAnswer({ alpha: null })]);
  assert.equal(textOf(cellOf(rowsOf(r)[0], 'queue'), 'line-empty'), 'No line from this project', 'a summary with no line, as an older speck gives');
});
