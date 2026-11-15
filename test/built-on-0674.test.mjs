import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket } from '../scripts/speck.mjs';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { builtOnWaiting } from '../scripts/built-on.mjs';
import { builtOnRepo, speckIn, gitIn, startedAt, commitFile, approve, READY_OUTCOME } from './support/built-on.mjs';

// ---------- 0674: build a ticket on an approved ticket it waits for ----------

const ticketIn = (dir, id) => {
  for (const sub of ['', 'done']) {
    const d = path.join(dir, 'speck', 'tickets', sub);
    const f = fs.existsSync(d) && fs.readdirSync(d).find(n => n.startsWith(`${id}-`));
    if (f) return parseTicket(fs.readFileSync(path.join(d, f), 'utf8'));
  }
  return null;
};

// 0002 approved, 0001 started on it, with b.txt (`bLines` lines) of its own committed.
function startedOn(opts = {}) {
  const r = builtOnRepo(opts);
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  const first = startedAt(res);
  commitFile(first, 'b.txt', opts.bLines ?? 5);
  return { ...r, first };
}

test('0674 AC1: speck start starts a ticket whose one waiting after: ticket is approved, from that ticket\'s branch', () => {
  const r = builtOnRepo();
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  const at = startedAt(res);
  assert.ok(fs.existsSync(path.join(at, 'a.txt')), 'the approved ticket\'s work is there');
  assert.equal(gitIn(at, 'rev-parse', 'HEAD~1^1'), gitIn(r.dir, 'rev-parse', 'main'), 'made from the base branch');
  assert.equal(gitIn(at, 'rev-parse', 'HEAD~1^2'), gitIn(r.dir, 'rev-parse', 'speck/0002-t'), 'with that ticket\'s branch merged in');
  const t = ticketIn(at, '0001');
  assert.equal(t.fm.status, 'building');
  assert.match(t.raw, new RegExp(READY_OUTCOME), 'the ticket as it was set ready, not the older copy on 0002\'s branch');
  assert.equal(ticketIn(at, '0002').fm.status, 'approved');
  assert.equal(String(t.fm.built_on), '0002', 'it says which ticket it was built on');
  assert.equal(gitIn(at, 'log', '-1', '--format=%s'), 'speck(0001): start');
});

test('0674 AC1: with worktrees off, the branch also starts from the approved ticket\'s branch', () => {
  const r = builtOnRepo();
  fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(/^worktrees:.*$/m, 'worktrees: false'));
  gitIn(r.dir, 'commit', '-qam', 'no worktrees');
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(gitIn(r.dir, 'branch', '--show-current'), 'speck/0001-t');
  assert.ok(fs.existsSync(path.join(r.dir, 'a.txt')));
  assert.equal(String(ticketIn(r.dir, '0001').fm.built_on), '0002');
});

function refuses(r, id, patterns) {
  const before = gitIn(r.dir, 'branch', '--format=%(refname:short)');
  const res = speckIn(r.dir, 'start', id);
  assert.notEqual(res.status, 0, res.stdout);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  for (const p of patterns) assert.match(res.stderr, p);
  assert.equal(gitIn(r.dir, 'branch', '--format=%(refname:short)'), before, 'no branch made');
}

test('0674 AC1: an after: ticket still building or reviewing refuses as today', () => {
  for (const status of ['building', 'reviewing', 'blocked']) {
    const r = builtOnRepo({ status });
    refuses(r, '0001', [new RegExp(`0002 \\(${status}\\)`), /shipped/]);
  }
});

test('0674 AC1: two after: tickets not done refuses as today, even when both are approved', () => {
  const r = builtOnRepo({ tickets: [['0001', { after: '["0002", "0003"]' }], ['0002', {}], ['0003', {}]] });
  const res = speckIn(r.dir, 'start', '0003');
  const third = startedAt(res);
  commitFile(third, 'c.txt', 2);
  approve(third, '0003');
  refuses(r, '0001', [/0002 \(approved\)/, /0003 \(approved\)/, /shipped/]);
});

test('0674 AC1: an approved after: ticket with a cancelled one beside it refuses as today', () => {
  const r = builtOnRepo({ tickets: [['0001', { after: '["0002", "0003"]' }], ['0002', {}], ['0003', { status: 'cancelled' }]] });
  refuses(r, '0001', [/0003/, /cancelled/, /after:/]);
});

test('0674 AC1: an approved ticket whose work clashes with the base branch refuses, changing nothing', () => {
  const r = builtOnRepo();
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'main\'s own a.txt\n');
  gitIn(r.dir, 'add', 'a.txt');
  gitIn(r.dir, 'commit', '-qm', 'a.txt on main');
  const res = speckIn(r.dir, 'start', '0001');
  assert.notEqual(res.status, 0, res.stdout);
  assert.match(res.stderr, /0002/);
  assert.match(res.stderr, /shipped/);
  assert.doesNotMatch(res.stderr, /\n\s+at /);
  assert.equal(gitIn(r.dir, 'branch', '--list', 'speck/0001-*'), '', 'no branch left');
  assert.equal(fs.existsSync(`${r.dir}.worktrees/speck/0001-t`), false, 'no worktree left');
  assert.equal(ticketIn(r.dir, '0001').fm.status, 'ready');
});

test('0674 AC4: the brief names the built_on: field', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.match(brief, /`built_on:`/);
});

test('0674 AC2: speck diffstat counts only this ticket\'s own change while the one it was built on hasn\'t shipped', () => {
  const r = startedOn({ aLines: 40, bLines: 5 });
  const res = speckIn(r.first, 'diffstat');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /b\.txt/);
  assert.doesNotMatch(res.stdout, /a\.txt/);
  assert.match(res.stdout, /^5 changed lines/m);
});

test('0674 AC2: the review diff holds only this ticket\'s own change while the one it was built on hasn\'t shipped', () => {
  const r = startedOn();
  const res = speckIn(r.first, 'diff', '0001');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /b\.txt/);
  assert.doesNotMatch(res.stdout, /a\.txt/);
  const prompt = speckIn(r.first, 'prompt', '0001');
  assert.equal(prompt.status, 0, prompt.stderr);
  assert.match(prompt.stdout, /b\.txt/);
  assert.doesNotMatch(prompt.stdout, /a\.txt/);
});

test('0674 AC3: speck ship refuses while the ticket it was built on isn\'t done, naming it, with or without after:', () => {
  const r = startedOn();
  approve(r.first, '0001');
  const before = gitIn(r.dir, 'rev-parse', 'main');
  let res = speckIn(r.dir, 'ship', '0001');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /0002/);
  assert.doesNotMatch(res.stderr, /\n\s+at /);
  // The after: link taken out still refuses.
  const file = path.join(r.first, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^after: .*$/m, 'after: []'));
  gitIn(r.first, 'commit', '-qam', 'no after');
  res = speckIn(r.dir, 'ship', '0001');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /0002/);
  assert.equal(gitIn(r.dir, 'rev-parse', 'main'), before, 'nothing shipped');
  assert.equal(ticketIn(r.first, '0001').fm.status, 'approved');
});

test('0674 AC3: auto-ship leaves it approved with that reason, as exit 12, and speck status says so', () => {
  const r = startedOn();
  approve(r.first, '0001');
  const res = speckIn(r.dir, 'ship', '0001', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /built on ticket 0002/);
  const st = JSON.parse(speckIn(r.dir, 'status', '--json').stdout);
  const t = [].concat(st.tickets ?? st).find(x => String(x.id) === '0001');
  assert.equal(t.auto_ship, false);
  assert.match(t.auto_ship_why, /built on ticket 0002/);
  assert.equal(ticketIn(r.first, '0001').fm.status, 'approved');
});

test('0674 AC3: autoShipWhyNot gives the built-on reason first, and nothing for a ticket built on nothing waiting', () => {
  const cfg = { auto_ship: true, auto_ship_risk: ['low'] };
  assert.match(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, false, '', [], '0002'), /built on ticket 0002, which hasn't shipped/);
  assert.equal(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, false, '', [], ''), '');
});

test('0674 AC2 AC3: once the ticket it was built on has shipped, it ships as any other, and its diff is still its own', () => {
  const r = startedOn();
  approve(r.first, '0001');
  let res = speckIn(r.dir, 'ship', '0002');
  assert.equal(res.status, 0, res.stderr);
  const d = speckIn(r.first, 'diffstat');
  assert.doesNotMatch(d.stdout, /a\.txt/);
  assert.match(d.stdout, /b\.txt/);
  res = speckIn(r.dir, 'ship', '0001');
  assert.equal(res.status, 0, res.stderr);
  for (const f of ['a.txt', 'b.txt']) assert.ok(gitIn(r.dir, 'ls-tree', '--name-only', 'main', f), f);
  assert.equal(ticketIn(r.dir, '0001').fm.status, 'done');
  assert.equal(ticketIn(r.dir, '0002').fm.status, 'done');
});

test('0674 AC1 self-check: an approved ticket back in review in its worktree, not yet committed, refuses as today', () => {
  const r = builtOnRepo();
  const file = path.join(r.second, 'speck', 'tickets', '0002-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: approved/m, 'status: reviewing'));
  refuses(r, '0001', [/0002 \(reviewing\)/, /shipped/]);
});

test('0674 AC3 self-check: a built_on: that isn\'t a ticket id counts as none', () => {
  const cfg = { base_branch: 'main', branch_prefix: 'speck/' };
  for (const v of ['', 'constructor', '__proto__', [], {}, null, undefined])
    assert.equal(builtOnWaiting('/nowhere', cfg, { built_on: v }), null, String(v));
});
