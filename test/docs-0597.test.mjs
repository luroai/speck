import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngChunks } from './support/png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brief = () => fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
const row = () => brief().split('\n').find(l => l.startsWith('| `speck panel')) || '';

// ---------- 0597: bring the docs up to date with the new panel ----------

// AC3 is about how the README reads, and what the pictures show is checked by looking at them, so review checks those.
test('0597 AC1: the brief\'s panel row names each part of the redesigned panel', () => {
  const text = row();
  for (const name of ['black bar', 'tabs', 'compact row', 'full view', 'Decided for you', 'Pipeline log', 'Settings', 'bridge', 'All projects']) assert.ok(text.includes(name), name);
});

test('0597 AC1: the brief\'s panel row no longer describes the LCD screen', () => {
  for (const name of [/\bLCD\b/i, /dot-matrix/i, /dark frame/i, /Pressing the screen/i, /\bnaps\b/, /pop-up, which shows `speck run`/]) assert.doesNotMatch(row(), name);
});

test('0597 AC2: each picture is a PNG at least 1600 pixels wide, under 800 KB, with no metadata, and not the LCD panel\'s', () => {
  const old = { 'demo-light.png': '3fb1876bfe20a21c63b6809c155962a734584fbcbc5f280fe77449218d0bb589', 'demo-dark.png': 'b8d6af58a9689cd5f94cd227d3d15b0d9201ed8a7b4facf52721764496b25ed5' };
  for (const [name, was] of Object.entries(old)) {
    const file = path.join(ROOT, 'docs', 'images', name);
    assert.notEqual(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), was, `${name} is taken again`);
    const chunks = pngChunks(file);
    assert.ok(chunks[0].data.readUInt32BE(0) >= 1600, `${name} is at least 1600 pixels wide`);
    assert.ok(fs.statSync(file).size < 800 * 1024, `${name} is under 800 KB`);
    for (const t of ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']) assert.ok(!chunks.some(c => c.type === t), `${name} has no ${t} chunk`);
  }
});

test('0597 AC4: the brief names nothing the redesign removed', () => {
  for (const name of ['lcd.js', 'Doto', 'dot-matrix', 'docs/design/lcd']) assert.ok(!brief().includes(name), name);
  assert.doesNotMatch(brief(), /\bLCD\b/i);
  for (const file of brief().match(/\btemplates\/[\w./-]+\.\w+/g) || []) assert.ok(fs.existsSync(path.join(ROOT, file)), file);
});
