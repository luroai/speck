import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, exitOf, queueRows, boardPage, openQueueRows, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { rules, tokens, get, rule } from './support/css.mjs';
import { looks, contrast, rgba } from './support/contrast.mjs';

// ---------- 0461: an open Build ticket's five steps as a track of coloured bars ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const KEYS = ['build', 'check', 'review', 'approve', 'ship'];
// Each step's bar colour, and its name's colour when it's the current step.
const BAR = { build: '--blue', check: '--inbox', review: '--yellow', approve: '--green', ship: '--purple' };
const NAME = { build: '--run', check: '--cyan-text', review: '--warn', approve: '--ok', ship: '--purple-text' };

const TICKETS = [
  T('0901', 'building', { started: ago(65), build_running: true }),
  T('0902', 'building', { started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0903', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }, { ...round(2, 10), verdict: 'request_changes' }] }),
  T('0904', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: true, ship: { running: true, auto: true, started: ago(5) } }),
  T('0905', 'blocked', { started: ago(300), self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?' }),
  T('0906', 'reviewing', { started: ago(200), self_check: 'no changes', ...exitOf('It ended.') }),
  T('0907', 'ready', {}),
];
const board = () => ({ run: { on: true }, ideas: [], tickets: TICKETS });
const page = () => boardPage([board()], { Date: stoppedClock(NOW) });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const trackOf = (p, n) => p.all(n).find(x => /^track\b/.test(x.className || '')) || null;
const has = (n, c) => (n.className || '').split(/\s+/).includes(c);

test('0461 AC1: an open in-flight ticket shows a track of its five steps under its title; closed and queued ones don\'t', async () => {
  const p = page();
  await p.settle();
  for (const id of TICKETS.map(t => t.id)) assert.equal(trackOf(p, card(p, id)), null, `${id}: closed, no track`);
  await openQueueRows(p);
  const labels = {
    '0901': ['Build', 'Self-check', 'Review', 'Approve', 'Ship'], '0903': ['Build', 'Self-check', 'Review 2', 'Approve', 'Ship'],
    '0904': ['Build', 'Self-check', 'Review 1', 'Approve', 'Ship'], '0905': ['Build', 'Self-check', 'Review 1', 'Approve', 'Ship'],
  };
  for (const id of ['0901', '0902', '0903', '0904', '0905', '0906']) {
    const c = card(p, id);
    assert.ok(has(c, 'open'), `${id}: open`);
    const top = c.children[0], track = trackOf(p, c);
    assert.ok(track, `${id}: a track`);
    assert.equal(top.children.indexOf(track), 1, `${id}: straight under its title`);
    assert.equal(track.children.length, 5, `${id}: five steps`);
    track.children.forEach((s, i) => assert.ok(has(s, KEYS[i]), `${id}: step ${i + 1} is ${KEYS[i]}`));
    if (labels[id]) assert.deepEqual(track.children.map(s => s.textContent), labels[id], `${id}: its steps' names`);
  }
  assert.ok(has(card(p, '0907'), 'open'), '0907: open');
  // 0463: an open queued one has a track too, with no step reached
  const queued = trackOf(p, card(p, '0907'));
  assert.ok(queued, '0907: queued, a track');
  assert.deepEqual(queued.children.map(s => s.className), KEYS.map(k => `step ${k}`), '0907: every step grey');
});

test('0461 AC2: each step is marked done, now or not reached, and a blocked or stopped ticket\'s track says so', async () => {
  const p = page();
  await p.settle();
  await openQueueRows(p);
  const want = { '0901': 'n----', '0902': 'dn---', '0903': 'ddn--', '0904': 'ddddn', '0905': 'ddn--', '0906': 'ddn--' };
  for (const [id, states] of Object.entries(want)) {
    const track = trackOf(p, card(p, id));
    const got = track.children.map(s => (has(s, 'done') ? 'd' : has(s, 'now') ? 'n' : '-')).join('');
    assert.equal(got, states, `${id}: its steps`);
    assert.equal(has(track, 'stopped'), id === '0905' || id === '0906', `${id}: stopped or not`);
  }
});

const all = rules();
// The last value the plain rules (in no at-rule) whose selector lists hold `sel` give `prop`.
const val = (sel, prop) => all.filter(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();

test('0461 AC2: a finished or current step\'s bar is in its step\'s colour, the current name in it and bold, the rest grey', () => {
  assert.deepEqual(tokens(val('.q .track .step', 'border-top')), ['--line'], 'a step not reached: grey bar');
  assert.deepEqual(tokens(val('.q .track .step', 'color')), ['--muted'], 'and grey name');
  for (const k of KEYS) {
    for (const state of ['done', 'now']) assert.deepEqual(tokens(val(`.q .track .step.${state}.${k}`, 'border-top-color')), [BAR[k]], `${k} ${state}: its bar`);
    assert.deepEqual(tokens(val(`.q .track .step.now.${k}`, 'color')), [NAME[k]], `${k} now: its name's colour`);
  }
  assert.equal(val('.q .track .step.now', 'font-weight'), '600', 'the current step\'s name is bold');
  assert.deepEqual(tokens(val('.q .track.stopped .step.now', 'border-top-color')), ['--bad'], 'blocked or stopped: crimson bar');
  assert.deepEqual(tokens(val('.q .track.stopped .step.now', 'color')), ['--bad'], 'and crimson name');
  // the stopped rule comes after every step's own, so it wins at the same specificity
  const at = sel => all.findIndex(r => !r.at.length && r.sel.split(',').map(s => s.trim()).includes(sel));
  for (const k of KEYS) assert.ok(at('.q .track.stopped .step.now') > at(`.q .track .step.now.${k}`), `crimson after ${k}`);
});

test('0461 AC2: the colours are Cursor\'s blue, cyan, yellow and green, and a purple well apart from the crimson', () => {
  const hue = hex => {
    const [r, g, b] = rgba(hex), max = Math.max(r, g, b), d = max - Math.min(r, g, b);
    if (d === 0) return 0;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const gap = (a, b) => { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d); };
  for (const [name, look] of Object.entries(looks())) {
    for (const [k, t] of [['purple bar', '--purple'], ['purple name', '--purple-text']]) {
      assert.ok(hue(look[t]) >= 250 && hue(look[t]) <= 290, `${name}: the ${k} ${look[t]} is purple`);
      assert.ok(gap(look[t], look['--bad']) >= 60, `${name}: the ${k} is ${gap(look[t], look['--bad']).toFixed(0)}° from --bad`);
    }
    assert.ok(Math.abs(hue(look['--cyan-text']) - hue(look['--inbox'])) < 3, `${name}: the cyan name is a shade of the inbox's cyan`);
  }
});

test('0461 AC3: a shipping ticket\'s border is purple; the other cards keep theirs', () => {
  assert.deepEqual(tokens(get(rule('.q.at-ship'), 'border-color')), ['--purple']);
  assert.equal(get(rule('.q.at-ship'), 'border-width'), '2px');
  for (const [sel, t] of [['.q.at-build', '--blue'], ['.q.at-check', '--inbox'], ['.q.at-review', '--yellow'], ['.q.to-ship', '--ok'], ['.q.blocked', '--bad']])
    assert.deepEqual(tokens(get(rule(sel), 'border-color')), [t], sel);
});

// What an open in-flight card can sit on: an open card's raised fill, a blocked one's tint, a waiting one's tint.
const CARDS = ['--raise', '--panel', '--bad-bg', '--ok-bg'];
test('0461 AC4: every bar reaches 3:1 and every name 0161\'s 7:1 against the card, in both looks', () => {
  assert.equal(val('.q .track .step', 'font-size'), '12px', 'the names are 12 px, so 7:1');
  for (const [name, look] of Object.entries(looks())) {
    for (const bg of CARDS) {
      for (const t of [...Object.values(BAR), '--bad']) assert.ok(contrast(look[t], look[bg]) >= 3, `${name}: bar ${t} on ${bg} is ${contrast(look[t], look[bg]).toFixed(2)}:1`);
      for (const t of [...Object.values(NAME), '--bad', '--muted', '--text']) assert.ok(contrast(look[t], look[bg]) >= 7, `${name}: name ${t} on ${bg} is ${contrast(look[t], look[bg]).toFixed(2)}:1`);
    }
  }
});

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each open card's track: its box and the card's, each step's box, whether its name is cut off, and the colours drawn.
const MEASURE = `(async () => {
  await document.fonts.ready;
  const rgb = s => { const m = s.match(/[\\d.]+/g).map(Number); return m.length > 3 ? m : m.concat(1); };
  return [...document.querySelectorAll('#queue .q.open')].map(c => {
    const t = c.querySelector('.track');
    if (!t) return { id: c.querySelector('.id').textContent, none: true };
    const box = t.getBoundingClientRect(), card = c.getBoundingClientRect();
    return { id: c.querySelector('.id').textContent, box: [box.left, box.right, box.height], card: [card.left, card.right], scroll: [t.scrollWidth, t.clientWidth],
      bg: rgb(getComputedStyle(c).backgroundColor),
      steps: [...t.children].map(s => { const b = s.getBoundingClientRect(), cs = getComputedStyle(s);
        return { text: s.textContent, top: b.top, left: b.left, right: b.right, width: b.width, height: b.height, cut: s.scrollWidth > s.clientWidth + 0.5,
          ellipsis: cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap' && cs.overflow === 'hidden', lineHeight: parseFloat(cs.lineHeight),
          bar: rgb(cs.borderTopColor), barWidth: parseFloat(cs.borderTopWidth), color: rgb(cs.color), weight: cs.fontWeight }; }) };
  });
})()`;
const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const drawn = (fg, bg) => { const f = [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])); const [x, y] = [lum(f), lum(bg)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('0461 AC4: in a real browser at 320 px, each track keeps to one row in both looks, its names cut short with … and its colours readable', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await b.js(openLane('build'));
    await b.js(`[...document.querySelectorAll('#queue .q .top')].forEach(t => t.click()), true`);
    await b.until(`document.querySelectorAll('#queue .q.open').length === ${TICKETS.length}`, 'every card open');
    for (const theme of ['light', 'dark']) {
      await b.js(`document.documentElement.dataset.theme = '${theme}', true`);
      const cards = await b.js(MEASURE);
      for (const c of cards) {
        assert.ok(!c.none, `${theme} ${c.id}: a track`);
        assert.ok(c.box[0] >= c.card[0] && c.box[1] <= c.card[1], `${theme} ${c.id}: inside its card`);
        assert.ok(c.scroll[0] <= c.scroll[1] + 0.5, `${theme} ${c.id}: nothing past the track (${c.scroll.join(' > ')})`);
        const [first] = c.steps;
        for (const s of c.steps) {
          assert.ok(Math.abs(s.top - first.top) < 0.5, `${theme} ${c.id}: ${s.text} is on the first step's row`);
          assert.ok(Math.abs(s.width - first.width) < 1, `${theme} ${c.id}: ${s.text} is as wide as the others (${s.width} vs ${first.width})`);
          assert.ok(s.height <= s.barWidth + s.lineHeight + 8, `${theme} ${c.id}: ${s.text} takes one line (${s.height} px)`);
          assert.ok(s.ellipsis, `${theme} ${c.id}: ${s.text} ends in … when it's too long`);
          assert.ok(s.barWidth >= 3, `${theme} ${c.id}: ${s.text}'s bar shows`);
        }
        c.steps.slice(1).forEach((s, i) => assert.ok(s.left >= c.steps[i].right - 0.5, `${theme} ${c.id}: ${s.text} is after the step before it`));
        const bg = c.bg[3] === 0 ? null : c.bg;
        assert.ok(bg, `${theme} ${c.id}: an open card has a fill`);
        const now = c.steps.find(s => s.weight === '600');
        // 0463: a queued ticket's track too, with no step reached, so none is bold and every bar is the same grey
        if (c.id === '0907') { assert.ok(!now && new Set(c.steps.map(s => s.bar.join())).size === 1, `${theme}: the queued ticket's steps are all grey`); continue; }
        assert.ok(now, `${theme} ${c.id}: its current step is bold`);
        assert.ok(drawn(now.bar, bg) >= 3, `${theme} ${c.id}: ${now.text}'s bar is ${drawn(now.bar, bg).toFixed(2)}:1`);
        assert.ok(drawn(now.color, bg) >= 7, `${theme} ${c.id}: ${now.text}'s name is ${drawn(now.color, bg).toFixed(2)}:1`);
      }
      assert.ok(cards.some(c => c.steps && c.steps.some(s => s.cut)), `${theme}: at 320 px, at least one name is cut short`);
    }
  } finally { await b.close(); await stop(panel); }
});
