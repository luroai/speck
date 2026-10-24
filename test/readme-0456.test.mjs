import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngChunks } from './support/png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = ['docs/images/demo-light.png', 'docs/images/demo-dark.png'];

// AC1, AC3 and AC4 are about what the pictures show and how the alt text reads, so review checks them by looking.
test('0456 AC2: both pictures are PNGs at least 1600 pixels wide, under 800 KB, with no text or EXIF metadata', () => {
  for (const f of IMAGES) {
    const file = path.join(ROOT, f);
    assert.deepEqual([...fs.readFileSync(file).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${f} is a PNG`);
    const chunks = pngChunks(file);
    assert.equal(chunks[0].type, 'IHDR');
    assert.ok(chunks[0].data.readUInt32BE(0) >= 1600, `${f} is at least 1600 pixels wide`);
    assert.ok(fs.statSync(file).size < 800 * 1024, `${f} is under 800 KB`);
    for (const t of ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']) assert.ok(!chunks.some(c => c.type === t), `${f} has no ${t} chunk`);
  }
});
