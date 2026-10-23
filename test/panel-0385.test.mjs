// 0385: on a phone, the Settings pop-up only scrolls up and down.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';
import { settingsPage, openSettings } from './support/settings.mjs';

// The declarations of each CSS rule whose selector list holds exactly `sel`, outside any media query.
const rules = sel => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].split(',').map(x => x.trim()).includes(sel)).map(m => m[2]);
};

// ---------- AC1, quickly: the pop-up can't scroll sideways, by touch or from script ----------

test('0385 AC1: the pop-up clips anything wider than it and lets a finger pan it only up and down, and pinch-zoom', () => {
  const [base] = rules('#settings');
  assert.match(base, /overflow-y: auto/, 'still scrolls up and down');
  assert.match(base, /overflow-x: hidden/, 'never sideways');
  assert.match(base, /touch-action: pan-y pinch-zoom/, 'a sideways swipe pans nothing');
});

test('0385 AC1: each of the pop-up\'s children clips anything wider than the column, within the pop-up\'s padding', () => {
  assert.ok(rules('#settings > *').some(r => /overflow-x: clip/.test(r) && /overflow-clip-margin: 16px/.test(r)), 'clipped 16 px beyond the column');
  assert.match(rules('#settings')[0], /padding: [^;]*max\(16px, env\(safe-area-inset-right\)\)/, 'which the pop-up\'s padding on the right holds');
});

// ---------- AC1 to AC3 in a real browser, at a phone's widths and a desktop's ----------

const skip = findChrome() ? false : 'needs Chrome or Chromium';
const PHONES = [320, 360, 390, 430];

// Every element in the pop-up whose right edge is past the window's, or past the pop-up's own, and its scroll widths.
const MEASURE = `(() => {
  const pane = document.getElementById('settings'), right = Math.min(window.innerWidth, pane.getBoundingClientRect().right);
  const wide = [...pane.querySelectorAll('*')].filter(n => n.getClientRects().length && n.getBoundingClientRect().right > right + 0.5)
    .map(n => n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ').join('.') : '') + ' ' + Math.round(n.getBoundingClientRect().right));
  return { wide, scrollWidth: pane.scrollWidth, clientWidth: pane.clientWidth, docWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
})()`;

// A finger's swipe from one point to another, in steps, as the browser's touch events. Once the finger is lifted, the
// browser has had a moment to scroll for it.
async function swipe(b, from, to) {
  const at = i => ({ x: Math.round(from.x + (to.x - from.x) * i / 10), y: Math.round(from.y + (to.y - from.y) * i / 10) });
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at(0)] });
  for (let i = 1; i <= 10; i++) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at(i)] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.js('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
}

async function openAt(b, port, width, height = 700) {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 900 });
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: width < 900, maxTouchPoints: 5 });
  await b.send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await b.until(`location.port === '${port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
  await b.js(`document.getElementById('settings-open').click()`);
  await b.until(`!!document.querySelector('#settings .setting .info')`, 'the settings');
}

test('0385 AC1, AC2, AC3: in a real browser, the pop-up never moves sideways on a phone, nothing in it is too wide, and a desktop sees it as before', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    for (const width of [320, 430]) {
      await openAt(b, panel.port, width);
      // AC1: something far wider than the pop-up, as a phone may find a fraction of a pixel too much, can't be scrolled to.
      await b.js(`(() => { const w = document.createElement('div'); w.id = 'too-wide'; w.style.width = '2000px'; w.style.height = '1px';
        document.querySelector('#settings > .sgroup').append(w); })()`);
      // A scroll from script doesn't take hold, not even for a moment.
      const fromScript = await b.js(`(() => { const p = document.getElementById('settings'), seen = [];
        p.scrollLeft = 500; seen.push(p.scrollLeft, window.scrollX);
        p.scrollTo(300, 0); seen.push(p.scrollLeft, window.scrollX);
        p.scrollBy(200, 0); seen.push(p.scrollLeft, window.scrollX);
        document.getElementById('too-wide').scrollIntoView({ inline: 'end' }); seen.push(p.scrollLeft, window.scrollX);
        return { seen, scrollWidth: p.scrollWidth, clientWidth: p.clientWidth }; })()`);
      assert.deepEqual(fromScript.seen, [0, 0, 0, 0, 0, 0, 0, 0], `${width} px: no scroll from script moved it sideways`);
      assert.ok(fromScript.scrollWidth <= fromScript.clientWidth, `${width} px: nothing beside the column to scroll to`);
      const pane = await b.js(`(() => { const r = document.getElementById('settings').getBoundingClientRect(); document.getElementById('settings').scrollTop = 0; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      // A sideways swipe, and a sideways drag, anywhere in it: in the middle and over a setting's control.
      const control = await b.js(`(() => { const c = document.querySelector('#settings .setting .control'); c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      // How far it got to the side at any moment.
      await b.js(`(() => { window.sideways = 0; document.addEventListener('scroll', e => { if (e.target.id === 'settings') window.sideways = Math.max(window.sideways, Math.abs(e.target.scrollLeft)); }, true); })()`);
      for (const at of [pane, control]) {
        for (const dx of [-width / 3, width / 3]) {
          await swipe(b, at, { x: at.x + dx, y: at.y });
          await b.send('Input.synthesizeScrollGesture', { x: Math.round(at.x), y: Math.round(at.y), xDistance: Math.round(dx), yDistance: 0, gestureSourceType: 'mouse', speed: 2000 }, 15000);
        }
      }
      const after = await b.js(`({ left: window.sideways, page: window.scrollX, vv: visualViewport.offsetLeft })`);
      assert.deepEqual(after, { left: 0, page: 0, vv: 0 }, `${width} px: a sideways swipe moved nothing`);
      // Up and down still scroll, by touch.
      await swipe(b, { x: pane.x, y: pane.y + 150 }, { x: pane.x, y: pane.y - 150 });
      assert.ok(await b.js(`document.getElementById('settings').scrollTop > 50`), `${width} px: a swipe up scrolls the settings`);
      assert.equal(await b.js(`document.getElementById('settings').scrollLeft`), 0);
      assert.match(await b.js(`getComputedStyle(document.getElementById('settings')).touchAction`), /pinch-zoom/, `${width} px: pinch-zoom still works`);
    }

    // AC2: at each phone width, in both looks, nothing is wider than the window, at rest or with any one explanation open.
    for (const width of PHONES) {
      await openAt(b, panel.port, width);
      for (const look of ['light', 'dark']) {
        const out = await b.js(`(() => {
          document.documentElement.dataset.theme = ${JSON.stringify(look)};
          const measure = () => ${MEASURE};
          const res = [{ name: 'at rest', ...measure() }];
          for (const info of document.querySelectorAll('#settings .setting .info')) {
            info.click();
            res.push({ name: info.getAttribute('aria-label'), ...measure() });
            info.click();
          }
          return res;
        })()`);
        assert.ok(out.length > 10, 'every explanation was opened');
        for (const o of out) {
          const at = `${width} px, ${look} look, ${o.name}`;
          assert.deepEqual(o.wide, [], `${at}: nothing past the right edge`);
          assert.ok(o.scrollWidth <= o.clientWidth, `${at}: the pop-up is no wider than it shows (${o.scrollWidth} > ${o.clientWidth})`);
          assert.ok(o.docWidth <= o.innerWidth, `${at}: the page is no wider than the window`);
        }
      }
    }

    // AC3: at 900 px and over, the column sits centred as before, at most 760 px wide, and scrolls up and down.
    for (const width of [900, 1280]) {
      await openAt(b, panel.port, width, 600);
      const d = await b.js(`(() => { const p = document.getElementById('settings'), c = p.querySelector('.sgroup').getBoundingClientRect();
        const s = getComputedStyle(p); p.scrollTop = 200;
        return { width: c.width, left: c.left, room: p.clientWidth, top: p.scrollTop, oy: s.overflowY, wide: ${MEASURE}.wide }; })()`);
      assert.equal(d.width, 760, `${width} px: the column is 760 px wide`);
      assert.ok(Math.abs(d.left - Math.floor((d.room - 760) / 2)) <= 1, `${width} px: centred`);
      assert.equal(d.oy, 'auto');
      assert.ok(d.top > 0, `${width} px: it scrolls up and down`);
      assert.deepEqual(d.wide, []);
    }
  } finally { await b.close(); await stop(panel); }
});
