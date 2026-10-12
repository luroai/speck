// 0139: a build is timed up to its approval, not its ship.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, round, panelModel, panelRepo, fakePage, queueRows, shippedRows } from './support/panel.mjs';
import { parseTicket } from '../scripts/speck.mjs';

const NOW = Date.parse('2026-10-12T22:00:00.000Z');
const iso = ms => new Date(ms).toISOString();
const ago = m => iso(NOW - m * 60000);
// The page's clock, moved by the test.
const clock = start => {
  const c = { now: start };
  c.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [c.now])); } static now() { return c.now; } };
  return c;
};
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const subOf = (p, id) => p.all(rowOf(p, id)).find(n => n.className === 'sub');
const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;

test('0139 AC1: setting a ticket approved records approved: in the same format as started, and a later approval replaces it', async () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(fmOf(r.file).approved, undefined, 'no approved before it is approved');
  assert.equal(r.run('set', '1', 'status', 'approved').status, 0);
  const first = fmOf(r.file);
  assert.match(String(first.started), ISO);
  assert.match(String(first.approved), ISO, 'the same format as started');
  assert.ok(Date.parse(first.approved) >= Date.parse(first.started));
  await new Promise(res => setTimeout(res, 20));
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  assert.equal(fmOf(r.file).approved, first.approved, 'leaving approved keeps the time');
  assert.equal(r.run('set', '1', 'status', 'approved').status, 0);
  const again = fmOf(r.file);
  assert.ok(Date.parse(again.approved) > Date.parse(first.approved), 'the latest approval');
  assert.equal(fs.readFileSync(r.file, 'utf8').match(/^approved:/gm).length, 1, 'one approved line');
  assert.equal(again.started, first.started, 'started stays');
});

test('0139 AC2: an approved ticket\'s timer shows started to approved and stops; building and reviewing ones count on', async () => {
  const c = clock(NOW);
  const state = { tickets: [
    T('0001', 'approved', { started: ago(89), approved: ago(83), rounds: [round(1, 100)] }),
    T('0002', 'building', { started: ago(3) }),
    T('0003', 'reviewing', { started: ago(5), approved: ago(4), rounds: [round(1, 100)] }),
  ], ideas: [] };
  const p = fakePage([state], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '06:00');
  assert.equal(subOf(p, '0002').textContent, '03:00');
  assert.equal(subOf(p, '0003').textContent, '05:00', 'a reviewing ticket counts from started, whatever approved says');
  c.now += 7000;
  for (const { fn } of p.intervals.values()) fn();
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '06:00', 'the approved timer has stopped');
  assert.equal(subOf(p, '0002').textContent, '03:07');
  assert.equal(subOf(p, '0003').textContent, '05:07');
});

test('0139 AC2: with only approved tickets that have an approved time, no counter timer runs', async () => {
  const c = clock(NOW);
  const p = fakePage([{ tickets: [T('0001', 'approved', { started: ago(10), approved: ago(4) })], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '06:00');
  assert.equal(p.intervals.size, 0);
});

test('0139 AC3: a done ticket with started and approved shows started to approved, and the median uses it', async () => {
  const model = panelModel();
  const m = model({ tickets: [
    T('0128', 'done', { started: '2026-10-12T19:49:52.000Z', approved: '2026-10-12T19:55:37.000Z', finished: '2026-10-12T21:19:13.000Z', rounds: [round(1, 10)] }),
    T('0129', 'done', { started: ago(30), approved: ago(20), finished: ago(1), rounds: [round(1, 10)] }),
    T('0130', 'done', { started: ago(30), approved: ago(16), finished: ago(2), rounds: [round(1, 10)] }),
  ], ideas: [] });
  const by = id => m.shipped.find(t => t.id === id);
  assert.equal(by('0128').minutes, 6, 'not the 89 minutes to its ship');
  assert.equal(by('0129').minutes, 10);
  assert.equal(by('0130').minutes, 14);
  assert.equal(m.stats.minutes.median, 10);
  assert.equal(m.stats.minutes.count, 3);
  const p = fakePage([{ tickets: [T('0128', 'done', { started: '2026-10-12T19:49:52.000Z', approved: '2026-10-12T19:55:37.000Z', finished: '2026-10-12T21:19:13.000Z' })], ideas: [] }]);
  await p.settle();
  assert.ok(shippedRows(p).some(r => r.textContent.includes('6 min')), 'the Shipped row shows 6 min');
});

test('0139 AC4: a done ticket with no approved runs to finished; one with no started shows no time', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'done', { started: ago(40), finished: ago(10) }),
    T('0002', 'done', { approved: ago(20), finished: ago(5) }),
    T('0003', 'done', { started: ago(40), approved: 'not a date', finished: ago(20) }),
  ], ideas: [] });
  const by = id => m.shipped.find(t => t.id === id);
  assert.equal(by('0001').minutes, 30);
  assert.equal(by('0002').minutes, null);
  assert.equal(by('0003').minutes, 20, 'an unreadable approved counts as none');
  assert.equal(m.stats.minutes.count, 2);
});

test('0139 AC4: an approved time before started is ignored rather than giving a negative time', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'done', { started: ago(40), approved: ago(50), finished: ago(10) }),
    // The model section runs with the real clock, so this one's times are from now.
    T('0002', 'approved', { started: iso(Date.now() - 40 * 60000 - 300), approved: iso(Date.now() - 50 * 60000) }),
  ], ideas: [] });
  assert.equal(m.shipped[0].minutes, 30);
  assert.match(m.queue[0].counter, /^4\d:\d\d$/, 'it counts from started as before');
});
