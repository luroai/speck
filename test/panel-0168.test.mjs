import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0168: the builder badge on each in-flight ticket's Build card ----------

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
// Each in-flight ticket's pose, its badge's accessible name, its sentence and its stage's name.
const SHOWS = {
  '0401': ['type', 'The builder is writing code', 'Writing tests and code', 'Build'],
  '0402': ['check', 'The builder is checking its own work', 'Checking its own work', 'Self-check'], // its own loops since 0169
  '0403': ['review', 'The builder is with the reviewer', 'Codex is reviewing · round 2', 'Review 2'],
  '0404': ['still', 'The builder is paused', 'Paused', 'Review'],
  '0405': ['wait', 'The builder is waiting for you', 'Approved · waiting for you to ship it', 'Ship'],
  '0406': ['bad', 'The builder needs you', 'Blocked · it has a question for you', 'Build'],
  '0407': ['bad', 'The builder needs you', 'The build stopped', 'Build'],
  '0408': ['type', 'The builder is shipping', 'Shipping', 'Ship'],
};
const FLIGHT = Object.keys(SHOWS);

function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(' ');
const script = () => page().match(/<script>([\s\S]*?)<\/script>/)[1];

test('0168 AC1: each in-flight card has a badge row under its title: the badge, then the sentence and the stage\'s name', async () => {
  const p = fake();
  await p.settle();
  for (const [id, [pose, , sentence, stage]] of Object.entries(SHOWS)) {
    const top = topOf(rowOf(p, id)), rows = top.children.filter(n => n.className === 'badgerow');
    assert.equal(rows.length, 1, `${id}: one badge row`);
    assert.ok(top.children.indexOf(rows[0]) > top.children.findIndex(n => n.className === 'line'), `${id}: under the title`);
    const [badge, text] = rows[0].children;
    assert.equal(badge.tagName, 'canvas', `${id}: the badge is drawn`);
    assert.deepEqual(classes(badge), ['badge', pose], `${id}: its pose`);
    assert.equal(text.className, 'badgetext');
    assert.deepEqual(text.children.map(n => [n.className.split(' ')[0], n.textContent]), [['say', sentence], ['stage', stage]], `${id}: the sentence and the stage`);
    assert.equal(top.children[top.children.length - 1].className, 'sub', `${id}: the timer is still last in the top row`);
    assert.equal(p.all(top).filter(n => /\b(enso|orbit|speck|dots|dot)\b/.test(n.className || '')).length, 0, `${id}: no ensō, speck or stage dots`);
  }
  assert.doesNotMatch(page(), /\.enso\b|\.orbit\b|\.dot\.now|@keyframes orbit/, 'the ensō and the dots are gone from the page');
});

test('0168 AC2: the badge plays the laptop loop while an agent is at work, from the design reference', async () => {
  const p = fake();
  await p.settle();
  const at = FLIGHT.filter(id => SHOWS[id][0] === 'type');
  assert.deepEqual(at, ['0401', '0408'], 'building and shipping (self-check and review too until 0169)');
  const js = script();
  const loop = js.match(/ {4}type\(g, t\) \{([\s\S]*?)\n {4}\},/)[1];
  assert.match(loop, /const CY = 2800/, 'a 2.8 second loop');
  assert.match(js, /const GL = '\{\}<>;\/=\(\)\[\]\*'/, 'the code characters');
  assert.match(loop, /GL\[/, 'which fly off while it types');
  assert.match(loop, /rr\(g, -24, -16, 48, 16, 3\)/, 'the laptop lid');
  assert.match(loop, /g\.arc\(0, -8, 3\.4, -2\.0, -2\.35 \+ Math\.PI \* 2\)/, 'its ensō sticker');
  assert.match(loop, /box\(g,/, 'the finished block that pops out');
});

test('0168 AC3: waiting for you, the builder waves a flag; blocked or stopped, a "?"; paused, it stands still', async () => {
  const p = fake();
  await p.settle();
  const pose = id => classes(topOf(rowOf(p, id)).children.find(n => n.className === 'badgerow').children[0])[1];
  assert.equal(pose('0405'), 'wait');
  assert.equal(pose('0406'), 'bad');
  assert.equal(pose('0407'), 'bad');
  assert.equal(pose('0404'), 'still');
  const js = script();
  assert.match(js.match(/ {4}wait\(g, t\) \{([\s\S]*?)\n {4}\},/)[1], /flag:[\s\S]*hop\(/, 'a flag and a hop');
  assert.match(js.match(/ {4}bad\(g, t\) \{([\s\S]*?)\n {4}\},/)[1], /q: \{/, 'a question mark');
  assert.match(js, /fillText\('\?', 0, 0\)/);
  assert.match(js, /const edge = pose === 'wait' \? C\.wait : pose === 'bad' \? C\.bad : C\.line;/, 'the tile\'s edge');
});

test('0168 AC3: an approved ticket auto-ship will ship isn\'t waiting for you, and one whose auto-ship failed needs you', async () => {
  const p = fake([
    T('0501', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], auto_ship: true, build_running: true }),
    T('0502', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], ship: { running: false, auto: true, started: ago(30), ended: ago(20), message: 'No.' } }),
    T('0503', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], auto_ship: false }),
  ]);
  await p.settle();
  const badge = id => topOf(rowOf(p, id)).children.find(n => n.className === 'badgerow').children[0];
  assert.equal(classes(badge('0501'))[1], 'still');
  assert.equal(badge('0501').attrs['aria-label'], 'The builder is waiting');
  assert.equal(classes(badge('0502'))[1], 'bad');
  assert.equal(classes(badge('0503'))[1], 'wait');
});

test('0168 AC4: the badge is an image named for what it shows, and ready tickets have none', async () => {
  const p = fake();
  await p.settle();
  for (const [id, [, label]] of Object.entries(SHOWS)) {
    const badge = topOf(rowOf(p, id)).children.find(n => n.className === 'badgerow').children[0];
    assert.equal(badge.attrs.role, 'img', id);
    assert.equal(badge.attrs['aria-label'], label, id);
  }
  for (const id of ['0409', '0410']) assert.equal(p.all(rowOf(p, id)).filter(n => /\b(badge|badgerow|say|stage)\b/.test(n.className || '')).length, 0, `${id}: no badge`);
});

test('0168 AC5: the badge reads its colours from the panel\'s tokens', () => {
  const js = script();
  for (const k of ['text', 'panel', 'accent', 'line', 'idea', 'bad', 'raise']) assert.match(js.match(/function badgeColours\(\) \{([\s\S]*?)\n\}/)[1], new RegExp(`v\\('${k}'\\)`), k);
  assert.doesNotMatch(js.match(/const BADGE = \(\(\) => \{([\s\S]*?)\n\}\)\(\);/)[1], /#[0-9a-f]{3,6}\b|rgb\(/i, 'no colour of its own');
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const stub = theme => `(() => {
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
async function withPanel(fn, { width = 1280, theme = 'light', motion = 'no-preference', scale = 1 } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: scale, mobile: width < 700 });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const CARD = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c.match(/\\d+/g).slice(0, 3).map(Number); })()`;
const LOOK = id => `(() => {
  const card = ${CARD(id)}, rect = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
  const cs = getComputedStyle(card);
  return { card: rect(card), padRight: parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth), padLeft: parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth),
    line: rect(card.querySelector('.top .line')), title: rect(card.querySelector('.top .title')), badge: rect(card.querySelector('.badge')),
    say: rect(card.querySelector('.say')), stage: rect(card.querySelector('.stage')), sub: rect(card.querySelector('.top .sub')) };
})()`;
// How many of a badge's pixels are in each colour: its pixels as [r, g, b] for each opaque one.
const PIXELS = id => `(() => { const c = ${CARD(id)}.querySelector('canvas.badge'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, out = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) out.push([d[i], d[i + 1], d[i + 2]]); return { w: c.width, px: out }; })()`;
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2);
const FRAME = id => `${CARD(id)}.querySelector('canvas.badge').toDataURL()`;

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1280]) {
    test(`0168 AC1 and AC5: at ${width} px in the ${theme} look, the badge row sits under a full-width title, with nothing overflowing`, skip, async () => {
      await withPanel(async b => {
        for (const id of FLIGHT) {
          const l = await b.js(LOOK(id));
          assert.ok(Math.abs(l.badge.width - 56) < 0.5 && Math.abs(l.badge.height - 56) < 0.5, `${id}: the badge is ${l.badge.width}×${l.badge.height}`);
          assert.ok(Math.abs(l.badge.left - (l.card.left + l.padLeft)) < 1, `${id}: at the left of its row`);
          assert.ok(l.badge.top >= l.title.bottom - 0.5, `${id}: below the title`);
          assert.ok(Math.abs(l.line.right - (l.card.right - l.padRight)) < 1, `${id}: the title's row keeps the card's full width`);
          // Beside the badge: a sentence that wraps on a phone makes the row taller, with the badge in its middle.
          for (const k of ['say', 'stage']) assert.ok(l[k].left >= l.badge.right, `${id}: its ${k} is right of the badge`);
          const mid = (l.badge.top + l.badge.bottom) / 2;
          assert.ok(l.say.top < mid && l.stage.bottom > mid, `${id}: the sentence and the stage's name are beside the badge`);
          assert.ok(l.stage.top >= l.say.bottom - 0.5, `${id}: the stage's name under the sentence`);
          assert.ok(l.sub.left >= l.say.right && l.sub.top < mid && l.sub.bottom > mid, `${id}: the timer at the right of the badge's row`);
          for (const k of ['badge', 'say', 'stage', 'sub', 'line']) assert.ok(l[k].left >= l.card.left - 0.5 && l[k].right <= l.card.right + 0.5, `${id}: its ${k} overflows the card`);
        }
        assert.equal(await b.js(`document.documentElement.scrollWidth <= innerWidth`), true, 'the page doesn\'t scroll sideways');
        // AC5: drawn in the look's own colours: the tile, the ink, the speck as its eye, and the edge for its state. With
        // reduced motion, so each badge holds a pose and the eye isn't caught mid-blink.
        const colour = {};
        for (const k of ['raise', 'text', 'accent', 'line', 'idea', 'bad']) colour[k] = await b.js(RGB(`var(--${k})`));
        const has = (px, c) => px.filter(p => near(p, c)).length;
        for (const id of ['0401', '0404', '0405', '0406']) {
          const { px } = await b.js(PIXELS(id));
          for (const k of ['raise', 'text', 'accent']) assert.ok(has(px, colour[k]) > 4, `${id}: has its ${k}`);
        }
        const edge = async id => b.js(`(() => { const c = ${CARD(id)}.querySelector('canvas.badge'), s = c.width / 56; return [...c.getContext('2d').getImageData(Math.round(28 * s), Math.round(1.2 * s), 1, 1).data].slice(0, 3); })()`);
        assert.ok(near(await edge('0405'), colour.idea), `waiting: a purple edge, ${await edge('0405')}`);
        assert.ok(near(await edge('0406'), colour.bad), `blocked: a crimson edge, ${await edge('0406')}`);
        assert.ok(near(await edge('0407'), colour.bad), 'stopped: a crimson edge');
        assert.ok(near(await edge('0401'), colour.line), 'at work: the line colour');
        assert.ok(has((await b.js(PIXELS('0406'))).px, colour.bad) > 20, 'blocked: a crimson "?"');
      }, { width, theme, scale: 2, motion: 'reduce' });
    });
  }
}

test('0168 AC2 to AC4: in a real browser, a badge moves unless its build is paused, and nothing moves with reduced motion', skip, async () => {
  const frames = async b => Object.fromEntries(await Promise.all(FLIGHT.map(async id => [id, await b.js(FRAME(id))])));
  await withPanel(async b => {
    const first = await frames(b);
    await new Promise(r => setTimeout(r, 450));
    const then = await frames(b);
    for (const id of FLIGHT) assert.equal(first[id] !== then[id], id !== '0404', `${id}: ${id === '0404' ? 'still' : 'moves'}`);
  });
  await withPanel(async b => {
    const first = await frames(b);
    const blank = await b.js(`(() => { const c = document.createElement('canvas'); c.width = c.height = 56; return c.toDataURL(); })()`);
    for (const id of FLIGHT) assert.notEqual(first[id], blank, `${id}: a still pose is drawn`);
    await new Promise(r => setTimeout(r, 450));
    const then = await frames(b);
    for (const id of FLIGHT) assert.equal(then[id], first[id], `${id}: nothing moves with reduced motion`);
  }, { motion: 'reduce' });
});

test('0168 AC4: in a real browser, the badge is an image with its name, and a change of look redraws a still one', skip, async () => {
  await withPanel(async b => {
    assert.equal(await b.js(`${CARD('0401')}.querySelector('canvas.badge').getAttribute('aria-label')`), 'The builder is writing code');
    const before = await b.js(FRAME('0404'));
    await b.js(`document.querySelector('.theme') ? document.querySelector('.theme').click() : setLook('dark')`);
    await b.until(`${FRAME('0404')} !== ${JSON.stringify(before)}`, 'the paused badge in the new look');
  });
});

test('0168 AC5: in a real browser, a zoom draws a badge that holds still again at the new size, so it stays sharp', skip, async () => {
  await withPanel(async b => {
    const width = id => b.js(`${CARD(id)}.querySelector('canvas.badge').width`);
    assert.equal(await width('0404'), 56);
    // A browser's zoom to 200%: twice the pixels per CSS pixel, and half the CSS width.
    await b.send('Emulation.setDeviceMetricsOverride', { width: 640, height: 450, deviceScaleFactor: 2, mobile: false });
    await b.until(`${CARD('0404')}.querySelector('canvas.badge').width === 112 && ${CARD('0406')}.querySelector('canvas.badge').width === 112`, 'the still badges at twice the pixels');
  }, { motion: 'reduce' });
});

test('0168 AC5: in a real browser, no pose reaches past the tile\'s rounded edge at any point in its loop', skip, async () => {
  await withPanel(async b => {
    const outside = await b.js(`(() => {
      badgeColours();
      const c = document.createElement('canvas'); c.width = c.height = 224; const g = c.getContext('2d'), out = {};
      const edge = new Path2D(); edge.roundRect(56 - 1.4, 56 - 1.4, 112 + 2.8, 112 + 2.8, 25.4); // the tile's edge and its line, at twice the size
      for (const pose of Object.keys(BADGE.POSES).filter(k => k !== 'review')) { // the reviewer slides in past it: test/panel-0169.test.mjs
        out[pose] = 0;
        for (let t = 0; t < 8400; t += 23) {
          g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 224, 224); g.setTransform(2, 0, 0, 2, 56, 56);
          BADGE.draw(g, pose, t, false);
          g.setTransform(1, 0, 0, 1, 0, 0);
          const d = g.getImageData(0, 0, 224, 224).data;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 24) { const x = (i / 4) % 224 + .5, y = Math.floor(i / 4 / 224) + .5; if (!g.isPointInPath(edge, x, y)) out[pose]++; }
        }
      }
      return out;
    })()`, 60000);
    assert.deepEqual(outside, { type: 0, check: 0, wait: 0, bad: 0, still: 0 });
  });
});
