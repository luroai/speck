import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0603: the panel's last old-style parts in the new look: the review pack's top and marks, a chain in the full view,
// the secondary buttons, and no old colours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, full, round, boardPage, fakePage, fullViewOf, ROOT, STYLES, styles } from './support/panel.mjs';
import { rules, selectors, get } from './support/css.mjs';

const cls = n => (n.className || '').split(' ');
const of = (p, c, root) => p.all(root).find(n => cls(n).includes(c));
const allOf = (p, c, root) => p.all(root).filter(n => cls(n).includes(c));
const view = p => p.byId('full-ticket');

// ---------- AC1: the review pack ----------

const PACK = [
  '## 0806 · Approved', '**Verdict:** ✅ Approved by reviewer (codex, round 1 of 3)', '', '**Summary:** Fine.', '',
  '### Acceptance criteria', '| # | Criterion | Result | Evidence |', '|---|---|---|---|',
  '| 1 | First one. | ✅ | Tested. |', '| 2 | Second one. | ❌ | Missing. |', '| 3 | Third one. | ⚠️ | Not sure. |',
].join('\n');
const approved = (o = {}) => T('0806', 'approved', { title: 'Approved', started: new Date().toISOString(), approved: new Date().toISOString(), self_check: 'no changes',
  rounds: [round(1, 10)], auto_ship: false, acceptance_criteria: ['First one.', 'Second one.', 'Third one.'], ...o });
async function packPage(pack = PACK, ticket = approved()) {
  const board = { run: { on: false }, ideas: [], tickets: [ticket] };
  const body = url => (/\/pack$/.test(url) ? { pack, pictures: [], documents: [] } : /\/log$/.test(url) ? { text: '', truncated: false } : board);
  const p = fakePage([], { fetch: async url => { const b = JSON.parse(JSON.stringify(body(String(url)))); return { ok: true, status: 200, json: async () => b }; }, confirm: () => true });
  await p.settle();
  return p;
}
async function openPack(p, id = '0806') {
  await fullViewOf(p, id);
  p.press(p.all(view(p)).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
}

test('0603 AC1: the review pack opens with a back link to its ticket, and no Close button', async () => {
  const p = await packPage();
  await openPack(p);
  const top = view(p).children[0];
  const back = of(p, 'back', top);
  assert.equal(back.attrs.role, 'link');
  assert.equal(back.textContent, '0806');
  assert.equal(back.attrs['aria-label'], 'Back to 0806');
  assert.equal(of(p, 'title', top).textContent, 'Review pack');
  assert.equal(p.all(view(p)).find(n => n.tagName === 'button' && n.textContent === 'Close'), undefined);
  assert.equal(allOf(p, 'close', top).length, 0);
  p.press(back);
  await p.settle();
  assert.equal(view(p).hidden, false, 'the view stays open');
  assert.equal(of(p, 'title', view(p).children[0]).textContent, 'Approved', "on the ticket's full view");
});

test("0603 AC1: the pack's verdict is marked with the panel's tick, not an emoji", async () => {
  const p = await packPage();
  await openPack(p);
  const verdict = p.all(view(p)).find(n => n.tagName === 'p' && n.children[0]?.tagName === 'strong' && n.children[0].textContent === 'Verdict:');
  const tick = of(p, 'tick', verdict);
  assert.equal(tick.attrs.role, 'img');
  assert.equal(tick.attrs['aria-label'], 'Passed');
  assert.doesNotMatch(verdict.textContent, /✅|⛔/);
  assert.match(verdict.textContent, /Approved by reviewer \(codex, round 1 of 3\)/);
});

test('0603 AC1: a verdict that isn\'t approval gets a cross', async () => {
  const p = await packPage(PACK.replace('✅ Approved by reviewer', '⛔ request_changes'));
  await openPack(p);
  const verdict = p.all(view(p)).find(n => n.tagName === 'p' && n.children[0]?.textContent === 'Verdict:');
  assert.equal(of(p, 'cross', verdict).attrs['aria-label'], 'Not approved');
  assert.doesNotMatch(verdict.textContent, /⛔/);
});

test("0603 AC1: each criterion's result is a tick or a cross, and unclear is a word", async () => {
  const p = await packPage();
  await openPack(p);
  const table = of(p, 'ac-table', view(p));
  const results = p.all(table).filter(n => n.tagName === 'tr').slice(1).map(r => r.children[2]);
  assert.equal(results.length, 3);
  assert.equal(of(p, 'tick', results[0]).attrs['aria-label'], 'Passed');
  assert.equal(of(p, 'cross', results[1]).attrs['aria-label'], 'Failed');
  assert.equal(results[2].textContent, 'Unclear');
  for (const r of results) assert.doesNotMatch(r.textContent, /✅|❌|⚠/);
});

test('0603 AC1: the tick is in the accent and the cross in the bad colour, drawn rather than emoji', () => {
  const rs = rules();
  const with_ = sel => rs.filter(r => !r.at.length && selectors(r).includes(sel));
  assert.ok(with_('#full-ticket .tick').some(r => /var\(--blue\)|var\(--accent\)/.test(get(r, 'border'))), 'tick in the accent');
  assert.ok(with_('#full-ticket .cross::before').some(r => get(r, 'border-left') === '2px solid var(--bad)'), 'cross in the bad colour');
  assert.ok(with_('#full-ticket .top > .back').some(r => get(r, 'color') === 'var(--run)'), 'the back link in the accent, as a link');
});

// ---------- AC2: a chain in the full view ----------

const CHAIN = () => [
  T('0010', 'done'), T('0011', 'done', { after: ['0010'] }), T('0012', 'reviewing', { after: ['0011'], started: new Date().toISOString() }),
  T('0013', 'ready', { after: ['0012'], waiting_on: ['0012'] }),
  full('0014', { after: ['0013'], waiting_on: ['0013'] }), full('0015', { after: ['0014'], waiting_on: ['0014'] }),
  full('0016', { after: ['0014'], waiting_on: ['0014'] }), full('0017', { after: ['0015'], waiting_on: ['0015'] }),
];
const chainPage = async () => { const p = boardPage([{ run: { on: false }, ideas: [], tickets: CHAIN() }]); await p.settle(); return p; };

test('0603 AC2: a chain in the full view is a plain section in the facts\' style, naming what it waits for and what waits on it, with their state', async () => {
  const p = await chainPage();
  const steps = (await fullViewOf(p, '0013')).children[1];
  const chain = steps.children.find(n => cls(n).includes('chain-facts'));
  assert.equal(chain.tagName, 'dl');
  assert.deepEqual(cls(chain), ['facts', 'chain-facts']);
  const cells = chain.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
  assert.deepEqual(cells, [['Waits for', '0012 building, +2 more'], ['Waiting on it', '0014 queued, +3 more']]);
  assert.equal(of(p, 'deps', steps), undefined, 'no bordered box');
  assert.equal(of(p, 'dot', steps), undefined, 'no circles');
  assert.equal(of(p, 'deps-slots', steps), undefined);
});

test('0603 AC2: a ticket on the page is a link that shows it in the view', async () => {
  const p = await chainPage();
  const steps = (await fullViewOf(p, '0013')).children[1];
  const chain = steps.children.find(n => cls(n).includes('chain-facts'));
  const link = p.all(chain).find(n => n.tagName === 'button' && n.textContent === '0014');
  assert.equal(link.parentNode.textContent, '0014 queued', 'its state beside it');
  assert.equal(link.attrs['aria-label'], 'Go to ticket 0014, queued');
  p.press(link);
  await p.settle();
  assert.equal(view(p).children[0].children[0].textContent, '0014', 'the view shows 0014');
});

test('0603 AC2: the chain section has no border or filled circle in its styles', () => {
  for (const r of rules().filter(r => selectors(r).some(s => /\.chain-facts\b/.test(s)))) {
    assert.ok(!get(r, 'border') || /^0|none/.test(get(r, 'border')), `${r.sel}: no border`);
    assert.ok(!get(r, 'border-radius'), `${r.sel}: no circle`);
  }
});

// ---------- AC3: the secondary buttons ----------

// Each secondary button the panel draws: Full ticket, Full log and Go to Plan are .full-open. 0606: All figures is a text link.
const SECONDARY = ['.full-open', '.q .stop-build', '.q .back-to-plan', '.q .go-with', '.foreman-ask .ask-reply', '.resume .copy', '.foreman .reload', '#doc-view .close', '#settings .close', '#settings-unsaved button.secondary'];
const WANT = { border: '1px solid var(--line)', 'border-radius': '10px', color: 'var(--text)', 'min-height': '44px' };
// Its plain rules' declarations, later ones winning, as the cascade has rules of equal weight.
const cascaded = (sel, rs) => Object.fromEntries(rs.filter(r => !r.at.length && selectors(r).includes(sel)).flatMap(r => r.decls));

test('0603 AC3: every secondary button has the redesign\'s secondary style, for every pointer', () => {
  const rs = rules();
  for (const sel of SECONDARY) {
    const d = cascaded(sel, rs);
    for (const [k, v] of Object.entries(WANT)) assert.equal(d[k], v, `${sel}: ${k}`);
  }
});

test('0603 AC3: nothing more particular takes the style back off a secondary button', () => {
  const rs = rules();
  const looks = ['border', 'border-color', 'border-radius', 'color', 'min-height', 'font-size', 'height', 'max-height'];
  for (const r of rs.filter(r => !r.at.length)) {
    for (const s of selectors(r)) {
      if (SECONDARY.includes(s) || /:(hover|disabled|focus)/.test(s)) continue;
      if (!/\.(full-open|stop-build|back-to-plan|go-with|ask-reply|copy|reload|close|secondary)(?![\w-])/.test(s) || !/(\.full-open|\.q |\.foreman|\.resume|#doc-view|#settings)/.test(s)) continue;
      if (/#full-ticket \.top/.test(s) || /#decided/.test(s)) continue; // back links, not buttons
      for (const k of looks) if (get(r, k) !== undefined) assert.equal(get(r, k), WANT[k] ?? get(r, k), `${s}: ${k}`);
      assert.ok(get(r, 'border-radius') === undefined || get(r, 'border-radius') === '10px', `${s}: corners`);
      assert.ok(get(r, 'min-height') === undefined || get(r, 'min-height') === '44px', `${s}: height`);
    }
  }
});

test('0603 AC3: the cards and Settings\' question draw their secondary buttons with these classes, and All figures is no longer one (0606)', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'templates', 'panel.html'), 'utf8');
  assert.match(html, /<button class="more-stats"/);
  const js = ['panel.js', 'panel-popups.js', 'panel-settings.js'].map(f => fs.readFileSync(path.join(ROOT, 'templates', f), 'utf8')).join('\n');
  for (const c of ['stop-build', 'back-to-plan', 'full-open go-plan']) assert.match(js, new RegExp(`el\\('button', '${c}'`));
  for (const label of ['Discard', 'Keep editing']) assert.match(js, new RegExp(`choice\\('${label}', 'secondary'`), `Settings' ${label}`);
});

// ---------- AC4: the old colours ----------

const OLD = ['--bezel', '--bezel-ink', '--bezel-muted', '--log-bg', '--log-text', '--log-muted', '--log-run', '--log-bad', '--log-warn', '--purple'];

test('0603 AC4: no style uses the old colours, and panel-base.css no longer has them', () => {
  const tpl = path.join(ROOT, 'templates');
  const files = [...STYLES, ...fs.readdirSync(tpl).filter(f => /\.(js|html)$/.test(f)).map(f => path.join(tpl, f))];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const v of OLD) assert.doesNotMatch(text, new RegExp(`var\\(${v}\\)`), `${path.basename(f)} uses ${v}`);
  }
  const base = fs.readFileSync(path.join(tpl, 'panel-base.css'), 'utf8');
  for (const v of OLD) assert.doesNotMatch(base, new RegExp(`${v}\\s*:`), `panel-base.css defines ${v}`);
});

test("0603 AC4: the Shipped step's colour is the accent", () => {
  const rs = rules(styles());
  const ship = rs.filter(r => selectors(r).some(s => /\.step\.(done|now)\.ship$/.test(s)));
  assert.ok(ship.length);
  for (const r of ship) for (const k of ['border-top-color', 'color']) if (get(r, k)) assert.equal(get(r, k), 'var(--accent)', `${r.sel}: ${k}`);
});
