// 0749: while the main checkout isn't a work tree (core.bare is true), speck status, the panel's Build lane and bar, and
// the bridge say so under Needs you, with the command that sets it back, and stop once it's set back.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, boardPage, fakePage, panelRepo, startPanel, stop, request, freePort } from './support/panel.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';

const NOW = Date.parse('2026-11-24T12:00:00Z');
const MAIN = '/home/someone/project';
const SET_BACK = `git -C ${MAIN} config core.bare false`;
const RUN = { on: true, pid: 7 };
const NONE = { running: null, waiting: [], did: [], asks: [] };
const view = (tickets, { bare = MAIN, run = RUN } = {}) => foremanView({ run, record: { lock: run.pid, building: [], ready: [] }, tickets, agent: NONE, now: NOW, base: 'main', bare });
const barCount = f => { const m = /^Needs you (\d+)$/.exec(f.word); return m ? Number(m[1]) : 0; };

// ---------- AC1: speck status ----------

test('0749 AC1: speck status lists a bare main checkout first, under the status, with the command that sets it back', () => {
  const f = view([T('0002', 'blocked', { blocked_question: 'Which?' })]);
  assert.equal(f.word, 'Needs you 2');
  const lines = foremanLines(f);
  assert.equal(lines[0], 'SPECK: Needs you 2');
  assert.match(lines[1], /^ {2}Needs you: The main checkout at \/home\/someone\/project isn't a work tree/);
  assert.ok(lines[1].includes(SET_BACK), lines[1]);
});

test('0749 AC1: it counts while speck run is off too, as nothing builds or ships until it\'s set back', () => {
  const f = view([T('0002', 'blocked', { blocked_question: 'Which?' })], { run: { on: false } });
  assert.equal(f.word, 'Needs you 1');
  assert.equal(f.tone, 'bad');
  assert.ok(foremanLines(f)[1].includes(SET_BACK));
});

test('0749 AC1 AC3: the real speck status says it while core.bare is true, and not once it\'s false', () => {
  const r = panelRepo();
  r.g('config', 'core.bare', 'true');
  const on = r.run('status');
  assert.equal(on.status, 0, on.stderr);
  const lines = on.stdout.split('\n');
  assert.equal(lines[0], 'SPECK: Needs you 1');
  assert.match(lines[1], /Needs you: .*isn't a work tree/);
  assert.match(lines[1], /config core\.bare false/);
  r.g('config', 'core.bare', 'false');
  const off = r.run('status');
  assert.equal(off.stdout.split('\n')[0], 'SPECK: Off');
  assert.doesNotMatch(off.stdout, /core\.bare/);
});

test('0749 AC1 AC3: with no tickets yet, speck status still says it, and only says there are none once it\'s set back', () => {
  const r = panelRepo();
  for (const f of fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).filter(f => f.endsWith('.md'))) fs.rmSync(path.join(r.dir, 'speck', 'tickets', f));
  r.g('config', 'core.bare', 'true');
  const on = r.run('status');
  assert.equal(on.status, 0, on.stderr);
  const lines = on.stdout.split('\n');
  assert.equal(lines[0], 'SPECK: Needs you 1');
  assert.match(lines[1], /config core\.bare false/);
  assert.match(on.stdout, /No tickets yet/);
  r.g('config', 'core.bare', 'false');
  const off = r.run('status');
  assert.equal(off.stdout.trim(), 'No tickets yet. Capture an idea, then run /speck-ticket.');
});

// ---------- AC2: the panel and the bridge ----------

const board = (bareMain, tickets = []) => ({ run: { on: true }, ideas: [], tickets, foreman: { word: `Needs you ${1 + tickets.filter(t => t.status === 'blocked').length}`, tone: 'bad', base: 'main', ...(bareMain ? { bare_main: bareMain } : {}) } });
const show = async (...boards) => { const p = boardPage(boards, { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const isBare = n => /\bbare-main-row\b/.test(n.className || '');
const listed = p => p.byId('queue').children.map(n => (isBare(n) ? 'bare' : /\bq\b/.test(n.className || '') ? p.all(n).find(c => c.className === 'id')._text : n.textContent));
const find = (p, n, re) => p.all(n).find(c => re.test(c.className || '')) || null;

test('0749 AC2: the panel shows it as the first row under Build\'s Needs you, with the orange dot and the command', async () => {
  const b = view([]).bare_main;
  const p = await show(board(b, [T('0702', 'blocked', { blocked_question: 'Which?' }), T('0701', 'ready')]));
  assert.deepEqual(listed(p), ['Needs you 2', 'bare', '0702', 'Queued 1', '0701']);
  const row = p.byId('queue').children.find(isBare), where = find(p, row, /^where\b/);
  assert.equal(find(p, row, /^title$/).textContent, 'Main checkout isn\'t a work tree');
  assert.match(where.className, /\bneeds\b/, 'the orange dot');
  assert.equal(where.textContent, `Set it back with ${SET_BACK}`);
  assert.match(where.title, /isn't a work tree/);
});

test('0749 AC2: the bar counts it under Needs you, and the bridge\'s summary counts it, first, for that project', () => {
  const tickets = [T('0002', 'blocked', { blocked_question: 'Which?' })], f = view(tickets);
  assert.equal(barCount(f), 2);
  const s = projectSummary({ board: { tickets }, foreman: f, run: RUN, now: NOW });
  assert.equal(s.needs_you, 2);
  assert.equal(s.mood, 'asking');
  assert.deepEqual({ id: s.needs[0].id, why: s.needs[0].why }, { id: '', why: 'bare_main' });
  assert.match(s.needs[0].title, /Main checkout isn't a work tree/);
  assert.ok(s.needs[0].detail.includes(SET_BACK));
});

const summaryOf = (port, name, o = {}) => ({ port, name, running: true, status: 'Needs you 1', tone: 'bad', mood: 'asking', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [], ...o });
const bridgeBoard = { tickets: [], ideas: [], run: { on: true, pid: 1 }, foreman: { word: 'Idle', tone: 'idle', mood: 'watching', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [] }, projects: { self: 4777, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }] } };
const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const within = (p, cls) => nodes(p.byId('bridge')).filter(n => String(n.className || '').split(' ').includes(cls));

test('0749 AC2: the bridge shows its card for that project, and pressing it opens the project', async () => {
  const s = projectSummary({ board: { tickets: [] }, foreman: view([]), run: RUN, now: NOW });
  const kept = new Map(), store = { getItem: k => (kept.has(k) ? kept.get(k) : null), setItem: (k, v) => kept.set(k, String(v)), removeItem: k => kept.delete(k) };
  const body = { self: 4777, projects: [summaryOf(4777, 'speck'), summaryOf(4778, 'alpha', { needs_you: s.needs_you, needs: s.needs })] };
  const p = fakePage([bridgeBoard, body, { ok: true }], { sessionStorage: store, location: { reload() {} } });
  await p.settle();
  p.byId('project').value = 'all';
  p.byId('project').listeners.change();
  await p.settle();
  assert.match(nodes(p.byId('bridge')).find(n => n.className === 'bridge-counts').textContent, /1 needs you/);
  assert.equal(within(p, 'bridge-card').length, 1);
  assert.equal(within(p, 'bridge-where')[0].textContent, 'alpha · Main checkout');
  assert.match(within(p, 'bridge-title')[0].textContent, /isn't a work tree/);
  assert.ok(within(p, 'bridge-reason')[0].textContent.includes(SET_BACK));
  const before = p.calls.length;
  within(p, 'bridge-card')[0].listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.equal(p.calls[before].url, '/api/projects/4778');
});

test('0749 AC2 AC3: a real panel on a bare main checkout gives it in its state, and drops it once set back', async () => {
  const r = panelRepo();
  r.g('config', 'core.bare', 'true');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const state = async () => JSON.parse((await request(panel.port, { pathName: '/api/state' })).body);
    const on = await state();
    assert.equal(on.foreman.word, 'Needs you 1');
    assert.match(on.foreman.bare_main.command, /config core\.bare false$/);
    r.g('config', 'core.bare', 'false');
    let off = await state();
    for (const until = Date.now() + 10000; off.foreman.bare_main && Date.now() < until;) { await new Promise(res => setTimeout(res, 100)); off = await state(); }
    assert.equal(off.foreman.bare_main, undefined);
    assert.equal(off.foreman.word, 'Off');
  } finally { await stop(panel); }
});

// ---------- AC3: gone once set back ----------

test('0749 AC3: with core.bare false, it\'s in none of the three: status, the bar\'s count and Build, and the bridge', async () => {
  const tickets = [T('0002', 'blocked', { blocked_question: 'Which?' })], f = view(tickets, { bare: null });
  assert.equal(f.bare_main, undefined);
  assert.equal(f.word, 'Needs you 1');
  assert.doesNotMatch(foremanLines(f).join('\n'), /core\.bare/);
  assert.equal(view([], { bare: null, run: { on: false } }).word, 'Off');
  const s = projectSummary({ board: { tickets }, foreman: f, run: RUN, now: NOW });
  assert.deepEqual(s.needs.map(n => n.why), ['question']);
  const p = await show(board(view([]).bare_main, tickets), { ...board(null, tickets), foreman: { word: 'Needs you 1', tone: 'bad', base: 'main' } });
  assert.deepEqual(listed(p), ['Needs you 2', 'bare', '0002']);
  p.timers.shift()(); // the board's next change: core.bare is false again
  await p.settle();
  assert.deepEqual(listed(p), ['Needs you 1', '0002']);
});
