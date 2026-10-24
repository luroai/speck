import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { agentView } from '../scripts/foreman-agent.mjs';
import { T } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';
import { building, board, speckPage, shows } from './support/screen-speck.mjs';

// ---------- 0446: speck skips its events from while the panel was hidden ----------

const W = { word: 'Building 2' };
const start = () => board([...building(), T('0364', 'reviewing')], W);
const ships = board([T('0362', 'done'), T('0363', 'building'), T('0364', 'reviewing')], { word: 'Building 1' });
const blocks = board([T('0362', 'done'), T('0363', 'blocked'), T('0364', 'reviewing')], { word: 'Needs you 1' });
const asks = board([T('0362', 'done'), T('0363', 'blocked'), T('0364', 'approved', { auto_ship: false })], { word: 'Needs you 1' });

// The page on a stream the test drives: `send()` hears the next board, `hide()` and `show()` hide the page and show it.
function page(boards) {
  const { EventSource, sources } = manualSources();
  const p = speckPage(boards, { globals: { EventSource } });
  let v = 0;
  p.send = async () => { sources[sources.length - 1].emit('message', String(++v)); await p.settle(); };
  const vis = async state => { p.document.visibilityState = state; p.document.listeners.visibilitychange({}); await p.settle(); };
  p.hide = () => vis('hidden');
  p.show = async () => { await vis('visible'); sources[sources.length - 1].emit('open'); };
  p.sources = sources;
  return p;
}

test('0446 AC1: of the events while the page was hidden, only the latest plays when it comes back, then speck shows the pipeline', async () => {
  const p = page([start(), ships, blocks, asks]);
  await p.send();
  shows(p, 'watch', 'WATCHING 2 BUILDS');
  await p.hide();
  await p.send(); p.go(5000);
  await p.send(); p.go(5000);
  await p.send(); p.go(30000);
  await p.show();
  shows(p, 'flag', '0364 IS READY TO SHIP');
  p.go(5800);
  shows(p, 'flag', '0364 IS READY TO SHIP');
  p.go(400);
  shows(p, 'ask', '1 NEEDS YOU'); // neither the ship nor the question before it plays
  p.go(60000);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC1: an event from a minute or more before the page came back doesn\'t play', async () => {
  const p = page([start(), ships, blocks]);
  await p.send();
  await p.hide();
  await p.send(); p.go(5000);
  await p.send(); p.go(60000);
  await p.show();
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC1: one 59 seconds old still plays', async () => {
  const p = page([start(), ships]);
  await p.send();
  await p.hide();
  await p.send(); p.go(59000);
  await p.show();
  shows(p, 'celebrating', '0362 SHIPPED');
});

test('0446 AC1: the changes in the first board after the page comes back, when it heard nothing while hidden, play only the latest', async () => {
  const p = page([start(), asks]);
  await p.send();
  await p.hide();
  p.go(20000); // asleep: no board came
  await p.show();
  await p.send(); // the board, with a ship, a question and an approval since
  shows(p, 'flag', '0364 IS READY TO SHIP');
  p.go(6200);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC1: none of them plays when the last board before was a minute or more before the page came back', async () => {
  const p = page([start(), asks]);
  await p.send();
  await p.hide();
  p.go(8 * 3600000); // a night asleep
  await p.show();
  await p.send();
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC1: an event kept when the page came back gives way to the later changes in the next board', async () => {
  const p = page([start(), ships, asks]);
  await p.send();
  await p.hide();
  await p.send(); p.go(10000); // the ship, heard while hidden
  await p.show();
  await p.send(); // then the question and the approval, on the new stream
  shows(p, 'flag', '0364 IS READY TO SHIP');
  p.go(6200);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC2: while the page stays visible, every event plays, one after another', async () => {
  const p = page([start(), ships, blocks, asks]);
  await p.send();
  await p.send(); await p.send(); await p.send();
  shows(p, 'celebrating', '0362 SHIPPED');
  p.go(6100);
  shows(p, 'ask', '0363 HAS A QUESTION');
  p.go(6100);
  shows(p, 'flag', '0364 IS READY TO SHIP');
  p.go(6100);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC2: after the page has been hidden and shown, events play as before', async () => {
  const p = page([start(), start(), ships, blocks]);
  await p.send();
  await p.hide();
  await p.show();
  await p.send(); // the same board on the new stream
  await p.send(); await p.send();
  shows(p, 'celebrating', '0362 SHIPPED');
  p.go(6100);
  shows(p, 'ask', '0363 HAS A QUESTION');
});

// When the board says each change happened: `ms` after the test's clock started.
const AT = ms => new Date(Date.parse('2026-10-23T12:00:00Z') + ms).toISOString();
const H8 = 8 * 3600000;

test('0446 AC1: after a night asleep, a ship the board dates 10 seconds before the page came back plays', async () => {
  const p = page([start(), board([T('0362', 'done', { finished: AT(H8 - 10000) }), T('0363', 'blocked', { blocked_at: AT(H8 - 3600000) }), T('0364', 'reviewing')], { word: 'Needs you 1' })]);
  await p.send();
  await p.hide();
  p.go(H8);
  await p.show();
  await p.send();
  shows(p, 'celebrating', '0362 SHIPPED'); // the latest by its date, not the question from an hour before
  p.go(6200);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0446 AC1: after a night asleep, a ship the board dates 2 minutes before the page came back doesn\'t play', async () => {
  const p = page([start(), board([T('0362', 'done', { finished: AT(H8 - 120000) }), T('0363', 'building'), T('0364', 'reviewing')], { word: 'Building 2' })]);
  await p.send();
  await p.hide();
  p.go(H8);
  await p.show();
  await p.send();
  shows(p, 'watch', 'WATCHING 2 BUILDS');
});

test('0446 AC1: an event heard while hidden that the board dates over a minute before the page came back doesn\'t play', async () => {
  const p = page([start(), board([T('0362', 'done', { finished: AT(0) }), T('0363', 'building'), T('0364', 'reviewing')], { word: 'Building 2' })]);
  await p.send();
  await p.hide();
  p.go(90000);
  await p.send(); // heard now, but it shipped 90 seconds ago
  p.go(1000);
  await p.show();
  shows(p, 'watch', 'WATCHING 2 BUILDS');
});

test('0446 AC2: a change the first board after a night asleep dates from after the page came back plays as usual, after the one missed', async () => {
  const p = page([start(), board([T('0362', 'done', { finished: AT(H8 - 5000) }), T('0363', 'blocked', { blocked_at: AT(H8 - 4000) }),
    T('0364', 'approved', { auto_ship: false, approved: AT(H8 + 5000) })], { word: 'Needs you 1' })]);
  await p.send();
  await p.hide();
  p.go(H8);
  await p.show();
  p.go(10000); // the board comes 10 seconds later
  await p.send();
  shows(p, 'ask', '0363 HAS A QUESTION'); // the latest missed, not the ship before it
  p.go(6100);
  shows(p, 'flag', '0364 IS READY TO SHIP'); // approved after the page came back
  p.go(6100);
  shows(p, 'ask', '1 NEEDS YOU');
});

const looking = started => board([...building(), T('0364', 'reviewing')], { agent: { running: { id: '0363', what: 'its ship was refused', started }, waiting: [], did: [], asks: [] } });

test('0446 AC1: after a night asleep, the Foreman starting to look into a ticket 10 seconds before the page came back plays', async () => {
  const p = page([start(), looking(AT(H8 - 10000))]);
  await p.send();
  await p.hide();
  p.go(H8);
  await p.show();
  await p.send();
  shows(p, 'confused', 'LOOKING INTO 0363');
});

test('0446 AC2: the Foreman starting to look into a ticket after the page came back, before its first board, plays as usual', async () => {
  const p = page([start(), looking(AT(H8 + 3000))]);
  await p.send();
  await p.hide();
  p.go(H8);
  await p.show();
  p.go(10000);
  await p.send();
  shows(p, 'confused', 'LOOKING INTO 0363');
});

test('0446 AC1: the Foreman agent\'s board says when it started looking into a ticket', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0446-'));
  fs.writeFileSync(path.join(runs, 'run.foreman-agent.json'), JSON.stringify({ running: { id: '0363', token: 't', pid: null, key: 'k', what: 'its ship was refused', started: '2026-10-24T08:00:00.000Z' } }));
  assert.deepEqual(agentView(runs, []).running, { id: '0363', what: 'its ship was refused', started: '2026-10-24T08:00:00.000Z' });
});
