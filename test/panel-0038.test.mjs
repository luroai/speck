import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { full, fakePage, page, panelModel, idea, click, items, notes, top, styles } from './support/panel.mjs';

// ---------- 0038: the inbox in Shaping ----------

// An inbox note in the 0036 format.
const note = (name, from = '0036', extra = '') => idea(name, 'inbox',
  `# ${name}\n\nCaptured: 2026-10-09 · Status: inbox\n${from === null ? '' : `From ticket: ${from}\n`}\n## What\n${name} <b>should</b> change.\n${extra}`);
const state = () => ({
  tickets: [full('0001'), full('0002')],
  ideas: [idea('Mine', 'idea'), note('Follow B', '0031'), idea('Gone', 'dropped'), note('Follow A', null), idea('Done', 'ticketed (0009)'), note('Follow C', '0036')],
});
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const titleOf = n => top(n).children[0].textContent;

test('0038 AC1 (0520: in Capture): Plan lists only tickets, Capture the ideas and the inbox together, kept through refreshes', async () => {
  // 0520: Plan's Tickets, Ideas and Inbox buttons are gone; Capture holds ideas and inbox notes in one list, Plan only tickets.
  const s = state();
  const p = fakePage([s, s, s, s]);
  await p.settle();
  assert.ok(items(p).every(n => /\bticket\b/.test(n.className)), 'only tickets in Plan');
  assert.equal(items(p).length, 2);
  assert.deepEqual(notes(p).map(n => /\binbox\b/.test(n.className)), [true, true, true, false], 'the inbox notes (captured) and the idea (no date, last)');
  assert.doesNotMatch(p.byId('capture').textContent, /0001|Gone|Done/);
  assert.deepEqual(notes(p).filter(n => /\bidea\b/.test(n.className)).map(titleOf), ['Mine'], 'ticketed ideas are left out too (0056)');
  await refresh(p);
  assert.equal(notes(p).length, 4, 'still there after a refresh');
  assert.equal(items(p).length, 2);
});

test('0038 AC2: Inbox lists every inbox idea in JSON order, with title, path and From ticket id', async () => {
  const s = state();
  const p = fakePage([s, s]);
  await p.settle();
  const list = notes(p).filter(n => /\binbox\b/.test(n.className));
  assert.deepEqual(list.map(titleOf).map(t => t.replace(/^inbox/, '')), ['Follow B', 'Follow A', 'Follow C'], 'JSON order');
  assert.ok(!list[0].textContent.includes('speck/ideas/Follow B.md'), 'no path while it\'s closed (0435)');
  assert.ok(list[0].textContent.includes('0031'), 'the From ticket id');
  assert.ok(list[2].textContent.includes('0036'));
  assert.ok(!/from/i.test(top(list[1]).textContent), 'no From ticket line: left out');
  assert.ok(!list[0].textContent.includes('should'), 'closed by default');
});

test('0038 AC2: clicking an inbox item shows its note as text, and clicking again closes it', async () => {
  const s = state();
  const p = fakePage([s, s, s]);
  await p.settle();
  click(top(notes(p)[1]));
  assert.ok(notes(p)[1].textContent.includes('Follow A <b>should</b> change.'), 'the note, as text');
  assert.ok(!p.all(notes(p)[1]).some(n => n.tagName === 'b'), 'not as markup');
  assert.ok(!notes(p)[0].textContent.includes('should'), 'only the clicked one opens');
  await refresh(p);
  assert.ok(notes(p)[1].textContent.includes('should'), 'stays open through a refresh');
  click(top(notes(p)[1]));
  assert.ok(!notes(p)[1].textContent.includes('should'), 'clicking again closes it');
});

test('0038 AC2 (0520: in Capture): with no inbox note Capture lists only ideas, and with nothing says "Nothing captured."', async () => {
  const s = { tickets: [], ideas: [idea('Mine', 'idea'), idea('Gone', 'dropped')] };
  const p = fakePage([s]);
  await p.settle();
  assert.ok(notes(p).length === 1 && notes(p).every(n => !/\binbox\b/.test(n.className)), 'no inbox card');
  const q = fakePage([{ tickets: [], ideas: [idea('Gone', 'dropped')] }]);
  await q.settle();
  assert.equal(notes(q).length, 0);
  assert.equal(q.byId('capture').textContent, 'Nothing captured.');
});

test('0038 AC2: the From ticket id is read from the note, and a missing or odd body gives none', () => {
  const model = panelModel();
  const m = model({ tickets: [], ideas: [
    note('A', '0031'), note('B', null), { path: 'speck/ideas/c.md', title: 'C', status: 'inbox' }, { path: 'speck/ideas/d.md', title: 'D', status: 'inbox', body: 7 },
    idea('E', 'inbox', '# E\n\nStatus: inbox\nFrom ticket:   0040  \n'), idea('F', 'inbox', '# F\n\nStatus: inbox\nFrom ticket:\n\nText.\n'),
    idea('G', 'inbox', '# G\n\nStatus: inbox\nFrom ticket: 0041 (round 2)\n'),
  ] });
  assert.deepEqual(m.inbox.map(i => [i.title, i.from]), [['A', '0031'], ['B', null], ['C', null], ['D', null], ['E', '0040'], ['F', null], ['G', '0041']]);
});

test('0038 AC3: Ideas leaves out inbox and dropped ideas, its count matches its list, and the rest is unchanged', async () => {
  const model = panelModel();
  const m = model({ tickets: [], ideas: [idea('T', 'ticketed (0001)'), idea('I', 'inbox'), idea('Fresh', 'idea'), idea('D', 'dropped'), idea('N', null), idea('Later', 'ticketed')] });
  assert.deepEqual(m.ideas.map(i => i.title), ['Fresh', 'N'], 'in JSON order, ticketed ones left out too (0056)');
  const s = state();
  const p = fakePage([s]);
  await p.settle();
  // 0520: no Ideas button to count; Capture's idea cards are the ideas, none an inbox card.
  const ideas = notes(p).filter(n => /\bidea\b/.test(n.className));
  assert.equal(ideas.length, 1);
  assert.ok(ideas.every(n => !/\binbox\b/.test(n.className)));
  assert.doesNotMatch(p.byId('capture').textContent, /Gone/);
});

test('0038 AC4: Inbox keeps a colour of its own, and since 0167 its tab, section and items are in the plain colours', () => {
  const css = styles();
  const vars = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{3,6})/gi)].map(m => [m[1], m[2].toLowerCase()]));
  const rule = selector => {
    const m = css.match(new RegExp(`(?:^|\\n)\\s*${selector.replace(/[.#]/g, '\\$&')} \\{([^}]*)\\}`));
    assert.ok(m, `a rule for ${selector}`);
    return m[1];
  };
  const colour = (selector, prop) => {
    const m = rule(selector).match(new RegExp(`${prop}:[^;]*var\\(--([a-z-]+)\\)`));
    assert.ok(m, `${selector} sets ${prop} from a colour variable`);
    return m[1];
  };
  // 0167: the section and its items have no stripe. 0520: Plan's Tickets, Ideas and Inbox buttons are gone; so is the
  // selected one's rule.
  void colour;
  assert.doesNotMatch(css, /\.toggle\.on \{/, 'no rule left for the buttons');
  assert.doesNotMatch(css, /#shaping-section\.inbox \{|\.item\.inbox(\.open)? \{|\.item\.inbox \.id \{/, 'no rule of its own');
  const name = 'inbox';
  assert.ok(vars[name], `--${name} is defined`);
  for (const other of ['accent', 'idea', 'bad', 'warn']) assert.notEqual(vars[name], vars[other], `not the same colour as --${other}`);
  assert.ok(!['accent', 'idea', 'bad', 'warn', 'run', 'ok', 'bug'].includes(name), 'a variable of its own');
  assert.ok(!Object.entries(vars).some(([k, v]) => k !== name && v === vars[name]), 'a colour no other variable uses');
});
