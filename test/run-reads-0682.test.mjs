// 0682: speck run's checks read only the ticket files that changed since the last one, and each at most once per check.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runRepo, fm, good, startRun, waitFor, stopRun } from './support/run.mjs';
import { statusData, ticketShown } from '../scripts/speck.mjs';
import { findTicket, listTickets } from '../scripts/core.mjs';

// Counts the ticket files read while `fn` runs, by their path, by watching fs.readFileSync as core.mjs calls it.
function reads(fn) {
  const seen = [], real = fs.readFileSync;
  fs.readFileSync = function (file, ...rest) {
    if (typeof file === 'string' && /[\\/]speck[\\/]tickets[\\/](done[\\/])?\d{4}-[^\\/]*\.md$/.test(file)) seen.push(file);
    return real.call(this, file, ...rest);
  };
  try { return { result: fn(), seen }; } finally { fs.readFileSync = real; }
}
const ticketText = (id, o = {}) => `---\n${fm({ id: `"${id}"`, ...o })}\n---\n${good}`;
const statusOf = (board, id) => board.tickets.find(t => t.id === id)?.status;

test('0682 AC1: a check after nothing changed reads and parses no ticket file', () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'done' }], ['0003', { status: 'draft' }]] });
  const first = reads(() => statusData(dir));
  assert.equal(first.seen.length, 3, 'the first check reads each ticket once');
  const second = reads(() => statusData(dir));
  assert.deepEqual(second.seen, [], 'nothing changed, so nothing is read');
  assert.deepEqual(second.result.tickets.map(t => [t.id, t.status]), first.result.tickets.map(t => [t.id, t.status]));
});

test('0682 AC1: a ticket that changed, appeared or went is read on the next check, in the main checkout', () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]] });
  const tickets = path.join(dir, 'speck', 'tickets');
  statusData(dir);
  fs.writeFileSync(path.join(tickets, '0001-t.md'), ticketText('0001', { status: 'ready' }));
  let r = reads(() => statusData(dir));
  assert.deepEqual(r.seen.map(f => path.basename(f)), ['0001-t.md']);
  assert.equal(statusOf(r.result, '0001'), 'ready');
  // The same size and a rewrite straight after: still seen as changed.
  fs.writeFileSync(path.join(tickets, '0001-t.md'), ticketText('0001', { status: 'draft' }).replace('draft', 'blokd'));
  r = reads(() => statusData(dir));
  assert.equal(statusOf(r.result, '0001'), 'blokd');
  fs.writeFileSync(path.join(tickets, '0003-t.md'), ticketText('0003', { status: 'ready' }));
  r = reads(() => statusData(dir));
  assert.deepEqual(r.seen.map(f => path.basename(f)), ['0003-t.md']);
  assert.equal(statusOf(r.result, '0003'), 'ready');
  fs.rmSync(path.join(tickets, '0002-t.md'));
  r = reads(() => statusData(dir));
  assert.deepEqual(r.seen, []);
  assert.equal(statusOf(r.result, '0002'), undefined, 'a ticket that went is gone from the board');
  // Moved to done/ under the same name: read from its new place.
  fs.mkdirSync(path.join(tickets, 'done'), { recursive: true });
  fs.renameSync(path.join(tickets, '0003-t.md'), path.join(tickets, 'done', '0003-t.md'));
  fs.writeFileSync(path.join(tickets, 'done', '0003-t.md'), ticketText('0003', { status: 'done' }));
  r = reads(() => statusData(dir));
  assert.deepEqual(r.seen.map(f => path.relative(tickets, f)), [path.join('done', '0003-t.md')]);
  assert.equal(statusOf(r.result, '0003'), 'done');
});

test('0682 AC1: a ticket that changed in a build\'s worktree is read on the next check', () => {
  const { dir, g } = runRepo({ tickets: [['0001', { status: 'ready' }], ['0002', { status: 'draft' }]] });
  const wt = `${dir}-wt-0001`;
  g('worktree', 'add', '-q', '-b', 'speck/0001-t', wt);
  const there = path.join(wt, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(there, ticketText('0001', { status: 'building' }));
  let r = reads(() => statusData(dir));
  assert.equal(statusOf(r.result, '0001'), 'building', 'read from the worktree its branch is in');
  r = reads(() => statusData(dir));
  assert.deepEqual(r.seen, [], 'nothing changed in either checkout');
  fs.writeFileSync(there, ticketText('0001', { status: 'reviewing' }));
  r = reads(() => statusData(dir));
  assert.deepEqual(r.seen, [there]);
  assert.equal(statusOf(r.result, '0001'), 'reviewing');
  assert.equal(ticketShown(dir, '0001').status, 'reviewing');
  g('worktree', 'remove', '--force', wt);
  r = reads(() => statusData(dir));
  assert.equal(statusOf(r.result, '0001'), 'ready', 'once the worktree has gone, the main checkout\'s copy is shown again');
});

test('0682 AC1: a ticket file speck can\'t parse isn\'t read again until it changes, and says why each time', () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const file = path.join(dir, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(file, 'no frontmatter here\n');
  assert.throws(() => statusData(dir), /no frontmatter/);
  const r = reads(() => assert.throws(() => statusData(dir), /no frontmatter/));
  assert.deepEqual(r.seen, []);
  fs.writeFileSync(file, ticketText('0001', { status: 'ready' }));
  assert.equal(statusOf(statusData(dir), '0001'), 'ready');
});

test('0682 AC2: within one check, each ticket file is read at most once however many steps need the tickets', () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]] });
  statusData(dir);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0002-t.md'), ticketText('0002', { status: 'ready' }));
  // The steps of a check: the board, each step's own look at one ticket's status, and the tickets themselves.
  const r = reads(() => {
    statusData(dir); statusData(dir);
    findTicket(dir, '0002'); findTicket(dir, '0001');
    listTickets(dir); ticketShown(dir, '0002');
    return statusData(dir);
  });
  assert.deepEqual(r.seen.map(f => path.basename(f)), ['0002-t.md']);
  assert.equal(statusOf(r.result, '0002'), 'ready');
});

test('0682 AC2: a step that changes what it was given doesn\'t change what the next step reads', () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'draft' }]] });
  const t = findTicket(dir, '0001');
  t.raw = 'changed'; t.file = 'elsewhere';
  const again = findTicket(dir, '0001');
  assert.notEqual(again.raw, 'changed');
  assert.match(again.file, /0001-t\.md$/);
});

test('0682 AC3: speck run still starts a ticket set ready on a check after idle ones, and takes up a change to its config', async () => {
  const { dir, g, calls, cfgFile } = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]] });
  const run = startRun(dir);
  try {
    await waitFor(() => /watching for ready tickets/.test(run.out()), 'speck run to start watching', run.out);
    await new Promise(r => setTimeout(r, 300)); // a few idle checks, at 100 ms each
    fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0001-t.md'), ticketText('0001', { status: 'ready' }));
    g('commit', '-qam', 'ready 0001');
    await waitFor(() => calls().some(c => c.args[0] === '0001'), 'the build of 0001', run.out);
    // build_command now marks its builds, which the next build started shows.
    fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/(build_command: ".*?)\{id\}/, '$1marked {id}'));
    g('commit', '-qam', 'config');
    fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0002-t.md'), ticketText('0002', { status: 'ready' }));
    g('commit', '-qam', 'ready 0002');
    await waitFor(() => calls().some(c => c.args[0] === 'marked' && c.args[1] === '0002'), 'the build of 0002 with the new build_command', run.out);
  } finally {
    await stopRun(run);
  }
});
