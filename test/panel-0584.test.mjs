import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0584: everything a Build card shows about a running or stopped build is also in the ticket's full view.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, T, queueRows } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';

const NAME = 'ab'.repeat(16);
const started = () => new Date(Date.now() - 600000).toISOString();
const building = (id, o = {}) => T(id, 'building', { started: started(), build_running: true, ...o });
const blocked = (id, o = {}) => T(id, 'blocked', { started: started(), blocked_question: 'Which one?', blocked_recommendation: 'The first', blocked_resumable: true, ...o });

// A page on a stream the test drives. `set` changes the board and sends it; `answer(url, opts)` answers a POST, or leaves it to the default.
async function page(tickets, { foreman, confirm = () => true, answer = null, globals = {} } = {}) {
  const { EventSource, sources } = manualSources();
  let board = { tickets, ideas: [], run: { on: true, pid: 1 }, run_log: '1', ...(foreman ? { foreman } : {}) }, seq = 1;
  const logs = {}, posts = [], asked = [], closed = [], confirms = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url);
    if (opts.method === 'POST') {
      posts.push({ url: u, opts });
      const a = answer && await answer(u, opts);
      return a || { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    const m = u.match(/^\/api\/tickets\/(\w+)\/log$/);
    if (m) { asked.push(m[1]); return { ok: true, status: 200, json: async () => logs[m[1]] || { text: '', truncated: false, build: 1, at: 1 } }; }
    const c = u.match(/^\/api\/tickets\/(\w+)\/log\/close$/);
    if (c) { closed.push(c[1]); return { ok: true, status: 200, json: async () => ({ ok: true }) }; }
    if (/\/api\/run-log$/.test(u)) return { ok: true, status: 200, json: async () => ({ lines: [] }) };
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(board)) };
  };
  let focused = null;
  const p = fakePage([], { fetch, EventSource, confirm: q => { confirms.push(q); return confirm(q); }, getSelection: () => ({ isCollapsed: true, rangeCount: 0 }), scrollX: 0, scrollY: 0, scrollTo() {}, ...globals },
    { made: n => { n.focus = () => { focused = n; }; } });
  for (const id of ['foreman', 'run', 'build-section', 'full-ticket']) p.byId(id).focus = () => { focused = p.byId(id); };
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = sel => (/\bmain\b/.test(sel) ? [p.byId('main-stand-in')] : []);
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  const source = () => sources[sources.length - 1];
  await p.settle();
  source().emit('open');
  source().emit('stream', NAME);
  source().emit('message', String(seq));
  await p.settle();
  return Object.assign(p, { logs, posts, asked, closed, confirms, source, focused: () => focused,
    set: async next => { board = { ...board, ...next }; source().emit('message', String(++seq)); await p.settle(); } });
}
const pane = p => p.byId('full-ticket');
const live = p => p.all(pane(p)).find(n => (n.className || '').split(' ').includes('live')) || null;
const inLive = (p, cls) => p.all(live(p)).find(n => (n.className || '').split(' ').includes(cls)) || null;
const logBox = p => inLive(p, 'log');
const button = (p, text) => p.all(live(p)).find(n => n.tagName === 'button' && n.textContent === text) || null;
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
// Opens the ticket's card and presses its Full ticket button, as the user does.
async function open(p, id) {
  if (!/\bopen\b/.test(rowOf(p, id).className)) { p.press(rowOf(p, id).children[0]); await p.settle(); }
  p.press(p.all(rowOf(p, id)).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
}
const closeCard = async (p, id) => { p.press(rowOf(p, id).children[0]); await p.settle(); };
const back = async p => { p.press(p.all(pane(p)).find(n => n.className === 'close')); await p.settle(); };

test('0584 AC1: a building ticket\'s full view shows where it is, for how long, its log, Full log and Stop build', async () => {
  const p = await page([building('0801')]);
  p.logs['0801'] = { text: '10:00:00 → Read a file', truncated: false, build: 1, at: 1 };
  await open(p, '0801');
  assert.match(inLive(p, 'live-now').textContent, /Writing tests and code/);
  assert.equal(inLive(p, 'stage').textContent, 'Build', 'the step it is at');
  assert.match(inLive(p, 'sub').textContent, /^\d/, 'for how long');
  assert.match(logBox(p).textContent, /Read a file/);
  assert.ok(button(p, 'Full log'));
  assert.ok(button(p, 'Stop build'));
  assert.equal(pane(p).children[1].children.at(-1), live(p), 'under the track and facts');
  assert.equal(logBox(p).tagName, 'div', 'not a pre, which the full view\'s own rule for code blocks would restyle');
});

test('0584 AC1: a reviewing ticket says which round and who reviews it', async () => {
  const p = await page([T('0801', 'reviewing', { started: started(), build_running: true, reviewer: 'codex', review_model: 'gpt-x', self_check: 'no changes', rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 1, tokens: 1 }], review_running: 1 })]);
  await open(p, '0801');
  assert.match(inLive(p, 'live-now').textContent, /gpt-x is reviewing · round 1/);
  assert.equal(inLive(p, 'stage').textContent, 'Review 1');
});

test('0584 AC1: a paused build says so, with the command that carries it on', async () => {
  const p = await page([building('0801', { paused: true, paused_at: new Date().toISOString() })]);
  await open(p, '0801');
  assert.ok(p.all(live(p)).some(n => n.className === 'act' && n.textContent === 'Paused · carry it on with speck play 0801'));
  assert.match(inLive(p, 'sub').textContent, /^Paused · /);
});

test('0584 AC1: Full log opens the build log\'s pop-up, and closing it leaves the focus on that button', async () => {
  const p = await page([building('0801')]);
  await open(p, '0801');
  p.press(button(p, 'Full log'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false);
  p.press(p.all(p.byId('foreman')).find(n => n.className === 'close'));
  await p.settle();
  assert.equal(p.focused(), button(p, 'Full log'));
});

test('0584 AC1: the Build log row still gets the focus back when it was the one pressed', async () => {
  const p = await page([building('0801')]);
  await open(p, '0801');
  const row = () => p.all(pane(p)).find(n => n.className === 'pane-row' && n.textContent === 'Build log');
  p.press(row());
  await p.settle();
  p.press(p.all(p.byId('foreman')).find(n => n.className === 'close'));
  await p.settle();
  assert.equal(p.focused(), row());
});

test('0584 AC1: no Stop build for a build speck run isn\'t running, as on the card', async () => {
  const p = await page([building('0801', { build_running: false })]);
  await open(p, '0801');
  assert.equal(button(p, 'Stop build'), null);
  assert.ok(button(p, 'Full log'));
});

test('0584: a build that stopped says why, as its card does', async () => {
  const p = await page([building('0801', { build_running: false, build_exit: { code: 1, signal: null, at: new Date().toISOString(), message: 'It fell over.' } })]);
  await open(p, '0801');
  const card = rowOf(p, '0801');
  for (const cls of ['act bad', 'question exit']) {
    const of = root => p.all(root).find(n => n.className === cls);
    assert.ok(of(card), `${cls} is on the card`);
    assert.equal(of(live(p)).textContent, of(card).textContent, cls);
  }
});

test('0584 AC2: a blocked ticket\'s full view shows its question and Go with the recommendation', async () => {
  const p = await page([blocked('0801')]);
  await open(p, '0801');
  assert.match(inLive(p, 'question').textContent, /Which one\?/);
  assert.ok(p.all(inLive(p, 'question')).some(n => n.tagName === 'button' && n.textContent === 'Go with the recommendation'));
  assert.ok(p.all(live(p)).some(n => n.className === 'act' && n.textContent === 'Waiting for you. Answer the question, then run /speck-build 0801'));
});

test('0584 AC2: its engineering manager\'s question has the Answer box and the Answer and Dismiss buttons', async () => {
  const p = await page([blocked('0801')], { foreman: { name: 'Virgil', agent: { asks: [{ id: '0801', question: 'Carry on?' }] } } });
  await open(p, '0801');
  const ask = inLive(p, 'foreman-ask');
  assert.match(ask.textContent, /Virgil asks you: Carry on\?/);
  assert.ok(inLive(p, 'ask-answer'));
  assert.deepEqual(p.all(ask).filter(n => n.tagName === 'button').map(n => n.textContent), ['Answer', 'Dismiss']);
});

test('0584 AC2: a ready ticket with a manager\'s question shows just that, with no log', async () => {
  const p = await page([T('0801', 'ready')], { foreman: { agent: { asks: [{ id: '0801', question: 'Why did it end?' }] } } });
  await open(p, '0801');
  assert.ok(inLive(p, 'foreman-ask'));
  assert.equal(logBox(p), null);
  assert.equal(inLive(p, 'live-now'), null);
});

test('0584: a ready ticket with no question has no live section', async () => {
  const p = await page([T('0801', 'ready')]);
  await open(p, '0801');
  assert.equal(live(p), null);
});

test('0584 AC3: what it shows follows the board while the full view is open, with the log box and the sections kept', async () => {
  const p = await page([building('0801')]);
  await open(p, '0801');
  const box = logBox(p), body = pane(p).children[2];
  await p.set({ tickets: [building('0801', { paused: true, paused_at: new Date().toISOString() })] });
  assert.ok(p.all(live(p)).some(n => n.textContent === 'Paused · carry it on with speck play 0801'));
  assert.equal(logBox(p), box, 'the same log box');
  assert.equal(pane(p).children[2], body);
  await p.set({ tickets: [blocked('0801')] });
  assert.match(inLive(p, 'question').textContent, /Which one\?/);
  assert.equal(button(p, 'Stop build'), null, 'a blocked build has no Stop');
  assert.equal(logBox(p), box);
});

test('0584 AC3: when the track and facts are drawn again the live section moves under them, keeping its log box', async () => {
  const rounds = [{ round: 1, reviewer: 'codex', verdict: 'request_changes', seconds: 1, tokens: 1 }]; // from the start, so the review pack row doesn't change
  const p = await page([building('0801', { rounds })]);
  await open(p, '0801');
  const box = logBox(p), first = pane(p).children[1];
  await p.set({ tickets: [T('0801', 'reviewing', { started: started(), build_running: true, self_check: 'no changes', rounds, review_running: 2 })] });
  assert.notEqual(pane(p).children[1], first, 'drawn again');
  assert.equal(pane(p).children[1].children.at(-1), live(p));
  assert.equal(logBox(p), box);
});

test('0584 AC3: a ticket that starts while it is open gets its live section and log', async () => {
  const p = await page([T('0801', 'ready')]);
  await open(p, '0801');
  await closeCard(p, '0801');
  const was = p.asked.length;
  await p.set({ tickets: [building('0801')] });
  assert.ok(logBox(p));
  assert.equal(p.asked.length, was + 1, 'its log is asked for');
});

test('0584 AC3: new log lines reach the open full view', async () => {
  const p = await page([building('0801')]);
  p.logs['0801'] = { text: 'first', truncated: false, build: 1, at: 1 };
  await open(p, '0801');
  p.source().emit('log', JSON.stringify({ id: '0801', build: 1, at: 2, drop: 0, lines: ['second'] }));
  await p.settle();
  assert.match(logBox(p).textContent, /first\s*second/);
  assert.match(p.all(rowOf(p, '0801')).find(n => (n.className || '').split(' ').includes('log')).textContent, /first\s*second/, 'and the card\'s');
});

test('0584 AC3: its log still follows after the card behind it closes, and stops once nothing shows it', async () => {
  const p = await page([building('0801')]);
  p.logs['0801'] = { text: 'first', truncated: false, build: 1, at: 1 };
  await open(p, '0801');
  await closeCard(p, '0801');
  assert.deepEqual(p.closed, [], 'the full view still shows it');
  p.source().emit('log', JSON.stringify({ id: '0801', build: 1, at: 2, drop: 0, lines: ['second'] }));
  await p.settle();
  assert.match(logBox(p).textContent, /second/);
  await back(p);
  assert.deepEqual(p.closed, ['0801']);
});

test('0584 AC3: closing the full view leaves an open card\'s log followed', async () => {
  const p = await page([building('0801')]);
  await open(p, '0801');
  await back(p);
  assert.deepEqual(p.closed, []);
});

test('0584 AC3: a full view reached with its card closed loads the log, and the stream asks again after a reconnect', async () => {
  const p = await page([building('0801'), T('0802', 'ready', { after: ['0801'], waiting_on: ['0801'] })]);
  await open(p, '0802');
  const chip = p.all(pane(p)).find(n => n.tagName === 'button' && (n.attrs?.['aria-label'] || '').startsWith('Go to ticket 0801'));
  p.press(chip);
  await p.settle();
  assert.deepEqual(p.asked.filter(id => id === '0801'), ['0801']);
  assert.ok(logBox(p));
  p.source().emit('stream', NAME);
  await p.settle();
  assert.equal(p.asked.filter(id => id === '0801').length, 2);
});

test('0584 AC3: its counter runs on the clock, and a review pack over it stops the log', async () => {
  const p = await page([building('0801')]);
  await open(p, '0801');
  await closeCard(p, '0801');
  const sub = inLive(p, 'sub');
  sub.textContent = 'stale';
  [...p.intervals.values()].find(i => i.ms === 1000).fn();
  assert.match(inLive(p, 'sub').textContent, /^\d/);
  await p.set({ tickets: [building('0801', { rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 1, tokens: 1 }] })] });
  p.press(p.all(pane(p)).find(n => n.className === 'pane-row' && n.textContent === 'Review pack'));
  await p.settle();
  assert.deepEqual(p.closed, ['0801']);
});

test('0584 AC3: text typed in the full view\'s Answer box survives a redraw, and reaches the card\'s', async () => {
  const foreman = { agent: { asks: [{ id: '0801', question: 'Carry on?' }] } };
  const p = await page([blocked('0801')], { foreman });
  await open(p, '0801');
  const box = inLive(p, 'ask-answer');
  box.value = 'Yes please';
  box.listeners.input();
  const card = p.all(rowOf(p, '0801')).find(n => n.className === 'ask-answer');
  assert.equal(card.value, 'Yes please', 'the card behind it matches');
  await p.set({ tickets: [blocked('0801', { blocked_question: 'Which two?' })] });
  assert.equal(inLive(p, 'ask-answer').value, 'Yes please');
});

test('0584 AC4: Stop build asks first and makes the card\'s request', async () => {
  let yes = false;
  const p = await page([building('0801')], { confirm: () => yes });
  await open(p, '0801');
  p.press(button(p, 'Stop build'));
  await p.settle();
  assert.deepEqual(p.posts, [], 'cancelling changes nothing');
  assert.match(p.confirms[0], /^Stop 0801's build\? It ends the build/);
  yes = true;
  p.press(button(p, 'Stop build'));
  await p.settle();
  assert.equal(p.posts[0].url, '/api/tickets/0801/stop');
  assert.ok(p.posts[0].opts.headers['X-Speck-Token'] !== undefined);
});

test('0584 AC4: a refused Stop build shows the server\'s reason in the full view', async () => {
  const p = await page([building('0801')], { answer: async () => ({ ok: false, status: 409, json: async () => ({ error: 'It has already ended.' }) }) });
  await open(p, '0801');
  p.press(button(p, 'Stop build'));
  await p.settle();
  assert.equal(inLive(p, 'stop-refused').textContent, 'It has already ended.');
});

test('0584 AC4: Go with the recommendation asks first, makes the card\'s request and shows a refusal', async () => {
  const p = await page([blocked('0801')], { answer: async () => ({ ok: false, status: 409, json: async () => ({ error: 'Too late.' }) }) });
  await open(p, '0801');
  p.press(button(p, 'Go with the recommendation'));
  await p.settle();
  assert.match(p.confirms[0], /^Go with the recommendation for 0801: "The first"\?/);
  assert.equal(p.posts[0].url, '/api/tickets/0801/recommendation');
  assert.equal(inLive(p, 'go-with-refused').textContent, 'Too late.');
});

test('0584 AC4: Answer sends the box\'s text, an empty one says to write it, and Dismiss asks first', async () => {
  const foreman = { agent: { asks: [{ id: '0801', question: 'Carry on?' }] } };
  const p = await page([blocked('0801')], { foreman });
  await open(p, '0801');
  p.press(button(p, 'Answer'));
  await p.settle();
  assert.equal(inLive(p, 'ask-refused').textContent, 'Write your answer in the box first.');
  assert.deepEqual(p.posts, []);
  const box = inLive(p, 'ask-answer');
  box.value = 'Yes';
  box.listeners.input();
  p.press(button(p, 'Answer'));
  await p.settle();
  assert.equal(p.posts[0].url, '/api/foreman/0801/answer');
  assert.deepEqual(JSON.parse(p.posts[0].opts.body), { text: 'Yes' });
  p.press(button(p, 'Dismiss'));
  await p.settle();
  assert.match(p.confirms[0], /^Dismiss speck's question about 0801: "Carry on\?"\?/);
  assert.equal(p.posts[1].url, '/api/foreman/0801/dismiss');
});

test('0584 AC4: the resume command\'s Copy button answers in the full view', async () => {
  const written = [];
  const p = await page([blocked('0801', { session: { id: 's1', cwd: '/w', resume_command: 'claude --resume {session}' } })],
    { globals: { navigator: { clipboard: { writeText: async t => { written.push(t); } } } } });
  await open(p, '0801');
  const copy = inLive(p, 'copy');
  assert.equal(copy.textContent, 'Copy');
  p.press(copy);
  await p.settle();
  assert.equal(copy.textContent, 'Copied', 'it answers on the button that was pressed');
  assert.deepEqual(written, ['cd /w && claude --resume s1']);
});

test('0584: drafts and shipped tickets have no live section', async () => {
  const p = await page([T('0802', 'draft', { after: [] }), T('0901', 'done', { started: started(), finished: new Date().toISOString() })]);
  p.press(p.all(p.byId('shaping')).find(n => /\bhead\b/.test(n.className || '')));
  await p.settle();
  p.press(p.all(p.byId('shaping')).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
  assert.equal(live(p), null);
  assert.deepEqual(p.asked, []);
});
