import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, good, startRepo } from './support/speck.mjs';
import { parseTicket } from '../scripts/core.mjs';

// ---------- 0681: set several tickets ready with one command ----------

// Three drafts, 0001 to 0003, committed on main. `broken` lists the ones left without acceptance criteria, so they
// fail the ready check.
function drafts({ broken = [] } = {}) {
  const r = startRepo({ ready: false });
  for (const title of ['Import bookings', 'Print bookings']) {
    const file = path.join(r.dir, r.run('new', title).stdout.trim());
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  }
  for (const n of broken) {
    const file = ticketFile(r, n);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/## Acceptance criteria\n1\. .*\n/, '## Acceptance criteria\n'));
  }
  r.g('add', 'speck');
  r.g('commit', '-qm', 'drafts');
  return r;
}
const ticketFile = (r, n) => {
  for (const dir of [path.join(r.dir, 'speck', 'tickets'), path.join(r.dir, 'speck', 'tickets', 'done')]) {
    const f = fs.readdirSync(dir).find(f => f.startsWith(`000${n}-`));
    if (f) return path.join(dir, f);
  }
};
const status = (r, n) => parseTicket(fs.readFileSync(ticketFile(r, n), 'utf8')).fm.status;
const subjects = r => r.g('log', '--format=%s').split('\n');

test('0681 AC1: several ids set each ticket ready, one commit each, in the order given', () => {
  const r = drafts();
  const res = r.run('set', '3', '1', '2', 'status', 'ready');
  assert.equal(res.status, 0, res.stderr);
  for (const n of [1, 2, 3]) assert.equal(status(r, n), 'ready');
  assert.deepEqual(subjects(r).slice(0, 4), ['speck(0002): ready', 'speck(0001): ready', 'speck(0003): ready', 'drafts']);
  for (const [rev, n] of [['HEAD', 2], ['HEAD~1', 1], ['HEAD~2', 3]]) {
    const files = r.g('show', '--name-only', '--format=', rev);
    assert.equal(files, path.relative(r.dir, ticketFile(r, n)).split(path.sep).join('/'), `the commit for 000${n} holds only its ticket`);
  }
  assert.equal(r.g('status', '--porcelain'), '');
});

test('0681 AC2: a ticket that fails the ready check, or is refused, is left and named; the rest are set; it fails', () => {
  const r = drafts({ broken: [2] });
  const before = fs.readFileSync(ticketFile(r, 2), 'utf8');
  const res = r.run('set', '1', '2', '9', '3', 'status', 'ready');
  assert.notEqual(res.status, 0);
  assert.equal(status(r, 1), 'ready');
  assert.equal(status(r, 3), 'ready');
  assert.equal(fs.readFileSync(ticketFile(r, 2), 'utf8'), before, '0002 is unchanged');
  assert.deepEqual(subjects(r).slice(0, 3), ['speck(0003): ready', 'speck(0001): ready', 'drafts']);
  assert.match(res.stderr, /^- 2: Not ready: it fails the ready check/m);
  assert.match(res.stderr, /^- 9: \S/m, 'a ticket that does not exist is named with the reason');
  assert.match(res.stderr, /Left 2 of 4 unchanged/);
  assert.doesNotMatch(res.stderr, /^- [13]:/m);
});

test('0681 AC2: a ticket refused for another reason, such as being done, is left and named', () => {
  const r = drafts();
  assert.equal(r.run('set', '2', 'status', 'done').status, 0);
  r.g('add', 'speck');
  r.g('commit', '-qm', 'done');
  const res = r.run('set', '1', '2', 'status', 'ready');
  assert.notEqual(res.status, 0);
  assert.equal(status(r, 1), 'ready');
  assert.equal(status(r, 2), 'done');
  assert.match(res.stderr, /^- 2: Ticket 0002 is done/m);
});

test('0681 AC3: several ids with any other field or value are refused with the usage line, and nothing changes', () => {
  const r = drafts();
  const head = r.g('rev-parse', 'HEAD');
  for (const args of [['priority', '2'], ['status', 'blocked'], ['status', 'ready', 'now'], ['status'], [], ['title', 'ready']]) {
    const res = r.run('set', '1', '2', ...args);
    assert.notEqual(res.status, 0, args.join(' '));
    assert.match(res.stderr, /Usage: speck set <id> <field> <value>, or speck set <id> <id>… status ready/, args.join(' '));
  }
  assert.equal(r.g('rev-parse', 'HEAD'), head);
  assert.equal(r.g('status', '--porcelain'), '');
  for (const n of [1, 2, 3]) assert.equal(status(r, n), 'draft');
});

test('0681 AC3: one id still takes any field, as before', () => {
  const r = drafts();
  assert.equal(r.run('set', '1', 'priority', '2').status, 0);
  assert.equal(r.run('set', '2', 'status', 'ready').status, 0);
  assert.equal(status(r, 2), 'ready');
});

test("0681 AC4: speck help and the brief's speck set row show the form", () => {
  const r = startRepo({ ready: false });
  assert.match(r.run('help').stdout, /speck set <id> <id>… status ready/);
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck set <id> <field> <value>`'));
  assert.ok(row, 'the brief has a speck set row');
  assert.match(row, /`speck set <id> <id>… status ready`/);
});
