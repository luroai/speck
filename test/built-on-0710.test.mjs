import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0710: a ticket started on another ticket's approved work (0674), when that ticket is then cancelled.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket } from '../scripts/speck.mjs';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { builtOnWaiting } from '../scripts/built-on.mjs';
import { cancelOnBase } from '../scripts/cancelled-build.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { readyAgain } from '../scripts/build-records.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { T, boardPage } from './support/panel.mjs';
import { gitEnv } from './support/run.mjs';
import { builtOnRepo, speckIn, gitIn, startedAt, commitFile, approve } from './support/built-on.mjs';

const cfg = { base_branch: 'main', branch_prefix: 'speck/' };
Object.assign(process.env, gitEnv); // cancelOnBase commits in this process
const ticketIn = (dir, id) => {
  for (const sub of ['', 'done']) {
    const d = path.join(dir, 'speck', 'tickets', sub);
    const f = fs.existsSync(d) && fs.readdirSync(d).find(n => n.startsWith(`${id}-`));
    if (f) return parseTicket(fs.readFileSync(path.join(d, f), 'utf8'));
  }
  return null;
};

// 0002 approved, 0001 started on it with b.txt of its own and approved, then 0002 cancelled on its own branch, as a
// build cancels it, and on the base branch too when `onBase`, as speck run then does (0686).
function cancelledBase({ onBase = false, approved = true } = {}) {
  const r = builtOnRepo();
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  const first = startedAt(res);
  commitFile(first, 'b.txt', 4);
  if (approved) approve(first, '0001');
  const file = path.join(r.second, 'speck', 'tickets', '0002-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: approved/m, 'status: cancelled').replace(/^---\n/, '---\ncancel_reason: "not needed"\n'));
  gitIn(r.second, 'commit', '-qam', 'speck(0002): cancelled');
  if (onBase) assert.equal(cancelOnBase(r.dir, cfg, '0002'), 'cancelled');
  return { ...r, first };
}

const WAYS = [/speck built-on 0001 --rebuild/, /speck built-on 0001 --keep/];

test('0710 AC1 AC2: speck ship refuses, saying the ticket it was built on was cancelled, with the two ways on, never to ship that ticket first', () => {
  for (const onBase of [false, true]) {
    const r = cancelledBase({ onBase });
    const before = gitIn(r.dir, 'rev-parse', 'main');
    const res = speckIn(r.dir, 'ship', '0001');
    assert.notEqual(res.status, 0, res.stdout);
    assert.match(res.stderr, /built on ticket 0002, which was cancelled/);
    for (const w of WAYS) assert.match(res.stderr, w);
    assert.match(res.stderr, /rebuild it from main/);
    assert.match(res.stderr, /reviewed as 0001's own/);
    assert.doesNotMatch(res.stderr, /Ship 0002 first|hasn't shipped/);
    assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(gitIn(r.dir, 'rev-parse', 'main'), before, 'nothing shipped');
  }
});

test('0710 AC2: --rebuild sets it ready on the base branch without the cancelled ticket in after:, drops its branch, and it starts again from the base branch', () => {
  const r = cancelledBase({ onBase: true });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ session: 's', started: new Date().toISOString() }));
  const res = speckIn(r.dir, 'built-on', '0001', '--rebuild');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(readyAgain(r.dir, runs, { id: '0001', path: 'speck/tickets/0001-t.md' }), true, 'speck run launches it again');
  assert.match(res.stdout, /ready again/);
  assert.equal(gitIn(r.dir, 'branch', '--list', 'speck/0001-*'), '', 'its branch is gone');
  assert.equal(fs.existsSync(r.first), false, 'its worktree is gone');
  const t = ticketIn(r.dir, '0001');
  assert.equal(t.fm.status, 'ready');
  assert.deepEqual(t.fm.after, []);
  assert.equal(gitIn(r.dir, 'status', '--porcelain', '--', 'speck/tickets'), '', 'committed');
  const again = speckIn(r.dir, 'start', '0001');
  assert.equal(again.status, 0, again.stderr);
  const at = startedAt(again);
  assert.equal(fs.existsSync(path.join(at, 'a.txt')), false, 'not on the cancelled ticket\'s work');
  assert.equal(String(ticketIn(at, '0001').fm.built_on ?? ''), '');
});

test('0710 AC2: --keep makes the cancelled ticket\'s work its own, sends it back to review with the whole change, and it ships once approved again', () => {
  const r = cancelledBase();
  const res = speckIn(r.dir, 'built-on', '0001', '--keep');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /review/);
  const t = ticketIn(r.first, '0001');
  assert.equal(String(t.fm.built_on ?? ''), '');
  assert.deepEqual(t.fm.after, []);
  assert.equal(gitIn(r.first, 'status', '--porcelain'), '', 'committed on its branch');
  assert.match(speckIn(r.first, 'next', '0001').stdout, /review/);
  const diff = speckIn(r.first, 'diff', '0001');
  assert.equal(diff.status, 0, diff.stderr);
  assert.match(diff.stdout, /was cancelled/);
  for (const f of ['a.txt', 'b.txt']) assert.match(diff.stdout, new RegExp(`\\+\\+\\+ b/${f.replace('.', '\\.')}`), f);
  assert.notEqual(speckIn(r.dir, 'ship', '0001').status, 0, 'not before a review round has looked at it');
  approve(r.first, '0001');
  const ship = speckIn(r.dir, 'ship', '0001');
  assert.equal(ship.status, 0, ship.stderr);
  for (const f of ['a.txt', 'b.txt']) assert.ok(gitIn(r.dir, 'ls-tree', '--name-only', 'main', f), f);
});

test('0710 AC2: speck built-on refuses, changing nothing, when the ticket it was built on wasn\'t cancelled or the options are wrong', () => {
  const r = builtOnRepo();
  const first = startedAt(speckIn(r.dir, 'start', '0001'));
  commitFile(first, 'b.txt', 2);
  approve(first, '0001');
  const head = gitIn(first, 'rev-parse', 'HEAD');
  for (const args of [['0001', '--keep'], ['0001', '--rebuild'], ['0001'], ['0001', '--keep', '--rebuild'], ['0002', '--keep']]) {
    const res = speckIn(r.dir, 'built-on', ...args);
    assert.notEqual(res.status, 0, args.join(' '));
    assert.doesNotMatch(res.stderr, /\n\s+at /, args.join(' '));
  }
  assert.match(speckIn(r.dir, 'built-on', '0001', '--keep').stderr, /hasn't been cancelled/);
  assert.equal(gitIn(first, 'rev-parse', 'HEAD'), head, 'nothing committed');
  assert.ok(fs.existsSync(first));
});

test('0710 AC3: auto-ship and speck status say so, and the ticket isn\'t shown as shipping after the cancelled one', () => {
  const r = cancelledBase();
  const res = speckIn(r.dir, 'ship', '0001', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /built on ticket 0002, which was cancelled/);
  for (const w of WAYS) assert.match(res.stderr, w);
  assert.doesNotMatch(res.stderr, /speck-ship|hasn't shipped/);
  const st = JSON.parse(speckIn(r.dir, 'status', '--json').stdout);
  const t = [].concat(st.tickets ?? st).find(x => String(x.id) === '0001');
  assert.equal(t.ships_after, null);
  assert.equal(t.built_on_cancelled, '0002');
  assert.equal(t.auto_ship, false);
  assert.match(t.auto_ship_why, /which was cancelled/);
  const text = speckIn(r.dir, 'status').stdout;
  assert.match(text, /built on ticket 0002, which was cancelled/);
  assert.doesNotMatch(text, /ships after 0002/);
  // speck run's ship queue says the same, once, and doesn't ship it.
  const said = [], launches = [];
  const q = shipQueue(r.dir, cfg, { say: l => said.push(l), launch: (repo, id) => launches.push(id) });
  q.check(st.tickets ?? st); q.check(st.tickets ?? st);
  const lines = said.filter(l => l.startsWith('0001'));
  assert.equal(lines.length, 1, said.join('\n'));
  assert.match(lines[0], /which was cancelled/);
  for (const w of WAYS) assert.match(lines[0], w);
  assert.doesNotMatch(lines[0], /waits to ship after/);
  assert.deepEqual(launches, []);
});

test('0710 AC3: the panel shows it as needing you, not as shipping after the cancelled ticket', async () => {
  const started = new Date(Date.now() - 600000).toISOString();
  const row = T('0802', 'approved', { started, built_on: '0801', ships_after: null, built_on_cancelled: '0801', auto_ship: false, auto_ship_why: 'ticket 0802 was built on ticket 0801, which was cancelled, so it can\'t ship as it is', build_exit: { code: 0, at: started } });
  const p = boardPage([{ run: { on: true }, ideas: [], tickets: [T('0801', 'cancelled'), row] }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) });
  await p.settle();
  const text = p.byId('queue').textContent;
  assert.doesNotMatch(text, /ships after 0801/);
  const s = projectSummary({ board: { tickets: [row] }, foreman: { word: 'Idle', tone: 'idle', fixing: 'tell', blocked: [], agent: { asks: [] } }, run: { on: true } });
  assert.equal(s.needs_you, 1);
});

test('0710 AC4: a ticket built on one still approved, or done, is handled as today', () => {
  const r = builtOnRepo();
  const first = startedAt(speckIn(r.dir, 'start', '0001'));
  commitFile(first, 'b.txt', 2);
  approve(first, '0001');
  const on = builtOnWaiting(r.dir, cfg, ticketIn(first, '0001').fm);
  assert.equal(on.id, '0002');
  assert.equal(on.cancelled, false);
  const res = speckIn(r.dir, 'ship', '0001');
  assert.match(res.stderr, /hasn't shipped yet/);
  assert.doesNotMatch(res.stderr, /cancelled/);
  assert.match(autoShipWhyNot({ ...cfg, auto_ship: true, auto_ship_risk: ['low'] }, '0001', 'low', [], 'code', false, false, '', [], '0002'), /which hasn't shipped/);
  assert.equal(speckIn(r.dir, 'ship', '0002').status, 0);
  assert.equal(builtOnWaiting(r.dir, cfg, ticketIn(first, '0001').fm), null);
  assert.equal(speckIn(r.dir, 'ship', '0001').status, 0);
});

test('0710 AC2: the brief and speck help name speck built-on', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  for (const c of ['`speck built-on <id> --rebuild`', '`speck built-on <id> --keep`']) assert.ok(brief.includes(c), c);
  assert.match(speckIn(process.cwd(), 'help').stdout, /speck built-on <id> --rebuild\|--keep/);
});
