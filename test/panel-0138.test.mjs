// 0138: an approved ticket waiting to ship is purple in the queue, not red.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelModel, T, round, fakePage, queueRows, exitOf, isRed, sayOf, findText, boardPage, fullViewOf, styles } from './support/panel.mjs';

const MESSAGE = 'speck ship refused: tests failed.';
const purple = n => /\bto-ship\b/.test(n.className || '');
const css = () => styles();
const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const light = () => vars((css().match(/:root \{([\s\S]*?)\}/) || [])[1] || '');
const lightTints = () => vars([...css().matchAll(/:root \{ (--accent-bg[^}]*)\}/g)].map(m => m[1]).join(' '));
const dark = () => vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '));
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = hex => {
  const [r, g, b] = rgb(hex).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hue = hex => {
  const [r, g, b] = rgb(hex), max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const hueGap = (a, b) => { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d); };
// The colour a CSS rule for `selector` gives `prop`, as the var it names.
const ruleVar = (selector, prop) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css().match(new RegExp(`(?:^|[\\s,}])${esc}(?:\\s*,[^{]*)?\\s*\\{([^}]*)\\}`));
  const v = m && m[1].match(new RegExp(`${prop}\\s*:[^;]*var\\((--[\\w-]+)\\)`));
  return v ? v[1] : null;
};

const waiting = (o = {}) => T('0001', 'approved', { rounds: [round(1, 1)], ...exitOf(MESSAGE), ...o });
// 0585: a row says where its ticket is with a dot; what a stopped or finished build says is in its full view
const whereIn = (p, row) => p.all(row).find(n => /^where\b/.test(n.className || ''));
const viewOf = async (state, id) => {
  const p = fakePage([state]);
  await p.settle();
  return { p, full: await fullViewOf(p, id) };
};

test('0138 AC1: an approved ticket whose build has exited is under Needs you, and in its full view purple in its sentence and label, and nothing in it is red', async () => {
  const m = panelModel()({ tickets: [waiting()], ideas: [] });
  assert.equal(m.queue[0].red, false);
  assert.equal(m.queue[0].to_ship, true);
  const p0 = boardPage([{ tickets: [waiting()], ideas: [] }]);
  await p0.settle();
  assert.equal(p0.byId('queue').children[0].textContent, 'Needs you 1');
  assert.match(whereIn(p0, queueRows(p0)[0]).className, /\bneeds\b/, 'a row waiting for you has its orange dot');
  const { p, full } = await viewOf({ tickets: [waiting()], ideas: [] }, '0001');
  assert.equal(sayOf(full).className, 'say to-ship', 'it waits for you, in purple (0416: with no badge)');
  const label = findText(p, full, 'Build finished without shipping');
  assert.ok(label, 'the label');
  assert.match(label.className, /\bto-ship\b/);
  assert.ok(findText(p, full, MESSAGE), 'the message still shows');
  assert.ok(p.all(full).some(n => n._text === MESSAGE && /\bto-ship\b/.test(n.className)), 'in purple');
  assert.ok(!p.all(full).some(isRed), 'nothing red');
});

test('0138 AC1: the full view draws each of those in purple (green since 0440)', async () => {
  const { p, full } = await viewOf({ tickets: [waiting()], ideas: [] }, '0001');
  assert.ok(!p.all(full).some(isRed), 'nothing red');
  assert.equal(ruleVar('#full-ticket .live-now .say.to-ship', 'color'), '--ok', 'the sentence in the full view');
  assert.equal(ruleVar('.act.to-ship', 'color'), '--ok', 'the label line');
  assert.equal(ruleVar('.question.exit.to-ship', 'border-left-color'), '--ok', 'the message\'s edge');
});

test('0138 AC2: the purple (green since 0440) reads clearly in light and dark, and is visibly different from red and amber', () => {
  for (const [look, v, tints] of [['light', light(), lightTints()], ['dark', dark(), dark()]]) {
    const purpleHex = v.get('--ok'), bg = v.get('--bg'), panel = v.get('--panel'), tint = tints.get('--ok-bg');
    assert.ok(purpleHex && bg && panel && tint, `${look}: every colour is there`);
    for (const [name, back] of [['--bg', bg], ['--panel', panel], ['--ok-bg', tint]])
      assert.ok(contrast(purpleHex, back) >= 3, `${look}: --ok (${purpleHex}) on ${name} (${back}) is at least 3:1 (${contrast(purpleHex, back).toFixed(2)})`);
    assert.ok(contrast(v.get('--text'), tint) >= 4.5, `${look}: text on the open tint is at least 4.5:1`);
    // 0440: Cursor's green, at least 60° of hue from --bad and --warn (back from 0426's 20°, when it was Cursor's
    // magenta), and the open tint at least 15° from the red tint
    for (const [other, gap] of [['--bad', 60], ['--warn', 60]])
      assert.ok(hueGap(purpleHex, v.get(other)) >= gap, `${look}: --ok (${purpleHex}) is at least ${gap}° of hue from ${other} (${v.get(other)}): ${hueGap(purpleHex, v.get(other)).toFixed(0)}°`);
    assert.ok(hueGap(tint, tints.get('--bad-bg')) >= 15, `${look}: the open tint is a different hue from the red tint`);
  }
});

test('0138 AC3: blocked, stopped-before-finishing and stopped-unexpectedly tickets are red as before, with nothing purple', async () => {
  const state = { tickets: [
    T('0001', 'blocked', { blocked_question: 'A or B?' }),
    T('0002', 'building', exitOf('Stopped here.')),
    T('0003', 'reviewing', { self_check: 'x', rounds: [round(1, 1)], ...exitOf('Out of turns.') }),
    T('0004', 'building', { build_stopped: true, build_running: false }),
  ], ideas: [] };
  const m = panelModel()(state);
  assert.deepEqual(m.queue.map(t => t.red), [true, true, true, true]);
  assert.deepEqual(m.queue.map(t => t.to_ship), [false, false, false, false]);
  const views = [];
  for (const id of ['0001', '0002', '0003', '0004']) views.push(await viewOf(state, id));
  for (const { p, full } of views) {
    assert.ok(!p.all(full).some(purple), 'nothing purple');
    assert.equal(sayOf(full).className, 'say bad', 'it needs you, in its sentence (0416: with no badge)');
  }
  for (const [{ p, full }, label] of [[views[1], 'Build stopped before finishing'], [views[2], 'Build stopped before finishing'], [views[3], 'Build stopped unexpectedly']])
    assert.ok(p.all(full).some(n => n.className === 'act bad' && n.textContent === label), label);
  assert.match(css(), /\.question\.exit \{ border-left-color: var\(--bad\);/);
});

test('0138 AC4: an approved ticket waiting to ship has Review pack in its full view, and the pack\'s Ship button ships it', async () => {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/ship$/.test(url)) { sent.push(url); return { ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped 0001.' }) }; }
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? { pack: '## 0001 · Ticket 0001\n**Verdict:** ✅ Approved by reviewer\n' }
        : /\/full$/.test(url) ? { ticket: T('0001', 'approved') } : { tickets: [waiting()], ideas: [] };
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
  });
  await p.settle();
  const row = () => queueRows(p)[0];
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  const buttons = () => p.all(p.byId('full-ticket')).filter(n => n.tagName === 'button').map(n => n.textContent);
  assert.ok(buttons().includes('Review pack'), 'its full view has the Review pack');
  p.press(p.all(p.byId('full-ticket')).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  const pane = p.byId('full-ticket');
  assert.ok(pane.textContent.includes('Approved by reviewer'), 'the pack shows');
  const ship = p.all(pane).find(n => n.tagName === 'button' && n.textContent === 'Ship');
  assert.ok(ship && !ship.disabled, 'a Ship button');
  p.press(ship);
  await p.settle();
  assert.equal(sent.length, 1, 'Ship sent one request');
  assert.match(sent[0], /\/api\/tickets\/0001\/ship$/);
});
