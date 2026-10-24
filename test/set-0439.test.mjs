// 0439: speck set and the panel refuse to change a done ticket's status, so shipped work stays shipped.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, fm } from './support/panel.mjs';
import { shipRepo } from './support/ship.mjs';
import { panelSetReady, panelBackToPlan } from '../scripts/panel.mjs';

const DONE = /Ticket 0002 is done and shipped, so its status can't change\./;

// A panel repo with a done 0002 committed in speck/tickets/done/.
function doneRepo() {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', status: 'done' }), undefined, 'speck/tickets/done');
  r.g('add', '-A'); r.g('commit', '-qm', 'done 0002');
  const file = path.join(r.dir, 'speck', 'tickets', 'done', '0002-two.md');
  const snapshot = () => ({ head: r.g('rev-parse', 'HEAD'), status: r.g('status', '--porcelain', '--untracked-files=all'), text: fs.readFileSync(file, 'utf8') });
  return { ...r, file, snapshot };
}

for (const value of ['ready', 'draft', 'blocked', 'building', 'approved', 'done']) {
  test(`0439 AC1: speck set <id> status ${value} refuses a done ticket and changes nothing`, () => {
    const r = doneRepo();
    const before = r.snapshot();
    const res = r.run('set', '2', 'status', value);
    assert.notEqual(res.status, 0, res.stdout);
    assert.match(res.stderr, DONE);
    assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
    assert.deepEqual(r.snapshot(), before, 'the ticket stays in speck/tickets/done/ as done, with nothing committed');
    assert.match(before.text, /^status: done\b/m);
    assert.ok(!fs.existsSync(path.join(r.dir, 'speck', 'tickets', '0002-two.md')));
  });
}

test('0439 AC2: the panel\'s Set ready and Back to Plan refuse a done ticket with speck set\'s message', () => {
  const r = doneRepo();
  const before = r.snapshot();
  for (const write of [panelSetReady, panelBackToPlan]) {
    const out = write(r.dir, '2');
    assert.equal(out.status, 422, `${write.name}: ${JSON.stringify(out)}`);
    assert.match(out.body.error, DONE, write.name);
    assert.deepEqual(r.snapshot(), before, `${write.name} changed nothing`);
  }
});

test('0439 AC3: status changes on a ticket that isn\'t done work as before, including setting it done and back', () => {
  const r = panelRepo();
  const open = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  const done = path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md');
  for (const value of ['draft', 'blocked', 'ready']) {
    const res = r.run('set', '1', 'status', value);
    assert.equal(res.status, 0, res.stderr);
    assert.match(fs.readFileSync(open, 'utf8'), new RegExp(`^status: ${value}\\b`, 'm'));
  }
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.ok(fs.existsSync(done) && !fs.existsSync(open), 'speck set still files a ticket set done in speck/tickets/done/');
});

test('0439 AC3: speck ship still sets a ticket done and files it in speck/tickets/done/, after which speck set refuses it', () => {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  const file = path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md');
  assert.match(fs.readFileSync(file, 'utf8'), /^status: done\b/m);
  const set = r.run('set', '1', 'status', 'ready');
  assert.notEqual(set.status, 0);
  assert.match(set.stderr, /Ticket 0001 is done and shipped, so its status can't change\./);
  assert.match(fs.readFileSync(file, 'utf8'), /^status: done\b/m);
});
