// 0149: the panel's PNG icons, and since 0305 its icon.svg too, with no dependencies, so the icons can be checked against
// the design and made again when it changes (since 0594, from speck's own drawing, templates/speck-face.js): node -e "import('./test/support/icons.mjs').then(m => m.writeIcons())"
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { ROOT } from './panel.mjs';

export const ICONS = path.join(ROOT, 'templates', 'icons');
// Each PNG the panel serves, with its size in pixels. The tab's two show the plain visor (0594).
export const APP_ICONS = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };
export const TAB_ICONS = { 'icon-16.png': 16, 'icon-32.png': 32 };
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

// 0320: the design's logo, from its renderer, run once here with stand-ins for the browser, so the icons run no script.
export function logo() {
  const ctx = { window: {}, getComputedStyle: () => ({ getPropertyValue: () => '' }), performance: { now: () => 0 } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'), 'utf8'), ctx);
  return ctx.window.SpeckLCD.logo;
}

// 0594: speck's character, from the panel's own drawing, run once here with stand-ins for the browser, so the icons run
// no script and can't drift from it: the parts of its watching drawing and its colours on a dark background.
function face() {
  const make = tag => ({ tag, attrs: {}, children: [], setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; } });
  const styles = [], cx = { document: { createElementNS: (ns, tag) => make(tag), createElement: make, head: { appendChild: c => styles.push(c) } } };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'templates', 'speck-face.js'), 'utf8'), cx);
  const all = (n, out = []) => { out.push(n); n.children.forEach(c => all(c, out)); return out; };
  const nodes = all(cx.SpeckFace.draw({ mood: 'watching', size: 512, look: 'dark' }));
  const part = name => {
    const n = nodes.find(x => (x.attrs.class || '').split(' ').includes(name));
    if (!n) throw new Error(`speck's drawing has no .${name} for the icons`);
    return n.attrs;
  };
  const dark = styles[0].textContent.match(/\[data-look="dark"\] \{ ([^}]*)\}/)[1];
  const colour = name => dark.match(new RegExp(`--sf-${name}: (#[0-9A-Fa-f]{6})`))[1];
  return { body: part('sf-body'), screen: part('sf-screen'), glow: part('sf-glow'), visor: part('sf-visor'), glass: part('sf-glass'),
    bezel: [colour('bezel-a'), colour('bezel-b')], rim: colour('rim'), eye: colour('eye'), screenFill: styles[0].textContent.match(/\.sf-screen \{ fill: (#[0-9A-Fa-f]{6})/)[1] };
}
const SLAB_RADIUS = 22, SCALE = 1.8;
const bar = () => fs.readFileSync(path.join(ROOT, 'templates', 'panel-base.css'), 'utf8').match(/--bar: (#[0-9A-Fa-f]{6})/)[1];
const box = a => ['x', 'y', 'width', 'height', 'rx'].map(k => `${k}="${a[k]}"`).join(' ');

// 0594: the icon's SVG. speck's device sits in the middle of the slab at 1.8 times its size. The glow and the reflection
// are marked d, for a browser to leave out when it draws the icon small: a tab is 16 px, or up to 48 on a sharper screen.
export function iconSvg() {
  const f = face();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@media (max-width:48px){.d{display:none}}</style>`
    + `<rect width="100" height="100" rx="${SLAB_RADIUS}" fill="${bar()}"/><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.bezel[0]}"/><stop offset="1" stop-color="${f.bezel[1]}"/></linearGradient><clipPath id="c"><rect ${box(f.screen)}/></clipPath></defs>`
    + `<g transform="translate(50 95) scale(${SCALE})">`
    + `<rect ${box(f.body)} fill="url(#b)" stroke="${f.rim}" stroke-width="${f.body['stroke-width']}"/><rect ${box(f.screen)} fill="${f.screenFill}"/>`
    + `<g clip-path="url(#c)" fill="none" stroke="${f.eye}" stroke-linecap="round"><path class="d" d="${f.glow.d}" stroke-width="${f.glow['stroke-width']}" stroke-opacity="${f.glow['stroke-opacity']}"/><path d="${f.visor.d}" stroke-width="${f.visor['stroke-width']}"/>`
    + `<path class="d" d="${f.glass.d}" stroke="none" fill="${f.glass.fill}" fill-opacity="${f.glass['fill-opacity']}"/></g></g></svg>`;
}

const inRound = (s, x, y) => {
  const cx = Math.min(Math.max(x, s.x + s.rx), s.x + s.w - s.rx), cy = Math.min(Math.max(y, s.y + s.rx), s.y + s.h - s.rx);
  return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h && (x - cx) ** 2 + (y - cy) ** 2 <= s.rx ** 2;
};
// A point is inside a convex path when it's on the same side of every edge.
const inPolygon = (pts, x, y) => pts.every(([ax, ay], i) => { const [bx, by] = pts[(i + 1) % pts.length]; return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0; });

// 0594: what the icon paints, in order, in the icon's own 0 to 100 units: every shape convex, each with what's inside it
// and a colour for each point. The rim is drawn as a slightly larger body behind the body, as a stroke centred on its edge
// looks. plain leaves out the glow and the reflection, as iconSvg's small sizes do.
function layers(plain) {
  const f = face(), place = a => ({ x: 50 + SCALE * +a.x, y: 95 + SCALE * +a.y, w: SCALE * +a.width, h: SCALE * +a.height, rx: SCALE * +a.rx });
  const round = (s, fill, alpha = 1) => ({ box: s, inside: (x, y) => inRound(s, x, y), fill, alpha });
  const grow = (s, by) => ({ x: s.x - by, y: s.y - by, w: s.w + 2 * by, h: s.h + 2 * by, rx: s.rx + by });
  // The visor is a straight line with round ends: a rounded rectangle as tall as its stroke.
  const line = a => {
    const [x1, y1, cx, cy, x2, y2] = [...a.d.matchAll(/-?[\d.]+/g)].map(m => +m[0]), width = +a['stroke-width'];
    if (y1 !== cy || cy !== y2) throw new Error(`a visor the icon drawing can't read: ${a.d}`);
    return place({ x: x1 - width / 2, y: y1 - width / 2, width: x2 - x1 + width, height: width, rx: width / 2 });
  };
  const body = place(f.body), screen = place(f.screen), edge = SCALE * +f.body['stroke-width'] / 2;
  const [top, bottom] = f.bezel.map(rgb);
  const bezel = (x, y) => top.map((c, i) => c + (bottom[i] - c) * Math.min(1, Math.max(0, (y - body.y) / body.h)));
  const glass = [...f.glass.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => [50 + SCALE * +m[1], 95 + SCALE * +m[2]]);
  return [
    round({ x: 0, y: 0, w: 100, h: 100, rx: SLAB_RADIUS }, rgb(bar())),
    round(grow(body, edge), rgb(f.rim)),
    round(grow(body, -edge), bezel),
    round(screen, rgb(f.screenFill)),
    ...(plain ? [] : [round(line(f.glow), rgb(f.eye), +f.glow['stroke-opacity'])]),
    round(line(f.visor), rgb(f.eye)),
    ...(plain ? [] : [{ box: screen, inside: (x, y) => inRound(screen, x, y) && inPolygon(glass, x, y), fill: rgb(f.glass.fill), alpha: +f.glass['fill-opacity'] }]),
  ];
}

// 0594: the icon at `size` pixels, as RGBA rows, each shape painted in turn over what's below it, by how much of each
// pixel it covers, as a browser draws it: 8 × 8 samples, or none when all four of a pixel's corners are inside, as every
// shape is convex. plain is the small icon.
export function draw(size, plain = false) {
  const k = size / 100, px = new Float64Array(size * size * 4), N = 8;
  for (const l of layers(plain)) {
    const hit = (x, y) => l.inside(x / k, y / k);
    for (let y = Math.max(0, Math.floor(l.box.y * k)); y < Math.min(size, Math.ceil((l.box.y + l.box.h) * k)); y++) {
      for (let x = Math.max(0, Math.floor(l.box.x * k)); x < Math.min(size, Math.ceil((l.box.x + l.box.w) * k)); x++) {
        let n = N * N;
        if (!(hit(x, y) && hit(x + 1, y) && hit(x, y + 1) && hit(x + 1, y + 1))) {
          n = 0;
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (hit(x + (i + .5) / N, y + (j + .5) / N)) n++;
        }
        const t = l.alpha * n / (N * N), i = (y * size + x) * 4;
        if (!t) continue;
        const c = typeof l.fill === 'function' ? l.fill((x + .5) / k, (y + .5) / k) : l.fill;
        for (let ch = 0; ch < 3; ch++) px[i + ch] += (c[ch] - px[i + ch]) * t; // premultiplied, undone below
        px[i + 3] += (1 - px[i + 3]) * t;
      }
    }
  }
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < out.length; i += 4) {
    const a = px[i + 3];
    for (let ch = 0; ch < 3; ch++) out[i + ch] = a ? Math.round(px[i + ch] / a) : 0;
    out[i + 3] = Math.round(a * 255);
  }
  return out;
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const t = Buffer.concat([Buffer.from(type), data]), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(t));
  return Buffer.concat([len, t, sum]);
};
// An 8-bit RGBA PNG, so its rounded corners are see-through (0594). Compressed bytes can happen to hold text such as
// "O6" that the "no model name is hard-coded" scan of templates/ flags (the eye's PNGs at level 9 in 0184, the 512 px
// icon at the default level in 0308), so it takes the first zlib settings, from the default, whose bytes hold none.
const NAMED = /\bo[1-9]|gpt-|claude-|opus|sonnet|haiku|gemini-|codex-mini/i;
export function png(size, plain = false, px = draw(size, plain)) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = Buffer.concat(Array.from({ length: size }, (_, y) => Buffer.concat([Buffer.from([0]), px.subarray(y * size * 4, (y + 1) * size * 4)])));
  const make = options => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, options)), chunk('IEND', Buffer.alloc(0))]);
  for (const memLevel of [8, 9, 7, 6, 5, 4, 3]) for (const strategy of [zlib.constants.Z_DEFAULT_STRATEGY, zlib.constants.Z_FILTERED, zlib.constants.Z_RLE]) {
    for (const level of [6, 7, 8, 9, 5, 4, 3, 2, 1]) { const b = make({ level, strategy, memLevel }); if (!NAMED.test(b.toString('utf8'))) return b; }
  }
  throw new Error(`all the zlib settings leave text the model-name scan flags in the ${size} px icon`);
}

export function writeIcons() {
  fs.writeFileSync(path.join(ICONS, 'icon.svg'), iconSvg());
  for (const [name, size] of Object.entries(APP_ICONS)) fs.writeFileSync(path.join(ICONS, name), png(size));
  for (const [name, size] of Object.entries(TAB_ICONS)) fs.writeFileSync(path.join(ICONS, name), png(size, true));
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
