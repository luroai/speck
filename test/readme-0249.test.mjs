import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IMAGES = ['docs/images/demo-light.png', 'docs/images/demo-dark.png'];

// The PNG's chunks, in order: { type, data }.
function pngChunks(file) {
  const d = fs.readFileSync(path.join(ROOT, file));
  assert.equal(d.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} is a PNG`);
  const chunks = [];
  for (let i = 8; i < d.length;) {
    const n = d.readUInt32BE(i);
    chunks.push({ type: d.subarray(i + 4, i + 8).toString('latin1'), data: d.subarray(i + 8, i + 8 + n) });
    i += 12 + n;
  }
  return chunks;
}

const picture = () => read('README.md').match(/<picture>[\s\S]*?<\/picture>/)?.[0] || '';

// 0267: where the picture sits among the README's paragraphs is left to review.
test('0249 AC1: the README shows the demo picture', () => {
  assert.ok(picture(), 'the README has a <picture>');
  for (const f of IMAGES) assert.ok(picture().includes(f), `the picture uses ${f}`);
});

test('0249 AC2: a dark <source> for prefers-color-scheme: dark, falling back to the light image with alt text', () => {
  const p = picture();
  assert.match(p, /<source media="\(prefers-color-scheme: dark\)" srcset="docs\/images\/demo-dark\.png">/);
  const img = p.match(/<img [^>]*>/)?.[0] || '';
  assert.match(img, /src="docs\/images\/demo-light\.png"/);
  assert.match(img, /alt="[^"]+"/);
  assert.ok(p.indexOf('<source') < p.indexOf('<img'), 'the <img> fallback comes after the <source>');
});

test('0249 AC3: both images are committed under docs/images/, at least 1600 pixels wide and under 800 KB', () => {
  for (const f of IMAGES) {
    const ihdr = pngChunks(f)[0];
    assert.equal(ihdr.type, 'IHDR');
    assert.ok(ihdr.data.readUInt32BE(0) >= 1600, `${f} is at least 1600 pixels wide`);
    assert.ok(fs.statSync(path.join(ROOT, f)).size < 800 * 1024, `${f} is under 800 KB`);
  }
});

// What the images show is checked by looking at them (see the ticket's Notes). This checks that they carry no
// metadata that could name a person, an account or a version.
test('0249 AC4: neither image carries text or EXIF metadata', () => {
  for (const f of IMAGES) {
    const types = pngChunks(f).map(c => c.type);
    for (const t of ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']) assert.ok(!types.includes(t), `${f} has no ${t} chunk`);
  }
});
