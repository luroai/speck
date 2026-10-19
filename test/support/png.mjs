import fs from 'node:fs';

// A PNG file's chunks, in order: { type, data }. Throws when the file isn't a PNG.
export function pngChunks(file) {
  const d = fs.readFileSync(file);
  if (d.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`${file} isn't a PNG`);
  const chunks = [];
  for (let i = 8; i < d.length;) {
    const n = d.readUInt32BE(i);
    chunks.push({ type: d.subarray(i + 4, i + 8).toString('latin1'), data: d.subarray(i + 8, i + 8 + n) });
    i += 12 + n;
  }
  return chunks;
}
