// 0338: a ticket whose auto-ship didn't finish is red only when nothing in speck run will carry it on.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { statusData } from '../scripts/speck.mjs';
import { fakePage, T, round, queueRows, panelModel, isRed, findText, panelRepo } from './support/panel.mjs';

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const MESSAGE = 'Tests failed on the approved branch, so nothing was shipped.';
const SHIP_IT = 'Ship it from its review pack, or run /speck-ship 0001';
const WORKING = 'Handed back to its build, which is working on it';
const AGAIN = 'It will be shipped again when main or its branch has a new commit';
// 0001 approved, its auto-ship ended a minute ago without shipping, and handed back to its build 30 seconds ago.
const failed = (o = {}) => T('0001', 'approved', { started: ago(3600), approved: ago(600), auto_ship: true, rounds: [round(1, 1)],
  ship: { running: false, auto: true, started: ago(300), ended: ago(60), message: MESSAGE }, handed_back: ago(30), ...o });
const running = o => failed({ build_running: true, ...o });
const ended = o => failed({ build_running: false, build_exit: { at: ago(10), code: 0, message: 'Stopped: main is failing.' }, ...o });
const state = (tickets, on = true) => ({ tickets, ideas: [], run: { on } });

const row = p => queueRows(p).find(r => r.textContent.includes('0001'));
async function shown(s) {
  const p = fakePage([s]);
  await p.settle();
  const r = row(p);
  return { p, r, red: [r, ...p.all(r)].some(isRed), has: text => !!findText(p, r, text) };
}

test('0338 AC1: handed back and its build running, it isn\'t red, has no Ship hint and says its build is working on it', async () => {
  for (const s of [state([running()]), state([running()], false)]) { // speck run running the build, on or off
    const m = panelModel()(s).queue[0];
    assert.equal(m.red, false);
    assert.equal(m.ship_hint, null);
    assert.equal(m.carried_by, WORKING);
    const v = await shown(s);
    assert.equal(v.red, false, 'nothing red');
    assert.ok(!v.has(SHIP_IT), 'no Ship hint');
    assert.ok(v.has(WORKING), 'says it was handed back');
  }
});

test('0338 AC2: its build ended, speck run on and another ticket on its way, it isn\'t red and says it will be shipped again', async () => {
  for (const status of ['ready', 'building', 'reviewing', 'approved']) {
    const s = state([ended(), T('0002', status)]);
    const m = panelModel()(s).queue.find(t => t.id === '0001');
    assert.equal(m.red, false, status);
    assert.equal(m.ship_hint, null, status);
    assert.equal(m.carried_by, AGAIN, status);
    const v = await shown(s);
    assert.equal(v.red, false, `nothing red, with another ${status}`);
    assert.ok(!v.has(SHIP_IT), 'no Ship hint');
    assert.ok(v.has(AGAIN), 'says it will be shipped again');
  }
});

test('0338 AC3: red with the Ship hint when speck run is off, nothing else is on its way, or it\'s blocked', async () => {
  const cases = {
    'speck run off': state([ended(), T('0002', 'ready')], false),
    'no other ticket': state([ended()]),
    'only done, draft and blocked others': state([ended(), T('0002', 'done'), T('0003', 'draft'), T('0004', 'blocked')]),
  };
  for (const [name, s] of Object.entries(cases)) {
    const m = panelModel()(s).queue.find(t => t.id === '0001');
    assert.equal(m.red, true, name);
    assert.equal(m.ship_hint, SHIP_IT, name);
    assert.equal(m.carried_by, null, name);
    const v = await shown(s);
    assert.equal(v.red, true, name);
    assert.ok(v.has(SHIP_IT), name);
  }
  const blocked = T('0001', 'blocked', { started: ago(3600), blocked_question: 'Which one?', handed_back: ago(30), build_running: false,
    ship: { running: false, auto: true, started: ago(300), ended: ago(60), message: MESSAGE } });
  for (const s of [state([blocked, T('0002', 'ready')]), state([{ ...blocked, build_running: true }, T('0002', 'ready')])]) {
    const m = panelModel()(s).queue.find(t => t.id === '0001');
    assert.equal(m.red, true, 'blocked');
    assert.equal(m.carried_by, null, 'blocked');
  }
});

test('0338 AC3: a hand-back from before the failed ship doesn\'t count', async () => {
  const s = state([ended({ handed_back: ago(400) }), T('0002', 'ready')]);
  const m = panelModel()(s).queue.find(t => t.id === '0001');
  assert.equal(m.red, true);
  assert.equal(m.ship_hint, SHIP_IT);
  assert.equal(m.carried_by, null);
});

test('0338 AC4: the failed ship\'s own message is still shown in every case', async () => {
  const cases = [state([running()]), state([ended(), T('0002', 'ready')]), state([ended(), T('0002', 'ready')], false), state([ended()])];
  for (const s of cases) {
    assert.equal(panelModel()(s).queue.find(t => t.id === '0001').exit_message, MESSAGE);
    const v = await shown(s);
    assert.ok(v.has(MESSAGE), 'the message shows');
  }
});

test('0338 AC1: speck status --json gives handed_back from the build\'s run record', () => {
  const { dir } = panelRepo();
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  const status = () => statusData(dir).tickets.find(t => t.id === '0001');
  assert.equal(status().handed_back, null, 'no run record');
  fs.mkdirSync(runs, { recursive: true });
  const at = new Date().toISOString();
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ session: 's', pid: 1, handed_back: at, hand_backs: 1 }));
  assert.equal(status().handed_back, at);
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ session: 's', handed_back: 'not a time' }));
  assert.equal(status().handed_back, null, 'not a time');
  fs.writeFileSync(path.join(runs, '0001.json'), '[1]');
  assert.equal(status().handed_back, null, 'not an object');
});
