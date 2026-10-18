// 0149: the panel's PNG icons, and since 0305 its icon.svg too, with no dependencies, so the icons can be checked against
// the design and made again when it changes: node -e "import('./test/support/icons.mjs').then(m => m.writeIcons())"
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { ROOT } from './panel.mjs';

export const ICONS = path.join(ROOT, 'templates', 'icons');
// Each PNG the panel serves, with its size in pixels.
export const PNGS = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };
// 0305: the light look's screen, ink and red, as the panel's tokens give them (the screen lighter since 0308).
export const LCD = { bg: '#e6e9db', ink: '#20241d', red: '#d63f28' };
// How much of the icon the mark's tallest side may take: the rest is the margin, so rounded corners miss it.
const FILL = 0.75;

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// 0305: the header's mark (0303), read from the design's renderer: its 16 × 16 dots as rows of '.' (unlit), '#' (ink)
// and 'R' (the speck's red). The renderer runs once here, with stand-ins for the browser, so the icon runs no script.
export function markDots() {
  const ctx = { window: {}, getComputedStyle: () => ({ getPropertyValue: () => '' }), performance: { now: () => 0 } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'), 'utf8'), ctx);
  const L = ctx.window.SpeckLCD;
  const { scr } = L.tile({ getContext: () => null, getBoundingClientRect: () => ({ width: 0 }) }, L.PANEL, 'still',
    { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true });
  scr.buf.v.fill(0); scr.draw(scr, scr.at, 16);
  const mark = { [L.INK]: '#', [L.RED]: 'R' };
  return Array.from({ length: scr.rows }, (_, y) => Array.from(scr.buf.v.subarray(y * scr.cols, (y + 1) * scr.cols), v => mark[v] || '.').join(''));
}

// The lit dots, each with its column, row and colour, and the columns and rows they span.
export function lit(dots = markDots()) {
  const on = dots.flatMap((row, y) => [...row].flatMap((c, x) => (c === '.' ? [] : [{ x, y, fill: c === 'R' ? LCD.red : LCD.ink }])));
  const xs = on.map(d => d.x), ys = on.map(d => d.y);
  return { on, x: Math.min(...xs), y: Math.min(...ys), cols: Math.max(...xs) - Math.min(...xs) + 1, rows: Math.max(...ys) - Math.min(...ys) + 1 };
}

// Where the dots go in an icon `size` pixels square: each dot `pitch` pixels apart, `dot` pixels square (the gap
// between them as the renderer leaves it), from `left`, `top`. Whole pixels, so each dot's edges are sharp, and the
// pitch is chosen so the lit dots' edges sit as far from the left as the right, and from the top as the bottom.
export function layout(size, M = lit()) {
  const gap = p => (p >= 3 ? Math.max(1, Math.round(p * .16)) : 0);
  let pitch = Math.floor(size * FILL / Math.max(M.cols, M.rows));
  while (pitch > 1 && [M.cols, M.rows].some(n => (size - (n * pitch - gap(pitch))) % 2)) pitch--;
  const dot = pitch - gap(pitch);
  return { pitch, dot, left: (size - (M.cols * pitch - gap(pitch))) / 2, top: (size - (M.rows * pitch - gap(pitch))) / 2 };
}

// icon.svg: the screen, then each lit dot as a square, laid out as the 180 px icon, so it matches the apple-touch-icon.
export function iconSvg(M = lit()) {
  const S = 180, { pitch, dot, left, top } = layout(S, M);
  const rect = d => `    <rect x="${left + (d.x - M.x) * pitch}" y="${top + (d.y - M.y) * pitch}" width="${dot}" height="${dot}"/>`;
  const group = fill => [`  <g fill="${fill}">`, ...M.on.filter(d => d.fill === fill).map(rect), '  </g>'];
  return [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges">`,
    `  <rect width="${S}" height="${S}" fill="${LCD.bg}"/>`, ...group(LCD.ink), ...group(LCD.red), '</svg>', ''].join('\n');
}

// The icon at `size` pixels, as RGB rows: the screen colour, with each lit dot filled in.
export function draw(size, M = lit()) {
  const { pitch, dot, left, top } = layout(size, M), px = Buffer.alloc(size * size * 3), bg = rgb(LCD.bg);
  for (let n = 0; n < size * size; n++) px.set(bg, n * 3);
  for (const d of M.on) {
    const c = rgb(d.fill), x0 = left + (d.x - M.x) * pitch, y0 = top + (d.y - M.y) * pitch;
    for (let y = y0; y < y0 + dot; y++) for (let x = x0; x < x0 + dot; x++) px.set(c, (y * size + x) * 3);
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
// An 8-bit RGB PNG, with no alpha channel, so it has no transparency. Compressed bytes can happen to hold text such as
// "O6" that the "no model name is hard-coded" scan of templates/ flags (the eye's PNGs at level 9 in 0184, the 512 px
// icon at the default level in 0308), so it takes the first zlib level, from the default, whose bytes hold none.
const NAMED = /\bo[1-9]|gpt-|claude-|opus|sonnet|haiku|gemini-|codex-mini/i;
export function png(size, px = draw(size)) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rows = Buffer.concat(Array.from({ length: size }, (_, y) => Buffer.concat([Buffer.from([0]), px.subarray(y * size * 3, (y + 1) * size * 3)])));
  const make = level => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, { level })), chunk('IEND', Buffer.alloc(0))]);
  for (const level of [6, 7, 8, 9, 5, 4, 3, 2, 1]) { const b = make(level); if (!NAMED.test(b.toString('utf8'))) return b; }
  throw new Error(`every zlib level leaves text the model-name scan flags in the ${size} px icon`);
}

export function writeIcons() {
  fs.writeFileSync(path.join(ICONS, 'icon.svg'), iconSvg());
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
