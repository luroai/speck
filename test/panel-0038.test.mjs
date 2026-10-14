import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { full, fakePage, page, panelModel, idea, click, toggles, items, top } from './support/panel.mjs';

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

test('0038 AC1: the toggle reads Tickets, Ideas and Inbox with counts, Tickets selected on load, one list at a time, kept through refreshes', async () => {
  const s = state();
  const p = fakePage([s, s, s, s]);
  await p.settle();
  assert.deepEqual(toggles(p).map(b => b.textContent), ['Tickets · 2', 'Ideas · 1', 'Inbox · 3']);
  assert.match(toggles(p)[0].className, /\bon\b/, 'Tickets selected on load');
  assert.ok(toggles(p).slice(1).every(b => !/\bon\b/.test(b.className)));
  assert.ok(items(p).every(n => /\bticket\b/.test(n.className)), 'only tickets');

  click(toggles(p)[2]);
  assert.match(toggles(p)[2].className, /\bon\b/);
  assert.match(p.byId('shaping-section').className, /\binbox\b/);
  assert.deepEqual(items(p).map(n => /\binbox\b/.test(n.className)), [true, true, true], 'only the inbox');
  assert.doesNotMatch(p.byId('shaping').textContent, /0001|Mine/);
  await refresh(p);
  assert.match(p.byId('shaping-section').className, /\binbox\b/, 'still on Inbox after a refresh');
  assert.equal(items(p).length, 3);

  click(toggles(p)[1]);
  assert.deepEqual(items(p).map(titleOf).map(t => t.replace(/^idea/, '')), ['Mine'], 'ticketed ideas are left out too (0056)');
  await refresh(p);
  assert.match(p.byId('shaping-section').className, /\bideas\b/);
  click(toggles(p)[0]);
  await refresh(p);
  assert.match(p.byId('shaping-section').className, /\btickets\b/);
});

test('0038 AC2: Inbox lists every inbox idea in JSON order, with title, path and From ticket id', async () => {
  const s = state();
  const p = fakePage([s, s]);
  await p.settle();
  click(toggles(p)[2]);
  const list = items(p);
  assert.deepEqual(list.map(titleOf).map(t => t.replace(/^inbox/, '')), ['Follow B', 'Follow A', 'Follow C'], 'JSON order');
  assert.ok(list[0].textContent.includes('speck/ideas/Follow B.md'), 'the path');
  assert.ok(list[0].textContent.includes('0031'), 'the From ticket id');
  assert.ok(list[2].textContent.includes('0036'));
  assert.ok(!/from/i.test(top(list[1]).textContent), 'no From ticket line: left out');
  assert.ok(!list[0].textContent.includes('should'), 'closed by default');
});

test('0038 AC2: clicking an inbox item shows its note as text, and clicking again closes it', async () => {
  const s = state();
  const p = fakePage([s, s, s]);
  await p.settle();
  click(toggles(p)[2]);
  click(top(items(p)[1]));
  assert.ok(items(p)[1].textContent.includes('Follow A <b>should</b> change.'), 'the note, as text');
  assert.ok(!p.all(items(p)[1]).some(n => n.tagName === 'b'), 'not as markup');
  assert.ok(!items(p)[0].textContent.includes('should'), 'only the clicked one opens');
  await refresh(p);
  assert.ok(items(p)[1].textContent.includes('should'), 'stays open through a refresh');
  click(top(items(p)[1]));
  assert.ok(!items(p)[1].textContent.includes('should'), 'clicking again closes it');
});

test('0038 AC2: an empty inbox says "Inbox is empty."', async () => {
  const s = { tickets: [], ideas: [idea('Mine', 'idea'), idea('Gone', 'dropped')] };
  const p = fakePage([s]);
  await p.settle();
  assert.equal(toggles(p)[2].textContent, 'Inbox · 0');
  click(toggles(p)[2]);
  assert.equal(items(p).length, 0);
  assert.equal(p.byId('shaping').textContent, 'Inbox is empty.');
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
  click(toggles(p)[1]);
  assert.equal(toggles(p)[1].textContent, `Ideas · ${items(p).length}`);
  assert.ok(items(p).every(n => /\bidea\b/.test(n.className) && !/\binbox\b/.test(n.className)));
  assert.doesNotMatch(p.byId('shaping').textContent, /Gone|Follow/);
});

test('0038 AC4: Inbox keeps a colour of its own, and since 0167 its tab, section and items are in the plain colours', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
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
  // 0167: the selected tab is in the text colour, and the section and its items have no stripe.
  assert.deepEqual([colour('.toggle.on', 'color'), colour('.toggle.on', 'border-color')], ['text', 'text']);
  assert.doesNotMatch(css, /#shaping-section\.inbox \{|\.item\.inbox(\.open)? \{|\.item\.inbox \.id \{/, 'no rule of its own');
  const name = 'inbox';
  assert.ok(vars[name], `--${name} is defined`);
  for (const other of ['accent', 'idea', 'bad', 'warn']) assert.notEqual(vars[name], vars[other], `not the same colour as --${other}`);
  assert.ok(!['accent', 'idea', 'bad', 'warn', 'run', 'ok', 'bug'].includes(name), 'a variable of its own');
  assert.ok(!Object.entries(vars).some(([k, v]) => k !== name && v === vars[name]), 'a colour no other variable uses');
});
