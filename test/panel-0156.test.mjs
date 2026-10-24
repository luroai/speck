import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles, nowOf } from './support/panel.mjs';

// ---------- 0156: a running build's progress shown with the speck going round an ensō ----------
// Since 0168 the builder badge stood in for the ensō and the stage dots (test/panel-0168.test.mjs); the sentence and the
// current stage's name stayed, beside the badge. 0416: the badge has gone, and they stay in words only.

const ago = s => new Date(Date.now() - s * 1000).toISOString();
// One ticket in each state an in-flight card can be in, and two ready ones.
const TICKETS = [
  T('0401', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' }),
  T('0402', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0403', 'reviewing', { title: 'Under review', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
    rounds: [{ ...round(2, 10), verdict: 'request_changes' }] }),
  T('0404', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0405', 'approved', { title: 'Waiting to ship', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') }),
  T('0406', 'blocked', { title: 'With a question', started: ago(300), blocked_question: 'A or B?' }),
  T('0407', 'building', { title: 'A build that stopped', started: ago(200), ...exitOf('It ended.') }),
  T('0408', 'approved', { title: 'Being shipped', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    ship: { running: true, started: ago(5) } }),
  T('0409', 'ready', { title: 'Ready' }),
  T('0410', 'ready', { title: 'Ready too', after: ['0409'], waiting_on: ['0409'] }),
];
const SAYS = {
  '0401': ['Writing tests and code', ''], '0402': ['Checking its own work', ''], '0403': ['Codex is reviewing · round 2', ''],
  '0404': ['Paused', ''], '0405': ['Approved · waiting for you to ship it', 'to-ship'], '0406': ['Blocked · it has a question for you', 'bad'],
  '0407': ['The build stopped', 'bad'], '0408': ['Shipping', ''],
};
const MOVING = ['0401', '0402', '0403', '0408'];
// 0434: while its builder or reviewer is at work, a grid of lights stands in for the sentence, which is its name.
const WORKING = ['0401', '0402', '0403'];
const sentenceIn = n => n.attrs?.['aria-label'] ?? n.textContent; // 0443: a closed card's long sentence is the accessible name of its short words

function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const find = (p, row, re) => p.all(row).filter(n => re.test(n.className || ''));
const classes = n => (n.className || '').split(' ');
// The stage a card's border shows while an agent is at work on it (0171), or null.
const atStage = row => (classes(row).find(c => c.startsWith('at-')) || '').slice(3) || null;

test('0156 AC1: each in-flight ticket has its progress in its top row (in words only since 0416), and no five-part bar', async () => {
  const p = fake();
  await p.settle();
  for (const t of TICKETS.filter(x => x.status !== 'ready')) {
    const row = rowOf(p, t.id), top = topOf(row);
    assert.equal(top.children.filter(n => classes(n)[0] === 'progress').length, 1, `${t.id}: one progress row in the top row`);
    assert.ok(find(p, top, /^sub$/).some(n => /\d\d:\d\d/.test(n.textContent)), `${t.id}: the timer`); // 0419: in the progress line
    assert.equal(find(p, row, /\b(stages|enso|dots)\b/).length, 0, `${t.id}: no five-part bar, ensō or dots`);
  }
  for (const id of ['0409', '0410']) {
    const row = rowOf(p, id);
    assert.equal(find(p, row, /\b(badge|progress|stages|say|stage)\b/).length, 0, `${id}: a ready ticket shows no progress`);
  }
  assert.doesNotMatch((page() + styles()), /\.stages\b|@keyframes sweep/, 'the old bar and its sweep are gone');
});

test('0156 AC2: the card shows the builder at work (the speck moved until 0168, the badge until 0416) only while an agent is at work on the ticket', async () => {
  const p = fake();
  await p.settle();
  for (const t of TICKETS.filter(x => x.status !== 'ready')) {
    // At work: its border shows its stage (0171).
    assert.equal(atStage(rowOf(p, t.id)) !== null, MOVING.includes(t.id), `${t.id}: ${MOVING.includes(t.id) ? 'at work' : 'not at work'}`);
  }
});

test('0156 AC2 and AC3: a ship the panel itself started says "Shipping" in the normal text colour (its badge went to work until 0416)', async () => {
  const tickets = [T('0405', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], ...exitOf('Done.') })]; // its build has exited
  const never = new Promise(() => {});
  const p = fakePage([], {
    fetch: async (url, opts) => (opts && opts.method === 'POST' ? never
      : { ok: true, status: 200, json: async () => (/\/pack$/.test(url) ? { pack: '# Pack\n' } : /\/log$/.test(url) ? { text: '' } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
    confirm: () => true,
  });
  await p.settle();
  assert.equal(sentenceIn(find(p, rowOf(p, '0405'), /\bsay\b/)[0]), 'Approved · waiting for you to ship it');
  assert.equal(find(p, rowOf(p, '0405'), /\bsay\b/)[0].className, 'say to-ship');
  // Open the card, then its review pack, and press Ship.
  p.press(topOf(rowOf(p, '0405')));
  await p.settle();
  p.press(p.all(rowOf(p, '0405')).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  const ship = p.all(p.byId('full-ticket')).find(n => n.tagName === 'button' && n.textContent === 'Ship');
  assert.ok(ship && !ship.disabled, 'a Ship button in the review pack');
  p.press(ship);
  await p.settle();
  const row = rowOf(p, '0405');
  // 0462: the open card says it in its Now cell
  assert.equal(nowOf(row).textContent, 'Shipping');
  assert.equal(nowOf(row).className, 'value now', 'no longer purple: it is at work, not waiting');
  assert.equal(find(p, row, /^stage\b/).length, 0, 'no stage\'s name while it ships (0201)');
});

test('0156 AC3: one plain sentence under the title says what is happening, in the card\'s state colour when it waits, is blocked or stopped', async () => {
  const p = fake();
  await p.settle();
  for (const [id, [text, tone]] of Object.entries(SAYS)) {
    const top = topOf(rowOf(p, id)), say = find(p, top, /^(say|lights)\b/);
    assert.equal(say.length, 1, `${id}: one sentence`);
    assert.equal(sentenceIn(say[0]), text, id);
    assert.equal(say[0].className, WORKING.includes(id) ? 'lights' : tone ? `say ${tone}` : 'say', `${id}: its colour`);
    assert.ok(top.children.findIndex(n => classes(n)[0] === 'progress') > top.children.findIndex(n => n.className === 'line'), `${id}: under the title`);
  }
  const css = styles();
  assert.match(css, /\.say\.bad \{ color: var\(--bad\); \}/);
  assert.match(css, /\.say\.to-ship \{ color: var\(--ok\); \}/);
  assert.match(css, /\.q \.top \.say \{[^}]*color: var\(--text\)/);
});

test('0156 AC3: a reviewer that isn\'t named is "The reviewer", and an approved ticket whose auto-ship failed waits in red', async () => {
  const p = fake([
    T('0501', 'reviewing', { started: ago(5), build_running: true, self_check: 'x' }),
    T('0502', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], ship: { running: false, auto: true, started: ago(30), ended: ago(20), message: 'No.' } }),
    T('0503', 'reviewing', { started: ago(5), reviewer: 'constructor' }),
  ]);
  await p.settle();
  const say = id => find(p, rowOf(p, id), /^(say|lights)\b/)[0];
  assert.equal(sentenceIn(say('0501')), 'The reviewer is reviewing · round 1');
  assert.equal(sentenceIn(say('0502')), 'Approved · waiting for you to ship it');
  assert.equal(say('0502').className, 'say bad');
  assert.equal(sentenceIn(say('0503')), 'Constructor is reviewing · round 1');
});

test('0156 AC3 and AC4: an approved ticket waits in purple whether or not its build has exited, and not while it ships', async () => {
  const p = fake([
    T('0601', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], build_running: true }), // no build_exit yet
    T('0602', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], build_exit: null }),
    T('0603', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], ship: { running: true, started: ago(5) } }),
  ]);
  await p.settle();
  for (const id of ['0601', '0602']) {
    const row = rowOf(p, id);
    assert.equal(find(p, row, /\bsay\b/)[0].className, 'say to-ship', `${id}: the sentence is purple`);
    assert.equal(find(p, row, /\bstage\b/)[0].className, 'stage to-ship', `${id}: the stage's name is purple`);
  }
  const shipping = rowOf(p, '0603');
  assert.equal(find(p, shipping, /\bsay\b/)[0].className, 'say', 'shipping: the normal text colour');
  assert.equal(find(p, shipping, /^stage\b/).length, 0, 'shipping: no stage\'s name (0201)');
});

test('0156 AC4: the current stage\'s name follows the sentence (its five dots went in 0168), in the state colour', async () => {
  const p = fake();
  await p.settle();
  const expect = { '0401': 'Build', '0402': 'Self-check', '0403': 'Review 2', '0404': 'Review', '0405': 'Ship', '0406': 'Build', '0407': 'Build' }; // 0408 ships, so it has no stage's name since 0201
  for (const [id, name] of Object.entries(expect)) {
    const text = find(p, rowOf(p, id), /^progress$/)[0];
    const parts = text.children.filter(n => n.className && n.className !== 'sep'); // 0419: separated by " · ", then the timer and the tags
    assert.deepEqual(parts.slice(0, 2).map(n => n.className.split(' ')[0]), [WORKING.includes(id) ? 'lights' : 'say', 'stage'], `${id}: the sentence (0434: or its grid of lights), then the stage`);
    const tone = SAYS[id][1];
    assert.equal(parts[1].textContent, name, id);
    assert.equal(parts[1].className, tone ? `stage ${tone}` : 'stage', `${id}: in the state colour`);
  }
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const stub = (theme, motion) => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify({ run: { on: true }, tickets: TICKETS, ideas: [] })};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;
async function withPanel(fn, { width = 1280, theme = 'light', motion = 'no-preference' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme, motion) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const CARD = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;
const LOOK = id => `(() => {
  const card = ${CARD(id)}, rect = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
  const line = card.querySelector('.top .progress');
  return { card: rect(card), line: rect(line), clips: getComputedStyle(line).overflowX === 'hidden' && getComputedStyle(line).textOverflow === 'ellipsis', title: rect(card.querySelector('.top .title')), id: rect(card.querySelector('.top .id')),
    say: rect(card.querySelector('.say, .lights')), stage: card.querySelector('.stage') && rect(card.querySelector('.stage')), shipAt: card.querySelector('.ship-at') && rect(card.querySelector('.ship-at')),
    sayColor: getComputedStyle(card.querySelector('.say, .lights')).color, stageColor: card.querySelector('.stage') && getComputedStyle(card.querySelector('.stage')).color };
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0156 AC3 to AC5: at ${width} px in the ${theme} look, the sentence and the stage's name (beside the badge from 0168 until 0416) are laid out and coloured, with nothing overflowing`, skip, async () => {
      await withPanel(async b => {
        const colour = {};
        for (const k of ['run', 'bad', 'ok', 'text']) colour[k] = await b.js(RGB(`var(--${k})`));
        const tones = { '': colour.run, bad: colour.bad, 'to-ship': colour.ok };
        for (const [id, [, tone]] of Object.entries(SAYS)) {
          const l = await b.js(LOOK(id));
          // AC3: the sentence under the title, in the state colour or the text colour.
          assert.ok(l.say.top >= l.title.bottom - 0.5, `${id}: the sentence is under the title`);
          assert.equal(l.sayColor, WORKING.includes(id) ? colour.run : tone ? tones[tone] : colour.text, `${id}: the sentence's colour (0434: its grid's, in the in-flight blue)`);
          // AC4: the stage's name after the sentence (0419: on its line, or the next when it doesn't fit), in the state
          // colour. 0201: a shipping card has none. 0434: nor how long its ship has run.
          if (id === '0408') {
            assert.equal(l.stage, null, `${id}: no stage's name`);
            assert.equal(l.shipAt, null, `${id}: no ship's time`);
          } else {
            assert.ok((Math.abs(l.stage.top - l.say.top) < 2 && l.stage.left >= l.say.right - 0.5) || l.stage.top >= l.say.bottom - 0.5, `${id}: the stage's name follows the sentence`);
            assert.equal(l.stageColor, tones[tone], `${id}: the stage's colour`);
          }
          // AC5: everything in the card stays inside it. 0434: a closed card's status line is one line, inside the card,
          // and cuts off with an ellipsis what doesn't fit, such as the stage after a long sentence on a phone.
          assert.ok(l.clips && l.line.left >= l.card.left - 0.5 && l.line.right <= l.card.right + 0.5, `${id}: its status line stays inside the card`);
          for (const k of id === '0408' ? ['say', 'title', 'id'] : ['say', 'stage', 'title', 'id']) {
            if (k === 'stage' && l.stage.right > l.line.right) continue; // cut off by the status line
            assert.ok(l[k].left >= l.card.left - 0.5 && l[k].right <= l.card.right + 0.5, `${id}: its ${k} overflows the card`);
          }
        }
        assert.equal(await b.js(`document.documentElement.scrollWidth <= innerWidth`), true, 'the page doesn\'t scroll sideways');
      }, { width, theme });
    });
  }
}

// The speck's lap and the dot's pulse went in 0168, and the badge that took their place in 0416: test/panel-0416.test.mjs
// checks that no card moves.
