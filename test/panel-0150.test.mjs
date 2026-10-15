import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, deferred, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0150: tidy the panel header ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const state = run => ({ tickets: [], ideas: [], resume_command: '', ...(run ? { run } : {}) });
const header = () => page().match(/<header>([\s\S]*?)<\/header>/)[1];
const runOf = p => p.byId('run');
const dotOf = p => p.all(runOf(p)).find(n => /\bmini\b/.test(n.className || '')); // 0163: the builder in place of the square
const ON = 'Pause Auto-build: ready tickets wait';
const OFF = 'Start Auto-build: build ready tickets';

test('0150 AC1: the header has no live, connecting… or disconnected indicator', async () => {
  const h = header();
  assert.doesNotMatch(h, /id="pills"/);
  assert.doesNotMatch(h, /connecting…|disconnected|\blive ·/);
  const p = fakePage([state(null), new Error('down'), state(null)]);
  await p.settle();
  assert.equal(p.byId('pills').children.length, 0, 'nothing is put in a connection indicator');
  assert.doesNotMatch(runOf(p).textContent, /live|disconnected/);
});

test('0150 AC1: when the panel can\'t reach its server, the banner under the header still says so, and it goes when it\'s back', async () => {
  const p = fakePage([state(null), new Error('down'), state(null)]);
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  p.timers.shift()(); await p.settle();
  await p.elapse(10000); // 0186: once 10 seconds pass without a board
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /^Disconnected: can't reach speck panel\./);
  assert.equal(p.byId('pills').children.length, 0);
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, true);
});

test('0150 AC2: Auto-build is one button in the header, with no separate Pause or Start button or small print', async () => {
  const h = header();
  assert.match(h, /<button class="run-state" id="run" type="button"/);
  assert.doesNotMatch(h, /id="run-switch"/);
  for (const run of [null, { on: true, pid: 7 }]) {
    const p = fakePage([state(run)]);
    await p.settle();
    assert.doesNotMatch(runOf(p).textContent, /ready tickets wait|Pause|Start/);
    assert.equal(p.all(runOf(p)).filter(n => n.tagName === 'button').length, 0, 'no button inside it');
    assert.equal(p.byId('run-switch').children.length, 0, 'nothing is put in a separate switch');
  }
});

test('0150 AC2: on, it reads "Auto-build on" with a green square, aria-pressed true and a tooltip saying a click pauses it', async () => {
  const p = fakePage([state({ on: true, pid: 7 })]);
  await p.settle();
  assert.equal(runOf(p).hidden, false);
  assert.equal(runOf(p).textContent, 'Auto-build on');
  assert.equal(dotOf(p).className, 'mini still'); // 0163: the builder, still, in place of the square
  assert.equal(runOf(p).attrs['aria-pressed'], 'true');
  assert.equal(runOf(p).title, ON);
  assert.equal(runOf(p).disabled, false);
});

test('0150 AC2: off, it reads "Auto-build off" with a red square, aria-pressed false and a tooltip saying a click starts it', async () => {
  const p = fakePage([state(null)]);
  await p.settle();
  assert.equal(runOf(p).textContent, 'Auto-build off');
  assert.equal(dotOf(p).className, 'mini still'); // 0163: the builder, still, in place of the square
  assert.equal(runOf(p).attrs['aria-pressed'], 'false');
  assert.equal(runOf(p).title, OFF);
});

test('0150 AC2: clicking it starts or pauses speck run as Start and Pause did, with the token', async () => {
  const p = fakePage([state(null), { ok: true, run: { on: true, pid: 9 } }, { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.ok(p.calls.at(-1).opts.headers['X-Speck-Token'] !== undefined, 'sends the token');
  assert.equal(runOf(p).textContent, 'Auto-build on');
  assert.equal(runOf(p).attrs['aria-pressed'], 'true');
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(runOf(p).textContent, 'Auto-build off');
  assert.equal(runOf(p).attrs['aria-pressed'], 'false');
});

test('0150 AC2: while a request is pending it reads "Starting…" or "Pausing…" and can\'t be clicked', async () => {
  for (const [run, label, url] of [[null, 'Starting…', '/api/run/on'], [{ on: true, pid: 7 }, 'Pausing…', '/api/run/off']]) {
    const answer = deferred();
    const p = fakePage([state(run), answer]);
    await p.settle();
    p.press(runOf(p));
    await p.settle();
    assert.equal(runOf(p).textContent, label);
    assert.equal(runOf(p).disabled, true);
    p.press(runOf(p));
    await p.settle();
    assert.equal(p.calls.filter(c => c.url === url).length, 1, 'a second click sends nothing');
  }
});

test('0150 AC2: if starting fails, the reason shows under the header', async () => {
  const p = fakePage([state(null), { status: 409, body: { error: 'speck run is already running.' } }]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.byId('run-error').hidden, false);
  assert.equal(p.byId('run-error').textContent, 'speck run is already running.');
  assert.equal(runOf(p).textContent, 'Auto-build off');
  assert.equal(runOf(p).disabled, false);
});

// ---------- in a browser ----------

// The state the page polls, with speck run on or off, and the run switch's requests answered here and counted.
const stub = run => `(() => {
  let RUN = ${JSON.stringify(run)};
  window.runCalls = [];
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(Object.assign(${JSON.stringify(state(null))}, RUN ? { run: RUN } : {}));
    const m = u.match(/^\\/api\\/run\\/(on|off)$/);
    if (m) { window.runCalls.push(m[1]); RUN = m[1] === 'on' ? { on: true, pid: 9 } : null; return json({ ok: true, run: RUN || { on: false, pid: null } }); }
    return real(url, opts);
  };
})();`;

async function withPage(run, width, fn) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(run) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !document.getElementById('run').hidden && /Auto-build/.test(document.getElementById('run').textContent)`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const box = sel => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, mid: r.top + r.height / 2 }; })()`;
const LINES = sel => `(() => {
  const n = document.querySelector(${JSON.stringify(sel)}), range = document.createRange();
  range.selectNodeContents(n);
  const rects = [...range.getClientRects()].filter(r => r.width && r.height).sort((a, b) => a.top - b.top);
  let lines = 0, bottom = -Infinity;
  for (const r of rects) if (r.top >= bottom - 1) { lines++; bottom = r.bottom; } else bottom = Math.max(bottom, r.bottom);
  return lines;
})()`;
const PARTS = { logo: 'header .logo', repo: 'header .repo', run: '#run', theme: '#theme' };
const boxes = async b => Object.fromEntries(await Promise.all(Object.entries(PARTS).map(async ([k, sel]) => [k, await b.js(box(sel))])));
const press = async (b, key, code, keyCode) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, ...(key === 'Enter' ? { text: '\r' } : { text: ' ' }) });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
};

test('0150 AC2: pressing Enter or Space on the focused button starts or pauses speck run, and it keeps focus through refreshes', skip, async () => {
  await withPage(null, 1280, async b => {
    await b.js(`document.getElementById('run').focus()`);
    // Two refreshes later it's still the focused element, so a key press reaches it.
    await b.js(`window.seen = document.getElementById('run').firstChild`);
    await b.until(`document.getElementById('run').firstChild !== window.seen`, 'a refresh');
    assert.equal(await b.js(`document.activeElement === document.getElementById('run')`), true, 'still focused after a refresh');
    await press(b, 'Enter', 'Enter', 13);
    await b.until(`window.runCalls.length === 1 && document.getElementById('run').textContent === 'Auto-build on'`, 'Enter to start it');
    assert.deepEqual(await b.js('window.runCalls'), ['on']);
    assert.equal(await b.js(`document.getElementById('run').getAttribute('aria-pressed')`), 'true');
    await b.until(`!document.getElementById('run').disabled`, 'the request to finish');
    await b.js(`document.getElementById('run').focus()`);
    await press(b, ' ', 'Space', 32);
    await b.until(`window.runCalls.length === 2 && document.getElementById('run').textContent === 'Auto-build off'`, 'Space to pause it');
    assert.deepEqual(await b.js('window.runCalls'), ['on', 'off']);
  });
});

// 0163: the builder took the square's place, and the label alone says whether it's on or off.
test('0150 AC2: on or off, the button shows the builder rather than a square', skip, async () => {
  const shown = `!document.querySelector('#run .live') && document.querySelector('#run canvas.mini').getBoundingClientRect().width > 0`;
  await withPage({ on: true, pid: 7 }, 1280, async b => assert.equal(await b.js(shown), true));
  await withPage(null, 1280, async b => assert.equal(await b.js(shown), true));
});

for (const width of [700, 1280]) {
  test(`0150 AC3: at ${width} px, the header is one row, centred vertically: speck on the left, then the project, Auto-build and light/dark on the right`, skip, async () => {
    await withPage(null, width, async b => {
      const x = await boxes(b);
      const h = await b.js(box('header'));
      for (const k of ['repo', 'run', 'theme']) assert.ok(Math.abs(x[k].mid - x.logo.mid) <= 1, `${k} is centred on the same line as speck: ${JSON.stringify(x)}`);
      assert.ok(x.logo.right < x.repo.left && x.repo.right < x.run.left && x.run.right < x.theme.left, `in order, left to right: ${JSON.stringify(x)}`);
      assert.ok(x.repo.left - x.logo.right > 40, 'the project sits on the right, away from speck');
      assert.ok(h.right - x.theme.right <= 32, 'light/dark is at the right edge');
      for (const k of Object.keys(PARTS)) assert.equal(await b.js(LINES(PARTS[k])), 1, `${k} is on one line`);
    });
  });
}

for (const run of [null, { on: true, pid: 7 }]) {
  test(`0150 AC4: at 375 px with Auto-build ${run ? 'on' : 'off'}, the header is two rows: speck and the project, then Auto-build and light/dark`, skip, async () => {
    await withPage(run, 375, async b => {
      const x = await boxes(b);
      const W = await b.js('document.documentElement.clientWidth');
      assert.ok(Math.abs(x.repo.mid - x.logo.mid) <= 1, `speck and the project share the first row: ${JSON.stringify(x)}`);
      assert.ok(Math.abs(x.theme.mid - x.run.mid) <= 1, `Auto-build and light/dark share the second row: ${JSON.stringify(x)}`);
      assert.ok(x.run.top >= Math.max(x.logo.bottom, x.repo.bottom), 'the second row is below the first');
      assert.ok(x.logo.right < x.repo.left, 'speck on the left, the project on the right');
      assert.ok(x.run.right < x.theme.left, 'Auto-build on the left, light/dark on the right');
      assert.ok(Math.abs(x.repo.right - x.theme.right) <= 1, 'the project and light/dark both end at the right edge');
      assert.ok(Math.abs(x.logo.left - x.run.left) <= 1, 'speck and Auto-build both start at the left edge');
      for (const k of Object.keys(PARTS)) {
        assert.ok(x[k].left >= 0 && x[k].right <= W + 0.5, `${k} is on screen`);
        if (k !== 'theme') assert.equal(await b.js(LINES(PARTS[k])), 1, `${k} is on one line`);
      }
      assert.ok(await b.js('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), 'nothing overflows the screen');
      assert.ok(x.run.height >= 44 && x.theme.height >= 44, `every header button is at least 44 px tall: ${JSON.stringify(x)}`);
    });
  });
}

for (const width of [375, 699, 700, 1000, 1280]) {
  test(`0150 AC5: at ${width} px, Auto-build and light/dark are the same height with their tops lined up`, skip, async () => {
    await withPage(null, width, async b => {
      const x = await boxes(b);
      assert.ok(Math.abs(x.run.height - x.theme.height) <= 0.5, `the same height: ${x.run.height} and ${x.theme.height}`);
      assert.ok(Math.abs(x.run.top - x.theme.top) <= 0.5, `tops line up: ${x.run.top} and ${x.theme.top}`);
    });
  });
}

for (const width of [375, 700]) {
  test(`0150 AC3-AC4: at ${width} px, a long project name is cut short on one line rather than wrapping or pushing the buttons off screen`, skip, async () => {
    await withPage(null, width, async b => {
      await b.js(`document.querySelector('header .repo code').textContent = 'a-very-long-project-folder-name-that-goes-on-and-on-and-on-and-on'`);
      const x = await boxes(b);
      const W = await b.js('document.documentElement.clientWidth');
      for (const k of Object.keys(PARTS)) {
        assert.ok(x[k].left >= 0 && x[k].right <= W + 0.5, `${k} is on screen: ${JSON.stringify(x)}`);
        if (k !== 'theme') assert.equal(await b.js(LINES(PARTS[k])), 1, `${k} is on one line`);
      }
      assert.ok(Math.abs(x.repo.mid - x.logo.mid) <= 1, 'the project stays on the first row');
      assert.ok(await b.js('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), 'nothing overflows the screen');
    });
  });
}
