import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0186: the panel shows "Disconnected" only when it really can't reach the panel, never because an answer was slow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, deferred, T } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';

const board = status => ({ tickets: [T('0001', status)], ideas: [] });
const asked = p => p.calls.filter(c => c.url === '/api/state');
const ok = body => ({ ok: true, status: 200, json: async () => body });
// The page's wait of `ms` still running, or undefined.
const waitOf = (p, ms) => [...p.waits.values()].find(w => w.ms === ms);
// A fake page on a stream the test drives, already showing the ready board.
async function opened(responses) {
  const { EventSource, sources } = manualSources();
  const p = fakePage([board('ready'), ...responses], { EventSource });
  sources[0].emit('open'); sources[0].emit('message', '1');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  return { p, s: sources[0] };
}

test('0186 AC1: a slow answer is waited for, with no other request for the board, and isn\'t a disconnection', async () => {
  const slow = deferred();
  const { p, s } = await opened([slow, board('blocked')]);
  s.emit('message', '2');
  await p.settle();
  assert.equal(asked(p).length, 2);
  for (const v of ['3', '4']) s.emit('message', v); // announced while it waits, as the page's 2-second refreshes were
  s.emit('ping', '1');
  await p.settle();
  assert.equal(asked(p).length, 2, 'no other request while one is waiting');
  assert.equal(asked(p)[1].opts.signal.aborted, false, 'the waiting one isn\'t given up');
  assert.equal(p.byId('offline').hidden, true, 'not shown as disconnected');
  slow.resolve(ok(board('building')));
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  assert.equal(asked(p).length, 3, 'then the latest board announced meanwhile, once');
  assert.equal(asked(p)[2].opts.headers['X-Speck-Board'], '4');
  assert.match(p.byId('queue').textContent, /0001/);
});

test('0186 AC1: the page waits up to 15 seconds for an answer, then gives it up and asks again at the next keep-alive', async () => {
  const never = deferred();
  const { p, s } = await opened([never, board('ready')]);
  s.emit('message', '2');
  await p.settle();
  assert.ok(waitOf(p, 15000), 'a 15-second limit on the request');
  assert.equal(asked(p)[1].opts.signal.aborted, false);
  await p.elapse(15000);
  assert.equal(asked(p)[1].opts.signal.aborted, true, 'given up after 15 seconds');
  s.emit('ping', '1');
  await p.settle();
  assert.equal(asked(p).length, 3, 'asked again');
  assert.equal(asked(p)[2].opts.headers['X-Speck-Board'], '2');
  assert.equal(p.byId('offline').hidden, true);
});

test('0186 AC1: an answer that comes back in time calls off its 15-second limit', async () => {
  const { p, s } = await opened([board('blocked')]);
  s.emit('message', '2');
  await p.settle();
  assert.equal(waitOf(p, 15000), undefined);
  assert.equal(waitOf(p, 10000), undefined);
});

test('0186 AC2: "Disconnected" shows once there\'s been no answer for 10 seconds, and goes as soon as one arrives', async () => {
  const slow = deferred();
  const { p, s } = await opened([slow]);
  s.emit('message', '2');
  await p.settle();
  assert.ok(waitOf(p, 10000), 'a 10-second wait for an answer');
  assert.equal(p.byId('offline').hidden, true, 'nothing before then');
  await p.elapse(10000);
  assert.equal(p.byId('offline').hidden, false, 'after 10 seconds with no answer');
  assert.match(p.byId('offline').textContent, /^Disconnected: can't reach speck panel\./);
  slow.resolve(ok(board('building')));
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'gone as soon as the answer arrives');
});

test('0186 AC2: failed requests show nothing until 10 seconds have passed without a board', async () => {
  const { p, s } = await opened([new Error('blip'), new Error('blip'), board('ready')]);
  s.emit('message', '2');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'one failure shows nothing');
  s.emit('ping', '1');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'nor a second');
  await p.elapse(10000);
  assert.equal(p.byId('offline').hidden, false, '10 seconds without a board');
  assert.match(p.byId('offline').textContent, /^Disconnected: can't reach speck panel\./);
  s.emit('ping', '1');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'gone with the next board');
  assert.equal(waitOf(p, 10000), undefined, 'and the wait called off');
});

test('0186 AC3: one failed reading of the board shows no notice', async () => {
  const { p, s } = await opened([{ status: 500, body: { error: 'Ticket 0002 has no frontmatter.' } }, board('blocked')]);
  s.emit('message', '2');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'no notice for one failed reading');
  s.emit('message', '3');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  assert.equal(waitOf(p, 10000), undefined, 'the next reading worked, so nothing is waiting to show');
});

test('0186 AC3: readings that fail for 10 seconds in a row show the notice, with the reason', async () => {
  const bad = { status: 500, body: { error: 'Ticket 0002 has no frontmatter.' } };
  const { p, s } = await opened([bad, bad, board('blocked')]);
  s.emit('message', '2');
  await p.settle();
  s.emit('message', '3');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  await p.elapse(10000);
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /couldn't read the tickets: Ticket 0002 has no frontmatter\./);
  s.emit('message', '4');
  await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'gone once it reads');
});
