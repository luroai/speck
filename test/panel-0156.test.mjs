import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0156: a running build's progress shown with the speck going round an ensō ----------

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

function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const find = (p, row, re) => p.all(row).filter(n => re.test(n.className || ''));
const classes = n => (n.className || '').split(' ');

test('0156 AC1: each in-flight ticket has an ensō with its timer in its top row, beside the id and title, and no five-part bar', async () => {
  const p = fake();
  await p.settle();
  for (const t of TICKETS.filter(x => x.status !== 'ready')) {
    const row = rowOf(p, t.id), top = topOf(row);
    const enso = top.children.filter(n => classes(n).includes('enso'));
    assert.equal(enso.length, 1, `${t.id}: one ensō in the top row`);
    assert.deepEqual(enso[0].children.map(n => n.className), ['ring', 'orbit'], `${t.id}: a ring and the speck's orbit`);
    assert.equal(enso[0].children[1].children[0].className, 'speck');
    assert.ok(top.children.some(n => n.className === 'sub' && /\d\d:\d\d/.test(n.textContent)), `${t.id}: the timer`);
    assert.ok(top.children.some(n => n.className === 'line'), `${t.id}: beside the id and title`);
    assert.equal(find(p, row, /\bstages\b/).length, 0, `${t.id}: no five-part bar`);
  }
  for (const id of ['0409', '0410']) {
    const row = rowOf(p, id);
    assert.equal(find(p, row, /\b(enso|stages|dots|say|speck)\b/).length, 0, `${id}: a ready ticket shows no progress`);
  }
  assert.doesNotMatch(page(), /\.stages\b|@keyframes sweep/, 'the old bar and its sweep are gone');
});

test('0156 AC2: the speck moves only while an agent is at work on the ticket', async () => {
  const p = fake();
  await p.settle();
  for (const t of TICKETS.filter(x => x.status !== 'ready')) {
    const enso = topOf(rowOf(p, t.id)).children.find(n => classes(n).includes('enso'));
    assert.equal(classes(enso).includes('moving'), MOVING.includes(t.id), `${t.id}: ${MOVING.includes(t.id) ? 'moves' : 'rests'}`);
  }
  const css = page();
  const motion = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n  \}/)[1];
  assert.match(motion, /\.enso\.moving \.orbit \{[^}]*animation: orbit 7s linear infinite/, 'one lap every 7 seconds, only with motion allowed');
  assert.doesNotMatch(css.replace(motion, ''), /animation: orbit/, 'nowhere else');
});

test('0156 AC2: a ship the panel itself started moves the speck and says "Shipping"', async () => {
  const tickets = [T('0405', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)] })];
  const never = new Promise(() => {});
  const p = fakePage([], {
    fetch: async (url, opts) => (opts && opts.method === 'POST' ? never
      : { ok: true, status: 200, json: async () => (/\/pack$/.test(url) ? { pack: '# Pack\n' } : /\/log$/.test(url) ? { text: '' } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
    confirm: () => true,
  });
  await p.settle();
  assert.equal(find(p, rowOf(p, '0405'), /\bsay\b/)[0].textContent, 'Approved · waiting for you to ship it');
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
  assert.equal(find(p, row, /\bsay\b/)[0].textContent, 'Shipping');
  assert.ok(classes(topOf(row).children.find(n => classes(n).includes('enso'))).includes('moving'));
});

test('0156 AC3: one plain sentence under the title says what is happening, in the card\'s state colour when it waits, is blocked or stopped', async () => {
  const p = fake();
  await p.settle();
  for (const [id, [text, tone]] of Object.entries(SAYS)) {
    const top = topOf(rowOf(p, id)), say = top.children.filter(n => classes(n).includes('say'));
    assert.equal(say.length, 1, `${id}: one sentence`);
    assert.equal(say[0].textContent, text, id);
    assert.equal(say[0].className, tone ? `say ${tone}` : 'say', `${id}: its colour`);
    assert.ok(top.children.indexOf(say[0]) > top.children.findIndex(n => n.className === 'line'), `${id}: under the title`);
  }
  const css = page();
  assert.match(css, /\.say\.bad \{ color: var\(--bad\); \}/);
  assert.match(css, /\.say\.to-ship \{ color: var\(--idea\); \}/);
  assert.match(css, /\.q \.top \.say \{[^}]*color: var\(--text\)/);
});

test('0156 AC3: a reviewer that isn\'t named is "The reviewer", and an approved ticket whose auto-ship failed waits in red', async () => {
  const p = fake([
    T('0501', 'reviewing', { started: ago(5), build_running: true, self_check: 'x' }),
    T('0502', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], ship: { running: false, auto: true, started: ago(30), ended: ago(20), message: 'No.' } }),
    T('0503', 'reviewing', { started: ago(5), reviewer: 'constructor' }),
  ]);
  await p.settle();
  const say = id => find(p, rowOf(p, id), /\bsay\b/)[0];
  assert.equal(say('0501').textContent, 'The reviewer is reviewing · round 1');
  assert.equal(say('0502').textContent, 'Approved · waiting for you to ship it');
  assert.equal(say('0502').className, 'say bad');
  assert.equal(say('0503').textContent, 'Constructor is reviewing · round 1');
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
    assert.equal(find(p, row, /\bdot now\b/)[0].className, 'dot now to-ship', `${id}: the current dot is purple`);
    assert.equal(find(p, row, /\bstage\b/)[0].className, 'stage to-ship', `${id}: the stage's name is purple`);
  }
  const shipping = rowOf(p, '0603');
  assert.equal(find(p, shipping, /\bsay\b/)[0].className, 'say', 'shipping: the normal text colour');
  assert.equal(find(p, shipping, /\bdot now\b/)[0].className, 'dot now moving', 'shipping: at work, in the in-flight colour');
});

test('0156 AC4: five stage dots under the sentence, then the current stage\'s name; the current one pulses only while an agent works', async () => {
  const p = fake();
  await p.settle();
  const expect = {
    '0401': [['now', '', '', '', ''], 'Build'], '0402': [['d', 'now', '', '', ''], 'Self-check'], '0403': [['d', 'd', 'now', '', ''], 'Review 2'],
    '0405': [['d', 'd', 'd', 'd', 'now'], 'Ship'], '0406': [['now', '', '', '', ''], 'Build'],
  };
  for (const t of TICKETS.filter(x => x.status !== 'ready')) {
    const top = topOf(rowOf(p, t.id)), dots = top.children.filter(n => n.className === 'dots');
    assert.equal(dots.length, 1, `${t.id}: one row of dots`);
    assert.ok(top.children.indexOf(dots[0]) > top.children.findIndex(n => classes(n).includes('say')), `${t.id}: under the sentence`);
    const ds = dots[0].children.filter(n => classes(n).includes('dot'));
    assert.deepEqual(ds.map(n => n.title.replace(/ \d+$/, '')), ['Build', 'Self-check', 'Review', 'Approve', 'Ship'], t.id);
    const now = ds.filter(n => classes(n).includes('now'));
    assert.equal(now.length, 1, `${t.id}: one current stage`);
    assert.equal(dots[0].children[5].textContent, now[0].title, `${t.id}: the current stage's name after the dots`);
    assert.ok(classes(dots[0].children[5]).includes('stage'));
    assert.equal(classes(now[0]).includes('moving'), MOVING.includes(t.id), `${t.id}: pulses only while an agent works`);
    const tone = SAYS[t.id][1];
    if (tone) assert.ok(classes(now[0]).includes(tone), `${t.id}: in the state colour`);
    if (expect[t.id]) {
      assert.deepEqual(ds.map(n => (classes(n).includes('d') ? 'd' : classes(n).includes('now') ? 'now' : '')), expect[t.id][0], t.id);
      assert.equal(dots[0].children[5].textContent, expect[t.id][1], t.id);
    }
  }
  const css = page();
  const motion = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n  \}/)[1];
  assert.match(motion, /\.dot\.now\.moving \{[^}]*animation:/, 'the pulse is only with motion allowed');
  assert.doesNotMatch(css.replace(motion, ''), /\.dot\.now\.moving/, 'nowhere else');
  assert.match(css, /\.dot\.d \{ background: var\(--ok\); \}/, 'finished stages are green');
  assert.match(css, /\.q \.top \.dot \{[^}]*background: var\(--line\)/, 'later stages are grey');
  assert.match(css, /\.dot\.now \{[^}]*box-shadow:/, 'the current one has a halo');
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
  const enso = card.querySelector('.enso'), ring = card.querySelector('.enso .ring'), speck = card.querySelector('.enso .speck'), rs = getComputedStyle(ring);
  return { card: rect(card), enso: rect(enso), sub: rect(card.querySelector('.top .sub')), title: rect(card.querySelector('.top .title')), id: rect(card.querySelector('.top .id')),
    say: rect(card.querySelector('.say')), dots: rect(card.querySelector('.dots')), speck: rect(speck),
    ring: { width: parseFloat(rs.borderTopWidth), color: rs.borderTopColor, radius: rs.borderRadius, mask: rs.maskImage || rs.webkitMaskImage },
    speckColor: getComputedStyle(speck).backgroundColor, sayColor: getComputedStyle(card.querySelector('.say')).color,
    dotColors: [...card.querySelectorAll('.dot')].map(n => getComputedStyle(n).backgroundColor),
    nowShadow: getComputedStyle(card.querySelector('.dot.now')).boxShadow };
})()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0156 AC1-AC5: at ${width} px in the ${theme} look, the ensō, sentence and dots are laid out and coloured, with nothing overflowing`, skip, async () => {
      await withPanel(async b => {
        const colour = {};
        for (const k of ['accent', 'ok', 'run', 'bad', 'idea', 'text', 'line', 'faint']) colour[k] = await b.js(RGB(`var(--${k})`));
        const tones = { '': colour.run, bad: colour.bad, 'to-ship': colour.idea };
        for (const [id, [, tone]] of Object.entries(SAYS)) {
          const l = await b.js(LOOK(id));
          // AC1: about 112 px across, a thin neutral circle open at the top left, the timer inside, beside the id and title.
          assert.ok(Math.abs(l.enso.width - 112) < 1 && Math.abs(l.enso.height - 112) < 1, `${id}: the ensō is ${l.enso.width}×${l.enso.height}`);
          assert.ok(l.ring.width > 0 && l.ring.width <= 1.5, `${id}: a thin line, ${l.ring.width} px`);
          assert.equal(l.ring.color, colour.faint, `${id}: a neutral line`);
          assert.equal(l.ring.radius, '50%');
          assert.match(l.ring.mask, /conic-gradient/, `${id}: open at the top left`);
          assert.ok(l.sub.left >= l.enso.left && l.sub.right <= l.enso.right && l.sub.top >= l.enso.top && l.sub.bottom <= l.enso.bottom, `${id}: the timer is inside the ensō`);
          assert.ok(l.enso.left >= l.title.right - 0.5 && l.enso.top < l.title.bottom, `${id}: the ensō is beside the title`);
          // AC2: the speck is the accent red; resting, it sits at the top.
          assert.equal(l.speckColor, colour.accent, `${id}: the speck is red`);
          if (!MOVING.includes(id)) {
            const cx = (l.speck.left + l.speck.right) / 2, cy = (l.speck.top + l.speck.bottom) / 2;
            assert.ok(Math.abs(cx - (l.enso.left + l.enso.width / 2)) < 1 && Math.abs(cy - l.enso.top) < 1, `${id}: the speck rests at the top`);
          }
          // AC3: the sentence under the title, in the state colour or the text colour.
          assert.ok(l.say.top >= l.title.bottom - 0.5, `${id}: the sentence is under the title`);
          assert.equal(l.sayColor, tone ? tones[tone] : colour.text, `${id}: the sentence's colour`);
          // AC4: the dots under the sentence: green, then the current one in the state colour with a halo, then grey.
          assert.ok(l.dots.top >= l.say.bottom - 0.5, `${id}: the dots are under the sentence`);
          const now = l.dotColors.indexOf(tones[tone]);
          assert.ok(now >= 0, `${id}: the current dot is in the state colour`);
          l.dotColors.forEach((c, i) => assert.equal(c, i === now ? tones[tone] : i < now ? colour.ok : colour.line, `${id}: dot ${i}`));
          assert.notEqual(l.nowShadow, 'none', `${id}: the current dot has a halo`);
          // AC5: everything in the card stays inside it.
          for (const k of ['enso', 'say', 'dots', 'title', 'id']) assert.ok(l[k].left >= l.card.left - 0.5 && l[k].right <= l.card.right + 0.5, `${id}: its ${k} overflows the card`);
        }
        assert.equal(await b.js(`document.documentElement.scrollWidth <= innerWidth`), true, 'the page doesn\'t scroll sideways');
      }, { width, theme });
    });
  }
}

test('0156 AC2 and AC4: in a real browser, the speck laps about every 7 seconds and the current dot pulses only while an agent works, and nothing moves with reduced motion', skip, async () => {
  const ANIMS = `document.getAnimations().map(a => { const t = a.effect.target, card = t.closest('.q');
    return { id: card.querySelector('.id').textContent, what: t.classList.contains('orbit') ? 'orbit' : t.classList.contains('dot') ? 'dot' : t.className,
      duration: a.effect.getTiming().duration, state: a.playState }; }).filter(a => a.what === 'orbit' || a.what === 'dot')`;
  await withPanel(async b => {
    const anims = await b.js(ANIMS);
    assert.deepEqual([...new Set(anims.filter(a => a.what === 'orbit').map(a => a.id))].sort(), MOVING, 'the specks that go round');
    assert.deepEqual([...new Set(anims.filter(a => a.what === 'dot').map(a => a.id))].sort(), MOVING, 'the dots that pulse');
    for (const a of anims.filter(x => x.what === 'orbit')) assert.equal(a.duration, 7000, `${a.id}: a lap every 7 seconds`);
    // The speck really moves round.
    const at = () => b.js(`(() => { const r = ${CARD('0401')}.querySelector('.speck').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; })()`);
    const first = await at();
    await new Promise(r => setTimeout(r, 600));
    assert.notDeepEqual(await at(), first, 'the speck moved');
  });
  await withPanel(async b => {
    assert.deepEqual(await b.js(ANIMS), [], 'with reduced motion, nothing moves');
  }, { motion: 'reduce' });
});
