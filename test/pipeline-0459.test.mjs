// 0459: the Pipeline pop-up's log is a terminal of short, timed lines, as a ticket's build log is, the newest at the
// bottom.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fakePage, model, styles } from './support/panel.mjs';
import { runLogTail, RUN_LOG_LINES } from '../scripts/run-log.mjs';

const ON = { on: true, pid: 4242 };
const state = (o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman: null, ...o });
const summary = vm.runInNewContext(`${model()}\nrunLogSummary`, {});
const lineOf = vm.runInNewContext(`${model()}\nrunLogLine`, {});

// ---------- AC1: the same terminal box as a build log ----------

const css = () => styles();
const decls = sel => [...css().matchAll(new RegExp(`^\\s*${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`, 'gm'))]
  .flatMap(m => [...m[1].matchAll(/([\w-]+)\s*:\s*([^;]+)/g)].map(d => [d[1], d[2].trim()]));
const decl = (sel, name) => (decls(sel).filter(([k]) => k === name).pop() || [])[1];

test('0459 AC1: the log box has the build log\'s black background, light text, four-sided border and corners, in both looks', () => {
  for (const name of ['background', 'color', 'border', 'color-scheme']) {
    assert.ok(decl('.q .log', name), `the build log has ${name}`);
    assert.equal(decl('.foreman .run-log', name), decl('.q .log', name), name);
  }
  for (const kind of ['at', 'msg', 'fail']) assert.equal(decl(`.foreman .run-log .${kind}`, 'color'), decl(`.q .log .${kind}`, 'color'), `.${kind}`);
  assert.match(css(), /\.foreman \.run-log \{ border-radius: 12px; \}|, \.foreman \.run-log[,\s][^{]*\{ border-radius: 12px; \}/, 'its 12 px corners');
  assert.doesNotMatch(css(), /\[data-theme[^{]*\.run-log[^{]*\{/, 'no look has a rule of its own for it');
  assert.equal(decl('.foreman .run-log', 'overflow-y'), 'auto', 'it scrolls');
  assert.equal(decl('.foreman ol.run-log', 'font'), decl('.q .log', 'font'), 'the build log\'s font');
});

// ---------- AC2: each line laid out as a build log's ----------

test('0459 AC2: a line\'s time is in a column of its own with its text after it, and a line with no time starts under the text', async () => {
  const p = await opened(['10:17:22 Shipped 0457.', 'speck run will try it again once main has a new commit.', 'an old line from before 0460']);
  const rows = list(p).children;
  assert.deepEqual(rows.map(r => r.className), ['ln msg timed', 'ln msg', 'ln msg']);
  const at = rows[0].children[0];
  assert.equal(at.className, 'at');
  assert.equal(at.textContent, '10:17:22 ');
  assert.equal(rows[0].textContent, '10:17:22 0457 shipped');
  assert.ok(rows.slice(1).every(r => !r.children.some(c => c.className === 'at')), 'no time column on a line with none');
  assert.match(css(), /\.foreman \.run-log \.ln \{ display: block; padding-left: 9ch;/, 'the text past a column for the time');
  assert.match(css(), /\.foreman \.run-log \.ln\.timed \{ text-indent: -9ch; \}/, 'the time pulled back into its column, on the first row only');
  assert.match(decl('.foreman .run-log', 'white-space'), /pre-wrap/, 'a long line wraps');
  assert.equal(decl('.foreman .run-log', 'overflow-wrap'), 'anywhere');
});

// ---------- AC3: short summaries ----------

const SESSION = '8e7e50ba-3ede-4362-b6de-8e47775cbe50';
const FORMS = [
  [`Launched 0457 (session ${SESSION}). Log: speck/.cache/runs/0457.log`, '0457 build started'],
  ['0457 build exited with code 0.', '0457 build finished'],
  ['0457 build exited with code 1.', '0457 build failed (code 1)'],
  ['0457 build exited with code 137.', '0457 build failed (code 137)'],
  ['Shipping 0457: speck ship 0457 --auto. Log: speck/.cache/runs/0457.ship.log', '0457 shipping'],
  ['Shipped 0457.', '0457 shipped'],
  ['0189 didn\'t ship: Merging speck/0189-stream-an-open-build-log into main hit a conflict, so nothing was shipped and main is unchanged. Conflicting files: scripts/panel.mjs.', '0189 didn\'t ship: a conflict'],
  ['0195 didn\'t ship: Tests failed on the approved branch, so nothing was shipped. Failing tests: 0176 AC1: with 200 finished builds', '0195 didn\'t ship: tests failed'],
  ['0195 didn\'t ship: it was stopped', '0195 didn\'t ship: it was stopped'],
  ['0195 didn\'t ship: the ship of it ran on far longer than anyone would expect it to and gave no reason why at all', '0195 didn\'t ship'],
  [`Resumed 0457 (session ${SESSION}). Log: speck/.cache/runs/0457.log`, '0457 build resumed'],
  [`0165 build (session ${SESSION}, process 1496391) stopped.`, '0165 build stopped'],
];

test('0459 AC3: each kind of line speck run writes shows as its short summary', () => {
  for (const [line, want] of FORMS) assert.equal(summary(line), want, line);
});

test('0459 AC3: any other line shows its first sentence, cut to 48 characters with …, starting with a ticket id it names', () => {
  assert.equal(summary('speck run stopped. 1 build is still running: 0457.'), 'speck run stopped.');
  assert.equal(summary('speck run: watching for ready tickets every 5s, up to 4 builds at once.'), 'speck run: watching for ready tickets every 5s,…');
  assert.equal(summary('speck run: watching for ready tickets every 5s, up to 4 builds at once.').length, 48);
  assert.equal(summary('0457 is already being built, so speck run won\'t launch it.'), '0457 is already being built, so speck run won\'t…');
  assert.equal(summary('The ship of 0457 is still running.'), '0457 The ship of 0457 is still running.');
  assert.equal(summary('Shipping is on hold until main passes.'), 'Shipping is on hold until main passes.');
  assert.equal(summary('speck run\'s code has changed, so it\'s switching to the new code.').startsWith('speck run\'s code has changed'), true, 'speck run is a name, not a command');
  assert.equal(summary(''), '');
});

test('0459 AC3: no summary is over 48 characters or shows a session id, a process id, a file path or a command', () => {
  const others = [
    `0457 build (session ${SESSION}) stopped unexpectedly, so speck run is resuming it once.`,
    `0457 stopped (session ${SESSION}).`,
    'Opening 0457\'s pull request: speck pr 0457. Log: speck/.cache/runs/0457.pr.log',
    'Run `speck ship 0457 --auto` to ship it.',
    'remote: Permission to luroai/speck.git denied to pandabast.',
    'fatal: unable to access \'https://github.com/luroai/speck.git/\': The requested URL returned error: 403',
    '0251 build ended by `speck stop`.',
    'Conflicting files: scripts/panel.mjs, docs/brief.md.',
    'See run.log for more.',
    '0457 is blocked, with its branch and work kept. Resume its session, or run /speck-build 0457, to carry on.',
    '0457 build (process 4242) stopped.',
  ];
  for (const line of [...FORMS.map(f => f[0]), ...others]) {
    const s = summary(line);
    assert.ok(s.length <= 48, `${s.length} characters: ${s}`);
    assert.doesNotMatch(s, /[0-9a-f]{8}-[0-9a-f]{4}-/i, `a session id: ${s}`);
    assert.doesNotMatch(s, /\b(?:process|pid)\s*\d+|\b\d{5,}\b/i, `a process id: ${s}`);
    assert.doesNotMatch(s, /\/|\b[\w-]+\.(?:mjs|js|md|log|git)\b/, `a file path: ${s}`);
    assert.doesNotMatch(s, /`|\bspeck (?:ship|pr|stop|run \d)|--auto/, `a command: ${s}`);
  }
});

test('0459 AC3: a build that failed or a ticket that didn\'t ship shows in the log\'s failure colour', () => {
  assert.equal(lineOf('10:00:00 0457 build exited with code 2.').kind, 'fail');
  assert.equal(lineOf('0457 didn\'t ship: it was stopped').kind, 'fail');
  assert.equal(lineOf('10:00:00 Shipped 0457.').kind, 'msg');
  assert.deepEqual(JSON.parse(JSON.stringify(lineOf('10:00:00 Shipped 0457.'))), { at: '10:00:00 ', text: '0457 shipped', kind: 'msg' });
});

// ---------- AC4: the newest at the bottom ----------

// A page with the pop-up open on the log, as /api/run-log gives it (newest first), and the lines it's given next.
function popPage(responses, made = () => {}) {
  let focused = null;
  const p = fakePage(responses, { scrollX: 0, scrollY: 0, scrollTo() {} }, { made: n => { n.focus = () => { focused = n; }; made(n); } });
  for (const id of ['foreman', 'run']) p.byId(id).focus = () => { focused = p.byId(id); };
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  return p;
}
async function opened(oldestFirst, more = [], made) {
  const p = popPage([state({ run_log: '1' }), { lines: oldestFirst.slice().reverse(), stamp: '1' }, ...more], made);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  return p;
}
const list = p => p.all(p.byId('foreman')).find(n => /\brun-log\b/.test(n.className || '') && n.tagName === 'ol');
const shown = p => list(p).children.map(li => li.textContent);
const tick = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
const next = (n, lines) => [state({ run_log: String(n) }), { lines: lines.slice().reverse(), stamp: String(n) }];
const numbered = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `line ${from + i}${(from + i) % 7 === 0 ? ' long enough to wrap' : ''}`);

// A browser's layout for the log box: 200 px high, its top 100 px down the window, each line 20 px, or 40 px when it wraps.
function layout() {
  const tall = li => (/long/.test(li.textContent) ? 40 : 20);
  return n => {
    const box = () => (n.className === 'run-log' ? n : n.parentNode);
    const before = li => li.parentNode.children.slice(0, li.parentNode.children.indexOf(li)).reduce((h, x) => h + tall(x), 0);
    Object.defineProperty(n, 'scrollHeight', { configurable: true, get: () => (n.className === 'run-log' ? n.children.reduce((h, li) => h + tall(li), 0) : 0) });
    Object.defineProperty(n, 'clientHeight', { configurable: true, get: () => (n.className === 'run-log' ? 200 : 0) });
    let top = 0;
    Object.defineProperty(n, 'scrollTop', { configurable: true, get: () => Math.min(top, Math.max(0, n.scrollHeight - n.clientHeight)), set: v => { top = Math.max(0, Math.min(v, Math.max(0, n.scrollHeight - n.clientHeight))); } });
    n.getBoundingClientRect = () => {
      if (n.className === 'run-log') return { top: 100, bottom: 300, left: 0, right: 0 };
      if (n.tagName === 'li' && n.parentNode) { const at = 100 + before(n) - box().scrollTop; return { top: at, bottom: at + tall(n), left: 0, right: 0 }; }
      return { top: 0, bottom: 0, left: 0, right: 0 };
    };
  };
}
const firstSeen = p => { const li = list(p).children.find(x => x.getBoundingClientRect().bottom > 100); return { text: li.textContent, top: li.getBoundingClientRect().top }; };

test('0459 AC4: the oldest line is at the top and the newest at the bottom, and a new one is added at the bottom with the next board', async () => {
  const p = await opened(['first', 'second'], next(2, ['first', 'second', 'third']));
  assert.deepEqual(shown(p), ['first', 'second']);
  await tick(p);
  assert.deepEqual(shown(p), ['first', 'second', 'third']);
});

test('0459 AC4: still the latest 200 lines, from the server, the oldest at the top', async () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0459-'));
  fs.writeFileSync(path.join(runs, 'run.log'), `${Array.from({ length: 250 }, (_, i) => `line ${i + 1}`).join('\n')}\n`);
  const given = runLogTail(runs).lines;
  assert.equal(RUN_LOG_LINES, 200);
  const p = await opened(given.slice().reverse());
  const rows = shown(p);
  assert.equal(rows.length, 200);
  assert.equal(rows[0], 'line 51');
  assert.equal(rows[199], 'line 250');
});

test('0459 AC4: the box opens scrolled to the newest line, and follows each new one while the reader is at the bottom', async () => {
  let lay = () => {};
  const p = await opened(numbered(1, 50), next(2, numbered(1, 53)), n => lay(n));
  lay = layout();
  for (const n of p.all(p.byId('foreman'))) lay(n);
  const box = list(p);
  box.scrollTop = box.scrollHeight;
  assert.equal(box.scrollTop, box.scrollHeight - 200, 'at the bottom');
  await tick(p);
  assert.equal(list(p), box, 'the same box, so it keeps its scroll');
  assert.equal(box.scrollTop, box.scrollHeight - 200, 'scrolled on to the newest line');
  assert.equal(shown(p).at(-1), 'line 53');
});

test('0459 AC4: a newly drawn box is scrolled to its newest line', async () => {
  let at = null;
  const made = n => { Object.defineProperty(n, 'scrollHeight', { configurable: true, get: () => 999 }); Object.defineProperty(n, 'scrollTop', { configurable: true, get: () => at ?? 0, set: v => { if (n.className === 'run-log') at = v; } }); };
  await opened(['a', 'b'], [], made);
  assert.equal(at, 999);
});

for (const [what, before, after] of [
  ['a full log of 200 lines, the oldest going as one comes in', numbered(1, 200), numbered(2, 201)],
  ['a log under 200 lines, with wrapped lines coming in', numbered(1, 50), numbered(1, 56)],
]) {
  test(`0459 AC4: a reader scrolled up stays where they are as new lines come in: ${what}`, async () => {
    let lay = () => {};
    const p = await opened(before, next(2, after), n => lay(n));
    lay = layout();
    for (const n of p.all(p.byId('foreman'))) lay(n);
    list(p).scrollTop = 500;
    const was = firstSeen(p);
    await tick(p);
    assert.equal(shown(p).at(-1), after.at(-1));
    const now = firstSeen(p);
    assert.equal(now.text, was.text, 'the same line is the first they see');
    assert.equal(now.top, was.top, 'in the same place');
  });
}

test('0459 AC4: a log started afresh, sharing no lines with the one drawn, leaves a scrolled-up reader\'s scroll as it is', async () => {
  let lay = () => {};
  const p = await opened(numbered(1, 100), next(2, ['new run', 'another']), n => lay(n));
  lay = layout();
  for (const n of p.all(p.byId('foreman'))) lay(n);
  list(p).scrollTop = 500;
  await tick(p);
  assert.deepEqual(shown(p), ['new run', 'another']);
  assert.equal(list(p).scrollTop, 0, 'only as far as the shorter log lets it be');
});

test('0459 AC4: with no run.log, the box says speck run hasn\'t written anything yet, without asking the server', async () => {
  const p = popPage([state()]);
  await p.settle();
  p.press(p.byId('run'));
  await p.settle();
  const box = p.all(p.byId('foreman')).find(n => /\brun-log\b/.test(n.className || ''));
  assert.ok(box, 'the log box');
  assert.equal(box.textContent, 'speck run hasn\'t written anything yet.');
  assert.equal(p.calls.filter(c => c.url === '/api/run-log').length, 0);
});

test('0459 AC4: the page asks only /api/run-log for the log, which reads only run.log (0415)', () => {
  const script = fs.readFileSync(new URL('../templates/panel.js', import.meta.url), 'utf8');
  assert.deepEqual([...script.matchAll(/fetch\('(\/api\/run-log[^']*)'/g)].map(m => m[1]), ['/api/run-log']);
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0459-'));
  fs.writeFileSync(path.join(runs, 'other.log'), 'not the log\n');
  assert.deepEqual(runLogTail(runs), { lines: null, stamp: null });
});
