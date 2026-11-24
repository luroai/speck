import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0709: an approved ticket built on a ticket that hasn't shipped (ships_after) waits under Building, not Needs you.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, boardPage, queueRows } from './support/panel.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { builtOnRepo, speckIn, gitIn, startedAt, commitFile, approve } from './support/built-on.mjs';

const started = new Date(Date.now() - 600000).toISOString();
const exit = { code: 0, at: started };
const approved = (id, o = {}) => T(id, 'approved', { started, auto_ship: true, build_exit: exit, ...o });
// Built on 0801, which hasn't shipped: auto_ship is off until it has.
const waiting = (o = {}) => approved('0802', { built_on: '0801', ships_after: '0801', auto_ship: false, auto_ship_why: 'ticket 0802 was built on ticket 0801, which hasn\'t shipped yet', ...o });
const show = async tickets => { const p = boardPage([{ run: { on: true }, ideas: [], tickets }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const heads = p => p.byId('queue').children.filter(c => c.className === 'group-head').map(h => h.textContent);
// The group each row is under, by its id.
function groupsOf(p) {
  const out = {};
  let at = null;
  for (const c of p.byId('queue').children) {
    if (c.className === 'group-head') at = p.all(c).find(n => n.className === 'group-name').textContent;
    else { const id = p.all(c).find(n => n.className === 'id'); if (id) out[id._text] = at; }
  }
  return out;
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).find(c => c.className === 'id')._text === id);
const whereOf = (p, id) => p.all(rowOf(p, id)).find(c => /^where\b/.test(c.className));
const summary = tickets => projectSummary({ board: { tickets }, foreman: { word: 'Idle', tone: 'idle', fixing: 'tell', blocked: [], agent: { asks: [] } }, run: { on: true } });

test('0709 AC1: an approved ticket whose base ticket hasn\'t shipped is under Building, saying it is approved and ships after that ticket', async () => {
  for (const o of [{}, { build_exit: null }]) { // whether or not its build has exited
    const p = await show([approved('0801'), waiting(o)]);
    assert.equal(groupsOf(p)['0802'], 'Building', heads(p).join(' | '));
    assert.ok(!heads(p).some(h => /^Needs you/.test(h)), heads(p).join(' | '));
    assert.match(whereOf(p, '0802').textContent, /^Approved · ships after 0801\b/);
    assert.doesNotMatch(whereOf(p, '0802').textContent, /Ready to ship|waiting for you/);
  }
});

test('0709 AC1: a high-risk one auto_ship wouldn\'t cover anyway still waits under Building until its base ticket ships', async () => {
  const p = await show([approved('0801'), waiting({ risk: 'high' })]);
  assert.equal(groupsOf(p)['0802'], 'Building');
});

test('0709 AC2: the bridge doesn\'t count it under Needs you', () => {
  const s = summary([approved('0801'), waiting()]);
  assert.equal(s.needs_you, 0, JSON.stringify(s.needs));
  assert.equal(summary([approved('0801'), waiting({ risk: 'high' })]).needs_you, 0);
});

test('0709 AC3 AC4: once its base ticket has shipped, or with none, it reads and counts as today', async () => {
  // auto_ship doesn't cover it: Ready to ship, under Needs you, and counted by the bridge.
  for (const o of [{ ships_after: null }, { ships_after: null, built_on: undefined }]) {
    const t = waiting({ ...o, auto_ship_why: 'auto_ship is off in speck/config.yml' });
    const p = await show([T('0801', 'done'), t]);
    assert.equal(groupsOf(p)['0802'], 'Needs you');
    assert.match(whereOf(p, '0802').textContent, /^Ready to ship/);
    assert.equal(summary([t]).needs_you, 1);
  }
  // auto_ship covers it: it ships by itself, under Building, and nothing needs you.
  const covered = waiting({ ships_after: null, auto_ship: true, auto_ship_why: '' });
  const p = await show([T('0801', 'done'), covered]);
  assert.equal(groupsOf(p)['0802'], 'Building');
  assert.doesNotMatch(whereOf(p, '0802').textContent, /ships after/);
  assert.equal(summary([covered]).needs_you, 0);
});

// 0001 started on approved 0002 and approved itself, with auto_ship off.
function bothApproved() {
  const r = builtOnRepo();
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  const first = startedAt(res);
  commitFile(first, 'b.txt', 3);
  approve(first, '0001');
  return { ...r, first };
}
const approvedPart = out => out.split(/\n(?=[A-Z]+ \(\d+\))/).find(s => /^APPROVED/.test(s));
// A ticket's line in `part` and the indented lines under it.
const blockOf = (part, id) => (part.match(new RegExp(`^  ${id} [^\\n]*(\\n {8}[^\\n]*)*`, 'm')) || [''])[0];

test('0709 AC2 AC3: speck status doesn\'t say it waits for you to ship it until its base ticket has shipped', () => {
  const r = bothApproved();
  fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: false'));
  gitIn(r.dir, 'commit', '-qam', 'auto_ship off');
  const before = approvedPart(speckIn(r.dir, 'status').stdout);
  assert.match(before, /^APPROVED \(2\): 1 waiting for you\./);
  assert.match(blockOf(before, '0001'), /↳ ships after 0002, which it was built on/);
  assert.doesNotMatch(blockOf(before, '0002'), /ships after/);
  assert.match(blockOf(before, '0002'), /^  0002 /);
  assert.equal(speckIn(r.dir, 'ship', '0002').status, 0);
  const after = approvedPart(speckIn(r.dir, 'status').stdout);
  assert.match(after, /^APPROVED \(1\): waiting for you\./);
  assert.doesNotMatch(after, /ships after/);
});
