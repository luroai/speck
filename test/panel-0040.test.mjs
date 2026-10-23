import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fm, panelRepo, freePort, startPanel, stop, fakePage, full, idea, round, click, toggles, items, top, queueRows, stageOf, shippedRows, findChrome, browserPage, charAt, openLane, QUICK_PINGS } from './support/panel.mjs';

// ---------- 0040: selected text in an open ticket or idea survives the refresh ----------

// A browser drops a selection when a node holding it is taken out of the page, even if it goes straight back in.
// The fake page counts each node's removals in `detached`, so a selection in `node` survives while neither it nor any
// node above it, up to the Shaping list, has been taken out since `held` was called.
const held = (p, node) => {
  const chain = [];
  for (let at = node; at; at = at.parentNode) { chain.push([at, at.detached || 0]); if (at === p.byId('shaping')) break; }
  assert.equal(chain[chain.length - 1][0], p.byId('shaping'), 'the node is in the Shaping list');
  return () => chain.every(([n, d], i) => (n.detached || 0) === d && (i === chain.length - 1 || n.parentNode === chain[i + 1][0]));
};
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const textOf = (p, item, tag) => p.all(item).filter(n => n.tagName === tag).map(n => n.textContent);
const openTicket = (p, id) => { click(top(items(p).find(n => n.textContent.includes(id)))); return items(p).find(n => n.textContent.includes(id)); };
const queueText = p => queueRows(p).map(r => r.textContent);

const base = () => ({
  tickets: [full('0001', { acceptance_criteria: ['First criterion.', 'Second criterion.'] }), full('0002'),
    T('0003', 'building', { started: new Date(Date.now() - 5 * 60000).toISOString(), rounds: [] }), T('0004', 'done', { finished: new Date().toISOString(), started: new Date(Date.now() - 60000).toISOString() })],
  ideas: [idea('Alpha', 'idea', '# Alpha\n\nStatus: idea\n\nAlpha note text to select.\n'), idea('Beta', 'idea')],
});
const clone = s => JSON.parse(JSON.stringify(s));

test('0040 AC1: a selection in an open ticket\'s details survives a refresh in which that ticket is unchanged', async () => {
  const s = base();
  const p = fakePage([s, clone(s), clone(s)]);
  await p.settle();
  const item = openTicket(p, '0001');
  const li = p.all(item).find(n => n.tagName === 'p');
  const kept = held(p, li);
  await refresh(p);
  assert.ok(kept(), 'the criterion holding the selection stayed on the page');
  await refresh(p);
  assert.ok(kept(), 'and through a second refresh');
  assert.ok(/\bopen\b/.test(items(p)[0].className));
});

test('0040 AC2: the selection survives while other tickets change, and those changes show in the same refresh', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[1].status = 'ready'; // another draft leaves Shaping for the queue
  next.tickets[2].status = 'reviewing'; next.tickets[2].rounds = [round(1, 100), round(2, 200)]; // a queue ticket's review round
  next.tickets.push(T('0005', 'done', { title: 'Newly shipped', finished: new Date().toISOString() })); // a new shipped ticket
  next.tickets.unshift(full('0000')); // a new draft before the open one
  const third = clone(next);
  third.tickets[0].lint = { errors: 1, warnings: 0 }; // another draft's lint changes
  third.tickets.push(full('0009'));
  const p = fakePage([s, next, third]);
  await p.settle();
  const item = openTicket(p, '0001');
  const kept = held(p, p.all(item).filter(n => n.tagName === 'p')[0]);
  await refresh(p);
  assert.ok(kept(), 'the selection survives the changes elsewhere');
  assert.deepEqual(items(p).map(n => n.textContent.slice(0, 4)), ['0000', '0001'], 'the new draft shows and 0002 has left Shaping');
  assert.ok(queueText(p).some(t => t.includes('0002') && t.includes('Queued')), '0002 is in the queue');
  assert.equal(stageOf(queueRows(p).find(r => r.textContent.includes('0003'))).textContent, 'Review 2', 'the new review round shows');
  assert.ok(shippedRows(p).some(r => r.textContent.includes('Newly shipped')), 'the new shipped ticket shows');
  await refresh(p);
  assert.ok(kept(), 'and through another refresh with other changes');
  assert.ok(items(p)[0].textContent.includes('lint: 1 error'), "the other draft's lint change shows");
  assert.ok(items(p).some(n => n.textContent.includes('0009')), 'and the newer draft');
});

test('0040 AC3: a selection in an open idea\'s note survives a refresh in which that idea is unchanged, whatever else changes', async () => {
  const s = base();
  const next = clone(s);
  next.ideas[1].status = 'parked'; next.ideas[1].body = 'Changed.';
  next.ideas.unshift(idea('Zero', 'idea'));
  next.tickets[2].status = 'blocked'; next.tickets[2].blocked_question = 'Which way?';
  next.tickets[0].title = 'A renamed draft';
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  click(toggles(p)[1]);
  click(top(items(p)[0]));
  const text = p.all(items(p)[0]).find(n => n.tagName === 'p' && n.textContent.includes('Alpha note text')); // formatted since 0142
  assert.ok(text);
  const kept = held(p, text);
  await refresh(p);
  assert.ok(kept(), 'the note holding the selection stayed on the page');
  assert.deepEqual(items(p).map(n => textOf(p, n, 'span').find(t => t === 'Zero' || t === 'Alpha' || t === 'Beta')), ['Zero', 'Alpha', 'Beta'], 'the new idea shows');
  assert.ok(items(p)[2].textContent.includes('parked'), "the other idea's change shows");
  assert.ok(queueText(p).some(t => t.includes('Which way?')), 'the queue change shows');
  assert.ok(toggles(p)[1].textContent.includes('3'), 'the ideas count shows');
  await refresh(p);
  assert.ok(kept(), 'and through a second refresh');
});

test('0040 AC4: when the open ticket\'s or idea\'s own data changes, the new content shows in that refresh', async () => {
  const s = base();
  const next = clone(s);
  next.tickets[0].problem = 'A reworded problem.';
  next.ideas[0].body = '# Alpha\n\nStatus: idea\n\nA rewritten note.\n';
  const third = clone(next);
  third.tickets[0].outcome = 'A new outcome.'; // a field only the details show
  third.ideas[0].status = 'parked';
  const p = fakePage([s, next, third]);
  await p.settle();
  openTicket(p, '0001');
  click(toggles(p)[1]); click(top(items(p)[0])); click(toggles(p)[0]);
  await refresh(p);
  assert.deepEqual(textOf(p, items(p)[0], 'p'), ['A reworded problem.', 'Outcome of 0001.']);
  click(toggles(p)[1]);
  assert.ok(items(p)[0].textContent.includes('A rewritten note.'));
  assert.ok(!items(p)[0].textContent.includes('Alpha note text'));
  await refresh(p);
  assert.ok(items(p)[0].textContent.includes('parked'));
  click(toggles(p)[0]);
  assert.ok(items(p)[0].textContent.includes('A new outcome.'));
});

test('0040 AC4: what is open, Set ready pending and a refusal still show at once, as view changes to the item itself', async () => {
  const s = base();
  let answer;
  const p = fakePage([s, new Promise(r => { answer = r; })]);
  await p.settle();
  const item = openTicket(p, '0001');
  assert.ok(/\bopen\b/.test(item.className));
  const b = () => p.all(items(p)[0]).find(n => n.tagName === 'button');
  click(b());
  assert.equal(b().textContent, 'Setting ready…');
  answer({ ok: false, status: 409, json: async () => ({ error: 'Not a draft.' }) });
  await p.settle();
  assert.equal(b().textContent, 'Set ready');
  assert.ok(items(p)[0].textContent.includes('Not a draft.'));
  click(top(items(p)[0]));
  assert.ok(!/\bopen\b/.test(items(p)[0].className), 'and it still closes');
});

test('0040 AC5: the queue\'s time since started (MM:SS since 0058), the connection status and the disconnected message keep updating while text is selected', async () => {
  let now = Date.now() + 1000; // a second on, so the tickets' started times, made just after this, are 5 minutes and some seconds ago
  class FakeDate extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const s = base();
  const p = fakePage([s, clone(s), new Error('down'), clone(s)], { Date: FakeDate });
  await p.settle();
  const item = openTicket(p, '0001');
  const kept = held(p, p.all(item).find(n => n.tagName === 'p'));
  const minutes = () => queueRows(p).find(r => r.textContent.includes('0003')).textContent.match(/(\d\d):\d\d/)[1];
  assert.equal(minutes(), '05');
  now += 3 * 60000;
  await refresh(p);
  assert.ok(kept());
  assert.equal(minutes(), '08', 'the time since started moved on');
  now += 4000;
  await refresh(p);
  await p.elapse(10000); // 0186: the message shows once 10 seconds pass without a board
  assert.ok(kept(), 'a failed refresh keeps the selection too');
  assert.equal(p.byId('pills').children.length, 0, 'the header has no connection indicator (0150): the message below says it');
  assert.equal(p.byId('offline').hidden, false, 'the disconnected message shows');
  now += 2000;
  await refresh(p);
  assert.ok(kept());
  assert.equal(p.byId('pills').children.length, 0);
  assert.equal(p.byId('offline').hidden, true);
});

test('0040 AC1-AC5: in a real browser, selected text stays selected through refreshes until its own item changes', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const draft = (id, title, problem) => r.write(`${id}-draft.md`, fm({ id: `"${id}"`, title: `'${title}'`, status: 'draft' }),
    `## Problem\n${problem}\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n2. A second criterion to select.\n## Out of scope\n- PDF export\n`);
  draft('0002', 'The draft to read', 'Export button downloads a CSV.');
  const ideas = path.join(r.dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  fs.writeFileSync(path.join(ideas, 'note.md'), '# A parked idea\n\nStatus: idea\n\nThe note text, long enough to select across.\n');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())], undefined, QUICK_PINGS); // 0429: a refresh every half a second
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const sel = () => b.js('getSelection().toString()');
  const autoBuild = () => b.js(`document.getElementById('run').getAttribute('aria-label').replace(/^The Foreman: /, '')`); // 0413: the word on speck's screen, in its name
  try {
    const item = '#shaping .item';
    await b.until(`!!document.querySelector('${item} .title')`, 'the draft');
    await b.js(openLane('plan')); // 0410
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .detail')`, 'the draft to open');
    await b.drag(await b.js(charAt(`${item} .detail p.text`, 0)), await b.js(charAt(`${item} .detail p.text`, 13)));
    assert.equal(await sel(), 'Export button', 'the drag selected text');
    // AC1 and AC5: unchanged refreshes keep it, and the header keeps updating.
    // Each refresh puts a new label in the Foreman's button (0150; 0303: its builder stays), so a label that isn't the one marked is a refresh since.
    const refreshed = async what => { await b.js(`window.seen = window.drawn || 0; if (!window.drawWatch) (window.drawWatch = new MutationObserver(() => { window.drawn = (window.drawn || 0) + 1; })).observe(document.getElementById('bezel'), { attributes: true }); true`); await b.until(`(window.drawn || 0) > window.seen`, what); }; // 0413: each redraw sets the frame of speck's screen, which stays between them
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.match(await autoBuild(), /^(Off|Idle)$/, 'the header button is still updated (0285: with the Foreman\'s status)');
    assert.equal(await sel(), 'Export button', 'kept through refreshes');
    // AC2: other tickets change, and the changes show.
    draft('0001', 'A new draft before it', 'Something else.');
    fs.writeFileSync(path.join(ideas, 'other.md'), '# Another idea\n\nStatus: idea\n\nMore.\n');
    await b.until(`document.querySelectorAll('${item}').length === 2 && document.getElementById('shaping-toggle').textContent.includes('Ideas · 2')`, 'the new draft and idea');
    assert.equal(await sel(), 'Export button', 'kept while other items change');
    assert.ok(await b.js(`document.querySelector('${item}:nth-child(2)').classList.contains('open')`), 'the ticket is still open');
    // AC4: its own data changes, and the new content shows.
    draft('0002', 'The draft to read', 'Export button downloads a TSV.');
    await b.until(`document.querySelector('${item}.open .detail p.text').textContent.includes('TSV')`, 'the changed problem');

    // AC3: an idea's note.
    await b.js(`document.querySelectorAll('#shaping-toggle button')[1].click()`);
    await b.until(`[...document.querySelectorAll('${item}.idea .title')].some(t => t.textContent === 'A parked idea')`, 'the idea');
    await b.js(`[...document.querySelectorAll('${item}.idea .title')].find(t => t.textContent === 'A parked idea').click()`);
    await b.until(`!!document.querySelector('${item}.open .note')`, 'the idea to open');
    const note = `${item}.open .note p:last-child`; // its last paragraph: the note is formatted since 0142
    const start = await b.js(`document.querySelector('${note}').textContent.indexOf('The note')`);
    await b.drag(await b.js(charAt(note, start)), await b.js(charAt(note, start + 8)));
    assert.equal(await sel(), 'The note');
    fs.writeFileSync(path.join(ideas, 'other.md'), '# Another idea, renamed\n\nStatus: idea\n\nMore.\n');
    draft('0003', 'A third draft', 'More.');
    await b.until(`[...document.querySelectorAll('${item}.idea .title')].some(t => t.textContent === 'Another idea, renamed') && document.getElementById('shaping-toggle').textContent.includes('Tickets · 3')`, 'the other changes');
    assert.equal(await sel(), 'The note', 'kept while other things change');
    fs.writeFileSync(path.join(ideas, 'note.md'), '# A parked idea\n\nStatus: idea\n\nThe note text, rewritten.\n');
    await b.until(`document.querySelector('${note}').textContent.includes('rewritten')`, 'the changed note');
  } finally {
    await b.close();
    await stop(panel);
  }
});

test('0040 self-check: drafts sharing an id, or named like built-ins, all still show and refresh', async () => {
  const s = { tickets: [full('__proto__'), full('0001', { title: 'First copy' }), full('0001', { title: 'Second copy' }), full('constructor')], ideas: [] };
  const next = clone(s);
  next.tickets[2].title = 'Second copy, renamed';
  const p = fakePage([s, next, clone(next)]);
  await p.settle();
  const titles = () => items(p).map(n => p.all(n).find(x => /\btitle\b/.test(x.className)).textContent);
  assert.deepEqual(titles(), ['Ticket __proto__', 'First copy', 'Second copy', 'Ticket constructor']);
  await refresh(p);
  assert.deepEqual(titles(), ['Ticket __proto__', 'First copy', 'Second copy, renamed', 'Ticket constructor']);
  await refresh(p);
  assert.equal(items(p).length, 4);
});

// Round 1, F1: "data unchanged" is the same field values, so the order the fields come in doesn't matter, at any level.
const reorder = v => (Array.isArray(v) ? v.map(reorder) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map(k => [k, reorder(v[k])])) : v);
test('0040 AC1 and AC3: the same field values in another order count as unchanged, for a ticket and an idea', async () => {
  const s = base();
  s.tickets[0].lint_messages = { errors: [], warnings: ['A warning.'] };
  const next = reorder(s);
  assert.notEqual(JSON.stringify(next.tickets[0]), JSON.stringify(s.tickets[0]), 'the fields really are in another order');
  assert.notEqual(JSON.stringify(next.tickets[0].lint_messages), JSON.stringify(s.tickets[0].lint_messages), 'nested ones too');
  const p = fakePage([s, next, clone(s), reorder(s)]);
  await p.settle();
  const kept = held(p, p.all(openTicket(p, '0001')).find(n => n.tagName === 'p'));
  await refresh(p);
  assert.ok(kept(), 'the ticket with its fields reordered keeps its node');
  click(toggles(p)[1]); click(top(items(p)[0]));
  const keptIdea = held(p, p.all(items(p)[0]).find(n => n.tagName === 'p')); // the note's text, formatted since 0142
  await refresh(p);
  await refresh(p);
  assert.ok(keptIdea(), 'the idea with its fields reordered keeps its node');
});
