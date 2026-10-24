// 0138: an approved ticket waiting to ship is purple in the queue, not red.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelModel, T, round, fakePage, queueRows, exitOf, isRed, stageOf, sayOf, findText, boardPage, openQueueRows, styles } from './support/panel.mjs';

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
// 0434: each card open, as what's under a Build card's two lines shows only then
const rows = async state => { const p = boardPage([state]); await p.settle(); await openQueueRows(p); return { p, rows: queueRows(p) }; };
const openRow = async (state, id) => {
  const p = fakePage([state]);
  await p.settle();
  p.press(queueRows(p).find(r => r.textContent.includes(id)).children.find(n => n.className === 'top'));
  await p.settle();
  return { p, row: queueRows(p).find(r => r.textContent.includes(id)) };
};

test('0138 AC1: an approved ticket whose build has exited is purple on its border (its left edge until 0167), current step and label, and nothing in it is red', async () => {
  const m = panelModel()({ tickets: [waiting()], ideas: [] });
  assert.equal(m.queue[0].red, false);
  assert.equal(m.queue[0].to_ship, true);
  const { p, rows: [a] } = await rows({ tickets: [waiting()], ideas: [] });
  assert.match(a.className, /\bto-ship\b/);
  assert.equal(stageOf(a).textContent, 'Ship');
  assert.match(stageOf(a).className, /\bto-ship\b/);
  assert.equal(sayOf(a).className, 'say to-ship', 'it waits for you, in purple (0416: with no badge)');
  const label = findText(p, a, 'Build finished without shipping');
  assert.ok(label, 'the label');
  const line = p.all(a).find(n => n.children && n.children.includes(label)) || p.all(a).find(n => n.textContent === 'Build finished without shipping' && n.className);
  assert.match(line.className, /\bto-ship\b/);
  assert.ok(findText(p, a, MESSAGE), 'the message still shows');
  assert.ok(!p.all(a).some(isRed), 'nothing red');
});

test('0138 AC1: the open row is tinted purple, and nothing in it is red', async () => {
  const { p, row } = await openRow({ tickets: [waiting()], ideas: [] }, '0001');
  assert.match(row.className, /\bopen\b/);
  assert.match(row.className, /\bto-ship\b/);
  assert.ok(!p.all(row).some(isRed), 'nothing red');
});

test('0138 AC1: the CSS draws each of those in purple (green since 0440)', () => {
  // 0167: its border all round and its tint, open or closed, in place of a left edge
  assert.equal(ruleVar('.q.to-ship', 'border-color'), '--ok', 'the border');
  assert.equal(ruleVar('.q.to-ship', 'background'), '--ok-bg', 'the tint');
  assert.equal(ruleVar('.q .top .stage.to-ship', 'color'), '--ok', 'the current step\'s name (0156)');
  assert.equal(ruleVar('.act.to-ship', 'color'), '--ok', 'the label line');
  assert.equal(ruleVar('.question.exit.to-ship', 'border-left-color'), '--ok', 'the message\'s edge');
  // The tint comes after .q.open, so it wins over the plain open fill.
  assert.ok(css().indexOf('.q.to-ship {') > css().indexOf('.q.open {'), '.q.to-ship comes after .q.open');
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
  const { p, rows: all } = await rows(state);
  for (const row of all) {
    assert.match(row.className, /\bblocked\b/);
    assert.match(stageOf(row).className, /\bbad\b/);
    assert.equal(sayOf(row).className, 'say bad', 'it needs you, in its sentence (0416: with no badge)');
    assert.ok(!p.all(row).some(purple), 'nothing purple');
  }
  for (const [row, label] of [[all[1], 'Build stopped before finishing'], [all[2], 'Build stopped before finishing'], [all[3], 'Build stopped unexpectedly']])
    assert.ok(p.all(row).some(n => n.className === 'act bad' && n.textContent === label), label);
  assert.equal(ruleVar('.q.blocked', 'border-color'), '--bad'); // its border all round since 0167
  assert.equal(ruleVar('.q.blocked', 'background'), '--bad-bg');
  assert.equal(ruleVar('.q .top .stage.bad', 'color'), '--bad'); // the current step's name since 0156
  assert.match(css(), /\.question\.exit \{ border-left-color: var\(--bad\);/);
  const { p: q, row } = await openRow(state, '0001');
  assert.match(row.className, /\bblocked\b.*\bopen\b|\bopen\b.*\bblocked\b/);
  assert.ok(!q.all(row).some(purple));
});

test('0138 AC4: an approved ticket waiting to ship still has Full ticket and Review pack, and the pack\'s Ship button ships it', async () => {
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
  const buttons = () => p.all(row()).filter(n => n.tagName === 'button').map(n => n.textContent);
  assert.ok(buttons().includes('Full ticket'));
  assert.ok(buttons().includes('Review pack'));
  p.press(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
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
