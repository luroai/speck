// 0616: a ticket whose build stopped before finishing, that nothing will carry on, is listed under Needs you and counted
// in the bar's Needs you. One speck is about to resume or look into stays under Building.
import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { T, boardPage, queueRows, panelRepo } from './support/panel.mjs';
import { runsPath } from './support/ticker.mjs';
import os from 'node:os';
import path from 'node:path';
import { foremanView } from '../scripts/foreman.mjs';
import { agentView } from '../scripts/foreman-agent.mjs';
import { statusData } from '../scripts/speck.mjs';

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const STARTED = { started: ago(18 * 60) };
const EXITED = { ...STARTED, build_exit: { at: ago(120), code: 1, message: 'gone' } };
const KILLED = { ...STARTED, build_stopped: true, build_stopped_at: ago(120) };
const agent = (a = {}) => ({ running: null, waiting: [], resuming: [], did: [], asks: [], ...a });
const board = (tickets, { on = true, fixing = 'tell', ag = agent() } = {}) => ({ run: { on }, ideas: [], tickets, foreman: { fixing, agent: ag } });
const show = async b => { const p = boardPage([b], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const listed = p => p.byId('queue').children.map(n => (/\bq\b/.test(n.className) ? p.all(n).find(c => c.className === 'id')._text : n.textContent));
const whereOf = (p, id) => p.all(queueRows(p).find(r => p.all(r).find(c => c.className === 'id')._text === id)).find(c => /^where\b/.test(c.className));
const word = (tickets, { on = true, fixing = 'tell', ag = agent() } = {}) => foremanView({ run: { on, pid: 1 }, record: null, tickets, fixing, agent: ag }).word;

// ---------- AC1: nothing will carry it on ----------

for (const fixing of ['off', 'tell']) {
  test(`0616 AC1: an exited build with watch ${fixing} is under Needs you, with the orange dot and a line saying its build stopped`, async () => {
    for (const status of ['building', 'reviewing']) {
      const p = await show(board([T('0701', status, EXITED), T('0702', 'building', { ...STARTED, build_running: true })], { fixing }));
      assert.deepEqual(listed(p), ['Needs you 1', '0701', 'Building 1', '0702'], status);
      const where = whereOf(p, '0701');
      assert.match(where.className, /\bneeds\b/, 'the orange dot');
      assert.match(where.textContent, /^Build stopped\b/);
    }
  });
}

test('0616 AC1: with watch fix or decide, an exited build speck has looked into and left is under Needs you', async () => {
  for (const fixing of ['fix', 'decide']) {
    const ag = agent({ did: [{ id: '0701', action: 'diagnose', at: ago(60) }] });
    assert.deepEqual(listed(await show(board([T('0701', 'building', EXITED)], { fixing, ag }))), ['Needs you 1', '0701'], fixing);
    // nothing running or waiting: it was looked into before for the same commits, so it won't be again
    assert.deepEqual(listed(await show(board([T('0701', 'building', EXITED)], { fixing }))), ['Needs you 1', '0701'], fixing);
    // a resume it asked for that speck run has taken off its list, having tried it, is no longer about to happen
    const tried = agent({ did: [{ id: '0701', action: 'resume', at: ago(60) }] });
    assert.deepEqual(listed(await show(board([T('0701', 'building', EXITED)], { fixing, ag: tried }))), ['Needs you 1', '0701'], fixing);
  }
});

test('0616 AC1: a killed build speck run has already resumed once, or that it cannot resume as it is off, is under Needs you', async () => {
  assert.deepEqual(listed(await show(board([T('0701', 'building', { ...KILLED, build_wont_resume: true })]))), ['Needs you 1', '0701']);
  const off = await show(board([T('0701', 'reviewing', KILLED)], { on: false }));
  assert.deepEqual(listed(off), ['Needs you 1', '0701']);
  assert.match(whereOf(off, '0701').textContent, /^Build stopped\b/);
});

test('0616 AC1: with speck run off, an exited build is under Needs you whatever watch is', async () => {
  const p = await show(board([T('0701', 'building', EXITED)], { on: false, fixing: 'fix', ag: agent({ waiting: ['0701'] }) }));
  assert.deepEqual(listed(p), ['Needs you 1', '0701']);
});

test('0616 AC1: the board says when speck run won\'t resume a killed build: resumed once already, or it can\'t', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  r.g('commit', '-qam', 'building');
  const dead = spawnSync(process.execPath, ['-e', ''], { stdio: 'ignore' }).pid;
  const rec = { id: '0001', session: crypto.randomUUID(), cwd: r.dir, started: ago(1200), pid: dead, command: ['claude'] };
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const wont = record => { fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify(record)); return statusData(r.dir).tickets.find(t => t.id === '0001'); };
  const first = wont(rec);
  assert.equal(first.build_stopped, true);
  assert.equal(first.build_wont_resume, false, 'speck run resumes it on its next check');
  assert.equal(wont({ ...rec, resumed: ago(600) }).build_wont_resume, true, 'resumed once already');
  // speck run refuses to resume a build whose run record has no session (resumeFor), and says so once in its log
  const { session, ...none } = rec;
  const refused = wont(none);
  assert.equal(refused.build_stopped, true);
  assert.equal(refused.build_wont_resume, true, 'it can\'t be resumed');
});

test('0616 AC1 AC3: a killed build speck run can\'t resume is under Needs you and counted in the bar', async () => {
  const t = T('0701', 'building', { ...KILLED, build_wont_resume: true });
  assert.deepEqual(listed(await show(board([t]))), ['Needs you 1', '0701']);
  assert.equal(word([t]), 'Needs you 1');
});

// ---------- AC2: speck is about to carry it on ----------

test('0616 AC2: an exited build speck is about to look into, or is looking into, stays under Building', async () => {
  for (const fixing of ['fix', 'decide']) {
    assert.deepEqual(listed(await show(board([T('0701', 'building', EXITED)], { fixing, ag: agent({ waiting: ['0701'] }) }))), ['Building 1', '0701'], fixing);
    assert.deepEqual(listed(await show(board([T('0701', 'reviewing', EXITED)], { fixing, ag: agent({ running: { id: '0701', what: 'x' } }) }))), ['Building 1', '0701'], fixing);
  }
});

test('0616 AC2: an exited build speck run is about to resume stays under Building, whatever watch is now', async () => {
  for (const fixing of ['tell', 'fix', 'decide']) {
    const ag = agent({ resuming: ['0701'], did: [{ id: '0701', action: 'resume', at: ago(60) }] });
    const p = await show(board([T('0701', 'building', EXITED)], { fixing, ag }));
    assert.deepEqual(listed(p), ['Building 1', '0701'], fixing);
    assert.doesNotMatch(whereOf(p, '0701').className, /\bneeds\b/);
  }
});

test('0616 AC2: agentView lists the builds speck run is to resume, and drops one once it has tried it', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0616-'));
  const save = resumes => fs.writeFileSync(path.join(runs, 'run.foreman-agent.json'), JSON.stringify({ running: null, queue: [], tried: {}, long: {}, resumes, answered: [] }));
  save([{ id: '0701', message: 'Carry on.' }, { id: '0702', message: 'Go.', by: 'user' }]);
  const ag = agentView(runs, [T('0701', 'building', EXITED)]);
  assert.deepEqual(ag.resuming, ['0701', '0702']);
  assert.doesNotMatch(word([T('0701', 'building', EXITED)], { fixing: 'fix', ag }), /Needs you/);
  save([]); // speck run took it off before trying it, and the resume failed: nothing will carry it on now
  assert.equal(word([T('0701', 'building', EXITED)], { fixing: 'fix', ag: agentView(runs, []) }), 'Needs you 1');
});

test('0616 AC2: a killed build speck run will resume on its next check stays under Building', async () => {
  for (const fixing of ['off', 'tell', 'fix']) {
    assert.deepEqual(listed(await show(board([T('0701', 'building', KILLED)], { fixing }))), ['Building 1', '0701'], fixing);
  }
});

// ---------- AC3: the bar's count ----------

test('0616 AC3: the bar\'s Needs you counts a stopped build nothing will carry on', () => {
  assert.equal(word([T('0701', 'building', EXITED)]), 'Needs you 1');
  assert.equal(word([T('0701', 'building', EXITED)], { fixing: 'off' }), 'Needs you 1');
  assert.equal(word([T('0701', 'reviewing', { ...KILLED, build_wont_resume: true }), T('0702', 'blocked', { blocked_question: 'A or B?' })]), 'Needs you 2');
  assert.equal(word([T('0701', 'building', EXITED)], { fixing: 'fix', ag: agent({ did: [{ id: '0701', action: 'diagnose', at: ago(60) }] }) }), 'Needs you 1');
});

test('0616 AC3: the bar leaves out one speck will carry on, and counts one with a question from speck once', () => {
  assert.doesNotMatch(word([T('0701', 'building', EXITED)], { fixing: 'fix', ag: agent({ waiting: ['0701'] }) }), /Needs you/);
  assert.doesNotMatch(word([T('0701', 'building', EXITED)], { fixing: 'decide', ag: agent({ resuming: ['0701'] }) }), /Needs you/);
  assert.equal(word([T('0701', 'building', EXITED)], { fixing: 'decide', ag: agent({ did: [{ id: '0701', action: 'resume', at: ago(60) }] }) }), 'Needs you 1');
  assert.doesNotMatch(word([T('0701', 'building', KILLED)]), /Needs you/);
  assert.equal(word([T('0701', 'building', EXITED)], { fixing: 'fix', ag: agent({ asks: [{ id: '0701', question: 'Which?' }] }) }), 'Needs you 1');
});
