// 0215: the review pack's elapsed time stops at approval, so time waiting to be shipped isn't counted.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewTotals } from '../scripts/pack.mjs';
import { setField } from '../scripts/core.mjs';
import { shipRepo } from './support/speck.mjs';

const MIN = 60000;
const ago = min => new Date(Date.now() - min * MIN).toISOString();
const elapsed = fm => reviewTotals({ fm }, []).elapsed;

test('0215 AC1: with started and approved, the line counts from started to approved, however long ago that was', () => {
  const started = ago(3 * 24 * 60);
  const at = n => new Date(Date.parse(started) + n * MIN).toISOString();
  assert.equal(elapsed({ started, approved: at(25) }), 'Elapsed since build started: 25 min');
  assert.equal(elapsed({ started, approved: at(25.6) }), 'Elapsed since build started: 26 min');
  assert.equal(elapsed({ started, approved: at(25.4) }), 'Elapsed since build started: 25 min');
});

test('0215 AC2: with started but no approved, the line counts from started to now', () => {
  assert.equal(elapsed({ started: ago(42) }), 'Elapsed since build started: 42 min');
  assert.equal(elapsed({ started: ago(42), approved: '' }), 'Elapsed since build started: 42 min');
  assert.equal(elapsed({ started: ago(42), approved: 'not a time' }), 'Elapsed since build started: 42 min');
});

test('0215 AC3: with no started, the line reads Elapsed: not recorded', () => {
  assert.equal(elapsed({}), 'Elapsed: not recorded');
  assert.equal(elapsed({ approved: ago(5) }), 'Elapsed: not recorded');
});

// shipRepo's approved ticket, sent back to reviewing with `started` and an earlier `approved` time.
function reapproveRepo({ started, approved }) {
  const r = shipRepo();
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  let text = fs.readFileSync(file, 'utf8');
  text = setField(setField(setField(text, 'started', started), 'approved', approved), 'status', 'reviewing');
  fs.writeFileSync(file, `${text}\n## Review log\n<!-- x -->\n\n## Delivery log\n<!-- x -->\n`);
  r.g('commit', '-qam', 'reviewing again');
  return { ...r, file, text: () => fs.readFileSync(file, 'utf8') };
}

test('0215 AC4: speck close counts to the moment of approval, not to an earlier approved time', () => {
  const r = reapproveRepo({ started: ago(40), approved: ago(30) });
  const res = r.run('close', '1');
  assert.equal(res.status, 0, res.stderr);
  const log = r.text().split('## Delivery log\n')[1];
  assert.match(log, /^- Elapsed since build started: 40 min$/m);
});

test('0215 AC1: speck pack reads the time up to approval, not up to when it is read', () => {
  const started = ago(3 * 24 * 60);
  const r = reapproveRepo({ started, approved: ago(60) });
  fs.writeFileSync(r.file, setField(setField(r.text(), 'status', 'approved'), 'approved', new Date(Date.parse(started) + 17 * MIN).toISOString()));
  r.g('commit', '-qam', 'approved long ago');
  const res = r.run('pack', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Elapsed since build started: 17 min\b/);
});
