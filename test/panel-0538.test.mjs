import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fakePage, deferred, notes, top, panelModel, panelRepo, freePort, startPanel, stop, request, post, tokenOf } from './support/panel.mjs';
import { panelStarNote, starredText } from '../scripts/panel-star.mjs';

// ---------- 0538: star a note in Capture ----------

const text = (name, status, extra = '') => `# ${name}\n\nCaptured: 2026-10-20 14:05 · Status: ${status}\n${extra}From ticket: 0005\nRaised by: agent\n\n## What\nThe whole text of ${name}.\nStarred: yes in the body is only text.\n`;
const note = (name, status, extra = '', captured = '2026-10-20') => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\nCaptured: ${captured} · Status: ${status}\n${extra}\n## What\nThe whole text of ${name}.\n` });
const board = () => ({ tickets: [], ideas: [note('plain', 'idea', '', '2026-10-22'), note('liked', 'inbox', 'Starred: yes\n', '2026-10-21'), note('other', 'idea', 'Starred: no\n', '2026-10-20')] });
const star = card => top(card).children.find(n => /\bstar\b/.test(n.className));
const on = card => star(card).attrs['aria-pressed'] === 'true';
const posts = p => p.calls.filter(c => c.opts && c.opts.method === 'POST');
const opened = async (responses = [board()]) => { const p = fakePage(responses); await p.settle(); return p; };
// A folder with speck/ideas/ and the given notes, by file name.
function ideas(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-star-'));
  fs.mkdirSync(path.join(dir, 'speck', 'ideas', 'done'), { recursive: true });
  for (const [f, t] of Object.entries(files)) fs.writeFileSync(path.join(dir, 'speck', 'ideas', f), t);
  return { dir, read: f => fs.readFileSync(path.join(dir, 'speck', 'ideas', f), 'utf8') };
}

// ---------- AC1 ----------

test('0538 AC1: every card in Capture has a star button on its closed row, filled when starred', async () => {
  const p = await opened();
  assert.equal(notes(p).length, 3);
  for (const card of notes(p)) {
    assert.doesNotMatch(card.className, /\bopen\b/);
    assert.equal(star(card).tagName, 'button', 'a button on its top row');
  }
  assert.deepEqual(notes(p).map(on), [false, true, false]);
  assert.deepEqual(notes(p).map(c => /\bon\b/.test(star(c).className)), [false, true, false], 'empty, filled, empty');
  assert.ok(notes(p).every(c => star(c).children[0].tagName === 'svg'), 'drawn, as the fonts have no star');
});

test('0538 AC1: pressing the star stars the note, and pressing it again unstars it, without opening or closing the card', async () => {
  const p = await opened([board(), { ok: true }, { ok: true }]);
  p.press(star(notes(p)[0]));
  await p.settle();
  assert.equal(posts(p).at(-1).url, '/api/ideas/plain.md/star');
  assert.equal(on(notes(p)[0]), true, 'filled straight away');
  assert.doesNotMatch(notes(p)[0].className, /\bopen\b/, 'still closed');
  p.press(star(notes(p)[1]));
  await p.settle();
  assert.equal(posts(p).at(-1).url, '/api/ideas/liked.md/unstar');
  assert.equal(on(notes(p)[1]), false, 'empty straight away');
  assert.doesNotMatch(notes(p)[1].className, /\bopen\b/);
  // An open card stays open.
  p.press(top(notes(p)[2]));
  assert.match(notes(p)[2].className, /\bopen\b/);
});

test('0538 AC1: starring puts a Starred: yes line straight after the Captured line, and unstarring takes it out', () => {
  const r = ideas({ 'a.md': text('a', 'idea'), 'b.md': text('b', 'inbox', 'Starred: yes\n') });
  assert.equal(panelStarNote(r.dir, 'a.md', true).status, 200);
  const lines = r.read('a.md').split('\n');
  assert.equal(lines[lines.findIndex(l => l.startsWith('Captured:')) + 1], 'Starred: yes', 'on its own line, straight after');
  assert.equal(r.read('a.md'), text('a', 'idea', 'Starred: yes\n'));
  assert.equal(panelStarNote(r.dir, 'a.md', false).status, 200);
  assert.equal(r.read('a.md'), text('a', 'idea'), 'back as it was');
  assert.equal(panelStarNote(r.dir, 'b.md', false).status, 200);
  assert.equal(r.read('b.md'), text('b', 'inbox'));
});

test('0538 AC1: starring a starred note, or unstarring one that isn\'t, leaves it as it is', () => {
  for (const [t, want] of [[text('a', 'idea', 'Starred: yes\n'), true], [text('a', 'idea'), false]]) assert.equal(starredText(t, want), t);
  // A Starred line elsewhere in the header, or with another value, gives way to the one line in its place.
  assert.equal(starredText('# a\n\nCaptured: 2026-10-01 · Status: idea\nRaised by: you\nStarred: no\n\n## What\nx\n', true), '# a\n\nCaptured: 2026-10-01 · Status: idea\nStarred: yes\nRaised by: you\n\n## What\nx\n');
  // Windows line endings stay so.
  assert.equal(starredText('# a\r\n\r\nCaptured: 2026-10-01 · Status: idea\r\n\r\n## What\r\n', true), '# a\r\n\r\nCaptured: 2026-10-01 · Status: idea\r\nStarred: yes\r\n\r\n## What\r\n');
});

// ---------- AC2 ----------

test('0538 AC2: a note is starred only with a Starred: yes line in its header', () => {
  const m = panelModel()({ tickets: [], ideas: [
    note('yes', 'idea', 'Starred: yes\n'), note('spaced', 'idea', 'Starred:   yes  \n'), note('none', 'idea'), note('no', 'idea', 'Starred: no\n'),
    note('yes-please', 'idea', 'Starred: yes please\n'), note('upper', 'idea', 'Starred: Yes\n'), note('in-body', 'idea', '\n## Why\nStarred: yes\n'),
  ] });
  assert.deepEqual(Object.fromEntries(m.capture.map(i => [i.title, i.starred])),
    { yes: true, spaced: true, none: false, no: false, 'yes-please': false, upper: false, 'in-body': false });
});

test('0538 AC2: a note starred on another device shows as starred on the next board, and after a reload', async () => {
  const later = board();
  later.ideas[0] = note('plain', 'idea', 'Starred: yes\n', '2026-10-22');
  const p = await opened([board(), later]);
  assert.equal(on(notes(p)[0]), false);
  p.timers.shift()(); await p.settle();
  assert.equal(on(notes(p)[0]), true, 'the next board');
  const again = await opened([later]);
  assert.equal(on(notes(again)[0]), true, 'a reload');
});

test('0538 AC2: the panel stars the note on disk, and its board then shows it starred', async () => {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'liked.md'), text('liked', 'idea'));
  const head = () => spawnSync('git', ['rev-parse', 'HEAD'], { cwd: r.dir, encoding: 'utf8' }).stdout;
  const before = head();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const forbidden = await post(p.port, '/api/ideas/liked.md/star');
    assert.equal(forbidden.status, 403, 'only the panel page can');
    assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'ideas', 'liked.md'), 'utf8'), text('liked', 'idea'));
    const out = await post(p.port, '/api/ideas/liked.md/star', { token });
    assert.equal(out.status, 200, out.body);
    assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'ideas', 'liked.md'), 'utf8'), text('liked', 'idea', 'Starred: yes\n'));
    const state = JSON.parse((await request(p.port, { pathName: '/api/state' })).body);
    assert.equal(panelModel()(state).capture.find(i => i.title === 'liked').starred, true);
    assert.equal(head(), before, 'no commit');
  } finally { await stop(p); }
});

// ---------- AC3 ----------

test('0538 AC3: starring changes no other line and no status, makes no commit, and doesn\'t move the note', () => {
  const r = ideas({ 'a.md': text('a', 'inbox') });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: r.dir });
  spawnSync('git', ['add', '.'], { cwd: r.dir });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'notes'], { cwd: r.dir });
  const log = () => spawnSync('git', ['log', '--oneline'], { cwd: r.dir, encoding: 'utf8' }).stdout;
  const before = log(), was = r.read('a.md').split('\n');
  panelStarNote(r.dir, 'a.md', true);
  const now = r.read('a.md').split('\n');
  assert.deepEqual(now.filter(l => l !== 'Starred: yes'), was, 'only the one line added');
  assert.match(now.find(l => l.startsWith('Captured:')), /Status: inbox$/, 'its status as it was');
  assert.equal(log(), before, 'no commit');
  const m = panelModel()({ tickets: [], ideas: [note('x', 'idea', '', '2026-10-25'), note('y', 'idea', 'Starred: yes\n', '2026-10-20'), note('z', 'inbox', '', '2026-10-10')] });
  assert.deepEqual(m.capture.map(i => i.title), ['x', 'y', 'z'], 'by date alone, the star moves nothing');
});

// ---------- AC4 ----------

test('0538 AC4: a note that\'s gone, or no longer an idea or inbox note, is refused and left as it is', () => {
  const r = ideas({ 'ticketed.md': text('ticketed', 'ticketed (0012)'), 'dropped.md': text('dropped', 'dropped') });
  const gone = panelStarNote(r.dir, 'gone.md', true);
  assert.equal(gone.status, 404);
  assert.match(gone.body.error, /speck\/ideas\/gone\.md is gone/);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'ideas', 'gone.md')), false, 'not made');
  for (const [f, st] of [['ticketed.md', 'ticketed (0012)'], ['dropped.md', 'dropped']]) for (const want of [true, false]) {
    const out = panelStarNote(r.dir, f, want);
    assert.equal(out.status, 409);
    assert.match(out.body.error, new RegExp(`"${st.replace(/[()]/g, '\\$&')}" now, not an idea or inbox note`));
    assert.equal(r.read(f), text(f.slice(0, -3), st), 'unchanged');
  }
  for (const bad of ['../x.md', 'done/x.md', '.hidden.md', 'x.txt', '', 'done']) assert.equal(panelStarNote(r.dir, bad, true).status, 400, bad);
});

test('0538 AC4: a refused star shows the server\'s reason on the card and goes back as it was', async () => {
  const reason = 'speck/ideas/plain.md is gone, so it can\'t be starred. It may have been ticketed, dropped or renamed in chat.';
  const p = await opened([board(), { status: 404, body: { error: reason } }, new Error('down')]);
  p.press(star(notes(p)[0]));
  await p.settle();
  assert.equal(on(notes(p)[0]), false, 'empty again');
  assert.equal(notes(p)[0].children.find(n => /\bstar-refused\b/.test(n.className)).textContent, reason);
  assert.doesNotMatch(notes(p)[0].className, /\bopen\b/, 'shown on the closed card');
  p.press(star(notes(p)[0]));
  await p.settle();
  assert.match(notes(p)[0].children.find(n => /\bstar-refused\b/.test(n.className)).textContent, /Couldn't reach the panel server/);
});

test('0538 AC4: the star is a button that says whether the note is starred', async () => {
  const p = await opened();
  const [a, b] = notes(p).map(star);
  assert.equal(a.type, 'button');
  assert.equal(a.attrs['aria-label'], 'Star plain');
  assert.equal(a.attrs['aria-pressed'], 'false');
  assert.equal(b.attrs['aria-pressed'], 'true');
});

test('0538 AC1: only the last press counts, and the board after the server\'s answer says what the note is', async () => {
  const first = deferred(), edited = board();
  edited.ideas[0] = note('plain', 'idea', 'Starred: no\n', '2026-10-22');
  const p = await opened([board(), first, { ok: true }, edited]);
  p.press(star(notes(p)[0])); // star
  await p.settle();
  p.press(star(notes(p)[0])); // and unstar, before the first is answered
  await p.settle();
  first.resolve({ ok: false, status: 409, json: async () => ({ error: 'Late refusal.' }) });
  await p.settle();
  assert.equal(on(notes(p)[0]), false, 'the last press');
  assert.equal(notes(p)[0].children.some(n => /\bstar-refused\b/.test(n.className)), false, 'an earlier press answered late shows nothing');
  const q = await opened([board(), { ok: true }, board()]);
  q.press(star(notes(q)[0]));
  await q.settle();
  assert.equal(on(notes(q)[0]), true);
  q.timers.shift()(); await q.settle();
  assert.equal(on(notes(q)[0]), false, 'a board after the answer that says otherwise wins');
});

test('0538 AC4: a star pressed from the keyboard keeps the focus', async () => {
  const p = fakePage([board(), { ok: true }], {}, { made: n => { n.focus = () => { p.document.activeElement = n; }; } });
  await p.settle();
  const b = star(notes(p)[0]);
  b.focus();
  p.press(b);
  await p.settle();
  assert.notEqual(star(notes(p)[0]), b, 'a new button');
  assert.equal(p.document.activeElement, star(notes(p)[0]), 'with the focus on it');
});

test('0538: the brief says the star adds a Starred: yes line after the Captured: line', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck panel'));
  assert.match(row, /`Starred: yes`/);
  assert.match(row, /`Captured:`/);
});
