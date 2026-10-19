import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngChunks } from './support/png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = ['docs/images/demo-light.png', 'docs/images/demo-dark.png'];

// AC1 and AC2 are about how the README reads, so review checks them. What the pictures show (AC3, AC4) is checked by
// looking at them: this checks the files themselves.
test('0306 AC3: both pictures are PNGs at least 1600 pixels wide, under 800 KB, with no text or EXIF metadata', () => {
  for (const f of IMAGES) {
    const chunks = pngChunks(path.join(ROOT, f));
    assert.equal(chunks[0].type, 'IHDR');
    assert.ok(chunks[0].data.readUInt32BE(0) >= 1600, `${f} is at least 1600 pixels wide`);
    assert.ok(fs.statSync(path.join(ROOT, f)).size < 800 * 1024, `${f} is under 800 KB`);
    for (const t of ['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']) assert.ok(!chunks.some(c => c.type === t), `${f} has no ${t} chunk`);
  }
});
