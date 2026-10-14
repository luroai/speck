// 0149: draws the panel's PNG icons from templates/icons/icon.svg, with no dependencies, so the PNGs can be checked
// against the SVG and made again when it changes: node -e "import('./test/support/icons.mjs').then(m => m.writeIcons())"
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT } from './panel.mjs';

export const ICONS = path.join(ROOT, 'templates', 'icons');
// Each PNG the panel serves, with its size in pixels.
export const PNGS = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

const num = (s, re) => Number((s.match(re) || [])[1]);
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// The logo as the SVG gives it: the background, each arc (an SVG arc from one point to another, absolute or relative,
// turned into its centre and the angles it covers) with their shared stroke, the dot, and the group's translate (0170).
export function logo(svg = fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8')) {
  const arcs = [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map(m => arc(m[1]));
  const move = (svg.match(/<g[^>]* transform="translate\(([-\d.]+)[\s,]+([-\d.]+)\)"/) || []).slice(1).map(Number);
  return {
    bg: rgb((svg.match(/<rect[^>]* fill="(#[0-9a-f]{6})"/i) || [])[1]),
    ink: rgb((svg.match(/<(?:g|path)[^>]* stroke="(#[0-9a-f]{6})"/i) || [])[1]),
    half: num(svg, /stroke-width="([\d.]+)"/) / 2,
    arcs,
    at: move.length ? move : [0, 0],
    dot: { cx: num(svg, /<circle[^>]* cx="([\d.]+)"/), cy: num(svg, /<circle[^>]* cy="([\d.]+)"/), r: num(svg, /<circle[^>]* r="([\d.]+)"/),
      fill: rgb((svg.match(/<circle[^>]* fill="(#[0-9a-f]{6})"/i) || [])[1]) },
  };
}

// One path of a move and an arc: "M x1 y1 A r r 0 large sweep x2 y2", or with "a" and x2 y2 relative to x1 y1.
export function arc(d) {
  const relative = d.includes('a');
  const [x1, y1, r, , , large, sweep, ex, ey] = d.replace(/[MAa]/g, ' ').trim().split(/[\s,]+/).map(Number);
  const x2 = relative ? x1 + ex : ex, y2 = relative ? y1 + ey : ey;
  // SVG's endpoint-to-centre conversion, for a circle (rx = ry = r, no rotation).
  const mx = (x1 - x2) / 2, my = (y1 - y2) / 2, h2 = mx * mx + my * my;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (r * r - h2) / h2));
  const cx = k * my + (x1 + x2) / 2, cy = -k * mx + (y1 + y2) / 2;
  const a1 = Math.atan2(y1 - cy, x1 - cx), a2 = Math.atan2(y2 - cy, x2 - cx);
  const turn = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // sweep 1 draws with the angle growing, 0 with it shrinking: the arc covers the angles it passes on the way.
  const span = sweep ? turn(a2 - a1) : turn(a1 - a2);
  const onArc = a => (sweep ? turn(a - a1) : turn(a1 - a)) <= span;
  return { cx, cy, r, onArc, ends: [[x1, y1], [x2, y2]] };
}

// The distance from a point to an arc, with its round caps.
function toArc({ cx, cy, r, onArc, ends }, x, y) {
  if (onArc(Math.atan2(y - cy, x - cx))) return Math.abs(Math.hypot(x - cx, y - cy) - r);
  return Math.min(...ends.map(([ex, ey]) => Math.hypot(x - ex, y - ey)));
}

// The icon at `size` pixels, as RGB rows: 4 × 4 samples a pixel, drawn in the SVG's order.
export function draw(size, L = logo()) {
  const n = 4, px = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let ink = 0, dot = 0;
    for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) {
      // A point on the icon, moved back by the group's translate onto the mark's own shapes.
      const u = (x + (sx + 0.5) / n) * 64 / size - L.at[0], v = (y + (sy + 0.5) / n) * 64 / size - L.at[1];
      if (Math.hypot(u - L.dot.cx, v - L.dot.cy) <= L.dot.r) dot++;
      else if (L.arcs.some(a => toArc(a, u, v) <= L.half)) ink++;
    }
    const s = n * n;
    for (let c = 0; c < 3; c++) px[(y * size + x) * 3 + c] = Math.round((L.bg[c] * (s - ink - dot) + L.ink[c] * ink + L.dot.fill[c] * dot) / s);
  }
  return px;
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const t = Buffer.concat([Buffer.from(type), data]), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(t));
  return Buffer.concat([len, t, sum]);
};
// An 8-bit RGB PNG, with no alpha channel, so it has no transparency.
export function png(size, px = draw(size)) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rows = Buffer.concat(Array.from({ length: size }, (_, y) => Buffer.concat([Buffer.from([0]), px.subarray(y * size * 3, (y + 1) * size * 3)])));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

export function writeIcons() {
  for (const [name, size] of Object.entries(PNGS)) fs.writeFileSync(path.join(ICONS, name), png(size));
}

// A PNG's width, height, colour type and pixels (8-bit RGB or RGBA, as the browser or this file writes them).
export function readPng(buf) {
  let at = 8, w = 0, h = 0, type = 0;
  const idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), name = buf.toString('latin1', at + 4, at + 8), data = buf.subarray(at + 8, at + 8 + len);
    if (name === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; }
    if (name === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  const bpp = type === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * bpp), stride = w * bpp;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[y * stride + i - bpp] : 0, b = y ? out[(y - 1) * stride + i] : 0, c = i >= bpp && y ? out[(y - 1) * stride + i - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      out[y * stride + i] = (line[i] + pred) & 0xff;
    }
  }
  return { w, h, type, px: out, at: (x, y) => [...out.subarray((y * w + x) * bpp, (y * w + x) * bpp + 3)] };
}
