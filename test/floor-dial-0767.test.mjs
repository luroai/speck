import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0767: Virgil's dial on the factory floor, beside the line: the engineering manager drawn large in the busiest mood
// among the projects, a count of everything that needs you and a line for each, which opens that ticket in its
// project's panel at the same address. Checked on fakePage's DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { floorPage, summary, storage } from './support/floor.mjs';
import { nodes, classes, byClass, textOf } from './support/floor-line.mjs';

const KEYS = ['a1a1a1a1a1a1', 'b2b2b2b2b2b2', 'c3c3c3c3c3c3', 'd4d4d4d4d4d4'];
const station = (n, name, o = {}) => ({ ...summary(), key: KEYS[n - 1], n, name, port: 4800 + n, running: true, shipped_days: new Array(14).fill(0), ...o });
const need = (id, why, o = {}) => ({ id, title: `Ticket ${id}`, why, detail: '', ...o });

// alpha focused with nothing for you, bravo asking with a question and a ticket at Ship, charlie asking about its full
// suite, and delta not answering, its last summary asking (which mustn't count).
const answer = () => ({
  stations: [
    station(1, 'alpha', { mood: 'focused', busy: true, building: 1 }),
    station(2, 'bravo', { mood: 'asking', needs_you: 2, needs: [need('0201', 'question', { detail: 'Which colour?' }), need('0202', 'ship')] }),
    station(3, 'charlie', { mood: 'asking', needs_you: 1, needs: [need('', 'full_suite', { title: 'Full suite fails on main' })] }),
    { key: KEYS[3], n: 4, name: 'delta', port: null, running: false, shipped_days: null, mood: 'asking', needs_you: 5, needs: [need('0401', 'question')] },
  ],
  chosen: KEYS[0], board_name: null });

const quiet = () => ({ stations: [station(1, 'alpha', { mood: 'watching' }), station(2, 'bravo', { mood: 'focused', busy: true })], chosen: KEYS[0], board_name: null });

async function open(answers) {
  const assigned = [], session = storage();
  const p = floorPage(answers, { location: { assign: url => assigned.push(url) }, sessionStorage: session });
  await p.settle();
  return Object.assign(p, { assigned, session });
}
const dial = p => p.byId('dial');
const faceOf = p => nodes(dial(p)).find(n => n.tagName === 'svg' && (n.attrs || {}).class === 'speck-face');
const lines = p => byClass(dial(p), 'need-line');
const lineFacts = b => ({ project: textOf(b, 'need-project'), id: textOf(b, 'need-id'), why: textOf(b, 'need-why') });
const tick = async p => { for (const { fn } of p.intervals.values()) fn(); await p.settle(); };

// ---------- AC1: Virgil, large, in the busiest mood, inside rings, beside the line ----------

test('0767 AC1: the dial sits beside the line, after it and before the stations', () => {
  const html = fs.readFileSync(new URL('../templates/floor.html', import.meta.url), 'utf8');
  const top = html.indexOf('class="floor-top"'), line = html.indexOf('id="line"'), d = html.indexOf('id="dial"'), stations = html.indexOf('id="stations"');
  assert.ok(top > 0 && top < line && line < d && d < stations, 'the line and the dial share one row, ahead of the stations');
  const css = fs.readFileSync(new URL('../templates/floor.css', import.meta.url), 'utf8');
  assert.match(css, /\.floor-top \{[^}]*grid-template-columns: minmax\(0, 1fr\) \d+px/, 'side by side on a wide window');
});

test('0767 AC1: Virgil is drawn by SpeckFace as the manager, at 120 px or more, inside a dial of rings', async () => {
  const p = await open([answer()]);
  const face = faceOf(p);
  assert.ok(face, 'a face in the dial');
  assert.equal(face.attrs['data-role'], undefined, 'not a member\'s face');
  assert.match(face.attrs['aria-label'], /^Manager, /, 'drawn as the manager');
  assert.ok(+face.attrs.width >= 120 && +face.attrs.height >= 120, `at ${face.attrs.width} px`);
  const rings = nodes(dial(p)).find(n => (n.attrs || {}).class === 'dial-rings');
  assert.ok(rings, 'the dial\'s rings');
  assert.ok(nodes(rings).filter(n => n.tagName === 'circle').length >= 2, 'more than one ring');
  assert.equal(byClass(dial(p), 'dial')[0].children.at(-1).children[0], face, 'Virgil inside the dial, over its rings');
});

test('0767 AC1: the mood is the busiest among the projects that answer, as All projects works it out', async () => {
  const p = await open([answer(), quiet(), { stations: [{ key: KEYS[0], n: 1, name: 'alpha', port: null, running: false, shipped_days: null, mood: 'asking' }], chosen: KEYS[0], board_name: null }, { stations: [], chosen: null, board_name: null }]);
  const face = faceOf(p);
  assert.equal(face.attrs['data-mood'], 'asking', 'asking beats focused');
  await tick(p);
  assert.equal(faceOf(p), face, 'the same face, its mood changed');
  assert.equal(face.attrs['data-mood'], 'focused', 'focused beats watching');
  await tick(p);
  assert.equal(face.attrs['data-mood'], 'asleep', 'a project not answering doesn\'t count, so with none answering it\'s asleep');
  await tick(p);
  assert.equal(face.attrs['data-mood'], 'asleep', 'and with no projects');
});

// ---------- AC2: the count, and a line for each that opens it ----------

test('0767 AC2: under Virgil, a large count of all that needs you across the projects, and a line for each with its project, id and why', async () => {
  const p = await open([answer()]);
  const d = dial(p), count = byClass(d, 'dial-count')[0];
  assert.ok(d.children.indexOf(count) > d.children.indexOf(byClass(d, 'dial')[0]), 'the count is under Virgil');
  assert.equal(textOf(d, 'dial-n'), '3', 'bravo\'s 2 and charlie\'s 1; delta isn\'t answering');
  assert.ok(classes(count).includes('some'));
  assert.deepEqual(lines(p).map(lineFacts), [
    { project: 'bravo', id: '0201', why: 'Question' },
    { project: 'bravo', id: '0202', why: 'At Ship' },
    { project: 'charlie', id: null, why: 'Full suite fails' },
  ]);
  assert.equal(byClass(d, 'dial-none').length, 0);
  assert.equal(lines(p)[0].tagName, 'button');
});

test('0767 AC2: a line opens its ticket in its project\'s panel at the same address', async () => {
  const p = await open([answer(), { ok: true }]);
  p.press(lines(p)[1]);
  await p.settle();
  const call = p.calls.at(-1);
  assert.equal(call.url, 'api/projects/4802', 'chooses bravo\'s panel at this address');
  assert.equal(call.opts.method, 'POST');
  assert.deepEqual(JSON.parse(p.session.getItem('speck-open-ticket')), { port: 4802, id: '0202' }, 'kept for bravo\'s page to open, as All projects keeps it');
  assert.deepEqual(p.assigned, ['project/'], 'then goes to where the address shows the project chosen');
});

test('0767 AC2: a line with no ticket opens its project, with no ticket kept for it', async () => {
  const p = await open([answer(), { ok: true }]);
  p.session.setItem('speck-open-ticket', JSON.stringify({ port: 1, id: 'old' }));
  p.press(lines(p)[2]);
  await p.settle();
  assert.equal(p.calls.at(-1).url, 'api/projects/4803');
  assert.equal(p.session.getItem('speck-open-ticket'), null);
  assert.deepEqual(p.assigned, ['project/']);
});

test('0767 AC2: when the address refuses to show the project, the dial says why and nothing opens', async () => {
  const p = await open([answer(), { status: 404, body: { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' } }]);
  p.press(lines(p)[0]);
  await p.settle();
  assert.deepEqual(p.assigned, []);
  assert.equal(p.session.getItem('speck-open-ticket'), null, 'no ticket left for a later page');
  assert.equal(textOf(dial(p), 'dial-said'), 'Couldn\'t open bravo: That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.');
});

// ---------- AC3: nothing needs you ----------

test('0767 AC3: with nothing needing you, the count is 0 and a line says nothing needs you', async () => {
  const p = await open([quiet()]);
  assert.equal(textOf(dial(p), 'dial-n'), '0');
  assert.ok(!classes(byClass(dial(p), 'dial-count')[0]).includes('some'));
  assert.equal(textOf(dial(p), 'dial-none'), 'Nothing needs you.');
  assert.equal(lines(p).length, 0);
});

test('0767 AC3: before the first answer, the count isn\'t 0 and nothing is said to need nothing', async () => {
  const p = floorPage([new Promise(() => {})], { location: { assign() {} }, sessionStorage: storage() });
  await p.settle();
  assert.equal(textOf(dial(p), 'dial-n'), '–');
  assert.equal(byClass(dial(p), 'dial-none').length, 0);
});
