// 0592: the Pipeline log is a full view: a back link, its heading, a line with speck in its mood, filters, and rows.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fakePage, styles } from './support/panel.mjs';
import { panelRunState } from '../scripts/panel-run.mjs';
import { foremanView } from '../scripts/foreman.mjs';

const SINCE = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 9, 5).toISOString(); })();
const FM = { word: 'Building 2', mood: 'pleased', building: ['0001', '0002'], max: 4 };
const state = (o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: { on: true, pid: 4242, since: SINCE }, foreman: FM, run_log: '1', ...o });
const LINES = [ // newest first, as the server gives them
  '21:06:00 Shipped 0003.',
  '21:05:00 speck run switched to the new code.',
  'speck run will try it again once main or its branch has a new commit.',
  "21:04:00 0003 didn't ship: Tests failed on the approved branch.",
  '21:03:00 Shipping 0003: speck ship 0003 --auto. Log: speck/.cache/runs/0003.ship.log',
  "21:02:30 » 0002: I'm looking into it on claude. Log: speck/.cache/runs/run.watch.log",
  '21:02:00 » 0002: I went with the recommendation: keep it, as watch is fix, and noted it in the ticket.',
  '21:01:00 0001: you went with its recommendation, so speck run is resuming its build (session abc).',
  '21:00:30 0001 build exited with code 0.',
  '21:00:00 Launched 0001 (session abc). Log: speck/.cache/runs/0001.log',
];

function popPage(board, lines) {
  let focused = null;
  const made = n => { n.focus = () => { focused = n; }; n.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0 }); };
  const answer = { current: board, lines };
  const p = fakePage([], { scrollX: 0, scrollY: 0, scrollTo() {}, fetch: async url => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => (String(url).startsWith('/api/run-log') ? { lines: answer.lines } : answer.current) }) }, { made });
  for (const id of ['foreman', 'run']) made(p.byId(id));
  p.document.documentElement = { dataset: {}, classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  p.answer = answer;
  return p;
}
const pop = p => p.byId('foreman');
const of = (p, cls, root = pop(p)) => p.all(root).filter(n => (n.className || '').split(' ').includes(cls));
const moodOf = (p, root) => p.all(root).find(n => n.attrs?.['data-mood'])?.attrs['data-mood'];
const filter = (p, label) => of(p, 'log-filter').find(n => n.textContent === label);
const rows = p => p.all(pop(p)).filter(n => n.tagName === 'li');
const texts = p => rows(p).map(r => of(p, 'log-text', r)[0].textContent);
async function opened(board = state(), lines = LINES) {
  const p = popPage(board, lines);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const tick = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
const choose = async (p, label) => { p.press(filter(p, label)); await p.settle(); };

// ---------- AC1: a back link, the heading and speck's line ----------

test('0592 AC1: pressing the bar opens a full view with a back link to the lane, the heading, and no Close', async () => {
  const p = await opened();
  assert.equal(pop(p).hidden, false);
  assert.match(pop(p).className, /\blog-view\b/);
  const back = of(p, 'back')[0];
  assert.equal(back.attrs.role, 'link');
  assert.equal(back.textContent, 'Build');
  assert.equal(back.attrs['aria-label'], 'Back to Build');
  assert.equal(of(p, 'title')[0].textContent, 'Pipeline log');
  assert.deepEqual(p.all(pop(p)).filter(n => n.tagName === 'button' && n.textContent === 'Close'), []);
});

test('0592 AC1: the back link closes the view, with the focus back on the bar', async () => {
  const p = await opened();
  p.press(of(p, 'back')[0]);
  await p.settle();
  assert.equal(pop(p).hidden, true);
  assert.equal(p.focused(), p.byId('run'));
});

test('0592 AC1: speck, in the pipeline\'s mood, says speck run is on, since when and the slots in use', async () => {
  const p = await opened();
  const line = of(p, 'log-status')[0];
  assert.equal(of(p, 'log-said', line)[0].textContent, 'speck run has been on since 09:05, with 2 of 4 build slots in use.');
  assert.equal(moodOf(p, line), 'pleased');
});

test('0592 AC1: the line follows the board: its words and speck\'s mood change as the pipeline does', async () => {
  const p = await opened();
  p.answer.current = state({ foreman: { ...FM, mood: 'sheepish', building: ['0001'] } });
  await tick(p);
  assert.equal(of(p, 'log-said')[0].textContent, 'speck run has been on since 09:05, with 1 of 4 build slots in use.');
  assert.equal(moodOf(p, of(p, 'log-status')[0]), 'sheepish');
});

test('0592 AC1: a start on an earlier day gives its date, one slot is singular', async () => {
  const p = await opened(state({ run: { on: true, pid: 1, since: new Date(Date.now() - 3 * 864e5).toISOString() }, foreman: { ...FM, building: ['0001'], max: 1 } }));
  assert.match(of(p, 'log-said')[0].textContent, /^speck run has been on since \d{1,2} [A-Z][a-z]{2}, \d\d:\d\d, with 1 of 1 build slot in use\.$/);
});

test('0592 AC1: without a start time or a limit it says only what it knows, and when off it says so', async () => {
  const unknown = await opened(state({ run: { on: true, pid: 1 }, foreman: { word: 'Idle', building: ['0001', '0002'] } }));
  assert.equal(of(unknown, 'log-said')[0].textContent, 'speck run is on, with 2 build slots in use.');
  const none = await opened(state({ run: { on: true, pid: 1 }, foreman: { word: 'Idle', building: [], max: 2 } }));
  assert.equal(of(none, 'log-said')[0].textContent, 'speck run is on, with 0 of 2 build slots in use.');
  const off = await opened(state({ run: undefined, foreman: { word: 'Off', mood: 'asleep' } }));
  assert.equal(of(off, 'log-said')[0].textContent, 'speck run is off, so no build slots are in use.');
});

test('0592 AC1: the server gives when speck run took its lock, and the limit from its own record', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0592-')), at = new Date('2026-11-09T09:05:00Z');
  const lock = path.join(dir, 'run.lock');
  fs.writeFileSync(lock, String(process.pid));
  fs.utimesSync(lock, at, at);
  assert.deepEqual(panelRunState(dir, dir), { on: true, pid: process.pid, since: at.toISOString() });
  const run = { on: true, pid: 7 }, seen = record => foremanView({ run, record, tickets: [] }).max;
  assert.equal(seen({ lock: 7, max: 4, building: [] }), 4);
  assert.equal(seen({ lock: 8, max: 4, building: [] }), null, 'another speck run\'s record says nothing about this one');
  assert.equal(seen({ lock: 7, max: 'many', building: [] }), null);
});

test('0592: closed, the box is no longer the full view, so a build log in it keeps the pop-up\'s look', async () => {
  const p = await opened();
  p.press(of(p, 'back')[0]);
  await p.settle();
  assert.equal(pop(p).className, 'foreman');
});

// ---------- AC2: filters ----------

test('0592 AC2: the filters are Everything, Decisions, Ships and Builds, with Everything chosen when it opens', async () => {
  const p = await opened();
  assert.deepEqual(of(p, 'log-filter').map(n => n.textContent), ['Everything', 'Decisions', 'Ships', 'Builds']);
  assert.deepEqual(of(p, 'log-filter').map(n => n.attrs['aria-pressed']), ['true', 'false', 'false', 'false']);
  assert.equal(rows(p).length, LINES.length);
});

test('0592 AC2: Decisions shows the manager\'s lines and anyone going with a recommendation', async () => {
  const p = await opened();
  await choose(p, 'Decisions');
  assert.equal(filter(p, 'Decisions').attrs['aria-pressed'], 'true');
  assert.equal(filter(p, 'Everything').attrs['aria-pressed'], 'false');
  assert.deepEqual(rows(p).map(r => of(p, 'at', r)[0].textContent), ['21:01:00', '21:02:00', '21:02:30']);
});

test('0592 AC2: Ships shows the ship lines, with a refusal\'s line that carries on under it', async () => {
  const p = await opened();
  await choose(p, 'Ships');
  assert.deepEqual(texts(p).map(t => t.slice(0, 22)), ['0003 shipping', "0003 didn't ship: test", 'speck run will try it ', '0003 shipped']);
});

test('0592 AC2: Builds shows the build lines only', async () => {
  const p = await opened();
  await choose(p, 'Builds');
  assert.deepEqual(texts(p), ['0001 build started', '0001 build finished']);
});

test('0592 AC2: a filter with no lines says so, and opening again goes back to Everything', async () => {
  const p = await opened(state(), LINES.slice(0, 2));
  await choose(p, 'Builds');
  assert.equal(rows(p).length, 0);
  assert.equal(of(p, 'none')[0].textContent, 'No builds in this log yet.');
  p.press(of(p, 'back')[0]);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(filter(p, 'Everything').attrs['aria-pressed'], 'true');
  assert.equal(rows(p).length, 2);
});

test('0592 AC2: the filter chosen stays through a refresh, and the new line goes in only if it\'s that filter\'s', async () => {
  const p = await opened();
  await choose(p, 'Builds');
  p.answer.lines = ['21:07:00 Shipped 0004.', ...LINES];
  p.answer.current = state({ run_log: '2' });
  await tick(p);
  assert.equal(filter(p, 'Builds').attrs['aria-pressed'], 'true');
  assert.deepEqual(texts(p), ['0001 build started', '0001 build finished']);
  p.answer.lines = ['21:08:00 Launched 0005 (session d). Log: e.log', ...p.answer.lines];
  p.answer.current = state({ run_log: '3' });
  await tick(p);
  assert.deepEqual(texts(p), ['0001 build started', '0001 build finished', '0005 build started']);
});

// ---------- AC3: rows ----------

test('0592 AC3: a row has its time, its text, and under it its log file or agent', async () => {
  const p = await opened();
  const row = rows(p).find(r => of(p, 'log-text', r)[0].textContent === '0001 build started');
  assert.equal(of(p, 'at', row)[0].textContent, '21:00:00');
  assert.equal(of(p, 'log-more', row)[0].textContent, 'speck/.cache/runs/0001.log');
  const agent = rows(p).find(r => /looking into it/.test(of(p, 'log-text', r)[0].textContent));
  assert.equal(of(p, 'log-more', agent)[0].textContent, 'claude · speck/.cache/runs/run.watch.log');
});

test('0592 AC3: a row with no details has nothing under it, and an agent\'s name may hold a dot or a space', async () => {
  const p = await opened(state(), ['21:02:30 » 0002: I\'m looking into it on GPT 6.1. Log: a.log', '21:01:00 Shipped 0003.', '21:00:00 » 0002: I\'m looking into it on claude.']);
  const [bare, shipped, named] = rows(p);
  assert.equal(of(p, 'log-more', bare)[0].textContent, 'claude');
  assert.equal(of(p, 'log-more', shipped).length, 0);
  assert.equal(of(p, 'log-more', named)[0].textContent, 'GPT 6.1 · a.log');
});

test('0592 AC3: the time and details are in the mono font and the text is not', () => {
  const css = styles();
  assert.match(css, /#foreman\.log-view \.run-log \.at[^{]*\{[^}]*font-family: var\(--font-mono\)/);
  assert.match(css, /#foreman\.log-view \.run-log \.log-more[^{]*\{[^}]*font-family: var\(--font-mono\)/);
  assert.match(css, /#foreman\.log-view \.run-log \.log-text[^{]*\{[^}]*font-family: var\(--font-ui\)/);
});

// ---------- AC4: speck's face on its own lines ----------

test('0592 AC4: the manager\'s lines show speck\'s face and the rest don\'t', async () => {
  const p = await opened();
  const said = rows(p).filter(r => /^21:02/.test(of(p, 'at', r)[0]?.textContent));
  assert.equal(said.length, 2);
  for (const r of said) assert.ok(moodOf(p, r), 'a face on the manager\'s line');
  for (const r of rows(p).filter(r => !said.includes(r))) assert.equal(moodOf(p, r), undefined, 'no face on the tool\'s line');
});
