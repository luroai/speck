import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fakePage, full, T, click, items, notes, top, page, panelModel } from './support/panel.mjs';
import { lane, pad, swipe } from './support/lanes.mjs';

// ---------- 0520: ideas and inbox notes have their own Capture lane, left of Plan ----------

const note = (name, status, captured, extra = '') => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\n${captured === null ? '' : `Captured: ${captured} · `}Status: ${status}\n${extra}\n## What\nThe whole text of ${name}.\n` });
const board = () => ({
  tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready'), full('0005', { status: 'done', finished: new Date().toISOString() })],
  ideas: [
    note('older-idea', 'idea', '2026-10-01'),
    note('newest-inbox', 'inbox', '2026-10-20', 'From ticket: 0005\n'),
    note('ticketed-one', 'ticketed (0001)', '2026-10-25'),
    note('dropped-one', 'dropped', '2026-10-24'),
    note('undated-idea', 'idea', null),
    note('middle-idea', 'idea', '2026-10-10'),
    note('blank-status', '', '2026-10-23'),
  ],
});
const opened = async (b = board()) => { const p = fakePage([b]); await p.settle(); return p; };
const tab = (p, l) => p.byId(`tab-${l}`);
const keydown = (n, key) => n.listeners.keydown({ key, preventDefault() {} });

// ---------- AC1 ----------

test('0520 AC1: the strip and the cards are Capture, Plan, Build and Shipped, in that order', () => {
  const html = page();
  const tabs = [...html.matchAll(/<button class="tab" id="tab-(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(tabs, ['capture', 'plan', 'build', 'shipped'], 'the strip');
  const main = html.slice(html.indexOf('<main>'), html.indexOf('</main>'));
  const cards = [...main.matchAll(/<section id="([\w-]+)"[^>]*aria-labelledby="tab-(\w+)"/g)].map(m => m[2]);
  assert.deepEqual(cards, ['capture', 'plan', 'build', 'shipped'], 'the cards, each named by its tab');
  assert.match(main, /<section id="capture-section"[^>]*role="tabpanel"[^>]*>\s*<h2 class="lane-title">Capture<\/h2>/, 'Capture\'s card has its title');
});

test('0520 AC1: the panel opens on Build, and the strip and the arrow keys move between all four lanes', async () => {
  const p = await opened();
  assert.equal(lane(p), 'build', 'it opens on Build');
  assert.equal(p.byId('capture-section').hidden, true, 'Capture is out of view');
  click(tab(p, 'capture'));
  assert.equal(lane(p), 'capture', 'the strip opens Capture');
  assert.equal(p.byId('capture-section').hidden, false);
  assert.equal(p.byId('shaping-section').hidden, true);
  keydown(tab(p, 'capture'), 'ArrowRight');
  assert.equal(lane(p), 'plan', 'right from Capture is Plan');
  keydown(tab(p, 'plan'), 'ArrowLeft');
  assert.equal(lane(p), 'capture', 'left from Plan is Capture');
  keydown(tab(p, 'capture'), 'ArrowLeft');
  assert.equal(lane(p), 'shipped', 'left from Capture goes round to the last, as from the first lane before');
  keydown(tab(p, 'shipped'), 'ArrowRight');
  assert.equal(lane(p), 'capture', 'and right from Shipped round to Capture');
});

test('0520 AC1: a sideways trackpad scroll moves through all four lanes, stopping at each end', async () => {
  const p = await pad();
  p.scroll(swipe(), { way: -1 });
  assert.equal(lane(p), 'plan');
  p.scroll(swipe(), { way: -1, pause: 400 });
  assert.equal(lane(p), 'capture', 'past Plan to Capture');
  p.scroll(swipe(), { way: -1, pause: 400 });
  assert.equal(lane(p), 'capture', 'and no further');
  for (const want of ['plan', 'build', 'shipped', 'shipped']) {
    p.scroll(swipe(), { pause: 400 });
    assert.equal(lane(p), want);
  }
});

test('0520 AC1: a finger swipe moves from Plan to Capture and back', async () => {
  const { slidingPage } = await import('./support/lanes.mjs');
  const p = await slidingPage();
  click(tab(p, 'plan'));
  await p.rest();
  assert.equal(lane(p), 'plan');
  p.touch([[100, 200], [160, 202], [240, 204], [320, 205]]);
  await p.rest();
  assert.equal(lane(p), 'capture', 'a swipe right brings in the lane to the left');
  p.touch([[320, 200], [260, 202], [180, 204], [100, 205]]);
  await p.rest();
  assert.equal(lane(p), 'plan', 'and a swipe left goes back');
});

// ---------- AC2 ----------

test('0520 AC2: Capture lists every idea and inbox note in one list, newest captured first, and nothing else', async () => {
  const p = await opened();
  assert.deepEqual(notes(p).map(n => p.all(n).find(x => /\btitle\b/.test(x.className)).textContent),
    ['newest-inbox', 'middle-idea', 'older-idea', 'undated-idea'], 'newest first, a note with no date last; ticketed, dropped and other notes left out');
  assert.match(notes(p)[0].className, /\binbox\b/, 'an inbox note keeps its card');
  assert.match(notes(p)[0].textContent, /From 0005/, 'saying where it came from');
  assert.match(notes(p)[1].className, /\bidea\b/);
  assert.equal(notes(p).every(n => !/\bopen\b/.test(n.className)), true, 'every card starts closed');
});

test('0520 AC2: the model\'s Capture list orders by the Captured line, not by order or body', () => {
  const m = panelModel()({ tickets: [], ideas: [
    note('a', 'inbox', '2026-01-05'), note('b', 'idea', '2026-03-01', 'Captured: 2027-01-01 in the body, after the line'), note('c', 'idea', '2026-01-05'), note('d', 'idea', 'not-a-date'),
  ] });
  assert.deepEqual(m.capture.map(i => i.title), ['b', 'a', 'c', 'd'], 'the date on its Captured line; same day in the order given; no date last');
});

test('0520 AC2: a closed card opens to the note\'s whole text and closes again', async () => {
  const p = await opened();
  click(top(notes(p)[1]));
  const card = notes(p)[1];
  assert.match(card.className, /\bopen\b/);
  assert.match(card.textContent, /speck\/ideas\/middle-idea\.md/, 'its path');
  assert.match(card.textContent, /The whole text of middle-idea\./, 'its whole text');
  click(top(card));
  assert.doesNotMatch(notes(p)[1].className, /\bopen\b/, 'closed again');
});

test('0520 AC2: with no idea or inbox note, Capture says "Nothing captured."', async () => {
  const b = board();
  b.ideas = b.ideas.filter(i => !['idea', 'inbox'].includes(i.status));
  const p = await opened(b);
  assert.equal(notes(p).length, 0);
  assert.equal(p.byId('capture').textContent, 'Nothing captured.');
});

// ---------- AC3 ----------

test('0520 AC3: Capture has no buttons, menus or fields, and reading its notes sends nothing to the server', async () => {
  const p = await opened();
  const sent = p.calls.length;
  for (let i = 0; i < notes(p).length; i++) { click(top(notes(p)[i])); click(top(notes(p)[i])); click(top(notes(p)[i])); }
  await p.settle();
  const tags = p.all(p.byId('capture-section')).map(n => n.tagName);
  for (const t of ['button', 'input', 'select', 'textarea', 'a', 'form']) assert.ok(!tags.includes(t), `no ${t} in Capture`);
  assert.ok(p.calls.slice(sent).every(c => !c.opts || !c.opts.method || c.opts.method === 'GET'), 'nothing written');
  assert.doesNotMatch(page().slice(page().indexOf('id="capture-section"'), page().indexOf('id="shaping-section"')), /<(button|input|select|textarea|form)\b/, 'nor in the page');
});

// ---------- AC4 ----------

test('0520 AC4: Plan lists only draft tickets, with no Tickets, Ideas or Inbox buttons, its list straight under its title', async () => {
  const p = await opened();
  assert.deepEqual(items(p).map(n => n.ticketId ?? n.gotoId ?? n.textContent.slice(0, 4)).map(String).map(s => s.slice(0, 4)), ['0001'], 'only the draft');
  assert.ok(items(p).every(n => /\bticket\b/.test(n.className)), 'no idea or inbox card in Plan');
  assert.ok(!p.all(p.byId('shaping-section')).some(n => /\btoggle\b/.test(n.className || '')), 'no toggles');
  const html = page();
  assert.doesNotMatch(html, /shaping-toggle/, 'the toggles\' row is gone');
  assert.match(html, /<section id="shaping-section"[^>]*>\s*<h2 class="lane-title">Plan<\/h2>\s*<div id="shaping" class="lane-list"><\/div>\s*<\/section>/, 'the list straight under the title');
  const js = fs.readFileSync(path.join(ROOT, 'templates', 'panel.js'), 'utf8');
  assert.doesNotMatch(js, /shapingView|shaping-toggle|'Ideas'|'Inbox'/, 'nothing left of the toggles in the page script');
});

test('0520 AC4: the brief names the Capture lane in the panel\'s row', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck panel'));
  assert.match(row, /\bCapture\b/, 'it names the Capture lane');
  assert.doesNotMatch(row, /Plan \(drafts, ideas and the inbox/, 'Plan no longer holds ideas and the inbox');
});
