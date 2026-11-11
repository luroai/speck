import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './support/panel.mjs';

// ---------- 0650: each team member's character: the manager (Virgil), the Builder, the Reviewer and QA ----------

const FACE = path.join(ROOT, 'templates', 'speck-face.js');

// The script in a stand-in for the page, as in the 0578 tests: what it makes is { tag, attrs, children }.
function load() {
  const added = [];
  const make = tag => ({ tag, attrs: {}, children: [], textContent: '', setAttribute(k, v) { this.attrs[k] = String(v); }, appendChild(c) { this.children.push(c); return c; }, replaceChildren(...c) { this.children = c; } });
  const cx = { document: { createElementNS: (ns, tag) => Object.assign(make(tag), { ns }), createElement: make, head: { appendChild: c => { added.push(c); return c; } } }, Object, Number };
  vm.runInNewContext(fs.readFileSync(FACE, 'utf8'), cx);
  return { SpeckFace: cx.SpeckFace, sheet: () => added.map(s => s.textContent).join('') };
}
const all = (n, out = []) => { out.push(n); for (const c of n.children) all(c, out); return out; };
const classes = n => (n.attrs.class || '').split(' ').filter(Boolean);
const byClass = (svg, c) => all(svg).filter(n => classes(n).includes(c));
// The drawing without its numbered ids, so two drawings can be compared.
const plain = n => ({ tag: n.tag, attrs: Object.fromEntries(Object.entries(n.attrs).map(([k, v]) => [k, String(v).replace(/sf-(bezel|clip)-\d+/g, 'sf-$1')])), children: n.children.map(plain) });
const device = svg => plain(svg).children.slice(0, 3); // defs, body, screen

const ROLES = ['builder', 'reviewer', 'qa'];
const INK = { builder: '#F3E3C3', reviewer: '#3FD0D4', qa: '#B08CFF' };
const SIZES = [16, 20, 23, 24, 32, 44, 96];
const sign = svg => byClass(svg, 'sf-sign');
const glow = svg => byClass(svg, 'sf-sign-glow');

test('0650 AC1: draw takes a role, manager by default, and draws the same Premium device for each', () => {
  const { SpeckFace } = load();
  assert.deepEqual([...SpeckFace.roles], ['manager', 'builder', 'reviewer', 'qa']);
  const today = SpeckFace.draw({ mood: 'focused', size: 44 });
  for (const role of [undefined, 'manager', 'nobody', 'constructor', '__proto__']) {
    const svg = SpeckFace.draw({ mood: 'focused', size: 44, role });
    assert.deepEqual(plain(svg), plain(today), `${role} draws Virgil as today`);
    assert.equal(svg.attrs['data-role'], undefined, `${role}: no role mark on Virgil`);
  }
  for (const role of ROLES) {
    const svg = SpeckFace.draw({ role, size: 44 });
    assert.equal(svg.tag, 'svg');
    assert.equal(svg.attrs.viewBox, today.attrs.viewBox);
    assert.equal(svg.attrs['data-role'], role);
    assert.deepEqual(device(svg), device(today), `${role} is the same device: bezel, body and screen`);
    assert.equal(byClass(svg, 'sf-glass').length, 1, `${role} has the screen's glass`);
    assert.equal(byClass(svg, 'sf-visor').length, 0, `${role} has no red visor`);
  }
});

test('0650 AC2: each member\'s sign, in its own colour, with Virgil\'s soft glow; red only for the manager', () => {
  const { SpeckFace, sheet } = load();
  const css = (SpeckFace.draw(), sheet());
  for (const role of ROLES) {
    assert.match(css, new RegExp(`\\.speck-face\\[data-role="${role}"\\][^{]*\\{[^}]*--sf-ink: ${INK[role]};`), `${role}'s colour is ${INK[role]}`);
  }
  assert.match(css, /\.sf-sign, \.sf-sign-glow \{[^}]*stroke: var\(--sf-ink\)/, 'signs are drawn in their member\'s colour');
  assert.doesNotMatch(css.replace(/--sf-eye: #[0-9A-F]+/gi, ''), /#D63F28|#FF6A4D/i, 'the red is only the manager\'s eye');
  const shapes = {};
  for (const role of ROLES) {
    const svg = SpeckFace.draw({ role, size: 44 }), s = sign(svg), g = glow(svg);
    assert.ok(s.length > 0, `${role} has a sign`);
    assert.equal(g.length, s.length, `${role}: a glow under each stroke`);
    s.forEach((n, i) => {
      for (const k of ['d', 'cx', 'cy', 'r']) assert.equal(g[i].attrs[k], n.attrs[k], `${role}: the glow follows the sign (${k})`);
      assert.equal(Number(g[i].attrs['stroke-width']), Number(n.attrs['stroke-width']) + 3.6, `${role}: glow as wide as Virgil's`);
      assert.equal(g[i].attrs['stroke-opacity'], '0.28', `${role}: glow as soft as Virgil's`);
      assert.ok(!classes(n).includes('sf-light'), `${role}'s sign isn't the red light`);
    });
    shapes[role] = s.map(n => n.attrs.d).join(' ');
  }
  assert.match(shapes.builder, /^M -?[\d.]+ -?[\d.]+ L -?[\d.]+ -?[\d.]+ L -?[\d.]+ -?[\d.]+ M -?[\d.]+ -?[\d.]+ L/, 'the builder: a > and a _');
  const builder = sign(SpeckFace.draw({ role: 'builder' }));
  assert.deepEqual(builder.map(n => classes(n).filter(c => c.startsWith('sf-sign-'))), [['sf-sign-prompt'], ['sf-sign-cursor']]);
  const reviewer = sign(SpeckFace.draw({ role: 'reviewer' }));
  assert.deepEqual(reviewer.map(n => classes(n).filter(c => c.startsWith('sf-sign-'))), [['sf-sign-lens'], ['sf-sign-handle']], 'the reviewer: a magnifying glass');
  const qa = sign(SpeckFace.draw({ role: 'qa' }));
  assert.deepEqual(qa.map(n => classes(n).filter(c => c.startsWith('sf-sign-'))), [['sf-sign-corner'], ['sf-sign-corner'], ['sf-sign-corner'], ['sf-sign-corner'], ['sf-sign-bar']], 'QA: four viewfinder corners and a bar');
});

test('0650 AC3: the builder, reviewer and QA never move, in any mood or setting; the manager animates as today', () => {
  const { SpeckFace, sheet } = load();
  const manager = SpeckFace.draw({ mood: 'watching' });
  const css = sheet();
  const media = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
  const animated = [...media.matchAll(/\.(sf-[\w-]+)[^{]*\{\s*animation:/g)].map(m => m[1]);
  assert.ok(animated.length > 0);
  assert.ok(animated.some(c => byClass(manager, c).length), 'the manager still has parts that move');
  for (const role of ROLES) {
    for (const mood of [undefined, ...SpeckFace.moods, 'nonsense']) {
      for (const size of [16, 44]) {
        for (const look of [undefined, 'light', 'dark']) {
          const svg = SpeckFace.draw({ role, mood, size, look });
          const moving = all(svg).filter(n => classes(n).some(c => animated.includes(c)));
          assert.deepEqual(moving, [], `${role} ${mood} ${size} ${look}: nothing the stylesheet animates`);
          assert.equal(svg.attrs['data-mood'], undefined, `${role}: no mood`);
          const before = JSON.stringify(plain(svg));
          SpeckFace.setMood(svg, 'asleep', (from, to, paint) => paint(to));
          assert.equal(JSON.stringify(plain(svg)), before, `${role}: setMood leaves it alone`);
        }
      }
    }
  }
});

test('0650 AC4: each draws at every size from 16 px, in both looks, labelled with its member', () => {
  const { SpeckFace } = load();
  const names = { builder: 'Builder', reviewer: 'Reviewer', qa: 'QA' };
  const screen = { x1: -18, y1: -38, x2: 18, y2: -12 };
  for (const role of ROLES) {
    for (const size of [...SIZES, 8, NaN, '44']) {
      for (const look of [undefined, 'light', 'dark']) {
        const svg = SpeckFace.draw({ role, size, look });
        const px = Number(svg.attrs.width);
        assert.ok(px >= 16, `${role} at ${size}: at least 16 px`);
        assert.equal(svg.attrs['aria-label'], names[role], `${role} is labelled ${names[role]}`);
        assert.equal(svg.attrs.role, 'img');
        if (look) assert.equal(svg.attrs['data-look'], look);
        for (const n of sign(svg)) {
          const w = Number(n.attrs['stroke-width']);
          // At least about a pixel wide on the smallest face: the viewBox is 52 units wide.
          assert.ok(w * px / 52 >= 0.9, `${role} at ${px} px: its strokes are at least a pixel (${w})`);
          const r = Number(n.attrs.r ?? 0);
          const nums = n.tag === 'circle' ? [Number(n.attrs.cx), Number(n.attrs.cy)] : [...n.attrs.d.matchAll(/-?\d*\.?\d+/g)].map(m => Number(m[0]));
          for (let i = 0; i < nums.length; i += 2) {
            assert.ok(nums[i] - r - w / 2 >= screen.x1 && nums[i] + r + w / 2 <= screen.x2 && nums[i + 1] - r - w / 2 >= screen.y1 && nums[i + 1] + r + w / 2 <= screen.y2, `${role}: its sign stays on the screen`);
          }
        }
      }
    }
    assert.equal(SpeckFace.draw({ role, label: 'Ada, the builder' }).attrs['aria-label'], 'Ada, the builder', 'a label given is used');
  }
});
