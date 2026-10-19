// 0149: the panel's PNG icons, and since 0305 its icon.svg too, with no dependencies, so the icons can be checked against
// the design and made again when it changes (since 0320, from its renderer's logo): node -e "import('./test/support/icons.mjs').then(m => m.writeIcons())"
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { ROOT } from './panel.mjs';

export const ICONS = path.join(ROOT, 'templates', 'icons');
// Each PNG the panel serves, with its size in pixels.
export const PNGS = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// 0320: the design's logo, from its renderer, run once here with stand-ins for the browser, so the icons run no script.
export function logo() {
  const ctx = { window: {}, getComputedStyle: () => ({ getPropertyValue: () => '' }), performance: { now: () => 0 } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'), 'utf8'), ctx);
  return ctx.window.SpeckLCD.logo;
}

// 0320: icon.svg is the logo's browser-tab icon, as the renderer writes it.
export const iconSvg = () => logo().faviconSVG();

// The shapes an SVG from the renderer's logo paints, in order: its rects, and its paths, which are only squares and
// runs of them (M x y h w v h h -w z), each with its fill and a group's translate. Anything else is refused, so a
// change to how the design draws its icon can't be drawn wrong without a test failing.
export function shapes(svg) {
  const out = [], groups = [];
  const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
  for (const [, close, tag, rest] of svg.matchAll(/<(\/?)(\w+)([^>]*?)\/?>/g)) {
    if (tag === 'svg') { if (!close && attrs(rest).viewBox !== '0 0 100 100') throw new Error(`a viewBox of ${attrs(rest).viewBox}`); continue; }
    if (tag === 'g') { if (close) groups.pop(); else groups.push(attrs(rest)); continue; }
    const a = attrs(rest), g = groups.at(-1) || {}, fill = a.fill || g.fill;
    const [tx, ty] = g.transform ? g.transform.match(/^translate\(([-\d.]+) ([-\d.]+)\)$/).slice(1).map(Number) : [0, 0];
    if (tag === 'rect') out.push({ x: +(a.x || 0) + tx, y: +(a.y || 0) + ty, w: +a.width, h: +a.height, rx: +(a.rx || 0), fill });
    else if (tag === 'path') {
      for (const m of (a.d || '').matchAll(/M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)z|(.)/g)) {
        if (m[6] !== undefined) throw new Error(`a path the icon drawing can't read: ${a.d}`);
        const [x, y, w, h, back] = m.slice(1, 6).map(Number);
        if (back !== -w) throw new Error(`a path that isn't a rectangle: ${m[0]}`);
        out.push({ x: x + tx, y: y + ty, w, h, rx: 0, fill });
      }
    } else throw new Error(`a <${tag}> the icon drawing can't read`);
  }
  return out;
}

const colour = c => {
  if (/^#[0-9a-f]{6}$/i.test(c)) return [...rgb(c), 1];
  const m = c.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (!m) throw new Error(`a colour the icon drawing can't read: ${c}`);
  return m.slice(1).map(Number);
};
// How much of the pixel at (px, py) a shape covers, from 0 to 1: the exact area for a square-cornered one, and 16 × 16
// samples where a rounded corner crosses the pixel.
function cover(s, px, py) {
  const w = Math.max(0, Math.min(px + 1, s.x + s.w) - Math.max(px, s.x)), h = Math.max(0, Math.min(py + 1, s.y + s.h) - Math.max(py, s.y));
  if (!w || !h || !s.rx) return w * h;
  const r = s.rx, inCorner = (x, y) => (x < s.x + r || x > s.x + s.w - r) && (y < s.y + r || y > s.y + s.h - r);
  if (!inCorner(px, py) && !inCorner(px + 1, py) && !inCorner(px, py + 1) && !inCorner(px + 1, py + 1)) return w * h;
  let n = 0;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = px + (i + .5) / 16, y = py + (j + .5) / 16;
    if (x < s.x || x > s.x + s.w || y < s.y || y > s.y + s.h) continue;
    const cx = Math.min(Math.max(x, s.x + r), s.x + s.w - r), cy = Math.min(Math.max(y, s.y + r), s.y + s.h - r);
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) n++;
  }
  return n / 256;
}

// 0320: the app icon at `size` pixels, as RGB rows: the renderer's appIconSVG('light'), each shape painted in turn over
// what's below it, by how much of each pixel it covers, as a browser draws it.
export function draw(size, svg = logo().appIconSVG('light')) {
  const k = size / 100, px = new Float64Array(size * size * 3);
  for (const s0 of shapes(svg)) {
    const s = { x: s0.x * k, y: s0.y * k, w: s0.w * k, h: s0.h * k, rx: s0.rx * k }, [r, g, b, a] = colour(s0.fill);
    for (let y = Math.max(0, Math.floor(s.y)); y < Math.min(size, Math.ceil(s.y + s.h)); y++) {
      for (let x = Math.max(0, Math.floor(s.x)); x < Math.min(size, Math.ceil(s.x + s.w)); x++) {
        const t = a * cover(s, x, y), i = (y * size + x) * 3;
        if (!t) continue;
        px[i] += (r - px[i]) * t; px[i + 1] += (g - px[i + 1]) * t; px[i + 2] += (b - px[i + 2]) * t;
      }
    }
  }
  return Buffer.from(px.map(Math.round));
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
