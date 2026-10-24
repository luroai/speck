import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, page, PALETTE, paletteProblems, styles } from './support/panel.mjs';

// ---------- 0147: style the panel like the landing page ----------

const parse = s => Object.fromEntries(s.split('; ').map(d => d.split(': ')));
const LIGHT = parse('--bg: #f3f3f3; --panel: #fcfcfc; --raise: #f3f3f3; --line: #14141476; --line-soft: #14141413; --text: #141414EB; --muted: #141414BA; --faint: #141414BA; --accent: #cf2d56; --bad: #96213f; --ok: #145a42; --warn: #6d4700; --run: #285372; --idea: #833063; --inbox: #4c7f8c; --bug: #86371b; --fix: #6d4700; --accent-bg: #f5f0e8; --ok-bg: #eaf3f0; --inbox-bg: #eef2f3; --bad-bg: #f8ebef');
const DARK = parse('--bg: #141414; --panel: #181818; --raise: #1c1c1c; --line: #E4E4E462; --line-soft: #E4E4E413; --text: #E4E4E4EB; --muted: #E4E4E4B8; --faint: #E4E4E4B8; --accent: #e34671; --bad: #ef95ad; --ok: #7fbc95; --warn: #d9a65e; --run: #97b2cc; --idea: #c4a6be; --inbox: #88c0d0; --bug: #e69d83; --fix: #d9a65e; --accent-bg: #27221b; --ok-bg: #1f2421; --inbox-bg: #212527; --bad-bg: #281c1f');
const FONTS = ['-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif', '"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace']; // 0427: Cursor's fonts

const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const css = () => styles(); // 0430: from their own file
// Every variable set by a plain `:root {` block (the first one and the one with the -bg tints).
const lightVars = () => vars([...css().matchAll(/:root \{([^}]*)\}/g)].map(m => m[1]).join(' '));
const darkVars = () => vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '));
// Each comma-separated font list in a stylesheet, its spaces tidied.
const fontLists = s => [...s.matchAll(/(?:(?:"[^"]*"|[\w-]+),\s*)+(?:sans-serif|serif|monospace)\b/g)].map(m => m[0].replace(/,\s*/g, ', '));

test('0147 AC1: the light look sets the landing page\'s colours exactly', () => {
  const v = lightVars();
  for (const [k, want] of Object.entries(LIGHT)) assert.equal(v.get(k), want, k);
  // The first :root block holds the colours, the later one only the tints.
  const first = vars((css().match(/:root \{([^}]*)\}/) || [])[1] || '');
  for (const k of Object.keys(LIGHT).filter(k => !k.endsWith('-bg'))) assert.equal(first.get(k), LIGHT[k], `${k} in the first :root block`);
});

test('0147 AC2: the dark look sets the landing page\'s colours exactly', () => {
  const v = darkVars();
  for (const [k, want] of Object.entries(DARK)) assert.equal(v.get(k), want, k);
});

test('0147 AC3: the colour tests check the new values and fail when one changes', () => {
  for (const d of PALETTE.split('; ')) { const [k, v] = d.split(': '); assert.equal(v, LIGHT[k], `PALETTE ${k}`); }
  assert.deepEqual(paletteProblems(styles()), []);
  for (const [k, v] of Object.entries(parse(PALETTE))) {
    const changed = styles().replace(`${k}: ${v};`, `${k}: #000001;`);
    assert.notEqual(changed, styles(), `${k} is in the page`);
    assert.deepEqual(paletteProblems(changed), [`${k} should be ${v}`]);
  }
  const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
  assert.ok(src('mockup-0126.test.mjs').includes(`assert.equal(PALETTE, '${PALETTE}')`), 'the 0126 literal lists the new values');
  for (const f of ['panel-0134.test.mjs', 'panel-0136.test.mjs']) {
    const s = src(f);
    for (const [k, v] of Object.entries(LIGHT).filter(([k]) => !k.endsWith('-bg') && s.includes(`'${k}': '#`))) {
      assert.ok(s.includes(`'${k}': '${v}'`), `${f} checks the light ${k} as ${v}`);
    }
  }
  // Between them, the named files check every value in AC1 and AC2 exactly.
  const s136 = src('panel-0136.test.mjs');
  for (const [k, v] of Object.entries(DARK)) assert.ok(s136.includes(`'${k}': '${v}'`), `panel-0136 checks the dark ${k} as ${v}`);
  for (const [k, v] of Object.entries(LIGHT)) assert.ok(s136.includes(`'${k}': '${v}'`), `panel-0136 checks the light ${k} as ${v}`);
  assert.ok(s136.includes('rgba\\(20, 20, 19, \\.2\\)') && s136.includes('rgba\\(0, 0, 0, \\.45\\)'), 'panel-0136 checks both backdrops');
});

test('0147 AC3: the full-ticket pane\'s backdrop is rgba(20, 20, 19, .2) in light and unchanged in dark', () => {
  const s = css();
  assert.match(s, /\n {2}#full-backdrop \{[^}]*background: rgba\(20, 20, 19, \.2\);/);
  assert.match(s, /:root\[data-theme="dark"\] #full-backdrop \{ background: rgba\(0, 0, 0, \.45\); \}/);
});

test('0147 AC4: every font list in the stylesheet is one of the landing page\'s three, in its order', () => {
  const lists = fontLists(css());
  assert.ok(lists.length > 20, `the stylesheet's font lists are found (${lists.length})`);
  // 0304: and the design's Doto for speck's name in the header, with a monospace fall-back
  for (const l of lists) assert.ok(FONTS.includes(l) || l === '"Doto", ui-monospace, monospace', `unexpected font list: ${l}`);
  for (const f of FONTS) assert.ok(lists.includes(f), `${f} is used`);
  assert.deepEqual(fontLists('a { font-family: "X", Georgia, serif; }'), ['"X", Georgia, serif'], 'the check finds a stray list');
});

test('0147 AC4: no font is loaded from another host', () => {
  const html = page();
  assert.doesNotMatch(html, /<link\b[^>]*https?:\/\//i);
  assert.doesNotMatch(css(), /@import/i);
  // 0304: the one font loaded is Doto, from the panel itself
  assert.deepEqual([...css().matchAll(/url\(([^)]*)\)/gi)].map(m => m[1]), ['"/fonts/Doto.ttf"']);
});

// AC5: each commit this ticket made (and, on its own branch, the uncommitted work) against the one before it.
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const ALLOWED = ['templates/panel.html', 'test/panel-0147.test.mjs', 'test/support/panel.mjs', 'test/mockup-0126.test.mjs', 'test/panel-0134.test.mjs', 'test/panel-0136.test.mjs',
  // Two browser checks that hard-code an old colour as rgb(): AC5 allows updating colour checks to the new values.
  'test/panel-0041.test.mjs', 'test/panel-0055.test.mjs'];
const allowed = f => ALLOWED.includes(f) || /^speck\/(tickets\/(done\/)?0147-|ideas\/)/.test(f);
// The page with colour values and font lists blanked out, so only other changes are left.
const blank = html => html.replace(/(?:(?:"[^"]*"|[\w-]+),\s*)+(?:sans-serif|serif|monospace)\b/g, 'FONTS')
  .replace(/#[0-9a-f]{3,8}\b/gi, '#C').replace(/rgba?\([^)]*\)/g, 'rgb(C)');
const scripts = html => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g);
function steps() {
  const commits = git('log', '--no-merges', '--format=%H', '-E', '--grep=^speck\\(0147\\): ').stdout.split('\n').filter(Boolean);
  const out = commits.map(c => ({ name: c.slice(0, 7), files: git('diff', '--name-only', `${c}^`, c).stdout.split('\n').filter(Boolean),
    before: git('show', `${c}^:templates/panel.html`).stdout, after: git('show', `${c}:templates/panel.html`).stdout }));
  if (/^speck\/0147-/.test(git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim())) {
    const files = git('diff', '--name-only', 'HEAD').stdout.split('\n').filter(Boolean);
    out.push({ name: 'uncommitted', files, before: git('show', 'HEAD:templates/panel.html').stdout, after: page() });
  }
  return out;
}

test('0147 AC5: the ticket changes only colour values and font lists in the panel\'s stylesheet, and the colour tests', () => {
  const all = steps();
  if (!all.length) return; // a shallow clone without this ticket's commits
  for (const s of all) {
    for (const f of s.files) assert.ok(allowed(f), `${s.name} changes ${f}`);
    if (!s.files.includes('templates/panel.html')) continue;
    assert.deepEqual(scripts(s.after), scripts(s.before), `${s.name} changes nothing in a <script>`);
    assert.equal(blank(s.after), blank(s.before), `${s.name} changes only colour values and font lists`);
  }
  assert.notEqual(blank('a { color: #fff; font-family: "A", serif; } b {}'), blank('a { color: #fff; font-family: "A", serif; } b { x: 1 }'), 'the check notices other changes');
});
