// 0458: pressing speck's screen shows the pipeline log and nothing else: the Pipeline pop-up no longer has a Right now
// section, while a stale page's Reload page button, and the questions on the tickets' cards, stay.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fakePage, T, openQueueRows, model } from './support/panel.mjs';
import { foremanView } from '../scripts/foreman.mjs';

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const TICKETS = [T('0001', 'building'), T('0004', 'ready'), T('0006', 'blocked', { blocked_question: 'Which one?' }),
  T('0007', 'done', { foreman_took: [{ option: 'A', at: new Date(Date.now() - 3600e3).toISOString() }] })];
const AGENT = { running: { id: '0008', what: 'its build ended' }, asks: [{ id: '0001', question: 'Should it keep the old test?' }], did: [{ id: '0009', did: 'resumed its build', why: 'it stopped' }] };
// Everything Right now used to show: building, ready, shipping, blocked, recommendations taken and the Foreman's work.
const BUSY = { ...foremanView({ run: ON, record: rec({ building: ['0001'], ready: [{ id: '0004', kind: 'after', why: 'waiting for 0003' }],
  ship: { running: '0005', hold: null, refused: [] } }), tickets: TICKETS, agent: AGENT, fixing: 'fix' }), fixing_says: 'fix. The Foreman takes recommendations', held: ['Every build waits on main.'] };
const state = (o = {}) => ({ tickets: TICKETS, ideas: [], resume_command: '', run: ON, foreman: BUSY, run_log: '1', ...o });
const LOG = { lines: ['10:02 0001 build started', '10:01 speck run on'] };

function popPage(responses, globals = {}) {
  let focused = null;
  const p = fakePage(responses, { scrollX: 0, scrollY: 0, scrollTo() {}, confirm: () => true, ...globals }, { made: n => { n.focus = () => { focused = n; }; } });
  for (const id of ['foreman', 'run']) p.byId(id).focus = function () { focused = this; };
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  return p;
}
const pop = p => p.byId('foreman');
async function opened(board = state(), globals) {
  const p = popPage([board, LOG], globals);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const buttons = (p, root) => p.all(root).filter(n => n.tagName === 'button').map(n => n.textContent);
const RIGHT_NOW = ['Right now', 'Building', 'Ready, not building', 'Shipping', 'Blocked', 'Recommendations taken', 'Looked into'];

test('0458 AC1: the pop-up has only its title, Close and the log', async () => {
  const p = await opened();
  assert.equal(pop(p).hidden, false, 'open');
  const [top, body] = pop(p).children;
  assert.equal(pop(p).children.length, 2, 'its top and its body');
  assert.equal(top.textContent, 'PipelineClose');
  assert.deepEqual(buttons(p, pop(p)), ['Close'], 'no button but Close');
  const shown = body.children.filter(n => !n.hidden);
  assert.equal(shown.length, 1, 'only the log shows in the body');
  assert.match(shown[0].className, /\bfm-log\b/);
  assert.deepEqual(p.all(pop(p)).filter(n => /^h\d$/.test(n.tagName)).map(n => n.textContent), ['Log'], 'no heading but the log\'s');
});

test('0458 AC1: none of Right now\'s headings or lines are in the pop-up', async () => {
  const p = await opened();
  const t = pop(p).textContent;
  for (const h of RIGHT_NOW) assert.ok(!p.all(pop(p)).some(n => n.textContent === h), `no ${h}`);
  for (const gone of [/Right now/, /Fixing:/, /Every build waits on main/, /Nothing is/, /0004 waiting for 0003/, /is shipping/, /Which one\?/,
    /Waiting for you/, /The Foreman went with the recommendation/, /is being looked into/, /Should it keep the old test/, /resumed its build/,
    /The Foreman hasn't/, /No ready ticket/]) assert.doesNotMatch(t, gone);
  assert.ok(!p.all(pop(p)).some(n => /\bforeman-ask\b/.test(n.className || '')), 'no Foreman question in it');
});

test('0458 AC1: the screen\'s tooltip promises only the log', async () => {
  const p = popPage([state()]);
  await p.settle();
  const tip = p.byId('run').title;
  assert.match(tip, /log/);
  assert.doesNotMatch(tip, /doing|waiting/);
});

test('0458 AC2: on a stale page a Reload page button shows above the log, and pressing it reloads the page', async () => {
  let reloaded = 0;
  const p = await opened(state({ page: 'newer' }), { location: { reload: () => { reloaded++; } } });
  const all = p.all(pop(p)), reload = all.find(n => n.id === 'foreman-reload');
  assert.ok(reload, 'a Reload page button');
  assert.equal(reload.textContent, 'Reload page');
  const log = all.find(n => /\bfm-log\b/.test(n.className || ''));
  assert.ok(all.indexOf(reload) < all.indexOf(log), 'above the log');
  assert.ok(!p.all(pop(p)).some(n => n.hidden && p.all(n).includes(reload)), 'it shows');
  p.press(reload);
  assert.equal(reloaded, 1);
});

test('0458 AC2: a page running the panel\'s own code has no Reload page button', async () => {
  const p = await opened();
  assert.ok(!p.all(pop(p)).some(n => n.id === 'foreman-reload' && !n.hidden));
  assert.doesNotMatch(pop(p).textContent, /newer code/);
});

test('0458 AC2 self-check: once the page is no longer stale, the Reload page button goes, and the focus it had stays in the pop-up', async () => {
  const stale = state({ page: 'newer', run_log: '' }), fresh = state({ run_log: '' });
  const p = popPage([stale, stale, fresh]);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  const reload = p.all(pop(p)).find(n => n.id === 'foreman-reload');
  reload.focus();
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(p.all(pop(p)).find(n => n.id === 'foreman-reload'), reload, 'kept through a refresh while stale, with its focus');
  assert.equal(p.focused(), reload);
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(p.all(pop(p)).find(n => n.id === 'foreman-reload'), undefined, 'gone');
  assert.equal(p.focused(), pop(p), 'the focus is back in the pop-up');
});

test('0458 AC3: a Foreman\'s question keeps its Answer and Dismiss buttons on its ticket\'s card, and a blocked ticket\'s question stays on its card', async () => {
  const p = await opened();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const queue = p.byId('queue');
  const ask = p.all(queue).find(n => /\bforeman-ask\b/.test(n.className || ''));
  assert.ok(ask, 'the card has the Foreman\'s question');
  assert.match(ask.textContent, /The Foreman asks you: Should it keep the old test\?/);
  for (const b of ['Answer', 'Dismiss']) assert.ok(buttons(p, ask).includes(b), `its ${b} button`);
  assert.match(queue.textContent, /Which one\?/, 'the blocked ticket\'s question is on its card');
});

test('0458 AC4: the pop-up opens with the focus in it, and Close, Escape and pressing the screen again close it with the focus back on the screen', async () => {
  for (const how of ['Close', 'Escape', 'screen']) {
    const p = await opened();
    assert.equal(p.focused(), pop(p), `${how}: the focus is in the pop-up`);
    assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
    if (how === 'Close') p.press(p.all(pop(p)).find(n => n.tagName === 'button' && n.textContent === 'Close'));
    else if (how === 'Escape') p.key('Escape');
    else p.press(p.byId('run'));
    await p.settle();
    assert.equal(pop(p).hidden, true, `${how}: shut`);
    assert.equal(p.byId('run').attrs['aria-expanded'], 'false');
    assert.equal(p.focused(), p.byId('run'), `${how}: the focus is back on the screen`);
  }
});

test('0458 AC4: the log still shows in the pop-up, as /api/run-log gives it', async () => {
  const p = popPage([state(), LOG]);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  const ol = p.all(pop(p)).find(n => n.tagName === 'ol');
  const summary = vm.runInNewContext(`${model()}\nrunLogSummary`, {}); // 0459: each line's summary, the newest at the bottom
  assert.deepEqual(ol && ol.children.map(li => li.textContent), LOG.lines.slice().reverse().map(summary));
});
