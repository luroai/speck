import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, click, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0421: trim an open ticket's card ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const WT = '/home/me/projects/speck.worktrees/speck/0901-a-long-worktree-folder-name';
const ago = s => new Date(Date.now() - s * 1000).toISOString();
const state = () => ({
  tickets: [
    T('0901', 'building', { worktree: WT, build_running: true, paused: false, started: ago(60) }),
    T('0902', 'approved', { worktree: '/tmp/wt/0902' }),
    T('0903', 'reviewing', { worktree: '/tmp/wt/0903', build_running: false }),
    T('0904', 'blocked', { worktree: '/tmp/wt/0904', blocked_question: 'A or B?' }),
  ],
  ideas: [],
});
// A page whose server answers each stop with `answer()`, and whose confirm question gets `yes()`.
function page({ answer = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }), yes = () => true, asked = [], sent = [] } = {}) {
  return fakePage([], {
    fetch: async (url, opts) => {
      if (/\/stop$/.test(url)) { sent.push([url, opts.method]); return answer(); }
      return { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : state()) };
    },
    confirm: q => { asked.push(q); return yes(); },
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const shape = row => row.children.map(n => n.className);
const BUTTONS = ['full-open', 'stop-build'];
async function opened(p, id) { click(topOf(rowOf(p, id))); await p.settle(); return rowOf(p, id); }

test('0421 AC1: an open ticket\'s card doesn\'t show its worktree path', async () => {
  const p = page();
  await p.settle();
  for (const t of state().tickets) {
    const row = await opened(p, t.id);
    assert.ok(row.className.includes('open'), `${t.id}: open`);
    assert.ok(!shape(row).includes('act path'), `${t.id}: no worktree line`);
    assert.ok(!row.textContent.includes(t.worktree), `${t.id}: its worktree path isn't shown`);
    assert.ok(!/\bworktree\b/.test(row.textContent), `${t.id}: nothing about the worktree`);
  }
});

test('0421 AC2: Full ticket, Review pack and Stop build sit together, in that order, with Stop build last', async () => {
  const p = page();
  await p.settle();
  const building = shape(await opened(p, '0901'));
  const i = building.indexOf('full-open');
  assert.deepEqual(building.slice(i, i + 2), BUTTONS, 'Full ticket, then Stop build, side by side');
  const row = rowOf(p, '0901');
  assert.deepEqual(row.children.slice(i, i + 2).map(n => n.textContent), ['Full ticket', 'Stop build']);
  const approved = await opened(p, '0902'), at = shape(approved);
  const j = at.indexOf('full-open');
  assert.deepEqual(approved.children.slice(j, j + 2).map(n => n.textContent), ['Full ticket', 'Review pack']);
});

test('0421 AC3: Stop build still asks first, then stops the build, and shows why when the server refuses', async () => {
  // Cancelling the question sends nothing
  let asked = [], sent = [];
  let p = page({ yes: () => false, asked, sent });
  await p.settle();
  let stopBtn = (await opened(p, '0901')).children.find(n => n.className === 'stop-build');
  p.press(stopBtn);
  await p.settle();
  assert.equal(asked.length, 1, 'it asks first');
  assert.match(asked[0], /Stop 0901's build\?/);
  assert.deepEqual(sent, [], 'no answer, no stop');
  // Saying yes sends the stop
  asked = []; sent = [];
  p = page({ asked, sent });
  await p.settle();
  stopBtn = (await opened(p, '0901')).children.find(n => n.className === 'stop-build');
  p.press(stopBtn);
  await p.settle();
  assert.equal(asked.length, 1);
  assert.deepEqual(sent, [['/api/tickets/0901/stop', 'POST']]);
  assert.ok(!shape(rowOf(p, '0901')).includes('stop-refused'));
  // A refusal shows its reason on the card
  sent = [];
  p = page({ sent, answer: () => ({ ok: false, status: 409, json: async () => ({ error: 'That build has already ended.' }) }) });
  await p.settle();
  stopBtn = (await opened(p, '0901')).children.find(n => n.className === 'stop-build');
  p.press(stopBtn);
  await p.settle();
  const row = rowOf(p, '0901');
  assert.equal(sent.length, 1);
  const refused = row.children.find(n => n.className === 'stop-refused');
  assert.ok(refused, 'the refusal shows');
  assert.equal(refused.textContent, 'That build has already ended.');
});

// ---------- in a real browser, with a mouse ----------

const PANE = { run: { on: true }, ...state() };
const stub = `(() => {
  const STATE = ${JSON.stringify(PANE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each open card's buttons above its log: their text, height, top and left.
const BOXES = id => `(async () => {
  await document.fonts.ready;
  const card = [...document.querySelectorAll('#queue .q')].find(c => c.querySelector('.id').textContent === ${JSON.stringify(id)});
  return [...card.children].filter(n => n.matches('button')).map(b => { const r = b.getBoundingClientRect();
    return { text: b.textContent, height: r.height, top: r.top, left: r.left, right: r.right, box: ['Top', 'Left', 'Right'].map(e => getComputedStyle(b)['border' + e + 'Width']) }; });
})()`;

test('0421 AC2: with a mouse, an open card\'s buttons are small text buttons on one line, each no more than 44 px tall (0469), with Stop build last', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 4`, 'the panel');
    assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), false, 'a mouse is the main pointer');
    await b.js(openLane('build'));
    for (const [id, want] of [['0901', ['Full ticket', 'Stop build']], ['0902', ['Full ticket', 'Review pack']]]) {
      await b.js(`[...document.querySelectorAll('#queue .q')].find(c => c.querySelector('.id').textContent === '${id}').querySelector('.top').click(), true`);
      await b.until(`[...document.querySelectorAll('#queue .q.open')].some(c => c.querySelector('.id').textContent === '${id}')`, `${id} to open`);
      const got = await b.js(BOXES(id));
      assert.deepEqual(got.map(x => x.text), want, `${id}: its buttons, in order`);
      for (const x of got) assert.ok(x.height <= 44, `${id}: ${x.text} is ${x.height} px tall`); // 0469: the touch screen's 44 px
      assert.ok(got.every(x => Math.abs(x.top - got[0].top) < 1), `${id}: on one line: ${JSON.stringify(got)}`);
      for (let k = 1; k < got.length; k++) assert.ok(got[k].left >= got[k - 1].right, `${id}: ${got[k].text} after ${got[k - 1].text}`);
      for (const x of got) assert.ok(x.box.every(w => parseFloat(w) > 0), `${id}: ${x.text} is boxed (0428): ${x.box}`);
    }
  } finally { await b.close(); await stop(panel); }
});
