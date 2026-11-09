import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, panelRepo, freePort, startPanel, stop, raw } from './support/panel.mjs';

// ---------- 0578: speck's character, the mock's Premium screen ----------

const FACE = path.join(ROOT, 'templates', 'speck-face.js');

// The script in a stand-in for the page: what it makes is { tag, attrs, children }.
function load() {
  const added = [];
  const make = tag => ({ tag, attrs: {}, children: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; } });
  const cx = { document: { createElementNS: (ns, tag) => Object.assign(make(tag), { ns }), createElement: make, head: { appendChild: c => { added.push(c); return c; } } }, Object, Number };
  vm.runInNewContext(fs.readFileSync(FACE, 'utf8'), cx);
  return { SpeckFace: cx.SpeckFace, added };
}
const all = (n, out = []) => { out.push(n); for (const c of n.children) all(c, out); return out; };
const byClass = (svg, c) => all(svg).filter(n => (n.attrs.class || '').split(' ').includes(c));
const one = (svg, c) => { const f = byClass(svg, c); assert.equal(f.length, 1, `one .${c}`); return f[0]; };
const css = () => { const { SpeckFace, added } = load(); SpeckFace.draw(); assert.equal(added.length, 1, 'one stylesheet'); return added[0].textContent; };
const numbers = d => [...d.matchAll(/-?\d*\.?\d+/g)].map(m => Number(m[0]));
const visor = (mood, size = 44) => {
  const { SpeckFace } = load();
  const v = one(SpeckFace.draw({ mood, size }), 'sf-visor');
  const [x1, y1, cx, cy, x2, y2] = numbers(v.attrs.d);
  return { x1, y1, cx, cy, x2, y2, stroke: Number(v.attrs['stroke-width']), opacity: Number(v.attrs.opacity ?? 1), long: Math.hypot(x2 - x1, y2 - y1) + Number(v.attrs['stroke-width']), y: (y1 + cy + y2) / 3 };
};
// What the stylesheet does inside its one no-preference block, and outside it.
const motion = sheet => {
  const start = sheet.indexOf('@media (prefers-reduced-motion: no-preference)');
  assert.ok(start >= 0, 'motion is only for those who haven\'t asked for less');
  let depth = 0, i = sheet.indexOf('{', start), end = i;
  do { if (sheet[end] === '{') depth++; else if (sheet[end] === '}') depth--; end++; } while (depth);
  return { inside: sheet.slice(i + 1, end - 1), outside: sheet.slice(0, start) + sheet.slice(end) };
};
const seconds = v => Number(v.replace('s', ''));
const animations = sheet => [...motion(sheet).inside.matchAll(/([^{}]+)\{\s*animation:\s*([\w-]+)\s+([\d.]+)s([^;}]*)/g)].map(m => ({ selector: m[1].trim(), name: m[2], s: Number(m[3]), rest: m[4] }));
const keyframes = sheet => Object.fromEntries([...motion(sheet).inside.matchAll(/@keyframes ([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map(m => [m[1], m[2]]));

const SCREEN = { x: -18, y: -38, width: 36, height: 26 };
const inside = (x, y, half) => x - half >= SCREEN.x && x + half <= SCREEN.x + SCREEN.width && y - half >= SCREEN.y && y + half <= SCREEN.y + SCREEN.height;

test('0578 AC1: the drawing is the mock\'s device, at the mock\'s measurements', () => {
  const { SpeckFace } = load();
  const svg = SpeckFace.draw({ mood: 'watching', size: 44 });
  assert.equal(svg.tag, 'svg');
  assert.equal(svg.attrs.viewBox, '-26 -50 52 52');
  const body = one(svg, 'sf-body').attrs;
  assert.deepEqual([body.x, body.y, body.width, body.height, body.rx], ['-22', '-42', '44', '34', '11'], 'body 44 by 34, radius 11, centred at (0, -25)');
  assert.match(body.fill, /^url\(#.+\)$/, 'a gradient bezel');
  assert.ok(Number(body['stroke-width']) > 0 && Number(body['stroke-width']) <= 1, 'a fine rim');
  const screen = one(svg, 'sf-screen').attrs;
  assert.deepEqual([screen.x, screen.y, screen.width, screen.height, screen.rx], ['-18', '-38', '36', '26', '7'], 'screen inset 4, radius 7');
  const v = visor('watching');
  assert.equal(v.long, 15, 'visor 15 long');
  assert.equal(v.stroke, 5, 'visor 5 high');
  const glow = one(svg, 'sf-glow').attrs, line = one(svg, 'sf-visor').attrs;
  assert.equal(glow.d, line.d, 'the glow follows the visor');
  assert.equal(Number(glow['stroke-width']), 5 + 3.6, 'glow 3.6 wide');
  assert.equal(Number(glow['stroke-opacity']), 0.28);
  const glass = one(svg, 'sf-glass').attrs;
  assert.equal(glass.fill, '#FFFFFF');
  assert.equal(Number(glass['fill-opacity']), 0.07, 'a faint reflection across the glass');
});

test('0578 AC1: its colours are the mock\'s for each look, and it can follow the page or be told', () => {
  const sheet = css();
  const rule = sel => { const at = sheet.indexOf(sel); assert.ok(at >= 0, sel); return sheet.slice(at, sheet.indexOf('}', at)); };
  const light = rule('.speck-face {'), dark = rule('.speck-face[data-look="dark"]');
  for (const c of ['#45484F', '#0D0E11', '#5D6169']) assert.match(light, new RegExp(c), `light ${c}`);
  for (const c of ['#5A5C54', '#1D1E1A', '#70726A']) assert.match(dark, new RegExp(c), `dark ${c}`);
  assert.match(sheet, /:root\[data-theme="dark"\] \.speck-face:not\(\[data-look="light"\]\)/, 'it follows the page\'s look unless told otherwise');
  assert.match(sheet, /\.sf-screen\s*\{[^}]*#06070A/, 'the screen is the same in both');
  const { SpeckFace } = load();
  assert.equal(SpeckFace.draw({ look: 'dark' }).attrs['data-look'], 'dark');
  assert.equal(SpeckFace.draw({ look: 'light' }).attrs['data-look'], 'light');
  assert.equal(SpeckFace.draw().attrs['data-look'], undefined);
  assert.equal(SpeckFace.draw({ look: 'constructor' }).attrs['data-look'], undefined, 'a look it doesn\'t know is ignored');
});

test('0578 AC1: it draws at any size from 16 px, and each drawing has its own ids', () => {
  const { SpeckFace, added } = load();
  assert.equal(SpeckFace.draw({ size: 16 }).attrs.width, '16');
  assert.equal(SpeckFace.draw({ size: 16 }).attrs.height, '16');
  assert.equal(SpeckFace.draw({ size: 320 }).attrs.width, '320');
  assert.equal(SpeckFace.draw({ size: 4 }).attrs.width, '16', 'never below 16');
  for (const bad of [undefined, null, 'big', NaN, Infinity]) assert.equal(SpeckFace.draw({ size: bad }).attrs.width, '44', `size ${bad}`);
  assert.equal(SpeckFace.draw(null).tag, 'svg', 'no options at all');
  assert.equal(added.length, 1, 'the stylesheet is added once, however many are drawn');
  const a = SpeckFace.draw(), b = SpeckFace.draw();
  const ids = s => all(s).map(n => n.attrs.id).filter(Boolean);
  assert.ok(ids(a).length >= 2);
  assert.equal(new Set([...ids(a), ...ids(b)]).size, ids(a).length + ids(b).length, 'two on one page don\'t share a gradient or a clip');
});

test('0578 AC1: the panel serves the script', async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const res = await raw(panel.port, '/speck-face.js');
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(String(res.body), fs.readFileSync(FACE, 'utf8'));
  } finally { await stop(panel); }
});

test('0578 AC2: there are six moods, and an unknown one draws as watching', () => {
  const { SpeckFace } = load();
  assert.deepEqual([...SpeckFace.moods], ['watching', 'focused', 'pleased', 'sheepish', 'asking', 'asleep']);
  for (const mood of SpeckFace.moods) assert.equal(SpeckFace.draw({ mood }).attrs['data-mood'], mood);
  for (const bad of ['', 'grumpy', 'constructor', '__proto__', null, 7]) assert.equal(SpeckFace.draw({ mood: bad }).attrs['data-mood'], 'watching', `mood ${bad}`);
});

test('0578 AC2: the moods differ only in the red light', () => {
  const { SpeckFace } = load();
  const fixed = mood => { const s = SpeckFace.draw({ mood }); return ['sf-body', 'sf-screen', 'sf-glass'].map(c => { const { fill, ...rest } = one(s, c).attrs; return JSON.stringify(rest); }).join(); };
  for (const mood of SpeckFace.moods) assert.equal(fixed(mood), fixed('watching'), mood);
});

test('0578 AC2: each mood\'s visor has the shape the ticket gives', () => {
  const w = visor('watching'), f = visor('focused'), p = visor('pleased'), s = visor('sheepish'), a = visor('asking'), z = visor('asleep');
  assert.equal(w.y1, w.y2, 'watching is level');
  assert.ok(f.long < w.long, 'focused is narrower');
  assert.ok(f.y > w.y, 'focused is lower');
  assert.ok(p.cy > p.y1 && p.cy > p.y2, 'pleased curves up at its ends, into a smile');
  assert.ok(s.long < w.long, 'sheepish is shorter');
  assert.ok(s.y > w.y, 'sheepish is lower');
  assert.notEqual(s.y1, s.y2, 'sheepish is tilted');
  assert.ok(a.long < 6 && a.y > w.y, 'asking drops to a dot');
  assert.ok(z.long < w.long && z.stroke < w.stroke, 'asleep is a short line');
  assert.ok(z.opacity < 1, 'asleep is dim');
  for (const mood of ['watching', 'focused', 'pleased', 'sheepish']) assert.equal(visor(mood).opacity, 1, `${mood} is at full brightness`);
});

test('0578 AC2: asking draws a red question mark above its dot, and asleep a red z, Z, Z rising to the upper right, all inside the screen', () => {
  const { SpeckFace } = load();
  const asking = SpeckFace.draw({ mood: 'asking' });
  const hook = one(asking, 'sf-hook');
  const pts = numbers(hook.attrs.d), half = Number(hook.attrs['stroke-width']) / 2, dot = visor('asking');
  for (let i = 0; i < pts.length; i += 2) assert.ok(inside(pts[i], pts[i + 1], half), `hook point ${pts[i]},${pts[i + 1]}`);
  assert.ok(Math.max(...pts.filter((_, i) => i % 2)) < dot.y - dot.stroke / 2, 'the mark is above its dot');
  assert.equal(byClass(asking, 'sf-z').length, 0);
  const asleep = SpeckFace.draw({ mood: 'asleep' }), zs = byClass(asleep, 'sf-z');
  assert.equal(zs.length, 3);
  assert.equal(byClass(asleep, 'sf-hook').length, 0);
  const boxes = zs.map(n => {
    const p = numbers(n.attrs.d), xs = p.filter((_, i) => !(i % 2)), ys = p.filter((_, i) => i % 2), half = Number(n.attrs['stroke-width']) / 2;
    for (let i = 0; i < p.length; i += 2) assert.ok(inside(p[i], p[i + 1], half), `z point ${p[i]},${p[i + 1]}`);
    return { x: Math.min(...xs), y: Math.min(...ys), size: Math.max(...xs) - Math.min(...xs) };
  });
  for (let i = 1; i < 3; i++) {
    assert.ok(boxes[i].x > boxes[i - 1].x, 'each is further right');
    assert.ok(boxes[i].y < boxes[i - 1].y, 'and higher');
    assert.ok(boxes[i].size > boxes[i - 1].size, 'and bigger');
  }
  assert.match(css(), /\.sf-light\s*\{[^}]*stroke:\s*var\(--sf-eye\)/, 'all in the visor\'s red');
  for (const n of [...zs, hook, one(asleep, 'sf-visor')]) assert.ok(n.attrs.class.split(' ').includes('sf-light'), n.attrs.class);
});

test('0578 AC3: every loop is the mock\'s and lasts at least 5 seconds', () => {
  const sheet = css(), list = animations(sheet);
  const of = name => list.filter(a => a.name === name).map(a => a.s);
  assert.ok(list.length >= 9);
  for (const a of list) {
    assert.ok(a.s >= 5, `${a.name} lasts ${a.s} s`);
    assert.match(a.rest, /infinite/, `${a.name} loops`);
  }
  for (const [name, s] of Object.entries({ 'sf-drift': 16, 'sf-scan': 5.2, 'sf-glow': 6.2, 'sf-lift': 6.5, 'sf-glance': 9.5, 'sf-pulse': 5.6, 'sf-fade': 9, 'sf-breathe': 11, 'sf-z': 9, 'sf-blink': 8.5 }))
    assert.ok(of(name).length >= 1 && of(name).every(v => v === s), `${name} is ${s} s, not ${of(name)}`);
});

test('0578 AC3: each mood has its own movement, the glow breathes in all of them and the open eyes blink', () => {
  const list = animations(css());
  const on = (name, mood) => list.some(a => a.name === name && a.selector.includes(`[data-mood="${mood}"]`));
  for (const [name, mood] of [['sf-drift', 'watching'], ['sf-scan', 'focused'], ['sf-lift', 'pleased'], ['sf-glance', 'sheepish'], ['sf-pulse', 'asking'], ['sf-fade', 'asleep'], ['sf-breathe', 'asleep']])
    assert.ok(on(name, mood), `${mood} has ${name}`);
  for (const mood of ['watching', 'focused', 'pleased', 'sheepish']) assert.ok(on('sf-blink', mood), `${mood} blinks`);
  const glow = list.find(a => a.name === 'sf-glow');
  assert.match(glow.selector, /\.sf-glow$/, 'the glow breathes whatever the mood');
  const zs = list.filter(a => a.name === 'sf-z');
  assert.equal(zs.length, 3, 'a z at a time');
  const delays = zs.map(a => seconds(a.rest.match(/([\d.]+)s/)[1]));
  assert.deepEqual([...delays].sort((a, b) => a - b), delays);
  assert.equal(new Set(delays).size, 3, 'one by one');
  assert.match(keyframes(css())['sf-z'], /opacity:\s*0/, 'each appears from nothing');
});

test('0578 AC3: only the red light moves, and nothing is drawn outside the screen', () => {
  const { SpeckFace } = load();
  const sheet = css();
  for (const a of animations(sheet)) assert.match(a.selector, /\.sf-(move|blink|glow|z\d)$/, `${a.selector} is part of the light`);
  for (const [name, body] of Object.entries(keyframes(sheet))) {
    for (const [, prop] of body.matchAll(/([\w-]+)\s*:/g)) assert.ok(['transform', 'opacity'].includes(prop), `${name} animates ${prop}`);
  }
  for (const mood of SpeckFace.moods) {
    const svg = SpeckFace.draw({ mood });
    const lit = one(svg, 'sf-lit');
    const clipId = lit.attrs['clip-path'].match(/^url\(#(.+)\)$/)[1];
    const clip = all(svg).find(n => n.attrs.id === clipId);
    assert.equal(clip.tag, 'clipPath');
    const shape = clip.children[0].attrs, screen = one(svg, 'sf-screen').attrs;
    assert.deepEqual([shape.x, shape.y, shape.width, shape.height, shape.rx], [screen.x, screen.y, screen.width, screen.height, screen.rx], 'clipped to the screen');
    const within = all(lit);
    for (const n of byClass(svg, 'sf-light')) assert.ok(within.includes(n), `${mood}: ${n.attrs.class} is clipped`);
    assert.ok(within.includes(one(svg, 'sf-glass')), 'and the reflection');
    assert.ok(!within.includes(one(svg, 'sf-body')) && !within.includes(one(svg, 'sf-screen')), 'the device isn\'t part of the light');
    assert.equal(svg.attrs.style, undefined, 'the device itself is never moved');
  }
  // Even at the end of its movement, the visor and its glow stay on the glass rather than being cut off by it.
  const shift = Object.fromEntries(['drift', 'scan', 'lift', 'glance'].map(n => {
    const moves = [...keyframes(sheet)[`sf-${n}`].matchAll(/translate[XY]?\((-?[\d.]+)px/g)].map(m => Math.abs(Number(m[1])));
    assert.ok(moves.length, `${n} moves`);
    return [n, Math.max(...moves)];
  }));
  for (const [mood, n] of [['watching', 'drift'], ['focused', 'scan'], ['pleased', 'lift'], ['sheepish', 'glance']]) {
    const v = visor(mood), half = (v.stroke + 3.6) / 2;
    for (const [x, y] of [[v.x1 - shift[n], v.y1], [v.x2 + shift[n], v.y2]]) assert.ok(inside(x, y, half), `${mood} at ${x},${y}`);
  }
});

test('0578 AC3: with reduced motion set, nothing moves', () => {
  const { inside: moving, outside } = motion(css());
  assert.match(moving, /animation:/);
  assert.doesNotMatch(outside, /animation|transition|@keyframes/, 'nothing moves outside the no-preference block');
  assert.doesNotMatch(moving, /@media/, 'one block, with no way round it');
  assert.doesNotMatch(fs.readFileSync(FACE, 'utf8'), /requestAnimationFrame|setInterval|setTimeout|<animate/, 'and nothing but the stylesheet moves it');
});

test('0578 AC4: below 24 px the question mark and the z\'s are left out, and the plain visor shows', () => {
  const { SpeckFace } = load();
  for (const size of [16, 23, 23.9]) {
    const asking = SpeckFace.draw({ mood: 'asking', size }), asleep = SpeckFace.draw({ mood: 'asleep', size });
    assert.equal(byClass(asking, 'sf-hook').length, 0, `no question mark at ${size}`);
    assert.equal(byClass(asleep, 'sf-z').length, 0, `no z's at ${size}`);
    assert.deepEqual(visor('asking', size), visor('watching'), `asking shows the plain visor at ${size}`);
    assert.deepEqual(visor('asleep', size), visor('asleep'), `asleep keeps its dim line at ${size}`);
    assert.equal(asking.attrs['data-mood'], 'asking', 'it\'s still asking');
    assert.equal(asking.attrs['data-small'], 'true');
  }
  const asking = SpeckFace.draw({ mood: 'asking', size: 24 }), asleep = SpeckFace.draw({ mood: 'asleep', size: 24 });
  assert.equal(byClass(asking, 'sf-hook').length, 1, 'the question mark from 24 px');
  assert.equal(byClass(asleep, 'sf-z').length, 3, 'the z\'s from 24 px');
  assert.equal(asking.attrs['data-small'], undefined);
  const small = animations(css()).filter(a => a.selector.includes('[data-small]'));
  assert.ok(small.some(a => a.name === 'sf-blink' && a.selector.includes('[data-mood="asking"]')), 'the plain visor blinks');
  assert.ok(animations(css()).some(a => a.name === 'sf-pulse' && a.selector.includes(':not([data-small])')), 'and there\'s no dot to pulse');
});
