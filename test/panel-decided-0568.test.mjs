import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, findChrome, browserPage, gitEnv, panelRepo } from './support/panel.mjs';
import { D, board, buttons, rows, openList } from './support/decided.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { gIn } from './support/ship.mjs';
import { read, TICKET } from './support/merge-rounds.mjs';
import { changesRepo } from './support/changes.mjs';
import { statusData } from '../scripts/speck.mjs';
import { decidedFor } from '../scripts/foreman-took.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0568: list what speck decided for you in the panel ----------

const NOW = Date.parse('2026-11-09T12:00:00Z');
const DAY = 864e5;
const ago = days => new Date(NOW - days * DAY).toISOString();
const noteAt = iso => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
const took = (option, at) => `- Went with the recommendation: ${option} (chosen by speck, ${noteAt(at)} UTC).`;
const OLD = '1. Export button downloads a CSV.';
const NEW = '1. Export button downloads an Excel file.';

// r's ticket with these Notes lines added on its branch, and `fn` applied to it, committed.
function onBranch(r, lines, fn = s => s) {
  const file = path.join(r.wt, TICKET);
  fs.writeFileSync(file, fn(read(r.wt, TICKET)).replace(/^## Out of scope\n/m, `## Notes\n${lines.join('\n')}\n\n## Out of scope\n`));
  gIn(r.wt, 'commit', '-qam', 'edit the ticket');
}
// A ticket really started with speck start, with `edit` applied on its branch, and shipped as speck ship leaves it:
// merged, its branch gone and the ticket in done/, done.
function shippedTicket(edit) {
  const r = panelRepo();
  assert.equal(r.run('start', '1').status, 0);
  const branch = r.g('rev-parse', '--abbrev-ref', 'HEAD');
  fs.writeFileSync(r.file, edit(fs.readFileSync(r.file, 'utf8')));
  r.g('commit', '-qam', 'edit the ticket');
  r.g('checkout', '-q', 'main');
  r.g('merge', '--no-ff', '-q', '-m', 'ship', branch);
  r.g('branch', '-D', branch);
  const done = path.join(r.dir, 'speck/tickets/done', path.basename(r.file));
  fs.mkdirSync(path.dirname(done), { recursive: true });
  r.g('mv', r.file, done);
  fs.writeFileSync(done, fs.readFileSync(done, 'utf8').replace(/^status: \w+/m, 'status: done'));
  r.g('add', done);
  r.g('commit', '-qm', 'done');
  return r;
}

test('0568 AC1: speck status --json lists the recommendations speck took in the last 7 days, newest first', () => {
  const entries = [
    { id: '0001', title: 'One', status: 'building', criteria_changed: false, foreman_took: [{ option: 'old', at: ago(7.1) }, { option: 'A', at: ago(3) }] },
    { id: '0002', title: 'Two', status: 'approved', criteria_changed: true, foreman_took: [{ option: 'B', at: ago(1) }, { option: 'edge', at: ago(7) }] },
    { id: '0003', title: 'Three', status: 'ready', criteria_changed: false, foreman_took: [] },
  ];
  assert.deepEqual(decidedFor(entries, e => e.criteria_changed, NOW), [
    { id: '0002', title: 'Two', option: 'B', at: ago(1), criteria_changed: true },
    { id: '0001', title: 'One', option: 'A', at: ago(3), criteria_changed: false },
    { id: '0002', title: 'Two', option: 'edge', at: ago(7), criteria_changed: true },
  ]);
});

test('0568 AC1: a ticket with nothing recent is never asked about its criteria', () => {
  const asked = [];
  decidedFor([{ id: '0001', foreman_took: [{ option: 'old', at: ago(9) }] }, { id: '0002', foreman_took: [{ option: 'A', at: ago(1) }, { option: 'B', at: ago(2) }] }], e => { asked.push(e.id); return false; }, NOW);
  assert.deepEqual(asked, ['0002'], 'once for the ticket with recent ones');
});

test('0568 AC1: a real board lists what speck chose and not what you chose, with the criteria change from the ticket\'s branch', () => {
  const r = changesRepo();
  const at = new Date(Date.now() - DAY).toISOString(), at2 = new Date(Date.now() - 2 * DAY).toISOString();
  onBranch(r, [took('Keep it small', at2), `- Went with the recommendation: Mine (chosen by you, ${noteAt(at)} UTC).`, took('Split it', at)], s => s.replace(OLD, NEW));
  const { decided } = statusData(r.dir);
  assert.deepEqual(decided.map(d => [d.id, d.option, d.criteria_changed]), [['0001', 'Split it', true], ['0001', 'Keep it small', true]]);
  assert.equal(decided[0].title, statusData(r.dir).tickets.find(t => t.id === '0001').title);
  assert.equal(decided[0].at.slice(0, 16), at.slice(0, 16));
});

test('0568 AC1: a shipped ticket still says whether its criteria changed, though its branch has gone', () => {
  const line = took('A', new Date(Date.now() - DAY).toISOString());
  const withNote = s => s.replace(/^## Out of scope\n/m, `## Notes\n${line}\n\n## Out of scope\n`);
  const changed = shippedTicket(s => withNote(s).replace(OLD, NEW)), same = shippedTicket(withNote);
  assert.deepEqual(statusData(changed.dir).decided.map(d => d.criteria_changed), [true]);
  assert.deepEqual(statusData(same.dir).decided.map(d => d.criteria_changed), [false]);
});

test('0568 AC1: with no recommendations taken there is nothing to list', () => {
  assert.equal(statusData(changesRepo().dir).decided, undefined);
});

// ----- the panel -----

test('0568 AC2: with none taken there is no line, and an older server gives none either', async () => {
  const none = board([T('0001', 'done')], []);
  await none.settle();
  assert.equal(none.byId('decided-open').hidden, true);
  const old = board([T('0001', 'done')], undefined);
  await old.settle();
  assert.equal(old.byId('decided-open').hidden, true);
});

test('0568 AC2: the line says how many, and pressing it opens the list with each one\'s id, title, option and when', async () => {
  const p = board([T('0001', 'done'), T('0002', 'building')], [D('0002', { criteria_changed: true }), D('0001')]);
  await p.settle();
  const line = p.byId('decided-open');
  assert.equal(line.hidden, false);
  assert.match(line.textContent, /\b2\b/);
  assert.equal(p.byId('decided').hidden, true, 'closed until pressed');
  await openList(p);
  assert.equal(p.byId('decided').hidden, false);
  assert.match(p.byId('decided').textContent, /Decided for you/);
  const [first, second] = rows(p);
  assert.equal(rows(p).length, 2);
  for (const want of ['0002', 'Ticket 0002', 'Option of 0002', '2026-11-08 10:30 UTC', 'so this one waits for you at Ship']) assert.ok(first.textContent.includes(want), `${want} in ${first.textContent}`);
  for (const want of ['0001', 'Ticket 0001', 'Option of 0001', '2026-11-08 10:30 UTC']) assert.ok(second.textContent.includes(want), `${want} in ${second.textContent}`);
  assert.ok(!second.textContent.includes('so this one waits'), 'only where it did');
});

test('0568 AC2: one decision is said in the singular, and text from a ticket stays text', async () => {
  const p = board([T('0001', 'done')], [D('0001', { title: '<b>bold</b>', option: '<i>x</i>' })]);
  await openList(p);
  assert.ok(!/\b1 decisions\b/.test(p.byId('decided-open').textContent), p.byId('decided-open').textContent);
  assert.ok(rows(p)[0].textContent.includes('<b>bold</b>'));
  assert.ok(rows(p)[0].textContent.includes('<i>x</i>'));
});

test('0568 AC3: only a decision whose ticket is approved and not shipping has a Change button', async () => {
  const p = board([T('0001', 'approved'), T('0002', 'done'), T('0003', 'building'), T('0004', 'approved', { ship: { running: true, started: '2026-11-09T10:00:00.000Z' } }), T('0005', 'blocked')],
    ['0001', '0002', '0003', '0004', '0005', '0006'].map(id => D(id)));
  await openList(p);
  const changes = rows(p).filter(r => p.all(r).some(n => n.tagName === 'button' && n.textContent === 'Change'));
  assert.deepEqual(changes.map(r => r.textContent.slice(0, 4)), ['0001']);
});

test('0568 AC3: Change closes the list and opens that ticket\'s review pack with Ask for changes', async () => {
  const p = board([T('0001', 'approved')], [D('0001')]);
  await openList(p);
  p.press(buttons(p, 'Change')[0]);
  await p.settle();
  assert.equal(p.byId('decided').hidden, true, 'the list has closed');
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.ok(p.answers.some(u => u === '/api/tickets/0001/pack'), 'the pack was asked for');
  const pane = p.all(p.byId('full-ticket'));
  assert.ok(pane.some(n => n.tagName === 'button' && n.textContent === 'Ask for changes'), 'Ask for changes, as in the pack');
  assert.ok(pane.some(n => /\bchanges-note\b/.test(n.className)), 'with its box');
});

test('0568 AC3: a redraw takes the Change button away once the ticket has moved on', async () => {
  const tickets = [T('0001', 'approved')];
  const p = board(tickets, [D('0001')]);
  await openList(p);
  assert.equal(buttons(p, 'Change').length, 1);
  tickets[0].status = 'done';
  await p.timers.shift()();
  await p.settle();
  assert.equal(buttons(p, 'Change').length, 0);
  assert.equal(p.byId('decided').hidden, false, 'the list stays open');
});

test('0568 AC4: Close and Escape close the list, and the page behind is held while it is open', async () => {
  const p = board([T('0001', 'done')], [D('0001')]);
  await openList(p);
  assert.equal(p.byId('decided-open').inert, true, 'Tab can\'t reach the line behind it');
  p.press(buttons(p, 'Close')[0]);
  await p.settle();
  assert.equal(p.byId('decided').hidden, true, 'Close');
  assert.equal(p.byId('decided-open').inert, false, 'and it can again');
  p.press(p.byId('decided-open'));
  await p.settle();
  assert.equal(p.byId('decided').hidden, false);
  p.key('Escape');
  await p.settle();
  assert.equal(p.byId('decided').hidden, true, 'Escape');
});

const skip = findChrome() ? {} : { skip: 'no Chromium here' };
test('0568 AC4: at 320 px the list and its line fit the width, however long the words', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && typeof state !== 'undefined' && !!state`, 'the panel');
    const long = 'x'.repeat(200);
    const decided = [{ id: '0001', title: long, option: long, question: long, other_options: [long, long], at: '2026-11-08T10:30:00.000Z', criteria_changed: true }, { id: '0002', title: 'Short', option: 'A much longer sentence than the short title, which has to wrap on a phone', at: '2026-11-08T10:00:00.000Z', criteria_changed: false }];
    await b.js(`state = { ...state, decided: ${JSON.stringify(decided)}, tickets: [{ ...${JSON.stringify(T('0001', 'approved'))} }] }; render(); document.getElementById('decided-open').click(); true`);
    await b.until(`!document.getElementById('decided').hidden && document.querySelectorAll('#decided .decided-row').length === 2`, 'the list');
    const m = await b.js(`(() => {
      const box = document.getElementById('decided'), vw = document.documentElement.clientWidth;
      const over = [...box.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > vw + 0.5).map(n => n.className);
      return { scroll: box.scrollWidth, client: box.clientWidth, vw, over, doc: document.documentElement.scrollWidth };
    })()`);
    assert.ok(m.scroll <= m.client, `no sideways scrolling: ${JSON.stringify(m)}`);
    assert.deepEqual(m.over, [], 'nothing past the edge of the screen');
    await b.js(`document.querySelector('#decided .close').click(); true`);
    await b.until(`document.getElementById('decided').hidden`, 'the list to close');
    const line = await b.js(`(() => { const r = document.getElementById('decided-open').getBoundingClientRect(); return { right: r.right, h: r.height, vw: document.documentElement.clientWidth }; })()`);
    assert.ok(line.right <= line.vw + 0.5 && line.h >= 44, JSON.stringify(line));
  } finally { await b.close(); }
});
