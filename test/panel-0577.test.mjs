import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, styles, cssRules, cssValue, panelRepo, freePort, startPanel, stop, request } from './support/panel.mjs';
import { looks, contrast } from './support/contrast.mjs';

// ---------- 0577: the redesign's colours and fonts ----------

const FONTS = path.join(ROOT, 'templates', 'fonts');
const FACES = [['Inter', 400], ['Inter', 500], ['Inter', 600], ['JetBrains Mono', 400], ['JetBrains Mono', 500]];
const fileOf = (family, weight) => `${family.replace(' ', '')}-${weight}.woff2`;
const plain = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');
const faces = () => [...plain().matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]);
const prop = (decls, name) => (decls.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`)) || [])[1]?.trim();
const urls = css => [...css.matchAll(/url\(\s*["']?([^"')]*)["']?\s*\)/gi)].map(m => m[1]);

const LIGHT = { '--bg': '#FFFFFF', '--surface': '#F4F5F7', '--border': '#E4E6EA', '--text': '#15171A', '--muted': '#5F6670', '--accent': '#2F55D4', '--needs-you': '#D9822B', '--needs-you-text': '#A84F06', '--eye': '#D63F28' };
const DARK = { '--bg': '#111214', '--surface': '#1B1D20', '--border': '#2A2D31', '--text': '#ECEDEF', '--muted': '#9AA0A8', '--accent': '#86A2FF', '--needs-you': '#F0A35A', '--needs-you-text': '#F0A35A', '--eye': '#FF6A4D' };
const BAR = { '--bar': '#1C1D19', '--bar-ink': '#E8E7E1', '--bar-muted': '#A5A69E', '--bar-line': '#34352F', '--bar-eye': '#E24A2F' };

test('0577 AC1: panel-base.css has the redesign\'s colours in each look, and the black bar\'s, the same in both', () => {
  const base = looks(fs.readFileSync(path.join(ROOT, 'templates', 'panel-base.css'), 'utf8'));
  for (const [look, want] of [['light', { ...LIGHT, ...BAR }], ['dark', { ...DARK, ...BAR }]])
    for (const [name, value] of Object.entries(want)) assert.equal(base[look][name]?.toUpperCase(), value, `${look} ${name}`);
});

test('0577 AC1: the views\' own names for the page, its surfaces, its lines and its text take the same colours, so every view picks them up', () => {
  const { light, dark } = looks();
  for (const [look, t, want] of [['light', light, LIGHT], ['dark', dark, DARK]]) {
    for (const [name, from] of [['--panel', '--bg'], ['--raise', '--surface'], ['--line', '--border'], ['--line-soft', '--border'], ['--muted-large', '--muted'], ['--faint', '--muted'], ['--run', '--accent'], ['--blue', '--accent'], ['--bad', '--needs-you-text'], ['--warn', '--needs-you-text']])
      assert.equal(t[name]?.toUpperCase(), want[from], `${look} ${name}`);
  }
});

test('0577 AC2: each font is a woff2 file in templates/fonts, with its SIL OFL licence beside it', () => {
  for (const [family, weight] of FACES) assert.equal(fs.readFileSync(path.join(FONTS, fileOf(family, weight))).subarray(0, 4).toString(), 'wOF2', `${family} ${weight}`);
  for (const [file, author] of [['Inter-OFL.txt', 'The Inter Project Authors'], ['JetBrainsMono-OFL.txt', 'The JetBrains Mono Project Authors']]) {
    const licence = fs.readFileSync(path.join(FONTS, file), 'utf8');
    assert.match(licence, /SIL OPEN FONT LICENSE Version 1\.1/, file);
    assert.ok(licence.includes(author), `${file} names ${author}`);
  }
});

test('0577 AC2: each font has an @font-face loading it from an address relative to the page', () => {
  for (const [family, weight] of FACES) {
    const f = faces().find(d => prop(d, 'font-family') === `"${family}"` && prop(d, 'font-weight') === String(weight));
    assert.ok(f, `an @font-face for ${family} ${weight}`);
    assert.equal(prop(f, 'src'), `url("fonts/${fileOf(family, weight)}") format("woff2")`);
    assert.equal(prop(f, 'font-display'), 'swap', 'the fallback shows while it loads');
  }
});

test('0577 AC2: the panel\'s text is in Inter, ids, times and figures in JetBrains Mono, with a font the machine has behind each', () => {
  const tokens = looks().light;
  assert.match(tokens['--font-ui'], /^"Inter", .*sans-serif$/);
  assert.match(tokens['--font-mono'], /^"JetBrains Mono", .*monospace$/);
  assert.match(cssValue(cssRules('body'), 'font'), /^400 14px\/1\.5 var\(--font-ui\)$/);
  for (const sel of ['code', '.id', '.sh .n', 'td.num', '.stat .num', '.stat .count', '.q.row .where .sub', '.facts .value.time .sub', '#shipped .meta']) assert.equal(cssValue(cssRules(sel), 'font-family'), 'var(--font-mono)', sel);
  assert.match(cssValue(cssRules('.foreman ol.run-log'), 'font'), /var\(--font-mono\)$/, 'a log\'s lines, with their times');
  const left = [...plain().matchAll(/font(?:-family)?:[^;}]*(?:Segoe WPC|SF Mono)[^;}]*/g)].filter(m => !m[0].startsWith('font-family: "Inter"') && !m[0].includes('--font'));
  assert.deepEqual(left.map(m => m[0]), [], 'every font list is one of the two');
});

test('0577 AC2: lane titles and the Pipeline log\'s title no longer use Doto', () => {
  for (const sel of ['.lane-title', '#foreman .top .title']) {
    assert.equal(cssValue(cssRules(sel), 'font-family'), 'var(--font-ui)', sel);
    assert.equal(cssValue(cssRules(sel), 'font-weight'), '600', `${sel}: a weight Inter has here`);
  }
});

test('0577 AC3: muted, accent and needs-you text reach 4.5:1 on the background and the surface, in both looks', () => {
  for (const [look, t] of Object.entries(looks()))
    for (const fg of ['--muted', '--accent', '--needs-you-text'])
      for (const bg of ['--bg', '--surface']) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${look}: ${fg} on ${bg} is ${contrast(t[fg], t[bg]).toFixed(2)}:1`);
});

test('0577 AC4: the page and its stylesheets name no other host for a font or a style', () => {
  assert.doesNotMatch(plain(), /@import/i);
  assert.deepEqual(urls(plain()).filter(u => /^(?:[a-z]+:|\/)/i.test(u)), [], 'every url() is relative');
  assert.deepEqual([...page().matchAll(/<link\b[^>]*\bhref="([^"]*)"/gi)].map(m => m[1]).filter(u => /^(?:[a-z]+:|\/)/i.test(u)), [], 'every link is relative');
});

test('0577 AC2 and AC4: the panel serves every font its stylesheets name itself, and nothing else in that folder', async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  try {
    const named = urls(plain());
    for (const [family, weight] of FACES) assert.ok(named.includes(`fonts/${fileOf(family, weight)}`), `${family} ${weight} is named`);
    for (const u of named) {
      const res = await request(panel.port, { pathName: `/${u}`, bytes: true });
      assert.equal(res.status, 200, u);
      assert.equal(res.headers['content-type'], u.endsWith('.ttf') ? 'font/ttf' : 'font/woff2', u);
      assert.equal(res.headers['x-content-type-options'], 'nosniff', u);
      assert.equal(res.body.length, fs.statSync(path.join(ROOT, 'templates', u)).size, `${u}: the whole file`);
    }
    const unknown = await request(panel.port, { pathName: '/no-such-thing' });
    for (const where of ['/fonts/Inter-OFL.txt', '/fonts/Inter-700.woff2', '/fonts/../panel.html', '/fonts/', '/fonts/constructor', '/fonts/__proto__']) {
      const r = await request(panel.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
  } finally { await stop(panel); }
});
