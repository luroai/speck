import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchPage, deferred, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0150: tidy the panel header ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const state = run => ({ tickets: [], ideas: [], resume_command: '', ...(run ? { run } : {}) });
const header = () => page().match(/<header>([\s\S]*?)<\/header>/)[1];
// 0285: the header button shows the Foreman now, and the Auto-build switch is in the Settings view's Foreman group.
const headerOf = p => p.byId('run');
const runOf = p => p.runSwitch();
const dotOf = p => p.all(headerOf(p)).find(n => /\bmini\b/.test(n.className || '') || n.tagName === 'canvas'); // 0163: the builder in place of the square
const ON = 'Pause Auto-build: ready tickets wait';
const OFF = 'Start Auto-build: build ready tickets';

test('0150 AC1: the header has no live, connecting… or disconnected indicator', async () => {
  const h = header();
  assert.doesNotMatch(h, /id="pills"/);
  assert.doesNotMatch(h, /connecting…|disconnected|\blive ·/);
  const p = switchPage([state(null), new Error('down'), state(null)]);
  await p.settle();
  assert.equal(p.byId('pills').children.length, 0, 'nothing is put in a connection indicator');
  assert.doesNotMatch(headerOf(p).textContent, /live|disconnected/);
});

test('0150 AC1: when the panel can\'t reach its server, the banner under the header still says so, and it goes when it\'s back', async () => {
  const p = switchPage([state(null), new Error('down'), state(null)]);
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
  assert.match(h, /<button class="glass" id="run" type="button"/); // 0413: speck's screen
  assert.doesNotMatch(h, /id="run-switch"/);
  for (const run of [null, { on: true, pid: 7 }]) {
    const p = switchPage([state(run)]);
    await p.settle();
    assert.doesNotMatch(headerOf(p).textContent, /ready tickets wait|Pause|Start/);
    assert.equal(p.all(headerOf(p)).filter(n => n.tagName === 'button').length, 0, 'no button inside it');
    assert.equal(p.byId('run-switch').children.length, 0, 'nothing is put in a separate switch');
  }
});

test('0150 AC2: on, it reads "Auto-build on" with a green square, aria-pressed true and a tooltip saying a click pauses it', async () => {
  const p = switchPage([state({ on: true, pid: 7 })]);
  await p.settle();
  assert.equal(headerOf(p).hidden, false);
  assert.equal(runOf(p).textContent, 'On');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.equal(runOf(p).attrs['aria-checked'], 'true');
  assert.equal(runOf(p).title, ON);
  assert.equal(runOf(p).disabled, false);
});

test('0150 AC2: off, it reads "Auto-build off" with a red square, aria-pressed false and a tooltip saying a click starts it', async () => {
  const p = switchPage([state(null)]);
  await p.settle();
  assert.equal(runOf(p).textContent, 'Off');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.equal(runOf(p).attrs['aria-checked'], 'false');
  assert.equal(runOf(p).title, OFF);
});

test('0150 AC2: clicking it starts or pauses speck run as Start and Pause did, with the token', async () => {
  const p = switchPage([state(null), { ok: true, run: { on: true, pid: 9 } }, { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.ok(p.calls.at(-1).opts.headers['X-Speck-Token'] !== undefined, 'sends the token');
  assert.equal(runOf(p).textContent, 'On');
  assert.equal(runOf(p).attrs['aria-checked'], 'true');
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(runOf(p).textContent, 'Off');
  assert.equal(runOf(p).attrs['aria-checked'], 'false');
});

test('0150 AC2: while a request is pending it reads "Starting…" or "Pausing…" and can\'t be clicked', async () => {
  for (const [run, label, url] of [[null, 'Starting…', '/api/run/on'], [{ on: true, pid: 7 }, 'Pausing…', '/api/run/off']]) {
    const answer = deferred();
    const p = switchPage([state(run), answer]);
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
  const p = switchPage([state(null), { status: 409, body: { error: 'speck run is already running.' } }]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.byId('run-error').hidden, false);
  assert.equal(p.byId('run-error').textContent, 'speck run is already running.');
  assert.equal(runOf(p).textContent, 'Off');
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
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run canvas')`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const press = async (b, key, code, keyCode) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, ...(key === 'Enter' ? { text: '\r' } : { text: ' ' }) });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
};

// 0285: the switch is in the Settings view's Foreman group now.
test('0150 AC2: pressing Enter or Space on the focused button starts or pauses speck run, and it keeps focus through refreshes', skip, async () => {
  await withPage(null, 1280, async b => {
    await b.js(`document.getElementById('settings-open').click()`);
    await b.until(`document.getElementById('run-switch') && !/Loading the settings/.test(document.getElementById('settings').textContent)`, 'the Settings view');
    await b.js(`document.getElementById('run-switch').focus()`);
    // Two refreshes later it's still the focused element, so a key press reaches it.
    await b.js(`window.drawn = 0; new MutationObserver(() => window.drawn++).observe(document.getElementById('bezel'), { attributes: true }); true`); // 0413: each redraw sets speck's screen's frame
    await b.until(`window.drawn > 0`, 'a refresh');
    assert.equal(await b.js(`document.activeElement === document.getElementById('run-switch')`), true, 'still focused after a refresh');
    await press(b, 'Enter', 'Enter', 13);
    await b.until(`window.runCalls.length === 1 && document.getElementById('run-switch').textContent === 'On'`, 'Enter to start it');
    assert.deepEqual(await b.js('window.runCalls'), ['on']);
    assert.equal(await b.js(`document.getElementById('run-switch').getAttribute('aria-checked')`), 'true');
    await b.until(`!document.getElementById('run-switch').disabled`, 'the request to finish');
    await b.js(`document.getElementById('run-switch').focus()`);
    await press(b, ' ', 'Space', 32);
    await b.until(`window.runCalls.length === 2 && document.getElementById('run-switch').textContent === 'Off'`, 'Space to pause it');
    assert.deepEqual(await b.js('window.runCalls'), ['on', 'off']);
  });
});

// 0413: the header row these checked, with the Foreman's word beside Settings, is now speck's screen in its frame
// (panel-0413.test.mjs).
