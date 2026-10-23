// 0423: the full ticket, and a review pack, open over the whole panel, as Settings does, rather than in a 480 px pane at
// the side.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, page, full, click, items, top, queueRows, styles } from './support/panel.mjs';

// The declarations of each CSS rule whose selector list holds exactly `sel`, in the page's style, media queries included.
const rules = sel => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].replace(/^[^{]*\{/, '').split(',').map(x => x.trim()).includes(sel)).map(m => m[2]);
};
const clone = s => JSON.parse(JSON.stringify(s));
const board = () => ({ tickets: [full('0001', { title: 'A draft' }), full('0002', { title: 'Approved one', status: 'approved' })], ideas: [] });
// A fake page where each node can take the focus, and `p.focused()` is the node holding it.
function livePage() {
  let focused = null;
  const focusable = n => { n.focus = () => { focused = n; p.document.activeElement = n; }; return n; };
  const p = fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/pack$/.test(url) ? { pack: '# Pack', pictures: [], documents: [] } : /\/log$/.test(url) ? { text: '', truncated: false } : clone(board())) }),
  }, { made: focusable });
  for (const id of ['full-ticket', 'shaping-section', 'build-section']) focusable(p.byId(id));
  p.focused = () => focused;
  return p;
}
const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const named = (p, node, text) => node && p.all(node).find(n => n.tagName === 'button' && n.textContent === text);

// ---------- AC1: over the whole window, as Settings is ----------

test('0423 AC1: the full ticket fills the window, as Settings does, rather than a 480 px pane at the side', () => {
  const [base] = rules('#full-ticket');
  assert.match(base, /position: fixed/);
  assert.match(base, /inset: 0/);
  assert.match(base, /background: var\(--panel\)/);
  assert.match(base, /overflow-y: auto/);
  assert.doesNotMatch(base, /480px|right: 0|width:|border-left|box-shadow/, 'not a pane down the right');
  assert.ok(!rules(':root[data-theme="dark"] #full-ticket').length, 'no side pane\'s shadow in the dark look');
});

test('0423 AC1: Full ticket and Review pack both open in it', async () => {
  const p = livePage();
  await p.settle();
  click(top(itemOf(p, '0001')));
  await p.settle();
  click(named(p, itemOf(p, '0001'), 'Full ticket'));
  assert.ok(paneOpen(p), 'Full ticket opens it');
  assert.equal(p.all(pane(p)).find(n => n.className === 'title').textContent, 'A draft');
  p.key('Escape');
  assert.ok(!paneOpen(p));
  const row = () => queueRows(p).find(r => r.textContent.includes('0002'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  const pack = p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Review pack');
  assert.ok(pack, 'the approved ticket has a Review pack button');
  p.press(pack);
  await p.settle();
  assert.ok(paneOpen(p), 'Review pack opens it');
  assert.ok(p.all(pane(p)).some(n => n.className === 'title' && n.textContent === 'Review pack'));
});

// ---------- AC2: the title row stays at the top; Close and Escape close it ----------

test('0423 AC2: its title row and Close stay at the top while the ticket scrolls, as Settings\' do', () => {
  const sticky = rules('#full-ticket .top').filter(r => /position: sticky/.test(r));
  assert.equal(sticky.length, 1, 'one sticky rule for its top line');
  assert.ok(rules('#settings .top').includes(sticky[0]), 'the same rule as Settings\'');
  assert.match(sticky[0], /top: 0/);
  assert.match(sticky[0], /background: var\(--panel\)/);
  assert.match(sticky[0], /padding-top: calc\(12px \+ env\(safe-area-inset-top\)\)/, 'the notch\'s room is in the line');
  assert.doesNotMatch(rules('#full-ticket')[0], /padding: 0? ?env\(safe-area-inset-top\)|top: env/, 'not above the line');
});

for (const how of ['Close', 'Escape']) {
  test(`0423 AC2: ${how} closes it, and the focus goes back to the Full ticket button`, async () => {
    const p = livePage();
    await p.settle();
    click(top(itemOf(p, '0001')));
    await p.settle();
    click(named(p, itemOf(p, '0001'), 'Full ticket'));
    assert.equal(p.focused(), pane(p), 'the focus is in it');
    if (how === 'Close') click(named(p, pane(p), 'Close'));
    else p.key('Escape');
    assert.ok(!paneOpen(p), 'it closes');
    assert.equal(p.focused(), named(p, itemOf(p, '0001'), 'Full ticket'), 'the focus is back on its button');
  });
}

// ---------- AC3: a centred column at most 720 px wide ----------

test('0423 AC3: on a wide window its text is a centred column at most 720 px wide', () => {
  const [base] = rules('#full-ticket');
  // The room beside the column, half on each side, at least 16 px. The left side's is rounded down to a whole pixel
  // (0281) and the right side's up, so an odd width leaves a column no wider than 720 px.
  const last = side => { const all = [...base.matchAll(new RegExp(`padding-${side}: ([^;]+);`, 'g'))].map(m => m[1]); return all[all.length - 1] || ''; };
  const left = last('left'), right = last('right');
  assert.equal(left, 'max(16px, env(safe-area-inset-left), round(down, calc((100% - 720px) / 2), 1px))');
  assert.equal(right, 'max(16px, env(safe-area-inset-right), round(up, calc((100% - 720px) / 2), 1px))');
  // What those give, with no insets, at even and odd window widths.
  const pad = (w, r) => Math.max(16, r((w - 720) / 2));
  for (const w of [761, 800, 1024, 1279, 1280, 1281, 1920, 2561]) {
    const l = pad(w, Math.floor), rt = pad(w, Math.ceil), column = w - l - rt;
    assert.ok(column <= 720, `${w} px: a ${column} px column`);
    assert.ok(Math.abs(l - rt) <= 1, `${w} px: centred (${l} and ${rt})`);
    if (w >= 752) assert.equal(column, 720, `${w} px: the full 720 px`);
  }
});
