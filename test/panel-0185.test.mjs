import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full, items, queueRows, page } from './support/panel.mjs';

// ---------- 0185: a hover no longer makes every other ticket look highlighted ----------

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const rows = p => [...items(p), ...queueRows(p)];
const row = (p, id) => rows(p).find(n => idOf(p, n) === id);
const classes = p => Object.fromEntries(rows(p).map(n => [idOf(p, n), n.className]));
const css = () => page().match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
const decls = sel => [...css().matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');

// 0001 ← 0002 (ready) ← 0003, and 0001 ← 0004 (ready) make one group; 0010 (a draft) and 0005 (ready) stand alone.
const board = () => ({
  tickets: [
    full('0001'),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    full('0003', { after: ['0002'], waiting_on: ['0002'] }),
    T('0004', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    T('0005', 'ready'),
    full('0010'),
  ],
  ideas: [],
});
// 25 drafts and 25 ready tickets: each ready one waits on the draft beside it, and the last five of each stand alone.
const big = () => {
  const id = n => String(n).padStart(4, '0');
  const drafts = Array.from({ length: 25 }, (_, i) => full(id(i + 1)));
  const ready = Array.from({ length: 25 }, (_, i) => i < 20
    ? T(id(i + 101), 'ready', { after: [id(i + 1)], waiting_on: [id(i + 1)] })
    : T(id(i + 101), 'ready'));
  return { tickets: [...drafts, ...ready], ideas: [] };
};

test('0185 AC1: while a linked ticket is hovered, every ticket outside its group keeps the classes it has with nothing hovered', async () => {
  const p = fakePage([board()]);
  await p.settle();
  const before = classes(p);
  row(p, '0004').listeners.mouseenter();
  const during = classes(p);
  for (const id of ['0005', '0010']) assert.equal(during[id], before[id], `${id} looks as it does with nothing hovered`);
  row(p, '0004').listeners.mouseleave();
  assert.deepEqual(classes(p), before, 'and everything is back once the pointer leaves');
});

test('0185 AC1: no rule sets back a ticket outside the group', () => {
  assert.doesNotMatch(css(), /\.(item|q)\.dim\b/, 'no rule styles a set-back ticket');
  assert.doesNotMatch(page(), /'dim'/, 'and the page script never gives one the dim class');
});

test('0185 AC2: a hovered ticket and each one linked to it are marked', async () => {
  const p = fakePage([board()]);
  await p.settle();
  row(p, '0003').listeners.mouseenter();
  const lit = rows(p).filter(n => /\bhl\b/.test(n.className)).map(n => idOf(p, n)).sort();
  assert.deepEqual(lit, ['0001', '0002', '0003', '0004']);
});

test('0185 AC2: the mark differs from the normal look and from the hover fill, and keeps the text\'s colours', () => {
  for (const sel of ['.item.hl', '.q.hl']) {
    const hl = decls(sel);
    assert.match(hl, /box-shadow:\s*inset 0 0 0 1px var\(--text\)/, `${sel} has a ring in the text colour inside its border`);
    assert.doesNotMatch(hl, /(^|;)\s*(background|color)\s*:/, `${sel} leaves the fill and the text colour as they are`);
  }
  for (const sel of ['.item', '.q', '.item:hover', '.item.open', '.q.open', '.q.blocked', '.q.to-ship', '.q.at-build', '.q.at-check', '.q.at-review', '.q.at-ship', '.q.wait'])
    assert.doesNotMatch(decls(sel), /box-shadow/, `${sel} has no ring of its own, so the mark shows on it`);
});

test('0185 AC2: the ring and the text on a ticket keep 7:1 against its fill, in the light and dark looks', () => {
  const block = sel => Object.fromEntries([...css().matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].trim() === sel)
    .flatMap(m => [...m[2].matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(x => [x[1], x[2]])));
  const light = block(':root'), dark = { ...light, ...block(':root[data-theme="dark"]') };
  const lum = hex => 0.2126 * ch(hex, 1) + 0.7152 * ch(hex, 3) + 0.0722 * ch(hex, 5);
  const ch = (hex, i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  for (const [name, look] of Object.entries({ light, dark }))
    for (const fill of ['--bg', '--panel', '--raise', '--bad-bg', '--idea-bg'])
      assert.ok(contrast(look['--text'], look[fill]) >= 7, `${name}: --text on ${fill} is ${contrast(look['--text'], look[fill]).toFixed(2)}:1`);
});

test('0185 AC3: hovering a ticket with no links changes no ticket\'s classes, in Plan or the queue', async () => {
  const p = fakePage([board()]);
  await p.settle();
  const before = classes(p);
  for (const id of ['0010', '0005']) {
    row(p, id).listeners.mouseenter();
    assert.deepEqual(classes(p), before, `hovering ${id} leaves every ticket as it was, its own hover fill coming from :hover`);
    row(p, id).listeners.mouseleave();
  }
  assert.match(decls('.item:hover'), /background: var\(--raise\)/, 'a Plan ticket still has its own hover fill');
});

test('0185 AC4: with 25 tickets in the queue and 25 in Plan, only the hovered group is marked and a lone ticket marks nothing', async () => {
  const p = fakePage([big()]);
  await p.settle();
  assert.equal(items(p).length, 25);
  assert.equal(queueRows(p).length, 25);
  const before = classes(p);
  row(p, '0107').listeners.mouseenter();
  const during = classes(p);
  for (const [id, cls] of Object.entries(during)) {
    if (id === '0107' || id === '0007') assert.match(cls, /\bhl\b/, `${id} is in the group`);
    else assert.equal(cls, before[id], `${id} looks as it does with nothing hovered`);
  }
  row(p, '0107').listeners.mouseleave();
  for (const id of ['0024', '0123']) {
    row(p, id).listeners.mouseenter();
    assert.deepEqual(classes(p), before, `hovering ${id}, which has no links, changes nothing`);
    row(p, id).listeners.mouseleave();
  }
});
