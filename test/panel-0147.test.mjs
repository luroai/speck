import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, page, PALETTE, paletteProblems, styles } from './support/panel.mjs';

// ---------- 0147: style the panel like the landing page ----------

const parse = s => Object.fromEntries(s.split('; ').map(d => d.split(': ')));
const LIGHT = parse('--bg: #FFFFFF; --panel: #FFFFFF; --raise: #F4F5F7; --line: #E4E6EA; --line-soft: #E4E6EA; --text: #15171A; --muted: #5F6670; --faint: #5F6670; --accent: #2F55D4; --ok: #145a42; --warn: #A84F06; --bad: #A84F06; --run: #2F55D4; --idea: #833063; --inbox: #4c7f8c; --bug: #86371b; --fix: #6d4700; --accent-bg: #f5f0e8; --ok-bg: #edf6f3; --inbox-bg: #eef2f3; --bad-bg: #F4F5F7');
const DARK = parse('--bg: #111214; --panel: #111214; --raise: #1B1D20; --line: #2A2D31; --line-soft: #2A2D31; --text: #ECEDEF; --muted: #9AA0A8; --faint: #9AA0A8; --accent: #86A2FF; --bad: #F0A35A; --ok: #7fbc95; --warn: #F0A35A; --run: #86A2FF; --idea: #c4a6be; --inbox: #88c0d0; --bug: #e69d83; --fix: #d9a65e; --accent-bg: #27221b; --ok-bg: #191f1d; --inbox-bg: #212527; --bad-bg: #1B1D20');
const FONTS = ['"Inter", -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif', '"JetBrains Mono", "SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace']; // 0577: the redesign's fonts, with the machine's behind them, named once each as --font-ui and --font-mono

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
  assert.ok(lists.length >= 2, `the stylesheet's font lists are found (${lists.length})`); // 0580: Doto's list went with the LCD's title
  // 0304: and the design's Doto for speck's name in the header, with a monospace fall-back
  for (const l of lists) assert.ok(FONTS.includes(l) || l === '"Doto", ui-monospace, monospace', `unexpected font list: ${l}`);
  for (const f of FONTS) assert.ok(lists.includes(f), `${f} is used`);
  assert.deepEqual(fontLists('a { font-family: "X", Georgia, serif; }'), ['"X", Georgia, serif'], 'the check finds a stray list');
});

test('0147 AC4: no font is loaded from another host', () => {
  const html = page();
  assert.doesNotMatch(html, /<link\b[^>]*https?:\/\//i);
  assert.doesNotMatch(css(), /@import/i);
  // 0304, 0577: every font loaded is from the panel itself
  for (const [, u] of css().matchAll(/url\(([^)]*)\)/gi)) assert.match(u, /^"fonts\/[\w-]+\.(?:ttf|woff2)"$/);
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
