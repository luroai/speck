import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0697: the bridge counts and shows everything a project's bar counts under Needs you: stopped builds nothing will carry
// on (0616) and a failing full suite (0630), as well as questions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage } from './support/panel.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { foremanView } from '../scripts/foreman.mjs';

const NOW = Date.parse('2026-11-15T12:00:00Z');
const RUN = { on: true, pid: 7 };
const FULL = { base: 'main', commit: 'abcdef1234567', status: 1, tests: ['0001 AC1: one', '0002 AC2: two'], at: '2026-11-15T11:00:00Z' };
// The project's foreman view (what its bar shows) and its summary for the bridge, from the same board and record.
function both(tickets, { full = null, agent = { running: null, waiting: [], did: [], asks: [] }, fixing = 'tell', run = RUN } = {}) {
  const f = foremanView({ run, record: { lock: run.pid, building: [], ready: [], ...(full ? { full } : {}) }, tickets, fixing, agent, now: NOW, base: 'main' });
  return { f, s: projectSummary({ board: { tickets }, foreman: f, run, now: NOW }) };
}
const barCount = f => { const m = /^Needs you (\d+)$/.exec(f.word); return m ? Number(m[1]) : 0; };
const notAtShip = s => s.needs.filter(n => n.why !== 'ship' && n.why !== 'high_risk').length;
const killed = (id, o = {}) => T(id, 'building', { title: `Ticket ${id}`, build_stopped: true, build_wont_resume: true, ...o });

// ---------- the count ----------

test('0697 AC1: a stopped build nothing will carry on counts on the bridge as on the bar', () => {
  const { f, s } = both([killed('0001'), T('0002', 'blocked', { blocked_question: 'Which?' })]);
  assert.equal(barCount(f), 2);
  assert.equal(s.needs_you, 2);
  assert.equal(notAtShip(s), barCount(f));
});

test('0697 AC1: a failing full suite counts on the bridge as on the bar', () => {
  const { f, s } = both([], { full: FULL });
  assert.equal(barCount(f), 1);
  assert.equal(s.needs_you, 1);
  assert.equal(s.mood, 'asking');
});

test('0697 AC1: both together, with a question and the engineering manager\'s, give the bar\'s number', () => {
  const agent = { running: null, waiting: [], did: [], asks: [{ id: '0003', question: 'Go on?' }] };
  const { f, s } = both([killed('0001'), T('0002', 'blocked', { blocked_question: 'Which?' }), killed('0003')], { full: FULL, agent });
  assert.equal(barCount(f), 4, 'question, manager, one stopped build (0003 is asked about already) and the full suite');
  assert.equal(s.needs_you, 4);
});

test('0697 AC1: a stopped build speck run carries on, or a full suite with its fix ticket on its way, counts on neither', () => {
  const resumed = both([killed('0001', { build_wont_resume: false })]);
  assert.equal(barCount(resumed.f), 0);
  assert.equal(resumed.s.needs_you, 0);
  const exited = T('0002', 'building', { build_exit: { code: 1, at: '2026-11-15T10:00:00Z' } });
  const looked = both([exited], { agent: { running: { id: '0002', what: 'x' }, waiting: [], did: [], asks: [] }, fixing: 'fix' });
  assert.equal(barCount(looked.f), 0);
  assert.equal(looked.s.needs_you, 0);
  const fixing = both([], { full: { ...FULL, fixing: '0099' } });
  assert.equal(barCount(fixing.f), 0);
  assert.equal(fixing.s.needs_you, 0);
});

// ---------- the cards ----------

test('0697 AC2: a stopped build is an item naming its ticket, and a failing full suite one naming its failing tests', () => {
  const { s } = both([killed('0001')], { full: FULL });
  const stopped = s.needs.find(n => n.why === 'stopped'), full = s.needs.find(n => n.why === 'full_suite');
  assert.deepEqual({ id: stopped.id, title: stopped.title }, { id: '0001', title: 'Ticket 0001' });
  assert.match(full.title, /main/);
  assert.match(full.detail, /0001 AC1: one; 0002 AC2: two/);
  const noNames = both([], { full: { ...FULL, tests: [], status: 3 } }).s.needs[0];
  assert.match(noNames.detail, /exit code 3/i);
});

const summaryOf = (port, name, o = {}) => ({ port, name, running: true, status: 'Needs you 2', tone: 'bad', mood: 'asking', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [], ...o });
const board = { tickets: [], ideas: [], run: { on: true, pid: 1 }, foreman: { word: 'Idle', tone: 'idle', mood: 'watching', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [] }, projects: { self: 4777, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }] } };
const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const within = (p, cls) => nodes(p.byId('bridge')).filter(n => String(n.className || '').split(' ').includes(cls));
async function opened(needs, globals, then = []) {
  const body = { self: 4777, projects: [summaryOf(4777, 'speck'), summaryOf(4778, 'alpha', { needs_you: needs.length, needs })] };
  const p = fakePage([board, body, ...then], globals);
  await p.settle();
  p.byId('project').value = 'all';
  p.byId('project').listeners.change();
  await p.settle();
  return p;
}

test('0697 AC2: the bridge shows a stopped build\'s card and a failing full suite\'s card', async () => {
  const { s } = both([killed('0001')], { full: FULL });
  const p = await opened(s.needs);
  assert.equal(within(p, 'bridge-card').length, 2);
  const where = within(p, 'bridge-where').map(n => n.textContent), title = within(p, 'bridge-title').map(n => n.textContent), reason = within(p, 'bridge-reason').map(n => n.textContent);
  assert.equal(where[0], 'alpha · 0001 · Build stopped');
  assert.equal(title[0], 'Ticket 0001');
  assert.match(reason[0], /build stopped/i);
  assert.equal(where[1], 'alpha · Full suite');
  assert.match(title[1], /Full suite fails on main/);
  assert.match(reason[1], /0001 AC1: one; 0002 AC2: two/);
  const bare = await opened(both([], { full: { ...FULL, tests: [], status: 3 } }).s.needs);
  assert.match(within(bare, 'bridge-reason')[0].textContent, /exit code 3/i);
});

test('0697 AC2: pressing the full suite\'s card switches to its project without a ticket to open', async () => {
  const kept = new Map(), s = { getItem: k => (kept.has(k) ? kept.get(k) : null), setItem: (k, v) => kept.set(k, String(v)), removeItem: k => kept.delete(k) };
  const p = await opened(both([], { full: FULL }).s.needs, { sessionStorage: s, location: { reload() {} } }, [{ ok: true }]);
  const before = p.calls.length;
  within(p, 'bridge-card')[0].listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.equal(p.calls[before].url, '/api/projects/4778');
  assert.equal(kept.has('speck-open-ticket'), false);
});

// ---------- with neither ----------

test('0697 AC3: with no stopped build or failing full suite, the count and items are as before', () => {
  const tickets = [T('0001', 'building'), T('0002', 'blocked', { title: 'Q', blocked_question: 'Which?' }), T('0003', 'approved', { title: 'S', risk: 'high' })];
  const { s } = both(tickets);
  assert.deepEqual(s.needs.map(n => [n.id, n.why]), [['0002', 'question'], ['0003', 'high_risk']]);
  assert.equal(s.needs_you, 2);
});
