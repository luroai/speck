import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0602: a ticket's build log and its live log read like the Pipeline log: flat, in the panel's own colours and type.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, styles, fullViewOf } from './support/panel.mjs';
import { NAME, logPage } from './support/build-log.mjs';

const building = (id = '0001') => T(id, 'building', { started: new Date().toISOString(), build_running: true });
const LOG = { text: '09:00:00 Starting.\nand its next line\n09:00:01 → Bash: npm test\n09:00:02 ✗ npm test failed', truncated: false, build: 2, at: 0 };
const cls = n => (n.className || '').split(' ');
const pop = p => p.byId('foreman');
const view = p => p.byId('full-ticket');
const liveLog = p => p.all(view(p)).find(n => cls(n).includes('log'));
// A row's text, past its time
const textOf = r => r.textContent.replace(/^\d\d:\d\d:\d\d /, '').replace(/\n$/, '');
const button = (p, root, text) => p.all(root).find(n => n.tagName === 'button' && n.textContent === text);
async function opened(log = LOG, made) {
  const p = logPage([building()], () => log, made);
  await p.settle();
  p.source().emit('open');
  p.source().emit('stream', NAME);
  p.source().emit('message', '1');
  await p.settle();
  await fullViewOf(p, '0001');
  return p;
}
async function poppedUp(log, made) {
  const p = await opened(log, made);
  p.press(button(p, view(p), 'Full log'));
  await p.settle();
  return p;
}
// The declarations of every rule (outside or inside @media) whose selector list has exactly `sel`.
function rules(sel) {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return css.split('}').map(c => c.split('{')).filter(parts => parts.length >= 2)
    .filter(parts => parts.at(-2).split(',').map(s => s.trim()).includes(sel)).map(parts => parts.at(-1));
}
const has = (sel, decl) => assert.ok(rules(sel).some(b => b.includes(decl)), `${sel} has ${decl}`);
const none = (sel, re) => assert.ok(rules(sel).every(b => !re.test(b)), `${sel} has no ${re}`);

// ---------- AC1: a full view like the Pipeline log ----------

test('0602 AC1: the build log opens as a full view, with a back link to the ticket, its heading and no Close', async () => {
  const p = await poppedUp();
  assert.match(pop(p).className, /\blog-view\b/);
  const back = p.all(pop(p)).find(n => n.className === 'back');
  assert.equal(back.attrs.role, 'link');
  assert.equal(back.textContent, '0001');
  assert.equal(back.attrs['aria-label'], 'Back to 0001');
  assert.equal(p.all(pop(p)).find(n => n.className === 'title').textContent, '0001 build log');
  assert.equal(pop(p).attrs['aria-label'], '0001 build log');
  assert.equal(button(p, pop(p), 'Close'), undefined);
  assert.equal(p.all(pop(p)).filter(n => n.className === 'close').length, 0);
});

test('0602 AC1: the back link takes you back to the ticket, with the focus on the button that opened it', async () => {
  const p = await poppedUp();
  p.press(p.all(pop(p)).find(n => n.className === 'back'));
  await p.settle();
  assert.equal(pop(p).hidden, true);
  assert.equal(view(p).hidden, false, 'the ticket is still open');
  assert.equal(p.focused(), button(p, view(p), 'Full log'));
});

test('0602 AC1: no style gives the build log a dark frame, a red dot or a bordered Close', () => {
  for (const sel of ['#foreman .top', '#foreman .fm-body', '#foreman .top .title::before', '#foreman .close', '#foreman .close:hover'])
    none(sel, /--bezel|--speck-red/);
  assert.equal(rules('#foreman .close').length, 0, 'no Close in the build log');
});

// ---------- AC2: rows in the Pipeline log's style ----------

test('0602 AC2: each line is a row with its time in a span of its own, then its text, its kind on the row', async () => {
  const p = await poppedUp();
  const rows = p.all(pop(p)).filter(n => n.tagName === 'li');
  assert.deepEqual(rows.map(r => r.className), ['ln msg timed', 'ln msg', 'ln tool timed', 'ln fail timed']);
  assert.deepEqual(rows.map(textOf), ['Starting.', 'and its next line', '→ Bash: npm test', '✗ npm test failed']);
  assert.equal(p.all(rows[0]).find(n => n.className === 'at').textContent, '09:00:00 ');
});

for (const [where, row, at] of [
  ['build log', '#foreman.log-view .run-log .ln', '#foreman.log-view .run-log .ln .at'],
  ['live log', '.q .log .ln', '.q .log .at'],
]) {
  test(`0602 AC2: the ${where}'s time is mono and muted in a column of its own, and its text in the panel's font past it`, () => {
    has(row, 'padding-left: 74px');
    none(row, /text-indent/);
    has(at, 'width: 66px');
    has(at, 'margin: 0 8px 0 -74px');
    has(at, 'font-family: var(--font-mono)');
    has(at, 'color: var(--muted)');
    has(row, 'font-family: var(--font-ui)');
    has(row, 'color: var(--text)');
  });
}

test('0602 AC2: a tool call is muted and a failure is in the bad colour, in both logs, from colours both looks set', () => {
  for (const pre of ['#foreman.log-view .run-log', '.q .log']) {
    has(`${pre} .ln.tool`, 'color: var(--muted)');
    has(`${pre} .ln.fail`, 'color: var(--bad)');
  }
  const css = styles();
  assert.doesNotMatch(css, /\.(foreman \.run-log|q \.log)[^{]*\{[^}]*--log-/, 'none of the old terminal colours');
});

// ---------- AC3: the live log in the full view ----------

test('0602 AC3: the live log is flat in the view, not a black box, and the live section is no box either', () => {
  none('.q .log', /--log-bg|color-scheme: dark|background/);
  none('.q .log', /border: /);
  has('#full-ticket .q.live', 'border: 0');
  has('#full-ticket .q.live', 'padding: 0');
});

test('0602 AC3: the live log\'s lines are rows as the build log\'s, newest last', async () => {
  const p = await opened();
  const rows = liveLog(p).children;
  assert.deepEqual(rows.map(r => r.className), ['ln msg timed', 'ln msg', 'ln tool timed', 'ln fail timed']);
  assert.deepEqual(rows.map(textOf), ['Starting.', 'and its next line', '→ Bash: npm test', '✗ npm test failed']);
  assert.equal(liveLog(p).textContent, LOG.text, 'its text is the log\'s, newlines and all');
});

test('0602 AC3: new lines arrive at the bottom, the last one written further in place, and it stays at the newest', async () => {
  const layout = n => {
    let top = 0;
    const tall = () => (cls(n).includes('log') ? n.children.length * 20 : 0);
    Object.defineProperty(n, 'scrollHeight', { configurable: true, get: tall });
    Object.defineProperty(n, 'clientHeight', { configurable: true, get: () => (cls(n).includes('log') ? 40 : 0) });
    Object.defineProperty(n, 'scrollTop', { configurable: true, get: () => top, set: v => { top = Math.max(0, Math.min(v, Math.max(0, tall() - 40))); } });
  };
  const p = await opened(LOG, layout);
  const box = liveLog(p);
  box.scrollTop = box.scrollHeight;
  p.source().emit('log', JSON.stringify({ id: '0001', build: 2, at: 1, drop: 1, lines: ['09:00:02 ✗ npm test failed twice', '09:00:03 Trying again.'] }));
  assert.equal(liveLog(p), box, 'the same box');
  assert.deepEqual(box.children.slice(-2).map(textOf), ['✗ npm test failed twice', 'Trying again.']);
  assert.equal(box.scrollTop, box.scrollHeight - 40, 'the newest line in view');
});

// ---------- AC4: Full log and Stop build as secondary buttons ----------

test('0602 AC4: Full log and Stop build have the secondary style: a 1 px line border, 10 px corners, the text colour, 44 px tall', async () => {
  const p = await opened();
  const row = button(p, view(p), 'Full log').parentNode;
  assert.ok(cls(row).includes('live-buttons'));
  assert.ok(button(p, row, 'Stop build'), 'Stop build in the same row');
  for (const sel of ['#full-ticket .live-buttons .full-open', '#full-ticket .live-buttons .stop-build']) {
    has(sel, 'border: 1px solid var(--line)');
    has(sel, 'border-radius: 10px');
    has(sel, 'color: var(--text)');
    has(sel, 'min-height: 44px');
  }
});
