// 0379: a pop-up's top line, with its Close, stays at the top while the rest scrolls: the document's (0362), the
// Foreman's (0366) and Settings (0368). Ship and Ask for changes still scroll with the document (0363).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { PAGE, page, findChrome, browserPage, styles } from './support/panel.mjs';
import { PACK, DOCS, text, openPack, docView, docButtons } from './support/documents.mjs';
import { settingsPage, openSettings, rowOf } from './support/settings.mjs';

// 0479: not the Pipeline log, which no longer scrolls as a whole: it's a frame that holds still, with only its log box
// scrolling (test/pipeline-0479.test.mjs).
const POPS = ['doc-view', 'settings'];
// The declarations of each CSS rule whose selector list holds exactly `sel`, in the page's style, media queries included.
const rules = sel => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].replace(/^[^{]*\{/, '').split(',').map(x => x.trim()).includes(sel)).map(m => m[2]);
};

test('0379 AC1 and AC2: each pop-up\'s top line is held at the top, over what scrolls under it', () => {
  for (const id of POPS) {
    const top = rules(`#${id} .top`).join(';');
    assert.match(top, /position: sticky/, `#${id}: held while the rest scrolls`);
    assert.match(top, /top: 0/, `#${id}: at the top`);
    assert.match(top, /background: var\(--panel\)/, `#${id}: in the look's colour, so nothing shows through it`);
    assert.match(top, /env\(safe-area-inset-top\)/, `#${id}: below a phone's notch`);
  }
});

test('0379 AC1 and AC2: no pop-up keeps a top padding of its own above its top line, where what scrolls would show', () => {
  for (const id of POPS) assert.match(rules(`#${id}`).find(r => /(^|;)\s*padding:/.test(r)) || '', /(^|;)\s*padding: 0 /, `#${id}`);
});

test('0379 AC2: a setting\'s explanation that would go under the Settings pop-up\'s held top line goes below its row instead', async () => {
  const S = key => ({ key, value: 1, default: false, explain: `What ${key} does.`, editable: true });
  const p = settingsPage([{ groups: [{ title: 'Some', settings: [S('builder'), S('reviewer')] }] }]);
  await p.settle();
  await openSettings(p);
  const pane = p.byId('settings'), line = pane.children.find(n => n.className === 'top');
  pane.getBoundingClientRect = () => ({ top: 0, bottom: 700 });
  line.getBoundingClientRect = () => ({ top: 0, bottom: 50 });
  for (const [key, top, below] of [['builder', 30, true], ['reviewer', 60, false]]) {
    const tip = p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
    const classes = new Set();
    tip.classList = { add: c => classes.add(c), remove: c => classes.delete(c) };
    tip.getBoundingClientRect = () => classes.has('below') ? { top: 200, bottom: 230 } : { top, bottom: top + 30 };
    const info = p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\binfo\b/.test(n.className));
    p.press(info);
    assert.equal(tip.hidden, false, `${key}: shown`);
    assert.equal(classes.has('below'), below, `${key}: ${below ? 'under the top line, so below its row' : 'clear of the top line, so above its row'}`);
    p.press(info);
  }
});

test('0379 AC1 and AC3: the document pop-up\'s path and Close come first, and its Ship and Ask for changes are below them, with the document', async () => {
  const p = await openPack({ pack: PACK, documents: DOCS }, [text('# Pricing\n\nUp.\n')]);
  p.press(docButtons(p)[0]);
  await p.settle();
  const [top, ...rest] = docView(p).children;
  assert.equal(top.className, 'top');
  assert.ok(top.textContent.includes(DOCS[0].path), 'the path');
  assert.ok(top.children.some(n => n.tagName === 'button' && n.textContent === 'Close'), 'Close');
  assert.deepEqual(rest.map(n => n.className), ['doc-actions', 'md'], 'the actions scroll with the document');
  assert.ok(!rules('#doc-view .doc-actions').some(r => /sticky|fixed/.test(r)), 'nothing holds the actions in place');
});

// ---------- In a real browser: scrolled to the end, Close is still there to press ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LONG = Array.from({ length: 120 }, (_, i) => `<p>Line ${i + 1} of a long document, long enough to wrap on a phone.</p>`).join('');
// Each pop-up filled as the page draws it: its top line with Close first, then what scrolls.
const FILL = {
  'doc-view': `<div class="top"><span class="title">outputs/memos/a/very/long/path/to/the/memo-about-pricing.md</span><button class="close">Close</button></div><div class="doc-actions"><button class="ship">Ship</button></div><div class="md">${LONG}</div>`,
  settings: `<div class="top"><h3>Settings</h3><button class="close">Close</button></div><div class="sgroup">${LONG}</div>`,
};

test('0379 AC1 and AC2: in a real browser, at 390 and 1280 px wide in both looks, scrolling each pop-up to its end leaves its top line and Close in view, and the document\'s Ship scrolls away', chrome, async () => {
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    // The panel's own page, with nothing to fetch: what's in each pop-up is put in below.
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.fetch = () => new Promise(() => {});' });
    const url = pathToFileURL(PAGE).href;
    await b.send('Page.navigate', { url });
    await b.until(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`, 'the page');
    // 0430: a page opened from its file can't load /panel.css, so its styles are put in from their own file.
    await b.js(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(styles())}; document.head.appendChild(s); return true; })()`);
    for (const [width, mobile] of [[390, true], [1280, false]]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile });
      for (const look of ['light', 'dark']) {
        for (const id of POPS) {
          const at = await b.js(`(() => {
            document.documentElement.dataset.theme = ${JSON.stringify(look)};
            for (const x of ${JSON.stringify([...POPS, 'foreman'])}) document.getElementById(x).hidden = true;
            const v = document.getElementById(${JSON.stringify(id)});
            v.innerHTML = ${JSON.stringify(FILL[id])};
            v.hidden = false;
            v.scrollTop = v.scrollHeight;
            const close = v.querySelector('.top .close'), r = close.getBoundingClientRect(), top = v.querySelector('.top').getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            const ship = v.querySelector('.doc-actions');
            const probe = document.createElement('span'); probe.style.color = 'var(--panel)'; document.body.appendChild(probe);
            const panel = getComputedStyle(probe).color; probe.remove();
            const bg = getComputedStyle(v.querySelector('.top')).backgroundColor;
            return { scrolled: v.scrollTop, room: v.scrollHeight - v.clientHeight, top: top.top, bottom: r.bottom, height: innerHeight,
              hit: hit === close, ship: ship ? ship.getBoundingClientRect().bottom : null, bg, panel };
          })()`);
          const where = `${id}, ${width} px, ${look}`;
          assert.ok(at.room > 0 && at.scrolled >= at.room - 1, `${where}: it scrolled to its end (${at.scrolled} of ${at.room})`);
          assert.ok(at.top >= 0 && at.top < 1, `${where}: the top line is at the top (${at.top})`);
          assert.ok(at.bottom <= at.height, `${where}: Close is in view`);
          assert.ok(at.hit, `${where}: nothing covers Close, so a tap reaches it`);
          assert.equal(at.bg, at.panel, `${where}: the top line is in the look's colour, hiding what scrolls under it`);
          if (id === 'doc-view') assert.ok(at.ship < 0, `${where}: AC3: Ship scrolled away with the document (${at.ship})`);
        }
      }
    }
  } finally { await b.close(); }
});
