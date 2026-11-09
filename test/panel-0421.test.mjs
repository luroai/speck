import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, fullViewOf, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0421: trim an open ticket's card ----------
// 0585: a Build row no longer opens as a card: what these checked is in the ticket's full view.

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
const buttonsOf = (p, view, cls) => p.all(view).filter(n => n.tagName === 'button' && n.parentNode && n.parentNode.className === cls).map(n => n.textContent);
const stopOf = (p, view) => p.all(view).find(n => n.className === 'stop-build');

test('0421 AC1: an open ticket\'s full view doesn\'t show its worktree path', async () => {
  const p = page();
  await p.settle();
  for (const t of state().tickets) {
    const view = await fullViewOf(p, t.id);
    assert.ok(!view.hidden, `${t.id}: open`);
    assert.ok(!view.textContent.includes(t.worktree), `${t.id}: its worktree path isn't shown`);
    assert.ok(!/\bworktree\b/.test(view.textContent), `${t.id}: nothing about the worktree`);
  }
});

test('0421 AC2: Full log and Stop build sit together, with Stop build last, and Review pack and Build log are rows below', async () => {
  const p = page();
  await p.settle();
  const building = await fullViewOf(p, '0901');
  assert.deepEqual(buttonsOf(p, building, 'live-buttons'), ['Full log', 'Stop build'], 'Stop build last (0548: Full log before it)');
  assert.deepEqual(buttonsOf(p, building, 'pane-rows'), ['Build log']);
  const approved = await fullViewOf(p, '0902');
  assert.deepEqual(buttonsOf(p, approved, 'pane-rows'), ['Review pack', 'Build log']);
  assert.equal(stopOf(p, approved), undefined, 'an approved ticket has none');
});

test('0421 AC3: Stop build still asks first, then stops the build, and shows why when the server refuses', async () => {
  // Cancelling the question sends nothing
  let asked = [], sent = [];
  let p = page({ yes: () => false, asked, sent });
  await p.settle();
  let stopBtn = stopOf(p, await fullViewOf(p, '0901'));
  p.press(stopBtn);
  await p.settle();
  assert.equal(asked.length, 1, 'it asks first');
  assert.match(asked[0], /Stop 0901's build\?/);
  assert.deepEqual(sent, [], 'no answer, no stop');
  // Saying yes sends the stop
  asked = []; sent = [];
  p = page({ asked, sent });
  await p.settle();
  stopBtn = stopOf(p, await fullViewOf(p, '0901'));
  p.press(stopBtn);
  await p.settle();
  assert.equal(asked.length, 1);
  assert.deepEqual(sent, [['/api/tickets/0901/stop', 'POST']]);
  assert.ok(!p.all(p.byId('full-ticket')).some(n => n.className === 'stop-refused'));
  // A refusal shows its reason in the full view
  sent = [];
  p = page({ sent, answer: () => ({ ok: false, status: 409, json: async () => ({ error: 'That build has already ended.' }) }) });
  await p.settle();
  stopBtn = stopOf(p, await fullViewOf(p, '0901'));
  p.press(stopBtn);
  await p.settle();
  assert.equal(sent.length, 1);
  const refused = p.all(p.byId('full-ticket')).find(n => n.className === 'stop-refused');
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
// 0585: the buttons of an open full view's live section: their text, height, top and left.
const BOXES = () => `(async () => {
  await document.fonts.ready;
  const card = document.querySelector('#full-ticket .live-buttons');
  return [...card.children].filter(n => n.matches('button')).map(b => { const r = b.getBoundingClientRect();
    return { text: b.textContent, height: r.height, top: r.top, left: r.left, right: r.right, box: ['Top', 'Left', 'Right'].map(e => getComputedStyle(b)['border' + e + 'Width']) }; });
})()`;

test('0421 AC2: with a mouse, an open full view\'s buttons are small text buttons on one line, each no more than 44 px tall (0469), with Stop build last', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q .where').length === 4`, 'the panel');
    assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), false, 'a mouse is the main pointer');
    await b.js(openLane('build'));
    for (const [id, want] of [['0901', ['Full log', 'Stop build']], ['0902', ['Full log']]]) { // 0548: Full log
      await b.js(`[...document.querySelectorAll('#queue .q')].find(c => c.querySelector('.id').textContent === '${id}').querySelector('.top').click(), true`);
      await b.until(`!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .top .id').textContent === '${id}'`, `${id} to open`);
      const got = await b.js(BOXES());
      assert.deepEqual(got.map(x => x.text), want, `${id}: its buttons, in order`);
      for (const x of got) assert.ok(x.height <= 44, `${id}: ${x.text} is ${x.height} px tall`); // 0469: the touch screen's 44 px
      assert.ok(got.every(x => Math.abs(x.top - got[0].top) < 1), `${id}: on one line: ${JSON.stringify(got)}`);
      for (let k = 1; k < got.length; k++) assert.ok(got[k].left >= got[k - 1].right, `${id}: ${got[k].text} after ${got[k - 1].text}`);
      for (const x of got) assert.ok(x.box.every(w => parseFloat(w) > 0), `${id}: ${x.text} is boxed (0428): ${x.box}`);
      await b.js(`document.querySelector('#full-ticket .close').click()`);
      await b.until(`document.getElementById('full-ticket').hidden`, 'the full view to close');
    }
  } finally { await b.close(); await stop(panel); }
});
