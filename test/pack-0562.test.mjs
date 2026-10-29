// 0562: a task's review pack lists the files at the top of its output folder one by one, named from inside it, and each
// folder inside it as one row, folded at first.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACK, text, openPack, pane, docView } from './support/documents.mjs';

const doc = (rel, more = {}) => ({ path: `outputs/research/run/${rel}`, url: `/api/tickets/0005/output/${rel.split('/').map(encodeURIComponent).join('/')}`, ...more });
const SUMMARY = doc('summary.md', { summary: true });
// As the server lists them: the summary first, then the rest in path order.
const DOCS = [SUMMARY, doc('drafts/first.md'), doc('imports/a.log'), doc('imports/deep/b.md'), doc('imports/deep/c d.csv'), doc('memo.md'), doc('report.pdf')];
const open = (more = [], globals = {}, made) => openPack({ pack: PACK, documents: DOCS }, more, globals, made);
const files = p => p.all(pane(p)).filter(n => n.className === 'pack-document');
const folders = p => p.all(pane(p)).filter(n => n.className === 'pack-folder');
const folder = (p, name) => folders(p).find(n => n.textContent.startsWith(`${name}/`));
// The file rows and folder rows, top to bottom.
const rows = p => p.all(pane(p)).filter(n => n.className === 'pack-document' || n.className === 'pack-folder').map(n => n.textContent);

// ---------- AC1: top-level files by name, each folder one folded row with its count ----------

test('0562 AC1: files at the top are named alone, and each folder is one folded row saying how many files it holds however deep', async () => {
  const p = await open();
  assert.deepEqual(rows(p), ['Start here', 'drafts/ · 1 file', 'imports/ · 3 files', 'memo.md', 'report.pdf']);
  for (const f of folders(p)) assert.equal(f.tagName, 'button');
  for (const f of folders(p)) assert.equal(f.attrs['aria-expanded'], 'false', `${f.textContent} is folded at first`);
});

test('0562 AC1: a task with no subfolders shows only its files, named alone', async () => {
  const p = await openPack({ pack: PACK, documents: [doc('memo.md'), doc('report.pdf')] });
  assert.deepEqual(rows(p), ['memo.md', 'report.pdf']);
});

// ---------- AC2: pressing a folder unfolds and folds it; its files open as today ----------

test('0562 AC2: pressing a folder lists each file it holds, named inside it, in order, and pressing it again folds it', async () => {
  const p = await open();
  p.press(folder(p, 'imports'));
  assert.deepEqual(rows(p), ['Start here', 'drafts/ · 1 file', 'imports/ · 3 files', 'a.log', 'deep/b.md', 'deep/c d.csv', 'memo.md', 'report.pdf']);
  p.press(folder(p, 'imports'));
  assert.deepEqual(rows(p), ['Start here', 'drafts/ · 1 file', 'imports/ · 3 files', 'memo.md', 'report.pdf']);
});

test('0562 AC2: a folder stays unfolded when the pane is drawn again, and folds again when the pack is opened again', async () => {
  const p = await open([{ status: 409, body: { error: 'Not now.' } }, { pack: PACK, documents: DOCS }], { confirm: () => true });
  p.press(folder(p, 'drafts'));
  const was = pane(p).children[1];
  p.press(p.all(pane(p)).find(n => n.tagName === 'button' && n.textContent === 'Ship')); // its refusal draws the pane again
  await p.settle();
  assert.ok(pane(p).textContent.includes('Not now.'), 'drawn again');
  assert.notEqual(pane(p).children[1], was, 'with new nodes');
  assert.ok(rows(p).includes('first.md'), 'still unfolded');
  assert.equal(folder(p, 'drafts').attrs['aria-expanded'], 'true');
  p.press(p.all(pane(p)).find(n => n.tagName === 'button' && n.textContent === 'Close'));
  await p.settle();
  p.press(p.all(p.byId('queue')).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  assert.deepEqual(rows(p), ['Start here', 'drafts/ · 1 file', 'imports/ · 3 files', 'memo.md', 'report.pdf'], 'folded again');
});

test('0562 AC2: a Markdown file in a folder opens formatted in the panel, and any other in a new tab', async () => {
  const opened = [];
  const p = await open([text('# Bee\n\nIt **is** b.\n')], { window: { open: (...a) => opened.push(a) } });
  p.press(folder(p, 'imports'));
  p.press(files(p).find(n => n.textContent === 'deep/c d.csv'));
  assert.deepEqual(opened.map(a => a.slice(0, 2)), [[doc('imports/deep/c d.csv').url, '_blank']]);
  p.press(files(p).find(n => n.textContent === 'deep/b.md'));
  await p.settle();
  assert.ok(p.calls.some(c => c.url === doc('imports/deep/b.md').url), 'fetched from the panel');
  assert.ok(p.all(docView(p)).some(n => n.tagName === 'strong' && n.textContent === 'is'), 'shown formatted');
  assert.equal(opened.length, 1, 'no new tab for the Markdown file');
});

// ---------- AC3: each file's tooltip is its path from the project root ----------

test('0562 AC3: each file\'s row has its full path from the project root as its tooltip', async () => {
  const p = await open();
  for (const f of folders(p)) p.press(f);
  const shown = files(p);
  assert.equal(shown.length, DOCS.length);
  assert.deepEqual(shown.map(n => n.title), DOCS.map(d => d.path));
});

// ---------- AC4: keyboard and screen reader ----------

test('0562 AC4: a folder\'s row is a button, so the keyboard reaches and presses it, and aria-expanded tells whether it\'s unfolded', async () => {
  const focusable = n => { n.focus = () => {}; };
  const p = await open([], {}, focusable);
  const f = folder(p, 'imports');
  assert.equal(f.tagName, 'button');
  assert.equal(f.type, 'button');
  assert.equal(f.attrs['aria-expanded'], 'false');
  p.press(f);
  assert.equal(folder(p, 'imports'), f, 'the same button, so the focus stays on it');
  assert.equal(f.attrs['aria-expanded'], 'true');
  p.press(f);
  assert.equal(f.attrs['aria-expanded'], 'false');
});
