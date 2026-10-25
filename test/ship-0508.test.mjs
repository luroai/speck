import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gIn } from './support/ship.mjs';
import { shipState } from '../scripts/ship.mjs';

// ---------- 0508: clear a not-pushed warning once its ticket is on the remote ----------

const ticket = (id, status) => `---\nid: "${id}"\ntitle: "T"\nstatus: ${status}\n---\n# ${id} · T\n`;
const GONE = 'deadbeef'.repeat(5); // a commit id that no longer exists in the repo

// A repo whose ship record for 0001 says it merged `sha` but couldn't push. `remote` lists the files the remote's copy of
// main has, as git last fetched it, or is null for a repo with no copy of the remote's main.
function repo({ remote, sha = GONE }) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0508-')));
  const g = (...a) => { const r = gIn(dir, ...a); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  g('init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'a\n');
  g('add', 'a.txt');
  g('commit', '-qm', 'first');
  const first = g('rev-parse', 'HEAD');
  if (remote) {
    g('checkout', '-q', '-b', 'remote-side');
    for (const [file, text] of Object.entries(remote)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), text);
      g('add', file);
    }
    g('commit', '-qm', 'on the remote', '--allow-empty');
    g('update-ref', 'refs/remotes/origin/main', 'HEAD');
    g('checkout', '-q', 'main');
    g('branch', '-qD', 'remote-side');
    for (const file of Object.keys(remote)) fs.rmSync(path.join(dir, file), { force: true });
  }
  // A local commit that never reached the remote.
  fs.writeFileSync(path.join(dir, 'b.txt'), 'b\n');
  g('add', 'b.txt');
  g('commit', '-qm', 'local only');
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const shas = { gone: GONE, first, local: g('rev-parse', 'HEAD') };
  fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({
    pid: 999999, started: '2026-10-22T10:00:00.000Z', ended: '2026-10-22T10:01:00.000Z', message: 'Merged locally, but pushing main to origin failed',
    unpushed: { remote: 'origin', base: 'main', sha: shas[sha] ?? sha },
  }));
  return { dir, runs };
}
const done = { 'speck/tickets/done/0001-export-bookings.md': ticket('0001', 'done') };

test('0508 AC1: the warning clears when the remote has the ticket as done, though its recorded commit no longer exists', () => {
  const { runs } = repo({ remote: done });
  assert.equal(shipState(runs, '1'), null);
  assert.equal(shipState(runs, '0001'), null);
});

test('0508 AC1: so it does when the recorded commit exists but never reached the remote', () => {
  const { runs } = repo({ remote: done, sha: 'local' });
  assert.equal(shipState(runs, '1'), null);
});

test('0508 AC2: the warning shows when the remote has neither the commit nor the ticket as done', () => {
  for (const remote of [
    {},
    { 'speck/tickets/0001-export-bookings.md': ticket('0001', 'done') },
    { 'speck/tickets/done/0001-export-bookings.md': ticket('0001', 'approved') },
    { 'speck/tickets/done/0010-other.md': ticket('0010', 'done'), 'speck/tickets/done/10001-other.md': ticket('10001', 'done') },
    { 'speck/tickets/done/0001-export-bookings.txt': ticket('0001', 'done') },
    { 'speck/tickets/done/0001-export-bookings.md': 'no frontmatter\n' },
  ]) {
    for (const sha of ['gone', 'local']) {
      const s = shipState(repo({ remote, sha }).runs, '1');
      assert.equal(s?.unpushed, true, `${JSON.stringify(Object.keys(remote))} with the ${sha} commit`);
      assert.match(s.message, /Merged locally/);
    }
  }
});

test('0508 AC2: with no copy of the remote\'s base branch, it shows as today', () => {
  for (const sha of ['gone', 'local']) assert.equal(shipState(repo({ remote: null, sha }).runs, '1')?.unpushed, true);
});

test('0508 AC3: a record whose commit has reached the remote clears as today', () => {
  assert.equal(shipState(repo({ remote: {}, sha: 'first' }).runs, '1'), null);
});
