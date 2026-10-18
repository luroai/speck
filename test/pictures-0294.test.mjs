// 0294: pictures of a visual change, kept with the ticket's review pack and shown in the panel.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewPack, panelPack } from '../scripts/pack.mjs';
import { addPicture, clearPictures, readPictures, pictureFile } from '../scripts/pictures.mjs';
import { shipRepo } from './support/speck.mjs';
import { fakePage, T, queueRows, startPanel, freePort, stop, raw, request } from './support/panel.mjs';

// The smallest real pictures of each kind speck keeps: the bytes each starts with, and a little more.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('rest of a png')]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('rest of a jpeg')]);
function pictureFiles() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-pictures-'));
  const at = (name, body) => { fs.writeFileSync(path.join(dir, name), body); return path.join(dir, name); };
  return { png: at('light.png', PNG), jpg: at('dark.jpg', JPG), text: at('notes.txt', 'not a picture'), dir };
}
const cacheOf = dir => path.join(dir, 'speck', '.cache', 'pictures', '0001');

test('0294 AC2: pictures are kept in speck/.cache/, not committed, and speck pack lists each with what it shows', () => {
  const r = shipRepo();
  const f = pictureFiles();
  const one = r.run('picture', '1', f.png, 'The review pack, light look');
  assert.equal(one.status, 0, one.stderr);
  assert.equal(r.run('picture', '1', f.jpg, 'The review pack,\n dark look').status, 0);
  const kept = fs.readdirSync(cacheOf(r.dir)).sort();
  assert.deepEqual(kept, ['1.png', '2.jpg', 'pictures.json']);
  assert.deepEqual(fs.readFileSync(path.join(cacheOf(r.dir), '1.png')), PNG);
  assert.equal(r.g('status', '--porcelain'), '', 'nothing to commit: git ignores speck/.cache/');
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /### Pictures\n- The review pack, light look: `[^`]*1\.png`\n- The review pack, dark look: `[^`]*2\.jpg`/);
  assert.ok(pack.stdout.includes(path.join(fs.realpathSync(cacheOf(r.dir)), '1.png')), 'it gives the file, to open it');
});

test('0294 AC2: a picture kept from a ticket\'s worktree is listed from the main checkout, where the panel runs', () => {
  const r = shipRepo();
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-wt-')), 'wt');
  r.g('worktree', 'add', '-q', '-b', 'other', wt, 'main');
  addPicture(wt, '1', pictureFiles().png, 'From the worktree');
  assert.deepEqual(readPictures(r.dir, '1').map(p => p.caption), ['From the worktree']);
  assert.ok(fs.existsSync(path.join(cacheOf(r.dir), '1.png')), 'kept in the main checkout');
  assert.ok(!fs.existsSync(path.join(wt, 'speck', '.cache', 'pictures')), 'not in the worktree');
});

test('0294 AC2: speck picture refuses what it can\'t keep, with a plain message, and keeps nothing', () => {
  const r = shipRepo();
  const f = pictureFiles();
  for (const [args, said] of [
    [[f.text, 'Caption'], /isn't a PNG, JPEG or WebP picture/],
    [[path.join(f.dir, 'missing.png'), 'Caption'], /there is no such file/],
    [[f.png, '  '], /Say what the picture shows/],
    [[f.png], /Usage: speck picture/],
  ]) {
    const out = r.run('picture', '1', ...args);
    assert.notEqual(out.status, 0, args.join(' '));
    assert.match(out.stderr, said);
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
  }
  const unknown = r.run('picture', '42', f.png, 'Caption');
  assert.notEqual(unknown.status, 0);
  assert.doesNotMatch(unknown.stderr, /\n\s+at /);
  assert.deepEqual(readPictures(r.dir, '1'), []);
});

test('0294 AC2: --clear removes the ticket\'s pictures, so a later build doesn\'t keep stale ones', () => {
  const r = shipRepo();
  const f = pictureFiles();
  addPicture(r.dir, '1', f.png, 'Old');
  const cleared = r.run('picture', '1', '--clear');
  assert.equal(cleared.status, 0, cleared.stderr);
  assert.deepEqual(readPictures(r.dir, '1'), []);
  addPicture(r.dir, '1', f.png, 'New');
  assert.deepEqual(readPictures(r.dir, '1').map(p => [path.basename(p.file), p.caption]), [['1.png', 'New']]);
});

test('0294 AC2: a list that is broken, or names files that have gone or aren\'t its own, lists only what it can show', () => {
  const r = shipRepo();
  const f = pictureFiles();
  addPicture(r.dir, '1', f.png, 'Kept');
  const list = path.join(cacheOf(r.dir), 'pictures.json');
  const good = JSON.parse(fs.readFileSync(list, 'utf8'));
  fs.writeFileSync(list, JSON.stringify([...good, { file: '9.png', caption: 'Gone' }, { file: '../../config.yml', caption: 'Outside' },
    { file: '1.png' }, null, 'x', { file: 'constructor', caption: 'Built in' }, { file: '1.png', caption: 'Two\nlines' }]));
  assert.deepEqual(readPictures(r.dir, '1').map(p => p.caption), ['Kept', 'Two lines'], 'a caption keeps to one line, so the pack\'s list does');
  assert.equal(pictureFile(r.dir, '1', '3'), null);
  fs.writeFileSync(list, '{ not json');
  assert.deepEqual(readPictures(r.dir, '1'), []);
  assert.doesNotMatch(reviewPack(r.dir, '1'), /Pictures/);
});

// ---------- AC3: the panel's review pack shows them ----------

const PACK = ['## 0005 · Ticket 0005', '**Verdict:** ✅ Approved by reviewer', '', '**Summary:** Fine.', '',
  '### Acceptance criteria', '| # | Criterion | Result | Evidence |', '|---|---|---|---|', '| 1 | One. | ✅ | ok |', '',
  '### Risk', '- Ticket risk: **low**', '', '_Generated by speck. The merge decision is yours._'].join('\n');
const PICTURES = [{ caption: 'Light look', url: '/api/tickets/0005/pictures/1' }, { caption: 'Dark look', url: '/api/tickets/0005/pictures/2' }];
const STATE = { ideas: [], tickets: [T('0005', 'approved', { started: new Date(Date.now() - 60000).toISOString() })] };

async function openPack(response) {
  const p = fakePage([structuredClone(STATE), { text: '', truncated: false }, response, structuredClone(STATE)]);
  await p.settle();
  const row = () => queueRows(p).find(n => n.textContent.includes('0005'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  p.press(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  return p;
}
const figures = p => p.all(p.byId('full-ticket')).filter(n => n.tagName === 'figure');

test('0294 AC3: the panel\'s review pack shows each picture with its caption, under the criteria, opening full size when pressed', async () => {
  const p = await openPack({ pack: PACK, pictures: PICTURES });
  const figs = figures(p);
  assert.equal(figs.length, 2);
  for (const [i, fig] of figs.entries()) {
    const [a, caption] = fig.children;
    const img = a.children[0];
    assert.equal(a.tagName, 'a');
    assert.equal(img.tagName, 'img');
    assert.equal(img.src, PICTURES[i].url);
    assert.equal(img.alt, PICTURES[i].caption);
    assert.equal(a.href, PICTURES[i].url, 'pressing it opens the picture itself, full size');
    assert.equal(a.target, '_blank');
    assert.equal(caption.tagName, 'figcaption');
    assert.equal(caption.textContent, PICTURES[i].caption);
  }
  const md = p.all(p.byId('full-ticket')).find(n => n.className === 'md');
  const order = md.children.map(n => n.className || n.tagName);
  assert.ok(order.indexOf('pack-pictures') === order.indexOf('ac-table') + 2, `under the criteria: ${order}`);
  assert.ok(md.children[order.indexOf('ac-table') + 1].textContent === 'Pictures');
});

test('0294 AC3: a picture the server lists with an address that isn\'t its own is left out', async () => {
  const p = await openPack({ pack: PACK, pictures: [...PICTURES, { caption: 'Elsewhere', url: 'https://example.com/x.png' }, { url: '/api/tickets/0005/pictures/3' }, 'x'] });
  assert.deepEqual(figures(p).map(f => f.children[1].textContent), ['Light look', 'Dark look']);
});

test('0294 AC3: the panel server lists the pictures with the pack and serves each one', async () => {
  const r = shipRepo();
  const f = pictureFiles();
  addPicture(r.dir, '1', f.png, 'Light look');
  addPicture(r.dir, '1', f.jpg, 'Dark look');
  const out = panelPack(r.dir, '1');
  assert.equal(out.status, 200);
  assert.deepEqual(out.body.pictures, [{ caption: 'Light look', url: '/api/tickets/0001/pictures/1' }, { caption: 'Dark look', url: '/api/tickets/0001/pictures/2' }]);
  assert.doesNotMatch(out.body.pack, /Pictures/, 'the panel shows them itself, so the text leaves them out');
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const one = await raw(p.port, '/api/tickets/1/pictures/1');
    assert.equal(one.status, 200);
    assert.equal(one.headers['content-type'], 'image/png');
    assert.deepEqual(one.body, PNG);
    const two = await raw(p.port, '/api/tickets/0001/pictures/2');
    assert.equal(two.headers['content-type'], 'image/jpeg');
    assert.deepEqual(two.body, JPG);
    assert.equal((await request(p.port, { pathName: '/api/tickets/1/pictures/3' })).status, 404);
    assert.equal((await request(p.port, { pathName: '/api/tickets/42/pictures/1' })).status, 404);
  } finally { await stop(p); }
});

// ---------- AC4: a pack with no pictures looks as it does today ----------

test('0294 AC4: with no pictures, speck pack and the panel\'s pack are as they were', () => {
  const r = shipRepo();
  const before = reviewPack(r.dir, '1');
  assert.doesNotMatch(before, /Pictures/);
  assert.deepEqual(Object.keys(panelPack(r.dir, '1').body), ['pack'], 'the panel gets the pack alone, as before');
  assert.equal(panelPack(r.dir, '1').body.pack, before);
  addPicture(r.dir, '1', pictureFiles().png, 'A picture');
  assert.notEqual(reviewPack(r.dir, '1'), before);
  clearPictures(r.dir, '1');
  assert.equal(reviewPack(r.dir, '1'), before);
});

test('0294 AC4: the panel shows a pack without pictures as before: no Pictures heading and no figure', async () => {
  for (const response of [{ pack: PACK }, { pack: PACK, pictures: [] }, { pack: PACK, pictures: 'x' }]) {
    const p = await openPack(response);
    assert.equal(figures(p).length, 0);
    assert.ok(!p.byId('full-ticket').textContent.includes('Pictures'), JSON.stringify(response));
    assert.ok(p.byId('full-ticket').textContent.includes('Generated by speck'), 'the pack is shown');
  }
});

// ---------- the facts the docs and the build skill give ----------

test('0294 AC1 AC2: the build skill, the brief and speck help name the command and where the pictures are kept', () => {
  const read = f => fs.readFileSync(path.join(import.meta.dirname, '..', f), 'utf8');
  const skill = read('skills/speck-build/SKILL.md'), brief = read('docs/brief.md');
  for (const fact of ['speck picture <id> --clear', 'speck picture <id> <file> "<caption>"', 'speck/.cache/pictures/<id>/', 'speck panel --port']) assert.ok(skill.includes(fact), fact);
  for (const fact of ['speck picture <id> <file> "<caption>"', 'speck picture <id> --clear', 'speck/.cache/pictures/<id>/']) assert.ok(brief.includes(fact), fact);
  const help = shipRepo().run('help');
  assert.match(help.stdout, /speck picture <id> <file> "<caption>"/);
});
