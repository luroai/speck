// 0213: a P0 priority tag is in the panel's red, so it stands out more than a P1.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fakePage, T, full, click, top, items, queueRows, findChrome, browserPage } from './support/panel.mjs';

const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const rule = sel => (css().match(new RegExp(`\\n\\s*${sel.replace(/[.:#]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
const STATE = () => ({ ideas: [], tickets: [
  full('0001', { priority: 0, type: 'fix' }), full('0002', { priority: 1 }), full('0003', { priority: 2 }),
  T('0004', 'ready', { priority: 0, type: 'fix' }), T('0005', 'ready', { priority: 1 }), T('0006', 'ready', { priority: 5 }),
] });
const isTag = n => /^tag\b/.test(n.className || '') && /^P\d$/.test(n.textContent);
// Each priority tag under a node: its text, classes, tip, wording for screen readers and tab stop.
const prioTags = (p, root) => p.all(root).filter(isTag).map(n => ({ text: n.textContent, cls: n.className.split(' ').filter(c => c !== 'pick'), tip: n.tip, label: n.attrs['aria-label'], tab: n.tabIndex }));
const withId = (p, list, id) => list.find(i => p.all(i).some(n => n.className === 'id' && n._text === id));
const openPane = (p, id) => {
  click(top(withId(p, items(p), id)));
  click(p.all(withId(p, items(p), id)).find(x => x.tagName === 'button' && x.textContent === 'Full ticket'));
  return prioTags(p, p.byId('full-ticket').children[0]);
};

test('0213 AC1: a P0 tag gets the p0 class in Plan, the Build queue and the full ticket pane', async () => {
  const p = fakePage([STATE(), STATE(), STATE()]);
  await p.settle();
  for (const [where, rows] of [['Plan', items(p)], ['the Build queue', queueRows(p)]]) {
    const tags = rows.flatMap(r => prioTags(p, r)).filter(t => t.text === 'P0');
    assert.equal(tags.length, 1, `one P0 tag in ${where}`);
    assert.deepEqual(tags[0].cls, ['tag', 'p0'], where);
  }
  assert.deepEqual(openPane(p, '0001').map(t => t.cls), [['tag', 'p0']], 'the full ticket pane');
});

test('0213 AC1: a P0 tag\'s text and border are in --bad, which the light and the dark look both set', () => {
  const r = rule('.tag.p0');
  assert.match(r, /(^|;|\s)color:\s*var\(--bad\)/);
  assert.match(r, /border-color:\s*var\(--bad\)/);
  // Both looks define --bad, so the rule gives each look its own red.
  const looks = css().match(/--bad:\s*#[0-9a-f]{6}/gi) || [];
  assert.equal(new Set(looks.map(s => s.toLowerCase())).size, 2, `a light and a dark --bad: ${looks}`);
  // As high and fix tags, it comes after the plain tag, so it wins over the grey.
  assert.ok(css().indexOf('.tag.p0 {') > css().indexOf('.tag {'));
});

test('0213 AC2: a P1 tag stays in --text and P2 to P5 tags stay plain grey tags', async () => {
  assert.match(rule('.tag.p1'), /color:\s*var\(--text\);\s*border-color:\s*var\(--text\)/);
  assert.match(rule('.tag'), /color:\s*var\(--muted\)/);
  const s = () => ({ ideas: [], tickets: [1, 2, 3, 4, 5].map(n => T(`000${n}`, 'ready', { priority: n })) });
  const p = fakePage([s(), s(), s()]);
  await p.settle();
  const tags = queueRows(p).flatMap(r => prioTags(p, r));
  assert.deepEqual(tags.map(t => [t.text, t.cls]), [['P1', ['tag', 'p1']], ...[2, 3, 4, 5].map(n => [`P${n}`, ['tag']])]);
});

test('0213 AC3: a P0 tag\'s tip, screen-reader wording and tab stop are as before, and its rule changes only colours', async () => {
  const p = fakePage([STATE(), STATE(), STATE()]);
  await p.settle();
  const want = { text: 'P0', tip: 'Priority 0: built before any other ticket', label: 'Priority 0: built before any other ticket', tab: 0 };
  const queue = queueRows(p).flatMap(r => prioTags(p, r)).find(t => t.text === 'P0');
  const { cls, ...rest } = queue;
  assert.deepEqual(rest, want, 'the Build queue');
  const { cls: c2, ...pane } = openPane(p, '0001')[0];
  assert.deepEqual(pane, want, 'the full ticket pane');
  const props = rule('.tag.p0').split(';').map(s => s.split(':')[0].trim()).filter(Boolean);
  assert.deepEqual(props.sort(), ['border-color', 'color'], 'no size, padding or tap area change');
});

// In a real browser, with the panel's own styles: the colours a P0, P1 and P2 tag end up with, at rest and under the
// pointer, as the priority picker in Plan and as a plain tag.
const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
test('0213 AC1: in a real browser, a P0 tag is in --bad at rest and under the pointer, in the light and dark looks', skip, async () => {
  const b = await browserPage('about:blank');
  try {
    await b.js(`(() => { document.head.innerHTML = '<style>' + ${JSON.stringify(css())} + '</style>';
      document.body.innerHTML = ['tag p0 pick', 'tag p0', 'tag p1 pick', 'tag pick'].map((c, i) => '<p><span id="t' + i + '" class="' + c + '">P' + i + '</span></p>').join(''); })()`);
    const colour = v => b.js(`(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
      const c = getComputedStyle(s).color; s.remove(); return c; })()`);
    const look = i => b.js(`(() => { const s = getComputedStyle(document.getElementById('t${i}')); return [s.color, s.borderTopColor]; })()`);
    // Hover, as DevTools forces it: a bare page doesn't take a simulated pointer.
    await b.send('DOM.enable');
    await b.send('CSS.enable');
    const { root } = await b.send('DOM.getDocument');
    const hover = async i => {
      const { nodeId } = await b.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#t${i}` });
      await b.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
      try { return await look(i); } finally { await b.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); }
    };
    for (const theme of ['light', 'dark']) {
      await b.js(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      const [red, text, muted] = [await colour('var(--bad)'), await colour('var(--text)'), await colour('var(--muted)')];
      assert.notEqual(red, text, theme);
      assert.deepEqual(await look(0), [red, red], `${theme}: the P0 picker at rest`);
      assert.deepEqual(await look(1), [red, red], `${theme}: a plain P0 tag`);
      assert.deepEqual(await hover(0), [red, red], `${theme}: the P0 picker under the pointer`);
      assert.deepEqual(await hover(1), [red, red], `${theme}: a plain P0 tag under the pointer`);
      assert.deepEqual(await look(2), [text, text], `${theme}: a P1 picker at rest`);
      // The P1 and P2 pickers change under the pointer as before, which also shows the hover took effect.
      assert.deepEqual(await hover(2), [text, muted], `${theme}: a P1 picker's hover as before`);
      assert.deepEqual(await hover(3), [text, muted], `${theme}: a P2 picker's hover as before`);
    }
  } finally { await b.close(); }
});
