import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, cssRules, cssValue } from './support/panel.mjs';

// ---------- 0471: the header's "speck" fills its title row ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0471 AC1: the header\'s "speck" is at least 28 px, in Doto at weight 900, and its red dot is sized from the word', () => {
  const name = cssRules('.bezel .name');
  assert.ok(parseFloat(cssValue(name, 'font-size')) >= 28, `font-size: ${cssValue(name, 'font-size')}`);
  assert.match(cssValue(name, 'font-family'), /^"Doto"/);
  assert.equal(cssValue(name, 'font-weight'), '900');
  assert.equal(cssValue(name, 'align-items'), 'center', 'the dot is centred on the word');
  const dot = cssRules('.bezel .name::before');
  for (const p of ['width', 'height']) assert.match(cssValue(dot, p), /em$/, `the dot's ${p} grows with the word`);
});

// The styles before this change, put back over the page's own to compare the frame's size without it.
const BEFORE = `.bezel .name { font-size: 20px !important; gap: 6px !important; } .bezel .name::before { width: 8px !important; height: 8px !important; }`;
// The frame, its title row, the word and its dot, the project and base branch and Settings: where each is and its size.
const READ = `(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const box = n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const q = s => document.querySelector(s);
  const name = q('.bezel .name'), dot = getComputedStyle(name, '::before'), repo = q('.bezel .repo');
  const row = box(q('.bezel .print')), pad = parseFloat(getComputedStyle(q('.bezel .print')).paddingBottom);
  return { bezel: box(q('.bezel')), row, rowMid: row.y + (row.h - pad) / 2, name: box(name), dot: [dot.width, dot.height],
    font: [getComputedStyle(name).fontFamily, getComputedStyle(name).fontWeight, getComputedStyle(name).fontSize],
    doto: document.fonts.check('900 28px Doto'),
    repo: box(repo), repoCut: repo.scrollWidth > repo.clientWidth, repoEllipsis: getComputedStyle(repo).textOverflow,
    nameWhole: name.scrollWidth <= name.clientWidth + 0.5, settings: box(q('#settings-open')) };
})()`;
const near = (a, b, what) => assert.ok(Math.abs(a - b) <= 0.5, `${what}: ${a} against ${b}`);

test('0471 AC1, AC2, AC3: in a real browser, the bigger word sits centred in the title row, the frame keeps its size, and at 320 px the base branch gives way first', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && !!document.querySelector('.bezel .name')`, 'the panel');
    // a project name long enough that the project and base branch have to be cut short at 320 px
    await b.js(`document.querySelector('.bezel .repo').firstChild.textContent = 'a-client-project-with-a-long-name · ', true`);
    let checked = 0;
    for (const width of [320, 390, 600, 1000]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const touch of [false, true]) {
        await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
        assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
        const at = `${width} px, ${touch ? 'touch' : 'mouse'}`;
        const now = await b.js(READ);
        await b.js(`(() => { const s = document.createElement('style'); s.id = 'before-0471'; s.textContent = ${JSON.stringify(BEFORE)}; document.head.append(s); return true; })()`);
        const before = await b.js(READ);
        await b.js(`document.getElementById('before-0471').remove(), true`);
        // AC1: the word is the bigger size in Doto, and it and its dot are centred in the title row
        assert.ok(now.doto, 'Doto loaded');
        assert.deepEqual(now.font.slice(0, 2), ['Doto, ui-monospace, monospace', '900'], at);
        assert.ok(parseFloat(now.font[2]) >= 28, `${at}: ${now.font[2]}`);
        assert.ok(parseFloat(now.dot[0]) > 8 && now.dot[0] === now.dot[1], `${at}: the dot grew, round: ${now.dot}`);
        near(now.name.y + now.name.h / 2, now.rowMid, `${at}: the word centred in the title row`);
        // AC2: the frame and its title row as tall and as wide as without the change
        for (const k of ['x', 'y', 'w', 'h']) { near(now.bezel[k], before.bezel[k], `${at}: the frame's ${k}`); near(now.row[k], before.row[k], `${at}: the title row's ${k}`); }
        assert.ok(now.name.h > before.name.h, `${at}: the word is bigger than before`);
        // AC3: no overlap, the word whole, and at 320 px the base branch cut short with "…"
        assert.ok(now.name.x + now.name.w <= now.repo.x + 0.5, `${at}: the word stops before the project and base branch`);
        assert.ok(now.repo.x + now.repo.w <= now.settings.x + 0.5, `${at}: the project and base branch stop before Settings`);
        assert.ok(now.nameWhole, `${at}: the word is whole`);
        if (width === 320) {
          assert.ok(before.repoCut, 'the project and base branch are cut short at 320 px today too');
          assert.ok(now.repoCut, `${at}: the project and base branch cut short`);
          assert.equal(now.repoEllipsis, 'ellipsis', at);
        }
        checked++;
      }
    }
    assert.equal(checked, 8);
  } finally { await b.close(); await stop(panel); }
});
