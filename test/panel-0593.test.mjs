// 0593: the Settings view in the redesign's look.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styles, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, changeTo } from './support/settings.mjs';

// The declarations of every CSS rule whose selector list holds exactly `sel`, media queries included.
const rules = sel => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].split(',').map(x => x.trim()).includes(sel)).map(m => m[2]).join(';');
};
const row = (key, o = {}) => ({ key, value: '', default: '', explain: `What ${key} does.`, editable: true, ...o });
const VIEW = () => ({ groups: [
  { title: 'Your engineering manager', settings: [row('speck_name', { value: 'Virgil' }), row('watch', { value: 'tell' })] },
  { title: 'Shipping', settings: [row('ship_mode', { value: 'local' })] },
] });
const pane = p => p.byId('settings');

async function opened() {
  const p = settingsPage([VIEW()]);
  await openSettings(p);
  return p;
}
const facesIn = (p, n) => p.all(n).filter(c => c.tagName === 'svg');

// ---------- AC1: plain sections, with rows of a label, a control and a muted explanation ----------

test('0593 AC1: a group has no card border, shadow or rounding', () => {
  for (const sel of ['#settings .sgroup', '#settings .switches']) {
    assert.doesNotMatch(rules(sel), /box-shadow|border-radius/, `${sel} is a plain section`);
    assert.match(rules(sel), /border: 0/, `${sel} takes away the border every section has`);
  }
});

// 0729: a group's heading is a small muted label over its rows' block now, with no divider, as Cursor's settings have it
test('0593 AC1: a group\'s heading has no divider under it (0729)', () => {
  assert.doesNotMatch(rules('#settings .sgroup .sh'), /border-bottom:/);
  assert.match(rules('#settings .sgroup .sh'), /border: 0/, 'it takes away the line every section head has');
});

test('0593 AC1: a setting\'s row has no line or inset of a card', () => {
  for (const sel of ['#settings .setting', '#settings .switch-row', '#settings .arow']) {
    assert.doesNotMatch(rules(sel), /border-bottom/, `${sel}: the heading's divider is the only line`);
    assert.match(rules(sel), /padding: 8px 0/, `${sel}: lined up with its heading`);
  }
});

test('0593 AC1: each setting keeps its label and control, its name is the button that shows its explanation (0729: not an info button), and its explanation is in muted text', async () => {
  const p = await opened();
  for (const key of ['speck_name', 'watch', 'ship_mode']) {
    const r = rowOf(p, key), kids = p.all(r), cls = c => kids.find(n => new RegExp(`\\b${c}\\b`).test(n.className || ''));
    assert.ok(cls('label'), `${key}: its label`);
    assert.ok(cls('control'), `${key}: its control`);
    assert.equal(cls('name')?.tagName, 'button', `${key}: its name is a button`);
    assert.equal(cls('info'), undefined, `${key}: no info button`);
    assert.equal(cls('explain')?.textContent, `What ${key} does.`, `${key}: its explanation`);
  }
  assert.match(rules('#settings .setting p.explain'), /color: var\(--muted\)/);
  assert.match(rules('#settings .switch-row p.explain'), /color: var\(--muted\)/);
});

// ---------- AC2: the Save bar (0731: gone, as each setting saves as it changes) ----------

// ---------- AC3: speck's face beside its name (0652: as its card's character, beside the name the card has) ----------

const headOf = p => p.all(pane(p)).find(n => /\bmhead\b/.test(n.className || ''));
test('0593 AC3: the name setting shows speck\'s face, watching, beside its control', async () => {
  const p = await opened();
  const head = headOf(p);
  const [face] = facesIn(p, head);
  assert.ok(face, 'a face at the head of its card');
  assert.equal(face.attrs['data-mood'], 'watching');
  assert.match(face.attrs['aria-label'], /Virgil/, 'named as you named it');
  assert.equal(head.children[0], face, 'before the name');
  assert.equal(facesIn(p, pane(p)).length, 1, 'and nowhere else in the view');
});

test('0593 AC3: the face is there after its row is drawn again', async () => {
  const p = await opened();
  changeTo(p, 'speck_name', 'Dante');
  await p.settle();
  assert.equal(facesIn(p, headOf(p)).length, 1);
  assert.equal(facesIn(p, pane(p)).length, 1);
});

test('0593 AC3: a blank name is labelled speck', async () => {
  const p = settingsPage([{ groups: [{ title: 'Your engineering manager', settings: [row('speck_name')] }] }]);
  await openSettings(p);
  assert.match(facesIn(p, headOf(p))[0].attrs['aria-label'], /^speck\b/);
});

// ---------- AC4: at 320 px wide, in both looks, in a real browser ----------

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0593 AC1, AC4: at 320 px, in both looks, the groups are drawn with no box, nothing runs past the view and the face stays on its name\'s line (0652: its card\'s)', { skip, timeout: 60000 }, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.until(`document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(), true`);
    await b.until(`!!document.querySelector('#settings .speck-face') && !!document.querySelector('#settings input[aria-label="speck_name"]')`, 'the settings');
    for (const look of ['light', 'dark']) {
      await b.js(`document.getElementById('look-${look}').click(), true`);
      await b.until(`document.documentElement.dataset.theme === '${look}'`, 'the look');
      const d = await b.js(`(() => {
        const pane = document.getElementById('settings'), right = Math.min(innerWidth, pane.getBoundingClientRect().right);
        const wide = [...pane.querySelectorAll('*')].filter(n => n.getClientRects().length && !n.closest('p.explain') && n.getBoundingClientRect().right > right + 0.5).map(n => n.tagName + '.' + n.className);
        const face = pane.querySelector('.speck-face'), box = face.parentNode.querySelector('h5'), f = face.getBoundingClientRect(), i = box.getBoundingClientRect(), input = pane.querySelector('input[aria-label="speck_name"]').getBoundingClientRect();
        const boxed = [...pane.querySelectorAll('.sgroup, .switches')].filter(g => { const c = getComputedStyle(g); return ['Top', 'Right', 'Bottom', 'Left'].some(d => parseFloat(c['border' + d + 'Width']) > 0) || c.boxShadow !== 'none' || parseFloat(c.borderTopLeftRadius) > 0; }).map(g => g.className);
        return { boxed, wide, sw: pane.scrollWidth, cw: pane.clientWidth, sameLine: f.top < i.bottom && i.top < f.bottom, inputWidth: input.width,
          bg: getComputedStyle(pane).backgroundColor };
      })()`);
      assert.deepEqual(d.boxed, [], `${look}: no group is drawn as a card`);
      assert.deepEqual(d.wide, [], `${look}: nothing past the view`);
      assert.ok(d.sw <= d.cw, `${look}: no sideways scroll`);
      assert.ok(d.sameLine, `${look}: the face beside its card's name`);
      assert.ok(d.inputWidth >= 40, `${look}: a box wide enough to type in, was ${d.inputWidth}`);
      assert.equal(d.bg, look === 'dark' ? 'rgb(17, 18, 20)' : 'rgb(255, 255, 255)', `${look}: the look's own page colour`);
    }
  } finally { await b.close(); await stop(panel); }
});
