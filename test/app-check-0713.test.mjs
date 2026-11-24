import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0713: a ticket whose question speck's watch agent is checking, or will check, in the running app says so, and isn't
// counted under Needs you until the agent asks you.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gitEnv, fakePage, fullViewOf, queueRows, tipSentence } from './support/panel.mjs';
import { CHECK, blocked, checking } from './support/app-check.mjs';
import { statusData } from '../scripts/speck.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { foremanTicketLines } from '../scripts/foreman-took.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { appChecking, checkKey, checkItem } from '../scripts/app-check.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

const ON = { on: true, pid: 4242 };
const rec = { lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] } };
const view = (tickets, fixing = 'decide') => foremanView({ run: ON, record: rec, tickets, fixing });
const DECIDE = { watch: 'decide' };
const NONE = { checked: {}, queue: [], running: null };
const looking = blocked({ app_checking: true });
const waiting = blocked({ app_checking: false });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const whereOf = (p, id) => p.all(queueRows(p).find(n => idOf(p, n) === id)).find(c => /^where\b/.test(c.className));
const heads = p => p.byId('queue').children.filter(c => c.className === 'group-head').map(h => h.textContent);
const page = async tickets => {
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : { run: { on: true }, tickets: JSON.parse(JSON.stringify(tickets)), ideas: [] }) }) });
  await p.settle();
  return p;
};
const summary = (tickets, fixing = 'decide') => projectSummary({ board: { tickets }, foreman: view(tickets, fixing), run: ON });
const blockOf = (out, id) => (out.match(new RegExp(`^  ${id} [^\\n]*(\\n {8}[^\\n]*)*`, 'm')) || [''])[0];

test('0713 AC1: the card and its full view say speck is checking it in the app, not Waiting for you', async () => {
  const p = await page([looking]);
  const where = whereOf(p, '0001');
  assert.equal(tipSentence(where), 'Blocked · speck is checking it in the app');
  assert.match(where.textContent, /^speck is checking/);
  const full = (await fullViewOf(p, '0001')).textContent;
  assert.ok(full.includes('speck is checking it in the app'), full);
  assert.doesNotMatch(full, /Waiting for you|question for you/);
});

test('0713 AC1: speck status\'s line under it says speck is checking it in the app', () => {
  const lines = foremanTicketLines({ ...looking, blocked_question: null }, 'A or B?');
  assert.ok(lines.includes(`        → speck is checking it in the app: ${CHECK}`), lines.join('\n'));
  assert.ok(!lines.some(l => /Waiting for you/.test(l)), lines.join('\n'));
});

test('0713 AC1 AC3: whether speck is checking it follows watch, the risk, its question and the agent\'s record', () => {
  const t = blocked(), key = checkKey(t), item = checkItem(t, 'x.log');
  assert.equal(appChecking(DECIDE, t, NONE), true, 'it will check it');
  assert.equal(appChecking({ watch: 'fix' }, t, NONE), true);
  assert.equal(appChecking(DECIDE, t, { checked: { '0001': key }, queue: [item], running: null }), true, 'queued');
  assert.equal(appChecking(DECIDE, t, { checked: { '0001': key }, queue: [], running: { ...item, token: 'x' } }), true, 'running');
  assert.equal(appChecking(DECIDE, t, { checked: { '0001': 'older' }, queue: [], running: null }), true, 'an earlier question was checked');
  for (const watch of ['off', 'tell']) assert.equal(appChecking({ watch }, t, NONE), false, watch);
  assert.equal(appChecking(DECIDE, blocked({ risk: 'high' }), NONE), false, 'high risk');
  assert.equal(appChecking(DECIDE, blocked({ blocked_check_in_app: null }), NONE), false, 'no check in the app');
  assert.equal(appChecking(DECIDE, t, { checked: { '0001': key }, queue: [], running: null }), false, 'checked, with no action');
  assert.equal(appChecking(DECIDE, t, NONE, [{ id: '0001', question: 'Q?' }]), false, 'the agent asked you');
  assert.equal(appChecking(DECIDE, blocked({ id: 'constructor' }), { checked: {}, queue: [], running: null }), true, 'a built-in name is no record');
  assert.equal(appChecking(DECIDE, t, {}), true, 'an empty record');
});

test('0713 AC2: it isn\'t counted under Needs you, in the bridge\'s Needs you or in speck status\'s list', async () => {
  const p = await page([looking]);
  assert.ok(!heads(p).some(h => /^Needs you/.test(h)), heads(p).join(' | '));
  const v = view([looking]);
  assert.doesNotMatch(v.word, /Needs you/);
  assert.equal(summary([looking]).needs_you, 0, JSON.stringify(summary([looking]).needs));
});

test('0713 AC3: one speck won\'t check reads Waiting for you and counts under Needs you, as before', async () => {
  const p = await page([waiting]);
  assert.ok(heads(p).some(h => /^Needs you/.test(h)), heads(p).join(' | '));
  assert.equal(tipSentence(whereOf(p, '0001')), 'Blocked · it has a question for you');
  assert.match((await fullViewOf(p, '0001')).textContent, /Waiting for you\. Answer the question/);
  assert.equal(view([waiting]).word, 'Needs you 1');
  assert.equal(summary([waiting]).needs_you, 1);
  assert.ok(foremanTicketLines(waiting, 'A or B?').includes('        → Waiting for you'));
});

test('0713 AC1 AC2 AC3: speck status and its --json follow the agent: checking until it asks you, then waiting for you', () => {
  const { r, a } = checking();
  const shown = () => statusData(r.dir).tickets.find(t => t.id === '0001');
  assert.equal(shown().app_checking, true, 'before speck run has queued it');
  let out = r.run('status').stdout;
  assert.ok(blockOf(out, '0001').includes(`→ speck is checking it in the app: ${CHECK}`), out);
  assert.doesNotMatch(out, /^SPECK: Needs you/m);
  a.check(shown());
  assert.equal(a.starts.length, 1);
  assert.equal(shown().app_checking, true, 'while the agent checks it');
  a.act('ask', '0001', 'The button is cut off on a phone: keep it?', '--saw=The Save button is cut off at 375 px', '--why=It doesn\'t fully pass');
  a.end(); a.check(shown());
  assert.equal(shown().app_checking, false, 'once the agent has asked you');
  out = r.run('status').stdout;
  assert.ok(blockOf(out, '0001').includes('→ Waiting for you'), out);
});

test('0713 AC3: once the agent has checked it and done nothing, and with watch tell, it waits for you', () => {
  const { r, a } = checking();
  const shown = () => statusData(r.dir).tickets.find(t => t.id === '0001');
  a.check(shown()); a.end(); a.check(shown());
  assert.equal(shown().app_checking, false);
  assert.equal(statusData(checking({ watch: 'tell' }).r.dir).tickets.find(t => t.id === '0001').app_checking, false);
  assert.equal(statusData(checking({ risk: 'high' }).r.dir).tickets.find(t => t.id === '0001').app_checking, false);
});

test('0713 AC3: with watch off it reads Waiting for you under Needs you in the Build lane, and the header and bridge leave it out, as they do every blocked question while watch is off', async () => {
  const { r } = checking({ watch: 'off' });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.app_checking, false);
  const p = await page([t]);
  assert.ok(heads(p).some(h => /^Needs you/.test(h)), heads(p).join(' | '));
  assert.match((await fullViewOf(p, '0001')).textContent, /Waiting for you\. Answer the question/);
  assert.doesNotMatch(view([t], 'off').word, /Needs you/);
  assert.equal(summary([t], 'off').needs_you, 0);
  assert.equal(view([blocked({ app_checking: false, id: '0002' })], 'off').word, view([t], 'off').word, 'the same as any other blocked question');
  assert.ok(blockOf(r.run('status').stdout, '0001').includes('→ Waiting for you'));
});
