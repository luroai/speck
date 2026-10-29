// 0561: a task's review pack opens with its summary.md, labelled "Start here", then the Ship part, then its other files.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewPack } from '../scripts/pack.mjs';
import { panelDocuments } from '../scripts/output.mjs';
import { findTicket } from '../scripts/core.mjs';
import { shipRepo } from './support/speck.mjs';
import { docRepo, PACK, DOCS, text, openPack, pane, docView } from './support/documents.mjs';

const SUMMARY = { path: 'outputs/memos/summary.md', url: '/api/tickets/0005/output/summary.md', summary: true };
// The pane's own nodes, top to bottom, and the index of the first one holding `pick`.
const at = (p, pick) => pane(p).children.findIndex(n => p.all(n).includes(pick));
const buttons = p => p.all(pane(p)).filter(n => n.tagName === 'button');
const ship = p => buttons(p).find(n => n.textContent === 'Ship');
const fileButtons = p => buttons(p).filter(n => n.className === 'pack-document');

// ---------- AC1: the skill tells a task's build to write summary.md ----------

test('0561 AC1: the speck-build skill\'s paragraph on a task names summary.md at the top of the output folder', () => {
  const skill = fs.readFileSync(new URL('../skills/speck-build/SKILL.md', import.meta.url), 'utf8');
  const task = skill.split('\n').find(l => l.startsWith('**A task**'));
  assert.ok(task, 'the paragraph on a task');
  assert.match(task, /`summary\.md`/);
});

// ---------- AC2: the summary first, labelled Start here, then Ship, then the rest ----------

test('0561 AC2: the summary\'s button comes first, labelled Start here, then the Ship part, then the other files', async () => {
  const p = await openPack({ pack: PACK, documents: [SUMMARY, ...DOCS] });
  const files = fileButtons(p);
  assert.deepEqual(files.map(b => b.textContent), ['Start here', ...DOCS.map(d => d.path)]);
  const s = ship(p);
  assert.ok(s, 'the Ship part is there');
  assert.equal(at(p, files[0]), 1, 'straight under the pane\'s top line');
  assert.equal(at(p, s), 2, 'the Ship part straight after the summary');
  for (const b of files.slice(1)) assert.ok(at(p, b) > at(p, s), `${b.textContent} is below the Ship part`);
  const body = pane(p).children.findIndex(n => n.className === 'md');
  for (const b of files.slice(1)) assert.ok(at(p, b) < body, `${b.textContent} is above the pack's text`);
});

test('0561 AC2: pressing Start here shows the summary formatted, as other Markdown files are', async () => {
  const opened = [];
  const p = await openPack({ pack: PACK, documents: [SUMMARY, ...DOCS] }, [text('# What I found\n\nRead **memo.md**.\n')], { window: { open: (...a) => opened.push(a) } });
  p.press(fileButtons(p)[0]);
  await p.settle();
  assert.deepEqual(opened, [], 'no new tab');
  const all = p.all(docView(p));
  assert.ok(all.some(n => /^h/.test(n.tagName) && n.textContent === 'What I found'), 'shown formatted in the pop-up');
  assert.ok(all.some(n => n.tagName === 'strong' && n.textContent === 'memo.md'));
});

test('0561 AC2: the server lists a top-level summary.md first, in any case, marked as the summary', () => {
  const r = docRepo();
  fs.writeFileSync(path.join(r.out, 'Summary.MD'), '# Summary\n');
  const docs = panelDocuments(r.dir, findTicket(r.dir, '1'));
  assert.equal(docs[0].path, 'outputs/memos/pricing/Summary.MD');
  assert.equal(docs[0].summary, true);
  assert.equal(docs[0].url, '/api/tickets/0001/output/Summary.MD');
  assert.deepEqual(docs.slice(1).map(d => d.path), ['outputs/memos/pricing/drafts/first.md', 'outputs/memos/pricing/figures.pdf', 'outputs/memos/pricing/memo.md']);
  assert.ok(docs.slice(1).every(d => !d.summary), 'only the summary is marked');
});

// ---------- AC3: no summary, or one in a subfolder, shows the files as today ----------

test('0561 AC3: a task with no summary shows its files above the Ship part, as today', async () => {
  const p = await openPack({ pack: PACK, documents: DOCS });
  const files = fileButtons(p);
  assert.deepEqual(files.map(b => b.textContent), DOCS.map(d => d.path));
  assert.ok(!buttons(p).some(b => b.textContent === 'Start here'));
  for (const b of files) assert.ok(at(p, b) < at(p, ship(p)), `${b.textContent} is above the Ship part`);
});

test('0561 AC3: a summary.md inside a subfolder isn\'t taken as the summary', () => {
  const r = docRepo();
  fs.writeFileSync(path.join(r.out, 'drafts', 'summary.md'), '# Not the summary\n');
  const docs = panelDocuments(r.dir, findTicket(r.dir, '1'));
  assert.ok(docs.every(d => !d.summary), 'none marked');
  assert.deepEqual(docs.map(d => d.path), ['outputs/memos/pricing/drafts/first.md', 'outputs/memos/pricing/drafts/summary.md',
    'outputs/memos/pricing/figures.pdf', 'outputs/memos/pricing/memo.md'], 'in order, as today');
  const pack = reviewPack(r.dir, '1');
  const result = pack.slice(pack.indexOf('### Result'), pack.indexOf('### Acceptance criteria'));
  assert.ok(result.indexOf('drafts/first.md') < result.indexOf('drafts/summary.md'), 'listed in order, as today');
});

// ---------- AC4: speck pack lists the summary first ----------

test('0561 AC4: speck pack lists the summary first under Result', () => {
  const r = docRepo();
  fs.writeFileSync(path.join(r.out, 'summary.md'), '# Summary\n');
  const lines = reviewPack(r.dir, '1').split('\n');
  const result = lines.indexOf('### Result');
  assert.ok(result >= 0);
  assert.deepEqual(lines.slice(result + 1, result + 6), ['- `outputs/memos/pricing/summary.md`', '- `outputs/memos/pricing/drafts/first.md`',
    '- `outputs/memos/pricing/figures.pdf`', '- `outputs/memos/pricing/memo.md`', '']);
});

test('0561 AC4: without a summary, speck pack lists the files as today, and a code ticket\'s pack has no Result', () => {
  const r = docRepo();
  const lines = reviewPack(r.dir, '1').split('\n');
  const result = lines.indexOf('### Result');
  assert.deepEqual(lines.slice(result + 1, result + 4), ['- `outputs/memos/pricing/drafts/first.md`', '- `outputs/memos/pricing/figures.pdf`', '- `outputs/memos/pricing/memo.md`']);
  const code = shipRepo();
  fs.mkdirSync(path.join(code.dir, 'outputs'), { recursive: true });
  fs.writeFileSync(path.join(code.dir, 'outputs', 'summary.md'), '# Not a task\n');
  assert.ok(!reviewPack(code.dir, '1').includes('### Result'));
  assert.deepEqual(panelDocuments(code.dir, findTicket(code.dir, '1')), []);
});
