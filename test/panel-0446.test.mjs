import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
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
