import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { statusData } from '../scripts/speck.mjs';
import { afterWait, clashTips } from '../scripts/built-on.mjs';
import { markStillReady, clashWaited, clashOf } from '../scripts/build-records.mjs';
import { builtOnRepo, speckIn, gitIn, startedAt, commitFile } from './support/built-on.mjs';
import { T, boardPage, queueRows, fullViewOf } from './support/panel.mjs';

// ---------- 0737: wait to start a dependent build when the approved work it would start on clashes with main ----------

const shown = (r, id) => statusData(r.dir).tickets.find(t => t.id === id);
const cfg = { base_branch: 'main', branch_prefix: 'speck/' };

// builtOnRepo, with a.txt committed on main differently from 0002's approved a.txt, so 0002's work clashes with main.
function clashing() {
  const r = builtOnRepo();
  commitFile(r.dir, 'a.txt', 5);
  return r;
}
// 0002 marked done on main, as its ship leaves it: its file moved to done/ with status done.
function shipped(r) {
  const from = path.join(r.dir, 'speck', 'tickets', '0002-t.md'), to = path.join(r.dir, 'speck', 'tickets', 'done', '0002-t.md');
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replace(/^status: \w+/m, 'status: done'));
  fs.rmSync(from);
  gitIn(r.dir, 'add', '-A', '--', 'speck/tickets');
  gitIn(r.dir, 'commit', '-qm', 'speck(0002): ship');
  gitIn(r.dir, 'worktree', 'remove', '--force', r.second);
  gitIn(r.dir, 'branch', '-D', gitIn(r.dir, 'branch', '--list', '--format=%(refname:short)', 'speck/0002-*'));
}

test('0737 AC1: a ready ticket waiting on approved work that clashes with main gets no starts_on, and speck run holds it back', () => {
  const r = clashing();
  const t = shown(r, '0001');
  assert.equal(t.starts_on, null);
  assert.deepEqual(t.start_clash, { id: '0002', base: 'main' });
  assert.ok(afterWait(t), 'speck run waits for it');
});

test('0737 AC1: speck start refuses it, saying it waits for that ticket to ship, and leaves no branch', () => {
  const r = clashing();
  const res = speckIn(r.dir, 'start', '0001');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /0001 waits for 0002 to ship, as 0002's approved work clashes with main/);
  assert.equal(gitIn(r.dir, 'branch', '--list', 'speck/0001-*'), '');
  assert.equal(shown(r, '0001').status, 'ready');
});

test('0737 AC1: once that ticket has shipped, it starts from main as usual, not on its work', () => {
  const r = clashing();
  shipped(r);
  const t = shown(r, '0001');
  assert.equal(t.start_clash, null);
  assert.equal(afterWait(t), null);
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /Started on ticket/);
  const ticket = fs.readFileSync(path.join(startedAt(res), 'speck', 'tickets', '0001-t.md'), 'utf8');
  assert.doesNotMatch(ticket, /^built_on:/m);
});

test('0737 AC2: while it waits, what speck run says of it names the ticket and says its approved work clashes with main', () => {
  const r = clashing();
  assert.equal(afterWait(shown(r, '0001')), 'waiting for 0002 to ship, as its approved work clashes with main');
});

const started = new Date(Date.now() - 600000).toISOString();
const show = async tickets => { const p = boardPage([{ run: { on: true }, ideas: [], tickets }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const rowOf = (p, id) => queueRows(p).find(row => p.all(row).find(c => c.className === 'id')._text === id);
const whereOf = (p, id) => p.all(rowOf(p, id)).find(c => /^where\b/.test(c.className));
const clashTickets = () => [T('0801', 'approved', { started, auto_ship: true, build_exit: { code: 0, at: started } }),
  T('0802', 'ready', { after: ['0801'], waiting_on: ['0801'], starts_on: null, start_clash: { id: '0801', base: 'main' } })];

test('0737 AC2: the panel\'s row says it waits for that ticket to ship because its approved work clashes with main', async () => {
  const p = await show(clashTickets());
  assert.equal(whereOf(p, '0802').textContent, 'Ready · waits for 0801 to ship: its approved work clashes with main');
});

test('0737 AC2: and its full view says so, naming the ticket', async () => {
  const p = await show(clashTickets());
  const view = await fullViewOf(p, '0802');
  assert.match(view.textContent, /Waits for 0801 to ship, as its approved work clashes with main\./);
  assert.doesNotMatch(view.textContent, /Can start on/);
});

test('0737 AC3: a build that ended unstarted on clashing work is started again once the clash has moved, without being set ready again', () => {
  const r = clashing();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const t = { id: '0001', path: 'speck/tickets/0001-t.md' };
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: 1, exited: '2026-11-24T10:00:00.000Z', exit_code: 0 }));
  const then = clashTips(r.dir, cfg, '0002');
  markStillReady(runs, '0001', gitIn(r.dir, 'log', '-1', '--format=%H', '--', t.path), clashOf(shown(r, '0001')), then);
  assert.equal(clashWaited(runs, t, () => clashTips(r.dir, cfg, '0002')), false, 'nothing has moved yet');
  shipped(r);
  assert.notEqual(clashTips(r.dir, cfg, '0002'), then);
  assert.equal(clashWaited(runs, t, () => clashTips(r.dir, cfg, '0002')), true);
});

test('0737 AC3: the reason is read from the status row, or from speck start\'s refusal in the build\'s log, and only there', () => {
  assert.equal(clashOf({ start_clash: { id: '0729', base: 'main' } }), '0729');
  assert.equal(clashOf({}, "Ticket 0729's approved work doesn't merge cleanly with main, so 0730 can't start on it."), '0729');
  assert.equal(clashOf({}, "Ticket 0730 waits for 0729 to ship, as 0729's approved work clashes with main."), '0729');
  for (const [row, log] of [[null, ''], [{}, 'it ended'], [{ start_clash: 'x' }, ''], [{ start_clash: { id: 7 } }, '']]) assert.equal(clashOf(row, log), null, JSON.stringify(row));
});

test('0737 AC3: a build that ended unstarted for another reason, or that speck stop ended, isn\'t started again by this', () => {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'speck-0737-'));
  const t = { id: '0001' }, file = path.join(dir, '0001.json');
  fs.writeFileSync(file, JSON.stringify({ id: '0001', session: 's', pid: 1, exited: 'x' }));
  markStillReady(dir, '0001', 'abc');
  assert.equal(clashWaited(dir, t, 'new'), false, 'no clash kept');
  markStillReady(dir, '0001', 'abc', '0002', 'old');
  assert.equal(clashWaited(dir, t, 'new'), true);
  fs.writeFileSync(file.replace(/\.json$/, '.stopped'), JSON.stringify({ session: 's', pid: 1 }));
  assert.equal(clashWaited(dir, t, 'new'), false, 'ended by speck stop');
  fs.writeFileSync(file, '{ not json');
  assert.equal(clashWaited(dir, t, 'new'), false, 'unreadable');
});

test('0737 AC4: when the approved work merges cleanly into main, the ticket starts on it as today', () => {
  const r = builtOnRepo();
  commitFile(r.dir, 'other.txt', 2); // main has moved on, without touching 0002's files
  const t = shown(r, '0001');
  assert.equal(t.starts_on, '0002');
  assert.equal(t.start_clash, null);
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Started on ticket 0002's approved work/);
});
