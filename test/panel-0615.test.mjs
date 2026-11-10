import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, round, boardPage, items, notes, queueRows, shippedRows, styles } from './support/panel.mjs';

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const STARTED = { started: ago(18 * 60 + 5), build_running: true };
const stamp = new Date().toISOString();
const WAITS = ['0599', '0600', '0601', '0602', '0603', '0604', '0605', '0606', '0607', '0608', '0609', '0610'];
const note = (name, title, extra = '') => ({ path: `speck/ideas/${name}.md`, title, status: 'inbox', body: `# ${title}\n\nCaptured: 2026-10-20 · Status: inbox\n${extra}` });
const STATE = {
  run: { on: true },
  ideas: [note('one', 'One', 'From ticket: 0599\nRaised by: agent\n'), note('two', 'Two')],
  tickets: [
    T('0701', 'draft', { type: 'bug', risk: 'high' }),
    T('0711', 'ready', { waiting_on: WAITS, after: WAITS }),
    T('0712', 'reviewing', { ...STARTED, review_running: 2 }),
    T('0721', 'done', { started: stamp, finished: stamp, rounds: [round(1, 500)] }),
  ],
};
const show = async (state = STATE, globals = {}) => { const p = boardPage([state], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }), ...globals }); await p.settle(); return p; };
const detailsOf = (p, row) => p.all(row).find(c => /^(where|checks|meta)\b/.test(c.className || ''));
const idOf = (p, row) => p.all(row).find(c => c.className === 'id')?._text;

test('0615 AC1: in every lane, a closed row\'s details line has its whole text as its tooltip', async () => {
  const p = await show();
  const plan = detailsOf(p, items(p).find(r => idOf(p, r) === '0701'));
  assert.equal(plan.textContent, 'P2 · S · high · bug');
  assert.equal(plan.title, 'P2 · S · high · bug', 'Plan');
  const ready = detailsOf(p, queueRows(p).find(r => idOf(p, r) === '0711'));
  assert.equal(ready.textContent, `Ready · after ${WAITS.join(', ')}`);
  assert.equal(ready.title, ready.textContent, 'Build: a ready row, which says no more than its line');
  const shipped = detailsOf(p, shippedRows(p)[0]);
  assert.ok(shipped.title.includes(shipped.textContent.trim().split(' · ').pop()), 'Shipped, as before');
  const [one, two] = notes(p).map(r => detailsOf(p, r));
  assert.equal(two.title, two.textContent, 'Capture');
  assert.match(one.title, /^From 0599 · 20 Oct( 2026)? · agent$/, 'Capture: a note an agent raised, with its agent tag');
});

test('0615 AC1: a Build row whose sentence says more than its line has its whole line, then the sentence', async () => {
  const p = await show();
  const line = detailsOf(p, queueRows(p).find(r => idOf(p, r) === '0712'));
  assert.equal(line.textContent, 'Reviewing · round 2 · 18 min');
  assert.equal(line.title, 'Reviewing · round 2 · 18 min\nThe reviewer is reviewing · round 2');
});

test('0615 AC1: a Build row\'s tooltip moves on with its minutes', async () => {
  let now = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
  const p = await show({ run: { on: true }, ideas: [], tickets: [T('0712', 'building', STARTED)] }, { Date: Clock });
  const line = () => detailsOf(p, queueRows(p)[0]);
  assert.match(line().title, /^Writing tests and code · 18 min|· 18 min\n/);
  now += 2 * 60000;
  [...p.intervals.values()].find(v => v.ms === 1000).fn();
  assert.match(line().textContent, /· 20 min$/);
  assert.ok(line().title.startsWith(line().textContent), `the tooltip starts with the line as it is now: ${JSON.stringify(line().title)}`);
});

test('0615 AC1: a tag in the line keeps only its own tip, not the line\'s tooltip too', async () => {
  const p = await show();
  const plan = detailsOf(p, items(p).find(r => idOf(p, r) === '0701'));
  const tags = p.all(plan).filter(c => /\btag\b/.test(c.className || ''));
  assert.ok(tags.length >= 4);
  for (const t of tags) assert.ok(t.title !== undefined && (t.title === '' || t.title === 'Set the priority'), `${t.textContent}: ${t.title}`);
});

test('0615 AC2: a screen reader reads the whole details line: its whole text is on the page, none of it hidden', async () => {
  const p = await show();
  const lines = [...items(p), ...queueRows(p), ...shippedRows(p), ...notes(p)].map(r => detailsOf(p, r)).filter(Boolean);
  assert.equal(lines.length, 6);
  for (const l of lines) for (const n of p.all(l)) assert.notEqual(n.attrs?.['aria-hidden'], 'true', `${l.textContent}: nothing in it is hidden`);
  const ready = detailsOf(p, queueRows(p).find(r => idOf(p, r) === '0711'));
  assert.ok(ready.textContent.endsWith(WAITS.at(-1)), 'the text past the ellipsis is still there to read');
  // The ellipsis only clips how it looks: no rule hides the line's text.
  assert.match(styles(), /\.q\.row \.where, \.item\.row:not\(\.open\) \.checks, #shipped \.meta \{ white-space: nowrap; overflow-x: clip; overflow-y: visible; text-overflow: ellipsis; \}/);
});

test('0615 AC3: rows look as they do today: the change adds only tooltips, no style', () => {
  const css = ['panel-base.css', 'panel-cards.css'].map(f => fs.readFileSync(new URL(`../templates/${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(css, /0615/);
});
